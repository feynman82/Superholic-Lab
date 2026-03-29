---
name: question-factory
description: "Complete workflow for generating MOE-aligned question content across all 6 PSLE exam types. Read this skill before creating any question content."
origin: Superholic Lab
---

# Question Factory Skill

The authoritative workflow for generating question content for Superholic Lab.
Every question produced must pass through this skill's pipeline.

## When to Use

- User asks to generate questions for any subject/level/topic
- The `/generate-questions` command is invoked
- Any content is being added to `data/questions/` files
- AI tutor needs to generate practice questions on the fly

## Pre-flight Checklist

Before generating ANY question:
1. Confirm: subject, level, topic, sub_topic, difficulty
2. Read the Master Question Template: `C:\SLabDrive\01 - Platform Intelligence\Master_Question_Template.md`
3. Verify the topic exists in MOE syllabus (check project knowledge PDFs)
4. Determine the correct question type(s) for this subject

## Type Selection Matrix

| Subject | Default Mix | Types Available |
|---------|------------|------------------|
| Mathematics | 60% mcq, 20% short_ans, 20% word_problem | mcq, short_ans, word_problem |
| Science | 70% mcq, 30% open_ended | mcq, open_ended |
| English | 40% mcq, 30% cloze, 30% editing | mcq, cloze, editing, comprehension |

## Universal Base Schema (ALL types)

Every question object MUST have these fields — no exceptions:

```json
{
  "id": "p4-math-frac-001",
  "subject": "Mathematics",
  "level": "Primary 4",
  "topic": "Fractions",
  "sub_topic": "Adding unlike fractions",
  "difficulty": "Standard",
  "type": "mcq",
  "marks": 2,
  "question_text": "Ahmad ate 1/3 of a pizza...",
  "correct_answer": "C",
  "worked_solution": "Step 1: Find LCD...\nStep 2: Convert...",
  "examiner_note": "Always show working for fraction addition."
}
```

### Field Rules
- **id**: format `{level_short}-{subject_short}-{topic_short}-{number}` e.g. `p4-math-frac-001`
- **subject**: exactly `Mathematics` | `Science` | `English`
- **level**: exactly `Primary 2` | `Primary 3` | `Primary 4` | `Primary 5` | `Primary 6`
- **difficulty**: exactly `Foundation` | `Standard` | `Advanced` | `HOTS` (capital H)
- **type**: exactly `mcq` | `short_ans` | `word_problem` | `open_ended` | `cloze` | `editing`
- **marks**: integer 1-5, based on MOE mark allocation for the exam paper
- **worked_solution**: MUST have numbered steps (Step 1, Step 2, etc.)
- **examiner_note**: string or null. Required for Advanced/HOTS. Optional for Foundation/Standard.

## Type-Specific Schemas

### MCQ
```json
{
  "options": ["text A", "text B", "text C", "text D"],
  "correct_answer": "A" | "B" | "C" | "D",
  "wrong_explanations": {
    "B": "specific misconception for option B",
    "C": "specific misconception for option C",
    "D": "specific misconception for option D"
  }
}
```
CRITICAL RULES:
- Options array has exactly 4 strings
- correct_answer is the LETTER (A/B/C/D), NOT the text
- wrong_explanations has exactly 3 keys (the 3 wrong letters)
- Science/English options must be FULL SENTENCES
- Maths options can be short numerical values
- Each wrong explanation must name the SPECIFIC misconception

### short_ans
```json
{
  "correct_answer": "282",
  "accept_also": ["282.0"]
}
```
- accept_also: array of alternative correct forms (empty array if none)
- For fractions: include both forms, e.g. correct_answer: "2/3", accept_also: ["0.667", "0.67"]

### word_problem
```json
{
  "parts": [
    {
      "label": "(a)",
      "question": "How many pineapple tarts did she give away?",
      "marks": 2,
      "correct_answer": "35",
      "worked_solution": "1/3 of 60 = 20, 1/4 of 60 = 15, total = 35"
    },
    {
      "label": "(b)",
      "question": "How many does Auntie Mei have left?",
      "marks": 2,
      "correct_answer": "25",
      "worked_solution": "60 - 35 = 25"
    }
  ]
}
```
- Parts array with at least 2 sub-questions
- Each part has its own marks, correct_answer, worked_solution
- Total marks = sum of part marks
- NOT auto-graded in quiz engine (show model answer)

### open_ended (Science)
```json
{
  "keywords": ["heat", "flows", "hotter", "cooler", "surrounding air"],
  "model_answer": "The Milo was hotter than the surrounding air. Heat flows from a hotter object to a cooler object."
}
```
- keywords: array of strings the student MUST use for full marks
- model_answer: the ideal full-marks answer
- NOT auto-graded (show model answer with keywords highlighted)

