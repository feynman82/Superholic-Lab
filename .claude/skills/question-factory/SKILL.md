---
name: question-factory
description: "Complete workflow for generating MOE-aligned question content across all 6 PSLE exam types. Includes deduplication against existing question bank. Read this skill before creating any question content."
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

## CRITICAL: Deduplication Workflow

Before generating ANY new questions:

### Step 0: Read Existing Content
1. Check if the target file exists: `data/questions/{level}-{subject}-{topic}.json`
2. If it exists, READ THE ENTIRE FILE first
3. Extract all existing question IDs into a set
4. Extract all existing sub_topics to understand what's already covered
5. Check `data/questions/MANIFEST.md` for the broader inventory

### Step 0b: Check Aggregate Files
Also check if questions exist in the aggregate file:
- `data/questions/{level}-{subject}.json`
These may contain questions not yet split into topic-specific files.
Extract IDs from aggregates too.

### Step 0c: ID Conflict Prevention
- New IDs must NOT match any existing ID in the same level+subject
- Use the format: `{level}-{subject}-{topic}-{number}`
  e.g., `p4-math-frac-006` (if 001-005 exist)
- Always start numbering AFTER the highest existing number
- For aggregate files with old ID formats (e.g., `p4m-eq01`),
  do NOT reuse those patterns — use the new format for new questions

### Step 0d: Content Overlap Prevention
- Read the question_text of existing questions
- Do NOT generate questions that test the exact same concept
  with the same numbers/scenario
- DO generate questions testing the same sub_topic with
  DIFFERENT scenarios, numbers, and difficulty levels
- Example: if a fraction addition question uses 1/3 + 1/4,
  generate one using 2/5 + 1/3 instead

## Pre-flight Checklist

Before generating ANY question:
1. ☐ Read existing questions in target file (Step 0)
2. ☐ Read existing questions in aggregate file (Step 0b)
3. ☐ Confirm: subject, level, topic, sub_topic, difficulty
4. ☐ Read the Master Question Template
5. ☐ Verify topic exists in MOE syllabus (project knowledge PDFs)
6. ☐ Determine correct question type(s) for this subject
7. ☐ Check MANIFEST.md for gaps that need filling

## Type Selection Matrix

| Subject | Default Mix | Types Available |
|---------|------------|------------------|
| Mathematics | 60% mcq, 20% short_ans, 20% word_problem | mcq, short_ans, word_problem |
| Science | 70% mcq, 30% open_ended | mcq, open_ended |
| English | 40% mcq, 30% cloze, 30% editing | mcq, cloze, editing, comprehension |

## Universal Base Schema (ALL types)

Every question object MUST have these fields:

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
- **id**: `{level_short}-{subject_short}-{topic_short}-{number}` e.g. `p4-math-frac-006`
- **subject**: exactly `Mathematics` | `Science` | `English`
- **level**: exactly `Primary 2` | `Primary 3` | `Primary 4` | etc.
- **difficulty**: exactly `Foundation` | `Standard` | `Advanced` | `HOTS`
- **type**: exactly `mcq` | `short_ans` | `word_problem` | `open_ended` | `cloze` | `editing`
- **marks**: integer 1-5
- **worked_solution**: MUST have numbered steps
- **examiner_note**: Required for Advanced/HOTS. Optional for Foundation/Standard.

## Type-Specific Schemas

### MCQ
```json
{
  "options": ["text A", "text B", "text C", "text D"],
  "correct_answer": "A" | "B" | "C" | "D",
  "wrong_explanations": { "B": "...", "C": "...", "D": "..." }
}
```
Badge = array index (0→A). Science/English options = FULL SENTENCES.

### short_ans
```json
{ "correct_answer": "282", "accept_also": ["282.0"] }
```

### word_problem
```json
{
  "parts": [
    { "label": "(a)", "question": "...", "marks": 2, "correct_answer": "35", "worked_solution": "..." }
  ]
}
```

### open_ended (Science)
```json
{ "keywords": ["heat", "flows", "hotter"], "model_answer": "..." }
```

### cloze (English)
```json
{
  "passage": "...text with [1] and [2]...",
  "blanks": [ { "number": 1, "options": ["..."], "correct_answer": "C", "explanation": "..." } ]
}
```

### editing (English)
```json
{
  "passage_lines": [
    { "line_number": 1, "text": "...", "underlined_word": "was", "has_error": true, "correct_word": "were", "explanation": "..." }
  ]
}
```

## Singapore Context Library

**Names**: Ahmad, Mei Ling, Siti, Ravi, Wei Ming, Priya, Hafiz, Xiao Ling, Deepa, Jun Wei, Nurul, Kavitha, Zhi Hao, Aisha, Raj

**Food**: Milo, pineapple tarts, chicken rice, laksa, nasi lemak, satay, roti prata, kaya toast, kueh, curry puff, fishball noodles, ice kachang

**Places**: HDB flat, void deck, school canteen, hawker centre, MRT station, Sentosa, East Coast Park, Botanic Gardens, National Library

**Events**: Chinese New Year, Hari Raya, Deepavali, National Day, sports day, recess, CCA

## Difficulty Targets (per 20-question file)

- Foundation: 4 questions (20%)
- Standard: 10 questions (50%)
- Advanced: 4 questions (20%)
- HOTS: 2 questions (10%)

## File Storage

Save to: `data/questions/{level}-{subject}-{topic}.json`

If the file exists:
1. Read existing array
2. Append new questions (with new IDs)
3. Write updated array back
4. Update MANIFEST.md

If new file:
1. Create with generated array
2. Update MANIFEST.md

NEVER add questions directly to aggregate files.
Aggregate files should be regenerated from topic files.

## Post-Generation Checklist

- [ ] All IDs are unique (no conflicts with existing)
- [ ] JSON is valid (parse it)
- [ ] All base fields present
- [ ] Type-specific fields present
- [ ] correct_answer matches an actual option
- [ ] worked_solution has numbered steps
- [ ] Singapore context used
- [ ] Difficulty label matches actual complexity
- [ ] Maths answers arithmetically verified
- [ ] No content overlap with existing questions in same file
- [ ] MANIFEST.md updated

Commit: `feat: add {count} questions for {level} {subject} {topic}`
