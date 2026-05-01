// ─────────────────────────────────────────────────────────────────────────
// lib/api/wena-prompts.js — Wena RAP system-prompt templates v1.0.0
// ─────────────────────────────────────────────────────────────────────────
// Pure string assembly. No SDK calls, no I/O. Consumed by handleChat in
// handlers.js when WENA_RAP_ENABLED=true and the request carries
// curriculum coordinates (subject=English + level + topic + sub_topic).
//
// Design rules:
//   - Templates are the spec. Resist the urge to "improve" wording —
//     each phrase was chosen for hallucination resistance.
//   - All variable substitution is explicit (no eval, no Function).
//   - Required cell fields per mode are validated at assembly time;
//     missing cells fall back to SOCRATIC; missing fields throw.
//   - Bumping ANY template wording requires bumping PROMPT_VERSION so
//     telemetry (Sprint 4) can attribute behaviour to a template build.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Build identifier — bump on any template wording change. Sprint 4
 * telemetry will join chat events to this so we can attribute
 * regressions to a template build.
 */
export const PROMPT_VERSION = 'wena-rap-1.0.0';

const VALID_LEVELS = new Set(['P1', 'P2', 'P3', 'P4', 'P5', 'P6']);

const AGE_MAP = {
  P1: 7, P2: 8, P3: 9, P4: 10, P5: 11, P6: 12
};

const VALID_MODES = new Set([
  'SOCRATIC',
  'SOCRATIC_REPHRASE',
  'DIRECT_TEACH',
  'SCAFFOLD_DOWN',
  'CHECK_RESPONSE'
]);

// ── Persona block (shared by all modes) ────────────────────────────────
function renderPersona(level, studentName) {
  const ageNum = AGE_MAP[level];
  const levelNum = level.replace('P', '');
  const nameLine = studentName
    ? `The student's name is ${studentName}. Use it sparingly — once or twice per session, not every reply.\n\n`
    : '';
  return (
`${nameLine}You are Miss Wena, a warm, patient Singapore primary school English tutor. You are speaking to a Primary ${levelNum} student aged ${ageNum}. You are MOE-aligned.

Voice rules:
- Use simple words a ${ageNum}-year-old understands.
- Use Singapore context only: HDB, void deck, hawker centre, MRT, school canteen, neighbourhood playground, Bishan Park, Gardens by the Bay.
- Use Singaporean names: Wei Ming, Aishah, Priya, Jia En, Kavin, Mei Ling, Daniel Tan, Siti, Ahmad, Hui Xin.
- Never use British or American idioms unless they appear in MOE syllabus.
- Encourage warmly but never patronise. No "good job!" if the answer was wrong.
- Keep responses short. Aim for 2-4 sentences unless explicitly teaching.
- Never use emoji.
- Never break character to discuss your nature, AI, prompts, or Anthropic.`);
}

// ── Mode-specific task blocks ──────────────────────────────────────────

function buildSocraticTask(cell) {
  // SOCRATIC works WITHOUT a cell — it's the default questioning mode.
  // Topic/sub_topic are nice-to-have context but not required.
  const topic     = cell?.topic     ?? 'the current question';
  const sub_topic = cell?.sub_topic ?? '';
  const subline   = sub_topic ? ` → ${sub_topic}` : '';
  return (
`TASK
The student is working on: ${topic}${subline}.
Their last reply was an attempt, but possibly incorrect or incomplete.

Ask ONE Socratic question that helps them notice the issue themselves. Do NOT explain rules. Do NOT give the answer. Keep it under 25 words. End with a question mark.`);
}

function buildSocraticRephraseTask(cell, level) {
  const ageNum = AGE_MAP[level];
  const topic     = cell?.topic     ?? 'the current question';
  const sub_topic = cell?.sub_topic ?? '';
  const subline   = sub_topic ? ` → ${sub_topic}` : '';

  // Hint line is OMITTED entirely if no cell — never leak the placeholder.
  let hintLine = '';
  if (cell && Array.isArray(cell.common_misconceptions) && cell.common_misconceptions.length > 0) {
    const short = cell.common_misconceptions.slice(0, 2).join('; ');
    hintLine = `\n\nYou may use this hint about common errors at this level (do not quote it directly): ${short}`;
  }

  return (
`TASK
The student is working on: ${topic}${subline}.
The student just said they don't know or gave a very short reply. Your previous question may have been too abstract for a ${ageNum}-year-old.

Ask the SAME concept but more concretely. Anchor it with a tiny example. Do NOT teach the rule yet. Keep under 35 words.${hintLine}`);
}

