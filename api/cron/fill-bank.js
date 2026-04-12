/**
 * api/cron/fill-bank.js
 * Vercel Serverless Function: The Cloud Omni-Cloner
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🚀 FIXED: Upgraded to the correct 2.5 Flash model
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

const CLONES_PER_SEED = 4;

const TYPE_RULES = {
  mcq: `\n- Each question must have exactly 4 options (A, B, C, D).\n- Include a "wrong_explanations" object. Keys are the wrong options.\n- Include an "examiner_note" for each question.`,
  short_ans: `\n- Answers must be concise (a number, expression, or short phrase).\n- Include an "accept_also" array for equivalent correct forms.`,
  word_problem: `\n- Each word problem must have a "parts" array with 2–3 parts.\n- Show full step-by-step "worked_solution".\n- Include an "examiner_note".`,
  open_ended: `\n- Write a "model_answer" using CER framework.\n- List "keywords" array.\n- Provide a marking rubric in worked solution.`,
  cloze: `\n- "passage" must have blanks marked as [1], [2].\n- Include "blanks" array (number, options, correct_answer, explanation).`,
  editing: `\n- Include "passage_lines" array (line_number, text, underlined_word, has_error, correct_word, explanation).`
};

// 🚀 SYNCED: Strict UI mapping rules
const VISUAL_RULES = `
CRITICAL VISUAL PAYLOAD RULES:
If the seed question contains a "visual_payload", your clones MUST include an updated "visual_payload".
You MUST map the diagram to ONE of these officially supported functions:
1. "rectangle" | 2. "square" | 3. "rightTriangle" | 4. "circle"
5. "fractionBar" | 6. "numberLine" | 7. "barChart" | 8. "pictogram"
9. "compositeShape" | 10. "placeholder" (USE AS FALLBACK if no other shape fits).
- "engine" must always be "diagram-library".
- Update "visual_payload.params" to reflect your cloned question's math.
`;

function buildPrompt(seedType) {
  const typeSpecificInstructions = TYPE_RULES[seedType] || TYPE_RULES.mcq;
  return `
You are an expert Singapore MOE curriculum designer.
Extract the core concept and generate EXACTLY ${CLONES_PER_SEED} NEW variations.

SCAFFOLDING REQUIREMENTS:
1. "difficulty": 1 "easy", 2 "medium", 1 "hard".
2. "cognitive_skill": Add a 2-3 word string.
3. "progressive_hints": An array of 2 strings (nudge, clue).

STRICT SCHEMA REQUIREMENTS:
${typeSpecificInstructions}
${VISUAL_RULES}

Return ONLY a valid JSON array of the ${CLONES_PER_SEED} new question objects. Do NOT wrap in markdown fences.
SEED QUESTION: 
`;
}

function sanitizeJsonString(rawString) {
  let clean = rawString.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
  clean = clean.replace(/(?<!\\)\n(?=[^"]*"(?:[^"\\]|\\.)*"(?:[^"\\]|\\.)*$)/g, '\\n');
  return clean;
}

export default async function handler(req, res) {
  // Optional: Secure the cron endpoint
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log(`🚀 Waking up Cloud Clone Engine...`);

  try {
    const { data: seeds, error: fetchErr } = await supabase
      .from('seed_questions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3); // Keep Vercel batches small to avoid timeout limits

    if (fetchErr || !seeds.length) return res.status(200).json({ message: 'No seeds to clone' });

    let totalClones = 0;

    for (const seed of seeds) {
      console.log(`🧬 Cloning seed: ${seed.id} (${seed.topic} - ${seed.type})`);

      let cleanSeed = { ...seed };
      if (cleanSeed.visual_payload && typeof cleanSeed.visual_payload.params === 'string') {
        try { cleanSeed.visual_payload.params = JSON.parse(cleanSeed.visual_payload.params); } catch(e) {}
      }

      const prompt = buildPrompt(cleanSeed.type);
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt + JSON.stringify(cleanSeed) }] }],
        generationConfig: { temperature: 0.6, responseMimeType: "application/json" }
      });

      const clones = JSON.parse(sanitizeJsonString(result.response.text()));

      const payload = clones.map(c => {
        // 🚀 THE FIX: Safely strip out seed-specific keys the AI might have copied
        const { flag_review, id, created_at, original_id, ...cleanClone } = c;

        return {
          ...cleanClone, // Safely spread only the actual question data
          seed_id: seed.id, 
          is_ai_cloned: true,
          subject: seed.subject, 
          level: seed.level,
          topic: seed.topic, 
          cognitive_skill: cleanClone.cognitive_skill || null,
          progressive_hints: cleanClone.progressive_hints || null,
          instructions: cleanClone.instructions || seed.instructions || null,
          visual_payload: cleanClone.visual_payload || null 
        };
      });

      const { error: insErr } = await supabase.from('question_bank').insert(payload);
      if (insErr) console.error(`⚠️ DB Insert failed for ${seed.id}:`, insErr.message);
      else totalClones += payload.length;
    }

    return res.status(200).json({ success: true, clonesAdded: totalClones });

  } catch (error) {
    console.error('❌ Engine Error:', error);
    return res.status(500).json({ error: error.message });
  }
}