/**
 * progress.js
 * Loads quiz history from Supabase and renders progress stats for
 * the current student on pages/progress.html.
 *
 * Stats shown:
 *   - Active Remedial Quest (Quest Map card — Smart Remedial Quests feature)
 *   - Total questions answered, overall accuracy %, current streak
 *   - Subject accuracy bars (Mathematics, Science, English)
 *   - Weak topics (5 topics with lowest accuracy) + Generate Quest buttons
 *   - Recent quiz history (last 8 attempts)
 *   - Exam performance trends (WA / EOY / Prelim)
 *
 * TEST: Log in as a user who has completed at least one quiz.
 *   Open pages/progress.html and verify stats render correctly.
 *   To test quest: click "+ Generate Quest" on a weak topic, verify quest map appears.
 */

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const loadingEl = document.getElementById('progress-loading');
  const statsEl   = document.getElementById('progress-stats') || document.getElementById('progress-content');
  const emptyEl   = document.getElementById('progress-empty');
  const errorEl   = document.getElementById('progress-error');

  try {
    const db   = await getSupabase();
    const { data: { user }, error: userErr } = await db.auth.getUser();
    if (userErr) throw userErr;
    if (!user) return; // guardPage in the module tag will redirect

    // Grab session access token for API calls (generate-quest endpoint)
    const { data: { session } } = await db.auth.getSession();

    // ── Quest return tracking: detect ?quest_id=X&step=N from deep-link return ──
    const urlParams       = new URLSearchParams(window.location.search);
    const returnQuestId   = urlParams.get('quest_id');
    const returnStep      = urlParams.get('step');
    const urlStudentId    = urlParams.get('student');

    if (returnQuestId && returnStep !== null) {
      // Advance before loading the rest so the UI reflects the new state
      await advanceQuestStep(db, returnQuestId, parseInt(returnStep, 10));
      // Clean URL — remove quest tracking params but preserve ?student= if present
      const cleanParams = new URLSearchParams();
      if (urlStudentId) cleanParams.set('student', urlStudentId);
      const cleanSearch = cleanParams.toString() ? '?' + cleanParams.toString() : window.location.pathname;
      history.replaceState({}, '', cleanSearch || window.location.pathname);
    }

    // ── Fetch student profiles for this parent ────────────────────────────────
    const { data: students, error: stuErr } = await db
      .from('students')
      .select('id, name, level')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: true });

    if (stuErr) throw stuErr;

    if (!students || students.length === 0) {
      loadingEl.hidden = true;
      emptyEl.hidden   = false;
      return;
    }

    const student = students.find(s => s.id === urlStudentId) || students[0];

    if (students.length > 1) {
      populateStudentSelector(students, student.id);
    }

    updateStudentLabel(student);

    // ── Fetch quiz attempts ───────────────────────────────────────────────────
    const { data: attempts, error: attErr } = await db
      .from('quiz_attempts')
      .select('id, subject, topic, score, total_questions, time_taken_seconds, completed_at')
      .eq('student_id', student.id)
      .order('completed_at', { ascending: false });

    if (attErr) throw attErr;

    if (!attempts || attempts.length === 0) {
      loadingEl.hidden = true;
      emptyEl.hidden   = false;
      return;
    }

    // ── Fetch today's usage ───────────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);
    const { data: usageData } = await db
      .from('daily_usage')
      .select('questions_attempted')
      .eq('student_id', student.id)
      .eq('date', today)
      .maybeSingle();
    const questionsToday = usageData?.questions_attempted || 0;

    // ── Calculate stats ───────────────────────────────────────────────────────
    const totalQuestions = attempts.reduce((s, a) => s + (a.total_questions || 0), 0);
    const totalCorrect   = attempts.reduce((s, a) => s + (a.score || 0), 0);
    const overallPct     = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;
    const streak = calculateStreak(attempts);

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
      if (!topicMap[key]) topicMap[key] = { subject: a.subject, topic: a.topic, correct: 0, total: 0, lastAttemptId: a.id };
      topicMap[key].correct += a.score || 0;
      topicMap[key].total   += a.total_questions || 0;
    });
    const weakTopics = Object.values(topicMap)
      .filter(t => t.total >= 5)
      .map(t => ({ ...t, pct: Math.round((t.correct / t.total) * 100) }))
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5);

    // ── Fetch exam results ────────────────────────────────────────────────────
    const { data: examResults } = await db
      .from('exam_results')
      .select('id, subject, level, exam_type, score, total_marks, time_taken, completed_at')
      .eq('student_id', student.id)
      .order('completed_at', { ascending: false })
      .limit(20);

    // ── Fetch active remedial quest ───────────────────────────────────────────
    const activeQuest = await loadActiveQuest(db, student.id);

    // ── Render ────────────────────────────────────────────────────────────────
    renderSummaryStats(totalQuestions, overallPct, streak, questionsToday);
    renderSubjectBars(subjectStats);
    if (weakTopics.length) renderWeakTopics(weakTopics, activeQuest, student, session);
    renderRecentHistory(attempts.slice(0, 8));
    renderExamHistory(examResults || []);

    // Quest Map — shown above stat cards when an active quest exists
    if (activeQuest) {
      renderQuestMap(activeQuest, db);
    }
