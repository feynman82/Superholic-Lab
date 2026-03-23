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

// ── Paywall ────────────────────────────────────────────────────────────────────

const TRIAL_QUESTIONS_PER_DAY = 20;

/**
 * Checks whether the current user is allowed to practise the given subject.
 * Returns { allowed: true } or { allowed: false, reason: string }.
 *
 * Reasons:
 *   'not_authenticated'  — no active session
 *   'trial_expired'      — 7-day trial has ended
 *   'daily_limit'        — trial user has hit 20 questions today
 *   'subject_locked'     — single_subject tier, wrong subject
 *
 * @param {string} subject    e.g. 'mathematics'
 * @param {string} [studentId]
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
async function enforcePaywall(subject, studentId) {
  const user = await getCurrentUser();
  if (!user) return { allowed: false, reason: 'not_authenticated' };

  const profile = await getProfile(user.id);
  if (!profile) return { allowed: false, reason: 'not_authenticated' };

  const tier = profile.subscription_tier;

  // Active paid subscribers — always allowed
  if (tier === 'all_subjects' || tier === 'family') return { allowed: true };

  if (tier === 'single_subject') {
    // Fetch the student's chosen subject (stored on the students row)
    if (studentId) {
      try {
        const db = await getSupabase();
        const { data: stu } = await db
          .from('students')
          .select('selected_subject')
          .eq('id', studentId)
          .single();
        if (stu?.selected_subject &&
            stu.selected_subject.toLowerCase() !== subject.toLowerCase()) {
          return { allowed: false, reason: 'subject_locked' };
        }
      } catch { /* non-blocking */ }
    }
    return { allowed: true };
  }

  // Trial tier
  if (!isTrialActive(profile)) {
    return { allowed: false, reason: 'trial_expired' };
  }
  if (studentId) {
    const usage = await checkDailyUsage(studentId);
    if ((usage.questions_attempted || 0) >= TRIAL_QUESTIONS_PER_DAY) {
      return { allowed: false, reason: 'daily_limit' };
    }
  }
  return { allowed: true };
}

/**
 * Creates and displays the upgrade modal with a message appropriate to the
 * reason the paywall was triggered.
 * @param {'trial_expired'|'daily_limit'|'subject_locked'|string} reason
 */
function showUpgradeModal(reason) {
  // Remove any previously-injected modal
  const old = document.getElementById('upgrade-modal-overlay');
  if (old) old.remove();

  const messages = {
    trial_expired: {
      title: 'Your free trial has ended',
      body:  'Your 7-day free trial is over. Subscribe to keep your child practising with unlimited questions and AI tutor access.',
    },
    daily_limit: {
      title: 'Daily practice limit reached',
      body:  `You have answered ${TRIAL_QUESTIONS_PER_DAY} questions today on the free trial. Upgrade for unlimited daily practice.`,
    },
    subject_locked: {
      title: 'Subject not included in your plan',
      body:  'Your Single Subject plan covers one subject only. Upgrade to All Subjects for full access.',
    },
  };

  const { title, body } = messages[reason] || {
    title: 'Subscription required',
    body:  'Choose a plan to continue practising.',
  };

  const pricingHref = rootPath() + 'pages/pricing.html';

  const overlay = document.createElement('div');
  overlay.id        = 'upgrade-modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  // Build modal DOM without innerHTML for title/body to avoid any XSS risk
  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal-header';
  const titleEl = document.createElement('h2');
  titleEl.id            = 'upgrade-modal-title';
  titleEl.style.cssText = 'font-size:1.125rem;';
  titleEl.textContent   = title;
  const closeBtn = document.createElement('button');
  closeBtn.className    = 'modal-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML    = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';
  header.append(titleEl, closeBtn);

  const modalBody = document.createElement('div');
  modalBody.className = 'modal-body';
  const bodyText = document.createElement('p');
  bodyText.style.color    = 'var(--text-secondary)';
  bodyText.textContent    = body;
  // Featured plan preview
  const planPreview = document.createElement('div');
  planPreview.style.cssText = 'margin-top:var(--space-5); padding:var(--space-4); border:2px solid var(--primary); border-radius:var(--radius-lg); display:flex; justify-content:space-between; align-items:center; background:var(--primary-light);';
  planPreview.innerHTML = '<div><div style="font-weight:600;color:var(--primary);">All Subjects</div><div style="color:var(--text-secondary);font-size:0.875rem;">Unlimited · All subjects · 1 child</div></div><span style="font-weight:800;color:var(--primary);font-size:1.125rem;">S$19.99/mo</span>';
  modalBody.append(bodyText, planPreview);

  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  const laterBtn = document.createElement('button');
  laterBtn.className   = 'btn btn-secondary';
  laterBtn.textContent = 'Maybe later';
  const plansLink = document.createElement('a');
  plansLink.href        = pricingHref;
  plansLink.className   = 'btn btn-primary';
  plansLink.textContent = 'See all plans';
  footer.append(laterBtn, plansLink);

  modal.append(header, modalBody, footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => overlay.classList.add('is-open'));

  // Close handlers
  const close = () => overlay.classList.remove('is-open');
  closeBtn.addEventListener('click', close);
  laterBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function onEsc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
  });
}
