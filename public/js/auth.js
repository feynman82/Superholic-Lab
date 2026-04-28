/**
 * auth.js — Superholic Lab
 * Auth + paywall logic. All functions are async.
 * Uses getSupabase() from supabase-client.js (CDN-loaded, not ES module export).
 *
 * SIGN-UP FLOW:
 *   Everyone signs up for a free 7-day trial — no Stripe, no credit card.
 *   The plan choice on signup is stored as intended_plan only (cosmetic preference).
 *   subscription_tier is ALWAYS 'trial' at signup.
 *   Stripe checkout only happens when the parent clicks Subscribe on pricing.html.
 *
 * TEST: import('/js/auth.js').then(m => m.getProfile().then(console.log))
 */

// ─── Helper: get the supabase client ─────────────────────────
async function db() {
  return await getSupabase();
}

// ─── MFA: assurance-level gate ────────────────────────────────
// Returns true if the current session has a verified TOTP factor but is still
// at AAL1 (password level). Pages should redirect such sessions to the MFA
// challenge before proceeding. Gracefully falls through if the MFA module
// isn't available (older Supabase clients) — callers stay on the happy path.
async function shouldChallengeMfa(supabase) {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) return false;
    return data?.nextLevel === 'aal2' && data?.currentLevel === 'aal1';
  } catch {
    return false;
  }
}

