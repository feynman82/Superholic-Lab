# PROJECT DASHBOARD — Superholic Lab
> Last updated: 2026-04-27 | v2.1
> Manual updates at end of work sessions.

For coding rules see `CLAUDE.md`. For schema and infra see `ARCHITECTURE.md`.
For Plan Quest pedagogy see `docs/QUEST_PAGE_SPEC.md` v2.0 (authority).

---

## Platform Status

| Domain | Status | Notes |
|---|---|---|
| Production URL | https://www.superholiclab.com | Live |
| Vercel Deploy | Auto on `main` push | ~60-90s deploy time |
| Supabase | Active (SG region, `rlmqsbxevuutugtyysjr`) | 18+ tables, RLS enabled |
| Stripe | **Test mode** | Switch to live before launch |
| Auth | Email/password + Google + Apple OAuth | Supabase Auth |
| Plan Quest | **Live (commits 1-5 + cron + FAQ)** | E2E testing in progress; Supabase migrations 019+020 pending |
| AI providers | **OpenAI primary** via `callAI()` dispatcher | AI routing abstraction done; Gemini kept for vision, Anthropic for bulk gen |

---

## Architecture Migration Status

| Layer | Current | Status |
|---|---|---|
| App pages framework | Vanilla HTML/CSS/JS in `public/` | ✅ Stable, intentional |
| Quest page framework | Next.js 15 + React 19 + TypeScript at `src/app/quest/` | 🟢 Done for /quest only (hybrid by design — see ADR-0003) |
| Styling | `public/css/style.css` v3.0 (Rose & Sage CSS variables) | ✅ Done |
| Components (vanilla) | Web components: `<global-header>`, `<global-footer>`, `<global-bottom-nav>` | ✅ Done |
| Components (React) | Atomic in `src/app/quest/components/` + `src/components/` | ✅ Done |
| API gateway | Single `api/index.js` → `lib/api/handlers.js` (24 routes) | ✅ Done |
| Supabase migrations | 002–018 applied; 019 + 020 pending (apply in SQL Editor) | 🟡 Almost done |

See `.claude/docs/adr/` for full ADRs.

---

## Question Bank Coverage

**Live source of truth:** `MANIFEST.md` (repo root) — regenerated from
Supabase `question_bank` table. Last calibrated 2026-05-01 against canon-v5.
Inline coverage tables have been removed from this dashboard because they
drifted out of sync.

**Generation order for systematic expansion:** P4 → P2 → P5 → P6 → P3 → P1.
Each round must run mandatory Step 0 deduplication (read MANIFEST.md before
generating) via `/generate-batch`.

---

## ECC Framework Health

| Component | Count | Status |
|---|---|---|
| Rules (`.claude/rules/`) | 13 | ✅ Active |
| Commands (`.claude/commands/`) | 8 | ✅ Active |
| Skills (`.claude/skills/`) | 6 | ✅ Active |
| Agents (`AGENTS.md`) | 7 | ✅ Active (planner, code-reviewer, security-reviewer, quiz-content-reviewer, database-reviewer, progress-intelligence, question-factory-agent) |
| ADRs (`.claude/docs/adr/`) | 1 | 🟡 ADR-0001 only (ADR-0002 + 0003 pending — see Recent Decisions) |
| Hooks (`hooks/hooks.json`) | 2 | ✅ Secret detection + CSS variable enforcement |

---

## Build Phases

### COMPLETED ✅

**Foundation:**
- [x] CSS design system v3.0 (Rose & Sage, Bebas Neue, CSS variables)
- [x] Marketing homepage + subject landing pages + 404
- [x] Auth: email/password + Google + Apple OAuth
- [x] Auth pages: login, signup, confirm-email, update-password
- [x] Signup → 7-day trial flow (no credit card, app-side trial tracking)
- [x] Profile trigger (handle_new_user) + 008 migration applied
- [x] guardPage() + enforcePaywall() + daily usage limits

**Quiz + Tutor + Exam engines:**
- [x] Quiz engine: all 6 PSLE question types
- [x] Question bank migrated to Supabase `question_bank` table
- [x] Miss Wena AI tutor (Gemini Flash, 3-Strike scaffolding)
- [x] Study Notes Backpack (`/api/summarize-chat`, study_notes table)
- [x] Progress tracker (progress.html + progress.js)
- [x] AI weakness analysis (`/api/analyze-weakness`)
- [x] Exam generator: WA/EOY/PSLE templates (exam-templates.js v4.0)
- [x] AI grading for open_ended + word_problem (`/api/grade-answer`)

**Payments + Admin:**
- [x] Stripe trial-first flow (checkout, webhook, profile updates)
- [x] Stripe Customer Portal
- [x] Parent Account Portal (account.html)
- [x] Master Admin Panel (admin.html, role-gated)
- [x] Dashboard with checkout polling + trial banner
- [x] subscriptions.stripe_subscription_id UNIQUE constraint (009)

