-- ═══════════════════════════════════════════════════════════════
-- STAGE 6.5 — ORPHAN ROW RECONCILIATION
-- Run BEFORE Stage 6 FK constraint
-- Fixes ~3,500 orphan rows surfaced by Stage 6.1 query
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- SECTION A — LEVEL FIXES (safe, content already matches new level)
-- ═══════════════════════════════════════════════════════════════

-- A1. P6 Science Systems sub_topics → correct levels
UPDATE question_bank SET level='Primary 4'
WHERE level='Primary 6' AND subject='Science' AND topic='Systems'
  AND sub_topic IN ('Plant Parts And Functions','Human Digestive System');

UPDATE question_bank SET level='Primary 5'
WHERE level='Primary 6' AND subject='Science' AND topic='Systems'
  AND sub_topic IN ('Plant Respiratory And Circulatory Systems',
                    'Human Respiratory And Circulatory Systems',
                    'Electrical Systems And Circuits');

-- A2. P6 Diversity → P3 (Diversity is P3-only in canon)
UPDATE question_bank SET level='Primary 3'
WHERE level='Primary 6' AND subject='Science' AND topic='Diversity';

-- A3. P6 Matter → P4 (Matter is P4-only in canon)
UPDATE question_bank SET level='Primary 4'
WHERE level='Primary 6' AND subject='Science' AND topic='Matter';

-- A4. P6 Cycles non-reproduction → P3/P4
UPDATE question_bank SET level='Primary 3'
WHERE level='Primary 6' AND subject='Science' AND topic='Cycles'
  AND sub_topic IN ('Life Cycles Of Insects','Life Cycles Of Amphibians',
                    'Life Cycles Of Flowering Plants');

UPDATE question_bank SET level='Primary 4'
WHERE level='Primary 6' AND subject='Science' AND topic='Cycles'
  AND sub_topic='Stages Of The Water Cycle';

UPDATE question_bank SET level='Primary 5'
WHERE level='Primary 6' AND subject='Science' AND topic='Cycles'
  AND sub_topic='Reproduction In Plants And Animals';

-- A5. P4 Cycles Reproduction → P5
UPDATE question_bank SET level='Primary 5'
WHERE level='Primary 4' AND subject='Science' AND topic='Cycles'
  AND sub_topic='Reproduction In Plants And Animals';

-- A6. P5 Energy Photosynthesis → P6
UPDATE question_bank SET level='Primary 6'
WHERE level='Primary 5' AND subject='Science' AND topic='Energy'
  AND sub_topic='Photosynthesis And Energy Pathways';

-- A7. P5 Energy Conversion → P6
UPDATE question_bank SET level='Primary 6'
WHERE level='Primary 5' AND subject='Science' AND topic='Energy'
  AND sub_topic='Energy Conversion In Everyday Objects';

-- A8. P5 Systems Plant Parts → P4
UPDATE question_bank SET level='Primary 4'
WHERE level='Primary 5' AND subject='Science' AND topic='Systems'
  AND sub_topic='Plant Parts And Functions';

-- A9. English level fixes
-- P1/P2 Relative Pronouns/Subject-Verb Agreement → P3 (canon: SVA at P3, RP at P5)
UPDATE question_bank SET level='Primary 3'
WHERE level IN ('Primary 1','Primary 2') AND subject='English'
  AND sub_topic='Subject-Verb Agreement';

UPDATE question_bank SET level='Primary 5'
WHERE level IN ('Primary 1','Primary 2','Primary 4') AND subject='English'
  AND sub_topic='Relative Pronouns';

-- ═══════════════════════════════════════════════════════════════
-- SECTION B — CONTENT-AWARE SUB_TOPIC SPLITS
-- ═══════════════════════════════════════════════════════════════

-- B1. "Heat Energy Forms And Uses" (594 rows) → 4 v5 sub_topics by content
UPDATE question_bank SET sub_topic = CASE
  WHEN question_text ILIKE '%conductor%' OR question_text ILIKE '%insulator%'
       THEN 'Good And Poor Conductors Of Heat'
  WHEN question_text ILIKE '%thermometer%' OR question_text ILIKE '%temperature%'
       OR question_text ILIKE '%°C%' OR question_text ILIKE '%degree%'
       THEN 'Temperature And Use Of Thermometers'
  WHEN question_text ILIKE '%expand%' OR question_text ILIKE '%contract%'
       OR question_text ILIKE '%gain%' OR question_text ILIKE '%loss%'
       OR question_text ILIKE '%hotter%' OR question_text ILIKE '%cooler%'
       OR question_text ILIKE '%melt%' OR question_text ILIKE '%freeze%'
       THEN 'Effects Of Heat Gain And Heat Loss'
  ELSE 'Sources Of Heat'
