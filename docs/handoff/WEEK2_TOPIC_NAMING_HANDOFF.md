# Week 2 — Topic Naming Standardization Handoff

**Sprint:** Week 2 prep (small, surgical, ships before Week 2 Frontend Commit C)
**Stream:** Backend & Admin (small frontend touch in `quiz.js`)
**Estimated time:** 1.5 hours
**Blocking:** Week 2 Frontend Commit C (heatmap). Does NOT block Frontend Commits A, B, D.
**Depends on:** Diagnostic handoff must be done — `question_attempts` must be writing again before this work is meaningful.

---

## Problem

`SYLLABUS_DEPENDENCIES` (the canonical map driving the dependency tree, hero sentence, and heatmap) has specific topic and sub_topic names. Existing code writes drift values that don't match:

| What the code writes today | What `SYLLABUS_DEPENDENCIES` says |
|---|---|
| `topic = "Grammar Cloze"` | `topic = "Cloze"`, `sub_topic = "Grammar Cloze With Word Bank"` |
| `topic = "Editing"` (with no sub_topic) | `topic = "Editing"`, `sub_topic = "Correcting Spelling Errors"` or `"Correcting Grammatical Errors"` |
| `sub_topic = "Grammar"` (legacy) | Deprecated. Use full canonical name. |

Result: heatmap rows for English Cloze will be empty, the dependency tree node `Cloze` will show no mastery data, and the hero sentence's "weakest topic" detection breaks for English students.

This handoff makes **fix-forward** writes canonical. Historical rows are not retroactively corrected — the Backfill handoff handles that.

---

## Canonical topic and sub_topic strings (locked)

The canonical map is the JSON in the **Backend handoff** (revised). For convenience, English-specific canon below — these are the strings every write path must produce going forward.

### English (most-affected subject)

| Topic | Sub_topics (canonical strings) |
|---|---|
| `Grammar` | `Simple Present And Past Tenses`, `Perfect And Continuous Tenses`, `Subject-Verb Agreement`, `Singular And Plural Nouns`, `Prepositions And Phrasal Verbs`, `Conjunctions`, `Active And Passive Voice`, `Relative Pronouns` |
| `Vocabulary` | `Thematic Vocabulary Recall`, `Contextual Vocabulary Meaning`, `Synonyms And Antonyms` |
| `Cloze` | `Grammar Cloze With Word Bank`, `Vocabulary Cloze With Dropdowns`, `Comprehension Free-Text Cloze` |
| `Editing` | `Correcting Spelling Errors`, `Correcting Grammatical Errors` |
| `Comprehension` | `Direct Visual Retrieval`, `True Or False With Reason`, `Pronoun Referent Table`, `Sequencing Of Events`, `Deep Inference And Claim Evidence Reasoning` |
| `Synthesis` | `Combining With Conjunctions`, `Relative Clauses`, `Participle Phrases`, `Conditional Sentences`, `Reported Speech Transformation`, `Active To Passive Voice Transformation`, `Inversion` |
| `Summary Writing` | `Identifying Key Information`, `Paraphrasing And Condensing Text` |

**Important:** No `(PSLE Paper 2)` suffix on sub_topic. Decision locked Apr 2026 — earlier project memory had the suffix; that has been replaced. Final canon is the names above.

### Maths and Science

Use the topic and sub_topic strings in `lib/api/quest-pedagogy.js` `SYLLABUS_DEPENDENCIES` exactly as they appear there. Examples:

- Maths: topic `"Fractions"`, sub_topics include `"Equivalent Fractions"`, `"Adding Unlike Fractions"`, etc.
- Science: topic `"Matter"`, sub_topics include `"States Of Matter"`, `"Properties Of Solids, Liquids And Gases"`, `"Changes In State Of Matter"`.

---

## Audit and fix scope

### Pre-flight reading

1. `lib/api/quest-pedagogy.js` after Backend handoff lands — this is the source of truth for canonical strings.
2. `public/js/quiz.js` — the write path that puts `topic` and `sub_topic` into `question_attempts`.
3. `lib/api/handlers.js` — the question generation prompts that decide what `topic` and `sub_topic` get written into `question_bank`.
4. `migrations/` — any seed SQL that pre-populates `question_bank` with topic/sub_topic strings.
5. `public/js/progress.js` — anywhere it filters or maps on `topic` / `sub_topic` strings.

