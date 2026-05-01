#!/usr/bin/env node
/**
 * Backfill missing `wrong_explanations` entries on pending MCQ rows.
 *
 * Why: ~93% of pending MCQs in `question_bank` were generated with only 2 of 3
 * distractor explanations. quiz.js:1962 reads `wrongExpls[studentAns] || ''`,
 * so picking an uncovered distractor leaves the wrong-answer feedback panel
 * blank. This script asks a small LLM (OpenAI gpt-4o-mini by default; Claude
 * Haiku 4.5 optional) to produce the missing entries in the live
 * `{ text, type }` shape and merges them in.
 *
 * Scope: only touches `approved_at IS NULL AND deprecated_at IS NULL` rows
 * (live questions are never modified). Idempotent — re-running on a row that
 * already has 3-of-3 entries is a no-op.
 *
 * Usage:
 *   node scripts/question-factory/backfill-wrong-explanations.cjs            # dry-run, 5 rows
 *   node scripts/question-factory/backfill-wrong-explanations.cjs --apply --limit=200
 *   node scripts/question-factory/backfill-wrong-explanations.cjs --apply    # all eligible rows
 *
 * Flags:
 *   --apply              actually write to Supabase (without it, prints diffs only)
 *   --limit=N            cap rows processed (default: 5 in dry-run, unlimited in --apply)
 *   --concurrency=N      parallel LLM calls (default: 6)
 *   --provider=openai    'openai' (default, gpt-4o-mini) or 'anthropic' (haiku-4-5)
 *   --topic="X"          restrict to topic (e.g. "Interactions")
 *   --level="Primary 6"  restrict to level
 *   --subject="Science"  restrict to subject
 *
 * Cost note (very rough):
 *   OpenAI gpt-4o-mini ~ $0.15/1M in + $0.60/1M out → 3,653 rows ≈ US$0.40 + US$0.55 ≈ US$1
 *   Claude Haiku 4.5   ~ $1/1M in + $5/1M out       → 3,653 rows ≈ US$2.20 + US$4.60 ≈ US$7
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

// ── Config ─────────────────────────────────────────────────────────────────

const args = {};
process.argv.slice(2).forEach(a => {
  if (!a.startsWith('--')) return;
  const eq = a.indexOf('=');
  if (eq === -1) { args[a.slice(2)] = true; return; }
  args[a.slice(2, eq)] = a.slice(eq + 1);
});

const APPLY       = !!args.apply;
const LIMIT       = args.limit ? parseInt(args.limit, 10) : (APPLY ? null : 5);
const CONCURRENCY = args.concurrency ? parseInt(args.concurrency, 10) : 6;
const PROVIDER    = (args.provider || 'openai').toLowerCase();
const TOPIC       = args.topic   || null;
const LEVEL       = args.level   || null;
const SUBJECT     = args.subject || null;

const HAIKU_MODEL  = 'claude-haiku-4-5-20251001';
const OPENAI_MODEL = 'gpt-4o-mini';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

let llmCall; // (userPrompt: string) => Promise<string>
if (PROVIDER === 'anthropic') {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY in .env');
    process.exit(1);
  }
  const Anthropic = require('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  llmCall = async (userPrompt) => {
    const resp = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 1024,
      temperature: 0.3,
      messages: [{ role: 'user', content: userPrompt }],
    });
    return (resp.content || []).map(c => c.text || '').join('').trim();
  };
} else if (PROVIDER === 'openai') {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY in .env');
    process.exit(1);
  }
  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  llmCall = async (userPrompt) => {
    const resp = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 1024,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: userPrompt }],
    });
    return (resp.choices?.[0]?.message?.content || '').trim();
  };
} else {
  console.error(`Unknown --provider=${PROVIDER}. Use 'openai' or 'anthropic'.`);
  process.exit(1);
}

const supabase  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Eligibility query ──────────────────────────────────────────────────────

async function fetchEligibleRows() {
  let q = supabase
    .from('question_bank')
    .select('id, subject, level, topic, sub_topic, difficulty, question_text, options, correct_answer, wrong_explanations')
    .is('approved_at', null)
    .is('deprecated_at', null)
    .eq('type', 'mcq');
  if (SUBJECT) q = q.eq('subject', SUBJECT);
  if (LEVEL)   q = q.eq('level',   LEVEL);
  if (TOPIC)   q = q.eq('topic',   TOPIC);
  // Supabase pagination cap is 1000 per request; loop if we need more.
  const all = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await q.range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
    if (LIMIT && all.length >= LIMIT * 5) break; // overfetch buffer for filtering
  }
  // Filter to rows missing one or more distractor entries.
  const filtered = all.filter(row => {
    const opts = Array.isArray(row.options) ? row.options : [];
    if (opts.length !== 4) return false;
    const we   = (row.wrong_explanations && typeof row.wrong_explanations === 'object') ? row.wrong_explanations : {};
    const correct = String(row.correct_answer || '');
    const distractors = opts.filter(o => String(o) !== correct);
    return distractors.some(d => !(d in we));
  });
  return LIMIT ? filtered.slice(0, LIMIT) : filtered;
}

// ── Prompt builder ─────────────────────────────────────────────────────────

function buildPrompt(row) {
  const opts = row.options;
  const correct = row.correct_answer;
  const existing = (row.wrong_explanations && typeof row.wrong_explanations === 'object') ? row.wrong_explanations : {};
  const distractors = opts.filter(o => String(o) !== String(correct));
  const missing = distractors.filter(d => !(d in existing));

  const userMsg = [
    `You are an expert Singapore MOE Primary Science / Maths / English curriculum writer.`,
    `A multiple-choice question is missing wrong-answer explanations for ${missing.length} of its distractors.`,
    `Generate ONLY the missing entries in the exact JSON shape shown below.`,
    ``,
    `QUESTION CONTEXT:`,
    `- Subject: ${row.subject}`,
    `- Level: ${row.level}`,
    `- Topic: ${row.topic} > ${row.sub_topic || ''}`,
    `- Difficulty: ${row.difficulty}`,
    ``,
    `QUESTION: ${row.question_text}`,
    ``,
    `OPTIONS:`,
    ...opts.map((o, i) => `  ${String.fromCharCode(65 + i)}. ${o}`),
    ``,
    `CORRECT ANSWER: ${correct}`,
    ``,
    `DISTRACTORS THAT ALREADY HAVE EXPLANATIONS:`,
    ...Object.keys(existing).map(k => `  - ${k}`),
    ``,
    `DISTRACTORS THAT NEED EXPLANATIONS (write one entry per line below):`,
    ...missing.map(d => `  - ${d}`),
    ``,
    `RULES:`,
    `1. For each missing distractor, name the SPECIFIC Singaporean-classroom misconception that would lead a student to pick that option.`,
    `2. Explain WHY it is wrong, then state the correct reasoning briefly. 1–2 sentences.`,
    `3. Use British spelling (colour, centre, organise).`,
    `4. Pick the right "type":`,
    `   - "misconception"  → conceptual error (most common)`,
    `   - "calc_error"     → arithmetic / off-by-one / unit-conversion slip`,
    `   - "partial_logic"  → student got partway there but missed a step`,
    `5. Output ONLY a single JSON object whose keys are EXACTLY the distractor texts above. No prose, no markdown fences, no preamble.`,
    ``,
    `OUTPUT SHAPE:`,
    `{`,
    ...missing.map((d, i) => `  ${JSON.stringify(d)}: { "text": "...", "type": "misconception" }${i === missing.length - 1 ? '' : ','}`),
    `}`,
  ].join('\n');

  return userMsg;
}

// ── LLM call + parse ───────────────────────────────────────────────────────

async function fillMissing(row) {
  const userPrompt = buildPrompt(row);

  const text = await llmCall(userPrompt);
  // Strip accidental ```json fences if the model adds them despite the instruction.
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  let parsed;
  try { parsed = JSON.parse(cleaned); }
  catch (e) { throw new Error(`JSON parse failed for ${row.id}: ${e.message}\nRaw: ${cleaned.slice(0, 300)}`); }

  // Validate shape: every key must be one of the missing distractors,
  // every value must be { text, type }.
  const opts = row.options;
  const correct = String(row.correct_answer || '');
  const existing = (row.wrong_explanations && typeof row.wrong_explanations === 'object') ? row.wrong_explanations : {};
  const distractors = opts.filter(o => String(o) !== correct);
  const missing = distractors.filter(d => !(d in existing));

  const validTypes = new Set(['misconception', 'calc_error', 'partial_logic']);
  for (const k of Object.keys(parsed)) {
    if (!missing.includes(k)) {
      throw new Error(`Unexpected key "${k}" in response for ${row.id} — not a missing distractor`);
    }
    const v = parsed[k];
    if (!v || typeof v !== 'object' || typeof v.text !== 'string' || !validTypes.has(v.type)) {
      throw new Error(`Bad value shape for "${k}" in ${row.id}`);
    }
  }
  for (const d of missing) {
    if (!(d in parsed)) throw new Error(`Missing entry for distractor "${d}" in ${row.id}`);
  }

  // Merge existing + new (existing wins on key collision; defensive).
  return Object.assign({}, parsed, existing);
}

// ── Concurrency-limited worker pool ────────────────────────────────────────

async function runWithConcurrency(items, n, fn, onProgress) {
  let i = 0; let done = 0;
  const errors = [];
  const successes = [];
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      try {
        const result = await fn(items[idx]);
        successes.push({ row: items[idx], result });
      } catch (e) {
        errors.push({ row: items[idx], error: e.message });
      } finally {
        done++;
        if (onProgress) onProgress(done, items.length);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return { successes, errors };
}

// ── Main ───────────────────────────────────────────────────────────────────

(async () => {
  console.log('═══ wrong_explanations backfill ═══');
  console.log(`mode:        ${APPLY ? 'APPLY (writes to Supabase)' : 'DRY-RUN (no writes)'}`);
  console.log(`provider:    ${PROVIDER} (${PROVIDER === 'openai' ? OPENAI_MODEL : HAIKU_MODEL})`);
  console.log(`concurrency: ${CONCURRENCY}`);
  console.log(`limit:       ${LIMIT ?? 'unlimited'}`);
  console.log(`filter:      subject=${SUBJECT || '*'} level=${LEVEL || '*'} topic=${TOPIC || '*'}`);
  console.log('');

  const rows = await fetchEligibleRows();
  console.log(`Eligible rows: ${rows.length}`);
  if (rows.length === 0) { console.log('Nothing to do.'); return; }

  const startedAt = Date.now();
  let lastLog = 0;
  const { successes, errors } = await runWithConcurrency(rows, CONCURRENCY, async (row) => {
    const merged = await fillMissing(row);
    if (APPLY) {
      const { error } = await supabase
        .from('question_bank')
        .update({ wrong_explanations: merged, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      if (error) throw new Error(`Supabase update failed: ${error.message}`);
    }
    return merged;
  }, (done, total) => {
    if (done - lastLog >= 25 || done === total) {
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
      console.log(`  progress: ${done}/${total}  (${elapsed}s elapsed)`);
      lastLog = done;
    }
  });

  console.log('');
  console.log(`Done. ${successes.length} succeeded, ${errors.length} failed.`);

  if (!APPLY && successes.length) {
    console.log('');
    console.log('── DRY-RUN sample diffs (first 3) ──');
    successes.slice(0, 3).forEach(({ row, result }, i) => {
      const before = Object.keys((row.wrong_explanations && typeof row.wrong_explanations === 'object') ? row.wrong_explanations : {});
      const after  = Object.keys(result);
      const added  = after.filter(k => !before.includes(k));
      console.log(`\n[${i + 1}] ${row.id}  (${row.level} / ${row.topic} / ${row.sub_topic || '—'})`);
      console.log(`  Q: ${String(row.question_text).slice(0, 110)}…`);
      console.log(`  Before keys: [${before.map(k => k.slice(0, 30)).join(' | ')}]`);
      console.log(`  Added: ${added.length} entr${added.length === 1 ? 'y' : 'ies'}`);
      added.forEach(k => {
        const v = result[k];
        console.log(`    + "${k.slice(0, 60)}${k.length > 60 ? '…' : ''}"`);
        console.log(`         type: ${v.type}`);
        console.log(`         text: ${v.text.slice(0, 140)}${v.text.length > 140 ? '…' : ''}`);
      });
    });
  }

  if (errors.length) {
    console.log('');
    console.log(`── Failures (first 10) ──`);
    errors.slice(0, 10).forEach(({ row, error }) => {
      console.log(`  ${row.id}: ${error}`);
    });
  }
})();
