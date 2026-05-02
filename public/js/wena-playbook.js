// ─────────────────────────────────────────────────────────────────────────
// /js/wena-playbook.js — Wena Playbook Loader v2.0 (Sprint 7)
// ─────────────────────────────────────────────────────────────────────────
// Sprint 7: extended to read the v3.0 multi-subject playbook (English +
// Science), keyed by subject|level|topic|sub_topic. Falls back to v2.0
// English-only playbook when v3.0 is absent. The v2 fallback synthesises
// subject="English" for every cell so retrieval is always 4-tuple.
//
// Backward-compat shim on getCell / getFallbackCell: a 3-arg call (level
// first) routes to subject="English" with a console warning. Sprint 8
// will widen handlers.js to call 4-arg.
//
// Canon: ./syllabus.js → CANONICAL_SYLLABUS.{english, science}. Do not
// redefine; drift is a defect.
// ─────────────────────────────────────────────────────────────────────────

import { CANONICAL_SYLLABUS } from './syllabus.js';

// Try v3.0 first; fall back to v2.0 if not deployed yet.
const PLAYBOOK_URL_V3 = '/data/wena-playbook.json';
const PLAYBOOK_URL_V2 = '/data/wena-english-playbook.json';

const ENGLISH_CANON = CANONICAL_SYLLABUS.english;
const SCIENCE_CANON = CANONICAL_SYLLABUS.science;
const ENGLISH_LEVEL_TOPICS = {
  P1: ['Grammar','Vocabulary','Cloze','Comprehension'],
  P2: ['Grammar','Vocabulary','Cloze','Comprehension'],
  P3: ['Grammar','Vocabulary','Cloze','Comprehension','Editing'],
  P4: Object.keys(ENGLISH_CANON),
  P5: Object.keys(ENGLISH_CANON),
  P6: Object.keys(ENGLISH_CANON)
};
const SCIENCE_LEVEL_TOPICS = {
  P3: ['Diversity','Cycles','Interactions'],
  P4: ['Systems','Matter','Cycles','Energy'],
  P5: ['Cycles','Systems'],
  P6: ['Energy','Interactions']
};

const VALID_SUBJECTS = new Set(['English', 'Science']);
const FOUNDATIONAL_MIN_WORDS = 40;
const FOUNDATIONAL_MAX_WORDS = 150;

// ── module-scoped state ────────────────────────────────────────────────
let _index = null;
let _meta = null;
let _schema = null;
let _loadPromise = null;
let _legacyGetCellWarned = false;
let _legacyGetFallbackWarned = false;

// ── helpers ────────────────────────────────────────────────────────────
function makeKey(subject, level, topic, sub_topic) {
  return `${subject}|${level}|${topic}|${sub_topic}`;
}
function isNonEmptyString(v) { return typeof v === 'string' && v.trim().length > 0; }
function wordCount(s)        { return (String(s).trim().match(/\S+/g) || []).length; }

