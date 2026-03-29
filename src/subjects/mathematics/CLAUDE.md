# CLAUDE.md — Mathematics Domain Context
# Superholic Lab | src/subjects/mathematics/
# Last updated: 2026-03-29
#
# This file scopes all Mathematics-specific rules. It INHERITS from the
# project root CLAUDE.md and .claude/rules/moe-templates.md. Where rules
# conflict, this file takes precedence for Mathematics work only.
# =======================================================================

## Mathematics Domain Identity

**Subject:** Mathematics (Primary 2 → Primary 6)
**Exam format:** MOE PSLE Mathematics (Paper 1 + Paper 2)
**Question types allowed:** `mcq`, `short_ans`, `word_problem` ONLY
**Types NEVER used:** open_ended, cloze, editing, comprehension

---

## In-Scope Topics by Level

### Primary 2 Mathematics
| Topic | Sub-topics |
|---|---|
| Whole Numbers | Place value, comparison, ordering, patterns |
| Addition and Subtraction | 2-3 digit, regrouping, word problems |
| Multiplication and Division | 2, 3, 4, 5, 10 times tables |
| Fractions | Halves, thirds, quarters, simple part-whole |
| Money | Dollars and cents, change, simple transactions |
| Measurement | Length (cm/m), mass (g/kg), volume (ml/l) |

### Primary 4 Mathematics
| Topic | Sub-topics |
|---|---|
| Whole Numbers | Large numbers, rounding, factors, multiples, prime numbers |
| Fractions | Equivalent fractions, adding/subtracting unlike fractions, mixed numbers |
| Decimals | Tenths, hundredths, thousandths, conversion, operations |
| Geometry | Angles, perpendicular/parallel lines, area/perimeter of rectangles |
| Measurement | Conversion of units, time, 24-hour clock |
| Data | Tables, bar graphs, line graphs |

### Primary 5 Mathematics
| Topic | Sub-topics |
|---|---|
| Whole Numbers | Order of operations, prime factorisation |
| Fractions | Fraction of a set, fraction × whole number, fraction ÷ fraction |
| Ratios | Ratio notation, equivalent ratios, ratio word problems |
| Percentage | Percentage of a quantity, percentage change |
| Area and Perimeter | Composite figures, triangles, parallelograms |
| Volume | Cubes and cuboids |
| Algebra | Simple algebraic expressions, linear equations |

---

## Mathematics Notation Rules

These are NON-NEGOTIABLE formatting rules for all Math questions:

```
Fractions:   Write as "3/4" (not ¾ unicode, not "three-quarters" unless P2)
Decimals:    Use decimal point "3.14" (not comma "3,14")
Currency:    Always SGD format "$12.50" or "12 dollars and 50 cents" for P2
Mixed nums:  Write "2 3/4" with space between whole number and fraction
Division:    Use "÷" symbol in question_text, "/" in worked_solution code
Multiply:    Use "×" in question_text, "*" is acceptable in worked_solution
Equals:      "=" — never "==" in mathematical context
Units:       Always include units in answer when applicable (cm, m, kg, $)
```

**Show all working in worked_solution** — PSLE Paper 2 awards method marks.
A correct answer without working gets 0 marks in Paper 2.

---

## Mathematics Heuristics — MANDATORY REFERENCE

Before writing any word_problem worked_solution, identify and name the heuristic.
Full definitions in `.claude/rules/moe-templates.md` Section 10.

| Problem Type | Heuristic to Use |
|---|---|
| Fraction of a quantity | Model Drawing (bar model) |
| Ratio comparison | Model Drawing |
| "Before / after" change | Before-After Model |
| Part + Part = Whole | Part-Whole Model |
| Two unknowns, one constraint | Guess and Check |
| Given end state, find start | Working Backwards |
| Unknown in the middle | Working Backwards or Algebra (P5+) |

**Every word_problem worked_solution Step 1 must name the heuristic:**
```
Step 1: Draw a bar model to represent the problem.
        [Description of what the bar model shows]
```

---

## PSLE Mathematics Mark Scheme Conventions

### Paper 1 MCQ (1–2 marks):
- No working required
- But worked_solution in question bank MUST show full working for teaching

### Paper 2 Short Answer (1–2 marks):
- Correct numerical answer required
- Units required where applicable

### Paper 2 Word Problem (2–5 marks):
- Method marks awarded for correct working even if final answer is wrong
- Each `parts` item maps to one method mark cluster
- Final part typically checks the complete solution

### Mark-Losing Patterns to Avoid in Wrong Explanations:
- "Just multiply the numbers" (no explanation of why)
- "The answer is obviously X" (circular)
- Skipping conversion of units before calculating
- Not showing LCD when adding/subtracting unlike fractions

---

## Fraction Question Rules (P4–P6)

Every fraction question worked_solution MUST:
1. State the LCD (Lowest Common Denominator) explicitly before any addition/subtraction
2. Show the equivalent fraction conversion step
3. Check if the answer can be simplified (simplified to lowest terms)

```
WRONG: "1/3 + 1/4 = 4/12 + 3/12 = 7/12"  ← skips the "why" of LCD
RIGHT:
  Step 1: Find the LCD of 3 and 4. LCD = 12.
  Step 2: Convert: 1/3 = 4/12, 1/4 = 3/12.
  Step 3: Add: 4/12 + 3/12 = 7/12.
  Step 4: Check if 7/12 can be simplified. 7 is prime and not a factor of 12 → already in simplest form.
```

---

## Type Distribution for Mathematics

| Type | Target % | Notes |
|---|---|---|
| mcq | 60% | Paper 1 style, 1–2 marks |
| short_ans | 20% | Paper 2 numerical answer |
| word_problem | 20% | Paper 2 multi-part, 3–5 marks total |

Prioritise word_problem for Advanced and HOTS difficulty levels.
Foundation and Standard difficulties can be primarily MCQ.

---

## Difficulty Calibration for Mathematics

| Difficulty | Description | Example |
|---|---|---|
| Foundation | Single operation, direct application | "Find 3/4 of 24." |
| Standard | Two operations, standard scenario | "Ahmad spent 1/3 of his savings on a book. He had $12 left. How much did he start with?" |
| Advanced | Multi-step, concept application | "Ratio problem with before/after change" |
| HOTS | Novel application, non-routine | "Given that X satisfies two conditions, find X." |

---

## Files Owned by This Context

```
data/questions/p2-mathematics-*.json
data/questions/p4-mathematics-*.json
data/questions/p5-mathematics-*.json
data/questions/p6-mathematics-*.json  (future)
src/app/quiz/mathematics/             (Next.js pages — future)
src/components/quiz/MathsCard/        (Next.js component — future)
```
