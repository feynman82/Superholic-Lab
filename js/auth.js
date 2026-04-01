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
export async function signUp(email, password, fullName, planChoice) {
  const supabase = await db();
  
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        full_name: fullName,
        
        // 1. FORCE the database to record them as a trial user
        subscription_tier: 'trial', 
        
        // 2. Save what they clicked so we know what to charge them later
        intended_plan: planChoice   
      }
    }
  });
  
  if (error) throw error;

  const userId = data.user.id;
  const maxChildren = planChoice === 'family' ? 3 : 1;
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Wait for DB trigger to create the profile row (1500ms prevents race condition)
  await new Promise(r => setTimeout(r, 1500));

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      email,
      full_name: fullName,
      subscription_tier: planChoice,
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEnd.toISOString(),
      max_children: maxChildren,
    })
    .eq('id', userId);

  if (profileError) {
    // Log but don't block — setup.html uses URL param as plan source of truth
    console.error('Profile update error (non-blocking):', profileError.message);
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
export async function getProfile() {
  const supabase = await db();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
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
  const profile = await getProfile();
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
  const today = new Date().toISOString().split('T')[0];

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
  const today = new Date().toISOString().split('T')[0];

  // Try RPC first; fall back to manual upsert
  const { error } = await supabase.rpc('increment_daily_usage', {
    p_student_id: studentId,
    p_date: today,
    p_field: field,
  });

  if (error) {
    const current = await checkDailyUsage(studentId);
    await supabase
      .from('daily_usage')
      .upsert({
        student_id: studentId,
        date: today,
        questions_attempted: current.questions_attempted,
        ai_tutor_messages: current.ai_tutor_messages,
        [field]: current[field] + 1,
      }, { onConflict: 'student_id,date' });
  }
}

// ─── Enforce Paywall ─────────────────────────────────────────
export async function enforcePaywall(studentId) {
  const profile = await getProfile();
  if (!profile) return { allowed: false, reason: 'unauthenticated' };

  if (profile.role === 'admin') return { allowed: true, reason: 'admin' };

  // 1. Gracefully handle null tiers (defaults to trial if missing)
  const tier = profile.subscription_tier || 'trial';

  if (['single_subject', 'all_subjects', 'family'].includes(tier)) {
    return { allowed: true, reason: 'paid' };
  }

  if (tier === 'trial') {
    // 2. Gracefully handle missing trial_ends_at dates
    let endsAt;
    if (profile.trial_ends_at) {
      endsAt = new Date(profile.trial_ends_at);
    } else {
      // Fallback: 7 days after the account was created
      const start = profile.created_at ? new Date(profile.created_at) : new Date();
      endsAt = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    // Check if the calculated end date is in the past
    const trialActive = endsAt > new Date();
    if (!trialActive) return { allowed: false, reason: 'expired' };

    // 3. Check daily question limits safely
    const usage = await checkDailyUsage(studentId);
    const attempts = usage?.questions_attempted || 0;
    if (attempts >= 5) return { allowed: false, reason: 'trial_limit' };

    return { allowed: true, reason: 'trial' };
  }

  return { allowed: false, reason: 'expired' };
}

// ─── Guard Page ──────────────────────────────────────────────
export async function guardPage(requireAuth = true) {
  const supabase = await db();
  const { data: { session } } = await supabase.auth.getSession();

  if (requireAuth && !session) {
    window.location.href = '/pages/login.html';
    return null;
  }

  if (!session) return null;

  const profile = await getProfile();
  window.__CURRENT_USER__ = session.user;
  window.__PROFILE__ = profile;

  return profile;
}
