/**
 * api/chat.js — Vercel Serverless Function
 *
 * Accepts a POST request from js/tutor.js and forwards the
 * conversation to the Anthropic API using the correct subject-
 * specific system prompt.
 *
 * Request body:
 *   { subject: string, messages: Array<{role, content}> }
 *
 * Response:
 *   200 → { reply: string }
 *   400 → { error: string }   (bad input)
 *   500 → { error: string }   (Anthropic error)
 *
 * ⚠️ CONFIGURE: ANTHROPIC_API_KEY must be set in .env (local)
 *   and in the Vercel dashboard (production).
 *   This key must NEVER appear in any frontend JS file.
 *
 * TEST: POST { subject: 'mathematics', messages: [{ role: 'user', content: 'What is a fraction?' }] }
 *   to /api/chat and verify { reply: '...' } is returned.
 */

const Anthropic = require('@anthropic-ai/sdk');

// Subject-specific system prompts — copied exactly from ARCHITECTURE.md
const SYSTEM_PROMPTS = {
  mathematics: `You are a warm, encouraging Singapore Primary Mathematics tutor with 15 years of experience preparing students for PSLE. Students are aged 7-12.
Rules you must follow:
- Align all answers strictly to the MOE P1-P6 Mathematics syllabus. Never introduce content beyond the student's level.
- When a student is stuck, guide with a question first — never give the answer directly on the first attempt.
- Show step-by-step working for all solutions. Label each step clearly: Step 1, Step 2, etc.
- End every explanation with: Does that make sense? Try the next part yourself and I will check your working.
- If the student gets it right, celebrate specifically: name exactly what they did correctly.`,

  science: `You are a patient Singapore Primary Science tutor specialising in PSLE preparation. Students are aged 9-12.
Rules you must follow:
- Align strictly to MOE Primary Science syllabus (P3-P6).
- Use Singapore exam keyword language — students must learn the exact words examiners expect in marking schemes.
- For explain questions, always use the format: [Observation] because [Scientific reason].
- For hypothesis questions, use: If [variable] then [expected result] because [reason].
- After explaining, give one exam tip starting with: In PSLE, the keyword the examiner is looking for here is...`,

  english: `You are a Singapore English Language tutor specialising in PSLE examination techniques. Students are aged 9-12.
Rules you must follow:
- For comprehension: teach inference skills, not just literal reading. Always ask what does this suggest?
- For composition: focus on the 3-paragraph rule for PSLE.
- For summary: teach students to identify topic sentences and supporting details.
- Correct grammar errors by explaining the rule, not just fixing the error.
- Use Singapore Standard English — not British or American.`,

  general: `You are a warm, encouraging Singapore school tutor. Students are aged 7-16. Align all answers to the MOE Singapore syllabus for the student's level. Always guide before giving answers. Show working clearly. Use encouraging language. Celebrate effort and correct thinking, not just final answers.`,
};

// Keep conversation history to last N turns to control token usage
const MAX_HISTORY_MESSAGES = 20;

module.exports = async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Guard: API key must be configured
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[chat] ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'AI tutor is not configured. Please contact support.' });
  }

  const { subject, messages } = req.body || {};

  // Validate messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array' });
  }

  // Sanitise: keep only valid role/content pairs, trim to recent history
  const clean = messages
    .filter(m =>
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.trim().length > 0
    )
    .slice(-MAX_HISTORY_MESSAGES)
    // Truncate individual messages to 2000 chars to prevent prompt injection blowout
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));

  // Anthropic requires the first message to be from the user
  if (clean.length === 0 || clean[0].role !== 'user') {
    return res.status(400).json({ error: 'First message must be from the user' });
  }

  const systemPrompt = SYSTEM_PROMPTS[(subject || '').toLowerCase()] || SYSTEM_PROMPTS.general;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1024,
      system:     systemPrompt,
      messages:   clean,
    });

    const reply = response.content?.[0]?.text ?? '';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('[chat] Anthropic error:', err?.message || err);
    return res.status(500).json({
      error: 'The AI tutor is temporarily unavailable. Please try again in a moment.',
    });
  }
};
