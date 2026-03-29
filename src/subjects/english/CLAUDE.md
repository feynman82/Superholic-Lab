# CLAUDE.md — English Domain Context
# Superholic Lab | src/subjects/english/
# Last updated: 2026-03-29
#
# This file scopes all English-specific rules. It INHERITS from the project
# root CLAUDE.md and .claude/rules/moe-templates.md. Where rules conflict,
# this file takes precedence for English work only.
# =======================================================================

## English Domain Identity

**Subject:** English Language (Primary 2 → Primary 6)
**Exam format:** MOE PSLE English (Paper 1 + Paper 2)
**Question types allowed:** `mcq`, `cloze`, `editing` ONLY
**Types NEVER used:** open_ended, short_ans, word_problem

---

## In-Scope Topics by Level

### Primary 2 English
| Component | Sub-topics |
|---|---|
| Grammar | Simple present/past tense, subject-verb agreement, pronouns, articles |
| Vocabulary | Word meaning in context, synonyms |
| Comprehension | Short passages, literal recall |

### Primary 4 English
| Component | Sub-topics |
|---|---|
| Grammar | All tenses, modal verbs, passive voice, conjunctions |
| Vocabulary | Phrasal verbs, idioms (simple), word forms |
| Cloze | Grammar-in-context (10-15 word passage blanks) |
| Editing | Spot and correct one error per passage (grammar) |
| Comprehension | Literal, inferential, vocabulary-in-context questions |

### Primary 6 English
| Component | Sub-topics |
|---|---|
| Grammar | Complex tenses, reported speech, conditionals |
| Vocabulary | Advanced word forms, collocations |
| Cloze | Vocabulary-in-context and grammar-in-context |
| Editing | Multiple error types at PSLE difficulty |
| Comprehension | Narrative, expository, visual texts |

---

## Grammar Rule Naming Convention

When writing `explanation` fields in cloze blanks and editing lines, ALWAYS name the
grammar rule explicitly using this taxonomy:

| Rule | How to Name It |
|---|---|
| He/She/It + s | Subject-verb agreement (singular 3rd person) |
| They/We/You + base verb | Subject-verb agreement (plural) |
| Past time signal → past tense | Simple past tense |
| Since/for + ongoing → perfect | Present perfect tense |
| By [past time] → past perfect | Past perfect tense |
| Will/would/can/could | Modal verb usage |
| A/an/the | Article usage |
| at/in/on (time/place) | Preposition of time/place |
| -er/-est for comparison | Comparative/superlative adjective |
| -ly suffix | Adverb formation |

**Template for explanation:**
"[Rule name]. [Sentence demonstrating the rule]. Therefore, [correct form] is correct."

---

## Cloze Question Rules

### Passage Requirements
- 120–180 words for P4, 180–250 words for P5/P6
- Narrative style (past tense) OR expository (present tense) — be consistent
- Singapore context (SG characters, locations, culturally relevant scenarios)
- 10–15 blanks per passage (PSLE format)
- Blanks spaced throughout passage — not all at the beginning

### Option Set Rules for Each Blank
- 4 options covering the same word class (all verbs, all adjectives, etc.)
- Common wrong options represent real tense/form errors:
  - go / goes / went / going → tests tense + form
  - happy / happily / happier / happiest → tests word form
- Correct answer must be determinable from context — no ambiguous blanks

### Passage Writing Checklist
```
[ ] Past tense passage uses consistent past tense throughout
[ ] Each blank tests ONE specific grammar rule (not multiple)
[ ] Passage makes sense with ALL blanks removed
[ ] No cultural references outside Singapore context
[ ] Reading level matches the target level (P4/P5/P6)
[ ] Names from the approved rotation pool
```

---

## Editing Question Rules

### Passage Line Requirements
- 8–12 lines per editing passage (PSLE format)
- Exactly ONE line contains an error — all other lines are correct
- Underlined word per line is the focus — may or may not be the error
- Error types by P4 level: subject-verb agreement (50%), tense errors (30%), pronoun errors (20%)

### Error Placement Rules
- Never put the error in line 1 (sets bad tone for the passage)
- Never put the error in the last line
- Mix error line position across questions (line 3, line 5, line 7, etc.)
- Error must be in the UNDERLINED word — the underlined word is what is tested

### Correct Lines Rule
For lines where `has_error: false`:
- `correct_word` must be `null`
- `explanation` must be `null`
- The `underlined_word` is there to make students think, not to indicate an error

---

## English Vocabulary Standards

### Word Difficulty by Level
| Level | Vocabulary Standard |
|---|---|
| P2 | 500–1000 most common English words + subject vocabulary |
| P4 | Up to 3000 word families, phrasal verbs introduced |
| P6 | Up to 5000 word families, figurative language |

### Singapore English Notes
- British spelling: colour, honour, realise, practise (verb), practice (noun)
- Never use American spellings: color, honor, realize, practice (verb)
- Accepted Singapore English terms: tuck shop, void deck, hawker centre
- Standard formal register for all instructional text

---

## Comprehension Question Rules

*(For future implementation — comprehension type not yet in quiz engine)*

When comprehension questions are added:
- Literal questions: "According to the passage..."
- Inferential questions: "What does this suggest about..."
- Vocabulary-in-context: "What does [word] mean in paragraph [N]?"
- Never ask questions that require knowledge outside the passage

---

## Type Distribution for English

| Type | Target % | Notes |
|---|---|---|
| mcq | 40% | Grammar and vocabulary |
| cloze | 30% | Grammar-in-context passage |
| editing | 30% | Spot-the-error passage |

---

## Files Owned by This Context

```
data/questions/p2-english-*.json
data/questions/p4-english-*.json
data/questions/p5-english-*.json  (future)
data/questions/p6-english-*.json  (future)
src/app/quiz/english/             (Next.js pages — future)
src/components/quiz/EnglishCard/  (Next.js component — future)
```
