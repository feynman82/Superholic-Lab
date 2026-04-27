# PROJECT INDEX — Superholic Lab
> Master directory of all files, routes, and data assets.
> Last updated: 2026-04-27 | v2.1

For coding rules see `CLAUDE.md`. For schema and infra see `ARCHITECTURE.md`.
For Plan Quest pedagogy and behaviour see `docs/QUEST_PAGE_SPEC.md` v2.0.

---

## Pages

### Vanilla HTML (`public/pages/`)

| File | Route | Auth | Description |
|---|---|---|---|
| dashboard.html | /pages/dashboard.html | ✅ required | Parent dashboard — learner cards, backpack, trial banner |
| progress.html | /pages/progress.html | ✅ required | Progress tracker + weakness analysis + quest tray + HUD strip |
| quiz.html | /pages/quiz.html | ✅ required | Quiz engine — all 6 PSLE question types + quest mode (`?from_quest=`) |
| tutor.html | /pages/tutor.html | ✅ required | Miss Wena AI tutor — chat + Socratic Quest mode |
| exam.html | /pages/exam.html | ✅ required | AI exam paper generator (WA/EOY/PSLE templates) |
| account.html | /pages/account.html | ✅ required | Parent account portal — profile, password, billing |
| admin.html | /pages/admin.html | ✅ required | Master admin panel (role-gated) |
| subjects.html | /pages/subjects.html | ✅ required | Level + subject selector |
| subject-mathematics.html | /pages/subject-mathematics.html | ❌ public | Maths subject landing page |
| subject-science.html | /pages/subject-science.html | ❌ public | Science subject landing page |
| subject-english.html | /pages/subject-english.html | ❌ public | English subject landing page |
| setup.html | /pages/setup.html | ✅ required | New learner onboarding (post-signup) |
| pricing.html | /pages/pricing.html | ❌ public | Plans + monthly/annual toggle + FAQ |
| login.html | /pages/login.html | ❌ public | Email + Google + Apple OAuth login |
| signup.html | /pages/signup.html | ❌ public | 7-day trial signup, no credit card |
| confirm-email.html | /pages/confirm-email.html | ❌ public | Email confirmation holding page |
| update-password.html | /pages/update-password.html | ❌ public | Password reset landing |
| privacy.html | /pages/privacy.html | ❌ public | Privacy Policy (PDPA) |
| terms.html | /pages/terms.html | ❌ public | Terms of Service |
| contact.html | /pages/contact.html | ❌ public | Contact form |
| refund-request.html | /pages/refund-request.html | ❌ public | Refund request form |
| faq.html | /pages/faq.html | ❌ public | Consolidated FAQ — 9 sections, Schema.org FAQPage JSON-LD |
| index.html | / | ❌ public | Marketing homepage |
| 404.html | / | ❌ public | Custom 404 |

### Next.js (`src/app/`)

| Route | Type | Auth | Description |
|---|---|---|---|
| /quest | Server + Client | ✅ required (SSR check) | Plan Quest UI — empty/single/picker/returning/Day3-outcome states |

---

## API Routes (24 total)

All routes served by single gateway `api/index.js`. Frontend calls
`/api/<route>` — `vercel.json` rewrites to `api/index.js` which dispatches
to handlers in `lib/api/handlers.js`.

| Route | Method | Handler | Description |
|---|---|---|---|
| /api/chat | POST | handleChat | Miss Wena tutor + Socratic Quest mode (`?from_quest=`) |
| /api/checkout | POST | handleCheckout | Create Stripe checkout session |
| /api/webhook | POST | handleWebhook | Stripe webhook (raw body required) |
| /api/portal | POST | handlePortal | Stripe Customer Portal |
| /api/admin | POST | handleAdmin | Admin panel data |
| /api/admin-edit | POST | handleAdminEdit | Admin row mutations |
| /api/analytics | POST | handleAnalytics | Admin analytics aggregation |
| /api/pause | POST | handlePause | Subscription pause/resume |
| /api/referral | POST | handleReferral | Referral code lookup/apply |
| /api/account-delete | POST | handleAccountDelete | Account deletion (PDPA) |
| /api/export | POST | handleExport | Data export (PDPA) |
| /api/contact | POST | handleContact | Contact form submission |
| /api/qa-questions | POST | handleQaQuestions | QA panel question listing |
| /api/generate | POST | handleGenerate | Bulk question generation (internal) |
| /api/generate-question | POST | handleGenerateQuestion | On-demand single question |
| /api/generate-exam | POST | handleGenerateExam | Full exam paper generation |
| /api/grade-answer | POST | handleGradeAnswer | AI grading (open_ended/word_problem) |
| /api/save-exam-result | POST | handleSaveExamResult | Persist exam result |
| /api/generate-quest | POST | handleGenerateQuest | Plan Quest generation (concurrency-aware) |
| /api/analyze-weakness | POST | handleAnalyzeWeakness | BKT weakness diagnosis |
| /api/summarize-chat | POST | handleSummarizeChat | Save tutor chat as Study Note (accepts `quest_id`) |
| /api/award-xp | POST | handleAwardXP | Single XP grant endpoint (server-validated allow-list) |
| /api/quests | GET | handleQuestsRouter | List active quests for student |
| /api/quests/:path* | * | handleQuestsRouter | Sub-routes: `/:id` (GET), `/:id/advance-step` (POST), `/:id/day3-outcome` (POST), `/:id/abandon` (POST), `/quiz-batch` (POST) |

