# SUPERHOLIC LAB — MASTER QUESTION TEMPLATE
# Version 2.0 | Source of truth for all question formats
# Reference: MOE/SEAB PSLE exam formats 2025-2026

═══════════════════════════════════════════════════════════════
OVERVIEW — WHY THIS DOCUMENT EXISTS
═══════════════════════════════════════════════════════════════

This document defines EVERY question type that Superholic Lab
supports. Claude Code MUST read this before building or
modifying the quiz engine. Every question in the data bank
MUST conform to one of the types defined here.

The question types are modelled after actual MOE/SEAB exam
formats used in PSLE, SA1, SA2, and school-based assessments.

═══════════════════════════════════════════════════════════════
SYSTEM DIRECTIVES: ZERO-HALLUCINATION SQL & DATA SCHEMA
═══════════════════════════════════════════════════════════════

When generating questions using this template, you are an Expert Singapore MOE Curriculum Developer generating data for a PostgreSQL database. 
Your questions MUST reflect local Singaporean context (e.g., names like Siti, Wei Hao, Ahmad; currency in SGD).

**CRITICAL DATABASE RULES (SQL ESCAPING & STRICT JSON):**
1. **Double-Escape Quotes:** EVERY single quote or apostrophe inside your text strings MUST be double-escaped. 
   - WRONG: "Siti's brother couldn't go."
   - RIGHT: "Siti''s brother couldn''t go."
2. **Stringified JSON:** Fields that store arrays or objects (like `parts`, `options`, `visual_payload`, `accept_also`, `wrong_explanations`) MUST be strictly stringified JSON when written in the SQL `INSERT` statement.
3. **Valid HTML:** Use `<br><br>` for paragraph breaks instead of `\n` in `question_text`, `passage`, and `worked_solution`.

**SUPABASE `question_bank` TABLE FIELDS (Do not invent new columns):**
You may only populate the following columns in your SQL output:
`id` (UUID), `seed_id`, `is_ai_cloned` (boolean), `subject`, `level`, `topic`, `sub_topic`, `difficulty`, `type`, `marks`, `question_text`, `options` (JSON), `correct_answer`, `wrong_explanations` (JSON), `worked_solution`, `parts` (JSON), `keywords` (JSON), `model_answer`, `passage`, `blanks` (JSON), `passage_lines`, `examiner_note`, `created_at`, `cognitive_skill`, `progressive_hints` (JSON), `image_url`, `visual_payload` (JSON), `instructions`, `flag_review` (boolean), `accept_also` (JSON).

═══════════════════════════════════════════════════════════════
QUESTION TYPES BY SUBJECT
═══════════════════════════════════════════════════════════════

MATHEMATICS (3 types)
  Type 1: mcq         — Multiple Choice (Paper 1 Booklet A)
  Type 2: short_ans   — Short Answer / numerical (Paper 1 Booklet B)
  Type 3: word_problem — Structured word problem (Paper 2)

SCIENCE (2 types)
  Type 1: mcq         — Multiple Choice (Booklet A, 2 marks each)
  Type 2: open_ended  — Open-Ended written answer (Booklet B, 2-5 marks)

ENGLISH (6 types)
  Type 1: mcq             — Grammar / Vocabulary MCQ
  Type 2: cloze           — Grammar Cloze (Type 5A) & Comprehension Cloze (Type 5B)
  Type 3: editing         — Spot and correct the error
  Type 4: comprehension   — Text passage with multi-part questions (Split-Screen)
  Type 5: visual_text     — Image/Flyer with multi-part MCQs (Split-Screen)
  Type 6: synthesis       — Transform sentences using short_ans Visual Blueprints

═══════════════════════════════════════════════════════════════
EXHAUSTIVE MOE SYLLABUS TAXONOMY
═══════════════════════════════════════════════════════════════

You must categorize every question exactly according to these Levels, Subjects, Topics, and Sub-Topics.

[PRIMARY 1 & 2]
- MATH Topics: Whole Numbers, Addition and Subtraction, Multiplication and Division, Money, Length and Mass, Volume, Shapes and Patterns, Picture Graphs, Time.
- ENGLISH Topics: Grammar, Vocabulary, Comprehension, Cloze.

