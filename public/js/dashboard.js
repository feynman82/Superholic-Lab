/* ════════════════════════════════════════════════════════════════════════════
   dashboard.js  —  v1.0  (Commit 1: mechanical split — no behaviour change)
   ----------------------------------------------------------------------------
   Source: split out of pages/dashboard.html. Two original <script> blocks
   merged here in document order:
     1. <script type="module"> in <head> — ESM imports + boot() function
     2. <script> in <body>             — main page logic (window.initDashboard
                                         + all window.* handler exports)
   The trailing boot() invocation (originally last line of block 1) is moved
   to the very bottom of this file, per the split brief, so the merged module
   defines everything before kicking off auth + render.

   ESM imports preserved verbatim; HTML now loads this file with type="module".
   All implicit-global functions in block 2 are referenced only by intra-file
   callers; every name reachable from inline HTML handlers is explicitly
   assigned to window in the original source and remains so here.

   Section banners mirror dashboard.css for cross-file navigation.
   ════════════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════════════
   1. IMPORTS + AUTH GATE BOOT FN  (boot() call moved to end-of-file)
   ════════════════════════════════════════════════════════════════════════════ */

import { guardPage } from '/js/auth.js';
import { initAppShell } from '/js/app-shell.js';
async function boot() {
  try {
    window.userProfile = await guardPage(true);
    const runInit = () => {
      if (typeof initAppShell === 'function') initAppShell(window.userProfile);
      if (typeof window.initDashboard === 'function') window.initDashboard();
    };
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', runInit); }
    else { runInit(); }
  } catch (err) { console.error('Boot sequence failed:', err); }
}


/* ════════════════════════════════════════════════════════════════════════════
   1. SHARED STATE
   ════════════════════════════════════════════════════════════════════════════ */

let currentStudents = [];
let targetStudentId = null;

/* ════════════════════════════════════════════════════════════════════════════
   2. UTILITIES
   ════════════════════════════════════════════════════════════════════════════ */

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtDate(d) {
  return d ? d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}
function fmtRelative(d) {
  if (!d) return null;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'just now' : mins + 'm ago';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  if (days < 7) return days + 'd ago';
  if (days < 30) return Math.floor(days / 7) + 'w ago';
  return Math.floor(days / 30) + 'mo ago';
}

/* ─── Checkout success polling (preserved verbatim) ───────────────────────── */
/* ════════════════════════════════════════════════════════════════════════════
   3. SUBSCRIPTION POLLING + HEALTH STRIP RENDER
   ════════════════════════════════════════════════════════════════════════════ */

async function pollSubscriptionUpdate(attempt) {
  if (attempt >= 8) {
    const statusEl = document.getElementById('checkoutToastStatus');
    if (statusEl) statusEl.textContent = 'Reload the page to see your updated plan.';
    return;
  }
  await new Promise(r => setTimeout(r, 3000));
  try {
    const sb = await getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;
    const { data: p } = await sb.from('profiles')
      .select('subscription_tier, stripe_customer_id, max_children')
      .eq('id', session.user.id)
      .single();
    if (p && p.subscription_tier !== 'trial') {
      Object.assign(window.userProfile, p);
      if (window.plausible) window.plausible('Subscribe Complete', { props: { plan: p.subscription_tier } });
      const banner = document.getElementById('trialBanner');
      if (banner) { banner.classList.add('hidden'); banner.style.display = 'none'; }
      if (p.stripe_customer_id) {
        const btn = document.getElementById('manageBillingBtn');
        if (btn) btn.classList.remove('hidden');
      }
      const planNames = { all_subjects: 'All Subjects', family: 'Family Plan', single_subject: 'Single Subject' };
      const statusEl = document.getElementById('checkoutToastStatus');
      if (statusEl) statusEl.textContent = `You're now on ${planNames[p.subscription_tier] || p.subscription_tier}.`;
      setTimeout(() => { const t = document.getElementById('checkoutToast'); if (t) t.style.display = 'none'; }, 4000);
    } else {
      pollSubscriptionUpdate(attempt + 1);
    }
  } catch (e) {
    pollSubscriptionUpdate(attempt + 1);
  }
}

/* ─── HEALTH STRIP ──────────────────────────────────────────────────────── */
function renderHealthStrip(profile, students, streakInfo) {
  const strip = document.getElementById('healthStrip');
  if (!strip) return;
  strip.hidden = false;

  const tier = profile.subscription_tier || 'trial';
  const planLabels = { trial: 'Free trial', all_subjects: 'All subjects', family: 'Family', single_subject: 'Single subject', paused: 'Paused' };
  const planEl = document.getElementById('healthPlan');
  const planSubEl = document.getElementById('healthPlanSub');
  planEl.textContent = profile.role === 'admin' ? 'Admin' : (planLabels[tier] || tier);

  planEl.classList.remove('health-tile__value--ok', 'health-tile__value--warn', 'health-tile__value--alert');
  if (tier === 'trial')        planEl.classList.add('health-tile__value--warn');
  else if (tier === 'paused')  planEl.classList.add('health-tile__value--warn');
  else if (tier !== 'trial')   planEl.classList.add('health-tile__value--ok');
  planSubEl.textContent = tier === 'trial' ? 'No card on file' : 'Active subscription';

  // Status / Trial-ends tile
  const billingEl = document.getElementById('healthBilling');
  const billingSubEl = document.getElementById('healthBillingSub');
  const billingLabelEl = document.getElementById('healthBillingLabel');
  if (tier === 'trial' && profile.trial_ends_at) {
    const daysLeft = Math.max(0, Math.ceil((new Date(profile.trial_ends_at) - new Date()) / 86400000));
    billingLabelEl.textContent = 'Trial ends';
    billingEl.textContent = daysLeft + (daysLeft === 1 ? ' day' : ' days');
    billingSubEl.textContent = fmtDate(new Date(profile.trial_ends_at));
    if (daysLeft <= 2) billingEl.classList.add('health-tile__value--alert');
  } else {
    billingLabelEl.textContent = 'Status';
    billingEl.textContent = 'Active';
    billingEl.classList.add('health-tile__value--ok');
    billingSubEl.textContent = 'Subscription healthy';
  }

  // Learners tile
  const learnersEl = document.getElementById('healthLearners');
  const learnersSubEl = document.getElementById('healthLearnersSub');
  const max = profile.max_children || 1;
  learnersEl.textContent = students.length;
  learnersSubEl.textContent = 'of ' + max + ' on plan';

  // Family streak tile
  const streakEl = document.getElementById('healthStreak');
  const streakSubEl = document.getElementById('healthStreakSub');
  if (streakInfo && streakInfo.familyStreak > 0) {
    streakEl.textContent = streakInfo.familyStreak + (streakInfo.familyStreak === 1 ? ' day' : ' days');
    streakSubEl.textContent = streakInfo.lastActiveLabel || '';
  } else {
    streakEl.textContent = '—';
    streakSubEl.textContent = students.length === 0 ? 'Add a learner to start' : 'No activity yet';
  }
}

