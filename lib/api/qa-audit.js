/* ════════════════════════════════════════════════════════════════════════════
   lib/api/qa-audit.js  —  Commit 3
   ----------------------------------------------------------------------------
   Audit-trail helper for question_bank mutations. Caller injects the
   service-role Supabase client (already constructed in handlers.js) so we
   don't duplicate env wiring.

   Pure ESM. No own client, no top-level side effects.
   ════════════════════════════════════════════════════════════════════════════ */

'use strict';

const VALID_ACTIONS = new Set([
  'created', 'approved', 'edited', 'flagged', 'unflagged',
  'rejected', 'deleted', 'restored'
]);

/**
 * Write a single qa_reviews row. Failure is logged, never throws — audit
 * writes must never roll back a user-visible question_bank change.
 *
 * @param {SupabaseClient} sb  Service-role client (RLS bypassed)
 * @param {Object} args
 * @param {string}      args.questionId
 * @param {string|null} args.reviewerId
 * @param {string}      args.action       One of VALID_ACTIONS
 * @param {string|null} [args.notes]
 * @param {Object|null} [args.before]
 * @param {Object|null} [args.after]
 * @returns {Promise<{ok: boolean, id?: string, error?: string}>}
 */
async function writeAuditEvent(sb, args) {
  if (!sb) return { ok: false, error: 'supabase client required' };
  const { questionId, reviewerId, action, notes, before, after } = args || {};

  if (!questionId || !action) {
    return { ok: false, error: 'questionId and action are required' };
  }
  if (!VALID_ACTIONS.has(action)) {
    return { ok: false, error: 'invalid action: ' + action };
  }

  try {
    const { data, error } = await sb
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
 * Fetch a question_bank row's full payload as a snapshot. Returns null on
 * miss or error (caller treats as no snapshot).
 *
 * @param {SupabaseClient} sb
 * @param {string} questionId
 */
async function snapshotQuestion(sb, questionId) {
  if (!sb || !questionId) return null;
  try {
    const { data, error } = await sb
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
 * Read audit trail for a single question, newest first. Reviewer names are
 * batch-resolved to avoid N+1.
 *
 * @param {SupabaseClient} sb
 * @param {string} questionId
 * @param {number} [limit=200]
 */
async function readAuditTrail(sb, questionId, limit) {
  if (!sb) throw new Error('supabase client required');
  if (!questionId) throw new Error('questionId required');

  const cap = limit || 200;
  const { data: events, error } = await sb
    .from('qa_reviews')
    .select('id, action, notes, before, after, created_at, reviewer_id')
    .eq('question_id', questionId)
    .order('created_at', { ascending: false })
    .limit(cap);

  if (error) throw new Error(error.message);

  const reviewerIds = [...new Set((events || []).map(e => e.reviewer_id).filter(Boolean))];
  const reviewerMap = {};
  if (reviewerIds.length > 0) {
    const { data: reviewers } = await sb
      .from('profiles')
      .select('id, full_name, email')
      .in('id', reviewerIds);
    (reviewers || []).forEach(r => {
      reviewerMap[r.id] = { name: r.full_name || r.email || 'Unknown', email: r.email };
    });
  }

  return (events || []).map(e => ({
    id: e.id,
    action: e.action,
    notes: e.notes,
    before: e.before,
    after: e.after,
    created_at: e.created_at,
    reviewer: e.reviewer_id ? (reviewerMap[e.reviewer_id] || { name: 'Unknown', email: null }) : null
  }));
}

/**
 * Infer action verb from a before/after diff.
 *   flag_review false→true  → 'flagged'
 *   flag_review true→false  → 'unflagged'
 *   approved_at null→set    → 'approved'
 *   anything else changed   → 'edited'
 * Caller can override via forceAction.
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