[PRIMARY 3]
- MATH Topics & Sub-Topics:
  - Whole Numbers: Part-Whole, Comparison, Division with Remainder, 2-Step Word Problems.
  - Fractions: Equivalent Fractions, Comparing Fractions, Addition/Subtraction (Same Denominator).
  - Measurement: Length (m, cm), Mass (kg, g), Volume (L, ml), Time (Duration).
  - Geometry & Graphs: Angles (Right Angles), Area and Perimeter (Squares/Rectangles), Bar Graphs.
- SCIENCE Topics: Diversity (Living/Non-Living, Materials), Systems (Human Digestive), Interactions (Magnets).
- ENGLISH Topics: Grammar, Vocabulary, Comprehension, Cloze, Editing, Synthesis.

[PRIMARY 4]
- MATH Topics & Sub-Topics:
  - Whole Numbers: Factors & Multiples, Grouping/Sets, Constant Difference (Age).
  - Fractions: Mixed Numbers, Improper Fractions, Fraction of a Set, Remainder Heuristic.
  - Decimals: Addition/Subtraction, Multiplication/Division, Money Step-Rates.
  - Geometry & Measurement: Symmetry, 8-Point Compass, Push-out Perimeter, Composite Area.
  - Graphs: Line Graphs, Tables.
- SCIENCE Topics: Cycles (Matter, Life Cycles), Energy (Heat, Light), Interactions (Magnets).
- ENGLISH Topics: Grammar, Vocabulary, Comprehension, Cloze, Editing, Synthesis.

[PRIMARY 5]
- MATH Topics & Sub-Topics:
  - Whole Numbers: Order of Operations, Supposition, Excess and Shortage.
  - Fractions: Equating Numerators, Branching, Remainder of Remainder.
  - Ratios: One Part Unchanged, Total Unchanged (Internal Transfer), Constant Difference, Repeated Identity.
  - Decimals & Percentage: Base Shifts, GST/Discount, Rates.
  - Geometry: Area of Triangle (Base/Height, Subtraction Method), Volume (Cubes/Cuboids/Displacement), Angles (Rhombus/Trapezium/Parallelogram).
  - Stats: Average (Base shifting).
- SCIENCE Topics: Cycles (Water Cycle, Reproduction), Systems (Electrical Circuits, Plant Transport, Human Respiratory/Circulatory), Energy (Photosynthesis).
- ENGLISH Topics: Grammar, Vocabulary, Comprehension, Cloze, Editing, Synthesis & Transformation.

[PRIMARY 6]
- MATH Topics & Sub-Topics:
  - Algebra: Algebraic manipulation and substitution.
  - Fractions/Ratio/Percentage: Simultaneous Concepts, Changing Bases.
  - Speed: Average Speed, Catching up, Moving in Opposite Directions.
  - Geometry: Circles (Area/Perimeter of quadrants/semicircles), Nets, Solid Figures.
  - Stats: Pie Charts.
- SCIENCE Topics: Interactions (Forces, Environment, Food Webs), Energy (Forms & Uses, Conversions).
- ENGLISH Topics: Grammar, Vocabulary, Comprehension, Cloze, Editing, Synthesis & Transformation.

═══════════════════════════════════════════════════════════════
UNIVERSAL JSON SCHEMA — ALL QUESTIONS USE THIS BASE
═══════════════════════════════════════════════════════════════

Every question, regardless of type, MUST have these fields:

{
  "id":               "string — unique ID, format: {level}-{subject}-{topic}-{number} or UUID",
  "subject":          "string — Mathematics | Science | English",
  "level":            "string — Primary 2 | Primary 3 | Primary 4 | etc",
  "topic":            "string — Exact topic from Taxonomy",
  "sub_topic":        "string — Exact sub-topic/heuristic from Taxonomy",
  "difficulty":       "string — Foundation | Standard | Advanced | HOTS",
  "type":             "string — mcq | short_ans | word_problem | open_ended | cloze | editing | comprehension",
  "marks":            "number — 1, 2, 3, 4 or 5 (based on MOE mark allocation)",
  "question_text":    "string — the full question with scenario/context. Escaped quotes (''s) required.",
  "cognitive_skill":  "string — Micro-skill tested (e.g., 'Subtraction logic')",
  "progressive_hints":["string", "string"] — Optional. Two hints: [1] Gentle nudge, [2] Direct clue.
  "visual_payload":   "stringified JSON or null — See Visual Payload Engines Registry section.",
  "correct_answer":   "string — the correct answer (Optional for multi-part types)",
  "worked_solution":  "string — full step-by-step working, labelled Step 1, Step 2 etc",
  "examiner_note":    "string|null — PSLE keyword tip, optional"
}

