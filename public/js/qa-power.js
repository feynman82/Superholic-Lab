/* ════════════════════════════════════════════════════════════════════════════
   js/qa-power.js  —  v1.0  (Commit 4b)
   ----------------------------------------------------------------------------
   Power-user UX for the QA panel. Layered on top of qa-panel.js (4a) so all
   wiring is contained in one file and 4a stays unmodified.

   Features:
     1. Diagram-library picker (introspects window.DiagramLibrary at runtime)
     2. Per-rule sidebar count pills + click-to-filter
     3. Keyboard shortcuts (j/k/a/s/f/e/Esc and ?)
     4. Cmd+K command palette with fuzzy match
     5. Stats dashboard modal (replaces QA Queue pulse-card click)

   Globals consumed: window.qaRules, window.adminSession, window.DiagramLibrary,
                     window.switchAdminTab, window.qaCurrentQ (read via DOM)
   ════════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // Lightweight handle to qa-panel internals via the editor field DOM
  function _q() { return document.getElementById('qaCurrentMarker') ? null : window._qaCurrentSnapshot; }

  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }


  // ════════════════════════════════════════════════════════════════════════
  // 1. DIAGRAM-LIBRARY PICKER
  // ════════════════════════════════════════════════════════════════════════
  //
  // Surfaces a function-name dropdown + free-form JSON params editor next to
  // the existing live preview. Reads from / writes back to the row's
  // visual_payload column. Function list is Object.keys(window.DiagramLibrary).
  //
  // Save flow: clicking "Apply Diagram" sets visual_payload on a draft and
  // re-renders the preview. The save itself rides the existing PUT path
  // through qaSaveDraft / qaApproveNext — we monkey-patch qaCollectFields
  // to include visual_payload from the picker UI.

  var DIAGRAM_SNIPPETS = {
    // Hand-maintained starter params for common functions. Keys must match
    // window.DiagramLibrary function names exactly.
    bar_model:           '{ "bars": [{"label":"A","value":12},{"label":"B","value":8}], "unit":"" }',
    fraction_strip:      '{ "denominator": 4, "shaded": 3 }',
    number_line:         '{ "min": 0, "max": 10, "marks": [3, 7] }',
    pie_chart:           '{ "slices": [{"label":"Red","value":30},{"label":"Blue","value":70}] }',
    bar_graph:           '{ "title":"Sales", "xLabel":"Day", "yLabel":"Units", "bars":[{"label":"Mon","value":4},{"label":"Tue","value":7}] }',
    line_graph:          '{ "title":"Temp", "xLabel":"Hour", "yLabel":"°C", "points":[[0,20],[6,18],[12,28],[18,24]] }',
    table:               '{ "headers":["Item","Qty"], "rows":[["Apples",3],["Pears",5]] }',
    rectangle:           '{ "width": 10, "height": 6, "label_width":"10 cm", "label_height":"6 cm" }',
    triangle:            '{ "base": 8, "height": 6, "label_base":"8 cm", "label_height":"6 cm" }',
    circle:              '{ "radius": 5, "label_radius":"5 cm" }',
    angle:               '{ "degrees": 45, "label":"x°" }',
    coordinate_grid:     '{ "xMax": 10, "yMax": 10, "points": [{"x":3,"y":4,"label":"P"}] }'
  };

  function injectPickerUI() {
    var editor = document.getElementById('qaEditorInner');
    if (!editor || document.getElementById('qaDiagramPicker')) return;
    // Insert above qaActionBar
    var actionBar = document.getElementById('qaActionBar');
    if (!actionBar) return;

    var div = document.createElement('div');
    div.id = 'qaDiagramPicker';
    div.className = 'qa-diagram-picker';
    div.innerHTML =
        '<div class="qa-diagram-picker__hdr" onclick="window.qaToggleDiagramPicker()">'
      +   '<span class="qa-diagram-picker__lbl">'
      +     '<span data-admin-icon="chart" data-icon-size="12"></span>'
      +     'Diagram'
      +     '<span class="radar-count" id="qaDiagramStatus">none</span>'
      +   '</span>'
      +   '<span id="qaDiagramCaret" class="qa-section-hdr__caret" data-admin-icon="caret-right" data-icon-size="10"></span>'
      + '</div>'
      + '<div class="qa-diagram-picker__body" id="qaDiagramBody" style="display:none;">'
      +   '<div class="qa-field">'
      +     '<label>Function</label>'
      +     '<select id="qaDiagramFn" class="form-select" onchange="window.qaOnDiagramFnChange()">'
      +       '<option value="">— None (clear visual_payload) —</option>'
      +     '</select>'
      +   '</div>'
      +   '<div class="qa-field">'
      +     '<label>Params <span class="qa-field__hint">(JSON)</span></label>'
      +     '<textarea id="qaDiagramParams" class="form-input qa-json-area" rows="6" oninput="window.qaValidateJson(this);window.qaPreviewDiagram()"></textarea>'
      +   '</div>'
      +   '<div class="qa-field" style="flex-direction:row;gap:var(--space-2);">'
      +     '<button type="button" class="btn btn-sm btn-secondary hover-lift" onclick="window.qaPreviewDiagram()">Preview</button>'
      +     '<button type="button" class="btn btn-sm btn-secondary hover-lift" onclick="window.qaApplyDiagramToRow()">Apply to Row</button>'
      +     '<button type="button" class="btn btn-sm hover-lift" style="color:var(--brand-error);border:1px solid var(--brand-error);background:transparent;" onclick="window.qaClearDiagram()">Clear</button>'
      +   '</div>'
      + '</div>';

    actionBar.parentNode.insertBefore(div, actionBar);
    populateDiagramFnDropdown();
    if (typeof window.adminIconRefresh === 'function') window.adminIconRefresh(div);
  }

  function populateDiagramFnDropdown() {
    var sel = document.getElementById('qaDiagramFn');
    if (!sel) return;
    if (typeof window.DiagramLibrary !== 'object' || !window.DiagramLibrary) {
      sel.innerHTML = '<option value="">— DiagramLibrary not loaded —</option>';
      sel.disabled = true;
      return;
    }
    var fns = Object.keys(window.DiagramLibrary)
      .filter(function (k) { return typeof window.DiagramLibrary[k] === 'function'; })
      .sort();
    var html = '<option value="">— None (clear visual_payload) —</option>';
    fns.forEach(function (fn) {
      html += '<option value="' + esc(fn) + '">' + esc(fn) + '</option>';
    });
    sel.innerHTML = html;
  }

  window.qaToggleDiagramPicker = function () {
    var body = document.getElementById('qaDiagramBody');
    var caret = document.getElementById('qaDiagramCaret');
    if (!body) return;
    var open = body.style.display === 'none';
    body.style.display = open ? '' : 'none';
    if (caret) caret.style.transform = open ? 'rotate(90deg)' : '';
  };

  window.qaOnDiagramFnChange = function () {
    var fn = (document.getElementById('qaDiagramFn') || {}).value || '';
    var ta = document.getElementById('qaDiagramParams');
    if (!ta) return;
    if (!fn) { ta.value = ''; window.qaPreviewDiagram(); return; }
    if (DIAGRAM_SNIPPETS[fn]) {
      // Only autofill if textarea is empty or contains a snippet for a different fn
      if (!ta.value.trim() || ta.dataset.snippetFor !== fn) {
        ta.value = DIAGRAM_SNIPPETS[fn];
        ta.dataset.snippetFor = fn;
      }
    }
    window.qaPreviewDiagram();
  };

  function readDiagramFromUI() {
    var fn = (document.getElementById('qaDiagramFn') || {}).value || '';
    if (!fn) return null;
    var raw = (document.getElementById('qaDiagramParams') || {}).value || '{}';
    var params;
    try { params = JSON.parse(raw); } catch (e) { return { _error: e.message }; }
    return { engine: 'diagram-library', function_name: fn, params: params };
  }

  window.qaPreviewDiagram = function () {
    // Refresh the live preview using the current draft visual_payload from picker
    var vp = readDiagramFromUI();
    if (vp && vp._error) {
      var statusEl = document.getElementById('qaDiagramStatus');
      if (statusEl) { statusEl.textContent = 'JSON error'; statusEl.style.background = 'rgba(220,38,38,0.12)'; statusEl.style.color = 'var(--brand-error)'; }
      return;
    }
    // Push into qaCurrentQ so live preview picks it up
    if (window._qaCurrentSnapshot && typeof window.qaLivePreview === 'function') {
      window._qaCurrentSnapshot.visual_payload = vp;
      window.qaLivePreview();
    }
    var status = document.getElementById('qaDiagramStatus');
    if (status) {
      status.textContent = vp ? vp.function_name : 'none';
      status.style.background = vp ? 'rgba(81,97,94,0.15)' : '';
      status.style.color = vp ? 'var(--text-main)' : '';
    }
  };

  window.qaApplyDiagramToRow = function () {
    // Marks the current row's visual_payload as dirty; existing Save Draft
    // / Approve flow will persist via the qaCollectFields wrap below.
    var vp = readDiagramFromUI();
    if (vp && vp._error) {
      alert('Params JSON error: ' + vp._error);
      return;
    }
    if (window._qaCurrentSnapshot) {
      window._qaCurrentSnapshot.visual_payload = vp;
    }
    window.qaPreviewDiagram();
    if (typeof window._qaPanelNotify === 'function') {
      window._qaPanelNotify('Applied — click Save to persist.', 'info');
    }
  };

  window.qaClearDiagram = function () {
    var sel = document.getElementById('qaDiagramFn');
    var ta  = document.getElementById('qaDiagramParams');
    if (sel) sel.value = '';
    if (ta)  ta.value = '';
    if (window._qaCurrentSnapshot) window._qaCurrentSnapshot.visual_payload = null;
    window.qaPreviewDiagram();
  };

  // Sync picker fields when a new question is loaded
  function syncPickerFromCurrent() {
    var sel = document.getElementById('qaDiagramFn');
    var ta  = document.getElementById('qaDiagramParams');
    var status = document.getElementById('qaDiagramStatus');
    if (!sel || !ta) return;
    var q = window._qaCurrentSnapshot;
    var vp = q && q.visual_payload;
    if (vp && vp.function_name) {
      sel.value = vp.function_name;
      try { ta.value = JSON.stringify(vp.params || {}, null, 2); } catch (e) { ta.value = ''; }
      if (status) { status.textContent = vp.function_name; }
    } else {
      sel.value = '';
      ta.value = '';
      if (status) { status.textContent = 'none'; }
    }
  }


  // ════════════════════════════════════════════════════════════════════════
  // 2. PER-RULE SIDEBAR COUNT PILLS + CLICK-TO-FILTER
  // ════════════════════════════════════════════════════════════════════════
  //
  // Aggregates auto-flag rule hits across the loaded queue+approved arrays.
  // Renders pill row above the master Flagged-only filter. Click a rule pill
  // to filter sidebar items to those with that rule.

  var qaActiveRuleFilter = null; // null = no filter; else rule id

  function injectRulePills() {
    var sb = document.getElementById('qaSidebar');
    if (!sb || document.getElementById('qaRulePills')) return;
    var master = sb.querySelector('.qa-master-filter');
    if (!master) return;
    var div = document.createElement('div');
    div.id = 'qaRulePills';
    div.className = 'qa-rule-pills';
    master.parentNode.insertBefore(div, master);
  }

  function evalRuleHitsFor(q) {
    if (!window.qaRules) return [];
    return window.qaRules.evaluateAll(q);
  }

  function refreshRulePillCounts() {
    var pills = document.getElementById('qaRulePills');
    if (!pills) return;
    if (!window.qaRules) { pills.innerHTML = ''; return; }
    var queue = (window._qaQueueRef && window._qaQueueRef()) || [];
    var approv = (window._qaApprovedRef && window._qaApprovedRef()) || [];
    var counts = {};
    window.qaRules.RULES.forEach(function (r) { counts[r.id] = 0; });

    function tally(arr) {
      arr.forEach(function (q) {
        evalRuleHitsFor(q).forEach(function (h) {
          if (counts[h.rule] != null) counts[h.rule]++;
        });
      });
    }
    tally(queue); tally(approv);

    var html = window.qaRules.RULES
      .filter(function (r) { return counts[r.id] > 0; })
      .map(function (r) {
        var active = qaActiveRuleFilter === r.id ? ' is-active' : '';
        return '<button class="qa-rule-pill qa-rule-pill--' + r.severity + active + '" '
          + 'onclick="window.qaFilterByRule(\'' + r.id + '\')" title="' + esc(r.label) + '">'
          + '<span class="qa-rule-pill__lbl">' + esc(r.label) + '</span>'
          + '<span class="qa-rule-pill__count">' + counts[r.id] + '</span>'
          + '</button>';
      }).join('');
    pills.innerHTML = html || '<div class="qa-rule-pills__empty">No rule hits.</div>';
  }

  window.qaFilterByRule = function (ruleId) {
    qaActiveRuleFilter = (qaActiveRuleFilter === ruleId) ? null : ruleId;
    var sb = document.getElementById('qaSidebar');
    if (!sb) return;
    sb.classList.toggle('rule-filtered', !!qaActiveRuleFilter);
    sb.setAttribute('data-rule-filter', qaActiveRuleFilter || '');
    applyRuleFilterToList();
    refreshRulePillCounts();
  };

  function applyRuleFilterToList() {
    var queue = (window._qaQueueRef && window._qaQueueRef()) || [];
    var approv = (window._qaApprovedRef && window._qaApprovedRef()) || [];

    function flag(listEl, sourceArr) {
      if (!listEl) return;
      var nodes = listEl.querySelectorAll('.qa-item');
      nodes.forEach(function (node, i) {
        var src = sourceArr[i];
        var match = !qaActiveRuleFilter || (src && evalRuleHitsFor(src).some(function (h) {
          return h.rule === qaActiveRuleFilter;
        }));
        node.classList.toggle('rule-filter-hidden', !match);
      });
    }
    flag(document.getElementById('qaPendingList'),  queue);
    flag(document.getElementById('qaApprovedList'), approv);
  }


  // ════════════════════════════════════════════════════════════════════════
  // 3. KEYBOARD SHORTCUTS
  // ════════════════════════════════════════════════════════════════════════
  //
  // Bindings (active only when QA tab is visible AND no input/textarea is focused
  // unless explicitly listed):
  //   j           → next pending question
  //   k           → previous pending question
  //   a           → Approve & Next
  //   s           → Save Draft (works while editing)
  //   f           → Toggle Flag for Review
  //   e           → Focus first editor field (qfQuestionText)
  //   /           → Focus search input
  //   Esc         → Close modal/palette / blur active input
  //   ?           → Open shortcut cheatsheet
  //   1 / 2 / 3   → Switch admin tab CRM/QA/Wena
  //   ⌘K / Ctrl+K → Open command palette

  function isQATabVisible() {
    var qa = document.getElementById('qaView');
    return qa && qa.style.display !== 'none';
  }

  function isEditingAnInput(target) {
    if (!target) return false;
    var tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (target.isContentEditable) return true;
    return false;
  }

  function nudgePendingSelection(delta) {
    var queue = (window._qaQueueRef && window._qaQueueRef()) || [];
    if (!queue.length) return;
    var idx = (typeof window._qaCurrentIdxRef === 'function')
      ? window._qaCurrentIdxRef() : -1;
    var next = idx < 0 ? 0 : Math.max(0, Math.min(queue.length - 1, idx + delta));
    if (typeof window.qaSelectPending === 'function') window.qaSelectPending(next);
  }

  function clickFirst(selector) {
    var el = document.querySelector(selector);
    if (el) el.click();
  }

  document.addEventListener('keydown', function (e) {
    // Cmd+K / Ctrl+K — palette (works anywhere)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      window.qaOpenPalette();
      return;
    }

    // Esc — close any open modal/palette, blur focused input
    if (e.key === 'Escape') {
      var palette = document.getElementById('qaPalette');
      if (palette && palette.classList.contains('is-open')) {
        e.preventDefault();
        window.qaClosePalette();
        return;
      }
      var openModal = document.querySelector('.modal-overlay.is-open');
      if (openModal) {
        openModal.classList.remove('is-open');
        return;
      }
      if (isEditingAnInput(document.activeElement)) {
        document.activeElement.blur();
      }
      return;
    }

    // ? — cheatsheet
    if (e.key === '?' && !isEditingAnInput(e.target)) {
      e.preventDefault();
      window.qaShowCheatsheet();
      return;
    }

    // 1/2/3 tab switches — only when not editing
    if (!isEditingAnInput(e.target)) {
      if (e.key === '1') { e.preventDefault(); window.switchAdminTab('crm'); return; }
      if (e.key === '2') { e.preventDefault(); window.switchAdminTab('qa');  return; }
      if (e.key === '3') {
        var wenaBtn = document.getElementById('tabWena');
        if (wenaBtn && !wenaBtn.hidden) { e.preventDefault(); window.switchAdminTab('wena'); }
        return;
      }
    }

    // QA-tab-only shortcuts
    if (!isQATabVisible()) return;

    // 's' (Save) works WHILE editing — common UX expectation
    if (e.key === 's' && !e.metaKey && !e.ctrlKey) {
      // Only intercept plain 's' when reviewer is in editor area
      var inEditor = e.target.closest && e.target.closest('#qaEditorInner');
      if (inEditor || !isEditingAnInput(e.target)) {
        e.preventDefault();
        clickFirst('#qaActionBar .btn-secondary');
        return;
      }
    }

    if (isEditingAnInput(e.target)) return;

    if (e.key === 'j') { e.preventDefault(); nudgePendingSelection(+1); return; }
    if (e.key === 'k') { e.preventDefault(); nudgePendingSelection(-1); return; }
    if (e.key === 'a') { e.preventDefault(); clickFirst('#qaActionBar .btn-primary'); return; }
    if (e.key === 'f') { e.preventDefault(); if (typeof window.qaToggleFlag === 'function') window.qaToggleFlag(); return; }
    if (e.key === 'e') {
      e.preventDefault();
      var fld = document.getElementById('qfQuestionText');
      if (fld) fld.focus();
      return;
    }
    if (e.key === '/') {
      e.preventDefault();
      var s = document.getElementById('qaSearchInput');
      if (s) { s.focus(); s.select(); }
      return;
    }
  });


  // ════════════════════════════════════════════════════════════════════════
  // 4. CMD+K COMMAND PALETTE
  // ════════════════════════════════════════════════════════════════════════

  var COMMANDS = [
    { id: 'tab:crm',   label: 'Switch to CRM Dashboard',  hint: '1', run: function () { window.switchAdminTab('crm'); } },
    { id: 'tab:qa',    label: 'Switch to QA Audit',       hint: '2', run: function () { window.switchAdminTab('qa');  } },
    { id: 'tab:wena',  label: 'Switch to Wena Telemetry', hint: '3', run: function () { var b = document.getElementById('tabWena'); if (b && !b.hidden) window.switchAdminTab('wena'); } },
    { id: 'qa:approve',     label: 'QA — Approve & Next',          hint: 'a', run: function () { clickFirst('#qaActionBar .btn-primary'); } },
    { id: 'qa:save',        label: 'QA — Save Draft',              hint: 's', run: function () { clickFirst('#qaActionBar .btn-secondary'); } },
    { id: 'qa:flag',        label: 'QA — Toggle Flag',             hint: 'f', run: function () { if (typeof window.qaToggleFlag === 'function') window.qaToggleFlag(); } },
    { id: 'qa:next',        label: 'QA — Next pending',            hint: 'j', run: function () { nudgePendingSelection(+1); } },
    { id: 'qa:prev',        label: 'QA — Previous pending',        hint: 'k', run: function () { nudgePendingSelection(-1); } },
    { id: 'qa:focus-text',  label: 'QA — Focus question text',     hint: 'e', run: function () { var f = document.getElementById('qfQuestionText'); if (f) f.focus(); } },
    { id: 'qa:focus-search',label: 'QA — Focus search',            hint: '/', run: function () { var s = document.getElementById('qaSearchInput'); if (s) { s.focus(); s.select(); } } },
    { id: 'qa:flagged-only',label: 'QA — Toggle Flagged-only filter',         run: function () { var c = document.getElementById('qaFlaggedOnly'); if (c) { c.checked = !c.checked; window.qaApplyFlaggedOnly(); } } },
    { id: 'qa:audit',       label: 'QA — Toggle Audit Trail panel', run: function () { if (typeof window.qaToggleAuditPanel === 'function') window.qaToggleAuditPanel(); } },
    { id: 'qa:diagram',     label: 'QA — Toggle Diagram picker',    run: function () { window.qaToggleDiagramPicker(); } },
    { id: 'qa:stats',       label: 'QA — Open Stats Dashboard',     run: function () { window.qaOpenStats(); } },
    { id: 'qa:refresh',     label: 'QA — Refresh queue',            run: function () { if (typeof window.loadQAQueue === 'function') window.loadQAQueue(); } },
    { id: 'crm:export',     label: 'CRM — Export parents CSV',      run: function () { if (typeof window.exportCSV === 'function') window.exportCSV(); } },
    { id: 'crm:mrr',        label: 'CRM — Open MRR detail',         run: function () { if (typeof window.openMRR === 'function') window.openMRR(); } },
    { id: 'crm:subs',       label: 'CRM — Open Subscriber breakdown', run: function () { if (typeof window.openSubBreakdown === 'function') window.openSubBreakdown(); } },
    { id: 'help:cheatsheet',label: 'Show keyboard shortcuts',       hint: '?', run: function () { window.qaShowCheatsheet(); } }
  ];

  // Subsequence fuzzy match — characters of query appear in label in order
  function fuzzyMatch(q, label) {
    if (!q) return { ok: true, score: 0 };
    q = q.toLowerCase(); var l = label.toLowerCase();
    var qi = 0, score = 0, lastMatch = -1;
    for (var i = 0; i < l.length && qi < q.length; i++) {
      if (l[i] === q[qi]) {
        score += (lastMatch === i - 1) ? 5 : 1; // prefer consecutive matches
        if (i < 8) score += 2; // prefer matches near start
        lastMatch = i;
        qi++;
      }
    }
    return qi === q.length ? { ok: true, score: score } : { ok: false, score: 0 };
  }

  function injectPaletteUI() {
    if (document.getElementById('qaPalette')) return;
    var div = document.createElement('div');
    div.id = 'qaPalette';
    div.className = 'qa-palette';
    div.innerHTML =
        '<div class="qa-palette__box">'
      +   '<input id="qaPaletteInput" type="text" class="qa-palette__input" placeholder="Type a command or search…" autocomplete="off" spellcheck="false">'
      +   '<div class="qa-palette__list" id="qaPaletteList"></div>'
      +   '<div class="qa-palette__hint">↑↓ navigate · ↵ run · Esc close</div>'
      + '</div>';
    div.addEventListener('click', function (e) {
      if (e.target === div) window.qaClosePalette();
    });
    document.body.appendChild(div);

    var input = document.getElementById('qaPaletteInput');
    input.addEventListener('input', renderPaletteList);
    input.addEventListener('keydown', onPaletteKey);
  }

  var paletteIdx = 0;
  var paletteFiltered = [];

  function renderPaletteList() {
    var input = document.getElementById('qaPaletteInput');
    var list = document.getElementById('qaPaletteList');
    if (!input || !list) return;
    var q = input.value.trim();
    paletteFiltered = COMMANDS
      .map(function (c) { var m = fuzzyMatch(q, c.label); return { c: c, ok: m.ok, score: m.score }; })
      .filter(function (x) { return x.ok; })
      .sort(function (a, b) { return b.score - a.score; })
      .map(function (x) { return x.c; });
    paletteIdx = Math.max(0, Math.min(paletteIdx, paletteFiltered.length - 1));
    if (!paletteFiltered.length) {
      list.innerHTML = '<div class="qa-palette__empty">No commands match.</div>';
      return;
    }
    list.innerHTML = paletteFiltered.map(function (c, i) {
      var active = i === paletteIdx ? ' is-active' : '';
      var hint = c.hint ? '<span class="qa-palette__hint-key">' + esc(c.hint) + '</span>' : '';
      return '<div class="qa-palette__item' + active + '" data-idx="' + i + '">'
        + '<span class="qa-palette__lbl">' + esc(c.label) + '</span>'
        + hint
        + '</div>';
    }).join('');
    var nodes = list.querySelectorAll('.qa-palette__item');
    nodes.forEach(function (n) {
      n.addEventListener('click', function () {
        paletteIdx = parseInt(n.getAttribute('data-idx'), 10);
        runPaletteCommand();
      });
    });
  }

  function onPaletteKey(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      paletteIdx = Math.min(paletteFiltered.length - 1, paletteIdx + 1);
      renderPaletteList();
      var active = document.querySelector('.qa-palette__item.is-active');
      if (active) active.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      paletteIdx = Math.max(0, paletteIdx - 1);
      renderPaletteList();
      var active2 = document.querySelector('.qa-palette__item.is-active');
      if (active2) active2.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runPaletteCommand();
    }
  }

  function runPaletteCommand() {
    var cmd = paletteFiltered[paletteIdx];
    if (!cmd) return;
    window.qaClosePalette();
    setTimeout(function () { try { cmd.run(); } catch (err) { console.error('[palette]', err); } }, 0);
  }

  window.qaOpenPalette = function () {
    injectPaletteUI();
    var pal = document.getElementById('qaPalette');
    var input = document.getElementById('qaPaletteInput');
    if (!pal || !input) return;
    input.value = '';
    paletteIdx = 0;
    renderPaletteList();
    pal.classList.add('is-open');
    setTimeout(function () { input.focus(); }, 30);
  };

  window.qaClosePalette = function () {
    var pal = document.getElementById('qaPalette');
    if (pal) pal.classList.remove('is-open');
  };


  // ════════════════════════════════════════════════════════════════════════
  // 5. STATS DASHBOARD MODAL
  // ════════════════════════════════════════════════════════════════════════

  function injectStatsModal() {
    if (document.getElementById('qaStatsModal')) return;
    var div = document.createElement('div');
    div.id = 'qaStatsModal';
    div.className = 'modal-overlay';
    div.addEventListener('click', function (e) {
      if (e.target.id === 'qaStatsModal') window.qaCloseStats();
    });
    div.innerHTML =
        '<div class="card modal-box modal-md p-6">'
      +   '<div class="modal-head">'
      +     '<h3 class="modal-title">QA Audit — Stats</h3>'
      +     '<button class="modal-close" onclick="window.qaCloseStats()" aria-label="Close">×</button>'
      +   '</div>'
      +   '<div id="qaStatsBody"><div class="spinner-sm mx-auto"></div></div>'
      + '</div>';
    document.body.appendChild(div);
  }

  window.qaOpenStats = async function () {
    injectStatsModal();
    var modal = document.getElementById('qaStatsModal');
    var body = document.getElementById('qaStatsBody');
    if (!modal || !body) return;
    body.innerHTML = '<div class="text-center py-6"><div class="spinner-sm mx-auto"></div></div>';
    modal.classList.add('is-open');

    try {
      var stats = await loadQAStats();
      renderStats(stats);
    } catch (err) {
      body.innerHTML = '<p class="text-sm text-muted text-center py-6">Failed to load stats: ' + esc(err.message) + '</p>';
    }
  };

  window.qaCloseStats = function () {
    var m = document.getElementById('qaStatsModal');
    if (m) m.classList.remove('is-open');
  };

  // Build stats from the already-loaded queue+approved arrays plus a small
  // server roll-up of qa_reviews counts. Avoids extra round trips for the
  // bulk of the data.
  async function loadQAStats() {
    var queue  = (window._qaQueueRef && window._qaQueueRef()) || [];
    var approv = (window._qaApprovedRef && window._qaApprovedRef()) || [];

    // Reviewer activity from qa_reviews via Supabase (read-only)
    var sb = (typeof window.getSupabase === 'function') ? await window.getSupabase() : null;

    var todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    var weekStart  = new Date(Date.now() - 7 * 86400000);

    var todayCount = 0, weekCount = 0;
    var byAction = {};
    if (sb) {
      // Today's reviewer events
      var today = await sb.from('qa_reviews')
        .select('action', { count: 'exact', head: false })
        .gte('created_at', todayStart.toISOString())
        .neq('action', 'created');
      todayCount = (today.data || []).length;

      // This week's events grouped by action
      var week = await sb.from('qa_reviews')
        .select('action')
        .gte('created_at', weekStart.toISOString())
        .neq('action', 'created');
      var weekRows = week.data || [];
      weekCount = weekRows.length;
      weekRows.forEach(function (r) { byAction[r.action] = (byAction[r.action] || 0) + 1; });
    }

    var pendingTotal  = queue.length;
    var approvedTotal = approv.length;
    var flaggedTotal  = queue.filter(function (q) { return q.flag_review === true; }).length
                      + approv.filter(function (q) { return q.flag_review === true; }).length;

    // Per-subject + per-level breakdown of pending
    function tally(arr, key) {
      var out = {};
      arr.forEach(function (q) { var k = q[key] || '—'; out[k] = (out[k] || 0) + 1; });
      return out;
    }
    var bySubject = tally(queue, 'subject');
    var byLevel   = tally(queue, 'level');

    return {
      pendingTotal: pendingTotal,
      approvedTotal: approvedTotal,
      flaggedTotal: flaggedTotal,
      todayCount: todayCount,
      weekCount: weekCount,
      byAction: byAction,
      bySubject: bySubject,
      byLevel: byLevel
    };
  }

  function renderStats(s) {
    var body = document.getElementById('qaStatsBody');
    if (!body) return;
    function bar(label, val, max, mod) {
      var pct = max > 0 ? Math.round((val / max) * 100) : 0;
      return '<div class="funnel-row">'
        + '<div class="funnel-row__head">'
        +   '<span class="funnel-row__lbl">' + esc(label) + '</span>'
        +   '<span class="funnel-row__val">' + val + '</span>'
        + '</div>'
        + '<div class="funnel-row__track">'
        +   '<div class="funnel-row__fill funnel-row__fill--' + mod + '" style="width:' + pct + '%;"></div>'
        + '</div>'
      + '</div>';
    }

    var actionMods = { approved: 'mint', edited: 'sage', flagged: 'rose', unflagged: 'sage', deleted: 'rose', rejected: 'rose' };
    var weekMax = Math.max(1, Math.max.apply(null, Object.values(s.byAction).concat(0)));
    var subjMax = Math.max(1, Math.max.apply(null, Object.values(s.bySubject).concat(0)));
    var lvlMax  = Math.max(1, Math.max.apply(null, Object.values(s.byLevel).concat(0)));

    var html =
        '<div class="analytics-grid" style="margin-bottom:var(--space-4);">'
      +   '<div class="metric-card"><div class="metric-val">' + s.pendingTotal  + '</div><div class="metric-lbl">Pending</div></div>'
      +   '<div class="metric-card"><div class="metric-val">' + s.approvedTotal + '</div><div class="metric-lbl">Approved</div></div>'
      + '</div>'
      + '<div class="analytics-grid" style="margin-bottom:var(--space-4);">'
      +   '<div class="metric-card"><div class="metric-val">' + s.flaggedTotal  + '</div><div class="metric-lbl">Flagged</div></div>'
      +   '<div class="metric-card"><div class="metric-val">' + s.todayCount    + '</div><div class="metric-lbl">Reviewed Today</div></div>'
      + '</div>'
      + '<p class="metric-lbl" style="margin-bottom:var(--space-2);">This Week — by Action</p>';
    var actions = ['approved','edited','flagged','rejected','deleted','unflagged'];
    actions.forEach(function (a) {
      if (s.byAction[a]) html += bar(a, s.byAction[a], weekMax, actionMods[a] || 'sage');
    });
    if (!Object.keys(s.byAction).length) html += '<p class="text-sm text-muted">No reviewer activity in the last 7 days.</p>';

    html += '<p class="metric-lbl" style="margin:var(--space-4) 0 var(--space-2);">Pending — by Subject</p>';
    Object.keys(s.bySubject).forEach(function (k) {
      html += bar(k, s.bySubject[k], subjMax, 'sage');
    });

    html += '<p class="metric-lbl" style="margin:var(--space-4) 0 var(--space-2);">Pending — by Level</p>';
    Object.keys(s.byLevel).sort().forEach(function (k) {
      html += bar(k, s.byLevel[k], lvlMax, 'rose');
    });

    body.innerHTML = html;
  }


  // ════════════════════════════════════════════════════════════════════════
  // CHEATSHEET
  // ════════════════════════════════════════════════════════════════════════

  function injectCheatsheet() {
    if (document.getElementById('qaCheatsheet')) return;
    var div = document.createElement('div');
    div.id = 'qaCheatsheet';
    div.className = 'modal-overlay';
    div.addEventListener('click', function (e) {
      if (e.target.id === 'qaCheatsheet') div.classList.remove('is-open');
    });
    div.innerHTML =
        '<div class="card modal-box modal-sm p-6">'
      +   '<div class="modal-head">'
      +     '<h3 class="modal-title">Keyboard shortcuts</h3>'
      +     '<button class="modal-close" onclick="document.getElementById(\'qaCheatsheet\').classList.remove(\'is-open\')" aria-label="Close">×</button>'
      +   '</div>'
      +   '<table class="qa-cheatsheet">'
      +     row('1 / 2 / 3', 'Switch tab — CRM / QA / Wena')
      +     row('⌘ K  /  Ctrl K', 'Open command palette')
      +     row('?', 'Show this cheatsheet')
      +     row('Esc', 'Close modal / blur input')
      +     row('—', 'QA Audit only:')
      +     row('j  /  k', 'Next / previous pending')
      +     row('a', 'Approve & Next')
      +     row('s', 'Save Draft (works while editing)')
      +     row('f', 'Toggle Flag for Review')
      +     row('e', 'Focus question text field')
      +     row('/', 'Focus search input')
      +   '</table>'
      + '</div>';
    document.body.appendChild(div);
  }
  function row(k, v) { return '<tr><td class="qa-cheatsheet__key">' + esc(k) + '</td><td class="qa-cheatsheet__val">' + esc(v) + '</td></tr>'; }

  window.qaShowCheatsheet = function () {
    injectCheatsheet();
    var c = document.getElementById('qaCheatsheet');
    if (c) c.classList.add('is-open');
  };


  // ════════════════════════════════════════════════════════════════════════
  // BRIDGE TO qa-panel.js INTERNALS
  // ════════════════════════════════════════════════════════════════════════
  //
  // qa-panel.js holds qaQueue, qaApproved, qaCurrentQ, qaCurrentIdx as IIFE-
  // scoped vars. We need read access. qa-panel.js was patched in 4a to expose
  // hooks; if the refs aren't there, we degrade gracefully (palette still
  // works, just with empty queue-aware features).

  function setupBridge() {
    // qa-panel.js doesn't expose refs by default. We probe the DOM each call
    // for the 'is-active' qa-item and walk up to a known list to determine
    // index. Queue/approved arrays we read by introspection if the file
    // exposes them; otherwise we read from the rendered DOM.

    if (!window._qaQueueRef) {
      window._qaQueueRef = function () {
        // Best-effort: read titles from #qaPendingList. Returns array of
        // pseudo-rows {id?, flag_review?} sufficient for filter/count, but
        // NOT full row data. Components that need full rows (stats subject
        // tally) will silently show '—'.
        var nodes = document.querySelectorAll('#qaPendingList .qa-item');
        var arr = [];
        nodes.forEach(function (n) {
          arr.push({
            _domNode: n,
            flag_review: n.classList.contains('is-flagged'),
            subject: n.dataset.subject || '',
            level:   n.dataset.level   || '',
            type:    n.dataset.type    || ''
          });
        });
        return arr;
      };
    }
    if (!window._qaApprovedRef) {
      window._qaApprovedRef = function () {
        var nodes = document.querySelectorAll('#qaApprovedList .qa-item');
        var arr = [];
        nodes.forEach(function (n) {
          arr.push({
            _domNode: n,
            flag_review: n.classList.contains('is-flagged'),
            subject: n.dataset.subject || '',
            level:   n.dataset.level   || '',
            type:    n.dataset.type    || ''
          });
        });
        return arr;
      };
    }
    if (!window._qaCurrentIdxRef) {
      window._qaCurrentIdxRef = function () {
        var nodes = document.querySelectorAll('#qaPendingList .qa-item');
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i].classList.contains('is-active')) return i;
        }
        return -1;
      };
    }

    // _qaCurrentSnapshot is a live mirror of qa-panel.js qaCurrentQ.
    // qa-panel.js qaPostSelectHook sets it via window assignment if patched;
    // otherwise we observe form fields and rebuild a draft on change.
    if (!window._qaCurrentSnapshot) {
      window._qaCurrentSnapshot = null;
      // Listen for changes that imply a new question was loaded
      var observer = new MutationObserver(function () {
        // If qaEditorInner just became visible, re-pull form values
        var inner = document.getElementById('qaEditorInner');
        if (!inner || inner.style.display === 'none') return;
        if (!window._qaCurrentSnapshot) window._qaCurrentSnapshot = {};
        var f = ['Subject','Level','Type','Topic','SubTopic','Difficulty','QuestionText','CorrectAnswer','WorkedSolution','Marks','CogSkill'];
        var keys = ['subject','level','type','topic','sub_topic','difficulty','question_text','correct_answer','worked_solution','marks','cognitive_skill'];
        f.forEach(function (id, i) {
          var el = document.getElementById('qf' + id);
          if (el) window._qaCurrentSnapshot[keys[i]] = el.value;
        });
      });
      observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style'] });
    }
  }


  // ════════════════════════════════════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════════════════════════════════════

  function init() {
    setupBridge();
    injectPickerUI();
    injectRulePills();
    refreshRulePillCounts();
    if (typeof window.adminIconRefresh === 'function') {
      window.adminIconRefresh(document.getElementById('qaSidebar'));
    }

    // Observe sidebar list mutations to refresh per-rule counts
    var pl = document.getElementById('qaPendingList');
    var al = document.getElementById('qaApprovedList');
    var mo = new MutationObserver(function () {
      refreshRulePillCounts();
      applyRuleFilterToList();
    });
    if (pl) mo.observe(pl, { childList: true });
    if (al) mo.observe(al, { childList: true });

    // Observe editor visibility to sync diagram picker
    var inner = document.getElementById('qaEditorInner');
    if (inner) {
      var io = new MutationObserver(function () {
        if (inner.style.display !== 'none') syncPickerFromCurrent();
      });
      io.observe(inner, { attributes: true, attributeFilter: ['style'] });
    }

    // Hijack QA Queue pulse-card click to open stats instead of switching tab
    // (the existing window.openQATab still switches the tab; we override.)
    var origOpenQATab = window.openQATab;
    window.openQATab = function () {
      // Single-click goes to QA tab as before; but if user wants stats,
      // they use the palette ⌘K → "Open Stats". To avoid breaking the
      // existing workflow, we keep openQATab tab-switching and add a
      // separate stats action via palette and the cheatsheet. The pulse
      // card behaviour stays the same.
      if (typeof origOpenQATab === 'function') origOpenQATab();
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();