// ── Action Plan Aggregations (NEW UI) ─────────────────────────────────────
    const allActivity = [...(attempts || []), ...(examResults || [])];
    
    // Sort all activity from newest to oldest
    allActivity.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

    const totalSeconds = allActivity.reduce((sum, a) => sum + (a.time_taken || a.time_taken_seconds || 0), 0);
    
    // ── Apply Advanced 14-Day / 1000-Mark / 3-Paper Rule ──
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    
    // Overwrite legacy subjectStats with advanced tracking
    const advancedSubjectStats = { 
      mathematics: { earned: 0, total: 0, count: 0, quizzes: 0 }, 
      science: { earned: 0, total: 0, count: 0, quizzes: 0 }, 
      english: { earned: 0, total: 0, count: 0, quizzes: 0 } 
    };

    allActivity.forEach(act => {
      const sub = act.subject?.toLowerCase();
      if (!advancedSubjectStats[sub]) return;
      
      const stats = advancedSubjectStats[sub];
      
      // Enforce limits: Stop adding if we hit 1000 marks or 14 days
      const actDateMs = new Date(act.completed_at || act.created_at).getTime();
      if (stats.total >= 1000 || (nowMs - actDateMs > fourteenDaysMs)) return;
      
      const actTotal = act.total_marks || act.total_questions || 1;
      const actEarned = act.score || 0;
      
      stats.total += actTotal;
      stats.earned += actEarned;
      stats.count += 1; // Tracks number of papers/quizzes
      stats.quizzes = stats.count; // For legacy UI compatibility
    });
    
    let questionsMastered = 0;
    allActivity.forEach(a => {
      if (a.total_marks && a.score === a.total_marks && a.score > 0) questionsMastered += (a.total_questions || 1);
      else if (a.total_questions && a.score === a.total_questions && a.score > 0) questionsMastered += a.total_questions;
    });

    // ── Calculate Topics Improved (Last 7 Days vs Previous 7 Days) ──
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const topicStatsThisWeek = {};
    const topicStatsLastWeek = {};

    (attempts || []).forEach(q => { 
      if (!q.topic || q.topic === 'all') return;
      const key = `${q.subject}:${q.topic}`;
      const qDate = new Date(q.completed_at || q.created_at);

      if (qDate >= oneWeekAgo) {
        if (!topicStatsThisWeek[key]) topicStatsThisWeek[key] = { earned: 0, total: 0, subject: q.subject, topic: q.topic };
        topicStatsThisWeek[key].earned += q.score;
        topicStatsThisWeek[key].total += q.total_questions;
      } else {
        if (!topicStatsLastWeek[key]) topicStatsLastWeek[key] = { earned: 0, total: 0, subject: q.subject, topic: q.topic };
        topicStatsLastWeek[key].earned += q.score;
        topicStatsLastWeek[key].total += q.total_questions;
      }
    });

    let improvedText = "Keep practicing to track improvements!";
    for (const key in topicStatsThisWeek) {
      if (topicStatsLastWeek[key] && topicStatsLastWeek[key].total > 0 && topicStatsThisWeek[key].total > 0) {
        const pctThis = Math.round((topicStatsThisWeek[key].earned / topicStatsThisWeek[key].total) * 100);
        const pctLast = Math.round((topicStatsLastWeek[key].earned / topicStatsLastWeek[key].total) * 100);
        const alThis = getALBand(pctThis);
        const alLast = getALBand(pctLast);

        if (alThis < alLast) {
          const t = topicStatsThisWeek[key];
          improvedText = `<span style="text-transform:capitalize;">${t.subject}</span>: ${t.topic.replace(/-/g, ' ')} improved from ${alLast} to ${alThis}`;
          break; 
        }
      }
    }

    // Fire the new Action Plan renderer
    renderActionPlanUI(totalSeconds, questionsMastered, overallPct, advancedSubjectStats, weakTopics, student, session, activeQuest, allActivity, improvedText);

    loadingEl.hidden = true;
    statsEl.hidden   = false;

  } catch (err) {
    console.error('[progress] Full error:', err);
    console.error('[progress] Error message:', err?.message);
    console.error('[progress] Error code:', err?.code);
    if (loadingEl) loadingEl.hidden = true;
    if (errorEl) {
      errorEl.hidden      = false;
      errorEl.textContent = `Could not load progress data: ${err?.message || err}. Check console for details.`;
    }
  }
}

// ── Quest: load ────────────────────────────────────────────────────────────────

/**
 * Fetches the most recent active remedial quest for a student.
 * Returns the quest row or null if none exists.
 * @param {Object} db   - Supabase client
 * @param {string} studentId
 */
