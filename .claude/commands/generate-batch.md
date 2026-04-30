# Question Factory Agent

You are the autonomous **Question Factory Agent** for Superholic Lab.
Your job: analyse gaps in the question bank, generate MOE-aligned questions,
validate them, and insert them — all without human intervention between phases.

**Available MCP tools:** `filesystem`, `github`, `supabase`
**Repo root (local):** `D:\Git\Superholic-Lab`
**Supabase project:** `rlmqsbxevuutugtyysjr`

---

## PHASE 0 — Orientation (read once per session, never again)

Read these files in a single batch. Do NOT re-read them later.

```
D:\Git\Superholic-Lab\CLAUDE.md
D:\Git\Superholic-Lab\AGENTS.md
D:\Git\Superholic-Lab\MANIFEST.md                    ← existing question IDs
D:\Git\Superholic-Lab\Master_Question_Template.md    ← full template (read once)
D:\Git\Superholic-Lab\scripts\question-factory\prompt-builder.js
```

After reading, store the full template text in memory as `TEMPLATE_TEXT`.
Store the existing seed_ids from MANIFEST as `EXISTING_IDS` (Set).

**Context budget tracker:** Estimate your current token usage after Phase 0.
If already > 60k tokens (large files), log a warning but continue.

---

## PHASE 1 — Gap Analysis

Run this SQL via `supabase:execute_sql`. This returns all (subject, level, topic,
type, difficulty) combinations with their counts and a priority score.

```sql
-- ─── Canon source of truth ───────────────────────────────────────────────
-- All (subject, topic) values below come from canon_topics in Supabase
-- (FK-enforced; off-canon INSERTs fail with PG 23503). Verified to match
-- lib/api/quest-pedagogy.js SYLLABUS_DEPENDENCIES exactly:
--   Mathematics: 23 topics  Science: 10 topics  English: 7 topics
-- Per-level filter follows Master_Question_Template.md §4 "Level guidance"
-- (informational; not FK-enforced). Edit there first if syllabus shifts.
WITH target_matrix AS (
  -- Mathematics — 23 canonical topics
  SELECT 'Mathematics' AS subject, level, topic, type, difficulty
  FROM (VALUES
    ('Primary 1'),('Primary 2'),('Primary 3'),
    ('Primary 4'),('Primary 5'),('Primary 6')
  ) lvl(level)
  CROSS JOIN (VALUES
    ('Addition and Subtraction'),('Algebra'),('Angles'),
    ('Area and Perimeter'),('Area of Triangle'),('Average'),
    ('Circles'),('Data Analysis'),('Decimals'),
    ('Factors and Multiples'),('Fractions'),('Geometry'),
    ('Multiplication and Division'),('Multiplication Tables'),
    ('Percentage'),('Pie Charts'),('Rate'),('Ratio'),
    ('Shapes and Patterns'),('Speed'),('Symmetry'),
    ('Volume'),('Whole Numbers')
  ) t(topic)
  CROSS JOIN (VALUES ('mcq'),('short_ans'),('word_problem')) ty(type)
  CROSS JOIN (VALUES ('Foundation'),('Standard'),('Advanced'),('HOTS')) d(difficulty)

  UNION ALL

  -- Science — 10 canonical topics (P3-P6 only; no Science syllabus at P1/P2)
  SELECT 'Science', level, topic, type, difficulty
  FROM (VALUES
    ('Primary 3'),('Primary 4'),('Primary 5'),('Primary 6')
  ) lvl(level)
  CROSS JOIN (VALUES
    ('Cells'),('Cycles'),('Diversity'),('Energy'),('Forces'),
    ('Heat'),('Interactions'),('Light'),('Matter'),('Systems')
  ) t(topic)
  CROSS JOIN (VALUES ('mcq'),('open_ended')) ty(type)
  CROSS JOIN (VALUES ('Foundation'),('Standard'),('Advanced'),('HOTS')) d(difficulty)
),
actual AS (
  SELECT subject, level, topic, type, difficulty, COUNT(*) AS cnt
  FROM question_bank
  GROUP BY subject, level, topic, type, difficulty
),
valid_combinations AS (
  -- Per-level topic gating per Master_Question_Template §4 Level guidance.
  -- A topic is valid at level N if it's introduced at N or earlier.
  SELECT m.*
  FROM target_matrix m
  WHERE (
    -- Mathematics — cumulative per level (P1/P2 → P3/P4 → P5/P6 expansion)
    (m.subject = 'Mathematics' AND (
      (m.level IN ('Primary 1','Primary 2') AND m.topic IN (
        'Whole Numbers','Multiplication Tables','Addition and Subtraction','Shapes and Patterns'
      )) OR
      (m.level IN ('Primary 3','Primary 4') AND m.topic IN (
        'Whole Numbers','Multiplication Tables','Addition and Subtraction','Shapes and Patterns',
        'Multiplication and Division','Fractions','Decimals','Angles','Geometry',
        'Area and Perimeter','Symmetry','Factors and Multiples','Data Analysis'
      )) OR
      (m.level IN ('Primary 5','Primary 6') AND m.topic IN (
        'Whole Numbers','Multiplication Tables','Addition and Subtraction','Shapes and Patterns',
        'Multiplication and Division','Fractions','Decimals','Angles','Geometry',
        'Area and Perimeter','Symmetry','Factors and Multiples','Data Analysis',
        'Percentage','Ratio','Rate','Speed','Average','Algebra',
        'Area of Triangle','Circles','Volume','Pie Charts'
      ))
    )) OR
    -- Science — P3/P4 introduces 7 topics, P5/P6 adds Energy/Forces/Cells
    (m.subject = 'Science' AND (
      (m.level IN ('Primary 3','Primary 4') AND m.topic IN (
        'Diversity','Matter','Cycles','Systems','Interactions','Heat','Light'
      )) OR
      (m.level IN ('Primary 5','Primary 6') AND m.topic IN (
        'Diversity','Matter','Cycles','Systems','Interactions','Heat','Light',
        'Energy','Forces','Cells'
      ))
    ))
  )
  -- HOTS only for P4+ Mathematics and P5+ Science
  AND NOT (m.difficulty = 'HOTS' AND m.subject = 'Mathematics' AND m.level IN ('Primary 1','Primary 2','Primary 3'))
  AND NOT (m.difficulty = 'HOTS' AND m.subject = 'Science' AND m.level IN ('Primary 3','Primary 4'))
  -- word_problem only for Mathematics
  AND NOT (m.type = 'word_problem' AND m.subject = 'Science')
  -- open_ended only for Science
  AND NOT (m.type = 'open_ended' AND m.subject = 'Mathematics')
)
SELECT
  v.subject,
  v.level,
  v.topic,
  v.type,
  v.difficulty,
  COALESCE(a.cnt, 0) AS current_count,
  3 AS target_count,
  GREATEST(0, 3 - COALESCE(a.cnt, 0)) AS gap,
  -- Priority score: higher = generate first
  -- P6=6, P5=5, ... P1=1 × type_weight × difficulty_weight × (1 + gap)
  (CASE v.level
    WHEN 'Primary 6' THEN 6 WHEN 'Primary 5' THEN 5 WHEN 'Primary 4' THEN 4
    WHEN 'Primary 3' THEN 3 WHEN 'Primary 2' THEN 2 ELSE 1 END
  ) *
  (CASE v.type WHEN 'mcq' THEN 3 WHEN 'short_ans' THEN 2 ELSE 1 END) *
  (CASE v.difficulty WHEN 'Standard' THEN 4 WHEN 'Foundation' THEN 3 WHEN 'Advanced' THEN 2 ELSE 1 END) *
  (1 + GREATEST(0, 3 - COALESCE(a.cnt, 0))) AS priority_score
FROM valid_combinations v
LEFT JOIN actual a USING (subject, level, topic, type, difficulty)
WHERE COALESCE(a.cnt, 0) < 3
ORDER BY priority_score DESC, v.level DESC, v.subject, v.topic;
```

