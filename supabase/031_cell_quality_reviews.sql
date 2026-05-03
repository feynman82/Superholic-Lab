-- ============================================================
-- 031_cell_quality_reviews.sql
-- Sprint 8d: founder cell-quality audit table.
--
-- Tracks per-cell review scores across 5 dimensions + free-form notes.
-- Used to identify the bottom quintile of cells for rewrite to v3.1.
-- Master-admin-only via RLS (mirrors pedagogy_events admin policy from
-- Sprint 4 — uses role='admin' label).
--
-- Apply via Supabase SQL Editor (NOT execute_sql MCP) — tracked schema
-- change. Idempotent: all DDL guarded with IF NOT EXISTS / DROP IF EXISTS.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cell_quality_reviews (
  id BIGSERIAL PRIMARY KEY,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ── Cell identity ─────────────────────────────────────────────
  -- Composite key matches wena-playbook.json index: subject|level|topic|sub_topic.
  subject   TEXT NOT NULL CHECK (subject IN ('English', 'Science', 'Mathematics')),
  level     TEXT NOT NULL CHECK (level ~ '^P[1-6]$'),
  topic     TEXT NOT NULL,
  sub_topic TEXT NOT NULL,

  -- ── Scoring dimensions (1-5 each) ────────────────────────────
  clarity_score              INT CHECK (clarity_score              BETWEEN 1 AND 5),
  age_appropriate_score      INT CHECK (age_appropriate_score      BETWEEN 1 AND 5),
  singapore_context_score    INT CHECK (singapore_context_score    BETWEEN 1 AND 5),
  worked_example_score       INT CHECK (worked_example_score       BETWEEN 1 AND 5),
  wrong_answer_realism_score INT CHECK (wrong_answer_realism_score BETWEEN 1 AND 5),

  -- Computed average (Postgres GENERATED ALWAYS — index-friendly).
  -- Null when any score is null (mid-review state).
  average_score NUMERIC GENERATED ALWAYS AS (
    (clarity_score + age_appropriate_score + singapore_context_score +
     worked_example_score + wrong_answer_realism_score) / 5.0
  ) STORED,

  -- ── Free-form ─────────────────────────────────────────────────
  notes                TEXT,
  flagged_for_rewrite  BOOLEAN DEFAULT FALSE,
  rewrite_priority     TEXT CHECK (rewrite_priority IN ('low', 'medium', 'high') OR rewrite_priority IS NULL),

  -- ── Sprint 8d Phase B tracking ───────────────────────────────
  -- Set when the founder rewrites a flagged cell and bumps playbook version.
  rewrite_completed_at TIMESTAMPTZ,
  rewritten_in_version TEXT  -- e.g., 'v3.1'
);

-- ── Indexes ───────────────────────────────────────────────────────
-- Unique composite — one review per (reviewer, cell). Upsert key.
CREATE UNIQUE INDEX IF NOT EXISTS idx_cell_quality_reviews_unique
  ON public.cell_quality_reviews (reviewer_id, subject, level, topic, sub_topic);

-- Bottom-quintile listing scans flagged rows ordered by avg_score.
CREATE INDEX IF NOT EXISTS idx_cell_quality_reviews_avg
  ON public.cell_quality_reviews (average_score) WHERE flagged_for_rewrite = TRUE;

-- Subject-level filtering (admin UI dropdown).
CREATE INDEX IF NOT EXISTS idx_cell_quality_reviews_subject
  ON public.cell_quality_reviews (subject, level, topic);

-- ── RLS ───────────────────────────────────────────────────────────
-- Master-admin-only — internal QA tooling. Service-role bypasses RLS for
-- handler-side writes (pattern from pedagogy_events Sprint 4).
ALTER TABLE public.cell_quality_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cell_quality_reviews_admin_all ON public.cell_quality_reviews;
CREATE POLICY cell_quality_reviews_admin_all ON public.cell_quality_reviews
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- Verification queries (run after apply; expect all true):
--
--   SELECT to_regclass('public.cell_quality_reviews') IS NOT NULL;
--   SELECT count(*) >= 3 FROM pg_indexes
--     WHERE schemaname='public' AND tablename='cell_quality_reviews';
--   SELECT count(*) >= 1 FROM pg_policies
--     WHERE schemaname='public' AND tablename='cell_quality_reviews';
--   SELECT relrowsecurity FROM pg_class WHERE relname='cell_quality_reviews';
--
-- Test the GENERATED column:
--   INSERT INTO cell_quality_reviews (
--     reviewer_id, subject, level, topic, sub_topic,
--     clarity_score, age_appropriate_score, singapore_context_score,
--     worked_example_score, wrong_answer_realism_score
--   ) VALUES (
--     auth.uid(), 'English', 'P3', 'Grammar', 'Subject-Verb Agreement',
--     5, 4, 5, 4, 3
--   );
--   SELECT average_score FROM cell_quality_reviews WHERE topic = 'Grammar';
--   -- expect 4.2
-- ============================================================
