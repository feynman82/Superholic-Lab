# Design System — Superholic Lab
# "Rose & Sage" v2.0 — Extracted from css/style.css
# Last updated: 2026-03-29
#
# SOURCE OF TRUTH: css/style.css is the single stylesheet.
# This file documents what IS there — not aspirational rules.
# Never create a second CSS file. All new styles go in style.css.
# =======================================================================

## 1. Theme Identity

**Name:** Rose & Sage — "Engagement · Clarity · Consistency"
**Aesthetic:** Dark glassmorphism. Muted sage greens, antique cream text,
rose/peach CTAs, neon mint as the interactive accent.
**Mood:** Premium EdTech — trustworthy but energetic. Not corporate-flat.

---

## 2. Color Palette (CSS Variables)

All colours must be referenced by variable name. Never use a raw hex value.

### 2.1 Sage — Background & Surfaces
```css
--sage:          #51615e   /* base surface */
--sage-dark:     #4a5a57   /* page background, panel bg */
--sage-darker:   #3A4E4A   /* deepest panels, hero bg */
--sage-light:    #7a8f8c   /* secondary text, muted labels */
--sage-surface:  #526663   /* card surfaces on sage bg */
```

### 2.2 Cream — Primary Text & Light Surfaces
```css
--cream:         #e3d9ca   /* primary text on dark bg */
--cream-dim:     #c8bfb2   /* dimmed cream */
--white:         #ffffff   /* pure white (light sections) */
--off-white:     #f9f7f4   /* warm off-white section bg */
--text-dark:     #2a2a2a   /* headings on white sections */
--text-body:     #4a4a4a   /* body text on white sections */
```

### 2.3 Brand Accents
```css
--rose:          #B76E79   /* Antique Rose — PRIMARY CTA colour */
--rose-dark:     #9d5a64   /* Rose hover state */
--rose-light:    #f2e6e8   /* Rose tint (white sections) */

--peach:         #B88078   /* Terracotta Peach — secondary accent, progress */
--peach-light:   #f2e9e8   /* Peach tint (white sections) */
```

### 2.4 UI Accent — Mint (Interactive States)
```css
--mint:          #39FFB3   /* quiz correct, active states, hover borders */
--mint-glow:     rgba(57,255,179,0.35)
```
**Mint is the interactive accent.** Hover borders, active nav items, progress bars,
correct answers, section labels, and CTA glows all use mint.

### 2.5 Amber (Warnings, Streaks, Featured)
```css
--amber:         #FFB830   /* streaks, warnings, featured card borders */
--amber-glow:    rgba(255,184,48,0.35)
```

### 2.6 Subject Accent Colours (inside subject cards only)
```css
--maths-colour:   #7EB8FF   /* blue */
--science-colour: #39FFB3   /* mint (same as --mint) */
--english-colour: #E8A0FF   /* purple */
```

### 2.7 Semantic Colours
```css
--success:  #10b981   /* green — non-quiz success states */
--danger:   #ef4444   /* red  — errors, destructive actions */
```

### 2.7a Admin Accent (Dashboard admin panel only)
```css
--admin:    #a78bfa   /* violet — admin-role UI only. DO NOT use in content pages. */
```
Use `color: var(--admin)` and `background: rgba(167,139,250,0.15)` for admin badge/panel.

### 2.7b Question Type Dot Colours (subjects.html topic selector)
```css
--type-mcq:       var(--rose)           /* MCQ — brand CTA colour */
--type-short-ans: var(--maths-colour)   /* Short answer — maths blue */
--type-word-prob: var(--success)        /* Word problem — green */
--type-open:      var(--english-colour) /* Open-ended — purple */
--type-cloze:     var(--amber)          /* Cloze — amber */
--type-editing:   var(--danger)         /* Editing — danger red */
```
In JS, use `element.style.background = 'var(--type-mcq)'` — never inline hex.

### 2.8 Glassmorphism Tokens
```css
--glass:         rgba(227,217,202,0.07)    /* card/panel fill */
--glass-border:  rgba(227,217,202,0.16)    /* card/panel border */
--border-light:  rgba(227,217,202,0.08)    /* softer dividers */
```

