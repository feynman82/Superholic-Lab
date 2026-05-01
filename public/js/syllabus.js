// ─────────────────────────────────────────────────────────────────────────
// /js/syllabus.js — Canonical Syllabus Module v5.0 (2026-05-01)
// ─────────────────────────────────────────────────────────────────────────
// Single source of truth for subject → topic → sub_topic taxonomy AND
// level → topic → sub_topic mapping.
//
// Backed by Supabase tables:
//   • canon_subjects, canon_topics, canon_sub_topics  (existing)
//   • canon_level_topics                              (NEW in v5)
//
// Falls back to baked-in cache below if network fails.
//
// Both subjects.html and quiz.js import from this file. Do NOT redefine
// MOE_TOPICS, SYLLABUS_MAP, LEVEL_TOPICS, or any taxonomy lookup elsewhere.
//
// CHANGES vs v4.1:
//   • Added topics: Money, Length and Mass, Volume of Liquid, Time
//   • Removed Science topics: Heat, Light, Forces, Cells (folded)
//   • Removed Maths topic: Speed (P6 dropped per 2021 syllabus)
//   • Added English sub_topics: Visual Text Literal Retrieval / Inference
//   • LEVEL_TOPICS now hydrated from canon_level_topics at runtime
// ─────────────────────────────────────────────────────────────────────────

