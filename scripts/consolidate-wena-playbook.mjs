// Consolidates Wena Playbook raw cells into the canonical envelopes.
//
// Reads (English mode, default):
//   - data/wena_english_playbook_raw.json (primary)
//   - data/raw/wena_playbook_raw_*.json   (append-mode batches, optional)
//
// Reads (Science mode, --subject Science):
//   - data/raw/science/*.json (one file per topic, each with cells: [...])
//
// Reads (Merge mode, --merge-subjects):
//   - data/wena-english-playbook.json (v2.0)
//   - data/wena-science-playbook.json (v3.0)
//
// Outputs:
//   data/wena-english-playbook.json  (v2.0, English-only — preserved by Sprint 6)
//   data/wena-science-playbook.json  (v3.0, Science-only — Sprint 6)
//   data/wena-playbook.json          (v3.0 merged — Sprint 6)
//
// Usage:
//   node scripts/consolidate-wena-playbook.mjs                     # English v2.0 (default)
//   node scripts/consolidate-wena-playbook.mjs --subject Science   # Science v3.0
//   node scripts/consolidate-wena-playbook.mjs --merge-subjects    # English + Science → v3.0

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const PRIMARY_RAW = path.join(REPO_ROOT, 'data', 'wena_english_playbook_raw.json');
const RAW_DIR = path.join(REPO_ROOT, 'data', 'raw');
const SCIENCE_RAW_DIR = path.join(REPO_ROOT, 'data', 'raw', 'science');
const ENGLISH_OUTPUT = path.join(REPO_ROOT, 'data', 'wena-english-playbook.json');
const SCIENCE_OUTPUT = path.join(REPO_ROOT, 'data', 'wena-science-playbook.json');
const MERGED_OUTPUT  = path.join(REPO_ROOT, 'data', 'wena-playbook.json');

// ─── argv parsing ─────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { subject: null, mergeSubjects: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--merge-subjects') { args.mergeSubjects = true; continue; }
    if (a === '--subject') { args.subject = argv[++i] || null; continue; }
    if (a.startsWith('--subject=')) { args.subject = a.slice('--subject='.length); continue; }
  }
  return args;
}
const ARGS = parseArgs(process.argv.slice(2));

// ─── ENGLISH canon (Sprint 1-3) ────────────────────────────────────────────
const PRIMARY_LEVELS = new Set(['P1', 'P2', 'P3', 'P4', 'P5', 'P6']);
const ENGLISH_CANON = {
  Grammar: ['Simple Present And Past Tenses','Perfect And Continuous Tenses','Subject-Verb Agreement','Singular And Plural Nouns','Prepositions And Phrasal Verbs','Conjunctions','Active And Passive Voice','Relative Pronouns'],
  Vocabulary: ['Thematic Vocabulary Recall','Contextual Vocabulary Meaning','Synonyms And Antonyms'],
  Cloze: ['Grammar Cloze With Word Bank','Vocabulary Cloze With Dropdowns','Comprehension Free-Text Cloze'],
  Editing: ['Correcting Spelling Errors','Correcting Grammatical Errors'],
  Comprehension: ['Direct Visual Retrieval','True Or False With Reason','Pronoun Referent Table','Sequencing Of Events','Deep Inference And Claim Evidence Reasoning','Visual Text Literal Retrieval','Visual Text Inference And Purpose'],
  Synthesis: ['Combining With Conjunctions','Relative Clauses','Participle Phrases','Conditional Sentences','Reported Speech Transformation','Active To Passive Voice Transformation','Inversion']
};
const ENGLISH_LEVEL_TOPICS = {
  P1: ['Grammar','Vocabulary','Cloze','Comprehension'],
  P2: ['Grammar','Vocabulary','Cloze','Comprehension'],
  P3: ['Grammar','Vocabulary','Cloze','Comprehension','Editing'],
  P4: ['Grammar','Vocabulary','Cloze','Comprehension','Editing','Synthesis'],
  P5: ['Grammar','Vocabulary','Cloze','Comprehension','Editing','Synthesis'],
  P6: ['Grammar','Vocabulary','Cloze','Comprehension','Editing','Synthesis']
};
const ENGLISH_TOPIC_ORDER = ['Grammar','Vocabulary','Cloze','Editing','Comprehension','Synthesis'];