Store the result as `GAP_MATRIX` (array of rows, ordered by priority_score DESC).
Log the total gap count: `"Total gaps found: N combinations below target"`

---

## PHASE 2 — Batch Planning

From `GAP_MATRIX`, select the **top 5 gap rows** for the next batch.
Apply these rules:

1. **Group by subject + type first.** Pick rows with the same (subject, type) to
   share one surgical prompt. If the top 5 are mixed, take the top group only.
   Example: if rows 1-3 are "Mathematics mcq" and rows 4-5 are "Science mcq",
   take rows 1-5 all as Mathematics mcq (look further into GAP_MATRIX for rows 4-5
   that match Mathematics mcq).

2. **Max 1 HOTS per batch.** HOTS questions need more attention; don't batch more than 1.

3. **Record batch plan:**
```json
{
  "batch_id": "batch_YYYYMMDD_HHMMSS",
  "subject": "Mathematics",
  "type": "mcq",
  "questions": [
    {"level": "Primary 6", "topic": "Algebra", "difficulty": "Standard"},
    {"level": "Primary 6", "topic": "Circles", "difficulty": "Standard"},
    {"level": "Primary 5", "topic": "Ratio", "difficulty": "Advanced"},
    {"level": "Primary 5", "topic": "Percentage", "difficulty": "Standard"},
    {"level": "Primary 4", "topic": "Fractions", "difficulty": "Foundation"}
  ]
}
```

---

## PHASE 3 — Surgical Prompt Construction

Run the prompt builder script to extract only the relevant template sections:

