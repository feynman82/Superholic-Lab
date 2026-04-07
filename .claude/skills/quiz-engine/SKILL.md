---
name: quiz-engine
description: "Frontend rendering patterns for all 6 question types in the quiz engine. Read this skill before modifying quiz.js, quiz.html, or quiz CSS."
origin: Superholic Lab
---

# Quiz Engine Skill

Defines exactly how each question type renders in the browser.
Read this before touching quiz.js, quiz.html, or quiz-related CSS.

## When to Use

- Modifying or extending `js/quiz.js`
- Changing `pages/quiz.html` structure
- Adding CSS for quiz components in `css/style.css`
- Fixing quiz display bugs
- Adding a new question type

## Architecture

```
URL params (subject, level, topic)
        |
        v
quiz.js: init() -> resolveFile() -> fetch JSON
        |
        v
renderQuestion() -> switch on q.type
        |
   +----+----+----+----+----+----+
   |    |    |    |    |    |    |
  mcq short word open cloze edit
   |    ans  prob ended       ing
   v    v    v    v    v      v
render render render render render render
MCQ()  Short Word  Open  Cloze Edit
       Ans() Prob() End() ()    ing()
        |
        v
handleAnswer() -> showExplanation() -> nextBtn
        |
        v
showScore() -> saveResults() to Supabase
```

## DOM Structure (quiz.html)

```html
<div id="quiz-area" hidden>
  <!-- Progress bar -->
  <div class="quiz-progress">...</div>

  <div class="card no-hover" id="quiz-card">
    <div class="card-body">
      <!-- Meta badges (topic + difficulty) -->
      <div id="quiz-meta"></div>
      <!-- Question text -->
      <p id="quiz-question-text"></p>

      <!-- TYPE: MCQ options -->
      <div id="quiz-options" class="quiz-options"></div>

      <!-- TYPE: Short answer -->
      <div id="quiz-short-ans-area" hidden>
        <input type="text" id="quiz-short-ans-input" />
        <button id="quiz-short-ans-submit">Check Answer</button>
      </div>

      <!-- TYPE: Word problem -->
      <div id="quiz-word-problem-area" hidden>
        <div id="quiz-wp-parts"></div>
        <button id="quiz-wp-reveal">Show Model Answer</button>
        <div id="quiz-wp-model" hidden></div>
      </div>

      <!-- TYPE: Open-ended -->
      <div id="quiz-open-ended-area" hidden>
        <textarea id="quiz-oe-input"></textarea>
        <button id="quiz-oe-reveal">See Model Answer</button>
        <div id="quiz-oe-model" hidden></div>
      </div>

      <!-- TYPE: Cloze -->
      <div id="quiz-cloze-area" hidden>
        <div id="quiz-cloze-passage"></div>
        <button id="quiz-cloze-check">Check Answers</button>
      </div>

      <!-- TYPE: Editing -->
      <div id="quiz-editing-area" hidden>
        <div id="quiz-editing-passage"></div>
        <button id="quiz-editing-check">Check Answers</button>
      </div>

      <!-- Shared: explanation + next -->
      <div id="quiz-explanation" hidden></div>
      <button id="quiz-next" hidden>Next Question →</button>
    </div>
  </div>
</div>
```

CRITICAL: There is NO true/false area. The `true_false` type is retired.

## Rendering Patterns by Type

### MCQ Rendering
```js
function buildMCQOptions(q) {
  // options[0]→A, options[1]→B, options[2]→C, options[3]→D
  // Badge letter always from index, NEVER from option text
  // Option text = the word/phrase/sentence from JSON options array (no embedded "because...")
  // Clicking an option auto-submits via selectMcq() → checkAnswer()
}
```

Answer states (applied via inline style on `.mcq-opt` divs):
- Correct: `border-color: var(--brand-mint); background: rgba(5,150,105,0.1)`
- Wrong (selected): `border-color: var(--brand-error); background: rgba(220,38,38,0.1)`
- Dimmed (others): `opacity: 0.45; pointer-events: none`

**English Grammar fill-in-the-blank**: options are WORDS or SHORT PHRASES (e.g. "cook", "cooks"). Render identically to any other MCQ — the option text is simply shorter.
**Comprehension MCQ**: options are concise answer phrases without explanations.

### Short Answer Rendering
```js
function renderShortAns(q) {
  // Show text input + Check Answer button
  // On check: compare input.trim() to q.correct_answer
  // Also check q.accept_also array (case-insensitive)
  // Green border + "Correct!" or red + "Not quite. Answer: X"
  // Show worked_solution below
}
```

