/**
 * lib/api/handlers.js
 * All API handler logic consolidated from /api/*.js.
 */

'use strict';

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

import { MCQ_SYSTEM_PROMPT }          from './prompts/mcq.js';
import { SHORT_ANS_SYSTEM_PROMPT }    from './prompts/short-ans.js';
import { WORD_PROBLEM_SYSTEM_PROMPT } from './prompts/word-problem.js';
import { OPEN_ENDED_SYSTEM_PROMPT }   from './prompts/open-ended.js';
import { CLOZE_SYSTEM_PROMPT }        from './prompts/cloze.js';
import { EDITING_SYSTEM_PROMPT }      from './prompts/editing.js';
import { buildSocraticQuestPrompt }   from './prompts/socratic-quest.js';
import { buildQuestSteps, SYLLABUS_DEPENDENCIES } from './quest-pedagogy.js';
import {
  xpToLevel, xpInCurrentLevel, xpNeededForNextLevel, levelToRank,
  evaluateLevelUp, evaluateBadges,
} from './badge-engine.js';

// ─── SHARED HELPERS ───────────────────────────────────────────────────────────

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
  const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature, maxOutputTokens } };
  if (responseMimeType) payload.generationConfig.responseMimeType = responseMimeType;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
  const res = await fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty content');
  return text;
}

async function callClaudeRaw(systemPrompt, userPrompt, { maxTokens = 1024, model = 'claude-3-5-sonnet-20241022' } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  const res = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: maxTokens, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Claude returned empty content');
  return text;
}

// ─── AI ROUTING — single source of truth ─────────────────────────────────────
//
// Every AI-using handler calls `await callAI(task, { systemPrompt, userPrompt, ... })`
// instead of calling provider-specific helpers directly. Provider/model is
// chosen by the AI_ROUTING config below, which is overridable via env vars.
//
// To swap a provider in production: set the relevant env vars in Vercel,
// no code change required.

const AI_ROUTING = {
  chat:            { provider: process.env.AI_CHAT_PROVIDER      || 'openai',    model: process.env.AI_CHAT_MODEL      || 'gpt-4o-mini' },
  summarize:       { provider: process.env.AI_SUMMARIZE_PROVIDER || 'openai',    model: process.env.AI_SUMMARIZE_MODEL || 'gpt-4o-mini' },
  grade_open:      { provider: process.env.AI_GRADE_PROVIDER     || 'openai',    model: process.env.AI_GRADE_MODEL     || 'gpt-4o-mini' },
  question_gen:    { provider: process.env.AI_QUESTION_PROVIDER  || 'openai',    model: process.env.AI_QUESTION_MODEL  || 'o4-mini' },
  exam_gen:        { provider: process.env.AI_EXAM_PROVIDER      || 'openai',    model: process.env.AI_EXAM_MODEL      || 'gpt-4o-mini' },
  quest_narrative: { provider: process.env.AI_QUEST_PROVIDER     || 'openai',    model: process.env.AI_QUEST_MODEL     || 'gpt-4o-mini' },
  bulk_question:   { provider: process.env.AI_BULK_PROVIDER      || 'anthropic', model: process.env.AI_BULK_MODEL      || 'claude-3-5-sonnet-20241022' },
};

async function callOpenAI(model, systemPrompt, userPrompt, { temperature = 0.3, maxTokens = 1024, responseFormat = null } = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  const isReasoning = model.startsWith('o4-') || model.startsWith('o1-') || model.startsWith('o3-');
  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
  };
  if (isReasoning) {
    body.max_completion_tokens = maxTokens;
  } else {
    body.max_tokens = maxTokens;
    body.temperature = temperature;
  }
  if (responseFormat === 'json') body.response_format = { type: 'json_object' };
  const res = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI returned empty content');
  return text;
}

// Unified AI dispatch. task must be a key in AI_ROUTING.
async function callAI(task, { systemPrompt = '', userPrompt = '', temperature = 0.3, maxTokens = 1024, responseFormat = null } = {}) {
  const cfg = AI_ROUTING[task];
  if (!cfg) throw new Error(`callAI: unknown task '${task}'`);
  const { provider, model } = cfg;

  if (provider === 'openai') {
    return callOpenAI(model, systemPrompt, userPrompt, { temperature, maxTokens, responseFormat });
  }
  if (provider === 'anthropic') {
    return callClaudeRaw(systemPrompt, userPrompt, { maxTokens, model });
  }
  if (provider === 'gemini') {
    const folded = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;
    return callGemini(folded, {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: responseFormat === 'json' ? 'application/json' : undefined,
    });
  }
  throw new Error(`callAI: unknown provider '${provider}' for task '${task}'`);
}

function stripMarkdownFences(text) {
  if (!text) return '';
  let cleaned = text.trim();
  const fence = String.fromCharCode(96, 96, 96);
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
  const token      = authHeader.slice(7);
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

// ─── PRICING UTILITIES ────────────────────────────────────────────────────────

function getPriceTypeMap() {
  return {
    [process.env.STRIPE_ALL_SUBJECTS_PRICE_ID]:        { plan: 'all_subjects', cycle: 'monthly', mrr: 12.99  },
    [process.env.STRIPE_FAMILY_PRICE_ID]:              { plan: 'family',       cycle: 'monthly', mrr: 19.99  },
    [process.env.STRIPE_ALL_SUBJECTS_ANNUAL_PRICE_ID]: { plan: 'all_subjects', cycle: 'annual',  mrr: 10.825 },
    [process.env.STRIPE_FAMILY_ANNUAL_PRICE_ID]:       { plan: 'family',       cycle: 'annual',  mrr: 16.658 },
  };
}

function isAnnualPriceId(priceId) {
  return [process.env.STRIPE_ALL_SUBJECTS_ANNUAL_PRICE_ID, process.env.STRIPE_FAMILY_ANNUAL_PRICE_ID].filter(Boolean).includes(priceId);
}

function estimateStripeFee(cycle, grossMonthlyMrr) {
  if (cycle === 'monthly') return grossMonthlyMrr * 0.034 + 0.50;
  const annualPrice = grossMonthlyMrr * 12;
  return (annualPrice * 0.034 + 0.50) / 12;
}

function getStripePrices() {
  return {
    monthly: { all_subjects: process.env.STRIPE_ALL_SUBJECTS_PRICE_ID, family: process.env.STRIPE_FAMILY_PRICE_ID },
    annual:  { all_subjects: process.env.STRIPE_ALL_SUBJECTS_ANNUAL_PRICE_ID, family: process.env.STRIPE_FAMILY_ANNUAL_PRICE_ID },
  };
}

function getPriceToPlan() {
  const map = getPriceTypeMap();
  return Object.fromEntries(Object.entries(map).filter(([id]) => !!id).map(([id, v]) => [id, v.plan]));
}

function getCheckoutPriceId(plan, billing) {
  const cycle  = (billing === 'annual' || billing === 'yearly') ? 'annual' : 'monthly';
  const prices = getStripePrices();
  return (prices[cycle] || prices.monthly)[plan] || null;
}

// ─── HANDLER: /api/chat ───────────────────────────────────────────────────────

const OMNI_TUTOR_SYSTEM_PROMPT = `You are Miss Wena, a premium Singaporean MOE-aligned Omni-Tutor on Superholic Lab.
You are a warm, highly capable AI tutor who seamlessly handles Mathematics, Science, and English for P1-S4 students.

CRITICAL PEDAGOGICAL RULES (STRICTLY ENFORCED):
1. The 3-Strike Scaffolding Rule: NEVER give the final answer immediately. Guide the student step-by-step. If they fail or guess incorrectly 3 times in a row, you MUST provide the complete worked solution and a new easier confidence-builder question.
2. The "Zero-Effort" Protocol: If a student replies with zero effort, give a gentle multiple-choice hint instead of the answer.
3. The Soft Pivot: If the student goes off-topic, humorously acknowledge and redirect.
4. The Signature Celebration: Celebrate enthusiastically when the student gets it right.
5. Visual Analysis: Analyse student images of working carefully and gently point out specific mistakes.
6. MOE Alignment: Use exact Singapore syllabus terminology. Use **bold** for key MOE terms.
7. Tone: Warm, cheerful, highly empathetic, very light Singlish occasionally.`;

const MAX_HISTORY_MESSAGES = 20;

export async function handleChat(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'messages must be a non-empty array' });

  const rawMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-MAX_HISTORY_MESSAGES);
  if (rawMessages.length === 0 || rawMessages[0].role !== 'user') return res.status(400).json({ error: 'First message must be from the user' });

  // Vision requests can't be serialised into a text prompt — Gemini multi-turn stays for images.
  const hasImage = rawMessages.some(m => m.image);

  // ── Socratic Quest mode ─────────────────────────────────────────────────────
  // If called with ?from_quest=<id>, override system prompt for Day 2 sessions.
  let systemPrompt = OMNI_TUTOR_SYSTEM_PROMPT;
  let questMessageCount = null;
  try {
    const reqUrl = new URL(req.url, 'http://localhost');
    const fromQuest = reqUrl.searchParams.get('from_quest');
    if (fromQuest) {
      const user = await getUserFromToken(req.headers.authorization);
      if (user) {
        const adminDb = getAdminClient();
        const { data: quest } = await adminDb.from('remedial_quests').select('*').eq('id', fromQuest).single();
        if (quest) {
          const stepCfg = (quest.steps || [])[quest.current_step]?.config || {};
          if (stepCfg.scaffold_mode === 'socratic') {
            const { data: stu } = await adminDb.from('students').select('name, level').eq('id', quest.student_id).maybeSingle();
            systemPrompt = buildSocraticQuestPrompt({
              topic: quest.topic,
              day1WrongAttempts: quest.day1_wrong_attempts || [],
              studentName: stu?.name || null,
              level: stu?.level || quest.level || null,
            });
          }
          questMessageCount = rawMessages.length;
        }
      }
    }
  } catch (questErr) {
    console.error('[chat] Quest mode setup error:', questErr.message);
  }

  try {
    let reply;

    if (hasImage) {
      // Vision path: Gemini native multi-turn with inlineData for image messages.
      if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set for vision fallback');
      const geminiContents = rawMessages.map(m => {
        const parts = [];
        if (m.content) parts.push({ text: m.content });
        if (m.image) { const b64 = m.image.split(',')[1]; if (b64) parts.push({ inlineData: { mimeType: 'image/png', data: b64 } }); }
        return { role: m.role === 'assistant' ? 'model' : 'user', parts: parts.length > 0 ? parts : [{ text: '' }] };
      });
      const payload = { systemInstruction: { parts: [{ text: systemPrompt }] }, contents: geminiContents, generationConfig: { temperature: 0.4, maxOutputTokens: 1024 } };
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const response = await fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`Gemini vision ${response.status}: ${await response.text()}`);
      const data = await response.json();
      reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      // Text-only path: serialise conversation then dispatch through AI_ROUTING.
      const userPrompt = rawMessages.map(m => `${m.role === 'assistant' ? 'Miss Wena' : 'Student'}: ${m.content || ''}`).join('\n\n');
      reply = await callAI('chat', { systemPrompt, userPrompt, temperature: 0.4, maxTokens: 1024 });
    }

    if (!reply) throw new Error('AI returned empty content');
    const responseBody = { reply };
    if (questMessageCount !== null) responseBody.quest_message_count = questMessageCount + 1;
    return res.status(200).json(responseBody);
  } catch (err) {
    console.error('[chat] AI error:', err?.message || err);
    return res.status(500).json({ error: 'The AI tutor is temporarily unavailable. Please try again in a moment.' });
  }
}

// ─── HANDLER: /api/summarize-chat ────────────────────────────────────────────

