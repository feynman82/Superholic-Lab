# CLAUDE.md — Superholic Lab

> Read this file + ARCHITECTURE.md before writing any code.
> Last updated: 2026-05-01 | v5.0 (Canon v5 era)

## Project Identity

**Platform:** Superholic Lab — Singapore's AI-powered learning platform
**Domain:** https://www.superholiclab.com
**Repo:** https://github.com/feynman82/Superholic-Lab
**Local:** D:\Git\Superholic-Lab
**Google Drive (via MCP):** C:\SLabDrive

**What it is:** MOE-aligned quiz engine + AI tutor + 3-day Plan Quest pedagogy
for P1–S4 students. Parents subscribe monthly. Students practise across PSLE
exam formats with full worked solutions, wrong-answer explanations, an AI tutor
(Miss Wena) who scaffolds learning in a warm Singaporean voice, and personalised
3-day learning interventions when they get a low score.

## The 4 Pillars of Superholic Lab

The platform's value proposition rests on four pillars that work together as
a closed learning loop. Each pillar must be preserved, distinct, and obvious
on the marketing homepage. **Do not collapse pillars or rename them in
marketing copy.** Order matters — this is the user journey, not just a feature
list.

| # | Pillar | What it does | Where it lives |
|---|--------|--------------|----------------|
| **1** | **Practise** | MOE-aligned questions across 6 PSLE formats. Every wrong answer explained with the specific misconception. The student does the reps. | `public/pages/quiz.html` + `public/js/quiz.js` |
| **2** | **Analyse Weakness** | BKT (Bayesian Knowledge Tracing) reads every attempt, weights HOTS questions higher, and surfaces the *root-cause* topic — not just the symptom. Also runs the AI Weakness Report. | `public/pages/progress.html` + `public/js/progress.js` + `/api/analyze-weakness` |
| **3** | **Remedial Plan (Plan Quest)** | A personalised 3-day intervention built on the diagnosis. Day 1 ramping practice → Day 2 Socratic dialogue with Miss Wena → Day 3 mastery trial with honest 3-way exit. The platform's IP. | `src/app/quest/` + `/api/quests/*` |
| **4** | **Assess** | AI-generated WA / EOY / PSLE-style papers calibrated to SEAB 2026 syllabus. The summative check that closes the loop and proves mastery sticks. | `public/pages/exam.html` + `public/js/exam.js` + `/api/generate-exam` |

**The closed loop in plain language:** Practise reveals weakness → Analyse
diagnoses the root cause → Plan Quest fixes it → Assess proves the fix held.
A platform that only does Practise (most competitors) cannot close this loop.

**Marketing implication:** The homepage hero, pricing page, and FAQ must
all reference these four pillars by name and in this order. Miss Wena and
gamification (XP, badges, levels, streaks) are *enablers* of the four
pillars, not pillars themselves.

## Subscription Pricing (current — Stripe test mode)

| Plan         | Monthly    | Annual (17% off)   | Children |
|--------------|------------|--------------------|----------|
| All Subjects | S$12.99/mo | S$129.90/yr        | 1        |
| Family       | S$19.99/mo | S$199.90/yr        | up to 3  |

- 7-day free trial, no credit card required
- Single Subject tier **removed** — do not reference it in new code or UI
- Trial is tracked app-side in `profiles.trial_ends_at` — Stripe never sees a trial period
- Subscribe = Stripe charges immediately (no `trial_period_days` in checkout)

## Tech Stack

