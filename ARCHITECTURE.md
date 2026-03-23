# SUPERHOLIC LAB — ARCHITECTURE BRIEFING
# Version 1.0 | Generated for Claude Desktop → Claude Code handoff
# Date: March 2026
# Purpose: Brief Claude Code on the complete current state before the initial build

═══════════════════════════════════════════════════════════════
WHAT THIS FILE IS
═══════════════════════════════════════════════════════════════

This briefing document tells Claude Code everything it needs to
know about the Superholic Lab infrastructure, credentials layout,
MCP connections, folder structure, and the exact build plan.

Claude Code must read this file at the start of every session
before writing any code or making any decisions.

Location of this file:
  D:\Git\Superholic-Lab\ARCHITECTURE.md

═══════════════════════════════════════════════════════════════
THE PRODUCT — WHAT WE ARE BUILDING
═══════════════════════════════════════════════════════════════

Platform name:    Superholic Lab
Tagline:          "Learn like a champion. Think like a winner."
Live domain:      https://www.superholiclab.com
GitHub repo:      https://github.com/feynman82/Superholic-Lab
Local code path:  D:\Git\Superholic-Lab

What it is:
  Singapore's AI-powered learning platform for Primary 1 to
  Secondary 4 students. Parents pay for monthly subscriptions.
  Children practice MOE-aligned questions with full worked
  solutions and wrong-answer explanations for every MCQ option.
  An AI tutor answers questions in real time.

Target market:
  Singapore parents of primary school children (P1-P6 focus)
  High-anxiety exam culture — PSLE is the primary pain point
  Parents compare platforms actively on KiasuParents forum

Key differentiator:
  Wrong-answer explanations for EVERY MCQ option — not just
  marking right or wrong, but explaining the specific mistake
  that leads a student to each wrong answer. No other platform
  in Singapore does this systematically.

═══════════════════════════════════════════════════════════════
SUBSCRIPTION TIERS — 3 PLANS, NO FREE TIER
═══════════════════════════════════════════════════════════════

All plans include a 7-day free trial. No credit card required
to start trial. Cancel any time.

  Tier 1: Single Subject
    Price:    SGD 9.99/month
    Access:   1 subject chosen at signup, 1 child profile
    Features: Unlimited questions, worked solutions,
              wrong-answer explanations, mobile-friendly
    Stripe:   STRIPE_SINGLE_SUBJECT_PRICE_ID in .env

  Tier 2: All Subjects (FEATURED — most popular)
    Price:    SGD 19.99/month
    Access:   All subjects (Maths, Science, English), 1 child
    Features: Everything in Single Subject + mock exam generator
    Stripe:   STRIPE_ALL_SUBJECTS_PRICE_ID in .env

  Tier 3: Family
    Price:    SGD 29.99/month
    Access:   All subjects, up to 3 child profiles
    Features: Everything in All Subjects + parent dashboard
              showing all 3 children, priority support
    Stripe:   STRIPE_FAMILY_PRICE_ID in .env

Annual pricing: 17% discount (approximately 2 months free)

═══════════════════════════════════════════════════════════════
CONFIRMED INFRASTRUCTURE — ALL VERIFIED WORKING
═══════════════════════════════════════════════════════════════

STATUS KEY:
  ✓ CONFIRMED — tested and verified working
  ⚠ CONFIGURED — set up but not yet used in production code
  ✗ NOT STARTED — needed but not yet done

  ✓ GitHub
      Repo:     feynman82/Superholic-Lab
      Branch:   main (auto-deploys to Vercel on push)
      Local:    D:\Git\Superholic-Lab
      MCP:      Connected and verified in Claude Desktop

  ✓ Vercel
      Project:  Superholic-Lab
      URL:      https://superholic-lab.vercel.app (staging)
      Domain:   https://www.superholiclab.com (production)
      Deploy:   Auto-deploys from GitHub main branch
      Note:     Every git push to main triggers Vercel rebuild
                Live in ~60 seconds after push

  ✓ Cloudflare
      Domain:   superholiclab.com registered and active
      DNS:      CNAME www → cname.vercel-dns.com (grey cloud)
      SSL:      Managed by Vercel, active on custom domain
      Status:   www.superholiclab.com loads correctly

  ✓ Supabase
      Project:  superholic-lab
      Region:   Southeast Asia (Singapore)
      URL:      https://rlmqsbxevuutugtyysjr.supabase.co
      MCP:      Connected via --access-token (v0.7.0 confirmed)
      RLS:      ENABLED on all 6 tables
      Auth:     Email/password enabled
                Redirect URLs set for www.superholiclab.com

  ✓ Stripe
      Mode:     TEST MODE (switch to live at launch)
      Products: All 3 tiers created with SGD pricing
      Price IDs: Stored in .env file
      Status:   Account active, not yet integrated in code

  ✓ Anthropic API
      Model:    claude-sonnet-4-6
      Key:      Stored in .env as ANTHROPIC_API_KEY
      Use:      AI tutor chat + question generation API

  ✓ MCP Servers (Claude Desktop)
      supabase:   Connected — v0.7.0, uses --access-token
      github:     Connected — v0.6.2, verified working
      filesystem: Connected — D:\Git\Superholic-Lab
                             C:\SLabDrive (Google Drive alias)

