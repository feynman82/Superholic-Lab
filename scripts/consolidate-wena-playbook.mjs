// Consolidates Wena English Playbook raw NotebookLM output into the canonical
// envelope at data/wena-english-playbook.json.
//
// Reads:
//   - data/wena_english_playbook_raw.json (primary)
//   - data/raw/wena_playbook_raw_*.json   (append-mode batches, optional)
//
// Run: node scripts/consolidate-wena-playbook.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const PRIMARY_RAW = path.join(REPO_ROOT, 'data', 'wena_english_playbook_raw.json');
const RAW_DIR = path.join(REPO_ROOT, 'data', 'raw');
const OUTPUT = path.join(REPO_ROOT, 'data', 'wena-english-playbook.json');

// The primary raw file holds the full P1–P6 NotebookLM output. Append-mode
// batches dropped into `data/raw/wena_playbook_raw_*.json` are accepted at
// any level and merged on top with last-write-wins dedupe.
const PRIMARY_LEVELS = new Set(['P1', 'P2', 'P3', 'P4', 'P5', 'P6']);

// Canon mirrored from public/js/syllabus.js → CANONICAL_SYLLABUS.english
const CANON = {
  Grammar: ['Simple Present And Past Tenses','Perfect And Continuous Tenses','Subject-Verb Agreement','Singular And Plural Nouns','Prepositions And Phrasal Verbs','Conjunctions','Active And Passive Voice','Relative Pronouns'],
  Vocabulary: ['Thematic Vocabulary Recall','Contextual Vocabulary Meaning','Synonyms And Antonyms'],
  Cloze: ['Grammar Cloze With Word Bank','Vocabulary Cloze With Dropdowns','Comprehension Free-Text Cloze'],
  Editing: ['Correcting Spelling Errors','Correcting Grammatical Errors'],
  Comprehension: ['Direct Visual Retrieval','True Or False With Reason','Pronoun Referent Table','Sequencing Of Events','Deep Inference And Claim Evidence Reasoning','Visual Text Literal Retrieval','Visual Text Inference And Purpose'],
  Synthesis: ['Combining With Conjunctions','Relative Clauses','Participle Phrases','Conditional Sentences','Reported Speech Transformation','Active To Passive Voice Transformation','Inversion']
};

// Topics permitted at each level (LEVEL_TOPICS constraint from spec)
const LEVEL_TOPICS = {
  P1: ['Grammar','Vocabulary','Cloze','Comprehension'],
  P2: ['Grammar','Vocabulary','Cloze','Comprehension'],
  P3: ['Grammar','Vocabulary','Cloze','Comprehension','Editing'],
  P4: ['Grammar','Vocabulary','Cloze','Comprehension','Editing','Synthesis'],
  P5: ['Grammar','Vocabulary','Cloze','Comprehension','Editing','Synthesis'],
  P6: ['Grammar','Vocabulary','Cloze','Comprehension','Editing','Synthesis']
};

