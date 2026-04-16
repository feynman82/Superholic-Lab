/**
 * auth.js — Superholic Lab
 * Auth + paywall logic. All functions are async.
 * Uses getSupabase() from supabase-client.js (CDN-loaded, not ES module export).
 *
 * TEST: import('/js/auth.js').then(m => m.getProfile().then(console.log))
 */

// ─── Helper: get the supabase client ─────────────────────────
async function db() {
  return await getSupabase();
}

// ─── Sign Up ─────────────────────────────────────────────────
// Flow when email confirmation is ON (default for new Supabase projects):
//   1. supabase.auth.signUp() creates the auth.users row.
//   2. Supabase sends the confirmation email.
//   3. data.session is NULL — user is not yet authenticated.
//   4. We redirect to confirm-email.html (a "check your inbox" page).
//   5. User clicks the link → Supabase redirects to emailRedirectTo.
//   6. setup.html loads, guardPage() runs, auto-creates the profile row,
//      and the user completes onboarding.
//
// Flow when email confirmation is OFF (Supabase Auth → Settings → toggle):
//   data.session is populated immediately → we upsert the profile and
//   redirect straight to setup.html as before.
export async function signUp(email, password, fullName, planChoice) {
  const supabase = await db();

  // Store plan in localStorage so setup.html can read it after OAuth/email redirect
  if (planChoice) localStorage.setItem('pendingPlan', planChoice);

  const appUrl = window.location.origin;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // emailRedirectTo: where Supabase sends the user after they click the
      // confirmation link. Include the plan so setup.html can pick it up.
      emailRedirectTo: `${appUrl}/pages/setup.html?plan=${encodeURIComponent(planChoice || 'all_subjects')}`,
      data: {
        full_name:         fullName,
        subscription_tier: 'trial',
        intended_plan:     planChoice,
      },
    },
  });

  if (error) throw error;

  // ── Case A: email confirmation required ──────────────────────
  // session is null → user exists but isn't authenticated yet.
  // Redirect to the holding page; setup.html will run after confirmation.
  if (!data.session) {
    window.location.href = '/pages/confirm-email.html?email=' + encodeURIComponent(email);
    return;
  }

  // ── Case B: email confirmation is disabled ───────────────────
  // session is live → create/update the profile row immediately.
  const userId     = data.user.id;
  const maxChildren = planChoice === 'family' ? 3 : 1;
  const now        = new Date();
  const trialEnd   = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Wait briefly for the DB trigger to fire, then upsert to guarantee the row exists.
  await new Promise(r => setTimeout(r, 1500));

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id:                userId,
      email,
      full_name:         fullName,
      subscription_tier: planChoice,
      trial_started_at:  now.toISOString(),
      trial_ends_at:     trialEnd.toISOString(),
      max_children:      maxChildren,
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
  window.location.href = '/pages/dashboard.html';
}

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
  return data; // null if no row, object if found
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
// OAuth first login, etc.) creates a minimal trial profile automatically.
export async function guardPage(requireAuth = true) {
  const supabase = await db();
  const { data: { session } } = await supabase.auth.getSession();

  if (requireAuth && !session) {
    window.location.href = '/pages/login.html';
    return null;
  }

  if (!session) return null;

  let profile = await getProfile();

  // ── Safety net: auto-create profile if the DB trigger missed ──
  if (!profile && session.user) {
    const plan         = localStorage.getItem('pendingPlan') || 'all_subjects';
    const maxChildren  = plan === 'family' ? 3 : 1;
    const now          = new Date();
    const trialEnd     = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: created, error: createErr } = await supabase
      .from('profiles')
      .upsert({
        id:                session.user.id,
        email:             session.user.email,
        full_name:         session.user.user_metadata?.full_name || '',
        role:              'parent',
        subscription_tier: plan,
        max_children:      maxChildren,
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
      console.info('[guardPage] profile auto-created for', session.user.email);
      profile = created;
      localStorage.removeItem('pendingPlan');
    }
  }

  window.__CURRENT_USER__ = session.user;
  window.__PROFILE__      = profile;

  return profile;
}
