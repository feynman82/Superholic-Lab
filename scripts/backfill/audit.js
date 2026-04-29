/**
 * scripts/backfill/audit.js
 *
 * Human-readable audit of an OpenAI Batch output JSONL. Joins each
 * response back to the original question_bank row and prints a concise
 * line per row showing:
 *   - confidence
 *   - canonical?  (✓ if sub_topic in canon, ✗ otherwise — this catches
 *     hallucinations independently of the apply script)
 *   - cog_skill_valid?  (✓ if in enum)
 *   - the question stem (truncated)
 *   - what the model suggested
 *   - the model's reason
 *
 * Use this BEFORE running apply.js on Pass 1 sample output. Eyeball
 * the table — judge whether you trust the suggestions enough to scale
 * up to the full run.
 *
 * Usage:
 *   node scripts/backfill/audit.js backfill_pass1.output.jsonl
 *   node scripts/backfill/audit.js backfill_pass1.output.jsonl --csv > audit.csv
 */

import 'dotenv/config'; // auto-loads .env in repo root so SUPABASE_*/OPENAI_API_KEY work without --env-file
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { SYLLABUS_DEPENDENCIES } from '../../lib/api/quest-pedagogy.js';

const FILE   = process.argv[2];
const AS_CSV = process.argv.includes('--csv');

if (!FILE) {
  console.error('Usage: node scripts/backfill/audit.js <output.jsonl> [--csv]');
  process.exit(1);
}
if (!fs.existsSync(FILE)) {
  console.error('File not found:', FILE);
  process.exit(1);
}

const COG_OK = new Set([
  'Factual Recall', 'Conceptual Understanding', 'Routine Application',
  'Non-Routine / Heuristics', 'Inferential Reasoning', 'Synthesis & Evaluation',
]);
const SUBJECT_KEY = { Mathematics: 'mathematics', Science: 'science', English: 'english' };

function isCanonSub(subject, topic, sub) {
  if (!sub) return null; // null isn't wrong; null is honest. Render as "—".
  const sk = SUBJECT_KEY[subject] || String(subject || '').toLowerCase();
  const node = (SYLLABUS_DEPENDENCIES[sk] || {})[topic];
  if (!node) return false;
  return (node.sub_topics || []).includes(sub);
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error('SUPABASE creds required.'); process.exit(1); }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const lines = fs.readFileSync(FILE, 'utf8').split('\n').filter(Boolean);
  const recs = [];
  for (const line of lines) {
    try {
      const rec = JSON.parse(line);
      const id = (rec.custom_id || '').replace(/^qb_/, '');
      const content = rec.response?.body?.choices?.[0]?.message?.content;
      if (!id || !content) continue;
      const parsed = JSON.parse(content);
      recs.push({ id, parsed });
    } catch { /* skip malformed */ }
  }

  // Bulk fetch the original rows so we don't N+1 the DB. Chunked because
  // PostgREST has a URL-length cap around 14k bytes — 582 UUIDs in one
  // .in() clause silently returns empty and every row gets skipped below
  // (the symptom: tally shows total=N but high/med/low all 0).
  const ids = recs.map(r => r.id);
  const CHUNK = 100;
  const allRows = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const { data, error } = await sb.from('question_bank')
      .select('id, subject, topic, sub_topic, cognitive_skill, type, question_text')
      .in('id', chunk);
    if (error) {
      console.error('[audit] chunk fetch error:', error.message);
      continue;
    }
    if (data) allRows.push(...data);
  }
  const rowById = Object.fromEntries(allRows.map(r => [r.id, r]));

  const tally = { high: 0, medium: 0, low: 0, nonCanonSub: 0, badEnum: 0, total: recs.length };

  if (AS_CSV) {
    console.log(['id','subject','topic','confidence','canon_ok','cog_ok','suggested_sub_topic','suggested_cog','question_stem','reason'].join('\t'));
  } else {
    console.log(`Auditing ${recs.length} rows from ${FILE}\n`);
  }

  for (const { id, parsed } of recs) {
    const row = rowById[id];
    if (!row) continue;
    const conf  = String(parsed.confidence || '').toLowerCase();
    const sub   = parsed.sub_topic;
    const cog   = parsed.cognitive_skill;
    const canonOk = sub == null ? null : isCanonSub(row.subject, row.topic, sub);
    const cogOk   = cog == null ? null : COG_OK.has(cog);

    if (conf === 'high')   tally.high++;
    if (conf === 'medium') tally.medium++;
    if (conf === 'low')    tally.low++;
    if (canonOk === false) tally.nonCanonSub++;
    if (cogOk   === false) tally.badEnum++;

    const stem = String(row.question_text || '').replace(/\s+/g, ' ').slice(0, 70);
    const flag =
      canonOk === false ? '🚨 NON-CANON' :
      cogOk   === false ? '🚨 BAD ENUM'  :
      conf === 'low'    ? '⚠️  LOW'      :
      conf === 'medium' ? '· MED'        :
      '✓';

    if (AS_CSV) {
      console.log([
        id, row.subject, row.topic, conf,
        canonOk == null ? '' : (canonOk ? 'Y' : 'N'),
        cogOk   == null ? '' : (cogOk ? 'Y' : 'N'),
        sub || '', cog || '', stem, parsed.reason || '',
      ].map(x => String(x).replace(/\t/g, ' ')).join('\t'));
    } else {
      console.log(`${flag.padEnd(14)} ${id.slice(0, 8)} ${row.subject.padEnd(8)} ${String(row.topic).padEnd(18)}`);
      console.log(`  Q: ${stem}`);
      console.log(`  → sub=${sub ?? '—'}, cog=${cog ?? '—'}, conf=${conf || '—'}`);
      if (parsed.reason) console.log(`  reason: ${parsed.reason}`);
      console.log('');
    }
  }

  if (!AS_CSV) {
    console.log('\nTally:');
    console.table(tally);
    const acceptanceRate = tally.total > 0 ? ((tally.high - tally.nonCanonSub - tally.badEnum) / tally.total * 100) : 0;
    console.log(`Effective acceptance rate (high-confidence AND canon-valid AND enum-valid): ${acceptanceRate.toFixed(1)}%`);
    console.log('\nRule of thumb: proceed to apply.js if acceptance ≥ 80% AND nonCanonSub === 0.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
