// ─────────────────────────────────────────────────────────────────────────
// /public/js/syllabus-dependencies.js — Topic Prerequisite DAG
// ─────────────────────────────────────────────────────────────────────────
// MIRROR of lib/api/quest-pedagogy.js SYLLABUS_DEPENDENCIES.
// Backend is source of truth. If you edit this, edit there too.
//
// Drives:
//   1. Cognitive diagnosis sentence on progress.html
//   2. SVG dependency tree visualization (DAG layout)
//   3. Quest pedagogy "what unlocks what" hero sentences
//
// Schema (v5.0 — 2026-05-01):
//   Aligned to canon_level_topics v5 (296 rows).
//   Math: 26 topics. Science: 6 topics (Forces folded into Interactions,
//   Cells removed, Heat/Light folded into Energy). English: 7 topics.
//
// All names are CASE-SENSITIVE and must exactly match canon_level_topics.
// ─────────────────────────────────────────────────────────────────────────

const SYLLABUS_DEPENDENCIES = {
  mathematics: {
    "Whole Numbers": {
      prerequisites: [],
      enables: [
        "Addition and Subtraction",
        "Money",
        "Length and Mass",
        "Time",
        "Shapes and Patterns",
        "Data Analysis",
        "Fractions",
        "Factors and Multiples",
        "Algebra"
      ],
      first_introduced: "Primary 1",
      rationale: "Forms the foundation of counting, place value, and quantitative reasoning."
    },
    "Addition and Subtraction": {
      prerequisites: ["Whole Numbers"],
      enables: ["Multiplication and Division", "Money", "Average"],
      first_introduced: "Primary 1",
      rationale: "Builds on whole numbers to combine or find differences between quantities."
    },
    "Multiplication and Division": {
      prerequisites: ["Addition and Subtraction"],
      enables: [
        "Multiplication Tables",
        "Fractions",
        "Factors and Multiples",
        "Area and Perimeter",
        "Average",
        "Rate"
      ],
      first_introduced: "Primary 1",
      rationale: "Extends addition into repeated addition and equal grouping."
    },
    "Multiplication Tables": {
      prerequisites: ["Multiplication and Division"],
      enables: [],
      first_introduced: "Primary 2",
      rationale: "Memorisation of times tables underpins fluent multiplication and division."
    },
    "Money": {
      prerequisites: ["Whole Numbers", "Addition and Subtraction"],
      enables: ["Decimals"],
      first_introduced: "Primary 1",
      rationale: "Applies arithmetic to dollars and cents — the gateway to decimal notation."
    },
    "Length and Mass": {
      prerequisites: ["Whole Numbers"],
      enables: ["Volume of Liquid", "Area and Perimeter"],
      first_introduced: "Primary 1",
      rationale: "Introduces physical measurement using number sense."
    },
    "Volume of Liquid": {
      prerequisites: ["Length and Mass"],
      enables: ["Volume"],
      first_introduced: "Primary 2",
      rationale: "Builds on length and mass to measure liquid capacity in litres and millilitres."
    },
    "Time": {
      prerequisites: ["Whole Numbers"],
      enables: ["Rate"],
      first_introduced: "Primary 1",
      rationale: "Reading clocks and computing durations rests on number sense."
    },
    "Shapes and Patterns": {
      prerequisites: ["Whole Numbers"],
      enables: ["Angles", "Geometry"],
      first_introduced: "Primary 1",
      rationale: "Introduces basic spatial reasoning and visual sequences."
    },
    "Data Analysis": {
      prerequisites: ["Whole Numbers"],
      enables: ["Pie Charts"],
      first_introduced: "Primary 1",
      rationale: "Counting underpins reading picture, bar and line graphs."
    },
    "Fractions": {
      prerequisites: ["Whole Numbers", "Multiplication and Division"],
      enables: ["Decimals", "Ratio", "Pie Charts", "Algebra", "Percentage"],
      first_introduced: "Primary 2",
      rationale: "Extends numbers into equal parts of a whole or set."
    },
    "Angles": {
      prerequisites: ["Shapes and Patterns"],
      enables: ["Geometry", "Area of Triangle"],
      first_introduced: "Primary 3",
      rationale: "Builds on 2D shapes to measure rotation between intersecting lines."
    },
    "Geometry": {
      prerequisites: ["Shapes and Patterns", "Angles"],
      enables: ["Symmetry"],
      first_introduced: "Primary 3",
      rationale: "Applies angle rules to define properties of polygons and parallel lines."
    },
    "Area and Perimeter": {
      prerequisites: ["Length and Mass", "Multiplication and Division"],
      enables: ["Area of Triangle", "Circles", "Volume"],
      first_introduced: "Primary 3",
      rationale: "Applies multiplication to find boundary length and surface coverage of 2D shapes."
    },
    "Factors and Multiples": {
      prerequisites: ["Whole Numbers", "Multiplication and Division"],
      enables: [],
      first_introduced: "Primary 4",
      rationale: "Uses division and multiplication to identify number components and patterns."
    },
    "Decimals": {
      prerequisites: ["Fractions", "Money"],
      enables: ["Percentage"],
      first_introduced: "Primary 4",
      rationale: "Translates fractions of tenths and hundredths into base-10 place values."
    },
    "Symmetry": {
      prerequisites: ["Geometry"],
      enables: [],
      first_introduced: "Primary 4",
      rationale: "Uses geometric properties to identify mirrored halves of figures."
    },
    "Area of Triangle": {
      prerequisites: ["Area and Perimeter", "Angles"],
      enables: [],
      first_introduced: "Primary 5",
      rationale: "Applies base-and-height to calculate half the area of an enclosing rectangle."
    },
    "Volume": {
      prerequisites: ["Area and Perimeter", "Volume of Liquid"],
      enables: [],
      first_introduced: "Primary 5",
      rationale: "Extends 2D area into 3D capacity of cubes and cuboids."
    },
    "Percentage": {
      prerequisites: ["Decimals", "Fractions"],
      enables: [],
      first_introduced: "Primary 5",
      rationale: "Builds on decimals and fractions to represent parts per hundred."
    },
    "Ratio": {
      prerequisites: ["Fractions"],
      enables: ["Rate"],
      first_introduced: "Primary 5",
      rationale: "Uses fraction concepts to compare relative sizes of two or more quantities."
    },
    "Rate": {
      prerequisites: ["Multiplication and Division", "Time", "Ratio"],
      enables: [],
      first_introduced: "Primary 5",
      rationale: "Combines ratio and multiplication to compare amounts per unit of time or quantity."
    },
    "Average": {
      prerequisites: ["Addition and Subtraction", "Multiplication and Division"],
      enables: [],
      first_introduced: "Primary 5",
      rationale: "Uses division and addition to find the mean value of a data set."
    },
    "Algebra": {
      prerequisites: ["Whole Numbers", "Fractions"],
      enables: [],
      first_introduced: "Primary 6",
      rationale: "Abstracts arithmetic by using letters to represent unknown numerical values."
    },
    "Circles": {
      prerequisites: ["Area and Perimeter"],
      enables: [],
      first_introduced: "Primary 6",
      rationale: "Applies area and perimeter formulas using pi for curved 2D shapes."
    },
    "Pie Charts": {
      prerequisites: ["Data Analysis", "Fractions"],
      enables: [],
      first_introduced: "Primary 4",
      rationale: "Uses fractions to interpret circular data graphs; percentage extends this at P6."
    }
  },
  science: {
    "Diversity": {
      prerequisites: [],
      enables: ["Cycles", "Systems", "Interactions", "Matter"],
      first_introduced: "Primary 3",
      rationale: "Introduces the classification of living and non-living things."
    },
    "Cycles": {
      prerequisites: ["Diversity"],
      enables: ["Systems"],
      first_introduced: "Primary 3",
      rationale: "Builds on classification to examine life cycles and the water cycle."
    },
    "Matter": {
      prerequisites: ["Diversity"],
      enables: ["Energy"],
      first_introduced: "Primary 4",
      rationale: "Studies the physical states and properties of solids, liquids and gases."
    },
    "Systems": {
      prerequisites: ["Diversity", "Cycles"],
      enables: ["Energy"],
      first_introduced: "Primary 4",
      rationale: "Examines how plant and human organ systems work together."
    },
    "Energy": {
      prerequisites: ["Matter", "Systems"],
      enables: [],
      first_introduced: "Primary 4",
      rationale: "Builds on matter and systems to understand light, heat, and energy conversion."
    },
    "Interactions": {
      prerequisites: ["Diversity"],
      enables: [],
      first_introduced: "Primary 3",
      rationale: "Explores how organisms, magnets, forces and the environment affect one another."
    }
  },
  english: {
    "Grammar": {
      prerequisites: [],
      enables: ["Cloze", "Editing", "Synthesis"],
      first_introduced: "Primary 1",
      rationale: "Provides the foundational rules for forming correct sentences."
    },
    "Vocabulary": {
      prerequisites: [],
      enables: ["Cloze", "Comprehension", "Summary Writing"],
      first_introduced: "Primary 1",
      rationale: "Builds the essential word bank needed to construct meaning."
    },
    "Comprehension": {
      prerequisites: ["Vocabulary"],
      enables: ["Summary Writing"],
      first_introduced: "Primary 1",
      rationale: "Applies vocabulary knowledge to extract meaning from continuous and visual text."
    },
    "Cloze": {
      prerequisites: ["Grammar", "Vocabulary"],
      enables: [],
      first_introduced: "Primary 1",
      rationale: "Requires applying both grammar and vocabulary to fill contextual blanks."
    },
    "Editing": {
      prerequisites: ["Grammar"],
      enables: [],
      first_introduced: "Primary 3",
      rationale: "Builds on grammar rules to identify and correct textual errors."
    },
    "Synthesis": {
      prerequisites: ["Grammar"],
      enables: ["Summary Writing"],
      first_introduced: "Primary 4",
      rationale: "Uses grammar rules and connectors to combine multiple clauses into one."
    },
    "Summary Writing": {
      prerequisites: ["Comprehension", "Vocabulary", "Synthesis"],
      enables: [],
      first_introduced: "Primary 5",
      rationale: "Combines comprehension and synthesis to concisely paraphrase key points."
    }
  }
};

// Legacy global exposure for non-module scripts (progress.js loads as <script>).
if (typeof window !== 'undefined') {
  window.SYLLABUS_DEPENDENCIES = SYLLABUS_DEPENDENCIES;
}

// ESM export for module-aware callers (lib/api/quest-pedagogy.js mirror).
export { SYLLABUS_DEPENDENCIES };