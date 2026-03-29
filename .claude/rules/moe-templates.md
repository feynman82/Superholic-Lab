# MOE Templates — Intelligence DNA
# Superholic Lab | Last updated: 2026-03-29
#
# AUTHORITY: This file is the absolute source of truth for all question
# generation. Every question produced for this platform MUST conform to
# these templates. No exceptions. No improvisation on structure.
# =======================================================================

## 1. Universal Base Schema (ALL question types)

Every question, regardless of type, MUST include these fields:

```json
{
  "id":            "p4-sci-heat-001",
  "subject":       "Science",
  "level":         "Primary 4",
  "topic":         "Heat",
  "sub_topic":     "Heat Conductors",
  "difficulty":    "Standard",
  "type":          "mcq",
  "marks":         2,
  "question_text": "...",
  "worked_solution": "Step 1: ...\nStep 2: ...\nStep 3: ...",
  "examiner_note": "Required for Advanced and HOTS only."
}
```

### Field Rules
| Field | Rule |
|---|---|
| `id` | Format: `{level-abbr}-{subject-abbr}-{topic-abbr}-{3-digit-seq}`. Never reuse. |
| `subject` | Exact: "Mathematics", "Science", "English" |
| `level` | Exact: "Primary 1" through "Primary 6" (no abbrev) |
| `difficulty` | Exact: "Foundation", "Standard", "Advanced", "HOTS" |
| `type` | Exact: "mcq", "short_ans", "word_problem", "open_ended", "cloze", "editing" |
| `worked_solution` | Minimum 3 numbered steps. Never just the final answer. |
| `examiner_note` | Optional for Foundation/Standard. REQUIRED for Advanced/HOTS. |

### ID Naming Convention
```
{level}{subject}{topic}{sequence}

Level:   p1=P1, p2=P2, p3=P3, p4=P4, p5=P5, p6=P6
Subject: m=Math, s=Science, e=English
Topic:   first 2-4 letters of topic slug (e.g., ht=heat, fr=frac, gr=grammar)
Seq:     zero-padded 3 digits: 001, 002, ..., 099

Examples:
  p4s-ht-001   → Primary 4 Science, Heat, question 1
  p4m-fr-006   → Primary 4 Mathematics, Fractions, question 6
  p4e-gr-002   → Primary 4 English, Grammar, question 2
```

---

## 2. MCQ Schema

**Used by:** Mathematics, Science, English
**Distribution target:** 60% Maths, 70% Science, 40% English

```json
{
  ...base_fields,
  "options": [
    "Option A — full sentence, not a label",
    "Option B — full sentence, not a label",
    "Option C — full sentence, not a label",
    "Option D — full sentence, not a label"
  ],
  "correct_answer": "B",
  "wrong_explanations": {
    "A": "Addresses the SPECIFIC misconception that leads a student to choose A.",
    "C": "Addresses the SPECIFIC misconception that leads a student to choose C.",
    "D": "Addresses the SPECIFIC misconception that leads a student to choose D."
  }
}
```

### MCQ Quality Gates
- `correct_answer` is the LETTER (A/B/C/D), derived from array index (0→A, 1→B, 2→C, 3→D)
- All 4 options must be plausible — no obviously absurd distractors
- Each `wrong_explanations` entry must name the specific misconception, not just say "this is wrong"
- Options should be roughly equal in length — avoid telegraphing the answer via length
- Correct answer position must be varied (avoid always B or C)

### Wrong Explanation Template
> "[Student misconception belief]. This is incorrect because [scientific/mathematical principle]. The correct reasoning is [brief correct logic]."

---

## 3. Short Answer Schema

**Used by:** Mathematics only

```json
{
  ...base_fields,
  "type": "short_ans",
  "correct_answer": "282",
  "accept_also": ["282 cm", "282cm"]
}
```

### Short Answer Rules
- `correct_answer` is the canonical string (number only, no units unless part of answer)
- `accept_also` lists acceptable alternative forms (with units, written form, etc.)
- `worked_solution` must show full working — this is the teaching value

---

## 4. Word Problem Schema

**Used by:** Mathematics only
**Distribution target:** 20% of Maths questions

