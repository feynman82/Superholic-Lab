-- ============================================================
-- 015_mastery_levels.sql
-- RETROACTIVE migration: tracks the existing mastery_levels table
-- in version control. Production already has this table; this
-- CREATE IF NOT EXISTS is a no-op there but ensures any new
-- environments (staging, preview branches) can recreate it.
--
-- Schema inferred from progress.js renderBKT() — verify against
-- Supabase dashboard production schema before applying anywhere
-- new. If production schema diverges from this, update this file
-- to match production EXACTLY before applying.
-- ============================================================

CREATE TABLE IF NOT EXISTS mastery_levels (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject      text        NOT NULL,
  topic        text        NOT NULL,
  sub_topic    text        DEFAULT 'general',
  probability  numeric     NOT NULL CHECK (probability >= 0 AND probability <= 1),
  attempts     int         NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  -- One row per (student, subject, topic, sub_topic) — composite uniqueness
  UNIQUE (student_id, subject, topic, sub_topic)
);

-- Lookup index: most common query is "all mastery for one student"
CREATE INDEX IF NOT EXISTS idx_mastery_levels_student
  ON mastery_levels (student_id, subject, probability DESC);

-- Enable RLS — parents see only their own children's data
ALTER TABLE mastery_levels ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if present (idempotent re-application)
DROP POLICY IF EXISTS "parents_own_student_mastery" ON mastery_levels;

CREATE POLICY "parents_own_student_mastery" ON mastery_levels
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

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION set_mastery_levels_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mastery_levels_updated_at ON mastery_levels;
CREATE TRIGGER mastery_levels_updated_at
  BEFORE UPDATE ON mastery_levels
  FOR EACH ROW EXECUTE FUNCTION set_mastery_levels_updated_at();

-- ============================================================
-- VERIFICATION QUERIES
-- After applying, run these to confirm production schema matches:
--
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'mastery_levels' ORDER BY ordinal_position;
--
--   SELECT indexname, indexdef FROM pg_indexes
--   WHERE tablename = 'mastery_levels';
--
--   SELECT polname, polcmd FROM pg_policy
--   WHERE polrelid = 'mastery_levels'::regclass;
-- ============================================================