| Layer       | Technology |
|-------------|------------|
| App pages   | Plain HTML, CSS, vanilla JS in `public/` (quiz, tutor, progress, dashboard, etc.) |
| Quest page  | **Next.js 15 + React 19 + TypeScript + framer-motion** at `src/app/quest/` only |
| Styles      | Single `public/css/style.css` v3.0 with CSS variables, Bebas Neue + Plus Jakarta Sans |
| Backend     | Vercel serverless — **single gateway** `api/index.js` → `lib/api/handlers.js` |
| Database    | Supabase PostgreSQL, SG region (`rlmqsbxevuutugtyysjr`), RLS on all tables |
| Auth        | Supabase: email/password + Google OAuth |
| Payments    | Stripe (test mode — switch to live before launch) |
| AI (chat / Miss Wena) | **OpenAI `gpt-4o-mini`** (default; routed via `AI_ROUTING.chat` in `lib/api/handlers.js`) |
| AI (grade open/word) | **OpenAI `gpt-4o-mini`** (`AI_ROUTING.grade_open`) |
| AI (question gen, on-demand) | **OpenAI `o4-mini`** (`AI_ROUTING.question_gen`) |
| AI (question gen, bulk) | **Anthropic Claude Sonnet `claude-3-5-sonnet-20241022`** for `/api/generate` (`AI_ROUTING.bulk_question`) |
| AI (exam gen) | **OpenAI `gpt-4o-mini`** primary (`AI_ROUTING.exam_gen`); **Claude Haiku `claude-haiku-4-5-20251001`** as in-handler fallback |
| AI (summarize chat) | **OpenAI `gpt-4o-mini`** (`AI_ROUTING.summarize`) |
| AI (quest narrative) | **OpenAI `gpt-4o-mini`** (`AI_ROUTING.quest_narrative`) |
| Deploy      | Vercel auto-deploy on push to `main`, ~60s |
| DNS         | Cloudflare → Vercel |
| Analytics   | Plausible (script tag — being rolled out) |

> **AI provider migration: COMPLETE.** All endpoints route through the
> `AI_ROUTING` config object + `callAI(task, opts)` wrapper at the top of
> `lib/api/handlers.js`. Defaults are listed in the table above; each task
> can be overridden by `AI_<TASK>_PROVIDER` and `AI_<TASK>_MODEL` env vars
> in Vercel. Bulk question gen stays on Anthropic Claude Sonnet. The legacy
> `callGemini()` helper still exists in handlers.js but is no longer wired
> as the default for any task.

## API Architecture — Single Gateway Pattern

Vercel Hobby plan = 12 serverless function limit. All routes go through
one function via rewrites in `vercel.json`:

```
/api/{route}  →  api/index.js  →  lib/api/handlers.js (named export)
```

**31 routes (add new ones in 3 places: `lib/api/handlers.js` + `api/index.js` switch + `vercel.json` rewrites):**

| Route                          | Handler               | Purpose |
|--------------------------------|-----------------------|---------|
| /api/chat                      | handleChat            | Miss Wena AI tutor + Socratic Quest mode (`?from_quest=`) |
| /api/checkout                  | handleCheckout        | Stripe Checkout Session |
| /api/webhook                   | handleWebhook         | Stripe webhook (raw body) |
| /api/portal                    | handlePortal          | Stripe Customer Portal |
| /api/admin                     | handleAdmin           | Admin panel data + mutations |
| /api/admin-edit                | handleAdminEdit       | Admin row edits |
| /api/analytics                 | handleAnalytics       | Admin analytics aggregation |
| /api/pause                     | handlePause           | Subscription pause/resume |
| /api/referral                  | handleReferral        | Referral codes |
| /api/account-delete            | handleAccountDelete   | Account deletion (PDPA) |
| /api/export                    | handleExport          | Data export (PDPA) |
| /api/contact                   | handleContact         | Contact form submissions |
| /api/qa-questions              | handleQaQuestions     | QA panel question listing |
| /api/generate                  | handleGenerate        | Bulk question generation (internal tooling) |
| /api/generate-question         | handleGenerateQuestion | On-demand single question (OpenAI o4-mini) |
| /api/generate-exam             | handleGenerateExam    | Full exam paper generation |
| /api/grade-answer              | handleGradeAnswer     | AI marking for open/word_problem (OpenAI gpt-4o-mini) |
| /api/save-exam-result          | handleSaveExamResult  | Save exam scores to Supabase |
| /api/generate-quest            | handleGenerateQuest   | Plan Quest generation (with concurrency check) |
| /api/analyze-weakness          | handleAnalyzeWeakness | BKT weakness diagnosis (no AI; pure SQL + heuristics) |
| /api/summarize-chat            | handleSummarizeChat   | Package chat into Study Note (accepts `quest_id`) |
| /api/award-xp                  | handleAwardXP         | Single source of truth for XP grants |
| /api/quests                    | handleQuestsRouter    | Sub-routes: list, fetch, advance-step, day3-outcome, abandon, quiz-batch |
| /api/quests/:path*             | handleQuestsRouter    | Wildcard rewrite for all quest sub-routes |
| /api/account-activity          | handleAccountActivity | Account activity feed (parent dashboard) |
| /api/log-activity              | handleLogActivity     | Append rows to activity log |
| /api/learner-export            | handleLearnerExport   | Per-child PDPA export bundle |
| /api/family-activity           | handleFamilyActivity  | Family-wide activity rollup |
| /api/weekly-digest             | handleWeeklyDigest    | Weekly progress digest payload |
| /api/syllabus-tree             | handleSyllabusTree    | Returns canon\_level\_topics tree (for UI accordion) |
| /api/recent-attempts           | handleRecentAttempts  | Recent quiz_attempts feed |

