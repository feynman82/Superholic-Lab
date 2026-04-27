# SUPERHOLIC LAB — ARCHITECTURE BRIEFING
# Version 4.1 | Updated 2026-04-27
# Purpose: Source of truth for Claude Code on infrastructure,
#          database schema, API routes, and build state.

═══════════════════════════════════════════════════════════════
WHAT THIS FILE IS
═══════════════════════════════════════════════════════════════

Claude Code must read CLAUDE.md + this file at session start.
CLAUDE.md has coding rules, dev workflow, the 4 Pillars (canonical
value proposition), and feature reference. This file has infrastructure,
schema, API routes, and build state.

For Plan Quest behaviour and pedagogy, also defer to
docs/QUEST_PAGE_SPEC.md v2.0 — that file is authoritative.

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
  across 7 PSLE exam formats (see Master_Question_Template.md), get AI
  tutoring from Miss Wena, track progress, run personalised 3-day Plan
  Quests when they hit a weak topic, and earn XP / levels / badges for
  real learning actions.

Key differentiators:
  1. Wrong-answer explanations naming specific misconceptions for every
     MCQ option + question types matching actual SEAB exam formats.
  2. The 3-day Plan Quest pedagogy: Day 1 ramping practice, Day 2
     Socratic dialogue with Miss Wena, Day 3 mastery trial with a
     three-way honest exit (mastered / slight_improvement / no_improvement).
     The Honest Compass badge for `no_improvement` exits is the platform's
     signal that it values self-awareness over fake celebrations.
  3. The 4 Pillars closed-loop pedagogy:
       (1) Practise (quiz.html) — students do reps with full feedback
       (2) Analyse Weakness (BKT on progress.html) — surfaces root-cause
           topic, weighting AO3-level cognitive skills 1.5×
       (3) Remedial Plan (Plan Quest) — 3-day intervention built on the
           diagnosis (the IP, see point 2)
       (4) Assess (exam.html) — AI-generated WA/EOY/PSLE papers prove
           that mastery sticks
     The loop is closed: Practise reveals weakness → Analyse diagnoses
     root cause → Plan Quest fixes it → Assess proves the fix held.
     Most competitors only do Practise. CLAUDE.md "The 4 Pillars" section
     is the canonical reference for marketing copy and FAQ wording.

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

Stripe Price IDs in .env (and Vercel dashboard):
  STRIPE_ALL_SUBJECTS_PRICE_ID         monthly all_subjects
  STRIPE_FAMILY_PRICE_ID               monthly family
  STRIPE_ALL_SUBJECTS_ANNUAL_PRICE_ID  annual all_subjects
  STRIPE_FAMILY_ANNUAL_PRICE_ID        annual family

═══════════════════════════════════════════════════════════════
INFRASTRUCTURE
═══════════════════════════════════════════════════════════════

  ✓ GitHub      feynman82/Superholic-Lab, auto-deploy on push to main
  ✓ Vercel      Hobby plan, ~60s deploy, 12-function limit (we use 1)
  ✓ Cloudflare  DNS: www.superholiclab.com → Vercel
  ✓ Supabase    SG region (rlmqsbxevuutugtyysjr), RLS on all tables
  ✓ Stripe      Test mode (webhook configured, whsec set in Vercel)
  ✓ Gemini      gemini-3-flash-preview (Miss Wena chat, summarise, exam-gen primary, quest narrative)
  ✓ Anthropic   claude-3-5-sonnet-20241022 (bulk question gen via /api/generate),
                claude-haiku-4-5-20251001 (exam-gen fallback)
  ✓ OpenAI      LIVE for grading (gpt-4o-mini in handleGradeAnswer) and
                on-demand question gen (o4-mini in handleGenerateQuestion).
                Migration of remaining endpoints (chat, summarize, exam,
                quest narrative) to OpenAI is PENDING (Workstream B handoff).
  ✓ Plausible   Analytics script tag (rollout in progress)
  ✓ MCP         supabase + github + filesystem (in Claude Code sessions)
  ✓ Auth        Email/password + Google OAuth

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

