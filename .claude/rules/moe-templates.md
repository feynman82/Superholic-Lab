# MOE Templates — DEPRECATED stub
# Superholic Lab | Last updated: 2026-05-01
#
# This rule file is DEPRECATED. The canonical source for question schemas,
# difficulty calibration, visual payload routing, and Singapore context is:
#
#   D:\Git\Superholic-Lab\Master_Question_Template.md   (v5.0)
#
# Read that file once before any question generation. It supersedes the
# schemas, CER framework, mathematical heuristics, type matrix, and
# distribution targets that previously lived here.
#
# This stub remains in `.claude/rules/` only so that any tooling counting
# "13 active rules" still finds 13 files. Treat it as a pointer.
# =======================================================================

## Where to read instead

| What you need | Read this |
|---|---|
| Universal base schema (all 8 question types) | `Master_Question_Template.md` §3 |
| Per-type schemas (mcq, short_ans, word_problem, open_ended, cloze, editing, comprehension, visual_text) | `Master_Question_Template.md` §3 |
| Level guidance (per-level topic/sub-topic introduction) | `Master_Question_Template.md` §4 |
| Difficulty calibration (Foundation / Standard / Advanced / HOTS, anchored to PSLE Booklet A + Paper 2 LAQs) | `Master_Question_Template.md` §5 |
| Visual payload routing + diagram primitives | `Master_Question_Template.md` §6, §7 |
| Singapore context mandate (names, places, currency) | `Master_Question_Template.md` §1 |
| SQL escaping + JSON stringification rules | `Master_Question_Template.md` §2 |
| FK constraint behaviour (`fk_qb_level_topic`) | `Master_Question_Template.md` §2 + `ARCHITECTURE.md` CANON TABLES section |

## Generation workflow

For autonomous batch generation, run `/generate-batch`
(`.claude/commands/generate-batch.md`). It runs the canon-aware gap analysis
SQL, builds surgical prompts via `scripts/question-factory/prompt-builder.js`,
generates SQL inserts, validates them against the 10-check list, applies
to Supabase, and updates the live MANIFEST.

The earlier JSON-file workflow (`data/questions/*.json` + `/generate-questions`
+ `question-factory` skill) is removed. All generation now writes directly
to Supabase `question_bank`.
