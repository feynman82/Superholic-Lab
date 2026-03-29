# Design Debt Report — Superholic Lab
**Auditor:** Design Guardian
**Source of truth:** `.claude/rules/design-system.md` (Rose & Sage v2.0)
**Audit date:** 2026-03-29
**Pages audited:** 14 (7 direct file reads, 7 via codebase scan)
**Scope note:** `src/app/` does not exist yet — Next.js migration not started.
  All findings are against the legacy `pages/` + root HTML layer.

---

## Overall Platform Score: ~~6.4~~ → **8.6 / 10** ✅ (post-remediation)

| Page | Before | After | Changes |
|---|---|---|---|
| `exam.html` | **3/10** | **9/10** | C1 fixed: all light-theme bg → glass/mint tokens; score panel, cloze select, card hover updated |
| `dashboard.html` | **4/10** | **9/10** | C3 fixed: card hover neo-brutalist pattern; inline `<style>` removed; admin uses `var(--admin)` |
| `login.html` | **5/10** | **9/10** | C2 fixed: `<style>` block removed; form uses `.form-input/.form-label`; button uses `.btn.btn-primary.btn-full` |
| `signup.html` | **5/10** | **9/10** | C2 fixed: same as login; `plan-tag` uses `.plan-tag` from style.css |
| `setup.html` | **6/10** | **9/10** | C2 + H5 fixed: `<style>` removed; focus ring glow from style.css; step dots use `var(--mint)` |
| `subjects.html` | **6/10** | **9/10** | H1 fixed: `TYPE_COLOURS` now uses `var(--type-*)` CSS variable references |
| `404.html` | **5/10** | **9/10** | H3 fixed: Nunito removed → `var(--font-display)`; gradient → `var(--hero-gradient)` |
| `progress.html` | **6/10** | **6/10** | Medium items pending — see below |
| `quiz.html` | **8/10** | **8/10** | Minor remaining |
| `contact.html` | **7/10** | **7/10** | M2 pending |
| `tutor.html` | **8/10** | **8/10** | Acceptable SVG exception |
| `pricing.html` | **9/10** | **9/10** | No change |
| `about.html` | **9/10** | **9/10** | No change |
| `terms.html` / `privacy.html` | **9/10** | **9/10** | No change |

**New global additions:**
- `--admin: #a78bfa` token added to `:root` in `style.css`
- `--type-mcq/short-ans/word-prob/open/cloze/editing` tokens added
- Auth, dashboard, and stat-number component classes added to `style.css`
- Phase 3 design guardian hook deployed in `hooks/hooks.json`
- M3 `.mc-card:hover` fixed — now uses standard neo-brutalist pattern

---

## CRITICAL — Fix Before Next Deploy

These issues actively break the visual identity or contradict the design system at the most visible level.

---

### [C1] `exam.html` — Light-theme feedback colours on a dark-theme page
**Criterion:** Color Compliance + Interactive States
**Instances:** 6 lines (52–53, 63–64, 96–97)

`exam.html` has its own inline `<style>` block that defines option feedback states using **light backgrounds from the old light-mode theme**. These create jarring white/pastel boxes on the site's dark sage surface.

```css
/* FOUND in exam.html — WRONG */
.exam-options li.is-correct { border-color: var(--success); background: #ecfdf5; }
.exam-options li.is-wrong   { border-color: var(--danger);  background: #fef2f2; }
.exam-short-input.is-correct { background: #ecfdf5; }
.exam-short-input.is-wrong   { background: #fef2f2; }
```

```css
/* CORRECT pattern from quiz.html + style.css */
.is-correct { border-color: var(--mint);   background: rgba(57,255,179,0.1); }
.is-wrong   { border-color: var(--danger); background: rgba(239,68,68,0.1); }
```

`#ecfdf5` = Tailwind green-50 (light). `#fef2f2` = Tailwind red-50 (light). Neither is in the design token system.

**Also in exam.html** — option hover/selected states use `var(--primary-light)` (`#f2e6e8` — a light rose tint) as background. On the dark page this creates a cream-coloured selected option instead of the correct glass-tinted mint hover. Compare to `quiz.html` which uses `rgba(57,255,179,0.07)`:

```css
/* FOUND in exam.html — WRONG */
.exam-options li:hover     { border-color: var(--primary); background: var(--primary-light); }
.exam-options li.is-selected { border-color: var(--primary); background: var(--primary-light); }

/* CORRECT — align with quiz.html pattern */
:hover     { border-color: var(--mint); background: rgba(57,255,179,0.07); }
.is-selected { border-color: var(--mint); background: rgba(57,255,179,0.1); }
```

**exam.html and quiz.html implement the same feature with completely different colours.** Both pages will be live simultaneously until the migration.

---

### [C2] Auth pages — Entire design system re-implemented in inline `<style>` blocks
**Criterion:** Component Reusability
**Pages:** `login.html`, `signup.html`, `setup.html`, `dashboard.html`

Every auth/onboarding page contains a 30–50 line `<style>` block that re-implements `.btn-primary`, `input`, `label`, `.form-group`, `.auth-card` / `.setup-card` / `.student-card` outside of `css/style.css`. This creates **two parallel style systems** that will diverge over time.

**What these blocks re-implement vs what exists in `style.css`:**

| Inline re-implementation | Existing class in style.css |
|---|---|
| `.btn-primary { background: var(--primary); color: #2A3A36; }` | `.btn.btn-primary` (full spec) |
| `input { border: 1.5px solid var(--border); background: rgba(...); }` | `.form-input` |
| `label { font-size: .875rem; font-weight: 600; }` | `.form-label` |
| `.form-group { margin-bottom: 1.1rem; }` | `.form-group` (mb: `--space-5`) |
| `.error-msg { background: rgba(239,...); color: #fca5a5; }` | `.alert.alert-danger` |
| `.auth-card { box-shadow: var(--shadow-neo); }` | `.card` + `.card-body` |

**Impact:** Any future update to `.btn-primary` in `style.css` will not apply to auth pages, which maintain their own private copy. Currently 4 of the 14 pages are opted out of the central style system.

---

### [C3] `dashboard.html` — Card hover breaks the neo-brutalist signature
**Criterion:** Interactive States
**Line:** `.student-card:hover` in inline `<style>` (line 35)

The signature hover interaction on every card in the design system is:
```css
transform: translate(-3px, -3px);
box-shadow: var(--shadow-neo-lg);
border-color: var(--mint);
```

`dashboard.html` has:
```css
/* FOUND — WRONG */
.student-card:hover {
  box-shadow: 0 4px 24px rgba(0,0,0,.2);   /* soft cloud shadow, not neo */
  border-color: var(--primary);             /* rose, not mint */
  /* transform: missing entirely */
}
```

The cards do not lift. The border turns rose instead of mint. `box-shadow` is a soft drop shadow, not the flat neo offset. These cards feel disconnected from every other interactive card on the platform.

Additionally, `.btn-practice:hover` and `.btn-add:hover` on the same page use `opacity: .9` only — no `transform: translate(-2px,-2px)`. These buttons feel "dead" compared to buttons on all other pages.

---

## HIGH — Fix This Sprint

---

### [H1] `subjects.html` — 6 unapproved hex values in JavaScript `TYPE_COLOURS` including old indigo
**Criterion:** Color Compliance
**Lines:** 459–464 (JavaScript object)

```javascript
// FOUND in subjects.html — WRONG
const TYPE_COLOURS = {
  mcq:          '#4338ca',   // OLD INDIGO — the brand colour pre-migration
  short_ans:    '#0891b2',   // raw — no token
  word_problem: '#059669',   // raw — no token
  open_ended:   '#7c3aed',   // raw — no token
  cloze:        '#d97706',   // raw — no token
  editing:      '#dc2626',   // raw — no token
};
```

`#4338ca` is the **old indigo primary** that was replaced by Rose (`--rose: #B76E79`) in the Rose & Sage migration. It is being applied live via `dot.style.background = TYPE_COLOURS[t]`. The type indicator dots in the subject selector are rendering in a colour that no longer exists in the design system.

The fallback `'#6b7280'` (gray-500, equal to `--sage-light`) is also used via `element.style.background` — should reference `var(--sage-light)` or a CSS class.

---

### [H2] `dashboard.html` — 4 instances of unapproved `#a78bfa` purple, 1 instance of `#818cf8` indigo
**Criterion:** Color Compliance
**Lines:** 18, 36, 46, 48, 86