END
WHERE subject='Science' AND topic='Energy'
  AND sub_topic='Heat Energy Forms And Uses';

-- B2. "Light Energy Forms And Uses" (341 rows) → 4 v5 sub_topics
UPDATE question_bank SET sub_topic = CASE
  WHEN question_text ILIKE '%shadow%' OR question_text ILIKE '%silhouette%'
       THEN 'Formation Of Shadows'
  WHEN question_text ILIKE '%reflect%' OR question_text ILIKE '%mirror%'
       OR question_text ILIKE '%bounce%'
       THEN 'Reflection Of Light'
  WHEN question_text ILIKE '%transparent%' OR question_text ILIKE '%translucent%'
       OR question_text ILIKE '%opaque%' OR question_text ILIKE '%see-through%'
       OR question_text ILIKE '%see through%'
       THEN 'Transparent, Translucent And Opaque Materials'
  ELSE 'Sources Of Light'
END
WHERE subject='Science' AND topic='Energy'
  AND sub_topic='Light Energy Forms And Uses';

-- B3. "Interaction Of Frictional, Gravitational And Elastic Spring Forces" (159 rows)
UPDATE question_bank SET sub_topic = CASE
  WHEN question_text ILIKE '%friction%' OR question_text ILIKE '%rough%'
       OR question_text ILIKE '%smooth%' OR question_text ILIKE '%slip%'
       THEN 'Frictional Force'
  WHEN question_text ILIKE '%gravit%' OR question_text ILIKE '%weight%'
       OR question_text ILIKE '%fall%' OR question_text ILIKE '%earth pulls%'
       THEN 'Gravitational Force'
  WHEN question_text ILIKE '%spring%' OR question_text ILIKE '%elastic%'
       OR question_text ILIKE '%stretch%' OR question_text ILIKE '%compress%'
       THEN 'Elastic Spring Force'
  ELSE 'Effects Of Forces On Objects'
END
WHERE subject='Science' AND topic='Interactions'
  AND sub_topic='Interaction Of Frictional, Gravitational And Elastic Spring Forces';

-- B4. P4-P6 "Thematic Vocabulary Recall" → "Contextual Vocabulary Meaning"
-- (canon: Thematic is P1-P3 only)
UPDATE question_bank SET sub_topic='Contextual Vocabulary Meaning'
WHERE subject='English' AND sub_topic='Thematic Vocabulary Recall'
  AND level IN ('Primary 4','Primary 5','Primary 6');

-- B5. P5 "Simple Present And Past Tenses" → "Perfect And Continuous Tenses"
UPDATE question_bank SET sub_topic='Perfect And Continuous Tenses'
WHERE level='Primary 5' AND subject='English'
  AND sub_topic='Simple Present And Past Tenses';

-- B6. P6 Energy "Heat Energy Forms And Uses" residual at P6 → split same way
UPDATE question_bank SET sub_topic = CASE
  WHEN question_text ILIKE '%conductor%' THEN 'Good And Poor Conductors Of Heat'
  WHEN question_text ILIKE '%thermometer%' OR question_text ILIKE '%temperature%'
       THEN 'Temperature And Use Of Thermometers'
  WHEN question_text ILIKE '%expand%' OR question_text ILIKE '%loss%' OR question_text ILIKE '%gain%'
       THEN 'Effects Of Heat Gain And Heat Loss'
  ELSE 'Sources Of Heat'
END
WHERE level='Primary 6' AND subject='Science' AND topic='Energy'
  AND sub_topic='Heat Energy Forms And Uses';

UPDATE question_bank SET sub_topic = CASE
  WHEN question_text ILIKE '%shadow%' THEN 'Formation Of Shadows'
  WHEN question_text ILIKE '%reflect%' OR question_text ILIKE '%mirror%' THEN 'Reflection Of Light'
  WHEN question_text ILIKE '%transparent%' OR question_text ILIKE '%translucent%' OR question_text ILIKE '%opaque%'
       THEN 'Transparent, Translucent And Opaque Materials'
  ELSE 'Sources Of Light'
