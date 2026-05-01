# Question Bank Schema — Superholic Lab
# Last updated: 2026-04-09
#
# SOURCE OF TRUTH for all question JSON files in data/questions/.
# Every question produced for this platform MUST conform to these schemas.
# See also: .claude/rules/moe-templates.md for full pedagogical rules.
# =======================================================================

## File Naming Convention

```
data/questions/{level}-{subject}-{topic}.json
```

Examples:
- `p4-mathematics-fractions.json`
- `p4-science-heat.json`
- `p6-english-cloze.json`

Each file is a JSON array of question objects at the top level.

---

## 1. Universal Base Fields (ALL question types)

Every question object, regardless of type, MUST include:

```json
{
  "id":             "p4s-ht-001",
  "subject":        "Science",
  "level":          "Primary 4",
  "topic":          "Heat",
  "sub_topic":      "Heat Conductors",
  "difficulty":     "Standard",
  "type":           "mcq",
  "marks":          2,
  "question_text":  "Which material is the best conductor of heat?",
  "worked_solution": "Step 1: ...\nStep 2: ...\nStep 3: ...",
  "examiner_note":  "Required for Advanced and HOTS only. Omit for Foundation/Standard."
}
```

### ID Naming Convention
```
{level}{subject}{topic-abbr}{3-digit-seq}

Level:   p1–p6
Subject: m=Maths, s=Science, e=English
Topic:   2–4 letter slug (e.g., ht=heat, fr=fractions, gr=grammar)
Seq:     zero-padded 3 digits: 001, 002, ..., 099

Examples:
  p4s-ht-001   → Primary 4 Science, Heat, question 1
  p4m-fr-006   → Primary 4 Maths, Fractions, question 6
  p4e-gr-002   → Primary 4 English, Grammar, question 2
```

### Field Rules

| Field | Required | Values |
|-------|----------|--------|
| `id` | Always | Unique, never reused |
| `subject` | Always | `"Mathematics"`, `"Science"`, `"English"` |
| `level` | Always | `"Primary 1"` through `"Primary 6"` |
| `difficulty` | Always | `"Foundation"`, `"Standard"`, `"Advanced"`, `"HOTS"` |
| `type` | Always | See supported types below |
| `marks` | Always | Integer ≥ 1 |
| `worked_solution` | Always | Minimum 3 numbered steps |
| `examiner_note` | Advanced/HOTS only | Optional for Foundation/Standard |

---

## 2. Diagram Field (Optional — Exam Engine v2)

Any question may include a `diagram` field to display a visual alongside the question text.

```json
{
  "id": "p4m-ge-001",
  "type": "short_ans",
  "question_text": "Find the perimeter of the rectangle below.",
  "diagram": {
    "type": "rectangle",
    "position": "above",
    "params": {
      "widthLabel": "12 cm",
      "heightLabel": "7 cm",
      "showNotToScale": true
    }
  }
}
```

### `diagram` Object Fields

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Always | DiagramLibrary function name (see below) |
| `position` | Always | `"above"`, `"below"`, or `"right"` |
| `params` | Always | Object passed directly to the DiagramLibrary function |

### Supported Diagram Types

All types correspond to functions in `js/diagram-library.js`:

| `type` value | Function | Returns | Use case |
|---|---|---|---|
| `rectangle` | `DiagramLibrary.rectangle(params)` | SVG | Maths geometry: rectangles |
| `square` | `DiagramLibrary.square(params)` | SVG | Maths geometry: squares |
| `rightTriangle` | `DiagramLibrary.rightTriangle(params)` | SVG | Maths geometry: right triangles |
| `compositeShape` | `DiagramLibrary.compositeShape(params)` | SVG | Maths: L-shapes, compound figures |
| `circle` | `DiagramLibrary.circle(params)` | SVG | Maths geometry: circles |
| `numberLine` | `DiagramLibrary.numberLine(params)` | SVG | Maths: number lines, fractions |
| `fractionBar` | `DiagramLibrary.fractionBar(params)` | SVG | Maths: fraction models |
| `fractionBars` | `DiagramLibrary.fractionBars(params)` | SVG | Maths: comparing fractions |
| `barChart` | `DiagramLibrary.barChart(params)` | SVG | Maths/Science: data representation |
| `horizontalBarChart` | `DiagramLibrary.horizontalBarChart(params)` | SVG | Maths: horizontal bar charts |
| `pictogram` | `DiagramLibrary.pictogram(params)` | SVG | Maths: pictograms |
| `lineGraph` | `DiagramLibrary.lineGraph(params)` | SVG | Maths/Science: line graphs |
| `dataTable` | `DiagramLibrary.dataTable(params)` | HTML | All subjects: tabular data |
| `thermometer` | `DiagramLibrary.thermometer(params)` | SVG | Science: temperature measurement |
| `arrowDiagram` | `DiagramLibrary.arrowDiagram(params)` | SVG | Science: food chains, cycles |
| `placeholder` | `DiagramLibrary.placeholder(params)` | SVG | Any: marks space for printed diagram |