const SUMMARIZE_SYSTEM_PROMPT = `You are Miss Wena, a Singapore MOE tutor. Transform the following student-tutor chat log into a structured "2-Way Study Note".

STRUCTURE: 1. Core Question/Problem 2. Underlying Concept 3. Step-by-Step Breakdown 4. Miss Wena's Key Takeaway

HTML FORMATTING: Use <h3>, <p>, <ul>/<li>, <strong>.

OUTPUT: Return ONLY a valid JSON object, no markdown fences:
{ "title": "<3-6 word title>", "content_html": "<HTML string>" }`;

export async function handleSummarizeChat(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorised — please log in' });
    const { student_id, subject, topic, messages, quest_id } = req.body || {};
    if (!student_id || !messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Missing required fields' });
    const adminDb = getAdminClient();
    const chatLog = messages.filter(m => m.content).map(m => `${m.role === 'assistant' ? 'Miss Wena' : 'Student'}: ${m.content}`).join('\n\n');
    const rawResponse = await callAI('summarize', {
      systemPrompt: SUMMARIZE_SYSTEM_PROMPT,
      userPrompt:   'CHAT LOG:\n' + chatLog,
      temperature:  0.3,
      maxTokens:    1000,
      responseFormat: 'json',
    });
    const generatedData = JSON.parse(stripMarkdownFences(rawResponse));
    if (!generatedData.title || !generatedData.content_html) throw new Error('AI failed to generate required schema properties.');
    const noteRow = { student_id, subject: subject || 'general', topic: topic || 'mixed', title: generatedData.title, content_html: generatedData.content_html, is_read: false };
    if (quest_id) noteRow.quest_id = quest_id;
    const { error: dbErr } = await adminDb.from('study_notes').insert(noteRow);
    if (dbErr) throw dbErr;
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[summarize-chat] Error:', err.message || err);
    return res.status(500).json({ error: 'Failed to generate and save the study note.' });
  }
}

// ─── HANDLER: /api/checkout ───────────────────────────────────────────────────

export async function handleCheckout(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Checkout is not configured.' });
  const { plan, userId, email, billing } = req.body || {};
  if (!plan || !userId) return res.status(400).json({ error: 'plan and userId are required' });
  const priceId = getCheckoutPriceId(plan, billing);
  if (!priceId) {
    const cycle = (billing === 'annual' || billing === 'yearly') ? 'annual' : 'monthly';
    return res.status(400).json({ error: `Plan configuration error: ${plan} (${cycle})` });
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.superholiclab.com';
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' });
    const sessionParams = {
      mode: 'subscription', line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      success_url: `${appUrl}/pages/dashboard.html?checkout=success&plan=${plan}`,
      cancel_url:  `${appUrl}/pages/pricing.html`,
      subscription_data: { metadata: { supabase_user_id: userId, plan } },
    };
    if (email) sessionParams.customer_email = email;
    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[checkout] Stripe error:', err?.message);
    return res.status(500).json({ error: `Stripe error: ${err?.message || 'Unknown'}` });
  }
}

// ─── HANDLER: /api/webhook ────────────────────────────────────────────────────

function webhookPlanFromPriceId(priceId) { return getPriceToPlan()[priceId] || null; }
function maxChildrenForPlan(plan) { return plan === 'family' ? 3 : 1; }

export async function handleWebhook(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('[webhook] STRIPE_WEBHOOK_SECRET not set.');
    return res.status(200).json({ received: true, warning: 'Webhook secret not configured' });
  }
  const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' });
  const db      = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const rawBody = await getRawBody(req);
  const sig     = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature invalid: ${err.message}` });
  }
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId  = session.client_reference_id;
        if (!userId) break;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const priceId  = subscription.items.data[0]?.price?.id;
        const planName = webhookPlanFromPriceId(priceId);
        if (!planName) break;
        const cycle = isAnnualPriceId(priceId) ? 'annual' : 'monthly';
        await db.from('subscriptions').upsert({
          profile_id: userId, stripe_subscription_id: subscription.id, stripe_price_id: priceId,
          plan_name: planName, billing_cycle: cycle, status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end:   new Date(subscription.current_period_end   * 1000).toISOString(),
        }, { onConflict: 'stripe_subscription_id' });
        await db.from('profiles').update({ subscription_tier: planName, max_children: maxChildrenForPlan(planName), stripe_customer_id: session.customer }).eq('id', userId);
        if (process.env.STRIPE_REFERRAL_COUPON_ID) {
          const { data: referral } = await db.from('referrals').select('id, referrer_id').eq('referred_id', userId).eq('status', 'pending').maybeSingle();
          if (referral) {
            await db.from('referrals').update({ status: 'subscribed', subscribed_at: new Date().toISOString() }).eq('id', referral.id);
            const { data: referrerSub } = await db.from('subscriptions').select('stripe_subscription_id').eq('profile_id', referral.referrer_id).eq('status', 'active').maybeSingle();
            if (referrerSub?.stripe_subscription_id) {
              try {
                await stripe.subscriptions.update(referrerSub.stripe_subscription_id, { coupon: process.env.STRIPE_REFERRAL_COUPON_ID });
                await db.from('referrals').update({ status: 'credited', credited_at: new Date().toISOString(), stripe_coupon_id: process.env.STRIPE_REFERRAL_COUPON_ID }).eq('id', referral.id);
                const { data: refProfile } = await db.from('profiles').select('referral_credits_earned').eq('id', referral.referrer_id).single();
                await db.from('profiles').update({ referral_credits_earned: (refProfile?.referral_credits_earned || 0) + 1 }).eq('id', referral.referrer_id);
              } catch (couponErr) { console.error('[webhook] Referral coupon error:', couponErr.message); }
            }
          }
        }
        console.log(`[webhook] Activated: ${planName} (${cycle}) for ${userId}`);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subId   = invoice.subscription;
        if (!subId) break;
        const stripeSub = await stripe.subscriptions.retrieve(subId);
        await db.from('subscriptions').update({ status: 'active', current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(), current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString() }).eq('stripe_subscription_id', subId);
        const { data: subRow } = await db.from('subscriptions').select('profile_id').eq('stripe_subscription_id', subId).maybeSingle();
        if (subRow?.profile_id) {
          const { data: profile } = await db.from('profiles').select('pause_scheduled, pause_resume_at').eq('id', subRow.profile_id).single();
          if (profile?.pause_scheduled && profile?.pause_resume_at) {
            const resumeTs = Math.floor(new Date(profile.pause_resume_at).getTime() / 1000);
            try {
              await stripe.subscriptions.update(subId, { pause_collection: { behavior: 'void', resumes_at: resumeTs } });
              await db.from('subscriptions').update({ paused_at: new Date().toISOString(), resumes_at: profile.pause_resume_at, status: 'paused' }).eq('stripe_subscription_id', subId);
              await db.from('profiles').update({ subscription_tier: 'paused', pause_scheduled: false }).eq('id', subRow.profile_id);
            } catch (pauseErr) { console.error('[webhook] Pause activation error:', pauseErr.message); }
          }
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub     = event.data.object;
        const priceId = sub.items.data[0]?.price?.id;
        const plan    = webhookPlanFromPriceId(priceId);
        const cycle   = priceId ? (isAnnualPriceId(priceId) ? 'annual' : 'monthly') : undefined;
        const updates = { status: sub.status, current_period_start: new Date(sub.current_period_start * 1000).toISOString(), current_period_end: new Date(sub.current_period_end * 1000).toISOString() };
        if (plan)    updates.plan_name      = plan;
        if (priceId) updates.stripe_price_id = priceId;
        if (cycle)   updates.billing_cycle  = cycle;
        await db.from('subscriptions').update(updates).eq('stripe_subscription_id', sub.id);
        if (plan) { const uid = sub.metadata?.supabase_user_id; if (uid) await db.from('profiles').update({ subscription_tier: plan, max_children: maxChildrenForPlan(plan) }).eq('id', uid); }
        if (!sub.pause_collection) {
          const { data: subRow } = await db.from('subscriptions').select('profile_id, plan_name').eq('stripe_subscription_id', sub.id).maybeSingle();
          if (subRow?.profile_id) {
            await db.from('profiles').update({ subscription_tier: subRow.plan_name || plan || 'all_subjects', pause_scheduled: false, pause_resume_at: null }).eq('id', subRow.profile_id);
            await db.from('subscriptions').update({ paused_at: null, resumes_at: null, status: 'active' }).eq('stripe_subscription_id', sub.id);
          }
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await db.from('subscriptions').update({ status: 'past_due' }).eq('stripe_subscription_id', invoice.subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await db.from('subscriptions').update({ status: 'cancelled' }).eq('stripe_subscription_id', sub.id);
        const uid = sub.metadata?.supabase_user_id;
        if (uid) await db.from('profiles').update({ subscription_tier: 'trial', max_children: 1 }).eq('id', uid);
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

// ─── HANDLER: /api/generate ───────────────────────────────────────────────────

function buildGenerateUserPrompt(type, count, subject, level, topic, difficulty) {
  const base = `Generate ${count} ${type.replace('_', '-')} question${count > 1 ? 's' : ''} for: Subject: ${subject}, Level: ${level}, Topic: ${topic}, Difficulty: ${difficulty}. 
  