/* ─── BOOT ───────────────────────────────────────────────────────────────── */
/* ════════════════════════════════════════════════════════════════════════════
   4. INIT DASHBOARD
   ════════════════════════════════════════════════════════════════════════════ */

window.initDashboard = async function () {
  const profile = window.userProfile;
  if (!profile) return;

  const firstName = profile.full_name?.split(' ')[0] || 'Parent';
  document.getElementById('welcomeMsg').textContent = `Welcome back, ${escapeHtml(firstName)}.`;

  const badge = document.getElementById('planBadge');
  if (badge) {
    const planLabels = { trial: 'Free Trial', single_subject: 'Single Subject', all_subjects: 'All Subjects', family: 'Family' };
    badge.textContent = profile.role === 'admin' ? 'Admin' : (planLabels[profile.subscription_tier] || profile.subscription_tier || 'Free Trial');
  }

  // Trial countdown + urgency analytics
  if (profile.subscription_tier === 'trial' && profile.trial_ends_at) {
    const daysLeft = Math.ceil((new Date(profile.trial_ends_at) - new Date()) / 86400000);
    if (daysLeft > 0) {
      const trialBanner = document.getElementById('trialBanner');
      trialBanner.classList.remove('hidden');
      trialBanner.style.display = 'flex';
      document.getElementById('trialDaysLeft').textContent = `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
      if (daysLeft <= 2) {
        if (window.plausible) window.plausible('Trial Day 5');
      }
    }
  }

  // Admin panel
  if (profile.role === 'admin' || profile.role === 'sub-admin') {
    document.getElementById('adminPanel').classList.remove('hidden');
  }

  // Manage Billing button
  if (profile.stripe_customer_id) {
    document.getElementById('manageBillingBtn').classList.remove('hidden');
  }

  // Phase 2 + 3 — fire family activity feed and weekly digest in parallel
  // with loadStudents so the aside lights up at the same time as the
  // learner grid.
  await Promise.all([
    loadStudents(),
    loadFamilyActivity(),
    loadWeeklyDigest(),
  ]);

  // Phase 5 — celebration toast for new badges / mastery levels since
  // the parent's last dashboard visit. Runs AFTER loadStudents resolves
  // so window.__cachedStudents is populated and we can scope the
  // unlocks query to this parent's learners. Bumps
  // profile.dashboard_last_seen_at as a side-effect.
  loadCelebrations(profile);

  // Render HUD strip for the most recently active student
  const hudStudentId = localStorage.getItem('shl_active_student_id');
  if (hudStudentId && window.renderHUDStrip) {
    window.renderHUDStrip('dashboard-hud-strip', { studentId: hudStudentId }).catch(() => {});
  }

  // ── Checkout success detection ──
  const params = new URLSearchParams(window.location.search);
  if (params.get('checkout') === 'success') {
    window.history.replaceState({}, '', window.location.pathname);
    const toast = document.getElementById('checkoutToast');
    if (toast) toast.style.display = 'block';
    setTimeout(() => pollSubscriptionUpdate(0), 2000);
  }
};

/* ─── LOAD STUDENTS ─────────────────────────────────────────────────────── */
/* ════════════════════════════════════════════════════════════════════════════
   5. DATA FETCH (students, resume rows, resume card)
   ════════════════════════════════════════════════════════════════════════════ */

async function loadStudents() {
  const profile = window.userProfile;
  const sb = await getSupabase();
  const query = profile.role === 'admin'
    ? sb.from('students').select('*').order('created_at', { ascending: true })
    : sb.from('students').select('*').eq('parent_id', profile.id).order('created_at', { ascending: true });
  const { data: students } = await query;
  currentStudents = students || [];
  if (profile.role === 'admin') document.getElementById('adminStats').textContent = `(${currentStudents.length})`;

  const studentIds = currentStudents.map(s => s.id);

  // Parallel fetch: unread notes, mastery levels (for AL strip), daily usage (streak)
  let unreadMap = {};
  let masteryMap = {};   // { student_id: { Mathematics: AL3, Science: AL2, English: AL5 } }
  let activityMap = {};  // { student_id: { lastActive: Date, streak: number } }

  // Resume rows are populated alongside the existing parallel fetches —
  // see fetchResumeRows below.
  let resumeRows = [];

  if (studentIds.length > 0) {
    // Unread notes
    const notesPromise = sb.from('study_notes').select('student_id, is_read').in('student_id', studentIds);

    // Mastery — pull mean mastery per subject per student to derive AL band
    const masteryPromise = sb.from('mastery_levels')
      .select('student_id, subject, probability')
      .in('student_id', studentIds);

    // Activity — most recent question_attempt per student
    const activityPromise = sb.from('question_attempts')
      .select('student_id, created_at')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false });

    // Phase 1 — Resume CTA: active Plan Quests + stale streaks
    const resumePromise = fetchResumeRows(sb, currentStudents);

    const [notesRes, masteryRes, activityRes, resumeRes] = await Promise.all([
      notesPromise, masteryPromise, activityPromise, resumePromise,
    ]);
    resumeRows = resumeRes || [];

    // Unread map
    (notesRes.data || []).forEach(n => {
      if (!unreadMap[n.student_id]) unreadMap[n.student_id] = 0;
      if (!n.is_read) unreadMap[n.student_id]++;
    });

    // Mastery map: average probability per (student, subject) → AL band
    const accumulator = {};
    (masteryRes.data || []).forEach(m => {
      if (!accumulator[m.student_id]) accumulator[m.student_id] = {};
      if (!accumulator[m.student_id][m.subject]) accumulator[m.student_id][m.subject] = { sum: 0, n: 0 };
      accumulator[m.student_id][m.subject].sum += (m.probability || 0);
      accumulator[m.student_id][m.subject].n   += 1;
    });
    Object.entries(accumulator).forEach(([sid, subjects]) => {
      masteryMap[sid] = {};
      Object.entries(subjects).forEach(([subj, agg]) => {
        const avg = agg.sum / agg.n;
        masteryMap[sid][subj] = probabilityToALBand(avg);
      });
    });

    // Activity map
    (activityRes.data || []).forEach(a => {
      if (!activityMap[a.student_id]) {
        activityMap[a.student_id] = { lastActive: new Date(a.created_at) };
      }
    });
  }

  // Compute family streak (max contiguous days any learner was active)
  const familyStreakInfo = await computeFamilyStreak(studentIds);

  // Render health strip with full data
  renderHealthStrip(profile, currentStudents, familyStreakInfo);

  // Render or clear the Resume CTA — must run after currentStudents is
  // populated so renderResumeCard can rely on the in-memory list.
  renderResumeCard(resumeRows);

  renderGrid(unreadMap, masteryMap, activityMap);

  const addBtn = document.getElementById('addChildBtn');
  if (profile.role !== 'admin' && currentStudents.length >= (profile.max_children || 1)) {
    addBtn.style.display = 'none';
  } else {
    addBtn.style.display = 'inline-flex';
  }
}

/* ─── RESUME CTA (Phase 1) ─────────────────────────────────────────────────
   Surfaces up to 3 "pick up where you left off" rows ABOVE the learner
   grid, sourced from data the platform already tracks server-side:

     • Active Plan Quest rows  (remedial_quests where status='active'
       and current_step < 3) — always shown when present.
     • Stale-streak rows       (student_streaks with current_days >= 3
       and last_active < today SGT, only after 18:00 SGT). Capped to one
       row per learner so a kid with both an active quest AND a stale
       streak shows only the higher-priority quest line.

   In-progress quizzes are intentionally NOT surfaced — the quiz engine
   holds session state in-memory only (see public/js/quiz.js); there is
   no server-side flag for an interrupted quiz today. Adding one is
   tracked as a follow-up; the row will plug in here when it lands. */

async function fetchResumeRows(sb, students) {
  if (!students || students.length === 0) return [];
  const studentIds = students.map(s => s.id);
  try {
    const [questsRes, streaksRes] = await Promise.all([
      sb.from('remedial_quests')
        .select('id, student_id, topic, current_step, status, updated_at')
        .in('student_id', studentIds)
        .eq('status', 'active')
        .lt('current_step', 3)
        .order('updated_at', { ascending: false }),
      sb.from('student_streaks')
        .select('student_id, current_days, last_active')
        .in('student_id', studentIds)
        .gte('current_days', 3),
    ]);

    const nameOf = (id) => {
      const s = students.find(x => x.id === id);
      return (s && s.name) || 'Your child';
    };

    const rows = [];
    const seenStudents = new Set();

    // Priority 1 — active Plan Quest rows
    (questsRes.data || []).forEach(q => {
      if (rows.length >= 3) return;
      if (seenStudents.has(q.student_id)) return; // one row per student
      rows.push({
        kind:        'quest',
        iconKey:     'quest',
        studentId:   q.student_id,
        studentName: nameOf(q.student_id),
        summary:     `${nameOf(q.student_id)} — Day ${(q.current_step || 0) + 1} of their ${q.topic} Plan Quest is unlocked.`,
        ctaLabel:    'Continue quest',
        ctaUrl:      '/quest?id=' + encodeURIComponent(q.id),
        ctaVariant:  'primary',
      });
      seenStudents.add(q.student_id);
    });

    // Priority 2 — stale-streak rows (only after 18:00 SGT)
    const sgt = sgtNow();
    if (sgt.hour >= 18) {
      (streaksRes.data || []).forEach(s => {
        if (rows.length >= 3) return;
        if (seenStudents.has(s.student_id)) return;
        const lastActive = s.last_active || '';
        // last_active is a date string (YYYY-MM-DD); compare lexically.
        // Stale = strictly before today's SGT date.
        if (!lastActive || lastActive >= sgt.dateStr) return;
        rows.push({
          kind:        'streak',
          iconKey:     'flame',
          streakDays:  s.current_days,
          studentId:   s.student_id,
          studentName: nameOf(s.student_id),
          summary:     `${nameOf(s.student_id)} had a ${s.current_days}-day streak — practise today to keep it alive.`,
          ctaLabel:    'Start a quick session',
          ctaUrl:      `/pages/quiz.html?student=${encodeURIComponent(s.student_id)}&length=5`,
          ctaVariant:  'ghost',
        });
        seenStudents.add(s.student_id);
      });
    }

    return rows;
  } catch (err) {
    console.error('[resume] fetch error (non-fatal):', err && err.message);
    return [];
  }
}

function sgtNow() {
  // CLAUDE.md doctrine: every SGT-midnight calculation uses Intl with
  // timeZone: 'Asia/Singapore'. Returns { dateStr: 'YYYY-MM-DD', hour: 0-23 }.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone:  'Asia/Singapore',
    year:      'numeric',
    month:     '2-digit',
    day:       '2-digit',
    hour:      '2-digit',
    hour12:    false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = t => (parts.find(p => p.type === t) || {}).value || '';
  return {
    dateStr: `${get('year')}-${get('month')}-${get('day')}`,
    hour:    parseInt(get('hour') || '0', 10),
  };
}

function renderResumeCard(rows) {
  const mount = document.getElementById('resume-card-mount');
  if (!mount) return;
  if (!rows || rows.length === 0) {
    mount.innerHTML = '';
    return;
  }

  const escape = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const iconSvg = (key) => {
    // Reuse existing icons.js render paths so the resume row icons match
    // the rest of the dashboard's icon language. Fallback: empty string.
    if (window.shlIcon) return window.shlIcon(key, { size: 18 });
    return '';
  };

  const variantClass = (v) => v === 'ghost' ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm';

  const rowsHtml = rows.map(r => {
    const iconClass = r.kind === 'streak' ? 'resume-row__icon resume-row__icon--warn' : 'resume-row__icon';
    return ''
      + '<div class="resume-row">'
        + '<div class="' + iconClass + '">' + iconSvg(r.iconKey) + '</div>'
        + '<div class="resume-row__body">' + escape(r.summary) + '</div>'
        + '<div class="resume-row__cta">'
          + '<a class="' + variantClass(r.ctaVariant) + '" href="' + escape(r.ctaUrl) + '">'
            + escape(r.ctaLabel)
          + '</a>'
        + '</div>'
      + '</div>';
  }).join('');

  mount.innerHTML = ''
    + '<article class="card-glass resume-card" id="resume-card" role="region" aria-label="Pick up where you left off">'
      + '<header class="resume-card__head">'
        + '<div>'
          + '<span class="label-caps resume-card__eyebrow">Pick up where you left off</span>'
          + '<h2 class="h2-as resume-card__title">Your child\'s next move.</h2>'
        + '</div>'
      + '</header>'
      + '<div class="resume-card__rows">' + rowsHtml + '</div>'
    + '</article>';
}

/* ─── FAMILY ACTIVITY FEED (Phase 2) ──────────────────────────────────────
   Pulls /api/family-activity, renders 5 most-recent events across all
   learners in the 5-col aside between "Today's focus" and "Quick links".
   Each row is a clickable link to the relevant page (progress, quest,
   backpack). Empty / failure states are visible but never blocking. */

/* ════════════════════════════════════════════════════════════════════════════
   6. ACTIVITY FEED + WEEKLY DIGEST
   ════════════════════════════════════════════════════════════════════════════ */

async function loadFamilyActivity() {
  const content = document.getElementById('activity-feed-content');
  if (!content) return;
  try {
    const sb = await getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      content.innerHTML = '<div class="activity-feed-empty">Sign in to see family activity.</div>';
      return;
    }
    const res = await fetch('/api/family-activity?limit=5', {
      headers: { 'Authorization': 'Bearer ' + session.access_token },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    renderActivityFeed(data.events || []);
  } catch (err) {
    console.error('[family-activity] load error:', err && err.message);
    content.innerHTML = '<div class="activity-feed-empty">Activity feed unavailable right now.</div>';
  }
}

function renderActivityFeed(events) {
  const content = document.getElementById('activity-feed-content');
  if (!content) return;
  if (!events || events.length === 0) {
    content.innerHTML =
      '<div class="activity-feed-empty">Nothing to show yet. Pick a learner to get started.</div>';
    return;
  }

  const escape = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  content.innerHTML = '<div class="activity-feed-list">'
    + events.map(ev => {
        const tone     = activityFeedTone(ev.type);
        const iconCls  = tone ? (' activity-feed-row__icon--' + tone) : '';
        const href     = ev.action_url || '#';
        const time     = relativeTime(ev.occurred_at);
        return ''
          + '<a class="activity-feed-row" href="' + escape(href) + '">'
            + '<span class="activity-feed-row__icon' + iconCls + '" aria-hidden="true">'
              + activityFeedIcon(ev.type)
            + '</span>'
            + '<span class="activity-feed-row__body">'
              + '<span class="activity-feed-row__summary">' + escape(ev.summary) + '</span>'
              + '<span class="activity-feed-row__time">' + escape(time) + '</span>'
            + '</span>'
          + '</a>';
      }).join('')
    + '</div>';
}

function activityFeedTone(type) {
  // Maps event type → icon-color modifier for visual scanning.
  // Quest creation = rose (action required). Mastery = mint (success).
  // Quest completed = mint (a win to celebrate). Exam = amber (milestone).
  // Default sage for quiz / note.
  switch (type) {
    case 'quest_created':   return 'rose';
    case 'quest_completed': return 'mint';
    case 'mastery_gained':  return 'mint';
    case 'exam_result':     return 'amber';
    default:                return null;
  }
}

function activityFeedIcon(type) {
  // 16x16 stroke-1.75 currentColor — matches the rest of the icon set.
  switch (type) {
    case 'quiz_attempt':
      // Checkmark in circle
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>';
    case 'mastery_gained':
      // Five-point star
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    case 'quest_created':
      // Flag (rose accent)
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>';
    case 'quest_completed':
      // Shield-check (mint accent — quest finished)
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>';
    case 'study_note':
      // Bookmark
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
    case 'exam_result':
      // Trophy
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';
    default:
      // Generic dot
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>';
  }
}

/* ─── WEEKLY DIGEST (Phase 3) ─────────────────────────────────────────────
   Pulls /api/weekly-digest (server-side compute, 5-min in-memory cache
   per parent) and renders three stat blocks plus a one-sentence
   last-week pacer at the bottom of the 5-col aside. Empty state shows
   zeros + a "week resets each Monday" nudge. */

async function loadWeeklyDigest() {
  const content  = document.getElementById('digest-content');
  const rangeEl  = document.getElementById('digest-range');
  if (!content) return;
  try {
    const sb = await getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;
    const res = await fetch('/api/weekly-digest', {
      headers: { 'Authorization': 'Bearer ' + session.access_token },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (rangeEl && data.this_week && data.this_week.range_label) {
      rangeEl.textContent = data.this_week.range_label;
    }
    renderWeeklyDigest(data);
  } catch (err) {
    console.error('[weekly-digest] load error:', err && err.message);
    content.innerHTML = '<p class="digest-empty">Weekly summary unavailable right now.</p>';
  }
}

function renderWeeklyDigest(data) {
  const content = document.getElementById('digest-content');
  if (!content) return;
  const tw = (data && data.this_week) || { questions: 0, mastery_gains: 0, streak_days: 0 };
  const lw = (data && data.last_week) || { questions: 0, mastery_gains: 0 };
  const empty = (tw.questions === 0 && tw.mastery_gains === 0 && tw.streak_days === 0);

  const escape = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Last-week pacer — only shown if last week has any signal
  let pacer = '';
  if (lw.questions > 0 || lw.mastery_gains > 0) {
    const qLbl  = lw.questions    + ' question'      + (lw.questions    === 1 ? '' : 's');
    const mLbl  = lw.mastery_gains + ' level gained' + (lw.mastery_gains === 1 ? '' : 's');
    pacer = '<p class="digest-pacer">Last week\'s pace: <strong>' + escape(qLbl) + '</strong>, ' + escape(mLbl) + '.</p>';
  }

  content.innerHTML = ''
    + '<div class="digest-stats">'
      + '<div class="digest-stat">'
        + '<div class="digest-stat__val digest-stat__val--rose">'  + escape(tw.questions)     + '</div>'
        + '<div class="digest-stat__lbl">Questions</div>'
      + '</div>'
      + '<div class="digest-stat">'
        + '<div class="digest-stat__val digest-stat__val--mint">'  + escape(tw.mastery_gains) + '</div>'
        + '<div class="digest-stat__lbl">Levels gained</div>'
      + '</div>'
      + '<div class="digest-stat">'
        + '<div class="digest-stat__val digest-stat__val--amber">' + escape(tw.streak_days)   + '</div>'
        + '<div class="digest-stat__lbl">Active days</div>'
      + '</div>'
    + '</div>'
    + (empty
        ? '<p class="digest-empty">No activity this week yet. The week resets each Monday.</p>'
        : pacer);
}

/* ─── CELEBRATION TOAST (Phase 5) ─────────────────────────────────────────
   Once per dashboard visit: if any learner unlocked a new badge or
   crossed AL3+ since profile.dashboard_last_seen_at, show a top-right
   toast. Multiple unlocks collapse into a single toast with a "View →"
   link that opens a modal listing them all.

   The timestamp is bumped to NOW after the query runs (regardless of
   whether unlocks were found) so the toast cannot re-appear on a
   refresh — engagement, not nag. */

/* ════════════════════════════════════════════════════════════════════════════
   7. CELEBRATIONS
   ════════════════════════════════════════════════════════════════════════════ */

let _celebrationItems = [];

async function loadCelebrations(profile) {
  if (!profile) return;
  // currentStudents is populated by loadStudents (top-level let in this
  // script scope). loadCelebrations runs AFTER the loadStudents-bearing
  // Promise.all resolves, so this is safe.
  const students = Array.isArray(currentStudents) ? currentStudents : [];
  if (students.length === 0) {
    // Still bump the marker so a future first-learner-add doesn't
    // surface stale events.
    await bumpDashboardSeenAt();
    return;
  }
  const sids = students.map(s => s.id);
  const sinceIso = profile.dashboard_last_seen_at;
  // Defensive — DEFAULT now() means this should be set after migration 025
  if (!sinceIso) {
    await bumpDashboardSeenAt();
    return;
  }

  try {
    const sb = await getSupabase();
    const [badgesRes, masteryRes] = await Promise.all([
      sb.from('student_badges')
        .select('id, student_id, badge_id, earned_at, badge_definitions(name, rarity, icon_url)')
        .in('student_id', sids)
        .gt('earned_at', sinceIso)
        .order('earned_at', { ascending: false })
        .limit(20),
      sb.from('mastery_levels')
        .select('id, student_id, subject, topic, probability, last_updated')
        .in('student_id', sids)
        .gte('probability', 0.70)
        .gt('last_updated', sinceIso)
        .order('last_updated', { ascending: false })
        .limit(20),
    ]);

    const studentName = id => {
      const s = students.find(x => x.id === id);
      return (s && s.name) || 'Your child';
    };

    const items = [];
    (badgesRes.data || []).forEach(b => {
      const def = b.badge_definitions || {};
      items.push({
        type:         'badge',
        student_name: studentName(b.student_id),
        title:        `${studentName(b.student_id)} earned ${def.name || 'a new badge'}`,
        detail:       'Badge unlocked' + (def.rarity ? ` · ${def.rarity}` : ''),
        occurred_at:  b.earned_at,
      });
    });
    (masteryRes.data || []).forEach(m => {
      const band = probabilityToALBand(m.probability || 0);
      items.push({
        type:         'mastery',
        student_name: studentName(m.student_id),
        title:        `${studentName(m.student_id)} reached ${band} on ${m.topic}`,
        detail:       'Mastery level',
        occurred_at:  m.last_updated,
      });
    });

    // Always bump — even if zero items found. This is the entire point
    // of the marker: "once per visit, not per session."
    await bumpDashboardSeenAt();

    if (items.length === 0) return;
    items.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
    _celebrationItems = items;
    renderCelebrationToast(items);
  } catch (err) {
    console.error('[celebrations] load error:', err && err.message);
    // Don't bump on error — we'd lose the events
  }
}

async function bumpDashboardSeenAt() {
  try {
    const sb = await getSupabase();
    const nowIso = new Date().toISOString();
    await sb.from('profiles')
      .update({ dashboard_last_seen_at: nowIso })
      .eq('id', window.userProfile.id);
    // Mirror so a subsequent loadCelebrations in the same session uses
    // the new marker.
    if (window.userProfile) window.userProfile.dashboard_last_seen_at = nowIso;
  } catch (err) {
    console.error('[celebrations] bump failed (non-fatal):', err && err.message);
  }
}

function renderCelebrationToast(items) {
  // Clean up any prior toast from this session
  const existing = document.getElementById('celebration-toast');
  if (existing) existing.remove();

  const escape = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const isCombined = items.length > 1;
  const eyebrow = isCombined ? 'New unlocks' : 'New achievement';
  const summary = isCombined
    ? `${items.length} unlocks since your last visit`
    : items[0].title;

  // Sparkle icon — same shape as the onboarding step 3 sparkle
  const sparkleSvg =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M12 2l2.39 5.45L20 8.27l-4 3.91L17.18 18 12 15.27 6.82 18 8 12.18 4 8.27l5.61-.82z"/>'
    + '</svg>';

  const toast = document.createElement('div');
  toast.className = 'celebration-toast';
  toast.id = 'celebration-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = ''
    + '<div class="celebration-toast__icon" aria-hidden="true">' + sparkleSvg + '</div>'
    + '<div class="celebration-toast__body">'
      + '<div class="celebration-toast__eyebrow">' + escape(eyebrow) + '</div>'
      + '<div class="celebration-toast__summary">' + escape(summary) + '</div>'
    + '</div>'
    + '<div class="celebration-toast__actions">'
      + (isCombined
          ? '<button class="celebration-toast__view" onclick="window.openCelebrationsModal()">View →</button>'
          : '')
      + '<button class="celebration-toast__close" onclick="window.dismissCelebrationToast()" aria-label="Dismiss">×</button>'
    + '</div>';
  document.body.appendChild(toast);

  // Slide in next frame so the transition has somewhere to go
  requestAnimationFrame(() => {
    const el = document.getElementById('celebration-toast');
    if (el) el.classList.add('is-visible');
  });

  // Auto-dismiss after 6s — only if the user hasn't already dismissed
  setTimeout(() => {
    const el = document.getElementById('celebration-toast');
    if (el) window.dismissCelebrationToast();
  }, 6000);
}

window.dismissCelebrationToast = function () {
  const el = document.getElementById('celebration-toast');
  if (!el) return;
  el.classList.remove('is-visible');
  // Remove from the DOM after the slide-out finishes
  setTimeout(() => { if (el && el.parentNode) el.remove(); }, 320);
};

window.openCelebrationsModal = function () {
  const content = document.getElementById('celebrations-modal-content');
  const items = _celebrationItems || [];
  if (!content) return;

  const escape = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const sparkleSvg =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M12 2l2.39 5.45L20 8.27l-4 3.91L17.18 18 12 15.27 6.82 18 8 12.18 4 8.27l5.61-.82z"/>'
    + '</svg>';
  const starSvg =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'
    + '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'
    + '</svg>';

  content.innerHTML = items.map(it => {
    const iconSvg  = it.type === 'mastery' ? starSvg : sparkleSvg;
    const iconCls  = it.type === 'mastery' ? 'celebrations-list__icon celebrations-list__icon--mint' : 'celebrations-list__icon';
    return ''
      + '<div class="celebrations-list__row">'
        + '<div class="' + iconCls + '" aria-hidden="true">' + iconSvg + '</div>'
        + '<div class="celebrations-list__body">'
          + '<div class="celebrations-list__title">' + escape(it.title) + '</div>'
          + '<div class="celebrations-list__meta">' + escape(it.detail) + ' · ' + escape(relativeTime(it.occurred_at)) + '</div>'
        + '</div>'
      + '</div>';
  }).join('');

  const modal = document.getElementById('celebrationsModal');
  if (modal) modal.classList.add('is-open');
  // Dismiss the toast since the user is now viewing the full list
  window.dismissCelebrationToast();
};

function relativeTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60 * 1000)        return 'Just now';
  if (diff < 60 * 60 * 1000)   return Math.floor(diff / 60000) + 'm ago';
  if (diff < 24 * 3600 * 1000) return Math.floor(diff / 3600000) + 'h ago';
  if (diff < 7  * 86400000)    return Math.floor(diff / 86400000) + 'd ago';
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
}

function probabilityToALBand(p) {
  // Mirrors AL band thresholds in the question bank docs
  if (p >= 0.90) return 'AL1';
  if (p >= 0.80) return 'AL2';
  if (p >= 0.70) return 'AL3';
  if (p >= 0.60) return 'AL4';
  if (p >= 0.50) return 'AL5';
  if (p >= 0.40) return 'AL6';
  if (p >= 0.25) return 'AL7';
  return 'AL8';
}

async function computeFamilyStreak(studentIds) {
  if (!studentIds || studentIds.length === 0) return { familyStreak: 0, lastActiveLabel: null };
  try {
    const sb = await getSupabase();
    const { data } = await sb.from('daily_usage')
      .select('date, student_id')
      .in('student_id', studentIds)
      .order('date', { ascending: false })
      .limit(60);

    if (!data || data.length === 0) return { familyStreak: 0, lastActiveLabel: null };

    // Collapse to a set of unique dates the family was active
    const dates = Array.from(new Set(data.map(r => r.date))).sort().reverse();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let cursor = new Date(today);
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() === cursor.getTime()) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (i === 0 && (today.getTime() - d.getTime()) === 86400000) {
        // Family was active yesterday but not today — streak still counts, just lagging by a day
        streak++;
        cursor = new Date(d);
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    const lastActive = dates[0] ? new Date(dates[0]) : null;
    const lastActiveLabel = lastActive ? fmtRelative(lastActive) : null;
    return { familyStreak: streak, lastActiveLabel };
  } catch (e) {
    return { familyStreak: 0, lastActiveLabel: null };
  }
}

/* ─── PHOTO UPLOAD (preserved) ──────────────────────────────────────────── */
/* ════════════════════════════════════════════════════════════════════════════
   8. PHOTO UPLOAD + GRID RENDER
   ════════════════════════════════════════════════════════════════════════════ */

window.handlePhotoUpload = async (event, studentId) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const sb = await getSupabase();
    const fileName = `${studentId}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await sb.storage.from('avatars').upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(fileName);
    await sb.from('students').update({ photo_url: publicUrl }).eq('id', studentId);
    await loadStudents();
  } catch (err) { alert('Failed to upload photo: ' + err.message); }
};

/* ─── RENDER LEARNER GRID — architect-scholar treatment ─────────────────── */
function renderGrid(unreadMap, masteryMap, activityMap) {
  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = '';

  if (currentStudents.length === 0) {
    // Phase 4 — 3-step illustrated walkthrough. Step 1 is the active CTA;
    // steps 2 + 3 are dimmed previews of what unlocks after step 1
    // completes. Once a learner is added, this block is replaced by the
    // standard learner cards grid (next branch below), so steps 2 + 3
    // only ever appear in this empty state.
    grid.innerHTML = `
      <div class="onboarding-walkthrough" role="list" aria-label="Get started in 3 steps">

        <!-- Step 1 — Add your child (active) -->
        <div class="card-glass onboarding-step onboarding-step--active" role="listitem">
          <span class="onboarding-step__num">Step 01</span>
          <div class="onboarding-step__icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <h3 class="onboarding-step__title">Add your child</h3>
          <p class="onboarding-step__text">Set up a profile in 30 seconds.</p>
          <a href="/pages/setup.html" class="btn btn-primary btn-sm onboarding-step__cta">Get started</a>
        </div>

        <!-- Step 2 — Pick a subject (locked) -->
        <div class="card-glass onboarding-step onboarding-step--locked" role="listitem" aria-disabled="true">
          <span class="onboarding-step__num">Step 02</span>
          <div class="onboarding-step__icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <h3 class="onboarding-step__title">Pick a subject</h3>
          <p class="onboarding-step__text">Choose Maths, Science, or English to start practising.</p>
          <span class="onboarding-step__hint">Unlocks after step 1</span>
        </div>

        <!-- Step 3 — Start practising (locked) -->
        <div class="card-glass onboarding-step onboarding-step--locked" role="listitem" aria-disabled="true">
          <span class="onboarding-step__num">Step 03</span>
          <div class="onboarding-step__icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2l2.39 5.45L20 8.27l-4 3.91L17.18 18 12 15.27 6.82 18 8 12.18 4 8.27l5.61-.82z"/>
            </svg>
          </div>
          <h3 class="onboarding-step__title">Start practising</h3>
          <p class="onboarding-step__text">Miss Wena will guide them through their first quiz.</p>
          <span class="onboarding-step__hint">Unlocks after step 1</span>
        </div>

      </div>`;
    return;
  }

  const SUBJECTS = ['Mathematics', 'Science', 'English'];
  const SUBJECT_LABELS = { Mathematics: 'M', Science: 'S', English: 'E' };

  currentStudents.forEach(student => {
    const initials = (student.name || '?').charAt(0).toUpperCase();
    const unreadCount = unreadMap ? (unreadMap[student.id] || 0) : 0;
    const mastery = masteryMap[student.id] || {};
    const activity = activityMap[student.id] || {};

    const avatarHtml = student.photo_url
      ? `<div class="learner-card__avatar"><img src="${escapeHtml(student.photo_url)}" alt="${escapeHtml(student.name)}" /></div>`
      : `<div class="learner-card__avatar">${initials}</div>`;

    // AL strip — one pill per subject. Empty pills if no mastery data yet.
    const alPills = SUBJECTS.map(subj => {
      const band = mastery[subj];
      const title = band ? `${subj}: ${band}` : `${subj}: no data yet`;
      return `<div class="al-pill" data-band="${band || ''}" title="${title}" aria-label="${title}">
                ${band ? '<div class="al-pill__fill"></div>' : ''}
              </div>`;
    }).join('');

    // Activity row: last-active text. (No streak chip per-student in this iteration —
    // family streak shown in health strip; per-student streak deferred to Phase next.)
    let lastActiveLabel = '';
    if (activity.lastActive) {
      lastActiveLabel = `<span class="last-active">Active ${fmtRelative(activity.lastActive)}</span>`;
    } else {
      lastActiveLabel = `<span class="last-active last-active--idle">No activity yet</span>`;
    }

    const notesDot = unreadCount > 0
      ? `<span class="learner-card__notes-dot" title="${unreadCount} unread note${unreadCount > 1 ? 's' : ''}"></span>`
      : '';

    const subjectTag = student.selected_subject
      ? `<span class="badge badge-neutral" style="font-size: 10px;">${escapeHtml(student.selected_subject)}</span>`
      : '';

    const card = document.createElement('article');
    card.className = 'card-glass learner-card';
    card.innerHTML = `
      ${notesDot}
      <header class="learner-card__head">
        <div class="learner-card__identity">
          ${avatarHtml}
          <div class="learner-card__name-block">
            <div class="learner-card__name">${escapeHtml(student.name)}</div>
            <div class="learner-card__meta">
              <span class="badge badge-sage" style="font-size: 10px;">${escapeHtml(student.level || '—')}</span>
              ${subjectTag}
            </div>
          </div>
        </div>
        <div class="kebab-wrap" onclick="event.stopPropagation()">
          <button class="kebab-btn" onclick="window.toggleDropdown(event, '${student.id}')" aria-label="Learner options">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
          <div id="dropdown-${student.id}" class="context-menu">
            <input type="file" id="photo-upload-${student.id}" class="hidden" accept="image/*" onchange="handlePhotoUpload(event, '${student.id}')" style="display: none;">
            <button onclick="document.getElementById('photo-upload-${student.id}').click(); window.toggleDropdown(event, '${student.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Upload photo
            </button>
            <button onclick="window.openEditModal('${student.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit details
            </button>
            <button class="text-danger" onclick="window.openDeleteModal('${student.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Remove
            </button>
          </div>
        </div>
      </header>

      <div class="al-strip" aria-label="Per-subject mastery">
        <span class="al-strip__label">AL</span>
        ${alPills}
      </div>

      <div class="activity-row">
        ${lastActiveLabel}
      </div>

      <button class="backpack-btn" onclick="openBackpackModal('${student.id}')">
        <span class="backpack-btn__inner">
          <svg class="backpack-btn__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 10v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10"/>
            <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4"/>
            <path d="M9 6V4a3 3 0 0 1 6 0v2"/>
            <line x1="9" y1="14" x2="15" y2="14"/>
          </svg>
          Backpack
        </span>
        ${unreadCount > 0
          ? `<span class="backpack-btn__count">${unreadCount} new</span>`
          : `<span class="backpack-btn__hint">Notes</span>`}
      </button>

      <a href="/pages/subjects.html?student=${student.id}" class="btn btn-primary learner-card__cta">Enter lab →</a>
    `;
    grid.appendChild(card);
  });
}

/* ─── INTERACTIONS (preserved IDs and contracts) ─────────────────────────── */
/* ════════════════════════════════════════════════════════════════════════════
   9. INTERACTIONS + MODALS + EDIT/DELETE
   ════════════════════════════════════════════════════════════════════════════ */

window.toggleDropdown = (e, id) => {
  e.stopPropagation();
  const dropdown = document.getElementById(`dropdown-${id}`);
  const isHidden = !dropdown.classList.contains('is-open');
  document.querySelectorAll('.context-menu').forEach(d => d.classList.remove('is-open'));
  if (isHidden) dropdown.classList.add('is-open');
};

document.addEventListener('click', () => {
  document.querySelectorAll('.context-menu').forEach(d => d.classList.remove('is-open'));
});

window.closeModals = () => {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('is-open'));
  targetStudentId = null;
};
window.closeModalOnBgClick = (e, id) => { if (e.target.id === id) window.closeModals(); };