// ─── SCIENCE canon (Sprint 6, mirrors public/js/syllabus.js) ──────────────
const SCIENCE_CANON = {
  Diversity:    ['General Characteristics Of Living And Non-Living Things','Classification Of Living And Non-Living Things','Diversity Of Materials And Their Properties'],
  Cycles:       ['Life Cycles Of Insects','Life Cycles Of Amphibians','Life Cycles Of Flowering Plants','Reproduction In Plants And Animals','Stages Of The Water Cycle'],
  Matter:       ['States Of Matter','Properties Of Solids, Liquids And Gases','Changes In State Of Matter'],
  Systems:      ['Plant Parts And Functions','Human Digestive System','Plant Respiratory And Circulatory Systems','Human Respiratory And Circulatory Systems','Electrical Systems And Circuits'],
  Energy:       ['Sources Of Light','Reflection Of Light','Formation Of Shadows','Transparent, Translucent And Opaque Materials','Sources Of Heat','Effects Of Heat Gain And Heat Loss','Temperature And Use Of Thermometers','Good And Poor Conductors Of Heat','Photosynthesis And Energy Pathways','Energy Conversion In Everyday Objects'],
  Interactions: ['Interaction Of Magnetic Forces','Frictional Force','Gravitational Force','Elastic Spring Force','Effects Of Forces On Objects','Interactions Within The Environment','Food Chains And Food Webs']
};
const SCIENCE_LEVEL_TOPICS = {
  P3: ['Diversity','Cycles','Interactions'],
  P4: ['Systems','Matter','Cycles','Energy'],
  P5: ['Cycles','Systems'],
  P6: ['Energy','Interactions']
};
const SCIENCE_TOPIC_ORDER = ['Diversity','Cycles','Matter','Systems','Energy','Interactions'];

// ─── Required-field schemas ───────────────────────────────────────────────
const REQUIRED_FIELDS_BASE = [
  'level','topic','sub_topic','moe_outcome','common_misconceptions',
  'foundational_teach_script','worked_example','check_for_understanding',
  'scaffolding_progression'
];
const REQUIRED_WE_FIELDS  = ['question','wrong_answer_a_child_might_give','why_its_wrong','correct_answer','step_by_step_reasoning'];
const REQUIRED_CFU_FIELDS = ['question','expected_answer','if_still_wrong_say'];

// Science-only additions (CER block + structured correct/expected answers)
const REQUIRED_CER_FIELDS = ['claim_prompt','evidence_prompt','reasoning_prompt'];
const REQUIRED_CER_TRIPLE = ['claim','evidence','reasoning'];

// ─── Helpers ──────────────────────────────────────────────────────────────

