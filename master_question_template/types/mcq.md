# Type: `mcq` (Mathematics, Science, English)

> Loaded when `type = 'mcq'`. Combine with `_base.md`, `_calibration.md`,
> and the relevant `canon/` taxonomy file before generating.

Requires exactly 4 options. Option format depends on subject — see "OPTION FORMAT" section below. **Mathematics options are short values; English options are words/phrases; only Science options are full sentences.**

## OPTION FORMAT (subject-specific, NON-NEGOTIABLE)

| Subject | Option format | Example |
|---|---|---|
| **Mathematics** | Short answer values only (number, fraction, measurement, brief label) | `"8/5"`, `"$3.30"`, `"132°"`, `"2 : 3"` |
| **Science** | Full sentences explaining what happens AND why | `"The metal ball contracts because cooling causes particles to lose energy."` |
| **English** | Single words or short phrases (grammar choices, vocabulary, idiom completion) | `"ran"`, `"however"`, `"furious"`, `"call off"` |

### English MCQ — banned option patterns (auto-reject during Phase 5)

Generators have repeatedly emitted full-sentence options for English MCQ. This is FORBIDDEN.

✗ **WRONG** (full-sentence option, will be deprecated):
```
"options": [
  "She went to the market because she needed to buy vegetables.",
  "She walks to the market because she needs to buy vegetables.",
  ...
]
```

✓ **CORRECT** (word/phrase option):
```
"question_text": "Yesterday, Siti _______ to the market to buy vegetables.",
"options": ["go", "goes", "went", "gone"]
```

If your draft English MCQ has options longer than ~5 words, restructure the question stem to embed the context and reduce the option to the smallest distinguishing unit (a single tense, preposition, conjunction, vocabulary word, or phrasal verb). Reason: bank rule (saved as `feedback_english_mcq_options.md`) — full-sentence English options confuse students about whether the test is grammar/vocabulary or comprehension.

## MATHEMATICS ARITHMETIC SANITY CHECK (mandatory pre-emit)

Mathematics MCQ rows have been deprecated for arithmetic errors where `correct_answer` does not match the math in `worked_solution` (e.g. stated total of $74,526 but parts sum to a different number; algebra question where x = 14 gives total 105 not the stated 113).

Before emitting any Mathematics MCQ, run this two-pass check:

1. **Forward pass**: Solve the question independently from your worked_solution. Compute each step. Arrive at a final number.
2. **Reverse pass**: Take your stated `correct_answer` and verify the worked_solution's arithmetic flows to it without rounding or off-by-one errors.

**Reject and regenerate if:**
- Forward and reverse passes give different numbers.
- worked_solution shows a non-integer intermediate result for a problem expecting an integer answer (e.g. "x = 13.857..." when the question states whole pencils, whole dollars, whole people).
- Any wrong_explanation references a calc_error number that doesn't actually result from the misconception described.
- The sum of "parts" in a word problem doesn't equal the stated whole.
- A percentage cascade leaves a non-zero unaccounted remainder.

**Specific traps to guard against:**
- Adding `$24 + $72` and getting `$95`. Compute both forward and reverse.
- Stating "0.2 × X = $96" then claiming X = $510 (correct: $480).
- Writing "x = 14" in a step but the equation requires x = 13.5 — flag the question as unsolvable in the integer domain and regenerate with different numbers.

## DISTRACTOR ARITHMETIC DERIVATION (mandatory pre-emit)

The audit pipeline keeps catching wrong_explanations whose described error path doesn't actually produce the stated distractor value (e.g. "student computed 360÷3=120°" used to explain a 90° distractor; or "5n+60=360→n≈48" used to explain a distractor of 45). These look plausible but break under inspection.

**Rule:** Every wrong_explanation entry MUST include an arithmetic path that, when followed exactly, terminates at the distractor value the entry is keyed by. Verify each entry against this rule before emitting:

For each wrong option `O` with explanation `E`:
1. Read `E` as if you were a student making the described error.
2. Perform the calculation `E` describes, step by step.
3. Confirm the final number EQUALS `O`.
4. If the result doesn't equal `O`, REWRITE the explanation to describe an error path that does — or pick a different distractor.