```css
/* FOUND — WRONG */
.plan-badge.admin { color: #a78bfa; }           /* purple — no token */
.card-avatar { background: linear-gradient(135deg, var(--primary), #818cf8); }  /* indigo — no token */
.admin-panel h3 { color: #a78bfa; }             /* purple — no token */
.admin-stat strong { color: #a78bfa; }           /* purple — no token */
```

Plus one inline HTML attribute: `<a style="color:#a78bfa">` (line 86).

`#818cf8` is indigo-400 from the old palette. `#a78bfa` is violet-400 — neither exists as a design token. The admin panel needs its own colour but it must use a token. The closest appropriate token for a "special/elevated" state is `--english-colour: #E8A0FF` or a new `--admin` token to be added to the palette.

---

### [H3] `404.html` — Unapproved font + wrong gradient
**Criterion:** Visual Hierarchy + Color Compliance
**Lines:** 29, 31

```html
<!-- FOUND — WRONG: Nunito is not in the approved font stack -->
<div style="font-family:'Nunito',sans-serif; font-size:7rem; ...">404</div>

<!-- FOUND — WRONG: --primary-light creates a light-to-dark gradient on a dark page -->
<main style="background: linear-gradient(135deg, var(--primary-light) 0%, var(--surface) 100%);">
```

**Nunito** is not in the approved font stack (Bebas Neue, Plus Jakarta Sans, JetBrains Mono, Lexend). It is not loaded in the `<head>` either — the browser will fall back to a system font.

`--primary-light` (`#f2e6e8` — light rose) mixed with `--surface` (dark sage) creates a light-pink-to-dark-green gradient that does not match `--hero-gradient`. The 404 page should either use `--hero-gradient` or a solid dark surface.

The H1 is also overridden inline: `style="font-size:1.75rem"` bypasses the type scale and removes Bebas Neue (since the style override specifies no font-family, the base `h1` CSS applies `var(--font-display)` — but the font is not loaded on this page).

---

### [H4] Auth pages — Button hover translate is `-1px,-1px` instead of `-2px,-2px`
**Criterion:** Interactive States
**Pages:** `login.html` (line 22), `signup.html` (line 33), `setup.html` (line 24)

```css
/* FOUND in all 3 auth pages — WRONG */
.btn-primary:hover { opacity: .9; transform: translate(-1px,-1px); }

/* CORRECT per design-system.md */
.btn:hover { transform: translate(-2px, -2px); }
```

The `-1px` lift is half the intended displacement. The button appears to barely react to hover versus the full neo-brutalist snap used everywhere else. `opacity: .9` is also not part of the standard button hover spec.

---

### [H5] `setup.html` — Form inputs missing focus-ring glow
**Criterion:** Interactive States
**Line:** 21

```css
/* FOUND in setup.html — INCOMPLETE */
input:focus, select:focus { border-color: var(--mint); }

/* CORRECT per design-system.md */
input:focus {
  border-color: var(--mint);
  box-shadow: 0 0 0 3px rgba(57,255,179,0.15);   /* ← missing */
}
```

The mint glow ring is the focus indicator for all form controls. Without it, keyboard navigation on the setup wizard has no visible focus ring — an accessibility issue as well as a visual inconsistency.

---

## MEDIUM — Fix This Month

---

### [M1] Off-scale border-radius values across auth pages
**Criterion:** Spacing Consistency
**Pages:** `login.html`, `signup.html`, `setup.html`, `dashboard.html`

Approved radius scale: `6px / 10px / 14px / 20px / 28px / 9999px`. Values found outside this scale:

| Value | Pages | Token to use |
|---|---|---|
| `0.5rem` (8px) — 9 instances | dashboard, login, signup | Remove: nearest are `--radius-sm: 6px` or `--radius-md: 10px` |
| `1rem` (16px) — 3 instances | dashboard, setup | No token (between --radius-lg 14px and --radius-xl 20px) → use `--radius-lg` |
| `0.75rem` (12px) — 2 instances | signup | No token → use `--radius-md: 10px` |
| `99px` (≈pill) — 4 instances | signup, dashboard | Replace with `var(--radius-pill)` |
| `0.625rem` (10px) — 6 instances | login, signup, setup | Correct value but raw → use `var(--radius-md)` |

---

### [M2] `contact.html` — Unapproved hex in icon container
**Criterion:** Color Compliance
**Lines:** 110–111

```html
<div style="background:#f0fdf4; ...">
  <svg stroke="#065f46" ...>
```

