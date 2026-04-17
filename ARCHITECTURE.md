# SUPERHOLIC LAB — ARCHITECTURE BRIEFING
# Version 3.0 | Updated 2026-04-17
# Purpose: Source of truth for Claude Code on infrastructure,
#          database schema, API routes, and build state.

═══════════════════════════════════════════════════════════════
WHAT THIS FILE IS
═══════════════════════════════════════════════════════════════

Claude Code must read CLAUDE.md + this file at session start.
CLAUDE.md has coding rules, dev workflow, and feature reference.
This file has infrastructure, schema, API routes, and build state.

═══════════════════════════════════════════════════════════════
THE PRODUCT
═══════════════════════════════════════════════════════════════

Platform name:    Superholic Lab
Tagline:          "Learn like a champion. Think like a winner."
Live domain:      https://www.superholiclab.com
GitHub repo:      https://github.com/feynman82/Superholic-Lab
Local code path:  D:\Git\Superholic-Lab
Google Drive MCP: C:\SLabDrive (junction to G:\My Drive\Superholic Lab)

What it is:
  Singapore's AI-powered EdTech platform for P1–S4 students.
  Parents subscribe monthly. Students practise MOE-aligned questions
  in 6 PSLE exam formats, get AI tutoring from Miss Wena, track
  progress, and receive personalised remedial plans.

Key differentiator:
  Wrong-answer explanations naming specific misconceptions for every
  MCQ option + 6 question types matching actual SEAB exam formats.

═══════════════════════════════════════════════════════════════
SUBSCRIPTION TIERS (current)
═══════════════════════════════════════════════════════════════

All plans: 7-day free trial, no credit card required at signup.
Stripe charges immediately when parent clicks Subscribe.
No trial_period_days in Stripe — trial is tracked app-side only.

  All Subjects    S$12.99/month  |  S$129.90/year (save 17%)
  Family Plan     S$19.99/month  |  S$199.90/year (save 17%)

FAMILY adds up to 3 child profiles. ALL SUBJECTS = 1 child profile.
Single Subject tier is REMOVED from product and codebase.

Stripe Price IDs in .env:
  STRIPE_ALL_SUBJECTS_PRICE_ID         monthly all_subjects
  STRIPE_FAMILY_PRICE_ID               monthly family
  STRIPE_ALL_SUBJECTS_ANNUAL_PRICE_ID  annual all_subjects
  STRIPE_FAMILY_ANNUAL_PRICE_ID        annual family

═══════════════════════════════════════════════════════════════
INFRASTRUCTURE
═══════════════════════════════════════════════════════════════

  ✓ GitHub      feynman82/Superholic-Lab, auto-deploy on push to main
  ✓ Vercel      Hobby plan, ~60s deploy, 12-function limit
  ✓ Cloudflare  DNS: www.superholiclab.com → Vercel
  ✓ Supabase    SG region (rlmqsbxevuutugtyysjr), RLS on all tables
  ✓ Stripe      Test mode (webhook configured, whsec set in Vercel)
  ✓ Gemini      gemini-3-flash-preview (primary AI model for Miss Wena)
  ✓ Anthropic   claude-3-5-sonnet-20241022 (grading + question gen)
  ✓ Plausible   Analytics script tag (added to pricing.html, extend to all pages)
  ✓ MCP         supabase + github + filesystem (in Claude Code sessions)
  ✓ Auth        Email/password + Google OAuth + Apple OAuth

═══════════════════════════════════════════════════════════════
API ARCHITECTURE — SINGLE SERVERLESS GATEWAY
═══════════════════════════════════════════════════════════════

Vercel Hobby = 12-function cap. All routes share ONE function:

  /api/{any}  →  api/index.js  (router)
                   →  lib/api/handlers.js  (all handler logic)

vercel.json rewrites map each /api/{route} → /api/index.
api/index.js strips the prefix and dispatches via switch statement.
The webhook route bypasses JSON body parsing (raw body required).