────────────────────────────────────────────────────────────
24 ROUTES (current — as of 2026-04-27)
────────────────────────────────────────────────────────────

  /api/chat                    handleChat              Miss Wena tutor + Socratic Quest
  /api/checkout                handleCheckout          Stripe Checkout
  /api/webhook                 handleWebhook           Stripe webhook (raw body)
  /api/portal                  handlePortal            Stripe Customer Portal
  /api/admin                   handleAdmin             Admin panel data
  /api/admin-edit              handleAdminEdit         Admin row edits
  /api/analytics               handleAnalytics         Admin analytics
  /api/pause                   handlePause             Subscription pause/resume
  /api/referral                handleReferral          Referral codes
  /api/account-delete          handleAccountDelete     PDPA account deletion
  /api/export                  handleExport            PDPA data export
  /api/contact                 handleContact           Contact form
  /api/qa-questions            handleQaQuestions       QA panel listing
  /api/generate                handleGenerate          Bulk question gen (Anthropic Sonnet)
  /api/generate-question       handleGenerateQuestion  On-demand question (OpenAI o4-mini)
  /api/generate-exam           handleGenerateExam      Exam paper generation (Gemini → Claude Haiku fallback)
  /api/grade-answer            handleGradeAnswer       AI grading (OpenAI gpt-4o-mini)
  /api/save-exam-result        handleSaveExamResult    Save exam to Supabase
  /api/generate-quest          handleGenerateQuest     Plan Quest generation (concurrency-aware)
  /api/analyze-weakness        handleAnalyzeWeakness   BKT weakness report (no AI; pure SQL + heuristics)
  /api/summarize-chat          handleSummarizeChat     Study Note generator (accepts quest_id)
  /api/award-xp                handleAwardXP           XP grant (server-validated allow-list)
  /api/quests                  handleQuestsRouter      List + sub-routes dispatcher
  /api/quests/:path*           handleQuestsRouter      Wildcard rewrite for sub-routes

────────────────────────────────────────────────────────────
QUEST SUB-ROUTES (handled by handleQuestsRouter)
────────────────────────────────────────────────────────────

  GET  /api/quests                       List active quests for caller's student
  GET  /api/quests/:id                   Fetch quest + HUD + diagnosis + day_unlock_status
  POST /api/quests/:id/advance-step      Advance, award XP, evaluate badges
  POST /api/quests/:id/day3-outcome      Branch on poor Day 3 (redo/slight/no_improvement)
  POST /api/quests/:id/abandon           Close active quest, free eligibility slot
  POST /api/quests/quiz-batch            Fetch deterministic question set for a quest step

────────────────────────────────────────────────────────────
AI MODEL ROUTING (current — actual handlers.js state)
────────────────────────────────────────────────────────────

Per direct inspection of lib/api/handlers.js as of 2026-04-27:

  Endpoint                    | Provider          | Model
  ────────────────────────────────────────────────────────────────────
  /api/chat (Miss Wena)       | Gemini            | gemini-3-flash-preview
  /api/summarize-chat         | Gemini            | gemini-3-flash-preview
  /api/grade-answer           | OpenAI ✅          | gpt-4o-mini (live)
  /api/generate-question      | OpenAI ✅          | o4-mini (live)
  /api/generate (bulk)        | Anthropic         | claude-3-5-sonnet-20241022
  /api/generate-exam          | Gemini → Claude   | Gemini primary; claude-haiku-4-5-20251001 fallback
  /api/generate-quest (narrative) | Gemini       | gemini-3-flash-preview
  /api/analyze-weakness       | (no AI)           | Pure SQL + BKT heuristics

  Helper functions in lib/api/handlers.js:
    callGemini(prompt, opts)              → gemini-3-flash-preview
    callClaudeRaw(systemPrompt, userPrompt, opts) → claude-3-5-sonnet-20241022 default
    OpenAI client `openai` instantiated at top of file; called via
    direct fetch in handleGradeAnswer and via openai.chat.completions
    in handleGenerateQuestion.

  PENDING (Workstream B — combined handoff):
    Introduce AI_ROUTING config object + callAI(task, opts) wrapper.
    Each task ('chat' | 'summarize' | 'grade_open' | 'question_gen' |
    'exam_gen' | 'analyze' | 'quest_narrative') reads provider + model
    from env vars. Default targets:
      chat            → OpenAI gpt-4o-mini (migrate from Gemini)
      summarize       → OpenAI gpt-4o-mini (migrate from Gemini)
      grade_open      → OpenAI gpt-4o-mini (already live; just normalised)
      question_gen    → OpenAI o4-mini (already live; just normalised)
      exam_gen        → OpenAI gpt-4o-mini (migrate primary from Gemini)
      quest_narrative → OpenAI gpt-4o-mini (migrate from Gemini)
      analyze         → no migration (no AI used)
    Bulk question gen via /api/generate stays on Anthropic Claude Sonnet.
    To swap providers in future: change env vars in Vercel — no code change.