═══════════════════════════════════════════════════════════════
SUPABASE DATABASE SCHEMA — 6 TABLES, ALL WITH RLS ENABLED
═══════════════════════════════════════════════════════════════

All tables are in the public schema.
Row Level Security is ENABLED on all 6 tables.
RLS policies ensure users only see their own data.

TABLE 1: profiles
  Purpose: Extends auth.users with platform-specific data
  Columns:
    id                uuid  PK references auth.users(id)
    full_name         text
    role              text  default 'parent'
    subscription_tier text  default 'trial'
                            values: trial | single_subject |
                                    all_subjects | family
    stripe_customer_id text null
    trial_started_at  timestamptz null
    trial_ends_at     timestamptz null (7 days after signup)
    max_children      integer default 1
    created_at        timestamptz default now()
    updated_at        timestamptz default now()
  Trigger: handle_new_user() creates profile on auth signup
  Trigger: handle_updated_at() auto-updates updated_at

TABLE 2: students
  Purpose: Child profiles linked to parent account
  Columns:
    id               uuid  PK default gen_random_uuid()
    parent_id        uuid  references profiles(id)
    name             text  not null
    level            text  not null (e.g. 'Primary 4')
    selected_subject text  null (only for single_subject tier)
    created_at       timestamptz default now()

TABLE 3: quiz_attempts
  Purpose: Records each completed quiz session
  Columns:
    id                  uuid PK
    student_id          uuid references students(id)
    subject             text (Mathematics|Science|English)
    level               text (Primary 1 through Secondary 4)
    topic               text (e.g. Fractions, Angles)
    difficulty          text (Foundation|Standard|Advanced|HOTS)
    score               integer
    total_questions     integer
    time_taken_seconds  integer null
    completed_at        timestamptz default now()

TABLE 4: question_attempts
  Purpose: Individual question tracking within a quiz
  Columns:
    id               uuid PK
    quiz_attempt_id  uuid references quiz_attempts(id)
    student_id       uuid references students(id)
    question_text    text
    topic            text
    difficulty       text
    correct          boolean
    answer_chosen    text (A|B|C|D)
    correct_answer   text (A|B|C|D)
    created_at       timestamptz default now()

TABLE 5: subscriptions
  Purpose: Tracks Stripe subscription status
  Columns:
    id                      uuid PK
    profile_id              uuid references profiles(id)
    stripe_subscription_id  text not null
    stripe_price_id         text not null
    plan_name               text (single_subject|all_subjects|family)
    status                  text (active|cancelled|past_due|trialing)
    current_period_start    timestamptz
    current_period_end      timestamptz
    created_at              timestamptz default now()

TABLE 6: daily_usage
  Purpose: Track usage for trial limits
  Columns:
    id                  uuid PK
    student_id          uuid references students(id)
    date                date default current_date
    questions_attempted integer default 0
    ai_tutor_messages   integer default 0
    unique(student_id, date)

═══════════════════════════════════════════════════════════════
ENVIRONMENT VARIABLES — ALL SET IN .env AND VERCEL
═══════════════════════════════════════════════════════════════

Local file: D:\Git\Superholic-Lab\.env
This file is in .gitignore — NEVER commit it to GitHub.
All variables are also set in Vercel dashboard for production.

