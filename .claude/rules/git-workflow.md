# Git Workflow — Superholic Lab

## Commit Message Format

```
<type>: <description>

<optional body explaining why>
```

Types: feat, fix, refactor, docs, test, chore, perf, style

Examples:
- `feat: add P4 Science question bank`
- `fix: quiz timer not resetting between questions`
- `refactor: extract auth helpers from quiz.js`
- `chore: update Supabase client to latest version`

## Branch Strategy

- `main` branch auto-deploys to Vercel (production)
- For risky changes: create feature branch, test, merge to main
- Every push to main = live in ~60 seconds

## Before Every Push

1. Verify no .env or secrets in staged files
2. Check that new code follows coding rules
3. Test the affected pages manually
4. Write a clear commit message
