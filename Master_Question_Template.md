# SUPERHOLIC LAB — MASTER QUESTION TEMPLATE
# Version 1.0 | Source of truth for all question formats
# Save to: C:\SLabDrive\01 - Platform Intelligence\Master Question Template.md
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
QUESTION TYPES BY SUBJECT
═══════════════════════════════════════════════════════════════

MATHEMATICS (3 types)
  Type 1: mcq         — Multiple Choice (Paper 1 Booklet A)
  Type 2: short_ans   — Short Answer / numerical (Paper 1 Booklet B)
  Type 3: word_problem — Structured word problem (Paper 2)

SCIENCE (2 types)
  Type 1: mcq         — Multiple Choice (Booklet A, 2 marks each)
  Type 2: open_ended  — Open-Ended written answer (Booklet B, 2-5 marks)

ENGLISH (4 types)
  Type 1: mcq         — Grammar / Vocabulary MCQ
  Type 2: cloze       — Grammar Cloze (fill blank from options)
  Type 3: editing     — Spot and correct the error
  Type 4: comprehension — Read passage, answer question

═══════════════════════════════════════════════════════════════
UNIVERSAL JSON SCHEMA — ALL QUESTIONS USE THIS BASE
═══════════════════════════════════════════════════════════════

Every question, regardless of type, MUST have these fields:

{
  "id":               "string — unique ID, format: {level}-{subject}-{topic}-{number}",
  "subject":          "string — Mathematics | Science | English",
  "level":            "string — Primary 2 | Primary 3 | Primary 4 | etc",
  "topic":            "string — e.g. Fractions, Heat, Grammar",
  "sub_topic":        "string — e.g. Adding unlike fractions, Conductors",
  "difficulty":       "string — Foundation | Standard | Advanced | HOTS",
  "type":             "string — mcq | short_ans | word_problem | open_ended | cloze | editing | comprehension",
  "marks":            "number — 1, 2, 3, 4 or 5 (based on MOE mark allocation)",
  "question_text":    "string — the full question with scenario/context",
  "correct_answer":   "string — the correct answer (letter for MCQ, value for others)",
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
  "correct_answer": "C",
  "worked_solution": "Step 1: Find the LCD of 3 and 4. The LCD is 12.\n\nStep 2: Convert: 1/3 = 4/12 and 1/4 = 3/12.\n\nStep 3: Add: 4/12 + 3/12 = 7/12.\n\nThey ate 7/12 of the pizza altogether.",
  "wrong_explanations": {
    "A": "2/7 comes from adding numerators (1+1=2) and denominators (3+4=7) separately. You CANNOT add fractions this way — you must find a common denominator first.",
    "B": "2/12 comes from finding the correct LCD of 12, but adding the original numerators (1+1=2) without converting. You must convert 1/3 to 4/12 and 1/4 to 3/12 before adding.",
    "D": "1/7 comes from keeping numerator as 1 and adding denominators (3+4=7). Fractions do not work this way."
  },
  "examiner_note": "Always show working: (1) state LCD, (2) show conversion, (3) show addition."
}

SAMPLE — SCIENCE MCQ:

{
  "id": "p4-sci-heat-001",
  "subject": "Science",
  "level": "Primary 4",
  "topic": "Heat",
  "sub_topic": "Conductors and insulators",
  "difficulty": "Standard",
  "type": "mcq",
  "marks": 2,
  "question_text": "Siti placed a metal spoon and a plastic spoon into a cup of hot Milo. After 2 minutes, she touched both spoon handles.\n\nWhich of the following correctly describes what Siti would observe?",
  "options": [
    "Both spoon handles would feel equally hot because they are in the same cup of Milo.",
    "The metal spoon handle would feel hotter because metal is a good conductor of heat.",
    "The plastic spoon handle would feel hotter because plastic absorbs more heat than metal.",
    "Neither spoon handle would feel hot because the handles are not touching the Milo."
  ],
  "correct_answer": "B",
  "worked_solution": "Step 1: Both spoons are in hot Milo. Heat flows from the Milo into both spoons.\n\nStep 2: Metal is a good conductor of heat — heat travels quickly through the metal spoon to the handle.\n\nStep 3: Plastic is a poor conductor (insulator) — heat does not travel easily through it, so the handle stays cool.\n\nThe metal spoon handle feels hotter.",
  "wrong_explanations": {
    "A": "Different materials conduct heat at different rates. Metal conducts well, plastic does not. Same cup does not mean same handle temperature.",
    "C": "Plastic does NOT absorb more heat. Plastic is a poor conductor — it resists heat transfer. The plastic handle stays cool.",
    "D": "Heat travels through the spoon material via conduction, even though the handle is not directly in the Milo."
  },
  "examiner_note": "PSLE keyword: 'Metal is a good conductor of heat.' Name the material AND state conductor/insulator."
}

