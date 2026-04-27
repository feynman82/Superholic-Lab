/**
 * scripts/reclassify-difficulty.js
 *
 * Phase B of the difficulty re-calibration plan.
 *
 * Reads question_bank rows that Phase A (migration 019) didn't touch,
 * batches them through OpenAI o4-mini with the §8 rubric from
 * Master_Question_Template.md as the developer-role prompt, and:
 *   • UPDATEs question_bank for high-confidence suggestions
 *   • INSERTs low-confidence suggestions into reclassify_review for
 *     human spot-check (table provisioned by migration 019)
 *
 * Cost (estimated, o4-mini @ $1.10/M in · $0.275/M cached · $4.40/M out):
 *   ~$0.012 per batch of 50, ~$1.20 for a 5,000-row bank.
 *   OpenAI auto-caches identical prompt prefixes ≥1024 tokens for ~5-10 min,
 *   so sequential batches with the same rubric get the cached-input rate.
 *   reasoning_effort is set to 'low' since this is classification, not deep
 *   reasoning — keeps reasoning-token output (billed as completion) minimal.
 *
 * Usage:
 *   node scripts/reclassify-difficulty.js [flags]
 *
 * Flags:
 *   --dry-run            Don't write anything; just log proposed updates.
 *   --limit N            Cap total rows processed (default: no cap).
 *   --batch-size N       Rows per o4-mini call (default: 50).
 *   --target <mode>      Which rows to review:
 *                          hots   → only currently-HOTS rows (default)
 *                          all    → every row
 *                          drift  → rows where Phase A made no change
 *   --subject X          Scope filter, e.g. "English Language"
 *   --topic   Y          Scope filter, e.g. "Synthesis"
 *   --level   Z          Scope filter, e.g. "Primary 6"
 *
 * Required env (.env at repo root):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ─── Config ─────────────────────────────────────────────────
const MODEL                 = 'o4-mini';
const MAX_COMPLETION_TOKENS = 4096;
const REASONING_EFFORT      = 'low';   // classification, not deep reasoning
const PREVIEW_CHARS         = 280;     // truncate question_text + instructions to keep input cheap

// ─── CLI flags ──────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name, def = null) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  return (v && !v.startsWith('--')) ? v : true;
}
const DRY_RUN     = !!flag('dry-run', false);
const LIMIT       = parseInt(flag('limit', '0'), 10) || 0;
const BATCH_SIZE  = parseInt(flag('batch-size', '50'), 10);
const TARGET      = flag('target', 'hots');
const F_SUBJECT   = flag('subject', null);
const F_TOPIC     = flag('topic',   null);
const F_LEVEL     = flag('level',   null);

// ─── Clients ────────────────────────────────────────────────
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── The §8 rubric (developer-role prompt) ──────────────────
// Mirrors Master_Question_Template.md SECTION 8 verbatim in spirit;
// kept compact (<2K tokens). OpenAI auto-caches identical prefixes
// ≥1024 tokens — sequential batches share this cached prefix.
const RUBRIC_SYSTEM_PROMPT = `You are a Singapore MOE curriculum specialist tagging difficulty for primary-school question_bank rows.

Apply this 4-band rubric strictly. Tag the LOWEST band each question qualifies for. HOTS must be earned, never defaulted.

═══════ UNIVERSAL DEFINITIONS ═══════

Foundation (target 20%): AO1 only — recall / direct retrieval. 1 cognitive step. Vocabulary at/below grade level. Familiar context.

Standard (target 50%): AO1→AO2 — recall + 1 application. 2-3 steps. Grade-level vocabulary. Familiar context with one twist.

Advanced (target 20%): AO2→light AO3 — apply + analyse. 3-4 steps. At/above grade-level vocabulary. Some unfamiliar phrasing.

HOTS (target 10%): Pure AO3 — analyse + synthesise + evaluate. 4+ steps OR novel reasoning. Above grade-level vocabulary. Novel/abstract/counter-intuitive context.

═══════ THE "EARN HOTS" GATE ═══════

A question qualifies as HOTS only if it satisfies BOTH:
(a) ≥4 distinct cognitive operations, OR cross-topic reasoning, OR a non-routine heuristic, AND
(b) Novel context, advanced vocabulary, or counter-intuitive answer.

If only one is met → Advanced, not HOTS.

═══════ ANTI-DEFAULT RULES ═══════

• Single named MOE heuristic (bar model, before-after, "respectively", SVA rule) → Standard at most.
• One transformation step + familiar vocabulary → Foundation.
• Hard vocabulary alone shifts the band UP BY ONE only — not straight to HOTS.
• Long question text alone is not HOTS. Count cognitive operations.
• "Had it not been for [noun phrase]" alone → Advanced, not HOTS (unless also requires verb→noun + tense shift).
• Standalone SVA, simple tense, basic pronoun → Foundation.
• 1-mark MCQs are rarely HOTS — default such rows to Standard unless cognitive complexity is provably AO3.

═══════ PER-SUBJECT ANCHORS ═══════

MATHEMATICS
- Foundation: 1-step computation, single-digit ops, formula given
- Standard: 2-step problem, single bar model, one unit conversion
- Advanced: 3+ step model drawing, percentage-of-percentage, ratio with constant part
- HOTS: working backwards, internal-transfer ratio, multi-stage before-after-after, untruthful-witness logic

SCIENCE
- Foundation: name a part / define a term / literal recall
- Standard: identify + brief explain (one concept)
- Advanced: full CER, identify variables, fair-test reasoning
- HOTS: predict+justify across two topics, design-your-own-experiment, counter-intuitive prediction

ENGLISH SYNTHESIS (the connector named in 'instructions' is the strongest signal)
- Foundation: and, but, because, when, who, whose, although, even though, respectively, too…to, while
- Standard: Despite+gerund, Having+past participle, reported speech with one tense shift, active↔passive
- Advanced: Out of [noun], Such was [noun], Much to the [noun] — nominalisation + clause merge
- HOTS: Had it not been for, It was X that, Hardly had X when Y, No sooner had X than Y, Not until X did Y, Scarcely had, Little did

ENGLISH CLOZE / EDITING / COMPREHENSION
- Foundation: common phrasal verbs, basic prepositions, SVA, simple tense, 1m direct retrieval
- Standard: tense agreement, common collocations, past-tense irregulars, 1m inference from one paragraph
- Advanced: register-aware vocab, conditional connectives, subjunctive forms, 2m CER from 2+ paragraphs
- HOTS: stylistic register choice, idiomatic phrase, multi-error trap, 3m author's purpose / theme / irony

═══════ OUTPUT FORMAT ═══════

Return ONLY a JSON object — no markdown, no commentary:

{"updates":[
  {"id":"<uuid>","new_difficulty":"Foundation|Standard|Advanced|HOTS","confidence":"high|low","reasoning":"<≤80 chars>"}
]}

confidence: "high" if you can defend the band against the rubric in one sentence; "low" if the question is genuinely ambiguous or info is missing.`;

// ─── DB query: rows to review ───────────────────────────────
async function fetchRows() {
  let q = supabase.from('question_bank')
    .select('id, subject, level, topic, sub_topic, type, marks, difficulty, difficulty_pre_019, cognitive_skill, question_text, instructions')
    .order('id', { ascending: true });

  if (F_SUBJECT) q = q.eq('subject', F_SUBJECT);
  if (F_TOPIC)   q = q.eq('topic',   F_TOPIC);
  if (F_LEVEL)   q = q.eq('level',   F_LEVEL);

  if (TARGET === 'hots') {
    q = q.eq('difficulty', 'HOTS');
  } else if (TARGET === 'drift') {
    // Rows where Phase A made no change (current = backup OR no backup yet)
    q = q.or('difficulty_pre_019.is.null,difficulty.eq.difficulty_pre_019');
  }
  // 'all' = no extra filter

  // Skip rows already reviewed in this session (in reclassify_review)
  // Pull those IDs first, exclude them
  const { data: reviewed } = await supabase.from('reclassify_review').select('question_id');
  const skipIds = new Set((reviewed || []).map(r => r.question_id));

  if (LIMIT > 0) q = q.limit(Math.max(LIMIT + skipIds.size, BATCH_SIZE));
  const { data, error } = await q;
  if (error) throw error;

  const filtered = (data || []).filter(r => !skipIds.has(r.id));
  return LIMIT > 0 ? filtered.slice(0, LIMIT) : filtered;
}

// ─── Build the user message for one batch ───────────────────
function buildBatchPayload(rows) {
  const items = rows.map(r => ({
    id:               r.id,
    subject:          r.subject,
    level:            r.level,
    topic:            r.topic,
    sub_topic:        r.sub_topic || null,
    type:             r.type,
    marks:            r.marks,
    current_band:     r.difficulty,
    cognitive_skill:  r.cognitive_skill || null,
    question_preview: (r.question_text || '').slice(0, PREVIEW_CHARS),
    instructions:     (r.instructions   || '').slice(0, 120),
  }));
  return `Tag each question below. Return JSON {"updates":[...]} with one entry per id. ${items.length} questions:\n\n${JSON.stringify(items, null, 0)}`;
}

// ─── Call o4-mini with auto-cached rubric ───────────────────
async function classifyBatch(rows) {
  const userText = buildBatchPayload(rows);
  const resp = await openai.chat.completions.create({
    model:                 MODEL,
    max_completion_tokens: MAX_COMPLETION_TOKENS,
    reasoning_effort:      REASONING_EFFORT,
    response_format:       { type: 'json_object' },
    messages: [
      { role: 'developer', content: RUBRIC_SYSTEM_PROMPT },
      { role: 'user',      content: userText },
    ],
  });

  const text = resp.choices?.[0]?.message?.content || '';
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_) {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error(`No JSON in o4-mini response: ${text.slice(0, 200)}`);
    parsed = JSON.parse(m[0]);
  }

  return {
    updates:           parsed.updates || [],
    input_tokens:      resp.usage?.prompt_tokens || 0,
    output_tokens:     resp.usage?.completion_tokens || 0,
    cached_tokens:     resp.usage?.prompt_tokens_details?.cached_tokens || 0,
    reasoning_tokens:  resp.usage?.completion_tokens_details?.reasoning_tokens || 0,
  };
}

// ─── Apply updates ──────────────────────────────────────────
async function applyUpdates(rowsById, updates) {
  let highApplied = 0;
  let lowQueued   = 0;
  let invalid     = 0;

  for (const u of updates) {
    const row = rowsById[u.id];
    if (!row) { invalid++; continue; }
    if (!['Foundation','Standard','Advanced','HOTS'].includes(u.new_difficulty)) { invalid++; continue; }
    if (!['high','low'].includes(u.confidence)) { invalid++; continue; }

    // Skip no-op suggestions
    if (u.new_difficulty === row.difficulty) continue;

    if (DRY_RUN) {
      console.log(`  [dry-run] ${row.subject}/${row.topic} ${u.id.slice(0,8)} ${row.difficulty}→${u.new_difficulty} (${u.confidence}) ${u.reasoning || ''}`);
      if (u.confidence === 'high') highApplied++; else lowQueued++;
      continue;
    }

    if (u.confidence === 'high') {
      const { error } = await supabase.from('question_bank')
        .update({ difficulty: u.new_difficulty, updated_at: new Date().toISOString() })
        .eq('id', u.id);
      if (error) { console.error(`  ✗ UPDATE failed for ${u.id}: ${error.message}`); invalid++; }
      else highApplied++;
    } else {
      const { error } = await supabase.from('reclassify_review').upsert({
        question_id:    u.id,
        current_band:   row.difficulty,
        suggested_band: u.new_difficulty,
        confidence:     'low',
        reasoning:      u.reasoning || null,
      }, { onConflict: 'question_id' });
      if (error) { console.error(`  ✗ INSERT review failed for ${u.id}: ${error.message}`); invalid++; }
      else lowQueued++;
    }
  }

  return { highApplied, lowQueued, invalid };
}

// ─── Main loop ──────────────────────────────────────────────
async function main() {
  console.log(`reclassify-difficulty.js`);
  console.log(`  model:      ${MODEL}`);
  console.log(`  batch:      ${BATCH_SIZE} rows`);
  console.log(`  target:     ${TARGET}${F_SUBJECT ? ` · subject=${F_SUBJECT}` : ''}${F_TOPIC ? ` · topic=${F_TOPIC}` : ''}${F_LEVEL ? ` · level=${F_LEVEL}` : ''}`);
  console.log(`  dry-run:    ${DRY_RUN}`);
  console.log(`  limit:      ${LIMIT || 'none'}`);
  console.log('');

  const rows = await fetchRows();
  console.log(`Fetched ${rows.length} rows for review.\n`);
  if (rows.length === 0) return;

  const totals = {
    rows:             0,
    highApplied:      0,
    lowQueued:        0,
    invalid:          0,
    inputTokens:      0,
    outputTokens:     0,
    cachedTokens:     0,
    reasoningTokens:  0,
  };

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const rowsById = Object.fromEntries(batch.map(r => [r.id, r]));
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

    console.log(`Batch ${batchNum}/${totalBatches} — ${batch.length} rows…`);
    let result;
    try {
      result = await classifyBatch(batch);
    } catch (e) {
      console.error(`  ✗ o4-mini call failed: ${e.message}`);
      continue;
    }

    const { highApplied, lowQueued, invalid } = await applyUpdates(rowsById, result.updates);
    totals.rows            += batch.length;
    totals.highApplied     += highApplied;
    totals.lowQueued       += lowQueued;
    totals.invalid         += invalid;
    totals.inputTokens     += result.input_tokens;
    totals.outputTokens    += result.output_tokens;
    totals.cachedTokens    += result.cached_tokens;
    totals.reasoningTokens += result.reasoning_tokens;

    console.log(`  → ${highApplied} applied · ${lowQueued} queued for review · ${invalid} invalid`);
    console.log(`    tokens: ${result.input_tokens} in (cached ${result.cached_tokens}) · ${result.output_tokens} out (reasoning ${result.reasoning_tokens})`);
  }

  // Cost estimate (o4-mini: $1.10/M input, $0.275/M cached input, $4.40/M output)
  const freshIn   = Math.max(0, totals.inputTokens - totals.cachedTokens);
  const costInput  = (freshIn              / 1_000_000) * 1.10;
  const costCached = (totals.cachedTokens  / 1_000_000) * 0.275;
  const costOut    = (totals.outputTokens  / 1_000_000) * 4.40;
  const total      = costInput + costCached + costOut;

  console.log('');
  console.log('───────────────────────── SUMMARY ─────────────────────────');
  console.log(`Rows processed:          ${totals.rows}`);
  console.log(`High-confidence UPDATEs: ${totals.highApplied}`);
  console.log(`Low-confidence queued:   ${totals.lowQueued}`);
  console.log(`Invalid responses:       ${totals.invalid}`);
  console.log(`Tokens — in: ${totals.inputTokens} (cached ${totals.cachedTokens})  out: ${totals.outputTokens} (reasoning ${totals.reasoningTokens})`);
  console.log(`Estimated cost: $${total.toFixed(4)} (USD)`);
  if (DRY_RUN) console.log('** DRY RUN — no DB writes performed **');
}

main().catch(err => { console.error('fatal:', err); process.exit(1); });