CRITICAL MOE & DATABASE RULES:
1. Context: Use standard Singaporean names and SGD ($) currency.
2. Cognitive Skill: 'cognitive_skill' MUST be strictly chosen from: 'Factual Recall', 'Conceptual Understanding', 'Routine Application', 'Non-Routine / Heuristics', 'Inferential Reasoning', or 'Synthesis & Evaluation'.
3. Marks Allocation: Ensure 'marks' are mathematically appropriate for SEAB PSLE formats: MCQ (1-2m), Short Answer (1-2m), Word Problem (3-5m), Open Ended/Comprehension parts (1-4m).
4. Sub-Topic: Provide a highly specific 'sub_topic'.
5. JSON Formatting: Arrays/Objects inside the database schema (like 'options', 'parts', 'wrong_explanations') MUST be valid stringified JSON.`;

  const extras = {
    mcq:          `\n- 4 options (A-D), wrong-answer misconception explanations stringified, examiner_note.`,
    short_ans:    `\n- Concise answer, stringified accept_also for equivalent forms, step-by-step working.`,
    word_problem: `\n- 2-3 parts with coherent narrative, stringified parts array, examiner_note.`,
    open_ended:   `\n- Root 'passage' (experiment setup). Stringified 'parts' array of sub-questions using part_type: 'text_box' or 'true_false'.`,
    cloze:        `\n- 5-8 sentences, 7-10 blanks, correct_answer as exact word string, 4 MCQ options per blank.`,
    editing:      `\n- Exactly 5 underlined words, 4+ grammar categories. Return stringified array.`,
    comprehension:`\n- Root 'passage' (300+ words). Stringified 'parts' array of sub-questions.`,
    visual_text:  `\n- Root 'image_url' (placeholder) and 'passage' (flyer text). Stringified 'parts' array of 5-8 'mcq' questions.`,
  };
  return base + (extras[type] || '') + `\n\nReturn ONLY a valid JSON array of ${count} question object${count > 1 ? 's' : ''}.`;
}

export async function handleGenerate(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  const GENERATE_PROMPTS = { mcq: MCQ_SYSTEM_PROMPT, short_ans: SHORT_ANS_SYSTEM_PROMPT, word_problem: WORD_PROBLEM_SYSTEM_PROMPT, open_ended: OPEN_ENDED_SYSTEM_PROMPT, cloze: CLOZE_SYSTEM_PROMPT, editing: EDITING_SYSTEM_PROMPT, comprehension: OPEN_ENDED_SYSTEM_PROMPT, visual_text: MCQ_SYSTEM_PROMPT };
  const GENERATE_MAX_COUNT = { mcq: 10, short_ans: 10, word_problem: 5, open_ended: 5, cloze: 3, editing: 3, comprehension: 2, visual_text: 2 };
  const { subject, level, topic, difficulty, count, type } = req.body || {};
  if (!subject || !level || !topic) return res.status(400).json({ error: 'Missing required fields: subject, level, topic.' });
  const questionType = (type || 'mcq').toLowerCase().trim();
  if (!GENERATE_PROMPTS[questionType]) return res.status(400).json({ error: `Invalid type '${questionType}'.` });
  const questionCount = Math.min(parseInt(count, 10) || 3, GENERATE_MAX_COUNT[questionType] || 10);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const message = await client.messages.create({ model: 'claude-3-5-sonnet-20241022', max_tokens: 8192, system: GENERATE_PROMPTS[questionType], messages: [{ role: 'user', content: buildGenerateUserPrompt(questionType, questionCount, subject, level, topic, difficulty || 'Standard') }] });
    const questions = parseJsonArray(message.content[0].text.trim());
    return res.status(200).json(questions);
  } catch (err) {
    console.error('[generate] Error:', err.message);
    return res.status(500).json({ error: 'Failed to generate questions. Please try again.' });
  }
}

// ─── HANDLER: /api/generate-question ─────────────────────────────────────────

const GQ_SAFETY_PROMPT = `You are a question generator for Superholic Lab, a Singapore primary school learning platform. Generate MOE-aligned practice questions for students aged 9-12. Only generate educational content. Never generate inappropriate content.`;

function buildGQSchemaInstructions(subject, level, topic, type, difficulty, count) {
  const base = `\nGenerate exactly ${count} ${subject} question(s) for ${level} students on "${topic}".\nDifficulty: ${difficulty}. Use Singapore names, food, places. British English spelling.\nReturn ONLY a valid JSON array.\n\nRequired fields: id, subject, level, topic, sub_topic, difficulty, type, marks (1-4), question_text, worked_solution (min 3 steps).\n`;
  const schemas = {
    mcq:          `\n- options: 4 strings\n- correct_answer: "A"/"B"/"C"/"D"\n- wrong_explanations: object per wrong option\n`,
    short_ans:    `\n- correct_answer: string\n- accept_also: array\n`,
    word_problem: `\n- parts: array with label, question, marks, correct_answer, worked_solution\n`,
    open_ended:   `\n- passage: string (experiment context)\n- parts: array of sub-questions with part_type ('text_box'), marks, question, model_answer, rubric, keywords.\n`,
    cloze:        `\n- passage: string with [1],[2] blanks\n- blanks: array with number, options (4), correct_answer (A/B/C/D), explanation\n`,
    editing:      `\n- passage_lines: 3 lines, exactly 1 has_error:true\n`,
    comprehension:`\n- passage: string\n- parts: array with part_type ('mcq', 'true_false', 'text_box')\n`,
    visual_text:  `\n- passage: string (flyer text)\n- image_url: string\n- parts: array of 'mcq' objects\n`,
  };
  return base + (schemas[type] || '');
}

function validateGQQuestion(q) {
  for (const f of ['id','subject','level','topic','type','difficulty','marks','question_text','worked_solution']) {
    if (q[f] === undefined || q[f] === null) throw new Error(`Missing field: ${f}`);
  }
  return true;
}

export async function handleGenerateQuestion(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { subject, level, topic, type, difficulty, count } = req.body || {};
    if (!subject || !level || !topic || !type || !difficulty || !count) return res.status(400).json({ error: 'Missing required fields' });
    if (!['Mathematics','Science','English'].includes(subject)) return res.status(400).json({ error: 'Invalid subject' });
    if (!['mcq','short_ans','word_problem','open_ended','cloze','editing','comprehension','visual_text'].includes(type)) return res.status(400).json({ error: 'Invalid type' });
    if (!['Foundation','Standard','Advanced','HOTS'].includes(difficulty)) return res.status(400).json({ error: 'Invalid difficulty' });
    const safeCount = Math.min(Math.max(1, parseInt(count, 10) || 1), 5);
    const provider = `${AI_ROUTING.question_gen.provider}-${AI_ROUTING.question_gen.model}`;
    let responseText;
    try {
      responseText = await callAI('question_gen', {
        systemPrompt:   GQ_SAFETY_PROMPT,
        userPrompt:     buildGQSchemaInstructions(subject, level, topic, type, difficulty, safeCount),
        temperature:    0.4,
        maxTokens:      4096,
        responseFormat: 'json',
      });
    } catch (e) {
      console.error('[generate-question] AI failed:', e.message);
      return res.status(500).json({ error: 'AI generation failed' });
    }
    const questions = parseJsonArray(responseText).filter(q => { try { return validateGQQuestion(q); } catch { return false; } }).map(q => ({ ...q, source: 'ai', aiProvider: provider }));
    if (questions.length === 0) return res.status(500).json({ error: 'AI returned no valid questions' });
    return res.status(200).json({ questions, provider });
  } catch (err) {
    console.error('[generate-question] Error:', err.message);
    return res.status(500).json({ error: 'Failed to generate questions. Please try again.' });
  }
}

// ─── HANDLER: /api/grade-answer ───────────────────────────────────────────────

const GRADER_SYSTEM_PROMPT = `You are an experienced Singapore primary school examiner grading PSLE-style assessments. Be strict but fair.

PRINCIPLES: Award marks for demonstrated understanding. Accept sensible alternatives. For Science check CER (Claim, Evidence, Reasoning). For Maths check method shown. Always return valid JSON.

Return ONLY: { "score": <number>, "maxScore": <number>, "feedback": "<string>", "breakdown": [{ "aspect": "", "earned": 0, "possible": 0, "note": "" }] }`;

export async function handleGradeAnswer(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { questionText, studentAnswer, workedSolution, marks } = req.body || {};
    const graderSystemPrompt = `You are an expert Singapore MOE PSLE Examiner. Grade the student's answer strictly based on the provided Model Answer/Worked Solution. Output ONLY a JSON object with this exact structure: {"score": <integer between 0 and max marks>, "feedback": "<1-2 short sentences of constructive feedback explaining the score>"}. Do not include markdown formatting.`;
    const graderUserPrompt   = `Question: ${questionText}\nModel Answer/Rubric: ${workedSolution}\nMax Marks: ${marks}\nStudent Answer: ${studentAnswer}`;
    const rawGrade = await callAI('grade_open', {
      systemPrompt:   graderSystemPrompt,
      userPrompt:     graderUserPrompt,
      temperature:    0.1,
      maxTokens:      1024,
      responseFormat: 'json',
    });
    const result = JSON.parse(rawGrade.trim());
    return res.status(200).json(result);
  } catch (error) {
    console.error('[handlers] OpenAI Grading Error:', error);
    return res.status(500).json({ score: 0, feedback: 'AI grading temporarily unavailable. Please ask your teacher to review.' });
  }
}

// ─── HANDLER: /api/save-exam-result ──────────────────────────────────────────

