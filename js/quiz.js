/**
 * quiz.js - Superholic Lab V3 (Master Build)
 * Features: Taxonomy Router, Pen Tool, Progressive Hints, Auto-Container, Supabase Telemetry
 */

window.initQuizEngine = async function() {
  'use strict';

  // ==========================================
  // 1. GLOBAL ENGINES & UTILITIES
  // ==========================================

  // 🚀 The Vanilla JS Pen Tool Engine
  window.togglePenTool = function(canvasId) {
    const container = document.getElementById(canvasId + '-container');
    if (!container) return console.error('Canvas container not found:', canvasId + '-container');
    
    container.classList.toggle('hidden');
    
    const canvas = document.getElementById(canvasId);
    if (!canvas || canvas.isInitialized) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width || 800;
    canvas.height = rect.height || 300;
    
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000'; 
    
    let isDrawing = false, lastX = 0, lastY = 0;

    function getPos(e) {
      const r = canvas.getBoundingClientRect();
      if(e.touches) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function start(e) { e.preventDefault(); isDrawing = true; const p = getPos(e); lastX = p.x; lastY = p.y; }
    function draw(e) { if (!isDrawing) return; e.preventDefault(); const p = getPos(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y); ctx.stroke(); lastX = p.x; lastY = p.y; }
    function stop() { isDrawing = false; }

    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stop); 
    canvas.addEventListener('touchstart', start, {passive: false});
    canvas.addEventListener('touchmove', draw, {passive: false});
    window.addEventListener('touchend', stop);
    
    canvas.isInitialized = true;
  };

  // 🚀 Smart Worked Solution & Rubric Parser
  window.formatWorkedSolution = function(raw) {
    if (!raw) return '<em>No step-by-step solution provided.</em>';
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (typeof parsed === 'object' && parsed !== null) {
        let html = '';
        for (const [key, val] of Object.entries(parsed)) {
           html += `
            <div class="mb-4">
              <h5 class="font-bold text-brand-dark mb-2">${esc(key)}</h5>
              <div class="text-main leading-relaxed" style="word-wrap: break-word;">${val}</div>
            </div>`;
        }
        return html;
      }
    } catch(e) {}
    return esc(raw).replace(/\n/g, '<br>');
  };

  // Escaping to prevent XSS
  function esc(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ==========================================
  // 2. STATE MANAGEMENT & AUTO-CONTAINER
  // ==========================================

  // 🚀 ANTI-CRASH: Auto-detect or build the container if the HTML is missing it
  let app = document.getElementById('quiz-app') || document.getElementById('app');
  if (!app) {
    console.warn("[QuizEngine] #quiz-app missing. Auto-generating container.");
    app = document.createElement('div');
    app.id = 'quiz-app';
    app.className = 'w-full max-w-4xl mx-auto px-4 py-8';
    document.body.appendChild(app);
  }

  const state = {
    phase: 'LOAD', // LOAD, QUIZ, RESULT
    questions: [],
    currentIndex: 0,
    hintIndex: 0, // 🚀 Tracks how many hints have been revealed
    score: 0,
    isAnswered: false,
    studentId: localStorage.getItem('sh_student_id') || null,
    totalMarks: 0,
    earnedMarks: 0
  };

  const params = new URLSearchParams(window.location.search);
  const subject = params.get('subject') || '';
  const levelSlug = params.get('level') || '';
  const topicSlug = params.get('topic') || 'all';

  async function loadQuestions() {
    renderLoading();
    try {
      const db = await window.getSupabase();
      
      // 🚀 THE TAXONOMY ROUTER: Safely map URLs to Database Strings
      let dbSubject = subject;
      if (subject === 'mathematics') dbSubject = 'Mathematics';
      if (subject === 'science') dbSubject = 'Science';
      if (subject === 'english') dbSubject = 'English Language';

      let dbLevel = levelSlug ? levelSlug.replace('primary-', 'Primary ') : null;

      // Un-slugify MOE Topics
      const MOE_TOPICS = [
        'Whole Numbers', 'Addition and Subtraction', 'Multiplication and Division', 'Money', 'Length and Mass', 'Shapes and Patterns', 'Picture Graphs',
        'Multiplication Tables', 'Fractions', 'Time', 'Length, Mass and Volume', 'Shapes',
        'Diversity', 'Systems', 'Interactions', 'Angles', 'Area and Perimeter', 'Bar Graphs',
        'Grammar', 'Vocabulary', 'Comprehension', 'Cloze', 'Editing',
        'Cycles', 'Energy', 'Heat', 'Light', 'Magnets', 'Matter', 'Factors and Multiples', 'Decimals', 'Symmetry', 'Data Analysis',
        'Percentage', 'Ratio', 'Rate', 'Area of Triangle', 'Volume', 'Angles and Geometry', 'Average', 'Synthesis',
        'Cells', 'Forces', 'Speed', 'Algebra', 'Circles', 'Geometry', 'Pie Charts'
      ];
      
      let dbTopic = null;
      if (topicSlug && topicSlug !== 'all' && topicSlug !== 'mixed') {
         const decoded = decodeURIComponent(topicSlug);
         const matched = MOE_TOPICS.find(t => t.toLowerCase().replace(/ /g, '-').replace(/,/g, '') === decoded);
         dbTopic = matched || decoded;
      }

      // Transparent Fetch
      let query = db.from('question_bank').select('*').eq('subject', dbSubject);
      if (dbLevel) query = query.eq('level', dbLevel);
      if (dbTopic) query = query.eq('topic', dbTopic);

      let { data: fetched, error } = await query.limit(50);
      
      if (error) throw error;
      
      if (!fetched || fetched.length === 0) {
        state.questions = [];
        state.phase = 'QUIZ'; 
        render();
        return;
      }

      // Shuffle
      fetched.sort(() => 0.5 - Math.random());
      
      // Calculate Total Marks
      state.totalMarks = fetched.reduce((sum, q) => sum + (q.marks || 1), 0);
      state.questions = fetched;
      state.phase = 'QUIZ';
      render();

    } catch (err) {
      console.error(err);
      app.innerHTML = `<div class="p-6 bg-red-50 text-red-800 rounded">Failed to load questions. Please refresh.</div>`;
    }
  }

  // ==========================================
  // 3. UI RENDERING LOGIC
  // ==========================================

  function render() {
    switch(state.phase) {
      case 'LOAD': renderLoading(); break;
      case 'QUIZ': renderQuiz(); break;
      case 'RESULT': renderResult(); break;
    }
  }

  function renderLoading() {
    app.innerHTML = `<div class="card flex flex-col items-center p-8"><div class="spinner-sm mb-4"></div><h2 class="text-xl">Building Quiz...</h2></div>`;
  }

  // 🚀 PROGRESSIVE HINT REVEALER
  window.showNextHint = function() {
    const q = state.questions[state.currentIndex];
    let hintsArray = [];
    try { hintsArray = typeof q.progressive_hints === 'string' ? JSON.parse(q.progressive_hints) : (q.progressive_hints || []); } catch(e) {}
    
    if (state.hintIndex < hintsArray.length) {
      const container = document.getElementById('hints-container');
      container.innerHTML += `
        <div class="mt-3 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r text-blue-900 animate-fade-in">
          <strong class="uppercase text-xs tracking-wider opacity-75 block mb-1">Hint ${state.hintIndex + 1}</strong>
          ${esc(hintsArray[state.hintIndex])}
        </div>
      `;
      state.hintIndex++;
      
      // Hide button if no more hints
      if (state.hintIndex >= hintsArray.length) {
        document.getElementById('btn-hint').style.display = 'none';
      }
    }
  };

  function renderQuiz() {
    if (state.questions.length === 0) {
      app.innerHTML = `
        <div class="card text-center p-12">
          <h2 class="text-3xl font-display text-main mb-4">No Questions Found!</h2>
          <p class="text-muted">Miss Wena hasn't added questions for this specific combination yet.</p>
          <button class="btn btn-primary mt-6" onclick="window.history.back()">Go Back</button>
        </div>`;
      return;
    }

    const q = state.questions[state.currentIndex];
    const qNum = state.currentIndex + 1;
    const totalQ = state.questions.length;
    const progressPct = ((qNum - 1) / totalQ) * 100;

    // Check for available hints
    let hintsArray = [];
    try { hintsArray = typeof q.progressive_hints === 'string' ? JSON.parse(q.progressive_hints) : (q.progressive_hints || []); } catch(e) {}
    const hasHints = hintsArray.length > 0;

    let visualHtml = '';
    if (q.visual_payload && typeof DiagramLibrary !== 'undefined') {
       try { visualHtml = DiagramLibrary.render(q.visual_payload); } catch(e) { console.error("Diagram error", e); }
    } else if (q.image_url) {
       visualHtml = `<img src="${esc(q.image_url)}" class="max-w-full rounded mb-4" alt="Question Image"/>`;
    }

    let inputUiHtml = '';
    if (q.type === 'mcq') inputUiHtml = buildMCQUI(q);
    else if (q.type === 'short_ans') inputUiHtml = buildShortAnsUI(q);
    else if (q.type === 'cloze') inputUiHtml = buildClozeUI(q);
    else if (q.type === 'editing') inputUiHtml = buildEditingUI(q);
    else inputUiHtml = buildWordProblemUI(q); 

    app.innerHTML = `
      <div class="w-full bg-light rounded-full h-2 mb-6">
        <div class="bg-brand-sage h-2 rounded-full transition-all duration-300" style="width: ${progressPct}%"></div>
      </div>
      
      <div class="card p-6 md:p-8">
        <div class="flex justify-between items-center mb-6">
          <span class="badge badge-primary">Question ${qNum} of ${totalQ}</span>
          <span class="text-sm font-bold text-muted">${q.marks || 1} Mark${q.marks > 1 ? 's' : ''}</span>
        </div>
        
        <h3 class="text-xl md:text-2xl font-medium text-main leading-relaxed mb-6">${esc(q.question_text)}</h3>
        
        ${visualHtml ? `<div class="mb-6 flex justify-center w-full">${visualHtml}</div>` : ''}
        
        <div class="input-container w-full">${inputUiHtml}</div>

        <div id="hints-container" class="w-full mt-2"></div>

        <div id="feedback-container" class="w-full transition-all duration-300"></div>

        <div class="mt-8 pt-6 border-t border-light flex justify-between items-center">
          <div>
            ${hasHints ? `<button id="btn-hint" class="btn btn-outline text-brand-dark" onclick="window.showNextHint()">💡 Need a hint?</button>` : '<div></div>'}
          </div>
          <button id="btn-submit" class="btn btn-primary btn-lg" onclick="window.checkAnswer()">Check Answer</button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // 4. UI BUILDERS (Safety Parsers Enabled)
  // ==========================================

  function buildMCQUI(q) {
    let safeOptions = [];
    try { safeOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []); } catch(e) {}
    
    return `<div class="flex flex-col gap-3">` + safeOptions.map((opt) => `
      <label class="flex items-center p-4 border border-light rounded-lg cursor-pointer hover:bg-page transition-colors has-[:checked]:border-brand-sage has-[:checked]:bg-green-50">
        <input type="radio" name="mcq" value="${esc(opt)}" class="w-5 h-5 text-brand-sage focus:ring-brand-sage border-gray-300">
        <span class="ml-3 text-lg text-main">${esc(opt)}</span>
      </label>
    `).join('') + `</div>`;
  }

  function buildShortAnsUI(q) {
    return `<input type="text" id="short-ans-input" class="form-input w-full p-4 rounded text-lg border border-light" placeholder="Type your answer here..." autocomplete="off">`;
  }

  function buildWordProblemUI(q) {
    let html = `<div class="flex flex-col gap-6 mt-4 w-full">`;
    const parts = q.parts || [{ label: '', question_text: '' }];

    parts.forEach((p, idx) => {
      const partLabel = p.label ? `${esc(p.label)}) ` : '';
      const partText = p.question_text ? esc(p.question_text) : '';
      
      html += `
        <div class="p-5 bg-elevated rounded-lg border border-light w-full">
          ${partText ? `<p class="font-bold text-main mb-4">${partLabel}${partText}</p>` : ''}
          <div class="flex flex-col gap-3 w-full">
            <textarea id="wp-text-${idx}" class="form-input w-full p-4 rounded border border-light" rows="3" placeholder="Type final answer here..."></textarea>
            <div class="mt-2 w-full">
              <button type="button" class="btn btn-outline btn-sm mb-2" onclick="window.togglePenTool('wp-canvas-${idx}')">✏️ Pen Tool</button>
              <div id="wp-canvas-${idx}-container" class="hidden border border-dark rounded bg-white w-full overflow-hidden shadow-sm" style="min-height: 250px;">
                <canvas id="wp-canvas-${idx}" width="800" height="300" class="w-full h-full bg-white cursor-crosshair" style="touch-action: none;"></canvas>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    return html + `</div>`;
  }

  function buildClozeUI(q) {
    let safeBlanks = [];
    try { safeBlanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch(e) {}
    
    let html = `<div class="text-lg leading-loose text-main bg-elevated p-6 rounded-lg border border-light">`;
    let passage = q.passage || '';
    
    safeBlanks.forEach((b, idx) => {
      let optsHtml = `<option value="" disabled selected></option>`;
      b.options.forEach(o => optsHtml += `<option value="${esc(o)}">${esc(o)}</option>`);
      const selectHtml = `<select id="cloze-blank-${idx}" class="form-select mx-1 px-2 py-1 bg-white border border-light rounded text-brand-dark font-bold">${optsHtml}</select>`;
      passage = passage.replace(`[${b.number}]`, selectHtml);
    });
    return html + passage + `</div>`;
  }

  function buildEditingUI(q) {
    let safeLines = [];
    try { safeLines = typeof q.passage_lines === 'string' ? JSON.parse(q.passage_lines) : (q.passage_lines || []); } catch(e) {}
    
    let html = `<div class="text-lg leading-loose text-main bg-elevated p-6 rounded border border-light font-mono">`;
    safeLines.forEach((line, idx) => {
      if (line.has_error) {
        html += `<div class="mb-2 flex items-center flex-wrap gap-2">
          <span>${esc(line.text.replace(line.underlined_word, `<u class="text-brand-coral font-bold">${line.underlined_word}</u>`))}</span>
          <input type="text" id="editing-input-${idx}" class="form-input w-32 px-2 py-1 text-sm rounded border border-light" placeholder="Correction">
        </div>`;
      } else {
        html += `<div class="mb-2">${esc(line.text)}</div>`;
      }
    });
    return html + `</div>`;
  }

  // ==========================================
  // 5. ANSWER CHECKING & SUPABASE UPLOAD
  // ==========================================

  window.checkAnswer = async function() {
    if (state.isAnswered) return; 
    
    const q = state.questions[state.currentIndex];
    let isCorrect = false;

    if (q.type === 'mcq') {
      const selected = document.querySelector('input[name="mcq"]:checked');
      if (!selected) return alert('Please select an option.');
      isCorrect = selected.value === q.correct_answer;
      selected.parentElement.classList.add(isCorrect ? 'border-brand-sage' : 'border-brand-coral');

    } else if (q.type === 'short_ans') {
      const input = document.getElementById('short-ans-input');
      if (!input.value.trim()) return alert('Please enter an answer.');
      let safeAccept = [];
      try { safeAccept = typeof q.accept_also === 'string' ? JSON.parse(q.accept_also) : (q.accept_also || []); } catch(e) {}
      
      isCorrect = input.value.trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase() ||
                  safeAccept.some(ans => String(ans).trim().toLowerCase() === input.value.trim().toLowerCase());
      
      input.className = `form-input w-full p-4 rounded text-lg font-bold border-2 ${isCorrect ? 'border-brand-sage bg-green-50 text-green-800' : 'border-brand-coral bg-red-50 text-red-800'}`;
      input.disabled = true;

    } else if (q.type === 'cloze') {
      let safeBlanks = [];
      try { safeBlanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch(e) {}
      let allFilled = true;
      safeBlanks.forEach((b, i) => { if (!document.getElementById(`cloze-blank-${i}`).value) allFilled = false; });
      if (!allFilled) return alert('Please fill in all blanks.');

      isCorrect = true;
      safeBlanks.forEach((b, i) => {
        const sel = document.getElementById(`cloze-blank-${i}`);
        if (sel.value === b.correct_answer) { sel.classList.add('border-brand-sage', 'bg-green-50'); } 
        else { sel.classList.add('border-brand-coral', 'bg-red-50'); isCorrect = false; }
        sel.disabled = true;
      });

    } else if (q.type === 'editing') {
      let safeLines = [];
      try { safeLines = typeof q.passage_lines === 'string' ? JSON.parse(q.passage_lines) : (q.passage_lines || []); } catch(e) {}
      isCorrect = true;
      safeLines.forEach((line, i) => {
        if (line.has_error) {
          const inp = document.getElementById(`editing-input-${i}`);
          if (inp.value.trim().toLowerCase() === String(line.correct_word).trim().toLowerCase()) { inp.classList.add('border-brand-sage', 'bg-green-50'); } 
          else { inp.classList.add('border-brand-coral', 'bg-red-50'); isCorrect = false; }
          inp.disabled = true;
        }
      });
    } else {
      isCorrect = true; // Open ended automatically proceed
    }

    state.isAnswered = true;
    if (isCorrect) {
       state.score++;
       state.earnedMarks += (q.marks || 1);
    }

    // 🚀 SUPABASE TELEMETRY: Save the attempt in the background
    if (state.studentId) {
      try {
        const db = await window.getSupabase();
        db.from('question_attempts').insert({
          student_id: state.studentId,
          question_id: q.id,
          is_correct: isCorrect,
          topic: q.topic,
          subject: q.subject,
          level: q.level
        }).then(({error}) => { if(error) console.error("Telemetry error:", error); });
      } catch (err) { console.warn("Failed to log attempt", err); }
    }

    // Render Feedback
    const displayMarks = q.marks || 1;
    document.getElementById('feedback-container').innerHTML = `
      <div class="mt-8 p-6 rounded-xl bg-page border border-light shadow-sm w-full" style="box-sizing: border-box;">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-xl font-bold text-main m-0">Worked Solution</h4>
          <span class="badge badge-info">${displayMarks} Mark${displayMarks > 1 ? 's' : ''}</span>
        </div>
        <div class="text-main leading-relaxed text-lg">
          ${window.formatWorkedSolution(q.worked_solution)}
        </div>
        ${q.examiner_note ? `
        <div class="mt-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r">
          <strong class="text-amber-800 text-sm uppercase tracking-wider">Examiner's Note:</strong>
          <p class="text-amber-900 mt-2 m-0">${esc(q.examiner_note)}</p>
        </div>` : ''}
      </div>
    `;

    // Hide Hint Button once answered
    const btnHint = document.getElementById('btn-hint');
    if (btnHint) btnHint.style.display = 'none';

    const btn = document.getElementById('btn-submit');
    if (btn) {
      btn.textContent = state.currentIndex === state.questions.length - 1 ? 'Finish Module' : 'Next Question';
      btn.onclick = () => {
        state.isAnswered = false;
        state.hintIndex = 0; // 🚀 Reset hints for next question
        state.currentIndex++;
        if (state.currentIndex >= state.questions.length) {
          state.phase = 'RESULT';
          render();
        } else {
          renderQuiz();
        }
      };
    }
  };

  // ==========================================
  // 6. RESULT SCREEN
  // ==========================================

  function renderResult() {
    const pct = Math.round((state.earnedMarks / state.totalMarks) * 100) || 0;
    
    let msg = "Keep Practising!";
    if (pct >= 85) msg = "Excellent Work!";
    else if (pct >= 70) msg = "Great Job!";

    app.innerHTML = `
      <div class="card text-center p-12 max-w-2xl mx-auto">
        <h2 class="text-4xl font-display text-main mb-2">${msg}</h2>
        <p class="text-xl text-muted mb-8">You completed the module.</p>
        
        <div class="inline-flex justify-center items-center w-32 h-32 rounded-full border-8 ${pct >= 70 ? 'border-brand-sage text-brand-sage' : 'border-amber-400 text-amber-500'} mb-8">
          <span class="text-4xl font-bold">${pct}%</span>
        </div>
        
        <div class="flex justify-center gap-8 mb-8 text-lg">
          <div><span class="font-bold text-main text-2xl block">${state.score} / ${state.questions.length}</span><span class="text-muted text-sm">Correct</span></div>
          <div><span class="font-bold text-main text-2xl block">${state.earnedMarks} / ${state.totalMarks}</span><span class="text-muted text-sm">Marks</span></div>
        </div>

        <div class="flex justify-center gap-4">
          <button class="btn btn-outline" onclick="window.location.reload()">Retry</button>
          <a href="subjects.html" class="btn btn-primary">Choose New Topic</a>
        </div>
      </div>
    `;
  }

  // Kickoff
  loadQuestions();
};