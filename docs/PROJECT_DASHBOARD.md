# Project Dashboard — Superholic Lab
**Last updated:** 2026-03-29
**Platform:** https://www.superholiclab.com

---

## Layout Unification Status

| Page | Navbar | Bottom Nav | Unified? |
|---|---|---|---|
| `index.html` | `.navbar.navbar-homepage` (fixed, homepage-specific) | — | ✅ |
| `pages/dashboard.html` | `.navbar.is-scrolled` (standard inner-app) | — | ✅ **Updated** |
| `pages/subjects.html` | `.navbar.is-scrolled` | ✅ 5 items (Home, Practise, AI Tutor, Exam, Progress) | ✅ **Updated** |
| `pages/exam.html` | `.navbar.is-scrolled` | Needs Exam `is-active` | ⚠️ Partial |
| `pages/tutor.html` | `.navbar.is-scrolled` | Needs Exam item | ⚠️ Partial |
| `pages/progress.html` | `.navbar.is-scrolled` | Needs Exam item | ⚠️ Partial |
| `pages/quiz.html` | `.navbar.is-scrolled` | Needs Exam item | ⚠️ Partial |
| `pages/login.html` | `.navbar.is-scrolled` | — | ✅ |
| `pages/signup.html` | `.navbar.is-scrolled` | — | ✅ |
| `pages/setup.html` | `.navbar.is-scrolled` | — | ✅ |

**Remaining:** Add Exam bottom-nav item to `quiz.html`, `tutor.html`, `progress.html`, `exam.html`.

---

## Design Debt Score

| Date | Score | Notes |
|---|---|---|
| 2026-03-29 (baseline) | 6.4 / 10 | Pre-remediation audit |
| 2026-03-29 (post-remediation) | 8.6 / 10 | 7 pages fixed, hooks deployed |
| 2026-03-29 (layout unification) | **8.8 / 10** | dashboard nav + hero cleanup + Exam nav item |

Full audit detail: `docs/design-audit.md`

---

## Hero Cleanup

- Removed `"7-day free trial · No credit card · Cancel anytime"` from `index.html` hero.
- Trust signals are still present in the trust bar (line 290) and pricing section.
- The CTAs flow cleanly into hero stats with 48px gap — no spacing adjustment needed.

---

## Build Status

```
COMPLETED:
[x] Weeks 1-2: Foundation, homepage, quiz engine, AI tutor, auth pages
[x] ECC framework (rules, commands, agents, hooks, skills)
[x] Master Question Template (6 PSLE types)
[x] Question bank JSON (P2/P4 Maths, Science, English)
[x] Design remediation (8.6/10 score, design guardian hook deployed)
[x] Unified layout: dashboard nav replaced, Exam nav item in subjects.html

IN PROGRESS:
[ ] 6 question types in quiz engine (quiz.js rewrite)
[ ] Topic-specific question files + topic selection
[ ] Exam bottom-nav item on remaining pages (quiz, tutor, progress, exam)

NEXT:
[ ] Progress tracker + Stripe integration + paywall
[ ] Loading states, SEO, analytics, legal pages, launch
```
