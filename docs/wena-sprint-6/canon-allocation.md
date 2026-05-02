# Sprint 6 — Science Canon Allocation Table

Last reviewed: 2026-05-01.
Source of canon strings: [public/js/syllabus.js](../../public/js/syllabus.js) `CANONICAL_SYLLABUS.science` (do NOT modify).
Source of MOE level mapping: `C:/SLabDrive/02 - MOE Syllabuses/Primary/Primary Science Syllabus 2023.pdf` (Section 5 "Syllabus Learning Outcomes", pp. 36–80).

This table is the authoring map for Sprint 6. Every Science cell maps to one
row. Levels are taken from the MOE 2023 PDF's "(P3)/(P4)/(P5)/(P6)" headers,
filtered through `LEVEL_TOPICS` in [public/js/syllabus.js](../../public/js/syllabus.js)
(which gates which TOPICS appear at each level).

## Allocation (~33 cells)

| Level | Topic (Superholic) | Sub-topic (Superholic) | MOE 2023 parent topic | PDF page |
|---|---|---|---|---|
| **P3** | Diversity | General Characteristics Of Living And Non-Living Things | Diversity of Living and Non-Living Things (General characteristics and classification) | 38 |
| P3 | Diversity | Classification Of Living And Non-Living Things | Diversity of Living and Non-Living Things (General characteristics and classification) | 38 |
| P3 | Diversity | Diversity Of Materials And Their Properties | Diversity of Materials | 39 |
| P3 | Cycles | Life Cycles Of Insects | Cycles in Plants and Animals (Life Cycles) | 41 |
| P3 | Cycles | Life Cycles Of Amphibians | Cycles in Plants and Animals (Life Cycles) | 41 |
| P3 | Cycles | Life Cycles Of Flowering Plants | Cycles in Plants and Animals (Life Cycles) | 41 |
| P3 | Interactions | Interaction Of Magnetic Forces | Interaction of Forces (Magnets) | 53 |
| **P4** | Matter | States Of Matter | Cycles in Matter and Water (Matter) | 45 |
| P4 | Matter | Properties Of Solids, Liquids And Gases | Cycles in Matter and Water (Matter) | 45 |
| P4 | Matter | Changes In State Of Matter | Cycles in Matter and Water (Matter) | 45 |
| P4 | Systems | Plant Parts And Functions | Plant System (Plant parts and functions) | 50 |
| P4 | Systems | Human Digestive System | Human System (Digestive System) | 49 |
| P4 | Energy | Sources Of Light | Energy Forms and Uses (Light) | 67 |
| P4 | Energy | Reflection Of Light | Energy Forms and Uses (Light) | 67 |
| P4 | Energy | Formation Of Shadows | Energy Forms and Uses (Light) | 67 |
| P4 | Energy | Transparent, Translucent And Opaque Materials | Energy Forms and Uses (Light) | 67 |
| P4 | Energy | Sources Of Heat | Energy Forms and Uses (Heat) | 69 |
| P4 | Energy | Effects Of Heat Gain And Heat Loss | Energy Forms and Uses (Heat) | 69 |
| P4 | Energy | Temperature And Use Of Thermometers | Energy Forms and Uses (Heat) | 69 |
| P4 | Energy | Good And Poor Conductors Of Heat | Energy Forms and Uses (Heat) | 69 |
| **P5** | Cycles | Reproduction In Plants And Animals | Cycles in Plants and Animals (Reproduction) | 43 |
| P5 | Cycles | Stages Of The Water Cycle | Cycles in Matter and Water (Water) | 47 |
| P5 | Systems | Plant Respiratory And Circulatory Systems | Plant System (Respiratory and circulatory systems) | 51 |
| P5 | Systems | Human Respiratory And Circulatory Systems | Human System (Respiratory and circulatory systems) | 50 |
| P5 | Systems | Electrical Systems And Circuits | Electrical System | 52 |
| **P6** | Energy | Photosynthesis And Energy Pathways | Energy Forms and Uses (Photosynthesis) | 71 |
| P6 | Energy | Energy Conversion In Everyday Objects | Energy Conversion | 73 |
| P6 | Interactions | Frictional Force | Interaction of Forces (Frictional force, gravitational force, elastic spring force) | 54 |
| P6 | Interactions | Gravitational Force | Interaction of Forces (Frictional force, gravitational force, elastic spring force) | 54 |
| P6 | Interactions | Elastic Spring Force | Interaction of Forces (Frictional force, gravitational force, elastic spring force) | 54 |
| P6 | Interactions | Effects Of Forces On Objects | Interaction of Forces (Frictional force, gravitational force, elastic spring force) | 54 |
| P6 | Interactions | Interactions Within The Environment | Interactions within the Environment | 56 |
| P6 | Interactions | Food Chains And Food Webs | Interactions within the Environment | 56 |

**Total: 33 Science cells** (P3=7, P4=13, P5=5, P6=8).

## Drift notes vs MOE 2023 (Option C-style audit, deferred reconciliation)

Superholic canon is **finer-grained** than MOE 2023:

- **MOE 2023 has 5 themes; Superholic has 6.** Superholic surfaces *Matter* as a top-level topic (P4). MOE folds Matter under *Cycles* ("Cycles in Matter and Water (Matter)"). Per [CLAUDE.md](../../CLAUDE.md), this is a deliberate Superholic divergence; not changed in Sprint 6.
- **Superholic decomposes Light/Heat/Forces into sub-skills.** MOE 2023 teaches *Energy Forms and Uses (Light)* as one macro topic; Superholic splits it into 4 sub-topics (Sources/Reflection/Shadows/Transparent). Same for Heat (4 sub-topics) and Forces (3 sub-topics + 1 effects sub-topic).
- **Superholic adds `Effects Of Forces On Objects` and `Food Chains And Food Webs`** as standalone P6 sub-topics. MOE folds these into "Interaction of Forces" and "Interactions within the Environment" respectively.

These are not contradictions — Superholic operates at sub-skill granularity while MOE specifies macro-topic learning outcomes. Sprint 6 cells use Superholic sub_topic strings in canon fields and document the MOE parent in `notes` for traceability.

## What this maps to in Wena RAP retrieval

`getCell(level, topic, sub_topic)` returns the exact-match cell for a coordinate.
With 33 cells, every (level, topic, sub_topic) tuple in `LEVEL_TOPICS.science` × `CANONICAL_SYLLABUS.science` that's actually in the MOE syllabus is covered.

For `(P4, 'Cycles', *)` — Superholic LEVEL_TOPICS includes Cycles at P4 but no sub_topic in canon is primarily-P4 Cycles content (Life Cycles=P3, Reproduction=P5, Water=P5). At runtime, P4 Cycles questions will hit `getCell` → null → `getFallbackCell(P4, 'Cycles')` → null (no P4 Cycles cell exists) → handler falls back to legacy prompt. **This is acceptable** — Sprint 7 will decide whether to author cross-level fallback cells or extend the loader to climb to a sibling level.