### Files to audit and update

For each file below, run grep, document each match in PR description, fix to canonical string.

#### A. `public/js/quiz.js`

The most important file. After the Diagnostic handoff lands, `quiz.js` writes `topic` and `sub_topic` from `q.topic` and `q.sub_topic` (the question record from `question_bank`). So `quiz.js` itself doesn't need string changes — it just propagates whatever `question_bank` rows have.

**However:** check the fallback in the existing code:

```js
const safeTopic = String(q.topic || state.dbTopic || 'Mixed') || 'Mixed';
```

The `'Mixed'` fallback is a non-canonical string. Replace with `'Unknown'` and add a `console.error` log so any question with missing topic gets surfaced rather than silently classed as 'Mixed':

```js
let safeTopic = String(q.topic || state.dbTopic || '').trim();
if (!safeTopic) {
  console.error('[quiz.js] Question missing topic — quizQuestionId:', q.id);
  safeTopic = 'Unknown';
}
```

Same treatment for `sub_topic` in the payload — leave `null` if missing (acceptable per schema), but log:

```js
if (!q.sub_topic) {
  console.warn('[quiz.js] Question missing sub_topic — quizQuestionId:', q.id, 'topic:', safeTopic);
}
```

That's it for `quiz.js`. The bigger fix is upstream — making sure `question_bank` rows have canonical topic and sub_topic strings to begin with.

#### B. `lib/api/handlers.js` — question generation prompts

In `buildGenerateUserPrompt` and the `GQ_SAFETY_PROMPT` / `buildGQSchemaInstructions`:

1. Add an explicit instruction that `topic` MUST be one of the canonical topic names from `SYLLABUS_DEPENDENCIES[subject]`.
2. Add an explicit instruction that `sub_topic` MUST be one of the canonical sub_topic strings under that topic.
3. Provide the canonical map inline in the prompt as a JSON snippet (or reference the file path so the model "knows" what's valid).
4. Add a server-side validator after the OpenAI call returns: drop any question whose `topic` or `sub_topic` doesn't match canon. Log dropped questions for visibility.

Example validator:

```js
const { SYLLABUS_DEPENDENCIES } = require('./quest-pedagogy');

function validateTopicCanon(question) {
  const subjectKey = question.subject?.toLowerCase();
  const subjectMap = SYLLABUS_DEPENDENCIES[subjectKey];
  if (!subjectMap) {
    console.warn('[validateTopicCanon] Unknown subject:', question.subject);
    return false;
  }
  const topicNode = subjectMap[question.topic];
  if (!topicNode) {
    console.warn('[validateTopicCanon] Non-canonical topic:', question.topic, 'for subject:', subjectKey);
    return false;
  }
  if (question.sub_topic && !topicNode.sub_topics.includes(question.sub_topic)) {
    console.warn('[validateTopicCanon] Non-canonical sub_topic:', question.sub_topic, 'for topic:', question.topic);
    return false;
  }
  return true;
}

// In handleGenerateQuestion, after parseJsonArray(responseText):
const questions = parseJsonArray(responseText)
  .filter(q => { try { return validateGQQuestion(q); } catch { return false; } })
  .filter(validateTopicCanon)  // NEW
  .map(q => ({ ...q, source: 'ai', aiProvider: provider }));
```

#### C. Seed SQL in `migrations/`

Grep all migration files for INSERTs into `question_bank`:

```bash
cd D:/Git/Superholic-Lab
grep -rn "INSERT INTO.*question_bank" migrations/
```

For each match:
- If the `topic` column value is non-canonical (e.g. `'Grammar Cloze'`), document it.
- If the `sub_topic` column value is non-canonical or missing, document it.

**Do not write a backfill migration here.** The Backfill handoff covers historical row enrichment via OpenAI. This handoff only fixes what gets written going forward — so if a seed migration writes legacy strings and that migration is going to be re-run on a fresh project (e.g. new dev env, staging clone), update the seed migration in place. If it's already been applied to production and won't be re-run, leave it and rely on Backfill.

#### D. `public/js/progress.js` — filter / map logic

Grep for `topic ===`, `topic ==`, `topic.includes`, `sub_topic` literal string comparisons:

```bash
grep -nE "topic\s*[!=]==?\s*['\"]" public/js/progress.js
grep -nE "sub_topic\s*[!=]==?\s*['\"]" public/js/progress.js
```

For each match against a string literal, verify the literal matches the canonical string. Most likely candidates: any hard-coded English topic/sub_topic strings used for display tweaks. Update to canonical.

#### E. Other places to check

- `public/js/dashboard.html` / `dashboard.js` — backpack categorization
- `pages/exam.html` / `exam.js` — exam template topic strings
- `lib/api/quest-pedagogy.js` itself — any helper that compares topic strings (after Backend handoff updates the map, the helpers should still work, but verify)
- `api/chat.js` — Miss Wena system prompts that mention specific topics

For each, grep for hard-coded topic strings, replace with canonical.

---

## Verification

### 1. New attempts use canonical strings

After deploying both Diagnostic + this handoff, run a fresh quiz on `quiz.html` for English Cloze. Confirm in Supabase:

```sql
SELECT topic, sub_topic, count(*)
FROM public.question_attempts
WHERE created_at > now() - interval '10 minutes'
GROUP BY topic, sub_topic;
```

Expected: rows with `topic = 'Cloze'` and `sub_topic = 'Grammar Cloze With Word Bank'` (or similar canonical strings). NOT `topic = 'Grammar Cloze'`.

If you see a non-canonical topic/sub_topic in a fresh row, the upstream `question_bank` row that was served still has legacy strings. Either:
- The question is from a pre-existing legacy row (will be fixed by Backfill).
- The question generator is still producing legacy strings (means `validateTopicCanon` isn't filtering — debug the validator).

### 2. New AI-generated questions are canonical

Trigger one round of question generation through the existing flow (admin panel or `/api/generate-question`). Inspect the new rows in `question_bank`:

```sql
SELECT id, subject, topic, sub_topic, created_at
FROM public.question_bank
WHERE created_at > now() - interval '10 minutes'
  AND is_ai_cloned = true
ORDER BY created_at DESC
LIMIT 10;
```

Every row should have a canonical `topic` and `sub_topic`. Cross-check against `SYLLABUS_DEPENDENCIES`.

### 3. Validator drops non-canonical AI output

Temporarily lower the OpenAI temperature, generate 5 questions, expect ~5 to land. If the validator is too strict (drops everything), the prompt isn't communicating the canon clearly enough — improve the prompt with a clearer example block, not by relaxing the validator.

### 4. Heatmap renders correctly for new English data

Once Frontend Commit C lands, generate enough fresh English attempts (5+ per topic) for a test student, then load `progress.html`. The English Cloze row in the heatmap should now show populated cells under the three canonical sub_topic columns. If cells are blank, either (a) the fresh attempts have non-canonical strings (this handoff failed) or (b) the heatmap query filter has a typo (Frontend Commit C bug).

---

## Out of scope

- **Historical row repair.** Existing rows in `question_bank` and `question_attempts` with legacy strings stay legacy in this handoff. Backfill handoff covers this.
- **`mastery_levels` cleanup.** Existing rows that reference legacy topic/sub_topic strings (e.g. `('Cloze', 'Grammar')` from earlier writes) won't conflict with new canonical rows because the unique key includes sub_topic — they'll just sit alongside as orphans. The Backfill handoff has an optional cleanup step to merge or delete these.
- **Renaming the `dbTopic` state variable in `quiz.js`.** Cosmetic. Skip.

---

## Commit message

```
chore(canon): standardize topic and sub_topic strings to SYLLABUS_DEPENDENCIES

- Add validateTopicCanon() server-side validator in handlers.js. Any
  AI-generated question whose topic/sub_topic doesn't match canon is
  dropped before insert into question_bank.
- Update generation prompts in handlers.js to enumerate canonical names
  per subject inline.
- quiz.js: replace 'Mixed' fallback with logged 'Unknown' to surface
  questions missing topic data.
- progress.js / dashboard.js / exam.js: replace hard-coded legacy topic
  strings with canonical ones (full list in PR description).

English canon (no PSLE Paper 2 suffix anywhere):
- topic="Cloze", sub_topic="Grammar Cloze With Word Bank" (etc.)

Historical rows not touched. Backfill handoff handles enrichment of
existing question_bank and question_attempts rows.
```