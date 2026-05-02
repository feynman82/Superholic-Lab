# Visual Payload API + Diagram Routing Map

> Loaded when the question requires a `visual_payload`. Combines what was
> §6 (the function catalogue) and §7 (the per-(level, topic) routing map) of
> the v5.0 monolith into a single reference. Mathematics + Science only.
> Cloze / Editing / Comprehension / Visual Text questions do not use this file.

═══════════════════════════════════════════════════════════════
SECTION 6: VISUAL PAYLOAD API (Math/Science Only)
═══════════════════════════════════════════════════════════════

**VISUAL PAYLOAD ENGINES (Math/Science Only):**
To generate a diagram, you MUST populate the `visual_payload` column with a stringified JSON object. 
The object MUST strictly follow this structure: 
`{"engine": "diagram-library", "function_name": "EXACT_NAME", "params": { ... }}`

You may ONLY use the following `function_name` values and their exact parameters. Do NOT hallucinate functions.

**--- 1. MATH: GEOMETRY & MEASUREMENT ---**
* `cuboid`: Draws a 3D tank. `{"length_label": "10cm", "breadth_label": "5cm", "height_label": "8cm", "water_level": 0.5}` (water_level is 0.0 to 1.0).
* `drawRectangleOnGrid`: `{"width_cm": 10, "length_cm": 5, "unit_grid_cm": 1, "labels": "PQRS"}`
* `polygon`: Draws an n-sided shape. `{"vertices": ["A","B","C","D"], "angle_to_measure": "ABC"}`
* `parallelogram`: `{"vertices": ["W","X","Y","Z"], "show_diagonals": true, "angle_arcs": [{"vertex": "W", "label": "60°"}]}`
* `rightAngleDivided` / `straightLineDividedAngles`: Draws intersecting angles. `{"lines": [{"start": "O", "end": "A"}, {"start": "O", "end": "B"}], "angles": ["45°", "y"], "vertices": ["X", "O", "Y"]}`
* `equilateralTriangle`: `{"side_length": 10, "unit": "cm", "count": 2}`
* `rulerMeasurement`: Extremely useful for PSLE length reading. `{"item": "Pencil", "unit": "cm", "min_value": 0, "max_value": 15, "start_reading": 2.5, "end_reading": 10.5, "major_interval": 1, "minor_interval": 0.1}`

**--- 2. MATH: DATA ANALYSIS & FRACTIONS ---**
* `pieChart`: `{"title": "Favourite Fruits", "data": [{"label": "Apples", "value": 40}, {"label": "Pears", "value": 60}]}`
* `lineGraph`: `{"title": "Temperature", "xLabel": "Time", "yLabel": "°C", "yMax": 40, "points": [{"xText": "8am", "yVal": 28}, {"xText": "9am", "yVal": 32}]}`
* `verticalBarChart`: `{"title": "Books Read", "xAxisLabel": "Month", "yAxisLabel": "Count", "data": [{"label": "Jan", "value": 15}, {"label": "Feb", "value": "covered"}]}` 
    *(PRO TIP: Use `"value": "covered"` to trigger the MOE "Ink Spill" question type where the student must calculate the hidden bar).*
* `pictogram`: `{"title": "Stickers", "items": [{"label": "Ali", "count": 12}], "keyValue": 4, "keySymbol": "★"}`
* `fractionBars`: `{"fractions": [{"numerator": 1, "denominator": 4}, {"numerator": 1, "denominator": 3}]}`
* `unitModel`: Renders proportional "Before and After" or "Internal Transfer" models. `{"unitModel": {"models": [{"label": "Before", "parts": [{"width": 40, "shaded": false, "label": "1u"}, {"width": 40, "shaded": true, "label": "Transfer"}]}]}}`

**--- 3. SCIENCE / GENERAL ---**
* `thermometer`: `{"minTemp": 0, "maxTemp": 100, "currentTemp": 37, "unit": "°C", "label": "Beaker A"}`
* `arrowDiagram`: Flow diagram for food chains, life cycles, classification trees, and food webs.
  Always use `"layout": "auto"` — the engine detects the correct layout from arrow structure.
  Food chain (auto → horizontal): `{"nodes": [{"id":"g","label":"Grass"},{"id":"r","label":"Rabbit"},{"id":"e","label":"Eagle"}], "arrows": [{"from":"g","to":"r"},{"from":"r","to":"e"}], "layout": "auto"}`
  Life cycle (auto → circular): `{"nodes": [{"id":"1","label":"Egg"},{"id":"2","label":"Larva"},{"id":"3","label":"Pupa"},{"id":"4","label":"Adult"}], "arrows": [{"from":"1","to":"2"},{"from":"2","to":"3"},{"from":"3","to":"4"},{"from":"4","to":"1"}], "layout": "auto"}`
  Food web / classification tree (auto → layered): `{"nodes": [{"id":"a","label":"Animals"},{"id":"v","label":"Vertebrates"},{"id":"i","label":"Invertebrates"}], "arrows": [{"from":"a","to":"v"},{"from":"a","to":"i"}], "layout": "auto"}`
  *(Do NOT set x/y coordinates on nodes. Do NOT specify layout unless overriding — auto is always correct.)*
* `table`: Renders a clean HTML table. `{"headers": ["Material", "Magnetic?"], "rows": [["Iron", "Yes"], ["Wood", "No"]]}`
* `genericExperiment`: ⚠️ LAST RESORT ONLY — use this ONLY when no specific function covers the setup (see --- 11. SCIENCE: EXPERIMENTS --- below). Renders a plain key-value info card; no actual visual diagram. `{"apparatus": "Syringe with plunger", "observation": "Air is compressible", "conclusion": "Gases can be compressed"}`
* `circuitDiagram`: Renders electrical circuits with MOE standardized symbols. `{"circuitDiagram": {"title": "Setup A", "components": [{"type": "battery"}, {"type": "switch", "isOpen": true}, {"type": "bulb", "position": "right", "fused": false}]}}`

**--- 4. MATH: GEOMETRY (Basic Shapes) ---**
* `rectangle`: Labelled rectangle with dimension arrows. Use for Area & Perimeter, Algebra (variable sides).
  `{"widthLabel": "12 cm", "heightLabel": "7 cm", "showNotToScale": true}`
* `square`: Calls rectangle with equal sides.
  `{"sideLabel": "9 cm"}`
* `circle`: Circle with optional radius or diameter line.
  `{"radiusLabel": "7 cm"}` OR `{"diameterLabel": "14 cm"}`
