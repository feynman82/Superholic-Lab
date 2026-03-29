# Tech Stack — Superholic Lab
# Last updated: 2026-03-29
#
# TARGET architecture. The platform is MIGRATING from vanilla JS to
# Next.js + TypeScript + Tailwind. See ADR-0001 for decision rationale.
# Do not write new vanilla JS features — all new code follows this spec.
# =======================================================================

## Target Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14+ |
| Language | TypeScript | 5+ |
| Styling | Tailwind CSS | 3+ |
| Database | Supabase (PostgreSQL) | Latest |
| Auth | Supabase Auth | Latest |
| Payments | Stripe | Latest SDK |
| AI | Anthropic API (`claude-sonnet-4-6`) | Latest |
| Deployment | Vercel | Auto-deploy on `main` |
| DNS | Cloudflare → Vercel | — |

## Next.js App Router Conventions

```
src/
├── app/
│   ├── layout.tsx          ← Root layout (fonts, providers)
│   ├── page.tsx            ← Homepage (/)
│   ├── globals.css         ← Tailwind directives + CSS variables
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── quiz/
│   │   └── [subject]/
│   │       └── [topic]/
│   │           └── page.tsx
│   └── dashboard/
│       └── page.tsx
├── components/
│   ├── ui/                 ← Atomic: Button, Card, Badge, Input
│   ├── quiz/               ← Molecule: QuizCard, OptionButton, Timer
│   └── layout/             ← Organism: Navbar, Sidebar, Footer
├── lib/
│   ├── supabase/
│   │   ├── client.ts       ← Browser-side Supabase client
│   │   └── server.ts       ← Server-side Supabase client (service role)
│   ├── stripe/
│   │   └── client.ts
│   └── anthropic/
│       └── client.ts
├── types/
│   └── questions.ts        ← TypeScript interfaces for question schemas
├── subjects/
│   ├── science/
│   │   └── CLAUDE.md       ← Science-specific context
│   ├── mathematics/
│   │   └── CLAUDE.md       ← Maths-specific context
│   └── english/
│       └── CLAUDE.md       ← English-specific context
└── api/                    ← Legacy serverless (keep during migration)
    ├── chat.js
    ├── checkout.js
    └── webhook.js
```

## TypeScript Rules

- Strict mode enabled: `"strict": true` in tsconfig.json
- No `any` — use `unknown` and type-narrow
- Interfaces over types for object shapes (extensible)
- Enums for difficulty, subject, question type
- All Supabase query results must be typed with generated types (`supabase gen types`)
- Props interfaces named `[Component]Props` (e.g., `QuizCardProps`)

```typescript
// Correct: typed question interfaces
interface MCQQuestion {
  id: string;
  subject: 'Mathematics' | 'Science' | 'English';
  level: `Primary ${1 | 2 | 3 | 4 | 5 | 6}`;
  difficulty: 'Foundation' | 'Standard' | 'Advanced' | 'HOTS';
  type: 'mcq';
  options: [string, string, string, string];
  correct_answer: 'A' | 'B' | 'C' | 'D';
  wrong_explanations: Record<'A' | 'B' | 'C' | 'D', string>;
  // ...
}
```

## Tailwind Rules

- Use Tailwind classes — no inline styles, no new CSS files except globals.css
- CSS variables defined in globals.css for brand colors, then referenced via Tailwind config
- Custom colors mapped: `primary`, `accent`, `success`, `danger` in tailwind.config.ts
- Mobile-first: base classes = mobile, `md:` = tablet, `lg:` = desktop
- No hardcoded hex values — use Tailwind color tokens or CSS variable references

```typescript
// tailwind.config.ts excerpt
colors: {
  primary: { DEFAULT: 'var(--primary)', light: 'var(--primary-light)', dark: 'var(--primary-dark)' },
  accent: 'var(--accent)',
  success: 'var(--success)',
  danger: 'var(--danger)',
}
```

## Supabase Rules (unchanged from vanilla era)

- Browser client: `src/lib/supabase/client.ts` — anon key only
- Server client: `src/lib/supabase/server.ts` — service role key, server components only
- NEVER import the server client in client components or pages without `'use server'`
- Generated TypeScript types: run `supabase gen types typescript` after schema changes
- RLS must be enabled on all tables — verify before every migration

## API Routes (Next.js Route Handlers)

```typescript
// src/app/api/chat/route.ts
export async function POST(request: Request) {
  // Validate input
  // Call Anthropic API (server-side only)
  // Return response
}
```

- Route handlers replace the legacy `api/*.js` Vercel functions
- All external API calls (Anthropic, Stripe) in route handlers or server actions
- NEVER call Anthropic or Stripe from client components

## Environment Variables

```bash
# Server-only (route handlers, server components)
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
ANTHROPIC_API_KEY=

# Public (safe for client)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Note: Next.js `NEXT_PUBLIC_` prefix required for browser-accessible vars.

## Migration Phase Rules

Until the Next.js migration is complete, the codebase is HYBRID:
- Legacy vanilla JS files in `js/`, `css/`, `pages/`, `api/` remain untouched
- New features built in `src/` using Next.js conventions
- Do NOT refactor legacy files unless the task explicitly requires it
- Do NOT mix: no importing legacy JS modules into Next.js components

## Packages — Approved List

```json
{
  "dependencies": {
    "next": "^14",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0",
    "stripe": "^14",
    "@anthropic-ai/sdk": "^0.24",
    "tailwindcss": "^3",
    "typescript": "^5"
  }
}
```

**Never add** React state management libraries (Redux, Zustand) without explicit approval.
**Never add** CSS-in-JS libraries (styled-components, Emotion) — Tailwind only.
**Never add** UI component libraries (MUI, Chakra) — build from design system.