SAMPLE — ENGLISH MCQ:

{
  "id": "p4-eng-gram-001",
  "subject": "English",
  "level": "Primary 4",
  "topic": "Grammar",
  "sub_topic": "Subject-verb agreement",
  "difficulty": "Standard",
  "type": "mcq",
  "marks": 1,
  "question_text": "Choose the correct word to complete the sentence.\n\nNeither the teacher nor the students ______ ready for the assembly.",
  "options": [
    "is",
    "are",
    "was",
    "has been"
  ],
  "correct_answer": "B",
  "worked_solution": "Step 1: With 'neither...nor', the verb agrees with the noun CLOSEST to it.\n\nStep 2: The closest noun is 'students' (plural).\n\nStep 3: Plural subject takes 'are'.\n\nAnswer: 'Neither the teacher nor the students are ready.'",
  "wrong_explanations": {
    "A": "'Is' is singular — but 'students' (the closest noun) is plural.",
    "C": "'Was' is past tense singular — the sentence is in present tense.",
    "D": "'Has been' is singular present perfect — does not match plural 'students'."
  },
  "examiner_note": "Neither...nor rule: verb agrees with the noun closest to it."
}


═══════════════════════════════════════════════════════════════
TYPE 2: SHORT ANSWER — NUMERICAL OR ONE-WORD ANSWER
═══════════════════════════════════════════════════════════════

Used in: Maths Paper 1 Booklet B (short answer, 1-2 marks)

FORMAT:
  - Student types their answer in a text input field
  - Answer is a number, fraction, or short phrase
  - No options shown — just an input box
  - System checks if typed answer matches correct_answer
  - Accept equivalent answers (e.g. "3/5" and "0.6")

ADDITIONAL JSON FIELDS:
  "correct_answer": "string — the expected answer",
  "accept_also": ["string", ...] — alternative correct forms

DISPLAY RULES:
  - Show question text
  - Show a text input field with placeholder "Type your answer"
  - Show a "Check Answer" button
  - On check: green border if correct, red if wrong
  - After checking: show worked solution
  - DO NOT show A/B/C/D option cards
  - DO NOT show True/False buttons

SAMPLE — MATHS SHORT ANSWER:

{
  "id": "p4-math-wn-sa01",
  "subject": "Mathematics",
  "level": "Primary 4",
  "topic": "Whole Numbers",
  "sub_topic": "Division algorithm",
  "difficulty": "Standard",
  "type": "short_ans",
  "marks": 1,
  "question_text": "What is 846 ÷ 3?",
  "correct_answer": "282",
  "accept_also": [],
  "worked_solution": "Step 1: 8 ÷ 3 = 2 remainder 2.\n\nStep 2: Bring down 4 to make 24. 24 ÷ 3 = 8.\n\nStep 3: Bring down 6 to make 6. 6 ÷ 3 = 2.\n\nAnswer: 282.",
  "examiner_note": null
}

SAMPLE — MATHS SHORT ANSWER (FRACTION):

