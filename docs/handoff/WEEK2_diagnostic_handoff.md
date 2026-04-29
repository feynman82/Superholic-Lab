# Week 2 — Diagnostic Handoff (URGENT, BLOCKING)

**Sprint:** Week 2 prep (must land before any Week 2 commit)
**Stream:** Backend & Admin
**Estimated time:** 30 minutes
**Blocking:** Topic Naming handoff, Week 2 Backend handoff, Week 2 Frontend handoff. Backfill handoff is independent.

---

## Problem

Since **22 April 2026 04:37:01 UTC**, no rows have been written to `question_attempts`. Live error from `quiz.html` confirms:

```
POST /rest/v1/question_attempts → 400 Bad Request
{
  "code": "42703",
  "message": "record \"new\" has no field \"subject\""
}
```

Postgres error `42703` = undefined column. The error references `NEW.subject` — meaning a **trigger** on `question_attempts` is referencing a column that doesn't exist on that table. `question_attempts` has no `subject` column (only `topic`, `sub_topic`); subject lives on `quiz_attempts`.

The frontend code in `quiz.js` is correct. The bug is server-side, almost certainly introduced by `013_question_bank_qa.sql` or a co-deployed migration on April 22.

---

## Diagnostic protocol

### Step 1 — Identify the offending trigger

Run in **Supabase SQL Editor** (project `rlmqsbxevuutugtyysjr`, Singapore region):

```sql
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'question_attempts'
ORDER BY trigger_name;
```

Expected output: at least one row, likely named something like `mastery_levels_after_attempt` or `update_mastery_on_attempt`. The `action_statement` will reveal the function name being called.

Then inspect the function source:

```sql
SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%NEW.subject%';
```

This finds every function that references `NEW.subject`. The match is your culprit.

### Step 2 — Read the migration that introduced it

Open `migrations/013_question_bank_qa.sql` (or whichever migration timestamp matches Apr 22). Confirm it contains a `CREATE FUNCTION` or `CREATE TRIGGER` block referencing `NEW.subject` on `question_attempts`. Document the exact function name and trigger name in your fix migration's commit message.

If it's not migration 013, check 011, 012 too — the `mastery_levels` upsert trigger could have been added earlier and broken by a later schema change. Either way, the diagnostic SQL above pinpoints it.

### Step 3 — Confirm the schema gap

Run:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'question_attempts'
ORDER BY ordinal_position;
```

Confirm: there is no `subject` column on `question_attempts`. Subject must be derived via `quiz_attempts.subject` joined on `quiz_attempt_id`.

### Step 4 — Sanity check the live error

Open `quiz.html` in production. Complete a 3-question quiz. Open DevTools Network tab. Find the `POST /rest/v1/question_attempts` request. Confirm the response body still shows `code: "42703"` and references `NEW.subject`. This confirms the bug is still live and the fix you'll write will close it.

---

## Fix

The trigger function needs to derive `subject` (and likely `level`) from `quiz_attempts` via the `quiz_attempt_id` foreign key. Below is the canonical replacement pattern — adapt the function body once you've identified the actual broken function in Step 1.

### Migration file

Create `migrations/014_fix_question_attempts_trigger.sql`:

```sql
-- 014_fix_question_attempts_trigger.sql
-- Fixes the trigger on question_attempts that references NEW.subject.
-- question_attempts has no subject column; subject is derived from
-- quiz_attempts via quiz_attempt_id.
--
-- Root cause: migration 013 (or earlier) added a mastery upsert trigger
-- that assumed subject lived on the row being inserted. Since 22 Apr 2026,
-- every quiz.html submission has failed silently because of this 42703
-- error, blocking BKT updates and progress page data.

BEGIN;

-- Step 1: replace the broken function with a corrected version.
-- IMPORTANT: replace `update_mastery_on_attempt` below with the actual
-- function name you identified in Step 1 of the diagnostic protocol.

CREATE OR REPLACE FUNCTION public.update_mastery_on_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_subject TEXT;
  v_correct_weight NUMERIC;
  v_attempts_inc INTEGER;
