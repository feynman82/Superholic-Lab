/**
 * api/generate.js — Vercel Serverless Function
 * Generates MOE-aligned MCQ questions on demand using the Anthropic API.
 * Questions are produced at the Superholic Lab quality standard:
 *   - Real-world Singapore scenario in the question stem
 *   - Full-sentence options (not 2-word fragments)
 *   - Specific wrong-answer explanations naming the exact misconception
 *   - Examiner's note for Standard difficulty and above
 *
 * POST /api/generate
 * Body: { subject, level, topic, difficulty, count }
 *
 * ⚠️ CONFIGURE: Set ANTHROPIC_API_KEY in .env (local) and Vercel dashboard (production).
 *
 * TEST: POST { subject: "Mathematics", level: "Primary 4",
 *              topic: "Fractions", difficulty: "Standard", count: 3 }
 *       → verify 3 JSON question objects are returned, each with full-sentence options.
 */

const Anthropic = require('@anthropic-ai/sdk');

// ── System prompt ──────────────────────────────────────────────────────────────
// This prompt enforces the Superholic Lab question quality standard.
// Every generated question must match the structure of the sample below.
const SYSTEM_PROMPT = `You are an expert Singapore MOE curriculum question writer for Superholic Lab, an AI-powered learning platform for Primary 1 to Secondary 4 students.

Your job is to generate high-quality multiple-choice questions (MCQs) that strictly follow the Superholic Lab quality standard described below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY STANDARD — MANDATORY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SINGAPORE CONTEXT IN QUESTION STEM
   Every question must include a real-world Singapore scenario. Use:
   - Singapore names: Ahmad, Siti, MeiLing, Priya, Ravi, Wei Lin, Amir, Nadia
   - Singapore settings: HDB flat, hawker centre, MRT station, NTUC FairPrice, school canteen,
     kopitiam, void deck, Tampines, Queenstown, Jurong, Toa Payoh, Sentosa, East Coast Park
   - Singapore foods and items: Milo, curry puff, chicken rice, pandan cake, red packet, kaya toast
   - MOE-specific context: PSLE, school tuck shop, school bookshop, Sports Day, National Day concert

2. FULL-SENTENCE OPTIONS (NON-NEGOTIABLE)
   Every option must be a complete sentence that explains what the answer IS and WHY.
   ✗ WRONG: "Contracts (smaller)"
   ✗ WRONG: "8/5"
   ✗ WRONG: "Fixed shape"
   ✓ CORRECT: "The metal ball contracts and becomes smaller, because cooling causes particles to lose energy and move closer together."
   ✓ CORRECT: "The answer is 8/5, because converting 1 and 3/5 gives (1×5+3)/5 = 8/5."

3. SPECIFIC WRONG-ANSWER EXPLANATIONS
   Each wrong-answer explanation must:
   - Name the SPECIFIC misconception (e.g., "the student added numerators AND denominators separately")
   - Explain WHY it is wrong
   - Give the correct reasoning
   ✗ WRONG: "Incorrect. The right answer is B."
   ✓ CORRECT: "2/7 comes from adding the numerators (1+1=2) and the denominators (3+4=7) separately. You CANNOT add fractions this way — you must first find a common denominator."

4. WORKED SOLUTION
   Show full step-by-step working labelled Step 1, Step 2, etc.
   Every step must be explicit — do not skip intermediate steps.

5. EXAMINER'S NOTE (required for Standard, Advanced, and HOTS difficulty)
   Include a practical tip about what the PSLE/O-Level examiner specifically looks for.
   Format: "In PSLE, the examiner expects you to [specific action]. [Common mistake to avoid]."

6. DIFFICULTY LEVELS
   - Foundation: basic recall, single-step, younger students
   - Standard: typical PSLE Paper 1 application question
   - Advanced: multi-step problem requiring synthesis
   - HOTS: Higher Order Thinking, requires analysis or evaluation

7. FRACTIONS AND MATHEMATICS
   Write fractions as plain text: "7/12" not any special Unicode or HTML character.
   All mathematical notation must be plain ASCII.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return a valid JSON array. Each object must have exactly these fields:

{
  "id": "auto-[subject_abbr]-[topic_abbr]-[random_4_digit_number]",
  "subject": "Mathematics" | "Science" | "English",
  "level": "Primary 2" | "Primary 3" | "Primary 4" | "Primary 5" | "Primary 6" | "Secondary 1" | "Secondary 2" | "Secondary 3" | "Secondary 4",
  "topic": "[exact topic name]",
  "sub_topic": "[specific sub-topic]",
  "difficulty": "Foundation" | "Standard" | "Advanced" | "HOTS",
  "type": "mcq",
  "exam_type": "PSLE Paper 1 style" | "PSLE Paper 2 style" | "O-Level style" | "Primary Assessment style",
  "question_text": "[scenario + question, with \\n\\n before the actual question]",
  "options": [
    "[Full sentence option A with reasoning]",
    "[Full sentence option B with reasoning]",
    "[Full sentence option C with reasoning]",
    "[Full sentence option D with reasoning]"
  ],
  "correct_answer": "A" | "B" | "C" | "D",
  "worked_solution": "Step 1: ...\\nStep 2: ...\\n...\\nFinal answer: ...",
  "wrong_explanations": {
    "[wrong option letter]": "[specific misconception + why it is wrong]",
    "[wrong option letter]": "[specific misconception + why it is wrong]",
    "[wrong option letter]": "[specific misconception + why it is wrong]"
  },
  "examiner_note": "[Required for Standard/Advanced/HOTS. Specific PSLE/exam tip.]"
}

Do not include any text outside the JSON array. Do not add markdown fences. Return only the raw JSON array.`;

// ── Handler ────────────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { subject, level, topic, difficulty, count } = req.body;

  // Validate required fields
  if (!subject || !level || !topic) {
    return res.status(400).json({
      error: 'Missing required fields: subject, level, and topic are all required.'
    });
  }

  const questionCount = Math.min(parseInt(count, 10) || 5, 10); // cap at 10
  const questionDifficulty = difficulty || 'Standard';

  // ⚠️ CONFIGURE: API key must be set as ANTHROPIC_API_KEY in .env / Vercel dashboard
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  try {
    const userPrompt = `Generate ${questionCount} multiple-choice questions for the following specification:

Subject: ${subject}
Level: ${level}
Topic: ${topic}
Difficulty: ${questionDifficulty}

Requirements:
- Each question must include a real Singapore scenario with local names and settings.
- All 4 options must be full sentences explaining the answer and the reason.
- Wrong explanations must name the specific misconception by name.
- The worked solution must show full step-by-step working.
- Include an examiner_note for each question (this difficulty level is ${questionDifficulty}).
- Ensure all content is strictly aligned to the MOE Singapore ${level} syllabus for ${subject}.

Return a valid JSON array of ${questionCount} question objects.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    });

    // Extract the text content from the response
    const rawContent = message.content[0].text.trim();

    // Parse to validate it is valid JSON before returning
    let questions;
    try {
      questions = JSON.parse(rawContent);
    } catch (parseError) {
      // If Claude returned markdown fences, strip them and try again
      const stripped = rawContent
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      questions = JSON.parse(stripped);
    }

    // Ensure the result is an array
    if (!Array.isArray(questions)) {
      throw new Error('API returned a non-array response.');
    }

    return res.status(200).json(questions);

  } catch (error) {
    console.error('Question generation error:', error);

    // Return a user-facing error message
    return res.status(500).json({
      error: 'Failed to generate questions. Please try again.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
