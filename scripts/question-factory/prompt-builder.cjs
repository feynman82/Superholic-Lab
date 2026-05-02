#!/usr/bin/env node
/**
 * Surgical Prompt Builder — Question Factory Token Conservation Engine
 * D:\Git\Superholic-Lab\scripts\question-factory\prompt-builder.cjs
 *
 * Reads the split master_question_template/ structure (Phase 1 split,
 * 2026-05-02). Loads only the files needed for the requested
 * (subject, type, levels, topics) combination.
 *
 * File layout assumed:
 *   Master_Question_Template.md                  ← router (not loaded; informational)
 *   master_question_template/_base.md            ← ALWAYS loaded
 *   master_question_template/_calibration.md     ← ALWAYS loaded
 *   master_question_template/types/{type}.md     ← loaded based on requested type
 *   master_question_template/types/_phase2_remaining.md   ← for short_ans/word_problem/comprehension/visual_text
 *   master_question_template/canon/canon_taxonomy.md      ← ALWAYS loaded; subject row extracted
 *   master_question_template/visuals/visuals_full.md      ← loaded when topics need a diagram (Math/Science)
 *
 * Usage:
 *   node prompt-builder.cjs \
 *     --subject="Mathematics" \
 *     --type="mcq" \
 *     --levels="Primary 4,Primary 5,Primary 6" \
 *     --topics="Algebra,Fractions,Circles"
 *
 * Output: compact surgical prompt written to stdout
 * Stats:  written to stderr (so stdout stays clean for capture)
 *
 * Token savings: 60–80% smaller than loading the full split tree.
 */

'use strict';
const fs   = require('fs');
const path = require('path');

// ── CLI args ──────────────────────────────────────────────────────────────
const args = {};
process.argv.slice(2).forEach(a => {
  if (!a.startsWith('--')) return;
  const eq = a.indexOf('=');
  if (eq === -1) { args[a.slice(2)] = true; return; }
  args[a.slice(2, eq)] = a.slice(eq + 1);
});

const subject = args.subject || 'Mathematics';
const type    = args.type    || 'mcq';
const levels  = (args.levels || '').split(',').map(s => s.trim()).filter(Boolean);
const topics  = (args.topics || '').split(',').map(s => s.trim()).filter(Boolean);

// ── Locate files ──────────────────────────────────────────────────────────
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MQT_DIR   = path.join(REPO_ROOT, 'master_question_template');

const FILES = {
  base:        path.join(MQT_DIR, '_base.md'),
  calibration: path.join(MQT_DIR, '_calibration.md'),
  canon:       path.join(MQT_DIR, 'canon', 'canon_taxonomy.md'),
  visuals:     path.join(MQT_DIR, 'visuals', 'visuals_full.md'),
  types: {
    mcq:           path.join(MQT_DIR, 'types', 'mcq.md'),
    cloze:         path.join(MQT_DIR, 'types', 'cloze.md'),
    editing:       path.join(MQT_DIR, 'types', 'editing.md'),
    open_ended:    path.join(MQT_DIR, 'types', 'open_ended.md'),
    // Phase 2 pending: 4 types still co-located
    short_ans:     path.join(MQT_DIR, 'types', '_phase2_remaining.md'),
    word_problem:  path.join(MQT_DIR, 'types', '_phase2_remaining.md'),
    comprehension: path.join(MQT_DIR, 'types', '_phase2_remaining.md'),
    visual_text:   path.join(MQT_DIR, 'types', '_phase2_remaining.md'),
  },
};

function readFileOrFail(p) {
  if (!fs.existsSync(p)) {
    process.stderr.write(`ERROR: required file not found: ${p}\n`);
    process.exit(1);
  }
  return fs.readFileSync(p, 'utf8');
}

