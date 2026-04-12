/**
 * scripts/balancer.js
 * The MOE-Aligned Distribution Brain.
 * Audits the DB against a strict MOE syllabus taxonomy, calculates deficits, 
 * and clones questions to ensure perfectly balanced, curriculum-aligned coverage.
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

// 🚀 GOAL: Target number of questions per MOE topic
const TARGET_PER_TOPIC = 100; 
const CLONES_PER_RUN = 4; // 1 Easy, 2 Medium, 1 Hard

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

// 🚀 SOURCE OF TRUTH: The official MOE Taxonomy (mirrors subjects.html)
const MOE_SYLLABUS = [
  // Primary 1 (No formal Science)
  ...['Whole Numbers', 'Addition and Subtraction', 'Multiplication and Division', 'Money', 'Length and Mass', 'Shapes and Patterns', 'Picture Graphs'].map(t => ({ level: 'Primary 1', subject: 'Mathematics', topic: t })),
  ...['Grammar', 'Vocabulary', 'Comprehension', 'Cloze'].map(t => ({ level: 'Primary 1', subject: 'English Language', topic: t })),

  // Primary 2 (No formal Science)
  ...['Whole Numbers', 'Multiplication Tables', 'Fractions', 'Money', 'Time', 'Length, Mass and Volume', 'Shapes', 'Picture Graphs'].map(t => ({ level: 'Primary 2', subject: 'Mathematics', topic: t })),
  ...['Grammar', 'Vocabulary', 'Comprehension', 'Cloze'].map(t => ({ level: 'Primary 2', subject: 'English Language', topic: t })),

  // Primary 3
  ...['Diversity', 'Systems', 'Interactions'].map(t => ({ level: 'Primary 3', subject: 'Science', topic: t })),
  ...['Whole Numbers', 'Fractions', 'Length, Mass and Volume', 'Time', 'Angles', 'Area and Perimeter', 'Bar Graphs'].map(t => ({ level: 'Primary 3', subject: 'Mathematics', topic: t })),
  ...['Grammar', 'Vocabulary', 'Comprehension', 'Cloze', 'Editing'].map(t => ({ level: 'Primary 3', subject: 'English Language', topic: t })),
  
  // Primary 4
  ...['Cycles', 'Energy', 'Heat', 'Light', 'Magnets', 'Matter'].map(t => ({ level: 'Primary 4', subject: 'Science', topic: t })),
  ...['Whole Numbers', 'Factors and Multiples', 'Fractions', 'Decimals', 'Angles', 'Area and Perimeter', 'Symmetry', 'Data Analysis'].map(t => ({ level: 'Primary 4', subject: 'Mathematics', topic: t })),
  ...['Grammar', 'Vocabulary', 'Comprehension', 'Cloze', 'Editing'].map(t => ({ level: 'Primary 4', subject: 'English Language', topic: t })),
  
  // Primary 5
  ...['Cycles', 'Systems', 'Energy', 'Interactions'].map(t => ({ level: 'Primary 5', subject: 'Science', topic: t })),
  ...['Whole Numbers', 'Fractions', 'Decimals', 'Percentage', 'Ratio', 'Rate', 'Area of Triangle', 'Volume', 'Angles and Geometry', 'Average'].map(t => ({ level: 'Primary 5', subject: 'Mathematics', topic: t })),
  ...['Grammar', 'Vocabulary', 'Comprehension', 'Cloze', 'Editing', 'Synthesis'].map(t => ({ level: 'Primary 5', subject: 'English Language', topic: t })),
  
  // Primary 6
  ...['Interactions', 'Energy', 'Cells', 'Forces'].map(t => ({ level: 'Primary 6', subject: 'Science', topic: t })),
  ...['Fractions', 'Percentage', 'Ratio', 'Speed', 'Algebra', 'Circles', 'Volume', 'Geometry', 'Pie Charts'].map(t => ({ level: 'Primary 6', subject: 'Mathematics', topic: t })),
  ...['Grammar', 'Vocabulary', 'Comprehension', 'Cloze', 'Editing', 'Synthesis'].map(t => ({ level: 'Primary 6', subject: 'English Language', topic: t }))
];

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
2. AUTONOMOUS NAMING: If the seed uses a standard chart (e.g., "barChart", "numberLine"), keep it. If the seed's diagram is a unique science/math setup, you MUST invent a highly logical, camelCase function name (e.g., "seedGerminationExperiment", "balanceScaleWeighing"). Do NOT output null or empty strings.
3. PARAMETER SYNC: You MUST accurately update the values inside "visual_payload.params" to mathematically match the new narrative and numbers in your cloned question text.
4. GRAPH READABILITY: For any graphs, charts, or number lines, axes markings and data points MUST land on easily divisible, primary-school-friendly intervals (e.g., exact multiples of 2, 5, 10, or 50). Do not use ambiguous floating-point coordinates.
`;

function buildPrompt(seedType, targetTopic) {
  const typeSpecificInstructions = TYPE_RULES[seedType] || TYPE_RULES.mcq;

  return `
You are an expert Singapore MOE curriculum designer.
Generate EXACTLY ${CLONES_PER_RUN} NEW variations of this seed question.

SCAFFOLDING REQUIREMENTS:
1. "difficulty": 1 "easy", 2 "medium", 1 "hard".
2. "cognitive_skill": Add a 2-3 word string describing the specific micro-skill.
3. "progressive_hints": An array of 2 strings. Hint 1 is a nudge. Hint 2 is a clue.
4. "topic": You MUST categorize every question EXACTLY as "${targetTopic}".

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
  console.log(`\n🧠 Auditing MOE Taxonomy Deficits...`);
  
  let totalDeficit = 0;
  const deficitMap = [];

  // Calculate deficits against the strict MOE syllabus
  for (const moe of MOE_SYLLABUS) {
    const { count } = await supabase
      .from('question_bank')
      .select('*', { count: 'exact', head: true })
      .eq('level', moe.level)
      .eq('subject', moe.subject)
      .eq('topic', moe.topic);

    const deficit = TARGET_PER_TOPIC - (count || 0);
    if (deficit > 0) {
      deficitMap.push({ ...moe, deficit });
      totalDeficit += deficit;
    }
  }

  if (deficitMap.length === 0) return console.log(`\n🎉 INCREDIBLE! The MOE Vault is 100% complete!`);

  // Target the weakest link
  deficitMap.sort((a, b) => b.deficit - a.deficit);
  
  console.log(`🚨 Global Deficit: ${totalDeficit} questions needed.`);

  let target = null;
  let targetSeeds = null;

  // 🚀 THE FIX: Walk down the priority list until we find a topic that has seed inventory
  for (const potentialTarget of deficitMap) {
    // Clean the first word to remove commas/symbols for the fuzzy match
    const firstWord = potentialTarget.topic.split(' ')[0].replace(/[^a-zA-Z]/g, '');

    const { data: seeds } = await supabase
      .from('seed_questions')
      .select('*')
      .eq('level', potentialTarget.level)
      .eq('subject', potentialTarget.subject)
      .ilike('topic', `%${firstWord}%`)
      .limit(10);

    if (seeds && seeds.length > 0) {
      target = potentialTarget;
      targetSeeds = seeds;
      break; // Found our highest-priority topic that actually has seeds!
    } else {
      console.log(`   ⏭️ Skipping Priority "${potentialTarget.topic}" (${potentialTarget.level}): No seeds in Vault.`);
    }
  }

  // If we looped through the entire deficit map and found zero seeds anywhere
  if (!target || !targetSeeds) {
     console.log(`\n🛑 System Halted: Deficits exist, but the Vault is completely out of seeds for all needed topics!`);
     console.log(`   (You need to run ingestor.js on new PDFs to restock the Vault).`);
     // Pause the script for a long time to prevent spamming the database
     await new Promise(resolve => setTimeout(resolve, 60000));
     return; 
  }

  console.log(`🏭 Routing cloning engine to Priority: ${target.level} ${target.subject} - "${target.topic}"`);

  const randomSeed = targetSeeds[Math.floor(Math.random() * targetSeeds.length)];

  if (randomSeed.visual_payload && typeof randomSeed.visual_payload.params === 'string') {
    try { randomSeed.visual_payload.params = JSON.parse(randomSeed.visual_payload.params); } catch(e) {}
  }

  try {
    const prompt = buildPrompt(randomSeed.type, target.topic);
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
        seed_id: randomSeed.id, 
        is_ai_cloned: true,
        subject: target.subject, 
        level: target.level,
        topic: target.topic, // 🚀 FORCE The clean MOE Topic
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

    console.log(`✅ Success! Injected ${payload.length} new adaptive questions for "${target.topic}".`);
  } catch (e) {
    console.error(`⚠️ Engine Error on ${target.topic}:`, e.message);
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