Additional fields by type — see each type below.

═══════════════════════════════════════════════════════════════
TYPE 1: MCQ — MULTIPLE CHOICE QUESTION
═══════════════════════════════════════════════════════════════

Used in: Maths Paper 1 Booklet A, Science Booklet A, English

FORMAT:
  - 4 options in an array.
  - Exactly ONE correct answer.
  - Options must be FULL SENTENCES for Science/English.
  - Options can be numerical values for Maths.
  - DO NOT prefix the options with A, B, C, or D (e.g., just "2/7", not "A: 2/7").

ADDITIONAL JSON FIELDS:
  "options": ["string", "string", "string", "string"],
  "correct_answer": "string — MUST be the exact string from the options array",
  "wrong_explanations": {
    "exact_wrong_option_string_1": "string — specific misconception",
    "exact_wrong_option_string_2": "string — specific misconception",
    "exact_wrong_option_string_3": "string — specific misconception"
  }
  (Keys MUST be the exact strings from the options array, NOT "A", "B", "C")

DISPLAY RULES:
  - Show option letter in a CIRCLE BADGE: (A) (B) (C) (D)
  - Option text appears NEXT TO the badge, not inside it
  - The badge letter is ALWAYS A/B/C/D in order
  - It is NOT derived from the option text
  - On click: highlight green (correct) or red (wrong)
  - After answering: show worked solution + wrong explanation
    for the option the student chose
  - DO NOT show True/False buttons for MCQ questions

SAMPLE — MATHS MCQ:

{
  "id": "p4-math-frac-001",
  "subject": "Mathematics",
  "level": "Primary 4",
  "topic": "Fractions",
  "sub_topic": "Adding unlike fractions",
  "difficulty": "Standard",
  "type": "mcq",
  "marks": 2,
  "question_text": "Ahmad ate 1/3 of a pizza. His sister ate 1/4 of the same pizza.\n\nWhat fraction of the pizza did they eat altogether?",
  "options": [
    "2/7",
    "2/12",
    "7/12",
    "1/7"
  ],
  "correct_answer": "7/12",
  "worked_solution": "Step 1: Find the LCD of 3 and 4. The LCD is 12.\n\nStep 2: Convert: 1/3 = 4/12 and 1/4 = 3/12.\n\nStep 3: Add: 4/12 + 3/12 = 7/12.\n\nThey ate 7/12 of the pizza altogether.",
  "wrong_explanations": {
    "2/7": "2/7 comes from adding numerators (1+1=2) and denominators (3+4=7) separately. You CANNOT add fractions this way — you must find a common denominator first.",
    "2/12": "2/12 comes from finding the correct LCD of 12, but adding the original numerators (1+1=2) without converting. You must convert 1/3 to 4/12 and 1/4 to 3/12 before adding.",
    "1/7": "1/7 comes from keeping numerator as 1 and adding denominators (3+4=7). Fractions do not work this way."
  },
  "examiner_note": "Always show working: (1) state LCD, (2) show conversion, (3) show addition."
}


═══════════════════════════════════════════════════════════════
TYPE 2: SHORT ANSWER — NUMERICAL OR ONE-WORD ANSWER
═══════════════════════════════════════════════════════════════

Used in: Maths Paper 1 Booklet B (short answer, 1-2 marks)

FORMAT:
  - Student types their answer in a text input field
  - Answer is a number, fraction, or short phrase
  - Accept equivalent answers (e.g. "3/5" and "0.6")

