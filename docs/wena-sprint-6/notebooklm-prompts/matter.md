# NotebookLM Prompt — Science / Matter

> Paste `_shared-header.md` first, then this body.

## TASK

Generate **3 cells** for the Superholic Science topic `Matter` (P4 only).

Note: MOE 2023 places this content under "Cycles in Matter and Water (Matter)" within the Cycles theme. Superholic surfaces Matter as its own top-level topic; the underlying Learning Outcomes are unchanged.

### Allocation

| # | level | topic | sub_topic | MOE 2023 parent | PDF page |
|---|---|---|---|---|---|
| 1 | `P4` | `Matter` | `States Of Matter` | Cycles in Matter and Water (Matter) | 45 |
| 2 | `P4` | `Matter` | `Properties Of Solids, Liquids And Gases` | Cycles in Matter and Water (Matter) | 45 |
| 3 | `P4` | `Matter` | `Changes In State Of Matter` | Cycles in Matter and Water (Matter) | 45 |

### Topic-specific guidance

**MOE 2023 outcomes (p.45):**
- Matter exists as solid, liquid, or gas.
- Properties (volume, shape, mass, compressibility) differ between states. Mass is conserved across state changes.
- Changes in state: melting, freezing, boiling, evaporation, condensation. Driven by gain or loss of heat.
- The terms "particle theory" / "molecular structure" are NOT required at P4 — the syllabus deliberately stops at the macroscopic level. Do NOT use these terms in cells.

**CER applied to Matter:**
- *Claim* = the state / the change name (e.g., "this is a gas", "this is melting").
- *Evidence* = observable: shape changes/doesn't, fits container or not, can be compressed or not.
- *Reasoning* = the property rule (e.g., "gases have no fixed shape and fill the container they are in"; "melting is solid → liquid when heat is gained").

**Common P4 misconceptions:**
- "Air is not matter / has no mass" — they don't think gases count.
- "When water boils, it disappears" (skips reasoning that it changed state to gas, mass is conserved).
- "Salt dissolves so the salt is gone" — confuses dissolving (still matter, just spread out) with state change.
- Says "the ice cube became smaller" (evidence) without naming melting (the change rule).

**Singapore context:** ice kacang melting at hawker centre, hot teh-tarik creating steam (gas), helium balloons at Marina Bay countdown, condensation forming on a chilled bottle of bandung at the void deck, evaporation off MRT platform after rain.

**P4 = narrative CER tone.** Don't name "Claim/Evidence/Reasoning" in the teach script. Use "first say what you think, then point to what you see, then name the rule."

### `cer_structure` adaptation

- States: claim = "this is a [solid/liquid/gas]"; evidence = "it [keeps shape / takes the container's shape / fills the room]"; reasoning = the matching state property.
- Properties: claim = the property; evidence = the test you'd do (e.g., "I can press it"); reasoning = the matching state.
- Changes: claim = the named change (melting/freezing/etc.); evidence = "I see X happening"; reasoning = "this happens when [heat gained / heat lost]".

### Self-check

- [ ] No "particle theory" or "molecular" terms.
- [ ] Mass conservation example included in at least one cell (the boiling water question is canonical).
- [ ] Singapore context, no foreign weather.
- [ ] Output is one JSON object with `cells: [3 cells]`.