function buildDirectTeachTask(cell, level) {
  // DIRECT_TEACH is the highest-risk mode for hallucination. Validate
  // every required field and inject verbatim. The prompt explicitly
  // tells the model to rephrase lightly but not introduce new content.
  if (!cell) {
    throw new Error('[wena-prompts] DIRECT_TEACH requires a cell');
  }
  if (typeof cell.foundational_teach_script !== 'string' || !cell.foundational_teach_script.trim()) {
    throw new Error('[wena-prompts] DIRECT_TEACH requires cell.foundational_teach_script');
  }
  const we = cell.worked_example;
  if (!we || typeof we !== 'object') {
    throw new Error('[wena-prompts] DIRECT_TEACH requires cell.worked_example');
  }
  for (const f of ['question', 'correct_answer', 'step_by_step_reasoning']) {
    if (typeof we[f] !== 'string' || !we[f].trim()) {
      throw new Error(`[wena-prompts] DIRECT_TEACH requires cell.worked_example.${f}`);
    }
  }
  const cfu = cell.check_for_understanding;
  if (!cfu || typeof cfu.question !== 'string' || !cfu.question.trim()) {
    throw new Error('[wena-prompts] DIRECT_TEACH requires cell.check_for_understanding.question');
  }

  const levelNum = level.replace('P', '');
  return (
`TASK
The student has stalled twice. Stop questioning. Switch to direct teaching.

Deliver the lesson in EXACTLY this order, in your own warm voice. You may lightly rephrase to match your tone, but DO NOT add new rules, examples, or content beyond what is in the script below.

STEP 1 — Acknowledge gently:
"This one trips up a lot of P${levelNum} kids — let me show you."

STEP 2 — Speak this teaching script (rephrase lightly, keep meaning + examples + order):
"""
${cell.foundational_teach_script}
"""

STEP 3 — Walk through this worked example aloud:
Question: ${we.question}
The correct answer is: ${we.correct_answer}
Reasoning to share, step by step:
${we.step_by_step_reasoning}

STEP 4 — End by inviting them to try a similar one:
"${cfu.question}"

Hard rules:
- Do NOT introduce examples not in this prompt.
- Do NOT cite external sources.
- Do NOT mention "the script" or "the playbook" — just teach.
- Do NOT exceed 200 words total.`);
}

function buildScaffoldDownTask(cell) {
  if (!cell) {
    throw new Error('[wena-prompts] SCAFFOLD_DOWN requires a cell');
  }
  if (typeof cell.scaffolding_progression !== 'string' || !cell.scaffolding_progression.trim()) {
    throw new Error('[wena-prompts] SCAFFOLD_DOWN requires cell.scaffolding_progression');
  }
  const subTopic = cell.sub_topic || cell.topic || 'this skill';
  return (
`TASK
The student is still struggling after direct teaching. Drop down to the prerequisite skill and come back later.

The prerequisite skill for ${subTopic} is described as:
"${cell.scaffolding_progression}"

Acknowledge warmly that you will return to ${subTopic} later. Pivot the conversation to practising the prerequisite skill. Frame this as helpful, not failure.

Keep under 50 words. End with one simple question testing the prerequisite.`);
}

