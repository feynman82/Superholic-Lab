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
    phase: 'CONFIG',
    paper: null,
    answers: {},
    drawings: {},
    results: null,
    timerSeconds: 0,
    timerInterval: null,
    studentId: new URLSearchParams(window.location.search).get('student')
  };

  function render() {
    switch(state.phase) {
      case 'CONFIG': renderConfig(); break;
      case 'LOADING': renderLoading(); break;
      case 'EXAM': renderFocusExam(); break;
      case 'RESULTS': renderResults(); break;
    }
  }

  // ── 1. CONFIGURATION PHASE ──
  function renderConfig() {
    app.innerHTML = `
      <div class="card p-8 w-full max-w-lg hover-lift">
        <div class="text-center mb-8">
          <div class="text-5xl mb-4">📝</div>
          <h1 class="font-display text-3xl text-main">Exam Generator</h1>
          <p class="text-muted mt-2">Generate a full MOE-aligned practice paper.</p>
        </div>
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-bold text-muted uppercase mb-2">Subject</label>
            <select id="cfgSubject" class="form-input w-full p-3 rounded-lg border-2 border-light focus:border-brand-sage">
              <option value="mathematics">Mathematics</option>
              <option value="science">Science</option>
              <option value="english">English Language</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-bold text-muted uppercase mb-2">Level</label>
            <select id="cfgLevel" class="form-input w-full p-3 rounded-lg border-2 border-light focus:border-brand-sage">
              <option value="primary-3">Primary 3</option>
              <option value="primary-4" selected>Primary 4</option>
              <option value="primary-5">Primary 5</option>
              <option value="primary-6">Primary 6</option>
            </select>
          </div>
          <button class="btn btn-primary w-full py-4 text-lg mt-4 hover-lift" onclick="window.startExamGeneration()">Generate Paper</button>
        </div>
      </div>
    `;
  }

  window.startExamGeneration = async () => {
    const subject = document.getElementById('cfgSubject').value;
    const level = document.getElementById('cfgLevel').value;
    
    state.phase = 'LOADING';
    render();

    try {
      state.paper = await window.ExamGenerator.generateExam(subject, level);
      state.answers = {};
      state.drawings = {};
      state.results = null;
      state.timerSeconds = state.paper.template.durationMinutes * 60;
      
      state.phase = 'EXAM';
      render();
      startTimer();
    } catch (err) {
      console.error(err);
      alert("Failed to generate paper. Check console for details.");
      state.phase = 'CONFIG';
      render();
    }
  };

  function renderLoading() {
    app.innerHTML = `<div class="card flex flex-col items-center p-12 text-center max-w-lg mx-auto"><div class="spinner-sm mb-6"></div><h2 class="font-display text-2xl text-main">Assembling Paper...</h2></div>`;
  }

  // ── TIMER LOGIC ──
  function startTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      if (state.timerSeconds > 0) state.timerSeconds--;
      const el = document.getElementById('examTimer');
      if (el) {
        const h = Math.floor(state.timerSeconds / 3600);
        const m = Math.floor((state.timerSeconds % 3600) / 60);
        const s = state.timerSeconds % 60;
        el.innerText = h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
        if (state.timerSeconds < 300) el.style.color = 'var(--brand-error)';
      }
    }, 1000);
  }

  // ── 2. THE EXAM ENGINE (3-TIER ROUTER) ──
  function renderFocusExam() {
    const p = state.paper;
    
    let html = `
      <div class="sticky top-[var(--navbar-h)] z-40 bg-surface border-b border-light w-full p-4 mb-6 shadow-sm flex justify-between items-center rounded-xl">
        <div>
          <h2 class="font-display text-xl text-main m-0">${p.template.displayName}</h2>
          <div class="text-sm text-muted">${p.template.totalMarks} Marks • ${p.template.durationMinutes} mins</div>
        </div>
        <div class="text-2xl font-display font-bold text-main" id="examTimer">--:--</div>
      </div>
      <div class="w-full space-y-8 max-w-[1200px]">
    `;

    p.sections.forEach((sec) => {
      html += `
        <div class="mb-8">
          <div class="bg-elevated border-l-4 border-brand-sage p-4 rounded-r-xl mb-6 shadow-sm">
            <h3 class="font-display text-2xl text-main m-0">${sec.label}: ${sec.title}</h3>
            <p class="text-muted mt-1 font-medium">${sec.instructions}</p>
          </div>
      `;

      sec.questions.forEach((q, qIndex) => {
        const globalIdx = `${sec.id}-${qIndex}`;
        
        // 🚀 MASTERCLASS ROUTER
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
             const displayQuestion = esc(q.question_text.split('\n\n')[0].trim()).replace(/&lt;br\s*\/?[&gt;]*>/gi, '<br>');
             const instructions = q.instructions ? `<div class="text-lg text-main font-bold mb-4 leading-relaxed">${esc(q.instructions)}</div>` : '';
             qTextHtml = `<div class="text-lg text-main font-medium mb-4 leading-relaxed">${displayQuestion}<br><br></div>${instructions}`;
           } else {
             qTextHtml = `<div class="text-lg text-main font-medium mb-4 leading-relaxed">${esc(q.question_text)}</div>`;
           }
        }
        
        const diagramHtml = renderVisualPayload(q.visual_payload);
        
        html += `
          <div class="card p-6 mb-6 hover-lift relative" id="q-container-${globalIdx}">
            <div class="absolute top-6 right-6 badge badge-info">${q.marks} mark${q.marks>1?'s':''}</div>
            <h4 class="font-bold text-brand-sage mb-4 text-lg">Question ${qIndex + 1}</h4>
            ${diagramHtml}
            ${!isSplitScreen && !isInlinePassage ? qTextHtml : ''}
            ${inputUi}
          </div>
        `;
      });
      html += `</div>`;
    });

    html += `
        <div class="card p-6 flex justify-between items-center bg-elevated shadow-sm mt-8">
          <div class="text-muted text-sm font-medium">Review your answers before submitting.</div>
          <button class="btn btn-primary text-lg px-8 py-3 shadow-lg hover-lift" onclick="window.submitExam()">Submit Paper</button>
        </div>
      </div>
    `;

    app.innerHTML = html;
    setTimeout(initAllCanvases, 100);
  }

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
      return `<div class="mcq-opt${isSel?' is-sel':''}" onclick="window.selectExamMcq('${qIndex}', ${i})">
        <span class="mcq-badge">${letters[i]}</span><span class="font-medium text-main">${esc(opt)}</span>
      </div>`;
    }).join('');
  }

  window.selectExamMcq = (qIndex, optIdx) => {
    window.saveAllAnswers(); // Preserve other inputs
    const qParts = qIndex.split('-'); 
    const sec = state.paper.sections.find(s => s.id === `${qParts[0]}-${qParts[1]}`);
    const q = sec.questions[parseInt(qParts[2])];
    
    let safeOptions = [];
    try { safeOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []); } catch(e) {}
    
    state.answers[qIndex] = safeOptions[optIdx];
    renderFocusExam(); // Re-render to show selection visually
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
          ${p.question ? `<div class="mb-4 text-main font-medium leading-relaxed">${esc(p.question)}</div>` : ''}
          
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
     let passage = esc(q.passage || '').replace(/\n/g, '<br>');
     let blanks = [];
     try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (q.blanks || []); } catch(e) {}
     
     blanks.forEach(b => {
        const num = b.number || b.id;
        const saved = (state.answers[globalIdx] || {})[num] || '';
        let inputHtml = '';
        if (b.options && b.options.length > 0) {
           const opts = b.options.map(o => `<option value="${esc(o)}" ${saved===o?'selected':''}>${esc(o)}</option>`).join('');
           inputHtml = `<select id="inline-${globalIdx}-${num}" class="cloze-select" style="min-width:100px;" onchange="window.saveAllAnswers()"><option value="" disabled ${!saved?'selected':''}>Select...</option>${opts}</select>`;
        } else {
           inputHtml = `<input type="text" id="inline-${globalIdx}-${num}" class="editing-input" placeholder="type here" value="${esc(saved)}" onblur="window.saveAllAnswers()">`;
        }
        passage = passage.replace(new RegExp(`_*\\s*(\\[|\\()${num}(\\]|\\))\\s*_*`, 'g'), inputHtml);
     });
     return `<div class="card p-6 bg-surface text-lg leading-relaxed cloze-passage">${passage}</div>`;
  }

  function buildEditingUI(q, globalIdx) {
     let passage = esc(q.passage || '').replace(/\n/g, '<br><br>').replace(/&lt;u&gt;/gi, '<u>').replace(/&lt;\/u&gt;/gi, '</u>');
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
       const saved = (state.answers[globalIdx] || {})[pLabel] || '';
       let inter = '';
       
       if (p.part_type === 'mcq') {
          inter = (p.options||[]).map((opt, i) => `<div class="mcq-opt hover-lift ${saved===opt?'is-sel':''}" onclick="window.selectCompMcq('${globalIdx}', '${pLabel}', ${i})"><span class="mcq-badge">${['A','B','C','D'][i]}</span><span>${esc(opt)}</span></div>`).join('');
       } else {
          inter = `<textarea id="comp-${globalIdx}-${pIdx}" class="form-input w-full p-4 text-lg border-2 border-slate-200 focus:border-brand-sage rounded-xl" rows="3" placeholder="Type answer..." onblur="window.saveAllAnswers()">${esc(saved)}</textarea>`;
       }
       return `<div class="mb-6"><div class="font-display text-xl text-brand-sage mb-2">${pLabel}</div><div class="mb-3 text-main font-medium leading-relaxed">${esc(p.question)}</div>${inter}</div>`;
    }).join('');

    return `
      <div class="flex flex-col lg:flex-row gap-6 comp-container">
        <div class="lg:w-1/2 card p-6 text-lg leading-relaxed bg-surface comp-passage-pane">
           ${q.type === 'visual_text' && q.image_url ? `<img src="${q.image_url}" class="w-full rounded border border-light">` : esc(q.passage).replace(/\n/g, '<br><br>')}
        </div>
        <div class="lg:w-1/2 comp-questions-pane">${partsHtml}</div>
      </div>
    `;
  }

  window.selectCompMcq = (globalIdx, pLabel, optIdx) => {
    window.saveAllAnswers();
    const qParts = globalIdx.split('-'); 
    const sec = state.paper.sections.find(s => s.id === `${qParts[0]}-${qParts[1]}`);
    const q = sec.questions[parseInt(qParts[2])];
    
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
    state.paper.sections.forEach(sec => {
      sec.questions.forEach((q, qIdx) => {
        const globalIdx = `${sec.id}-${qIdx}`;
        
        if (q.type === 'short_ans' || (q.type === 'word_problem' && !q.parts)) {
           const el = document.getElementById(`input-${globalIdx}`);
           if (el) state.answers[globalIdx] = el.value;
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
             if (p.part_type !== 'mcq') {
               const el = document.getElementById(`comp-${globalIdx}-${i}`);
               if (el) state.answers[globalIdx][p.label || `Q${i+1}`] = el.value;
             }
           });
        }
      });
    });
  };

  // ── 3. THE GRADING ENGINE ──
  window.submitExam = async () => {
    window.saveAllAnswers();
    clearInterval(state.timerInterval);
    
    app.innerHTML = `<div class="card flex flex-col items-center p-12 text-center w-full max-w-lg mx-auto mt-10"><div class="spinner-sm mb-6"></div><h2 class="font-display text-2xl text-main">Grading Paper...</h2><p class="text-muted mt-2">Miss Wena is reviewing your answers. This may take a minute.</p></div>`;

    state.results = {};
    const aiPromises = [];

    state.paper.sections.forEach(sec => {
      sec.questions.forEach((q, qIdx) => {
        const globalIdx = `${sec.id}-${qIdx}`;
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
           const p = fetch('/api/grade-answer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ questionId: q.id, questionType: q.type, questionText: q.question_text, studentAnswer: userAnsStr, workedSolution: q.worked_solution || q.model_answer, marks: q.marks || 2 })
           }).then(res => res.json()).then(data => {
              state.results[globalIdx] = { isCorrect: data.score === (q.marks||2), isPartial: data.score > 0 && data.score < (q.marks||2), score: data.score || 0, maxScore: q.marks || 2, text: data.feedback, workedSolution: q.worked_solution || q.model_answer };
           }).catch(() => {
              state.results[globalIdx] = { isCorrect: false, score: 0, maxScore: q.marks, text: "AI Grading unavailable.", workedSolution: q.worked_solution || q.model_answer };
           });
           aiPromises.push(p);
        }
      });
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
    
    const items = state.paper.sections.map(sec => {
      return sec.questions.map((q, qIdx) => {
        const globalIdx = `${sec.id}-${qIdx}`;
        const r = state.results[globalIdx];
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
              <span class="font-bold text-lg text-main">${sec.label} Q${qIdx + 1}</span>
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
      
      const { data: attempt, error: attErr } = await sb.from('quiz_attempts').insert({
          student_id:         state.studentId,
          subject:            state.paper.template.subject.toLowerCase() === 'maths' ? 'mathematics' : state.paper.template.subject.toLowerCase(),
          level:              state.paper.template.level.toLowerCase().replace('p', 'primary-'),
          topic:              state.paper.template.paperCode || 'Mock Exam',
          difficulty:         'Mixed',
          score:              earned,
          total_questions:    possible,
          time_taken_seconds: (state.paper.template.durationMinutes * 60) - state.timerSeconds,
          completed_at:       new Date().toISOString(),
      }).select('id').single();

      if (attErr) throw attErr;

      const qAttempts = [];
      state.paper.sections.forEach(sec => {
         sec.questions.forEach((q, qIdx) => {
            const globalIdx = `${sec.id}-${qIdx}`;
            const r = state.results[globalIdx];
            const ans = state.answers[globalIdx];
            qAttempts.push({
               quiz_attempt_id: attempt.id,
               student_id:      state.studentId,
               question_text:   (q.question_text || q.passage || 'Diagram/Passage').slice(0, 500),
               topic:           q.topic || 'Exam',
               difficulty:      q.difficulty || 'standard',
               correct:         r.isCorrect,
               answer_chosen:   (typeof ans === 'object' ? JSON.stringify(ans) : String(ans || '')).slice(0, 200),
               correct_answer:  String(q.correct_answer || q.model_answer || 'See Solution'),
            });
         });
      });

      if (qAttempts.length > 0) await sb.from('question_attempts').insert(qAttempts);

      const today = new Date().toISOString().slice(0, 10);
      const { data: existingUsage } = await sb.from('daily_usage').select('id, questions_attempted').eq('student_id', state.studentId).eq('date', today).maybeSingle();
      const newCount = (existingUsage?.questions_attempted || 0) + Object.keys(state.results).length;

      if (!existingUsage) await sb.from('daily_usage').insert({ student_id: state.studentId, date: today, questions_attempted: newCount });
      else await sb.from('daily_usage').update({ questions_attempted: newCount }).eq('id', existingUsage.id);
      
    } catch (e) {
      console.error('Failed to save exam result to Supabase:', e);
    }
  }

  setTimeout(() => render(), 100);
};