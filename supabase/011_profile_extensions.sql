-- ============================================================
-- 011_profile_extensions.sql
-- Extends profiles and subscriptions tables for:
--   - notification_preferences (JSONB, 4 toggles)
--   - pause_scheduled flag + pause_resume_at timestamp
--   - subscriptions.paused_at + subscriptions.resumes_at
--
-- Pause flow:
--   Parent schedules pause → pause_scheduled = true →
--   invoice.payment_succeeded webhook fires at period end →
--   Stripe pause_collection activated → subscription_tier = 'paused' →
--   Stripe auto-resumes at resumes_at → subscription_tier restored.
-- ============================================================

-- Notification preferences stored as JSONB (no new table needed)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "weekly_progress": true,
    "trial_expiry":    true,
    "new_features":    false,
    "study_tips":      false
  }'::jsonb;

-- Pause scheduling columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pause_scheduled  BOOL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pause_resume_at  TIMESTAMPTZ;

-- Pause tracking on subscriptions table
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS paused_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resumes_at  TIMESTAMPTZ;

-- Verify
SELECT 'Migration 011 complete — notification_preferences + pause columns added' AS result;
