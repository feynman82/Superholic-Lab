 /**
 * scripts/balancer.js
 * The Distribution Brain. Audits the database, calculates deficits, 
 * and strategically routes cloning power to hit target quotas evenly.
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

// 🚀 THE GOAL: How many questions do you want per topic?
// For 10,000 total questions across ~100 topics, set this to 100.
const TARGET_PER_TOPIC = 100; 
const CLONES_PER_RUN = 5; // How many variations to generate per API call

// Since you are on the Paid Tier, we will use the hyper-fast, cost-effective Lite model for cloning
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

const CLONE_PROMPT = `
You are an expert Singapore MOE curriculum question cloner. Generate exactly ${CLONES_PER_RUN} NEW variations of this seed question.
Keep the exact same JSON schema structure, logical difficulty, and underlying concept.
Change the real-world scenarios, names, and numerical values. Ensure math works out cleanly.
Return ONLY a valid JSON array of the ${CLONES_PER_RUN} new question objects. Do NOT wrap in markdown fences.
SEED: 
`;

async function runBalancer() {
  console.log(`\n🧠 Waking up the Distribution Brain...`);
  console.log(`🎯 Target: ${TARGET_PER_TOPIC} questions per topic.`);

  // 1. Find all unique topics available in the Gold Standard Vault
  const { data: seeds, error: seedErr } = await supabase.from('seed_questions').select('topic');
  if (seedErr) return console.error("❌ Failed to fetch seeds:", seedErr);

  const uniqueTopics = [...new Set(seeds.map(s => s.topic).filter(Boolean))];
  console.log(`📊 Found ${uniqueTopics.length} distinct topics in the Vault.`);

  let totalDeficit = 0;
  const deficitMap = [];

  // 2. Audit the live Question Bank
  for (const topic of uniqueTopics) {
    const { count, error } = await supabase
      .from('question_bank')
      .select('*', { count: 'exact', head: true })
      .eq('topic', topic);

    const currentCount = count || 0;
    const deficit = TARGET_PER_TOPIC - currentCount;

    if (deficit > 0) {
      deficitMap.push({ topic, deficit });
      totalDeficit += deficit;
    }
  }

  if (deficitMap.length === 0) {
    return console.log(`\n🎉 INCREDIBLE! All topics have reached the target of ${TARGET_PER_TOPIC}. The Bank is full!`);
  }

  // 3. Sort by highest deficit (prioritize the weakest topics first)
  deficitMap.sort((a, b) => b.deficit - a.deficit);
  
  console.log(`\n🚨 System Deficit: We need ${totalDeficit} more questions to hit the goal.`);
  console.log(`🥇 Highest Priority Topic: "${deficitMap[0].topic}" (Needs ${deficitMap[0].deficit} more)`);

  // 4. Execute the targeted cloning (We will just process the top priority topic for now)
  const targetTopic = deficitMap[0].topic;
  console.log(`\n🏭 Routing factory power to: ${targetTopic}...`);

  // Grab a random seed from this specific topic to clone
  const { data: targetSeeds } = await supabase
    .from('seed_questions')
    .select('*')
    .eq('topic', targetTopic)
    .limit(10); // Grab up to 10 options so we don't always clone the exact same seed

  // Pick a random seed from the options
  const randomSeed = targetSeeds[Math.floor(Math.random() * targetSeeds.length)];

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: CLONE_PROMPT + JSON.stringify(randomSeed) }] }],
      generationConfig: { temperature: 0.8, responseMimeType: "application/json" }
    });

    const cleanJson = result.response.text().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const clones = JSON.parse(cleanJson);

    const payload = clones.map(c => ({
      seed_id: randomSeed.id, is_ai_cloned: true,
      subject: c.subject || randomSeed.subject, level: c.level || randomSeed.level,
      topic: targetTopic, difficulty: c.difficulty || randomSeed.difficulty,
      type: c.type || randomSeed.type, marks: c.marks || randomSeed.marks,
      question_text: c.question_text, options: c.options || null,
      correct_answer: c.correct_answer || null, worked_solution: c.worked_solution || null,
      parts: c.parts || null, model_answer: c.model_answer || null,
      passage: c.passage || null, blanks: c.blanks || null, passage_lines: c.passage_lines || null
    }));

    const { error: insErr } = await supabase.from('question_bank').insert(payload);
    if (insErr) throw insErr;

    console.log(`✅ Success! Injected ${payload.length} new "${targetTopic}" questions into the bank.`);
  } catch (e) {
    console.error(`⚠️ Factory Error on ${targetTopic}:`, e.message);
  }
}

// Start the continuous balancing loop (runs once every 3 seconds)
async function startAutoBalancer() {
  // We run it in a loop so it constantly chips away at the deficit!
  // Since you are on Paid Tier, we can run this rapidly without 429 errors.
  console.log("🟢 Auto-Balancer Online. Press CTRL+C to stop.");
  while (true) {
    await runBalancer();
    // 3 second delay between cycles to avoid overwhelming the database connections
    await new Promise(resolve => setTimeout(resolve, 3000)); 
  }
}

startAutoBalancer();