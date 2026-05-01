// ─────────────────────────────────────────────────────────────────────────
// /js/wena-playbook.js — Wena Playbook Loader & Retrieval Index v1.0
// ─────────────────────────────────────────────────────────────────────────
// Single source of truth for runtime access to wena-english-playbook.json
// (147 MOE-aligned pedagogy cells, P1–P6, indexed by level|topic|sub_topic).
//
// Sprint 1 (data foundation only): no chat, no UI, no prompt wiring. The
// loader is consumed by future sprints when stall detection triggers a
// retrieval call.
//
// Design notes:
//   • Lazy-load: nothing fetches until the first retrieval call.
//   • Idempotent concurrency: a shared in-flight Promise guarantees that
//     N parallel callers cause exactly 1 network request.
//   • Fail loud: any schema drift / canon violation throws — silent skip
//     would hide drift between content and the retrieval layer.
//   • No persistent cache (no localStorage/sessionStorage). Index lives
//     in module scope and is rebuilt on full page reload.
//
// Canon source: ./syllabus.js → CANONICAL_SYLLABUS.english. Do NOT redefine
// English topics or sub_topics here — drift is a defect.
// ─────────────────────────────────────────────────────────────────────────

import { CANONICAL_SYLLABUS } from './syllabus.js';

// Web URL for the playbook. Resolves under both `vercel dev` and
// `npx serve public` (the file lives at public/data/wena-english-playbook.json).
const PLAYBOOK_URL = '/data/wena-english-playbook.json';

const ENGLISH_CANON = CANONICAL_SYLLABUS.english;
const CANON_TOPICS = Object.keys(ENGLISH_CANON);

// Topics permitted at each level. Mirrors the LEVEL_TOPICS constraint used
// during consolidation: P1/P2 grammar/vocab/cloze/comprehension only;
// Editing enters at P3; Synthesis enters at P4.
const LEVEL_TOPICS = {
  P1: ['Grammar', 'Vocabulary', 'Cloze', 'Comprehension'],
  P2: ['Grammar', 'Vocabulary', 'Cloze', 'Comprehension'],
  P3: ['Grammar', 'Vocabulary', 'Cloze', 'Comprehension', 'Editing'],
  P4: CANON_TOPICS,
  P5: CANON_TOPICS,
  P6: CANON_TOPICS
};

const FOUNDATIONAL_MIN_WORDS = 40;
const FOUNDATIONAL_MAX_WORDS = 150;

// ── module-scoped state (no persistent cache) ──────────────────────────
let _index = null;        // Map<"level|topic|sub_topic", Cell>
let _meta = null;          // { version, source_alignment, cell_count, levels_covered }
let _loadPromise = null;   // shared in-flight Promise; null when idle or after failure

