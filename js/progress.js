/**
 * progress.js
 * Loads quiz history from Supabase and renders progress stats for
 * the current student on pages/progress.html.
 *
 * Stats shown:
 *   - Total questions answered, overall accuracy %, current streak
 *   - Subject accuracy bars (Mathematics, Science, English)
 *   - Weak topics (5 topics with lowest accuracy)
 *   - Recent quiz history (last 8 attempts)
 *
 * TEST: Log in as a user who has completed at least one quiz.
 *   Open pages/progress.html and verify stats render correctly.
 */

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const loadingEl = document.getElementById('progress-loading');
  const statsEl   = document.getElementById('progress-stats');
  const emptyEl   = document.getElementById('progress-empty');
  const errorEl   = document.getElementById('progress-error');

  try {
    const user = await getCurrentUser();
    if (!user) return; // auth.js will redirect

    const db = await getSupabase();

    // Get first student profile for this parent
    const { data: students, error: stuErr } = await db
      .from('students')
      .select('id, name, level')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1);

    if (stuErr) throw stuErr;

    if (!students || students.length === 0) {
      // No student profile yet — show empty state
      loadingEl.hidden = true;
      emptyEl.hidden   = false;
      return;
    }

    const student = students[0];
    updateStudentLabel(student);

    // Fetch all quiz attempts for this student
    const { data: attempts, error: attErr } = await db
      .from('quiz_attempts')
      .select('id, subject, topic, score, total_questions, completed_at')
      .eq('student_id', student.id)
      .order('completed_at', { ascending: false });

    if (attErr) throw attErr;

    if (!attempts || attempts.length === 0) {
      loadingEl.hidden = true;
      emptyEl.hidden   = false;
      return;
    }

    // ── Calculate stats ──────────────────────────────────────────
    const totalQuestions = attempts.reduce((s, a) => s + (a.total_questions || 0), 0);
    const totalCorrect   = attempts.reduce((s, a) => s + (a.score || 0), 0);
    const overallPct     = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;
    const streak = calculateStreak(attempts);

    // Per-subject accuracy
    const subjects = ['mathematics', 'science', 'english'];
    const subjectStats = {};
    subjects.forEach(sub => {
      const subAttempts = attempts.filter(a => a.subject?.toLowerCase() === sub);
      const sq = subAttempts.reduce((s, a) => s + (a.total_questions || 0), 0);
      const sc = subAttempts.reduce((s, a) => s + (a.score || 0), 0);
      subjectStats[sub] = {
        accuracy: sq > 0 ? Math.round((sc / sq) * 100) : null,
        quizzes:  subAttempts.length,
      };
    });

    // Weak topics — group by topic, calc accuracy, sort ascending
    const topicMap = {};
    attempts.forEach(a => {
      if (!a.topic) return;
      const key = `${a.subject}::${a.topic}`;
      if (!topicMap[key]) topicMap[key] = { subject: a.subject, topic: a.topic, correct: 0, total: 0 };
      topicMap[key].correct += a.score || 0;
      topicMap[key].total   += a.total_questions || 0;
    });
    const weakTopics = Object.values(topicMap)
      .filter(t => t.total >= 5) // minimum 5 questions for meaningful stat
      .map(t => ({ ...t, pct: Math.round((t.correct / t.total) * 100) }))
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5);

    // ── Render ────────────────────────────────────────────────────
    renderSummaryStats(totalQuestions, overallPct, streak);
    renderSubjectBars(subjectStats);
    if (weakTopics.length) renderWeakTopics(weakTopics);
    renderRecentHistory(attempts.slice(0, 8));

    loadingEl.hidden = true;
    statsEl.hidden   = false;

  } catch (err) {
    console.error('[progress]', err);
    if (loadingEl) loadingEl.hidden = true;
    if (errorEl) {
      errorEl.hidden      = false;
      errorEl.textContent = 'Could not load progress data. Please try again.';
    }
  }
}

// ── Stat renderers ─────────────────────────────────────────────────────────────

function updateStudentLabel(student) {
  const el = document.getElementById('student-name');
  if (el) el.textContent = student.name || 'Student';
}

function renderSummaryStats(total, pct, streak) {
  setText('stat-total',    total.toLocaleString());
  setText('stat-accuracy', pct + '%');
  setText('stat-streak',   streak + (streak === 1 ? ' day' : ' days'));

  // Colour-code accuracy
  const accEl = document.getElementById('stat-accuracy');
  if (accEl) {
    accEl.style.color = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)';
  }
}

