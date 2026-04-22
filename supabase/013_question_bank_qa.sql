-- ============================================================
-- 013_question_bank_qa.sql
-- Adds QA workflow columns to question_bank:
--   is_ai_cloned  BOOLEAN  — true = needs human review (pending queue)
--                            false = approved and live for students
--   cognitive_skill TEXT   — PSLE taxonomy label for the question
-- Safe to run on live data (ADD COLUMN IF NOT EXISTS).
-- ============================================================

ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS is_ai_cloned   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cognitive_skill TEXT;

-- Fast index for QA queue queries (WHERE is_ai_cloned = true)
CREATE INDEX IF NOT EXISTS idx_qb_is_ai_cloned
  ON question_bank (is_ai_cloned);

-- Verify
SELECT
  'Migration 013 complete' AS result,
  COUNT(*) FILTER (WHERE is_ai_cloned = true)  AS pending_review,
  COUNT(*) FILTER (WHERE is_ai_cloned = false) AS approved
FROM question_bank;