ADDITIONAL JSON FIELDS:
  "correct_answer": "string — the expected answer",
  "accept_also": ["string", ...] — alternative correct forms

DISPLAY RULES:
  - Show question text
  - Show a text input field with placeholder "Type your answer"
  - Show a "Check Answer" button
  - On check: green border if correct, red if wrong
  - DO NOT show A/B/C/D option cards


═══════════════════════════════════════════════════════════════
TYPE 3: WORD PROBLEM — MULTI-STEP STRUCTURED QUESTION (MATH)
═══════════════════════════════════════════════════════════════

Used in: Maths Paper 2 (structured, 3-5 marks, show working)

FORMAT:
  - Real-world scenario with multiple parts
  - May have sub-parts: (a), (b), (c)
  - Student types working + answer in a text area

ADDITIONAL JSON FIELDS:
  "parts": [
    {
      "label": "(a)",
      "question": "string — the sub-question",
      "marks": 2,
      "correct_answer": "string",
      "accept_also": ["string"],
      "worked_solution": "string — Step 1: ...",
      "progressive_hints": ["string", "string"]
    }
  ]

SAMPLE — MATHS WORD PROBLEM:

{
  "id": "p4-math-frac-wp01",
  "subject": "Mathematics",
  "level": "Primary 4",
  "topic": "Fractions",
  "sub_topic": "Fraction of a set",
  "difficulty": "Advanced",
  "type": "word_problem",
  "marks": 4,
  "question_text": "Auntie Mei baked 60 pineapple tarts for Chinese New Year. She gave 1/3 of them to her neighbour and 1/4 of them to her colleague.",
  "parts": [
    {
      "label": "(a)",
      "question": "How many pineapple tarts did she give away altogether?",
      "marks": 2,
      "correct_answer": "35",
      "accept_also": [],
      "worked_solution": "1/3 of 60 = 20 tarts. 1/4 of 60 = 15 tarts. Total = 35.",
      "progressive_hints": ["Find 1/3 of 60 first.", "Find 1/4 of 60, then add them together."]
    },
    {
      "label": "(b)",
      "question": "How many pineapple tarts does Auntie Mei have left?",
      "marks": 2,
      "correct_answer": "25",
      "accept_also": [],
      "worked_solution": "Tarts left = 60 - 35 = 25 tarts.",
      "progressive_hints": ["Subtract the total given away from the 60 she baked."]
    }
  ],
  "worked_solution": "See parts (a) and (b) above.",
  "examiner_note": "Method marks are awarded even if the final answer is wrong."
}


═══════════════════════════════════════════════════════════════
TYPE 4: OPEN-ENDED — WRITTEN EXPLANATION (SCIENCE)
═══════════════════════════════════════════════════════════════

Used in: Science Booklet B (2-5 marks)

FORMAT:
  - Scenario-based question requiring written explanation.
  - Matches the "word_problem" schema by using a "parts" array for (a), (b) sub-questions.
  - Student must use scientific keywords (CER framework).

ADDITIONAL JSON FIELDS (Inside "parts" array):
  "parts": [
    {
      "label": "(a)",
      "question": "string — the sub-question",
      "marks": 2,
      "correct_answer": "string — The ideal model answer using CER",
      "keywords": ["string", "string"],
      "worked_solution": "string — Explanation of how to arrive at the answer",
      "progressive_hints": ["string", "string"]
    }
  ]

DISPLAY RULES:
  - This shares the EXACT same UI component as `word_problem`.
  - Show text area for student's answer per part.
  - Show "See Model Answer" button.

SAMPLE — SCIENCE OPEN-ENDED:

{
  "id": "p4-sci-heat-oe01",
  "subject": "Science",
  "level": "Primary 4",
  "topic": "Heat",
  "sub_topic": "Heat flow",
  "difficulty": "Standard",
  "type": "open_ended",
  "marks": 2,
  "question_text": "Ravi placed a cup of hot Milo on the kitchen table. After 30 minutes, the Milo was no longer hot.",
  "parts": [
    {
      "label": "(a)",
      "question": "Explain why the temperature of the Milo decreased.",
      "marks": 2,
      "correct_answer": "The Milo was hotter than the surrounding air. Heat flows from a hotter object to a cooler object. Therefore, the Milo lost heat to the cooler surrounding air, causing its temperature to decrease.",
      "keywords": ["heat", "flows", "hotter", "cooler", "surrounding air"],
      "worked_solution": "Identify temperatures — the Milo is hot, the air is cooler. Apply concept: heat flows from hotter to cooler.",
      "progressive_hints": ["Which is hotter, the Milo or the air in the room?", "Where does the heat move to?"]
    }
  ],
  "worked_solution": "See parts (a).",
  "examiner_note": "Must use the word 'heat' — saying 'cold enters the Milo' will lose marks."
}


