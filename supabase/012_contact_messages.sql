-- ============================================================
-- 012_contact_messages.sql
-- Stores contact form submissions from /pages/contact.html.
-- Previously submitted to Formspree; now stored in Supabase
-- so the admin dashboard can show pending message count.
--
-- status lifecycle: unread → read → replied
-- Admin reads via /api/admin (service role) — no public SELECT.
-- Anyone can INSERT via /api/contact (server-side validation).
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  topic      TEXT        NOT NULL DEFAULT 'General Inquiry',
  message    TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'unread'
               CHECK (status IN ('unread', 'read', 'replied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: only service role can read; anyone can insert (endpoint validates)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit contact form" ON contact_messages;
CREATE POLICY "Public can submit contact form" ON contact_messages
  FOR INSERT WITH CHECK (true);

-- Verify
SELECT 'Migration 012 complete — contact_messages table created' AS result;