// ── BAKED-IN CACHE FALLBACK ──
export const CANONICAL_SYLLABUS = {
  mathematics: {
    'Whole Numbers': ['Counting To One Hundred','Number Notation And Place Values','Comparing And Ordering Numbers','Patterns In Number Sequences','Rounding Numbers To The Nearest Ten, Hundred Or Thousand','Order Of Operations','Use Of Brackets'],
    'Multiplication Tables': ['Multiplication Tables Of Two, Three, Four, Five And Ten','Multiplication Tables Of Six, Seven, Eight And Nine','Mental Calculation Involving Multiplication Within Tables'],
    'Addition and Subtraction': ['Concepts Of Addition And Subtraction','Addition And Subtraction Within One Hundred','Addition And Subtraction Algorithms','Mental Calculation Involving Addition And Subtraction'],
    'Multiplication and Division': ['Concepts Of Multiplication And Division','Multiplication And Division Algorithms','Division With Remainder','Multiplying And Dividing By Ten, One Hundred And One Thousand','Mental Calculation Involving Multiplication And Division'],
    'Money': ['Counting Amount Of Money','Reading And Writing Money In Decimal Notation','Comparing Amounts Of Money','Converting Money Between Decimal And Cents','Adding And Subtracting Money In Decimal Notation','Word Problems Involving Money'],
    'Length and Mass': ['Measuring Length In Centimetres And Metres','Measuring Length In Kilometres','Measuring Mass In Grams And Kilograms','Comparing And Ordering Lengths And Masses','Converting Compound Units To Smaller Unit','Word Problems Involving Length And Mass'],
    'Volume of Liquid': ['Measuring Volume In Litres','Measuring Volume In Millilitres','Comparing And Ordering Volumes','Converting Litres And Millilitres','Word Problems Involving Volume'],
    'Time': ['Telling Time To Five Minutes','Telling Time To The Minute','Use Of Am And Pm','Measuring Time In Hours And Minutes','Measuring Time In Seconds','Twenty-Four Hour Clock','Finding Starting Time, Finishing Time Or Duration','Word Problems Involving Time'],
    'Fractions': ['Fraction As Part Of A Whole','Equivalent Fractions','Comparing And Ordering Fractions','Mixed Numbers','Improper Fractions','Adding Unlike Fractions','Subtracting Unlike Fractions','Fractions Of A Set','Fraction Multiplied By Fraction','Division By A Proper Fraction'],
    'Decimals': ['Notation And Place Values Of Decimals','Comparing And Ordering Decimals','Converting Fractions To Decimals','Converting Decimals To Fractions','Rounding Decimals','Four Operations With Decimals','Multiplying And Dividing Decimals By Ten, One Hundred And One Thousand'],
    'Percentage': ['Expressing Part Of A Whole As Percentage','Finding Percentage Part Of A Whole','Discount, Goods And Services Tax And Annual Interest','Finding The Whole Given A Part And Percentage','Percentage Increase And Decrease'],
    'Ratio': ['Part-Whole Ratio','Comparison Ratio','Equivalent Ratios','Expressing Ratio In Simplest Form','Dividing A Quantity In A Given Ratio','Ratio Of Three Quantities','Relationship Between Fraction And Ratio','Ratio Word Problems'],
    'Rate': ['Rate As Amount Of Quantity Per Unit','Finding Rate, Total Amount Or Number Of Units'],
    'Average': ['Average As Total Value Divided By Number Of Data','Relationship Between Average, Total Value And Number Of Data'],
    'Algebra': ['Using A Letter To Represent An Unknown Number','Interpretation Of Algebraic Expressions','Simplifying Linear Expressions','Evaluating Linear Expressions By Substitution','Solving Simple Linear Equations'],
    'Angles': ['Concepts Of Angle','Right Angles','Measuring Angles In Degrees','Drawing Angles','Angles On A Straight Line','Angles At A Point','Vertically Opposite Angles','Finding Unknown Angles'],
    'Geometry': ['Perpendicular And Parallel Lines','Properties Of Rectangle And Square','Properties Of Triangles','Properties Of Parallelogram, Rhombus And Trapezium','Identifying Two-Dimensional Representations Of Solids','Drawing Two-Dimensional Representations Of Solids','Identifying Nets Of Three-Dimensional Solids'],
    'Area and Perimeter': ['Concepts Of Area And Perimeter','Area And Perimeter Of Rectangle And Square','Finding One Dimension Given Area Or Perimeter','Area And Perimeter Of Composite Rectilinear Figures'],
    'Area of Triangle': ['Concepts Of Base And Height','Calculating Area Of Triangle','Area Of Composite Figures With Triangles'],
    'Circles': ['Area And Circumference Of Circle','Area And Perimeter Of Semicircle And Quarter Circle','Area And Perimeter Of Composite Figures With Circles'],
    'Volume': ['Building Solids With Unit Cubes','Measuring Volume In Cubic Units','Volume Of Cube And Cuboid','Finding Volume Of Liquid In Rectangular Tank','Finding Unknown Dimension Given Volume'],
    'Symmetry': ['Identifying Symmetric Figures','Lines Of Symmetry','Completing Symmetric Figures'],
    'Shapes and Patterns': ['Identifying And Naming Two-Dimensional Shapes','Classifying Three-Dimensional Shapes','Making Patterns With Two-Dimensional Shapes'],
    'Factors and Multiples': ['Identifying Factors And Multiples','Finding Common Factors','Finding Common Multiples'],
    'Pie Charts': ['Reading And Interpreting Pie Charts','Solving Problems Using Pie Chart Data'],
    'Data Analysis': ['Reading Picture Graphs','Reading Bar Graphs','Reading Line Graphs','Reading Tables']
  },
  science: {
    'Diversity': ['General Characteristics Of Living And Non-Living Things','Classification Of Living And Non-Living Things','Diversity Of Materials And Their Properties'],
    'Matter': ['States Of Matter','Properties Of Solids, Liquids And Gases','Changes In State Of Matter'],
    'Cycles': ['Life Cycles Of Insects','Life Cycles Of Amphibians','Life Cycles Of Flowering Plants','Reproduction In Plants And Animals','Stages Of The Water Cycle'],
    'Systems': ['Plant Parts And Functions','Human Digestive System','Plant Respiratory And Circulatory Systems','Human Respiratory And Circulatory Systems','Electrical Systems And Circuits'],
    'Energy': ['Sources Of Light','Reflection Of Light','Formation Of Shadows','Transparent, Translucent And Opaque Materials','Sources Of Heat','Effects Of Heat Gain And Heat Loss','Temperature And Use Of Thermometers','Good And Poor Conductors Of Heat','Photosynthesis And Energy Pathways','Energy Conversion In Everyday Objects'],
    'Interactions': ['Interaction Of Magnetic Forces','Frictional Force','Gravitational Force','Elastic Spring Force','Effects Of Forces On Objects','Interactions Within The Environment','Food Chains And Food Webs']
  },
  english: {
    'Grammar': ['Simple Present And Past Tenses','Perfect And Continuous Tenses','Subject-Verb Agreement','Singular And Plural Nouns','Prepositions And Phrasal Verbs','Conjunctions','Active And Passive Voice','Relative Pronouns'],
    'Vocabulary': ['Thematic Vocabulary Recall','Contextual Vocabulary Meaning','Synonyms And Antonyms'],
    'Cloze': ['Grammar Cloze With Word Bank','Vocabulary Cloze With Dropdowns','Comprehension Free-Text Cloze'],
    'Editing': ['Correcting Spelling Errors','Correcting Grammatical Errors'],
    'Comprehension': ['Direct Visual Retrieval','True Or False With Reason','Pronoun Referent Table','Sequencing Of Events','Deep Inference And Claim Evidence Reasoning','Visual Text Literal Retrieval','Visual Text Inference And Purpose'],
    'Synthesis': ['Combining With Conjunctions','Relative Clauses','Participle Phrases','Conditional Sentences','Reported Speech Transformation','Active To Passive Voice Transformation','Inversion']
  }
};

