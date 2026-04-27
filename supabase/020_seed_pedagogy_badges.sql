-- ============================================================
-- 020_seed_pedagogy_badges.sql
-- 4 pedagogy badges that complete the Plan Quest IP signal.
--
-- These badges reward the behaviours that make Plan Quest
-- defensible as a learning intervention — not just completion,
-- but the quality of engagement (Socratic dialogue, honest
-- self-assessment, growth mindset on re-attempts).
--
-- Badge predicates are wired in lib/api/badge-engine.js.
-- Idempotent: ON CONFLICT (id) DO UPDATE.
-- ============================================================

INSERT INTO badge_definitions
  (id, name, description, icon_url, theme, rarity, xp_reward, sort_order, is_secret)
VALUES

('socratic_scholar',
 'Socratic Scholar',
 'Complete 5 Day 2 tutor sessions in Plan Quests. You learn by reasoning, not by being told.',
 '/assets/badges/socratic_scholar.svg',
 'magic', 'rare', 100, 50, false),

('mastery_first_try',
 'One-Shot Mastery',
 'Score ≥85% on Day 3 of your first ever Plan Quest. Rare. Real.',
 '/assets/badges/mastery_first_try.svg',
 'hybrid', 'epic', 200, 51, false),

('redo_warrior',
 'Redo Warrior',
 'Complete a redo quest after a previous attempt did not produce mastery. Growth mindset, certified.',
 '/assets/badges/redo_warrior.svg',
 'hybrid', 'epic', 300, 52, false),

('honest_compass',
 'Honest Compass',
 'Mark a Plan Quest as no_improvement. The platform values self-awareness as much as success — and so do we.',
 '/assets/badges/honest_compass.svg',
 'magic', 'rare', 50, 53, false)

ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_url    = EXCLUDED.icon_url,
  theme       = EXCLUDED.theme,
  rarity      = EXCLUDED.rarity,
  xp_reward   = EXCLUDED.xp_reward,
  sort_order  = EXCLUDED.sort_order,
  is_secret   = EXCLUDED.is_secret;


-- ── Verification query (run manually after applying) ─────────
--
-- SELECT id, name, rarity, xp_reward, sort_order
--   FROM badge_definitions
--  WHERE id IN ('socratic_scholar','mastery_first_try','redo_warrior','honest_compass')
--  ORDER BY sort_order;
--
-- Expected: 4 rows — sort_order 50, 51, 52, 53
