-- ============================================================
-- 019_reclassify_difficulty_heuristic.sql
-- Phase A of the difficulty re-calibration plan.
--
-- Background: question_bank.difficulty was over-tagged as 'HOTS' for
-- the bulk of English Synthesis (165 of 192 P6 rows = 86% HOTS).
-- The §8 rubric in Master_Question_Template.md targets:
--   Foundation 20% / Standard 50% / Advanced 20% / HOTS 10%.
--
-- This migration applies CONSERVATIVE rule-based demotions for cases
-- the rubric clearly identifies as mis-tagged. Ambiguous rows are
-- left untouched; Phase B (scripts/reclassify-difficulty.js) reviews
-- the remainder via Anthropic Haiku 4.5 with the §8 rubric.
--
-- Safety:
--   • Adds difficulty_pre_019 column to back up every row's prior value
--     so a single UPDATE can roll the migration back.
--   • Idempotent — re-running is a no-op (guards on every step).
--   • All UPDATEs in one transaction.
-- ============================================================


BEGIN;

-- ─── 1. Backup column ────────────────────────────────────────
-- Capture the pre-migration difficulty so Phase A is reversible.
-- Idempotent: ALTER ... ADD COLUMN IF NOT EXISTS, and the UPDATE
-- only runs once (when the column is freshly created).

ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS difficulty_pre_019 text;

UPDATE question_bank
   SET difficulty_pre_019 = difficulty
 WHERE difficulty_pre_019 IS NULL;


-- ─── 2. Normalise legacy / empty difficulty values ──────────
-- Pre-existing seed rows used 'medium', 'hard', or '' (empty).
-- The §8 rubric uses only Foundation / Standard / Advanced / HOTS.
-- Map all legacy values to Standard (the safe middle band).
-- Phase B will refine individual rows with the AI rubric.

UPDATE question_bank
   SET difficulty = 'Standard',
       updated_at = NOW()
 WHERE difficulty IN ('medium', 'hard', '')
    OR difficulty IS NULL;


-- ─── 3. English Synthesis demotions ─────────────────────────
-- §8.4 anchors: the connector named in `instructions` is the
-- single strongest signal of synthesis difficulty.
--
-- 3a. HOTS → Foundation (mechanical-connector patterns)
--     Single-step joins with no nominalisation. The instruction
--     line names a Foundation-tier connector verbatim.

UPDATE question_bank
   SET difficulty = 'Foundation',
       updated_at = NOW()
 WHERE subject     = 'English Language'
   AND topic       = 'Synthesis'
   AND difficulty  = 'HOTS'
   AND (
        instructions ILIKE '%''and''%'         OR
        instructions ILIKE '%''but''%'         OR
        instructions ILIKE '%''because''%'     OR
        instructions ILIKE '%''when''%'        OR
        instructions ILIKE '%''who''%'         OR
        instructions ILIKE '%''whose''%'       OR
        instructions ILIKE '%''although''%'    OR
        instructions ILIKE '%''even though''%' OR
        instructions ILIKE '%''respectively%'  OR
        instructions ILIKE '%''too %'          OR
        instructions ILIKE '%''while''%'
   );

-- 3b. HOTS → Standard (single transformations)
--     One step beyond a connector: gerund conversion, perfect
--     participle, reported speech with one tense shift, passive
--     voice transformation.

UPDATE question_bank
   SET difficulty = 'Standard',
       updated_at = NOW()
 WHERE subject     = 'English Language'
   AND topic       = 'Synthesis'
   AND difficulty  = 'HOTS'
   AND (
        instructions ILIKE '%''Despite%'   OR
        instructions ILIKE '%''In spite of%' OR
        instructions ILIKE '%''Having%'    OR
        instructions ILIKE '%''Upon%'      OR
        instructions ILIKE '%asked%if%'    OR
        instructions ILIKE '%told%that%'
   );

-- 3c. HOTS → Advanced (nominalisation + restructure)
--     Adjective-to-noun transformations with a clausal merge.
--     These are §8.4 Advanced markers, not HOTS.

UPDATE question_bank
   SET difficulty = 'Advanced',
       updated_at = NOW()
 WHERE subject     = 'English Language'
   AND topic       = 'Synthesis'
   AND difficulty  = 'HOTS'
   AND (
        instructions ILIKE '%''Out of%'        OR
        instructions ILIKE '%''Much to%'       OR
        instructions ILIKE '%''Such was%'      OR
        instructions ILIKE '%''Such is%'       OR
        instructions ILIKE '%''It was through%' OR
        instructions ILIKE '%''To my%'         OR
        instructions ILIKE '%''To Siti''%'     OR
        instructions ILIKE '%''Driven%'        OR
        instructions ILIKE '%''Full of%'       OR
        instructions ILIKE '%''Due to%'        OR
        instructions ILIKE '%''Owing to%'      OR
        instructions ILIKE '%''Through%'       OR
        instructions ILIKE '%''With great%'    OR
        instructions ILIKE '%''Regardless of%'
   );

