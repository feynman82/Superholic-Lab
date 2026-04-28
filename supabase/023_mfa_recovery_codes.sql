-- ════════════════════════════════════════════════════════════════════════
-- 023 — MFA recovery codes
-- ════════════════════════════════════════════════════════════════════════
-- Single-use recovery codes for parents who lose access to their TOTP
-- authenticator. Codes are SHA-256 hashed client-side BEFORE insert; the
-- plaintext never touches the wire or the DB.
--
-- Linked to auth.users (cascade delete) so a removed account also wipes
-- its codes. RLS limits both reads + writes to the row owner — service
-- role bypasses RLS as usual.
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash   text NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_recovery_codes" ON mfa_recovery_codes;
CREATE POLICY "users_own_recovery_codes" ON mfa_recovery_codes
  FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user
  ON mfa_recovery_codes (user_id, used_at);

COMMENT ON TABLE mfa_recovery_codes IS
  'SHA-256 hashed single-use recovery codes for MFA. Plaintext never stored.';
