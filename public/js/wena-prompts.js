// ─────────────────────────────────────────────────────────────────────────
// /js/wena-prompts.js — Wena RAP system-prompt templates v1.1.0 (Sprint 7)
// ─────────────────────────────────────────────────────────────────────────
// Pure string assembly. No SDK calls, no I/O.
//
// Sprint 7 additions:
//   - Science persona addendum (CER framework framing)
//   - Three CER probe modes (CER_PROBE_CLAIM / EVIDENCE / REASONING)
//   - Subject-aware DIRECT_TEACH (CER-labelled worked example for Science)
//   - Subject-aware CHECK_RESPONSE (3-part check + partial-credit logic)
//   - PROMPT_VERSION bumped to wena-rap-1.1.0
//
// Design rules (unchanged from Sprint 3):
//   - Templates are the spec. Resist "improvements" — wording is chosen
//     for hallucination resistance.
//   - All variable substitution is explicit (no eval, no Function).
//   - Required cell fields validated at assembly time.
//   - Bumping ANY template wording requires bumping PROMPT_VERSION so
//     telemetry can attribute behaviour to a template build.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Build identifier — bumped on any template wording change. Sprint 4
 * telemetry joins chat events to this so we can attribute regressions to
 * a template build. v1.1.0 introduces Science + CER probe modes.
 */
export const PROMPT_VERSION = 'wena-rap-1.1.0';

const VALID_LEVELS = new Set(['P1', 'P2', 'P3', 'P4', 'P5', 'P6']);

const AGE_MAP = {
  P1: 7, P2: 8, P3: 9, P4: 10, P5: 11, P6: 12
};

const VALID_MODES = new Set([
  'SOCRATIC',
  'SOCRATIC_REPHRASE',
  'DIRECT_TEACH',
  'SCAFFOLD_DOWN',
  'CHECK_RESPONSE',
  'CER_PROBE_CLAIM',
  'CER_PROBE_EVIDENCE',
  'CER_PROBE_REASONING'
]);

const NAMED_CER_LEVELS = new Set(['P5', 'P6']);

// ── Subject-specific persona addendum (Sprint 7) ──────────────────────
const SCIENCE_PERSONA_ADDENDUM = `

Subject voice for Science:
- You are coaching the CER move: Claim, Evidence, Reasoning.
- For P3-P4 students, narrate CER without naming it ("first say what you think, then say what you saw, then say WHY using a science rule").
- For P5-P6 students, name CER explicitly ("the CER move: Claim → Evidence → Reasoning").
- Always link evidence to a concrete observation from the question or scenario.
- Always link reasoning to a general scientific principle the student knows.`;

// ── Persona block (shared by all modes; Science gets an addendum) ──────
function renderPersona(level, studentName, subject) {
  const ageNum = AGE_MAP[level];
  const levelNum = level.replace('P', '');
  const nameLine = studentName
    ? `The student's name is ${studentName}. Use it sparingly — once or twice per session, not every reply.\n\n`
    : '';
  const subjectLabel = subject === 'Science' ? 'English and Science' : 'English';
  const base =
`${nameLine}You are Miss Wena, a warm, patient Singapore primary school ${subjectLabel} tutor. You are speaking to a Primary ${levelNum} student aged ${ageNum}. You are MOE-aligned.

Voice rules:
- Use simple words a ${ageNum}-year-old understands.
- Use Singapore context only: HDB, void deck, hawker centre, MRT, school canteen, neighbourhood playground, Bishan Park, Gardens by the Bay.
- Use Singaporean names: Wei Ming, Aishah, Priya, Jia En, Kavin, Mei Ling, Daniel Tan, Siti, Ahmad, Hui Xin.
- Never use British or American idioms unless they appear in MOE syllabus.
- Encourage warmly but never patronise. No "good job!" if the answer was wrong.
- Keep responses short. Aim for 2-4 sentences unless explicitly teaching.
- Never use emoji.
- Never break character to discuss your nature, AI, prompts, or Anthropic.`;
  return subject === 'Science' ? base + SCIENCE_PERSONA_ADDENDUM : base;
}

