-- ============================================================
-- 017_seed_badges.sql
-- Seeds the 25 launch badges into badge_definitions.
--
-- Theme palette (Halo Reach + Genshin Impact):
--   space_marine -- monochrome white-blue, military precision
--   magic        -- mint + rose gradients, glowing runes
--   hybrid       -- both styles fused
--
-- Rarity → visual treatment:
--   common    -- monochrome accent border
--   rare      -- mint glow border
--   epic      -- rose-gold animated border
--   legendary -- iridescent rainbow shimmer
--
-- Icon URLs use the format /assets/badges/<id>.svg.
-- The actual SVG files will be generated in Phase 5 (Day 4 — animations).
-- For now icon_url points to placeholder; rendering code falls back to
-- a default SVG if the file 404s.
-- ============================================================

INSERT INTO badge_definitions
  (id, name, description, icon_url, theme, rarity, xp_reward, sort_order, is_secret)
VALUES

-- ─── COMMON (11 badges, sort_order 1-11) ───────────────────
('first_quiz',
 'First Contact',
 'Complete your first quiz on Superholic Lab.',
 '/assets/badges/first_quiz.svg',
 'space_marine', 'common', 25, 1, false),

('first_subject',
 'Subject Pioneer',
 'Complete a quiz in any subject.',
 '/assets/badges/first_subject.svg',
 'space_marine', 'common', 25, 2, false),

('early_bird',
 'First Light',
 'Answer 5 questions before 7am.',
 '/assets/badges/early_bird.svg',
 'magic', 'common', 50, 3, false),

('night_owl',
 'Stealth Mode',
 'Answer 5 questions after 9pm.',
 '/assets/badges/night_owl.svg',
 'space_marine', 'common', 50, 4, false),

('streak_3',
 'Steady Hand',
 'Maintain a 3-day learning streak.',
 '/assets/badges/streak_3.svg',
 'hybrid', 'common', 50, 5, false),

('note_taker',
 'Codex Architect',
 'Save 5 study notes from Miss Wena.',
 '/assets/badges/note_taker.svg',
 'magic', 'common', 50, 6, false),

('helper_10',
 'Apprentice Pact',
 'Exchange 10 messages with Miss Wena.',
 '/assets/badges/helper_10.svg',
 'magic', 'common', 50, 7, false),

('quiz_5',
 'Five Strong',
 'Complete 5 quizzes.',
 '/assets/badges/quiz_5.svg',
 'space_marine', 'common', 75, 8, false),

('tutor_session',
 'Mind Link',
 'Complete a full tutor session with Miss Wena.',
 '/assets/badges/tutor_session.svg',
 'magic', 'common', 75, 9, false),

('weakness_spotter',
 'Recon Specialist',
 'View your BKT weakness analysis for the first time.',
 '/assets/badges/weakness_spotter.svg',
 'space_marine', 'common', 50, 10, false),

('set_avatar',
 'Identity Forged',
 'Set your first stylized avatar.',
 '/assets/badges/set_avatar.svg',
 'hybrid', 'common', 75, 11, false),

-- ─── RARE (8 badges, sort_order 12-19) ─────────────────────
('first_quest',
 'First Mission',
 'Complete your first 3-day Plan Quest.',
 '/assets/badges/first_quest.svg',
 'hybrid', 'rare', 150, 12, false),

('quest_3',
 'Mission Streak',
 'Complete 3 Plan Quests.',
 '/assets/badges/quest_3.svg',
 'hybrid', 'rare', 200, 13, false),

('streak_7',
 'Constellation',
 'Maintain a 7-day learning streak.',
 '/assets/badges/streak_7.svg',
 'magic', 'rare', 100, 14, false),

('perfect_quiz',
 'Flawless Run',
 'Score 100% on any quiz.',
 '/assets/badges/perfect_quiz.svg',
 'hybrid', 'rare', 100, 15, false),

('subject_explorer',
 'Tri-Star',
 'Complete quizzes in all 3 subjects (Math, Science, English).',
 '/assets/badges/subject_explorer.svg',
 'space_marine', 'rare', 100, 16, false),