BEGIN
  -- Derive subject from the parent quiz_attempts row via FK
  SELECT subject INTO v_subject
  FROM public.quiz_attempts
  WHERE id = NEW.quiz_attempt_id;

  -- Defensive: if no parent quiz, do nothing (don't block the insert)
  IF v_subject IS NULL THEN
    RETURN NEW;
  END IF;

  -- BKT update: weight HOTS / AO3 cognitive skills 1.5x
  v_correct_weight := CASE
    WHEN NEW.cognitive_skill IN (
      'Non-Routine / Heuristics',
      'Inferential Reasoning',
      'Synthesis & Evaluation'
    ) OR NEW.cognitive_skill = 'HOTS' THEN 1.5
    ELSE 1.0
  END;

  v_attempts_inc := 1;

  -- Upsert into mastery_levels using the canonical unique key
  -- (student_id, subject, topic, sub_topic)
  INSERT INTO public.mastery_levels (
    student_id, subject, topic, sub_topic, probability, attempts, last_updated
  ) VALUES (
    NEW.student_id,
    v_subject,
    NEW.topic,
    NEW.sub_topic,  -- may be NULL; unique index treats NULLs as distinct
    CASE WHEN NEW.correct THEN 0.7 ELSE 0.3 END,
    v_attempts_inc,
    now()
  )
  ON CONFLICT (student_id, subject, topic, sub_topic) DO UPDATE SET
    -- Simple BKT-ish smoothing: 70% old, 30% new outcome
    probability = LEAST(0.95, GREATEST(0.05,
      mastery_levels.probability * 0.7
      + (CASE WHEN NEW.correct THEN 1.0 ELSE 0.0 END) * v_correct_weight * 0.3
    )),
    attempts = mastery_levels.attempts + v_attempts_inc,
    last_updated = now();

  RETURN NEW;
END;
$$;

-- Step 2: trigger should already exist and continue pointing at the
-- function above. If the trigger itself was named differently or got
-- dropped, re-create it:

DROP TRIGGER IF EXISTS update_mastery_on_attempt_trigger ON public.question_attempts;
CREATE TRIGGER update_mastery_on_attempt_trigger
AFTER INSERT ON public.question_attempts
FOR EACH ROW
EXECUTE FUNCTION public.update_mastery_on_attempt();

COMMIT;
```

### Critical edits before applying

1. Replace `update_mastery_on_attempt` with the **actual function name** identified in Step 1.
2. Replace `update_mastery_on_attempt_trigger` with the **actual trigger name** from Step 1.
3. Compare the **body** of the existing function against the body above. If the existing function does extra work (e.g. updates `quest_pedagogy_badges`, writes to a snapshot table) preserve that logic. The fix is **only**: replace `NEW.subject` with `v_subject` derived from the join.
4. If the existing function has a different smoothing formula or BKT update logic that you don't want to change, **only change the subject derivation** — leave the rest alone. The above SQL is illustrative; do not blindly overwrite working logic.

### Apply via Supabase MCP `apply_migration`

Per project memory: prefer `apply_migration` over `execute_sql` for tracked schema changes. Run from Claude Code with the supabase MCP tool:

```
apply_migration(
  project_id: "rlmqsbxevuutugtyysjr",
  name: "014_fix_question_attempts_trigger",
  query: "<paste the corrected SQL above>"
)
```

---

## Verification (run in this exact order)

### 1. Trigger function fixed

```sql
SELECT pg_get_functiondef('public.update_mastery_on_attempt'::regproc);
-- Replace with the actual function name. Confirm body now contains
-- `SELECT subject INTO v_subject FROM public.quiz_attempts` and does NOT
-- contain any reference to `NEW.subject`.
```

### 2. Live insert works

In your browser, log in as a real student and complete a 3-question quiz on `quiz.html`. Open DevTools Network tab beforehand.

- The `POST /rest/v1/question_attempts` request should return **201 Created**.
- Console should be free of the `42703` error.

### 3. Rows land in `question_attempts`

Immediately after the quiz, in Supabase SQL Editor:

```sql
SELECT id, student_id, topic, sub_topic, correct, marks_earned, marks_total, created_at
FROM public.question_attempts
WHERE created_at > now() - interval '5 minutes'
ORDER BY created_at DESC;
```

You should see one row per question in the quiz you just took. Verify:

- `student_id` is populated
- `topic` matches the quiz topic
- `sub_topic` is populated (or `NULL` if the question doesn't carry one yet — Topic Naming handoff fixes that)
- `marks_earned` and `marks_total` are populated correctly
- `correct` is `true`/`false` matching what you actually answered

### 4. `mastery_levels` updated

```sql
SELECT student_id, subject, topic, sub_topic, probability, attempts, last_updated
FROM public.mastery_levels
WHERE student_id = '<your test student_id>'
  AND last_updated > now() - interval '5 minutes';
```

Confirm one row per `(topic, sub_topic)` from the quiz. `probability` should reflect the outcome (~0.3 if you got everything wrong, ~0.7 if everything right, somewhere between for mixed).

### 5. Integrity audit — confirm the gap closes from this point forward

```sql
SELECT
  date_trunc('day', created_at)::date AS day,
  count(*) AS attempts
FROM public.question_attempts
WHERE created_at > '2026-04-15'
GROUP BY day
ORDER BY day DESC
LIMIT 30;
```

You should see:
- A cluster of rows on/before 2026-04-22.
- A complete gap from 2026-04-22 to today (the bug window).
- A fresh row on today's date corresponding to your test quiz in step 3.

The historical gap will not be backfilled — those quizzes are lost. Document this gap in `docs/INCIDENTS.md` with the dates, root cause, and fix migration number, so when Backfill handoff later enriches `question_bank`, no one mistakes the gap for missing enrichment.

---

## Document the incident

Create `docs/INCIDENTS.md` if it doesn't exist, append:

```markdown
## 2026-04-22 → fix date — `question_attempts` insert blackout

**Root cause:** Migration 013 (or earlier) added a trigger on
`question_attempts` whose function referenced `NEW.subject`, a column that
doesn't exist on that table. Every INSERT failed with Postgres error 42703.
Frontend `quiz.js` swallowed the error in a try/catch, so quizzes appeared
to complete normally but no rows landed in `question_attempts` or
`mastery_levels`.

**Impact:** Zero question attempts persisted from 2026-04-22 04:37 UTC to
the fix date. BKT mastery did not update for any student during this
window. `daily_usage` continued to increment because that path is separate.

**Fix:** Migration 014 replaces the trigger function. Subject is now
derived from `quiz_attempts.subject` via FK join on `quiz_attempt_id`.

**Lessons:** Add a CI check that any trigger on `question_attempts`
references only columns that exist on the table. Surface trigger errors
in `quiz.js` instead of silently swallowing them — at minimum, log to
Sentry / console.error with a distinctive prefix so the next regression
is visible within hours, not weeks.
```

---

## Out of scope (do NOT do this in this commit)

- Do not modify `quiz.js`. It is correct. The Topic Naming handoff will touch it later for canonical sub_topic strings, but not as part of this fix.
- Do not backfill historical attempts. The Backfill handoff covers `question_bank` enrichment, not lost user data — that data is gone.
- Do not "improve" the BKT smoothing formula in this commit. Fix the bug, ship it, do BKT improvements separately.
- Do not touch any other migration. Add 014 as a new file; do not edit 013.

---

## Commit message

```
fix(db): repair question_attempts trigger broken since 2026-04-22

Trigger function referenced NEW.subject, a column that doesn't exist on
question_attempts. Subject must be derived from the parent quiz_attempts
row via quiz_attempt_id FK.

Live error since Apr 22:
  POST /rest/v1/question_attempts → 400
  { code: "42703", message: "record \"new\" has no field \"subject\"" }

Migration 014 replaces the trigger function with a corrected version
that joins quiz_attempts to derive subject before upserting into
mastery_levels.

Verified: post-fix INSERT returns 201; mastery_levels rows update.
Historical gap (Apr 22 → fix date) is unrecoverable; documented in
docs/INCIDENTS.md.

Unblocks: Week 2 Backend, Week 2 Frontend, Topic Naming handoffs.
```