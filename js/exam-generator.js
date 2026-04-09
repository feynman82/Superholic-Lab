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
 *
 * Multiple filenames can be listed for a key (as an array) — all files
 * are fetched and merged before filtering. This allows thin topic-specific
 * files to be combined into a larger pool.
 */
const EXAM_FILE_MAP = {
  // ── P3 ──
  'mathematics:primary-3:broad':   'p3-mathematics-whole-numbers.json',
  'science:primary-3:broad':       'p3-science-diversity.json',
  'english:primary-3:broad':       'p3-english-grammar.json',
  'english:primary-3:cloze':       'p3-english-grammar.json',
  'english:primary-3:editing':     'p3-english-grammar.json',

  // ── P4 ──
  'mathematics:primary-4:broad':   'p4-mathematics.json',
  'science:primary-4:broad':       'p4-science.json',
  'english:primary-4:broad':       'p4-english.json',
  'english:primary-4:cloze':       'p4-english-cloze.json',
  'english:primary-4:editing':     'p4-english-editing.json',

  // ── P5 ──
  'mathematics:primary-5:broad':   'p5-mathematics.json',
  'science:primary-5:broad':       'p5-science.json',
  'english:primary-5:broad':       'p5-english-grammar.json',
  'english:primary-5:cloze':       'p5-english-grammar.json',
  'english:primary-5:editing':     'p5-english-grammar.json',

  // ── P6 ──
  'mathematics:primary-6:broad':   'p6-mathematics-fractions.json',
  'science:primary-6:broad':       'p6-science-cells.json',
  'english:primary-6:broad':       'p6-english-grammar.json',
  'english:primary-6:cloze':       'p6-english-cloze.json',
  'english:primary-6:editing':     'p6-english-editing.json',
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
 * @param {string} subject    - e.g. 'mathematics'
 * @param {string} level      - e.g. 'primary-4'
 * @param {string} [examType] - 'WA1'|'WA2'|'EOY'|'PRELIM'|'PRACTICE' (default: 'PRACTICE')
 * @returns {Promise<object>} ExamPaper
 */
async function generateExam(subject, level, examType) {
  const template = getTemplate(subject, level);
  if (!template) {
    throw new Error(`No exam template found for ${subject} ${level}.`);
  }

  // WA papers use half the question count of full papers
  const resolvedType = examType || 'PRACTICE';
  const scaleFactor = (resolvedType === 'WA1' || resolvedType === 'WA2') ? 0.5 : 1.0;

  // Build each section by picking questions in parallel
  const sectionPromises = template.sections.map(async function(sec) {
    const scaledCount = Math.max(1, Math.round(sec.count * scaleFactor));
    const questions = await pickQuestions(subject, level, sec.type, scaledCount);

    // Log a warning if bank cannot fill the section fully
    if (questions.length < scaledCount) {
      console.warn(
        `[exam-generator] Thin bank: ${subject}:${level}:${sec.type} — ` +
        `needed ${scaledCount}, got ${questions.length}. ` +
        `Run @question-coder to expand this topic file.`
      );
    }

    return {
      ...sec,
      count:       scaledCount,
      questions,
      sectionMarks: questions.length * sec.marksEach,
    };
  });

  const sections = await Promise.all(sectionPromises);

  // Calculate actual total marks (may differ from template if questions are missing)
  const actualTotal = sections.reduce(function(sum, s) { return sum + s.sectionMarks; }, 0);

  return {
    template,
    examType:     resolvedType,
    sections,
    totalMarks:   Math.round(template.totalMarks * scaleFactor),
    actualMarks:  actualTotal,
    duration:     Math.round(template.duration * scaleFactor),
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

/* ─────────────────────────────────────────────────────────────────────────
   ExamGenerator — OO wrapper around generateExam() for the Exam Engine v2.
   Adds support for new template keys (e.g. 'maths-p5-sa2') introduced in
   exam-templates.js alongside the legacy two-arg subject:level format.
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Normalises a new-format template key (e.g. 'maths-p5-sa2') into the
 * subject and level strings expected by the legacy generateExam() function.
 *
 * @param {string} templateKey  - e.g. 'maths-p5-sa2' or 'science-p4-wa2'
 * @returns {{ subject: string, level: string } | null}
 */
function _parseTemplateKey(templateKey) {
  // subject segment is everything before the first '-p' (e.g. 'maths', 'science', 'english')
  const match = templateKey.match(/^(maths|science|english)-(p[3-6])-/i);
  if (!match) return null;

  const subjectMap = {
    maths:   'mathematics',
    science: 'science',
    english: 'english',
  };
  const levelMap = {
    p3: 'primary-3',
    p4: 'primary-4',
    p5: 'primary-5',
    p6: 'primary-6',
  };

  const subject = subjectMap[match[1].toLowerCase()];
  const level   = levelMap[match[2].toLowerCase()];
  return subject && level ? { subject, level } : null;
}

/**
 * ExamGenerator — high-level class used by exam.html and exam-renderer.js.
 *
 * Usage:
 *   const paper = await ExamGenerator.generate('maths-p5-sa2');
 *   const paper = await ExamGenerator.generate('maths-p5-sa2', { scaleFactor: 0.5 });
 */
const ExamGenerator = {

  /**
   * Generates an exam paper from a template key.
   *
   * @param {string} templateKey      - New-format key (e.g. 'maths-p5-sa2') or
   *                                    legacy key (e.g. 'mathematics:primary-4')
   * @param {object} [options={}]     - Optional overrides
   * @param {number} [options.scaleFactor=1]  - Fraction of questions to include (0–1)
   * @param {string} [options.examType]       - Override paper type label
   * @returns {Promise<ExamPaper>}
   */
  async generate(templateKey, options = {}) {
    // Resolve template object
    const template = (typeof getTemplate === 'function')
      ? getTemplate(templateKey)
      : (typeof EXAM_TEMPLATES !== 'undefined' ? EXAM_TEMPLATES[templateKey] : null);

    if (!template) {
      throw new Error(`ExamGenerator: unknown template key "${templateKey}"`);
    }

    // Map new-format key → subject/level for legacy generateExam()
    const parsed = _parseTemplateKey(templateKey);
    if (!parsed) {
      throw new Error(`ExamGenerator: cannot parse template key "${templateKey}" into subject/level`);
    }

    const { subject, level } = parsed;
    const examType = options.examType || template.paperCode || 'PRACTICE';

    // Delegate to the existing functional API
    const paper = await generateExam(subject, level, examType, options);

    // Augment with template metadata from the new schema
    return {
      ...paper,
      templateKey,
      template,
      displayName: template.displayName || paper.template?.label || templateKey,
      instructions: template.instructions || [],
    };
  },

  /**
   * Returns all template keys available for a given level.
   * Delegates to getTemplatesForLevel() from exam-templates.js.
   *
   * @param {string} level  - e.g. 'P5' or 'Primary 5'
   * @returns {string[]} Array of template keys
   */
  listForLevel(level) {
    const normalised = level.replace(/primary\s*/i, 'P').toUpperCase(); // 'Primary 5' → 'P5'
    if (typeof getTemplatesForLevel === 'function') {
      return Object.keys(getTemplatesForLevel(normalised));
    }
    return [];
  },

  /**
   * Returns all template keys available for a given subject.
   * Delegates to getTemplatesForSubject() from exam-templates.js.
   *
   * @param {string} subject  - e.g. 'Maths', 'Science', 'English'
   * @returns {string[]} Array of template keys
   */
  listForSubject(subject) {
    if (typeof getTemplatesForSubject === 'function') {
      return Object.keys(getTemplatesForSubject(subject));
    }
    return [];
  },

  /** Clears the question cache. Delegates to module-level clearExamCache(). */
  clearCache() {
    clearExamCache();
  },
};

// Expose on window (browser) and globalThis (Node.js ESM test context)
if (typeof window !== 'undefined') {
  window.ExamGenerator = ExamGenerator;
}
if (typeof globalThis !== 'undefined') {
  globalThis.ExamGenerator = ExamGenerator;
}

// TEST: In browser console, open pages/exam.html then run:
//   ExamGenerator.generate('maths-p5-sa2').then(p => console.log(p.displayName, p.totalMarks))
//   → should log "Primary 5 Mathematics — Semestral Assessment 2 (SA2)" 100
//   ExamGenerator.listForLevel('P5') → should include 'maths-p5-sa2', 'science-p5-sa2', 'english-p5-sa2'
