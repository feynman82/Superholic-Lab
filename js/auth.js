/**
 * auth.js
 * Authentication and session management for Superholic Lab.
 *
 * Public API:
 *   signUp(email, password, fullName)  → { user, error }
 *   signIn(email, password)            → { user, error }
 *   signOut()                          → void
 *   getCurrentUser()                   → user | null
 *   getProfile(userId)                 → profile | null
 *   isTrialActive(profile)             → boolean
 *   canAccessSubject(profile, subject) → boolean
 *   requireAuth()                      → redirects if not logged in
 *   updateNavbar()                     → swaps nav buttons based on auth state
 *   checkDailyUsage(studentId)         → { questions_attempted, ai_tutor_messages }
 *   incrementDailyUsage(studentId, field) → void
 *
 * Auto-init on load:
 *   - updateNavbar() runs on every page
 *   - requireAuth() runs on protected pages (quiz, dashboard, progress, tutor)
 *
 * TEST: Load pages/quiz.html while logged out — should redirect to pages/login.html.
 *       Log in via pages/login.html — should return to the original protected page.
 */

// Pages that require the user to be authenticated
const AUTH_REQUIRED_PATHS = [
  'quiz.html',
  'dashboard.html',
  'progress.html',
  'tutor.html',
];

// ── Auto-initialise on DOMContentLoaded ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await updateNavbar();

    const currentPage = window.location.pathname.split('/').pop();
    if (AUTH_REQUIRED_PATHS.includes(currentPage)) {
      await requireAuth();
    }
  } catch (err) {
    console.error('[auth] init error:', err);
  }
});

// ── Public functions ──────────────────────────────────────────────────────────

/**
 * Creates a new Supabase auth user, then sets trial dates on the profile row
 * that the handle_new_user() database trigger creates automatically.
 * @param {string} email
 * @param {string} password
 * @param {string} fullName
 * @returns {{ user: object|null, session: object|null, error: string|null }}
 */
async function signUp(email, password, fullName) {
  try {
    const db = await getSupabase();
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }, // passed to handle_new_user trigger
      },
    });

    if (error) return { user: null, session: null, error: error.message };

    // If session is present the user is immediately signed in (no email confirmation).
    // Set trial window: 7 days from now.
    if (data.session && data.user) {
      const now       = new Date();
      const trialEnd  = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 7);

      await db
        .from('profiles')
        .update({
          full_name:         fullName,
          trial_started_at:  now.toISOString(),
          trial_ends_at:     trialEnd.toISOString(),
        })
        .eq('id', data.user.id);
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err) {
    console.error('[auth] signUp error:', err);
    return { user: null, session: null, error: 'Sign up failed. Please try again.' };
  }
}

/**
 * Signs in an existing user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {{ user: object|null, error: string|null }}
 */
async function signIn(email, password) {
  try {
    const db = await getSupabase();
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    return { user: data.user, error: null };
  } catch (err) {
    console.error('[auth] signIn error:', err);
    return { user: null, error: 'Login failed. Please try again.' };
  }
}

/**
 * Signs out the current user and redirects to the homepage.
 */
async function signOut() {
  try {
    const db = await getSupabase();
    await db.auth.signOut();
  } catch (err) {
    console.error('[auth] signOut error:', err);
  } finally {
    window.location.href = rootPath() + 'index.html';
  }
}

/**
 * Returns the currently authenticated user, or null if not logged in.
 * @returns {object|null}
 */
async function getCurrentUser() {
  try {
    const db = await getSupabase();
    const { data: { user } } = await db.auth.getUser();
    return user || null;
  } catch {
    return null;
  }
}

/**
 * Fetches the profile row for the given user ID.
 * @param {string} userId
 * @returns {object|null}
 */
async function getProfile(userId) {
  try {
    const db = await getSupabase();
    const { data, error } = await db
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[auth] getProfile error:', err);
    return null;
  }
}

/**
 * Returns true if the profile's trial period has not yet expired.
 * @param {object} profile
 * @returns {boolean}
 */
