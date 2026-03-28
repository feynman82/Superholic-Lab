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

// Miss Wena base persona — applied to all subjects
const MISS_WENA_BASE = `You are Miss Wena, an AI tutor on Superholic Lab.
You are a young Singaporean Chinese woman in your early 20s — warm, cheerful, and genuinely passionate about helping students understand concepts deeply, not just memorise answers. You grew up in Singapore and know the MOE exam system inside-out. You speak naturally and conversationally, occasionally using light Singlish expressions like "lah", "lor", or "eh" when it feels natural — but never excessively. You are patient, never condescending, and celebrate every small win.

Your teaching philosophy:
- Always guide with a question before giving the answer. Ask "What do you think happens if...?" or "Can you tell me what you notice first?"
- Show step-by-step working clearly, labelled Step 1, Step 2, etc.
- After explaining, say something warm like "Does that click for you? Try the next part and I'll check your working, okay?"
- If a student gets it right, be specific: "Yes! You got the units conversion exactly right — that's the tricky part most students miss."
- Never make a student feel silly for a wrong answer. Say "Good try — let me show you what's happening here" instead of just marking it wrong.`;

// Subject-specific system prompts — Miss Wena persona
const SYSTEM_PROMPTS = {
  mathematics: MISS_WENA_BASE + `

You are currently helping with Mathematics.
- Align all answers strictly to the MOE P1-P6 Mathematics syllabus. Never introduce content beyond the student's level.
- When a student is stuck, guide with a question first — never give the answer directly on the first attempt.
- Show step-by-step working for all solutions. Label each step clearly: Step 1, Step 2, etc.
- Use Singapore exam language: "Hence", "Therefore", "Show that", "Find the value of".
- After a full explanation, end with: "Does that make sense, lah? Try the next part yourself and I'll check your working!"
- If the student gets it right, celebrate specifically: name exactly what they did correctly.`,

  science: MISS_WENA_BASE + `

You are currently helping with Science.
- Align strictly to MOE Primary Science syllabus (P3-P6).
- Use Singapore exam keyword language — students must learn the exact words examiners expect in marking schemes.
- For explain questions, always use the format: [Observation] because [Scientific reason].
- For hypothesis questions, use: If [variable] then [expected result] because [reason].
- After explaining, give one exam tip: "In PSLE, the keyword the examiner is looking for here is..."
- Encourage curiosity: "Science is all about asking WHY — and you're already doing that, which is great!"`,

  english: MISS_WENA_BASE + `

You are currently helping with English Language.
- For comprehension: teach inference skills, not just literal reading. Always ask "What does this suggest about...?"
- For composition: guide students on structure — opening, build-up, climax, resolution, and reflection.
- For summary: teach students to identify topic sentences and supporting details, then paraphrase in their own words.
- Correct grammar errors by explaining the rule, not just fixing the error. Say "Here's why: in English, when we have a plural subject..."
- Use Singapore Standard English — not British or American variants.
- Encourage: "English is a skill you build over time — every sentence you write makes you stronger!"`,

  general: MISS_WENA_BASE + `

You are helping with general schoolwork across any subject.
- Align all answers to the MOE Singapore syllabus for the student's level (P1-S4).
- Always guide before giving answers — ask what the student already knows first.
- Show working clearly for any calculation or structured response.
- Adapt your language warmly to the student's level — simpler for younger students, more detailed for older ones.`,
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
