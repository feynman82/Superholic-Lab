# Week 2 — Backfill Runbook

Step-by-step protocol for running the `question_bank` enrichment backfill
defined in `WEEK2_BACKFILL_HANDOFF.md`. Toolkit in `scripts/backfill/`.

**Audit (2026-04-29):**
- Science: 8,211 rows. Missing sub_topic: 618. Missing cognitive_skill: 5.
- English: 1,975 rows. Missing sub_topic: 968. Missing cognitive_skill: 902.
- Topic: 100% canonical (FK constraint enforces it).
- Sub_topic drift: 0 rows (all populated sub_topics are canon).

**Cost estimate:** ~1,586 enrichment requests × ~700 tokens ≈ ~1.1M tokens.
gpt-4o-mini batch pricing → **~$0.10 USD total**.

---

## Anti-hallucination design

Five layers of defence so an AI hallucination cannot land non-canonical
data in `question_bank`:

1. **Inline canon enumeration in the prompt.** The user message lists the
   exact canonical sub_topic strings for the row's (subject, topic) pair.
   The model picks from a closed set, not from open-ended generation.
2. **Triple-repeated MUST-pick-from-canon rule** in the system prompt.
3. **Few-shot examples** showing the desired null-on-uncertainty
   behaviour. Example 4 in the prompt explicitly demonstrates returning
   null when the question stem is too thin to classify.
4. **`response_format: json_object` + temperature 0.05** — minimum
   coherence sampling, strict JSON.
5. **Independent canon validator in `apply.js`.** Even if the model
   ignores all four prompt-level guards, the apply script re-validates
   every suggestion against `SYLLABUS_DEPENDENCIES` before writing.
   Non-canon suggestions are rejected and counted in `skippedNonCanon`.

`apply.js` only writes:
- sub_topic — when confidence === 'high' AND value is in canon list.
- cognitive_skill — when value is one of the 6 enum strings.
- topic — never. Topic is already 100% canon (FK enforced); we don't
  ship topic edits in this backfill, full stop.

---

## Prerequisites

Set in shell (or `.env` and source it):

```bash
export SUPABASE_URL=https://rlmqsbxevuutugtyysjr.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
export OPENAI_API_KEY=<openai-key>
```

Migration 027 (`backfill_run_id` column) must be applied.
Verify: `SELECT column_name FROM information_schema.columns WHERE table_name='question_bank' AND column_name='backfill_run_id';` returns one row.

---

## Pass 1 — Dry-run on 50 rows

Goal: human-verify the AI output **before** scaling to the full ~1,586 rows.

### 1.1 Build the JSONL

```bash
node scripts/backfill/build.js --sample 50 --out backfill_pass1.jsonl
```

Inspect the file — confirm sample rows look sensible (correct subject,
canon list present, MISSING field declared correctly).

### 1.2 Submit to OpenAI Batch API

```bash
node scripts/backfill/submit.js backfill_pass1.jsonl
```

This:
- Uploads the JSONL to OpenAI Files (`purpose=batch`)
- Creates the batch (24h completion window)
- Polls every 15s until `completed`/`failed`/`expired`/`cancelled`
- Downloads `backfill_pass1.output.jsonl` on success

Typical completion time for 50 rows: 5–30 minutes.

### 1.3 Audit the output

```bash
node scripts/backfill/audit.js backfill_pass1.output.jsonl
```

The script prints one line per row with a confidence flag (✓ / · MED /
⚠️ LOW / 🚨 NON-CANON / 🚨 BAD ENUM) plus the question stem, the model's
suggestion, and the reason.

End of run prints a tally + effective acceptance rate.

**Acceptance gate** before proceeding to Pass 2:
- Effective acceptance rate ≥ 80%
- `nonCanonSub === 0` (the apply script's independent canon check
  catches this anyway, but a non-zero count means the prompt is leaking
  hallucinations and is worth tightening)
- `badEnum === 0` (cognitive_skill enum is small enough that any miss
  signals a prompt drift)

If gate fails: tighten the prompt in `scripts/backfill/build.js`
(add subject-specific examples, lower temperature further) and re-run.

### 1.4 Optional: dry-run-apply on the sample

To preview what would be written without touching the DB:

```bash
node scripts/backfill/apply.js backfill_pass1.output.jsonl backfill_pass1_test --dry-run
```