async function loadActiveQuest(db, studentId) {
  try {
    const { data, error } = await db
      .from('remedial_quests')
      .select('id, quest_title, subject, level, topic, steps, current_step, status, trigger_score, created_at')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[progress] Could not load active quest:', error.message);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// ── Quest: render map ──────────────────────────────────────────────────────────

/**
 * Renders the 3-node Quest Map card into #quest-map-section.
 * Shows completed nodes (mint), active node (rose), locked nodes (glass).
 * Appends quest tracking params to the CTA deep-link for return detection.
 * @param {Object} quest  - remedial_quests row
 * @param {Object} db     - Supabase client (for abandon action)
 */
function renderQuestMap(quest, db) {
  const section = document.getElementById('quest-map-section');
  if (!section) return;

  const steps       = quest.steps || [];
  const currentStep = quest.current_step || 0;

  // ── Card wrapper ────────────────────────────────────────────────────────────
  const card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'border-top: 3px solid var(--mint); margin-bottom: var(--space-6);';

  // ── Card header ─────────────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'card-header';
  header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap: var(--space-3);';

  const label = document.createElement('div');
  label.style.cssText = 'display:flex; align-items:center; gap: var(--space-3);';

  const eyebrow = document.createElement('span');
  eyebrow.className = 'section-label-tag';
  eyebrow.textContent = 'Active Quest';

  const titleEl = document.createElement('h3');
  titleEl.style.cssText = 'margin:0; font-size:1rem; font-weight:700;';
  titleEl.textContent = quest.quest_title;

  label.append(eyebrow, titleEl);

  const abandonBtn = document.createElement('button');
  abandonBtn.className = 'btn btn-ghost btn-sm';
  abandonBtn.style.color = 'var(--sage-light)';
  abandonBtn.textContent = 'Abandon';
  abandonBtn.setAttribute('aria-label', 'Abandon this quest');
  abandonBtn.addEventListener('click', () => abandonQuest(db, quest.id, section));

  header.append(label, abandonBtn);

  // ── Timeline ────────────────────────────────────────────────────────────────
  const body = document.createElement('div');
  body.className = 'card-body';

  const timeline = document.createElement('div');
  timeline.style.cssText = 'display:flex; align-items:center; gap:0; margin-bottom: var(--space-6);';

  steps.forEach((step, i) => {
    const isDone   = i < currentStep;
    const isActive = i === currentStep;

    // Node
    const node = document.createElement('div');
    node.style.cssText = `
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.875rem; font-weight: 700; font-family: 'JetBrains Mono', monospace;
      background: ${isDone ? 'var(--mint)' : isActive ? 'var(--rose)' : 'var(--glass)'};
      color: ${isDone ? 'var(--sage-darker)' : isActive ? 'var(--white)' : 'var(--sage-light)'};
      border: ${(!isDone && !isActive) ? '1.5px solid var(--glass-border)' : 'none'};
      position: relative; z-index: 1;
      box-shadow: ${isActive ? '0 0 0 3px rgba(183,110,121,0.2)' : ''};
    `;
    node.setAttribute('aria-label', `Day ${step.day}: ${isDone ? 'Complete' : isActive ? 'Active' : 'Locked'}`);
    node.textContent = isDone ? '✓' : String(step.day);

    timeline.appendChild(node);

    // Connector line (except after last node)
    if (i < steps.length - 1) {
      const line = document.createElement('div');
      line.style.cssText = `
        flex: 1; height: 2px;
        background: ${isDone ? 'var(--mint)' : 'var(--glass-border)'};
        transition: background 0.4s ease;
      `;
      timeline.appendChild(line);
    }
  });

  // ── Day labels below timeline ────────────────────────────────────────────────
  const dayLabels = document.createElement('div');
  dayLabels.style.cssText = 'display:flex; align-items:flex-start; margin-bottom: var(--space-5);';

  steps.forEach((step, i) => {
    const isActive = i === currentStep;
    const isDone   = i < currentStep;

    const labelWrap = document.createElement('div');
    labelWrap.style.cssText = `
      flex: 1; text-align: center;
      font-size: 0.75rem; font-weight: ${isActive ? '700' : '500'};
      color: ${isDone ? 'var(--mint)' : isActive ? 'var(--rose)' : 'var(--sage-light)'};
    `;
    const dayTag = document.createElement('div');
    dayTag.textContent = `Day ${step.day}`;
    labelWrap.appendChild(dayTag);

    // Step type icon
    const icon = document.createElement('div');
    icon.style.cssText = 'font-size: 0.7rem; margin-top: var(--space-1);';
    icon.textContent = step.type === 'tutor' ? '💬 Tutor' : '📝 Quiz';
    labelWrap.appendChild(icon);

    dayLabels.appendChild(labelWrap);
  });

  // ── Active step detail card ──────────────────────────────────────────────────
  const activeStepData = steps[currentStep];
  const stepDetail = document.createElement('div');
  stepDetail.style.cssText = `
    padding: var(--space-4) var(--space-5);
    background: var(--glass);
    border: 1.5px solid var(--glass-border);
    border-radius: var(--radius-md);
    border-left: 3px solid var(--rose);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  `;

  const stepTitle = document.createElement('div');
  stepTitle.style.cssText = 'font-weight: 600; font-size: 0.9375rem; margin-bottom: var(--space-2);';
  stepTitle.textContent = activeStepData.title;

  const stepDesc = document.createElement('div');
  stepDesc.className = 'text-secondary text-sm';
  stepDesc.style.marginBottom = 'var(--space-4)';
  stepDesc.textContent = activeStepData.description;

  const minutesBadge = document.createElement('span');
  minutesBadge.className = 'badge badge-info';
  minutesBadge.style.marginBottom = 'var(--space-4)';
  minutesBadge.style.display = 'inline-block';
  minutesBadge.textContent = `~${activeStepData.estimated_minutes} min`;

  // CTA — deep-link with quest tracking params appended
  const ctaUrl = `${activeStepData.action_url}&quest_id=${encodeURIComponent(quest.id)}&step=${currentStep}`;
  const cta = document.createElement('a');
  cta.href      = ctaUrl;
  cta.className = 'btn btn-primary';
  cta.textContent = `Start Day ${activeStepData.day} →`;

  stepDetail.append(stepTitle, stepDesc, minutesBadge, document.createElement('br'), cta);

  body.append(timeline, dayLabels, stepDetail);
  card.append(header, body);

  section.innerHTML = '';
  section.appendChild(card);
  section.style.display = 'block';
}

// ── Quest: generate ────────────────────────────────────────────────────────────

/**
 * Calls POST /api/generate-quest with the student's weak topic data.
 * On success, renders the quest map and hides Generate Quest buttons.
 * On error, shows an inline error message near the trigger button.
 * @param {Object} db        - Supabase client
 * @param {Object} session   - Supabase session (for Bearer token)
 * @param {Object} student   - student object { id, level }
 * @param {string} topic
 * @param {string} subject
 * @param {number} score     - trigger score (0–100)
 * @param {string|null} attemptId - quiz_attempt id that triggered this
 * @param {HTMLElement} btnEl - the clicked button (for error display)
 */
async function generateQuest(db, session, student, topic, subject, score, attemptId, btnEl) {
  if (!session?.access_token) {
    showBtnError(btnEl, 'Please refresh and try again.');
    return;
  }

  const originalText = btnEl.textContent;
  btnEl.disabled     = true;
  btnEl.textContent  = 'Generating…';

  try {
    const levelSlug = (student.level || 'primary-4').toLowerCase().replace(/\s+/g, '-');

    const res = await fetch('/api/generate-quest', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        student_id:         student.id,
        subject:            subject.toLowerCase(),
        level:              levelSlug,
        topic:              topic.toLowerCase(),
        trigger_score:      score,
        trigger_attempt_id: attemptId || null,
      }),
    });

    const json = await res.json();

    if (!res.ok || !json.quest) {
      showBtnError(btnEl, json.error || 'Could not generate quest.');
      btnEl.disabled    = false;
      btnEl.textContent = originalText;
      return;
    }

    // Render the quest map and disable all Generate Quest buttons
    renderQuestMap(json.quest, db);
    disableAllQuestButtons('Complete your active quest first');

  } catch (err) {
    console.error('[progress] generateQuest error:', err.message);
    showBtnError(btnEl, 'Network error. Please try again.');
    btnEl.disabled    = false;
    btnEl.textContent = originalText;
  }
}

