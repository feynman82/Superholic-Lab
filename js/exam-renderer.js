/**
 * exam-renderer.js
 * Renders a generated exam paper as static, print-ready HTML.
 *
 * Exam-mode differs from quiz-mode (quiz.js):
 *   • MCQ options show letter bubbles but no click handler
 *   • Cloze blanks render as underlined answer spaces (not <select>)
 *   • Editing lines render static underlined word + answer input line
 *   • Short-answer and word-problem parts get ruled answer lines
 *   • Open-ended questions get a keyword box and lined answer area
 *
 * Uses the same CSS classes as quiz.js where possible (.mcq-opt, .mcq-badge,
 * .cloze-passage, .editing-line) so shared styling is consistent.
 * Exam-only classes (.exam-*) are defined in css/style.css.
 *
 * Depends on: exam-templates.js, diagram-library.js (loaded before this file)
 */

/* ─── Safety helper ─────────────────────────────────────────────────────── */

/**
 * Escapes a string for safe insertion into HTML attribute values and text nodes.
 * @param {string} str
 * @returns {string}
 */
function _examEsc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─── ExamRenderer ──────────────────────────────────────────────────────── */

const ExamRenderer = {

  /* ── Main entry point ─────────────────────────────────────────────────── */

  /**
   * Renders a complete exam paper into a DOM container.
   *
   * @param {object} paper      - ExamPaper object from ExamGenerator.generate()
   * @param {Element} container - DOM element to render into
   */
  render(paper, container) {
    if (!container) throw new Error('ExamRenderer.render: container is required');
    container.innerHTML = '';

    this.renderCoverPage(paper, container);

    let questionNumber = 1;
    (paper.sections || []).forEach((section, sectionIndex) => {
      questionNumber = this.renderSection(section, sectionIndex, questionNumber, container);
    });
  },

  /* ── Cover page ───────────────────────────────────────────────────────── */

  /**
   * Renders the exam cover page (title, instructions, duration, marks).
   *
   * @param {object}  paper
   * @param {Element} container
   */
  renderCoverPage(paper, container) {
    const template = paper.template || {};
    const durationText = (typeof formatDuration === 'function')
      ? formatDuration(template.durationMinutes || paper.duration || 0)
      : `${template.durationMinutes || paper.duration || 0} minutes`;

    const instructionLines = (paper.instructions || template.instructions || [])
      .map(line => `<li>${_examEsc(line)}</li>`)
      .join('');

    const el = document.createElement('div');
    el.className = 'exam-cover card mb-6 no-print-break';
    el.innerHTML = `
      <div class="card-header text-center">
        <p class="text-sm text-secondary mb-1" style="font-family:var(--font-body);letter-spacing:0.08em;text-transform:uppercase;">
          ${_examEsc(template.level || '')} &nbsp;·&nbsp; ${_examEsc(template.subject || '')}
        </p>
        <h1 class="text-xl font-bold" style="color:var(--cream);">
          ${_examEsc(paper.displayName || template.displayName || 'Exam Paper')}
        </h1>
      </div>
      <div class="card-body">
        <div class="exam-cover-meta">
          <span><strong>Duration:</strong> ${_examEsc(durationText)}</span>
          <span><strong>Total Marks:</strong> ${_examEsc(String(paper.totalMarks || template.totalMarks || 0))}</span>
          ${template.calculatorAllowed
            ? '<span class="badge badge-success">Calculator Allowed</span>'
            : '<span class="badge badge-danger">No Calculator</span>'}
        </div>
        ${instructionLines ? `<ol class="exam-instructions mt-4">${instructionLines}</ol>` : ''}
      </div>
    `;
    container.appendChild(el);
  },

  /* ── Section ──────────────────────────────────────────────────────────── */

  /**
   * Renders a single section heading + all its questions.
   *
   * @param {object}  section
   * @param {number}  sectionIndex
   * @param {number}  startNumber      - 1-based question number for first Q in section
   * @param {Element} container
   * @returns {number}  nextQuestionNumber after this section
   */
  renderSection(section, sectionIndex, startNumber, container) {
    // Section header
    const header = document.createElement('div');
    header.className = 'exam-section-header card mb-4';
    header.innerHTML = `
      <div class="card-body py-3">
        <div class="flex-between">
          <h2 class="font-bold" style="color:var(--mint);">
            ${_examEsc(section.label || `Section ${sectionIndex + 1}`)}
            ${section.title ? ` — ${_examEsc(section.title)}` : ''}
          </h2>
          <span class="badge badge-info">${_examEsc(String(section.sectionMarks || section.totalMarks || 0))} marks</span>
        </div>
        ${section.instructions
          ? `<p class="text-sm text-secondary mt-2">${_examEsc(section.instructions)}</p>`
          : ''}
      </div>
    `;
    container.appendChild(header);

    // Questions
    let qNum = startNumber;
    (section.questions || []).forEach(question => {
      this.renderQuestion(question, qNum, container);
      // Word problems count as one numbered item even though they have parts
      qNum++;
    });

    return qNum;
  },

  /* ── Single question dispatcher ───────────────────────────────────────── */

  /**
   * Renders a single question into container.
   *
   * @param {object}  question   - Question object from JSON bank
   * @param {number}  number     - Display question number (1-based)
   * @param {Element} container
   */
  renderQuestion(question, number, container) {
    const wrap = document.createElement('div');
    wrap.className = 'exam-question card mb-4 no-print-break';
    wrap.setAttribute('data-q-id', _examEsc(question.id || ''));
    wrap.setAttribute('data-q-type', _examEsc(question.type || ''));

    // Question header: number + marks badge
    const marks = question.marks || (question.parts || []).reduce((s, p) => s + (p.marks || 1), 0);
    const headerHtml = `
      <div class="card-header py-3 flex-between">
        <span class="font-bold" style="color:var(--cream);">Question ${number}</span>
        <span class="badge badge-info">${marks} mark${marks !== 1 ? 's' : ''}</span>
      </div>
    `;

    // Diagram (if present) + question text
    let bodyHtml = headerHtml + '<div class="card-body">';

    // 🚀 NEW: Render AI-Generated visual_payload diagrams (Using the Master Router)
    let dynamicDiagramHtml = '';
    if (question.visual_payload && typeof DiagramLibrary !== 'undefined') {
      dynamicDiagramHtml = `
        <div class="exam-diagram-payload mb-4 flex justify-center w-full">
          ${DiagramLibrary.render(question.visual_payload)}
        </div>
      `;
    }

    // Legacy manual diagram support (above)
    if (question.diagram && question.diagram.position === 'above') {
      bodyHtml += this._diagramHtml(question.diagram);
    }

    // Question text — side-by-side layout if legacy diagram is 'right'
    if (question.diagram && question.diagram.position === 'right') {
      bodyHtml += `<div class="diagram-right-layout">
        <div class="diagram-right-text">`;
    }

    bodyHtml += `<p class="exam-question-text mb-4" style="white-space: pre-line;">${_examEsc(question.question_text || '')}</p>`;

    // 🚀 INJECT DYNAMIC DIAGRAM HERE (Below text, above inputs)
    bodyHtml += dynamicDiagramHtml;

    if (question.diagram && question.diagram.position === 'right') {
      bodyHtml += `</div><div class="diagram-right-figure">${this._diagramHtml(question.diagram)}</div></div>`;
    }

    // Legacy diagram below question text
    if (question.diagram && question.diagram.position === 'below') {
      bodyHtml += this._diagramHtml(question.diagram);
    }

    // Type-specific answer area
    switch (question.type) {
      case 'mcq':
        bodyHtml += this._renderMCQ(question);
        break;
      case 'short_ans':
        bodyHtml += this._renderShortAns(question);
        break;
      case 'word_problem':
        bodyHtml += this._renderWordProblem(question);
        break;
      case 'open_ended':
        bodyHtml += this._renderOpenEnded(question);
        break;
      case 'cloze':
        bodyHtml += this._renderCloze(question);
        break;
      case 'editing':
        bodyHtml += this._renderEditing(question);
        break;
      default:
        bodyHtml += `<p class="text-secondary text-sm">[Question type "${_examEsc(question.type)}" not yet supported in print mode]</p>`;
    }

    bodyHtml += '</div>'; // card-body
    wrap.innerHTML = bodyHtml;
    container.appendChild(wrap);
  },

  /* ── Diagram helper ───────────────────────────────────────────────────── */

  /**
   * Renders a diagram object into an HTML string.
   * Calls DiagramLibrary[type](params) if available, else shows placeholder.
   *
   * @param {object} diagram  - { type, position, params }
   * @returns {string}  HTML string (wrapping div + SVG or table)
   */
  _diagramHtml(diagram) {
    const posClass = {
      above: 'diagram-above',
      below: 'diagram-below',
      right: '',  // handled by wrapper layout
    }[diagram.position] || 'diagram-above';

    let svgHtml = '';
    if (typeof DiagramLibrary !== 'undefined' && typeof DiagramLibrary[diagram.type] === 'function') {
      try {
        svgHtml = DiagramLibrary[diagram.type](diagram.params || {});
      } catch (e) {
        svgHtml = DiagramLibrary.placeholder({ description: `${diagram.type} diagram`, width: 300, height: 150 });
      }
    } else {
      // DiagramLibrary not loaded — render labelled placeholder box
      svgHtml = `<div class="exam-diagram-placeholder">[Diagram: ${_examEsc(diagram.type)}]</div>`;
    }

    return `<div class="${posClass} exam-diagram mb-4">${svgHtml}</div>`;
  },

  /* ── MCQ ──────────────────────────────────────────────────────────────── */

  /**
   * Renders MCQ options in exam mode (static bubbles, no click handler).
   * Uses .mcq-opt and .mcq-badge classes (same as quiz.js) for visual parity.
   *
   * @param {object} question
   * @returns {string} HTML
   */
  _renderMCQ(question) {
    const letters = ['A', 'B', 'C', 'D'];
    const options = question.options || [];
    const lines = options.map((opt, i) => {
      const letter = letters[i] || String.fromCharCode(65 + i);
      return `
        <div class="mcq-opt exam-mcq-opt" style="pointer-events:none;cursor:default;">
          <span class="mcq-badge">${_examEsc(letter)}</span>
          <span class="font-medium">${_examEsc(opt)}</span>
          <span class="exam-mcq-bubble" aria-hidden="true"></span>
        </div>`;
    });
    return `<div class="exam-mcq-options">${lines.join('')}</div>`;
  },

  /* ── Short answer ─────────────────────────────────────────────────────── */

  /**
   * Renders a short-answer answer line.
   * @param {object} question
   * @returns {string} HTML
   */
  _renderShortAns(question) {
    return `
      <div class="exam-answer-area">
        <div class="exam-answer-line" aria-label="Answer line"></div>
        <div class="exam-answer-line" aria-label="Answer line"></div>
      </div>`;
  },

  /* ── Word problem ─────────────────────────────────────────────────────── */

  /**
   * Renders word problem parts with working space and answer lines.
   * @param {object} question
   * @returns {string} HTML
   */
  _renderWordProblem(question) {
    const parts = (question.parts || []).map(part => {
      const marksText = part.marks === 1 ? '[1 mark]' : `[${part.marks} marks]`;
      return `
        <div class="exam-word-part mb-4">
          <p class="font-semibold mb-2">${_examEsc(part.label)} ${_examEsc(part.question)}
            <span class="text-secondary text-sm ml-2">${marksText}</span>
          </p>
          <div class="exam-working-space" aria-label="Working space">
            <span class="exam-working-label">Working</span>
          </div>
          <div class="exam-answer-line mt-2" aria-label="Answer line"></div>
        </div>`;
    });

    // If no parts defined, render generic working + answer area
    if (parts.length === 0) {
      return `
        <div class="exam-working-space" aria-label="Working space">
          <span class="exam-working-label">Working</span>
        </div>
        <div class="exam-answer-line mt-2" aria-label="Answer line"></div>`;
    }

    return `<div class="exam-word-parts">${parts.join('')}</div>`;
  },

  /* ── Open-ended (Science) ─────────────────────────────────────────────── */

  /**
   * Renders open-ended question with keyword box and lined answer area.
   * @param {object} question
   * @returns {string} HTML
   */
  _renderOpenEnded(question) {
    const keywords = question.keywords || [];
    const keywordHint = keywords.length > 0
      ? `<div class="exam-keyword-box mb-3">
           <span class="exam-keyword-label">Key terms to include:</span>
           ${keywords.map(k => `<span class="badge badge-info exam-keyword">${_examEsc(k)}</span>`).join(' ')}
         </div>`
      : '';

    // Lined answer space (6 answer lines)
    const answerLines = Array.from({ length: 6 })
      .map(() => `<div class="exam-answer-line"></div>`)
      .join('');

    return `
      ${keywordHint}
      <div class="exam-answer-area">${answerLines}</div>`;
  },

  /* ── Cloze ────────────────────────────────────────────────────────────── */

  /**
   * Renders cloze passage with exam-style answer blanks (underlined spaces).
   * Uses .cloze-passage class (same as quiz.js) for visual parity.
   * Blanks render as <span class="exam-blank"> instead of <select>.
   *
   * @param {object} question
   * @returns {string} HTML
   */
  _renderCloze(question) {
    const blanks = question.blanks || [];
    const blankMap = {};
    blanks.forEach(b => {
      blankMap[b.number] = b;
    });

    // Replace [N] tokens in passage with exam blanks
    const passage = (question.passage || '').replace(/\[(\d+)\]/g, (_, numStr) => {
      const num = parseInt(numStr, 10);
      const blank = blankMap[num];
      if (!blank) return `<span class="exam-blank" data-blank="${num}">________</span>`;

      const optionLetters = ['A', 'B', 'C', 'D'];
      const optionList = (blank.options || [])
        .map((opt, i) => `${optionLetters[i] || i + 1}. ${_examEsc(opt)}`)
        .join('&nbsp;&nbsp;');

      return `<span class="exam-blank" data-blank="${num}" title="${optionList}">
        <span class="exam-blank-num">(${num})</span>________
      </span>`;
    });

    // Options table below passage
    const optionRows = blanks.map(b => {
      const optionLetters = ['A', 'B', 'C', 'D'];
      const opts = (b.options || []).map((opt, i) => `${optionLetters[i]}. ${_examEsc(opt)}`).join('&emsp;');
      return `<tr><td class="text-secondary pr-4">(${b.number})</td><td>${opts}</td></tr>`;
    }).join('');

    return `
      <div class="cloze-passage card-body mb-4" style="pointer-events:none;">${passage}</div>
      ${blanks.length > 0 ? `<table class="exam-cloze-options text-sm"><tbody>${optionRows}</tbody></table>` : ''}`;
  },

  /* ── Editing ──────────────────────────────────────────────────────────── */

  /**
   * Renders editing passage lines with underlined words and answer boxes.
   * Uses .editing-line class (same as quiz.js) for visual parity.
   *
   * @param {object} question
   * @returns {string} HTML
   */
  _renderEditing(question) {
    const lines = (question.passage_lines || []).map(line => {
      // Wrap the underlined word in an exam-style underline span
      const text = _examEsc(line.text || '');
      const underlined = _examEsc(line.underlined_word || '');
      const markedText = underlined
        ? text.replace(underlined, `<span class="exam-underlined">${underlined}</span>`)
        : text;

      return `
        <div class="editing-line exam-editing-line">
          <span class="text-secondary text-sm mr-3">${line.line_number}.</span>
          <span class="exam-editing-text">${markedText}</span>
          <span class="exam-editing-answer-box" aria-label="Correction box"></span>
        </div>`;
    });

    return `
      <div class="exam-editing-passage">
        ${lines.join('')}
      </div>
      <p class="text-sm text-secondary mt-3">
        Write the correct word in the box. If the line is correct, write <strong>C</strong>.
      </p>`;
  },

  /* ── Marking scheme ───────────────────────────────────────────────────── */

  /**
   * Renders an answer key / marking scheme view.
   *
   * @param {object}  paper
   * @param {Element} container
   */
  renderMarkingScheme(paper, container) {
    const heading = document.createElement('div');
    heading.className = 'exam-marking-heading card mb-4';
    heading.innerHTML = `
      <div class="card-header">
        <h2 class="font-bold" style="color:var(--brand-rose);">Marking Scheme — ${_examEsc(paper.displayName || '')}</h2>
      </div>`;
    container.appendChild(heading);

    let qNum = 1;
    (paper.sections || []).forEach(section => {
      const secEl = document.createElement('div');
      secEl.className = 'exam-marking-section mb-4';
      secEl.innerHTML = `<h3 class="font-semibold mb-2" style="color:var(--mint);">${_examEsc(section.label || '')}</h3>`;

      (section.questions || []).forEach(q => {
        const ansEl = document.createElement('div');
        ansEl.className = 'exam-marking-row mb-2 text-sm';

        let answerText = '';
        if (q.type === 'mcq') {
          answerText = `<strong>${_examEsc(q.correct_answer)}</strong>`;
        } else if (q.type === 'short_ans') {
          answerText = _examEsc(q.correct_answer || '');
          if (q.accept_also && q.accept_also.length) {
            answerText += ` <span class="text-secondary">(also: ${q.accept_also.map(_examEsc).join(', ')})</span>`;
          }
        } else if (q.type === 'word_problem') {
          answerText = (q.parts || []).map(p =>
            `${_examEsc(p.label)} ${_examEsc(p.correct_answer)}`
          ).join(' | ');
        } else if (q.type === 'open_ended') {
          answerText = `<em>${_examEsc(q.model_answer || '')}</em>`;
        } else if (q.type === 'cloze') {
          answerText = (q.blanks || []).map(b =>
            `(${b.number}) ${_examEsc(b.correct_answer)}`
          ).join(' | ');
        } else if (q.type === 'editing') {
          const errorLine = (q.passage_lines || []).find(l => l.has_error);
          if (errorLine) {
            answerText = `Line ${errorLine.line_number}: <strong>${_examEsc(errorLine.correct_word)}</strong>`;
          } else {
            answerText = 'No error (C)';
          }
        }

        ansEl.innerHTML = `
          <span class="text-secondary mr-2">Q${qNum}.</span>
          ${answerText}`;
        secEl.appendChild(ansEl);
        qNum++;
      });

      container.appendChild(secEl);
    });
  },
};

// Expose globally
if (typeof window !== 'undefined') {
  window.ExamRenderer = ExamRenderer;
}
if (typeof globalThis !== 'undefined') {
  globalThis.ExamRenderer = ExamRenderer;
}

// TEST: Open pages/exam.html → generate a paper → call:
//   const container = document.getElementById('exam-output');
//   ExamRenderer.render(window._lastPaper, container);
//   → should render cover page + sections with Q numbers
//   window.print() → nav/buttons hidden, questions don't split across pages