window.openEditModal = (id) => {
  const student = currentStudents.find(s => s.id === id);
  if (!student) return;
  targetStudentId = id;
  document.getElementById('editName').value = student.name;
  document.getElementById('editLevel').value = student.level;
  document.getElementById('editModal').classList.add('is-open');
  document.querySelectorAll('.context-menu').forEach(d => d.classList.remove('is-open'));
};

window.openDeleteModal = (id) => {
  const student = currentStudents.find(s => s.id === id);
  if (!student) return;
  targetStudentId = id;
  document.getElementById('deleteTargetName').textContent = student.name;
  document.getElementById('deleteModal').classList.add('is-open');
  document.querySelectorAll('.context-menu').forEach(d => d.classList.remove('is-open'));
};

window.saveEdit = async () => {
  const name = document.getElementById('editName').value.trim();
  const level = document.getElementById('editLevel').value;
  if (!name || !level || !targetStudentId) return;
  const btn = document.getElementById('saveEditBtn');
  btn.disabled = true; btn.textContent = 'Saving…';
  const sb = await getSupabase();
  await sb.from('students').update({ name, level }).eq('id', targetStudentId);
  await loadStudents();
  closeModals();
  btn.disabled = false; btn.textContent = 'Save changes';
};

window.confirmDelete = async () => {
  if (!targetStudentId) return;
  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true; btn.textContent = 'Deleting…';
  const sb = await getSupabase();
  await sb.from('students').delete().eq('id', targetStudentId);
  await loadStudents();
  closeModals();
  btn.disabled = false; btn.textContent = 'Yes, delete';
};