**AI Provider Migration (Workstream B):**
- [x] `AI_ROUTING` config + `callAI()` / `callOpenAI()` dispatcher in `lib/api/handlers.js`
- [x] All 6 AI handlers migrated to `callAI()` (chat, summarize, grade, question-gen, exam-gen, quest-narrative)
- [x] `.env.example` documenting all `AI_*_PROVIDER` + `AI_*_MODEL` env vars

**Phase 3 — Plan Quest (commits 1-5 + Commit 6):**
- [x] Migration 015 (mastery_levels retroactive)
- [x] Migration 016 (XP, streaks, badges, avatar audit, mastery snapshots)
- [x] Migration 017 (29 launch badge seeds)
- [x] Migration 018 (quest_eligibility table + remedial_quests pedagogy fields)
- [x] `/quest` Next.js route: page.tsx, QuestClient.tsx, 6 components
- [x] Day-gating server-side (Asia/Singapore midnight)
- [x] handleQuestsRouter (list/fetch/advance-step/day3-outcome/abandon/quiz-batch)
- [x] handleAwardXP with allow-list + idempotency + anti-cheat
- [x] badge-engine.js (33 badges; level/rank math)
- [x] quest-pedagogy.js (buildQuestSteps + SYLLABUS_DEPENDENCIES)
- [x] socratic-quest.js prompt builder (Day 2 overlay)
- [x] /api/chat Socratic Quest mode (`?from_quest=` overlay)
- [x] /api/summarize-chat accepts `quest_id` → study_notes link
- [x] quiz.js: from_quest detection, quest-batch, advance-step on submit, auto-modal on score ≤70%
- [x] tutor.js: from_quest detection, Socratic mode, message-count gated "Mark Day 2 Complete"
- [x] progress.html: renderQuestTray + eligibility-aware Generate Quest buttons + HUD strip slot
- [x] hud-strip.js (vanilla HUD: avatar, level, rank, XP bar, streak, shields)
- [x] bottom-nav.js (`<global-bottom-nav>` 5-item canonical layout)
- [x] icons.js + src/components/icons/index.tsx (13-icon set)
- [x] `api/cron/snapshot-mastery.js` — daily 03:00 SGT mastery snapshot + `mastery_gain` XP
- [x] `vercel.json` cron registered (`0 19 * * *`)
- [x] `supabase/020_seed_pedagogy_badges.sql` — 4 pedagogy badges (applied to prod)
- [x] `supabase/019_reclassify_difficulty_heuristic.sql` — difficulty backfill (applied to prod)
- [x] Day 3 redo lineage — `parent_quest_id` chain + +100 growth-mindset XP (E2E Round 7)
- [x] `public/pages/faq.html` — consolidated 9-section parent FAQ with Schema.org JSON-LD
- [x] `docs/PARENT_FAQ.md` — markdown twin of faq.html (source of truth)
- [x] `docs/GAMIFICATION_RULES.md` — XP table, level math, rank ladder, 33 badges, anti-cheat

### IN PROGRESS 🟡

- [ ] **E2E testing the Lily Tan flow** (`docs/QUEST_PAGE_SPEC.md` §18) — multiple bug fix rounds shipped (R4-R7); next pass should validate the redo lineage + Day 3 retry XP
- [ ] **Vercel env vars** — add all `AI_*_PROVIDER` and `AI_*_MODEL` vars to Production + Preview + Development (see `.env.example`). Defaults already work; this is for explicit ops control.
- [ ] **Manual cron smoke** — `curl https://www.superholiclab.com/api/cron/snapshot-mastery` and confirm `mastery_levels_snapshots` rows + `xp_events.mastery_gain` entries land

### NEXT 📋
- [ ] **Question bank expansion** (P4 → P2 → P5 → P6 → P3 → P1 generation order)
- [ ] **MANIFEST.md calibration** against live Supabase `question_bank` rows
- [ ] **Pre-launch cleanup of legacy files** (see Known Issues below)
- [ ] **Stripe live mode switch**
- [ ] Analytics: Plausible script on ALL pages (currently only `pricing.html`)
- [ ] SEO: meta descriptions, Open Graph, JSON-LD on all pages
- [ ] Customer acquisition strategy (the primary business risk, not infrastructure)

---

## Recent Architecture Decisions

| ADR | Decision | Date | Status |
|---|---|---|---|
| ADR-0001 | Initial decision: migrate to Next.js + TypeScript + Tailwind | 2026-03-29 | Superseded by ADR-0003 |
| ADR-0002 | Plan Quest 3-day pedagogy is core IP — preserve Honest Compass / no_improvement signal at all costs | 2026-04-26 | 🟡 Pending write-up to `.claude/docs/adr/` |
| ADR-0003 | Hybrid framework boundary: vanilla HTML/JS for app pages, Next.js for `/quest` and future visually-demanding routes (no full migration) | 2026-04-26 | 🟡 Pending write-up to `.claude/docs/adr/` |
| ADR-0004 | AI routing abstraction — `AI_ROUTING` config + `callAI()` dispatcher; all 6 AI-using handlers route through it; provider swaps are env-var-only | 2026-04-27 | ✅ Implemented in `lib/api/handlers.js` |

