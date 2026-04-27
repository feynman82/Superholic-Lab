# CLAUDE.md — Superholic Lab

> Read this file + ARCHITECTURE.md before writing any code.
> Last updated: 2026-04-27 | v4.0

## Project Identity

**Platform:** Superholic Lab — Singapore's AI-powered learning platform
**Domain:** https://www.superholiclab.com
**Repo:** https://github.com/feynman82/Superholic-Lab
**Local:** D:\Git\Superholic-Lab
**Google Drive (via MCP):** C:\SLabDrive

**What it is:** MOE-aligned quiz engine + AI tutor + 3-day Plan Quest pedagogy
for P1–S4 students. Parents subscribe monthly. Students practise across 6 PSLE
exam formats with full worked solutions, wrong-answer explanations, an AI tutor
(Miss Wena) who scaffolds learning in a warm Singaporean voice, and personalised
3-day learning interventions when they get a low score.

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
| Auth        | Supabase: email/password + Google OAuth + Apple OAuth |
| Payments    | Stripe (test mode — switch to live before launch) |
| AI (chat)   | Gemini Flash (`gemini-3-flash-preview`) — current; **migration to OpenAI pending** |
| AI (grade)  | Currently uses Gemini + Anthropic SDK in handlers; **see ARCHITECTURE.md AI MODEL ROUTING for actual current state** |
| AI (questions, bulk) | Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) |
| Deploy      | Vercel auto-deploy on push to `main`, ~60s |
| DNS         | Cloudflare → Vercel |
| Analytics   | Plausible (script tag — being rolled out) |

> **AI provider migration pending:** OpenAI subscription is now active. A
> separate handoff session (Workstream B) will introduce an `AI_ROUTING`
> abstraction in `handlers.js` so providers can be swapped via env vars.
> See `docs/handoff/` for the upcoming `AI_PROVIDER_MIGRATION_HANDOFF.md`.

## API Architecture — Single Gateway Pattern

Vercel Hobby plan = 12 serverless function limit. All routes go through
one function via rewrites in `vercel.json`:

```
/api/{route}  →  api/index.js  →  lib/api/handlers.js (named export)
```

**24 routes (add new ones in 3 places: `lib/api/handlers.js` + `api/index.js` switch + `vercel.json` rewrites):**

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
| /api/generate-question         | handleGenerateQuestion | On-demand single question |
| /api/generate-exam             | handleGenerateExam    | Full exam paper generation |
| /api/grade-answer              | handleGradeAnswer     | AI marking for open/word_problem |
| /api/save-exam-result          | handleSaveExamResult  | Save exam scores to Supabase |
| /api/generate-quest            | handleGenerateQuest   | Plan Quest generation (with concurrency check) |
| /api/analyze-weakness          | handleAnalyzeWeakness | Deep-dive learning gap report |
| /api/summarize-chat            | handleSummarizeChat   | Package chat into Study Note (accepts `quest_id`) |
| /api/award-xp                  | handleAwardXP         | Single source of truth for XP grants |
| /api/quests                    | handleQuestsRouter    | Sub-routes: list, fetch, advance-step, day3-outcome, abandon, quiz-batch |
| /api/quests/:path*             | handleQuestsRouter    | Wildcard rewrite for all quest sub-routes |

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
| **Mastery level gain** | **75 per AL band jump** (daily cron, deferred to commit 6) |
| Daily login streak | 5/day, max 50 |
| Badge earned | varies (`badge_definitions.xp_reward`) |

### Level system
Cumulative `100 * N * (N-1)` XP per level. Cap at level 50.
Rank ladder: Cadet (1–4) → Operator (5–9) → Specialist (10–14) → Lieutenant (15–19) → Captain (20–29) → Commander (30–39) → Vanguard (40–49) → Legend (50).

### Badges
**33 total** (29 launch + 4 pedagogy badges). Seeded via migrations 017 + 019.
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

**Commands** (`.claude/commands/`) — 8 slash commands:
  `/build-fix`, `/code-review`, `/deploy`, `/generate-batch`,
  `/generate-questions`, `/inventory`, `/plan`, `/security-check`

**Skills** (`.claude/skills/`) — 6 domain skills:
  `content-review`, `page-builder`, `question-factory`, `quiz-engine`,
  `supabase-patterns`, `ui-ux-pro-max`

**Agents** (`AGENTS.md`) — 7 specialist subagents:
  `planner`, `code-reviewer`, `security-reviewer`, `quiz-content-reviewer`,
  `database-reviewer`, `progress-intelligence`, `question-factory-agent`

**Hooks** (`hooks/hooks.json`) — secret detection + CSS enforcement

## Phase 3 Status (Plan Quest)

| Commit | Description | Status |
|--------|-------------|--------|
| 1 | Migration 018 (pedagogy fields + quest_eligibility) | ✅ Done |
| 2 | Backend handlers (handleQuestsRouter, handleAwardXP, badge-engine) | ✅ Done |
| 3 | /quest page wired + new states (EmptyState, QuestPicker, Day3OutcomeModal, etc.) | ✅ Done |
| 4 | quiz.js + tutor.js integration (from_quest, advance-step, Socratic mode) | ✅ Done |
| 5 | progress.html quest tray + HUD strip + auto-modal | ✅ Done |
| 6 | Mastery cron + parent FAQ page + doc cascade (PARENT_FAQ.md, GAMIFICATION_RULES.md) | ⏳ Pending |