// ── Quest: advance step ────────────────────────────────────────────────────────

/**
 * Marks a quest step as complete by incrementing current_step,
 * or sets status='completed' if all steps are done.
 * Called on page load when ?quest_id=X&step=N is detected in URL.
 * @param {Object} db
 * @param {string} questId
 * @param {number} completedStep - 0-indexed step that was just completed
 */
async function advanceQuestStep(db, questId, completedStep) {
  if (!questId || isNaN(completedStep)) return;

  try {
    const isLastStep = completedStep >= 2;
    const { error } = await db
      .from('remedial_quests')
      .update(isLastStep
        ? { status: 'completed', current_step: 3 }
        : { current_step: completedStep + 1 }
      )
      .eq('id', questId);

    if (error) console.warn('[progress] advanceQuestStep error:', error.message);
  } catch (err) {
    console.warn('[progress] advanceQuestStep failed:', err.message);
  }
}

// ── Quest: abandon ─────────────────────────────────────────────────────────────

/**
 * Abandons the active quest after user confirmation.
 * Hides the quest map card and re-enables Generate Quest buttons.
 * @param {Object} db
 * @param {string} questId
 * @param {HTMLElement} sectionEl - #quest-map-section to hide on success
 */
async function abandonQuest(db, questId, sectionEl) {
  if (!confirm('Abandon this quest? Your progress on it will be lost.')) return;

  try {
    const { error } = await db
      .from('remedial_quests')
      .update({ status: 'abandoned' })
      .eq('id', questId);

    if (error) {
      console.error('[progress] abandonQuest error:', error.message);
      return;
    }

    // Hide the quest map and re-enable all Generate Quest buttons
    if (sectionEl) sectionEl.style.display = 'none';
    document.querySelectorAll('[data-quest-btn]').forEach(btn => {
      btn.disabled    = false;
      btn.textContent = '+ Generate Quest';
    });

  } catch (err) {
    console.error('[progress] abandonQuest failed:', err.message);
  }
}

