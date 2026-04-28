-- ============================================================
-- 021_canon_taxonomy_and_fk_constraints.sql
-- Establishes a 3-table canonical reference hierarchy and adds FK
-- constraints on question_bank to prevent AI hallucination of new
-- subjects/topics.
--
-- Background:
-- After C-1 (naming harmonisation) the platform's subject + topic strings
-- were canonical across DB and code, but nothing prevented future drift.
-- This migration moves the canon into FK-enforced tables.
--
-- Three reference tables:
--   canon_subjects   (subject)                                — 3 rows
--   canon_topics     (subject, topic)                          — 40 rows
--   canon_sub_topics (subject, topic, sub_topic)               — 174 rows
--
-- Source of truth for canon content: lib/api/quest-pedagogy.js
-- SYLLABUS_DEPENDENCIES (mirrors NotebookLM analysis of MOE/SEAB
-- primary syllabus PDFs).
--
-- Constraints added to question_bank:
--   fk_question_bank_subject  — subject → canon_subjects.subject
--   fk_question_bank_topic    — (subject, topic) → canon_topics(subject, topic)
--
-- Sub_topic FK is intentionally NOT added — historical question_bank.sub_topic
-- has ~250 fragmented variants. API-layer validation (handlers.js) enforces
-- the canon for new INSERTs. Sub_topic harmonisation + FK is a separate pass.
--
-- Pre-migration data fix:
--   18 mislabeled rows had subject='Mathematics' but Science topics
--   (Cycles/Energy/Systems). All P4-P5 Science questions, mislabeled at
--   generation. Step 1 below relabels them to subject='Science'.
-- ============================================================

-- ─── Step 1: Repair mislabeled rows (Mathematics → Science) ──────────────
UPDATE question_bank
   SET subject = 'Science'
 WHERE subject = 'Mathematics'
   AND topic IN ('Cycles', 'Energy', 'Systems');

