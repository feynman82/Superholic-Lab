/**
 * /js/bottom-nav.js — Superholic Lab bottom navigation web component
 *
 * Replaces inline copies of <nav class="bottom-nav"> with a single source.
 * Pages just drop in <global-bottom-nav></global-bottom-nav>.
 *
 * The nav has 5 items in this order:
 *   Practise → AI Tutor → Quest → Exam → Progress
 *
 * QUEST item is hidden by default. app-shell.js calls
 *   document.querySelector('global-bottom-nav').setQuestActive(true)
 * when the active student has an in-flight quest. Hidden when no quest, so
 * we don't clutter the nav with an empty destination.
 *
 * APP-SHELL HANDOFF:
 *   - app-shell.js still does Junior guardrail (hide Exam for P1/P2)
 *   - app-shell.js still propagates ?student=<id> into nav links
 *   - app-shell.js still toggles is-active based on URL
 *   The component just renders markup — it does NOT replicate that logic.
 *
 * DEPENDENCIES:
 *   /js/icons.js must load before this component for icons to render.
 *   If icons.js hasn't loaded yet, falls back to fallback inline SVG paths.
 *
 * TEST: Open any page that uses this component. In console:
 *   document.querySelector('global-bottom-nav').setQuestActive(true)
 *   → Quest item appears with rose pulse-ring
 *
 *   document.querySelector('global-bottom-nav').setQuestActive(false)
 *   → Quest item hides cleanly
 */

(function () {
  'use strict';

  // Map nav slug → { href, label, iconName }
  // Single canonical nav. No variants. account.html, dashboard.html and
  // every other page render the same 5 items for consistency.
  const NAV_ITEMS = [
    { slug: 'practise', href: '/pages/subjects.html', label: 'Practise', icon: 'quiz'    },
    { slug: 'tutor',    href: '/pages/tutor.html',    label: 'AI Tutor', icon: 'tutor'   },
    { slug: 'quest',    href: '/quest',               label: 'Quest',    icon: 'quest'   },
    { slug: 'exam',     href: '/pages/exam.html',     label: 'Exam',     icon: 'exam'    },
    { slug: 'progress', href: '/pages/progress.html', label: 'Progress', icon: 'progress'},
  ];

  /**
   * Returns the SVG markup for an icon.
   * Prefers /js/icons.js shlIcon() if loaded; falls back to inline SVG.
   */
  function iconSvg(name) {
    if (typeof window.shlIcon === 'function') {
      return window.shlIcon(name);
    }
    // Minimal fallbacks so the nav still renders if icons.js is missing.
    const fallbacks = {
      quiz:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
      tutor:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
      quest:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h11l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"/><circle cx="12" cy="14" r="3.2"/></svg>',
      exam:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="17" rx="1.5"/><rect x="9" y="2.5" width="6" height="3.5" rx="1"/><path d="M9 11h6M9 14h6"/></svg>',
      progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    };
    return fallbacks[name] || '';
  }

  /**
   * <global-bottom-nav>
   *
   * Methods (exposed on the element):
   *   setQuestActive(bool)  → show/hide Quest item
   *   setActive(slug)       → mark a slug as is-active (and clear others)
   */
  class GlobalBottomNav extends HTMLElement {
    connectedCallback() {
      // ─── Inline styles (scoped via .shl-bottom-nav class) ─────────────
      // Most styles already exist in style.css under .bottom-nav / .bottom-nav-item.
      // We add just the Quest-specific touches here so the rest stays themable.
      this.innerHTML = `
        <style>
          global-bottom-nav { display: contents; }

          /* Quest item visibility — controlled by the [data-quest-visible] attr on the wrapper */
          global-bottom-nav .bottom-nav-item[data-slug="quest"] {
            display: none;
          }
          global-bottom-nav[data-quest-visible="true"] .bottom-nav-item[data-slug="quest"] {
            display: flex;
          }

          /* Quest gets the rose accent treatment when visible */
          global-bottom-nav .bottom-nav-item[data-slug="quest"] {
            position: relative;
            color: var(--brand-rose);
          }
          global-bottom-nav .bottom-nav-item[data-slug="quest"].is-active {
            color: var(--brand-rose);
          }

          /* Pulse ring around the Quest icon — only when quest is visible AND
             we're not currently ON the quest page. This signals "next action". */
          global-bottom-nav[data-quest-visible="true"]
            .bottom-nav-item[data-slug="quest"]:not(.is-active) svg {
            animation: shlQuestPulse 2.4s ease-in-out infinite;
          }
          @keyframes shlQuestPulse {
            0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 0 rgba(183,110,121,0)); }
            50%      { transform: scale(1.08); filter: drop-shadow(0 0 6px rgba(183,110,121,0.55)); }
          }

          /* Subtle rose dot above the Quest icon when there's an active quest */
          global-bottom-nav[data-quest-visible="true"]
            .bottom-nav-item[data-slug="quest"]::after {
            content: '';
            position: absolute;
            top: 6px;
            right: calc(50% - 14px);
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--brand-rose);
            box-shadow: 0 0 0 2px var(--bg-page);
          }
        </style>

        <nav class="bottom-nav" aria-label="Primary mobile navigation" data-shl-bottom-nav>
          ${NAV_ITEMS.map(function (item) {
            const iconHtml = iconSvg(item.icon);
            return (
              '<a href="' + item.href + '" '
              + 'class="bottom-nav-item" '
              + 'data-slug="' + item.slug + '">'
              + iconHtml
              + '<span>' + item.label + '</span>'
              + '</a>'
            );
          }).join('')}
        </nav>
      `;

      // ─── Auto-mark active item from URL ────────────────────────────────
      // app-shell.js also does this, but for pages that DON'T initialise
      // app-shell (e.g. subject landing pages with guardPage(false)), this
      // ensures the active state still works.
      this._syncActiveFromUrl();
    }

    /** Public API: mark/unmark the Quest item visible. */
    setQuestActive(visible) {
      this.setAttribute('data-quest-visible', visible ? 'true' : 'false');
    }

    /** Public API: set is-active class on a specific slug. */
    setActive(slug) {
      this.querySelectorAll('.bottom-nav-item').forEach(function (a) {
        if (a.getAttribute('data-slug') === slug) a.classList.add('is-active');
        else a.classList.remove('is-active');
      });
    }

    _syncActiveFromUrl() {
      const path = window.location.pathname;
      const items = this.querySelectorAll('.bottom-nav-item');
      items.forEach(function (a) {
        const href = a.getAttribute('href') || '';
        // Match by pathname suffix — covers /pages/quiz.html and /quest equally
        const target = href.replace(/^https?:\/\/[^/]+/, '');
        if (target && (path === target || path.endsWith(target.replace(/^\//, '/')))) {
          a.classList.add('is-active');
        }
      });
    }
  }

  if (!customElements.get('global-bottom-nav')) {
    customElements.define('global-bottom-nav', GlobalBottomNav);
  }
})();
