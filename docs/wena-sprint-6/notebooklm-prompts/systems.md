# NotebookLM Prompt — Science / Systems

> Paste `_shared-header.md` first, then this body.

## TASK

Generate **5 cells** for the Superholic Science topic `Systems`. Spans P4 + P5.

### Allocation

| # | level | topic | sub_topic | MOE 2023 parent | PDF page |
|---|---|---|---|---|---|
| 1 | `P4` | `Systems` | `Plant Parts And Functions` | Plant System (Plant parts and functions) | 50 |
| 2 | `P4` | `Systems` | `Human Digestive System` | Human System (Digestive System) | 49 |
| 3 | `P5` | `Systems` | `Plant Respiratory And Circulatory Systems` | Plant System (Respiratory and circulatory systems) | 51 |
| 4 | `P5` | `Systems` | `Human Respiratory And Circulatory Systems` | Human System (Respiratory and circulatory systems) | 50 |
| 5 | `P5` | `Systems` | `Electrical Systems And Circuits` | Electrical System | 52 |

### Topic-specific guidance

**MOE 2023 outcomes:**
- P4 plant parts: roots (anchor + absorb water/mineral salts), stem (transport + support), leaves (food production via light), flowers (reproduction), fruits (protect seeds).
- P4 digestive system: mouth, oesophagus, stomach, small intestine, large intestine. Function in breaking down food + absorbing nutrients + removing waste.
- P5 plant transport: water from roots → stem → leaves (transpiration pull); food from leaves → rest of plant. Avoid using "xylem/phloem" specifically — MOE 2023 P5 wording is "plant transport system" not the named tissues.
- P5 human respiratory: lungs, trachea, alveoli (gas exchange — O₂ in, CO₂ out).
- P5 human circulatory: heart, blood vessels (arteries, veins, capillaries), blood. Heart pumps; blood carries O₂/CO₂/digested food/waste.
- P5 electrical system: simple circuits (cell, wire, bulb, switch). Open vs closed circuits. Series circuits (no parallel at P5). Conductors vs insulators.

**CER applied to Systems:**
- *Claim* = identify the part / explain why a system fails / predict an outcome.
- *Evidence* = observation (the leaf wilted; the bulb didn't light; the circuit shows a gap).
- *Reasoning* = function rule (roots absorb water; bulbs light only when circuit is closed; oxygen enters blood at the alveoli).

**Common misconceptions:**
- Plant parts: "leaves drink water" (confuses leaves with roots).
- Digestive: "food gets absorbed in the stomach" (most absorption is small intestine).
- Plant transport: "the leaves push water up" (no — it's pulled by transpiration).
- Human respiratory: "lungs make oxygen" (lungs exchange, don't manufacture).
- Human circulatory: "blood is only red" (looks redder when oxygenated; veins look blue through skin but blood isn't blue).
- Electrical: "a bulb lights when there's a battery" (skips reasoning about closed circuit + complete path).

**Singapore context:** NParks community garden plants, hawker centre uncle eating laksa (digestion entry), HDB lift circuit (closed when door is shut, lift moves), school canteen drinks fridge wiring, MRT escalator electrical system, NTUC FairPrice torch with batteries.

**Tone:** P4 narrates CER without naming. P5 names CER explicitly.

### `cer_structure` adaptation

For each cell, the three prompts should fit the sub-topic. Examples:
- Plant parts: claim = "the [root/stem/leaf] does X"; evidence = "I see X happening in the plant"; reasoning = "the [part] is for [function]".
- Digestive: claim = which organ + what it does; evidence = the food's journey; reasoning = the named function.
- Electrical: claim = "the bulb lights / does not light"; evidence = "the switch is open / the wire is broken"; reasoning = "a circuit needs an unbroken path".

### Self-check

- [ ] Avoid "xylem/phloem" — MOE 2023 P5 stops at "plant transport system".
- [ ] No parallel circuits at P5 (P5 covers series only).
- [ ] Heart chambers: MOE asks for awareness of pumping, not naming all 4 chambers — keep it accessible.
- [ ] Singapore context, no foreign settings.
- [ ] Output is one JSON object with `cells: [5 cells]`.
