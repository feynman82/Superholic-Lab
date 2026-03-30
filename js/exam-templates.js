/**
 * exam-templates.js
 * Defines MOE/PSLE-aligned exam paper formats for each subject and level.
 * Each template specifies the sections, question types, counts, and marks
 * that make up a standard practice paper.
 *
 * Used by exam-generator.js to assemble exam papers from the question bank.
 *
 * Format per section:
 *   type        — question type key (mcq, short_ans, word_problem, open_ended, cloze, editing)
 *   count       — number of questions in this section
 *   marksEach   — marks per question (uniform within the section)
 *   label       — section heading displayed in the exam UI
 *   instructions — short instructions shown above the section
 *
 * TEST: Import in exam.html and call getTemplate('mathematics', 'primary-4')
 *       — should return an object with sections totalling 40 marks.
 */

'use strict';

/** All exam templates keyed by `subject:level` */
const EXAM_TEMPLATES = {

  // ── PRIMARY 3 MATHEMATICS ──────────────────────────────────────────────────
  'mathematics:primary-3': {
    label:        'Primary 3 Mathematics',
    totalMarks:   40,
    duration:     50,
    sections: [
      {
        id:           'sec-a',
        label:        'Section A — Multiple Choice',
        instructions: 'Choose the correct answer (A, B, C or D) for each question.',
        type:         'mcq',
        count:        10,
        marksEach:    1,
      },
      {
        id:           'sec-b',
        label:        'Section B — Short Answer',
        instructions: 'Write your answer in the space provided. Show your working clearly.',
        type:         'short_ans',
        count:        10,
        marksEach:    1,
      },
      {
        id:           'sec-c',
        label:        'Section C — Word Problems',
        instructions: 'Show all working clearly. Each question is worth 4 marks.',
        type:         'word_problem',
        count:        5,
        marksEach:    4,
      },
    ],
  },

  // ── PRIMARY 3 SCIENCE ─────────────────────────────────────────────────────
  'science:primary-3': {
    label:        'Primary 3 Science',
    totalMarks:   40,
    duration:     50,
    sections: [
      {
        id:           'sec-a',
        label:        'Section A — Multiple Choice',
        instructions: 'Choose the correct answer (A, B, C or D) for each question.',
        type:         'mcq',
        count:        20,
        marksEach:    1,
      },
      {
        id:           'sec-b',
        label:        'Section B — Open-Ended Questions',
        instructions: 'Answer all questions. Write in complete sentences.',
        type:         'open_ended',
        count:        5,
        marksEach:    4,
      },
    ],
  },

  // ── PRIMARY 3 ENGLISH ─────────────────────────────────────────────────────
  'english:primary-3': {
    label:        'Primary 3 English',
    totalMarks:   35,
    duration:     45,
    sections: [
      {
        id:           'sec-a',
        label:        'Section A — Grammar MCQ',
        instructions: 'Choose the most appropriate answer (A, B, C or D) to complete each sentence.',
        type:         'mcq',
        count:        10,
        marksEach:    1,
      },
      {
        id:           'sec-b',
        label:        'Section B — Grammar Cloze',
        instructions: 'Choose the best word to fill in each blank.',
        type:         'cloze',
        count:        2,
        marksEach:    7,
      },
      {
        id:           'sec-c',
        label:        'Section C — Editing',
        instructions: 'Each passage has one error. Identify and correct the underlined error.',
        type:         'editing',
        count:        3,
        marksEach:    5,
      },
    ],
  },

  // ── PRIMARY 4 MATHEMATICS ──────────────────────────────────────────────────
  'mathematics:primary-4': {
    label:        'Primary 4 Mathematics',
    totalMarks:   40,
    duration:     50,     // minutes
    sections: [
      {
        id:           'sec-a',
        label:        'Section A — Multiple Choice',
        instructions: 'Choose the correct answer (A, B, C or D) for each question.',
        type:         'mcq',
        count:        10,
        marksEach:    1,
      },
      {
        id:           'sec-b',
        label:        'Section B — Short Answer',
        instructions: 'Write your answer in the space provided. Show your working clearly.',
        type:         'short_ans',
        count:        10,
        marksEach:    1,
      },
      {
        id:           'sec-c',
        label:        'Section C — Word Problems',
        instructions: 'Show all working clearly. Each question is worth 4 marks.',
        type:         'word_problem',
        count:        5,
        marksEach:    4,
      },
    ],
  },

  // ── PRIMARY 5 MATHEMATICS ──────────────────────────────────────────────────
  'mathematics:primary-5': {
    label:        'Primary 5 Mathematics',
    totalMarks:   45,
    duration:     60,
    sections: [
      {
        id:           'sec-a',
        label:        'Section A — Multiple Choice',
        instructions: 'Choose the correct answer (A, B, C or D) for each question.',
        type:         'mcq',
        count:        10,
        marksEach:    1,
      },
      {
        id:           'sec-b',
        label:        'Section B — Short Answer',
        instructions: 'Write your answer in the space provided.',
        type:         'short_ans',
        count:        10,
        marksEach:    1,
      },
      {
        id:           'sec-c',
        label:        'Section C — Word Problems',
        instructions: 'Show all working. Each question carries 5 marks.',
        type:         'word_problem',
        count:        5,
        marksEach:    5,
      },
    ],
  },

  // ── PRIMARY 6 MATHEMATICS (PSLE format) ───────────────────────────────────
  'mathematics:primary-6': {
    label:        'Primary 6 Mathematics (PSLE Format)',
    totalMarks:   50,
    duration:     60,
    sections: [
      {
        id:           'sec-a',
        label:        'Section A — Multiple Choice',
        instructions: 'Choose the correct answer (A, B, C or D) for each question.',
        type:         'mcq',
        count:        10,
        marksEach:    2,
      },
      {
        id:           'sec-b',
        label:        'Section B — Short Answer',
        instructions: 'Write your answer in the space provided. No marks for method in this section.',
        type:         'short_ans',
        count:        10,
        marksEach:    1,
      },
      {
        id:           'sec-c',
        label:        'Section C — Word Problems',
        instructions: 'Show all working clearly. Marks are awarded for correct method.',
        type:         'word_problem',
        count:        5,
        marksEach:    4,
      },
    ],
  },

  // ── PRIMARY 4 SCIENCE ─────────────────────────────────────────────────────
  'science:primary-4': {
    label:        'Primary 4 Science',
    totalMarks:   40,
    duration:     50,
    sections: [
      {
        id:           'sec-a',
        label:        'Section A — Multiple Choice',
        instructions: 'Choose the correct answer (A, B, C or D) for each question.',
        type:         'mcq',
        count:        20,
        marksEach:    1,
      },
      {
        id:           'sec-b',
        label:        'Section B — Open-Ended Questions',
        instructions: 'Answer all questions. Write in complete sentences where required.',
        type:         'open_ended',
        count:        5,
        marksEach:    4,
      },
    ],
  },

  // ── PRIMARY 5 SCIENCE ─────────────────────────────────────────────────────
  'science:primary-5': {
    label:        'Primary 5 Science',
    totalMarks:   40,
    duration:     50,
    sections: [
      {
        id:           'sec-a',
        label:        'Section A — Multiple Choice',
        instructions: 'Choose the correct answer (A, B, C or D) for each question.',
        type:         'mcq',
        count:        20,
        marksEach:    1,
      },
      {
        id:           'sec-b',
        label:        'Section B — Open-Ended Questions',
        instructions: 'Answer all questions. Write in complete sentences where required.',
        type:         'open_ended',
        count:        5,
        marksEach:    4,
      },
    ],
  },

  // ── PRIMARY 6 SCIENCE (PSLE format) ───────────────────────────────────────
  'science:primary-6': {
    label:        'Primary 6 Science (PSLE Format)',
    totalMarks:   40,
    duration:     50,
    sections: [
      {
        id:           'sec-a',
        label:        'Section A — Multiple Choice',
        instructions: 'Choose the correct answer (A, B, C or D) for each question.',
        type:         'mcq',
        count:        20,
        marksEach:    1,
      },
      {
        id:           'sec-b',
        label:        'Section B — Open-Ended Questions',
        instructions: 'Answer in complete sentences. Use scientific terms where appropriate.',
        type:         'open_ended',
        count:        5,
        marksEach:    4,
      },
    ],
  },

  // ── PRIMARY 4 ENGLISH ─────────────────────────────────────────────────────
  'english:primary-4': {
    label:        'Primary 4 English',
    totalMarks:   35,
    duration:     45,
    sections: [
      {
        id:           'sec-a',
        label:        'Section A — Grammar MCQ',
        instructions: 'Choose the most appropriate answer (A, B, C or D) to complete each sentence.',
        type:         'mcq',
        count:        10,
        marksEach:    1,
      },
      {
        id:           'sec-b',
        label:        'Section B — Grammar Cloze',
        instructions: 'Choose the best word to fill in each blank. Each passage has 7 blanks.',
        type:         'cloze',
        count:        2,
        marksEach:    7,
      },
      {
        id:           'sec-c',
        label:        'Section C — Editing',
        instructions: 'Each passage has 5 grammatical errors. Identify and correct each underlined error.',
        type:         'editing',
        count:        3,
        marksEach:    5,
      },
    ],
  },

  // ── PRIMARY 5 ENGLISH ─────────────────────────────────────────────────────
  'english:primary-5': {
    label:        'Primary 5 English',
    totalMarks:   35,
    duration:     45,
    sections: [
      {
        id:           'sec-a',
        label:        'Section A — Grammar MCQ',
        instructions: 'Choose the most appropriate answer (A, B, C or D) to complete each sentence.',
        type:         'mcq',
        count:        10,
        marksEach:    1,
      },
      {
        id:           'sec-b',
        label:        'Section B — Grammar Cloze',
        instructions: 'Choose the best word to fill in each blank.',
        type:         'cloze',
        count:        2,
        marksEach:    7,
      },
      {
        id:           'sec-c',
        label:        'Section C — Editing',
        instructions: 'Each passage has 5 grammatical errors. Identify and correct each underlined error.',
        type:         'editing',
        count:        3,
        marksEach:    5,
      },
    ],
  },

  // ── PRIMARY 6 ENGLISH (PSLE Paper 2 format) ───────────────────────────────
  'english:primary-6': {
    label:        'Primary 6 English (Paper 2 — Grammar)',
    totalMarks:   60,
    duration:     75,
    sections: [
      {
        id:           'sec-a',
        label:        'Section A — Grammar MCQ',
        instructions: 'Choose the most appropriate answer (A, B, C or D) to complete each sentence.',
        type:         'mcq',
        count:        15,
        marksEach:    1,
      },
      {
        id:           'sec-b',
        label:        'Section B — Grammar Cloze',
        instructions: 'Choose the best word to fill in each blank.',
        type:         'cloze',
        count:        2,
        marksEach:    10,
      },
      {
        id:           'sec-c',
        label:        'Section C — Editing',
        instructions: 'Each passage has one error per line. Write the correct word for each underlined error.',
        type:         'editing',
        count:        5,
        marksEach:    2,
      },
    ],
  },

};

/**
 * Returns the exam template for a given subject and level.
 * Returns null if no template is defined for the combination.
 *
 * @param {string} subject - e.g. 'mathematics'
 * @param {string} level   - e.g. 'primary-4'
 * @returns {object|null}
 */
function getTemplate(subject, level) {
  const key = subject.toLowerCase() + ':' + level.toLowerCase();
  return EXAM_TEMPLATES[key] || null;
}

/**
 * Returns all available template keys as an array of { subject, level, label } objects.
 * Used to populate the exam generator UI.
 *
 * @returns {Array}
 */
function listTemplates() {
  return Object.entries(EXAM_TEMPLATES).map(function([key, tpl]) {
    const [subject, level] = key.split(':');
    return { subject, level, label: tpl.label, totalMarks: tpl.totalMarks, duration: tpl.duration };
  });
}

// TEST: getTemplate('mathematics', 'primary-4') → sections with 10 MCQ + 10 short_ans + 5 word_problem = 40 marks
// TEST: listTemplates() → array of 8 entries, each with subject/level/label/totalMarks/duration
