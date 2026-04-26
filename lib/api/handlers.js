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

// (handlers.js continues — full file content sent verbatim)