ANTHROPIC_API_KEY           = sk-ant-...
SUPABASE_URL                = https://rlmqsbxevuutugtyysjr.supabase.co
SUPABASE_ANON_KEY           = eyJ... (safe for frontend JS)
SUPABASE_SERVICE_ROLE_KEY   = eyJ... (server-side only, never expose)
STRIPE_PUBLISHABLE_KEY      = pk_test_... (safe for frontend JS)
STRIPE_SECRET_KEY           = sk_test_... (server-side only)
STRIPE_SINGLE_SUBJECT_PRICE_ID = price_...
STRIPE_ALL_SUBJECTS_PRICE_ID   = price_...
STRIPE_FAMILY_PRICE_ID         = price_...
NEXT_PUBLIC_APP_URL         = https://www.superholiclab.com

SECURITY RULES — ABSOLUTE:
  Never hardcode any of these values in code files.
  Always read from process.env or window.__ENV__.
  SUPABASE_SERVICE_ROLE_KEY and STRIPE_SECRET_KEY are
  server-side only — never include in any frontend JS file.
  The .env file must never be committed to GitHub.

═══════════════════════════════════════════════════════════════
CURRENT PROJECT FILE STRUCTURE
═══════════════════════════════════════════════════════════════

D:\Git\Superholic-Lab\
├── index.html              ← Coming soon page (to be replaced)
├── CLAUDE.md               ← Project intelligence brief
├── ARCHITECTURE.md         ← This file
├── .env                    ← All credentials (gitignored)
├── .gitignore              ← Correctly excludes .env, .mcp.json
├── .mcp.json               ← Claude Code MCP config (gitignored)
├── js/
│   └── supabase.js         ← Supabase client (needs updating)
├── quiz/
│   └── index.html          ← Week 3 practice build (to delete)
└── .claude/
    └── settings.local.json

TARGET STRUCTURE AFTER INITIAL BUILD (Week 1):
D:\Git\Superholic-Lab\
├── index.html              ← Marketing homepage
├── CLAUDE.md
├── ARCHITECTURE.md
├── .env
├── .gitignore
├── .mcp.json
├── pages/
│   ├── subjects.html       ← Subject + level selector
│   ├── quiz.html           ← Quiz engine
│   ├── tutor.html          ← AI tutor chat
│   ├── progress.html       ← Student progress
│   ├── pricing.html        ← Subscription plans
│   ├── login.html          ← Auth
│   ├── signup.html         ← Auth
│   ├── dashboard.html      ← Student dashboard
│   ├── about.html
│   ├── terms.html
│   ├── privacy.html
│   └── contact.html
├── css/
│   └── style.css           ← Complete design system
├── js/
│   ├── supabase-client.js  ← Supabase client instance
│   ├── auth.js             ← Auth functions + session management
│   ├── quiz.js             ← Quiz engine logic
│   ├── tutor.js            ← AI tutor chat logic
│   ├── progress.js         ← Progress tracking
│   └── stripe.js           ← Stripe checkout redirect
├── api/
│   ├── chat.js             ← Anthropic API serverless function
│   ├── generate.js         ← Question generation serverless fn
│   ├── checkout.js         ← Stripe checkout session creator
│   └── webhook.js          ← Stripe webhook handler
├── assets/
│   ├── favicon.ico
│   └── logo.svg
└── data/
    └── questions/          ← Question bank JSON files

═══════════════════════════════════════════════════════════════
DESIGN SYSTEM — USE EXACTLY THESE VALUES
═══════════════════════════════════════════════════════════════

Font: Plus Jakarta Sans (Google Fonts)
  Import: https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&display=swap

CSS Variables (define in css/style.css, use everywhere):
  --primary:        #4338ca    (Superholic indigo)
  --primary-light:  #eef2ff
  --primary-dark:   #3730a3
  --accent:         #f59e0b    (amber highlights)
  --success:        #10b981    (correct answers, active)
  --danger:         #ef4444    (wrong answers, errors)
  --text-primary:   #111827
  --text-secondary: #6b7280
  --bg:             #f9fafb
  --white:          #ffffff
  --border:         #e5e7eb

Difficulty badge colours:
  Foundation: background #f0fdf4, text #15803d
  Standard:   background #f0fdfa, text #0f766e
  Advanced:   background #fffbeb, text #b45309
  HOTS:       background #fff1f2, text #be123c

Button classes:
  .btn-primary   → --primary background, white text
  .btn-secondary → white background, border, --text-primary
  .btn-danger    → --danger background, white text

Card: white background, 1px border (--border), border-radius 12px

═══════════════════════════════════════════════════════════════
AI TUTOR SYSTEM PROMPTS — USE THESE EXACTLY
═══════════════════════════════════════════════════════════════

These prompts go into api/chat.js and switch based on subject.
They define the tutor's personality and pedagogical approach.

