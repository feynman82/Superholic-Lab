/**
 * quiz.js
 * Quiz engine: reads ?subject=&level= URL params → loads JSON →
 * picks up to 10 random questions → renders one at a time →
 * shows worked solution + wrong-answer explanation on answer →
 * score screen at end → saves results to Supabase.
 *
 * Paywall: checks trial status and daily usage before loading questions.
 * Supports: mcq (A-D options), fill_blank (text input), true_false
 *
 * TEST: Open pages/quiz.html?subject=mathematics&level=primary-4
 *       and verify a question card appears with MCQ options.
 */

(() => {
  // ── DOM refs ──────────────────────────────────────────────────
  const loadingEl     = document.getElementById('quiz-loading');
  const errorEl       = document.getElementById('quiz-error');
  const quizArea      = document.getElementById('quiz-area');
  const progressFill  = document.getElementById('quiz-progress-fill');
  const progressLabel = document.getElementById('quiz-progress-label');
  const quizMeta      = document.getElementById('quiz-meta');
  const questionText  = document.getElementById('quiz-question-text');
  const optionsEl     = document.getElementById('quiz-options');
  const fillArea      = document.getElementById('quiz-fill-area');
  const fillInput     = document.getElementById('quiz-fill-input');
  const fillSubmit    = document.getElementById('quiz-fill-submit');
  const tfArea        = document.getElementById('quiz-tf-area');
  const tfTrue        = document.getElementById('quiz-tf-true');
  const tfFalse       = document.getElementById('quiz-tf-false');
  const explanationEl = document.getElementById('quiz-explanation');
  const nextBtn       = document.getElementById('quiz-next');
  const scoreScreen   = document.getElementById('quiz-score-screen');

  // ── State ─────────────────────────────────────────────────────
  const QUIZ_SIZE = 10;
  let questions        = [];
  let current          = 0;
  let score            = 0;
  let answered         = false;
  let answers          = []; // per-question answer log for Supabase
  let currentStudentId = null;
  let currentSubject   = '';
  let currentLevel     = '';

  // ── Boot ──────────────────────────────────────────────────────
  init();

  async function init() {
    const params  = new URLSearchParams(window.location.search);
    currentSubject = (params.get('subject') || '').toLowerCase().trim();
    currentLevel   = (params.get('level')   || '').toLowerCase().trim();

    const filePath = resolveFile(currentSubject, currentLevel);
    if (!filePath) {
      showError('Invalid subject or level. Please go back and choose a topic.');
      return;
    }

    document.title = `${capitalise(currentSubject)} ${labelLevel(currentLevel)} Quiz — Superholic Lab`;
    const breadcrumb = document.getElementById('quiz-breadcrumb');
    if (breadcrumb) breadcrumb.textContent = `${labelLevel(currentLevel)} ${capitalise(currentSubject)}`;

    // Load student ID for paywall + usage tracking
    try {
      const user = await getCurrentUser();
      if (user) {
        const db = await getSupabase();
        const { data: students } = await db
          .from('students')
          .select('id')
          .eq('parent_id', user.id)
          .limit(1);
        if (students?.length) currentStudentId = students[0].id;
      }
    } catch { /* non-blocking — quiz can still run */ }

    // Paywall check before loading questions
    if (typeof enforcePaywall === 'function') {
      const wall = await enforcePaywall(currentSubject, currentStudentId);
      if (!wall.allowed) {
        loadingEl.hidden = true;
        if (typeof showUpgradeModal === 'function') showUpgradeModal(wall.reason);
        return;
      }
    }

    // Load question bank
    try {
      const res = await fetch(filePath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const all = await res.json();
      questions = shuffle(all).slice(0, QUIZ_SIZE);
      if (questions.length === 0) throw new Error('No questions found in file.');
      answers          = [];
      loadingEl.hidden = true;
      quizArea.hidden  = false;
      renderQuestion();
    } catch (err) {
      showError('Could not load questions. Please try again later.');
      console.error('[quiz]', err);
    }
  }

  // ── File map ──────────────────────────────────────────────────
  function resolveFile(subject, level) {
    const map = {
      'primary-2:mathematics': '../data/questions/p2-mathematics.json',
      'primary-2:english':     '../data/questions/p2-english.json',
      'primary-4:mathematics': '../data/questions/p4-mathematics.json',
      'primary-4:science':     '../data/questions/p4-science.json',
      'primary-4:english':     '../data/questions/p4-english.json',
    };
    return map[`${level}:${subject}`] || null;
  }

  // ── Render one question ───────────────────────────────────────
  function renderQuestion() {
    answered = false;
    const q = questions[current];

    const pct = Math.round((current / questions.length) * 100);
    progressFill.style.width  = pct + '%';
    progressLabel.textContent = `${current + 1} / ${questions.length}`;

    quizMeta.innerHTML = `
      <span class="badge badge-info">${escapeText(q.topic)}</span>
      <span class="badge badge-${diffBadge(q.difficulty)}">${capitalise(q.difficulty)}</span>
    `;

    questionText.textContent = q.question_text;

    optionsEl.innerHTML  = '';
    optionsEl.hidden     = true;
    fillArea.hidden      = true;
    tfArea.hidden        = true;
    explanationEl.hidden = true;
    nextBtn.hidden       = true;
    fillInput.value      = '';
    fillInput.disabled   = false;
    fillSubmit.disabled  = false;
    tfTrue.disabled      = false;
    tfFalse.disabled     = false;
    tfTrue.className     = 'btn btn-secondary btn-full';
    tfFalse.className    = 'btn btn-secondary btn-full';

    if (q.type === 'mcq') {
      optionsEl.hidden = false;
      renderMCQ(q);
    } else if (q.type === 'fill_blank') {
      fillArea.hidden = false;
      fillInput.focus();
    } else if (q.type === 'true_false') {
      tfArea.hidden = false;
    }
  }

  function renderMCQ(q) {
    q.options.forEach(opt => {
      const dotIdx = opt.indexOf('. ');
      const key    = dotIdx > -1 ? opt.slice(0, dotIdx)  : opt.charAt(0);
      const text   = dotIdx > -1 ? opt.slice(dotIdx + 2) : opt.slice(3);

      const btn = document.createElement('button');
      btn.className   = 'quiz-option';
      btn.dataset.key = key;

      const keySpan = document.createElement('span');
      keySpan.className   = 'quiz-option-key';
      keySpan.textContent = key;

      const textSpan = document.createElement('span');
      textSpan.textContent = text;

      btn.append(keySpan, textSpan);
      btn.addEventListener('click', () => handleMCQ(q, key));
      optionsEl.appendChild(btn);
    });
  }

  // ── Answer handlers ───────────────────────────────────────────
  function handleMCQ(q, chosen) {
    if (answered) return;
    answered = true;

    const correct = q.correct_answer;
    const isRight = chosen === correct;
    if (isRight) score++;

    // Record this answer
    answers.push({
      question_text: q.question_text.slice(0, 500),
      topic:         q.topic,
      difficulty:    q.difficulty,
      correct:       isRight,
      answer_chosen: chosen,
      correct_answer: correct,
    });

    optionsEl.querySelectorAll('.quiz-option').forEach(btn => {
      const k = btn.dataset.key;
      btn.disabled = true;
      if (k === correct)           btn.classList.add('is-correct');
      else if (k === chosen)       btn.classList.add('is-wrong');
      else                         btn.classList.add('is-dimmed');
    });

    const wrongExp = (!isRight && q.wrong_explanations) ? q.wrong_explanations[chosen] : null;
    showExplanation(isRight, q.worked_solution, wrongExp);
    nextBtn.hidden = false;
  }

  fillSubmit.addEventListener('click', () => {
    if (answered) return;
    const val = fillInput.value.trim();
    if (!val) { fillInput.focus(); return; }
    handleFillBlank(val);
  });

  fillInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') fillSubmit.click();
  });

  function handleFillBlank(val) {
    answered = true;
    const q = questions[current];
    const isRight = val.toLowerCase() === String(q.correct_answer).toLowerCase();
    if (isRight) score++;

    answers.push({
      question_text: q.question_text.slice(0, 500),
      topic:         q.topic,
      difficulty:    q.difficulty,
      correct:       isRight,
      answer_chosen: val.slice(0, 200),
      correct_answer: String(q.correct_answer),
    });

    fillInput.disabled  = true;
    fillSubmit.disabled = true;
    showExplanation(isRight, q.worked_solution, null, q.correct_answer);
    nextBtn.hidden = false;
  }

  [tfTrue, tfFalse].forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      handleTrueFalse(btn.dataset.value);
    });
  });

  function handleTrueFalse(chosen) {
    answered = true;
    const q = questions[current];
    const isRight = chosen === q.correct_answer;
    if (isRight) score++;

    answers.push({
      question_text: q.question_text.slice(0, 500),
      topic:         q.topic,
      difficulty:    q.difficulty,
      correct:       isRight,
      answer_chosen: chosen,
      correct_answer: q.correct_answer,
    });

    tfTrue.disabled  = true;
    tfFalse.disabled = true;

    if (q.correct_answer === 'True') {
      tfTrue.classList.add('is-tf-correct');
      if (!isRight) tfFalse.classList.add('is-tf-wrong');
    } else {
      tfFalse.classList.add('is-tf-correct');
      if (!isRight) tfTrue.classList.add('is-tf-wrong');
    }

    showExplanation(isRight, q.worked_solution);
    nextBtn.hidden = false;
  }

  // ── Explanation panel ─────────────────────────────────────────
  function showExplanation(isRight, solution, wrongExp, correctAnswer) {
    explanationEl.hidden = false;
    explanationEl.className = `quiz-explanation ${isRight ? 'is-correct-explanation' : 'is-wrong-explanation'}`;

    let html = `<p class="quiz-explanation-title">${isRight ? '&#10003; Correct!' : '&#10007; Not quite'}</p>`;
    if (!isRight && correctAnswer !== undefined) {
      html += `<p><strong>Correct answer:</strong> ${escapeText(String(correctAnswer))}</p>`;
    }
    if (!isRight && wrongExp) {
      html += `<p style="margin-top:var(--space-2);"><strong>Why that was wrong:</strong> ${escapeText(wrongExp)}</p>`;
    }
    if (solution) {
      html += `<p style="margin-top:var(--space-2);"><strong>Worked solution:</strong> ${escapeText(solution)}</p>`;
    }
    explanationEl.innerHTML = html;
  }

  // ── Next question ─────────────────────────────────────────────
  nextBtn.addEventListener('click', () => {
    current++;
    if (current >= questions.length) {
      showScore();
    } else {
      renderQuestion();
      const card = document.getElementById('quiz-card');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // ── Score screen ──────────────────────────────────────────────
  function showScore() {
    quizArea.hidden    = true;
    scoreScreen.hidden = false;

    progressFill.style.width  = '100%';
    progressLabel.textContent = `${questions.length} / ${questions.length}`;

    const pct      = Math.round((score / questions.length) * 100);
    const numColor = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)';
    const msg      = pct >= 80 ? 'Excellent work! Keep it up!'
                   : pct >= 60 ? 'Good effort! Review the ones you missed.'
                   : 'Keep practising — you\'ll get there!';

    scoreScreen.innerHTML = `
      <div class="quiz-score">
        <div class="quiz-score-number" style="color:${numColor}">${score}/${questions.length}</div>
        <p class="quiz-score-label">${escapeText(msg)}</p>
        <p style="color:var(--text-secondary);margin-top:var(--space-1);">You scored ${pct}%</p>
        <div class="flex gap-4 mt-8" style="justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" id="btn-retry">Try Again</button>
          <a href="subjects.html" class="btn btn-secondary">Choose Another Topic</a>
        </div>
      </div>
    `;

    document.getElementById('btn-retry').addEventListener('click', () => {
      current   = 0;
      score     = 0;
      answered  = false;
      answers   = [];
      questions = shuffle(questions);
      scoreScreen.hidden = true;
      quizArea.hidden    = false;
      renderQuestion();
    });

    // Persist results to Supabase
    saveResults().catch(err => console.error('[quiz] saveResults:', err));
  }

  // ── Supabase save ─────────────────────────────────────────────
  async function saveResults() {
    if (!currentStudentId) return;

    const db = await getSupabase();

    // Determine primary topic (most common across answered questions)
    const topicCounts = {};
    answers.forEach(a => {
      if (a.topic) topicCounts[a.topic] = (topicCounts[a.topic] || 0) + 1;
    });
    const primaryTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Mixed';

    // Insert quiz attempt
    const { data: attempt, error: attErr } = await db
      .from('quiz_attempts')
      .insert({
        student_id:      currentStudentId,
        subject:         currentSubject,
        level:           currentLevel,
        topic:           primaryTopic,
        difficulty:      'Mixed',
        score:           score,
        total_questions: questions.length,
      })
      .select('id')
      .single();

    if (attErr) throw attErr;

    // Insert per-question attempts
    if (answers.length > 0) {
      const rows = answers.map(a => ({
        quiz_attempt_id: attempt.id,
        student_id:      currentStudentId,
        question_text:   a.question_text,
        topic:           a.topic,
        difficulty:      a.difficulty,
        correct:         a.correct,
        answer_chosen:   a.answer_chosen,
        correct_answer:  a.correct_answer,
      }));
      await db.from('question_attempts').insert(rows);
    }

    // Increment daily usage counter by number of questions answered
    if (typeof incrementDailyUsage === 'function') {
      const usage = await checkDailyUsage(currentStudentId);
      const db2   = await getSupabase();
      const today = new Date().toISOString().slice(0, 10);
      const newCount = (usage.questions_attempted || 0) + answers.length;
      if (usage.questions_attempted === 0 && !usage.id) {
        await db2.from('daily_usage').insert({
          student_id:           currentStudentId,
          date:                 today,
          questions_attempted:  newCount,
        });
      } else {
        await db2.from('daily_usage')
          .update({ questions_attempted: newCount })
          .eq('student_id', currentStudentId)
          .eq('date', today);
      }
    }
  }

  // ── Utilities ─────────────────────────────────────────────────
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function capitalise(s)  { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function labelLevel(l)  { return l.replace('primary-', 'Primary '); }
  function diffBadge(d)   { return d === 'easy' ? 'success' : d === 'medium' ? 'amber' : 'danger'; }

  function escapeText(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function showError(msg) {
    loadingEl.hidden    = true;
    errorEl.hidden      = false;
    errorEl.textContent = msg;
  }
})();
