# NotebookLM Prompt — Science / Diversity

> Paste `_shared-header.md` first, then this body.

## TASK

Generate **3 cells** for the Superholic Science topic `Diversity`. All 3 cells are Primary 3.

### Allocation

Generate one cell per row, in this exact order. Use these strings VERBATIM in the cell's `topic` and `sub_topic` fields:

| # | level | topic | sub_topic | MOE 2023 parent | PDF page |
|---|---|---|---|---|---|
| 1 | `P3` | `Diversity` | `General Characteristics Of Living And Non-Living Things` | Diversity of Living and Non-Living Things (General characteristics and classification) | 38 |
| 2 | `P3` | `Diversity` | `Classification Of Living And Non-Living Things` | Diversity of Living and Non-Living Things (General characteristics and classification) | 38 |
| 3 | `P3` | `Diversity` | `Diversity Of Materials And Their Properties` | Diversity of Materials | 39 |

### Topic-specific guidance

**MOE 2023 outcomes (paraphrased, p.38–39):**
- Living things share characteristics: need water/food/air, grow, respond, reproduce.
- Living things classified into broad groups: plants (flowering, non-flowering), animals (amphibians/birds/fish/insects/mammals/reptiles), fungi (mould/mushroom/yeast), bacteria.
- Materials have physical properties: strength, flexibility, ability to float/sink, waterproof, transparency.
- Recall of specific species names (e.g., "guppy") is NOT required at P3.
- Terms "transparent / translucent / opaque" are NOT required at P3 — describe as "lets most light / some light / no light through".

**CER applied to P3 Diversity:**
- *Claim* = "X is living" / "X is metal" / "this material is waterproof" — the answer in one sentence.
- *Evidence* = an observation: "I see it growing" / "the spoon was hot" / "water did not soak in".
- *Reasoning* = the rule: "living things grow, non-living do not" / "metals conduct heat" / "waterproof materials do not absorb water".

**Common P3 misconceptions to encode:**
- Treats "moves" as the test for living (so a plant looks non-living to them, and a swinging pendulum looks living).
- Says "fish breathe air" (skips that gills extract dissolved oxygen, which IS air-derived but the framing trips them up — at P3, just say "fish need air, just from the water").
- For materials: confuses "strong" with "heavy", "flexible" with "soft".

**Singapore context to use:** classroom plants in HDB corridor, void deck pets, hawker centre tools (steel wok, plastic spoon), NParks signage on living things, neighbourhood playground rubber surface (waterproof + flexible), Marina Bay sea creatures.

### CER scaffolding tone for P3

P3 narrates the CER move without naming it. Example phrasing for `foundational_teach_script`:
> "When Miss Wena asks if something is living, three little steps help us. First, **say what you think** — 'I think the plant is living.' Then, **point to what you see** — 'because it has grown taller this week.' Then, **say the rule** — 'because all living things grow.' Three little steps — like climbing three stairs."

DO NOT use the words "Claim", "Evidence", "Reasoning" in the teach script for P3 cells. Save the named version for P5–P6 cells.

### `cer_structure` field for these P3 cells

Even though the script doesn't name CER, the `cer_structure` block still uses the named prompts so Sprint 7 state machine can call each step:
- `claim_prompt`: "What do you think — is it living, or non-living? Just one short answer."
- `evidence_prompt`: "What did you see that made you think that?"
- `reasoning_prompt`: "What is the science rule that helps us decide?"

Adapt the wording for the materials cell.

### Self-check before output

- [ ] All three cells have `level: "P3"`, `topic: "Diversity"`.
- [ ] Sub_topic strings match the table EXACTLY.
- [ ] No species names a P3 student wouldn't be expected to recall (no "Daphnia", no "Anopheles" — but "fish", "frog", "mosquito" are fine).
- [ ] `Note:` boxes from the PDF respected (e.g., transparency vocabulary deferred to P4 Light).
- [ ] Singapore context, no foreign settings.
- [ ] Output is one JSON object with `cells: [3 cells]`.