{
  "id": "p4-math-frac-sa01",
  "subject": "Mathematics",
  "level": "Primary 4",
  "topic": "Fractions",
  "sub_topic": "Simplest form",
  "difficulty": "Foundation",
  "type": "short_ans",
  "marks": 1,
  "question_text": "Express 8/12 in its simplest form.",
  "correct_answer": "2/3",
  "accept_also": [],
  "worked_solution": "Step 1: Find the GCF of 8 and 12. GCF = 4.\n\nStep 2: Divide both by 4: 8÷4 = 2, 12÷4 = 3.\n\nSimplest form: 2/3.",
  "examiner_note": null
}


═══════════════════════════════════════════════════════════════
TYPE 3: WORD PROBLEM — MULTI-STEP STRUCTURED QUESTION
═══════════════════════════════════════════════════════════════

Used in: Maths Paper 2 (structured, 3-5 marks, show working)

FORMAT:
  - Real-world scenario with multiple parts
  - Student must show working for full marks
  - May have sub-parts: (a), (b), (c)
  - Student types working + answer in a text area
  - System shows model answer for comparison (not auto-graded)

ADDITIONAL JSON FIELDS:
  "parts": [
    {
      "label": "(a)",
      "question": "string — the sub-question",
      "marks": 2,
      "correct_answer": "string",
      "worked_solution": "string"
    }
  ]

DISPLAY RULES:
  - Show the scenario text at top
  - Show each part (a), (b), (c) with its mark allocation
  - For each part: show a text area for working
  - "Show Model Answer" button (not auto-graded)
  - DO NOT show A/B/C/D option cards
  - DO NOT show True/False buttons

SAMPLE — MATHS WORD PROBLEM:

{
  "id": "p4-math-frac-wp01",
  "subject": "Mathematics",
  "level": "Primary 4",
  "topic": "Fractions",
  "sub_topic": "Word problem — fraction of a set",
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
      "worked_solution": "1/3 of 60 = 60 ÷ 3 = 20 tarts (neighbour)\n1/4 of 60 = 60 ÷ 4 = 15 tarts (colleague)\nTotal given away = 20 + 15 = 35 tarts."
    },
    {
      "label": "(b)",
      "question": "How many pineapple tarts does Auntie Mei have left?",
      "marks": 2,
      "correct_answer": "25",
      "worked_solution": "Tarts left = 60 - 35 = 25 tarts."
    }
  ],
  "worked_solution": "See parts (a) and (b) above.",
  "examiner_note": "Show all working. Method marks are awarded even if the final answer is wrong."
}


═══════════════════════════════════════════════════════════════
TYPE 4: OPEN-ENDED — WRITTEN EXPLANATION (SCIENCE)
═══════════════════════════════════════════════════════════════

Used in: Science Booklet B (2-5 marks)

FORMAT:
  - Scenario-based question requiring written explanation
  - Student must use scientific keywords
  - Answer assessed on concept accuracy + keyword use
  - Student types in a text area
  - System shows model answer (not auto-graded)

ADDITIONAL JSON FIELDS:
  "keywords": ["string", ...] — required scientific keywords
  "model_answer": "string — the ideal answer for comparison"

DISPLAY RULES:
  - Show scenario + question
  - Show text area for student's answer
  - Show "See Model Answer" button
  - After reveal: show model answer + highlight keywords
  - DO NOT show A/B/C/D option cards
  - DO NOT show True/False buttons

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
  "question_text": "Ravi placed a cup of hot Milo on the kitchen table. After 30 minutes, the Milo was no longer hot.\n\nExplain why the temperature of the Milo decreased.",
  "keywords": ["heat", "flows", "hotter", "cooler", "surrounding air"],
  "model_answer": "The Milo was hotter than the surrounding air. Heat flows from a hotter object to a cooler object. Therefore, the Milo lost heat to the cooler surrounding air, causing its temperature to decrease.",
  "correct_answer": "Heat flows from the hotter Milo to the cooler surrounding air, causing its temperature to decrease.",
  "worked_solution": "Step 1: Identify temperatures — the Milo is hot, the air is cooler (room temperature).\n\nStep 2: Apply the key concept — heat flows from a hotter region to a cooler region.\n\nStep 3: The Milo loses heat to the air → its temperature drops.\n\nKey phrase: 'Heat flows from a hotter object to a cooler object.'",
  "examiner_note": "PSLE markers look for: (1) identify which is hotter, (2) state direction of heat flow, (3) link to temperature change. Must use the word 'heat' — saying 'cold enters the Milo' will lose marks."
}


