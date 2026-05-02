# NotebookLM Prompt — Science / Energy

> Paste `_shared-header.md` first, then this body.

## TASK

Generate **10 cells** for the Superholic Science topic `Energy`. Spans P4 + P6. This is the largest topic in Sprint 6.

### Allocation

**P4 — Light (4 cells):**
| # | level | topic | sub_topic | MOE 2023 parent | PDF page |
|---|---|---|---|---|---|
| 1 | `P4` | `Energy` | `Sources Of Light` | Energy Forms and Uses (Light) | 67 |
| 2 | `P4` | `Energy` | `Reflection Of Light` | Energy Forms and Uses (Light) | 67 |
| 3 | `P4` | `Energy` | `Formation Of Shadows` | Energy Forms and Uses (Light) | 67 |
| 4 | `P4` | `Energy` | `Transparent, Translucent And Opaque Materials` | Energy Forms and Uses (Light) | 67 |

**P4 — Heat (4 cells):**
| # | level | topic | sub_topic | MOE 2023 parent | PDF page |
|---|---|---|---|---|---|
| 5 | `P4` | `Energy` | `Sources Of Heat` | Energy Forms and Uses (Heat) | 69 |
| 6 | `P4` | `Energy` | `Effects Of Heat Gain And Heat Loss` | Energy Forms and Uses (Heat) | 69 |
| 7 | `P4` | `Energy` | `Temperature And Use Of Thermometers` | Energy Forms and Uses (Heat) | 69 |
| 8 | `P4` | `Energy` | `Good And Poor Conductors Of Heat` | Energy Forms and Uses (Heat) | 69 |

**P6 — Photosynthesis + Conversion (2 cells):**
| # | level | topic | sub_topic | MOE 2023 parent | PDF page |
|---|---|---|---|---|---|
| 9 | `P6` | `Energy` | `Photosynthesis And Energy Pathways` | Energy Forms and Uses (Photosynthesis) | 71 |
| 10 | `P6` | `Energy` | `Energy Conversion In Everyday Objects` | Energy Conversion | 73 |

### Topic-specific guidance

**MOE 2023 outcomes:**
- P4 Light: sources (Sun, fire, lamp, torch, glow-stick); reflection from shiny surfaces (mirror, polished metal); shadows form when light is blocked by an opaque object; transparent/translucent/opaque vocabulary IS introduced at P4 Light (note this differs from P3 Diversity where the terms were deferred).
- P4 Heat: heat sources (Sun, fire, hot food, electrical heater); effects of heat gain (rise in temperature, melting, evaporation, expansion); effects of heat loss (drop in temperature, freezing, condensation, contraction); temperature measured in °C with thermometer; good conductors (most metals: copper, iron, aluminium) vs poor conductors / insulators (plastic, wood, air, fabric).
- P6 Photosynthesis: leaves use light + water + carbon dioxide → produce food (glucose / starch) + oxygen; food made by producers feeds consumers along the food chain. Light energy → chemical energy in food.
- P6 Energy Conversion: identify input/output forms across everyday devices. Forms covered: light, heat (thermal), sound, electrical, kinetic (movement), potential (gravitational, elastic), chemical (food, fuel, batteries). Energy is conserved; not "used up", just converted (and often dissipated as heat).

**CER applied to Energy:**
- *Claim* = identify the form / process / output (e.g., "this is a shadow", "the input is electrical, output is light + heat").
- *Evidence* = the observation (the bulb glows; the spoon felt hot).
- *Reasoning* = the energy rule (e.g., "shadows form because opaque objects block light"; "in a torch, the chemical energy in the battery is converted to light + heat").

**Common misconceptions:**
- "Mirrors make light" (no — they reflect it).
- "Shadows are caused by darkness" (skips reasoning that darkness is the absence of light).
- "Temperature and heat are the same" (P4 should distinguish: heat is the energy transferred; temperature is how hot something is).
- "Conductors are warm" (no — they transfer heat efficiently).
- "Plants eat soil" (skips photosynthesis as food production).
- Energy conversion: "the battery makes electricity" (it converts chemical energy to electrical, doesn't "make" it).

**Singapore context:** void deck lights at night, sun streaming through HDB window, MRT platform shadow art, Marina Bay Sands light show (energy conversion), hawker centre stainless steel woks (good heat conductor), kopi-tiam plastic chair on a hot afternoon (poor conductor — stays cooler), Bishan Park trees photosynthesising, NParks community garden, ceiling fan + lights at school canteen (energy conversion examples), NTUC torch.

**Tone:** P4 cells narrate CER without naming. P6 cells name the move ("This is the CER move...").

### `cer_structure` adaptation per cell — examples

- Sources of Light (P4): claim = "X is a source of light"; evidence = "I see it producing its own light"; reasoning = "a source of light makes light, not just reflects it".
- Reflection of Light (P4): claim = "the surface reflects light well"; evidence = "the light bounces off it"; reasoning = "shiny surfaces reflect light better than dull ones".
- Photosynthesis (P6): claim = "the plant is making food"; evidence = "the leaf is in sunlight, gets water and CO₂"; reasoning = "photosynthesis: light + water + CO₂ → glucose + oxygen, in the leaf".
- Energy Conversion (P6): claim = "the input is X, the output is Y"; evidence = "I see Y happening when X is provided"; reasoning = "in this device, X energy is converted to Y energy".

### Self-check

- [ ] Sun is treated as the primary natural source of light AND heat (don't conflate; mention in both).
- [ ] Transparent/translucent/opaque vocabulary IS used at P4 Light (different from P3 Diversity where it was deferred).
- [ ] No mention of photons, wavelengths, or refraction at P4.
- [ ] No mention of conservation of energy as a formal law at P4 — that's P6 territory.
- [ ] Singapore context, no foreign settings.
- [ ] Output is one JSON object with `cells: [10 cells]` in the order listed.
