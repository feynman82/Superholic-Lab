/**
 * lib/api/quest-pedagogy.js
 * Pure module — no DB access, no side effects.
 *
 * Owns:
 *   - SYLLABUS_DEPENDENCIES map (canonical; imported by handlers.js for BKT analysis)
 *   - deriveTransferTopics() — 2 transfer topics for Day 3
 *   - buildQuestSteps() — constructs the 3-element steps config per QUEST_PAGE_SPEC §5
 */

// ─── Syllabus dependency map ─────────────────────────────────────────────────
// Keys are topic names exactly as they appear in question_bank.topic.
// Values are prerequisite / closely related topics used for:
//   (a) handleAnalyzeWeakness root-cause detection
//   (b) deriveTransferTopics for Day 3 transfer questions

export const SYLLABUS_DEPENDENCIES = {
  mathematics: {
    'Ratio':                     ['Fractions', 'Multiplication and Division'],
    'Percentage':                ['Fractions', 'Decimals'],
    'Speed':                     ['Rate', 'Time', 'Fractions', 'Decimals'],
    'Rate':                      ['Whole Numbers', 'Multiplication and Division'],
    'Average':                   ['Addition and Subtraction', 'Multiplication and Division'],
    'Fractions':                 ['Whole Numbers', 'Multiplication Tables'],
    'Decimals':                  ['Fractions', 'Whole Numbers'],
    'Algebra':                   ['Whole Numbers', 'Fractions'],
    'Circles':                   ['Area and Perimeter', 'Geometry'],
    'Volume':                    ['Area and Perimeter', 'Fractions'],
    'Area of Triangle':          ['Area and Perimeter', 'Fractions'],
    'Factors and Multiples':     ['Whole Numbers', 'Multiplication Tables'],
    'Pie Charts':                ['Fractions', 'Percentage', 'Data Analysis'],
    'Data Analysis':             ['Whole Numbers', 'Fractions'],
    'Symmetry':                  ['Geometry', 'Shapes and Patterns'],
    'Angles and Geometry':       ['Angles', 'Geometry'],
    'Area and Perimeter':        ['Whole Numbers', 'Multiplication and Division'],
  },
  science: {
    'Energy':        ['Heat', 'Light', 'Matter'],
    'Cycles':        ['Diversity'],
    'Systems':       ['Diversity', 'Cells'],
    'Interactions':  ['Magnets', 'Forces'],
    'Forces':        ['Energy', 'Interactions'],
    'Cells':         ['Diversity', 'Systems'],
    'Heat':          ['Matter', 'Energy'],
    'Light':         ['Energy'],
  },
  english: {
    'Synthesis': ['Grammar', 'Vocabulary'],
    'Comprehension':                ['Vocabulary', 'Grammar'],
    'Cloze':                        ['Grammar', 'Vocabulary'],
    'Editing':                      ['Grammar', 'Vocabulary'],
    'Summary Writing':              ['Comprehension', 'Vocabulary'],
    'Grammar':                      ['Vocabulary'],
    'Vocabulary':                   ['Grammar'],
  },
};

// ─── Transfer topic derivation ────────────────────────────────────────────────

/**
 * Returns up to 2 transfer topic names for Day 3 "transfer questions".
 * These test depth: can the student apply the concept in a novel context?
 *
 * @param {string} subject - 'mathematics' | 'science' | 'english'
 * @param {string} topic   - Quest topic (matches question_bank.topic)
 * @returns {string[]}     - Array of up to 2 topic names
 */
export function deriveTransferTopics(subject, topic) {
  const deps = (SYLLABUS_DEPENDENCIES[subject.toLowerCase()] || {})[topic] || [];
  // Return first 2 from the dependency list. If fewer than 2, fall back to
  // generic within-subject options.
  if (deps.length >= 2) return deps.slice(0, 2);
  if (deps.length === 1) {
    const fallbacks = _fallbackTransfer(subject, topic, deps[0]);
    return [deps[0], fallbacks];
  }
  // No deps defined — use generic fallback
  return _fallbackTransferPair(subject);
}

function _fallbackTransfer(subject, topic, exclude) {
  const subjectFallbacks = {
    mathematics: ['Whole Numbers', 'Fractions', 'Decimals', 'Percentage', 'Ratio'],
    science:     ['Diversity', 'Heat', 'Energy', 'Cycles'],
    english:     ['Grammar', 'Vocabulary', 'Comprehension'],
  };
  const pool = (subjectFallbacks[subject.toLowerCase()] || []).filter(t => t !== topic && t !== exclude);
  return pool[0] || 'Whole Numbers';
}

function _fallbackTransferPair(subject) {
  const pairs = {
    mathematics: ['Whole Numbers', 'Fractions'],
    science:     ['Diversity',     'Energy'],
    english:     ['Grammar',       'Vocabulary'],
  };
  return pairs[subject.toLowerCase()] || ['Whole Numbers', 'Fractions'];
}

