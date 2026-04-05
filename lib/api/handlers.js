/**
 * lib/api/handlers.js
 * All API handler logic consolidated from /api/*.js.
 * Each handler is exported as a named async function and called by api/index.js.
 */

'use strict';

import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Question-generation system prompts (generate handler)
import { MCQ_SYSTEM_PROMPT }          from './prompts/mcq.js';
import { SHORT_ANS_SYSTEM_PROMPT }    from './prompts/short-ans.js';
import { WORD_PROBLEM_SYSTEM_PROMPT } from './prompts/word-problem.js';
import { OPEN_ENDED_SYSTEM_PROMPT }   from './prompts/open-ended.js';
import { CLOZE_SYSTEM_PROMPT }        from './prompts/cloze.js';
import { EDITING_SYSTEM_PROMPT }      from './prompts/editing.js';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end',  ()    => resolve(body));
    req.on('error', err  => reject(err));
  });
}

async function fetchWithRetry(url, options, maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    
    // FIX: Limit wait time so Vercel doesn't hit the 10-second timeout and return HTML 500s
    if (response.status === 503 || response.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }
    return response;
  }
  throw new Error('The AI service is experiencing high demand. Please try again.');
}

async function callGemini(prompt, { temperature = 0.1, maxOutputTokens = 1024, responseMimeType } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens },
  };
  
  if (responseMimeType) {
    payload.generationConfig.responseMimeType = responseMimeType;
  }

  // FIX: Reverted to public Gemini model. Private Canvas preview models cause 404s on external servers.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  const res = await fetchWithRetry(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty content');
  return text;
}

async function callClaudeRaw(systemPrompt, userPrompt, { maxTokens = 1024 } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('[https://api.anthropic.com/v1/messages](https://api.anthropic.com/v1/messages)', {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'x-api-key':       apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:     'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system:    systemPrompt,
      messages:  [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Claude returned empty content');
  return text;
}

/** * Bulletproof Markdown Stripper (Regex-free)
 * Dynamically constructs markdown fences using char codes to prevent parser breakage.
 */
function stripMarkdownFences(text) {
  if (!text) return '';
  let cleaned = text.trim();
  const fence = String.fromCharCode(96, 96, 96); // Safe way to write backticks
  
  if (cleaned.startsWith(fence + 'json')) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith(fence + 'html')) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith(fence)) cleaned = cleaned.substring(3);
  
  if (cleaned.endsWith(fence)) cleaned = cleaned.substring(0, cleaned.length - 3);
  return cleaned.trim();
}

function parseJsonArray(text) {
  const cleaned = stripMarkdownFences(text);
  const parsed  = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('AI response is not a JSON array');
  return parsed;
}

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token     = authHeader.slice(7);
  const anonClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: { user }, error } = await anonClient.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function resolveStudentId(adminDb, userId) {
  const { data, error } = await adminDb.from('students').select('id').eq('parent_id', userId).order('created_at', { ascending: true }).limit(1).single();
  if (error || !data) return userId;
  return data.id;
}

function sanitise(value, fallback) { return (value === undefined || value === null) ? fallback : value; }

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: /api/chat
// ─────────────────────────────────────────────────────────────────────────────

const OMNI_TUTOR_SYSTEM_PROMPT = `You are Miss Wena, a premium Singaporean MOE-aligned Omni-Tutor on Superholic Lab.
You are a warm, highly capable AI tutor who seamlessly handles Mathematics, Science, and English for P1-S4 students.

TEACHING PHILOSOPHY & RULES:
1. Socratic Method: Never give the direct answer first. Ask guiding questions (e.g., "What do you think happens if...").
2. Growth Mindset: Use encouraging language ("not yet mastered", "building towards"). Celebrate specific small wins.
3. MOE Alignment: Use exact Singapore syllabus terminology (e.g., CER for Science, CRA/Bar Models for Maths, Grammar Rules for English).
4. Visual Analysis: If the student shares a drawing or image of their working, analyze it carefully to spot exactly where their logic broke down. Point out their specific mistake gently and guide them to the next step.
5. Formatting: Use **bold** text for key MOE terminology or emphasis. Use fractions in a simple 1/2 format.
6. Tone: Warm, cheerful, using very light Singlish ("lah", "lor") occasionally to sound natural.`;

const MAX_HISTORY_MESSAGES = 20;

