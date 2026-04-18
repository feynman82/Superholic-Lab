-- ============================================================
-- 009_subscriptions_unique.sql
-- Adds UNIQUE constraint on stripe_subscription_id.
-- Safe to run: cleans up NULLs and duplicates first.
-- ============================================================

-- Step 1: Remove rows with NULL profile_id (orphaned test rows)
DELETE FROM subscriptions WHERE profile_id IS NULL;

-- Step 2: Remove duplicate stripe_subscription_id rows,
-- keeping only the most recent one per ID
DELETE FROM subscriptions
WHERE id NOT IN (
  SELECT DISTINCT ON (stripe_subscription_id) id
  FROM subscriptions
  WHERE stripe_subscription_id IS NOT NULL
  ORDER BY stripe_subscription_id, created_at DESC
);

-- Step 3: Add UNIQUE constraint (safe now that duplicates are gone)
ALTER TABLE subscriptions
  ADD CONSTRAINT IF NOT EXISTS subscriptions_stripe_subscription_id_key
  UNIQUE (stripe_subscription_id);

-- Step 4: Add billing_cycle column so frontend can read monthly/annual
-- without needing access to server-side Stripe price IDs
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

-- Verify: should return 0 rows
SELECT stripe_subscription_id, COUNT(*)
FROM subscriptions
GROUP BY stripe_subscription_id
HAVING COUNT(*) > 1;
