# ADR-0001: Migrate to Next.js App Router + TypeScript + Tailwind CSS

**Status:** Accepted
**Date:** 2026-03-29
**Deciders:** Platform owner
**Supersedes:** Original vanilla JS architecture decision

---

## Context

Superholic Lab was built with plain HTML, vanilla JavaScript, and CSS deployed directly
to Vercel. This worked for MVP velocity but creates scaling friction:

1. **SEO:** Static HTML pages have no server-side rendering. Quiz content and topic pages
   cannot be indexed by Google, limiting organic discovery for parents searching for
   "P4 Science quiz Singapore".

2. **Type Safety:** As the question schema evolves (6 types × 6 levels × 3 subjects),
   the lack of TypeScript means silent schema violations in JSON files and JS modules
   go undetected until runtime.

3. **Component Reuse:** Quiz card rendering is duplicated across topic pages. Without
   a component model, every new subject page re-implements the same pattern.

4. **Team Scale:** The platform is targeting 1,000+ students. A single `style.css` and
   flat JS module structure will become a maintenance liability at that scale.

5. **Tailwind DX:** Inline utility classes with type-safe design tokens will enforce
   the design system far better than a single shared CSS file can.

---

## Decision

Migrate the frontend to **Next.js 14 (App Router)** with **TypeScript** and **Tailwind CSS**.

**Migration strategy:** Incremental. The existing vanilla JS build remains intact and
deployed. New features are built in `src/` following Next.js conventions. Once all
pages are migrated, the legacy `js/`, `pages/`, `css/` directories are removed.

No "big bang" rewrite. The site must remain live throughout.

---

## Consequences

### Positive
- **SEO:** Server components render quiz and topic pages with full HTML, crawlable by Google.
- **Type Safety:** TypeScript interfaces for all 6 question schemas catch mismatches at build time.
- **Component system:** Atomic design (Button, Card, QuizCard) eliminates duplication.
- **Tailwind enforcement:** Design tokens in tailwind.config.ts + Tailwind classes in JSX
  make hardcoded colours detectable at lint time.
- **Vercel Edge:** Next.js + Vercel = automatic edge caching, ISR for question pages.
- **Build hook:** `next build` + `tsc --noEmit` gives a real "broken build" signal in hooks.

### Negative
- **Migration effort:** Every legacy page must be ported. Time cost is significant.
- **Context switch:** Existing vanilla JS patterns must not contaminate new TSX components.
- **Learning curve:** Future contributors need Next.js/App Router knowledge.
- **Bundle size risk:** Must monitor with `@next/bundle-analyzer` — avoid heavy dependencies.

### Mitigations
- Hybrid phase rules in `tech-stack.md` prevent vanilla JS contamination of new code.
- Subject-specific CLAUDE.md files in `src/subjects/` scope the context for each domain.
- PostToolUse build hook catches TypeScript errors before they accumulate.

---

## Alternatives Considered

### Stay with Vanilla JS
**Rejected.** SEO gap is a business-critical issue: parents cannot find the platform
organically. Vanilla JS has no path to SSR without significant custom infrastructure.

### Remix
**Considered.** Better data loading patterns than Next.js for some use cases.
**Rejected.** Vercel is the deployment platform; Next.js has first-class Vercel support.
Smaller ecosystem and less team familiarity.

### Astro
**Considered.** Excellent for static content and SEO. Near-zero JS by default.
**Rejected.** The quiz engine and AI tutor require significant client-side interactivity.
Astro's island architecture would add complexity without clear benefit here.

### SvelteKit
**Rejected.** TypeScript support strong, but the component ecosystem is smaller.
Risk of dependency lock-in for a long-running educational platform.

---

## Review Triggers

Revisit this decision if:
- Next.js changes App Router API significantly (breaking changes)
- Vercel pricing changes make it non-viable at scale
- A subject-matter expert contributor is unfamiliar with React