### cloze (English)
```json
{
  "passage": "Last Saturday, Mei Ling [1] to the library with her mother. She [2] looking for a book.",
  "blanks": [
    {
      "number": 1,
      "options": ["go", "goes", "went", "going"],
      "correct_answer": "C",
      "explanation": "'Last Saturday' = past tense. Past tense of 'go' is 'went'."
    },
    {
      "number": 2,
      "options": ["is", "was", "were", "are"],
      "correct_answer": "B",
      "explanation": "Past continuous: 'She was looking' (singular + past)."
    }
  ]
}
```
- Passage uses [1], [2], [3] etc for blanks
- Each blank has 4 options, correct_answer as letter, explanation
- Total marks = number of blanks

### editing (English)
```json
{
  "passage_lines": [
    {
      "line_number": 1,
      "text": "Ahmad and his friends was playing football in the",
      "underlined_word": "was",
      "has_error": true,
      "correct_word": "were",
      "explanation": "Plural subject 'Ahmad and his friends' needs 'were'."
    },
    {
      "line_number": 2,
      "text": "school field yesterday. They was having so",
      "underlined_word": "having",
      "has_error": false,
      "correct_word": "having",
      "explanation": "'Having' is correct — past continuous form."
    }
  ]
}
```
- Mix of errors and correct words (not all errors)
- correct_word = same word if has_error is false
- Total marks = number of lines with errors

## Singapore Context Library

ALWAYS use Singapore-specific context in questions:

**Student names** (rotate through): Ahmad, Mei Ling, Siti, Ravi, Wei Ming, Priya, Hafiz, Xiao Ling, Deepa, Jun Wei, Nurul, Kavitha, Zhi Hao, Aisha, Raj

**Food/drinks**: Milo, pineapple tarts, chicken rice, laksa, nasi lemak, satay, roti prata, kaya toast, kueh, curry puff, fishball noodles, ice kachang

**Places**: HDB flat, void deck, school canteen/tuck shop, hawker centre, MRT station, Sentosa, East Coast Park, Botanic Gardens, National Library, Zoo

**Events**: Chinese New Year, Hari Raya, Deepavali, National Day, school sports day, recess, assembly, CCA (co-curricular activities)

**Currency**: Always SGD, use $ symbol. Realistic prices.

## Difficulty Calibration

| Level | What it means | Student profile |
|-------|--------------|------------------|
| Foundation | Straightforward application | Bottom 30%, needs practice |
| Standard | Typical SA/CA exam question | Average student, 50th percentile |
| Advanced | Multi-step, top 20% level | Strong student, Paper 2 style |
| HOTS | Non-routine, creative reasoning | Top 10%, PSLE challenging section |

**Target mix per file (20 questions minimum)**:
- Foundation: 4 questions (20%)
- Standard: 10 questions (50%)
- Advanced: 4 questions (20%)
- HOTS: 2 questions (10%)

## Maths-Specific Rules

- All arithmetic must be independently verified before output
- Correct answers must be clean whole numbers or simple fractions
- MCQ wrong options must represent real student mistakes, not random numbers
- Show ALL working in worked_solution — examiners award method marks
- Fractions as plain text: "7/12" not rendered fraction

## Science-Specific Rules

- MCQ options must be FULL SENTENCES (not fragments)
- Every wrong option must explain the specific scientific misconception
- Keywords from MOE marking scheme must appear in model answers
- Use the format: [Observation] because [Scientific reason]

## English-Specific Rules

- Use Singapore Standard English (not British/American)
- Grammar cloze passages must be age-appropriate narratives
- Editing passages should test: subject-verb agreement, tenses, spelling, articles
- Mix of errors and correct words in editing (don't make every line an error)

## File Naming & Storage

Save to: `data/questions/{level}-{subject}-{topic}.json`

Examples:
- `p4-mathematics-fractions.json`
- `p4-science-heat.json`
- `p4-english-grammar.json`
- `p2-mathematics-whole-numbers.json`

Each file = JSON array of question objects. Minimum 20 per file.

## Post-Generation Verification

After generating, verify EVERY question:
- [ ] JSON is valid (parse it)
- [ ] All base fields present
- [ ] Type-specific fields present
- [ ] correct_answer matches an actual option
- [ ] worked_solution has numbered steps
- [ ] wrong_explanations reference the specific misconception
- [ ] No spelling errors
- [ ] Singapore context used
- [ ] Difficulty label matches actual complexity
- [ ] Maths answers are arithmetically correct