// ── Diagram function routing ──────────────────────────────────────────────
// CANON-ALIGNED keys ONLY. Source of truth (must match exactly):
//   - Supabase canon_topics table (26 Maths / 6 Science / 7 English in v5)
//   - lib/api/quest-pedagogy.js → SYLLABUS_DEPENDENCIES
//   - master_question_template/canon/canon_taxonomy.md
// Non-canon keys are rejected by the DB FK on insert and waste inference cost.
const DIAGRAM_ROUTING = {
  Mathematics: {
    'Addition and Subtraction':    ['numberLine'],
    'Algebra':                     ['rectangle'],
    'Angles':                      ['protractorMeasurement', 'rightAngleDivided', 'straightLineDividedAngles', 'rectangleDividedRightAngle', 'dividedStraightLineAngle', 'crossingLines'],
    'Area and Perimeter':          ['rectangle', 'square', 'rightTriangle', 'compositeShape', 'drawRectangleOnGrid'],
    'Area of Triangle':            ['rightTriangle', 'compositeShape'],
    'Average':                     ['verticalBarChart'],
    'Circles':                     ['circle', 'circleSegment', 'compositeCircleFigure', 'runningTrack', 'quarterCirclesInSquare', 'overlappingCircles', 'rectangleWithPath'],
    'Data Analysis':               ['verticalBarChart', 'lineGraph', 'dataTable', 'pictogram'],
    'Decimals':                    ['numberLine'],
    'Factors and Multiples':       [],
    'Fractions':                   ['fractionBars', 'fractionBar', 'unitModel', 'numberLine'],
    'Geometry':                    ['polygon', 'parallelogram', 'compositeShape', 'isometricGrid', 'equilateralTriangle', 'rectangleWithLine'],
    'Multiplication and Division': [],
    'Multiplication Tables':       [],
    'Percentage':                  ['pieChart', 'unitModel'],
    'Pie Charts':                  ['pieChart'],
    'Rate':                        ['lineGraph'],
    'Ratio':                       ['unitModel'],
    'Shapes and Patterns':         ['rectangle', 'square', 'circle'],
    'Speed':                       ['lineGraph'],
    'Symmetry':                    ['drawRectangleOnGrid'],
    'Time':                        ['clockFace'],
    'Volume':                      ['cuboid'],
    'Whole Numbers':               ['numberLine'],
  },
  Science: {
    'Cells':        ['dataTable'],
    'Cycles':       ['arrowDiagram', 'comparativeSetup', 'thermometer'],
    'Diversity':    ['arrowDiagram', 'dataTable'],
    'Energy':       ['circuitDiagram', 'comparativeSetup', 'rampExperiment'],
    'Forces':       ['rampExperiment', 'comparativeSetup'],
    'Heat':         ['thermometer', 'comparativeSetup'],
    'Interactions': ['arrowDiagram'],
    'Light':        ['comparativeSetup'],
    'Matter':       ['comparativeSetup', 'dataTable'],
    'Systems':      ['arrowDiagram', 'dataTable', 'circuitDiagram'],
  },
};

// ── Type extraction (only needed for _phase2_remaining.md) ────────────────
// Each type in that file is bracketed by `═══` divider blocks plus a
// `TYPE: \`xxx\`` header. Pull the matching block.
function extractTypeFromPhase2(contents, typeName) {
  const header = `TYPE: \`${typeName}\``;
  const start  = contents.indexOf(header);
  if (start === -1) return contents; // fallback: return whole file
  // Walk backwards to grab the leading `═══` divider line.
  const blockStart = contents.lastIndexOf('═══════════════════════════════════════════════════════════════', start);
  const sliceFrom = blockStart === -1 ? start : blockStart;
  // The next type's header (or EOF) ends our block.
  const nextHeader = contents.indexOf('═══════════════════════════════════════════════════════════════\nTYPE:', sliceFrom + 100);
  return nextHeader === -1 ? contents.slice(sliceFrom) : contents.slice(sliceFrom, nextHeader);
}

// ── Canon taxonomy: extract only the subject's bullet list + level table ──
function extractCanonForSubject(contents, subjectKey) {
  // Always-on intro (anti-hallucination rules + workflow + subject-values table).
  const introEnd = contents.indexOf('---\n\n**MATHEMATICS');
  const intro    = introEnd === -1 ? '' : contents.slice(0, introEnd) + '---\n';

  // The subject-specific bullet list.
  const subjLine = subjectKey === 'Mathematics' ? '**MATHEMATICS' :
                   subjectKey === 'Science'     ? '**SCIENCE'     : '**ENGLISH';
  const subjStart = contents.indexOf(subjLine);
  let subjBlock = '';
  if (subjStart !== -1) {
    const subjEnd = contents.indexOf('\n---\n', subjStart);
    subjBlock = subjEnd === -1 ? contents.slice(subjStart) : contents.slice(subjStart, subjEnd + 5);
  }

  // The cross-subject level guidance table + v5.0 changes (always include).
  const levelTableStart = contents.indexOf('**Level guidance**');
  const levelTable = levelTableStart === -1 ? '' : contents.slice(levelTableStart);

  return intro + subjBlock + '\n' + levelTable;
}

