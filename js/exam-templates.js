/**
 * exam-templates.js
 * UNIFIED MASTER SCHEMA 4.0 (2026 PSLE Aligned)
 * 
 * CHANGELOG from 3.0:
 * - PSLE templates updated to SEAB 2026 specifications (0001, 0008, 0009)
 * - Maths PSLE split into separate Paper 1 and Paper 2 practice papers
 * - P6 'prelim' keys renamed to 'psle' / 'psle-p1' / 'psle-p2'
 * - Grammar Cloze: topic='Cloze', sub_topic='Grammar' (matches Supabase)
 * - Vocabulary Cloze: topic='Cloze', sub_topic='Vocabulary'
 * - Comprehension Cloze: topic='Cloze', sub_topic='Comprehension'
 * - English PSLE Paper 2 Booklet A Grammar OE mapped to type='cloze'
 * - All WA/EOY marks cross-checked against 2025 school papers
 * 
 * TERMINOLOGY (must match Supabase question_bank columns):
 *   subject:  'Mathematics' | 'Science' | 'English Language'
 *   level:    'Primary 1' through 'Primary 6'
 *   type:     'mcq' | 'short_ans' | 'word_problem' | 'open_ended' | 'cloze' | 'editing' | 'comprehension' | 'visual_text'
 *   topic:    As per Master Question Template Section 3 taxonomy
 *   sub_topic: Optional refinement (e.g., 'Grammar', 'Vocabulary', 'Comprehension')
 * 
 * TEMPLATE KEY FORMAT: {subjectShort}-{levelShort}-{paperCode}
 *   subjectShort: 'maths' | 'science' | 'english'
 *   levelShort:   'p3' | 'p4' | 'p5' | 'p6'
 *   paperCode:    'wa1' | 'wa2' | 'wa3' | 'eoy' | 'psle' | 'psle-p1' | 'psle-p2'
 */

'use strict';

