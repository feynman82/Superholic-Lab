-- ============================================================
-- 008_fix_profile_trigger.sql
-- Run this in Supabase SQL Editor if users are getting 406 errors
-- on the profiles table (symptom: dashboard stuck on loading spinner).
--
-- Root cause: handle_new_user() trigger was not active, so auth.users
-- rows exist without a corresponding public.profiles row.
--
-- This script:
--   1. Recreates the trigger function (idempotent)
--   2. Reattaches the trigger to auth.users
--   3. Backfills any auth.users that have no profiles row
-- ============================================================

-- 1. Recreate the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    subscription_tier,
    max_children,
    trial_started_at,
    trial_ends_at,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'parent',
    'trial',
    1,
    now(),
    now() + interval '7 days',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- 2. Reattach trigger to auth.users (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Backfill: create profile rows for any auth.users with no profiles row
--    Sets a 7-day trial from NOW() for all backfilled accounts.
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  subscription_tier,
  max_children,
  trial_started_at,
  trial_ends_at,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', '') AS full_name,
  'parent'  AS role,
  'trial'   AS subscription_tier,
  1         AS max_children,
  now()     AS trial_started_at,
  now() + interval '7 days' AS trial_ends_at,
  now()     AS created_at,
  now()     AS updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Verify: should return 0 rows if backfill worked
SELECT u.email, u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Verify trigger is attached:
-- SELECT trigger_name, event_object_table FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';
