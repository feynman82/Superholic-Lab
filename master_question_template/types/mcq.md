# Type: `mcq` (Mathematics, Science, English)

> Loaded when `type = 'mcq'`. Combine with `_base.md`, `_calibration.md`,
> and the relevant `canon/` taxonomy file before generating.

Requires exactly 4 options. Options must be full sentences for Science/English.

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