export async function handleSaveExamResult(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorised' });
    const { subject, level, examType, score, totalMarks, timeTaken, questionsAttempted, examId } = req.body || {};
    if (!subject || !level || !examType) return res.status(400).json({ error: 'Missing required fields' });
    if (!['Mathematics','Science','English'].includes(subject)) return res.status(400).json({ error: 'Invalid subject' });
    if (!['WA1','WA2','EOY','PRELIM','PRACTICE','QUIZ'].includes(examType)) return res.status(400).json({ error: 'Invalid examType' });
    const adminDb = getAdminClient();
    const studentId = await resolveStudentId(adminDb, user.id);
    const cappedScore = Math.min(Math.max(0, parseInt(sanitise(score,0),10)), Math.max(1, parseInt(sanitise(totalMarks,1),10)));
    const { data, error } = await adminDb.from('exam_results').insert({ student_id: studentId, subject, level, exam_type: examType, exam_id: typeof examId==='string'?examId.slice(0,64):null, score: cappedScore, total_marks: Math.max(1,parseInt(sanitise(totalMarks,1),10)), time_taken: timeTaken?Math.max(0,parseInt(timeTaken,10)):null, questions_attempted: Math.max(0,parseInt(sanitise(questionsAttempted,0),10)), completed_at: new Date().toISOString() }).select('id').single();
    if (error) return res.status(500).json({ error: 'Failed to save result.' });
    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('[save-exam-result] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── HANDLER: /api/generate-quest ────────────────────────────────────────────

const QUEST_SYSTEM_PROMPT = `You are a gamified educational AI creating 3-day "Plan Quests" for primary school students on Superholic Lab.

NARRATIVE TONE: Epic & gamified — emojis, action words, direct to student.
PEDAGOGICAL ARC: Day 1 = tutor (rebuild concepts). Day 2 = quiz MCQ (easy win). Day 3 = quiz short_ans (mastery test).
URL RULES: Day 1: /pages/tutor.html?subject={s}&level={l}&intent=remedial&topic={t}&score={sc} | Day 2: /pages/quiz.html?subject={s}&level={l}&topic={t}&type=mcq | Day 3: /pages/quiz.html?subject={s}&level={l}&topic={t}&type=short_ans. All slugs lowercase-hyphenated. Level: "primary-4".
OUTPUT: Return ONLY valid JSON, no markdown fences: { "quest_title": "<60 chars>", "steps": [{ "day": 1-3, "type": "tutor"|"quiz", "title": "<60 chars>", "description": "<180 chars>", "action_url": "<url>", "estimated_minutes": 5-30 }] }`;

function validateQuestSteps(steps) {
  const ok = /^\/pages\/(tutor|quiz)\.html\?/;
  for (const s of steps) {
    if (!ok.test(s.action_url)) throw new Error(`Invalid action_url in step ${s.day}`);
    if (s.day === 1 && s.type !== 'tutor') throw new Error('Day 1 must be type tutor');
  }
  return true;
}

export async function handleGenerateQuest(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorised' });
    const { student_id, subject, level, topic, trigger_score, trigger_attempt_id, parent_quest_id } = req.body || {};
    if (!student_id || !subject || !level || !topic || trigger_score === undefined || trigger_score === null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const adminDb = getAdminClient();
    const { data: student, error: stuErr } = await adminDb.from('students').select('id, parent_id, name, level').eq('id', student_id).single();
    if (stuErr || !student) return res.status(404).json({ error: 'Student not found' });
    if (student.parent_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

    const safeSubject = subject.toLowerCase();
    const safeLevel   = level.toLowerCase().replace(/\s+/g, '-');
    const safeTopic   = topic.toLowerCase().replace(/\s+/g, '-');

    // ── Concurrency check — one active quest per (student, subject) ───────────
    const { data: existingSlot } = await adminDb.from('quest_eligibility')
      .select('quest_id')
      .eq('student_id', student_id)
      .eq('subject', safeSubject)
      .maybeSingle();
    if (existingSlot) {
      return res.status(409).json({
        error:            'subject_slot_taken',
        existing_quest_id: existingSlot.quest_id,
        subject:          safeSubject,
        message:          `An active ${subject} quest already exists. View it or abandon it before starting a new one.`,
      });
    }

    // ── Build v2.0 steps config ───────────────────────────────────────────────
    const steps = buildQuestSteps({ subject, level, topic, safeSubject, safeLevel, safeTopic });

    // ── AI narrative (descriptions) ───────────────────────────────────────────
    const narrativePrompt = `Generate a fun, kid-friendly narrative for a 3-day remedial learning quest.\nStudent: ${student.name || 'a student'} (${student.level || level})\nSubject: ${subject}\nTopic: ${topic}\nScore: ${Math.round(trigger_score)}%\n\nReturn ONLY a valid JSON object:\n{"quest_title":"Creative Title","day_1_desc":"Brief description for Day 1 (practice)","day_2_desc":"Brief description for Day 2 (tutor session)","day_3_desc":"Brief description for Day 3 (mastery trial)"}`;

    let questTitle = `${topic} Recovery Quest`;
    try {
      const raw = await callAI('quest_narrative', {
        systemPrompt:   'You are a creative educational writer for Singapore primary students. Return ONLY valid JSON.',
        userPrompt:     narrativePrompt,
        temperature:    0.7,
        maxTokens:      512,
        responseFormat: 'json',
      });
      const parsed = JSON.parse(stripMarkdownFences(raw).replace(/[\n\r]/g, ' '));
      steps[0].description = parsed.day_1_desc || steps[0].description;
      steps[1].description = parsed.day_2_desc || steps[1].description;
      steps[2].description = parsed.day_3_desc || steps[2].description;
      questTitle           = parsed.quest_title || questTitle;
    } catch (_) {
      steps[0].description = `Rebuild your foundation in ${topic} with 12 progressive questions.`;
      steps[1].description = `Talk through what tripped you up with Miss Wena. She'll guide, not lecture.`;
      steps[2].description = `Prove your mastery with 8 challenging questions including transfer problems.`;
    }

    // ── Insert quest ──────────────────────────────────────────────────────────
    const { data: quest, error: insertErr } = await adminDb.from('remedial_quests').insert({
      student_id,
      subject:            safeSubject,
      level:              safeLevel,
      topic:              safeTopic,
      trigger_score:      Math.round(trigger_score),
      trigger_attempt_id: trigger_attempt_id || null,
      parent_quest_id:    parent_quest_id    || null,
      quest_title:        questTitle,
      steps,
      current_step:       0,
      status:             'active',
    }).select('*').single();
    if (insertErr) throw insertErr;

    // ── Claim eligibility slot (optimistic; compensate on conflict) ───────────
    const { error: eligErr } = await adminDb.from('quest_eligibility').insert({
      student_id, subject: safeSubject, quest_id: quest.id,
    });
    if (eligErr) {
      // Race condition: another request claimed the slot between our SELECT and INSERT.
      // Roll back the quest row and surface the 409.
      await adminDb.from('remedial_quests').delete().eq('id', quest.id);
      const { data: winner } = await adminDb.from('quest_eligibility')
        .select('quest_id').eq('student_id', student_id).eq('subject', safeSubject).maybeSingle();
      return res.status(409).json({
        error:             'subject_slot_taken',
        existing_quest_id: winner?.quest_id || null,
        subject:           safeSubject,
        message:           `An active ${subject} quest already exists.`,
      });
    }

    return res.status(200).json({ quest, cached: false });
  } catch (err) {
    console.error('[generate-quest] Error:', err.message);
    return res.status(500).json({ error: 'Failed to generate quest. Please try again.' });
  }
}

// ─── HANDLER: /api/analyze-weakness ──────────────────────────────────────────

function derivePrimaryTopic(wrongQs, quizRows) {
  if (wrongQs.length > 0) {
    const freq = {};
    for (const q of wrongQs) { const t = (q.topic||'').toLowerCase(); freq[t] = (freq[t]||0) + 1; }
    return Object.entries(freq).sort((a,b) => b[1]-a[1])[0][0];
  }
  return (quizRows[0]?.topic || 'general').toLowerCase();
}

export async function handleAnalyzeWeakness(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { studentId, subject } = req.body || {};
    if (!studentId || !subject) return res.status(400).json({ error: 'Missing studentId or subject' });
    const db = getAdminClient();
    const { data: attempts, error } = await db.from('question_attempts').select('topic, cognitive_skill, correct, marks_earned, marks_total').eq('student_id', studentId).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    if (!attempts || attempts.length === 0) return res.status(200).json(null);
    const masteryScores = {};
    attempts.forEach(att => {
      if (!masteryScores[att.topic]) masteryScores[att.topic] = { totalWeight: 0, correctWeight: 0, failedSkills: new Set() };
      // 🚀 MASTERCLASS BKT UPGRADE: Map new AO2/AO3 Cognitive Skills to HOTS weighting
      const hotsSkills = ['Non-Routine / Heuristics', 'Inferential Reasoning', 'Synthesis & Evaluation'];
      const isHOTS = hotsSkills.includes(att.cognitive_skill) || att.cognitive_skill === 'HOTS';
      const weight = isHOTS ? 1.5 : 1.0;
      
      let isCorrect = att.correct;
      if (att.marks_total > 0) isCorrect = (att.marks_earned / att.marks_total) >= 0.5;
      masteryScores[att.topic].totalWeight += weight;
      if (isCorrect) masteryScores[att.topic].correctWeight += weight;
      else if (att.cognitive_skill) masteryScores[att.topic].failedSkills.add(att.cognitive_skill);
    });
    let lowestMastery = 1.0, weakestTopic = null;
    for (const [topic, data] of Object.entries(masteryScores)) {
      if (data.totalWeight < 3) continue;
      const mastery = data.correctWeight / data.totalWeight;
      if (mastery < lowestMastery) { lowestMastery = mastery; weakestTopic = topic; }
    }
    if (!weakestTopic) return res.status(200).json(null);
    let rootCauseTopic = weakestTopic;
    const prereqs = (SYLLABUS_DEPENDENCIES[subject.toLowerCase()] || {})[weakestTopic] || [];
    for (const req of prereqs) {
      if (masteryScores[req] && (masteryScores[req].correctWeight / masteryScores[req].totalWeight) < 0.6) rootCauseTopic = req;
    }
    let questLength = Math.round(10 - (4 * lowestMastery));
    questLength = Math.max(6, Math.min(10, questLength));
    return res.status(200).json({ student_id: studentId, identified_weakness: rootCauseTopic, symptom_topic: weakestTopic, mastery_score: lowestMastery.toFixed(2), quest_length: questLength, failed_skills: Array.from(masteryScores[rootCauseTopic]?.failedSkills || []), ai_prompt_context: `Student is struggling with ${rootCauseTopic}. Symptoms observed in ${weakestTopic}.` });
  } catch (error) {
    console.error('[handlers] BKT Analysis Error:', error);
    return res.status(500).json({ error: 'Failed to analyze cognitive weaknesses' });
  }
}

// ─── HANDLER: /api/generate-exam ─────────────────────────────────────────────

const GE_SYSTEM_PROMPT = `You are a Singapore MOE-aligned exam paper generator. Return ONLY a JSON array of question objects. No markdown, no commentary. Use Singapore context. Age-appropriate for target Primary level.`;

function buildGEPrompt(section, subject, level, count) {
  const types = { mcq: 'MCQ with 4 options (A/B/C/D), correct_answer letter, wrong_explanations.', short_ans: 'Short answer with correct_answer string and accept_also array.', word_problem: 'Word problem with 2-3 parts: label, question, marks, correct_answer, worked_solution.', open_ended: 'Open-ended with keywords array and CER model_answer.', cloze: 'Cloze with [N] blanks and blanks array (4 options, correct_answer letter).', editing: 'Editing passage_lines with exactly 1 error line (has_error: true).' };
  return `Generate ${count} ${subject} questions for ${level} students.\nSection: ${section.label||''} — ${section.title||''}\nType: ${section.questionType}\nMarks: ${section.marksPerQuestion||1}\n\nFormat: ${types[section.questionType]||'Standard schema.'}\nRequired: id, subject, level, topic, sub_topic, difficulty, type, marks, question_text, worked_solution (3+ steps).\n\nReturn ONLY JSON array of ${count} objects.`;
}

export async function handleGenerateExam(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { templateKey, subject, level, sections: requestedSections } = req.body || {};
    if (!templateKey || !subject || !level) return res.status(400).json({ error: 'Missing templateKey, subject, level' });
    if (!['Mathematics','Science','English'].includes(subject)) return res.status(400).json({ error: 'Invalid subject' });
    if (!['Primary 3','Primary 4','Primary 5','Primary 6'].includes(level)) return res.status(400).json({ error: 'Invalid level' });
    const sections = (Array.isArray(requestedSections) && requestedSections.length > 0) ? requestedSections : [{ label: 'Section A', title: 'Multiple Choice', questionType: 'mcq', marksPerQuestion: 2, questionCount: 5 }];
    const generatedSections = [];
    let totalMarks = 0;
    for (const sec of sections) {
      const count = Math.min(Math.max(1, parseInt(sec.questionCount,10)||5), 15);
      let responseText, provider;
      try {
        responseText = await callAI('exam_gen', { systemPrompt: GE_SYSTEM_PROMPT, userPrompt: buildGEPrompt(sec, subject, level, count), temperature: 0.45, maxTokens: 4096, responseFormat: 'json' });
        provider = AI_ROUTING.exam_gen.provider;
      } catch (e) {
        console.error('[generate-exam] primary failed, falling back to Anthropic Haiku:', e.message);
        responseText = await callClaudeRaw(GE_SYSTEM_PROMPT, buildGEPrompt(sec, subject, level, count), { maxTokens: 4096, model: 'claude-haiku-4-5-20251001' });
        provider = 'anthropic-haiku';
      }
      const questions    = parseJsonArray(responseText);
      const sectionMarks = questions.reduce((s, q) => s + (q.marks || sec.marksPerQuestion || 1), 0);
      totalMarks += sectionMarks;
      generatedSections.push({ label: sec.label||'Section', title: sec.title||'', instructions: sec.instructions||'', questionType: sec.questionType, sectionMarks, questions: questions.map(q => ({ ...q, source: 'ai', aiProvider: provider })) });
    }
    return res.status(200).json({ templateKey, subject, level, sections: generatedSections, totalMarks, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[generate-exam] Error:', err.message || err);
    return res.status(500).json({ error: 'Failed to generate exam paper.' });
  }
}

// ─── HANDLER: /api/portal ─────────────────────────────────────────────────────

export async function handlePortal(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Billing portal not configured.' });
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorised' });
    const adminDb = getAdminClient();
    const { data: profile } = await adminDb.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
    if (!profile?.stripe_customer_id) return res.status(400).json({ error: 'No billing account found. Complete a checkout first.' });
    const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' });
    const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'https://www.superholiclab.com';
    const session = await stripe.billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${appUrl}/pages/account.html` });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[portal] Error:', err?.message || err);
    return res.status(500).json({ error: `Stripe portal error: ${err?.message || 'Please try again.'}` });
  }
}

// ─── HANDLER: /api/admin ──────────────────────────────────────────────────────

export async function handleAdmin(req, res) {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorised — please log in' });
  const adminDb = getAdminClient();
  const { data: caller, error: callerErr } = await adminDb.from('profiles').select('role').eq('id', user.id).single();
  if (callerErr || !caller || !['admin', 'sub-admin'].includes(caller.role)) return res.status(403).json({ error: 'Forbidden — admin or sub-admin role required' });

  if (req.method === 'GET') {
    const [profilesRes, studentsRes, subsRes, recentActivityRes, lastActRes, contactRes, qaRes] = await Promise.all([
      adminDb.from('profiles').select('id, email, full_name, role, subscription_tier, stripe_customer_id, trial_ends_at, max_children, created_at, pause_scheduled, pause_resume_at').order('created_at', { ascending: false }),
      adminDb.from('students').select('id, parent_id, name, level, created_at').order('created_at', { ascending: false }),
      adminDb.from('subscriptions').select('id, profile_id, stripe_subscription_id, stripe_price_id, plan_name, billing_cycle, status, current_period_end, paused_at, resumes_at, created_at').in('status', ['active', 'past_due', 'paused', 'cancelled']),
      adminDb.from('quiz_attempts').select('student_id, subject, score, total_questions, completed_at').order('completed_at', { ascending: false }).limit(20),
      adminDb.from('quiz_attempts').select('student_id, completed_at').order('completed_at', { ascending: false }).limit(2000),
      adminDb.from('contact_submissions').select('id').eq('status', 'pending'),
      // QA queue count for the admin pulse card (pending = approved_at IS NULL)
      adminDb.from('question_bank').select('id', { count: 'exact', head: true }).is('approved_at', null),
    ]);

    const students = studentsRes.data || [];
    const studentParentMap = {};
    students.forEach(s => { studentParentMap[s.id] = s.parent_id; });

    const lastActivityByParent = {};
    (lastActRes.data || []).forEach(a => {
      const pid = studentParentMap[a.student_id];
      if (pid && !lastActivityByParent[pid]) lastActivityByParent[pid] = a.completed_at;
    });

    const subscriptionsByProfile = {};
    (subsRes.data || []).forEach(s => { subscriptionsByProfile[s.profile_id] = s; });

    const priceMap = getPriceTypeMap();
    const breakdown = {
      all_subjects_monthly: { count: 0, gross_mrr: 0, net_mrr: 0 },
      all_subjects_annual:  { count: 0, gross_mrr: 0, net_mrr: 0 },
      family_monthly:       { count: 0, gross_mrr: 0, net_mrr: 0 },
      family_annual:        { count: 0, gross_mrr: 0, net_mrr: 0 },
      past_due:             { count: 0 },
      paused:               { count: 0 },
    };
    (subsRes.data || []).forEach(s => {
      if (s.status === 'past_due') { breakdown.past_due.count++; return; }
      if (s.status === 'paused')   { breakdown.paused.count++;   return; }
      if (s.status !== 'active')   return;
      const pt = priceMap[s.stripe_price_id];
      if (!pt) return;
      const key = `${pt.plan}_${pt.cycle}`;
      if (breakdown[key]) { breakdown[key].count++; breakdown[key].gross_mrr += pt.mrr; breakdown[key].net_mrr += pt.mrr - estimateStripeFee(pt.cycle, pt.mrr); }
    });

    const profileEmailMap = {};
    (profilesRes.data || []).forEach(p => { profileEmailMap[p.id] = p.full_name || p.email; });
    const studentNameMap = {};
    students.forEach(s => { studentNameMap[s.id] = { name: s.name, parentId: s.parent_id }; });
    const recentActivity = (recentActivityRes.data || []).map(a => {
      const stu = studentNameMap[a.student_id] || {};
      return { student_name: stu.name || 'Unknown', parent_name: stu.parentId ? profileEmailMap[stu.parentId] : 'Unknown', subject: a.subject, score: a.score, total: a.total_questions, completed_at: a.completed_at };
    });

    return res.status(200).json({
      profiles:                profilesRes.data || [],
      students,
      subscriptions:           subsRes.data || [],
      subscriptions_by_profile: subscriptionsByProfile,
      last_activity_by_parent: lastActivityByParent,
      subscription_breakdown:  breakdown,
      recent_activity:         recentActivity,
      contact_pending:         (contactRes.data || []).length,
      qa_pending:              qaRes.count || 0,
    });
  }

  if (req.method === 'POST') {
    const { action, userId, tier } = req.body || {};
    if (action === 'update_tier') {
      if (!userId || !tier) return res.status(400).json({ error: 'userId and tier are required' });
      const validTiers = ['trial', 'all_subjects', 'family', 'single_subject', 'paused'];
      if (!validTiers.includes(tier)) return res.status(400).json({ error: 'Invalid tier value' });
      const { error } = await adminDb.from('profiles').update({ subscription_tier: tier, max_children: tier === 'family' ? 3 : 1, updated_at: new Date().toISOString() }).eq('id', userId);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }
    if (action === 'delete_user') {
      if (caller.role === 'sub-admin') return res.status(403).json({ error: 'Sub-admins cannot delete accounts' });
      if (!userId) return res.status(400).json({ error: 'userId is required' });
      await adminDb.from('students').delete().eq('parent_id', userId);
      await adminDb.from('subscriptions').delete().eq('profile_id', userId);
      const { error } = await adminDb.from('profiles').delete().eq('id', userId);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({ error: `Unknown action: ${action || '(none)'}` });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ─── HANDLER: /api/pause ──────────────────────────────────────────────────────

export async function handlePause(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorised' });
    const { action, resumeAt } = req.body || {};
    if (!action) return res.status(400).json({ error: 'action is required' });
    const adminDb = getAdminClient();
    const { data: sub } = await adminDb.from('subscriptions').select('stripe_subscription_id, stripe_price_id, billing_cycle, status, current_period_end').eq('profile_id', user.id).in('status', ['active', 'paused']).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!sub?.stripe_subscription_id) return res.status(400).json({ error: 'No active subscription found.' });
    if (isAnnualPriceId(sub.stripe_price_id) || sub.billing_cycle === 'annual') return res.status(400).json({ error: 'Pause is not available for annual subscriptions. Please contact us.' });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' });
    if (action === 'schedule') {
      if (!resumeAt) return res.status(400).json({ error: 'resumeAt date is required.' });
      const resumeDate = new Date(resumeAt);
      if (isNaN(resumeDate.getTime()) || resumeDate <= new Date()) return res.status(400).json({ error: 'resumeAt must be a valid future date.' });
      await adminDb.from('profiles').update({ pause_scheduled: true, pause_resume_at: resumeDate.toISOString() }).eq('id', user.id);
      const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
      return res.status(200).json({ success: true, pause_activates_at: periodEnd?.toISOString() || null, resumes_at: resumeDate.toISOString(), message: `Your subscription will pause on ${periodEnd?.toLocaleDateString('en-SG')} and resume on ${resumeDate.toLocaleDateString('en-SG')}.` });
    }
    if (action === 'cancel') {
      await adminDb.from('profiles').update({ pause_scheduled: false, pause_resume_at: null }).eq('id', user.id);
      return res.status(200).json({ success: true, message: 'Pause schedule cancelled. Your subscription will continue normally.' });
    }
    if (action === 'resume_now') {
      try { const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id); if (stripeSub.pause_collection) await stripe.subscriptions.update(sub.stripe_subscription_id, { pause_collection: '' }); } catch (e) { console.error('[pause] Stripe resume error:', e.message); }
      const priceInfo = getPriceTypeMap()[sub.stripe_price_id];
      await adminDb.from('profiles').update({ subscription_tier: priceInfo?.plan || 'all_subjects', pause_scheduled: false, pause_resume_at: null }).eq('id', user.id);
      await adminDb.from('subscriptions').update({ paused_at: null, resumes_at: null, status: 'active' }).eq('stripe_subscription_id', sub.stripe_subscription_id);
      return res.status(200).json({ success: true, message: 'Your subscription has been resumed. Billing restarts from today.' });
    }
    return res.status(400).json({ error: 'Invalid action. Use: schedule | cancel | resume_now' });
  } catch (err) {
    console.error('[pause] Error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to update pause settings.' });
  }
}

// ─── HANDLER: /api/referral ───────────────────────────────────────────────────

export async function handleReferral(req, res) {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorised' });
  const adminDb = getAdminClient();
  if (req.method === 'GET') {
    const [profileRes, referralsRes] = await Promise.all([
      adminDb.from('profiles').select('referral_code, referral_credits_earned').eq('id', user.id).single(),
      adminDb.from('referrals').select('status, referred_at, subscribed_at, credited_at').eq('referrer_id', user.id),
    ]);
    let code = profileRes.data?.referral_code;
    if (!code) { code = (user.id.replace(/-/g, '').slice(0, 8)).toUpperCase(); await adminDb.from('profiles').update({ referral_code: code }).eq('id', user.id); }
    const referrals = referralsRes.data || [];
    return res.status(200).json({ referral_code: code, referral_url: `https://www.superholiclab.com/pages/signup.html?ref=${code}`, credits_earned: profileRes.data?.referral_credits_earned || 0, total_referred: referrals.length, total_subscribed: referrals.filter(r => ['subscribed','credited'].includes(r.status)).length, pending_count: referrals.filter(r => r.status === 'pending').length });
  }
  if (req.method === 'POST') {
    const { action, referral_code } = req.body || {};
    if (action === 'validate' && referral_code) {
      const { data: referrer } = await adminDb.from('profiles').select('id, full_name, referral_code').eq('referral_code', referral_code.toUpperCase().trim()).maybeSingle();
      if (!referrer || referrer.id === user.id) return res.status(200).json({ valid: false });
      const { data: existing } = await adminDb.from('referrals').select('id').eq('referred_id', user.id).maybeSingle();
      if (!existing) await adminDb.from('referrals').insert({ referrer_id: referrer.id, referred_id: user.id, referral_code: referral_code.toUpperCase().trim(), status: 'pending' });
      return res.status(200).json({ valid: true });
    }
    return res.status(400).json({ error: 'Invalid action.' });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ─── HANDLER: /api/analytics ─────────────────────────────────────────────────

export async function handleAnalytics(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorised' });
  const adminDb = getAdminClient();
  const { data: caller } = await adminDb.from('profiles').select('role').eq('id', user.id).single();
  if (!caller || !['admin','sub-admin'].includes(caller.role)) return res.status(403).json({ error: 'Forbidden' });
  const urlParts = (req.url || '').split('?');
  const params   = new URLSearchParams(urlParts[1] || '');
  const period   = ['7d','30d','6mo','12mo'].includes(params.get('period')) ? params.get('period') : '30d';
  const apiKey = process.env.PLAUSIBLE_API_KEY;
  const domain = process.env.PLAUSIBLE_DOMAIN || 'superholiclab.com';
  if (!apiKey) return res.status(500).json({ error: 'PLAUSIBLE_API_KEY not configured.' });
  const h = { 'Authorization': `Bearer ${apiKey}` };
  const base = 'https://plausible.io/api/v1/stats';
  try {
    const [aggRes, timeRes, evtRes] = await Promise.all([
      fetch(`${base}/aggregate?site_id=${domain}&period=${period}&metrics=visitors,pageviews,bounce_rate,visit_duration`, { headers: h }),
      fetch(`${base}/timeseries?site_id=${domain}&period=${period}&metrics=visitors`, { headers: h }),
      fetch(`${base}/breakdown?site_id=${domain}&period=${period}&property=event:name&metrics=events,visitors`, { headers: h }),
    ]);
    const [agg, time, evt] = await Promise.all([aggRes.json(), timeRes.json(), evtRes.json()]);
    return res.status(200).json({ period, aggregate: agg.results || {}, timeseries: time.results || [], events: evt.results || [] });
  } catch (err) {
    console.error('[analytics] Plausible error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch analytics data.' });
  }
}

// ─── HANDLER: /api/account-delete ────────────────────────────────────────────

export async function handleAccountDelete(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorised' });
    const { confirmation } = req.body || {};
    if (confirmation !== 'DELETE') return res.status(400).json({ error: 'Type DELETE to confirm account deletion.' });
    const adminDb = getAdminClient();
    const { data: profile } = await adminDb.from('profiles').select('stripe_customer_id').eq('id', user.id).maybeSingle();
    if (profile?.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
      try { const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' }); const activeSubs = await stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: 'active', limit: 10 }); for (const s of activeSubs.data) await stripe.subscriptions.cancel(s.id); } catch (e) { console.error('[account-delete] Stripe cancel:', e.message); }
    }
    const { data: students } = await adminDb.from('students').select('id').eq('parent_id', user.id);
    const studentIds = (students || []).map(s => s.id);
    if (studentIds.length > 0) {
      const { data: attempts } = await adminDb.from('quiz_attempts').select('id').in('student_id', studentIds);
      const attemptIds = (attempts || []).map(a => a.id);
      if (attemptIds.length > 0) await adminDb.from('question_attempts').delete().in('quiz_attempt_id', attemptIds);
      await adminDb.from('quiz_attempts').delete().in('student_id', studentIds);
      await adminDb.from('study_notes').delete().in('student_id', studentIds);
      await adminDb.from('daily_usage').delete().in('student_id', studentIds);
      await adminDb.from('students').delete().eq('parent_id', user.id);
    }
    await adminDb.from('referrals').delete().or(`referrer_id.eq.${user.id},referred_id.eq.${user.id}`);
    await adminDb.from('subscriptions').delete().eq('profile_id', user.id);
    await adminDb.from('profiles').delete().eq('id', user.id);
    const { error: authErr } = await adminDb.auth.admin.deleteUser(user.id);
    if (authErr) console.error('[account-delete] Auth delete error:', authErr.message);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[account-delete] Error:', err.message);
    return res.status(500).json({ error: 'Account deletion failed. Please contact support at linzy@superholiclab.com.' });
  }
}

// ─── HANDLER: /api/export ─────────────────────────────────────────────────────

export async function handleExport(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorised' });
    const adminDb = getAdminClient();
    const { data: students } = await adminDb.from('students').select('id, name, level, created_at').eq('parent_id', user.id);
    const studentIds = (students || []).map(s => s.id);
    const [profileRes, subsRes, quizRes, referralRes] = await Promise.all([
      adminDb.from('profiles').select('id, email, full_name, subscription_tier, trial_started_at, trial_ends_at, created_at').eq('id', user.id).single(),
      adminDb.from('subscriptions').select('plan_name, billing_cycle, status, current_period_start, current_period_end').eq('profile_id', user.id),
      studentIds.length > 0 ? adminDb.from('quiz_attempts').select('subject, level, topic, score, total_questions, completed_at').in('student_id', studentIds).order('completed_at', { ascending: false }).limit(500) : Promise.resolve({ data: [] }),
      adminDb.from('referrals').select('status, referred_at, subscribed_at, credited_at').eq('referrer_id', user.id),
    ]);
    const exportData = { exported_at: new Date().toISOString(), pdpa_notice: 'This export contains all personal data Superholic Lab holds about your account, in compliance with the Singapore Personal Data Protection Act (PDPA).', profile: profileRes.data, students: students || [], subscriptions: subsRes.data || [], quiz_history: quizRes.data || [], referrals: referralRes.data || [] };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="superholiclab-my-data.json"');
    return res.status(200).json(exportData);
  } catch (err) {
    console.error('[export] Error:', err.message);
    return res.status(500).json({ error: 'Data export failed. Please try again.' });
  }
}

// ─── HANDLER: /api/admin-edit ─────────────────────────────────────────────────

export async function handleAdminEdit(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorised' });
  const adminDb = getAdminClient();
  const { data: caller } = await adminDb.from('profiles').select('role').eq('id', user.id).single();
  if (!caller || !['admin','sub-admin'].includes(caller.role)) return res.status(403).json({ error: 'Forbidden' });
  const { action, userId, studentId, data: editData } = req.body || {};
  if (action === 'update_parent') {
    if (!userId) return res.status(400).json({ error: 'userId is required.' });
    const { full_name, email } = editData || {};
    const profileUpdates = { updated_at: new Date().toISOString() };
    if (full_name?.trim()) profileUpdates.full_name = full_name.trim();
    if (email?.trim())     profileUpdates.email     = email.trim();
    const { error: profileErr } = await adminDb.from('profiles').update(profileUpdates).eq('id', userId);
    if (profileErr) return res.status(500).json({ error: profileErr.message });
    if (email?.trim()) { const { error: authErr } = await adminDb.auth.admin.updateUserById(userId, { email: email.trim() }); if (authErr) console.error('[admin-edit] Auth email update error:', authErr.message); }
    return res.status(200).json({ success: true });
  }
  if (action === 'update_student') {
    if (!studentId) return res.status(400).json({ error: 'studentId is required.' });
    const { name, level } = editData || {};
    const updates = {};
    if (name?.trim())  updates.name  = name.trim();
    if (level?.trim()) updates.level = level.trim();
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update.' });
    const { error } = await adminDb.from('students').update(updates).eq('id', studentId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }
  return res.status(400).json({ error: 'Invalid action. Use: update_parent | update_student' });
}

// ─── HANDLER: /api/contact ────────────────────────────────────────────────────

export async function handleContact(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name, email, topic, message } = req.body || {};
    if (!name?.trim())    return res.status(400).json({ error: 'Name is required.' });
    if (!email?.trim())   return res.status(400).json({ error: 'Email is required.' });
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ error: 'Please enter a valid email address.' });
    const adminDb = getAdminClient();
    const { error } = await adminDb.from('contact_submissions').insert({ name: name.trim().slice(0, 200), email: email.trim().toLowerCase().slice(0, 200), topic: (topic || 'General Inquiry').trim().slice(0, 100), message: message.trim().slice(0, 5000), status: 'pending' });
    if (error) throw error;
    console.log(`[contact] New submission from ${email.trim()}, topic: ${topic || 'General Inquiry'}`);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[contact] Error:', err.message);
    return res.status(500).json({ error: 'Failed to send message. Please email us directly at linzy@superholiclab.com.' });
  }
}

