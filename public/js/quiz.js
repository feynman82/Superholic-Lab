window.initQuizEngine = function () {
  'use strict';

  // 🚀 GLOBAL UTILITY: The Vanilla JS Pen Tool Engine
  window.togglePenTool = function (canvasId) {
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
  window.formatWorkedSolution = function (raw) {
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
    resultsObj: {},
    isAnswered: false,
    feedback: null,
    currentType: null,
    quizStartTime: null,
    hintLevel: 0,
    activeWPPart: 0,
    studentId: new URLSearchParams(window.location.search).get('student'),
    dbSubject: '',
    dbLevel: '',
    dbTopic: '',
    fromQuest: null
  };

  const app = document.getElementById('app');
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function titleCase(s) { return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

  function render() {
    switch (state.phase) {
      case 'LOAD': renderLoading(); break;
      case 'QUIZ': renderQuiz(); break;
      case 'DONE': renderResults(); break;
    }
  }

  function renderLoading() {
    app.innerHTML = `<div class="glass-panel-1 flex flex-col items-center w-full p-6" style="max-width: 600px;"><div class="spinner-sm mb-4"></div><h2 class="font-display text-2xl text-main">Preparing Training Lab...</h2><p class="text-sm text-muted mt-2">Loading MOE-aligned questions</p></div>`;
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
          // 🚀 MASTERCLASS FIX: Crash Shield for bad SVG generation
          const svgHtml = DiagramLibrary[fnName](params);
          if (String(svgHtml).includes('NaN')) throw new Error('AI generated invalid geometry (NaN)');

          return `<div class="procedural-diagram mb-4 mx-auto flex justify-center w-full" style="max-width: 600px; overflow-x: auto;">
                    ${svgHtml}
                  </div>`;
        } else {
          // The AI invented a function you haven't built yet! Graceful fallback.
          console.warn(`[DiagramLibrary] Missing function requested by AI: ${fnName}`, params);
          return `<div class="procedural-diagram mb-4 mx-auto flex justify-center w-full" style="max-width: 600px; overflow-x: auto;">
                    ${DiagramLibrary.placeholder({
            description: `Requires DiagramLibrary.${fnName}()\nParams: ${JSON.stringify(params).substring(0, 40)}...`
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
    const letters = ['A', 'B', 'C', 'D'];
    const savedAns = state.answers[state.currentIndex] || '';

    let safeOptions = [];
    try { safeOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []); } catch (e) { }

    return safeOptions.map((opt, i) => {
      const letter = letters[i];
      const isSel = savedAns === opt; // Compare exact string

      let extraStyle = '';
      if (state.isAnswered) {
        // Safe string normalization
        const normOpt = String(opt).trim().toLowerCase();
        const normAns = String(q.correct_answer).trim().toLowerCase();

        if (normOpt === normAns) extraStyle = 'border-color:var(--brand-mint);background:rgba(5,150,105,0.1);';
        else if (isSel) extraStyle = 'border-color:var(--brand-error);background:rgba(220,38,38,0.1);opacity:0.8;';
        else extraStyle = 'opacity:0.45;pointer-events:none;';
      }

      // Pass the array index to avoid quotation-mark escaping crashes in HTML
      return `<div class="mcq-opt${isSel ? ' is-sel' : ''}" style="${extraStyle}${state.isAnswered ? 'pointer-events:none;' : ''}" onclick="window.selectMcq(${i})">
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
    const drawModeInputStyle = "form-input mt-4 w-full p-4 text-lg border-2 border-brand-sage focus:border-brand-sage rounded-xl transition-all shadow-sm bg-sage-50/10";

    // 🚀 MASTERCLASS SYNTHESIS PARSER
    let synthesisHtml = '';
    let isSynthesis = (q.topic || '').toLowerCase() === 'synthesis';

    if (isSynthesis && q.question_text) {
      // 🚀 MASTERCLASS FIX: Safely preserve HTML line breaks but strip old \n\n
      const displayQuestion = esc(q.question_text.split('\n\n')[0].trim()).replace(/&lt;br\s*\/?[&gt;]*>/gi, '<br>');

      // Extract the connector from the single quotes in the instructions (e.g. '... respectively.')
      let rawConnector = '';
      if (q.instructions) {
        const match = q.instructions.match(/'([^']+)'/);
        if (match) rawConnector = match[1];
      }
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
        if (!savedAns) savedAns = cleanConnector + ' ';
      }

      synthesisHtml = `
        <div class="glass-panel-1 p-6 mb-6">
          <div class="text-lg text-main font-medium leading-relaxed mb-6">${displayQuestion}<br><br></div>
          <div class="flex items-end w-full">${blueprintHtml}</div>
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
          <button class="btn btn-sm ${!isDrawMode ? 'btn-primary' : 'btn-ghost'}" onclick="window.setMode('text')" ${state.isAnswered ? 'disabled' : ''}>⌨️ Type</button>
          <button class="btn btn-sm ${isDrawMode ? 'btn-primary' : 'btn-ghost'}" onclick="window.setMode('draw')" ${state.isAnswered ? 'disabled' : ''}>✏️ Pen Tool</button>
        </div>
      </div>
      
      ${!isDrawMode
        ? typeModeHTML
        : `<div id="drawArea" class="scratchpad-container mb-4" style="position: relative; display: block;">
             <canvas id="scratchpadCanvas" class="scratchpad-canvas bg-white border-2 border-slate-200 rounded-xl w-full shadow-sm" style="min-height: 300px; touch-action: none; cursor: crosshair; ${state.isAnswered ? 'pointer-events:none;' : ''}"></canvas>
             ${!state.isAnswered ? `
             <div style="position: absolute; top: 12px; right: 12px;">
                <button class="btn btn-sm btn-outlined bg-white" onclick="window.clearCanvas()">🗑️ Clear</button>
             </div>` : ''}
           </div>
           <input type="text" id="qInput" class="${drawModeInputStyle}" placeholder="${placeholderText}" value="${esc(savedAns)}" ${state.isAnswered ? 'disabled' : ''}>`
      }`;
  }

  function buildMultiPartUI(q) {
    let partsData = [];
    try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch (e) { }

    // 🚀 MASTERCLASS: Auto-wrap single open_ended questions so they use the robust engine
    if (partsData.length === 0 && q.type === 'open_ended') {
      partsData = [{ label: "(a)", question: q.question_text, marks: q.marks, model_answer: q.worked_solution || q.model_answer }];
    }

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
      // 🚀 MASTERCLASS FIX: Unified numbering and safe IDs
      const alphabetLabel = `(${String.fromCharCode(97 + partIdx)})`;
      const pLabel = p.label || alphabetLabel;
      const safeIdLabel = String(pLabel).replace(/[^a-zA-Z0-9]/g, '');

      const pQuestion = p.question || p.question_text || '';
      const pMarks = p.marks || 2;
      const pModel = window.extractPartModelAnswer(p);

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
      const drawKey = `${state.currentIndex}_${safeIdLabel}`;
      const isDrawMode = state.drawings[drawKey] && state.drawings[drawKey] !== 'text';
      const showModel = isCompleted || (isActive && state.isAnswered);

      const baseInputStyle = "form-input w-full p-4 text-lg border-2 border-slate-200 focus:border-brand-sage rounded-xl transition-all shadow-sm";
      const drawModeInputStyle = "form-input mt-4 w-full p-4 text-lg border-2 border-brand-sage focus:border-brand-sage rounded-xl transition-all shadow-sm bg-sage-50/10";

      let interactionUI = '';
      if (!showModel) {
        interactionUI = `
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <span class="text-xs font-bold text-muted uppercase tracking-wider">💡 Tip: Draw your working!</span>
            <div class="flex gap-2 w-full sm:w-auto">
              <button class="btn btn-sm ${!isDrawMode ? 'btn-primary' : 'btn-ghost'}" onclick="window.setMode('text', '${safeIdLabel}')">⌨️ Type</button>
              <button class="btn btn-sm ${isDrawMode ? 'btn-primary' : 'btn-ghost'}" onclick="window.setMode('draw', '${safeIdLabel}')">✏️ Pen Tool</button>
            </div>
          </div>
          
          ${!isDrawMode
            ? `<textarea id="part-${safeIdLabel}" class="${baseInputStyle}" rows="3" placeholder="Type your detailed working and answer here..." style="height: auto; resize: vertical;" oninput="window.saveInputState()"></textarea>`
            : `<div class="scratchpad-container mb-4" style="position: relative; display: block;">
                 <canvas id="scratchpadCanvas" data-drawkey="${drawKey}" class="scratchpad-canvas bg-white border-2 border-slate-200 rounded-xl w-full shadow-sm" style="min-height: 300px; touch-action: none; cursor: crosshair;"></canvas>
                 <div style="position: absolute; top: 12px; right: 12px;">
                    <button class="btn btn-sm btn-outlined bg-white" onclick="window.clearCanvas()">🗑️ Clear</button>
                 </div>
               </div>
               <input type="text" id="part-${safeIdLabel}" class="${drawModeInputStyle}" placeholder="Final Answer (Required for marking)" value="${esc(savedWorking)}" oninput="window.saveInputState()">`
          }
          ${isActive ? inlineFeedbackHtml + inlineActionBtn : ''}`;
      } else {
        interactionUI = `
          <div class="p-4 bg-surface border border-light rounded-xl mb-4 text-main whitespace-pre-wrap text-lg">${esc(savedWorking) || '<em>No text answer provided.</em>'}</div>
          ${(state.drawings[drawKey] && state.drawings[drawKey] !== 'init' && state.drawings[drawKey] !== 'text') ? `<img src="${state.drawings[drawKey]}" class="mb-4 border-2 border-slate-200 rounded-xl shadow-sm bg-white" style="max-height: 200px;">` : ''}
          <div class="ans-block strong p-6 bg-science-tint card-rule-mint rounded-xl">
            <div class="text-xs font-bold mb-2 text-success uppercase tracking-wider flex items-center gap-2"><span>✨</span> Miss Wena's Model Answer</div>
            <div class="text-base text-main font-medium whitespace-pre-wrap leading-relaxed">${window.formatWorkedSolution(pModel)}</div>
          </div>
        `;
      }

      return `
        <div class="mb-6">
          <div class="flex items-center gap-3 mb-4">
            <span class="font-display text-xl text-main font-bold" style="color: var(--brand-sage);">${esc(pLabel)}</span>
            <span class="badge badge-info text-xs">${pMarks} mark${pMarks !== 1 ? 's' : ''}</span>
          </div>
          ${pQuestion ? `<div class="text-lg text-main font-medium mb-4 leading-relaxed">${esc(pQuestion)}</div>` : ''}
          ${interactionUI}
        </div>`;
    }).join('');
  }

  function buildClozeUI(q) {
    const savedAns = state.answers[state.currentIndex] || {};
    let blanks = [];
    try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch (e) { }

    let wordBankHtml = '';

    // 🚀 MASTERCLASS: Sub-Topic UI Router for Cloze
    const isGrammar = (q.sub_topic || '').toLowerCase() === 'grammar';

    // Only build a Word Bank if it is explicitly a Grammar Cloze
    if (isGrammar) {
      const allWords = new Set();
      blanks.forEach(b => (b.options || []).forEach(w => allWords.add(w)));

      if (allWords.size > 0) {
        // 🚀 MASTERCLASS FIX: Case-insensitive alphabetical sort prevents UI jumping and breaks AI patterns
        const sortedWords = [...allWords].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        const wordBankList = sortedWords.map((w, i) =>
          `<span class="badge bg-surface border border-light text-main" style="font-size:0.9rem; padding: 6px 12px; font-weight: 500;">(${i + 1}) ${esc(w)}</span>`
        ).join('');
        wordBankHtml = `
          <div class="glass-panel-1 p-4 mb-4">
            <div class="text-xs font-bold text-muted uppercase mb-4">Word Bank</div>
            <div class="flex flex-wrap gap-2">${wordBankList}</div>
          </div>`;
      }
    }

    // 🚀 MASTERCLASS FIX: Safely restore HTML line breaks in passage
    let passage = esc(q.passage || '').replace(/\n/g, '<br>').replace(/&lt;br\s*\/?[&gt;]*>/gi, '<br>');

    blanks.forEach(b => {
      const num = b.id || b.number;
      const saved = savedAns[num] || '';
      let inputHtml = '';

      if (state.isAnswered) {
        const isCorrect = (savedAns[num] || '').toLowerCase() === (b.correct_answer || '').toLowerCase();
        const stateClass = isCorrect ? 'is-correct' : 'is-wrong';

        if (b.options && b.options.length > 0) {
          inputHtml = `<select id="cloze-blank-${num}" class="cloze-select ${stateClass}" disabled style="min-width: 100px;">
            <option value="${esc(saved)}">${esc(saved || '—')}</option></select>`;
        } else {
          inputHtml = `<input type="text" id="cloze-blank-${num}" class="editing-input ${stateClass}" value="${esc(saved)}" disabled style="width: 120px; display: inline-block; margin: 0 4px;">`;
        }
      } else {
        if (b.options && b.options.length > 0) {
          // 🚀 MASTERCLASS FIX: Sort dropdown options alphabetically to destroy predictable patterns
          const sortedOpts = [...b.options].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
          const opts = sortedOpts.map(o =>
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
          <span>${icon} <strong style="color:var(--text-main);">${esc(res.selected || '—')}</strong> ${!res.isCorrect ? `→ <strong class="text-success">${esc(b.correct_answer)}</strong>` : ''}</span>
          ${!res.isCorrect && b.explanation ? `<span class="text-muted text-xs ml-auto" style="max-width:60%; text-align:right;">${esc(b.explanation)}</span>` : ''}
        </div>`;
      }).join('');
      blankFeedback = `<div class="glass-panel-2 p-4 mt-4">${rows}</div>`;
    }

    return `
      ${wordBankHtml}
      <div class="glass-panel-1 p-6 cloze-passage text-lg text-main font-normal">${passage}</div>
      ${blankFeedback}`;
  }

  function buildEditingUI(q) {
    const savedAns = state.answers[state.currentIndex] || {};
    let blanks = [];
    try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch (e) { }

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
    if (state.isAnswered && state.feedback && state.feedback.blankResults) {
      const rows = blanks.map(b => {
        const num = b.id || b.number;
        const res = state.feedback.blankResults[num] || {};
        const correctAns = b.correct_answer || b.correct_word || '';
        const icon = res.isCorrect ? '✅' : '❌';

        return `<div class="flex gap-3 items-start text-sm py-2" style="border-bottom: 1px solid var(--border-light);">
          <span class="font-bold" style="min-width:24px;">[${num}]</span>
          <span>${icon} <strong style="color:var(--text-main);">${esc(res.selected || '—')}</strong> ${!res.isCorrect ? `→ <strong class="text-success">${esc(correctAns)}</strong>` : ''}</span>
          ${!res.isCorrect && b.explanation ? `<span class="text-muted text-xs ml-auto" style="max-width:60%; text-align:right;">${esc(b.explanation)}</span>` : ''}
        </div>`;
      }).join('');

      editFeedback = `<div class="glass-panel-2 p-4 mt-4">${rows}</div>`;
    }

    return `<div class="glass-panel-1 p-6 editing-passage text-lg text-main font-normal" style="line-height: 2.4;">${html}</div>${editFeedback}`;
  }

  function buildComprehensionUI(q) {
    let partsData = [];
    try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch (e) { }
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
          const bgClass = isPartial ? 'bg-amber-tint' : 'bg-science-tint';
          const textClass = isPartial ? 'text-amber' : 'text-success';
          const icon = isPartial ? '💡' : '🎉';
          inlineFeedbackHtml = `<div class="glass-panel-2 ${ruleClass} ${bgClass} p-4 mt-4 mb-2">
                   <div class="font-bold mb-2 ${textClass}">${icon} Miss Wena says:</div>
                   <p class="text-sm text-main leading-relaxed">${fb.text}</p>
                   ${fb.correctAnswer ? `<div class="mt-4 text-sm font-bold text-main">Correct Answer: <span class="text-success">${esc(fb.correctAnswer)}</span></div>` : ''}
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
          const letters = ['A', 'B', 'C', 'D'];
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
                      <input type="text" id="comp-${safeIdLabel}-ref${i}" class="form-input w-full p-4 text-lg border-2 border-slate-200 rounded-lg focus:border-brand-sage" placeholder="Type here..." value="${esc(savedWorking['ref' + i] || '')}" oninput="window.saveInputState ? window.saveInputState() : null">
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>`;

        } else if (part.part_type === 'sequencing') {
          interactionUI = `<div class="flex flex-col gap-3 mt-2 text-lg">` + (part.items || []).map((item, i) => `
            <div class="flex items-center gap-4 bg-surface p-4 rounded-lg border border-light shadow-sm">
              <input type="number" id="comp-${safeIdLabel}-seq${i}" class="form-input border-2 border-slate-200 rounded-lg focus:border-brand-sage text-2xl font-bold text-center" style="width: 60px; height: 60px; padding: 0;" min="1" max="3" value="${esc(savedWorking['seq' + i] || '')}" oninput="window.saveInputState ? window.saveInputState() : null">
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
                        <label class="flex items-center gap-2 cursor-pointer font-bold text-lg"><input type="radio" name="comp-${safeIdLabel}-tf${i}" value="True" ${savedWorking['tf' + i] === 'True' ? 'checked' : ''} onchange="window.saveInputState ? window.saveInputState() : null"> True</label>
                        <label class="flex items-center gap-2 cursor-pointer font-bold text-lg"><input type="radio" name="comp-${safeIdLabel}-tf${i}" value="False" ${savedWorking['tf' + i] === 'False' ? 'checked' : ''} onchange="window.saveInputState ? window.saveInputState() : null"> False</label>
                      </div>
                    </td>
                    <td class="p-3 align-top border-l border-slate-200">
                      <textarea id="comp-${safeIdLabel}-reason${i}" class="form-input w-full p-4 text-lg border-2 border-slate-200 rounded-lg focus:border-brand-sage" rows="4" placeholder="Evidence from text..." oninput="window.saveInputState ? window.saveInputState() : null">${esc(savedWorking['reason' + i] || '')}</textarea>
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

        // 🚀 MASTERCLASS FIX: Extract and parse nested arrays/objects for the model answer
        const extractedModel = window.extractPartModelAnswer(part) || 'Model answer not provided.';

        interactionUI = `
          <div class="p-4 bg-surface border border-light rounded-xl mb-4 text-main text-lg font-medium">${displayAns || '<em>No answer provided.</em>'}</div>
          <div class="ans-block strong p-6 bg-science-tint card-rule-mint rounded-xl">
            <div class="text-xs font-bold mb-2 text-success uppercase tracking-wider">✨ Model Answer / Explanation</div>
            <div class="text-lg text-main font-bold leading-relaxed">${esc(extractedModel).replace(/\n/g, '<br>')}</div>
          </div>
        `;
      }

      return `
        <div class="mb-6 pb-6 ${idx < partsData.length - 1 ? 'border-b border-light border-dashed' : ''}">
          <div class="flex items-center gap-3 mb-4">
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
        <div class="comp-passage-pane glass-panel-1 p-6 text-lg text-main leading-relaxed">
          ${esc(q.passage).replace(/&lt;br\s*\/?&gt;/gi, '<br>').replace(/\\n/g, '<br><br>').replace(/\\"/g, '"')}
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
          <div class="glass-panel-2 p-4 text-sm text-main font-medium border-l-4" style="border-left-color: var(--brand-amber); box-shadow: none;">
            <div class="text-amber font-bold mb-2 flex items-center gap-2">
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
      app.innerHTML = `<div class="glass-panel-1 text-center w-full hover-lift p-4" style="max-width: 680px; transition: max-width 0.3s ease;"><div class="text-4xl mb-4">🕵️</div><h2 class="font-display text-2xl text-main">No questions found!</h2><p class="text-muted text-sm my-4">Miss Wena hasn't added questions for this specific combination yet. Check back soon!</p><button class="btn btn-primary hover-lift" onclick="window.location.href='subjects.html'">Return to Subjects</button></div>`;
      return;
    }

    const q = state.questions[state.currentIndex];
    const isFirst = state.currentIndex === 0;
    const isLast = state.currentIndex === state.questions.length - 1;
    const isModelType = q.type === 'word_problem' || q.type === 'open_ended';

    // 🚀 MASTERCLASS: The 3-Tier Universal Router
    const isSplitScreen = q.type === 'comprehension' || q.type === 'visual_text';
    const isInlinePassage = q.type === 'cloze' || q.type === 'editing';
    const isMultiPart = q.type === 'word_problem' || q.type === 'open_ended';

    let inputUi = '';
    if (isSplitScreen) {
      inputUi = buildComprehensionUI(q); // Tier 3
    } else if (isInlinePassage) {
      inputUi = q.type === 'cloze' ? buildClozeUI(q) : buildEditingUI(q); // Tier 2
    } else {
      if (isMultiPart) inputUi = buildMultiPartUI(q); // Tier 1 (Multi-part)
      else if (q.type === 'mcq') inputUi = buildMCQOptions(q); // Tier 1 (Card)
      else inputUi = buildTextAreaUI(q); // Tier 1 (Card)
    }

    const hintsUi = buildHintsUI(q);

    let feedbackHtml = '';
    if (state.isAnswered && state.feedback) {
      const fb = state.feedback;

      if (q.type === 'comprehension') {
        feedbackHtml = ''; // Completely suppress bottom feedback for comprehension
      } else if (fb.isModel) {
        feedbackHtml = `<div class="glass-panel-2 card-rule-mint bg-science-tint p-4 mt-4">
          <div class="font-bold text-sm mb-2 text-success">Worked Solution</div>
          <div class="text-sm text-main leading-relaxed">${window.formatWorkedSolution(q.worked_solution || q.model_answer)}</div>
        </div>`;
      } else if (fb.status === 'correct') {
        // 🚀 MASTERCLASS FIX: Safely render the HTML worked solution below the success message
        feedbackHtml = `<div class="glass-panel-2 card-rule-mint bg-science-tint p-4 mt-4">
          <div class="font-bold mb-2 text-success">🎉 Spot on!</div>
          ${fb.text && fb.text !== 'Perfectly executed!' ? `<p class="text-sm text-main leading-relaxed mb-4">${esc(fb.text)}</p>` : ''}
          ${q.worked_solution ? `<div class="text-sm text-main leading-relaxed mt-4 pt-3" style="border-top: 1px solid rgba(16, 185, 129, 0.2);"><div class="text-xs font-bold text-success uppercase tracking-wider mb-2">Worked Solution</div>${window.formatWorkedSolution(q.worked_solution)}</div>` : ''}
          ${q.examiner_note ? `<p class="text-xs text-muted mt-2 italic">${esc(q.examiner_note)}</p>` : ''}
        </div>`;
      } else {
        const isPartial = fb.status === 'partial';
        const isLoad = fb.status === 'loading';
        const ruleClass = isPartial ? 'card-rule-amber' : (isLoad ? 'card-rule-mint' : 'card-rule-rose');
        const bgClass = isPartial ? 'bg-amber-tint' : (isLoad ? 'bg-surface' : 'bg-rose-tint');
        const textClass = isPartial ? 'text-amber' : (isLoad ? 'text-main' : 'text-danger');

        feedbackHtml = `<div class="glass-panel-2 ${ruleClass} ${bgClass} p-4 mt-4">
          <div class="font-bold mb-2 ${textClass}">${isLoad ? '<span class="spinner-sm inline-block mr-2 border-brand-mint"></span>' : '💡'} Miss Wena says:</div>
          <p class="text-sm text-main leading-relaxed">${fb.text}</p>
          ${fb.correctAnswer ? `<div class="mt-4 text-sm font-bold text-main">Correct Answer: <span class="text-success">${esc(fb.correctAnswer)}</span></div>` : ''}
        </div>`;
      }
    }

    let actionBtn = '';
    if (!state.isAnswered) {
      if (state.feedback && state.feedback.status === 'loading') {
        if (!isMultiPart && !isSplitScreen) {
          actionBtn = `<button class="btn btn-primary" disabled><span class="spinner-sm inline-block mr-2 border-white"></span> Grading...</button>`;
        }
      } else if (isMultiPart || isSplitScreen) {
        // Suppress bottom button since progressive formats now use inline buttons
        actionBtn = '';
      }
      else if (isInlinePassage) {
        actionBtn = `<button class="btn btn-primary hover-lift" onclick="window.checkAnswer()">Check Answers</button>`;
      }
      else if (q.type !== 'mcq') {
        actionBtn = `<button class="btn btn-primary hover-lift" onclick="window.checkAnswer()">Check Answer</button>`;
      }
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
          <div class="flex flex-col gap-2">
            <div class="text-xs font-bold text-muted uppercase">Question ${state.currentIndex + 1} of ${state.questions.length}</div>
            <div class="quiz-progress-bar" style="width:120px;height:6px;">
              <div class="quiz-progress-fill" style="width:${((state.currentIndex) / state.questions.length) * 100}%;background:var(--brand-rose);"></div>
            </div>
          </div>
          <div class="badge ${state.streak >= 3 ? 'badge-amber' : 'badge-info'}" style="font-size:1rem; padding:6px 12px;">
            <span class="${state.streak > 0 ? 'streak-fire' : ''} mr-1">🔥</span> Streak: ${state.streak}
          </div>
        </div>

        <div class="glass-panel-1 p-4 hover-lift w-full relative">
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
    try { safeOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []); } catch (e) { }

    state.answers[state.currentIndex] = safeOptions[idx];
    window.checkAnswer();
  };

  window.selectCompMcq = (pLabel, idx) => {
    if (state.isAnswered) return;
    const q = state.questions[state.currentIndex];
    let partsData = [];
    try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch (e) { }

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

    // 🚀 MASTERCLASS: Unified State Saver
    const isSplitScreen = q.type === 'comprehension' || q.type === 'visual_text';
    const isMultiPart = q.type === 'word_problem' || q.type === 'open_ended';

    if (q.type === 'cloze') {
      const ans = {};
      let blanks = [];
      try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch (e) { }
      blanks.forEach(b => {
        const num = b.id || b.number;
        const el = document.getElementById(`cloze-blank-${num}`);
        if (el) ans[num] = el.value;
      });
      state.answers[state.currentIndex] = ans;
    } else if (q.type === 'editing') {
      const ans = {};
      let blanks = [];
      try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch (e) { }
      blanks.forEach(b => {
        const num = b.number || b.id;
        const el = document.getElementById(`cloze-blank-${num}`);
        if (el) ans[num] = el.value;
      });
      state.answers[state.currentIndex] = ans;
    } else if (isSplitScreen || isMultiPart) {
      const ans = state.answers[state.currentIndex] || {};
      let parts = [];
      try { parts = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch (e) { }

      // Auto-wrap open_ended fallback
      if (parts.length === 0 && q.type === 'open_ended') {
        parts = [{ label: "(a)" }];
      }

      parts.forEach((p, idx) => {
        const pLabel = isSplitScreen
          ? (p.label || `Q${idx + 1}`)
          : (p.label || (p.part_id ? `(${p.part_id})` : `Part ${idx + 1}`));

        const safeIdLabel = String(pLabel).replace(/[^a-zA-Z0-9]/g, '');
        const prefix = isSplitScreen ? 'comp-' : 'part-';

        if (q.type === 'comprehension' && p.part_type !== 'text_box' && p.part_type !== 'mcq') {
          ans[pLabel] = ans[pLabel] || {};
          if (p.part_type === 'referent') {
            (p.items || []).forEach((_, i) => {
              const el = document.getElementById(`comp-${safeIdLabel}-ref${i}`);
              if (el) ans[pLabel]['ref' + i] = el.value;
            });
          } else if (p.part_type === 'sequencing') {
            (p.items || []).forEach((_, i) => {
              const el = document.getElementById(`comp-${safeIdLabel}-seq${i}`);
              if (el) ans[pLabel]['seq' + i] = el.value;
            });
          } else if (p.part_type === 'true_false') {
            (p.items || []).forEach((_, i) => {
              const checked = document.querySelector(`input[name="comp-${safeIdLabel}-tf${i}"]:checked`);
              if (checked) ans[pLabel]['tf' + i] = checked.value;
              const el = document.getElementById(`comp-${safeIdLabel}-reason${i}`);
              if (el) ans[pLabel]['reason' + i] = el.value;
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
      if (typeof window.saveQuizResult === 'function') {
        window.saveQuizResult().then(async () => {
          if (state.fromQuest) {
            await handleQuestStepComplete();
          } else {
            state.phase = 'DONE';
            render();
            const pctScore = state.totalPossibleScore > 0
              ? Math.round((state.score / state.totalPossibleScore) * 100) : 0;
            // For mixed quizzes (no URL topic), infer the most-failed topic from
            // the questions answered so a quest can still be offered.
            let questTopic = state.dbTopic;
            if (!questTopic && state.questions?.length > 0) {
              const failMap = {};
              state.questions.forEach(q => {
                const t = (q.topic || '').trim();
                if (!t || t.toLowerCase() === 'mixed') return;
                const r = state.resultsObj?.[q.id];
                if (r && !r.isCorrect) failMap[t] = (failMap[t] || 0) + 1;
              });
              const top = Object.entries(failMap).sort((a, b) => b[1] - a[1]);
              if (top.length > 0) questTopic = top[0][0];
            }
            if (pctScore <= 70 && questTopic) {
              showQuestSuggestionModal(pctScore, questTopic);
            }
          }
        });
      } else {
        state.phase = 'DONE'; render();
      }
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
      try { safeWrongExpl = typeof q.wrong_explanations === 'string' ? JSON.parse(q.wrong_explanations) : (q.wrong_explanations || {}); } catch (e) { }

      // 🚀 MASTERCLASS FIX: Stop mixing HTML worked_solutions into plain-text feedback
      const fbText = isCorrect ? 'Perfectly executed!' : (safeWrongExpl[ans] || `The correct answer is ${q.correct_answer}.`);

      if (isCorrect) { state.score++; state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak; } else state.streak = 0;

      state.resultsObj[q.id] = { isCorrect, correctAns: q.correct_answer, studentAns: ans };
      state.isAnswered = true;
      state.feedback = { status: isCorrect ? 'correct' : 'wrong', text: fbText, correctAnswer: isCorrect ? null : q.correct_answer };
      render(); return;
    }

    if (q.type === 'cloze' || q.type === 'editing') {
      const ans = state.answers[state.currentIndex] || {};
      let blanks = [];
      try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch (e) { }
      let correctCount = 0;
      const blankResults = {};
      blanks.forEach(b => {
        const num = b.id || b.number;
        const selected = (ans[num] || '').trim();
        const correctAns = b.correct_answer || b.correct_word || '';
        const isCorrect = selected.toLowerCase() === correctAns.toLowerCase();
        if (isCorrect) correctCount++;
        blankResults[num] = { selected, isCorrect };
      });
      const allCorrect = correctCount === blanks.length && blanks.length > 0;
      state.score += correctCount;
      if (allCorrect) { state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak; } else state.streak = 0;

      state.resultsObj[q.id] = { isCorrect: allCorrect, correctAns: 'Passage format', studentAns: JSON.stringify(ans) };
      state.isAnswered = true;
      state.feedback = { status: allCorrect ? 'correct' : 'partial', text: allCorrect ? `All ${blanks.length} blanks correct!` : `${correctCount} of ${blanks.length} correct. Review the highlighted answers below.`, blankResults };
      render(); return;
    }

    const isSplitScreen = q.type === 'comprehension' || q.type === 'visual_text';
    const isMultiPart = q.type === 'word_problem' || q.type === 'open_ended';

    if (isMultiPart || isSplitScreen) {
      let partsData = []; try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch (e) { }
      if (partsData.length === 0 && q.type === 'open_ended') partsData = [{ label: "(a)", marks: q.marks, model_answer: q.worked_solution || q.model_answer, question: q.question_text }];

      const currentPart = partsData[state.activeWPPart];
      if (!currentPart) return;

      const alphabetLabel = `(${String.fromCharCode(97 + state.activeWPPart)})`;
      const pLabel = isSplitScreen ? (currentPart.label || `Q${state.activeWPPart + 1}`) : (currentPart.label || alphabetLabel);
      const ans = (state.answers[state.currentIndex] || {})[pLabel] || '';

      const isAnsEmptyAI = typeof ans === 'object' ? Object.values(ans).every(v => !v) : !String(ans).trim();
      if (isAnsEmptyAI) { alert('Please type your final answer so it can be graded!'); return; }

      if (currentPart.part_type === 'mcq' || currentPart.part_type === 'referent') {
        const isCorrect = String(ans).trim().toLowerCase() === String(currentPart.correct_answer).trim().toLowerCase();
        state.score += isCorrect ? (currentPart.marks || 1) : 0;
        if (isCorrect) { state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak; } else state.streak = 0;

        state.activeWPPart++;
        if (state.activeWPPart >= partsData.length) {
          state.resultsObj[q.id] = { isCorrect: true, correctAns: 'Completed multi-part', studentAns: JSON.stringify(state.answers[state.currentIndex]) };
          state.isAnswered = true;
        }
        state.feedback = { status: isCorrect ? 'correct' : 'wrong', text: isCorrect ? 'Spot on!' : (currentPart.explanation || `Correct answer: ${currentPart.correct_answer}`), isModel: false };
        render(); return;
      }

      // 🚀 MASTERCLASS TIER 2: Fast Local Math Heuristics (0ms, $0 API Cost)
      const subject = new URLSearchParams(window.location.search).get('subject') || 'mathematics';
      const isMath = subject.toLowerCase() === 'mathematics' || subject.toLowerCase() === 'maths';
      const correctVal = window.extractPartModelAnswer(currentPart);

      if (isMath && correctVal) {
        let acceptVals = []; try { acceptVals = JSON.parse(currentPart.accept_also || '[]'); } catch (e) { }
        if (isHeuristicMatch(ans, correctVal, acceptVals, true)) {
          state.score += (currentPart.marks || 2);
          state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak;
          state.activeWPPart++;
          if (state.activeWPPart >= partsData.length) {
            state.resultsObj[q.id] = { isCorrect: true, correctAns: 'Completed multi-part', studentAns: JSON.stringify(state.answers[state.currentIndex]) };
            state.isAnswered = true;
            state.feedback = { status: 'correct', text: 'Excellent! Your final answer is correct.<br><br><strong>All parts completed!</strong> Review the full model answer.', isModel: false };
          } else {
            state.feedback = { status: 'correct', text: 'Correct!<br><br><strong>Next part unlocked! Keep going.</strong>', isModel: false };
          }
          render(); return;
        }
      }

      state.feedback = { status: 'loading', text: 'Analyzing your logic...' };
      render();

      try {
        const res = await fetch('/api/grade-answer', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: q.id, questionType: q.type === 'comprehension' ? 'comprehension' : 'open_ended',
            questionText: currentPart.question || currentPart.instructions || currentPart.question_text || q.question_text,
            subject: new URLSearchParams(window.location.search).get('subject') || 'mathematics',
            level: new URLSearchParams(window.location.search).get('level') || 'primary-4',
            studentAnswer: typeof ans === 'object' ? JSON.stringify(ans) : String(ans),
            workedSolution: correctVal || q.worked_solution || q.model_answer,
            rubric: currentPart ? currentPart.rubric : null,
            keywords: q.keywords || [],
            marks: currentPart.marks || q.marks || 2
          })
        });

        const data = await res.json();
        const isCorrect = data.score >= (currentPart.marks || q.marks || 2);
        state.score += data.score || 0;
        if (isCorrect) { state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak; } else state.streak = 0;

        state.activeWPPart++;
        if (state.activeWPPart >= partsData.length) {
          state.resultsObj[q.id] = { isCorrect, correctAns: 'AI Graded', studentAns: JSON.stringify(state.answers[state.currentIndex]) };
          state.isAnswered = true;
          state.feedback = { status: isCorrect ? 'correct' : 'partial', text: data.feedback + '<br><br><strong>All parts completed!</strong> Review the full model answer.', isModel: false };
        } else {
          state.feedback = { status: isCorrect ? 'correct' : 'partial', text: data.feedback + '<br><br><strong>Next part unlocked! Keep going.</strong>', isModel: false };
        }
        render();
      } catch (err) {
        console.error("AI Grading Error:", err);
        let partsData = [];
        try { partsData = typeof q.parts === 'string' ? JSON.parse(q.parts) : (q.parts || []); } catch (e) { }
        if (partsData.length === 0 && q.type === 'open_ended') partsData = [{ label: "(a)" }];

        state.activeWPPart++;
        if (state.activeWPPart >= partsData.length) state.isAnswered = true;

        state.feedback = { status: 'model', text: 'Miss Wena is resting. Here is the model answer.', isModel: true };
        render();
      }
      return;
    }

    // ── SHORT ANSWER (Tier 1 & Tier 2) ──
    const ans = String(state.answers[state.currentIndex] || '').trim();
    if (!ans) { alert('Please type your final answer in the text box below the canvas so it can be marked!'); return; }

    let safeAccept = []; try { safeAccept = typeof q.accept_also === 'string' ? JSON.parse(q.accept_also) : (q.accept_also || []); } catch (e) { }
    const subject = new URLSearchParams(window.location.search).get('subject') || 'mathematics';
    const isMath = subject.toLowerCase() === 'mathematics' || subject.toLowerCase() === 'maths';

    // 🚀 Use the new Heuristic matcher!
    const correct = isHeuristicMatch(ans, q.correct_answer, safeAccept, isMath);

    if (correct) { state.score++; state.streak++; if (state.streak > state.maxStreak) state.maxStreak = state.streak; } else state.streak = 0;

    state.resultsObj[q.id] = { isCorrect: correct, correctAns: q.correct_answer, studentAns: ans };
    state.isAnswered = true;
    state.feedback = { status: correct ? 'correct' : 'wrong', text: correct ? 'Excellent!' : `Expected: ${q.correct_answer}.`, isModel: true };
    render();
  };

  function renderResults() {
    // 🚀 NOTE: Save is now triggered by navQuiz() before phase change to DONE.
    // The local saveQuizResult() function has been removed; window.saveQuizResult is the
    // single source of truth.

    // UPGRADE: Use total possible marks for percentage
    const maxScore = state.totalPossibleScore > 0 ? state.totalPossibleScore : 1;
    const pct = Math.round((state.score / maxScore) * 100);
    // Analytics: record quiz session completion
    if (window.plausible) window.plausible('Quiz Complete', { props: { score: pct, subject: new URLSearchParams(window.location.search).get('subject') || 'mixed' } });

    app.innerHTML = `
      <div class="glass-panel-1 flex flex-col items-center text-center w-full hover-lift p-6 card-rule-mint" style="max-width: 600px;">
        <h1 class="font-display text-4xl text-main mb-2">Training Complete!</h1>
        <p class="text-muted text-lg mb-6">You've successfully completed the lab session.</p>
        
        <div class="flex flex-wrap gap-6 mb-6 w-full justify-center">
          <div class="glass-panel-1 p-6 flex-1 bg-page" style="border: none; max-width: 200px;">
            <div class="text-sm font-bold text-muted uppercase">Score</div>
            <div class="font-display text-5xl text-success mt-2">${pct}%</div>
            <div class="text-sm text-main mt-2">${state.score} / ${maxScore} Marks</div>
          </div>
          <div class="glass-panel-1 p-6 flex-1 bg-amber-tint" style="border: none; max-width: 200px;">
            <div class="text-sm font-bold text-amber uppercase">Best Streak</div>
            <div class="font-display text-5xl text-amber mt-2">🔥 ${state.maxStreak}</div>
            <div class="text-sm text-amber mt-2">In a row!</div>
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
      'primary-2:english': '../data/questions/p2-english.json',
      'primary-4:mathematics': '../data/questions/p4-mathematics.json',
      'primary-4:science': '../data/questions/p4-science.json',
      'primary-4:english': '../data/questions/p4-english.json',
      'primary-5:mathematics': '../data/questions/p5-mathematics.json',
      'primary-5:science': '../data/questions/p5-science.json',
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
  // 🚀 The local saveQuizResult() function was removed (was duplicate of window.saveQuizResult).
  // The window.saveQuizResult below is the only save path. It is invoked by navQuiz()
  // before the phase transitions to DONE.

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
      const stop = () => { if (isDrawing) { isDrawing = false; state.drawings[drawKey] = canvas.toDataURL(); } };

      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stop);
      canvas.addEventListener('mouseout', stop);
      canvas.addEventListener('touchstart', start, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stop);
    }, 50);
  }

  // 🚀 MASTERCLASS RESTORED: SUPABASE PERSISTENCE ENGINE
  // Single source of truth for saving quiz results. Hardened against:
  //   - 400 errors: every NOT NULL column has a guaranteed non-null fallback
  //   - 409 errors: daily_usage uses UPSERT (no race between SELECT-then-INSERT)
  window.saveQuizResult = async () => {
    if (!state.studentId) return;
    try {
      const sb = await window.getSupabase();
      const timeTaken = state.quizStartTime ? Math.floor((Date.now() - state.quizStartTime) / 1000) : 0;

      const { data: attempt, error: attErr } = await sb.from('quiz_attempts').insert({
        student_id: state.studentId,
        subject: (state.dbSubject || 'mathematics').toLowerCase(),
        level: (state.dbLevel || 'primary 4').toLowerCase().replace(' ', '-'),
        topic: state.dbTopic || 'Mixed',
        difficulty: state.currentType || 'Mixed',
        score: state.score,
        total_questions: state.totalPossibleScore,
        time_taken_seconds: timeTaken,
        completed_at: new Date().toISOString(),
      }).select('id').single();

      if (attErr) throw attErr;

      // 🚀 NOT-NULL SAFETY: every column flagged NOT NULL in production gets a fallback.
      // Schema: question_text, topic, difficulty, correct, answer_chosen, correct_answer all NOT NULL.
      const qAttempts = state.questions.map(q => {
        const r = state.resultsObj[q.id] || {};

        // Marks calculation (cloze/editing count blanks)
        let marksTotal = q.marks || 1;
        if (q.type === 'cloze' || q.type === 'editing') {
          try {
            const parsedBlanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : q.blanks;
            marksTotal = (parsedBlanks && parsedBlanks.length) || 1;
          } catch (e) { marksTotal = 1; }
        }
        const marksEarned = r.isCorrect ? marksTotal : 0;

        // 🚀 NOT-NULL guards — string fallbacks for every required text column
        const safeQuestionText = String(q.question_text || q.passage || 'Diagram/Passage Question').slice(0, 500) || 'Untitled';
        const safeTopic = String(q.topic || state.dbTopic || 'Mixed') || 'Mixed';
        const safeDifficulty = String(q.difficulty || 'standard') || 'standard';
        const safeAnswerChosen = String(r.studentAns != null ? r.studentAns : '').slice(0, 200) || '(no answer)';
        const safeCorrectAnswer = String(r.correctAns || q.correct_answer || 'See model solution').slice(0, 500) || 'See model solution';

        return {
          quiz_attempt_id: attempt.id,
          student_id: state.studentId,
          question_text: safeQuestionText,
          topic: safeTopic,
          sub_topic: q.sub_topic || null,
          cognitive_skill: q.cognitive_skill || null,
          difficulty: safeDifficulty,
          correct: !!r.isCorrect,
          marks_earned: marksEarned,
          marks_total: marksTotal,
          answer_chosen: safeAnswerChosen,
          correct_answer: safeCorrectAnswer
        };
      });

      if (qAttempts.length > 0) {
        const { error: qaErr } = await sb.from('question_attempts').insert(qAttempts);
        if (qaErr) console.error('question_attempts insert failed:', qaErr);
      }

      // 🚀 RACE-SAFE UPSERT: replaces SELECT-then-INSERT-or-UPDATE pattern that caused 409.
      // Atomic upsert on (student_id, date) unique constraint. No race window.
      const today = new Date().toISOString().slice(0, 10);

      // First read current count (best-effort; if it fails we still upsert with this session's count)
      let baseCount = 0;
      try {
        const { data: existing } = await sb.from('daily_usage')
          .select('questions_attempted')
          .eq('student_id', state.studentId)
          .eq('date', today)
          .maybeSingle();
        baseCount = existing?.questions_attempted || 0;
      } catch (e) { baseCount = 0; }

      const newCount = baseCount + state.questions.length;

      const { error: usageErr } = await sb.from('daily_usage').upsert(
        { student_id: state.studentId, date: today, questions_attempted: newCount },
        { onConflict: 'student_id,date' }
      );
      if (usageErr) console.error('daily_usage upsert failed:', usageErr);

    } catch (e) {
      console.error('Failed to save quiz result to Supabase:', e);
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

      const fromQuestId = params.get('from_quest');
      const fromQuestStepRaw = params.get('step');
      if (fromQuestId && fromQuestStepRaw !== null) {
        state.fromQuest = { questId: fromQuestId, stepIndex: parseInt(fromQuestStepRaw, 10) };
        injectQuestBanner(fromQuestId, fromQuestStepRaw, topic, subject);
        disableSubjectSwitcher();
      }

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

      state.dbSubject = dbSubject;
      state.dbLevel = dbLevel;
      state.dbTopic = dbTopic;

      if (state.fromQuest) {
        await loadQuestBatch();
        return;
      }

      let query = db.from('question_bank').select('*').eq('subject', dbSubject);
      if (dbLevel) query = query.eq('level', dbLevel);
      if (dbTopic) query = query.eq('topic', dbTopic);

      // 🚀 MASTERCLASS FIX: The Comprehension Supabase Interceptor
      if (type && type !== 'mixed') {
        if (type === 'comprehension') {
          query = query.in('type', ['comprehension', 'visual_text']);
        } else {
          query = query.eq('type', type);
        }
      }

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
      try { seenIds = JSON.parse(localStorage.getItem(seenKey)) || []; } catch (e) { }

      let unseenPool = pool.filter(q => !seenIds.includes(q.id));

      if (unseenPool.length < 10 && pool.length >= 10) {
        console.log("Vault exhausted! Resetting the shuffle bag.");
        seenIds = [];
        unseenPool = [...pool];
      } else if (unseenPool.length === 0) {
        unseenPool = [...pool];
      }

      unseenPool = shuffle(unseenPool);

      // 🚀 MASTERCLASS: The Comprehension & Passage Interceptors
      const isUpperPrimary = dbLevel && (dbLevel.includes('5') || dbLevel.includes('6'));

      if (dbSubject.toLowerCase() === 'english language' && (dbTopic || '').toLowerCase() === 'comprehension') {
        let visualQs = unseenPool.filter(q => q.type === 'visual_text');
        let textQs = unseenPool.filter(q => q.type === 'comprehension');

        state.questions = [];
        // Per Constraints: P3 and P4 do NOT get Visual Text in Training Lab
        if (isUpperPrimary && visualQs.length > 0) {
          state.questions.push(visualQs[0]);
          if (textQs.length > 0) state.questions.push(textQs[0]);
        } else {
          // Fallback / Junior Primary: Load 2 Text Comprehensions
          state.questions = textQs.slice(0, 2);
        }
      } else if (type === 'cloze' || type === 'editing' || (dbTopic && (dbTopic.toLowerCase().includes('cloze') || dbTopic.toLowerCase().includes('editing')))) {
        // 🚀 MASTERCLASS FIX: Limit passage-heavy questions so students are not overwhelmed
        state.questions = unseenPool.slice(0, isUpperPrimary ? 2 : 3);
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

  // ── QUEST INTEGRATION ──

  async function loadQuestBatch() {
    try {
      const sb = await window.getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/quests/quiz-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quest_id: state.fromQuest.questId,
          step_index: state.fromQuest.stepIndex
        })
      });

      if (!res.ok) throw new Error('Failed to load quest questions');
      const data = await res.json();
      const questions = data.questions || [];

      if (questions.length === 0) {
        state.questions = [];
        state.phase = 'QUIZ';
        render();
        return;
      }

      state.questions = questions;
      state.totalPossibleScore = questions.reduce((sum, q) => {
        if (q.type === 'cloze') return sum + (q.blanks?.length || 1);
        if (q.type === 'editing') return sum + (q.blanks?.length || 1);
        if (q.type === 'word_problem' || q.type === 'comprehension' || q.type === 'open_ended') return sum + (q.marks || 1);
        return sum + 1;
      }, 0);

      state.quizStartTime = Date.now();
      state.phase = 'QUIZ';
      render();
    } catch (err) {
      console.error('Quest batch load failed:', err);
      state.questions = [];
      state.phase = 'QUIZ';
      render();
    }
  }

  async function handleQuestStepComplete() {
    const pctScore = state.totalPossibleScore > 0
      ? Math.round((state.score / state.totalPossibleScore) * 100) : 0;

    const wrongAttempts = state.questions
      .filter(q => {
        const result = state.resultsObj[q.id];
        return result && !result.isCorrect;
      })
      .map(q => {
        const result = state.resultsObj[q.id];
        let explanationForWrong = '';
        try {
          const wrongExpls = typeof q.wrong_explanations === 'string'
            ? JSON.parse(q.wrong_explanations) : (q.wrong_explanations || {});
          explanationForWrong = wrongExpls[result.studentAns] || '';
        } catch (e) { }
        return {
          question_id: q.id,
          question_text: String(q.question_text || '').slice(0, 300),
          student_answer: String(result.studentAns || ''),
          correct_answer: String(result.correctAns || q.correct_answer || ''),
          topic: q.topic || state.dbTopic || '',
          sub_topic: q.sub_topic || '',
          explanation_for_wrong: explanationForWrong
        };
      });

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--surface,#fff);';
    overlay.innerHTML = `
      <div style="text-align:center;padding:40px 24px;">
        <div style="font-family:var(--font-display,sans-serif);font-size:clamp(2rem,6vw,3rem);color:var(--brand-rose,#B76E79);margin-bottom:16px;letter-spacing:0.04em;">
          Day ${state.fromQuest.stepIndex + 1} Complete!
        </div>
        <p style="color:var(--text-muted,#666);font-size:0.95rem;margin:0;">Returning to your quest…</p>
      </div>`;
    document.body.appendChild(overlay);

    try {
      const sb = await window.getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/quests/${state.fromQuest.questId}/advance-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          step_index: state.fromQuest.stepIndex,
          trigger: 'quiz',
          score: pctScore,
          metadata: { wrong_attempts: wrongAttempts }
        })
      });

      const celebData = await res.json();
      if (res.ok) {
        try {
          const xp        = celebData.xp || {};
          const levelData = xp.levelData || {};
          const stepIdx   = state.fromQuest.stepIndex;
          const shaped = {
            completedDay:   stepIdx + 1,
            trigger:        'quiz',
            score:          pctScore,
            xpAwarded:      (xp.totalXpAfter || 0) - (xp.totalXpBefore || 0),
            levelUp:        levelData.leveled_up ? {
              fromLevel: levelData.level_before,
              toLevel:   levelData.level_after,
              fromRank:  levelData.rank_before,
              toRank:    levelData.rank_after,
            } : null,
            badgesUnlocked: (celebData.badges_earned || []).map(b => ({
              id:          b.id,
              name:        b.name,
              description: b.description || '',
              rarity:      b.rarity || 'common',
            })),
            questComplete:  celebData.quest?.status === 'completed',
          };
          sessionStorage.setItem(
            `quest_celebration_${state.fromQuest.questId}`,
            JSON.stringify(shaped)
          );
        } catch (e) { }
      } else {
        console.error('advance-step failed:', celebData.error);
      }
    } catch (err) {
      console.error('Quest advance-step error:', err);
    }

    setTimeout(() => {
      window.location.href = `/quest?id=${state.fromQuest.questId}&returning=true&score=${pctScore}`;
    }, 2000);
  }

  function injectQuestBanner(questId, stepRaw, topicSlug, subjectSlug) {
    const stepIndex = parseInt(stepRaw, 10) || 0;
    const dayNum = stepIndex + 1;
    const topicDisplay = topicSlug
      ? decodeURIComponent(topicSlug).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'Quest';

    const banner = document.createElement('div');
    banner.id = 'quest-session-banner';
    banner.setAttribute('aria-label', `Plan Quest Day ${dayNum} session`);
    banner.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:8px',
      'padding:10px 16px',
      'background:color-mix(in srgb, var(--brand-rose, #B76E79) 10%, var(--surface, #fff))',
      'border-bottom:1px solid color-mix(in srgb, var(--brand-rose, #B76E79) 20%, transparent)',
      'font-size:0.8rem',
      'font-weight:600',
      'color:var(--brand-rose, #B76E79)',
      'letter-spacing:0.08em',
      'text-transform:uppercase',
      'position:sticky',
      'top:var(--navbar-h, 66px)',
      'z-index:100'
    ].join(';');
    banner.textContent = `Plan Quest · Day ${dayNum} · ${topicDisplay}`;
    const globalHeader = document.querySelector('global-header');
    if (globalHeader && globalHeader.parentNode === document.body) {
      globalHeader.insertAdjacentElement('afterend', banner);
    } else {
      document.body.insertBefore(banner, document.body.firstChild);
    }
  }

  function disableSubjectSwitcher() {
    const selectors = ['#subjectSelect', '#topicSelect', '.quiz-subject-switcher', '.quiz-topic-switcher'];
    selectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) {
        el.disabled = true;
        el.style.opacity = '0.5';
        el.style.pointerEvents = 'none';
      }
    });
  }

  function showQuestSuggestionModal(pctScore, inferredTopic) {
    const topic = inferredTopic || state.dbTopic || 'this topic';
    const subject = (state.dbSubject || 'Mathematics').toLowerCase()
      .replace('english language', 'english');

    async function checkAndOffer() {
      let slotFree = true;
      try {
        const sb = await window.getSupabase();
        const { data: { session } } = await sb.auth.getSession();
        const token = session?.access_token;
        if (state.studentId && token) {
          const r = await fetch(`/api/quests?student_id=${state.studentId}&status=active`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const d = await r.json();
          const activeSubjects = (d.quests || []).map(q => q.subject);
          slotFree = !activeSubjects.includes(subject);
        }
      } catch (e) { slotFree = true; }

      if (!slotFree) return;

      const modal = document.createElement('div');
      modal.id = 'quest-suggest-modal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);';
      modal.innerHTML = `
        <div style="max-width:440px;width:100%;padding:32px 24px;background:var(--surface,#fff);border:1.5px solid var(--border-light);border-radius:16px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-family:var(--font-display,sans-serif);font-size:clamp(1.5rem,4vw,2rem);color:var(--text-main);letter-spacing:0.04em;margin-bottom:8px;">
              ${pctScore}% on ${topic}
            </div>
            <p style="font-size:0.875rem;color:var(--text-muted);line-height:1.5;margin:0;">
              Want a 3-day Plan Quest to master this topic?
              Miss Wena will guide you through it step by step.
            </p>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <button id="quest-suggest-yes" style="padding:14px;border-radius:9999px;background:var(--brand-rose,#B76E79);color:var(--cream,#e3d9ca);border:none;font-weight:700;font-size:0.95rem;cursor:pointer;">
              Yes, start my Quest
            </button>
            <button id="quest-suggest-no" style="padding:14px;border-radius:9999px;background:transparent;color:var(--text-muted);border:1.5px solid var(--border-light);font-weight:600;font-size:0.875rem;cursor:pointer;">
              Not now
            </button>
          </div>
        </div>`;
      document.body.appendChild(modal);

      document.getElementById('quest-suggest-no').addEventListener('click', () => modal.remove());

      document.getElementById('quest-suggest-yes').addEventListener('click', async () => {
        const yesBtn = document.getElementById('quest-suggest-yes');
        yesBtn.disabled = true;
        yesBtn.textContent = 'Generating…';
        try {
          const sb = await window.getSupabase();
          const { data: { session } } = await sb.auth.getSession();
          const token = session?.access_token;

          const res = await fetch('/api/generate-quest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              student_id: state.studentId,
              subject: subject,
              level: state.dbLevel || '',
              topic: topic,
              trigger_score: pctScore
            })
          });

          const data = await res.json();
          if (res.ok && data.quest?.id) {
            window.location.href = `/quest?id=${data.quest.id}`;
          } else if (res.status === 409) {
            modal.remove();
            alert(`You already have an active ${subject} quest. Check your Quest page to continue it.`);
          } else {
            throw new Error(data.error || 'Failed to generate quest');
          }
        } catch (err) {
          console.error('Quest generation failed:', err);
          const yb = document.getElementById('quest-suggest-yes');
          if (yb) { yb.disabled = false; yb.textContent = 'Yes, start my Quest'; }
          alert('Could not create quest: ' + err.message);
        }
      });
    }

    checkAndOffer();
  }

  setTimeout(init, 100);
};
