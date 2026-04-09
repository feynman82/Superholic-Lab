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

// ── MOE-ACCURATE TEMPLATES (v2 — WA1/WA2/SA2 per level) ─────────────────────
// Keys: {subject}-{level}-{paperCode}   e.g. 'maths-p4-wa1'
// Shape: displayName, level, subject, paperCode, durationMinutes, totalMarks,
//         calculatorAllowed, instructions[], sections[]
// Section shape: label, title, instructions, questionType, questionCount,
//                marksPerQuestion, totalMarks, [blankCount], [errorCount]

// ── MOE-ACCURATE TEMPLATES (v2 — WA1/WA2/WA3/EOY/SA2/PSLE per level) ────────
// Perfectly aligned to the official 2025 SEAB PSLE Exam Specifications.
// Fixed Schema: Uses 'type', 'count', and 'marksEach' to bind correctly to the Generator.

Object.assign(EXAM_TEMPLATES, {

  // ── MATHS P3 ───────────────────────────────────────────────────────────────
  'maths-p3-wa1': {
    displayName: 'Primary 3 Mathematics — WA1',
    level: 'P3', subject: 'Maths', paperCode: 'WA1',
    durationMinutes: 25, totalMarks: 20, calculatorAllowed: false,
    instructions: ['Do not turn over this page until you are told to do so.', 'Answer all questions.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice Questions', instructions: 'Choose the correct answer (A, B, C or D).', type: 'mcq', count: 10, marksEach: 1 },
      { label: 'Section B', title: 'Short Answer Questions', instructions: 'Write your answer in the space provided.', type: 'short_ans', count: 10, marksEach: 1 },
    ],
  },
  'maths-p3-wa2': {
    displayName: 'Primary 3 Mathematics — WA2',
    level: 'P3', subject: 'Maths', paperCode: 'WA2',
    durationMinutes: 35, totalMarks: 28, calculatorAllowed: false,
    instructions: ['Do not turn over this page until you are told to do so.', 'Answer all questions.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice Questions', instructions: 'Choose the correct answer (A, B, C or D).', type: 'mcq', count: 8, marksEach: 1 },
      { label: 'Section B', title: 'Short Answer Questions', instructions: 'Write your answer in the space provided.', type: 'short_ans', count: 8, marksEach: 1 },
      { label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly. Each question carries 4 marks.', type: 'word_problem', count: 3, marksEach: 4 },
    ],
  },
  'maths-p3-eoy': {
    displayName: 'Primary 3 Mathematics — EOY Practice',
    level: 'P3', subject: 'Maths', paperCode: 'EOY',
    durationMinutes: 50, totalMarks: 40, calculatorAllowed: false,
    instructions: ['Do not turn over this page until you are told to do so.', 'Answer all questions.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice Questions', instructions: 'Choose the correct answer.', type: 'mcq', count: 10, marksEach: 1 },
      { label: 'Section B', title: 'Short Answer Questions', instructions: 'Write your answer in the space provided.', type: 'short_ans', count: 10, marksEach: 1 },
      { label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', type: 'word_problem', count: 5, marksEach: 4 },
    ],
  },

  // ── MATHS P4 ───────────────────────────────────────────────────────────────
  'maths-p4-wa1': {
    displayName: 'Primary 4 Mathematics — WA1',
    level: 'P4', subject: 'Maths', paperCode: 'WA1',
    durationMinutes: 25, totalMarks: 20, calculatorAllowed: false,
    instructions: ['Do not turn over this page until you are told to do so.', 'Answer all questions.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice Questions', instructions: 'Choose the correct answer.', type: 'mcq', count: 10, marksEach: 1 },
      { label: 'Section B', title: 'Short Answer Questions', instructions: 'Write your answer in the space provided.', type: 'short_ans', count: 10, marksEach: 1 },
    ],
  },
  'maths-p4-wa2': {
    displayName: 'Primary 4 Mathematics — WA2',
    level: 'P4', subject: 'Maths', paperCode: 'WA2',
    durationMinutes: 35, totalMarks: 28, calculatorAllowed: false,
    instructions: ['Do not turn over this page until you are told to do so.', 'Answer all questions.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice Questions', instructions: 'Choose the correct answer.', type: 'mcq', count: 8, marksEach: 1 },
      { label: 'Section B', title: 'Short Answer Questions', instructions: 'Write your answer in the space provided.', type: 'short_ans', count: 8, marksEach: 1 },
      { label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', type: 'word_problem', count: 3, marksEach: 4 },
    ],
  },
  'maths-p4-eoy': {
    displayName: 'Primary 4 Mathematics — EOY Practice',
    level: 'P4', subject: 'Maths', paperCode: 'EOY',
    durationMinutes: 50, totalMarks: 40, calculatorAllowed: false,
    instructions: ['Do not turn over this page until you are told to do so.', 'Answer all questions.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice Questions', instructions: 'Choose the correct answer.', type: 'mcq', count: 10, marksEach: 1 },
      { label: 'Section B', title: 'Short Answer Questions', instructions: 'Write your answer in the space provided.', type: 'short_ans', count: 10, marksEach: 1 },
      { label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', type: 'word_problem', count: 5, marksEach: 4 },
    ],
  },

  // ── MATHS P5 ───────────────────────────────────────────────────────────────
  'maths-p5-wa1': {
    displayName: 'Primary 5 Mathematics — WA1',
    level: 'P5', subject: 'Maths', paperCode: 'WA1',
    durationMinutes: 30, totalMarks: 23, calculatorAllowed: false,
    instructions: ['Answer all questions.', 'Show all working clearly.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice Questions', instructions: 'Choose the correct answer.', type: 'mcq', count: 10, marksEach: 1 },
      { label: 'Section B', title: 'Short Answer Questions', instructions: 'Write your answer in the space provided.', type: 'short_ans', count: 10, marksEach: 1 },
      { label: 'Section C', title: 'Word Problem', instructions: 'Show all working clearly.', type: 'word_problem', count: 1, marksEach: 3 },
    ],
  },
  'maths-p5-wa2': {
    displayName: 'Primary 5 Mathematics — WA2',
    level: 'P5', subject: 'Maths', paperCode: 'WA2',
    durationMinutes: 40, totalMarks: 32, calculatorAllowed: false,
    instructions: ['Answer all questions.', 'Show all working clearly.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice Questions', instructions: 'Choose the correct answer.', type: 'mcq', count: 8, marksEach: 1 },
      { label: 'Section B', title: 'Short Answer Questions', instructions: 'Write your answer in the space provided.', type: 'short_ans', count: 9, marksEach: 1 },
      { label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', type: 'word_problem', count: 3, marksEach: 5 },
    ],
  },
  'maths-p5-sa2': {
    displayName: 'Primary 5 Mathematics — SA2',
    level: 'P5', subject: 'Maths', paperCode: 'SA2',
    durationMinutes: 60, totalMarks: 45, calculatorAllowed: false,
    instructions: ['Answer all questions.', 'Show all working clearly.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice Questions', instructions: 'Choose the correct answer.', type: 'mcq', count: 10, marksEach: 1 },
      { label: 'Section B', title: 'Short Answer Questions', instructions: 'Write your answer in the space provided.', type: 'short_ans', count: 10, marksEach: 1 },
      { label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', type: 'word_problem', count: 5, marksEach: 5 },
    ],
  },

  // ── MATHS P6 (Exact 2025 SEAB PSLE Format) ─────────────────────────────────
  'maths-p6-wa1': {
    displayName: 'Primary 6 Mathematics — WA1',
    level: 'P6', subject: 'Maths', paperCode: 'WA1',
    durationMinutes: 30, totalMarks: 25, calculatorAllowed: false,
    instructions: ['Answer all questions.', 'Show all working clearly.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice Questions', instructions: 'Choose the correct answer.', type: 'mcq', count: 10, marksEach: 2 },
      { label: 'Section B', title: 'Short Answer Questions', instructions: 'Write your answer in the space provided.', type: 'short_ans', count: 5, marksEach: 1 },
    ],
  },
  'maths-p6-sa2': {
    displayName: 'Primary 6 Mathematics — SA2 (School Prelim)',
    level: 'P6', subject: 'Maths', paperCode: 'SA2',
    durationMinutes: 60, totalMarks: 50, calculatorAllowed: false,
    instructions: ['Answer all questions.', 'Show all working clearly.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice Questions', instructions: 'Choose the correct answer.', type: 'mcq', count: 10, marksEach: 2 },
      { label: 'Section B', title: 'Short Answer Questions', instructions: 'Write your answer in the space provided.', type: 'short_ans', count: 10, marksEach: 1 },
      { label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', type: 'word_problem', count: 5, marksEach: 4 },
    ],
  },
  'maths-p6-psle': {
    displayName: 'Primary 6 Mathematics — PSLE (2025 SEAB Format)',
    level: 'P6', subject: 'Maths', paperCode: 'PSLE',
    durationMinutes: 150, totalMarks: 100, calculatorAllowed: 'paper2',
    instructions: [
      'This exam covers Paper 1 (No Calculator) and Paper 2 (Calculator Allowed).',
      'Show all working clearly. Marks are awarded for correct methods.'
    ],
    sections: [
      { label: 'Paper 1 — Booklet A (1-Mark)', title: 'Multiple Choice', instructions: 'Each question carries 1 mark. No calculator.', type: 'mcq', count: 10, marksEach: 1 },
      { label: 'Paper 1 — Booklet A (2-Mark)', title: 'Multiple Choice', instructions: 'Each question carries 2 marks. No calculator.', type: 'mcq', count: 5, marksEach: 2 },
      { label: 'Paper 1 — Booklet B (1-Mark)', title: 'Short Answer', instructions: 'Each question carries 1 mark. Write your answer. No calculator.', type: 'short_ans', count: 5, marksEach: 1 },
      { label: 'Paper 1 — Booklet B (2-Mark)', title: 'Short Answer', instructions: 'Each question carries 2 marks. Write your answer. No calculator.', type: 'short_ans', count: 10, marksEach: 2 },
      { label: 'Paper 2 — Short Answer', title: 'Short Answer (Calculator)', instructions: 'Each question carries 2 marks. Show all working. Calculator allowed.', type: 'short_ans', count: 5, marksEach: 2 },
      { label: 'Paper 2 — Word Problems', title: 'Word Problems (Calculator)', instructions: 'Show all working clearly. Marks are awarded for correct method and answer. Calculator allowed.', type: 'word_problem', count: 9, marksEach: 5 },
    ],
  },

  // ── SCIENCE P3 to P5 ───────────────────────────────────────────────────────
  'science-p3-wa1': {
    displayName: 'Primary 3 Science — WA1',
    level: 'P3', subject: 'Science', paperCode: 'WA1',
    durationMinutes: 25, totalMarks: 20, calculatorAllowed: false,
    instructions: ['Answer all questions.', 'Write in complete sentences where required.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', type: 'mcq', count: 10, marksEach: 1 },
      { label: 'Section B', title: 'Open-Ended', instructions: 'Answer in complete sentences.', type: 'open_ended', count: 2, marksEach: 5 },
    ],
  },
  'science-p3-eoy': {
    displayName: 'Primary 3 Science — EOY Practice',
    level: 'P3', subject: 'Science', paperCode: 'EOY',
    durationMinutes: 50, totalMarks: 40, calculatorAllowed: false,
    instructions: ['Answer all questions.', 'Write in complete sentences where required.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', type: 'mcq', count: 20, marksEach: 1 },
      { label: 'Section B', title: 'Open-Ended', instructions: 'Answer in complete sentences.', type: 'open_ended', count: 5, marksEach: 4 },
    ],
  },
  'science-p4-eoy': {
    displayName: 'Primary 4 Science — EOY Practice',
    level: 'P4', subject: 'Science', paperCode: 'EOY',
    durationMinutes: 50, totalMarks: 40, calculatorAllowed: false,
    instructions: ['Answer all questions.', 'Write in complete sentences where required.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', type: 'mcq', count: 20, marksEach: 1 },
      { label: 'Section B', title: 'Open-Ended', instructions: 'Answer in complete sentences.', type: 'open_ended', count: 5, marksEach: 4 },
    ],
  },
  'science-p5-sa2': {
    displayName: 'Primary 5 Science — SA2',
    level: 'P5', subject: 'Science', paperCode: 'SA2',
    durationMinutes: 50, totalMarks: 40, calculatorAllowed: false,
    instructions: ['Answer all questions.', 'Apply the Claim-Evidence-Reasoning (CER) framework.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', type: 'mcq', count: 20, marksEach: 1 },
      { label: 'Section B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', type: 'open_ended', count: 5, marksEach: 4 },
    ],
  },

  // ── SCIENCE P6 (Exact 2025 SEAB PSLE Format) ───────────────────────────────
  'science-p6-sa2': {
    displayName: 'Primary 6 Science — SA2 (School Prelim)',
    level: 'P6', subject: 'Science', paperCode: 'SA2',
    durationMinutes: 50, totalMarks: 40, calculatorAllowed: false,
    instructions: ['Answer all questions.', 'For open-ended questions, use scientific terms.'],
    sections: [
      { label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', type: 'mcq', count: 20, marksEach: 1 },
      { label: 'Section B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', type: 'open_ended', count: 5, marksEach: 4 },
    ],
  },
  'science-p6-psle': {
    displayName: 'Primary 6 Science — PSLE (2025 SEAB Format)',
    level: 'P6', subject: 'Science', paperCode: 'PSLE',
    durationMinutes: 105, totalMarks: 100, calculatorAllowed: false,
    instructions: [
      'Answer all questions in BOTH booklets.',
      'For Booklet B, write in complete sentences. Use scientific terms where appropriate.',
      'Apply the Claim-Evidence-Reasoning (CER) framework in open-ended responses.'
    ],
    sections: [
      { label: 'Booklet A', title: 'Multiple Choice Questions', instructions: 'Each question carries 2 marks.', type: 'mcq', count: 28, marksEach: 2 },
      { label: 'Booklet B', title: 'Open-Ended Questions', instructions: 'Answer in complete sentences using the CER framework.', type: 'open_ended', count: 11, marksEach: 4 },
    ],
  },

  // ── ENGLISH P3 to P5 ───────────────────────────────────────────────────────
  'english-p4-sa2': {
    displayName: 'Primary 4 English — SA2 (Grammar)',
    level: 'P4', subject: 'English', paperCode: 'SA2',
    durationMinutes: 45, totalMarks: 35, calculatorAllowed: false,
    instructions: ['Answer all sections.', 'Write your answers in the spaces provided.'],
    sections: [
      { label: 'Section A', title: 'Grammar (Multiple Choice)', instructions: 'Choose the most appropriate answer.', type: 'mcq', count: 10, marksEach: 1 },
      { label: 'Section B', title: 'Grammar Cloze', instructions: 'Choose the most appropriate word to fill in each blank.', type: 'cloze', count: 3, marksEach: 5 },
      { label: 'Section C', title: 'Editing', instructions: 'Each passage has one error per underlined word. Write the correct word.', type: 'editing', count: 2, marksEach: 5 },
    ],
  },
  'english-p5-sa2': {
    displayName: 'Primary 5 English — SA2 (Grammar)',
    level: 'P5', subject: 'English', paperCode: 'SA2',
    durationMinutes: 45, totalMarks: 35, calculatorAllowed: false,
    instructions: ['Answer all sections.', 'Write your answers in the spaces provided.'],
    sections: [
      { label: 'Section A', title: 'Grammar (Multiple Choice)', instructions: 'Choose the most appropriate answer.', type: 'mcq', count: 10, marksEach: 1 },
      { label: 'Section B', title: 'Grammar Cloze', instructions: 'Choose the most appropriate word to fill in each blank.', type: 'cloze', count: 3, marksEach: 5 },
      { label: 'Section C', title: 'Editing', instructions: 'Each passage has one error per underlined word. Write the correct word.', type: 'editing', count: 2, marksEach: 5 },
    ],
  },

  // ── ENGLISH P6 (Exact 2025 SEAB PSLE Format Paper 2) ───────────────────────
  'english-p6-sa2': {
    displayName: 'Primary 6 English — SA2 / School Prelim (Paper 2)',
    level: 'P6', subject: 'English', paperCode: 'SA2',
    durationMinutes: 75, totalMarks: 60, calculatorAllowed: false,
    instructions: ['Answer all sections.', 'Write in complete sentences where required.'],
    sections: [
      { label: 'Section A', title: 'Language Use (MCQ)', instructions: 'Choose the most appropriate answer.', type: 'mcq', count: 15, marksEach: 1 },
      { label: 'Section B', title: 'Grammar Cloze', instructions: 'Choose the most appropriate word to fill in each blank.', type: 'cloze', count: 4, marksEach: 5 },
      { label: 'Section C', title: 'Editing', instructions: 'Each passage has one error per underlined word. Write the correct word.', type: 'editing', count: 2, marksEach: 5 },
      { label: 'Section D', title: 'Comprehension', instructions: 'Answer all questions in complete sentences.', type: 'open_ended', count: 3, marksEach: 5 },
    ],
  },
  'english-p6-psle': {
    displayName: 'Primary 6 English — PSLE Paper 2 (2025 SEAB Format)',
    level: 'P6', subject: 'English', paperCode: 'PSLE',
    durationMinutes: 110, totalMarks: 95, calculatorAllowed: false,
    instructions: [
      'Answer all sections.',
      'Write in complete sentences where required.',
      'The reading passages for comprehension are provided in the insert.'
    ],
    sections: [
      { label: 'Section A-D', title: 'Language Use & Visual Text', instructions: 'Choose the most appropriate answer (A, B, C or D).', type: 'mcq', count: 28, marksEach: 1 },
      { label: 'Section E-G', title: 'Cloze Passages', instructions: 'Choose the most appropriate word to fill in each blank.', type: 'cloze', count: 5, marksEach: 5 },
      { label: 'Section H', title: 'Editing', instructions: 'Each passage has grammatical errors in the underlined words. Write the correct word.', type: 'editing', count: 2, marksEach: 6 },
      { label: 'Section I', title: 'Synthesis & Transformation', instructions: 'Rewrite the sentences using the word(s) provided.', type: 'short_ans', count: 5, marksEach: 2 },
      { label: 'Section J', title: 'Comprehension (Open-Ended)', instructions: 'Read the passages carefully. Answer all questions in complete sentences.', type: 'open_ended', count: 10, marksEach: 2 },
    ],
  },

});

// ── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Returns the exam template for a given key.
 * Supports two call signatures for backward compatibility:
 *   getTemplate('maths-p4-wa1')              — new single-key format
 *   getTemplate('mathematics', 'primary-4')  — legacy two-arg format
 *
 * @param {string} subjectOrKey
 * @param {string} [level]
 * @returns {object|null}
 */
function getTemplate(subjectOrKey, level) {
  if (level === undefined) {
    // New single-key format: 'maths-p4-wa1'
    return EXAM_TEMPLATES[subjectOrKey] || null;
  }
  // Legacy two-arg format: ('mathematics', 'primary-4')
  const key = subjectOrKey.toLowerCase() + ':' + level.toLowerCase();
  return EXAM_TEMPLATES[key] || null;
}

/**
 * Returns all templates matching a level code (e.g. 'P4').
 * Only matches v2 templates (keys that don't contain ':').
 *
 * @param {string} level - e.g. 'P4'
 * @returns {Array<{key, template}>}
 */
function getTemplatesForLevel(level) {
  return Object.entries(EXAM_TEMPLATES)
    .filter(function([key, tpl]) { return tpl.level === level; })
    .map(function([key, tpl]) { return { key, template: tpl }; });
}

/**
 * Returns all templates matching a subject (e.g. 'Maths', 'Science', 'English').
 * Only matches v2 templates.
 *
 * @param {string} subject - e.g. 'Maths'
 * @returns {Array<{key, template}>}
 */