### 2.9 Legacy Aliases (kept for compatibility — prefer originals)
```css
--primary:       var(--rose)         /* maps to rose, not old indigo */
--primary-light: var(--rose-light)
--primary-dark:  var(--rose-dark)
--accent:        var(--peach)
--accent-green:  var(--mint)
--text-primary:  var(--cream)
--text-secondary: var(--sage-light)
--bg:            var(--sage-dark)
--border:        var(--glass-border)
```

### 2.10 Hero Gradient
```css
--hero-gradient: linear-gradient(135deg, #3A4E4A 0%, #2E403C 50%, #263530 100%)
```

### 2.11 Difficulty Badge Tokens (dark-bg variant)
```css
--badge-foundation-bg:    rgba(16,185,129,0.12)  --badge-foundation-text: #34d399
--badge-standard-bg:      rgba(126,184,255,0.12) --badge-standard-text:   #7EB8FF
--badge-advanced-bg:      rgba(255,184,48,0.12)  --badge-advanced-text:   #FFB830
--badge-hots-bg:          rgba(232,160,255,0.12) --badge-hots-text:       #E8A0FF
```

---

## 3. Typography

### 3.1 Font Families
```css
--font-display: 'Bebas Neue', 'Plus Jakarta Sans', sans-serif
--font-body:    'Plus Jakarta Sans', sans-serif
```
Plus mono labels (JetBrains Mono) and stat numbers (Lexend) used selectively.

| Usage | Font | Where |
|---|---|---|
| H1, H2 | Bebas Neue | Page titles, hero headings |
| H3–H6 | Plus Jakarta Sans 700 | Section headings, card titles |
| Body | Plus Jakarta Sans 400 | All paragraph text |
| Labels, eyebrows, mono tags | JetBrains Mono 700 | Section tags, pricing ribbons, quiz counters |
| Large stat numbers | Lexend 900 | Score display, pricing prices, hero stats |

### 3.2 Type Scale

| Element | Size | Weight | Line-height |
|---|---|---|---|
| h1 (mobile) | 2.25rem | Bebas (inherent) | 1.1 |
| h1 (≥640px) | 2.75rem | — | — |
| h1 (≥1024px) | 3.25rem | — | — |
| h2 (mobile) | 1.75rem | Bebas | 1.1 |
| h2 (≥640px) | 2rem | — | — |
| h2 (≥1024px) | 2.25rem | — | — |
| h3 | 1.125rem | 700 | 1.3 |
| h4 | 1rem | 700 | 1.3 |
| Body | 1rem | 400 | 1.6 |
| Small / .text-sm | 0.875rem | — | — |
| .text-xs | 0.75rem | — | — |
| Quiz question text | 1.125rem | 500 | 1.6 |
| Section label tag | 0.7rem | 700 | — |
| Badge | 0.68rem | 700 | — |
| Nav links | 0.875rem | 600 | — |
| Button | 0.9rem | 700 | 1 |
| Input | 0.9375rem | 400 | — |

### 3.3 Letter-spacing
- Display headings (h1/h2): `letter-spacing: 0.04em`
- Eyebrow/section labels: `letter-spacing: 0.12em–0.14em`
- Badges: `letter-spacing: 0.06em`
- Nav links: `letter-spacing: 0.04em`

### 3.4 Text Utility Classes
```
.text-sm          0.875rem
.text-xs          0.75rem
.text-secondary   color: --text-secondary
.text-white       color: --white
.text-success     color: --success
.text-danger      color: --danger
.text-center      text-align: center
.font-bold        font-weight: 700
.font-semibold    font-weight: 600
.font-medium      font-weight: 500
.font-mono        Courier New monospace
```

---

## 4. Spacing System

Base unit: 0.25rem (4px). Scale:

```css
--space-1:   0.25rem   /*  4px */
--space-2:   0.5rem    /*  8px */
--space-3:   0.75rem   /* 12px */
--space-4:   1rem      /* 16px */
--space-5:   1.25rem   /* 20px */
--space-6:   1.5rem    /* 24px */
--space-8:   2rem      /* 32px */
--space-10:  2.5rem    /* 40px */
--space-12:  3rem      /* 48px */
--space-14:  3.5rem    /* 56px */
--space-16:  4rem      /* 64px */
```

**Standard page section padding:** `--space-16` top and bottom (`.section`).
**Standard card body padding:** `--space-6`.
**Standard card header/footer:** `--space-5/--space-6` horizontal, `--space-4/--space-5` vertical.

