# Superholic Lab Styleguide

This document outlines the visual language and technical design lock for the Superholic Lab platform. It covers the 8-Point Grid, two parallel design layers (the existing v3.0 system and the new Architect-Scholar glassmorphism layer), and the ECC Framework.

**Two design layers, one CSS file.** Existing pages keep working unchanged. New pages opt into the Architect-Scholar layer for a more modern, masterclass aesthetic. See §7 for the migration plan that will eventually unify them.

---

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
- **Cream:** `#F9F6F0`

### Component Elevations (Z-Axis) — v3.0 layer

These are the existing `.glass-panel-*` components. They remain in use across the site.

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

- **Vanilla pages:** `/public/js/icons.js` — exposes `window.shlIcon(name)` and auto-renders any element with `[data-icon="<n>"]`.
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

---

## 7. Architect-Scholar Theme Layer (Glassmorphism v2)

Added 2026-04-26. Source: `src/design/architect-scholar.css` (Stitch "Sage Rose ECC Redesign"). This is the new default for new pages and the target style for the eventual site-wide migration. **Existing pages are unaffected** — the layer is purely additive. Every architect-scholar token is an alias pointing to the existing brand tokens, and every component is opt-in via a new class name.

### Philosophy: Quiet Luxury EdTech

The Architect-Scholar theme borrows the restraint of high-end editorial design and filters it through an academic lens. No flashy gradients or emoji-heavy marketing. Instead: a light, airy surface, two strong brand anchors (Sage and Rose), and glassmorphism used sparingly at two precise elevation levels.

The name is intentional. An architect thinks in structure and proportion before decoration. A scholar values clarity over cleverness. Every component decision flows from that.

### Design pillars

1. **One dominant, one punctuation.** Sage sets the mood. Rose punctuates it. A page should feel predominantly sage (cool, focused) with rose appearing exactly where you want the eye to go. If everything is rose, nothing is.
2. **Two blur levels, no third.** `--blur-1` (16px) for cards. `--blur-2` (32px) for modals. Never invent a third.
3. **Asymmetric grid.** Editorial 7+5 splits read more scholarly than 6+6.
4. **Bebas Neue is for headings only.** Display face only. Never below h2 (32px). Never for body, labels, or anything requiring small-size readability — Plus Jakarta carries that weight.
5. **White space is the primary luxury signal.** When in doubt, add more `--space-6` between sections, not less.

### Surface scale (sage-tinted, deliberately light)

New Material-3-inspired tokens, available alongside existing `--bg-page`/`--bg-surface`. Use these on new pages where a sage-tinted page background and consistent depth hierarchy matter.

| Token | Hex | Use |
|---|---|---|
| `--surface` | `#f4fbf9` | Page background, sage tint |
| `--surface-container-low` | `#eef5f3` | Section backgrounds, subtle panels |
| `--surface-container` | `#e8efed` | Cards on white |
| `--surface-container-high` | `#e3eae8` | Card hover, elevated panels |
| `--surface-container-highest` | `#dde4e2` | Strongest non-glass panel |
| `--surface-container-lowest` | `#ffffff` | Pure white — inset elements |

Use in order of depth: a page is `--surface`, a sidebar is `--surface-container-low`, a card is `--surface-container`, a card's header is `--surface-container-high`.

### Token aliases (Architect-Scholar → existing brand tokens)

| Architect-Scholar | Resolves to | Notes |
|---|---|---|
| `--sage` | `var(--brand-sage)` | `#51615E` |
| `--sage-darker` | `var(--sage-dark)` | `#3A4E4A` |
| `--sage-charcoal` | `var(--text-main)` | `#2C3E3A` |
| `--rose` | `var(--brand-rose)` | `#B76E79` |
| `--rose-dark` | `var(--brand-rose-hover)` | `#A05D67` |
| `--off-white` | `var(--bg-page)` | `#F9FAFA` |
| `--on-surface` | `var(--text-main)` | Body text |
| `--on-surface-variant` | `var(--text-muted)` | Muted text |
| `--outline` | `var(--border-dark)` | Strong borders |
| `--outline-variant` | `var(--border-light)` | Soft borders |

