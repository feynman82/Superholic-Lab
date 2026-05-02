# Shared NotebookLM Prompt Header — Sprint 6 Science Authoring

Paste this BEFORE the per-topic prompt body. NotebookLM treats this as a single message; everything below the `## TASK` line is the actual instruction.

## SOURCES TO ATTACH TO YOUR NOTEBOOK (before pasting any prompt below)

1. **Primary**: `Primary Science Syllabus 2023.pdf` (MOE — authoritative). Do not generate any cell whose Learning Outcome cannot be traced to a page in this PDF.
2. **Secondary** (optional, for question framing realism):
   - One or two PSLE Science specimen / preliminary papers from a school you trust (e.g. Henry Park, Nan Hua, Raffles Girls, Rosyth — recent papers exist under `data/past_year_papers/P3_Primary3/Science/` etc.).
3. **Pedagogy reference (CER-specific)**:
   - Search inside the notebook context for "Claim Evidence Reasoning" — MOE syllabus has a CER glossary on p.81. Use it.
   - If you have access to a Singapore-context CER teaching blog or teacher PD slide deck, attach it.

---

## ROLE

You are authoring a CER-aligned (Claim, Evidence, Reasoning) teaching playbook for Miss Wena, an AI tutor who coaches Singapore Primary 3–6 students on Science. The output JSON is injected verbatim into Miss Wena's runtime system prompts when a student asks for help on the matching (level, topic, sub_topic) combination.

## SOURCE PRIORITY

1. MOE 2023 Primary Science Syllabus PDF — authoritative for Learning Outcomes, vocabulary, scope, and what is NOT required at each level.
2. PSLE specimen papers — exam-realistic question framing, but only as inspiration for `worked_example.question` shape.
3. Your general training data — fall back only when sources 1–2 are silent. Flag any such cell in `notes`.

When sources conflict, MOE wins.

## SCHEMA (cell shape — v3.0)

Every cell must conform exactly:

```json
{
  "subject": "Science",
  "level": "P3",
  "topic": "<Superholic canon topic, exact match — see per-topic prompt below>",
  "sub_topic": "<Superholic canon sub_topic, exact match — see per-topic prompt below>",
  "moe_outcome": "<MOE 2023 syllabus learning outcome, ≤30 words, paraphrased; cite page in notes>",
  "common_misconceptions": [
    "<concrete error pattern a Singapore P-level student makes; tied to a missed CER step>",
    "<second misconception>"
  ],
  "foundational_teach_script": "<60–150 words. STRUCTURED AS CER. P3–P4: narrate the move without naming it ('first say what you think, then point to what you saw, then explain why'). P5–P6: name the move ('this is the CER move'). Use Singapore context throughout.>",
  "cer_structure": {
    "claim_prompt": "<one-sentence prompt asking the student for the answer in one sentence>",
    "evidence_prompt": "<one-sentence prompt asking what the student observed or what is given>",
    "reasoning_prompt": "<one-sentence prompt asking for the scientific principle linking claim and evidence>"
  },
  "worked_example": {
    "question": "<MOE-style open-ended Science question, 1–3 sentences, Singapore context>",
    "wrong_answer_a_child_might_give": "<typically claim-only or evidence-only — make it concrete>",
    "why_its_wrong": "<names the missing CER step, ≤25 words>",
    "correct_answer": {
      "claim": "<one sentence>",
      "evidence": "<observation or fact from question/scenario, ≤25 words>",
      "reasoning": "<scientific principle linking claim and evidence, ≤30 words>"
    },
    "step_by_step_reasoning": "<3–5 numbered steps walking the student through CER construction. Show the student HOW to build each part>"
  },
  "check_for_understanding": {
    "question": "<simpler practice question, 1 sentence, Singapore context>",
    "expected_answer": {
      "claim": "<one sentence>",
      "evidence": "<...>",
      "reasoning": "<...>"
    },
    "if_still_wrong_say": "<scaffold ≤40 words. Name the specific missed CER step. Example: 'You gave a great claim and good evidence! The missing piece is the science rule. Think — what do you know about how heat moves?'>"
  },
  "scaffolding_progression": "<one sentence: prerequisite concept (what came before this skill at a lower level), and what comes after (what builds on it). NOT a lower-level CER step.>",
  "notes": "<MOE 2023 parent topic + page reference. Flag any cell where MOE is silent and you fell back to general knowledge.>"
}
```

## HARD AUTHORING RULES (non-negotiable)

1. **CER triple is structural, not cosmetic.** `worked_example.correct_answer` and `check_for_understanding.expected_answer` MUST be objects with three fields (`claim`, `evidence`, `reasoning`), not strings. The teach script MUST narrate all three moves explicitly (or implicitly at P3–P4) in order.
2. **Wrong answers are CER-decomposition failures.** Most common: student gives claim + evidence, skips reasoning. Second most common: student gives evidence as the claim. `why_its_wrong` must name which CER part is missing.
3. **`if_still_wrong_say` must name the specific missed CER step.** Generic encouragement ("try again!") is rejected.
4. **Singapore-context only.** Names allowed: Wei Ming, Aishah, Priya, Jia En, Kavin, Mei Ling, Daniel Tan, Siti, Ahmad, Hui Xin. Settings allowed: HDB block, void deck, hawker centre, MRT, school canteen, neighbourhood playground, Bishan Park, Gardens by the Bay, NParks, NEA, Singapore Zoo, Marina Bay, East Coast Park. **Banned**: snowy weather, autumn leaves, maple, squirrels, raccoons, "the cottage", American/British school terms (no "homeroom", "Year 5", etc.).
5. **MOE level discipline.** If a concept is "not required" at a level (PDF Notes box), do NOT include it. Foundation Science topics — skip unless explicitly listed. Do not invent learning outcomes.
6. **British spelling throughout.** colour, centre, organise, recognise.
7. **No emoji. No exclamation marks beyond one per cell.**

## OUTPUT FORMAT

JSON ONLY. Wrap as:

```json
{
  "subject": "Science",
  "topic": "<Superholic topic>",
  "cells": [ <cell>, <cell>, ... ]
}
```

No prose, no markdown fences, no preamble. Begin with `{`, end with `}`. The cell order should match the order in the per-topic prompt's allocation list.

## QUALITY SELF-CHECK BEFORE SUBMITTING

- [ ] Every cell's `correct_answer` is an object with three string fields, not a single string.
- [ ] Every `foundational_teach_script` has all three CER moves visible to the model.
- [ ] No banned context words (snow, autumn, maple, etc.).
- [ ] Every `notes` field cites a MOE PDF page.
- [ ] `sub_topic` strings match Superholic canon EXACTLY (verbatim from per-topic prompt).
