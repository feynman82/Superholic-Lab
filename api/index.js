/**
 * api/index.js
 * Single API gateway — routes all /api/* traffic to handlers in lib/api/handlers.js.
 * Vercel Hobby plan allows only 12 serverless functions; this file IS the only function.
 *
 * ROUTING: Vercel rewrites preserve the original source URL in req.url, so
 * /api/chat rewrites to /api/index but req.url remains "/api/chat".
 * We strip the "/api/" prefix to get the route key used in the switch below.
 *
 * BODY PARSING: bodyParser is disabled so the Stripe webhook handler can read
 * the raw request bytes for signature verification. Non-webhook routes get a
 * manually parsed JSON body attached to req.body before dispatch.
 */

import {
  handleChat,
  handleCheckout,
  handleWebhook,
  handleGenerate,
  handleGenerateQuestion,
  handleGenerateExam,
  handleGradeAnswer,
  handleSaveExamResult,
  handleGenerateQuest,
  handleAnalyzeWeakness,
  handleSummarizeChat
} from '../lib/api/handlers.js';

// Disable Vercel's auto body parsing — required for Stripe webhook raw body.
export const config = { api: { bodyParser: false } };

/**
 * Reads and JSON-parses the raw request body stream.
 * Returns an empty object on empty body or parse failure (safe default).
 */
async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk.toString(); });
    req.on('end', () => {
      if (!raw) { resolve({}); return; }
      try { resolve(JSON.parse(raw)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

/**
 * Main dispatcher — reads req.url, resolves route key, calls matching handler.
 */
export default async function handler(req, res) {
  // Extract route from original URL (Vercel preserves it through rewrites).
  // "/api/chat?foo=bar" → "chat"
  const path = (req.url || '').split('?')[0];
  const route = path.replace(/^\/api\//, '');

  // Webhook MUST receive unparsed raw body for Stripe signature verification.
  if (route === 'webhook') {
    return handleWebhook(req, res);
  }

  // All other routes: attach parsed JSON body then dispatch.
  try {
    req.body = await parseJsonBody(req);
  } catch (err) {
    console.error('[api/index] Body parse error:', err.message);
    req.body = {};
  }

  switch (route) {
    case 'chat':               return handleChat(req, res);
    case 'checkout':           return handleCheckout(req, res);
    case 'generate':           return handleGenerate(req, res);
    case 'generate-question':  return handleGenerateQuestion(req, res);
    case 'generate-exam':      return handleGenerateExam(req, res);
    case 'grade-answer':       return handleGradeAnswer(req, res);
    case 'save-exam-result':   return handleSaveExamResult(req, res);
    case 'generate-quest':     return handleGenerateQuest(req, res);
    case 'analyze-weakness':   return handleAnalyzeWeakness(req, res); 
    case 'summarize-chat':     return handleSummarizeChat(req, res);
    default:
      return res.status(404).json({ error: `API route not found: ${route}` });
  }
}

// TEST: Deploy to Vercel and verify:
//   POST /api/chat       → 200 with AI response
//   POST /api/checkout   → 200 with sessionId
//   POST /api/webhook    → 400 (missing Stripe sig header — expected)
//   POST /api/generate   → 200 with questions array
//   GET  /api/unknown    → 404 { error: "API route not found: unknown" }
