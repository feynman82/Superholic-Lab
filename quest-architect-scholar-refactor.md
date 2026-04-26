# Claude Code Prompt — Quest Page Refactor (Architect-Scholar Migration)

> Paste this entire file into Claude Code in `D:\Git\Superholic-Lab`. Run `git pull` first to make sure local is in sync with origin/main (commit `640fc15` — architect-scholar layer).

---

## Mission

Refactor `src/app/quest/QuestClient.tsx` and `src/app/quest/components/ReturningCelebration.tsx` to comply with `STYLEGUIDE.md` §7 (Architect-Scholar Theme Layer) and use the new tokens/utility classes in `public/css/style.css`. **Visual changes are deliberate and significant** — quest is moving from dark gaming to light scholarly. Behavioural and structural changes are NOT in scope: every component, prop, animation timing, demo-mode flow, `?demo=returning` URL handling, and Framer Motion entrance must continue to work identically.

This is the **template page** for the eventual site-wide architect-scholar migration. Get this one right and we replicate the patterns to other pages.

---

## Required reading (do this first, in order)

1. `STYLEGUIDE.md` — full file. Pay attention to §7, especially the "Quick reference" table and "What not to do" list.
2. `public/css/style.css` — read the bottom of the file (search for `ARCHITECT-SCHOLAR LAYER`). Sections AS.1 through AS.9 are the new opt-in layer.
3. `CLAUDE.md` — the Tech Stack and ECC Framework sections.
4. `src/app/quest/page.tsx` — the server wrapper. **Do not modify.** It just passes hardcoded sample props.
5. `src/app/quest/QuestClient.tsx` — the file to refactor.
6. `src/app/quest/components/ReturningCelebration.tsx` — the second file to refactor (sibling celebration overlay).

After reading, list back to me in one sentence each:
- What `--surface` resolves to and when to use it
- What `.card-glass` is and how it differs from `.card-glass-dark`
- The Bebas Neue minimum-size rule

Do not skip this step. If you cannot answer all three, re-read.

---

## The 9 changes (all required, in order)

### 1. Convert page background to light surface

