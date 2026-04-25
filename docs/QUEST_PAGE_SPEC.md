# QUEST_PAGE_SPEC.md — Plan Quest + Gamification Architecture
**Version:** 1.1 — LOCKED  
**Status:** Phase 1 complete — proceeding to Phase 2 (visual prototype)  
**Locked:** 2026-04-25  
**Bar:** "Ship complete" — first public test, paying customers, screenshot-worthy  
**Scope:** New `/quest` Next.js route; gamification system; AI avatar pipeline; cross-page integration; documentation cascade

---

## ⚡ DECISIONS LOCKED (2026-04-25)

| # | Decision | Locked value |
|---|---|---|
| Q1 | Migration order | 015 (mastery_levels retroactive) → 016 (gamification) → 017 (badge seeds). Production schema verified pre-write. |
| Q2 | Avatar reroll auto-suggest | Every 5th completed quest (5, 10, 15, 20...). Still consumes weekly cap. |
| Q3 | Badge count for launch | **25 high-quality badges**. Curated list in §9. |
| Q4 | Avatar cost ceiling | **$0.20/registered parent/month, including trial**. Tracked monthly per parent_id. Whichever hits first stops generation: weekly reroll cap OR monthly cost ceiling. Initial signup avatar counts toward budget. |
| Q5 | mastery_gain XP | **IN scope for v1.0** — 75 XP per AL band jump. Implemented via `mastery_levels_snapshots` daily diff. |
| Q6 | Privacy disclosure tone | As drafted in §10. |
| Q7 | Avatar aesthetic reference | **Halo Reach + Genshin Impact**. Hard sci-fi armor + magical light effects + cel-shaded readability. |
| Q8 | Phase gate process | Visual phases (2,3) → Vercel preview demo. Backend (5) → code review in chat. Integration (4) and Final (6) → both. |

**Plus locked from prior sessions:**

| Area | Decision |
|---|---|
| Quest page architecture | Next.js route `/quest` under `src/app/quest/page.tsx` |
| Gamification scope | Medium: XP + streak + badges + level system + AI avatars |
| Theme | Futuristic space marine + magic |
| Avatar variants per generation | 2 |
| Avatar reroll cap | 1/week + auto-suggest every 5th quest + $0.20/parent/month ceiling |
| Avatar input | Strict front-facing portrait |
| Raw photo retention | Delete immediately after stylization (PDPA-compliant) |
| Frameworks for app pages | Next.js + R3F + Framer Motion + Lottie permitted when they elevate UX |
| Pre-launch purge | Yes — every legacy file documented in FILE_MANIFEST.md |

---

## First principles

1. **Quest is the screenshot page.** It's what gets posted on social media, shown in marketing, and demoed to investors. Visual fidelity is non-negotiable.
2. **Gamification rewards real learning, not just clicks.** XP comes from completing meaningful actions (quests, exams, mastery gains), never from passive engagement.
3. **The 3-day quest is sacred.** It is the unique product differentiator. Don't dilute it with feature creep.
4. **Privacy is a feature, not a chore.** Singapore parents are PDPA-aware. The avatar pipeline's privacy story is a marketing asset.
5. **Two systems coexisting cleanly.** Vanilla HTML for content-driven app pages; Next.js for visually demanding pages and marketing. Clear boundary, documented in CLAUDE.md.

---

## Table of contents