// ── validation ────────────────────────────────────────────────────────
function validateCellBase(cell, idx, subject) {
  const ctx = `[wena-playbook] cells[${idx}] (${subject}|${cell?.level}|${cell?.topic}|${cell?.sub_topic})`;
  if (!/^P[1-6]$/.test(cell?.level || '')) throw new Error(`${ctx}: invalid level "${cell?.level}"`);
  const canon = subject === 'Science' ? SCIENCE_CANON : ENGLISH_CANON;
  const levelTopics = subject === 'Science' ? SCIENCE_LEVEL_TOPICS : ENGLISH_LEVEL_TOPICS;
  const allowed = levelTopics[cell.level] || [];
  if (!allowed.includes(cell.topic)) throw new Error(`${ctx}: topic "${cell.topic}" not permitted at ${cell.level} for ${subject}`);
  const canonSubs = canon[cell.topic];
  if (!canonSubs) throw new Error(`${ctx}: topic "${cell.topic}" not in ${subject} canon`);
  if (!canonSubs.includes(cell.sub_topic)) throw new Error(`${ctx}: sub_topic "${cell.sub_topic}" not in canon for ${subject}/${cell.topic}`);

  if (!isNonEmptyString(cell.moe_outcome)) throw new Error(`${ctx}: moe_outcome empty`);
  if (!Array.isArray(cell.common_misconceptions) || cell.common_misconceptions.length === 0) {
    throw new Error(`${ctx}: common_misconceptions must be non-empty array`);
  }
  for (const m of cell.common_misconceptions) {
    if (!isNonEmptyString(m)) throw new Error(`${ctx}: common_misconceptions contains empty string`);
  }
  if (!isNonEmptyString(cell.foundational_teach_script)) throw new Error(`${ctx}: foundational_teach_script empty`);
  const wc = wordCount(cell.foundational_teach_script);
  if (wc < FOUNDATIONAL_MIN_WORDS || wc > FOUNDATIONAL_MAX_WORDS) {
    throw new Error(`${ctx}: foundational_teach_script word count ${wc} outside [${FOUNDATIONAL_MIN_WORDS},${FOUNDATIONAL_MAX_WORDS}]`);
  }
  const we = cell.worked_example;
  if (!we || typeof we !== 'object') throw new Error(`${ctx}: worked_example must be object`);
  for (const f of ['question','wrong_answer_a_child_might_give','why_its_wrong','step_by_step_reasoning']) {
    if (!isNonEmptyString(we[f])) throw new Error(`${ctx}: worked_example.${f} empty`);
  }
  const cfu = cell.check_for_understanding;
  if (!cfu || typeof cfu !== 'object') throw new Error(`${ctx}: check_for_understanding must be object`);
  for (const f of ['question','if_still_wrong_say']) {
    if (!isNonEmptyString(cfu[f])) throw new Error(`${ctx}: check_for_understanding.${f} empty`);
  }
  if (!isNonEmptyString(cell.scaffolding_progression)) throw new Error(`${ctx}: scaffolding_progression empty`);
}

function validateEnglishCell(cell, idx) {
  validateCellBase(cell, idx, 'English');
  const ctx = `[wena-playbook] cells[${idx}] (English|${cell.level}|${cell.topic}|${cell.sub_topic})`;
  if (!isNonEmptyString(cell.worked_example.correct_answer)) {
    throw new Error(`${ctx}: English worked_example.correct_answer must be a non-empty string`);
  }
  if (!isNonEmptyString(cell.check_for_understanding.expected_answer)) {
    throw new Error(`${ctx}: English check_for_understanding.expected_answer must be a non-empty string`);
  }
}

function validateScienceCell(cell, idx) {
  validateCellBase(cell, idx, 'Science');
  const ctx = `[wena-playbook] cells[${idx}] (Science|${cell.level}|${cell.topic}|${cell.sub_topic})`;
  if (!cell.cer_structure || typeof cell.cer_structure !== 'object') {
    throw new Error(`${ctx}: Science cell missing cer_structure`);
  }
  for (const f of ['claim_prompt','evidence_prompt','reasoning_prompt']) {
    if (!isNonEmptyString(cell.cer_structure[f])) throw new Error(`${ctx}: cer_structure.${f} empty`);
  }
  const wa = cell.worked_example.correct_answer;
  if (!wa || typeof wa !== 'object' || Array.isArray(wa)) {
    throw new Error(`${ctx}: Science worked_example.correct_answer must be a CER-triple object`);
  }
  for (const f of ['claim','evidence','reasoning']) {
    if (!isNonEmptyString(wa[f])) throw new Error(`${ctx}: worked_example.correct_answer.${f} empty`);
  }
  const ea = cell.check_for_understanding.expected_answer;
  if (!ea || typeof ea !== 'object' || Array.isArray(ea)) {
    throw new Error(`${ctx}: Science check_for_understanding.expected_answer must be a CER-triple object`);
  }
  for (const f of ['claim','evidence','reasoning']) {
    if (!isNonEmptyString(ea[f])) throw new Error(`${ctx}: check_for_understanding.expected_answer.${f} empty`);
  }
}

