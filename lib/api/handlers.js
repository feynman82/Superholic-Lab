/**
 * lib/api/handlers.js
 * All API handler logic consolidated from /api/*.js.
 * Each handler is exported as a named async function and called by api/index.js.
 *
 * Handlers:
 *   handleChat            — POST /api/chat
 *   handleCheckout        — POST /api/checkout
 *   handleWebhook         — POST /api/webhook  (reads raw body itself — no pre-parsing)
 *   handleGenerate        — POST /api/generate
 *   handleGenerateQuestion — POST /api/generate-question
 *   handleGradeAnswer     — POST /api/grade-answer
 *   handleSaveExamResult  — POST /api/save-exam-result
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

/** Read the full raw body from a Node.js IncomingMessage stream. */
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end',  ()    => resolve(body));
    req.on('error', err  => reject(err));
  });
}

/** Gemini 1.5 Flash API call — used by generate-question and grade-answer. */
async function callGemini(prompt, { temperature = 0.1, maxOutputTokens = 1024, responseMimeType } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens },
  };
  
  // Force Gemini to return valid JSON (prevents markdown syntax crashes)
  if (responseMimeType) {
    payload.generationConfig.response_mime_type = responseMimeType;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res  = await fetch(url, {
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

/** Claude Haiku API call via raw fetch — used by generate-question and grade-answer. */
async function callClaudeRaw(systemPrompt, userPrompt, { maxTokens = 1024 } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
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

/** Strip markdown fences and parse JSON array from AI response. */
function parseJsonArray(text) {
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  const parsed  = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('AI response is not a JSON array');
  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: /api/chat
// ─────────────────────────────────────────────────────────────────────────────

const MISS_WENA_BASE = `You are Miss Wena, an AI tutor on Superholic Lab.
You are a young Singaporean Chinese woman in your early 20s — warm, cheerful, and genuinely passionate about helping students understand concepts deeply, not just memorise answers. You grew up in Singapore and know the MOE exam system inside-out. You speak naturally and conversationally, occasionally using light Singlish expressions like "lah", "lor", or "eh" when it feels natural — but never excessively. You are patient, never condescending, and celebrate every small win.

Your teaching philosophy:
- Always guide with a question before giving the answer. Ask "What do you think happens if...?" or "Can you tell me what you notice first?"
- Show step-by-step working clearly, labelled Step 1, Step 2, etc.
- After explaining, say something warm like "Does that click for you? Try the next part and I'll check your working, okay?"
- If a student gets it right, be specific: "Yes! You got the units conversion exactly right — that's the tricky part most students miss."
- Never make a student feel silly for a wrong answer. Say "Good try — let me show you what's happening here" instead of just marking it wrong.`;

const CHAT_SYSTEM_PROMPTS = {
  mathematics: MISS_WENA_BASE + `\n\nYou are currently helping with Mathematics.\n- Align all answers strictly to the MOE P1-P6 Mathematics syllabus. Never introduce content beyond the student's level.\n- When a student is stuck, guide with a question first — never give the answer directly on the first attempt.\n- Show step-by-step working for all solutions. Label each step clearly: Step 1, Step 2, etc.\n- Use Singapore exam language: "Hence", "Therefore", "Show that", "Find the value of".\n- After a full explanation, end with: "Does that make sense, lah? Try the next part yourself and I'll check your working!"\n- If the student gets it right, celebrate specifically: name exactly what they did correctly.`,

  science: MISS_WENA_BASE + `\n\nYou are currently helping with Science.\n- Align strictly to MOE Primary Science syllabus (P3-P6).\n- Use Singapore exam keyword language — students must learn the exact words examiners expect in marking schemes.\n- For explain questions, always use the format: [Observation] because [Scientific reason].\n- For hypothesis questions, use: If [variable] then [expected result] because [reason].\n- After explaining, give one exam tip: "In PSLE, the keyword the examiner is looking for here is..."\n- Encourage curiosity: "Science is all about asking WHY — and you're already doing that, which is great!"`,

  english: MISS_WENA_BASE + `\n\nYou are currently helping with English Language.\n- For comprehension: teach inference skills, not just literal reading. Always ask "What does this suggest about...?"\n- For composition: guide students on structure — opening, build-up, climax, resolution, and reflection.\n- For summary: teach students to identify topic sentences and supporting details, then paraphrase in their own words.\n- Correct grammar errors by explaining the rule, not just fixing the error. Say "Here's why: in English, when we have a plural subject..."\n- Use Singapore Standard English — not British or American variants.\n- Encourage: "English is a skill you build over time — every sentence you write makes you stronger!"`,

  general: MISS_WENA_BASE + `\n\nYou are helping with general schoolwork across any subject.\n- Align all answers to the MOE Singapore syllabus for the student's level (P1-S4).\n- Always guide before giving answers — ask what the student already knows first.\n- Show working clearly for any calculation or structured response.\n- Adapt your language warmly to the student's level — simpler for younger students, more detailed for older ones.`,
};

const MAX_HISTORY_MESSAGES = 20;

export async function handleChat(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[chat] ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'AI tutor is not configured. Please contact support.' });
  }

  const { subject, messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array' });
  }

  const clean = messages
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0)
    .slice(-MAX_HISTORY_MESSAGES)
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (clean.length === 0 || clean[0].role !== 'user') {
    return res.status(400).json({ error: 'First message must be from the user' });
  }

  const systemPrompt = CHAT_SYSTEM_PROMPTS[(subject || '').toLowerCase()] || CHAT_SYSTEM_PROMPTS.general;

  try {
    const client   = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 1024, system: systemPrompt, messages: clean });
    return res.status(200).json({ reply: response.content?.[0]?.text ?? '' });
  } catch (err) {
    console.error('[chat] Anthropic error:', err?.message || err);
    return res.status(500).json({ error: 'The AI tutor is temporarily unavailable. Please try again in a moment.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: /api/checkout
// ─────────────────────────────────────────────────────────────────────────────

// Live Stripe price IDs (price IDs are public identifiers — safe to hardcode).
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

// Reverse-lookup used by webhook handler: price ID → plan name (both billing cycles).
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.superholiclab.com';

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
// NOTE: req.body is NOT pre-parsed here — this handler reads the raw stream.
// The api/index.js dispatcher must NOT parse the body before calling this.
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

const GENERATE_PROMPTS = {
  mcq:          MCQ_SYSTEM_PROMPT,
  short_ans:    SHORT_ANS_SYSTEM_PROMPT,
  word_problem: WORD_PROBLEM_SYSTEM_PROMPT,
  open_ended:   OPEN_ENDED_SYSTEM_PROMPT,
  cloze:        CLOZE_SYSTEM_PROMPT,
  editing:      EDITING_SYSTEM_PROMPT,
};

const GENERATE_MAX_COUNT = { mcq: 10, short_ans: 10, word_problem: 5, open_ended: 10, cloze: 3, editing: 3 };

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
    const message    = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 8192, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] });
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
// HANDLER: /api/generate-question  (Gemini→Claude fallback, on-demand exam questions)
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

    // Safely check if the student left the answer completely blank
    let isEmpty = false;
    if (typeof studentAnswer === 'string') {
      if (studentAnswer.trim() === '') isEmpty = true;
      // Handle word problems where answer is a stringified object like {"(a)":"", "(b)":""}
      if (studentAnswer.startsWith('{')) {
        try {
          const obj = JSON.parse(studentAnswer);
          const values = Object.values(obj).map(v => v.trim()).filter(v => v !== '');
          if (values.length === 0) isEmpty = true;
        } catch (e) {}
      }
    }

    // If blank, immediately return 0 marks gracefully (Fixes the 400 Bad Request)
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
      // Pass responseMimeType to enforce strict JSON formatting from Gemini
      responseText = await callGemini(fullPrompt, { temperature: 0.1, maxOutputTokens: 1024, responseMimeType: "application/json" });
    } catch (geminiErr) {
      console.warn('[grade-answer] Gemini failed, falling back to Claude:', geminiErr.message);
      gradedBy     = 'claude';
      responseText = await callClaudeRaw(GRADER_SYSTEM_PROMPT, rubricPrompt, { maxTokens: 1024 });
    }

    const cleaned = responseText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
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