1. [URL & routing contract](#1-url--routing-contract)
2. [Data contract](#2-data-contract)
3. [Migration plan](#3-migration-plan)
4. [API contracts](#4-api-contracts)
5. [Deep-link contract](#5-deep-link-contract)
6. [Component inventory](#6-component-inventory)
7. [State machine](#7-state-machine)
8. [Gamification system](#8-gamification-system)
9. [25 launch badges (curated)](#9-25-launch-badges-curated)
10. [Avatar pipeline](#10-avatar-pipeline)
11. [CLAUDE.md & docs update plan](#11-claudemd--docs-update-plan)
12. [File function manifest](#12-file-function-manifest)
13. [Phase 2-6 execution plan](#13-phase-2-6-execution-plan)

---

## 1. URL & routing contract

### Canonical URLs

```
/                              → Next.js (marketing homepage, src/app/page.tsx)
/quest                         → Next.js (NEW — src/app/quest/page.tsx)
/quest?student=<uuid>          → Override active student
/pages/progress.html           → vanilla (existing)
/pages/quiz.html               → vanilla (existing)
/pages/exam.html               → vanilla (existing)
/pages/tutor.html              → vanilla (existing)
/pages/dashboard.html          → vanilla (existing)
/pages/account.html            → vanilla (existing)
/pages/admin.html              → vanilla (existing)
/pages/subjects.html           → vanilla (existing)
```

**Why `/quest` not `/pages/quest.html`:** Next.js routes are flat. `pages/` directory is a legacy convention; new routes go to `src/app/<route>/page.tsx`. The URL feels premium — reads like Duolingo or Brilliant.

**Critical: `/quest` requires auth.** Page-level guard is server-side via Supabase SSR session check. No auth = redirect to `/pages/login.html?redirect=/quest`.

### Deep-link return parameters

When a kid completes Day N of a quest from quiz.html or tutor.html, the return target is:

```
/quest?completed=<step_index>&trigger=<quiz|tutor>&score=<percentage>
```

- `completed=0` means Day 1 just finished
- `trigger=quiz` or `trigger=tutor` provides contextual celebration ("Great quiz score! Day 1 complete.")
- `score` is the raw percentage from that quiz/tutor session
- The `quest_id` is implicit — quest page always loads the active quest for the active student
- After processing, page does `history.replaceState({}, '', '/quest')` to clean URL

### Active student resolution (cross-page consistent)

Same logic as `progress.js`:

```js
// 1. URL param ?student=<uuid> wins
// 2. localStorage 'shl_active_student_id' fallback
// 3. First student in students table for this parent
```

`/quest` reads this, then writes `localStorage.shl_active_student_id` so subsequent navigations are consistent.

---

## 2. Data contract

### Tables read by `/quest` (existing)

#### `remedial_quests` (existing — `supabase/migrations/005_remedial_quests.sql`)

```sql
id                  uuid PK
student_id          uuid FK → students(id)
subject             text
level               text
topic               text
trigger_score       numeric
trigger_attempt_id  uuid FK → quiz_attempts(id) NULL
quest_title         text
steps               jsonb   -- 3-element array
current_step        int     -- 0-indexed; 0 = Day 1 active
status              text    -- 'active' | 'completed' | 'abandoned'
created_at          timestamptz
updated_at          timestamptz
```

**`steps` jsonb shape (existing — confirmed in handlers.js):**

```json
[
  {
    "day": 1,
    "type": "quiz",
    "title": "Foundation Practice",
    "description": "Drill the basics...",
    "estimated_minutes": 15,
    "action_url": "/pages/quiz.html?subject=mathematics&topic=fractions&level=primary-5"
  },
  { "day": 2, "type": "tutor", ... },
  { "day": 3, "type": "quiz", ... }
]
```

#### `students` (existing)

```sql
id          uuid PK
parent_id   uuid FK → auth.users(id)
name        text
level       text
photo_url   text  -- (now AVATAR url, set by /api/avatar-generate)
created_at  timestamptz
```

#### `mastery_levels` (exists in production but NO tracked migration ⚠️)

```sql
-- Inferred from progress.js renderBKT()
student_id   uuid FK → students(id)
subject      text
topic        text
sub_topic    text
probability  numeric  -- 0.0 to 1.0
attempts     int
updated_at   timestamptz
```

**Action:** Migration 015 retroactively tracks this table. Production schema verified before write.

#### `quiz_attempts` & `question_attempts` (existing)

Used by `/api/analyze-weakness` for BKT computation.

---

### Tables WRITTEN by `/quest` (existing & new)

#### `remedial_quests` (existing)
- UPDATE on quest abandon (set `status='abandoned'`)
- UPDATE on step advance (increment `current_step`, or set `status='completed'`)
- INSERT on new quest generation (delegated to `/api/generate-quest`)

#### `student_xp` (NEW)
```sql
student_id     uuid PK FK → students(id)
total_xp       int  NOT NULL DEFAULT 0
current_level  int  NOT NULL DEFAULT 1
xp_in_level    int  NOT NULL DEFAULT 0
updated_at     timestamptz
```

#### `student_streaks` (NEW)
```sql
student_id    uuid PK FK → students(id)
current_days  int          NOT NULL DEFAULT 0
longest_days  int          NOT NULL DEFAULT 0
last_active   date
shield_count  int          NOT NULL DEFAULT 0
updated_at    timestamptz
```

#### `xp_events` (NEW — append-only ledger)
```sql
id            uuid PK
student_id    uuid FK → students(id)
event_type    text  -- 'quiz_complete' | 'quest_step_complete' | 'quest_complete' | 'exam_complete' | 'mastery_gain' | 'login_streak' | 'badge_earned'
xp_awarded    int
metadata      jsonb -- quest_id, attempt_id, mastery_delta, etc.
created_at    timestamptz
```

#### `student_badges` (NEW)
```sql
id            uuid PK
student_id    uuid FK → students(id)
badge_id      text FK → badge_definitions(id)
earned_at     timestamptz
context       jsonb
UNIQUE (student_id, badge_id)
```

#### `badge_definitions` (NEW — seed data)
```sql
id            text PK
name          text
description   text
icon_url      text
theme         text  -- 'space_marine' | 'magic' | 'hybrid'
rarity        text  -- 'common' | 'rare' | 'epic' | 'legendary'
xp_reward     int
sort_order    int
is_secret     bool DEFAULT false  -- hidden from catalog until earned
```

25 badge definitions seeded. List in §9.

#### `avatar_rerolls` (NEW)
```sql
id              uuid PK
student_id      uuid FK → students(id)
parent_id       uuid FK → auth.users(id)  -- denormalized for cost-ceiling queries
rerolled_at     timestamptz
trigger         text  -- 'manual' | 'quest_milestone' | 'initial_signup'
old_avatar_url  text
cost_usd        numeric(6,4)  -- ~0.05 per call; used for monthly aggregation
```

Index: `(parent_id, rerolled_at DESC)` for fast monthly cost queries.

#### `mastery_levels_snapshots` (NEW — supports mastery_gain XP)
```sql
id           uuid PK
student_id   uuid FK
snapshot_date date NOT NULL
subject      text
topic        text
sub_topic    text
probability  numeric
al_band      int  -- 1..8 (cached for fast diff)
created_at   timestamptz

UNIQUE (student_id, snapshot_date, subject, topic, sub_topic)
```

Daily Vercel cron writes snapshots. XP cron diffs latest two snapshots → awards `mastery_gain` XP if `al_band` improved.

---

## 3. Migration plan

### `supabase/015_mastery_levels.sql` (retroactive)

**Pre-write step:** verify production `mastery_levels` schema via Supabase dashboard. Then write `CREATE TABLE IF NOT EXISTS` matching exactly. Apply on production = no-op (table exists), but tracks in migration history.

### `supabase/016_quest_gamification.sql` (NEW)

```sql
-- ============================================================
-- 016_quest_gamification.sql
-- XP system, streaks, badges, avatar rerolls, mastery snapshots
-- All tables RLS-on, parent owns child rows via students.parent_id
-- ============================================================

-- ─── XP Aggregate ───────────────────────────────────────────
CREATE TABLE student_xp (
  student_id     uuid PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  total_xp       int NOT NULL DEFAULT 0,
  current_level  int NOT NULL DEFAULT 1,
  xp_in_level    int NOT NULL DEFAULT 0,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE student_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parents_own_student_xp" ON student_xp FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));

-- ─── XP Event Ledger ────────────────────────────────────────
CREATE TABLE xp_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  event_type  text NOT NULL CHECK (event_type IN (
    'quiz_complete', 'quest_step_complete', 'quest_complete',
    'exam_complete', 'mastery_gain', 'login_streak', 'badge_earned'
  )),
  xp_awarded  int NOT NULL,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_xp_events_student_time ON xp_events (student_id, created_at DESC);

ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parents_own_student_xp_events" ON xp_events FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));

-- ─── Streaks ────────────────────────────────────────────────
CREATE TABLE student_streaks (
  student_id    uuid PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  current_days  int NOT NULL DEFAULT 0,
  longest_days  int NOT NULL DEFAULT 0,
  last_active   date,
  shield_count  int NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE student_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parents_own_student_streaks" ON student_streaks FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));

-- ─── Badge Catalog ──────────────────────────────────────────
CREATE TABLE badge_definitions (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  description   text NOT NULL,
  icon_url      text NOT NULL,
  theme         text NOT NULL CHECK (theme IN ('space_marine', 'magic', 'hybrid')),
  rarity        text NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  xp_reward     int NOT NULL DEFAULT 0,
  sort_order    int NOT NULL DEFAULT 0,
  is_secret     boolean NOT NULL DEFAULT false
);

ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_badges" ON badge_definitions FOR SELECT USING (true);

-- ─── Earned Badges ──────────────────────────────────────────
CREATE TABLE student_badges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_id    text NOT NULL REFERENCES badge_definitions(id),
  earned_at   timestamptz NOT NULL DEFAULT now(),
  context     jsonb DEFAULT '{}',
  UNIQUE (student_id, badge_id)
);

CREATE INDEX idx_student_badges_lookup ON student_badges (student_id, earned_at DESC);

ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parents_own_student_badges" ON student_badges FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));

-- ─── Avatar Reroll Audit ────────────────────────────────────
CREATE TABLE avatar_rerolls (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rerolled_at     timestamptz NOT NULL DEFAULT now(),
  trigger         text NOT NULL CHECK (trigger IN ('manual', 'quest_milestone', 'initial_signup')),
  old_avatar_url  text,
  cost_usd        numeric(6,4) NOT NULL DEFAULT 0.05
);

CREATE INDEX idx_avatar_rerolls_student_recent ON avatar_rerolls (student_id, rerolled_at DESC);
CREATE INDEX idx_avatar_rerolls_parent_month  ON avatar_rerolls (parent_id, rerolled_at DESC);

ALTER TABLE avatar_rerolls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parents_own_avatar_rerolls" ON avatar_rerolls FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- ─── Mastery Levels Snapshots (for mastery_gain XP) ─────────
CREATE TABLE mastery_levels_snapshots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  subject       text NOT NULL,
  topic         text NOT NULL,
  sub_topic     text,
  probability   numeric NOT NULL,
  al_band       int NOT NULL,  -- 1..8 cached for fast diff
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, snapshot_date, subject, topic, sub_topic)
);

CREATE INDEX idx_mastery_snapshots_student_date ON mastery_levels_snapshots (student_id, snapshot_date DESC);

ALTER TABLE mastery_levels_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parents_own_mastery_snapshots" ON mastery_levels_snapshots FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));
```

### `supabase/017_seed_badges.sql`

25 INSERT statements seeding the curated badge list from §9.

### Migration apply order
1. `015_mastery_levels.sql` (retroactive verify)
2. `016_quest_gamification.sql` (new tables)
3. `017_seed_badges.sql` (badge data)

Apply via Supabase MCP `apply_migration` (tracked in migration history).

---

## 4. API contracts

### Existing endpoints used by `/quest`

#### `GET /api/analyze-weakness?student_id=X&subject=Y`
Returns BKT diagnosis. Used to render "Why this quest?" diagnosis card.

#### `POST /api/generate-quest`
Body: `{ student_id, subject, level, topic, trigger_score, trigger_attempt_id }`
Returns: `{ quest: { id, steps, current_step, ... } }`

### NEW endpoints (route through `api/index.js` gateway)

#### `POST /api/award-xp`
Body: `{ student_id, event_type, xp_amount, metadata? }`
Returns: `{ total_xp, level_before, level_after, leveled_up, badges_earned: [], xp_in_level }`

Server-side:
1. INSERT row into `xp_events`
2. UPDATE `student_xp` → recompute level via `xpToLevel()`
3. Call `checkBadges()` → INSERT into `student_badges` for any newly earned
4. Return result for client celebrations

**Anti-cheat:** Server validates `student_id` belongs to caller. `xp_amount` validated against allow-list per `event_type` (clients can't award arbitrary XP).

#### `GET /api/streak-status?student_id=X`
Returns: `{ current_days, longest_days, last_active, shield_count, at_risk: bool }`

#### `POST /api/streak-shield-use`
Body: `{ student_id }`
Returns: `{ success, shield_count_after }`

#### `POST /api/avatar-generate`
Body (multipart/form-data): `{ student_id, photo: File }`
Returns: `{ variants: [url1, url2], expires_at, cost_status: { used_this_month_usd, monthly_ceiling_usd, remaining_usd } }`

Server-side:
1. **Cost ceiling check FIRST** — sum `avatar_rerolls.cost_usd` for parent_id this calendar month. If sum + 0.05 > 0.20 → reject with 429: "Monthly avatar budget reached. Resets on the 1st."
2. **Weekly cap check** — count `avatar_rerolls` for student_id in last 7 days. If ≥ 1 (and trigger != 'initial_signup') → reject: "Already used this week's reroll."
3. Validate student belongs to caller
4. Face moderation via Replicate `face-detection` (reject if 0 faces, 2+ faces, confidence < 0.8, face area < 25%)
5. Upload temp to `avatars/raw/<student_id>/<timestamp>.jpg` (private)
6. Call Replicate `face-to-many` × 2 with different seeds, theme prompt (§10)
7. Upload variants to `avatars/stylized/<student_id>/<variant_id>.png` (public)
8. **Delete raw photo immediately**
9. Return `{ variants, expires_at: now() + 5 minutes }`

If user closes the page without confirming, cron job deletes both stylized variants after 10 minutes.

#### `POST /api/avatar-confirm`
Body: `{ student_id, chosen_url, discarded_url }`

Server-side:
1. UPDATE `students.photo_url = chosen_url`
2. INSERT row into `avatar_rerolls` (cost = 0.05, trigger from request context)
3. DELETE discarded variant from storage
4. Return success

**Note:** `avatar_rerolls` row inserted on CONFIRM, not generate. This means failed/abandoned generations don't count toward cost ceiling. If kid generates → never confirms → tries again 1 hour later, only successful confirmation counts.

⚠️ **Actually, this creates a loophole.** Generation costs $0.05 even without confirmation. The cost ceiling protects ANTHROPIC's bill, so we MUST count generation, not confirmation.

**Revised:** Insert `avatar_rerolls` row on `/api/avatar-generate` start, BEFORE Replicate calls. If generation fails after, set a `cost_recovered=true` flag. The monthly cost query subtracts recovered rows.

```sql
ALTER TABLE avatar_rerolls ADD COLUMN cost_recovered boolean NOT NULL DEFAULT false;
-- Cost query: SUM(cost_usd) WHERE parent_id=X AND rerolled_at >= date_trunc('month', now()) AND cost_recovered=false
```

#### `POST /api/avatar-reroll`
Body: `{ student_id, trigger: 'manual' | 'quest_milestone' }`

Same flow as `/avatar-generate` but tagged with the trigger type for analytics.

#### `GET /api/avatar-reroll-status?student_id=X`
Returns:
```
{
  weekly_available: bool,
  weekly_next_at: timestamptz,
  monthly_budget_used_usd: number,
  monthly_budget_total_usd: 0.20,
  monthly_resets_at: timestamptz,
  effective_available: bool,  -- weekly_available AND (budget_used + 0.05 <= 0.20)
  reroll_history: [...recent 5 events]
}
```

Used by quest page to render the reroll button state with full transparency: "1 reroll/week — Next available May 2 — $0.15 used this month of $0.20 budget."

#### `POST /api/quest-step-complete`
Body: `{ quest_id, step_index, score, trigger: 'quiz' | 'tutor' }`

Server-side:
1. Verify quest belongs to caller's child
2. Verify step_index matches `current_step` (idempotent — repeat calls don't double-advance)
3. UPDATE `current_step += 1` (or set `status='completed'` if final step)
4. Call `/api/award-xp` internally for `quest_step_complete` (50 XP) + bonuses
5. Check badges
6. If `current_step` is now N+1 and quest still active: check if N+1 % 5 == 0 (this is the 5th, 10th, etc. completed quest globally for this student) → flag `auto_reroll_eligible=true` in response
7. Return updated quest + xp delta + badges + auto_reroll flag

### Update to `api/index.js`

Add 8 new routes to switch:
```js
case 'award-xp':              return handleAwardXP(req, res);
case 'streak-status':         return handleStreakStatus(req, res);
case 'streak-shield-use':     return handleStreakShieldUse(req, res);
case 'avatar-generate':       return handleAvatarGenerate(req, res);
case 'avatar-confirm':        return handleAvatarConfirm(req, res);
case 'avatar-reroll':         return handleAvatarReroll(req, res);
case 'avatar-reroll-status':  return handleAvatarRerollStatus(req, res);
case 'quest-step-complete':   return handleQuestStepComplete(req, res);
```

Plus `vercel.json` rewrites for each.

**Vercel function count:** Still 1 function (api/index.js gateway). 30 routes total. ✅

---

## 5. Deep-link contract

### Outbound from `/quest` (when kid clicks "Start Day N")

`/quest` constructs the action URL by reading `step.action_url` from the quest's `steps` array:

```
/pages/quiz.html?subject=mathematics&topic=fractions&level=primary-5&from_quest=<quest_id>&step=<step_index>
/pages/tutor.html?subject=mathematics&topic=fractions&from_quest=<quest_id>&step=<step_index>
```

`from_quest` and `step` appended client-side, NOT stored in DB.

### Inbound to `/quest`

When `quiz.html` or `tutor.html` detect `from_quest` in URL, on completion they redirect to:

```
/quest?completed=<step_index>&trigger=<quiz|tutor>&score=<percentage>
```

Quest page:
1. Calls `POST /api/quest-step-complete` with full payload
2. Server advances state, awards XP, checks badges
3. Returns updated quest + xp_delta + badges_earned + auto_reroll_eligible
4. Page renders return celebration:
   - Confetti from top
   - "+50 XP" floating numbers
   - Level-up modal if leveled (LevelUpModal.tsx)
   - Badge unlock if new (BadgeUnlockModal.tsx, queued sequentially)
   - Auto-reroll suggestion modal if `auto_reroll_eligible` AND weekly+monthly budget allows
5. After all celebrations close: transition to ACTIVE STATE for next day (or COMPLETE STATE)
6. URL cleaned: `history.replaceState({}, '', '/quest')`

### Migration of existing return flow

**Decision:** From launch day, all NEW quests use `/quest` flow. Existing in-flight quests (max ~10 at launch time) get manually marked completed or expired pre-launch. No backward compat needed — pre-launch.

The `quiz.js` and `tutor.js` URL builders detect `from_quest` and route to `/quest?completed=...`.

### `progress.html` quest preview card

After `/quest` launches, `#quest-map-section` becomes a small preview:

```
┌──────────────────────────────────────────┐
│ ⚡ Active Quest                          │
│                                          │
│ "Master Fractions in 3 Days"             │
│ Day 2 of 3 · 1 day remaining             │
│                                          │
│ [Continue Quest →]   (links to /quest)   │
└──────────────────────────────────────────┘
```

`progress.js` `renderQuestMap()` → renamed `renderQuestPreviewCard()`. Full timeline UI removed from progress.html.

---

## 6. Component inventory

### File structure

```
src/app/quest/
├── page.tsx                    -- Server component, auth guard, data fetch
├── QuestClient.tsx             -- Main client orchestrator, state machine
└── components/
    ├── QuestHero.tsx           -- Top hero band (title, day progress)
    ├── QuestTimeline.tsx       -- 3-node Three.js or SVG timeline
    ├── ActiveDayCard.tsx       -- Big card showing today's mission
    ├── DayAccordion.tsx        -- "What's coming next" expandable
    ├── DiagnosisCard.tsx       -- "Why this quest?" with mini SVG dependency tree
    ├── HUDStrip.tsx            -- Top strip: avatar, XP bar, streak, level
    ├── XPBar.tsx               -- Persistent XP bar component
    ├── StreakFlame.tsx         -- Streak counter with Lottie flame
    ├── AvatarSlot.tsx          -- Avatar circle + reroll button + status tooltip
    ├── BadgeUnlockModal.tsx    -- Celebration when badge earned
    ├── LevelUpModal.tsx        -- Celebration when level increases
    ├── EmptyQuestState.tsx     -- "No active quest" + generate CTA
    ├── QuestCompleteState.tsx  -- "🎉 You did it!" final celebration
    ├── ReturningCelebration.tsx -- Shown when ?completed=N detected
    ├── AvatarUploadModal.tsx   -- Photo upload + variant pick UI
    └── AbandonConfirmModal.tsx -- Confirm before abandoning
```

### Visual design tokens (from STYLEGUIDE.md)

- **Background:** `bg-page` with `texture-light-grid`, gradient overlay `#1A2E2A → #2D4A44`
- **Glass panels:**
  - `glass-panel-1` — main quest container (32px radius, blur(16px))
  - `glass-panel-2` — Active Day card (deeper blur(24px), inner glow)
  - `glass-panel-rose` — active step accent (rose-tinted)
- **Typography:**
  - Day numbers: Bebas Neue 4-5rem
  - Quest title: Bebas Neue 2.5-3rem
  - Body: Plus Jakarta Sans 0.95-1.1rem
  - Mono accents (level, XP): JetBrains Mono
- **Color tokens:**
  - Mint `#39FFB3` — completed/success
  - Rose `#B76E79` — active/CTA
  - Sage `#51615E` / `#1A2E2A` — backgrounds
  - Cream `#e3d9ca` — text on dark
  - Amber `#FFB830` — streak flame
- **Spacing:** 8-point grid. All paddings/gaps: `8/16/24/32/48/64/96px`

### Above-the-fold composition (mobile-first)

```
┌──────────────────────────────────────────┐
│  ⬅ ← back   QUEST   profile menu →       │ <- top nav (40px)
├──────────────────────────────────────────┤
│  [👨‍🚀] Lily Tan        Lvl 7 / Cadet     │
│         ████████░░░░ 1,240/2,000 XP      │ <- HUD strip
│         🔥 12 days streak                │
├──────────────────────────────────────────┤
│         ✨ MASTER FRACTIONS               │ <- Hero band (sage-dark)
│         IN 3 DAYS                         │
│         Mathematics · Day 2 of 3          │
│                                          │
│   ●━━━━━●━━━━━○                           │ <- 3D timeline
│  Day 1   Day 2   Day 3                   │
│  ✅      ▶       🔒                       │
├──────────────────────────────────────────┤
│  ┌──────────────────────────────────┐    │
│  │ TODAY'S MISSION   ⏱ ~15 min      │    │ <- Active day card
│  │                                  │    │   (rose accent)
│  │ Talk it through with             │    │
│  │ Miss Wena                        │    │
│  │                                  │    │
│  │ Practice the bar model approach  │    │
│  │ to fractions with your AI tutor. │    │
│  │                                  │    │
│  │ [▶ Start Day 2]                  │    │
│  └──────────────────────────────────┘    │
├──────────────────────────────────────────┤
│  📊 Why this quest?                       │
│  ┌──────────────────────────────────┐    │
│  │ You're at AL5 (75%) in Fractions │    │
│  │  [SVG dependency tree]           │    │
│  │  Fractions → Ratio → Percentage  │    │
│  │ Mastering this unlocks 4 topics  │    │
│  └──────────────────────────────────┘    │
├──────────────────────────────────────────┤
│  📅 What's coming next                    │ <- Accordion
│  ▸ Day 3: Mock Quiz (~15 min)             │
├──────────────────────────────────────────┤
│  ⚙️ Abandon Quest                         │
└──────────────────────────────────────────┘
```

### Three.js / Framer Motion / Lottie usage

| Component | Tech | What it does |
|---|---|---|
| `QuestTimeline.tsx` | Three.js + R3F | 3D nodes with depth, particles around active, morph between states |
| `ActiveDayCard.tsx` | Framer Motion | Subtle floating, hover-lift on CTA |
| `BadgeUnlockModal.tsx` | Framer Motion + Lottie | Holographic burst, confetti, badge spins-in |
| `LevelUpModal.tsx` | Framer Motion + Lottie | Energy explosion, level number counts up |
| `XPBar.tsx` | Framer Motion | Smooth fill on XP change |
| `StreakFlame.tsx` | Lottie | Animated flame; intensity scales with streak length |
| `AvatarSlot.tsx` | Framer Motion + Lottie | Avatar with rotating "magic ring", reroll aura |
| `ReturningCelebration.tsx` | Framer Motion | Confetti, "Day N Complete!" badge bounces in |

---

## 7. State machine

```
┌─────────────────────────────────────────────────────────────────┐
│                          /quest STATES                          │
└─────────────────────────────────────────────────────────────────┘

  [INITIAL: server-side data fetch]
          │
          ▼
   ┌─────────────┐         no active quest         ┌──────────────┐
   │ Page loads  │────────────────────────────────▶│ EMPTY STATE  │
   └─────────────┘                                 └──────────────┘
          │                                                │
          │ active quest found                             │ Click "Generate Quest"
          │                                                ▼
          ▼                                       /api/generate-quest
   ┌─────────────────┐                                     │
   │ has ?completed= │ yes                                 │ success
   │ in URL?         │────────────────┐                    ▼
   └─────────────────┘                ▼            ┌──────────────┐
          │ no                ┌─────────────────┐  │ ACTIVE STATE │◀──┐
          │                   │ RETURN          │  │ Day 1 of 3   │   │
          ▼                   │ CELEBRATION     │  └──────────────┘   │
   ┌──────────────┐           │ + advance step  │           │         │
   │ ACTIVE STATE │           │ + award XP      │           │         │
   │ render       │           │ + check badges  │           │ Click   │
   │ current      │           │ + check reroll  │           │ "Start  │
   │ day card     │           └─────────────────┘           │  Day N" │
   └──────────────┘                    │                    ▼         │
          │                            │            [Deep-link        │
          │                            ▼             to quiz/tutor]   │
          │                   ┌──────────────┐               │        │
          │                   │ ACTIVE STATE │               │        │
          │                   │ Day N+1      │ ◀──────       │        │
          │                   └──────────────┘       │       │        │
          │                            │             │       │        │
          │                            ▼             │       │        │
          │                  is final step?  yes ────│       │        │
          │                            │ no          │       ▼        │
          │                            ▼             │  [Quiz/tutor  │
          │                            └─────────────│   completes,  │
          │                                          │   redirects   │
          │                                          │   back here]  │
          │                                          │       │        │
          ▼                                          │       └────────┘
   ┌──────────────┐                                  │
   │ Click        │                                  ▼
   │ "Abandon"    │                          ┌──────────────────┐
   └──────────────┘                          │ COMPLETE STATE   │
          │                                  │ + auto-reroll    │
          │ confirm                          │   suggest if     │
          ▼                                  │   5/10/15... %5  │
   ┌──────────────┐                          └──────────────────┘
   │ ABANDONED    │                                    │
   │ STATE        │                                    │ Click "Start
   └──────────────┘                                    │  new quest"
          │                                            ▼
          │ Click "Start a new quest"          [back to EMPTY STATE]
          ▼
   [back to EMPTY STATE]
```

---

## 8. Gamification system

### XP rules (allow-list — server-validated)

| Action | XP | Notes |
|---|---|---|
| Quiz complete (any score) | 10 | Base reward |
| Quiz score ≥ 80% | +15 (= 25 total) | Quality bonus |
| Quiz score 100% | +25 (= 35 total) | Perfect bonus |
| Quest step complete | 50 | Per step |
| Quest fully complete (3/3 steps) | +200 (bonus) | Big payoff |
| Exam complete (WA/EOY/PSLE) | 100 | |
| Exam score ≥ 80% | +50 (= 150 total) | |
| **Mastery level gain (AL band jump)** | **75 per band** | **Diff `mastery_levels_snapshots` daily** |
| Daily login streak | 5/day, max 50 | Cap prevents gaming |
| Badge earned | varies (badge_definitions.xp_reward) | One-time per badge |

**Anti-cheat:** Server validates every claim. For `quest_step_complete`, server verifies step was completed within last 60s. For `mastery_gain`, only the daily cron (server-only path) can emit these events.

### Level system

```
Level N requires: cumulative 100 * N * (N-1) XP
Level 1 → 2: 200 XP cumulative
Level 2 → 3: 600 XP cumulative
Level 3 → 4: 1,200 XP cumulative
...
Level 50 (cap): 245,000 XP cumulative
```

```js
function xpToLevel(totalXp) {
  // totalXp >= 100 * N * (N-1) → N <= (1 + sqrt(1 + totalXp/25)) / 2
  const level = Math.floor((1 + Math.sqrt(1 + totalXp / 25)) / 2);
  return Math.min(50, Math.max(1, level));
}

function xpInCurrentLevel(totalXp, level) {
  return totalXp - 100 * level * (level - 1);
}

function xpNeededForNextLevel(level) {
  return 200 * level;  // delta from current to next
}
```

### Streak rules

- Streak day = at least 1 XP-earning action that day
- Resets to 0 if 24h pass with no activity AND no shield
- Shield earned at every 7-day milestone (max 3 stocked)
- Shield auto-uses on missed-day detection
- Streak XP capped at 50/day

### Mastery gain detection (mastery_gain XP)

**Daily Vercel cron** at 03:00 SGT:
1. For each student: snapshot current `mastery_levels` rows into `mastery_levels_snapshots` table
2. Compute `al_band` from `probability` (1=≥0.95, 8=<0.50, etc. — match progress.js `getALBand` logic)
3. Diff today's snapshot vs yesterday's:
   - For each (subject, topic, sub_topic): if `al_band_today < al_band_yesterday` (improvement), emit `mastery_gain` XP event with delta count

```js
// pseudocode for cron
for (student of allActiveStudents) {
  const today = await fetchMasteryLevels(student.id);
  const yesterday = await fetchSnapshots(student.id, dateYesterday);
  
  // Write today's snapshot
  for (row of today) {
    await insertSnapshot(student.id, today_date, row);
  }
  
  // Award mastery_gain XP for each improvement
  for (row of today) {
    const yesterdayRow = yesterday.find(y => 
      y.subject === row.subject && y.topic === row.topic && y.sub_topic === row.sub_topic
    );
    if (!yesterdayRow) continue;  // no prior data
    const todayBand = bandFromProbability(row.probability);
    const yesterdayBand = bandFromProbability(yesterdayRow.probability);
    if (todayBand < yesterdayBand) {
      const bandsImproved = yesterdayBand - todayBand;
      await awardXp({
        student_id: student.id,
        event_type: 'mastery_gain',
        xp_amount: bandsImproved * 75,
        metadata: {
          subject: row.subject,
          topic: row.topic,
          sub_topic: row.sub_topic,
          al_before: yesterdayBand,
          al_after: todayBand,
        },
      });
    }
  }
}
```

Cron schedule in `vercel.json`:
```json
{ "path": "/api/cron/snapshot-mastery", "schedule": "0 19 * * *" }
```
(19:00 UTC = 03:00 SGT next day)

---

## 9. 25 launch badges (curated)

Curated for **achievement diversity** without dilution. 11 common, 8 rare, 5 epic, 1 legendary. 4 secret.

### Common (11) — earnable in first week

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
| `set_avatar` | Identity Forged | Set your first avatar | hybrid | 75 |

### Rare (8) — first month achievable

| ID | Name | Description | Theme | XP |
|---|---|---|---|---|
| `first_quest` | First Mission | Complete your first Plan Quest | hybrid | 150 |
| `quest_3` | Mission Streak | Complete 3 quests | hybrid | 200 |
| `streak_7` | Constellation | 7-day streak | magic | 100 |
| `perfect_quiz` | Flawless Run | Score 100% on any quiz | hybrid | 100 |
| `subject_explorer` | Tri-Star | Complete quizzes in all 3 subjects | space_marine | 100 |
| `level_10` | Cadet Stripe | Reach level 10 | space_marine | 100 |
| `helper_50` | Wisdom Keeper | 50 messages with Miss Wena | magic | 75 |
| `weakness_crusher` | Bug Hunter | Improve any topic by 2 AL bands | hybrid | 150 |

### Epic (5) — long-term goals

| ID | Name | Description | Theme | XP |
|---|---|---|---|---|
| `streak_30` | Galactic Compass | 30-day streak | magic | 500 |
| `al1_master` | Apex Operator | Reach AL1 in any subject | space_marine | 300 |
| `perfect_exam` | Pristine Mind | Score 100% on a WA/EOY/PSLE exam | hybrid | 250 |
| `quest_10` | Veteran Operator | Complete 10 quests | hybrid | 300 |
| `level_25` | Lieutenant | Reach level 25 | space_marine | 250 |

### Legendary (1) — endgame

| ID | Name | Description | Theme | XP |
|---|---|---|---|---|
| `level_50` | Commander | Reach level 50 | space_marine | 1000 |

### Secret badges (4 — `is_secret=true`, hidden from catalog until earned)

| ID | Name | Description | Theme | Rarity | XP |
|---|---|---|---|---|---|
| `secret_alchemist` | Alchemist | Score 100% on a HOTS-difficulty quiz | magic | epic | 300 |
| `secret_oracle` | Oracle | Predict your next BKT mastery within 5% | magic | legendary | 500 |
| `secret_warden` | Vault Warden | Read 25 study notes | magic | rare | 150 |
| `secret_phoenix` | Phoenix | Recover from a 0-day streak by hitting 7 days again | hybrid | epic | 250 |

**Total launch XP awardable from badges:** ~5,200 XP across all 25 = enough to push a power user to Level 11-12 from badges alone.

---

## 10. Avatar pipeline

### Theme: Space Marine + Magic (Halo Reach + Genshin Impact)

**Visual references locked:**
- Halo Reach armor — hard sci-fi, military, pristine condition, helmet design
- Genshin Impact — magical light effects, glowing runes, cel-shaded color palette
- Combined: holographic glass + neon edges + magical aura behind subject

**Replicate `face-to-many` prompt template:**

```
A heroic space marine portrait in the style of Halo Reach armor mixed
with Genshin Impact magical aesthetics, helmet partially open showing
the original face clearly, glowing magical runes etched into pristine
white-and-mint armor, holographic rose-gold HUD elements floating
nearby, cinematic dramatic lighting, photorealistic with cel-shaded
edges, hero pose, neon mint and rose accent lights, magical aura
behind subject, ultra-detailed, sci-fi fantasy hybrid masterpiece
```

Variants generated by changing seed value, NOT prompt. Theme consistency + 2 different aesthetic outcomes per generation.

### Privacy flow (PDPA/COPPA compliant)

```
1. Kid uploads photo (in /quest avatar slot or pages/dashboard.html)
   ↓
2. Client validates: <5MB, JPG/PNG, has face (browser MediaPipe quick check)
   ↓
3. POST /api/avatar-generate (multipart/form-data)
   ↓
4. Server: monthly cost ceiling check (parent_id × this calendar month)
   - If used + 0.05 > 0.20 → REJECT 429
   ↓
5. Server: weekly cap check (student_id × last 7 days)
   - If trigger != 'initial_signup' AND ≥1 reroll in last 7 days → REJECT 429
   ↓
6. Server: face-detection moderation (Replicate face-detection model)
   - Reject if 0 or 2+ faces, confidence < 0.8, face area < 25%
   ↓
7. Server: INSERT avatar_rerolls row (cost = 0.05, cost_recovered = false)
   ↓
8. Server: upload temp to avatars/raw/<student_id>/<timestamp>.jpg (private)
   ↓
9. Server: call Replicate face-to-many × 2 (different seeds, theme prompt)
   - On failure: UPDATE avatar_rerolls SET cost_recovered=true, return 500
   ↓
10. Server: upload variants to avatars/stylized/<student_id>/<variant_id>.png (public)
    ↓
11. Server: DELETE raw photo (immediate)
    ↓
12. Return [variant_url_1, variant_url_2] with expires_at = now() + 5 minutes
    ↓
13. Client: shows 2 variants side-by-side
    - Countdown timer "Decide in: 4:55"
    - "Pick your favorite" CTA on each
    ↓
14. Kid clicks one → POST /api/avatar-confirm
    ↓
15. Server: UPDATE students.photo_url, DELETE discarded variant
    ↓
16. Avatar appears across all pages
```

### Reroll flow

**Manual reroll button (always visible):**
- Disabled if last reroll < 7 days OR monthly budget exhausted
- Tooltip shows specific blocker: "Next available: May 2" or "$0.20 used this month — resets June 1"
- Click → confirm modal → upload new photo → 2 new variants

**Auto-suggested every 5th completed quest (5, 10, 15, 20...):**
- Triggered by `auto_reroll_eligible=true` in quest-step-complete response
- Modal: "🎁 You've earned a free reroll! Tweak your avatar?"
- Kid can decline ("Maybe later") — auto-reroll bonus does NOT carry over (use it or lose it)
- Counts toward weekly + monthly cap

### Cost & rate limit math

- Generation cost: ~$0.05 (face-detection + 2× face-to-many + storage)
- Monthly per-parent ceiling: $0.20 = max 4 generations
- Weekly per-student cap: 1
- Initial signup: counts toward budget (but no weekly cap)
- Family Plan (3 kids): 3 initial + 3 weekly maximum theoretical = cost peaks at $0.30 in week 1, then capped at $0.20/month thereafter (so kid 3 can't reroll if kids 1+2 already exhausted budget)

This is INTENTIONAL — Family Plan kids share the parent's budget. Documented in pricing.html FAQ.

### Storage policy

- `avatars/raw/` — private, no public access, 24h auto-delete via Storage lifecycle rule
- `avatars/stylized/` — public read, only owner writes
- Discarded variant deleted on `/avatar-confirm`
- Abandoned (unconfirmed) variants deleted after 10 minutes via cron

### `privacy.html` updates required

```markdown
### Children's photos and AI avatars  

When a child uploads a photo to create their avatar, we use it ONLY to
generate the stylized avatar image. We delete the original photo within
60 seconds of the avatar being created. We never share the original
photo, never use it for training AI models, and never store it
permanently.

The stylized avatar (a fictional space-marine illustration based on
facial features) is stored in your child's profile and used only within
Superholic Lab. You can replace it at any time, and deleting the account
permanently removes all avatars.

What we use: Replicate's face-to-many AI service, hosted in the United
States. The transient request includes only the photo and our prompt;
no metadata, name, or identifier is sent.

PDPA compliance: This processing is necessary for performing the service
contract you've signed up for. You can request deletion at any time via
account settings.
```

### Vercel cron jobs added

```json
{
  "path": "/api/cron/snapshot-mastery",
  "schedule": "0 19 * * *",
  "comment": "Daily mastery snapshot at 03:00 SGT for mastery_gain XP"
},
{
  "path": "/api/cron/cleanup-orphan-avatars",
  "schedule": "*/10 * * * *",
  "comment": "Every 10 min: delete unconfirmed avatar variants older than 10 min"
}
```

---

## 11. CLAUDE.md & docs update plan

### CLAUDE.md changes (committed at end of Phase 6)

#### Tech stack table — add row

```
| Marketing site + /quest | Next.js 15 + R3F + framer-motion + lottie-react | Premium UX |
```

#### Coding rules section — replace block

Replace `Use JavaScript frameworks (vanilla JS only)` rule with:

```
### Framework boundary (added 2026-04-25)
- App pages (vanilla): pages/quiz.html, pages/exam.html, pages/progress.html,
  pages/tutor.html, pages/dashboard.html, pages/account.html, pages/admin.html,
  pages/subjects.html, pages/login.html, pages/signup.html, pages/setup.html,
  pages/pricing.html, pages/about.html, pages/contact.html, pages/refund-request.html
- Next.js pages (src/app/): / (homepage), /quest, future visually-demanding routes
- Decision rule: Does this page need 3D, scroll-linked animation, or premium framer
  transitions? YES → Next.js. NO → vanilla.

### NEVER
- Mix vanilla and React inside the same page (commit to one per route)
- Add new npm dependencies without updating CLAUDE.md tech stack table
```

#### NEW Section — Gamification System

```markdown
## Gamification System (added 2026-04-25)

The platform includes XP, levels, streaks, badges, and AI avatars.

Reference: docs/QUEST_PAGE_SPEC.md sections 8-10 are authoritative.

### Tables
- student_xp — aggregate per student
- xp_events — append-only audit log
- student_streaks — current/longest/last_active
- badge_definitions — catalog (25 seeded at launch)
- student_badges — earned, unique per (student, badge)
- avatar_rerolls — usage + cost audit
- mastery_levels_snapshots — daily for mastery_gain XP

### XP earning rules
Server-validated allow-list. See docs/GAMIFICATION_RULES.md.
NEVER trust client-supplied xp_amount.

### Avatar pipeline
Theme: space marine + magic (Halo Reach + Genshin Impact aesthetic).
2 variants per generation. 1 reroll/week. $0.20/parent/month ceiling.
Front-facing portraits only. Raw photo deleted within 60s.
PDPA-compliant: privacy.html documents the policy.

### Routes (NEW)
- POST /api/award-xp
- POST /api/quest-step-complete
- GET  /api/streak-status
- POST /api/streak-shield-use
- POST /api/avatar-generate
- POST /api/avatar-confirm
- POST /api/avatar-reroll
- GET  /api/avatar-reroll-status

All route through api/index.js (no Vercel function-limit hit).
```

### docs/ folder updates

| File | Status | Action |
|---|---|---|
| `docs/QUEST_PAGE_SPEC.md` | NEW | This file (locked) |
| `docs/GAMIFICATION_RULES.md` | NEW | Pull §8-9 into standalone reference |
| `docs/AVATAR_PIPELINE.md` | NEW | Pull §10 into standalone reference |
| `docs/FILE_MANIFEST.md` | NEW | Per §12; populated incrementally through Phase 6 |
| `docs/LAUNCH_PLAN_v1.md` | UPDATE | Section 6 — clarify what's IN scope vs deferred |
| `docs/CONTENT_TIMELINE.md` | UPDATE | Add gamification milestones |
| `docs/design-audit.md` | UPDATE Week 6 | Re-score progress.html + new /quest |
| `STYLEGUIDE.md` | UPDATE | Add gamification component classes |
| `ARCHITECTURE.md` | UPDATE | Quest data flow + avatar pipeline + xp diagrams |

### `privacy.html` update

New section as drafted in §10. Approved by you before deploy.

### `pricing.html` update

Add line items under "What's included":
- AI-generated space marine avatar (1 reroll/week, shared family budget)
- XP, levels, badges, and streak tracking

---

## 12. File function manifest

`docs/FILE_MANIFEST.md` is created during Phase 6. Status legend:

- ✅ KEEP — actively used, tested, launch-ready
- 🔧 REFACTOR — used, but needs work before launch
- ⚠️ AUDIT — uncertain function, investigate
- ❌ PURGE — not used, remove before launch
- 🆕 NEW — to be built (planned)

Initial breakdown (from on-disk audit 2026-04-25):

### Root files

| File | Function | Status |
|---|---|---|
| `404.html` | Not-found page | ✅ KEEP |
| `index.html` | Marketing homepage (legacy vanilla) | 🔧 REFACTOR — replaced by `src/app/page.tsx` (in progress) |
| `index 3D scroll.html` | Prototype 3D-scroll homepage | ❌ PURGE — ideas now in `src/components/ScrollStory.tsx` |
| `package.json` | Project deps | ✅ KEEP |
| `vercel.json` | Routing + crons | ✅ KEEP — add new API routes |
| `jsconfig.json` | Path aliases (vanilla) | ✅ KEEP |
| `components.json` | shadcn config | ✅ KEEP |
| `robots.txt` | SEO | 🔧 REFACTOR — flip to allow on launch |
| `sitemap.xml` | SEO | 🔧 REFACTOR — add /quest |
| `Master_Question_Template.md` | Question gen rules | ✅ KEEP |
| `CLAUDE.md` | Project bible | 🔧 REFACTOR per §11 |
| `ARCHITECTURE.md` | Architecture | 🔧 REFACTOR per §11 |
| `STYLEGUIDE.md` | Visual standards | 🔧 REFACTOR — add gamification classes |
| `INDEX.md` | Doc index | 🔧 REFACTOR — add new docs |
| `AGENTS.md` | Subagent registry | ✅ KEEP |
| `CONTEXT.md` | Working context | ⚠️ AUDIT |
| `PROJECT_DASHBOARD.md` | Status dashboard | ⚠️ AUDIT — duplicates `docs/PROJECT_DASHBOARD.md`? |
| `review_queue.json` | Used? | ⚠️ AUDIT |
| `sample-questions-new-standard.json` | Legacy (questions in Supabase now) | ❌ PURGE? — confirm |
| `logo draft.png` | Working file | ❌ PURGE — final logo in `assets/` |
| `init` | Extension-less file | ⚠️ AUDIT — what is this? |

### `pages/`, `js/`, `lib/`, `api/`, `src/`, `supabase/`, `data/`
*(populated incrementally through Phase 6)*

### Editor/IDE config dirs (15+ found)

`.agent`, `.antigravity`, `.claude`, `.codebuddy`, `.codex`, `.continue`, `.cursor`, `.gemini`, `.kiro`, `.opencode`, `.qoder`, `.roo`, `.trae`, `.windsurf`

⚠️ AUDIT each — keep only AI tools you actually use. Several can be purged.

---

## 13. Phase 2-6 execution plan

### Phase 2 — Static visual prototype (1 day)

**Output:** `src/app/quest/page.tsx` deployed to a Vercel preview URL with HARDCODED sample data.

Sample data:
- Student: "Lily", level "Primary 5"
- Active quest: "Master Fractions in 3 Days", Day 2 active
- XP: 1,240 / 2,000 toward Level 7 (rank: Cadet)
- Streak: 12 days, 1 shield in stock
- Avatar: stock space-marine illustration placeholder

All STYLEGUIDE.md tokens applied. Three.js timeline visual-only. Framer Motion entry animations. Mobile + desktop layouts.

**Phase gate:** Vercel preview demo. You click around, give visual feedback.

### Phase 3 — Wire client logic (2 days)

**Output:** `QuestClient.tsx` connected to real Supabase data.

- Auth guard via Supabase SSR session
- Fetch active quest for active student
- All 5 states render correctly (empty/active/return/complete/abandoned)
- `?completed=N` URL handling + ReturningCelebration
- Abandon flow with confirm modal
- Empty state CTA → `/api/generate-quest`
- "Continue Quest" link from progress.html works

**Phase gate:** Vercel preview demo, every state tested.

### Phase 4 — Cross-page integration (1 day)

**Output:** vanilla-side edits.

- `js/progress.js`: `renderQuestMap()` → `renderQuestPreviewCard()` linking to `/quest`
- `js/quiz.js`: URL builder uses `/quest?completed=N` when `from_quest` param present
- `js/tutor.js`: same
- `pages/dashboard.html`: "Active Quest" widget → `/quest`
- Bottom nav: optional Quest indicator when active

**Phase gate:** Code review + Vercel preview. Full deep-link round trip tested.

### Phase 5 — Gamification systems (3-4 days)

**Day 1:**
- Apply migrations 015 (mastery_levels retroactive), 016 (gamification), 017 (badge seeds)
- Implement `handleAwardXP`, `handleStreakStatus`, `handleStreakShieldUse`, `handleQuestStepComplete`
- ~500 lines including badge-check logic, level computation, XP allow-list validation

**Day 2:**
- Implement `handleAvatarGenerate`, `handleAvatarConfirm`, `handleAvatarReroll`, `handleAvatarRerollStatus`
- Wire Replicate integration (face-detection + face-to-many)
- Cost ceiling enforcement
- ~400 lines

**Day 3:**
- Build React components: `XPBar`, `StreakFlame`, `AvatarSlot`, `BadgeUnlockModal`, `LevelUpModal`, `AvatarUploadModal`
- Wire XP events to existing quiz_complete/quest_step_complete/exam_complete
- Mastery snapshot daily cron + diff job

**Day 4:**
- Lottie + Framer Motion celebration animations
- BadgeCatalog page (`pages/badges.html` or `/badges` route — TBD)
- Buffer day for unexpected issues

**Phase gate:** Code review + full game loop test with one student.

### Phase 6 — Testing + Documentation (2 days)

- E2E test: 2 students complete a quest each, all gamification fires
- Mobile QA: iPhone Safari + Pixel Chrome
- All docs updated per §11
- `docs/FILE_MANIFEST.md` populated for every file (this is the pre-launch purge prep)
- `privacy.html` updated and reviewed
- `pricing.html` updated
- All commits squashed to `main`
- Vercel deploy verified

**Phase gate:** Full launch-ready demo + code review.

### Total estimate: ~9 days focused build + 1-2 days buffer = ~2 weeks

Fits the "Week 1 quest.html" slot in the launch plan.

---

**END OF SPEC v1.1 — LOCKED**

Phase 2 begins now. Next deliverable: `src/app/quest/page.tsx` deployed to Vercel preview URL with hardcoded sample data.
