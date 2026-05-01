# QUEST_PAGE_SPEC.md — Plan Quest: The Third Pillar
**Version:** 2.0 — LOCKED
**Status:** Phase 1 + 2 complete · Phase 3 (wiring + pedagogy) in progress
**Updated:** 2026-04-26
**Bar:** "Ship complete" — the Plan Quest is the third pillar of Superholic Lab and must work end-to-end with paying customers
**Scope:** Live `/quest` Next.js route; multi-quest concurrency; pedagogical Day 1 / Day 2 / Day 3 contract; full gamification; cross-page integration; doc cascade

> This document is the **single source of truth** for the Plan Quest. Backend, frontend, and docs all defer to it. If anything in this file conflicts with a handoff prompt or another doc, this file wins. Pedagogy choices (§7) are non-negotiable; everything else is implementation detail.

---

## 0. What changed in v2.0

v1.1 was the visual-prototype spec. v2.0 is the production spec.

| Area | v1.1 | v2.0 |
|---|---|---|
| Concurrency | Single active quest at a time | **Up to 3 active, max one per subject** |
| Day gating | Implicit (steps can be done back-to-back) | **Day N+1 unlocks at SGT midnight AND requires Day N complete** |
| Day 1 mechanic | Single quiz, "foundation practice" | **≈12 graded items, ramping difficulty curve (4 easy → 4 standard → 4 hard) for single-item types; for multi-sub-question types (editing/cloze/comprehension) the outer row count is scaled down so total graded items stay ≈12, ramping where the bank allows** |
| Day 2 mechanic | Tutor session | **Socratic dialogue: Miss Wena references Day 1 wrong answers, leading questions only for first 5 turns, min 8 messages, auto-saves a Study Note on completion** |
| Day 3 mechanic | Mastery quiz | **8 questions (mostly hard + 2 transfer questions). Three-way exit branching by score band** |
| Quest creation | Progress.html buttons only | **Progress.html buttons + auto-modal after any quiz with score ≤ 70%** |
| Day 3 exit | Always "complete" | **Branches: ≥85% mastered · 70-84% slight improvement · <70% student chooses (redo / slight / no improvement)** |
| Quest lineage | None | **`parent_quest_id` tracks redo lineage for analytics + parent visibility** |

Everything else from v1.1 — XP rules, level math, badge list, avatar pipeline, privacy policy, file manifest — is preserved unchanged.

---

## 1. First principles (carried from v1.1, expanded)

1. **Quest is the screenshot page.** Marketing asset. Visual fidelity non-negotiable.
2. **Quest is not a UI wrapper around quiz/tutor — it's a pedagogical framework that uses them as building blocks.** This is the IP.
3. **Day 1 = practice. Day 2 = teach. Day 3 = prove.** This sequence is research-backed (mastery learning, Socratic method, retrieval practice). Don't dilute.
4. **Honest exits beat fake celebrations.** The Day 3 three-way exit (mastered / slight / no improvement) generates real learning signal. A platform that always says "Great job!" produces no data. This produces gold.
5. **Spaced retrieval is enforced, not suggested.** Day N+1 unlocks at midnight. The spacing is the medicine.
6. **Concurrency reflects reality.** PSLE prep spans 3 subjects. Force a child to finish a Maths quest before starting an English one and they'll abandon the platform.
7. **Gamification rewards real learning, not clicks.** XP comes from completing meaningful actions. Server-validated allow-list. Anti-cheat by default.
8. **Privacy is a feature.** Singapore parents are PDPA-aware. Avatar pipeline's privacy story is a marketing asset.
9. **One spec, two systems.** Vanilla HTML for content-driven app pages; Next.js for `/quest`. Boundary documented.

---

## 2. Locked decisions

### Decisions locked 2026-04-26 (Phase 3)

| # | Decision | Locked value |
|---|---|---|
| P1 | Quest concurrency | Up to 3 active per student. Maximum one per subject. Enforced by `quest_eligibility` table at DB level. |
| P2 | Quest creation triggers | (a) Progress.html "Generate Quest" buttons on weak topics. (b) Auto-modal after any quiz finishes with score ≤ 70% offering "Want a 3-day plan for [topic]?" |
| P3 | Day gating rule | Day N+1 unlocks when BOTH conditions met: (a) Day N has been completed AND (b) wall clock has crossed SGT midnight since Day N completion. No "skip cooldown" button — spacing is non-negotiable. |
| P4 | Day 1 pedagogy | ≈12 graded items, ramping difficulty: 4 Foundation → 4 Standard → 4 Advanced/HOTS. For single-item types (mcq, short_ans, word_problem, open_ended) this is 12 outer questions. For multi-sub-question types — editing/cloze (~10 items per row) and comprehension (~5 items per row) — the server scales the outer row count down (`questsBatch._subQuestionsPerItem`) so total graded items stay near 12; band ramping is preserved where the bank has rows in multiple bands, otherwise collapsed to whatever bands exist. Question order is fixed (no shuffling within bands). Wrong answers logged to `quest.day1_wrong_attempts` for Day 2 carryover. No passing score required — the mechanic is exposure + diagnostic capture. |
| P5 | Day 2 pedagogy | Socratic dialogue with Miss Wena. Custom system prompt overlay (`SOCRATIC_QUEST_PROMPT`) instructs her to ask leading questions for the first 5 student turns, never reveal answers in that window, anchor on Day 1 wrong-answer patterns. Minimum 8 message exchanges before "Mark Day 2 Complete" enables. On completion, auto-summarise to Study Note (calls existing `/api/summarize-chat`) — saved to Backpack as the quest's reference material. |
| P6 | Day 3 pedagogy | 8 questions: 6 hard from quest topic + 2 transfer questions from a related topic (tests depth). Score thresholds: ≥85% → `mastered`. 70-84% → `slight_improvement` (auto-applied). <70% → student picks: `redo` (spawns child quest with `parent_quest_id` linkage) / `slight_improvement` (self-report) / `no_improvement` (honest exit, suggests parent/tutor follow-up). |
| P7 | Time zone | All "midnight" wall clocks resolve to **Asia/Singapore (SGT, UTC+8)**. Consistent across all students regardless of geography. |
| P8 | Gamification scope | Full layer this sprint. XP, level, streak, badges, level-up celebrations, badge unlock animations all live. Avatar pipeline deferred until post-launch (per LAUNCH_PLAN). |

### Decisions carried forward from v1.1

| # | Decision | Locked value |
|---|---|---|
| Q1 | Migration order | 015 (mastery_levels retroactive) → 016 (gamification) → 017 (badge seeds). **All applied to production 2026-04-25.** New migration 018 added in v2.0. |
| Q2 | Avatar reroll auto-suggest | Every 5th completed quest. Deferred to post-launch. |
| Q3 | Badge count for launch | 25 high-quality + 4 secret = 29 total. Curated list in §11. |
| Q4 | Avatar cost ceiling | $0.20/parent/month. Deferred to post-launch. |
| Q5 | mastery_gain XP | 75 XP per AL band jump. Daily cron diffs `mastery_levels_snapshots`. |
| Q6 | Privacy disclosure tone | As drafted in §12. |
| Q7 | Avatar aesthetic | Halo Reach + Genshin Impact. Deferred to post-launch. |
| Q8 | Phase gate process | Visual phases → Vercel preview demo. Backend → code review in chat. Integration → both. |

---

## 3. Table of contents

1. URL & routing contract
2. Data contract (schema additions for v2.0)
3. Migration plan (016 applied + new 018)
4. API contracts (8 new + 2 modified handlers)
5. The pedagogy contract — Day 1 / Day 2 / Day 3 mechanics
6. Quest lifecycle state machine
7. Concurrency & eligibility rules
8. Cross-page integration
9. Gamification system
10. Component inventory (Next.js + vanilla)
11. 25 launch badges + 4 secret
12. Avatar pipeline (deferred)
13. Parent FAQ (this becomes the public-facing FAQ)
14. CLAUDE.md & docs update plan
15. Verification gate — the Lily Tan E2E test
16. Phase 3 execution plan

---

## 4. URL & routing contract

