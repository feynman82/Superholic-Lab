# CLAUDE.md — Science Domain Context
# Superholic Lab | src/subjects/science/
# Last updated: 2026-03-29
#
# This file scopes all Science-specific rules. It INHERITS from the project
# root CLAUDE.md and .claude/rules/moe-templates.md. Where rules conflict,
# this file takes precedence for Science work only.
# =======================================================================

## Science Domain Identity

**Subject:** Science (Primary 4 → Primary 6)
**Exam format:** MOE PSLE Science
**Question types allowed:** `mcq`, `open_ended` ONLY
**Types NEVER used:** word_problem, short_ans, cloze, editing, comprehension

---

## In-Scope Topics by Level

### Primary 4 Science
| Topic | Sub-topics |
|---|---|
| Heat | Sources of heat, good/poor conductors, thermal expansion, heat transfer |
| Light | Light sources, reflection, shadows, transparent/translucent/opaque |
| Magnets | Magnetic materials, poles, attraction/repulsion, uses |
| Matter | States of matter, properties, changes of state, water cycle |
| Systems | Parts and functions, digestive system, reproductive system |

### Primary 5 Science
| Topic | Sub-topics |
|---|---|
| Cells | Cell structure, plant vs animal cells, unicellular organisms |
| Reproduction | Asexual and sexual reproduction, flowering plants, humans |
| Life Cycles | Insects (complete/incomplete metamorphosis), frogs, plants |
| Electrical Systems | Series/parallel circuits, conductors, voltage, current |
| Forces | Gravitational, magnetic, elastic, frictional force |
| Water | Water cycle, states of water, water pollution |

### Primary 6 Science
| Topic | Sub-topics |
|---|---|
| Energy | Forms, conversion, renewable vs non-renewable |
| Food Webs | Producers, consumers, food chains, food webs |
| Microorganisms | Bacteria, viruses, fungi, useful and harmful effects |
| Environment | Adaptations, ecosystems, human impact |

---

## CER Framework — MANDATORY for open_ended

Every Science `open_ended` question answer MUST follow CER structure.
See `.claude/rules/moe-templates.md` Section 8 for full CER template.

**Science-specific CER rule:**
- CLAIM must name the scientific conclusion directly
- EVIDENCE must reference observable data from the question scenario
- REASONING must name the scientific principle/concept by its correct term

**Banned phrases in model answers:**
- "it will happen because..." (vague causation — be specific)
- "the thing conducts heat" (must name: "metal is a good conductor of heat")
- "heat moves" (must say: "heat is conducted/transferred from [hotter] to [cooler]")

---

## PSLE Science Mark Scheme Conventions

### For MCQ (2 marks):
- 1 mark: correct identification of phenomenon
- 1 mark: correct scientific explanation (must name concept)
- Full marks require BOTH parts

### For Open-Ended (2–4 marks):
- 1 mark per keyword cluster
- Mark-bearing keywords are defined in the `keywords` field of the question JSON
- Examiners mark for concepts, not exact phrasing — but keywords MUST be present

### Common Mark-Losing Patterns to Avoid in Wrong Explanations:
- "heat travels through the spoon" (vague — should say "heat is conducted through")
- "metal gets hot faster" (correct idea, wrong explanation — explain conductivity)
- "plastic keeps heat in" (incorrect framing — plastic is a poor conductor, not a container)

---

## Science Question Writing Standards

### Scenario Grounding
Every Science question must be set in an observable, everyday Singapore scenario.
Banned: abstract lab descriptions with no context.
Required: named student, real object, observable phenomenon.

```
WRONG: "A conductor is placed in contact with a heat source."
RIGHT: "Siti placed a metal spoon in her hot Milo at the school canteen."
```

### Scientific Vocabulary Requirements
- Use the exact MOE-approved terminology
- P4 Heat: "good conductor", "poor conductor/insulator", "thermal expansion", "heat transfer"
- P4 Light: "transparent", "translucent", "opaque", "reflection", "shadow"
- P4 Magnets: "magnetic material", "magnetic pole", "attract", "repel"
- P4 Matter: "solid", "liquid", "gas", "evaporation", "condensation", "melting", "freezing"

### Diagram Questions
When referencing a diagram (common in PSLE):
- Describe the diagram fully in `question_text` — do not assume the student can see it
- Use cardinal directions (top, bottom, left, right) not vague spatial terms

---

## Type Distribution for Science

| Type | Target % | Notes |
|---|---|---|
| mcq | 70% | 4-option, 2 marks standard |
| open_ended | 30% | CER structured, 2–4 marks |

Generate open_ended questions for topics that test process/explanation:
- Heat transfer mechanisms
- Changes of state explanations
- Circuit behaviour descriptions
- Adaptation explanations

Use MCQ for topics testing identification and classification:
- Materials: conductor vs insulator
- States of matter identification
- Circuit component identification

---

## Difficulty Calibration for Science

| Difficulty | Description | Example |
|---|---|---|
| Foundation | Name/identify only | "Which material is a good conductor?" |
| Standard | Explain with one concept | "Why does the metal spoon feel hotter?" |
| Advanced | Apply concept to novel situation | "Why would a wooden handle on a metal pot make it safer?" |
| HOTS | Evaluate or design-based thinking | "A student claims X. Is she correct? Explain using CER." |

---

## Files Owned by This Context

```
data/questions/p4-science-*.json
data/questions/p5-science-*.json
data/questions/p6-science-*.json  (future)
src/app/quiz/science/             (Next.js pages — future)
src/components/quiz/ScienceCard/  (Next.js component — future)
```
