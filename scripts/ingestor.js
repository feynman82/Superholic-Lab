/**
 * scripts/ingestor.js
 * The Heavy Lifter (V2 - Strict Taxonomy). 
 * Enforces strict topics, forcefully maps Subject/Level, and tracks source_pdf.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

const BASE_DIR = 'D:\\Git\\Superholic-Lab\\data\\past_year_papers';

const ALLOWED_TOPICS = {
  "Primary 1": {
    "Mathematics": ["Whole Numbers", "Addition and Subtraction", "Multiplication and Division", "Money", "Length and Mass", "Shapes and Patterns", "Picture Graphs"],
    "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze"]
  },
  "Primary 2": {
    "Mathematics": ["Whole Numbers", "Multiplication Tables", "Fractions", "Money", "Time", "Length, Mass and Volume", "Shapes", "Picture Graphs"],
    "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze"]
  },
  "Primary 3": {
    "Science": ["Diversity", "Systems", "Interactions"],
    "Mathematics": ["Whole Numbers", "Fractions", "Length, Mass and Volume", "Time", "Angles", "Area and Perimeter", "Bar Graphs"],
    "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze", "Editing"]
  },
  "Primary 4": {
    "Science": ["Cycles", "Energy", "Heat", "Light", "Magnets", "Matter"],
    "Mathematics": ["Whole Numbers", "Factors and Multiples", "Fractions", "Decimals", "Angles", "Area and Perimeter", "Symmetry", "Data Analysis"],
    "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze", "Editing"]
  },
  "Primary 5": {
    "Science": ["Cycles", "Systems", "Energy", "Interactions"],
    "Mathematics": ["Whole Numbers", "Fractions", "Decimals", "Percentage", "Ratio", "Rate", "Area of Triangle", "Volume", "Angles and Geometry", "Average"],
    "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze", "Editing", "Synthesis"]
  },
  "Primary 6": {
    "Science": ["Interactions", "Energy", "Cells", "Forces"],
    "Mathematics": ["Fractions", "Percentage", "Ratio", "Speed", "Algebra", "Circles", "Volume", "Geometry", "Pie Charts"],
    "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze", "Editing", "Synthesis"]
  }
};

const buildPrompt = (level, subject) => {
  // Get the allowed topics for this specific level/subject, or default to a generic instruction if not mapped yet
  const validTopics = ALLOWED_TOPICS[level]?.[subject]?.join(", ") || "the closest standard MOE syllabus topic";

  return `
You are an expert Singapore MOE teacher extracting questions from a ${level} ${subject} paper.
YOUR TASK: Extract ALL questions and output them as a valid JSON array.

Strict Requirements:
1. "topic": You MUST choose the exact matching topic from this list ONLY: [${validTopics}]. Do not invent new topics.
2. "type": Use exactly "mcq", "short-ans", or "open-ended".
3. "difficulty": Guess "easy", "medium", or "hard".
4. "question_text": The full text of the question. Describe any diagrams in plain text if necessary.
5. "options": If MCQ, provide an array of 4 string options. Otherwise, null.
6. "correct_answer": The exact string of the correct answer, otherwise null.
7. "marks": The integer marks awarded for the question.

Return ONLY the raw JSON array. No markdown fences.
`;
};

// ... (Keep imports, BASE_DIR, and ALLOWED_TOPICS unchanged)

const delay = ms => new Promise(res => setTimeout(res, ms));

// 🛟 The Salvager: Scans raw text and extracts intact JSON objects one by one
function extractValidObjects(rawString) {
  const results = [];
  let depth = 0;
  let startIdx = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < rawString.length; i++) {
    const char = rawString[i];
    
    // Handle string escaping so we don't get tricked by braces inside quotes
    if (escape) { escape = false; continue; }
    if (char === '\\') { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }

    if (!inString) {
      if (char === '{') {
        if (depth === 0) startIdx = i; // Mark the start of a root object
        depth++;
      } else if (char === '}') {
        depth--;
        // If we close a root object, try to parse it!
        if (depth === 0 && startIdx !== -1) {
          const possibleJson = rawString.substring(startIdx, i + 1);
          try {
            const obj = JSON.parse(possibleJson);
            // Verify it's an actual question and not a nested sub-object
            if (obj.topic && obj.type && obj.question_text) {
              results.push(obj);
            }
          } catch (e) {
            // Silently ignore this specific corrupted question
          }
          startIdx = -1;
        }
      }
    }
  }
  return results;
}

// Helper: Tries basic string cleanup first
function sanitizeJsonString(rawString) {
  let clean = rawString.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
  clean = clean.replace(/(?<!\\)\n(?=[^"]*"(?:[^"\\]|\\.)*"(?:[^"\\]|\\.)*$)/g, '\\n');
  return clean;
}

async function runIngestor(limit = 1000) {
  console.log(`\n🏭 Waking up Smart Ingestor (With JSON Salvage Protocol)`);

  const { data: pendingFiles, error: fetchErr } = await supabase
    .from('processed_files')
    .select('*')
    .eq('status', 'PENDING')
    .limit(limit);

  if (fetchErr || !pendingFiles.length) return console.log('✅ No pending files found!');

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  for (let i = 0; i < pendingFiles.length; i++) {
    const fileRecord = pendingFiles[i];
    const fullLocalPath = path.join(BASE_DIR, fileRecord.file_path);
    
    console.log(`\n[${i+1}/${pendingFiles.length}] 📄 Processing: ${fileRecord.file_path}`);
    console.log(`   🏷️  Detected Level: ${fileRecord.level} | Subject: ${fileRecord.subject}`);

    let uploadResult;
    try {
      if (!fs.existsSync(fullLocalPath)) throw new Error("File not found on disk");

      uploadResult = await fileManager.uploadFile(fullLocalPath, {
        mimeType: "application/pdf",
        displayName: path.basename(fullLocalPath),
      });

      process.stdout.write(`   ⏳ Processing on Google Servers`);
      let fileState = await fileManager.getFile(uploadResult.file.name);
      while (fileState.state === "PROCESSING") {
        process.stdout.write(".");
        await delay(2000); 
        fileState = await fileManager.getFile(uploadResult.file.name);
      }
      console.log(""); 

      if (fileState.state === "FAILED") throw new Error("Google API rejected this PDF.");

      console.log(`   🧠 Analyzing PDF and extracting seeds...`);
      const promptText = buildPrompt(fileRecord.level, fileRecord.subject);
      
      let seeds = null;
      let attempt = 1;
      const MAX_ATTEMPTS = 2; 
      let bestRawText = "";

      while (attempt <= MAX_ATTEMPTS && !seeds) {
        try {
          const result = await model.generateContent({
            contents: [
              { role: "user", parts: [
                  { fileData: { mimeType: uploadResult.file.mimeType, fileUri: uploadResult.file.uri } },
                  { text: promptText }
                ]
              }
            ],
            generationConfig: { 
              responseMimeType: "application/json", 
              temperature: attempt === 1 ? 0.1 : 0.4, 
              maxOutputTokens: 8192
            }
          });

          bestRawText = result.response.text();
          const cleanJson = sanitizeJsonString(bestRawText);
          seeds = JSON.parse(cleanJson); // Try standard parsing first

        } catch (parseError) {
          console.warn(`   ⚠️ Attempt ${attempt} failed perfect parsing. Proceeding...`);
          attempt++;
          if (attempt <= MAX_ATTEMPTS) {
            console.log(`   🔄 Retrying generation...`);
            await delay(3000); 
          }
        }
      }

      // 🛟 THE SALVAGE PROTOCOL
      if (!seeds && bestRawText) {
        console.log(`   🛟 Activating JSON Salvage Protocol...`);
        const salvaged = extractValidObjects(bestRawText);
        if (salvaged.length > 0) {
          console.log(`   🚑 Salvaged ${salvaged.length} valid questions from the wreckage!`);
          seeds = salvaged;
        } else {
          throw new Error("JSON Formatting Failure. Could not salvage any questions.");
        }
      }

      if (!seeds || !Array.isArray(seeds)) throw new Error("AI did not return any valid questions.");

      const payload = seeds.map(seed => ({ 
        ...seed, 
        is_ai_cloned: false,
        subject: fileRecord.subject,      
        level: fileRecord.level,          
        source_pdf: fileRecord.file_path  
      }));

      const { error: insertErr } = await supabase.from('seed_questions').insert(payload);
      if (insertErr) throw new Error(`DB Insert Error: ${insertErr.message}`);

      // We mark it as COMPLETED even if it was salvaged, so we don't get stuck in a retry loop
      await supabase.from('processed_files').update({ status: 'COMPLETED', extracted_seeds: seeds.length }).eq('file_path', fileRecord.file_path);
      console.log(`   ✅ Extracted & Saved ${seeds.length} questions mapped to ${fileRecord.file_path}`);

    } catch (e) {
      console.error(`   ❌ Failed: ${e.message}`);
      await supabase.from('processed_files').update({ status: 'FAILED', error_message: e.message }).eq('file_path', fileRecord.file_path);
    } finally {
      if (uploadResult?.file?.name) {
        await fileManager.deleteFile(uploadResult.file.name).catch(() => {});
      }
    }
  }
}

runIngestor(1000);