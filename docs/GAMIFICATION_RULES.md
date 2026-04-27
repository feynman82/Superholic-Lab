# GAMIFICATION RULES — Superholic Lab
> Extracted from `docs/QUEST_PAGE_SPEC.md` §12, §11 (rank ladder), §14 (badge list).
> This is the standalone reference for XP, levels, streaks, badges, and anti-cheat.
> Last updated: 2026-04-27

Cross-references: [`docs/QUEST_PAGE_SPEC.md`](QUEST_PAGE_SPEC.md) §12 (authority) · `lib/api/badge-engine.js` (implementation) · `lib/api/handlers.js` → `handleAwardXP` (XP grants)

---

## 1. XP Rules (server-validated allow-list)

Every XP grant is validated server-side against this table. The client cannot send arbitrary amounts — only the event type is trusted; the XP amount is computed from the allow-list.

| Action | XP | Notes |
|---|---|---|
| Quiz complete (any score) | 10 | Base reward |
| Quiz score ≥ 80% | +15 (= 25 total) | Quality bonus |
| Quiz score 100% | +25 (= 35 total) | Perfect bonus |
| **Quest Day 1 step complete** | 50 | Per step |
| **Quest Day 2 step complete** | 50 | Per step |
| **Quest Day 3 step complete (mastered)** | 50 + 200 | step + quest_complete bonus |
| **Quest Day 3 step complete (slight improvement)** | 50 + 100 | step + reduced bonus |
| **Quest Day 3 step complete (no_improvement)** | 0 | No XP — Day 1 + Day 2 XP retained |
| **Quest Day 3 redo selected** | +100 | Growth-mindset bonus (applied at redo selection) |
| Exam complete (WA/EOY/PSLE) | 100 | |
| Exam score ≥ 80% | +50 (= 150 total) | |
| **Mastery level gain (AL band jump)** | **75 per band** | Daily cron — `api/cron/snapshot-mastery.js` |
| Daily login streak | 5/day, max 50/day | Cap prevents gaming |
| Badge earned | varies (`badge_definitions.xp_reward`) | One-time per badge |

### Mastery gain XP (commit 6 detail)
Daily Vercel cron at 03:00 SGT (19:00 UTC) snapshots `mastery_levels` into `mastery_levels_snapshots`. Diffs vs yesterday. Awards 75 XP per AL band improvement per topic.

```json
{ "path": "/api/cron/snapshot-mastery", "schedule": "0 19 * * *" }
```

---

## 2. Level System

Level N requires cumulative `100 × N × (N − 1)` XP. Cap at level 50.

```js
function xpToLevel(totalXp) {
  return Math.min(50, Math.max(1, Math.floor((1 + Math.sqrt(1 + totalXp / 25)) / 2)));
}
function xpInCurrentLevel(totalXp, level) { return totalXp - 100 * level * (level - 1); }
function xpNeededForNextLevel(level) { return 200 * level; }
```

### XP to reach each level (selected checkpoints)

| Level | Cumulative XP needed |
|---|---|
| 1 | 0 |
| 5 | 2 000 |
| 10 | 9 000 |
| 15 | 21 000 |
| 20 | 38 000 |
| 25 | 60 000 |
| 30 | 87 000 |
| 40 | 156 000 |
| 50 | 245 000 |

---

## 3. Rank Ladder (cosmetic, derived from level)

| Level range | Rank |
|---|---|
| 1–4 | Cadet |
| 5–9 | Operator |
| 10–14 | Specialist |
| 15–19 | Lieutenant |
| 20–29 | Captain |
| 30–39 | Commander |
| 40–49 | Vanguard |
| 50 | Legend |

Rank is cosmetic only — it derives from level and requires no separate tracking.

---

## 4. Streak Rules

- A streak day = at least 1 XP-earning action that calendar day (SGT).
- Streak resets if 24h pass with no activity AND no shield is available.
- Shields earned at every 7-day milestone. Maximum 3 shields stocked at a time.
- Streak XP capped at 50/day regardless of how many consecutive days.
- Streak stored in `student_streaks` table.

