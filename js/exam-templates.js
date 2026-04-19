/**
 * exam-templates.js
 * UNIFIED MASTER SCHEMA 3.0 (Harmonized)
 */

'use strict';

const EXAM_TEMPLATES = {

  // ══════════════════════════════════════════════════════════════════════════
  // 1. MATHEMATICS (P3 - P6)
  // ══════════════════════════════════════════════════════════════════════════

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
      { id: 'p1-a', label: 'Paper 1 (A)', title: 'Multiple Choice', instructions: 'No calculator allowed.', questionType: 'mcq', questionCount: 15, marksPerQuestion: 1 }, 
      { id: 'p1-b', label: 'Paper 1 (B)', title: 'Short Answer', instructions: 'No calculator allowed.', questionType: 'short_ans', questionCount: 15, marksPerQuestion: 1 },
      { id: 'p2-a', label: 'Paper 2 (A)', title: 'Short Answer', instructions: 'Calculator allowed.', questionType: 'short_ans', questionCount: 5, marksPerQuestion: 2 },
      { id: 'p2-b', label: 'Paper 2 (B)', title: 'Word Problems', instructions: 'Calculator allowed. Show working.', questionType: 'word_problem', questionCount: 12, marksPerQuestion: 5 },
    ]
  },

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
      { id: 'p2-b',  label: 'Paper 2',     title: 'Word Problems', instructions: 'Calculator allowed. Show working clearly.', questionType: 'word_problem', questionCount: 9, marksPerQuestion: 5 }, 
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 2. SCIENCE (P3 - P6)
  // ══════════════════════════════════════════════════════════════════════════

  'science-p3-wa1': {
    displayName: 'Primary 3 Science — WA1', level: 'P3', subject: 'Science', paperCode: 'WA1',
    durationMinutes: 25, totalMarks: 15, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 5, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 1, marksPerQuestion: 5 }, 
    ]
  },
  'science-p3-wa2': {
    displayName: 'Primary 3 Science — WA2', level: 'P3', subject: 'Science', paperCode: 'WA2',
    durationMinutes: 30, totalMarks: 20, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 6, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 2, marksPerQuestion: 4 }, 
    ]
  },
  'science-p3-wa3': {
    displayName: 'Primary 3 Science — WA3', level: 'P3', subject: 'Science', paperCode: 'WA3',
    durationMinutes: 30, totalMarks: 20, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 6, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 2, marksPerQuestion: 4 },
    ]
  },
  'science-p3-eoy': {
    displayName: 'Primary 3 Science — EOY', level: 'P3', subject: 'Science', paperCode: 'EOY',
    durationMinutes: 90, totalMarks: 70, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 20, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 5, marksPerQuestion: 6 },
    ]
  },

  'science-p4-wa1': {
    displayName: 'Primary 4 Science — WA1', level: 'P4', subject: 'Science', paperCode: 'WA1',
    durationMinutes: 35, totalMarks: 25, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 8, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 2, marksPerQuestion: 4 },
    ]
  },
  'science-p4-wa2': {
    displayName: 'Primary 4 Science — WA2', level: 'P4', subject: 'Science', paperCode: 'WA2',
    durationMinutes: 45, totalMarks: 35, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 3, marksPerQuestion: 5 },
    ]
  },
  'science-p4-wa3': {
    displayName: 'Primary 4 Science — WA3', level: 'P4', subject: 'Science', paperCode: 'WA3',
    durationMinutes: 45, totalMarks: 35, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer in complete sentences.', questionType: 'open_ended', questionCount: 3, marksPerQuestion: 5 },
    ]
  },
  'science-p4-eoy': {
    displayName: 'Primary 4 Science — EOY', level: 'P4', subject: 'Science', paperCode: 'EOY',
    durationMinutes: 105, totalMarks: 80, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 22, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 6, marksPerQuestion: 6 },
    ]
  },

  'science-p5-wa1': {
    displayName: 'Primary 5 Science — WA1', level: 'P5', subject: 'Science', paperCode: 'WA1',
    durationMinutes: 40, totalMarks: 30, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 2, marksPerQuestion: 5 },
    ]
  },
  'science-p5-wa2': {
    displayName: 'Primary 5 Science — WA2', level: 'P5', subject: 'Science', paperCode: 'WA2',
    durationMinutes: 50, totalMarks: 40, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 12, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 3, marksPerQuestion: 5 },
    ]
  },
  'science-p5-wa3': {
    displayName: 'Primary 5 Science — WA3', level: 'P5', subject: 'Science', paperCode: 'WA3',
    durationMinutes: 50, totalMarks: 40, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 12, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 3, marksPerQuestion: 5 },
    ]
  },
  'science-p5-eoy': {
    displayName: 'Primary 5 Science — EOY', level: 'P5', subject: 'Science', paperCode: 'EOY',
    durationMinutes: 105, totalMarks: 100, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 28, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 7, marksPerQuestion: 6 },
    ]
  },

  'science-p6-wa1': {
    displayName: 'Primary 6 Science — WA1', level: 'P6', subject: 'Science', paperCode: 'WA1',
    durationMinutes: 45, totalMarks: 35, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 10, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 3, marksPerQuestion: 5 },
    ]
  },
  'science-p6-wa2': {
    displayName: 'Primary 6 Science — WA2', level: 'P6', subject: 'Science', paperCode: 'WA2',
    durationMinutes: 60, totalMarks: 50, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 14, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 4, marksPerQuestion: 5 },
    ]
  },
  'science-p6-prelim': {
    displayName: 'Primary 6 Science — PSLE Format', level: 'P6', subject: 'Science', paperCode: 'PSLE',
    durationMinutes: 105, totalMarks: 100, calculatorAllowed: false,
    sections: [
      { id: 'sec-a', label: 'Booklet A', title: 'Multiple Choice', instructions: 'Choose the correct answer.', questionType: 'mcq', questionCount: 28, marksPerQuestion: 2 },
      { id: 'sec-b', label: 'Booklet B', title: 'Open-Ended', instructions: 'Answer using the CER framework.', questionType: 'open_ended', questionCount: 7, marksPerQuestion: 6 }, 
    ]
  },


  // ══════════════════════════════════════════════════════════════════════════
  // 3. ENGLISH (P3 - P6)  
  // ══════════════════════════════════════════════════════════════════════════

  'english-p3-wa1': {
    displayName: 'Primary 3 English — WA1', level: 'P3', subject: 'English', paperCode: 'WA1',
    durationMinutes: 30, totalMarks: 20,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Grammar MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-b', label: 'Section B', title: 'Vocabulary MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Vocabulary'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Grammar Cloze'], questionCount: 5, marksPerQuestion: 1 },
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
      { id: 'sec-d', label: 'Section D', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Grammar Cloze'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', topics: ['Synthesis'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-f', label: 'Section F', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 10 }
    ]
  },
  'english-p3-eoy': {
    displayName: 'Primary 3 English — EOY (Paper 2)', level: 'P3', subject: 'English', paperCode: 'EOY',
    durationMinutes: 75, totalMarks: 50,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Comprehension MCQ', instructions: 'Read the passage carefully and answer the questions.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 5 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 14, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Grammar Cloze'], questionCount: 8, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Editing', instructions: 'Correct the spelling and grammar errors.', questionType: 'editing', topics: ['Editing'], questionCount: 4, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', topics: ['Synthesis'], questionCount: 3, marksPerQuestion: 1 },
      { id: 'sec-f', label: 'Section F', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 16 }
    ]
  },

  'english-p4-wa1': {
    displayName: 'Primary 4 English — WA1', level: 'P4', subject: 'English', paperCode: 'WA1',
    durationMinutes: 35, totalMarks: 25,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Comprehension MCQ', instructions: 'Read the passage carefully and answer the questions.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 5 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Grammar Cloze'], questionCount: 5, marksPerQuestion: 1 },
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
      { id: 'sec-c', label: 'Section C', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Grammar Cloze'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 20 },
    ]
  },
  'english-p4-eoy': {
    displayName: 'Primary 4 English — EOY (Paper 2)', level: 'P4', subject: 'English', paperCode: 'EOY',
    durationMinutes: 90, totalMarks: 65,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Comprehension MCQ', instructions: 'Read the passage carefully and answer the questions.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 5 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 15, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Cloze Passages', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Grammar Cloze', 'Comprehension Cloze'], questionCount: 12, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Editing', instructions: 'Correct the spelling and grammar errors.', questionType: 'editing', topics: ['Editing'], questionCount: 8, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', topics: ['Synthesis'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-f', label: 'Section F', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 20 },
    ]
  },

  'english-p5-wa1': {
    displayName: 'Primary 5 English — WA1', level: 'P5', subject: 'English', paperCode: 'WA1',
    durationMinutes: 45, totalMarks: 35,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Visual Text', instructions: 'Study the flyer carefully and answer the questions.', questionType: 'visual_text', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 5 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Grammar Cloze'], questionCount: 10, marksPerQuestion: 1 },
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
      { id: 'sec-c', label: 'Section C', title: 'Cloze Passages', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Grammar Cloze', 'Comprehension Cloze'], questionCount: 10, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', topics: ['Synthesis'], questionCount: 5, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 20 },
    ]
  },
  'english-p5-eoy': {
    displayName: 'Primary 5 English — EOY (Paper 2)', level: 'P5', subject: 'English', paperCode: 'EOY',
    durationMinutes: 110, totalMarks: 95,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Visual Text', instructions: 'Study the flyer carefully and answer the questions.', questionType: 'visual_text', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 8 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 20, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Cloze Passages', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Grammar Cloze', 'Comprehension Cloze'], questionCount: 25, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Editing', instructions: 'Correct the errors.', questionType: 'editing', topics: ['Editing'], questionCount: 12, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', topics: ['Synthesis'], questionCount: 5, marksPerQuestion: 2 },
      { id: 'sec-f', label: 'Section F', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 20 },
    ]
  },

  'english-p6-wa1': {
    displayName: 'Primary 6 English — WA1', level: 'P6', subject: 'English', paperCode: 'WA1',
    durationMinutes: 50, totalMarks: 40,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Visual Text', instructions: 'Study the flyer carefully and answer the questions.', questionType: 'visual_text', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 8 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 7, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Grammar Cloze', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Grammar Cloze'], questionCount: 10, marksPerQuestion: 1 },
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
  'english-p6-prelim': {
    displayName: 'Primary 6 English — PSLE Format (Paper 2)', level: 'P6', subject: 'English', paperCode: 'PSLE',
    durationMinutes: 110, totalMarks: 95,
    sections: [
      { id: 'sec-a', label: 'Section A', title: 'Visual Text', instructions: 'Study the flyer carefully and answer the questions.', questionType: 'visual_text', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 8 },
      { id: 'sec-b', label: 'Section B', title: 'Grammar & Vocab MCQ', instructions: 'Choose the correct answer.', questionType: 'mcq', topics: ['Grammar', 'Vocabulary'], questionCount: 20, marksPerQuestion: 1 },
      { id: 'sec-c', label: 'Section C', title: 'Cloze Passages', instructions: 'Fill in the blanks.', questionType: 'cloze', topics: ['Grammar Cloze', 'Comprehension Cloze'], questionCount: 25, marksPerQuestion: 1 },
      { id: 'sec-d', label: 'Section D', title: 'Editing', instructions: 'Correct the spelling and grammar errors.', questionType: 'editing', topics: ['Editing'], questionCount: 12, marksPerQuestion: 1 },
      { id: 'sec-e', label: 'Section E', title: 'Synthesis', instructions: 'Rewrite the sentences.', questionType: 'short_ans', topics: ['Synthesis'], questionCount: 5, marksPerQuestion: 2 },
      { id: 'sec-f', label: 'Section F', title: 'Comprehension Open-Ended', instructions: 'Read the passage carefully.', questionType: 'comprehension', topics: ['Comprehension'], questionCount: 1, marksPerQuestion: 20 }
    ]
  },

};

// ── EXPORTS & ENGINE UTILITIES ─────────────────────────────────────────────

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