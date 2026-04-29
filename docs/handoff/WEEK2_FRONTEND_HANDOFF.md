# Week 2 — Website Design Handoff (v2)

**Sprint:** Week 2 of LAUNCH_PLAN_v1 (BKT polish + dependency tree)
**Stream:** Website Design
**Commits in this handoff:** 4 (A → B → C → D)
**Pillar:** Pillar 2 (Analyse Weakness)
**Depends on:** Diagnostic handoff (must be live, `question_attempts` writing). Backend handoff Tasks 1–4 (must be live before Commits A, B, C). Topic Naming handoff (must be live before Commit C heatmap is meaningful for English).

This is **v2** — replaces the earlier draft. Changes from v1:
- Commit B fetches `/api/syllabus-tree` instead of using a mirror file (no drift risk).
- Commit C populates modal with real data via `/api/recent-attempts` instead of TODO placeholder.
- Heatmap renders sub_topic cells using `mastery_levels` rows directly.
- English sub_topic display strings have NO `(PSLE Paper 2)` suffix to strip — canon now matches.

---

## Goal

Lift `pages/progress.html` from 6/10 to ≥9/10 on `docs/design-audit.md`. Add the four UI elements from `docs/LAUNCH_PLAN_v1.md` Week 2 spec, and clean up all M4/M5/M6 design debt.

The page stack after Week 2 (top to bottom):

```
[ existing page header ]
[ HERO DIAGNOSIS SENTENCE   ]   ← Commit A (NEW)
[ STREAK STRIP — 30 days    ]   ← Commit D (NEW)
[ TOPIC MASTERY HEATMAP     ]   ← Commit C (NEW, replaces vertical BKT list)
[ DEPENDENCY TREE SVG       ]   ← Commit B (NEW)
[ ...rest of progress.html  ]
```

---

## Pre-flight reading (do this first, in order)

1. `CLAUDE.md` v4.1 — coding rules, framework boundary (vanilla JS in `public/`, no React on this page).
2. `STYLEGUIDE.md` — design tokens, icon set, bottom nav contract. Note all M4/M5 audit items.
3. `docs/design-audit.md` — current 6/10 score with itemised gaps.
4. `public/css/style.css` v3.0 — every colour, spacing, typography token already here. Do not invent new tokens.
5. `pages/progress.html` and `public/js/progress.js` — current state.
6. `pages/dashboard.html` + its backpack modal — reuse the modal pattern in Commit C.
7. The new `GET /api/syllabus-tree` and `GET /api/recent-attempts` endpoints — confirm they're live before starting Commits B and C respectively.

---

## Global rules for all 4 commits

### CSS discipline (zero tolerance)

- **Zero hardcoded hex/rgba in HTML `style=` attributes.** Every colour, every spacing value, every font size goes through CSS variables already defined in `style.css` v3.0.
- New styles go in **either**: (a) `public/css/style.css` if reusable, or (b) the page-level `<style>` block in `progress.html` if scoped. Never inline.
- The existing `progress.js` has `style.cssText = "..."` blocks — these are M4/M5 debt. Replace **every one** with class assignments. This is a Week 2 success-gate item.
- Reuse existing tokens: `var(--brand-sage)`, `var(--brand-sage-dark)`, `var(--brand-rose)`, `var(--brand-peach)`, `var(--brand-cream)`, `var(--brand-mint)`, `var(--brand-amber)`, `var(--danger)` (or whatever red token exists in `style.css` — verify first), plus spacing/typography variables.
- Display font (Bebas Neue) via `.font-display` class only, never `font-family:` inline.

### Mobile-first (375px viewport)

- Hero sentence: word-wraps cleanly, never overflows.
- Streak strip: 30 squares fit one row at 375px.
- Heatmap: horizontal-scroll inside its container if columns exceed viewport width.
- Dependency tree: SVG min-width 600px inside `overflow-x: auto` container.

### Honest Compass

Streak strip shows **activity only** — days with ≥ 1 attempt. No celebratory copy. No "Great streak!" toast. No flame/trophy icons. Pure data, neutral colour.

### Visual QA after each commit

1. Wait ~90s for Vercel preview deploy.
2. Open preview URL on desktop (1440px) AND mobile (375px via DevTools).
3. DevTools console — confirm zero errors, zero warnings related to your code.
4. Network tab — confirm `/api/analyze-weakness` returns 200 with the new `diagnosis` block (post Commit A); `/api/syllabus-tree` returns 200 with cache headers (post Commit B); `/api/recent-attempts` returns 200 on cell click (post Commit C).
5. Screenshot the new component, compare against `docs/design-audit.md` rubric.