### Word Problem Rendering
```js
function buildWordProblemUI(q) {
  // Show q.question_text (the scenario setup — no question in it, just context)
  // For each part in q.parts:
  //   Card with: label "(a)", marks badge, part.question_text
  //   Textarea id="wp-(a)" for student working
  // "Reveal Model Answer" button → checkAnswer() → sets isAnswered = true
  // On reveal: show part.model_answer + part.marking_scheme per part
  // NOT auto-graded — does not increment state.score
}
```

### Open-Ended Rendering
```js
// Uses buildTextAreaUI() + "Reveal Model Answer" button
// checkAnswer() sets feedback.isModel = true
// Feedback panel shows q.worked_solution or q.model_answer
// NOT auto-graded — does not affect score
```

### Cloze Rendering
```js
function buildClozeUI(q) {
  // 1. Word Bank box: collect all unique words from ALL blanks.options arrays
  //    Sort alphabetically, display as numbered badge list
  // 2. Instruction: "Read the passage carefully. Choose the best word..."
  // 3. Parse q.passage: replace [1], [2], ... with inline <select> dropdowns
  //    Each select id="cloze-blank-{num}", options from blank.options array
  // 4. "Check Answers" button → checkAnswer()
  // On check: compare each select.value to blank.correct_answer (string comparison)
  //    Show per-blank result inline (mint=correct, red=wrong + correct_answer shown)
  //    Show explanation panel for wrong blanks
  // Score: ALL correct → +1 point; partial → +0
}
```

### Editing Rendering
```js
function buildEditingUI(q) {
  // Show q.question_text as instructions ("The passage below contains 5 errors...")
  // For each passage_line in q.passage_lines:
  //   Line number | sentence text (underlined_word shown with <u> tag) | input[type=text]
  //   Input id="edit-line-{line_number}", width 90px
  // "Check Answers" button → checkAnswer()
  // On check: compare input.value to line.correct_word (case-insensitive)
  //    Inline feedback per line: mint=correct, red=wrong + correct_word shown
  //    Explanation panel for wrong lines (line.explanation)
  // Score: ALL correct → +1 point; partial → +0
  // NOTE: q.passage_lines must have distinct sentence texts — no duplicate sentences
}
```

## Scoring Rules

| Type | Auto-graded? | Score contribution |
|------|-------------|-------------------|
| mcq | Yes | 1 point per correct |
| short_ans | Yes | 1 point per correct |
| word_problem | No | Shows model answer only |
| open_ended | No | Shows model answer only |
| cloze | Yes | Fraction: blanks_correct / blanks_total |
| editing | Yes | Fraction: lines_correct / lines_total |

## CSS Classes (in style.css)

```css
/* All quiz components use these existing patterns */
.quiz-progress          /* progress bar container */
.quiz-progress-fill     /* colored fill inside bar */
.quiz-option            /* MCQ option button */
.quiz-option-key        /* circle badge A/B/C/D */
.quiz-option.is-correct /* green highlight */
.quiz-option.is-wrong   /* red highlight */
.quiz-option.is-dimmed  /* faded non-selected */
.quiz-explanation       /* worked solution panel */
.quiz-question-text     /* question text paragraph */

/* New components for additional types */
.quiz-short-ans-input   /* large input for typed answers */
.quiz-wp-part           /* card for each word problem part */
.quiz-wp-part-label     /* bold (a), (b) label */
.quiz-wp-marks-badge    /* small "2 marks" pill */
.quiz-oe-keywords       /* highlighted keyword in model answer */
.quiz-cloze-passage     /* passage text with larger line-height */
.quiz-cloze-blank       /* inline select/dropdown */
.quiz-editing-line      /* one passage line */
.quiz-editing-underline /* the underlined word */
.quiz-editing-input     /* correction input field */
```

All colors via CSS variables. Mobile-first. No inline styles except dynamic JS values.

## renderQuestion() Reset Pattern

Every call to renderQuestion() MUST:
1. Set `answered = false`
2. Hide ALL 6 type areas
3. Clear all inputs
4. Hide explanation and next button
5. Show only the correct type area for current question
6. Update progress bar and meta badges

## Error States

- JSON load failure → show error message, never blank screen
- Empty question bank → "No questions found for this topic"
- Invalid question type → skip to next question, log error
- Network offline → show cached questions if available, else error