export async function handleSaveExamResult(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorised — please log in' });

    const { subject, level, examType, score, totalMarks, timeTaken, questionsAttempted, examId } = req.body || {};

    if (!subject || !level || !examType) return res.status(400).json({ error: 'Missing required fields: subject, level, examType' });
    if (!['Mathematics', 'Science', 'English'].includes(subject)) return res.status(400).json({ error: 'Invalid subject' });
    if (!['WA1', 'WA2', 'EOY', 'PRELIM', 'PRACTICE'].includes(examType)) return res.status(400).json({ error: 'Invalid examType' });

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
// Generates a personalised 3-step remedial quest for a student who scored
// poorly on a topic. Uses Anthropic tool_use to enforce structured JSON output.
// The quest is persisted to the remedial_quests table via service role key.
// ─────────────────────────────────────────────────────────────────────────────

/** System prompt — constrains the LLM to approved URL patterns only. */
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

/** Tool schema — forces the model to output exactly this shape. */
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

/** Validates that every step's action_url matches an approved pattern. */
function validateQuestSteps(steps, subject, level, topic) {
  const approvedPrefix = /^\/pages\/(tutor|quiz)\.html\?/;
  for (const step of steps) {
    if (!approvedPrefix.test(step.action_url)) {
      throw new Error(`Invalid action_url in step ${step.day}: ${step.action_url}`);
    }
    // Day 1 must always be the tutor
    if (step.day === 1 && step.type !== 'tutor') {
      throw new Error('Step day 1 must be type "tutor"');
    }
  }
  return true;
}

export async function handleGenerateQuest(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // ── 1. Auth verification ──────────────────────────────────────────────────
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorised — please log in' });

    // ── 2. Input validation ───────────────────────────────────────────────────
    const { student_id, subject, level, topic, trigger_score, trigger_attempt_id } = req.body || {};

    if (!student_id || !subject || !level || !topic || trigger_score === undefined || trigger_score === null) {
      return res.status(400).json({ error: 'Missing required fields: student_id, subject, level, topic, trigger_score' });
    }
    if (typeof trigger_score !== 'number' || trigger_score < 0 || trigger_score > 100) {
      return res.status(400).json({ error: 'trigger_score must be a number between 0 and 100' });
    }

    // ── 3. Verify student belongs to authenticated parent ─────────────────────
    const adminDb = getAdminClient();
    const { data: student, error: stuErr } = await adminDb
      .from('students')
      .select('id, parent_id, name, level')
      .eq('id', student_id)
      .single();

    if (stuErr || !student) return res.status(404).json({ error: 'Student not found' });
    if (student.parent_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

    // ── 4. Idempotency — return existing active quest for same student+topic ───
    const { data: existing } = await adminDb
      .from('remedial_quests')
      .select('*')
      .eq('student_id', student_id)
      .eq('topic', topic.toLowerCase())
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) return res.status(200).json({ quest: existing, cached: true });

    // ── 5. Generate quest via Anthropic tool_use ───────────────────────────────
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured. Please contact support.' });
    }

    const safeSubject = subject.toLowerCase();
    const safeLevel   = level.toLowerCase().replace(/\s+/g, '-');   // "Primary 4" → "primary-4"
    const safeTopic   = topic.toLowerCase().replace(/\s+/g, '-');   // "Fractions" → "fractions"
    const scoreLabel  = trigger_score <= 40 ? 'very low' : trigger_score <= 60 ? 'below average' : 'borderline';

    const userPrompt = `Generate a 3-day remedial quest for ${student.name || 'a student'} (${student.level || level}).
They scored ${Math.round(trigger_score)}% (${scoreLabel}) on the topic "${topic}" in ${subject}.
subject slug: ${safeSubject} | level slug: ${safeLevel} | topic slug: ${safeTopic}
Day 1 action_url must be: /pages/tutor.html?subject=${safeSubject}&level=${safeLevel}&intent=remedial&topic=${safeTopic}`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1024,
      system:     QUEST_SYSTEM_PROMPT,
      tools:      [QUEST_TOOL],
      tool_choice: { type: 'tool', name: 'generate_remedial_quest' },
      messages:   [{ role: 'user', content: userPrompt }],
    });

    // Extract tool_use block
    const toolBlock = message.content.find(b => b.type === 'tool_use' && b.name === 'generate_remedial_quest');
    if (!toolBlock) throw new Error('Anthropic did not return expected tool_use block');

    const questData = toolBlock.input;
    if (!questData?.quest_title || !Array.isArray(questData?.steps) || questData.steps.length !== 3) {
      throw new Error('LLM returned invalid quest structure');
    }

    // Validate URL patterns before persisting
    validateQuestSteps(questData.steps, safeSubject, safeLevel, safeTopic);

    // ── 6. Persist to remedial_quests ─────────────────────────────────────────
    const { data: quest, error: insertErr } = await adminDb
      .from('remedial_quests')
      .insert({
        student_id,
        subject:             safeSubject,
        level:               safeLevel,
        topic:               safeTopic,
        trigger_score:       Math.round(trigger_score),
        trigger_attempt_id:  trigger_attempt_id || null,
        quest_title:         questData.quest_title,
        steps:               questData.steps,
        current_step:        0,
        status:              'active',
      })
      .select('*')
      .single();

    if (insertErr) {
      console.error('[generate-quest] Supabase insert error:', insertErr.message);
      return res.status(500).json({ error: 'Failed to save quest. Please try again.' });
    }

    return res.status(200).json({ quest, cached: false });

  } catch (err) {
    console.error('[generate-quest] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Failed to generate quest. Please try again.' });
  }
}

// TEST: Import this file and call handleChat, handleCheckout, etc. with mock req/res.
// Integration test: POST /api/chat with a valid messages array → expect { reply: string }
// Integration test: POST /api/generate-quest with valid Bearer token + { student_id, subject: 'mathematics', level: 'primary-4', topic: 'fractions', trigger_score: 42 }
//   → expect { quest: { id, steps: [ {day:1,type:'tutor',...}, {day:2,...}, {day:3,...} ], status: 'active' } }
