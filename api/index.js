/**
 * api/index.js
 * Single API gateway — routes all /api/* traffic to handlers in lib/api/handlers.js.
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
  handlePause,
  handleReferral,
  handleAnalytics,
  handleAccountDelete,
  handleExport,
  handleAdminEdit,
  handleContact,
  handleQAQuestions,
  handleQuestsRouter,
  handleAwardXP,
  handleAccountActivity,
  handleLogActivity,
} from '../lib/api/handlers.js';

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

  if (route === 'webhook') return handleWebhook(req, res);

  try {
    req.body = await parseJsonBody(req);
  } catch (err) {
    console.error('[api/index] Body parse error:', err.message);
    req.body = {};
  }

  // Prefix-match routes (wildcard sub-paths — must come after body parse)
  if (route === 'quests' || route.startsWith('quests/')) return handleQuestsRouter(req, res);

  switch (route) {
    case 'chat':               return handleChat(req, res);
    case 'checkout':           return handleCheckout(req, res);
    case 'portal':             return handlePortal(req, res);
    case 'admin':              return handleAdmin(req, res);
    case 'admin-edit':         return handleAdminEdit(req, res);
    case 'analytics':          return handleAnalytics(req, res);
    case 'pause':              return handlePause(req, res);
    case 'referral':           return handleReferral(req, res);
    case 'account-delete':     return handleAccountDelete(req, res);
    case 'export':             return handleExport(req, res);
    case 'contact':            return handleContact(req, res);
    case 'qa-questions':       return handleQAQuestions(req, res);
    case 'generate':           return handleGenerate(req, res);
    case 'generate-question':  return handleGenerateQuestion(req, res);
    case 'generate-exam':      return handleGenerateExam(req, res);
    case 'grade-answer':       return handleGradeAnswer(req, res);
    case 'save-exam-result':   return handleSaveExamResult(req, res);
    case 'generate-quest':     return handleGenerateQuest(req, res);
    case 'analyze-weakness':   return handleAnalyzeWeakness(req, res);
    case 'summarize-chat':     return handleSummarizeChat(req, res);
    case 'award-xp':           return handleAwardXP(req, res);
    case 'account-activity':   return handleAccountActivity(req, res);
    case 'log-activity':       return handleLogActivity(req, res);
    default:
      return res.status(404).json({ error: 'Route /api/' + route + ' not found.' });
  }
}
