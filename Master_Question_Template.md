### SUPERHOLIC LAB — MASTER QUESTION TEMPLATE
### Version 4.3 | Source of truth for all Data Generation
### Reference: MOE/SEAB PSLE Exam Formats 2025-2026
### v4.3 changes (2026-04-30): rectangleDividedRightAngle §6 spec rewritten for v3 renderer — explicit `rays[].at_deg` + `arcs[].between/label` produce geometrically faithful diagrams. Legacy `angles[]` shape kept for backwards compat.
### v4.2 changes (2026-04-30): added Mathematics MCQ difficulty calibration in §5 anchored to PSLE 2024/2025 Booklet A Q1–Q15; standard-tier validation rules + benchmark questions.
### v4.1 changes: subject 'English Language' → 'English'; full canonical sub_topic taxonomy added; FK constraints + anti-hallucination rules.

═══════════════════════════════════════════════════════════════
SECTION 1: SYSTEM DIRECTIVES & AI PERSONA
═══════════════════════════════════════════════════════════════
When generating questions using this template, you are an Expert Singapore MOE Curriculum Developer generating data for a PostgreSQL database. 

**CONTEXT RULES:**
1. Use standard local Singaporean names (e.g., Siti, Sara, Rey, Stan, Jun Jie, Luke, Ravi, Ross, Michael, Alexa, Tim or other Singaporean name).
2. Use Singapore Dollars (SGD / $) for currency.
3. Tone must be precise, grammatically flawless, and strictly aligned with the MOE syllabus.

═══════════════════════════════════════════════════════════════
SECTION 2: TECHNICAL REQUIREMENTS & SUPABASE CONSTRAINTS
═══════════════════════════════════════════════════════════════
To ensure that generated data is valid, deployable, and avoids frontend crashes, YOU MUST STRICTLY FOLLOW THESE RULES:

1. **SQL Quote Escaping:** To escape a single quote in SQL, use EXACTLY TWO single quotes (`''`). NEVER use four quotes (`''''`) or backticks. 
   - *WRONG:* "Siti's" OR "Siti''''s"
   - *RIGHT:* "Siti''s"
2. **Stringified JSON:** Fields that store arrays or objects MUST be strictly stringified JSON when written in the SQL INSERT statement (e.g., `parts`, `options`, `visual_payload`, `accept_also`, `wrong_explanations`, `progressive_hints`, `keywords`, `blanks`). Do NOT use raw arrays in SQL.
3. **Valid HTML:** Use `<br><br>` for paragraph breaks instead of `\n` in `question_text`, `passage`, and `worked_solution`. Do not use markdown bold (`**`) inside these specific columns unless wrapped in proper HTML `<b>`.
4. **No Hallucinated Columns:** You may ONLY populate the exact columns listed in Section 3. Do not invent new columns.
5. **No Hallucinated Taxonomy:** `subject`, `topic`, and `sub_topic` MUST come from Section 4's canonical taxonomy. The database FK-enforces `subject` and `(subject, topic)` via `fk_question_bank_subject` and `fk_question_bank_topic`. `sub_topic` is API-validated against `canon_sub_topics`. INSERTs with off-canon values will fail with HTTP 422 / Postgres error 23503.

═══════════════════════════════════════════════════════════════
SECTION 3: DATABASE SCHEMA (question_bank fields)
═══════════════════════════════════════════════════════════════
* `id`: UUID (e.g., `gen_random_uuid()`)
* `seed_id`: UUID or `NULL`
* `is_ai_cloned`: Boolean (`true` or `false`)
* `subject`: Exactly 'Mathematics', 'Science', or 'English' (FK → `canon_subjects.subject`)
* `level`: Exactly 'Primary 1' through 'Primary 6'
* `topic`: Must exactly match the Taxonomy in Section 4
* `sub_topic`: A specific micro-concept of the topic (e.g., 'Improper Fractions', 'Model Drawing', 'Vocabulary').
* `difficulty`: 'Foundation', 'Standard', 'Advanced', or 'HOTS'
* `type`: Must exactly match one of the 8 core types in Section 5
* `marks`: Integer (1 to 5)
* `question_text`: String (SQL escaped)
* `options`: Stringified JSON Array (for MCQ)
* `correct_answer`: String
* `wrong_explanations`: Stringified JSON Object (for MCQ BKT tracking)
* `worked_solution`: String (MUST include step-by-step logic; cannot be null)
* `parts`: Stringified JSON Array (for multi-part questions)
* `keywords`: Stringified JSON Array (List of mandatory words for open-ended auto-grading)
* `model_answer`: String
* `passage`: String
* `passage_lines`: String or Boolean (Used to number paragraphs/lines for comprehension referencing)
* `blanks`: Stringified JSON Array (for Cloze/Editing)
* `examiner_note`: String (Used for tips, or Image Prompts for Visual Text)
* `progressive_hints`: Stringified JSON Array (Step-by-step scaffolding hints for students)
* `cognitive_skill`: MUST map strictly to MOE Assessment Objectives (See Cognitive Skill Mapping below)
* `image_url`: String (URL or `null`)
* `visual_payload`: Stringified JSON Object
* `instructions`: String
* `accept_also`: Stringified JSON Array (Alternative correct answers)
* `flag_review`: Boolean (Default `false`)
* `created_at`: Timestamp (e.g., `NOW()`)

**COGNITIVE SKILL MAPPING (AO):**
* **AO1 (Knowledge/Literal):** 'Factual Recall', 'Conceptual Understanding', or 'Literal Retrieval'
* **AO2 (Application/Inferential):** 'Routine Application', 'Inferential Reasoning', or 'Contextual Clues'
* **AO3 (Analysis/HOTS):** 'Non-Routine / Heuristics', 'Synthesis & Evaluation', or 'CER (Claim-Evidence-Reasoning)'

═══════════════════════════════════════════════════════════════
SECTION 4: THE CANONICAL TAXONOMY (FK-ENFORCED)
═══════════════════════════════════════════════════════════════

⚠️ **ANTI-HALLUCINATION RULES — READ BEFORE GENERATING**

1. Every question MUST use a `(subject, topic, sub_topic)` triple from the lists below.
2. `subject` and `(subject, topic)` are foreign-key-enforced at the database. INSERT will fail with PG error 23503 if mismatched.
3. `sub_topic` is API-validated against `canon_sub_topics` before INSERT. Hallucinated sub_topics are rejected with HTTP 422.
4. **NEVER** invent new subjects, topics, or sub_topics. If a question doesn't fit any canonical sub_topic listed below, REJECT generation — do NOT improvise a near-fit.
5. Live source of truth: tables `canon_subjects`, `canon_topics`, `canon_sub_topics` in Supabase. Query `canon_sub_topics` for the latest list at runtime.

---

**SUBJECT VALUES** (exact, case-sensitive):

| Slug (URL/code) | Database value | Allowed `type` values |
|-----------------|---------------|----------------------|
| `mathematics`   | `Mathematics` | `mcq`, `short_ans`, `word_problem` |
| `science`       | `Science`     | `mcq`, `open_ended` |
| `english`       | `English`     | `mcq`, `cloze`, `editing`, `comprehension`, `visual_text`, `short_ans` |

---

**MATHEMATICS — 23 topics, 103 sub_topics**

