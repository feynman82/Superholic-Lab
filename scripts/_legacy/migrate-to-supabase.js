/**
 * scripts/migrate-to-supabase.js
 * Scans the local data/questions directory and bulk inserts all existing 
 * static JSON questions into the new Supabase `question_bank` table.
 * (ES Module Version)
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Supabase with SERVICE ROLE to bypass RLS
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const DATA_DIR = path.join(__dirname, '..', 'data', 'questions');

async function migrateQuestions() {
  console.log('🚀 Starting Migration to Supabase question_bank...');
  
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`❌ Could not find data directory: ${DATA_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  let totalMigrated = 0;

  for (const file of files) {
    console.log(`\n📄 Processing ${file}...`);
    const filepath = path.join(DATA_DIR, file);
    
    let questions;
    try {
      questions = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch (e) {
      console.warn(`⚠️ Skipping ${file} (Invalid JSON)`);
      continue;
    }

    if (!Array.isArray(questions)) {
      console.warn(`⚠️ Skipping ${file} (Not an array)`);
      continue;
    }

    // Map the JSON structure to the new Postgres Schema
    const payload = questions.map(q => ({
      is_ai_cloned: false, // These are your original, human-verified files
      subject: q.subject,
      level: q.level,
      topic: q.topic,
      sub_topic: q.sub_topic || null,
      difficulty: q.difficulty || 'Standard',
      type: q.type,
      marks: q.marks || 1,
      question_text: q.question_text,
      options: q.options || null,
      correct_answer: q.correct_answer || null,
      wrong_explanations: q.wrong_explanations || null,
      worked_solution: q.worked_solution || null,
      parts: q.parts || null,
      keywords: q.keywords || null,
      model_answer: q.model_answer || null,
      passage: q.passage || null,
      blanks: q.blanks || null,
      passage_lines: q.passage_lines || null,
      examiner_note: q.examiner_note || null
    }));

    const { error } = await supabase
      .from('question_bank')
      .insert(payload);

    if (error) {
      console.error(`❌ Error inserting ${file}:`, error.message);
    } else {
      console.log(`✅ Inserted ${payload.length} questions from ${file}.`);
      totalMigrated += payload.length;
    }
  }

  console.log(`\n🎉 Migration Complete! ${totalMigrated} questions moved to Supabase.`);
}

migrateQuestions();