The script prints stats (`updated`, `skippedLowConfidence`, etc.) and the
first 5 update payloads. Confirms the apply gate behaves correctly.

---

## Pass 2 — Full run

Only proceed if Pass 1 acceptance gate passed.

### 2.1 Build the full JSONL

```bash
# Subject-by-subject is safer than one mega-batch — easier to roll back
# a single subject if you spot a systematic issue post-write.
node scripts/backfill/build.js --subject Science --out backfill_science.jsonl
node scripts/backfill/build.js --subject English --out backfill_english.jsonl
```

### 2.2 Submit each subject

```bash
node scripts/backfill/submit.js backfill_science.jsonl
node scripts/backfill/submit.js backfill_english.jsonl
```

Run them sequentially or in parallel — they're independent batches.

### 2.3 Apply with a unique run id per subject

```bash
RUN_ID=backfill_$(date +%Y_%m_%d)
node scripts/backfill/apply.js backfill_science.output.jsonl ${RUN_ID}_science
node scripts/backfill/apply.js backfill_english.output.jsonl ${RUN_ID}_english
```

Save the run ids. You'll need them for rollback.

### 2.4 Verify coverage gain

Run in Supabase SQL Editor:

```sql
SELECT subject,
  count(*) AS total,
  count(*) FILTER (WHERE sub_topic IS NOT NULL AND trim(sub_topic) <> '') AS with_sub_topic,
  count(*) FILTER (WHERE cognitive_skill IS NOT NULL AND trim(cognitive_skill) <> '') AS with_cog_skill
FROM public.question_bank
GROUP BY subject;

-- Rows touched by this run
SELECT count(*), backfill_run_id
FROM public.question_bank
WHERE backfill_run_id LIKE 'backfill_2026_%'
GROUP BY backfill_run_id;

-- Spot check: no non-canon strings sneaked in
SELECT qb.subject, qb.topic, qb.sub_topic, count(*) AS rows
FROM question_bank qb
LEFT JOIN canon_sub_topics c
  ON lower(c.subject) = lower(qb.subject) AND c.topic = qb.topic AND c.sub_topic = qb.sub_topic
WHERE qb.backfill_run_id LIKE 'backfill_2026_%'
  AND qb.sub_topic IS NOT NULL
  AND c.sub_topic IS NULL
GROUP BY qb.subject, qb.topic, qb.sub_topic;
-- → expect 0 rows (the apply gate + DB FK constraint both reject non-canon)
```

---

## Rollback

If you discover a systematic issue post-Pass-2:

```sql
-- Roll back a single run (sub_topic + cognitive_skill back to NULL).
-- Only safe because apply.js only fills MISSING fields, never overwrites.
UPDATE public.question_bank
   SET sub_topic       = NULL,
       cognitive_skill = NULL,
       backfill_run_id = NULL
 WHERE backfill_run_id = '<the run id>';
```

Verify with:
```sql
SELECT count(*) FROM question_bank WHERE backfill_run_id = '<the run id>';
-- → expect 0 after rollback
```

---

## After the backfill — propagate to mastery_levels

The backfill enriches `question_bank` only. The new Pillar 2 components
(hero / heatmap / dependency tree) read from `mastery_levels`. To make
the backfill *visible* to those components, two paths:

1. **Wait for organic catch-up.** Every new `question_attempts` INSERT
   fires the BKT trigger which writes `mastery_levels` with the now-
   correct `sub_topic` from the question_bank row. Within a week of
   normal usage the heatmap starts filling in.

2. **Replay BKT over historical question_attempts** (separate task,
   not in this handoff). A SQL backfill that joins
   `question_attempts → quiz_attempts → question_bank` and produces
   topic-level mean accuracy as initial mastery probability. Cheaper
   than AI inference and more accurate. The page already has a
   `quiz_attempts` fallback (commit `f362a35`) so this isn't urgent.

---

## Out of scope (per handoff)

- `question_attempts` enrichment — covered in the parent handoff's
  "Why not question_attempts" section.
- Topic edits — `question_bank.topic` is 100% canon already (FK).
  The apply script never writes topic.
- Re-grading historical attempts.
- Backfilling the Apr 22 → Apr 29 `question_attempts` blackout window —
  those rows do not exist; not recoverable.
