/**
 * /js/icons.js — Superholic Lab icon system v1
 *
 * 13 inline SVG icons. All use stroke="currentColor" and fill="currentColor"
 * (where applicable) so they inherit the parent element's CSS color.
 * Theme via:  color: var(--rose);  color: var(--mint);  color: var(--cream);
 *
 * Style: 24×24 viewBox, stroke-width 1.75, line+light-fill hybrid.
 * Aesthetic: Halo Reach (clean hard-edge geometry) + Genshin Impact (rune accents).
 *
 * Usage in vanilla pages:
 *   <span data-icon="quest"></span>            ← attribute auto-renders on DOMContentLoaded
 *   <span class="shl-icon">${ICONS.quest}</span> ← manual interpolation
 *   shlIcon('quest', { size: 28 })             ← function returns SVG string
 *
 * Usage in JS:
 *   import { ICONS } from '/js/icons.js'  (when used as a module)
 *
 * Pair with src/components/icons/index.tsx — both files must export the
 * same 13 names and identical SVG paths so vanilla and Next.js render the
 * same artwork.
 *
 * TEST: Open any page that loads icons.js. Run in console:
 *   shlIcon('quest')   → returns SVG string starting with '<svg'
 *   document.querySelectorAll('[data-icon]').length   → all rendered
 */

(function () {
  'use strict';

  // ─── 13 icons (raw SVG path content, no <svg> wrapper) ──────────────
  // Each path is centred in a 24×24 box with 2px padding (drawable area 20×20).
  const PATHS = {
    // 1. quest — scroll + compass (mission marker)
    quest: `
      <path d="M5 4h11l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" fill="none"/>
      <path d="M16 4v3h3" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" fill="none"/>
      <circle cx="12" cy="14" r="3.2" stroke="currentColor" stroke-width="1.75" fill="none"/>
      <path d="M12 11.8v4.4M9.8 14h4.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    `,

    // 2. quiz — document + checkmark
    quiz: `
      <path d="M6 3h9l3 3v14a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" fill="none"/>
      <path d="M15 3v3h3" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" fill="none"/>
      <path d="M8.5 14l2 2 4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <line x1="8" y1="9" x2="13" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    `,

    // 3. tutor — speech bubble with rose accent dot (Miss Wena's signature)
    tutor: `
      <path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-7l-4 4v-4H6a2 2 0 01-2-2V5z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" fill="none"/>
      <circle cx="9" cy="9.5" r="1" fill="currentColor"/>
      <circle cx="15" cy="9.5" r="1" fill="currentColor"/>
      <path d="M9 12.5c1 1 4.5 1 6 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    `,

    // 4. exam — clipboard with laurel arc
    exam: `
      <rect x="6" y="4" width="12" height="17" rx="1.5" stroke="currentColor" stroke-width="1.75" fill="none"/>
      <rect x="9" y="2.5" width="6" height="3.5" rx="1" stroke="currentColor" stroke-width="1.75" fill="none"/>
      <path d="M9 11h6M9 14h6M9 17h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    `,

    // 5. progress — ascending bar chart with peak
    progress: `
      <path d="M3 21h18" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
      <rect x="5"  y="14" width="3" height="7" rx="0.5" stroke="currentColor" stroke-width="1.75" fill="none"/>
      <rect x="10.5" y="9"  width="3" height="12" rx="0.5" stroke="currentColor" stroke-width="1.75" fill="none"/>
      <rect x="16" y="5" width="3" height="16" rx="0.5" stroke="currentColor" stroke-width="1.75" fill="none"/>
      <circle cx="17.5" cy="3.5" r="1.2" fill="currentColor"/>
    `,

    // 6. diagnosis — circuit-board branching (Why this quest)
    diagnosis: `
      <circle cx="6" cy="12" r="2.2" stroke="currentColor" stroke-width="1.75" fill="none"/>
      <circle cx="18" cy="6"  r="1.8" stroke="currentColor" stroke-width="1.75" fill="none"/>
      <circle cx="18" cy="12" r="1.8" stroke="currentColor" stroke-width="1.75" fill="none"/>
      <circle cx="18" cy="18" r="1.8" stroke="currentColor" stroke-width="1.75" fill="none"/>
      <path d="M8.2 12h2c1 0 1.8-.5 2.4-1.2L14.5 7.8M8.2 12h2c1 0 1.8 0 2.4 0H16M8.2 12h2c1 0 1.8.5 2.4 1.2L14.5 16.2"
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    `,

    // 7. roadmap — stepped path (What's coming next)
    roadmap: `
      <path d="M4 19h4v-5h4V9h4V4h4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="4"  cy="19" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="14" r="1.2" fill="currentColor"/>
      <circle cx="20" cy="4" r="1.5" fill="currentColor"/>
    `,

    // 8. day — hexagonal ring (used as wrapper for day numerals)
    // Renders empty hex; consumer overlays the day number via CSS or HTML.
    day: `
      <path d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9L12 3z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" fill="none"/>
    `,

    // 9. flame — streak indicator (replaces 🔥 emoji)
    flame: `
      <path d="M12 3c0 4-4 5-4 9a4 4 0 008 0c0-2-1-3-1-5 0 1.5-1 2-2 2 1-3 0-5-1-6z"
            stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" fill="currentColor" fill-opacity="0.18"/>
      <path d="M10 14a2.5 2.5 0 005 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    `,

    // 10. shield — hexagonal streak shield
    shield: `
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z"
            stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" fill="currentColor" fill-opacity="0.12"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,

    // 11. lock — locked future days
    lock: `
      <rect x="5" y="11" width="14" height="9" rx="1.5" stroke="currentColor" stroke-width="1.75" fill="none"/>
      <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" fill="none"/>
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor"/>
    `,

    // 12. play — triangle with rose glow halo (Start Day N CTA)
    play: `
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.75" fill="currentColor" fill-opacity="0.08"/>
      <path d="M10 8.5l6 3.5-6 3.5v-7z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" fill="currentColor"/>
    `,

    // 13. chevron — generic accordion / dropdown indicator
    // Points down by default; rotate 180° via CSS for an open state.
    chevron: `
      <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,
  };

  /** Wraps a path string in an <svg> element of the requested size. */
  function buildSvg(name, size) {
    const path = PATHS[name];
    if (!path) {
      console.warn('[shlIcon] unknown icon:', name);
      return '';
    }
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" '
      + 'viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" '
      + 'aria-hidden="true" focusable="false">' + path + '</svg>'
    );
  }

  /**
   * Returns an SVG string for the given icon name.
   * @param {string} name  — one of the 13 icon names
   * @param {object} opts  — { size?: number } (default 24)
   */
  window.shlIcon = function (name, opts) {
    var size = (opts && opts.size) || 24;
    return buildSvg(name, size);
  };

  /** Public icon catalogue (for ES module consumers). */
  window.SHL_ICONS = Object.freeze(Object.keys(PATHS));

  // ─── Auto-render any element marked with [data-icon] ─────────────────
  function autoRender(root) {
    var nodes = (root || document).querySelectorAll('[data-icon]');
    nodes.forEach(function (el) {
      // Skip already-rendered (avoid duplicate SVGs on hot reload)
      if (el.dataset.iconRendered === '1') return;
      var name = el.getAttribute('data-icon');
      var size = parseInt(el.getAttribute('data-icon-size') || '24', 10);
      el.innerHTML = buildSvg(name, size);
      el.dataset.iconRendered = '1';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { autoRender(); });
  } else {
    autoRender();
  }

  /** Lets dynamic content (e.g. web components) re-trigger auto-render. */
  window.shlIconRefresh = autoRender;
})();
