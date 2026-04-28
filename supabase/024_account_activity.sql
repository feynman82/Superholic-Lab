-- ════════════════════════════════════════════════════════════════════════
-- 024 — Account activity log
-- ════════════════════════════════════════════════════════════════════════
-- Append-only ledger of security + account lifecycle events surfaced to
-- the parent on /account.html. Helps spot suspicious activity (e.g. an
-- unexpected password change). Industry-standard pattern (Notion, Linear,
-- GitHub).
--
-- Privacy:
--   - ip_hash stores an HMAC-SHA-256 of the request IP (client IP is never
--     stored in plaintext). Hash is deterministic-per-deploy.
--   - user_agent is stored as-is for now (PDPA-safe — UA strings don't
--     identify a person on their own).
--
-- RLS:
--   - SELECT: parent reads their own activity only.
--   - INSERT: service role only (no client INSERT policy); writes happen
--     via /api/log-activity which validates event_type against the allow
--     list before insert.
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS account_activity (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type    text NOT NULL CHECK (event_type IN (
    'login_success', 'login_failure', 'password_changed', 'email_changed',
    'mfa_enrolled', 'mfa_removed', 'plan_changed', 'subscription_paused',
    'subscription_resumed', 'subscription_cancelled', 'data_exported',
    'learner_added', 'learner_removed'
  )),
  metadata      jsonb DEFAULT '{}'::jsonb,
  ip_hash       text,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE account_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_activity" ON account_activity;
CREATE POLICY "users_read_own_activity" ON account_activity
  FOR SELECT
  USING (profile_id = auth.uid());

-- Inserts happen via the service role through /api/log-activity. No client
-- INSERT policy is defined intentionally — clients cannot fabricate events.

CREATE INDEX IF NOT EXISTS idx_account_activity_profile
  ON account_activity (profile_id, created_at DESC);

COMMENT ON TABLE account_activity IS
  'Append-only security + account events. Service-role insert via /api/log-activity. Client read via RLS.';
