# SUPERHOLIC LAB — ARCHITECTURE BRIEFING
# Version 2.0 | Updated 2026-03-25
# Purpose: Source of truth for Claude Code on infrastructure,
#          project state, ECC framework, and build plan.

═══════════════════════════════════════════════════════════════
WHAT THIS FILE IS
═══════════════════════════════════════════════════════════════

Claude Code must read CLAUDE.md + this file at session start.
CLAUDE.md has coding rules and dev workflow.
This file has infrastructure, schema, and build state.

═══════════════════════════════════════════════════════════════
THE PRODUCT
═══════════════════════════════════════════════════════════════

Platform name:    Superholic Lab
Tagline:          "Learn like a champion. Think like a winner."
Live domain:      https://www.superholiclab.com
GitHub repo:      https://github.com/feynman82/Superholic-Lab
Local code path:  D:\Git\Superholic-Lab

What it is:
  Singapore's AI-powered learning platform for P1–S4 students.
  Parents pay monthly subscriptions. Children practice MOE-aligned
  questions with 6 PSLE exam formats, full worked solutions,
  wrong-answer explanations, and an AI tutor.

Key differentiator:
  Wrong-answer explanations for every MCQ option + 6 question
  types matching actual MOE/SEAB exam formats (not just MCQ).

═══════════════════════════════════════════════════════════════
SUBSCRIPTION TIERS
═══════════════════════════════════════════════════════════════

All plans include a 7-day free trial. No credit card required.

  Tier 1: Single Subject    SGD 9.99/month
  Tier 2: All Subjects      SGD 19.99/month (FEATURED)
  Tier 3: Family            SGD 29.99/month (up to 3 children)

Annual pricing: 17% discount (~2 months free).
Stripe price IDs stored in .env.

═══════════════════════════════════════════════════════════════
INFRASTRUCTURE — ALL CONFIRMED WORKING
═══════════════════════════════════════════════════════════════

  ✓ GitHub       feynman82/Superholic-Lab, main branch
  ✓ Vercel       Auto-deploy from main, ~60s
  ✓ Cloudflare   DNS for superholiclab.com
  ✓ Supabase     SG region, 6 tables, RLS enabled
  ✓ Stripe       Test mode, 3 SGD products
  ✓ Anthropic    claude-sonnet-4-6 via api/chat.js
  ✓ MCP          supabase + github + filesystem

═══════════════════════════════════════════════════════════════
ECC FRAMEWORK — DEVELOPMENT SYSTEM
═══════════════════════════════════════════════════════════════

Superholic Lab uses the Everything Claude Code (ECC) framework
for structured development. This provides:

Rules (.claude/rules/) — 7 always-active guidelines:
  coding-style.md       Immutability, naming, file limits
  security.md           PDPA, XSS, RLS, secret detection
  git-workflow.md       Conventional commits, pre-push checks
  development-workflow.md Research-first pipeline
  patterns.md           Supabase queries, API functions, question schema
  performance.md        Token optimization, frontend + DB perf
  testing.md            Manual verification protocol

Commands (.claude/commands/) — 6 slash commands:
  /plan                 Feature implementation planning
  /code-review          Quality + security review
  /build-fix            Error diagnosis and fix
  /deploy               Pre-deploy checklist + push
  /generate-questions   MOE-aligned content for all 6 question types
  /security-check       Full security audit

Agents (AGENTS.md) — 5 specialist subagents:
  planner, code-reviewer, security-reviewer,
  quiz-content-reviewer, database-reviewer

Hooks (hooks/hooks.json) — 2 automated checks:
  Secret detection      Blocks exposed API keys on file edit
  CSS enforcement       Warns on hardcoded colors

═══════════════════════════════════════════════════════════════
MASTER QUESTION TEMPLATE — 6 PSLE EXAM FORMATS
═══════════════════════════════════════════════════════════════

Full template: C:\SLabDrive\01 - Platform Intelligence\Master_Question_Template.md
Also: data/MASTER_QUESTION_TEMPLATE.md (summary in repo)

Supported question types:
  mcq          MCQ with A/B/C/D (Maths, Science, English)
  short_ans    Text input, numerical/fraction (Maths Paper 1B)
  word_problem Multi-part (a)(b)(c), show working (Maths Paper 2)
  open_ended   Written explanation with keywords (Science Booklet B)
  cloze        Grammar cloze passage with blanks (English Paper 2)
  editing      Spot and correct errors (English Paper 2)

Universal base fields (all types):
  id, subject, level, topic, sub_topic, difficulty, type,
  marks, question_text, correct_answer, worked_solution,
  examiner_note

