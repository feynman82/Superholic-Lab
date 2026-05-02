# NotebookLM Prompt — Science / Cycles

> Paste `_shared-header.md` first, then this body.

## TASK

Generate **5 cells** for the Superholic Science topic `Cycles`. Spans P3 + P5.

### Allocation

| # | level | topic | sub_topic | MOE 2023 parent | PDF page |
|---|---|---|---|---|---|
| 1 | `P3` | `Cycles` | `Life Cycles Of Insects` | Cycles in Plants and Animals (Life Cycles) | 41 |
| 2 | `P3` | `Cycles` | `Life Cycles Of Amphibians` | Cycles in Plants and Animals (Life Cycles) | 41 |
| 3 | `P3` | `Cycles` | `Life Cycles Of Flowering Plants` | Cycles in Plants and Animals (Life Cycles) | 41 |
| 4 | `P5` | `Cycles` | `Reproduction In Plants And Animals` | Cycles in Plants and Animals (Reproduction) | 43 |
| 5 | `P5` | `Cycles` | `Stages Of The Water Cycle` | Cycles in Matter and Water (Water) | 47 |

Note: P4 Cycles is *Cycles in Matter and Water (Matter)* — that maps to Superholic's separate `Matter` topic, authored in `matter.md`. Do not include Matter cells here.

### Topic-specific guidance

**MOE 2023 outcomes:**
- Life cycles of insects: stages of complete (egg→larva→pupa→adult, e.g. butterfly) and incomplete (egg→nymph→adult, e.g. cockroach) metamorphosis.
- Life cycles of amphibians: egg→tadpole→young adult→adult (e.g., frog).
- Life cycles of flowering plants: seed→seedling→adult (with flowers/fruits/seeds).
- Reproduction P5: parts of a flower (stigma, style, ovary, anther, filament, petal, sepal); pollination (insect, wind, animal, water, self/cross); fertilisation; seed dispersal (wind, water, animal, splitting/explosion).
- Water cycle P5: evaporation, condensation, precipitation, collection. Driven by heat from the sun.

**CER applied to Cycles:**
- *Claim* = the stage / the process / the prediction (e.g., "this is a pupa", "this is condensation").
- *Evidence* = observable feature (e.g., "it has a hard outer shell and is not moving"; "water droplets formed on the cold glass").
- *Reasoning* = the cycle/process rule (e.g., "in complete metamorphosis, the pupa stage is between larva and adult and is not active"; "condensation happens when water vapour cools and turns back to liquid").

**Common misconceptions:**
- P3 insects: "the butterfly egg becomes a butterfly directly" (skips larva/pupa).
- P3 amphibians: "tadpoles breathe air" (they breathe through gills until they grow lungs).
- P3 flowering plants: confuses fruit with flower; doesn't connect seed inside fruit to the next plant.
- P5 reproduction: confuses pollination with fertilisation; thinks pollen and seed are the same thing.
- P5 water cycle: skips reasoning ("the water just disappears") — gives evidence (the puddle dried up) without naming evaporation.

**Singapore context:** Singapore Zoo butterfly garden, kampung/HDB pond with frogs, NParks community garden, hawker centre fan blowing condensation off iced drinks, monsoon rain in Bishan, evaporation off MRT platform after a flood, rambutan/durian/mango fruit examples (familiar SG fruits).

### CER scaffolding tone

- P3 cells: narrate without naming. ("Three little steps: say the stage, point to the clue, say the rule.")
- P5 cells: name the move. ("This is the CER move: Claim, Evidence, Reasoning.")

### `cer_structure` adaptation per cell

For each cell, adapt the three prompts to the sub-topic:
- Insects: claim = stage; evidence = visible feature; reasoning = metamorphosis rule.
- Amphibians: same shape.
- Flowering plants: claim = stage / process; evidence = observable feature.
- Reproduction (P5): claim = "this is pollination" / "this is fertilisation"; evidence = where pollen lands / what happens after; reasoning = the named process.
- Water cycle (P5): claim = "this is evaporation"; evidence = "the puddle got smaller"; reasoning = "water gains heat, turns to gas, rises".

### Self-check

- [ ] All P3 cells use simple language ("stage", "shell", "wet"); P5 cells may use "metamorphosis", "stigma", "condensation" — but not jargon beyond the syllabus (no "diapause", no "spermatozoa").
- [ ] Reproduction cell does NOT include human reproduction (P5/P6 syllabus stops at plants and animals; human reproductive organ details are not in this Learning Outcome).
- [ ] Water cycle cell uses Sun as the energy source (MOE explicit on this).
- [ ] Singapore context, no foreign weather.
- [ ] Output is one JSON object with `cells: [5 cells]`.