Currently in E2E testing for the Lily Tan flow (`docs/QUEST_PAGE_SPEC.md` §18).
Commit 6 will be combined with the AI Provider Migration handoff (Workstream B).

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
- Use CSS variables from `style.css` — never hardcode hex values in `style=` attributes
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

# AI (current — to be abstracted in upcoming Workstream B)
ANTHROPIC_API_KEY                   (server-only)
GEMINI_API_KEY                      (server-only)
OPENAI_API_KEY                      (server-only — newly added, migration pending)

# App
NEXT_PUBLIC_APP_URL                 https://www.superholiclab.com
```

## Question Bank — Supabase-Hosted

All questions live in the `question_bank` table in Supabase (NOT JSON files).
The quiz engine and quest quiz-batch endpoint read from Supabase at runtime.

For full schema, RLS patterns, and the new gamification + quest tables
(student_xp, student_streaks, xp_events, student_badges, badge_definitions,
quest_eligibility, mastery_levels, mastery_levels_snapshots, avatar_rerolls),
see `ARCHITECTURE.md` → SUPABASE DATABASE SCHEMA section.

**Question types:** `mcq`, `short_ans`, `word_problem`, `open_ended`, `cloze`, `editing`
**Retired types (do not use):** `true_false`, `fill_blank`
**Correct answer format:** Always letter string `"A"` — never index `0`
**Difficulty values:** `Foundation`, `Standard`, `Advanced`, `HOTS`

**For current question coverage**, see `data/questions/MANIFEST.md` (live source of truth — calibrated against Supabase `question_bank`).

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
- Light Singlish ("lah", "lor") occasionally for authenticity
- Avatar: `public/assets/images/miss_wena.png` (SVG `onerror` fallback)
- Default prompt: `lib/api/handlers.js` → `OMNI_TUTOR_SYSTEM_PROMPT`
- Quest overlay: `lib/api/prompts/socratic-quest.js` → `buildSocraticQuestPrompt(...)`

## Auth Flow

```
Signup → 7-day trial (no Stripe) → subscription_tier = 'trial'
Login → email/password OR Google OAuth OR Apple OAuth
Subscribe → Stripe Checkout → webhook → subscription_tier = 'all_subjects'|'family'
Paywall → enforcePaywall() in auth.js → blocks expired trial / unpaid users
```

- `guardPage(true)` — protect authenticated pages, auto-creates profile if trigger missed
- `enforcePaywall(studentId)` — checks tier + trial + daily usage limits
- Trial limit: 5 questions/day for trial users
- Profiles auto-created by DB trigger `handle_new_user()` on `auth.users` insert
- `/quest` (Next.js) uses Supabase SSR session check, redirects to `/pages/login.html?redirect=/quest`

## Key Features

| Feature                | Location |
|------------------------|----------|
| Quiz engine (6 types)  | `public/js/quiz.js`, `public/pages/quiz.html` |
| AI Tutor (Miss Wena)   | `public/js/tutor.js`, `public/pages/tutor.html`, `/api/chat` |
| Plan Quest (3-day)     | `src/app/quest/page.tsx`, `QuestClient.tsx`, `/api/quests/*` |
| Quest tray + HUD strip | `public/js/progress.js` (`renderQuestTray`), `public/js/hud-strip.js` |
| Bottom nav (5 items)   | `public/js/bottom-nav.js` (`<global-bottom-nav>`) |
| Icon set (13 icons)    | `public/js/icons.js` + `src/components/icons/index.tsx` |
| Study Notes Backpack   | `/api/summarize-chat`, `dashboard.html` backpack modal |
| Progress Tracker       | `public/js/progress.js`, `public/pages/progress.html` |
| Exam Generator         | `public/js/exam.js`, `public/pages/exam.html`, `/api/generate-exam` |
| AI Weakness Analysis   | `/api/analyze-weakness`, `progress.html` |
| Pricing + Checkout     | `public/pages/pricing.html`, `/api/checkout` |
| Parent Account Portal  | `public/pages/account.html` |
| Master Admin Panel     | `public/pages/admin.html`, `/api/admin` |
| Parent Dashboard       | `public/pages/dashboard.html` |
| Web Components         | `<global-header>`, `<global-footer>`, `<global-bottom-nav>` |

## When Unsure

Ask before building:
> "Before I build [X], I want to confirm: [question]. My assumption is [Y] — is that correct?"

For Quest-related decisions, defer to `docs/QUEST_PAGE_SPEC.md` v2.0
(the authoritative spec). For architecture/schema questions, defer to
`ARCHITECTURE.md`.

---
*CLAUDE.md v4.0 — Updated 2026-04-27 (Phase 3 Plan Quest commits 1–5 done, commit 6 + AI provider migration pending)*