function isTrialActive(profile) {
  if (!profile?.trial_ends_at) return false;
  return new Date(profile.trial_ends_at) > new Date();
}

/**
 * Returns true if the user's subscription tier allows access to the given subject.
 * Tier rules:
 *   trial         → all subjects (daily usage limits apply)
 *   single_subject → only their chosen subject (stored on the student row)
 *   all_subjects   → all subjects
 *   family         → all subjects (up to 3 child profiles)
 *
 * @param {object} profile
 * @param {string} subject  e.g. 'mathematics'
 * @param {object} [student] required for single_subject tier
 * @returns {boolean}
 */
function canAccessSubject(profile, subject, student = null) {
  const tier = profile?.subscription_tier;
  if (!tier) return false;
  if (tier === 'trial' || tier === 'all_subjects' || tier === 'family') return true;
  if (tier === 'single_subject') {
    if (!student?.selected_subject) return false;
    return student.selected_subject.toLowerCase() === subject.toLowerCase();
  }
  return false;
}

/**
 * Redirects to the login page if there is no active session.
 * Saves the current URL so login.html can redirect back after success.
 */
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    sessionStorage.setItem('auth_redirect', window.location.href);
    window.location.href = rootPath() + 'pages/login.html';
  }
}

/**
 * Updates the navbar to reflect the current auth state.
 * Logged out: shows "Log In" and "Start Free Trial" (default markup).
 * Logged in:  replaces those with "Dashboard" and "Log Out".
 */
async function updateNavbar() {
  const actionsEl = document.querySelector('.navbar-actions');
  if (!actionsEl) return;

  const user = await getCurrentUser();
  if (!user) return; // keep default markup

  // Build logged-in nav — avoids innerHTML with user-controlled strings
  actionsEl.innerHTML = '';

  const dashLink = document.createElement('a');
  dashLink.href      = rootPath() + 'pages/dashboard.html';
  dashLink.className = 'btn btn-secondary btn-sm';
  dashLink.textContent = 'Dashboard';

  const signOutBtn = document.createElement('button');
  signOutBtn.className   = 'btn btn-primary btn-sm';
  signOutBtn.textContent = 'Log Out';
  signOutBtn.addEventListener('click', signOut);

  actionsEl.append(dashLink, signOutBtn);
}

/**
 * Returns today's daily_usage row for the given student, or a zeroed default.
 * @param {string} studentId
 * @returns {{ questions_attempted: number, ai_tutor_messages: number }}
 */
async function checkDailyUsage(studentId) {
  const defaults = { questions_attempted: 0, ai_tutor_messages: 0 };
  try {
    const db  = await getSupabase();
    const today = todayISO();
    const { data, error } = await db
      .from('daily_usage')
      .select('questions_attempted, ai_tutor_messages')
      .eq('student_id', studentId)
      .eq('date', today)
      .single();
    if (error) return defaults;
    return data;
  } catch {
    return defaults;
  }
}

/**
 * Increments a daily usage counter for the given student.
 * Creates today's row if it doesn't exist yet.
 * @param {string} studentId
 * @param {'questions_attempted'|'ai_tutor_messages'} field
 */
async function incrementDailyUsage(studentId, field) {
  try {
    const db    = await getSupabase();
    const today = todayISO();

    const { data: existing } = await db
      .from('daily_usage')
      .select('id, questions_attempted, ai_tutor_messages')
      .eq('student_id', studentId)
      .eq('date', today)
      .single();

    if (existing) {
      await db
        .from('daily_usage')
        .update({ [field]: (existing[field] || 0) + 1 })
        .eq('id', existing.id);
    } else {
      await db
        .from('daily_usage')
        .insert({ student_id: studentId, date: today, [field]: 1 });
    }
  } catch (err) {
    console.error('[auth] incrementDailyUsage error:', err);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD in the local timezone. */
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Returns the relative path prefix to the project root from the current page.
 * pages/*.html → '../'  |  root index.html → ''
 */
function rootPath() {
  return window.location.pathname.includes('/pages/') ? '../' : '';
}
