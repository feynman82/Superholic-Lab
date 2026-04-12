window.initQuizEngine = function() {
  'use strict';

  // 🚀 GLOBAL UTILITY 1: The Vanilla JS Pen Tool Engine
window.togglePenTool = function(canvasId) {
  const container = document.getElementById(canvasId + '-container');
  if (!container) return console.error('Canvas container not found:', canvasId + '-container');
  
  container.classList.toggle('hidden');
  
  const canvas = document.getElementById(canvasId);
  if (!canvas || canvas.isInitialized) return;

  // Match internal resolution to actual CSS display size to prevent warped lines
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width || 800;
  canvas.height = rect.height || 300;
  
  const ctx = canvas.getContext('2d');
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000000'; // Black ink
  
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

// 🚀 GLOBAL UTILITY 2: Smart Worked Solution Parser
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
            <div class="text-main leading-relaxed" style="word-wrap: break-word;">
              ${val}
            </div>
          </div>`;
      }
      return html;
    }
  } catch(e) {}
  return esc(raw).replace(/\n/g, '<br>');
};

  const state = {
    phase: 'LOAD',
    questions: [],
    currentIndex: 0,
    streak: 0,
    maxStreak: 0,
    score: 0,
    totalPossibleScore: 0, // NEW: Tracks max possible marks
    answers: {},       
    drawings: {},      
    isAnswered: false, 
    feedback: null,
    currentType: null,
    quizStartTime: null,
    hintLevel: 0 //
  };

  const app = document.getElementById('app');
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function titleCase(s) { return s.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase()); }

  function render() {
    switch(state.phase) {
      case 'LOAD': renderLoading(); break;
      case 'QUIZ': renderQuiz(); break;
      case 'DONE': renderResults(); break;
    }
  }

  function renderLoading() {
    app.innerHTML = `<div class="card flex flex-col items-center w-full p-6" style="max-width: 600px;"><div class="spinner-sm mb-4"></div><h2 class="font-display text-2xl text-main">Preparing Training Lab...</h2><p class="text-sm text-muted mt-2">Loading MOE-aligned questions</p></div>`;
  }

// ── PROCEDURAL DIAGRAM RENDERER (WITH ERROR SHIELD) ──
  function renderVisualPayload(visual_payload) {
    if (!visual_payload) return '';

    if (visual_payload.engine === 'diagram-library') {
      try {
        const fnName = visual_payload.function_name;
        const params = visual_payload.params || {};

        // Check if the function actually exists in your library
        if (typeof DiagramLibrary[fnName] === 'function') {
          return `<div class="procedural-diagram mb-4 flex justify-center">
                    ${DiagramLibrary[fnName](params)}
                  </div>`;
        } else {
          // The AI invented a function you haven't built yet! Graceful fallback.
          console.warn(`[DiagramLibrary] Missing function requested by AI: ${fnName}`, params);
          return `<div class="procedural-diagram mb-4 flex justify-center">
                    ${DiagramLibrary.placeholder({ 
                      description: `Requires DiagramLibrary.${fnName}()\nParams: ${JSON.stringify(params).substring(0,40)}...` 
                    })}
                  </div>`;
        }
      } catch (err) {
        console.error("[DiagramLibrary] Rendering crashed:", err);
        return `<div class="procedural-diagram mb-4 flex justify-center">
                  ${DiagramLibrary.placeholder({ description: "Diagram Rendering Error" })}
                </div>`;
      }
    }
    
    // Future handling for mermaid engine
    if (visual_payload.engine === 'mermaid') {
       return `<div class="mermaid-diagram mb-4 p-4 bg-page border border-light rounded">${esc(visual_payload.params.code || '')}</div>`;
    }

    return '';
  }

  // ── BUILD INPUT UI BY TYPE ──

  function buildMCQOptions(q) {
    const letters = ['A','B','C','D'];
    const savedAns = state.answers[state.currentIndex] || '';
    return (q.options || []).map((opt, i) => {
      const letter = letters[i];
      const isSel = savedAns === letter;
      let extraStyle = '';
      if (state.isAnswered) {
        if (letter === q.correct_answer) extraStyle = 'border-color:var(--brand-mint);background:rgba(5,150,105,0.1);';
        else if (isSel)                  extraStyle = 'border-color:var(--brand-error);background:rgba(220,38,38,0.1);opacity:0.8;';
        else                             extraStyle = 'opacity:0.45;pointer-events:none;';
      }
      return `<div class="mcq-opt${isSel?' is-sel':''}" style="${extraStyle}${state.isAnswered?'pointer-events:none;':''}" onclick="window.selectMcq('${letter}')">
        <span class="mcq-badge">${letter}</span><span class="font-medium text-main">${esc(opt)}</span>
      </div>`;
    }).join('');
  }

  function buildTextAreaUI(q) {
    const savedAns = String(state.answers[state.currentIndex] || '');
    const isDrawMode = state.drawings[state.currentIndex] && state.drawings[state.currentIndex] !== 'text';
    return `
      <div class="flex justify-end gap-2 mb-2">
        <button class="btn btn-sm ${!isDrawMode?'btn-secondary bg-sage-dark text-white':'btn-ghost'}" onclick="window.setMode('text')" ${state.isAnswered?'disabled':''}>⌨️ Type</button>
        <button class="btn btn-sm ${isDrawMode?'btn-secondary bg-sage-dark text-white':'btn-ghost'}" onclick="window.setMode('draw')" ${state.isAnswered?'disabled':''}>✏️ Pen Tool</button>
      </div>
      ${!isDrawMode
        ? `<textarea id="qInput" class="form-input w-full p-4" rows="4" placeholder="Your answer..." style="height: auto; resize: vertical;" ${state.isAnswered?'disabled':''}>${esc(savedAns)}</textarea>`
        : `<div class="scratchpad-container">
             <canvas id="scratchpadCanvas" class="scratchpad-canvas" ${state.isAnswered?'style="pointer-events:none;"':''}></canvas>
             ${!state.isAnswered?`<div class="scratchpad-tools"><button class="btn btn-sm btn-ghost bg-surface hover-lift border border-light" onclick="window.clearCanvas()">🗑️ Clear</button></div>`:''}
           </div>
           <input type="text" id="qInput" class="form-input mt-4" placeholder="Final Answer" value="${esc(savedAns)}" ${state.isAnswered?'disabled':''}>`
      }`;
  }

  function buildWordProblemUI(q) {
    let html = `<div class="flex flex-col gap-6 mt-4 w-full">`;
    const parts = q.parts || [{ label: '', question_text: 'Solve the problem above.' }];

    parts.forEach((p, idx) => {
      const partLabel = p.label ? `${esc(p.label)}) ` : '';
      const partText = p.question_text ? esc(p.question_text) : '';
      
      html += `
        <div class="word-problem-part p-5 bg-elevated rounded-lg border border-light w-full">
          ${partText ? `<p class="font-bold text-main mb-4">${partLabel}${partText}</p>` : ''}
          
          <div class="flex flex-col gap-3 w-full">
            <label class="text-sm font-bold text-muted uppercase tracking-wider">Show your working & final answer:</label>
            <textarea id="wp-text-${idx}" class="form-input w-full p-4 rounded border border-light" rows="4" placeholder="Type your step-by-step working and final answer here..."></textarea>
            
            <div class="mt-2 w-full">
              <button type="button" class="btn btn-outline btn-sm mb-2" onclick="window.togglePenTool('wp-canvas-${idx}')">
                ✏️ Pen Tool
              </button>
              
              <div id="wp-canvas-${idx}-container" class="hidden border border-dark rounded bg-white w-full overflow-hidden shadow-sm" style="min-height: 250px;">
                <canvas id="wp-canvas-${idx}" width="800" height="300" class="w-full h-full bg-white cursor-crosshair" style="touch-action: none;"></canvas>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    return html;
  }