---

## 5. Border Radius

```css
--radius-sm:   6px
--radius-md:   10px
--radius-lg:   14px     ← default card radius
--radius-xl:   20px     ← large cards, subject cards, pricing
--radius-2xl:  28px
--radius-pill: 9999px   ← badges, pills, tags
--radius-full: 9999px   ← same as pill
--radius:      14px     ← alias for radius-lg
```

---

## 6. Shadows

Neo-brutalist offset shadows are the signature style.

```css
--shadow-neo:    4px 4px 0px rgba(42,42,42,0.18)    ← default card shadow
--shadow-neo-lg: 6px 6px 0px rgba(42,42,42,0.22)    ← hover state

--shadow-card:   0 4px 24px rgba(0,0,0,0.12)
--shadow-sm:     0 2px 8px rgba(0,0,0,0.2)
--shadow-md:     0 6px 20px rgba(0,0,0,0.25)
--shadow-lg:     0 16px 40px rgba(0,0,0,0.3)
--shadow-glow:   0 0 24px var(--mint-glow)
```

**Rule:** Cards default to `shadow-neo`. On hover, upgrade to `shadow-neo-lg`
and apply `transform: translate(-3px, -3px)`. This creates the neo-brutalist
"lift" effect that is the platform's interaction signature.

---

## 7. Transitions

```css
--transition:       150ms ease          ← fast (hover colour changes)
--transition-md:    250ms ease          ← medium (card hover, accordion)
--transition-slow:  400ms cubic-bezier(0.16,1,0.3,1)  ← spring (page reveals)
```

Animation delay utilities: `--delay-1` (0ms) → `--delay-5` (400ms)

---

## 8. Buttons

Base class `.btn` always required. Modifier class sets the variant.

### Button Variants

| Class | Background | Text | Border | Use case |
|---|---|---|---|---|
| `.btn-primary` | `--rose` | white | rose | Primary CTA |
| `.btn-secondary` | `--glass` | cream | `--glass-border` | Secondary action |
| `.btn-danger` | `#ef4444` | white | danger | Destructive |
| `.btn-ghost` | transparent | cream | transparent | Tertiary/subtle |
| `.btn-gradient` / `.btn-mint` | `--mint` | `#1A2E2A` | none | Unlock/special action |
| `.btn-white` | `--glass` | cream | `--glass-border` | On dark bg |

### Button Hover Behaviour
All buttons: `transform: translate(-2px, -2px)` on hover (neo-brutalist lift).
Active state resets transform to 0.
Disabled: `opacity: 0.45`, `cursor: not-allowed`, no transform.

### Button Sizes

| Class | Padding | Font | Min-height |
|---|---|---|---|
| `.btn-sm` | 0.4375rem × --space-4 | 0.8125rem | 36px |
| default | 0.6875rem × --space-5 | 0.9rem | 44px |
| `.btn-lg` | 0.9375rem × --space-8 | 1rem | 52px |
| `.btn-full` | (adds width: 100%) | — | — |

**Min-height 44px** on default buttons — WCAG mobile tap target requirement.

### Loading State
`.btn.is-loading` — hides text, shows a spinning white border-circle via `::after`.

---

## 9. Cards

Base `.card` = glass panel. Always has neo shadow + glassmorphism blur.

```css
background:       var(--glass)         /* translucent cream fill */
border:           1.5px solid var(--glass-border)
border-radius:    var(--radius-lg)     /* 14px */
box-shadow:       var(--shadow-neo)
backdrop-filter:  blur(12px)
```

### Card Sections
```
.card-header   padding: --space-5 --space-6 | border-bottom: glass-border
.card-body     padding: --space-6           | z-index: 1 (above ::before overlay)
.card-footer   padding: --space-4 --space-6 | border-top: glass-border | bg: rgba(0,0,0,0.15)
```

### Card Hover (neo-brutalist lift)
```css
transform:    translate(-3px, -3px)
box-shadow:   var(--shadow-neo-lg)
border-color: var(--mint)
```
Suppress hover with `.no-hover` class.

### Subject Colour Accent (top border)
```css
.card-maths    { border-top: 3px solid var(--maths-colour);   }
.card-science  { border-top: 3px solid var(--science-colour); }
.card-english  { border-top: 3px solid var(--english-colour); }
```