### Params Reference Per Type

#### `rectangle`
```json
{
  "widthLabel": "8 cm",
  "heightLabel": "5 cm",
  "unit": "cm",
  "fillColor": "var(--bg-elevated)",
  "title": "",
  "showNotToScale": true
}
```

#### `square`
```json
{ "sideLabel": "6 cm", "unit": "cm", "fillColor": "var(--bg-elevated)" }
```

#### `rightTriangle`
```json
{
  "base": "6",
  "height": "8",
  "hypotenuse": "10",
  "unit": "cm",
  "showRightAngle": true,
  "fillColor": "var(--bg-elevated)"
}
```

#### `circle`
```json
{
  "radiusLabel": "7 cm",
  "diameterLabel": "",
  "unit": "cm",
  "fillColor": "var(--bg-elevated)"
}
```

#### `numberLine`
```json
{
  "start": 0,
  "end": 10,
  "marked": [3, 7],
  "labels": {},
  "showArrows": true,
  "highlight": []
}
```

#### `fractionBar`
```json
{
  "numerator": 3,
  "denominator": 4,
  "showLabel": true,
  "fillColor": "var(--brand-rose)"
}
```

#### `fractionBars`
```json
{
  "fractions": [
    { "numerator": 1, "denominator": 2, "fillColor": "var(--brand-rose)" },
    { "numerator": 3, "denominator": 4, "fillColor": "var(--brand-sage)" }
  ],
  "labels": ["1/2", "3/4"]
}
```

#### `barChart`
```json
{
  "title": "Favourite Sports",
  "xLabel": "Sport",
  "yLabel": "Number of students",
  "bars": [
    { "label": "Football", "value": 12 },
    { "label": "Swimming", "value": 8 }
  ],
  "maxY": 15,
  "showValues": true
}
```

#### `pictogram`
```json
{
  "title": "Books Read",
  "items": [
    { "label": "Ahmad", "count": 3 },
    { "label": "Siti", "count": 5 }
  ],
  "keyValue": 2,
  "keySymbol": "📚",
  "keyLabel": "= 2 books"
}
```

#### `lineGraph`
```json
{
  "title": "Temperature over time",
  "xLabel": "Time (min)",
  "yLabel": "Temperature (°C)",
  "points": [[0, 25], [5, 40], [10, 60], [15, 80]],
  "xTicks": [0, 5, 10, 15],
  "yTicks": [0, 20, 40, 60, 80]
}
```

#### `dataTable`
```json
{
  "headers": ["Name", "Mass (g)", "Volume (cm³)"],
  "rows": [
    ["Iron ball", "150", "20"],
    ["Rubber duck", "45", "80"]
  ],
  "caption": "Table 1: Properties of objects",
  "highlightCol": 0
}
```

#### `thermometer`
```json
{
  "minTemp": 0,
  "maxTemp": 100,
  "currentTemp": 37,
  "unit": "°C",
  "label": "Body temperature"
}
```

#### `arrowDiagram`
```json
{
  "nodes": [
    { "id": "grass", "label": "Grass" },
    { "id": "rabbit", "label": "Rabbit" },
    { "id": "eagle", "label": "Eagle" }
  ],
  "arrows": [
    { "from": "grass", "to": "rabbit" },
    { "from": "rabbit", "to": "eagle" }
  ],
  "layout": "horizontal"
}
```

#### `placeholder`
```json
{
  "width": 300,
  "height": 200,
  "description": "Human digestive system",
  "borderStyle": "dashed"
}
```

### `position` Values

| Value | Behaviour |
|-------|-----------|
| `"above"` | Diagram rendered above question text. CSS class: `.diagram-above` |
| `"below"` | Diagram rendered below question text. CSS class: `.diagram-below` |
| `"right"` | Diagram floated right of question text. CSS class: `.diagram-right` |

---

## 3. Type-Specific Schemas

### 3a. MCQ (Mathematics, Science, English)

```json
{
  "options": [
    "Option A text — full sentence",
    "Option B text — full sentence",
    "Option C text — full sentence",
    "Option D text — full sentence"
  ],
  "correct_answer": "B",
  "wrong_explanations": {
    "A": "Specific misconception addressed for option A.",
    "C": "Specific misconception addressed for option C.",
    "D": "Specific misconception addressed for option D."
  }
}
```

Note: `correct_answer` is the LETTER (A/B/C/D), derived from array index (0→A, 1→B, 2→C, 3→D).

### 3b. Short Answer (Mathematics only)

```json
{
  "correct_answer": "282",
  "accept_also": ["282 cm", "282cm"]
}
```

### 3c. Word Problem (Mathematics only)

```json
{
  "parts": [
    {
      "label": "(a)",
      "question": "How many tarts did she give away?",
      "marks": 2,
      "correct_answer": "35",
      "worked_solution": "Step 1: 1/3 of 60 = 20\nStep 2: 1/4 of 60 = 15\nStep 3: Total = 20 + 15 = 35"
    },
    {
      "label": "(b)",
      "question": "How many tarts were left?",
      "marks": 1,
      "correct_answer": "25",
      "worked_solution": "Step 1: 60 - 35 = 25"
    }
  ]
}
```