────────────────────────────────────────────────────────────
BKT WEAKNESS ANALYSIS — COGNITIVE SKILLS → MOE AOs
────────────────────────────────────────────────────────────

handleAnalyzeWeakness (lib/api/handlers.js) maps each
question_attempts.cognitive_skill to MOE Assessment Objectives:

  AO1 (Knowledge & Understanding) — weight 1.0×:
    'Factual Recall'
    'Conceptual Understanding'
  AO2 (Application) — weight 1.0×:
    'Routine Application'
  AO3 (Synthesis, Reasoning, Evaluation) — weight 1.5× (HOTS):
    'Non-Routine / Heuristics'
    'Inferential Reasoning'
    'Synthesis & Evaluation'

BKT mastery score per topic = correctWeight ÷ totalWeight, requiring
≥3 weighted attempts before a topic is eligible to be flagged as the
weakest. Root-cause topic resolution then walks SYLLABUS_DEPENDENCIES
(in lib/api/quest-pedagogy.js) to surface a prerequisite topic if its
mastery is below 0.6 — so a Fractions weakness can be diagnosed as a
Decimals foundation gap.

The FAQ page (public/pages/faq.html) explains this mapping in plain
language to parents. Source of truth for the AO1/AO2/AO3 mapping is
this section + handleAnalyzeWeakness — keep them in sync.

═══════════════════════════════════════════════════════════════
SUPABASE DATABASE SCHEMA — RLS ENABLED ON ALL TABLES
═══════════════════════════════════════════════════════════════

RLS PATTERN FOR STUDENT DATA (always use this — not auth.uid() = student_id):
  student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())

────────────────────────────────────────────────────────────
CORE TABLES
────────────────────────────────────────────────────────────

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

TABLE: students
  id               uuid PK
  parent_id        uuid FK → profiles.id
  name             text
  level            text   e.g. 'Primary 4'
  selected_subject text
  photo_url        text   (Supabase Storage, avatars bucket)
  created_at       timestamptz

TABLE: subscriptions
  id                       uuid PK
  profile_id               uuid FK → profiles.id
  stripe_subscription_id   text UNIQUE  (constraint added by 009_subscriptions_unique.sql)
  stripe_price_id          text
  plan_name                text
  status                   text  'active'|'past_due'|'cancelled'
  current_period_start     timestamptz
  current_period_end       timestamptz
  created_at               timestamptz

TABLE: daily_usage
  id                   uuid PK
  student_id           uuid FK → students.id
  date                 date
  questions_attempted  int
  ai_tutor_messages    int
  UNIQUE(student_id, date)

────────────────────────────────────────────────────────────
PRACTICE / ASSESSMENT TABLES
────────────────────────────────────────────────────────────

TABLE: quiz_attempts
  id, student_id, subject, level, topic, difficulty, score,
  total_questions, time_taken_seconds, completed_at

TABLE: question_attempts
  id, quiz_attempt_id, student_id, question_text (NOT NULL),
  topic (NOT NULL, fallback 'Mixed'), difficulty (NOT NULL, fallback 'standard'),
  correct (NOT NULL), answer_chosen (NOT NULL, fallback '(no answer)'),
  correct_answer (NOT NULL, fallback 'See model solution'),
  cognitive_skill (NOT NULL — see BKT section above for AO mapping),
  created_at

  NOT-NULL safety pattern (preserve in all writes — quiz.js commit
  602225fc 2026-04-26 fixed previous breakages):
    String(value || fallback).slice(0, maxLen) || 'final-fallback'

TABLE: exam_results
  id, student_id, subject, level, exam_type, exam_id, score,
  total_marks, time_taken, questions_attempted, completed_at
  exam_type values: 'WA1'|'WA2'|'WA3'|'EOY'|'PRELIM'|'PSLE'|'PRACTICE'|'QUIZ'
  NOTE: SA1 is abolished (MOE 2023). Do not reference SA1 anywhere.

