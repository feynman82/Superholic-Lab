# MOE Templates — DEPRECATED stub
# Superholic Lab | Last updated: 2026-05-02 (router pointer refresh after Phase 1 split)
#
# This rule file is DEPRECATED. The canonical source for question schemas,
# difficulty calibration, visual payload routing, and Singapore context is
# the SPLIT generator template under:
#
#   D:\Git\Superholic-Lab\Master_Question_Template.md     (router, ~160 lines)
#   D:\Git\Superholic-Lab\master_question_template\        (the actual rule files)
#
# Always start with the router. It tells you which sub-files to load for
# the current task. Do NOT load every sub-file — that defeats the purpose
# of the split.
#
# This stub remains in `.claude/rules/` only so that any tooling counting
# "13 active rules" still finds 13 files. Treat it as a pointer.
# =======================================================================

## Where to read instead

| What you need | Read this |
|---|---|
| Entry point (always start here) | `Master_Question_Template.md` (root) |
| System persona + SQL/JSON/FK technical rules + `question_bank` schema columns + AO mapping + final QA checklist | `master_question_template/_base.md` |
| Difficulty rubric (Foundation / Standard / Advanced / HOTS) anchored to PSLE Booklet A + Paper 2 LAQs + per-subject anchors + batch distribution targets | `master_question_template/_calibration.md` |
| Per-type schema + hard rules + difficulty calibration for **mcq** | `master_question_template/types/mcq.md` |
| Per-type schema + hard rules for **cloze** | `master_question_template/types/cloze.md` |
| Per-type schema + hard rules for **editing** | `master_question_template/types/editing.md` |
| Per-type schema + hard rules for **open_ended** | `master_question_template/types/open_ended.md` |
| Per-type schemas for **short_ans / word_problem / comprehension / visual_text** (Phase 2 split pending) | `master_question_template/types/_phase2_remaining.md` |
| FK-enforced canonical taxonomy + per-level topic/sub-topic guidance + anti-hallucination rules + mandatory generation workflow | `master_question_template/canon/canon_taxonomy.md` |
| Visual payload function catalogue + per-(level, topic) diagram routing map + §7 hard rules | `master_question_template/visuals/visuals_full.md` |

## Generation workflow

For autonomous batch generation, run `/generate-batch`
(`.claude/commands/generate-batch.md`). It runs the canon-aware gap analysis
SQL, builds surgical prompts via `scripts/question-factory/prompt-builder.cjs`
(which reads from `master_question_template/` and emits only the relevant
slice — typically 60–80% smaller than loading the full split tree),
generates SQL inserts, validates them against the 10-check list, applies
to Supabase, and updates the live MANIFEST.

The earlier JSON-file workflow (`data/questions/*.json` + `/generate-questions`
+ `question-factory` skill) is removed. All generation now writes directly
to Supabase `question_bank`.
