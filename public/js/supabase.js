/**
 * supabase.js — Supabase client initialisation
 *
 * Initialises a single shared Supabase client for use across all pages.
 * The anon key is intentionally public — it is safe for browser use.
 * Access control is enforced by Row Level Security (RLS) in Supabase.
 *
 * Usage in any page:
 *   <script src="/js/supabase.js"></script>
 *   <script>
 *     const { data, error } = await supabase.from('table_name').select('*');
 *   </script>
 *
 * ⚠️ CONFIGURE: Replace these values if you change Supabase projects.
 * They also live in .env for reference — keep both in sync.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ⚠️ CONFIGURE: Your Supabase project URL and anon key
const SUPABASE_URL = 'https://rlmqsbxevuutugtyysjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbXFzYnhldnV1dHVndHl5c2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNjIxMTgsImV4cCI6MjA4OTczODExOH0.QIgtg-1WYBV0ySqUS5RsANWaux2dg_lw5Ze5j5gOZSU';

// Initialise and export a single client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// TEST: open browser console on any page that imports this file,
// run: supabase.from('any_table').select('*').then(console.log)
// You should see { data: [...], error: null }