---

## Known Issues / Blockers

### Active blockers

| Issue | Impact | Owner | Status |
|---|---|---|---|
| Supabase migrations 019 + 020 | (resolved) — difficulty reclassification + pedagogy badges live | Backend | ✅ Applied |
| `MANIFEST.md` (root) regeneration cadence | Low — regenerated post-canon-v5 (2026-05-01); needs script to keep it fresh | Content | Add automated regen before next sprint |
| Stripe in test mode | High — blocks paid customers | Platform | Switch before launch |
| Plausible analytics on `pricing.html` only | Low — limits funnel visibility | Platform | Roll out before launch |

### Pre-launch cleanup files (legacy / backups / unused)

The following files are local backups, legacy artefacts, or empty drafts.
Purge before launch:

| File / Dir | Reason | Status |
|---|---|---|
| `public/js/quiz copy.js` | Local backup file | ✅ Deleted 2026-05-01 |
| `public/js/supabase.js` | Orphan (no callers) — `supabase-client.js` is canonical | ✅ Deleted 2026-05-01 |
| `.claude/agents/design-guardian - Copy.md` | Literal duplicate | ✅ Deleted 2026-05-01 |
| `scripts/prompt-builder.{js,cjs}` (root copies) | Stale dups; canonical at `scripts/question-factory/prompt-builder.cjs` | ✅ Deleted 2026-05-01 |
| `data/questions/*.json` (38 files) + `SCHEMA.md` | Pre-Supabase JSON bank | ✅ Archived to `data/questions/_legacy/` 2026-05-01 |
| `scripts/*` legacy one-shots (18 files) | One-shot ETL/repair scripts | ✅ Archived to `scripts/_legacy/` 2026-05-01 |
| `index - Copy.html` (root) | Backup of old homepage | ✅ Deleted 2026-05-01 |
| `init` (root, 0-byte file) | Empty file, unknown origin | ✅ Deleted 2026-05-01 |
| `logo draft.png` (root) | Working draft — final logo is in `public/assets/logo.svg` | ✅ Deleted 2026-05-01 |
| `sample-questions-new-standard.json` (root) | Legacy — questions now in Supabase `question_bank` | ✅ Deleted 2026-05-01 |
| `.claude/agents/exam-architect.md` | Stale (pre-Supabase paths); `/api/generate-exam` is the live path | ✅ Deleted 2026-05-01 |
| `.claude/agents/question-coder.md` | Superseded by `/generate-batch` | ✅ Deleted 2026-05-01 |

### Editor/IDE config dirs to audit

The repo currently has 14 IDE/agent config dirs at root:
`.agent`, `.antigravity`, `.codebuddy`, `.codex`, `.continue`, `.cursor`,
`.gemini`, `.kiro`, `.opencode`, `.qoder`, `.roo`, `.trae`, `.windsurf`.

**Keep `.claude/` only.** The other 13 should be added to `.gitignore` or
deleted entirely depending on which AI tools you actively use. Worth a
30-min audit before launch.

### NOT flagged for cleanup (clear purpose, retain)

`quest-architect-scholar-refactor.md`, `review_queue.json`, `next.config.mjs`,
`tsconfig.json`, `tsconfig.tsbuildinfo`, `package-lock.json`,
`components.json`, `jsconfig.json`, `.env`, `.mcp.json`, `.gitignore`,
`.cursorrules`, `.windsurfrules`, `.clinerules`.

---

## AI Health Indicators

| Indicator | Target | Current |
|---|---|---|
| Rules with clear authority | All 13 have priority order | ✅ |
| Question schema versioned | `Master_Question_Template.md` is version-controlled | ✅ |
| Agent pre-flight checklists | All agents in `AGENTS.md` have mandatory pre-checks | ✅ |
| PostToolUse hooks active | Secret detection + CSS variable enforcement | ✅ |
| ADRs for key decisions | One per major architectural decision | 🟡 ADR-0001 written, ADR-0002+0003 pending write-up, ADR-0004 recorded in dashboard |
| Authority for Plan Quest | `docs/QUEST_PAGE_SPEC.md` v2.0 LOCKED | ✅ |
| Handoff prompts as artefacts | `docs/handoff/` for backend + frontend streams | ✅ |
| Doc cascade currency | CLAUDE.md v4.1, ARCHITECTURE.md v4.0, INDEX.md v2.1, PROJECT_DASHBOARD.md v2.1 | ✅ |

---

## Workflow

**Multi-stream Claude Project structure:**
- Command Center (sprint planning + orchestration)
- Question Factory (question generation)
- Website Design (UI/UX)
- Backend & Admin (auth, DB, API, admin)
- Business & Launch (financials, strategy)
- Question Template Design (schema/template work)

Work routes to the appropriate stream before execution. Detailed prompts
prepared in chat, executed in Claude Code CLI (Git Bash, Windows).
SQL migrations run manually via Supabase SQL Editor.

---

*Update this file at the end of each working session. Coverage numbers and
pending items will drift if not maintained.*
