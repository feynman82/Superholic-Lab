# QUEST_BACKEND_HANDOFF.md — Claude Code prompt for Plan Quest Phase 3 Backend

**Stream:** Backend & Admin
**Owns commits:** 1 (migration 018), 2 (handlers + pedagogy modules), 4 (quiz/tutor integration), 6 (cron + FAQ + doc updates)
**Authoritative spec:** `docs/QUEST_PAGE_SPEC.md` v2.0

---

## How to use this prompt

Paste everything below into Claude Code. Work commit-by-commit. After each commit:

1. Run the verification step described
2. Show the user the output of the verification
3. Only proceed to the next commit when verification passes

If verification fails, **stop and report** — do not "patch and continue." Rebuild from a known-good state.

---

## Context (read first)

You are implementing the backend for Plan Quest Phase 3 — wiring `/quest` to real Supabase data, adding the new pedagogical Day 1 / Day 2 / Day 3 mechanics, enforcing concurrency at the DB level, and turning on full gamification (XP, levels, badges, streaks).

Plan Quest is the **third pillar** of Superholic Lab (Practise, AI Tutor, Quest, Exam, Progress in the bottom nav). It must work end-to-end with paying customers. The pedagogy is non-negotiable IP — see `docs/QUEST_PAGE_SPEC.md` §7.

## Repo & infra

- Local repo: `D:\Git\Superholic-Lab`
- GitHub: `feynman82/Superholic-Lab` (main branch, push directly)
- Frontend split:
  - Vanilla HTML/CSS/JS in `public/` — quiz.js, tutor.js, progress.js, etc.
  - Next.js shell at `src/app/quest/` and `src/app/page.tsx` only
- API: single gateway at `api/index.js` routes to handlers in `lib/api/handlers.js`
- Supabase project: `rlmqsbxevuutugtyysjr` (Singapore region)
- Migrations applied to production: 015, 016, 017 (mastery_levels, gamification, badge seeds)

## Critical rules (read before writing code)

1. **`docs/QUEST_PAGE_SPEC.md` v2.0 is the authority.** When in doubt, read it. Do not invent behaviour not specified.
2. **Read existing files before writing.** Use `view` then `str_replace` for surgical edits. Never recreate.
3. **Single API gateway.** All new routes go through `api/index.js` → `lib/api/handlers.js`. Vercel function count must stay at 1.
4. **Server validates everything.** Any client-supplied XP amount, score, step index, or quest ownership must be re-verified server-side. Anti-cheat by default.
5. **All time-zone math is `Asia/Singapore` (UTC+8).** Use `Intl.DateTimeFormat` with `timeZone: 'Asia/Singapore'`. Never use raw `new Date()` for SGT midnight calculations without explicit timezone conversion.
6. **All DB writes that modify `quest_eligibility` must be transactional with the corresponding `remedial_quests` change.** Use Postgres transactions.
7. **NOT-NULL guards on all writes.** Same pattern as quiz.js fix from 2026-04-26: always supply a non-null fallback for required text columns.
8. **Idempotency on advance-step.** Repeat calls with same `step_index` must be no-ops, not double-advances. Verify `current_step` matches before mutating.
9. **Idempotency on award-xp.** Use `event_id` parameter for dedup. Same `(student_id, event_type, event_id)` returns cached result, no double-grant.
10. **No silent failures.** Every catch block logs `console.error` with full context. We will never debug a "it just doesn't work" report.

## Pre-work — read these files first, in order

