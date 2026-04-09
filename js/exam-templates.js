/**
 * exam-templates.js
 * UNIFIED MASTER SCHEMA 3.0
 * * Defines MOE/PSLE-aligned exam paper formats for Maths, Science, and English (P3 to P6).
 * Formats accurately scale in length and difficulty from WA1 to EOY/PSLE.
 *
 * Schema Format per section:
 * id               — unique section identifier
 * label            — Short UI label (e.g., 'Section A')
 * title            — Full descriptive title (e.g., 'Multiple Choice')
 * instructions     — Instructions shown to the student
 * questionType     — 'mcq', 'short_ans', 'word_problem', 'open_ended', 'cloze', 'editing'
 * questionCount    — number of questions
 * marksPerQuestion — marks per question
 */

'use strict';

const EXAM_TEMPLATES = {

  // ══════════════════════════════════════════════════════════════════════════
  // 1. MATHEMATICS (P3 - P6)
  // ══════════════════════════════════════════════════════════════════════════

  // ── P3 Maths ──
  'maths-p3-wa1': {
    displayName: 'Primary 3 Mathematics — WA1', level: 'P3', subject: 'Maths', paperCode: 'WA1',
    durationMinutes: 30, totalMarks: 20, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 8, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 8, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 1, marksPerQuestion: 4 },
    ]
  },
  'maths-p3-wa2': {
    displayName: 'Primary 3 Mathematics — WA2', level: 'P3', subject: 'Maths', paperCode: 'WA2',
    durationMinutes: 40, totalMarks: 30, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 12, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 2, marksPerQuestion: 4 },
    ]
  },
  'maths-p3-wa3': {
    displayName: 'Primary 3 Mathematics — WA3', level: 'P3', subject: 'Maths', paperCode: 'WA3',
    durationMinutes: 45, totalMarks: 35, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 13, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 3, marksPerQuestion: 4 },
    ]
  },
  'maths-p3-eoy': {
    displayName: 'Primary 3 Mathematics — EOY', level: 'P3', subject: 'Maths', paperCode: 'EOY',
    durationMinutes: 105, totalMarks: 80, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 15, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 15, marksPerQuestion: 2 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 5, marksPerQuestion: 4 },
    ]
  },

  // ── P4 Maths (Increases word problem weighting) ──
  'maths-p4-wa1': {
    displayName: 'Primary 4 Mathematics — WA1', level: 'P4', subject: 'Maths', paperCode: 'WA1',
    durationMinutes: 35, totalMarks: 25, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 11, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problem', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 1, marksPerQuestion: 4 },
    ]
  },
  'maths-p4-wa2': {
    displayName: 'Primary 4 Mathematics — WA2', level: 'P4', subject: 'Maths', paperCode: 'WA2',
    durationMinutes: 45, totalMarks: 35, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 13, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 3, marksPerQuestion: 4 },
    ]
  },
  'maths-p4-wa3': {
    displayName: 'Primary 4 Mathematics — WA3', level: 'P4', subject: 'Maths', paperCode: 'WA3',
    durationMinutes: 50, totalMarks: 40, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 14, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 4, marksPerQuestion: 4 },
    ]
  },
  'maths-p4-eoy': {
    displayName: 'Primary 4 Mathematics — EOY', level: 'P4', subject: 'Maths', paperCode: 'EOY',
    durationMinutes: 105, totalMarks: 100, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 20, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 20, marksPerQuestion: 2 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 5, marksPerQuestion: 4 },
    ]
  },

  // ── P5 Maths (Introduces Calculator usage for Paper 2 format in EOY) ──
  'maths-p5-wa1': {
    displayName: 'Primary 5 Mathematics — WA1', level: 'P5', subject: 'Maths', paperCode: 'WA1',
    durationMinutes: 40, totalMarks: 30, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 2, marksPerQuestion: 5 },
    ]
  },
  'maths-p5-wa2': {
    displayName: 'Primary 5 Mathematics — WA2', level: 'P5', subject: 'Maths', paperCode: 'WA2',
    durationMinutes: 50, totalMarks: 40, calculatorAllowed: true,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 4, marksPerQuestion: 5 },
    ]
  },
  'maths-p5-wa3': {
    displayName: 'Primary 5 Mathematics — WA3', level: 'P5', subject: 'Maths', paperCode: 'WA3',
    durationMinutes: 50, totalMarks: 40, calculatorAllowed: true,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 4, marksPerQuestion: 5 },
    ]
  },
  'maths-p5-eoy': {
    displayName: 'Primary 5 Mathematics — EOY', level: 'P5', subject: 'Maths', paperCode: 'EOY',
    durationMinutes: 150, totalMarks: 100, calculatorAllowed: 'paper2',
    sections: [
      { id: 'p1-a', label: 'Paper 1 (A)', title: 'Multiple Choice', instructions: 'No calculator allowed.', questionType: 'mcq', questionCount: 15, marksPerQuestion: 1 }, // simplified scoring for rendering
      { id: 'p1-b', label: 'Paper 1 (B)', title: 'Short Answer', instructions: 'No calculator allowed.', questionType: 'short_ans', questionCount: 15, marksPerQuestion: 1 },
      { id: 'p2-a', label: 'Paper 2 (A)', title: 'Short Answer', instructions: 'Calculator allowed.', questionType: 'short_ans', questionCount: 5, marksPerQuestion: 2 },
      { id: 'p2-b', label: 'Paper 2 (B)', title: 'Word Problems', instructions: 'Calculator allowed. Show working.', questionType: 'word_problem', questionCount: 12, marksPerQuestion: 5 },
    ]
  },

  // ── P6 Maths (PSLE Prep) ──
  'maths-p6-wa1': {
    displayName: 'Primary 6 Mathematics — WA1', level: 'P6', subject: 'Maths', paperCode: 'WA1',
    durationMinutes: 45, totalMarks: 35, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 15, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 2, marksPerQuestion: 5 },
    ]
  },
  'maths-p6-wa2': {
    displayName: 'Primary 6 Mathematics — WA2', level: 'P6', subject: 'Maths', paperCode: 'WA2',
    durationMinutes: 60, totalMarks: 50, calculatorAllowed: true,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 15, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 5, marksPerQuestion: 5 },
    ]
  },
  'maths-p6-prelim': {
    displayName: 'Primary 6 Mathematics — PSLE Format', level: 'P6', subject: 'Maths', paperCode: 'PSLE',
    durationMinutes: 150, totalMarks: 100, calculatorAllowed: 'paper2',
    sections: [
      { id: 'p1-a1', label: 'Paper 1 (A)', title: 'Multiple Choice (1m)', instructions: 'No calculator.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'p1-a2', label: 'Paper 1 (A)', title: 'Multiple Choice (2m)', instructions: 'No calculator.', questionType: 'mcq', questionCount: 5, marksPerQuestion: 2 },
      { id: 'p1-b1', label: 'Paper 1 (B)', title: 'Short Answer (1m)', instructions: 'No calculator.', questionType: 'short_ans', questionCount: 5, marksPerQuestion: 1 },
      { id: 'p1-b2', label: 'Paper 1 (B)', title: 'Short Answer (2m)', instructions: 'No calculator.', questionType: 'short_ans', questionCount: 10, marksPerQuestion: 2 },
      { id: 'p2-a',  label: 'Paper 2',     title: 'Short Answer', instructions: 'Calculator allowed.', questionType: 'short_ans', questionCount: 5, marksPerQuestion: 2 },
      { id: 'p2-b',  label: 'Paper 2',     title: 'Word Problems', instructions: 'Calculator allowed. Show working clearly.', questionType: 'word_problem', questionCount: 9, marksPerQuestion: 5 }, // Averaged marks for layout
    ]
  },


  // ══════════════════════════════════════════════════════════════════════════
  // 2. SCIENCE (P3 - P6)
  // ══════════════════════════════════════════════════════════════════════════

  // ── P3 Science ──
  'science-p3-wa1': {
    displayName: 'Primary 3 Science — WA1', level: 'P3', subject: 'Science', paperCode: 'WA1',
    durationMinutes: 25, totalMarks: 15, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 5, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 2, marksPerQuestion: 2 }, // 2.5m rounded to 2 for engine ease
    ]
  },
  'science-p3-wa2': {
    displayName: 'Primary 3 Science — WA2', level: 'P3', subject: 'Science', paperCode: 'WA2',
    durationMinutes: 30, totalMarks: 20, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 6, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 3, marksPerQuestion: 2 }, // scaled
    ]
  },
  'science-p3-wa3': {
    displayName: 'Primary 3 Science — WA3 (Ai Tong Format)', level: 'P3', subject: 'Science', paperCode: 'WA3',
    durationMinutes: 30, totalMarks: 20, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 6, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 4, marksPerQuestion: 2 },
    ]
  },
  'science-p3-eoy': {
    displayName: 'Primary 3 Science — EOY', level: 'P3', subject: 'Science', paperCode: 'EOY',
    durationMinutes: 90, totalMarks: 70, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 20, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 10, marksPerQuestion: 3 },
    ]
  },

  // ── P4 Science ──
  'science-p4-wa1': {
    displayName: 'Primary 4 Science — WA1', level: 'P4', subject: 'Science', paperCode: 'WA1',
    durationMinutes: 35, totalMarks: 25, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 8, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 3, marksPerQuestion: 3 },
    ]
  },
  'science-p4-wa2': {
    displayName: 'Primary 4 Science — WA2', level: 'P4', subject: 'Science', paperCode: 'WA2',
    durationMinutes: 45, totalMarks: 35, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 5, marksPerQuestion: 3 },
    ]
  },
  'science-p4-wa3': {
    displayName: 'Primary 4 Science — WA3', level: 'P4', subject: 'Science', paperCode: 'WA3',
    durationMinutes: 45, totalMarks: 35, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 5, marksPerQuestion: 3 },
    ]
  },
  'science-p4-eoy': {
    displayName: 'Primary 4 Science — EOY', level: 'P4', subject: 'Science', paperCode: 'EOY',
    durationMinutes: 105, totalMarks: 80, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 22, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 12, marksPerQuestion: 3 },
    ]
  },

  // ── P5 Science ──
  'science-p5-wa1': {
    displayName: 'Primary 5 Science — WA1', level: 'P5', subject: 'Science', paperCode: 'WA1',
    durationMinutes: 40, totalMarks: 30, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 3, marksPerQuestion: 3 }, // adjusted for fit
    ]
  },
  'science-p5-wa2': {
    displayName: 'Primary 5 Science — WA2', level: 'P5', subject: 'Science', paperCode: 'WA2',
    durationMinutes: 50, totalMarks: 40, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 12, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 5, marksPerQuestion: 3 },
    ]
  },
  'science-p5-wa3': {
    displayName: 'Primary 5 Science — WA3', level: 'P5', subject: 'Science', paperCode: 'WA3',
    durationMinutes: 50, totalMarks: 40, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 12, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 5, marksPerQuestion: 3 },
    ]
  },
  'science-p5-eoy': {
    displayName: 'Primary 5 Science — EOY', level: 'P5', subject: 'Science', paperCode: 'EOY',
    durationMinutes: 105, totalMarks: 100, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 28, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 13, marksPerQuestion: 3 }, // Simplified averaging
    ]
  },

  // ── P6 Science (PSLE Prep) ──
  'science-p6-wa1': {
    displayName: 'Primary 6 Science — WA1', level: 'P6', subject: 'Science', paperCode: 'WA1',
    durationMinutes: 45, totalMarks: 35, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 5, marksPerQuestion: 3 },
    ]
  },
  'science-p6-wa2': {
    displayName: 'Primary 6 Science — WA2', level: 'P6', subject: 'Science', paperCode: 'WA2',
    durationMinutes: 60, totalMarks: 50, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 14, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 7, marksPerQuestion: 3 }, // roughly 22 marks
    ]
  },
  'science-p6-prelim': {
    displayName: 'Primary 6 Science — PSLE Format', level: 'P6', subject: 'Science', paperCode: 'PSLE',
    durationMinutes: 105, totalMarks: 100, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 28, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 13, marksPerQuestion: 3 }, // Simplified from 44 marks
    ]
  },


  // ══════════════════════════════════════════════════════════════════════════
  // 3. ENGLISH (P3 - P6)  (Note: Focus is on Paper 2 Components)
  // ══════════════════════════════════════════════════════════════════════════

  // ── P3 English ──
  'english-p3-wa1': {
    displayName: 'Primary 3 English — WA1', level: 'P3', subject: 'English', paperCode: 'WA1',
    durationMinutes: 30, totalMarks: 20,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Vocabulary MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Comprehension OE', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 2, marksPerQuestion: 2 }, // 5 marks approx
    ]
  },
  'english-p3-wa2': {
    displayName: 'Primary 3 English — WA2', level: 'P3', subject: 'English', paperCode: 'WA2',
    durationMinutes: 40, totalMarks: 25,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Editing', instructions: 'Correct the spelling and grammar errors.', questionType: 'editing', questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Comprehension OE', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 5, marksPerQuestion: 2 },
    ]
  },
  'english-p3-wa3': {
    displayName: 'Primary 3 English — WA3 (Pei Hwa Format)', level: 'P3', subject: 'English', paperCode: 'WA3',
    durationMinutes: 50, totalMarks: 30,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Vocabulary MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Comprehension OE', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 5, marksPerQuestion: 2 },
    ]
  },
  'english-p3-eoy': {
    displayName: 'Primary 3 English — EOY (Paper 2)', level: 'P3', subject: 'English', paperCode: 'EOY',
    durationMinutes: 75, totalMarks: 50,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 14, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', questionCount: 8, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Editing', instructions: 'Correct the spelling and grammar errors.', questionType: 'editing', questionCount: 4, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', questionCount: 3, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Comprehension OE', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 8, marksPerQuestion: 2 }, // Approx
    ]
  },

  // ── P4 English ──
  'english-p4-wa1': {
    displayName: 'Primary 4 English — WA1', level: 'P4', subject: 'English', paperCode: 'WA1',
    durationMinutes: 35, totalMarks: 25,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Comprehension OE', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 5, marksPerQuestion: 2 },
    ]
  },
  'english-p4-wa2': {
    displayName: 'Primary 4 English — WA2', level: 'P4', subject: 'English', paperCode: 'WA2',
    durationMinutes: 45, totalMarks: 35,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 12, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Editing', instructions: 'Correct the spelling and grammar errors.', questionType: 'editing', questionCount: 6, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', questionCount: 4, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Comprehension OE', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 6, marksPerQuestion: 2 }, // Approx
    ]
  },
  'english-p4-wa3': {
    displayName: 'Primary 4 English — WA3', level: 'P4', subject: 'English', paperCode: 'WA3',
    durationMinutes: 50, totalMarks: 40,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 14, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', questionCount: 6, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Comprehension OE', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 10, marksPerQuestion: 2 },
    ]
  },
  'english-p4-eoy': {
    displayName: 'Primary 4 English — EOY (Paper 2)', level: 'P4', subject: 'English', paperCode: 'EOY',
    durationMinutes: 90, totalMarks: 65,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 20, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Cloze Passages', instructions: 'Fill in the blanks.', questionType: 'cloze', questionCount: 12, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Editing', instructions: 'Correct the spelling and grammar errors.', questionType: 'editing', questionCount: 8, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Comprehension OE', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 10, marksPerQuestion: 2 },
    ]
  },

  // ── P5 English ──
  'english-p5-wa1': {
    displayName: 'Primary 5 English — WA1', level: 'P5', subject: 'English', paperCode: 'WA1',
    durationMinutes: 45, totalMarks: 35,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 15, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Comprehension OE', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 5, marksPerQuestion: 2 },
    ]
  },
  'english-p5-wa2': {
    displayName: 'Primary 5 English — WA2', level: 'P5', subject: 'English', paperCode: 'WA2',
    durationMinutes: 50, totalMarks: 40,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 15, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Editing', instructions: 'Correct the spelling and grammar errors.', questionType: 'editing', questionCount: 8, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Comprehension OE', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 6, marksPerQuestion: 2 }, // Approx
    ]
  },
  'english-p5-wa3': {
    displayName: 'Primary 5 English — WA3', level: 'P5', subject: 'English', paperCode: 'WA3',
    durationMinutes: 55, totalMarks: 45,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 15, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Cloze Passages', instructions: 'Fill in the blanks.', questionType: 'cloze', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Comprehension OE', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 10, marksPerQuestion: 2 },
    ]
  },
  'english-p5-eoy': {
    displayName: 'Primary 5 English — EOY (Paper 2)', level: 'P5', subject: 'English', paperCode: 'EOY',
    durationMinutes: 110, totalMarks: 95,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar, Vocab & Visual Text MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 28, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Cloze Passages', instructions: 'Fill in the blanks.', questionType: 'cloze', questionCount: 25, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Editing', instructions: 'Correct the errors.', questionType: 'editing', questionCount: 12, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', questionCount: 5, marksPerQuestion: 2 },
      { id: 'sec-e', label: 'Section E', title: 'Comprehension OE', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 10, marksPerQuestion: 2 },
    ]
  },

  // ── P6 English (PSLE Prep) ──
  'english-p6-wa1': {
    displayName: 'Primary 6 English — WA1', level: 'P6', subject: 'English', paperCode: 'WA1',
    durationMinutes: 50, totalMarks: 40,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 15, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Editing', instructions: 'Correct the errors.', questionType: 'editing', questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Comprehension OE', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 5, marksPerQuestion: 2 },
    ]
  },
  'english-p6-wa2': {
    displayName: 'Primary 6 English — WA2', level: 'P6', subject: 'English', paperCode: 'WA2',
    durationMinutes: 60, totalMarks: 50,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 20, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Editing', instructions: 'Correct the errors.', questionType: 'editing', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', questionCount: 5, marksPerQuestion: 2 },
      { id: 'sec-d', label: 'Section D', title: 'Comprehension OE', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 5, marksPerQuestion: 2 },
    ]
  },
  'english-p6-prelim': {
    displayName: 'Primary 6 English — PSLE Format (Paper 2)', level: 'P6', subject: 'English', paperCode: 'PSLE',
    durationMinutes: 110, totalMarks: 95,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar, Vocab & Visual Text MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 28, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Cloze Passages', instructions: 'Fill in the blanks.', questionType: 'cloze', questionCount: 25, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Editing', instructions: 'Correct the spelling and grammar errors.', questionType: 'editing', questionCount: 12, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', questionCount: 5, marksPerQuestion: 2 },
      { id: 'sec-e', label: 'Section E', title: 'Comprehension OE', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 10, marksPerQuestion: 2 },
    ]
  },

};