File naming: data/questions/{level}-{subject}-{topic}.json
  Examples: p4-mathematics-fractions.json, p4-science-heat.json

Quality rules:
  • Singapore context (names, places, food)
  • All MCQ wrong options have specific misconception explanations
  • Science/English MCQ options are full sentences
  • Worked solutions have numbered steps
  • Difficulty mix: 20% Foundation, 50% Standard, 20% Advanced, 10% HOTS
  • Minimum 20 questions per file

═══════════════════════════════════════════════════════════════
CURRENT PROJECT STRUCTURE (as of v2.0)
═══════════════════════════════════════════════════════════════

D:\Git\Superholic-Lab\
├── index.html              ← Marketing homepage
├── 404.html                ← Friendly error page
├── CLAUDE.md               ← Coding rules + dev workflow
├── ARCHITECTURE.md         ← This file (infra + state)
├── AGENTS.md               ← Subagent definitions
├── .env                    ← Credentials (gitignored)
├── .gitignore
├── .mcp.json               ← MCP server config (gitignored)
├── package.json
├── vercel.json             ← Security headers + routing
├── pages/
│   ├── subjects.html       ← Subject + level selector
│   ├── quiz.html           ← Quiz engine (6 question types)
│   ├── tutor.html          ← AI tutor chat
│   ├── progress.html       ← Student progress tracker
│   ├── pricing.html        ← Subscription plans
│   ├── login.html          ← Auth
│   ├── signup.html         ← Auth
│   ├── dashboard.html      ← Student dashboard
│   ├── about.html
│   ├── terms.html
│   ├── privacy.html
│   └── contact.html
├── css/
│   └── style.css           ← ALL styles, CSS variables
├── js/
│   ├── supabase-client.js  ← Supabase client instance
│   ├── supabase.js         ← Legacy (to be removed)
│   ├── auth.js             ← Auth + session + paywall
│   ├── quiz.js             ← Quiz engine (6 types)
│   ├── tutor.js            ← AI tutor + system prompts
│   ├── progress.js         ← Progress tracking
│   └── stripe.js           ← Stripe checkout redirect
├── api/
│   ├── chat.js             ← Anthropic API serverless
│   ├── generate.js         ← Question generation
│   ├── checkout.js         ← Stripe checkout session
│   └── webhook.js          ← Stripe webhook handler
├── data/
│   ├── MASTER_QUESTION_TEMPLATE.md
│   └── questions/          ← Question bank JSON files
│       ├── p2-mathematics.json
│       ├── p2-english.json
│       ├── p4-mathematics.json
│       ├── p4-science.json
│       └── p4-english.json
├── assets/
│   ├── favicon.ico
│   └── logo.svg
├── hooks/
│   └── hooks.json          ← Automated quality hooks
└── .claude/
    ├── settings.local.json ← MCP permissions (gitignored)
    ├── rules/              ← 7 always-active rule files
    │   ├── coding-style.md
    │   ├── security.md
    │   ├── git-workflow.md
    │   ├── development-workflow.md
    │   ├── patterns.md
    │   ├── performance.md
    │   └── testing.md
    └── commands/           ← 6 slash commands
        ├── plan.md
        ├── code-review.md
        ├── build-fix.md
        ├── deploy.md
        ├── generate-questions.md
        └── security-check.md

═══════════════════════════════════════════════════════════════
SUPABASE DATABASE SCHEMA — 6 TABLES, RLS ENABLED
═══════════════════════════════════════════════════════════════

TABLE 1: profiles
  id, full_name, role, subscription_tier, stripe_customer_id,
  trial_started_at, trial_ends_at, max_children, created_at, updated_at
  Triggers: handle_new_user(), handle_updated_at()

TABLE 2: students
  id, parent_id, name, level, selected_subject, created_at

TABLE 3: quiz_attempts
  id, student_id, subject, level, topic, difficulty,
  score, total_questions, time_taken_seconds, completed_at

TABLE 4: question_attempts
  id, quiz_attempt_id, student_id, question_text, topic,
  difficulty, correct, answer_chosen, correct_answer, created_at

TABLE 5: subscriptions
  id, profile_id, stripe_subscription_id, stripe_price_id,
  plan_name, status, current_period_start, current_period_end, created_at

TABLE 6: daily_usage
  id, student_id, date, questions_attempted, ai_tutor_messages
  unique(student_id, date)

═══════════════════════════════════════════════════════════════
ENVIRONMENT VARIABLES
═══════════════════════════════════════════════════════════════

