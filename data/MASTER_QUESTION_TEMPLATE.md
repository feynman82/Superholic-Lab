# SUPERHOLIC LAB — MASTER QUESTION TEMPLATE
# Version 1.0 | Source of truth for all question formats
# Reference: MOE/SEAB PSLE exam formats 2025-2026

═══════════════════════════════════════════════════════════════
QUESTION TYPES BY SUBJECT
═══════════════════════════════════════════════════════════════

MATHEMATICS (3 types)
  Type 1: mcq         — Multiple Choice (Paper 1 Booklet A)
  Type 2: short_ans   — Short Answer / numerical (Paper 1 Booklet B)
  Type 3: word_problem — Structured word problem (Paper 2)

SCIENCE (2 types)
  Type 1: mcq         — Multiple Choice (Booklet A, 2 marks each)
  Type 2: open_ended  — Open-Ended written answer (Booklet B, 2-5 marks)

ENGLISH (4 types)
  Type 1: mcq         — Grammar / Vocabulary MCQ
  Type 2: cloze       — Grammar Cloze (fill blank from options)
  Type 3: editing     — Spot and correct the error
  Type 4: comprehension — Read passage, answer question

═══════════════════════════════════════════════════════════════
UNIVERSAL JSON SCHEMA
═══════════════════════════════════════════════════════════════

Every question MUST have these base fields:
- id: unique, format {level}-{subject}-{topic}-{number}
- subject: Mathematics | Science | English
- level: Primary 2 | Primary 3 | Primary 4 | etc
- topic, sub_topic, difficulty, type, marks
- question_text, correct_answer, worked_solution
- examiner_note (string or null)

Supported types: mcq, short_ans, word_problem, open_ended, cloze, editing, comprehension

See the full template with samples in Google Drive:
C:\SLabDrive\01 - Platform Intelligence\Master_Question_Template.md
