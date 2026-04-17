/**
 * scripts/balancer.js
 * The MOE-Aligned Distribution Brain (Masterclass Edition).
 * Audits the DB against a strict MOE syllabus taxonomy down to the sub-topic level,
 * calculates deficits, and clones questions to ensure perfectly balanced coverage.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 🚀 TARGET: Target number of questions per SUB-TOPIC
const TARGET_PER_SUB_TOPIC = 20; 
const CLONES_PER_RUN = 4; // 1 Easy, 2 Medium, 1 Hard

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

// 🚀 EXHAUSTIVE MOE TAXONOMY
const MOE_SYLLABUS = [
  // Primary 3 Math
  ...['Part-Whole', 'Comparison', 'Division with Remainder', '2-Step Word Problems'].map(st => ({ level: 'Primary 3', subject: 'Mathematics', topic: 'Whole Numbers', sub_topic: st })),
  ...['Equivalent Fractions', 'Comparing Fractions', 'Addition/Subtraction'].map(st => ({ level: 'Primary 3', subject: 'Mathematics', topic: 'Fractions', sub_topic: st })),
  ...['Length', 'Mass', 'Volume', 'Time'].map(st => ({ level: 'Primary 3', subject: 'Mathematics', topic: 'Measurement', sub_topic: st })),
  ...['Money Word Problems'].map(st => ({ level: 'Primary 3', subject: 'Mathematics', topic: 'Money', sub_topic: st })),
  ...['Angles', 'Area and Perimeter', 'Bar Graphs'].map(st => ({ level: 'Primary 3', subject: 'Mathematics', topic: 'Geometry & Graphs', sub_topic: st })),
  
  // Primary 4 Math
  ...['Factors & Multiples', 'Grouping/Sets', 'Constant Difference'].map(st => ({ level: 'Primary 4', subject: 'Mathematics', topic: 'Whole Numbers', sub_topic: st })),
  ...['Mixed Numbers', 'Fraction of a Set', 'Remainder Heuristic'].map(st => ({ level: 'Primary 4', subject: 'Mathematics', topic: 'Fractions', sub_topic: st })),
  ...['Addition/Subtraction', 'Multiplication/Division', 'Money Step-Rates'].map(st => ({ level: 'Primary 4', subject: 'Mathematics', topic: 'Decimals', sub_topic: st })),
  ...['Symmetry', '8-Point Compass', 'Push-out Perimeter', 'Composite Area', 'Line Graphs'].map(st => ({ level: 'Primary 4', subject: 'Mathematics', topic: 'Geometry & Measurement', sub_topic: st })),

  // Primary 5 Math
  ...['Order of Operations', 'Supposition', 'Excess and Shortage'].map(st => ({ level: 'Primary 5', subject: 'Mathematics', topic: 'Whole Numbers', sub_topic: st })),
  ...['Equating Numerators', 'Branching', 'Remainder of Remainder'].map(st => ({ level: 'Primary 5', subject: 'Mathematics', topic: 'Fractions', sub_topic: st })),
  ...['One Part Unchanged', 'Internal Transfer', 'Constant Difference', 'Repeated Identity'].map(st => ({ level: 'Primary 5', subject: 'Mathematics', topic: 'Ratio', sub_topic: st })),
  ...['Base Shifts', 'GST/Discount', 'Rates'].map(st => ({ level: 'Primary 5', subject: 'Mathematics', topic: 'Percentage', sub_topic: st })),
  ...['Area of Triangle', 'Volume Displacement', 'Angles in Polygons', 'Average'].map(st => ({ level: 'Primary 5', subject: 'Mathematics', topic: 'Geometry & Stats', sub_topic: st })),

  // Primary 6 Math
  ...['Algebraic substitution', 'Simultaneous Concepts', 'Changing Bases', 'Speed (Catching up)', 'Circles', 'Nets/Solids', 'Pie Charts'].map(st => ({ level: 'Primary 6', subject: 'Mathematics', topic: 'P6 Math Core', sub_topic: st })),

  // Science Examples (P3-P6)
  ...['Living/Non-Living', 'Materials', 'Human Digestive', 'Magnets'].map(st => ({ level: 'Primary 3', subject: 'Science', topic: 'Diversity & Systems', sub_topic: st })),
  ...['Matter', 'Life Cycles', 'Heat', 'Light'].map(st => ({ level: 'Primary 4', subject: 'Science', topic: 'Cycles & Energy', sub_topic: st })),
  ...['Water Cycle', 'Reproduction', 'Electrical Circuits', 'Plant Transport'].map(st => ({ level: 'Primary 5', subject: 'Science', topic: 'Cycles & Systems', sub_topic: st })),
  ...['Forces', 'Environment', 'Food Webs', 'Energy Conversions'].map(st => ({ level: 'Primary 6', subject: 'Science', topic: 'Interactions & Energy', sub_topic: st }))
];

const TYPE_RULES = {
  mcq: `\n- Each question must have an "options" array with exactly 4 string values.\n- "correct_answer" MUST be the exact string value. Do NOT use "A", "B", "C", or "D".\n- Include a "wrong_explanations" object.`,  
  short_ans: `\n- Answers must be concise.\n- Include an "accept_also" array for equivalent correct forms.`,
  word_problem: `\n- Include a "parts" array with 2–3 sub-questions (a, b).\n- Each part MUST have "label", "question", "marks", "correct_answer", "worked_solution", and "progressive_hints" (array of 2 strings).`,
  open_ended: `\n- Include a "parts" array exactly like the 'word_problem' schema for sub-questions (a, b).\n- "correct_answer" in each part should be the ideal scientific phrasing/CER statement.\n- Include "keywords" array and "progressive_hints" to guide the student's reasoning.`,
  cloze: `\n- "passage" must have blanks marked as [1], [2].\n- Include "blanks" array with options and correct_answer. DO NOT put options inside the passage.`,
  editing: `\n- Errors embedded directly in the "passage" using <u>error</u> [1].\n- Include "blanks" array with the correct_answer correction.`
};

const masterTemplate = fs.readFileSync(path.join(__dirname, '../data/Master_Question_Template.md'), 'utf8');

function buildPrompt(seedType, targetNode) {
  const typeSpecificInstructions = TYPE_RULES[seedType] || TYPE_RULES.mcq;

  return `
You are an expert Singapore MOE curriculum designer. You must strictly follow the rules defined in this Master Template:

${masterTemplate}

Follow the TYPE_RULES below for the specific question format:
${typeSpecificInstructions}

STRICT CONSTRAINTS (DO NOT VIOLATE):
1. SQL ESCAPING (CRITICAL): Every single quote or apostrophe in your text strings MUST be double-escaped (e.g., Siti''s apples).
2. TYPE LOCK: You MUST NOT change the "type" of the seed question.
3. SCAFFOLDING: "difficulty": 1 "easy", 2 "medium", 1 "hard". Provide "cognitive_skill" and "progressive_hints".
4. CATEGORIZATION: You MUST categorize every question EXACTLY as Topic: "${targetNode.topic}" and Sub-Topic: "${targetNode.sub_topic}".

Return ONLY a valid JSON array of ${CLONES_PER_RUN} new question objects. Do NOT wrap in markdown fences.
SEED: 
`;
}

function sanitizeJsonString(rawString) {
  return rawString.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
}

async function runBalancer() {
  console.log(`\n🧠 Auditing MOE Taxonomy Deficits (Sub-Topic Level)...`);
  
  let totalDeficit = 0;
  const deficitMap = [];

  for (const moe of MOE_SYLLABUS) {
    const { count } = await supabase
      .from('question_bank')
      .select('*', { count: 'exact', head: true })
      .eq('level', moe.level)
      .eq('subject', moe.subject)
      .eq('sub_topic', moe.sub_topic); // Balancing heavily relies on sub_topic now

    const deficit = TARGET_PER_SUB_TOPIC - (count || 0);
    if (deficit > 0) {
      deficitMap.push({ ...moe, deficit });
      totalDeficit += deficit;
    }
  }

  if (deficitMap.length === 0) return console.log(`\n🎉 INCREDIBLE! The MOE Vault is 100% complete!`);

  deficitMap.sort((a, b) => b.deficit - a.deficit);
  console.log(`🚨 Global Deficit: ${totalDeficit} questions needed.`);

  let target = null;
  let targetSeeds = null;

  for (const potentialTarget of deficitMap) {
    const firstWord = potentialTarget.sub_topic.split(' ')[0].replace(/[^a-zA-Z]/g, '');

    // Search seed DB using sub_topic matching
    const { data: seeds } = await supabase
      .from('seed_questions')
      .select('*')
      .eq('level', potentialTarget.level)
      .eq('subject', potentialTarget.subject)
      .ilike('sub_topic', `%${firstWord}%`)
      .limit(10);

    if (seeds && seeds.length > 0) {
      target = potentialTarget;
      targetSeeds = seeds;
      break; 
    }
  }

  if (!target || !targetSeeds) {
     console.log(`\n🛑 System Halted: Deficits exist, but Vault is out of seeds. Run ingestor.js.`);
     await new Promise(resolve => setTimeout(resolve, 60000));
     return; 
  }

  console.log(`🏭 Routing cloning engine to Priority: ${target.level} ${target.subject} - "${target.sub_topic}"`);

  const randomSeed = targetSeeds[Math.floor(Math.random() * targetSeeds.length)];

  if (randomSeed.visual_payload && typeof randomSeed.visual_payload.params === 'string') {
    try { randomSeed.visual_payload.params = JSON.parse(randomSeed.visual_payload.params); } catch(e) {}
  }

  try {
    const prompt = buildPrompt(randomSeed.type, target);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt + JSON.stringify(randomSeed) }] }],
      generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
    });

    const cleanJson = sanitizeJsonString(result.response.text());
    const clones = JSON.parse(cleanJson);

    const payload = clones.map(c => {
      const { flag_review, id, created_at, original_id, source_pdf, image_url, ...cleanClone } = c;
      return {
        ...cleanClone,
        id: crypto.randomUUID(), // Guarantee fresh UUID
        seed_id: randomSeed.id, 
        is_ai_cloned: true,
        subject: target.subject, 
        level: target.level,
        topic: target.topic, 
        sub_topic: target.sub_topic, // 🚀 FORCE The Sub-Topic
        type: cleanClone.type || randomSeed.type,
        visual_payload: cleanClone.visual_payload ? JSON.stringify(cleanClone.visual_payload) : null // Ensure stringified
      };
    });

    const { error: insErr } = await supabase.from('question_bank').insert(payload);
    if (insErr) throw insErr;

    console.log(`✅ Success! Injected ${payload.length} new adaptive questions for "${target.sub_topic}".`);
  } catch (e) {
    console.error(`⚠️ Engine Error on ${target.sub_topic}:`, e.message);
  }
}

async function startAutoBalancer() {
  console.log("🟢 Superholic MOE Balancer Online. Press CTRL+C to stop.");
  while (true) {
    await runBalancer();
    await new Promise(resolve => setTimeout(resolve, 4000)); 
  }
}

startAutoBalancer();