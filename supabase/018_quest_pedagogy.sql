-- ============================================================
-- 018_quest_pedagogy.sql
-- Pedagogy fields on remedial_quests + concurrency enforcer
-- + ai_tutor_logs.quest_id + study_notes.quest_id
--
-- Applies to production cleanly: additive only, no breaking changes.
-- All DDL is idempotent (IF NOT EXISTS / IF EXISTS guards throughout).
-- ============================================================


-- ─── 1. New columns on remedial_quests ──────────────────────
--
-- day_completed_at: Map of step_index → ISO timestamp showing when each
--   day was finished. Used by the server to enforce the SGT-midnight gate:
--   step N+1 unlocks only when midnight SGT has passed since day_completed_at[N].
--   Example: {"0": "2026-04-26T14:30:00+08:00", "1": "2026-04-27T16:12:00+08:00"}
--
-- day1_wrong_attempts: Array of wrong-answer objects captured on Day 1 quiz
--   submission. Passed to Miss Wena on Day 2 so she can anchor Socratic
--   questions on the specific misconceptions this student showed.
--   Schema per element:
--   { question_id, question_text, student_answer, correct_answer, topic, sub_topic }
--
-- day3_score: Percentage score (0-100) from the Day 3 mastery quiz.
--   Drives three-way outcome branching:
--     >= 85  → mastered (auto-applied)
--     70-84  → slight_improvement (auto-applied)
--     < 70   → student chooses: redo / slight_improvement / no_improvement
--
-- day3_outcome: The final outcome recorded after Day 3 score branching.
--   Null until Day 3 is completed (or until student submits their choice
--   on the <70% path via the three-way exit modal).
--
-- parent_quest_id: Self-referencing FK for "redo" lineage. When a student
--   chooses "Try again" after a poor Day 3 score, a new quest is created
--   with parent_quest_id pointing to the original. Enables parent dashboard
--   visibility into repeated struggles on the same topic.
--
-- abandoned_at: Set (and indexed) when status transitions to 'abandoned'.
--   Preserved for analytics — gives time-of-abandonment for each quest.

ALTER TABLE remedial_quests
  ADD COLUMN IF NOT EXISTS day_completed_at    jsonb       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS day1_wrong_attempts jsonb       NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS day3_score          numeric(5,2),
  ADD COLUMN IF NOT EXISTS day3_outcome        text
    CHECK (day3_outcome IN ('mastered', 'slight_improvement', 'no_improvement', 'redo')
           OR day3_outcome IS NULL),
  ADD COLUMN IF NOT EXISTS parent_quest_id     uuid        REFERENCES remedial_quests(id),
  ADD COLUMN IF NOT EXISTS abandoned_at        timestamptz;

-- Partial index: only rows that are part of a redo lineage.
-- Supports parent-dashboard queries like "show all redo chains for this student".
CREATE INDEX IF NOT EXISTS idx_remedial_quests_parent_lineage
  ON remedial_quests (parent_quest_id)
  WHERE parent_quest_id IS NOT NULL;


-- ─── 2. quest_eligibility — concurrency enforcer ─────────────
--
-- This table is the single source of truth for "which quest is currently
-- active per (student, subject) slot." Its PRIMARY KEY (student_id, subject)
-- is the atomic concurrency guard: inserting a second row for the same pair
-- fails immediately with PG error 23505 (unique_violation), which the
-- handleGenerateQuest handler translates to HTTP 409 Conflict.
--
-- The ON DELETE CASCADE on quest_id means: if the quest row is hard-deleted
-- (rare, but possible in admin tooling), the eligibility slot is freed.
-- Normal slot transitions (complete / abandon / redo) DELETE this row
-- explicitly in application code, within the same transaction as the
-- remedial_quests status update.

CREATE TABLE IF NOT EXISTS quest_eligibility (
  student_id  uuid  NOT NULL REFERENCES students(id)        ON DELETE CASCADE,
  subject     text  NOT NULL CHECK (subject IN ('mathematics', 'science', 'english')),
  quest_id    uuid  NOT NULL REFERENCES remedial_quests(id) ON DELETE CASCADE,
  PRIMARY KEY (student_id, subject)
);

ALTER TABLE quest_eligibility ENABLE ROW LEVEL SECURITY;

-- Drop before create to make this idempotent (re-applying the migration
-- after a failed partial run won't error on the CREATE POLICY).
DROP POLICY IF EXISTS "parents_own_quest_eligibility" ON quest_eligibility;
CREATE POLICY "parents_own_quest_eligibility" ON quest_eligibility
  FOR ALL
  USING  (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));


-- ─── 3. Backfill: register existing active quests in eligibility ──
--
-- Best-effort registration of any pre-existing active quests.
-- ORDER BY created_at ASC means: if two quests for the same (student, subject)
-- somehow exist in production before this migration runs, the OLDER one wins
-- the eligibility slot (the younger insert is skipped by ON CONFLICT DO NOTHING).
-- This is intentional: the older quest was started first and has more progress.

