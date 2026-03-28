/**
 * api/generate.js — Vercel Serverless Function
 * Generates MOE-aligned questions on demand using the Anthropic API.
 * Supports all 6 question types: mcq, short_ans, word_problem, open_ended, cloze, editing.
 *
 * Each type uses a dedicated system prompt from api/prompts/ to enforce the
 * Superholic Lab quality standard (Singapore context, PSLE format, full explanations).
 *
 * POST /api/generate
 * Body: { subject, level, topic, difficulty, count, type }
 *   type     — question type (default: 'mcq')
 *   count    — number of questions to generate (max 10 for most types; max 3 for cloze/editing)
 *
 * ⚠️ CONFIGURE: Set ANTHROPIC_API_KEY in .env (local) and Vercel dashboard (production).
 *
 * TEST: POST { subject: "Mathematics", level: "Primary 4",
 *              topic: "Fractions", difficulty: "Standard", count: 3, type: "mcq" }
 *       → verify 3 JSON question objects are returned with correct structure.
 * TEST: POST { subject: "English", level: "Primary 4",
 *              topic: "Grammar Cloze", difficulty: "Standard", count: 2, type: "cloze" }
 *       → verify 2 cloze passage objects with blanks array and correct_answer as word strings.
 */

const Anthropic = require('@anthropic-ai/sdk');

// Type-specific system prompts
const { MCQ_SYSTEM_PROMPT }         = require('./prompts/mcq');
const { SHORT_ANS_SYSTEM_PROMPT }   = require('./prompts/short-ans');
const { WORD_PROBLEM_SYSTEM_PROMPT } = require('./prompts/word-problem');
const { OPEN_ENDED_SYSTEM_PROMPT }  = require('./prompts/open-ended');
const { CLOZE_SYSTEM_PROMPT }       = require('./prompts/cloze');
const { EDITING_SYSTEM_PROMPT }     = require('./prompts/editing');

/** Map of question type → system prompt */
const SYSTEM_PROMPTS = {
  mcq:          MCQ_SYSTEM_PROMPT,
  short_ans:    SHORT_ANS_SYSTEM_PROMPT,
  word_problem: WORD_PROBLEM_SYSTEM_PROMPT,
  open_ended:   OPEN_ENDED_SYSTEM_PROMPT,
  cloze:        CLOZE_SYSTEM_PROMPT,
  editing:      EDITING_SYSTEM_PROMPT,
};

/** Valid question types */
const VALID_TYPES = new Set(Object.keys(SYSTEM_PROMPTS));

/**
 * Per-type max count caps to prevent excessive token usage.
 * Cloze and editing passages are long — limit to 3 at a time.
 */
const MAX_COUNT = {
  mcq:          10,
  short_ans:    10,
  word_problem:  5,
  open_ended:   10,
  cloze:         3,
  editing:       3,
};

/**
 * Builds the user-facing generation prompt for a given type and parameters.
 *
 * @param {string} type
 * @param {number} count
 * @param {string} subject
 * @param {string} level
 * @param {string} topic
 * @param {string} difficulty
 * @returns {string}
 */
function buildUserPrompt(type, count, subject, level, topic, difficulty) {
  const base = `Generate ${count} ${type.replace('_', '-')} question${count > 1 ? 's' : ''} for the following specification:

Subject: ${subject}
Level: ${level}
Topic: ${topic}
Difficulty: ${difficulty}

Requirements:
- All content must be strictly aligned to the MOE Singapore ${level} ${subject} syllabus.
- Use Singapore names, settings, and culturally relevant scenarios throughout.
- Ensure varied sub-topics within this topic — do not repeat the same scenario type.`;

  const typeExtras = {
    mcq:
      `\n- Each question must have exactly 4 options (A, B, C, D).
- Wrong-answer explanations must name the specific misconception by name.
- Worked solution must show full step-by-step working.
- Include an examiner_note for each question.`,

    short_ans:
      `\n- Answers must be concise (a number, expression, or short phrase).
- Include accept_also for equivalent correct forms.
- Worked solution must show full step-by-step working.`,

    word_problem:
      `\n- Each word problem must have 2–3 parts with a coherent narrative.
- Show full step-by-step working and marking scheme per part.
- Include an examiner_note about PSLE method marks.`,

    open_ended:
      `\n- Write the model answer in complete paragraph form as a student would.
- List all essential keywords the student must include.
- Provide a clear 2/1/0 marking rubric.`,

    cloze:
      `\n- Each passage must be 5–8 sentences with 7–10 blanks.
- Each blank tests a different grammar point.
- "correct_answer" must be the exact word as a string, NOT a letter (e.g., "went" not "A").
- Provide 4 MCQ options per blank including the correct answer.`,

    editing:
      `\n- Each passage must have exactly 5 underlined words (one per line).
- The errors must cover at least 4 different grammar categories.
- Each line object needs: line_number, text, underlined_word, has_error, correct_word, explanation.`,
  };

  return base + (typeExtras[type] || '') + `\n\nReturn a valid JSON array of ${count} question object${count > 1 ? 's' : ''}.`;
}

// ── Handler ──────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { subject, level, topic, difficulty, count, type } = req.body;

  // Validate required fields
  if (!subject || !level || !topic) {
    return res.status(400).json({
      error: 'Missing required fields: subject, level, and topic are all required.'
    });
  }

  // Resolve and validate type (default to 'mcq' for backward compatibility)
  const questionType = (type || 'mcq').toLowerCase().trim();
  if (!VALID_TYPES.has(questionType)) {
    return res.status(400).json({
      error: `Invalid type '${questionType}'. Valid types: ${[...VALID_TYPES].join(', ')}.`
    });
  }

  // Cap count per type
  const maxCount       = MAX_COUNT[questionType] || 10;
  const questionCount  = Math.min(parseInt(count, 10) || 3, maxCount);
  const questionDiff   = difficulty || 'Standard';

  const systemPrompt = SYSTEM_PROMPTS[questionType];
  const userPrompt   = buildUserPrompt(questionType, questionCount, subject, level, topic, questionDiff);

  // ⚠️ CONFIGURE: API key must be set as ANTHROPIC_API_KEY in .env / Vercel dashboard
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 8192,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    });

    // Extract text response
    const rawContent = message.content[0].text.trim();

    // Parse JSON — strip markdown fences if Claude included them
    let questions;
    try {
      questions = JSON.parse(rawContent);
    } catch {
      const stripped = rawContent
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      questions = JSON.parse(stripped);
    }

    // Validate response is an array
    if (!Array.isArray(questions)) {
      throw new Error('API returned a non-array response.');
    }

    return res.status(200).json(questions);

  } catch (error) {
    console.error('[generate] Question generation error:', error.message);
    return res.status(500).json({
      error:  'Failed to generate questions. Please try again.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