TABLE: question_bank  (PRIMARY CONTENT STORE)
  id, seed_id, is_ai_cloned,
  subject ('Mathematics'|'Science'|'English'),
  level ('Primary 1'..'Secondary 4'),
  topic, sub_topic,
  difficulty ('Foundation'|'Standard'|'Advanced'|'HOTS'),
  type ('mcq'|'short_ans'|'word_problem'|'open_ended'|'cloze'|'editing'|'comprehension'),
  marks, question_text, options (jsonb), correct_answer (letter "A"–"D"),
  wrong_explanations (jsonb), worked_solution, parts (jsonb),
  keywords (text[]), model_answer, passage, blanks (jsonb),
  passage_lines (jsonb), examiner_note, cognitive_skill,
  progressive_hints (jsonb), image_url, visual_payload (jsonb),
  instructions, flag_review (bool), accept_also, created_at

  Cloze sub_topic mapping:
    Grammar Cloze       → topic='Cloze',  sub_topic='Grammar'
    Vocabulary Cloze    → topic='Cloze',  sub_topic='Vocabulary'
    Comprehension Cloze → topic='Cloze',  sub_topic='Comprehension'

TABLE: study_notes  (Miss Wena Backpack)
  id, student_id, subject, topic, title, content_html (HTML), is_read,
  quest_id (FK → remedial_quests.id, nullable — set when note auto-saved
  from a Day 2 Socratic session), created_at

────────────────────────────────────────────────────────────
PLAN QUEST + GAMIFICATION TABLES
────────────────────────────────────────────────────────────

TABLE: remedial_quests  (extended for Phase 3)
  id                  uuid PK
  student_id          uuid FK → students.id
  subject             text  ('mathematics'|'science'|'english', lowercase)
  level               text
  topic               text
  trigger_score       numeric
  trigger_attempt_id  uuid
  quest_title         text
  steps               jsonb  -- 3-element array with rich config (see below)
  current_step        int    -- 0-indexed (0=Day 1)
  status              text   -- 'active' | 'completed' | 'abandoned'

  -- Added by 018_quest_pedagogy.sql:
  day_completed_at    jsonb NOT NULL DEFAULT '{}'
                              -- {"0":"2026-04-26T14:30:00+08:00", "1":"..."}
  day1_wrong_attempts jsonb NOT NULL DEFAULT '[]'
                              -- captured by quiz.js on Day 1 submit;
                              -- read by /api/chat in Socratic Quest mode
  day3_score          numeric(5,2)
  day3_outcome        text   -- 'mastered'|'slight_improvement'|'no_improvement'|'redo'|NULL
  parent_quest_id     uuid REFERENCES remedial_quests(id)
                              -- set when this quest was spawned via Day 3 redo
  abandoned_at        timestamptz
  created_at          timestamptz
  updated_at          timestamptz

  steps jsonb shape (per step):
    {
      day, type ('quiz'|'tutor'),
      title, description, estimated_minutes, action_url,
      config: {
        question_count, difficulty_curve ('ramping'|'mixed'|'mastery'),
        difficulty_bands [], topic, transfer_topics [] (Day 3 only),
        scaffold_mode ('socratic') (Day 2 only), min_messages,
        diagnostic_carryover, auto_save_note, min_passing_score
      }
    }

TABLE: quest_eligibility  (NEW — concurrency enforcer, 018)
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE
  subject    text NOT NULL CHECK (subject IN ('mathematics','science','english'))
  quest_id   uuid NOT NULL REFERENCES remedial_quests(id) ON DELETE CASCADE
  PRIMARY KEY (student_id, subject)

  Enforces "max 1 active quest per (student, subject)". Inserting a 2nd
  row for same pair fails with PG 23505. Application code catches and
  returns HTTP 409 with existing_quest_id. UI greys out the Generate
  Quest button when the slot is taken.

TABLE: mastery_levels  (retroactive — 015)
  student_id uuid FK → students.id
  subject, topic, sub_topic
  probability numeric (0.0–1.0)
  attempts int
  updated_at timestamptz

