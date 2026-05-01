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

## Active agents (file-based) — 2 total

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

---

## Removed agents

The following agent files were deleted in the 2026-05-01 cleanup. Their
roles are now served by live code paths or slash commands:

| Removed agent | Replaced by |
|---|---|
| `exam-architect.md` | `/api/generate-exam` (handler in `lib/api/handlers.js`) — live AI assembly with Gemini → Claude Haiku fallback. Do not re-introduce a separate agent unless there is a workflow live code can't cover. |
| `question-coder.md` | `/generate-batch` slash command (`.claude/commands/generate-batch.md`) + Master Question Template v5.0 |
| `design-guardian - Copy.md` | Literal duplicate of `design-guardian.md` |

The earlier AGENTS.md (pre-2026-05-01) also listed 7 conceptual agents
(planner, code-reviewer, security-reviewer, quiz-content-reviewer,
database-reviewer, progress-intelligence, question-factory-agent). None
were ever wired up as dispatchable subagents — they were prompt templates.
For those review modes, use the built-in `general-purpose` agent with an
explicit prompt referencing the relevant rule file in `.claude/rules/`.
`progress-intelligence`'s logic now lives in `/api/analyze-weakness`.
