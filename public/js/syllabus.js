// ─────────────────────────────────────────────────────────────────────────
// /js/syllabus.js — Canonical Syllabus Module
// ─────────────────────────────────────────────────────────────────────────
// Single source of truth for subject → topic → sub_topic taxonomy.
// Backed by Supabase `canon_subjects`, `canon_topics`, `canon_sub_topics`
// at runtime; falls back to the baked-in cache below if the network fails.
//
// Both subjects.html and quiz.js import from this file. Do NOT redefine
// MOE_TOPICS, SYLLABUS_MAP, or any taxonomy lookup table elsewhere.
//
// Source: Master_Question_Template.md v4.1 (Section 4 canonical taxonomy)
// ─────────────────────────────────────────────────────────────────────────

// ── BAKED-IN CACHE FALLBACK ──
// Mirrors `canon_topics` + `canon_sub_topics` at the time of last sync.
// If the live query succeeds, this object is replaced wholesale.
// Keys are lowercase URL-style subject slugs ('mathematics', 'science', 'english').
export const CANONICAL_SYLLABUS = {
  mathematics: {
    'Whole Numbers': ['Counting To One Hundred', 'Number Notation And Place Values', 'Comparing And Ordering Numbers', 'Patterns In Number Sequences', 'Rounding Numbers To The Nearest Ten, Hundred Or Thousand', 'Order Of Operations', 'Use Of Brackets'],
    'Multiplication Tables': ['Multiplication Tables Of Two, Three, Four, Five And Ten', 'Multiplication Tables Of Six, Seven, Eight And Nine', 'Mental Calculation Involving Multiplication Within Tables'],
    'Addition and Subtraction': ['Concepts Of Addition And Subtraction', 'Addition And Subtraction Within One Hundred', 'Addition And Subtraction Algorithms', 'Mental Calculation Involving Addition And Subtraction'],
    'Multiplication and Division': ['Concepts Of Multiplication And Division', 'Multiplication And Division Algorithms', 'Division With Remainder', 'Multiplying And Dividing By Ten, One Hundred And One Thousand', 'Mental Calculation Involving Multiplication And Division'],
    'Fractions': ['Fraction As Part Of A Whole', 'Equivalent Fractions', 'Comparing And Ordering Fractions', 'Mixed Numbers', 'Improper Fractions', 'Adding Unlike Fractions', 'Subtracting Unlike Fractions', 'Fractions Of A Set', 'Fraction Multiplied By Fraction', 'Division By A Proper Fraction'],
    'Decimals': ['Notation And Place Values Of Decimals', 'Comparing And Ordering Decimals', 'Converting Fractions To Decimals', 'Converting Decimals To Fractions', 'Rounding Decimals', 'Four Operations With Decimals', 'Multiplying And Dividing Decimals By Ten, One Hundred And One Thousand'],
    'Percentage': ['Expressing Part Of A Whole As Percentage', 'Finding Percentage Part Of A Whole', 'Discount, Goods And Services Tax And Annual Interest', 'Finding The Whole Given A Part And Percentage', 'Percentage Increase And Decrease'],
    'Ratio': ['Part-Whole Ratio', 'Comparison Ratio', 'Equivalent Ratios', 'Expressing Ratio In Simplest Form', 'Dividing A Quantity In A Given Ratio', 'Ratio Of Three Quantities', 'Relationship Between Fraction And Ratio', 'Ratio Word Problems'],
    'Rate': ['Rate As Amount Of Quantity Per Unit', 'Finding Rate, Total Amount Or Number Of Units'],
    'Speed': ['Concepts Of Speed', 'Calculating Distance, Time And Speed', 'Average Speed'],
    'Average': ['Average As Total Value Divided By Number Of Data', 'Relationship Between Average, Total Value And Number Of Data'],
    'Algebra': ['Using A Letter To Represent An Unknown Number', 'Interpretation Of Algebraic Expressions', 'Simplifying Linear Expressions', 'Evaluating Linear Expressions By Substitution', 'Solving Simple Linear Equations'],
    'Angles': ['Concepts Of Angle', 'Right Angles', 'Measuring Angles In Degrees', 'Drawing Angles', 'Angles On A Straight Line', 'Angles At A Point', 'Vertically Opposite Angles', 'Finding Unknown Angles'],
    'Geometry': ['Perpendicular And Parallel Lines', 'Properties Of Rectangle And Square', 'Properties Of Triangles', 'Properties Of Parallelogram, Rhombus And Trapezium'],
    'Area and Perimeter': ['Concepts Of Area And Perimeter', 'Area And Perimeter Of Rectangle And Square', 'Finding One Dimension Given Area Or Perimeter', 'Area And Perimeter Of Composite Rectilinear Figures'],
    'Area of Triangle': ['Concepts Of Base And Height', 'Calculating Area Of Triangle', 'Area Of Composite Figures With Triangles'],
    'Circles': ['Area And Circumference Of Circle', 'Area And Perimeter Of Semicircle And Quarter Circle', 'Area And Perimeter Of Composite Figures With Circles'],
    'Volume': ['Building Solids With Unit Cubes', 'Measuring Volume In Cubic Units', 'Volume Of Cube And Cuboid', 'Finding Volume Of Liquid In Rectangular Tank', 'Finding Unknown Dimension Given Volume'],
    'Symmetry': ['Identifying Symmetric Figures', 'Lines Of Symmetry', 'Completing Symmetric Figures'],
    'Shapes and Patterns': ['Identifying And Naming Two-Dimensional Shapes', 'Classifying Three-Dimensional Shapes', 'Making Patterns With Two-Dimensional Shapes'],
    'Factors and Multiples': ['Identifying Factors And Multiples', 'Finding Common Factors', 'Finding Common Multiples'],
    'Pie Charts': ['Reading And Interpreting Pie Charts', 'Solving Problems Using Pie Chart Data'],
    'Data Analysis': ['Reading Picture Graphs', 'Reading Bar Graphs', 'Reading Line Graphs', 'Reading Tables']
  },
  science: {
    'Diversity': ['General Characteristics Of Living And Non-Living Things', 'Classification Of Living And Non-Living Things', 'Diversity Of Materials And Their Properties'],
    'Matter': ['States Of Matter', 'Properties Of Solids, Liquids And Gases', 'Changes In State Of Matter'],
    'Systems': ['Plant Parts And Functions', 'Human Digestive System', 'Plant Respiratory And Circulatory Systems', 'Human Respiratory And Circulatory Systems', 'Electrical Systems And Circuits'],
    'Cycles': ['Life Cycles Of Insects', 'Life Cycles Of Amphibians', 'Life Cycles Of Flowering Plants', 'Life Cycles Of Fungi', 'Reproduction In Plants And Animals', 'Stages Of The Water Cycle'],
    'Interactions': ['Interaction Of Magnetic Forces', 'Interaction Of Frictional, Gravitational And Elastic Spring Forces', 'Interactions Within The Environment', 'Food Chains And Food Webs'],
    'Energy': ['Light Energy Forms And Uses', 'Heat Energy Forms And Uses', 'Photosynthesis And Energy Pathways', 'Energy Conversion In Everyday Objects'],
    'Forces': ['Push And Pull Forces', 'Effects Of Forces On Objects', 'Frictional Force And Its Applications', 'Gravitational Force', 'Elastic Spring Force'],
    'Heat': ['Sources Of Heat', 'Effects Of Heat Gain And Heat Loss', 'Temperature And Use Of Thermometers', 'Good And Poor Conductors Of Heat'],
    'Light': ['Sources Of Light', 'Reflection Of Light', 'Formation Of Shadows', 'Transparent, Translucent And Opaque Materials'],
    'Cells': ['Plant And Animal Cells', 'Parts Of A Cell And Their Functions', 'Cell Division']
  },
  english: {
    'Grammar': ['Simple Present And Past Tenses', 'Perfect And Continuous Tenses', 'Subject-Verb Agreement', 'Singular And Plural Nouns', 'Prepositions And Phrasal Verbs', 'Conjunctions', 'Active And Passive Voice', 'Relative Pronouns'],
    'Vocabulary': ['Thematic Vocabulary Recall', 'Contextual Vocabulary Meaning', 'Synonyms And Antonyms'],
    'Cloze': ['Grammar Cloze With Word Bank', 'Vocabulary Cloze With Dropdowns', 'Comprehension Free-Text Cloze'],
    'Editing': ['Correcting Spelling Errors', 'Correcting Grammatical Errors'],
    'Comprehension': ['Direct Visual Retrieval', 'True Or False With Reason', 'Pronoun Referent Table', 'Sequencing Of Events', 'Deep Inference And Claim Evidence Reasoning'],
    'Synthesis': ['Combining With Conjunctions', 'Relative Clauses', 'Participle Phrases', 'Conditional Sentences', 'Reported Speech Transformation', 'Active To Passive Voice Transformation', 'Inversion'],
    'Summary Writing': ['Identifying Key Information', 'Paraphrasing And Condensing Text']
  }
};

