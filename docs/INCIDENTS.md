# Incidents Log

A record of production bugs whose root cause + fix is worth keeping alive
beyond the commit message. Append newest first. Each entry should answer:
**what broke, when, why, fix, lessons**.

---

## 2026-04-22 → 2026-04-29 — `question_attempts` insert blackout

**Root cause (chain of two triggers, both column-mismatched):**

1. **`update_bkt_mastery()`** — AFTER INSERT trigger on
   `question_attempts`. The function's INSERT into `mastery_levels`
   referenced `NEW.subject`, but `question_attempts` has no `subject`
   column (subject lives on the parent `quiz_attempts` row). Every INSERT
   raised `42703 record "new" has no field "subject"`.

2. **`set_mastery_levels_updated_at()`** — BEFORE UPDATE trigger on
   `mastery_levels`. The function set `NEW.updated_at`, but the column
   is named `last_updated` (per `supabase/015_mastery_levels.sql`). This
   trigger had been latent; the BKT trigger's pre-existing failure (#1)
   meant control never reached the UPDATE that would have surfaced it.

**Impact:** Zero question attempts persisted from **2026-04-22 04:37 UTC
to 2026-04-29 ~05:00 UTC** (~7 days). Frontend `quiz.js` swallowed the
400 in a try/catch so quizzes appeared to complete normally:

- `question_attempts` rows lost (~7 days of attempts across all students)
- `mastery_levels` BKT updates silently skipped during the window
- Progress page data stale for affected students
- `daily_usage` continued to increment (separate path), so trial-counter
  enforcement was unaffected

**Fix:** Migration `supabase/026_fix_question_attempts_trigger.sql`
replaces both function bodies. The BKT formula, slip/guess/transition
rates, and timestamp semantics are preserved verbatim — only the column
references were corrected:

- `update_bkt_mastery()` now derives `v_subject` from `quiz_attempts`
  via the `quiz_attempt_id` FK, with a `'Mixed'` fallback matching the
  original `COALESCE(NEW.subject, 'Mixed')` intent.
- `set_mastery_levels_updated_at()` now writes `NEW.last_updated`.

Verified via synthetic INSERT probe (insert quiz_attempts → INSERT
question_attempts → confirm trigger chain runs, mastery_levels row
appears, full cleanup) — trigger raised no errors after both fixes.

**Lessons:**

- Add a CI check that any trigger function references only columns that
  exist on the relations it touches. `pg_get_functiondef` parsing +
  schema introspection would have caught both bugs in seconds.
- `quiz.js` must surface trigger errors instead of silently swallowing
  them. At minimum: log to `console.error` with a distinctive prefix
  AND ping a server-side error endpoint so the next regression is
  visible within hours, not a week.
- The historical gap is **unrecoverable** — those quizzes are gone. No
  backfill available because the rows were never inserted.

**Unblocks:** Week 2 Backend, Week 2 Frontend, Topic Naming handoffs.