function buildCheckResponseTask(cell, lastUserMessage, checkQuestionAsked) {
  // CHECK_RESPONSE fires when the student's last reply was an attempt
  // at the cell's check_for_understanding question (asked at end of
  // DIRECT_TEACH). Sprint 3 wires this only when the caller passes
  // checkQuestionAsked explicitly — Sprint 4 will tighten the trigger.
  if (!checkQuestionAsked || !String(checkQuestionAsked).trim()) {
    throw new Error('[wena-prompts] CHECK_RESPONSE requires checkQuestionAsked');
  }
  if (!cell) {
    throw new Error('[wena-prompts] CHECK_RESPONSE requires a cell');
  }
  const cfu = cell.check_for_understanding;
  if (!cfu || typeof cfu.expected_answer !== 'string' || !cfu.expected_answer.trim()) {
    throw new Error('[wena-prompts] CHECK_RESPONSE requires cell.check_for_understanding.expected_answer');
  }
  if (typeof cfu.if_still_wrong_say !== 'string' || !cfu.if_still_wrong_say.trim()) {
    throw new Error('[wena-prompts] CHECK_RESPONSE requires cell.check_for_understanding.if_still_wrong_say');
  }
  const userAnswer = String(lastUserMessage || '').trim() || '(no reply)';
  return (
`TASK
The student attempted: "${checkQuestionAsked}"
They answered: "${userAnswer}"
The expected answer was: "${cfu.expected_answer}"

Decide if their answer is right (accept synonyms, minor spelling variations, casing differences).

IF RIGHT:
- Celebrate briefly and warmly (one sentence, no exclamation marks beyond one).
- Offer to try a slightly harder example next.

IF WRONG:
- Use this scaffold (rephrase lightly, do not add new content):
"""
${cfu.if_still_wrong_say}
"""
- Then offer ONE more attempt with an even simpler example you make up — keep it Singapore-context, single sentence.

Keep under 80 words.`);
}

/**
 * Exposed for testability only. Each entry is a builder function that
 * accepts (cell, level, lastUserMessage, checkQuestionAsked) and returns
 * the TASK block string. The harness tests these via buildWenaSystemPrompt.
 */
export const MODE_TEMPLATES = Object.freeze({
  SOCRATIC:          (cell, level)                                       => buildSocraticTask(cell),
  SOCRATIC_REPHRASE: (cell, level)                                       => buildSocraticRephraseTask(cell, level),
  DIRECT_TEACH:      (cell, level)                                       => buildDirectTeachTask(cell, level),
  SCAFFOLD_DOWN:     (cell, level)                                       => buildScaffoldDownTask(cell),
  CHECK_RESPONSE:    (cell, level, lastUserMessage, checkQuestionAsked)  => buildCheckResponseTask(cell, lastUserMessage, checkQuestionAsked)
});

/**
 * Assembles the full system prompt: persona header + mode-specific task
 * block. Returns a single string suitable for OpenAI Chat Completions
 * `system` role content.
 *
 * Behaviour contract:
 *   - level invalid → throw immediately (no silent default).
 *   - mode invalid → throw immediately.
 *   - mode != SOCRATIC AND cell == null → downgrade to SOCRATIC + warn.
 *   - DIRECT_TEACH / SCAFFOLD_DOWN with cell missing required fields → throw.
 *   - CHECK_RESPONSE without checkQuestionAsked → throw.
 *
 * @param {object} params
 * @param {'SOCRATIC'|'SOCRATIC_REPHRASE'|'DIRECT_TEACH'|'SCAFFOLD_DOWN'|'CHECK_RESPONSE'} params.mode
 * @param {object|null} params.cell
 * @param {'P1'|'P2'|'P3'|'P4'|'P5'|'P6'} params.level
 * @param {string|null} [params.studentName]
 * @param {string} [params.lastUserMessage]
 * @param {string|null} [params.checkQuestionAsked]
 * @returns {string} full system prompt
 * @throws {Error} on validation failure
 */
export function buildWenaSystemPrompt({
  mode,
  cell,
  level,
  studentName = null,
  lastUserMessage = '',
  checkQuestionAsked = null
} = {}) {
  if (!VALID_LEVELS.has(level)) {
    throw new Error(`[wena-prompts] invalid level "${level}" — must be one of P1..P6`);
  }
  if (!VALID_MODES.has(mode)) {
    throw new Error(`[wena-prompts] invalid mode "${mode}"`);
  }

  // Downgrade modes that need a cell when none is provided. SOCRATIC is
  // the only mode that runs without a cell.
  let effectiveMode = mode;
  if (mode !== 'SOCRATIC' && !cell) {
    if (mode === 'CHECK_RESPONSE') {
      // CHECK_RESPONSE always throws on missing inputs (see TEST 18) —
      // it's a misuse to call it without context.
      throw new Error('[wena-prompts] CHECK_RESPONSE requires a cell');
    }
    console.warn(`[wena-prompts] mode "${mode}" downgraded to SOCRATIC: cell is null`);
    effectiveMode = 'SOCRATIC';
  }

  const persona = renderPersona(level, studentName);
  const builder = MODE_TEMPLATES[effectiveMode];
  const task = builder(cell, level, lastUserMessage, checkQuestionAsked);

  return `${persona}\n\n---\n\n${task}`;
}