### Canonical URLs

```
/                                   → Next.js (marketing homepage)
/quest                              → Next.js (canonical quest page)
/quest?id=<quest_uuid>              → Render specific quest by id
/quest?id=<quest_uuid>&completed=N  → Trigger ReturningCelebration for step N just done
/quest?id=<quest_uuid>&trigger=<quiz|tutor>&score=<pct>
                                      Full return URL from quiz/tutor on quest step finish
/pages/progress.html                → vanilla (existing)
/pages/quiz.html?from_quest=<id>&step=<n>
                                      Quiz session running as part of a quest
/pages/tutor.html?from_quest=<id>&step=<n>&mode=socratic
                                      Tutor session running as part of a quest (Day 2)
```

### `/quest` resolution rules

When user lands on `/quest` with no `?id=`:

1. Server fetches all `active` quests for the active student
2. **0 active quests** → render Empty State
3. **1 active quest** → render that quest directly (no redirect; just use the one)
4. **2-3 active quests** → render Quest Picker tabs at top (subject-coloured chips), default to most recently advanced quest
5. **`?id=<uuid>` provided** → render that specific quest (ignore "most recent" rule)

### Auth guard

Server-side via Supabase SSR session check. No auth = redirect to `/pages/login.html?redirect=/quest`. Quest can never be viewed unauthenticated — we don't even render the page shell.

### Active student resolution

Same logic as `progress.js`:

```js
// 1. URL ?student=<uuid> wins (parent switching kids on Family Plan)
// 2. localStorage 'shl_active_student_id' fallback
// 3. First student.id ordered by created_at for the parent
```

`/quest` reads then writes `localStorage.shl_active_student_id` so subsequent navigations are consistent.

---

## 5. Data contract

### Tables modified for v2.0

#### `remedial_quests` — new columns added in migration 018

```sql
ALTER TABLE remedial_quests
  ADD COLUMN IF NOT EXISTS day_completed_at jsonb NOT NULL DEFAULT '{}',
  -- Map of step_index → ISO timestamp. Example:
  -- {"0": "2026-04-26T14:30:00+08:00", "1": "2026-04-27T16:12:00+08:00"}
  -- Used to enforce: step N+1 unlocks when SGT-midnight has passed since day_completed_at[N]

  ADD COLUMN IF NOT EXISTS day1_wrong_attempts jsonb NOT NULL DEFAULT '[]',
  -- Array of {question_id, question_text, student_answer, correct_answer, topic} 
  -- captured from Day 1 wrong answers. Day 2 tutor reads this for Socratic anchoring.

  ADD COLUMN IF NOT EXISTS day3_score numeric(5,2),
  -- The percentage score from Day 3 quiz; drives outcome branching.

  ADD COLUMN IF NOT EXISTS day3_outcome text
    CHECK (day3_outcome IN ('mastered','slight_improvement','no_improvement','redo') 
           OR day3_outcome IS NULL),

  ADD COLUMN IF NOT EXISTS parent_quest_id uuid REFERENCES remedial_quests(id),
  -- If this quest was created via "redo", points to original. Enables lineage analytics.

  ADD COLUMN IF NOT EXISTS abandoned_at timestamptz;
  -- Set when quest moves to status='abandoned'.
```

#### `remedial_quests.steps` — richer config jsonb

The shape becomes:

```jsonc
[
  {
    "day": 1,
    "type": "quiz",
    "title": "Foundation → Mastery Practice",
    "description": "12 ramped questions. Easy first, then build up.",
    "estimated_minutes": 18,
    "action_url": "/pages/quiz.html?subject=mathematics&topic=fractions&level=primary-5",
    "config": {
      "question_count": 12,
      "difficulty_curve": "ramping",     // 'ramping' | 'mixed' | 'mastery'
      "difficulty_bands": ["Foundation","Foundation","Foundation","Foundation",
                           "Standard","Standard","Standard","Standard",
                           "Advanced","Advanced","HOTS","HOTS"],
      "topic": "Fractions",
      "min_passing_score": null            // null on Day 1; never blocks completion
    }
  },
  {
    "day": 2,
    "type": "tutor",
    "title": "Socratic Dialogue with Miss Wena",
    "description": "Talk through what tripped you up yesterday. Miss Wena guides; you reason.",
    "estimated_minutes": 15,
    "action_url": "/pages/tutor.html?subject=mathematics&topic=fractions",
    "config": {
      "scaffold_mode": "socratic",         // tutor.js switches to SOCRATIC_QUEST_PROMPT
      "min_messages": 8,                    // 4 user + 4 assistant; 'Mark Complete' disabled below this
      "topic_anchor": "Fractions",
      "diagnostic_carryover": true,        // tutor pulls quest.day1_wrong_attempts into context
      "auto_save_note": true               // calls /api/summarize-chat on completion
    }
  },
  {
    "day": 3,
    "type": "quiz",
    "title": "Mastery Trial",
    "description": "8 questions. Mostly hard, plus 2 transfer questions to test depth.",
    "estimated_minutes": 18,
    "action_url": "/pages/quiz.html?subject=mathematics&topic=fractions&level=primary-5&mode=mastery",
    "config": {
      "question_count": 8,
      "difficulty_curve": "mastery",
      "difficulty_bands": ["Standard","Advanced","Advanced","Advanced",
                           "HOTS","HOTS","Advanced_transfer","HOTS_transfer"],
      "transfer_topics": ["Decimals","Ratio"],   // 2 transfer questions sampled from these
      "topic": "Fractions",
      "min_passing_score": 70                    // not a blocker; drives outcome branching
    }
  }
]
```

The `/api/generate-quest` handler builds this config server-side based on BKT diagnosis. Question Factory does NOT need to invent new question content — the config slices the existing `question_bank` table by `(subject, topic, level, difficulty)` filters.

#### NEW table: `quest_eligibility` (concurrency enforcer)

```sql
CREATE TABLE quest_eligibility (
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject    text NOT NULL CHECK (subject IN ('mathematics','science','english')),
  quest_id   uuid NOT NULL REFERENCES remedial_quests(id) ON DELETE CASCADE,
  PRIMARY KEY (student_id, subject)
);

ALTER TABLE quest_eligibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parents_own_quest_eligibility" ON quest_eligibility FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));
```

**Why this table:** Prevents race condition where a kid double-clicks "Generate Quest" and creates two simultaneous Maths quests. The PRIMARY KEY (student_id, subject) means the second insert fails atomically. Application code returns 409 Conflict with the existing quest_id so the UI can offer "View existing quest →".

The `ON DELETE CASCADE` means abandoning or completing a quest automatically frees the slot (the row is deleted by the application code on status change).

---

## 6. Migration plan

### Already applied to production (2026-04-25)
- `015_mastery_levels.sql` — retroactive
- `016_quest_gamification.sql` — XP, streaks, badges, avatar audit, mastery snapshots
- `017_seed_badges.sql` — 29 badge definitions

### NEW: `018_quest_pedagogy.sql`

