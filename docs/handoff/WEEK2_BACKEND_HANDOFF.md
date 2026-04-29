# Week 2 — Backend & Admin Handoff (v2)

**Sprint:** Week 2 of LAUNCH_PLAN_v1 (BKT polish + dependency tree)
**Stream:** Backend & Admin
**Commits in this handoff:** 1 (atomic, all changes together)
**Pillar:** Pillar 2 (Analyse Weakness)
**Depends on:** Diagnostic handoff must be done first (`question_attempts` writes must work). Topic Naming handoff can run in parallel with this one.

This is **v2** — replaces the earlier draft. Changes from v1:
- Adds `GET /api/syllabus-tree` (eliminates frontend mirror file drift risk).
- Adds `GET /api/recent-attempts` (powers heatmap modal).
- `runCognitiveDiagnosis` now uses `mastery_levels.sub_topic` granularity.
- English sub_topic strings have `(PSLE Paper 2)` suffix stripped (canon locked).

---

## Goal

Three additions to `lib/api/handlers.js` plus one big constant replacement in `lib/api/quest-pedagogy.js`. All in one commit because the frontend handoff blocks on all of these together.

---

## Pre-flight reading (do this first, in order)

1. `CLAUDE.md` v4.1 — coding rules, the canonical 4 Pillars, framework boundary.
2. `ARCHITECTURE.md` v4.1 — schema, BKT `cognitive_skill → MOE AO` mapping.
3. `lib/api/handlers.js` — locate `handleAnalyzeWeakness`. Read end to end.
4. `lib/api/quest-pedagogy.js` — current `SYLLABUS_DEPENDENCIES` (will be replaced).
5. `api/index.js` — the route table that maps URLs to handlers. You'll add 2 routes here.
6. `docs/QUEST_PAGE_SPEC.md` v2.0 — Honest Compass / `no_improvement` rule. Hero sentence must NOT lie about progress.
7. The `mastery_levels` schema:
   ```
   (id, student_id, subject, topic, sub_topic, probability, attempts, last_updated)
   UNIQUE (student_id, subject, topic, sub_topic)
   ```
   Note `sub_topic` is nullable. Aggregations must handle that.

Do not read or modify anything in the parallel WS B handoff scope (callAI / mastery cron / badges / FAQ — already shipped).

---

## Task 1 — Add `runCognitiveDiagnosis(studentId, subject)` to `handlers.js`

### Function contract

```js
/**
 * Produces the parent-facing diagnosis used by progress.html hero sentence.
 * Reads BKT mastery_levels with sub_topic granularity. Identifies the
 * weakest topic (and optionally its weakest sub_topic) and counts how many
 * downstream topics depend on it.
 *
 * @param {string} studentId  - students.id (uuid)
 * @param {string} subject    - 'mathematics' | 'science' | 'english'
 * @returns {Promise<{
 *   al_band: 'AL1'|'AL2'|'AL3'|'AL4'|'AL5'|'AL6'|'AL7'|'AL8'|null,
 *   weakest_topic: string|null,
 *   weakest_sub_topic: string|null,
 *   dependent_topic_count: number,
 *   hero_sentence: string
 * }>}
 */
async function runCognitiveDiagnosis(studentId, subject) { ... }
```

### Algorithm

1. **Fetch student name** from `students.name` (one row, by `studentId`). Used in hero sentence. If your column is `first_name` instead of `name`, use whichever exists.
2. **Fetch BKT state** from `mastery_levels` for `(student_id = studentId, subject = subject)`. Each row has `topic`, `sub_topic` (nullable), `probability`, `attempts`.
3. **Compute AL band** by reusing the existing AL-mapping logic already in `handlers.js` if one exists. If not, defer — `al_band` can be `null` for now and the hero sentence falls back gracefully. Do NOT invent a new AL-mapping algorithm in this commit.
4. **Find weakest topic:**
   - Group `mastery_levels` rows by `topic`. For each group, compute the **mean probability** weighted by `attempts`.
   - Filter out topics with total attempts < 3 across all sub_topics (avoids flagging a topic the student barely touched).
   - The weakest topic is the survivor with the lowest weighted mean probability.
   - If no topic qualifies, `weakest_topic = null` and the hero sentence uses an early-stage template.