- **Whole Numbers**: Counting To One Hundred · Number Notation And Place Values · Comparing And Ordering Numbers · Patterns In Number Sequences · Rounding Numbers To The Nearest Ten, Hundred Or Thousand · Order Of Operations · Use Of Brackets
- **Multiplication Tables**: Multiplication Tables Of Two, Three, Four, Five And Ten · Multiplication Tables Of Six, Seven, Eight And Nine · Mental Calculation Involving Multiplication Within Tables
- **Addition and Subtraction**: Concepts Of Addition And Subtraction · Addition And Subtraction Within One Hundred · Addition And Subtraction Algorithms · Mental Calculation Involving Addition And Subtraction
- **Multiplication and Division**: Concepts Of Multiplication And Division · Multiplication And Division Algorithms · Division With Remainder · Multiplying And Dividing By Ten, One Hundred And One Thousand · Mental Calculation Involving Multiplication And Division
- **Fractions**: Fraction As Part Of A Whole · Equivalent Fractions · Comparing And Ordering Fractions · Mixed Numbers · Improper Fractions · Adding Unlike Fractions · Subtracting Unlike Fractions · Fractions Of A Set · Fraction Multiplied By Fraction · Division By A Proper Fraction
- **Decimals**: Notation And Place Values Of Decimals · Comparing And Ordering Decimals · Converting Fractions To Decimals · Converting Decimals To Fractions · Rounding Decimals · Four Operations With Decimals · Multiplying And Dividing Decimals By Ten, One Hundred And One Thousand
- **Percentage**: Expressing Part Of A Whole As Percentage · Finding Percentage Part Of A Whole · Discount, Goods And Services Tax And Annual Interest · Finding The Whole Given A Part And Percentage · Percentage Increase And Decrease
- **Ratio**: Part-Whole Ratio · Comparison Ratio · Equivalent Ratios · Expressing Ratio In Simplest Form · Dividing A Quantity In A Given Ratio · Ratio Of Three Quantities · Relationship Between Fraction And Ratio · Ratio Word Problems
- **Rate**: Rate As Amount Of Quantity Per Unit · Finding Rate, Total Amount Or Number Of Units
- **Speed**: Concepts Of Speed · Calculating Distance, Time And Speed · Average Speed
- **Average**: Average As Total Value Divided By Number Of Data · Relationship Between Average, Total Value And Number Of Data
- **Algebra**: Using A Letter To Represent An Unknown Number · Interpretation Of Algebraic Expressions · Simplifying Linear Expressions · Evaluating Linear Expressions By Substitution · Solving Simple Linear Equations
- **Angles**: Concepts Of Angle · Right Angles · Measuring Angles In Degrees · Drawing Angles · Angles On A Straight Line · Angles At A Point · Vertically Opposite Angles · Finding Unknown Angles
- **Geometry**: Perpendicular And Parallel Lines · Properties Of Rectangle And Square · Properties Of Triangles · Properties Of Parallelogram, Rhombus And Trapezium
- **Area and Perimeter**: Concepts Of Area And Perimeter · Area And Perimeter Of Rectangle And Square · Finding One Dimension Given Area Or Perimeter · Area And Perimeter Of Composite Rectilinear Figures
- **Area of Triangle**: Concepts Of Base And Height · Calculating Area Of Triangle · Area Of Composite Figures With Triangles
- **Circles**: Area And Circumference Of Circle · Area And Perimeter Of Semicircle And Quarter Circle · Area And Perimeter Of Composite Figures With Circles
- **Volume**: Building Solids With Unit Cubes · Measuring Volume In Cubic Units · Volume Of Cube And Cuboid · Finding Volume Of Liquid In Rectangular Tank · Finding Unknown Dimension Given Volume
- **Symmetry**: Identifying Symmetric Figures · Lines Of Symmetry · Completing Symmetric Figures
- **Shapes and Patterns**: Identifying And Naming Two-Dimensional Shapes · Classifying Three-Dimensional Shapes · Making Patterns With Two-Dimensional Shapes
- **Factors and Multiples**: Identifying Factors And Multiples · Finding Common Factors · Finding Common Multiples
- **Pie Charts**: Reading And Interpreting Pie Charts · Solving Problems Using Pie Chart Data
- **Data Analysis**: Reading Picture Graphs · Reading Bar Graphs · Reading Line Graphs · Reading Tables

---

**SCIENCE — 10 topics, 41 sub_topics**

- **Diversity**: General Characteristics Of Living And Non-Living Things · Classification Of Living And Non-Living Things · Diversity Of Materials And Their Properties
- **Matter**: States Of Matter · Properties Of Solids, Liquids And Gases · Changes In State Of Matter
- **Systems**: Plant Parts And Functions · Human Digestive System · Plant Respiratory And Circulatory Systems · Human Respiratory And Circulatory Systems · Electrical Systems And Circuits
- **Cycles**: Life Cycles Of Insects · Life Cycles Of Amphibians · Life Cycles Of Flowering Plants · Life Cycles Of Fungi · Reproduction In Plants And Animals · Stages Of The Water Cycle
- **Interactions**: Interaction Of Magnetic Forces · Interaction Of Frictional, Gravitational And Elastic Spring Forces · Interactions Within The Environment · Food Chains And Food Webs
- **Energy**: Light Energy Forms And Uses · Heat Energy Forms And Uses · Photosynthesis And Energy Pathways · Energy Conversion In Everyday Objects
- **Forces**: Push And Pull Forces · Effects Of Forces On Objects · Frictional Force And Its Applications · Gravitational Force · Elastic Spring Force
- **Heat**: Sources Of Heat · Effects Of Heat Gain And Heat Loss · Temperature And Use Of Thermometers · Good And Poor Conductors Of Heat
- **Light**: Sources Of Light · Reflection Of Light · Formation Of Shadows · Transparent, Translucent And Opaque Materials
- **Cells**: Plant And Animal Cells · Parts Of A Cell And Their Functions · Cell Division

---

**ENGLISH — 7 topics, 30 sub_topics**

- **Grammar**: Simple Present And Past Tenses · Perfect And Continuous Tenses · Subject-Verb Agreement · Singular And Plural Nouns · Prepositions And Phrasal Verbs · Conjunctions · Active And Passive Voice · Relative Pronouns
- **Vocabulary**: Thematic Vocabulary Recall · Contextual Vocabulary Meaning · Synonyms And Antonyms
- **Cloze**: Grammar Cloze With Word Bank · Vocabulary Cloze With Dropdowns · Comprehension Free-Text Cloze
- **Editing**: Correcting Spelling Errors · Correcting Grammatical Errors
- **Comprehension**: Direct Visual Retrieval · True Or False With Reason · Pronoun Referent Table · Sequencing Of Events · Deep Inference And Claim Evidence Reasoning
- **Synthesis**: Combining With Conjunctions · Relative Clauses · Participle Phrases · Conditional Sentences · Reported Speech Transformation · Active To Passive Voice Transformation · Inversion
- **Summary Writing**: Identifying Key Information · Paraphrasing And Condensing Text

---

**Level guidance** (which topics typically appear at which level — informational; not FK-enforced):

| Level | Mathematics | Science | English |
|-------|-------------|---------|---------|
| P1/P2 | Whole Numbers, Multiplication Tables, Addition and Subtraction, Shapes and Patterns | (no Science syllabus at this level) | Grammar, Vocabulary, Comprehension, Cloze |
| P3/P4 | + Multiplication and Division, Fractions, Decimals, Angles, Geometry, Area and Perimeter, Symmetry, Factors and Multiples, Data Analysis | Diversity, Matter, Cycles, Systems, Interactions, Heat, Light | + Editing, Synthesis |
| P5/P6 | + Percentage, Ratio, Rate, Speed, Average, Algebra, Area of Triangle, Circles, Volume, Pie Charts | + Energy, Forces, Cells | + Summary Writing |

---

**Cloze sub_topic mapping** (engine UI router):

When `topic = "Cloze"`, the canonical `sub_topic` controls UI behavior in `quiz.js`:

| `sub_topic` | UI behavior |
|-------------|------------|
| `Grammar Cloze With Word Bank` | Shared word-bank UI; same array injected into every blank's `options` field |
| `Vocabulary Cloze With Dropdowns` | Localized 4-option dropdowns per blank |
| `Comprehension Free-Text Cloze` | Free-text input boxes (omit the `options` key on each blank) |

═══════════════════════════════════════════════════════════════
SECTION 5: THE 8 CORE DATABASE SCHEMAS
═══════════════════════════════════════════════════════════════

---------------------------------------------------------------
1. TYPE: `mcq` (Mathematics, Science, English)
---------------------------------------------------------------
Requires exactly 4 options. Options must be full sentences for Science/English.

**Required Fields:**
- `type`: "mcq"
- `cognitive_skill`: Use the AO mapping defined in Section 2.
- `sub_topic`: MUST be a granular micro-concept (e.g., "Unit Cost", "Experimental Fairness", "Subject-Verb Agreement").
- `options`: `["Option A", "Option B", "Option C", "Option D"]`
- `correct_answer`: Must be one of the strings in `options`.
- `wrong_explanations`: MUST include a diagnostic `type` for BKT analysis.
  * *Format:* `{"Option A": {"text": "Explanation...", "type": "misconception | calc_error | partial_logic"}}`

**SCIENCE EXPERIMENTAL MCQS:**
- `visual_payload`: MUST include experimental variables if the question involves a setup.
  * *Example:* `{"function_name": "genericExperiment", "params": {"Setup A": "30ml water, black cloth", "Setup B": "30ml water, white cloth", "independent_variable": "color of cloth", "dependent_variable": "temperature change"}}`

**MATHEMATICS DIFFICULTY CALIBRATION (PSLE BENCHMARK):**

Authoritative reference: actual PSLE Booklet A papers in
`data/past_year_papers/P6_Primary6_PSLE/Maths/PSLE-standard-math-paper-1-2-questions-with-answers-{2024,2025}.pdf`.
Open the PDF and read Q11–Q15 before drafting any P6 Standard MCQ — those five
questions are the calibration touchstone. Drafts that feel materially easier
than Q11–Q15 are mis-tiered and must be re-labelled or rewritten.

