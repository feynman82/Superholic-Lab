-- ============================================================
-- 026_fix_question_attempts_trigger.sql
-- Repair the trigger chain that has blocked question_attempts INSERTs
-- since 2026-04-22 04:37 UTC.
--
-- TWO broken trigger functions were found during the diagnostic probe;
-- both reference columns that don't exist on the relations they touch.
-- A working INSERT requires fixing BOTH:
--
--   1. update_bkt_mastery()  on question_attempts (AFTER INSERT)
--      — Referenced NEW.subject. question_attempts has no subject
--        column; subject lives on the parent quiz_attempts row.
--
--   2. set_mastery_levels_updated_at()  on mastery_levels (BEFORE UPDATE)
--      — Referenced NEW.updated_at. mastery_levels uses last_updated.
--        Surfaced only after fix #1 let inserts reach the cascade.
--
-- Fix scope: ONLY the column references. The BKT formula, slip/guess/
-- transition rates, success heuristic, and timestamp semantics are
-- preserved verbatim. BKT improvements are out of scope per
-- WEEK2_diagnostic_handoff.md.
--
-- Trigger names are unchanged (trigger_update_bkt and
-- mastery_levels_updated_at) — only the function bodies are replaced.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.update_bkt_mastery()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  slip_rate NUMERIC := 0.10;       -- 10% chance a student knows it but makes a careless mistake
  guess_rate NUMERIC := 0.20;      -- 20% chance a student guesses correctly (MCQ baseline)
  transition_rate NUMERIC := 0.10; -- 10% chance of learning the skill during the attempt
  prior_prob NUMERIC;
  posterior_prob NUMERIC;
  new_prob NUMERIC;
  is_success BOOLEAN;
  v_subject TEXT;                  -- derived from parent quiz_attempts row
BEGIN
  -- Only track if topic is defined
  IF NEW.topic IS NULL THEN RETURN NEW; END IF;

  -- Subject lives on quiz_attempts, not question_attempts. Derive it via
  -- the FK so the INSERT into mastery_levels has a non-null value.
  -- If the parent row is missing (orphan attempt) fall back to 'Mixed'
  -- to match the original COALESCE behaviour.
  IF NEW.quiz_attempt_id IS NOT NULL THEN
    SELECT subject INTO v_subject
    FROM public.quiz_attempts
    WHERE id = NEW.quiz_attempt_id;
  END IF;
  v_subject := COALESCE(v_subject, 'Mixed');

  -- Determine success (handles partial marks if available, otherwise falls back to boolean)
  IF NEW.marks_total IS NOT NULL AND NEW.marks_total > 0 THEN
     is_success := (NEW.marks_earned / NEW.marks_total) >= 0.5;
  ELSE
     is_success := NEW.correct;
  END IF;

  -- Fetch current mastery or initialize at 0.1 (10%)
  SELECT probability INTO prior_prob FROM mastery_levels
  WHERE student_id = NEW.student_id AND topic = NEW.topic AND sub_topic = COALESCE(NEW.sub_topic, 'general');

  IF NOT FOUND THEN
     prior_prob := 0.1;
     INSERT INTO mastery_levels (student_id, subject, topic, sub_topic, probability, attempts)
     VALUES (NEW.student_id, v_subject, NEW.topic, COALESCE(NEW.sub_topic, 'general'), prior_prob, 0);
  END IF;

  -- 🚀 The Core BKT Formula (Bayes' Theorem)
  IF is_success THEN
     posterior_prob := (prior_prob * (1 - slip_rate)) / ((prior_prob * (1 - slip_rate)) + ((1 - prior_prob) * guess_rate));
  ELSE
     posterior_prob := (prior_prob * slip_rate) / ((prior_prob * slip_rate) + ((1 - prior_prob) * (1 - guess_rate)));
  END IF;

  -- Apply learning transition rate
  new_prob := posterior_prob + (1 - posterior_prob) * transition_rate;

  -- Save back to the table
  UPDATE mastery_levels
  SET probability = ROUND(new_prob, 3),
      attempts = attempts + 1,
      last_updated = NOW()
  WHERE student_id = NEW.student_id AND topic = NEW.topic AND sub_topic = COALESCE(NEW.sub_topic, 'general');

  RETURN NEW;
END;
$function$;


-- ─── 2. Repair set_mastery_levels_updated_at() on mastery_levels ────
--
-- mastery_levels has `last_updated` (per supabase/015_mastery_levels.sql),
-- not `updated_at`. The original BEFORE UPDATE trigger function set
-- NEW.updated_at, which raised 42703 the moment update_bkt_mastery()
-- tried to UPDATE the row. With fix #1 alone the trigger chain still
-- failed; both fixes are required.

CREATE OR REPLACE FUNCTION public.set_mastery_levels_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$function$;

COMMIT;

-- ─── Verification (run manually after apply) ────────────────
-- 1. Function no longer mentions NEW.subject:
--    SELECT pg_get_functiondef('public.update_bkt_mastery'::regproc);
--
-- 2. Live insert via quiz.html returns 201, not 42703.
--
-- 3. New rows land in question_attempts:
--    SELECT created_at, topic, sub_topic, correct
--      FROM question_attempts
--     WHERE created_at > now() - interval '5 minutes'
--     ORDER BY created_at DESC;
--
-- 4. mastery_levels updates:
--    SELECT subject, topic, sub_topic, probability, attempts, last_updated
--      FROM mastery_levels
--     WHERE last_updated > now() - interval '5 minutes';