// ── visuals_full.md: extract a single function entry (Section 6 catalogue) ─
function extractVisualFunction(contents, fnName) {
  const marker = `* \`${fnName}\``;
  const start  = contents.indexOf(marker);
  if (start === -1) return '';
  const candidates = [
    contents.indexOf('\n* `', start + 1),
    contents.indexOf('\n**---', start + 1),
    contents.indexOf('\n---\n', start + 1),
    contents.indexOf('\n**⚠️', start + 1),
  ].filter(i => i > 0);
  const end = candidates.length ? Math.min(...candidates) : contents.length;
  return contents.slice(start, end).trim();
}

// ── visuals_full.md: extract per-(subject, level) routing rows ────────────
function extractRoutingRows(contents, subjectKey, levelsNeeded) {
  const mapHeader = `${subjectKey.toUpperCase()} ROUTING MAP`;
  const mapStart  = contents.indexOf(mapHeader);
  if (mapStart === -1) return '';

  // Skip past the closing `━━━━` border of THIS section's header (which sits
  // immediately after the header text), then find the NEXT `━━━━` block —
  // that's the boundary of the next routing map or the §7 hard rules.
  const headerCloseBorder = contents.indexOf('\n━━━━', mapStart + mapHeader.length);
  const afterHeader       = headerCloseBorder === -1
    ? mapStart + mapHeader.length
    : headerCloseBorder + 70;
  const mapEnd  = contents.indexOf('\n━━━━', afterHeader);
  const mapBlock = mapEnd === -1 ? contents.slice(mapStart) : contents.slice(mapStart, mapEnd);

  let result = `${mapHeader} (extracted levels: ${levelsNeeded.join(', ')})\n`;

  for (const level of levelsNeeded) {
    const short  = level.replace('Primary ', 'P');
    const marker = `── ${short} ──`;
    const start  = mapBlock.indexOf(marker);
    if (start === -1) continue;
    const nextLevel = mapBlock.indexOf('\n── P', start + 5);
    const block = nextLevel === -1 ? mapBlock.slice(start) : mapBlock.slice(start, nextLevel);
    result += '\n' + block.trim() + '\n';
  }
  return result;
}

// ── visuals_full.md: extract the §7 hard rules trailing block ─────────────
function extractVisualHardRules(contents) {
  const start = contents.indexOf('SECTION 7 — HARD RULES');
  if (start === -1) return '';
  // The hard rules block runs to EOF in the new visuals_full.md.
  return contents.slice(start).trim();
}