// ─── HANDLER: /api/qa-questions ───────────────────────────────────────────────
// Human-in-the-Loop QA Audit Panel for the question_bank table.
//
// GET    ?mode=pending|approved & subject= & level= & type= & topic= & limit= & offset=
//        Returns paginated questions filtered by is_ai_cloned status.
//        pending  = is_ai_cloned true  (needs human review)
//        approved = is_ai_cloned false (live for students)
//
// PUT    { id, fields: {...}, approve?: true|false }
//        approve:true  → publishes (sets is_ai_cloned=false)
//        approve:false → returns to queue (sets is_ai_cloned=true)
//        approve omitted → saves edits with no status change (Save Draft)
//
// DELETE { id }
//        Permanently removes the row from question_bank.
//
// Auth: admin or sub-admin Bearer token required on all methods.
// ─────────────────────────────────────────────────────────────────────────────

export async function handleQAQuestions(req, res) {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorised — please log in' });
  const adminDb = getAdminClient();
  const { data: caller } = await adminDb.from('profiles').select('role').eq('id', user.id).single();
  if (!caller || !['admin','sub-admin'].includes(caller.role)) return res.status(403).json({ error: 'Forbidden' });

  // ── GET: list questions ────────────────────────────────────────────────────
  // v3.0 (2026-04-26): pending = approved_at IS NULL (was: is_ai_cloned = true).
  // is_ai_cloned retained as pure provenance (origin) flag, no longer used for status.
  // New params: q (full-text search), has_diagram=yes|no (visual_payload filter).
  if (req.method === 'GET') {
    const urlParts = (req.url || '').split('?');
    const params   = new URLSearchParams(urlParts[1] || '');
    const mode        = params.get('mode') === 'approved' ? 'approved' : 'pending';
    const subject     = params.get('subject') || '';
    const level       = params.get('level')   || '';
    const type        = params.get('type')    || '';
    const topic       = params.get('topic')   || '';
    const q           = (params.get('q') || '').trim();
    const hasDiagram  = (params.get('has_diagram') || '').toLowerCase(); // 'yes' | 'no' | ''
    const limit       = Math.min(parseInt(params.get('limit')  || '100', 10), 500);
    const offset      = Math.max(parseInt(params.get('offset') || '0',   10), 0);

    let query = adminDb
      .from('question_bank')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Status filter
    if (mode === 'pending') query = query.is('approved_at', null);
    else                    query = query.not('approved_at', 'is', null);

    if (subject) query = query.eq('subject', subject);
    if (level)   query = query.eq('level', level);
    if (type)    query = query.eq('type', type);
    if (topic)   query = query.ilike('topic', `%${topic}%`);

    // Diagram filter (visual_payload jsonb is NULL for non-diagram questions)
    if (hasDiagram === 'yes') query = query.not('visual_payload', 'is', null);
    if (hasDiagram === 'no')  query = query.is('visual_payload', null);

    // Server-side full-text search across question_text, passage, topic, sub_topic, correct_answer.
    // Uses Supabase's `or` filter with ilike for case-insensitive substring match.
    if (q) {
      // Escape commas/parens in user input to keep PostgREST .or() syntax safe.
      const safe = q.replace(/[,()\\]/g, ' ');
      query = query.or(
        `question_text.ilike.%${safe}%,` +
        `passage.ilike.%${safe}%,` +
        `topic.ilike.%${safe}%,` +
        `sub_topic.ilike.%${safe}%,` +
        `correct_answer.ilike.%${safe}%`
      );
    }

    const { data, error, count } = await query;
    if (error) {
      console.error('[qa-questions] GET error:', error.message);
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ questions: data || [], total: count || 0, mode, offset, limit });
  }

  // ── PUT: update question ───────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { id, fields, approve } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });

    const ALLOWED_FIELDS = [
      'subject', 'level', 'topic', 'sub_topic', 'difficulty', 'marks',
      'cognitive_skill', 'question_text', 'correct_answer', 'worked_solution',
      'options', 'parts', 'wrong_explanations', 'type',
      'passage', 'passage_lines', 'blanks',
      'instructions', 'accept_also',
    ];

    const updates = { updated_at: new Date().toISOString() };
    if (fields && typeof fields === 'object') {
      for (const k of ALLOWED_FIELDS) {
        if (fields[k] !== undefined) updates[k] = fields[k];
      }
    }

    // approve=true  → publish (set approved_at = NOW(), question goes live)
    // approve=false → return to queue (set approved_at = NULL)
    // approve omitted → Save Draft, leave approved_at unchanged.
    // is_ai_cloned is now purely a provenance flag and is never modified here.
    if (approve === true)  updates.approved_at = new Date().toISOString();
    if (approve === false) updates.approved_at = null;

    const { error } = await adminDb.from('question_bank').update(updates).eq('id', id);
    if (error) {
      console.error('[qa-questions] PUT error:', error.message);
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true });
  }

  // ── DELETE: remove question ────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const { error } = await adminDb.from('question_bank').delete().eq('id', id);
    if (error) {
      console.error('[qa-questions] DELETE error:', error.message);
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed. Use GET, PUT, or DELETE.' });
}