```json
{
  ...base_fields,
  "type": "word_problem",
  "parts": [
    {
      "label": "(a)",
      "question": "How many tarts did she give away?",
      "marks": 2,
      "correct_answer": "35",
      "worked_solution": "Step 1: 1/3 of 60 = 20\nStep 2: 1/4 of 60 = 15\nStep 3: Total = 20 + 15 = 35"
    },
    {
      "label": "(b)",
      "question": "How many tarts were left?",
      "marks": 1,
      "correct_answer": "25",
      "worked_solution": "Step 1: 60 - 35 = 25"
    }
  ]
}
```

### Word Problem Rules
- NOT auto-graded — show model answer for student comparison
- Each part has its own `marks` and `worked_solution`
- `question_text` at base level sets the scenario; parts ask specific questions
- Minimum 2 parts per word_problem
- Singapore context mandatory: SG names, food, locations, currency (SGD)
- Math heuristics to use (see Section 7 below)

---

## 5. Open-Ended Schema (Science Only)

**Used by:** Science only
**Distribution target:** 30% of Science questions

```json
{
  ...base_fields,
  "type": "open_ended",
  "keywords": ["conductor", "heat", "flows", "hotter", "cooler"],
  "model_answer": "The metal rod is a good conductor of heat. Heat flows from the hotter flame to the cooler end of the rod. The particles in the rod gain energy and vibrate faster, passing energy along the rod."
}
```

### Open-Ended Rules
- NOT auto-graded — keywords highlighted in model answer for student self-check
- `keywords` are the mark-bearing terms examiners look for
- `model_answer` MUST follow the CER framework (see Section 8 below)
- Every `keyword` must appear in `model_answer`
- Marks allocation: 1 mark per keyword cluster typically

---

## 6. Cloze Schema (English Only)

**Used by:** English only
**Distribution target:** 30% of English questions

```json
{
  ...base_fields,
  "type": "cloze",
  "passage": "Last Saturday, Mei Ling [1] to the library with her brother. They [2] many interesting books on the shelf.",
  "blanks": [
    {
      "number": 1,
      "options": ["go", "goes", "went", "going"],
      "correct_answer": "C",
      "explanation": "Past tense is required because the action happened last Saturday."
    },
    {
      "number": 2,
      "options": ["find", "found", "finding", "founded"],
      "correct_answer": "B",
      "explanation": "Past tense 'found' matches the past tense narrative of the passage."
    }
  ]
}
```

### Cloze Rules
- Blanks marked as `[1]`, `[2]`, etc. in passage text
- Each blank has exactly 4 options and one `correct_answer` letter
- `explanation` states the grammar rule by name (tense, subject-verb agreement, etc.)
- Passage must be coherent, culturally SG-appropriate prose

---

## 7. Editing Schema (English Only)

**Used by:** English only
**Distribution target:** 30% of English questions

```json
{
  ...base_fields,
  "type": "editing",
  "passage_lines": [
    {
      "line_number": 1,
      "text": "Ahmad and his friends was playing football yesterday.",
      "underlined_word": "was",
      "has_error": true,
      "correct_word": "were",
      "explanation": "Plural subject 'Ahmad and his friends' requires the plural verb 'were', not the singular 'was'."
    },
    {
      "line_number": 2,
      "text": "They scored three goals in the match.",
      "underlined_word": "scored",
      "has_error": false,
      "correct_word": null,
      "explanation": null
    }
  ]
}
```

### Editing Rules
- Exactly 1 error per editing question (real PSLE format)
- `has_error: false` lines must still have an `underlined_word` to test discrimination
- `explanation` must name the grammar rule violated
- Error types: subject-verb agreement, tense, pronoun, article, preposition, spelling

---

## 8. Science CER Framework (Claim–Evidence–Reasoning)

**Mandatory for:** All Science `open_ended` model answers and worked solutions.
**Strongly recommended for:** Advanced/HOTS Science MCQ worked solutions.

### Structure
```
CLAIM:     [Direct answer to the question — one sentence]
EVIDENCE:  [Observable fact from the question scenario]
REASONING: [Scientific principle connecting evidence to claim]
```

### Template
> "[Claim: state what happens/is true]. This is because [Evidence: what is observed or given]. [Reasoning: name the scientific concept/principle and explain the mechanism]."

