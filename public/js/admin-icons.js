/* ════════════════════════════════════════════════════════════════════════════
   admin-icons.js  —  v1.0  (Commit 2: Architect-Scholar reskin)
   ----------------------------------------------------------------------------
   Admin-only SVG icon set. Mirrors window.shlIcon() pattern from icons.js
   but separate file because these icons are admin-specific (chart, flask,
   radar, ticket, etc.) and do not belong in the shared 13-icon site set.

   All icons follow the same rules as the shared set:
     - viewBox 0 0 24 24
     - stroke-width 1.75, stroke="currentColor", linecap/linejoin="round"
     - fill="none" (a few accent fills at 0.12 opacity for solidity)
     - Theme via parent element's color (var(--brand-rose) etc.)

   Usage:
     <span data-admin-icon="flask" data-icon-size="24"></span>
     el.innerHTML = window.adminIcon('chart', { size: 18 });

   Auto-render of [data-admin-icon] runs once on DOMContentLoaded and once
   per dynamic insertion via window.adminIconRefresh(rootEl).
   ════════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── PATHS ──────────────────────────────────────────────────────────────
  // Each value is the inner SVG markup (no <svg> wrapper). Wrapper is added
  // by render() so size/color cascade via CSS variables on the parent.

  var ICONS = {
    // CRM tab — bar chart
    chart:
      '<path d="M4 20V10M10 20V4M16 20V14M22 20V8" />' +
      '<path d="M3 20h19" />',

    // QA tab — flask (lab/audit)
    flask:
      '<path d="M9 3h6" />' +
      '<path d="M10 3v6L4.5 18a2.5 2.5 0 0 0 2.16 3.74h10.68A2.5 2.5 0 0 0 19.5 18L14 9V3" />' +
      '<path d="M7 14h10" opacity="0.6" />',

    // Wena tab — trend up
    'trend-up':
      '<path d="M3 17l6-6 4 4 8-8" />' +
      '<path d="M14 7h7v7" />',

    // Parents — users
    users:
      '<circle cx="9" cy="8" r="3.5" />' +
      '<circle cx="17" cy="9" r="2.5" />' +
      '<path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />' +
      '<path d="M15 20c0-2.5 1.5-5 4-5 1.5 0 2 1 2 2" />',

    // At-Risk — radar
    radar:
      '<circle cx="12" cy="12" r="9" />' +
      '<circle cx="12" cy="12" r="5" opacity="0.4" />' +
      '<path d="M12 12L20 6" />' +
      '<circle cx="12" cy="12" r="1.5" fill="currentColor" />',

    // Subscribers — credit card
    card:
      '<rect x="2.5" y="5" width="19" height="14" rx="2.5" />' +
      '<path d="M2.5 10h19" />' +
      '<path d="M6 15h4" />',

    // Net MRR — coin / dollar
    coin:
      '<circle cx="12" cy="12" r="9" />' +
      '<path d="M15 9c-.5-1-1.5-2-3-2-2 0-3 1-3 2.5S10 12 12 12s3 .5 3 2.5S14 17 12 17c-1.5 0-2.5-1-3-2" />' +
      '<path d="M12 6v2M12 17v2" />',

    // On trial — gift
    gift:
      '<path d="M3 9h18v4H3z" />' +
      '<path d="M5 13v8h14v-8" />' +
      '<path d="M12 9v12" />' +
      '<path d="M12 9c-2 0-4-1-4-3s1-3 2-3c1.5 0 2 1.5 2 3" />' +
      '<path d="M12 9c2 0 4-1 4-3s-1-3-2-3c-1.5 0-2 1.5-2 3" />',

    // Contact pending — inbox
    inbox:
      '<path d="M3 13l3-8h12l3 8" />' +
      '<path d="M3 13v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" />' +
      '<path d="M3 13h5l1.5 2h5l1.5-2h5" />',

    // QA queue — clock
    clock:
      '<circle cx="12" cy="12" r="9" />' +
      '<path d="M12 7v5l3 2" />',

    // Approved — check
    check:
      '<path d="M5 12.5l4.5 4.5L20 6" />',

    // Empty queue celebration — sparkle
    sparkle:
      '<path d="M12 3v4M12 17v4M3 12h4M17 12h4" />' +
      '<path d="M5.5 5.5l2.5 2.5M16 16l2.5 2.5M16 8l2.5-2.5M5.5 18.5L8 16" />' +
      '<circle cx="12" cy="12" r="3" />',

    // Edit — pencil
    pencil:
      '<path d="M3 21l3.5-1 12-12-2.5-2.5-12 12L3 21z" />' +
      '<path d="M14.5 5.5l4 4" />',

    // Mail / contact
    mail:
      '<rect x="2.5" y="5" width="19" height="14" rx="2" />' +
      '<path d="M3 7l9 6 9-6" />',

    // Plan — ticket
    ticket:
      '<path d="M3 7v10c0 .5.5 1 1 1h16c.5 0 1-.5 1-1v-3a2 2 0 0 1 0-4V7c0-.5-.5-1-1-1H4c-.5 0-1 .5-1 1z" />' +
      '<path d="M9 6v12" stroke-dasharray="2 2" />',

    // Delete — trash
    trash:
      '<path d="M5 7h14" />' +
      '<path d="M10 4h4a1 1 0 0 1 1 1v2H9V5a1 1 0 0 1 1-1z" />' +
      '<path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />' +
      '<path d="M10 11v6M14 11v6" opacity="0.5" />',

    // Download
    download:
      '<path d="M12 3v13" />' +
      '<path d="M7 11l5 5 5-5" />' +
      '<path d="M4 21h16" />',

    // Find — search
    search:
      '<circle cx="11" cy="11" r="6.5" />' +
      '<path d="M16 16l5 5" />',

    // Empty preview — pointer
    pointer:
      '<path d="M9 4v11l-3-3-1.5 1.5L11 20l8-8-1.5-1.5L13 14V4a2 2 0 0 0-4 0z" />',

    // Warning
    warn:
      '<path d="M12 3l10 18H2L12 3z" />' +
      '<path d="M12 10v5" />' +
      '<circle cx="12" cy="18" r="0.7" fill="currentColor" />',

    // Paused
    pause:
      '<rect x="6" y="5" width="4" height="14" rx="1" />' +
      '<rect x="14" y="5" width="4" height="14" rx="1" />',

    // Synthesis — pen
    pen:
      '<path d="M3 21l3.5-1 14-14a2.12 2.12 0 0 0-3-3l-14 14L3 21z" />' +
      '<path d="M16.5 4.5l3 3" />',

    // Clipboard — worked solution
    clipboard:
      '<rect x="6" y="4" width="12" height="17" rx="2" />' +
      '<rect x="9" y="2" width="6" height="4" rx="1" />' +
      '<path d="M9 11h6M9 14h6M9 17h4" opacity="0.6" />',

    // Book — All Subjects plan
    book:
      '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5a2.5 2.5 0 0 0 0 5H20" />' +
      '<path d="M4 4.5V19a2.5 2.5 0 0 0 2.5 2.5" />',

    // Status dots — solid circles in different colours
    dot:
      '<circle cx="12" cy="12" r="5" fill="currentColor" />',

    // Chevron (mirrors shared icon, included for self-containment)
    chevron:
      '<path d="M9 6l6 6-6 6" />',

    // Caret right (collapsible toggle)
    'caret-right':
      '<path d="M9 6l6 6-6 6" />',

    'caret-down':
      '<path d="M6 9l6 6 6-6" />',

    // Section sigil — used to be § character
    section:
      '<path d="M14 6.5c0-1.5-1.3-2.5-3-2.5s-3 1-3 2.5S9.5 9 12 10s3.5 1.5 3.5 3-1.5 2.5-3.5 2.5-3-1-3-2.5" />' +
      '<path d="M14 14c0-1.5-1.3-2.5-3-2.5" opacity="0.5" />'
  };

  // ── RENDER ─────────────────────────────────────────────────────────────
  function render(name, opts) {
    opts = opts || {};
    var size = opts.size || 24;
    var stroke = opts.stroke || 1.75;
    var path = ICONS[name];
    if (!path) {
      console.warn('[admin-icons] unknown icon:', name);
      return '';
    }
    var cls = opts.className ? ' class="' + opts.className + '"' : '';
    var aria = opts.ariaLabel ? ' role="img" aria-label="' + opts.ariaLabel + '"' : ' aria-hidden="true"';
    return '<svg' + cls + ' xmlns="http://www.w3.org/2000/svg" ' +
           'width="' + size + '" height="' + size + '" viewBox="0 0 24 24" ' +
           'fill="none" stroke="currentColor" stroke-width="' + stroke + '" ' +
           'stroke-linecap="round" stroke-linejoin="round"' + aria + '>' +
           path +
           '</svg>';
  }

  // Public API
  window.adminIcon = render;

  // ── AUTO-RENDER ────────────────────────────────────────────────────────
  function refresh(root) {
    root = root || document;
    var nodes = root.querySelectorAll('[data-admin-icon]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.__adminIconRendered) continue;
      var name = el.getAttribute('data-admin-icon');
      var size = parseInt(el.getAttribute('data-icon-size'), 10) || 24;
      var stroke = parseFloat(el.getAttribute('data-icon-stroke')) || 1.75;
      el.innerHTML = render(name, { size: size, stroke: stroke });
      el.__adminIconRendered = true;
    }
  }

  window.adminIconRefresh = refresh;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { refresh(); });
  } else {
    refresh();
  }
})();