// ─── HANDLER: /api/cron/auto-fill-bank (OpenAI Batch API) ──────────────────────

export async function handleAutoFillQuestionBank(req, res) {
  // 1. Security: Ensure this is only called by your secure Cron Job
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized Cron Execution' });
  }

  try {
    const adminDb = getAdminClient();
    
    // 2. GAP ANALYSIS: Query Supabase for topics with less than 20 questions
    // Note: In production, you'd use an RPC call or group by query here.
    // For this engine, we simulate finding the gaps:
    const { data: metrics, error: metricsErr } = await adminDb.rpc('get_question_bank_gaps', { minimum_threshold: 20 });
    
    if (metricsErr || !metrics) {
      console.warn("Could not fetch gaps, using fallback priority list.");
    }
    
    // Example gaps identified by the analyzer
    const targetGaps = metrics || [
      { subject: 'Mathematics', level: 'Primary 5', topic: 'Ratio', type: 'word_problem', difficulty: 'HOTS' },
      { subject: 'Science', level: 'Primary 6', topic: 'Energy', type: 'open_ended', difficulty: 'Standard' },
      { subject: 'English Language', level: 'Primary 4', topic: 'Cloze', type: 'cloze', difficulty: 'Advanced' }
    ];

    if (targetGaps.length === 0) return res.status(200).json({ message: 'Question bank is healthy. No gaps.' });

    // 3. BUILD JSONL FOR OPENAI BATCH API
    let jsonlContent = '';
    
    targetGaps.forEach((gap, index) => {
      // We order 5 questions per gap found
      const promptText = buildGenerateUserPrompt(gap.type, 5, gap.subject, gap.level, gap.topic, gap.difficulty);
      
      const batchRequest = {
        custom_id: `batch_gen_${Date.now()}_${index}`,
        method: "POST",
        url: "/v1/chat/completions",
        body: {
          model: "gpt-4o", // Must use flagship model for accurate schema/heuristics
          messages: [
            { role: "system", content: "You are an Expert Singapore MOE Curriculum Developer generating data for a PostgreSQL database." },
            { role: "user", content: promptText }
          ],
          temperature: 0.4,
          max_tokens: 8000,
          response_format: { type: "json_object" } // Enforce JSON
        }
      };
      
      jsonlContent += JSON.stringify(batchRequest) + '\n';
    });

    // 4. UPLOAD TO OPENAI
    // In a full implementation, you write the jsonlContent to a tmp file, upload via openai.files.create(),
    // and then trigger openai.batches.create(). 
    // Example pseudo-code for the SDK:
    /*
      const file = await openai.files.create({ file: fs.createReadStream('gaps.jsonl'), purpose: "batch" });
      const batch = await openai.batches.create({ input_file_id: file.id, endpoint: "/v1/chat/completions", completion_window: "24h" });
    */

    return res.status(200).json({ 
      message: 'Batch generation job compiled.', 
      gapsTargeted: targetGaps.length,
      status: 'Awaiting File Upload & Batch Execution' 
    });

  } catch (err) {
    console.error('[auto-fill-bank] Error:', err.message);
    return res.status(500).json({ error: 'Failed to trigger batch job.' });
  }
}

