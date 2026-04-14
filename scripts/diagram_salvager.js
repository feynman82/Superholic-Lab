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

const PROMPT = `
You are a data visualization expert for a Singapore MOE math platform.
Read the following math question. Your job is to determine if there is enough data IN THE TEXT to reconstruct a diagram (pie chart, bar graph, line graph, etc.).

IF YES:
Return ONLY a valid JSON object representing the "visual_payload". 
- "engine" MUST be "diagram-library"
- "function_name" should be camelCase (e.g., "pieChart", "barGraph")
- "params" MUST contain the structured data inferred from the text.

IF NO (e.g., the text says "the graph below" but provides no numbers):
Return exactly the string: UNSALVAGEABLE

Question Text:
`;

async function salvageDiagrams() {
  console.log('🔍 Hunting for Ghost Diagrams...');

  // Find questions that mention charts but have no visual payload
  const { data: ghosts, error } = await supabase
    .from('question_bank')
    .select('id, question_text, type')
    .is('visual_payload', null)
    .or('question_text.ilike.%pie chart%,question_text.ilike.%bar graph%,question_text.ilike.%line graph%,question_text.ilike.%table below%');

  if (error || !ghosts) {
    console.error('Failed to fetch ghosts:', error);
    return;
  }

  console.log(`Found ${ghosts.length} potential ghost diagrams. Engaging AI...\n`);

  let salvagedCount = 0;
  let purgedCount = 0;

  for (const q of ghosts) {
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: PROMPT + q.question_text }] }],
        generationConfig: { temperature: 0.1 } // Low temp for logic tasks
      });

      const responseText = result.response.text().trim();

      if (responseText.includes('UNSALVAGEABLE')) {
        // Purge it. It's useless without the original image.
        await supabase.from('question_bank').delete().eq('id', q.id);
        console.log(`🗑️ PURGED: ${q.id} (Insufficient data in text)`);
        purgedCount++;
      } else {
        // Clean markdown JSON formatting if present
        const cleanJson = responseText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
        const visualPayload = JSON.parse(cleanJson);

        // Update the database with the new diagram
        await supabase.from('question_bank').update({ visual_payload: visualPayload }).eq('id', q.id);
        console.log(`✨ SALVAGED: ${q.id} (Generated new ${visualPayload.function_name})`);
        salvagedCount++;
      }
    } catch (err) {
      console.warn(`⚠️ Error processing ${q.id}:`, err.message);
    }
  }

  console.log(`\n🎉 Operation Complete!`);
  console.log(`Salvaged (Diagrams Generated): ${salvagedCount}`);
  console.log(`Purged (No Data Available): ${purgedCount}`);
  console.log(`The Balancer will automatically replace the purged questions on its next run.`);
}

salvageDiagrams();