// ── load (v3 first, fall back to v2) ───────────────────────────────────
async function _doLoad() {
  // Try v3 first; HEAD-style probe by attempting the GET and falling through on 404.
  let res = await fetch(PLAYBOOK_URL_V3, { credentials: 'same-origin' });
  let schema = 'v3';
  if (!res.ok) {
    if (res.status !== 404) {
      throw new Error(`[wena-playbook] v3 fetch failed: ${res.status} ${res.statusText}`);
    }
    res = await fetch(PLAYBOOK_URL_V2, { credentials: 'same-origin' });
    schema = 'v2';
    if (!res.ok) throw new Error(`[wena-playbook] v2 fetch failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (!Array.isArray(data?.cells)) throw new Error('[wena-playbook] payload missing cells[]');

  const index = new Map();
  data.cells.forEach((rawCell, i) => {
    const subject = rawCell.subject || 'English';
    if (!VALID_SUBJECTS.has(subject)) {
      throw new Error(`[wena-playbook] cells[${i}]: invalid subject "${subject}"`);
    }
    const cell = { ...rawCell, subject };
    if (subject === 'Science') validateScienceCell(cell, i);
    else                       validateEnglishCell(cell, i);
    const key = makeKey(subject, cell.level, cell.topic, cell.sub_topic);
    if (index.has(key)) throw new Error(`[wena-playbook] duplicate cell key "${key}" at index ${i}`);
    index.set(key, cell);
  });

  _index = index;
  _schema = schema;
  _meta = {
    version: data.version,
    schema,
    source_alignment: data.source_alignment,
    cell_count: data.cell_count ?? data.cells.length,
    cell_count_by_subject: data.cell_count_by_subject || _computeBySubject(data.cells),
    levels_covered: Array.isArray(data.levels_covered) ? data.levels_covered.slice() : [],
    subjects_covered: data.subjects_covered || _computeSubjects(data.cells)
  };
  console.log(
    `[wena-playbook] Loaded ${schema} v${_meta.version}: ${_meta.cell_count} cells across ${_meta.subjects_covered.join(', ')}`
  );
  return _meta;
}
function _computeBySubject(cells) {
  const out = {};
  for (const c of cells) { const s = c.subject || 'English'; out[s] = (out[s] || 0) + 1; }
  return out;
}
function _computeSubjects(cells) {
  return Array.from(new Set(cells.map(c => c.subject || 'English'))).sort();
}

/**
 * Idempotent loader. Concurrent first-calls share a single in-flight fetch.
 * @returns {Promise<{version:string, schema:string, cell_count:number, subjects_covered:string[], levels_covered:string[]}>}
 */
export function loadPlaybook() {
  if (_loadPromise) return _loadPromise;
  _loadPromise = _doLoad().catch((err) => {
    _loadPromise = null;
    _index = null;
    _meta = null;
    _schema = null;
    throw err;
  });
  return _loadPromise;
}

function _getCellInternal(subject, level, topic, sub_topic) {
  if (!_index) return null;
  return _index.get(makeKey(subject, level, topic, sub_topic)) || null;
}
function _getFallbackInternal(subject, level, topic) {
  if (!_index) return null;
  for (const cell of _index.values()) {
    if (cell.subject === subject && cell.level === level && cell.topic === topic) return cell;
  }
  return null;
}

const LEVEL_RX = /^P[1-6]$/;

/**
 * 4-arg: getCell(subject, level, topic, sub_topic).
 * 3-arg: getCell(level, topic, sub_topic) — Sprint 3 legacy; defaults
 * subject="English" with a one-time console warning.
 *
 * @returns {object|null}
 */
export function getCell(a, b, c, d) {
  if (typeof a === 'string' && LEVEL_RX.test(a)) {
    if (!_legacyGetCellWarned) {
      console.warn('[wena-playbook] Legacy 3-arg getCell call; defaulting subject=English. Update caller to 4-arg form.');
      _legacyGetCellWarned = true;
    }
    return _getCellInternal('English', a, b, c);
  }
  return _getCellInternal(a, b, c, d);
}

/**
 * 4-arg: getFallbackCell(subject, level, topic).
 * 3-arg: getFallbackCell(level, topic) — legacy English fallback.
 *
 * @returns {object|null}
 */
export function getFallbackCell(a, b, c) {
  if (typeof a === 'string' && LEVEL_RX.test(a)) {
    if (!_legacyGetFallbackWarned) {
      console.warn('[wena-playbook] Legacy 3-arg getFallbackCell call; defaulting subject=English. Update caller to 4-arg form.');
      _legacyGetFallbackWarned = true;
    }
    return _getFallbackInternal('English', a, b);
  }
  return _getFallbackInternal(a, b, c);
}

/**
 * Returns all cells, optionally filtered by subject.
 * @param {string} [subjectFilter]
 * @returns {object[]}
 */
export function getAllCells(subjectFilter) {
  if (!_index) return [];
  const all = Array.from(_index.values());
  return subjectFilter ? all.filter(c => c.subject === subjectFilter) : all;
}

/** @returns {object|null} */
export function getPlaybookMeta() {
  return _meta;
}

/** @returns {boolean} */
export function isPlaybookLoaded() {
  return _index !== null;
}
