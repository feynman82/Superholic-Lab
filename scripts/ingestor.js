/**
 * scripts/ingestor.js
 * The Spatial Ingestor (V3.1 - Masterclass Edition). 
 * Vision extraction + Local Cropping + Auto-Retry + JSON Salvage Protocol.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdf2img from 'pdf-img-convert';
import sharp from 'sharp';

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

// Helper: Tries to clean common JSON formatting errors
function sanitizeJsonString(rawString) {
  let clean = rawString.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
  clean = clean.replace(/(?<!\\)\n(?=[^"]*"(?:[^"\\]|\\.)*"(?:[^"\\]|\\.)*$)/g, '\\n');
  return clean;
}

// 🛟 The Salvager: Extracts intact JSON objects one by one
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
            if (obj.topic && obj.type && obj.question_text) results.push(obj);
          } catch (e) {}
          startIdx = -1;
        }
      }
    }
  }
  return results;
}

const buildVisionPrompt = (level, subject) => {
  const validTopics = ALLOWED_TOPICS[level]?.[subject]?.join(", ") || "the closest standard MOE syllabus topic";
  return `
You are an expert data extractor. Look at this single page from a ${level} ${subject} exam.
Extract ALL questions found on this page into a JSON array.

Strict Requirements:
1. "topic": Choose EXACTLY from: [${validTopics}].
2. "type": "mcq", "short-ans", or "word_problem".
3. "difficulty": "easy", "medium", or "hard".
4. "question_text": The full text of the question.
5. "options": Array of 4 strings (if MCQ), otherwise null.
6. "correct_answer": The answer string (or letter), otherwise null.
7. "marks": Integer.
8. CRITICAL - "requires_diagram": Set to true ONLY IF the question relies on an image, graph, table, or visual diagram to be solved.
9. CRITICAL - "diagram_box": If requires_diagram is true, provide the exact bounding box of the image on the page using a 0.0 to 1.0 scale. Format: {"ymin": 0.1, "xmin": 0.1, "ymax": 0.4, "xmax": 0.9}. Make sure the box tightly surrounds the diagram/table but excludes the question text itself.

Return ONLY the raw JSON array.
`;
};

async function runIngestor(limit = 1000) {
  console.log(`\n🏭 Waking up Spatial Ingestor V3.1 (With Auto-Retry & Salvage)`);

  const { data: pendingFiles, error: fetchErr } = await supabase.from('processed_files').select('*').eq('status', 'PENDING').limit(limit);
  if (fetchErr || !pendingFiles.length) return console.log('✅ No pending files found!');

  for (let i = 0; i < pendingFiles.length; i++) {
    const fileRecord = pendingFiles[i];
    const fullLocalPath = path.join(BASE_DIR, fileRecord.file_path);
    
    console.log(`\n[${i+1}/${pendingFiles.length}] 📄 Processing: ${fileRecord.file_path}`);
    let totalSeedsExtracted = 0;

    try {
      if (!fs.existsSync(fullLocalPath)) throw new Error("File not found on disk");

      // 1. Convert PDF to an array of high-res PNG buffers
      process.stdout.write(`   ✂️ Slicing PDF into images... `);
      const pdfPages = await pdf2img.convert(fullLocalPath, { scale: 2.0 }); 
      console.log(`Found ${pdfPages.length} pages.`);

      // 2. Process Page by Page
      for (let pageNum = 0; pageNum < pdfPages.length; pageNum++) {
        process.stdout.write(`   👁️ Scanning Page ${pageNum + 1}... \n`);
        
        const pngBuffer = Buffer.from(pdfPages[pageNum]);
        const base64Image = pngBuffer.toString("base64");
        const promptText = buildVisionPrompt(fileRecord.level, fileRecord.subject);
        
        let seeds = null;
        let attempt = 1;
        const MAX_ATTEMPTS = 2; 
        let bestRawText = "";

        // 🔄 RETRY LOOP
        while (attempt <= MAX_ATTEMPTS && !seeds) {
          try {
            const result = await model.generateContent({
              contents: [
                { role: "user", parts: [
                    { inlineData: { mimeType: "image/png", data: base64Image } },
                    { text: promptText }
                  ]
                }
              ],
              generationConfig: { 
                responseMimeType: "application/json", 
                temperature: attempt === 1 ? 0.1 : 0.4 
              }
            });

            bestRawText = result.response.text();
            const cleanJson = sanitizeJsonString(bestRawText);
            seeds = JSON.parse(cleanJson); // Try standard parsing first
            if (!Array.isArray(seeds)) throw new Error("Not a JSON array.");

          } catch (parseError) {
            console.warn(`      ⚠️ Attempt ${attempt} failed perfect parsing. Proceeding...`);
            attempt++;
            if (attempt <= MAX_ATTEMPTS) {
              console.log(`      🔄 Retrying generation...`);
              await delay(3000); 
            }
          }
        }

        // 🛟 THE SALVAGE PROTOCOL
        if (!seeds && bestRawText) {
          console.log(`      🛟 Activating JSON Salvage Protocol...`);
          const salvaged = extractValidObjects(bestRawText);
          if (salvaged.length > 0) {
            console.log(`      🚑 Salvaged ${salvaged.length} valid questions from the wreckage!`);
            seeds = salvaged;
          } else {
            console.log(`      ❌ Could not salvage any questions. Assuming empty page or cover sheet.`);
            seeds = []; // It's often just a blank page or instructions page
          }
        }

        // If it's an empty page or cover sheet, just move to the next page
        if (!seeds || seeds.length === 0) continue;

        // 3. Process spatial data and crop diagrams
        const finalPayload = [];
        const { width, height } = await sharp(pngBuffer).metadata();

        for (const seed of seeds) {
          let imageUrl = null;

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

          finalPayload.push({
            ...seed,
            is_ai_cloned: false,
            subject: fileRecord.subject,      
            level: fileRecord.level,          
            source_pdf: fileRecord.file_path,
            image_url: imageUrl, 
            diagram_box: null // Clean up raw coordinates
          });
        }

        const { error: insertErr } = await supabase.from('seed_questions').insert(finalPayload);
        if (insertErr) throw new Error(`DB Insert Error: ${insertErr.message}`);

        totalSeedsExtracted += finalPayload.length;
        console.log(`      💾 Saved ${finalPayload.length} questions from Page ${pageNum + 1}.`);
        
        await delay(3000); // Wait 3 seconds between pages
      }

      await supabase.from('processed_files').update({ status: 'COMPLETED', extracted_seeds: totalSeedsExtracted }).eq('file_path', fileRecord.file_path);
      console.log(`   ✅ Finished Paper. Saved ${totalSeedsExtracted} total questions.`);

    } catch (e) {
      console.error(`   ❌ Failed: ${e.message}`);
      await supabase.from('processed_files').update({ status: 'FAILED', error_message: e.message }).eq('file_path', fileRecord.file_path);
    }
  }
}

runIngestor(1000);