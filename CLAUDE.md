# CLAUDE.md — Superholic Lab

> Read this file + ARCHITECTURE.md before writing any code.
> Last updated: 2026-03-29

## Project Identity

**Platform:** Superholic Lab — Singapore's AI-powered learning platform
**Domain:** https://www.superholiclab.com
**Repo:** https://github.com/feynman82/Superholic-Lab
**Local:** D:\Git\Superholic-Lab

**What it is:** MOE-aligned quiz engine + AI tutor for P1–S4 students.
Parents pay SGD 9.99–29.99/month. Key differentiator: wrong-answer
explanations for every MCQ option, across 6 PSLE exam formats.

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

## ECC Framework

This project uses the Everything Claude Code (ECC) framework.

**Rules** (.claude/rules/) — 7 always-active guidelines:
  coding-style, security, git-workflow, development-workflow,
  patterns, performance, testing

**Commands** (.claude/commands/) — 6 slash commands:
  /plan, /code-review, /build-fix, /deploy,
  /generate-questions, /security-check

**Skills** (.claude/skills/) — 5 domain skills:
  question-factory    Content generation for all 6 PSLE types
  quiz-engine         Frontend rendering patterns for quiz UI
  page-builder        Standard page/module template
  supabase-patterns   Database queries, RLS, auth, migrations
  content-review      QA pipeline for question quality

**Agents** (AGENTS.md) — 5 specialist subagents
**Hooks** (hooks/hooks.json) — secret detection + CSS enforcement

## Development Workflow (Research-First)

0. **Research & Reuse** — check codebase and docs first
1. **Plan First** — break task into clear steps
2. **Read the right skill** — before coding, read the relevant SKILL.md:
   - Generating questions? Read `.claude/skills/question-factory/SKILL.md`
   - Building/modifying quiz? Read `.claude/skills/quiz-engine/SKILL.md`
   - Creating a new page? Read `.claude/skills/page-builder/SKILL.md`
   - Database work? Read `.claude/skills/supabase-patterns/SKILL.md`
   - Reviewing content? Read `.claude/skills/content-review/SKILL.md`
3. **Build** — implement following coding rules below
4. **Verify** — test manually, check for errors, validate on mobile
5. **Commit** — descriptive conventional commit message
6. **Deploy** — push to main, Vercel auto-deploys in ~60s

## Coding Rules — Non-Negotiable

### ALWAYS
- Read the relevant SKILL.md before starting work in any domain
- Comment every function explaining what it does
- `const` and `let` only — never `var`
- Every API call wrapped in try/catch with user-facing error message
- Validate user input before sending to any API
- Use CSS variables from style.css — never hardcode hex values
- All pages mobile-responsive (mobile-first)
- End code with: `// TEST: [how to verify]`
- Use `textContent` not `innerHTML` with user-supplied content
- Immutable patterns only — spread/copy, never mutate

### NEVER
- Hardcode API keys, URLs, or credentials in code
- Use SUPABASE_SERVICE_ROLE_KEY or STRIPE_SECRET_KEY in frontend JS
- Create new CSS files — all styles in css/style.css
- Use JavaScript frameworks (vanilla JS only)
- Skip error handling on any async function
- Leave any page showing a blank screen on error
- Use `true_false` or `fill_blank` question types (retired)
- Generate questions without reading question-factory skill first

## Design System

```css
:root {
  --primary: #4338ca;  --primary-light: #eef2ff;  --primary-dark: #3730a3;
  --accent: #f59e0b;   --success: #10b981;        --danger: #ef4444;
  --text-primary: #111827;  --text-secondary: #6b7280;
  --bg: #f9fafb;  --white: #ffffff;  --border: #e5e7eb;
}
```

Font: Plus Jakarta Sans (400, 500, 600).
Difficulty badges: Foundation (#f0fdf4/#15803d), Standard (#f0fdfa/#0f766e),
Advanced (#fffbeb/#b45309), HOTS (#fff1f2/#be123c).

## Environment Variables

All in `.env` (gitignored) and Vercel dashboard.
Server-only: SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY.
Frontend-safe: SUPABASE_URL, SUPABASE_ANON_KEY, STRIPE_PUBLISHABLE_KEY.

## Content Quality Rules

1. Syllabus alignment — every question maps to a named MOE topic
2. Difficulty labels — Foundation | Standard | Advanced | HOTS
3. Wrong-answer explanations — all 3 wrong MCQ options explained
4. Worked solutions — step-by-step, not just final answer
5. Singapore context — names, food, places from SG
6. 6 PSLE types — mcq, short_ans, word_problem, open_ended, cloze, editing

Full spec: `.claude/skills/question-factory/SKILL.md`

## Build Status

```
COMPLETED:
[x] Weeks 1-2: Foundation, homepage, quiz engine, AI tutor, auth pages
[x] ECC framework (rules, commands, agents, hooks, skills)
[x] Master Question Template (6 PSLE types)
[x] Question bank JSON (P2/P4 Maths, Science, English)

IN PROGRESS:
[ ] 6 question types in quiz engine (quiz.js rewrite)
[ ] Topic-specific question files + topic selection
[ ] Progress tracker + Stripe integration + paywall

NEXT:
[ ] Loading states, SEO, analytics, legal pages, launch
```

## When Unsure

Ask before building. Format:
"Before I build [X], I want to confirm: [question].
My assumption is [Y] — is that correct?"

---
*CLAUDE.md v2.1 — ECC Framework + Skills*
