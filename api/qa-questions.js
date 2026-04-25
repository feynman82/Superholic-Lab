/**
 * api/qa-questions.js
 * Vercel Serverless Endpoint: Human-in-the-Loop QA Audit for question_bank.
 * Routes all GET / PUT / DELETE calls to handleQAQuestions in handlers.js.
 */

import { handleQAQuestions } from '../lib/api/handlers.js';

export default async function handler(req, res) {
  return handleQAQuestions(req, res);
}