// ─── Sign Up ─────────────────────────────────────────────────
// Everyone starts on a free 7-day trial. No Stripe at signup.
// planChoice is stored as intended_plan only — NOT as subscription_tier.
//
// Flow when email confirmation is ON (default):
//   session is NULL after signUp → redirect to confirm-email.html
//   User clicks confirmation link → Supabase redirects to setup.html
//   guardPage() auto-creates the profile with subscription_tier = 'trial'
//
// Flow when email confirmation is OFF:
//   session is live immediately → upsert profile with subscription_tier = 'trial'
//   redirect to setup.html
export async function signUp(email, password, fullName, planChoice) {
  const supabase = await db();

  // Store intended plan in localStorage so setup.html / guardPage can read it
  if (planChoice) localStorage.setItem('pendingPlan', planChoice);

  const appUrl = window.location.origin;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/pages/setup.html?plan=${encodeURIComponent(planChoice || 'all_subjects')}`,
      data: {
        full_name:     fullName,
        intended_plan: planChoice,   // preference only — NOT the subscription tier
      },
    },
  });

  if (error) throw error;

  // ── Case A: email confirmation required ──────────────────────
  if (!data.session) {
    window.location.href = '/pages/confirm-email.html?email=' + encodeURIComponent(email);
    return;
  }

  // ── Case B: email confirmation is disabled ───────────────────
  // Create the profile row immediately. ALWAYS set subscription_tier = 'trial'.
  const userId = data.user.id;
  const now    = new Date();
  const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await new Promise(r => setTimeout(r, 1500)); // wait for DB trigger

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id:                userId,
      email,
      full_name:         fullName,
      subscription_tier: 'trial',      // always trial — Stripe sets the real tier later
      intended_plan:     planChoice,   // record what they intend to subscribe to
      trial_started_at:  now.toISOString(),
      trial_ends_at:     trialEnd.toISOString(),
      max_children:      1,            // always 1 until they subscribe to Family plan
      role:              'parent',
      created_at:        now.toISOString(),
      updated_at:        now.toISOString(),
    }, { onConflict: 'id' });

  if (profileError) {
    console.error('Profile upsert error (non-blocking):', profileError.message);
  }

  window.location.href = '/pages/setup.html?plan=' + encodeURIComponent(planChoice);
}

// ─── Sign In ─────────────────────────────────────────────────
export async function signIn(email, password) {
  const supabase = await db();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // Fire-and-forget activity log. Server fills in IP hash + UA. Don't await
  // the navigation on this — the row inserting a few hundred ms after the
  // user is already on the next page is fine.
  logActivityClient('login_success').catch(() => {});

  if (await shouldChallengeMfa(supabase)) {
    window.location.href = '/pages/mfa-challenge.html';
    return;
  }
  window.location.href = '/pages/dashboard.html';
}

// ─── Activity log helper (client-side wrapper) ──────────────
// Sends a fire-and-forget POST /api/log-activity. Server validates event_type
// against the allow list and fills in IP hash + user-agent. Safe to call from
// any logged-in page; silently no-ops if there's no session.
export async function logActivityClient(eventType, metadata) {
  try {
    const supabase = await db();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch('/api/log-activity', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + session.access_token,
      },
      body: JSON.stringify({ event_type: eventType, metadata: metadata || {} }),
    });
  } catch (err) {
    // Activity logging must never break the user-visible flow
    console.error('[logActivity] non-fatal:', err.message);
  }
}
window.logActivityClient = logActivityClient;

// ─── Google OAuth ────────────────────────────────────────────
export async function signInWithGoogle() {
  const supabase = await db();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/pages/dashboard.html',
    },
  });
  if (error) throw error;
}

// ─── Apple OAuth ─────────────────────────────────────────────
export async function signInWithApple() {
  const supabase = await db();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: window.location.origin + '/pages/dashboard.html',
    },
  });
  if (error) throw error;
}

// ─── Sign Out ────────────────────────────────────────────────
export async function signOut() {
  const supabase = await db();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.href = '/index.html';
}

// ─── Current User ────────────────────────────────────────────
export async function getCurrentUser() {
  const supabase = await db();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

// ─── Get Profile ─────────────────────────────────────────────
// Uses maybeSingle() so a missing row returns null, not a 406 error.
export async function getProfile() {
  const supabase = await db();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[getProfile] query error:', error.message);
    return null;
  }
  return data;
}

// ─── Is Admin ────────────────────────────────────────────────
export async function isAdmin() {
  const profile = await getProfile();
  return profile?.role === 'admin';
}

// ─── Can Access Subject ──────────────────────────────────────
export async function canAccessSubject(subject) {
  const supabase = await db();
  const profile  = await getProfile();
  if (!profile) return false;

  const { role, subscription_tier, trial_ends_at } = profile;

  if (role === 'admin') return true;
  if (subscription_tier === 'family' || subscription_tier === 'all_subjects') return true;

  if (subscription_tier === 'trial') {
    return trial_ends_at && new Date(trial_ends_at) > new Date();
  }

  if (subscription_tier === 'single_subject') {
    const { data: students } = await supabase
      .from('students')
      .select('selected_subject')
      .eq('parent_id', profile.id);
    return students?.some(s => s.selected_subject === subject) ?? false;
  }

  return false;
}

// ─── Is Trial Active ─────────────────────────────────────────
export async function isTrialActive() {
  const profile = await getProfile();
  if (!profile) return false;
  if (profile.role === 'admin') return false;
  return (
    profile.subscription_tier === 'trial' &&
    profile.trial_ends_at &&
    new Date(profile.trial_ends_at) > new Date()
  );
}

// ─── Is Paid Subscriber ──────────────────────────────────────
export async function isPaidSubscriber() {
  const profile = await getProfile();
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  return ['all_subjects', 'family', 'single_subject'].includes(profile.subscription_tier);
}

// ─── Check Daily Usage ───────────────────────────────────────
export async function checkDailyUsage(studentId) {
  const supabase = await db();
  const today    = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_usage')
    .select('questions_attempted, ai_tutor_messages')
    .eq('student_id', studentId)
    .eq('date', today)
    .maybeSingle();

  if (error || !data) return { questions_attempted: 0, ai_tutor_messages: 0 };
  return data;
}

// ─── Increment Daily Usage ───────────────────────────────────
export async function incrementDailyUsage(studentId, field) {
  const supabase = await db();
  const today    = new Date().toISOString().split('T')[0];

  const { error } = await supabase.rpc('increment_daily_usage', {
    p_student_id: studentId,
    p_date:       today,
    p_field:      field,
  });

  if (error) {
    const current = await checkDailyUsage(studentId);
    await supabase
      .from('daily_usage')
      .upsert({
        student_id:           studentId,
        date:                 today,
        questions_attempted:  current.questions_attempted,
        ai_tutor_messages:    current.ai_tutor_messages,
        [field]:              current[field] + 1,
      }, { onConflict: 'student_id,date' });
  }
}

// ─── Enforce Paywall ─────────────────────────────────────────
export async function enforcePaywall(studentId) {
  const profile = await getProfile();
  if (!profile) return { allowed: false, reason: 'unauthenticated' };

  if (profile.role === 'admin') return { allowed: true, reason: 'admin' };

  const tier = profile.subscription_tier || 'trial';

  if (['single_subject', 'all_subjects', 'family'].includes(tier)) {
    return { allowed: true, reason: 'paid' };
  }

  if (tier === 'trial') {
    let endsAt;
    if (profile.trial_ends_at) {
      endsAt = new Date(profile.trial_ends_at);
    } else {
      const start = profile.created_at ? new Date(profile.created_at) : new Date();
      endsAt = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const trialActive = endsAt > new Date();
    if (!trialActive) return { allowed: false, reason: 'expired' };

    const usage    = await checkDailyUsage(studentId);
    const attempts = usage?.questions_attempted || 0;
    if (attempts >= 5) return { allowed: false, reason: 'trial_limit' };

    return { allowed: true, reason: 'trial' };
  }

  return { allowed: false, reason: 'expired' };
}

// ─── Guard Page ──────────────────────────────────────────────
// Protects authenticated pages. If user has no profile row (trigger missed,
// OAuth first login, etc.) creates a minimal TRIAL profile automatically.
export async function guardPage(requireAuth = true) {
  const supabase = await db();
  const { data: { session } } = await supabase.auth.getSession();

  if (requireAuth && !session) {
    window.location.href = '/pages/login.html';
    return null;
  }

  if (!session) return null;

  // ── MFA gate: if user has a verified factor but session is still AAL1,
  //    bounce to the challenge page (preserving the intended destination).
  //    The challenge page itself is exempt to avoid a redirect loop.
  if (window.location.pathname !== '/pages/mfa-challenge.html'
      && await shouldChallengeMfa(supabase)) {
    const back = window.location.pathname + window.location.search;
    window.location.href = '/pages/mfa-challenge.html?return=' + encodeURIComponent(back);
    return null;
  }

  let profile = await getProfile();

  // ── Safety net: auto-create profile if the DB trigger missed ──
  if (!profile && session.user) {
    const now      = new Date();
    const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const intendedPlan = localStorage.getItem('pendingPlan') || 'all_subjects';

    const { data: created, error: createErr } = await supabase
      .from('profiles')
      .upsert({
        id:                session.user.id,
        email:             session.user.email,
        full_name:         session.user.user_metadata?.full_name || '',
        role:              'parent',
        subscription_tier: 'trial',      // always trial — never inherit plan from localStorage
        intended_plan:     intendedPlan,
        max_children:      1,            // always 1 until Family plan subscribed
        trial_started_at:  now.toISOString(),
        trial_ends_at:     trialEnd.toISOString(),
        created_at:        now.toISOString(),
        updated_at:        now.toISOString(),
      }, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (createErr) {
      console.error('[guardPage] profile auto-create failed:', createErr.message);
    } else {
      console.info('[guardPage] trial profile auto-created for', session.user.email);
      profile = created;
      localStorage.removeItem('pendingPlan');
    }
  }

  window.__CURRENT_USER__ = session.user;
  window.__PROFILE__      = profile;

  return profile;
}
