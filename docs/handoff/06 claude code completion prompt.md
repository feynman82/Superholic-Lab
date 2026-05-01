# CLAUDE CODE PROMPT — Superholic Lab v5 Migration Completion

Paste this prompt into Claude Code CLI (Git Bash, Windows). Execute in `D:\Git\Superholic-Lab`.

---

```
You are completing the Superholic Lab canon v5.0 migration. Six tasks, in order. 
DO NOT skip ahead. After each task, run the verification step before proceeding.

═══════════════════════════════════════════════════════════════
TASK 1 — STAGE 6.5 RECONCILIATION (Supabase)
═══════════════════════════════════════════════════════════════

Use the Supabase MCP server (project ID: rlmqsbxevuutugtyysjr).

Step 1a: Read /mnt/user-data/outputs/05_stage_6_5_reconciliation.sql 
         (or the equivalent in this repo).

Step 1b: Run SECTIONS A, B, C, D as ONE transaction via supabase:execute_sql.
         The file is one long BEGIN/COMMIT block — execute as-is.

Step 1c: Run the verification SELECT (zero orphan check):
   SELECT level, subject, topic, sub_topic, COUNT(*) AS cnt FROM question_bank
   WHERE deprecated_at IS NULL
     AND (level, subject, topic, sub_topic) NOT IN
         (SELECT level, subject, topic, sub_topic FROM canon_level_topics)
   GROUP BY 1,2,3,4 ORDER BY cnt DESC LIMIT 50;

If non-zero: STOP. Report rows to user. Do not proceed.
If zero: continue to Task 2.

═══════════════════════════════════════════════════════════════
TASK 2 — ADD FK CONSTRAINT
═══════════════════════════════════════════════════════════════

Run via supabase:execute_sql:

   ALTER TABLE question_bank
     ADD CONSTRAINT fk_qb_level_topic
     FOREIGN KEY (level, subject, topic, sub_topic)
     REFERENCES canon_level_topics(level, subject, topic, sub_topic)
     NOT VALID;

Then verify constraint exists:
   SELECT conname FROM pg_constraint WHERE conname='fk_qb_level_topic';

═══════════════════════════════════════════════════════════════
TASK 3 — UPDATE lib/api/quest-pedagogy.js
═══════════════════════════════════════════════════════════════

This file is the BACKEND mirror of public/js/syllabus-dependencies.js.
Both files must contain identical SYLLABUS_DEPENDENCIES objects.

Step 3a: Read public/js/syllabus-dependencies.js (the v5 file already deployed)
Step 3b: Read lib/api/quest-pedagogy.js
Step 3c: Find the existing SYLLABUS_DEPENDENCIES constant in quest-pedagogy.js
Step 3d: Replace it with the v5 object from syllabus-dependencies.js, preserving:
         - Any imports above it
         - Any functions/exports below it (e.g., runCognitiveDiagnosis,
           buildSocraticQuestPrompt, generateRemedialQuest)
         - The "use server" directive if present
         - Module export style (CommonJS vs ESM — match what's in the file)

Step 3e: Add a comment at the top of the constant:
         // v5.0 (2026-05-01) — must mirror public/js/syllabus-dependencies.js
         // Source of truth: this file. Frontend mirror updated separately.

Step 3f: Validate by running this in your shell:
   diff <(grep -A 200 "SYLLABUS_DEPENDENCIES = {" public/js/syllabus-dependencies.js | head -260) \
        <(grep -A 200 "SYLLABUS_DEPENDENCIES = {" lib/api/quest-pedagogy.js | head -260)
   
   Expected: only formatting/quote-style differences. No structural divergence.

═══════════════════════════════════════════════════════════════
TASK 4 — UPDATE js/exam-templates.js
═══════════════════════════════════════════════════════════════

Step 4a: Read js/exam-templates.js (it's v4.0, ~600+ lines per memory)

Step 4b: Search for these deprecated topic strings — list every line found:
   - 'Heat'
   - 'Light'
   - 'Forces'
   - 'Cells'
   - 'Speed'

Use grep:
   grep -n "'Heat'\|'Light'\|'Forces'\|'Cells'\|'Speed'" js/exam-templates.js

Step 4c: Replace per these rules. Each occurrence needs context — show the user
         each match before editing if uncertain:

   Topic 'Heat'   → 'Energy'        (P4 templates)
   Topic 'Light'  → 'Energy'        (P4 templates)
   Topic 'Forces' → 'Interactions'  (P6 templates only; remove from P5 if present)
   Topic 'Cells'  → 'Systems'       (move from P5 to P5 Systems)
   Topic 'Speed'  → DELETE entire entry (P6 templates lose Speed)

Step 4d: Add the four new Maths topics where appropriate in P1-P5 templates:
   'Money', 'Length and Mass', 'Volume of Liquid', 'Time'
   
   Reference canonical level mappings from canon_level_topics. Query:
   SELECT level, topic FROM canon_level_topics 
   WHERE subject='Mathematics' AND topic IN ('Money','Length and Mass','Volume of Liquid','Time')
   ORDER BY level, topic;

Step 4e: Add Visual Text comprehension at P5 only as a Comprehension section.

Step 4f: Bump version comment from v4.0 to v5.0 with date 2026-05-01.

Step 4g: Save. Run in browser DevTools console after deploy:
   import('/js/exam-templates.js').then(m => console.log(Object.keys(m)));
   Verify no errors.

═══════════════════════════════════════════════════════════════
TASK 5 — REGENERATE MANIFEST.md
═══════════════════════════════════════════════════════════════

Run via supabase:execute_sql:

   SELECT 
     level, subject, topic, sub_topic, 
     COUNT(*) AS question_count,
     SUM(CASE WHEN difficulty='Foundation' THEN 1 ELSE 0 END) AS foundation,
     SUM(CASE WHEN difficulty='Standard' THEN 1 ELSE 0 END) AS standard,
     SUM(CASE WHEN difficulty='Advanced' THEN 1 ELSE 0 END) AS advanced,
     SUM(CASE WHEN difficulty='HOTS' THEN 1 ELSE 0 END) AS hots,
     ARRAY_AGG(DISTINCT type) AS types_present
   FROM question_bank
   WHERE deprecated_at IS NULL
   GROUP BY level, subject, topic, sub_topic
   ORDER BY subject, level, topic, sub_topic;

Save the result as MANIFEST.md with this structure:

   # MANIFEST — Question Bank Inventory (v5.0)
   Generated: <today's date>
   Total questions: <SUM>
   Total (level, subject, topic, sub_topic) combinations: <COUNT distinct>
   
   ## Coverage matrix
   | Level | Subject | Topic | Sub_topic | F | S | A | H | Total |
   |-------|---------|-------|-----------|---|---|---|---|-------|
   ...

   ## Gaps (canon entries with zero questions)
   <run a LEFT JOIN canon_level_topics LEFT JOIN question_bank query 
    to find canon rows with 0 questions; list them as TODO targets>

═══════════════════════════════════════════════════════════════
TASK 6 — DEPLOY + SMOKE TEST
═══════════════════════════════════════════════════════════════

Step 6a: Conflict check
   grep -rn "<<<<<<\|=======\|>>>>>>>" pages/ js/ public/ lib/ \
     --include="*.html" --include="*.js" --include="*.md"
   Expected: no output.

Step 6b: Commit
   git add -A
   git commit -m "feat(canon): v5.0 migration complete

   - Stage 6.5 reconciliation (3,500 orphan rows fixed)
   - FK constraint added on question_bank(level,subject,topic,sub_topic)
   - lib/api/quest-pedagogy.js mirrors v5 SYLLABUS_DEPENDENCIES
   - js/exam-templates.js v5: Heat/Light → Energy, Forces → Interactions,
     Cells → Systems, Speed dropped, Money/Time/Measurement added
   - MANIFEST.md regenerated from current question_bank"
   
   git push origin main

Step 6c: Wait ~90s for Vercel deploy.

Step 6d: Browser smoke test (test student account):
   1. Visit /pages/subjects.html — verify Money/Length/Volume/Time tiles render at P1-P5
   2. Click Money at P3 — verify quiz loads with Money sub_topics
   3. Visit /pages/subjects.html at P6 Science — verify Energy + Interactions only
   4. Visit /pages/progress.html — verify dependency tree renders without errors
   5. Open DevTools → Network → verify canon_level_topics query succeeds
   6. Open DevTools → Console → verify no "topic not in canon" warnings

If any step fails: report exact error to user before proceeding.

═══════════════════════════════════════════════════════════════
ROLLBACK (only if Task 1 or 2 corrupts data)
═══════════════════════════════════════════════════════════════

Run via supabase:execute_sql:

   BEGIN;
   ALTER TABLE question_bank DROP CONSTRAINT IF EXISTS fk_qb_level_topic;
   TRUNCATE question_bank;
   INSERT INTO question_bank SELECT * FROM _backup_question_bank_20260501;
   TRUNCATE mastery_levels;
   INSERT INTO mastery_levels SELECT * FROM _backup_mastery_levels_20260501;
   COMMIT;

═══════════════════════════════════════════════════════════════
COMPLETION REPORT
═══════════════════════════════════════════════════════════════

After all 6 tasks pass, post a summary to the user with:
- Final question_bank row count (active + deprecated)
- canon_level_topics row count (must be 296)
- Number of orphan rows (must be 0)
- FK constraint status
- Files modified (paths only)
- Smoke test results (pass/fail per step)
- Any sub_topics in canon_level_topics with 0 questions (gaps to fill)
```