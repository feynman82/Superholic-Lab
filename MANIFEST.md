# MANIFEST — Question Bank Inventory (v5.0)

**Generated:** 2026-05-01 (post-canon-v5 migration)
**Total active questions:** 11,266 (+5 in batch_20260501_p6_math_std_mcq, all `approved_at IS NULL` pending review)
**Total deprecated:** 0
**Distinct (level, subject, topic, sub_topic) combinations:** 173
**Canon entries (canon_level_topics):** 296
**FK enforced:** `question_bank(level, subject, topic, sub_topic)` → `canon_level_topics` (constraint `fk_qb_level_topic`, VALIDATED)

This file is regenerated from the live Supabase `question_bank` table. The
prior MANIFEST tracked individual JSON files in `data/questions/*.json`; that
inventory is superseded by this database-rooted view. Per-batch UUIDs are no
longer recorded here — query Supabase by `created_at` window if needed.

## 1. Coverage by Subject × Level

| Subject | P1 | P2 | P3 | P4 | P5 | P6 | Total |
|---------|----|----|----|----|----|----|-------|
| **English**     | 141 | 182 | 240 | 550 | 417 | 444 | 1 974 |
| **Mathematics** | — | 7 | 6 | 29 | 27 | 60 | 129 |
| **Science**     | n/a | n/a | 2 351 | 2 242 | 2 131 | 2 439 | 9 163 |
| **Total**       | 141 | 189 | 2 597 | 2 821 | 2 575 | 2 943 | **11 266** |

Notes:
- Science has no P1/P2 syllabus (subject introduced at P3).
- Mathematics counts are post-canon-v5 — many earlier P6-tagged questions were re-levelled to P3–P5 during Stage 6.5–6.7 reconciliation. The Mathematics bank is thin overall and is the primary growth target.
- English Synthesis carries large counts at P4 (341), P5 (182), P6 (192) — most still have NULL `sub_topic` and are queued for sub-topic backfill.

## 2. Sub-topic Coverage Gaps (canon entries with 0 questions)

153 of the 296 canon (level, subject, topic, sub_topic) combinations currently
have **zero** active questions. These are the highest-leverage targets for the
next generation sprint.

### Mathematics (top priority — bank is thinnest)

**Primary 1 (16 gaps):** Add/Sub Concepts • Add/Sub Within 100 • Add/Sub Mental Calc • Reading Picture Graphs • Length & Mass Comparing/Ordering • Length & Mass cm/m • Money Counting • M&D Concepts • Mul Tables ×2/3/4/5/10 • Shapes 2D Identifying • Shapes Patterns • Time To 5 Min • Time Am/Pm • Whole Nums Comparing • Whole Nums Place Values • Whole Nums Counting To 100 • Whole Nums Patterns

**Primary 2 (19 gaps):** Add/Sub Algorithms • Add/Sub Mental • Reading Picture Graphs • Fractions Of A Whole • Fractions Comparing • Length & Mass Comparing • Length & Mass g/kg • Money Comparing • Money Decimal⇄Cents • Money Counting • Money Decimal Notation • M&D Algorithms • Mul Tables ×2/3/4/5/10 • Shapes 3D Classifying • Time In Hours/Minutes • Time To The Minute • Volume Of Liquid Comparing • Volume Of Liquid In Litres • Whole Nums Comparing • Whole Nums Place Values • Whole Nums Patterns

**Primary 3 (20 gaps):** Angles Concepts • Right Angles • A&P Of Rect/Sq • A&P Concepts • Fractions Adding Unlike • Fractions Comparing • Equivalent Fractions • Fractions Subtracting Unlike • Geometry Perpendicular & Parallel Lines • Length Compound→Smaller • Length In km • Money Add/Subtract Decimal • Money Word Problems • M&D Mental Calc • M&D Algorithms • Mul Tables ×6/7/8/9 • Time Start/Finish/Duration • Time In Seconds • Time 24-Hour • Volume L⇄mL • Volume In mL • Whole Nums Comparing • Whole Nums Place Values • Whole Nums Patterns

**Primary 4 (16 gaps):** Angles Drawing • Measuring In Degrees • Decimals Convert→Fraction • Convert→Decimal • Four Operations With Decimals • Decimals Place Values • Decimals Rounding • Identifying Factors And Multiples • Improper Fractions • Mixed Numbers • Geometry Drawing 2D Of Solids • Identifying Nets • Identifying 2D Reps • Money Word Problems • Pie Charts Reading & Interpreting (intro) • Symmetry Identifying Symmetric Figures • Time Word Problems • Whole Nums Comparing • Whole Nums Rounding To 10/100/1000

**Primary 5 (17 gaps):** Angles At A Point • Angles On A Straight Line • Finding Unknown Angles • Vertically Opposite Angles • Area Of Triangle Concepts • Average Total÷Count • Avg Total–Average–Count Relationship • Mixed Numbers • Properties Of Parallelogram, Rhombus & Trapezium • Length Word Problems • Money Word Problems • Percentage Expressing • Finding % Part Of A Whole • Volume Building With Cubes • Volume In Cubic Units • Volume Of Liquid Word Problems • Use Of Brackets

**Primary 6 (8 gaps):** Algebra Interpretation • Algebra Using A Letter • Ratio Comparison • Ratio Dividing In Given Ratio • Ratio Equivalent • Ratio Simplest Form • Ratio Part-Whole • Ratio Fraction↔Ratio Relationship

### Science (0 gaps after v5 reconciliation)