function buildClozeUI(q) {
    const savedAns = state.answers[state.currentIndex] || {};
    const blanks = q.blanks || [];

    const allWords = new Set();
    blanks.forEach(b => (b.options || []).forEach(w => allWords.add(w)));
    
    // 3.0 UPGRADE: Smart Word Bank (Hides if empty)
    let wordBankHtml = '';
    if (allWords.size > 0) {
      const wordBankList = [...allWords].sort().map((w, i) =>
        `<span class="badge badge-info" style="font-size:0.8rem; padding: 4px 10px;">(${i+1}) ${esc(w)}</span>`
      ).join('');
      wordBankHtml = `
        <div class="card bg-page p-4 mb-4">
          <div class="text-xs font-bold text-muted uppercase mb-3">Word Bank</div>
          <div class="flex flex-wrap gap-2">${wordBankList}</div>
        </div>`;
    }

    // 3.0 UPGRADE: Line breaks support
    let passage = esc(q.passage || '').replace(/\n/g, '<br>');
    
    blanks.forEach(b => {
      const num = b.id || b.number;
      const saved = savedAns[num] || '';
      let inputHtml = '';
      
      if (state.isAnswered) {
        const isCorrect = (savedAns[num] || '').toLowerCase() === (b.correct_answer || '').toLowerCase();
        const stateClass = isCorrect ? 'is-correct' : 'is-wrong';
        
        // 3.0 UPGRADE: Smart Disabled Inputs
        if (b.options && b.options.length > 0) {
          inputHtml = `<select id="cloze-blank-${num}" class="cloze-select ${stateClass}" disabled>
            <option value="${esc(saved)}">${esc(saved||'—')}</option></select>`;
        } else {
          inputHtml = `<input type="text" id="cloze-blank-${num}" class="editing-input ${stateClass}" value="${esc(saved)}" disabled style="width: 120px; display: inline-block; margin: 0 4px;">`;
        }
      } else {
        // 3.0 UPGRADE: Smart Active Inputs (Dropdown vs Text Box)
        if (b.options && b.options.length > 0) {
          const opts = (b.options || []).map(o =>
            `<option value="${esc(o)}" ${saved === o ? 'selected' : ''}>${esc(o)}</option>`
          ).join('');
          inputHtml = `<select id="cloze-blank-${num}" class="cloze-select" onchange="window.saveInputState()">
            <option value="">— pick —</option>${opts}</select>`;
        } else {
          inputHtml = `<input type="text" id="cloze-blank-${num}" class="editing-input" value="${esc(saved)}" placeholder="type here" autocomplete="off" oninput="window.saveInputState()" style="width: 120px; display: inline-block; margin: 0 4px;">`;
        }
      }
      passage = passage.replace(`[${num}]`, inputHtml);
    });

    let blankFeedback = '';
    if (state.isAnswered && state.feedback && state.feedback.blankResults) {
      const rows = blanks.map(b => {
        const num = b.id || b.number;
        const res = state.feedback.blankResults[num] || {};
        const icon = res.isCorrect ? '✅' : '❌';
        return `<div class="flex gap-3 items-start text-sm py-2" style="border-bottom: 1px solid var(--border-light);">
          <span class="font-bold" style="min-width:24px;">[${num}]</span>
          <span>${icon} <strong style="color:var(--text-main);">${esc(res.selected||'—')}</strong> ${!res.isCorrect?`→ <strong class="text-success">${esc(b.correct_answer)}</strong>`:''}</span>
          ${!res.isCorrect && b.explanation ? `<span class="text-muted text-xs ml-auto" style="max-width:60%; text-align:right;">${esc(b.explanation)}</span>` : ''}
        </div>`;
      }).join('');
      blankFeedback = `<div class="card bg-page p-4 mt-4">${rows}</div>`;
    }

    // 3.0 UPGRADE: Typography & Line Height
    return `
      ${wordBankHtml}
      <div class="card p-6 cloze-passage text-lg text-main font-medium" style="line-height: 2;">${passage}</div>
      ${blankFeedback}`;
  }

  function buildEditingUI(q) {
    const savedAns = state.answers[state.currentIndex] || {};
    const lines = (q.passage_lines || []).map(line => {
      const saved = savedAns[line.line_number] || '';
      const rawText = line.text || '';
      const underlined = line.underlined_word || '';
      
      const escapedLine = esc(rawText).replace(
        esc(underlined),
        `<u style="text-decoration-color:var(--brand-rose);text-decoration-thickness:2px;font-weight:700;">${esc(underlined)}</u>`
      );

      let inputEl;
      if (state.isAnswered) {
        const res = (state.feedback && state.feedback.lineResults && state.feedback.lineResults[line.line_number]) || {};
        const isCorrect = res.isCorrect;
        const stateClass = isCorrect ? 'is-correct' : 'is-wrong';
        inputEl = `<input type="text" value="${esc(saved)}" disabled class="editing-input ${stateClass}">
          ${!isCorrect && line.correct_word ? `<span class="text-xs font-bold text-success" style="position:absolute; bottom:-18px; left:0; right:0;">→ ${esc(line.correct_word)}</span>` : ''}`;
      } else {
        inputEl = `<input type="text" id="edit-line-${line.line_number}" value="${esc(saved)}"
          placeholder="${esc(underlined)}" autocomplete="off" class="editing-input"
          oninput="window.saveInputState()">`;
      }

      // 3.0 UPGRADE: Larger typography, min-widths, and padding
      return `
        <div class="editing-line" style="padding: var(--space-4) 0;">
          <span class="text-base font-bold text-muted" style="min-width:32px;">${line.line_number}.</span>
          <span class="text-lg text-main font-medium flex-1" style="line-height: 1.8;">${escapedLine}</span>
          <div class="flex items-center gap-2" style="position:relative;">${inputEl}</div>
        </div>`;
    }).join('');

    let editFeedback = '';
    if (state.isAnswered && state.feedback && state.feedback.lineResults) {
      const wrongLines = (q.passage_lines || []).filter(l => {
        const res = state.feedback.lineResults[l.line_number];
        return res && !res.isCorrect;
      });
      if (wrongLines.length > 0) {
        editFeedback = `<div class="card bg-page p-4 mt-4">
          <div class="text-xs font-bold text-muted uppercase mb-2">Explanations</div>
          ${wrongLines.map(l => `<div class="text-sm text-main py-2" style="border-bottom: 1px solid var(--border-light);">
            <span class="font-bold">[${l.line_number}] ${esc(l.underlined_word)} → <span class="text-success">${esc(l.correct_word)}</span>:</span> ${esc(l.explanation)}
          </div>`).join('')}
        </div>`;
      }
    }

    return `
      <div class="card p-6">${lines}</div>
      ${editFeedback}`;
  }

