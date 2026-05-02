# Type: `editing` (English)

> Loaded when `type = 'editing'`. Combine with `_base.md`, `_calibration.md`,
> and `canon/canon_taxonomy.md` before generating.

- `type`: "editing"
- `topic`: "Editing"
- `passage`: Continuous text. Errors MUST be single words (not phrases) wrapped in HTML `<u>` tags followed by the blank number. Example: "She <u>goed</u> [1] to the market."
- `blanks`: `[{"number": 1, "error_type": "grammar", "correct_answer": "went", "explanation": "Past tense of go."}]` (Note: `error_type` MUST be exactly "spelling" or "grammar").

**HARD RULES — VALIDATE BEFORE EMITTING (any violation = row will be rejected):**
1. **The underlined word MUST be wrong**: For every `<u>X</u> [N]` marker, `X` MUST be different from `blanks[N-1].correct_answer`. The whole point of the question is that the student spots and corrects an error — if the underlined word is already correct, there is no error to fix and the row is broken. Common bug: emitting `<u>vegetable</u>` paired with `correct_answer: "vegetable"`. Check every blank.
2. **`correct_answer` must be the proper fix**: It should be a real word that produces a grammatically correct sentence when substituted for `X`. Don't substitute one error for another.
3. **Marker count consistency**: The number of `<u>...</u> [N]` markers in `passage` MUST equal `blanks.length`, with consecutive `[N]` numbers from `[1]` upward and no skipped numbers.
4. **`error_type` precision**:
   - `"spelling"` ONLY when the only difference between underlined and correct is letter-level (e.g., `definately` → `definitely`, `seperate` → `separate`).
   - `"grammar"` for tense, agreement, preposition, word-class, relative-pronoun, quantifier, infinitive-after-`to`, etc.
   - Never use any other value.
5. **No exact-duplicate rows**: Before emitting, check that the same passage hasn't been generated under another UUID.

**DIFFICULTY CALIBRATION & SCOPE (Strictly follow based on `level`):**
- **Primary 3 & 4 (Lower Block):**
  * *Passage:* 60-90 words. Generate EXACTLY 6 blanks (balanced evenly between spelling and grammar).
  * *Grammar Scope:* Simple present/past tense, basic subject-verb agreement, singular/plural nouns, and simple prepositions.
  * *Spelling Scope:* Common sight words, basic phonics (e.g., double consonants, dropping 'e').
- **Primary 5 & 6 (Upper Block):**
  * *Passage:* 120-180 words. Generate EXACTLY 10 blanks (balanced evenly between spelling and grammar).
  * *Grammar Scope:* Perfect/continuous tenses, passive voice, complex subject-verb agreement, and relative pronouns.
  * *Spelling Scope:* Advanced vocabulary, multi-syllabic words, and tricky prefixes/suffixes.