Do NOT create new api/*.js files — add handlers to lib/api/handlers.js
and register them in api/index.js + vercel.json.

AI MODEL ROUTING:
  Chat/tutor:        Gemini Flash (primary) → no Claude fallback
  Question gen:      Gemini Flash (primary) → Claude Sonnet (fallback)
  Grading:           Claude Sonnet (primary) → Gemini Flash (fallback)
  Exam gen:          Gemini Flash (primary) → Claude Haiku (fallback)
  Quest/analysis:    Gemini Flash (primary) → Claude Sonnet (fallback)
  Summarize chat:    Gemini Flash only
  Bulk generation:   Claude Sonnet via /api/generate (internal tooling)

═══════════════════════════════════════════════════════════════
SUPABASE DATABASE SCHEMA — RLS ENABLED ON ALL TABLES
═══════════════════════════════════════════════════════════════

RLS PATTERN FOR STUDENT DATA (always use this — not auth.uid() = student_id):
  student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())

───────────────────────────────────────────────────────────────
TABLE: profiles
  id                  uuid PK (= auth.users.id)
  email               text
  full_name           text
  role                text   'parent' | 'admin' | 'sub-admin'
  subscription_tier   text   'trial' | 'all_subjects' | 'family' | 'single_subject'
  stripe_customer_id  text   (set by webhook on first checkout)
  trial_started_at    timestamptz
  trial_ends_at       timestamptz  (7 days after created_at)
  max_children        int    1 for trial/all_subjects, 3 for family
  setup_complete      bool
  intended_plan       text   (set at signup — cosmetic preference only)
  created_at          timestamptz
  updated_at          timestamptz

  Triggers: handle_new_user() on auth.users INSERT
            handle_updated_at() on profiles UPDATE

───────────────────────────────────────────────────────────────
TABLE: students
  id               uuid PK
  parent_id        uuid FK → profiles.id
  name             text
  level            text   e.g. 'Primary 4'
  selected_subject text
  photo_url        text   (Supabase Storage, avatars bucket)
  created_at       timestamptz

───────────────────────────────────────────────────────────────
TABLE: quiz_attempts
  id                  uuid PK
  student_id          uuid FK → students.id
  subject             text
  level               text
  topic               text
  difficulty          text
  score               numeric
  total_questions     int
  time_taken_seconds  int
  completed_at        timestamptz

───────────────────────────────────────────────────────────────
TABLE: question_attempts
  id               uuid PK
  quiz_attempt_id  uuid FK → quiz_attempts.id
  student_id       uuid FK → students.id
  question_text    text
  topic            text
  difficulty       text
  correct          bool
  answer_chosen    text
  correct_answer   text
  created_at       timestamptz

───────────────────────────────────────────────────────────────
TABLE: subscriptions
  id                       uuid PK
  profile_id               uuid FK → profiles.id
  stripe_subscription_id   text UNIQUE  (⚠ add UNIQUE constraint if missing)
  stripe_price_id          text
  plan_name                text
  status                   text  'active'|'past_due'|'cancelled'
  current_period_start     timestamptz
  current_period_end       timestamptz
  created_at               timestamptz

  NOTE: stripe_subscription_id must have a UNIQUE constraint for
  the upsert in handleWebhook to work correctly. If absent, the
  upsert will silently fail (profiles still updates correctly via
  the same webhook, so access control is not affected).

───────────────────────────────────────────────────────────────
TABLE: daily_usage
  id                   uuid PK
  student_id           uuid FK → students.id
  date                 date
  questions_attempted  int
  ai_tutor_messages    int
  UNIQUE(student_id, date)

───────────────────────────────────────────────────────────────
TABLE: question_bank  (PRIMARY CONTENT STORE)
  id                uuid PK
  seed_id           uuid  (original if is_ai_cloned = true)
  is_ai_cloned      bool
  subject           text  'Mathematics'|'Science'|'English'
  level             text  'Primary 1' ... 'Secondary 4'
  topic             text
  sub_topic         text
  difficulty        text  'Foundation'|'Standard'|'Advanced'|'HOTS'
  type              text  'mcq'|'short_ans'|'word_problem'|'open_ended'|'cloze'|'editing'
  marks             int
  question_text     text
  options           jsonb  [{label, text}]
  correct_answer    text  letter format: "B" (never index)
  wrong_explanations jsonb {"A": "misconception", ...}
  worked_solution   text
  parts             jsonb  [{label, marks, question, correct_answer, worked_solution, progressive_hints}]
  keywords          text[]
  model_answer      text
  passage           text
  blanks            jsonb
  passage_lines     jsonb
  examiner_note     text
  cognitive_skill   text
  progressive_hints jsonb
  image_url         text
  visual_payload    jsonb  {engine, function_name, params} for diagram-library.js
  instructions      text
  flag_review       bool
  accept_also       text
  created_at        timestamptz

───────────────────────────────────────────────────────────────
TABLE: study_notes  (Miss Wena Backpack)
  id            uuid PK
  student_id    uuid FK → students.id
  subject       text
  topic         text
  title         text
  content_html  text  (HTML generated by /api/summarize-chat)
  is_read       bool
  created_at    timestamptz

───────────────────────────────────────────────────────────────
TABLE: exam_results
  id                   uuid PK
  student_id           uuid FK → students.id
  subject              text
  level                text
  exam_type            text  'WA1'|'WA2'|'EOY'|'PRELIM'|'PRACTICE'|'QUIZ'
  exam_id              text  (optional identifier)
  score                int
  total_marks          int
  time_taken           int   (seconds)
  questions_attempted  int
  completed_at         timestamptz

  NOTE: SA1 is abolished (MOE 2023). Valid types: WA1, WA2, EOY.
        Do not reference SA1 anywhere.

───────────────────────────────────────────────────────────────
TABLE: remedial_quests
  id                  uuid PK
  student_id          uuid FK → students.id
  subject             text
  level               text
  topic               text
  trigger_score       numeric  (quiz score % that triggered the quest)
  trigger_attempt_id  uuid
  quest_title         text
  steps               jsonb  [{day, type, title, description, action_url, estimated_minutes}]
  current_step        int
  status              text  'active' | 'completed'
  created_at          timestamptz

  Step URL rules:
    Day 1 (tutor):  /pages/tutor.html?subject=X&level=Y&intent=remedial&topic=Z&score=N
    Day 2 (quiz):   /pages/quiz.html?subject=X&level=Y&topic=Z&type=mcq
    Day 3 (quiz):   /pages/quiz.html?subject=X&level=Y&topic=Z&type=short_ans

═══════════════════════════════════════════════════════════════
PROJECT STRUCTURE (current)
═══════════════════════════════════════════════════════════════

D:\Git\Superholic-Lab\
├── index.html               ← Marketing homepage
├── 404.html                 ← Custom error page
├── CLAUDE.md                ← Coding rules + dev workflow (read first)
├── ARCHITECTURE.md          ← This file
├── AGENTS.md                ← 5 specialist subagent definitions
├── .env                     ← All secrets (gitignored)
├── .mcp.json                ← MCP server config (gitignored)
├── vercel.json              ← 13 rewrites + security headers
├── package.json
├── pages/
│   ├── account.html           ← Parent account portal (profile, password, billing)
│   ├── admin.html             ← Master admin panel (role-gated)
│   ├── confirm-email.html     ← Email confirmation holding page
│   ├── contact.html
│   ├── dashboard.html         ← Parent dashboard (learner cards, backpack)
│   ├── exam.html              ← AI exam paper generator
│   ├── login.html             ← Email + Google + Apple login
│   ├── pricing.html           ← Plans + monthly/annual toggle + FAQ
│   ├── privacy.html
│   ├── progress.html          ← Progress tracker + weakness analysis + quest
│   ├── quiz.html              ← Quiz engine (all 6 PSLE question types)
│   ├── setup.html             ← New learner setup (post-signup)
│   ├── signup.html            ← 7-day trial signup, no credit card
│   ├── subject-english.html   ← English subject landing page
│   ├── subject-mathematics.html ← Maths subject landing page
│   ├── subject-science.html   ← Science subject landing page
│   ├── subjects.html          ← Level + subject selector
│   ├── terms.html
│   ├── tutor.html             ← Miss Wena AI tutor chat
│   └── update-password.html   ← Password reset landing page
├── css/
│   └── style.css              ← ALL styles, all CSS variables (do not add new CSS files)
├── js/
│   ├── app-shell.js           ← Plan badge + shared UI init
│   ├── auth.js                ← Auth, paywall, guardPage(), enforcePaywall()
│   ├── diagram-library.js     ← SVG diagram rendering for visual_payload questions
│   ├── exam-generator.js      ← Exam config and section builder
│   ├── exam-renderer.js       ← Renders generated exam paper to DOM
│   ├── exam-templates.js      ← Preset exam configs (WA, EOY, PSLE)
│   ├── footer.js              ← <global-footer> web component
│   ├── header.js              ← <global-header> web component (auth-aware)
│   ├── progress.js            ← Progress charts + weakness analysis
│   ├── quiz.js                ← Quiz engine (fetches from question_bank via Supabase)
│   ├── supabase-client.js     ← Supabase JS client singleton (getSupabase())
│   ├── supabase.js            ← Legacy alias (do not modify)
│   └── tutor.js               ← Miss Wena chat UI + save notes logic
├── api/
│   ├── index.js               ← ONLY serverless entry point (router)
│   ├── generate-quest.js      ← Legacy alias (kept for progress.html compatibility)
│   ├── summarize-chat.js      ← Legacy alias (kept for tutor.html compatibility)
│   └── cron/
│       └── fill-bank.js         ← Cron job for question bank auto-fill
├── lib/
│   └── api/
│       ├── handlers.js          ← ALL handler logic (13 handlers)
│       └── prompts/             ← System prompts for /api/generate
│           ├── mcq.js
│           ├── short-ans.js
│           ├── word-problem.js
│           ├── open-ended.js
│           ├── cloze.js
│           └── editing.js
├── supabase/                  ← SQL migrations (run manually in Supabase SQL Editor)
│   ├── 002_question_types.sql
│   ├── 003_exam_results.sql
│   ├── 004_profiles_email.sql
│   ├── 006_study_notes.sql
│   ├── 007_photo_upload.sql
│   └── 008_fix_profile_trigger.sql  (APPLIED 2026-04-17)
├── assets/
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
│       ├── miss_wena.png          ← AI tutor avatar (SVG onerror fallback)
│       └── ... (screenshots, student illustrations)
├── hooks/
│   └── hooks.json             ← Secret detection + CSS enforcement
└── .claude/
    ├── rules/                 ← 7 always-active rule files
    ├── commands/              ← 6 slash commands
    ├── skills/                ← 5 domain skills
    └── settings.local.json    ← MCP permissions (gitignored)

═══════════════════════════════════════════════════════════════
BUILD STATUS (as of 2026-04-17)
═══════════════════════════════════════════════════════════════

COMPLETED
  [x] CSS design system (Rose & Sage, Bebas Neue, CSS variables)
  [x] Marketing homepage (index.html)
  [x] Subject landing pages (maths, science, english)
  [x] 404 page
  [x] Auth: email/password + Google + Apple OAuth
  [x] Auth pages: login.html, signup.html, confirm-email.html, update-password.html
  [x] Signup flow: 7-day trial, no credit card, subscription_tier = 'trial'
  [x] Profile trigger: handle_new_user() + 008 migration applied
  [x] guardPage() + enforcePaywall() in auth.js
  [x] Daily usage limits (5 questions/day on trial)
  [x] Quiz engine: all 6 PSLE question types (quiz.js + quiz.html)
  [x] Question bank: migrated to Supabase question_bank table
  [x] Miss Wena AI tutor: Gemini Flash, 3-Strike scaffolding, save-to-backpack
  [x] Study Notes Backpack: summarize-chat → study_notes table → dashboard modal
  [x] Progress tracker (progress.html + progress.js)
  [x] AI weakness analysis (/api/analyze-weakness)
  [x] Remedial Plan Quest (/api/generate-quest, 3-day plan)
  [x] Exam generator: AI-generated WA/EOY/PSLE papers (exam.html)
  [x] AI grading for open_ended + word_problem (/api/grade-answer)
  [x] Stripe: trial-first flow, checkout, webhook, profiles.subscription_tier updated
  [x] Stripe Customer Portal (/api/portal via account.html)
  [x] Parent Account Portal (account.html: profile, email, password, billing)
  [x] Master Admin Panel (admin.html: users, plans, students, role-gated)
  [x] Dashboard: checkout polling (auto-updates UI on webhook), trial banner
  [x] Header: Manage Billing link for subscribers, Admin Panel link for admins
  [x] Student photo upload (Supabase Storage, avatars bucket)
  [x] ECC framework (rules, commands, agents, hooks, skills)
  [x] Single gateway API (api/index.js → lib/api/handlers.js, 13 routes)
  [x] vercel.json: 13 rewrites + security headers
  [x] Profile trigger fix (008_fix_profile_trigger.sql applied)
  [x] Subject-specific pages (subject-mathematics/science/english.html)

PENDING / IN PROGRESS
  [ ] Analytics: Plausible script on ALL pages (currently pricing.html only)
  [ ] SEO: meta descriptions, Open Graph, JSON-LD on all pages
  [ ] sitemap.xml + robots.txt
  [ ] subscriptions table: UNIQUE constraint on stripe_subscription_id
  [ ] Stripe: switch from test mode to live mode
  [ ] Question bank: expand to 600+ questions (P1, P3, P6 currently empty)

═══════════════════════════════════════════════════════════════
HOW TO START A CLAUDE CODE SESSION
═══════════════════════════════════════════════════════════════

Open Claude Code in D:\Git\Superholic-Lab.
Rules and hooks load automatically from .claude/ and hooks/.

First prompt for any new session:
  "Read CLAUDE.md and ARCHITECTURE.md, then [your task]."

MCP servers available in Claude Code:
  filesystem   D:\Git\Superholic-Lab + C:\SLabDrive
  github       feynman82/Superholic-Lab
  supabase     project: rlmqsbxevuutugtyysjr
  Chrome MCP   for visual QA after deploys

═══════════════════════════════════════════════════════════════
END OF ARCHITECTURE BRIEFING v3.0
═══════════════════════════════════════════════════════════════
