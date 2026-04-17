/**
 * api/index.js
 * Single API gateway — routes all /api/* traffic to handlers in lib/api/handlers.js.
 * Vercel Hobby plan allows only 12 serverless functions; this file IS the only function.
 */

import {
  handleChat,
  handleCheckout,
  handleWebhook,
  handlePortal,
  handleGenerate,
  handleGenerateQuestion,
  handleGenerateExam,
  handleGradeAnswer,
  handleSaveExamResult,
  handleGenerateQuest,
  handleAnalyzeWeakness,
  handleSummarizeChat,
  handleAdmin,
} from '../lib/api/handlers.js';

// Disable Vercel's auto body parsing — required for Stripe webhook raw body.
export const config = { api: { bodyParser: false } };

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

export default async function handler(req, res) {
  const path  = (req.url || '').split('?')[0];
  const route = path.replace(/^\/api\//, '');

  // Webhook MUST receive unparsed raw body for Stripe signature verification.
  if (route === 'webhook') {
    return handleWebhook(req, res);
  }

  // Admin GET requests have no body — parseJsonBody returns {} safely.
  try {
    req.body = await parseJsonBody(req);
  } catch (err) {
    console.error('[api/index] Body parse error:', err.message);
    req.body = {};
  }

  switch (route) {
    case 'chat':               return handleChat(req, res);
    case 'checkout':           return handleCheckout(req, res);
    case 'portal':             return handlePortal(req, res);
    case 'admin':              return handleAdmin(req, res);
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