-- ─── Step 2: Canonical reference tables ──────────────────────────────────
CREATE TABLE IF NOT EXISTS canon_subjects (
  subject text PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS canon_topics (
  subject text NOT NULL REFERENCES canon_subjects(subject) ON UPDATE CASCADE,
  topic   text NOT NULL,
  PRIMARY KEY (subject, topic)
);

CREATE TABLE IF NOT EXISTS canon_sub_topics (
  subject   text NOT NULL,
  topic     text NOT NULL,
  sub_topic text NOT NULL,
  PRIMARY KEY (subject, topic, sub_topic),
  FOREIGN KEY (subject, topic) REFERENCES canon_topics(subject, topic) ON UPDATE CASCADE
);

-- ─── Step 3: RLS — public read, service-role write ──────────────────────
ALTER TABLE canon_subjects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE canon_topics     ENABLE ROW LEVEL SECURITY;
ALTER TABLE canon_sub_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS canon_subjects_read   ON canon_subjects;
DROP POLICY IF EXISTS canon_topics_read     ON canon_topics;
DROP POLICY IF EXISTS canon_sub_topics_read ON canon_sub_topics;

CREATE POLICY canon_subjects_read   ON canon_subjects   FOR SELECT USING (true);
CREATE POLICY canon_topics_read     ON canon_topics     FOR SELECT USING (true);
CREATE POLICY canon_sub_topics_read ON canon_sub_topics FOR SELECT USING (true);

-- ─── Step 4: Seed canon_subjects ─────────────────────────────────────────
INSERT INTO canon_subjects (subject) VALUES
  ('Mathematics'), ('Science'), ('English')
ON CONFLICT DO NOTHING;

-- ─── Step 5: Seed canon_topics (40 rows) ─────────────────────────────────
INSERT INTO canon_topics (subject, topic) VALUES
  -- Mathematics (23)
  ('Mathematics', 'Whole Numbers'),
  ('Mathematics', 'Multiplication Tables'),
  ('Mathematics', 'Addition and Subtraction'),
  ('Mathematics', 'Multiplication and Division'),
  ('Mathematics', 'Fractions'),
  ('Mathematics', 'Decimals'),
  ('Mathematics', 'Percentage'),
  ('Mathematics', 'Ratio'),
  ('Mathematics', 'Rate'),
  ('Mathematics', 'Speed'),
  ('Mathematics', 'Average'),
  ('Mathematics', 'Algebra'),
  ('Mathematics', 'Angles'),
  ('Mathematics', 'Geometry'),
  ('Mathematics', 'Area and Perimeter'),
  ('Mathematics', 'Area of Triangle'),
  ('Mathematics', 'Circles'),
  ('Mathematics', 'Volume'),
  ('Mathematics', 'Symmetry'),
  ('Mathematics', 'Shapes and Patterns'),
  ('Mathematics', 'Factors and Multiples'),
  ('Mathematics', 'Pie Charts'),
  ('Mathematics', 'Data Analysis'),
  -- Science (10)
  ('Science', 'Diversity'),
  ('Science', 'Matter'),
  ('Science', 'Systems'),
  ('Science', 'Cycles'),
  ('Science', 'Interactions'),
  ('Science', 'Energy'),
  ('Science', 'Forces'),
  ('Science', 'Heat'),
  ('Science', 'Light'),
  ('Science', 'Cells'),
  -- English (7)
  ('English', 'Grammar'),
  ('English', 'Vocabulary'),
  ('English', 'Cloze'),
  ('English', 'Editing'),
  ('English', 'Comprehension'),
  ('English', 'Synthesis'),
  ('English', 'Summary Writing')
ON CONFLICT DO NOTHING;

-- ─── Step 6: Seed canon_sub_topics (174 rows) ────────────────────────────
INSERT INTO canon_sub_topics (subject, topic, sub_topic) VALUES
  -- Mathematics > Whole Numbers (7)
  ('Mathematics', 'Whole Numbers', 'Counting To One Hundred'),
  ('Mathematics', 'Whole Numbers', 'Number Notation And Place Values'),
  ('Mathematics', 'Whole Numbers', 'Comparing And Ordering Numbers'),
  ('Mathematics', 'Whole Numbers', 'Patterns In Number Sequences'),
  ('Mathematics', 'Whole Numbers', 'Rounding Numbers To The Nearest Ten, Hundred Or Thousand'),
  ('Mathematics', 'Whole Numbers', 'Order Of Operations'),
  ('Mathematics', 'Whole Numbers', 'Use Of Brackets'),
  -- Mathematics > Multiplication Tables (3)
  ('Mathematics', 'Multiplication Tables', 'Multiplication Tables Of Two, Three, Four, Five And Ten'),
  ('Mathematics', 'Multiplication Tables', 'Multiplication Tables Of Six, Seven, Eight And Nine'),
  ('Mathematics', 'Multiplication Tables', 'Mental Calculation Involving Multiplication Within Tables'),
  -- Mathematics > Addition and Subtraction (4)
  ('Mathematics', 'Addition and Subtraction', 'Concepts Of Addition And Subtraction'),
  ('Mathematics', 'Addition and Subtraction', 'Addition And Subtraction Within One Hundred'),
  ('Mathematics', 'Addition and Subtraction', 'Addition And Subtraction Algorithms'),
  ('Mathematics', 'Addition and Subtraction', 'Mental Calculation Involving Addition And Subtraction'),
  -- Mathematics > Multiplication and Division (5)
  ('Mathematics', 'Multiplication and Division', 'Concepts Of Multiplication And Division'),
  ('Mathematics', 'Multiplication and Division', 'Multiplication And Division Algorithms'),
  ('Mathematics', 'Multiplication and Division', 'Division With Remainder'),
  ('Mathematics', 'Multiplication and Division', 'Multiplying And Dividing By Ten, One Hundred And One Thousand'),
  ('Mathematics', 'Multiplication and Division', 'Mental Calculation Involving Multiplication And Division'),
  -- Mathematics > Fractions (10)
  ('Mathematics', 'Fractions', 'Fraction As Part Of A Whole'),
  ('Mathematics', 'Fractions', 'Equivalent Fractions'),
  ('Mathematics', 'Fractions', 'Comparing And Ordering Fractions'),
  ('Mathematics', 'Fractions', 'Mixed Numbers'),
  ('Mathematics', 'Fractions', 'Improper Fractions'),
  ('Mathematics', 'Fractions', 'Adding Unlike Fractions'),
  ('Mathematics', 'Fractions', 'Subtracting Unlike Fractions'),
  ('Mathematics', 'Fractions', 'Fractions Of A Set'),
  ('Mathematics', 'Fractions', 'Fraction Multiplied By Fraction'),
  ('Mathematics', 'Fractions', 'Division By A Proper Fraction'),
  -- Mathematics > Decimals (7)
  ('Mathematics', 'Decimals', 'Notation And Place Values Of Decimals'),
  ('Mathematics', 'Decimals', 'Comparing And Ordering Decimals'),
  ('Mathematics', 'Decimals', 'Converting Fractions To Decimals'),
  ('Mathematics', 'Decimals', 'Converting Decimals To Fractions'),
  ('Mathematics', 'Decimals', 'Rounding Decimals'),
  ('Mathematics', 'Decimals', 'Four Operations With Decimals'),
  ('Mathematics', 'Decimals', 'Multiplying And Dividing Decimals By Ten, One Hundred And One Thousand'),
  -- Mathematics > Percentage (5)
  ('Mathematics', 'Percentage', 'Expressing Part Of A Whole As Percentage'),
  ('Mathematics', 'Percentage', 'Finding Percentage Part Of A Whole'),
  ('Mathematics', 'Percentage', 'Discount, Goods And Services Tax And Annual Interest'),
  ('Mathematics', 'Percentage', 'Finding The Whole Given A Part And Percentage'),
  ('Mathematics', 'Percentage', 'Percentage Increase And Decrease'),
  -- Mathematics > Ratio (8)
  ('Mathematics', 'Ratio', 'Part-Whole Ratio'),
  ('Mathematics', 'Ratio', 'Comparison Ratio'),
  ('Mathematics', 'Ratio', 'Equivalent Ratios'),
  ('Mathematics', 'Ratio', 'Expressing Ratio In Simplest Form'),
  ('Mathematics', 'Ratio', 'Dividing A Quantity In A Given Ratio'),
  ('Mathematics', 'Ratio', 'Ratio Of Three Quantities'),
  ('Mathematics', 'Ratio', 'Relationship Between Fraction And Ratio'),
  ('Mathematics', 'Ratio', 'Ratio Word Problems'),
  -- Mathematics > Rate (2)
  ('Mathematics', 'Rate', 'Rate As Amount Of Quantity Per Unit'),
  ('Mathematics', 'Rate', 'Finding Rate, Total Amount Or Number Of Units'),
  -- Mathematics > Speed (3)
  ('Mathematics', 'Speed', 'Concepts Of Speed'),
  ('Mathematics', 'Speed', 'Calculating Distance, Time And Speed'),
  ('Mathematics', 'Speed', 'Average Speed'),
  -- Mathematics > Average (2)
  ('Mathematics', 'Average', 'Average As Total Value Divided By Number Of Data'),
  ('Mathematics', 'Average', 'Relationship Between Average, Total Value And Number Of Data'),
  -- Mathematics > Algebra (5)
  ('Mathematics', 'Algebra', 'Using A Letter To Represent An Unknown Number'),
  ('Mathematics', 'Algebra', 'Interpretation Of Algebraic Expressions'),
  ('Mathematics', 'Algebra', 'Simplifying Linear Expressions'),
  ('Mathematics', 'Algebra', 'Evaluating Linear Expressions By Substitution'),
  ('Mathematics', 'Algebra', 'Solving Simple Linear Equations'),
  -- Mathematics > Angles (8)
  ('Mathematics', 'Angles', 'Concepts Of Angle'),
  ('Mathematics', 'Angles', 'Right Angles'),
  ('Mathematics', 'Angles', 'Measuring Angles In Degrees'),
  ('Mathematics', 'Angles', 'Drawing Angles'),
  ('Mathematics', 'Angles', 'Angles On A Straight Line'),
  ('Mathematics', 'Angles', 'Angles At A Point'),
  ('Mathematics', 'Angles', 'Vertically Opposite Angles'),
  ('Mathematics', 'Angles', 'Finding Unknown Angles'),
  -- Mathematics > Geometry (4)
  ('Mathematics', 'Geometry', 'Perpendicular And Parallel Lines'),
  ('Mathematics', 'Geometry', 'Properties Of Rectangle And Square'),
  ('Mathematics', 'Geometry', 'Properties Of Triangles'),
  ('Mathematics', 'Geometry', 'Properties Of Parallelogram, Rhombus And Trapezium'),
  -- Mathematics > Area and Perimeter (4)
  ('Mathematics', 'Area and Perimeter', 'Concepts Of Area And Perimeter'),
  ('Mathematics', 'Area and Perimeter', 'Area And Perimeter Of Rectangle And Square'),
  ('Mathematics', 'Area and Perimeter', 'Finding One Dimension Given Area Or Perimeter'),
  ('Mathematics', 'Area and Perimeter', 'Area And Perimeter Of Composite Rectilinear Figures'),
  -- Mathematics > Area of Triangle (3)
  ('Mathematics', 'Area of Triangle', 'Concepts Of Base And Height'),
  ('Mathematics', 'Area of Triangle', 'Calculating Area Of Triangle'),
  ('Mathematics', 'Area of Triangle', 'Area Of Composite Figures With Triangles'),
  -- Mathematics > Circles (3)
  ('Mathematics', 'Circles', 'Area And Circumference Of Circle'),
  ('Mathematics', 'Circles', 'Area And Perimeter Of Semicircle And Quarter Circle'),
  ('Mathematics', 'Circles', 'Area And Perimeter Of Composite Figures With Circles'),
  -- Mathematics > Volume (5)
  ('Mathematics', 'Volume', 'Building Solids With Unit Cubes'),
  ('Mathematics', 'Volume', 'Measuring Volume In Cubic Units'),
  ('Mathematics', 'Volume', 'Volume Of Cube And Cuboid'),
  ('Mathematics', 'Volume', 'Finding Volume Of Liquid In Rectangular Tank'),
  ('Mathematics', 'Volume', 'Finding Unknown Dimension Given Volume'),
  -- Mathematics > Symmetry (3)
  ('Mathematics', 'Symmetry', 'Identifying Symmetric Figures'),
  ('Mathematics', 'Symmetry', 'Lines Of Symmetry'),
  ('Mathematics', 'Symmetry', 'Completing Symmetric Figures'),
  -- Mathematics > Shapes and Patterns (3)
  ('Mathematics', 'Shapes and Patterns', 'Identifying And Naming Two-Dimensional Shapes'),
  ('Mathematics', 'Shapes and Patterns', 'Classifying Three-Dimensional Shapes'),
  ('Mathematics', 'Shapes and Patterns', 'Making Patterns With Two-Dimensional Shapes'),
  -- Mathematics > Factors and Multiples (3)
  ('Mathematics', 'Factors and Multiples', 'Identifying Factors And Multiples'),
  ('Mathematics', 'Factors and Multiples', 'Finding Common Factors'),
  ('Mathematics', 'Factors and Multiples', 'Finding Common Multiples'),
  -- Mathematics > Pie Charts (2)
  ('Mathematics', 'Pie Charts', 'Reading And Interpreting Pie Charts'),
  ('Mathematics', 'Pie Charts', 'Solving Problems Using Pie Chart Data'),
  -- Mathematics > Data Analysis (4)
  ('Mathematics', 'Data Analysis', 'Reading Picture Graphs'),
  ('Mathematics', 'Data Analysis', 'Reading Bar Graphs'),
  ('Mathematics', 'Data Analysis', 'Reading Line Graphs'),
  ('Mathematics', 'Data Analysis', 'Reading Tables'),

  -- Science > Diversity (3)
  ('Science', 'Diversity', 'General Characteristics Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Diversity Of Materials And Their Properties'),
  -- Science > Matter (3)
  ('Science', 'Matter', 'States Of Matter'),
  ('Science', 'Matter', 'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Changes In State Of Matter'),
  -- Science > Systems (5)
  ('Science', 'Systems', 'Plant Parts And Functions'),
  ('Science', 'Systems', 'Human Digestive System'),
  ('Science', 'Systems', 'Plant Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Human Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Electrical Systems And Circuits'),
  -- Science > Cycles (6)
  ('Science', 'Cycles', 'Life Cycles Of Insects'),
  ('Science', 'Cycles', 'Life Cycles Of Amphibians'),
  ('Science', 'Cycles', 'Life Cycles Of Flowering Plants'),
  ('Science', 'Cycles', 'Life Cycles Of Fungi'),
  ('Science', 'Cycles', 'Reproduction In Plants And Animals'),
  ('Science', 'Cycles', 'Stages Of The Water Cycle'),
  -- Science > Interactions (4)
  ('Science', 'Interactions', 'Interaction Of Magnetic Forces'),
  ('Science', 'Interactions', 'Interaction Of Frictional, Gravitational And Elastic Spring Forces'),
  ('Science', 'Interactions', 'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Food Chains And Food Webs'),
  -- Science > Energy (4)
  ('Science', 'Energy', 'Light Energy Forms And Uses'),
  ('Science', 'Energy', 'Heat Energy Forms And Uses'),
  ('Science', 'Energy', 'Photosynthesis And Energy Pathways'),
  ('Science', 'Energy', 'Energy Conversion In Everyday Objects'),
  -- Science > Forces (5)
  ('Science', 'Forces', 'Push And Pull Forces'),
  ('Science', 'Forces', 'Effects Of Forces On Objects'),
  ('Science', 'Forces', 'Frictional Force And Its Applications'),
  ('Science', 'Forces', 'Gravitational Force'),
  ('Science', 'Forces', 'Elastic Spring Force'),
  -- Science > Heat (4)
  ('Science', 'Heat', 'Sources Of Heat'),
  ('Science', 'Heat', 'Effects Of Heat Gain And Heat Loss'),
  ('Science', 'Heat', 'Temperature And Use Of Thermometers'),
  ('Science', 'Heat', 'Good And Poor Conductors Of Heat'),
  -- Science > Light (4)
  ('Science', 'Light', 'Sources Of Light'),
  ('Science', 'Light', 'Reflection Of Light'),
  ('Science', 'Light', 'Formation Of Shadows'),
  ('Science', 'Light', 'Transparent, Translucent And Opaque Materials'),
  -- Science > Cells (3)
  ('Science', 'Cells', 'Plant And Animal Cells'),
  ('Science', 'Cells', 'Parts Of A Cell And Their Functions'),
  ('Science', 'Cells', 'Cell Division'),

  -- English > Grammar (8)
  ('English', 'Grammar', 'Simple Present And Past Tenses'),
  ('English', 'Grammar', 'Perfect And Continuous Tenses'),
  ('English', 'Grammar', 'Subject-Verb Agreement'),
  ('English', 'Grammar', 'Singular And Plural Nouns'),
  ('English', 'Grammar', 'Prepositions And Phrasal Verbs'),
  ('English', 'Grammar', 'Conjunctions'),
  ('English', 'Grammar', 'Active And Passive Voice'),
  ('English', 'Grammar', 'Relative Pronouns'),
  -- English > Vocabulary (3)
  ('English', 'Vocabulary', 'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Contextual Vocabulary Meaning'),
  ('English', 'Vocabulary', 'Synonyms And Antonyms'),
  -- English > Cloze (3)
  ('English', 'Cloze', 'Grammar Cloze With Word Bank'),
  ('English', 'Cloze', 'Vocabulary Cloze With Dropdowns'),
  ('English', 'Cloze', 'Comprehension Free-Text Cloze'),
  -- English > Editing (2)
  ('English', 'Editing', 'Correcting Spelling Errors'),
  ('English', 'Editing', 'Correcting Grammatical Errors'),
  -- English > Comprehension (5)
  ('English', 'Comprehension', 'Direct Visual Retrieval'),
  ('English', 'Comprehension', 'True Or False With Reason'),
  ('English', 'Comprehension', 'Pronoun Referent Table'),
  ('English', 'Comprehension', 'Sequencing Of Events'),
  ('English', 'Comprehension', 'Deep Inference And Claim Evidence Reasoning'),
  -- English > Synthesis (7)
  ('English', 'Synthesis', 'Combining With Conjunctions'),
  ('English', 'Synthesis', 'Relative Clauses'),
  ('English', 'Synthesis', 'Participle Phrases'),
  ('English', 'Synthesis', 'Conditional Sentences'),
  ('English', 'Synthesis', 'Reported Speech Transformation'),
  ('English', 'Synthesis', 'Active To Passive Voice Transformation'),
  ('English', 'Synthesis', 'Inversion'),
  -- English > Summary Writing (2)
  ('English', 'Summary Writing', 'Identifying Key Information'),
  ('English', 'Summary Writing', 'Paraphrasing And Condensing Text')
ON CONFLICT DO NOTHING;

-- ─── Step 7: Add FK constraints to question_bank ─────────────────────────
ALTER TABLE question_bank
  DROP CONSTRAINT IF EXISTS fk_question_bank_subject;
ALTER TABLE question_bank
  ADD CONSTRAINT fk_question_bank_subject
  FOREIGN KEY (subject) REFERENCES canon_subjects(subject) ON UPDATE CASCADE;

ALTER TABLE question_bank
  DROP CONSTRAINT IF EXISTS fk_question_bank_topic;
ALTER TABLE question_bank
  ADD CONSTRAINT fk_question_bank_topic
  FOREIGN KEY (subject, topic) REFERENCES canon_topics(subject, topic) ON UPDATE CASCADE;

-- ─── Step 8: Helpful comments ───────────────────────────────────────────
COMMENT ON TABLE canon_subjects   IS 'Canonical syllabus subjects. Source of truth for question_bank.subject.';
COMMENT ON TABLE canon_topics     IS 'Canonical (subject, topic) pairs from MOE syllabus. FK-enforced on question_bank.';
COMMENT ON TABLE canon_sub_topics IS 'Canonical (subject, topic, sub_topic) triples. Read by API for AI generation guardrails. Not yet FK on question_bank.';