TABLE: mastery_levels_snapshots  (016 — supports mastery_gain XP)
  id uuid PK
  student_id uuid FK
  snapshot_date date NOT NULL
  subject, topic, sub_topic
  probability numeric NOT NULL
  al_band int NOT NULL  -- 1..8 cached for fast diff
  created_at timestamptz
  UNIQUE (student_id, snapshot_date, subject, topic, sub_topic)

  Daily Vercel cron writes snapshots; XP cron diffs latest two snapshots
  and awards mastery_gain XP if al_band improved. Cron registration is
  PENDING (Phase 3 commit 6).

TABLE: student_xp  (016)
  student_id uuid PK FK → students.id
  total_xp int NOT NULL DEFAULT 0
  current_level int NOT NULL DEFAULT 1
  xp_in_level int NOT NULL DEFAULT 0
  updated_at timestamptz

TABLE: xp_events  (016 — append-only ledger)
  id uuid PK
  student_id uuid FK
  event_type text  -- 'quiz_complete'|'quest_step_complete'|'quest_complete'|
                   --   'exam_complete'|'mastery_gain'|'login_streak'|'badge_earned'
  xp_awarded int NOT NULL
  metadata jsonb
  created_at timestamptz

  Idempotency: handleAwardXP dedups on (student_id, event_type, event_id)
  where event_id is supplied via metadata. Repeat calls return cached result.

TABLE: student_streaks  (016)
  student_id uuid PK FK → students.id
  current_days, longest_days int
  last_active date
  shield_count int  (max 3)
  updated_at timestamptz

TABLE: badge_definitions  (016 + 017 + 019)
  id text PK
  name, description, icon_url, theme, rarity, xp_reward, sort_order
  is_secret boolean
  RLS: SELECT public, no INSERT/UPDATE/DELETE for clients

  33 badges total: 12 common + 8 rare + 5 epic + 1 legendary + 4 secret
  + 4 pedagogy (socratic_scholar, mastery_first_try, redo_warrior,
  honest_compass). 019_seed_pedagogy_badges.sql is PENDING.

TABLE: student_badges  (016)
  id uuid PK
  student_id uuid FK
  badge_id text FK → badge_definitions.id
  earned_at timestamptz
  context jsonb
  UNIQUE (student_id, badge_id)

TABLE: avatar_rerolls  (016 — audit + cost ceiling, deferred to post-launch)
  id, student_id, parent_id (denormalized), rerolled_at, trigger,
  old_avatar_url, cost_usd, cost_recovered (bool)

  Avatar pipeline is DEFERRED to post-launch per LAUNCH_PLAN_v1.md.
  Tables exist (RLS-enabled) for forward compatibility but no handlers
  call them yet.

────────────────────────────────────────────────────────────
DAY-GATING LOGIC (server-side, computed on every fetch)
────────────────────────────────────────────────────────────

For each step index 0..2 of an active quest:
  step 0 unlocked iff true (always)
  step N+1 unlocked iff:
    (a) day_completed_at[N] exists in jsonb AND
    (b) NOW() (in Asia/Singapore) ≥ midnight SGT of (day_completed_at[N] + 1 day)

  Use Intl.DateTimeFormat with timeZone:'Asia/Singapore' for all
  midnight calculations. Never use raw new Date() for SGT logic.

  Returned in GET /api/quests/:id as:
    day_unlock_status: {
      "0": { unlocked, completed, unlocks_at },
      "1": { ... },
      "2": { ... }
    }

═══════════════════════════════════════════════════════════════
PROJECT STRUCTURE (current — as of Phase 3 Commit 5)
═══════════════════════════════════════════════════════════════