MATHEMATICS TUTOR:
  "You are a warm, encouraging Singapore Primary Mathematics
  tutor with 15 years of experience preparing students for
  PSLE. Students are aged 7-12.
  Rules you must follow:
  - Align all answers strictly to the MOE P1-P6 Mathematics
    syllabus. Never introduce content beyond the student's level.
  - When a student is stuck, guide with a question first —
    never give the answer directly on the first attempt.
  - Show step-by-step working for all solutions.
    Label each step clearly: Step 1, Step 2, etc.
  - End every explanation with: Does that make sense? Try
    the next part yourself and I will check your working.
  - If the student gets it right, celebrate specifically:
    name exactly what they did correctly."

SCIENCE TUTOR:
  "You are a patient Singapore Primary Science tutor
  specialising in PSLE preparation. Students are aged 9-12.
  Rules you must follow:
  - Align strictly to MOE Primary Science syllabus (P3-P6).
  - Use Singapore exam keyword language — students must learn
    the exact words examiners expect in marking schemes.
  - For explain questions, always use the format:
    [Observation] because [Scientific reason].
  - For hypothesis questions, use:
    If [variable] then [expected result] because [reason].
  - After explaining, give one exam tip starting with:
    In PSLE, the keyword the examiner is looking for here is..."

ENGLISH TUTOR:
  "You are a Singapore English Language tutor specialising
  in PSLE examination techniques. Students are aged 9-12.
  Rules you must follow:
  - For comprehension: teach inference skills, not just
    literal reading. Always ask what does this suggest?
  - For composition: focus on the 3-paragraph rule for PSLE.
  - For summary: teach students to identify topic sentences
    and supporting details.
  - Correct grammar errors by explaining the rule, not just
    fixing the error.
  - Use Singapore Standard English — not British or American."

GENERAL TUTOR (fallback):
  "You are a warm, encouraging Singapore school tutor.
  Students are aged 7-16. Align all answers to the MOE
  Singapore syllabus for the student's level.
  Always guide before giving answers. Show working clearly.
  Use encouraging language. Celebrate effort and correct
  thinking, not just final answers."

═══════════════════════════════════════════════════════════════
THE 4-WEEK SPRINT BUILD PLAN
═══════════════════════════════════════════════════════════════

WEEK 1 — Foundation & Homepage (Days 1-7)
Priority: Get the repo clean, build the CSS design system,
launch a proper marketing homepage.

  Task 1.1 [CC]: Clean repo
    Delete: quiz/ folder, countdown-timer/ folder, todo-list/
    Rename: .gitignore.txt → .gitignore
    Rename: CLAUDE.md.md → CLAUDE.md
    Commit: "chore: clean up repo structure"

  Task 1.2 [CC]: Scaffold full project structure
    Create all folders and placeholder files per target
    structure above. Every file needs basic HTML shell
    or JS module structure.
    Commit: "feat: scaffold project structure"

  Task 1.3 [CC]: Build CSS design system
    File: css/style.css
    Include: all CSS variables, button styles (primary/
    secondary/danger), card component, badge variants
    (foundation/standard/advanced/hots), responsive grid,
    mobile-first breakpoints, navbar, footer, form styles,
    quiz component styles, chat bubble styles.
    Font: Plus Jakarta Sans from Google Fonts.
    Commit: "feat: CSS design system"

  Task 1.4 [CC]: Build marketing homepage
    File: index.html
    Sections:
      - Navbar: logo left, Home/How It Works/Pricing links
        centre, Log In + Start Free Trial buttons right
      - Hero: headline "Your child's personal AI tutor.
        Available 24/7." with CTA buttons
      - Value prop: 3 cards (MOE Aligned, Wrong Answer
        Explanations, Available Anytime)
      - How it works: 3 steps
      - Pricing preview: 3 tiers (use exact SGD prices)
      - Social proof placeholder
      - Footer: copyright, Privacy, Terms, Contact links
    Use copy from brand document in Google Drive.
    Commit: "feat: marketing homepage"

  Task 1.5 [CC]: Build subject selection page
    File: pages/subjects.html
    Grid of 3 subject cards: Mathematics, Science, English
    Each card expands to show level selector (P1-P6 buttons)
    Clicking level navigates to:
    quiz.html?subject=mathematics&level=primary-4
    Mobile-friendly.
    Commit: "feat: subject selection page"

  Task 1.6 [CC]: Push and deploy
    git add . && git commit -m "feat: week 1 foundation"
    && git push origin main
    Vercel auto-deploys within 60 seconds.