**Important:** `/api/webhook` must receive the raw unparsed body for
Stripe signature verification — do NOT attach `parseJsonBody` to it.

## Plan Quest Pedagogy

Plan Quest is the **third pillar** of Superholic Lab (Practise → AI Tutor →
Quest → Exam → Progress in the bottom nav). The 3-day pedagogy is
**non-negotiable IP**. All implementation must conform.

**Authoritative reference:** `docs/QUEST_PAGE_SPEC.md` v2.0 — sections 7
(pedagogy) and 16 (FAQ) are the source of truth.

### The 3-day contract
- **Day 1 — Foundation Climb** (12 questions, ramping difficulty: 4 Foundation → 4 Standard → 4 Advanced/HOTS). Wrong answers logged to `remedial_quests.day1_wrong_attempts` for Day 2 carryover.
- **Day 2 — Socratic Dialogue** (Miss Wena uses `SOCRATIC_QUEST_PROMPT` overlay, anchored on Day 1 wrong answers, min 8 messages). Auto-saves Study Note on completion.
- **Day 3 — Mastery Trial** (8 questions: 6 hard from quest topic + 2 transfer questions from related topic). Score-branched outcome.

### Concurrency
- Max **3 active quests per student**, **max 1 per subject**.
- Enforced by `quest_eligibility (student_id, subject)` PRIMARY KEY at DB level.
- Server returns 409 with `existing_quest_id` if subject slot taken.

### Day gating
- Day N+1 unlocks when BOTH (a) Day N completed AND (b) **midnight SGT** crossed.
- Computed server-side, returned in `day_unlock_status` field of GET `/api/quests/:id`.
- All midnight calculations resolve to `Asia/Singapore` (UTC+8).

### Outcome branching (Day 3)
- ≥85% → `mastered` (auto-applied, +200 quest_complete + +100 mastered bonus XP)
- 70–84% → `slight_improvement` (auto-applied, +100 reduced bonus)
- <70% → student picks: `redo` (+100 growth-mindset XP, spawns child quest with `parent_quest_id`) / `slight_improvement` (+100, self-report) / `no_improvement` (0 XP for Day 3, retains Day 1+2 XP, unlocks `honest_compass` badge)

### Why we protect this
The 3-way exit (especially the `no_improvement` honest exit) is what makes
Quest defensible. A platform that always says "Great job!" produces no
learning data. Honest signal is gold. Don't dilute it with empty encouragement.

## Gamification System

Active. XP, levels, streaks, badges, level-up modals all live as of Phase 3
Commit 5. Avatar pipeline is **deferred to post-launch**.

Gamification is an **enabler** of the 4 pillars, not a pillar itself.
Every XP grant must reward a real learning action (quiz, quest step, exam,
mastery gain). Never reward empty clicks.

### XP rules (server-validated allow-list)
| Action | XP |
|---|---|
| Quiz complete | 10 (+15 if ≥80%, +25 if 100%) |
| Quest Day 1/2 step complete | 50 |
| Quest Day 3 mastered | 50 + 200 + 100 mastered bonus |
| Quest Day 3 slight | 50 + 100 |
| Quest Day 3 no_improvement | 0 (Day 1+2 XP retained) |
| Quest Day 3 redo selected | +100 growth-mindset bonus |
| Exam complete | 100 (+50 if ≥80%) |
| **Mastery level gain** | **75 per AL band jump** (daily cron — `/api/cron/snapshot-mastery`, 03:00 SGT) |
| Daily login streak | 5/day, max 50 |
| Badge earned | varies (`badge_definitions.xp_reward`) |

