# Handoff prompts — Plan Quest Phase 3

Source-of-truth Claude Code handoff prompts. Both reference `docs/QUEST_PAGE_SPEC.md` v2.0 as the authoritative spec.

| File | Stream | Owns commits |
|---|---|---|
| `QUEST_BACKEND_HANDOFF.md` | Backend & Admin | 1 (migration 018), 2 (handlers), 4 (quiz/tutor integration), 6 (cron + FAQ + docs) |
| `QUEST_FRONTEND_HANDOFF.md` | Website Design | 3 (/quest wiring + new states), 5 (progress.html quest tray + HUD) |

## How to use

1. Open the relevant Claude Project stream (Backend & Admin OR Website Design)
2. Paste the entire handoff prompt as a new message
3. Claude Code reads the spec + the handoff, then works commit-by-commit
4. After each commit, Claude Code runs the verification step and reports back to you
5. Only when verification passes does the next commit start

## Build sequence

```
Backend C1 (migration 018) → apply manually via Supabase Dashboard
     │
     ▼
Backend C2 (handlers) ────────►  Frontend C3 (/quest page)
     │                                  │
     │                                  │
     ▼                                  ▼
Backend C4 (quiz/tutor)         Frontend C5 (progress.html)
     │                                  │
     └──────────────┬───────────────────┘
                    ▼
         E2E: Lily Tan test (QUEST_PAGE_SPEC §18)
                    │
                    ▼
           Backend C6 (cron + FAQ)
                    │
                    ▼
               Phase 3 complete
```

Frontend C3 cannot start until Backend C2 lands (frontend needs the API contracts).
Frontend C5 cannot start until Backend C4 lands (frontend needs the auto-modal hook from quiz.js).