// ─────────────────────────────────────────────────────────────────────────
// UI-ONLY SUB-TOPIC GROUPS (drives subjects.html accordion drawer)
// ─────────────────────────────────────────────────────────────────────────
// These groups are UI groupings ONLY. They do NOT match canon_sub_topics.
// The canon is the source of truth for question_bank.sub_topic; this map
// is purely for learner navigation in subjects.html.
//
// Empty-array means "no sub-topic selector for this topic" — subjects.html
// falls back to topic-level quiz retrieval. Most topics intentionally
// fall here.
//
// groupKey is the URL slug (?sub_topic=<groupKey>). quiz.js translates
// it back to the canonical sub_topic list via resolveSubTopicGroup().
export const SUB_TOPIC_GROUPS = {
  english: {
    'Comprehension': {
      'passage-comprehension': {
        label: 'Passage Comprehension',
        subTopicsInCanon: [
          'Direct Visual Retrieval',
          'True Or False With Reason',
          'Pronoun Referent Table',
          'Sequencing Of Events',
          'Deep Inference And Claim Evidence Reasoning'
        ]
      },
      'visual-text-comprehension': {
        label: 'Visual Text Comprehension',
        subTopicsInCanon: [
          'Visual Text Literal Retrieval',
          'Visual Text Inference And Purpose'
        ],
        questionType: 'visual_text'
      }
    },
    'Cloze': {
      'grammar-cloze-with-word-bank': {
        label: 'Grammar Cloze With Word Bank',
        subTopicsInCanon: ['Grammar Cloze With Word Bank']
      },
      'vocabulary-cloze-with-dropdowns': {
        label: 'Vocabulary Cloze With Dropdowns',
        subTopicsInCanon: ['Vocabulary Cloze With Dropdowns']
      },
      'comprehension-free-text-cloze': {
        label: 'Comprehension Free-Text Cloze',
        subTopicsInCanon: ['Comprehension Free-Text Cloze']
      }
    }
  }
  // mathematics and science intentionally absent — no sub-topic UI for those
};

/**
 * Returns { groupKey: { label, subTopicsInCanon, questionType? }, ... }
 * for a given subject + topic.
 *
 * English: explicit overrides from SUB_TOPIC_GROUPS (Comprehension split,
 * Cloze pass-through). All other English topics return {} (no drawer).
 *
 * Mathematics / Science: each canonical sub_topic becomes its own one-item
 * group, with the slug as the groupKey. This means EVERY Math/Science topic
 * card can expand into a drawer of its canonical sub_topics.
 */
export function subTopicGroupsFor(subject, topic) {
  if (!subject || !topic) return {};
  const subjectKey = subject.toLowerCase();

  if (subjectKey === 'english') {
    return SUB_TOPIC_GROUPS.english?.[topic] || {};
  }

  if (subjectKey === 'mathematics' || subjectKey === 'science') {
    const canonSubs = CANONICAL_SYLLABUS[subjectKey]?.[topic] || [];
    const groups = {};
    for (const sub of canonSubs) {
      const key = slugify(sub);
      groups[key] = { label: sub, subTopicsInCanon: [sub] };
    }
    return groups;
  }

  return {};
}

