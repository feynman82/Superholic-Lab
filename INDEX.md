# PROJECT INDEX — Superholic Lab
# Master directory of all files, routes, and data assets.
# Last updated: 2026-03-31

---

## Pages (`pages/`)

| File | Route | Auth | Description |
|---|---|---|---|
| exam.html | /pages/exam.html | ✅ required | Practice paper engine — 5-phase state machine |
| subjects.html | /pages/subjects.html | ✅ required | Subject + topic selector |
| quiz.html | /pages/quiz.html | ✅ required | Question-by-question quiz engine |
| tutor.html | /pages/tutor.html | ✅ required | Miss Wena AI tutor (chat interface) |
| dashboard.html | /pages/dashboard.html | ✅ required | User dashboard + progress overview |
| progress.html | /pages/progress.html | ✅ required | Progress tracker |
| setup.html | /pages/setup.html | ✅ required | Onboarding — student level + subject setup |
| pricing.html | /pages/pricing.html | ❌ public | Pricing page — Stripe checkout integration |
| login.html | /pages/login.html | ❌ public | Login form |
| signup.html | /pages/signup.html | ❌ public | Sign-up form + free trial start |
| about.html | /pages/about.html | ❌ public | About page |
| contact.html | /pages/contact.html | ❌ public | Contact page |
| privacy.html | /pages/privacy.html | ❌ public | Privacy Policy (PDPA) |
| terms.html | /pages/terms.html | ❌ public | Terms of Service |
| index.html | / | ❌ public | Homepage |

---

## API Routes (`api/`)

All routes are served by the single gateway function `api/index.js`.
Frontend calls `/api/<route>` — `vercel.json` rewrites to `api/index.js`.

| Route | Method | Handler | Description |
|---|---|---|---|
| /api/chat | POST | handleChat | Miss Wena AI tutor — Claude Sonnet 4.6 |
| /api/checkout | POST | handleCheckout | Create Stripe checkout session |
| /api/webhook | POST | handleWebhook | Stripe webhook — subscription lifecycle |
| /api/generate | POST | handleGenerate | Bulk question generation (6 PSLE types) |
| /api/generate-question | POST | handleGenerateQuestion | On-demand single question — Gemini→Claude Haiku |
| /api/grade-answer | POST | handleGradeAnswer | AI semantic grading — Gemini→Claude Haiku |
| /api/save-exam-result | POST | handleSaveExamResult | Persist exam result to Supabase |

**Architecture:** `api/index.js` (1 Vercel function) → `lib/api/handlers.js` (7 named ESM exports)

---

## Handlers & Prompts (`lib/api/`)

| File | Exports | Description |
|---|---|---|
| lib/api/handlers.js | 7 named exports | All API handler logic + shared AI helpers |
| lib/api/prompts/mcq.js | MCQ_SYSTEM_PROMPT | System prompt for MCQ generation |
| lib/api/prompts/short-ans.js | SHORT_ANS_SYSTEM_PROMPT | System prompt for short answer generation |
| lib/api/prompts/word-problem.js | WORD_PROBLEM_SYSTEM_PROMPT | System prompt for word problem generation |
| lib/api/prompts/open-ended.js | OPEN_ENDED_SYSTEM_PROMPT | System prompt for open-ended Science generation |
| lib/api/prompts/cloze.js | CLOZE_SYSTEM_PROMPT | System prompt for grammar cloze generation |
| lib/api/prompts/editing.js | EDITING_SYSTEM_PROMPT | System prompt for editing passage generation |

---

## Frontend JS (`js/`)

| File | Type | Description |
|---|---|---|
| supabase-client.js | Global | Exposes `getSupabase()` — browser Supabase client |
| auth.js | Module | `guardPage(requireAuth)` — auth gate for protected pages |
| supabase.js | Module | Alternative ESM Supabase client (legacy) |
| exam-templates.js | Global | `getTemplate(subject, level)` — MOE paper structure definitions |
| exam-generator.js | Global | `generateExam(subject, level, type)` — assembles paper from question bank |
| quiz.js | Global | Quiz engine — question rendering and scoring |
| tutor.js | Global | AI tutor chat UI |
| stripe.js | Global | Stripe.js integration — checkout and subscription status |
| progress.js | Global | Progress tracker charts and Supabase queries |

---

## Question Bank (`data/questions/`)

See `data/questions/MANIFEST.md` for full inventory.