document.getElementById('manageBillingBtn').addEventListener('click', () => {
  window.location.href = '/pages/account.html';
});

/* ─── BACKPACK ───────────────────────────────────────────────────────────── */
/* ════════════════════════════════════════════════════════════════════════════
   10. STUDY NOTES BACKPACK + BOOT TRIGGER
   ════════════════════════════════════════════════════════════════════════════ */

window.openBackpackModal = async (studentId) => {
  const content = document.getElementById('backpackContent');
  content.innerHTML = `
    <div style="text-align: center; padding: var(--space-5);">
      <div class="spinner-sm"></div>
      <p style="font-size: var(--text-xs); color: var(--text-muted); margin-top: var(--space-2);">Opening backpack…</p>
    </div>`;
  document.getElementById('backpackModal').classList.add('is-open');
  try {
    const sb = await getSupabase();
    const { data: notes } = await sb.from('study_notes').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
    if (!notes || notes.length === 0) {
      content.innerHTML = `
        <div style="text-align: center; padding: var(--space-6); background: var(--surface-container-low); border-radius: var(--radius-md);">
          <p style="font-size: var(--text-sm); color: var(--text-main); font-weight: 600; margin: 0 0 var(--space-2) 0;">Backpack is empty.</p>
          <p style="font-size: var(--text-xs); color: var(--text-muted); margin: 0;">Ask Miss Wena questions and save notes to build the collection.</p>
        </div>`;
      return;
    }
    window.cachedNotes = notes;
    content.innerHTML = notes.map(n => `
      <div class="note-item ${!n.is_read ? 'note-item--unread' : ''}" onclick="viewStudyNote('${n.id}')">
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; gap: var(--space-1); align-items: center; margin-bottom: 4px;">
            <span class="badge badge-sage" style="font-size: 10px;">${escapeHtml(n.subject)}</span>
            ${!n.is_read ? `<span class="badge badge-rose" style="font-size: 10px;">New</span>` : ''}
          </div>
          <div style="font-weight: 600; color: var(--text-main); font-size: var(--text-sm); line-height: 1.3;">${escapeHtml(n.title)}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
            ${new Date(n.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })} · ${escapeHtml(n.topic).replace(/-/g, ' ')}
          </div>
        </div>
        <span class="note-item__arrow">→</span>
      </div>
    `).join('');
  } catch (e) {
    content.innerHTML = `<p style="color: var(--brand-rose); font-size: var(--text-sm); text-align: center;">Failed to load notes.</p>`;
  }
};

window.viewStudyNote = async (noteId) => {
  const note = (window.cachedNotes || []).find(n => n.id === noteId);
  if (!note) return;
  document.getElementById('noteTitleView').textContent = note.title;
  document.getElementById('noteSubjectBadge').textContent = note.subject.toUpperCase();
  document.getElementById('noteHtmlView').innerHTML = note.content_html;
  document.getElementById('noteViewerModal').classList.add('is-open');
  if (!note.is_read) {
    const sb = await getSupabase();
    await sb.from('study_notes').update({ is_read: true }).eq('id', noteId);
    note.is_read = true;
  }
};

/* ── trailing boot() call — moved here from the original head <script type="module"> ── */
boot();
