import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Utility to strip nasty prefixes like "A: ", "(1) ", "B. ", "2) " from options
function cleanString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/^([A-D]\s*[:\.\-\)]\s*|\(\d\)\s*|\d\s*[\.\:\-\)]\s*)/i, '').trim();
}

// Maps letters/numbers to array indices
const indexMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, '1': 0, '2': 1, '3': 2, '4': 3 };

async function salvageMCQs() {
  console.log('🚑 Starting Superholic MCQ Salvage Operation...');

  // 1. Fetch all MCQs
  const { data: questions, error } = await supabase
    .from('question_bank')
    .select('id, options, correct_answer, wrong_explanations')
    .eq('type', 'mcq');

  if (error) {
    console.error('Failed to fetch MCQs:', error);
    return;
  }

  console.log(`Found ${questions.length} MCQs to process.\n`);

  let successCount = 0;

  // 2. Process each question
  for (const q of questions) {
    try {
      let rawOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
      let rawExplanations = typeof q.wrong_explanations === 'string' ? JSON.parse(q.wrong_explanations) : (q.wrong_explanations || {});
      let rawCorrect = String(q.correct_answer || '').trim();

      // Skip if options array is broken
      if (!Array.isArray(rawOptions) || rawOptions.length === 0) continue;

      // STEP A: Clean the Options Array
      const cleanedOptions = rawOptions.map(opt => cleanString(opt));

      // STEP B: Resolve the Correct Answer to the EXACT string
      let trueCorrectAnswer = '';
      const mappedIndex = indexMap[rawCorrect.toUpperCase()];
      
      if (mappedIndex !== undefined && cleanedOptions[mappedIndex]) {
        // It was just "A", "B", etc. Map to the cleaned string.
        trueCorrectAnswer = cleanedOptions[mappedIndex];
      } else {
        // It was a full string (maybe with a prefix). Clean it to match.
        trueCorrectAnswer = cleanString(rawCorrect);
      }

      // STEP C: Re-map Wrong Explanations to the EXACT strings
      let cleanedExplanations = {};
      for (const [key, expl] of Object.entries(rawExplanations)) {
        const keyIndex = indexMap[key.toUpperCase()];
        if (keyIndex !== undefined && cleanedOptions[keyIndex]) {
          cleanedExplanations[cleanedOptions[keyIndex]] = expl;
        } else {
          cleanedExplanations[cleanString(key)] = expl;
        }
      }

      // 3. Push the cleaned data back to Supabase
      const { error: updateErr } = await supabase
        .from('question_bank')
        .update({
          options: cleanedOptions,             // Clean JSON array
          correct_answer: trueCorrectAnswer,   // Exact string match
          wrong_explanations: cleanedExplanations // Keys are exact string matches
        })
        .eq('id', q.id);

      if (updateErr) throw updateErr;
      successCount++;
      
      // Console log a sample to show it's working
      if (successCount === 1) {
        console.log(`Sample Fix on ${q.id}:`);
        console.log(`- Old Ans: "${rawCorrect}" -> New Ans: "${trueCorrectAnswer}"`);
      }

    } catch (err) {
      console.warn(`⚠️ Could not salvage MCQ ${q.id}:`, err.message);
    }
  }

  console.log(`\n🎉 Salvage Complete! Successfully repaired ${successCount} out of ${questions.length} MCQs.`);
}

salvageMCQs();