# Week 2 — Backfill Handoff (post-sprint)

**Sprint:** Week 2 follow-up (runs AFTER Week 2 ships)
**Stream:** Backend & Admin
**Estimated time:** 1–2 days for full backfill (mostly waiting on OpenAI Batch API)
**Blocking:** Nothing. Heatmap and dependency tree work without this — they just look richer once it lands.
**Depends on:** Week 2 fully shipped. Diagnostic and Topic Naming handoffs landed (otherwise new writes will undo your backfill).

---

## Goal

Enrich existing `question_bank` rows that have null or non-canonical `sub_topic` and `cognitive_skill` fields. Use OpenAI Batch API (already wired up in `handleAutoFillQuestionBank` and `handleIngestBatchResults`) for cost-effective bulk inference.

This handoff has **two passes**:
- **Pass 1 — Dry-run on 50 rows.** Human-verify accuracy before any DB write.
- **Pass 2 — Full run.** Idempotent batched inference + write, with rollback plan.

`question_attempts` enrichment is intentionally **deferred to a later phase** — see "Why not question_attempts" section.

---

## Pre-flight reading

1. `lib/api/handlers.js` — existing `handleAutoFillQuestionBank` and `handleIngestBatchResults`. The batch infrastructure is already there from WS B.
2. `lib/api/quest-pedagogy.js` — `SYLLABUS_DEPENDENCIES` (post Backend handoff). Source of truth for canonical `topic` and `sub_topic` strings.
3. `migrations/` — find the most recent migration number to seed your backfill migrations (likely 015, 016).
4. `docs/INCIDENTS.md` — note the Apr 22 → fix-date gap. Backfill will not enrich rows that don't exist.

---

## Audit — what needs enrichment

Run these counts in Supabase SQL Editor first to know the scope:

```sql
-- question_bank rows missing sub_topic
SELECT subject, count(*) AS missing_sub_topic
FROM public.question_bank
WHERE sub_topic IS NULL OR trim(sub_topic) = ''
GROUP BY subject
ORDER BY missing_sub_topic DESC;

-- question_bank rows missing cognitive_skill
SELECT subject, count(*) AS missing_cog
FROM public.question_bank
WHERE cognitive_skill IS NULL OR trim(cognitive_skill) = ''
GROUP BY subject
ORDER BY missing_cog DESC;

-- question_bank rows with non-canonical topic (English smell test)
SELECT topic, count(*)
FROM public.question_bank
WHERE subject = 'english'
  AND topic NOT IN ('Grammar', 'Vocabulary', 'Cloze', 'Editing', 'Comprehension', 'Synthesis', 'Summary Writing')
GROUP BY topic
ORDER BY count(*) DESC;

-- Total enrichment scope
SELECT count(*) AS total_to_enrich
FROM public.question_bank
WHERE (sub_topic IS NULL OR trim(sub_topic) = '')
   OR (cognitive_skill IS NULL OR trim(cognitive_skill) = '')
   OR (subject = 'english' AND topic NOT IN ('Grammar', 'Vocabulary', 'Cloze', 'Editing', 'Comprehension', 'Synthesis', 'Summary Writing'));
```

Document the counts in the PR description. The total will determine batch sizing.

---

## Pass 1 — Dry-run on 50 rows

### Goal

Inference without DB writes. Eyeball the OpenAI output, catch systematic errors before they corrupt 1000+ rows.

### Sample selection

Pick 50 representative rows: ~17 per subject, balanced across topics. SQL:

```sql
WITH ranked AS (
  SELECT id, subject, topic, sub_topic, cognitive_skill, type,
         question_text, options, parts, passage,
         row_number() OVER (PARTITION BY subject ORDER BY random()) AS rn
  FROM public.question_bank
  WHERE (sub_topic IS NULL OR trim(sub_topic) = '')
     OR (cognitive_skill IS NULL OR trim(cognitive_skill) = '')
)
SELECT id, subject, topic, sub_topic, cognitive_skill, type, question_text, options, parts, passage
FROM ranked
WHERE rn <= 17
ORDER BY subject, rn;
```

Cap at 50 total. Save as `backfill_sample.csv`.

### Build the batch JSONL

The OpenAI Batch API takes a JSONL file. One line per question. Build it via a Node script (one-off, run from your laptop):

```js
// scripts/backfill_pass1_build.js
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { SYLLABUS_DEPENDENCIES } from '../lib/api/quest-pedagogy.js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SYSTEM_PROMPT = `You are a Singapore MOE curriculum expert. For each question, infer the canonical topic, sub_topic, and cognitive_skill.

