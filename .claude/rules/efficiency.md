# Efficiency — Superholic Lab
# Last updated: 2026-03-29
#
# Token economy, context management, and self-healing protocols.
# These rules prevent context bloat and ensure Claude Code sessions
# remain productive throughout long implementation tasks.
# =======================================================================

## 1. Mandatory /compact Triggers

Run `/compact` at these EXACT checkpoints — do not defer:

| Trigger | When |
|---|---|
| Task boundary | After completing any task > 30 minutes of work |
| Subject switch | Before switching between Maths, Science, or English content |
| Question batch | After generating any batch of 5+ questions |
| Phase transition | Between implementation phases (e.g., Phase 1 → Phase 2) |
| Pre-deploy | Before running the /deploy checklist |
| Post-debug | After resolving any bug that required > 3 back-and-forth exchanges |

Run `/clear` (full context reset) only when:
- Switching to a completely unrelated task
- Starting a new work session after a break
- Context window approaches 80% capacity

## 2. Context Budget by Task Type

| Task | Recommended Model | Files to Load |
|---|---|---|
| Generate questions | sonnet | moe-templates.md + target question file |
| Bug fix | sonnet | Affected file(s) only |
| New page (Next.js) | sonnet | page-builder skill + design-system.md |
| Database migration | sonnet | supabase-patterns skill + schema file |
| Architecture decision | opus | ARCHITECTURE.md + relevant ADRs |
| Security review | sonnet | security.md + safety.md + target files |
| Content review | sonnet | pedagogical-standards.md + question files |

## 3. File Reading Economy

- Read ONLY the section you need — use `offset` + `limit` for large files
- Never paste entire files into a prompt when a path reference suffices
- For question bank work: read only the target topic file, not the aggregate
- Reference file paths instead of content wherever possible
- Max 3 full file reads per response before considering /compact

## 4. MCP Server On/Off Matrix

Enable ONLY what the current task requires.

| Task | supabase | github | filesystem |
|---|---|---|---|
| Generate/edit questions | ✗ | ✗ | ✓ |
| Database schema work | ✓ | ✗ | ✓ |
| Deploy / push | ✗ | ✓ | ✗ |
| Code review | ✗ | ✓ | ✓ |
| All-up session | ✓ | ✓ | ✓ |

Disable unused MCP servers: fewer active connections = less context overhead.

## 5. Question Generation Token Economy

When generating questions, follow this exact sequence to minimise wasted tokens:

```
1. Read MANIFEST.md to identify gaps (30 seconds, ~200 tokens)
2. Read target topic file ONCE to extract existing IDs
3. Generate ALL questions for that topic in ONE pass (not one at a time)
4. Validate all IDs are unique BEFORE writing the file
5. Write the file once — no incremental writes
```

Never generate questions one at a time in separate responses.
Never read the same file twice in the same session.

## 6. Prompt Compression Rules

When writing prompts to the AI tutor (api/chat.js route handler):
- System prompt must be ≤ 500 tokens (currently ~200 — keep it that way)
- Include ONLY: role, safety rules, CER framework, scaffold levels
- Do NOT include: entire question bank, all worked solutions, full PSLE syllabus
- Fetch only the CURRENT question's data — not the full topic file

## 7. Response Length Discipline

Claude Code responses should be:
- Code: as long as needed — never truncate working code
- Explanations: 1–3 sentences max unless complexity demands more
- Status updates: one line
- No trailing summaries of what was just done
- No preamble ("Great question! I'll now...") — go directly to the answer

## 8. Self-Healing Post-Mortem Rule

If any implementation task FAILS 3 times consecutively:

1. **STOP** attempting the same approach
2. Write root cause to `.claude/memory/POSTMORTEM-[YYYY-MM-DD].md`:
   ```markdown
   ## Task
   [What was being attempted]
   ## Root Cause
   [Why it kept failing]
   ## Rule Gap
   [Which rule file should have prevented this]
   ## Proposed Amendment
   [Exact text to add to the rule file]
   ```
3. Present the amendment to the user for approval
4. Only resume the task after the rule is updated
5. Do NOT use workarounds that paper over the underlying issue

This rule applies to: build failures, type errors, RLS violations, hook failures.

## 9. Session End Protocol

At natural session end, ALWAYS run `/session-end` before closing.
This generates a handoff summary so the next session starts oriented.
Never leave a session without recording the current state.

## 10. Cognitive Load Reduction

For complex multi-file changes:
- Break into the smallest committable units
- Commit after each logical step
- Never hold > 5 uncommitted file changes at once
- If a change affects > 3 files, write a plan first (use /plan command)
