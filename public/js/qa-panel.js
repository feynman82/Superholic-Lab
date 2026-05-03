/**
 * js/qa-panel.js  v3.0  (2026-04-26)
 * Human-in-the-Loop QA Audit Panel
 *
 * v3.0 changes:
 *   #1  Pending = approved_at IS NULL (was: is_ai_cloned = true).
 *       is_ai_cloned retained server-side as pure provenance flag.
 *   #2  Visual payload renders inline using DiagramLibrary (same as quiz/exam).
 *   #3  Server-side search via ?q= (no longer capped at 200 in-memory rows).
 *   #4  New "Diagram" filter: All / Yes / No.
 *   #5  Comprehension shows ALL parts (no 4-cap), pulls answers from parts[i].model_answer,
 *       and renders <br> in passage instead of escaping it.
 *   #6  Live preview "also accepted" box uses .qa-accept-also CSS class (no Tailwind dependency).
 *   #7  Cloze sidebar shows passage text, not question_text.
 *   #8  Editing live preview reads passage HTML (with <u>word</u> [N] markers) when
 *       passage_lines is null, and sidebar shows passage instead of question_text.
 *
 * Globals from admin.html: adminSession, esc(), renderPulse(), qaPending, DiagramLibrary
 */

(function () {
  'use strict';

  // ── STATE ─────────────────────────────────────────────────────────────────
  var qaQueue       = [];   // approved_at IS NULL (pending review)
  var qaApproved    = [];   // approved_at IS NOT NULL (live)
  var qaCurrentQ    = null;
  var qaCurrentIdx  = -1;   // index in qaQueue; -1 means came from approved/find
  var qaSearchTimer = null;
  var qaAuditOpen   = false;
  var qaAuditCache  = {};   // { questionId: events[] }

  // Sidebar collapse state — pending/approved default collapsed, find default open
  var qaSectionOpen = { pending: false, approved: false, find: true };

  // Syllabus canon — loaded async on first use; null until ready
  var qaSyllabus = null;

  // Cache of canon_level_topics rows: { 'Primary 3|Mathematics': [{topic, sub_topic}, ...] }
  var qaLevelCanonCache = {};

  // Form value → DB value. canon_level_topics uses 'English', form has 'English Language'.
  function qaNormSubject(s) {
    if (!s) return '';
    if (s === 'English Language') return 'English';
    return s;
  }
  // Reverse: DB value → form display value (for select.value matching)
  function qaDenormSubject(s) {
    if (s === 'English') return 'English Language';
    return s || '';
  }

  // ── TOAST NOTIFICATIONS ───────────────────────────────────────────────────
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
    if (getComputedStyle(shell).position === 'static') shell.style.position = 'relative';
    toast.textContent = msg;
    shell.appendChild(toast);
    setTimeout(function () { toast.style.opacity = '0'; setTimeout(function () { toast.remove(); }, 300); }, 2200);
  }

  // ── renderHtml — let <br> tags render; escape everything else ─────────────
  // For passage/question_text/worked_solution that may contain literal <br> markup.
  function renderHtml(text) {
    if (!text) return '';
    return esc(text).replace(/&lt;br\s*\/?&gt;/gi, '<br>');
  }

  // ── renderPassageHtml — for editing/comprehension passages ────────────────
  // Editing passages contain <u>word</u> markers and [1] index references which
  // must render as inline HTML, not as escaped text. We selectively allow <u>
  // and <br> tags through after escaping everything else.
  function renderPassageHtml(text) {
    if (!text) return '';
    return esc(text)
      .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
      .replace(/&lt;u&gt;/gi, '<u>')
      .replace(/&lt;\/u&gt;/gi, '</u>')
      .replace(/\n/g, '<br>');
  }

  // ── SIDEBAR PREVIEW TEXT ──────────────────────────────────────────────────
  // For comprehension/cloze/editing the sidebar should show the passage
  // (since question_text is often empty or generic). Other types use question_text.
  function sidebarPreviewText(q) {
    var t = (q.type || '').toLowerCase();
    if (t === 'comprehension' || t === 'visual_text' || t === 'cloze' || t === 'editing') {
      return q.passage || q.question_text || '\u2014';
    }
    return q.question_text || q.passage || '\u2014';
  }

  // ── SYNTHESIS HELPERS ─────────────────────────────────────────────────────
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
  window.qaToggleSection = function (section) {
    qaSectionOpen[section] = !qaSectionOpen[section];
    var body = document.getElementById('qa' + capitalize(section) + 'Body');
    var icon = document.getElementById('qa' + capitalize(section) + 'Toggle');
    if (body) body.style.display = qaSectionOpen[section] ? '' : 'none';
    if (icon) icon.textContent   = qaSectionOpen[section] ? '\u25BC' : '\u25B6';
  };

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function setSectionOpen(section, open) {
    qaSectionOpen[section] = open;
    var body = document.getElementById('qa' + capitalize(section) + 'Body');
    var icon = document.getElementById('qa' + capitalize(section) + 'Toggle');
    if (body) body.style.display = open ? '' : 'none';
    if (icon) icon.textContent   = open ? '\u25BC' : '\u25B6';
  }

  // ── FIND QUESTION — server-side search via ?q= ───────────────────────────
  // v3.0 fix #3: search hits the API (no in-memory cap) so all 5,000+ rows
  // are reachable. Debounce keeps load reasonable while typing.
  window.qaSearchDebounced = function () {
    clearTimeout(qaSearchTimer);
    qaSearchTimer = setTimeout(window.qaDoSearch, 280);
  };

  window.qaDoSearch = async function () {
    var query   = ((document.getElementById('qaSearchInput')   || {}).value || '').trim();
    var subject = ((document.getElementById('qaSearchSubject') || {}).value || '');
    var mode    = ((document.getElementById('qaSearchMode')    || {}).value || '');
    var el      = document.getElementById('qaSearchResults');
    if (!el) return;

    if (!query && !subject) {
      el.innerHTML = '<div class="qa-empty">Type a keyword to search\u2026</div>';
      return;
    }

    el.innerHTML = '<div class="qa-empty">Searching\u2026</div>';

    // Build search across both pending + approved (or just one if mode set).
    var modesToSearch = mode ? [mode] : ['pending', 'approved'];
    var allResults    = [];

    try {
      for (var i = 0; i < modesToSearch.length; i++) {
        var m  = modesToSearch[i];
        var url = '/api/qa-questions?mode=' + m + '&limit=80';
        if (query)   url += '&q='       + encodeURIComponent(query);
        if (subject) url += '&subject=' + encodeURIComponent(subject);
        var res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + adminSession.access_token } });
        if (!res.ok) continue;
        var data = await res.json();
        (data.questions || []).forEach(function (q) {
          allResults.push({ q: q, src: m });
        });
      }
    } catch (e) {
      el.innerHTML = '<div class="qa-empty">Search failed: ' + esc(e.message) + '</div>';
      return;
    }

    if (!allResults.length) {
      el.innerHTML = '<div class="qa-empty">No results.</div>';
      return;
    }

    el.innerHTML = allResults.map(function (item, i) {
      var q       = item.q;
      var isSynth = (q.topic || '').toLowerCase() === 'synthesis';
      var srcBadge = item.src === 'pending'
        ? '<span style="color:var(--brand-amber);font-size:9px;font-weight:700;text-transform:uppercase;">PENDING</span>'
        : '<span style="color:var(--brand-mint);font-size:9px;font-weight:700;text-transform:uppercase;">LIVE</span>';
      return '<div class="qa-item" onclick="window.qaSearchSelect(' + i + ')">'
        + '<div class="qa-item-title">' + esc(sidebarPreviewText(q).slice(0, 80)) + '</div>'
        + '<div class="qa-item-meta">' + srcBadge + ' ' + (isSynth ? '\u270D\uFE0F ' : '') + esc(q.type || '') + ' \u00B7 ' + esc(q.level || '') + '</div>'
        + '</div>';
    }).join('');

    window._qaSearchResults = allResults;
  };

  window.qaSearchSelect = function (i) {
    var results = window._qaSearchResults || [];
    if (!results[i]) return;
    var q   = results[i].q;
    var src = results[i].src;
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
    if (preview) preview.textContent = qaBuildInstructions(connector, position) || '\u2014';
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
    if (aaGrp)    aaGrp.style.display    = isShortAns ? '' : 'none';
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
    // Pending = approved_at IS NULL. Server returns approved_at as null or ISO string.
    var isPending = !qaCurrentQ.approved_at;
    if (isPending) {
      bar.innerHTML =
        '<button class="btn btn-primary hover-lift" style="flex:1;" onclick="window.qaApproveNext()">Approve &amp; Next</button>' +
        '<button class="btn btn-secondary hover-lift" onclick="window.qaSaveDraft(this)">Save</button>' +
        '<button class="btn hover-lift" style="color:var(--brand-error);border:1px solid var(--brand-error);background:transparent;" onclick="window.qaDelete()">\uD83D\uDDD1\uFE0F</button>';
    } else {
      bar.innerHTML =
        '<button class="btn hover-lift" style="flex:1;background:rgba(99,102,241,0.1);color:#6366f1;border:1px solid rgba(99,102,241,0.3);" onclick="window.qaReturnToQueue()">Return to Queue</button>' +
        '<button class="btn btn-secondary hover-lift" onclick="window.qaSaveDraft(this)">Save</button>' +
        '<button class="btn hover-lift" style="color:var(--brand-error);border:1px solid var(--brand-error);background:transparent;" onclick="window.qaDelete()">\uD83D\uDDD1\uFE0F</button>';
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
      if (qaQueue.length > 0) {
        setSectionOpen('pending', true);
        if (!qaCurrentQ) { qaCurrentIdx = 0; qaLoadEditor(qaQueue[0]); }
      }
      window.loadQAApproved();
    } catch (e) { qaNotify('Queue load error: ' + e.message, 'error'); }
  };

  window.loadQAApproved = async function () {
    if (!adminSession) return;
    var subject    = (document.getElementById('qaFSubject')    || {}).value || '';
    var level      = (document.getElementById('qaFLevel')      || {}).value || '';
    var type       = (document.getElementById('qaFType')       || {}).value || '';
    var hasDiagram = (document.getElementById('qaFHasDiagram') || {}).value || '';
    var url = '/api/qa-questions?mode=approved&limit=200';
    if (subject)    url += '&subject='     + encodeURIComponent(subject);
    if (level)      url += '&level='       + encodeURIComponent(level);
    if (type)       url += '&type='        + encodeURIComponent(type);
    if (hasDiagram) url += '&has_diagram=' + encodeURIComponent(hasDiagram);
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
    if (!qaQueue.length) { el.innerHTML = '<div class="qa-empty">\uD83C\uDF89 Queue is empty!</div>'; return; }
    el.innerHTML = qaQueue.map(function (q, i) {
      var isSynth = (q.topic || '').toLowerCase() === 'synthesis';
      var hint = '';
      if (isSynth && q.instructions) {
        var p = qaParseInstructions(q.instructions);
        if (p.connector) hint = ' \u00B7 <em>' + esc(p.connector) + '</em>';
      }
      var diag = q.visual_payload ? ' \uD83D\uDCCA' : '';
      return '<div class="qa-item' + (i === qaCurrentIdx ? ' is-active' : '') + '" onclick="window.qaSelectPending(' + i + ')">'
        + '<div class="qa-item-title">' + esc(sidebarPreviewText(q).slice(0, 80)) + '</div>'
        + '<div class="qa-item-meta">' + (isSynth ? '\u270D\uFE0F ' : '') + esc(q.type || '') + ' \u00B7 ' + esc(q.level || '') + diag + hint + '</div>'
        + '</div>';
    }).join('');
  }

  function renderQAApprovedList() {
    var el = document.getElementById('qaApprovedList');
    if (!el) return;
    if (!qaApproved.length) { el.innerHTML = '<div class="qa-empty">No matches.</div>'; return; }
    el.innerHTML = qaApproved.map(function (q, i) {
      var isSynth = (q.topic || '').toLowerCase() === 'synthesis';
      var diag    = q.visual_payload ? ' \uD83D\uDCCA' : '';
      return '<div class="qa-item" onclick="window.qaSelectApproved(' + i + ')">'
        + '<div class="qa-item-title">' + esc(sidebarPreviewText(q).slice(0, 80)) + '</div>'
        + '<div class="qa-item-meta">' + (isSynth ? '\u270D\uFE0F ' : '') + esc(q.type || '') + ' \u00B7 ' + esc(q.level || '') + diag + '</div>'
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

    setVal('qfSubject',        qaDenormSubject(q.subject || ''));
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
    var rawSubj = (document.getElementById('qfSubject') || {}).value || '';
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

    var optionsVal = null, wrongExplVal = null, partsVal = null;
    try { optionsVal   = qaGetJson('qfOptions');   } catch (e) { throw new Error('Options: ' + e.message); }
    try { wrongExplVal = qaGetJson('qfWrongExpl'); } catch (e) { throw new Error('Wrong Explanations: ' + e.message); }
    try { partsVal     = qaGetJson('qfParts');     } catch (e) { throw new Error('Parts: ' + e.message); }

    return {
      subject:            qaNormSubject(rawSubj),
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
    if (btn) { btn.textContent = '\u23F3 Saving\u2026'; btn.disabled = true; }
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
      qaNotify('\u2705 Approved!', 'success');

      if (qaQueue.length === 0) {
        qaCurrentQ = null; qaCurrentIdx = -1;
        document.getElementById('qaEditorEmpty').style.display = '';
        document.getElementById('qaEditorInner').style.display = 'none';
        document.getElementById('qaPreview').innerHTML = '<div class="qa-empty-state"><div style="font-size:2rem;">\uD83C\uDF89</div><div class="text-sm">Queue complete! All questions reviewed.</div></div>';
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
      if (btn) { btn.textContent = '\u2705 Approve & Next'; btn.disabled = false; }
    }
  };

  // ── WORKFLOW: SAVE DRAFT ──────────────────────────────────────────────────
  window.qaSaveDraft = async function (btn) {
    if (!qaCurrentQ) { qaNotify('No question selected.', 'error'); return; }
    var origText = btn ? btn.textContent : '';
    if (btn) { btn.textContent = '\u23F3 Saving\u2026'; btn.disabled = true; }
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
      qaNotify('\uD83D\uDCBE Saved!', 'success');
      if (btn) { btn.textContent = '\u2705 Saved!'; setTimeout(function () { btn.textContent = origText; btn.disabled = false; }, 1400); }
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
      qaNotify('\uD83D\uDDD1\uFE0F Deleted', 'info');
      if (qaQueue.length === 0) {
        qaCurrentQ = null; qaCurrentIdx = -1;
        document.getElementById('qaEditorEmpty').style.display = '';
        document.getElementById('qaEditorInner').style.display = 'none';
        document.getElementById('qaPreview').innerHTML = '<div class="qa-empty-state"><div style="font-size:2rem;">\u2705</div><div class="text-sm">Queue empty.</div></div>';
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
      qaCurrentQ.approved_at = null; // mark pending locally
      qaQueue.unshift(qaCurrentQ);
      qaApproved = qaApproved.filter(function (q) { return q.id !== qaCurrentQ.id; });
      renderQAPendingList(); renderQAApprovedList();
      setSectionOpen('pending', true);
      var cnt   = document.getElementById('qaQueueCount'); if (cnt)   cnt.textContent   = qaQueue.length;
      var badge = document.getElementById('qaTabBadge');   if (badge) badge.textContent = qaQueue.length;
      qaPending = qaQueue.length; renderPulse();
      renderQAActionBar();
      qaNotify('\u21A9\uFE0F Returned to queue', 'info');
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
      passage: qaCurrentQ.passage,
      passage_lines: qaCurrentQ.passage_lines,
      blanks: qaCurrentQ.blanks,
      visual_payload: qaCurrentQ.visual_payload,
    });
  }

  window.qaLivePreview = qaLivePreview;

  // ── VISUAL PAYLOAD RENDERER ───────────────────────────────────────────────
  // v3.0 fix #2: matches quiz.js renderVisualPayload exactly so previews look
  // identical to the live student view. Falls back gracefully if DiagramLibrary
  // isn't loaded or the function name doesn't exist.
  function renderVisualPayload(visual_payload) {
    if (!visual_payload) return '';
    if (typeof DiagramLibrary === 'undefined') {
      return '<div class="qa-diagram-warn" style="padding:var(--space-3);background:var(--bg-elevated);border:1px dashed var(--border-light);border-radius:var(--radius-md);font-size:var(--text-xs);color:var(--text-muted);">\uD83D\uDCCA diagram-library.js not loaded</div>';
    }
    if (visual_payload.engine !== 'diagram-library') return '';
    try {
      var fnName = visual_payload.function_name;
      var params = visual_payload.params || {};
      if (typeof DiagramLibrary[fnName] === 'function') {
        var svgHtml = DiagramLibrary[fnName](params);
        if (String(svgHtml).indexOf('NaN') !== -1) throw new Error('NaN in generated geometry');
        return '<div class="procedural-diagram mb-4 mx-auto" style="max-width:600px;overflow-x:auto;display:flex;justify-content:center;">' + svgHtml + '</div>';
      }
      return '<div class="qa-diagram-warn" style="padding:var(--space-3);background:var(--bg-elevated);border:1px dashed var(--border-light);border-radius:var(--radius-md);font-size:var(--text-xs);color:var(--text-muted);">Unknown DiagramLibrary function: ' + esc(fnName) + '</div>';
    } catch (err) {
      console.error('[qa] visual_payload render error:', err);
      return '<div class="qa-diagram-warn" style="padding:var(--space-3);background:var(--bg-elevated);border:1px dashed var(--brand-error);border-radius:var(--radius-md);font-size:var(--text-xs);color:var(--brand-error);">Diagram render error: ' + esc(err.message) + '</div>';
    }
  }

  // ── PREVIEW RENDERER ──────────────────────────────────────────────────────
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
    if (q.visual_payload)  html += '<span class="badge" style="background:rgba(57,255,179,0.1);color:var(--brand-mint);">\uD83D\uDCCA Diagram</span>';
    html += '</div>';

    if (q.topic) html += '<div class="text-xs font-bold text-muted uppercase mb-4" style="letter-spacing:0.06em;">'
      + esc(q.topic) + (q.sub_topic ? ' \u203A ' + esc(q.sub_topic) : '') + '</div>';

    // ══ VISUAL PAYLOAD (renders before question_text, like quiz.js) ═════════
    if (q.visual_payload) html += renderVisualPayload(q.visual_payload);

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
        html += '<div class="qa-accept-also">';
        html += '<div class="qa-accept-also-lbl">Also Accepted</div>';
        aa.forEach(function (alt) { html += '<div class="qa-accept-also-item">\u2022 ' + esc(alt) + '</div>'; });
        html += '</div>';
      }

      if (q.worked_solution) html += '<div class="qa-solution-box mt-3"><div class="qa-solution-lbl">\uD83D\uDCCB Worked Solution</div><div class="text-sm text-main">' + renderHtml(q.worked_solution) + '</div></div>';

    // ══ MCQ ═════════════════════════════════════════════════════════════════
    } else if (type === 'mcq') {
      if (q.question_text) html += '<div class="qa-question-stem">' + renderHtml(q.question_text) + '</div>';

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
      if (q.question_text) html += '<div class="qa-question-stem">' + renderHtml(q.question_text) + '</div>';
      if (q.instructions)  html += '<div class="text-sm text-muted mb-3 italic">' + esc(q.instructions) + '</div>';
      html += '<div class="p-3 rounded mb-3" style="background:var(--bg-elevated);border:1px solid var(--border-light);"><div class="text-xs text-muted mb-2">Student writes answer here</div><div style="height:32px;border:1px solid var(--border-dark);border-radius:var(--radius-sm);background:var(--bg-surface);"></div></div>';
      if (q.correct_answer)  html += '<div class="qa-solution-box"><div class="qa-solution-lbl">\u2713 Correct Answer</div><div class="text-sm text-main">' + esc(q.correct_answer) + '</div></div>';

      // Also accepted (uses style.css class instead of Tailwind)
      var aa2 = q.accept_also || [];
      if (typeof aa2 === 'string') { try { aa2 = JSON.parse(aa2); } catch (e) { aa2 = []; } }
      if (!Array.isArray(aa2)) aa2 = [];
      aa2 = aa2.filter(Boolean);
      if (aa2.length) {
        html += '<div class="qa-accept-also">';
        html += '<div class="qa-accept-also-lbl">Also Accepted</div>';
        aa2.forEach(function (alt) { html += '<div class="qa-accept-also-item">\u2022 ' + esc(alt) + '</div>'; });
        html += '</div>';
      }

      if (q.worked_solution) html += '<div class="qa-solution-box mt-3"><div class="qa-solution-lbl">\uD83D\uDCCB Worked Solution</div><div class="text-sm text-main">' + renderHtml(q.worked_solution) + '</div></div>';

    // ══ WORD PROBLEM / OPEN ENDED ════════════════════════════════════════════
    } else if (type === 'word_problem' || type === 'open_ended') {
      if (q.question_text) html += '<div class="qa-question-stem">' + renderHtml(q.question_text) + '</div>';
      var wParts = [];
      try { wParts = typeof q.parts === 'string' ? JSON.parse(q.parts) : (Array.isArray(q.parts) ? q.parts : []); } catch (e) {}
      wParts.forEach(function (p, i) {
        html += '<div class="mb-4 p-4 rounded" style="border-left:3px solid var(--brand-sage);background:var(--bg-elevated);">';
        html += '<div class="font-bold text-sm" style="color:var(--brand-sage);">' + esc(p.label || '(' + String.fromCharCode(97+i) + ')') + ' <span class="text-muted font-normal text-xs">(' + (p.marks||1) + ' mk)</span></div>';
        if (p.question) html += '<div class="text-sm text-main mt-2">' + renderHtml(p.question) + '</div>';
        var ans = p.model_answer || p.correct_answer || p.worked_solution || '';
        if (ans) html += '<div class="text-xs mt-2 font-bold" style="color:var(--brand-mint);">\u2713 ' + esc(ans).slice(0,180) + (ans.length > 180 ? '\u2026' : '') + '</div>';
        html += '</div>';
      });
      if (q.worked_solution) html += '<div class="qa-solution-box mt-3"><div class="qa-solution-lbl">\uD83D\uDCCB Worked Solution</div><div class="text-sm text-main">' + renderHtml(q.worked_solution) + '</div></div>';

    // ══ CLOZE ════════════════════════════════════════════════════════════════
    } else if (type === 'cloze') {
      // Cloze passage often has literal <br> markup from generation. Render properly.
      var clozeText = q.passage || q.question_text || '';
      var passageHtml = renderPassageHtml(clozeText).replace(/\[(\d+)\]/g, function (m, n) {
        return '<span style="display:inline-block;min-width:70px;border-bottom:2px solid var(--brand-rose);text-align:center;margin:0 2px;color:var(--brand-rose);">[' + n + ']</span>';
      });
      html += '<div class="p-4 rounded mb-4" style="background:var(--bg-elevated);line-height:2;font-size:var(--text-sm);">' + passageHtml + '</div>';
      var blanks = [];
      try { blanks = typeof q.blanks === 'string' ? JSON.parse(q.blanks) : (Array.isArray(q.blanks) ? q.blanks : []); } catch (e) {}
      if (blanks.length) {
        html += '<div class="flex flex-wrap gap-2">';
        blanks.forEach(function (b) {
          html += '<span class="badge">[' + (b.number||b.id) + '] <span style="color:var(--brand-mint);">' + esc(b.correct_answer||'') + '</span></span>';
        });
        html += '</div>';
      }

    // ══ EDITING ══════════════════════════════════════════════════════════════
    // v3.0 fix #8: real data stores passage as inline HTML in q.passage with
    // <u>word</u> [N] markers. passage_lines is null. Try passage_lines first
    // (legacy schema), fall back to rendering passage HTML.
    } else if (type === 'editing') {
      var lines = [];
      try { lines = typeof q.passage_lines === 'string' ? JSON.parse(q.passage_lines) : (Array.isArray(q.passage_lines) ? q.passage_lines : []); } catch (e) {}
      if (lines.length) {
        // Legacy schema: structured per-line objects
        html += '<div class="p-4 rounded" style="background:var(--bg-elevated);font-size:var(--text-base);line-height:2.4;">';
        lines.forEach(function (line) {
          var text = esc(line.text || '');
          if (line.underlined_word) {
            var colour = line.has_error ? 'var(--brand-error)' : 'var(--text-main)';
            text = text.replace(esc(line.underlined_word), '<u style="color:' + colour + ';font-weight:700;">' + esc(line.underlined_word) + '</u>');
          }
          html += '<div>' + text + (line.has_error ? ' <span style="color:var(--brand-mint);font-size:11px;">[\u2192 ' + esc(line.correct_word||'') + ']</span>' : '') + '</div>';
        });
        html += '</div>';
      } else if (q.passage) {
        // Current schema: passage is inline HTML with <u>word</u> [N] markers
        html += '<div class="p-4 rounded" style="background:var(--bg-elevated);font-size:var(--text-base);line-height:2;">';
        html += renderPassageHtml(q.passage);
        html += '</div>';
        // Show parts (the corrections list) if present
        var ePartsArr = [];
        try { ePartsArr = typeof q.parts === 'string' ? JSON.parse(q.parts) : (Array.isArray(q.parts) ? q.parts : []); } catch (e) {}
        if (ePartsArr.length) {
          html += '<div class="qa-accept-also" style="margin-top:var(--space-3);">';
          html += '<div class="qa-accept-also-lbl">Corrections</div>';
          ePartsArr.forEach(function (p, i) {
            var num = p.number || p.label || (i + 1);
            var wrong = p.underlined_word || p.wrong || p.error || '';
            var right = p.correct_word || p.correct_answer || p.model_answer || '';
            html += '<div class="qa-accept-also-item">[' + esc(num) + '] '
              + (wrong ? '<span style="color:var(--brand-error);text-decoration:line-through;">' + esc(wrong) + '</span> \u2192 ' : '')
              + '<span style="color:var(--brand-mint);font-weight:700;">' + esc(right) + '</span></div>';
          });
          html += '</div>';
        }
      }

    // ══ COMPREHENSION / VISUAL TEXT ══════════════════════════════════════════
    // v3.0 fix #5: show ALL parts (was capped at 4), pull answers from parts[i].model_answer,
    // and renderHtml() on passage so <br> markup renders as line breaks.
    } else if (type === 'comprehension' || type === 'visual_text') {
      if (q.passage) html += '<div class="p-3 rounded mb-4 text-sm" style="background:var(--bg-elevated);max-height:240px;overflow-y:auto;line-height:1.7;">' + renderPassageHtml(q.passage) + '</div>';
      var cParts = [];
      try { cParts = typeof q.parts === 'string' ? JSON.parse(q.parts) : (Array.isArray(q.parts) ? q.parts : []); } catch (e) {}
      cParts.forEach(function (p, i) {
        var ptMarks   = p.marks || 1;
        var ptType    = p.part_type || '';
        var ptLabel   = p.label || ('Q' + (i + 1));
        var ptAnswer  = p.model_answer || p.correct_answer || '';

        // Build referent/sequencing/true_false answer if part-specific structure
        if (!ptAnswer && p.part_type === 'referent' && Array.isArray(p.items)) {
          ptAnswer = p.items.map(function (it) { return it.word + ' \u2192 ' + (it.correct_answer || ''); }).join('; ');
        }
        if (!ptAnswer && p.part_type === 'sequencing' && Array.isArray(p.correct_order)) {
          ptAnswer = 'Order: ' + p.correct_order.join(', ');
        }
        if (!ptAnswer && p.part_type === 'true_false' && Array.isArray(p.items)) {
          ptAnswer = p.items.map(function (it) { return '"' + (it.statement || '') + '" \u2192 ' + (it.correct_answer || ''); }).join('; ');
        }

        html += '<div class="mb-2 p-4 rounded" style="background:var(--bg-elevated);border-left:3px solid var(--brand-sage);">';
        html += '<span class="font-bold text-sm" style="color:var(--brand-sage);">' + esc(ptLabel) + '</span> ';
        html += '<span class="text-xs text-muted">(' + esc(ptType) + ' \u00B7 ' + ptMarks + ' mk)</span>';
        if (p.question || p.instructions) html += '<div class="text-sm text-main mt-2">' + renderHtml(p.question || p.instructions || '') + '</div>';

        // MCQ-style options if present
        if (Array.isArray(p.options) && p.options.length) {
          html += '<div style="margin-top:var(--space-2);">';
          p.options.forEach(function (opt, oi) {
            var optLetter = letters[oi];
            var isOptCorrect = String(p.correct_answer || '').toUpperCase() === optLetter || p.correct_answer === opt;
            html += '<div style="font-size:var(--text-xs);margin:2px 0;color:' + (isOptCorrect ? 'var(--brand-mint)' : 'var(--text-muted)') + ';">'
              + (isOptCorrect ? '\u2713 ' : '\u00B7 ') + esc(optLetter) + '. ' + esc(opt) + '</div>';
          });
          html += '</div>';
        }

        if (ptAnswer) {
          html += '<div class="text-xs mt-2 font-bold" style="color:var(--brand-mint);">\u2713 ' + esc(String(ptAnswer)).slice(0, 240) + (String(ptAnswer).length > 240 ? '\u2026' : '') + '</div>';
        }
        html += '</div>';
      });
      if (q.worked_solution) html += '<div class="qa-solution-box mt-3"><div class="qa-solution-lbl">\uD83D\uDCCB Worked Solution</div><div class="text-sm text-main">' + renderHtml(q.worked_solution) + '</div></div>';

    // ══ FALLBACK ═════════════════════════════════════════════════════════════
    } else {
      if (q.question_text)  html += '<div class="qa-question-stem">' + renderHtml(q.question_text) + '</div>';
      if (q.correct_answer) html += '<div class="qa-solution-box"><div class="qa-solution-lbl">\u2713 Answer</div><div class="text-sm text-main">' + esc(q.correct_answer) + '</div></div>';
      if (q.worked_solution) html += '<div class="qa-solution-box mt-3"><div class="qa-solution-lbl">\uD83D\uDCCB Worked Solution</div><div class="text-sm text-main">' + renderHtml(q.worked_solution) + '</div></div>';
    }

    el.innerHTML = html;
  }


  // ════════════════════════════════════════════════════════════════════════
  // COMMIT 4a — SYLLABUS CANON LOADING
  // ════════════════════════════════════════════════════════════════════════

  async function qaLoadSyllabus() {
    if (qaSyllabus) return qaSyllabus;
    try {
      var mod = await import('/js/syllabus.js');
      qaSyllabus = {
        canonical: mod.CANONICAL_SYLLABUS,
        subjectKey: function (s) {
          if (!s) return null;
          var k = s.toLowerCase();
          if (k.indexOf('math') === 0) return 'mathematics';
          if (k.indexOf('sci')  === 0) return 'science';
          if (k.indexOf('eng')  === 0) return 'english';
          return null;
        }
      };
      window.qaSyllabus = qaSyllabus;
      return qaSyllabus;
    } catch (err) {
      console.error('[qa] failed to load syllabus.js:', err);
      qaSyllabus = { canonical: null, subjectKey: function () { return null; } };
      return qaSyllabus;
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // COMMIT 4a — CASCADING DROPDOWNS
  // ════════════════════════════════════════════════════════════════════════

  // Fetch level+subject's canonical (topic, sub_topic) pairs from Supabase.
  // Cached — first call per (level, subject) hits DB, subsequent are instant.
  // This is the SAME table the FK validates against on save, so dropdowns
  // can never offer a combo that will fail to save.
  async function qaFetchLevelCanon(level, subject) {
    if (!level || !subject) return [];
    var key = level + '|' + subject;
    if (qaLevelCanonCache[key]) return qaLevelCanonCache[key];
    try {
      var sb = await getSupabase();
      var res = await sb
        .from('canon_level_topics')
        .select('topic, sub_topic')
        .eq('level', level)
        .eq('subject', subject)
        .order('topic')
        .order('sub_topic');
      if (res.error) throw res.error;
      qaLevelCanonCache[key] = res.data || [];
      return qaLevelCanonCache[key];
    } catch (err) {
      console.error('[qa] canon_level_topics fetch failed:', err);
      return [];
    }
  }

  async function qaPopulateTopics(currentTopic) {
    var sel = document.getElementById('qfTopic');
    if (!sel) return;
    var formSubj = (document.getElementById('qfSubject') || {}).value || '';
    var level    = (document.getElementById('qfLevel')   || {}).value || '';
    var dbSubj   = qaNormSubject(formSubj);

    var rows = await qaFetchLevelCanon(level, dbSubj);
    var topics = [];
    var seenT = {};
    rows.forEach(function (r) {
      if (!seenT[r.topic]) { seenT[r.topic] = true; topics.push(r.topic); }
    });

    var html = '<option value="">— Select —</option>';
    topics.forEach(function (t) {
      html += '<option value="' + esc(t) + '">' + esc(t) + '</option>';
    });
    if (currentTopic && !seenT[currentTopic]) {
      html += '<option value="' + esc(currentTopic) + '">(off-canon: ' + esc(currentTopic) + ')</option>';
    }
    sel.innerHTML = html;
    if (currentTopic) sel.value = currentTopic;
  }

  async function qaPopulateSubTopics(currentSubTopic) {
    var sel = document.getElementById('qfSubTopic');
    if (!sel) return;
    var formSubj = (document.getElementById('qfSubject') || {}).value || '';
    var level    = (document.getElementById('qfLevel')   || {}).value || '';
    var topic    = (document.getElementById('qfTopic')   || {}).value || '';
    var dbSubj   = qaNormSubject(formSubj);

    var rows = await qaFetchLevelCanon(level, dbSubj);
    var subs = rows.filter(function (r) { return r.topic === topic; }).map(function (r) { return r.sub_topic; });
    var seen = {};
    var html = '<option value="">— Select —</option>';
    subs.forEach(function (st) {
      if (seen[st]) return; seen[st] = true;
      html += '<option value="' + esc(st) + '">' + esc(st) + '</option>';
    });
    if (currentSubTopic && !seen[currentSubTopic]) {
      html += '<option value="' + esc(currentSubTopic) + '">(off-canon: ' + esc(currentSubTopic) + ')</option>';
    }
    sel.innerHTML = html;
    if (currentSubTopic) sel.value = currentSubTopic;
  }

  window.qaOnSubjectChange = async function () {
    await qaPopulateTopics(''); // reset topic — subject changed
    await qaPopulateSubTopics('');
    window.qaLivePreview();
  };

  window.qaOnLevelChange = async function () {
    // Level change invalidates topic/sub-topic — they're level-filtered.
    await qaPopulateTopics('');
    await qaPopulateSubTopics('');
    window.qaLivePreview();
  };

  var _qaOnTopicChangeOrig = window.qaOnTopicChange;
  window.qaOnTopicChange = async function () {
    await qaPopulateSubTopics('');
    if (typeof _qaOnTopicChangeOrig === 'function') _qaOnTopicChangeOrig();
    window.qaLivePreview();
  };


  // ════════════════════════════════════════════════════════════════════════
  // COMMIT 4a — MANUAL FLAG TOGGLE + AUTO-FLAG ADVISORIES
  // ════════════════════════════════════════════════════════════════════════

  function qaIsFlagged(q) { return q && q.flag_review === true; }

  function qaUpdateFlagToggleUI() {
    var btn = document.getElementById('qaFlagToggle');
    if (!btn) return;
    var lbl = btn.querySelector('.qa-flag-toggle__lbl');
    var on  = qaIsFlagged(qaCurrentQ);
    btn.classList.toggle('is-flagged', on);
    if (lbl) lbl.textContent = on ? 'Flagged' : 'Flag for Review';
  }

  function qaRenderRuleHits() {
    var el = document.getElementById('qaRuleHits');
    if (!el) return;
    if (!qaCurrentQ || !window.qaRules) { el.innerHTML = ''; return; }
    var hits = window.qaRules.evaluateAll(qaCurrentQ);
    if (hits.length === 0) { el.innerHTML = ''; return; }
    el.innerHTML = hits.map(function (h) {
      return '<div class="qa-rule-hit qa-rule-hit--' + h.severity + '">'
        + '<span class="qa-rule-hit__rule">' + esc(h.rule) + '</span>'
        + '<span class="qa-rule-hit__msg">' + esc(h.message) + '</span>'
        + '</div>';
    }).join('');
  }

  window.qaToggleFlag = async function () {
    if (!qaCurrentQ) { qaNotify('No question selected.', 'error'); return; }
    var newVal = !qaIsFlagged(qaCurrentQ);
    var btn = document.getElementById('qaFlagToggle');
    if (btn) btn.disabled = true;
    try {
      var res = await fetch('/api/qa-questions', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + adminSession.access_token,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify({
          id: qaCurrentQ.id,
          fields: { flag_review: newVal },
          auditAction: newVal ? 'flagged' : 'unflagged'
        })
      });
      if (!res.ok) {
        var err = await res.json().catch(function () { return {}; });
        throw new Error(err.error || res.statusText);
      }
      qaCurrentQ.flag_review = newVal;
      var inQueue = qaQueue.find(function (x) { return x.id === qaCurrentQ.id; });
      if (inQueue) inQueue.flag_review = newVal;
      var inApprov = qaApproved.find(function (x) { return x.id === qaCurrentQ.id; });
      if (inApprov) inApprov.flag_review = newVal;
      qaUpdateFlagToggleUI();
      qaUpdateFlaggedCount();
      qaTagFlaggedItems();
      delete qaAuditCache[qaCurrentQ.id];
      if (qaAuditOpen) qaLoadAuditTrail(qaCurrentQ.id, true);
      qaNotify(newVal ? 'Flagged' : 'Unflagged', 'success');
    } catch (err) {
      qaNotify('Flag toggle failed: ' + err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  function qaUpdateFlaggedCount() {
    var n = 0;
    qaQueue.forEach(function (q) { if (qaIsFlagged(q)) n++; });
    qaApproved.forEach(function (q) { if (qaIsFlagged(q)) n++; });
    var el = document.getElementById('qaFlaggedCount');
    if (el) el.textContent = n;
  }

  window.qaApplyFlaggedOnly = function () {
    var on = !!(document.getElementById('qaFlaggedOnly') || {}).checked;
    var sb = document.getElementById('qaSidebar');
    if (sb) sb.classList.toggle('flagged-only', on);
    if (on) {
      qaSectionOpen.pending = true;
      qaSectionOpen.approved = true;
      qaSectionOpen.find = true;
      ['pending', 'approved', 'find'].forEach(function (k) {
        var body = document.getElementById('qa' + k.charAt(0).toUpperCase() + k.slice(1) + 'Body');
        var caret = document.getElementById('qa' + k.charAt(0).toUpperCase() + k.slice(1) + 'Toggle');
        if (body) body.style.display = '';
        if (caret) caret.style.transform = 'rotate(90deg)';
      });
    }
  };


  // ════════════════════════════════════════════════════════════════════════
  // COMMIT 4a — AUDIT TRAIL UI
  // ════════════════════════════════════════════════════════════════════════

  function qaActionLabel(action) {
    return action.charAt(0).toUpperCase() + action.slice(1);
  }

  function qaFmtAuditTime(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      return d.toLocaleString('en-SG', {
        day: 'numeric', month: 'short', year: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      });
    } catch (e) { return iso; }
  }

  async function qaLoadAuditTrail(questionId, force) {
    var body = document.getElementById('qaAuditBody');
    var countEl = document.getElementById('qaAuditCount');
    if (!body) return;
    if (!force && qaAuditCache[questionId]) {
      qaRenderAuditEvents(qaAuditCache[questionId]);
      if (countEl) countEl.textContent = qaAuditCache[questionId].length;
      return;
    }
    body.innerHTML = '<div class="qa-empty">Loading…</div>';
    try {
      var res = await fetch(
        '/api/qa-questions?action=audit_trail&id=' + encodeURIComponent(questionId),
        { headers: { 'Authorization': 'Bearer ' + adminSession.access_token } }
      );
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      var events = data.events || [];
      qaAuditCache[questionId] = events;
      if (countEl) countEl.textContent = events.length;
      qaRenderAuditEvents(events);
    } catch (err) {
      body.innerHTML = '<div class="qa-empty">Failed to load: ' + esc(err.message) + '</div>';
    }
  }

  function qaRenderAuditEvents(events) {
    var body = document.getElementById('qaAuditBody');
    if (!body) return;
    if (!events.length) {
      body.innerHTML = '<div class="qa-empty">No audit events.</div>';
      return;
    }
    body.innerHTML = events.map(function (e) {
      var who = e.reviewer ? esc(e.reviewer.name) : '<span class="cell-muted">system</span>';
      var notes = e.notes ? '<div class="qa-audit-event__notes">"' + esc(e.notes) + '"</div>' : '';
      return '<div class="qa-audit-event">'
        + '<div class="qa-audit-event__head">'
        +   '<span class="qa-audit-event__action qa-audit-event__action--' + esc(e.action) + '">'
        +     qaActionLabel(e.action)
        +   '</span>'
        +   '<span class="qa-audit-event__when">' + qaFmtAuditTime(e.created_at) + '</span>'
        + '</div>'
        + '<div class="qa-audit-event__who">' + who + '</div>'
        + notes
        + '</div>';
    }).join('');
  }

  window.qaToggleAuditPanel = function () {
    qaAuditOpen = !qaAuditOpen;
    var panel = document.getElementById('qaAuditPanel');
    var body  = document.getElementById('qaAuditBody');
    if (panel) panel.classList.toggle('is-open', qaAuditOpen);
    if (body)  body.style.display = qaAuditOpen ? '' : 'none';
    if (qaAuditOpen && qaCurrentQ) qaLoadAuditTrail(qaCurrentQ.id);
  };


  // ════════════════════════════════════════════════════════════════════════
  // COMMIT 4a — PANE RESIZERS
  // ════════════════════════════════════════════════════════════════════════

  var QA_RESIZE_KEY = 'admin_pane_widths_v1';
  var QA_DEFAULTS = { sidebar: 280, editor: 460 };
  var QA_MINS = { sidebar: 220, editor: 360 };
  var QA_MAXS = { sidebar: 480, editor: 720 };

  function qaApplyPaneWidths() {
    var saved;
    try { saved = JSON.parse(localStorage.getItem(QA_RESIZE_KEY) || '{}'); } catch (e) { saved = {}; }
    var sb = document.getElementById('qaSidebar');
    var ed = document.getElementById('qaEditorPane');
    if (sb) sb.style.width = (saved.sidebar || QA_DEFAULTS.sidebar) + 'px';
    if (ed) ed.style.width = (saved.editor  || QA_DEFAULTS.editor)  + 'px';
  }

  function qaSavePaneWidths(patch) {
    var saved;
    try { saved = JSON.parse(localStorage.getItem(QA_RESIZE_KEY) || '{}'); } catch (e) { saved = {}; }
    Object.keys(patch).forEach(function (k) { saved[k] = patch[k]; });
    try { localStorage.setItem(QA_RESIZE_KEY, JSON.stringify(saved)); } catch (e) {}
  }

  function qaInitResizers() {
    var resizers = document.querySelectorAll('.qa-resizer');
    resizers.forEach(function (r) {
      r.addEventListener('mousedown', function (e) {
        e.preventDefault();
        var target = r.getAttribute('data-resize-target');
        var pane = document.getElementById(target === 'sidebar' ? 'qaSidebar' : 'qaEditorPane');
        if (!pane) return;
        var startX = e.clientX;
        var startW = pane.getBoundingClientRect().width;
        document.body.classList.add('qa-resizing');
        r.classList.add('is-dragging');

        function onMove(ev) {
          var dx = ev.clientX - startX;
          var newW = startW + dx;
          newW = Math.max(QA_MINS[target], Math.min(QA_MAXS[target], newW));
          pane.style.width = newW + 'px';
        }
        function onUp() {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.classList.remove('qa-resizing');
          r.classList.remove('is-dragging');
          var finalW = pane.getBoundingClientRect().width;
          var patch = {}; patch[target] = Math.round(finalW);
          qaSavePaneWidths(patch);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }


  // ════════════════════════════════════════════════════════════════════════
  // COMMIT 4a — HOOKS INTO EXISTING qaLoadEditor + sidebar render
  // ════════════════════════════════════════════════════════════════════════

  document.addEventListener('DOMContentLoaded', function () {
    qaApplyPaneWidths();
    qaInitResizers();
    qaLoadSyllabus();
    qaPopulateTopics('');
    qaPopulateSubTopics('');
    // Expose IIFE-scoped state to qa-power.js (Commit 4b)
    window._qaQueueRef       = function () { return qaQueue; };
    window._qaApprovedRef    = function () { return qaApproved; };
    window._qaCurrentIdxRef  = function () { return qaCurrentIdx; };
    window._qaPanelNotify    = qaNotify;
  });

  function qaPostSelectHook() {
    if (!qaCurrentQ) return;
    window._qaCurrentSnapshot = qaCurrentQ;
    qaPopulateTopics(qaCurrentQ.topic || '').then(function () {
      return qaPopulateSubTopics(qaCurrentQ.sub_topic || '');
    });
    qaUpdateFlagToggleUI();
    qaRenderRuleHits();
    qaAuditOpen = false;
    var panel = document.getElementById('qaAuditPanel');
    var body  = document.getElementById('qaAuditBody');
    var count = document.getElementById('qaAuditCount');
    if (panel) panel.classList.remove('is-open');
    if (body)  body.style.display = 'none';
    if (count) count.textContent = '—';
  }

  ['qaSelectPending', 'qaSelectApproved', 'qaSearchSelect'].forEach(function (fnName) {
    var orig = window[fnName];
    if (typeof orig !== 'function') return;
    window[fnName] = function () {
      orig.apply(this, arguments);
      qaPostSelectHook();
    };
  });

  var _origQaLivePreview = window.qaLivePreview;
  window.qaLivePreview = function () {
    if (typeof _origQaLivePreview === 'function') _origQaLivePreview.apply(this, arguments);
    if (qaCurrentQ) {
      var draft = Object.assign({}, qaCurrentQ);
      var f = ['Subject','Level','Type','Topic','SubTopic','Difficulty','QuestionText','CorrectAnswer','WorkedSolution'];
      var keys = ['subject','level','type','topic','sub_topic','difficulty','question_text','correct_answer','worked_solution'];
      f.forEach(function (id, i) {
        var el = document.getElementById('qf' + id);
        if (el) draft[keys[i]] = el.value;
      });
      var saved = qaCurrentQ;
      qaCurrentQ = draft;
      qaRenderRuleHits();
      qaCurrentQ = saved;
    }
  };

  function qaTagFlaggedItems() {
    var allFlagged = {};
    qaQueue.forEach(function (q) { if (qaIsFlagged(q)) allFlagged[q.id] = true; });
    qaApproved.forEach(function (q) { if (qaIsFlagged(q)) allFlagged[q.id] = true; });

    function tag(listEl, sourceArr) {
      if (!listEl) return;
      var nodes = listEl.querySelectorAll('.qa-item');
      nodes.forEach(function (node, i) {
        var src = sourceArr[i];
        if (src && allFlagged[src.id]) node.classList.add('is-flagged');
        else node.classList.remove('is-flagged');
      });
    }
    tag(document.getElementById('qaPendingList'),  qaQueue);
    tag(document.getElementById('qaApprovedList'), qaApproved);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var view = document.getElementById('qaView');
    if (!view) return;
    var mo = new MutationObserver(function () {
      qaTagFlaggedItems();
      qaUpdateFlaggedCount();
    });
    var pl = document.getElementById('qaPendingList');
    var al = document.getElementById('qaApprovedList');
    if (pl) mo.observe(pl, { childList: true });
    if (al) mo.observe(al, { childList: true });
  });

  var _origLoadQueue = window.loadQAQueue;
  if (typeof _origLoadQueue === 'function') {
    window.loadQAQueue = async function () {
      await _origLoadQueue.apply(this, arguments);
      qaUpdateFlaggedCount();
      qaTagFlaggedItems();
    };
  }
  var _origLoadApproved = window.loadQAApproved;
  if (typeof _origLoadApproved === 'function') {
    window.loadQAApproved = async function () {
      await _origLoadApproved.apply(this, arguments);
      qaUpdateFlaggedCount();
      qaTagFlaggedItems();
    };
  }

}()); // end IIFE