INSERT INTO quest_eligibility (student_id, subject, quest_id)
SELECT student_id, subject, id
FROM   remedial_quests
WHERE  status = 'active'
ORDER  BY created_at ASC
ON CONFLICT (student_id, subject) DO NOTHING;


-- ─── 4. ai_tutor_logs.quest_id ──────────────────────────────
--
-- Links a tutor message log row to its quest (if the session was a Day 2
-- Socratic dialogue). The handleChat handler uses this to count how many
-- messages have been exchanged in this quest's tutor session, which gates
-- the "Mark Day 2 Complete" button (minimum 8 messages required).
--
-- The table itself was created manually in Supabase (not tracked in migrations).
-- The DO-block guards against failure if the table does not yet exist in a
-- fresh environment, making this migration safe to apply anywhere.

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE  table_schema = 'public'
    AND    table_name   = 'ai_tutor_logs'
  ) THEN
    ALTER TABLE ai_tutor_logs
      ADD COLUMN IF NOT EXISTS quest_id uuid REFERENCES remedial_quests(id) ON DELETE SET NULL;

    -- Partial index: only non-null quest_id rows. Avoids indexing the
    -- majority of tutor logs that are not part of a quest.
    IF NOT EXISTS (
      SELECT FROM pg_indexes
      WHERE  schemaname = 'public'
      AND    tablename  = 'ai_tutor_logs'
      AND    indexname  = 'idx_ai_tutor_logs_quest'
    ) THEN
      CREATE INDEX idx_ai_tutor_logs_quest
        ON ai_tutor_logs (quest_id)
        WHERE quest_id IS NOT NULL;
    END IF;
  END IF;
END;
$$;


-- ─── 5. study_notes.quest_id ─────────────────────────────────
--
-- Tags a study note as the auto-saved output of a Day 2 tutor session.
-- The handleSummarizeChat handler writes this when called by tutor.js
-- with the quest_id parameter on "Mark Day 2 Complete". The parent
-- dashboard can then surface "Day 2 study note for this quest" directly
-- in the quest detail view, without a full Backpack search.

ALTER TABLE study_notes
  ADD COLUMN IF NOT EXISTS quest_id uuid REFERENCES remedial_quests(id) ON DELETE SET NULL;


-- ============================================================
-- VERIFICATION QUERIES — run manually after applying via SQL Editor
-- ============================================================

-- 1. Confirm all 6 new columns exist on remedial_quests
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM   information_schema.columns
-- WHERE  table_schema = 'public'
-- AND    table_name   = 'remedial_quests'
-- AND    column_name  IN (
--   'day_completed_at', 'day1_wrong_attempts', 'day3_score',
--   'day3_outcome', 'parent_quest_id', 'abandoned_at'
-- )
-- ORDER  BY column_name;
-- -- Expected: 6 rows, matching data types above

-- 2. Confirm quest_eligibility table exists with RLS on
-- SELECT tablename, rowsecurity
-- FROM   pg_tables
-- WHERE  schemaname = 'public'
-- AND    tablename  = 'quest_eligibility';
-- -- Expected: 1 row, rowsecurity = t

-- 3. Confirm the policy was created
-- SELECT policyname, cmd, roles
-- FROM   pg_policies
-- WHERE  schemaname = 'public'
-- AND    tablename  = 'quest_eligibility';
-- -- Expected: 1 row — "parents_own_quest_eligibility", ALL

-- 4. Confirm backfill: eligibility count should match active quest count
-- SELECT COUNT(*) FROM remedial_quests  WHERE status = 'active';
-- SELECT COUNT(*) FROM quest_eligibility;
-- -- These should be equal (or eligibility ≤ quests if pre-existing duplicates existed)

-- 5. Confirm no student holds two slots for the same subject (should be 0)
-- SELECT student_id, subject, COUNT(*)
-- FROM   remedial_quests
-- WHERE  status = 'active'
-- GROUP  BY student_id, subject
-- HAVING COUNT(*) > 1;
-- -- Expected: 0 rows (the PRIMARY KEY going forward prevents this)

-- 6. Confirm ai_tutor_logs.quest_id added (only if table exists in your env)
-- SELECT column_name, data_type
-- FROM   information_schema.columns
-- WHERE  table_schema = 'public'
-- AND    table_name   = 'ai_tutor_logs'
-- AND    column_name  = 'quest_id';
-- -- Expected: 1 row

-- 7. Confirm study_notes.quest_id added
-- SELECT column_name, data_type
-- FROM   information_schema.columns
-- WHERE  table_schema = 'public'
-- AND    table_name   = 'study_notes'
-- AND    column_name  = 'quest_id';
-- -- Expected: 1 row