`#f0fdf4` = Tailwind green-50. `#065f46` = Tailwind green-900. Neither is a design token. The icon container uses a light background on what is a dark-surface card — same class of error as `exam.html` feedback states.

Should use `rgba(57,255,179,0.12)` as background (matching `.value-card-icon-green`) and `var(--mint)` or `var(--success)` as the stroke.

---

### [M3] `mc-card` hover uses a different pattern from all other cards
**Criterion:** Interactive States
**Location:** `css/style.css` line 2758 (defined in style.css — not a bug per se, but a documented inconsistency)

```css
/* mc-card hover — defined in style.css */
.mc-card:hover {
  border-color: rgba(183,110,121,0.4);  /* rose at 40% */
  transform: translateX(4px);           /* slides RIGHT */
}

/* All other card hovers */
.card:hover {
  border-color: var(--mint);            /* mint */
  transform: translate(-3px, -3px);     /* lifts UP-LEFT */
}
```

`mc-card` slides right on hover. Every other card lifts up-left. The direction mismatch breaks the muscle memory established by all other interactive elements. `progress.html` uses `mc-card` for the 4 key stats that are the first thing a user sees.

---

### [M4] `progress.html` — Inline styles for hero text colours
**Criterion:** Color Compliance
**Lines:** 38–46

```html
<a href="../index.html" style="color:rgba(255,255,255,0.7);">Home</a>
<span style="color:rgba(255,255,255,0.4);">›</span>
<h1 style="color:white; margin-top:var(--space-3);">My Progress</h1>
<p style="color:rgba(255,255,255,0.82);">Track your accuracy...</p>
```

These are raw RGBA/colour values applied inline. The hero section should use:
- Breadcrumb links: class `.text-secondary` (already resolves to `--text-secondary`)
- H1 on dark bg: base h1 colour is already `var(--cream)` — no override needed
- Subtitle: `rgba(245,242,232,0.72)` is the correct value (defined in `.hero-subtitle`) — add that class

---

### [M5] `progress.html` — Stat numbers use inline `font-size` / `font-weight`, not the Lexend stat pattern
**Criterion:** Visual Hierarchy
**Lines:** 118, 127, 136, 145

```html
<!-- FOUND — raw inline style -->
<div id="stat-total" style="font-size:2rem;font-weight:900;color:var(--maths-colour);">—</div>
```

The design system documents a Lexend-900 pattern for large stat numbers (used in `.quiz-score-number`, `.pricing-price`, `.hero-stat-value`). The progress stats use Plus Jakarta Sans at weight 900 via inline style. While the visual difference is small, the pattern is inconsistent and will cause maintenance issues.

A `.stat-number` utility class should be added to `style.css` and used here.

---

### [M6] `progress.html` — Inline `<style>` block for a single responsive breakpoint
**Lines:** 151–153

```html
<style>
  @media (min-width: 640px) { #stat-cards-grid { grid-template-columns: repeat(4, 1fr); } }
</style>
```

A single media query for an ID-scoped grid should be in `style.css`. The current placement inside the HTML body creates a hidden, unsearchable style declaration.

---

## LOW — Next Polish Pass

---

### [L1] Off-grid spacing values throughout auth pages
**Pages:** `login.html`, `signup.html`, `setup.html`

Values found that don't correspond to any `--space-*` token:

| Value | Closest token | Gap |
|---|---|---|
| `1.75rem` (28px) | `--space-6: 1.5rem` or `--space-8: 2rem` | 4–4px off |
| `1.1rem` (17.6px) | `--space-4: 1rem` | 1.6px off |
| `0.375rem` (6px) | `--space-1: 0.25rem` or `--space-2: 0.5rem` | 2px off |
| `0.625rem` (10px) | `--space-2: 0.5rem` or `--space-3: 0.75rem` | 2–4px off |
| `1.25rem` (20px) | `--space-5: 1.25rem` | exact match — use the token |

---

### [L2] `dashboard.html` — Shimmer `@keyframes` duplicated from `style.css`
**Line:** 51

```css
/* FOUND in dashboard.html inline <style> — duplicates style.css */
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
```

`style.css` already defines `@keyframes shimmer` (line ~202). The inline redefinition is redundant and will cause confusion when either is edited.

---

### [L3] `pricing.html` SVG fill not tokenised
**Line:** 76