// ── EXPORTS & ENGINE UTILITIES ─────────────────────────────────────────────

/**
 * Utility to retrieve a template by its key (e.g. 'maths-p5-wa1')
 * Fallbacks to older string combinations for backwards compatibility.
 */
function getTemplate(keyOrSubject, levelStr) {
  if (levelStr) {
    const s = keyOrSubject === 'mathematics' ? 'maths' : keyOrSubject;
    const l = levelStr.replace('primary-', 'p');
    // Fallback if exam.html passes (subject, level) without exam type
    return EXAM_TEMPLATES[`${s}-${l}-wa1`] || EXAM_TEMPLATES[`${s}-${l}-eoy`] || null;
  }
  return EXAM_TEMPLATES[keyOrSubject] || null;
}

function getTemplatesForLevel(levelCode) {
  const norm = levelCode.toLowerCase();
  const res = {};
  for (const [k, v] of Object.entries(EXAM_TEMPLATES)) {
    if (v.level.toLowerCase() === norm) res[k] = v;
  }
  return res;
}

function getTemplatesForSubject(subjectStr) {
  const s = subjectStr === 'mathematics' ? 'Maths' : subjectStr;
  const res = {};
  for (const [k, v] of Object.entries(EXAM_TEMPLATES)) {
    if (v.subject.toLowerCase() === s.toLowerCase()) res[k] = v;
  }
  return res;
}

function formatDuration(minutes) {
  if (!minutes) return '0 mins';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m} mins`;
}

function listTemplates() {
  return Object.entries(EXAM_TEMPLATES).map(([key, tpl]) => {
    return { 
      key, 
      subject: tpl.subject, 
      level: tpl.level, 
      label: tpl.displayName,
      totalMarks: tpl.totalMarks, 
      duration: tpl.durationMinutes 
    };
  });
}

// Bind to global environments
if (typeof globalThis !== 'undefined') {
  globalThis.EXAM_TEMPLATES = EXAM_TEMPLATES;
  globalThis.getTemplate = getTemplate;
  globalThis.getTemplatesForLevel = getTemplatesForLevel;
  globalThis.getTemplatesForSubject = getTemplatesForSubject;
  globalThis.formatDuration = formatDuration;
  globalThis.listTemplates = listTemplates;
}