/**
 * public/js/feedback.js
 *
 * Quiz + exam review feedback renderer. Replaces the inline feedback HTML
 * construction that previously lived inside quiz.js and exam.js's
 * renderResults() with a single, testable, side-effect-free module.
 *
 * Two surfaces:
 *   renderFeedback(opts)        → in-quiz feedback panel (Layer 1 + 3)
 *   renderReviewFeedback(opts)  → post-exam Mark Sheet panel (always expanded)
 *
 * Both share parseWorkedSolution() which turns the raw worked_solution HTML
 * into a CER block (3 cards) for Claim/Evidence/Reasoning solutions, or a
 * step-numbered ordered list for Step 1 / Step 2 / … solutions, or returns
 * the HTML unchanged inside a wrapper for everything else.
 *
 * Design rules (from ANSWER_FEEDBACK.md handoff):
 *   - Lead with the targeted misconception when the wrong_explanations entry
 *     for the picked option exists. Only fall back to "the model answer" when
 *     no per-option misconception exists for what the student picked.
 *   - On correct, never re-show the correct answer text — the input UI
 *     already shows it as selected. Show affirmation + skill chip + the
 *     worked solution behind a <details>.
 *   - Worked solution is collapsed by default EXCEPT when the wrong path
 *     had no targeted misconception to show — then expand it upfront.
 *   - All parsing is error-shielded; bad HTML must not crash the render.
 *
 * Live wrong_explanations shape (verified against prod):
 *   { "<option text>": { text: "<misconception>", type: "misconception" | "partial_logic" | "calc_error" }, ... }
 *
 * Legacy shape we still tolerate:
 *   { "A": "<plain string>", "B": "<plain string>", ... }   (keyed by letter, value is string)
 *
 * Resolution: we accept both keying schemes (letter or option text) by
 * trying direct lookup first, then letter→option-text via opts.options[].
 */