| Difficulty | Marks | PSLE Map | Cognitive Load |
|---|---|---|---|
| Foundation | 1 | Booklet A Q1–Q10 | One concept, one step. Direct recall or single-operation computation. Small numbers (≤ 1000 or simple fractions/decimals). |
| Standard   | 2 | Booklet A Q11–Q15 | Multi-step (≥ 2 operations OR one heuristic + computation). PSLE-magnitude numbers (percentages of $XXX–$X,XXX, composite figures requiring at least one subtraction, ratios with quantities > 10, time spans crossing multiple hours, volumes built from unit cubes). May require diagram interpretation. |
| Advanced   | 2–3 | Paper 2 SAQ Q21–Q25 | Two heuristics chained (e.g. before/after + percentage; constant difference + ratio). 3+ operations. Question wording requires deliberate unpacking. |
| HOTS       | 3–5 | Paper 2 LAQ Q26–Q30 | Non-routine. Multiple representations needed (model + algebra, table + reasoning). Student must transfer or invent a method, not apply a memorised one. P5/P6 only. PSLE rarely delivers HOTS as MCQ — when we do, design distractors as four traps for distinct heuristic-misuse patterns. |

**STANDARD-TIER VALIDATION (auto-reject during Phase 5 if any condition is true):**

- Question is solvable in a single operation → re-tier to Foundation.
- Numbers smaller than PSLE Booklet A magnitudes (e.g. P6 Standard with sums under 100, single-digit fractions, no SGD context).
- Distractors are "near-by random numbers" rather than products of named, diagnosable misconceptions. Each `wrong_explanations[option].type` must map to an actual Singapore-classroom error mode (model-drawing slip, percentage-base confusion, area-vs-perimeter swap, unit conversion miss).
- The correct answer is derivable by elimination of the obviously absurd without performing the maths.
- Worked solution would be < 3 numbered steps for a Standard-tier MCQ.

**STANDARD-TIER BENCHMARK QUESTIONS (PSLE 2024 Booklet A — calibrate against these):**

- Q11 (Volume / Whole Numbers): "A solid is made up of 1-cm cubes. How many MORE 1-cm cubes are needed to build a cube of edge 4 cm?" — Two-step: count visible cubes (11) → subtract from 64 → 53.
- Q12 (Circles): "Find the perimeter of the shaded region: 2 quarter circles inside a 10-cm rectangle. (π = 3.14)." — Identify which arcs and edges form the perimeter → compute arc length → sum.
- Q13 (Time + Division): "30 ml of cough syrup, 5 ml every 3 hours, first dose at 4 a.m. — when is the last dose?" — # of doses = 30 ÷ 5 = 6 → elapsed = (6 − 1) × 3 = 15 h → 7 p.m.
- Q14 (Geometry / Nets): "Which of the following is NOT a net of a cube?" — Visual elimination across 4 candidate nets. Reasoning, not arithmetic.
- Q15 (Percentage cascade): "Lisa spent 20% on a blouse. She spent the rest on a skirt and a bracelet. The skirt cost $24 more than the blouse. The bracelet cost $72. Find the cost of the blouse." — Three-equation cascade: blouse = 0.2× total, total − blouse = (blouse + 24) + 72 → solve.

These five share a structural signature: realistic SG context, numbers that
demand actual calculation, distractors mapped to specific error modes, and a
worked solution of 3–5 named steps. Match that signature for any P6 Standard
MCQ generated by this platform.

---------------------------------------------------------------
2. TYPE: `short_ans` (Mathematics vs. English Synthesis)
---------------------------------------------------------------
This type behaves differently depending on the Subject.

**FOR MATHEMATICS:**
- `topic`: standard Math topic.
- `correct_answer`: A numerical or short string (e.g., "45" or "1/2").
- `accept_also`: `["0.5"]` (Alternative correct formats).
- `instructions`: `null`

**FOR ENGLISH (SYNTHESIS):**
- `topic`: MUST be "Synthesis"
- `question_text`: This column must contain ONLY the original sentences. DO NOT add `<br><br>`, blank lines, or the connector word here. Just the raw sentences.
- `correct_answer`: Grammatically perfect complete sentence (with full stop).
- `worked_solution`: You must provide a step-by-step logical breakdown. The final step **MUST ALWAYS BE STEP 3**, and it must explicitly state the final answer.
- `instructions`: You MUST provide the specific instruction with the connector/starter word wrapped in EXACT single quotes `''` to trigger the frontend UI engine. Do NOT use generic boilerplate.
   - *Mode 1 (Start):* "Rewrite the sentence beginning with the word ''Despite''."
   - *Mode 2 (Middle):* "Combine the sentences using the phrase ''... even though ...''." (DO NOT use brackets like `(whose)`. Always use dots).
   - *Mode 3 (End):* "Combine the sentences using the word ''... respectively.''."

---------------------------------------------------------------
3. TYPE: `word_problem` (Mathematics)
---------------------------------------------------------------
Used for Paper 2 structured multi-part problems.

**Required Fields:**
- `type`: "word_problem"
- `question_text`: The main scenario.
- `parts`: Stringified JSON array containing the sub-questions.
  `[{"label": "(a)", "marks": 2, "question": "...", "correct_answer": "...", "worked_solution": "..."}]`

---------------------------------------------------------------
4. TYPE: `open_ended` (Science)
---------------------------------------------------------------
Used for Booklet B Science conceptual explanations.

**Required Fields:**
- `type`: "open_ended"
- `question_text`: The main experiment/scenario.
- `parts`: Stringified JSON array containing sub-questions (a), (b), etc.
- `worked_solution` (Inside parts): MUST follow the MOE CER Framework (Claim, Evidence, Reasoning). 
  `[{"label": "(a)", "question": "Explain why...", "correct_answer": "...", "worked_solution": "Identify heat source, evaporation/condensation process...", "keywords": ["heat gain", "evaporate"]}]`

---------------------------------------------------------------
5. TYPE: `cloze` (English)
---------------------------------------------------------------
For all cloze formats, `topic` MUST be "Cloze". You MUST specify the `sub_topic` as "Grammar", "Vocabulary", or "Comprehension". The `passage` must contain embedded blanks like `[1]`, `[2]`.

**SUB-TOPIC: Grammar (Shared Word Bank)**
- `blanks` rules: You must create a shared Word Bank (Correct Answers + Distractors). You MUST inject this exact same full array into the `options` key of **every single blank**.
- *Primary 1 & 2:* Passage: 40-60 words. Blanks: 6. Word Bank: Total blanks + 2 distractors. Focus: Basic pronouns (he, she, it) and singular/plural nouns.
- *Primary 3 & 4:* Passage: 60-100 words. Blanks: 8. Word Bank: Total blanks + 2 distractors. Focus: Prepositions (in, on, at), conjunctions (but, although), phrasal verbs.
- *Primary 5 & 6:* Passage: 150-200 words. Blanks: EXACTLY 10. Word Bank: 12-15 words total. Focus: Advanced grammar, tenses, nuances (who vs whom, since vs for).
- *Format:* `[{"number": 1, "options": ["is", "are", "was", "were", ...all words], "correct_answer": "is", "explanation": "..."}]`

**SUB-TOPIC: Vocabulary (Localized Dropdowns)**
- `blanks` rules: Provide EXACTLY 4 specific options per blank to create inline dropdowns. (Digital Adaptation: While lower primary uses word banks in school, our platform uses localized dropdowns for a cleaner UI).
- *Primary 1 & 2:* Passage: 40-60 words. Blanks: 3. Focus: Simple thematic words (e.g., feelings, actions, "At the Zoo").
- *Primary 3 & 4:* Passage: 60-100 words. Blanks: 4. Focus: Standard vocabulary in a continuous story context.
- *Primary 5 & 6:* Passage: 120-150 words. Blanks: EXACTLY 5. Focus: SEAB Booklet A format. Advanced vocabulary; students pick the closest meaning for the context.
- *Format:* `[{"number": 1, "options": ["scurried", "strolled", "sprinted", "meandered"], "correct_answer": "sprinted", "explanation": "..."}]`

**SUB-TOPIC: Comprehension (Free-Text Typing)**
- `blanks` rules: You MUST entirely OMIT the `options` key. This forces a free-text input box. (Digital Adaptation: To build rigor, all levels use free-text, but lower levels use highly predictable context clues).
- *Primary 1 & 2:* Passage: 50-80 words. Blanks: 5. Focus: Basic story sequence and highly predictable, everyday sight words.
- *Primary 3 & 4:* Passage: 100-150 words. Blanks: 8. Focus: Transitioning to independent word recall using clear context clues.
- *Primary 5 & 6:* Passage: 200-250 words. Blanks: EXACTLY 15. Focus: SEAB Booklet B standard. Rely heavily on contextual clues, collocations, and logic. No word bank.
- *Format:* `[{"number": 1, "correct_answer": "because", "accept_also": ["as", "since"], "explanation": "..."}]`

