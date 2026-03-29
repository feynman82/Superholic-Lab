# Project Dashboard — Superholic Lab
**Last updated:** 2026-03-29
**Platform:** https://www.superholiclab.com

---

## Layout Unification Status

| Page | Navbar | Bottom Nav | Unified? |
|---|---|---|---|
| `index.html` | `.navbar.navbar-homepage` (fixed, homepage-specific) | — | ✅ |
| `pages/dashboard.html` | `.navbar.is-scrolled` (standard inner-app) | — | ✅ |
| `pages/subjects.html` | `.navbar.is-scrolled` | ✅ 5 items (Home, Practise, AI Tutor, **Exam**, Progress) | ✅ Gold Standard |
| `pages/quiz.html` | `.navbar.is-scrolled` | ✅ 5 items — Practise `is-active` | ✅ |
| `pages/exam.html` | `.navbar.is-scrolled` | ✅ 5 items — Exam `is-active` | ✅ |
| `pages/tutor.html` | `.navbar.is-scrolled` | ✅ 5 items — AI Tutor `is-active` | ✅ |
| `pages/progress.html` | `.navbar.is-scrolled` | ✅ 5 items — Progress `is-active` | ✅ |
| `pages/about.html` | `.navbar.is-scrolled` | ✅ 5 items | ✅ |
| `pages/pricing.html` | `.navbar.is-scrolled` | ✅ 5 items | ✅ |
| `pages/login.html` | `.navbar.is-scrolled` | — | ✅ |
| `pages/signup.html` | `.navbar.is-scrolled` | — | ✅ |
| `pages/setup.html` | `.navbar.is-scrolled` | — | ✅ |

**Navigation: SYNCHRONIZED ✅** — All 7 bottom-nav pages carry identical 5-item nav with correct `is-active` state and `aria-current="page"`.

---

## Breadcrumb Spacing

| Page | Structure | Top padding | Spacing status |
|---|---|---|---|
| `quiz.html` | `<main padding-top: space-8>` → `.container` → `.breadcrumb` | 32px + 8px (CSS) = 40px | ✅ Gold Standard |
| `exam.html` | same structure | 32px + 8px (CSS) = 40px | ✅ **Fixed** (was `space-20` bottom → `space-16`) |

CSS fix applied: `.breadcrumb { padding-top: var(--space-2) }` added globally — gives all breadcrumbs 8px breathing room from the container top edge, consistent across quiz.html and exam.html.

---

## Design Debt Score

| Date | Score | Notes |
|---|---|---|
| 2026-03-29 (baseline) | 6.4 / 10 | Pre-remediation audit |
| 2026-03-29 (post-remediation) | 8.6 / 10 | 7 pages fixed, hooks deployed |
| 2026-03-29 (layout unification) | 8.8 / 10 | dashboard nav + hero cleanup + Exam nav item |
| 2026-03-29 (nav sync) | **9.1 / 10** | All 7 bottom-nav pages synchronized, breadcrumb fixed |

Full audit detail: `docs/design-audit.md`

---

## Hero Cleanup

- Removed `"7-day free trial · No credit card · Cancel anytime"` from `index.html` hero.
- Trust signals remain in the trust bar (line 290) and pricing section.
- CTAs flow cleanly into hero stats with 48px gap.

---

## Build Status

```
COMPLETED:
[x] Weeks 1-2: Foundation, homepage, quiz engine, AI tutor, auth pages
[x] ECC framework (rules, commands, agents, hooks, skills)
[x] Master Question Template (6 PSLE types)
[x] Question bank JSON (P2/P4 Maths, Science, English)
[x] Design remediation (8.6/10 score, design guardian hook deployed)
[x] Unified layout: dashboard nav replaced, hero cleanup
[x] Navigation sync: Exam item on all 7 bottom-nav pages, is-active states correct
[x] Breadcrumb spacing: consistent padding-top across quiz.html and exam.html

IN PROGRESS:
[ ] 6 question types in quiz engine (quiz.js rewrite)
[ ] Topic-specific question files + topic selection

NEXT:
[ ] Progress tracker + Stripe integration + paywall
[ ] Loading states, SEO, analytics, legal pages, launch
```
