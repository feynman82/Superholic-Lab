/**
 * scripts/bulk-clone.js
 * The Local Bulk Factory.
 * Bypasses Vercel's 10-second timeout to clone massive amounts of questions.
 * Built with a delay to respect Gemini's 15 Requests-Per-Minute free tier limit.
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

const CLONE_PROMPT = `
You are an expert Singapore MOE curriculum question cloner. Generate exactly 5 NEW variations of this seed question.
Keep the exact same JSON schema structure, logical difficulty, and underlying concept.
Change the real-world scenarios, names, and numerical values. Ensure math works out cleanly.
Return ONLY a valid JSON array of the 5 new question objects. Do NOT wrap in markdown fences.
SEED: 
`;

// Delay function to prevent hitting Gemini's Free Tier Rate Limits (15 Requests / Min)
const delay = ms => new Promise(res => setTimeout(res, ms));

async function runBulkClone(limit = 10) {
  console.log(`\n🏭 Starting Bulk Factory (Target: ${limit} seeds -> ${limit * 5} clones)`);
  
  const { data: seeds, error: seedErr } = await supabase
    .from('seed_questions')
    .select('*')
    .limit(limit);

  if (seedErr || !seeds.length) return console.log('❌ No seeds found.');

  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
  let successCount = 0;

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    console.log(`\n[${i + 1}/${seeds.length}] 🧬 Cloning Seed: ${seed.topic} (${seed.type})`);

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: CLONE_PROMPT + JSON.stringify(seed) }] }],
        generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
      });

      const cleanJson = result.response.text().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      const clones = JSON.parse(cleanJson);

      const payload = clones.map(c => ({
        seed_id: seed.id, is_ai_cloned: true,
        subject: c.subject || seed.subject, level: c.level || seed.level,
        topic: c.topic || seed.topic, difficulty: c.difficulty || seed.difficulty,
        type: c.type || seed.type, marks: c.marks || seed.marks,
        question_text: c.question_text, options: c.options || null,
        correct_answer: c.correct_answer || null, worked_solution: c.worked_solution || null,
        parts: c.parts || null, model_answer: c.model_answer || null,
        passage: c.passage || null, blanks: c.blanks || null, passage_lines: c.passage_lines || null
      }));

      const { error: insErr } = await supabase.from('question_bank').insert(payload);
      
      if (insErr) console.error(`❌ DB Insert Error:`, insErr.message);
      else {
        successCount += payload.length;
        console.log(`✅ Success! Added ${payload.length} new questions to the live bank.`);
      }

    } catch (e) {
      console.error(`⚠️ Generation failed for this seed:`, e.message);
    }

    // Wait 5 seconds between requests to ensure we stay safely under the 15 RPM free limit
    if (i < seeds.length - 1) {
      console.log(`⏳ Cooling down AI engine for 5 seconds...`);
      await delay(5000); 
    }
  }

  console.log(`\n🎉 Bulk Run Complete! Injected ${successCount} new questions into the database.`);
}

// Run it (Grab 10 seeds to create 50 questions)
runBulkClone(10);