/**
 * Resolves a UI groupKey back into the canonical sub_topic strings
 * (and optional questionType) for Supabase filtering.
 *
 * Returns: { subTopics: string[], questionType?: string } or null if not found.
 */
export function resolveSubTopicGroup(subject, topic, groupKey) {
  if (!subject || !topic || !groupKey) return null;
  const subjectKey = subject.toLowerCase();

  if (subjectKey === 'english') {
    const groups = SUB_TOPIC_GROUPS.english?.[topic];
    if (!groups) return null;
    const group = groups[groupKey];
    if (!group) return null;
    return {
      subTopics: group.subTopicsInCanon || [],
      questionType: group.questionType || null
    };
  }

  if (subjectKey === 'mathematics' || subjectKey === 'science') {
    const canonSubs = CANONICAL_SYLLABUS[subjectKey]?.[topic] || [];
    const matched = canonSubs.find(s => slugify(s) === groupKey);
    if (!matched) return null;
    return { subTopics: [matched], questionType: null };
  }

  return null;
}

// ── LEVEL → TOPICS WHITELIST ──
// Hydrated from canon_level_topics at runtime via loadLiveLevelTopics().
// Baked-in fallback derived from canon_level_topics v5 (296 rows).
export const LEVEL_TOPICS = {
  'primary-1:mathematics': ['Whole Numbers','Addition and Subtraction','Multiplication and Division','Multiplication Tables','Money','Length and Mass','Time','Shapes and Patterns','Data Analysis'],
  'primary-1:english': ['Grammar','Vocabulary','Cloze','Comprehension'],

  'primary-2:mathematics': ['Whole Numbers','Addition and Subtraction','Multiplication Tables','Multiplication and Division','Fractions','Money','Length and Mass','Volume of Liquid','Time','Shapes and Patterns','Data Analysis'],
  'primary-2:english': ['Grammar','Vocabulary','Cloze','Comprehension'],

  'primary-3:mathematics': ['Whole Numbers','Addition and Subtraction','Multiplication Tables','Multiplication and Division','Fractions','Money','Length and Mass','Volume of Liquid','Time','Angles','Geometry','Area and Perimeter','Data Analysis'],
  'primary-3:science': ['Diversity','Cycles','Interactions'],
  'primary-3:english': ['Grammar','Vocabulary','Cloze','Editing','Comprehension'],

  'primary-4:mathematics': ['Whole Numbers','Multiplication and Division','Factors and Multiples','Fractions','Decimals','Money','Time','Angles','Geometry','Symmetry','Area and Perimeter','Data Analysis','Pie Charts'],
  'primary-4:science': ['Systems','Matter','Cycles','Energy'],
  'primary-4:english': ['Grammar','Vocabulary','Cloze','Editing','Comprehension','Synthesis'],

  'primary-5:mathematics': ['Whole Numbers','Fractions','Decimals','Money','Length and Mass','Volume of Liquid','Percentage','Rate','Average','Area of Triangle','Volume','Angles','Geometry'],
  'primary-5:science': ['Cycles','Systems'],
  'primary-5:english': ['Grammar','Vocabulary','Cloze','Editing','Comprehension','Synthesis'],

  'primary-6:mathematics': ['Fractions','Percentage','Ratio','Algebra','Average','Circles','Volume','Geometry','Angles','Pie Charts'],
  'primary-6:science': ['Energy','Interactions'],
  'primary-6:english': ['Grammar','Vocabulary','Cloze','Editing','Comprehension','Synthesis']
};

// ── ALLOWED QUESTION TYPES PER SUBJECT ──
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
export const TOPIC_TYPE_BYPASS = {
  'grammar': 'mcq',
  'vocabulary': 'mcq',
  'cloze': 'cloze',
  'editing': 'editing',
  'comprehension': 'comprehension',
  'synthesis': 'short_ans'
};