// ── LEVEL → TOPICS WHITELIST ──
// Per Master_Question_Template.md Section 4 "Level guidance".
// Defines which canonical topics are valid at each primary level.
// Cumulative: P3 includes P1-2 topics where applicable.
export const LEVEL_TOPICS = {
  // P1: Math basics, no Science, English without Editing/Synthesis
  'primary-1:mathematics': ['Whole Numbers', 'Addition and Subtraction', 'Shapes and Patterns'],
  'primary-1:english': ['Grammar', 'Vocabulary', 'Comprehension', 'Cloze'],

  // P2: + Multiplication Tables
  'primary-2:mathematics': ['Whole Numbers', 'Addition and Subtraction', 'Multiplication Tables', 'Shapes and Patterns'],
  'primary-2:english': ['Grammar', 'Vocabulary', 'Comprehension', 'Cloze'],

  // P3: WAs begin. Add Multiplication and Division, Fractions, Decimals, Angles, Geometry, Area & Perimeter, Symmetry, Factors and Multiples, Data Analysis. Science begins.
  'primary-3:mathematics': ['Whole Numbers', 'Addition and Subtraction', 'Multiplication Tables', 'Multiplication and Division', 'Fractions', 'Decimals', 'Angles', 'Geometry', 'Area and Perimeter', 'Symmetry', 'Factors and Multiples', 'Data Analysis', 'Shapes and Patterns'],
  'primary-3:science': ['Diversity', 'Matter', 'Cycles', 'Systems', 'Interactions', 'Heat', 'Light'],
  'primary-3:english': ['Grammar', 'Vocabulary', 'Comprehension', 'Cloze', 'Editing', 'Synthesis'],

  // P4: Same as P3 (cumulative).
  'primary-4:mathematics': ['Whole Numbers', 'Addition and Subtraction', 'Multiplication Tables', 'Multiplication and Division', 'Fractions', 'Decimals', 'Angles', 'Geometry', 'Area and Perimeter', 'Symmetry', 'Factors and Multiples', 'Data Analysis', 'Shapes and Patterns'],
  'primary-4:science': ['Diversity', 'Matter', 'Cycles', 'Systems', 'Interactions', 'Heat', 'Light'],
  'primary-4:english': ['Grammar', 'Vocabulary', 'Comprehension', 'Cloze', 'Editing', 'Synthesis'],

  // P5: + Percentage, Ratio, Rate, Speed, Average, Algebra, Area of Triangle, Circles, Volume, Pie Charts. + Energy, Forces, Cells. + Summary Writing.
  'primary-5:mathematics': ['Whole Numbers', 'Multiplication and Division', 'Fractions', 'Decimals', 'Percentage', 'Ratio', 'Rate', 'Average', 'Angles', 'Geometry', 'Area and Perimeter', 'Area of Triangle', 'Volume', 'Data Analysis', 'Factors and Multiples'],
  'primary-5:science': ['Diversity', 'Matter', 'Cycles', 'Systems', 'Interactions', 'Heat', 'Light', 'Energy', 'Forces', 'Cells'],
  'primary-5:english': ['Grammar', 'Vocabulary', 'Comprehension', 'Cloze', 'Editing', 'Synthesis', 'Summary Writing'],

  // P6: PSLE year. + Speed, Algebra, Circles, Pie Charts (full PSLE topic set).
  'primary-6:mathematics': ['Whole Numbers', 'Fractions', 'Decimals', 'Percentage', 'Ratio', 'Rate', 'Speed', 'Average', 'Algebra', 'Angles', 'Geometry', 'Area and Perimeter', 'Area of Triangle', 'Circles', 'Volume', 'Data Analysis', 'Pie Charts'],
  'primary-6:science': ['Diversity', 'Matter', 'Cycles', 'Systems', 'Interactions', 'Heat', 'Light', 'Energy', 'Forces', 'Cells'],
  'primary-6:english': ['Grammar', 'Vocabulary', 'Comprehension', 'Cloze', 'Editing', 'Synthesis', 'Summary Writing']
};