Word problems are NOT auto-graded. The quiz engine shows the model answer for student comparison.

### 3d. Open-Ended (Science only)

```json
{
  "keywords": ["conductor", "heat", "flows", "hotter", "cooler"],
  "model_answer": "The metal rod is a good conductor of heat. Heat flows from the hotter flame to the cooler end of the rod."
}
```

Open-ended questions are NOT auto-graded. Keywords are highlighted in the model answer for self-check.

### 3e. Cloze (English only)

```json
{
  "passage": "Last Saturday, Mei Ling [1] to the library with her brother. They [2] many interesting books on the shelf.",
  "blanks": [
    {
      "number": 1,
      "options": ["go", "goes", "went", "going"],
      "correct_answer": "C",
      "explanation": "Past tense is required because the action happened last Saturday."
    },
    {
      "number": 2,
      "options": ["find", "found", "finding", "founded"],
      "correct_answer": "B",
      "explanation": "Past tense 'found' matches the past tense narrative of the passage."
    }
  ]
}
```

### 3f. Editing (English only)

```json
{
  "passage_lines": [
    {
      "line_number": 1,
      "text": "Ahmad and his friends was playing football yesterday.",
      "underlined_word": "was",
      "has_error": true,
      "correct_word": "were",
      "explanation": "Plural subject 'Ahmad and his friends' requires the plural verb 'were'."
    },
    {
      "line_number": 2,
      "text": "They scored three goals in the match.",
      "underlined_word": "scored",
      "has_error": false,
      "correct_word": null,
      "explanation": null
    }
  ]
}
```

Exactly 1 error per editing question (real PSLE format). `has_error: false` lines still have an `underlined_word` to test discrimination.

---

## 4. Supported Types by Subject

| Subject | mcq | short_ans | word_problem | open_ended | cloze | editing |
|---------|:---:|:---------:|:------------:|:----------:|:-----:|:-------:|
| Mathematics | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Science | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| English | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |

---

## 5. Complete Example — MCQ with Diagram

```json
{
  "id": "p4m-ge-003",
  "subject": "Mathematics",
  "level": "Primary 4",
  "topic": "Geometry",
  "sub_topic": "Area and Perimeter",
  "difficulty": "Standard",
  "type": "mcq",
  "marks": 2,
  "question_text": "The rectangle below has a width of 8 cm and a height of 5 cm. What is the area of the rectangle?",
  "diagram": {
    "type": "rectangle",
    "position": "above",
    "params": {
      "widthLabel": "8 cm",
      "heightLabel": "5 cm",
      "showNotToScale": true
    }
  },
  "options": [
    "26 cm²",
    "40 cm²",
    "13 cm²",
    "80 cm²"
  ],
  "correct_answer": "B",
  "wrong_explanations": {
    "A": "26 cm² is the perimeter (2 × 8 + 2 × 5 = 26), not the area. Area = length × breadth, not 2 × (l + b).",
    "C": "13 cm² is half the perimeter. Remember: area uses multiplication (8 × 5), not addition.",
    "D": "80 cm² results from doubling the area. Area = 8 × 5 = 40 cm², not 2 × 8 × 5."
  },
  "worked_solution": "Step 1: Identify length = 8 cm, breadth = 5 cm\nStep 2: Area = length × breadth\nStep 3: Area = 8 × 5 = 40 cm²"
}
```

---

## 6. Complete Example — Science Open-Ended with Arrow Diagram

```json
{
  "id": "p4s-ec-001",
  "subject": "Science",
  "level": "Primary 4",
  "topic": "Ecology",
  "sub_topic": "Food Chains",
  "difficulty": "Standard",
  "type": "open_ended",
  "marks": 3,
  "question_text": "The diagram shows a food chain. Explain what would happen to the population of eagles if the population of rabbits decreased greatly.",
  "diagram": {
    "type": "arrowDiagram",
    "position": "above",
    "params": {
      "nodes": [
        { "id": "grass", "label": "Grass" },
        { "id": "rabbit", "label": "Rabbit" },
        { "id": "eagle", "label": "Eagle" }
      ],
      "arrows": [
        { "from": "grass", "to": "rabbit" },
        { "from": "rabbit", "to": "eagle" }
      ],
      "layout": "horizontal"
    }
  },
  "keywords": ["decrease", "food", "less", "eagles", "population"],
  "model_answer": "The population of eagles would decrease. This is because rabbits are the food source for eagles. With less food available, eagles would not have enough energy to survive and reproduce, causing their population to decrease.",
  "worked_solution": "Step 1 (Claim): The eagle population would decrease.\nStep 2 (Evidence): Rabbits are the food source for eagles in this food chain.\nStep 3 (Reasoning): With fewer rabbits available as food, eagles would have less energy. This would lead to fewer eagles surviving and reproducing, causing the eagle population to fall."
}
```