**Acceptable non-arithmetic explanations:**
- "Confused {given value} for the answer" — when the distractor literally equals a number from the question stem (e.g. picking 112° as the answer when 112° was the given DAB angle, with the misconception being "opposite vs co-interior").
- "Confused {category}" — e.g. picking "4 cm" as the side of a rhombus because 4 is the number-of-sides count.

These are misconception-typed entries where the distractor is a recognised value, not a computed one. They must still be honest: don't fabricate an arithmetic path that doesn't compute.

**Validation question to ask before emitting:** "If I were a student making the error described in `wrong_explanations[O].text`, would I land on exactly `O`? If no, regenerate."



**Required Fields:**
- `type`: "mcq"
- `cognitive_skill`: Use the AO mapping defined in `_base.md` §3.
- `sub_topic`: MUST be a granular micro-concept (e.g., "Unit Cost", "Experimental Fairness", "Subject-Verb Agreement").
- `options`: `["Option A", "Option B", "Option C", "Option D"]`
- `correct_answer`: Must be one of the strings in `options`.
- `wrong_explanations`: **MUST contain exactly one entry per distractor (3 entries for a 4-option MCQ — one for each option that is NOT the correct answer).** Keys MUST be the full option text, not letters. Each value MUST be an object with a `text` (the misconception explanation) and a `type` (`misconception` | `calc_error` | `partial_logic`) for BKT analysis. Generators that emit fewer than 3 entries will be rejected — the missing entries leave the wrong-answer feedback panel blank for any student who picks the uncovered distractor.
  * *Format (3-of-3 required for 4-option MCQ):*
    ```json
    {
      "Frictional force": { "text": "Friction is a contact force; this question describes a non-contact scenario.", "type": "misconception" },
      "Magnetic force": { "text": "Magnetic force only acts on magnetic materials, but the object here is plastic.", "type": "misconception" },
      "Elastic spring force": { "text": "Spring force requires physical compression or stretching, which is not happening.", "type": "misconception" }
    }
    ```
    (The 4th option is the correct answer and is therefore NOT keyed in this object.)

**SCIENCE EXPERIMENTAL MCQS:**
- `visual_payload`: MUST include experimental variables if the question involves a setup.
  * *Example:* `{"function_name": "genericExperiment", "params": {"Setup A": "30ml water, black cloth", "Setup B": "30ml water, white cloth", "independent_variable": "color of cloth", "dependent_variable": "temperature change"}}`

**MATHEMATICS DIFFICULTY CALIBRATION (SINGAPORE TUITION CONVENTION):**

⚠️ **CRITICAL TIER MAPPING (revised 2026-04-30 after user feedback):**
The Superholic Lab `difficulty` enum maps to the following Singapore tuition
standard. Generators MUST use these calibration anchors, not naive PSLE
Booklet A position alone.

| `difficulty` | Singapore tuition equivalent | PSLE benchmark |
|---|---|---|
| Foundation | (transitional / lower-primary level — used for reclassified P3/P4 content; not the main P6 tier) | P3/P4-style single-step recall or one-operation problems |
| Standard | Singapore **Foundational** | PSLE Booklet A **Q1–Q10** (1m, single-step, direct recall or simple computation) |
| Advanced | Singapore **Standard** | PSLE Booklet A **Q11–Q15** (2m, multi-step, named-misconception distractors) |
| HOTS | Singapore **Advanced** | PSLE Paper 2 **Q26–Q30** (4–5 marks, non-routine LAQ — multi-heuristic, requires transfer or invention of method, NOT a routine sequence of operations) |

**Key takeaway: HOTS = true PSLE LAQ caliber.** A HOTS question must NOT be
solvable by chaining 3–4 routine operations. It must require:
  - Setting up a non-obvious unit, model, or before-after diagram, OR
  - Combining two or more PSLE heuristics (e.g. constant-difference + ratio,
    overlap + percentage, units-and-parts + working-backwards), OR
  - Recognising a hidden invariant or symmetry that simplifies the problem,
  OR
  - A genuine "transfer" — applying a method in a context the student has
    never seen exactly the same shape of before.