---

## Commit A — Hero diagnosis sentence

**Smallest commit, ships first to validate end-to-end data flow.**

### Files touched

- `pages/progress.html` — add hero container above BKT card.
- `public/js/progress.js` — bind `response.diagnosis.hero_sentence` to the container.
- `public/css/style.css` — add `.diagnosis-hero` class.

### Implementation

**HTML** — insert above the BKT card, below the page title:

```html
<section class="diagnosis-hero" id="diagnosis-hero" aria-live="polite">
  <p class="diagnosis-hero__sentence" id="diagnosis-hero-sentence">
    <!-- bound at runtime by progress.js -->
  </p>
</section>
```

**CSS** (in `style.css`):

```css
.diagnosis-hero {
  padding: var(--space-lg) var(--space-md);
  margin-bottom: var(--space-md);
  background: var(--brand-cream);
  border-left: 4px solid var(--brand-rose);
  border-radius: var(--radius-md);
}

.diagnosis-hero__sentence {
  font-family: var(--font-display);
  font-size: var(--font-size-lg);
  line-height: 1.4;
  color: var(--brand-sage-dark);
  margin: 0;
}

.diagnosis-hero--empty {
  border-left-color: var(--brand-peach);
}

@media (max-width: 480px) {
  .diagnosis-hero__sentence {
    font-size: var(--font-size-md);
  }
}
```

