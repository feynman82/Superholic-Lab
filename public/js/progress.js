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
  const statsEl = document.getElementById('progress-stats') || document.getElementById('progress-content');
  const emptyEl = document.getElementById('progress-empty');
  const errorEl = document.getElementById('progress-error');

  try {
    const db = await getSupabase();
    const { data: { user }, error: userErr } = await db.auth.getUser();
    if (userErr) throw userErr;
    if (!user) return; // guardPage in the module tag will redirect

    // Grab session access token for API calls (generate-quest endpoint)
    const { data: { session } } = await db.auth.getSession();

    // ── Quest return tracking: detect ?quest_id=X&step=N from deep-link return ──
    const urlParams = new URLSearchParams(window.location.search);
    const returnQuestId = urlParams.get('quest_id');
    const returnStep = urlParams.get('step');
    const urlStudentId = urlParams.get('student');

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
      emptyEl.hidden = false;
      return;
    }

    // --- UNIFIED STATE RESOLVER ---
    let activeStudentId = urlStudentId || localStorage.getItem('shl_active_student_id');
    const student = students.find(s => s.id === activeStudentId) || students[0];

    // Persist the truth
    localStorage.setItem('shl_active_student_id', student.id);
    // ------------------------------
    window.currentStudentId = student.id;

    // Render HUD strip — non-blocking, fails silently
    if (window.renderHUDStrip) {
      window.renderHUDStrip('progress-hud-strip', { studentId: student.id }).catch(() => {});
    }

    // --- JUNIOR GUARDRAIL: Hide Exam Tab for P1 & P2 ---
    const isJunior = student.level.toLowerCase().includes('primary 1') || student.level.toLowerCase().includes('primary 2');

    document.querySelectorAll('.bottom-nav-item').forEach(link => {
      const url = new URL(link.href, window.location.origin);
      url.searchParams.set('student', student.id);
      link.href = url.pathname + url.search;

      if (isJunior && link.getAttribute('href').includes('exam.html')) {
        link.style.display = 'none';
      }
    });

    if (isJunior) {
      const nav = document.getElementById('bottomNav');
      if (nav) nav.style.justifyContent = 'space-evenly';
    }

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
      emptyEl.hidden = false;
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
    const totalCorrect = attempts.reduce((s, a) => s + (a.score || 0), 0);
    const overallPct = totalQuestions > 0
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
        quizzes: subAttempts.length,
      };
    });

    // Weak topics — group by topic, calc accuracy, sort ascending
    const topicMap = {};
    attempts.forEach(a => {
      if (!a.topic) return;
      const key = `${a.subject}::${a.topic}`;
      if (!topicMap[key]) topicMap[key] = { subject: a.subject, topic: a.topic, correct: 0, total: 0, lastAttemptId: a.id };
      topicMap[key].correct += a.score || 0;
      topicMap[key].total += a.total_questions || 0;
    });
    const weakTopics = Object.values(topicMap)
      .filter(t => t.total >= 5 && t.topic && t.topic.toLowerCase() !== 'mixed')
      .map(t => ({ ...t, pct: Math.round((t.correct / t.total) * 100) }))
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5);

    // ── Fetch exam results & Active Quest ──
    const { data: examResults } = await db.from('exam_results').select('id, subject, level, exam_type, score, total_marks, questions_attempted, time_taken, completed_at').eq('student_id', student.id).order('completed_at', { ascending: false }).limit(20);
    const activeQuest = await loadActiveQuest(db, student.id);

    // Fetch active quests for tray + per-subject eligibility gating
    let activeQuestsList = [];
    try {
      const questsRes = await fetch(`/api/quests?student_id=${student.id}&status=active`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });
      if (questsRes.ok) {
        const questsJson = await questsRes.json();
        activeQuestsList = questsJson.quests || [];
      }
    } catch (e) { console.warn('[progress] Could not fetch active quests list:', e); }
    window.activeQuestsList = activeQuestsList;

    // ── 🚀 Fetch Question Attempts for Cognitive Skill (AO) Analysis ──
    const { data: qAttempts } = await db.from('question_attempts')
      .select('cognitive_skill, correct, marks_earned, marks_total')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(500);

    const aoStats = {
      AO1: { earned: 0, total: 0, label: 'AO1 (Recall & Concepts)' },
      AO2: { earned: 0, total: 0, label: 'AO2 (Application)' },
      AO3: { earned: 0, total: 0, label: 'AO3 (Heuristics & Reasoning)' }
    };

    (qAttempts || []).forEach(att => {
      if (!att.cognitive_skill) return;
      let ao = null;
      if (['Factual Recall', 'Conceptual Understanding'].includes(att.cognitive_skill)) ao = 'AO1';
      else if (['Routine Application', 'Non-Routine / Heuristics'].includes(att.cognitive_skill)) ao = 'AO2';
      else if (['Inferential Reasoning', 'Synthesis & Evaluation', 'HOTS'].includes(att.cognitive_skill)) ao = 'AO3';

      if (ao) {
        let possible = att.marks_total || 1;
        let earned = att.marks_earned !== null ? att.marks_earned : (att.correct ? possible : 0);
        aoStats[ao].total += possible;
        aoStats[ao].earned += earned;
      }
    });

    // ── Fetch Study Notes for Revision Vault ──
    const { data: studyNotes } = await db.from('study_notes').select('id, title, subject, topic, created_at, content_html, is_read').eq('student_id', student.id).order('created_at', { ascending: false }).limit(10);
    if (studyNotes && studyNotes.length > 0) {
      window.cachedNotes = studyNotes; // For the modal viewer
      insertRevisionVault(studyNotes);
    }

    // ── Action Plan Aggregations (NEW UI) ──
    const allActivity = [...(attempts || []), ...(examResults || [])];
    allActivity.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

    const totalSeconds = allActivity.reduce((sum, a) => sum + (a.time_taken || a.time_taken_seconds || 0), 0);

    // ── Apply Advanced 14-Day / 1000-Mark / 3-Paper Rule ──
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();

    const advancedSubjectStats = {
      mathematics: { earned: 0, total: 0, count: 0, quizzes: 0 },
      science: { earned: 0, total: 0, count: 0, quizzes: 0 },
      english: { earned: 0, total: 0, count: 0, quizzes: 0 }
    };

    allActivity.forEach(act => {
      const sub = act.subject?.toLowerCase();
      if (!advancedSubjectStats[sub]) return;
      const stats = advancedSubjectStats[sub];

      const actDateMs = new Date(act.completed_at || act.created_at).getTime();
      if (stats.total >= 1000 || (nowMs - actDateMs > fourteenDaysMs)) return;

      stats.total += (act.total_marks || act.total_questions || 1);
      stats.earned += (act.score || 0);
      stats.count += 1;
      stats.quizzes = stats.count;
    });

    let questionsMastered = 0;
    allActivity.forEach(a => {
      // For Exams: Use questions_attempted
      if (a.total_marks && a.score === a.total_marks && a.score > 0) questionsMastered += (a.questions_attempted || 1);
      // For Quizzes: Use total_questions
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
      const target = qDate >= oneWeekAgo ? topicStatsThisWeek : topicStatsLastWeek;

      if (!target[key]) target[key] = { earned: 0, total: 0, subject: q.subject, topic: q.topic };
      target[key].earned += q.score;
      target[key].total += q.total_questions;
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
    const subjectSlotsTaken = new Set(activeQuestsList.map(q => q.subject?.toLowerCase()));
    renderActionPlanUI(totalSeconds, questionsMastered, overallPct, advancedSubjectStats, weakTopics, student, session, activeQuest, allActivity, improvedText, subjectSlotsTaken);
    insertAOMasteryUI(aoStats);

    // Hero diagnosis sentence + heatmap + dependency tree (Pillar 2).
    // Heatmap replaces the legacy vertical BKT list. We fetch
    // mastery_levels filtered by hero subject ONCE and feed both the
    // dependency tree (topic-level aggregate) and the heatmap (cell-level
    // per-row data) so the page makes a single round-trip for both.
    const heroSubject = pickHeroSubject(subjectStats);
    (async () => {
      const diag = await renderDiagnosisHero(student.id, heroSubject, session?.access_token);
      try {
        const { data: masteryRows } = await db.from('mastery_levels')
          .select('topic, sub_topic, probability, attempts')
          .eq('student_id', student.id)
          .eq('subject', heroSubject);
        const rows = masteryRows || [];
        const masteryByTopic = buildMasteryByTopic(rows);
        await renderMasteryHeatmap('heatmap-container', rows, heroSubject, student.id, session?.access_token);
        await renderDependencyTree('dep-tree-container', heroSubject, diag?.weakest_topic || null, masteryByTopic);
      } catch (err) {
        console.warn('[progress] heatmap/tree mastery fetch failed:', err.message || err);
      }
    })();

    // Quest tray (replaces old single-quest renderQuestMap)
    renderQuestTrayFromData(activeQuestsList);
    renderRecentHistory(attempts.slice(0, 10));

    if (!isJunior) renderExamHistory(examResults || []);

    loadingEl.hidden = true;
    statsEl.hidden = false;

  } catch (err) {
    console.error('[progress] Full error:', err);
    console.error('[progress] Error message:', err?.message);
    console.error('[progress] Error code:', err?.code);
    if (loadingEl) loadingEl.hidden = true;
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent = `Could not load progress data: ${err?.message || err}. Check console for details.`;
    }
  }
}

