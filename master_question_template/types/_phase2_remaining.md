# Phase 2 Pending — Combined File for 4 Un-Hardened Types

> Loaded when `type` ∈ {`short_ans`, `word_problem`, `comprehension`, `visual_text`}.
> These four types live together in this single file pending Phase 2 of the
> migration, where each will be split out into its own type file with hard rules.
> Rules below are unchanged from the v5.0 monolith; no Phase 1 hardening applied.

═══════════════════════════════════════════════════════════════
TYPE: `short_ans` (Mathematics vs. English Synthesis)
═══════════════════════════════════════════════════════════════
This type behaves differently depending on the Subject.

**FOR MATHEMATICS:**
- `topic`: standard Math topic.
- `correct_answer`: A numerical or short string (e.g., "45" or "1/2").
- `accept_also`: `["0.5"]` (Alternative correct formats).
- `instructions`: `null`

**FOR ENGLISH (SYNTHESIS):**
- `topic`: MUST be "Synthesis"
- `question_text`: This column must contain ONLY the original sentences. DO NOT add `<br><br>`, blank lines, or the connector word here. Just the raw sentences.
- `correct_answer`: Grammatically perfect complete sentence (with full stop).
- `worked_solution`: You must provide a step-by-step logical breakdown. The final step **MUST ALWAYS BE STEP 3**, and it must explicitly state the final answer.
- `instructions`: You MUST provide the specific instruction with the connector/starter word wrapped in EXACT single quotes `''` to trigger the frontend UI engine. Do NOT use generic boilerplate.
   - *Mode 1 (Start):* "Rewrite the sentence beginning with the word ''Despite''."
   - *Mode 2 (Middle):* "Combine the sentences using the phrase ''... even though ...''." (DO NOT use brackets like `(whose)`. Always use dots).
   - *Mode 3 (End):* "Combine the sentences using the word ''... respectively.''."

═══════════════════════════════════════════════════════════════
TYPE: `word_problem` (Mathematics)
═══════════════════════════════════════════════════════════════
Used for Paper 2 structured multi-part problems.

**Required Fields:**
- `type`: "word_problem"
- `question_text`: The main scenario.
- `parts`: Stringified JSON array containing the sub-questions.
  `[{"label": "(a)", "marks": 2, "question": "...", "correct_answer": "...", "worked_solution": "..."}]`

═══════════════════════════════════════════════════════════════
TYPE: `comprehension` (English)
═══════════════════════════════════════════════════════════════
A Split-Screen format used for Comprehension Open-Ended (and sometimes Comprehension MCQ). The left pane contains the text, and the right pane contains a `parts` array of sub-questions.

**Required Fields:**
- `type`: "comprehension"
- `topic`: "Comprehension"
- `passage`: The story/text. You MUST use `<br><br>` for paragraph breaks. DO NOT use `\n`.
- `parts`: Stringified JSON array of sub-questions. 

**PERMITTED `part_type` VALUES:**
1. `mcq`: Provide `options` (array of 4 strings) and `correct_answer`.
2. `text_box`: Provide `model_answer` and `rubric`.
3. `true_false`: Must include an `items` array. Each item needs `statement`, `correct_answer` ("True"/"False"), and `reason_evidence`.
4. `referent`: Table matching a pronoun to its subject. `items` array with `word` (e.g., "It (paragraph 2)") and `correct_answer`.
5. `sequencing`: Ordering events. `items` array of 3 string events. `correct_order` array (e.g., `[3, 1, 2]`).

**DIFFICULTY CALIBRATION & SCOPE (Strictly follow based on `level`):**

* **Primary 1 & 2 (Lower Block):**
    * *Passage:* 80-120 words. Simple narrative.
    * *Structure:* 5 marks total. Exactly 5 sub-questions (1 mark each).
    * *Part Types:* Mostly `mcq` to build confidence, ending with 1 or 2 simple `text_box` retrieval questions (e.g., "Where did Tom go?"). Do NOT use referent or sequencing.
* **Primary 3 & 4 (Middle Block):**
    * *Passage:* 150-250 words. Introduced to descriptive paragraphs.
    * *Structure (EOY):* 16 marks total.
    * *Part Types:* `mcq`, `text_box` (direct retrieval and basic inference). Introduce basic `true_false` tables (without the reason column).
* **Primary 5 & 6 (Upper Block / PSLE SEAB Code 0001):**
    * *Passage:* 350-450 words. Complex narrative with emotional beats, dialogue, and advanced vocabulary (e.g., *palpable, meticulously*).
    * *Structure:* Exactly 20 marks. Usually 8 to 10 sub-questions.
    * *Part Types Required:* You MUST include a diverse mix to hit 20 marks:
        - 1x `text_box` asking for a specific vocabulary word (1m).
        - 1x `referent` table (2 items, 2m).
        - 1x `sequencing` (3 items, 1m).
        - 1x `true_false` table WITH the `reason_evidence` column required (3 items, 3m).
        - Remaining marks distributed across 2m and 3m `text_box` questions requiring deep inference and the CER (Claim, Evidence, Reasoning) framework in the rubric.

═══════════════════════════════════════════════════════════════
TYPE: `visual_text` (English)
═══════════════════════════════════════════════════════════════
A sub-type of comprehension used for Section A of Paper 2. A Split-Screen format where the left pane displays a flyer/poster and the right pane contains MCQs.

**Required Fields:**
- `type`: "visual_text"
- `topic`: "Comprehension"
- `passage`: MUST BE `null`. (The text is inside the image).
- `image_url`: point to data/images/image_XXX.png`. (The developer will generate this later).
- `examiner_note`: **IMAGE PROMPT GENERATION:** You MUST write a highly detailed text-to-image prompt so the developer can generate the flyer using an AI image generator. Prefix it with `IMAGE PROMPT: `. 
  *(Example: "IMAGE PROMPT: A colourful flyer for a baking competition. Main header reads 'SG Junior Bakers'. Includes a box saying 'Free Registration' and a footnote with an asterisk saying 'Tools not provided'.")*
- `question_text`: "Study the visual text carefully and answer the following questions."
- `parts`: Stringified JSON array. ALL parts MUST be `part_type`: "mcq".

**DIFFICULTY CALIBRATION & SCOPE (Strictly follow based on `level`):**

* **Primary 1 & 2:**
    * *Structure:* 3 to 4 marks (3-4 MCQs, 1m each).
    * *Focus:* Direct visual retrieval. "What time does the party start?", "Where is the event?".
* **Primary 3 & 4:**
    * *Structure:* 5 marks (5 MCQs, 1m each).
    * *Focus:* Retrieving details from different sections of the flyer, basic purpose of the flyer.
* **Primary 5 & 6 (PSLE SEAB Code 0001):**
    * *Structure:* 5 marks (Booklet A standard) or 8 marks (School EOY standard). All 1m each.
    * *Focus:* Deep inference. Why was an asterisk (*) used? Who is the target audience? What is the *main* purpose of the event? Which statement is True/False based on the fine print?

**Visual Text sub_topic mapping** (Comprehension router):

When `topic = "Comprehension"` AND `sub_topic` matches Visual Text variants, render with `type = "visual_text"`:

| `sub_topic` | UI behavior |
|-------------|------------|
| `Visual Text Literal Retrieval` | P5+ only. Image-anchored MCQs/short-answer; literal info read-off from poster, infographic, or notice. |
| `Visual Text Inference And Purpose` | P5+ only. Inference about audience, purpose, tone of the visual text. |
