/**
 * scripts/ingestor.js
 * The Spatial Ingestor (V4 - Two-Pass Masterclass). 
 * Answer Key Scouting + Context Buffer + Spatial Cropping + Strict Mapping.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

const BASE_DIR = 'D:\\Git\\Superholic-Lab\\data\\past_year_papers';

const ALLOWED_TOPICS = {
  "Primary 1": { "Mathematics": ["Whole Numbers", "Addition and Subtraction", "Multiplication and Division", "Money", "Length and Mass", "Shapes and Patterns", "Picture Graphs"], "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze"] },
  "Primary 2": { "Mathematics": ["Whole Numbers", "Multiplication Tables", "Fractions", "Money", "Time", "Length, Mass and Volume", "Shapes", "Picture Graphs"], "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze"] },
  "Primary 3": { "Science": ["Diversity", "Systems", "Interactions"], "Mathematics": ["Whole Numbers", "Fractions", "Length, Mass and Volume", "Time", "Angles", "Area and Perimeter", "Bar Graphs"], "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze", "Editing"] },
  "Primary 4": { "Science": ["Cycles", "Energy", "Heat", "Light", "Magnets", "Matter"], "Mathematics": ["Whole Numbers", "Factors and Multiples", "Fractions", "Decimals", "Angles", "Area and Perimeter", "Symmetry", "Data Analysis"], "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze", "Editing"] },
  "Primary 5": { "Science": ["Cycles", "Systems", "Energy", "Interactions"], "Mathematics": ["Whole Numbers", "Fractions", "Decimals", "Percentage", "Ratio", "Rate", "Area of Triangle", "Volume", "Angles and Geometry", "Average"], "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze", "Editing", "Synthesis"] },
  "Primary 6": { "Science": ["Interactions", "Energy", "Cells", "Forces"], "Mathematics": ["Fractions", "Percentage", "Ratio", "Speed", "Algebra", "Circles", "Volume", "Geometry", "Pie Charts"], "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze", "Editing", "Synthesis"] }
};

const delay = ms => new Promise(res => setTimeout(res, ms));

function sanitizeJsonString(rawString) {
  let clean = rawString.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
  clean = clean.replace(/(?<!\\)\n(?=[^"]*"(?:[^"\\]|\\.)*"(?:[^"\\]|\\.)*$)/g, '\\n');
  return clean;
}

function extractValidObjects(rawString) {
  const results = [];
  let depth = 0, startIdx = -1, inString = false, escape = false;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString[i];
    if (escape) { escape = false; continue; }
    if (char === '\\') { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (!inString) {
      if (char === '{') { if (depth === 0) startIdx = i; depth++; } 
      else if (char === '}') {
        depth--;
        if (depth === 0 && startIdx !== -1) {
          try {
            const obj = JSON.parse(rawString.substring(startIdx, i + 1));
            // 🚀 Relaxed Salvage: As long as it has a type, keep it. The Mapper will handle the rest.
            if (obj.type) results.push(obj);
          } catch (e) {}
          startIdx = -1;
        }
      }
    }
  }
  return results;
}

// 🚀 PROMPT 1: The Answer Scout
const buildAnswerScoutPrompt = () => `
You are an Answer Key Scout. Look at this page.
If it contains an Answer Key or Marking Scheme, extract the question numbers and their corresponding correct answers into a flat JSON dictionary.
Format: {"1": "A", "2": "45", "15": "Because the water evaporated."}
If this page is NOT an answer key, return an empty object: {}
Do NOT return anything else except the JSON object.
`;

// 🚀 PROMPT 2: The Vision Extractor
const buildVisionPrompt = (level, subject) => {
  const validTopics = ALLOWED_TOPICS[level]?.[subject]?.join(", ") || "the closest standard MOE syllabus topic";

  return `
You are an expert Singapore MOE curriculum designer extracting questions from the CURRENT PAGE.

STRICT SCHEMA RULES:
1. "question_number": You MUST include the question number as a string (e.g. "1", "15", "30a"). If it is a reading passage, use "passage".
2. "topic": Choose EXACTLY from: [${validTopics}].
3. "type": Must be "mcq", "short-ans", "word_problem", "cloze", or "editing".

HOW TO GROUP:
- CLOZE PASSAGES: Create EXACTLY ONE object of type "cloze". Fields: "passage" (blanks as [1], [2]), and a "blanks" array (MUST include "number" as string, "options", "correct_answer").
- EDITING PASSAGES: Create EXACTLY ONE object of type "editing". Fields: "passage_lines" array (MUST include "line_number" as string, "text", "underlined_word", "correct_word").
- SYNTHESIS / TRANSFORMATION: Treat these as "short-ans" or "word_problem". 
- COMPREHENSION / MULTI-PART: Group sub-questions. Create ONE "word_problem". Put sub-questions into a "parts" array (MUST include "label" e.g., "a", "b").

SPATIAL CROPPING:
- "requires_diagram": true ONLY IF the question relies on a visual diagram.
- "diagram_box": If true, provide bounding box {"ymin": 0.1, "xmin": 0.1, "ymax": 0.4, "xmax": 0.9}. 

Return ONLY the raw JSON array. Do not attempt to solve the questions.
`;
};

async function runIngestor(limit = 1000) {
  console.log(`\n🏭 Waking up Spatial Ingestor V4 (Two-Pass Architecture)`);

  const { data: pendingFiles, error: fetchErr } = await supabase.from('processed_files').select('*').eq('status', 'PENDING').limit(limit);
  if (fetchErr || !pendingFiles.length) return console.log('✅ No pending files found!');

  const tempDir = path.join(__dirname, '..', 'data', 'temp_pages');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  for (let i = 0; i < pendingFiles.length; i++) {
    const fileRecord = pendingFiles[i];
    const fullLocalPath = path.join(BASE_DIR, fileRecord.file_path);
    
    console.log(`\n[${i+1}/${pendingFiles.length}] 📄 Processing: ${fileRecord.file_path}`);
    let totalSeedsExtracted = 0;

    try {
      if (!fs.existsSync(fullLocalPath)) throw new Error("File not found on disk");
      fs.readdirSync(tempDir).forEach(f => fs.unlinkSync(path.join(tempDir, f)));

      process.stdout.write(`   ✂️ Slicing PDF via Python... `);
      const slicerScript = path.join(__dirname, 'slicer.py');
      const output = execSync(`python "${slicerScript}" "${fullLocalPath}" "${tempDir}"`).toString().trim();
      const numPages = parseInt(output);
      
      if (isNaN(numPages) || numPages === 0) throw new Error("Python slicer failed to read the PDF.");
      console.log(`Found ${numPages} pages.`);

      // 🚀 PASS 1: THE ANSWER SCOUT
      let masterCheatSheet = {};
      const scoutCount = Math.min(3, numPages); // Look at the last 3 pages
      const startIndex = numPages - scoutCount;

      console.log(`   🕵️ Pass 1: Scouting last ${scoutCount} pages for the Answer Key...`);
      for (let p = startIndex; p < numPages; p++) {
        const pngPath = path.join(tempDir, `page_${p}.png`);
        const base64Image = fs.readFileSync(pngPath).toString("base64");
        
        try {
          const scoutRes = await model.generateContent({
            contents: [{ role: "user", parts: [{ inlineData: { mimeType: "image/png", data: base64Image } }, { text: buildAnswerScoutPrompt() }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
          });
          const parsedScout = JSON.parse(sanitizeJsonString(scoutRes.response.text()));
          masterCheatSheet = { ...masterCheatSheet, ...parsedScout };
        } catch (e) {
          // Silent catch for scout, it's okay if it fails to find one
        }
      }
      console.log(`      Found ${Object.keys(masterCheatSheet).length} official answers.`);

      // 🚀 PASS 2: THE EXTRACTOR (Stops BEFORE the answer key pages!)
      console.log(`   🧠 Pass 2: Extracting questions...`);
      let previousBase64Image = null; // Memory Buffer

      for (let pageNum = 0; pageNum < startIndex; pageNum++) {
        process.stdout.write(`   👁️ Scanning Page ${pageNum + 1}... \n`);
        
        const pngPath = path.join(tempDir, `page_${pageNum}.png`);
        const pngBuffer = fs.readFileSync(pngPath);
        const currentBase64Image = pngBuffer.toString("base64");
        
        const promptText = buildVisionPrompt(fileRecord.level, fileRecord.subject);
        
        const promptParts = [];
        if (previousBase64Image) {
          promptParts.push({ text: "CONTEXT ONLY: This is the PREVIOUS page. Use it to read passages that spill over." });
          promptParts.push({ inlineData: { mimeType: "image/png", data: previousBase64Image } });
        }
        promptParts.push({ text: "CURRENT PAGE (EXTRACT QUESTIONS FROM HERE):" });
        promptParts.push({ inlineData: { mimeType: "image/png", data: currentBase64Image } });
        promptParts.push({ text: promptText });

        let seeds = null;
        let attempt = 1;
        const MAX_ATTEMPTS = 2; 
        let bestRawText = "";

        while (attempt <= MAX_ATTEMPTS && !seeds) {
          try {
            const result = await model.generateContent({
              contents: [{ role: "user", parts: promptParts }],
              generationConfig: { responseMimeType: "application/json", temperature: attempt === 1 ? 0.1 : 0.4 }
            });

            bestRawText = result.response.text();
            seeds = JSON.parse(sanitizeJsonString(bestRawText)); 
            if (!Array.isArray(seeds)) throw new Error("Not an array.");
          } catch (e) {
            attempt++;
            if (attempt <= MAX_ATTEMPTS) await delay(3000); 
          }
        }

        if (!seeds && bestRawText) {
          const salvaged = extractValidObjects(bestRawText);
          seeds = salvaged.length > 0 ? salvaged : [];
        }

        previousBase64Image = currentBase64Image;

        if (!seeds || seeds.length === 0) continue;

        const finalPayload = [];
        const { width, height } = await sharp(pngBuffer).metadata();

        // 🚀 THE NORMALIZER: Strips 'Q', spaces, and brackets so 'Q1', '1.', and '(1)' all become '1'
        const normalizeKey = (k) => {
          let cleaned = String(k).replace(/[^0-9a-z]/gi, '').toLowerCase();
          if (cleaned.startsWith('q')) cleaned = cleaned.substring(1);
          return cleaned;
        };

        // 🚀 PRE-PROCESS CHEAT SHEET: Normalize the keys from the Scout
        const cleanCheatSheet = {};
        for (const [k, v] of Object.entries(masterCheatSheet)) {
          cleanCheatSheet[normalizeKey(k)] = String(v).replace(/^\([A-Z]\)\s*/i, '').trim();
        }

        for (const seed of seeds) {
          let imageUrl = null;

          // 🚀 1. THE SPATIAL CROPPER
          if (seed.requires_diagram && seed.diagram_box) {
            try {
              const cropBox = {
                left: Math.max(0, Math.floor(seed.diagram_box.xmin * width)),
                top: Math.max(0, Math.floor(seed.diagram_box.ymin * height)),
                width: Math.min(width, Math.floor((seed.diagram_box.xmax - seed.diagram_box.xmin) * width)),
                height: Math.min(height, Math.floor((seed.diagram_box.ymax - seed.diagram_box.ymin) * height))
              };

              if (cropBox.width > 10 && cropBox.height > 10) {
                const croppedBuffer = await sharp(pngBuffer).extract(cropBox).toBuffer();
                const fileName = `diagrams/${Date.now()}-p${pageNum}-${Math.floor(Math.random()*1000)}.png`;
                
                const { error: uploadErr } = await supabase.storage.from('question_assets').upload(fileName, croppedBuffer, { contentType: 'image/png' });
                if (uploadErr) throw uploadErr;

                const { data: publicUrlData } = supabase.storage.from('question_assets').getPublicUrl(fileName);
                imageUrl = publicUrlData.publicUrl;
              }
            } catch (cropErr) {
              console.warn(`      ⚠️ Failed to crop diagram: ${cropErr.message}`);
            }
          }

          // 🚀 DETERMINISTIC DEEP INJECTION
          const getAnswer = (qNum) => qNum ? (cleanCheatSheet[normalizeKey(qNum)] || null) : null;

          let finalCorrectAnswer = getAnswer(seed.question_number) || seed.correct_answer || null;

          // Deep inject for Cloze Blanks
          let finalBlanks = seed.blanks;
          if (finalBlanks && Array.isArray(finalBlanks)) {
             finalBlanks = finalBlanks.map(b => ({
                 ...b,
                 correct_answer: getAnswer(b.number) || b.correct_answer || null
             }));
          }

          // Deep inject for Editing Lines
          let finalLines = seed.passage_lines;
          if (finalLines && Array.isArray(finalLines)) {
             finalLines = finalLines.map(l => ({
                 ...l,
                 correct_word: getAnswer(l.line_number) || l.correct_word || null
             }));
          }

          // Deep inject for Multi-part / Word Problems
          let finalParts = seed.parts;
          if (finalParts && Array.isArray(finalParts)) {
             finalParts = finalParts.map(p => ({
                 ...p,
                 // Match label "a" by checking "18a" first, then fallback to just "a"
                 correct_answer: getAnswer(seed.question_number + p.label) || getAnswer(p.label) || p.correct_answer || null
             }));
          }

          // 🚀 STRICT MAPPER
          finalPayload.push({
            topic: seed.topic || 'Mixed',
            sub_topic: seed.sub_topic || null,
            difficulty: seed.difficulty || 'medium',
            type: seed.type || 'short-ans',
            marks: seed.marks || 1,
            question_text: seed.question_text || '',
            options: seed.options || null,
            correct_answer: finalCorrectAnswer, 
            wrong_explanations: seed.wrong_explanations || null,
            worked_solution: seed.worked_solution || null,
            parts: finalParts, // <--- Deep Injected
            keywords: seed.keywords || null,
            model_answer: seed.model_answer || null,
            passage: seed.passage || null,
            blanks: finalBlanks, // <--- Deep Injected
            passage_lines: finalLines, // <--- Deep Injected
            examiner_note: seed.examiner_note || null,
            
            is_ai_cloned: false,
            subject: fileRecord.subject,      
            level: fileRecord.level,          
            source_pdf: fileRecord.file_path,
            image_url: imageUrl 
          });
        }

        if (finalPayload.length > 0) {
          const { error: insertErr } = await supabase.from('seed_questions').insert(finalPayload);
          if (insertErr) throw new Error(`DB Insert Error: ${insertErr.message}`);
          totalSeedsExtracted += finalPayload.length;
          console.log(`      💾 Saved ${finalPayload.length} questions from Page ${pageNum + 1}.`);
        }
        await delay(3000); 
      }

      await supabase.from('processed_files').update({ status: 'COMPLETED', extracted_seeds: totalSeedsExtracted }).eq('file_path', fileRecord.file_path);
      console.log(`   ✅ Finished Paper. Saved ${totalSeedsExtracted} total questions.`);

    } catch (e) {
      console.error(`   ❌ Failed: ${e.message}`);
      await supabase.from('processed_files').update({ status: 'FAILED', error_message: e.message }).eq('file_path', fileRecord.file_path);
    }
  }
}

runIngestor(1);