(function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────

  const AFFIRMATIONS = ['Nailed it.', 'Spot on.', 'On the money.', 'Locked in.'];

  // Canonical icon library. All icons are 1em-sized inline SVGs that take
  // their colour from the parent's `color` (currentColor). Each function
  // returns an HTML string so the renderer can splice them straight in.
  const SVG = {
    check: () =>
      '<svg class="feedback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    cross: () =>
      '<svg class="feedback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    halfCircle: () =>
      '<svg class="feedback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3 A9 9 0 0 1 12 21 Z" fill="currentColor"/></svg>',
    // misconception → thought bubble
    thought: () =>
      '<svg class="feedback-misconception__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    // partial_logic → balance scale
    scale: () =>
      '<svg class="feedback-misconception__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18"/><path d="M3 7h18"/><path d="M7 7l-3 7c1.5 1 4.5 1 6 0z"/><path d="M17 7l-3 7c1.5 1 4.5 1 6 0z"/></svg>',
    // calc_error → calculator
    calc: () =>
      '<svg class="feedback-misconception__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/><line x1="8" y1="19" x2="16" y2="19"/></svg>',
  };

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ─── wrong_explanations resolver ──────────────────────────────────────
  //
  // Tries (in order):
  //   1. Direct key lookup with the student's answer as-is. Catches both
  //      legacy "A"/"B"/"C"/"D" keying AND new-shape full-option-text
  //      keying when the input was the option text.
  //   2. Letter → option text via opts.options[]. Needed when state stores
  //      the letter for MCQ but the data is keyed by option text (the
  //      common case in prod today).
  //
  // Normalises to { text, type } so callers don't care about legacy-string
  // vs new-object shape.
  function lookupWrongExplanation(wrongExplanations, studentAnswer, options) {
    if (!wrongExplanations || studentAnswer == null) return null;
    const keys = Object.keys(wrongExplanations);
    if (keys.length === 0) return null;

    let entry = wrongExplanations[studentAnswer];
    if (entry == null && Array.isArray(options)) {
      const sa = String(studentAnswer).trim();
      if (/^[A-Da-d]$/.test(sa)) {
        const idx = sa.toUpperCase().charCodeAt(0) - 65;
        if (options[idx] != null) entry = wrongExplanations[options[idx]];
      }
    }
    if (entry == null) return null;
    if (typeof entry === 'string') return { text: entry, type: 'misconception' };
    return {
      text: String(entry.text || ''),
      type: String(entry.type || 'misconception'),
    };
  }

  function misconceptionIconFor(type) {
    if (type === 'partial_logic') return SVG.scale();
    if (type === 'calc_error')    return SVG.calc();
    return SVG.thought(); // 'misconception' or any unknown
  }

  // ─── parseWorkedSolution ──────────────────────────────────────────────

  function parseWorkedSolution(html, cognitiveSkill) {
    const raw = String(html || '').trim();
    if (!raw) return '';

    // CER path: only for the explicit cognitive_skill marker AND when all
    // three labels are present. We don't try to be clever — partial CER
    // (Claim only, no Reasoning) falls through to the prose wrapper.
    try {
      if (cognitiveSkill === 'CER (Claim-Evidence-Reasoning)' &&
          /<b>\s*Claim\s*:\s*<\/b>/i.test(raw) &&
          /<b>\s*Evidence\s*:\s*<\/b>/i.test(raw) &&
          /<b>\s*Reasoning\s*:\s*<\/b>/i.test(raw)) {
        const claim     = matchSection(raw, 'Claim',     ['Evidence', 'Reasoning']);
        const evidence  = matchSection(raw, 'Evidence',  ['Reasoning', 'Claim']);
        const reasoning = matchSection(raw, 'Reasoning', ['Claim', 'Evidence']);
        if (claim && evidence && reasoning) {
          return ''
            + '<div class="cer-block">'
              + '<div class="cer-step cer-step--claim"><span class="cer-step__label">Claim</span><div class="cer-step__body">' + claim + '</div></div>'
              + '<div class="cer-step cer-step--evidence"><span class="cer-step__label">Evidence</span><div class="cer-step__body">' + evidence + '</div></div>'
              + '<div class="cer-step cer-step--reasoning"><span class="cer-step__label">Reasoning</span><div class="cer-step__body">' + reasoning + '</div></div>'
            + '</div>';
        }
      }
    } catch (_) { /* fall through to step-list / prose */ }

    // Step-numbered path: detect <b>Step N:</b> markers. Need at least 2
    // for the numbered-list treatment to feel like a sequence.
    try {
      const stepMatches = raw.match(/<b>\s*Step\s*\d+\s*:\s*<\/b>/gi) || [];
      if (stepMatches.length >= 2) {
        const stepRe = /<b>\s*Step\s*(\d+)\s*:\s*<\/b>([\s\S]*?)(?=<b>\s*Step\s*\d+\s*:\s*<\/b>|$)/gi;
        const items  = [];
        let m;
        while ((m = stepRe.exec(raw)) !== null) {
          const num  = String(m[1] || '').trim();
          const body = (m[2] || '').trim();
          items.push({ num, body });
        }
        if (items.length >= 2) {
          return '<ol class="step-list">' +
            items.map(it =>
              '<li><span class="step-list__num">' + escapeHtml(it.num) + '</span>'
              + '<div class="step-list__body">' + it.body + '</div></li>'
            ).join('') +
            '</ol>';
        }
      }
    } catch (_) { /* fall through to prose */ }

    return '<div class="feedback-prose">' + raw + '</div>';
  }

  // Matches "<b>Section:</b> ... up to next <b>Other:</b>" without depending
  // on a fixed boundary keyword. Returns null if the section can't be
  // located cleanly so the caller can bail out gracefully.
  function matchSection(html, section, otherSections) {
    const otherAlt = otherSections
      .map(s => '<b>\\s*' + s + '\\s*:\\s*<\\/b>')
      .join('|');
    const re = new RegExp(
      '<b>\\s*' + section + '\\s*:\\s*<\\/b>([\\s\\S]*?)(?=' + otherAlt + '|$)',
      'i',
    );
    const m = html.match(re);
    if (!m) return null;
    return m[1].trim();
  }

  // ─── renderFeedback (in-quiz live feedback) ───────────────────────────

  function renderFeedback(opts) {
    try {
      const html = _renderFeedbackInner(opts, /* expanded */ false, /* showYourAnswer */ false);
      // eslint-disable-next-line no-console
      console.info('[SHL_FEEDBACK] renderFeedback OK', { status: opts && opts.status, type: 'inline', htmlLen: (html || '').length });
      return html;
    }
    catch (err) {
      // Last-line defence — bad input shouldn't crash the page.
      // eslint-disable-next-line no-console
      console.warn('[SHL_FEEDBACK] renderFeedback failed:', err && err.message);
      return _renderFallback(opts);
    }
  }

  // ─── renderReviewFeedback (post-exam Mark Sheet) ──────────────────────

  function renderReviewFeedback(opts) {
    try {
      const html = _renderFeedbackInner(opts, /* expanded */ true, /* showYourAnswer */ true);
      // eslint-disable-next-line no-console
      console.info('[SHL_FEEDBACK] renderReviewFeedback OK', { status: opts && opts.status, type: 'review', htmlLen: (html || '').length });
      return html;
    }
    catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[SHL_FEEDBACK] renderReviewFeedback failed:', err && err.message);
      return _renderFallback(opts);
    }
  }

  // ─── Shared inner renderer ────────────────────────────────────────────

  function _renderFeedbackInner(opts, alwaysExpanded, showYourAnswer) {
    const status         = opts && opts.status;
    const studentAnswer  = opts && opts.studentAnswer;
    const correctAnswer  = opts && opts.correctAnswer;
    const wrongExpls     = opts && opts.wrongExplanations;
    const workedSolution = (opts && opts.workedSolution) || '';
    const cognitiveSkill = (opts && opts.cognitiveSkill) || '';
    const xpAwarded      = Number((opts && opts.xpAwarded) || 0);
    const options        = (opts && opts.options) || null;

    // 'model' = "Miss Wena is resting" fallback path. Just show the worked
    // solution wrapped in the prose box; no header/affirmation/etc.
    if (status === 'model') {
      return '<div class="feedback-panel feedback-panel--correct">'
        + '<div class="feedback-header"><span style="color:var(--brand-mint)">' + SVG.check() + '</span><span class="feedback-label">Model answer</span></div>'
        + '<div class="feedback-body">' + parseWorkedSolution(workedSolution, cognitiveSkill) + '</div>'
        + '</div>';
    }

    if (status === 'correct') {
      return _renderCorrect({ studentAnswer, cognitiveSkill, workedSolution, xpAwarded, alwaysExpanded });
    }
    if (status === 'partial') {
      return _renderPartial({ studentAnswer, correctAnswer, workedSolution, cognitiveSkill, alwaysExpanded, showYourAnswer });
    }
    // 'wrong' is the default fall-through.
    return _renderWrong({ studentAnswer, correctAnswer, wrongExpls, options, workedSolution, cognitiveSkill, alwaysExpanded, showYourAnswer });
  }

  // ─── Status renderers ─────────────────────────────────────────────────

  function _renderCorrect({ studentAnswer, cognitiveSkill, workedSolution, xpAwarded, alwaysExpanded }) {
    const idx     = ((String(studentAnswer || '').length) % AFFIRMATIONS.length + AFFIRMATIONS.length) % AFFIRMATIONS.length;
    const affirm  = AFFIRMATIONS[idx];
    const xpChip  = xpAwarded > 0
      ? '<span class="feedback-xp">+' + xpAwarded + ' XP</span>'
      : '';
    const skillChip = cognitiveSkill
      ? '<span class="feedback-skill-chip">' + escapeHtml(cognitiveSkill) + '</span>'
      : '';
    const worked = workedSolution
      ? _toggleBlock('Show me how I got there', workedSolution, cognitiveSkill, alwaysExpanded)
      : '';

    return ''
      + '<section class="feedback-panel feedback-panel--correct" data-shl-feedback="correct" role="status" aria-live="polite">'
        + '<div class="feedback-header">'
          + '<span class="feedback-header__icon" style="color:var(--brand-mint)">' + SVG.check() + '</span>'
          + '<span class="feedback-label label-caps" style="color:var(--brand-mint)">Correct</span>'
          + xpChip
        + '</div>'
        + '<p class="feedback-affirm">' + escapeHtml(affirm) + '</p>'
        + (skillChip ? '<div class="feedback-chips">' + skillChip + '</div>' : '')
        + worked
      + '</section>';
  }

  function _renderWrong({ studentAnswer, correctAnswer, wrongExpls, options, workedSolution, cognitiveSkill, alwaysExpanded, showYourAnswer }) {
    const entry = lookupWrongExplanation(wrongExpls, studentAnswer, options);
    const yourAnsLine = showYourAnswer
      ? '<div class="feedback-your-answer"><span class="label-caps feedback-your-answer__label">Your answer</span><div class="feedback-your-answer__value">' + escapeHtml(studentAnswer || '—') + '</div></div>'
      : '';

    let leadHtml;
    let workedExpandedByDefault;

    if (entry && entry.text) {
      // Targeted misconception path. Don't expand the worked solution
      // upfront — let the kid sit with the misconception first.
      const icon = misconceptionIconFor(entry.type);
      leadHtml = ''
        + '<div class="feedback-misconception">'
          + '<div class="feedback-misconception__head">'
            + '<span class="feedback-misconception__type-icon" style="color:var(--brand-rose)">' + icon + '</span>'
            + '<span class="label-caps feedback-misconception__label" style="color:var(--brand-rose)">Why that didn\'t work</span>'
          + '</div>'
          + '<p class="feedback-misconception__body">' + escapeHtml(entry.text) + '</p>'
        + '</div>';
      workedExpandedByDefault = alwaysExpanded;
    } else {
      // No targeted misconception — give the kid the worked solution
      // upfront because we have nothing better to lead with.
      leadHtml = ''
        + '<div class="feedback-misconception">'
          + '<div class="feedback-misconception__head">'
            + '<span class="label-caps feedback-misconception__label" style="color:var(--brand-rose)">The model answer</span>'
          + '</div>'
        + '</div>';
      workedExpandedByDefault = true;
    }

    const correctCard = ''
      + '<div class="feedback-correct-card">'
        + '<span class="feedback-correct-card__icon" style="color:var(--brand-mint)">' + SVG.check() + '</span>'
        + '<div class="feedback-correct-card__inner">'
          + '<span class="label-caps feedback-correct-card__label" style="color:var(--brand-mint)">Correct answer</span>'
          + '<div class="feedback-correct-card__answer">' + escapeHtml(correctAnswer || '—') + '</div>'
        + '</div>'
      + '</div>';

    const skillChip = cognitiveSkill
      ? '<span class="feedback-skill-chip">' + escapeHtml(cognitiveSkill) + '</span>'
      : '';

    const worked = workedSolution
      ? _toggleBlock('See full reasoning', workedSolution, cognitiveSkill, workedExpandedByDefault)
      : '';

    return ''
      + '<section class="feedback-panel feedback-panel--wrong" data-shl-feedback="wrong" role="status" aria-live="polite">'
        + '<div class="feedback-header">'
          + '<span class="feedback-header__icon" style="color:var(--brand-rose)">' + SVG.cross() + '</span>'
          + '<span class="feedback-label label-caps" style="color:var(--brand-rose)">Not quite</span>'
        + '</div>'
        + yourAnsLine
        + leadHtml
        + '<div class="feedback-divider"></div>'
        + correctCard
        + (skillChip ? '<div class="feedback-chips">' + skillChip + '</div>' : '')
        + worked
      + '</section>';
  }

  function _renderPartial({ studentAnswer, correctAnswer, workedSolution, cognitiveSkill, alwaysExpanded, showYourAnswer }) {
    const yourAnsLine = showYourAnswer
      ? '<div class="feedback-your-answer"><span class="label-caps feedback-your-answer__label">Your answer</span><div class="feedback-your-answer__value">' + escapeHtml(studentAnswer || '—') + '</div></div>'
      : '';

    const correctCard = correctAnswer
      ? '<div class="feedback-correct-card">'
          + '<span class="feedback-correct-card__icon" style="color:var(--brand-mint)">' + SVG.check() + '</span>'
          + '<div class="feedback-correct-card__inner">'
            + '<span class="label-caps feedback-correct-card__label" style="color:var(--brand-mint)">Correct answer</span>'
            + '<div class="feedback-correct-card__answer">' + escapeHtml(correctAnswer) + '</div>'
          + '</div>'
        + '</div>'
      : '';

    const skillChip = cognitiveSkill
      ? '<span class="feedback-skill-chip">' + escapeHtml(cognitiveSkill) + '</span>'
      : '';

    const worked = workedSolution
      ? _toggleBlock('See full reasoning', workedSolution, cognitiveSkill, alwaysExpanded)
      : '';

    return ''
      + '<section class="feedback-panel feedback-panel--partial" data-shl-feedback="partial" role="status" aria-live="polite">'
        + '<div class="feedback-header">'
          + '<span class="feedback-header__icon" style="color:var(--brand-amber)">' + SVG.halfCircle() + '</span>'
          + '<span class="feedback-label label-caps" style="color:var(--brand-amber)">Partial credit</span>'
        + '</div>'
        + yourAnsLine
        + correctCard
        + (skillChip ? '<div class="feedback-chips">' + skillChip + '</div>' : '')
        + worked
      + '</section>';
  }

  function _toggleBlock(summaryText, workedHtml, cognitiveSkill, alwaysExpanded) {
    const open = alwaysExpanded ? ' open' : '';
    return ''
      + '<details class="feedback-toggle"' + open + '>'
        + '<summary class="label-caps feedback-toggle__summary">' + escapeHtml(summaryText) + '</summary>'
        + '<div class="feedback-toggle__body">' + parseWorkedSolution(workedHtml, cognitiveSkill) + '</div>'
      + '</details>';
  }

  // Last-resort fallback if the inner render throws. Shows whatever
  // raw worked-solution HTML we have so the parent isn't left with a
  // blank panel.
  function _renderFallback(opts) {
    const ws = (opts && opts.workedSolution) || '';
    return '<section class="feedback-panel feedback-panel--correct">'
      + '<div class="feedback-header"><span class="feedback-label label-caps">Worked solution</span></div>'
      + '<div class="feedback-body">' + (ws || '<em>No feedback available.</em>') + '</div>'
      + '</section>';
  }

  // ─── Module export ────────────────────────────────────────────────────

  const api = {
    renderFeedback,
    renderReviewFeedback,
    parseWorkedSolution,
  };

  if (typeof window !== 'undefined') window.SHL_FEEDBACK = api;
  if (typeof globalThis !== 'undefined') globalThis.SHL_FEEDBACK = api;
})();
