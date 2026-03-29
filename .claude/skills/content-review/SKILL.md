---
name: content-review
description: "Quality assurance workflow for reviewing question content against MOE syllabus and Master Question Template standards."
origin: Superholic Lab
---

# Content Review Skill

Systematic quality check for question content.
Run this before committing any new questions to the repo.

## When to Use

- After generating questions with `/generate-questions`
- Before committing new content to `data/questions/`
- When reviewing existing question bank for quality
- When a user reports a question error
- Periodic quality audits

## Review Pipeline

```
┌──────────────────────────────────────────┐
│  1. SCHEMA VALIDATION                    │
│     Parse JSON, check all required fields │
├──────────────────────────────────────────┤
│  2. SYLLABUS ALIGNMENT                   │
│     Verify topic exists in MOE syllabus   │
│     for the specified level               │
├──────────────────────────────────────────┤
│  3. ANSWER VERIFICATION                  │
│     Recalculate maths answers             │
│     Verify science facts                  │
│     Check grammar correctness             │
├──────────────────────────────────────────┤
│  4. QUALITY STANDARDS                    │
│     Wrong explanations are specific       │
│     Worked solutions have steps           │
│     Singapore context present             │
├──────────────────────────────────────────┤
│  5. DIFFICULTY CALIBRATION               │
│     Label matches actual complexity       │
│     Distribution is balanced              │
├──────────────────────────────────────────┤
│  6. REPORT                               │
│     List issues by severity               │
│     Suggest fixes                         │
└──────────────────────────────────────────┘
```

## Step 1: Schema Validation

For each question object, verify:

### Universal fields (ALL types)
- [ ] `id` — string, matches format `{level}-{subject}-{topic}-{number}`
- [ ] `subject` — exactly `Mathematics` | `Science` | `English`
- [ ] `level` — starts with `Primary` and has a number
- [ ] `topic` — non-empty string
- [ ] `sub_topic` — non-empty string
- [ ] `difficulty` — exactly `Foundation` | `Standard` | `Advanced` | `HOTS`
- [ ] `type` — one of: `mcq`, `short_ans`, `word_problem`, `open_ended`, `cloze`, `editing`
- [ ] `marks` — integer 1-5
- [ ] `question_text` — non-empty string
- [ ] `correct_answer` — non-empty string
- [ ] `worked_solution` — non-empty string containing "Step"
- [ ] `examiner_note` — string or null

### MCQ-specific
- [ ] `options` — array of exactly 4 strings
- [ ] `correct_answer` — one of A, B, C, D
- [ ] `wrong_explanations` — object with exactly 3 keys (the wrong letters)
- [ ] No `exam_type` field (retired)

### short_ans-specific
- [ ] `accept_also` — array (can be empty)
- [ ] Type is NOT `fill_blank` (retired name)

### word_problem-specific
- [ ] `parts` — non-empty array
- [ ] Each part has: label, question, marks, correct_answer, worked_solution

### open_ended-specific
- [ ] `keywords` — non-empty array of strings
- [ ] `model_answer` — non-empty string

### cloze-specific
- [ ] `passage` — string containing [1], [2], etc.
- [ ] `blanks` — array matching the number of placeholders
- [ ] Each blank has: number, options (4), correct_answer, explanation

### editing-specific
- [ ] `passage_lines` — non-empty array
- [ ] Each line has: line_number, text, underlined_word, has_error, correct_word, explanation
- [ ] Mix of errors and non-errors

## Step 2: Syllabus Alignment

Check the MOE syllabus PDFs in project knowledge:
- Mathematics: 2021 Primary Mathematics Syllabus P1-P6
- Science: Primary Science Syllabus 2023
- English: 2020 English Language Primary

Verify:
- [ ] Topic exists in syllabus for the stated level
- [ ] Sub-topic is a real syllabus sub-topic (not invented)
- [ ] Concepts don't exceed the level (e.g. no algebra in P2)
- [ ] Vocabulary matches MOE terminology

## Step 3: Answer Verification

### Mathematics
- Recalculate every numerical answer independently
- Verify fractions are simplified correctly
- Check that wrong MCQ options are mathematically plausible
- Ensure no division by zero or undefined operations

### Science
- Verify scientific facts are accurate
- Check keywords match MOE marking scheme expectations
- Ensure cause-and-effect chains are correct

### English
- Verify grammar rules cited are correct
- Check spelling (Singapore English standard)
- Ensure cloze passages are internally consistent tense-wise
- Verify editing passages have the stated errors

## Step 4: Quality Standards

- [ ] Singapore names used (not Western names)
- [ ] Singapore context (HDB, MRT, hawker centre, etc.)
- [ ] MCQ wrong explanations name specific misconceptions (not just "this is wrong")
- [ ] Worked solutions have numbered steps (Step 1, Step 2...)
- [ ] Science/English MCQ options are full sentences
- [ ] Maths MCQ options represent common student mistakes
- [ ] Fractions written as plain text with / (not rendered)
- [ ] No spelling or grammatical errors in any field
- [ ] Examiner note present for Advanced/HOTS questions

## Step 5: Difficulty Calibration

- [ ] Foundation questions are single-step, straightforward
- [ ] Standard questions match typical SA/CA difficulty
- [ ] Advanced questions require 2-3 steps or transfers
- [ ] HOTS questions require creative/non-routine thinking
- [ ] File has correct distribution: ~20% F, ~50% S, ~20% A, ~10% H

## Step 6: Report Format

```
## Content Review Report
File: data/questions/p4-mathematics-fractions.json
Total questions: 22

### Issues Found

[CRITICAL] Q p4-math-frac-005
  Wrong answer: correct_answer is "C" but option C (7/12) is not
  the correct sum of 1/3 + 1/4. Recalculated: 7/12 IS correct.
  → FALSE ALARM: answer is correct.

[HIGH] Q p4-math-frac-012
  Missing field: examiner_note is missing (difficulty is Advanced)
  → Add examiner note about method marks

[MEDIUM] Q p4-math-frac-018
  Singapore context missing: uses "John" instead of a Singapore name
  → Replace with "Wei Ming" or "Ahmad"

[LOW] Q p4-math-frac-003
  Worked solution could be clearer: Step 2 jumps to answer
  → Add intermediate step showing conversion

### Summary
Critical: 0 | High: 1 | Medium: 1 | Low: 1
Difficulty distribution: 4F / 11S / 5A / 2H ✓
Overall: PASS with minor fixes needed
```

## Batch Review Command

To review an entire file:
1. Read the JSON file
2. Run Steps 1-5 on every question
3. Generate the Step 6 report
4. Fix Critical and High issues before committing
5. Fix Medium issues when possible
6. Log Low issues for future improvement
