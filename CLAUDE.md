# CLAUDE.md — Superholic Lab

> Read this file + ARCHITECTURE.md before writing any code.
> Last updated: 2026-03-24

## Project Identity

**Platform:** Superholic Lab — Singapore's AI-powered learning platform
**Domain:** https://www.superholiclab.com
**Repo:** https://github.com/feynman82/Superholic-Lab
**Local:** D:\Git\Superholic-Lab

**What it is:** MOE-aligned quiz engine + AI tutor for P1–S4 students.
Parents pay SGD 9.99–29.99/month. Key differentiator: wrong-answer
explanations for every MCQ option.

**Target users:** Singapore parents (P1–P6 focus, PSLE anxiety).
Students aged 7–16. Parents manage billing + see progress.

## Tech Stack

- **Frontend:** Plain HTML, CSS, vanilla JavaScript (no frameworks)
- **Styles:** Single `css/style.css` with CSS variables, Plus Jakarta Sans
- **Backend:** Vercel serverless functions (`api/*.js`)
- **Database:** Supabase (PostgreSQL, RLS on all 6 tables, SG region)
- **Auth:** Supabase email/password
- **Payments:** Stripe (test mode, 3 SGD products)
- **AI:** Anthropic API (`claude-sonnet-4-6`) via `api/chat.js`
- **Deploy:** Vercel auto-deploy on push to `main`
- **Domain:** Cloudflare DNS → Vercel

## Development Workflow (Research-First)

0. **Research & Reuse** — before writing new code:
   - Search the codebase for existing patterns
   - Check if Supabase/Stripe/Anthropic docs have examples
   - Look for proven approaches before writing from scratch

1. **Plan First** — break task into clear steps before coding
2. **Build** — implement following coding rules below
3. **Verify** — test manually, check for errors, validate on mobile
4. **Commit** — descriptive conventional commit message
5. **Deploy** — push to main, Vercel auto-deploys in ~60s

## File Structure

```
superholic-lab/
├── CLAUDE.md              ← this file
├── ARCHITECTURE.md        ← full infra briefing (source of truth)
├── AGENTS.md              ← subagent definitions
├── index.html             ← marketing homepage
├── pages/
│   ├── subjects.html      ← subject + level selector
│   ├── quiz.html          ← quiz engine
│   ├── tutor.html         ← AI tutor chat
│   ├── progress.html      ← student progress
│   ├── pricing.html       ← subscription plans
│   ├── login.html         ← auth
│   ├── signup.html        ← auth
│   ├── dashboard.html     ← student dashboard
│   ├── about.html
│   ├── terms.html
│   ├── privacy.html
│   └── contact.html
├── css/
│   └── style.css          ← ALL styles, one file, CSS variables
├── js/
│   ├── supabase-client.js ← Supabase client instance
│   ├── auth.js            ← auth + session + paywall
│   ├── quiz.js            ← quiz engine logic
│   ├── tutor.js           ← AI tutor chat + system prompts
│   ├── progress.js        ← progress tracking
│   └── stripe.js          ← Stripe checkout redirect
├── api/
│   ├── chat.js            ← Anthropic API serverless function
│   ├── generate.js        ← question generation
│   ├── checkout.js        ← Stripe checkout session
│   └── webhook.js         ← Stripe webhook handler
├── data/
│   └── questions/         ← question bank JSON files
├── assets/
│   ├── favicon.ico
│   └── logo.svg
├── hooks/
│   └── hooks.json         ← Claude Code hook automations
├── .claude/
│   ├── settings.local.json
│   ├── rules/             ← always-follow guidelines
│   └── commands/           ← slash commands
└── .env                   ← credentials (NEVER commit)
```

## Coding Rules — Non-Negotiable

### ALWAYS
- Comment every function explaining what it does
- `const` and `let` only — never `var`
- Every API call wrapped in try/catch with user-facing error message
- Validate user input before sending to any API
- Use CSS variables from style.css — never hardcode hex values
- All pages mobile-responsive (mobile-first)
- End code with: `// TEST: [how to verify]`
- Use `textContent` not `innerHTML` with user-supplied content

### NEVER
- Hardcode API keys, URLs, or credentials in code
- Use SUPABASE_SERVICE_ROLE_KEY or STRIPE_SECRET_KEY in frontend JS
- Create new CSS files — all styles in css/style.css
- Use JavaScript frameworks (vanilla JS only)
- Skip error handling on any async function
- Leave any page showing a blank screen on error
- Mutate objects — use spread/copy (immutable patterns)

## Design System

```css
:root {
  --primary:        #4338ca;
  --primary-light:  #eef2ff;
  --primary-dark:   #3730a3;
  --accent:         #f59e0b;
  --success:        #10b981;
  --danger:         #ef4444;
  --text-primary:   #111827;
  --text-secondary: #6b7280;
  --bg:             #f9fafb;
  --white:          #ffffff;
  --border:         #e5e7eb;
}
```

Font: Plus Jakarta Sans (Google Fonts) — 400, 500, 600 weights.

## Environment Variables

All in `.env` (gitignored) and Vercel dashboard:
- `ANTHROPIC_API_KEY` — AI tutor
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — frontend safe
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only
- `STRIPE_PUBLISHABLE_KEY` — frontend safe
- `STRIPE_SECRET_KEY` — server-side only
- `STRIPE_*_PRICE_ID` — 3 tier price IDs

## Content Quality Rules

1. **Syllabus alignment** — every question maps to a named MOE topic
2. **Difficulty labels** — foundation | standard | advanced | hots
3. **Wrong-answer explanations** — all 3 wrong MCQ options explained
4. **Worked solutions** — step-by-step, not just final answer
5. **Examiner tips** — on advanced/HOTS questions

## Decision Log

| Date | Decision | Reason |
|------|----------|--------|
| 2026-03 | Vanilla JS over React | Simpler, founder can review |
| 2026-03 | Vercel hosting | Free tier, GitHub auto-deploy |
| 2026-03 | Plus Jakarta Sans | Friendly, readable for children |
| 2026-03 | Single style.css | Easy to find and edit |
| 2026-03 | Supabase SG region | Data residency, low latency |
| 2026-03 | 7-day free trial, no CC | Reduce signup friction |
| 2026-03 | ECC framework | Structured dev workflow, quality gates |

## Build Status

```
COMPLETED:
[x] Repo structure scaffolded
[x] CSS design system
[x] Marketing homepage
[x] Subject selection page (with topic selection step)
[x] Quiz engine — 6 question types (mcq, short_ans, word_problem, open_ended, cloze, editing)
[x] AI tutor chat interface
[x] Anthropic API integration (api/chat.js)
[x] Auth pages (login/signup)
[x] Supabase client setup
[x] Question bank JSON files (P2/P4 Maths, English, Science)
[x] Topic-split JSON files (p4-mathematics-fractions.json etc.)
[x] ECC framework implemented
[x] Master Question Template implemented (6 types, MOE/PSLE aligned)

IN PROGRESS:
[ ] Auth logic (session management, paywall)
[ ] Progress tracker
[ ] Stripe integration

NEXT UP:
[ ] Pricing page with Stripe Checkout
[ ] Paywall enforcement
[ ] Loading states + error handling
[ ] SEO meta tags
[ ] Legal pages (PDPA-compliant)
[ ] Analytics
[ ] Switch Stripe to live mode
```

## When Unsure

Ask before building. Format:
"Before I build [X], I want to confirm: [question].
My assumption is [Y] — is that correct?"

---
*CLAUDE.md v2.0 — ECC Framework Applied*