---------------------------------------------------------------
6. TYPE: `editing` (English)
---------------------------------------------------------------
- `type`: "editing"
- `topic`: "Editing"
- `passage`: Continuous text. Errors MUST be single words (not phrases) wrapped in HTML `<u>` tags followed by the blank number. Example: "She <u>goed</u> [1] to the market."
- `blanks`: `[{"number": 1, "error_type": "grammar", "correct_answer": "went", "explanation": "Past tense of go."}]` (Note: `error_type` MUST be exactly "spelling" or "grammar").

**DIFFICULTY CALIBRATION & SCOPE (Strictly follow based on `level`):**
- **Primary 3 & 4 (Lower Block):**
  * *Passage:* 60-90 words. Generate EXACTLY 6 blanks (balanced evenly between spelling and grammar).
  * *Grammar Scope:* Simple present/past tense, basic subject-verb agreement, singular/plural nouns, and simple prepositions.
  * *Spelling Scope:* Common sight words, basic phonics (e.g., double consonants, dropping 'e').
- **Primary 5 & 6 (Upper Block):**
  * *Passage:* 120-180 words. Generate EXACTLY 10 blanks (balanced evenly between spelling and grammar).
  * *Grammar Scope:* Perfect/continuous tenses, passive voice, complex subject-verb agreement, and relative pronouns.
  * *Spelling Scope:* Advanced vocabulary, multi-syllabic words, and tricky prefixes/suffixes.

---------------------------------------------------------------
7. TYPE: `comprehension` (English)
---------------------------------------------------------------
A Split-Screen format used for Comprehension Open-Ended (and sometimes Comprehension MCQ). The left pane contains the text, and the right pane contains a `parts` array of sub-questions.

**Required Fields:**
- `type`: "comprehension"
- `topic`: "Comprehension"
- `passage`: The story/text. You MUST use `<br><br>` for paragraph breaks. DO NOT use `\n`.
- `parts`: Stringified JSON array of sub-questions. 

**PERMITTED `part_type` VALUES:**
1. `mcq`: Provide `options` (array of 4 strings) and `correct_answer`.
2. `text_box`: Provide `model_answer` and `rubric`.
3. `true_false`: Must include an `items` array. Each item needs `statement`, `correct_answer` ("True"/"False"), and `reason_evidence`.
4. `referent`: Table matching a pronoun to its subject. `items` array with `word` (e.g., "It (paragraph 2)") and `correct_answer`.
5. `sequencing`: Ordering events. `items` array of 3 string events. `correct_order` array (e.g., `[3, 1, 2]`).

**DIFFICULTY CALIBRATION & SCOPE (Strictly follow based on `level`):**

* **Primary 1 & 2 (Lower Block):**
    * *Passage:* 80-120 words. Simple narrative.
    * *Structure:* 5 marks total. Exactly 5 sub-questions (1 mark each).
    * *Part Types:* Mostly `mcq` to build confidence, ending with 1 or 2 simple `text_box` retrieval questions (e.g., "Where did Tom go?"). Do NOT use referent or sequencing.
* **Primary 3 & 4 (Middle Block):**
    * *Passage:* 150-250 words. Introduced to descriptive paragraphs.
    * *Structure (EOY):* 16 marks total.
    * *Part Types:* `mcq`, `text_box` (direct retrieval and basic inference). Introduce basic `true_false` tables (without the reason column).
* **Primary 5 & 6 (Upper Block / PSLE SEAB Code 0001):**
    * *Passage:* 350-450 words. Complex narrative with emotional beats, dialogue, and advanced vocabulary (e.g., *palpable, meticulously*).
    * *Structure:* Exactly 20 marks. Usually 8 to 10 sub-questions.
    * *Part Types Required:* You MUST include a diverse mix to hit 20 marks:
        - 1x `text_box` asking for a specific vocabulary word (1m).
        - 1x `referent` table (2 items, 2m).
        - 1x `sequencing` (3 items, 1m).
        - 1x `true_false` table WITH the `reason_evidence` column required (3 items, 3m).
        - Remaining marks distributed across 2m and 3m `text_box` questions requiring deep inference and the CER (Claim, Evidence, Reasoning) framework in the rubric.

---------------------------------------------------------------
8. TYPE: `visual_text` (English)
---------------------------------------------------------------
A sub-type of comprehension used for Section A of Paper 2. A Split-Screen format where the left pane displays a flyer/poster and the right pane contains MCQs.

