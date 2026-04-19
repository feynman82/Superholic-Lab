window.initQuizEngine = function() {
  'use strict';

  // 🚀 GLOBAL UTILITY: The Vanilla JS Pen Tool Engine
  window.togglePenTool = function(canvasId) {
    const container = document.getElementById(canvasId + '-container');
    if (!container) return;
    
    container.classList.toggle('hidden');
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // If we are just hiding it, don't run the initialization logic
    if (container.classList.contains('hidden')) return;

    // 🌟 FIX: Wait 10ms for the browser to render the unhidden container before measuring it
    setTimeout(() => {
      // Only set dimensions and listeners on the FIRST time it is opened
      if (!canvas.isInitialized) {
        const rect = container.getBoundingClientRect();
        
        // Ensure it gets a real width, not 0
        canvas.width = rect.width || container.offsetWidth || 800;
        canvas.height = Math.max(rect.height || container.offsetHeight, 300); // Min height of 300px
        
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 2; 
        ctx.lineCap = 'round'; 
        ctx.strokeStyle = 'var(--brand-sage, #51615E)'; // Match UI theme

        let isDrawing = false, lastX = 0, lastY = 0;

        function getPos(e) {
          const r = canvas.getBoundingClientRect();
          // Safely handle both mouse and touch coordinates
          const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
          return { 
            x: clientX - r.left, 
            y: clientY - r.top 
          };
        }

        function startDrawing(e) {
          isDrawing = true;
          const pos = getPos(e);
          lastX = pos.x;
          lastY = pos.y;
          ctx.beginPath();
          ctx.moveTo(lastX, lastY);
          ctx.lineTo(lastX, lastY); // Instantly draw a dot for simple taps
          ctx.stroke();
        }

        function draw(e) {
          if (!isDrawing) return;
          if (e.cancelable) e.preventDefault(); // Stop screen from scrolling
          const pos = getPos(e);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
          lastX = pos.x;
          lastY = pos.y;
        }

        function stopDrawing() {
          isDrawing = false;
          ctx.closePath();
        }

        // Desktop Mouse Events
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        // Mobile Touch Events (passive: false is CRITICAL to prevent screen scrolling)
        canvas.addEventListener('touchstart', (e) => { 
          if (e.cancelable) e.preventDefault(); 
          startDrawing(e); 
        }, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);
        canvas.addEventListener('touchcancel', stopDrawing);

        // Hardware-level scroll prevention
        canvas.style.touchAction = 'none';
        
        canvas.isInitialized = true;
      }
    }, 10);
  };

  // 🚀 GLOBAL UTILITY: Smart Rubric Formatter (Font-Consistent)
  window.formatWorkedSolution = function(raw) {
    if (!raw) return '<em class="font-sans">No step-by-step solution provided.</em>';
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (typeof parsed === 'object' && parsed !== null) {
        let html = '';
        for (const [key, val] of Object.entries(parsed)) {
           html += `
            <div class="mb-4 font-sans">
              <h5 class="font-bold text-brand-dark mb-2">${esc(key)}</h5>
              <div class="text-main leading-relaxed" style="word-wrap: break-word;">${val}</div>
            </div>`;
        }
        return html;
      }
    } catch(e) {}
      // 🚀 MASTERCLASS FIX: Removed esc() so HTML tags from the database render correctly
      return `<span class="font-sans">${String(raw).replace(/\n/g, '<br>')}</span>`;
    };

  const state = {
    phase: 'LOAD',
    questions: [],
    currentIndex: 0,
    streak: 0,
    maxStreak: 0,
    score: 0,
    totalPossibleScore: 0,
    answers: {},       
    drawings: {},      
    isAnswered: false, 
    feedback: null,
    currentType: null,
    quizStartTime: null,
    hintLevel: 0,
    activeWPPart: 0 // Tracks Progressive Word Problem UI
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
          return `<div class="procedural-diagram mb-4 mx-auto flex justify-center w-full" style="max-width: 600px; overflow-x: auto;">
                    ${DiagramLibrary[fnName](params)}
                  </div>`;
        } else {
          // The AI invented a function you haven't built yet! Graceful fallback.
          console.warn(`[DiagramLibrary] Missing function requested by AI: ${fnName}`, params);
          return `<div class="procedural-diagram mb-4 mx-auto flex justify-center w-full" style="max-width: 600px; overflow-x: auto;">
                    ${DiagramLibrary.placeholder({ 
                      description: `Requires DiagramLibrary.${fnName}()\nParams: ${JSON.stringify(params).substring(0,40)}...` 
                    })}
                  </div>`;
        }
      } catch (err) {
        console.error("[DiagramLibrary] Rendering crashed:", err);
        return `<div class="procedural-diagram mb-4 mx-auto flex justify-center w-full" style="max-width: 600px; overflow-x: auto;">
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
    
    let safeOptions = [];
    try { safeOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []); } catch(e) {}

    return safeOptions.map((opt, i) => {
      const letter = letters[i];
      const isSel = savedAns === opt; // Compare exact string
      
      let extraStyle = '';
      if (state.isAnswered) {
        // Safe string normalization
        const normOpt = String(opt).trim().toLowerCase();
        const normAns = String(q.correct_answer).trim().toLowerCase();

        if (normOpt === normAns) extraStyle = 'border-color:var(--brand-mint);background:rgba(5,150,105,0.1);';
        else if (isSel)          extraStyle = 'border-color:var(--brand-error);background:rgba(220,38,38,0.1);opacity:0.8;';
        else                     extraStyle = 'opacity:0.45;pointer-events:none;';
      }
      
      // Pass the array index to avoid quotation-mark escaping crashes in HTML
      return `<div class="mcq-opt${isSel?' is-sel':''}" style="${extraStyle}${state.isAnswered?'pointer-events:none;':''}" onclick="window.selectMcq(${i})">
        <span class="mcq-badge">${letter}</span><span class="font-medium text-main">${esc(opt)}</span>
      </div>`;
    }).join('');
  }

  function buildTextAreaUI(q) {
    let savedAns = String(state.answers[state.currentIndex] || '');
    const isDrawMode = state.drawings[state.currentIndex] && state.drawings[state.currentIndex] !== 'text';
    
    const isShortAns = q.type === 'short_ans';
    const placeholderText = isShortAns ? 'Type your complete sentence here...' : 'Final Answer (Optional)';
    
    const baseInputStyle = "form-input w-full p-4 text-lg border-2 border-slate-200 focus:border-brand-sage rounded-xl transition-all shadow-sm";
    const drawModeInputStyle = "form-input mt-3 w-full p-4 text-lg border-2 border-brand-sage focus:border-brand-sage rounded-xl transition-all shadow-sm bg-sage-50/10";

    // 🚀 MASTERCLASS SYNTHESIS PARSER
    let synthesisHtml = '';
    let isSynthesis = (q.topic || '').toLowerCase() === 'synthesis';
    
    if (isSynthesis && q.question_text) {
      // 🚀 MASTERCLASS FIX: Safely strip any legacy \n\n connectors hiding in the text
      const displayQuestion = q.question_text.split('\n\n')[0].trim();
      
      // Extract the connector from the single quotes in the instructions (e.g. '... respectively.')
      let rawConnector = '';
      if (q.instructions) {
         const match = q.instructions.match(/'([^']+)'/);
         if (match) rawConnector = match[1];
      }
      const cleanConnector = rawConnector.replace(/^\.\.\.|\.\.\.$|^\(|\)$/g, '').trim(); 
      
      // 🚀 MASTERCLASS FIX: Adjusted margin to sit perfectly on the text baseline
        const lineBlock = `<div class="flex-1" style="border-bottom: 2px solid var(--text-main); margin-bottom: 0.3rem; opacity: 0.5;"></div>`;
        
        let blueprintHtml = '';
        if (rawConnector.startsWith('...') && rawConnector.endsWith('...')) {
           // MIDDLE: ... despite ...
           blueprintHtml = `${lineBlock}<div class="font-bold text-brand-rose px-4 py-2 bg-surface rounded shadow-sm text-sm uppercase tracking-widest">${esc(cleanConnector)}</div>${lineBlock}`;
        } else if (rawConnector.startsWith('(') && rawConnector.endsWith(')')) {
           // Fallback for legacy bracket formats
           blueprintHtml = `${lineBlock}<div class="font-bold text-brand-rose px-4 py-2 bg-surface rounded shadow-sm text-sm uppercase tracking-widest">${esc(cleanConnector)}</div>${lineBlock}`;
        } else if (rawConnector.startsWith('...')) {
           // END: ... respectively.
           blueprintHtml = `${lineBlock}<div class="font-bold text-brand-rose px-4 py-2 bg-surface rounded shadow-sm text-sm uppercase tracking-widest">${esc(cleanConnector)}</div>`;
        } else {
           // START: The boys
           blueprintHtml = `<div class="font-bold text-brand-rose px-4 py-2 bg-surface rounded shadow-sm text-sm uppercase tracking-widest">${esc(cleanConnector)}</div>${lineBlock}`;
           if (!savedAns) prefillAns = cleanConnector + ' '; 
        }

        synthesisHtml = `
          <div class="card p-5 bg-elevated border border-light mb-6 shadow-sm">
            <div class="text-lg text-main font-medium leading-relaxed mb-6">${esc(displayQuestion)}<br><br></div>
            <div class="flex items-end gap-3 w-full">${blueprintHtml}</div>
          </div>
        `;
    }

    const typeModeHTML = isShortAns
      ? `<input type="text" id="qInput" class="${baseInputStyle}" placeholder="${placeholderText}" value="${esc(savedAns)}" ${state.isAnswered ? 'disabled' : ''} autocomplete="off" oninput="window.saveInputState()">`
      : `<textarea id="qInput" class="${baseInputStyle}" rows="4" placeholder="Type your detailed answer or working here..." style="height: auto; resize: vertical;" ${state.isAnswered ? 'disabled' : ''} oninput="window.saveInputState()">${esc(savedAns)}</textarea>`;

    return `
      ${synthesisHtml}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <span class="text-xs font-bold text-muted uppercase tracking-wider">💡 Tip: Draw your working!</span>
        <div class="flex gap-2 w-full sm:w-auto">
          <button class="btn btn-sm ${!isDrawMode ? 'bg-sage-dark text-white' : 'btn-ghost'}" onclick="window.setMode('text')" ${state.isAnswered ? 'disabled' : ''}>⌨️ Type</button>
          <button class="btn btn-sm ${isDrawMode ? 'bg-sage-dark text-white' : 'btn-ghost'}" onclick="window.setMode('draw')" ${state.isAnswered ? 'disabled' : ''}>✏️ Pen Tool</button>
        </div>
      </div>
      
      ${!isDrawMode
        ? typeModeHTML
        : `<div id="drawArea" class="scratchpad-container mb-4" style="position: relative; display: block;">
             <canvas id="scratchpadCanvas" class="scratchpad-canvas bg-white border-2 border-slate-200 rounded-xl w-full shadow-sm" style="min-height: 300px; touch-action: none; cursor: crosshair; ${state.isAnswered ? 'pointer-events:none;' : ''}"></canvas>
             ${!state.isAnswered ? `
             <div style="position: absolute; top: 12px; right: 12px;">
                <button class="btn btn-sm btn-ghost bg-white hover-lift border border-slate-200 shadow-sm rounded-lg" onclick="window.clearCanvas()">🗑️ Clear</button>
             </div>` : ''}
           </div>
           <input type="text" id="qInput" class="${drawModeInputStyle}" placeholder="${placeholderText}" value="${esc(savedAns)}" ${state.isAnswered ? 'disabled' : ''}>`
      }`;
  }

  function buildWordProblemUI(q) {
    let partsData = [];
    try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch(e) {}
    if (partsData.length === 0) return `<div class="text-amber">Legacy format. Please update in database.</div>`;

    let inlineActionBtn = '';
    let inlineFeedbackHtml = '';
    if (!state.isAnswered && state.activeWPPart < partsData.length) {
        const isLastPart = state.activeWPPart >= partsData.length - 1;
        if (state.feedback && state.feedback.status === 'loading') {
             inlineActionBtn = `<div class="mt-4 pt-4 border-t border-light flex justify-end"><button class="btn btn-primary" disabled><span class="spinner-sm inline-block mr-2 border-white"></span> Grading...</button></div>`;
        } else {
             inlineActionBtn = `<div class="mt-4 pt-4 border-t border-light flex justify-end"><button class="btn btn-primary hover-lift" onclick="window.checkAnswer()">${isLastPart ? 'Submit Final Answer' : 'Submit Part & Continue'}</button></div>`;
        }
    }

    return partsData.map((p, partIdx) => {
      const pLabel = p.label || (p.part_id ? `(${p.part_id})` : `Part ${partIdx + 1}`);
      const pQuestion = p.question || p.question_text || '';
      const pMarks = p.marks || 2;
      const pModel = p.model_answer || p.worked_solution || p.correct_answer || '';

      const isLocked = partIdx > state.activeWPPart;
      const isCompleted = partIdx < state.activeWPPart;
      const isActive = partIdx === state.activeWPPart;

      if (isLocked) {
        return `
          <div class="mb-4 p-4" style="opacity: 0.4; pointer-events: none; border-left: 3px solid var(--border-light);">
            <span class="font-display text-xl text-muted font-bold">🔒 ${esc(pLabel)}</span>
          </div>`;
      }

      const savedWorking = (state.answers[state.currentIndex] || {})[pLabel] || '';
      const drawKey = `${state.currentIndex}_${pLabel}`;
      const isDrawMode = state.drawings[drawKey] && state.drawings[drawKey] !== 'text';
      const showModel = isCompleted || (isActive && state.isAnswered);

      const baseInputStyle = "form-input w-full p-4 text-lg border-2 border-slate-200 focus:border-brand-sage rounded-xl transition-all shadow-sm";
      const drawModeInputStyle = "form-input mt-3 w-full p-4 text-lg border-2 border-brand-sage focus:border-brand-sage rounded-xl transition-all shadow-sm bg-sage-50/10";

      let interactionUI = '';
      if (!showModel) {
        interactionUI = `
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <span class="text-xs font-bold text-muted uppercase tracking-wider">💡 Tip: Draw your working!</span>
            <div class="flex gap-2 w-full sm:w-auto">
              <button class="btn btn-sm ${!isDrawMode ? 'bg-sage-dark text-white' : 'btn-ghost'}" onclick="window.setMode('text', '${pLabel}')">⌨️ Type</button>
              <button class="btn btn-sm ${isDrawMode ? 'bg-sage-dark text-white' : 'btn-ghost'}" onclick="window.setMode('draw', '${pLabel}')">✏️ Pen Tool</button>
            </div>
          </div>
          
          ${!isDrawMode
            ? `<textarea id="wp-${esc(pLabel)}" class="${baseInputStyle}" rows="3" placeholder="Type your detailed working and answer here..." style="height: auto; resize: vertical;"></textarea>`
            : `<div class="scratchpad-container mb-4" style="position: relative; display: block;">
                 <canvas id="scratchpadCanvas" data-drawkey="${drawKey}" class="scratchpad-canvas bg-white border-2 border-slate-200 rounded-xl w-full shadow-sm" style="min-height: 300px; touch-action: none; cursor: crosshair;"></canvas>
                 <div style="position: absolute; top: 12px; right: 12px;">
                    <button class="btn btn-sm btn-ghost bg-white hover-lift border border-slate-200 shadow-sm rounded-lg" onclick="window.clearCanvas()">🗑️ Clear</button>
                 </div>
               </div>
               <input type="text" id="wp-${esc(pLabel)}" class="${drawModeInputStyle}" placeholder="Final Answer (Required for marking)" value="${esc(savedWorking)}">`
          }
          ${isActive ? inlineFeedbackHtml + inlineActionBtn : ''}`;
      } else {
        interactionUI = `
          <div class="p-4 bg-surface border border-light rounded-xl mb-4 text-main whitespace-pre-wrap text-lg">${esc(savedWorking) || '<em>No text answer provided.</em>'}</div>
          ${(state.drawings[drawKey] && state.drawings[drawKey] !== 'init' && state.drawings[drawKey] !== 'text') ? `<img src="${state.drawings[drawKey]}" class="mb-4 border-2 border-slate-200 rounded-xl shadow-sm bg-white" style="max-height: 200px;">` : ''}
          
          <div class="ans-block strong p-5 bg-science-tint card-rule-mint rounded-xl">
            <div class="text-xs font-bold mb-2 text-success uppercase tracking-wider flex items-center gap-2"><span>✨</span> Miss Wena's Model Answer</div>
            <div class="text-base text-main font-medium whitespace-pre-wrap leading-relaxed">${window.formatWorkedSolution(pModel)}</div>
          </div>
        `;
      }

      return `
        <div class="mb-6">
          <div class="flex items-center gap-3 mb-3">
            <span class="font-display text-xl text-main font-bold" style="color: var(--brand-sage);">${esc(pLabel)}</span>
            <span class="badge badge-info text-xs">${pMarks} mark${pMarks!==1?'s':''}</span>
          </div>
          ${pQuestion ? `<div class="text-lg text-main font-medium mb-4 leading-relaxed">${esc(pQuestion)}</div>` : ''}
          ${interactionUI}
        </div>`;
    }).join('');
  }

function buildClozeUI(q) {
    const savedAns = state.answers[state.currentIndex] || {};
    let blanks = [];
    try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch(e) {}

    const allWords = new Set();
    blanks.forEach(b => (b.options || []).forEach(w => allWords.add(w)));
    
    let wordBankHtml = '';
    if (allWords.size > 0) {
      const wordBankList = [...allWords].sort().map((w, i) =>
        `<span class="badge bg-surface border border-light text-main" style="font-size:0.9rem; padding: 6px 12px; font-weight: 500;">(${i+1}) ${esc(w)}</span>`
      ).join('');
      wordBankHtml = `
        <div class="card bg-page p-4 mb-4">
          <div class="text-xs font-bold text-muted uppercase mb-3">Word Bank</div>
          <div class="flex flex-wrap gap-2">${wordBankList}</div>
        </div>`;
    }

    let passage = esc(q.passage || '').replace(/\n/g, '<br>');
    
    blanks.forEach(b => {
      const num = b.id || b.number;
      const saved = savedAns[num] || '';
      let inputHtml = '';
      
      if (state.isAnswered) {
        const isCorrect = (savedAns[num] || '').toLowerCase() === (b.correct_answer || '').toLowerCase();
        const stateClass = isCorrect ? 'is-correct' : 'is-wrong';
        
        if (b.options && b.options.length > 0) {
          inputHtml = `<select id="cloze-blank-${num}" class="cloze-select ${stateClass}" disabled style="min-width: 100px;">
            <option value="${esc(saved)}">${esc(saved||'—')}</option></select>`;
        } else {
          inputHtml = `<input type="text" id="cloze-blank-${num}" class="editing-input ${stateClass}" value="${esc(saved)}" disabled style="width: 120px; display: inline-block; margin: 0 4px;">`;
        }
      } else {
        if (b.options && b.options.length > 0) {
          const opts = (b.options || []).map(o =>
            `<option value="${esc(o)}" ${saved === o ? 'selected' : ''}>${esc(o)}</option>`
          ).join('');
          inputHtml = `<select id="cloze-blank-${num}" class="cloze-select" onchange="window.saveInputState()" style="min-width: 100px;">
            <option value="" disabled ${!saved ? 'selected' : ''}>Select...</option>${opts}</select>`;
        } else {
          inputHtml = `<input type="text" id="cloze-blank-${num}" class="editing-input" value="${esc(saved)}" placeholder="type here" autocomplete="off" oninput="window.saveInputState()" style="width: 120px; display: inline-block; margin: 0 4px;">`;
        }
      }
      const blankRegex = new RegExp(`_*\\s*(\\[|\\()${num}(\\]|\\))\\s*_*`, 'g');
      passage = passage.replace(blankRegex, inputHtml);
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

    return `
      ${wordBankHtml}
      <div class="card p-6 cloze-passage text-lg text-main font-normal">${passage}</div>
      ${blankFeedback}`;
  }

  function buildEditingUI(q) {
    const savedAns = state.answers[state.currentIndex] || {};
    let blanks = [];
    try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch(e) {}

    let html = esc(q.passage || '')
      .replace(/\n/g, '<br><br>')
      .replace(/&lt;u&gt;/gi, '<u>')
      .replace(/&lt;\/u&gt;/gi, '</u>');

    html = html.replace(/\[(\d+)\]/g, (match, numStr) => {
      const num = parseInt(numStr, 10);
      const saved = savedAns[num] || '';
      
      const blankDef = blanks.find(b => b.number == num) || {};
      const correctAns = blankDef.correct_answer || blankDef.correct_word || '';

      if (state.isAnswered) {
        const isCorrect = saved.toLowerCase() === correctAns.toLowerCase();
        const stateClass = isCorrect ? 'is-correct' : 'is-wrong';
        
        return `<input type="text" value="${esc(saved)}" disabled class="editing-inline-input ${stateClass}">
                ${!isCorrect ? `<span class="text-lg font-bold text-success ml-2 align-middle">(${esc(correctAns)})</span>` : ''}`;
      } else {
        return `<input type="text" id="cloze-blank-${num}" value="${esc(saved)}" autocomplete="off" class="editing-inline-input" oninput="window.saveInputState()">`;
      }
    });

    let editFeedback = '';
    if (state.isAnswered) {
      const wrongBlanks = blanks.filter(b => {
        const saved = savedAns[b.number] || '';
        const correctAns = b.correct_answer || b.correct_word || '';
        return saved.toLowerCase() !== correctAns.toLowerCase();
      });
      
      if (wrongBlanks.length > 0) {
        editFeedback = `<div class="card bg-page p-6 mt-6">
          <div class="text-sm font-bold text-muted uppercase mb-4">Explanations</div>
          ${wrongBlanks.map(b => {
            const correctAns = b.correct_answer || b.correct_word || '';
            return `
            <div class="text-lg text-main py-3" style="border-bottom: 1px solid var(--border-light);">
              <span class="font-bold">[${b.number}] → <span class="text-success">${esc(correctAns)}</span>:</span> ${esc(b.explanation)}
            </div>
          `}).join('')}
        </div>`;
      }
    }

    return `<div class="card p-6 editing-passage text-lg text-main font-normal" style="line-height: 2.4;">${html}</div>${editFeedback}`;
  }

  function buildComprehensionUI(q) {
    let partsData = [];
    try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch(e) {}
    if (partsData.length === 0) return `<div class="text-amber">No questions found for this passage.</div>`;

    const savedAnsObj = state.answers[state.currentIndex] || {};

    let inlineActionBtn = '';
    let inlineFeedbackHtml = '';
    if (!state.isAnswered && state.activeWPPart < partsData.length) {
        const isLastPart = state.activeWPPart >= partsData.length - 1;
        if (state.feedback && state.feedback.status === 'loading') {
             inlineActionBtn = `<div class="mt-4 pt-4 border-t border-light flex justify-end"><button class="btn btn-primary" disabled><span class="spinner-sm inline-block mr-2 border-white"></span> Grading...</button></div>`;
        } else {
             inlineActionBtn = `<div class="mt-4 pt-4 border-t border-light flex justify-end"><button class="btn btn-primary hover-lift" onclick="window.checkAnswer()">${isLastPart ? 'Submit Final Answer' : 'Submit Part & Continue'}</button></div>`;
             if (state.feedback) {
                 const fb = state.feedback;
                 const isPartial = fb.status === 'partial' || fb.status === 'wrong';
                 const ruleClass = isPartial ? 'card-rule-amber' : 'card-rule-mint';
                 const bgClass   = isPartial ? 'bg-amber-tint' : 'bg-science-tint';
                 const textClass = isPartial ? 'text-amber' : 'text-success';
                 const icon      = isPartial ? '💡' : '🎉';
                 inlineFeedbackHtml = `<div class="card ${ruleClass} ${bgClass} p-4 mt-4 mb-2">
                   <div class="font-bold mb-2 ${textClass}">${icon} Miss Wena says:</div>
                   <p class="text-sm text-main leading-relaxed">${fb.text}</p>
                   ${fb.correctAnswer ? `<div class="mt-3 text-sm font-bold text-main">Correct Answer: <span class="text-success">${esc(fb.correctAnswer)}</span></div>` : ''}
                 </div>`;
             }
        }
    }

    const partsHtml = partsData.map((part, idx) => {
      // Use activeWPPart to track progression, just like word problems
      const isLocked = idx > state.activeWPPart;
      const isCompleted = idx < state.activeWPPart;
      const isActive = idx === state.activeWPPart;
      // Use custom label for Science (e.g., "(a)"), fallback to Q1 for English
      const pLabel = part.label || `Q${idx + 1}`; 

      if (isLocked) {
        return `<div class="mb-4 p-4" style="opacity: 0.4; pointer-events: none; border-left: 3px solid var(--border-light);"><span class="font-display text-xl text-muted font-bold">🔒 ${pLabel}</span></div>`;
      }

      const savedWorking = savedAnsObj[pLabel] || '';
      
      let interactionUI = '';
      if (!isCompleted) {
        const safeIdLabel = String(pLabel).replace(/[^a-zA-Z0-9]/g, '');
        
        if (part.part_type === 'text_box') {
          interactionUI = `<textarea id="comp-${safeIdLabel}" class="form-input w-full p-4 text-lg border-2 border-light focus:border-brand-sage rounded-xl" rows="3" placeholder="Type your answer here...">${esc(typeof savedWorking === 'string' ? savedWorking : '')}</textarea>`;
        
        } else if (part.part_type === 'mcq') {
          const letters = ['A','B','C','D'];
          interactionUI = (part.options || []).map((opt, i) => `
            <div class="mcq-opt hover-lift ${savedWorking === opt ? 'is-sel' : ''}" onclick="window.selectCompMcq('${pLabel}', ${i})">
              <span class="mcq-badge">${letters[i]}</span><span class="font-medium text-main">${esc(opt)}</span>
            </div>
          `).join('');
          
        } else if (part.part_type === 'referent') {
          interactionUI = `
            <table class="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden mt-2 mb-4 bg-surface shadow-sm">
              <thead class="bg-elevated border-b border-light text-lg">
                <tr>
                  <th class="p-3 font-bold text-main w-1/2">Word from passage</th>
                  <th class="p-3 font-bold text-main w-1/2">What it refers to</th>
                </tr>
              </thead>
              <tbody class="text-lg">
                ${(part.items || []).map((item, i) => `
                  <tr class="border-b border-slate-200 last:border-0">
                    <td class="p-4 font-medium text-main align-middle leading-relaxed text-lg">${esc(item.word)}</td>
                    <td class="p-3 align-middle border-l border-slate-200">
                      <input type="text" id="comp-${safeIdLabel}-ref${i}" class="form-input w-full p-3 text-lg border-2 border-slate-200 rounded-lg focus:border-brand-sage" placeholder="Type here..." value="${esc(savedWorking['ref'+i] || '')}" oninput="window.saveInputState ? window.saveInputState() : null">
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>`;
          
        } else if (part.part_type === 'sequencing') {
          interactionUI = `<div class="flex flex-col gap-3 mt-2 text-lg">` + (part.items || []).map((item, i) => `
            <div class="flex items-center gap-4 bg-surface p-3 rounded-lg border border-light shadow-sm">
              <input type="number" id="comp-${safeIdLabel}-seq${i}" class="form-input border-2 border-slate-200 rounded-lg focus:border-brand-sage text-2xl font-bold text-center" style="width: 60px; height: 60px; padding: 0;" min="1" max="3" value="${esc(savedWorking['seq'+i] || '')}" oninput="window.saveInputState ? window.saveInputState() : null">
              <div class="font-medium text-main leading-relaxed text-lg">${esc(item)}</div>
            </div>
          `).join('') + `</div>`;
          
        } else if (part.part_type === 'true_false') {
          interactionUI = `
            <table class="w-full text-left border-collapse border border-light rounded-lg overflow-hidden mt-2 mb-4 bg-surface shadow-sm">
              <thead class="bg-elevated border-b border-light text-lg">
                <tr>
                  <th class="p-3 font-bold text-main w-2/5">Statement</th>
                  <th class="p-3 font-bold text-main text-center w-1/5 whitespace-nowrap border-l border-slate-200">True / False</th>
                  <th class="p-3 font-bold text-main w-2/5 border-l border-slate-200">Reason</th>
                </tr>
              </thead>
              <tbody class="text-lg">
                ${(part.items || []).map((item, i) => `
                  <tr class="border-b border-slate-200 last:border-0">
                    <td class="p-4 font-medium text-main align-top leading-relaxed text-lg">${esc(item.statement)}</td>
                    <td class="p-4 align-top text-center border-l border-slate-200">
                      <div class="flex flex-col gap-3 items-center justify-start mt-2">
                        <label class="flex items-center gap-2 cursor-pointer font-bold text-lg"><input type="radio" name="comp-${safeIdLabel}-tf${i}" value="True" ${savedWorking['tf'+i]==='True'?'checked':''} onchange="window.saveInputState ? window.saveInputState() : null"> True</label>
                        <label class="flex items-center gap-2 cursor-pointer font-bold text-lg"><input type="radio" name="comp-${safeIdLabel}-tf${i}" value="False" ${savedWorking['tf'+i]==='False'?'checked':''} onchange="window.saveInputState ? window.saveInputState() : null"> False</label>
                      </div>
                    </td>
                    <td class="p-3 align-top border-l border-slate-200">
                      <textarea id="comp-${safeIdLabel}-reason${i}" class="form-input w-full p-3 text-lg border-2 border-slate-200 rounded-lg focus:border-brand-sage" rows="4" placeholder="Evidence from text..." oninput="window.saveInputState ? window.saveInputState() : null">${esc(savedWorking['reason'+i] || '')}</textarea>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>`;
        }

        // Sub-question Diagram Support for quiz.js
        let partDiagram = '';
        if (part.visual_payload && typeof renderVisualPayload !== 'undefined') {
          partDiagram = renderVisualPayload(part.visual_payload);
        } else if (part.image_url) {
          partDiagram = `<div class="mb-4 mx-auto flex justify-center w-full" style="max-width: 600px;"><img src="${esc(part.image_url)}" style="max-height: 220px; max-width: 100%; object-fit: contain; border-radius: var(--radius-md); border: 1px solid var(--border-light);"></div>`;
        }
        
        if (partDiagram) {
            interactionUI = partDiagram + interactionUI;
        }
        
        if (isActive) {
            interactionUI += inlineFeedbackHtml + inlineActionBtn;
        }
      } else {
         // Completed State - Handles both flat strings and nested JSON table data gracefully
         let displayAns = '';
         if (typeof savedWorking === 'object' && savedWorking !== null) {
             displayAns = Object.values(savedWorking).filter(v => v).map(v => esc(v)).join('<br><br>');
         } else {
             displayAns = esc(savedWorking);
         }
         
         interactionUI = `
          <div class="p-4 bg-surface border border-light rounded-xl mb-4 text-main text-lg font-medium">${displayAns || '<em>No answer provided.</em>'}</div>
          <div class="ans-block strong p-5 bg-science-tint card-rule-mint rounded-xl">
            <div class="text-xs font-bold mb-2 text-success uppercase tracking-wider">✨ Model Answer / Explanation</div>
            <div class="text-lg text-main font-bold leading-relaxed">${esc(part.model_answer || part.explanation || part.correct_answer)}</div>
          </div>
        `;
      }

      return `
        <div class="mb-6 pb-6 ${idx < partsData.length - 1 ? 'border-b border-light border-dashed' : ''}">
          <div class="flex items-center gap-3 mb-3">
            <span class="font-display text-xl text-main font-bold" style="color: var(--english-colour);">${pLabel}</span>
            <span class="badge badge-info text-xs">${part.marks} mark${part.marks !== 1 ? 's' : ''}</span>
          </div>
          ${part.question ? `<div class="text-lg text-main font-medium mb-4 leading-relaxed">${esc(part.question)}</div>` : ''}
          ${part.instructions ? `<div class="text-lg text-main font-medium mb-4 leading-relaxed">${esc(part.instructions)}</div>` : ''}
          ${interactionUI}
        </div>`;
    }).join('');

    // Masterclass UX: Vertical Split-Screen for Mobile
    const mobileStyleOverride = `
      <style>
        @media (max-width: 1023px) {
          .comp-passage-pane { 
            display: block !important; 
            width: 100% !important;
            max-height: 40vh; 
            overflow-y: auto; 
            margin-bottom: 1.5rem; 
            border-bottom: 2px dashed var(--border-light); 
            border-right: none !important;
            position: relative !important;
            top: 0 !important;
            padding-right: 1.5rem !important;
          }
          .comp-questions-pane {
            width: 100% !important;
          }
        }
      </style>
    `;

    return `
      ${mobileStyleOverride}
      <div class="comp-container">
        <div class="comp-passage-pane card p-6 text-lg text-main leading-relaxed">
          ${esc(q.passage).replace(/\\n/g, '<br><br>')}
        </div>
        <div class="comp-questions-pane">${partsHtml}</div>
      </div>
    `;
  }

// 🚀 NEW: Hint Renderer
  function buildHintsUI(q) {
    if (!q.progressive_hints || !Array.isArray(q.progressive_hints) || q.progressive_hints.length === 0) return '';

    let hintsHtml = '';
    
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
      app.innerHTML = `<div class="card text-center w-full hover-lift p-6" style="max-width: 680px; transition: max-width 0.3s ease;"><div class="text-4xl mb-4">🕵️</div><h2 class="font-display text-2xl text-main">No questions found!</h2><p class="text-muted text-sm my-4">Miss Wena hasn't added questions for this specific combination yet. Check back soon!</p><button class="btn btn-primary hover-lift" onclick="window.location.href='subjects.html'">Return to Subjects</button></div>`;
      return;
    }

    const q = state.questions[state.currentIndex];
    const isFirst = state.currentIndex === 0;
    const isLast = state.currentIndex === state.questions.length - 1;
    const isModelType = q.type === 'word_problem' || q.type === 'open_ended';

    // IN renderQuiz()
    const hasParts = (() => { try { return (typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || [])).length > 0; } catch(e){ return false; } })();
    const isSplitScreen = q.type === 'comprehension' || q.type === 'visual_text' || (q.type === 'open_ended' && hasParts);

    let inputUi = '';
    if (q.type === 'mcq')           inputUi = buildMCQOptions(q);
    else if (q.type === 'word_problem') inputUi = buildWordProblemUI(q);
    else if (isSplitScreen)         inputUi = buildComprehensionUI(q);
    else if (q.type === 'cloze')    inputUi = buildClozeUI(q);
    else if (q.type === 'editing')  inputUi = buildEditingUI(q);
    else                            inputUi = buildTextAreaUI(q);
    
    const hintsUi = buildHintsUI(q);

    let feedbackHtml = '';
    if (state.isAnswered && state.feedback) {
      const fb = state.feedback;
      
      if (q.type === 'comprehension') {
         feedbackHtml = ''; // Completely suppress bottom feedback for comprehension
      } else if (fb.isModel) {
        feedbackHtml = `<div class="card card-rule-mint bg-science-tint p-4 mt-4">
          <div class="font-bold text-sm mb-2 text-success">Worked Solution</div>
          <div class="text-sm text-main leading-relaxed">${window.formatWorkedSolution(q.worked_solution || q.model_answer)}</div>
        </div>`;
      } else if (fb.status === 'correct') {
        feedbackHtml = `<div class="card card-rule-mint bg-science-tint p-4 mt-4">
          <div class="font-bold mb-2 text-success">🎉 Spot on!</div>
          <p class="text-sm text-main leading-relaxed">${esc(fb.text)}</p>
          ${q.examiner_note ? `<p class="text-xs text-muted mt-2 italic">${esc(q.examiner_note)}</p>` : ''}
        </div>`;
      } else {
        const isPartial = fb.status === 'partial';
        const isLoad = fb.status === 'loading';
        const ruleClass = isPartial ? 'card-rule-amber' : (isLoad ? 'card-rule-mint' : 'card-rule-rose');
        const bgClass   = isPartial ? 'bg-amber-tint' : (isLoad ? 'bg-surface' : 'bg-rose-tint');
        const textClass = isPartial ? 'text-amber' : (isLoad ? 'text-main' : 'text-danger');
        
        feedbackHtml = `<div class="card ${ruleClass} ${bgClass} p-4 mt-4">
          <div class="font-bold mb-2 ${textClass}">${isLoad ? '<span class="spinner-sm inline-block mr-2 border-brand-mint"></span>' : '💡'} Miss Wena says:</div>
          <p class="text-sm text-main leading-relaxed">${fb.text}</p>
          ${fb.correctAnswer ? `<div class="mt-3 text-sm font-bold text-main">Correct Answer: <span class="text-success">${esc(fb.correctAnswer)}</span></div>` : ''}
        </div>`;
      }
    }

    const hasPartsGate = (() => { try { return (typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || [])).length > 0; } catch(e){ return false; } })();
    const isSplitFormat = q.type === 'comprehension' || q.type === 'visual_text' || (q.type === 'open_ended' && hasPartsGate);

    let actionBtn = '';
    if (!state.isAnswered) {
      if (state.feedback && state.feedback.status === 'loading') {
        if (q.type !== 'word_problem' && !isSplitFormat) {
           actionBtn = `<button class="btn btn-primary" disabled><span class="spinner-sm inline-block mr-2 border-white"></span> Grading...</button>`;
        }
      } else if (q.type === 'word_problem' || isSplitFormat) {
        // Suppress bottom button since progressive formats now use inline buttons
        actionBtn = '';
      }
      else if (q.type === 'open_ended') actionBtn = `<button class="btn btn-primary hover-lift" onclick="window.checkAnswer()">Submit for Grading</button>`;
      else if (q.type === 'cloze' || q.type === 'editing') actionBtn = `<button class="btn btn-primary hover-lift" onclick="window.checkAnswer()">Check Answers</button>`;
      else if (q.type !== 'mcq') actionBtn = `<button class="btn btn-primary hover-lift" onclick="window.checkAnswer()">Check Answer</button>`;
    } else {
      actionBtn = `<button class="btn btn-primary hover-lift" onclick="window.navQuiz(1)">${isLast ? 'Finish Lab →' : 'Next Question →'}</button>`;
    }

    let displayInstruction = esc(q.question_text);
    let isSynthesis = (q.topic || '').toLowerCase() === 'synthesis';
    
    if (q.type === 'cloze') {
      displayInstruction = 'Fill in each blank with the correct word from the Word Bank.';
    } else if (q.type === 'editing') {
      displayInstruction = 'Read the passage and correct each underlined spelling or grammatical error.';
    } else if (isSynthesis) {
      // 🚀 Inject the explicit database instructions
      displayInstruction = q.instructions ? esc(q.instructions) : 'Rewrite the given sentence(s) using the word(s) provided. Your answer must be in one sentence. The meaning of your sentence must be the same as the meaning of the given sentence(s).';
    }

    const diagramHtml = renderVisualPayload(q.visual_payload);
    
    // Expand to 1200px for Split-Screen formats, keep 680px for others
    const maxWidth = isSplitScreen ? '1200px' : '680px';
    
    app.innerHTML = `
      <div class="w-full" style="max-width: ${maxWidth}; transition: max-width 0.3s ease;">
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

          ${diagramHtml}${displayInstruction ? `<h3 class="text-xl font-bold text-main mb-6 mt-2 leading-relaxed" style="white-space:pre-line;">${displayInstruction}</h3>` : ''}

          <div class="w-full">${inputUi}</div>

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
    window.saveInputState();
    state.hintLevel++;
    render();
  };

  window.selectMcq = (idx) => {
    if (state.isAnswered) return;
    const q = state.questions[state.currentIndex];
    let safeOptions = [];
    try { safeOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []); } catch(e) {}
    
    state.answers[state.currentIndex] = safeOptions[idx];
    window.checkAnswer();
  };

  window.selectCompMcq = (pLabel, idx) => {
    if (state.isAnswered) return;
    const q = state.questions[state.currentIndex];
    let partsData = [];
    try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch(e) {}
    
    // Find the specific part data
    const partIndex = parseInt(pLabel.replace('Q', '')) - 1;
    const partData = partsData[partIndex];
    if (!partData) return;

    // Initialize object if empty
    if (!state.answers[state.currentIndex]) state.answers[state.currentIndex] = {};
    
    // Save the exact string of the option
    state.answers[state.currentIndex][pLabel] = partData.options[idx];
    render(); // Re-render to show selection
  };

  window.setMode = (mode, subKey = null) => {
    if (state.isAnswered) return;
    window.saveInputState();
    const key = subKey ? `${state.currentIndex}_${subKey}` : state.currentIndex;
    state.drawings[key] = mode === 'draw' ? 'init' : 'text';
    render();
  };

  window.saveInputState = () => {
    if (!state.questions || !state.questions[state.currentIndex]) return;
    const q = state.questions[state.currentIndex];

    const hasPartsGate = (() => { try { return (typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || [])).length > 0; } catch(e){ return false; } })();
    const isSplitFormat = q.type === 'comprehension' || q.type === 'visual_text' || (q.type === 'open_ended' && hasPartsGate);

    if (q.type === 'cloze') {
      const ans = {};
      let blanks = [];
      try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch(e) {}
      blanks.forEach(b => {
        const num = b.id || b.number;
        const el = document.getElementById(`cloze-blank-${num}`);
        if (el) ans[num] = el.value;
      });
      state.answers[state.currentIndex] = ans;
    } else if (q.type === 'editing') {
      const ans = {};
      let blanks = [];
      try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch(e) {}
      blanks.forEach(b => {
        const num = b.number || b.id;
        const el = document.getElementById(`cloze-blank-${num}`);
        if (el) ans[num] = el.value;
      });
      state.answers[state.currentIndex] = ans;
    } else if (q.type === 'word_problem' || isSplitFormat) {
      const ans = state.answers[state.currentIndex] || {};
      let parts = [];
      try { parts = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch(e) {}
      parts.forEach((p, idx) => {
        const pLabel = isSplitFormat 
            ? (p.label || `Q${idx + 1}`) 
            : (p.label || (p.part_id ? `(${p.part_id})` : `Part ${idx + 1}`));
            
        const safeIdLabel = String(pLabel).replace(/[^a-zA-Z0-9]/g, '');
        const prefix = isSplitFormat ? 'comp-' : 'wp-';

        if (q.type === 'comprehension' && p.part_type !== 'text_box' && p.part_type !== 'mcq') {
           ans[pLabel] = ans[pLabel] || {};
           if (p.part_type === 'referent') {
             (p.items || []).forEach((_, i) => {
               const el = document.getElementById(`comp-${safeIdLabel}-ref${i}`);
               if (el) ans[pLabel]['ref'+i] = el.value;
             });
           } else if (p.part_type === 'sequencing') {
             (p.items || []).forEach((_, i) => {
               const el = document.getElementById(`comp-${safeIdLabel}-seq${i}`);
               if (el) ans[pLabel]['seq'+i] = el.value;
             });
           } else if (p.part_type === 'true_false') {
             (p.items || []).forEach((_, i) => {
               const checked = document.querySelector(`input[name="comp-${safeIdLabel}-tf${i}"]:checked`);
               if (checked) ans[pLabel]['tf'+i] = checked.value;
               const el = document.getElementById(`comp-${safeIdLabel}-reason${i}`);
               if (el) ans[pLabel]['reason'+i] = el.value;
             });
           }
        } else {
           // Standard text box extraction
           const el = document.getElementById(`${prefix}${safeIdLabel}`);
           if (el && p.part_type !== 'mcq') ans[pLabel] = el.value;
        }
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

    state.activeWPPart = 0;

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

  window.checkAnswer = async () => {
    window.saveInputState();
    const q = state.questions[state.currentIndex];

    if (q.type === 'mcq') {
      const ans = state.answers[state.currentIndex];
      if (!ans) { alert('Please select an answer!'); return; }
      
      const normAns = String(ans).trim().toLowerCase();
      const normCorrect = String(q.correct_answer).trim().toLowerCase();
      const isCorrect = normAns === normCorrect;

      let safeWrongExpl = {};
      try { safeWrongExpl = typeof q.wrong_explanations === 'string' ? JSON.parse(q.wrong_explanations) : (q.wrong_explanations || {}); } catch(e) {}

      const fbText = isCorrect ? (q.worked_solution ? `Correct! ${q.worked_solution.split('\n')[0]}` : 'Perfectly executed!') : (safeWrongExpl[ans] || `The correct answer is ${q.correct_answer}.`);
        
      if (isCorrect) { state.score++; state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak; } else state.streak = 0;
      state.isAnswered = true;
      state.feedback = { status: isCorrect ? 'correct' : 'wrong', text: fbText, correctAnswer: isCorrect ? null : q.correct_answer };
      render(); return;
    }

    if (q.type === 'cloze') {
      const ans = state.answers[state.currentIndex] || {};
      let blanks = [];
      try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch(e) {}
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
      state.score += correctCount;
      if (allCorrect) { state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak; } else state.streak = 0;
      state.isAnswered = true;
      state.feedback = { status: allCorrect ? 'correct' : 'partial', text: allCorrect ? `All ${blanks.length} blanks correct!` : `${correctCount} of ${blanks.length} blanks correct. Review the highlighted answers below.`, blankResults };
      render(); return;
    }

    if (q.type === 'editing') {
      const ans = state.answers[state.currentIndex] || {};
      let blanks = [];
      try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch(e) {}
      let correctCount = 0;
      blanks.forEach(b => {
        const num = b.number || b.id;
        const userAns = (ans[num] || '').trim();
        const correctAns = b.correct_answer || b.correct_word || '';
        if (userAns.toLowerCase() === correctAns.toLowerCase()) correctCount++;
      });
      const totalBlanks = blanks.length;
      const allCorrect = totalBlanks > 0 && correctCount === totalBlanks; 
      state.score += correctCount;
      if (allCorrect) { state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak; } else state.streak = 0;
      state.isAnswered = true;
      state.feedback = { status: allCorrect ? 'correct' : 'partial', text: allCorrect ? `All ${totalBlanks} corrections right!` : `${correctCount} of ${totalBlanks} corrections correct.` };
      render(); return;
    }

    // IN window.checkAnswer()
    const isSplitScreen = q.type === 'comprehension' || q.type === 'visual_text' || (q.type === 'open_ended' && typeof q.parts === 'string' ? JSON.parse(q.parts || '[]').length > 0 : (q.parts || []).length > 0);

    if (isSplitScreen) {
      let partsData = [];
      try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch(e) {}
      const currentPart = partsData[state.activeWPPart];
      const pLabel = currentPart.label || `Q${state.activeWPPart + 1}`;
      const ans = (state.answers[state.currentIndex] || {})[pLabel] || '';

      const isAnsEmptyFast = typeof ans === 'object' ? Object.values(ans).every(v => !v) : !String(ans).trim();
      if (isAnsEmptyFast) { alert('Please provide an answer before continuing!'); return; }

      // Route A: Fast Local Grading for MCQ
      if (currentPart.part_type === 'mcq' || currentPart.part_type === 'referent') {
        const isCorrect = String(ans).trim().toLowerCase() === String(currentPart.correct_answer).trim().toLowerCase();
        
        state.score += isCorrect ? currentPart.marks : 0;
        if (isCorrect) { state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak; } else state.streak = 0;
        
        state.activeWPPart++;
        const isLast = state.activeWPPart >= partsData.length;
        if (isLast) state.isAnswered = true;
        
        state.feedback = { 
          status: isCorrect ? 'correct' : 'wrong', 
          text: isCorrect ? 'Spot on!' : (currentPart.explanation || `Correct answer: ${currentPart.correct_answer}`),
          isModel: false
        };
        render();
        return;
      }

      // Route B: If it's a text_box, fall through to the API grading block below!
    }
    
    if (q.type === 'word_problem' || q.type === 'open_ended' || q.type === 'comprehension' || q.type === 'visual_text') {
      let ans = '';
      let currentPart = null;

      if (q.type === 'word_problem' || isSplitScreen) {
        let partsData = [];
        try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch(e) {}
        currentPart = partsData[state.activeWPPart];
        const pLabel = isSplitScreen
            ? (currentPart.label || `Q${state.activeWPPart + 1}`) 
            : (currentPart.label || (currentPart.part_id ? `(${currentPart.part_id})` : `Part ${state.activeWPPart + 1}`));
        ans = (state.answers[state.currentIndex] || {})[pLabel] || '';
      } else {
        ans = state.answers[state.currentIndex] || '';
      }

      const isAnsEmptyAI = typeof ans === 'object' ? Object.values(ans).every(v => !v) : !String(ans).trim();
      if (isAnsEmptyAI) { alert('Please type your final answer so it can be graded!'); return; }

      state.feedback = { status: 'loading', text: 'Analyzing your logic...' };
      render();

      try {
        const res = await fetch('/api/grade-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: q.id, 
            questionType: q.type === 'comprehension' ? 'comprehension' : 'open_ended', // MODIFIED
            questionText: currentPart ? (currentPart.question || currentPart.instructions || currentPart.question_text || q.question_text) : q.question_text,
            subject: new URLSearchParams(window.location.search).get('subject') || 'mathematics',
            level: new URLSearchParams(window.location.search).get('level') || 'primary-4',
            studentAnswer: String(ans),
            workedSolution: currentPart ? (currentPart.worked_solution || currentPart.model_answer || currentPart.correct_answer) : (q.worked_solution || q.model_answer),
            rubric: currentPart ? currentPart.rubric : null, // NEW FOR COMPREHENSION
            keywords: q.keywords || [],
            marks: currentPart ? (currentPart.marks || 2) : (q.marks || 2)
          })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const maxM = currentPart ? (currentPart.marks || 2) : (q.marks || 2);
        const isCorrect = data.score >= maxM;
        
        state.score += data.score;
        if (isCorrect) { state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak; } else state.streak = 0;

        if (q.type === 'word_problem' || isSplitScreen) {
          let partsData = [];
          try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch(e) {}
          state.activeWPPart++;
          
          if (state.activeWPPart >= partsData.length) {
            state.isAnswered = true;
            state.feedback = { status: isCorrect ? 'correct' : 'partial', text: data.feedback + '<br><br><strong>All parts completed!</strong> Review the full model answer.', isModel: false };
          } else {
            state.feedback = { status: isCorrect ? 'correct' : 'partial', text: data.feedback + '<br><br><strong>Next part unlocked! Keep going.</strong>', isModel: false };
          }
        } else {
          state.isAnswered = true;
          state.feedback = { status: isCorrect ? 'correct' : 'partial', text: data.feedback, isModel: false };
        }
        render();
      } catch (err) {
        console.error("AI Grading Error:", err);
        if (q.type === 'word_problem' || isSplitScreen) {
          let partsData = [];
          try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch(e) {}
          state.activeWPPart++;
          if (state.activeWPPart >= partsData.length) state.isAnswered = true;
        } else { state.isAnswered = true; }
        state.feedback = { status: 'model', text: 'Miss Wena is resting. Here is the model answer.', isModel: true };
        render();
      }
      return;
    }

    // ── SHORT ANSWER ──
    const ans = String(state.answers[state.currentIndex] || '').trim();
    if (!ans) { alert('Please type your final answer in the text box below the canvas so it can be marked!'); return; }

    const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
    let safeAccept = [];
    try { safeAccept = typeof q.accept_also === 'string' ? JSON.parse(q.accept_also) : (q.accept_also || []); } catch(e) {}
    const correct = norm(ans) === norm(q.correct_answer) || safeAccept.some(a => norm(ans) === norm(a));
    const fbText = correct ? 'Excellent!' : `Expected: ${q.correct_answer}.`;
    
    if (correct) { state.score++; state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak; } else state.streak = 0;
    state.isAnswered = true;
    state.feedback = { status: correct ? 'correct' : 'wrong', text: fbText, isModel: true };
    render();
  };

  function renderResults() {
    saveQuizResult(); 
    
    // UPGRADE: Use total possible marks for percentage
    const maxScore = state.totalPossibleScore > 0 ? state.totalPossibleScore : 1;
    const pct = Math.round((state.score / maxScore) * 100);
    // Analytics: record quiz session completion
    if (window.plausible) window.plausible('Quiz Complete', { props: { score: pct, subject: new URLSearchParams(window.location.search).get('subject') || 'mixed' } });
    
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
  
  window.clearCanvas = () => {
    const canvas = document.getElementById('scratchpadCanvas');
    if (canvas) {
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      const drawKey = canvas.getAttribute('data-drawkey') || state.currentIndex;
      state.drawings[drawKey] = canvas.toDataURL();
    }
  };

  function initCanvas(qid) {
    setTimeout(() => {
      const canvas = document.getElementById('scratchpadCanvas');
      if (!canvas) return;
      
      const rect = canvas.parentElement.getBoundingClientRect();
      
      canvas.width = rect.width || canvas.parentElement.offsetWidth || 600;
      canvas.height = 300;
      
      ctx = canvas.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-dark').trim() || '#2C3E3A';

      const drawKey = canvas.getAttribute('data-drawkey') || qid;

      if (state.drawings[drawKey] && state.drawings[drawKey] !== 'init' && state.drawings[drawKey] !== 'text') {
        let img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = state.drawings[drawKey];
      }

      if (state.isAnswered) return; 

      const getPos = (e) => {
        const r = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
        return { x, y };
      };

      const start = (e) => { 
        isDrawing = true; 
        const p = getPos(e); 
        ctx.beginPath(); 
        ctx.moveTo(p.x, p.y); 
        ctx.lineTo(p.x, p.y);
        ctx.stroke(); 
        if (e.cancelable) e.preventDefault(); 
      };
      const draw = (e) => { 
        if (!isDrawing) return; 
        const p = getPos(e); 
        ctx.lineTo(p.x, p.y); 
        ctx.stroke(); 
        if (e.cancelable) e.preventDefault(); 
      };
      const stop = () => { if(isDrawing) { isDrawing = false; state.drawings[drawKey] = canvas.toDataURL(); } };

      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stop);
      canvas.addEventListener('mouseout', stop);
      canvas.addEventListener('touchstart', start, {passive: false});
      canvas.addEventListener('touchmove', draw, {passive: false});
      canvas.addEventListener('touchend', stop);
    }, 50);
  }


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
      
      const db = await window.getSupabase();
      
      let dbSubject = subject;
      if (subject === 'mathematics') dbSubject = 'Mathematics';
      if (subject === 'science') dbSubject = 'Science';
      if (subject === 'english') dbSubject = 'English Language';

      let dbLevel = levelSlug ? levelSlug.replace('primary-', 'Primary ') : null;

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
      if (topic && topic !== 'all' && topic !== 'mixed') {
         const decoded = decodeURIComponent(topic);
         const matched = MOE_TOPICS.find(t => t.toLowerCase().replace(/ /g, '-').replace(/,/g, '') === decoded);
         dbTopic = matched || decoded;
      }

      let query = db.from('question_bank').select('*').eq('subject', dbSubject);
      if (dbLevel) query = query.eq('level', dbLevel);
      if (dbTopic) query = query.eq('topic', dbTopic);

      let { data: fetchedQuestions, error } = await query.limit(1000);

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

      let pool = type && type !== 'mixed' 
        ? fetchedQuestions.filter(q => q.type === type) 
        : fetchedQuestions;

      const seenKey = `shl_seen_${state.studentId}_${dbLevel}_${dbSubject}_${dbTopic || 'all'}_${type || 'mixed'}`;
      let seenIds = [];
      try { seenIds = JSON.parse(localStorage.getItem(seenKey)) || []; } catch(e) {}

      let unseenPool = pool.filter(q => !seenIds.includes(q.id));

      if (unseenPool.length < 10 && pool.length >= 10) {
        console.log("Vault exhausted! Resetting the shuffle bag.");
        seenIds = [];
        unseenPool = [...pool];
      } else if (unseenPool.length === 0) {
        unseenPool = [...pool];
      }

      unseenPool = shuffle(unseenPool);

      // 🚀 MASTERCLASS: The Comprehension Interceptor
      if (dbSubject.toLowerCase() === 'english language' && (dbTopic || '').toLowerCase() === 'comprehension') {
        let visualQs = unseenPool.filter(q => q.type === 'visual_text');
        let textQs = unseenPool.filter(q => q.type === 'comprehension');
        
        state.questions = [];
        // Per Constraints: P3 and P4 do NOT get Visual Text in Training Lab
        const isUpperPrimary = dbLevel.includes('5') || dbLevel.includes('6');
        
        if (isUpperPrimary && visualQs.length > 0) {
          state.questions.push(visualQs[0]);
          if (textQs.length > 0) state.questions.push(textQs[0]);
        } else {
          // Fallback / Junior Primary: Load 2 Text Comprehensions
          state.questions = textQs.slice(0, 2);
        }
      } else {
        state.questions = unseenPool.slice(0, 10);
      }

      state.questions.forEach(q => seenIds.push(q.id));
      localStorage.setItem(seenKey, JSON.stringify(seenIds));
      
      state.totalPossibleScore = state.questions.reduce((sum, q) => {
        if (q.type === 'cloze') return sum + (q.blanks?.length || 1);
        if (q.type === 'editing') return sum + (q.blanks?.length || 1);
        if (q.type === 'word_problem' || q.type === 'comprehension' || q.type === 'open_ended') return sum + (q.marks || 1);
        return sum + 1;
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