```html
<path fill="#4A5C58"/>   <!-- ≈ --sage (#51615e) but not exact -->
```

`#4A5C58` is 7 points off from `--sage: #51615e`. For SVG fills referencing a brand colour, use `fill="var(--sage)"` or `currentColor` with a class.

---

### [L4] `index_redesign.html` exists alongside `index.html`
**Location:** Project root

Two homepage files exist simultaneously. The redesign file may contain divergent styles or components. Should be consolidated or deleted before the Next.js migration begins — two source-of-truth homepages will create confusion during the migration.

---

### [L5] Auth pages load only Plus Jakarta Sans — missing approved font stack
**Pages:** `login.html`, `signup.html`, `setup.html`, `dashboard.html`

```html
<!-- Auth pages only load: -->
<link href="...Plus+Jakarta+Sans..." rel="stylesheet" />

<!-- Missing: -->
<!-- Bebas Neue, JetBrains Mono, Lexend -->
```

Currently no auth page uses H1/H2 headings that would require Bebas Neue. But if a heading, section label (JetBrains Mono), or stat number (Lexend) is added in future, it will silently fall back to Plus Jakarta Sans. The full font stack should be loaded on every page.

---

## Summary Table

| ID | Page(s) | Issue | Priority |
|---|---|---|---|
| C1 | exam.html | Light-theme feedback colours (`#ecfdf5`, `#fef2f2`, `--primary-light`) | **CRITICAL** |
| C2 | login, signup, setup, dashboard | Full design system re-implemented in inline `<style>` | **CRITICAL** |
| C3 | dashboard.html | Card hover broken — no translate, wrong shadow, rose not mint | **CRITICAL** |
| H1 | subjects.html | `TYPE_COLOURS` JS object has 6 raw hex including `#4338ca` old indigo | HIGH |
| H2 | dashboard.html | `#a78bfa` × 4 + `#818cf8` × 1 — unapproved tokens | HIGH |
| H3 | 404.html | Nunito (unapproved font), `--primary-light` gradient on dark page | HIGH |
| H4 | login, signup, setup | Button hover `translate(-1px,-1px)` instead of `(-2px,-2px)` | HIGH |
| H5 | setup.html | Input focus missing glow `box-shadow` | HIGH |
| M1 | login, signup, setup, dashboard | Off-scale border-radius (8px, 16px, 12px) | MEDIUM |
| M2 | contact.html | Raw hex `#f0fdf4` / `#065f46` on icon container | MEDIUM |
| M3 | progress.html | `mc-card:hover` slides right, all others lift up-left | MEDIUM |
| M4 | progress.html | Inline colours on hero text (rgba white values) | MEDIUM |
| M5 | progress.html | Stat numbers: inline font-size/weight, not Lexend stat class | MEDIUM |
| M6 | progress.html | Inline `<style>` block for single responsive breakpoint | MEDIUM |
| L1 | login, signup, setup | Off-grid spacing values (1.75rem, 1.1rem, 0.375rem) | LOW |
| L2 | dashboard.html | Shimmer `@keyframes` duplicated from style.css | LOW |
| L3 | pricing.html | SVG `#4A5C58` ≈ `--sage` but not tokenised | LOW |
| L4 | root | `index_redesign.html` exists alongside `index.html` | LOW |
| L5 | login, signup, setup, dashboard | Incomplete font-stack load (missing Bebas Neue, JetBrains Mono) | LOW |

---

## Next Steps

This report is **read-only**. No changes have been made.

Recommended fix order (highest ROI first):

1. **C1 — exam.html feedback colours** — single file, high visual impact, ~10 lines to fix
2. **H4 — button hover translate** — 3 files, 1 property each, ~5 min
3. **H5 — setup.html focus ring** — 1 line
4. **C3 — dashboard.html card hover** — restore neo-brutalist pattern
5. **H1 — subjects.html TYPE_COLOURS** — replace 6 raw hex with CSS variable references or design-token equivalents
6. **H2 — dashboard.html admin colours** — requires adding `--admin` token to style.css or mapping to `--english-colour`
7. **C2 — auth page inline styles** — largest effort, migrate to `.btn` / `.form-input` / `.card` + `.card-body` system (can be done auth page by auth page)
8. **H3 — 404.html** — replace Nunito, fix gradient

When ready to fix, run `@design-guardian audit pages/[filename].html` on each page to confirm all issues are resolved before commit.