// ── ALLOWED QUESTION TYPES PER SUBJECT ──
// Per Master_Question_Template.md Section 4 SUBJECT VALUES table.
export const SUBJECT_QUESTION_TYPES = {
  mathematics: [
    { id: 'mcq', label: 'MCQ' },
    { id: 'short_ans', label: 'Short Answer' },
    { id: 'word_problem', label: 'Word Problem' }
  ],
  science: [
    { id: 'mcq', label: 'MCQ' },
    { id: 'open_ended', label: 'Open-Ended' }
  ],
  english: [
    { id: 'mcq', label: 'MCQ' },
    { id: 'cloze', label: 'Cloze' },
    { id: 'editing', label: 'Editing' },
    { id: 'comprehension', label: 'Comprehension' },
    { id: 'short_ans', label: 'Synthesis' }
  ]
};

// ── TOPIC → TYPE BYPASS ──
// Topics that map directly to one question type — skip the TYPE step in the wizard.
export const TOPIC_TYPE_BYPASS = {
  'grammar': 'mcq',
  'vocabulary': 'mcq',
  'cloze': 'cloze',
  'editing': 'editing',
  'comprehension': 'comprehension',
  'synthesis': 'short_ans'
};

// ── SUBJECT DISPLAY VALUES ──
// Maps URL slug → exact database value (FK-enforced in question_bank).
export const SUBJECT_DB_NAME = {
  mathematics: 'Mathematics',
  science: 'Science',
  english: 'English'
};

