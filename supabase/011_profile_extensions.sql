-- ============================================================
-- 011_profile_extensions.sql
-- Notification preferences JSONB + subscription pause tracking.
-- All additions use IF NOT EXISTS — safe to re-run.
-- ============================================================

-- 1. Notification preferences stored as JSONB on profiles
--    Avoids a separate table; easily extended without migrations.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB
    NOT NULL DEFAULT '{
      "weekly_progress": true,
      "trial_expiry":    true,
      "new_features":    false,
      "study_tips":      false
    }'::jsonb;

-- 2. Pause scheduling columns
--    pause_scheduled: true when parent has requested end-of-period pause
--    pause_resume_at: the date Stripe should auto-resume billing
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pause_scheduled  BOOL        NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pause_resume_at  TIMESTAMPTZ;

-- 3. Pause audit columns on subscriptions table
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS paused_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resumes_at  TIMESTAMPTZ;

-- Verify new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('notification_preferences', 'pause_scheduled', 'pause_resume_at');

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name IN ('billing_cycle', 'paused_at', 'resumes_at');