1. `docs/QUEST_PAGE_SPEC.md` (full read; this is the authority)
2. `lib/api/handlers.js` (existing pattern — match it)
3. `supabase/016_quest_gamification.sql` (existing schema)
4. `supabase/017_seed_badges.sql` (existing badges)
5. `public/js/quiz.js` (engine you'll modify in commit 4 — NOTE the recent NOT-NULL safety fixes from 2026-04-26 commit `602225fc` — do not break them)
6. `public/js/tutor.js` (engine you'll modify in commit 4 — NOTE the Save Notes fix from commit `8c8c2012`)
7. `public/js/progress.js` (you don't modify it but you need to understand `getALBand` and `runCognitiveDiagnosis`)
8. `vercel.json` (for cron registration in commit 6)
9. `api/index.js` (gateway)

After reading, summarise to the user in 5 bullet points: (a) what's already wired, (b) what's missing, (c) any inconsistencies you found between the spec and current code, (d) any risks you see in the migration plan, (e) confirmation that you understand the day-gating logic in spec §8. **Do not write code until the user confirms your understanding.**

---

# COMMIT 1 — Migration 018: pedagogy fields + concurrency table

## What to build

Create `supabase/018_quest_pedagogy.sql` with the exact contents from `docs/QUEST_PAGE_SPEC.md` §6. Do not deviate.

The migration must be:
- Idempotent (`IF NOT EXISTS` on every CREATE; `ADD COLUMN IF NOT EXISTS` on every ALTER)
- RLS-enabled on `quest_eligibility` with the documented policy
- Safe to apply to current production (additive only, no breaking changes)
- Include verification queries as comments at the bottom
- Backfill `quest_eligibility` from existing active `remedial_quests` rows (with `ON CONFLICT DO NOTHING` for safety)

## Verification

Do NOT apply the migration. Show the user the full file contents. Walk through each ALTER and CREATE explaining what it does. Confirm:
- No existing RLS policy is dropped or weakened
- The PRIMARY KEY on quest_eligibility correctly enforces "one active per (student, subject)"
- The backfill query handles edge case of pre-existing duplicates (oldest wins via ORDER BY created_at ASC + ON CONFLICT)

The user will apply manually via Supabase SQL Editor and run the verification queries. Only when those pass do we proceed to Commit 2.

---

# COMMIT 2 — Backend handlers + pedagogy modules

## What to build (6 files)

### File 1: `lib/api/quest-pedagogy.js` (NEW)

Pure module. Exports:

```js
export function buildQuestSteps({ subject, level, topic, masteryProbability, transferTopics }) {
  // Returns the 3-element steps array per QUEST_PAGE_SPEC §5
  //  - Day 1: 12 questions, ramping difficulty
  //  - Day 2: Socratic config
  //  - Day 3: 8 questions with transfer questions
}

export const SYLLABUS_DEPENDENCIES = {
  // Move from handlers.js to this module. Used to derive transfer topics.
  // Per spec, includes mathematics + science + english topic dependencies.
};

export function deriveTransferTopics(subject, topic) {
  // Returns [topic1, topic2] from SYLLABUS_DEPENDENCIES
}
```

Difficulty band rules:
- P3-P4: Day 1 = 5 Foundation, 5 Standard, 2 Advanced. Day 3 = 4 Standard, 2 Advanced, 2 transfer.
- P5-P6: Day 1 = 4 Foundation, 4 Standard, 4 Advanced/HOTS. Day 3 = 6 hard (Advanced/HOTS) + 2 transfer.

### File 2: `lib/api/prompts/socratic-quest.js` (NEW)

Exports `buildSocraticQuestPrompt({ topic, day1WrongAttempts, studentName, level })` returning the SOCRATIC_QUEST_PROMPT system message string per spec §10 "POST /api/chat — MODIFIED". Interpolate the wrong attempts as a bulleted list with question text and student answer.

### File 3: `lib/api/badge-engine.js` (NEW)

```js
export async function evaluateBadges({ studentId, eventType, eventMetadata, db }) {
  // Returns array of newly unlocked badge metadata
  // Implements ALL 33 badges from QUEST_PAGE_SPEC §14
  // 
  // Pattern:
  //   1. Read student_badges to get already-earned IDs
  //   2. For each badge_definition not in earned set, check unlock condition
  //   3. INSERT new student_badges rows
  //   4. Return newly earned badges
  //
  // Each badge gets a small async predicate function:
  //   first_quest: ({ studentId, db }) => count of completed quests >= 1
  //   streak_7: ({ studentId, db }) => student_streaks.current_days >= 7
  //   honest_compass: ({ studentId, db, eventMetadata }) => eventType === 'quest_complete' && eventMetadata.outcome === 'no_improvement'
  //   etc.
  //
  // Stay under 500 lines by being terse. Use a registry pattern.
}

export function evaluateLevelUp({ totalXpBefore, totalXpAfter }) {
  // Returns { leveled_up, level_before, level_after, rank_before, rank_after }
  // Uses xpToLevel() and rank ladder from QUEST_PAGE_SPEC §12
}
```

### File 4: `lib/api/handlers.js` (MODIFY)

Add these handlers, exported from the module:

#### `handleQuestsRouter(req, res)` — dispatcher

Parses URL after `/api/quests`:
- `GET /api/quests` → list active quests for caller's child
- `GET /api/quests/:id` → fetch single quest with HUD + diagnosis + day_unlock_status
- `POST /api/quests/:id/advance-step`
- `POST /api/quests/:id/day3-outcome`
- `POST /api/quests/:id/abandon`
- `POST /api/quests/quiz-batch`

Each sub-handler implementation per `docs/QUEST_PAGE_SPEC.md` §10.

Key implementations:

**`day_unlock_status` computation (CRITICAL):**
```js
// For each step index 0..2:
//   if step_index === 0: { unlocked: true, completed: !!day_completed_at['0'], unlocks_at: null }
//   else:
//     const prevDoneAt = day_completed_at[String(step_index - 1)];
//     if (!prevDoneAt) {
//       return { unlocked: false, completed: false, unlocks_at: null };  // prev not done
//     }
//     // Compute next SGT midnight after prevDoneAt
//     const prevDoneSGT = new Date(prevDoneAt);  // ISO string with TZ
//     const sgtFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' });
//     const prevDateSGT = sgtFormatter.format(prevDoneSGT);  // 'YYYY-MM-DD' in SGT
//     const nextMidnightSGT = new Date(`${addDays(prevDateSGT, 1)}T00:00:00+08:00`).toISOString();
//     if (new Date() >= new Date(nextMidnightSGT)) {
//       return { unlocked: true, completed: !!day_completed_at[String(step_index)], unlocks_at: null };
//     } else {
//       return { unlocked: false, completed: false, unlocks_at: nextMidnightSGT };
//     }
```

**Transactional eligibility swap on Day 3 redo:**
```js
// Use a Supabase RPC (write a small Postgres function) OR use raw SQL:
//   BEGIN;
//   UPDATE remedial_quests SET status='completed', day3_outcome='redo' WHERE id=$1;
//   INSERT INTO remedial_quests (...) RETURNING id INTO new_id;
//   UPDATE quest_eligibility SET quest_id=new_id WHERE student_id=$2 AND subject=$3;
//   COMMIT;
// Use the @supabase/supabase-js client's .rpc() to call a stored function for atomicity.
```

**3-way Day 3 branching:**
When `step_index === 2` and the score is being recorded:
- Save `day3_score = score`
- If score >= 85: status='completed', day3_outcome='mastered', DELETE eligibility row, award +200 quest_complete bonus + +100 mastered bonus
- If 70 <= score < 85: status='completed', day3_outcome='slight_improvement', DELETE eligibility row, award +100 reduced bonus
- If score < 70: leave status='active', do NOT set day3_outcome yet, do NOT delete eligibility, return `outcome_pending: true`

#### `handleAwardXP(req, res)`

Per spec §10. Anti-cheat:
- Allow-list per event_type (table in §12)
- Idempotency via `(student_id, event_type, event_id)` dedup against xp_events
- For quest_step_complete: verify quest's current_step is consistent with claim
- For mastery_gain: only allow internal calls (check a `process.env.INTERNAL_CRON_SECRET` header)

#### `handleGenerateQuest(req, res)` — MODIFY existing

- Add quest_eligibility check at top. If row exists for (student, subject) → return 409 with `existing_quest_id`.
- Wrap INSERT into remedial_quests AND quest_eligibility in a transaction (Postgres function or raw SQL).
- Use `quest-pedagogy.js` `buildQuestSteps` to construct the richer steps config.
- Pass through `parent_quest_id` if provided in request body (used by Day 3 redo flow).

#### `handleChat(req, res)` — MODIFY existing

If query param `from_quest=<id>` is present:
1. Fetch the quest, verify caller owns via RLS
2. Read `quest.steps[quest.current_step].config`
3. If `scaffold_mode === 'socratic'`, call `buildSocraticQuestPrompt` with `quest.day1_wrong_attempts` injected and use as system prompt instead of default Miss Wena prompt
4. Track and return `quest_message_count` (count user+assistant messages logged for this quest's tutor session via `ai_tutor_logs.quest_id` filter)

This means `ai_tutor_logs` needs a `quest_id` column. Add to migration 018:

```sql
ALTER TABLE ai_tutor_logs 
  ADD COLUMN IF NOT EXISTS quest_id uuid REFERENCES remedial_quests(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_ai_tutor_logs_quest 
  ON ai_tutor_logs (quest_id) WHERE quest_id IS NOT NULL;
```

*(Add this to the migration 018 file from Commit 1 — if Commit 1 was already applied, write a separate `018b_ai_tutor_quest_link.sql`.)*

### File 5: `api/index.js` (MODIFY)

Add to route switch:

```js
case 'quests':                    return handleQuestsRouter(req, res);
case 'award-xp':                  return handleAwardXP(req, res);
```

`handleQuestsRouter` does its own URL parsing for sub-routes.

### File 6: `vercel.json` (MODIFY)

Add wildcard rewrite for `/api/quests/*` paths so they all route to `api/index.js`. Existing rewrites stay.

## Verification

1. Run `npm run build` (or equivalent type check). Show any errors. Resolve all before proceeding.
2. Show full contents of `quest-pedagogy.js` and `badge-engine.js`.
3. Run these curl commands against `vercel dev` (substitute a real bearer token from a test account):

```bash
# List quests (should return [] for new student)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/quests

# Create a quest
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"student_id":"<uuid>","subject":"mathematics","level":"primary-5","topic":"Fractions","trigger_score":58}' \
  http://localhost:3000/api/generate-quest

# Try to create a SECOND maths quest (must 409 with existing_quest_id)
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"student_id":"<uuid>","subject":"mathematics","level":"primary-5","topic":"Ratio","trigger_score":62}' \
  http://localhost:3000/api/generate-quest

# Different subject (should succeed)
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"student_id":"<uuid>","subject":"english","level":"primary-5","topic":"Synthesis","trigger_score":65}' \
  http://localhost:3000/api/generate-quest

# Fetch single quest — must include day_unlock_status with all 3 days
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/quests/<id>

# Award XP twice with same event_id — second call must be idempotent (same totals)
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"student_id":"<uuid>","event_type":"quiz_complete","xp_amount":25,"event_id":"test_001"}' \
  http://localhost:3000/api/award-xp
```

Show the user JSON responses. Required:
- 409 on second Maths quest with `existing_quest_id` populated
- English quest succeeds
- Idempotent XP award (second call same totals, no double-grant)
- Single-quest fetch includes `day_unlock_status` with all 3 days correctly computed (Day 1 unlocked + completed=false; Day 2 locked because Day 1 not done)

Only proceed when all curls return expected values.

---

# COMMIT 4 — quiz.js + tutor.js integration

**WAIT for Frontend stream's Commit 3 to be merged before starting this commit** — you need Commit 3 to verify deep-link return URLs round-trip correctly.

## What to build

### `public/js/quiz.js` (MODIFY)

Read the file via filesystem first (`view` tool). Apply these surgical edits via `str_replace`:

**On init — detect quest mode:**

Find the `init()` function. After existing param parsing add:

```js
const fromQuest = params.get('from_quest');
const stepIndex = params.get('step');
if (fromQuest && stepIndex !== null) {
  state.fromQuest = { questId: fromQuest, stepIndex: parseInt(stepIndex, 10) };
  // Hide subject/topic switcher — quest dictates these
  document.querySelectorAll('.quiz-config-switcher').forEach(el => el.classList.add('hidden'));
}
```

If `state.fromQuest` is set, replace standard question-fetch with:

```js
const session = await db.auth.getSession();
const res = await fetch('/api/quests/quiz-batch', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${session?.data?.session?.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ 
    quest_id: state.fromQuest.questId, 
    step_index: state.fromQuest.stepIndex 
  })
});
const { questions } = await res.json();
state.questions = questions;
```

Add a quest banner above the quiz card (not inside it) showing "Plan Quest · Day {n+1} · {topic}".

**On submit — advance the quest step:**

Find `window.saveQuizResult` (we just hardened this on 2026-04-26). DO NOT BREAK that fix. After existing save logic, append:

```js
if (state.fromQuest) {
  // Build wrong attempts payload
  const wrongAttempts = state.questions
    .map(q => ({ q, r: state.resultsObj[q.id] }))
    .filter(({ r }) => r && !r.isCorrect)
    .map(({ q, r }) => ({
      question_id: q.id,
      question_text: String(q.question_text || q.passage || '').slice(0, 500),
      student_answer: String(r.studentAns || '(no answer)').slice(0, 200),
      correct_answer: String(q.correct_answer || r.correctAns || '').slice(0, 200),
      topic: q.topic,
      sub_topic: q.sub_topic
    }));
  
  const session = await sb.auth.getSession();
  const advanceRes = await fetch(`/api/quests/${state.fromQuest.questId}/advance-step`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.data?.session?.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      step_index: state.fromQuest.stepIndex,
      trigger: 'quiz',
      score: pct,  // existing variable from results computation
      metadata: { wrong_attempts: wrongAttempts }
    })
  });
  
  if (advanceRes.ok) {
    // Show quest-specific transition then redirect to /quest
    showQuestTransition(`Day ${state.fromQuest.stepIndex + 1} complete!`);
    setTimeout(() => {
      window.location.href = `/quest?id=${state.fromQuest.questId}&completed=${state.fromQuest.stepIndex}&trigger=quiz&score=${pct}`;
    }, 2000);
    return;  // Skip standard renderResults
  }
}
```

**For non-quest quizzes — award XP and offer quest:**

After the standard save (NOT in fromQuest branch):

```js
// Award XP for general quiz
await fetch('/api/award-xp', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    student_id: state.studentId,
    event_type: 'quiz_complete',
    xp_amount: pct >= 100 ? 35 : pct >= 80 ? 25 : 10,
    event_id: attempt.id,  // quiz_attempt_id, ensures idempotency
    metadata: { score: pct, subject: state.dbSubject }
  })
}).catch(err => console.error('XP award failed:', err));  // non-blocking

// If score <= 70%, show quest-suggestion modal (only if NOT already from quest)
if (pct <= 70 && !state.fromQuest) {
  showQuestSuggestionModal({
    subject: state.dbSubject,
    topic: state.dbTopic,
    level: state.dbLevel,
    score: pct,
    triggerAttemptId: attempt.id
  });
}
```

Add helpers as named functions near the bottom of the IIFE:
- `showQuestBanner(questId, stepIndex)` — fixed banner top of page, sage-coloured, shows "Plan Quest · Day N · {topic}". Topic comes from a small lookup against the quest API.
- `showQuestTransition(text)` — full-screen overlay, fade in, shows text + spinner, fade out
- `showQuestSuggestionModal({ subject, topic, level, score, triggerAttemptId })` — modal with "Want a 3-day Plan Quest for {topic}?" Two buttons: "Yes, generate" calls `/api/generate-quest` then redirects to `/quest?id=<new>`; "Not now" dismisses. **Must check eligibility first** — call `GET /api/quests` and skip showing if (subject) slot already taken. Use 409 handling on the generate call as a fallback.

### `public/js/tutor.js` (MODIFY)

Similar pattern. Read file. Apply:

**On init:**

```js
const params = new URLSearchParams(window.location.search);
const fromQuest = params.get('from_quest');
const stepIndex = params.get('step');
const questMode = params.get('mode');
if (fromQuest && stepIndex !== null) {
  state.fromQuest = { 
    questId: fromQuest, 
    stepIndex: parseInt(stepIndex, 10),
    mode: questMode
  };
}
```

**Pass `from_quest` on every `/api/chat` call:**

Find the existing `fetch('/api/chat', ...)` call. Modify URL construction:

```js
const chatUrl = state.fromQuest 
  ? `/api/chat?from_quest=${state.fromQuest.questId}&step=${state.fromQuest.stepIndex}` 
  : '/api/chat';
```

After response, read `quest_message_count` from response body if present. Track in `state.questMessageCount`.

**Replace "Save Notes" button with "Mark Day 2 Complete":**

Find the existing Save Notes button. When `state.fromQuest`, hide it and show a different button:

```html
<button id="markDay2CompleteBtn" class="btn btn-primary hover-lift" disabled>
  Mark Day 2 Complete (need {{8 - state.questMessageCount}} more messages)
</button>
```

Update label and disabled state based on `state.questMessageCount`. Enable when >= 8.

**On click — finalise Day 2:**

```js
async function markDay2Complete() {
  // 1. Auto-summarise to study note (existing /api/summarize-chat — add quest_id)
  await fetch('/api/summarize-chat', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: currentStudentId,
      subject: currentSubjectContext,
      topic: currentTopicContext,
      messages: cleanMessages,  // existing pattern from tutor.js Save Notes fix 2026-04-26
      quest_id: state.fromQuest.questId  // NEW: tags the note as quest material
    })
  });
  
  // 2. Advance the quest step
  const advanceRes = await fetch(`/api/quests/${state.fromQuest.questId}/advance-step`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      step_index: state.fromQuest.stepIndex,
      trigger: 'tutor',
      score: null  // null for tutor steps; XP based on completion not score
    })
  });
  
  // 3. Redirect
  window.location.href = `/quest?id=${state.fromQuest.questId}&completed=${state.fromQuest.stepIndex}&trigger=tutor`;
}
```

Also — the spec says `/api/summarize-chat` should accept `quest_id`. Update `handleSummarizeChat` in `lib/api/handlers.js` to: (a) accept the parameter, (b) write it to `study_notes.quest_id` if the column exists. Add the column in migration 018 if not present:

```sql
ALTER TABLE study_notes ADD COLUMN IF NOT EXISTS quest_id uuid REFERENCES remedial_quests(id) ON DELETE SET NULL;
```

## Verification

E2E walk-through with a real test account:

1. Take a P5 quiz on Fractions, deliberately score ≤ 70%. Confirm:
   - Modal appears: "Want a 3-day Plan Quest for Fractions?"
   - Modal does NOT appear if a Maths quest already exists
2. Click "Yes, generate." Confirm:
   - Redirect to `/quest?id=<new>` with new quest visible
3. Click "Start Day 1." Confirm:
   - URL has `from_quest=<id>&step=0`
   - Banner shows "Plan Quest · Day 1 · Fractions"
   - Exactly 12 questions load
4. Complete the quiz, get some wrong. Confirm:
   - Transition screen appears for 2s
   - Redirect to `/quest?id=<id>&completed=0&trigger=quiz&score=<n>`
   - ReturningCelebration fires on /quest
   - Day 2 shown locked with countdown
5. Manually advance system clock past midnight SGT (or wait). Confirm Day 2 unlocks.
6. Click "Start Day 2." Confirm:
   - URL has `mode=socratic`
   - Miss Wena's first message references SPECIFIC Day 1 wrong answers (verify the message text contains question content from `day1_wrong_attempts`)
   - "Mark Day 2 Complete" is disabled
7. Exchange 4 turns (8 messages). Confirm "Mark Day 2 Complete" enables after the 8th total message.
8. Click "Mark Day 2 Complete." Confirm:
   - Study Note saved to Backpack tagged with quest_id
   - Redirect to `/quest?id=<id>&completed=1&trigger=tutor`

Report any deviation. Do not proceed to Commit 6 until this passes.

---

# COMMIT 6 — Mastery cron + parent FAQ page + doc updates

## What to build

### File 1: `api/cron/snapshot-mastery.js` (NEW)

Daily Vercel cron at 03:00 SGT (19:00 UTC). Per QUEST_PAGE_SPEC.md §12.

```js
import { createClient } from '@supabase/supabase-js';

function formatSGT(date) {
  return new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Asia/Singapore', 
    year: 'numeric', month: '2-digit', day: '2-digit' 
  }).format(date);
}

function bandFromProbability(p) {
  // MUST match progress.js getALBand exactly. Read that function and replicate.
  if (p >= 0.95) return 1;
  if (p >= 0.85) return 2;
  if (p >= 0.75) return 3;
  if (p >= 0.65) return 4;
  if (p >= 0.55) return 5;
  if (p >= 0.45) return 6;
  if (p >= 0.35) return 7;
  return 8;
}

export default async function handler(req, res) {
  // Verify it's actually called by Vercel cron
  if (req.headers['user-agent'] !== 'vercel-cron/1.0') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Distinct students with mastery rows
  const { data: rows } = await db.from('mastery_levels').select('student_id');
  const uniqueStudents = [...new Set((rows || []).map(s => s.student_id))];
  
  let totalGains = 0;
  for (const studentId of uniqueStudents) {
    // 1. Today
    const { data: today } = await db.from('mastery_levels').select('*').eq('student_id', studentId);
    const todayDate = formatSGT(new Date());
    
    // 2. Yesterday's snapshot
    const yesterdayDate = formatSGT(new Date(Date.now() - 86_400_000));
    const { data: yesterday } = await db
      .from('mastery_levels_snapshots')
      .select('*')
      .eq('student_id', studentId)
      .eq('snapshot_date', yesterdayDate);
    
    // 3. Insert today's snapshots
    const todaySnapshots = (today || []).map(row => ({
      student_id: studentId,
      snapshot_date: todayDate,
      subject: row.subject,
      topic: row.topic,
      sub_topic: row.sub_topic || 'general',
      probability: row.probability,
      al_band: bandFromProbability(row.probability)
    }));
    if (todaySnapshots.length > 0) {
      await db.from('mastery_levels_snapshots').upsert(todaySnapshots, { 
        onConflict: 'student_id,snapshot_date,subject,topic,sub_topic' 
      });
    }
    
    // 4. Diff and award mastery_gain XP
    for (const row of (today || [])) {
      const yRow = (yesterday || []).find(y => 
        y.subject === row.subject && y.topic === row.topic && 
        (y.sub_topic || 'general') === (row.sub_topic || 'general')
      );
      if (!yRow) continue;
      const todayBand = bandFromProbability(row.probability);
      if (todayBand < yRow.al_band) {
        const bandsImproved = yRow.al_band - todayBand;
        // Internal call to award-xp — use service-role direct DB write to avoid HTTP loop
        await awardMasteryGainInternal(db, {
          student_id: studentId,
          xp_amount: bandsImproved * 75,
          metadata: {
            subject: row.subject,
            topic: row.topic,
            sub_topic: row.sub_topic || 'general',
            al_before: yRow.al_band,
            al_after: todayBand
          }
        });
        totalGains++;
      }
    }
  }
  
  return res.status(200).json({ 
    success: true, 
    students_processed: uniqueStudents.length,
    mastery_gains_awarded: totalGains
  });
}

async function awardMasteryGainInternal(db, { student_id, xp_amount, metadata }) {
  // Insert xp_event
  await db.from('xp_events').insert({
    student_id,
    event_type: 'mastery_gain',
    xp_awarded: xp_amount,
    metadata
  });
  // Update student_xp
  const { data: current } = await db.from('student_xp').select('total_xp').eq('student_id', student_id).single();
  const newTotal = (current?.total_xp || 0) + xp_amount;
  // Recompute level
  const newLevel = Math.min(50, Math.max(1, Math.floor((1 + Math.sqrt(1 + newTotal / 25)) / 2)));
  const xpInLevel = newTotal - 100 * newLevel * (newLevel - 1);
  await db.from('student_xp').update({
    total_xp: newTotal,
    current_level: newLevel,
    xp_in_level: xpInLevel,
    updated_at: new Date().toISOString()
  }).eq('student_id', student_id);
}
```

### File 2: `vercel.json` (MODIFY)

Add cron registration:

```json
{
  "crons": [
    { "path": "/api/cron/snapshot-mastery", "schedule": "0 19 * * *" }
  ]
}
```

Merge with existing crons section if present.

### File 3: `pages/quest-info.html` (NEW)

Vanilla HTML page implementing the public Plan Quest FAQ per QUEST_PAGE_SPEC.md §16. Use existing layout pattern from `pages/about.html`.

Structure:
- `<global-header>`
- Hero section: "Plan Quest — The 3-day learning intervention"
- FAQ from §16 verbatim. Each Q in `<h2>`, answer in `<div class="faq-answer">`
- Cross-links: pricing.html, signup.html
- `<global-bottom-nav>` (only renders if logged in; that's the existing component behaviour)
- `<global-footer>`

Use `style.css` v3.0 classes only. Zero hardcoded hex. Follow the section colour alternation rule from CLAUDE.md memory.

Link it from:
- `pages/pricing.html` — add a "Learn how Plan Quests work" link near the Plan Quest line item
- `pages/about.html` — add to the "How we teach" section

### File 4: `supabase/019_seed_pedagogy_badges.sql` (NEW)

Seed the 4 pedagogy badges from §14. Use exact same INSERT pattern as 017_seed_badges.sql:

```sql
INSERT INTO badge_definitions (id, name, description, icon_url, theme, rarity, xp_reward, sort_order, is_secret) VALUES
  ('socratic_scholar', 'Socratic Scholar', 'Complete 5 Day 2 tutor sessions', '/assets/badges/socratic_scholar.png', 'magic', 'rare', 100, 100, false),
  ('mastery_first_try', 'One-Shot Mastery', 'Score 85% or above on Day 3 of your first quest', '/assets/badges/mastery_first_try.png', 'hybrid', 'epic', 200, 101, false),
  ('redo_warrior', 'Redo Warrior', 'Complete a redo quest after a no_improvement exit', '/assets/badges/redo_warrior.png', 'hybrid', 'epic', 300, 102, false),
  ('honest_compass', 'Honest Compass', 'Mark a quest as no_improvement — the platform values honesty as much as success', '/assets/badges/honest_compass.png', 'magic', 'rare', 50, 103, false)
ON CONFLICT (id) DO NOTHING;
```

You'll need to ensure 4 placeholder PNG icons exist at `/public/assets/badges/`. If they don't, use a single placeholder URL for now — the badge engine fires regardless of icon presence.

### File 5: Documentation updates

#### `CLAUDE.md` — add new section

Find a good insertion point (after "Memory system" section if present, otherwise after the "Tech stack" section). Add:

```markdown
## Plan Quest Pedagogy

Plan Quest is the third pillar of Superholic Lab. The 3-day pedagogy is non-negotiable IP. All implementation must conform.

**Reference:** `docs/QUEST_PAGE_SPEC.md` v2.0 — sections 7 (pedagogy) and 16 (FAQ) are authoritative.

### The 3-day contract
- Day 1: 12-question ramping practice (Foundation → Standard → Advanced)
- Day 2: Socratic dialogue with Miss Wena, anchored on Day 1 wrong answers (min 8 messages)
- Day 3: 8-question mastery (6 hard + 2 transfer), score-branched outcome

### Concurrency
- Max 3 active quests per student, one per subject
- Enforced by `quest_eligibility (student_id, subject)` PRIMARY KEY

### Day gating
- Day N+1 unlocks when BOTH (a) Day N completed AND (b) midnight SGT crossed since Day N completion
- Computed server-side in `day_unlock_status` field of GET /api/quests/:id

### Outcome branching (Day 3)
- score >= 85% → mastered (auto)
- 70-84% → slight_improvement (auto)
- < 70% → student picks: redo / slight / no_improvement

### Time zone
All midnight calculations resolve to Asia/Singapore (UTC+8).

### Routes added
```
GET  /api/quests                          → list active quests
GET  /api/quests/:id                      → fetch single quest with HUD/diagnosis
POST /api/quests/:id/advance-step         → advance (called by quiz/tutor)
POST /api/quests/:id/day3-outcome         → branch on poor Day 3
POST /api/quests/:id/abandon              → close
POST /api/quests/quiz-batch               → fetch quest-step questions
POST /api/award-xp                        → single XP grant endpoint
```
```

#### `docs/PARENT_FAQ.md` (NEW)

Copy QUEST_PAGE_SPEC.md §16 verbatim into this file. Header: "# Parent FAQ — Plan Quest". Add a brief preamble: "This FAQ is the source of truth for Plan Quest answers. Used in pages/quest-info.html, pricing.html, and customer support replies."

#### `docs/GAMIFICATION_RULES.md` (NEW)

Copy QUEST_PAGE_SPEC.md §12 verbatim. Used as standalone reference by future engineers and customer support.

## Verification

1. **Cron locally:**
   ```bash
   curl -H "User-Agent: vercel-cron/1.0" http://localhost:3000/api/cron/snapshot-mastery
   ```
   - Verify response: `{ success: true, students_processed: N, mastery_gains_awarded: M }`
   - Inspect `mastery_levels_snapshots`: rows for today should exist
   - If a test student's mastery improved between yesterday and today, verify `xp_events` has a `mastery_gain` row

2. **Apply 019 migration via Supabase SQL Editor.** Verify 4 new rows in `badge_definitions`.

3. **Visit `/pages/quest-info.html` in browser.** Verify:
   - Renders cleanly
   - Mobile responsive (375px width)
   - All sections from §16 present
   - Bottom nav shows when logged in
   - No console errors
   - Lighthouse mobile score ≥ 90

4. **Show diffs:** CLAUDE.md and the new doc files (PARENT_FAQ.md, GAMIFICATION_RULES.md).

5. **Run the full Lily Tan E2E from QUEST_PAGE_SPEC.md §18.** This is the definitive verification. All steps must pass.

If all five pass, ship.

---

# Final pre-merge checklist

Before declaring Phase 3 complete:

- [ ] All 4 commits pushed to `feynman82/Superholic-Lab/main`
- [ ] All curl tests in Commit 2 verification pass
- [ ] E2E walk-through in Commit 4 verification passes
- [ ] **Lily Tan E2E test from QUEST_PAGE_SPEC.md §18 passes** (the hardest gate)
- [ ] `docs/QUEST_PAGE_SPEC.md` v2.0 referenced from CLAUDE.md
- [ ] No new console.error in production logs from the 24 hours after deploy
- [ ] Vercel function count still equals 1 (verify in Vercel dashboard)
- [ ] All migrations show as applied in Supabase migration history

If you're unsure about anything, **stop and ask the user a question**. We are building the third pillar of the platform. Quality > speed.

---

**End of backend handoff prompt.**