WEEK 2 — Quiz Engine & AI Tutor (Days 8-14)
Priority: The core product. Students practice questions and
get AI explanations.

  Task 2.1 [CC]: Supabase JS client setup
    File: js/supabase-client.js
    Initialize Supabase with SUPABASE_URL and SUPABASE_ANON_KEY
    Export single client instance used by all other JS files.

  Task 2.2 [CC]: Auth module
    File: js/auth.js
    Functions: signUp, signIn, signOut, getCurrentUser,
    getProfile, isTrialActive, canAccessSubject,
    checkDailyUsage, incrementDailyUsage
    Check auth state on every page load.
    Redirect unauthenticated users to pages/login.html

  Task 2.3 [CC]: Auth pages
    Files: pages/login.html, pages/signup.html
    Login: email + password form, forgot password link
    Signup: full name, email, password, confirm password,
    terms checkbox. On success redirect to pages/setup.html

  Task 2.4 [CC]: Quiz engine
    Files: pages/quiz.html + js/quiz.js
    Flow: read URL params → load 10 questions from hardcoded
    bank initially → show question card → on answer show
    correct/wrong highlight + worked solution +
    wrong-answer explanation for chosen option → Next button
    → score screen at end → save to quiz_attempts + 
    question_attempts tables in Supabase.
    Hardcode 5 P4 Maths questions to start (fractions topic).
    Check daily_usage — show upgrade prompt if trial limit hit.

  Task 2.5 [CC]: AI tutor chat
    Files: pages/tutor.html + js/tutor.js + api/chat.js
    Frontend: chat bubble UI, subject selector, input field
    api/chat.js: Vercel serverless function that calls
    Anthropic API with subject-specific system prompt.
    Track ai_tutor_messages in daily_usage table.
    Commit: "feat: quiz engine and AI tutor"

WEEK 3 — Auth, Payments & Progress (Days 15-21)
Priority: Make it a real business with login, subscriptions,
and progress tracking.

  Task 3.1 [CC]: Progress tracker
    Files: pages/progress.html + js/progress.js
    Query quiz_attempts and question_attempts for current
    student. Show: accuracy by subject, topic breakdown,
    streak counter, total questions answered.
    Simple bar charts (CSS-only preferred, or Chart.js CDN).

  Task 3.2 [CC]: Stripe integration
    Files: api/checkout.js, api/webhook.js
    checkout.js: creates Stripe Checkout Session, redirects
    webhook.js: handles checkout.session.completed,
    customer.subscription.updated, customer.subscription.deleted
    On successful payment: update subscriptions table in
    Supabase, update subscription_tier in profiles table.

  Task 3.3 [CC]: Pricing page
    File: pages/pricing.html
    3 tiers with exact SGD prices from brand document.
    All Subjects card is featured (highlighted border).
    Subscribe buttons call checkout.js with correct price IDs.
    Show trial status if user is in trial period.
    "7-day free trial · No credit card · Cancel anytime"

  Task 3.4 [CC]: Paywall logic
    In js/auth.js: add paywall enforcement.
    Trial users: limited questions per day, no exam simulator.
    Paid users: unlimited everything based on their tier.
    Single Subject users: locked to their chosen subject.
    When limit hit: show upgrade modal → link to pricing page.
    Commit: "feat: auth, payments, progress tracking"

WEEK 4 — Polish, SEO & Launch (Days 22-28)
Priority: Make it production-ready and launch to real users.

  Task 4.1 [CC]: Loading states and error handling
    Add loading skeletons to quiz, tutor, progress pages.
    Add try/catch with user-friendly error messages to all
    API calls. Friendly 404 page. No blank screens ever.

  Task 4.2 [CC]: SEO and meta tags
    Every page needs: title, meta description, Open Graph
    tags, Twitter card tags. Favicon.ico. JSON-LD structured
    data on homepage (EducationalOrganization schema).

  Task 4.3 [CC]: Analytics
    Add Plausible or Google Analytics 4 to every page.
    Track: page views, quiz starts, quiz completions,
    signups, checkout clicks.

  Task 4.4 [CC]: Legal pages
    Files: pages/terms.html, pages/privacy.html,
    pages/about.html, pages/contact.html
    Terms and Privacy must be PDPA-compliant (Singapore).
    Contact page: form to Formspree or Web3Forms endpoint.

  Task 4.5 [YOU]: Switch Stripe to live mode
    Update Vercel env vars with live Stripe keys.
    Final launch step — do only when fully tested.

