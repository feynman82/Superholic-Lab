/**
 * exam-generator.js
 * Assembles a full practice exam paper from the question bank JSON files
 * using a template definition from exam-templates.js.
 *
 * Depends on: exam-templates.js (must be loaded first)
 *
 * Main export: generateExam(subject, level) → Promise<ExamPaper>
 *
 * ExamPaper structure:
 *   {
 *     template:  { label, totalMarks, duration, sections },
 *     sections:  [
 *       {
 *         id, label, instructions, type, marksEach,
 *         questions: [ ...question objects from JSON ]
 *       }
 *     ],
 *     totalMarks: number,
 *     generatedAt: ISO string
 *   }
 *
 * TEST: Call generateExam('mathematics', 'primary-4') in browser console.
 *       Should resolve with an object whose sections[0].questions.length === 10 (MCQ).
 */

'use strict';

// ── Constants ────────────────────────────────────────────────────────────────

/** Base path to question bank JSON files (relative to pages/) */
const EXAM_DATA_BASE = '../data/questions/';

/**
 * File map: `subject:level:type` → JSON filename.
 * For types without dedicated files (mcq, short_ans, word_problem), the broad
 * file is used and questions are filtered by type in memory.
 */
const EXAM_FILE_MAP = {
  'mathematics:primary-4:broad':   'p4-mathematics.json',
  'mathematics:primary-5:broad':   'p5-mathematics.json',
  'mathematics:primary-6:broad':   'p6-mathematics.json',
  'science:primary-4:broad':       'p4-science.json',
  'science:primary-5:broad':       'p5-science.json',
  'science:primary-6:broad':       'p6-science.json',
  'english:primary-4:broad':       'p4-english.json',
  'english:primary-4:cloze':       'p4-english-cloze.json',
  'english:primary-4:editing':     'p4-english-editing.json',
  'english:primary-5:broad':       'p5-english.json',
  'english:primary-5:cloze':       'p5-english-cloze.json',
  'english:primary-5:editing':     'p5-english-editing.json',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a new array with elements in random order (Fisher-Yates).
 * Does not mutate the input array.
 *
 * @param {Array} arr
 * @returns {Array}
 */
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Fetches and parses a JSON file. Resolves with the parsed array.
 * Throws on HTTP errors or JSON parse failures.
 *
 * @param {string} filename - JSON filename within EXAM_DATA_BASE
 * @returns {Promise<Array>}
 */
async function fetchQuestionFile(filename) {
  const url = EXAM_DATA_BASE + filename;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load question file: ${filename} (HTTP ${res.status})`);
  return res.json();
}

/**
 * Resolves the filename for a given subject/level/type combination.
 * Cloze and editing types have dedicated files; all others use the broad file.
 *
 * @param {string} subject
 * @param {string} level
 * @param {string} type
 * @returns {string|null} filename or null if not found
 */
function resolveFilename(subject, level, type) {
  const dedicatedKey = `${subject}:${level}:${type}`;
  if (EXAM_FILE_MAP[dedicatedKey]) return EXAM_FILE_MAP[dedicatedKey];

  const broadKey = `${subject}:${level}:broad`;
  return EXAM_FILE_MAP[broadKey] || null;
}

// ── Question bank cache ──────────────────────────────────────────────────────

/** In-memory cache: filename → question array */
const _questionCache = {};

/**
 * Returns all questions for a filename, loading and caching on first call.
 *
 * @param {string} filename
 * @returns {Promise<Array>}
 */
async function getCachedQuestions(filename) {
  if (!_questionCache[filename]) {
    _questionCache[filename] = await fetchQuestionFile(filename);
  }
  return _questionCache[filename];
}

// ── Core exam assembly ───────────────────────────────────────────────────────

/**
 * Selects `count` questions of the given type from the question bank.
 * For cloze/editing, each "question" item in the bank IS one exam item
 * (a full passage), so we pick up to `count` passages.
 *
 * @param {string} subject
 * @param {string} level
 * @param {string} type
 * @param {number} count
 * @returns {Promise<Array>} array of question objects
 */
async function pickQuestions(subject, level, type, count) {
  const filename = resolveFilename(subject, level, type);
  if (!filename) {
    console.warn(`[exam-generator] No file found for ${subject}:${level}:${type} — section will be empty.`);
    return [];
  }

  const all = await getCachedQuestions(filename);

  // Dedicated files (cloze, editing) already contain only that type.
  // Broad files contain mixed types — filter to the requested type.
  const pool = all.filter(function(q) { return q.type === type; });

  if (pool.length === 0) {
    console.warn(`[exam-generator] No questions of type '${type}' in ${filename}.`);
    return [];
  }

  // Shuffle and take up to `count`; if not enough, return what we have
  return shuffleArray(pool).slice(0, count);
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a complete exam paper for a given subject and level.
 * Uses the template from exam-templates.js to determine sections and counts.
 *
 * @param {string} subject - e.g. 'mathematics'
 * @param {string} level   - e.g. 'primary-4'
 * @returns {Promise<object>} ExamPaper
 */
async function generateExam(subject, level) {
  const template = getTemplate(subject, level);
  if (!template) {
    throw new Error(`No exam template found for ${subject} ${level}.`);
  }

  // Build each section by picking questions in parallel
  const sectionPromises = template.sections.map(async function(sec) {
    const questions = await pickQuestions(subject, level, sec.type, sec.count);
    return {
      ...sec,
      questions,
      sectionMarks: questions.length * sec.marksEach,
    };
  });

  const sections = await Promise.all(sectionPromises);

  // Calculate actual total marks (may differ from template if questions are missing)
  const actualTotal = sections.reduce(function(sum, s) { return sum + s.sectionMarks; }, 0);

  return {
    template,
    sections,
    totalMarks:   template.totalMarks,
    actualMarks:  actualTotal,
    duration:     template.duration,
    generatedAt:  new Date().toISOString(),
  };
}

/**
 * Clears the in-memory question cache.
 * Call this if the user navigates away and comes back, to re-randomise.
 */
function clearExamCache() {
  Object.keys(_questionCache).forEach(function(k) { delete _questionCache[k]; });
}

// TEST: generateExam('mathematics', 'primary-4').then(p => console.log(p.sections.map(s => s.questions.length)))
//       should log [10, 10, 5] (MCQ, short_ans, word_problem)
// TEST: generateExam('english', 'primary-4').then(p => console.log(p.sections.map(s => s.type)))
//       should log ['mcq', 'cloze', 'editing']