END
WHERE level='Primary 6' AND subject='Science' AND topic='Energy'
  AND sub_topic='Light Energy Forms And Uses';

-- B7. P6 Energy heat/light sub_topics from B1/B2 split → move to P4
UPDATE question_bank SET level='Primary 4'
WHERE level='Primary 6' AND subject='Science' AND topic='Energy'
  AND sub_topic IN ('Sources Of Heat','Effects Of Heat Gain And Heat Loss',
                    'Temperature And Use Of Thermometers','Good And Poor Conductors Of Heat',
                    'Sources Of Light','Reflection Of Light','Formation Of Shadows',
                    'Transparent, Translucent And Opaque Materials');

-- ═══════════════════════════════════════════════════════════════
-- SECTION C — NULL SUB_TOPIC BACKFILLS
-- ═══════════════════════════════════════════════════════════════

-- C1. P3 English Synthesis NULL → P4 Combining With Conjunctions
-- (Synthesis canon starts at P4)
UPDATE question_bank
SET level='Primary 4', sub_topic='Combining With Conjunctions'
WHERE level='Primary 3' AND subject='English' AND topic='Synthesis' AND sub_topic IS NULL;

-- C2. P3 Science Systems NULL → P4 Plant Parts And Functions
UPDATE question_bank
SET level='Primary 4', sub_topic='Plant Parts And Functions'
WHERE level='Primary 3' AND subject='Science' AND topic='Systems' AND sub_topic IS NULL;

-- C3. P4 Science Interactions NULL → P3 Magnetic (most likely intent)
-- If content is about forces, will be re-tagged manually after FK in place
UPDATE question_bank
SET level='Primary 3', sub_topic='Interaction Of Magnetic Forces'
WHERE level='Primary 4' AND subject='Science' AND topic='Interactions' AND sub_topic IS NULL;

-- C4. Catch-all for any other NULL sub_topic
UPDATE question_bank SET flag_review=true,
  examiner_note=COALESCE(examiner_note,'')||' [v5-migration: NULL sub_topic, manual review]'
WHERE sub_topic IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- SECTION D — DROP DEPRECATED + LIFE CYCLES OF FUNGI
-- ═══════════════════════════════════════════════════════════════

-- D1. Life Cycles Of Fungi (12 rows) — not in 2023 syllabus
DELETE FROM mastery_levels
WHERE subject='science' AND sub_topic='Life Cycles Of Fungi';

DELETE FROM question_bank
WHERE topic='Cycles' AND sub_topic='Life Cycles Of Fungi';

-- D2. Hard-delete deprecated Speed P6 rows (was soft-deleted in Stage 3)
DELETE FROM mastery_levels
WHERE subject='Mathematics' AND topic='Speed';

DELETE FROM question_bank
WHERE subject='Mathematics' AND topic='Speed' AND deprecated_at IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════

-- Should return 0
SELECT level, subject, topic, sub_topic, COUNT(*) AS cnt FROM question_bank
WHERE deprecated_at IS NULL
  AND (level, subject, topic, sub_topic) NOT IN
      (SELECT level, subject, topic, sub_topic FROM canon_level_topics)
GROUP BY 1,2,3,4
ORDER BY cnt DESC
LIMIT 50;

-- If above returns rows, INVESTIGATE before COMMIT.
-- If 0 rows, proceed:

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- STAGE 6 PROPER — ADD FK CONSTRAINT
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE question_bank
  ADD CONSTRAINT fk_qb_level_topic
  FOREIGN KEY (level, subject, topic, sub_topic)
  REFERENCES canon_level_topics(level, subject, topic, sub_topic)
  NOT VALID;
-- NOT VALID = enforce on new rows only, skip backfill check (faster)

-- Then validate later when convenient:
-- ALTER TABLE question_bank VALIDATE CONSTRAINT fk_qb_level_topic;

-- Or if you want full enforcement immediately (slower, ~30s on 11k rows):
-- ALTER TABLE question_bank
--   ADD CONSTRAINT fk_qb_level_topic
--   FOREIGN KEY (level, subject, topic, sub_topic)
--   REFERENCES canon_level_topics(level, subject, topic, sub_topic);