### Level system
Cumulative `100 * N * (N-1)` XP per level. Cap at level 50.
Rank ladder: Cadet (1–4) → Operator (5–9) → Specialist (10–14) → Lieutenant (15–19) → Captain (20–29) → Commander (30–39) → Vanguard (40–49) → Legend (50).

### Badges
**33 total** (29 launch + 4 pedagogy badges). Seeded via migrations 017 + 020.
Notable IP badge: `honest_compass` — earned for marking a quest as
`no_improvement`. Signals to parents that the platform values self-awareness.

Authority: `docs/QUEST_PAGE_SPEC.md` §12 (XP rules), §14 (badge list).

### Anti-cheat
- Server validates every `xp_amount` against the allow-list per `event_type`
- `event_id` deduplication: `(student_id, event_type, event_id)` returns cached result
- For `quest_step_complete`: server verifies step was completed within last 60s
- For `mastery_gain`: only the daily cron path can emit (commit 6 pending)

## ECC Framework

**Rules** (`.claude/rules/`) — 13 always-active guidelines:
  `coding-style`, `design-system`, `development-workflow`, `efficiency`,
  `git-workflow`, `moe-templates`, `patterns`, `pedagogical-standards`,
  `performance`, `safety`, `security`, `tech-stack`, `testing`
  *(`moe-templates` is now a thin pointer to `Master_Question_Template.md`
  v5.0 — read the master template directly for question schemas,
  difficulty calibration, and visual payload routing.)*

**Commands** (`.claude/commands/`) — 8 slash commands:
  `/build-fix`, `/code-review`, `/deploy`, `/generate-batch`,
  `/inventory`, `/plan`, `/qa-status`, `/security-check`

**Skills** (`.claude/skills/`) — 5 domain skills:
  `content-review`, `page-builder`, `quiz-engine`, `supabase-patterns`,
  `ui-ux-pro-max`

**Agents** (`AGENTS.md`) — 2 file-based subagents:
  `design-guardian`, `miss_wena`
  *(Earlier `exam-architect` and `question-coder` agents were removed
  2026-05-01 — replaced by `/api/generate-exam` (live) and the
  `/generate-batch` slash command respectively.)*

**Hooks** (`hooks/hooks.json`) — secret detection + CSS enforcement

## Phase 3 Status (Plan Quest)

| Commit | Description | Status |
|--------|-------------|--------|
| 1 | Migration 018 (pedagogy fields + quest_eligibility) | ✅ Done |
| 2 | Backend handlers (handleQuestsRouter, handleAwardXP, badge-engine) | ✅ Done |
| 3 | /quest page wired + new states (EmptyState, QuestPicker, Day3OutcomeModal, etc.) | ✅ Done |
| 4 | quiz.js + tutor.js integration (from_quest, advance-step, Socratic mode) | ✅ Done |
| 5 | progress.html quest tray + HUD strip + auto-modal | ✅ Done |
| 6 | Mastery cron + parent FAQ page + doc cascade (PARENT_FAQ.md, GAMIFICATION_RULES.md) | ✅ Done |

Phase 3 (Plan Quest) is complete end-to-end. The Lily Tan E2E flow
(`docs/QUEST_PAGE_SPEC.md` §18) is the regression suite — run it on the
Vercel preview before any quest-touching merge.

## Development Workflow (Research-First)

0. **Research & Reuse** — read CLAUDE.md + ARCHITECTURE.md + relevant `docs/*.md`, check existing code
1. **Read the right skill** — before coding, read the relevant SKILL.md
2. **Plan** — break into clear steps before writing anything
3. **Build** — follow coding rules below
4. **Verify** — test manually, check mobile, look for console errors
5. **Commit** — descriptive conventional commit message
6. **Deploy** — push to main, Vercel auto-deploys in ~60s

