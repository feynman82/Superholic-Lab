---
name: page-builder
description: "Standard patterns for building any new page on Superholic Lab. HTML structure, JS module pattern, CSS integration, mobile-first layout."
origin: Superholic Lab
---

# Page Builder Skill

Defines the standard template for every page on Superholic Lab.
Read this before creating or significantly modifying any HTML page.

## When to Use

- Creating a new page in `pages/`
- Restructuring an existing page's layout
- Adding new sections to a page
- Ensuring mobile responsiveness

## HTML Page Template

Every page MUST follow this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>[Page Name] — Superholic Lab</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="../css/style.css" />
  <link rel="icon" href="../assets/favicon.ico" />
  <meta name="description" content="[Page-specific description]" />
  <meta name="robots" content="noindex, nofollow" />
  <!-- Open Graph -->
  <meta property="og:title" content="[Page Name] — Superholic Lab" />
  <meta property="og:description" content="[Description]" />
  <meta property="og:type" content="website" />
</head>
<body class="has-bottom-nav">
  <!-- NAVBAR -->
  <header class="navbar is-scrolled">
    <div class="container">
      <nav class="navbar-inner">
        <a href="../index.html" class="navbar-logo">
          <svg><!-- logo SVG --></svg>
          Superholic Lab
        </a>
        <div class="navbar-actions">
          <!-- Page-specific nav buttons -->
        </div>
      </nav>
    </div>
  </header>

  <!-- MAIN CONTENT -->
  <main style="padding: var(--space-8) 0 var(--space-16);">
    <div class="container" style="max-width:680px;">
      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="../index.html">Home</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">[Page Name]</span>
      </nav>

      <!-- Loading state -->
      <div id="page-loading" class="text-center mt-20">Loading…</div>

      <!-- Error state -->
      <div id="page-error" class="alert alert-danger mt-6" hidden></div>

      <!-- Main content area -->
      <div id="page-content" hidden>
        <!-- Page-specific content -->
      </div>
    </div>
  </main>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="container">
      <div class="footer-bottom">
        <p>&copy; 2026 Superholic Lab. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <!-- MOBILE BOTTOM NAV -->
  <nav class="bottom-nav" aria-label="Mobile navigation">
    <a href="../index.html" class="bottom-nav-item">Home</a>
    <a href="subjects.html" class="bottom-nav-item">Practise</a>
    <a href="tutor.html" class="bottom-nav-item">AI Tutor</a>
    <a href="progress.html" class="bottom-nav-item">Progress</a>
  </nav>

  <!-- SCRIPTS -->
  <script src="../js/supabase-client.js"></script>
  <script src="../js/auth.js"></script>
  <script src="../js/[page-specific].js"></script>
</body>
</html>
```

## JS Module Pattern

Every page JS file follows this pattern:

```js
/**
 * [filename].js
 * [Description of what this module does]
 *
 * TEST: Open pages/[page].html and verify [what to check]
 */

(() => {
  // ── DOM refs ────────────────────────────────────
  const loadingEl = document.getElementById('page-loading');
  const errorEl   = document.getElementById('page-error');
  const contentEl = document.getElementById('page-content');

  // ── State ───────────────────────────────────────
  // Declare state variables here

  // ── Boot ────────────────────────────────────────
  init();

  async function init() {
    try {
      // 1. Check auth (if protected page)
      const user = await getCurrentUser();
      if (!user) { window.location.href = 'login.html'; return; }

      // 2. Load data
      const data = await fetchData();

      // 3. Render
      loadingEl.hidden = true;
      contentEl.hidden = false;
      render(data);
    } catch (err) {
      showError('Something went wrong. Please try again.');
      console.error('[module]', err);
    }
  }

  // ── Data fetching ───────────────────────────────
  async function fetchData() {
    const db = await getSupabase();
    const { data, error } = await db
      .from('table')
      .select('col1, col2')
      .limit(50);
    if (error) throw error;
    return data;
  }

  // ── Rendering ───────────────────────────────────
  function render(data) {
    // Use textContent for user-supplied content, never innerHTML
    // Use CSS classes from style.css, never inline styles
  }

  // ── Utilities ───────────────────────────────────
  function showError(msg) {
    loadingEl.hidden = true;
    errorEl.hidden = false;
    errorEl.textContent = msg;
  }

  function escapeText(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }
})();
```

## Page Categories

### Public Pages (no auth required)
- `index.html` — homepage
- `pages/about.html`, `pages/terms.html`, `pages/privacy.html`, `pages/contact.html`
- `pages/pricing.html`
- `pages/login.html`, `pages/signup.html`

### Protected Pages (redirect to login if no session)
- `pages/subjects.html`
- `pages/quiz.html`
- `pages/tutor.html`
- `pages/progress.html`
- `pages/dashboard.html`

### Auth Check Pattern
```js
const user = await getCurrentUser();
if (!user) {
  window.location.href = 'login.html';
  return;
}
```

## Responsive Breakpoints

- Mobile: 375px (iPhone SE) — default, design here first
- Mobile large: 390px (iPhone 14)
- Tablet: 768px (iPad)
- Desktop: 1024px+

All layouts mobile-first. Use `max-width: 680px` for content containers.

## CSS Rules

- ALL styles in `css/style.css` — never create new CSS files
- Use CSS variables for all colors — never hardcode hex
- Use existing component classes: `.card`, `.btn`, `.badge`, `.alert`, `.form-input`
- Add new classes for page-specific components, prefixed by page name
  e.g. `.progress-chart`, `.tutor-bubble`, `.pricing-tier`

## Script Loading Order

Always load scripts in this order:
1. `supabase-client.js` — creates the Supabase client
2. `auth.js` — provides getCurrentUser(), getProfile(), etc.
3. Page-specific JS — uses both of the above

Access Supabase via `window.getSupabase()` (not import).

## SEO Checklist (every page)

- [ ] Unique `<title>` with " — Superholic Lab" suffix
- [ ] `<meta name="description">` under 160 characters
- [ ] Open Graph tags (og:title, og:description, og:type)
- [ ] Proper heading hierarchy (one h1, then h2, h3)
- [ ] Semantic HTML (main, nav, footer, article, section)
- [ ] Accessible: alt text, aria-labels, focus management