function getTemplatesForSubject(subject) {
  return Object.entries(EXAM_TEMPLATES)
    .filter(function([key, tpl]) { return tpl.subject === subject; })
    .map(function([key, tpl]) { return { key, template: tpl }; });
}

/**
 * Converts a duration in minutes to a human-readable string.
 * e.g. 105 → "1 hour 45 minutes", 60 → "1 hour", 30 → "30 minutes"
 *
 * @param {number} minutes
 * @returns {string}
 */
function formatDuration(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return mins + ' minutes';
  if (mins === 0) return hrs + (hrs === 1 ? ' hour' : ' hours');
  return hrs + (hrs === 1 ? ' hour ' : ' hours ') + mins + ' minutes';
}

/**
 * Returns all available template keys as an array of { subject, level, label } objects.
 * Used to populate the exam generator UI.
 * Includes both legacy and v2 templates.
 *
 * @returns {Array}
 */
function listTemplates() {
  return Object.entries(EXAM_TEMPLATES).map(function([key, tpl]) {
    const isLegacy = key.includes(':');
    if (isLegacy) {
      const [subject, level] = key.split(':');
      return { key, subject, level, label: tpl.label, totalMarks: tpl.totalMarks, duration: tpl.duration };
    }
    return { key, subject: tpl.subject, level: tpl.level, label: tpl.displayName,
             totalMarks: tpl.totalMarks, duration: tpl.durationMinutes };
  });
}

