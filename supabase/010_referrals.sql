-- ============================================================
-- 010_referrals.sql
-- Formal referral programme:
--   - referral_code (unique 8-char code) on each profile
--   - referral_credits_earned counter
--   - referrals table tracks pending → subscribed → credited status
--
-- Referral credit flow:
--   Parent A shares ?ref=CODE link → Parent B signs up →
--   When B subscribes with card → Stripe coupon applied to A's next invoice →
--   referrals.status = 'credited', profiles.referral_credits_earned++
--
-- UNIQUE(referred_id) prevents a referred user crediting multiple referrers.
-- ============================================================

-- Add referral columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code            TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_credits_earned  INT DEFAULT 0;

-- Auto-generate referral codes for all existing profiles
UPDATE profiles
SET referral_code = UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code    TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'subscribed', 'credited')),
  stripe_coupon_id TEXT,
  referred_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscribed_at    TIMESTAMPTZ,
  credited_at      TIMESTAMPTZ,
  -- One referral record per referred user — prevents abuse
  UNIQUE (referred_id)
);

-- Row Level Security
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can see referrals where they are referrer or referred
DROP POLICY IF EXISTS "Users see own referrals" ON referrals;
CREATE POLICY "Users see own referrals" ON referrals
  FOR SELECT USING (
    referrer_id = auth.uid() OR referred_id = auth.uid()
  );

-- Verify
SELECT 'Migration 010 complete — referral programme initialized' AS result;