### Worked Example (Heat)
> "The metal spoon handle will feel hotter than the plastic spoon handle (CLAIM). Both spoons are in the same hot Milo (EVIDENCE). Metal is a good conductor of heat, so heat travels quickly from the hot Milo through the metal spoon to its handle. Plastic is a poor conductor (insulator), so heat does not travel easily to the plastic handle (REASONING)."

### CER Checklist
- [ ] Claim answers the question directly — no hedging ("it might be...")
- [ ] Evidence references something observable or given in the question
- [ ] Reasoning names the scientific principle (conduction, evaporation, etc.)
- [ ] All mark-bearing keywords are present
- [ ] No more than 3–4 sentences total for P4 level

---

## 9. Science OEQ Framework (Observation–Explanation–Conclusion)

**Used for:** Structured Science questions requiring multi-step reasoning.

```
OBSERVATION: What does the student/scientist observe?
EXPLANATION: Why does this happen? (scientific mechanism)
CONCLUSION:  What does this tell us? (inference or application)
```

### Template
> "I observe that [observation]. This happens because [scientific explanation — name the concept]. Therefore, [conclusion or inference]."

---

## 10. Mathematics Heuristics

**Mandatory reference** when writing `worked_solution` for Maths questions.
Every worked solution must name and apply the appropriate heuristic.

### Model Drawing (Bar Model)
**Use for:** Fraction of a quantity, ratio problems, comparison problems
```
Step 1: Draw the bar model representing the whole
Step 2: Divide into parts according to given fractions/ratios
Step 3: Label each part with the given or unknown value
Step 4: Solve for the unknown
```

### Before-After Model
**Use for:** Questions where a quantity changes (gives away, spends, buys)
```
Step 1: Draw BEFORE state with all quantities
Step 2: Draw AFTER state showing change
Step 3: Use the difference to find the unknown
```

### Part-Whole Model
**Use for:** Problems showing parts that make up a whole
```
Step 1: Identify the whole and the parts
Step 2: Use Part + Part = Whole or Whole - Part = Part
```

### Guess and Check
**Use for:** Number problems with two unknowns and one constraint
```
Step 1: Make a reasonable first guess
Step 2: Check against the constraint
Step 3: Adjust guess up or down
Step 4: Verify final answer satisfies all conditions
```

### Working Backwards
**Use for:** Given the end state, find the starting value
```
Step 1: Start from the final known value
Step 2: Reverse each operation (+ becomes -, × becomes ÷)
Step 3: Arrive at the starting value
```

---

## 11. Supported Types by Subject

| Subject | mcq | short_ans | word_problem | open_ended | cloze | editing |
|---------|-----|-----------|--------------|------------|-------|---------|
| Mathematics | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Science | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| English | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |

## 12. Distribution Targets by Subject

| Subject | Type | Target % |
|---------|------|----------|
| Mathematics | mcq | 60% |
| Mathematics | short_ans | 20% |
| Mathematics | word_problem | 20% |
| Science | mcq | 70% |
| Science | open_ended | 30% |
| English | mcq | 40% |
| English | cloze | 30% |
| English | editing | 30% |

## 13. Difficulty Distribution Target (per topic file)

| Difficulty | Target % |
|---|---|
| Foundation | 20% |
| Standard | 50% |
| Advanced | 20% |
| HOTS | 10% |

---

## 14. Singapore Context Mandate

ALL questions MUST use Singapore context. Non-negotiable.

### Approved Name Pool (rotate, do not repeat same name twice in a row)
- Ahmad, Mei Ling, Siti, Ravi, Priya, Wei Hao, Nurul, Jun Jie

### Approved Locations
- HDB flat, void deck, hawker centre, MRT station, school canteen (tuck shop),
  East Coast Park, Botanic Gardens, Singapore River, Changi Airport

### Approved Food/Objects
- Milo, pineapple tarts, roti prata, char kway teow, kaya toast,
  tissue packs, polytechnic, PSLE, Primary school uniform

### Currency
- Always SGD ($) for money problems. Never USD, GBP, or generic "$X".

### Language Register
- Singapore Standard English. Formal register.
- No Singlish contractions in questions (save for character dialogue if needed).
- British spelling: colour (not color), centre (not center), favour (not favor).