const EXAM_TEMPLATES = {

  // ══════════════════════════════════════════════════════════════════════════
  // 1. MATHEMATICS (P3 – P6)
  // ══════════════════════════════════════════════════════════════════════════
  // WA: 20–40 marks, 30–50 min. EOY: ~100 marks, 105–150 min.
  // Question types in DB: mcq, short_ans, word_problem
  // Calculator: Not allowed P3–P4. P5–P6 Paper 2 only.

  // ── P3 MATHS ──
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
    displayName: 'Primary 3 Mathematics — End-of-Year', level: 'P3', subject: 'Maths', paperCode: 'EOY',
    durationMinutes: 105, totalMarks: 80, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 15, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 15, marksPerQuestion: 2 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 5, marksPerQuestion: 4 },
    ]
  },

  // ── P4 MATHS ──
  'maths-p4-wa1': {
    displayName: 'Primary 4 Mathematics — WA1', level: 'P4', subject: 'Maths', paperCode: 'WA1',
    durationMinutes: 35, totalMarks: 25, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 11, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 1, marksPerQuestion: 4 },
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
    displayName: 'Primary 4 Mathematics — End-of-Year', level: 'P4', subject: 'Maths', paperCode: 'EOY',
    durationMinutes: 105, totalMarks: 100, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 20, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Section B', title: 'Short Answer', instructions: 'Write your answer in the space provided.', questionType: 'short_ans', questionCount: 20, marksPerQuestion: 2 },
      { id: 'sec-c', label: 'Section C', title: 'Word Problems', instructions: 'Show all working clearly.', questionType: 'word_problem', questionCount: 5, marksPerQuestion: 4 },
    ]
  },

  // ── P5 MATHS ──
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
    displayName: 'Primary 5 Mathematics — End-of-Year', level: 'P5', subject: 'Maths', paperCode: 'EOY',
    durationMinutes: 150, totalMarks: 100, calculatorAllowed: 'paper2',
    sections: [
      { id: 'p1-a', label: 'Paper 1 (Booklet A)', title: 'Multiple Choice', instructions: 'No calculator allowed.', questionType: 'mcq', questionCount: 15, marksPerQuestion: 1 },
      { id: 'p1-b', label: 'Paper 1 (Booklet B)', title: 'Short Answer', instructions: 'No calculator allowed.', questionType: 'short_ans', questionCount: 15, marksPerQuestion: 1 },
      { id: 'p2-a', label: 'Paper 2', title: 'Short Answer', instructions: 'Calculator allowed.', questionType: 'short_ans', questionCount: 5, marksPerQuestion: 2 },
      { id: 'p2-b', label: 'Paper 2', title: 'Word Problems', instructions: 'Calculator allowed. Show working.', questionType: 'word_problem', questionCount: 12, marksPerQuestion: 5 },
    ]
  },

  // ── P6 MATHS (WA + PSLE 2026) ──
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

  // PSLE Mathematics 2026 — Paper 1 (No calculator) — SEAB Code 0008
  // Booklet A: 10 MCQ (1m) + 8 MCQ (2m) = 26 marks
  // Booklet B: 12 Short Answer (2m each) = 24 marks
  // Total: 50 marks, 1h 10min
  'maths-p6-psle-p1': {
    displayName: 'PSLE Mathematics — Paper 1 (No Calculator)', level: 'P6', subject: 'Maths', paperCode: 'PSLE-P1',
    durationMinutes: 70, totalMarks: 50, calculatorAllowed: false,
    sections: [
      { id: 'p1-a1', label: 'Booklet A', title: 'Multiple Choice (1 mark)', instructions: 'Choose the correct answer. No calculator.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 1 },
      { id: 'p1-a2', label: 'Booklet A', title: 'Multiple Choice (2 marks)', instructions: 'Choose the correct answer. No calculator.', questionType: 'mcq', questionCount: 8, marksPerQuestion: 2 },
      { id: 'p1-b',  label: 'Booklet B', title: 'Short Answer (2 marks)', instructions: 'Write your answer. Show working where applicable. No calculator.', questionType: 'short_ans', questionCount: 12, marksPerQuestion: 2 },
    ]
  },

  // PSLE Mathematics 2026 — Paper 2 (Calculator allowed) — SEAB Code 0008
  // 5 Short Answer (2m) + 10 Structured/Long Answer (3–5m, avg 4m) = 50 marks
  // Total: 50 marks, 1h 20min
  'maths-p6-psle-p2': {
    displayName: 'PSLE Mathematics — Paper 2 (Calculator Allowed)', level: 'P6', subject: 'Maths', paperCode: 'PSLE-P2',
    durationMinutes: 80, totalMarks: 50, calculatorAllowed: true,
    sections: [
      { id: 'p2-a', label: 'Section A', title: 'Short Answer (2 marks)', instructions: 'Calculator allowed. Write your answer.', questionType: 'short_ans', questionCount: 5, marksPerQuestion: 2 },
      { id: 'p2-b', label: 'Section B', title: 'Structured Problems (3–5 marks)', instructions: 'Calculator allowed. Show all working clearly.', questionType: 'word_problem', questionCount: 10, marksPerQuestion: 4 },
    ]
  },


  // ══════════════════════════════════════════════════════════════════════════
  // 2. SCIENCE (P3 – P6)
  // ══════════════════════════════════════════════════════════════════════════
  // Question types in DB: mcq, open_ended
  // Booklet A = MCQ (2m each), Booklet B = Structured/Open-Ended

  // ── P3 SCIENCE ──
  'science-p3-wa1': {
    displayName: 'Primary 3 Science — WA1', level: 'P3', subject: 'Science', paperCode: 'WA1',
    durationMinutes: 25, totalMarks: 15,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 5, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Structured Questions', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 1, marksPerQuestion: 5 },
    ]
  },
  'science-p3-wa2': {
    displayName: 'Primary 3 Science — WA2', level: 'P3', subject: 'Science', paperCode: 'WA2',
    durationMinutes: 30, totalMarks: 20,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 6, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Structured Questions', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 2, marksPerQuestion: 4 },
    ]
  },
  'science-p3-wa3': {
    displayName: 'Primary 3 Science — WA3', level: 'P3', subject: 'Science', paperCode: 'WA3',
    durationMinutes: 30, totalMarks: 20,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 6, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Structured Questions', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 2, marksPerQuestion: 4 },
    ]
  },
  'science-p3-eoy': {
    displayName: 'Primary 3 Science — End-of-Year', level: 'P3', subject: 'Science', paperCode: 'EOY',
    durationMinutes: 90, totalMarks: 70,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 20, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Structured Questions', instructions: 'Answer in complete sentences using the CER framework.', questionType: 'open_ended', questionCount: 5, marksPerQuestion: 6 },
    ]
  },

  // ── P4 SCIENCE ──
  'science-p4-wa1': {
    displayName: 'Primary 4 Science — WA1', level: 'P4', subject: 'Science', paperCode: 'WA1',
    durationMinutes: 35, totalMarks: 25,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 8, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Structured Questions', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 2, marksPerQuestion: 4 },
    ]
  },
  'science-p4-wa2': {
    displayName: 'Primary 4 Science — WA2', level: 'P4', subject: 'Science', paperCode: 'WA2',
    durationMinutes: 45, totalMarks: 35,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Structured Questions', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 3, marksPerQuestion: 5 },
    ]
  },
  'science-p4-wa3': {
    displayName: 'Primary 4 Science — WA3', level: 'P4', subject: 'Science', paperCode: 'WA3',
    durationMinutes: 45, totalMarks: 35,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Structured Questions', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 3, marksPerQuestion: 5 },
    ]
  },
  'science-p4-eoy': {
    displayName: 'Primary 4 Science — End-of-Year', level: 'P4', subject: 'Science', paperCode: 'EOY',
    durationMinutes: 105, totalMarks: 80,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 22, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Structured Questions', instructions: 'Answer in complete sentences using the CER framework.', questionType: 'open_ended', questionCount: 6, marksPerQuestion: 6 },
    ]
  },

  // ── P5 SCIENCE ──
  'science-p5-wa1': {
    displayName: 'Primary 5 Science — WA1', level: 'P5', subject: 'Science', paperCode: 'WA1',
    durationMinutes: 40, totalMarks: 30,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Structured Questions', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 2, marksPerQuestion: 5 },
    ]
  },
  'science-p5-wa2': {
    displayName: 'Primary 5 Science — WA2', level: 'P5', subject: 'Science', paperCode: 'WA2',
    durationMinutes: 50, totalMarks: 40,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 12, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Structured Questions', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 3, marksPerQuestion: 5 },
    ]
  },
  'science-p5-wa3': {
    displayName: 'Primary 5 Science — WA3', level: 'P5', subject: 'Science', paperCode: 'WA3',
    durationMinutes: 50, totalMarks: 40,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 12, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Structured Questions', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 3, marksPerQuestion: 5 },
    ]
  },
  'science-p5-eoy': {
    displayName: 'Primary 5 Science — End-of-Year', level: 'P5', subject: 'Science', paperCode: 'EOY',
    durationMinutes: 105, totalMarks: 100,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 28, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Structured Questions', instructions: 'Answer in complete sentences using the CER framework.', questionType: 'open_ended', questionCount: 7, marksPerQuestion: 6 },
    ]
  },

  // ── P6 SCIENCE (WA + PSLE 2026) ──
  'science-p6-wa1': {
    displayName: 'Primary 6 Science — WA1', level: 'P6', subject: 'Science', paperCode: 'WA1',
    durationMinutes: 45, totalMarks: 35,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Structured Questions', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 3, marksPerQuestion: 5 },
    ]
  },
  'science-p6-wa2': {
    displayName: 'Primary 6 Science — WA2', level: 'P6', subject: 'Science', paperCode: 'WA2',
    durationMinutes: 60, totalMarks: 50,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 14, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Structured Questions', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 4, marksPerQuestion: 5 },
    ]
  },

  // PSLE Science 2026 — SEAB Code 0009
  // Booklet A: 30 MCQ (2m each) = 60 marks
  // Booklet B: 10–11 Structured (2–5m each) = 40 marks
  // Total: 100 marks, 1h 45min
  'science-p6-psle': {
    displayName: 'PSLE Science (Full Paper)', level: 'P6', subject: 'Science', paperCode: 'PSLE',
    durationMinutes: 105, totalMarks: 100,
    sections: [
      { id: 'bk-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer. Each question carries 2 marks.', questionType: 'mcq', questionCount: 30, marksPerQuestion: 2 },
      { id: 'bk-b', label: 'Booklet B', title: 'Structured Questions', instructions: 'Answer all questions. Show your reasoning clearly.', questionType: 'open_ended', questionCount: 11, marksPerQuestion: 4 },
    ]
  },


  // ══════════════════════════════════════════════════════════════════════════
  // 3. ENGLISH LANGUAGE (P3 – P6)
  // ══════════════════════════════════════════════════════════════════════════
  // We only offer Paper 2 (Language Use and Comprehension).
  // Question types in DB: mcq, cloze, editing, comprehension, visual_text, short_ans
  // 
  // CLOZE SUB-TOPIC CONVENTION (matches Supabase topic/sub_topic):
  //   Grammar Cloze:        topic='Cloze', sub_topic='Grammar'
  //   Vocabulary Cloze:     topic='Cloze', sub_topic='Vocabulary'  
  //   Comprehension Cloze:  topic='Cloze', sub_topic='Comprehension'
  //   Grammar OE (PSLE):    topic='Cloze', sub_topic='Grammar' (same renderer)
  //
  // The `topics` array in each section tells exam-generator.js which 
  // topic/sub_topic to filter by when querying Supabase.

  // ── P3 ENGLISH ──
  'english-p3-wa1': {
    displayName: 'Primary 3 English — WA1', level: 'P3', subject: 'English', paperCode: 'WA1',
    durationMinutes: 30, totalMarks: 20,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Vocabulary MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Vocabulary'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Cloze'], subTopics: ['Grammar'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Comprehension', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 5 }
    ]
  },
  'english-p3-wa2': {
    displayName: 'Primary 3 English — WA2', level: 'P3', subject: 'English', paperCode: 'WA2',
    durationMinutes: 40, totalMarks: 25,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Comprehension MCQ', instructions: 'Read the passage carefully and answer the questions.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 5 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Editing', instructions: 'Correct the spelling and grammar errors.', questionType: 'editing', topics: ['Editing'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 5 }
    ]
  },
  'english-p3-wa3': {
    displayName: 'Primary 3 English — WA3', level: 'P3', subject: 'English', paperCode: 'WA3',
    durationMinutes: 55, totalMarks: 35,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Comprehension MCQ', instructions: 'Read the passage carefully and answer the questions.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 5 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Vocabulary MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Vocabulary'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Cloze'], subTopics: ['Grammar'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', topics: ['Synthesis'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-f', label: 'Section F', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 10 }
    ]
  },
  'english-p3-eoy': {
    displayName: 'Primary 3 English — End-of-Year (Paper 2)', level: 'P3', subject: 'English', paperCode: 'EOY',
    durationMinutes: 75, totalMarks: 50,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Comprehension MCQ', instructions: 'Read the passage carefully and answer the questions.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 5 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 14, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Cloze'], subTopics: ['Grammar'], questionCount: 8, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Editing', instructions: 'Correct the spelling and grammar errors.', questionType: 'editing', topics: ['Editing'], questionCount: 4, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', topics: ['Synthesis'], questionCount: 3, marksPerQuestion: 1 },
      { id: 'sec-f', label: 'Section F', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 16 }
    ]
  },

  // ── P4 ENGLISH ──
  'english-p4-wa1': {
    displayName: 'Primary 4 English — WA1', level: 'P4', subject: 'English', paperCode: 'WA1',
    durationMinutes: 35, totalMarks: 25,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Comprehension MCQ', instructions: 'Read the passage carefully and answer the questions.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 5 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Cloze'], subTopics: ['Grammar'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 10 }
    ]
  },
  'english-p4-wa2': {
    displayName: 'Primary 4 English — WA2', level: 'P4', subject: 'English', paperCode: 'WA2',
    durationMinutes: 45, totalMarks: 35,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Comprehension MCQ', instructions: 'Read the passage carefully and answer the questions.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 5 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Editing', instructions: 'Correct the spelling and grammar errors.', questionType: 'editing', topics: ['Editing'], questionCount: 6, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', topics: ['Synthesis'], questionCount: 4, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 10 },
    ]
  },
  'english-p4-wa3': {
    displayName: 'Primary 4 English — WA3', level: 'P4', subject: 'English', paperCode: 'WA3',
    durationMinutes: 50, totalMarks: 40,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Comprehension MCQ', instructions: 'Read the passage carefully and answer the questions.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 5 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Cloze'], subTopics: ['Grammar'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 20 },
    ]
  },
  'english-p4-eoy': {
    displayName: 'Primary 4 English — End-of-Year (Paper 2)', level: 'P4', subject: 'English', paperCode: 'EOY',
    durationMinutes: 90, totalMarks: 65,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Comprehension MCQ', instructions: 'Read the passage carefully and answer the questions.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 5 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 15, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Cloze'], subTopics: ['Grammar'], questionCount: 12, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Editing', instructions: 'Correct the spelling and grammar errors.', questionType: 'editing', topics: ['Editing'], questionCount: 8, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', topics: ['Synthesis'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-f', label: 'Section F', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 20 },
    ]
  },

  // ── P5 ENGLISH ──
  'english-p5-wa1': {
    displayName: 'Primary 5 English — WA1', level: 'P5', subject: 'English', paperCode: 'WA1',
    durationMinutes: 45, totalMarks: 35,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Visual Text', instructions: 'Study the flyer carefully and answer the questions.', questionType: 'visual_text', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 5 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Cloze'], subTopics: ['Grammar'], questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 10 }
    ]
  },
  'english-p5-wa2': {
    displayName: 'Primary 5 English — WA2', level: 'P5', subject: 'English', paperCode: 'WA2',
    durationMinutes: 50, totalMarks: 40,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Visual Text', instructions: 'Study the flyer carefully and answer the questions.', questionType: 'visual_text', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 8 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 7, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Editing', instructions: 'Correct the spelling and grammar errors.', questionType: 'editing', topics: ['Editing'], questionCount: 8, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', topics: ['Synthesis'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 12 }
    ]
  },
  'english-p5-wa3': {
    displayName: 'Primary 5 English — WA3', level: 'P5', subject: 'English', paperCode: 'WA3',
    durationMinutes: 60, totalMarks: 50,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Visual Text', instructions: 'Study the flyer carefully and answer the questions.', questionType: 'visual_text', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 8 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 7, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Cloze Passages', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Cloze'], subTopics: ['Grammar', 'Comprehension'], questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', topics: ['Synthesis'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 20 },
    ]
  },
  'english-p5-eoy': {
    displayName: 'Primary 5 English — End-of-Year (Paper 2)', level: 'P5', subject: 'English', paperCode: 'EOY',
    durationMinutes: 110, totalMarks: 95,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Visual Text', instructions: 'Study the flyer carefully and answer the questions.', questionType: 'visual_text', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 8 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 20, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Cloze Passages', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Cloze'], subTopics: ['Grammar', 'Comprehension'], questionCount: 25, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Editing', instructions: 'Correct the errors.', questionType: 'editing', topics: ['Editing'], questionCount: 12, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', topics: ['Synthesis'], questionCount: 5, marksPerQuestion: 2 },
      { id: 'sec-f', label: 'Section F', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 20 },
    ]
  },

  // ── P6 ENGLISH (WA + PSLE 2026) ──
  'english-p6-wa1': {
    displayName: 'Primary 6 English — WA1', level: 'P6', subject: 'English', paperCode: 'WA1',
    durationMinutes: 50, totalMarks: 40,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Visual Text', instructions: 'Study the flyer carefully and answer the questions.', questionType: 'visual_text', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 8 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 7, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Cloze'], subTopics: ['Grammar'], questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Editing', instructions: 'Correct the errors.', questionType: 'editing', topics: ['Editing'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 10 }
    ]
  },
  'english-p6-wa2': {
    displayName: 'Primary 6 English — WA2', level: 'P6', subject: 'English', paperCode: 'WA2',
    durationMinutes: 60, totalMarks: 50,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Visual Text', instructions: 'Study the flyer carefully and answer the questions.', questionType: 'visual_text', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 8 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 12, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Editing', instructions: 'Correct the errors.', questionType: 'editing', topics: ['Editing'], questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', topics: ['Synthesis'], questionCount: 5, marksPerQuestion: 2 },
      { id: 'sec-e', label: 'Section E', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 10 }
    ]
  },

  // PSLE English 2026 — Paper 2 (Language Use & Comprehension) — SEAB Code 0001
  // Booklet A: Grammar OE (10×1m) + Vocab MCQ (5×1m) + Vocab Cloze MCQ (5×1m) + Visual Text MCQ (5×1m) = 25 marks
  // Booklet B: Grammar Cloze (10×1m) + Editing (10×1m) + Comprehension Cloze (15×1m) + Synthesis (5×2m) + Comprehension OE (10×2m) = 65 marks
  // Total: 90 marks, 1h 50min
  'english-p6-psle': {
    displayName: 'PSLE English Language — Paper 2', level: 'P6', subject: 'English', paperCode: 'PSLE',
    durationMinutes: 110, totalMarks: 90,
    sections: [
      // ── Booklet A (25 marks) ──
      { id: 'bka-grammar',   label: 'Booklet A', title: 'Grammar',               instructions: 'Fill in each blank with a suitable word.',       questionType: 'cloze',       topics: ['Cloze'], subTopics: ['Grammar'],        questionCount: 10, marksPerQuestion: 1 },
      { id: 'bka-vocab',     label: 'Booklet A', title: 'Vocabulary MCQ',         instructions: 'Choose the correct answer.',                     questionType: 'mcq',         topics: ['Vocabulary'],                           questionCount: 5,  marksPerQuestion: 1 },
      { id: 'bka-vocabcloze',label: 'Booklet A', title: 'Vocabulary Cloze',       instructions: 'Choose the most suitable word for each blank.',   questionType: 'cloze',       topics: ['Cloze'], subTopics: ['Vocabulary'],      questionCount: 5,  marksPerQuestion: 1 },
      { id: 'bka-visual',    label: 'Booklet A', title: 'Visual Text Comprehension', instructions: 'Study the visual text and answer the questions.', questionType: 'visual_text', topics: ['Comprehension'],                     questionCount: 1,  marksPerQuestion: 5 },
      // ── Booklet B (65 marks) ──
      { id: 'bkb-gramcloze', label: 'Booklet B', title: 'Grammar Cloze',          instructions: 'Fill in each blank with a suitable word.',       questionType: 'cloze',       topics: ['Cloze'], subTopics: ['Grammar'],        questionCount: 10, marksPerQuestion: 1 },
      { id: 'bkb-editing',   label: 'Booklet B', title: 'Editing',                instructions: 'Correct the spelling and grammar errors.',        questionType: 'editing',     topics: ['Editing'],                              questionCount: 10, marksPerQuestion: 1 },
      { id: 'bkb-compcloze', label: 'Booklet B', title: 'Comprehension Cloze',    instructions: 'Fill in each blank with a suitable word.',       questionType: 'cloze',       topics: ['Cloze'], subTopics: ['Comprehension'],  questionCount: 15, marksPerQuestion: 1 },
      { id: 'bkb-synthesis', label: 'Booklet B', title: 'Synthesis & Transformation', instructions: 'Rewrite the sentences as instructed.',       questionType: 'short_ans',   topics: ['Synthesis'],                            questionCount: 5,  marksPerQuestion: 2 },
      { id: 'bkb-compoe',    label: 'Booklet B', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully and answer the questions.', questionType: 'comprehension', topics: ['Comprehension'],                questionCount: 1,  marksPerQuestion: 20 },
    ]
  },

};

// ── EXPORTS & ENGINE UTILITIES ─────────────────────────────────────────────

/**
 * Resolves a template by key.
 * Supports both new-format keys ('maths-p6-psle-p1') and legacy two-arg
 * format (subject, level).
 */
function getTemplate(keyOrSubject, levelStr) {
  if (levelStr) {
    const s = keyOrSubject === 'mathematics' ? 'maths' : keyOrSubject;
    const l = levelStr.replace('primary-', 'p');
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

if (typeof globalThis !== 'undefined') {
  globalThis.EXAM_TEMPLATES = EXAM_TEMPLATES;
  globalThis.getTemplate = getTemplate;
  globalThis.getTemplatesForLevel = getTemplatesForLevel;
  globalThis.getTemplatesForSubject = getTemplatesForSubject;
  globalThis.formatDuration = formatDuration;
  globalThis.listTemplates = listTemplates;
}