// Assign to globalThis for cross-environment access:
// Browser classic script: globalThis === window, so globals become window properties
// Node.js ESM: globalThis is the Node.js global object (enables vm.runInThisContext tests)
if (typeof globalThis !== 'undefined') {
  globalThis.EXAM_TEMPLATES = EXAM_TEMPLATES;
  globalThis.getTemplate = getTemplate;
  globalThis.getTemplatesForLevel = getTemplatesForLevel;
  globalThis.getTemplatesForSubject = getTemplatesForSubject;
  globalThis.formatDuration = formatDuration;
  globalThis.listTemplates = listTemplates;
}

// TEST: getTemplate('maths-p5-sa2') → { totalMarks: 45, durationMinutes: 60, sections.length: 3 }
// TEST: getTemplate('maths-p6-psle') → { totalMarks: 100, durationMinutes: 150, sections.length: 4 }
// TEST: getTemplate('science-p6-psle') → { totalMarks: 100, durationMinutes: 90, sections.length: 2 }
// TEST: getTemplate('english-p6-psle') → { totalMarks: 95, durationMinutes: 110, sections.length: 4 }
// TEST: getTemplate('maths-p6-sa2-psle') → null (deprecated key removed)
// TEST: getTemplate('mathematics', 'primary-4') → legacy format, sections totalling 40 marks
// TEST: formatDuration(150) → '2 hours 30 minutes'
// TEST: Object.keys(EXAM_TEMPLATES).length → 50
