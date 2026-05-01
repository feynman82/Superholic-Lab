/**
 * scripts/crawler.js
 * The Pipeline Tracker (V2 - Deep Path Scanning). 
 * Scans local folders and bulletproofs Level/Subject extraction.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const BASE_DIR = 'D:\\Git\\Superholic-Lab\\data\\past_year_papers';

function getAllPDFs(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllPDFs(fullPath, arrayOfFiles);
    } else if (file.toLowerCase().endsWith('.pdf')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

async function runCrawler() {
  console.log(`\n🔍 Scanning Directory: ${BASE_DIR}`);
  const allPdfs = getAllPDFs(BASE_DIR);
  console.log(`📄 Found ${allPdfs.length} total PDFs.`);

  let newFilesAdded = 0;
  let updatedFiles = 0;

  for (const fullPath of allPdfs) {
    const relativePath = fullPath.replace(BASE_DIR, '').replace(/^\\+/, '').replace(/\\/g, '/');
    
    // 🧠 Deep Path Scanning: Check the entire folder + filename string
    const searchString = relativePath.toUpperCase();

    // Extract Level
    let level = 'Unknown';
    if (searchString.includes('P6') || searchString.includes('PRIMARY 6') || searchString.includes('PRIMARY6')) level = 'Primary 6';
    else if (searchString.includes('P5') || searchString.includes('PRIMARY 5') || searchString.includes('PRIMARY5')) level = 'Primary 5';
    else if (searchString.includes('P4') || searchString.includes('PRIMARY 4') || searchString.includes('PRIMARY4')) level = 'Primary 4';
    else if (searchString.includes('P3') || searchString.includes('PRIMARY 3') || searchString.includes('PRIMARY3')) level = 'Primary 3';
    else if (searchString.includes('P2') || searchString.includes('PRIMARY 2') || searchString.includes('PRIMARY2')) level = 'Primary 2';
    else if (searchString.includes('P1') || searchString.includes('PRIMARY 1') || searchString.includes('PRIMARY1')) level = 'Primary 1';

    // Extract Subject (Matches the exact taxonomy from your subjects.html)
    let subject = 'Unknown';
    if (searchString.includes('MATH')) subject = 'Mathematics';
    else if (searchString.includes('SCI')) subject = 'Science';
    else if (searchString.includes('ENG')) subject = 'English Language';

    // Upsert into Supabase (Overrides old "Unknown" values with correct data)
    const { error } = await supabase
      .from('processed_files')
      .upsert({ 
        file_path: relativePath, 
        level: level, 
        subject: subject,
        status: 'PENDING' 
      }, { onConflict: 'file_path' }); // We removed ignoreDuplicates so it forcefully updates the bad data

    if (error) {
      console.error(`❌ DB Error on ${relativePath}:`, error.message);
    } else {
      updatedFiles++;
    }
  }

  console.log(`\n✅ Crawler Finished! Mapped Level/Subject for ${updatedFiles} files.`);
}

runCrawler();