### Featured Card
```css
.card-featured  border-color: --amber, border-width: 2.5px
                box-shadow: amber glow ring + shadow-neo
```

### Subtle Mint Overlay
Every `.card` has a `::before` pseudo-element with a subtle mint gradient:
```css
background: linear-gradient(135deg, rgba(57,255,179,0.03) 0%, transparent 60%)
```
This must not be removed — it is part of the card's visual identity.

---

## 10. Badges

Base `.badge` = pill shape, glassmorphism-aware.

```css
padding:       0.25rem 0.75rem
font-size:     0.68rem
font-weight:   700
border-radius: var(--radius-full)
letter-spacing: 0.06em
```

### Difficulty Badges (quiz content)
```
.badge-foundation  bg: rgba(16,185,129,0.12)   text: #34d399    border: rgba(57,255,179,0.25)
.badge-standard    bg: rgba(126,184,255,0.12)  text: #7EB8FF    border: rgba(126,184,255,0.25)
.badge-advanced    bg: rgba(255,184,48,0.12)   text: #FFB830    border: rgba(255,184,48,0.25)
.badge-hots        bg: rgba(232,160,255,0.12)  text: #E8A0FF    border: rgba(232,160,255,0.25)
```

### Semantic Badges
```
.badge-success  mint bg/text
.badge-danger   red bg/text
.badge-info     blue bg/text (maths colour)
.badge-amber    amber bg/text
.badge-moe      mint — "MOE-Aligned" trust badge (0.75rem, slightly larger)
```

---

## 11. Forms

### Input / Select / Textarea
```css
background:   var(--glass)
border:       1.5px solid var(--glass-border)
border-radius: var(--radius-md)        /* 10px */
color:        var(--cream)
font-size:    0.9375rem
min-height:   44px                     /* WCAG tap target */
backdrop-filter: blur(8px)
```

Focus ring:
```css
border-color: var(--rose)
box-shadow:   0 0 0 3px rgba(183,110,121,0.2)   /* rose glow */
```

Error state: `border-color: var(--danger)`, `box-shadow` uses red glow.

Placeholder colour: `rgba(245,242,232,0.35)` — cream at 35% opacity.

### Form Structure Classes
```
.form-group    flex column, gap --space-2, mb --space-5
.form-label    0.875rem, weight 500, cream
.form-error    0.8125rem, --danger
.form-hint     0.8125rem, --text-secondary
```

---

## 12. Quiz Option States

```css
.quiz-option              glass bg, glass border, cream text, min-height 58px
.quiz-option:hover        mint border, mint tint bg, translateX(3px) + left mint shadow
.quiz-option.is-correct   mint border + bg, correctPulse animation
.quiz-option.is-wrong     danger border + bg, wrongShake animation
.quiz-option.is-dimmed    opacity 0.4, pointer-events none
```

### Option Key Badge (A/B/C/D circle)
```css
width/height: 34px
border-radius: 50%
font-family:  JetBrains Mono
font-size:    0.875rem, weight 700
```
Correct: mint fill. Wrong: danger fill + white text.

### Quiz Explanation Panel
```css
border-left:  4px solid var(--amber)    /* neutral explanation */
background:   rgba(255,184,48,0.07)
```
Variants:
- `.is-correct-explanation` → mint left border + mint tint
- `.is-wrong-explanation` → danger left border + red tint

### Progress Bar
```css
background:  linear-gradient(90deg, var(--mint), #00e5a0)
box-shadow:  0 0 8px rgba(57,255,179,0.5)
transition:  width 0.5s cubic-bezier(0.16,1,0.3,1)
```

---

## 13. Navigation

### Top Navbar
- Sticky, `z-index: 200`
- Default: `rgba(74,92,88,0.75)` + `backdrop-filter: blur(16px)`
- On scroll (`.is-scrolled`): `rgba(58,78,74,0.92)` + bottom shadow
- Transparent variant (`.is-transparent`): over hero, no bg, no blur
- Height: `66px`
- Nav links: underline slide animation on hover using `::after` + mint

### Bottom Nav (mobile → sidebar desktop)
- Mobile: fixed bottom bar, `backdrop-filter: blur(16px)`
- Desktop (≥768px): fixed left sidebar, `80px` wide, `top: 66px`, full height
- Active item colour: `var(--mint)`
- Inactive: `var(--sage-light)`

