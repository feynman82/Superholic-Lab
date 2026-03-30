/**
 * api/generate-question.js
 * On-demand AI question generation for exam papers when the question bank is thin.
 * Tries Google Gemini 1.5 Flash first (cheaper), falls back to Claude Sonnet.
 *
 * POST /api/generate-question
 * Body: { subject, level, topic, type, difficulty, count }
 * Returns: { questions: [...] }
 *
 * Environment variables required:
 *   GEMINI_API_KEY    — Google AI Studio key (primary)
 *   ANTHROPIC_API_KEY — Anthropic key (fallback)
 *
 * TEST: POST {"subject":"Science","level":"Primary 6","topic":"Cells",
 *             "type":"mcq","difficulty":"Standard","count":2}
 *       Should return 2 valid MCQ question objects.
 */

'use strict';

// ── Safety system prompt ──────────────────────────────────────────────────────
const SAFETY_PROMPT = `You are a question generator for Superholic Lab, a Singapore
primary school learning platform. You generate MOE-aligned practice questions for
students aged 9–12. You must ONLY generate educational content aligned to the
Singapore primary school syllabus. Never generate inappropriate content.`;

// ── Schema instructions by type ────────────────────────────────────────────────
function buildSchemaInstructions(subject, level, topic, type, difficulty, count) {
  const base = `
Generate exactly ${count} ${subject} question(s) for ${level} students on the topic "${topic}".
Difficulty: ${difficulty}. Use Singapore names, food, and places for context.
Use British English spelling throughout.

Return ONLY a valid JSON array. No markdown, no explanation, just the JSON array.

Each question must have these fields:
- id: string in format "${level.toLowerCase().replace(/ /g, '-')}-${subject.toLowerCase().slice(0,4)}-${topic.toLowerCase().replace(/ /g, '-').slice(0,6)}-ai-001" (increment for each)
- subject: "${subject}"
- level: "${level}"
- topic: "${topic}"
- sub_topic: string (specific aspect of the topic)
- difficulty: "${difficulty}"
- type: "${type}"
- marks: number (1-4)
- question_text: string
- worked_solution: string (minimum 3 numbered steps)
`;

  const typeSchemas = {
    mcq: `
Additional fields for MCQ:
- options: array of exactly 4 strings (full sentences)
- correct_answer: "A", "B", "C", or "D"
- wrong_explanations: object with keys for each wrong option, each explaining the misconception
`,
    short_ans: `
Additional fields for short_ans:
- correct_answer: string (the answer)
- accept_also: array of alternative acceptable forms (e.g. with units)
`,
    word_problem: `
Additional fields for word_problem:
- parts: array of at least 2 parts, each with: label ("(a)", "(b)"), question, marks, correct_answer, worked_solution
`,
    open_ended: `
Additional fields for open_ended (Science only):
- keywords: array of 3-5 mark-bearing terms
- model_answer: string following Claim-Evidence-Reasoning structure
`,
    cloze: `
Additional fields for cloze:
- passage: string with blanks marked as [1], [2], [3] etc.
- blanks: array of objects, each with: number, options (4 strings), correct_answer (A/B/C/D), explanation
`,
    editing: `
Additional fields for editing:
- passage_lines: array of 3 line objects. Exactly 1 line must have has_error: true.
  Each line: { line_number, text, underlined_word, has_error, correct_word (null if no error), explanation (null if no error) }
`,
  };

  return base + (typeSchemas[type] || '');
}

// ── Gemini call ───────────────────────────────────────────────────────────────
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: SAFETY_PROMPT + '\n\n' + prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty content');
  return text;
}

// ── Claude call ───────────────────────────────────────────────────────────────
async function callClaude(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SAFETY_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Claude returned empty content');
  return text;
}

// ── Parse JSON from AI response ────────────────────────────────────────────────
function parseQuestionsFromResponse(text) {
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('AI response is not an array');
  return parsed;
}

// ── Validate a generated question has required base fields ─────────────────────
function validateQuestion(q) {
  const required = ['id', 'subject', 'level', 'topic', 'type', 'difficulty', 'marks', 'question_text', 'worked_solution'];
  for (const field of required) {
    if (q[field] === undefined || q[field] === null) {
      throw new Error(`Generated question missing required field: ${field}`);
    }
  }
  return true;
}

// ── Main handler ───────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subject, level, topic, type, difficulty, count } = req.body;

    // Validate inputs
    if (!subject || !level || !topic || !type || !difficulty || !count) {
      return res.status(400).json({ error: 'Missing required fields: subject, level, topic, type, difficulty, count' });
    }

    const validSubjects = ['Mathematics', 'Science', 'English'];
    const validTypes    = ['mcq', 'short_ans', 'word_problem', 'open_ended', 'cloze', 'editing'];
    const validDiffs    = ['Foundation', 'Standard', 'Advanced', 'HOTS'];

    if (!validSubjects.includes(subject)) return res.status(400).json({ error: 'Invalid subject' });
    if (!validTypes.includes(type))       return res.status(400).json({ error: 'Invalid type' });
    if (!validDiffs.includes(difficulty)) return res.status(400).json({ error: 'Invalid difficulty' });

    const safeCount = Math.min(Math.max(1, parseInt(count, 10) || 1), 5);
    const prompt = buildSchemaInstructions(subject, level, topic, type, difficulty, safeCount);

    let responseText;
    let provider = 'gemini';

    try {
      responseText = await callGemini(prompt);
    } catch (geminiErr) {
      console.warn('[generate-question] Gemini failed, falling back to Claude:', geminiErr.message);
      provider = 'claude';
      responseText = await callClaude(prompt);
    }

    const questions = parseQuestionsFromResponse(responseText);

    // Validate and tag with source
    const validated = questions
      .filter(function(q) {
        try { return validateQuestion(q); } catch { return false; }
      })
      .map(function(q) { return { ...q, source: 'ai', aiProvider: provider }; });

    if (validated.length === 0) {
      return res.status(500).json({ error: 'AI returned no valid questions' });
    }

    return res.status(200).json({ questions: validated, provider });

  } catch (err) {
    console.error('[generate-question] Error:', err.message);
    return res.status(500).json({ error: 'Failed to generate questions. Please try again.' });
  }
}

// TEST: POST {"subject":"Science","level":"Primary 6","topic":"Cells","type":"mcq","difficulty":"Standard","count":1}
//       Response should have questions[0].type === "mcq" and questions[0].source === "ai"