═══════════════════════════════════════════════════════════════
TYPE 5: CLOZE PASSAGES (ENGLISH)
═══════════════════════════════════════════════════════════════

Used in: English Paper 2 (Grammar Cloze and Comprehension Cloze)

**FORMAT RULES:**
- A continuous `passage` string with embedded bracketed numbers for blanks: `[1]`, `[2]`.
- DO NOT put options inside the passage string.

**TYPE 5A: GRAMMAR CLOZE (Dropdown Selection)**
To trigger a dropdown, you MUST include the `"options"` array in the blank object.
  "blanks": [
    {
      "number": 1,
      "options": ["He", "She", "It", "They"],
      "correct_answer": "It",
      "explanation": "string"
    }
  ]

**TYPE 5B: COMPREHENSION CLOZE (Free-Text Typing)**
To trigger an empty text input box for the student to type their own answer, you MUST OMIT the `"options"` array.
  "blanks": [
    {
      "number": 1,
      "correct_answer": "because",
      "accept_also": ["as", "since"],
      "explanation": "string"
    }
  ]

DISPLAY RULES:
  - Show passage with highlighted numbered blanks
  - Below each blank: show 4 radio-button options
  - "Check Answers" button at the bottom
  - Highlight correct/wrong for each blank


═══════════════════════════════════════════════════════════════
TYPE 6: EDITING — SPOT AND CORRECT ERRORS (ENGLISH)
═══════════════════════════════════════════════════════════════

Used in: English Paper 2 (Editing section)

FORMAT:
  - A continuous passage.
  - Errors are marked directly in the passage using HTML underline tags followed by a bracketed number.
  - Example: "She <u>goed</u> [1] to the market."
  - Student types the corrected word into an inline input box.

ADDITIONAL JSON FIELDS:
  "passage": "string — the full continuous text with embedded <u>error</u> [1] markings.",
  "blanks": [
    {
      "number": 1,
      "correct_answer": "string — the exact corrected word",
      "explanation": "string — explanation of the grammar/spelling rule"
    }
  ]

DISPLAY RULES:
  - Show passage with underlined words clearly marked
  - For each underlined word: text input for correction
  - "Check" button reveals answers

═══════════════════════════════════════════════════════════════
TYPE 7: COMPREHENSION — (English PSLE)
═══════════════════════════════════════════════════════════════

**Type Code:** `comprehension`
**Description:** A mixed-format question type featuring a root passage and a polymorphic `parts` array representing different sub-questions (MCQ, True/False tables, Open-Ended text boxes).