---

## 14. AI Tutor Chat Bubbles

| Bubble | Style |
|---|---|
| User message `.chat-bubble-user` | Amber fill (`--amber`), dark text `#2A3A36`, `border-bottom-right-radius: --radius-sm` |
| Tutor message `.chat-bubble-tutor` | Glass fill, cream text, glass border, `border-bottom-left-radius: --radius-sm` |
| Typing indicator | 3 mint dots, `typing` keyframe animation, 0.2s stagger |
| Chat input focus | Mint border + `0 0 0 3px rgba(57,255,179,0.15)` glow |

---

## 15. Animations & Keyframes

| Keyframe | Use |
|---|---|
| `fadeUp` | Page-load stagger (`.animate-in`) — `opacity 0 → 1`, `translateY(24px → 0)` |
| `revealUp` | Scroll-reveal (`.reveal`) — same as fadeUp, triggered by IntersectionObserver |
| `float` / `floatSlow` | Hero background decorative elements |
| `correctPulse` | Green ring pulse on correct quiz option |
| `wrongShake` | Horizontal shake on wrong quiz option |
| `shimmer` | Skeleton loading state |
| `confettiFall` | Score screen celebration |
| `countUp` | Score number entrance |
| `mintPulse` | Hero eyebrow pulsing dot |
| `spin` | Button loading spinner |

### Utility Classes
```
.animate-in          Page-load fadeUp entrance
.animate-in.delay-N  Stagger delays (delay-1 to delay-5: 0–400ms)
.reveal              Scroll-reveal — JS adds .revealed on viewport enter
.reveal-group        Parent that staggers its children's reveals
.float               4s float loop
.float-slow          7s float loop
.float-delay         1.5s animation-delay
.quiz-correct-anim   correctPulse once
.quiz-wrong-anim     wrongShake once
```

---

## 16. Layout

### Container
```css
max-width: 1200px, centered
padding: --space-4 (mobile) → --space-6 (≥640px) → --space-8 (≥1024px)
```

### Responsive Grid
```
.grid-2   1 col mobile → 2 col ≥640px
.grid-3   1 col mobile → 3 col ≥768px
.grid-4   1 col mobile → 2 col ≥640px → 4 col ≥768px
gap:      --space-6
```

### Breakpoints
```
≥480px   small mobile
≥640px   large mobile / small tablet
≥768px   tablet (navbar shows, bottom-nav becomes sidebar)
≥1024px  desktop
```

---

## 17. Section / Page Patterns

### Hero Section
- Full-viewport height (`min-height: 100svh`)
- Background: `--hero-gradient`
- Radial mint glow `::before` (top-right) + amber glow `::after` (bottom-left)
- Floating emoji symbols (`.hero-symbol`) at 18% opacity
- Eyebrow tag: JetBrains Mono, mint, pill shape, pulsing dot

### Section Label Tag
```css
background:    rgba(57,255,179,0.1)   /* mint tint */
color:         var(--mint)
font-family:   JetBrains Mono
font-size:     0.7rem
letter-spacing: 0.14em
text-transform: uppercase
border:        1px solid rgba(57,255,179,0.2)
```

### Wave Dividers
SVG wave shapes at section boundaries, `height: 70px` mobile → `90px` desktop.

---

## 18. What NOT to Do

- **Never** hardcode a hex value — always use a CSS variable
- **Never** create a second CSS file — all styles go in `css/style.css`
- **Never** use the old indigo primary (`#4338ca`) — the brand has migrated to Rose (`--rose: #B76E79`)
- **Never** use `#818cf8` (old indigo-400) — use `var(--english-colour)` for purple accents
- **Never** use `#a78bfa` directly — use `var(--admin)` and only in admin UI components
- **Never** assign hex values in JavaScript — use `element.style.background = 'var(--token-name)'`
- **Never** use a non-approved font weight (approved: 400, 500, 600, 700, 800 for Jakarta Sans)
- **Never** override `backdrop-filter` on cards without explicit need — it is part of the glass identity
- **Never** use `box-shadow` without the neo offset pattern for interactive cards
- **Never** write a hover state that doesn't include the `-3px, -3px` translate for card-type elements