## Coding Rules — Non-Negotiable

### Framework boundary (added 2026-04-27)
- **Vanilla pages:** `public/pages/*.html` (quiz, tutor, progress, dashboard, exam, account, admin, login, signup, setup, pricing, about, contact, privacy, terms, etc.)
- **Next.js pages:** `src/app/quest/` ONLY for now. Future visually-demanding routes may join.
- Decision rule: does this page need 3D, scroll-linked animation, or premium framer transitions? YES → Next.js. NO → vanilla.
- **NEVER** mix vanilla and React inside the same page (commit to one per route).

### ALWAYS
- Read the relevant SKILL.md before starting work in any domain
- Comment every function explaining what it does
- `const` and `let` only — never `var`
- Every API call wrapped in `try/catch` with a user-facing error message
- Validate user input before sending to any API
- Use CSS variables from `style.css` — never hardcode hex values in `style=` attributes. Consult STYLEGUIDE.md for frontend UI design.
- All pages mobile-responsive (mobile-first, 375px baseline)
- Use `textContent` not `innerHTML` with user-supplied content
- Immutable patterns only — spread/copy, never mutate
- Place page-level styles in a `<style>` block, never inline `style=` with colour values
- For all SGT-midnight calculations, use `Intl.DateTimeFormat` with `timeZone: 'Asia/Singapore'`
- For NOT-NULL DB writes, always supply a non-null fallback (`String(value || fallback).slice(0, maxLen) || 'final-fallback'`)

### NEVER
- Hardcode API keys, URLs, or credentials in code
- Use `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` in frontend JS
- Create new CSS files — all styles in `public/css/style.css` or page `<style>` blocks
- Add new npm dependencies without updating CLAUDE.md tech stack table
- Skip error handling on any async function
- Leave any page showing a blank screen on error
- Use `true_false` or `fill_blank` question types (retired)
- Reference `Single Subject` tier anywhere in UI or new code (removed)
- Add `trial_period_days` to Stripe checkout params
- Use `payment_method_types` or `automatic_payment_methods` on Checkout Sessions
- Bypass the `quest_eligibility` PRIMARY KEY when generating quests (always handle the 409)
- Skip the day-gating check when advancing a quest step
- Collapse any of the 4 Pillars into another in marketing copy or the FAQ

## Design System — "Rose & Sage"

Fonts:
- Display H1/H2: **Bebas Neue** (class: `font-display`), uppercase
- Body: **Plus Jakarta Sans** (400, 500, 600, 700, 800)

Key CSS variables:
```
--brand-sage:  #51615E   Primary nav/header background
--sage-dark:   #3d4f4b   Deeper sage (used in header.js)
--cream:       #e3d9ca   Text on sage backgrounds
--brand-rose:  #B76E79   Primary CTA, brand accent
--brand-peach: #B88078   Secondary accent
--brand-mint   alias var (used in quest tray + secret_alchemist badge)
--brand-amber  alias var (used in streak flame + level-up modal)
```

Difficulty badges (do not change):
- Foundation: `#f0fdf4` / `#15803d`
- Standard:   `#f0fdfa` / `#0f766e`
- Advanced:   `#fffbeb` / `#b45309`
- HOTS:       `#fff1f2` / `#be123c`

Subject colours (used in QuestPicker + quest tray tiles):
- Mathematics → `var(--brand-sage)`
- Science → `var(--brand-amber)`
- English → `var(--brand-mint)`

Authority on icons + bottom nav: `STYLEGUIDE.md` §5 (13-icon set in
`public/js/icons.js` + `src/components/icons/index.tsx`) and §6
(`<global-bottom-nav>` 5-item layout).

## Environment Variables

All in `.env` (gitignored) **and** Vercel dashboard:

```
# Supabase
SUPABASE_URL                        (frontend-safe)
SUPABASE_ANON_KEY                   (frontend-safe)
SUPABASE_SERVICE_ROLE_KEY           (server-only — never in frontend JS)
NEXT_PUBLIC_SUPABASE_URL            (Next.js /quest server component)
NEXT_PUBLIC_SUPABASE_ANON_KEY       (Next.js /quest server component)

# Stripe
STRIPE_SECRET_KEY                   (server-only)
STRIPE_PUBLISHABLE_KEY              (frontend-safe)
STRIPE_WEBHOOK_SECRET               (server-only — whsec_...)
STRIPE_ALL_SUBJECTS_PRICE_ID        monthly All Subjects price
STRIPE_FAMILY_PRICE_ID              monthly Family price
STRIPE_ALL_SUBJECTS_ANNUAL_PRICE_ID annual All Subjects price
STRIPE_FAMILY_ANNUAL_PRICE_ID       annual Family price

# AI (current — to be abstracted in Workstream B handoff)
ANTHROPIC_API_KEY                   (server-only — bulk question gen)
GEMINI_API_KEY                      (server-only — Miss Wena chat, summarize-chat, exam-gen, quest narrative)
OPENAI_API_KEY                      (server-only — grading + on-demand question gen, soon all chat too)

# App
NEXT_PUBLIC_APP_URL                 https://www.superholiclab.com
```

## Canon v5 — Source of Truth for Topics & Sub-topics

All `(subject, topic, sub_topic)` combinations are FK-enforced against
two canon tables in Supabase:

- **`canon_topics`** — every valid `(subject, topic)` pair
- **`canon_level_topics`** — every valid `(level, subject, topic, sub_topic)` row

