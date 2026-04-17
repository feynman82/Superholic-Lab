# CLAUDE.md — Superholic Lab

> Read this file + ARCHITECTURE.md before writing any code.
> Last updated: 2026-04-17 | v3.0

## Project Identity

**Platform:** Superholic Lab — Singapore's AI-powered learning platform  
**Domain:** https://www.superholiclab.com  
**Repo:** https://github.com/feynman82/Superholic-Lab  
**Local:** D:\Git\Superholic-Lab  
**Google Drive (via MCP):** C:\SLabDrive  

**What it is:** MOE-aligned quiz engine + AI tutor for P1–S4 students.
Parents subscribe monthly. Students practise across 6 PSLE exam formats
with full worked solutions, wrong-answer explanations, and an AI tutor
(Miss Wena) who scaffolds learning in a warm Singaporean voice.

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
| Frontend    | Plain HTML, CSS, vanilla JS (no frameworks) |
| Styles      | Single `css/style.css` with CSS variables, Bebas Neue + Plus Jakarta Sans |
| Backend     | Vercel serverless — **single gateway** `api/index.js` → `lib/api/handlers.js` |
| Database    | Supabase PostgreSQL, SG region, RLS on all tables |
| Auth        | Supabase: email/password + Google OAuth + Apple OAuth |
| Payments    | Stripe (test mode — switch to live before launch) |
| AI (chat)   | Gemini Flash (`gemini-3-flash-preview`) — primary for Miss Wena tutor |
| AI (grade)  | Claude Sonnet (`claude-3-5-sonnet-20241022`) — primary for grading |
| AI (fallback)| Claude Haiku (`claude-haiku-4-5-20251001`) — exam gen fallback |
| AI (questions)| Claude Sonnet (`claude-3-5-sonnet-20241022`) — `/api/generate` |
| Deploy      | Vercel auto-deploy on push to `main`, ~60s |
| DNS         | Cloudflare → Vercel |
| Analytics   | Plausible (script tag — needs adding to all pages) |

## API Architecture — Single Gateway Pattern

Vercel Hobby plan = 12 serverless function limit. All routes go through
one function via rewrites in `vercel.json`:

```
/api/{route}  →  api/index.js  →  lib/api/handlers.js (named export)
```

**All 13 routes (add new ones here + vercel.json + the switch in api/index.js):**

| Route                | Handler               | Purpose |
|----------------------|-----------------------|---------|
| /api/chat            | handleChat            | Miss Wena AI tutor (Gemini) |
| /api/checkout        | handleCheckout        | Stripe Checkout Session |
| /api/webhook         | handleWebhook         | Stripe webhook (raw body) |
| /api/portal          | handlePortal          | Stripe Customer Portal |
| /api/admin           | handleAdmin           | Admin panel data + mutations |
| /api/generate        | handleGenerate        | Claude question generation (internal) |
| /api/generate-question | handleGenerateQuestion | AI question gen (Gemini → Claude fallback) |
| /api/generate-exam   | handleGenerateExam    | Full exam paper generation |
| /api/grade-answer    | handleGradeAnswer     | AI marking for open/word_problem |
| /api/save-exam-result | handleSaveExamResult | Save exam scores to Supabase |
| /api/generate-quest  | handleGenerateQuest   | Remedial quest generation |
| /api/analyze-weakness | handleAnalyzeWeakness | Deep-dive learning gap report |
| /api/summarize-chat  | handleSummarizeChat   | Package chat into Study Note |

**Important:** `/api/webhook` must receive the raw unparsed body for
Stripe signature verification — do NOT attach `parseJsonBody` to it.

## ECC Framework

**Rules** (`.claude/rules/`) — 7 always-active guidelines:  
  `coding-style`, `security`, `git-workflow`, `development-workflow`,
  `patterns`, `performance`, `testing`

**Commands** (`.claude/commands/`) — 6 slash commands:  
  `/plan`, `/code-review`, `/build-fix`, `/deploy`,
  `/generate-questions`, `/security-check`, `/inventory`

**Skills** (`.claude/skills/`) — 5 domain skills:  
  `question-factory` — Content generation for all 6 PSLE types  
  `quiz-engine` — Frontend rendering patterns for quiz UI  
  `page-builder` — Standard page/module template  
  `supabase-patterns` — Database queries, RLS, auth, migrations  
  `content-review` — QA pipeline for question quality  

**Agents** (`AGENTS.md`) — 5 specialist subagents  
**Hooks** (`hooks/hooks.json`) — secret detection + CSS enforcement  

## Development Workflow (Research-First)

0. **Research & Reuse** — read CLAUDE.md + ARCHITECTURE.md, check existing code
1. **Read the right skill** — before coding, read the relevant SKILL.md
2. **Plan** — break into clear steps before writing anything
3. **Build** — follow coding rules below
4. **Verify** — test manually, check mobile, look for console errors
5. **Commit** — descriptive conventional commit message
6. **Deploy** — push to main, Vercel auto-deploys in ~60s

## Coding Rules — Non-Negotiable

### ALWAYS
- Read the relevant SKILL.md before starting work in any domain
- Comment every function explaining what it does
- `const` and `let` only — never `var`
- Every API call wrapped in `try/catch` with a user-facing error message
- Validate user input before sending to any API
- Use CSS variables from `style.css` — never hardcode hex values in `style=` attributes
- All pages mobile-responsive (mobile-first)
- Use `textContent` not `innerHTML` with user-supplied content
- Immutable patterns only — spread/copy, never mutate
- Place page-level styles in a `<style>` block, never inline `style=` with colour values