**Quick summary:** 158 total questions across 38 files, P1–P6, 3 subjects.

| Level | Maths | Science | English | Total |
|---|---|---|---|---|
| P1 | 10q | — | 0q | 10q |
| P2 | 12q | — | 11q | 23q |
| P3 | 5q | 5q | 5q | 15q |
| P4 | 15q | 13q | 19q | 47q |
| P5 | 18q | 15q | 5q | 38q |
| P6 | 5q | 5q | 15q | 25q |
| **Total** | **65q** | **38q** | **55q** | **158q** |

---

## Styles (`css/`)

| File | Description |
|---|---|
| css/style.css | **Single stylesheet** — Rose & Sage design system. All custom styles go here. Never create additional CSS files. |

---

## Configuration Files

| File | Description |
|---|---|
| vercel.json | Vercel config — cleanUrls, rewrites (7 API routes → api/index), security headers |
| package.json | Node 24.x, ESM (`"type":"module"`), 3 production dependencies |
| .env | Local secrets — gitignored. See Vercel dashboard for production values. |
| CLAUDE.md | Claude Code project instructions — read before writing any code |
| ARCHITECTURE.md | Architecture decisions and migration plan |
| AGENTS.md | Specialist agent definitions (exam-architect, design-guardian, etc.) |
| Master_Question_Template.md | Source of truth for all 6 PSLE question type schemas |
| PROJECT_DASHBOARD.md | Build status, coverage matrix, known issues |

---

## ECC Framework (`.claude/`)

| Path | Contents |
|---|---|
| .claude/rules/ | 13 always-active rules (coding-style, security, moe-templates, design-system, etc.) |
| .claude/commands/ | 10 slash commands (/deploy, /generate-questions, /security-check, etc.) |
| .claude/skills/ | 5 domain skills (question-factory, quiz-engine, page-builder, supabase-patterns, content-review) |
| .claude/agents/ | Specialist agent prompts (exam-architect, design-guardian, teaching-guide) |
| .claude/memory/ | Persistent session memory (MEMORY.md index + individual memory files) |
| .claude/docs/adr/ | Architecture Decision Records |

---

## Supabase Schema (6 tables, all RLS-enabled)

| Table | Key Columns | Notes |
|---|---|---|
| profiles | id, subscription_tier, max_children, stripe_customer_id | 1:1 with auth.users |
| students | id, parent_id, level, selected_subject, name | Up to 3 per family plan |
| subscriptions | profile_id, stripe_subscription_id, plan_name, status | Managed by webhook handler |
| quiz_results | student_id, subject, level, score, created_at | Per-quiz result |
| exam_results | student_id, subject, level, exam_type, score, created_at | ⚠️ Pending migration: run supabase/003_exam_results.sql |
| questions | id, subject, level, type, topic, data | Optional DB-backed questions (not yet in use) |

---

## Stripe Products (Live)

| Plan | Monthly Price ID | Annual Price ID | Price |
|---|---|---|---|
| Single Subject | price_1TGgUCL7IdGWGv1ueyWiypLB | price_1TGgX9L7IdGWGv1ukjF3MjIc | S$9.99/mo · S$7.99/mo annual |
| All Subjects | price_1TGgVFL7IdGWGv1uWmlFZMNz | price_1TGgXgL7IdGWGv1uM8vyCKks | S$19.99/mo · S$15.99/mo annual |
| Family | price_1TGgVuL7IdGWGv1uYENqStUl | price_1TGgYML7IdGWGv1uXGyHKZXm | S$29.99/mo · S$23.99/mo annual |

---

## Environment Variables

| Variable | Used In | Secret? |
|---|---|---|
| ANTHROPIC_API_KEY | lib/api/handlers.js | ✅ server only |
| STRIPE_SECRET_KEY | lib/api/handlers.js | ✅ server only |
| STRIPE_WEBHOOK_SECRET | lib/api/handlers.js | ✅ server only |
| SUPABASE_SERVICE_ROLE_KEY | lib/api/handlers.js | ✅ server only |
| SUPABASE_URL | supabase-client.js + handlers | ⚠️ public-safe |
| SUPABASE_ANON_KEY | supabase-client.js | ⚠️ public-safe |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | stripe.js | ⚠️ public-safe |
| GEMINI_API_KEY | lib/api/handlers.js (fallback grading) | ✅ server only |