═══════════════════════════════════════════════════════════════
CONTENT AVAILABLE IN GOOGLE DRIVE (via MCP)
═══════════════════════════════════════════════════════════════

Google Drive path: C:\SLabDrive
(Junction point alias for C:\Users\deyao\My Drive\Superholic Lab)

Folder structure:
  C:\SLabDrive\
  ├── 01 - Platform Intelligence\
  │   ├── System Prompt v1.0.txt
  │   ├── CLAUDE.md v1.0.txt
  │   ├── Prompt Template Library.gdoc
  │   └── Brand Story Homepage Copy.html  ← USE THIS FOR COPY
  ├── 02 - MOE Syllabuses\
  │   ├── Primary\
  │   │   ├── P1-P6 Mathematics Syllabus.pdf
  │   │   ├── P3-P6 Science Syllabus.pdf
  │   │   └── P1-P6 English Syllabus.pdf
  │   └── Secondary\
  │       └── [Secondary syllabuses]
  ├── 03 - Content Library\
  │   └── Primary 4\
  │       └── Mathematics\
  │           ├── Week 1 - Whole Numbers Fractions etc.gdoc
  │           └── Week 2 - Angles Word Problems.gdoc
  ├── 04 - Business\
  │   ├── Brand Story + Homepage Copy.gdoc
  │   ├── Competitor Research.gdoc
  │   └── Pricing Strategy.gdoc
  └── 05 - Content Tracker\
      └── Master Content Tracker.gsheet

IMPORTANT: Read Brand Story Homepage Copy.html from Drive
before writing any homepage copy. It contains the exact
approved headlines, value proposition, and pricing language.

═══════════════════════════════════════════════════════════════
CODING RULES — NON-NEGOTIABLE
═══════════════════════════════════════════════════════════════

ALWAYS:
  ✓ Read CLAUDE.md before starting any build session
  ✓ Read this ARCHITECTURE.md file at session start
  ✓ Comment every function explaining what it does
  ✓ Add ⚠️ CONFIGURE: comment on any line needing manual setup
  ✓ Use const and let — never var
  ✓ Handle errors gracefully — every API call needs try/catch
    with a user-facing error message, never a raw error
  ✓ Validate all user input before sending to any API
  ✓ End every code output with: TEST: [how to verify it works]
  ✓ Commit after every completed task with descriptive message
  ✓ Use CSS variables from style.css — never hardcode colours
  ✓ All pages must be mobile-responsive (mobile-first)

NEVER:
  ✗ Hardcode API keys, URLs, or credentials in code
  ✗ Use SUPABASE_SERVICE_ROLE_KEY in any frontend JS file
  ✗ Use STRIPE_SECRET_KEY in any frontend JS file
  ✗ Use var keyword
  ✗ Use innerHTML with user-supplied content (XSS risk)
    → use textContent or sanitize first
  ✗ Create a new CSS file — all styles go in css/style.css
  ✗ Use any JavaScript framework unless explicitly instructed
    → keep it vanilla JS for the initial build
  ✗ Skip error handling on any async function
  ✗ Leave any page that shows a blank screen on error

═══════════════════════════════════════════════════════════════
HOW TO START THE INITIAL BUILD — FIRST PROMPT FOR CLAUDE CODE
═══════════════════════════════════════════════════════════════

When starting a new Claude Code session, paste this:

---
Read ARCHITECTURE.md and CLAUDE.md from my project at
D:\Git\Superholic-Lab before doing anything else.

Then start Week 1, Task 1.1: Clean the repo.

1. Delete these folders entirely:
   - quiz/
   - countdown-timer/ (or Counterdown-timer/ if that exists)
   - todo-list/

2. Rename these files:
   - .gitignore.txt → .gitignore
   - CLAUDE.md.md → CLAUDE.md (if double extension exists)

3. Verify the cleaned structure looks correct.

4. Commit with message: "chore: clean up repo structure"

5. Then immediately start Task 1.2: scaffold the full project
   structure per the target folder structure in ARCHITECTURE.md.
   Create all folders and files with placeholder content.
   Commit: "feat: scaffold project structure"

After scaffolding is done, tell me what was created and
what the next task is.
---

═══════════════════════════════════════════════════════════════
END OF ARCHITECTURE BRIEFING
Superholic Lab v1.0 — Ready to Build
═══════════════════════════════════════════════════════════════