5. **Find weakest sub_topic within the weakest topic:**
   - Among `mastery_levels` rows where `topic = weakest_topic` AND `sub_topic IS NOT NULL`, pick the one with the lowest `probability` AND `attempts >= 2`.
   - If no sub_topic qualifies, `weakest_sub_topic = null`. The hero sentence will reference the topic only.
6. **Count dependent topics:** read `SYLLABUS_DEPENDENCIES[subject]`, count how many other topics list `weakest_topic` in their `prerequisites` array. Direct dependents only — not transitively.
7. **Compose `hero_sentence`** (plain English, parent-facing, ≤ 24 words):

   - **Has data + weakest topic + weakest sub_topic + ≥ 1 dependent:**
     `${name} is at ${al_band} in ${SubjectDisplay} — focus on ${weakest_topic} (${weakest_sub_topic}) to unlock ${dependent_topic_count} dependent topic${s}.`

   - **Has data + weakest topic + weakest sub_topic + 0 dependents (leaf node):**
     `${name} is at ${al_band} in ${SubjectDisplay} — strengthen ${weakest_topic} (${weakest_sub_topic}) to lift overall mastery.`

   - **Has data + weakest topic + NO weakest sub_topic + ≥ 1 dependent:**
     `${name} is at ${al_band} in ${SubjectDisplay} — focus on ${weakest_topic} to unlock ${dependent_topic_count} dependent topic${s}.`

   - **Has data + weakest topic + NO weakest sub_topic + 0 dependents:**
     `${name} is at ${al_band} in ${SubjectDisplay} — strengthen ${weakest_topic} to lift overall mastery.`

   - **Has data, no qualifying weakest topic** (early-stage student):
     `${name} is at ${al_band} in ${SubjectDisplay} — keep practising to build a clearer picture.`

   - **No attempts yet:**
     `${name} hasn't attempted ${SubjectDisplay} yet — start with one quiz to begin diagnosis.`

   - **`al_band` is null but has attempts:** drop the AL clause:
     `${name} is making early progress in ${SubjectDisplay} — focus on ${weakest_topic} to unlock ${dependent_topic_count} dependent topic${s}.`

   `SubjectDisplay` = `'Mathematics' | 'Science' | 'English'`. `${s}` = `'s'` if count !== 1 else `''`.

### Honest Compass guardrail

The sentence describes the **current state**, not progress. Never inject "improving", "great work", "well done", "amazing", "keep up", or any positive-trend language. If `weakest_topic` is null, do not invent one. If `al_band` is null, do not say "AL8" or any band — use the alternate template.

### Where to put it