All in .env (gitignored) + Vercel dashboard:
  ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY (server-only),
  STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY (server-only),
  STRIPE_SINGLE_SUBJECT_PRICE_ID, STRIPE_ALL_SUBJECTS_PRICE_ID,
  STRIPE_FAMILY_PRICE_ID, NEXT_PUBLIC_APP_URL

SECURITY: Never hardcode. Server-only keys never in frontend JS.

═══════════════════════════════════════════════════════════════
DESIGN SYSTEM
═══════════════════════════════════════════════════════════════

Font: Plus Jakarta Sans (400, 500, 600)
CSS Variables:
  --primary: #4338ca  --primary-light: #eef2ff  --primary-dark: #3730a3
  --accent: #f59e0b   --success: #10b981       --danger: #ef4444
  --text-primary: #111827  --text-secondary: #6b7280
  --bg: #f9fafb  --white: #ffffff  --border: #e5e7eb

Difficulty badges:
  Foundation: bg #f0fdf4 text #15803d
  Standard:   bg #f0fdfa text #0f766e
  Advanced:   bg #fffbeb text #b45309
  HOTS:       bg #fff1f2 text #be123c

═══════════════════════════════════════════════════════════════
AI TUTOR SYSTEM PROMPTS
═══════════════════════════════════════════════════════════════

Defined in api/chat.js, switch by subject.
4 prompts: Mathematics, Science, English, General (fallback).
All follow MOE syllabus, guide before answering, step-by-step
working, celebrate specific correct thinking.
See js/tutor.js for the full prompt text.

═══════════════════════════════════════════════════════════════
BUILD STATUS — 4-WEEK SPRINT
═══════════════════════════════════════════════════════════════

WEEK 1 — Foundation & Homepage        [COMPLETED]
  [x] Repo cleaned + scaffolded
  [x] CSS design system (style.css)
  [x] Marketing homepage (index.html)
  [x] Subject selection page
  [x] 404 page

WEEK 2 — Quiz Engine & AI Tutor        [COMPLETED]
  [x] Supabase JS client (supabase-client.js)
  [x] Auth module (auth.js)
  [x] Auth pages (login.html, signup.html)
  [x] Quiz engine with MCQ (quiz.js + quiz.html)
  [x] AI tutor chat (tutor.js + tutor.html + api/chat.js)
  [x] Question bank JSON (P2/P4 Maths, Science, English)
  [x] ECC framework implemented
  [x] Master Question Template defined (6 types)

WEEK 3 — Auth, Payments & Progress     [IN PROGRESS]
  [ ] Implement 6 question types in quiz engine
  [ ] Migrate question bank to topic-specific files
  [ ] Topic selection on subjects page
  [ ] Progress tracker (progress.js + progress.html)
  [ ] Stripe integration (checkout.js + webhook.js)
  [ ] Pricing page with Stripe Checkout
  [ ] Paywall enforcement

WEEK 4 — Polish, SEO & Launch          [NOT STARTED]
  [ ] Loading states + error handling everywhere
  [ ] SEO meta tags + JSON-LD
  [ ] Analytics (Plausible or GA4)
  [ ] Legal pages (PDPA-compliant terms/privacy)
  [ ] Switch Stripe to live mode

═══════════════════════════════════════════════════════════════
CONTENT IN GOOGLE DRIVE (via MCP)
═══════════════════════════════════════════════════════════════

Path: C:\SLabDrive (alias for Google Drive)

  01 - Platform Intelligence/
    Master_Question_Template.md  ← SOURCE OF TRUTH for question formats
    System Prompt v1.0.txt
    Brand Story Homepage Copy.html
  02 - MOE Syllabuses/
    Primary/ (P1-P6 Maths, P3-P6 Science, P1-P6 English PDFs)
  03 - Content Library/
    Primary 4/ Mathematics/ (weekly content gdocs)
  04 - Business/
    Brand Story, Competitor Research, Pricing Strategy
  05 - Content Tracker/
    Master Content Tracker.gsheet

═══════════════════════════════════════════════════════════════
HOW TO START A CLAUDE CODE SESSION
═══════════════════════════════════════════════════════════════

Open Claude Code in D:\Git\Superholic-Lab.
Rules and hooks load automatically from .claude/ and hooks/.
Commands available: /plan, /code-review, /build-fix, /deploy,
/generate-questions, /security-check

First prompt for any session:
  Read CLAUDE.md and ARCHITECTURE.md, then [your task].

═══════════════════════════════════════════════════════════════
END OF ARCHITECTURE BRIEFING v2.0
═══════════════════════════════════════════════════════════════
