# Type: `cloze` (English)

> Loaded when `type = 'cloze'`. Combine with `_base.md`, `_calibration.md`,
> and `canon/canon_taxonomy.md` before generating.

For all cloze formats, `topic` MUST be "Cloze". You MUST specify the `sub_topic` as "Grammar Cloze With Word Bank", "Vocabulary Cloze With Dropdowns", or "Comprehension Free-Text Cloze". The `passage` must contain embedded blanks like `[1]`, `[2]`.

**HARD RULES — VALIDATE BEFORE EMITTING (any violation = row will be rejected):**
1. **`correct_answer` must exist verbatim in `options`**: For every blank `b`, `b.correct_answer` MUST exactly equal one of the strings in `b.options` (case + whitespace match). The student selects from `options`, so an answer not in the list is unanswerable. Common bug: emitting `"throughout"` when options only contain `"through"`, or capitalising `"Without"` when options are all lowercase. STOP and check every blank before returning.
2. **Word-bank uniqueness (Grammar sub-topic only)**: Within a single cloze row, no two blanks may share the same `correct_answer`. The shared word bank is sized so each correct word is used EXACTLY once across all blanks. If your passage logically requires the same word twice, rewrite the passage.
3. **Number of `[N]` markers in passage must equal `blanks.length`**: Count both. Renumber from 1 if you removed a blank.
4. **Distractors must be plausible**: For Vocabulary dropdowns, the 3 wrong options must be the same part of speech and roughly the same level as the correct answer. No nonsense distractors.

**SUB-TOPIC: Grammar (Shared Word Bank)**
- `blanks` rules: You must create a shared Word Bank (Correct Answers + Distractors). You MUST inject this exact same full array into the `options` key of **every single blank**.
- *Primary 1 & 2:* Passage: 40-60 words. Blanks: 6. Word Bank: Total blanks + 2 distractors. Focus: Basic pronouns (he, she, it) and singular/plural nouns.
- *Primary 3 & 4:* Passage: 60-100 words. Blanks: 8. Word Bank: Total blanks + 2 distractors. Focus: Prepositions (in, on, at), conjunctions (but, although), phrasal verbs.
- *Primary 5 & 6:* Passage: 150-200 words. Blanks: EXACTLY 10. Word Bank: 12-15 words total. Focus: Advanced grammar, tenses, nuances (who vs whom, since vs for).
- *Format:* `[{"number": 1, "options": ["is", "are", "was", "were", ...all words], "correct_answer": "is", "explanation": "..."}]`

**SUB-TOPIC: Vocabulary (Localized Dropdowns)**
- `blanks` rules: Provide EXACTLY 4 specific options per blank to create inline dropdowns. (Digital Adaptation: While lower primary uses word banks in school, our platform uses localized dropdowns for a cleaner UI).
- *Primary 1 & 2:* Passage: 40-60 words. Blanks: 3. Focus: Simple thematic words (e.g., feelings, actions, "At the Zoo").
- *Primary 3 & 4:* Passage: 60-100 words. Blanks: 4. Focus: Standard vocabulary in a continuous story context.
- *Primary 5 & 6:* Passage: 120-150 words. Blanks: EXACTLY 5. Focus: SEAB Booklet A format. Advanced vocabulary; students pick the closest meaning for the context.
- *Format:* `[{"number": 1, "options": ["scurried", "strolled", "sprinted", "meandered"], "correct_answer": "sprinted", "explanation": "..."}]`

**SUB-TOPIC: Comprehension (Free-Text Typing)**
- `blanks` rules: You MUST entirely OMIT the `options` key. This forces a free-text input box. (Digital Adaptation: To build rigor, all levels use free-text, but lower levels use highly predictable context clues).
- *Primary 1 & 2:* Passage: 50-80 words. Blanks: 5. Focus: Basic story sequence and highly predictable, everyday sight words.
- *Primary 3 & 4:* Passage: 100-150 words. Blanks: 8. Focus: Transitioning to independent word recall using clear context clues.
- *Primary 5 & 6:* Passage: 200-250 words. Blanks: EXACTLY 15. Focus: SEAB Booklet B standard. Rely heavily on contextual clues, collocations, and logic. No word bank.
- *Format:* `[{"number": 1, "correct_answer": "because", "accept_also": ["as", "since"], "explanation": "..."}]`

**Cloze sub_topic mapping** (engine UI router):

When `topic = "Cloze"`, the canonical `sub_topic` controls UI behavior in `quiz.js`:

| `sub_topic` | UI behavior |
|-------------|------------|
| `Grammar Cloze With Word Bank` | Shared word-bank UI; same array injected into every blank's `options` field |
| `Vocabulary Cloze With Dropdowns` | Localized 4-option dropdowns per blank |
| `Comprehension Free-Text Cloze` | Free-text input boxes (omit the `options` key on each blank) |