CONSTRAINTS:
- topic and sub_topic MUST be from the SYLLABUS_DEPENDENCIES map for the given subject (provided below).
- cognitive_skill MUST be one of: 'Factual Recall', 'Conceptual Understanding', 'Routine Application', 'Non-Routine / Heuristics', 'Inferential Reasoning', 'Synthesis & Evaluation'.
- If you cannot confidently classify, return null for that field. NEVER invent topic or sub_topic strings.

OUTPUT: ONLY a JSON object: {"topic": "...", "sub_topic": "...", "cognitive_skill": "..."}. No prose.`;

async function main() {
  const { data: rows } = await sb
    .from('question_bank')
    .select('id, subject, topic, sub_topic, cognitive_skill, type, question_text, options, parts, passage')
    .or('sub_topic.is.null,cognitive_skill.is.null')
    .limit(50);

  const lines = rows.map((r, i) => {
    const subjectMap = SYLLABUS_DEPENDENCIES[r.subject?.toLowerCase()];
    const canonContext = JSON.stringify(
      Object.fromEntries(
        Object.entries(subjectMap || {}).map(([t, v]) => [t, v.sub_topics])
      ),
      null, 2
    );
    const userPrompt = `SUBJECT: ${r.subject}\nCURRENT TOPIC (may be wrong): ${r.topic}\nQUESTION TYPE: ${r.type}\nQUESTION TEXT: ${(r.question_text || '').slice(0, 500)}\n${r.passage ? `PASSAGE EXCERPT: ${r.passage.slice(0, 300)}\n` : ''}\nCANONICAL TOPICS AND SUB_TOPICS FOR ${r.subject?.toUpperCase()}:\n${canonContext}\n\nReturn the canonical {topic, sub_topic, cognitive_skill}.`;

    return JSON.stringify({
      custom_id: `backfill_${r.id}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }
    });
  });

  fs.writeFileSync('backfill_pass1.jsonl', lines.join('\n') + '\n');
  console.log(`Wrote ${rows.length} requests to backfill_pass1.jsonl`);
}

main().catch(console.error);
```

Run: `node scripts/backfill_pass1_build.js`. Inspect `backfill_pass1.jsonl` — verify a few lines look sensible (correct subject, prompt includes canonical context).

### Submit to OpenAI Batch API

```bash
# Upload the JSONL
curl https://api.openai.com/v1/files \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F purpose="batch" \
  -F file="@backfill_pass1.jsonl"
# → returns { "id": "file-xxx", ... }

# Create the batch
curl https://api.openai.com/v1/batches \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file-xxx",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h"
  }'
# → returns { "id": "batch_xxx", "status": "validating", ... }
```

Poll the batch status until `completed` (typically 5–60 minutes for small batches). Then download the output:

```bash
curl https://api.openai.com/v1/batches/batch_xxx \
  -H "Authorization: Bearer $OPENAI_API_KEY"
# → returns batch object with output_file_id

curl https://api.openai.com/v1/files/file-yyy/content \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -o backfill_pass1_output.jsonl
```

### Human-verify the output (CRITICAL)

Open `backfill_pass1_output.jsonl`. For each line, parse and inspect the OpenAI response. Build a CSV: `id, original_question_text, original_topic, suggested_topic, suggested_sub_topic, suggested_cognitive_skill`.

**Manually review all 50 rows.** For each, judge:
- Is the suggested `topic` correct given the question?
- Is the `sub_topic` a precise match (not just plausible)?
- Is `cognitive_skill` reasonable?

Acceptance criteria for proceeding to Pass 2:
- ≥ 90% of rows have correct topic.
- ≥ 80% of rows have correct sub_topic.
- ≥ 80% of rows have reasonable cognitive_skill.
- Zero rows have invented (non-canonical) topic or sub_topic strings.

If any criterion fails, **iterate the prompt** in `backfill_pass1_build.js` and rerun the batch. Common fixes:
- Add explicit examples in the system prompt.
- Add a per-subject prompt variant (English needs different framing than Maths).
- Lower temperature further (0.05).

Do NOT proceed to Pass 2 until accuracy is acceptable. The cost of a wrong full-run is >> the cost of one extra prompt iteration.

---

## Pass 2 — Full run (idempotent, batched)

### Goal

Apply enrichment to every row identified in the audit. Idempotent so partial failures are safe to retry.

### Idempotency strategy

Add a column `backfill_run_id` to `question_bank` (text, nullable). Every backfill batch tags rows with the batch ID it processed. Re-running with the same batch ID is a no-op. Re-running with a new batch ID skips rows already tagged.

```sql
-- migrations/015_add_backfill_run_id.sql
ALTER TABLE public.question_bank
  ADD COLUMN IF NOT EXISTS backfill_run_id TEXT;

