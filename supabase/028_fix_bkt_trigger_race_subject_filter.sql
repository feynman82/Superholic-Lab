-- ============================================================
-- 028_fix_bkt_trigger_race_subject_filter.sql
-- Repair update_bkt_mastery() — eliminates the 23505 duplicate-key
-- error that surfaced when quiz.js bulk-inserts 10 question_attempts
-- rows at the end of a quiz session.
--
-- Two latent bugs in the prior version:
--
-- 1. SELECT-then-INSERT race
--    The function did a SELECT on (student_id, topic, sub_topic), then
--    "IF NOT FOUND" → INSERT. Within a single multi-row INSERT statement
--    on question_attempts, the AFTER ROW trigger fires per row and
--    each invocation independently checked-then-inserted. Under the
--    right interleaving (or just for the FIRST row, when no row exists
--    yet), the SELECT correctly missed and the INSERT proceeded — but
--    a SECOND trigger invocation could still see the prior row's
--    INSERT before it committed and proceed to its own INSERT,
--    violating the UNIQUE (student_id, subject, topic, sub_topic)
--    constraint with 23505.
--
-- 2. Cross-subject false matches
--    The SELECT and UPDATE filters omitted `subject`. If a row existed
--    for the same (student, topic, sub_topic) under a different
--    subject (e.g. legacy 'Mathematics' Title-Case vs new 'mathematics'
--    lowercase), the function thought the row existed and the UPDATE
--    silently mutated the WRONG-subject row.
--
-- Fix
-- ────
-- Atomic INSERT ... ON CONFLICT DO NOTHING (guaranteed row-existence,
-- race-safe), then read + update using the FULL unique key. No cross-
-- subject pollution. Same BKT formula preserved verbatim.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_bkt_mastery()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  slip_rate NUMERIC := 0.10;
  guess_rate NUMERIC := 0.20;
  transition_rate NUMERIC := 0.10;
  prior_prob NUMERIC;
  posterior_prob NUMERIC;
  new_prob NUMERIC;
  is_success BOOLEAN;
  v_subject TEXT;
  v_sub_topic TEXT;
BEGIN
  IF NEW.topic IS NULL THEN RETURN NEW; END IF;

  IF NEW.quiz_attempt_id IS NOT NULL THEN
    SELECT subject INTO v_subject
    FROM public.quiz_attempts
    WHERE id = NEW.quiz_attempt_id;
  END IF;
  v_subject := COALESCE(v_subject, 'Mixed');
  v_sub_topic := COALESCE(NEW.sub_topic, 'general');

  IF NEW.marks_total IS NOT NULL AND NEW.marks_total > 0 THEN
     is_success := (NEW.marks_earned / NEW.marks_total) >= 0.5;
  ELSE
     is_success := NEW.correct;
  END IF;

  INSERT INTO public.mastery_levels (student_id, subject, topic, sub_topic, probability, attempts, last_updated)
  VALUES (NEW.student_id, v_subject, NEW.topic, v_sub_topic, 0.1, 0, NOW())
  ON CONFLICT (student_id, subject, topic, sub_topic) DO NOTHING;

  SELECT probability INTO prior_prob
  FROM public.mastery_levels
  WHERE student_id = NEW.student_id
    AND subject    = v_subject
    AND topic      = NEW.topic
    AND sub_topic  = v_sub_topic;

  IF prior_prob IS NULL THEN
    RETURN NEW;
  END IF;

  IF is_success THEN
     posterior_prob := (prior_prob * (1 - slip_rate)) / ((prior_prob * (1 - slip_rate)) + ((1 - prior_prob) * guess_rate));
  ELSE
     posterior_prob := (prior_prob * slip_rate) / ((prior_prob * slip_rate) + ((1 - prior_prob) * (1 - guess_rate)));
  END IF;
  new_prob := posterior_prob + (1 - posterior_prob) * transition_rate;

  UPDATE public.mastery_levels
  SET probability  = ROUND(new_prob, 3),
      attempts     = attempts + 1,
      last_updated = NOW()
  WHERE student_id = NEW.student_id
    AND subject    = v_subject
    AND topic      = NEW.topic
    AND sub_topic  = v_sub_topic;

  RETURN NEW;
END;
$function$;
