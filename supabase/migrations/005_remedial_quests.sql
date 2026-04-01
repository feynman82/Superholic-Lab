-- ============================================================
-- 005_remedial_quests.sql
-- Smart Remedial Quests — stores LLM-generated 3-step revision plans.
-- Each row = one active/completed quest for a specific student + topic.
-- ============================================================

CREATE TABLE remedial_quests (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject             text        NOT NULL,
  level               text        NOT NULL,
  topic               text        NOT NULL,
  trigger_score       numeric     NOT NULL,         -- raw score % (0–100) that triggered this quest
  trigger_attempt_id  uuid        REFERENCES quiz_attempts(id) ON DELETE SET NULL,
  quest_title         text        NOT NULL,
  steps               jsonb       NOT NULL,         -- array of 3 step objects (see handleGenerateQuest)
  current_step        integer     NOT NULL DEFAULT 0,  -- 0-indexed; 0 = Day 1 active
  status              text        NOT NULL DEFAULT 'active'
                                  CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Fast lookup: active quest per student (most common query on progress.html load)
CREATE INDEX idx_remedial_quests_student_active
  ON remedial_quests (student_id, status, created_at DESC);

-- Auto-update updated_at on any row mutation
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER remedial_quests_updated_at
  BEFORE UPDATE ON remedial_quests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Row Level Security
-- Parents can SELECT, INSERT, UPDATE, DELETE only for their
-- own children's quests (via the students → parent_id chain).
-- ============================================================
ALTER TABLE remedial_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parents_own_student_quests"
  ON remedial_quests
  FOR ALL
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- TEST: After applying, run:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- Confirm remedial_quests shows rowsecurity = true.