-- Anything still flagged HOTS for English Synthesis after 3a–3c
-- should be the genuinely advanced patterns (subjunctive
-- conditional inversion, multi-clause inversion, emphatic cleft):
--   "Had it not been for", "It was X that", "Hardly had",
--   "No sooner had", "Not until", "Scarcely had", "Little did".
-- Those are correctly HOTS per §8.4 and must be left as-is.


-- ─── 4. Mathematics demotions ───────────────────────────────
-- §8.3 anti-default rule: "1-mark MCQs are rarely HOTS."
-- A 1-mark MCQ that requires AO3 reasoning is exceptional;
-- the bulk are over-tagged.

UPDATE question_bank
   SET difficulty = 'Standard',
       updated_at = NOW()
 WHERE subject     = 'Mathematics'
   AND difficulty  = 'HOTS'
   AND type        = 'mcq'
   AND marks       = 1;

-- §8.4 Maths: a single named heuristic = Standard at most.
-- Detect named heuristics in the worked_solution.

UPDATE question_bank
   SET difficulty = CASE
                      WHEN difficulty = 'HOTS' THEN 'Advanced'
                      ELSE difficulty
                    END,
       updated_at = NOW()
 WHERE subject     = 'Mathematics'
   AND difficulty  = 'HOTS'
   AND marks       <= 2
   AND (
        worked_solution ILIKE '%bar model%'   OR
        worked_solution ILIKE '%part-whole%'  OR
        worked_solution ILIKE '%before-after%' OR
        worked_solution ILIKE '%before and after%'
   );


-- ─── 5. Science demotions ───────────────────────────────────
-- §8.4 Science Foundation = literal recall (define, name).
-- §8.4 Science Standard   = identify + brief explain.
-- 1-mark MCQ Science questions tagged HOTS are almost always
-- single-concept identification → demote to Standard.

UPDATE question_bank
   SET difficulty = 'Standard',
       updated_at = NOW()
 WHERE subject     = 'Science'
   AND difficulty  = 'HOTS'
   AND type        = 'mcq'
   AND marks       = 1;


-- ─── 6. English Cloze / Editing demotions ───────────────────
-- §8.4 English non-Synthesis: 1-mark MCQs/cloze blanks are
-- never HOTS; multi-error trap or register-shift correction is
-- the genuine HOTS pattern, and those use higher-mark allocations.

UPDATE question_bank
   SET difficulty = 'Standard',
       updated_at = NOW()
 WHERE subject     = 'English Language'
   AND topic       IN ('Cloze', 'Editing', 'Grammar', 'Vocabulary')
   AND difficulty  = 'HOTS'
   AND marks       <= 2;


-- ─── 7. reclassify_review audit table ──────────────────────
-- Phase B (scripts/reclassify-difficulty.js) writes low-confidence
-- AI suggestions here for human spot-check before applying.
-- Service-role-only access; no RLS policy needed.

CREATE TABLE IF NOT EXISTS reclassify_review (
  question_id     uuid        PRIMARY KEY REFERENCES question_bank(id) ON DELETE CASCADE,
  current_band    text        NOT NULL,
  suggested_band  text        NOT NULL CHECK (suggested_band IN ('Foundation','Standard','Advanced','HOTS')),
  confidence      text        NOT NULL CHECK (confidence IN ('high','low')),
  reasoning       text,
  reviewed        boolean     NOT NULL DEFAULT false,
  reviewer_action text        CHECK (reviewer_action IN ('accepted','rejected','modified') OR reviewer_action IS NULL),
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  reviewed_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_reclassify_review_unreviewed
  ON reclassify_review (reviewed) WHERE reviewed = false;


COMMIT;


-- ─── VERIFICATION QUERIES (run manually after migration) ───
--
-- 1. Distribution by subject (target: F 20% / S 50% / A 20% / H 10%)
--
-- SELECT subject, difficulty, COUNT(*) AS n,
--        ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY subject), 1) AS pct
--   FROM question_bank
--  GROUP BY subject, difficulty
--  ORDER BY subject,
--           array_position(ARRAY['Foundation','Standard','Advanced','HOTS'], difficulty);
--
--
-- 2. Topics still skewed (>50% HOTS) — these are Phase B candidates
--
-- SELECT subject, level, topic,
--        SUM(CASE WHEN difficulty = 'HOTS' THEN 1 ELSE 0 END) AS hots_n,
--        COUNT(*) AS total_n,
--        ROUND(100.0 * SUM(CASE WHEN difficulty='HOTS' THEN 1 ELSE 0 END) / COUNT(*), 1) AS hots_pct
--   FROM question_bank
--  GROUP BY subject, level, topic
-- HAVING COUNT(*) > 10
--    AND 100.0 * SUM(CASE WHEN difficulty='HOTS' THEN 1 ELSE 0 END) / COUNT(*) > 50
--  ORDER BY hots_pct DESC;
--
--
-- 3. Rollback plan (if needed)
--
-- BEGIN;
-- UPDATE question_bank SET difficulty = difficulty_pre_019, updated_at = NOW()
--  WHERE difficulty_pre_019 IS NOT NULL AND difficulty <> difficulty_pre_019;
-- COMMIT;
