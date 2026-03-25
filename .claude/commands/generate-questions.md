# /generate-questions — Create Question Bank Content

When the user runs `/generate-questions <subject> <level> <topic> [type] [count]`,
execute this workflow:

## 1. Verify syllabus alignment
- Check that the topic exists in MOE syllabus for the target level
- Reference the syllabus PDFs in project knowledge
- Read the Master Question Template: C:\SLabDrive\01 - Platform Intelligence\Master_Question_Template.md

## 2. Determine question type

If type not specified, use the default for the subject:
- Mathematics: mix of mcq (60%), short_ans (20%), word_problem (20%)
- Science: mix of mcq (70%), open_ended (30%)
- English: mix of mcq (40%), cloze (30%), editing (30%)

Supported types:
- `mcq` — 4 options A/B/C/D, wrong_explanations for 3 wrong options
- `short_ans` — numerical/text answer, accept_also for equivalents
- `word_problem` — multi-part (a)(b)(c), show working, 3-5 marks
- `open_ended` — written explanation, keywords array, model_answer
- `cloze` — passage with numbered blanks, 4 options per blank
- `editing` — passage with underlined words, has_error boolean

## 3. Generate questions (default: 5)

Every question MUST have these universal base fields:
```json
{
  "id": "{level}-{subject}-{topic}-{number}",
  "subject": "Mathematics | Science | English",
  "level": "Primary 4",
  "topic": "Fractions",
  "sub_topic": "Adding unlike fractions",
  "difficulty": "Foundation | Standard | Advanced | HOTS",
  "type": "mcq | short_ans | word_problem | open_ended | cloze | editing",
  "marks": 1-5,
  "question_text": "...",
  "correct_answer": "...",
  "worked_solution": "Step 1: ... Step 2: ...",
  "examiner_note": "..." or null
}
```

Plus type-specific fields per the Master Question Template.

## 4. Quality checks

- [ ] Singapore context (names: Ahmad, Mei Ling, Siti, Ravi; food: Milo, pineapple tarts)
- [ ] All MCQ options plausible — no joke answers
- [ ] Science/English MCQ options are FULL SENTENCES
- [ ] Wrong explanations name the SPECIFIC misconception
- [ ] Worked solutions have numbered steps (Step 1, Step 2...)
- [ ] Fractions as plain text with / (e.g. "7/12")
- [ ] Difficulty spread: ~20% Foundation, ~50% Standard, ~20% Advanced, ~10% HOTS
- [ ] Correct answer verified for accuracy
- [ ] No spelling errors

## 5. Save

Save to `data/questions/{level}-{subject}-{topic}.json`
If file exists, append to existing array (no duplicates by id).
If new file, create with the generated array.

Commit: `feat: add {count} {type} questions for {level} {subject} {topic}`