New HTML written against the architect-scholar guide can use either name. Existing HTML continues to use the brand tokens.

### Glassmorphism cards (opt-in)

Three new variants, separate from the existing `.glass-panel-*` system. Use these on new pages.

| Class | Background | Use |
|---|---|---|
| `.card-glass` | `--glass-bg` (white 40%) + `--blur-1` | Cards on light surface backgrounds |
| `.card-glass-dark` | `--glass-bg-dark` (sage 55%) + `--blur-1` | Cards on sage / charcoal sections |
| `.card-glass-overlay` | white 65% + `--blur-2` | Modals, dialogs, full-screen overlays |

**Hover:** `.card-glass` lifts on hover via `transform: translateY(-2px)` and a softer shadow. Keep the lift subtle — never the neo-brutalist 4+4px offset. This is a quiet theme.

### Buttons

The existing `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-outlined` system remains. For architect-scholar pages, follow this discipline:

- **One `.btn-primary` per page section** — ever. Subscribe, Start Quiz, Submit. If everything is primary, nothing is.
- `.btn-secondary` for navigation-level actions: Back, Filter, View Details. Multiple per page is fine.
- `.btn-ghost` for tertiary: Cancel, Dismiss, Skip.

### Inputs (opt-in)

Two new input styles for architect-scholar pages, separate from the existing `.form-input`.

| Class | Style | Use |
|---|---|---|
| `.input-underline` | Bottom border only, transparent bg | Open, airy forms — search bars, hero search, inline forms |
| `.input-ghost` | Glass-bg surface, soft border | Contained forms — login, signup, quiz answer input |

Both use `--brand-rose` as the focus color (border + ring), reinforcing rose-as-action throughout the system.

### Badges

The existing `.badge`, `.badge-info`, `.badge-success`, `.badge-amber`, `.badge-danger`, `.badge-glass`, `.badge-rose-solid`, `.badge-maths`, `.badge-dark-mint`, `.badge-xs` all remain.

Three new architect-scholar variants for category and brand-anchor labelling:

| Class | Use |
|---|---|
| `.badge-sage` | Category labels, level indicators (Primary 6) |
| `.badge-rose` | Status indicators, "New", "HOTS" |
| `.badge-neutral` | Metadata — date, duration |

### Typography classes (opt-in)

The existing `.font-display` class continues to apply Bebas with 0.04em letter-spacing and uppercase. These add explicit per-tier classes for architect-scholar pages:

| Class | Size | Font | Tracking |
|---|---|---|---|
| `.display-xl` | 80px | Bebas Neue | 0.02em |
| `.h1-as` | 48px | Bebas Neue | 0.04em |
| `.h2-as` | 32px | Bebas Neue | 0.05em |
| `.body-lg` | 18px | Plus Jakarta Sans | — |
| `.body-md` | 16px | Plus Jakarta Sans | — |
| `.label-caps` | 12px | Plus Jakarta Sans 700 | 0.1em |

**`.label-caps`** is the workhorse all-caps label for new pages. Use for section eyebrows ("MATHEMATICS · PRIMARY 6"), table headers, badge text. Plus Jakarta — never Bebas — at 12px because readability at small sizes requires a humanist sans, not a display face.

### Bebas Neue restriction (rule for new pages)

**Bebas Neue is a display font. Never use it below h2 (32px).** Never for body copy, labels, or anything requiring high readability at small sizes. Use Plus Jakarta Sans for everything ≤ 20px.

*This rule applies to new pages written against the architect-scholar layer. Existing pages that use `.font-display` on small elements (card sub-headings, stat labels) are not in scope for retroactive changes — they will be addressed when those pages are migrated.*

### Layout — asymmetric grid

New pages opt into the wider container with `.container-as` (1280px max-width). The existing `.container` (1000px) is unchanged for existing pages.