If a draft labelled HOTS could be solved by a competent P6 student in under
2 minutes with just BODMAS and table recall, **re-tier it to Advanced** and
write a harder one for HOTS.

Authoritative reference: actual PSLE Booklet A and Paper 2 papers in
`data/past_year_papers/P6_Primary6_PSLE/Maths/`. Read Q11–Q15 (Booklet A)
AND Q26–Q30 (Paper 2 LAQs) before drafting at the corresponding tiers.

| Difficulty | Marks | PSLE Map | Cognitive Load |
|---|---|---|---|
| Foundation | 1 | Booklet A Q1–Q10 | One concept, one step. Direct recall or single-operation computation. Small numbers (≤ 1000 or simple fractions/decimals). |
| Standard   | 2 | Booklet A Q11–Q15 | Multi-step (≥ 2 operations OR one heuristic + computation). PSLE-magnitude numbers (percentages of $XXX–$X,XXX, composite figures requiring at least one subtraction, ratios with quantities > 10, time spans crossing multiple hours, volumes built from unit cubes). May require diagram interpretation. |
| Advanced   | 2–3 | Paper 2 SAQ Q21–Q25 | Two heuristics chained (e.g. before/after + percentage; constant difference + ratio). 3+ operations. Question wording requires deliberate unpacking. |
| HOTS       | 3–5 | Paper 2 LAQ Q26–Q30 | Non-routine. Multiple representations needed (model + algebra, table + reasoning). Student must transfer or invent a method, not apply a memorised one. P5/P6 only. PSLE rarely delivers HOTS as MCQ — when we do, design distractors as four traps for distinct heuristic-misuse patterns. |

**STANDARD-TIER VALIDATION (auto-reject during Phase 5 if any condition is true):**

- Question is solvable in a single operation → re-tier to Foundation.
- Numbers smaller than PSLE Booklet A magnitudes (e.g. P6 Standard with sums under 100, single-digit fractions, no SGD context).
- Distractors are "near-by random numbers" rather than products of named, diagnosable misconceptions. Each `wrong_explanations[option].type` must map to an actual Singapore-classroom error mode (model-drawing slip, percentage-base confusion, area-vs-perimeter swap, unit conversion miss).
- The correct answer is derivable by elimination of the obviously absurd without performing the maths.
- Worked solution would be < 3 numbered steps for a Standard-tier MCQ.

**STANDARD-TIER BENCHMARK QUESTIONS (PSLE 2024 Booklet A — calibrate against these):**

- Q11 (Volume / Whole Numbers): "A solid is made up of 1-cm cubes. How many MORE 1-cm cubes are needed to build a cube of edge 4 cm?" — Two-step: count visible cubes (11) → subtract from 64 → 53.
- Q12 (Circles): "Find the perimeter of the shaded region: 2 quarter circles inside a 10-cm rectangle. (π = 3.14)." — Identify which arcs and edges form the perimeter → compute arc length → sum.
- Q13 (Time + Division): "30 ml of cough syrup, 5 ml every 3 hours, first dose at 4 a.m. — when is the last dose?" — # of doses = 30 ÷ 5 = 6 → elapsed = (6 − 1) × 3 = 15 h → 7 p.m.
- Q14 (Geometry / Nets): "Which of the following is NOT a net of a cube?" — Visual elimination across 4 candidate nets. Reasoning, not arithmetic.
- Q15 (Percentage cascade): "Lisa spent 20% on a blouse. She spent the rest on a skirt and a bracelet. The skirt cost $24 more than the blouse. The bracelet cost $72. Find the cost of the blouse." — Three-equation cascade: blouse = 0.2× total, total − blouse = (blouse + 24) + 72 → solve.

These five share a structural signature: realistic SG context, numbers that
demand actual calculation, distractors mapped to specific error modes, and a
worked solution of 3–5 named steps. Match that signature for any P6 Standard
MCQ generated by this platform.
