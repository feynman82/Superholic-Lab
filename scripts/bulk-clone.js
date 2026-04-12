/**
 * scripts/bulk-clone.js
 * The Ultimate Omni-Cloner. 
 * Generates vertical difficulty ladders, cognitive tags, progressive hints, 
 * and strictly enforces Superholic Lab's schema rules from handlers.js.
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
// We use the full flash model here to ensure it can handle complex schema instructions without hallucinating
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

const CLONES_PER_SEED = 4; // 1 Easy, 2 Medium, 1 Hard

// Directly imported schema rules from your handlers.js
const TYPE_RULES = {
  mcq: `\n- Each question must have exactly 4 options (A, B, C, D).\n- Include a "wrong_explanations" object. Keys are the wrong options (e.g., "A", "B"). Values must name the specific misconception.\n- Include an "examiner_note" for each question.`,
  short_ans: `\n- Answers must be concise (a number, expression, or short phrase).\n- Include an "accept_also" array for equivalent correct forms (e.g., with units).`,
  word_problem: `\n- Each word problem must have a "parts" array with 2–3 parts.\n- Show full step-by-step "worked_solution" and marking scheme per part.\n- Include an "examiner_note" about PSLE method marks.`,
  open_ended: `\n- Write a "model_answer" in complete paragraph form following the CER (Claim, Evidence, Reasoning) framework.\n- List a "keywords" array of all essential terms the student must include.\n- Provide a clear 2/1/0 marking rubric in the worked solution.`,
  cloze: `\n- The "passage" must have blanks marked as [1], [2], etc.\n- Include a "blanks" array. Each object needs: number, options (4 strings), correct_answer (the exact string, not the letter), and explanation.`,
  editing: `\n- Include a "passage_lines" array.\n- Each line object needs: line_number, text, underlined_word, has_error (boolean), correct_word (null if no error), explanation (null if no error).`
};

function buildPrompt(seedType) {
  const typeSpecificInstructions = TYPE_RULES[seedType] || TYPE_RULES.mcq;

  return `
You are "Miss Wena," an expert Singapore MOE curriculum designer.
I will provide a SEED question. Extract its core concept and generate EXACTLY ${CLONES_PER_SEED} NEW variations.

CRITICAL SCAFFOLDING REQUIREMENTS:
1. "difficulty": You MUST scaffold the ${CLONES_PER_SEED} questions exactly like this:
   - Question 1: "easy" (Direct, foundational application. Builds confidence).
   - Question 2: "medium" (Standard MOE exam level).
   - Question 3: "medium" (Standard MOE exam level, different scenario).
   - Question 4: "hard" (Multi-step heuristic or tricky application).
2. "cognitive_skill": Add a 2-3 word string describing the specific micro-skill tested.
3. "progressive_hints": An array of 2 strings. Hint 1 is a gentle nudge. Hint 2 is a stronger clue.

STRICT SCHEMA REQUIREMENTS (For ${seedType}):
${typeSpecificInstructions}
- ALWAYS maintain the same JSON structure as the seed. 
- Ensure all math works cleanly. Use Singapore contexts (SGD, MRT, local names).

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

async function runPedagogicalCloner(limit = 100) {
  console.log(`\n👩‍🏫 Waking up the Ultimate Omni-Cloner...`);

  // Fetch seeds from the vault
  const { data: seeds, error: fetchErr } = await supabase
    .from('seed_questions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (fetchErr || !seeds.length) return console.log('❌ No seeds found to clone.');

  let totalClones = 0;

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    console.log(`\n[${i+1}/${seeds.length}] 🧬 Scaffolding Seed: ${seed.topic} (${seed.type})`);

    try {
      const dynamicPrompt = buildPrompt(seed.type);

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: dynamicPrompt + JSON.stringify(seed) }] }],
        generationConfig: { temperature: 0.6, responseMimeType: "application/json" }
      });
       
      const VISUAL_RULES = `
      - PROCEDURAL DIAGRAMS: Check if the provided seed question contains a "visual_payload" object. 
      - If it does, your cloned questions MUST also include the exact same "visual_payload" structure (keeping the same "engine" and "function_name").
      - CRITICAL: You MUST mathematically and logically update the values inside "visual_payload.params" to perfectly match the new numbers, names, or scenarios you generated in your cloned question text.
      - Do not invent new function names. Only modify the parameter values to sync with your new question.
      `;

      // Example of how you integrate it into your existing prompt builder:
      function buildPrompt(type) {
      let basePrompt = `You are an expert MOE syllabus curriculum developer...`;
      let typeSpecificRules = TYPE_RULES[type] || '';
  
      // Combine them and inject the visual rules
      return `${basePrompt}\n${typeSpecificRules}\n${VISUAL_RULES}\n\nSeed Question:\n`;
      }
      
      const cleanJson = sanitizeJsonString(result.response.text());
      const clones = JSON.parse(cleanJson);

      const payload = clones.map(c => ({
        ...c, // Spread the AI's generated content (including parts, blanks, hints, etc.)
        seed_id: seed.id, 
        is_ai_cloned: true,
        subject: seed.subject, 
        level: seed.level,
        topic: seed.topic, // Force the original UI taxonomy
        cognitive_skill: c.cognitive_skill || null,
        progressive_hints: c.progressive_hints || null,
        source_pdf: seed.source_pdf 
      }));

      const { error: insErr } = await supabase.from('question_bank').insert(payload);
      if (insErr) throw insErr;

      totalClones += payload.length;
      console.log(`   ✅ Ladder Built: ${payload.length} questions strictly formatted for handlers.js.`);

    } catch (e) {
      console.error(`   ⚠️ Failed to scaffold seed ${seed.id}:`, e.message);
    }

    if (i < seeds.length - 1) await delay(3000); 
  }
  
  console.log(`\n🎉 Scaffold Run Complete! Added ${totalClones} adaptive questions.`);
}

runPedagogicalCloner(100);