function renderSubjectBars(stats) {
  const container = document.getElementById('subject-bars');
  if (!container) return;
  container.innerHTML = '';

  const labels = { mathematics: 'Mathematics', science: 'Science', english: 'English' };
  const colours = {
    mathematics: 'var(--maths-colour, #4338ca)',
    science:     'var(--science-colour, #0f766e)',
    english:     'var(--english-colour, #b45309)',
  };

  Object.entries(stats).forEach(([sub, data]) => {
    const pct = data.accuracy;
    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom:var(--space-5);';

    const labelRow = document.createElement('div');
    labelRow.className = 'flex gap-2';
    labelRow.style.cssText = 'justify-content:space-between; margin-bottom:var(--space-2);';

    const nameSpan = document.createElement('span');
    nameSpan.style.fontWeight = '500';
    nameSpan.textContent      = labels[sub];

    const pctSpan = document.createElement('span');
    pctSpan.style.color = 'var(--text-secondary)';
    pctSpan.style.fontSize = '0.875rem';
    pctSpan.textContent = pct !== null ? `${pct}% (${data.quizzes} ${data.quizzes === 1 ? 'quiz' : 'quizzes'})` : 'No quizzes yet';

    labelRow.append(nameSpan, pctSpan);

    const track = document.createElement('div');
    track.className = 'quiz-progress-bar';

    const fill = document.createElement('div');
    fill.className = 'quiz-progress-fill';
    fill.style.cssText = `width:${pct ?? 0}%; background:${colours[sub]}; transition:width 0.8s cubic-bezier(0.16,1,0.3,1);`;

    track.appendChild(fill);
    row.append(labelRow, track);
    container.appendChild(row);
  });
}

function renderWeakTopics(topics) {
  const container = document.getElementById('weak-topics');
  if (!container) return;
  container.innerHTML = '';

  const subLabels = { mathematics: 'Maths', science: 'Science', english: 'English' };

  topics.forEach(t => {
    const row = document.createElement('div');
    row.className = 'flex gap-3 items-center';
    row.style.cssText = 'padding: var(--space-3) 0; border-bottom: 1px solid var(--border);';

    // Accuracy badge
    const badge = document.createElement('span');
    badge.className = `badge badge-${t.pct >= 80 ? 'success' : t.pct >= 60 ? 'amber' : 'danger'}`;
    badge.style.cssText = 'min-width:44px; justify-content:center;';
    badge.textContent   = `${t.pct}%`;

    // Topic text
    const info = document.createElement('div');
    info.style.flex = '1';

    const topicName = document.createElement('span');
    topicName.style.fontWeight = '500';
    topicName.textContent = t.topic;

    const subTag = document.createElement('span');
    subTag.className = 'text-secondary text-sm';
    subTag.style.marginLeft = 'var(--space-2)';
    subTag.textContent = subLabels[t.subject?.toLowerCase()] || t.subject;

    info.append(topicName, subTag);
    row.append(badge, info);

    // "Practise" link
    const link = document.createElement('a');
    link.href      = `subjects.html`;
    link.className = 'btn btn-secondary btn-sm';
    link.textContent = 'Practise';
    row.appendChild(link);

    container.appendChild(row);
  });
}

function renderRecentHistory(attempts) {
  const container = document.getElementById('recent-history');
  if (!container) return;
  container.innerHTML = '';

  const subLabels = { mathematics: 'Mathematics', science: 'Science', english: 'English' };

  attempts.forEach(a => {
    const pct = a.total_questions > 0
      ? Math.round((a.score / a.total_questions) * 100)
      : 0;

    const row = document.createElement('div');
    row.className = 'flex gap-3 items-center';
    row.style.cssText = 'padding: var(--space-3) 0; border-bottom: 1px solid var(--border); flex-wrap:wrap; row-gap:var(--space-2);';

    // Date
    const dateEl = document.createElement('span');
    dateEl.className   = 'text-secondary text-sm';
    dateEl.style.cssText = 'min-width:80px;';
    dateEl.textContent = formatDate(a.completed_at);

    // Subject + topic
    const info = document.createElement('div');
    info.style.flex = '1';
    const subEl = document.createElement('span');
    subEl.style.fontWeight = '500';
    subEl.textContent = subLabels[a.subject?.toLowerCase()] || a.subject || 'Quiz';
    const topicEl = document.createElement('span');
    topicEl.className = 'text-secondary text-sm';
    topicEl.style.marginLeft = 'var(--space-2)';
    topicEl.textContent = a.topic ? `· ${a.topic}` : '';
    info.append(subEl, topicEl);

    // Score
    const scoreEl = document.createElement('span');
    scoreEl.style.cssText = `font-weight:600; color:${pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)'};`;
    scoreEl.textContent = `${a.score}/${a.total_questions}`;

    row.append(dateEl, info, scoreEl);
    container.appendChild(row);
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Counts the current streak of consecutive days with at least one quiz attempt.
 * A streak counts if the most recent activity was today or yesterday.
 */
function calculateStreak(attempts) {
  if (!attempts.length) return 0;

  const uniqueDates = [...new Set(
    attempts.map(a => a.completed_at.slice(0, 10))
  )].sort().reverse(); // newest first

  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Streak only counts if activity includes today or yesterday
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diff = Math.round((prev - curr) / 86400000);
    if (diff === 1) { streak++; } else { break; }
  }
  return streak;
}

/** Formats an ISO timestamp as a human-readable short date. */
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
}

/** Safely sets textContent on an element by ID. */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
