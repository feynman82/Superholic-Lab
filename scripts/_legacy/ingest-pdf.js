/**
 * scripts/ingest-pdf.js
 * The Seed Factory: Reads MOE/PSLE PDF papers using Gemini 1.5 Pro Vision,
 * extracts the questions into the Superholic Lab schema, and uploads 
 * them to the Supabase `seed_questions` table.
 * * Usage: node ingest-pdf.js "../data/past_year_papers/PSLE Science 2024.pdf" "Science" "Primary 6"
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Clients
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log("❌ Usage: node ingest-pdf.js <path-to-pdf> <subject> <level>");
  console.log("Example: node ingest-pdf.js \"../data/PSLE Science 2024.pdf\" \"Science\" \"Primary 6\"");
  process.exit(1);
}

const [pdfPath, subject, level] = args;
const absolutePdfPath = path.resolve(__dirname, pdfPath);

const EXTRACTION_PROMPT = `
You are an expert Singapore MOE curriculum data extractor. 
I have uploaded a ${level} ${subject} past year exam paper.

YOUR TASK:
Extract ALL the questions from this PDF and return them as a valid JSON array.
Follow the Superholic Lab schema exactly. Do NOT use markdown code blocks (no \`\`\`json).

SCHEMA REQUIREMENTS:
- "subject": "${subject}"
- "level": "${level}"
- "topic": (Identify the closest MOE syllabus topic based on the question)
- "difficulty": "Standard" (or "Advanced" for the last few questions in Paper 2/Booklet B)
- "type": "mcq" (if 4 options are given), "short_ans", "word_problem", "open_ended", "cloze", or "editing"
- "marks": (Extract from the PDF if available, otherwise default to 2)
- "question_text": (The exact text of the question)
- "requires_diagram": true (SET THIS TO TRUE if the question relies on an image, graph, or diagram in the PDF to be solved. Set false otherwise).
- "options": (Array of 4 strings if MCQ)
- "correct_answer": (Infer the correct answer. For MCQ, use A/B/C/D)
- "worked_solution": (Write a step-by-step solution for the question)

Extract as many questions as you can confidently read. 
Return ONLY the raw JSON array.
`;

async function ingestPDF() {
  console.log(`\n🚀 Starting Seed Extraction for: ${path.basename(absolutePdfPath)}`);
  
  if (!fs.existsSync(absolutePdfPath)) {
    console.error(`❌ File not found: ${absolutePdfPath}`);
    process.exit(1);
  }

  try {
    // 1. Upload PDF to Gemini's File Manager
    console.log(`📤 Uploading PDF to Gemini Vision Engine...`);
    const uploadResult = await fileManager.uploadFile(absolutePdfPath, {
      mimeType: "application/pdf",
      displayName: path.basename(absolutePdfPath),
    });
    console.log(`✅ Upload complete. File URI: ${uploadResult.file.uri}`);

    // 2. Process with Gemini 1.5 Pro
    console.log(`🧠 Analyzing PDF and extracting questions (This may take 30-60 seconds)...`);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri
        }
      },
      { text: EXTRACTION_PROMPT }
    ]);

    const rawText = result.response.text();
    
    // Clean markdown fences if Gemini ignored instructions
    let jsonStr = rawText.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\n/, '');
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\n/, '');
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.replace(/\n```$/, '');

    // 3. Parse JSON
    const questions = JSON.parse(jsonStr);
    console.log(`🎯 Successfully extracted ${questions.length} questions from the PDF!`);

    // 4. Format and push to Supabase `seed_questions`
    console.log(`💾 Pushing Gold Standard Seeds to Supabase...`);
    const payload = questions.map(q => ({
      original_id: null,
      subject: q.subject || subject,
      level: q.level || level,
      topic: q.topic || 'Uncategorized',
      sub_topic: q.sub_topic || null,
      difficulty: q.difficulty || 'Standard',
      type: q.type || 'short_ans',
      marks: q.marks || 2,
      question_text: q.question_text,
      options: q.options || null,
      correct_answer: q.correct_answer || null,
      worked_solution: q.worked_solution || null,
      requires_diagram: q.requires_diagram || false,
      source_pdf: path.basename(absolutePdfPath)
    }));

    const { error } = await supabase.from('seed_questions').insert(payload);

    if (error) {
      console.error(`❌ Database Error:`, error.message);
    } else {
      console.log(`🎉 SUCCESS! ${payload.length} seeds added to the vault.`);
    }

    // Cleanup: Delete the temporary file from Gemini's servers
    await fileManager.deleteFile(uploadResult.file.name);

  } catch (err) {
    console.error(`❌ Extraction Failed:`, err);
  }
}

ingestPDF();