(Adjust token names to match what's actually in `style.css` v3.0 — verify before writing.)

**JS** — inside the existing analyze-weakness handler in `progress.js`:

```js
// After the existing fetch resolves with the response
const diagnosis = response?.diagnosis;
const heroEl = document.getElementById('diagnosis-hero-sentence');
const heroContainer = document.getElementById('diagnosis-hero');

if (heroEl && diagnosis?.hero_sentence) {
  heroEl.textContent = diagnosis.hero_sentence;
  if (!diagnosis.al_band) {
    heroContainer.classList.add('diagnosis-hero--empty');
  } else {
    heroContainer.classList.remove('diagnosis-hero--empty');
  }
}
```

### Verification

- Hero sentence renders for a student with attempts: contains real first name, AL band (or alternate template), real topic, dependent count.
- Hero sentence renders for a student with zero attempts: empty-state template, peach left-border.
- Sentence wraps cleanly at 375px width.
- `aria-live="polite"` announces sentence updates to screen readers.
- Subject switch (Maths → Science → English) updates the sentence cleanly.

### Commit message

```
feat(progress): add hero diagnosis sentence

Binds response.diagnosis.hero_sentence from /api/analyze-weakness to a
new .diagnosis-hero block above the BKT card. Empty-state variant uses
peach border for students with no attempts.

Pillar 2. Week 2 Commit A.
```

---

## Commit B — SVG dependency tree

### Files touched

- `pages/progress.html` — add tree container.
- `public/js/progress.js` — add `renderDependencyTree(containerId, weakTopic, subject)` and the syllabus-tree fetch with caching.
- `public/css/style.css` — add `.dep-tree` classes.

### Data source — fetch `/api/syllabus-tree` with module-level cache

No mirror file. The endpoint exists and is cacheable. Pattern:

```js
// At the top of progress.js, near other module-level state
let _syllabusTreeCache = null;

async function getSyllabusTree() {
  if (_syllabusTreeCache) return _syllabusTreeCache;
  const res = await fetch('/api/syllabus-tree');
  if (!res.ok) throw new Error(`Failed to fetch syllabus tree: ${res.status}`);
  _syllabusTreeCache = await res.json();
  return _syllabusTreeCache;
}
```

This call hits the server once per page-load (the response is also CDN/browser cached for an hour via the endpoint's `Cache-Control` header).

### Layout strategy (DAG, shared-node)

- Build a graph from `SYLLABUS_DEPENDENCIES[subject]`. Nodes = topics. Edges = `prerequisite → topic` direction.
- **Shared-node** layout: each topic appears exactly once.
- Algorithm:
  1. Compute each topic's depth = `1 + max(depth of any prerequisite)`. Topics with empty `prerequisites` have depth 0.
  2. Group topics by depth into vertical columns (depth 0 leftmost).
  3. Within a column, sort topics alphabetically.
  4. Draw edges as smooth curves (`<path d="M ... C ..."`) from prerequisite right-edge to dependent left-edge.
- The weakest topic node: `stroke="var(--brand-rose)"`, `stroke-width="3"`, subtle drop shadow. Other nodes: `stroke="var(--brand-sage)"`, `stroke-width="1"`.
- Node fill colour by topic mean mastery probability (compute from `mastery_levels` rows already in the page state — Commit C will fetch them; Commit B can use the existing data already on `progress.js` state):
  - `< 0.4` → `var(--danger)`
  - `0.4–0.7` → `var(--brand-amber)`
  - `≥ 0.7` → `var(--brand-mint)`
  - No data → `var(--brand-cream)`

### Function signature

```js
/**
 * Renders a DAG dependency tree for a single subject.
 * @param {string} containerId  - e.g. 'dep-tree-container'
 * @param {string} weakTopic    - root-cause topic to highlight (from diagnosis.weakest_topic)
 * @param {string} subject      - 'mathematics' | 'science' | 'english'
 * @param {Object} masteryByTopic - map of topic -> weighted mean probability
 */
async function renderDependencyTree(containerId, weakTopic, subject, masteryByTopic) {
  const tree = await getSyllabusTree();
  const subjectMap = tree[subject];
  if (!subjectMap) return;
  // 1. Compute depths.
  // 2. Lay out columns and node positions.
  // 3. Build SVG element with viewBox sized to fit.
  // 4. Draw edges first (so nodes overlap them cleanly).
  // 5. Draw nodes (circle + text label inside; rose ring on weakTopic).
  // 6. Inject into container.
}
```

### HTML

```html
<section class="dep-tree-section" id="dep-tree-section">
  <h2 class="dep-tree-section__title font-display">Topic Dependencies</h2>
  <p class="dep-tree-section__hint">
    Mastering an upstream topic strengthens everything downstream. The rose-ringed topic is your current focus.
  </p>
  <div class="dep-tree-container" id="dep-tree-container">
    <!-- SVG injected by renderDependencyTree() -->
  </div>
</section>
```

### CSS

```css
.dep-tree-section {
  margin-block: var(--space-xl);
}

.dep-tree-section__title {
  font-size: var(--font-size-xl);
  color: var(--brand-sage-dark);
  margin-bottom: var(--space-xs);
}

.dep-tree-section__hint {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-md);
}

.dep-tree-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  background: var(--surface-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.dep-tree-container svg {
  min-width: 600px;
  height: auto;
  display: block;
}

.dep-tree__node-label {
  font-family: var(--font-body);
  font-size: 12px;
  fill: var(--brand-sage-dark);
  pointer-events: none;
  user-select: none;
}

.dep-tree__edge {
  fill: none;
  stroke: var(--brand-sage);
  stroke-width: 1.5;
  opacity: 0.4;
}

@media (max-width: 480px) {
  .dep-tree-container {
    padding: var(--space-sm);
  }
}
```

### Verification

- Tree renders for Mathematics, Science, English on subject switch.
- Weakest topic node visibly ringed in rose.
- Node colours reflect mastery probability buckets correctly.
- Mobile (375px): tree horizontally scrolls inside container, container itself does not break layout.
- `/api/syllabus-tree` is hit exactly once per page load (check Network tab — second subject switch should NOT trigger a refetch).
- No console errors on rapid subject switching.

### Commit message

```
feat(progress): add SVG dependency tree

Fetches SYLLABUS_DEPENDENCIES via /api/syllabus-tree (cached at module
scope, hit once per page load). DAG laid out as columns by depth,
shared-node, with weakest topic ringed in brand-rose. Node colours
from mastery probability buckets.

Mobile: horizontal scroll inside container, SVG min-width 600px.

Pillar 2. Week 2 Commit B.
```

---

## Commit C — Topic mastery heatmap (replaces BKT vertical list)

### Files touched

- `pages/progress.html` — replace BKT list block with heatmap container; add modal markup.
- `public/js/progress.js` — add `renderMasteryHeatmap(containerId, masteryRows, subject)` and the cell-click modal handler that fetches `/api/recent-attempts`.
- `public/css/style.css` — add `.heatmap` classes. Reuse modal styles from `dashboard.html` backpack modal where possible.

### Data source

Heatmap reads `mastery_levels` data — already returned by `/api/analyze-weakness` (verify field name in the response). Each cell maps to a `(topic, sub_topic)` mastery row.

For topics where `SYLLABUS_DEPENDENCIES[subject][topic].sub_topics` lists a sub_topic but no `mastery_levels` row exists (student hasn't attempted that sub_topic yet), render the cell with the no-data style.

### Layout

- Rows = topics. Columns = sub_topics within that topic. Use CSS Grid.
- Topic name labels on the left.
- Each topic-row: own grid line, `grid-template-columns: repeat(N, 1fr)` set via CSS custom property (`--cols`).
- Topics with **only 1 sub_topic** render as a **single full-width cell** for that row.
- Cells coloured by `mastery_levels.probability` for that exact `(topic, sub_topic)`:
  - `< 0.4` → `var(--danger)`
  - `0.4–0.7` → `var(--brand-amber)`
  - `≥ 0.7` → `var(--brand-mint)`
  - No data → `var(--brand-cream)` with diagonal stripe pattern.

### Cell click → modal

Modal pattern: copy `dashboard.html` backpack modal structure, give it new IDs.

On cell click:
1. Get `topic` and `sub_topic` from the cell's `data-topic` and `data-sub-topic` attributes.
2. Open modal in loading state.
3. Fetch `/api/recent-attempts?student_id=${studentId}&topic=${encodeURIComponent(topic)}&sub_topic=${encodeURIComponent(subTopic || '')}&limit=5` with the user's auth token.
4. Populate modal:
   - Title: `${topic} — ${subTopicLabel}` (or just `${topic}` if `subTopic` is null).
   - Stats block:
     - `${stats.total_attempts}` attempts
     - `${(stats.accuracy * 100).toFixed(1)}%` accuracy (or "—" if accuracy is null)
     - `${(stats.mastery_probability * 100).toFixed(0)}%` mastery (or "—" if null)
   - Recent attempts list: 5 rows, each showing date (formatted as "3 Apr 2026"), correct/incorrect indicator (mint check / rose cross icon), question stem truncated to 80 chars.
5. Close button + ESC keyboard handler + click-outside-to-close.

### HTML

```html
<section class="heatmap-section" id="heatmap-section">
  <h2 class="heatmap-section__title font-display">Topic Mastery</h2>
  <div class="heatmap" id="heatmap-container">
    <!-- rows injected by renderMasteryHeatmap() -->
  </div>
  <div class="heatmap-legend" aria-hidden="true">
    <span class="heatmap-legend__swatch heatmap-legend__swatch--low"></span> Needs work
    <span class="heatmap-legend__swatch heatmap-legend__swatch--mid"></span> Developing
    <span class="heatmap-legend__swatch heatmap-legend__swatch--high"></span> Strong
    <span class="heatmap-legend__swatch heatmap-legend__swatch--none"></span> No data
  </div>
</section>

<!-- Modal — mirror structure of dashboard.html backpack modal -->
<div class="modal" id="heatmap-cell-modal" hidden role="dialog" aria-modal="true" aria-labelledby="heatmap-cell-modal-title">
  <div class="modal__backdrop" data-modal-close></div>
  <div class="modal__panel">
    <header class="modal__header">
      <h3 class="modal__title" id="heatmap-cell-modal-title"></h3>
      <button type="button" class="modal__close" data-modal-close aria-label="Close">×</button>
    </header>
    <div class="modal__body" id="heatmap-cell-modal-body">
      <!-- content injected on open -->
    </div>
  </div>
</div>
```

### CSS

```css
.heatmap {
  display: grid;
  gap: var(--space-xs);
  width: 100%;
}

.heatmap__row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: var(--space-sm);
  align-items: stretch;
}

.heatmap__topic-label {
  font-family: var(--font-body);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--brand-sage-dark);
  display: flex;
  align-items: center;
}

.heatmap__cells {
  display: grid;
  grid-template-columns: repeat(var(--cols, 1), 1fr);
  gap: 2px;
}

.heatmap__cell {
  aspect-ratio: 1.5;
  min-height: 32px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
  border: none;
  padding: 0;
}

.heatmap__cell:hover,
.heatmap__cell:focus-visible {
  transform: scale(1.04);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  outline: 2px solid var(--brand-sage);
  outline-offset: 2px;
}

.heatmap__cell--low  { background: var(--danger); }
.heatmap__cell--mid  { background: var(--brand-amber); }
.heatmap__cell--high { background: var(--brand-mint); }
.heatmap__cell--none {
  background: var(--brand-cream);
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(0,0,0,0.04) 4px,
    rgba(0,0,0,0.04) 8px
  );
}

.heatmap__row--single .heatmap__cells {
  grid-template-columns: 1fr;
}

.heatmap-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin-top: var(--space-sm);
}

@media (max-width: 480px) {
  .heatmap__row {
    grid-template-columns: 110px 1fr;
  }
  .heatmap__topic-label {
    font-size: 11px;
  }
}
```

### JS — modal open handler

```js
async function openHeatmapCellModal(topic, subTopic) {
  const modal     = document.getElementById('heatmap-cell-modal');
  const titleEl   = document.getElementById('heatmap-cell-modal-title');
  const bodyEl    = document.getElementById('heatmap-cell-modal-body');
  const subTopicLabel = subTopic || '(no specific sub-topic)';
  titleEl.textContent = subTopic ? `${topic} — ${subTopicLabel}` : topic;
  bodyEl.innerHTML = '<p>Loading…</p>';
  modal.hidden = false;

  try {
    const params = new URLSearchParams({
      student_id: state.activeStudentId,
      topic,
      sub_topic: subTopic || '',
      limit: '5',
    });
    const res = await fetch(`/api/recent-attempts?${params}`, {
      headers: { Authorization: `Bearer ${await getAccessToken()}` },
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    bodyEl.innerHTML = renderModalContent(data);
  } catch (err) {
    console.error('[heatmap modal] fetch error:', err);
    bodyEl.innerHTML = '<p class="modal__error">Could not load attempts. Please try again.</p>';
  }
}

function renderModalContent({ attempts, stats }) {
  const accuracyPct = stats.accuracy != null ? `${(stats.accuracy * 100).toFixed(1)}%` : '—';
  const masteryPct  = stats.mastery_probability != null ? `${Math.round(stats.mastery_probability * 100)}%` : '—';
  const statsHtml = `
    <div class="modal__stats">
      <div><span class="modal__stat-value">${stats.total_attempts}</span><span class="modal__stat-label">attempts</span></div>
      <div><span class="modal__stat-value">${accuracyPct}</span><span class="modal__stat-label">accuracy</span></div>
      <div><span class="modal__stat-value">${masteryPct}</span><span class="modal__stat-label">mastery</span></div>
    </div>
  `;
  const attemptsHtml = attempts.length === 0
    ? '<p class="modal__empty">No attempts yet for this sub-topic.</p>'
    : `<ul class="modal__attempts">
         ${attempts.map(a => `
           <li class="modal__attempt modal__attempt--${a.correct ? 'correct' : 'incorrect'}">
             <span class="modal__attempt-date">${formatDate(a.created_at)}</span>
             <span class="modal__attempt-stem">${escapeHtml(truncate(a.question_text, 80))}</span>
           </li>
         `).join('')}
       </ul>`;
  return statsHtml + attemptsHtml;
}

// close handlers
document.querySelectorAll('[data-modal-close]').forEach(el => {
  el.addEventListener('click', () => { document.getElementById('heatmap-cell-modal').hidden = true; });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.getElementById('heatmap-cell-modal').hidden = true;
});
```

`escapeHtml`, `truncate`, `formatDate`, `getAccessToken` — reuse existing helpers in `progress.js` if present, otherwise add minimal versions.

### Verification

- Heatmap renders all topics for active subject, one row each.
- Single-sub_topic topics render as one wide cell, no narrow strips.
- No-data cells show diagonal-stripe pattern, not solid colour.
- Click any cell → modal opens, fetches `/api/recent-attempts`, populates with real data.
- Modal stats numbers match Supabase ground truth (spot-check 2 cells).
- ESC, click-outside, close button all close the modal.
- Mobile (375px): topic labels narrow to 110px, cells stay tappable (≥32px tall).
- English heatmap shows all canonical sub_topics (no `(PSLE Paper 2)` suffix in labels).

### Commit message

```
feat(progress): replace BKT list with topic mastery heatmap

Grid heatmap with row=topic, columns=sub_topics. Cell colour from mastery
probability buckets, striped pattern for no-data. Single-sub_topic topics
render as one wide cell.

Click opens detail modal (reuses dashboard backpack modal pattern).
Modal fetches /api/recent-attempts for real stats + last 5 attempts.

Pillar 2. Week 2 Commit C.
```

---

## Commit D — Streak strip + style.cssText cleanup

### Files touched

- `pages/progress.html` — add streak strip container above heatmap.
- `public/js/progress.js` — add `renderStreakStrip(containerId, dailyCounts)` AND clean up every `style.cssText` block.
- `public/css/style.css` — add `.streak-strip` classes.

### Honest Compass — non-negotiable

- No "Great streak!" copy.
- No flame icons, trophies, or celebratory emoji.
- No "X day streak" tally text. Just the strip.
- Tooltip on hover shows date and attempt count, nothing else.
- Empty days styled identically (cream colour). No "missed!" indicator.

### Logic

- Compute the last 30 calendar days ending **today** (Singapore SGT).
- For each day, count `question_attempts` where `created_at` falls inside that day for this student (cross-subject activity).
- Render 30 squares, oldest left, today right.
- Cell shading by attempt count:
  - 0 → `var(--brand-cream)`
  - 1–4 → mint at 40% opacity
  - 5–9 → mint at 70% opacity
  - 10+ → mint at 100% opacity
- Native `title` tooltip: `"3 Apr 2026 — 7 attempts"`.

### Data source

Query `question_attempts` directly from the page via the existing supabase client:

```js
async function fetchStreakData(studentId) {
  const sb = window.getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { data, error } = await sb
    .from('question_attempts')
    .select('created_at')
    .eq('student_id', studentId)
    .gte('created_at', since.toISOString());
  if (error) { console.error('[streak] fetch error:', error); return []; }
  // Bucket into days (SGT)
  const counts = {};
  data.forEach(row => {
    const d = new Date(row.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
    counts[d] = (counts[d] || 0) + 1;
  });
  return counts;
}
```

Build the 30-day array client-side. RLS already ensures the student belongs to the parent — no additional auth needed.

### HTML

```html
<section class="streak-strip-section" id="streak-strip-section">
  <h2 class="streak-strip-section__title font-display">Last 30 Days</h2>
  <div class="streak-strip" id="streak-strip" role="img" aria-label="Activity over the last 30 days">
    <!-- 30 squares injected by renderStreakStrip() -->
  </div>
</section>
```

### CSS

```css
.streak-strip-section {
  margin-block: var(--space-md);
}

.streak-strip-section__title {
  font-size: var(--font-size-md);
  color: var(--brand-sage-dark);
  margin-bottom: var(--space-xs);
}

.streak-strip {
  display: grid;
  grid-template-columns: repeat(30, 1fr);
  gap: 2px;
  width: 100%;
  max-width: 480px;
}

.streak-strip__day {
  aspect-ratio: 1;
  border-radius: 2px;
  background: var(--brand-cream);
}

.streak-strip__day--low  { background: color-mix(in srgb, var(--brand-mint) 40%, transparent); }
.streak-strip__day--mid  { background: color-mix(in srgb, var(--brand-mint) 70%, transparent); }
.streak-strip__day--high { background: var(--brand-mint); }

@media (max-width: 480px) {
  .streak-strip {
    max-width: 100%;
  }
  .streak-strip__day {
    border-radius: 1px;
  }
}
```

### style.cssText cleanup pass

In `progress.js`:

1. Search for every `style.cssText` and every `.style.<property> =` assignment.
2. For each:
   - Static colour/spacing → replace with class assignment.
   - Truly dynamic value (computed pixel position) → leave the JS assignment but only for that one property, never `cssText`.
   - `display: none/block` → use `hidden` attribute or `.is-hidden` class.
3. After cleanup, search again to confirm zero `cssText` assignments remain. **This is the M4/M5 audit gate.**

### Verification

- Streak strip shows 30 squares, today rightmost.
- Hover any square → native tooltip with date + count.
- Strip fits one row at 375px.
- Zero `style.cssText` assignments anywhere in `progress.js`:
  ```bash
  grep -n "cssText" public/js/progress.js
  # → no output
  ```
- Lighthouse mobile run: Performance ≥ 90, Accessibility ≥ 95.
- Read page top-to-bottom on mobile — no element uses hardcoded hex/rgba.

### Commit message

```
feat(progress): add 30-day streak strip + clean up cssText debt

Streak strip shows last 30 calendar days of cross-subject activity.
Honest Compass preserved: no celebratory copy, no streak tally, native
tooltips only. Empty days styled identically to filled (cream).

Removes all style.cssText assignments from progress.js. Replaced with
class-based styling. M4/M5 design audit items resolved.

Pillar 2. Week 2 Commit D — sprint complete.
```

---

## Out of scope (do NOT touch)

- Anything in `src/app/quest/` (Next.js Plan Quest — different framework).
- `lib/api/handlers.js` or any backend code.
- The bottom nav contract (locked in STYLEGUIDE).
- New colour palettes or font sizes (locked in style.css v3.0 tokens).
- The 4 Pillars language anywhere on `progress.html` — preserve "Analyse Weakness" verbatim.