export async function handleChat(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GEMINI_API_KEY) {
    console.error('[chat] GEMINI_API_KEY is not set');
    return res.status(500).json({ error: 'AI tutor is not configured. Please contact support.' });
  }

  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array' });
  }

  const cleanHistory = messages
    .filter(m => (m.role === 'user' || m.role === 'assistant'))
    .slice(-MAX_HISTORY_MESSAGES)
    .map(m => {
      const parts = [];
      if (m.content) parts.push({ text: m.content });
      if (m.image) {
        const b64 = m.image.split(',')[1];
        if (b64) parts.push({ inlineData: { mimeType: "image/png", data: b64 } });
      }
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: parts.length > 0 ? parts : [{ text: '' }]
      };
    });

  if (cleanHistory.length === 0 || cleanHistory[0].role !== 'user') {
    return res.status(400).json({ error: 'First message must be from the user' });
  }

  try {
    const payload = {
      systemInstruction: { parts: [{ text: OMNI_TUTOR_SYSTEM_PROMPT }] },
      contents: cleanHistory,
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
    };

    // FIX: Reverted to public Gemini model.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Gemini ${response.status}: ${await response.text()}`);
    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!reply) throw new Error('Gemini returned empty content');

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('[chat] Gemini error:', err?.message || err);
    return res.status(500).json({ error: 'The AI tutor is temporarily unavailable. Please try again in a moment.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: /api/summarize-chat (STUDY NOTES ENGINE)
// Transforms a raw chat history into a saved 2-way study note via Gemini.
// ─────────────────────────────────────────────────────────────────────────────

const SUMMARIZE_SYSTEM_PROMPT = `You are Miss Wena, a Singapore MOE tutor. Transform the following student-tutor chat log into a structured, professional "2-Way Study Note" for the student to review later.

STRUCTURE REQUIREMENTS:
1. Core Question/Problem: Briefly state what the student was trying to solve.
2. Underlying Concept: Name the exact MOE-aligned concept (e.g., Fractions, CER framework, Subject-Verb Agreement).
3. Step-by-Step Breakdown: Map out the logic and steps you discussed clearly.
4. Miss Wena's Key Takeaway: A final encouraging tip to remember for the exams.

HTML FORMATTING RULES:
- Return ONLY valid HTML. Do NOT wrap the response in markdown fences.
- Use <h3> for section headers, <p> for text, <ul> and <li> for lists.
- Use <strong> to highlight keywords.
- Keep it clean, readable, and visually engaging for a primary/secondary school student.`;

export async function handleSummarizeChat(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorised — please log in' });

    const { student_id, subject, topic, messages } = req.body || {};
    if (!student_id || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const adminDb = getAdminClient();

    // Convert history array into a readable transcript for Gemini
    const chatLog = messages
      .filter(m => m.content)
      .map(m => `${m.role === 'assistant' ? 'Miss Wena' : 'Student'}: ${m.content}`)
      .join('\n\n');

    // 1. Generate the HTML Study Note
    const rawHtml = await callGemini(`${SUMMARIZE_SYSTEM_PROMPT}\n\nCHAT LOG:\n${chatLog}`, {
      temperature: 0.3,
      maxOutputTokens: 1500,
    });
    
    // 2. Safe string manipulation (No regex syntax that breaks Vercel builds)
    let cleanHtml = rawHtml.trim();
    if (cleanHtml.startsWith('```html')) cleanHtml = cleanHtml.substring(7);
    if (cleanHtml.startsWith('```')) cleanHtml = cleanHtml.substring(3);
    if (cleanHtml.endsWith('```')) cleanHtml = cleanHtml.substring(0, cleanHtml.length - 3);
    cleanHtml = cleanHtml.trim();

    // 3. Generate a smart title
    const titlePrompt = `Write a short 3-6 word title for this study note based on this content:\n${cleanHtml}`;
    const rawTitle = await callGemini(titlePrompt, { temperature: 0.3 });
    
    let cleanTitle = rawTitle.trim().replace(/["']/g, '');
    if (cleanTitle.startsWith('```text')) cleanTitle = cleanTitle.substring(7);
    if (cleanTitle.startsWith('```')) cleanTitle = cleanTitle.substring(3);
    if (cleanTitle.endsWith('```')) cleanTitle = cleanTitle.substring(0, cleanTitle.length - 3);
    cleanTitle = cleanTitle.trim();

    // 4. Save securely to the database
    const { error: dbErr } = await adminDb.from('study_notes').insert({
      student_id,
      subject: subject || 'general',
      topic: topic || 'mixed',
      title: cleanTitle,
      content_html: cleanHtml,
      is_read: false
    });

    if (dbErr) throw dbErr;
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[summarize-chat] Error:', err.message);
    return res.status(500).json({ error: 'Failed to generate and save the study note.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: /api/checkout
// ─────────────────────────────────────────────────────────────────────────────

const STRIPE_PRICES = {
  monthly: {
    single_subject: 'price_1TGgUCL7IdGWGv1ueyWiypLB',
    all_subjects:   'price_1TGgVFL7IdGWGv1uWmlFZMNz',
    family:         'price_1TGgVuL7IdGWGv1uYENqStUl',
  },
  annual: {
    single_subject: 'price_1TGgX9L7IdGWGv1ukjF3MjIc',
    all_subjects:   'price_1TGgXgL7IdGWGv1uM8vyCKks',
    family:         'price_1TGgYML7IdGWGv1uXGyHKZXm',
  },
};

const PRICE_TO_PLAN = Object.fromEntries(
  Object.values(STRIPE_PRICES).flatMap(plans =>
    Object.entries(plans).map(([planName, priceId]) => [priceId, planName])
  )
);

function getCheckoutPriceId(plan, billing) {
  return (STRIPE_PRICES[billing] || STRIPE_PRICES.monthly)[plan] || null;
}

export async function handleCheckout(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[checkout] STRIPE_SECRET_KEY is not set');
    return res.status(500).json({ error: 'Checkout is not configured. Please contact support.' });
  }

  const { plan, userId, email, billing } = req.body || {};
  if (!plan || !userId) return res.status(400).json({ error: 'plan and userId are required' });

  const billingCycle = billing === 'annual' ? 'annual' : 'monthly';
  const priceId      = getCheckoutPriceId(plan, billingCycle);
  if (!priceId) return res.status(400).json({ error: `Unknown plan or missing price ID: ${plan} (${billingCycle})` });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '[https://www.superholiclab.com](https://www.superholiclab.com)';

  try {
    const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
    const session = await stripe.checkout.sessions.create({
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items:           [{ price: priceId, quantity: 1 }],
      client_reference_id:  userId,
      ...(email ? { customer_email: email } : {}),
      success_url:  `${appUrl}/pages/dashboard.html?checkout=success&plan=${plan}`,
      cancel_url:   `${appUrl}/pages/pricing.html`,
      subscription_data: { metadata: { supabase_user_id: userId, plan } },
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[checkout] Stripe error:', err?.message || err);
    return res.status(500).json({ error: 'Could not create checkout session. Please try again.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: /api/webhook
// ─────────────────────────────────────────────────────────────────────────────

function webhookPlanFromPriceId(priceId) {
  return PRICE_TO_PLAN[priceId] || null;
}

function maxChildrenForPlan(plan) { return plan === 'family' ? 3 : 1; }

export async function handleWebhook(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  const db     = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const rawBody = await getRawBody(req);
  const sig     = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature invalid: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId  = session.client_reference_id;
        if (!userId) { console.warn('[webhook] No client_reference_id on session'); break; }
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const priceId  = subscription.items.data[0]?.price?.id;
        const planName = webhookPlanFromPriceId(priceId);
        if (!planName) { console.warn('[webhook] Unknown price ID:', priceId); break; }
        await db.from('subscriptions').upsert({ profile_id: userId, stripe_subscription_id: subscription.id, stripe_price_id: priceId, plan_name: planName, status: subscription.status, current_period_start: new Date(subscription.current_period_start * 1000).toISOString(), current_period_end: new Date(subscription.current_period_end * 1000).toISOString() }, { onConflict: 'stripe_subscription_id' });
        await db.from('profiles').update({ subscription_tier: planName, max_children: maxChildrenForPlan(planName), stripe_customer_id: session.customer }).eq('id', userId);
        console.log(`[webhook] Subscription activated: ${planName} for user ${userId}`);
        break;
      }
      case 'customer.subscription.updated': {
        const sub     = event.data.object;
        const priceId = sub.items.data[0]?.price?.id;
        const plan    = webhookPlanFromPriceId(priceId);
        await db.from('subscriptions').update({ status: sub.status, plan_name: plan || undefined, stripe_price_id: priceId || undefined, current_period_start: new Date(sub.current_period_start * 1000).toISOString(), current_period_end: new Date(sub.current_period_end * 1000).toISOString() }).eq('stripe_subscription_id', sub.id);
        if (plan) {
          const userId = sub.metadata?.supabase_user_id;
          if (userId) await db.from('profiles').update({ subscription_tier: plan, max_children: maxChildrenForPlan(plan) }).eq('id', userId);
        }
        console.log(`[webhook] Subscription updated: ${sub.id} → ${sub.status}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub    = event.data.object;
        await db.from('subscriptions').update({ status: 'cancelled' }).eq('stripe_subscription_id', sub.id);
        const userId = sub.metadata?.supabase_user_id;
        if (userId) await db.from('profiles').update({ subscription_tier: 'trial', max_children: 1 }).eq('id', userId);
        console.log(`[webhook] Subscription cancelled: ${sub.id}`);
        break;
      }
      default: break;
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhook] Handler error:', err?.message || err);
    return res.status(200).json({ received: true, warning: 'Handler error logged' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: /api/generate
// ─────────────────────────────────────────────────────────────────────────────

function buildGenerateUserPrompt(type, count, subject, level, topic, difficulty) {
  const base = `Generate ${count} ${type.replace('_', '-')} question${count > 1 ? 's' : ''} for the following specification:\n\nSubject: ${subject}\nLevel: ${level}\nTopic: ${topic}\nDifficulty: ${difficulty}\n\nRequirements:\n- All content must be strictly aligned to the MOE Singapore ${level} ${subject} syllabus.\n- Use Singapore names, settings, and culturally relevant scenarios throughout.\n- Ensure varied sub-topics within this topic — do not repeat the same scenario type.`;

  const extras = {
    mcq:          `\n- Each question must have exactly 4 options (A, B, C, D).\n- Wrong-answer explanations must name the specific misconception by name.\n- Worked solution must show full step-by-step working.\n- Include an examiner_note for each question.`,
    short_ans:    `\n- Answers must be concise (a number, expression, or short phrase).\n- Include accept_also for equivalent correct forms.\n- Worked solution must show full step-by-step working.`,
    word_problem: `\n- Each word problem must have 2–3 parts with a coherent narrative.\n- Show full step-by-step working and marking scheme per part.\n- Include an examiner_note about PSLE method marks.`,
    open_ended:   `\n- Write the model answer in complete paragraph form as a student would.\n- List all essential keywords the student must include.\n- Provide a clear 2/1/0 marking rubric.`,
    cloze:        `\n- Each passage must be 5–8 sentences with 7–10 blanks.\n- Each blank tests a different grammar point.\n- "correct_answer" must be the exact word as a string, NOT a letter (e.g., "went" not "A").\n- Provide 4 MCQ options per blank including the correct answer.`,
    editing:      `\n- Each passage must have exactly 5 underlined words (one per line).\n- The errors must cover at least 4 different grammar categories.\n- Each line object needs: line_number, text, underlined_word, has_error, correct_word, explanation.`,
  };

  return base + (extras[type] || '') + `\n\nReturn a valid JSON array of ${count} question object${count > 1 ? 's' : ''}.`;
}

export async function handleGenerate(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  const GENERATE_PROMPTS = {
    mcq:          MCQ_SYSTEM_PROMPT,
    short_ans:    SHORT_ANS_SYSTEM_PROMPT,
    word_problem: WORD_PROBLEM_SYSTEM_PROMPT,
    open_ended:   OPEN_ENDED_SYSTEM_PROMPT,
    cloze:        CLOZE_SYSTEM_PROMPT,
    editing:      EDITING_SYSTEM_PROMPT,
  };

  const GENERATE_MAX_COUNT = { mcq: 10, short_ans: 10, word_problem: 5, open_ended: 10, cloze: 3, editing: 3 };

  const { subject, level, topic, difficulty, count, type } = req.body || {};

  if (!subject || !level || !topic) {
    return res.status(400).json({ error: 'Missing required fields: subject, level, and topic are all required.' });
  }

  const questionType = (type || 'mcq').toLowerCase().trim();
  if (!GENERATE_PROMPTS[questionType]) {
    return res.status(400).json({ error: `Invalid type '${questionType}'. Valid types: ${Object.keys(GENERATE_PROMPTS).join(', ')}.` });
  }

  const maxCount      = GENERATE_MAX_COUNT[questionType] || 10;
  const questionCount = Math.min(parseInt(count, 10) || 3, maxCount);
  const questionDiff  = difficulty || 'Standard';

  const client     = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const systemPrompt = GENERATE_PROMPTS[questionType];
  const userPrompt   = buildGenerateUserPrompt(questionType, questionCount, subject, level, topic, questionDiff);

  try {
    // FIXED: Replaced invalid 'claude-sonnet-4-6' with official identifier
    const message    = await client.messages.create({ 
      model: 'claude-3-5-sonnet-20241022', 
      max_tokens: 8192, 
      system: systemPrompt, 
      messages: [{ role: 'user', content: userPrompt }] 
    });
    const rawContent = message.content[0].text.trim();
    const questions  = parseJsonArray(rawContent);
    if (!Array.isArray(questions)) throw new Error('API returned a non-array response.');
    return res.status(200).json(questions);
  } catch (err) {
    console.error('[generate] Question generation error:', err.message);
    return res.status(500).json({ error: 'Failed to generate questions. Please try again.', detail: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: /api/generate-question
// ─────────────────────────────────────────────────────────────────────────────

const GQ_SAFETY_PROMPT = `You are a question generator for Superholic Lab, a Singapore primary school learning platform. You generate MOE-aligned practice questions for students aged 9–12. You must ONLY generate educational content aligned to the Singapore primary school syllabus. Never generate inappropriate content.`;

function buildGQSchemaInstructions(subject, level, topic, type, difficulty, count) {
  const base = `\nGenerate exactly ${count} ${subject} question(s) for ${level} students on the topic "${topic}".\nDifficulty: ${difficulty}. Use Singapore names, food, and places for context.\nUse British English spelling throughout.\n\nReturn ONLY a valid JSON array. No markdown, no explanation, just the JSON array.\n\nEach question must have these fields:\n- id: string in format "${level.toLowerCase().replace(/ /g, '-')}-${subject.toLowerCase().slice(0,4)}-${topic.toLowerCase().replace(/ /g, '-').slice(0,6)}-ai-001" (increment for each)\n- subject: "${subject}"\n- level: "${level}"\n- topic: "${topic}"\n- sub_topic: string (specific aspect of the topic)\n- difficulty: "${difficulty}"\n- type: "${type}"\n- marks: number (1-4)\n- question_text: string\n- worked_solution: string (minimum 3 numbered steps)\n`;

  const schemas = {
    mcq:          `\nAdditional fields for MCQ:\n- options: array of exactly 4 strings (full sentences)\n- correct_answer: "A", "B", "C", or "D"\n- wrong_explanations: object with keys for each wrong option, each explaining the misconception\n`,
    short_ans:    `\nAdditional fields for short_ans:\n- correct_answer: string (the answer)\n- accept_also: array of alternative acceptable forms (e.g. with units)\n`,
    word_problem: `\nAdditional fields for word_problem:\n- parts: array of at least 2 parts, each with: label ("(a)", "(b)"), question, marks, correct_answer, worked_solution\n`,
    open_ended:   `\nAdditional fields for open_ended (Science only):\n- keywords: array of 3-5 mark-bearing terms\n- model_answer: string following Claim-Evidence-Reasoning structure\n`,
    cloze:        `\nAdditional fields for cloze:\n- passage: string with blanks marked as [1], [2], [3] etc.\n- blanks: array of objects, each with: number, options (4 strings), correct_answer (A/B/C/D), explanation\n`,
    editing:      `\nAdditional fields for editing:\n- passage_lines: array of 3 line objects. Exactly 1 line must have has_error: true.\n  Each line: { line_number, text, underlined_word, has_error, correct_word (null if no error), explanation (null if no error) }\n`,
  };

  return base + (schemas[type] || '');
}

function validateGQQuestion(q) {
  const required = ['id', 'subject', 'level', 'topic', 'type', 'difficulty', 'marks', 'question_text', 'worked_solution'];
  for (const field of required) {
    if (q[field] === undefined || q[field] === null) throw new Error(`Generated question missing required field: ${field}`);
  }
  return true;
}

export async function handleGenerateQuestion(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { subject, level, topic, type, difficulty, count } = req.body || {};

    if (!subject || !level || !topic || !type || !difficulty || !count) {
      return res.status(400).json({ error: 'Missing required fields: subject, level, topic, type, difficulty, count' });
    }

    const validSubjects = ['Mathematics', 'Science', 'English'];
    const validTypes    = ['mcq', 'short_ans', 'word_problem', 'open_ended', 'cloze', 'editing'];
    const validDiffs    = ['Foundation', 'Standard', 'Advanced', 'HOTS'];

    if (!validSubjects.includes(subject)) return res.status(400).json({ error: 'Invalid subject' });
    if (!validTypes.includes(type))       return res.status(400).json({ error: 'Invalid type' });
    if (!validDiffs.includes(difficulty)) return res.status(400).json({ error: 'Invalid difficulty' });

    const safeCount = Math.min(Math.max(1, parseInt(count, 10) || 1), 5);
    const prompt    = GQ_SAFETY_PROMPT + '\n\n' + buildGQSchemaInstructions(subject, level, topic, type, difficulty, safeCount);

    let responseText;
    let provider = 'gemini';

    try {
      responseText = await callGemini(prompt, { temperature: 0.4, maxOutputTokens: 4096 });
    } catch (geminiErr) {
      console.warn('[generate-question] Gemini failed, falling back to Claude:', geminiErr.message);
      provider     = 'claude';
      responseText = await callClaudeRaw(GQ_SAFETY_PROMPT, buildGQSchemaInstructions(subject, level, topic, type, difficulty, safeCount), { maxTokens: 4096 });
    }

    const questions = parseJsonArray(responseText);
    const validated = questions
      .filter(q => { try { return validateGQQuestion(q); } catch { return false; } })
      .map(q => ({ ...q, source: 'ai', aiProvider: provider }));

    if (validated.length === 0) return res.status(500).json({ error: 'AI returned no valid questions' });
    return res.status(200).json({ questions: validated, provider });

  } catch (err) {
    console.error('[generate-question] Error:', err.message);
    return res.status(500).json({ error: 'Failed to generate questions. Please try again.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: /api/grade-answer
// ─────────────────────────────────────────────────────────────────────────────

const GRADER_SYSTEM_PROMPT = `You are an experienced Singapore primary school examiner grading student answers for PSLE-style assessments. Your role is to award marks fairly based on the official marking rubric provided. Be strict but fair.

MARKING PRINCIPLES:
1. Award marks for demonstrated understanding, not just memorisation of exact words
2. Accept sensible alternatives to the model answer if the concept is correct
3. Deduct marks for clearly incorrect statements, even if surrounded by correct ones
4. For Science: check Claim, Evidence, and Reasoning are all present for full marks
5. For Mathematics: check that the correct method is shown, even if arithmetic slips
6. Always return valid JSON — no markdown, no explanation outside the JSON

You MUST return ONLY a JSON object with this exact structure:
{
  "score": <number, can be decimal like 1.5>,
  "maxScore": <number>,
  "feedback": "<one paragraph of constructive feedback for the student>",
  "breakdown": [
    { "aspect": "<criterion name>", "earned": <number>, "possible": <number>, "note": "<brief note>" }
  ]
}`;

function buildGradingRubric(questionType, subject, studentAnswer, question) {
  const { questionText, workedSolution, keywords, modelAnswer, parts, marks } = question;

  if (questionType === 'open_ended' && subject === 'Science') {
    return `\nQUESTION (${marks} marks): ${questionText}\n\nKEYWORDS TO CHECK (1 mark each cluster): ${(keywords || []).join(', ')}\n\nMODEL ANSWER: ${modelAnswer || 'Not provided — use keywords and worked solution as guide.'}\n\nWORKED SOLUTION: ${workedSolution}\n\nSTUDENT ANSWER: ${studentAnswer}\n\nRUBRIC — Science Open-Ended (CER Framework):\n- Claim (1 mark): Student states a clear, direct answer to the question\n- Evidence (1 mark): Student references an observable fact or given information\n- Reasoning (1+ mark): Student names the scientific principle and explains the mechanism\n- Use of keywords: Award 0.5 marks for each cluster of keywords correctly used in context\n- Total marks available: ${marks}\n\nMARKING INSTRUCTIONS:\nIf the student uses the correct scientific concept but wrong vocabulary, award partial marks.\nIf the student has the right answer but no reasoning, deduct reasoning marks.\nDo not penalise for spelling errors if the meaning is clear.`;
  }

  if (questionType === 'word_problem' && subject === 'Mathematics') {
    const partsText = (parts || []).map(p => `Part ${p.label}: "${p.question}" — correct answer: ${p.correct_answer}, worked: ${p.worked_solution}`).join('\n');
    return `\nQUESTION (${marks} marks total): ${questionText}\n\nPARTS AND CORRECT ANSWERS:\n${partsText}\n\nWORKED SOLUTION: ${workedSolution}\n\nSTUDENT ANSWER: ${studentAnswer}\n\nRUBRIC — Mathematics Word Problem:\nFor each part:\n- 1 mark for correct method/heuristic shown (bar model, working backwards, etc.)\n- 1 mark for correct final answer\n- Partial credit: if method is correct but arithmetic error → award method mark only\n- Total marks available: ${marks}\n\nMARKING INSTRUCTIONS:\nAward marks even if the student uses a different valid method.\nIf the student writes the final answer without working, award answer mark only (not method mark).\nAllow arithmetic errors of ±1 if the method is clearly correct.`;
  }

  return `\nQUESTION (${marks} marks): ${questionText}\n\nMODEL ANSWER / WORKED SOLUTION: ${workedSolution || modelAnswer || 'See keywords'}\nKEYWORDS: ${(keywords || []).join(', ')}\n\nSTUDENT ANSWER: ${studentAnswer}\n\nAward ${marks} marks based on how well the student demonstrates understanding of the key concept.\nUse the worked solution as the authoritative reference.`;
}

export async function handleGradeAnswer(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { questionId, questionType, questionText, subject, level, studentAnswer, workedSolution, keywords, modelAnswer, parts, marks } = req.body || {};

    if (!questionType || studentAnswer === undefined || !questionText) {
      return res.status(400).json({ error: 'Missing required fields: questionType, questionText, studentAnswer' });
    }
    if (!['word_problem', 'open_ended'].includes(questionType)) {
      return res.status(400).json({ error: 'questionType must be word_problem or open_ended' });
    }

    let isEmpty = false;
    if (typeof studentAnswer === 'string') {
      if (studentAnswer.trim() === '') isEmpty = true;
      if (studentAnswer.startsWith('{')) {
        try {
          const obj = JSON.parse(studentAnswer);
          const values = Object.values(obj).map(v => v.trim()).filter(v => v !== '');
          if (values.length === 0) isEmpty = true;
        } catch (e) {}
      }
    }

    if (isEmpty) {
       return res.status(200).json({ 
         questionId: questionId || 'unknown', 
         score: 0, 
         maxScore: parseInt(marks, 10) || 2, 
         feedback: 'No answer provided. Remember to show your working or write an explanation next time!', 
         breakdown: [], 
         gradedBy: 'system' 
       });
    }

    if (typeof studentAnswer !== 'string' || studentAnswer.length > 2000) {
      return res.status(400).json({ error: 'studentAnswer must be a string under 2000 characters' });
    }

    const safeMarks    = Math.min(Math.max(1, parseInt(marks, 10) || 2), 10);
    const rubricPrompt = buildGradingRubric(questionType, subject, studentAnswer, { questionText, workedSolution, keywords, modelAnswer, parts, marks: safeMarks });
    const fullPrompt   = GRADER_SYSTEM_PROMPT + '\n\n' + rubricPrompt;

    let responseText;
    let gradedBy = 'gemini';

    try {
      responseText = await callGemini(fullPrompt, { temperature: 0.1, maxOutputTokens: 1024, responseMimeType: "application/json" });
    } catch (geminiErr) {
      console.warn('[grade-answer] Gemini failed, falling back to Claude:', geminiErr.message);
      gradedBy     = 'claude';
      responseText = await callClaudeRaw(GRADER_SYSTEM_PROMPT, rubricPrompt, { maxTokens: 1024 });
    }

    const cleaned = stripMarkdownFences(responseText);
    const grading = JSON.parse(cleaned);
    if (typeof grading.score !== 'number') throw new Error('Missing score');
    if (typeof grading.maxScore !== 'number') throw new Error('Missing maxScore');

    const safeScore = Math.max(0, Math.min(grading.score, safeMarks));
    return res.status(200).json({ questionId: questionId || 'unknown', score: safeScore, maxScore: safeMarks, feedback: grading.feedback || 'Answer graded by AI.', breakdown: grading.breakdown || [], gradedBy });

  } catch (err) {
    console.error('[grade-answer] Error:', err.message);
    return res.status(200).json({ questionId: req.body?.questionId || 'unknown', score: 0, maxScore: req.body?.marks || 2, feedback: 'We could not grade this answer automatically. Please compare your answer with the worked solution.', breakdown: [], gradedBy: 'fallback' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: /api/save-exam-result
// ─────────────────────────────────────────────────────────────────────────────

export async function handleSaveExamResult(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorised — please log in' });

    const { subject, level, examType, score, totalMarks, timeTaken, questionsAttempted, examId } = req.body || {};

    if (!subject || !level || !examType) return res.status(400).json({ error: 'Missing required fields: subject, level, examType' });
    if (!['Mathematics', 'Science', 'English'].includes(subject)) return res.status(400).json({ error: 'Invalid subject' });
    if (!['WA1', 'WA2', 'EOY', 'PRELIM', 'PRACTICE', 'QUIZ'].includes(examType)) return res.status(400).json({ error: 'Invalid examType' });

    const safeScore      = Math.max(0, parseInt(sanitise(score, 0), 10));
    const safeTotalMarks = Math.max(1, parseInt(sanitise(totalMarks, 1), 10));
    const safeTimeTaken  = timeTaken ? Math.max(0, parseInt(timeTaken, 10)) : null;
    const safeQAttempted = Math.max(0, parseInt(sanitise(questionsAttempted, 0), 10));
    const safeExamId     = typeof examId === 'string' ? examId.slice(0, 64) : null;
    const cappedScore    = Math.min(safeScore, safeTotalMarks);

    const adminDb   = getAdminClient();
    const studentId = await resolveStudentId(adminDb, user.id);

    const { data, error } = await adminDb.from('exam_results').insert({ student_id: studentId, subject, level, exam_type: examType, exam_id: safeExamId, score: cappedScore, total_marks: safeTotalMarks, time_taken: safeTimeTaken, questions_attempted: safeQAttempted, completed_at: new Date().toISOString() }).select('id').single();

    if (error) {
      console.error('[save-exam-result] Supabase insert error:', error.message);
      return res.status(500).json({ error: 'Failed to save result. Please try again.' });
    }

    return res.status(200).json({ success: true, id: data.id });

  } catch (err) {
    console.error('[save-exam-result] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: /api/generate-quest
// ─────────────────────────────────────────────────────────────────────────────

const QUEST_SYSTEM_PROMPT = `You are a Singapore MOE curriculum specialist creating personalised
3-day remedial revision plans for Primary school students on Superholic Lab.

URL RULES — never deviate from these exact patterns:
- Day 1 MUST always be type "tutor": /pages/tutor.html?subject={subject}&level={level}&intent=remedial&topic={topic}
- Quiz MCQ: /pages/quiz.html?subject={subject}&level={level}&topic={topic}&type=mcq
- Quiz word_problem: /pages/quiz.html?subject={subject}&level={level}&topic={topic}&type=word_problem
- Quiz short_ans: /pages/quiz.html?subject={subject}&level={level}&topic={topic}&type=short_ans

All URL values use lowercase hyphenated slugs. Level format: "primary-4" (hyphenated, no space).
Day 1 = AI Tutor (rebuild understanding). Days 2–3 = progressively harder quiz types.
Write descriptions that are warm, specific, and encouraging — name the actual topic.`;

const QUEST_TOOL = {
  name: 'generate_remedial_quest',
  description: 'Generate a personalised 3-day remedial revision quest for a student',
  input_schema: {
    type: 'object',
    required: ['quest_title', 'steps'],
    properties: {
      quest_title: {
        type: 'string',
        description: 'Short motivating title, e.g. "Fractions Mastery Quest"',
        maxLength: 60,
      },
      steps: {
        type: 'array',
        minItems: 3,
        maxItems: 3,
        items: {
          type: 'object',
          required: ['day', 'type', 'title', 'description', 'action_url', 'estimated_minutes'],
          properties: {
            day:               { type: 'integer', enum: [1, 2, 3] },
            type:              { type: 'string', enum: ['tutor', 'quiz'] },
            title:             { type: 'string', maxLength: 60 },
            description:       { type: 'string', maxLength: 180 },
            action_url:        { type: 'string', description: 'Must match an approved URL pattern' },
            estimated_minutes: { type: 'integer', minimum: 5, maximum: 30 },
          },
        },
      },
    },
  },
};

function validateQuestSteps(steps, subject, level, topic) {
  const approvedPrefix = /^\/pages\/(tutor|quiz)\.html\?/;
  for (const step of steps) {
    if (!approvedPrefix.test(step.action_url)) {
      throw new Error(`Invalid action_url in step ${step.day}: ${step.action_url}`);
    }
    if (step.day === 1 && step.type !== 'tutor') {
      throw new Error('Step day 1 must be type "tutor"');
    }
  }
  return true;
}

export async function handleGenerateQuest(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorised — please log in' });

    const { student_id, subject, level, topic, trigger_score, trigger_attempt_id } = req.body || {};

    if (!student_id || !subject || !level || !topic || trigger_score === undefined || trigger_score === null) {
      return res.status(400).json({ error: 'Missing required fields: student_id, subject, level, topic, trigger_score' });
    }
    
    const adminDb = getAdminClient();
    const { data: student, error: stuErr } = await adminDb.from('students').select('id, parent_id, name, level').eq('id', student_id).single();

    if (stuErr || !student) return res.status(404).json({ error: 'Student not found' });
    if (student.parent_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

    const { data: existing } = await adminDb.from('remedial_quests').select('*').eq('student_id', student_id).eq('topic', topic.toLowerCase()).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (existing) return res.status(200).json({ quest: existing, cached: true });

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured. Please contact support.' });
    }

    const safeSubject = subject.toLowerCase();
    const safeLevel   = level.toLowerCase().replace(/\s+/g, '-');
    const safeTopic   = topic.toLowerCase().replace(/\s+/g, '-');
    const scoreLabel  = trigger_score <= 40 ? 'very low' : trigger_score <= 60 ? 'below average' : 'borderline';

    const userPrompt = `Generate a 3-day remedial quest for ${student.name || 'a student'} (${student.level || level}).
They scored ${Math.round(trigger_score)}% (${scoreLabel}) on the topic "${topic}" in ${subject}.
subject slug: ${safeSubject} | level slug: ${safeLevel} | topic slug: ${safeTopic}
Day 1 action_url must be: /pages/tutor.html?subject=${safeSubject}&level=${safeLevel}&intent=remedial&topic=${safeTopic}`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    // FIXED: Replaced invalid 'claude-sonnet-4-6' with official identifier
    const message = await client.messages.create({
      model:      'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system:     QUEST_SYSTEM_PROMPT,
      tools:      [QUEST_TOOL],
      tool_choice: { type: 'tool', name: 'generate_remedial_quest' },
      messages:   [{ role: 'user', content: userPrompt }],
    });

    const toolBlock = message.content.find(b => b.type === 'tool_use' && b.name === 'generate_remedial_quest');
    if (!toolBlock) throw new Error('Anthropic did not return expected tool_use block');

    const questData = toolBlock.input;
    validateQuestSteps(questData.steps, safeSubject, safeLevel, safeTopic);

    const { data: quest, error: insertErr } = await adminDb.from('remedial_quests').insert({
      student_id, subject: safeSubject, level: safeLevel, topic: safeTopic,
      trigger_score: Math.round(trigger_score), trigger_attempt_id: trigger_attempt_id || null,
      quest_title: questData.quest_title, steps: questData.steps, current_step: 0, status: 'active',
    }).select('*').single();

    if (insertErr) throw insertErr;
    return res.status(200).json({ quest, cached: false });

  } catch (err) {
    console.error('[generate-quest] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Failed to generate quest. Please try again.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: /api/analyze-weakness
// ─────────────────────────────────────────────────────────────────────────────

function derivePrimaryTopic(wrongQs, quizRows) {
  if (wrongQs.length > 0) {
    const freq = {};
    for (const q of wrongQs) {
      const t = (q.topic || '').toLowerCase();
      freq[t] = (freq[t] || 0) + 1;
    }
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  }
  return (quizRows[0]?.topic || 'general').toLowerCase();
}

const ANALYZE_WEAKNESS_SYSTEM_PROMPT = `You are Miss Wena, a warm and highly analytical Singapore MOE primary school tutor writing a confidential learning-gap report for a parent.

PERSONA & TONE:
- Warm, encouraging, never alarming. Every mistake is a learning opportunity.
- Address the parent directly: always say "your child" — never invent or use names (PDPA).
- Singapore Standard English: British spelling (colour, centre, practise, recognise).
- Concise: 3–4 sentences for the analysis body. Parents are busy.

YOUR ANALYTICAL TASK:
Given a list of recently failed quiz questions, synthesise them into ONE root conceptual gap — the deepest underlying cause, not a surface description. Examples of good root causes:
  - "translating word problems into bar model diagrams" (not just "fractions")
  - "applying the CER framework to link observation to scientific principle" (not just "Science open-ended")
  - "distinguishing past perfect from simple past in context" (not just "tenses")

TEACHING AI PRINCIPLES (apply all of these):
1. Socratic diagnosis: name the gap with a "because".
2. Spaced repetition signal: reference the PATTERN across questions.
3. Growth mindset language: "not yet mastered", "building towards", "with practice".
4. Concrete next step: name the exact MOE topic and ONE specific technique to address it.

SUBJECT-SPECIFIC RULES:
- Mathematics: reference the exact MOE heuristic needed.
- Science: use CER framework language.
- English: name the specific grammar rule.

HTML FORMATTING:
- Wrap key terms in <strong>.
- Separate paragraphs with <br><br>.
- Use <ul><li> only for a recommendation list (max 3 items).
- Do NOT use markdown, headers, or code blocks inside the HTML string.

OUTPUT — return ONLY a single valid JSON object with NO markdown fences:
{
  "analysis": "<rich HTML string — the parent-facing learning-gap analysis>",
  "quest": {
    "quest_title": "<motivating title ≤ 60 chars>",
    "steps": [ ... ]
  }
}`;

export async function handleAnalyzeWeakness(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorised — please log in' });

    const { student_id, subject } = req.body || {};
    if (!student_id || !subject) return res.status(400).json({ error: 'Missing required fields' });

    const adminDb = getAdminClient();
    const { data: student, error: stuErr } = await adminDb.from('students').select('id, parent_id, name, level').eq('id', student_id).single();

    if (stuErr || !student) return res.status(404).json({ error: 'Student not found' });
    if (student.parent_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

    const { data: recentQuizzes, error: quizErr } = await adminDb.from('quiz_attempts').select('id, topic, level').eq('student_id', student_id).ilike('subject', subject).order('completed_at', { ascending: false }).limit(10);
    if (quizErr) throw quizErr;

    if (!recentQuizzes || recentQuizzes.length === 0) {
      return res.status(200).json({ analysis: `Miss Wena needs a bit more data! Complete a few <strong>${subject}</strong> practice sessions so she can give you a personalised deep dive report.` });
    }

    const quizIds = recentQuizzes.map(q => q.id);
    const { data: wrongQs, error: qErr } = await adminDb.from('question_attempts').select('topic, question_text, answer_chosen, correct_answer, difficulty').in('quiz_attempt_id', quizIds).eq('correct', false).limit(15);
    if (qErr) throw qErr;

    if (!wrongQs || wrongQs.length === 0) {
      return res.status(200).json({ analysis: `Great news! Your child has <strong>no recent mistakes</strong> in ${subject} across their last practice sessions. Keep up the excellent work!` });
    }

    const safeTopic   = derivePrimaryTopic(wrongQs, recentQuizzes).replace(/\s+/g, '-');
    const safeLevel   = (student.level || recentQuizzes[0]?.level || 'primary-4').toLowerCase().replace(/\s+/g, '-');
    const safeSubject = subject.toLowerCase().replace(/\s+/g, '-');

    const failedSummary = wrongQs.map(q => `- Topic: ${q.topic || 'unknown'} | Difficulty: ${q.difficulty || 'unknown'}\n  Q: ${(q.question_text || '').slice(0, 200)}\n  Student chose: ${q.answer_chosen || 'N/A'} | Correct: ${q.correct_answer || 'N/A'}`).join('\n\n');

    const userPrompt = `Analyse these ${wrongQs.length} recently failed ${subject} questions for a student at level "${safeLevel}".\n\nFAILED QUESTIONS:\n${failedSummary}\n\nQUEST URL CONTEXT:\n  subject: ${safeSubject}\n  level: ${safeLevel}\n  topic: ${safeTopic}`;

    const rawResponse = await callGemini(`${ANALYZE_WEAKNESS_SYSTEM_PROMPT}\n\n${userPrompt}`, {
      temperature: 0.3, maxOutputTokens: 1400, responseMimeType: 'application/json',
    });

    const cleaned = stripMarkdownFences(rawResponse);
    const result  = JSON.parse(cleaned);

    let savedQuest = null;
    if (result.quest?.quest_title && Array.isArray(result.quest?.steps) && result.quest.steps.length === 3) {
      const { data: inserted, error: insertErr } = await adminDb.from('remedial_quests').insert({
        student_id, subject: safeSubject, level: safeLevel, topic: safeTopic, trigger_score: null, trigger_attempt_id: null,
        quest_title: result.quest.quest_title, steps: result.quest.steps, current_step: 0, status: 'active',
      }).select('*').single();

      if (!insertErr) savedQuest = inserted;
    }

    const response = { analysis: result.analysis };
    if (savedQuest) response.quest = savedQuest;
    return res.status(200).json(response);

  } catch (err) {
    console.error('[analyze-weakness] Error:', err.message || err);
    return res.status(500).json({ error: err.message || 'Could not generate deep dive analysis at this time.' });
  }
}