# Canonical Taxonomy (FK-Enforced)

> Loaded by every router invocation. Defines the valid `(level, subject, topic, sub_topic)`
> quadruples that pass the database FK constraint `fk_qb_level_topic`.
> Off-canon values fail with PG error 23503.

⚠️ **ANTI-HALLUCINATION RULES — READ BEFORE GENERATING**

1. Every question MUST use a `(level, subject, topic, sub_topic)` quadruple from the lists below.
2. `subject` and `(subject, topic)` are foreign-key-enforced at the database. INSERT will fail with PG error 23503 if mismatched.
3. `sub_topic` is API-validated against `canon_sub_topics` before INSERT. Hallucinated sub_topics are rejected with HTTP 422.
4. `(level, subject, topic, sub_topic)` is foreign-key-enforced against `canon_level_topics`. INSERTs with off-level quadruples (e.g., generating Algebra at Primary 3) will fail with PG error 23503.
5. **NEVER** invent new subjects, topics, or sub_topics. If a question doesn't fit any canonical sub_topic listed below, REJECT generation — do NOT improvise a near-fit.
6. Live source of truth: tables `canon_subjects`, `canon_topics`, `canon_sub_topics`, `canon_level_topics` in Supabase. Query at runtime — never rely on memory or older versions of this template.

**MANDATORY GENERATION WORKFLOW:**
 
```
Step 0 — DEDUPLICATION: read existing question IDs for the target
         (level, subject, topic, sub_topic). Skip if MANIFEST flags saturation.
 
Step 1 — TAXONOMY LOOKUP:
         SELECT topic, sub_topic
         FROM canon_level_topics
         WHERE level = $level AND subject = $subject;
 
Step 2 — Pick a (topic, sub_topic) ONLY from the result set.
         Never invent. Never copy from older question files. Never rely on memory.
 
Step 3 — Generate question content using the type file (under types/) +
         _calibration.md for difficulty.
 
Step 4 — INSERT into question_bank. DB rejects if any field drifted off-canon.
```

---

**SUBJECT VALUES** (exact, case-sensitive):
 
| Slug (URL/code) | Database value | Allowed `type` values |
|-----------------|---------------|----------------------|
| `mathematics`   | `Mathematics` | `mcq`, `short_ans`, `word_problem` |
| `science`       | `Science`     | `mcq`, `open_ended` |
| `english`       | `English`     | `mcq`, `cloze`, `editing`, `comprehension`, `visual_text`, `short_ans` |

---

**MATHEMATICS — 26 topics, 130 sub_topics**
 
- **Whole Numbers**: Counting To One Hundred · Number Notation And Place Values · Comparing And Ordering Numbers · Patterns In Number Sequences · Rounding Numbers To The Nearest Ten, Hundred Or Thousand · Order Of Operations · Use Of Brackets
- **Multiplication Tables**: Multiplication Tables Of Two, Three, Four, Five And Ten · Multiplication Tables Of Six, Seven, Eight And Nine · Mental Calculation Involving Multiplication Within Tables
- **Addition and Subtraction**: Concepts Of Addition And Subtraction · Addition And Subtraction Within One Hundred · Addition And Subtraction Algorithms · Mental Calculation Involving Addition And Subtraction
- **Multiplication and Division**: Concepts Of Multiplication And Division · Multiplication And Division Algorithms · Division With Remainder · Multiplying And Dividing By Ten, One Hundred And One Thousand · Mental Calculation Involving Multiplication And Division
- **Money**: Counting Amount Of Money · Reading And Writing Money In Decimal Notation · Comparing Amounts Of Money · Converting Money Between Decimal And Cents · Adding And Subtracting Money In Decimal Notation · Word Problems Involving Money
- **Length and Mass**: Measuring Length In Centimetres And Metres · Measuring Length In Kilometres · Measuring Mass In Grams And Kilograms · Comparing And Ordering Lengths And Masses · Converting Compound Units To Smaller Unit · Word Problems Involving Length And Mass
- **Volume of Liquid**: Measuring Volume In Litres · Measuring Volume In Millilitres · Comparing And Ordering Volumes · Converting Litres And Millilitres · Word Problems Involving Volume
- **Time**: Telling Time To Five Minutes · Telling Time To The Minute · Use Of Am And Pm · Measuring Time In Hours And Minutes · Measuring Time In Seconds · Twenty-Four Hour Clock · Finding Starting Time, Finishing Time Or Duration · Word Problems Involving Time
- **Fractions**: Fraction As Part Of A Whole · Equivalent Fractions · Comparing And Ordering Fractions · Mixed Numbers · Improper Fractions · Adding Unlike Fractions · Subtracting Unlike Fractions · Fractions Of A Set · Fraction Multiplied By Fraction · Division By A Proper Fraction
- **Decimals**: Notation And Place Values Of Decimals · Comparing And Ordering Decimals · Converting Fractions To Decimals · Converting Decimals To Fractions · Rounding Decimals · Four Operations With Decimals · Multiplying And Dividing Decimals By Ten, One Hundred And One Thousand
- **Percentage**: Expressing Part Of A Whole As Percentage · Finding Percentage Part Of A Whole · Discount, Goods And Services Tax And Annual Interest · Finding The Whole Given A Part And Percentage · Percentage Increase And Decrease
- **Ratio**: Part-Whole Ratio · Comparison Ratio · Equivalent Ratios · Expressing Ratio In Simplest Form · Dividing A Quantity In A Given Ratio · Ratio Of Three Quantities · Relationship Between Fraction And Ratio · Ratio Word Problems
- **Rate**: Rate As Amount Of Quantity Per Unit · Finding Rate, Total Amount Or Number Of Units
- **Average**: Average As Total Value Divided By Number Of Data · Relationship Between Average, Total Value And Number Of Data
- **Algebra**: Using A Letter To Represent An Unknown Number · Interpretation Of Algebraic Expressions · Simplifying Linear Expressions · Evaluating Linear Expressions By Substitution · Solving Simple Linear Equations
- **Angles**: Concepts Of Angle · Right Angles · Measuring Angles In Degrees · Drawing Angles · Angles On A Straight Line · Angles At A Point · Vertically Opposite Angles · Finding Unknown Angles
- **Geometry**: Perpendicular And Parallel Lines · Properties Of Rectangle And Square · Properties Of Triangles · Properties Of Parallelogram, Rhombus And Trapezium · Identifying Two-Dimensional Representations Of Solids · Drawing Two-Dimensional Representations Of Solids · Identifying Nets Of Three-Dimensional Solids
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
 