---

## 5. All 33 Badges

**Total: 33** (29 launch badges + 4 pedagogy badges). 4 of these are `is_secret = true`.

### Common (12) — earnable in the first week

| Badge ID | Name | Description | Theme | XP |
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

| Badge ID | Name | Description | Theme | XP |
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

| Badge ID | Name | Description | Theme | XP |
|---|---|---|---|---|
| `streak_30` | Galactic Compass | 30-day streak | magic | 500 |
| `al1_master` | Apex Operator | Reach AL1 in any subject | space_marine | 300 |
| `perfect_exam` | Pristine Mind | Score 100% on a WA/EOY/PSLE exam | hybrid | 250 |
| `quest_10` | Veteran Operator | Complete 10 quests | hybrid | 300 |
| `level_25` | Lieutenant | Reach level 25 | space_marine | 250 |

### Legendary (1)

| Badge ID | Name | Description | Theme | XP |
|---|---|---|---|---|
| `level_50` | Commander | Reach level 50 | space_marine | 1000 |

### Secret (4) — `is_secret = true`

| Badge ID | Name | Description | Theme | Rarity | XP |
|---|---|---|---|---|---|
| `secret_alchemist` | Alchemist | Score 100% on a HOTS-difficulty quiz | magic | epic | 300 |
| `secret_oracle` | Oracle | Predict your next BKT mastery within 5% | magic | legendary | 500 |
| `secret_warden` | Vault Warden | Read 25 study notes | magic | rare | 150 |
| `secret_phoenix` | Phoenix | Recover from a 0-day streak by hitting 7 days again | hybrid | epic | 250 |

### Pedagogy badges — Plan Quest IP signal (4)

These 4 badges reward the learning behaviours that make Plan Quest defensible as an intervention. Seeded by `supabase/020_seed_pedagogy_badges.sql`. Predicates in `lib/api/badge-engine.js`.

| Badge ID | Name | Description | Theme | Rarity | XP |
|---|---|---|---|---|---|
| `socratic_scholar` | Socratic Scholar | Complete 5 Day 2 Socratic tutor sessions in Plan Quests | magic | rare | 100 |
| `mastery_first_try` | One-Shot Mastery | Score ≥85% on Day 3 of your first-ever Plan Quest | hybrid | epic | 200 |
| `redo_warrior` | Redo Warrior | Complete a redo quest after a previous attempt produced no_improvement | hybrid | epic | 300 |
| `honest_compass` | Honest Compass | Mark a Plan Quest as no_improvement — the platform values self-awareness as much as success | magic | rare | 50 |

**The `honest_compass` badge is the platform's most important signal** to parents. It tells them that Superholic Lab rewards intellectual honesty, not just performance. A child who earns `honest_compass` is one who understands that marking yourself as still struggling is an act of self-awareness, not failure.

---

## 6. Anti-Cheat Rules

The server validates every XP request against this allow-list before writing to `xp_events` or `student_xp`.

| Rule | Implementation |
|---|---|
| XP amount validated server-side | `handleAwardXP` recomputes XP from event type — client `xp_amount` is advisory only |
| Event deduplication | `event_id` in `xp_events.metadata` — same event_id returns cached result, no double-award |
| `quest_step_complete` recency | Server verifies the step was completed within last 60s |
| `mastery_gain` path-only | Only `api/cron/snapshot-mastery.js` can emit `mastery_gain` events |
| Badge deduplication | `student_badges` has UNIQUE constraint on `(student_id, badge_id)` |

---

## 7. Badge Theme Definitions

Themes control the visual style of badge icons:

| Theme | Description |
|---|---|
| `space_marine` | Military sci-fi aesthetic — achievement and milestone badges |
| `magic` | Arcane / spell aesthetic — learning behaviour and self-awareness badges |
| `hybrid` | Fusion of both — quest completion and mastery badges |

---

*Authority: `docs/QUEST_PAGE_SPEC.md` §12 and §14. Implementation: `lib/api/badge-engine.js` + `lib/api/handlers.js` → `handleAwardXP`.*
