window.initExamEngine = function () {
  'use strict';

  // ── Canonical syllabus shim (loaded by /js/syllabus.js) ──
  // syllabus.js exposes window.SHL_SYLLABUS for non-module consumers like
  // exam.js. If the module hasn't loaded yet, we fall back to a no-op
  // shim so the page still renders, with a warning.
  const SYL = window.SHL_SYLLABUS || {
    SUBJECT_DB_NAME: { mathematics: 'Mathematics', science: 'Science', english: 'English' }
  };
  if (!window.SHL_SYLLABUS) {
    console.warn('[exam] /js/syllabus.js not loaded; using inline fallback. Verify <script> order in exam.html.');
  }

  // ── 🚀 UTILITIES ──
  const app = document.getElementById('app');
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  window.formatWorkedSolution = function (raw) {
    if (!raw) return '<em class="font-sans">No step-by-step solution provided.</em>';
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (typeof parsed === 'object' && parsed !== null) {
        let html = '';
        for (const [key, val] of Object.entries(parsed)) {
          html += `<div class="mb-4 font-sans"><h5 class="font-bold text-brand-dark mb-2">${esc(key)}</h5><div class="text-main leading-relaxed" style="word-wrap: break-word;">${val}</div></div>`;
        }
        return html;
      }
    } catch (e) { }
    // 🚀 MASTERCLASS FIX: Removed esc() so HTML tags from the database render correctly
    return `<span class="font-sans">${String(raw).replace(/\n/g, '<br>')}</span>`;
  };

  // 🚀 MASTERCLASS: Deep JSON Parser for Complex Comprehension Parts
  window.extractPartModelAnswer = function (part) {
    if (!part) return '';
    if (part.model_answer) return String(part.model_answer);
    if (part.correct_answer) return String(part.correct_answer);
    if (part.explanation) return String(part.explanation);
    if (part.worked_solution) return String(part.worked_solution);

    let constructed = [];
    if (part.part_type === 'referent' && Array.isArray(part.items)) {
      part.items.forEach(item => constructed.push(`• ${item.word} → ${item.correct_answer}`));
    } else if (part.part_type === 'sequencing' && Array.isArray(part.correct_order)) {
      constructed.push(`Correct order: ${part.correct_order.join(', ')}`);
    } else if (part.part_type === 'true_false' && Array.isArray(part.items)) {
      part.items.forEach(item => constructed.push(`• "${item.statement}" → ${item.correct_answer} (Reason: ${item.reason_evidence})`));
    } else if (Array.isArray(part.items)) {
      constructed.push(JSON.stringify(part.items));
    }

    return constructed.length > 0 ? constructed.join('\n') : '';
  };

  // 🚀 MASTERCLASS TIER 2: Fast Local Math Heuristics (0ms, $0 API Cost)
  function isHeuristicMatch(studentAns, correctAns, acceptAlsoArray, isMath) {
    if (!correctAns || !studentAns) return false;
    const norm = (s) => String(s || '').toLowerCase().replace(/\s/g, '');
    const sNorm = norm(studentAns);
    const cNorm = norm(correctAns);

    if (sNorm === cNorm) return true;
    if (Array.isArray(acceptAlsoArray) && acceptAlsoArray.some(a => norm(a) === sNorm)) return true;

    if (isMath) {
      const stripUnits = (s) => s.replace(/[^0-9.\/]/g, '');
      const sVal = stripUnits(sNorm);
      const cVal = stripUnits(cNorm);
      if (sVal !== '' && sVal === cVal) return true;
    }
    return false;
  }

  // ── 🚀 STATE ──
  const state = {
    phase: 'INIT',
    level: '',
    levelKey: '',
    subject: '',
    subjectKey: '',
    tier: '',
    examType: '',
    studentId: new URLSearchParams(window.location.search).get('student'),
    paper: null,
    allQs: [],          // 🚀 Added for Focus Room Pagination
    currentQIdx: 0,          // 🚀 Added for Focus Room Pagination
    flagged: {},          // 🚀 Added for Focus Room Pagination
    answers: {},
    drawings: {},
    results: null,
    timerSeconds: 0,
    timerInterval: null,
    // ── Masterclass additions (additive, do not break legacy reads) ──
    initialDuration: 0,        // total seconds the timer started at
    warningShared: false       // toast already fired once
  };

  function render() {
    switch (state.phase) {
      case 'INIT': renderInit(); break;
      case 'SUBJECT': renderSubject(); break;
      case 'TYPE': renderType(); break;
      case 'GEN': renderGenerating(); break;
      case 'EXAM': renderFocusExam(); break;
      case 'RESULTS': renderResults(); break;
    }
  }

  // ── 1. INITIALISATION & NAVIGATION PHASES ──
  async function renderInit() {
    app.innerHTML = `
      <header class="exam-hero">
        <h1 class="h1-as exam-hero__title">Preparing exam room…</h1>
        <p class="body-lg exam-hero__lede">Loading your student profile and the latest paper templates.</p>
      </header>
      <div class="exam-skeleton">
        <div class="exam-skeleton__card"></div>
        <div class="exam-skeleton__card"></div>
        <div class="exam-skeleton__card"></div>
      </div>`;
    try {
      const profile = window.userProfile;
      if (!profile) { window.location.href = 'login.html?redirect=exam'; return; }

      const sb = await window.getSupabase();
      let activeStudentId = state.studentId || localStorage.getItem('shl_active_student_id');

      const { data: students } = await sb.from('students').select('id,level,selected_subject').eq('parent_id', profile.id);
      const student = (students || []).find(s => s.id === activeStudentId) || (students || [])[0];

      if (!student) {
        app.innerHTML = `
          <div class="dossier" style="text-align: center;">
            <h2 class="h2-as" style="color: var(--text-main);">No learner profile found.</h2>
            <p class="body-md" style="color: var(--text-muted); margin: var(--space-3) 0;">Set up a learner before starting an exam.</p>
            <a href="setup.html" class="btn btn-primary">Set up a profile →</a>
          </div>`;
        return;
      }

      state.studentId = student.id;
      localStorage.setItem('shl_active_student_id', student.id);

      state.tier = profile.subscription_tier || 'trial';
      state.level = student.level || 'Primary 4';
      state.levelKey = state.level.toLowerCase().replace(' ', '-');

      const isJunior = state.levelKey === 'primary-1' || state.levelKey === 'primary-2';
      if (isJunior) {
        window.location.href = `quiz.html?student=${student.id}`;
        return;
      }

      if (state.tier === 'single_subject') {
        state.subject = student.selected_subject || 'Mathematics';
        state.subjectKey = state.subject.toLowerCase();
        state.phase = 'TYPE';
      } else {
        state.phase = 'SUBJECT';
      }
      render();
    } catch (err) {
      app.innerHTML = `
        <div class="dossier" style="text-align: center;">
          <h2 class="h2-as" style="color: var(--text-main);">Could not load profile.</h2>
          <p class="body-md" style="color: var(--text-muted); margin: var(--space-3) 0;">Refresh the page or check your connection.</p>
          <button class="btn btn-primary" onclick="location.reload()">Reload</button>
        </div>`;
    }
  }

  // ── BREADCRUMB (matches subjects.html pattern) ─────────────────────
  function breadcrumbHtml() {
    const steps = state.tier === 'single_subject'
      ? [{ key: 'TYPE', label: '§ 01 · Paper' }]
      : [{ key: 'SUBJECT', label: '§ 01 · Subject' }, { key: 'TYPE', label: '§ 02 · Paper' }];

    const order = ['SUBJECT', 'TYPE'];
    const currentIdx = order.indexOf(state.phase);

    return `<nav class="exam-breadcrumb" aria-label="Wizard progress">
      ${steps.map((s, i) => {
        const stepIdx = order.indexOf(s.key);
        let cls = 'exam-breadcrumb__step';
        if (stepIdx === currentIdx) cls += ' is-active';
        else if (stepIdx < currentIdx) cls += ' is-done';
        const sep = i < steps.length - 1
          ? '<span class="exam-breadcrumb__sep" aria-hidden="true">›</span>'
          : '';
        return `<span class="${cls}">${esc(s.label)}</span>${sep}`;
      }).join('')}
    </nav>`;
  }

  // ── TOAST (masterclass timer warning) ───────────────────────────────
  // Single one-shot toast that auto-dismisses after 7s. Re-fires never.
  function showExamToast(title, body) {
    if (state.warningShared) return;
    state.warningShared = true;

    let toast = document.getElementById('exam-warning-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'exam-warning-toast';
      toast.className = 'exam-toast';
      toast.setAttribute('role', 'alert');
      document.body.appendChild(toast);
    }
    toast.innerHTML = `
      <div class="exam-toast__title">${esc(title)}</div>
      <p class="exam-toast__body">${esc(body)}</p>`;
    // Trigger transition next frame
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    // Auto-dismiss after 7s
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 280);
    }, 7000);
  }

  // ── ORB SVGs (matches subjects.html) ───────────────────────────────
  function orbSvg(subjectSlug) {
    const base = `
      <defs>
        <radialGradient id="exam-grad-${subjectSlug}" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#F4FBF9" stop-opacity="0.85"/>
          <stop offset="55%" stop-color="#A8C4BB" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#51615E" stop-opacity="0.05"/>
        </radialGradient>
        <radialGradient id="exam-spec-${subjectSlug}" cx="35%" cy="28%" r="22%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="url(#exam-grad-${subjectSlug})"/>
      <ellipse cx="78" cy="68" rx="34" ry="22" fill="url(#exam-spec-${subjectSlug})"/>
      <circle cx="100" cy="100" r="92" fill="none" stroke="#51615E" stroke-opacity="0.18" stroke-width="1"/>`;

    if (subjectSlug === 'mathematics') {
      return `<svg viewBox="0 0 200 200" aria-hidden="true">
        ${base}
        <g class="orb-rot-slow" stroke="#51615E" stroke-width="1.25" fill="none" stroke-linejoin="round">
          <g class="orb-drift">
            <polygon points="55,75 75,68 75,88 55,95"/>
            <polygon points="75,68 95,75 95,95 75,88"/>
            <polygon points="55,75 75,68 95,75 75,82"/>
            <line x1="75" y1="82" x2="75" y2="88"/>
          </g>
        </g>
        <g class="orb-rot-med" stroke="#B76E79" stroke-width="1.25" fill="none" stroke-linejoin="round">
          <g class="orb-drift-2">
            <polygon points="135,90 150,75 165,90 150,115 135,90"/>
            <line x1="135" y1="90" x2="165" y2="90"/>
            <line x1="150" y1="75" x2="150" y2="115"/>
          </g>
        </g>
        <g class="orb-rot-fast" stroke="#3A4E4A" stroke-width="1" fill="none">
          <g class="orb-drift-3">
            <circle cx="95" cy="140" r="18"/>
            <ellipse cx="95" cy="140" rx="18" ry="6"/>
            <ellipse cx="95" cy="140" rx="6" ry="18"/>
          </g>
        </g>
      </svg>`;
    }

    if (subjectSlug === 'science') {
      return `<svg viewBox="0 0 200 200" aria-hidden="true">
        ${base}
        <g class="orb-rot-med">
          <line x1="100" y1="100" x2="60" y2="75" stroke="#51615E" stroke-width="1.25" stroke-opacity="0.6"/>
          <line x1="100" y1="100" x2="140" y2="120" stroke="#51615E" stroke-width="1.25" stroke-opacity="0.6"/>
          <line x1="100" y1="100" x2="115" y2="150" stroke="#51615E" stroke-width="1.25" stroke-opacity="0.6"/>
          <circle cx="100" cy="100" r="11" fill="#51615E" fill-opacity="0.85"/>
          <circle cx="60"  cy="75"  r="7"  fill="#B76E79" fill-opacity="0.8"/>
          <circle cx="140" cy="120" r="7"  fill="#B76E79" fill-opacity="0.8"/>
          <circle cx="115" cy="150" r="6"  fill="#D4A24A" fill-opacity="0.75"/>
        </g>
        <ellipse cx="100" cy="100" rx="58" ry="20" fill="none" stroke="#51615E" stroke-width="0.75" stroke-opacity="0.25" transform="rotate(-25 100 100)"/>
      </svg>`;
    }

    if (subjectSlug === 'english') {
      return `<svg viewBox="0 0 200 200" aria-hidden="true">
        ${base}
        <g font-family="Georgia, 'Times New Roman', serif" text-anchor="middle">
          <text x="68" y="92" class="orb-glyph-fade" font-size="38" font-style="italic" fill="#51615E">Aa</text>
          <text x="138" y="100" class="orb-glyph-fade-2" font-size="44" fill="#B76E79">&amp;</text>
          <text x="100" y="148" class="orb-glyph-fade-3" font-size="36" fill="#3A4E4A">&#8220;&#8221;</text>
        </g>
      </svg>`;
    }

    return `<svg viewBox="0 0 200 200">${base}</svg>`;
  }

  function renderSubject() {
    const subjects = [
      { name: 'Mathematics', key: 'mathematics' },
      { name: 'Science',     key: 'science' },
      { name: 'English',     key: 'english' }
    ];

    const cards = subjects.map((s, i) => `
      <button type="button" class="trio-card" data-orb-stagger="${i}" onclick="window.selectSubject('${s.name}')">
        <div class="trio-orb">${orbSvg(s.key)}</div>
        <h2 class="trio-card__title">${esc(s.name)}</h2>
        <p class="trio-card__sub">${esc(state.level)}</p>
      </button>
    `).join('');

    app.innerHTML = `
      ${breadcrumbHtml()}
      <header class="exam-hero">
        <h1 class="h1-as exam-hero__title">Pick a <em>subject</em>.</h1>
        <p class="body-lg exam-hero__lede">Choose the subject for today's practice paper.</p>
      </header>
      <div class="trio-grid trio-grid--three">${cards}</div>`;
  }

  window.selectSubject = (sub) => {
    state.subject = sub;
    state.subjectKey = sub.toLowerCase();
    state.phase = 'TYPE';
    state.examType = '';
    render();
  };

  function renderMockPreview(tpl) {
    if (!tpl || !tpl.sections) return '';

    let currentLabel = '';
    let strips = '';

    tpl.sections.forEach((sec) => {
      const qType = sec.questionType;
      const qCount = sec.questionCount;
      const marksEach = sec.marksPerQuestion;
      const sectionMarks = sec.totalMarks || (marksEach * qCount);

      let label = qType.toUpperCase();
      let colour = 'var(--text-main)';

      if (qType === 'mcq') {
        label = 'MCQ';
        colour = 'var(--brand-rose)';
      } else if (qType === 'short_ans') {
        label = 'SHORT ANS';
        colour = 'var(--maths-colour, var(--brand-sage))';
      } else if (qType === 'word_problem') {
        label = 'WORD PROBLEM';
        colour = 'var(--maths-colour, var(--brand-sage))';
      } else if (qType === 'open_ended') {
        label = 'OPEN ENDED';
        colour = 'var(--english-colour, var(--brand-sage))';
      } else if (qType === 'editing') {
        label = 'EDITING';
        colour = 'var(--brand-rose)';
      } else if (qType === 'comprehension') {
        label = 'COMPREHENSION';
        colour = 'var(--english-colour, var(--brand-sage))';
      } else if (qType === 'visual_text') {
        label = 'VISUAL TEXT';
        colour = 'var(--english-colour, var(--brand-sage))';
      } else if (qType === 'cloze') {
        colour = 'var(--brand-mint)';
        const sub = (sec.subTopics && sec.subTopics[0]) ? sec.subTopics[0].toUpperCase() : '';
        label = sub ? `${sub.replace(' WITH ', ' · ')} CLOZE` : 'CLOZE';
      }

      const pills = Array.from({ length: qCount }, (_, i) =>
        `<span class="blueprint-pill" style="color: ${colour};">${i + 1}</span>`
      ).join('');

      if (sec.label !== currentLabel) {
        strips += `<div class="blueprint-section__head">${esc(sec.label)}</div>`;
        currentLabel = sec.label;
      }

      strips += `
        <div class="blueprint-row">
          <div class="blueprint-row__label" style="color: ${colour};">${label}</div>
          <div class="blueprint-row__pills">${pills}</div>
          <div class="blueprint-row__marks">${sectionMarks}<span style="font-size: 11px; opacity: 0.6;">M</span></div>
        </div>`;
    });

    return `<div class="blueprint-section">${strips}</div>`;
  }

  function renderType() {
    let types = [
      { id: 'WA1', label: 'WA 1', sub: 'Weighted Assessment 1' },
      { id: 'WA2', label: 'WA 2', sub: 'Weighted Assessment 2' }
    ];
    if (state.levelKey === 'primary-6') {
      if (state.subjectKey === 'mathematics') {
        types.push({ id: 'PSLE-P1', label: 'PSLE Paper 1', sub: 'No calculator · 50 marks' });
        types.push({ id: 'PSLE-P2', label: 'PSLE Paper 2', sub: 'Calculator allowed · 50 marks' });
      } else {
        types.push({ id: 'PSLE', label: 'PSLE', sub: state.subjectKey === 'science' ? 'Full paper · 100 marks' : 'Paper 2 · 90 marks' });
      }
    } else {
      types.push({ id: 'WA3', label: 'WA 3', sub: 'Weighted Assessment 3' });
      types.push({ id: 'EOY', label: 'End of Year', sub: 'End-of-Year examination' });
    }

    if (!state.examType) state.examType = types[0].id;

    const chips = types.map(t => `
      <button type="button" class="paper-format-chip ${t.id === state.examType ? 'is-active' : ''}" onclick="window.selectType('${t.id}')">
        ${esc(t.label)}
        <span class="paper-format-chip__sub">${esc(t.sub)}</span>
      </button>
    `).join('');

    let tpl = null;
    const shortSubj = state.subjectKey === 'mathematics' ? 'maths' : state.subjectKey;
    const shortLvl = state.levelKey.replace('primary-', 'p');
    const specificKey = `${shortSubj}-${shortLvl}-${state.examType.toLowerCase()}`;

    if (typeof EXAM_TEMPLATES !== 'undefined') {
      tpl = EXAM_TEMPLATES[specificKey] || EXAM_TEMPLATES[`${shortSubj}-${shortLvl}`];
    } else if (typeof getTemplate !== 'undefined') {
      tpl = getTemplate(specificKey) || getTemplate(state.subjectKey, state.levelKey);
    }

    let dossierHtml = '<p class="body-md" style="color: var(--text-muted); text-align: center;">Loading paper blueprint…</p>';
    let paceStatsHtml = '';

    if (tpl) {
      const duration = tpl.durationMinutes || tpl.duration || 0;
      const totalMarks = tpl.totalMarks || 0;
      const calc = tpl.calculatorAllowed;
      const durationText = typeof formatDuration === 'function' ? formatDuration(duration) : `${duration} min`;
      const paceMin = totalMarks > 0 ? (duration / totalMarks).toFixed(1) : '—';

      dossierHtml = `
        <div class="dossier__head">
          <h2 class="dossier__title">${esc(tpl.displayName || 'Exam Paper')}</h2>
          <div class="dossier__meta">
            <div class="dossier__meta-item">
              <span class="dossier__meta-label">Duration</span>
              <span class="dossier__meta-value">${esc(durationText)}</span>
            </div>
            <div class="dossier__meta-item">
              <span class="dossier__meta-label">Total Marks</span>
              <span class="dossier__meta-value">${totalMarks}</span>
            </div>
            <div class="dossier__meta-item">
              <span class="dossier__meta-label">Calculator</span>
              <span class="dossier__meta-value" style="color: ${calc ? 'var(--brand-mint)' : 'var(--brand-rose)'};">${calc ? 'Allowed' : 'No'}</span>
            </div>
          </div>
        </div>
        ${renderMockPreview(tpl)}
        <div class="dossier-actions">
          <button id="printPaperBtn" class="btn btn-secondary" onclick="window.printBlankPaper()">Print Blank Paper</button>
          <button class="btn btn-primary" onclick="window.triggerGen()">Begin Exam →</button>
        </div>`;

      paceStatsHtml = `
        <div class="pace-stats">
          <div class="pace-stat">
            <span class="pace-stat__label">Time</span>
            <div class="pace-stat__value">${esc(durationText)}</div>
            <div class="pace-stat__sub">total allowance</div>
          </div>
          <div class="pace-stat">
            <span class="pace-stat__label">Marks</span>
            <div class="pace-stat__value">${totalMarks}</div>
            <div class="pace-stat__sub">across all sections</div>
          </div>
          <div class="pace-stat">
            <span class="pace-stat__label">Pace</span>
            <div class="pace-stat__value">${paceMin}</div>
            <div class="pace-stat__sub">min per mark</div>
          </div>
        </div>`;
    }

    const backLink = state.tier !== 'single_subject'
      ? `<div style="text-align: center; margin-top: var(--space-4);"><button class="btn btn-ghost" onclick="window.backToSubject()">← Back to Subjects</button></div>`
      : '';

    app.innerHTML = `
      ${breadcrumbHtml()}
      <header class="exam-hero">
        <h1 class="h1-as exam-hero__title">Choose your <em>paper format</em>.</h1>
        <p class="body-lg exam-hero__lede">${esc(state.subject)} · ${esc(state.level)}</p>
      </header>
      <div class="paper-format-row">${chips}</div>
      <div class="dossier">${dossierHtml}</div>
      ${paceStatsHtml}
      ${backLink}`;
  }

  window.selectType = (id) => { state.examType = id; render(); };
  window.backToSubject = () => { state.phase = 'SUBJECT'; state.examType = ''; render(); };
  window.triggerGen = () => { state.phase = 'GEN'; render(); };

  window.printBlankPaper = async () => {
    const btn = document.getElementById('printPaperBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Assembling…';

    try {
      const shortSubj = state.subjectKey === 'mathematics' ? 'maths' : state.subjectKey;
      const shortLvl = state.levelKey.replace('primary-', 'p');
      const specificKey = `${shortSubj}-${shortLvl}-${state.examType.toLowerCase()}`;

      let paper;
      if (window.ExamGenerator && window.ExamGenerator.generate) {
        paper = await window.ExamGenerator.generate(specificKey, { examType: state.examType });
      } else {
        paper = await generateExam(state.subjectKey, state.levelKey, state.examType);
      }

      const pc = document.getElementById('print-container');
      if (pc && typeof ExamRenderer !== 'undefined') {
        pc.innerHTML = '';
        ExamRenderer.render(paper, pc);

        // ── Append answer key on a new page ──
        // Per design: back of paper shows answers ONLY (no step-by-step
        // worked solutions). renderMarkingScheme already strips workings.
        if (typeof ExamRenderer.renderMarkingScheme === 'function') {
          const breakEl = document.createElement('div');
          breakEl.style.cssText = 'page-break-before: always; break-before: page;';
          pc.appendChild(breakEl);
          ExamRenderer.renderMarkingScheme(paper, pc);
        }

        setTimeout(() => {
          window.print();
          btn.disabled = false;
          btn.innerHTML = originalText;
        }, 150);
      } else {
        alert('Print engine not loaded. Check console for details.');
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    } catch (err) {
      alert('Failed to generate paper: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  };

  function renderGenerating() {
    app.innerHTML = `
      <header class="exam-hero">
        <h1 class="h1-as exam-hero__title" id="genMsg">Assembling paper…</h1>
        <p class="body-lg exam-hero__lede">Applying MOE difficulty calibration.</p>
      </header>
      <div class="exam-skeleton">
        <div class="exam-skeleton__card"></div>
        <div class="exam-skeleton__card"></div>
        <div class="exam-skeleton__card"></div>
      </div>`;

    const msgs = ['Gathering questions…', 'Calibrating difficulty…', 'Checking syllabus alignment…'];
    let m = 0;
    const int = setInterval(() => {
      m = (m + 1) % msgs.length;
      const el = document.getElementById('genMsg');
      if (el) el.textContent = msgs[m];
    }, 1000);

    const shortSubj = state.subjectKey === 'mathematics' ? 'maths' : state.subjectKey;
    const shortLvl = state.levelKey.replace('primary-', 'p');
    const specificKey = `${shortSubj}-${shortLvl}-${state.examType.toLowerCase()}`;

    const genPromise = (window.ExamGenerator && window.ExamGenerator.generate)
      ? window.ExamGenerator.generate(specificKey, { examType: state.examType })
      : (typeof generateExam === 'function' ? generateExam(state.subjectKey, state.levelKey, state.examType) : window.ExamGenerator.generateExam(state.subjectKey, state.levelKey));

    genPromise.then(paper => {
      clearInterval(int);

      // 🚀 MASTERCLASS: Flatten sections into a single array for pagination
      let flat = [];
      if (paper && paper.sections) {
        paper.sections.forEach(sec => {
          if (sec.questions) {
            sec.questions.forEach((q, qIdx) => {
              if (q) flat.push({ ...q, sectionLabel: sec.label, sectionInstr: sec.instructions, globalIdx: `${sec.id}-${qIdx}` });
            });
          }
        });
      }

      if (flat.length === 0) {
        app.innerHTML = `
          <div class="dossier" style="text-align: center;">
            <h2 class="h2-as" style="color: var(--text-main);">Not enough questions yet.</h2>
            <p class="body-md" style="color: var(--text-muted); margin: var(--space-3) 0;">The bank doesn't have enough questions to assemble a full <strong>${esc(state.examType)}</strong> paper for this subject yet.</p>
            <button class="btn btn-primary" onclick="location.reload()">Return to Menu</button>
          </div>`;
        return;
      }

      state.paper = paper;
      state.allQs = flat;
      state.currentQIdx = 0;
      state.flagged = {};
      state.answers = {};
      state.drawings = {};
      state.results = null;
      state.warningShared = false;
      const totalMinutes = state.paper.duration || state.paper.template?.durationMinutes || 60;
      state.timerSeconds = totalMinutes * 60;
      state.initialDuration = state.timerSeconds;

      state.phase = 'EXAM';
      render();
      startTimer();
    }).catch(err => {
      clearInterval(int);
      app.innerHTML = `
        <div class="dossier" style="text-align: center;">
          <h2 class="h2-as" style="color: var(--text-main);">Generation failed.</h2>
          <p class="body-md" style="color: var(--text-muted); margin: var(--space-3) 0;">${esc(err.message)}</p>
          <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
        </div>`;
    });
  }

  // ── TIMER LOGIC ──
  function startTimer() {
    clearInterval(state.timerInterval);

    const updateTimer = () => {
      if (state.timerSeconds > 0) state.timerSeconds--;
      const el = document.getElementById('nav-timer-container');
      if (el) {
        el.classList.remove('hidden');
        const h = Math.floor(state.timerSeconds / 3600);
        const m = Math.floor((state.timerSeconds % 3600) / 60);
        const s = state.timerSeconds % 60;
        const timeStr = h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;

        // Determine state for the pill
        let pillState = 'normal';
        if (state.timerSeconds < 300) pillState = 'danger';
        else if (state.initialDuration > 0 && state.timerSeconds < state.initialDuration * 0.2) pillState = 'warning';

        el.innerHTML = `<span class="exam-timer" data-state="${pillState}">⏱ ${timeStr}</span>`;

        // ── Masterclass warning toast ──
        // Fire ONCE when: ≥80% of allotted time has elapsed AND ≥30% questions still unanswered.
        if (!state.warningShared && state.initialDuration > 0 && state.allQs.length > 0) {
          const elapsedRatio = (state.initialDuration - state.timerSeconds) / state.initialDuration;
          const answeredCount = state.allQs.filter(qx => {
            const a = state.answers[qx.globalIdx];
            return a && (typeof a === 'object' ? Object.keys(a).length > 0 : String(a).length > 0);
          }).length;
          const unansweredRatio = (state.allQs.length - answeredCount) / state.allQs.length;

          if (elapsedRatio >= 0.8 && unansweredRatio >= 0.3) {
            const minsLeft = Math.ceil(state.timerSeconds / 60);
            const remainingQs = state.allQs.length - answeredCount;
            showExamToast(
              'Pace check',
              `${minsLeft} min remaining · ${remainingQs} question${remainingQs === 1 ? '' : 's'} unanswered. Consider flagging tough ones and moving on.`
            );
          }
        }
      }
    };

    updateTimer();
    state.timerInterval = setInterval(updateTimer, 1000);
  }

  // ── 2. THE EXAM ENGINE (FOCUS ROOM + 3-TIER ROUTER) ──
  function renderFocusExam() {
    const p = state.paper;
    const q = state.allQs[state.currentQIdx];
    const totalQs = state.allQs.length;
    const globalIdx = q.globalIdx;

    // 🚀 MASTERCLASS FIX: Dynamically expand the parent container for the Focus Room so split-screen isn't squished
    if (app) app.style.maxWidth = '1440px';

    // 🚀 MASTERCLASS: The Focus Room Side Navigator Map
    const navPips = state.allQs.map((_, i) => {
      const cls = ['focus-pip'];
      const isAnswered = state.answers[state.allQs[i].globalIdx] && Object.keys(state.answers[state.allQs[i].globalIdx] || {}).length !== 0;
      if (i === state.currentQIdx) cls.push('is-active');
      else if (state.flagged[i]) cls.push('is-flagged');
      else if (isAnswered) cls.push('is-answered');
      return `<button type="button" class="${cls.join(' ')}" onclick="window.jumpToQ(${i})" aria-label="Question ${i + 1}">${i + 1}</button>`;
    }).join('');

    // ── Section pacing strip (masterclass feature) ──
    // Compute current section's question position. Pure presentation cue.
    let sectionPaceLine = '';
    if (state.allQs.length > 0 && p.template && p.template.sections) {
      const currentSection = q.sectionLabel || '';
      const sectionQs = state.allQs.filter(x => x.sectionLabel === currentSection);
      const positionInSection = sectionQs.findIndex(x => x.globalIdx === q.globalIdx) + 1;
      // Estimate section time allowance proportional to its share of marks
      const totalMarks = p.template.totalMarks || p.totalMarks || 0;
      const totalMins = p.template.durationMinutes || p.duration || 0;
      const sectionMarks = (p.template.sections.find(s => s.label === currentSection)?.totalMarks)
        || sectionQs.reduce((acc, x) => acc + (x.marks || 1), 0);
      const allowMins = totalMarks > 0 ? Math.round((sectionMarks / totalMarks) * totalMins) : null;
      sectionPaceLine = `<div class="focus-pacing">${esc(currentSection)} · question ${positionInSection} of ${sectionQs.length}${allowMins ? ` · allow ~${allowMins} min for this section` : ''}</div>`;
    }

    // 🚀 3-TIER ROUTER (Applied to Single Question)
    const isSplitScreen = q.type === 'comprehension' || q.type === 'visual_text';
    const isInlinePassage = q.type === 'cloze' || q.type === 'editing';
    const isMultiPart = q.type === 'word_problem' || q.type === 'open_ended';

    let inputUi = '';
    if (isSplitScreen) inputUi = buildComprehensionUI(q, globalIdx);
    else if (isInlinePassage) inputUi = q.type === 'cloze' ? buildClozeUI(q, globalIdx) : buildEditingUI(q, globalIdx);
    else {
      if (isMultiPart) inputUi = buildMultiPartUI(q, globalIdx);
      else if (q.type === 'mcq') inputUi = buildMCQOptions(q, globalIdx);
      else inputUi = buildTextAreaUI(q, globalIdx);
    }

    let isSynthesis = (q.topic || '').toLowerCase() === 'synthesis';
    let qTextHtml = '';
    if (q.question_text) {
      if (isSynthesis) {
        const displayQuestion = esc(q.question_text.split('\n\n')[0].trim()).replace(/&lt;br\s*\/?\s*&gt;/gi, '<br>');
        const instructions = q.instructions ? `<div class="text-lg text-main font-bold mb-4 leading-relaxed">${esc(q.instructions)}</div>` : '';
        qTextHtml = `<div class="text-lg text-main font-medium mb-4 leading-relaxed">${displayQuestion}<br><br></div>${instructions}`;
      } else {
        // 🚀 MASTERCLASS FIX: Safely parse <br> tags in standard questions
        qTextHtml = `<div class="text-lg text-main font-medium mb-4 leading-relaxed" style="white-space:pre-line;">${esc(q.question_text).replace(/&lt;br\s*\/?\s*&gt;/gi, '<br>')}</div>`;
      }
    }

    const diagramHtml = renderVisualPayload(q.visual_payload);
    const paneMaxWidth = isSplitScreen ? '100%' : '720px';

    app.innerHTML = `
      <div class="focus-paper-header">
        <p class="focus-paper-header__title">${esc(p.template.displayName || p.displayName || 'Practice Paper')}</p>
        <div class="focus-paper-header__sub">${p.template.totalMarks || p.totalMarks} Marks · ${p.template.durationMinutes || p.duration} min</div>
        ${sectionPaceLine}
      </div>

      <div class="flex flex-wrap gap-6 items-start w-full justify-center" style="max-width: 1440px; margin: 0 auto;">
        <div class="flex flex-col" style="flex: 1 1 320px; max-width: ${paneMaxWidth}; width: 100%; transition: max-width 0.3s ease;">
          <div class="focus-q-card">
            <div class="focus-q-card__head">
              <div>
                <span class="badge badge-sage">${esc(q.sectionLabel || 'Exam')}</span>
                <span class="focus-q-card__num" style="margin-left: var(--space-2);">Q ${state.currentQIdx + 1} / ${totalQs}</span>
              </div>
              <span class="badge badge-rose">${q.marks} mark${q.marks > 1 ? 's' : ''}</span>
            </div>

            ${q.sectionInstr ? `<p class="focus-q-card__instr">${esc(q.sectionInstr)}</p>` : ''}

            ${diagramHtml}
            ${!isSplitScreen && !isInlinePassage ? qTextHtml : ''}
            ${inputUi}
          </div>

          <div class="focus-actions">
            <button class="btn btn-ghost" onclick="window.navExam(-1)" ${state.currentQIdx === 0 ? 'disabled' : ''}>← Previous</button>
            <button class="btn btn-ghost" onclick="window.toggleFlag()" style="color: ${state.flagged[state.currentQIdx] ? 'var(--brand-amber)' : 'var(--text-muted)'};">
              ${state.flagged[state.currentQIdx] ? '⚐ Flagged' : '⚐ Flag for review'}
            </button>
            ${state.currentQIdx === totalQs - 1
        ? `<button class="btn btn-primary" onclick="window.manualSubmit()">Submit Paper →</button>`
        : `<button class="btn btn-primary" onclick="window.navExam(1)">Next →</button>`
      }
          </div>
        </div>

        <div style="flex: 0 0 280px; width: 100%;">
          <div class="focus-nav">
            <h3 class="focus-nav__title">Navigator</h3>
            <div class="focus-nav__pips">${navPips}</div>
            <div class="focus-nav__legend">
              <div class="focus-nav__legend-item"><span class="focus-nav__legend-dot"></span> Unanswered</div>
              <div class="focus-nav__legend-item"><span class="focus-nav__legend-dot" style="background: rgba(111, 184, 155, 0.18); border-color: var(--brand-mint);"></span> Answered</div>
              <div class="focus-nav__legend-item"><span class="focus-nav__legend-dot" style="background: rgba(212, 162, 74, 0.18); border-color: var(--brand-amber);"></span> Flagged</div>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      if (typeof initAllCanvases === 'function') initAllCanvases();
      else initCanvas(globalIdx);
    }, 100);
  }

  // ── EXAM INTERACTIONS ──
  window.navExam = (dir) => {
    window.saveAllAnswers();
    const newIdx = state.currentQIdx + dir;
    if (newIdx >= 0 && newIdx < state.allQs.length) {
      state.currentQIdx = newIdx;
      renderFocusExam();
    }
  };

  window.jumpToQ = (idx) => {
    window.saveAllAnswers();
    state.currentQIdx = idx;
    renderFocusExam();
  };

  window.toggleFlag = () => {
    window.saveAllAnswers();
    state.flagged[state.currentQIdx] = !state.flagged[state.currentQIdx];
    renderFocusExam();
  };

  window.manualSubmit = () => {
    window.saveAllAnswers();
    if (confirm("Are you sure you want to submit your paper?")) {
      window.submitExam();
    }
  };

  // ── UI BUILDERS ──

  function renderVisualPayload(visual_payload) {
    if (!visual_payload) return '';
    if (typeof DiagramLibrary === 'undefined' || typeof DiagramLibrary.render !== 'function') return '';

    // Central dispatcher handles parsing (Supabase stores payload as text),
    // missing-function placeholders, hallucination routing, and crash recovery.
    const svgHtml = DiagramLibrary.render(visual_payload);
    if (!svgHtml || String(svgHtml).includes('NaN')) {
      if (svgHtml) console.warn('[DiagramLibrary] Suppressing exam diagram with invalid geometry (NaN).');
      return '';
    }
    return `<div class="mb-4 mx-auto flex justify-center w-full" style="max-width:600px;overflow-x:auto;">${svgHtml}</div>`;
  }

  function buildMCQOptions(q, qIndex) {
    const letters = ['A', 'B', 'C', 'D'];
    const savedAns = state.answers[qIndex] || '';
    let safeOptions = [];
    try { safeOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []); } catch (e) { }

    return safeOptions.map((opt, i) => {
      const isSel = savedAns === opt;
      return `<div class="mcq-opt hover-lift ${isSel ? ' is-sel' : ''}" onclick="window.selectExamMcq('${qIndex}', ${i})">
        <span class="mcq-badge">${letters[i]}</span><span class="font-medium text-main">${esc(opt)}</span>
      </div>`;
    }).join('');
  }

  window.selectExamMcq = (qIndex, optIdx) => {
    window.saveAllAnswers();
    const q = state.allQs.find(x => x.globalIdx === qIndex);
    if (!q) return;

    let safeOptions = [];
    try { safeOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []); } catch (e) { }

    state.answers[qIndex] = safeOptions[optIdx];
    renderFocusExam();
  };

  function buildTextAreaUI(q, globalIdx) {
    let savedAns = String(state.answers[globalIdx] || '');
    const isShortAns = q.type === 'short_ans';
    const isSynthesis = (q.topic || '').toLowerCase() === 'synthesis';
    const isDrawMode = state.drawings[globalIdx] && state.drawings[globalIdx] !== 'text';

    const baseStyle = "form-input w-full p-4 text-lg border-2 border-slate-200 focus:border-brand-sage rounded-xl transition-all shadow-sm";
    const drawStyle = "form-input mt-4 w-full p-4 text-lg border-2 border-brand-sage focus:border-brand-sage rounded-xl transition-all shadow-sm bg-sage-50/10";

    let synthesisHtml = '';
    if (isSynthesis && q.instructions) {
      let rawConnector = '';
      const match = q.instructions.match(/'([^']+)'/);
      if (match) rawConnector = match[1];
      const cleanConnector = rawConnector.replace(/^\.\.\.|\.\.\.$|^\(|\)$/g, '').trim();

      // 🚀 MASTERCLASS FIX: Force flex lines to connect seamlessly
      const lineBlock = `<div style="flex-grow: 1; border-bottom: 2px solid var(--text-main); margin-bottom: 0.3rem; opacity: 0.5; min-width: 40px;"></div>`;

      let blueprintHtml = '';
      // Connector pill — rose bold sentence-case, sits inline with the answer line
      if (rawConnector.startsWith('...') && rawConnector.endsWith('...')) {
        blueprintHtml = `${lineBlock}<span class="synth-connector synth-connector--mid">${esc(cleanConnector)}</span>${lineBlock}`;
      } else if (rawConnector.startsWith('(') && rawConnector.endsWith(')')) {
        blueprintHtml = `${lineBlock}<span class="synth-connector synth-connector--mid">${esc(cleanConnector)}</span>${lineBlock}`;
      } else if (rawConnector.startsWith('...')) {
        blueprintHtml = `${lineBlock}<span class="synth-connector synth-connector--end">${esc(cleanConnector)}</span>`;
      } else {
        blueprintHtml = `<span class="synth-connector synth-connector--start">${esc(cleanConnector)}</span>${lineBlock}`;
      }

      synthesisHtml = `<div class="flex items-end w-full mb-6 mt-2">${blueprintHtml}</div>`;
    }

    const typeHtml = isShortAns
      ? `<input type="text" id="input-${globalIdx}" class="${baseStyle}" placeholder="Type answer here..." value="${esc(savedAns)}" onblur="window.saveAllAnswers()">`
      : `<textarea id="input-${globalIdx}" class="${baseStyle}" rows="3" placeholder="Type working here..." onblur="window.saveAllAnswers()">${esc(savedAns)}</textarea>`;

    return `
      ${synthesisHtml}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <span class="text-xs font-bold text-muted uppercase tracking-wider">💡 Tip: Draw your working!</span>
        <div class="flex gap-2 w-full sm:w-auto">
          <button class="btn btn-sm ${!isDrawMode ? 'bg-sage-dark text-white' : 'btn-ghost'}" onclick="window.setMode('text', '${globalIdx}')">⌨️ Type</button>
          <button class="btn btn-sm ${isDrawMode ? 'bg-sage-dark text-white' : 'btn-ghost'}" onclick="window.setMode('draw', '${globalIdx}')">✏️ Pen Tool</button>
        </div>
      </div>
      ${!isDrawMode ? typeHtml : `
        <div class="scratchpad-container mb-4 relative block">
          <canvas id="canvas-${globalIdx}" data-drawkey="${globalIdx}" class="scratchpad-canvas bg-white border-2 border-slate-200 rounded-xl w-full shadow-sm" style="min-height: 250px; touch-action: none; cursor: crosshair;"></canvas>
          <div class="absolute top-3 right-3">
             <button class="btn btn-sm btn-ghost bg-white shadow-sm rounded-lg" onclick="window.clearExamCanvas('${globalIdx}')">🗑️ Clear</button>
          </div>
        </div>
        <input type="text" id="input-${globalIdx}" class="${drawStyle}" placeholder="Final Answer (Optional)" value="${esc(savedAns)}" onblur="window.saveAllAnswers()">
      `}
    `;
  }

  function buildMultiPartUI(q, globalIdx) {
    let partsData = [];
    try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch (e) { }
    if (partsData.length === 0 && q.type === 'open_ended') partsData = [{ label: "(a)", question: q.question_text, marks: q.marks, model_answer: q.worked_solution || q.model_answer }];

    return partsData.map((p, pIdx) => {
      // 🚀 MASTERCLASS FIX: Unified numbering and safe IDs
      const alphabetLabel = `(${String.fromCharCode(97 + pIdx)})`;
      const pLabel = p.label || alphabetLabel;
      const safeIdLabel = String(pLabel).replace(/[^a-zA-Z0-9]/g, '');
      const savedAns = (state.answers[globalIdx] || {})[pLabel] || '';

      const drawKey = `${globalIdx}-${safeIdLabel}`;
      const isDrawMode = state.drawings[drawKey] && state.drawings[drawKey] !== 'text';
      const baseStyle = "form-input w-full p-4 text-lg border-2 border-slate-200 focus:border-brand-sage rounded-xl transition-all shadow-sm";
      const drawStyle = "form-input mt-4 w-full p-4 text-lg border-2 border-brand-sage focus:border-brand-sage rounded-xl bg-sage-50/10";

      return `
        <div class="mb-6">
          <div class="font-display text-xl text-brand-sage mb-2">${esc(pLabel)}</div>
          ${p.question ? `<div class="mb-4 text-main font-medium leading-relaxed">${esc(p.question).replace(/&lt;br\s*\/?\s*&gt;/gi, '<br>')}</div>` : ''}
          
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <span class="text-xs font-bold text-muted uppercase tracking-wider">💡 Tip: Draw your working!</span>
            <div class="flex gap-2 w-full sm:w-auto">
              <button class="btn btn-sm ${!isDrawMode ? 'bg-sage-dark text-white' : 'btn-ghost'}" onclick="window.setMode('text', '${drawKey}')">⌨️ Type</button>
              <button class="btn btn-sm ${isDrawMode ? 'bg-sage-dark text-white' : 'btn-ghost'}" onclick="window.setMode('draw', '${drawKey}')">✏️ Pen Tool</button>
            </div>
          </div>

          ${!isDrawMode ? `<textarea id="multi-${globalIdx}-${safeIdLabel}" class="${baseStyle}" rows="3" placeholder="Type answer..." onblur="window.saveAllAnswers()">${esc(savedAns)}</textarea>` : `
            <div class="scratchpad-container mb-4 relative block">
              <canvas id="canvas-${drawKey}" data-drawkey="${drawKey}" class="scratchpad-canvas bg-white border-2 border-slate-200 rounded-xl w-full shadow-sm" style="min-height: 250px; touch-action: none; cursor: crosshair;"></canvas>
              <div class="absolute top-3 right-3">
                 <button class="btn btn-sm btn-ghost bg-white shadow-sm rounded-lg" onclick="window.clearExamCanvas('${drawKey}')">🗑️ Clear</button>
              </div>
            </div>
            <input type="text" id="multi-${globalIdx}-${safeIdLabel}" class="${drawStyle}" placeholder="Final Answer (Optional)" value="${esc(savedAns)}" onblur="window.saveAllAnswers()">
          `}
        </div>`;
    }).join('');
  }

  function buildClozeUI(q, globalIdx) {
    let passage = esc(q.passage || '').replace(/\n/g, '<br>').replace(/&lt;br\s*\/?\s*&gt;/gi, '<br>');
    let blanks = [];
    try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch (e) { }

    let wordBankHtml = '';
    const isGrammar = (q.sub_topic || '').toLowerCase() === 'grammar';

    if (isGrammar) {
      const allWords = new Set();
      blanks.forEach(b => (b.options || []).forEach(w => allWords.add(w)));
      if (allWords.size > 0) {
        // 🚀 MASTERCLASS FIX: Case-insensitive alphabetical sort
        const sortedWords = [...allWords].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        const wordBankList = sortedWords.map((w, i) =>
          `<span class="badge bg-surface border border-light text-main" style="font-size:0.9rem; padding: 6px 12px; font-weight: 500;">(${i + 1}) ${esc(w)}</span>`
        ).join('');
        wordBankHtml = `
           <div class="glass-panel-2 p-4 mb-4">
             <div class="text-xs font-bold text-muted uppercase mb-4">Word Bank</div>
             <div class="flex flex-wrap gap-2">${wordBankList}</div>
           </div>`;
      }
    }

    blanks.forEach(b => {
      const num = b.number || b.id;
      const saved = (state.answers[globalIdx] || {})[num] || '';
      let inputHtml = '';
      if (b.options && b.options.length > 0) {
        // 🚀 MASTERCLASS FIX: Sort dropdown options alphabetically
        const sortedOpts = [...b.options].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        const opts = sortedOpts.map(o => `<option value="${esc(o)}" ${saved === o ? 'selected' : ''}>${esc(o)}</option>`).join('');
        inputHtml = `<select id="inline-${globalIdx}-${num}" class="cloze-select" style="min-width:100px;" onchange="window.saveAllAnswers()"><option value="" disabled ${!saved ? 'selected' : ''}>Select...</option>${opts}</select>`;
      } else {
        inputHtml = `<input type="text" id="inline-${globalIdx}-${num}" class="editing-input" placeholder="type here" value="${esc(saved)}" onblur="window.saveAllAnswers()">`;
      }
      passage = passage.replace(new RegExp(`_*\\s*(\\[|\\()${num}(\\]|\\))\\s*_*`, 'g'), inputHtml);
    });

    return `${wordBankHtml}<div class="glass-panel-1 p-6 text-lg leading-relaxed cloze-passage">${passage}</div>`;
  }

  function buildEditingUI(q, globalIdx) {
    let passage = esc(q.passage || '').replace(/\n/g, '<br><br>').replace(/&lt;u&gt;/gi, '<u>').replace(/&lt;\/u&gt;/gi, '</u>').replace(/&lt;br\s*\/?\s*&gt;/gi, '<br>');
    const savedAns = state.answers[globalIdx] || {};

    passage = passage.replace(/\[(\d+)\]/g, (match, numStr) => {
      const num = parseInt(numStr, 10);
      const saved = savedAns[num] || '';
      return `<input type="text" id="inline-${globalIdx}-${num}" value="${esc(saved)}" autocomplete="off" class="editing-inline-input" onblur="window.saveAllAnswers()">`;
    });
    return `<div class="glass-panel-1 p-6 editing-passage text-lg leading-relaxed">${passage}</div>`;
  }

  function buildComprehensionUI(q, globalIdx) {
    let partsData = [];
    try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch (e) { }

    const partsHtml = partsData.map((p, pIdx) => {
      const pLabel = p.label || `Q${pIdx + 1}`;
      const safeIdLabel = String(pLabel).replace(/[^a-zA-Z0-9]/g, '');
      const savedObj = state.answers[globalIdx] || {};
      let inter = '';

      if (p.part_type === 'mcq') {
        const saved = savedObj[pLabel] || '';
        inter = (p.options || []).map((opt, i) => `<div class="mcq-opt hover-lift ${saved === opt ? 'is-sel' : ''}" onclick="window.selectCompMcq('${globalIdx}', '${pLabel}', ${i})"><span class="mcq-badge">${['A', 'B', 'C', 'D'][i]}</span><span>${esc(opt)}</span></div>`).join('');
      } else if (p.part_type === 'referent' && Array.isArray(p.items)) {
        const rows = p.items.map((item, i) => {
          const saved = (savedObj[pLabel] || {})[`ref_${i}`] || '';
          return `<tr><td class="p-4 border border-light font-medium">${esc(item.word)}</td><td class="p-4 border border-light"><input type="text" id="comp-${globalIdx}-${safeIdLabel}-ref_${i}" class="form-input w-full p-4 bg-surface" placeholder="Type referent..." value="${esc(saved)}" onblur="window.saveAllAnswers()"></td></tr>`;
        }).join('');
        inter = `<table class="w-full text-left border-collapse text-main bg-white rounded-xl overflow-hidden shadow-sm"><thead><tr><th class="p-4 border border-light bg-page font-bold text-sm uppercase text-muted">Word from passage</th><th class="p-4 border border-light bg-page font-bold text-sm uppercase text-muted">What it refers to</th></tr></thead><tbody>${rows}</tbody></table>`;
      } else if (p.part_type === 'true_false' && Array.isArray(p.items)) {
        const rows = p.items.map((item, i) => {
          const savedAns = (savedObj[pLabel] || {})[`tf_${i}_ans`] || '';
          const savedRsn = (savedObj[pLabel] || {})[`tf_${i}_rsn`] || '';
          return `<tr><td class="p-4 border border-light font-medium text-base leading-relaxed w-1/2">${esc(item.statement)}</td><td class="p-4 border border-light w-1/2"><div class="flex gap-4 mb-4"><label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="comp-${globalIdx}-${safeIdLabel}-tf_${i}" value="True" ${savedAns === 'True' ? 'checked' : ''} onchange="window.saveAllAnswers()"> True</label><label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="comp-${globalIdx}-${safeIdLabel}-tf_${i}" value="False" ${savedAns === 'False' ? 'checked' : ''} onchange="window.saveAllAnswers()"> False</label></div><textarea id="comp-${globalIdx}-${safeIdLabel}-tf_${i}_rsn" class="form-input w-full p-4 text-sm bg-surface" rows="2" placeholder="Type reason from passage..." onblur="window.saveAllAnswers()">${esc(savedRsn)}</textarea></td></tr>`;
        }).join('');
        inter = `<table class="w-full text-left border-collapse text-main bg-white rounded-xl overflow-hidden shadow-sm"><thead><tr><th class="p-4 border border-light bg-page font-bold text-sm uppercase text-muted">Statement</th><th class="p-4 border border-light bg-page font-bold text-sm uppercase text-muted">True / False & Reason</th></tr></thead><tbody>${rows}</tbody></table>`;
      } else if (p.part_type === 'sequencing' && Array.isArray(p.items)) {
        const rows = p.items.map((item, i) => {
          const saved = (savedObj[pLabel] || {})[`seq_${i}`] || '';
          return `<div class="flex items-center gap-4 mb-4 p-4 bg-white border border-light rounded-xl shadow-sm">
                        <input type="number" 
                                id="comp-${globalIdx}-${safeIdLabel}-seq_${i}" 
                                style="width: 60px; flex-shrink: 0;" 
                                class="form-input p-4 text-center font-display text-xl" 
                                min="1" max="${p.items.length}" 
                                value="${esc(saved)}" 
                                onblur="window.saveAllAnswers()">
                        <span class="font-medium text-lg leading-relaxed">${esc(item)}</span>
                    </div>`;
        }).join('');
        inter = `<div class="mt-4">${rows}</div>`;
      } else {
        const saved = savedObj[pLabel] || '';
        inter = `<textarea id="comp-${globalIdx}-${safeIdLabel}" class="form-input w-full p-4 text-lg border-2 border-slate-200 focus:border-brand-sage rounded-xl" rows="3" placeholder="Type answer..." onblur="window.saveAllAnswers()">${esc(saved)}</textarea>`;
      }
      // 🚀 MASTERCLASS FIX: Align question UI with quiz.js (dashed borders, proper spacing)
      return `<div class="mb-6 pb-6 ${pIdx < partsData.length - 1 ? 'border-b border-light border-dashed' : ''}"><div class="flex items-center gap-3 mb-4"><span class="font-display text-xl text-main font-bold" style="color: var(--english-colour);">${pLabel}</span><span class="badge badge-info text-xs">${p.marks || 1} mark${(p.marks || 1) !== 1 ? 's' : ''}</span></div>${p.question ? `<div class="text-lg text-main font-medium mb-4 leading-relaxed">${esc(p.question)}</div>` : ''}${inter}</div>`;
    }).join('');

    return `
             <div class="flex flex-col lg:flex-row gap-6 comp-container">
               <div class="lg:w-1/2 glass-panel-1 p-6 text-lg leading-relaxed comp-passage-pane">
                  ${(q.type === 'visual_text' || q.topic === 'Visual Text') && q.image_url ? `<img src="${q.image_url}" class="w-full rounded border border-light mb-4">` : ''}
                  ${q.passage ? esc(q.passage).replace(/\n/g, '<br><br>').replace(/&lt;br\s*\/?\s*&gt;/gi, '<br>') : ''}
                  
              </div>
               <div class="lg:w-1/2 comp-questions-pane">${partsHtml}</div>
              </div>
          `;
  }

  window.selectCompMcq = (globalIdx, pLabel, optIdx) => {
    window.saveAllAnswers();
    const q = state.allQs.find(x => x.globalIdx === globalIdx);
    if (!q) return;

    let pData = [];
    try { pData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch (e) { }
    const pInfo = pData.find(x => (x.label || '') === pLabel) || pData[parseInt(pLabel.replace('Q', '')) - 1];

    if (!state.answers[globalIdx]) state.answers[globalIdx] = {};
    state.answers[globalIdx][pLabel] = pInfo.options[optIdx];
    renderFocusExam();
  };

  // ── CANVAS DRAWING ENGINE ──
  window.setMode = (mode, drawKey) => {
    window.saveAllAnswers();
    state.drawings[drawKey] = mode === 'draw' ? 'init' : 'text';
    renderFocusExam();
  };

  window.clearExamCanvas = (drawKey) => {
    const canvas = document.getElementById(`canvas-${drawKey}`);
    if (canvas) {
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      state.drawings[drawKey] = canvas.toDataURL();
    }
  };

  function initAllCanvases() {
    const canvases = document.querySelectorAll('.scratchpad-canvas');
    canvases.forEach(canvas => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width || canvas.parentElement.offsetWidth || 600;
      canvas.height = 300;

      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-dark').trim() || '#2C3E3A';

      const drawKey = canvas.getAttribute('data-drawkey');
      if (state.drawings[drawKey] && state.drawings[drawKey] !== 'init' && state.drawings[drawKey] !== 'text') {
        let img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = state.drawings[drawKey];
      }

      let isDrawing = false;
      const getPos = (e) => {
        const r = canvas.getBoundingClientRect();
        return { x: (e.touches ? e.touches[0].clientX : e.clientX) - r.left, y: (e.touches ? e.touches[0].clientY : e.clientY) - r.top };
      };

      const start = (e) => { isDrawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y); ctx.stroke(); if (e.cancelable) e.preventDefault(); };
      const draw = (e) => { if (!isDrawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); if (e.cancelable) e.preventDefault(); };
      const stop = () => { if (isDrawing) { isDrawing = false; state.drawings[drawKey] = canvas.toDataURL(); } };

      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stop);
      canvas.addEventListener('mouseout', stop);
      canvas.addEventListener('touchstart', start, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stop);
    });
  }

  // ── STATE EXTRACTION ──
  window.saveAllAnswers = () => {
    if (!state.allQs || state.allQs.length === 0) return;
    const q = state.allQs[state.currentQIdx];
    if (!q) return;
    const globalIdx = q.globalIdx;

    if (q.type === 'short_ans' || (q.type === 'word_problem' && !q.parts)) {
      const el = document.getElementById(`input-${globalIdx}`);
      if (el && el.value) state.answers[globalIdx] = el.value;
    }
    else if (q.type === 'word_problem' || q.type === 'open_ended') {
      let pData = [];
      try { pData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch (e) { }
      if (pData.length === 0 && q.type === 'open_ended') pData = [{ label: "(a)" }];

      if (!state.answers[globalIdx]) state.answers[globalIdx] = {};
      pData.forEach((p, i) => {
        const alphabetLabel = `(${String.fromCharCode(97 + i)})`;
        const pLabel = p.label || alphabetLabel;
        const safeIdLabel = String(pLabel).replace(/[^a-zA-Z0-9]/g, '');
        const el = document.getElementById(`multi-${globalIdx}-${safeIdLabel}`);
        if (el) state.answers[globalIdx][pLabel] = el.value;
      });
    }
    else if (q.type === 'cloze' || q.type === 'editing') {
      let bData = [];
      try { bData = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch (e) { }
      if (!state.answers[globalIdx]) state.answers[globalIdx] = {};
      bData.forEach(b => {
        const num = b.number || b.id;
        const el = document.getElementById(`inline-${globalIdx}-${num}`);
        if (el) state.answers[globalIdx][num] = el.value;
      });
    }
    else if (q.type === 'comprehension' || q.type === 'visual_text') {
      let pData = [];
      try { pData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch (e) { }
      if (!state.answers[globalIdx]) state.answers[globalIdx] = {};

      pData.forEach((p, i) => {
        const pLabel = p.label || `Q${i + 1}`;
        const safeIdLabel = String(pLabel).replace(/[^a-zA-Z0-9]/g, '');

        if (p.part_type === 'mcq') {
          // MCQ is handled instantly by selectCompMcq
        } else if (p.part_type === 'referent' && Array.isArray(p.items)) {
          if (!state.answers[globalIdx][pLabel]) state.answers[globalIdx][pLabel] = {};
          p.items.forEach((_, itemIdx) => {
            const el = document.getElementById(`comp-${globalIdx}-${safeIdLabel}-ref_${itemIdx}`);
            if (el) state.answers[globalIdx][pLabel][`ref_${itemIdx}`] = el.value;
          });
        } else if (p.part_type === 'true_false' && Array.isArray(p.items)) {
          if (!state.answers[globalIdx][pLabel]) state.answers[globalIdx][pLabel] = {};
          p.items.forEach((_, itemIdx) => {
            // 🚀 MASTERCLASS FIX: Use querySelector to locate the selected radio button by name
            const elAns = document.querySelector(`input[name="comp-${globalIdx}-${safeIdLabel}-tf_${itemIdx}"]:checked`);
            const elRsn = document.getElementById(`comp-${globalIdx}-${safeIdLabel}-tf_${itemIdx}_rsn`);
            if (elAns) state.answers[globalIdx][pLabel][`tf_${itemIdx}_ans`] = elAns.value;
            if (elRsn) state.answers[globalIdx][pLabel][`tf_${itemIdx}_rsn`] = elRsn.value;
          });
        } else if (p.part_type === 'sequencing' && Array.isArray(p.items)) {
          if (!state.answers[globalIdx][pLabel]) state.answers[globalIdx][pLabel] = {};
          p.items.forEach((_, itemIdx) => {
            const el = document.getElementById(`comp-${globalIdx}-${safeIdLabel}-seq_${itemIdx}`);
            if (el) state.answers[globalIdx][pLabel][`seq_${itemIdx}`] = el.value;
          });
        } else {
          const el = document.getElementById(`comp-${globalIdx}-${safeIdLabel}`);
          if (el) state.answers[globalIdx][pLabel] = el.value;
        }
      });
    }
  };

  // ── 3. THE GRADING ENGINE ──
  window.submitExam = async () => {
    window.saveAllAnswers();
    clearInterval(state.timerInterval);

    app.innerHTML = `<div class="glass-panel-1 flex flex-col items-center p-22 text-center w-full max-w-lg mx-auto mt-20"><div class="spinner-sm mb-6"></div><h2 class="font-display text-2xl text-main">Grading Paper...</h2><p class="text-muted mt-2">Miss Wena is reviewing your answers. This may take a minute.</p></div>`;

    state.results = {};
    const aiPromises = [];

    state.allQs.forEach((q) => {
      const globalIdx = q.globalIdx;
      const ans = state.answers[globalIdx] || '';

      // ── Additive fields for window.SHL_FEEDBACK.renderReviewFeedback ──
      // correctAnswer / wrongExplanations / cognitiveSkill / studentAnswer
      // are pure pass-throughs from the question_bank row; they don't affect
      // the existing legacy review code path because that code never reads
      // them. Safe to add unconditionally.
      let safeWrongExpl = {};
      try {
        safeWrongExpl = typeof q.wrong_explanations === 'string'
          ? JSON.parse(q.wrong_explanations)
          : (q.wrong_explanations || {});
      } catch (_) { safeWrongExpl = {}; }
      let safeOptions = q.options || null;
      if (typeof safeOptions === 'string') {
        try { safeOptions = JSON.parse(safeOptions); } catch (_) { safeOptions = null; }
      }

      if (q.type === 'mcq') {
        const isCorrect = String(ans).trim() === String(q.correct_answer).trim();
        state.results[globalIdx] = { isCorrect, score: isCorrect ? q.marks : 0, maxScore: q.marks, text: isCorrect ? 'Spot on!' : `Expected: ${q.correct_answer}`, workedSolution: q.worked_solution,
          correctAnswer: q.correct_answer, wrongExplanations: safeWrongExpl, cognitiveSkill: q.cognitive_skill || '', studentAnswer: String(ans || ''), options: safeOptions };
      }
      else if (q.type === 'short_ans') {
        let accept = []; try { accept = JSON.parse(q.accept_also || '[]'); } catch (e) { }
        const isMath = state.paper.template.subject.toLowerCase() === 'mathematics' || state.paper.template.subject.toLowerCase() === 'maths';
        const isCorrect = isHeuristicMatch(ans, q.correct_answer, accept, isMath);
        state.results[globalIdx] = { isCorrect, score: isCorrect ? q.marks : 0, maxScore: q.marks, text: isCorrect ? 'Excellent!' : `Expected: ${q.correct_answer}`, workedSolution: q.worked_solution,
          correctAnswer: q.correct_answer, wrongExplanations: safeWrongExpl, cognitiveSkill: q.cognitive_skill || '', studentAnswer: String(ans || '') };
      }
      else if (q.type === 'cloze' || q.type === 'editing') {
        let bData = []; try { bData = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch (e) { }
        let score = 0;
        bData.forEach(b => {
          const num = b.number || b.id;
          const userA = String(ans[num] || '').trim().toLowerCase();
          const corA = String(b.correct_answer || b.correct_word || '').trim().toLowerCase();
          if (userA === corA) score++;
        });
        const isCorrect = score === bData.length;
        // Synthesise a flat "your answer" string for the cloze/editing review
        // panel — modal expects a string, not the {1: 'a', 2: 'b'} map.
        const flatAns = (bData || []).map(b => {
          const num = b.number || b.id;
          return `${num}. ${ans[num] || '—'}`;
        }).join(' · ');
        const flatCorrect = (bData || []).map(b => {
          const num = b.number || b.id;
          return `${num}. ${b.correct_answer || b.correct_word || ''}`;
        }).join(' · ');
        state.results[globalIdx] = { isCorrect, isPartial: score > 0 && score < bData.length, score, maxScore: bData.length, text: `${score} / ${bData.length} blanks correct.`, workedSolution: q.worked_solution || null,
          correctAnswer: flatCorrect, wrongExplanations: {}, cognitiveSkill: q.cognitive_skill || '', studentAnswer: flatAns };
      }
      else if (q.type === 'visual_text') {
        // Visual Text parts are always MCQ
        let pData = []; try { pData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch (e) { }
        let score = 0;
        pData.forEach(p => {
          const pLbl = p.label || 'Q1';
          if (String(ans[pLbl] || '').trim() === String(p.correct_answer || '').trim()) score += (p.marks || 1);
        });
        state.results[globalIdx] = { isCorrect: score === q.marks, isPartial: score > 0 && score < q.marks, score, maxScore: q.marks, text: `${score} marks awarded.`, workedSolution: q.worked_solution };
      }
      else {
        // AI Grading for Open Ended / Word Problem / Comprehension text
        let userAnsStr = typeof ans === 'object' ? JSON.stringify(ans) : String(ans);

        // 🚀 MASTERCLASS FIX: Combine global worked solution with specific part answers for the AI Grader & UI
        let combinedWorkedSolution = q.worked_solution || q.model_answer || '';
        let pData = []; try { pData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch (e) { }
        if (pData.length > 0) {
          let extractedParts = pData.map(p => `<strong>${esc(p.label || '')}</strong>: ` + window.extractPartModelAnswer(p)).join('\n\n');
          combinedWorkedSolution += (combinedWorkedSolution ? '\n\n' : '') + extractedParts;
        }

        const p = fetch('/api/grade-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: q.id, questionType: q.type, questionText: q.question_text, studentAnswer: userAnsStr, workedSolution: combinedWorkedSolution, marks: q.marks || 2 })
        }).then(res => res.json()).then(data => {
          state.results[globalIdx] = { isCorrect: data.score === (q.marks || 2), isPartial: data.score > 0 && data.score < (q.marks || 2), score: data.score || 0, maxScore: q.marks || 2, text: data.feedback, workedSolution: combinedWorkedSolution };
        }).catch(() => {
          state.results[globalIdx] = { isCorrect: false, score: 0, maxScore: q.marks, text: "AI Grading unavailable.", workedSolution: combinedWorkedSolution };
        });
        aiPromises.push(p);
      }
    });

    await Promise.allSettled(aiPromises);

    // Auto-save to Supabase before rendering results
    await saveExamResult();

    state.phase = 'RESULTS';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── 4. RESULTS RENDERER ──
  function renderResults() {
    // Reset focus-room max-width override
    if (app) app.style.maxWidth = '';

    let earned = 0;
    let possible = 0;
    state.allQs.forEach(q => {
      const r = state.results[q.globalIdx];
      if (r) { earned += r.score; possible += r.maxScore; }
    });

    const pct = possible > 0 ? Math.round((earned / possible) * 100) : 0;
    let gradeStr = 'Needs Practice', gradeCol = 'var(--brand-rose)';
    if (pct >= 90) { gradeStr = 'AL1'; gradeCol = 'var(--brand-mint)'; }
    else if (pct >= 85) { gradeStr = 'AL2'; gradeCol = 'var(--brand-mint)'; }
    else if (pct >= 80) { gradeStr = 'AL3'; gradeCol = 'var(--brand-sage)'; }
    else if (pct >= 75) { gradeStr = 'AL4'; gradeCol = 'var(--brand-sage)'; }
    else if (pct >= 65) { gradeStr = 'AL5'; gradeCol = 'var(--brand-amber)'; }
    else if (pct >= 45) { gradeStr = 'AL6'; gradeCol = 'var(--brand-amber)'; }
    else if (pct >= 20) { gradeStr = 'AL7'; gradeCol = 'var(--brand-rose)'; }
    else { gradeStr = 'AL8'; gradeCol = 'var(--brand-rose)'; }

    // Time spent — ceiling at allotted duration
    const allotted = state.initialDuration || ((state.paper.duration || state.paper.template?.durationMinutes || 60) * 60);
    const taken = Math.max(0, allotted - state.timerSeconds);
    const tH = Math.floor(taken / 3600);
    const tM = Math.floor((taken % 3600) / 60);
    const takenStr = tH > 0 ? `${tH} h ${tM} min` : `${tM} min`;
    const spareSecs = allotted - taken;
    let pacingNote = '';
    if (spareSecs > 60) {
      const sM = Math.round(spareSecs / 60);
      pacingNote = `${sM} min spare`;
    } else if (spareSecs < -60) {
      const oM = Math.round(Math.abs(spareSecs) / 60);
      pacingNote = `${oM} min over`;
    } else {
      pacingNote = 'on time';
    }

    // ── Section breakdown ──
    // Group state.allQs by sectionLabel; emit a row per section with mark bar.
    const sections = {};
    state.allQs.forEach(q => {
      const lbl = q.sectionLabel || 'Section';
      if (!sections[lbl]) sections[lbl] = [];
      sections[lbl].push(q);
    });

    const sectionRows = Object.entries(sections).map(([lbl, qs], idx) => {
      const sectionLetter = String.fromCharCode(65 + idx); // A, B, C...
      let secEarned = 0, secMax = 0;
      const segs = qs.map(q => {
        const r = state.results[q.globalIdx];
        if (!r) {
          secMax += q.marks || 1;
          return '<div class="section-row__seg is-blank"></div>';
        }
        secEarned += r.score;
        secMax += r.maxScore;
        if (r.isCorrect) return '<div class="section-row__seg is-correct"></div>';
        if (r.isPartial) return '<div class="section-row__seg is-partial"></div>';
        if (r.score === 0 && (typeof state.answers[q.globalIdx] === 'undefined' || state.answers[q.globalIdx] === '' || (typeof state.answers[q.globalIdx] === 'object' && Object.keys(state.answers[q.globalIdx] || {}).length === 0))) {
          return '<div class="section-row__seg is-blank"></div>';
        }
        return '<div class="section-row__seg is-wrong"></div>';
      }).join('');

      return `
        <div class="section-row">
          <div class="section-row__head">
            <div>
              <span class="section-row__label">§ ${sectionLetter}</span><span class="section-row__title">${esc(lbl)}</span>
            </div>
            <div class="section-row__score">${secEarned} / ${secMax}</div>
          </div>
          <div class="section-row__bar">${segs}</div>
        </div>`;
    }).join('');

    // ── Per-question review ──
    const reviewItems = state.allQs.map((q, i) => {
      const globalIdx = q.globalIdx;
      const r = state.results[globalIdx];
      const secLabel = q.sectionLabel || 'Section';

      let outcomeClass = 'is-wrong';
      let outcomeBadge = `<span class="badge badge-rose">${r ? r.score : 0} / ${r ? r.maxScore : (q.marks || 1)}</span>`;
      if (r && r.isCorrect) {
        outcomeClass = 'is-correct';
        outcomeBadge = `<span class="badge badge-success">${r.score} / ${r.maxScore}</span>`;
      } else if (r && r.isPartial) {
        outcomeClass = 'is-partial';
        outcomeBadge = `<span class="badge badge-amber">${r.score} / ${r.maxScore}</span>`;
      }

      // Drawings (working) — preserved feature
      let drawingHtml = '';
      Object.keys(state.drawings).filter(k => k.startsWith(globalIdx)).forEach(k => {
        if (state.drawings[k] !== 'init' && state.drawings[k] !== 'text') {
          drawingHtml += `<div style="margin-top: var(--space-2);"><span style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted);">Your working:</span><br><img src="${state.drawings[k]}" style="max-height: 150px; margin-top: 4px; border: 1px solid var(--border-light); border-radius: 8px; background: white;"></div>`;
        }
      });

      // ── Body: new misconception-led renderer for mcq/short_ans/cloze/editing,
      // legacy two-column compare for word_problem / open_ended / comprehension. ──
      const useNewRenderer =
        ['mcq', 'short_ans', 'cloze', 'editing'].includes(q.type) &&
        typeof window !== 'undefined' &&
        window.SHL_FEEDBACK &&
        typeof window.SHL_FEEDBACK.renderReviewFeedback === 'function';

      let bodyHtml;
      if (useNewRenderer && r) {
        // Map exam result outcome to feedback panel status. The panel handles
        // its own "your answer" line via showYourAnswer=true, so we don't
        // duplicate the legacy two-column compare here.
        const status = r.isCorrect ? 'correct' : (r.isPartial ? 'partial' : 'wrong');
        bodyHtml = window.SHL_FEEDBACK.renderReviewFeedback({
          status,
          studentAnswer:     r.studentAnswer || '',
          correctAnswer:     r.correctAnswer || q.correct_answer || '',
          wrongExplanations: r.wrongExplanations || {},
          options:           r.options || null,
          workedSolution:    r.workedSolution || '',
          cognitiveSkill:    r.cognitiveSkill || '',
          xpAwarded:         0,
          marks:             q.marks || 1,
        });
      } else {
        // Legacy review for multi-part word_problem / open_ended / comprehension.
        // AI-graded text feedback + side-by-side answer compare stays as-is.
        const savedAns = state.answers[globalIdx];
        let yourAnsHtml = '<em>No answer given</em>';
        if (savedAns) {
          if (typeof savedAns === 'object') {
            yourAnsHtml = Object.entries(savedAns)
              .map(([k, v]) => `<strong>${esc(k)}:</strong> ${esc(v)}`)
              .join('<br>');
          } else {
            yourAnsHtml = esc(String(savedAns));
          }
        }
        const correctAnsHtml = esc(String(q.correct_answer || q.model_answer || 'See worked solution'));
        const feedbackHtml = r && r.text
          ? `<div style="margin-top: var(--space-3); padding: var(--space-2); background: var(--surface); border: 1px solid var(--border-light); border-radius: 10px; font-size: 13px; color: var(--text-main); line-height: 1.5;"><strong style="color: var(--brand-sage);">Miss Wena:</strong> ${r.text}</div>`
          : '';
        const workedHtml = r && r.workedSolution
          ? `<details style="margin-top: var(--space-2);"><summary style="cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--brand-sage);">Worked solution</summary><div style="margin-top: var(--space-2); font-size: 13px; color: var(--text-main); line-height: 1.6;">${window.formatWorkedSolution(r.workedSolution)}</div></details>`
          : '';
        bodyHtml = `
          <div class="review-card__compare">
            <div class="review-card__col">
              <div class="review-card__col-label">Your answer</div>
              <div class="review-card__col-value">${yourAnsHtml}</div>
            </div>
            <div class="review-card__col">
              <div class="review-card__col-label">Correct answer</div>
              <div class="review-card__col-value">${correctAnsHtml}</div>
            </div>
          </div>
          ${feedbackHtml}
          ${workedHtml}`;
      }

      return `
        <div class="review-card ${outcomeClass}">
          <div class="review-card__eyebrow">${esc(secLabel)} · Q ${i + 1}</div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-2); margin-bottom: var(--space-2);">
            <div style="flex: 1;"><p class="review-card__stem">${esc(q.question_text || 'See passage / diagram')}</p></div>
            <div>${outcomeBadge}</div>
          </div>
          ${drawingHtml}
          ${bodyHtml}
        </div>`;
    }).join('');

    app.innerHTML = `
      <header class="exam-hero">
        <h1 class="h1-as exam-hero__title">Paper <em>complete</em>.</h1>
        <p class="body-lg exam-hero__lede">${esc(state.paper.template?.displayName || 'Practice Paper')} · ${esc(state.level)}</p>
      </header>

      <div class="verdict" style="border-top: 4px solid ${gradeCol};">
        <div class="verdict__col verdict__col--left">
          <span class="verdict__label">Marks earned</span>
          <div class="verdict__value-lg">${earned}<span style="font-size: 32px; opacity: 0.5;"> / ${possible}</span></div>
        </div>
        <div class="verdict__col">
          <h2 class="verdict__band" style="color: ${gradeCol};">${esc(gradeStr)}</h2>
          <div class="verdict__pct">${pct}%</div>
        </div>
        <div class="verdict__col verdict__col--right">
          <span class="verdict__label">Time taken</span>
          <div class="verdict__value-lg">${takenStr}</div>
          <div class="verdict__pct" style="color: var(--text-muted);">${pacingNote}</div>
        </div>
      </div>

      <div class="mark-sheet">
        <h3 class="h2-as" style="text-align: center; margin: var(--space-5) 0 var(--space-3); color: var(--text-main);">Section breakdown</h3>
        ${sectionRows}
      </div>

      <div class="mark-sheet">
        <h3 class="h2-as" style="text-align: center; margin: var(--space-5) 0 var(--space-3); color: var(--text-main);">Question by question</h3>
        ${reviewItems}
      </div>

      <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: var(--space-2); margin: var(--space-6) auto; max-width: 960px;">
        <button class="btn btn-primary" onclick="location.reload()">Take Another Paper</button>
        <button class="btn btn-secondary" onclick="window.location.href='dashboard.html'">Mission Control</button>
        <button class="btn btn-ghost" onclick="window.printMarkSheet()">Print Mark Sheet</button>
      </div>`;
  }

  // ── PRINT MARK SHEET ──
  // Uses ExamRenderer.renderMarkingScheme on the answered paper for a printable
  // record. Same engine as the blank-paper print, just answer-only output.
  window.printMarkSheet = () => {
    const pc = document.getElementById('print-container');
    if (pc && typeof ExamRenderer !== 'undefined' && state.paper) {
      pc.innerHTML = '';
      // Header for the mark sheet
      const head = document.createElement('div');
      head.innerHTML = `<h1 style="text-align:center;font-family:var(--font-display, 'Bebas Neue'),sans-serif;font-size:36px;letter-spacing:0.04em;margin-bottom:8px;">${esc(state.paper.template?.displayName || 'Practice Paper')}</h1>
        <p style="text-align:center;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;color:#666;">${esc(state.level)} · Marking Scheme</p>`;
      pc.appendChild(head);
      ExamRenderer.renderMarkingScheme(state.paper, pc);
      setTimeout(() => window.print(), 150);
    }
  };

  // ── 5. SUPABASE PERSISTENCE ──
  // Hardened against NOT-NULL violations on question_attempts. Same pattern as quiz.js:
  //   Production schema: question_text, topic, difficulty, correct, answer_chosen, correct_answer ALL NOT NULL.
  //   Comprehension/cloze/visual_text questions often have empty values for these fields,
  //   so each gets a guaranteed non-null fallback.
  async function saveExamResult() {
    if (!state.studentId) return;
    try {
      const sb = await window.getSupabase();
      let earned = 0, possible = 0;
      Object.values(state.results).forEach(r => { earned += r.score; possible += r.maxScore; });

      const totalMinutes = state.paper.duration || state.paper.template?.durationMinutes || 60;
      const timeTaken = (totalMinutes * 60) - state.timerSeconds;

      // 1. Save Aggregated Exam Result and retrieve the ID
      const { data: examData, error: examError } = await sb.from('exam_results').insert({
        student_id: state.studentId,
        subject: SYL.SUBJECT_DB_NAME[state.subjectKey] || state.subjectKey,
        level: state.level,
        exam_type: state.examType || 'PRACTICE',
        score: earned,
        total_marks: possible,
        questions_attempted: Object.keys(state.results).length,
        time_taken: timeTaken >= 0 ? timeTaken : null,
        completed_at: new Date().toISOString()
      }).select('id').single();

      if (examError) throw examError;

      // 2. 🚀 DEEP TECH ENGINE: Log individual question attempts with NOT-NULL safety guards
      const qAttempts = state.allQs.map((q) => {
        const globalIdx = q.globalIdx;
        const result = state.results[globalIdx];
        const ans = state.answers[globalIdx];

        // 🚀 NOT-NULL guards — string fallbacks for every required text column
        const safeQuestionText = String(q.question_text || q.passage || 'Diagram/Passage Question').slice(0, 500) || 'Untitled';
        const safeTopic = String(q.topic || 'mixed') || 'Mixed';
        const safeDifficulty = String(q.difficulty || 'standard') || 'standard';
        const safeAnswerChosen = String(ans != null ? (typeof ans === 'object' ? JSON.stringify(ans) : ans) : '').slice(0, 200) || '(no answer)';
        const safeCorrectAnswer = String(q.correct_answer || 'See model solution').slice(0, 500) || 'See model solution';

        return {
          exam_result_id: examData?.id || null,
          student_id: state.studentId,
          question_text: safeQuestionText,
          topic: safeTopic,
          sub_topic: q.sub_topic || null,
          cognitive_skill: q.cognitive_skill || null,
          difficulty: safeDifficulty,
          correct: result ? !!result.isCorrect : false,
          marks_earned: result ? (result.score || 0) : 0,
          marks_total: result ? (result.maxScore || q.marks || 1) : (q.marks || 1),
          answer_chosen: safeAnswerChosen,
          correct_answer: safeCorrectAnswer,
        };
      });

      if (qAttempts.length > 0) {
        const { error: qaErr } = await sb.from('question_attempts').insert(qAttempts);
        if (qaErr) console.error('question_attempts insert failed:', qaErr);
      }

    } catch (e) {
      console.error('Failed to save exam result to Supabase:', e);
    }
  }

  setTimeout(() => render(), 100);
};