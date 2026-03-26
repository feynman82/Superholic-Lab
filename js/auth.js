// js/auth.js
// Superholic Lab — Auth + paywall logic
// All functions are async. Import supabase from js/supabase-client.js

import { supabase } from './supabase-client.js';

// ── Sign Up ───────────────────────────────────────────────────
export async function signUp(email, password, fullName, planChoice) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const userId = data.user.id;
  const maxChildren = planChoice === 'family' ? 3 : 1;
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      subscription_tier: planChoice,
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEnd.toISOString(),
      max_children: maxChildren,
    })
    .eq('id', userId);

  if (profileError) throw profileError;

  window.location.href = '/pages/setup.html';
}

// ── Sign In ───────────────────────────────────────────────────
export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  window.location.href = '/pages/dashboard.html';
}

// ── Google OAuth ──────────────────────────────────────────────
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/pages/dashboard.html',
    },
  });
  if (error) throw error;
}

// ── Sign Out ──────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.href = '/index.html';
}

// ── Current User ──────────────────────────────────────────────
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

// ── Get Profile ───────────────────────────────────────────────
export async function getProfile() {
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

// ── Is Admin ──────────────────────────────────────────────────
export async function isAdmin() {
  const profile = await getProfile();
  return profile?.role === 'admin';
}

// ── Can Access Subject ────────────────────────────────────────
export async function canAccessSubject(subject) {
  const profile = await getProfile();
  if (!profile) return false;

  const { role, subscription_tier, trial_ends_at } = profile;

  if (role === 'admin') return true;
  if (subscription_tier === 'family' || subscription_tier === 'all_subjects') return true;

  if (subscription_tier === 'trial') {
    const active = trial_ends_at && new Date(trial_ends_at) > new Date();
    return active;
  }

  if (subscription_tier === 'single_subject') {
    // Fetch the student's selected_subject — requires student context
    // Caller must pass matching subject for access
    const { data: students } = await supabase
      .from('students')
      .select('selected_subject')
      .eq('parent_id', profile.id);

    return students?.some(s => s.selected_subject === subject) ?? false;
  }

  return false;
}

// ── Is Trial Active ───────────────────────────────────────────
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

// ── Check Daily Usage ─────────────────────────────────────────
export async function checkDailyUsage(studentId) {
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

// ── Increment Daily Usage ─────────────────────────────────────
export async function incrementDailyUsage(studentId, field) {
  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabase.rpc('increment_daily_usage', {
    p_student_id: studentId,
    p_date: today,
    p_field: field,
  });

  // Fallback: raw upsert if RPC not available
  if (error) {
    const current = await checkDailyUsage(studentId);
    const update = {
      student_id: studentId,
      date: today,
      questions_attempted: current.questions_attempted,
      ai_tutor_messages: current.ai_tutor_messages,
      [field]: current[field] + 1,
    };

    await supabase
      .from('daily_usage')
      .upsert(update, { onConflict: 'student_id,date' });
  }
}

// ── Enforce Paywall ───────────────────────────────────────────
export async function enforcePaywall(studentId) {
  const profile = await getProfile();
  if (!profile) return { allowed: false, reason: 'unauthenticated' };

  if (profile.role === 'admin') return { allowed: true, reason: 'admin' };

  const tier = profile.subscription_tier;

  // Active paid subscription (not trial)
  if (['single_subject', 'all_subjects', 'family'].includes(tier)) {
    return { allowed: true, reason: 'paid' };
  }

  // Trial path
  if (tier === 'trial') {
    const trialActive = profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date();

    if (!trialActive) return { allowed: false, reason: 'expired' };

    const usage = await checkDailyUsage(studentId);
    if (usage.questions_attempted >= 5) {
      return { allowed: false, reason: 'trial_limit' };
    }

    return { allowed: true, reason: 'trial' };
  }

  return { allowed: false, reason: 'expired' };
}

// ── Guard Page ────────────────────────────────────────────────
export async function guardPage(requireAuth = true) {
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

// TEST: Import in browser console: import('/js/auth.js').then(m => m.getProfile().then(console.log))
