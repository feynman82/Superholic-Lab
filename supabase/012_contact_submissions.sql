-- ============================================================
-- 012_contact_submissions.sql
-- Stores contact form messages submitted via /pages/contact.
-- Status: 'pending' = awaiting reply | 'replied' = done.
-- All access via service role key in API handlers (no RLS needed
-- for public read, admin reads via service role).
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_submissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  topic      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'replied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No public RLS policies — all reads/writes happen via service_role key in API.
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 'Migration 012 complete — contact_submissions table created' AS result;
