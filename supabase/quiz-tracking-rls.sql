-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: quiz_attempts and question_attempts
-- Apply via Supabase SQL Editor (Dashboard → SQL Editor → Run)
-- ─────────────────────────────────────────────────────────────────────────────

-- Parents can insert quiz attempts for their own children
CREATE POLICY "Students can insert own attempts"
ON public.quiz_attempts FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM public.students
    WHERE parent_id = auth.uid()
  )
);

-- Parents can read quiz attempts for their own children
CREATE POLICY "Students can read own attempts"
ON public.quiz_attempts FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students
    WHERE parent_id = auth.uid()
  )
);

-- Parents can insert per-question attempt rows for their own children
CREATE POLICY "Students can insert question attempts"
ON public.question_attempts FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM public.students
    WHERE parent_id = auth.uid()
  )
);

-- Parents can read per-question attempt rows for their own children
CREATE POLICY "Students can read question attempts"
ON public.question_attempts FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students
    WHERE parent_id = auth.uid()
  )
);