The `.grid-12` 12-column grid is the structural foundation. Architect-scholar favours **asymmetric** layouts — a 7+5 split reads more scholarly than 6+6.

```html
<!-- Preferred: editorial asymmetry -->
<div class="grid-12">
  <div style="grid-column: span 7">Primary content</div>
  <div style="grid-column: span 5">Sidebar / supplementary</div>
</div>
```

The `.grid-texture` and `.grid-texture-lg` utilities overlay a subtle architectural drawing-grid pattern. Use **once per page on the hero** as the visual signature. Don't scatter across every section.

### Other architect-scholar utilities

| Class | Use |
|---|---|
| `.bg-surface` | Apply sage-tinted page background |
| `.bg-surface-container` | Apply card-tier sage background |
| `.bg-charcoal` | Dark charcoal section bg with light text |
| `.text-sage` | Sage text colour |
| `.text-faint` | Outline-grey text for de-emphasis |
| `.gauge` | Pure-CSS circular progress (override `--gauge-pct: 0.78` per instance) |
| `ul.rose-list` | Rose ▸ bullet list for feature lists / learning objectives |

### Quick reference — when to use what

| Situation | Solution |
|---|---|
| Page hero panel (new page) | `.grid-texture-lg` bg + `.display-xl` heading + one `.btn-primary` |
| Content card on white page (new page) | `.card-glass` with `--blur-1` |
| Content card on sage bg (new page) | `.card-glass-dark` with `--blur-1` |
| Section eyebrow (new page) | `.label-caps` in rose (`color: var(--brand-rose)`) |
| Existing page card | Keep using `.card` (unchanged) |
| Existing page glass panel | Keep using `.glass-panel-1`/`.glass-panel-2` (unchanged) |
| Modal / dialog | `.card-glass-overlay` with `--blur-2` |
| Form on light bg (new page) | `.input-ghost` |
| Search / inline input | `.input-underline` |
| Category / level badge | `.badge-sage` |
| Status / achievement badge | `.badge-rose` |

### What not to do

- **Never** use Bebas Neue below h2 size or for any label/body copy on new pages
- **Never** add a third blur level — the two-level system (`--blur-1`, `--blur-2`) is intentional
- **Never** use more than one `.btn-primary` per page section
- **Never** hard-code a hex value or `rgba()` in HTML `style=` attributes — every colour must reference a CSS variable in a page-level `<style>` block at minimum
- **Never** use rose for large background fills — it is an accent, not a surface
- **Never** stack multiple glass card variants on the same background — pick one and be consistent
- **Never** reduce letter-spacing on `.label-caps` or button text — the tracking is load-bearing for the scholarly feel

### Migration plan — eventual site-wide unification

The long-term direction (per design discussion 2026-04-26) is for `.card` itself to default to the glass variant, so the entire site shares the architect-scholar aesthetic without per-page opt-in. We are deliberately **not** doing that yet because we are still building the framework and need stability.

**When the migration happens:**

1. **Audit phase.** Walk every page that uses `.card`. Verify the card content remains legible against the page background once `.card` becomes glass (specifically: text colour contrast against the new sage-tinted surface).
2. **Swap phase.** Change the `.card` body in `style.css` to use `--glass-bg` + `--blur-1` + the glass border + the soft shadow. Existing `.card-glass`, `.card-glass-dark`, `.card-glass-overlay` continue to be the explicit elevation variants.
3. **Escape hatch.** Introduce a `.card-solid` class for the rare element that genuinely needs a solid background after the migration (e.g. high-contrast modal forms).
4. **Container.** Decide whether to widen the global `.container` from 1000px to 1280px, or keep both. `.container-as` exists today for new pages.
5. **Bebas Neue audit.** Sweep existing pages for Bebas usage on elements smaller than h2 and replace with Plus Jakarta + `.label-caps` where appropriate.

Until that migration ships, both layers coexist. New pages should write directly against the architect-scholar layer. Existing pages should not be touched purely for styling reasons during the framework-build phase.
