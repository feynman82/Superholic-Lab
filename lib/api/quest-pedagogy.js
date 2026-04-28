/**
 * lib/api/quest-pedagogy.js
 * Pure module — no DB access, no side effects.
 *
 * Owns:
 *   - SYLLABUS_DEPENDENCIES map (canonical MOE syllabus DAG; topic + sub-topic level)
 *   - getPrerequisites() / getSubTopics() — accessor helpers (preferred over raw map)
 *   - deriveTransferTopics() — 2 transfer topics for Day 3
 *   - buildQuestSteps() — constructs the 3-element steps config per QUEST_PAGE_SPEC §5
 */

// ─── Syllabus dependency map ─────────────────────────────────────────────────
// Keys are topic names exactly as they appear in question_bank.topic (Title Case).
// Each entry has:
//   - prerequisites: topic names that must be mastered before this topic. Used
//     by handleAnalyzeWeakness for BKT root-cause detection, and by
//     deriveTransferTopics() to pick Day 3 transfer questions.
//   - sub_topics: canonical MOE syllabus sub-topics. Reference content for
//     question generation, sub-topic-level diagnostics, and future UI.

export const SYLLABUS_DEPENDENCIES = {
  mathematics: {
    'Whole Numbers': {
      prerequisites: [],
      sub_topics: [
        'Counting To One Hundred',
        'Number Notation And Place Values',
        'Comparing And Ordering Numbers',
        'Patterns In Number Sequences',
        'Rounding Numbers To The Nearest Ten, Hundred Or Thousand',
        'Order Of Operations',
        'Use Of Brackets',
      ],
    },
    'Multiplication Tables': {
      prerequisites: ['Whole Numbers'],
      sub_topics: [
        'Multiplication Tables Of Two, Three, Four, Five And Ten',
        'Multiplication Tables Of Six, Seven, Eight And Nine',
        'Mental Calculation Involving Multiplication Within Tables',
      ],
    },
    'Addition and Subtraction': {
      prerequisites: ['Whole Numbers'],
      sub_topics: [
        'Concepts Of Addition And Subtraction',
        'Addition And Subtraction Within One Hundred',
        'Addition And Subtraction Algorithms',
        'Mental Calculation Involving Addition And Subtraction',
      ],
    },
    'Multiplication and Division': {
      prerequisites: ['Multiplication Tables', 'Addition and Subtraction'],
      sub_topics: [
        'Concepts Of Multiplication And Division',
        'Multiplication And Division Algorithms',
        'Division With Remainder',
        'Multiplying And Dividing By Ten, One Hundred And One Thousand',
        'Mental Calculation Involving Multiplication And Division',
      ],
    },
    'Fractions': {
      prerequisites: ['Whole Numbers', 'Multiplication Tables', 'Multiplication and Division'],
      sub_topics: [
        'Fraction As Part Of A Whole',
        'Equivalent Fractions',
        'Comparing And Ordering Fractions',
        'Mixed Numbers',
        'Improper Fractions',
        'Adding Unlike Fractions',
        'Subtracting Unlike Fractions',
        'Fractions Of A Set',
        'Fraction Multiplied By Fraction',
        'Division By A Proper Fraction',
      ],
    },
    'Decimals': {
      prerequisites: ['Whole Numbers', 'Fractions'],
      sub_topics: [
        'Notation And Place Values Of Decimals',
        'Comparing And Ordering Decimals',
        'Converting Fractions To Decimals',
        'Converting Decimals To Fractions',
        'Rounding Decimals',
        'Four Operations With Decimals',
        'Multiplying And Dividing Decimals By Ten, One Hundred And One Thousand',
      ],
    },
    'Percentage': {
      prerequisites: ['Fractions', 'Decimals'],
      sub_topics: [
        'Expressing Part Of A Whole As Percentage',
        'Finding Percentage Part Of A Whole',
        'Discount, Goods And Services Tax And Annual Interest',
        'Finding The Whole Given A Part And Percentage',
        'Percentage Increase And Decrease',
      ],
    },
    'Ratio': {
      prerequisites: ['Fractions', 'Multiplication and Division'],
      sub_topics: [
        'Part-Whole Ratio',
        'Comparison Ratio',
        'Equivalent Ratios',
        'Expressing Ratio In Simplest Form',
        'Dividing A Quantity In A Given Ratio',
        'Ratio Of Three Quantities',
        'Relationship Between Fraction And Ratio',
        'Ratio Word Problems',
      ],
    },
    'Rate': {
      prerequisites: ['Whole Numbers', 'Multiplication and Division'],
      sub_topics: [
        'Rate As Amount Of Quantity Per Unit',
        'Finding Rate, Total Amount Or Number Of Units',
      ],
    },
    'Speed': {
      prerequisites: ['Rate', 'Decimals'],
      sub_topics: [
        'Concepts Of Speed',
        'Calculating Distance, Time And Speed',
        'Average Speed',
      ],
    },
    'Average': {
      prerequisites: ['Whole Numbers', 'Addition and Subtraction', 'Multiplication and Division'],
      sub_topics: [
        'Average As Total Value Divided By Number Of Data',
        'Relationship Between Average, Total Value And Number Of Data',
      ],
    },
    'Algebra': {
      prerequisites: ['Whole Numbers', 'Fractions'],
      sub_topics: [
        'Using A Letter To Represent An Unknown Number',
        'Interpretation Of Algebraic Expressions',
        'Simplifying Linear Expressions',
        'Evaluating Linear Expressions By Substitution',
        'Solving Simple Linear Equations',
      ],
    },
    'Angles': {
      prerequisites: ['Geometry'],
      sub_topics: [
        'Concepts Of Angle',
        'Right Angles',
        'Measuring Angles In Degrees',
        'Drawing Angles',
        'Angles On A Straight Line',
        'Angles At A Point',
        'Vertically Opposite Angles',
        'Finding Unknown Angles',
      ],
    },
    'Geometry': {
      prerequisites: ['Shapes and Patterns'],
      sub_topics: [
        'Perpendicular And Parallel Lines',
        'Properties Of Rectangle And Square',
        'Properties Of Triangles',
        'Properties Of Parallelogram, Rhombus And Trapezium',
      ],
    },
    'Area and Perimeter': {
      prerequisites: ['Whole Numbers', 'Multiplication and Division'],
      sub_topics: [
        'Concepts Of Area And Perimeter',
        'Area And Perimeter Of Rectangle And Square',
        'Finding One Dimension Given Area Or Perimeter',
        'Area And Perimeter Of Composite Rectilinear Figures',
      ],
    },
    'Area of Triangle': {
      prerequisites: ['Area and Perimeter', 'Geometry'],
      sub_topics: [
        'Concepts Of Base And Height',
        'Calculating Area Of Triangle',
        'Area Of Composite Figures With Triangles',
      ],
    },
    'Circles': {
      prerequisites: ['Area and Perimeter', 'Geometry', 'Decimals'],
      sub_topics: [
        'Area And Circumference Of Circle',
        'Area And Perimeter Of Semicircle And Quarter Circle',
        'Area And Perimeter Of Composite Figures With Circles',
      ],
    },
    'Volume': {
      prerequisites: ['Whole Numbers', 'Multiplication and Division', 'Area and Perimeter'],
      sub_topics: [
        'Building Solids With Unit Cubes',
        'Measuring Volume In Cubic Units',
        'Volume Of Cube And Cuboid',
        'Finding Volume Of Liquid In Rectangular Tank',
        'Finding Unknown Dimension Given Volume',
      ],
    },
    'Symmetry': {
      prerequisites: ['Geometry'],
      sub_topics: [
        'Identifying Symmetric Figures',
        'Lines Of Symmetry',
        'Completing Symmetric Figures',
      ],
    },
    'Shapes and Patterns': {
      prerequisites: [],
      sub_topics: [
        'Identifying And Naming Two-Dimensional Shapes',
        'Classifying Three-Dimensional Shapes',
        'Making Patterns With Two-Dimensional Shapes',
      ],
    },
    'Factors and Multiples': {
      prerequisites: ['Whole Numbers', 'Multiplication and Division'],
      sub_topics: [
        'Identifying Factors And Multiples',
        'Finding Common Factors',
        'Finding Common Multiples',
      ],
    },
    'Pie Charts': {
      prerequisites: ['Fractions', 'Percentage', 'Data Analysis'],
      sub_topics: [
        'Reading And Interpreting Pie Charts',
        'Solving Problems Using Pie Chart Data',
      ],
    },
    'Data Analysis': {
      prerequisites: ['Whole Numbers'],
      sub_topics: [
        'Reading Picture Graphs',
        'Reading Bar Graphs',
        'Reading Line Graphs',
        'Reading Tables',
      ],
    },
  },
  science: {
    'Diversity': {
      prerequisites: [],
      sub_topics: [
        'General Characteristics Of Living And Non-Living Things',
        'Classification Of Living And Non-Living Things',
        'Diversity Of Materials And Their Properties',
      ],
    },
    'Matter': {
      prerequisites: ['Diversity'],
      sub_topics: [
        'States Of Matter',
        'Properties Of Solids, Liquids And Gases',
        'Changes In State Of Matter',
      ],
    },
    'Systems': {
      prerequisites: ['Diversity'],
      sub_topics: [
        'Plant Parts And Functions',
        'Human Digestive System',
        'Plant Respiratory And Circulatory Systems',
        'Human Respiratory And Circulatory Systems',
        'Electrical Systems And Circuits',
      ],
    },
    'Cycles': {
      prerequisites: ['Diversity'],
      sub_topics: [
        'Life Cycles Of Insects',
        'Life Cycles Of Amphibians',
        'Life Cycles Of Flowering Plants',
        'Life Cycles Of Fungi',
        'Reproduction In Plants And Animals',
        'Stages Of The Water Cycle',
      ],
    },
    'Interactions': {
      prerequisites: ['Diversity', 'Systems'],
      sub_topics: [
        'Interaction Of Magnetic Forces',
        'Interaction Of Frictional, Gravitational And Elastic Spring Forces',
        'Interactions Within The Environment',
        'Food Chains And Food Webs',
      ],
    },
    'Energy': {
      prerequisites: ['Diversity', 'Matter'],
      sub_topics: [
        'Light Energy Forms And Uses',
        'Heat Energy Forms And Uses',
        'Photosynthesis And Energy Pathways',
        'Energy Conversion In Everyday Objects',
      ],
    },
    'Forces': {
      prerequisites: ['Interactions'],
      sub_topics: [
        'Push And Pull Forces',
        'Effects Of Forces On Objects',
        'Frictional Force And Its Applications',
        'Gravitational Force',
        'Elastic Spring Force',
      ],
    },
    'Heat': {
      prerequisites: ['Energy'],
      sub_topics: [
        'Sources Of Heat',
        'Effects Of Heat Gain And Heat Loss',
        'Temperature And Use Of Thermometers',
        'Good And Poor Conductors Of Heat',
      ],
    },
    'Light': {
      prerequisites: ['Energy'],
      sub_topics: [
        'Sources Of Light',
        'Reflection Of Light',
        'Formation Of Shadows',
        'Transparent, Translucent And Opaque Materials',
      ],
    },
    'Cells': {
      prerequisites: ['Systems'],
      sub_topics: [
        'Plant And Animal Cells',
        'Parts Of A Cell And Their Functions',
        'Cell Division',
      ],
    },
  },
  english: {
    'Grammar': {
      prerequisites: [],
      sub_topics: [
        'Simple Present And Past Tenses',
        'Perfect And Continuous Tenses',
        'Subject-Verb Agreement',
        'Singular And Plural Nouns',
        'Prepositions And Phrasal Verbs',
        'Conjunctions',
        'Active And Passive Voice',
        'Relative Pronouns',
      ],
    },
    'Vocabulary': {
      prerequisites: [],
      sub_topics: [
        'Thematic Vocabulary Recall',
        'Contextual Vocabulary Meaning',
        'Synonyms And Antonyms',
      ],
    },
    'Cloze': {
      prerequisites: ['Grammar', 'Vocabulary'],
      sub_topics: [
        'Grammar Cloze With Word Bank',
        'Vocabulary Cloze With Dropdowns',
        'Comprehension Free-Text Cloze',
      ],
    },
    'Editing': {
      prerequisites: ['Grammar', 'Vocabulary'],
      sub_topics: [
        'Correcting Spelling Errors',
        'Correcting Grammatical Errors',
      ],
    },
    'Comprehension': {
      prerequisites: ['Grammar', 'Vocabulary'],
      sub_topics: [
        'Direct Visual Retrieval',
        'True Or False With Reason',
        'Pronoun Referent Table',
        'Sequencing Of Events',
        'Deep Inference And Claim Evidence Reasoning',
      ],
    },
    'Synthesis': {
      prerequisites: ['Grammar', 'Vocabulary'],
      sub_topics: [
        'Combining With Conjunctions',
        'Relative Clauses',
        'Participle Phrases',
        'Conditional Sentences',
        'Reported Speech Transformation',
        'Active To Passive Voice Transformation',
        'Inversion',
      ],
    },
    'Summary Writing': {
      prerequisites: ['Comprehension', 'Synthesis'],
      sub_topics: [
        'Identifying Key Information',
        'Paraphrasing And Condensing Text',
      ],
    },
  },
};