**Cron jobs:**
- `/api/cron/auto-fill-bank` — `0 2 * * 0` (Sunday 02:00 UTC) — question bank auto-fill
- `/api/cron/snapshot-mastery` — `0 19 * * *` (daily 03:00 SGT) — mastery snapshot + `mastery_gain` XP awards

---

## Backend Modules (`lib/api/`)

| File | Exports | Description |
|---|---|---|
| handlers.js | 20+ named exports | All API handler logic + `AI_ROUTING` config + `callAI()` / `callOpenAI()` / `callClaudeRaw()` / `callGemini()` unified dispatcher |
| badge-engine.js | evaluateBadges, evaluateLevelUp, xpToLevel, xpInCurrentLevel, xpNeededForNextLevel, levelToRank | Badge unlock evaluation + level/rank math (33 badges) |
| quest-pedagogy.js | buildQuestSteps, SYLLABUS_DEPENDENCIES | Builds quest steps config from BKT diagnosis; transfer-topic dependency map |
| prompts/mcq.js | MCQ_SYSTEM_PROMPT | MCQ generation system prompt |
| prompts/short-ans.js | SHORT_ANS_SYSTEM_PROMPT | Short answer system prompt |
| prompts/word-problem.js | WORD_PROBLEM_SYSTEM_PROMPT | Word problem system prompt |
| prompts/open-ended.js | OPEN_ENDED_SYSTEM_PROMPT | Open-ended Science system prompt |
| prompts/cloze.js | CLOZE_SYSTEM_PROMPT | Cloze system prompt |
| prompts/editing.js | EDITING_SYSTEM_PROMPT | Editing passage system prompt |
| prompts/socratic-quest.js | buildSocraticQuestPrompt | Day 2 Socratic overlay (interpolates day1_wrong_attempts) |

---

## Vanilla Frontend JS (`public/js/`)

| File | Type | Description |
|---|---|---|
| supabase-client.js | Global | `getSupabase()` — browser Supabase singleton |
| supabase.js | Module | Legacy ESM alias (do not modify) |
| auth.js | Module | `guardPage(requireAuth)`, `enforcePaywall(studentId)` |
| header.js | Web component | `<global-header>` (auth-aware) |
| footer.js | Web component | `<global-footer>` |
| bottom-nav.js | Web component | `<global-bottom-nav>` 5-item nav (Practise → AI Tutor → Quest → Exam → Progress); `setQuestActive(bool)`, `setActive(slug)` |
| icons.js | Global | 13-icon set (mirror of `src/components/icons/index.tsx`) |
| hud-strip.js | Global | `renderHUDStrip(containerId, {studentId})` — vanilla HUD: avatar, level, rank, XP bar, streak |
| app-shell.js | Global | Plan badge + shared UI init |
| progress.js | Global | Progress charts + `renderQuestTray()` (replaces former `renderQuestMap`) + eligibility-aware Generate Quest buttons |
| quiz.js | Global | Quiz engine — all 6 PSLE types + quest mode (`from_quest` detection, quiz-batch fetch, advance-step on submit, auto-modal on score ≤70%) |
| tutor.js | Global | Miss Wena chat UI + Socratic Quest mode + Mark Day 2 Complete (gated by `quest_message_count ≥ 8`) + auto-Study-Note on completion |
| exam.js | Global | Exam runtime |
| exam-templates.js | Global | `getTemplate(subject, level)` — MOE paper structure (v4.0) |
| exam-generator.js | Global | `generateExam(subject, level, type)` |
| exam-renderer.js | Global | DOM rendering for generated exam paper |
| diagram-library.js | Global | SVG diagram rendering for `visual_payload` questions |
| qa-panel.js | Global | Admin QA panel UI |

---

## Next.js Source (`src/`)

