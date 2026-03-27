/**
 * supabase-client.js
 * Lazily loads the Supabase JS SDK from CDN, initialises a single
 * client instance, and exposes getSupabase() for use by all
 * other JS modules on the page.
 *
 * The SUPABASE_ANON_KEY is the public anon key — safe to embed in
 * frontend code. RLS policies on every table ensure each user can
 * only read and write their own rows.
 *
 * ⚠️ CONFIGURE: SUPABASE_SERVICE_ROLE_KEY must NEVER appear here.
 *               It is server-side only (api/*.js Vercel functions).
 *
 * TEST: In the browser console on any page:
 *   getSupabase().then(db => db.from('profiles').select('id').limit(1).then(console.log))
 *   Expect a result object with no error.
 */

// ⚠️ CONFIGURE: Update these two values if the Supabase project is recreated.
const SUPABASE_URL      = 'https://rlmqsbxevuutugtyysjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbXFzYnhldnV1dHVndHl5c2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNjIxMTgsImV4cCI6MjA4OTczODExOH0.QIgtg-1WYBV0ySqUS5RsANWaux2dg_lw5Ze5j5gOZSU';

const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

let _client = null;

/**
 * Returns the Supabase client, loading the CDN SDK if not already present.
 * All callers must await this before using the client.
 * Explicitly assigned to window so it is accessible from ES module scripts
 * that import auth.js after this plain script tag loads.
 * @returns {Promise<object>} Supabase SupabaseClient instance
 */
async function getSupabase() {
  if (_client) return _client;

  // Dynamically load SDK from CDN if it has not been loaded by a script tag
  if (!window.supabase) {
    await new Promise((resolve, reject) => {
      const script   = document.createElement('script');
      script.src     = SUPABASE_CDN;
      script.onload  = resolve;
      script.onerror = () => reject(new Error('Could not load Supabase SDK from CDN'));
      document.head.appendChild(script);
    });
  }

  _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession:     true,   // keep session in localStorage
      autoRefreshToken:   true,   // silently refresh expired tokens
      detectSessionInUrl: true,   // handle OAuth + magic link callbacks
    },
  });

  return _client;
}

// Explicitly expose on window so ES module scripts (auth.js) can call it
// after this plain <script> tag has executed.
window.getSupabase = getSupabase;
