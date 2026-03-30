-- Migration: 003_exam_results.sql
-- Creates the exam_results table for tracking practice paper performance.
-- Extends quiz tracking to capture full timed exam attempts.
--
-- Run via: Supabase Dashboard → SQL Editor, or supabase db push
-- Requires: students table exists (from prior migrations)

-- ── Create exam_results table ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exam_results (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,

  -- Exam metadata
  subject          text    NOT NULL,                   -- 'Mathematics', 'Science', 'English'
  level            text    NOT NULL,                   -- 'Primary 4', 'Primary 6', etc.
  exam_type        text    NOT NULL DEFAULT 'PRACTICE', -- 'WA1','WA2','EOY','PRELIM','PRACTICE'
  exam_id          text,                               -- generated ID for this specific paper instance

  -- Results
  score            integer NOT NULL DEFAULT 0,         -- marks earned (auto-marked only)
  total_marks      integer NOT NULL DEFAULT 0,         -- total marks in this paper
  questions_attempted integer NOT NULL DEFAULT 0,      -- number of questions the student answered

  -- Timing
  time_taken       integer,                            -- seconds elapsed (null if untimed)

  -- Timestamps
  completed_at     timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Index for fast per-student queries ────────────────────────────────────────

CREATE INDEX IF NOT EXISTS exam_results_student_idx
  ON public.exam_results (student_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS exam_results_subject_idx
  ON public.exam_results (student_id, subject, completed_at DESC);

-- ── Row Level Security ─────────────────────────────────────────────────────────

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Parents can read their own children's exam results
CREATE POLICY "parents_read_own_exam_results"
  ON public.exam_results
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
  );

-- Service role can insert results (called from api/save-exam-result.js)
CREATE POLICY "service_insert_exam_results"
  ON public.exam_results
  FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
  );

-- Verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'exam_results';
-- Should return rowsecurity = true