('level_10',
 'Cadet Stripe',
 'Reach Level 10.',
 '/assets/badges/level_10.svg',
 'space_marine', 'rare', 100, 17, false),

('helper_50',
 'Wisdom Keeper',
 'Exchange 50 messages with Miss Wena.',
 '/assets/badges/helper_50.svg',
 'magic', 'rare', 75, 18, false),

('weakness_crusher',
 'Bug Hunter',
 'Improve any topic by 2 AL bands (e.g. AL5 → AL3).',
 '/assets/badges/weakness_crusher.svg',
 'hybrid', 'rare', 150, 19, false),

-- ─── EPIC (5 badges, sort_order 20-24) ─────────────────────
('streak_30',
 'Galactic Compass',
 'Maintain a 30-day learning streak.',
 '/assets/badges/streak_30.svg',
 'magic', 'epic', 500, 20, false),

('al1_master',
 'Apex Operator',
 'Reach AL1 mastery in any subject.',
 '/assets/badges/al1_master.svg',
 'space_marine', 'epic', 300, 21, false),

('perfect_exam',
 'Pristine Mind',
 'Score 100% on a WA, EOY, or PSLE exam paper.',
 '/assets/badges/perfect_exam.svg',
 'hybrid', 'epic', 250, 22, false),

('quest_10',
 'Veteran Operator',
 'Complete 10 Plan Quests.',
 '/assets/badges/quest_10.svg',
 'hybrid', 'epic', 300, 23, false),

('level_25',
 'Lieutenant',
 'Reach Level 25.',
 '/assets/badges/level_25.svg',
 'space_marine', 'epic', 250, 24, false),

-- ─── LEGENDARY (1 badge, sort_order 25) ────────────────────
('level_50',
 'Commander',
 'Reach Level 50, the highest rank in Superholic Lab.',
 '/assets/badges/level_50.svg',
 'space_marine', 'legendary', 1000, 25, false)

ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_url    = EXCLUDED.icon_url,
  theme       = EXCLUDED.theme,
  rarity      = EXCLUDED.rarity,
  xp_reward   = EXCLUDED.xp_reward,
  sort_order  = EXCLUDED.sort_order,
  is_secret   = EXCLUDED.is_secret;

-- ─── SECRET BADGES (4 — hidden from catalog until earned) ──
INSERT INTO badge_definitions
  (id, name, description, icon_url, theme, rarity, xp_reward, sort_order, is_secret)
VALUES

('secret_alchemist',
 'Alchemist',
 'Score 100% on a HOTS-difficulty quiz.',
 '/assets/badges/secret_alchemist.svg',
 'magic', 'epic', 300, 100, true),

('secret_oracle',
 'Oracle',
 'Predict your next BKT mastery within 5% accuracy.',
 '/assets/badges/secret_oracle.svg',
 'magic', 'legendary', 500, 101, true),

('secret_warden',
 'Vault Warden',
 'Read 25 of Miss Wena''s study notes.',
 '/assets/badges/secret_warden.svg',
 'magic', 'rare', 150, 102, true),

('secret_phoenix',
 'Phoenix',
 'Recover from a broken streak by reaching 7 days again.',
 '/assets/badges/secret_phoenix.svg',
 'hybrid', 'epic', 250, 103, true)

ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_url    = EXCLUDED.icon_url,
  theme       = EXCLUDED.theme,
  rarity      = EXCLUDED.rarity,
  xp_reward   = EXCLUDED.xp_reward,
  sort_order  = EXCLUDED.sort_order,
  is_secret   = EXCLUDED.is_secret;


-- ============================================================
-- VERIFICATION
-- After applying, confirm:
--
--   SELECT COUNT(*) FROM badge_definitions;
--   -- Should be 29 (25 visible + 4 secret)
--
--   SELECT rarity, COUNT(*) FROM badge_definitions
--   WHERE is_secret = false GROUP BY rarity;
--   -- common: 11, rare: 8, epic: 5, legendary: 1
--
--   SELECT SUM(xp_reward) FROM badge_definitions WHERE is_secret = false;
--   -- ≈5,200 XP total across all visible badges
-- ============================================================
