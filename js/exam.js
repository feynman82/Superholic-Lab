window.initExamEngine = function() {
  'use strict';

  // ── 🚀 UTILITIES ──
  const app = document.getElementById('app');
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  
  window.formatWorkedSolution = function(raw) {
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
    } catch(e) {}
    // 🚀 MASTERCLASS FIX: Removed esc() so HTML tags from the database render correctly
    return `<span class="font-sans">${String(raw).replace(/\n/g, '<br>')}</span>`;
  };

  // 🚀 MASTERCLASS: Deep JSON Parser for Complex Comprehension Parts
  window.extractPartModelAnswer = function(part) {
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
    phase:      'INIT',
    level:      '',      
    levelKey:   '',      
    subject:    '',      
    subjectKey: '',      
    tier:       '',      
    examType:   '',      
    studentId:  new URLSearchParams(window.location.search).get('student'),    
    paper:      null,
    allQs:      [],          // 🚀 Added for Focus Room Pagination
    currentQIdx: 0,          // 🚀 Added for Focus Room Pagination
    flagged:    {},          // 🚀 Added for Focus Room Pagination
    answers:    {},      
    drawings:   {},      
    results:    null,
    timerSeconds: 0,
    timerInterval: null
  };

  function render() {
    switch(state.phase) {
      case 'INIT':    renderInit();    break;
      case 'SUBJECT': renderSubject(); break;
      case 'TYPE':    renderType();    break;
      case 'GEN':     renderGenerating(); break;
      case 'EXAM':    renderFocusExam(); break;
      case 'RESULTS': renderResults(); break;
    }
  }

  // ── 1. INITIALISATION & NAVIGATION PHASES ──
  async function renderInit() {
    app.innerHTML = `<div class="card flex flex-col items-center w-full" style="padding: var(--space-8); max-width: 600px;"><div class="spinner-sm mb-4"></div><h2 class="font-display text-2xl text-main">Preparing Exam Room...</h2><p class="text-sm text-muted mt-2">Loading student profile</p></div>`;
    try {
      const profile = window.userProfile;
      if (!profile) { window.location.href = 'login.html?redirect=exam'; return; }

      const sb = await window.getSupabase();
      let activeStudentId = state.studentId || localStorage.getItem('shl_active_student_id');

      const { data: students } = await sb.from('students').select('id,level,selected_subject').eq('parent_id', profile.id);
      const student = (students || []).find(s => s.id === activeStudentId) || (students || [])[0];
      
      if (!student) {
        app.innerHTML = `<div class="card p-8 text-center w-full" style="max-width: 600px;"><p class="text-amber font-bold mb-4">No student profile found. Please set one up.</p></div>`;
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
      app.innerHTML = `<div class="card p-8 text-center w-full" style="max-width: 600px;"><p class="text-danger font-bold mb-4">Failed to load profile.</p><button class="btn btn-primary" onclick="location.reload()">Reload</button></div>`;
    }
  }

  function renderSubject() {
    const levelNum = state.level.replace('Primary ', '');
    const subjects = [
      { name: 'Mathematics', icon: '📐', tag: 'P1–P6' },
      { name: 'Science', icon: '🔬', tag: 'P3–P6' },
      { name: 'English', icon: '📖', tag: 'P1–P6' }
    ];

    const cards = subjects.map(s => `
      <div class="card hover-lift flex flex-col items-center justify-center p-8 text-center cursor-pointer" onclick="window.selectSubject('${s.name}')">
        <div class="text-4xl mb-4">${s.icon}</div>
        <h3 class="font-display text-2xl text-main">${s.name}</h3>
        <div class="badge badge-info mt-2">${s.tag}</div>
      </div>
    `).join('');

    app.innerHTML = `
      <div class="w-full flex flex-col items-center" style="max-width: 800px;">
        <div class="text-center mb-8 w-full">
          <div class="badge badge-info mb-2">Step 1 of 2</div>
          <h1 class="font-display text-4xl text-main">Choose a Subject</h1>
          <p class="text-muted text-lg mt-2">Primary ${esc(levelNum)}</p>
        </div>
        <div class="w-full" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-6);">
          ${cards}
        </div>
      </div>
    `;
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

      // 1 & 2. Label formatting and CSS 3.0 Colour Mapping
      if (qType === 'mcq') {
        label = 'MCQ';
        colour = 'var(--brand-rose)';
      } else if (qType === 'short_ans') {
        label = 'SHORT<br>ANS';
        colour = 'var(--maths-colour)';
      } else if (qType === 'word_problem') {
        label = 'WORD<br>PROBLEM';
        colour = 'var(--maths-colour)';
      } else if (qType === 'open_ended') {
        label = 'OPEN<br>ENDED';
        colour = 'var(--english-colour)';
      } else if (qType === 'editing') {
        label = 'EDITING';
        colour = 'var(--brand-error)';
      } else if (qType === 'comprehension') {
        label = 'COMPREHENSION';
        colour = 'var(--english-colour)';
      } else if (qType === 'visual_text') {
        label = 'VISUAL TEXT<br>COMPREHENSION';
        colour = 'var(--english-colour)';
      } else if (qType === 'cloze') {
        colour = 'var(--brand-mint)';
        const sub = (sec.subTopics && sec.subTopics[0]) ? sec.subTopics[0].toUpperCase() : '';
        if (sub) {
          label = `${sub}<br>CLOZE`;
        } else {
          label = 'CLOZE';
        }
      }

      // Cleaned up circular styling for transparent outline pills
      const pills = Array.from({ length: qCount }, (_, i) => `<span class="mock-q-pill" style="border: 1px solid ${colour}; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color:${colour}; background: transparent; padding: 0;">${i + 1}</span>`).join('');
      
      // 3. Subheader Grouping (Booklet A, Booklet B, etc.)
      if (sec.label !== currentLabel) {
        strips += `<div class="font-bold text-main text-base mt-6 mb-1">${esc(sec.label)}</div>`;
        currentLabel = sec.label;
      }

      // 4 & 5. Unbolded text-sm font mapping, flex-1 alignment right, & padding (py-2)
      strips += `
        <div class="flex items-center gap-2 py-2" style="border-bottom: 1px dashed var(--border-light);">
          <div class="text-sm uppercase tracking-wide" style="min-width: 140px; white-space: normal; line-height: 1.3; color: ${colour}; font-family: var(--font-body);">${label}</div>
          <div class="flex flex-wrap gap-1 flex-1 justify-start">${pills}</div>
          <div class="font-bold text-sm text-main text-right" style="min-width: 40px;">${sectionMarks}M</div>
        </div>`;
    });

    return `<div class="mt-4 bg-surface border border-light rounded-lg p-1 shadow-sm"><div class="text-xs font-bold uppercase tracking-wider text-muted mb-2 pb-4 pt-4 border-b border-light">Paper Format Preview</div>${strips}</div>`;
  }

  function renderType() {
    let types = [
      { id: 'WA1', label: 'WA 1', sub: 'Weighted Assessment 1' },
      { id: 'WA2', label: 'WA 2', sub: 'Weighted Assessment 2' }
    ];
    if (state.levelKey === 'primary-6') {
  // Maths gets split papers; Science & English get single PSLE paper
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
      <div class="card p-4 flex-1 cursor-pointer hover-lift flex flex-col justify-center ${t.id === state.examType ? 'bg-sage-dark text-white' : 'bg-surface text-main'}" 
           style="min-width: 140px; border: 2px solid ${t.id === state.examType ? 'var(--brand-mint)' : 'var(--border-light)'};"
           onclick="window.selectType('${t.id}')">
        <div class="font-bold text-lg" style="color: inherit;">${esc(t.label)}</div>
        <div class="text-xs mt-2" style="color: ${t.id === state.examType ? 'var(--sage-dark)' : 'var(--text-muted)'};">${esc(t.sub)}</div>
      </div>
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

    let blueprintHtml = '<p class="text-muted text-sm">Loading blueprint...</p>';
    if (tpl) {
      const duration = tpl.durationMinutes || tpl.duration || 0;
      const durationText = typeof formatDuration === 'function' ? formatDuration(duration) : `${duration} mins`;
      blueprintHtml = `
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-display text-2xl text-main m-0">Exam Dossier</h2>
          <div class="badge badge-info">DRAFT</div>
        </div>
        <ul class="flex flex-col gap-2 text-sm text-main mb-4 list-reset">
          <li class="flex justify-between" style="border-bottom: 1px solid var(--border-light); padding-bottom: var(--space-2);">
            <span>Total Duration</span> <span class="font-bold">⏱ ${esc(durationText)}</span>
          </li>
          <li class="flex justify-between" style="border-bottom: 1px solid var(--border-light); padding-bottom: var(--space-2);">
            <span>Total Marks</span> <span class="font-bold">${tpl.totalMarks || 0} M</span>
          </li>
        </ul>
        ${renderMockPreview(tpl)}
      `;
    }

    app.innerHTML = `
      <div class="w-full flex flex-col items-center" style="max-width: 800px;">
        <div class="text-center mb-8 w-full">
          <div class="badge badge-info mb-2">${state.tier === 'single_subject' ? 'Step 1 of 1' : 'Step 2 of 2'}</div>
          <h1 class="font-display text-4xl text-main">Select Paper Type</h1>
        </div>
        <div class="flex flex-wrap gap-6 items-start w-full">
          <div class="flex-1 flex flex-col gap-4" style="min-width: 300px;">
            <div class="flex flex-wrap gap-4">${chips}</div>
            ${state.tier !== 'single_subject' ? `<div class="text-center mt-4"><button class="btn btn-ghost" onclick="window.backToSubject()">← Back to Subjects</button></div>` : ''}
          </div>
          <div class="flex-1" style="min-width: 300px;">
            <div class="card p-6 bg-page card-rule-mint w-full">
              ${blueprintHtml}
              <button id="printPaperBtn" class="btn btn-secondary w-full mt-4 hover-lift" onclick="window.printBlankPaper()">🖨️ Print Paper</button>
              <button class="btn btn-primary w-full mt-4 hover-lift" onclick="window.triggerGen()">Generate Paper →</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.selectType = (id) => { state.examType = id; render(); };
  window.backToSubject = () => { state.phase = 'SUBJECT'; state.examType = ''; render(); };
  window.triggerGen = () => { state.phase = 'GEN'; render(); };

  window.printBlankPaper = async () => {
    const btn = document.getElementById('printPaperBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-sm" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-right:6px;border-top-color:currentColor;"></span> Assembling...';
    
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
      <div class="card flex flex-col items-center justify-center text-center w-full" style="padding: var(--space-8); max-width: 600px;">
        <div class="spinner-sm mb-6"></div>
        <h2 class="font-display text-3xl text-main mb-2" id="genMsg">Assembling Paper...</h2>
        <p class="text-muted text-sm">Applying MOE difficulty calibration</p>
      </div>
    `;

    const msgs = ['Gathering questions...', 'Calibrating difficulty...', 'Checking syllabus alignment...'];
    let m = 0;
    const int = setInterval(() => { m = (m+1)%msgs.length; const el = document.getElementById('genMsg'); if(el) el.textContent = msgs[m]; }, 1000);

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
          <div class="card p-8 text-center w-full hover-lift" style="max-width: 600px;">
            <div class="text-4xl mb-4">🗂️</div>
            <h2 class="text-danger font-display text-2xl mb-2">Insufficient Questions</h2>
            <p class="text-muted mb-6">Miss Wena's database doesn't have enough questions to assemble a full <strong>${esc(state.examType)}</strong> paper for this subject yet.</p>
            <button class="btn btn-primary hover-lift" onclick="location.reload()">Return to Menu</button>
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
      const totalMinutes = state.paper.duration || state.paper.template?.durationMinutes || 60;
      state.timerSeconds = totalMinutes * 60;
      
      state.phase = 'EXAM';
      render();
      startTimer();
    }).catch(err => {
      clearInterval(int);
      app.innerHTML = `<div class="card p-8 text-center w-full" style="max-width: 600px;"><p class="text-danger font-bold mb-4">Error: ${err.message}</p><button class="btn btn-primary hover-lift" onclick="location.reload()">Try Again</button></div>`;
    });
  }

  // ── TIMER LOGIC ──
  function startTimer() {
    clearInterval(state.timerInterval);
    
    const updateTimer = () => {
      if (state.timerSeconds > 0) state.timerSeconds--;
      const el = document.getElementById('nav-timer-container');
      if (el) {
        el.classList.remove('hidden'); // Force show if hidden by header.js
        const h = Math.floor(state.timerSeconds / 3600);
        const m = Math.floor((state.timerSeconds % 3600) / 60);
        const s = state.timerSeconds % 60;
        const timeStr = h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
        el.innerHTML = `<div class="badge bg-elevated border border-light text-main font-bold shadow-sm" style="font-size: 1rem; padding: 6px 16px;">⏱ ${timeStr}</div>`;
        if (state.timerSeconds < 300) el.querySelector('.badge').style.color = 'var(--brand-error)';
      }
    };
    
    updateTimer(); // Trigger immediately
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
      let classes = 'nav-pip hover-lift';
      // Fallback styling in case style.css misses nav-pip
      let inlineStyle = 'display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:8px; font-weight:bold; border:2px solid var(--border-light); background:var(--bg-surface); cursor:pointer; color:var(--text-main); transition:all 0.2s ease;';
      
      if (i === state.currentQIdx) {
          classes += ' is-active';
          inlineStyle += ' border-color:var(--brand-sage); background:var(--brand-sage); color:white;';
      }
      else if (state.flagged[i]) {
          classes += ' is-flagged';
          inlineStyle += ' border-color:var(--brand-amber); background:rgba(217,119,6,0.1); color:var(--brand-amber);';
      }
      else if (state.answers[state.allQs[i].globalIdx] && Object.keys(state.answers[state.allQs[i].globalIdx]).length !== 0) {
          classes += ' is-answered';
          inlineStyle += ' border-color:var(--brand-mint); background:rgba(5,150,105,0.1); color:var(--brand-mint);';
      }
      return `<button class="${classes}" style="${inlineStyle}" onclick="window.jumpToQ(${i})">${i+1}</button>`;
    }).join('');

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
    const paneMaxWidth = isSplitScreen ? '100%' : '680px';

    app.innerHTML = `
      <div class="sticky top-[var(--navbar-h)] z-40 bg-surface border-b border-light w-full p-4 mb-6 shadow-sm flex flex-col justify-center items-center text-center rounded-xl max-w-[1440px]">
        <h2 class="font-display text-xl text-main m-0">${p.template.displayName || p.displayName}</h2>
        <div class="text-sm text-muted mt-1">${p.template.totalMarks || p.totalMarks} Marks • ${p.template.durationMinutes || p.duration} mins</div>
      </div>

      <div class="flex flex-wrap gap-6 items-start w-full justify-center max-w-[1440px]">
        <div class="flex flex-col" style="flex: 1 1 300px; max-width: ${paneMaxWidth}; width: 100%; transition: max-width 0.3s ease;">
          <div class="badge badge-info mb-4 self-start">${esc(q.sectionLabel || 'Exam')}</div>
          
          <div class="card p-6 mb-4 flex-1 relative">
            <div class="absolute top-6 right-6 badge badge-info">${q.marks} mark${q.marks>1?'s':''}</div>
            <div class="flex justify-between items-center mb-4" style="border-bottom: 1px solid var(--border-light); padding-bottom: var(--space-2);">
              <div class="font-bold text-brand-sage text-lg">Question ${state.currentQIdx + 1} of ${totalQs}</div>
            </div>
            
            ${q.sectionInstr ? `<p class="text-sm text-muted italic mb-4">${esc(q.sectionInstr)}</p>` : ''}
            
            ${diagramHtml}
            ${!isSplitScreen && !isInlinePassage ? qTextHtml : ''}
            ${inputUi}
          </div>

          <div class="card p-4 flex flex-wrap justify-between items-center bg-surface gap-4">
            <button class="btn btn-ghost" onclick="window.navExam(-1)" ${state.currentQIdx === 0 ? 'disabled' : ''}>← Previous</button>
            <button class="btn btn-ghost hover-lift" onclick="window.toggleFlag()" style="color: ${state.flagged[state.currentQIdx] ? 'var(--brand-amber)' : 'var(--text-muted)'}; border: 1px solid ${state.flagged[state.currentQIdx] ? 'var(--brand-amber)' : 'transparent'};">
              ${state.flagged[state.currentQIdx] ? '🚩 Flagged' : '🚩 Flag for review'}
            </button>
            ${state.currentQIdx === totalQs - 1 
              ? `<button class="btn btn-primary hover-lift" onclick="window.manualSubmit()">Submit Paper →</button>`
              : `<button class="btn btn-secondary hover-lift" onclick="window.navExam(1)">Next →</button>`
            }
          </div>
        </div>

        <div style="flex: 0 0 280px; width: 100%;">
          <div class="card p-6" style="position: sticky; top: 100px;">
            <h3 class="font-bold text-main mb-4 m-0">Exam Navigator</h3>
            <div class="exam-navigator flex flex-wrap gap-2">${navPips}</div>
            <div class="flex flex-col gap-2 mt-4 pt-4 text-xs text-muted font-medium" style="border-top: 1px solid var(--border-light);">
              <div class="flex items-center gap-2"><div style="width: 12px; height: 12px; border-radius: 4px; background: var(--bg-elevated); border:1px solid var(--border-light);"></div> Unanswered</div>
              <div class="flex items-center gap-2"><div style="width: 12px; height: 12px; border-radius: 4px; background: rgba(5, 150, 105, 0.1); border:1px solid var(--brand-mint);"></div> Answered</div>
              <div class="flex items-center gap-2"><div style="width: 12px; height: 12px; border-radius: 4px; background: rgba(217, 119, 6, 0.1); border:1px solid var(--brand-amber);"></div> Flagged</div>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
        if(typeof initAllCanvases === 'function') initAllCanvases();
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
    if (!visual_payload || typeof DiagramLibrary === 'undefined') return '';
    try {
      const fnName = visual_payload.function_name;
      if (typeof DiagramLibrary[fnName] === 'function') {
        // 🚀 MASTERCLASS FIX: Crash Shield for bad SVG generation
        const svgHtml = DiagramLibrary[fnName](visual_payload.params || {});
        if (String(svgHtml).includes('NaN')) throw new Error('AI generated invalid geometry (NaN)');
        return `<div class="mb-4 mx-auto flex justify-center w-full" style="max-width: 600px; overflow-x: auto;">${svgHtml}</div>`;
      }
    } catch(e) {
      console.error("[DiagramLibrary] Rendering crashed:", e);
    }
    return '';
  }

  function buildMCQOptions(q, qIndex) {
    const letters = ['A','B','C','D'];
    const savedAns = state.answers[qIndex] || ''; 
    let safeOptions = [];
    try { safeOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []); } catch(e) {}

    return safeOptions.map((opt, i) => {
      const isSel = savedAns === opt;
      return `<div class="mcq-opt hover-lift ${isSel?' is-sel':''}" onclick="window.selectExamMcq('${qIndex}', ${i})">
        <span class="mcq-badge">${letters[i]}</span><span class="font-medium text-main">${esc(opt)}</span>
      </div>`;
    }).join('');
  }

  window.selectExamMcq = (qIndex, optIdx) => {
    window.saveAllAnswers(); 
    const q = state.allQs.find(x => x.globalIdx === qIndex);
    if (!q) return;
    
    let safeOptions = [];
    try { safeOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []); } catch(e) {}
    
    state.answers[qIndex] = safeOptions[optIdx];
    renderFocusExam(); 
  };

  function buildTextAreaUI(q, globalIdx) {
    let savedAns = String(state.answers[globalIdx] || '');
    const isShortAns = q.type === 'short_ans';
    const isSynthesis = (q.topic || '').toLowerCase() === 'synthesis';
    const isDrawMode = state.drawings[globalIdx] && state.drawings[globalIdx] !== 'text';
    
    const baseStyle = "form-input w-full p-4 text-lg border-2 border-slate-200 focus:border-brand-sage rounded-xl transition-all shadow-sm";
    const drawStyle = "form-input mt-3 w-full p-4 text-lg border-2 border-brand-sage focus:border-brand-sage rounded-xl transition-all shadow-sm bg-sage-50/10";
    
    let synthesisHtml = '';
    if (isSynthesis && q.instructions) {
        let rawConnector = '';
        const match = q.instructions.match(/'([^']+)'/);
        if (match) rawConnector = match[1];
        const cleanConnector = rawConnector.replace(/^\.\.\.|\.\.\.$|^\(|\)$/g, '').trim(); 
        
        // 🚀 MASTERCLASS FIX: Force flex lines to connect seamlessly
        const lineBlock = `<div style="flex-grow: 1; border-bottom: 2px solid var(--text-main); margin-bottom: 0.3rem; opacity: 0.5; min-width: 40px;"></div>`;
          
        let blueprintHtml = '';
        if (rawConnector.startsWith('...') && rawConnector.endsWith('...')) {
           blueprintHtml = `${lineBlock}<div class="font-bold text-brand-rose px-4 py-2 bg-surface rounded shadow-sm text-sm uppercase tracking-widest mx-2">${esc(cleanConnector)}</div>${lineBlock}`;
        } else if (rawConnector.startsWith('(') && rawConnector.endsWith(')')) {
           blueprintHtml = `${lineBlock}<div class="font-bold text-brand-rose px-4 py-2 bg-surface rounded shadow-sm text-sm uppercase tracking-widest mx-2">${esc(cleanConnector)}</div>${lineBlock}`;
        } else if (rawConnector.startsWith('...')) {
           blueprintHtml = `${lineBlock}<div class="font-bold text-brand-rose px-4 py-2 bg-surface rounded shadow-sm text-sm uppercase tracking-widest ml-2">${esc(cleanConnector)}</div>`;
        } else {
           blueprintHtml = `<div class="font-bold text-brand-rose px-4 py-2 bg-surface rounded shadow-sm text-sm uppercase tracking-widest mr-2">${esc(cleanConnector)}</div>${lineBlock}`;
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
    try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch(e) {}
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
      const drawStyle = "form-input mt-3 w-full p-4 text-lg border-2 border-brand-sage focus:border-brand-sage rounded-xl bg-sage-50/10";

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
     try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch(e) {}
     
     let wordBankHtml = '';
     const isGrammar = (q.sub_topic || '').toLowerCase() === 'grammar';
     
     if (isGrammar) {
       const allWords = new Set();
       blanks.forEach(b => (b.options || []).forEach(w => allWords.add(w)));
       if (allWords.size > 0) {
         // 🚀 MASTERCLASS FIX: Case-insensitive alphabetical sort
         const sortedWords = [...allWords].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
         const wordBankList = sortedWords.map((w, i) =>
           `<span class="badge bg-surface border border-light text-main" style="font-size:0.9rem; padding: 6px 12px; font-weight: 500;">(${i+1}) ${esc(w)}</span>`
         ).join('');
         wordBankHtml = `
           <div class="card bg-page p-4 mb-4">
             <div class="text-xs font-bold text-muted uppercase mb-3">Word Bank</div>
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
           const opts = sortedOpts.map(o => `<option value="${esc(o)}" ${saved===o?'selected':''}>${esc(o)}</option>`).join('');
           inputHtml = `<select id="inline-${globalIdx}-${num}" class="cloze-select" style="min-width:100px;" onchange="window.saveAllAnswers()"><option value="" disabled ${!saved?'selected':''}>Select...</option>${opts}</select>`;
        } else {
           inputHtml = `<input type="text" id="inline-${globalIdx}-${num}" class="editing-input" placeholder="type here" value="${esc(saved)}" onblur="window.saveAllAnswers()">`;
        }
        passage = passage.replace(new RegExp(`_*\\s*(\\[|\\()${num}(\\]|\\))\\s*_*`, 'g'), inputHtml);
     });
     
     return `${wordBankHtml}<div class="card p-6 bg-surface text-lg leading-relaxed cloze-passage">${passage}</div>`;
  }

  function buildEditingUI(q, globalIdx) {
     let passage = esc(q.passage || '').replace(/\n/g, '<br><br>').replace(/&lt;u&gt;/gi, '<u>').replace(/&lt;\/u&gt;/gi, '</u>').replace(/&lt;br\s*\/?\s*&gt;/gi, '<br>');
     const savedAns = state.answers[globalIdx] || {};
     
     passage = passage.replace(/\[(\d+)\]/g, (match, numStr) => {
        const num = parseInt(numStr, 10);
        const saved = savedAns[num] || '';
        return `<input type="text" id="inline-${globalIdx}-${num}" value="${esc(saved)}" autocomplete="off" class="editing-inline-input" onblur="window.saveAllAnswers()">`;
     });
     return `<div class="card p-6 editing-passage text-lg leading-relaxed bg-surface">${passage}</div>`;
  }

  function buildComprehensionUI(q, globalIdx) {
    let partsData = [];
    try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch(e) {}
    
    const partsHtml = partsData.map((p, pIdx) => {
       const pLabel = p.label || `Q${pIdx + 1}`;
       const safeIdLabel = String(pLabel).replace(/[^a-zA-Z0-9]/g, '');
       const savedObj = state.answers[globalIdx] || {};
       let inter = '';
       
       if (p.part_type === 'mcq') {
                const saved = savedObj[pLabel] || '';
                inter = (p.options||[]).map((opt, i) => `<div class="mcq-opt hover-lift ${saved===opt?'is-sel':''}" onclick="window.selectCompMcq('${globalIdx}', '${pLabel}', ${i})"><span class="mcq-badge">${['A','B','C','D'][i]}</span><span>${esc(opt)}</span></div>`).join('');
             } else if (p.part_type === 'referent' && Array.isArray(p.items)) {
                const rows = p.items.map((item, i) => {
                   const saved = (savedObj[pLabel] || {})[`ref_${i}`] || '';
                   return `<tr><td class="p-4 border border-light font-medium">${esc(item.word)}</td><td class="p-4 border border-light"><input type="text" id="comp-${globalIdx}-${safeIdLabel}-ref_${i}" class="form-input w-full p-3 bg-surface" placeholder="Type referent..." value="${esc(saved)}" onblur="window.saveAllAnswers()"></td></tr>`;
                }).join('');
                inter = `<table class="w-full text-left border-collapse text-main bg-white rounded-xl overflow-hidden shadow-sm"><thead><tr><th class="p-4 border border-light bg-page font-bold text-sm uppercase text-muted">Word from passage</th><th class="p-4 border border-light bg-page font-bold text-sm uppercase text-muted">What it refers to</th></tr></thead><tbody>${rows}</tbody></table>`;
             } else if (p.part_type === 'true_false' && Array.isArray(p.items)) {
                const rows = p.items.map((item, i) => {
                   const savedAns = (savedObj[pLabel] || {})[`tf_${i}_ans`] || '';
                   const savedRsn = (savedObj[pLabel] || {})[`tf_${i}_rsn`] || '';
                   return `<tr><td class="p-4 border border-light font-medium text-base leading-relaxed w-1/2">${esc(item.statement)}</td><td class="p-4 border border-light w-1/2"><div class="flex gap-4 mb-3"><label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="comp-${globalIdx}-${safeIdLabel}-tf_${i}" value="True" ${savedAns==='True'?'checked':''} onchange="window.saveAllAnswers()"> True</label><label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="comp-${globalIdx}-${safeIdLabel}-tf_${i}" value="False" ${savedAns==='False'?'checked':''} onchange="window.saveAllAnswers()"> False</label></div><textarea id="comp-${globalIdx}-${safeIdLabel}-tf_${i}_rsn" class="form-input w-full p-3 text-sm bg-surface" rows="2" placeholder="Type reason from passage..." onblur="window.saveAllAnswers()">${esc(savedRsn)}</textarea></td></tr>`;
                }).join('');
                inter = `<table class="w-full text-left border-collapse text-main bg-white rounded-xl overflow-hidden shadow-sm"><thead><tr><th class="p-4 border border-light bg-page font-bold text-sm uppercase text-muted">Statement</th><th class="p-4 border border-light bg-page font-bold text-sm uppercase text-muted">True / False & Reason</th></tr></thead><tbody>${rows}</tbody></table>`;
             } else if (p.part_type === 'sequencing' && Array.isArray(p.items)) {
                const rows = p.items.map((item, i) => {
                   const saved = (savedObj[pLabel] || {})[`seq_${i}`] || '';
                   return `<div class="flex items-center gap-4 mb-4 p-4 bg-white border border-light rounded-xl shadow-sm">
                        <input type="number" 
                                id="comp-${globalIdx}-${safeIdLabel}-seq_${i}" 
                                style="width: 60px; flex-shrink: 0;" 
                                class="form-input p-3 text-center font-display text-xl" 
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
              return `<div class="mb-6 pb-6 ${pIdx < partsData.length - 1 ? 'border-b border-light border-dashed' : ''}"><div class="flex items-center gap-3 mb-3"><span class="font-display text-xl text-main font-bold" style="color: var(--english-colour);">${pLabel}</span><span class="badge badge-info text-xs">${p.marks || 1} mark${(p.marks||1) !== 1 ? 's' : ''}</span></div>${p.question ? `<div class="text-lg text-main font-medium mb-4 leading-relaxed">${esc(p.question)}</div>` : ''}${inter}</div>`;
            }).join('');

         return `
             <div class="flex flex-col lg:flex-row gap-6 comp-container">
               <div class="lg:w-1/2 card p-6 text-lg leading-relaxed bg-surface comp-passage-pane">
                  ${q.type === 'visual_text' && q.image_url ? `<img src="${q.image_url}" class="w-full rounded border border-light">` : esc(q.passage || '').replace(/\n/g, '<br><br>').replace(/&lt;br\s*\/?\s*&gt;/gi, '<br>')}
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
    try { pData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch(e) {}
    const pInfo = pData.find(x => (x.label || '') === pLabel) || pData[parseInt(pLabel.replace('Q',''))-1];
    
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
      const stop = () => { if(isDrawing) { isDrawing = false; state.drawings[drawKey] = canvas.toDataURL(); } };

      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stop);
      canvas.addEventListener('mouseout', stop);
      canvas.addEventListener('touchstart', start, {passive: false});
      canvas.addEventListener('touchmove', draw, {passive: false});
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
           try { pData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch(e) {}
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
           try { bData = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch(e) {}
           if (!state.answers[globalIdx]) state.answers[globalIdx] = {};
           bData.forEach(b => {
             const num = b.number || b.id;
             const el = document.getElementById(`inline-${globalIdx}-${num}`);
             if (el) state.answers[globalIdx][num] = el.value;
           });
        }
        else if (q.type === 'comprehension' || q.type === 'visual_text') {
       let pData = [];
       try { pData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch(e) {}
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
    
    app.innerHTML = `<div class="card flex flex-col items-center p-12 text-center w-full max-w-lg mx-auto mt-10"><div class="spinner-sm mb-6"></div><h2 class="font-display text-2xl text-main">Grading Paper...</h2><p class="text-muted mt-2">Miss Wena is reviewing your answers. This may take a minute.</p></div>`;

    state.results = {};
    const aiPromises = [];

    state.allQs.forEach((q) => {
        const globalIdx = q.globalIdx;
        const ans = state.answers[globalIdx] || '';
        
        if (q.type === 'mcq') {
           const isCorrect = String(ans).trim() === String(q.correct_answer).trim();
           state.results[globalIdx] = { isCorrect, score: isCorrect ? q.marks : 0, maxScore: q.marks, text: isCorrect ? 'Spot on!' : `Expected: ${q.correct_answer}`, workedSolution: q.worked_solution };
        } 
        else if (q.type === 'short_ans') {
           let accept = []; try { accept = JSON.parse(q.accept_also || '[]'); } catch(e){}
           const isMath = state.paper.template.subject.toLowerCase() === 'mathematics' || state.paper.template.subject.toLowerCase() === 'maths';
           const isCorrect = isHeuristicMatch(ans, q.correct_answer, accept, isMath);
           state.results[globalIdx] = { isCorrect, score: isCorrect ? q.marks : 0, maxScore: q.marks, text: isCorrect ? 'Excellent!' : `Expected: ${q.correct_answer}`, workedSolution: q.worked_solution };
        }
        else if (q.type === 'cloze' || q.type === 'editing') {
           let bData = []; try { bData = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch(e) {}
           let score = 0;
           bData.forEach(b => {
             const num = b.number || b.id;
             const userA = String(ans[num] || '').trim().toLowerCase();
             const corA = String(b.correct_answer || b.correct_word || '').trim().toLowerCase();
             if (userA === corA) score++;
           });
           const isCorrect = score === bData.length;
           state.results[globalIdx] = { isCorrect, isPartial: score > 0 && score < bData.length, score, maxScore: bData.length, text: `${score} / ${bData.length} blanks correct.`, workedSolution: null };
        }
        else if (q.type === 'visual_text') {
           // Visual Text parts are always MCQ
           let pData = []; try { pData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch(e) {}
           let score = 0;
           pData.forEach(p => {
             const pLbl = p.label || 'Q1';
             if (String(ans[pLbl]||'').trim() === String(p.correct_answer||'').trim()) score += (p.marks || 1);
           });
           state.results[globalIdx] = { isCorrect: score === q.marks, isPartial: score > 0 && score < q.marks, score, maxScore: q.marks, text: `${score} marks awarded.`, workedSolution: q.worked_solution };
        }
        else {
           // AI Grading for Open Ended / Word Problem / Comprehension text
           let userAnsStr = typeof ans === 'object' ? JSON.stringify(ans) : String(ans);
           
           // 🚀 MASTERCLASS FIX: Combine global worked solution with specific part answers for the AI Grader & UI
           let combinedWorkedSolution = q.worked_solution || q.model_answer || '';
           let pData = []; try { pData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch(e) {}
           if (pData.length > 0) {
               let extractedParts = pData.map(p => `<strong>${esc(p.label || '')}</strong>: ` + window.extractPartModelAnswer(p)).join('\n\n');
               combinedWorkedSolution += (combinedWorkedSolution ? '\n\n' : '') + extractedParts;
           }

           const p = fetch('/api/grade-answer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ questionId: q.id, questionType: q.type, questionText: q.question_text, studentAnswer: userAnsStr, workedSolution: combinedWorkedSolution, marks: q.marks || 2 })
           }).then(res => res.json()).then(data => {
              state.results[globalIdx] = { isCorrect: data.score === (q.marks||2), isPartial: data.score > 0 && data.score < (q.marks||2), score: data.score || 0, maxScore: q.marks || 2, text: data.feedback, workedSolution: combinedWorkedSolution };
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
    let earned = 0;
    let possible = 0;
    
    const items = state.allQs.map((q, i) => {
        const globalIdx = q.globalIdx;
        const r = state.results[globalIdx];
        const secLabel = q.sectionLabel || 'Section';
        
        earned += r.score;
        possible += r.maxScore;
        
        const ruleClass = r.isCorrect ? 'card-rule-mint' : (r.isPartial ? 'card-rule-amber' : 'card-rule-rose');
        const bgClass = r.isCorrect ? 'bg-science-tint' : (r.isPartial ? 'bg-amber-tint' : 'bg-rose-tint');
        const icon = r.isCorrect ? '✅' : (r.isPartial ? '⚠️' : '❌');
        
        let ansHtml = '';
        const savedAns = state.answers[globalIdx];
        if (typeof savedAns === 'object' && savedAns !== null) {
          ansHtml = `<div class="p-3 bg-white rounded border border-light mt-2 text-main text-sm"><strong>Your Answer:</strong><br>${Object.entries(savedAns).map(([k,v])=>`<strong>${k}:</strong> ${esc(v)}`).join('<br>')}</div>`;
        } else {
          ansHtml = `<div class="p-3 bg-white rounded border border-light mt-2 text-main text-sm"><strong>Your Answer:</strong> ${esc(savedAns) || '<em>None</em>'}</div>`;
        }

        // Check if student drew anything for this question's parts
        let drawingHtml = '';
        Object.keys(state.drawings).filter(k => k.startsWith(globalIdx)).forEach(k => {
           if (state.drawings[k] !== 'init' && state.drawings[k] !== 'text') {
              drawingHtml += `<div class="mt-2"><span class="text-xs font-bold text-muted uppercase">Working Drawing:</span><br><img src="${state.drawings[k]}" class="mt-1 border border-light rounded bg-white shadow-sm" style="max-height:150px;"></div>`;
           }
        });

        return `
          <div class="card p-6 mb-4 ${bgClass} ${ruleClass}">
            <div class="flex justify-between items-center mb-2">
              <span class="font-bold text-lg text-main">${secLabel} Q${i + 1}</span>
              <span class="badge ${r.isCorrect ? 'badge-success' : 'badge-danger'} font-bold">${icon} ${r.score} / ${r.maxScore}</span>
            </div>
            <div class="text-main font-medium leading-relaxed mb-3">${esc(q.question_text || 'See passage/diagram')}</div>
            ${ansHtml}
            ${drawingHtml}
            ${r.text ? `<div class="mt-4 p-4 text-sm bg-elevated border border-light rounded-xl"><strong class="text-brand-sage">Miss Wena's Feedback:</strong><br>${r.text}</div>` : ''}
            ${r.workedSolution ? `<div class="mt-3 p-4 text-sm bg-white border border-light rounded-xl"><strong>Worked Solution:</strong><br>${window.formatWorkedSolution(r.workedSolution)}</div>` : ''}
          </div>
        `;
    }).join('');

    const pct = Math.round((earned / possible) * 100);
    let gradeStr = 'Needs Practice', gradeCol = 'var(--brand-error)';
    if (pct >= 90) { gradeStr = 'AL1'; gradeCol = 'var(--brand-mint)'; }
    else if (pct >= 85) { gradeStr = 'AL2'; gradeCol = 'var(--brand-mint)'; }
    else if (pct >= 80) { gradeStr = 'AL3'; gradeCol = 'var(--brand-sage)'; }
    else if (pct >= 75) { gradeStr = 'AL4'; gradeCol = 'var(--brand-sage)'; }
    else if (pct >= 65) { gradeStr = 'AL5'; gradeCol = 'var(--brand-amber)'; }
    else if (pct >= 45) { gradeStr = 'AL6'; gradeCol = 'var(--brand-amber)'; }
    else if (pct >= 20) { gradeStr = 'AL7'; gradeCol = 'var(--brand-error)'; }
    else { gradeStr = 'AL8'; }

    app.innerHTML = `
      <div class="w-full">
        <div class="text-center mb-10 mt-6">
          <h1 class="font-display text-4xl text-main mb-4">Paper Complete</h1>
          <div class="card p-8 bg-elevated shadow-sm inline-flex flex-col items-center justify-center min-w-[280px]" style="border-top: 6px solid ${gradeCol};">
            <div class="text-6xl font-display mb-2" style="color: ${gradeCol};">${earned} <span class="text-3xl text-muted">/ ${possible}</span></div>
            <div class="font-bold text-xl uppercase tracking-wider" style="color: ${gradeCol};">Grade: ${gradeStr} (${pct}%)</div>
          </div>
        </div>
        
        <h3 class="font-display text-2xl text-main mb-6 border-b border-light pb-2">Question Breakdown</h3>
        ${items}
        
        <div class="flex justify-center flex-wrap gap-4 mt-10">
          <button class="btn btn-primary px-8 py-3 text-lg hover-lift" onclick="location.reload()">Take Another Paper</button>
          <button class="btn btn-secondary px-8 py-3 text-lg hover-lift" onclick="window.location.href='dashboard.html'">Mission Control</button>
        </div>
      </div>
    `;
  }

  // ── 5. SUPABASE PERSISTENCE ──
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
        subject: state.subjectKey === 'mathematics' ? 'Mathematics' : state.subjectKey, 
        level: state.level,
        exam_type: state.examType || 'PRACTICE', 
        score: earned, 
        total_marks: possible,
        questions_attempted: Object.keys(state.results).length, 
        time_taken: timeTaken >= 0 ? timeTaken : null,
        completed_at: new Date().toISOString() 
      }).select('id').single();

      if (examError) throw examError;

      // 2. 🚀 DEEP TECH ENGINE: Log individual question attempts
      const qAttempts = state.allQs.map((q) => {
        const globalIdx = q.globalIdx;
        const result = state.results[globalIdx];
        const ans = state.answers[globalIdx];
        
        return {
           exam_result_id: examData?.id || null,
           student_id:     state.studentId,
           question_text:  (q.question_text || '').slice(0, 500),
           topic:          q.topic || 'mixed',
           sub_topic:      q.sub_topic || null,
           cognitive_skill: q.cognitive_skill || null,
           difficulty:     q.difficulty || 'standard',
           correct:        result ? result.isCorrect : false,
           answer_chosen:  String(ans || '').slice(0, 200),
           correct_answer: String(q.correct_answer || ''),
        };
      });

      if (qAttempts.length > 0) {
        await sb.from('question_attempts').insert(qAttempts);
      }
      
    } catch (e) {
      console.error('Failed to save exam result to Supabase:', e);
    }
  }

  setTimeout(() => render(), 100);
};