// ─── Accessor helpers ────────────────────────────────────────────────────────
// Hide the SYLLABUS_DEPENDENCIES shape from consumers so future shape changes
// (e.g., adding cognitive_skill, mastery_threshold) don't ripple across callers.

/**
 * Returns the prerequisite topic list for a given subject + topic.
 * @param {string} subject - 'mathematics' | 'science' | 'english' (case-insensitive)
 * @param {string} topic   - Title-cased topic name matching question_bank.topic
 * @returns {string[]}     - Prerequisite topic names, or [] if not found
 */
export function getPrerequisites(subject, topic) {
  const entry = (SYLLABUS_DEPENDENCIES[String(subject || '').toLowerCase()] || {})[topic];
  return entry?.prerequisites || [];
}

/**
 * Returns the canonical sub-topic list for a given subject + topic.
 * Used for question generation, sub-topic-level diagnostics, and future UI.
 * @param {string} subject - 'mathematics' | 'science' | 'english' (case-insensitive)
 * @param {string} topic   - Title-cased topic name matching question_bank.topic
 * @returns {string[]}     - Sub-topic names, or [] if not found
 */
export function getSubTopics(subject, topic) {
  const entry = (SYLLABUS_DEPENDENCIES[String(subject || '').toLowerCase()] || {})[topic];
  return entry?.sub_topics || [];
}

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
  const deps = getPrerequisites(subject, topic);
  // Return first 2 from the dependency list. If fewer than 2, fall back to
  // generic within-subject options.
  if (deps.length >= 2) return deps.slice(0, 2);
  if (deps.length === 1) {
    const fallback = _fallbackTransfer(subject, topic, deps[0]);
    return [deps[0], fallback];
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

// ─── Day 1 question-count overrides ─────────────────────────────────────────
// Some question types render multiple blanks/parts per "question", which
// would make a 12-question Day 1 brutally tedious. Override by topic:
//   - Cloze     : ~10 blanks per question      → cap at 3
//   - Editing   : 6-10 blanks per question     → cap at 3
//   - Comprehension : 5-10 sub-parts per passage → cap at 2
// Multi-part Math / Science topics (word_problem, open_ended) are mixed with
// single-shot mcq/short_ans in question_bank, so they keep the default 12.
const DAY1_COUNT_OVERRIDES = {
  'Cloze':         3,
  'Editing':       3,
  'Comprehension': 2,
};

function day1Count(topic) {
  return DAY1_COUNT_OVERRIDES[topic] || 12;
}

function day1FullBands(level) {
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

// Returns difficulty bands for Day 1, sized to match the topic-specific count.
// For overridden small counts, samples evenly across the ramping curve so the
// student still progresses Foundation → Advanced inside their reduced quiz.
function day1Bands(level, topic) {
  const count = day1Count(topic);
  const full  = day1FullBands(level);
  if (count >= full.length) return full;
  return Array.from({ length: count }, (_, i) =>
    full[Math.floor(i * full.length / count)]
  );
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
  const d1    = day1Bands(level, topic);
  const d1qc  = day1Count(topic);
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
        question_count: d1qc,
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