// ── Quest: helpers ─────────────────────────────────────────────────────────────

/** Shows a small inline error below a button element. */
function showBtnError(btnEl, message) {
  const existing = btnEl.parentElement?.querySelector('.quest-btn-error');
  if (existing) existing.remove();
  const err = document.createElement('span');
  err.className = 'quest-btn-error text-sm';
  err.style.cssText = 'color:var(--danger); display:block; margin-top:var(--space-1);';
  err.textContent = message;
  btnEl.insertAdjacentElement('afterend', err);
}

/** Disables all Generate Quest buttons (when a quest is already active). */
function disableAllQuestButtons(tooltipText) {
  document.querySelectorAll('[data-quest-btn]').forEach(btn => {
    btn.disabled = true;
    btn.title    = tooltipText || '';
  });
}

// ── Student selector ───────────────────────────────────────────────────────────

/**
 * Populates the student selector dropdown when a parent has multiple children.
 */
function populateStudentSelector(students, activeId) {
  const selectorDiv = document.getElementById('student-selector');
  const selectEl    = document.getElementById('student-select');
  if (!selectorDiv || !selectEl) return;

  selectEl.innerHTML = '';
  students.forEach(function(s) {
    const opt = document.createElement('option');
    opt.value       = s.id;
    opt.textContent = s.name + ' (' + s.level + ')';
    if (s.id === activeId) opt.selected = true;
    selectEl.appendChild(opt);
  });

  selectEl.addEventListener('change', function() {
    const params = new URLSearchParams(window.location.search);
    params.set('student', selectEl.value);
    window.location.search = params.toString();
  });

  selectorDiv.style.display = 'block';
}

// ── Stat renderers ─────────────────────────────────────────────────────────────

function updateStudentLabel(student) {
  const el = document.getElementById('student-name');
  if (el) el.textContent = student.name || 'Student';
}

function renderSummaryStats(total, pct, streak, questionsToday) {
  setText('stat-total',    total.toLocaleString());
  setText('stat-accuracy', pct + '%');
  setText('stat-streak',   streak + (streak === 1 ? ' day' : ' days'));
  setText('stat-today',    questionsToday.toString());

  const accEl = document.getElementById('stat-accuracy');
  if (accEl) {
    accEl.style.color = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--amber)' : 'var(--danger)';
  }

  const bars = [
    { id: 'bar-total',    target: Math.min(100, Math.round((total / 500) * 100)) },
    { id: 'bar-accuracy', target: pct },
    { id: 'bar-streak',   target: Math.min(100, Math.round((streak / 30) * 100)) },
    { id: 'bar-today',    target: Math.min(100, Math.round((questionsToday / 20) * 100)) },
  ];
  setTimeout(function() {
    bars.forEach(function(bar) {
      const el = document.getElementById(bar.id);
      if (el) {
        el.style.transition = 'width 1.1s cubic-bezier(0.4, 0, 0.2, 1)';
        el.style.width      = bar.target + '%';
      }
    });
  }, 200);
}

