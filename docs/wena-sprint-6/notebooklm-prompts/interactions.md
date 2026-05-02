# NotebookLM Prompt — Science / Interactions

> Paste `_shared-header.md` first, then this body.

## TASK

Generate **7 cells** for the Superholic Science topic `Interactions`. Spans P3 + P6.

### Allocation

| # | level | topic | sub_topic | MOE 2023 parent | PDF page |
|---|---|---|---|---|---|
| 1 | `P3` | `Interactions` | `Interaction Of Magnetic Forces` | Interaction of Forces (Magnets) | 53 |
| 2 | `P6` | `Interactions` | `Frictional Force` | Interaction of Forces (Frictional, gravitational, elastic) | 54 |
| 3 | `P6` | `Interactions` | `Gravitational Force` | Interaction of Forces (Frictional, gravitational, elastic) | 54 |
| 4 | `P6` | `Interactions` | `Elastic Spring Force` | Interaction of Forces (Frictional, gravitational, elastic) | 54 |
| 5 | `P6` | `Interactions` | `Effects Of Forces On Objects` | Interaction of Forces (Frictional, gravitational, elastic) | 54 |
| 6 | `P6` | `Interactions` | `Interactions Within The Environment` | Interactions within the Environment | 56 |
| 7 | `P6` | `Interactions` | `Food Chains And Food Webs` | Interactions within the Environment | 56 |

### Topic-specific guidance

**MOE 2023 outcomes:**
- P3 Magnets: magnets attract certain materials (iron, steel, nickel, cobalt — but at P3, just "iron and steel"); like poles repel, unlike attract; magnetic vs non-magnetic materials.
- P6 Friction: opposes motion between surfaces in contact; depends on surface texture; useful (walking) and limits (worn brakes).
- P6 Gravity: pulls things towards Earth's centre; weight = effect of gravity on mass.
- P6 Elastic spring: stretched/compressed objects return to original shape; force = F that opposes deformation.
- P6 Effects of forces: change shape, change motion (start, stop, change speed, change direction).
- P6 Interactions within environment: living things depend on living + non-living factors; food, water, shelter, oxygen; human impact (pollution, deforestation, conservation in Singapore — NParks, Sungei Buloh).
- P6 Food chains: producer → primary consumer → secondary consumer → tertiary consumer (decomposers in food webs); energy flow from sun.

**CER applied to Interactions:**
- *Claim* = the force / the relationship / the role in food chain.
- *Evidence* = the observation (block didn't move; ball fell; spring snapped back; bird ate the worm).
- *Reasoning* = the named force/principle (friction, gravity, elastic force, predator-prey, energy flow).

**Common misconceptions:**
- P3 magnets: "all metal is magnetic" (no — only iron, steel, nickel, cobalt).
- P3: "magnets attract aluminum cans" (aluminum is non-magnetic).
- P6 friction: "friction is always bad" (no — we need it to walk, write, drive).
- P6 gravity: "no gravity in space" (there is, just less; satellites are in free-fall).
- P6 elastic: "all materials are elastic" (no — within elastic limit only; beyond it, permanent deformation).
- P6 food chains: "humans are at the top, so we don't matter to the chain" (skips reasoning about ecosystem dependence).
- "Decomposers eat dead things" — accurate, but often skipped in answers about food chains.

**Singapore context:** NTUC FairPrice fridge magnets, HDB lift door (heavy → gravity demonstration), MRT escalator handrail (friction with hand), elastic band/rubber band slingshot at neighbourhood playground, Bishan-Ang Mo Kio Park ecosystem (otters, fish, plants), Sungei Buloh Wetland Reserve, NParks community gardens, kelong/floating fish farm food chain examples, Singapore Zoo predator-prey displays, NEA dengue cycle (mosquito → human is a relationship, though not a clean food chain).

**Tone:** P3 cell narrates CER without naming. P6 cells name the move.

### `cer_structure` adaptation

- Magnets (P3): claim = "this is/isn't magnetic"; evidence = "the magnet stuck/didn't stick"; reasoning = "iron and steel are magnetic, but aluminium is not".
- Friction (P6): claim = "friction is acting / making it harder to move"; evidence = "the box stopped sliding"; reasoning = "friction opposes motion between surfaces in contact".
- Gravity (P6): claim = "gravity pulled it down"; evidence = "the object fell towards Earth"; reasoning = "gravity pulls all objects towards the Earth's centre".
- Elastic spring (P6): claim = "the spring force pushed/pulled X"; evidence = "the spring stretched/compressed and returned"; reasoning = "elastic spring force opposes deformation within the elastic limit".
- Effects of forces (P6): claim = "the force [changed shape / started motion / etc.]"; evidence = the observed change; reasoning = "forces can change shape and change motion".
- Interactions within env (P6): claim = "this organism depends on X"; evidence = "I see/know that X provides Y"; reasoning = "living things need food, water, shelter, oxygen from their environment".
- Food chains (P6): claim = "X is at this trophic level"; evidence = "X eats Y"; reasoning = "in a food chain, energy flows from producer to consumer; X is a [primary/secondary/...] consumer because it eats [producer/herbivore/...]".

### Self-check

- [ ] P3 Magnets cell uses only "iron and steel" as magnetic materials (not nickel/cobalt — those are P3-extension/secondary).
- [ ] P6 Effects of forces cell does NOT introduce Newton's laws explicitly — keep at "forces change shape and motion".
- [ ] Food chains cell uses Singapore ecosystem (Bishan Park, Sungei Buloh, kelong) — not African savanna or North American forest.
- [ ] "Decomposers" introduced briefly in food chains/webs; recognise without deep detail.
- [ ] Singapore context, no foreign settings.
- [ ] Output is one JSON object with `cells: [7 cells]` in the order listed.
