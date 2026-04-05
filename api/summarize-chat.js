/**
 * api/summarize-chat.js
 * * Vercel Serverless Endpoint for generating and saving Study Notes.
 * This file creates the actual /api/summarize-chat route on your server
 * and delegates the logic to your master handlers.js file.
 */

import { handleSummarizeChat } from '../lib/api/handlers.js';

export default async function handler(req, res) {
  // Catch the incoming request and pass it securely to our centralized logic
  return handleSummarizeChat(req, res);
}