D:\Git\Superholic-Lab\
├── CLAUDE.md                ← Coding rules + 4 Pillars + dev workflow (read first)
├── ARCHITECTURE.md          ← This file
├── AGENTS.md                ← 7 specialist subagent definitions
├── INDEX.md                 ← File/route directory
├── PROJECT_DASHBOARD.md     ← Build status, ECC health, known issues
├── STYLEGUIDE.md            ← Visual design standards (icons, bottom nav)
├── Master_Question_Template.md  ← PSLE question type schemas (7 types)
├── .env                     ← All secrets (gitignored)
├── .mcp.json                ← MCP server config (gitignored)
├── vercel.json              ← 24 rewrites + security headers + 1 cron
├── package.json             ← Node 24.x, ESM, 3 prod deps
├── next.config.mjs          ← Next.js config (for /quest route)
├── tsconfig.json            ← TypeScript config (for src/)
├── public/                  ← STATIC ASSETS + VANILLA APP PAGES
│   ├── index.html             ← Marketing homepage
│   ├── 404.html
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── pages/                 ← Vanilla HTML app pages
│   │   ├── account.html
│   │   ├── admin.html
│   │   ├── confirm-email.html
│   │   ├── contact.html
│   │   ├── dashboard.html
│   │   ├── exam.html
│   │   ├── faq.html             ← (PENDING — built in Workstream B handoff)
│   │   ├── login.html
│   │   ├── pricing.html
│   │   ├── privacy.html
│   │   ├── progress.html
│   │   ├── quiz.html
│   │   ├── refund-request.html
│   │   ├── setup.html
│   │   ├── signup.html
│   │   ├── subject-english.html
│   │   ├── subject-mathematics.html
│   │   ├── subject-science.html
│   │   ├── subjects.html
│   │   ├── terms.html
│   │   ├── tutor.html
│   │   └── update-password.html
│   ├── css/
│   │   └── style.css           ← Single stylesheet (v3.0)
│   ├── js/
│   │   ├── app-shell.js
│   │   ├── auth.js
│   │   ├── bottom-nav.js       ← <global-bottom-nav> 5-item nav
│   │   ├── diagram-library.js  ← Visual payload render
│   │   ├── exam-generator.js   ← Pull questions from Supabase to generate quiz
│   │   ├── exam-renderer.js    ← Generate printable version of practice paper
│   │   ├── exam-templates.js   ← Question set for WA, EOY and PSLE
│   │   ├── exam.js             ← Exam runtime
│   │   ├── footer.js           ← <global-footer> (FAQ link added in Workstream B)
│   │   ├── header.js           ← <global-header>
│   │   ├── hud-strip.js        ← Vanilla HUD partial
│   │   ├── icons.js            ← 13-icon set, vanilla side
│   │   ├── progress.js         ← renderQuestTray()
│   │   ├── qa-panel.js
│   │   ├── quiz.js             ← from_quest detection + advance-step
│   │   ├── supabase-client.js
│   │   ├── supabase.js         ← Legacy alias (do not modify)
│   │   └── tutor.js            ← from_quest detection + Socratic mode
│   └── assets/
│       ├── favicon.ico
│       ├── logo.svg
│       └── images/
│           └── miss_wena.png
├── src/                     ← NEXT.JS APP (currently /quest only)
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── quest/
│   │       ├── page.tsx        ← Server component, auth + SSR fetch
│   │       ├── QuestClient.tsx ← Main orchestrator (~1000 lines)
│   │       └── components/
│   │           ├── BadgeUnlockModal.tsx
│   │           ├── Day3OutcomeModal.tsx     ← The 3-way exit modal
│   │           ├── EmptyState.tsx
│   │           ├── LevelUpModal.tsx
│   │           ├── QuestPicker.tsx           ← Tabs when 2-3 quests
│   │           └── ReturningCelebration.tsx
│   └── components/
│       ├── DashboardShowcase.tsx
│       ├── PlanQuestSection.tsx
│       ├── ScrollStory.tsx
│       ├── SyllabusCylinder.tsx
│       ├── icons/
│       │   └── index.tsx       ← 13-icon set, React side
│       └── ui/
│           └── cosmos-orbit.tsx
├── api/
│   ├── index.js               ← ONLY serverless entry point (router)
│   ├── generate-quest.js      ← Legacy alias (kept for compatibility)
│   ├── summarize-chat.js      ← Legacy alias (kept for compatibility)
│   └── cron/
│       ├── fill-bank.js          ← Question bank auto-fill (legacy)
│       └── snapshot-mastery.js   ← (PENDING — built in Workstream B handoff)
├── lib/
│   └── api/
│       ├── handlers.js         ← ALL handler logic (24 routes)
│       ├── badge-engine.js     ← evaluateBadges, evaluateLevelUp,
│       │                         xpToLevel, levelToRank
│       ├── quest-pedagogy.js   ← buildQuestSteps, SYLLABUS_DEPENDENCIES
│       └── prompts/
│           ├── mcq.js
│           ├── short-ans.js
│           ├── word-problem.js
│           ├── open-ended.js
│           ├── cloze.js
│           ├── editing.js
│           └── socratic-quest.js  ← buildSocraticQuestPrompt
├── supabase/                  ← SQL migrations (run manually)
│   ├── 002_question_types.sql
│   ├── 003_exam_results.sql
│   ├── 004_profiles_email.sql
│   ├── 006_study_notes.sql
│   ├── 007_photo_upload.sql
│   ├── 008_fix_profile_trigger.sql
│   ├── 009_subscriptions_unique.sql
│   ├── 010_referrals.sql
│   ├── 011_profile_extensions.sql
│   ├── 012_contact_messages.sql
│   ├── 012_contact_submissions.sql
│   ├── 013_question_bank_qa.sql
│   ├── 015_mastery_levels.sql       (APPLIED 2026-04-25)
│   ├── 016_quest_gamification.sql   (APPLIED 2026-04-25)
│   ├── 017_seed_badges.sql          (APPLIED 2026-04-25)
│   └── 018_quest_pedagogy.sql       (APPLIED — Phase 3 Commit 1)
│   (PENDING: 019_seed_pedagogy_badges.sql — Workstream B handoff)
├── docs/
│   ├── QUEST_PAGE_SPEC.md      ← v2.0 LOCKED — quest authority
│   ├── LAUNCH_PLAN_v1.md
│   ├── PROJECT_DASHBOARD.md    ← (mirror of root dashboard)
│   ├── CONTENT_TIMELINE.md
│   ├── design-audit.md
│   └── handoff/
│       ├── README.md
│       ├── QUEST_BACKEND_HANDOFF.md
│       ├── QUEST_FRONTEND_HANDOFF.md
│       └── AI_PROVIDER_AND_COMMIT6_HANDOFF.md  ← Workstream B (NEW)
├── hooks/
│   └── hooks.json             ← Secret detection + CSS enforcement
└── .claude/
    ├── rules/                 ← 13 always-active rule files
    ├── commands/              ← 8 slash commands
    ├── skills/                ← 6 domain skills
    ├── agents/                ← 5 agent prompt files (note:
    │                           AGENTS.md is the canonical registry)
    └── settings.local.json    ← MCP permissions (gitignored)

