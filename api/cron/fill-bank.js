/**
 * api/cron/fill-bank.js
 * The Infinite Clone Engine. 
 * Fetches Gold Standard seeds and generates variations to fill the live bank.
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Clients
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CLONE_PROMPT = `
You are an expert Singapore MOE curriculum question cloner.
I am going to provide you with ONE "Gold Standard" seed question.

YOUR TASK:
Generate exactly 5 NEW variations of this question.
1. Keep the exact same logical structure, difficulty, and underlying concept.
2. Keep the exact same JSON schema structure.
3. Change the real-world scenario, the names (use Singapore names like Ahmad, Siti, Mei Ling, Ravi), the objects, and the numerical values.
4. For Math: Ensure the new numbers work out cleanly without recurring decimals unless the original question had them.
5. For Science: Change the experiment setup slightly (e.g., instead of testing heat conductivity with metal/plastic spoons, use glass/ceramic cups), but test the exact same concept.

Return ONLY a valid JSON array of the 5 new question objects. Do NOT wrap in markdown fences.

SEED QUESTION TO CLONE:
`;
 
export default async function handler(req, res) {
  // Security check: Only allow POST requests or Vercel Cron authorization
  if (req.method !== 'POST' && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🚀 Waking up Clone Engine...');

    // 1. Fetch 3 random seeds from the vault
    const { data: seeds, error: seedErr } = await supabase
      .from('seed_questions')
      .select('*')
      .limit(3); 
      // Note: In production, you would order by random() or target specific weak topics

    if (seedErr || !seeds || seeds.length === 0) throw new Error('No seeds found');

    let totalCloned = 0;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Flash is perfect and fast for this

    // 2. Clone each seed
    for (const seed of seeds) {
      console.log(`🧬 Cloning seed: ${seed.id} (${seed.subject} - ${seed.topic})`);
      
      const prompt = CLONE_PROMPT + JSON.stringify(seed, null, 2);
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
      });

      const rawText = result.response.text();
      let clones = [];
      
      try {
        // Strip markdown if AI misbehaves despite MIME type
        const cleanJson = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        clones = JSON.parse(cleanJson);
      } catch (e) {
        console.warn(`⚠️ Failed to parse clones for seed ${seed.id}. Skipping.`);
        continue;
      }

      // 3. Format clones for the live bank
      const payload = clones.map(clone => ({
        seed_id: seed.id,
        is_ai_cloned: true,
        subject: clone.subject || seed.subject,
        level: clone.level || seed.level,
        topic: clone.topic || seed.topic,
        sub_topic: clone.sub_topic || seed.sub_topic,
        difficulty: clone.difficulty || seed.difficulty,
        type: clone.type || seed.type,
        marks: clone.marks || seed.marks,
        question_text: clone.question_text,
        options: clone.options || null,
        correct_answer: clone.correct_answer || null,
        wrong_explanations: clone.wrong_explanations || null,
        worked_solution: clone.worked_solution || null,
        parts: clone.parts || null,
        keywords: clone.keywords || null,
        model_answer: clone.model_answer || null,
        passage: clone.passage || null,
        blanks: clone.blanks || null,
        passage_lines: clone.passage_lines || null,
        examiner_note: clone.examiner_note || null
      }));

      // 4. Deposit into live bank
      const { error: insertErr } = await supabase.from('question_bank').insert(payload);
      
      if (insertErr) {
        console.error(`❌ Failed to insert clones:`, insertErr.message);
      } else {
        totalCloned += payload.length;
      }
    }
 
    return res.status(200).json({ success: true, cloned: totalCloned });

  } catch (err) {
    console.error('❌ Engine Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' }); 
  }
}