/**
 * scripts/backfill/submit.js
 *
 * End-to-end OpenAI Batch API workflow for the question_bank backfill:
 *   1. Upload JSONL via POST /v1/files (purpose=batch)
 *   2. Create batch via POST /v1/batches
 *   3. Poll until status === 'completed' (or terminal failure)
 *   4. Download output_file content into a local JSONL
 *
 * Usage:
 *   node scripts/backfill/submit.js backfill_pass1.jsonl
 *
 * Outputs:
 *   - backfill_pass1.batch.json     (the batch object metadata)
 *   - backfill_pass1.output.jsonl   (the model responses, one per line)
 *   - backfill_pass1.errors.jsonl   (only present if any rows errored)
 *
 * Reads OPENAI_API_KEY from env. Uses native fetch (Node ≥ 18).
 */

import 'dotenv/config'; // auto-loads .env in repo root so OPENAI_API_KEY works without --env-file
import fs from 'node:fs';
import path from 'node:path';

const INPUT = process.argv[2];
if (!INPUT) {
  console.error('Usage: node scripts/backfill/submit.js <input.jsonl>');
  process.exit(1);
}
if (!fs.existsSync(INPUT)) {
  console.error('File not found:', INPUT);
  process.exit(1);
}

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) {
  console.error('OPENAI_API_KEY required in env.');
  process.exit(1);
}

const BASE = 'https://api.openai.com/v1';
const auth = { 'Authorization': `Bearer ${KEY}` };
const baseName = path.basename(INPUT, '.jsonl');
const dir = path.dirname(INPUT);
const META_OUT  = path.join(dir, `${baseName}.batch.json`);
const OUT_FILE  = path.join(dir, `${baseName}.output.jsonl`);
const ERR_FILE  = path.join(dir, `${baseName}.errors.jsonl`);

async function uploadFile(filePath) {
  console.log(`Uploading ${filePath} …`);
  // Native FormData (Node ≥ 18) handles multipart cleanly.
  const fd = new FormData();
  fd.append('purpose', 'batch');
  fd.append('file', new Blob([fs.readFileSync(filePath)]), path.basename(filePath));
  const res = await fetch(`${BASE}/files`, { method: 'POST', headers: auth, body: fd });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  console.log('  → file id:', data.id);
  return data.id;
}

async function createBatch(fileId) {
  console.log('Creating batch …');
  const res = await fetch(`${BASE}/batches`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input_file_id: fileId,
      endpoint: '/v1/chat/completions',
      completion_window: '24h',
    }),
  });
  if (!res.ok) throw new Error(`Batch create failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  console.log('  → batch id:', data.id, '| status:', data.status);
  return data;
}

async function getBatch(batchId) {
  const res = await fetch(`${BASE}/batches/${batchId}`, { headers: auth });
  if (!res.ok) throw new Error(`Batch get failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function downloadFile(fileId, outPath) {
  const res = await fetch(`${BASE}/files/${fileId}/content`, { headers: auth });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(outPath, text);
  console.log(`  → wrote ${outPath} (${(text.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  const fileId = await uploadFile(INPUT);
  const batch  = await createBatch(fileId);
  fs.writeFileSync(META_OUT, JSON.stringify(batch, null, 2));

  console.log('Polling batch status (Ctrl-C to detach; metadata saved to', META_OUT + ') …');
  let cur = batch;
  const terminal = new Set(['completed', 'failed', 'expired', 'cancelled']);
  while (!terminal.has(cur.status)) {
    await new Promise(r => setTimeout(r, 15_000));
    cur = await getBatch(cur.id);
    const counts = cur.request_counts || {};
    console.log(`  status=${cur.status}  total=${counts.total ?? '?'}  completed=${counts.completed ?? '?'}  failed=${counts.failed ?? '?'}`);
  }

  fs.writeFileSync(META_OUT, JSON.stringify(cur, null, 2));

  if (cur.status !== 'completed') {
    console.error(`Batch terminated with status=${cur.status}`);
    if (cur.error_file_id) {
      console.error('Downloading error file …');
      await downloadFile(cur.error_file_id, ERR_FILE);
    }
    process.exit(1);
  }

  if (cur.output_file_id) {
    await downloadFile(cur.output_file_id, OUT_FILE);
  }
  if (cur.error_file_id) {
    console.warn('Some requests errored — downloading error file too.');
    await downloadFile(cur.error_file_id, ERR_FILE);
  }
  console.log('\nDONE. Next step:');
  console.log(`  node scripts/backfill/audit.js ${OUT_FILE}     # human verify (Pass 1)`);
  console.log(`  node scripts/backfill/apply.js ${OUT_FILE} backfill_$(date +%Y_%m_%d)   # write to DB (Pass 2)`);
}

main().catch(err => { console.error(err); process.exit(1); });