| Path | Type | Description |
|---|---|---|
| src/app/layout.tsx | Server | Next.js root layout |
| src/app/globals.css | CSS | Next.js global styles |
| src/app/quest/page.tsx | Server | Auth check + SSR data fetch + branch by quest count |
| src/app/quest/QuestClient.tsx | Client | Main orchestrator — timeline, ActiveDayCard, HUD, AbandonButton, etc. |
| src/app/quest/components/EmptyState.tsx | Client | "No active quest" state with CTA to progress.html |
| src/app/quest/components/QuestPicker.tsx | Client | Subject-coloured tabs when 2-3 active quests |
| src/app/quest/components/Day3OutcomeModal.tsx | Client | The 3-way exit modal (redo / slight / no_improvement) |
| src/app/quest/components/BadgeUnlockModal.tsx | Client | Badge celebration |
| src/app/quest/components/LevelUpModal.tsx | Client | Level-up celebration |
| src/app/quest/components/ReturningCelebration.tsx | Client | Confetti + transition after `?completed=N` |
| src/components/icons/index.tsx | Client | 13-icon set (mirror of `public/js/icons.js`) |
| src/components/DashboardShowcase.tsx | Client | Marketing component |
| src/components/PlanQuestSection.tsx | Client | Marketing component |
| src/components/ScrollStory.tsx | Client | Marketing component |
| src/components/SyllabusCylinder.tsx | Client | Marketing component |
| src/components/ui/cosmos-orbit.tsx | Client | UI primitive |

---

## Question Bank

**Live source of truth:** `data/questions/MANIFEST.md` — calibrated against
the Supabase `question_bank` table. (Old per-level coverage tables in this
file have been removed because they drifted out of sync; the manifest is
the only authoritative count.)

**Schema and rules:** see `ARCHITECTURE.md` → `question_bank` table.

**Question types:** `mcq`, `short_ans`, `word_problem`, `open_ended`, `cloze`, `editing`
**Retired:** `true_false`, `fill_blank` (do not use)
**Difficulty:** `Foundation`, `Standard`, `Advanced`, `HOTS`
**Correct answer format:** Letter (`"B"`) — never index (`0`)

---

## Styles (`public/css/`)

| File | Description |
|---|---|
| public/css/style.css | **Single stylesheet v3.0** — Rose & Sage design system. All custom styles. Never create additional CSS files. CSS variables only — zero hardcoded hex in HTML `style=` attributes. | refer for STYLEGUIDE.md for more details |

---

## Configuration Files (root)

| File | Description |
|---|---|
| vercel.json | Vercel config — cleanUrls, 24 rewrites, security headers, 2 crons |
| package.json | Node 24.x, ESM (`"type":"module"`), Next.js 15 + React 19 + framer-motion |
| next.config.mjs | Next.js config (for /quest route) |
| tsconfig.json | TypeScript config (for src/) |
| jsconfig.json | Path aliases (vanilla side) |
| components.json | shadcn config |
| .env | Local secrets — gitignored. Production values in Vercel dashboard. |
| .mcp.json | MCP server config — gitignored. |
| .gitignore | Standard ignore + `.env`, `.next/`, `node_modules/` |

---

## Documentation Files (root + `docs/`)

| File | Description |
|---|---|
| CLAUDE.md | **Read first.** Coding rules, dev workflow, ECC framework, Phase 3 status |
| ARCHITECTURE.md | Schema, API routes, infra, build status |
| INDEX.md | This file |
| AGENTS.md | 7 specialist subagent definitions |
| PROJECT_DASHBOARD.md | Build status, ECC health, known issues |
| STYLEGUIDE.md | Visual standards (icons, bottom nav, sections) |
| Master_Question_Template.md | 6 PSLE question type schemas |
| CONTEXT.md | Quick context index pointer |
| docs/QUEST_PAGE_SPEC.md | **v2.0 LOCKED** — Plan Quest authority (pedagogy, FAQ, schema, API contracts) |
| docs/PARENT_FAQ.md | **Source of truth for FAQ content** — markdown twin of `public/pages/faq.html`; edit here first |
| docs/GAMIFICATION_RULES.md | XP table, level math, rank ladder, all 33 badges, anti-cheat rules |
| docs/LAUNCH_PLAN_v1.md | Launch sequencing |
| docs/PROJECT_DASHBOARD.md | Mirror of root dashboard |
| docs/CONTENT_TIMELINE.md | Content milestones |
| docs/design-audit.md | Design audit log |
| docs/handoff/README.md | Handoff prompts index |
| docs/handoff/QUEST_BACKEND_HANDOFF.md | Backend stream prompt for Phase 3 |
| docs/handoff/QUEST_FRONTEND_HANDOFF.md | Frontend stream prompt for Phase 3 |
| docs/handoff/AI_PROVIDER_AND_COMMIT6_HANDOFF.md | AI routing abstraction + Phase 3 Commit 6 handoff |