`question_bank.(level, subject, topic, sub_topic)` has FK constraint
**`fk_qb_level_topic` → canon_level_topics(level, subject, topic, sub_topic)`**
(VALIDATED). An off-canon INSERT fails with PG 23503.

The frontend mirror lives in `public/js/syllabus-dependencies.js` and the
JSON twin at root `SYLLABUS_DEPENDENCY.json`. The build script
`scripts/build-syllabus-mirror.cjs` regenerates the mirror from canon SQL.

**Mathematics: 26 topics** (canon v5 added Money, Length and Mass,
Volume of Liquid, Time; removed Speed).
**Science: 6 topics** (Diversity, Cycles, Matter, Systems, Energy,
Interactions — earlier per-grade topics like Heat/Light/Forces/Cells
consolidated into these six).
**English: 7 topics** (Grammar, Vocabulary, Comprehension, Cloze, Editing,
Synthesis, Summary Writing).

**Active question_bank rows (2026-05-01):** 11,261 across 168 distinct
(level, subject, topic, sub_topic) combinations. Mathematics is the
thinnest bank (124 rows total) and the highest-leverage growth target.
See `MANIFEST.md` (root) for current counts and gap list.

## Question Bank — Supabase-Hosted

All questions live in the `question_bank` table in Supabase (NOT JSON files).
The quiz engine and quest quiz-batch endpoint read from Supabase at runtime.

For full schema, RLS patterns, the canon tables, and the gamification + quest
tables (student_xp, student_streaks, xp_events, student_badges, badge_definitions,
quest_eligibility, mastery_levels, mastery_levels_snapshots, avatar_rerolls),
see `ARCHITECTURE.md` → SUPABASE DATABASE SCHEMA section.

**Question types (8):** `mcq`, `short_ans`, `word_problem`, `open_ended`, `cloze`, `editing`, `comprehension`, `visual_text`
**Retired types (do not use):** `true_false`, `fill_blank`
**Correct answer format:** Always letter string `"A"` — never index `0`
**Difficulty values:** `Foundation`, `Standard`, `Advanced`, `HOTS`

**English Comprehension special-case (canon v5):** Rows for `topic = 'Comprehension'`
have `sub_topic = NULL`. UI grouping is done by `type` instead — `comprehension`
rows render as "Passage Comprehension"; `visual_text` rows render as "Visual Text
Comprehension". When filtering quiz batches for Comprehension, filter by `type`,
not `sub_topic`. See `public/js/syllabus.js` SUB_TOPIC_GROUPS + `resolveSubTopicGroup()`.

**For current question coverage**, see `MANIFEST.md` (repo root — live source
of truth, calibrated against Supabase `question_bank`). The legacy
`data/questions/*.json` files and the old `data/questions/MANIFEST.md` are
**superseded** and kept only for archival reference.

## Miss Wena — AI Tutor Persona

Miss Wena is Superholic Lab's AI tutor character. Key rules:
- Warm, highly capable, MOE-aligned Singaporean tutor
- Handles Maths, Science, English for P1–S4
- **Never** gives the final answer immediately (3-Strike Scaffolding Rule)
- In **Socratic Quest mode** (`?from_quest=` on `/api/chat`): asks leading questions
  for the first 5 turns, anchored on Day 1 wrong answers, never reveals the answer
  until the student articulates the concept correctly twice
- Celebrates correct answers with enthusiasm
- Soft pivots off-topic questions back to learning
- Avatar: `public/assets/images/miss_wena.png` (SVG `onerror` fallback)
- Default prompt: `lib/api/handlers.js` → `OMNI_TUTOR_SYSTEM_PROMPT`
- Quest overlay: `lib/api/prompts/socratic-quest.js` → `buildSocraticQuestPrompt(...)`

## Auth Flow

```
Signup → 7-day trial (no Stripe) → subscription_tier = 'trial'
Login → email/password OR Google OAuth
Subscribe → Stripe Checkout → webhook → subscription_tier = 'all_subjects'|'family'
Paywall → enforcePaywall() in auth.js → blocks expired trial / unpaid users
```

- `guardPage(true)` — protect authenticated pages, auto-creates profile if trigger missed
- `enforcePaywall(studentId)` — checks tier + trial + daily usage limits
- Trial limit: 5 questions/day for trial users
- Profiles auto-created by DB trigger `handle_new_user()` on `auth.users` insert
- `/quest` (Next.js) uses Supabase SSR session check, redirects to `/pages/login.html?redirect=/quest`

## Key Features

| Feature                | Pillar | Location |
|------------------------|--------|----------|
| Quiz engine (6 types)  | 1 Practise | `public/js/quiz.js`, `public/pages/quiz.html` |
| AI Tutor (Miss Wena)   | enabler    | `public/js/tutor.js`, `public/pages/tutor.html`, `/api/chat` |
| Progress Tracker + BKT | 2 Analyse  | `public/js/progress.js`, `public/pages/progress.html` |
| AI Weakness Analysis   | 2 Analyse  | `/api/analyze-weakness` (pure SQL, no AI) |
| Plan Quest (3-day)     | 3 Plan     | `src/app/quest/page.tsx`, `QuestClient.tsx`, `/api/quests/*` |
| Quest tray + HUD strip | 3 Plan     | `public/js/progress.js` (`renderQuestTray`), `public/js/hud-strip.js` |
| Exam Generator         | 4 Assess   | `public/js/exam.js`, `public/pages/exam.html`, `/api/generate-exam`, `public/js/exam-templates.js` |
| Bottom nav (5 items)   | enabler    | `public/js/bottom-nav.js` (`<global-bottom-nav>`) |
| Icon set (13 icons)    | enabler    | `public/js/icons.js` + `src/components/icons/index.tsx` |
| Study Notes Backpack   | enabler    | `/api/summarize-chat`, `dashboard.html` backpack modal |
| Pricing + Checkout     | platform   | `public/pages/pricing.html`, `/api/checkout` |
| Parent Account Portal  | platform   | `public/pages/account.html` |
| Master Admin Panel     | platform   | `public/pages/admin.html`, `/api/admin` |
| Parent Dashboard       | platform   | `public/pages/dashboard.html` |
| Web Components         | platform   | `<global-header>`, `<global-footer>`, `<global-bottom-nav>` |

## When Unsure

Ask before building:
> "Before I build [X], I want to confirm: [question]. My assumption is [Y] — is that correct?"

For Quest-related decisions, defer to `docs/QUEST_PAGE_SPEC.md` v2.0
(the authoritative spec). For architecture/schema questions, defer to
`ARCHITECTURE.md`. For marketing copy or FAQ wording about the 4 Pillars,
this file is the source of truth.

---
*CLAUDE.md v5.0 — Updated 2026-05-01 (canon v5 era: FK-enforced canon tables, OpenAI provider migration complete, 31 routes, 8 question types incl. visual_text, ECC counts corrected)*
