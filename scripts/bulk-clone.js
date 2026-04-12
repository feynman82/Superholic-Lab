/**
 * scripts/bulk-clone.js
 * The Ultimate Omni-Cloner. 
 * Maps hallucinated seed diagrams to strict diagram-library.js components.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

const CLONES_PER_SEED = 4; // 1 Easy, 2 Medium, 1 Hard

const TYPE_RULES = {
  mcq: `\n- Each question must have exactly 4 options (A, B, C, D).\n- Include a "wrong_explanations" object. Keys are the wrong options.\n- Include an "examiner_note" for each question.`,
  short_ans: `\n- Answers must be concise (a number, expression, or short phrase).\n- Include an "accept_also" array for equivalent correct forms.`,
  word_problem: `\n- Each word problem must have a "parts" array with 2–3 parts.\n- Show full step-by-step "worked_solution".\n- Include an "examiner_note".`,
  open_ended: `\n- Write a "model_answer" using CER framework.\n- List "keywords" array.\n- Provide a marking rubric in worked solution.`,
  cloze: `\n- "passage" must have blanks marked as [1], [2].\n- Include "blanks" array (number, options, correct_answer, explanation).`,
  editing: `\n- Include "passage_lines" array (line_number, text, underlined_word, has_error, correct_word, explanation).`
};

// 🚀 THE FIX: Give the AI the strict library API to prevent hallucinated crashes
const VISUAL_RULES = `
CRITICAL VISUAL PAYLOAD RULES:
If the seed question contains a "visual_payload", your clones MUST include an updated "visual_payload".
HOWEVER, the seed might contain an invalid/hallucinated function name. You MUST map the diagram to ONE of these officially supported functions:
1. "rectangle": { "widthLabel": "str", "heightLabel": "str" }
2. "square": { "sideLabel": "str" }
3. "rightTriangle": { "base": "str", "height": "str", "hypotenuse": "str" }
4. "circle": { "radiusLabel": "str", "diameterLabel": "str" }
5. "fractionBar": { "numerator": num, "denominator": num }
6. "numberLine": { "start": num, "end": num, "marked": [num] }
7. "barChart": { "title": "str", "xLabel": "str", "yLabel": "str", "bars": [{"label": "str", "value": num}] }
8. "pictogram": { "title": "str", "items": [{"label": "str", "count": num}], "keyValue": num, "keySymbol": "★" }
9. "compositeShape": { "parts": [{"x": num, "y": num, "w": num, "h": num, "label": "str"}] }
10. "placeholder": { "description": "str" } <-- USE THIS AS A FALLBACK if no other shape fits (e.g., Number Bonds, Clocks).

- "engine" must always be "diagram-library".
- Ensure "visual_payload.params" is a standard nested JSON object, logically updated to reflect the math in your cloned question.
`;

function buildPrompt(seedType) {
  const typeSpecificInstructions = TYPE_RULES[seedType] || TYPE_RULES.mcq;

  return `
You are "Miss Wena," an expert Singapore MOE curriculum designer.
Extract the core concept and generate EXACTLY ${CLONES_PER_SEED} NEW variations.

SCAFFOLDING REQUIREMENTS:
1. "difficulty": 1 "easy", 2 "medium", 1 "hard".
2. "cognitive_skill": Add a 2-3 word string describing the specific micro-skill.
3. "progressive_hints": An array of 2 strings. Hint 1 is a nudge. Hint 2 is a clue.

STRICT SCHEMA REQUIREMENTS:
${typeSpecificInstructions}
${VISUAL_RULES}

Return ONLY a valid JSON array of the ${CLONES_PER_SEED} new question objects. Do NOT wrap in markdown fences.
SEED QUESTION: 
`;
}

const delay = ms => new Promise(res => setTimeout(res, ms));

function sanitizeJsonString(rawString) {
  let clean = rawString.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
  clean = clean.replace(/(?<!\\)\n(?=[^"]*"(?:[^"\\]|\\.)*"(?:[^"\\]|\\.)*$)/g, '\\n');
  return clean;
}

async function runPedagogicalCloner(limit = 10) {
  console.log(`\n👩‍🏫 Waking up the Ultimate Omni-Cloner...`);

  // Target P4 Maths for the test batch
  const { data: seeds, error: fetchErr } = await supabase
    .from('seed_questions')
    .select('*')
    .eq('subject', 'Mathematics')
    .eq('level', 'Primary 4')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (fetchErr || !seeds.length) return console.log('❌ No seeds found for test batch.');

  let totalClones = 0;

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    console.log(`\n[${i+1}/${seeds.length}] 🧬 Scaffolding Seed: ${seed.topic} (${seed.type})`);

    try {
      // 🚀 THE FIX: Handle double-stringified JSON in the seed's DB params
      let cleanSeed = { ...seed };
      if (cleanSeed.visual_payload && typeof cleanSeed.visual_payload.params === 'string') {
        try { cleanSeed.visual_payload.params = JSON.parse(cleanSeed.visual_payload.params); } catch(e) {}
      }

      const dynamicPrompt = buildPrompt(cleanSeed.type);

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: dynamicPrompt + JSON.stringify(cleanSeed) }] }],
        generationConfig: { temperature: 0.6, responseMimeType: "application/json" }
      });
      
      const cleanJson = sanitizeJsonString(result.response.text());
      const clones = JSON.parse(cleanJson);

      const payload = clones.map(c => ({
        ...c, 
        seed_id: seed.id, 
        is_ai_cloned: true,
        subject: seed.subject, 
        level: seed.level,
        topic: seed.topic, 
        cognitive_skill: c.cognitive_skill || null,
        progressive_hints: c.progressive_hints || null,
        source_pdf: seed.source_pdf 
      }));

      const { error: insErr } = await supabase.from('question_bank').insert(payload);
      if (insErr) throw insErr;

      totalClones += payload.length;
      console.log(`   ✅ Ladder Built: ${payload.length} questions safely mapped to UI components.`);

    } catch (e) {
      console.error(`   ⚠️ Failed to scaffold seed ${seed.id}:`, e.message);
    }

    if (i < seeds.length - 1) await delay(3000); 
  }
  
  console.log(`\n🎉 Test Run Complete! Added ${totalClones} adaptive P4 Math questions.`);
}

// Run a small batch of 5 seeds (generating 20 total questions) for your P4 Quiz test
runPedagogicalCloner(5);