CREATE INDEX IF NOT EXISTS idx_qb_backfill_run_id
  ON public.question_bank(backfill_run_id)
  WHERE backfill_run_id IS NOT NULL;
```

### Batching

OpenAI Batch API limit per file: 50,000 requests OR 100MB. For your scale this is one batch. If your audit count > 5,000, split into chunks of 5,000 to keep individual file sizes manageable.

For each batch:
1. Generate JSONL via the Pass 1 script (without the `LIMIT 50`).
2. Upload + submit.
3. Poll until complete.
4. Download output.
5. Apply via the script below.

### Apply script

```js
// scripts/backfill_pass2_apply.js
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { SYLLABUS_DEPENDENCIES } from '../lib/api/quest-pedagogy.js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const RUN_ID = process.argv[2] || `backfill_${Date.now()}`;
const OUTPUT_FILE = process.argv[3] || 'backfill_pass2_output.jsonl';

function isCanon(subject, topic, subTopic) {
  const subjectMap = SYLLABUS_DEPENDENCIES[subject?.toLowerCase()];
  if (!subjectMap) return false;
  const node = subjectMap[topic];
  if (!node) return false;
  if (subTopic && !node.sub_topics.includes(subTopic)) return false;
  return true;
}

async function main() {
  const lines = fs.readFileSync(OUTPUT_FILE, 'utf8').split('\n').filter(Boolean);
  let updated = 0, skippedInvalid = 0, skippedAlreadyDone = 0, errors = 0;

  for (const line of lines) {
    try {
      const rec = JSON.parse(line);
      const id = rec.custom_id.replace(/^backfill_/, '');
      const content = rec.response?.body?.choices?.[0]?.message?.content;
      if (!content) { errors++; continue; }
      const parsed = JSON.parse(content);

      // Fetch current row to validate canon and check idempotency
      const { data: row } = await sb.from('question_bank').select('subject, topic, sub_topic, cognitive_skill, backfill_run_id').eq('id', id).single();
      if (!row) { errors++; continue; }
      if (row.backfill_run_id === RUN_ID) { skippedAlreadyDone++; continue; }

      // Decide what to update — only fill missing fields, never overwrite good data
      const updates = { backfill_run_id: RUN_ID };
      if ((!row.sub_topic || row.sub_topic.trim() === '') && parsed.sub_topic) {
        if (!isCanon(row.subject, parsed.topic || row.topic, parsed.sub_topic)) {
          skippedInvalid++; continue;
        }
        updates.sub_topic = parsed.sub_topic;
      }
      if ((!row.cognitive_skill || row.cognitive_skill.trim() === '') && parsed.cognitive_skill) {
        const validSkills = ['Factual Recall', 'Conceptual Understanding', 'Routine Application', 'Non-Routine / Heuristics', 'Inferential Reasoning', 'Synthesis & Evaluation'];
        if (validSkills.includes(parsed.cognitive_skill)) {
          updates.cognitive_skill = parsed.cognitive_skill;
        }
      }
      // Only fix topic if it's currently non-canonical AND new one is canonical
      if (parsed.topic && row.topic !== parsed.topic && isCanon(row.subject, parsed.topic, parsed.sub_topic || row.sub_topic)) {
        updates.topic = parsed.topic;
      }

      const { error } = await sb.from('question_bank').update(updates).eq('id', id);
      if (error) { console.error('update error', id, error.message); errors++; continue; }
      updated++;
    } catch (e) {
      console.error('line error:', e.message);
      errors++;
    }
  }

  console.log({ run_id: RUN_ID, updated, skippedInvalid, skippedAlreadyDone, errors });
}

main().catch(console.error);
```

Run: `node scripts/backfill_pass2_apply.js backfill_2026_04_30 backfill_pass2_output.jsonl`. Save the run ID — you'll need it for rollback.

### Verification (post-run)

```sql
-- Coverage gain
SELECT subject,
  count(*) AS total,
  count(*) FILTER (WHERE sub_topic IS NOT NULL AND trim(sub_topic) <> '') AS with_sub_topic,
  count(*) FILTER (WHERE cognitive_skill IS NOT NULL AND trim(cognitive_skill) <> '') AS with_cog_skill
FROM public.question_bank
GROUP BY subject;

-- Rows touched by this run
SELECT count(*) FROM public.question_bank WHERE backfill_run_id = 'backfill_2026_04_30';