═══════════════════════════════════════════════════════════════
BUILD STATUS (as of 2026-04-27)
═══════════════════════════════════════════════════════════════

COMPLETED
  [x] CSS design system v3.0 (Rose & Sage, Bebas Neue, CSS variables)
  [x] Marketing homepage (public/index.html)
  [x] Subject landing pages (maths, science, english)
  [x] 404 page
  [x] Auth: email/password + Google OAuth
  [x] Auth pages: login, signup, confirm-email, update-password
  [x] Signup flow: 7-day trial, no credit card, subscription_tier='trial'
  [x] Profile trigger: handle_new_user() + 008 migration applied
  [x] guardPage() + enforcePaywall() in auth.js
  [x] Daily usage limits (5 questions/day on trial)
  [x] Quiz engine: all 6 PSLE question types (quiz.js + quiz.html)
  [x] Question bank: migrated to Supabase question_bank table
  [x] Miss Wena AI tutor: Gemini Flash, 3-Strike scaffolding
  [x] Study Notes Backpack: summarize-chat → study_notes (with quest_id)
  [x] Progress tracker (progress.html + progress.js)
  [x] AI weakness analysis (/api/analyze-weakness)
  [x] Exam generator: WA/EOY/PSLE templates (exam-templates.js v4.0)
  [x] AI grading for open_ended + word_problem (/api/grade-answer, OpenAI)
  [x] AI on-demand question gen (/api/generate-question, OpenAI)
  [x] Stripe: trial-first flow, checkout, webhook, profiles.subscription_tier
  [x] Stripe Customer Portal (/api/portal via account.html)
  [x] Parent Account Portal (account.html)
  [x] Master Admin Panel (admin.html: users, plans, students, role-gated)
  [x] Dashboard: checkout polling, trial banner
  [x] Header: Manage Billing + Admin Panel links (auth-aware)
  [x] Student photo upload (Supabase Storage, avatars bucket)
  [x] ECC framework (rules, commands, agents, hooks, skills)
  [x] Single gateway API (api/index.js → lib/api/handlers.js, 24 routes)
  [x] vercel.json: 24 rewrites + security headers + 1 cron
  [x] subscriptions table: UNIQUE constraint on stripe_subscription_id (009)
  [x] Subject-specific pages (subject-mathematics/science/english.html)

  --- Phase 3 Plan Quest (commits 1-5 done; 6 pending) ---
  [x] Migration 015 (mastery_levels retroactive)
  [x] Migration 016 (XP, streaks, badges, avatar audit, mastery snapshots)
  [x] Migration 017 (badge seeds, 29 badges)
  [x] Migration 018 (quest_eligibility + remedial_quests pedagogy fields)
  [x] /quest route (Next.js): page.tsx, QuestClient.tsx, 6 components
  [x] Day-gating server-side (Asia/Singapore midnight)
  [x] handleQuestsRouter (list, fetch, advance-step, day3-outcome,
       abandon, quiz-batch)
  [x] handleAwardXP with allow-list + idempotency + anti-cheat
  [x] badge-engine.js (evaluateBadges, level/rank calculations)
  [x] quest-pedagogy.js (buildQuestSteps + SYLLABUS_DEPENDENCIES)
  [x] socratic-quest.js prompt builder
  [x] /api/chat Socratic Quest mode (?from_quest= overlay)
  [x] /api/summarize-chat accepts quest_id → study_notes.quest_id
  [x] quiz.js: from_quest detection, quest-batch fetch, advance-step
       on submit, auto-modal on score ≤70% with eligibility check
  [x] tutor.js: from_quest detection, Socratic mode banner, message-count
       gated "Mark Day 2 Complete", auto-Study-Note on completion
  [x] progress.html: renderQuestTray (replaces renderQuestMap),
       eligibility-aware Generate Quest buttons, HUD strip slot
  [x] hud-strip.js (vanilla HUD: avatar, level, XP, streak, shields)
  [x] bottom-nav.js (canonical 5-item layout, setQuestActive API)
  [x] icons.js + src/components/icons/index.tsx (13-icon set)