// ── REVISION VAULT UI INJECTION ──
function insertRevisionVault(notes) {
  const weakAreasContainer = document.getElementById('areas-of-weakness-list');
  if (!weakAreasContainer) return;

  // Create the vault container above weak areas
  const vaultContainer = document.createElement('div');
  vaultContainer.id = 'revision-vault-container';
  vaultContainer.style.marginBottom = 'var(--space-8)';

  const cardsHtml = notes.map(n => `
    <div class="glass-panel-2 p-6 hover-lift relative" style="min-width: 240px; max-width: 280px; scroll-snap-align: start; cursor: pointer; border-top: 3px solid var(--brand-rose);" onclick="openVaultNote('${n.id}')">
      ${!n.is_read ? `<div class="absolute top-2 right-2 w-3 h-3 rounded-full bg-rose"></div>` : ''}
      <div class="badge badge-info mb-2 text-[10px] uppercase">${n.subject}</div>
      <h3 class="font-bold text-main mb-2 leading-tight" style="font-size: 1rem;">${n.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h3>
      <div class="text-xs text-muted">${new Date(n.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}</div>
    </div>
  `).join('');

  vaultContainer.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="font-display text-2xl text-main m-0 uppercase">Revision Vault</h2>
      <span class="badge" style="background: rgba(183,110,121,0.1); color: var(--brand-rose);">Miss Wena's Notes</span>
    </div>
    <div id="revision-vault-list" class="flex gap-4 overflow-x-auto pb-4" style="scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; padding-bottom: 12px; margin-bottom: -12px;">
      ${cardsHtml}
    </div>
  `;

  weakAreasContainer.parentNode.insertBefore(vaultContainer, weakAreasContainer.previousElementSibling);

  // Inject the viewer modal to the DOM dynamically if not present
  if (!document.getElementById('vaultViewerModal')) {
    const modal = document.createElement('div');
    modal.id = 'vaultViewerModal';
    modal.className = 'modal-backdrop fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-200 z-50';
    modal.style.background = 'rgba(44, 62, 58, 0.6)';
    modal.style.backdropFilter = 'blur(4px)';
    modal.innerHTML = `
      <div class="glass-panel-1 modal-card p-6 flex flex-col gap-4 transform translate-y-4 transition-transform duration-300 w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-light pb-2">
          <div class="badge badge-info" id="vaultNoteSubject">Maths</div>
          <button class="btn btn-ghost btn-sm text-xl" onclick="document.getElementById('vaultViewerModal').classList.remove('opacity-100', 'pointer-events-auto'); document.getElementById('vaultViewerModal').classList.add('opacity-0', 'pointer-events-none');">×</button>
        </div>
        <h2 class="font-display text-3xl text-main m-0" id="vaultNoteTitle"></h2>
        <div id="vaultNoteHtml" class="mt-2 mb-4 bg-page p-6 rounded border border-light" style="font-size: 0.95rem; color: var(--text-main); line-height: 1.6;"></div>
        <button class="btn btn-secondary w-full" onclick="document.getElementById('vaultViewerModal').classList.remove('opacity-100', 'pointer-events-auto'); document.getElementById('vaultViewerModal').classList.add('opacity-0', 'pointer-events-none');">Close Note</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

window.openVaultNote = async (noteId) => {
  const note = (window.cachedNotes || []).find(n => n.id === noteId);
  if (!note) return;

  document.getElementById('vaultNoteTitle').textContent = note.title;
  document.getElementById('vaultNoteSubject').textContent = note.subject.toUpperCase();
  document.getElementById('vaultNoteHtml').innerHTML = note.content_html;

  const modal = document.getElementById('vaultViewerModal');
  modal.classList.remove('opacity-0', 'pointer-events-none');
  modal.classList.add('opacity-100', 'pointer-events-auto');
  modal.querySelector('.modal-card').style.transform = 'translateY(0)';

  if (!note.is_read) {
    const sb = await getSupabase();
    await sb.from('study_notes').update({ is_read: true }).eq('id', noteId);
    note.is_read = true;

    // Visually remove the red dot
    const targetCard = Array.from(document.querySelectorAll('#revision-vault-list .glass-panel-2')).find(c => c.innerHTML.includes(note.title));
    if (targetCard) {
      const dot = targetCard.querySelector('.bg-rose');
      if (dot && dot.classList.contains('rounded-full')) dot.remove();
    }
  }
};

// ── COGNITIVE SKILL (AO) UI INJECTION ──
function insertAOMasteryUI(aoStats) {
  const weakAreasContainer = document.getElementById('areas-of-weakness-list');
  if (!weakAreasContainer) return;

  const aoContainer = document.createElement('div');
  aoContainer.id = 'ao-mastery-container';
  aoContainer.style.marginBottom = 'var(--space-8)';

  const aoHtml = Object.keys(aoStats).map(key => {
    const stat = aoStats[key];
    const pct = stat.total > 0 ? Math.round((stat.earned / stat.total) * 100) : 0;
    if (pct === 0 && stat.total === 0) return '';
    const color = pct >= 75 ? 'var(--mint)' : pct >= 50 ? 'var(--amber)' : 'var(--danger)';
    return `
      <div style="margin-bottom: var(--space-4);">
        <div style="display:flex; justify-content:space-between; margin-bottom: 6px; font-size: 0.95rem;">
          <span style="font-weight: 600; color: var(--text-main);">${stat.label}</span>
          <span style="font-weight: 700; color: ${color};">${pct}%</span>
        </div>
        <div style="height: 8px; background: var(--glass-border); border-radius: 4px; overflow: hidden;">
          <div style="height: 100%; width: ${pct}%; background: ${color}; transition: width 1s ease-out;"></div>
        </div>
      </div>
    `;
  }).join('');

  if (aoHtml) {
    aoContainer.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-display text-2xl text-main m-0 uppercase">Skill Mastery</h2>
        <span class="badge" style="background: rgba(81,97,94,0.1); color: var(--sage-dark);">MOE Analytics</span>
      </div>
      <div class="glass-panel-1 p-6 border border-light shadow-sm">
        ${aoHtml}
        <div class="mt-4 pt-3 border-t border-light flex gap-2 items-start">
          <span style="font-size: 1.2rem;">🧠</span>
          <p class="text-xs text-muted mb-0" style="line-height: 1.5;">
            <strong>AO1</strong> (Concepts) is the foundation. <strong>AO2</strong> (Application) tests standard problem-solving. <strong>AO3</strong> (Reasoning) tests complex heuristics and synthesis.
          </p>
        </div>
      </div>
    `;
    weakAreasContainer.parentNode.insertBefore(aoContainer, weakAreasContainer.previousElementSibling);
  }
}

// ── Quest: tray render ─────────────────────────────────────────────────────────

/**
 * Renders the multi-quest tray from an already-fetched quests array.
 * Shows 0–3 subject-coloured tiles linking to /quest?id=<id>.
 * Uses #quest-map-section as the container (existing HTML slot).
 * @param {Array} quests - array of quest rows from /api/quests
 */
function renderQuestTrayFromData(quests) {
  const section = document.getElementById('quest-map-section') || document.getElementById('quest-tray-section');
  if (!section) return;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  if (!quests || quests.length === 0) {
    section.innerHTML = `
      <div class="glass-panel-1 quest-tray-empty" style="margin-bottom:var(--space-6);">
        <div class="label-caps quest-tray-label">⚡ Active Quests</div>
        <p class="text-secondary text-sm" style="margin:0;">No active quests. Spot a weakness below to start one.</p>
      </div>
    `;
    section.style.display = 'block';
    return;
  }

  const subjectColours = {
    mathematics: 'var(--brand-sage)',
    science:     'var(--brand-amber)',
    english:     'var(--brand-mint)',
  };

  const tiles = quests.map(q => {
    const colour = subjectColours[q.subject?.toLowerCase()] || 'var(--brand-sage)';
    const step = q.current_step || 0;
    const dayPct = Math.round((step + 1) / 3 * 100);
    return `
      <a href="/quest?id=${esc(q.id)}" class="quest-tray-tile" style="--accent:${colour};">
        <div class="quest-tray-tile-header">
          <span class="quest-tray-tile-subject">${esc(q.subject)}</span>
          <span class="quest-tray-tile-day">Day ${step + 1} of 3</span>
        </div>
        <div class="quest-tray-tile-topic">${esc(q.topic)}</div>
        <div class="quest-tray-tile-bar">
          <div class="quest-tray-tile-fill" style="width:${dayPct}%;"></div>
        </div>
      </a>
    `;
  }).join('');

  section.innerHTML = `
    <div class="glass-panel-1 quest-tray" style="margin-bottom:var(--space-6);">
      <div class="label-caps quest-tray-label">⚡ Active Quests</div>
      <div class="quest-tray-tiles">${tiles}</div>
    </div>
  `;
  section.style.display = 'block';
}

// ── Quest: generate (new — redirects to /quest page) ─────────────────────────

/**
 * Calls POST /api/generate-quest and redirects to /quest?id=<new>.
 * Handles 409 (slot taken) with a user-readable message.
 * @param {HTMLElement} btnEl
 * @param {string} subject
 * @param {string} level
 * @param {string} topic
 * @param {number} triggerScore
 */
window.generateQuestFor = async function (btnEl, subject, level, topic, triggerScore) {
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Generating…'; }
  try {
    const sb = await window.getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    const studentId = window.currentStudentId;
    if (!studentId || !session?.access_token) {
      if (btnEl) { btnEl.disabled = false; btnEl.textContent = '+ Plan Quest'; }
      return;
    }
    const levelSlug = (level || 'primary-4').toLowerCase().replace(/\s+/g, '-');
    const res = await fetch('/api/generate-quest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: studentId,
        subject: subject.toLowerCase(),
        level: levelSlug,
        topic: topic.toLowerCase(),
        trigger_score: triggerScore,
      }),
    });
    const data = await res.json();
    if (res.ok && data.quest) {
      window.location.href = `/quest?id=${data.quest.id}&student=${encodeURIComponent(studentId)}`;
    } else if (res.status === 409) {
      alert(`You already have an active ${subject} quest. Scroll up to view it.`);
      if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Quest taken'; }
    } else {
      alert('Could not generate quest: ' + (data.error || 'Unknown error'));
      if (btnEl) { btnEl.disabled = false; btnEl.textContent = '+ Plan Quest'; }
    }
  } catch (err) {
    console.error('[progress] generateQuestFor error:', err);
    if (btnEl) { btnEl.disabled = false; btnEl.textContent = '+ Plan Quest'; }
  }
};

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

  const steps = quest.steps || [];
  const currentStep = quest.current_step || 0;

  // ── Card wrapper ────────────────────────────────────────────────────────────
  const card = document.createElement('div');
  card.className = 'glass-panel-1';
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
    const isDone = i < currentStep;
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
    const isDone = i < currentStep;

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
  cta.href = ctaUrl;
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
  btnEl.disabled = true;
  btnEl.textContent = 'Generating…';

  // 🚀 UI POLISH: Inject Skeleton Loader 
  const questMapContainer = document.getElementById('quest-map-container') || document.querySelector('.quest-container');
  if (questMapContainer) {
    questMapContainer.innerHTML = `
      <div class="glass-panel-1 p-6 border-sage animate-pulse">
        <div class="h-6 bg-light rounded w-1/3 mb-6"></div>
        <div class="flex flex-col gap-4">
          <div class="h-16 bg-light rounded w-full"></div>
          <div class="h-16 bg-light rounded w-full"></div>
          <div class="h-16 bg-light rounded w-full"></div>
        </div>
      </div>
    `;
    questMapContainer.style.display = 'block';
  }

  try {
    const levelSlug = (student.level || 'primary-4').toLowerCase().replace(/\s+/g, '-');

    const res = await fetch('/api/generate-quest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        student_id: student.id,
        subject: subject.toLowerCase(),
        level: levelSlug,
        topic: topic.toLowerCase(),
        trigger_score: score,
        trigger_attempt_id: attemptId || null,
      }),
    });

    const json = await res.json();

    if (!res.ok || !json.quest) {
      showBtnError(btnEl, json.error || 'Could not generate quest.');
      btnEl.disabled = false;
      btnEl.textContent = originalText;
      return;
    }

    // Render the quest map and disable all Generate Quest buttons
    renderQuestMap(json.quest, db);
    disableAllQuestButtons('Complete your active quest first');

  } catch (err) {
    console.error('[progress] generateQuest error:', err.message);
    showBtnError(btnEl, 'Network error. Please try again.');
    btnEl.disabled = false;
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
    const sb = await window.getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    const res = await fetch(`/api/quests/${questId}/abandon`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session?.access_token}` },
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      console.error('[progress] abandonQuest API error:', d.error);
      alert('Could not abandon quest. Please try again.');
      return;
    }

    // Update local cache and re-render tray so it disappears immediately
    window.activeQuestsList = (window.activeQuestsList || []).filter(q => q.id !== questId);
    renderQuestTrayFromData(window.activeQuestsList);

    // Hide legacy map section if visible
    if (sectionEl) sectionEl.style.display = 'none';
    document.querySelectorAll('[data-quest-btn]').forEach(btn => {
      btn.disabled = false;
      btn.textContent = '+ Generate Quest';
    });

  } catch (err) {
    console.error('[progress] abandonQuest failed:', err.message);
    alert('Could not abandon quest. Please try again.');
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
    btn.title = tooltipText || '';
  });
}

