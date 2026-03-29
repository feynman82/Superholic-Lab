# PROJECT DASHBOARD — Superholic Lab
> Last updated: 2026-03-29 | Auto-update on session end via /session-end

---

## Platform Status

| Domain | Status | Notes |
|---|---|---|
| Production URL | https://www.superholiclab.com | Live |
| Vercel Deploy | Auto on `main` push | ~60s deploy time |
| Supabase | Active (SG region) | 6 tables, RLS enabled |
| Stripe | Test mode | 3 SGD products defined |
| Auth | Email/password | Supabase Auth |

---

## Architecture Migration Status

| Layer | Current | Target | Status |
|---|---|---|---|
| Framework | Vanilla HTML/JS | Next.js 14 App Router | 🔴 Not started |
| Language | JavaScript | TypeScript | 🔴 Not started |
| Styling | CSS (style.css) | Tailwind CSS | 🔴 Not started |
| Components | Flat JS modules | Atomic (ui/quiz/layout) | 🔴 Not started |
| API routes | Vercel `api/*.js` | Next.js Route Handlers | 🔴 Not started |

See ADR-0001 for migration rationale and strategy.

---

## Question Bank Coverage

*Target: 20+ questions per topic file, balanced type and difficulty distribution.*

| Level | Mathematics | Science | English | Status |
|---|---|---|---|---|
| P1 | 0q — ❌ Gap | n/a | 0q — ❌ Gap | Critical |
| P2 | 12q (5 topics) | n/a | 11q (3 types) | 🟡 Low volume |
| P3 | 0q — ❌ Gap | 0q — ❌ Gap | 0q — ❌ Gap | Critical |
| P4 | 15q (4 topics) | 17q (4 topics) | 23q (5 types) | 🟡 Low volume |
| P5 | 8q (aggregate only) | 12q (aggregate only) | 0q — ❌ Gap | 🟡 Partial |
| P6 | 0q — ❌ Gap | 0q — ❌ Gap | 0q — ❌ Gap | Critical |

**Total estimated:** ~98 questions across 19 topic files.
**Priority gaps:** P1, P3, P6 (no content), P5 English (missing), all files below 20q target.

---

## ECC Framework Health

| Component | Count | Status |
|---|---|---|
| Rules (.claude/rules/) | 13 | ✅ Active |
| Commands (.claude/commands/) | 10 | ✅ Active |
| Skills (.claude/skills/) | 5 | ✅ Active |
| Agents (.claude/agents/) | 1 of 2 | 🟡 question-coder defined, teaching-guide pending |
| ADRs (.claude/docs/adr/) | 1 | ✅ ADR-0001 (Next.js migration) |
| Hooks (hooks/hooks.json) | 4 | ✅ Secret detection, CSS lint, TS check, ESLint |

---

## Build Phases

### COMPLETED ✅
- [x] Weeks 1–2: Foundation — homepage, quiz engine v1, AI tutor, auth pages
- [x] ECC framework — rules, commands, agents, hooks, skills (v1)
- [x] Master Question Template — 6 PSLE types codified in moe-templates.md
- [x] Question bank JSON — P2/P4 Maths, Science, English (partial)
- [x] Architecture migration decision — ADR-0001 (Next.js + TypeScript + Tailwind)
- [x] Intelligence DNA — moe-templates.md + pedagogical-standards.md
- [x] Infrastructure rules — tech-stack.md, design-system.md, safety.md, efficiency.md
- [x] Question Coder agent — fully defined with pre-flight checklist + validation

### IN PROGRESS 🟡
- [ ] 6 question types in quiz engine (quiz.js rewrite → Next.js component)
- [ ] Topic-specific question files (expand from aggregate to per-topic)
- [ ] Next.js migration: /src directory scaffold
- [ ] Teaching Guide agent definition (Phase 3, teaching-guide.md)

### NEXT 📋
- [ ] Next.js /src directory structure (app router layout, pages)
- [ ] Progress tracker (quiz_results → Supabase → dashboard page)
- [ ] Stripe integration (subscription + paywall on quiz content)
- [ ] P3 and P6 question bank content
- [ ] /session-end command + SESSION_HANDOFF pattern
- [ ] Loading states, skeleton screens across all pages
- [ ] SEO: meta tags, OG images, sitemap.xml
- [ ] Analytics: Vercel Analytics or Plausible
- [ ] Legal pages: Privacy Policy (PDPA), Terms of Service
- [ ] Launch checklist

---

## AI Health Indicators

| Indicator | Target | Current |
|---|---|---|
| Rules with clear authority | All 13 have priority order | ✅ |
| Question schema versioned | moe-templates.md is version-controlled | ✅ |
| Agent pre-flight checklists | All agents have mandatory pre-checks | ✅ (question-coder) |
| PostToolUse hooks active | Build + lint + secret + CSS | ✅ |
| ADRs for key decisions | One per major architectural decision | ✅ (1 ADR) |
| /compact discipline | Defined in efficiency.md | ✅ |
| Post-mortem protocol | Defined in efficiency.md | ✅ |

---

## Recent Architecture Decisions

| ADR | Decision | Date |
|---|---|---|
| ADR-0001 | Migrate to Next.js App Router + TypeScript + Tailwind | 2026-03-29 |

---

## Known Issues / Blockers

| Issue | Impact | Owner | Status |
|---|---|---|---|
| quiz.js needs rewrite for all 6 types | High — only MCQ renders correctly | Platform | In progress |
| P3/P6 content gap | High — blocks full P1–P6 coverage | Content | Not started |
| Next.js /src scaffold not created | High — migration cannot start | Platform | Not started |
| Teaching Guide agent not defined | Medium — AI tutor lacks Socratic logic | Platform | Next session |

---

*Update this file at the end of every session using `/session-end`.*
*Coverage numbers are estimates — run `/inventory` for exact counts.*