-- Spot check: any non-canonical strings sneak in?
SELECT id, subject, topic, sub_topic FROM public.question_bank
WHERE backfill_run_id = 'backfill_2026_04_30'
  AND subject = 'english'
  AND topic NOT IN ('Grammar', 'Vocabulary', 'Cloze', 'Editing', 'Comprehension', 'Synthesis', 'Summary Writing');
-- Should return 0 rows
```

### Rollback plan

If you discover a systematic error after Pass 2 lands:

```sql
-- Rollback: clear all fields touched by this run
-- (only safe if those fields were null before — by design, the script
-- only fills missing fields, so clearing back to null is correct)
UPDATE public.question_bank
SET sub_topic = NULL,
    cognitive_skill = NULL,
    -- topic rollback is harder; track it separately if you allow topic changes
    backfill_run_id = NULL
WHERE backfill_run_id = 'backfill_2026_04_30';
```

For topic changes specifically, snapshot before-state into a temp table before Pass 2 if you intend to allow topic correction:

```sql
CREATE TABLE public.backfill_pass2_snapshot AS
SELECT id, topic AS original_topic, sub_topic AS original_sub_topic, cognitive_skill AS original_cog
FROM public.question_bank
WHERE (sub_topic IS NULL OR trim(sub_topic) = '')
   OR (cognitive_skill IS NULL OR trim(cognitive_skill) = '');
```

Then rollback with a JOIN to the snapshot table. Drop the snapshot once you're confident the run is correct.

---

## Why not question_attempts

`question_attempts` rows have `topic` and `sub_topic` columns too, and many existing rows have nulls. Tempting to backfill them similarly. **Don't, in this phase.**

Reasons:
1. **Volume.** `question_attempts` rows are 10–50× more numerous than `question_bank` (one row per question per attempt). OpenAI cost scales linearly.
2. **Lower marginal value.** The heatmap, dependency tree, and hero sentence read primarily from `mastery_levels`, which is computed from `question_attempts` going forward. Once Diagnostic + Topic Naming land, all NEW attempts have correct topic/sub_topic, and `mastery_levels` updates correctly. The historical `question_attempts` gap mostly affects the modal's "recent attempts" list, which only needs the last 5 rows per cell — and those will be fresh writes within a week of normal usage.
3. **Cleaner alternative if needed later.** A future migration can join `question_attempts.quiz_attempt_id` → `quiz_attempts` → original `question_bank` row (if the question still exists) and propagate the canonical strings via SQL, no AI inference needed. Cheaper and more accurate.

If after 4 weeks of usage the heatmap modal still feels sparse for some cells, revisit `question_attempts` backfill via the SQL-join approach above.

---

## Cost estimate

Rough numbers for budgeting (use real audit counts to refine):

- 50,000 question_bank rows to enrich
- gpt-4o-mini batch pricing: ~$0.075 per 1M input tokens, ~$0.30 per 1M output tokens (50% discount on regular pricing for batch).
- Per-row tokens: ~600 input (prompt + question + canon context) + ~50 output (small JSON) → ~650 total
- 50,000 × 650 = ~32.5M tokens
- Cost: ~32.5 × $0.075 + small output cost ≈ **$3–$5 USD total**

Practically free. If audit count is 200k+, scale linearly.

---

## Commit messages

Pass 1:
```
chore(backfill): pass 1 dry-run for question_bank enrichment

Run OpenAI Batch API on 50 sample rows. No DB writes. Output saved to
backfill_pass1_output.jsonl for human verification.
```

Pass 2:
```
chore(backfill): pass 2 full run for question_bank enrichment

Backfill question_bank rows missing sub_topic / cognitive_skill via
OpenAI Batch API (gpt-4o-mini, batch_xxx).

- Idempotent via backfill_run_id column (migration 015).
- Validates topic / sub_topic against SYLLABUS_DEPENDENCIES canon before
  writing — invalid suggestions are dropped.
- Coverage: <before>% → <after>% sub_topic, <before>% → <after>% cog_skill.
- Run ID: backfill_<timestamp>. Rollback SQL in handoff doc.

question_attempts intentionally NOT backfilled — see handoff for rationale.
```

---

## Out of scope

- `question_attempts` enrichment (covered above).
- `mastery_levels` cleanup of orphan rows from legacy topic strings — optional follow-up; orphans don't break anything, they just sit unused.
- Re-grading historical attempts. Backfill changes the metadata, not the correctness of past answers.
- Backfilling the Apr 22 → fix-date `question_attempts` gap — those rows do not exist and cannot be reconstructed.