// 🚀 NEW: Hint Renderer
  function buildHintsUI(q) {
    if (!q.progressive_hints || !Array.isArray(q.progressive_hints) || q.progressive_hints.length === 0) return '';

    let hintsHtml = '';
    
    // Show revealed hints
    if (state.hintLevel > 0) {
      const revealedHints = q.progressive_hints.slice(0, state.hintLevel);
      hintsHtml += `<div class="mt-4 flex flex-col gap-3">`;
      revealedHints.forEach((hint, index) => {
        hintsHtml += `
          <div class="card bg-amber-tint p-4 text-sm text-main font-medium border-l-4" style="border-left-color: var(--brand-amber); box-shadow: none;">
            <div class="text-amber font-bold mb-1 flex items-center gap-2">
              <span>💡</span> Miss Wena's Hint ${index + 1}
            </div>
            <div class="leading-relaxed whitespace-pre-wrap">${esc(hint)}</div>
          </div>`;
      });
      hintsHtml += `</div>`;
    }

    // Show hint button if hints remain and question is unanswered
    if (!state.isAnswered && state.hintLevel < q.progressive_hints.length) {
      const btnText = state.hintLevel === 0 ? '💡 Need a hint?' : '💡 Show next hint';
      hintsHtml += `
        <div class="mt-4">
          <button class="btn btn-sm" style="background: var(--bg-surface); border: 1px solid var(--border-light); color: var(--text-muted);" onclick="window.showHint()">
            ${btnText}
          </button>
        </div>`;
    }

    return hintsHtml;
  }

  function renderQuiz() {
    if (state.questions.length === 0) {
      app.innerHTML = `<div class="card text-center w-full hover-lift p-6" style="max-width: 600px;"><div class="text-4xl mb-4">🕵️</div><h2 class="font-display text-2xl text-main">No questions found!</h2><p class="text-muted text-sm my-4">Miss Wena hasn't added questions for this specific combination yet. Check back soon!</p><button class="btn btn-primary hover-lift" onclick="window.location.href='subjects.html'">Return to Subjects</button></div>`;
      return;
    }

    const q = state.questions[state.currentIndex];
    const isFirst = state.currentIndex === 0;
    const isLast = state.currentIndex === state.questions.length - 1;
    const isModelType = q.type === 'word_problem' || q.type === 'open_ended';

    let inputUi = '';
    if (q.type === 'mcq')           inputUi = buildMCQOptions(q);
    else if (q.type === 'word_problem') inputUi = buildWordProblemUI(q);
    else if (q.type === 'cloze')    inputUi = buildClozeUI(q);
    else if (q.type === 'editing')  inputUi = buildEditingUI(q);
    else                            inputUi = buildTextAreaUI(q);   

    // 🚀 HYBRID DIAGRAM RENDERING: 
    // Prioritize the physical cropped image (Seeds), fallback to SVG Engine (Clones)
    let diagramUi = '';
    
    if (q.image_url) {
      diagramUi = `
        <div class="quiz-diagram-container w-full flex justify-center my-6">
          <img src="${esc(q.image_url)}" alt="Question Diagram" class="max-w-full rounded shadow-sm border border-light" style="max-height: 250px; object-fit: contain;">
        </div>
      `;
    } else if (q.visual_payload && typeof DiagramLibrary !== 'undefined') {
      diagramUi = `
        <div class="quiz-diagram-container w-full flex justify-center my-6 p-4 bg-white" style="border-radius: var(--radius-md); border: 1px solid var(--border-light);">
          ${DiagramLibrary.render(q.visual_payload)}
        </div>
      `;
    }

    const hintsUi = buildHintsUI(q); // 👈 ADD THIS LINE

    // (Inside checkAnswer)
    state.isAnswered = true;
    const displayMarks = q.marks ? q.marks : 1;

    // 🚀 FIX: Pass the worked_solution through our smart formatter
    let feedbackHtml = '';
    if (state.isAnswered) {
      feedbackHtml = `
        <div class="mt-8 p-6 rounded-xl bg-page border border-light shadow-sm w-full" style="word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; max-width: 100%; box-sizing: border-box;">
          
          <div class="flex justify-between items-center mb-4">
            <h4 class="text-xl font-bold text-main m-0">Worked Solution</h4>
            <span class="badge badge-info">${displayMarks} Mark${displayMarks > 1 ? 's' : ''}</span>
          </div>

          <div class="text-main leading-relaxed text-lg font-medium">
            ${window.formatWorkedSolution(q.worked_solution)}
          </div>

          ${q.examiner_note ? `
          <div class="mt-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r">
            <strong class="text-amber-800 text-sm uppercase tracking-wider">Examiner's Note:</strong>
            <p class="text-amber-900 mt-2 m-0">${esc(q.examiner_note)}</p>
          </div>
          ` : ''}
        </div>
      `;
    }
    
    document.getElementById('feedback-container').innerHTML = feedbackHtml;

    // 🚀 ANTI-FREEZE SAFETY CHECK
    const btn = document.getElementById('btn-submit');
    if (btn) {
      btn.textContent = 'Next Question';
      btn.onclick = nextQuestion;
    }

    // --- SMART INSTRUCTION OVERRIDE ---
    let displayInstruction = esc(q.question_text);
    if (q.type === 'cloze') {
      displayInstruction = 'Fill in each blank with the correct word from the Word Bank.';
    } else if (q.type === 'editing') {
      displayInstruction = 'Read the passage and correct each underlined spelling or grammatical error.';
    }
        
    app.innerHTML = `
      <div class="w-full" style="max-width: 680px;">
        <div class="flex justify-between items-center mb-6">
          <div class="flex flex-col gap-1">
            <div class="text-xs font-bold text-muted uppercase">Question ${state.currentIndex + 1} of ${state.questions.length}</div>
            <div class="quiz-progress-bar" style="width:120px;height:6px;">
              <div class="quiz-progress-fill" style="width:${((state.currentIndex)/state.questions.length)*100}%;background:var(--brand-rose);"></div>
            </div>
          </div>
          <div class="badge ${state.streak >= 3 ? 'badge-amber' : 'badge-info'}" style="font-size:1rem; padding:6px 12px;">
            <span class="${state.streak > 0 ? 'streak-fire' : ''} mr-1">🔥</span> Streak: ${state.streak}
          </div>
        </div>

        <div class="card p-6 hover-lift w-full relative">
          <div class="badge badge-info absolute top-0 left-8" style="transform:translateY(-50%);">${esc(titleCase(q.topic || 'Mixed'))}</div>
          ${q.difficulty ? `<div class="badge badge-${q.difficulty.toLowerCase()} absolute top-0 right-8" style="transform:translateY(-50%);">${esc(q.difficulty)}</div>` : ''}

          <h3 class="text-xl font-bold text-main mb-6 mt-2 leading-relaxed" style="white-space:pre-line;">${displayInstruction}</h3>

          ${diagramUi} <div class="w-full">${inputUi}</div>

          ${hintsUi} ${feedbackHtml}

          <div class="flex justify-between items-center mt-8 pt-6 border-t border-light">
            <button class="btn btn-ghost" onclick="window.navQuiz(-1)" ${isFirst ? 'style="visibility:hidden;"' : ''}>← Previous</button>
            ${actionBtn}
          </div>
        </div>
      </div>
    `;

    if (document.getElementById('scratchpadCanvas')) {
      initCanvas(state.currentIndex);
    }
  }

  // ── INTERACTIONS ──

  window.showHint = () => {
    if (state.isAnswered) return;
    window.saveInputState(); // Save current input so it doesn't vanish on re-render
    state.hintLevel++;
    render();
  };

  window.selectMcq = (letter) => {
    if (state.isAnswered) return;
    state.answers[state.currentIndex] = letter;
    window.checkAnswer();
  };

  window.setMode = (mode) => {
    if (state.isAnswered) return;
    window.saveInputState();
    state.drawings[state.currentIndex] = mode === 'draw' ? 'init' : 'text';
    render();
  };

  window.saveInputState = () => {
    const q = state.questions[state.currentIndex];
    if (q.type === 'cloze') {
      const ans = {};
      (q.blanks || []).forEach(b => {
        const num = b.id || b.number;
        const el = document.getElementById(`cloze-blank-${num}`);
        if (el) ans[num] = el.value;
      });
      state.answers[state.currentIndex] = ans;
    } else if (q.type === 'editing') {
      const ans = {};
      (q.passage_lines || []).forEach(l => {
        const el = document.getElementById(`edit-line-${l.line_number}`);
        if (el) ans[l.line_number] = el.value;
      });
      state.answers[state.currentIndex] = ans;
    } else if (q.type === 'word_problem') {
      const ans = {};
      (q.parts || []).forEach(p => {
        const el = document.getElementById(`wp-${p.label}`);
        if (el) ans[p.label] = el.value;
      });
      state.answers[state.currentIndex] = ans;
    } else if (q.type !== 'mcq' && q.type !== 'open_ended') {
      const inp = document.getElementById('qInput');
      if (inp) state.answers[state.currentIndex] = inp.value;
    }
    const canvas = document.getElementById('scratchpadCanvas');
    if (canvas) state.drawings[state.currentIndex] = canvas.toDataURL();
  };

  window.navQuiz = (dir) => {
    if (!state.isAnswered && dir > 0) return;

    if (dir < 0) {
      window.saveInputState();
      state.currentIndex--;
      state.isAnswered = true;
      state.feedback = null;
      state.hintLevel = 0;
      render();
      return;
    }

    if (state.currentIndex === state.questions.length - 1) {
      state.phase = 'DONE';
      render();
      return;
    }

    window.saveInputState();
    state.currentIndex++;
    state.isAnswered = !!state.answers[state.currentIndex];
    state.feedback = null;
    state.hintLevel = 0;
    render();
  };

  window.checkAnswer = () => {
    window.saveInputState();
    const q = state.questions[state.currentIndex];

    // ── MCQ ──
    if (q.type === 'mcq') {
      const ans = state.answers[state.currentIndex];
      if (!ans) { alert('Please select an answer!'); return; }
      const isCorrect = ans === q.correct_answer;
      const fbText = isCorrect
        ? (q.worked_solution ? `Correct! ${q.worked_solution.split('\n')[0]}` : 'Perfectly executed!')
        : (q.wrong_explanations?.[ans] || `The correct answer is ${q.correct_answer}.`);
      if (isCorrect) { state.score++; state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak; }
      else state.streak = 0;
      state.isAnswered = true;
      state.feedback = { status: isCorrect ? 'correct' : 'wrong', text: fbText, correctAnswer: isCorrect ? null : q.correct_answer };
      render();
      return;
    }

    // ── CLOZE ──
    if (q.type === 'cloze') {
      const ans = state.answers[state.currentIndex] || {};
      const blanks = q.blanks || [];
      let correctCount = 0;
      const blankResults = {};
      blanks.forEach(b => {
        const num = b.id || b.number;
        const selected = (ans[num] || '').trim();
        const isCorrect = selected.toLowerCase() === (b.correct_answer || '').toLowerCase();
        if (isCorrect) correctCount++;
        blankResults[num] = { selected, isCorrect };
      });
      const allCorrect = correctCount === blanks.length;
      
      // UPGRADE: Award 1 mark for every correct blank!
      state.score += correctCount;
      
      if (allCorrect) { state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak; }
      else state.streak = 0;
      state.isAnswered = true;
      state.feedback = {
        status: allCorrect ? 'correct' : 'partial',
        text: allCorrect ? `All ${blanks.length} blanks correct!` : `${correctCount} of ${blanks.length} blanks correct. Review the highlighted answers below.`,
        blankResults
      };
      render();
      return;
    }

    // ── EDITING ──
    if (q.type === 'editing') {
      const ans = state.answers[state.currentIndex] || {};
      const lines = q.passage_lines || [];
      let correctCount = 0;
      const lineResults = {};
      lines.forEach(l => {
        const userAns = (ans[l.line_number] || '').trim();
        const isCorrect = userAns.toLowerCase() === (l.correct_word || '').toLowerCase();
        if (isCorrect) correctCount++;
        lineResults[l.line_number] = { userAns, isCorrect };
      });
      const allCorrect = correctCount === lines.length;
      
      // UPGRADE: Award 1 mark for every correct line edit!
      state.score += correctCount;
      
      if (allCorrect) { state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak; }
      else state.streak = 0;
      state.isAnswered = true;
      state.feedback = {
        status: allCorrect ? 'correct' : 'partial',
        text: allCorrect ? `All ${lines.length} corrections right!` : `${correctCount} of ${lines.length} corrections correct.`,
        lineResults
      };
      render();
      return;
    }

    // ── WORD PROBLEM / OPEN-ENDED: reveal model answer ──
    if (q.type === 'word_problem' || q.type === 'open_ended') {
      state.isAnswered = true;
      state.feedback = { status: 'model', text: '', isModel: true };
      render();
      return;
    }

    // ── SHORT ANSWER ──
    const ans = String(state.answers[state.currentIndex] || '').trim();
    const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
    const correct = norm(ans) === norm(q.correct_answer) ||
      (q.accept_also || []).some(a => norm(ans) === norm(a));
    const fbText = correct ? 'Excellent!' : `Expected: ${q.correct_answer}. ${q.worked_solution ? '\n' + q.worked_solution : ''}`;
    if (correct) { state.score++; state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak; }
    else state.streak = 0;
    state.isAnswered = true;
    state.feedback = { status: correct ? 'correct' : 'wrong', text: fbText };
    render();
  };

  function renderResults() {
    saveQuizResult(); 
    
    // UPGRADE: Use total possible marks for percentage
    const maxScore = state.totalPossibleScore > 0 ? state.totalPossibleScore : 1;
    const pct = Math.round((state.score / maxScore) * 100);
    
    app.innerHTML = `
      <div class="card flex flex-col items-center text-center w-full hover-lift p-6 card-rule-mint" style="max-width: 600px;">
        <h1 class="font-display text-4xl text-main mb-2">Training Complete!</h1>
        <p class="text-muted text-lg mb-6">You've successfully completed the lab session.</p>
        
        <div class="flex flex-wrap gap-6 mb-6 w-full justify-center">
          <div class="card p-6 flex-1 bg-page" style="border: none; max-width: 200px;">
            <div class="text-sm font-bold text-muted uppercase">Score</div>
            <div class="font-display text-5xl text-success mt-2">${pct}%</div>
            <div class="text-sm text-main mt-1">${state.score} / ${maxScore} Marks</div>
          </div>
          <div class="card p-6 flex-1 bg-amber-tint" style="border: none; max-width: 200px;">
            <div class="text-sm font-bold text-amber uppercase">Best Streak</div>
            <div class="font-display text-5xl text-amber mt-2">🔥 ${state.maxStreak}</div>
            <div class="text-sm text-amber mt-1">In a row!</div>
          </div>
        </div>

        <div class="flex flex-wrap gap-4 justify-center">
          <button class="btn btn-primary hover-lift" onclick="window.location.href='subjects.html'">Train Another Topic</button>
          <button class="btn btn-secondary hover-lift" onclick="window.location.href='dashboard.html'">Mission Control</button>
        </div>
      </div>
    `;
  }

  // ── DATA ENGINE ──
  function resolveFile(subject, level, topic) {
    const broadMap = {
      'primary-1:mathematics': '../data/questions/p1-mathematics-whole-numbers.json',
      'primary-2:mathematics': '../data/questions/p2-mathematics.json',
      'primary-2:english':     '../data/questions/p2-english.json',
      'primary-4:mathematics': '../data/questions/p4-mathematics.json',
      'primary-4:science':     '../data/questions/p4-science.json',
      'primary-4:english':     '../data/questions/p4-english.json',
      'primary-5:mathematics': '../data/questions/p5-mathematics.json',
      'primary-5:science':     '../data/questions/p5-science.json',
    };

    if (subject === 'english' && state.currentType && ['cloze', 'editing'].includes(state.currentType)) {
      const levelShort = level.replace('primary-', 'p');
      return `../data/questions/${levelShort}-english-${state.currentType}.json`;
    }

    const key = `${level}:${subject}`;
    const broadPath = broadMap[key];
    if (!broadPath) return null;

    if (topic && topic !== 'all') {
      const levelShort = level.replace('primary-', 'p');
      return `../data/questions/${levelShort}-${subject}-${topic}.json`;
    }

    return broadPath;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── SAVE RESULTS ──
  async function saveQuizResult() {
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get('student');
    if (!studentId) return;

    try {
      const sb = await getSupabase();
      
      const topicCounts = {};
      state.questions.forEach(q => {
        if (q.topic) topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
      });
      const primaryTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || params.get('topic') || 'Mixed';

      const { data: attempt, error: attErr } = await sb
        .from('quiz_attempts')
        .insert({
          student_id:         studentId,
          subject:            params.get('subject') || 'mathematics',
          level:              params.get('level') || 'primary-4',
          topic:              primaryTopic,
          difficulty:         'Mixed',
          score:              state.score,
          // FIX: Removed the duplicate total_questions key so multi-part grading works
          total_questions:    state.totalPossibleScore > 0 ? state.totalPossibleScore : state.questions.length,
          time_taken_seconds: state.quizStartTime ? Math.round((Date.now() - state.quizStartTime) / 1000) : null,
          completed_at:       new Date().toISOString(),
        })
        .select('id')
        .single();

      if (attErr) throw attErr;

      const qAttempts = state.questions.map((q, i) => {
         const ans = state.answers[i];
         let isCorrect = false;
         
         if (q.type === 'mcq') {
           isCorrect = (ans === q.correct_answer);
         } else {
           const norm = (s) => String(s || '').toLowerCase().replace(/\s/g,'');
           isCorrect = (norm(ans) === norm(q.correct_answer));
         }
         
         return {
           quiz_attempt_id: attempt.id,
           student_id:      studentId,
           question_text:   (q.question_text || '').slice(0, 500),
           topic:           q.topic || primaryTopic,
           difficulty:      q.difficulty || 'standard',
           correct:         isCorrect,
           answer_chosen:   String(ans || '').slice(0, 200),
           correct_answer:  String(q.correct_answer || ''),
         };
      });

      if (qAttempts.length > 0) {
        await sb.from('question_attempts').insert(qAttempts);
      }

      const today = new Date().toISOString().slice(0, 10);
      const { data: existingUsage } = await sb
        .from('daily_usage')
        .select('id, questions_attempted')
        .eq('student_id', studentId)
        .eq('date', today)
        .maybeSingle();

      const newCount = (existingUsage?.questions_attempted || 0) + state.questions.length;

      if (!existingUsage) {
        await sb.from('daily_usage').insert({
          student_id:          studentId,
          date:                today,
          questions_attempted: newCount,
        });
      } else {
        await sb.from('daily_usage')
          .update({ questions_attempted: newCount })
          .eq('id', existingUsage.id);
      }
      
    } catch (e) {
      console.error('Failed to save quiz result:', e);
    }
  }

  // ── CANVAS LOGIC ──
  let ctx, isDrawing = false;
  function initCanvas(qid) {
    const canvas = document.getElementById('scratchpadCanvas');
    if (!canvas) return;
    
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 300;
    
    ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2C3E3A';

    if (state.drawings[qid] && state.drawings[qid] !== 'init' && state.drawings[qid] !== 'text') {
      let img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = state.drawings[qid];
    }

    if (state.isAnswered) return; 

    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      return { x, y };
    };

    const start = (e) => { isDrawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); };
    const draw = (e) => { if (!isDrawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); };
    const stop = () => { if(isDrawing) { isDrawing = false; state.drawings[qid] = canvas.toDataURL(); } };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseout', stop);
    canvas.addEventListener('touchstart', start, {passive: false});
    canvas.addEventListener('touchmove', draw, {passive: false});
    canvas.addEventListener('touchend', stop);
  }

  window.clearCanvas = () => {
    if(ctx && !state.isAnswered) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      state.drawings[state.currentIndex] = ctx.canvas.toDataURL();
    }
  };

  
  // ── DATA FETCHING ──
  async function init() {
    try {
      const params = new URLSearchParams(window.location.search);
      const subject = params.get('subject') || 'mathematics';
      const levelSlug = params.get('level') || 'primary-4';
      const topic = params.get('topic');
      const type = params.get('type');
      const studentId = params.get('student');
      
      state.currentType = type;

      if (studentId) {
        const isJunior = levelSlug.includes('primary-1') || levelSlug.includes('primary-2') || levelSlug === 'p1' || levelSlug === 'p2';
        
        document.querySelectorAll('.bottom-nav-item').forEach(link => {
          const url = new URL(link.href, window.location.origin);
          url.searchParams.set('student', studentId);
          link.href = url.pathname + url.search;
          
          if (isJunior && link.getAttribute('href').includes('exam.html')) {
            link.style.display = 'none';
          }
        });
        
        if (isJunior) {
          const nav = document.getElementById('bottomNav');
          if (nav) nav.style.justifyContent = 'space-evenly';
        }
      }
      
      // --- MASTERCLASS UPGRADE: Fetch dynamically from Supabase ---
      const db = await window.getSupabase();
      
      // We call the high-performance RPC function we created in SQL
      let { data: fetchedQuestions, error } = await db.rpc('get_random_practice_questions', {
        p_subject: subject.toLowerCase(),
        p_level: levelSlug.replace('primary-', 'Primary '), // FIX: Translates URL slug to Database string
        p_topic: (topic || 'mixed').toLowerCase(), 
        p_limit: 50 
      });

      if (error) {
        console.error('Database fetch error:', error);
        throw new Error('Failed to load questions from the bank.');
      }

      if (!fetchedQuestions || fetchedQuestions.length === 0) {
        state.questions = [];
        state.phase = 'QUIZ';
        render();
        return;
      }

      // Filter by type if the user requested a specific type (e.g., mcq only)
      let pool = type && type !== 'mixed' 
        ? fetchedQuestions.filter(q => q.type === type) 
        : fetchedQuestions;

      // Slice the final 10 for the session
      state.questions = pool.slice(0, 10);
      
      // UPGRADE: Calculate accurate total possible marks for multi-part questions
      state.totalPossibleScore = state.questions.reduce((sum, q) => {
        if (q.type === 'cloze') return sum + (q.blanks?.length || 1);
        if (q.type === 'editing') return sum + (q.passage_lines?.length || 1);
        if (q.type === 'word_problem' || q.type === 'open_ended') return sum + 0; // Self-graded types
        return sum + 1; // Standard MCQ & Short Answer
      }, 0);

      state.quizStartTime = Date.now();
      state.phase = 'QUIZ';
      render();
    } catch (err) {
      console.warn("Local fetch failed:", err);
      state.questions = [];
      state.phase = 'QUIZ';
      render();
    }
  }

  setTimeout(init, 100);
};