// ─── Difficulty band definitions ─────────────────────────────────────────────

// Per QUEST_PAGE_SPEC §16 Phase 3 execution plan:
//   P3-P4 (junior):
//     Day 1: 5 Foundation, 5 Standard, 2 Advanced          (12 total)
//     Day 3: 4 Standard, 2 Advanced, 2 transfer            (8 total)
//   P5-P6 (senior):
//     Day 1: 4 Foundation, 4 Standard, 2 Advanced, 2 HOTS  (12 total)
//     Day 3: 3 Advanced, 3 HOTS, 2 transfer                (8 total)

const JUNIOR_LEVELS = new Set(['primary 3', 'primary-3', 'p3', 'primary 4', 'primary-4', 'p4']);

function isJuniorLevel(level) {
  return JUNIOR_LEVELS.has(String(level).toLowerCase().trim());
}

function day1Bands(level) {
  if (isJuniorLevel(level)) {
    return [
      'Foundation','Foundation','Foundation','Foundation','Foundation',
      'Standard','Standard','Standard','Standard','Standard',
      'Advanced','Advanced',
    ];
  }
  return [
    'Foundation','Foundation','Foundation','Foundation',
    'Standard','Standard','Standard','Standard',
    'Advanced','Advanced',
    'HOTS','HOTS',
  ];
}

function day3Bands(level) {
  if (isJuniorLevel(level)) {
    return ['Standard','Standard','Standard','Standard','Advanced','Advanced'];
  }
  return ['Advanced','Advanced','Advanced','HOTS','HOTS','HOTS'];
}

// ─── Step builder ─────────────────────────────────────────────────────────────

/**
 * Builds the 3-element steps array per QUEST_PAGE_SPEC §5.
 * The description strings are filled in by the narrative AI in handleGenerateQuest;
 * this function sets all the structural / config fields.
 *
 * @param {Object} opts
 * @param {string} opts.subject           - e.g. 'mathematics'
 * @param {string} opts.level             - e.g. 'primary-5'  (any casing)
 * @param {string} opts.topic             - e.g. 'Fractions'
 * @param {string} [opts.safeLevel]       - URL-safe level e.g. 'primary-5'
 * @param {string} [opts.safeSubject]     - URL-safe subject e.g. 'mathematics'
 * @param {string} [opts.safeTopic]       - URL-safe topic e.g. 'fractions'
 * @param {string[]} [opts.transferTopics]- Override transfer topics (default: derived)
 * @returns {Object[]} 3-element steps array
 */
export function buildQuestSteps({ subject, level, topic, safeSubject, safeLevel, safeTopic, transferTopics }) {
  const sub   = safeSubject  || subject.toLowerCase();
  const lvl   = safeLevel    || level.toLowerCase().replace(/\s+/g, '-');
  const top   = safeTopic    || topic.toLowerCase().replace(/\s+/g, '-');
  const xfer  = transferTopics || deriveTransferTopics(subject, topic);
  const d1    = day1Bands(level);
  const d3    = day3Bands(level);

  return [
    {
      day: 1,
      type: 'quiz',
      title: 'Foundation → Mastery Practice',
      description: '',  // filled by narrative AI
      estimated_minutes: 18,
      action_url: `/pages/quiz.html?subject=${sub}&topic=${top}&level=${lvl}&from_quest=QUEST_ID&step=0`,
      config: {
        question_count: 12,
        difficulty_curve: 'ramping',
        difficulty_bands: d1,
        topic,
        min_passing_score: null,  // Day 1 is exposure + diagnostic; no pass/fail gate
      },
    },
    {
      day: 2,
      type: 'tutor',
      title: 'Socratic Dialogue with Miss Wena',
      description: '',
      estimated_minutes: 15,
      action_url: `/pages/tutor.html?subject=${sub}&topic=${top}&from_quest=QUEST_ID&step=1&mode=socratic`,
      config: {
        scaffold_mode: 'socratic',
        min_messages: 8,          // 4 user + 4 assistant; "Mark Day 2 Complete" disabled below
        topic_anchor: topic,
        diagnostic_carryover: true,   // tutor reads day1_wrong_attempts
        auto_save_note: true,         // /api/summarize-chat called on completion
      },
    },
    {
      day: 3,
      type: 'quiz',
      title: 'Mastery Trial',
      description: '',
      estimated_minutes: 18,
      action_url: `/pages/quiz.html?subject=${sub}&topic=${top}&level=${lvl}&from_quest=QUEST_ID&step=2&mode=mastery`,
      config: {
        question_count: 8,
        difficulty_curve: 'mastery',
        difficulty_bands: d3,
        transfer_topics: xfer,
        topic,
        min_passing_score: 70,  // not a gate; drives outcome branching
      },
    },
  ];
}
