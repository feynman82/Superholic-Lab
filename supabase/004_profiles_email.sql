-- Migration 004: Add email to profiles + update handle_new_user trigger
-- Apply via: Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (IF NOT EXISTS / OR REPLACE guards throughout)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add email column to profiles (non-destructive)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

-- 2. Recreate handle_new_user trigger to also capture email + full_name
--    Fires on every INSERT into auth.users (signup or OAuth).
--    ON CONFLICT ensures safe re-runs if profile row already exists.
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
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Ensure the trigger is attached (re-create idempotently)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Backfill email for any existing profiles where it is still NULL
UPDATE public.profiles AS p
SET    email = u.email
FROM   auth.users AS u
WHERE  p.id = u.id
  AND  p.email IS NULL;

-- Verify:
-- SELECT id, email, full_name FROM public.profiles LIMIT 10;
-- Should show email populated for all rows.
