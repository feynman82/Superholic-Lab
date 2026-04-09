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

Object.assign(EXAM_TEMPLATES, {

  // ── MATHS P3 ───────────────────────────────────────────────────────────────
  'maths-p3-wa1': {
    displayName: 'Primary 3 Mathematics — WA1',
    level: 'P3', subject: 'Maths', paperCode: 'WA1',
    durationMinutes: 30, totalMarks: 25, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Follow all instructions carefully.',
      'Answer all questions.',
      'Write your answers in the spaces provided.',
    ],
    sections: [
      { label: 'Section A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 1 mark. Choose the correct answer (A, B, C or D).',
        questionType: 'mcq', questionCount: 10, marksPerQuestion: 1, totalMarks: 10 },
      { label: 'Section B', title: 'Short Answer Questions',
        instructions: 'Each question carries 1 mark. Write your answer in the space provided.',
        questionType: 'short_ans', questionCount: 15, marksPerQuestion: 1, totalMarks: 15 },
    ],
  },

  'maths-p3-wa2': {
    displayName: 'Primary 3 Mathematics — WA2',
    level: 'P3', subject: 'Maths', paperCode: 'WA2',
    durationMinutes: 75, totalMarks: 50, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions.',
      'Show all your working clearly in the spaces provided.',
      'Marks may be awarded for working.',
    ],
    sections: [
      { label: 'Booklet A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 1 mark. Choose the correct answer.',
        questionType: 'mcq', questionCount: 15, marksPerQuestion: 1, totalMarks: 15 },
      { label: 'Booklet B', title: 'Short Answer Questions',
        instructions: 'Each question carries 1 mark. Write your answer in the space provided.',
        questionType: 'short_ans', questionCount: 15, marksPerQuestion: 1, totalMarks: 15 },
      { label: 'Paper 2', title: 'Word Problems',
        instructions: 'Show all working clearly. Marks are awarded for correct method and answer.',
        questionType: 'word_problem', questionCount: 4, marksPerQuestion: 5, totalMarks: 20 },
    ],
  },

  'maths-p3-sa2': {
    displayName: 'Primary 3 Mathematics — SA2 (End of Year)',
    level: 'P3', subject: 'Maths', paperCode: 'SA2',
    durationMinutes: 105, totalMarks: 100, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions.',
      'Show all working clearly. Marks are awarded for correct method.',
      'No marks will be awarded for answers without working on Paper 2.',
    ],
    sections: [
      { label: 'Paper 1 — Booklet A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 1 mark. Choose the correct answer.',
        questionType: 'mcq', questionCount: 20, marksPerQuestion: 1, totalMarks: 20 },
      { label: 'Paper 1 — Booklet B', title: 'Short Answer Questions',
        instructions: 'Each question carries 2 marks. Write your answer in the space provided.',
        questionType: 'short_ans', questionCount: 20, marksPerQuestion: 2, totalMarks: 40 },
      { label: 'Paper 2', title: 'Word Problems',
        instructions: 'Show all working clearly. Each question carries 4 marks.',
        questionType: 'word_problem', questionCount: 10, marksPerQuestion: 4, totalMarks: 40 },
    ],
  },

  // ── MATHS P4 ───────────────────────────────────────────────────────────────
  'maths-p4-wa1': {
    displayName: 'Primary 4 Mathematics — WA1',
    level: 'P4', subject: 'Maths', paperCode: 'WA1',
    durationMinutes: 30, totalMarks: 25, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions.',
      'Write your answers in the spaces provided.',
    ],
    sections: [
      { label: 'Section A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 1 mark. Choose the correct answer.',
        questionType: 'mcq', questionCount: 10, marksPerQuestion: 1, totalMarks: 10 },
      { label: 'Section B', title: 'Short Answer Questions',
        instructions: 'Each question carries 1 mark. Write your answer in the space provided.',
        questionType: 'short_ans', questionCount: 15, marksPerQuestion: 1, totalMarks: 15 },
    ],
  },

  'maths-p4-wa2': {
    displayName: 'Primary 4 Mathematics — WA2',
    level: 'P4', subject: 'Maths', paperCode: 'WA2',
    durationMinutes: 75, totalMarks: 50, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions.',
      'Show all working clearly. Marks are awarded for correct method.',
    ],
    sections: [
      { label: 'Booklet A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 1 mark. Choose the correct answer.',
        questionType: 'mcq', questionCount: 15, marksPerQuestion: 1, totalMarks: 15 },
      { label: 'Booklet B', title: 'Short Answer Questions',
        instructions: 'Each question carries 1 mark. Write your answer in the space provided.',
        questionType: 'short_ans', questionCount: 15, marksPerQuestion: 1, totalMarks: 15 },
      { label: 'Paper 2', title: 'Word Problems',
        instructions: 'Show all working clearly. Marks are awarded for correct method and answer.',
        questionType: 'word_problem', questionCount: 4, marksPerQuestion: 5, totalMarks: 20 },
    ],
  },

  'maths-p4-sa2': {
    displayName: 'Primary 4 Mathematics — SA2 (End of Year)',
    level: 'P4', subject: 'Maths', paperCode: 'SA2',
    durationMinutes: 120, totalMarks: 100, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions.',
      'Show all working clearly. Marks are awarded for correct method.',
    ],
    sections: [
      { label: 'Paper 1 — Booklet A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 1 mark. Choose the correct answer.',
        questionType: 'mcq', questionCount: 20, marksPerQuestion: 1, totalMarks: 20 },
      { label: 'Paper 1 — Booklet B', title: 'Short Answer Questions',
        instructions: 'Each question carries 2 marks. Write your answer in the space provided.',
        questionType: 'short_ans', questionCount: 20, marksPerQuestion: 2, totalMarks: 40 },
      { label: 'Paper 2', title: 'Word Problems',
        instructions: 'Show all working clearly. Marks are awarded for correct method and answer.',
        questionType: 'word_problem', questionCount: 10, marksPerQuestion: 4, totalMarks: 40 },
    ],
  },

  // ── MATHS P5 ───────────────────────────────────────────────────────────────
  'maths-p5-wa1': {
    displayName: 'Primary 5 Mathematics — WA1',
    level: 'P5', subject: 'Maths', paperCode: 'WA1',
    durationMinutes: 50, totalMarks: 40, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions.',
      'Show all working clearly.',
    ],
    sections: [
      { label: 'Booklet A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 1 mark. Choose the correct answer.',
        questionType: 'mcq', questionCount: 15, marksPerQuestion: 1, totalMarks: 15 },
      { label: 'Booklet B', title: 'Short Answer Questions',
        instructions: 'Each question carries 1 mark. Write your answer in the space provided.',
        questionType: 'short_ans', questionCount: 10, marksPerQuestion: 1, totalMarks: 10 },
      { label: 'Paper 2', title: 'Word Problems',
        instructions: 'Show all working. Each question carries 5 marks.',
        questionType: 'word_problem', questionCount: 3, marksPerQuestion: 5, totalMarks: 15 },
    ],
  },

  'maths-p5-sa2': {
    displayName: 'Primary 5 Mathematics — SA2 (End of Year)',
    level: 'P5', subject: 'Maths', paperCode: 'SA2',
    durationMinutes: 180, totalMarks: 100, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions in BOTH Paper 1 and Paper 2.',
      'No calculator is allowed for Paper 1. Calculators are allowed for Paper 2.',
      'Show all working clearly. Marks are awarded for correct method.',
    ],
    sections: [
      { label: 'Paper 1 — Booklet A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 1 mark. Choose the correct answer.',
        questionType: 'mcq', questionCount: 15, marksPerQuestion: 1, totalMarks: 15 },
      { label: 'Paper 1 — Booklet B', title: 'Short Answer Questions',
        instructions: 'Each question carries 2 marks. Write your answer in the space provided.',
        questionType: 'short_ans', questionCount: 25, marksPerQuestion: 1, totalMarks: 25 },
      { label: 'Paper 2', title: 'Word Problems (Calculator Allowed)',
        instructions: 'Show all working clearly. Marks are awarded for correct method and answer.',
        questionType: 'word_problem', questionCount: 12, marksPerQuestion: 5, totalMarks: 60 },
    ],
  },

  // ── MATHS P6 ───────────────────────────────────────────────────────────────
  'maths-p6-wa1': {
    displayName: 'Primary 6 Mathematics — WA1',
    level: 'P6', subject: 'Maths', paperCode: 'WA1',
    durationMinutes: 50, totalMarks: 40, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions.',
      'Show all working clearly.',
    ],
    sections: [
      { label: 'Booklet A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 1 mark. Choose the correct answer.',
        questionType: 'mcq', questionCount: 15, marksPerQuestion: 1, totalMarks: 15 },
      { label: 'Booklet B', title: 'Short Answer Questions',
        instructions: 'Each question carries 1 mark.',
        questionType: 'short_ans', questionCount: 10, marksPerQuestion: 1, totalMarks: 10 },
      { label: 'Paper 2', title: 'Word Problems',
        instructions: 'Show all working. Each question carries 5 marks.',
        questionType: 'word_problem', questionCount: 3, marksPerQuestion: 5, totalMarks: 15 },
    ],
  },

  'maths-p6-sa2-psle': {
    displayName: 'Primary 6 Mathematics — PSLE/SA2',
    level: 'P6', subject: 'Maths', paperCode: 'PSLE',
    durationMinutes: 230, totalMarks: 100, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions.',
      'No calculator is allowed for Paper 1.',
      'Calculators are allowed for Paper 2.',
      'Show all working clearly.',
    ],
    sections: [
      { label: 'Paper 1 — Booklet A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 2 marks. Choose the correct answer.',
        questionType: 'mcq', questionCount: 15, marksPerQuestion: 2, totalMarks: 30 },
      { label: 'Paper 1 — Booklet B', title: 'Short Answer Questions',
        instructions: 'Each question carries 1 mark.',
        questionType: 'short_ans', questionCount: 20, marksPerQuestion: 1, totalMarks: 20 },
      { label: 'Paper 2', title: 'Word Problems (Calculator Allowed)',
        instructions: 'Show all working clearly. Marks are awarded for correct method.',
        questionType: 'word_problem', questionCount: 10, marksPerQuestion: 5, totalMarks: 50 },
    ],
  },

  // ── SCIENCE P3 ─────────────────────────────────────────────────────────────
  'science-p3-wa2': {
    displayName: 'Primary 3 Science — WA2',
    level: 'P3', subject: 'Science', paperCode: 'WA2',
    durationMinutes: 60, totalMarks: 50, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions.',
      'Write in complete sentences where required.',
    ],
    sections: [
      { label: 'Booklet A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 1 mark. Choose the correct answer.',
        questionType: 'mcq', questionCount: 30, marksPerQuestion: 1, totalMarks: 30 },
      { label: 'Booklet B', title: 'Open-Ended Questions',
        instructions: 'Answer in complete sentences. Use scientific terms where appropriate.',
        questionType: 'open_ended', questionCount: 5, marksPerQuestion: 4, totalMarks: 20 },
    ],
  },

  'science-p3-sa2': {
    displayName: 'Primary 3 Science — SA2 (End of Year)',
    level: 'P3', subject: 'Science', paperCode: 'SA2',
    durationMinutes: 90, totalMarks: 60, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions.',
      'Write in complete sentences. Use scientific terms where appropriate.',
    ],
    sections: [
      { label: 'Booklet A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 1 mark. Choose the correct answer.',
        questionType: 'mcq', questionCount: 36, marksPerQuestion: 1, totalMarks: 36 },
      { label: 'Booklet B', title: 'Open-Ended Questions',
        instructions: 'Answer in complete sentences.',
        questionType: 'open_ended', questionCount: 6, marksPerQuestion: 4, totalMarks: 24 },
    ],
  },

  // ── SCIENCE P4 ─────────────────────────────────────────────────────────────
  'science-p4-wa2': {
    displayName: 'Primary 4 Science — WA2',
    level: 'P4', subject: 'Science', paperCode: 'WA2',
    durationMinutes: 60, totalMarks: 50, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions.',
      'Write in complete sentences where required.',
    ],
    sections: [
      { label: 'Booklet A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 1 mark. Choose the correct answer.',
        questionType: 'mcq', questionCount: 30, marksPerQuestion: 1, totalMarks: 30 },
      { label: 'Booklet B', title: 'Open-Ended Questions',
        instructions: 'Answer in complete sentences. Use scientific terms where appropriate.',
        questionType: 'open_ended', questionCount: 5, marksPerQuestion: 4, totalMarks: 20 },
    ],
  },

  'science-p4-sa2': {
    displayName: 'Primary 4 Science — SA2 (End of Year)',
    level: 'P4', subject: 'Science', paperCode: 'SA2',
    durationMinutes: 90, totalMarks: 60, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions.',
      'Write in complete sentences.',
    ],
    sections: [
      { label: 'Booklet A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 1 mark. Choose the correct answer.',
        questionType: 'mcq', questionCount: 36, marksPerQuestion: 1, totalMarks: 36 },
      { label: 'Booklet B', title: 'Open-Ended Questions',
        instructions: 'Answer in complete sentences. Use scientific vocabulary.',
        questionType: 'open_ended', questionCount: 6, marksPerQuestion: 4, totalMarks: 24 },
    ],
  },

  // ── SCIENCE P5 ─────────────────────────────────────────────────────────────
  'science-p5-wa2': {
    displayName: 'Primary 5 Science — WA2',
    level: 'P5', subject: 'Science', paperCode: 'WA2',
    durationMinutes: 90, totalMarks: 80, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions.',
      'Write in complete sentences. Use the CER framework where applicable.',
    ],
    sections: [
      { label: 'Booklet A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 2 marks. Choose the correct answer.',
        questionType: 'mcq', questionCount: 30, marksPerQuestion: 2, totalMarks: 60 },
      { label: 'Booklet B', title: 'Open-Ended Questions',
        instructions: 'Answer in complete sentences using scientific terms and the CER framework.',
        questionType: 'open_ended', questionCount: 5, marksPerQuestion: 4, totalMarks: 20 },
    ],
  },

  'science-p5-sa2': {
    displayName: 'Primary 5 Science — SA2 (End of Year)',
    level: 'P5', subject: 'Science', paperCode: 'SA2',
    durationMinutes: 105, totalMarks: 100, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions.',
      'Write in complete sentences. Use scientific terms where appropriate.',
    ],
    sections: [
      { label: 'Booklet A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 2 marks. Choose the correct answer.',
        questionType: 'mcq', questionCount: 30, marksPerQuestion: 2, totalMarks: 60 },
      { label: 'Booklet B', title: 'Open-Ended Questions',
        instructions: 'Answer in complete sentences. Apply the CER framework.',
        questionType: 'open_ended', questionCount: 10, marksPerQuestion: 4, totalMarks: 40 },
    ],
  },

  // ── SCIENCE P6 ─────────────────────────────────────────────────────────────
  'science-p6-sa2-psle': {
    displayName: 'Primary 6 Science — PSLE/SA2',
    level: 'P6', subject: 'Science', paperCode: 'PSLE',
    durationMinutes: 105, totalMarks: 100, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all questions.',
      'For open-ended questions, write in complete sentences.',
      'Use scientific terms where appropriate.',
    ],
    sections: [
      { label: 'Booklet A', title: 'Multiple Choice Questions',
        instructions: 'Each question carries 2 marks. Choose the correct answer.',
        questionType: 'mcq', questionCount: 30, marksPerQuestion: 2, totalMarks: 60 },
      { label: 'Booklet B', title: 'Open-Ended Questions',
        instructions: 'Answer in complete sentences using the CER framework.',
        questionType: 'open_ended', questionCount: 10, marksPerQuestion: 4, totalMarks: 40 },
    ],
  },

  // ── ENGLISH P3 ─────────────────────────────────────────────────────────────
  'english-p3-wa2': {
    displayName: 'Primary 3 English — WA2 (Paper 2)',
    level: 'P3', subject: 'English', paperCode: 'WA2',
    durationMinutes: 50, totalMarks: 50, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all sections.',
      'Write legibly in the spaces provided.',
    ],
    sections: [
      { label: 'Section A', title: 'Grammar (Multiple Choice)',
        instructions: 'Choose the most appropriate answer (A, B, C or D) to complete each sentence.',
        questionType: 'mcq', questionCount: 10, marksPerQuestion: 1, totalMarks: 10 },
      { label: 'Section B', title: 'Grammar Cloze',
        instructions: 'Choose the most appropriate word from the options given to fill in each blank.',
        questionType: 'cloze', questionCount: 1, marksPerQuestion: 10, totalMarks: 10, blankCount: 10 },
      { label: 'Section C', title: 'Editing',
        instructions: 'Each line has one grammatical error in the underlined word. Write the correct word.',
        questionType: 'editing', questionCount: 1, marksPerQuestion: 10, totalMarks: 10, errorCount: 10 },
      { label: 'Section D', title: 'Comprehension',
        instructions: 'Read the passage and answer the questions in complete sentences.',
        questionType: 'open_ended', questionCount: 5, marksPerQuestion: 4, totalMarks: 20 },
    ],
  },

  'english-p3-sa2': {
    displayName: 'Primary 3 English — SA2 (Paper 2)',
    level: 'P3', subject: 'English', paperCode: 'SA2',
    durationMinutes: 65, totalMarks: 75, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all sections.',
      'Write your answers in the spaces provided.',
    ],
    sections: [
      { label: 'Section A', title: 'Grammar (Multiple Choice)',
        instructions: 'Choose the most appropriate answer (A, B, C or D).',
        questionType: 'mcq', questionCount: 15, marksPerQuestion: 1, totalMarks: 15 },
      { label: 'Section B', title: 'Grammar Cloze',
        instructions: 'Choose the most appropriate word to fill in each blank.',
        questionType: 'cloze', questionCount: 2, marksPerQuestion: 7, totalMarks: 14, blankCount: 7 },
      { label: 'Section C', title: 'Editing',
        instructions: 'Each line has one grammatical error. Write the correct word.',
        questionType: 'editing', questionCount: 2, marksPerQuestion: 8, totalMarks: 16, errorCount: 8 },
      { label: 'Section D', title: 'Comprehension',
        instructions: 'Read the passage and answer in complete sentences.',
        questionType: 'open_ended', questionCount: 5, marksPerQuestion: 6, totalMarks: 30 },
    ],
  },

  // ── ENGLISH P4 ─────────────────────────────────────────────────────────────
  'english-p4-wa2': {
    displayName: 'Primary 4 English — WA2 (Paper 2)',
    level: 'P4', subject: 'English', paperCode: 'WA2',
    durationMinutes: 65, totalMarks: 75, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all sections.',
      'Write legibly in the spaces provided.',
    ],
    sections: [
      { label: 'Section A', title: 'Grammar (Multiple Choice)',
        instructions: 'Choose the most appropriate answer (A, B, C or D).',
        questionType: 'mcq', questionCount: 15, marksPerQuestion: 1, totalMarks: 15 },
      { label: 'Section B', title: 'Grammar Cloze',
        instructions: 'Choose the most appropriate word to fill in each blank.',
        questionType: 'cloze', questionCount: 2, marksPerQuestion: 7, totalMarks: 14, blankCount: 7 },
      { label: 'Section C', title: 'Editing',
        instructions: 'Each line has one grammatical error. Write the correct word.',
        questionType: 'editing', questionCount: 2, marksPerQuestion: 8, totalMarks: 16, errorCount: 8 },
      { label: 'Section D', title: 'Comprehension',
        instructions: 'Read the passage and answer in complete sentences.',
        questionType: 'open_ended', questionCount: 5, marksPerQuestion: 6, totalMarks: 30 },
    ],
  },

  'english-p4-sa2': {
    displayName: 'Primary 4 English — SA2 (Paper 2)',
    level: 'P4', subject: 'English', paperCode: 'SA2',
    durationMinutes: 80, totalMarks: 75, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all sections.',
      'Write in complete sentences where required.',
    ],
    sections: [
      { label: 'Section A', title: 'Grammar (Multiple Choice)',
        instructions: 'Choose the most appropriate answer (A, B, C or D).',
        questionType: 'mcq', questionCount: 15, marksPerQuestion: 1, totalMarks: 15 },
      { label: 'Section B', title: 'Grammar Cloze',
        instructions: 'Choose the most appropriate word to fill in each blank.',
        questionType: 'cloze', questionCount: 2, marksPerQuestion: 7, totalMarks: 14, blankCount: 7 },
      { label: 'Section C', title: 'Editing',
        instructions: 'Each line has one grammatical error. Write the correct word.',
        questionType: 'editing', questionCount: 2, marksPerQuestion: 8, totalMarks: 16, errorCount: 8 },
      { label: 'Section D', title: 'Comprehension',
        instructions: 'Read the passage and answer in complete sentences.',
        questionType: 'open_ended', questionCount: 5, marksPerQuestion: 6, totalMarks: 30 },
    ],
  },

  // ── ENGLISH P5 ─────────────────────────────────────────────────────────────
  'english-p5-wa2': {
    displayName: 'Primary 5 English — WA2 (Paper 2)',
    level: 'P5', subject: 'English', paperCode: 'WA2',
    durationMinutes: 80, totalMarks: 95, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all sections.',
      'Write in complete sentences where required.',
    ],
    sections: [
      { label: 'Section A', title: 'Grammar (Multiple Choice)',
        instructions: 'Choose the most appropriate answer (A, B, C or D).',
        questionType: 'mcq', questionCount: 15, marksPerQuestion: 1, totalMarks: 15 },
      { label: 'Section B', title: 'Grammar Cloze',
        instructions: 'Choose the most appropriate word to fill in each blank.',
        questionType: 'cloze', questionCount: 2, marksPerQuestion: 10, totalMarks: 20, blankCount: 10 },
      { label: 'Section C', title: 'Editing',
        instructions: 'Each line has one grammatical error. Write the correct word.',
        questionType: 'editing', questionCount: 2, marksPerQuestion: 10, totalMarks: 20, errorCount: 10 },
      { label: 'Section D', title: 'Comprehension',
        instructions: 'Read the passage and answer in complete sentences.',
        questionType: 'open_ended', questionCount: 10, marksPerQuestion: 4, totalMarks: 40 },
    ],
  },

  'english-p5-sa2': {
    displayName: 'Primary 5 English — SA2 (Paper 2)',
    level: 'P5', subject: 'English', paperCode: 'SA2',
    durationMinutes: 90, totalMarks: 95, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all sections.',
      'Write in complete sentences where required.',
    ],
    sections: [
      { label: 'Section A', title: 'Grammar (Multiple Choice)',
        instructions: 'Choose the most appropriate answer (A, B, C or D).',
        questionType: 'mcq', questionCount: 15, marksPerQuestion: 1, totalMarks: 15 },
      { label: 'Section B', title: 'Grammar Cloze',
        instructions: 'Choose the most appropriate word to fill in each blank.',
        questionType: 'cloze', questionCount: 2, marksPerQuestion: 10, totalMarks: 20, blankCount: 10 },
      { label: 'Section C', title: 'Editing',
        instructions: 'Each line has one grammatical error. Write the correct word.',
        questionType: 'editing', questionCount: 2, marksPerQuestion: 10, totalMarks: 20, errorCount: 10 },
      { label: 'Section D', title: 'Comprehension',
        instructions: 'Read the passage and answer in complete sentences.',
        questionType: 'open_ended', questionCount: 10, marksPerQuestion: 4, totalMarks: 40 },
    ],
  },

  // ── ENGLISH P6 ─────────────────────────────────────────────────────────────
  'english-p6-sa2-psle': {
    displayName: 'Primary 6 English — PSLE Paper 2',
    level: 'P6', subject: 'English', paperCode: 'PSLE',
    durationMinutes: 100, totalMarks: 95, calculatorAllowed: false,
    instructions: [
      'Do not turn over this page until you are told to do so.',
      'Answer all sections.',
      'Write in complete sentences where required.',
      'The comprehension text is provided in the insert.',
    ],
    sections: [
      { label: 'Section A', title: 'Grammar (Multiple Choice)',
        instructions: 'Choose the most appropriate answer (A, B, C or D).',
        questionType: 'mcq', questionCount: 15, marksPerQuestion: 1, totalMarks: 15 },
      { label: 'Section B', title: 'Grammar Cloze',
        instructions: 'Choose the most appropriate word to fill in each blank.',
        questionType: 'cloze', questionCount: 2, marksPerQuestion: 10, totalMarks: 20, blankCount: 10 },
      { label: 'Section C', title: 'Editing',
        instructions: 'Each line has one grammatical error. Write the correct word in the box.',
        questionType: 'editing', questionCount: 2, marksPerQuestion: 10, totalMarks: 20, errorCount: 10 },
      { label: 'Section D', title: 'Comprehension (Open-Ended)',
        instructions: 'Read the passage carefully. Answer all questions in complete sentences.',
        questionType: 'open_ended', questionCount: 10, marksPerQuestion: 4, totalMarks: 40 },
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

// TEST: getTemplate('maths-p5-sa2') → { totalMarks: 100, durationMinutes: 180, sections.length: 3 }
// TEST: getTemplate('mathematics', 'primary-4') → legacy format, sections totalling 40 marks
// TEST: formatDuration(105) → '1 hour 45 minutes'
// TEST: Object.keys(EXAM_TEMPLATES).length → 30+
