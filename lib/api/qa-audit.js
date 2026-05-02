/* ════════════════════════════════════════════════════════════════════════════
   api/_lib/qa-audit.js  —  Commit 3: qa_reviews audit trail
   ----------------------------------------------------------------------------
   Single helper used by every endpoint that mutates question_bank. Writes one
   row to qa_reviews with before/after snapshots. Designed to be called inside
   the same logical transaction as the question_bank mutation, but uses a
   service-role client so RLS is bypassed (audit logging must succeed even for
   delete operations where the row is gone afterwards).

   IMPORTANT: This module imports the service-role Supabase client. Never expose
   it to the browser. Only use from /api/* serverless functions.
   ════════════════════════════════════════════════════════════════════════════ */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  // Fail fast at import time in dev. In production Vercel env vars must be set.
  console.error('[qa-audit] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const VALID_ACTIONS = new Set([
  'created', 'approved', 'edited', 'flagged', 'unflagged',
  'rejected', 'deleted', 'restored'
]);

/**
 * Write a single qa_reviews row.
 * Failure here is logged but does not throw — we never want an audit-write
 * failure to roll back a user-visible question_bank change.
 *
 * @param {Object} args
 * @param {string} args.questionId    UUID of question_bank row
 * @param {string|null} args.reviewerId  auth.users.id of the actor (null for system)
 * @param {string} args.action        One of VALID_ACTIONS
 * @param {string|null} [args.notes]
 * @param {Object|null} [args.before] Pre-mutation snapshot
 * @param {Object|null} [args.after]  Post-mutation snapshot
 * @returns {Promise<{ok: boolean, id?: string, error?: string}>}
 */
async function writeAuditEvent({ questionId, reviewerId, action, notes, before, after }) {
  if (!questionId || !action) {
    return { ok: false, error: 'questionId and action are required' };
  }
  if (!VALID_ACTIONS.has(action)) {
    return { ok: false, error: 'invalid action: ' + action };
  }

  try {
    const { data, error } = await adminClient
      .from('qa_reviews')
      .insert({
        question_id: questionId,
        reviewer_id: reviewerId || null,
        action,
        notes: notes || null,
        before: before || null,
        after: after || null
      })
      .select('id')
      .single();

    if (error) {
      console.error('[qa-audit] insert failed:', error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    console.error('[qa-audit] unexpected error:', err);
    return { ok: false, error: String(err && err.message || err) };
  }
}

/**
 * Fetch a question_bank row's full payload as a snapshot. Used to populate
 * the `before` field before a mutation. Returns null if the row does not exist
 * or on error (caller treats as no snapshot — the audit row simply has
 * before=null which is acceptable for backfill-style situations).
 */
async function snapshotQuestion(questionId) {
  if (!questionId) return null;
  try {
    const { data, error } = await adminClient
      .from('question_bank')
      .select('*')
      .eq('id', questionId)
      .maybeSingle();
    if (error) {
      console.error('[qa-audit] snapshot fetch failed:', error.message);
      return null;
    }
    return data || null;
  } catch (err) {
    console.error('[qa-audit] snapshot unexpected error:', err);
    return null;
  }
}

/**
 * Convenience for endpoints that already hold both before and after objects.
 * Determines the action from the diff:
 *   - flag_review: false→true / null→true  → 'flagged'
 *   - flag_review: true→false / true→null  → 'unflagged'
 *   - approved_at: null→non-null           → 'approved'
 *   - any other column changed              → 'edited'
 * Caller can override by passing forceAction.
 */
function inferActionFromDiff(before, after, forceAction) {
  if (forceAction) return forceAction;
  if (!before) return 'created';
  if (!after) return 'deleted';

  const bf = !!before.flag_review;
  const af = !!after.flag_review;
  if (!bf && af) return 'flagged';
  if (bf && !af) return 'unflagged';

  const wasApproved = !!before.approved_at;
  const nowApproved = !!after.approved_at;
  if (!wasApproved && nowApproved) return 'approved';

  return 'edited';
}

export {
  writeAuditEvent,
  snapshotQuestion,
  readAuditTrail,
  inferActionFromDiff,
  VALID_ACTIONS
};