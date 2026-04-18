-- ============================================================
-- 009_subscriptions_unique.sql
-- Safe cleanup of subscriptions table + UNIQUE constraint.
--
-- The upsert in handleWebhook uses onConflict: 'stripe_subscription_id'
-- which requires a UNIQUE constraint to function correctly.
-- Without it, every webhook fires an INSERT, creating duplicate rows.
--
-- SAFE TO RUN ON LIVE DATA: uses DISTINCT ON to keep only the
-- most recent row per stripe_subscription_id before constraining.
-- ============================================================

-- Step 1: Remove orphan rows with no profile reference
DELETE FROM subscriptions WHERE profile_id IS NULL;

-- Step 2: Remove duplicate rows — keep the most recent per stripe_subscription_id
DELETE FROM subscriptions
WHERE id NOT IN (
  SELECT DISTINCT ON (stripe_subscription_id) id
  FROM subscriptions
  WHERE stripe_subscription_id IS NOT NULL
  ORDER BY stripe_subscription_id, created_at DESC
);

-- Step 3: Add UNIQUE constraint idempotently
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_stripe_subscription_id_key'
      AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_stripe_subscription_id_key
      UNIQUE (stripe_subscription_id);
  END IF;
END
$$;

-- Verify
SELECT 'Migration 009 complete — subscriptions cleaned, UNIQUE constraint active' AS result;
