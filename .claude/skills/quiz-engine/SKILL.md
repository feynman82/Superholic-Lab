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
function renderMCQ(q) {
  q.options.forEach((opt, idx) => {
    const key = String.fromCharCode(65 + idx); // 0→A, 1→B, 2→C, 3→D
    // Create button with:
    //   <span class="quiz-option-key">A</span>  ← circle badge
    //   <span>option text</span>                ← full text, never truncated
    // Badge letter is ALWAYS from index, NEVER from option text
  });
}
```

Answer states:
- `.is-correct` — green border + checkmark (correct option)
- `.is-wrong` — red border + X (wrong chosen option)
- `.is-dimmed` — faded out (other options)

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
function renderWordProblem(q) {
  // For each q.parts:
  //   Show label "(a)", question text, marks badge "2 marks"
  //   Show textarea for student working
  // "Show Model Answer" reveals all part solutions
  // NOT auto-graded — does not affect score
}
```

### Open-Ended Rendering
```js
function renderOpenEnded(q) {
  // Show textarea for student's written answer
  // "See Model Answer" reveals q.model_answer
  // Highlight words from q.keywords array in accent color
  // NOT auto-graded — does not affect score
}
```

### Cloze Rendering
```js
function renderCloze(q) {
  // Parse q.passage — replace [1], [2] with inline selects
  // Each select built from blank.options (4 choices)
  // "Check Answers" compares each selection to blank.correct_answer
  // Show per-blank result: green (correct) or red + explanation
  // Score: count correct blanks / total blanks
}
```

### Editing Rendering
```js
function renderEditing(q) {
  // For each q.passage_lines:
  //   Show text with underlined_word visually underlined
  //   Show text input next to underlined word
  //   Student types correction or ticks "correct"
  // "Check" compares input to correct_word
  // Score: count correct responses / total lines
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
