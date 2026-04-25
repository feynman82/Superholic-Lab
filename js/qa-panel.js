/**
 * js/qa-panel.js  v2.0
 * Human-in-the-Loop QA Audit Panel
 *
 * Bug fixes in v2.0:
 *   #1  Sidebar sections collapsible (default collapsed; pending auto-expands)
 *   #2  Find Question section with client-side search
 *   #3  Toast notifications visible in QA tab; approve/save give feedback;
 *       api/qa-questions.js endpoint now exists so PUT/DELETE actually work
 *   #4  renderHtml() lets <br> tags render instead of showing as literal text
 *
 * Globals from admin.html: adminSession, esc(), renderPulse(), qaPending
 */

(function () {
  'use strict';

  // ── STATE ─────────────────────────────────────────────────────────────────
  var qaQueue      = [];    // is_ai_cloned = true  (pending review)
  var qaApproved   = [];    // is_ai_cloned = false (live)
  var qaCurrentQ   = null;
  var qaCurrentIdx = -1;    // index in qaQueue; -1 means came from approved/find
  var qaSearchTimer = null;

  // Sidebar collapse state — pending/approved default collapsed, find default open
  var qaSectionOpen = { pending: false, approved: false, find: true };

  // ── TOAST NOTIFICATIONS ───────────────────────────────────────────────────
  // Uses its own container inside .qa-shell so it works when CRM view is hidden.
  // type: 'success' | 'error' | 'info'

  function qaNotify(msg, type) {
    type = type || 'info';
    var shell = document.querySelector('.qa-shell');
    if (!shell) { console.warn('[qa]', msg); return; }
    var toast = document.createElement('div');
    var bg = type === 'success' ? 'var(--brand-mint)'
           : type === 'error'   ? 'var(--brand-error)'
           :                      'var(--sage-dark)';
    toast.style.cssText = [
      'position:absolute', 'top:12px', 'left:50%', 'transform:translateX(-50%)',
      'background:' + bg, 'color:#fff', 'padding:8px 20px',
      'border-radius:var(--radius-full)', 'font-size:var(--text-xs)', 'font-weight:700',
      'z-index:999', 'pointer-events:none', 'white-space:nowrap',
      'box-shadow:var(--shadow-md)', 'transition:opacity 0.3s'
    ].join(';');
    // ensure shell is positioned
    if (getComputedStyle(shell).position === 'static') shell.style.position = 'relative';
    toast.textContent = msg;
    shell.appendChild(toast);
    setTimeout(function () { toast.style.opacity = '0'; setTimeout(function () { toast.remove(); }, 300); }, 2200);
  }

  // ── renderHtml — let <br> tags render; escape everything else ─────────────
  // Bug #4 fix: worked_solution and question_text fields often contain <br><br>.
  // Plain esc() turns these into literal "&lt;br&gt;" text.

  function renderHtml(text) {
    if (!text) return '';
    // First escape all HTML, then un-escape just <br> variants
    return esc(text).replace(/&lt;br\s*\/?&gt;/gi, '<br>');
  }

  // ── SYNTHESIS HELPERS ─────────────────────────────────────────────────────
  //
  // instructions encoding (single-quote notation, connector always at end):
  //   front:  "Rewrite the sentence beginning with the word 'Since'."
  //   middle: "Combine the sentences using the word '... as ...'."
  //   end:    "Rewrite the sentence ending with the word '... however'."

  function qaParseInstructions(instructions) {
    if (!instructions) return { connector: '', position: 'middle' };
    var match = instructions.match(/'([^']+)'/);
    if (!match) return { connector: '', position: 'middle' };
    var raw = match[1];
    if (raw.startsWith('...') && raw.endsWith('...'))
      return { connector: raw.replace(/^\.\.\.\s*|\s*\.\.\.$/g, '').trim(), position: 'middle' };
    if (raw.startsWith('...'))
      return { connector: raw.replace(/^\.\.\.\s*/, '').trim(), position: 'end' };
    return { connector: raw.trim(), position: 'front' };
  }

  function qaBuildInstructions(connector, position) {
    connector = (connector || '').trim();
    if (!connector) return '';
    if (position === 'front') return "Rewrite the sentence beginning with the word '" + connector + "'.";
    if (position === 'end')   return "Rewrite the sentence ending with the word '... " + connector + "'.";
    return "Combine the sentences using the word '... " + connector + " ...'.";
  }

  // ── SIDEBAR COLLAPSE ──────────────────────────────────────────────────────
  // Bug #1 fix: toggle sections; icons rotate to show state.

  window.qaToggleSection = function (section) {
    qaSectionOpen[section] = !qaSectionOpen[section];
    var body    = document.getElementById('qa' + capitalize(section) + 'Body');
    var icon    = document.getElementById('qa' + capitalize(section) + 'Toggle');
    if (body) body.style.display = qaSectionOpen[section] ? '' : 'none';
    if (icon) icon.textContent   = qaSectionOpen[section] ? '▼' : '▶';
  };

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function setSectionOpen(section, open) {
    qaSectionOpen[section] = open;
    var body = document.getElementById('qa' + capitalize(section) + 'Body');
    var icon = document.getElementById('qa' + capitalize(section) + 'Toggle');
    if (body) body.style.display = open ? '' : 'none';
    if (icon) icon.textContent   = open ? '▼' : '▶';
  }

  // ── FIND QUESTION — client-side search ───────────────────────────────────
  // Bug #2 fix: searches across qaQueue + qaApproved in memory.

  window.qaSearchDebounced = function () {
    clearTimeout(qaSearchTimer);
    qaSearchTimer = setTimeout(window.qaDoSearch, 220);
  };

  window.qaDoSearch = function () {
    var query   = ((document.getElementById('qaSearchInput')   || {}).value || '').toLowerCase().trim();
    var subject = ((document.getElementById('qaSearchSubject') || {}).value || '');
    var mode    = ((document.getElementById('qaSearchMode')    || {}).value || '');
    var el      = document.getElementById('qaSearchResults');
    if (!el) return;

    if (!query && !subject) {
      el.innerHTML = '<div class="qa-empty">Type to search…</div>';
      return;
    }

    // Pick pool based on mode
    var pool = [];
    if (mode !== 'approved') pool = pool.concat(qaQueue.map(function (q) { return { q: q, src: 'pending' }; }));
    if (mode !== 'pending')  pool = pool.concat(qaApproved.map(function (q) { return { q: q, src: 'approved' }; }));

    var results = pool.filter(function (item) {
      var q = item.q;
      if (subject && q.subject !== subject) return false;
      if (!query) return true;
      // Search: question_text, topic, sub_topic, correct_answer, instructions
      var haystack = [
        q.question_text || '', q.topic || '', q.sub_topic || '',
        q.correct_answer || '', q.instructions || '', q.passage || ''
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    }).slice(0, 40);

    if (!results.length) {
      el.innerHTML = '<div class="qa-empty">No results.</div>';
      return;
    }

    el.innerHTML = results.map(function (item, i) {
      var q = item.q;
      var isSynth = (q.topic || '').toLowerCase() === 'synthesis';
      var srcBadge = item.src === 'pending'
        ? '<span style="color:var(--brand-amber);font-size:9px;font-weight:700;text-transform:uppercase;">PENDING</span>'
        : '<span style="color:var(--brand-mint);font-size:9px;font-weight:700;text-transform:uppercase;">LIVE</span>';
      return '<div class="qa-item" onclick="window.qaSearchSelect(' + chr(39) + item.src + chr(39) + ',' + i + ')">'
        + '<div class="qa-item-title">' + esc((q.question_text || q.passage || '—').slice(0, 80)) + '</div>'
        + '<div class="qa-item-meta">' + srcBadge + ' ' + (isSynth ? '✍️ ' : '') + esc(q.type || '') + ' · ' + esc(q.level || '') + '</div>'
        + '</div>';
    }).join('');

    // Stash results array for click handler
    window._qaSearchResults = results;
  };

  function chr(n) { return String.fromCharCode(n); }

  window.qaSearchSelect = function (src, i) {
    var results = window._qaSearchResults || [];
    if (!results[i]) return;
    var q = results[i].q;
    if (src === 'pending') {
      var idx = qaQueue.findIndex(function (x) { return x.id === q.id; });
      if (idx >= 0) { qaCurrentIdx = idx; renderQAPendingList(); }
      else qaCurrentIdx = -1;
    } else {
      qaCurrentIdx = -1;
    }
    qaLoadEditor(q);
  };

  // ── CONNECTOR UI ──────────────────────────────────────────────────────────

  window.qaOnConnectorChange = function () {
    var connector = ((document.getElementById('qfConnector') || {}).value || '').trim();
    var posEl = document.querySelector('input[name="qfConnectorPos"]:checked');
    var position = posEl ? posEl.value : 'middle';
    var preview = document.getElementById('qfInstructionsPreview');
    if (preview) preview.textContent = qaBuildInstructions(connector, position) || '—';
    var bp = document.getElementById('qfSynthBlueprint');
    if (bp) {
      if (!connector) {
        bp.innerHTML = '<div style="font-size:var(--text-xs);color:var(--text-muted);">Enter connector above to preview</div>';
      } else {
        var line = '<div class="synth-line"></div>';
        var pill = '<div class="synth-pill">' + esc(connector) + '</div>';
        if      (position === 'front') bp.innerHTML = pill + line;
        else if (position === 'end')   bp.innerHTML = line + pill;
        else                           bp.innerHTML = line + pill + line;
      }
    }
    qaLivePreview();
  };

  window.qaOnTopicChange = function () {
    var topic      = ((document.getElementById('qfTopic') || {}).value || '').trim();
    var type       = ((document.getElementById('qfType')  || {}).value || '').trim();
    var isSynth    = topic.toLowerCase() === 'synthesis';
    var isShortAns = type === 'short_ans';
    var synthGrp = document.getElementById('qfSynthesisGroup');
    var instrGrp = document.getElementById('qfInstructionsGroup');
    var aaGrp    = document.getElementById('qfAcceptAlsoGroup');
    if (synthGrp) synthGrp.style.display = isSynth ? '' : 'none';
    if (instrGrp) instrGrp.style.display = (isShortAns && !isSynth) ? '' : 'none';
    if (aaGrp)   aaGrp.style.display    = isShortAns ? '' : 'none';
    if (isSynth) window.qaOnConnectorChange();
    qaLivePreview();
  };

  // ── JSON HELPERS ──────────────────────────────────────────────────────────

  function qaSetJson(id, val) {
    var el = document.getElementById(id);
    if (!el) return;
    if (val === null || val === undefined || val === '') { el.value = ''; el.classList.remove('json-error'); return; }
    try { el.value = JSON.stringify(typeof val === 'string' ? JSON.parse(val) : val, null, 2); el.classList.remove('json-error'); }
    catch (e) { el.value = typeof val === 'string' ? val : JSON.stringify(val); }
  }

  function qaGetJson(id) {
    var el = document.getElementById(id);
    if (!el || !el.value.trim()) return null;
    try { var v = JSON.parse(el.value); el.classList.remove('json-error'); return v; }
    catch (e) { el.classList.add('json-error'); throw new Error('Invalid JSON in ' + id); }
  }

  window.qaValidateJson = function (el) {
    if (!el.value.trim()) { el.classList.remove('json-error'); return; }
    try { JSON.parse(el.value); el.classList.remove('json-error'); } catch (e) { el.classList.add('json-error'); }
  };

  window.qaOnTypeChange = function () {
    var type  = (document.getElementById('qfType') || {}).value || (qaCurrentQ ? qaCurrentQ.type : 'mcq');
    var isMCQ = type === 'mcq';
    var hasPts = ['word_problem','open_ended','comprehension','cloze','editing','visual_text'].includes(type);
    var optG = document.getElementById('qfOptGroup');
    var weG  = document.getElementById('qfWrongExplGroup');
    var ptG  = document.getElementById('qfPartsGroup');
    if (optG) optG.style.display = isMCQ  ? '' : 'none';
    if (weG)  weG.style.display  = isMCQ  ? '' : 'none';
    if (ptG)  ptG.style.display  = hasPts ? '' : 'none';
    window.qaOnTopicChange();
  };

  // ── ACTION BAR ────────────────────────────────────────────────────────────

  function renderQAActionBar() {
    var bar = document.getElementById('qaActionBar');
    if (!bar || !qaCurrentQ) return;
    var isPending = qaCurrentQ.is_ai_cloned !== false;
    if (isPending) {
      bar.innerHTML =
        '<button class="btn btn-primary hover-lift" style="flex:1;" onclick="window.qaApproveNext()">✅ Approve &amp; Next</button>' +
        '<button class="btn btn-secondary hover-lift" onclick="window.qaSaveDraft(this)">💾 Save</button>' +
        '<button class="btn hover-lift" style="color:var(--brand-error);border:1px solid var(--brand-error);background:transparent;" onclick="window.qaDelete()">🗑️</button>';
    } else {
      bar.innerHTML =
        '<button class="btn hover-lift" style="flex:1;background:rgba(99,102,241,0.1);color:#6366f1;border:1px solid rgba(99,102,241,0.3);" onclick="window.qaReturnToQueue()">↩️ Return to Queue</button>' +
        '<button class="btn btn-secondary hover-lift" onclick="window.qaSaveDraft(this)">💾 Save</button>' +
        '<button class="btn hover-lift" style="color:var(--brand-error);border:1px solid var(--brand-error);background:transparent;" onclick="window.qaDelete()">🗑️</button>';
    }
  }

  // ── LOAD QUEUE ────────────────────────────────────────────────────────────

  window.loadQAQueue = async function () {
    if (!adminSession) { console.warn('[qa] adminSession not set yet'); return; }
    try {
      var res = await fetch('/api/qa-questions?mode=pending&limit=200', {
        headers: { 'Authorization': 'Bearer ' + adminSession.access_token }
      });
      if (!res.ok) {
        var err = await res.json().catch(function () { return {}; });
        qaNotify('Queue load failed: ' + (err.error || res.status), 'error');
        return;
      }
      var data = await res.json();
      qaQueue = data.questions || [];
      renderQAPendingList();
      var cnt   = document.getElementById('qaQueueCount'); if (cnt)   cnt.textContent   = qaQueue.length;
      var badge = document.getElementById('qaTabBadge');   if (badge) badge.textContent = qaQueue.length;
      // Auto-expand pending section only if there are items
      if (qaQueue.length > 0) {
        setSectionOpen('pending', true);
        if (!qaCurrentQ) { qaCurrentIdx = 0; qaLoadEditor(qaQueue[0]); }
      }
      window.loadQAApproved();
    } catch (e) { qaNotify('Queue load error: ' + e.message, 'error'); }
  };

  window.loadQAApproved = async function () {
    if (!adminSession) return;
    var subject = (document.getElementById('qaFSubject') || {}).value || '';
    var level   = (document.getElementById('qaFLevel')   || {}).value || '';
    var type    = (document.getElementById('qaFType')    || {}).value || '';
    var url = '/api/qa-questions?mode=approved&limit=200';
    if (subject) url += '&subject=' + encodeURIComponent(subject);
    if (level)   url += '&level='   + encodeURIComponent(level);
    if (type)    url += '&type='    + encodeURIComponent(type);
    try {
      var res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + adminSession.access_token } });
      if (!res.ok) return;
      var data = await res.json();
      qaApproved = data.questions || [];
      renderQAApprovedList();
    } catch (e) { console.error('[qa] loadQAApproved:', e.message); }
  };

  // ── SIDEBAR RENDERERS ─────────────────────────────────────────────────────

  function renderQAPendingList() {
    var el = document.getElementById('qaPendingList');
    if (!el) return;
    if (!qaQueue.length) { el.innerHTML = '<div class="qa-empty">🎉 Queue is empty!</div>'; return; }
    el.innerHTML = qaQueue.map(function (q, i) {
      var isSynth = (q.topic || '').toLowerCase() === 'synthesis';
      var hint = '';
      if (isSynth && q.instructions) {
        var p = qaParseInstructions(q.instructions);
        if (p.connector) hint = ' · <em>' + esc(p.connector) + '</em>';
      }
      return '<div class="qa-item' + (i === qaCurrentIdx ? ' is-active' : '') + '" onclick="window.qaSelectPending(' + i + ')">'
        + '<div class="qa-item-title">' + esc((q.question_text || q.passage || '—').slice(0, 80)) + '</div>'
        + '<div class="qa-item-meta">' + (isSynth ? '✍️ ' : '') + esc(q.type || '') + ' · ' + esc(q.level || '') + hint + '</div>'
        + '</div>';
    }).join('');
  }

  function renderQAApprovedList() {
    var el = document.getElementById('qaApprovedList');
    if (!el) return;
    if (!qaApproved.length) { el.innerHTML = '<div class="qa-empty">No matches.</div>'; return; }
    el.innerHTML = qaApproved.map(function (q, i) {
      var isSynth = (q.topic || '').toLowerCase() === 'synthesis';
      return '<div class="qa-item" onclick="window.qaSelectApproved(' + i + ')">'
        + '<div class="qa-item-title">' + esc((q.question_text || q.passage || '—').slice(0, 80)) + '</div>'
        + '<div class="qa-item-meta">' + (isSynth ? '✍️ ' : '') + esc(q.type || '') + ' · ' + esc(q.level || '') + '</div>'
        + '</div>';
    }).join('');
  }

  window.qaSelectPending  = function (i) { qaCurrentIdx = i; qaLoadEditor(qaQueue[i]); renderQAPendingList(); };
  window.qaSelectApproved = function (i) { qaCurrentIdx = -1; qaLoadEditor(qaApproved[i]); renderQAPendingList(); };

  // ── LOAD EDITOR ───────────────────────────────────────────────────────────

  function qaLoadEditor(q) {
    qaCurrentQ = q;
    document.getElementById('qaEditorEmpty').style.display = 'none';
    document.getElementById('qaEditorInner').style.display = '';

    function setVal(id, v) { var el = document.getElementById(id); if (el) el.value = (v !== null && v !== undefined) ? String(v) : ''; }

    setVal('qfSubject',        q.subject         || '');
    setVal('qfLevel',          q.level           || '');
    setVal('qfType',           q.type            || '');
    setVal('qfTopic',          q.topic           || '');
    setVal('qfSubTopic',       q.sub_topic       || '');
    setVal('qfDifficulty',     q.difficulty      || 'Standard');
    setVal('qfMarks',          q.marks           || 1);
    setVal('qfCogSkill',       q.cognitive_skill || '');
    setVal('qfQuestionText',   q.question_text   || '');
    setVal('qfCorrectAnswer',  q.correct_answer  || '');
    setVal('qfWorkedSolution', q.worked_solution || '');

    // accept_also: JSON array → one per line
    var aa = q.accept_also || [];
    if (typeof aa === 'string') { try { aa = JSON.parse(aa); } catch (e) { aa = []; } }
    if (!Array.isArray(aa)) aa = [];
    var aaEl = document.getElementById('qfAcceptAlso');
    if (aaEl) aaEl.value = aa.filter(Boolean).join('\n');

    var instrEl = document.getElementById('qfInstructions');
    if (instrEl) instrEl.value = q.instructions || '';

    qaSetJson('qfOptions',   q.options);
    qaSetJson('qfWrongExpl', q.wrong_explanations);
    qaSetJson('qfParts',     q.parts);

    // Synthesis connector
    var isSynth = (q.topic || '').toLowerCase() === 'synthesis';
    var connEl  = document.getElementById('qfConnector');
    if (isSynth && q.instructions) {
      var parsed  = qaParseInstructions(q.instructions);
      if (connEl) connEl.value = parsed.connector;
      var posRadio = document.querySelector('input[name="qfConnectorPos"][value="' + parsed.position + '"]');
      if (posRadio) posRadio.checked = true;
    } else {
      if (connEl) connEl.value = '';
      var midRadio = document.querySelector('input[name="qfConnectorPos"][value="middle"]');
      if (midRadio) midRadio.checked = true;
    }

    renderQAActionBar();
    window.qaOnTypeChange();
    renderQAPreview(q);
  }

  // ── COLLECT FIELDS ────────────────────────────────────────────────────────

  function qaCollectFields() {
    var topic   = (document.getElementById('qfTopic') || {}).value || '';
    var type    = (document.getElementById('qfType')  || {}).value || '';
    var isSynth = topic.toLowerCase() === 'synthesis';

    var instructionsVal = '';
    if (isSynth) {
      var connector = ((document.getElementById('qfConnector') || {}).value || '').trim();
      var posEl = document.querySelector('input[name="qfConnectorPos"]:checked');
      instructionsVal = qaBuildInstructions(connector, posEl ? posEl.value : 'middle');
    } else if (type === 'short_ans') {
      instructionsVal = (document.getElementById('qfInstructions') || {}).value || '';
    }

    var aaEl = document.getElementById('qfAcceptAlso');
    var acceptLines = aaEl ? aaEl.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean) : [];

    // Collect JSON fields with per-field error handling
    var optionsVal = null, wrongExplVal = null, partsVal = null;
    try { optionsVal   = qaGetJson('qfOptions');   } catch (e) { throw new Error('Options: ' + e.message); }
    try { wrongExplVal = qaGetJson('qfWrongExpl'); } catch (e) { throw new Error('Wrong Explanations: ' + e.message); }
    try { partsVal     = qaGetJson('qfParts');     } catch (e) { throw new Error('Parts: ' + e.message); }

    return {
      subject:            (document.getElementById('qfSubject')       || {}).value || '',
      level:              (document.getElementById('qfLevel')         || {}).value || '',
      type:               type,
      topic:              topic,
      sub_topic:          (document.getElementById('qfSubTopic')      || {}).value || '',
      difficulty:         (document.getElementById('qfDifficulty')    || {}).value || '',
      marks:              parseInt((document.getElementById('qfMarks')  || {}).value || '1', 10) || 1,
      cognitive_skill:    (document.getElementById('qfCogSkill')      || {}).value || '',
      question_text:      (document.getElementById('qfQuestionText')  || {}).value || '',
      correct_answer:     (document.getElementById('qfCorrectAnswer') || {}).value || '',
      worked_solution:    (document.getElementById('qfWorkedSolution')|| {}).value || '',
      instructions:       instructionsVal,
      accept_also:        JSON.stringify(acceptLines),
      options:            optionsVal,
      wrong_explanations: wrongExplVal,
      parts:              partsVal,
    };
  }

  // ── WORKFLOW: APPROVE & NEXT ───────────────────────────────────────────────

  window.qaApproveNext = async function () {
    if (!qaCurrentQ) { qaNotify('No question selected.', 'error'); return; }
    var btn = document.querySelector('#qaActionBar .btn-primary');
    if (btn) { btn.textContent = '⏳ Saving…'; btn.disabled = true; }
    try {
      var fields = qaCollectFields();
      var res = await fetch('/api/qa-questions', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + adminSession.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: qaCurrentQ.id, fields: fields, approve: true })
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));

      var prevIdx = qaCurrentIdx;
      qaQueue = qaQueue.filter(function (q) { return q.id !== qaCurrentQ.id; });
      qaNotify('✅ Approved!', 'success');

      if (qaQueue.length === 0) {
        qaCurrentQ = null; qaCurrentIdx = -1;
        document.getElementById('qaEditorEmpty').style.display = '';
        document.getElementById('qaEditorInner').style.display = 'none';
        document.getElementById('qaPreview').innerHTML = '<div class="qa-empty-state"><div style="font-size:2rem;">🎉</div><div class="text-sm">Queue complete! All questions reviewed.</div></div>';
      } else {
        qaCurrentIdx = Math.min(prevIdx, qaQueue.length - 1);
        qaLoadEditor(qaQueue[qaCurrentIdx]);
      }
      renderQAPendingList();
      var cnt   = document.getElementById('qaQueueCount'); if (cnt)   cnt.textContent   = qaQueue.length;
      var badge = document.getElementById('qaTabBadge');   if (badge) badge.textContent = qaQueue.length;
      qaPending = qaQueue.length; renderPulse();
      window.loadQAApproved();
    } catch (e) {
      qaNotify('Approve failed: ' + e.message, 'error');
      if (btn) { btn.textContent = '✅ Approve & Next'; btn.disabled = false; }
    }
  };

  // ── WORKFLOW: SAVE DRAFT ──────────────────────────────────────────────────

  window.qaSaveDraft = async function (btn) {
    if (!qaCurrentQ) { qaNotify('No question selected.', 'error'); return; }
    var origText = btn ? btn.textContent : '';
    if (btn) { btn.textContent = '⏳ Saving…'; btn.disabled = true; }
    try {
      var fields = qaCollectFields();
      var res = await fetch('/api/qa-questions', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + adminSession.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: qaCurrentQ.id, fields: fields })
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
      Object.assign(qaCurrentQ, fields);
      renderQAPendingList();
      qaNotify('💾 Saved!', 'success');
      if (btn) { btn.textContent = '✅ Saved!'; setTimeout(function () { btn.textContent = origText; btn.disabled = false; }, 1400); }
    } catch (e) {
      qaNotify('Save failed: ' + e.message, 'error');
      if (btn) { btn.textContent = origText; btn.disabled = false; }
    }
  };

  // ── WORKFLOW: DELETE ──────────────────────────────────────────────────────

  window.qaDelete = async function () {
    if (!qaCurrentQ) { qaNotify('No question selected.', 'error'); return; }
    if (!confirm('Delete this question permanently? This cannot be undone.')) return;
    try {
      var res = await fetch('/api/qa-questions', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + adminSession.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: qaCurrentQ.id })
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
      var prevIdx = qaCurrentIdx;
      qaQueue = qaQueue.filter(function (q) { return q.id !== qaCurrentQ.id; });
      qaNotify('🗑️ Deleted', 'info');
      if (qaQueue.length === 0) {
        qaCurrentQ = null; qaCurrentIdx = -1;
        document.getElementById('qaEditorEmpty').style.display = '';
        document.getElementById('qaEditorInner').style.display = 'none';
        document.getElementById('qaPreview').innerHTML = '<div class="qa-empty-state"><div style="font-size:2rem;">✅</div><div class="text-sm">Queue empty.</div></div>';
      } else {
        qaCurrentIdx = Math.min(prevIdx, qaQueue.length - 1);
        qaLoadEditor(qaQueue[qaCurrentIdx]);
      }
      renderQAPendingList();
      var cnt   = document.getElementById('qaQueueCount'); if (cnt)   cnt.textContent   = qaQueue.length;
      var badge = document.getElementById('qaTabBadge');   if (badge) badge.textContent = qaQueue.length;
      qaPending = qaQueue.length; renderPulse();
    } catch (e) { qaNotify('Delete failed: ' + e.message, 'error'); }
  };

  // ── WORKFLOW: RETURN TO QUEUE ─────────────────────────────────────────────

  window.qaReturnToQueue = async function () {
    if (!qaCurrentQ) return;
    if (!confirm('Return this approved question back to the pending review queue?')) return;
    try {
      var res = await fetch('/api/qa-questions', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + adminSession.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: qaCurrentQ.id, approve: false })
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
      qaCurrentQ.is_ai_cloned = true;
      qaQueue.unshift(qaCurrentQ);
      qaApproved = qaApproved.filter(function (q) { return q.id !== qaCurrentQ.id; });
      renderQAPendingList(); renderQAApprovedList();
      setSectionOpen('pending', true);
      var cnt   = document.getElementById('qaQueueCount'); if (cnt)   cnt.textContent   = qaQueue.length;
      var badge = document.getElementById('qaTabBadge');   if (badge) badge.textContent = qaQueue.length;
      qaPending = qaQueue.length; renderPulse();
      renderQAActionBar();
      qaNotify('↩️ Returned to queue', 'info');
    } catch (e) { qaNotify('Return failed: ' + e.message, 'error'); }
  };

  // ── LIVE PREVIEW ──────────────────────────────────────────────────────────

  function qaLivePreview() {
    if (!qaCurrentQ) return;
    var type    = (document.getElementById('qfType')  || {}).value || qaCurrentQ.type || 'mcq';
    var topic   = (document.getElementById('qfTopic') || {}).value || '';
    var isSynth = topic.toLowerCase() === 'synthesis';

    var liveInstructions = '';
    if (isSynth) {
      var connector = ((document.getElementById('qfConnector') || {}).value || '').trim();
      var posEl = document.querySelector('input[name="qfConnectorPos"]:checked');
      liveInstructions = qaBuildInstructions(connector, posEl ? posEl.value : 'middle');
    } else {
      var instrEl = document.getElementById('qfInstructions');
      liveInstructions = instrEl ? instrEl.value : (qaCurrentQ.instructions || '');
    }

    var aaEl = document.getElementById('qfAcceptAlso');
    var liveAA = aaEl
      ? aaEl.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean)
      : (function () { try { var a = JSON.parse(qaCurrentQ.accept_also || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }());

    var opts = null, wrongExpl = null, parts = null;
    try { opts      = qaGetJson('qfOptions');   } catch (e) {}
    try { wrongExpl = qaGetJson('qfWrongExpl'); } catch (e) {}
    try { parts     = qaGetJson('qfParts');     } catch (e) {}

    renderQAPreview({
      subject:         (document.getElementById('qfSubject')       || {}).value || '',
      level:           (document.getElementById('qfLevel')         || {}).value || '',
      type:            type, topic: topic,
      sub_topic:       (document.getElementById('qfSubTopic')      || {}).value || '',
      difficulty:      (document.getElementById('qfDifficulty')    || {}).value || '',
      marks:           parseInt((document.getElementById('qfMarks')  || {}).value || '1', 10),
      cognitive_skill: (document.getElementById('qfCogSkill')      || {}).value || '',
      question_text:   (document.getElementById('qfQuestionText')  || {}).value || '',
      correct_answer:  (document.getElementById('qfCorrectAnswer') || {}).value || '',
      worked_solution: (document.getElementById('qfWorkedSolution')|| {}).value || '',
      instructions:    liveInstructions, accept_also: liveAA,
      options: opts, wrong_explanations: wrongExpl, parts: parts,
      passage: qaCurrentQ.passage, passage_lines: qaCurrentQ.passage_lines, blanks: qaCurrentQ.blanks,
    });
  }

  window.qaLivePreview = qaLivePreview;

  // ── PREVIEW RENDERER ──────────────────────────────────────────────────────
  // Bug #4 fix: use renderHtml() for worked_solution and question_text
  // so that <br> tags stored in the DB render as actual line breaks.
  //
  // wrong_explanations:
  //   NEW (2025+): keyed by option text → { "It eats...": { text:"...", type:"misconception" } }
  //   OLD (legacy): keyed by letter     → { "A": "explanation" }
  //   Both handled: option text lookup first, fall back to letter.

  function renderQAPreview(q) {
    var el = document.getElementById('qaPreview');
    if (!q) { el.innerHTML = '<div class="qa-empty-state"><div class="text-sm text-muted">Select a question to preview</div></div>'; return; }

    var html    = '';
    var type    = q.type || 'mcq';
    var topic   = (q.topic || '').toLowerCase();
    var isSynth = topic === 'synthesis';
    var letters = ['A','B','C','D'];

    // Badges
    html += '<div class="flex flex-wrap gap-2 mb-4">';
    if (type)              html += '<span class="badge badge-info">'  + esc(type.replace(/_/g,' ')) + '</span>';
    if (isSynth)           html += '<span class="badge" style="background:rgba(183,110,121,0.1);color:var(--brand-rose);">Synthesis</span>';
    if (q.level)           html += '<span class="badge">'             + esc(q.level)           + '</span>';
    if (q.difficulty)      html += '<span class="badge">'             + esc(q.difficulty)      + '</span>';
    if (q.marks)           html += '<span class="badge badge-amber">' + q.marks + ' mk</span>';
    if (q.cognitive_skill) html += '<span class="badge">'             + esc(q.cognitive_skill) + '</span>';
    html += '</div>';

    if (q.topic) html += '<div class="text-xs font-bold text-muted uppercase mb-4" style="letter-spacing:0.06em;">'
      + esc(q.topic) + (q.sub_topic ? ' \u203a ' + esc(q.sub_topic) : '') + '</div>';

    // ══ SYNTHESIS ═══════════════════════════════════════════════════════════
    if (isSynth && type === 'short_ans') {
      var sentences = (q.question_text || '').split('\n').filter(function (s) { return s.trim(); });
      html += '<div class="p-4 rounded mb-3" style="background:var(--bg-elevated);border-left:3px solid var(--brand-sage);">';
      html += '<div class="text-xs font-bold text-muted uppercase mb-2">Source Sentences</div>';
      sentences.forEach(function (s) { html += '<div class="text-sm text-main mb-1 font-medium">' + esc(s) + '</div>'; });
      html += '</div>';

      if (q.instructions) html += '<div class="text-sm text-muted mb-3 italic">' + esc(q.instructions) + '</div>';

      var ps = qaParseInstructions(q.instructions || '');
      if (ps.connector) {
        var lH = '<div class="synth-line"></div>';
        var pH = '<div class="synth-pill">' + esc(ps.connector) + '</div>';
        html += '<div class="synth-blueprint mb-3">'
          + (ps.position === 'front' ? pH + lH : ps.position === 'end' ? lH + pH : lH + pH + lH)
          + '</div>';
      }

      if (q.correct_answer) html += '<div class="qa-solution-box mb-2"><div class="qa-solution-lbl">\u2713 Model Answer</div><div class="text-sm text-main">' + esc(q.correct_answer) + '</div></div>';

      var aa = q.accept_also || [];
      if (typeof aa === 'string') { try { aa = JSON.parse(aa); } catch (e) { aa = []; } }
      if (!Array.isArray(aa)) aa = [];
      aa = aa.filter(Boolean);
      if (aa.length) {
        html += '<div class="p-3 rounded mt-2" style="background:var(--bg-elevated);border:1px solid var(--border-light);">';
        html += '<div class="text-xs font-bold text-muted uppercase mb-2">Also Accepted</div>';
        aa.forEach(function (alt) { html += '<div class="text-sm text-main mb-1">\u2022 ' + esc(alt) + '</div>'; });
        html += '</div>';
      }

      if (q.worked_solution) html += '<div class="qa-solution-box mt-3"><div class="qa-solution-lbl">\uD83D\uDCCB Worked Solution</div><div class="text-sm text-main">' + renderHtml(q.worked_solution) + '</div></div>';

    // ══ MCQ ═════════════════════════════════════════════════════════════════
    } else if (type === 'mcq') {
      if (q.question_text) html += '<div style="font-size:var(--text-base);font-weight:700;color:var(--text-main);line-height:1.6;margin-bottom:var(--space-4);">' + renderHtml(q.question_text) + '</div>';

      var opts = [];
      try { opts = typeof q.options === 'string' ? JSON.parse(q.options) : (Array.isArray(q.options) ? q.options : []); } catch (e) {}
      var we = {};
      try { we = typeof q.wrong_explanations === 'string' ? JSON.parse(q.wrong_explanations) : (q.wrong_explanations || {}); } catch (e) {}
      var correctAns = String(q.correct_answer || '').trim();

      opts.forEach(function (opt, i) {
        var letter    = letters[i];
        var isCorrect = correctAns.toUpperCase() === letter || correctAns === opt;
        html += '<div class="mcq-opt' + (isCorrect ? ' is-correct' : '') + '">';
        html += '<span class="mcq-badge">' + letter + '</span>';
        html += '<span style="font-size:var(--text-sm);color:var(--text-main);">' + esc(opt) + '</span>';
        if (isCorrect) html += '<span style="margin-left:auto;font-size:10px;font-weight:700;color:var(--brand-mint);">\u2713 CORRECT</span>';
        html += '</div>';
        if (!isCorrect) {
          var weEntry = we[opt] || we[letter] || null;
          if (weEntry) {
            var expl  = typeof weEntry === 'string' ? weEntry : (weEntry.text || '');
            var exType = (typeof weEntry === 'object' && weEntry.type) ? weEntry.type : '';
            if (expl) {
              html += '<div class="text-xs text-muted mb-2" style="margin-left:44px;padding-left:8px;border-left:2px solid var(--border-light);">';
              if (exType) html += '<span style="color:var(--brand-amber);font-weight:700;text-transform:uppercase;font-size:10px;margin-right:6px;">' + esc(exType) + '</span>';
              html += esc(expl) + '</div>';
            }
          }
        }
      });

    // ══ SHORT ANSWER (non-synthesis) ═════════════════════════════════════════
    } else if (type === 'short_ans') {
      if (q.question_text) html += '<div style="font-size:var(--text-base);font-weight:700;color:var(--text-main);line-height:1.6;margin-bottom:var(--space-4);">' + renderHtml(q.question_text) + '</div>';
      if (q.instructions)  html += '<div class="text-sm text-muted mb-3 italic">' + esc(q.instructions) + '</div>';
      html += '<div class="p-3 rounded mb-3" style="background:var(--bg-elevated);border:1px solid var(--border-light);"><div class="text-xs text-muted mb-2">Student writes answer here</div><div style="height:32px;border:1px solid var(--border-dark);border-radius:var(--radius-sm);background:var(--bg-surface);"></div></div>';
      if (q.correct_answer)  html += '<div class="qa-solution-box"><div class="qa-solution-lbl">\u2713 Correct Answer</div><div class="text-sm text-main">' + esc(q.correct_answer) + '</div></div>';
      if (q.worked_solution) html += '<div class="qa-solution-box mt-3"><div class="qa-solution-lbl">\uD83D\uDCCB Worked Solution</div><div class="text-sm text-main">' + renderHtml(q.worked_solution) + '</div></div>';

    // ══ WORD PROBLEM / OPEN ENDED ════════════════════════════════════════════
    } else if (type === 'word_problem' || type === 'open_ended') {
      if (q.question_text) html += '<div style="font-size:var(--text-base);font-weight:700;color:var(--text-main);line-height:1.6;margin-bottom:var(--space-4);">' + renderHtml(q.question_text) + '</div>';
      var wParts = [];
      try { wParts = typeof q.parts === 'string' ? JSON.parse(q.parts) : (Array.isArray(q.parts) ? q.parts : []); } catch (e) {}
      wParts.forEach(function (p, i) {
        html += '<div class="mb-4 p-4 rounded" style="border-left:3px solid var(--brand-sage);background:var(--bg-elevated);">';
        html += '<div class="font-bold text-sm" style="color:var(--brand-sage);">' + esc(p.label || '(' + String.fromCharCode(97+i) + ')') + ' <span class="text-muted font-normal text-xs">(' + (p.marks||1) + ' mk)</span></div>';
        if (p.question) html += '<div class="text-sm text-main mt-2">' + renderHtml(p.question) + '</div>';
        var ans = p.model_answer || p.correct_answer || p.worked_solution || '';
        if (ans) html += '<div class="text-xs mt-2 font-bold" style="color:var(--brand-mint);">\u2713 ' + esc(ans).slice(0,120) + '</div>';
        html += '</div>';
      });
      if (q.worked_solution) html += '<div class="qa-solution-box mt-3"><div class="qa-solution-lbl">\uD83D\uDCCB Worked Solution</div><div class="text-sm text-main">' + renderHtml(q.worked_solution) + '</div></div>';

    // ══ CLOZE ════════════════════════════════════════════════════════════════
    } else if (type === 'cloze') {
      var passageEsc = esc(q.passage || q.question_text || '').replace(/\[(\d+)\]/g, function (m, n) {
        return '<span style="display:inline-block;min-width:70px;border-bottom:2px solid var(--brand-rose);text-align:center;margin:0 2px;color:var(--brand-rose);">[' + n + ']</span>';
      });
      html += '<div class="p-4 rounded mb-4" style="background:var(--bg-elevated);line-height:2;font-size:var(--text-sm);">' + passageEsc + '</div>';
      var blanks = [];
      try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (Array.isArray(q.blanks) ? q.blanks : []); } catch (e) {}
      if (blanks.length) {
        html += '<div class="flex flex-wrap gap-2">';
        blanks.forEach(function (b) { html += '<span class="badge">[' + (b.number||b.id) + '] <span style="color:var(--brand-mint);">' + esc(b.correct_answer||'') + '</span></span>'; });
        html += '</div>';
      }

    // ══ EDITING ══════════════════════════════════════════════════════════════
    } else if (type === 'editing') {
      var lines = [];
      try { lines = typeof q.passage_lines === 'string' ? JSON.parse(q.passage_lines) : (Array.isArray(q.passage_lines) ? q.passage_lines : []); } catch (e) {}
      if (lines.length) {
        html += '<div class="p-4 rounded" style="background:var(--bg-elevated);font-size:var(--text-base);line-height:2.4;">';
        lines.forEach(function (line) {
          var text = esc(line.text || '');
          if (line.underlined_word) {
            var colour = line.has_error ? 'var(--brand-error)' : 'var(--text-main)';
            text = text.replace(esc(line.underlined_word), '<u style="color:' + colour + ';font-weight:700;">' + esc(line.underlined_word) + '</u>');
          }
          html += '<div>' + text + (line.has_error ? ' <span style="color:var(--brand-mint);font-size:11px;">[→ ' + esc(line.correct_word||'') + ']</span>' : '') + '</div>';
        });
        html += '</div>';
      }

    // ══ COMPREHENSION / VISUAL TEXT ══════════════════════════════════════════
    } else if (type === 'comprehension' || type === 'visual_text') {
      if (q.passage) html += '<div class="p-3 rounded mb-4 text-sm" style="background:var(--bg-elevated);max-height:180px;overflow-y:auto;line-height:1.7;">' + esc(q.passage).replace(/\n/g,'<br>') + '</div>';
      var cParts = [];
      try { cParts = typeof q.parts === 'string' ? JSON.parse(q.parts) : (Array.isArray(q.parts) ? q.parts : []); } catch (e) {}
      cParts.slice(0,4).forEach(function (p, i) {
        html += '<div class="mb-2 p-4 rounded" style="background:var(--bg-elevated);border-left:3px solid var(--brand-sage);">';
        html += '<span class="font-bold text-sm" style="color:var(--brand-sage);">' + esc(p.label||('Q'+(i+1))) + '</span> ';
        html += '<span class="text-xs text-muted">(' + esc(p.part_type||'') + ' \u00b7 ' + (p.marks||1) + ' mk)</span>';
        if (p.question || p.instructions) html += '<div class="text-sm text-main mt-2">' + renderHtml(p.question || p.instructions || '') + '</div>';
        html += '</div>';
      });
      if (cParts.length > 4) html += '<div class="text-xs text-muted">+' + (cParts.length-4) + ' more parts</div>';
      if (q.worked_solution) html += '<div class="qa-solution-box mt-3"><div class="qa-solution-lbl">\uD83D\uDCCB Worked Solution</div><div class="text-sm text-main">' + renderHtml(q.worked_solution) + '</div></div>';

    // ══ FALLBACK ═════════════════════════════════════════════════════════════
    } else {
      if (q.question_text)  html += '<div style="font-size:var(--text-base);font-weight:700;color:var(--text-main);line-height:1.6;margin-bottom:var(--space-4);">' + renderHtml(q.question_text) + '</div>';
      if (q.correct_answer) html += '<div class="qa-solution-box"><div class="qa-solution-lbl">\u2713 Answer</div><div class="text-sm text-main">' + esc(q.correct_answer) + '</div></div>';
      if (q.worked_solution) html += '<div class="qa-solution-box mt-3"><div class="qa-solution-lbl">\uD83D\uDCCB Worked Solution</div><div class="text-sm text-main">' + renderHtml(q.worked_solution) + '</div></div>';
    }

    el.innerHTML = html;
  }

}()); // end IIFE