---

## ECC Framework (`.claude/`)

| Path | Contents |
|---|---|
| `.claude/rules/` | 13 always-active rules: coding-style, design-system, development-workflow, efficiency, git-workflow, moe-templates, patterns, pedagogical-standards, performance, safety, security, tech-stack, testing |
| `.claude/commands/` | 8 slash commands: `/build-fix`, `/code-review`, `/deploy`, `/generate-batch`, `/generate-questions`, `/inventory`, `/plan`, `/security-check` |
| `.claude/skills/` | 6 domain skills: `content-review`, `page-builder`, `question-factory`, `quiz-engine`, `supabase-patterns`, `ui-ux-pro-max` |
| `.claude/agents/` | Agent prompt files (note: `AGENTS.md` is the canonical registry) |
| `.claude/memory/` | Persistent session memory (MEMORY.md index) |
| `.claude/docs/adr/` | Architecture Decision Records |
| `.claude/settings.local.json` | MCP permissions (gitignored) |

---

## Supabase Schema

For full table definitions, see `ARCHITECTURE.md` → SUPABASE DATABASE SCHEMA.

**18+ tables, all RLS-enabled.** Key tables:

| Table | Purpose |
|---|---|
| profiles | Parent accounts (1:1 with auth.users) |
| students | Child profiles (up to 3 per family) |
| subscriptions | Stripe subscription state |
| daily_usage | Trial limits + activity tracking |
| quiz_attempts | Quiz session metadata |
| question_attempts | Per-question answer log (NOT-NULL guards in writes) |
| exam_results | Exam scores |
| question_bank | Primary content store (all 6 PSLE types) |
| study_notes | Miss Wena Backpack (with `quest_id` link) |
| remedial_quests | Plan Quests (status, current_step, day_completed_at, day1_wrong_attempts, day3_score, day3_outcome, parent_quest_id, abandoned_at) |
| quest_eligibility | Concurrency enforcer — PRIMARY KEY (student_id, subject) |
| mastery_levels | BKT mastery probabilities |
| mastery_levels_snapshots | Daily snapshots for `mastery_gain` XP cron |
| student_xp | XP aggregate per student |
| xp_events | Append-only XP ledger |
| student_streaks | Daily streak + shields |
| badge_definitions | Catalog (29 launch + 4 pedagogy = 33 total; secret flag for 4) |
| student_badges | Earned badges (unique per student+badge) |
| avatar_rerolls | Avatar audit + cost ceiling (deferred to post-launch) |

**Migrations applied (in `supabase/`):** 002, 003, 004, 006, 007, 008, 009,
010, 011, 012, 013, 015, 016, 017, 018.
**Pending (apply in Supabase SQL Editor):** `019_reclassify_difficulty_heuristic.sql`, `020_seed_pedagogy_badges.sql`.

---

## Stripe Integration

Pricing source of truth: `pages/pricing.html` and `.env` (Vercel dashboard).
Stripe Price IDs are environment-specific; do not hardcode them in docs.

Stripe environment variables:
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_ALL_SUBJECTS_PRICE_ID`, `STRIPE_FAMILY_PRICE_ID`
- `STRIPE_ALL_SUBJECTS_ANNUAL_PRICE_ID`, `STRIPE_FAMILY_ANNUAL_PRICE_ID`

Currently in **test mode**; switch to live before launch (see PROJECT_DASHBOARD.md).

---

## Environment Variables

| Variable | Used In | Secret? |
|---|---|---|
| ANTHROPIC_API_KEY | lib/api/handlers.js | ✅ server only |
| GEMINI_API_KEY | lib/api/handlers.js | ✅ server only |
| OPENAI_API_KEY | lib/api/handlers.js (migration pending) | ✅ server only |
| STRIPE_SECRET_KEY | lib/api/handlers.js | ✅ server only |
| STRIPE_WEBHOOK_SECRET | lib/api/handlers.js | ✅ server only |
| STRIPE_PUBLISHABLE_KEY | frontend (stripe.js) | ⚠️ public-safe |
| STRIPE_*_PRICE_ID (4 vars) | lib/api/handlers.js | ⚠️ id-only, public-safe |
| SUPABASE_URL | supabase-client.js + handlers | ⚠️ public-safe |
| SUPABASE_ANON_KEY | supabase-client.js | ⚠️ public-safe |
| SUPABASE_SERVICE_ROLE_KEY | lib/api/handlers.js | ✅ server only |
| NEXT_PUBLIC_SUPABASE_URL | src/app/quest (SSR) | ⚠️ public-safe |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | src/app/quest (SSR) | ⚠️ public-safe |
| NEXT_PUBLIC_APP_URL | server-side fetch loops | ⚠️ public-safe |
