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

## Content Coverage Matrix
**Target:** 20 questions per topic file | **Audit date:** 2026-03-29

### Current Inventory (21 topic-specific files)

| Level | Subject | Topic | Q Count | Types Present | Diff spread | Gap to 20 |
|---|---|---|---|---|---|---|
| P2 | Math | Whole Numbers | 3 | mcq only | Std×2, Fnd×1 | **–17** |
| P2 | Math | Addition & Subtraction | 3 | mcq only | Std×3 | **–17** |
| P2 | Math | Fractions | 2 | mcq only | Std×2 | **–18** |
| P2 | Math | Money | 2 | mcq only | Std×2 | **–18** |
| P2 | Math | Multiplication & Division | 2 | mcq only | Std×2 | **–18** |
| P2 | English | Grammar | 6 | mcq only | Std×6 | **–14** |
| P2 | English | Vocabulary | 3 | mcq only | Std×2, Fnd×1 | **–17** |
| P2 | English | Comprehension | 2 | mcq only | Std×2 | **–18** |
| P4 | Math | Fractions | 5 | mcq only | Std×5 | **–15** |
| P4 | Math | Decimals | 4 | mcq only | Std×4 | **–16** |
| P4 | Math | Geometry | 3 | mcq only | Std×3 | **–17** |
| P4 | Math | Whole Numbers | 3 | mcq only | Std×3 | **–17** |
| P4 | Science | Heat | 4 | mcq only | Std×4 | **–16** |
| P4 | Science | Light | 3 | mcq only | Std×3 | **–17** |
| P4 | Science | Magnets | 2 | mcq only | Std×2 | **–18** |
| P4 | Science | Matter | 4 | mcq only | Std×4 | **–16** |
| P4 | English | Grammar | 7 | mcq only | Std×7 | **–13** |
| P4 | English | Cloze | 3 | cloze only | Std×2, Adv×1 | **–17** |
| P4 | English | Editing | 3 | editing only | Std×2, Adv×1 | **–17** |
| P4 | English | Vocabulary | 3 | mcq only | Std×3 | **–17** |
| P4 | English | Comprehension | 3 | mcq only | Std×3 | **–17** |
| P5 | Math | *(aggregate only)* | 18 | mcq×10, short_ans×5, wp×3 | Std×11, Adv×4, Fnd×2, HOTS×1 | **–2 (no topic files)** |
| P5 | Science | *(aggregate only)* | 15 | mcq×10, open_ended×5 | Std×12, Adv×2, Fnd×1 | **–5 (no topic files)** |

### Completely Missing (0 questions)

| Level | Math | Science | English |
|---|---|---|---|
| **P1** | ✗ — 0q | n/a (starts P3) | ✗ — 0q |
| **P3** | ✗ — 0q | ✗ — 0q | ✗ — 0q |
| **P5** | aggregate only | aggregate only | ✗ — 0q |
| **P6** | ✗ — 0q | ✗ — 0q | ✗ — 0q |

### Critical Type Gaps

| Subject | Missing types | Impact |
|---|---|---|
| P2 Math | short_ans, word_problem | 0 of 40 target non-MCQ questions exist |
| P4 Math | short_ans, word_problem | 0 of 52 target non-MCQ questions exist |
| P4 Science | open_ended | 0 of 40 target open_ended questions exist |
| P2 English | cloze, editing | 0 of 66 target non-MCQ questions exist |

### Difficulty Monoculture

Almost all existing questions are `Standard` difficulty. Target breakdown:
Foundation 20% / Standard 50% / Advanced 20% / HOTS 10%

| Level | Foundation | Standard | Advanced | HOTS | Status |
|---|---|---|---|---|---|
| P2 Math | 1 | 11 | 0 | 0 | ⚠️ No Advanced/HOTS |
| P4 Math | 0 | 15 | 0 | 0 | ⚠️ All Standard |
| P4 Science | 0 | 13 | 0 | 0 | ⚠️ All Standard |
| P4 English | 0 | 25 | 2 | 0 | ⚠️ No Foundation/HOTS |
| P5 Math | 2 | 11 | 4 | 1 | ✅ Best spread |

### Summary Totals

| Metric | Count |
|---|---|
| Topic files | 21 |
| Total topic questions | 82 |
| Questions to reach 20/topic (existing levels) | **~338 needed** |
| Missing levels (P1, P3, P5-Eng, P6) — estimated minimum | **~700 needed** |
| **Grand total gap** | **~1,038 questions** |

Full timeline: `docs/CONTENT_TIMELINE.md`

---

## Build Status

```
COMPLETED:
[x] Weeks 1-2: Foundation, homepage, quiz engine, AI tutor, auth pages
[x] ECC framework (rules, commands, agents, hooks, skills)
[x] Master Question Template (6 PSLE types)
[x] Question bank JSON (P2/P4 partial — 82 questions across 21 topic files)
[x] Design remediation (9.1/10 score, design guardian hook deployed)
[x] Unified layout + global nav sync (all 7 bottom-nav pages)
[x] Content Coverage Matrix + Production Timeline created

IN PROGRESS:
[ ] Question bank scale-up (see CONTENT_TIMELINE.md)
[ ] 6 question types in quiz engine (quiz.js rewrite)
[ ] P1/P3/P5-English/P6 topic files (entirely missing)

NEXT:
[ ] Progress tracker + Stripe integration + paywall
[ ] Loading states, SEO, analytics, legal pages, launch
```
