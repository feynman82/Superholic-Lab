# Difficulty Calibration Guide

> Cross-cutting rubric for tagging the `difficulty` column.
> Loaded by every router invocation. Apply after picking a (type, subject, level)
> and before emitting the row's `difficulty` value.

**MANDATORY:** Before tagging the `difficulty` column, walk through this rubric. Tag the LOWEST band the question qualifies for. When in doubt between two bands, choose the lower. **HOTS must be earned, not defaulted to.**

---------------------------------------------------------------
## Universal definitions (apply to all subjects)
---------------------------------------------------------------

| Band | Cognitive Skill (AO) | Steps to solve | Vocabulary | Context | Target % of bank |
|---|---|---|---|---|---|
| **Foundation** | AO1 only — recall / direct retrieval | 1 step | At or below grade level | Familiar, textbook-standard | **20%** |
| **Standard** | AO1 → AO2 — recall + 1 application | 2–3 steps | At grade level | Familiar with one twist | **50%** |
| **Advanced** | AO2 → light AO3 — apply + analyse | 3–4 steps | At/above grade level | Some unfamiliar phrasing or distractors | **20%** |
| **HOTS** | Pure AO3 — analyse + synthesise + evaluate | 4+ steps OR novel reasoning required | Above grade level | Novel context, abstract, or counter-intuitive | **10%** |

**Reality check after generating a batch (≥10 questions):** If the HOTS share exceeds 30%, re-tag the easier half down to Advanced or Standard. If Foundation < 15%, the batch lacks entry-point questions — flag for review.

---------------------------------------------------------------
## The "earn HOTS" gate
---------------------------------------------------------------

A question qualifies as HOTS only if it satisfies **BOTH**:
- (a) Cognitive complexity ≥ 4 distinct operations, OR requires reasoning across two topics, OR demands a non-routine heuristic, AND
- (b) Novel context, advanced vocabulary, or a counter-intuitive answer.

If only one condition is met → **Advanced**, not HOTS.

---------------------------------------------------------------
## Anti-default rules (to break the "everything is HOTS" failure mode)
---------------------------------------------------------------

- A question solvable by a **single named MOE heuristic** (bar model, before-after, "respectively", SVA rule) → **Standard at most**.
- A question with **one transformation step** and **familiar vocabulary** → **Foundation**.
- Hard vocabulary alone does not qualify HOTS — it shifts the band up by *one* only.
- Long question text alone does not qualify HOTS — count cognitive operations, not words.
- "Had it not been for [noun phrase]" → **Advanced**, not HOTS, unless it also requires nominalisation of a verb phrase + tense shift.
- Standalone subject-verb agreement, tense shift, or basic pronoun questions → **Foundation**, never higher.
- 1-mark MCQs are rarely HOTS. Default such rows to Standard unless the cognitive complexity is provably AO3.

---------------------------------------------------------------
## Per-subject anchors
---------------------------------------------------------------

**MATHEMATICS**

| Band | Marker | Example |
|---|---|---|
| Foundation | 1-step computation, single-digit operations, formula given or implied | "What is 3/4 + 1/4?" |
| Standard | 2-step problem, single bar model, one unit conversion | "Ahmad has 60 tarts. He gives 1/3 away. How many left?" |
| Advanced | 3+ step model drawing, percentage-of-percentage, ratio with constant part | "20% of A = 30% of B. A:B = ?" |
| HOTS | Working backwards, internal-transfer ratio, multi-stage before-after-after, untruthful witness logic | "After Ali gives 1/4 of his stickers to Bala then receives 5 from Chen, he has 25. He had 1/3 fewer than Bala originally. Find Bala's original count." |

**SCIENCE**

| Band | Marker | Example |
|---|---|---|
| Foundation | Name a part, define a term, literal recall | "Name three states of matter." |
| Standard | Identify + brief explain (one concept) | "Why is the metal spoon hotter than the plastic spoon?" |
| Advanced | Full CER (Claim, Evidence, Reasoning), identify variables, fair-test reasoning | "Setup A and B differ in cloth colour. Predict the temperature difference and justify." |
| HOTS | Predict + justify across two topics, design-your-own-experiment, counter-intuitive prediction | "Plants in sealed jars die. Predict whether a candle inside survives longer with or without a plant. Justify using two concepts." |

**ENGLISH — Synthesis & Transformation**

| Band | Marker | Example connector / pattern |
|---|---|---|
| Foundation | One mechanical connector, no nominalisation | `and`, `but`, `because`, `when`, `who`, `whose`, `although`, `even though`, `respectively`, `too…to`, `while` |
| Standard | One transformation (active↔passive, tense shift, gerund conversion, SVA correction) | "Despite + gerund", "Having + past participle", reported speech (1 tense shift) |
| Advanced | Nominalisation + restructure (adjective→noun + clause merge) | "Out of [noun]…", "Such was [noun] that…", "Much to the [noun] of…" |
| HOTS | Subjunctive conditional, emphatic cleft, multi-clause inversion, double tense shift | "Had it not been for…", "It was [noun] that…", "Hardly had X when Y", "No sooner had X than Y", "Not until X did Y" |

**ENGLISH — Cloze / Editing / Comprehension**

| Band | Cloze | Editing | Comprehension |
|---|---|---|---|
| Foundation | Common phrasal verbs, basic prepositions | SVA, simple tense, common spelling | 1m direct retrieval ("Where did Tom go?") |
| Standard | Tense agreement, common collocations | Past tense irregulars, plural agreement | 1m inference from one paragraph |
| Advanced | Register-aware vocab, conditional connectives | Subjunctive forms, advanced spelling | 2m CER from 2+ paragraphs |
| HOTS | Stylistic register choice, idiomatic phrase | Multi-error trap, register-shift correction | 3m author's purpose, theme, irony |

---------------------------------------------------------------
## Distribution targets per generation batch
---------------------------------------------------------------

When generating ≥10 questions in a single call, the AI MUST respect approximately:

```
Foundation : 20%   (e.g. 2 of 10)
Standard   : 50%   (e.g. 5 of 10)
Advanced   : 20%   (e.g. 2 of 10)
HOTS       : 10%   (e.g. 1 of 10)
```

A batch with >30% HOTS or <15% Foundation must be self-corrected before output.
