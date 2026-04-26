# Superholic Lab Styleguide

This document outlines the visual language and technical design lock for the Superholic Lab platform, detailing the 8-Point Grid, Glassmorphism utility tokens, and the ECC Framework Alignment.

## 1. The 8-Point Grid System

To ensure mathematical precision and consistency across all layouts, we strictly adhere to an 8-point grid. Every dimension, margin, padding, and gap must be a direct multiple of the 8-point base unit (8px). 

### CSS Variables
- `--space-1` = 8px
- `--space-2` = 16px
- `--space-3` = 24px
- `--space-4` = 32px
- `--space-5` = 40px
- `--space-6` = 48px
- `--space-8` = 64px
- `--space-10` = 80px

## 2. ECC Framework Alignment

All interfaces must enhance Engagement, Clarity, and Consistency.

### Typography
- **Headings (Bebas Neue):** Used for impactful titles and key numbers.
- **Body Text (Plus Jakarta Sans):** Used for all readable content, descriptions, and UI controls.

## 3. Design Lock: Stitch Glassmorphism

The platform employs a glassmorphism aesthetic tailored to our Sage and Rose palette. The blur and opacity ratios create a layered, depth-aware interface.

### Core Brand Colors
- **Sage:** `#51615E`
- **Rose:** `#B76E79`
- **Cream:** `#FFFDE7`

### Component Elevations (Z-Axis)

**Level 0 (Background / Foundation):**
- Standard backgrounds, Solid Sage, or Off-White.
- Textures applied to give depth.

**Level 1 (`.glass-panel-1`):**
- **Purpose:** Primary content containers (Dashboards, Question cards).
- **Style:** `backdrop-filter: blur(16px)`
- **Border:** 1px solid white at 40% opacity.
- **Background:** Tinted with Sage `rgba(81, 97, 94, 0.05)` or a light surface color.

**Level 2 (`.glass-panel-2`):**
- **Purpose:** Secondary containers, modals, overlays, nested content.
- **Style:** `backdrop-filter: blur(32px)`
- **Background:** Inner glow effect using `rgba(244, 251, 249, 0.8)` or translucent white for elevated contrast.

**Emphasis (`.glass-panel-rose`):**
- **Purpose:** Accentuate critical actions or highlighted states.
- **Background:** `rgba(183, 110, 121, 0.08)` with a translucent Rose border.

## 4. Component Standards

### Buttons
All buttons (`.btn`) inherit uniform padding, transitions, and the 8-point grid metrics:
- `.btn-primary`
- `.btn-secondary`
- `.btn-outline`
- `.btn-glass`

## 5. Icon System (v1)

A single set of 13 inline SVG icons used everywhere on the site. Companion files:

- **Vanilla pages:** `/public/js/icons.js` — exposes `window.shlIcon(name)` and auto-renders any element with `[data-icon="<name>"]`.
- **Next.js routes:** `src/components/icons/index.tsx` — exports `<Icon name="..." />` and the `IconName` union.

Both files contain identical SVG paths. Edits must stay in sync.

### Available icon names

`quest`, `quiz`, `tutor`, `exam`, `progress`, `diagnosis`, `roadmap`, `day`, `flame`, `shield`, `lock`, `play`, `chevron`

### Visual rules

- **Viewbox:** `0 0 24 24` for every icon.
- **Stroke:** `1.75` weight, `currentColor`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
- **Fills:** `none` by default; selected accents (`flame`, `shield`, `play`) carry a translucent `currentColor` fill at 8–18% opacity. The `chevron` is a single stroked path with no fill.
- **No hardcoded hex anywhere in the icon files.** Theming is done by setting the parent element's `color`.

### Theming convention

| Context | Recommended `color` |
|---|---|
| Active / call-to-action | `var(--brand-rose)` |
| Completed / success | `var(--brand-mint)` |
| Locked / muted | `rgba(227,217,202,0.4)` |
| Header / nav | `var(--cream)` |
| Streak indicator | `var(--brand-amber)` |

### Usage

**Vanilla — attribute form:**
```html
<span data-icon="quest" data-icon-size="24" style="color: var(--brand-rose);"></span>
```

**Vanilla — function form:**
```js
el.innerHTML = window.shlIcon('quiz', { size: 18 });
```

**Next.js / TSX:**
```tsx
import { Icon } from "@/components/icons"

<Icon name="quest" size={28} style={{ color: "var(--brand-rose)" }} title="Active quest" />
```

### When to add a new icon

Keep the set small. Before adding, ask:
1. Will this icon appear in 3+ places? If not, use an inline one-off SVG.
2. Does an existing icon already cover the concept (with a colour change)? If yes, reuse.
3. New icons must follow the same 24×24 stroke-1.75 currentColor rules and be added to **both** `/public/js/icons.js` and `src/components/icons/index.tsx` in the same commit.

## 6. Bottom navigation (v1)

The sticky bottom nav is the `<global-bottom-nav>` web component, defined in `/public/js/bottom-nav.js`. Pages drop in `<global-bottom-nav></global-bottom-nav>` once — no inline markup, no variants.

### Canonical 5-item layout

Practise → AI Tutor → Quest → Exam → Progress

**Every page** that needs a bottom nav uses this same component with no parameters — including `account.html`. Single canonical nav, no per-page customisation.

The **Quest** item is hidden by default and revealed only when `app-shell.js` finds an active `remedial_quests` row for the resolved student. While visible (and the user is not currently on `/quest`), the quest icon gets a 2.4s rose pulse-ring animation plus a small rose dot above it — signalling it as the user's next action.

### Public methods

- `bottomNavEl.setQuestActive(true|false)` — toggles the Quest item visibility.
- `bottomNavEl.setActive(slug)` — marks one item as `is-active`.

Both are called automatically by `app-shell.js`. Pages should not need to call them directly.

### Junior guardrail

For students at Primary 1 or Primary 2, `app-shell.js` hides the Exam item entirely. The web component does not need to know about this — it just renders the markup; the shell hides items by setting `display:none` on `.bottom-nav-item[data-slug="exam"]`.
