# Content Production Timeline — Superholic Lab
**Created:** 2026-03-29
**Owner:** Curriculum Team / `/generate-batch` slash command
**Target:** 20 questions per topic file, all 6 types represented, balanced difficulty

---

## Baseline (Day 0)

| Metric | Value |
|---|---|
| Topic files | 21 |
| Total questions | 82 |
| Levels covered | P2, P4, P5 (partial) |
| Types in use | mcq, cloze, editing, short_ans, word_problem, open_ended (P5 only) |
| Missing entirely | P1, P3, P5 English, P6 |
| % to 20q/topic target | ~19% (82 of 420 needed for existing topics) |

---

## The 4-Week Production Plan

### WEEK 1 — Critical Gaps (P1, P3, P6 Foundation)
**Goal:** Establish the three entirely missing PSLE exam levels.

#### Priority order:
1. **P6 Mathematics — Fractions & Ratio** *(highest exam priority — PSLE year)*
   - 10 questions: 6 MCQ, 2 short_ans, 2 word_problem
   - File: `p6-mathematics-fractions.json`
   - Difficulty: Standard×5, Advanced×3, HOTS×2

2. **P6 Science — Human Body Systems** *(PSLE year)*
   - 10 questions: 7 MCQ, 3 open_ended
   - File: `p6-science-human-body.json`
   - Difficulty: Standard×5, Advanced×3, HOTS×2

3. **P1 Mathematics — Whole Numbers** *(entry-level, broadens funnel)*
   - 10 questions: 8 MCQ, 2 word_problem (simple scenarios)
   - File: `p1-mathematics-whole-numbers.json`
   - Difficulty: Foundation×4, Standard×6

4. **P3 Mathematics — Fractions** *(bridge level)*
   - 10 questions: 6 MCQ, 2 short_ans, 2 word_problem
   - File: `p3-mathematics-fractions.json`
   - Difficulty: Foundation×2, Standard×6, Advanced×2

**Week 1 target:** +40 questions across 4 new files

---

### WEEK 2 — Type Diversification
**Goal:** Eliminate the MCQ monoculture in existing P2 and P4 files.

#### P2 Mathematics — add short_ans + word_problem:
- `p2-mathematics-whole-numbers.json`: +7q (3 MCQ, 2 short_ans, 2 word_problem) → total 10
- `p2-mathematics-addition-and-subtraction.json`: +7q (3 MCQ, 2 short_ans, 2 word_problem) → total 10
- `p2-mathematics-money.json`: +7q (3 MCQ, 2 short_ans, 2 word_problem) → total 9

#### P4 Science — add open_ended:
- `p4-science-heat.json`: +6q (2 MCQ, 4 open_ended) → total 10
- `p4-science-matter.json`: +6q (2 MCQ, 4 open_ended) → total 10

#### P2 English — add cloze + editing:
- `p2-english-grammar.json`: +4q (4 MCQ) → total 10
- Create `p2-english-cloze.json`: 10 new cloze questions
- Create `p2-english-editing.json`: 10 new editing questions

**Week 2 target:** +47 questions, 4 existing files updated, 2 new files

---

### WEEK 3 — Volume Scaling (P2 and P4 to 20q each)
**Goal:** Reach the 20-question target for all existing P2 and P4 topic files.

#### P2 Mathematics — scale to 20q:
- Whole Numbers: +10q → total 20
- Addition & Subtraction: +10q → total 20
- Fractions: +12q → total 14 (finish Week 4)
- Money: +9q → total 18 (finish Week 4)
- Multiplication & Division: +12q → total 14 (finish Week 4)

#### P4 Mathematics — scale to 20q:
- Fractions: +15q → total 20
- Decimals: +16q → total 20
- Geometry: +17q → total 20
- Whole Numbers: +17q → total 20

#### P4 Science — scale to 20q:
- Heat: +10q (split MCQ/open_ended) → total 20
- Light: +11q → total 20
- Magnets: +13q → total 20

**Week 3 target:** +125 questions, all P4 files reach 20q

---

### WEEK 4 — Final Polish, HOTS & Difficulty Rebalancing
**Goal:** Hit difficulty targets across all files. Bring remaining P2 and P4 English to 20q.

#### Difficulty injection (across all files):
- Add Foundation questions to P4 Math (currently 0)
- Add Advanced + HOTS to P2 Math (currently 0)
- Add HOTS to P4 Science (currently 0)
- Add HOTS to P4 English (currently 0)

#### P4 English — scale to 20q:
- Grammar: +13q → total 20
- Cloze: +17q → total 20
- Editing: +17q → total 20
- Vocabulary: +17q → total 20
- Comprehension: +17q → total 20

#### P4 Matter finish:
- Matter: +16q → total 20

**Week 4 target:** +140 questions. All existing topics at 20q. Difficulty curves balanced.

---

## Weekly Progress Tracker

| Week | Target +Q | Cumulative | Key milestone |
|---|---|---|---|
| Day 0 (now) | — | 82 | Baseline |
| Week 1 | +40 | 122 | P1, P3, P6 files created |
| Week 2 | +47 | 169 | Type diversity restored |
| Week 3 | +125 | 294 | All P4 topics at 20q |
| Week 4 | +140 | 434 | All existing topics at 20q, difficulty balanced |
| Post-launch | +600+ | 1,034+ | P3, P5-Eng, P6 full coverage |

---

## File Naming Convention (enforced)

```
{level}-{subject}-{topic}.json

Level:   p1, p2, p3, p4, p5, p6
Subject: mathematics, science, english
Topic:   kebab-case slug of MOE topic name

Examples:
  p6-mathematics-fractions.json
  p3-science-plants.json
  p2-english-cloze.json
  p1-mathematics-whole-numbers.json
```

## Quality Gate (per question)
Before any question is committed it must pass:

```
[ ] Singapore context (SG names, locations, currency, food)
[ ] Distractor logic — each wrong option targets a REAL misconception
[ ] Worked solution has ≥ 3 numbered steps
[ ] Correct answer position varied across batch (not always B or C)
[ ] Difficulty label matches actual cognitive demand
[ ] British spelling throughout
[ ] No duplicate sub_topic scenario within the same file
[ ] ID follows naming convention, no duplicates
[ ] examiner_note present for Advanced/HOTS
```

---

## Next Approved Batch (Pending Approval)

**Batch 1 — P1 Mathematics: Whole Numbers (10 questions)**

Proposed type/difficulty breakdown:
- MCQ Foundation ×3 (counting, ordering, comparing numbers to 100)
- MCQ Standard ×3 (place value, number bonds, addition within 100)
- MCQ Advanced ×1 (missing number, pattern recognition)
- word_problem Standard ×2 (simple 1-step: buying items at hawker centre)
- word_problem Advanced ×1 (2-step: before-after scenario)

**Approved sub-topics to cover:**
1. Counting and ordering numbers 1–100
2. Place value (tens and ones)
3. Number bonds to 10, 20
4. Addition within 100 (no regrouping)
5. Simple word problems (1-step)

> ⚠️ **Awaiting approval before generation begins.**
> To generate: confirm this batch plan is approved, then run `/generate-batch`
> targeting Primary 1 Mathematics (Whole Numbers).