**SCIENCE — 6 topics, 41 sub_topics**
 
- **Diversity**: General Characteristics Of Living And Non-Living Things · Classification Of Living And Non-Living Things · Diversity Of Materials And Their Properties
- **Matter**: States Of Matter · Properties Of Solids, Liquids And Gases · Changes In State Of Matter
- **Cycles**: Life Cycles Of Insects · Life Cycles Of Amphibians · Life Cycles Of Flowering Plants · Reproduction In Plants And Animals · Stages Of The Water Cycle
- **Systems**: Plant Parts And Functions · Human Digestive System · Plant Respiratory And Circulatory Systems · Human Respiratory And Circulatory Systems · Electrical Systems And Circuits
- **Energy**: Sources Of Light · Reflection Of Light · Formation Of Shadows · Transparent, Translucent And Opaque Materials · Sources Of Heat · Effects Of Heat Gain And Heat Loss · Temperature And Use Of Thermometers · Good And Poor Conductors Of Heat · Photosynthesis And Energy Pathways · Energy Conversion In Everyday Objects
- **Interactions**: Interaction Of Magnetic Forces · Frictional Force · Gravitational Force · Elastic Spring Force · Effects Of Forces On Objects · Interactions Within The Environment · Food Chains And Food Webs
---
 
**ENGLISH — 6 topics, 30 sub_topics**
 
- **Grammar**: Simple Present And Past Tenses · Perfect And Continuous Tenses · Subject-Verb Agreement · Singular And Plural Nouns · Prepositions And Phrasal Verbs · Conjunctions · Active And Passive Voice · Relative Pronouns
- **Vocabulary**: Thematic Vocabulary Recall · Contextual Vocabulary Meaning · Synonyms And Antonyms
- **Cloze**: Grammar Cloze With Word Bank · Vocabulary Cloze With Dropdowns · Comprehension Free-Text Cloze
- **Editing**: Correcting Spelling Errors · Correcting Grammatical Errors
- **Comprehension**: Direct Visual Retrieval · True Or False With Reason · Pronoun Referent Table · Sequencing Of Events · Deep Inference And Claim Evidence Reasoning · Visual Text Literal Retrieval · Visual Text Inference And Purpose
- **Synthesis**: Combining With Conjunctions · Relative Clauses · Participle Phrases · Conditional Sentences · Reported Speech Transformation · Active To Passive Voice Transformation · Inversion
---

**Level guidance** (FK-ENFORCED via `canon_level_topics` — INSERTs off this map fail with PG error 23503):
 
| Level | Mathematics | Science | English |
|-------|-------------|---------|---------|
| P1    | Whole Numbers, Addition and Subtraction, Multiplication and Division, Multiplication Tables, Money, Length and Mass, Time, Shapes and Patterns, Data Analysis | (no Science syllabus) | Grammar, Vocabulary, Cloze, Comprehension |
| P2    | + Fractions, Volume of Liquid | (no Science syllabus) | (same as P1) |
| P3    | + Angles, Geometry, Area and Perimeter | Diversity, Cycles, Interactions | + Editing |
| P4    | + Decimals, Factors and Multiples, Symmetry, Pie Charts (reading) | + Systems, Matter, Energy | + Synthesis |
| P5    | + Percentage, Rate, Average, Area of Triangle, Volume | (Cycles, Systems only) | Visual Text added as Comprehension sub_topics |
| P6    | + Ratio, Algebra, Circles, Pie Charts (problem-solving) | + Energy (P6 — photosynthesis), Interactions (P6 — forces, environment) | (PSLE — full set) |

**v5.0 changes (2026-05-01):**
- ADDED Maths topics: Money, Length and Mass, Volume of Liquid, Time
- ADDED English Visual Text sub_topics under Comprehension (P5+)
- ADDED Geometry sub_topics: Identifying/Drawing 2D Representations, Nets (P4)
- REMOVED Maths topic: Speed (P6 dropped — not in 2021 syllabus)
- REMOVED Science topics: Heat, Light, Forces, Cells (folded into Energy/Interactions/Systems per 2023 syllabus)