**Current** (QuestClient.tsx ~line 232–244):
```tsx
background: `linear-gradient(180deg, ${T.sageDark} 0%, #243835 60%, ${T.sageDarker} 100%)`,
color: T.cream,
```

**Target:**
```tsx
background: 'var(--surface)',
color: 'var(--text-main)',
```

Drop the two ambient radial-glow `<div>`s entirely (rose 12%-opacity glow top-right, mint 8%-opacity glow bottom-left). On a light surface they wash out and look muddy. The glassmorphism cards carry the depth now.

Keep the ambient grid texture div, but switch it to use `.grid-texture` class instead of inline `backgroundImage`. The class already targets sage tint at 2.5% opacity — appropriate for light backgrounds.

### 2. Delete the entire `T` token map

QuestClient.tsx ~line 108–134. Delete the whole `const T = { … }` block.

Do a project-wide find-and-replace within QuestClient.tsx and ReturningCelebration.tsx using this map. **Use these exact substitutions, no creative interpretation:**

| Old (`T.X`) | New (CSS variable in inline style) |
|---|---|
| `T.sage` | `var(--brand-sage)` |
| `T.sageDark` | `var(--brand-sage)` *(was `#1A2E2A` — drift; use brand sage)* |
| `T.sageDarker` | `var(--sage-dark)` *(was `#0E1F1C` — drift; use sage-dark `#3A4E4A`)* |
| `T.cream` | `var(--cream)` *(was `#e3d9ca` — drift; use canonical `#F9F6F0`)* |
| `T.rose` | `var(--brand-rose)` |
| `T.peach` | `var(--brand-rose-hover)` *(was `#B88078` — closest brand match)* |
| `T.mint` | `var(--brand-mint)` *(per user decision — drop the neon mint `#39FFB3`)* |
| `T.amber` | `var(--brand-amber)` *(per user decision — drop the neon amber `#FFB830`)* |
| `T.fontDisplay` | `var(--font-display)` |
| `T.fontBody` | `var(--font-body)` |
| `T.fontMono` | `var(--font-body)` *(JetBrains Mono is dropped — see step 7)* |
| `T.s1` | `'var(--space-1)'` *(or just `4` if used as a number for inline style numerics, e.g. gap)* |
| `T.s2` | `'var(--space-2)'` *(or `8`)* |
| `T.s3` | `'var(--space-3)'` *(or `16`)* |
| `T.s4` | `'var(--space-4)'` *(or `24`)* |
| `T.s5` | `'var(--space-5)'` *(or `32`)* |
| `T.s6` | `'var(--space-6)'` *(or `48`)* |
| `T.s8` | `'var(--space-8)'` *(or `64`)* |
| `T.s10` | `'var(--space-10)'` *(or `80`)* |
| `T.s12` | `96` *(no `--space-12` token; keep as numeric)* |

Spacing note: existing code uses `T.sX` mixed in with arithmetic like `T.s4 + 28`. For numeric arithmetic contexts, keep the numeric values (`24`, `8`, etc.). For pure CSS values where no arithmetic happens, use `var(--space-N)` strings. **Pattern:** if the code does `padding: T.s3` use `padding: 'var(--space-3)'`; if it does `top: T.s4 + 28` use `top: 24 + 28` and add a comment `/* space-4 + node-radius */`.

After this step, search the file for any remaining hex values (`#[0-9a-f]{3,8}`) and `rgba(`. Every match must be either (a) inside a CSS variable definition that you cannot change, (b) a deliberate utility constant with a comment explaining why it cannot be a token, or (c) a violation that needs fixing.

### 3. Move all keyframes from inline `<style>` to public/css/style.css

Currently injected as inline `<style>{ ... }</style>` block in QuestClient.tsx ~line 196–225:
- `questPulseRing`
- `questGlowSweep`
- `questFloat`
- `questFlameFlicker`
- `questAuraSpin`
- `questXpFill`

Append a new section to `public/css/style.css` at the very end (after the architect-scholar layer):

```css
/* ==========================================================================
   QUEST PAGE KEYFRAMES — used by src/app/quest/QuestClient.tsx
   ========================================================================== */
@keyframes questPulseRing { /* … same body … */ }
@keyframes questGlowSweep { /* … */ }
/* etc. */
```

Then delete the inline `<style>` block from QuestClient.tsx. The animations continue to work because Next.js is loading the global stylesheet via `src/app/globals.css` → `public/css/style.css`.

### 4. Replace all 8 hand-rolled glass cards with `.card-glass`

Per user decision: light surface, all cards use `.card-glass` (not `-dark`). Convert these `<motion.div>` wrappers to apply `className="card-glass"` and **remove** their inline `background`, `backdropFilter`, `border`, `borderRadius`, `boxShadow` props. Keep the `motion` props (initial/animate/transition).

Components to convert:
- `HUDStrip` (line ~340)
- `QuestTimeline` outer wrapper (line ~530)
- `DiagnosisCard` outer wrapper (line ~640)
- `DayAccordion` outer wrapper (line ~715)

`ActiveDayCard` is a special case — it has decorative rose corner accents and a stronger rose tint to signal "today's mission". Use `className="card-glass"` for the body, but **keep** the four absolutely-positioned corner accent divs and the rose tint by adding an inline override `style={{ borderColor: 'rgba(183, 110, 121, 0.4)', boxShadow: '0 0 32px rgba(183, 110, 121, 0.18)' }}`. Document this with a comment: `/* ActiveDayCard intentionally overrides .card-glass shadow + border to read as "today" */`.

`AvatarSlot` rotating ring stays as-is (it's a decorative animated element, not a card).

`DependencyTree` SVG stays as-is — the inner `<rect>` panel can keep its `rgba(0,0,0,0.08)` background but **change** to `var(--surface-container-low)` for consistency.

`AbandonButton` confirming-state pill: convert `background: rgba(220,38,38,0.1)` → `background: 'rgba(220, 38, 38, 0.08)'` and add a comment that this is intentional rgba (no `--brand-error-tint` token exists yet).

### 5. Fix typography to clear Bebas ≥32px

Two violations:

**ActiveDayCard h2** (~line 615):
```tsx
fontSize: "clamp(1.6rem, 4vw, 2.2rem)"  // 25.6px floor — violation
```
→ change to:
```tsx
fontSize: "clamp(2rem, 4vw, 2.2rem)"  // 32px floor — compliant
```

**DiagnosisCard h3** (~line 660):
```tsx
fontFamily: T.fontDisplay,
fontSize: "1.3rem",  // 20.8px Bebas — violation
```
→ swap to Plus Jakarta Sans 700 with the `.label-caps` aesthetic but at h3 size:
```tsx
className: undefined,
style: {
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-main)',
  margin: 0,
}
```

Or simpler — just apply `className="label-caps"` from the architect-scholar layer and add `style={{ fontSize: '1rem', color: 'var(--text-main)' }}` to bump from 12px to 16px.

### 6. Replace JetBrains Mono with `.label-caps`

Every `fontFamily: T.fontMono` use becomes `className="label-caps"` (Plus Jakarta Sans 700, 0.1em tracking, uppercase, 12px). Locations:
- Level/Rank chip in HUDStrip ("Lvl 4 · Cadet")
- XP counter in HUDStrip ("40/800")
- Streak day count in StreakFlame ("12d")
- Subject + level chip in QuestHero
- Day display chip in QuestHero
- Day labels in QuestTimeline
- "Today's Mission" label in ActiveDayCard
- "≈ 12 min" label in ActiveDayCard
- Shield count text

These elements already have `textTransform: 'uppercase'` and `letterSpacing: '0.08em'` or similar — `.label-caps` standardises to `0.1em` which is fine. Drop the inline tracking and font-family overrides. Keep colours where they're brand-correct (mint/rose/amber accents).

### 7. Refactor AbandonButton hover to CSS class

Current (~line 768):
```tsx
onMouseEnter={(e) => { e.currentTarget.style.borderColor = '...'; ... }}
onMouseLeave={(e) => { ... }}
```

Add to `public/css/style.css` (in the QUEST KEYFRAMES section or a new QUEST UTILITIES section):

```css
.quest-abandon-btn {
  background: transparent;
  border: 1px solid var(--border-light);
  color: var(--text-muted);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-family: var(--font-body);
  cursor: pointer;
  transition: border-color var(--transition-fast), color var(--transition-fast);
}
.quest-abandon-btn:hover,
.quest-abandon-btn:focus-visible {
  border-color: var(--border-dark);
  color: var(--text-main);
  outline: none;
}
```

Then in QuestClient.tsx, the AbandonButton becomes:
```tsx
<button onClick={() => setConfirming(true)} className="quest-abandon-btn">
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    <Icon name="diagnosis" size={14} />
    Abandon Quest
  </span>
</button>
```

Drop the `onMouseEnter`/`onMouseLeave` handlers entirely.

### 8. Refactor QuestTimeline connectors to remove magic numbers

Current implementation uses `position: absolute` with `top: T.s4 + 28` — brittle.

Replacement pattern: render the connector as a CSS pseudo-element on each timeline node. Wrap the node + connector in a flexbox row where the connector is a flex-grow line.

**Suggested structure:**

```tsx
<div className="quest-timeline-track">
  {steps.map((step, i) => (
    <div key={step.day} className="quest-timeline-item">
      <div className={`quest-timeline-node ${stateClass}`}>...</div>
      <div className="quest-timeline-label">Day {step.day}</div>
      {i < steps.length - 1 && (
        <div
          className="quest-timeline-connector"
          data-filled={i < currentStep}
        />
      )}
    </div>
  ))}
</div>
```

CSS in style.css:
```css
.quest-timeline-track {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  max-width: 480px;
  margin-inline: auto;
  position: relative;
}
.quest-timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}
.quest-timeline-connector {
  position: absolute;
  top: 28px; /* half of node 56px */
  left: 50%;
  width: 100%;
  height: 2px;
  background: var(--border-light);
  z-index: 0;
}
.quest-timeline-connector[data-filled="true"] {
  background: linear-gradient(90deg, var(--brand-mint), var(--brand-mint));
}
.quest-timeline-node {
  position: relative;
  z-index: 1; /* sits above connector */
  /* … existing node styles, tokenised … */
}
```

The node z-index 1 + connector z-index 0 means nodes always sit on top. No magic numbers in TSX.

### 9. ReturningCelebration.tsx — same treatment

Apply the same rules to `src/app/quest/components/ReturningCelebration.tsx`:
- Delete any local token map
- Replace hex/rgba with CSS variables
- Convert any glass cards to `.card-glass` (or `.card-glass-overlay` for the modal backdrop layer — celebration overlays are the textbook use case for the level-2 blur)
- Bebas Neue check on the "DAY N COMPLETE" banner (likely fine — that's display-XL territory)
- Move any keyframes to style.css
- Test the `?demo=returning` URL still triggers the celebration

---

## Constraints (non-negotiable)

- **Do not modify** `src/app/quest/page.tsx`. The hardcoded sample data lives there for Phase 2 — Phase 3 will replace with Supabase fetches.
- **Do not modify** the Framer Motion timings, the entrance stagger, or the `?demo=returning` URL handling.
- **Do not introduce** any new top-level dependencies. The existing deps (`framer-motion`, `next/link`, `react`, `@/components/icons`) are sufficient.
- **Do not refactor** the React component decomposition. HUDStrip, AvatarSlot, StreakFlame, QuestHero, QuestTimeline, ActiveDayCard, DiagnosisCard, DependencyTree, DayAccordion, AbandonButton must remain as separate functions with the same props.
- **Do not break** the `<global-header>` and `<global-footer>` web component drops. Leave them with the `// @ts-expect-error custom element` comments.
- **Tailwind:** this project uses **vanilla CSS via style.css**, NOT Tailwind. If you find yourself reaching for Tailwind utility classes (`text-lg`, `bg-white`, `flex items-center`), STOP. Use CSS variables in inline styles, or add a class to style.css. The user's instruction "use elements from style.css 3 tailwind if in doubt" is a typo — the convention is **style.css v3.0**, not Tailwind. The repo has zero Tailwind config.
- **Design Guardian rule:** zero hardcoded hex or `rgba()` values in component files after this refactor. Every colour reference must be `var(--token-name)`. The two narrow exceptions: (a) the deliberate `rgba(220, 38, 38, 0.08)` in AbandonButton confirming state with a code comment explaining no token exists yet, (b) the SVG `<linearGradient>` and `<filter>` definitions inside DependencyTree which use `T.rose` / `T.mint` as `stopColor` — convert these to literal `var(--brand-rose)` and `var(--brand-mint)` strings inside the SVG attributes (SVG accepts CSS vars in modern browsers).

---

## Phase-gated test plan (do each before moving on)

### Gate 1 — after step 2 (token replacement)
Run `grep -rn "#[0-9a-fA-F]\{3,8\}" src/app/quest/` from the repo root. Output must be empty or only contain matches inside comments. Run `grep -rn "rgba(" src/app/quest/` — output must be limited to (a) the documented AbandonButton exception, (b) any pre-existing comments. Report both grep outputs back to the user before continuing.

### Gate 2 — after step 4 (glass cards)
Run `npm run dev` (or `npm run build` if dev fails). Navigate to `http://localhost:3000/quest`. Verify the page loads without console errors. Take a screenshot using your headless tool if available, otherwise describe what you see. Report back: page background is light, 4 cards are visible with frosted glass effect, ActiveDayCard has rose tint and corner accents, all 3 timeline nodes render.

### Gate 3 — after step 8 (CSS-class refactors)
Run `npm run build`. Build must succeed with zero TypeScript errors. Report build output. Navigate to `http://localhost:3000/quest?demo=returning` — the celebration overlay must still trigger.

### Gate 4 — final
Run a complete diff: `git diff --stat` — should show changes only in:
- `public/css/style.css` (new keyframes + abandon-btn class + timeline classes)
- `src/app/quest/QuestClient.tsx`
- `src/app/quest/components/ReturningCelebration.tsx`

If anything else has changed, you've gone outside scope. Report what and why.

---

## Commit strategy

One commit. Branch directly on `main`. Suggested message:

```
refactor(quest): migrate to architect-scholar light theme

Rewrites quest page styling layer to comply with STYLEGUIDE.md §7.
Behavioural changes: zero. Visual changes: substantial — quest moves
from dark gaming aesthetic to light scholarly aesthetic.

- Delete local T token map; all colours now var(--*)
- Page background: dark sage gradient → var(--surface) (light)
- 8 hand-rolled glass cards → .card-glass utility class
- ActiveDayCard keeps rose tint + corner accents as deliberate
  override (commented inline)
- Bebas Neue ≥ 32px enforced — DiagnosisCard h3 → label-caps style
- JetBrains Mono dropped; all mono labels → .label-caps
- 6 keyframes moved from inline <style> to style.css
- AbandonButton mouseEnter/Leave → .quest-abandon-btn CSS class
  (gains :focus-visible parity)
- QuestTimeline magic-number positioning → CSS-grid + pseudo-element
  connectors with z-index layering
- ReturningCelebration.tsx given same treatment

This page is the template for the eventual site-wide architect-scholar
migration. Patterns established here will replicate to subjects pages,
pricing, dashboard, etc.

Tested: ?demo=returning still triggers celebration.
       Framer Motion stagger preserved.
       Next.js build green, zero TS errors.
       Design Guardian: zero hex values in component files.
```

---

## After this commit lands

Do **not** start migrating other pages in this same Claude Code session. Stop after the quest commit. Wait for me (the user) to verify on the live Vercel deployment. If quest looks right, we'll plan the next migration target (subjects pages or pricing) in the chat first.

If anything in this prompt is ambiguous, **ask before proceeding**, do not invent. The point of this work is precision — a missed token reference here propagates across every future page migration.