const REQUIRED_FIELDS = [
  'level','topic','sub_topic','moe_outcome','common_misconceptions',
  'foundational_teach_script','worked_example','check_for_understanding',
  'scaffolding_progression'
];
const REQUIRED_WE = ['question','wrong_answer_a_child_might_give','why_its_wrong','correct_answer','step_by_step_reasoning'];
const REQUIRED_CFU = ['question','expected_answer','if_still_wrong_say'];

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function titleCase(s) {
  if (typeof s !== 'string') return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// Strip markdown code fences (```json and ```), then split a string of
// concatenated JSON objects into individual { ... } blocks by tracking
// brace depth (string-aware).
function extractJsonBlocks(text) {
  const stripped = text.replace(/```(?:json)?/gi, '');
  const blocks = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (inString) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        blocks.push(stripped.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return blocks;
}

// Recursively scrub forbidden URL patterns from string values.
function scrubStrings(value) {
  if (typeof value === 'string') {
    return value.replace(/https?:\/\/(?:www\.)?lilbutmightyenglish\.com\/?\S*/gi, '').trim();
  }
  if (Array.isArray(value)) return value.map(scrubStrings);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = scrubStrings(value[k]);
    return out;
  }
  return value;
}

function shouldStripNotes(notes) {
  if (typeof notes !== 'string') return false;
  if (/source coverage thin/i.test(notes)) return true;
  // Drop any notes that reference the external blog source — required by
  // verification rule "no cell contains 'lilbutmighty' or 'blog'".
  if (/lilbutmighty|\bLBM\b|\bblog\b/i.test(notes)) return true;
  return false;
}

function isCellValid(cell, warn) {
  for (const f of REQUIRED_FIELDS) {
    if (cell[f] === undefined || cell[f] === null) {
      warn(`missing required field "${f}"`);
      return false;
    }
  }
  for (const f of REQUIRED_WE) {
    if (!cell.worked_example || cell.worked_example[f] === undefined) {
      warn(`worked_example missing "${f}"`);
      return false;
    }
  }
  for (const f of REQUIRED_CFU) {
    if (!cell.check_for_understanding || cell.check_for_understanding[f] === undefined) {
      warn(`check_for_understanding missing "${f}"`);
      return false;
    }
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────

// Each source carries a `levelFilter` — when set, only cells whose `level`
// matches are consumed from that file. The primary raw file is gated to
// PRIMARY_LEVELS; append-mode batches in data/raw/ are wide open.
const sources = [];
if (fs.existsSync(PRIMARY_RAW)) sources.push({ file: PRIMARY_RAW, levelFilter: PRIMARY_LEVELS });
if (fs.existsSync(RAW_DIR)) {
  const batches = fs.readdirSync(RAW_DIR)
    .filter(f => /^wena_playbook_raw_.*\.json$/.test(f))
    .map(f => path.join(RAW_DIR, f))
    .sort();
  for (const f of batches) sources.push({ file: f, levelFilter: null });
}
if (sources.length === 0) {
  console.error(`[fatal] no source files found at ${PRIMARY_RAW} or ${RAW_DIR}`);
  process.exit(1);
}

const skipped = [];
const warnings = [];
const cellsByKey = new Map(); // last-write-wins dedupe

for (const { file, levelFilter } of sources) {
  const text = fs.readFileSync(file, 'utf8');
  const blocks = extractJsonBlocks(text);
  const scope = levelFilter ? ` (levels: ${[...levelFilter].sort().join(', ')})` : '';
  console.log(`[parse] ${path.relative(REPO_ROOT, file)} → ${blocks.length} JSON blocks${scope}`);

  for (const [idx, block] of blocks.entries()) {
    let obj;
    try {
      obj = JSON.parse(block);
    } catch (e) {
      warnings.push(`${path.basename(file)} block #${idx + 1}: JSON parse failed (${e.message})`);
      continue;
    }
    if (!Array.isArray(obj.cells)) {
      // Drop coverage_map and any other non-cell envelope.
      continue;
    }

    for (const rawCell of obj.cells) {
      if (levelFilter && !levelFilter.has(rawCell.level)) continue;
      // Defensive copy + URL scrub on every string in the cell.
      let cell = scrubStrings(rawCell);

      // Normalise topic to Title Case.
      cell.topic = titleCase(cell.topic);

      const ctx = `${cell.level}/${cell.topic}/${cell.sub_topic}`;
      const warn = (msg) => warnings.push(`[${ctx}] ${msg}`);

      // Strip notes when it is audit metadata (source coverage / blog refs).
      if (cell.notes !== undefined && shouldStripNotes(cell.notes)) {
        delete cell.notes;
      }

      // Level/topic constraint.
      const allowed = LEVEL_TOPICS[cell.level];
      if (!allowed) {
        skipped.push({ ctx, reason: `unknown level "${cell.level}"` });
        continue;
      }
      if (!allowed.includes(cell.topic)) {
        skipped.push({ ctx, reason: `topic "${cell.topic}" not allowed at ${cell.level}` });
        continue;
      }

      // Sub-topic must be in canon for this topic.
      const canonSubs = CANON[cell.topic];
      if (!canonSubs) {
        skipped.push({ ctx, reason: `topic "${cell.topic}" not in canon` });
        continue;
      }
      if (!canonSubs.includes(cell.sub_topic)) {
        skipped.push({ ctx, reason: `sub_topic "${cell.sub_topic}" not in canon for ${cell.topic}` });
        continue;
      }

      // Required-field validation.
      if (!isCellValid(cell, warn)) {
        skipped.push({ ctx, reason: 'failed required-field validation' });
        continue;
      }

      const key = `${cell.level}|${cell.topic}|${cell.sub_topic}`;
      cellsByKey.set(key, cell);
    }
  }
}