// ── SUBJECT DISPLAY VALUES ──
export const SUBJECT_DB_NAME = {
  mathematics: 'Mathematics',
  science: 'Science',
  english: 'English'
};

// ─────────────────────────────────────────────────────────────────────────
// SLUG HELPERS
// ─────────────────────────────────────────────────────────────────────────
export function slugify(name) {
  if (!name) return '';
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

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

export function topicsForLevelSubject(level, subject) {
  if (!level || !subject) return [];
  const key = `${level.toLowerCase()}:${subject.toLowerCase()}`;
  return LEVEL_TOPICS[key] || [];
}

export function subTopicsFor(subject, topic) {
  if (!subject || !topic) return [];
  return CANONICAL_SYLLABUS[subject.toLowerCase()]?.[topic] || [];
}

export function questionTypesFor(subject) {
  if (!subject) return [];
  return SUBJECT_QUESTION_TYPES[subject.toLowerCase()] || [];
}

// ─────────────────────────────────────────────────────────────────────────
// LIVE QUERY — fetches current canon from Supabase, replaces cache
// ─────────────────────────────────────────────────────────────────────────
export async function loadLiveCanon(supabaseClient) {
  if (!supabaseClient) return { source: 'cache' };
  try {
    const { data, error } = await supabaseClient
      .from('canon_sub_topics')
      .select('subject, topic, sub_topic')
      .order('subject').order('topic').order('sub_topic');
    if (error) throw error;
    if (!data || data.length === 0) return { source: 'cache' };

    const live = {};
    for (const row of data) {
      const subjectKey = String(row.subject).toLowerCase();
      if (!live[subjectKey]) live[subjectKey] = {};
      if (!live[subjectKey][row.topic]) live[subjectKey][row.topic] = [];
      live[subjectKey][row.topic].push(row.sub_topic);
    }
    if (Object.keys(live).length === 0) return { source: 'cache' };

    for (const subjectKey of Object.keys(live)) {
      CANONICAL_SYLLABUS[subjectKey] = live[subjectKey];
    }
    return { source: 'live' };
  } catch (err) {
    console.warn('[syllabus] live canon load failed; using cache.', err);
    return { source: 'cache', error: err };
  }
}

// NEW: Hydrate LEVEL_TOPICS from canon_level_topics
export async function loadLiveLevelTopics(supabaseClient) {
  if (!supabaseClient) return { source: 'cache' };
  try {
    const { data, error } = await supabaseClient
      .from('canon_level_topics')
      .select('level, subject, topic')
      .order('level').order('subject').order('topic');
    if (error) throw error;
    if (!data || data.length === 0) return { source: 'cache' };

    // Group by (level, subject) → unique topics, preserving order
    const live = {};
    for (const row of data) {
      const levelSlug = slugify(row.level);                    // 'primary-3'
      const subjectKey = String(row.subject).toLowerCase();    // 'mathematics'
      const key = `${levelSlug}:${subjectKey}`;
      if (!live[key]) live[key] = [];
      if (!live[key].includes(row.topic)) live[key].push(row.topic);
    }
    if (Object.keys(live).length === 0) return { source: 'cache' };

    for (const key of Object.keys(live)) {
      LEVEL_TOPICS[key] = live[key];
    }
    return { source: 'live' };
  } catch (err) {
    console.warn('[syllabus] live level topics load failed; using cache.', err);
    return { source: 'cache', error: err };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// QUESTION COUNTS — pagination as before
// ─────────────────────────────────────────────────────────────────────────
const COUNT_PAGE_SIZE = 1000;

async function paginatedSelect(query) {
  const out = [];
  let from = 0;
  while (true) {
    const to = from + COUNT_PAGE_SIZE - 1;
    const { data, error } = await query.range(from, to);
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < COUNT_PAGE_SIZE) break;
    from += COUNT_PAGE_SIZE;
    if (from > 50000) break;
  }
  return out;
}

export async function countsBySubject(supabaseClient, levelDisplay) {
  if (!supabaseClient) return {};
  try {
    let query = supabaseClient.from('question_bank').select('subject').is('deprecated_at', null);
    if (levelDisplay) query = query.eq('level', levelDisplay);
    const rows = await paginatedSelect(query);
    const out = {};
    for (const row of rows) out[row.subject] = (out[row.subject] || 0) + 1;
    return out;
  } catch (err) { console.warn('[syllabus] countsBySubject failed:', err); return {}; }
}

export async function countsByTopic(supabaseClient, levelDisplay, subjectDb) {
  if (!supabaseClient || !subjectDb) return {};
  try {
    let query = supabaseClient.from('question_bank').select('topic').eq('subject', subjectDb).is('deprecated_at', null);
    if (levelDisplay) query = query.eq('level', levelDisplay);
    const rows = await paginatedSelect(query);
    const out = {};
    for (const row of rows) { if (row.topic) out[row.topic] = (out[row.topic] || 0) + 1; }
    return out;
  } catch (err) { console.warn('[syllabus] countsByTopic failed:', err); return {}; }
}

export async function countsByType(supabaseClient, levelDisplay, subjectDb, topicCanonical) {
  if (!supabaseClient || !subjectDb) return {};
  try {
    let query = supabaseClient.from('question_bank').select('type').eq('subject', subjectDb).is('deprecated_at', null);
    if (levelDisplay) query = query.eq('level', levelDisplay);
    if (topicCanonical) query = query.eq('topic', topicCanonical);
    const rows = await paginatedSelect(query);
    const out = {};
    for (const row of rows) { if (row.type) out[row.type] = (out[row.type] || 0) + 1; }
    return out;
  } catch (err) { console.warn('[syllabus] countsByType failed:', err); return {}; }
}

/**
 * Returns sub-topic question counts for a given level + subject + topic.
 * Paginated to bypass the 1000-row PostgREST cap.
 *
 * Usage:
 *   countsBySubTopic(sb, 'Primary 6', 'Mathematics', 'Fractions')
 *   → { 'Adding Unlike Fractions': 12, 'Mixed Numbers': 8, ... }
 */
export async function countsBySubTopic(supabaseClient, levelDisplay, subjectDb, topicCanonical) {
  if (!supabaseClient || !subjectDb || !topicCanonical) return {};
  try {
    const buildQuery = () => {
      let q = supabaseClient.from('question_bank').select('sub_topic')
        .eq('subject', subjectDb)
        .eq('topic', topicCanonical);
      if (levelDisplay) q = q.eq('level', levelDisplay);
      return q;
    };
    const rows = await paginateAll(buildQuery);
    const out = {};
    let nullCount = 0;
    for (const row of rows) {
      if (!row.sub_topic) {
        nullCount++;
        continue;
      }
      out[row.sub_topic] = (out[row.sub_topic] || 0) + 1;
    }
    // Expose untagged rows under a sentinel key so the UI can decide what
    // to do with them. Currently surfaced as part of the "All <topic>"
    // total via Object.values() summation.
    if (nullCount > 0) out.__untagged__ = nullCount;
    return out;
  } catch (err) {
    console.warn('[syllabus] countsBySubTopic failed:', err);
    return {};
  }
}

// ─────────────────────────────────────────────────────────────────────────
// ADMIN TOGGLE
// ─────────────────────────────────────────────────────────────────────────
export async function readShowCountsFlag(supabaseClient) {
  if (!supabaseClient) return true;
  try {
    const { data, error } = await supabaseClient
      .from('system_settings').select('value').eq('key', 'show_question_counts').maybeSingle();
    if (error) throw error;
    if (!data) return true;
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
// LEGACY GLOBAL EXPOSURE (for non-module quiz.js)
// ─────────────────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.SHL_SYLLABUS = {
    CANONICAL_SYLLABUS, LEVEL_TOPICS, SUBJECT_QUESTION_TYPES, SUBJECT_DB_NAME,
    TOPIC_TYPE_BYPASS, SUB_TOPIC_GROUPS,
    slugify, unslugify, topicsForLevelSubject, subTopicsFor,
    subTopicGroupsFor, resolveSubTopicGroup,
    questionTypesFor, loadLiveCanon, loadLiveLevelTopics,
    countsBySubject, countsByTopic, countsByType, readShowCountsFlag, countsBySubTopic
  };
}