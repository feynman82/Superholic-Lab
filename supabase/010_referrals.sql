-- ============================================================
-- 010_referrals.sql
-- Adds referral code system.
-- Each profile gets a unique 8-char code.
-- Referrals table tracks referrer → referred status.
-- ============================================================

-- Add referral columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code           TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_credits_earned INT DEFAULT 0;

-- Generate unique codes for all existing profiles
UPDATE profiles
SET referral_code = UPPER(SUBSTRING(MD5(id::text || email) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Ensure codes are not null going forward (trigger handles new users)
-- The handle_new_user() trigger in 008 will need a manual patch for code generation;
-- new signups get codes auto-generated in the API handler on first referral fetch.

-- Referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code    TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',  -- pending | subscribed | credited
  stripe_coupon_id TEXT,
  referred_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscribed_at    TIMESTAMPTZ,
  credited_at      TIMESTAMPTZ,
  UNIQUE(referred_id)  -- one referral record per referred user (prevents double-dipping)
);

-- RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own referrals" ON referrals;
CREATE POLICY "Users see own referrals" ON referrals
  FOR SELECT
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_referred_id_idx ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS referrals_code_idx        ON referrals(referral_code);
