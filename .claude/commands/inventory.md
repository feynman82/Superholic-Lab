# /inventory — Question Bank Inventory & Gap Analysis

When the user runs `/inventory`, execute this workflow:

## 1. Scan all question files

Read every JSON file in `data/questions/` (excluding .gitkeep and MANIFEST.md).
For each file, extract:
- File name and size
- Number of questions (array length)
- All question IDs
- Distribution by type (mcq, short_ans, word_problem, open_ended, cloze, editing)
- Distribution by difficulty (Foundation, Standard, Advanced, HOTS)
- All unique topics and sub_topics

## 2. Detect issues

- **Duplicates**: same ID appears in multiple files
- **Under-minimum**: files with fewer than 20 questions
- **Type imbalance**: files with only MCQ (need other types)
- **Difficulty imbalance**: files missing Foundation, Advanced, or HOTS
- **Schema violations**: questions missing required fields
- **Aggregate staleness**: aggregate files out of sync with topic files

## 3. Identify gaps

- Levels with no coverage (P1, P3, P6, S1-S4)
- Subjects with no coverage at a level (e.g., P5 English)
- Topics in MOE syllabus not yet covered
- Types not represented (e.g., all MCQ, no short_ans)

## 4. Regenerate MANIFEST.md

Update `data/questions/MANIFEST.md` with current counts,
coverage matrix, and priority gaps.

## 5. Output report

```
## Question Bank Inventory Report
Date: [today]

Total files: X topic-specific, Y aggregate
Total questions: Z

### Coverage Matrix
[table of level x subject with question counts]

### Issues Found
[list of duplicates, under-minimum, etc.]

### Priority Gaps
[ordered list of what to generate next]

### Recommended Next Actions
1. Generate X questions for [highest priority gap]
2. Add [type] questions to [file]
3. Split [aggregate file] into topic-specific files
```