* `runningTrack`: Stadium-shape (two horizontal straights joined by two semicircular ends). Use for PSLE-style "perimeter / area of running track" questions in the Circles topic.
  `{"straight_length_label": "80 m", "diameter_label": "70 m"}`
  *(Optional `straight_label_position`: `"top"` (default) or `"inside"`.)*
* `rectangleWithLine`: Rectangle ABCD (or any 4-letter labelling) with one extra line drawn from a corner to a labelled point on a non-adjacent side. Use for PSLE-style geometry questions like "ABCD is a rectangle. E is on BC. AE is drawn. Find ∠AEC."
  `{"vertices": ["A","B","C","D"], "from_vertex": "A", "end_label": "E", "end_side": "BC", "end_position": 0.6, "angles": [{"at": "A", "value": "25°"}, {"at": "E", "value": "?"}]}`
  *(`vertices` must list the 4 corners clockwise from top-left. `end_side` is two of those corners in cw order. `end_position` is the fractional distance along the side, 0 = first letter, 1 = second. `angles[].at` is either a corner name or `end_label` — the renderer auto-places the label at the angle's bisector.)*

* `parallelLinesTransversal`: Two parallel horizontal lines cut by a slanted transversal, with intersection points labelled and angles marked at each intersection. Use for PSLE alternate / co-interior / corresponding angle questions.
  `{"line1_label": "PQ", "line2_label": "RS", "point1_label": "A", "point2_label": "B", "angles": [{"at": "A", "position": "top-right", "label": "p"}, {"at": "B", "position": "top-right", "label": "q"}]}`
  *(`position` ∈ {"top-left","top-right","bottom-left","bottom-right"} indicates which of the four sectors at each intersection the label belongs to.)*

* `quarterCirclesInSquare`: Square containing 1, 2, or 4 quarter circles inscribed at corner(s), or one full circle inscribed centrally. Use for "shaded area = square − inscribed circle" PSLE composite-figure problems.
  `{"side_label": "14 cm", "configuration": "1corner" | "2opposite" | "4corners" | "circle", "shaded": "outside" | "inside", "radius_label": "7 cm"}`
  *(`shaded` controls which region is rose-tinted. `radius_label` only applies to `configuration: "circle"`.)*

* `overlappingCircles`: Two equal-radius circles overlapping with adjustable separation (vesica-piscis when separation = radius). Use for the lens-shaped HOTS questions.
  `{"radius_label": "7 cm", "separation": 1.0}`
  *(`separation` is a multiple of the radius — `1.0` puts each centre on the other's circumference; `0.5` produces heavy overlap.)*

* `rectangleWithPath`: Rectangle with a uniform-width path either INSIDE or OUTSIDE the perimeter, with the path region rose-tinted. Use for "field with path" / "pool with tile path" composite-area PSLE problems.
  `{"length_label": "60 m", "breadth_label": "45 m", "path_width_label": "3 m", "path_position": "inside" | "outside"}`

* `dotTriangle`: First N figures of a triangular-number dot pattern (Figure n has n × (n+1) / 2 dots). Use for triangular-number PSLE pattern questions.
  `{"show_figures": 4}`

* `gridGrowth`: First N figures of an n × n square-grid growth pattern. Use for "Figure n is an n × n grid of unit squares" PSLE pattern questions.
  `{"show_figures": 4, "diagonal_black": false}`
  *(`diagonal_black: true` shades the diagonal cells black — used for the black/white square pattern variant.)*

* `magicSquare`: 3 × 3 magic-square grid with optional pre-filled values and corner / centre highlighting.
  `{"values": [[null,null,null],[null,5,null],[null,null,null]], "highlight": "corners" | "centre" | null}`
* `rightTriangle`: Right-angled triangle with labelled base, height, and optional hypotenuse.
  `{"base": "8 cm", "height": "6 cm", "hypotenuse": "10 cm", "showRightAngle": true}`
* `compositeShape`: L-shape or T-shape built from rectangles. Use for composite area/perimeter problems.
  `{"parts": [{"x": 40, "y": 40, "w": 200, "h": 80, "shaded": true, "label": "A"}, {"x": 40, "y": 120, "w": 80, "h": 100, "shaded": true, "label": "B"}], "unit": "cm", "showNotToScale": true}`
  *(All coordinates are SVG pixel positions within a 400×260 viewBox. Scale your shapes accordingly.)*

* `netDiagram`: ⭐ NEW — 2D unfolded net of a 3D solid. Use for P4 Geometry "Identifying Nets Of Three-Dimensional Solids".
  `{"solid": "cube" | "cuboid" | "triangular_prism" | "square_pyramid" | "cylinder", "labels": ["A","B","C","D","E","F"], "highlight_face": "C", "show_dimensions": false, "length_label": "5 cm", "breadth_label": "3 cm", "height_label": "4 cm"}`
  *(`labels` is an array of face names drawn at face centres. `highlight_face` rose-tints the matching face. `show_dimensions` and the three `*_label` fields apply only to `solid: "cuboid"`. For "cube" labels follow order: top, left, front, right, back, bottom. For others see code comments.)*

* `symmetryFigure`: ⭐ NEW — Shape with optional dashed line of symmetry, OR a partial figure to be completed across an axis. Use for ALL P4 Symmetry sub_topics.
  Show-axis variant: `{"mode": "show_axis", "shape": "L" | "T" | "cross" | "arrow" | "letter_E" | "letter_H" | "diamond" | "trapezium" | "irregular", "axis": "vertical" | "horizontal" | "diagonal_tlbr" | "diagonal_trbl" | "none", "grid": true}`
  Complete variant: `{"mode": "complete", "shape": "L", "axis": "vertical", "show_correct": false, "grid": true}`
  *(In `complete` mode, only the half on the source side of the axis (left of vertical / top of horizontal) is filled. Set `show_correct: true` to dash the correct mirrored half (use for worked-solution rendering only).)*

* `circleSegment`: ⭐ NEW — Standalone semicircle or quarter circle. Use for P6 Circles "Area And Perimeter Of Semicircle And Quarter Circle".
  Semicircle: `{"shape": "semicircle", "orientation": "up" | "down" | "left" | "right", "radius_label": "7 cm", "diameter_label": "14 cm", "show_arc_label": false, "show_perimeter_dots": false}`
  Quarter circle: `{"shape": "quarter_circle", "corner": "tl" | "tr" | "bl" | "br", "radius_label": "10 cm", "show_arc_label": false}`
  *(NOT to be confused with `quarterCirclesInSquare`, which is inscribed in a square for composite-shading questions. Use `circleSegment` for the standalone-shape area/perimeter formulas.)*

* `compositeCircleFigure`: ⭐ NEW (v5.2) — Composite figure built from a base rectangle/square plus arc/disc operations (full circles, semicircles, quarter circles) added/subtracted/shaded. Generalised renderer for the four classic P6 PSLE composite-circle figures.
  Base + ops + optional shaded indices:
  `{"base": {"shape": "rectangle"|"square", "width": 28, "height": 14, "vertices": ["A","B","C","D"], "show_outline": true}, "operations": [...], "shaded": [0,1]}`
  - Vertices clockwise from top-left: A=TL, B=TR, C=BR, D=BL. For square, `height` defaults to `width`.
  - `show_outline` (optional, default `true`): set to `false` when the figure is a stand-alone arc figure with no enclosing rectangle (e.g. a quarter circle on its own with a cut-out). Suppresses the base rectangle outline entirely; vertex labels still render.
  - Auto-suppression: even with `show_outline: true`, base edges that coincide with an `add`-mode arc's chord (semicircle diameter on an adjacent-vertex side, or full-side quarter-circle radii at a corner) are suppressed automatically to avoid double-stroking.
  - Each operation has a `mode` of `"add"` (extend the figure outward), `"subtract"` (cut a hole, paints white), or `"shade"` (fill rose-tint without altering the boundary). Listing an op's index in `shaded` forces a rose tint regardless of mode.
  - **Operation types:**
    - Full circle: `{"type": "fullCircle", "corner": "A", "radius": 7, "mode": "subtract", "label": "r = 7 cm"}` (or `"center": {"x":14,"y":7}` or `"midSide": "AB"`)
    - Semicircle: `{"type": "semicircle", "diameter_endpoints": ["A","B"], "direction": "into"|"away", "mode": "add", "label": "d = 14 cm"}`
    - Quarter circle: `{"type": "quarterCircle", "center_corner": "A", "radii_along": ["AB","AD"], "radius": 14, "mode": "subtract"}`
  Worked example — 28×14 rect with two quarter-circles (r=14) cut from BL and BR corners; remaining strip is the asked region:
  ```json
  {
    "base": {"shape": "rectangle", "width": 28, "height": 14, "vertices": ["A","B","C","D"]},
    "operations": [
      {"type": "quarterCircle", "center_corner": "D", "radii_along": ["DA","DC"], "radius": 14, "mode": "subtract", "label": "r = 14 cm"},
      {"type": "quarterCircle", "center_corner": "C", "radii_along": ["CB","CD"], "radius": 14, "mode": "subtract"}
    ],
    "shaded": []
  }
  ```
  *(Use for P6 Circles "Area And Perimeter Of Composite Figures With Circles". Robust enough for stadium-shapes (rect + semicircle "away"), corner cut-outs, lens-shaped subtractions, and quarter-circle-with-bite figures.)*

**--- 4b. MATH: TIME ---**
* `clockFace`: ⭐ NEW (v5.2) — Analog clock face with positioned hour and minute hands. Use for P1/P2 "Telling Time" questions.
  `{"hour": 7, "minute": 20, "size": 240, "showSecondHand": false, "second": 0, "label": ""}`
  - Hour-hand position is computed from `hour + minute/60` so it sits between numerals when minute > 0 (e.g. hour=7, minute=20 → hand pointing one-third of the way from 7 toward 8).
  - Minute-hand from `minute × 6°`. 12 o'clock = straight up.
  - hour=12 renders at the top, hour=3 on the right, etc.
  *(Suits "What time does this clock show?" MCQ at P1/P2. Set `showSecondHand: true` and `second` for question variants involving the second hand.)*

**--- 5. MATH: ANGLES (Advanced Geometry) ---**
* `protractorMeasurement`: Semicircular protractor with inner/outer scale and pointer arm.
  Standard (baseline at 0°): `{"angle_to_measure": 65, "pointer_label": "?", "show_inner_scale": true}`
  Non-zero baseline exam variant: `{"angle_to_measure": 50, "baseline_offset": 30, "pointer_label": "?"}`
  *(Use `baseline_offset` > 0 for questions where the object/angle does not start at the 0° mark.)*
* `rectangleDividedRightAngle`: Rectangle PQRS with two or more rays drawn from corner Q dividing the 90° corner angle into smaller named sub-angles. v3 renderer (2026-04-30) supports geometrically faithful ray placement.
  **Preferred (use this for new content):** specify each ray's exact angle so the diagram matches the question text.
  ```
  {
    "vertices": ["P","Q","R","S"],
    "rays": [
      { "name": "T", "at_deg": 68 },                       // T at 68° from +x axis (= 22° from QP, since QP is 90°)
      { "name": "U", "from_side": "QR", "rotate_deg": 35 } // OR rotate from a side toward interior
    ],
    "arcs": [
      { "between": ["P","T"], "label": "22°" },           // angle ∠PQT, label drawn at bisector
      { "between": ["T","U"], "label": "?" },             // unknown angle marker
      { "between": ["U","R"], "label": "35°" }            // angle ∠UQR
    ]
  }
  ```
  **Geometry rule:** in `at_deg`, 0° = direction of QR (right), 90° = direction of QP (up). For an angle ∠PQX of value θ, set `at_deg = 90 − θ`. For ∠XQR of value θ, set `at_deg = θ`.
  **Legacy (still supported, but rays land at hard-coded fallback positions — use only for old rows):** `{"vertices": ["P","Q","R","S"], "angles": [{"name": "PQT", "value": "22°"}, {"name": "TQU", "value": "?"}]}`
* `dividedStraightLineAngle`: A straight line divided by one intersecting ray showing two named angles.
  `{"vertices": ["A","O","B","C"], "angles": [{"label": "40°"}, {"label": "?"}]}`

* `crossingLines`: ⭐ NEW (v5.2) — Two straight lines crossing at a single point, with up to 4 angle labels in the four sectors formed. Use for P5/P6 "Vertically Opposite Angles" / "Angles At A Point" problems.
  ```json
  {
    "line1": {"label": "AB", "endpoints": ["A","B"]},
    "line2": {"label": "CD", "endpoints": ["C","D"]},
    "crossing": "O",
    "line2_angle": 36,
    "angles": [
      {"at": "AOC", "label": "144°"},
      {"at": "BOC", "label": "36°"},
      {"at": "BOD", "label": "144°"},
      {"at": "AOD", "label": "?"}
    ]
  }
  ```
  - `line1` is rendered horizontal; `line2_angle` (degrees, default 60) is the angle between them.
  - Each `angles[].at` is a 3-letter sector identifier; the middle letter is the crossing-point letter (default `"O"`). The two outer letters are matched by SET, so `"AOC"` === `"COA"`.
  - Missing entries leave their sector unlabelled. Use `"?"` to mark the unknown angle without giving the answer away.
  *(Suits Vertically Opposite Angles, Angles At A Point, and any "two lines intersect; find x" pattern.)*

**--- 6. MATH: NUMBER & FRACTIONS ---**
* `numberLine`: Horizontal number line with optional marked dots and highlight arcs.
  Basic: `{"start": 0, "end": 10, "marked": [3, 7]}`
  With highlight arc: `{"start": 0, "end": 12, "marked": [4], "highlight": [{"from": 0, "to": 4}]}`
  With custom tick labels (fractions/decimals): `{"start": 0, "end": 1, "labels": [{"value": 0, "text": "0"}, {"value": 0.5, "text": "½"}, {"value": 1, "text": "1"}]}`
* `fractionBar`: A single fraction bar (simpler than `fractionBars`). Use for one-fraction MCQ questions.
  `{"numerator": 3, "denominator": 4, "showLabel": true}`

**--- 7. MATH: DATA ANALYSIS (Alternatives) ---**
* `barChart`: Pure SVG bar chart. Simpler API than `verticalBarChart`; preferred for MCQ diagrams.
  `{"title": "Books Read", "xLabel": "Month", "yLabel": "Number", "bars": [{"label": "Jan", "value": 8}, {"label": "Feb", "value": 12}]}`
  *(Use `verticalBarChart` when you need the "ink spill" covered-bar question type.)*
* `horizontalBarChart`: Horizontal bar variant. Use for P3/P4 data questions with long category names.
  `{"title": "Favourite Sports", "bars": [{"label": "Swimming", "value": 15}, {"label": "Football", "value": 22}]}`
* `dataTable`: HTML table using CSS variables (preferred over `table` for CSS-var support).
  `{"headers": ["Material", "Magnetic?", "Conductor?"], "rows": [["Iron", "Yes", "Yes"], ["Wood", "No", "No"]]}`
  *(Use `highlightCol` (0-indexed integer) to highlight a specific column in rose colour.)*

**--- 8. MATH: GEOMETRY (Solid Figures) ---**
* `isometricGrid`: Dual-mode — 3D isometric view OR orthographic 3-panel projection.
  `cubes_arrangement` is a 2D array where each cell = number of cubes stacked at [row][col]. Row 0 = front.

  Isometric (3D view): `{"mode": "isometric", "cubes_arrangement": [[2,1,0],[1,3,1],[0,1,2]]}`
  Orthographic (Top/Front/Side panels): `{"mode": "orthographic", "cubes_arrangement": [[2,1,0],[1,3,1],[0,1,2]]}`
  Highlight specific cubes: `{"mode": "isometric", "cubes_arrangement": [[2,1],[1,2]], "highlight_cubes": [{"row": 0, "col": 0, "layer": 1}]}`

  *(Hidden-blocks questions: use `mode: "orthographic"` — students must deduce maximum cubes from the 2D views.)*

**--- 9. SCIENCE: CONCEPTUAL ---**
* `conceptMap`: Concept web with labelled nodes and directional edges. Use for Science classification/relationship questions.
  `{"nodes": [{"id": "a", "label": "Living Things", "x": 50, "y": 20}, {"id": "b", "label": "Plants", "x": 25, "y": 70}, {"id": "c", "label": "Animals", "x": 75, "y": 70}], "edges": [{"from": "a", "to": "b"}, {"from": "a", "to": "c"}]}`
  *(Note: `conceptMap` uses `edges` not `arrows`. `x` and `y` are percentages (0–100) of the viewBox.)*

**--- 10. UTILITY ---**
* `placeholder`: Grey dashed box with centred description. Use when no specific diagram function applies (e.g., complex anatomy, apparatus cross-sections).
  `{"description": "Diagram of the human heart showing four chambers and major blood vessels."}`

---

**--- 11. SCIENCE: EXPERIMENTS ---**
* `comparativeSetup`: ⭐ Side-by-side A/B experiment panels with SVG container silhouette.
  Use for: Heat (cloth colour), Light (shadow), Matter (states comparison), P5 Cycles (condensation), P6 Forces (surface friction comparison).
  `containerType`: `"beaker"` | `"test_tube"` | `"flask"` | `"box"`
  ```json
  {"title": "Heat Absorption", "variable": "Colour of cloth", "containerType": "beaker",
   "setups": [
     {"label": "Setup A", "conditions": ["Black cloth", "30 ml water", "Sunny spot"], "result_label": "Temperature after 1 hour:"},
     {"label": "Setup B", "conditions": ["White cloth", "30 ml water", "Sunny spot"], "result_label": "Temperature after 1 hour:"}
   ],
   "commonConditions": ["Same beaker size", "Same starting temperature"]}
  ```
  *(Up to 3 setups. `result_label` adds an answer underline at the bottom of each panel.)*

* `magnetDiagram`: ⭐ MOE-schematic magnet drawing.
  `magnetType`: `"bar"` | `"horseshoe"` | `"electromagnet"`
  Single bar magnet: `{"magnetType": "bar", "magnets": [{"poles": ["N", "S"]}]}`
  Two-magnet repulsion (N facing N): `{"magnetType": "bar", "magnets": [{"poles": ["S","N"]}, {"poles": ["N","S"]}], "interaction": "repulsion"}`
  Two-magnet attraction (N facing S): `{"magnetType": "bar", "magnets": [{"poles": ["S","N"]}, {"poles": ["S","N"]}], "interaction": "attraction"}`
  Horseshoe: `{"magnetType": "horseshoe", "magnets": [{"poles": ["N", "S"]}]}`
  Electromagnet: `{"magnetType": "electromagnet", "coreMaterial": "iron", "coilsCount": 5, "batteryCount": 1}`
  *(N pole = red, S pole = blue per MOE convention. Requires `--color-magnet-N` and `--color-magnet-S` CSS vars.)*

* `rampExperiment`: ⭐ Inclined plane with block, surface texture, and force arrows.
  `surfaceTexture`: `"smooth"` | `"rough"` | `"sandpaper"` | `"glass"`
  `forceArrows[].direction`: `"down"` (weight) | `"up_slope"` (friction) | `"down_slope"` | `"normal"` | `"left"` | `"right"`
  `springState`: `"none"` | `"compressed"` | `"extended"`
  ```json
  {"rampAngle": 30, "surfaceTexture": "rough", "blockLabel": "Block",
   "showAngleLabel": true,
   "forceArrows": [
     {"direction": "down",     "label": "Weight"},
     {"direction": "up_slope", "label": "Friction"},
     {"direction": "normal",   "label": "Normal force"}
   ]}
  ```

---

**⚠️ CORRECTION — `lineGraph` params:**
The `points` array uses `{x, y}` format (NOT the old `{xText, yVal}` format).
Both formats are accepted for backward compatibility, but the correct format is:

Numeric x-axis: `{"points": [{"x": 0, "y": 28}, {"x": 1, "y": 32}, {"x": 2, "y": 30}]}`
Categorical x-axis (string labels): `{"points": [{"x": "8 am", "y": 28}, {"x": "9 am", "y": 32}]}`
Legacy format (still works): `{"points": [{"xText": "8 am", "yVal": 28}]}`

**⚠️ NOTE — `table` vs `dataTable`:**
Both render HTML tables. `dataTable` uses CSS variables and is preferred. `table` uses Tailwind classes and is the legacy name. Both are valid in `visual_payload`.

**⚠️ NEW (v5.1, 2026-05-01) — Three new functions for taxonomy v5 alignment:**
- `netDiagram` — P4 Geometry "Identifying Nets" sub_topic
- `symmetryFigure` — ALL P4 Symmetry sub_topics
- `circleSegment` — P6 Circles "Area And Perimeter Of Semicircle And Quarter Circle"
See the catalog entries above for parameter formats.

**⚠️ NEW (v5.2, 2026-05-02) — Three new primitives to retire placeholder fallbacks:**
- `clockFace` — P1/P2 Time "Telling Time" sub_topics (analog clock with positioned hands)
- `crossingLines` — P5/P6 Angles "Vertically Opposite Angles" / "Angles At A Point" (two lines crossing, four sector labels)
- `compositeCircleFigure` — P6 Circles "Area And Perimeter Of Composite Figures With Circles" (rect/square base + add/subtract/shade arc operations)
See the catalog entries above for parameter formats.

**⚠️ Functions previously implemented but newly routed in v5.1:**
- `parallelLinesTransversal` — now routed for P3/P4/P5 Geometry & Angles
- `dotTriangle` / `gridGrowth` — now routed for "Patterns In Number Sequences" sub_topic at P1-P3
- `magicSquare` — HOTS / cross-cutting routing
- `overlappingCircles` / `quarterCirclesInSquare` / `rectangleWithPath` — now routed for P6 Circles composite figures

═══════════════════════════════════════════════════════════════
SECTION 7: DIAGRAM ROUTING MAP — TOPIC → FUNCTION LOOKUP
═══════════════════════════════════════════════════════════════

MANDATORY RULE: Before choosing a `function_name` for any Maths or
Science question, look up the (level, topic) in this map FIRST.
ONLY use functions listed for that (level, topic).
If the topic row says NULL, set `visual_payload` to NULL — do NOT
force a diagram on a text-only question.
NEVER invent a function name not present in Section 6.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MATHEMATICS ROUTING MAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

── P1 ──────────────────────────────────────────────────────────

| Topic                       | Use Function                | Condition / Notes                                              |
|-----------------------------|-----------------------------|----------------------------------------------------------------|
| Whole Numbers               | `numberLine`                | Ordering, comparing, sequences on a number line                |
|                             | `dotTriangle` / `gridGrowth`| "Patterns In Number Sequences" sub_topic only                  |
| Addition and Subtraction    | `numberLine`                | "Jump" strategy visualisation only; omit for text-only         |
| Multiplication and Division | NULL                        | No diagram for basic concepts                                  |
| Multiplication Tables       | NULL                        | No diagram for table recall                                    |
| Money                       | NULL                        | Text-based; no coin-image primitive in v5                      |
| Length and Mass             | `rulerMeasurement`          | Any question requiring a measurement reading                   |
| Time                        | `clockFace`                 | ⭐ "Telling Time" sub_topics — set `hour` (1–12) and `minute` (0–59) |
| Shapes and Patterns         | `rectangle`/`square`/`circle`| Identifying or describing 2D shapes                           |
| Data Analysis               | `pictogram`                 | "Reading Picture Graphs" — set `keyValue` to the scale shown   |

── P2 ──────────────────────────────────────────────────────────

| Topic                       | Use Function                | Condition / Notes                                              |
|-----------------------------|-----------------------------|----------------------------------------------------------------|
| Whole Numbers               | `numberLine`                | Number patterns, placing values on a line                      |
|                             | `dotTriangle` / `gridGrowth`| "Patterns In Number Sequences" sub_topic only                  |
| Addition and Subtraction    | NULL                        | Text-only at P2 (algorithms, mental calc)                      |
| Multiplication Tables       | NULL                        | Table recall — no diagram                                       |
| Multiplication and Division | NULL                        | Concepts only — no diagram                                      |
| Fractions                   | `fractionBar`               | Visualise ½, ¼, ¾ as a single shaded bar (introduced at P2)    |
| Length and Mass             | `rulerMeasurement`          | All scale-reading questions (cm, m, g, kg)                     |
| Volume of Liquid            | `rulerMeasurement`          | Measuring-cylinder scale reading (litres / millilitres)        |
| Money                       | NULL                        | Text-based; sums and change in decimal notation                |
| Time                        | `clockFace`                 | ⭐ "Telling Time" / clock-reading sub_topics — analog face with hour & minute hands |
| Shapes and Patterns         | `rectangle`/`square`/`circle`| 2D shape naming; `isometricGrid` (orthographic) for 3D solids |
| Data Analysis               | `pictogram`                 | Always; include `keySymbol` and `keyValue`                     |

── P3 ──────────────────────────────────────────────────────────

| Topic                       | Use Function                | Condition / Notes                                              |
|-----------------------------|-----------------------------|----------------------------------------------------------------|
| Whole Numbers               | `numberLine`                | Number sequences or ordering only                              |
|                             | `dotTriangle` / `gridGrowth`| "Patterns In Number Sequences" sub_topic only                  |
| Addition and Subtraction    | NULL                        | Text-only (mental calc, algorithms)                            |
| Multiplication Tables       | NULL                        | Table recall                                                   |
| Multiplication and Division | NULL                        | Concepts and algorithms — text only                            |
| Fractions                   | `fractionBars`              | Equivalent fractions, comparison, addition                     |
| Length and Mass             | `rulerMeasurement`          | All length / mass measurement reading questions                |
| Volume of Liquid            | `rulerMeasurement`          | Measuring-cylinder scale reading; L↔mL conversion              |
| Money                       | NULL                        | Text-based word problems (decimal addition / change)           |
| Time                        | NULL                        | Clock-face diagrams not in library; 24-hour and duration text-only |
| **Angles**                  | `protractorMeasurement`     | ⭐ Use for ALL angle measuring questions                       |
|                             |                             | `baseline_offset: 0` → standard; `> 0` → non-zero baseline     |
| **Geometry**                | `rectangle` / `square`      | "Properties Of Rectangle And Square" sub_topic                 |
|                             | `polygon`                   | "Properties Of Triangles" — use 3-vertex polygon               |
|                             | `parallelLinesTransversal`  | "Perpendicular And Parallel Lines" — use `axis: "none"` or omit angle marks for parallel-only diagrams |
| Area and Perimeter          | `rectangle`                 | Rectangle shapes                                               |
|                             | `square`                    | Square shapes                                                  |
|                             | `compositeShape`            | L-shapes, T-shapes, rectilinear figures                        |
| Data Analysis               | `barChart`                  | DEFAULT for "Reading Bar Graphs" MCQ data questions            |
|                             | `horizontalBarChart`        | When category labels are long (e.g., country / sport names)    |
|                             | `verticalBarChart`          | ONLY for "ink-spill" questions: set `"value": "covered"`       |
|                             | `dataTable`                 | "Reading Tables" sub_topic                                     |

── P4 ──────────────────────────────────────────────────────────

| Topic                       | Use Function                | Condition / Notes                                              |
|-----------------------------|-----------------------------|----------------------------------------------------------------|
| Whole Numbers               | NULL                        | Large-number operations, text-only                             |
| Factors and Multiples       | NULL                        | Factor trees not in library; text only                         |
| Fractions                   | `fractionBars`              | Comparison, equivalent fractions, addition; mixed numbers      |
| Decimals                    | `numberLine`                | Placing decimals, ordering on a line                           |
| Money                       | NULL                        | Word problems involving money (decimal arithmetic)             |
| Time                        | NULL                        | Word problems involving time (clock visuals NOT in library)    |
| Pie Charts                  | `pieChart`                  | "Reading And Interpreting Pie Charts" (introduced at P4)       |
| **Angles (basic)**          | `protractorMeasurement`     | "Drawing Angles", measuring given angles                       |
| **Angles (advanced)**       | `rightAngleDivided`         | Angles divided by rays within a right angle                    |
|                             | `straightLineDividedAngles` | "Angles On A Straight Line" (sum = 180°)                       |
|                             | `rectangleDividedRightAngle`| Rectangle with diagonal forming labelled angles                |
|                             | `dividedStraightLineAngle`  | Straight line with one intersecting arm                        |
|                             | `parallelLinesTransversal`  | "Vertically Opposite Angles" (introduced at P4)                |
| **Geometry**                | `rectangle` / `square`      | "Properties Of Rectangle And Square"                           |
|                             | `polygon`                   | "Properties Of Triangles"                                       |
|                             | `parallelogram`             | "Properties Of Parallelogram, Rhombus And Trapezium"           |
|                             | `isometricGrid`             | "Identifying / Drawing 2D Representations Of Solids" (cube arrangements) — use `mode: "orthographic"` |
|                             | `netDiagram`                | ⭐ "Identifying Nets Of Three-Dimensional Solids" sub_topic — pick `solid` matching question |
| Area and Perimeter          | `rectangle` / `square`      | Standard shapes                                                |
|                             | `rightTriangle`             | Triangle area questions                                        |
|                             | `compositeShape`            | Composite rectilinear figures                                  |
|                             | `drawRectangleOnGrid`       | Grid-based area problems with labelled corners                 |
| **Symmetry**                | `symmetryFigure`            | ⭐ ALL three sub_topics: "Identifying Symmetric Figures" and "Lines Of Symmetry" → `mode: "show_axis"`. "Completing Symmetric Figures" → `mode: "complete"` |
| Data Analysis               | `barChart`                  | DEFAULT for MCQ bar-graph data questions                       |
|                             | `horizontalBarChart`        | When category labels are long                                  |
|                             | `verticalBarChart`          | ONLY for "ink-spill" questions (`"value": "covered"`)          |
|                             | `lineGraph`                 | "Reading Line Graphs" sub_topic                                |
|                             | `dataTable`                 | "Reading Tables" sub_topic                                     |

── P5 ──────────────────────────────────────────────────────────

| Topic                       | Use Function                | Condition / Notes                                              |
|-----------------------------|-----------------------------|----------------------------------------------------------------|
| Whole Numbers               | NULL                        | "Order Of Operations" — text only                              |
| Fractions                   | `fractionBars`              | Comparison and mixed-number visualisation                      |
| Decimals                    | `numberLine`                | Ordering decimals or placing on a line                         |
| **Percentage**              | `pieChart`                  | "Expressing Part Of A Whole As Percentage" — circular problems |
|                             | `rectangle` / `square`      | "Finding Percentage Part Of A Whole" — shaded-portion diagrams |
| **Rate**                    | `lineGraph`                 | "Finding Rate, Total Amount Or Number Of Units"                |
| Average                     | `barChart`                  | Showing data bars with average line for context                |
|                             | `verticalBarChart`          | ONLY for ink-spill avg questions (covered bar)                 |
| Money                       | NULL                        | "Word Problems Involving Money" — text-only                    |
| Length and Mass             | `rulerMeasurement` / NULL   | Sometimes useful; usually text-only at P5                      |
| Volume of Liquid            | NULL                        | Word problems — text-only at P5                                |
| Area of Triangle            | `rightTriangle`             | Right-angled triangle; include hypotenuse if asked             |
|                             | `polygon`                   | Non-right triangles                                            |
|                             | `compositeShape`            | Composite shapes with shaded triangular regions                |
| **Volume**                  | `cuboid`                    | "Volume Of Cube And Cuboid", "Finding Volume Of Liquid In Rectangular Tank" — set `water_level` for liquid problems |
|                             | `isometricGrid`             | ⭐ "Building Solids With Unit Cubes", "Measuring Volume In Cubic Units" — use `mode: "isometric"` |
| **Angles**                  | `rightAngleDivided`         | "Vertically Opposite Angles", "Finding Unknown Angles"         |
|                             | `straightLineDividedAngles` | Angles on a straight line                                      |
|                             | `crossingLines`             | ⭐ "Vertically Opposite Angles" — two lines AB and CD crossing at O, four sector labels |
|                             | `parallelLinesTransversal`  | Alternate / co-interior angle questions                        |
|                             | `rectangleWithLine`         | "Rectangle ABCD with line from corner to point" PSLE pattern   |
| **Geometry**                | `parallelogram`             | "Properties Of Parallelogram, Rhombus And Trapezium"           |
|                             | `polygon`                   | General polygon with vertex labels                             |
|                             | `equilateralTriangle`       | Equal-sided triangle(s); set `count` for multiple              |
|                             | `rectangle` / `square`      | "Properties Of Rectangle And Square"                           |

── P6 ──────────────────────────────────────────────────────────

| Topic                       | Use Function                | Condition / Notes                                              |
|-----------------------------|-----------------------------|----------------------------------------------------------------|
| Fractions                   | `fractionBars`              | Complex comparison or multi-step problems                      |
| Percentage                  | `pieChart`                  | Circular proportion problems                                   |
| Ratio                       | `unitModel`                 | ALL ratio sub_topics: before/after, constant-part, internal-transfer, three-quantities |
| **Algebra**                 | `rectangle`                 | Rectangle with variable side labels (e.g., "x+3 cm")           |
|                             | NULL                        | Pure algebraic manipulation (Simplifying / Evaluating expressions, Solving equations) — text-only |
| **Circles**                 | `circle`                    | "Area And Circumference Of Circle" — use `radiusLabel` OR `diameterLabel` (not both) |
|                             | `circleSegment`             | ⭐ "Area And Perimeter Of Semicircle And Quarter Circle" — pick `shape: "semicircle"` or `"quarter_circle"` |
|                             | `compositeCircleFigure`     | ⭐ "Area And Perimeter Of Composite Figures With Circles" — base rect/square + arc add/subtract/shade ops (preferred for new content) |
|                             | `runningTrack`              | Stadium-shaped track perimeter / area problems                 |
|                             | `quarterCirclesInSquare`    | "Area And Perimeter Of Composite Figures With Circles" — corners-in-square pattern (legacy; prefer `compositeCircleFigure`) |
|                             | `overlappingCircles`        | "Area And Perimeter Of Composite Figures With Circles" — vesica/lens-shaped HOTS |
|                             | `rectangleWithPath`         | "Area And Perimeter Of Composite Figures With Circles" — when path/border is involved |
| Volume                      | `cuboid`                    | 3D tank; before-and-after water level (two diagrams)           |
|                             | `isometricGrid`             | "Finding Unknown Dimension Given Volume" — use cube arrangements |
| **Geometry (general)**      | `polygon`                   | Complex polygons with multiple angle labels                    |
|                             | `parallelogram`             | "Properties Of Parallelogram, Rhombus And Trapezium"           |
|                             | `compositeShape`            | Shaded/unshaded composite area figures                         |
|                             | `rectangleWithLine`         | "Rectangle ABCD with line from corner to point" PSLE pattern   |
| **Geometry (Solid Figures)**| `isometricGrid`             | Use `mode: "isometric"` for 3D view questions                  |
|                             |                             | Use `mode: "orthographic"` for Top/Front/Side view questions   |
|                             |                             | Use `highlight_cubes` to mark specific cubes in rose           |
| Pie Charts                  | `pieChart`                  | "Solving Problems Using Pie Chart Data" — sum `data.value` to total |

── HOTS / Cross-cutting Math (any level where applicable) ──

| Pattern type                | Use Function                | When to apply                                                  |
|-----------------------------|-----------------------------|----------------------------------------------------------------|
| Triangular-number patterns  | `dotTriangle`               | "Figure n has n(n+1)/2 dots" — pattern recognition             |
| Square-grid growth          | `gridGrowth`                | "Figure n is an n×n grid" — black/white square variants        |
| 3×3 magic squares           | `magicSquare`               | Sum-puzzle / corner-relationship HOTS                          |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCIENCE ROUTING MAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

── P3 ──────────────────────────────────────────────────────────

| Topic        | Use Function       | Condition / Notes                                            |
|--------------|--------------------|--------------------------------------------------------------|
| Diversity    | `arrowDiagram`     | Classification tree: nodes = groups, arrows = characteristics |
|              | `conceptMap`       | Hierarchical concept web (living things → plants/animals)    |
|              | `dataTable`        | "Diversity Of Materials And Their Properties" — comparing properties across materials |
| Cycles       | `arrowDiagram`     | Life cycles (insects, amphibians, plants) — `layout: "auto"` detects circular |
|              | `genericExperiment`| Single-setup growth observation                              |
| Interactions | `magnetDiagram`    | "Interaction Of Magnetic Forces" — bar/horseshoe/electromagnet (introduced at P3) |

── P4 ──────────────────────────────────────────────────────────

| Topic        | Use Function       | Condition / Notes                                            |
|--------------|--------------------|--------------------------------------------------------------|
| Diversity    | `dataTable`        | "Diversity Of Materials And Their Properties" — material comparison |
|              | `comparativeSetup` | A/B comparison of material properties (e.g., absorbent vs non-absorbent) |
| Cycles       | `arrowDiagram`     | "Reproduction In Plants And Animals", "Stages Of The Water Cycle" — `layout: "auto"` |
| Systems      | `dataTable`        | "Plant Parts And Functions" — parts vs functions table       |
|              | `circuitDiagram`   | ⭐ "Electrical Systems And Circuits" — battery / switch / bulb |
|              | `placeholder`      | Plant anatomy diagrams (cross-sections) — descriptive placeholder |
| Matter       | `comparativeSetup` | ⭐ "Changes In State Of Matter", solid/liquid/gas comparisons |
|              | `dataTable`        | "Properties Of Solids, Liquids And Gases"                    |
|              | `genericExperiment`| Single-setup matter experiments (no A/B comparison)         |
| **Energy** (heat sub_topics)  | `thermometer`     | "Sources Of Heat", "Effects Of Heat Gain And Heat Loss", "Temperature And Use Of Thermometers" |
|                               | `comparativeSetup`| ⭐ "Good And Poor Conductors Of Heat" — A/B beakers          |
| **Energy** (light sub_topics) | `comparativeSetup`| ⭐ "Sources Of Light", "Reflection Of Light", "Formation Of Shadows", "Transparent, Translucent And Opaque Materials" — `containerType: "box"` |
|                               | `genericExperiment`| Single-setup light experiments (no A/B comparison)          |
| Interactions | `magnetDiagram`    | "Interaction Of Magnetic Forces" — set `interaction: "repulsion"` or `"attraction"`. For coils: `magnetType: "electromagnet"` + `coreMaterial`. |

── P5 ──────────────────────────────────────────────────────────

| Topic        | Use Function       | Condition / Notes                                            |
|--------------|--------------------|--------------------------------------------------------------|
| Cycles       | `arrowDiagram`     | "Stages Of The Water Cycle" as flow diagram — `layout: "auto"` |
|              | `comparativeSetup` | ⭐ Condensation/evaporation A/B setups (cold vs warm surface) |
|              | `genericExperiment`| Single-setup evaporation/condensation                        |
| Systems      | `dataTable`        | Comparing body systems (e.g., xylem vs phloem)              |
|              | `circuitDiagram`   | ⭐ "Electrical Systems And Circuits" — series / parallel     |
|              | `genericExperiment`| Any system with labelled experimental conditions             |
|              | `placeholder`      | Anatomy diagrams (digestive, respiratory, circulatory cross-sections) |

── P6 ──────────────────────────────────────────────────────────

| Topic        | Use Function       | Condition / Notes                                            |
|--------------|--------------------|--------------------------------------------------------------|
| **Energy**   | `circuitDiagram`   | Complex series/parallel with switch states and fused bulbs   |
|              | `comparativeSetup` | "Photosynthesis And Energy Pathways", "Energy Conversion In Everyday Objects" — A/B comparisons |
|              | `arrowDiagram`     | Energy flow diagrams (photosynthesis chain) — `layout: "auto"` |
|              | `genericExperiment`| Specific apparatus setups not covered by other functions     |
| **Interactions** (food chains/webs)  | `arrowDiagram` | "Food Chains And Food Webs", "Interactions Within The Environment" — ensure ≥1 producer node |
| **Interactions** (forces sub_topics) | `rampExperiment` | ⭐ "Frictional Force", "Effects Of Forces On Objects" — set `surfaceTexture` and `forceArrows` |
|                                      | `comparativeSetup` | Side-by-side comparisons (rough vs smooth)                |
|                                      | `genericExperiment`| "Gravitational Force", "Elastic Spring Force" — pulley, spring balance |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — HARD RULES (apply these after looking up the table above)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NEVER use `arrowDiagram` for electrical circuits. ALWAYS use `circuitDiagram`.
2. NEVER use `circuitDiagram` for food chains. ALWAYS use `arrowDiagram`.
3. NEVER use `lineGraph` for bar graph topics. ALWAYS use `barChart` (default) or `verticalBarChart` (ink-spill only).
4. For Science experiments in the routing map above: use the SPECIFIC function listed (`comparativeSetup`, `magnetDiagram`, `rampExperiment`, `circuitDiagram`). ONLY fall back to `genericExperiment` when no specific function applies (e.g., pulley, microscope, spring balance).
5. If a Maths question is entirely computational with no spatial component, set `visual_payload` to NULL. Do NOT force a diagram on a text-only question.
6. `isometricGrid` is the ONLY permitted function for Solid Figures questions (cube arrangements). Do NOT use `cuboid` for flat-grid arrangements. `cuboid` is for 3D TANK/VOLUME questions only. At P5/P6 Volume, BOTH `cuboid` (tank) and `isometricGrid` (unit cubes) are valid — pick by sub_topic.
7. For P3/P4 basic Angles questions, ALWAYS include `protractorMeasurement`. Do NOT use `polygon` or `parallelogram` for angle-reading questions at P3/P4 level.
8. `pieChart` is for CIRCULAR proportion diagrams only. Do NOT use it for bar graphs labelled as "pie" in the question — use `barChart` or `verticalBarChart`.
9. For ALL magnet questions (bar, horseshoe, electromagnet, poles), ALWAYS use `magnetDiagram`. In v5, magnet questions live under `topic = "Interactions"` with `sub_topic = "Interaction Of Magnetic Forces"` (the legacy `topic = "Magnets"` was retired). Do NOT use `genericExperiment` for any magnetic-forces sub_topic.
10. For ALL inclined plane / ramp experiments, ALWAYS use `rampExperiment`. Set `forceArrows` to label Weight, Friction, and Normal force as required. In v5, ramp/force questions live under `topic = "Interactions"` (the legacy `topic = "Forces"` was retired).
11. `comparativeSetup` is the ONLY permitted function for A/B experiment comparisons where two setups differ by one variable. NEVER use `genericExperiment` for A/B setups.
12. For `arrowDiagram`, ALWAYS set `"layout": "auto"`. Do NOT set x/y coordinates on nodes. Do NOT hardcode a layout mode unless the question explicitly requires it.
13. ⭐ NEW — `netDiagram` is the ONLY function for "Identifying Nets Of Three-Dimensional Solids" (P4 Geometry). Pick `solid` to match the question (cube/cuboid/triangular_prism/square_pyramid/cylinder).
14. ⭐ NEW — `symmetryFigure` is the ONLY function for ALL P4 Symmetry sub_topics. Use `mode: "show_axis"` for "Identifying Symmetric Figures" and "Lines Of Symmetry"; use `mode: "complete"` for "Completing Symmetric Figures". Do NOT use `drawRectangleOnGrid` for symmetry questions — it has no mirror line.
15. ⭐ NEW — `circleSegment` is for STANDALONE semicircle / quarter-circle area-or-perimeter questions (P6). Do NOT confuse with `quarterCirclesInSquare`, which is for composite shading where quarters are inscribed inside a square.
16. ⭐ NEW — `parallelLinesTransversal` is the canonical function for alternate, co-interior, corresponding, and vertically opposite angles at P4-P6. Prefer this over `straightLineDividedAngles` when the question explicitly mentions parallel lines.
17. For sub_topics matching "Patterns In Number Sequences" (P1-P3 Whole Numbers), `dotTriangle` and `gridGrowth` are valid alternatives to `numberLine` — pick by the visual structure described in the question.
18. NULL is a VALID routing decision. Time, Money, and pure-computation Whole Numbers / Algebra sub_topics are intentionally text-only at primary level. Do NOT force a diagram.
