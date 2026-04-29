# Dashboard — Advanced Features Implementation

You are working on the parent dashboard at `public/pages/dashboard.html`. The visual reskin (architect-scholar layer, 7+5 layout, AL pill strip, health strip, Today's Focus card) was completed in a previous session. DO NOT touch the existing visual treatment, the 26 element IDs the JS depends on, or the 10 `window.*` methods.

Read these files in order before writing any code:
1. `CLAUDE.md`
2. `ARCHITECTURE.md`
3. `public/pages/dashboard.html` (current state)
4. `lib/api/handlers.js`
5. `api/index.js`
6. `vercel.json`
7. `public/pages/account.html` (to mirror the section + modal patterns)

## Implementation order

Each phase has its own success gate. Stop and verify before proceeding.

---

### Phase 1 — Resume-where-you-left-off CTA

**Goal:** Surface in-progress quizzes and active Plan Quests as a top-priority card on the dashboard so parents can guide their child to the highest-value next action.

**Why:** A parent landing on the dashboard currently has to remember which child is mid-something. This card makes it explicit. Pattern matches Stripe's "Action required" banners.

**No new schema.** Reuses `quiz_attempts` (where `status = 'in_progress'`) and `remedial_quests` (where `status = 'active' AND current_step < 3`).

**UI deliverable:**

In `dashboard.html`, render a new `.card-glass` AT THE TOP of the 7-col main column (BEFORE the Learners section heading), but ONLY if there's something to resume. Eyebrow "Pick up where you left off" in rose. Inside, render up to 3 action rows:

- **In-progress quiz row:** "Lily — 7 of 12 questions on Fractions. About 8 minutes to finish." + rose `.btn-primary btn-sm` "Resume quiz"
- **Active quest row:** "Marcus — Day 2 of his Synthesis Plan Quest is unlocked." + rose `.btn-primary btn-sm` "Continue quest"
- **Stale streak warning:** if any learner had a streak ≥ 3 days but hasn't been active today and it's after 6pm SGT, show "Lily had a 5-day streak — practise today to keep it alive." + ghost button "Start a quick session" (deep-links to `/pages/quiz.html?student=<id>` with `?length=5`).

If nothing matches → don't render the card at all (don't show "Nothing to resume" — that's noise).

Add a new fetch in `loadStudents()` that runs in parallel with the existing fetches. Pre-compute the resume-rows during load and pass them to a new `renderResumeCard(rows)` function.

**Success gate:** Start a quiz, leave it mid-way, return to dashboard → resume card appears at top with that quiz row. Click resume → lands on the quiz page at the correct question. Complete or abandon the quiz → resume row disappears on next dashboard load.

---

### Phase 2 — Recent activity feed

**Goal:** A 5-row activity feed showing the family's recent learning events.

**Why:** Builds the family-wide picture in one glance. Matches Notion's home-page feed.

**No new schema.** Pulls from existing tables.

**UI deliverable:**

New `.card-glass.aside-card` in the 5-col aside, inserted BETWEEN "Today's focus" and "Quick links". Eyebrow "Activity" in rose. Title "What's been happening".

Render the most recent 5 events across all students, ordered by timestamp desc. Each row has: relative timestamp ("2h ago"), 16x16 SVG icon, and one-line description in plain English. Examples:

- `quiz_attempt` (completed) → "Lily completed Fractions quiz · 8/10 · 2h ago" — checkmark icon
- `mastery_levels` change to AL≤3 → "Marcus reached AL3 on Synthesis · 1d ago" — star icon
- `remedial_quests` row created → "Plan Quest available for Lily on Decimals · 3d ago" — flag icon (rose accent)
- `study_notes` row created → "Lily saved 3 study notes from Miss Wena · 4d ago" — bookmark icon
- `exam_results` row → "Marcus completed P5 Maths WA1 · 38/45 · 5d ago" — trophy icon

If fewer than 5 events exist family-wide, show what's available. If zero events → "Nothing to show yet. Pick a learner to get started."

**New API route:** `GET /api/family-activity?limit=5`

Add to `vercel.json`, `api/index.js`, `lib/api/handlers.js`. Auth check, get parent's student IDs via `students.parent_id = auth.uid()`, then UNION ALL queries across the 5 source tables, sort desc, limit. Return as `{ events: [{ type, student_name, summary, occurred_at, action_url }] }`.

**Success gate:** Have a learner complete a quiz → within 30 seconds the event appears in the feed. Click an event → navigates to the relevant page (quiz result, mastery view, etc).

---

### Phase 3 — Family weekly digest preview

**Goal:** Small "this week" summary card that gives parents reason to come back, even when no individual learner has done anything dramatic.

**Why:** Habit formation. Same trigger as Spotify's weekly Wrapped previews. The card should feel like a status report, not a celebration.

**No new schema.**

**UI deliverable:**

New `.card-glass` at the BOTTOM of the 5-col aside (below "Quick links"). Eyebrow "This week so far" in rose. Title showing the date range, e.g. "Mon 22 Apr – today".

Three stat blocks in a row (mirror the .ref-stats pattern from account.html):

- **Questions answered** — sum of `question_attempts` across the week
- **Mastery gained** — count of `mastery_levels` rows where the band improved (band changed to a numerically lower AL — i.e., AL5 → AL3 = +1)
- **Streak days** — count of distinct dates in `daily_usage` for any family student this week

Below the stats, one sentence: "Last week's pace: 47 questions, 1 level gained." (only if data exists).

If zero activity this week, the card shows:
- Stat blocks with zeros
- A nudge: "No activity this week yet. The week resets each Monday."

**New API route:** `GET /api/weekly-digest`

Compute server-side. Return `{ this_week: { questions, mastery_gains, streak_days, range_label }, last_week: { questions, mastery_gains } }`.

Cache the response for 5 minutes per parent on the server (in-memory Map keyed by `profile_id` is fine — Vercel functions are short-lived but the cache helps within a single visit).

**Success gate:** Card renders within 1.5s of dashboard load. Numbers match a spot-check SQL query against the database.

---

### Phase 4 — Empty-state onboarding (3-step illustrated walkthrough)

**Goal:** Replace the current empty-state card (when `currentStudents.length === 0`) with a 3-step onboarding walkthrough.

**Why:** First-time parent UX. The current empty state is a flat dashed box that just says "no learners yet" — wasted real estate.

**UI deliverable:**

When `currentStudents.length === 0`, replace the existing `.empty-state` block in `renderGrid()` with a 3-card horizontal walkthrough (stack vertically on mobile):

- **Step 1:** "Add your child" — SVG users-add icon, sentence "Set up a profile in 30 seconds.", `.btn-primary` "Get started"
- **Step 2:** "Pick a subject" — SVG book icon, sentence "Choose Maths, Science, or English to start practising.", visual placeholder (no button — they unlock this after step 1)
- **Step 3:** "Start practising" — SVG sparkle icon, sentence "Miss Wena will guide them through their first quiz.", visual placeholder

Steps 2 and 3 are visually dimmed (opacity 0.5) until step 1 is complete. After step 1, the parent gets the standard dashboard view, so steps 2/3 only ever show in the empty state.

Use SVG icons from the existing `/public/js/icons.js` set if any match (`quiz`, `tutor`, `quest`). Otherwise inline SVG.

**No new API or schema.** Pure UI.

**Success gate:** A new account with zero learners sees the 3-step walkthrough. After adding a learner, the walkthrough is replaced by the standard learner cards grid.

---

### Phase 5 — Achievement unlock toast

**Goal:** When a parent loads the dashboard and ANY learner has unlocked a new badge or AL level since the last visit, show a celebration toast top-right.

**Why:** Engagement. But: must be tasteful — one toast per unlock per visit, not a stack. Dismissible. Never blocks UI.

**Schema migration:** `supabase/011_dashboard_seen_at.sql`

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dashboard_last_seen_at  timestamptz DEFAULT now();
```

This timestamp is updated to NOW() every time the parent loads the dashboard. We compare badge/mastery events to this timestamp to find what's "new since last visit."

**UI deliverable:**

On dashboard load:
1. Read `profile.dashboard_last_seen_at` (cached in `window.userProfile`)
2. Query for unread celebrations:
   - `mastery_levels` rows where the AL band improved AND `updated_at > dashboard_last_seen_at`
   - (If badges table exists: `badges_earned` rows where `earned_at > dashboard_last_seen_at`)
3. If any results, render a toast top-right (NOT bottom — the bottom is occupied by checkout toast and bottom-nav). The toast is `.card-glass` with rose accent, contains the celebration message, and auto-dismisses after 6 seconds.
4. After rendering (or if zero results), update `profiles.dashboard_last_seen_at = now()`.

Multiple unlocks → a single combined toast: "3 unlocks since your last visit. View →" that opens a modal listing them.

**New CSS class:** `.celebration-toast` positioned top-right (below header), full architect-scholar styling. Slides in from the right edge.

**No new API.** All client-side queries.

**Success gate:**
- Have a learner reach AL3 on a topic
- Reload dashboard → celebration toast appears top-right
- Reload again → toast does NOT reappear (timestamp updated)
- Multiple unlocks within one window → single combined toast with count

---

## Cross-cutting requirements

For all phases:

- **No inline hex/rgba in HTML `style=` attributes.** All colours via CSS variables.
- **Match the architect-scholar layer.** New cards use `.card-glass`. New CSS classes prefixed appropriately (`resume-`, `activity-`, `digest-`, `onboarding-`, `celebration-`).
- **Preserve all existing JS contracts.** Do not rename any of the 26 element IDs the current dashboard.html JS depends on.
- **Each new API route gets ALL THREE additions:** rewrite in `vercel.json`, case in `api/index.js`, handler in `lib/api/handlers.js`.
- **All new tables get RLS policies.** No exceptions.
- **All Supabase RLS on student_id-joined tables uses the canonical pattern:** `student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())`.

## Test plan after each phase

- Each phase has its own success gate.
- Hard-refresh after each Vercel deploy.
- Visual QA via `read_console_messages onlyErrors:true`.

## Order of work and stop points

1. Read files listed at top.
2. Implement Phase 1 (Resume CTA). Stop. Verify success gate. Commit.
3. Implement Phase 2 (Activity feed). Stop. Verify. Commit.
4. Implement Phase 3 (Weekly digest). Stop. Verify. Commit.
5. Implement Phase 4 (Empty-state onboarding). Stop. Verify. Commit.
6. Implement Phase 5 (Celebration toast). Stop. Verify. Commit.

If any phase fails the success gate, surface the failure rather than working around it.

## Out of scope

- Don't refactor the existing dashboard.html visual layer or 7+5 grid.
- Don't modify the bottom-nav, header, or footer components.
- Don't change `style.css` v3.0 — all new styles in page-level `<style>` blocks.
- Don't introduce new dependencies. Vanilla JS, native Supabase SDK.
- Don't add gamification creep — celebration toast is once per unlock, not per session.