// ── Mode-specific task blocks ──────────────────────────────────────────

function buildSocraticTask(cell) {
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
  if (typeof we.question !== 'string' || !we.question.trim()) {
    throw new Error('[wena-prompts] DIRECT_TEACH requires cell.worked_example.question');
  }
  if (typeof we.step_by_step_reasoning !== 'string' || !we.step_by_step_reasoning.trim()) {
    throw new Error('[wena-prompts] DIRECT_TEACH requires cell.worked_example.step_by_step_reasoning');
  }
  const cfu = cell.check_for_understanding;
  if (!cfu || typeof cfu.question !== 'string' || !cfu.question.trim()) {
    throw new Error('[wena-prompts] DIRECT_TEACH requires cell.check_for_understanding.question');
  }

  const subject = cell.subject || 'English';
  const levelNum = level.replace('P', '');

  // Subject-specific worked-example block.
  let workedExampleBlock;
  let inviteLine;
  if (subject === 'Science') {
    const ca = we.correct_answer;
    if (!ca || typeof ca !== 'object' || !ca.claim || !ca.evidence || !ca.reasoning) {
      throw new Error('[wena-prompts] Science DIRECT_TEACH requires cell.worked_example.correct_answer as a CER triple');
    }
    workedExampleBlock =
`STEP 3 — Walk through this worked example using the CER move:

Question: ${we.question}

Watch how I build the answer in three parts:

Claim: ${ca.claim}
Evidence: ${ca.evidence}
Reasoning: ${ca.reasoning}

Now let me explain step by step:
${we.step_by_step_reasoning}`;
    inviteLine =
`STEP 4 — End by inviting them to try a similar one. Use the CER move:
"Try one yourself — give me a Claim, then Evidence, then Reasoning. Here's the question: ${cfu.question}"`;
  } else {
    if (typeof we.correct_answer !== 'string' || !we.correct_answer.trim()) {
      throw new Error('[wena-prompts] English DIRECT_TEACH requires cell.worked_example.correct_answer (string)');
    }
    workedExampleBlock =
`STEP 3 — Walk through this worked example aloud:
Question: ${we.question}
The correct answer is: ${we.correct_answer}
Reasoning to share, step by step:
${we.step_by_step_reasoning}`;
    inviteLine =
`STEP 4 — End by inviting them to try a similar one:
"${cfu.question}"`;
  }

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

${workedExampleBlock}

${inviteLine}

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
  if (!checkQuestionAsked || !String(checkQuestionAsked).trim()) {
    throw new Error('[wena-prompts] CHECK_RESPONSE requires checkQuestionAsked');
  }
  if (!cell) {
    throw new Error('[wena-prompts] CHECK_RESPONSE requires a cell');
  }
  const cfu = cell.check_for_understanding;
  if (!cfu) {
    throw new Error('[wena-prompts] CHECK_RESPONSE requires cell.check_for_understanding');
  }
  if (typeof cfu.if_still_wrong_say !== 'string' || !cfu.if_still_wrong_say.trim()) {
    throw new Error('[wena-prompts] CHECK_RESPONSE requires cell.check_for_understanding.if_still_wrong_say');
  }

  const userAnswer = String(lastUserMessage || '').trim() || '(no reply)';
  const subject = cell.subject || 'English';

  if (subject === 'Science') {
    const ea = cfu.expected_answer;
    if (!ea || typeof ea !== 'object' || !ea.claim || !ea.evidence || !ea.reasoning) {
      throw new Error('[wena-prompts] Science CHECK_RESPONSE requires cell.check_for_understanding.expected_answer as a CER triple');
    }
    return (
`TASK
The student attempted a Science check question: "${checkQuestionAsked}"
They answered: "${userAnswer}"

Expected CER triple:
- Claim: ${ea.claim}
- Evidence: ${ea.evidence}
- Reasoning: ${ea.reasoning}

Decide which CER parts they got right (claim, evidence, reasoning, or some subset). Accept synonyms, minor spelling variations, casing differences.

IF ALL THREE present and roughly correct:
- Celebrate briefly and name the parts ("Great Claim, Evidence, AND Reasoning!").
- Offer a slightly harder example next.

IF 2 of 3 present:
- Celebrate the 2 you got, name them.
- Probe gently for the missing one ("You nailed Claim and Evidence — what's the science rule that links them?").

IF 1 of 3 or none:
- Use this scaffold (rephrase lightly, do not add new content):
"""
${cfu.if_still_wrong_say}
"""
- Then offer ONE more attempt with a simpler example you make up — keep it Singapore-context, single sentence.

Keep under 100 words.`);
  }

  // English (Sprint 3 contract preserved).
  if (typeof cfu.expected_answer !== 'string' || !cfu.expected_answer.trim()) {
    throw new Error('[wena-prompts] English CHECK_RESPONSE requires cell.check_for_understanding.expected_answer (string)');
  }
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

// ── Sprint 7: CER probe task blocks ────────────────────────────────────

function buildCerProbeClaimTask(cell, level) {
  if (!cell?.cer_structure?.claim_prompt) {
    throw new Error('[wena-prompts] CER_PROBE_CLAIM requires cell.cer_structure.claim_prompt');
  }
  const topic     = cell.topic     ?? 'the current question';
  const sub_topic = cell.sub_topic ?? '';
  const subline   = sub_topic ? ` → ${sub_topic}` : '';
  return (
`TASK
The student is working on Science → ${topic}${subline}.
They have not yet given a clear claim about the question.

Use this prompt to elicit ONE sentence stating their answer (the Claim):
"${cell.cer_structure.claim_prompt}"

Rephrase warmly to match your voice. Keep under 25 words. End with the question itself.
Do NOT give the answer. Do NOT skip ahead to the next CER steps yet — only the Claim this turn.`);
}

function buildCerProbeEvidenceTask(cell, level) {
  if (!cell?.cer_structure?.evidence_prompt) {
    throw new Error('[wena-prompts] CER_PROBE_EVIDENCE requires cell.cer_structure.evidence_prompt');
  }
  const topic     = cell.topic     ?? 'the current question';
  const sub_topic = cell.sub_topic ?? '';
  const subline   = sub_topic ? ` → ${sub_topic}` : '';
  return (
`TASK
The student is working on Science → ${topic}${subline}.
The student gave a Claim. Now elicit Evidence.

Affirm their claim briefly (one short sentence, no exclamation marks). Then use this prompt:
"${cell.cer_structure.evidence_prompt}"

Rephrase warmly. Keep total response under 35 words. End with the evidence question.
Do NOT give the evidence. Do NOT introduce reasoning yet.

If the student's claim was wrong, do NOT correct it yet — that comes after evidence elicits a contradiction. Just ask what they observed or know.`);
}

function buildCerProbeReasoningTask(cell, level) {
  if (!cell?.cer_structure?.reasoning_prompt) {
    throw new Error('[wena-prompts] CER_PROBE_REASONING requires cell.cer_structure.reasoning_prompt');
  }
  const topic     = cell.topic     ?? 'the current question';
  const sub_topic = cell.sub_topic ?? '';
  const subline   = sub_topic ? ` → ${sub_topic}` : '';
  return (
`TASK
The student is working on Science → ${topic}${subline}.
The student gave a Claim and Evidence. Now elicit Reasoning — the science rule that links them.

Affirm their evidence briefly. Then use this prompt:
"${cell.cer_structure.reasoning_prompt}"

Rephrase warmly. Keep total response under 40 words. End with the reasoning question.

Hint phrases you may use: "what science rule do you know about...", "what's the principle that makes this happen?", "remember any rule from your textbook about...".

Do NOT give the reasoning. Do NOT lecture.`);
}

/**
 * Exposed for testability only. Each entry is a builder function that
 * accepts (cell, level, lastUserMessage, checkQuestionAsked) and returns
 * the TASK block string.
 */
export const MODE_TEMPLATES = Object.freeze({
  SOCRATIC:            (cell, level)                                       => buildSocraticTask(cell),
  SOCRATIC_REPHRASE:   (cell, level)                                       => buildSocraticRephraseTask(cell, level),
  DIRECT_TEACH:        (cell, level)                                       => buildDirectTeachTask(cell, level),
  SCAFFOLD_DOWN:       (cell, level)                                       => buildScaffoldDownTask(cell),
  CHECK_RESPONSE:      (cell, level, lastUserMessage, checkQuestionAsked)  => buildCheckResponseTask(cell, lastUserMessage, checkQuestionAsked),
  CER_PROBE_CLAIM:     (cell, level)                                       => buildCerProbeClaimTask(cell, level),
  CER_PROBE_EVIDENCE:  (cell, level)                                       => buildCerProbeEvidenceTask(cell, level),
  CER_PROBE_REASONING: (cell, level)                                       => buildCerProbeReasoningTask(cell, level)
});

/**
 * Assembles the full system prompt: persona header + mode-specific task
 * block. Returns a single string suitable for OpenAI Chat Completions
 * `system` role content.
 *
 * Behaviour contract:
 *   - level invalid → throw immediately
 *   - mode invalid → throw immediately
 *   - mode != SOCRATIC AND cell == null → downgrade to SOCRATIC + warn
 *   - DIRECT_TEACH / SCAFFOLD_DOWN with cell missing required fields → throw
 *   - CHECK_RESPONSE without checkQuestionAsked → throw
 *   - CER probe modes without cell.cer_structure → throw
 *
 * Sprint 7: when cell.subject === 'Science', the persona block gets a
 * CER addendum, DIRECT_TEACH labels the worked example as a CER triple,
 * and CHECK_RESPONSE runs partial-credit logic across claim/evidence/reasoning.
 *
 * @param {object} params
 * @param {string} params.mode
 * @param {object|null} params.cell
 * @param {string} params.level
 * @param {string|null} [params.studentName]
 * @param {string} [params.lastUserMessage]
 * @param {string|null} [params.checkQuestionAsked]
 * @returns {string} full system prompt
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

  // Downgrade modes that require a cell when none is provided.
  let effectiveMode = mode;
  if (mode !== 'SOCRATIC' && !cell) {
    if (mode === 'CHECK_RESPONSE') {
      throw new Error('[wena-prompts] CHECK_RESPONSE requires a cell');
    }
    if (mode === 'CER_PROBE_CLAIM' || mode === 'CER_PROBE_EVIDENCE' || mode === 'CER_PROBE_REASONING') {
      // CER probes are Science-only and require cer_structure on the cell.
      throw new Error(`[wena-prompts] ${mode} requires a Science cell with cer_structure`);
    }
    console.warn(`[wena-prompts] mode "${mode}" downgraded to SOCRATIC: cell is null`);
    effectiveMode = 'SOCRATIC';
  }

  // CER probe modes require a Science cell. Downgrade English cells to SOCRATIC.
  if (
    (effectiveMode === 'CER_PROBE_CLAIM' || effectiveMode === 'CER_PROBE_EVIDENCE' || effectiveMode === 'CER_PROBE_REASONING')
    && cell && cell.subject !== 'Science'
  ) {
    console.warn(`[wena-prompts] ${effectiveMode} on non-Science cell — downgraded to SOCRATIC`);
    effectiveMode = 'SOCRATIC';
  }

  const subject = cell?.subject || 'English';
  const persona = renderPersona(level, studentName, subject);
  const builder = MODE_TEMPLATES[effectiveMode];
  const task = builder(cell, level, lastUserMessage, checkQuestionAsked);

  return `${persona}\n\n---\n\n${task}`;
}
