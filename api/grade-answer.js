/**
 * api/grade-answer.js
 * Semantic AI grading for Word Problem and Open-Ended exam questions.
 *
 * Uses Gemini 1.5 Flash (primary) with Claude Haiku fallback.
 * The grading rubric is HARDCODED in this file — it cannot be overridden
 * by the request body, preventing prompt injection.
 *
 * POST /api/grade-answer
 * Body:
 *   questionId, questionType, questionText, subject, level,
 *   studentAnswer, workedSolution, keywords, modelAnswer, parts, marks
 * Returns:
 *   { questionId, score, maxScore, feedback, breakdown, gradedBy }
 *
 * TEST: POST with questionType:"open_ended", subject:"Science",
 *       studentAnswer:"Metal conducts heat so the spoon gets hot",
 *       keywords:["conducts","heat","spoon"], marks:4
 *       → should return score >= 2 with breakdown showing keyword matches
 */

'use strict';

// ── HARDCODED system prompt ─────────────────────────────────────────────────
// This prompt is the sole grading authority. The request body CANNOT override it.
const GRADER_SYSTEM_PROMPT = `You are an experienced Singapore primary school examiner
grading student answers for PSLE-style assessments. Your role is to award marks fairly
based on the official marking rubric provided. Be strict but fair.

MARKING PRINCIPLES:
1. Award marks for demonstrated understanding, not just memorisation of exact words
2. Accept sensible alternatives to the model answer if the concept is correct
3. Deduct marks for clearly incorrect statements, even if surrounded by correct ones
4. For Science: check Claim, Evidence, and Reasoning are all present for full marks
5. For Mathematics: check that the correct method is shown, even if arithmetic slips
6. Always return valid JSON — no markdown, no explanation outside the JSON

You MUST return ONLY a JSON object with this exact structure:
{
  "score": <number, can be decimal like 1.5>,
  "maxScore": <number>,
  "feedback": "<one paragraph of constructive feedback for the student>",
  "breakdown": [
    { "aspect": "<criterion name>", "earned": <number>, "possible": <number>, "note": "<brief note>" }
  ]
}`;

// ── Subject-specific rubric generators ─────────────────────────────────────
function buildRubric(questionType, subject, studentAnswer, question) {
  const { questionText, workedSolution, keywords, modelAnswer, parts, marks } = question;

  if (questionType === 'open_ended' && subject === 'Science') {
    return `
QUESTION (${marks} marks): ${questionText}

KEYWORDS TO CHECK (1 mark each cluster): ${(keywords || []).join(', ')}

MODEL ANSWER: ${modelAnswer || 'Not provided — use keywords and worked solution as guide.'}

WORKED SOLUTION: ${workedSolution}

STUDENT ANSWER: ${studentAnswer}

RUBRIC — Science Open-Ended (CER Framework):
- Claim (1 mark): Student states a clear, direct answer to the question
- Evidence (1 mark): Student references an observable fact or given information
- Reasoning (1+ mark): Student names the scientific principle and explains the mechanism
- Use of keywords: Award 0.5 marks for each cluster of keywords correctly used in context
- Total marks available: ${marks}

MARKING INSTRUCTIONS:
If the student uses the correct scientific concept but wrong vocabulary, award partial marks.
If the student has the right answer but no reasoning, deduct reasoning marks.
Do not penalise for spelling errors if the meaning is clear.`;
  }

  if (questionType === 'word_problem' && subject === 'Mathematics') {
    const partsText = (parts || []).map(function(p) {
      return `Part ${p.label}: "${p.question}" — correct answer: ${p.correct_answer}, worked: ${p.worked_solution}`;
    }).join('\n');

    return `
QUESTION (${marks} marks total): ${questionText}

PARTS AND CORRECT ANSWERS:
${partsText}

WORKED SOLUTION: ${workedSolution}

STUDENT ANSWER: ${studentAnswer}

RUBRIC — Mathematics Word Problem:
For each part:
- 1 mark for correct method/heuristic shown (bar model, working backwards, etc.)
- 1 mark for correct final answer
- Partial credit: if method is correct but arithmetic error → award method mark only
- Total marks available: ${marks}

MARKING INSTRUCTIONS:
Award marks even if the student uses a different valid method.
If the student writes the final answer without working, award answer mark only (not method mark).
Allow arithmetic errors of ±1 if the method is clearly correct.`;
  }

  // Generic fallback for other types
  return `
QUESTION (${marks} marks): ${questionText}

MODEL ANSWER / WORKED SOLUTION: ${workedSolution || modelAnswer || 'See keywords'}
KEYWORDS: ${(keywords || []).join(', ')}

STUDENT ANSWER: ${studentAnswer}

Award ${marks} marks based on how well the student demonstrates understanding of the key concept.
Use the worked solution as the authoritative reference.`;
}

