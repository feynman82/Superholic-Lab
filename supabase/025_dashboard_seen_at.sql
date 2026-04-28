-- ════════════════════════════════════════════════════════════════════════
-- 025 — Dashboard last-seen-at marker
-- ════════════════════════════════════════════════════════════════════════
-- Phase 5 of the dashboard advanced-features plan: parents see a
-- celebration toast when ANY learner has unlocked a new badge or AL band
-- since the parent's last dashboard visit. The toast must appear once
-- per visit, not per session, so we track the visit timestamp on the
-- profile row.
--
-- DEFAULT now() backfills existing rows to "now at migration time" so
-- existing parents won't see a flood of historical unlocks on their
-- next dashboard load.
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dashboard_last_seen_at timestamptz DEFAULT now();

COMMENT ON COLUMN profiles.dashboard_last_seen_at IS
  'Bumped to now() each time the parent loads /pages/dashboard.html. Used by the celebration toast to find unlocks "new since last visit".';
