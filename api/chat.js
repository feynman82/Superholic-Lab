/**
 * api/chat.js — Vercel Serverless Function
 * Handles AI tutor chat requests.
 * Calls Anthropic API (claude-sonnet-4-6) with the
 * subject-specific system prompt from js/tutor.js.
 * PLACEHOLDER: Full implementation coming in Task 2.5
 *
 * ⚠️ CONFIGURE: ANTHROPIC_API_KEY must be set in .env
 * and in Vercel dashboard. Never expose this key in frontend JS.
 */

// TEST: POST { subject: 'mathematics', message: 'What is a fraction?' }
// to /api/chat and verify a tutor response is returned as JSON.