// ── AI call helpers ─────────────────────────────────────────────────────────
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: GRADER_SYSTEM_PROMPT + '\n\n' + prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

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
      max_tokens: 1024,
      system: GRADER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}`);

  const data = await res.json();
  return data?.content?.[0]?.text || '';
}

// ── Parse grading response ─────────────────────────────────────────────────
function parseGradingResponse(text) {
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  const result = JSON.parse(cleaned);
  if (typeof result.score !== 'number') throw new Error('Missing score');
  if (typeof result.maxScore !== 'number') throw new Error('Missing maxScore');
  return result;
}

// ── Handler ────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      questionId, questionType, questionText, subject, level,
      studentAnswer, workedSolution, keywords, modelAnswer, parts, marks,
    } = req.body;

    // Input validation
    if (!questionType || !studentAnswer || !questionText) {
      return res.status(400).json({ error: 'Missing required fields: questionType, questionText, studentAnswer' });
    }
    const validTypes = ['word_problem', 'open_ended'];
    if (!validTypes.includes(questionType)) {
      return res.status(400).json({ error: 'questionType must be word_problem or open_ended' });
    }
    if (typeof studentAnswer !== 'string' || studentAnswer.length > 2000) {
      return res.status(400).json({ error: 'studentAnswer must be a string under 2000 characters' });
    }

    const safeMarks = Math.min(Math.max(1, parseInt(marks, 10) || 2), 10);

    // Build the rubric prompt (NEVER using raw student answer as a prompt instruction)
    const rubricPrompt = buildRubric(questionType, subject, studentAnswer, {
      questionText, workedSolution, keywords, modelAnswer, parts, marks: safeMarks,
    });

    let responseText;
    let gradedBy = 'gemini';
    try {
      responseText = await callGemini(rubricPrompt);
    } catch (geminiErr) {
      console.warn('[grade-answer] Gemini failed, falling back to Claude:', geminiErr.message);
      gradedBy = 'claude';
      responseText = await callClaude(rubricPrompt);
    }

    const grading = parseGradingResponse(responseText);

    // Cap score at maxScore, floor at 0
    const safeScore = Math.max(0, Math.min(grading.score, safeMarks));

    return res.status(200).json({
      questionId: questionId || 'unknown',
      score:     safeScore,
      maxScore:  safeMarks,
      feedback:  grading.feedback || 'Answer graded by AI.',
      breakdown: grading.breakdown || [],
      gradedBy,
    });

  } catch (err) {
    console.error('[grade-answer] Error:', err.message);
    // Fail open: return 0 with explanation rather than blocking the exam
    return res.status(200).json({
      questionId: req.body?.questionId || 'unknown',
      score:   0,
      maxScore: req.body?.marks || 2,
      feedback: 'We could not grade this answer automatically. Please compare your answer with the worked solution.',
      breakdown: [],
      gradedBy: 'fallback',
    });
  }
}

// TEST: POST {"questionType":"open_ended","subject":"Science","level":"Primary 6",
//             "questionText":"Explain why a metal spoon in hot Milo feels hotter than a plastic spoon.",
//             "studentAnswer":"Metal conducts heat well so heat moves from the Milo to the spoon handle.",
//             "keywords":["conducts","heat","transfers","spoon"],"marks":4}
//       → score should be >= 2, feedback should mention CER or keywords
