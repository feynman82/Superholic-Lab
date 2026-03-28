-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: Multi-type question bank + expanded question_attempts
-- Apply via Supabase SQL Editor (Dashboard → SQL Editor → Run)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── TABLE: questions ─────────────────────────────────────────────────────────
-- Stores every question (hardcoded, AI-cached, AI-live) in a unified table.
-- The full question JSON is stored in `data` (jsonb) to avoid schema changes
-- when new question type fields are added.

CREATE TABLE IF NOT EXISTS public.questions (
  id          text        PRIMARY KEY,
  type        text        NOT NULL CHECK (type IN ('mcq','short_ans','word_problem','open_ended','cloze','editing')),
  subject     text        NOT NULL,
  level       text        NOT NULL,
  topic       text        NOT NULL,
  sub_topic   text,
  difficulty  text        NOT NULL CHECK (difficulty IN ('foundation','standard','advanced','hots')),
  data        jsonb       NOT NULL,  -- full question JSON per each type's schema
  source      text        NOT NULL DEFAULT 'hardcoded'
                          CHECK (source IN ('hardcoded','ai_generated','ai_cached')),
  verified    boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Fast lookup by the most common query pattern
CREATE INDEX IF NOT EXISTS idx_questions_lookup
  ON public.questions (subject, level, type, topic, difficulty);

-- ── RLS for questions table ────────────────────────────────────────────────
-- Questions are read-only for all authenticated users; only service role writes.
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read questions"
ON public.questions FOR SELECT
TO authenticated
USING (true);

-- ── TABLE: question_attempts — new columns ───────────────────────────────────
-- These columns extend the existing table to support multi-type scoring.
-- IF NOT EXISTS guards allow safe re-runs.

ALTER TABLE public.question_attempts
  ADD COLUMN IF NOT EXISTS question_type  text,
  ADD COLUMN IF NOT EXISTS answer_text    text,        -- free-text answer (short_ans, open_ended)
  ADD COLUMN IF NOT EXISTS answer_parts   jsonb,       -- per-part answers for word_problem
  ADD COLUMN IF NOT EXISTS marks_earned   integer,
  ADD COLUMN IF NOT EXISTS marks_total    integer;