// ─── HANDLER: /api/cron/ingest-batch-results ──────────────────────────────────

export async function handleIngestBatchResults(req, res) {
  // 1. Feature Flag & Security Check
  if (process.env.ENABLE_AUTO_GENERATE !== 'true') {
    return res.status(200).json({ message: 'Auto-generation is disabled via feature flag.' });
  }
  
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { batch_id } = req.body || {};
  if (!batch_id) return res.status(400).json({ error: 'Missing batch_id parameter' });

  try {
    const adminDb = getAdminClient();
    
    // 2. Fetch the completed Batch object from OpenAI
    const batchInfo = await openai.batches.retrieve(batch_id);
    
    if (batchInfo.status !== 'completed' || !batchInfo.output_file_id) {
      return res.status(200).json({ message: `Batch ${batch_id} is currently: ${batchInfo.status}` });
    }

    // 3. Download the completed JSONL file
    const fileResponse = await openai.files.content(batchInfo.output_file_id);
    const fileContent = await fileResponse.text();

    // 4. Parse the JSONL payload
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    const newQuestions = [];

    lines.forEach(line => {
      try {
        const record = JSON.parse(line);
        // Extract the generated JSON array from the OpenAI response
        const generatedContent = record.response.body.choices[0].message.content;
        const questionsArray = JSON.parse(generatedContent);
        
        questionsArray.forEach(q => {
          // Prepare for Supabase insert, ensuring arrays are stringified
          newQuestions.push({
            subject: q.subject,
            level: q.level,
            topic: q.topic,
            sub_topic: q.sub_topic || null,
            cognitive_skill: q.cognitive_skill || 'Factual Recall',
            difficulty: q.difficulty || 'Standard',
            type: q.type || 'mcq',
            marks: q.marks || 1,
            question_text: q.question_text || '',
            options: q.options ? JSON.stringify(q.options) : null,
            correct_answer: q.correct_answer || null,
            wrong_explanations: q.wrong_explanations ? JSON.stringify(q.wrong_explanations) : null,
            worked_solution: q.worked_solution || null,
            is_ai_cloned: true // Flag so you can filter/audit AI questions later
          });
        });
      } catch (parseErr) {
        console.warn('Skipping unparseable batch line:', parseErr.message);
      }
    });

    // 5. Bulk Insert into Database
    if (newQuestions.length > 0) {
      const { error: insertErr } = await adminDb.from('question_bank').insert(newQuestions);
      if (insertErr) throw insertErr;
    }

    return res.status(200).json({ 
      success: true, 
      questions_ingested: newQuestions.length 
    });

  } catch (err) {
    console.error('[ingest-batch] Error:', err.message);
    return res.status(500).json({ error: 'Failed to ingest batch results.' });
  }
}

// ─── XP system ───────────────────────────────────────────────────────────────

const XP_MAX = {
  quest_step_complete: 75,
  quest_complete:      150,
  quiz_complete:       50,
  badge_earned:        100,
  login_streak:        20,
  mastery_gain:        40,
};

/**
 * Awards XP with idempotency via event_id stored in xp_events.metadata.
 * Upserts student_xp total + level. Returns { totalXpBefore, totalXpAfter, levelData }
 * or null if duplicate.
 */
async function grantXP(adminDb, { studentId, eventType, xpAmount, metadata = {}, eventId }) {
  if (eventId) {
    const { data: existing } = await adminDb.from('xp_events')
      .select('id')
      .eq('student_id', studentId)
      .filter('metadata->>event_id', 'eq', eventId)
      .maybeSingle();
    if (existing) return null;
  }
  const cap      = XP_MAX[eventType] ?? 50;
  const awarded  = Math.min(xpAmount, cap);
  const { data: xpRow } = await adminDb.from('student_xp')
    .select('total_xp, current_level')
    .eq('student_id', studentId)
    .maybeSingle();
  const totalXpBefore = xpRow?.total_xp || 0;
  const totalXpAfter  = totalXpBefore + awarded;
  const newLevel      = xpToLevel(totalXpAfter);
  await adminDb.from('xp_events').insert({
    student_id: studentId,
    event_type: eventType,
    xp_awarded: awarded,
    metadata:   { ...metadata, ...(eventId ? { event_id: eventId } : {}) },
  });
  await adminDb.from('student_xp').upsert({
    student_id:    studentId,
    total_xp:      totalXpAfter,
    current_level: newLevel,
    xp_in_level:   xpInCurrentLevel(totalXpAfter, newLevel),
    updated_at:    new Date().toISOString(),
  }, { onConflict: 'student_id' });
  return { totalXpBefore, totalXpAfter, levelData: evaluateLevelUp({ totalXpBefore, totalXpAfter }) };
}

