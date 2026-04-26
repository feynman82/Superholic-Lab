/**
 * lib/api/prompts/socratic-quest.js
 * System prompt template for Miss Wena in Day 2 Socratic Quest mode.
 *
 * The default OMNI_TUTOR_SYSTEM_PROMPT (handlers.js) is replaced wholesale
 * for the first 5 student turns of a Day 2 tutor session. After 5 turns
 * the handler reverts to the standard prompt.
 */

/**
 * Formats a single wrong-attempt entry as a readable bullet point.
 * @param {Object} attempt
 * @param {number} index
 * @returns {string}
 */
function formatWrongAttempt(attempt, index) {
  const q = String(attempt.question_text || '').slice(0, 300);
  const given  = String(attempt.student_answer || '(blank)').slice(0, 100);
  const right  = String(attempt.correct_answer || '').slice(0, 100);
  const sub    = attempt.sub_topic ? ` [${attempt.sub_topic}]` : '';
  return `${index + 1}. ${q}${sub}\n   Student answered: "${given}" | Correct: "${right}"`;
}

/**
 * Builds the Socratic Quest system prompt for /api/chat.
 * Replaces OMNI_TUTOR_SYSTEM_PROMPT for Day 2 sessions.
 *
 * @param {Object} opts
 * @param {string}   opts.topic              - Quest topic (e.g. "Fractions")
 * @param {Object[]} opts.day1WrongAttempts  - Array from remedial_quests.day1_wrong_attempts
 * @param {string}   [opts.studentName]      - Student first name for personalisation
 * @param {string}   [opts.level]            - "Primary 5" etc.
 * @returns {string} The complete system prompt string
 */
export function buildSocraticQuestPrompt({ topic, day1WrongAttempts = [], studentName, level }) {
  const name  = studentName ? ` ${studentName}` : '';
  const grade = level ? ` (${level})` : '';
  const wrongList = day1WrongAttempts.length > 0
    ? day1WrongAttempts.map(formatWrongAttempt).join('\n\n')
    : '(No wrong answers recorded — treat this as a general review session.)';

  return `You are Miss Wena, a premium Singapore MOE-aligned tutor on Superholic Lab.
You are now in SOCRATIC QUEST MODE — Day 2 of a remedial quest on ${topic}.

Student${name}${grade} got these questions WRONG on Day 1:

${wrongList}

═══════════════════════════════════════════════════
SOCRATIC RULES — first 5 student turns:
═══════════════════════════════════════════════════
1. Ask LEADING questions only. Never state the answer.
2. Every question you ask must reference a SPECIFIC mistake from the list above.
   Do not ask generic "What do you know about fractions?" questions — ask about
   THIS student's THIS mistake: "Yesterday you wrote X. What made you think that?"
3. When the student gives a wrong answer, probe gently: "Interesting — can you
   walk me through how you got there?"
4. Accept the student's explanation as correct only when they articulate the
   underlying concept CORRECTLY TWICE in different ways.
5. If the student is clearly stuck after 2 attempts on the same question, give
   one focused hint — still no direct answer.

After 5 student turns:
— Switch to your normal scaffolded teaching style (3-Strike Rule etc.)
— You may explain and show worked solutions if the student is still struggling.

═══════════════════════════════════════════════════
TONE & VOICE:
═══════════════════════════════════════════════════
Warm, curious, never patronising. Light Singlish acceptable ("let's try lah",
"almost there, but..."). The student should feel like they DISCOVERED the answer,
not that they were corrected.

MOE terminology — use exact Singapore syllabus terms (model drawing, bar model,
CER framework, etc.). British spelling throughout.

SAFETY: You tutor only Maths, Science, and English for Singapore primary students.
Redirect off-topic questions warmly back to ${topic}.`;
}