```sql
-- ============================================================
-- 018_quest_pedagogy.sql
-- Pedagogy fields on remedial_quests + concurrency enforcer
-- ============================================================

-- ─── 1. New columns on remedial_quests ──────────────────────
ALTER TABLE remedial_quests
  ADD COLUMN IF NOT EXISTS day_completed_at jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS day1_wrong_attempts jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS day3_score numeric(5,2),
  ADD COLUMN IF NOT EXISTS day3_outcome text 
    CHECK (day3_outcome IN ('mastered','slight_improvement','no_improvement','redo') 
           OR day3_outcome IS NULL),
  ADD COLUMN IF NOT EXISTS parent_quest_id uuid REFERENCES remedial_quests(id),
  ADD COLUMN IF NOT EXISTS abandoned_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_remedial_quests_parent_lineage 
  ON remedial_quests (parent_quest_id) 
  WHERE parent_quest_id IS NOT NULL;

-- ─── 2. quest_eligibility table ─────────────────────────────
CREATE TABLE IF NOT EXISTS quest_eligibility (
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject    text NOT NULL CHECK (subject IN ('mathematics','science','english')),
  quest_id   uuid NOT NULL REFERENCES remedial_quests(id) ON DELETE CASCADE,
  PRIMARY KEY (student_id, subject)
);

ALTER TABLE quest_eligibility ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parents_own_quest_eligibility" ON quest_eligibility;
CREATE POLICY "parents_own_quest_eligibility" ON quest_eligibility FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));

-- ─── 3. Backfill: register existing active quests in eligibility ──
-- Best-effort: for each active quest, register it in eligibility.
-- ON CONFLICT DO NOTHING handles edge case where two active quests 
-- exist for the same (student, subject) — the older one wins.
INSERT INTO quest_eligibility (student_id, subject, quest_id)
SELECT student_id, subject, id 
FROM remedial_quests 
WHERE status = 'active'
ORDER BY created_at ASC
ON CONFLICT (student_id, subject) DO NOTHING;

-- ─── 4. VERIFICATION QUERIES (run manually after applying) ──
-- SELECT COUNT(*) FROM remedial_quests WHERE status='active';
-- SELECT COUNT(*) FROM quest_eligibility;
-- -- These should match (or eligibility ≤ quests if duplicates existed)
--
-- SELECT student_id, subject, COUNT(*) 
-- FROM remedial_quests WHERE status='active' 
-- GROUP BY student_id, subject HAVING COUNT(*) > 1;
-- -- Should return 0 rows after this migration (the unique constraint enforces it going forward)
```

### Apply order
Migration 018 applies cleanly to current production (no breaking changes — additive).

Apply via Supabase MCP `apply_migration` (tracked) or SQL Editor.

---

## 7. The pedagogy contract — the IP

This section is **non-negotiable** because it's what makes Quest defensible. Every quest follows this.

### Day 1 — Foundation Climb (Practice)

**Purpose:** Rebuild the foundation. Prove to the student "I can do this." Capture diagnostic data for Day 2.

**Mechanic:**

- ≈12 **graded items**, **ramping difficulty curve**: 4 Foundation → 4 Standard → 4 Advanced (last 2 may be HOTS). For single-item types (mcq, short_ans, word_problem, open_ended) this maps 1:1 to 12 outer rows. For multi-sub-question types — editing and cloze (~10 sub-items each) and comprehension (~5 sub-items) — `questsBatch._subQuestionsPerItem` scales the outer row count down so the student-facing item count stays close to 12 (e.g. P6 English Editing → 2-3 outer rows, ~20-30 graded sub-items). Band ramping is preserved when the bank has rows across bands; if a multi-sub-question topic only has one band approved, the curve collapses to that band.
- Question order is fixed within bands. No shuffling. The slow climb is the point.
- Selected from `question_bank` filtered by `(quest.subject, quest.topic, quest.level)` and the difficulty band per slot
- **Wrong answers feed Day 2 tutor context.** On submit, quiz.js writes each wrong attempt to `remedial_quests.day1_wrong_attempts`:
  ```jsonc
  [
    { 
      "question_id": "q_42", 
      "question_text": "If 3/4 of a pizza is shared equally between 2 friends, how much does each get?",
      "student_answer": "3/8", 
      "correct_answer": "3/8",  // example: this would be a right answer; only wrongs go in
      "topic": "Fractions",
      "sub_topic": "Division of fractions",
      "explanation_for_wrong": "Wrong because... (from question_bank.wrong_explanations)"
    }
  ]
  ```
- **No passing score blocks completion.** All graded items must be answered (no skipping). Day 1 is exposure + diagnostic; the gate is participation.
- **XP:** Standard quiz_complete (10 XP) + score-based bonus (per gamification table) + quest_step_complete (50 XP).

**Why it works:** Mastery learning research (Bloom 1968, Guskey 2010) shows ramping practice rebuilds confidence faster than random difficulty. The early easy wins are pedagogically essential, not concessions.

### Day 2 — Socratic Dialogue (Tutor)

**Purpose:** Diagnose the conceptual misunderstanding through interview, not lecture. Force the student to articulate.

**Mechanic:**

- Tutor session opens with Miss Wena referencing **specific Day 1 wrong answers**
- Custom system prompt overlay `SOCRATIC_QUEST_PROMPT` injected by `/api/chat` when called with `from_quest=<id>` parameter:
  > For the first 5 student turns, you ask leading questions only — never give the answer. Anchor on the specific wrong reasoning shown in {{day1_wrong_attempts}}. Confirm understanding only when the student articulates the underlying concept correctly twice.
- Minimum 8 message exchanges before "Mark Day 2 Complete" enables (4 user + 4 assistant)
- **Auto-save Study Note on completion.** Calls existing `/api/summarize-chat` with the full conversation. Note saved to `study_notes` with `subject=quest.subject, topic=quest.topic`. Visible in Backpack on progress.html as the quest's reference material.
- **XP:** 50 XP for completing Day 2 step + ai_tutor_message XP per message (capped per existing rules).

**Why it works:** Active recall + explanation generation (Chi 1989; Roediger 2006) outperforms passive instruction by 2-3× retention. This is the part competitors don't do.

### Day 3 — Mastery Trial (Assessment)

**Purpose:** Prove mastery — or honestly admit it's not there yet.

**Mechanic:**

- 8 questions. 6 from quest topic at hard/HOTS difficulty + 2 transfer questions from related topic. Transfer questions test depth: can the student apply the concept to a novel context?
- Transfer topic selection: derived from `SYLLABUS_DEPENDENCIES` map in `lib/api/handlers.js`. For Fractions → transfer from Decimals or Ratio. For Cells → transfer from Diversity. Etc.
- Score calculated; outcome branched:

| Day 3 score | Outcome | Behaviour |
|---|---|---|
| ≥ 85% | `mastered` | Auto-applied. Big XP bonus (+200 quest_complete + +100 mastered bonus). Badge candidates: `weakness_crusher`, `quest_complete`, plus topic-specific. Closes quest, frees `quest_eligibility` slot, suggests new quest in same or different subject. |
| 70-84% | `slight_improvement` | Auto-applied. Standard quest_complete XP (+200). Encouragement message: "Solid progress. Recommend revisiting your Day 2 study note this week." Closes quest. |
| < 70% | **Student chooses** (3-way exit modal) | See below. |

**The 3-way exit (only when Day 3 score < 70%):**

Modal appears with three choices, each with clear consequences:

1. **"Try this quest again — Redo with new questions"**
   - Calls `/api/generate-quest` with `parent_quest_id=<original.id>` and same topic
   - New quest spawned. Question pool refreshed (excludes Day 1 + Day 3 questions from this quest to avoid memorisation effect)
   - Original quest closes with `day3_outcome='redo'`
   - XP: +100 (the redo XP — rewards growth mindset)
   - **Slot remains occupied** (the new quest takes the original quest's `quest_eligibility` slot atomically)

2. **"It improved a bit — close this quest"**
   - Self-reported slight improvement
   - `day3_outcome='slight_improvement'`. Reduced XP (+100 quest_complete only, no bonus)
   - Closes quest, frees slot

3. **"I'm still struggling — close this quest"**
   - Honest exit
   - `day3_outcome='no_improvement'`. No XP for Day 3 step (Day 1+2 XP retained)
   - Closes quest, frees slot
   - Triggers a soft message in parent dashboard: "Lily marked herself as still struggling on Fractions. Consider scheduling a tutor session or speaking with her teacher."
   - This is the **most valuable signal** the platform produces — protect it. Don't dilute with empty encouragement.

**Why the 3-way exit is masterclass:** Letting the student choose between "redo" and "honest defeat" respects their agency and gives parents real signal. A platform that always says "Great job!" produces no learning data. This produces gold.

### What gets passed to question selectors

When quiz.js loads a quest step, it calls `/api/quiz/quest-batch` (NEW endpoint) with `quest_id` and `step_index`. Server returns the exact 12 / 8 questions for that step, deterministically ordered. The same quiz, re-opened mid-session, returns the same questions in the same order. Day 1 wrong attempts are not re-shuffled.

---

## 8. Quest lifecycle state machine

```
             [User enters /quest]
                     │
                     ▼
         ┌──────────────────────────┐
         │ Server fetches quests    │
         │ for active student       │
         │ where status='active'    │
         └──────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    0 quests    1 quest      2-3 quests
        │            │            │
        ▼            ▼            ▼
    EMPTY        SINGLE       PICKER + SINGLE
    STATE        STATE        STATE (default to
                              most-recent)
        │            │            │
        │            ▼            │
        │       ┌─────────────────┴──────┐
        │       │ Day N status check     │
        │       └────────────────────────┘
        │            │
        │     ┌──────┼──────┬───────────┐
        │     ▼      ▼      ▼           ▼
        │   Active Locked Day3       Quest
        │   day    (date Outcome     Complete
        │          gate) Pending     (closed)
        │
        │
        └─→ "Find your weakness →"
            link to /pages/progress.html


On step complete (incoming from quiz.js or tutor.js):
  /quest?id=X&completed=N&trigger=quiz&score=78
        │
        ▼
   1. POST /api/quests/{id}/advance-step  
   2. Server: validate, enforce gating, advance current_step, 
      record day_completed_at[N] = now() (SGT),
      award XP, evaluate badges
   3. If N was final step and score branches:
      - ≥85%: auto-close (mastered)
      - 70-84%: auto-close (slight)
      - <70%: return outcome_pending=true so client shows 3-way modal
   4. ReturningCelebration + level-ups + badges shown
   5. Client renders updated state


Day gating logic:
   step N+1 unlocked iff:
     (a) day_completed_at[N] exists (Day N done)
     AND
     (b) NOW() (in SGT) ≥ midnight SGT of (day_completed_at[N] + 1 day)
   
   Otherwise: step N+1 shown locked with countdown 
   "Unlocks in 5h 23m" or "Unlocks tomorrow at midnight SGT"
```

---

## 9. Concurrency & eligibility rules

### Hard limits
- **Max 3 active quests per student**
- **Max 1 active quest per (student, subject) pair**
- Subject values: `mathematics` | `science` | `english` (lowercase, exactly)

### Enforcement layer cake

**Layer 1: DB constraint** (the source of truth)
- `quest_eligibility (student_id, subject)` is the PRIMARY KEY
- Inserting a 2nd row for same pair fails atomically with PG error 23505 (unique violation)

**Layer 2: API handler** (the user-friendly translator)
- `handleGenerateQuest` catches PG 23505 and returns:
  ```json
  HTTP 409 Conflict
  { "error": "subject_slot_taken", 
    "existing_quest_id": "<uuid>",
    "subject": "mathematics",
    "message": "An active Maths quest already exists. View it or abandon it before starting a new one." }
  ```

**Layer 3: UI** (preventive)
- Progress.html "Generate Quest" buttons grey out with tooltip when subject slot taken
- Auto-modal after low quiz score offers `?topic=fractions` only if Maths slot is free; else offers a different quest framing or quietly skips the modal

### State transitions affecting eligibility

| Quest transition | quest_eligibility action |
|---|---|
| created (status=active) | INSERT row for (student, subject, quest_id) |
| status: active → completed | DELETE row matching (student, subject, quest_id) |
| status: active → abandoned | DELETE row matching (student, subject, quest_id) |
| Day 3 outcome = redo | DELETE old row, INSERT new row pointing to new quest. Both in same transaction. |

All transitions in `lib/api/handlers.js` use a Postgres transaction to ensure consistency.

---

## 10. API contracts

### Existing handlers (modified for v2.0)

#### `POST /api/generate-quest` — MODIFIED

New behaviour:
1. Check `quest_eligibility` for (student, subject). If taken → return 409 with existing quest_id.
2. Build richer `steps` config (per §5 schema). Pull difficulty bands, transfer topics, etc.
3. Insert `remedial_quests` AND `quest_eligibility` in a transaction.
4. Award no XP yet (XP comes from completing steps).

Body unchanged: `{ student_id, subject, level, topic, trigger_score, trigger_attempt_id, parent_quest_id? }`

`parent_quest_id` is optional — only present when this is a "redo" spawn.

Response: `{ quest: <full quest object including steps with config> }`

#### `POST /api/chat` — MODIFIED

When called with `from_quest=<id>` query param and the quest's current step is Day 2 with `scaffold_mode='socratic'`:
1. Server fetches `remedial_quests.day1_wrong_attempts`
2. Composes system prompt by appending `SOCRATIC_QUEST_PROMPT` template with day1_wrong_attempts injected
3. Tracks message count for the session (server-side, not client) — used to gate "Mark Day 2 Complete"

System prompt template:

```
SOCRATIC_QUEST_PROMPT (overrides default Miss Wena prompt for first 5 turns):

You are Miss Wena in Socratic Quest mode. The student is on Day 2 of their 
remedial quest for {{topic}}.

YESTERDAY they got these questions wrong on Day 1:
{{day1_wrong_attempts JSON formatted as bullet list}}

For your FIRST 5 RESPONSES in this conversation:
- Ask leading questions only. Never give the answer.
- Anchor your questions on the SPECIFIC wrong reasoning shown above. 
  Don't ask generic questions; ask about THIS student's THIS mistake.
- If the student gives a wrong answer, gently probe: "What made you think that?"
- Confirm correct understanding only when the student articulates the 
  concept correctly TWICE in different ways.

After 5 turns, switch back to your normal scaffolded teaching style. The 
student should feel like they discovered the answer, not received it.

Tone: warm, curious, never patronising. Light Singlish acceptable.
```

### NEW handlers

#### `GET /api/quests` — list active quests for student
Auth: bearer token. 
Query: `?student_id=<uuid>` (optional; defaults to caller's first child).
Response:
```json
{
  "quests": [
    { "id": "...", "subject": "mathematics", "topic": "Fractions", 
      "current_step": 1, "quest_title": "...", "steps": [...], 
      "day_completed_at": {...}, "created_at": "..." },
    ...up to 3
  ]
}
```

#### `GET /api/quests/:id` — fetch single quest with HUD + diagnosis
Returns the quest plus everything `/quest` page needs:
```json
{
  "quest": { ...full quest object... },
  "student": { "id", "name", "level", "photo_url" },
  "hud": { "level", "rank", "total_xp", "xp_in_level", "xp_to_next_level", 
           "streak_days", "shield_count", "badges_count" },
  "diagnosis": { "topic", "current_al", "current_pct", "unlocks": [...] },
  "day_unlock_status": {
    "0": { "unlocked": true,  "completed": true,  "completed_at": "..." },
    "1": { "unlocked": true,  "completed": false, "unlocks_at": null },
    "2": { "unlocked": false, "completed": false, "unlocks_at": "2026-04-28T16:00:00Z" }
  }
}
```

The `day_unlock_status` is computed server-side per the gating rules in §8. Client just renders.

#### `POST /api/quests/:id/advance-step` — advance, award XP, evaluate badges
Called by quiz.js / tutor.js on quest step completion.

Body:
```json
{ 
  "step_index": 0, 
  "trigger": "quiz" | "tutor",
  "score": 78,
  "metadata": { ...optional, e.g. wrong_attempts: [...] for Day 1... }
}
```

Server side, in a transaction:
1. Verify quest belongs to caller's child via RLS
2. Verify `step_index === current_step` (idempotent — repeat calls are no-ops)
3. Verify gating: if `step_index > 0`, check that `day_completed_at[step_index-1]` exists AND we've crossed midnight SGT
4. Update `current_step += 1`, set `day_completed_at[step_index] = now()`
5. If Day 1 and `metadata.wrong_attempts` provided → store in `day1_wrong_attempts`
6. If was final step (step_index === 2):
   - Save `day3_score = score`
   - If score ≥ 85: set `status='completed'`, `day3_outcome='mastered'`, DELETE quest_eligibility row
   - If 70 ≤ score < 85: set `status='completed'`, `day3_outcome='slight_improvement'`, DELETE quest_eligibility row
   - If score < 70: leave `status='active'`, set NO `day3_outcome` yet — return `outcome_pending: true`. Frontend shows 3-way modal. Slot remains taken.
7. Call `/api/award-xp` internally for `quest_step_complete` (50 XP) + bonuses
8. Evaluate badges via `lib/api/badge-engine.js`, INSERT into student_badges, return list of newly earned
9. Build response

Response:
```json
{
  "quest": { ...updated... },
  "xp_awarded": 200,
  "level_before": 4, "level_after": 5,
  "leveled_up": true,
  "rank_before": "Cadet", "rank_after": "Operator",
  "badges_earned": [
    { "id": "first_quest", "name": "First Mission", "description": "...", "rarity": "rare", "xp_reward": 150 }
  ],
  "outcome_pending": false   // true only if Day 3 score < 70
}
```

#### `POST /api/quests/:id/day3-outcome` — submit student choice on poor Day 3 score
Only valid when Day 3 was completed with `score < 70` and `day3_outcome IS NULL`.

Body: `{ "outcome": "redo" | "slight_improvement" | "no_improvement" }`

Server:
- If `redo`: 
  - Set `day3_outcome='redo'` on original. Set `status='completed'` (the original is closed).
  - Spawn new quest via `/api/generate-quest` internally with `parent_quest_id=<original.id>`. Atomically swap eligibility row to point to new quest.
  - Return `{ original_quest_id, new_quest_id }`. Frontend redirects to `/quest?id=<new_quest_id>`.
- If `slight_improvement` or `no_improvement`: 
  - Set the outcome, `status='completed'`. DELETE quest_eligibility row.
  - Award XP per outcome (slight: +100; no_improvement: +0).
  - Return updated quest.

#### `POST /api/quests/:id/abandon` — abandon active quest
Body: empty.

Server:
- Verify caller owns. Verify status='active'.
- Set `status='abandoned'`, `abandoned_at=now()`. DELETE quest_eligibility row. No XP refund.
- Return `{ success: true }`.

#### `POST /api/award-xp` — single source of truth for XP grants
Used by quiz.js, tutor.js, exam.js, the advance-step handler internally, and the daily mastery cron.

Body:
```json
{
  "student_id": "...",
  "event_type": "quiz_complete" | "quest_step_complete" | ...,
  "xp_amount": 25,        // server validates against allow-list
  "event_id": "<idempotency key>",  // optional but recommended; e.g. quiz_attempt_id
  "metadata": { ... }
}
```

Anti-cheat rules (server-side):
- Allow-list per `event_type` (see §10 v1.1). If `xp_amount` exceeds max for type → reject.
- `event_id` deduplication: if (student_id, event_type, event_id) already in xp_events → return cached result, don't double-award.
- For `quest_step_complete`: verify the quest's `current_step` in DB is consistent with claim (step was completed within last 60s).
- For `mastery_gain`: only the daily cron path can emit (server verifies internal call).

Response:
```json
{
  "total_xp_after": 1490,
  "xp_in_level_after": 290,
  "level_after": 5,
  "leveled_up": true,
  "rank_after": "Operator",
  "badges_earned": [...]
}
```

#### `POST /api/quests/quiz-batch` — fetch the question set for a quest step
Called by quiz.js when loading a quest-attached quiz session.

Body: `{ quest_id, step_index }`

Server:
- Read quest steps[step_index].config
- Query `question_bank` filtered by topic + level + difficulty bands as specified
- For Day 3: also pull transfer questions from `transfer_topics`
- Return deterministic ordering (sorted by question_id then sliced) so re-opening returns the same set

Response: `{ questions: [ ... 12 or 8 question objects ... ] }`

The standard `/api/quiz` endpoint is used for non-quest quizzes; this one is quest-specific to enforce the difficulty curve.

### Updates to `api/index.js` (route registry)

```js
// Existing routes preserved.
// Add to switch:
case 'quests':                    return handleQuestsRouter(req, res);  // dispatches sub-routes
case 'award-xp':                  return handleAwardXP(req, res);
```

`handleQuestsRouter` parses the URL further:
- `GET /api/quests` → list
- `GET /api/quests/:id` → fetch single
- `POST /api/quests/:id/advance-step` → advance
- `POST /api/quests/:id/day3-outcome` → branch
- `POST /api/quests/:id/abandon` → close
- `POST /api/quests/quiz-batch` → questions

This keeps Vercel function count at 1.

`vercel.json` rewrites: add wildcard `/api/quests/:path*` → `/api/index.js`.

---

## 11. Cross-page integration

### `js/quiz.js` changes (Backend stream owns)

**On init:**
- Read `?from_quest=<id>&step=<n>` from URL. If present:
  - Set `state.fromQuest = { questId, stepIndex }`
  - Call `POST /api/quests/quiz-batch { quest_id, step_index }` instead of standard question fetch
  - UI banner top-of-page: "Plan Quest · Day {n+1} · {topic}"
  - Disable subject/topic switcher (this is a guided session)

**On submit:**
- After standard save (existing flow):
- If `state.fromQuest`:
  1. Build `wrong_attempts` array from `state.resultsObj`
  2. POST `/api/quests/<id>/advance-step` with `{ step_index, trigger:'quiz', score, metadata: { wrong_attempts } }`
  3. Award XP via the response (already included)
  4. Show quest-specific transition: "Day {n+1} complete! Returning to your quest…" — 2s delay
  5. Redirect to `/quest?id=<id>&completed=<step_index>&trigger=quiz&score=<score>`
- Else (non-quest quiz):
  1. Call `POST /api/award-xp` for `quiz_complete` (existing flow)
  2. Show outcome screen
  3. **If score ≤ 70%**: Show modal "Want a 3-day Plan Quest for {topic}? [Yes, generate] [Not now]"
     - "Yes" → check eligibility, then `POST /api/generate-quest`, then redirect to `/quest?id=<new_id>`

### `js/tutor.js` changes (Backend stream owns)

**On init:**
- Read `?from_quest=<id>&step=<n>&mode=socratic`. If present:
  - Set `state.fromQuest = { questId, stepIndex, mode: 'socratic' }`
  - Pass `from_quest=<id>` on every `/api/chat` call so server applies SOCRATIC_QUEST_PROMPT
  - UI banner: "Plan Quest · Day 2 · {topic} — Talk through what tripped you up yesterday"
  - Server-side message count tracker enabled (returned in /api/chat response: `{ reply, quest_message_count }`)
  - "Mark Day 2 Complete" button (replaces standard "Save Notes"): disabled until message count ≥ 8

**On "Mark Day 2 Complete":**
1. Call `/api/summarize-chat` (existing) — saves Study Note tagged with quest_id
2. Call `POST /api/quests/<id>/advance-step` with `{ step_index, trigger:'tutor', score: null }`
3. XP award + level-up data in response
4. Redirect to `/quest?id=<id>&completed=<step_index>&trigger=tutor`

### `js/progress.js` changes (Frontend stream owns)

**`renderQuestMap()` → rewritten as `renderQuestTray()`:**
- Renders up to 3 active quest tiles in a row (subject-coloured chips: Maths sage, Science amber, English mint)
- Each tile: subject icon + topic + "Day X of 3" + thin progress bar
- Click tile → `/quest?id=<id>`
- Empty state: "No active quests. Find a weakness below to start one." (links to weakness section)

**Weakness section "Generate Quest" buttons:**
- Disabled state with tooltip if subject slot taken: "You already have an active Maths quest. [Continue →]"
- Enabled click: POST `/api/generate-quest`. On success: redirect to `/quest?id=<new_id>`
- On 409: show toast "You already have an active Maths quest" + button "View existing quest →"

**HUD strip (top of progress.html):**
- Compact version of the /quest page HUD: avatar, level, XP bar, streak
- Reuses same React component? No — progress.html is vanilla. Either: (a) port the component or (b) build a vanilla equivalent. Either is fine.
- Recommend: add `js/hud-strip.js` vanilla module with `renderHUDStrip(containerId, data)` API. Used on progress.html and dashboard.html.

### `<global-bottom-nav>` (already done by Website Design)

Quest is already item 3 of 5 in the canonical layout (Practise → AI Tutor → Quest → Exam → Progress). When a student has 0 active quests, the Quest icon shows muted. With 1+ active, it shows accent-coloured with a small "1", "2", or "3" badge.

The component supports `setQuestActive(boolean)` and `setActive(slug)` already (per QuestClient.tsx ref). No changes needed.

---

## 12. Gamification system

### XP rules (allow-list — server-validated)

| Action | XP | Notes |
|---|---|---|
| Quiz complete (any score) | 10 | Base reward |
| Quiz score ≥ 80% | +15 (= 25 total) | Quality bonus |
| Quiz score 100% | +25 (= 35 total) | Perfect bonus |
| **Quest Day 1 step complete** | 50 | Per step |
| **Quest Day 2 step complete** | 50 | Per step |
| **Quest Day 3 step complete (mastered)** | 50 + 200 | step + quest_complete bonus |
| **Quest Day 3 step complete (slight)** | 50 + 100 | step + reduced bonus |
| **Quest Day 3 step complete (no_improvement)** | 0 | No XP for honest exit (Day 1+2 XP retained) |
| **Quest Day 3 redo selected** | +100 | Growth-mindset bonus |
| Exam complete (WA/EOY/PSLE) | 100 | |
| Exam score ≥ 80% | +50 (= 150 total) | |
| **Mastery level gain (AL band jump)** | **75 per band** | Daily cron diff |
| Daily login streak | 5/day, max 50 | Cap prevents gaming |
| Badge earned | varies (badge_definitions.xp_reward) | One-time per badge |

Anti-cheat: server validates every claim. For `quest_step_complete`, server verifies step was completed within last 60s.

### Level system (unchanged from v1.1)

Level N requires cumulative `100 * N * (N-1)` XP. Cap at level 50.

```js
function xpToLevel(totalXp) {
  return Math.min(50, Math.max(1, Math.floor((1 + Math.sqrt(1 + totalXp / 25)) / 2)));
}
function xpInCurrentLevel(totalXp, level) { return totalXp - 100 * level * (level - 1); }
function xpNeededForNextLevel(level) { return 200 * level; }
```

### Rank ladder (cosmetic, derived from level)

| Levels | Rank |
|---|---|
| 1-4 | Cadet |
| 5-9 | Operator |
| 10-14 | Specialist |
| 15-19 | Lieutenant |
| 20-29 | Captain |
| 30-39 | Commander |
| 40-49 | Vanguard |
| 50 | Legend |

### Streak rules (unchanged from v1.1)

Streak day = at least 1 XP-earning action that day. Resets if 24h pass with no activity AND no shield. Shield earned at every 7-day milestone (max 3 stocked). Streak XP capped at 50/day.

### Mastery gain detection (unchanged from v1.1)

Daily Vercel cron at 03:00 SGT (19:00 UTC). Snapshots `mastery_levels` into `mastery_levels_snapshots`. Diffs vs yesterday. Awards `mastery_gain` XP for any AL band improvement.

```json
{ "path": "/api/cron/snapshot-mastery", "schedule": "0 19 * * *" }
```

---

## 13. Component inventory

### Next.js (`src/app/quest/`)

```
src/app/quest/
├── page.tsx                          -- Server: auth + data fetch (REWRITE for Phase 3)
├── QuestClient.tsx                   -- Main orchestrator (UPDATE for Phase 3)
└── components/
    ├── ReturningCelebration.tsx       -- ✅ Done in Phase 2
    ├── EmptyState.tsx                 -- 🆕 Phase 3
    ├── QuestPicker.tsx                -- 🆕 Phase 3 (tabs when 2-3 active)
    ├── Day3OutcomeModal.tsx           -- 🆕 Phase 3 (3-way exit)
    ├── BadgeUnlockModal.tsx           -- 🆕 Phase 3
    ├── LevelUpModal.tsx               -- 🆕 Phase 3
    ├── AbandonConfirmModal.tsx        -- 🆕 Phase 3
    └── (existing inline components in QuestClient.tsx stay inline; refactor only if size demands it)
```

### Vanilla JS (`public/js/`)

```
public/js/
├── quiz.js          -- UPDATE: from_quest detection, quest-batch fetch, advance-step on submit
├── tutor.js         -- UPDATE: from_quest detection, Socratic mode, Mark Day 2 Complete
├── progress.js      -- UPDATE: renderQuestTray (replaces renderQuestMap), HUD strip, eligibility-aware buttons
├── hud-strip.js     -- 🆕 Vanilla HUD partial for progress.html + dashboard.html
└── exam.js          -- UPDATE: award-xp call on submit (decoupled from quest, just XP)
```

### Backend (`lib/api/`)

```
lib/api/
├── handlers.js      -- ADD: handleQuestsRouter, handleAwardXP, all sub-handlers
├── badge-engine.js  -- 🆕 Pure function module: state → newly-unlocked badge IDs
├── quest-pedagogy.js -- 🆕 Pure module: builds steps config from BKT diagnosis (used by handleGenerateQuest)
└── prompts/
    └── socratic-quest.js  -- 🆕 SOCRATIC_QUEST_PROMPT template + interpolator
```

---

## 14. 25 launch badges + 4 secret (carried from v1.1, plus new pedagogy badges)

### Common (12) — earnable in first week

| ID | Name | Description | Theme | XP |
|---|---|---|---|---|
| `first_quiz` | First Contact | Complete your first quiz | space_marine | 25 |
| `first_subject` | Subject Pioneer | Complete a quiz in any subject | space_marine | 25 |
| `early_bird` | First Light | 5 questions answered before 7am | magic | 50 |
| `night_owl` | Stealth Mode | 5 questions answered after 9pm | space_marine | 50 |
| `streak_3` | Steady Hand | 3-day streak | hybrid | 50 |
| `note_taker` | Codex Architect | Save 5 study notes | magic | 50 |
| `helper_10` | Apprentice Pact | 10 messages with Miss Wena | magic | 50 |
| `quiz_5` | Five Strong | Complete 5 quizzes | space_marine | 75 |
| `tutor_session` | Mind Link | Complete a tutor session | magic | 75 |
| `weakness_spotter` | Recon Specialist | View your BKT analysis | space_marine | 50 |
| `set_avatar` | Identity Forged | Set your first avatar (post-launch) | hybrid | 75 |
| `quest_day_1` | Engaged | Complete Day 1 of any quest | hybrid | 75 |

### Rare (8)

| ID | Name | Description | Theme | XP |
|---|---|---|---|---|
| `first_quest` | First Mission | Complete your first Plan Quest (3 days) | hybrid | 150 |
| `quest_3` | Mission Streak | Complete 3 quests | hybrid | 200 |
| `streak_7` | Constellation | 7-day streak | magic | 100 |
| `perfect_quiz` | Flawless Run | Score 100% on any quiz | hybrid | 100 |
| `subject_explorer` | Tri-Star | Complete quizzes in all 3 subjects | space_marine | 100 |
| `level_10` | Cadet Stripe | Reach level 10 | space_marine | 100 |
| `helper_50` | Wisdom Keeper | 50 messages with Miss Wena | magic | 75 |
| `weakness_crusher` | Bug Hunter | Improve any topic by 2 AL bands | hybrid | 150 |

### Epic (5)

| ID | Name | Description | Theme | XP |
|---|---|---|---|---|
| `streak_30` | Galactic Compass | 30-day streak | magic | 500 |
| `al1_master` | Apex Operator | Reach AL1 in any subject | space_marine | 300 |
| `perfect_exam` | Pristine Mind | Score 100% on a WA/EOY/PSLE exam | hybrid | 250 |
| `quest_10` | Veteran Operator | Complete 10 quests | hybrid | 300 |
| `level_25` | Lieutenant | Reach level 25 | space_marine | 250 |

### Legendary (1)

| ID | Name | Description | Theme | XP |
|---|---|---|---|---|
| `level_50` | Commander | Reach level 50 | space_marine | 1000 |

### Secret (4 — `is_secret=true`)

| ID | Name | Description | Theme | Rarity | XP |
|---|---|---|---|---|---|
| `secret_alchemist` | Alchemist | Score 100% on a HOTS-difficulty quiz | magic | epic | 300 |
| `secret_oracle` | Oracle | Predict your next BKT mastery within 5% | magic | legendary | 500 |
| `secret_warden` | Vault Warden | Read 25 study notes | magic | rare | 150 |
| `secret_phoenix` | Phoenix | Recover from a 0-day streak by hitting 7 days again | hybrid | epic | 250 |

### NEW for v2.0 — pedagogy badges (added to seed migration via 019_seed_pedagogy_badges.sql)

| ID | Name | Description | Theme | Rarity | XP |
|---|---|---|---|---|---|
| `socratic_scholar` | Socratic Scholar | Complete 5 Day 2 tutor sessions | magic | rare | 100 |
| `mastery_first_try` | One-Shot Mastery | Score ≥85% on Day 3 of your first quest | hybrid | epic | 200 |
| `redo_warrior` | Redo Warrior | Complete a redo quest after a `no_improvement` exit | hybrid | epic | 300 |
| `honest_compass` | Honest Compass | Mark a quest as `no_improvement` (the platform values honesty as much as success) | magic | rare | 50 |

This brings total badges to **29 launch + 4 pedagogy = 33**. The "Honest Compass" badge is the one that signals to parents that the platform values self-awareness.

---

## 15. Avatar pipeline (deferred to post-launch)

Avatar pipeline as specified in v1.1 §10 is **deferred until post-launch v1.1**. Reasoning: 
- Replicate integration adds complexity and cost-budget edge cases
- The avatar slot in the QuestClient already shows a stylish placeholder
- Initial-signup avatar is a manual photo upload; styling can be added post-launch
- Per LAUNCH_PLAN_v1.md "What this plan defers" section, avatar generation is acceptable to defer

When implemented post-launch: full v1.1 §10 spec applies unchanged.

---

## 16. Parent FAQ — public-facing source material

This section is the **source of truth for the public Plan Quest FAQ**. Copy these answers verbatim into pricing.html / about.html / a dedicated quest-info page.

### What is a Plan Quest?

A Plan Quest is a personalised 3-day learning intervention. When your child gets a low score on a topic, our AI builds a custom 3-day plan to help them master it: Day 1 is targeted practice with progressively harder questions; Day 2 is a guided conversation with Miss Wena (our AI tutor) where she helps them understand why they struggled; Day 3 is a mastery test that tells you honestly whether they've improved.

### How does it work?

**Day 1 — Foundation Climb (15-20 min):** 12 questions on the target topic, starting easy and getting harder. The point isn't to "pass" — it's to rebuild confidence and capture exactly which concepts your child finds tricky. Questions they get wrong feed Day 2.

**Day 2 — Socratic Dialogue (15 min):** Your child has a conversation with Miss Wena, who specifically references the questions they got wrong on Day 1. Instead of just explaining the answer, she asks leading questions that guide your child to discover the answer themselves. At the end, the conversation auto-saves as a study note in their Backpack for future revision.

**Day 3 — Mastery Trial (15-20 min):** 8 carefully chosen questions, mostly hard, with 2 "transfer" questions from a related topic to test depth of understanding. The score determines what happens next:
- **85% or above:** Mastered. We close the quest and celebrate. Big XP bonus.
- **70-84%:** Slight improvement. We close the quest and recommend they revisit the Day 2 study note this week.
- **Below 70%:** We give your child the choice — try the quest again with new questions, accept that there was slight improvement, or honestly mark themselves as still struggling. We believe the honest exit is one of the most valuable things the platform can give you as a parent.

### Why are the days separated by a day?

Spaced repetition. Research consistently shows that learning sticks better when concepts are revisited after a sleep cycle, not crammed in one sitting. Day 2 unlocks at midnight (Singapore time) after Day 1 is completed, and similarly for Day 3. We don't allow skipping the wait — the spacing is the medicine.

### Can my child have multiple quests at the same time?

Yes — up to 3 quests, one per subject (Maths, Science, English). This reflects the reality of PSLE preparation. If your child needs work on Fractions in Maths, Cells in Science, and Synthesis in English, they can run all three simultaneously without forcing a sequence.

### What if my child wants to abandon a quest?

They can. There's an "Abandon Quest" button (subtle, requires confirmation). They lose any unawarded XP for that quest, and the slot frees up so they can start a different quest in the same subject. We don't penalise abandonment — life happens.

### How is this different from just doing more practice questions?

Three ways:

1. **It's diagnostic, not just remedial.** Day 1 wrong answers feed Day 2's tutor session, which means Miss Wena addresses *the specific misunderstanding your child has*, not generic explanations.
2. **It teaches, not just tests.** Day 2 is a conversation, not a lecture. Active recall and explanation generation outperform passive review by 2-3× retention (Roediger 2006).
3. **It produces honest signal.** The 3-way exit on Day 3 means we tell you the truth. A platform that always says "Great job!" is a platform that produces no learning data.

### What happens if my child fails Day 3 repeatedly?

If they choose "Try this quest again" multiple times, we track the lineage. After two consecutive `no_improvement` outcomes on the same topic, the parent dashboard surfaces a recommendation: "Lily has marked herself as still struggling on Fractions twice. Consider scheduling a tutor session or speaking with her teacher." This is the platform telling you what other platforms hide.

### Does my child earn rewards for doing quests?

Yes, but only for *real learning actions*. They earn XP for completing quiz questions, tutor sessions, and quest steps. Bigger XP rewards for mastery (Day 3 ≥ 85%) and for redoing a failed quest (we reward growth mindset). XP feeds into a level/rank progression (Cadet → Operator → Specialist → ...). They can earn badges for milestones — including a special "Honest Compass" badge for marking themselves as still struggling, because we genuinely value self-awareness.

### What does this cost?

Plan Quests are included in all subscriptions: All Subjects (S$12.99/month) and Family Plan (S$19.99/month). No usage caps. Your child can complete as many quests as they want.

### How does this respect privacy?

All quest data is stored under your child's profile and protected by row-level security in our database — only you (the parent) and your child can access it. We never share quest performance data with third parties. We use your child's quiz history to improve recommendations within their own profile only — we don't pool anonymised data across users.

---

## 17. CLAUDE.md & docs update plan

### CLAUDE.md changes (committed at end of Phase 3)

#### NEW Section — Plan Quest Pedagogy

```markdown
## Plan Quest Pedagogy (added 2026-04-26)

Plan Quest is the third pillar of Superholic Lab. The 3-day pedagogy is 
non-negotiable IP. All implementation must conform.

Reference: docs/QUEST_PAGE_SPEC.md sections 7 (pedagogy) and 13 (FAQ) are authoritative.

### The 3-day contract
- Day 1: 12-question ramping practice (Foundation → Standard → Advanced)
- Day 2: Socratic dialogue with Miss Wena, anchored on Day 1 wrong answers
- Day 3: 8-question mastery (6 hard + 2 transfer), score-branched outcome

### Concurrency
- Max 3 active quests per student, one per subject
- Enforced by `quest_eligibility (student_id, subject)` PRIMARY KEY

### Day gating
- Day N+1 requires Day N completed AND midnight SGT crossed
- Computed server-side, returned in `day_unlock_status` field

### Outcome branching (Day 3)
- ≥85% → mastered (auto)
- 70-84% → slight_improvement (auto)
- <70% → student picks: redo / slight / no_improvement

### Time zone
All midnight calculations resolve to Asia/Singapore (UTC+8).
```

#### Routes added

```
GET  /api/quests                          → list active quests
GET  /api/quests/:id                      → fetch single quest with HUD/diagnosis
POST /api/quests/:id/advance-step         → advance (called by quiz/tutor)
POST /api/quests/:id/day3-outcome         → branch on poor Day 3
POST /api/quests/:id/abandon              → close
POST /api/quests/quiz-batch               → fetch quest-step questions
POST /api/award-xp                        → single XP grant endpoint
```

### Other doc updates

| File | Action |
|---|---|
| `docs/QUEST_PAGE_SPEC.md` | This file (v2.0 LOCKED) |
| `docs/GAMIFICATION_RULES.md` | Pull §12 into standalone reference |
| `docs/PARENT_FAQ.md` | Pull §16 into standalone parent-facing FAQ |
| `docs/LAUNCH_PLAN_v1.md` | Mark Week 1 (quest) and Week 2 (gamification) as in progress / done as appropriate |
| `STYLEGUIDE.md` | Already updated by Website Design with quest classes, icons, bottom nav |
| `ARCHITECTURE.md` | Update with quest data flow + concurrency model + day gating |
| `MANIFEST.md` | Note new files: badge-engine.js, quest-pedagogy.js, hud-strip.js |

### `pricing.html` update

Add line items under "What's included":
- 3-day Plan Quests (unlimited)
- AI tutor with Socratic Quest mode
- XP, levels, badges, streaks
- Honest mastery feedback (the 3-way exit)

### Public quest info page

Create `pages/quest-info.html` (vanilla, content-driven) with §16 content as static HTML. Linked from pricing.html and about.html.

---

## 18. Verification gate — the Lily Tan E2E test

Before declaring Phase 3 complete, this E2E test **must pass with a real test account**. No exceptions. If any step breaks, that commit gets rolled back.

**Setup:** Test account with a P5 student "Lily Tan" and an empty `mastery_levels` table seeded with: Fractions probability=0.45 (AL5).

**Test steps:**

1. **Lily takes a P5 Maths quiz on Fractions, scores 60%.**  
   ✅ Auto-modal appears: "Want a 3-day Plan Quest for Fractions?"

2. **Lily clicks "Yes, generate."**  
   ✅ POST `/api/generate-quest` succeeds. quest_eligibility row inserted.  
   ✅ Redirect to `/quest?id=<new_id>`. ActiveDayCard shows Day 1.

3. **Lily clicks "Start Day 1."**  
   ✅ Redirect to `/pages/quiz.html?...&from_quest=<id>&step=0`.  
   ✅ Banner shows "Plan Quest · Day 1 · Fractions".  
   ✅ Quiz loads exactly 12 questions: 4 Foundation, 4 Standard, 4 Advanced/HOTS.  
   ✅ Subject/topic switcher disabled.

4. **Lily completes 12 questions, gets 7/12 right (≈58%).**  
   ✅ POST `/api/quests/<id>/advance-step` fires with wrong_attempts payload.  
   ✅ remedial_quests.day1_wrong_attempts now contains 5 entries.  
   ✅ Transition screen "Day 1 complete!" 2s, redirect to `/quest?id=<id>&completed=0&trigger=quiz&score=58`.

5. **Quest page renders ReturningCelebration + XP +25 (10 quiz_complete + 50 step + bonuses).**  
   ✅ HUD level/XP updates. `quest_day_1` badge unlocks.  
   ✅ ActiveDayCard transitions: Day 1 ✓. Day 2 shown LOCKED with countdown "Unlocks at midnight SGT".

6. **Lily attempts to click Day 2.** ✅ Disabled with tooltip "Locked until midnight tonight (SGT)."

7. **Wall clock advances past SGT midnight.**  
   ✅ Page refresh shows Day 2 unlocked.

8. **Lily clicks "Start Day 2."**  
   ✅ Redirect to `/pages/tutor.html?...&from_quest=<id>&step=1&mode=socratic`.  
   ✅ Banner shows "Plan Quest · Day 2 · Fractions".  
   ✅ Miss Wena's first message references Q3 and Q7 specifically (her Day 1 wrong answers).  
   ✅ "Mark Day 2 Complete" button is **disabled** initially.

9. **Lily exchanges 4 turns (8 messages) with Miss Wena.**  
   ✅ Server returns `quest_message_count: 8` in last response.  
   ✅ "Mark Day 2 Complete" button enables.

10. **Lily clicks "Mark Day 2 Complete."**  
    ✅ `/api/summarize-chat` saves Study Note tagged with quest_id.  
    ✅ POST `/api/quests/<id>/advance-step` succeeds.  
    ✅ XP awarded. Redirect to `/quest?id=<id>&completed=1&trigger=tutor`.  
    ✅ Returning celebration. Day 2 ✓. Day 3 LOCKED with countdown.

11. **Wall clock advances past next SGT midnight.**  
    ✅ Day 3 unlocked.

12. **Lily clicks "Start Day 3", scores 78%.**  
    ✅ Quiz loads exactly 8 questions: 6 Fractions hard + 2 transfer (1 from Decimals, 1 from Ratio).  
    ✅ POST advance-step with score=78 returns `outcome_pending=false` and outcome=`slight_improvement`.

13. **Quest closes automatically.** Result screen: "Slight improvement! +60 XP. Recommended: revisit Day 2 study note."  
    ✅ remedial_quests.status = 'completed'. day3_outcome='slight_improvement'. day3_score=78.  
    ✅ quest_eligibility row for (Lily, mathematics) deleted.

14. **Lily can now generate a new Maths quest.**  
    ✅ Progress.html "Generate Quest" button on Maths topics is enabled again.

**Variant test — the "redo" path:**

12b. Lily scores 55% instead.  
   ✅ advance-step returns `outcome_pending=true`. Day3OutcomeModal opens.  
   ✅ Lily picks "Try this quest again."  
   ✅ POST `/api/quests/<id>/day3-outcome { outcome: 'redo' }` succeeds.  
   ✅ Original quest closes with day3_outcome='redo'. New quest spawned with parent_quest_id=<original>.  
   ✅ Eligibility slot atomically transferred to new quest.  
   ✅ Redirect to `/quest?id=<new_id>` showing Day 1 of the new quest.

**Variant test — the "no improvement" path:**

12c. Lily scores 45%, picks "I'm still struggling."  
   ✅ POST day3-outcome with `no_improvement`. Quest closes. Slot freed.  
   ✅ XP for Day 3 step = 0 (Day 1+2 XP retained).  
   ✅ `honest_compass` badge unlocks.  
   ✅ (Future) parent dashboard surfaces "still struggling" recommendation.

If any step fails, the responsible commit rolls back. No exceptions.

---

## 19. Phase 3 execution plan

### Six commits, sequential

| # | Title | Files | Stream | Verify |
|---|---|---|---|---|
| 1 | Migration 018 + eligibility table | `supabase/018_quest_pedagogy.sql` | Backend | SQL editor + verification queries; no breaking changes |
| 2 | Backend handlers + quest pedagogy module | `lib/api/handlers.js`, `lib/api/badge-engine.js`, `lib/api/quest-pedagogy.js`, `lib/api/prompts/socratic-quest.js`, `api/index.js`, `vercel.json` | Backend | Postman/curl all 8 endpoints |
| 3 | /quest page wired to real data + new states | `src/app/quest/page.tsx`, `QuestClient.tsx`, `components/EmptyState.tsx`, `QuestPicker.tsx`, `Day3OutcomeModal.tsx`, `BadgeUnlockModal.tsx`, `LevelUpModal.tsx`, `AbandonConfirmModal.tsx` | Frontend | Vercel preview, all 5 states verified |
| 4 | Quiz.js + tutor.js integration | `public/js/quiz.js`, `public/js/tutor.js` | Backend | E2E walk-through Day 1 + Day 2 |
| 5 | Progress.html quest tray + HUD strip + auto-modal | `public/js/progress.js`, `public/js/hud-strip.js`, partial inline edit on `pages/quiz.html` for the auto-modal | Frontend | Manual test eligibility states 0/1/2/3 |
| 6 | Mastery cron + badge-engine wiring + parent FAQ page | `api/cron/snapshot-mastery.js`, `vercel.json` cron, `pages/quest-info.html`, doc updates | Backend | Manual cron run, badge unlocks, FAQ live |

**Total estimate:** 9-12 working sessions across both streams.

**Dependency:** Commit 2 must land before commits 3, 4, 5 start (they need the API contracts).

**Blocker policy:** Each commit ends with a verification step. No "I think it works." If verification fails, rollback. The next commit starts only after the previous is green.

---

**END OF QUEST_PAGE_SPEC.md v2.0 — LOCKED 2026-04-26**

Phase 3 implementation begins now. Source-of-truth document. All handoff prompts reference this.