**JSON Structure:**
```json
{
  "type": "comprehension",
  "marks": 9,
  "passage": "Siti was walking home from school...", 
  "parts": [
    {
      "part_type": "mcq",
      "marks": 1,
      "question": "Why did Siti drop her bag?",
      "options": ["She was tired.", "To save the kitten.", "It fell.", "Her mom told her to."],
      "correct_answer": "To save the kitten.",
      "explanation": "She needed to free her hands."
    },
    {
      "part_type": "true_false",
      "marks": 2,
      "instructions": "State whether the statement is True or False, and give a reason.",
      "items": [
        {
          "statement": "Siti ignored the kitten.",
          "correct_answer": "False",
          "reason_evidence": "The passage states she dropped her bag without hesitation."
        }
      ]
    },
    {
      "part_type": "text_box",
      "marks": 2,
      "question": "How did Siti keep the kitten warm?",
      "model_answer": "Siti kept the kitten warm by wrapping it tightly in her jacket.",
      "rubric": "Award 2 marks for mentioning wrapping in her jacket. 1 mark for jacket only."
    }
  ]
}

═══════════════════════════════════════════════════════════════
TYPE 8: VISUAL TEXT COMPREHENSION (ENGLISH)
═══════════════════════════════════════════════════════════════

**Type Code:** `visual_text`
**Topic MUST be:** "Comprehension"
**Description:** A Split-Screen question where the left pane renders a flyer/poster image, and the right pane renders an array of sub-questions. (Used for Primary 5 & 6 only).

**CRITICAL DATABASE MAPPING:**
- `type`: "visual_text"
- `passage`: MUST BE `null` (The UI uses the image instead of text).
- `image_url`: "string — URL of the flyer/poster".
- `question_text`: "Study the flyer carefully and answer the following questions."
- `parts`: A stringified JSON array containing multiple `mcq` objects.

**JSON Parts Structure:**
"parts": [
  {
    "part_type": "mcq",
    "label": "Q1",
    "marks": 1,
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correct_answer": "string",
    "explanation": "string"
  }
]

═══════════════════════════════════════════════════════════════
TYPE 9: OPEN-ENDED WITH DIAGRAMS (SCIENCE)
═══════════════════════════════════════════════════════════════

Used in: Science Booklet B (Multi-part experiments)

FORMAT:
  - An experiment setup or scenario is shown.
  - Student answers parts (a), (b), (c) in separate text boxes.

ADDITIONAL JSON FIELDS:
  "passage": "string — The experiment context/setup",
  "visual_payload": { ... } — Diagram of the experiment (optional),
  "parts": [
    {
      "label": "(a)",
      "part_type": "text_box",
      "marks": 2,
      "question": "string",
      "model_answer": "string",
      "rubric": "string",
      "keywords": ["string"]
    }
  ]

═══════════════════════════════════════════════════════════════
TYPE 10: SYNTHESIS & TRANSFORMATION (English Only)
═══════════════════════════════════════════════════════════════

**Type Code:** `short_ans`
**Topic MUST be:** "Synthesis"
**Description:** Combines or transforms sentences using a "Visual Blueprint".

**CRITICAL DATABASE MAPPING (The Visual Blueprint Parser):**
Our UI parses the `instructions` field using Regex to automatically draw visual connector lines. You MUST format the data exactly like this:

1. `question_text`: MUST contain ONLY the original sentences. No line breaks.
   *Example:* "The boy is my neighbour. His bicycle was stolen."
2. `instructions`: MUST contain the connector/starter word wrapped in EXACT single quotes.
3. `correct_answer`: The exact, grammatically perfect complete sentence (including full stop).

**THE 4 CONNECTOR MODES (Format `instructions` to trigger the correct UI):**
* **Mode 1: Start Connector (Default)**
    * *Instructions:* Rewrite the sentence beginning with the word ''Unless''.
    * *UI Result:* `[ Unless ] _______________________`
* **Mode 2: Middle Connector (Using Dots)**
    * *Instructions:* Combine the sentences using the phrase ''... even though ...''.
    * *UI Result:* `__________ [ even though ] __________`
* **Mode 3: Middle Connector (Using Brackets)**
    * *Instructions:* Combine the sentences using the word ''(whose)''.
    * *UI Result:* `__________ [ whose ] __________`
* **Mode 4: End Connector**
    * *Instructions:* Combine the sentences using the word ''... respectively.''.
    * *UI Result:* `_______________________ [ respectively. ]`

═══════════════════════════════════════════════════════════════
VISUAL PAYLOAD ENGINES REGISTRY
═══════════════════════════════════════════════════════════════

If the question requires a diagram, generate a stringified JSON object for "visual_payload".
"engine" is ALWAYS "diagram-library". Use "function_name" and "params" exactly as below:

1. fractionBars: {"fractions": [{"numerator": 1, "denominator": 4}, ...], "labels": ["A", "B"]}
2. dataTable: {"headers": ["Item", "Cost"], "rows": [["Pen", "$2"], ["Eraser", "$1"]]}
3. numberLine: {"start": 0, "end": 100, "marked": [0, 50, 100], "labels": [{"value": 50, "text": "Mid"}]}
4. drawRectangleOnGrid: {"width_cm": 10, "length_cm": 5, "labels": "Garden"}
5. cuboid: {"length_label": "10", "breadth_label": "5", "height_label": "10", "water_level": 0.5}
6. pieChart: {"data": [{"label": "Red", "value": 25}, {"label": "Blue", "value": 75}]}
7. compositeShape: {"parts": [{"x":0,"y":0,"w":50,"h":50}, {"x":50,"y":50,"w":50,"h":50}]}
8. verticalBarChart / horizontalBarChart: {"title": "X", "yAxisLabel": "Y", "data": [{"label": "A", "value": 10}]}
9. polygon: {"vertices": ["A", "B", "C", "D"], "angle_arcs": [{"vertex": "B", "label": "90°"}]}
10. arrowDiagram: {"nodes": [{"id":"1","label":"Egg"}], "arrows": [{"from":"1","to":"2","label":"hatches"}]}

[SMART FALLBACK: Universal Experiment Renderer]
Use this for Science setups (beakers, magnets, plants) or anything not covered above.
11. genericExperiment: 
    {"commonConditions": ["Same amount of water", "Placed in sunlight"], 
     "setups": [
       {"label": "Setup A", "variables": ["Plastic cup", "Ice"]}, 
       {"label": "Setup B", "variables": ["Metal cup", "Ice"]}
     ]}


═══════════════════════════════════════════════════════════════
QUIZ ENGINE DISPLAY RULES — FOR CLAUDE CODE
═══════════════════════════════════════════════════════════════

CRITICAL RULES (these fix the bugs in the screenshots):

1. OPTION BADGES:
   For MCQ questions, the circle badge shows A, B, C, D.
   The badge letter is HARD-CODED from the option index:
     options[0] → badge "A"
     options[1] → badge "B"
     options[2] → badge "C"
     options[3] → badge "D"
   NEVER use the first character of the option text as the badge.

2. QUESTION TYPE DETERMINES UI:
   type === "mcq"          → show 4 option cards with A/B/C/D badges
   type === "short_ans"    → show text input + "Check Answer" button
   type === "word_problem"  → show text area for each part + "Show Model Answer"
   type === "open_ended"    → show text area for each part + "See Model Answer"
   type === "cloze"         → show passage with dropdown/radio per blank
   type === "editing"       → show passage with text input per underlined word

3. TRUE/FALSE HANDLING:
   NEVER generate standalone True/False questions (e.g., as a root `mcq`). 
   HOWEVER, you MUST use the `"part_type": "true_false"` schema when building True/False evidence tables INSIDE a Type 7 `comprehension` parts array.

4. FRACTION DISPLAY:
   Fractions in option text MUST render as plain text.
   "7/12" should display as "7/12" — do not parse or split on "/".

5. AFTER ANSWERING (MCQ):
   - Correct option: green border + checkmark
   - Wrong option (selected): red border + X mark
   - Show the correct answer highlighted
   - Show "Worked Solution" section below
   - Show "Why [X] is wrong" for the option the student chose

6. AFTER ANSWERING (short_ans):
   - If correct: green border, "✓ Correct!" message
   - If wrong: red border, "✗ Not quite. Correct answer: [X]"
   - Show worked solution below

═══════════════════════════════════════════════════════════════
QUALITY CHECKLIST — EVERY QUESTION MUST PASS
═══════════════════════════════════════════════════════════════

□ Question has a real-world Singapore context (names, places, food)
□ All SQL apostrophes are double-escaped (e.g. Siti''s)
□ All 4 MCQ options are plausible (no joke answers)
□ Science/English MCQ options are FULL SENTENCES (not fragments)
□ Maths options include the most common wrong answers students make
□ Worked solution has numbered steps (Step 1, Step 2, etc.)
□ Correct answer is mathematically/scientifically accurate (verified)
□ Fractions written as plain text with "/" (e.g., "7/12")
□ Topic and sub_topic match MOE syllabus naming exactly

═══════════════════════════════════════════════════════════════
END OF MASTER QUESTION TEMPLATE
═══════════════════════════════════════════════════════════════