function titleCase(s) {
  if (typeof s !== 'string') return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// Strip markdown code fences, then split concatenated JSON objects.
function extractJsonBlocks(text) {
  const stripped = text.replace(/```(?:json)?/gi, '');
  const blocks = [];
  let depth = 0, start = -1, inString = false, escape = false;
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (inString) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{') { if (depth === 0) start = i; depth++; }
    else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) { blocks.push(stripped.slice(start, i + 1)); start = -1; }
    }
  }
  return blocks;
}

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
  if (/lilbutmighty|\bLBM\b|\bblog\b/i.test(notes)) return true;
  return false;
}

function isCellBaseValid(cell, warn) {
  for (const f of REQUIRED_FIELDS_BASE) {
    if (cell[f] === undefined || cell[f] === null) { warn(`missing required field "${f}"`); return false; }
  }
  for (const f of REQUIRED_WE_FIELDS) {
    if (!cell.worked_example || cell.worked_example[f] === undefined) { warn(`worked_example missing "${f}"`); return false; }
  }
  for (const f of REQUIRED_CFU_FIELDS) {
    if (!cell.check_for_understanding || cell.check_for_understanding[f] === undefined) { warn(`check_for_understanding missing "${f}"`); return false; }
  }
  return true;
}

// Sprint 6: Science cells must have cer_structure block + CER-triple shape on
// worked_example.correct_answer and check_for_understanding.expected_answer.
function isCellScienceCerValid(cell, warn) {
  if (!cell.cer_structure || typeof cell.cer_structure !== 'object') {
    warn('cer_structure block missing'); return false;
  }
  for (const f of REQUIRED_CER_FIELDS) {
    if (!cell.cer_structure[f] || typeof cell.cer_structure[f] !== 'string' || cell.cer_structure[f].trim() === '') {
      warn(`cer_structure.${f} missing or empty`); return false;
    }
  }
  const we = cell.worked_example?.correct_answer;
  if (!we || typeof we !== 'object' || Array.isArray(we)) {
    warn('worked_example.correct_answer must be a CER-triple object'); return false;
  }
  for (const f of REQUIRED_CER_TRIPLE) {
    if (!we[f] || typeof we[f] !== 'string' || we[f].trim() === '') {
      warn(`worked_example.correct_answer.${f} missing or empty`); return false;
    }
  }
  const cfu = cell.check_for_understanding?.expected_answer;
  if (!cfu || typeof cfu !== 'object' || Array.isArray(cfu)) {
    warn('check_for_understanding.expected_answer must be a CER-triple object'); return false;
  }
  for (const f of REQUIRED_CER_TRIPLE) {
    if (!cfu[f] || typeof cfu[f] !== 'string' || cfu[f].trim() === '') {
      warn(`check_for_understanding.expected_answer.${f} missing or empty`); return false;
    }
  }
  return true;
}

// ─── ENGLISH consolidation (Sprint 1, unchanged behaviour) ────────────────
function runEnglishConsolidation() {
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
    console.error(`[fatal] no English source files found at ${PRIMARY_RAW} or ${RAW_DIR}`);
    process.exit(1);
  }

  const skipped = [];
  const warnings = [];
  const cellsByKey = new Map();

  for (const { file, levelFilter } of sources) {
    const text = fs.readFileSync(file, 'utf8');
    const blocks = extractJsonBlocks(text);
    const scope = levelFilter ? ` (levels: ${[...levelFilter].sort().join(', ')})` : '';
    console.log(`[parse] ${path.relative(REPO_ROOT, file)} → ${blocks.length} JSON blocks${scope}`);

    for (const [idx, block] of blocks.entries()) {
      let obj;
      try { obj = JSON.parse(block); }
      catch (e) { warnings.push(`${path.basename(file)} block #${idx + 1}: JSON parse failed (${e.message})`); continue; }
      if (!Array.isArray(obj.cells)) continue;

      for (const rawCell of obj.cells) {
        if (levelFilter && !levelFilter.has(rawCell.level)) continue;
        let cell = scrubStrings(rawCell);
        cell.topic = titleCase(cell.topic);
        const ctx = `${cell.level}/${cell.topic}/${cell.sub_topic}`;
        const warn = (msg) => warnings.push(`[${ctx}] ${msg}`);

        if (cell.notes !== undefined && shouldStripNotes(cell.notes)) delete cell.notes;

        const allowed = ENGLISH_LEVEL_TOPICS[cell.level];
        if (!allowed) { skipped.push({ ctx, reason: `unknown level "${cell.level}"` }); continue; }
        if (!allowed.includes(cell.topic)) { skipped.push({ ctx, reason: `topic "${cell.topic}" not allowed at ${cell.level}` }); continue; }

        const canonSubs = ENGLISH_CANON[cell.topic];
        if (!canonSubs) { skipped.push({ ctx, reason: `topic "${cell.topic}" not in English canon` }); continue; }
        if (!canonSubs.includes(cell.sub_topic)) { skipped.push({ ctx, reason: `sub_topic "${cell.sub_topic}" not in canon for ${cell.topic}` }); continue; }

        if (!isCellBaseValid(cell, warn)) { skipped.push({ ctx, reason: 'failed required-field validation' }); continue; }

        const key = `${cell.level}|${cell.topic}|${cell.sub_topic}`;
        cellsByKey.set(key, cell);
      }
    }
  }

  const cells = Array.from(cellsByKey.values()).sort((a, b) => {
    const lvl = a.level.localeCompare(b.level);
    if (lvl !== 0) return lvl;
    const t = ENGLISH_TOPIC_ORDER.indexOf(a.topic) - ENGLISH_TOPIC_ORDER.indexOf(b.topic);
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

  const serialized = JSON.stringify(envelope, null, 2);
  const checkErrors = [];
  if (/lilbutmighty/i.test(serialized)) checkErrors.push('output contains "lilbutmighty"');
  if (/\bblog\b/i.test(serialized)) checkErrors.push('output contains the word "blog"');
  const seen = new Set();
  for (const c of cells) {
    const k = `${c.level}|${c.topic}|${c.sub_topic}`;
    if (seen.has(k)) checkErrors.push(`duplicate cell key ${k}`);
    seen.add(k);
  }
  if (checkErrors.length) {
    console.error('[fatal] self-check failed:');
    for (const e of checkErrors) console.error('  -', e);
    process.exit(1);
  }
  fs.writeFileSync(ENGLISH_OUTPUT, serialized, 'utf8');

  reportCoverage('English', cells, levelsCovered, ENGLISH_OUTPUT, skipped, warnings);
}

// ─── SCIENCE consolidation (Sprint 6) ──────────────────────────────────────
function runScienceConsolidation() {
  if (!fs.existsSync(SCIENCE_RAW_DIR)) {
    console.error(`[fatal] no Science source directory at ${SCIENCE_RAW_DIR}`);
    process.exit(1);
  }
  const files = fs.readdirSync(SCIENCE_RAW_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(SCIENCE_RAW_DIR, f))
    .sort();
  if (files.length === 0) {
    console.error(`[fatal] no .json files in ${SCIENCE_RAW_DIR}`);
    process.exit(1);
  }

  const skipped = [];
  const warnings = [];
  const cellsByKey = new Map();

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const blocks = extractJsonBlocks(text);
    console.log(`[parse] ${path.relative(REPO_ROOT, file)} → ${blocks.length} JSON blocks`);

    for (const [idx, block] of blocks.entries()) {
      let obj;
      try { obj = JSON.parse(block); }
      catch (e) { warnings.push(`${path.basename(file)} block #${idx + 1}: JSON parse failed (${e.message})`); continue; }
      if (!Array.isArray(obj.cells)) continue;

      for (const rawCell of obj.cells) {
        let cell = scrubStrings(rawCell);
        // Default subject from CLI flag if missing on cell.
        if (!cell.subject) cell.subject = 'Science';
        cell.topic = titleCase(cell.topic);
        const ctx = `${cell.level}/${cell.topic}/${cell.sub_topic}`;
        const warn = (msg) => warnings.push(`[${ctx}] ${msg}`);

        if (cell.subject !== 'Science') {
          skipped.push({ ctx, reason: `subject "${cell.subject}" not Science` }); continue;
        }
        const allowed = SCIENCE_LEVEL_TOPICS[cell.level];
        if (!allowed) { skipped.push({ ctx, reason: `unknown level "${cell.level}"` }); continue; }
        if (!allowed.includes(cell.topic)) { skipped.push({ ctx, reason: `topic "${cell.topic}" not allowed at ${cell.level}` }); continue; }

        const canonSubs = SCIENCE_CANON[cell.topic];
        if (!canonSubs) { skipped.push({ ctx, reason: `topic "${cell.topic}" not in Science canon` }); continue; }
        if (!canonSubs.includes(cell.sub_topic)) { skipped.push({ ctx, reason: `sub_topic "${cell.sub_topic}" not in canon for ${cell.topic}` }); continue; }

        if (!isCellBaseValid(cell, warn)) { skipped.push({ ctx, reason: 'failed required-field validation' }); continue; }
        if (!isCellScienceCerValid(cell, warn)) { skipped.push({ ctx, reason: 'failed CER schema validation' }); continue; }

        const key = `${cell.subject}|${cell.level}|${cell.topic}|${cell.sub_topic}`;
        cellsByKey.set(key, cell);
      }
    }
  }

  const cells = Array.from(cellsByKey.values()).sort((a, b) => {
    const lvl = a.level.localeCompare(b.level);
    if (lvl !== 0) return lvl;
    const t = SCIENCE_TOPIC_ORDER.indexOf(a.topic) - SCIENCE_TOPIC_ORDER.indexOf(b.topic);
    if (t !== 0) return t;
    return a.sub_topic.localeCompare(b.sub_topic);
  });

  const levelsCovered = Array.from(new Set(cells.map(c => c.level))).sort();
  const envelope = {
    version: '3.0',
    schema_changes_from_2_0: 'Science cells require cer_structure block + CER-triple worked_example.correct_answer + CER-triple check_for_understanding.expected_answer',
    source_alignment: 'Singapore MOE 2023 Primary Science Syllabus + Superholic Lab canon v5.0 (Science) + CER pedagogy',
    subject: 'Science',
    generated_at: new Date().toISOString(),
    levels_covered: levelsCovered,
    cell_count: cells.length,
    cells
  };

  // ── Self-checks ────────────────────────────────────────────────────────
  const serialized = JSON.stringify(envelope, null, 2);
  const checkErrors = [];
  if (/lilbutmighty/i.test(serialized)) checkErrors.push('output contains "lilbutmighty"');
  const seen = new Set();
  for (const c of cells) {
    const k = `${c.subject}|${c.level}|${c.topic}|${c.sub_topic}`;
    if (seen.has(k)) checkErrors.push(`duplicate cell key ${k}`);
    seen.add(k);
  }
  // Every Science cell MUST have subject + cer_structure (post-validation enforcement).
  for (const c of cells) {
    if (c.subject !== 'Science') checkErrors.push(`cell ${c.level}/${c.topic}/${c.sub_topic} subject is not "Science"`);
    if (!c.cer_structure) checkErrors.push(`cell ${c.level}/${c.topic}/${c.sub_topic} missing cer_structure`);
  }
  if (checkErrors.length) {
    console.error('[fatal] Science self-check failed:');
    for (const e of checkErrors) console.error('  -', e);
    process.exit(1);
  }
  fs.writeFileSync(SCIENCE_OUTPUT, serialized, 'utf8');

  reportCoverage('Science', cells, levelsCovered, SCIENCE_OUTPUT, skipped, warnings);
}

// ─── MERGE — English v2.0 + Science v3.0 → unified v3.0 ───────────────────
function runMergeSubjects() {
  if (!fs.existsSync(ENGLISH_OUTPUT)) {
    console.error(`[fatal] English playbook not found at ${ENGLISH_OUTPUT}; run default consolidation first`);
    process.exit(1);
  }
  if (!fs.existsSync(SCIENCE_OUTPUT)) {
    console.error(`[fatal] Science playbook not found at ${SCIENCE_OUTPUT}; run --subject Science first`);
    process.exit(1);
  }

  const eng = JSON.parse(fs.readFileSync(ENGLISH_OUTPUT, 'utf8'));
  const sci = JSON.parse(fs.readFileSync(SCIENCE_OUTPUT, 'utf8'));

  // Backfill subject:"English" on every English cell (in-memory only —
  // the v2.0 file on disk is preserved untouched).
  const englishCells = (eng.cells || []).map(c => ({ ...c, subject: c.subject || 'English' }));
  const scienceCells = (sci.cells || []).map(c => ({ ...c, subject: c.subject || 'Science' }));

  // Final validation: every cell must have subject.
  const errs = [];
  for (const c of [...englishCells, ...scienceCells]) {
    if (!c.subject) errs.push(`cell ${c.level}/${c.topic}/${c.sub_topic} missing subject after backfill`);
  }
  if (errs.length) { console.error('[fatal] merge self-check failed:'); for (const e of errs) console.error('  -', e); process.exit(1); }

  const cells = [...englishCells, ...scienceCells];
  const levelsCovered = Array.from(new Set(cells.map(c => c.level))).sort();
  const subjectsCovered = Array.from(new Set(cells.map(c => c.subject))).sort();
  const cellCountBySubject = {};
  for (const c of cells) cellCountBySubject[c.subject] = (cellCountBySubject[c.subject] || 0) + 1;

  const envelope = {
    version: '3.0',
    schema_changes_from_2_0: 'added subject field on every cell; supports multi-subject indexing',
    source_alignment: {
      English: 'Singapore MOE 2020 English Language Syllabus + Superholic Lab canon v5.0',
      Science: 'Singapore MOE 2023 Primary Science Syllabus + Superholic Lab canon v5.0 + CER pedagogy'
    },
    subjects_covered: subjectsCovered,
    cell_count_by_subject: cellCountBySubject,
    generated_at: new Date().toISOString(),
    levels_covered: levelsCovered,
    cell_count: cells.length,
    cells
  };

  fs.writeFileSync(MERGED_OUTPUT, JSON.stringify(envelope, null, 2), 'utf8');
  console.log('');
  console.log(`[ok] wrote ${path.relative(REPO_ROOT, MERGED_OUTPUT)} — ${cells.length} cells`);
  for (const s of subjectsCovered) console.log(`  ${s}: ${cellCountBySubject[s]} cells`);
  console.log(`  levels: ${levelsCovered.join(', ')}`);
}

// ─── Coverage report ──────────────────────────────────────────────────────
function reportCoverage(label, cells, levelsCovered, outputPath, skipped, warnings) {
  const byLevelTopic = {};
  for (const c of cells) {
    byLevelTopic[c.level] ??= {};
    byLevelTopic[c.level][c.topic] = (byLevelTopic[c.level][c.topic] || 0) + 1;
  }
  console.log('');
  console.log(`[ok] wrote ${path.relative(REPO_ROOT, outputPath)} — ${cells.length} ${label} cells across ${levelsCovered.length} levels`);
  console.log('');
  console.log(`Coverage by level/topic (${label}):`);
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
}

// ─── Dispatch ─────────────────────────────────────────────────────────────
if (ARGS.mergeSubjects) {
  runMergeSubjects();
} else if (ARGS.subject === 'Science') {
  runScienceConsolidation();
} else if (ARGS.subject && ARGS.subject !== 'English') {
  console.error(`[fatal] unknown --subject "${ARGS.subject}" — expected English or Science`);
  process.exit(1);
} else {
  // Default + --subject English: original Sprint 1 behaviour (writes v2.0 file).
  runEnglishConsolidation();
}
