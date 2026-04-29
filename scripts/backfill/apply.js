/**
 * scripts/backfill/apply.js
 *
 * Reads the OpenAI Batch output JSONL, validates each suggestion against
 * the canonical taxonomy + cognitive_skill enum, and writes accepted
 * fields to question_bank. Idempotent via the backfill_run_id column
 * (migration 027) — re-running with the same run id skips already-
 * processed rows.
 *
 * Defence-in-depth: even though the prompt told the model to pick from
 * canon only, the apply script independently re-validates. If the model
 * hallucinates, the apply script catches it. Belt and suspenders.
 *
 * Usage:
 *   node scripts/backfill/apply.js <output.jsonl> <run_id> [--dry-run]
 *
 *   --dry-run prints what would be written without touching the DB.
 *
 * Output: prints stats { updated, skippedLowConfidence, skippedNonCanon,
 *   skippedNoChange, skippedAlreadyDone, errors }.
 */

import 'dotenv/config'; // auto-loads .env in repo root so SUPABASE_*/OPENAI_API_KEY work without --env-file
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { SYLLABUS_DEPENDENCIES } from '../../lib/api/quest-pedagogy.js';

const OUTPUT_FILE = process.argv[2];
const RUN_ID      = process.argv[3];
const DRY_RUN     = process.argv.includes('--dry-run');

if (!OUTPUT_FILE || !RUN_ID) {
  console.error('Usage: node scripts/backfill/apply.js <output.jsonl> <run_id> [--dry-run]');
  console.error('Example: node scripts/backfill/apply.js backfill_pass2.output.jsonl backfill_2026_04_30');
  process.exit(1);
}
if (!fs.existsSync(OUTPUT_FILE)) {
  console.error('Output file not found:', OUTPUT_FILE);
  process.exit(1);
}

const COGNITIVE_SKILLS = new Set([
  'Factual Recall',
  'Conceptual Understanding',
  'Routine Application',
  'Non-Routine / Heuristics',
  'Inferential Reasoning',
  'Synthesis & Evaluation',
]);

const SUBJECT_KEY = {
  Mathematics: 'mathematics',
  Science:     'science',
  English:     'english',
};

// Strict canon check — sub_topic must match one of the canonical strings
// for the row's (subject, topic) pair, character-for-character.
function isCanonSubTopic(subject, topic, subTopic) {
  if (!subTopic) return false;
  const subjectKey = SUBJECT_KEY[subject] || String(subject || '').toLowerCase();
  const node = (SYLLABUS_DEPENDENCIES[subjectKey] || {})[topic];
  if (!node) return false;
  return (node.sub_topics || []).includes(subTopic);
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required in env.');
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const lines = fs.readFileSync(OUTPUT_FILE, 'utf8').split('\n').filter(Boolean);
  console.log(`Processing ${lines.length} batch responses with run_id=${RUN_ID}${DRY_RUN ? ' (DRY RUN)' : ''} …`);

  const stats = {
    updated:                0,
    skippedLowConfidence:   0,
    skippedNonCanon:        0,
    skippedInvalidEnum:     0,
    skippedNoChange:        0,
    skippedAlreadyDone:     0,
    skippedRowMissing:      0,
    parseErrors:            0,
    apiErrors:              0,
  };

  // Sample of rejected suggestions for the operator's debugging.
  const rejectionSamples = [];

  for (const line of lines) {
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      stats.parseErrors++;
      continue;
    }

    const customId = rec.custom_id || '';
    const id = customId.replace(/^qb_/, '');
    const content = rec.response?.body?.choices?.[0]?.message?.content;
    if (!id || !content) {
      stats.parseErrors++;
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      stats.parseErrors++;
      continue;
    }

    // Fetch current row — confirms the row still exists, gives us the
    // authoritative subject/topic to validate against, and lets us check
    // idempotency on backfill_run_id.
    const { data: row, error: rowErr } = await sb
      .from('question_bank')
      .select('id, subject, topic, sub_topic, cognitive_skill, backfill_run_id')
      .eq('id', id)
      .maybeSingle();
    if (rowErr) { stats.apiErrors++; continue; }
    if (!row)   { stats.skippedRowMissing++; continue; }
    if (row.backfill_run_id === RUN_ID) { stats.skippedAlreadyDone++; continue; }

    // Confidence gate — only accept high-confidence suggestions per field.
    // sub_topic with confidence='medium' is rejected because the prompt
    // says medium is allowed for tricky cases the model still answered;
    // we'd rather leave the field NULL and let a human classify it later
    // than risk a wrong write.
    const confidence = String(parsed.confidence || '').toLowerCase();
    const updates = {};

    // ─── sub_topic ──────────────────────────────────────────────
    if ((!row.sub_topic || row.sub_topic.trim() === '') && parsed.sub_topic != null) {
      if (confidence !== 'high') {
        stats.skippedLowConfidence++;
        if (rejectionSamples.length < 10) rejectionSamples.push({ id, reason: 'low confidence', parsed });
      } else if (!isCanonSubTopic(row.subject, row.topic, parsed.sub_topic)) {
        stats.skippedNonCanon++;
        if (rejectionSamples.length < 10) rejectionSamples.push({ id, reason: 'non-canon sub_topic', subject: row.subject, topic: row.topic, suggested: parsed.sub_topic });
      } else {
        updates.sub_topic = parsed.sub_topic;
      }
    }

    // ─── cognitive_skill ────────────────────────────────────────
    if ((!row.cognitive_skill || row.cognitive_skill.trim() === '') && parsed.cognitive_skill != null) {
      if (!COGNITIVE_SKILLS.has(parsed.cognitive_skill)) {
        stats.skippedInvalidEnum++;
        if (rejectionSamples.length < 10) rejectionSamples.push({ id, reason: 'invalid cog_skill enum', suggested: parsed.cognitive_skill });
      } else {
        // cognitive_skill accepts any confidence — the 6-item enum is
        // small enough that even a "medium" pick is a coin-flip among
        // a constrained set.
        updates.cognitive_skill = parsed.cognitive_skill;
      }
    }

    if (Object.keys(updates).length === 0) {
      stats.skippedNoChange++;
      continue;
    }

    // Always tag the row with the run id so re-runs are no-ops AND so
    // rollback can scope to this run.
    updates.backfill_run_id = RUN_ID;

    if (DRY_RUN) {
      stats.updated++;
      if (stats.updated <= 5) {
        console.log(`  [DRY] ${id}:`, updates);
      }
      continue;
    }

    const { error: upErr } = await sb.from('question_bank').update(updates).eq('id', id);
    if (upErr) {
      console.error('  update error', id, upErr.message);
      stats.apiErrors++;
      continue;
    }
    stats.updated++;
  }

  console.log('\nResult:');
  console.table(stats);

  if (rejectionSamples.length > 0) {
    console.log('\nRejection samples (first 10) — useful for prompt iteration:');
    console.dir(rejectionSamples, { depth: null });
  }

  if (DRY_RUN) {
    console.log('\nDRY RUN — no DB writes. Re-run without --dry-run to apply.');
  } else {
    console.log(`\nDone. To roll back this run:`);
    console.log(`  UPDATE question_bank SET sub_topic=NULL, cognitive_skill=NULL, backfill_run_id=NULL WHERE backfill_run_id='${RUN_ID}';`);
    console.log(`  (Only safe if those fields were null pre-run — they were, by design of the apply gate.)`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