const cells = Array.from(cellsByKey.values()).sort((a, b) => {
  const lvl = a.level.localeCompare(b.level);
  if (lvl !== 0) return lvl;
  const topicOrder = ['Grammar','Vocabulary','Cloze','Editing','Comprehension','Synthesis'];
  const t = topicOrder.indexOf(a.topic) - topicOrder.indexOf(b.topic);
  if (t !== 0) return t;
  return a.sub_topic.localeCompare(b.sub_topic);
});

const levelsCovered = Array.from(new Set(cells.map(c => c.level))).sort();

const envelope = {
  version: '2.0',
  source_alignment: 'Singapore MOE 2020 English Language Syllabus + Superholic Lab canon v5.0',
  generated_at: new Date().toISOString(),
  levels_covered: levelsCovered,
  cell_count: cells.length,
  cells
};

// ─────────────────────────────────────────────────────────────────────────
// Self-checks (fail loud)
// ─────────────────────────────────────────────────────────────────────────

const serialized = JSON.stringify(envelope, null, 2);

const checkErrors = [];
if (/lilbutmighty/i.test(serialized)) checkErrors.push('output contains "lilbutmighty"');
// "blog" as a whole word — narrative text may legitimately use the word, but
// the spec's intent is to keep audit metadata out. Use word-boundary check.
if (/\bblog\b/i.test(serialized)) checkErrors.push('output contains the word "blog"');

const seenKeys = new Set();
for (const c of cells) {
  const k = `${c.level}|${c.topic}|${c.sub_topic}`;
  if (seenKeys.has(k)) checkErrors.push(`duplicate cell key ${k}`);
  seenKeys.add(k);
}

if (checkErrors.length) {
  console.error('[fatal] self-check failed:');
  for (const e of checkErrors) console.error('  -', e);
  process.exit(1);
}

fs.writeFileSync(OUTPUT, serialized, 'utf8');

// ─────────────────────────────────────────────────────────────────────────
// Coverage report
// ─────────────────────────────────────────────────────────────────────────

const byLevelTopic = {};
for (const c of cells) {
  byLevelTopic[c.level] ??= {};
  byLevelTopic[c.level][c.topic] = (byLevelTopic[c.level][c.topic] || 0) + 1;
}

console.log('');
console.log(`[ok] wrote ${path.relative(REPO_ROOT, OUTPUT)} — ${cells.length} cells across ${levelsCovered.length} levels`);
console.log('');
console.log('Coverage by level/topic:');
for (const level of Object.keys(byLevelTopic).sort()) {
  const total = Object.values(byLevelTopic[level]).reduce((a, b) => a + b, 0);
  const breakdown = Object.entries(byLevelTopic[level]).map(([t, n]) => `${t}=${n}`).join(', ');
  console.log(`  ${level}  (${total})  ${breakdown}`);
}

if (skipped.length) {
  console.log('');
  console.log(`Skipped ${skipped.length} cell(s):`);
  for (const s of skipped) console.log(`  - ${s.ctx} → ${s.reason}`);
}

if (warnings.length) {
  console.log('');
  console.log(`${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  - ${w}`);
}