// ─────────────────────────────────────────────────────────────────────────
// SLUG HELPERS — single canonical round-trip
// ─────────────────────────────────────────────────────────────────────────

/**
 * Canonical slugifier. Lowercase, non-alphanumeric → hyphen, trim hyphens.
 * Examples:
 *   'Whole Numbers' → 'whole-numbers'
 *   'Length, Mass and Volume' → 'length-mass-and-volume'
 *   'Area & Perimeter' → 'area-perimeter'
 */
export function slugify(name) {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Reverse slugify → canonical topic name (within a subject scope).
 * Returns the canonical-cased topic if found, otherwise null.
 */
export function unslugify(slug, subject) {
  if (!slug || !subject) return null;
  const subjectMap = CANONICAL_SYLLABUS[subject.toLowerCase()];
  if (!subjectMap) return null;
  const target = String(slug).toLowerCase();
  for (const topic of Object.keys(subjectMap)) {
    if (slugify(topic) === target) return topic;
  }
  return null;
}

/**
 * Topics valid for a given (level, subject) pair.
 * Returns canonical topic names in the order defined by LEVEL_TOPICS.
 */
export function topicsForLevelSubject(level, subject) {
  if (!level || !subject) return [];
  const key = `${level.toLowerCase()}:${subject.toLowerCase()}`;
  return LEVEL_TOPICS[key] || [];
}

/**
 * Sub-topics for a (subject, topic) pair.
 */
export function subTopicsFor(subject, topic) {
  if (!subject || !topic) return [];
  return CANONICAL_SYLLABUS[subject.toLowerCase()]?.[topic] || [];
}

/**
 * Allowed question types for a subject.
 */
export function questionTypesFor(subject) {
  if (!subject) return [];
  return SUBJECT_QUESTION_TYPES[subject.toLowerCase()] || [];
}

// ─────────────────────────────────────────────────────────────────────────
// LIVE QUERY — fetches current canon from Supabase, replaces the cache
// ─────────────────────────────────────────────────────────────────────────

/**
 * Loads live canon from Supabase. On success, mutates CANONICAL_SYLLABUS in
 * place. On failure, leaves the baked-in cache untouched and logs a warning.
 *
 * Returns { source: 'live' | 'cache', error?: Error } so callers can react.
 */
export async function loadLiveCanon(supabaseClient) {
  if (!supabaseClient) {
    console.warn('[syllabus] loadLiveCanon called without Supabase client; using cache.');
    return { source: 'cache' };
  }

  try {
    // Fetch all sub-topics with their topic + subject context in one query.
    // Schema: canon_sub_topics(subject, topic, sub_topic) — composite PK,
    // no surrogate id column.
    const { data, error } = await supabaseClient
      .from('canon_sub_topics')
      .select('subject, topic, sub_topic')
      .order('subject')
      .order('topic')
      .order('sub_topic');

    if (error) throw error;
    if (!data || data.length === 0) {
      console.warn('[syllabus] canon_sub_topics returned empty; using cache.');
      return { source: 'cache' };
    }

    // Rebuild CANONICAL_SYLLABUS from the live data.
    const live = {};
    for (const row of data) {
      const subjectKey = String(row.subject).toLowerCase();
      if (!live[subjectKey]) live[subjectKey] = {};
      if (!live[subjectKey][row.topic]) live[subjectKey][row.topic] = [];
      live[subjectKey][row.topic].push(row.sub_topic);
    }

    // Atomic replace: only swap if the live payload looks reasonable
    // (at least one subject with at least one topic).
    const subjectCount = Object.keys(live).length;
    if (subjectCount === 0) {
      console.warn('[syllabus] live canon parsed to zero subjects; using cache.');
      return { source: 'cache' };
    }

    // Replace cached entries with live data per subject (preserves any
    // subjects in cache but not in live, defensively).
    for (const subjectKey of Object.keys(live)) {
      CANONICAL_SYLLABUS[subjectKey] = live[subjectKey];
    }

    return { source: 'live' };
  } catch (err) {
    console.warn('[syllabus] live canon load failed; using cache fallback.', err);
    return { source: 'cache', error: err };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// QUESTION COUNTS — for "23 topics · 412 questions" UI displays
// ─────────────────────────────────────────────────────────────────────────

/**
 * Returns a per-subject question count, optionally scoped by level and topic.
 * Reads from question_bank with FK-correct casing.
 *
 * Usage:
 *   countsBySubject(sb, 'Primary 4')              → { Mathematics: 120, Science: 80, English: 65 }
 *   countsByTopic(sb, 'Primary 4', 'Mathematics') → { 'Fractions': 32, 'Decimals': 18, ... }
 *   countsByType(sb, 'Primary 4', 'Mathematics', 'Fractions') → { mcq: 12, word_problem: 8, ... }
 */
export async function countsBySubject(supabaseClient, levelDisplay) {
  if (!supabaseClient) return {};
  try {
    let query = supabaseClient.from('question_bank').select('subject', { count: 'exact', head: false });
    if (levelDisplay) query = query.eq('level', levelDisplay);
    const { data, error } = await query;
    if (error) throw error;
    const out = {};
    for (const row of (data || [])) {
      out[row.subject] = (out[row.subject] || 0) + 1;
    }
    return out;
  } catch (err) {
    console.warn('[syllabus] countsBySubject failed:', err);
    return {};
  }
}

export async function countsByTopic(supabaseClient, levelDisplay, subjectDb) {
  if (!supabaseClient || !subjectDb) return {};
  try {
    let query = supabaseClient.from('question_bank').select('topic').eq('subject', subjectDb);
    if (levelDisplay) query = query.eq('level', levelDisplay);
    const { data, error } = await query;
    if (error) throw error;
    const out = {};
    for (const row of (data || [])) {
      if (!row.topic) continue;
      out[row.topic] = (out[row.topic] || 0) + 1;
    }
    return out;
  } catch (err) {
    console.warn('[syllabus] countsByTopic failed:', err);
    return {};
  }
}

export async function countsByType(supabaseClient, levelDisplay, subjectDb, topicCanonical) {
  if (!supabaseClient || !subjectDb) return {};
  try {
    let query = supabaseClient.from('question_bank').select('type').eq('subject', subjectDb);
    if (levelDisplay) query = query.eq('level', levelDisplay);
    if (topicCanonical) query = query.eq('topic', topicCanonical);
    const { data, error } = await query;
    if (error) throw error;
    const out = {};
    for (const row of (data || [])) {
      if (!row.type) continue;
      out[row.type] = (out[row.type] || 0) + 1;
    }
    return out;
  } catch (err) {
    console.warn('[syllabus] countsByType failed:', err);
    return {};
  }
}

// ─────────────────────────────────────────────────────────────────────────
// ADMIN TOGGLE — system_settings read for "show question counts"
// ─────────────────────────────────────────────────────────────────────────

/**
 * Reads the `show_question_counts` flag from system_settings.
 * Defaults to TRUE if the row is missing or the table is unreadable.
 * The admin UI in admin.html writes this flag.
 */
export async function readShowCountsFlag(supabaseClient) {
  if (!supabaseClient) return true;
  try {
    const { data, error } = await supabaseClient
      .from('system_settings')
      .select('value')
      .eq('key', 'show_question_counts')
      .maybeSingle();
    if (error) throw error;
    if (!data) return true;            // default ON
    const v = data.value;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.toLowerCase() !== 'false';
    if (v && typeof v === 'object' && 'enabled' in v) return Boolean(v.enabled);
    return true;
  } catch (err) {
    console.warn('[syllabus] readShowCountsFlag failed; defaulting to true.', err);
    return true;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// LEGACY-COMPATIBLE GLOBAL EXPOSURE
// ─────────────────────────────────────────────────────────────────────────
// quiz.js currently runs as a non-module <script>. Until its module-ification,
// expose the slug helpers on window so quiz.js can call them without imports.
// subjects.html (which is a module) imports the named exports directly.
if (typeof window !== 'undefined') {
  window.SHL_SYLLABUS = {
    CANONICAL_SYLLABUS,
    LEVEL_TOPICS,
    SUBJECT_QUESTION_TYPES,
    SUBJECT_DB_NAME,
    TOPIC_TYPE_BYPASS,
    slugify,
    unslugify,
    topicsForLevelSubject,
    subTopicsFor,
    questionTypesFor,
    loadLiveCanon,
    countsBySubject,
    countsByTopic,
    countsByType,
    readShowCountsFlag
  };
}