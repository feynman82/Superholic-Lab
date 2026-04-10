/**
 * api/generate-quest.js
 * Vercel Serverless Endpoint for generating the 3-Day Plan Quest.
 * This file creates the /api/generate-quest route and delegates 
 * the heavy lifting to your master handlers.js file.
 */

import { handleGenerateQuest } from '../lib/api/handlers.js';

export default async function handler(req, res) {
  return handleGenerateQuest(req, res);
}