All 80 canonical Sci (level, topic, sub_topic) entries now have ≥ 1 active question.

### English (44 gaps)

- **Comprehension (15):** sub-topic granularity is canon at every level (Direct Visual Retrieval, Sequencing Of Events, True Or False With Reason, Pronoun Referent Table, Visual Text Inference And Purpose, Visual Text Literal Retrieval). Most P1-P6 Comprehension questions are still tagged with `sub_topic = NULL` — backfill rather than generation needed.
- **Editing (10):** Spelling vs Grammatical sub-topic split is canon across P3–P6; almost all current Editing rows are NULL `sub_topic`. Same backfill story.
- **Synthesis (8):** Combining With Conjunctions, Relative Clauses, Active→Passive, Reported Speech, Conditional Sentences, Inversion, Participle Phrases — all canonical at P5/P6, all empty.
- **Summary Writing (4):** Identifying Key Information; Paraphrasing And Condensing Text — canon at P5/P6, both empty (topic newly introduced in v5).
- **Grammar (3):** P1 Simple Present And Past Tenses; P5 Active And Passive Voice; P6 Active And Passive Voice. The Grammar gaps are narrow because Stage 6.5/6.6 split Simple Present → Perfect/Continuous correctly at P4/P5/P6.

## 3. Highest-Density Combos (sanity / QA prioritisation)

| Subject | Level | Topic | Sub_topic | Count |
|---------|-------|-------|-----------|------:|
| Science | P3 | Diversity | Classification Of Living And Non-Living Things | 1 081 |
| Science | P6 | Energy | Energy Conversion In Everyday Objects | 843 |
| Science | P5 | Systems | Plant Respiratory And Circulatory Systems | 554 |
| Science | P3 | Diversity | Diversity Of Materials And Their Properties | 517 |
| Science | P5 | Systems | Electrical Systems And Circuits | 476 |
| Science | P5 | Cycles | Stages Of The Water Cycle | 466 |
| Science | P4 | Energy | Sources Of Heat | 366 |
| Science | P5 | Systems | Human Respiratory And Circulatory Systems | 357 |
| Science | P3 | Diversity | General Characteristics Of Living And Non-Living Things | 346 |
| Science | P4 | Matter | Properties Of Solids, Liquids And Gases | 327 |
| Science | P6 | Interactions | Frictional Force | 310 |
| Science | P6 | Interactions | Interactions Within The Environment | 309 |
| English | P6 | Synthesis | (NULL) | 189 |
| English | P5 | Synthesis | (NULL) | 182 |
| English | P4 | Synthesis | Combining With Conjunctions | 171 |
| English | P4 | Synthesis | (NULL) | 170 |
| Science | P4 | Energy | Formation Of Shadows | 171 |

## 4. Manual-Review Flags

Rows the v5 migration touched and tagged for content review:
- Stage 6.5 §C4 — NULL sub_topic catch-all
- Stage 6.6 §G6 — Diversity P4 NULL → P3 default sub_topic
- Stage 6.7 — P6 Cycles NULL → P3 default sub_topic

Run `SELECT COUNT(*) FROM question_bank WHERE flag_review=true;` for the
current count. These rows passed the FK (because the auto-default sub_topic
is canonical) but the content may not match the assigned sub_topic — content
team should re-tag.

## 5. Migration Anchors

| Stage | What | Date |
|-------|------|------|
| Stage 1–4 | Canon v5 schema build (`canon_subjects`, `canon_topics`, `canon_sub_topics`, `canon_level_topics`) | (pre-2026-05-01) |
| Stage 5 | Backup tables `_backup_question_bank_20260501`, `_backup_mastery_levels_20260501` | 2026-05-01 |
| Stage 6.5 | Orphan reconciliation (Sections A–D) — **3 058 rows fixed** | 2026-05-01 |
| Stage 6.6 | Residual orphan reconciliation (Groups 1–7) — **508 rows fixed** | 2026-05-01 |
| Stage 6.7 | Final leftover sweep — **5 rows fixed** | 2026-05-01 |
| Stage 6 | FK constraint `fk_qb_level_topic` added + VALIDATED on 11 261 rows | 2026-05-01 |

## 6. Re-running this MANIFEST

```sql
-- Coverage matrix (one row per canonical combo with counts)
SELECT level, subject, topic, sub_topic, COUNT(*) AS qty,
       SUM(CASE WHEN difficulty='Foundation' THEN 1 ELSE 0 END) AS f,
       SUM(CASE WHEN difficulty='Standard'   THEN 1 ELSE 0 END) AS s,
       SUM(CASE WHEN difficulty='Advanced'   THEN 1 ELSE 0 END) AS a,
       SUM(CASE WHEN difficulty='HOTS'       THEN 1 ELSE 0 END) AS h,
       ARRAY_AGG(DISTINCT type ORDER BY type) AS types
FROM question_bank
WHERE deprecated_at IS NULL
GROUP BY level, subject, topic, sub_topic
ORDER BY subject, level, topic, sub_topic;

-- Canon entries with 0 questions (the gaps to fill)
SELECT clt.level, clt.subject, clt.topic, clt.sub_topic
FROM canon_level_topics clt
LEFT JOIN question_bank qb
  ON qb.level=clt.level AND qb.subject=clt.subject
 AND qb.topic=clt.topic AND qb.sub_topic=clt.sub_topic
 AND qb.deprecated_at IS NULL
WHERE qb.id IS NULL
ORDER BY clt.subject, clt.level, clt.topic, clt.sub_topic;
```