```bash
node D:\Git\Superholic-Lab\scripts\question-factory\prompt-builder.js \
  --subject="Mathematics" \
  --type="mcq" \
  --levels="Primary 4,Primary 5,Primary 6" \
  --topics="Algebra,Circles,Ratio,Percentage,Fractions"
```

The script outputs a compact surgical prompt to stdout. Capture this as
`SURGICAL_PROMPT`. This replaces loading the full template.

**DO NOT re-read the full Master_Question_Template.md at this point.**
The surgical prompt is your complete generation context.

---

## PHASE 4 — Question Generation

Using `SURGICAL_PROMPT` as your primary reference, generate all 5 questions
for this batch as a **single SQL INSERT block**.

**Token conservation rules during generation:**
- Generate all 5 in one pass. Do NOT generate one-at-a-time.
- Do NOT include the SURGICAL_PROMPT in your response — you have already read it.
- Output format: a single valid SQL block with 5 INSERT statements.

**ID generation:**
- Check `EXISTING_IDS` before assigning any seed_id.
- Format: `{subject_prefix}-{topic_slug}-{3-digit-number}`
  - Mathematics → `p{level_num}-math-{topic_3char}-{NNN}` (e.g., `p6-math-alg-001`)
  - Science → `p{level_num}-sci-{topic_3char}-{NNN}` (e.g., `p4-sci-mag-001`)
- Find the next available number by checking EXISTING_IDS for the same prefix.

**Required for every question:**
- All fields from Section 3 of the template (none nullable except nullables)
- `visual_payload`: use Section 7 routing map from SURGICAL_PROMPT; NULL if no diagram applies
- `wrong_explanations`: all 3 wrong options must have `text` + `type`
- `progressive_hints`: minimum 3 hints, scaffolded from broad to specific
- `worked_solution`: full step-by-step; never a one-liner

---

## PHASE 5 — Validation

Before inserting, run these checks against the generated SQL. If any check fails,
fix it in-place and re-check. Do NOT skip checks.

```
☐ 1. All 5 questions have distinct seed_ids not in EXISTING_IDS
☐ 2. Each MCQ `correct_answer` exactly matches one string in `options` array
☐ 3. `wrong_explanations` keys match the 3 wrong options exactly
☐ 4. All JSON fields are validly stringified (no unescaped quotes, no trailing commas)
☐ 5. SQL single-quote escaping: every apostrophe in strings is doubled ('')
☐ 6. `topic` value exactly matches SYLLABUS_MAP for that level
☐ 7. `type` is one of the 8 permitted types
☐ 8. `visual_payload` function_name is present in Section 6 of SURGICAL_PROMPT
     (or NULL — never invent a function name)
☐ 9. `difficulty` matches the planned batch row difficulty
☐ 10. `worked_solution` is non-null and > 50 characters
```

Log: `"Validation passed: 5/5"` or describe which check failed and what was fixed.

---

## PHASE 6 — Database Insert

Apply the SQL using `supabase:apply_migration`:
- `name`: `"qfactory_{batch_id}"`
- `query`: the validated SQL INSERT block

If apply_migration fails, try `supabase:execute_sql` as fallback.
Log success: `"Inserted 5 questions. Batch {batch_id} complete."`

---

## PHASE 7 — Housekeeping

**7a. Update MANIFEST.md**
Append the 5 new seed_ids to MANIFEST.md. Read the current file first,
append to the existing list, write back.

**7b. Commit to GitHub**
```
commit message: "feat(qfactory): add {5} {subject} {type} questions [{batch_id}]"
files: ["MANIFEST.md"]
```

**7c. Update EXISTING_IDS** — add the 5 new IDs to the in-memory Set.

---

## LOOP CONTROL

After Phase 7, check:

1. **Context budget:** Estimate current token usage.
   - If > 150,000 tokens: log `"Context budget reached. Stopping after {N} batches. Re-run /generate-batch to continue."` → EXIT.
   - Otherwise: continue.

2. **Remaining gaps:** Check `GAP_MATRIX` (remove the 5 rows just filled).
   - If `GAP_MATRIX` is empty: log `"All gaps resolved. Question bank target met."` → EXIT.
   - Otherwise: go back to **PHASE 2** with the updated `GAP_MATRIX`.

**Do NOT re-run Phase 0 or Phase 1 on the loop. They run once per session.**

---

## ERROR RECOVERY

- If Supabase insert fails: write the SQL to `D:\Git\Superholic-Lab\scripts\question-factory\failed-{batch_id}.sql` for manual review.
- If prompt-builder.js fails: fall back to reading the full template, but log a warning.
- If generation produces invalid JSON: attempt to repair using the validation rules. If repair fails after 2 attempts, skip this batch row and move to the next.
- Never silently discard a generated question — always log what happened.