// ── helpers ────────────────────────────────────────────────────────────
function makeKey(level, topic, sub_topic) {
  return `${level}|${topic}|${sub_topic}`;
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function wordCount(s) {
  return (String(s).trim().match(/\S+/g) || []).length;
}

/**
 * Validates a single cell against the schema. Throws a descriptive Error on
 * the first violation. Required-field checks are exhaustive — see the
 * Sprint 1 spec, "Required fields per cell".
 *
 * @param {object} cell  — playbook cell
 * @param {number} idx   — array index (for error context)
 * @throws {Error} on any schema, canon, or level-topic violation
 */
function validateCell(cell, idx) {
  const ctx = `[wena-playbook] cells[${idx}] (${cell?.level}|${cell?.topic}|${cell?.sub_topic})`;

  // Level shape.
  if (!/^P[1-6]$/.test(cell?.level || '')) {
    throw new Error(`${ctx}: invalid level "${cell?.level}" (must match /^P[1-6]$/)`);
  }

  // Topic must be in canon.
  if (!CANON_TOPICS.includes(cell.topic)) {
    throw new Error(`${ctx}: topic "${cell.topic}" not in CANONICAL_SYLLABUS.english`);
  }

  // Topic must be permitted at this level.
  if (!LEVEL_TOPICS[cell.level].includes(cell.topic)) {
    throw new Error(`${ctx}: topic "${cell.topic}" not permitted at ${cell.level}`);
  }

  // Sub-topic must be in canon for this topic.
  const canonSubs = ENGLISH_CANON[cell.topic];
  if (!canonSubs.includes(cell.sub_topic)) {
    throw new Error(`${ctx}: sub_topic "${cell.sub_topic}" not in canon for ${cell.topic}`);
  }

  if (!isNonEmptyString(cell.moe_outcome)) {
    throw new Error(`${ctx}: moe_outcome must be a non-empty string`);
  }

  if (!Array.isArray(cell.common_misconceptions) || cell.common_misconceptions.length === 0) {
    throw new Error(`${ctx}: common_misconceptions must be a non-empty array`);
  }
  for (const m of cell.common_misconceptions) {
    if (!isNonEmptyString(m)) {
      throw new Error(`${ctx}: common_misconceptions contains an empty string`);
    }
  }

  if (!isNonEmptyString(cell.foundational_teach_script)) {
    throw new Error(`${ctx}: foundational_teach_script must be a non-empty string`);
  }
  const wc = wordCount(cell.foundational_teach_script);
  if (wc < FOUNDATIONAL_MIN_WORDS || wc > FOUNDATIONAL_MAX_WORDS) {
    throw new Error(
      `${ctx}: foundational_teach_script word count ${wc} outside [${FOUNDATIONAL_MIN_WORDS},${FOUNDATIONAL_MAX_WORDS}]`
    );
  }

  // worked_example sub-fields.
  const we = cell.worked_example;
  if (!we || typeof we !== 'object') {
    throw new Error(`${ctx}: worked_example must be an object`);
  }
  for (const f of ['question', 'wrong_answer_a_child_might_give', 'why_its_wrong', 'correct_answer', 'step_by_step_reasoning']) {
    if (!isNonEmptyString(we[f])) {
      throw new Error(`${ctx}: worked_example.${f} must be a non-empty string`);
    }
  }

  // check_for_understanding sub-fields.
  const cfu = cell.check_for_understanding;
  if (!cfu || typeof cfu !== 'object') {
    throw new Error(`${ctx}: check_for_understanding must be an object`);
  }
  for (const f of ['question', 'expected_answer', 'if_still_wrong_say']) {
    if (!isNonEmptyString(cfu[f])) {
      throw new Error(`${ctx}: check_for_understanding.${f} must be a non-empty string`);
    }
  }

  if (!isNonEmptyString(cell.scaffolding_progression)) {
    throw new Error(`${ctx}: scaffolding_progression must be a non-empty string`);
  }
}

/**
 * Performs the actual fetch + validation + index build. Called exactly once
 * via the shared `_loadPromise` cache.
 *
 * @returns {Promise<object>} resolves to the meta object (also cached in `_meta`)
 * @throws {Error} on fetch failure, JSON parse failure, or any cell-level
 *                 validation failure
 */
async function _doLoad() {
  const res = await fetch(PLAYBOOK_URL, { credentials: 'same-origin' });
  if (!res.ok) {
    throw new Error(`[wena-playbook] fetch failed: ${res.status} ${res.statusText} (${PLAYBOOK_URL})`);
  }
  const data = await res.json();
  if (!Array.isArray(data?.cells)) {
    throw new Error('[wena-playbook] payload missing cells[] array');
  }

  // Validate every cell BEFORE installing the index — partial installs are
  // worse than a clean failure.
  const index = new Map();
  data.cells.forEach((cell, i) => {
    validateCell(cell, i);
    const key = makeKey(cell.level, cell.topic, cell.sub_topic);
    if (index.has(key)) {
      throw new Error(`[wena-playbook] duplicate cell key "${key}" at index ${i}`);
    }
    index.set(key, cell);
  });

  _index = index;
  _meta = {
    version: data.version,
    source_alignment: data.source_alignment,
    cell_count: data.cell_count,
    levels_covered: Array.isArray(data.levels_covered) ? data.levels_covered.slice() : []
  };

  // One-line success log per page load.
  console.log(
    `[wena-playbook] Loaded v${_meta.version}: ${_meta.cell_count} cells, levels {${_meta.levels_covered.join(',')}}`
  );

  return _meta;
}

// ── public API ─────────────────────────────────────────────────────────

/**
 * Fetches and validates the playbook (idempotent). Concurrent callers share
 * a single in-flight Promise; only one network request is issued per page
 * lifetime. On failure, the cache is cleared so a subsequent call can retry.
 *
 * @returns {Promise<{version:string, source_alignment:string, cell_count:number, levels_covered:string[]}>}
 * @throws {Error} on fetch / JSON / validation failure
 */
export function loadPlaybook() {
  if (_loadPromise) return _loadPromise;
  _loadPromise = _doLoad().catch((err) => {
    // Reset so a future caller can retry (e.g., after a transient network blip).
    _loadPromise = null;
    _index = null;
    _meta = null;
    throw err;
  });
  return _loadPromise;
}

/**
 * Returns the cell at the exact (level, topic, sub_topic) coordinate, or
 * null if not found OR if the playbook has not yet been loaded.
 *
 * Sprint 1 chosen behaviour for "called before loadPlaybook()": returns null
 * gracefully (does NOT auto-load). Callers that need the data must await
 * loadPlaybook() first. This keeps the function synchronous — important for
 * future call sites that may be inside hot paths.
 *
 * @param {string} level     — "P1" through "P6"
 * @param {string} topic     — canonical topic from CANONICAL_SYLLABUS.english
 * @param {string} sub_topic — canonical sub_topic for that topic
 * @returns {object|null}    — cell object, or null if missing/not loaded
 */
export function getCell(level, topic, sub_topic) {
  if (!_index) return null;
  return _index.get(makeKey(level, topic, sub_topic)) || null;
}

/**
 * Returns the first cell at (level, topic) regardless of sub_topic.
 * Intended for retrieval fallback when stall detection knows the level +
 * topic but cannot resolve a specific sub_topic. Returns null if no cell
 * matches OR if the playbook has not yet been loaded.
 *
 * @param {string} level — "P1" through "P6"
 * @param {string} topic — canonical topic
 * @returns {object|null}
 */
export function getFallbackCell(level, topic) {
  if (!_index) return null;
  for (const cell of _index.values()) {
    if (cell.level === level && cell.topic === topic) return cell;
  }
  return null;
}

/**
 * Returns a snapshot of all loaded cells. Empty array before load.
 * Returned array is a fresh copy; mutating it does not affect the index.
 *
 * @returns {object[]}
 */
export function getAllCells() {
  if (!_index) return [];
  return Array.from(_index.values());
}

/**
 * Returns playbook envelope metadata. Null before load.
 *
 * @returns {{version:string, source_alignment:string, cell_count:number, levels_covered:string[]}|null}
 */
export function getPlaybookMeta() {
  return _meta;
}

/**
 * Whether the playbook is loaded and indexed. Useful for guards in callers
 * that want to skip retrieval without awaiting.
 *
 * @returns {boolean}
 */
export function isPlaybookLoaded() {
  return _index !== null;
}