export async function handleAwardXP(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorised' });
    const { student_id, event_type, xp_amount, metadata, event_id } = req.body || {};
    if (!student_id || !event_type || xp_amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const adminDb = getAdminClient();
    const { data: student } = await adminDb.from('students').select('parent_id').eq('id', student_id).single();
    if (!student || student.parent_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
    const result = await grantXP(adminDb, {
      studentId: student_id,
      eventType: event_type,
      xpAmount:  xp_amount,
      metadata:  metadata || {},
      eventId:   event_id,
    });
    if (!result) return res.status(200).json({ duplicate: true });
    const badges = await evaluateBadges({
      studentId:     student_id,
      eventType:     event_type,
      eventMetadata: metadata || {},
      db:            adminDb,
    });
    return res.status(200).json({ ...result, badges_earned: badges });
  } catch (err) {
    console.error('[award-xp] Error:', err.message);
    return res.status(500).json({ error: 'Failed to award XP.' });
  }
}

// ─── SGT midnight gate ────────────────────────────────────────────────────────

/**
 * Returns unlock status per step index.
 * Step N+1 is unlocked when midnight SGT has passed since dayCompletedAt[N].
 */
function computeDayUnlockStatus(dayCompletedAt = {}) {
  const sgNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));

  function midnightSGTAfter(isoTimestamp) {
    const sgDone = new Date(new Date(isoTimestamp).toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
    const next   = new Date(sgDone);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  const status = {};
  for (let step = 0; step <= 2; step++) {
    const isCompleted = !!dayCompletedAt[String(step)];
    if (step === 0) { status[step] = { unlocked: true, completed: isCompleted }; continue; }
    const prevTs = dayCompletedAt[String(step - 1)];
    if (!prevTs) { status[step] = { unlocked: false, completed: false, reason: 'previous_step_incomplete' }; continue; }
    const unlockAt = midnightSGTAfter(prevTs);
    if (sgNow >= unlockAt) {
      status[step] = { unlocked: true, completed: isCompleted };
    } else {
      status[step] = { unlocked: false, completed: isCompleted, reason: 'midnight_gate', unlocks_at: unlockAt.toISOString() };
    }
  }
  return status;
}

// ─── Quest sub-handlers ───────────────────────────────────────────────────────

async function listQuests(req, res) {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorised' });
  const { student_id, status } = req.query || {};
  if (!student_id) return res.status(400).json({ error: 'Missing student_id' });
  const adminDb = getAdminClient();
  const { data: student } = await adminDb.from('students').select('parent_id').eq('id', student_id).single();
  if (!student || student.parent_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
  let q = adminDb.from('remedial_quests')
    .select('id, subject, topic, level, status, current_step, quest_title, trigger_score, day3_outcome, created_at, day_completed_at')
    .eq('student_id', student_id)
    .order('created_at', { ascending: false })
    .limit(20);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return res.status(200).json({ quests: data || [] });
}

async function fetchQuest(req, res, questId) {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorised' });
  const adminDb = getAdminClient();
  const { data: quest, error } = await adminDb.from('remedial_quests')
    .select('*, students!inner(parent_id, name, level)')
    .eq('id', questId)
    .single();
  if (error || !quest) return res.status(404).json({ error: 'Quest not found' });
  if (quest.students.parent_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
  const dayUnlockStatus = computeDayUnlockStatus(quest.day_completed_at || {});
  const { students: _s, ...questData } = quest;
  return res.status(200).json({ quest: questData, day_unlock_status: dayUnlockStatus });
}

async function advanceQuestStep(req, res, questId) {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorised' });
  const { step_index, score, wrong_attempts } = req.body || {};
  if (step_index === undefined || step_index === null) return res.status(400).json({ error: 'Missing step_index' });
  const adminDb = getAdminClient();
  const { data: quest, error: fetchErr } = await adminDb.from('remedial_quests')
    .select('*, students!inner(parent_id, name, level)')
    .eq('id', questId)
    .single();
  if (fetchErr || !quest) return res.status(404).json({ error: 'Quest not found' });
  if (quest.students.parent_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
  if (quest.status !== 'active') return res.status(409).json({ error: 'Quest is not active', status: quest.status });

  // Idempotency: already completed this step
  if (step_index < quest.current_step) return res.status(200).json({ quest, already_completed: true });

  // SGT midnight gate
  const dayUnlockStatus = computeDayUnlockStatus(quest.day_completed_at || {});
  if (!dayUnlockStatus[step_index]?.unlocked) {
    return res.status(403).json({ error: 'step_locked', ...dayUnlockStatus[step_index] });
  }

  const now        = new Date().toISOString();
  const isLastStep = step_index === 2;
  const newDayCompletedAt = { ...(quest.day_completed_at || {}), [String(step_index)]: now };

  const updatePayload = {
    day_completed_at: newDayCompletedAt,
    current_step:     isLastStep ? quest.current_step : step_index + 1,
    updated_at:       now,
  };

  // Day 1: capture wrong answers for Day 2 Socratic prompt
  if (step_index === 0 && Array.isArray(wrong_attempts)) {
    updatePayload.day1_wrong_attempts = wrong_attempts;
  }

  // Day 3: three-way outcome branching
  let outcomePending = false;
  if (isLastStep) {
    const numScore = Number(score ?? 0);
    updatePayload.day3_score = numScore;
    if (numScore >= 85) {
      updatePayload.day3_outcome = 'mastered';
      updatePayload.status       = 'completed';
    } else if (numScore >= 70) {
      updatePayload.day3_outcome = 'slight_improvement';
      updatePayload.status       = 'completed';
    } else {
      outcomePending = true; // student picks via day3-outcome endpoint
    }
  }

  const { data: updatedQuest, error: updateErr } = await adminDb.from('remedial_quests')
    .update(updatePayload)
    .eq('id', questId)
    .select('*')
    .single();
  if (updateErr) throw updateErr;

  // Free eligibility slot on completion
  if (updatePayload.status === 'completed') {
    await adminDb.from('quest_eligibility')
      .delete()
      .eq('student_id', quest.student_id)
      .eq('subject', quest.subject);
  }

  // XP grant (50 per step, 100 for final)
  const xpResult = await grantXP(adminDb, {
    studentId: quest.student_id,
    eventType: isLastStep ? 'quest_complete' : 'quest_step_complete',
    xpAmount:  isLastStep ? 100 : 50,
    metadata:  { step_index, quest_id: questId, score: score ?? null, outcome: updatePayload.day3_outcome },
    eventId:   `quest_step_${questId}_${step_index}`,
  });

  const badgesEarned = await evaluateBadges({
    studentId:     quest.student_id,
    eventType:     isLastStep ? 'quest_complete' : 'quest_step_complete',
    eventMetadata: { step_index, quest_id: questId, score: score ?? null, outcome: updatePayload.day3_outcome, parent_quest_id: quest.parent_quest_id },
    db:            adminDb,
  });

  return res.status(200).json({
    quest:             updatedQuest,
    outcome_pending:   outcomePending,
    xp:                xpResult,
    badges_earned:     badgesEarned,
    day_unlock_status: computeDayUnlockStatus(newDayCompletedAt),
  });
}

async function day3Outcome(req, res, questId) {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorised' });
  const { outcome } = req.body || {};
  const ALLOWED = ['redo', 'slight_improvement', 'no_improvement'];
  if (!ALLOWED.includes(outcome)) return res.status(400).json({ error: 'Invalid outcome', allowed: ALLOWED });
  const adminDb = getAdminClient();
  const { data: quest, error: fetchErr } = await adminDb.from('remedial_quests')
    .select('student_id, subject, status, day3_score, parent_quest_id, students!inner(parent_id)')
    .eq('id', questId)
    .single();
  if (fetchErr || !quest) return res.status(404).json({ error: 'Quest not found' });
  if (quest.students.parent_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
  if (quest.status !== 'active') return res.status(409).json({ error: 'Quest is not active' });
  if ((quest.day3_score ?? 100) >= 70) return res.status(409).json({ error: 'Outcome already auto-determined' });

  const now = new Date().toISOString();
  const updatePayload = {
    day3_outcome: outcome,
    status:       outcome === 'redo' ? 'active' : 'completed',
    updated_at:   now,
  };

  if (outcome !== 'redo') {
    await adminDb.from('quest_eligibility')
      .delete()
      .eq('student_id', quest.student_id)
      .eq('subject', quest.subject);
  }

  const { data: updatedQuest, error: updateErr } = await adminDb.from('remedial_quests')
    .update(updatePayload)
    .eq('id', questId)
    .select('*')
    .single();
  if (updateErr) throw updateErr;

  const badgesEarned = await evaluateBadges({
    studentId:     quest.student_id,
    eventType:     'quest_complete',
    eventMetadata: { outcome, quest_id: questId, parent_quest_id: quest.parent_quest_id },
    db:            adminDb,
  });

  return res.status(200).json({ quest: updatedQuest, badges_earned: badgesEarned });
}

async function abandonQuest(req, res, questId) {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorised' });
  const adminDb = getAdminClient();
  const { data: quest, error: fetchErr } = await adminDb.from('remedial_quests')
    .select('student_id, subject, status, students!inner(parent_id)')
    .eq('id', questId)
    .single();
  if (fetchErr || !quest) return res.status(404).json({ error: 'Quest not found' });
  if (quest.students.parent_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
  if (quest.status !== 'active') return res.status(409).json({ error: 'Quest is not active', status: quest.status });
  const now = new Date().toISOString();
  await adminDb.from('remedial_quests')
    .update({ status: 'abandoned', abandoned_at: now, updated_at: now })
    .eq('id', questId);
  await adminDb.from('quest_eligibility')
    .delete()
    .eq('student_id', quest.student_id)
    .eq('subject', quest.subject);
  return res.status(200).json({ abandoned: true });
}

// Maps the slug subject form ('english') to the canonical question_bank.subject
// value. English is the only subject where the column value diverges from the
// slug (column stores 'English Language'); Mathematics and Science are direct.
const SUBJECT_DB_NAME = {
  english:     'English Language',
  mathematics: 'Mathematics',
  science:     'Science',
};
function _toDbSubject(safeSubject) {
  const key = String(safeSubject || '').toLowerCase();
  return SUBJECT_DB_NAME[key]
      || (safeSubject ? safeSubject.charAt(0).toUpperCase() + safeSubject.slice(1) : safeSubject);
}

// Resolves the canonical topic name stored in question_bank.
// Handles slug-to-title mismatches (e.g. "synthesis" → "Synthesis and Transformation")
// via a 4-step cascade: exact → normalised → title-cased → ilike keyword.
async function _resolveDbTopic(adminDb, subject, level, rawTopic) {
  if (!rawTopic) return rawTopic;
  const normalised = rawTopic.replace(/-/g, ' ').trim();

  const _hasRows = async (topic) => {
    const { count } = await adminDb.from('question_bank')
      .select('id', { count: 'exact', head: true })
      .eq('subject', subject).eq('level', level).eq('topic', topic);
    return (count || 0) > 0;
  };

  if (await _hasRows(normalised)) return normalised;

  const titled = normalised.replace(/\b\w/g, c => c.toUpperCase());
  if (titled !== normalised && await _hasRows(titled)) return titled;

  const keyword = normalised.split(' ')[0];
  const { data: m1 } = await adminDb.from('question_bank')
    .select('topic').eq('subject', subject).eq('level', level)
    .ilike('topic', `${keyword}%`).limit(1);
  if (m1?.length) return m1[0].topic;

  const { data: m2 } = await adminDb.from('question_bank')
    .select('topic').eq('subject', subject).eq('level', level)
    .ilike('topic', `%${keyword}%`).limit(1);
  if (m2?.length) return m2[0].topic;

  return normalised;
}

// Generates a balanced difficulty band array when stepCfg.difficulty_bands is empty.
function _defaultBands(level, count) {
  const isSenior = /primary [56]/i.test(level);
  const pool = isSenior
    ? ['Foundation', 'Standard', 'Standard', 'Advanced', 'Advanced', 'HOTS']
    : ['Foundation', 'Foundation', 'Standard', 'Standard', 'Advanced', 'Advanced'];
  const bands = [];
  while (bands.length < count) bands.push(pool[bands.length % pool.length]);
  return bands.slice(0, count);
}

async function questsBatch(req, res) {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorised' });
  const { quest_id, step_index } = req.body || {};
  if (!quest_id || step_index === undefined) return res.status(400).json({ error: 'Missing quest_id or step_index' });
  const adminDb = getAdminClient();
  const { data: quest, error: fetchErr } = await adminDb.from('remedial_quests')
    .select('subject, topic, level, steps, current_step, students!inner(parent_id)')
    .eq('id', quest_id)
    .single();
  if (fetchErr || !quest) return res.status(404).json({ error: 'Quest not found' });
  if (quest.students.parent_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
  if (step_index !== quest.current_step) {
    return res.status(409).json({ error: 'step_mismatch', current_step: quest.current_step });
  }

  const stepCfg        = (quest.steps || [])[step_index]?.config || {};
  const bands          = stepCfg.difficulty_bands || [];
  const transferTopics = stepCfg.transfer_topics  || [];
  const rawTopic       = stepCfg.topic || quest.topic;
  const targetCount    = stepCfg.question_count || (step_index === 0 ? 12 : 8);
  const dbSubject      = _toDbSubject(quest.subject);
  const dbLevel        = quest.level.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // All question_bank columns except audit/seed cols (seed_id, is_ai_cloned,
  // created_at, flag_review, updated_at, approved_at, difficulty_pre_019).
  const QUESTION_COLS = 'id, subject, level, topic, sub_topic, difficulty, type, marks, question_text, instructions, options, correct_answer, wrong_explanations, worked_solution, parts, keywords, model_answer, passage, blanks, passage_lines, examiner_note, progressive_hints, cognitive_skill, image_url, visual_payload, accept_also';

  // Resolve the true topic name in question_bank (handles slug/case mismatches)
  const dbTopic = await _resolveDbTopic(adminDb, dbSubject, dbLevel, rawTopic);

  // Use stored bands or generate a sensible default
  const effectiveBands = bands.length > 0 ? bands : _defaultBands(dbLevel, targetCount);
  const bandCounts = {};
  for (const b of effectiveBands) bandCounts[b] = (bandCounts[b] || 0) + 1;

  // Fetch per-difficulty; over-select (×3) then shuffle-slice for variety
  const questionSets = await Promise.all(
    Object.entries(bandCounts).map(async ([difficulty, count]) => {
      const { data } = await adminDb.from('question_bank')
        .select(QUESTION_COLS)
        .eq('subject', dbSubject)
        .eq('level', dbLevel)
        .eq('topic', dbTopic)
        .eq('difficulty', difficulty)
        .limit(count * 3);
      return (data || []).sort(() => Math.random() - 0.5).slice(0, count);
    })
  );

  let questions = questionSets.flat();

  // Fallback: top-up from same topic without difficulty filter when question bank is sparse
  // (common for English HOTS or thin P3/P4 topics)
  if (questions.length < targetCount) {
    const usedIds = questions.map(q => q.id);
    let topupQuery = adminDb.from('question_bank')
      .select(QUESTION_COLS)
      .eq('subject', dbSubject)
      .eq('level', dbLevel)
      .eq('topic', dbTopic)
      .order('created_at', { ascending: false })
      .limit((targetCount - questions.length) * 3);
    if (usedIds.length > 0) {
      topupQuery = topupQuery.not('id', 'in', `(${usedIds.join(',')})`);
    }
    const { data: extra } = await topupQuery;
    const topup = (extra || []).sort(() => Math.random() - 0.5).slice(0, targetCount - questions.length);
    questions = [...questions, ...topup];
  }

  // Transfer questions (Day 3 only) — one question per related topic
  const transferSets = await Promise.all(
    transferTopics.map(async (xferTopic) => {
      const xferDbTopic = await _resolveDbTopic(adminDb, dbSubject, dbLevel, xferTopic);
      const { data } = await adminDb.from('question_bank')
        .select(QUESTION_COLS)
        .eq('subject', dbSubject)
        .eq('level', dbLevel)
        .eq('topic', xferDbTopic)
        .limit(6);
      return (data || []).sort(() => Math.random() - 0.5).slice(0, 1);
    })
  );

  return res.status(200).json({ questions: [...questions, ...transferSets.flat()], step_config: stepCfg });
}

// ─── HANDLER: /api/quests router ─────────────────────────────────────────────

export async function handleQuestsRouter(req, res) {
  try {
    const reqUrl = new URL(req.url, 'http://localhost');
    const parts  = reqUrl.pathname.replace(/^\/api\/quests\/?/, '').split('/').filter(Boolean);
    const method = req.method.toUpperCase();

    // GET  /api/quests?student_id=X[&status=active]
    if (parts.length === 0 && method === 'GET') return listQuests(req, res);

    // POST /api/quests/quiz-batch
    if (parts.length === 1 && parts[0] === 'quiz-batch' && method === 'POST') return questsBatch(req, res);

    const questId = parts[0];
    if (!questId) return res.status(400).json({ error: 'Missing quest ID' });

    // GET  /api/quests/:id
    if (parts.length === 1 && method === 'GET') return fetchQuest(req, res, questId);

    const action = parts[1];

    // POST /api/quests/:id/advance-step
    if (action === 'advance-step'  && method === 'POST') return advanceQuestStep(req, res, questId);

    // POST /api/quests/:id/day3-outcome
    if (action === 'day3-outcome'  && method === 'POST') return day3Outcome(req, res, questId);

    // POST /api/quests/:id/abandon
    if (action === 'abandon'       && method === 'POST') return abandonQuest(req, res, questId);

    return res.status(404).json({ error: 'Unknown quest route' });
  } catch (err) {
    console.error('[quests-router] Error:', err.message);
    return res.status(500).json({ error: 'Quest operation failed.' });
  }
}