Add `runCognitiveDiagnosis` as a top-level `async function` in `handlers.js`, near `handleAnalyzeWeakness`. Export it via the existing `export` syntax (matching the file's existing convention) so it can be unit tested. Do **not** create a new file.

---

## Task 2 — Update `/api/analyze-weakness` response shape

Inside `handleAnalyzeWeakness(req, res)`:

1. After the existing weakness analysis logic runs (the existing function returns `{ identified_weakness, symptom_topic, mastery_score, ... }`), call `runCognitiveDiagnosis(studentId, subject)`.
2. Merge its 5 fields into the response object under a `diagnosis` key.
3. Keep all existing fields untouched. Frontend code that already consumes this endpoint must keep working.

**New response shape (additive, breaking nothing):**

```json
{
  "...existing fields...": "untouched",
  "diagnosis": {
    "al_band": "AL5",
    "weakest_topic": "Fractions",
    "weakest_sub_topic": "Equivalent Fractions",
    "dependent_topic_count": 4,
    "hero_sentence": "Lily is at AL5 in Mathematics — focus on Fractions (Equivalent Fractions) to unlock 4 dependent topics."
  }
}
```

`progress.js` reads `response.diagnosis.hero_sentence` directly — no string composition on the client.

---

## Task 3 — Add `GET /api/syllabus-tree` endpoint

### Why

The frontend dependency-tree component needs `SYLLABUS_DEPENDENCIES`. Two options were on the table:
1. Mirror file in `public/js/syllabus-dependencies.js` — adds drift risk.
2. New API endpoint — one round-trip per page load, no drift.

Option 2 won. The data is small (a few KB JSON), cacheable, and eliminates the entire drift surface.

### Handler

Add to `handlers.js`:

```js
import { SYLLABUS_DEPENDENCIES } from './quest-pedagogy.js';

export async function handleSyllabusTree(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Public endpoint — no auth required. The map is product knowledge,
  // not user data. Cacheable for a long time since it's build-time stable.
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  return res.status(200).json(SYLLABUS_DEPENDENCIES);
}
```

### Route registration

In `api/index.js`, add the route to the existing dispatch table:

```js
case '/api/syllabus-tree': return handleSyllabusTree(req, res);
```

(Match whatever pattern the file already uses — switch statement, object lookup, etc.)

---

## Task 4 — Add `GET /api/recent-attempts` endpoint

### Why

The Frontend Commit C heatmap modal opens on cell click and shows the last 5 question attempts for that `(topic, sub_topic)` cell. Without this endpoint, the modal would either need direct Supabase queries from the browser (risky for RLS edge cases) or ship with a TODO placeholder.

### Handler

```js
export async function handleRecentAttempts(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorised' });

    const urlParts = (req.url || '').split('?');
    const params = new URLSearchParams(urlParts[1] || '');
    const studentId = params.get('student_id');
    const topic     = params.get('topic');
    const subTopic  = params.get('sub_topic');  // may be empty string for null match
    const limit     = Math.min(parseInt(params.get('limit') || '5', 10), 20);

    if (!studentId || !topic) {
      return res.status(400).json({ error: 'Missing student_id or topic' });
    }

    const adminDb = getAdminClient();

    // Verify caller owns this student (RLS-equivalent check via parent_id)
    const { data: student } = await adminDb
      .from('students')
      .select('id, parent_id')
      .eq('id', studentId)
      .single();
    if (!student || student.parent_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Build query. sub_topic param empty string → match NULL.
    let query = adminDb
      .from('question_attempts')
      .select('id, question_text, correct, marks_earned, marks_total, answer_chosen, correct_answer, difficulty, created_at')
      .eq('student_id', studentId)
      .eq('topic', topic)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (subTopic === '' || subTopic === null) {
      query = query.is('sub_topic', null);
    } else if (subTopic) {
      query = query.eq('sub_topic', subTopic);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Aggregate stats over the same window for the modal header.
    // Use a wider window (last 50 attempts) so accuracy isn't computed
    // from just the 5 visible rows.
    let statsQuery = adminDb
      .from('question_attempts')
      .select('correct', { count: 'exact' })
      .eq('student_id', studentId)
      .eq('topic', topic)
      .order('created_at', { ascending: false })
      .limit(50);
    if (subTopic === '' || subTopic === null) statsQuery = statsQuery.is('sub_topic', null);
    else if (subTopic) statsQuery = statsQuery.eq('sub_topic', subTopic);

    const { data: statsRows, count: totalAttempts, error: statsErr } = await statsQuery;
    if (statsErr) throw statsErr;
    const correctCount = (statsRows || []).filter(r => r.correct).length;
    const accuracy = totalAttempts > 0 ? correctCount / Math.min(totalAttempts, 50) : null;

    // Fetch current mastery probability for this exact (topic, sub_topic)
    const { data: masteryRow } = await adminDb
      .from('mastery_levels')
      .select('probability, attempts')
      .eq('student_id', studentId)
      .eq('topic', topic)
      .filter('sub_topic', subTopic ? 'eq' : 'is', subTopic || null)
      .maybeSingle();

    return res.status(200).json({
      topic,
      sub_topic: subTopic || null,
      attempts: data || [],
      stats: {
        total_attempts: totalAttempts || 0,
        accuracy: accuracy,
        mastery_probability: masteryRow?.probability ?? null,
      },
    });
  } catch (err) {
    console.error('[recent-attempts] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch recent attempts' });
  }
}
```

Notes:
- The `mastery_levels` filter syntax `.filter('sub_topic', subTopic ? 'eq' : 'is', subTopic || null)` may need adjustment depending on the supabase-js version; if it doesn't work, fall back to two separate code branches calling `.eq()` or `.is()` explicitly.
- The stats query reads up to 50 rows to compute accuracy — this is a tradeoff. Reading every row would scale poorly for power users; capping at 50 gives a representative recent-window accuracy. If you want a true lifetime accuracy, replace with a SQL `count(*) FILTER (WHERE correct)` aggregate via RPC.

### Route registration

In `api/index.js`:

```js
case '/api/recent-attempts': return handleRecentAttempts(req, res);
```

---

## Task 5 — Replace `SYLLABUS_DEPENDENCIES` in `lib/api/quest-pedagogy.js`

The current map has 7 maths topics + 4 science topics, no English. Replace it wholesale with the version below — full P3–P6 coverage, all three subjects, English `(PSLE Paper 2)` suffix STRIPPED per Apr 2026 canon decision.

### Constraints

- Export shape stays exactly the same: `export const SYLLABUS_DEPENDENCIES = { mathematics: {...}, science: {...}, english: {...} }`.
- Each topic node has shape `{ prerequisites: string[], sub_topics: string[] }`.
- The map is a **DAG**, not a strict tree. Several topics (`Decimals`, `Fractions`) are prereqs to multiple downstream topics. The frontend renderer handles DAG → shared-node layout.
- **English sub_topics: NO `(PSLE Paper 2)` suffix.** Canon locked Apr 2026 — the strings below match the canonical writes that quiz.html / question generation will produce going forward.

### The map (paste verbatim)

```js
export const SYLLABUS_DEPENDENCIES = {
  mathematics: {
    "Whole Numbers": {
      prerequisites: [],
      sub_topics: [
        "Counting To One Hundred",
        "Number Notation And Place Values",
        "Comparing And Ordering Numbers",
        "Patterns In Number Sequences",
        "Rounding Numbers To The Nearest Ten, Hundred Or Thousand",
        "Order Of Operations",
        "Use Of Brackets"
      ]
    },
    "Multiplication Tables": {
      prerequisites: ["Whole Numbers"],
      sub_topics: [
        "Multiplication Tables Of Two, Three, Four, Five And Ten",
        "Multiplication Tables Of Six, Seven, Eight And Nine",
        "Mental Calculation Involving Multiplication Within Tables"
      ]
    },
    "Addition and Subtraction": {
      prerequisites: ["Whole Numbers"],
      sub_topics: [
        "Concepts Of Addition And Subtraction",
        "Addition And Subtraction Within One Hundred",
        "Addition And Subtraction Algorithms",
        "Mental Calculation Involving Addition And Subtraction"
      ]
    },
    "Multiplication and Division": {
      prerequisites: ["Multiplication Tables", "Addition and Subtraction"],
      sub_topics: [
        "Concepts Of Multiplication And Division",
        "Multiplication And Division Algorithms",
        "Division With Remainder",
        "Multiplying And Dividing By Ten, One Hundred And One Thousand",
        "Mental Calculation Involving Multiplication And Division"
      ]
    },
    "Fractions": {
      prerequisites: ["Whole Numbers", "Multiplication Tables", "Multiplication and Division"],
      sub_topics: [
        "Fraction As Part Of A Whole",
        "Equivalent Fractions",
        "Comparing And Ordering Fractions",
        "Mixed Numbers",
        "Improper Fractions",
        "Adding Unlike Fractions",
        "Subtracting Unlike Fractions",
        "Fractions Of A Set",
        "Fraction Multiplied By Fraction",
        "Division By A Proper Fraction"
      ]
    },
    "Decimals": {
      prerequisites: ["Whole Numbers", "Fractions"],
      sub_topics: [
        "Notation And Place Values Of Decimals",
        "Comparing And Ordering Decimals",
        "Converting Fractions To Decimals",
        "Converting Decimals To Fractions",
        "Rounding Decimals",
        "Four Operations With Decimals",
        "Multiplying And Dividing Decimals By Ten, One Hundred And One Thousand"
      ]
    },
    "Percentage": {
      prerequisites: ["Fractions", "Decimals"],
      sub_topics: [
        "Expressing Part Of A Whole As Percentage",
        "Finding Percentage Part Of A Whole",
        "Discount, Goods And Services Tax And Annual Interest",
        "Finding The Whole Given A Part And Percentage",
        "Percentage Increase And Decrease"
      ]
    },
    "Ratio": {
      prerequisites: ["Fractions", "Multiplication and Division"],
      sub_topics: [
        "Part-Whole Ratio",
        "Comparison Ratio",
        "Equivalent Ratios",
        "Expressing Ratio In Simplest Form",
        "Dividing A Quantity In A Given Ratio",
        "Ratio Of Three Quantities",
        "Relationship Between Fraction And Ratio",
        "Ratio Word Problems"
      ]
    },
    "Rate": {
      prerequisites: ["Whole Numbers", "Multiplication and Division"],
      sub_topics: [
        "Rate As Amount Of Quantity Per Unit",
        "Finding Rate, Total Amount Or Number Of Units"
      ]
    },
    "Speed": {
      prerequisites: ["Rate", "Decimals"],
      sub_topics: [
        "Concepts Of Speed",
        "Calculating Distance, Time And Speed",
        "Average Speed"
      ]
    },
    "Average": {
      prerequisites: ["Whole Numbers", "Addition and Subtraction", "Multiplication and Division"],
      sub_topics: [
        "Average As Total Value Divided By Number Of Data",
        "Relationship Between Average, Total Value And Number Of Data"
      ]
    },
    "Algebra": {
      prerequisites: ["Whole Numbers", "Fractions"],
      sub_topics: [
        "Using A Letter To Represent An Unknown Number",
        "Interpretation Of Algebraic Expressions",
        "Simplifying Linear Expressions",
        "Evaluating Linear Expressions By Substitution",
        "Solving Simple Linear Equations"
      ]
    },
    "Shapes and Patterns": {
      prerequisites: [],
      sub_topics: [
        "Identifying And Naming Two-Dimensional Shapes",
        "Classifying Three-Dimensional Shapes",
        "Making Patterns With Two-Dimensional Shapes"
      ]
    },
    "Geometry": {
      prerequisites: ["Shapes and Patterns"],
      sub_topics: [
        "Perpendicular And Parallel Lines",
        "Properties Of Rectangle And Square",
        "Properties Of Triangles",
        "Properties Of Parallelogram, Rhombus And Trapezium"
      ]
    },
    "Angles": {
      prerequisites: ["Geometry"],
      sub_topics: [
        "Concepts Of Angle",
        "Right Angles",
        "Measuring Angles In Degrees",
        "Drawing Angles",
        "Angles On A Straight Line",
        "Angles At A Point",
        "Vertically Opposite Angles",
        "Finding Unknown Angles"
      ]
    },
    "Symmetry": {
      prerequisites: ["Geometry"],
      sub_topics: [
        "Identifying Symmetric Figures",
        "Lines Of Symmetry",
        "Completing Symmetric Figures"
      ]
    },
    "Area and Perimeter": {
      prerequisites: ["Whole Numbers", "Multiplication and Division"],
      sub_topics: [
        "Concepts Of Area And Perimeter",
        "Area And Perimeter Of Rectangle And Square",
        "Finding One Dimension Given Area Or Perimeter",
        "Area And Perimeter Of Composite Rectilinear Figures"
      ]
    },
    "Area of Triangle": {
      prerequisites: ["Area and Perimeter", "Geometry"],
      sub_topics: [
        "Concepts Of Base And Height",
        "Calculating Area Of Triangle",
        "Area Of Composite Figures With Triangles"
      ]
    },
    "Circles": {
      prerequisites: ["Area and Perimeter", "Geometry", "Decimals"],
      sub_topics: [
        "Area And Circumference Of Circle",
        "Area And Perimeter Of Semicircle And Quarter Circle",
        "Area And Perimeter Of Composite Figures With Circles"
      ]
    },
    "Volume": {
      prerequisites: ["Whole Numbers", "Multiplication and Division", "Area and Perimeter"],
      sub_topics: [
        "Building Solids With Unit Cubes",
        "Measuring Volume In Cubic Units",
        "Volume Of Cube And Cuboid",
        "Finding Volume Of Liquid In Rectangular Tank",
        "Finding Unknown Dimension Given Volume"
      ]
    },
    "Factors and Multiples": {
      prerequisites: ["Whole Numbers", "Multiplication and Division"],
      sub_topics: [
        "Identifying Factors And Multiples",
        "Finding Common Factors",
        "Finding Common Multiples"
      ]
    },
    "Data Analysis": {
      prerequisites: ["Whole Numbers"],
      sub_topics: [
        "Reading Picture Graphs",
        "Reading Bar Graphs",
        "Reading Line Graphs",
        "Reading Tables"
      ]
    },
    "Pie Charts": {
      prerequisites: ["Fractions", "Percentage", "Data Analysis"],
      sub_topics: [
        "Reading And Interpreting Pie Charts",
        "Solving Problems Using Pie Chart Data"
      ]
    }
  },
  science: {
    "Diversity": {
      prerequisites: [],
      sub_topics: [
        "General Characteristics Of Living And Non-Living Things",
        "Classification Of Living And Non-Living Things",
        "Diversity Of Materials And Their Properties"
      ]
    },
    "Matter": {
      prerequisites: ["Diversity"],
      sub_topics: [
        "States Of Matter",
        "Properties Of Solids, Liquids And Gases",
        "Changes In State Of Matter"
      ]
    },
    "Systems": {
      prerequisites: ["Diversity"],
      sub_topics: [
        "Plant Parts And Functions",
        "Human Digestive System",
        "Plant Respiratory And Circulatory Systems",
        "Human Respiratory And Circulatory Systems",
        "Electrical Systems And Circuits"
      ]
    },
    "Cycles": {
      prerequisites: ["Diversity"],
      sub_topics: [
        "Life Cycles Of Insects",
        "Life Cycles Of Amphibians",
        "Life Cycles Of Flowering Plants",
        "Life Cycles Of Fungi",
        "Reproduction In Plants And Animals",
        "Stages Of The Water Cycle"
      ]
    },
    "Interactions": {
      prerequisites: ["Diversity", "Systems"],
      sub_topics: [
        "Interaction Of Magnetic Forces",
        "Interaction Of Frictional, Gravitational And Elastic Spring Forces",
        "Interactions Within The Environment",
        "Food Chains And Food Webs"
      ]
    },
    "Energy": {
      prerequisites: ["Diversity", "Matter"],
      sub_topics: [
        "Light Energy Forms And Uses",
        "Heat Energy Forms And Uses",
        "Photosynthesis And Energy Pathways",
        "Energy Conversion In Everyday Objects"
      ]
    },
    "Forces": {
      prerequisites: ["Interactions"],
      sub_topics: [
        "Push And Pull Forces",
        "Effects Of Forces On Objects",
        "Frictional Force And Its Applications",
        "Gravitational Force",
        "Elastic Spring Force"
      ]
    },
    "Heat": {
      prerequisites: ["Energy"],
      sub_topics: [
        "Sources Of Heat",
        "Effects Of Heat Gain And Heat Loss",
        "Temperature And Use Of Thermometers",
        "Good And Poor Conductors Of Heat"
      ]
    },
    "Light": {
      prerequisites: ["Energy"],
      sub_topics: [
        "Sources Of Light",
        "Reflection Of Light",
        "Formation Of Shadows",
        "Transparent, Translucent And Opaque Materials"
      ]
    },
    "Cells": {
      prerequisites: ["Systems"],
      sub_topics: [
        "Plant And Animal Cells",
        "Parts Of A Cell And Their Functions",
        "Cell Division"
      ]
    }
  },
  english: {
    "Grammar": {
      prerequisites: [],
      sub_topics: [
        "Simple Present And Past Tenses",
        "Perfect And Continuous Tenses",
        "Subject-Verb Agreement",
        "Singular And Plural Nouns",
        "Prepositions And Phrasal Verbs",
        "Conjunctions",
        "Active And Passive Voice",
        "Relative Pronouns"
      ]
    },
    "Vocabulary": {
      prerequisites: [],
      sub_topics: [
        "Thematic Vocabulary Recall",
        "Contextual Vocabulary Meaning",
        "Synonyms And Antonyms"
      ]
    },
    "Cloze": {
      prerequisites: ["Grammar", "Vocabulary"],
      sub_topics: [
        "Grammar Cloze With Word Bank",
        "Vocabulary Cloze With Dropdowns",
        "Comprehension Free-Text Cloze"
      ]
    },
    "Editing": {
      prerequisites: ["Grammar", "Vocabulary"],
      sub_topics: [
        "Correcting Spelling Errors",
        "Correcting Grammatical Errors"
      ]
    },
    "Comprehension": {
      prerequisites: ["Grammar", "Vocabulary"],
      sub_topics: [
        "Direct Visual Retrieval",
        "True Or False With Reason",
        "Pronoun Referent Table",
        "Sequencing Of Events",
        "Deep Inference And Claim Evidence Reasoning"
      ]
    },
    "Synthesis": {
      prerequisites: ["Grammar", "Vocabulary"],
      sub_topics: [
        "Combining With Conjunctions",
        "Relative Clauses",
        "Participle Phrases",
        "Conditional Sentences",
        "Reported Speech Transformation",
        "Active To Passive Voice Transformation",
        "Inversion"
      ]
    },
    "Summary Writing": {
      prerequisites: ["Comprehension", "Synthesis"],
      sub_topics: [
        "Identifying Key Information",
        "Paraphrasing And Condensing Text"
      ]
    }
  }
};
```

If `quest-pedagogy.js` already has other named exports (helpers consumed by Plan Quest), preserve them — only swap the `SYLLABUS_DEPENDENCIES` constant. Note the **inline `'Cloze'` references in the existing `handleAnalyzeWeakness`** function need the same canonical update — search for `'Grammar Cloze'` strings anywhere in the codebase and update.

---

## Verification (run before commit)

Use a real student account in the SG Supabase project. Pick or seed one with:
- ≥ 10 question_attempts in Mathematics
- A clearly weakest topic (mean probability < 0.5 across its sub_topics)
- At least 1 sub_topic with `attempts >= 2` under that topic

### Manual checks

1. **`/api/analyze-weakness`:**
   - Hit endpoint with student A's ID + `subject: 'mathematics'`. Confirm response includes `diagnosis` with all 5 fields.
   - Read the `hero_sentence`. It should:
     - Contain student's name verbatim.
     - Contain `Mathematics` (not `mathematics`).
     - Contain a real AL band (or skip the AL clause if the band can't be computed).
     - Contain a real topic name from `SYLLABUS_DEPENDENCIES.mathematics`.
     - Optionally contain a sub_topic in parentheses if data supports it.
     - Be ≤ 24 words.

2. **Cross-check `dependent_topic_count`:** open `quest-pedagogy.js`, manually count topics whose `prerequisites` contains the returned `weakest_topic`. Numbers must match.

3. **Empty-state path:** hit endpoint with a student that has zero attempts. `hero_sentence` must match the "hasn't attempted" template; `al_band`, `weakest_topic`, `weakest_sub_topic` all `null`.

4. **Leaf-topic path:** seed a student whose weakest topic is `Algebra` or `Pie Charts` (zero direct dependents). Confirm sentence uses "strengthen" template.

5. **`/api/syllabus-tree`:**
   - `curl https://www.superholiclab.com/api/syllabus-tree | jq` returns the full map.
   - Response includes `mathematics`, `science`, `english` keys.
   - English `Cloze.sub_topics[0]` is `"Grammar Cloze With Word Bank"` (NO `(PSLE Paper 2)` suffix).
   - Cache headers are present on the response.

6. **`/api/recent-attempts`:**
   - `GET /api/recent-attempts?student_id=<id>&topic=Fractions&sub_topic=Equivalent%20Fractions&limit=5` with valid Bearer token returns 5 recent attempts + stats.
   - Same call without auth returns 401.
   - Same call with another parent's student ID returns 403.
   - Empty `sub_topic` parameter matches NULL sub_topic rows correctly.
   - `stats.accuracy` is between 0 and 1, `stats.mastery_probability` is between 0 and 1 (or null if no row).

### Honest Compass red-flag check

Read the hero sentence aloud. If it contains: "improving", "great", "well done", "keep up", "amazing", "progress" — **stop and rewrite the template**. Diagnosis describes a current state, not a trend.

---

## Out of scope (do NOT touch)

- `/api/grade-answer`, `/api/chat`, `/api/generate-question`, `/api/generate-exam` — owned elsewhere or shipped in WS B.
- The `callAI()` wrapper, mastery snapshot cron, pedagogy badge seeds — done in WS B.
- Any frontend file (`progress.html`, `progress.js`, `style.css`) — owned by the parallel Website Design handoff.
- The `question_attempts` trigger — Diagnostic handoff owns this.
- AI question generation prompts — Topic Naming handoff owns canonical prompt updates.

---

## Commit message

```
feat(api): cognitive diagnosis + syllabus tree + recent attempts endpoints

- runCognitiveDiagnosis(studentId, subject) helper produces 5-field
  diagnosis (al_band, weakest_topic, weakest_sub_topic, dependent_topic_count,
  hero_sentence) for parent-facing progress page hero. Reads mastery_levels
  with sub_topic granularity.
- /api/analyze-weakness response now includes additive `diagnosis` block.
  All existing fields preserved.
- New /api/syllabus-tree endpoint returns SYLLABUS_DEPENDENCIES as JSON.
  Public, cacheable, eliminates frontend mirror-file drift risk.
- New /api/recent-attempts endpoint returns last N question attempts +
  aggregate stats for a (student, topic, sub_topic) tuple. Powers the
  heatmap modal in progress.html.
- SYLLABUS_DEPENDENCIES expanded to full P3-P6 coverage:
  23 maths topics, 10 science topics, 7 english topics. English sub_topic
  names use canonical strings (no PSLE Paper 2 suffix per Apr 2026 lock).
- Honest Compass preserved: hero sentence describes current state only,
  no trend language.

Pillar 2 (Analyse Weakness). Week 2 of LAUNCH_PLAN_v1.
```

Push to `main` only after all manual checks pass.