// ── Assemble surgical prompt ──────────────────────────────────────────────
function buildSurgicalPrompt() {
  const parts = [];
  const stats = { sources: [] };

  // 1. _base.md (always)
  const baseContents = readFileOrFail(FILES.base);
  parts.push(baseContents.trim());
  stats.sources.push({ file: '_base.md', lines: baseContents.split('\n').length, included: 'full' });

  // 2. _calibration.md (always)
  const calibContents = readFileOrFail(FILES.calibration);
  parts.push(calibContents.trim());
  stats.sources.push({ file: '_calibration.md', lines: calibContents.split('\n').length, included: 'full' });

  // 3. types/{type}.md (or extract from _phase2_remaining.md)
  const typeFile = FILES.types[type];
  if (!typeFile) {
    process.stderr.write(`ERROR: unknown type '${type}'\n`);
    process.exit(1);
  }
  const typeFileContents = readFileOrFail(typeFile);
  const isPhase2 = typeFile.endsWith('_phase2_remaining.md');
  const typeBlock = isPhase2 ? extractTypeFromPhase2(typeFileContents, type) : typeFileContents;
  parts.push(typeBlock.trim());
  stats.sources.push({
    file:     path.relative(REPO_ROOT, typeFile),
    lines:    typeBlock.split('\n').length,
    included: isPhase2 ? `extracted (TYPE: ${type})` : 'full',
  });

  // 4. canon/canon_taxonomy.md (subject row + level guidance only)
  const canonContents = readFileOrFail(FILES.canon);
  const canonBlock = extractCanonForSubject(canonContents, subject);
  parts.push(canonBlock.trim());
  stats.sources.push({
    file:     path.relative(REPO_ROOT, FILES.canon),
    lines:    canonBlock.split('\n').length,
    included: `extracted (subject: ${subject})`,
  });

  // 5. visuals/visuals_full.md — only if any topic has diagram functions
  const neededFns = new Set();
  topics.forEach(topic => {
    const fns = (DIAGRAM_ROUTING[subject] || {})[topic] || [];
    fns.forEach(f => neededFns.add(f));
  });
  // Always include placeholder as last-resort fallback
  if (neededFns.size > 0) neededFns.add('placeholder');
  // Science always gets genericExperiment as last-resort fallback
  if (subject === 'Science' && neededFns.size > 0) neededFns.add('genericExperiment');

  if (neededFns.size > 0) {
    const visContents = readFileOrFail(FILES.visuals);
    const fnEntries = [];
    neededFns.forEach(fn => {
      const entry = extractVisualFunction(visContents, fn);
      if (entry) fnEntries.push(entry);
    });
    const uniqueEntries = [...new Set(fnEntries)];

    parts.push(
      `${'═'.repeat(63)}\nVISUAL FUNCTIONS (${uniqueEntries.length} for: ${topics.join(', ')})\n${'═'.repeat(63)}\n` +
      `visual_payload format: {"engine":"diagram-library","function_name":"EXACT_NAME","params":{...}}\n\n` +
      uniqueEntries.join('\n\n')
    );

    // Routing rows for the requested levels
    const routingRows = extractRoutingRows(visContents, subject, levels);
    if (routingRows) {
      parts.push(
        `${'═'.repeat(63)}\nROUTING ROWS (levels: ${levels.join(', ')})\n${'═'.repeat(63)}\n` +
        routingRows
      );
    }

    // Hard rules
    const hardRules = extractVisualHardRules(visContents);
    if (hardRules) parts.push(hardRules);

    stats.sources.push({
      file:     path.relative(REPO_ROOT, FILES.visuals),
      lines:    [
        `(${uniqueEntries.length} fn entries, ${levels.length} routing rows, hard rules)`,
      ].join(', '),
      included: 'extracted',
    });
  } else {
    stats.sources.push({
      file:     path.relative(REPO_ROOT, FILES.visuals),
      lines:    0,
      included: 'SKIPPED (no diagrams needed for these topics)',
    });
  }

  return { prompt: parts.filter(Boolean).join('\n\n'), stats };
}

// ── Main ──────────────────────────────────────────────────────────────────
const { prompt: surgical, stats } = buildSurgicalPrompt();

// Calculate full-tree size for comparison (would be loaded if no slicing).
let fullTreeLines = 0;
fullTreeLines += readFileOrFail(FILES.base).split('\n').length;
fullTreeLines += readFileOrFail(FILES.calibration).split('\n').length;
fullTreeLines += readFileOrFail(FILES.canon).split('\n').length;
Object.values(FILES.types).forEach(p => {
  if (fs.existsSync(p)) fullTreeLines += fs.readFileSync(p, 'utf8').split('\n').length;
});
fullTreeLines += readFileOrFail(FILES.visuals).split('\n').length;

const surgLines  = surgical.split('\n').length;
const origTok    = Math.round(fullTreeLines * 6.7);
const surgTok    = Math.round(surgLines * 6.7);
const savingsPct = Math.round((1 - surgLines / fullTreeLines) * 100);

const fnList = Array.from(
  new Set(topics.flatMap(t => (DIAGRAM_ROUTING[subject] || {})[t] || []))
).join(', ') || 'none';

process.stderr.write(
  `[prompt-builder] Subject: ${subject} | Type: ${type}\n` +
  `[prompt-builder] Levels: ${levels.join(', ') || '(none)'}\n` +
  `[prompt-builder] Topics: ${topics.join(', ') || '(none)'}\n` +
  `[prompt-builder] Diagram fns included: ${fnList}\n` +
  `[prompt-builder] ── Files loaded ──\n` +
  stats.sources.map(s => `[prompt-builder]   ${s.file}  (${s.lines} lines, ${s.included})`).join('\n') + '\n' +
  `[prompt-builder] Full split tree: ${fullTreeLines} lines (~${origTok} tokens)\n` +
  `[prompt-builder] Surgical prompt: ${surgLines} lines (~${surgTok} tokens)\n` +
  `[prompt-builder] Token savings: ${savingsPct}%\n`
);

process.stdout.write(surgical);
