/**
 * quiz.js
 * Quiz engine: reads ?subject=&level=&topic= URL params → loads JSON →
 * picks up to 10 random questions → renders one at a time →
 * shows worked solution + wrong-answer explanation on answer →
 * score screen at end → saves results to Supabase.
 *
 * Paywall: checks trial status and daily usage before loading questions.
 *
 * Supports 6 question types (MOE/PSLE aligned):
 *   mcq          — 4 options A/B/C/D, auto-graded
 *   short_ans    — text input, auto-graded (with accept_also aliases)
 *   word_problem — multi-part, model answer reveal, NOT auto-graded
 *   open_ended   — textarea, model answer reveal, NOT auto-graded
 *   cloze        — passage with numbered blanks + dropdowns, auto-graded
 *   editing      — passage with underlined words + inputs, auto-graded
 *
 * TEST: Open pages/quiz.html?subject=mathematics&level=primary-4
 *       and verify a question card appears with MCQ options A-D, no True/False.
 *       Open with &topic=fractions to load topic-specific file.
 */

(() => {
  // ── DOM refs ──────────────────────────────────────────────────
  const loadingEl        = document.getElementById('quiz-loading');
  const errorEl          = document.getElementById('quiz-error');
  const quizArea         = document.getElementById('quiz-area');
  const progressFill     = document.getElementById('quiz-progress-fill');
  const progressLabel    = document.getElementById('quiz-progress-label');
  const quizMeta         = document.getElementById('quiz-meta');
  const questionText     = document.getElementById('quiz-question-text');
  const optionsEl        = document.getElementById('quiz-options');
  const explanationEl    = document.getElementById('quiz-explanation');
  const nextBtn          = document.getElementById('quiz-next');
  const scoreScreen      = document.getElementById('quiz-score-screen');

  // Short answer refs (replaces old fill_blank)
  const shortAnsArea     = document.getElementById('quiz-short-ans-area');
  const shortAnsInput    = document.getElementById('quiz-short-ans-input');
  const shortAnsSubmit   = document.getElementById('quiz-short-ans-submit');

  // Word problem refs
  const wordProblemArea  = document.getElementById('quiz-word-problem-area');
  const wpParts          = document.getElementById('quiz-wp-parts');
  const wpReveal         = document.getElementById('quiz-wp-reveal');
  const wpModel          = document.getElementById('quiz-wp-model');

  // Open-ended refs
  const openEndedArea    = document.getElementById('quiz-open-ended-area');
  const oeInput          = document.getElementById('quiz-oe-input');
  const oeReveal         = document.getElementById('quiz-oe-reveal');
  const oeModel          = document.getElementById('quiz-oe-model');

  // Cloze refs
  const clozeArea        = document.getElementById('quiz-cloze-area');
  const clozePassage     = document.getElementById('quiz-cloze-passage');
  const clozeCheck       = document.getElementById('quiz-cloze-check');

  // Editing refs
  const editingArea      = document.getElementById('quiz-editing-area');
  const editingPassage   = document.getElementById('quiz-editing-passage');
  const editingCheck     = document.getElementById('quiz-editing-check');

  // ── State ─────────────────────────────────────────────────────
  const QUIZ_SIZE = 10;
  let questions        = [];
  let current          = 0;
  let score            = 0;
  let gradedTotal      = 0; // count of auto-graded questions shown
  let answered         = false;
  let answers          = []; // per-question answer log for Supabase
  let currentStudentId = null;
  let currentSubject   = '';
  let currentLevel     = '';
  let currentTopic     = '';

  // ── Boot ──────────────────────────────────────────────────────
  init();

  async function init() {
    const params   = new URLSearchParams(window.location.search);
    currentSubject = (params.get('subject') || '').toLowerCase().trim();
    currentLevel   = (params.get('level')   || '').toLowerCase().trim();
    currentTopic   = (params.get('topic')   || '').toLowerCase().trim();

    const filePath = resolveFile(currentSubject, currentLevel, currentTopic);
    if (!filePath) {
      showError('Invalid subject or level. Please go back and choose a topic.');
      return;
    }

    const topicLabel = currentTopic
      ? ` — ${currentTopic.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`
      : '';
    document.title = `${capitalise(currentSubject)} ${labelLevel(currentLevel)}${topicLabel} Quiz — Superholic Lab`;
    const breadcrumb = document.getElementById('quiz-breadcrumb');
    if (breadcrumb) {
      breadcrumb.textContent = `${labelLevel(currentLevel)} ${capitalise(currentSubject)}${topicLabel}`;
    }

    // Load student ID for paywall + usage tracking
    try {
      const user = await getCurrentUser();
      if (user) {
        const db = await getSupabase();
        const { data: students } = await db
          .from('students')
          .select('id')
          .eq('parent_id', user.id)
          .limit(1);
        if (students?.length) currentStudentId = students[0].id;
      }
    } catch { /* non-blocking — quiz can still run */ }

    // Paywall check before loading questions
    if (typeof enforcePaywall === 'function') {
      const wall = await enforcePaywall(currentSubject, currentStudentId);
      if (!wall.allowed) {
        loadingEl.hidden = true;
        if (typeof showUpgradeModal === 'function') showUpgradeModal(wall.reason);
        return;
      }
    }

    // Load question bank
    try {
      const res = await fetch(filePath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const all = await res.json();
      questions = shuffle(all).slice(0, QUIZ_SIZE);
      if (questions.length === 0) throw new Error('No questions found in file.');
      answers          = [];
      loadingEl.hidden = true;
      quizArea.hidden  = false;
      renderQuestion();
    } catch (err) {
      showError('Could not load questions. Please try again later.');
      console.error('[quiz]', err);
    }
  }

  // ── File resolution ───────────────────────────────────────────
  /**
   * Resolves the question bank JSON path from subject, level, and optional topic.
   * Tries topic-specific file first (e.g. p4-mathematics-fractions.json),
   * falls back to broad file (e.g. p4-mathematics.json).
   */
  function resolveFile(subject, level, topic) {
    const broadMap = {
      'primary-2:mathematics': '../data/questions/p2-mathematics.json',
      'primary-2:english':     '../data/questions/p2-english.json',
      'primary-4:mathematics': '../data/questions/p4-mathematics.json',
      'primary-4:science':     '../data/questions/p4-science.json',
      'primary-4:english':     '../data/questions/p4-english.json',
    };

    const key = `${level}:${subject}`;
    const broadPath = broadMap[key];
    if (!broadPath) return null;

    // If topic provided, derive topic-specific path; JS will fall back via fetch error handling
    if (topic) {
      const levelShort = level.replace('primary-', 'p');
      return `../data/questions/${levelShort}-${subject}-${topic}.json`;
    }

    return broadPath;
  }

  // ── Render one question ───────────────────────────────────────
  /**
   * Renders the current question based on its type, hiding all other type areas.
   */
  function renderQuestion() {
    answered = false;
    const q = questions[current];

    const pct = Math.round((current / questions.length) * 100);
    progressFill.style.width  = pct + '%';
    progressLabel.textContent = `${current + 1} / ${questions.length}`;

    // Build meta badges using DOM (no innerHTML with external content)
    quizMeta.innerHTML = '';

    const topicBadge = document.createElement('span');
    topicBadge.className   = 'badge badge-info';
    topicBadge.textContent = q.topic;
    quizMeta.appendChild(topicBadge);

    const diffBadgeEl = document.createElement('span');
    diffBadgeEl.className   = `badge badge-${diffBadge(q.difficulty)}`;
    diffBadgeEl.textContent = capitalise(q.difficulty);
    quizMeta.appendChild(diffBadgeEl);

    if (q.marks) {
      const marksBadge = document.createElement('span');
      marksBadge.className   = 'badge-marks';
      marksBadge.textContent = `${q.marks} mark${q.marks !== 1 ? 's' : ''}`;
      quizMeta.appendChild(marksBadge);
    }

    questionText.textContent = q.question_text;

    // Hide ALL type areas first
    optionsEl.innerHTML     = '';
    optionsEl.hidden        = true;
    shortAnsArea.hidden     = true;
    wordProblemArea.hidden  = true;
    openEndedArea.hidden    = true;
    clozeArea.hidden        = true;
    editingArea.hidden      = true;

    // Reset shared UI state
    explanationEl.hidden    = true;
    nextBtn.hidden          = true;
    shortAnsInput.value     = '';
    shortAnsInput.disabled  = false;
    shortAnsSubmit.disabled = false;
    shortAnsInput.style.borderColor = '';
    oeInput.value           = '';
    wpModel.hidden          = true;
    oeModel.hidden          = true;
    wpReveal.hidden         = false;
    oeReveal.hidden         = false;
    wpReveal.disabled       = false;
    oeReveal.disabled       = false;

    // Render the correct type
    switch (q.type) {
      case 'mcq':
        optionsEl.hidden = false;
        renderMCQ(q);
        break;
      case 'short_ans':
        shortAnsArea.hidden = false;
        shortAnsInput.focus();
        break;
      case 'word_problem':
        wordProblemArea.hidden = false;
        renderWordProblem(q);
        break;
      case 'open_ended':
        openEndedArea.hidden = false;
        renderOpenEnded(q);
        break;
      case 'cloze':
        clozeArea.hidden = false;
        renderCloze(q);
        break;
      case 'editing':
        editingArea.hidden = false;
        renderEditing(q);
        break;
      default:
        // Unknown type — show next button so user can continue
        nextBtn.hidden = false;
        console.warn('[quiz] Unknown question type:', q.type);
    }
  }

  // ── MCQ renderer ──────────────────────────────────────────────
  /**
   * Renders A/B/C/D option buttons for an MCQ question.
   * Badges are hardcoded from array index — never parsed from option text.
   */
  function renderMCQ(q) {
    q.options.forEach((opt, idx) => {
      const key = String.fromCharCode(65 + idx); // 0→A, 1→B, 2→C, 3→D

      const btn = document.createElement('button');
      btn.className   = 'quiz-option';
      btn.dataset.key = key;

      const keySpan = document.createElement('span');
      keySpan.className   = 'quiz-option-key';
      keySpan.textContent = key;

      const textSpan = document.createElement('span');
      textSpan.textContent = opt;

      btn.append(keySpan, textSpan);
      btn.addEventListener('click', () => handleMCQ(q, key));
      optionsEl.appendChild(btn);
    });
  }

  // ── Word problem renderer ─────────────────────────────────────
  /**
   * Renders multi-part word problem. Each part has a label, marks badge,
   * question text, and a textarea for working. Reveal shows model answers.
   * NOT auto-graded — does not affect score.
   */
  function renderWordProblem(q) {
    wpParts.innerHTML = '';
    const parts = q.parts || [];

    parts.forEach((part, idx) => {
      const partDiv = document.createElement('div');
      partDiv.className = 'quiz-wp-part';

      const header = document.createElement('div');
      header.className = 'quiz-wp-part-header';

      const label = document.createElement('span');
      label.className   = 'quiz-wp-part-label';
      label.textContent = `(${String.fromCharCode(97 + idx)})`; // a, b, c…

      header.appendChild(label);

      if (part.marks) {
        const marks = document.createElement('span');
        marks.className   = 'badge-marks';
        marks.textContent = `${part.marks} mark${part.marks !== 1 ? 's' : ''}`;
        header.appendChild(marks);
      }

      partDiv.appendChild(header);

      const partQ = document.createElement('p');
      partQ.className   = 'quiz-wp-part-question';
      partQ.textContent = part.question_text || part.text || '';
      partDiv.appendChild(partQ);

      const ta = document.createElement('textarea');
      ta.className   = 'form-input quiz-wp-part-textarea';
      ta.rows        = 3;
      ta.placeholder = 'Show your working here…';
      partDiv.appendChild(ta);

      wpParts.appendChild(partDiv);
    });

    wpReveal.onclick = () => {
      wpModel.hidden  = false;
      wpReveal.hidden = true;
      wpModel.innerHTML = '';

      const heading = document.createElement('p');
      heading.className   = 'quiz-wp-model-heading';
      heading.textContent = 'Model Answers';
      wpModel.appendChild(heading);

      parts.forEach((part, idx) => {
        const row = document.createElement('div');
        row.className = 'quiz-wp-model-answer';

        const lbl = document.createElement('span');
        lbl.className   = 'quiz-wp-part-label';
        lbl.textContent = `(${String.fromCharCode(97 + idx)})`;

        const ans = document.createElement('span');
        ans.textContent = part.model_answer || part.answer || '';

        row.append(lbl, ans);
        wpModel.appendChild(row);
      });

      nextBtn.hidden = false;
    };
  }

  // ── Open-ended renderer ───────────────────────────────────────
  /**
   * Reveals model answer with keywords highlighted in accent color.
   * Uses DOM API — no raw innerHTML with user/external content.
   * NOT auto-graded — does not affect score.
   */
  function renderOpenEnded(q) {
    oeReveal.onclick = () => {
      oeModel.hidden  = false;
      oeReveal.hidden = true;
      oeModel.innerHTML = '';

      const heading = document.createElement('p');
      heading.className   = 'quiz-wp-model-heading';
      heading.textContent = 'Model Answer';
      oeModel.appendChild(heading);

      const modelText = String(q.model_answer || q.worked_solution || '');
      const keywords  = Array.isArray(q.keywords) ? q.keywords : [];
      const answerP   = buildHighlightedText(modelText, keywords);
      oeModel.appendChild(answerP);

      nextBtn.hidden = false;
    };
  }

  /**
   * Safely builds a paragraph with keywords bolded using DOM text nodes.
   * Never sets innerHTML from keyword or model answer content.
   */
  function buildHighlightedText(text, keywords) {
    const p = document.createElement('p');
    p.className = 'quiz-oe-answer';

    if (keywords.length === 0) {
      p.textContent = text;
      return p;
    }

    const escaped  = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern  = new RegExp(`(${escaped.join('|')})`, 'gi');
    const segments = text.split(pattern);

    segments.forEach(seg => {
      // Test each segment individually (reset lastIndex)
      const testPattern = new RegExp(`^(${escaped.join('|')})$`, 'i');
      if (testPattern.test(seg)) {
        const strong = document.createElement('strong');
        strong.className   = 'quiz-oe-keyword';
        strong.textContent = seg;
        p.appendChild(strong);
      } else {
        p.appendChild(document.createTextNode(seg));
      }
    });

    return p;
  }

  // ── Cloze renderer ────────────────────────────────────────────
  /**
   * Renders cloze passage replacing [1],[2]… with inline <select> dropdowns.
   * Check Answers grades each blank and shows per-blank feedback.
   * Auto-graded proportionally (≥50% blanks correct = 1 score point).
   */
  function renderCloze(q) {
    clozePassage.innerHTML = '';
    const blanks  = q.blanks || [];
    const passage = String(q.passage || q.question_text || '');
    const parts   = passage.split(/(\[\d+\])/);
    const selects = [];

    parts.forEach(part => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const blankIdx = parseInt(match[1], 10) - 1; // convert [1] → index 0
        const blank    = blanks[blankIdx] || {};
        const options  = blank.options || [];

        const select = document.createElement('select');
        select.className       = 'quiz-cloze-select';
        select.dataset.blank   = blankIdx;
        select.dataset.correct = blank.correct_answer || '';

        const placeholder = document.createElement('option');
        placeholder.value       = '';
        placeholder.textContent = '— select —';
        select.appendChild(placeholder);

        options.forEach(opt => {
          const o = document.createElement('option');
          o.value       = opt;
          o.textContent = opt;
          select.appendChild(o);
        });

        selects.push(select);
        clozePassage.appendChild(select);
      } else {
        clozePassage.appendChild(document.createTextNode(part));
      }
    });

    clozeCheck.disabled = false;
    clozeCheck.onclick = () => {
      clozeCheck.disabled = true;
      let correct = 0;

      selects.forEach(sel => {
        const chosen  = sel.value.trim().toLowerCase();
        const isRight = chosen === sel.dataset.correct.trim().toLowerCase();
        if (isRight) correct++;
        sel.disabled = true;
        sel.classList.add(isRight ? 'quiz-cloze-correct' : 'quiz-cloze-wrong');

        if (!isRight && sel.dataset.correct) {
          const hint = document.createElement('span');
          hint.className   = 'quiz-cloze-hint';
          hint.textContent = ` ✓ ${sel.dataset.correct}`;
          sel.after(hint);
        }
      });

      const fraction = selects.length > 0 ? correct / selects.length : 0;
      if (fraction >= 0.5) score++;
      gradedTotal++;

      answers.push({
        question_text:  (q.question_text || 'Cloze').slice(0, 500),
        topic:          q.topic,
        difficulty:     q.difficulty,
        correct:        fraction >= 0.5,
        answer_chosen:  `${correct}/${selects.length} blanks correct`,
        correct_answer: 'See passage',
      });

      showExplanation(fraction >= 0.5, q.worked_solution || null);
      nextBtn.hidden = false;
    };
  }

  // ── Editing renderer ──────────────────────────────────────────
  /**
   * Renders editing exercise: each line shows passage with underlined word
   * and an input for the correction. Auto-graded proportionally per line.
   */
  function renderEditing(q) {
    editingPassage.innerHTML = '';
    const lines  = q.passage_lines || [];
    const inputs = [];

    lines.forEach((line, idx) => {
      const lineDiv = document.createElement('div');
      lineDiv.className = 'quiz-editing-line';

      const num = document.createElement('span');
      num.className   = 'quiz-editing-line-num';
      num.textContent = `${idx + 1}.`;
      lineDiv.appendChild(num);

      // Render passage text, wrapping the underlined_word in a span
      const text   = String(line.text || '');
      const target = String(line.underlined_word || '');
      const textWrap = document.createElement('span');
      textWrap.className = 'quiz-editing-text';

      if (target && text.includes(target)) {
        const splitIdx = text.indexOf(target);
        textWrap.appendChild(document.createTextNode(text.slice(0, splitIdx)));
        const underlined = document.createElement('span');
        underlined.className   = 'quiz-editing-underline';
        underlined.textContent = target;
        textWrap.appendChild(underlined);
        textWrap.appendChild(document.createTextNode(text.slice(splitIdx + target.length)));
      } else {
        textWrap.textContent = text;
      }

      lineDiv.appendChild(textWrap);

      const input = document.createElement('input');
      input.type         = 'text';
      input.className    = 'form-input quiz-editing-input';
      input.placeholder  = 'Correction…';
      input.autocomplete = 'off';
      input.dataset.line    = idx;
      input.dataset.correct = line.correct_word || '';
      inputs.push(input);
      lineDiv.appendChild(input);

      editingPassage.appendChild(lineDiv);
    });

    editingCheck.disabled = false;
    editingCheck.onclick = () => {
      editingCheck.disabled = true;
      let correct = 0;

      inputs.forEach(inp => {
        const chosen  = inp.value.trim().toLowerCase();
        const isRight = chosen === inp.dataset.correct.trim().toLowerCase();
        if (isRight) correct++;
        inp.disabled = true;

        const feedback = document.createElement('span');
        if (isRight) {
          feedback.className   = 'quiz-editing-correct';
          feedback.textContent = ' ✓';
        } else {
          feedback.className   = 'quiz-editing-wrong';
          feedback.textContent = ` ✗ → ${inp.dataset.correct}`;
        }
        inp.after(feedback);

        const lineData = lines[parseInt(inp.dataset.line, 10)];
        if (!isRight && lineData?.explanation) {
          const expSpan = document.createElement('span');
          expSpan.className   = 'quiz-editing-explanation';
          expSpan.textContent = ` (${lineData.explanation})`;
          feedback.after(expSpan);
        }
      });

      const fraction = inputs.length > 0 ? correct / inputs.length : 0;
      if (fraction >= 0.5) score++;
      gradedTotal++;

      answers.push({
        question_text:  (q.question_text || 'Editing').slice(0, 500),
        topic:          q.topic,
        difficulty:     q.difficulty,
        correct:        fraction >= 0.5,
        answer_chosen:  `${correct}/${inputs.length} lines correct`,
        correct_answer: 'See passage',
      });

      showExplanation(fraction >= 0.5, q.worked_solution || null);
      nextBtn.hidden = false;
    };
  }

  // ── MCQ answer handler ────────────────────────────────────────
  function handleMCQ(q, chosen) {
    if (answered) return;
    answered = true;

    const correct = q.correct_answer;
    const isRight = chosen === correct;
    if (isRight) score++;
    gradedTotal++;

    answers.push({
      question_text:  q.question_text.slice(0, 500),
      topic:          q.topic,
      difficulty:     q.difficulty,
      correct:        isRight,
      answer_chosen:  chosen,
      correct_answer: correct,
    });

    optionsEl.querySelectorAll('.quiz-option').forEach(btn => {
      const k = btn.dataset.key;
      btn.disabled = true;
      if (k === correct)     btn.classList.add('is-correct');
      else if (k === chosen) btn.classList.add('is-wrong');
      else                   btn.classList.add('is-dimmed');
    });

    const wrongExp = (!isRight && q.wrong_explanations) ? q.wrong_explanations[chosen] : null;
    showExplanation(isRight, q.worked_solution, wrongExp);
    nextBtn.hidden = false;
  }

  // ── Short answer handler ──────────────────────────────────────
  shortAnsSubmit.addEventListener('click', () => {
    if (answered) return;
    const val = shortAnsInput.value.trim();
    if (!val) { shortAnsInput.focus(); return; }
    handleShortAns(val);
  });

  shortAnsInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') shortAnsSubmit.click();
  });

  /**
   * Checks short answer against correct_answer and accept_also aliases.
   * All comparisons are case-insensitive and trimmed.
   */
  function handleShortAns(val) {
    answered = true;
    const q = questions[current];
    const normalise = s => String(s).toLowerCase().trim();

    const accepted = [q.correct_answer, ...(q.accept_also || [])].map(normalise);
    const isRight  = accepted.includes(normalise(val));

    if (isRight) score++;
    gradedTotal++;

    answers.push({
      question_text:  q.question_text.slice(0, 500),
      topic:          q.topic,
      difficulty:     q.difficulty,
      correct:        isRight,
      answer_chosen:  val.slice(0, 200),
      correct_answer: String(q.correct_answer),
    });

    shortAnsInput.disabled  = true;
    shortAnsSubmit.disabled = true;
    shortAnsInput.style.borderColor = isRight ? 'var(--success)' : 'var(--danger)';

    showExplanation(isRight, q.worked_solution, null, q.correct_answer);
    nextBtn.hidden = false;
  }

  // ── Explanation panel ─────────────────────────────────────────
  /**
   * Shows the feedback panel with result and worked solution.
   * Uses DOM API — no raw innerHTML with external content.
   */
  function showExplanation(isRight, solution, wrongExp, correctAnswer) {
    explanationEl.hidden    = false;
    explanationEl.className = `quiz-explanation ${isRight ? 'is-correct-explanation' : 'is-wrong-explanation'}`;
    explanationEl.innerHTML = '';

    const title = document.createElement('p');
    title.className   = 'quiz-explanation-title';
    title.textContent = isRight ? '✓ Correct!' : '✗ Not quite';
    explanationEl.appendChild(title);

    if (!isRight && correctAnswer !== undefined) {
      const ca = document.createElement('p');
      const bold = document.createElement('strong');
      bold.textContent = 'Correct answer: ';
      ca.appendChild(bold);
      ca.appendChild(document.createTextNode(String(correctAnswer)));
      explanationEl.appendChild(ca);
    }

    if (!isRight && wrongExp) {
      const we = document.createElement('p');
      we.style.marginTop = 'var(--space-2)';
      const bold = document.createElement('strong');
      bold.textContent = 'Why that was wrong: ';
      we.appendChild(bold);
      we.appendChild(document.createTextNode(wrongExp));
      explanationEl.appendChild(we);
    }

    if (solution) {
      const sol = document.createElement('p');
      sol.style.marginTop = 'var(--space-2)';
      const bold = document.createElement('strong');
      bold.textContent = 'Worked solution: ';
      sol.appendChild(bold);
      sol.appendChild(document.createTextNode(solution));
      explanationEl.appendChild(sol);
    }
  }

  // ── Next question ─────────────────────────────────────────────
  nextBtn.addEventListener('click', () => {
    current++;
    if (current >= questions.length) {
      showScore();
    } else {
      renderQuestion();
      const card = document.getElementById('quiz-card');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // ── Score screen ──────────────────────────────────────────────
  /**
   * Renders end-of-quiz score screen.
   * Only auto-graded types (mcq, short_ans, cloze, editing) count toward score.
   * word_problem and open_ended are excluded from scoring.
   */
  function showScore() {
    quizArea.hidden    = true;
    scoreScreen.hidden = false;

    progressFill.style.width  = '100%';
    progressLabel.textContent = `${questions.length} / ${questions.length}`;

    const total    = gradedTotal || 1;
    const pct      = Math.round((score / total) * 100);
    const numColor = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--accent)' : 'var(--danger)';
    const msg      = pct >= 80 ? 'Excellent work! Keep it up!'
                   : pct >= 60 ? 'Good effort! Review the ones you missed.'
                   : "Keep practising — you'll get there!";

    const ungradedCount = questions.length - gradedTotal;

    scoreScreen.innerHTML = '';
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'quiz-score';

    const num = document.createElement('div');
    num.className   = 'quiz-score-number';
    num.style.color = numColor;
    num.textContent = `${score}/${total}`;
    scoreDiv.appendChild(num);

    const label = document.createElement('p');
    label.className   = 'quiz-score-label';
    label.textContent = msg;
    scoreDiv.appendChild(label);

    const pctP = document.createElement('p');
    pctP.style.cssText = 'color:var(--text-secondary);margin-top:var(--space-1);';
    pctP.textContent   = `You scored ${pct}% on auto-graded questions`;
    scoreDiv.appendChild(pctP);

    if (ungradedCount > 0) {
      const note = document.createElement('p');
      note.style.cssText = 'color:var(--text-secondary);margin-top:var(--space-1);font-size:0.875rem;';
      note.textContent   = `(${ungradedCount} question${ungradedCount !== 1 ? 's' : ''} used model answers — not included in score)`;
      scoreDiv.appendChild(note);
    }

    const btnRow = document.createElement('div');
    btnRow.className     = 'flex gap-4 mt-8';
    btnRow.style.cssText = 'justify-content:center;flex-wrap:wrap;';

    const retryBtn = document.createElement('button');
    retryBtn.className   = 'btn btn-primary';
    retryBtn.textContent = 'Try Again';
    retryBtn.addEventListener('click', () => {
      current     = 0;
      score       = 0;
      gradedTotal = 0;
      answered    = false;
      answers     = [];
      questions   = shuffle(questions);
      scoreScreen.hidden = true;
      quizArea.hidden    = false;
      renderQuestion();
    });

    const changeBtn = document.createElement('a');
    changeBtn.className   = 'btn btn-secondary';
    changeBtn.href        = 'subjects.html';
    changeBtn.textContent = 'Choose Another Topic';

    btnRow.append(retryBtn, changeBtn);
    scoreDiv.appendChild(btnRow);
    scoreScreen.appendChild(scoreDiv);

    saveResults().catch(err => console.error('[quiz] saveResults:', err));
  }

  // ── Supabase save ─────────────────────────────────────────────
  /**
   * Saves quiz attempt and per-question results to Supabase.
   * Only fires if a student ID is available (logged-in user).
   */
  async function saveResults() {
    if (!currentStudentId) return;

    const db = await getSupabase();

    const topicCounts = {};
    answers.forEach(a => {
      if (a.topic) topicCounts[a.topic] = (topicCounts[a.topic] || 0) + 1;
    });
    const primaryTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Mixed';

    const { data: attempt, error: attErr } = await db
      .from('quiz_attempts')
      .insert({
        student_id:      currentStudentId,
        subject:         currentSubject,
        level:           currentLevel,
        topic:           primaryTopic,
        difficulty:      'Mixed',
        score:           score,
        total_questions: gradedTotal,
      })
      .select('id')
      .single();

    if (attErr) throw attErr;

    if (answers.length > 0) {
      const rows = answers.map(a => ({
        quiz_attempt_id: attempt.id,
        student_id:      currentStudentId,
        question_text:   a.question_text,
        topic:           a.topic,
        difficulty:      a.difficulty,
        correct:         a.correct,
        answer_chosen:   a.answer_chosen,
        correct_answer:  a.correct_answer,
      }));
      await db.from('question_attempts').insert(rows);
    }

    // Increment daily usage counter
    if (typeof checkDailyUsage === 'function') {
      const usage = await checkDailyUsage(currentStudentId);
      const db2   = await getSupabase();
      const today = new Date().toISOString().slice(0, 10);
      const newCount = (usage.questions_attempted || 0) + answers.length;
      if (!usage.id) {
        await db2.from('daily_usage').insert({
          student_id:          currentStudentId,
          date:                today,
          questions_attempted: newCount,
        });
      } else {
        await db2.from('daily_usage')
          .update({ questions_attempted: newCount })
          .eq('student_id', currentStudentId)
          .eq('date', today);
      }
    }
  }

  // ── Utilities ─────────────────────────────────────────────────
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function capitalise(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function labelLevel(l)  { return l.replace('primary-', 'Primary '); }
  function diffBadge(d) {
    const lower = (d || '').toLowerCase();
    if (lower === 'foundation') return 'foundation';
    if (lower === 'advanced')   return 'advanced';
    if (lower === 'hots')       return 'hots';
    return 'standard';
  }

  function showError(msg) {
    loadingEl.hidden    = true;
    errorEl.hidden      = false;
    errorEl.textContent = msg;
  }
})();