PENDING / IN PROGRESS
  Currently: E2E testing the Lily Tan flow (docs/QUEST_PAGE_SPEC.md §18)

  [ ] Workstream B handoff (combined: AI Provider Migration + Phase 3 Commit 6):
      - lib/api/handlers.js: AI_ROUTING config + callAI() wrapper
      - Migrate /api/chat, /api/summarize-chat, /api/generate-exam (primary),
        /api/generate-quest narrative to OpenAI gpt-4o-mini
      - Normalise existing OpenAI calls (handleGradeAnswer, handleGenerateQuestion)
        through the same callAI() wrapper
      - api/cron/snapshot-mastery.js (daily 03:00 SGT)
      - vercel.json cron registration
      - public/pages/faq.html (consolidated 9-section FAQ with search pill)
      - public/js/footer.js — add FAQ dropdown link
      - supabase/019_seed_pedagogy_badges.sql (4 pedagogy badges)
      - docs/PARENT_FAQ.md (extracted from spec §16, plus other 3 pillars)
      - docs/GAMIFICATION_RULES.md (extracted from spec §12)
      - Add OPENAI_API_KEY (already present), AI_*_PROVIDER + AI_*_MODEL env vars
  [ ] Analytics: Plausible script on ALL pages (currently pricing.html only)
  [ ] SEO: meta descriptions, Open Graph, JSON-LD on all pages
  [ ] Stripe: switch from test mode to live mode
  [ ] Question bank: systematic expansion (P5 maths/science most complete;
       P1, P3, P6 mostly empty). See data/questions/MANIFEST.md.
  [ ] Pre-launch cleanup of legacy files (see PROJECT_DASHBOARD.md
       Known Issues for the list)

═══════════════════════════════════════════════════════════════
HOW TO START A CLAUDE CODE SESSION
═══════════════════════════════════════════════════════════════

Open Claude Code in D:\Git\Superholic-Lab.
Rules and hooks load automatically from .claude/ and hooks/.

First prompt for any new session:
  "Read CLAUDE.md and ARCHITECTURE.md, then [your task]."

For Plan Quest work, also read docs/QUEST_PAGE_SPEC.md v2.0.

MCP servers available in Claude Code:
  filesystem   D:\Git\Superholic-Lab + C:\SLabDrive
  github       feynman82/Superholic-Lab
  supabase     project: rlmqsbxevuutugtyysjr
  Chrome MCP   for visual QA after deploys

═══════════════════════════════════════════════════════════════
END OF ARCHITECTURE BRIEFING v4.1
═══════════════════════════════════════════════════════════════