### NEVER
- Hardcode API keys, URLs, or credentials in code
- Use `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` in frontend JS
- Create new CSS files — all styles in `css/style.css` or page `<style>` blocks
- Use JavaScript frameworks (vanilla JS only)
- Skip error handling on any async function
- Leave any page showing a blank screen on error
- Use `true_false` or `fill_blank` question types (retired)
- Reference `Single Subject` tier anywhere in UI or new code (removed)
- Add `trial_period_days` to Stripe checkout params
- Use `payment_method_types` or `automatic_payment_methods` on Checkout Sessions

## Design System — "Rose & Sage"

Fonts:
- Display H1/H2: **Bebas Neue** (class: `font-display`), uppercase
- Body: **Plus Jakarta Sans** (400, 500, 600, 700, 800)

Key CSS variables:
```
--sage:       #51615E   Primary nav/header background
--sage-dark:  #3d4f4b   Deeper sage (used in header.js)
--cream:      #e3d9ca   Text on sage backgrounds
--rose:       #B76E79   Primary CTA, brand accent
--peach:      #B88078   Secondary accent
--brand-sage, --brand-rose, --brand-mint — alias vars in style.css
```

Difficulty badges (do not change):
- Foundation: `#f0fdf4` / `#15803d`
- Standard:   `#f0fdfa` / `#0f766e`  
- Advanced:   `#fffbeb` / `#b45309`
- HOTS:       `#fff1f2` / `#be123c`

## Environment Variables

All in `.env` (gitignored) **and** Vercel dashboard:

```
# Supabase
SUPABASE_URL                        (frontend-safe)
SUPABASE_ANON_KEY                   (frontend-safe)
SUPABASE_SERVICE_ROLE_KEY           (server-only — never in frontend JS)

# Stripe
STRIPE_SECRET_KEY                   (server-only)
STRIPE_PUBLISHABLE_KEY              (frontend-safe)
STRIPE_WEBHOOK_SECRET               (server-only — whsec_...)
STRIPE_ALL_SUBJECTS_PRICE_ID        monthly All Subjects price
STRIPE_FAMILY_PRICE_ID              monthly Family price
STRIPE_ALL_SUBJECTS_ANNUAL_PRICE_ID annual All Subjects price
STRIPE_FAMILY_ANNUAL_PRICE_ID       annual Family price

# AI
ANTHROPIC_API_KEY                   (server-only)
GEMINI_API_KEY                      (server-only)

# App
NEXT_PUBLIC_APP_URL                 https://www.superholiclab.com
```

## Question Bank — Supabase-Hosted

All questions live in the `question_bank` table in Supabase (NOT JSON files).
The quiz engine reads from Supabase at runtime.

**Table: `question_bank`** — key columns:
```
id, seed_id, is_ai_cloned, subject, level, topic, sub_topic,
difficulty, type, marks, question_text,
options (jsonb),            -- MCQ: [{label,text},...]
correct_answer,             -- letter format: "B" not index
wrong_explanations (jsonb), -- {"A": "reason", ...}
worked_solution,
parts (jsonb),              -- word_problem: [{label,marks,question,correct_answer,...}]
keywords (text[]),          -- open_ended
model_answer,               -- open_ended
passage,                    -- cloze
blanks (jsonb),             -- cloze blanks
passage_lines (jsonb),      -- editing lines
examiner_note,
cognitive_skill,
progressive_hints (jsonb),
image_url,
visual_payload (jsonb),     -- diagram-library params {engine, function_name, params}
instructions,
flag_review (bool),
accept_also,
created_at
```

**Question types:** `mcq`, `short_ans`, `word_problem`, `open_ended`, `cloze`, `editing`  
**Retired types (do not use):** `true_false`, `fill_blank`  
**Correct answer format:** Always letter string `"A"` — never index `0`  
**Difficulty values:** `Foundation`, `Standard`, `Advanced`, `HOTS`  

## Miss Wena — AI Tutor Persona

Miss Wena is Superholic Lab's AI tutor character. Key rules:
- Warm, highly capable, MOE-aligned Singaporean tutor
- Handles Maths, Science, English for P1–S4
- **Never** gives the final answer immediately (3-Strike Scaffolding Rule)
- Celebrates correct answers with enthusiasm
- Soft pivots off-topic questions back to learning
- Light Singlish ("lah", "lor") occasionally for authenticity
- Avatar: `assets/images/miss_wena.png` (SVG `onerror` fallback)
- Defined in: `lib/api/handlers.js` → `OMNI_TUTOR_SYSTEM_PROMPT`

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

## Key Features

| Feature               | Location |
|-----------------------|----------|
| Quiz engine (6 types) | `js/quiz.js`, `pages/quiz.html` |
| AI Tutor (Miss Wena)  | `js/tutor.js`, `pages/tutor.html`, `/api/chat` |
| Study Notes Backpack  | `/api/summarize-chat`, `dashboard.html` backpack modal |
| Progress Tracker      | `js/progress.js`, `pages/progress.html` |
| Exam Generator        | `js/exam-generator.js`, `pages/exam.html`, `/api/generate-exam` |
| AI Weakness Analysis  | `/api/analyze-weakness`, `progress.html` |
| Remedial Plan Quest   | `/api/generate-quest`, shown on progress.html |
| Pricing + Checkout    | `pages/pricing.html`, `/api/checkout` |
| Parent Account Portal | `pages/account.html` |
| Master Admin Panel    | `pages/admin.html`, `/api/admin` |
| Parent Dashboard      | `pages/dashboard.html` |
| Web Components        | `<global-header>` (js/header.js), `<global-footer>` (js/footer.js) |

## When Unsure

Ask before building:
> "Before I build [X], I want to confirm: [question]. My assumption is [Y] — is that correct?"

---
*CLAUDE.md v3.0 — Updated 2026-04-17*
