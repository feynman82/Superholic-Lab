-- ============================================================
-- 029_pedagogy_events.sql
-- Wena RAP telemetry table + RLS + indexes (Sprint 4)
--
-- Logs per-turn pedagogy decisions so we can answer:
--   1) Is the model echoing safety-rule words like "playbook" into output?
--   2) Cell-hit distribution: exact / fallback / miss?
--   3) Which level_raw strings fail to normalise?
--   4) Vision (Gemini) + RAP — does it produce coherent output?
--   5) DIRECT_TEACH faithfulness via teach_script_keyword_overlap (token Jaccard)
--   6) Mode transitions, including CHECK_RESPONSE
--
-- Apply via Supabase SQL Editor (NOT the execute_sql MCP — this is a tracked
-- schema change). Idempotent: all DDL guarded with IF NOT EXISTS / DROP IF EXISTS.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pedagogy_events (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ── Identity ───────────────────────────────────────────────
  -- student_id is FK so cleanup cascades on student deletion (PDPA).
  -- parent_id is denormalised for RLS perf; populated by handler from
  -- the joined students.parent_id at insert time. RLS on this table
  -- gates SELECT on parent_id rather than joining students every query.
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id UUID,

  -- ── Curriculum coordinates ─────────────────────────────────
  -- level_raw preserves whatever the request body sent ("Primary 4",
  -- "p4", "P4"); level_normalised is the canonical Pn form (or NULL
  -- when normalisation failed — useful for surfacing unexpected shapes).
  level_raw TEXT,
  level_normalised TEXT,
  subject TEXT,
  topic TEXT,
  sub_topic TEXT,

  -- ── RAP decision ───────────────────────────────────────────
  rap_enabled BOOLEAN NOT NULL,
  prompt_version TEXT,           -- e.g., 'wena-rap-1.0.0'; NULL when LEGACY
  mode TEXT,                     -- SOCRATIC | SOCRATIC_REPHRASE | DIRECT_TEACH | SCAFFOLD_DOWN | CHECK_RESPONSE | LEGACY
  previous_mode TEXT,            -- mode used in the previous turn (echoed by client)
  cell_hit_kind TEXT,            -- exact | fallback | miss | n/a
  stall_count INT NOT NULL DEFAULT 0,

  -- ── Vision path flag ──────────────────────────────────────
  has_image BOOLEAN NOT NULL DEFAULT FALSE,

  -- ── Output sanity (DIRECT_TEACH faithfulness check) ───────
  -- Token-Jaccard overlap of cell.foundational_teach_script vs the AI
  -- reply. Populated only for DIRECT_TEACH turns; NULL otherwise.
  -- Sprint 4 just logs; Sprint 5+ may add a threshold gate.
  teach_script_keyword_overlap NUMERIC,
  output_length_chars INT,

  -- ── Free-form metadata (avoids schema migration on debug needs) ────
  metadata JSONB,

  -- ── Conversation grouping ─────────────────────────────────
  -- conversation_id is generated client-side in tutor.js (one UUID per
  -- session boot). turn_index is 0-based within that conversation.
  conversation_id UUID,
  turn_index INT
);

-- ── Indexes (per Sprint 4 spec) ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pedagogy_events_student_time
  ON public.pedagogy_events (student_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedagogy_events_curriculum
  ON public.pedagogy_events (level_normalised, topic, sub_topic);
CREATE INDEX IF NOT EXISTS idx_pedagogy_events_mode
  ON public.pedagogy_events (mode, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedagogy_events_cell_hit
  ON public.pedagogy_events (cell_hit_kind, occurred_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────
-- Service role bypasses RLS implicitly (used by handlers.js inserts).
-- Parents see their own children's rows; admins see everything.
-- NOTE: this codebase uses role='admin' as the master-admin label
-- (see handlers.handleAdmin); spec said 'master_admin' — same role,
-- different label. Sub-admins are excluded from telemetry per spec
-- "master admin only".
ALTER TABLE public.pedagogy_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pedagogy_events_parent_read ON public.pedagogy_events;
CREATE POLICY pedagogy_events_parent_read ON public.pedagogy_events
  FOR SELECT
  USING (
    student_id IN (SELECT id FROM public.students WHERE parent_id = auth.uid())
  );

DROP POLICY IF EXISTS pedagogy_events_admin_all ON public.pedagogy_events;
CREATE POLICY pedagogy_events_admin_all ON public.pedagogy_events
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- Verification queries (run after apply; expect all true / non-empty):
--
--   SELECT to_regclass('public.pedagogy_events') IS NOT NULL;
--   SELECT count(*) = 4 FROM pg_indexes
--     WHERE schemaname='public' AND tablename='pedagogy_events';
--   SELECT count(*) >= 2 FROM pg_policies
--     WHERE schemaname='public' AND tablename='pedagogy_events';
--   SELECT relrowsecurity FROM pg_class WHERE relname='pedagogy_events';
-- ============================================================
