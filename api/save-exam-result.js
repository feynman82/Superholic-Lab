/**
 * api/save-exam-result.js
 * Persists a completed exam paper result to the exam_results Supabase table.
 * Uses the service role key server-side to insert securely.
 * The student_id is resolved server-side from auth.uid() — never trusted from client.
 *
 * POST /api/save-exam-result
 * Headers: Authorization: Bearer <supabase-session-token>
 * Body:
 *   { subject, level, examType, score, totalMarks, timeTaken,
 *     questionsAttempted, examId }
 * Returns:
 *   { success: true, id } | { error: string }
 *
 * TEST: POST with valid session token and { subject:"Mathematics", level:"Primary 6",
 *       examType:"WA1", score:14, totalMarks:20, timeTaken:1200 }
 *       → response.success === true, exam_results row created in Supabase
 */

'use strict';

// ── Supabase admin client (service role — server only) ─────────────────────
function getAdminClient() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Get user from auth token ───────────────────────────────────────────────
async function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  const { createClient } = require('@supabase/supabase-js');
  const anonClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );

  const { data: { user }, error } = await anonClient.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// ── Resolve student_id for this user ──────────────────────────────────────
async function resolveStudentId(adminDb, userId) {
  // Prefer first active student; fall back to any student linked to parent
  const { data, error } = await adminDb
    .from('students')
    .select('id')
    .eq('parent_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    // No student row yet — use the user's own ID as a fallback (self-learner flow)
    return userId;
  }
  return data.id;
}

// ── Input sanitiser ────────────────────────────────────────────────────────
function sanitise(value, fallback) {
  return (value === undefined || value === null) ? fallback : value;
}

// ── Handler ────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorised — please log in' });
    }

    // Validate payload
    const {
      subject, level, examType, score, totalMarks,
      timeTaken, questionsAttempted, examId,
    } = req.body;

    if (!subject || !level || !examType) {
      return res.status(400).json({ error: 'Missing required fields: subject, level, examType' });
    }

    const validSubjects  = ['Mathematics', 'Science', 'English'];
    const validExamTypes = ['WA1', 'WA2', 'EOY', 'PRELIM', 'PRACTICE'];

    if (!validSubjects.includes(subject))    return res.status(400).json({ error: 'Invalid subject' });
    if (!validExamTypes.includes(examType))  return res.status(400).json({ error: 'Invalid examType' });

    const safeScore         = Math.max(0, parseInt(sanitise(score, 0), 10));
    const safeTotalMarks    = Math.max(1, parseInt(sanitise(totalMarks, 1), 10));
    const safeTimeTaken     = timeTaken ? Math.max(0, parseInt(timeTaken, 10)) : null;
    const safeQAttempted    = Math.max(0, parseInt(sanitise(questionsAttempted, 0), 10));
    const safeExamId        = typeof examId === 'string' ? examId.slice(0, 64) : null;

    // Cap score at total to prevent impossible values
    const cappedScore = Math.min(safeScore, safeTotalMarks);

    // Resolve student
    const adminDb     = getAdminClient();
    const studentId   = await resolveStudentId(adminDb, user.id);

    // Insert
    const { data, error } = await adminDb
      .from('exam_results')
      .insert({
        student_id:           studentId,
        subject,
        level,
        exam_type:            examType,
        exam_id:              safeExamId,
        score:                cappedScore,
        total_marks:          safeTotalMarks,
        time_taken:           safeTimeTaken,
        questions_attempted:  safeQAttempted,
        completed_at:         new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[save-exam-result] Supabase insert error:', error.message);
      return res.status(500).json({ error: 'Failed to save result. Please try again.' });
    }

    return res.status(200).json({ success: true, id: data.id });

  } catch (err) {
    console.error('[save-exam-result] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// TEST: With valid Bearer token and body:
//   { subject:"Science", level:"Primary 6", examType:"PRACTICE",
//     score:28, totalMarks:40, timeTaken:2400, questionsAttempted:25 }
//   → { success: true, id: "<uuid>" }
//   → Row appears in Supabase exam_results table with correct student_id