**Required Fields:**
- `type`: "visual_text"
- `topic`: "Comprehension"
- `passage`: MUST BE `null`. (The text is inside the image).
- `image_url`: point to data/images/image_XXX.png`. (The developer will generate this later).
- `examiner_note`: **IMAGE PROMPT GENERATION:** You MUST write a highly detailed text-to-image prompt so the developer can generate the flyer using an AI image generator. Prefix it with `IMAGE PROMPT: `. 
  *(Example: "IMAGE PROMPT: A colourful flyer for a baking competition. Main header reads 'SG Junior Bakers'. Includes a box saying 'Free Registration' and a footnote with an asterisk saying 'Tools not provided'.")*
- `question_text`: "Study the visual text carefully and answer the following questions."
- `parts`: Stringified JSON array. ALL parts MUST be `part_type`: "mcq".

**DIFFICULTY CALIBRATION & SCOPE (Strictly follow based on `level`):**

* **Primary 1 & 2:**
    * *Structure:* 3 to 4 marks (3-4 MCQs, 1m each).
    * *Focus:* Direct visual retrieval. "What time does the party start?", "Where is the event?".
* **Primary 3 & 4:**
    * *Structure:* 5 marks (5 MCQs, 1m each).
    * *Focus:* Retrieving details from different sections of the flyer, basic purpose of the flyer.
* **Primary 5 & 6 (PSLE SEAB Code 0001):**
    * *Structure:* 5 marks (Booklet A standard) or 8 marks (School EOY standard). All 1m each.
    * *Focus:* Deep inference. Why was an asterisk (*) used? Who is the target audience? What is the *main* purpose of the event? Which statement is True/False based on the fine print?

═══════════════════════════════════════════════════════════════
SECTION 6: VISUAL PAYLOAD API (Math/Science Only)
═══════════════════════════════════════════════════════════════

**VISUAL PAYLOAD ENGINES (Math/Science Only):**
To generate a diagram, you MUST populate the `visual_payload` column with a stringified JSON object. 
The object MUST strictly follow this structure: 
`{"engine": "diagram-library", "function_name": "EXACT_NAME", "params": { ... }}`

You may ONLY use the following `function_name` values and their exact parameters. Do NOT hallucinate functions.

**--- 1. MATH: GEOMETRY & MEASUREMENT ---**
* `cuboid`: Draws a 3D tank. `{"length_label": "10cm", "breadth_label": "5cm", "height_label": "8cm", "water_level": 0.5}` (water_level is 0.0 to 1.0).
* `drawRectangleOnGrid`: `{"width_cm": 10, "length_cm": 5, "unit_grid_cm": 1, "labels": "PQRS"}`
* `polygon`: Draws an n-sided shape. `{"vertices": ["A","B","C","D"], "angle_to_measure": "ABC"}`
* `parallelogram`: `{"vertices": ["W","X","Y","Z"], "show_diagonals": true, "angle_arcs": [{"vertex": "W", "label": "60°"}]}`
* `rightAngleDivided` / `straightLineDividedAngles`: Draws intersecting angles. `{"lines": [{"start": "O", "end": "A"}, {"start": "O", "end": "B"}], "angles": ["45°", "y"], "vertices": ["X", "O", "Y"]}`
* `equilateralTriangle`: `{"side_length": 10, "unit": "cm", "count": 2}`
* `rulerMeasurement`: Extremely useful for PSLE length reading. `{"item": "Pencil", "unit": "cm", "min_value": 0, "max_value": 15, "start_reading": 2.5, "end_reading": 10.5, "major_interval": 1, "minor_interval": 0.1}`

**--- 2. MATH: DATA ANALYSIS & FRACTIONS ---**
* `pieChart`: `{"title": "Favourite Fruits", "data": [{"label": "Apples", "value": 40}, {"label": "Pears", "value": 60}]}`
* `lineGraph`: `{"title": "Temperature", "xLabel": "Time", "yLabel": "°C", "yMax": 40, "points": [{"xText": "8am", "yVal": 28}, {"xText": "9am", "yVal": 32}]}`
* `verticalBarChart`: `{"title": "Books Read", "xAxisLabel": "Month", "yAxisLabel": "Count", "data": [{"label": "Jan", "value": 15}, {"label": "Feb", "value": "covered"}]}` 
    *(PRO TIP: Use `"value": "covered"` to trigger the MOE "Ink Spill" question type where the student must calculate the hidden bar).*
* `pictogram`: `{"title": "Stickers", "items": [{"label": "Ali", "count": 12}], "keyValue": 4, "keySymbol": "★"}`
* `fractionBars`: `{"fractions": [{"numerator": 1, "denominator": 4}, {"numerator": 1, "denominator": 3}]}`
* `unitModel`: Renders proportional "Before and After" or "Internal Transfer" models. `{"unitModel": {"models": [{"label": "Before", "parts": [{"width": 40, "shaded": false, "label": "1u"}, {"width": 40, "shaded": true, "label": "Transfer"}]}]}}`

**--- 3. SCIENCE / GENERAL ---**
* `thermometer`: `{"minTemp": 0, "maxTemp": 100, "currentTemp": 37, "unit": "°C", "label": "Beaker A"}`
* `arrowDiagram`: Flow diagram for food chains, life cycles, classification trees, and food webs.
  Always use `"layout": "auto"` — the engine detects the correct layout from arrow structure.
  Food chain (auto → horizontal): `{"nodes": [{"id":"g","label":"Grass"},{"id":"r","label":"Rabbit"},{"id":"e","label":"Eagle"}], "arrows": [{"from":"g","to":"r"},{"from":"r","to":"e"}], "layout": "auto"}`
  Life cycle (auto → circular): `{"nodes": [{"id":"1","label":"Egg"},{"id":"2","label":"Larva"},{"id":"3","label":"Pupa"},{"id":"4","label":"Adult"}], "arrows": [{"from":"1","to":"2"},{"from":"2","to":"3"},{"from":"3","to":"4"},{"from":"4","to":"1"}], "layout": "auto"}`
  Food web / classification tree (auto → layered): `{"nodes": [{"id":"a","label":"Animals"},{"id":"v","label":"Vertebrates"},{"id":"i","label":"Invertebrates"}], "arrows": [{"from":"a","to":"v"},{"from":"a","to":"i"}], "layout": "auto"}`
  *(Do NOT set x/y coordinates on nodes. Do NOT specify layout unless overriding — auto is always correct.)*
* `table`: Renders a clean HTML table. `{"headers": ["Material", "Magnetic?"], "rows": [["Iron", "Yes"], ["Wood", "No"]]}`
* `genericExperiment`: ⚠️ LAST RESORT ONLY — use this ONLY when no specific function covers the setup (see --- 11. SCIENCE: EXPERIMENTS --- below). Renders a plain key-value info card; no actual visual diagram. `{"apparatus": "Syringe with plunger", "observation": "Air is compressible", "conclusion": "Gases can be compressed"}`
* `circuitDiagram`: Renders electrical circuits with MOE standardized symbols. `{"circuitDiagram": {"title": "Setup A", "components": [{"type": "battery"}, {"type": "switch", "isOpen": true}, {"type": "bulb", "position": "right", "fused": false}]}}`

**--- 4. MATH: GEOMETRY (Basic Shapes) ---**
* `rectangle`: Labelled rectangle with dimension arrows. Use for Area & Perimeter, Algebra (variable sides).
  `{"widthLabel": "12 cm", "heightLabel": "7 cm", "showNotToScale": true}`
* `square`: Calls rectangle with equal sides.
  `{"sideLabel": "9 cm"}`
* `circle`: Circle with optional radius or diameter line.
  `{"radiusLabel": "7 cm"}` OR `{"diameterLabel": "14 cm"}`
* `runningTrack`: Stadium-shape (two horizontal straights joined by two semicircular ends). Use for PSLE-style "perimeter / area of running track" questions in the Circles topic.
  `{"straight_length_label": "80 m", "diameter_label": "70 m"}`
  *(Optional `straight_label_position`: `"top"` (default) or `"inside"`.)*
* `rightTriangle`: Right-angled triangle with labelled base, height, and optional hypotenuse.
  `{"base": "8 cm", "height": "6 cm", "hypotenuse": "10 cm", "showRightAngle": true}`
* `compositeShape`: L-shape or T-shape built from rectangles. Use for composite area/perimeter problems.
  `{"parts": [{"x": 40, "y": 40, "w": 200, "h": 80, "shaded": true, "label": "A"}, {"x": 40, "y": 120, "w": 80, "h": 100, "shaded": true, "label": "B"}], "unit": "cm", "showNotToScale": true}`
  *(All coordinates are SVG pixel positions within a 400×260 viewBox. Scale your shapes accordingly.)*

**--- 5. MATH: ANGLES (Advanced Geometry) ---**
* `protractorMeasurement`: ⭐ NEW — Semicircular protractor with inner/outer scale and pointer arm.
  Standard (baseline at 0°): `{"angle_to_measure": 65, "pointer_label": "?", "show_inner_scale": true}`
  Non-zero baseline exam variant: `{"angle_to_measure": 50, "baseline_offset": 30, "pointer_label": "?"}`
  *(Use `baseline_offset` > 0 for questions where the object/angle does not start at the 0° mark.)*
* `rectangleDividedRightAngle`: Rectangle PQRS with two or more rays drawn from corner Q dividing the 90° corner angle into smaller named sub-angles. v3 renderer (2026-04-30) supports geometrically faithful ray placement.
  **Preferred (use this for new content):** specify each ray's exact angle so the diagram matches the question text.
  ```
  {
    "vertices": ["P","Q","R","S"],
    "rays": [
      { "name": "T", "at_deg": 68 },                       // T at 68° from +x axis (= 22° from QP, since QP is 90°)
      { "name": "U", "from_side": "QR", "rotate_deg": 35 } // OR rotate from a side toward interior
    ],
    "arcs": [
      { "between": ["P","T"], "label": "22°" },           // angle ∠PQT, label drawn at bisector
      { "between": ["T","U"], "label": "?" },             // unknown angle marker
      { "between": ["U","R"], "label": "35°" }            // angle ∠UQR
    ]
  }
  ```
  **Geometry rule:** in `at_deg`, 0° = direction of QR (right), 90° = direction of QP (up). For an angle ∠PQX of value θ, set `at_deg = 90 − θ`. For ∠XQR of value θ, set `at_deg = θ`.
  **Legacy (still supported, but rays land at hard-coded fallback positions — use only for old rows):** `{"vertices": ["P","Q","R","S"], "angles": [{"name": "PQT", "value": "22°"}, {"name": "TQU", "value": "?"}]}`
* `dividedStraightLineAngle`: A straight line divided by one intersecting ray showing two named angles.
  `{"vertices": ["A","O","B","C"], "angles": [{"label": "40°"}, {"label": "?"}]}`

**--- 6. MATH: NUMBER & FRACTIONS ---**
* `numberLine`: Horizontal number line with optional marked dots and highlight arcs.
  Basic: `{"start": 0, "end": 10, "marked": [3, 7]}`
  With highlight arc: `{"start": 0, "end": 12, "marked": [4], "highlight": [{"from": 0, "to": 4}]}`
  With custom tick labels (fractions/decimals): `{"start": 0, "end": 1, "labels": [{"value": 0, "text": "0"}, {"value": 0.5, "text": "½"}, {"value": 1, "text": "1"}]}`
* `fractionBar`: A single fraction bar (simpler than `fractionBars`). Use for one-fraction MCQ questions.
  `{"numerator": 3, "denominator": 4, "showLabel": true}`

**--- 7. MATH: DATA ANALYSIS (Alternatives) ---**
* `barChart`: Pure SVG bar chart. Simpler API than `verticalBarChart`; preferred for MCQ diagrams.
  `{"title": "Books Read", "xLabel": "Month", "yLabel": "Number", "bars": [{"label": "Jan", "value": 8}, {"label": "Feb", "value": 12}]}`
  *(Use `verticalBarChart` when you need the "ink spill" covered-bar question type.)*
* `horizontalBarChart`: Horizontal bar variant. Use for P3/P4 data questions with long category names.
  `{"title": "Favourite Sports", "bars": [{"label": "Swimming", "value": 15}, {"label": "Football", "value": 22}]}`
* `dataTable`: HTML table using CSS variables (preferred over `table` for CSS-var support).
  `{"headers": ["Material", "Magnetic?", "Conductor?"], "rows": [["Iron", "Yes", "Yes"], ["Wood", "No", "No"]]}`
  *(Use `highlightCol` (0-indexed integer) to highlight a specific column in rose colour.)*

**--- 8. MATH: GEOMETRY (Solid Figures) ---**
* `isometricGrid`: ⭐ NEW — Dual-mode: 3D isometric view OR orthographic 3-panel projection.
  `cubes_arrangement` is a 2D array where each cell = number of cubes stacked at [row][col]. Row 0 = front.

  Isometric (3D view): `{"mode": "isometric", "cubes_arrangement": [[2,1,0],[1,3,1],[0,1,2]]}`
  Orthographic (Top/Front/Side panels): `{"mode": "orthographic", "cubes_arrangement": [[2,1,0],[1,3,1],[0,1,2]]}`
  Highlight specific cubes: `{"mode": "isometric", "cubes_arrangement": [[2,1],[1,2]], "highlight_cubes": [{"row": 0, "col": 0, "layer": 1}]}`

  *(Hidden-blocks questions: use `mode: "orthographic"` — students must deduce maximum cubes from the 2D views.)*

**--- 9. SCIENCE: CONCEPTUAL ---**
* `conceptMap`: Concept web with labelled nodes and directional edges. Use for Science classification/relationship questions.
  `{"nodes": [{"id": "a", "label": "Living Things", "x": 50, "y": 20}, {"id": "b", "label": "Plants", "x": 25, "y": 70}, {"id": "c", "label": "Animals", "x": 75, "y": 70}], "edges": [{"from": "a", "to": "b"}, {"from": "a", "to": "c"}]}`
  *(Note: `conceptMap` uses `edges` not `arrows`. `x` and `y` are percentages (0–100) of the viewBox.)*

**--- 10. UTILITY ---**
* `placeholder`: Grey dashed box with centred description. Use when no specific diagram function applies (e.g., complex anatomy, apparatus cross-sections).
  `{"description": "Diagram of the human heart showing four chambers and major blood vessels."}`

---

**--- 11. SCIENCE: EXPERIMENTS ---**
* `comparativeSetup`: ⭐ Side-by-side A/B experiment panels with SVG container silhouette.
  Use for: Heat (cloth colour), Light (shadow), Matter (states comparison), P5 Cycles (condensation), P6 Forces (surface friction comparison).
  `containerType`: `"beaker"` | `"test_tube"` | `"flask"` | `"box"`
  ```json
  {"title": "Heat Absorption", "variable": "Colour of cloth", "containerType": "beaker",
   "setups": [
     {"label": "Setup A", "conditions": ["Black cloth", "30 ml water", "Sunny spot"], "result_label": "Temperature after 1 hour:"},
     {"label": "Setup B", "conditions": ["White cloth", "30 ml water", "Sunny spot"], "result_label": "Temperature after 1 hour:"}
   ],
   "commonConditions": ["Same beaker size", "Same starting temperature"]}
  ```
  *(Up to 3 setups. `result_label` adds an answer underline at the bottom of each panel.)*

* `magnetDiagram`: ⭐ MOE-schematic magnet drawing.
  `magnetType`: `"bar"` | `"horseshoe"` | `"electromagnet"`
  Single bar magnet: `{"magnetType": "bar", "magnets": [{"poles": ["N", "S"]}]}`
  Two-magnet repulsion (N facing N): `{"magnetType": "bar", "magnets": [{"poles": ["S","N"]}, {"poles": ["N","S"]}], "interaction": "repulsion"}`
  Two-magnet attraction (N facing S): `{"magnetType": "bar", "magnets": [{"poles": ["S","N"]}, {"poles": ["S","N"]}], "interaction": "attraction"}`
  Horseshoe: `{"magnetType": "horseshoe", "magnets": [{"poles": ["N", "S"]}]}`
  Electromagnet: `{"magnetType": "electromagnet", "coreMaterial": "iron", "coilsCount": 5, "batteryCount": 1}`
  *(N pole = red, S pole = blue per MOE convention. Requires `--color-magnet-N` and `--color-magnet-S` CSS vars.)*

* `rampExperiment`: ⭐ Inclined plane with block, surface texture, and force arrows.
  `surfaceTexture`: `"smooth"` | `"rough"` | `"sandpaper"` | `"glass"`
  `forceArrows[].direction`: `"down"` (weight) | `"up_slope"` (friction) | `"down_slope"` | `"normal"` | `"left"` | `"right"`
  `springState`: `"none"` | `"compressed"` | `"extended"`
  ```json
  {"rampAngle": 30, "surfaceTexture": "rough", "blockLabel": "Block",
   "showAngleLabel": true,
   "forceArrows": [
     {"direction": "down",     "label": "Weight"},
     {"direction": "up_slope", "label": "Friction"},
     {"direction": "normal",   "label": "Normal force"}
   ]}
  ```

---

**⚠️ CORRECTION — `lineGraph` params:**
The `points` array uses `{x, y}` format (NOT the old `{xText, yVal}` format).
Both formats are accepted for backward compatibility, but the correct format is:

Numeric x-axis: `{"points": [{"x": 0, "y": 28}, {"x": 1, "y": 32}, {"x": 2, "y": 30}]}`
Categorical x-axis (string labels): `{"points": [{"x": "8 am", "y": 28}, {"x": "9 am", "y": 32}]}`
Legacy format (still works): `{"points": [{"xText": "8 am", "yVal": 28}]}`

**⚠️ NOTE — `table` vs `dataTable`:**
Both render HTML tables. `dataTable` uses CSS variables and is preferred. `table` uses Tailwind classes and is the legacy name. Both are valid in `visual_payload`.

═══════════════════════════════════════════════════════════════
SECTION 7: DIAGRAM ROUTING MAP — TOPIC → FUNCTION LOOKUP
═══════════════════════════════════════════════════════════════

MANDATORY RULE: Before choosing a `function_name` for any Maths or
Science question, look up the topic in this map FIRST.
ONLY use functions listed for that topic.
If the topic is not listed, set `visual_payload` to NULL.
NEVER invent a function name not present in Section 6.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MATHEMATICS ROUTING MAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

── P1 ──────────────────────────────────────────────────────────

| Topic                | Use Function          | Condition / Notes                                      |
|----------------------|-----------------------|--------------------------------------------------------|
| Whole Numbers        | `numberLine`          | Ordering, comparing, sequences on a number line        |
| Addition/Subtraction | `numberLine`          | "Jump" strategy visualisation only; omit for text-only |
| Multiplication/Division | NULL               | No diagram required for basic tables                   |
| Money                | NULL                  | Text-based questions only                              |
| Length and Mass      | `rulerMeasurement`    | Any question requiring a measurement reading           |
| Shapes and Patterns  | `rectangle` / `square` / `circle` | Identifying or describing shapes          |
| Picture Graphs       | `pictogram`           | Always use; set `keyValue` to the scale shown          |

── P2 ──────────────────────────────────────────────────────────

| Topic                | Use Function          | Condition / Notes                                      |
|----------------------|-----------------------|--------------------------------------------------------|
| Whole Numbers        | `numberLine`          | Number patterns, placing values on a line              |
| Fractions            | `fractionBar`         | Visualise ½, ¼, ¾ as a single shaded bar               |
| Length/Mass/Volume   | `rulerMeasurement`    | Scale reading questions                                |
| Shapes               | `rectangle` / `square` / `circle` | Naming and comparing shapes              |
| Picture Graphs       | `pictogram`           | Always; include `keySymbol` and `keyValue`             |

── P3 ──────────────────────────────────────────────────────────

| Topic                | Use Function           | Condition / Notes                                     |
|----------------------|------------------------|-------------------------------------------------------|
| Whole Numbers        | `numberLine`           | Number sequences or ordering only                     |
| Fractions            | `fractionBars`         | Equivalent fractions, comparison, addition            |
| Length/Mass/Volume   | `rulerMeasurement`     | All measurement reading questions                     |
| Time                 | NULL                   | Clock-face diagrams not supported; omit visual        |
| **Angles**           | `protractorMeasurement`| ⭐ Use for ALL angle measuring questions              |
|                      |                        | `baseline_offset: 0` → standard; `> 0` → non-zero baseline |
| Area and Perimeter   | `rectangle`            | Rectangle shapes                                      |
|                      | `square`               | Square shapes                                         |
|                      | `compositeShape`       | L-shapes, T-shapes, rectilinear figures               |
| Bar Graphs           | `verticalBarChart`     | Always use `verticalBarChart` for P3/P4 bar graphs    |
|                      |                        | Use `"value": "covered"` for the ink-spill question type |

── P4 ──────────────────────────────────────────────────────────

| Topic                | Use Function                   | Condition / Notes                                 |
|----------------------|--------------------------------|---------------------------------------------------|
| Whole Numbers        | NULL                           | Large-number operations, text-only                |
| Factors and Multiples| NULL                           | Factor trees not in library; text only            |
| Fractions            | `fractionBars`                 | Comparison, equivalent fractions, addition        |
| Decimals             | `numberLine`                   | Placing decimals, ordering on a line              |
| **Angles (basic)**   | `protractorMeasurement`        | Reading a protractor; measuring given angles      |
| **Angles (advanced)**| `rightAngleDivided`            | Angles divided by rays within a right angle       |
|                      | `straightLineDividedAngles`    | Angles on a straight line (sum = 180°)            |
|                      | `rectangleDividedRightAngle`   | Rectangle with diagonal forming labelled angles   |
|                      | `dividedStraightLineAngle`     | Straight line with one intersecting arm           |
| Area and Perimeter   | `rectangle` / `square`        | Standard shapes                                   |
|                      | `rightTriangle`                | Triangle area questions                           |
|                      | `compositeShape`               | Composite rectilinear figures                     |
|                      | `drawRectangleOnGrid`          | Grid-based area problems with labelled corners    |
| Symmetry             | `drawRectangleOnGrid`          | Shape on grid with axis of symmetry shown         |
| Data Analysis        | `verticalBarChart`             | Bar graph questions (include ink-spill where set) |
|                      | `lineGraph`                    | Line graph / trend questions                      |
|                      | `dataTable`                    | Tabulated data comparison                         |

── P5 ──────────────────────────────────────────────────────────

| Topic                | Use Function           | Condition / Notes                                     |
|----------------------|------------------------|-------------------------------------------------------|
| Fractions            | `fractionBars`         | Comparison and mixed-number visualisation             |
| Decimals             | `numberLine`           | Ordering decimals or placing on a line                |
| **Percentage**       | `pieChart`             | "What percentage of the whole" circular problems      |
| **Ratio**            | `unitModel`            | Before-and-after, constant-part, internal-transfer models |
| **Rate**             | `lineGraph`            | Distance-time or speed-time trend questions           |
| Area of Triangle     | `rightTriangle`        | Right-angled triangle; include hypotenuse if asked    |
|                      | `compositeShape`       | Composite shapes with shaded triangular regions       |
| **Volume**           | `cuboid`               | 3D tank; set `water_level` (0.0–1.0) for liquid problems |
| **Angles and Geometry** | `parallelogram`    | Rhombus, parallelogram with diagonals shown           |
|                      | `polygon`              | General polygon with vertex labels; mark angle to measure |
|                      | `equilateralTriangle`  | Equal-sided triangle(s); set `count` for multiple     |
|                      | `rightAngleDivided`    | Angles in a right angle                               |
|                      | `straightLineDividedAngles` | Angles on a straight line                       |
| Average              | `verticalBarChart`     | Showing data bars with average line for context       |

── P6 ──────────────────────────────────────────────────────────

| Topic                | Use Function           | Condition / Notes                                     |
|----------------------|------------------------|-------------------------------------------------------|
| Fractions            | `fractionBars`         | Complex comparison or multi-step problems             |
| Percentage           | `pieChart`             | Circular proportion problems                          |
| Ratio                | `unitModel`            | Complex before-and-after, unequal-units models        |
| **Speed**            | `lineGraph`            | Distance-time graphs; use categorical x for time labels |
| **Algebra**          | `rectangle`            | Rectangle with variable side labels (e.g., "x+3 cm") |
| **Circles**          | `circle`               | Use `radiusLabel` OR `diameterLabel` (not both)       |
| Volume               | `cuboid`               | 3D tank; before-and-after water level (two diagrams)  |
| **Geometry (general)** | `polygon`            | Complex polygons with multiple angle labels           |
|                      | `parallelogram`        | Rhombus and parallelogram angle properties            |
|                      | `compositeShape`       | Shaded/unshaded composite area figures                |
| **Geometry (Solid Figures)** | `isometricGrid` | Use `mode: "isometric"` for 3D view questions     |
|                      |                        | Use `mode: "orthographic"` for Top/Front/Side view questions |
|                      |                        | Use `highlight_cubes` to mark specific cubes in rose  |
| Pie Charts           | `pieChart`             | Always; AI must sum `data.value` to the correct total |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCIENCE ROUTING MAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

── P3 ──────────────────────────────────────────────────────────

| Topic        | Use Function       | Condition / Notes                                            |
|--------------|--------------------|--------------------------------------------------------------|
| Diversity    | `arrowDiagram`     | Classification tree: nodes = groups, arrows = characteristics |
|              | `dataTable`        | Comparing features across organisms (rows = organisms)       |
|              |                    | Set `hasFaultyNode: true` in params for misconception MCQs   |
| Systems      | `arrowDiagram`     | Parts-and-function flow (e.g., digestive stages)             |
|              | `genericExperiment`| Experimental setups; pass key variables as object params     |
| Interactions | `arrowDiagram`     | Food chain: nodes = organisms, arrows = energy direction     |

── P4 ──────────────────────────────────────────────────────────

| Topic        | Use Function        | Condition / Notes                                           |
|--------------|---------------------|-------------------------------------------------------------|
| Cycles       | `arrowDiagram`      | Life cycles: nodes = stages, arrows = direction of time     |
|              |                     | Use `"layout": "auto"` — detects circular/horizontal automatically |
|              |                     | Do NOT set node x/y coordinates; auto-layout handles spacing |
| Energy       | `genericExperiment` | General energy experiment setups                            |
| **Heat**     | `thermometer`       | Temperature reading; set `minTemp`, `maxTemp`, `currentTemp`|
|              | `comparativeSetup`  | ⭐ Comparing heat absorption setups (e.g., black vs white cloth) |
|              |                     | Use `containerType: "beaker"`, `variable: "colour of cloth"` |
| Light        | `comparativeSetup`  | ⭐ Shadow/transparency A/B comparisons; use `containerType: "box"` |
|              | `genericExperiment` | Single-setup light experiments (no A/B comparison needed)  |
| **Magnets**  | `magnetDiagram`     | ⭐ ALL magnet questions: bar, horseshoe, electromagnet       |
|              |                     | Set `interaction: "repulsion"` or `"attraction"` for 2-magnet setups |
|              |                     | Set `magnetType: "electromagnet"` + `coreMaterial` for P4 coil questions |
| Matter       | `comparativeSetup`  | ⭐ A/B comparisons (e.g., syringe compressed vs extended)   |
|              | `dataTable`         | Comparing properties of solids, liquids, gases              |
|              | `genericExperiment` | Single-setup matter experiments (no A/B comparison)        |

── P5 ──────────────────────────────────────────────────────────

| Topic        | Use Function        | Condition / Notes                                           |
|--------------|---------------------|-------------------------------------------------------------|
| Cycles       | `arrowDiagram`      | Water cycle stages as a flow diagram; use `"layout": "auto"`|
|              | `comparativeSetup`  | ⭐ Condensation/evaporation A/B setups (e.g., cold vs warm surface) |
|              | `genericExperiment` | Single-setup evaporation/condensation (no A/B comparison)  |
| Systems      | `dataTable`         | Comparing body systems (e.g., xylem vs phloem table)        |
|              | `genericExperiment` | Any system with labelled experimental conditions            |
| **Energy**   | `circuitDiagram`    | ⭐ Use ONLY for electrical circuit questions               |
|              |                     | Set `circuitArrangement: "series"` or `"parallel"`         |
|              |                     | Set `fusedBulbs: [index]` for fused-bulb deduction questions|
|              | `comparativeSetup`  | ⭐ Non-circuit energy comparisons (e.g., insulation A vs B) |
| Interactions | `arrowDiagram`      | Food webs: multiple nodes connected by energy-flow arrows   |
|              |                     | For faulty food web MCQs, include a misplaced arrow in nodes/arrows |

── P6 ──────────────────────────────────────────────────────────

| Topic        | Use Function        | Condition / Notes                                           |
|--------------|---------------------|-------------------------------------------------------------|
| Interactions | `arrowDiagram`      | Complex food web with producers + multiple consumer levels  |
|              |                     | Ensure at least one producer node is always present         |
| Energy       | `circuitDiagram`    | Complex series/parallel with switch states and fused bulbs  |
|              | `rampExperiment`    | ⭐ Friction/ramp energy experiments (inclined plane)        |
|              | `comparativeSetup`  | Non-ramp energy A/B comparisons                             |
| Cells        | `dataTable`         | Plant cell vs animal cell feature comparison                |
|              | `genericExperiment` | Microscope/experiment setups (no specific function covers this) |
| Forces       | `rampExperiment`    | ⭐ ALL inclined plane questions: angle, texture, force arrows |
|              |                     | Set `surfaceTexture: "rough"/"sandpaper"` for friction questions |
|              |                     | Add `forceArrows` for Weight, Friction, Normal force labels |
|              | `comparativeSetup`  | Side-by-side comparisons (e.g., rough vs smooth surface)   |
|              | `genericExperiment` | Non-ramp Forces setups only (e.g., spring balance, pulley) |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — HARD RULES (apply these after looking up the table above)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NEVER use `arrowDiagram` for electrical circuits. ALWAYS use `circuitDiagram`.
2. NEVER use `circuitDiagram` for food chains. ALWAYS use `arrowDiagram`.
3. NEVER use `lineGraph` for bar graph topics. ALWAYS use `verticalBarChart`.
4. For Science experiments in the routing map above: use the SPECIFIC function listed
   (`comparativeSetup`, `magnetDiagram`, `rampExperiment`). ONLY fall back to
   `genericExperiment` when no specific function applies (e.g., pulley, microscope).
5. If a Maths question is entirely computational with no spatial component,
   set `visual_payload` to NULL. Do NOT force a diagram on a text-only question.
6. `isometricGrid` is the ONLY permitted function for Solid Figures questions.
   Do NOT use `cuboid` for flat-grid arrangements. `cuboid` is for 3D TANK/VOLUME questions only.
7. For P3/P4 Angles questions, ALWAYS include `protractorMeasurement`. Do NOT use
   `polygon` or `parallelogram` for angle-reading questions at P3/P4 level.
8. `pieChart` is for CIRCULAR proportion diagrams only. Do NOT use it for bar graphs
   labelled as "pie" in the question — use `verticalBarChart` instead.
9. For ALL magnet questions (bar, horseshoe, electromagnet, poles), ALWAYS use
   `magnetDiagram`. Do NOT use `genericExperiment` for P4 Magnets topic.
10. For ALL inclined plane / ramp experiments, ALWAYS use `rampExperiment`. Set
    `forceArrows` to label Weight, Friction, and Normal force as required by the question.
11. `comparativeSetup` is the ONLY permitted function for A/B experiment comparisons
    where two setups differ by one variable. NEVER use `genericExperiment` for A/B setups.
12. For `arrowDiagram`, ALWAYS set `"layout": "auto"`. Do NOT set x/y coordinates on
    nodes. Do NOT hardcode a layout mode unless the question explicitly requires it.

═══════════════════════════════════════════════════════════════
SECTION 8: DIFFICULTY CALIBRATION GUIDE
═══════════════════════════════════════════════════════════════

**MANDATORY:** Before tagging the `difficulty` column, walk through this rubric. Tag the LOWEST band the question qualifies for. When in doubt between two bands, choose the lower. **HOTS must be earned, not defaulted to.**

---------------------------------------------------------------
8.1 Universal definitions (apply to all subjects)
---------------------------------------------------------------

| Band | Cognitive Skill (AO) | Steps to solve | Vocabulary | Context | Target % of bank |
|---|---|---|---|---|---|
| **Foundation** | AO1 only — recall / direct retrieval | 1 step | At or below grade level | Familiar, textbook-standard | **20%** |
| **Standard** | AO1 → AO2 — recall + 1 application | 2–3 steps | At grade level | Familiar with one twist | **50%** |
| **Advanced** | AO2 → light AO3 — apply + analyse | 3–4 steps | At/above grade level | Some unfamiliar phrasing or distractors | **20%** |
| **HOTS** | Pure AO3 — analyse + synthesise + evaluate | 4+ steps OR novel reasoning required | Above grade level | Novel context, abstract, or counter-intuitive | **10%** |

**Reality check after generating a batch (≥10 questions):** If the HOTS share exceeds 30%, re-tag the easier half down to Advanced or Standard. If Foundation < 15%, the batch lacks entry-point questions — flag for review.

---------------------------------------------------------------
8.2 The "earn HOTS" gate
---------------------------------------------------------------

A question qualifies as HOTS only if it satisfies **BOTH**:
- (a) Cognitive complexity ≥ 4 distinct operations, OR requires reasoning across two topics, OR demands a non-routine heuristic, AND
- (b) Novel context, advanced vocabulary, or a counter-intuitive answer.

If only one condition is met → **Advanced**, not HOTS.

---------------------------------------------------------------
8.3 Anti-default rules (to break the "everything is HOTS" failure mode)
---------------------------------------------------------------

- A question solvable by a **single named MOE heuristic** (bar model, before-after, "respectively", SVA rule) → **Standard at most**.
- A question with **one transformation step** and **familiar vocabulary** → **Foundation**.
- Hard vocabulary alone does not qualify HOTS — it shifts the band up by *one* only.
- Long question text alone does not qualify HOTS — count cognitive operations, not words.
- "Had it not been for [noun phrase]" → **Advanced**, not HOTS, unless it also requires nominalisation of a verb phrase + tense shift.
- Standalone subject-verb agreement, tense shift, or basic pronoun questions → **Foundation**, never higher.
- 1-mark MCQs are rarely HOTS. Default such rows to Standard unless the cognitive complexity is provably AO3.

---------------------------------------------------------------
8.4 Per-subject anchors
---------------------------------------------------------------

**MATHEMATICS**

| Band | Marker | Example |
|---|---|---|
| Foundation | 1-step computation, single-digit operations, formula given or implied | "What is 3/4 + 1/4?" |
| Standard | 2-step problem, single bar model, one unit conversion | "Ahmad has 60 tarts. He gives 1/3 away. How many left?" |
| Advanced | 3+ step model drawing, percentage-of-percentage, ratio with constant part | "20% of A = 30% of B. A:B = ?" |
| HOTS | Working backwards, internal-transfer ratio, multi-stage before-after-after, untruthful witness logic | "After Ali gives 1/4 of his stickers to Bala then receives 5 from Chen, he has 25. He had 1/3 fewer than Bala originally. Find Bala's original count." |

**SCIENCE**

| Band | Marker | Example |
|---|---|---|
| Foundation | Name a part, define a term, literal recall | "Name three states of matter." |
| Standard | Identify + brief explain (one concept) | "Why is the metal spoon hotter than the plastic spoon?" |
| Advanced | Full CER (Claim, Evidence, Reasoning), identify variables, fair-test reasoning | "Setup A and B differ in cloth colour. Predict the temperature difference and justify." |
| HOTS | Predict + justify across two topics, design-your-own-experiment, counter-intuitive prediction | "Plants in sealed jars die. Predict whether a candle inside survives longer with or without a plant. Justify using two concepts." |

**ENGLISH — Synthesis & Transformation**

| Band | Marker | Example connector / pattern |
|---|---|---|
| Foundation | One mechanical connector, no nominalisation | `and`, `but`, `because`, `when`, `who`, `whose`, `although`, `even though`, `respectively`, `too…to`, `while` |
| Standard | One transformation (active↔passive, tense shift, gerund conversion, SVA correction) | "Despite + gerund", "Having + past participle", reported speech (1 tense shift) |
| Advanced | Nominalisation + restructure (adjective→noun + clause merge) | "Out of [noun]…", "Such was [noun] that…", "Much to the [noun] of…" |
| HOTS | Subjunctive conditional, emphatic cleft, multi-clause inversion, double tense shift | "Had it not been for…", "It was [noun] that…", "Hardly had X when Y", "No sooner had X than Y", "Not until X did Y" |

**ENGLISH — Cloze / Editing / Comprehension**

| Band | Cloze | Editing | Comprehension |
|---|---|---|---|
| Foundation | Common phrasal verbs, basic prepositions | SVA, simple tense, common spelling | 1m direct retrieval ("Where did Tom go?") |
| Standard | Tense agreement, common collocations | Past tense irregulars, plural agreement | 1m inference from one paragraph |
| Advanced | Register-aware vocab, conditional connectives | Subjunctive forms, advanced spelling | 2m CER from 2+ paragraphs |
| HOTS | Stylistic register choice, idiomatic phrase | Multi-error trap, register-shift correction | 3m author's purpose, theme, irony |

---------------------------------------------------------------
8.5 Distribution targets per generation batch
---------------------------------------------------------------

When generating ≥10 questions in a single call, the AI MUST respect approximately:

```
Foundation : 20%   (e.g. 2 of 10)
Standard   : 50%   (e.g. 5 of 10)
Advanced   : 20%   (e.g. 2 of 10)
HOTS       : 10%   (e.g. 1 of 10)
```

A batch with >30% HOTS or <15% Foundation must be self-corrected before output.

═══════════════════════════════════════════════════════════════
FINAL QUALITY CHECKLIST BEFORE OUTPUT
═══════════════════════════════════════════════════════════════
1. Did I double-escape all SQL quotes (`''`)?
2. Are all JSON fields (`visual_payload`, `parts`, `options`, `wrong_explanations`) perfectly stringified for PostgreSQL?
3. Did I use exactly one of the permitted `function_name` strings in my `visual_payload`?
4. If this is an English Synthesis question, did I provide a `worked_solution` and use dots (`...`) for middle connectors?
5. Did I walk through SECTION 8 and tag the LOWEST qualifying band? Is the batch's HOTS share ≤ 30% and Foundation share ≥ 15%?
5. If this is an English Visual Text question, is `image_url` set to `null` and the prompt placed in `examiner_note`?