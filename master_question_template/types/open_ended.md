# Type: `open_ended` (Science)

> Loaded when `type = 'open_ended'`. Combine with `_base.md`, `_calibration.md`,
> `canon/canon_taxonomy.md`, and (where applicable) `visuals/visuals_full.md`.

Used for Booklet B Science conceptual explanations.

**Required Fields:**
- `type`: "open_ended"
- `question_text`: The main experiment/scenario.
- `parts`: Stringified JSON array containing sub-questions (a), (b), etc.
- `worked_solution` (Inside parts): MUST follow the MOE CER Framework (Claim, Evidence, Reasoning). 
  `[{"label": "(a)", "question": "Explain why...", "correct_answer": "...", "worked_solution": "Identify heat source, evaporation/condensation process...", "keywords": ["heat gain", "evaporate"]}]`

**HARD RULES — VALIDATE BEFORE EMITTING (any violation = row will be rejected):**
1. **Keywords MUST be derived from `worked_solution` text, not from `correct_answer` paraphrasing.** The auto-grader checks the student's response for case-insensitive substring matches against `keywords`, but the model answer it compares against is the `worked_solution` (CER block). If you write keywords based on a paraphrase of `correct_answer`, the model answer itself will fail the grader and any student writing it will be marked wrong. Pick 3–5 important content words/phrases that appear VERBATIM (case-insensitive) in `worked_solution`. Common bug: emitting keywords like `["room temperature","did not lose heat"]` when worked_solution says `"same temperature... does not lose heat"` — different word forms, no match.
2. **Validate before emitting**: for every part, check that at least one keyword appears as a case-insensitive substring of that part's `worked_solution`. If none do, regenerate the keywords.
3. **Keywords must be domain-specific content words** — not generic connectors like "the", "is", "this", "because". Singapore MOE markers want to see students use the technical vocabulary (e.g. `"thermal expansion"`, `"chlorophyll"`, `"convection"`).
4. **Match level**: P3–P4 keywords should be plain English (`"heat"`, `"melts"`); P5–P6 may include the technical terms (`"thermal energy"`, `"sublimation"`).
5. **3–5 keywords per part is the standard**. Fewer than 3 → grader becomes too strict. More than 5 → grader becomes too lenient.
