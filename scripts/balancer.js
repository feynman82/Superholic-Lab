/**
 * scripts/balancer.js
 * The Distribution Brain (V2 - Unified Engine).
 * Audits the DB, calculates deficits, and clones with strict schema parity.
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

// 🚀 GOAL: The target number of questions you want for EACH topic
const TARGET_PER_TOPIC = 100; 
const CLONES_PER_RUN = 4; // 1 Easy, 2 Medium, 1 Hard

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

const TYPE_RULES = {
  mcq: `\n- Each question must have exactly 4 options (A, B, C, D).\n- Include a "wrong_explanations" object. Keys are the wrong options.\n- Include an "examiner_note" for each question.`,
  short_ans: `\n- Answers must be concise (a number, expression, or short phrase).\n- Include an "accept_also" array for equivalent correct forms.`,
  word_problem: `\n- Each word problem must have a "parts" array with 2–3 parts.\n- Show full step-by-step "worked_solution".\n- Include an "examiner_note".`,
  open_ended: `\n- Write a "model_answer" using CER framework.\n- List "keywords" array.\n- Provide a marking rubric in worked solution.`,
  cloze: `\n- "passage" must have blanks marked as [1], [2].\n- Include "blanks" array (number, options, correct_answer, explanation).`,
  editing: `\n- Include "passage_lines" array (line_number, text, underlined_word, has_error, correct_word, explanation).`
};

const VISUAL_RULES = `
CRITICAL VISUAL PAYLOAD RULES:
If the seed question contains a "visual_payload", your clones MUST include an updated "visual_payload".
1. "engine" must ALWAYS be "diagram-library".
2. AUTONOMOUS NAMING: If the seed uses a standard chart (e.g., "barChart", "numberLine"), keep it. If the seed's diagram is a unique science/math setup, you MUST invent a highly logical, camelCase function name (e.g., "seedGerminationExperiment", "balanceScaleWeighing").
3. PARAMETER SYNC: You MUST accurately update the values inside "visual_payload.params" to mathematically match the new narrative and numbers in your cloned question text.
4. GRAPH READABILITY: For any graphs, charts, or number lines, axes markings and data points MUST land on easily divisible, primary-school-friendly intervals (e.g., exact multiples of 2, 5, 10, or 50). Do not use ambiguous floating-point coordinates.
`;

function buildPrompt(seedType) {
  const typeSpecificInstructions = TYPE_RULES[seedType] || TYPE_RULES.mcq;

  return `
You are an expert Singapore MOE curriculum designer.
Generate EXACTLY ${CLONES_PER_RUN} NEW variations of this seed question.

SCAFFOLDING REQUIREMENTS:
1. "difficulty": 1 "easy", 2 "medium", 1 "hard".
2. "cognitive_skill": Add a 2-3 word string describing the specific micro-skill.
3. "progressive_hints": An array of 2 strings. Hint 1 is a nudge. Hint 2 is a clue.

STRICT SCHEMA REQUIREMENTS:
- CORE KEYS: You MUST include "question_text", "type", and "marks". Do NOT omit them.
${typeSpecificInstructions}
${VISUAL_RULES}

Return ONLY a valid JSON array of the ${CLONES_PER_RUN} new question objects. Do NOT wrap in markdown fences.
SEED: 
`;
}

function sanitizeJsonString(rawString) {
  return rawString.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
}

async function runBalancer() {
  console.log(`\n🧠 Auditing Cross-Subject Deficits...`);

  // 1. Audit unique topics in the Vault
  const { data: seeds, error: seedErr } = await supabase.from('seed_questions').select('topic, subject');
  if (seedErr) return console.error("❌ Failed to fetch seeds:", seedErr);

  const uniqueTopics = [...new Set(seeds.map(s => s.topic).filter(Boolean))];
  
  let totalDeficit = 0;
  const deficitMap = [];

  // 2. Calculate global deficits across all subjects
  for (const topic of uniqueTopics) {
    const { count } = await supabase
      .from('question_bank')
      .select('*', { count: 'exact', head: true })
      .eq('topic', topic);

    const deficit = TARGET_PER_TOPIC - (count || 0);
    if (deficit > 0) {
      deficitMap.push({ topic, deficit });
      totalDeficit += deficit;
    }
  }

  if (deficitMap.length === 0) return console.log(`\n🎉 INCREDIBLE! The Global Bank is at 100% capacity!`);

  // 3. Target the weakest link
  deficitMap.sort((a, b) => b.deficit - a.deficit);
  const targetTopic = deficitMap[0].topic;
  
  console.log(`🚨 Global Deficit: ${totalDeficit} questions needed.`);
  console.log(`🏭 Routing cloning engine to Priority #1: "${targetTopic}"`);

  // Grab up to 10 random seeds from this specific topic to ensure variety
  const { data: targetSeeds } = await supabase.from('seed_questions').select('*').eq('topic', targetTopic).limit(10);
  const randomSeed = targetSeeds[Math.floor(Math.random() * targetSeeds.length)];

  // Clean the seed parameters
  if (randomSeed.visual_payload && typeof randomSeed.visual_payload.params === 'string') {
    try { randomSeed.visual_payload.params = JSON.parse(randomSeed.visual_payload.params); } catch(e) {}
  }

  try {
    const prompt = buildPrompt(randomSeed.type);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt + JSON.stringify(randomSeed) }] }],
      generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
    });

    const cleanJson = sanitizeJsonString(result.response.text());
    const clones = JSON.parse(cleanJson);

    // 🚀 Destructuring filter to prevent schema crashes
    const payload = clones.map(c => {
      const { flag_review, id, created_at, original_id, source_pdf, image_url, ...cleanClone } = c;
      return {
        ...cleanClone,
        seed_id: randomSeed.id, 
        is_ai_cloned: true,
        subject: cleanClone.subject || randomSeed.subject, 
        level: cleanClone.level || randomSeed.level,
        topic: targetTopic, 
        // 🚀 IRONCLAD FALLBACKS: Prevent NOT NULL database crashes
        type: cleanClone.type || randomSeed.type || 'short_ans',
        question_text: cleanClone.question_text || randomSeed.question_text || '[AI omitted question text]',
        marks: cleanClone.marks || randomSeed.marks || 1,
        
        cognitive_skill: cleanClone.cognitive_skill || null,
        progressive_hints: cleanClone.progressive_hints || null,
        instructions: cleanClone.instructions || randomSeed.instructions || null,
        visual_payload: cleanClone.visual_payload || null 
      };
    });

    const { error: insErr } = await supabase.from('question_bank').insert(payload);
    if (insErr) throw insErr;

    console.log(`✅ Success! Injected ${payload.length} new adaptive "${targetTopic}" questions.`);
  } catch (e) {
    console.error(`⚠️ Engine Error on ${targetTopic}:`, e.message);
  }
}

async function startAutoBalancer() {
  console.log("🟢 Superholic Global Balancer Online. Press CTRL+C to stop.");
  while (true) {
    await runBalancer();
    await new Promise(resolve => setTimeout(resolve, 4000)); // 4-second delay to respect API and DB limits
  }
}

startAutoBalancer();