═══════════════════════════════════════════════════════════════
TYPE 5: CLOZE — GRAMMAR CLOZE PASSAGE (ENGLISH)
═══════════════════════════════════════════════════════════════

Used in: English Paper 2 (Grammar Cloze section)

FORMAT:
  - A continuous passage with embedded bracketed numbers for blanks: [1], [2].
  - DO NOT put options inside the passage string.
  - Student selects one option per blank from a dropdown.

ADDITIONAL JSON FIELDS:
  "passage": "string — the full continuous text with embedded [1], [2] blanks.",
  "blanks": [
    {
      "number": 1,
      "options": ["string", "string", "string", "string"],
      "correct_answer": "string — exact correct option",
      "explanation": "string"
    }
  ]

DISPLAY RULES:
  - Show passage with highlighted numbered blanks
  - Below each blank: show 4 radio-button options
  - "Check Answers" button at the bottom
  - Highlight correct/wrong for each blank

SAMPLE — ENGLISH GRAMMAR CLOZE:

{
  "id": "p4-eng-cloze-001",
  "subject": "English",
  "level": "Primary 4",
  "topic": "Grammar",
  "sub_topic": "Grammar cloze",
  "difficulty": "Standard",
  "type": "cloze",
  "marks": 5,
  "question_text": "Fill in each blank with the most suitable word.",
  "passage": "Last Saturday, Mei Ling [1] to the library with her mother. She [2] looking for a book about dinosaurs. After searching for ten minutes, she [3] found one on the top shelf. Her mother helped her [4] it down. Mei Ling was so happy that she [5] her mother tightly.",
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
      "explanation": "Past continuous: 'She was looking' (singular subject + past tense)."
    },
    {
      "number": 3,
      "options": ["final", "finally", "finals", "finalise"],
      "correct_answer": "B",
      "explanation": "'Finally' is an adverb modifying 'found'. Adverbs modify verbs."
    },
    {
      "number": 4,
      "options": ["take", "takes", "took", "taking"],
      "correct_answer": "A",
      "explanation": "'Helped her take' — base form after 'helped someone [verb]'."
    },
    {
      "number": 5,
      "options": ["hug", "hugs", "hugged", "hugging"],
      "correct_answer": "C",
      "explanation": "Past tense to match the narrative: 'she hugged her mother'."
    }
  ],
  "worked_solution": "The passage is set in the past ('Last Saturday'), so most verbs should be in past tense. Check each blank: went, was, finally, take (base form after 'helped'), hugged.",
  "examiner_note": "In grammar cloze, read the WHOLE passage first to identify the tense before filling blanks."
}


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
  - If no error, student can write the same word or tick "correct"
  - "Check" button reveals answers

SAMPLE — ENGLISH EDITING:

{
  "id": "p4-eng-edit-001",
  "subject": "English",
  "level": "Primary 4",
  "topic": "Grammar",
  "sub_topic": "Editing",
  "difficulty": "Standard",
  "type": "editing",
  "marks": 4,
  "question_text": "Each underlined word may or may not contain an error. If there is an error, write the correct word. If there is no error, put a tick.",
  "passage_lines": [
    {
      "line_number": 1,
      "text": "Ahmad and his friends was playing football in the",
      "underlined_word": "was",
      "has_error": true,
      "correct_word": "were",
      "explanation": "'Ahmad and his friends' is a plural subject, so it should be 'were', not 'was'."
    },
    {
      "line_number": 2,
      "text": "school field yesterday. They was having so",
      "underlined_word": "having",
      "has_error": false,
      "correct_word": "having",
      "explanation": "'Having' is correct — past continuous: 'were having so much fun'."
    },
    {
      "line_number": 3,
      "text": "much fun that they did not realise it had",
      "underlined_word": "realise",
      "has_error": false,
      "correct_word": "realise",
      "explanation": "'Realise' is correct (British/Singapore spelling)."
    },
    {
      "line_number": 4,
      "text": "started raining. They quicklly ran to the shelter.",
      "underlined_word": "quicklly",
      "has_error": true,
      "correct_word": "quickly",
      "explanation": "'Quickly' has only one 'l'. This is a spelling error."
    }
  ],
  "worked_solution": "Line 1: 'was' → 'were' (plural subject needs plural verb).\nLine 2: 'having' ✓ (no error).\nLine 3: 'realise' ✓ (no error, correct SG spelling).\nLine 4: 'quicklly' → 'quickly' (spelling).",
  "examiner_note": "Read the whole passage first. Check: subject-verb agreement, tenses, spelling, articles, prepositions."
}


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
   type === "open_ended"    → show text area + "See Model Answer"
   type === "cloze"         → show passage with dropdown/radio per blank
   type === "editing"       → show passage with text input per underlined word

3. TRUE/FALSE BUTTONS:
   DO NOT show True/False buttons on ANY question type.
   There is no true/false question type. Remove these buttons entirely.

4. FRACTION DISPLAY:
   Fractions in option text MUST render as plain text.
   "7/12" should display as "7/12" — do not parse or split on "/".
   If rich rendering is desired later, use <sup>/<sub> tags,
   but NEVER break the string into separate elements.

5. AFTER ANSWERING (MCQ):
   - Correct option: green border + checkmark
   - Wrong option (selected): red border + X mark
   - Show the correct answer highlighted
   - Show "Worked Solution" section below
   - Show "Why [X] is wrong" for the option the student chose
   - Show "Next Question →" button

6. AFTER ANSWERING (short_ans):
   - If correct: green border, "✓ Correct!" message
   - If wrong: red border, "✗ Not quite. Correct answer: [X]"
   - Show worked solution below

7. PROGRESS:
   - Show progress bar: "Question 3 of 10"
   - Show topic + difficulty badges above the question
   - At end: show score screen with breakdown

═══════════════════════════════════════════════════════════════
FILE NAMING CONVENTION
═══════════════════════════════════════════════════════════════

Question bank files go in: data/questions/

Naming: {level}-{subject}-{topic}.json
Examples:
  p2-mathematics-whole-numbers.json
  p2-mathematics-fractions.json
  p2-english-grammar.json
  p2-english-vocabulary.json
  p2-english-comprehension.json
  p4-mathematics-fractions.json
  p4-mathematics-decimals.json
  p4-science-heat.json
  p4-science-light.json
  p4-science-matter.json
  p4-english-grammar.json
  p4-english-vocabulary.json
  p4-english-comprehension.json

Each file contains an array of question objects.
Minimum 20 questions per file.
Mix of difficulty: ~20% Foundation, ~50% Standard, ~20% Advanced, ~10% HOTS.

═══════════════════════════════════════════════════════════════
QUALITY CHECKLIST — EVERY QUESTION MUST PASS
═══════════════════════════════════════════════════════════════

□ Question has a real-world Singapore context (names, places, food)
□ All 4 MCQ options are plausible (no joke answers)
□ Science/English MCQ options are FULL SENTENCES (not fragments)
□ Maths options include the most common wrong answers students make
□ Worked solution has numbered steps (Step 1, Step 2, etc.)
□ Wrong explanations name the SPECIFIC misconception
□ Correct answer is mathematically/scientifically accurate (verified)
□ Fractions written as plain text with "/" (e.g., "7/12")
□ No spelling errors in any field
□ Difficulty label matches actual difficulty
□ Topic and sub_topic match MOE syllabus naming

═══════════════════════════════════════════════════════════════
END OF MASTER QUESTION TEMPLATE
═══════════════════════════════════════════════════════════════
