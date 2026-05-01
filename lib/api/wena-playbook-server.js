// ─────────────────────────────────────────────────────────────────────────
// lib/api/wena-playbook-server.js — Server-side Wena Playbook loader v1.0
// ─────────────────────────────────────────────────────────────────────────
// Mirrors the public-facing /js/wena-playbook.js loader, but reads the
// playbook JSON from disk via fs.readFileSync instead of fetch(). The
// browser variant uses fetch and lives under public/ so the test harness
// can import it; this server variant is what handleChat (in handlers.js)
// imports because Vercel serverless functions can't fetch their own
// static assets reliably.
//
// Same validation surface, same retrieval API, same single-source-of-
// truth playbook file at data/wena-english-playbook.json (the
// consolidation script's output, mirrored for the browser at
// public/data/wena-english-playbook.json by Sprint 1).
// ─────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

// Canon mirrored from public/js/syllabus.js → CANONICAL_SYLLABUS.english.
// Inlined here to avoid pulling browser-side syllabus.js into the server
// bundle (its `loadLiveCanon` Supabase calls are not relevant here).
const ENGLISH_CANON = {
  Grammar: ['Simple Present And Past Tenses','Perfect And Continuous Tenses','Subject-Verb Agreement','Singular And Plural Nouns','Prepositions And Phrasal Verbs','Conjunctions','Active And Passive Voice','Relative Pronouns'],
  Vocabulary: ['Thematic Vocabulary Recall','Contextual Vocabulary Meaning','Synonyms And Antonyms'],
  Cloze: ['Grammar Cloze With Word Bank','Vocabulary Cloze With Dropdowns','Comprehension Free-Text Cloze'],
  Editing: ['Correcting Spelling Errors','Correcting Grammatical Errors'],
  Comprehension: ['Direct Visual Retrieval','True Or False With Reason','Pronoun Referent Table','Sequencing Of Events','Deep Inference And Claim Evidence Reasoning','Visual Text Literal Retrieval','Visual Text Inference And Purpose'],
  Synthesis: ['Combining With Conjunctions','Relative Clauses','Participle Phrases','Conditional Sentences','Reported Speech Transformation','Active To Passive Voice Transformation','Inversion']
};
const CANON_TOPICS = Object.keys(ENGLISH_CANON);

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

const __filename = url.fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
// data/wena-english-playbook.json is the source-of-truth (consolidation
// script writes here). public/data/ holds a mirrored runtime asset for
// the browser. Server reads from data/ to avoid coupling to public/.
const PLAYBOOK_PATH = path.resolve(__dirname, '../../data/wena-english-playbook.json');

let _index = null;
let _meta = null;
let _loadPromise = null;

function makeKey(level, topic, sub_topic) {
  return `${level}|${topic}|${sub_topic}`;
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function wordCount(s) {
  return (String(s).trim().match(/\S+/g) || []).length;
}

function validateCell(cell, idx) {
  const ctx = `[wena-playbook-server] cells[${idx}] (${cell?.level}|${cell?.topic}|${cell?.sub_topic})`;
  if (!/^P[1-6]$/.test(cell?.level || '')) throw new Error(`${ctx}: invalid level "${cell?.level}"`);
  if (!CANON_TOPICS.includes(cell.topic)) throw new Error(`${ctx}: topic "${cell.topic}" not in canon`);
  if (!LEVEL_TOPICS[cell.level].includes(cell.topic)) throw new Error(`${ctx}: topic "${cell.topic}" not permitted at ${cell.level}`);
  if (!ENGLISH_CANON[cell.topic].includes(cell.sub_topic)) {
    throw new Error(`${ctx}: sub_topic "${cell.sub_topic}" not in canon for ${cell.topic}`);
  }
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
  for (const f of ['question','wrong_answer_a_child_might_give','why_its_wrong','correct_answer','step_by_step_reasoning']) {
    if (!isNonEmptyString(we[f])) throw new Error(`${ctx}: worked_example.${f} empty`);
  }
  const cfu = cell.check_for_understanding;
  if (!cfu || typeof cfu !== 'object') throw new Error(`${ctx}: check_for_understanding must be object`);
  for (const f of ['question','expected_answer','if_still_wrong_say']) {
    if (!isNonEmptyString(cfu[f])) throw new Error(`${ctx}: check_for_understanding.${f} empty`);
  }
  if (!isNonEmptyString(cell.scaffolding_progression)) throw new Error(`${ctx}: scaffolding_progression empty`);
}

async function _doLoad() {
  // Read synchronously — startup-only operation, no benefit to async on
  // a serverless cold start. Validates every cell before installing.
  const raw = fs.readFileSync(PLAYBOOK_PATH, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data?.cells)) throw new Error('[wena-playbook-server] payload missing cells[]');

  const index = new Map();
  data.cells.forEach((cell, i) => {
    validateCell(cell, i);
    const key = makeKey(cell.level, cell.topic, cell.sub_topic);
    if (index.has(key)) throw new Error(`[wena-playbook-server] duplicate cell key "${key}" at index ${i}`);
    index.set(key, cell);
  });

  _index = index;
  _meta = {
    version: data.version,
    source_alignment: data.source_alignment,
    cell_count: data.cell_count,
    levels_covered: Array.isArray(data.levels_covered) ? data.levels_covered.slice() : []
  };
  console.log(`[wena-playbook-server] Loaded v${_meta.version}: ${_meta.cell_count} cells, levels {${_meta.levels_covered.join(',')}}`);
  return _meta;
}

/**
 * Idempotent load. Subsequent calls return the cached load promise.
 * @returns {Promise<{version:string, source_alignment:string, cell_count:number, levels_covered:string[]}>}
 */
export function loadPlaybook() {
  if (_loadPromise) return _loadPromise;
  _loadPromise = _doLoad().catch((err) => {
    _loadPromise = null;
    _index = null;
    _meta = null;
    throw err;
  });
  return _loadPromise;
}

/**
 * Exact-match cell lookup. Returns null if not loaded or not found.
 * @returns {object|null}
 */
export function getCell(level, topic, sub_topic) {
  if (!_index) return null;
  return _index.get(makeKey(level, topic, sub_topic)) || null;
}

/**
 * First cell at (level, topic). Returns null if not loaded or none match.
 * @returns {object|null}
 */
export function getFallbackCell(level, topic) {
  if (!_index) return null;
  for (const cell of _index.values()) {
    if (cell.level === level && cell.topic === topic) return cell;
  }
  return null;
}

/** @returns {object[]} */
export function getAllCells() {
  if (!_index) return [];
  return Array.from(_index.values());
}

/** @returns {object|null} */
export function getPlaybookMeta() {
  return _meta;
}

/** @returns {boolean} */
export function isPlaybookLoaded() {
  return _index !== null;
}