function renderSubjectBars(stats) {
  const container = document.getElementById('subject-bars');
  if (!container) return;
  container.innerHTML = '';

  const labels  = { mathematics: 'Mathematics', science: 'Science', english: 'English' };
  const colours = {
    mathematics: 'var(--maths-colour)',
    science:     'var(--science-colour)',
    english:     'var(--english-colour)',
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
    pctSpan.style.color    = 'var(--text-secondary)';
    pctSpan.style.fontSize = '0.875rem';
    pctSpan.textContent    = pct !== null
      ? `${pct}% (${data.quizzes} ${data.quizzes === 1 ? 'quiz' : 'quizzes'})`
      : 'No quizzes yet';

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

/**
 * Renders the weak topics list with per-row "Generate Quest" buttons.
 * Buttons are disabled if an active quest already exists for this student.
 * @param {Array}  topics       - weak topic objects
 * @param {Object|null} activeQuest - current active quest row (or null)
 * @param {Object} student      - student object { id, level }
 * @param {Object} session      - Supabase session (for Bearer token)
 */
function renderWeakTopics(topics, activeQuest, student, session) {
  const container = document.getElementById('weak-topics');
  if (!container) return;
  container.innerHTML = '';

  const db = null; // resolved on demand via getSupabase()
  const subLabels = { mathematics: 'Maths', science: 'Science', english: 'English' };
  const hasActiveQuest = !!activeQuest;

  topics.forEach(t => {
    const row = document.createElement('div');
    row.className = 'flex gap-3 items-center';
    row.style.cssText = 'padding: var(--space-3) 0; border-bottom: 1px solid var(--border); flex-wrap:wrap; row-gap:var(--space-2);';

    // Accuracy badge
    const badge = document.createElement('span');
    badge.className = `badge badge-${t.pct >= 80 ? 'success' : t.pct >= 60 ? 'amber' : 'danger'}`;
    badge.style.cssText = 'min-width:44px; justify-content:center;';
    badge.textContent   = `${t.pct}%`;

    // Topic info
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

    // Practise link
    const link = document.createElement('a');
    link.href      = 'subjects.html';
    link.className = 'btn btn-secondary btn-sm';
    link.textContent = 'Practise';

    // Generate Quest button
    const questBtn = document.createElement('button');
    questBtn.className = 'btn btn-ghost btn-sm';
    questBtn.setAttribute('data-quest-btn', '');
    questBtn.setAttribute('data-topic',   t.topic);
    questBtn.setAttribute('data-subject', t.subject || 'mathematics');
    questBtn.setAttribute('data-score',   String(t.pct));
    questBtn.textContent = '+ Quest';
    questBtn.style.color = 'var(--mint)';

    if (hasActiveQuest) {
      questBtn.disabled = true;
      questBtn.title    = 'Complete your active quest first';
    }

    questBtn.addEventListener('click', async function() {
      const dbClient = await getSupabase();
      await generateQuest(
        dbClient,
        session,
        student,
        questBtn.getAttribute('data-topic'),
        questBtn.getAttribute('data-subject'),
        parseFloat(questBtn.getAttribute('data-score')),
        t.lastAttemptId || null,
        questBtn
      );
    });

    row.append(badge, info, link, questBtn);
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

    const dateEl = document.createElement('span');
    dateEl.className    = 'text-secondary text-sm';
    dateEl.style.cssText = 'min-width:80px;';
    dateEl.textContent  = formatDate(a.completed_at);

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

    const scoreEl = document.createElement('span');
    scoreEl.style.cssText = `font-weight:600; color:${pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--amber)' : 'var(--danger)'};`;
    scoreEl.textContent = `${a.score}/${a.total_questions}`;

    row.append(dateEl, info, scoreEl);
    container.appendChild(row);
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Counts the current streak of consecutive days with at least one quiz attempt.
 */
function calculateStreak(attempts) {
  if (!attempts.length) return 0;

  const uniqueDates = [...new Set(
    attempts.map(a => a.completed_at.slice(0, 10))
  )].sort().reverse();

  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

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

/** Formats an ISO timestamp as a human-readable short date (Singapore locale). */
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
}

/**
 * Renders the exam performance trends panel.
 */
function renderExamHistory(exams) {
  const emptyEl = document.getElementById('exam-history-empty');
  const listEl  = document.getElementById('exam-history-list');
  if (!emptyEl || !listEl) return;

  if (!exams || exams.length === 0) {
    emptyEl.hidden = false;
    listEl.hidden  = true;
    return;
  }

  emptyEl.hidden = true;
  listEl.hidden  = false;
  listEl.innerHTML = '';

  const typeLabels = { WA1:'WA1', WA2:'WA2', EOY:'EOY', PRELIM:'Prelim', PRACTICE:'Practice' };
  const subColours = {
    mathematics: 'var(--maths-colour)',
    science:     'var(--science-colour)',
    english:     'var(--english-colour)',
  };

  const grouped = {};
  exams.forEach(function(e) {
    const sub = (e.subject || 'other').toLowerCase();
    if (!grouped[sub]) grouped[sub] = [];
    grouped[sub].push(e);
  });

  Object.entries(grouped).forEach(function([sub, subExams]) {
    const subLabel = sub.charAt(0).toUpperCase() + sub.slice(1);
    const colour   = subColours[sub] || 'var(--cream)';

    const heading = document.createElement('p');
    heading.style.cssText = `font-weight:700; font-size:.875rem; color:${colour}; margin-bottom:var(--space-2); margin-top:var(--space-4);`;
    heading.textContent = subLabel;
    listEl.appendChild(heading);

    subExams.forEach(function(e) {
      const pct   = e.total_marks > 0 ? Math.round((e.score / e.total_marks) * 100) : 0;
      const label = typeLabels[e.exam_type] || e.exam_type || 'Paper';
      const mins  = e.time_taken ? Math.round(e.time_taken / 60) + ' min' : '';

      const row = document.createElement('div');
      row.style.cssText = 'padding:var(--space-3) 0; border-bottom:1px solid var(--glass-border); display:flex; align-items:center; gap:var(--space-3); flex-wrap:wrap;';

      const dateEl = document.createElement('span');
      dateEl.className = 'text-secondary text-sm';
      dateEl.style.minWidth = '72px';
      dateEl.textContent = formatDate(e.completed_at);

      const typeEl = document.createElement('span');
      typeEl.className = 'badge badge-info';
      typeEl.textContent = label;

      const barWrap = document.createElement('div');
      barWrap.style.cssText = 'flex:1; min-width:120px;';

      const track = document.createElement('div');
      track.style.cssText = 'height:6px; border-radius:999px; background:var(--glass-border); overflow:hidden; margin-bottom:var(--space-1);';
      const fill = document.createElement('div');
      fill.style.cssText = `height:100%; width:${pct}%; border-radius:999px; background:${colour}; transition:width .8s cubic-bezier(.16,1,.3,1);`;
      track.appendChild(fill);

      const scoreLabel = document.createElement('span');
      scoreLabel.className = 'text-secondary text-sm';
      scoreLabel.textContent = e.score + '/' + e.total_marks + ' (' + pct + '%)' + (mins ? ' · ' + mins : '');

      barWrap.append(track, scoreLabel);

      const bandEl = document.createElement('span');
      bandEl.className = pct >= 85 ? 'badge badge-success' : pct >= 55 ? 'badge badge-amber' : 'badge badge-danger';
      bandEl.textContent = pct >= 85 ? 'AL1–2' : pct >= 70 ? 'AL3–4' : pct >= 55 ? 'AL5–6' : 'Needs Work';

      row.append(dateEl, typeEl, barWrap, bandEl);
      listEl.appendChild(row);
    });
  });
}

/** Safely sets textContent on an element by ID. */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
// ── ACTION PLAN RENDERER (NEW UI/UX) ──────────────────────────────────────────

function renderActionPlanUI(totalSeconds, questionsMastered, overallPct, subjectStats, weakTopics, student, session, activeQuest, allActivity, improvedText) {  
  // 1. LAYER 1: Subject Proficiency
  const subjects = ['mathematics', 'science', 'english'];
  subjects.forEach(sub => {
    const stats = subjectStats[sub];
    const pctEl = document.getElementById(`stat-${sub}-pct`);
    const alEl = document.getElementById(`stat-${sub}-al`);

    if (stats && stats.total > 0 && stats.count >= 3) {
      const pct = Math.round((stats.earned / stats.total) * 100);
      const al = getALBand(pct);
      if (pctEl) pctEl.textContent = pct + '%';
      if (alEl) {
        alEl.textContent = al;
        alEl.className = `badge ${pct >= 75 ? 'badge-success' : pct >= 50 ? 'badge-amber' : 'badge-danger'}`;
      }
    } else {
      if (pctEl) pctEl.textContent = '-';
      if (alEl) {
        alEl.textContent = '-';
        alEl.className = 'badge';
      }
    }
  });

  // 2. LAYER 2: Areas of Weakness (Grouped by Subject, AL2 and worse / < 85%)
  const weaknessList = document.getElementById('areas-of-weakness-list');
  if (weaknessList) {
    const weakHtml = [];
    
    subjects.forEach(sub => {
      const subTopics = weakTopics
        .filter(t => t.subject.toLowerCase() === sub && t.pct < 85)
        .sort((a, b) => a.pct - b.pct)
        .slice(0, 3);

      if (subTopics.length > 0) {
        const colorVar = `var(--${sub === 'mathematics' ? 'maths' : sub}-colour)`;
        weakHtml.push(`<h3 style="color:${colorVar}; font-size:0.9rem; text-transform:uppercase; letter-spacing:1px; margin:var(--space-2) 0 0 0;">${sub}</h3>`);
        
        subTopics.forEach(t => {
          const topicLabel = t.topic.replace(/-/g, ' ');
          weakHtml.push(`
            <div class="card hover-lift" style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-3) var(--space-4); flex-wrap:wrap; gap:10px; margin-bottom:var(--space-2);">
              <div>
                <span style="font-size:1.2rem; margin-right:8px;">${t.pct < 45 ? '🔴' : '🟠'}</span>
                <strong class="text-main" style="text-transform:capitalize;">${topicLabel}</strong> 
                <span class="text-muted text-sm"> — ${t.pct}% (${getALBand(t.pct)})</span>
              </div>
              <div style="display:flex; gap:10px;">
                 <a href="tutor.html?intent=remedial&subject=${t.subject}&topic=${t.topic}&score=${t.pct}" class="btn btn-secondary btn-sm" style="border-color:var(--brand-rose); color:var(--brand-rose);">Ask Miss Wena</a>
                 <button class="btn btn-primary btn-sm" onclick="generateQuest(getSupabase(), '${session?.access_token}', {id:'${student.id}', level:'${student.level}'}, '${t.topic}', '${t.subject}', ${t.pct}, '${t.lastAttemptId || ''}', this)" ${activeQuest ? 'disabled title="Complete active quest first"' : ''}>+ Plan Quest</button>
              </div>
            </div>`);
        });
      }
    });

    weaknessList.innerHTML = weakHtml.length > 0 ? weakHtml.join('') : '<div class="card p-6 text-center text-success font-bold">🎉 Excellent! No weak areas detected (All topics AL1).</div>';
  }

  // 3. LAYER 3: Subject Breakdown & Deep Dive
  const subjectBreakdownList = document.getElementById('subject-breakdown-list');
  if (subjectBreakdownList) {
    const subjectHtml = Object.entries(subjectStats).map(([sub, stats]) => {
      const pct = stats.total > 0 ? Math.round((stats.earned / stats.total) * 100) : 0;
      if (pct === 0 && stats.total === 0) return '';
      const band = getALBand(pct);
      const colour = pct >= 75 ? 'var(--brand-mint)' : pct >= 50 ? 'var(--brand-amber)' : 'var(--brand-error)';
      
      return `
        <div class="card hover-lift" style="padding:var(--space-4); margin-bottom:var(--space-3);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-2);">
            <strong class="text-main" style="font-size:1.2rem; text-transform:capitalize;">${sub}</strong>
            <span class="badge ${pct >= 75 ? 'badge-success' : pct >= 50 ? 'badge-amber' : 'badge-danger'}">${pct}% correct · ${band}</span>
          </div>
          <div style="height:6px; background:var(--border-light); border-radius:3px; overflow:hidden; margin-bottom:var(--space-4);">
            <div style="height:100%; width:${pct}%; background:${colour};"></div>
          </div>
          <button class="btn btn-ghost btn-sm btn-full" onclick="toggleDeepDive('${student.id}', '${sub}', this, ${stats.quizzes || 0})">View More Details ↓</button>
          <div id="deep-dive-${sub}" style="display:none; margin-top:var(--space-4); padding:var(--space-4); border-radius:var(--radius-md); background:var(--bg-elevated); border:1px solid var(--border-light); font-size:0.9rem; color:var(--text-main); line-height:1.5;">
             <div style="text-align:center; padding:var(--space-2); color:var(--text-muted);">
               <span class="spinner-sm" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-right:8px;border-top-color:var(--brand-rose);"></span> Analyzing performance...
             </div>
          </div>
        </div>
      `;
    }).join('');
    
    subjectBreakdownList.innerHTML = subjectHtml || '<p class="text-muted">No subject data yet.</p>';
  }

  // 4. LAYER 4: Statistics
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMins = Math.floor((totalSeconds % 3600) / 60);
  setText('stat-time-new', totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`);
  setText('stat-mastered-new', questionsMastered.toString());
  setText('stat-papers', allActivity ? allActivity.length.toString() : '0');
  
  const improvedEl = document.getElementById('stat-improved');
  if (improvedEl) {
    improvedEl.innerHTML = improvedText;
    improvedEl.style.fontSize = '1.1rem'; 
    improvedEl.style.lineHeight = '1.3';
  }
}

/** Helper: MOE AL Banding */
function getALBand(pct) {
  if (pct >= 90) return 'AL1';
  if (pct >= 85) return 'AL2';
  if (pct >= 80) return 'AL3';
  if (pct >= 75) return 'AL4';
  if (pct >= 65) return 'AL5';
  if (pct >= 45) return 'AL6';
  if (pct >= 20) return 'AL7';
  return 'AL8';
}

// ── AI ACCORDION TOGGLE (LIVE GEMINI ENGINE) ──────────────────────────────────

window.toggleDeepDive = async function(studentId, subject, btnEl, quizCount) {
  const container = document.getElementById(`deep-dive-${subject}`);
  
  if (container.style.display === 'block') {
    container.style.display = 'none';
    btnEl.innerHTML = 'View More Details ↓';
    return;
  }
  
  container.style.display = 'block';
  btnEl.innerHTML = 'Hide Details ↑';
  if (container.dataset.loaded) return;

  container.innerHTML = `
    <div style="text-align:center; padding:var(--space-2); color:var(--text-muted);">
      <span class="spinner-sm" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-right:8px;border-top-color:var(--brand-rose);"></span> Generating Miss Wena's analysis...
    </div>
  `;

  try {
    const sb = await window.getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    
    // Call our new backend endpoint
    const res = await fetch('/api/analyze-weakness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ student_id: studentId, subject: subject })
    });
    
    // FIX: Check if the response is actually JSON before parsing to prevent HTML 404 crashes
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
       // Graceful Fallback UI if the backend API is not deployed yet
       container.innerHTML = `
         <strong style="color:var(--brand-mint);display:block;margin-bottom:8px;">✨ Miss Wena's Analysis (Preview):</strong>
         <p class="text-sm text-main mb-2">You have completed <strong>${quizCount} practice sessions</strong> in ${subject}. To improve your AL band, focus on reviewing the questions you flagged and completing your active remedial quests.</p>
         <p class="text-xs text-muted" style="border-top: 1px solid var(--border-light); padding-top: 8px; margin-top: 8px;"><em>Note: The live AI API endpoint (/api/analyze-weakness) is currently unreachable.</em></p>
       `;
       container.dataset.loaded = "true";
       return;
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    container.innerHTML = `
      <strong style="color:var(--brand-mint);display:block;margin-bottom:4px;">✨ Miss Wena's Analysis:</strong>
      ${data.analysis}
    `;
    container.dataset.loaded = "true";

  } catch (err) {
    container.innerHTML = `<div style="text-align:center; padding:var(--space-2); color:var(--brand-error);">Failed to load analysis. ${err.message}</div>`;
    container.dataset.loaded = ""; // Allow retry
  }
}