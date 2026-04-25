-- ============================================================
-- 016_quest_gamification.sql
-- XP system, streaks, badges, avatar rerolls, mastery snapshots
--
-- All tables RLS-on; parents own child rows via students.parent_id
-- All FKs cascade-delete on student/parent removal
-- ============================================================

-- ─── 1. XP AGGREGATE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_xp (
  student_id     uuid        PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  total_xp       int         NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  current_level  int         NOT NULL DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 50),
  xp_in_level    int         NOT NULL DEFAULT 0 CHECK (xp_in_level >= 0),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE student_xp ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parents_own_student_xp" ON student_xp;
CREATE POLICY "parents_own_student_xp" ON student_xp
  FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));


-- ─── 2. XP EVENT LEDGER (append-only audit log) ─────────────
CREATE TABLE IF NOT EXISTS xp_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  event_type  text        NOT NULL CHECK (event_type IN (
    'quiz_complete', 'quest_step_complete', 'quest_complete',
    'exam_complete', 'mastery_gain', 'login_streak', 'badge_earned'
  )),
  xp_awarded  int         NOT NULL CHECK (xp_awarded >= 0),
  metadata    jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xp_events_student_time
  ON xp_events (student_id, created_at DESC);

ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parents_own_student_xp_events" ON xp_events;
CREATE POLICY "parents_own_student_xp_events" ON xp_events
  FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));


-- ─── 3. STREAKS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_streaks (
  student_id    uuid        PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  current_days  int         NOT NULL DEFAULT 0 CHECK (current_days >= 0),
  longest_days  int         NOT NULL DEFAULT 0 CHECK (longest_days >= 0),
  last_active   date,
  shield_count  int         NOT NULL DEFAULT 0 CHECK (shield_count >= 0 AND shield_count <= 3),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE student_streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parents_own_student_streaks" ON student_streaks;
CREATE POLICY "parents_own_student_streaks" ON student_streaks
  FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));


-- ─── 4. BADGE CATALOG ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS badge_definitions (
  id            text        PRIMARY KEY,
  name          text        NOT NULL,
  description   text        NOT NULL,
  icon_url      text        NOT NULL,
  theme         text        NOT NULL CHECK (theme IN ('space_marine', 'magic', 'hybrid')),
  rarity        text        NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  xp_reward     int         NOT NULL DEFAULT 0 CHECK (xp_reward >= 0),
  sort_order    int         NOT NULL DEFAULT 0,
  is_secret     boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Public read: anyone can browse the badge catalog
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_badges" ON badge_definitions;
CREATE POLICY "public_read_badges" ON badge_definitions
  FOR SELECT
  USING (true);


-- ─── 5. EARNED BADGES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_badges (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_id    text        NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  earned_at   timestamptz NOT NULL DEFAULT now(),
  context     jsonb       NOT NULL DEFAULT '{}',
  UNIQUE (student_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_student_badges_lookup
  ON student_badges (student_id, earned_at DESC);

ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parents_own_student_badges" ON student_badges;
CREATE POLICY "parents_own_student_badges" ON student_badges
  FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));


-- ─── 6. AVATAR REROLL AUDIT ─────────────────────────────────
-- Records every avatar generation attempt. Used for:
--   - Weekly cap enforcement (1/week per student)
--   - Monthly cost ceiling enforcement ($0.20/parent/month)
--   - Cost analytics + abuse detection
CREATE TABLE IF NOT EXISTS avatar_rerolls (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rerolled_at     timestamptz NOT NULL DEFAULT now(),
  trigger         text        NOT NULL CHECK (trigger IN (
    'manual', 'quest_milestone', 'initial_signup'
  )),
  old_avatar_url  text,
  cost_usd        numeric(6,4) NOT NULL DEFAULT 0.0500,
  cost_recovered  boolean     NOT NULL DEFAULT false  -- true if generation failed; excluded from monthly aggregation
);

CREATE INDEX IF NOT EXISTS idx_avatar_rerolls_student_recent
  ON avatar_rerolls (student_id, rerolled_at DESC);

CREATE INDEX IF NOT EXISTS idx_avatar_rerolls_parent_month
  ON avatar_rerolls (parent_id, rerolled_at DESC)
  WHERE cost_recovered = false;  -- partial index for fast monthly cost queries

ALTER TABLE avatar_rerolls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parents_own_avatar_rerolls" ON avatar_rerolls;
CREATE POLICY "parents_own_avatar_rerolls" ON avatar_rerolls
  FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());


-- ─── 7. MASTERY LEVELS SNAPSHOTS ────────────────────────────
-- Daily cron writes one snapshot row per (student, subject, topic, sub_topic).
-- Diff today vs yesterday → if al_band improved, award mastery_gain XP.
CREATE TABLE IF NOT EXISTS mastery_levels_snapshots (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  snapshot_date date        NOT NULL,
  subject       text        NOT NULL,
  topic         text        NOT NULL,
  sub_topic     text        DEFAULT 'general',
  probability   numeric     NOT NULL CHECK (probability >= 0 AND probability <= 1),
  al_band       int         NOT NULL CHECK (al_band BETWEEN 1 AND 8),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, snapshot_date, subject, topic, sub_topic)
);

CREATE INDEX IF NOT EXISTS idx_mastery_snapshots_student_date
  ON mastery_levels_snapshots (student_id, snapshot_date DESC);

ALTER TABLE mastery_levels_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parents_own_mastery_snapshots" ON mastery_levels_snapshots;
CREATE POLICY "parents_own_mastery_snapshots" ON mastery_levels_snapshots
  FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));


-- ─── 8. AUTO-INIT student_xp + student_streaks ON STUDENT INSERT ──
-- When a new student is created, automatically initialize their
-- gamification rows so we never have to handle "missing row" cases
-- in the application code.
CREATE OR REPLACE FUNCTION init_student_gamification()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO student_xp (student_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO student_streaks (student_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS students_init_gamification ON students;
CREATE TRIGGER students_init_gamification
  AFTER INSERT ON students
  FOR EACH ROW EXECUTE FUNCTION init_student_gamification();


-- ─── 9. BACKFILL existing students ──────────────────────────
-- Any existing students need their gamification rows initialized.
INSERT INTO student_xp (student_id)
  SELECT id FROM students
  ON CONFLICT (student_id) DO NOTHING;

INSERT INTO student_streaks (student_id)
  SELECT id FROM students
  ON CONFLICT (student_id) DO NOTHING;


-- ─── 10. UPDATE TIMESTAMP TRIGGERS ──────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at_xp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS student_xp_updated_at ON student_xp;
CREATE TRIGGER student_xp_updated_at BEFORE UPDATE ON student_xp
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_xp();

DROP TRIGGER IF EXISTS student_streaks_updated_at ON student_streaks;
CREATE TRIGGER student_streaks_updated_at BEFORE UPDATE ON student_streaks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_xp();


-- ============================================================
-- VERIFICATION
-- After applying:
--
-- -- 1. Confirm RLS enabled on every new table
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname='public'
--   AND tablename IN ('student_xp','xp_events','student_streaks',
--                     'badge_definitions','student_badges',
--                     'avatar_rerolls','mastery_levels_snapshots');
-- -- All should show rowsecurity = t
--
-- -- 2. Confirm existing students have xp + streak rows
-- SELECT COUNT(*) FROM students;
-- SELECT COUNT(*) FROM student_xp;
-- SELECT COUNT(*) FROM student_streaks;
-- -- All three should match
-- ============================================================
