-- Batch: batch_20260502_p6_math_std_mcq_test
-- Generated: 2026-05-02 (test run validating Phase 1 split + new prompt-builder)
-- 5 P6 Mathematics MCQ Standard rows
-- All approved_at = NULL (lands in QA pending queue)

INSERT INTO question_bank
  (id, subject, level, topic, sub_topic, difficulty, type, marks,
   question_text, options, correct_answer, wrong_explanations, worked_solution,
   examiner_note, cognitive_skill, visual_payload, progressive_hints, created_at)
VALUES
-- ─── Q1 — P6 Pie Charts / Reading And Interpreting Pie Charts / Standard ───
(
  gen_random_uuid(),
  'Mathematics', 'Primary 6', 'Pie Charts', 'Reading And Interpreting Pie Charts',
  'Standard', 'mcq', 2,
  'Auntie Mei surveyed 360 customers at her hawker stall about their favourite drink. The pie chart shows that 30% chose teh, 25% chose kopi, and 20% chose milo. The rest chose lemon tea. How many customers chose lemon tea?',
  '["54", "72", "90", "270"]'::jsonb,
  '90',
  '{"54": {"text": "This is 15% of 360. You may have double-counted or swapped a percentage. The remaining slice = 100% − 30% − 25% − 20% = 25%. 25% of 360 = 90.", "type": "calc_error"}, "72": {"text": "This is 20% of 360, the Milo sector. Re-read the question — it asks for lemon tea, which is the unnamed remaining slice (the ''rest'').", "type": "misconception"}, "270": {"text": "This is 75% of 360, the SUM of the three named percentages. The remaining slice (lemon tea) is 100% − 75% = 25%, not 75%.", "type": "misconception"}}'::jsonb,
  '<b>Step 1:</b> Add the three named percentages: 30% + 25% + 20% = 75%.<br><br><b>Step 2:</b> Subtract from 100% to find the remaining (lemon tea) slice: 100% − 75% = 25%.<br><br><b>Step 3:</b> Compute 25% of 360 customers: 25/100 × 360 = 90.<br><br><b>Final answer:</b> 90 customers chose lemon tea.',
  'In PSLE, the examiner expects you to identify the unknown sector first (rest = 100% − sum of named percentages). Common mistake: picking one of the named sectors as the answer.',
  'Inferential Reasoning',
  '{"engine": "diagram-library", "function_name": "pieChart", "params": {"title": "Drinks Chosen by 360 Customers", "data": [{"label": "Teh", "value": 30}, {"label": "Kopi", "value": 25}, {"label": "Milo", "value": 20}, {"label": "Lemon Tea", "value": 25}]}}'::jsonb,
  '["A pie chart shows percentages of a whole. All sectors must add to 100%.", "Three sectors are named — find the fourth (lemon tea) by subtracting the named percentages from 100%.", "Lemon tea = 100% − 30% − 25% − 20% = 25%. Then 25% of 360 = 90."]'::jsonb,
  NOW()
),
-- ─── Q2 — P6 Ratio / Expressing Ratio In Simplest Form / Standard ───
(
  gen_random_uuid(),
  'Mathematics', 'Primary 6', 'Ratio', 'Expressing Ratio In Simplest Form',
  'Standard', 'mcq', 2,
  'In Wei Hao''s P6 class, the ratio of boys to girls is 24 : 36. Express the ratio of boys to girls in its simplest form.',
  '["2 : 3", "3 : 2", "4 : 6", "12 : 18"]'::jsonb,
  '2 : 3',
  '{"3 : 2": {"text": "This swaps the order. The question states boys : girls = 24 : 36, so the simplest form must keep boys first, giving 2 : 3 (not 3 : 2).", "type": "misconception"}, "4 : 6": {"text": "You divided both terms by 6 only. Continue dividing by the remaining common factor 2 to reach 2 : 3. The greatest common divisor of 24 and 36 is 12 — divide by 12 in one step.", "type": "partial_logic"}, "12 : 18": {"text": "You divided both terms by 2 only. The simplest form requires dividing by the GREATEST common divisor (12 in this case), not just any common factor. 24 ÷ 12 : 36 ÷ 12 = 2 : 3.", "type": "partial_logic"}}'::jsonb,
  '<b>Step 1:</b> Find the greatest common divisor (GCD) of 24 and 36. Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24. Factors of 36: 1, 2, 3, 4, 6, 9, 12, 18, 36. GCD = 12.<br><br><b>Step 2:</b> Divide both terms of the ratio by 12: 24 ÷ 12 = 2, and 36 ÷ 12 = 3.<br><br><b>Step 3:</b> The simplest form is 2 : 3.<br><br><b>Final answer:</b> 2 : 3.',
  'In PSLE, the examiner expects you to divide BOTH terms by the GREATEST common divisor in one step for fully simplest form. Common mistake: dividing by any common factor but not the greatest.',
  'Routine Application',
  NULL,
  '["The simplest form of a ratio means both terms share no common factor greater than 1.", "Find the greatest common divisor (GCD) of the two numbers in the ratio.", "GCD of 24 and 36 is 12. Divide both terms: 24 ÷ 12 = 2, 36 ÷ 12 = 3. Answer: 2 : 3."]'::jsonb,
  NOW()
),
-- ─── Q3 — P6 Ratio / Relationship Between Fraction And Ratio / Standard ───
(
  gen_random_uuid(),
  'Mathematics', 'Primary 6', 'Ratio', 'Relationship Between Fraction And Ratio',
  'Standard', 'mcq', 2,
  'In a Singapore HDB block, 3/8 of the residents are children. The remaining residents are adults. Express the ratio of children to adults in the block in its simplest form.',
  '["3 : 5", "3 : 8", "5 : 3", "5 : 8"]'::jsonb,
  '3 : 5',
  '{"3 : 8": {"text": "This is the ratio of children to TOTAL residents (3 parts out of 8). The question asks children to ADULTS. Adults = 8 − 3 = 5 parts, so the correct ratio is 3 : 5.", "type": "misconception"}, "5 : 3": {"text": "This swaps the order. The question asks children to adults, so children must come first: 3 : 5, not 5 : 3.", "type": "misconception"}, "5 : 8": {"text": "This is the ratio of adults to TOTAL residents. The question asks children to adults: 3 parts to 5 parts, giving 3 : 5.", "type": "misconception"}}'::jsonb,
  '<b>Step 1:</b> Imagine the residents divided into 8 equal parts. 3 parts are children.<br><br><b>Step 2:</b> The remaining 8 − 3 = 5 parts are adults.<br><br><b>Step 3:</b> Children : Adults = 3 : 5. The numbers 3 and 5 share no common factor greater than 1, so this is already in simplest form.<br><br><b>Final answer:</b> 3 : 5.',
  'In PSLE, the examiner expects you to use the fraction''s denominator as the TOTAL parts, then subtract the numerator to find the OTHER group. Common mistake: using the denominator (total) as the second ratio term.',
  'Routine Application',
  '{"engine": "diagram-library", "function_name": "fractionBars", "params": {"fractions": [{"numerator": 3, "denominator": 8}]}}'::jsonb,
  '["When 3/8 are children, what fraction are adults? (Hint: the parts must sum to 1.)", "Adults = 1 − 3/8 = 5/8. So out of every 8 residents, 3 are children and 5 are adults.", "Ratio of children to adults = 3 : 5. This is already in simplest form."]'::jsonb,
  NOW()
),
-- ─── Q4 — P6 Volume / Finding Unknown Dimension Given Volume / Standard ───
(
  gen_random_uuid(),
  'Mathematics', 'Primary 6', 'Volume', 'Finding Unknown Dimension Given Volume',
  'Standard', 'mcq', 2,
  'Siti has a rectangular tank that measures 30 cm by 20 cm by 25 cm. She pours 9 litres of water into the empty tank. What is the height of the water in the tank?',
  '["8 cm", "12 cm", "15 cm", "18 cm"]'::jsonb,
  '15 cm',
  '{"8 cm": {"text": "Likely came from dividing 9000 by a wrong number (e.g., 30 + 20 + 25 + …). The formula is volume = base area × height, so height = volume ÷ base area = 9000 ÷ 600 = 15 cm.", "type": "calc_error"}, "12 cm": {"text": "Likely used the wrong pair of dimensions for the base (e.g., 30 × 25 = 750 → 9000 ÷ 750 = 12). The BASE of a tank is length × breadth (30 × 20 = 600 cm²), not length × height.", "type": "calc_error"}, "18 cm": {"text": "Likely used base area = 20 × 25 = 500, giving 9000 ÷ 500 = 18. The base area of the TANK FLOOR is length × breadth = 30 × 20 = 600 cm². Height = 9000 ÷ 600 = 15 cm.", "type": "calc_error"}}'::jsonb,
  '<b>Step 1:</b> Convert 9 litres to cubic centimetres: 9 L × 1000 = 9000 cm³.<br><br><b>Step 2:</b> Compute the base area of the tank (length × breadth): 30 × 20 = 600 cm².<br><br><b>Step 3:</b> Apply the volume formula: height = volume ÷ base area = 9000 ÷ 600 = 15 cm.<br><br><b>Final answer:</b> The water is 15 cm high.',
  'In PSLE, the examiner expects you to identify the BASE area of a tank correctly (length × breadth, the floor) and remember 1 litre = 1000 cm³. Common mistake: using the wrong pair of dimensions for the base.',
  'Routine Application',
  '{"engine": "diagram-library", "function_name": "cuboid", "params": {"length_label": "30 cm", "breadth_label": "20 cm", "height_label": "25 cm", "water_level": 0.6}}'::jsonb,
  '["What''s the link between volume, base area, and height of a rectangular tank?", "Volume = base area × height, so height = volume ÷ base area. The base of a tank is length × breadth.", "Convert 9 L to cm³ (1 L = 1000 cm³, so 9 L = 9000 cm³). Base area = 30 × 20 = 600 cm². Height = 9000 ÷ 600 = 15 cm."]'::jsonb,
  NOW()
),
-- ─── Q5 — P6 Algebra / Evaluating Linear Expressions By Substitution / Standard ───
(
  gen_random_uuid(),
  'Mathematics', 'Primary 6', 'Algebra', 'Evaluating Linear Expressions By Substitution',
  'Standard', 'mcq', 2,
  'Given that a = 7 and b = 4, find the value of 5a − 3(b − 2).',
  '["23", "29", "31", "41"]'::jsonb,
  '29',
  '{"23": {"text": "You likely computed 5(7) − 3(4) = 35 − 12 = 23, ignoring the −2 inside the bracket. Apply BODMAS: evaluate (b − 2) = (4 − 2) = 2 FIRST, then multiply by 3 to get 6.", "type": "partial_logic"}, "31": {"text": "You computed 5(7) − 3(2) but added 2 instead of subtracting: 35 − 6 + 2 = 31. The expression is 5a − 3(b − 2), so the result is 35 − 6 = 29.", "type": "calc_error"}, "41": {"text": "You likely treated the expression as 5a + 3(b − 2) = 35 + 6 = 41, ignoring the negative sign before 3(b − 2). Substituting a = 7, b = 4 gives 5(7) − 3(4 − 2) = 35 − 6 = 29.", "type": "misconception"}}'::jsonb,
  '<b>Step 1:</b> Substitute a = 7 and b = 4 into 5a − 3(b − 2): we get 5(7) − 3(4 − 2).<br><br><b>Step 2:</b> Apply BODMAS — evaluate the bracket first: (4 − 2) = 2. The expression becomes 5(7) − 3(2).<br><br><b>Step 3:</b> Multiply: 5(7) = 35 and 3(2) = 6. The expression becomes 35 − 6.<br><br><b>Step 4:</b> Subtract: 35 − 6 = 29.<br><br><b>Final answer:</b> 29.',
  'In PSLE, the examiner expects you to apply BODMAS strictly — evaluate the bracket first, then multiply, then subtract. Common mistake: computing 3 × b instead of 3 × (b − 2).',
  'Routine Application',
  NULL,
  '["Substitute a = 7 and b = 4 into the expression first.", "Apply BODMAS: brackets first, then multiplication, then subtraction.", "5(7) − 3(4 − 2) = 35 − 3(2) = 35 − 6 = 29."]'::jsonb,
  NOW()
);
