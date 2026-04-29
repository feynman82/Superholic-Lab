-- ============================================================
-- 027_backfill_run_id.sql
-- Idempotency column for the question_bank enrichment backfill
-- (WEEK2_BACKFILL_HANDOFF). Every batch tags rows with its run id so
-- re-runs are no-ops on already-processed rows and rollbacks are
-- scoped to a single run.
--
-- Additive only — no breaking changes. Safe to apply at any time.
-- ============================================================

ALTER TABLE public.question_bank
  ADD COLUMN IF NOT EXISTS backfill_run_id text;

COMMENT ON COLUMN public.question_bank.backfill_run_id IS
  'Tags rows enriched by an OpenAI batch backfill run (e.g. ''backfill_2026_04_30''). NULL = never enriched. Used for idempotency and rollback scope.';

-- Partial index — only non-null run ids matter for lookups; saves
-- index churn on the ~99% of rows that were never touched by backfill.
CREATE INDEX IF NOT EXISTS idx_question_bank_backfill_run_id
  ON public.question_bank (backfill_run_id)
  WHERE backfill_run_id IS NOT NULL;

-- ─── Verification ──────────────────────────────────────────────────
-- 1. Column added:
--    SELECT column_name FROM information_schema.columns
--    WHERE table_name='question_bank' AND column_name='backfill_run_id';
--
-- 2. Index present:
--    SELECT indexname FROM pg_indexes
--    WHERE tablename='question_bank' AND indexname='idx_question_bank_backfill_run_id';