// ── Student selector ───────────────────────────────────────────────────────────

/**
 * Populates the student selector dropdown when a parent has multiple children.
 */
function populateStudentSelector(students, activeId) {
  const selectorDiv = document.getElementById('student-selector');
  const selectEl = document.getElementById('student-select');
  if (!selectorDiv || !selectEl) return;

  selectEl.innerHTML = '';
  students.forEach(function (s) {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name + ' (' + s.level + ')';
    if (s.id === activeId) opt.selected = true;
    selectEl.appendChild(opt);
  });

  selectEl.addEventListener('change', function () {
    // Force the new truth immediately 
    localStorage.setItem('shl_active_student_id', selectEl.value);

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
  setText('stat-total', total.toLocaleString());
  setText('stat-accuracy', pct + '%');
  setText('stat-streak', streak + (streak === 1 ? ' day' : ' days'));
  setText('stat-today', questionsToday.toString());

  const accEl = document.getElementById('stat-accuracy');
  if (accEl) {
    accEl.style.color = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--amber)' : 'var(--danger)';
  }

  const bars = [
    { id: 'bar-total', target: Math.min(100, Math.round((total / 500) * 100)) },
    { id: 'bar-accuracy', target: pct },
    { id: 'bar-streak', target: Math.min(100, Math.round((streak / 30) * 100)) },
    { id: 'bar-today', target: Math.min(100, Math.round((questionsToday / 20) * 100)) },
  ];
  setTimeout(function () {
    bars.forEach(function (bar) {
      const el = document.getElementById(bar.id);
      if (el) {
        el.style.transition = 'width 1.1s cubic-bezier(0.4, 0, 0.2, 1)';
        el.style.width = bar.target + '%';
      }
    });
  }, 200);
}

function renderSubjectBars(stats) {
  const container = document.getElementById('subject-bars');
  if (!container) return;
  container.innerHTML = '';

  const labels = { mathematics: 'Mathematics', science: 'Science', english: 'English' };
  const colours = {
    mathematics: 'var(--maths-colour)',
    science: 'var(--science-colour)',
    english: 'var(--english-colour)',
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
    nameSpan.textContent = labels[sub];

    const pctSpan = document.createElement('span');
    pctSpan.style.color = 'var(--text-secondary)';
    pctSpan.style.fontSize = '0.875rem';
    pctSpan.textContent = pct !== null
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
    badge.textContent = `${t.pct}%`;

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
    link.href = 'subjects.html';
    link.className = 'btn btn-secondary btn-sm';
    link.textContent = 'Practise';

    // Generate Quest button
    const questBtn = document.createElement('button');
    questBtn.className = 'btn btn-ghost btn-sm';
    questBtn.setAttribute('data-quest-btn', '');
    questBtn.setAttribute('data-topic', t.topic);
    questBtn.setAttribute('data-subject', t.subject || 'mathematics');
    questBtn.setAttribute('data-score', String(t.pct));
    questBtn.textContent = '+ Quest';
    questBtn.style.color = 'var(--mint)';

    if (hasActiveQuest) {
      questBtn.disabled = true;
      questBtn.title = 'Complete your active quest first';
    }

    questBtn.addEventListener('click', async function () {
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
    dateEl.className = 'text-secondary text-sm';
    dateEl.style.cssText = 'min-width:80px;';
    dateEl.textContent = formatDate(a.completed_at);

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

  const today = new Date().toISOString().slice(0, 10);
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
  const listEl = document.getElementById('exam-history-list');
  if (!emptyEl || !listEl) return;

  if (!exams || exams.length === 0) {
    emptyEl.hidden = false;
    listEl.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  listEl.hidden = false;
  listEl.innerHTML = '';

  const typeLabels = { WA1: 'WA1', WA2: 'WA2', EOY: 'EOY', PRELIM: 'Prelim', PRACTICE: 'Practice' };
  const subColours = {
    mathematics: 'var(--maths-colour)',
    science: 'var(--science-colour)',
    english: 'var(--english-colour)',
  };

  const grouped = {};
  exams.forEach(function (e) {
    const sub = (e.subject || 'other').toLowerCase();
    if (!grouped[sub]) grouped[sub] = [];
    grouped[sub].push(e);
  });

  Object.entries(grouped).forEach(function ([sub, subExams]) {
    const subLabel = sub.charAt(0).toUpperCase() + sub.slice(1);
    const colour = subColours[sub] || 'var(--cream)';

    const heading = document.createElement('p');
    heading.style.cssText = `font-weight:700; font-size:.875rem; color:${colour}; margin-bottom:var(--space-2); margin-top:var(--space-4);`;
    heading.textContent = subLabel;
    listEl.appendChild(heading);

    subExams.forEach(function (e) {
      const pct = e.total_marks > 0 ? Math.round((e.score / e.total_marks) * 100) : 0;
      const label = typeLabels[e.exam_type] || e.exam_type || 'Paper';
      const mins = e.time_taken ? Math.round(e.time_taken / 60) + ' min' : '';

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

function renderActionPlanUI(totalSeconds, questionsMastered, overallPct, subjectStats, weakTopics, student, session, activeQuest, allActivity, improvedText, subjectSlotsTaken = new Set()) {
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
          const sub = t.subject?.toLowerCase();
          const slotTaken = subjectSlotsTaken.has(sub);
          const existingQ = slotTaken
            ? (window.activeQuestsList || []).find(q => q.subject?.toLowerCase() === sub)
            : null;
          const attrEsc = s => String(s || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
          const questBtnHtml = slotTaken
            ? `<button class="btn btn-secondary btn-sm" disabled title="Active ${attrEsc(t.subject)} quest in progress">Quest taken</button>${existingQ ? `<a href="/quest?id=${attrEsc(existingQ.id)}" class="btn btn-ghost btn-sm" style="color:var(--brand-mint);">View →</a>` : ''}`
            : `<button class="btn btn-primary btn-sm" onclick="window.generateQuestFor(this,'${attrEsc(t.subject)}','${attrEsc(student.level)}','${attrEsc(t.topic)}',${parseFloat(t.pct)})">+ Plan Quest</button>`;
          weakHtml.push(`
            <div class="glass-panel-2" style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-3) var(--space-4); flex-wrap:wrap; gap:10px;">
              <div>
                <span style="font-size:1.2rem; margin-right:8px;">${t.pct < 45 ? '🔴' : '🟠'}</span>
                <strong style="color:var(--text-main); text-transform:capitalize;">${topicLabel}</strong>
                <span class="text-secondary text-sm"> — ${t.pct}% (${getALBand(t.pct)})</span>
              </div>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                 <a href="tutor.html?intent=remedial&subject=${t.subject}&topic=${t.topic}&score=${t.pct}" class="btn btn-secondary btn-sm" style="border-color:var(--rose); color:var(--rose);">Ask Miss Wena</a>
                 ${questBtnHtml}
              </div>
            </div>`);
        });
      }
    });

    weaknessList.innerHTML = weakHtml.length > 0 ? weakHtml.join('') : '<div class="glass-panel-2" style="padding:var(--space-4); text-align:center; color:var(--mint);">🎉 Excellent! No weak areas detected (All topics AL1).</div>';
  }

  // 3. LAYER 3: Subject Breakdown & Deep Dive
  const subjectBreakdownList = document.getElementById('subject-breakdown-list');
  if (subjectBreakdownList) {
    const subjectHtml = Object.entries(subjectStats).map(([sub, stats]) => {
      const pct = stats.total > 0 ? Math.round((stats.earned / stats.total) * 100) : 0;
      if (pct === 0 && stats.total === 0) return '';
      const band = getALBand(pct);
      const colour = pct >= 75 ? 'var(--mint)' : pct >= 50 ? 'var(--amber)' : 'var(--danger)';

      return `
        <div class="glass-panel-1" style="padding:var(--space-4);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-2);">
            <strong style="font-size:1.2rem; color:var(--text-main); text-transform:capitalize;">${sub}</strong>
            <span class="badge ${pct >= 75 ? 'badge-success' : pct >= 50 ? 'badge-amber' : 'badge-danger'}">${pct}% correct · ${band}</span>
          </div>
          <div style="height:6px; background:var(--glass-border); border-radius:3px; overflow:hidden; margin-bottom:var(--space-4);">
            <div style="height:100%; width:${pct}%; background:${colour};"></div>
          </div>
          <button class="btn btn-ghost btn-sm btn-full" onclick="toggleDeepDive('${student.id}', '${sub}', this, ${stats.quizzes || 0})">View More Details ↓</button>
          
          <div id="deep-dive-${sub}" style="display:none; margin-top:var(--space-4); padding:var(--space-3); border-radius:var(--radius-md); background:var(--bg-elevated); border:1px solid var(--border-light); font-size:0.9rem; color:var(--text-main); line-height:1.5;">
             <div style="text-align:center; padding:var(--space-2); color:var(--text-muted);">
               <span class="spinner-sm" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-right:8px;"></span> Analyzing performance...
             </div>
          </div>
        </div>
      `;
    }).join('');

    subjectBreakdownList.innerHTML = subjectHtml || '<p class="text-secondary">No subject data yet.</p>';
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

// ── Global Helper for + Plan Quest Button ──
window.handlePlanQuest = async function (btnEl, studentId, studentLevel, topic, subject, score, attemptId) {
  try {
    const db = await getSupabase();
    const { data: { session } } = await db.auth.getSession();
    const student = { id: studentId, level: studentLevel };
    await generateQuest(db, session, student, topic, subject, score, attemptId || null, btnEl);
  } catch (err) {
    console.error("Plan Quest Trigger Error:", err);
  }
};

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

window.toggleDeepDive = async function (studentId, subject, btnEl, quizCount) {
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
      <span class="spinner-sm" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-right:8px;"></span> Generating Miss Wena's analysis...
    </div>
  `;

  try {
    // FIXED: Safely await the database client before reading the session
    const db = await window.getSupabase();
    const { data: { session } } = await db.auth.getSession();

    // Call our new backend endpoint
    const res = await fetch('/api/analyze-weakness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ student_id: studentId, subject: subject })
    });

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
};

// ── SYLLABUS TREE CACHE (Week 2 Commit B) ────────────────────────────────────
// Module-level cache for SYLLABUS_DEPENDENCIES. The endpoint sets a 1-hour
// Cache-Control header so this is double-cached (browser + module). Hit once
// per page load; subject switches inside the same load reuse the cached map.
let _syllabusTreeCache = null;
async function getSyllabusTree() {
  if (_syllabusTreeCache) return _syllabusTreeCache;
  const res = await fetch('/api/syllabus-tree');
  if (!res.ok) throw new Error('syllabus-tree HTTP ' + res.status);
  _syllabusTreeCache = await res.json();
  return _syllabusTreeCache;
}

// ── DEPENDENCY TREE RENDERER (Week 2 Commit B — Pillar 2) ───────────────────
//
// Renders a DAG of SYLLABUS_DEPENDENCIES[subject] as inline SVG. Topics
// laid out in columns by topological depth (depth 0 = no prerequisites,
// leftmost). Edges are smooth bezier curves prereq→dependent. Weakest topic
// gets a rose ring; node fill encodes mastery probability bucket.
async function renderDependencyTree(containerId, subject, weakTopic, masteryByTopic) {
  const sectionEl = document.getElementById('dep-tree-section');
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const tree = await getSyllabusTree();
    const subjectMap = tree[String(subject || '').toLowerCase()];
    if (!subjectMap || Object.keys(subjectMap).length === 0) {
      if (sectionEl) sectionEl.hidden = true;
      return;
    }

    // 1. Compute depth per topic (memoised; tolerates self-reference loops).
    const depths = {};
    const visiting = new Set();
    function depthOf(t) {
      if (depths[t] !== undefined) return depths[t];
      if (visiting.has(t)) return 0; // cycle guard
      visiting.add(t);
      const prereqs = subjectMap[t]?.prerequisites || [];
      const d = prereqs.length === 0 ? 0 : 1 + Math.max(...prereqs.map(p => subjectMap[p] ? depthOf(p) : 0));
      visiting.delete(t);
      depths[t] = d;
      return d;
    }
    for (const t of Object.keys(subjectMap)) depthOf(t);

    // 2. Group by depth into columns; sort topics alphabetically within a column.
    const cols = {};
    for (const [t, d] of Object.entries(depths)) {
      if (!cols[d]) cols[d] = [];
      cols[d].push(t);
    }
    Object.values(cols).forEach(arr => arr.sort());

    const colKeys = Object.keys(cols).map(Number).sort((a, b) => a - b);
    const maxRows = Math.max(...colKeys.map(k => cols[k].length));

    // 3. Geometry — keep every constant in one place so the layout is easy
    // to retune without hunting through string literals.
    const COL_W   = 170;
    const ROW_H   = 70;
    const NODE_RX = 56;   // ellipse — wider than tall so longer topic names fit
    const NODE_RY = 22;
    const PAD     = 28;
    const width   = PAD * 2 + colKeys.length * COL_W;
    const height  = PAD * 2 + maxRows * ROW_H;

    const positions = {};
    colKeys.forEach((d, ci) => {
      const topics = cols[d];
      // Vertically centre the column inside the SVG so short columns don't
      // float at the top while tall columns fill the box.
      const colHeight = topics.length * ROW_H;
      const offsetY   = (height - colHeight) / 2;
      topics.forEach((t, ri) => {
        positions[t] = {
          x: PAD + ci * COL_W + COL_W / 2,
          y: offsetY + ri * ROW_H + ROW_H / 2,
        };
      });
    });

    // 4. Edge paths — bezier from prereq right edge to dependent left edge.
    const edgePaths = [];
    for (const [topic, node] of Object.entries(subjectMap)) {
      const p2 = positions[topic];
      if (!p2) continue;
      for (const prereq of (node.prerequisites || [])) {
        const p1 = positions[prereq];
        if (!p1) continue;
        const startX = p1.x + NODE_RX;
        const endX   = p2.x - NODE_RX;
        const c1x    = startX + 50;
        const c2x    = endX   - 50;
        edgePaths.push(
          `<path class="dep-tree__edge" d="M ${startX} ${p1.y} C ${c1x} ${p1.y}, ${c2x} ${p2.y}, ${endX} ${p2.y}" />`
        );
      }
    }

    // 5. Node fills — bucket by mastery probability.
    function fillFor(topic) {
      const p = masteryByTopic ? masteryByTopic[topic] : null;
      if (p == null)    return 'var(--cream)';
      if (p < 0.40)     return 'var(--rose)';
      if (p < 0.70)     return 'var(--brand-amber)';
      return 'var(--brand-mint)';
    }
    function escapeXml(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    const nodeMarkup = Object.entries(positions).map(([topic, p]) => {
      const isWeak = topic === weakTopic;
      const stroke = isWeak ? 'var(--brand-rose)' : 'var(--brand-sage)';
      const strokeW = isWeak ? 3 : 1;
      const fill = fillFor(topic);
      const safe = escapeXml(topic);
      return `<g>
        <ellipse cx="${p.x}" cy="${p.y}" rx="${NODE_RX}" ry="${NODE_RY}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" />
        <text class="dep-tree__node-label" x="${p.x}" y="${p.y + 4}" text-anchor="middle">${safe}</text>
      </g>`;
    }).join('');

    container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Topic dependency tree for ${escapeXml(subject)}">
      ${edgePaths.join('')}
      ${nodeMarkup}
    </svg>`;
    if (sectionEl) sectionEl.hidden = false;
  } catch (err) {
    console.warn('[progress] dependency tree failed:', err.message || err);
    if (sectionEl) sectionEl.hidden = true;
  }
}

// Builds a topic→meanProbability map from a list of mastery_levels rows.
// Multiple sub_topic rows under the same topic get attempt-weighted averaged
// so a low-attempt sub_topic doesn't dominate.
function buildMasteryByTopic(masteryRows) {
  const acc = {};
  for (const r of (masteryRows || [])) {
    if (!r.topic) continue;
    if (!acc[r.topic]) acc[r.topic] = { weighted: 0, total: 0 };
    const a = r.attempts || 0;
    acc[r.topic].weighted += (r.probability || 0) * a;
    acc[r.topic].total    += a;
  }
  const out = {};
  for (const [t, v] of Object.entries(acc)) {
    out[t] = v.total > 0 ? v.weighted / v.total : null;
  }
  return out;
}

// ── TOPIC MASTERY HEATMAP (Week 2 Commit C — Pillar 2) ─────────────────────
//
// Replaces the legacy vertical BKT list. Rows = topics from
// SYLLABUS_DEPENDENCIES[subject]; columns = sub_topics under that topic.
// Topics with a single canonical sub_topic render as one wide cell. Cells
// use mastery_levels.probability bucketed into low/mid/high; missing rows
// render the no-data diagonal-stripe pattern. Click any cell to open
// #heatmap-cell-modal which fetches /api/recent-attempts.

const _heatmapState = { studentId: null, accessToken: null };

function _heatmapBucketClass(p) {
  if (p == null)  return 'heatmap__cell--none';
  if (p < 0.40)   return 'heatmap__cell--low';
  if (p < 0.70)   return 'heatmap__cell--mid';
  return 'heatmap__cell--high';
}

function _escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function _truncate(s, n) {
  const t = String(s == null ? '' : s);
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
}
function _formatAttemptDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

async function renderMasteryHeatmap(containerId, masteryRows, subject, studentId, accessToken) {
  const container = document.getElementById(containerId);
  const sectionEl = document.getElementById('heatmap-section');
  if (!container) return;

  // Cache the auth context so modal handlers can re-use it without
  // re-parsing the session every cell click.
  _heatmapState.studentId   = studentId;
  _heatmapState.accessToken = accessToken;

  try {
    const tree = await getSyllabusTree();
    const subjectMap = tree[String(subject || '').toLowerCase()];
    if (!subjectMap || Object.keys(subjectMap).length === 0) {
      if (sectionEl) sectionEl.hidden = true;
      return;
    }

    // Index mastery rows by (topic|sub_topic) for O(1) lookup. NULL/empty
    // sub_topic rows are stored under the topic-only key.
    const masteryByCell = {};
    for (const row of (masteryRows || [])) {
      const sub = (row.sub_topic || '').trim();
      const key = sub ? `${row.topic}|${sub}` : `${row.topic}|`;
      masteryByCell[key] = row;
    }

    const rowsHtml = Object.entries(subjectMap).map(([topic, node]) => {
      const subs = (node.sub_topics || []).slice();
      // Single-sub_topic rendered as a single full-width cell so narrow
      // topics don't get a thin strip cell.
      const isSingle = subs.length <= 1;
      const cellList = subs.length === 0 ? [''] : subs;
      const cellsHtml = cellList.map(sub => {
        const key  = sub ? `${topic}|${sub}` : `${topic}|`;
        const row  = masteryByCell[key];
        const prob = row?.probability ?? null;
        const cls  = _heatmapBucketClass(prob);
        const ariaTopic = _escHtml(topic);
        const ariaSub   = sub ? _escHtml(sub) : '(no specific sub-topic)';
        const titleText = prob == null
          ? `${topic}${sub ? ' · ' + sub : ''} — no attempts yet`
          : `${topic}${sub ? ' · ' + sub : ''} — ${Math.round(prob * 100)}% mastery`;
        return `<button type="button" class="heatmap__cell ${cls}"
            data-topic="${ariaTopic}" data-sub-topic="${_escHtml(sub || '')}"
            aria-label="Open details for ${ariaTopic} ${ariaSub}"
            title="${_escHtml(titleText)}"></button>`;
      }).join('');
      return `<div class="heatmap__row ${isSingle ? 'heatmap__row--single' : ''}" style="--cols: ${Math.max(1, cellList.length)};">
        <div class="heatmap__topic-label">${_escHtml(topic)}</div>
        <div class="heatmap__cells">${cellsHtml}</div>
      </div>`;
    }).join('');

    container.innerHTML = rowsHtml;
    if (sectionEl) sectionEl.hidden = false;

    // Delegate clicks rather than wiring per-cell listeners so the
    // function can be re-rendered cheaply on subject switch.
    container.onclick = (ev) => {
      const btn = ev.target.closest('.heatmap__cell');
      if (!btn) return;
      const topic    = btn.dataset.topic;
      const subTopic = btn.dataset.subTopic || '';
      openHeatmapCellModal(topic, subTopic);
    };
  } catch (err) {
    console.warn('[progress] heatmap render failed:', err.message || err);
    if (sectionEl) sectionEl.hidden = true;
  }
}

async function openHeatmapCellModal(topic, subTopic) {
  const modal   = document.getElementById('heatmap-cell-modal');
  const titleEl = document.getElementById('heatmap-cell-modal-title');
  const bodyEl  = document.getElementById('heatmap-cell-modal-body');
  if (!modal || !titleEl || !bodyEl) return;

  titleEl.textContent = subTopic ? `${topic} — ${subTopic}` : topic;
  bodyEl.innerHTML    = '<p class="heatmap-modal__empty">Loading…</p>';
  modal.hidden        = false;

  const studentId   = _heatmapState.studentId;
  const accessToken = _heatmapState.accessToken;
  if (!studentId) {
    bodyEl.innerHTML = '<p class="heatmap-modal__error">No student context. Please reload the page.</p>';
    return;
  }

  try {
    const params = new URLSearchParams({
      student_id: studentId,
      topic,
      sub_topic:  subTopic || '',
      limit:      '5',
    });
    const res = await fetch(`/api/recent-attempts?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${accessToken || ''}` },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    bodyEl.innerHTML = _renderHeatmapModalBody(data);
  } catch (err) {
    console.error('[heatmap modal] fetch error:', err.message || err);
    bodyEl.innerHTML = '<p class="heatmap-modal__error">Could not load attempts. Please try again.</p>';
  }
}

function _renderHeatmapModalBody(data) {
  const stats    = data?.stats || {};
  const attempts = data?.attempts || [];
  const accuracyPct = stats.accuracy != null ? `${(stats.accuracy * 100).toFixed(1)}%` : '—';
  const masteryPct  = stats.mastery_probability != null ? `${Math.round(stats.mastery_probability * 100)}%` : '—';
  const total       = stats.total_attempts ?? 0;

  const statsHtml = `<div class="heatmap-modal__stats">
    <div class="heatmap-modal__stat"><span class="heatmap-modal__stat-value">${total}</span><span class="heatmap-modal__stat-label">attempts</span></div>
    <div class="heatmap-modal__stat"><span class="heatmap-modal__stat-value">${accuracyPct}</span><span class="heatmap-modal__stat-label">accuracy</span></div>
    <div class="heatmap-modal__stat"><span class="heatmap-modal__stat-value">${masteryPct}</span><span class="heatmap-modal__stat-label">mastery</span></div>
  </div>`;

  if (!attempts.length) {
    return statsHtml + '<p class="heatmap-modal__empty">No attempts logged yet for this sub-topic.</p>';
  }

  const attemptsHtml = `<ul class="heatmap-modal__attempts">${attempts.map(a => `
    <li class="heatmap-modal__attempt heatmap-modal__attempt--${a.correct ? 'correct' : 'incorrect'}">
      <span class="heatmap-modal__attempt-date">${_escHtml(_formatAttemptDate(a.created_at))}</span>
      <span class="heatmap-modal__attempt-stem">${_escHtml(_truncate(a.question_text, 80))}</span>
    </li>
  `).join('')}</ul>`;

  return statsHtml + attemptsHtml;
}

// One-time global wiring for ESC + click-outside close. Runs after the DOM
// is ready (script loads at end of body) so document is queryable.
(function _wireHeatmapModalCloseHandlers() {
  const closeModal = () => {
    const m = document.getElementById('heatmap-cell-modal');
    if (m) m.hidden = true;
  };
  document.addEventListener('click', (ev) => {
    if (ev.target.matches('[data-heatmap-modal-close]')) closeModal();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      const m = document.getElementById('heatmap-cell-modal');
      if (m && !m.hidden) closeModal();
    }
  });
})();

// ── HERO DIAGNOSIS SENTENCE (Week 2 Commit A — Pillar 2) ────────────────────
//
// Picks the subject with the most quiz attempts so the parent sees a
// diagnosis grounded in real engagement. If no subject has any attempts,
// defaults to mathematics so the empty-state template still renders.
function pickHeroSubject(subjectStats) {
  const order = ['mathematics', 'science', 'english'];
  let best = order[0];
  let bestCount = -1;
  for (const sub of order) {
    const c = subjectStats?.[sub]?.quizzes || 0;
    if (c > bestCount) { best = sub; bestCount = c; }
  }
  return best;
}

// Fetches /api/analyze-weakness for the chosen subject, binds the
// response.diagnosis.hero_sentence into #diagnosis-hero-sentence, and
// returns the full diagnosis object so the caller can drive downstream
// renders (e.g. dependency-tree weakest-topic ring) without re-fetching.
async function renderDiagnosisHero(studentId, subject, accessToken) {
  const container = document.getElementById('diagnosis-hero');
  const sentenceEl = document.getElementById('diagnosis-hero-sentence');
  if (!container || !sentenceEl) return null;

  try {
    const res = await fetch('/api/analyze-weakness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken || ''}` },
      body: JSON.stringify({ studentId, subject }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const diag = data?.diagnosis;
    if (!diag?.hero_sentence) {
      container.hidden = true;
      return diag || null;
    }
    sentenceEl.textContent = diag.hero_sentence;
    container.classList.toggle('diagnosis-hero--empty', !diag.al_band);
    container.hidden = false;
    return diag;
  } catch (err) {
    // Hero is non-critical chrome — fail silently so the rest of progress
    // page still renders. Log so dev can spot regressions.
    console.warn('[progress] diagnosis hero failed:', err.message || err);
    container.hidden = true;
    return null;
  }
}

// ── BKT RENDERING ENGINE (PHASE 3) ────────────────────────────────────────────

async function renderBKT(db, studentId) {
  const container = document.getElementById('bkt-mastery-list');
  if (!container) return;

  try {
    const { data, error } = await db.from('mastery_levels')
      .select('*')
      .eq('student_id', studentId)
      .order('probability', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = '<div class="glass-panel-1 p-6 text-center text-sm text-muted">Complete more quizzes to unlock your AI Mastery Tracker.</div>';
      return;
    }

    // Group by subject for cleaner UI blocks
    const subjects = { mathematics: [], science: [], english: [], mixed: [] };
    data.forEach(m => {
      const sub = (m.subject || 'mixed').toLowerCase();
      if (!subjects[sub]) subjects[sub] = [];
      subjects[sub].push(m);
    });

    let html = '';
    const subLabels = { mathematics: 'Mathematics', science: 'Science', english: 'English', mixed: 'Mixed' };

    Object.keys(subjects).forEach(sub => {
      if (subjects[sub].length === 0) return;
      
      // Dynamic border colour based on subject
      const borderColour = sub === 'mathematics' ? 'var(--maths-colour)' : 
                           sub === 'science' ? 'var(--science-colour)' : 
                           sub === 'english' ? 'var(--english-colour)' : 'var(--brand-sage)';

      html += `<div class="glass-panel-1 p-6" style="border-top: 3px solid ${borderColour};">`;
      html += `<h3 class="font-bold text-main mb-4 uppercase text-sm tracking-wide" style="color: ${borderColour};">${subLabels[sub] || sub}</h3>`;
      html += `<div class="flex flex-col gap-5">`;

      subjects[sub].forEach(m => {
        const pct = Math.round(m.probability * 100);
        // Map to Sage-Rose palette: >= 80 is Mint, >= 50 is Amber, < 50 is Rose
        const color = pct >= 80 ? 'var(--mint)' : (pct >= 50 ? 'var(--amber)' : 'var(--rose)');
        
        // Escape strings
        const safeTopic = m.topic ? String(m.topic).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'General';
        const safeSubTopic = m.sub_topic && m.sub_topic !== 'general' ? String(m.sub_topic).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
        
        html += `
          <div class="flex flex-col">
            <div class="flex justify-between items-center mb-2">
              <span class="font-bold text-sm text-main" style="text-transform: capitalize;">
                ${safeTopic.replace(/-/g, ' ')}
                ${safeSubTopic ? `<span class="text-xs text-muted font-normal ml-1">(${safeSubTopic.replace(/-/g, ' ')})</span>` : ''}
              </span>
              <span class="text-xs font-bold" style="color: ${color};">${pct}%</span>
            </div>
            <div class="w-full rounded-full h-2 overflow-hidden" style="background: var(--glass-border);">
              <div class="h-2 rounded-full transition-all duration-1000" style="width: ${pct}%; background: ${color};"></div>
            </div>
            <div class="text-right mt-1 text-[10px] text-muted">${m.attempts} attempts analyzed</div>
          </div>
        `;
      });
      
      html += `</div></div>`;
    });

    container.innerHTML = html;
  } catch (err) {
    console.error('[progress] BKT Error:', err.message);
    container.innerHTML = '<div class="glass-panel-1 p-6 text-center text-sm" style="color: var(--rose);">Failed to load mastery data.</div>';
  }
}

