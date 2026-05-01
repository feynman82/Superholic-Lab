# AGENTS.md — Superholic Lab Subagents

> Registry of file-based subagents that Claude Code can dispatch.
> Last updated: 2026-05-01 | v2.0 (canon v5 era)
>
> The agent prompt files live in `.claude/agents/*.md`. This file is the
> registry pointing to them — open the prompt file for the full instructions.

---

## How agents are invoked

In Claude Code, agents are invoked via the `Task` tool with a matching
`subagent_type`. The subagent loads its prompt file from `.claude/agents/`
and runs in an isolated context with only the tools it declares.

For ad-hoc reviews and one-off questions (security review, code review, etc.)
without a dedicated agent file, use the built-in `general-purpose`,
`Plan`, or `Explore` agents — no AGENTS.md entry required.

---

## Active agents (file-based)

### `design-guardian` — UI/UX Auditor
**File:** `.claude/agents/design-guardian.md`
**Role:** Visual consistency cop. Audits any HTML page against the
Rose & Sage design system (`.claude/rules/design-system.md`) and outputs
a scored remediation list (HIGH/MEDIUM/PASSED).
**When to invoke:** Before merging any change to `public/pages/*.html`,
or when a page "feels off" visually.
**Status:** ✅ current.

### `miss_wena` — AI Tutor + Parent Intelligence
**File:** `.claude/agents/miss_wena.md`
**Role:** Defines the persona and operating modes for Superholic Lab's
AI tutor character. Mode A = live chat (`/api/chat`), Mode B = parent
weakness reports (`/api/analyze-weakness`).
**When to invoke:** When authoring or editing system prompts for any
chat/tutor/report endpoint that speaks as Miss Wena.
**Status:** ✅ current. Authoritative source for Miss Wena voice + safety.

### `exam-architect` — Exam paper assembly
**File:** `.claude/agents/exam-architect.md`
**Role:** Orchestrates MOE-aligned exam paper generation for WA1/WA2/EOY
/Prelims (P3–P6). Pulls from question bank, falls back to AI generation
when the bank is thin.
**When to invoke:** Generating a full WA/EOY/Prelim/PSLE practice paper.
**Status:** ⚠️ **STALE — pending rewrite** (Batch 3). Currently references
`data/questions/*.json` and `MANIFEST.md` paths from the pre-Supabase era;
real bank lives in Supabase `question_bank`. Until rewritten, treat its
question-loading instructions as illustrative — fetch from Supabase instead.

### `question-coder` — Question generator (legacy)
**File:** `.claude/agents/question-coder.md`
**Role:** Earlier-generation question bank generator. Predates the canon
v5 migration and the `/generate-batch` slash command.
**Status:** ⚠️ **DEPRECATED — superseded by `/generate-batch`** (`.claude/commands/generate-batch.md`).
The slash command runs the gap-analysis SQL, builds surgical prompts, and
inserts directly to Supabase. Use that instead.
**Decision pending:** delete or rewrite as a thin pointer (Batch 3).

---

## Notes

- `design-guardian - Copy.md` (literal duplicate filename) exists in
  `.claude/agents/` and should be deleted. It is not a real agent.
- The earlier AGENTS.md listed 7 conceptual agents (planner, code-reviewer,
  security-reviewer, quiz-content-reviewer, database-reviewer,
  progress-intelligence, question-factory-agent). None of these were
  ever wired up as dispatchable subagents — they were prompt templates
  that drifted out of relevance. For those review modes, use the
  built-in `general-purpose` agent with an explicit prompt referencing
  the relevant rule file in `.claude/rules/`.
- `progress-intelligence`'s logic now lives in `/api/analyze-weakness`
  (handler in `lib/api/handlers.js`) — a serverless route, not an agent.
