#!/usr/bin/env node
/**
 * Surgical Prompt Builder — Question Factory Token Conservation Engine
 * D:\Git\Superholic-Lab\scripts\question-factory\prompt-builder.js
 *
 * Extracts only the relevant sections from Master_Question_Template.md
 * for a given (subject, type, levels, topics) combination.
 *
 * Usage:
 *   node prompt-builder.js \
 *     --subject="Mathematics" \
 *     --type="mcq" \
 *     --levels="Primary 4,Primary 5,Primary 6" \
 *     --topics="Algebra,Fractions,Circles"
 *
 * Output: compact surgical prompt written to stdout
 * Stats:  written to stderr (so stdout stays clean for capture)
 *
 * Token savings: ~69% smaller than full template
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

// ── Locate template ───────────────────────────────────────────────────────
const REPO_ROOT     = path.resolve(__dirname, '..', '..');
const TEMPLATE_PATH = path.join(REPO_ROOT, 'Master_Question_Template.md');

if (!fs.existsSync(TEMPLATE_PATH)) {
  process.stderr.write(`ERROR: Template not found at ${TEMPLATE_PATH}\n`);
  process.exit(1);
}

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

// ── Helpers ───────────────────────────────────────────────────────────────
function extractSection(text, sectionTitle) {
  const start = text.indexOf(sectionTitle);
  if (start === -1) return '';
  const nextSection = text.indexOf('\n═══════', start + sectionTitle.length);
  return nextSection === -1 ? text.slice(start) : text.slice(start, nextSection);
}

function extractBetween(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start === -1) return '';
  const end = endMarker ? text.indexOf(endMarker, start + startMarker.length) : text.length;
  return (end === -1 || !endMarker) ? text.slice(start) : text.slice(start, end);
}

// ── Diagram function routing ──────────────────────────────────────────────
// CANON-ALIGNED keys ONLY. Source of truth (must match exactly):
//   - Supabase canon_topics table (23 Maths / 10 Science / 7 English)
//   - lib/api/quest-pedagogy.js → SYLLABUS_DEPENDENCIES
//   - Master_Question_Template.md v4.1 §4 taxonomy
// Non-canon keys (e.g. 'Money', 'Time', 'Bar Graphs', 'Magnets') are
// rejected by the DB FK on insert and waste inference cost. Do not add.
const DIAGRAM_ROUTING = {
  Mathematics: {
    'Addition and Subtraction':    ['numberLine'],
    'Algebra':                     ['rectangle'],
    'Angles':                      ['protractorMeasurement', 'rightAngleDivided', 'straightLineDividedAngles', 'rectangleDividedRightAngle', 'dividedStraightLineAngle'],
    'Area and Perimeter':          ['rectangle', 'square', 'rightTriangle', 'compositeShape', 'drawRectangleOnGrid'],
    'Area of Triangle':            ['rightTriangle', 'compositeShape'],
    'Average':                     ['verticalBarChart'],
    'Circles':                     ['circle'],
    'Data Analysis':               ['verticalBarChart', 'lineGraph', 'dataTable', 'pictogram'],
    'Decimals':                    ['numberLine'],
    'Factors and Multiples':       [],
    'Fractions':                   ['fractionBars', 'fractionBar', 'unitModel', 'numberLine'],
    'Geometry':                    ['polygon', 'parallelogram', 'compositeShape', 'isometricGrid', 'equilateralTriangle'],
    'Multiplication and Division': [],
    'Multiplication Tables':       [],
    'Percentage':                  ['pieChart', 'unitModel'],
    'Pie Charts':                  ['pieChart'],
    'Rate':                        ['lineGraph'],
    'Ratio':                       ['unitModel'],
    'Shapes and Patterns':         ['rectangle', 'square', 'circle'],
    'Speed':                       ['lineGraph'],
    'Symmetry':                    ['drawRectangleOnGrid'],
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

// ── Section 6 entry extractor ─────────────────────────────────────────────
function extractSection6Entry(tmpl, fnName) {
  const marker = `* \`${fnName}\``;
  const start  = tmpl.indexOf(marker);
  if (start === -1) return '';
  const after = start + 1;
  // Find the next entry boundary
  const candidates = [
    tmpl.indexOf('\n* `', after),
    tmpl.indexOf('\n**---', after),
    tmpl.indexOf('\n---\n', after),
    tmpl.indexOf('\n**⚠️', after),
  ].filter(i => i > 0);
  const end = candidates.length ? Math.min(...candidates) : tmpl.length;
  return tmpl.slice(start, end).trim();
}

// ── Section 7 routing rows for requested levels ───────────────────────────
function extractRoutingRows(tmpl, subjectKey, levelsNeeded) {
  const mapHeader = `${subjectKey.toUpperCase()} ROUTING MAP`;
  const mapStart  = tmpl.indexOf(mapHeader);
  if (mapStart === -1) return '';

  // Find end of this routing map (next ━━━━ block)
  const mapEnd = tmpl.indexOf('\n━━━━', mapStart + mapHeader.length);
  const mapBlock = mapEnd === -1 ? tmpl.slice(mapStart) : tmpl.slice(mapStart, mapEnd);

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

// ── Section 5 type schema ─────────────────────────────────────────────────
function extractTypeSchema(tmpl, typeName) {
  const LABELS = {
    mcq:           'TYPE: `mcq`',
    short_ans:     'TYPE: `short_ans`',
    word_problem:  'TYPE: `word_problem`',
    open_ended:    'TYPE: `open_ended`',
    cloze:         'TYPE: `cloze`',
    editing:       'TYPE: `editing`',
    comprehension: 'TYPE: `comprehension`',
    visual_text:   'TYPE: `visual_text`',
  };
  const label = LABELS[typeName];
  if (!label) return '';
  const start  = tmpl.indexOf(label);
  if (start === -1) return '';
  const DIVIDER = '\n---------------------------------------------------------------\n';
  const nextDiv = tmpl.indexOf(DIVIDER, start + label.length);
  return nextDiv === -1 ? tmpl.slice(start) : tmpl.slice(start, nextDiv);
}

// ── Section 4 taxonomy row ────────────────────────────────────────────────
function extractTaxonomyRow(tmpl, subjectKey) {
  const s4Start = tmpl.indexOf('SECTION 4:');
  if (s4Start === -1) return '';
  const s4End = tmpl.indexOf('\n═══════', s4Start + 10);
  const s4    = s4End === -1 ? tmpl.slice(s4Start) : tmpl.slice(s4Start, s4End);

  const subjLine = subjectKey === 'Mathematics' ? '**MATHEMATICS' :
                   subjectKey === 'Science'     ? '**SCIENCE'     : '**ENGLISH';
  const start  = s4.indexOf(subjLine);
  if (start === -1) return s4;
  const nextSubj = s4.indexOf('\n**', start + subjLine.length);
  return nextSubj === -1 ? s4.slice(start) : s4.slice(start, nextSubj);
}

// ── Assemble surgical prompt ──────────────────────────────────────────────
function buildSurgicalPrompt() {
  const parts = [];

  // 1. Always-on core sections
  parts.push(extractSection(template, 'SECTION 1: SYSTEM DIRECTIVES'));
  parts.push(extractSection(template, 'SECTION 2: TECHNICAL REQUIREMENTS'));
  parts.push(extractSection(template, 'SECTION 3: DATABASE SCHEMA'));

  // 2. Section 4: only the relevant subject row
  const s4header = extractBetween(template, 'SECTION 4:', '\n**MATHEMATICS').trim();
  parts.push(`${'═'.repeat(63)}\n${s4header}\n\n${extractTaxonomyRow(template, subject)}`);

  // 3. Section 5: only the relevant type schema
  const typeSchema = extractTypeSchema(template, type);
  parts.push(
    `${'═'.repeat(63)}\nSECTION 5 (${type} schema only)\n${'═'.repeat(63)}\n` +
    typeSchema
  );

  // 4. Section 6: only the diagram functions needed for these topics
  const neededFns = new Set(['placeholder']);
  topics.forEach(topic => {
    const fns = (DIAGRAM_ROUTING[subject] || {})[topic] || [];
    fns.forEach(f => neededFns.add(f));
  });
  // Science always gets genericExperiment as last-resort fallback
  if (subject === 'Science') neededFns.add('genericExperiment');

  const s6Entries = [];
  neededFns.forEach(fn => {
    const entry = extractSection6Entry(template, fn);
    if (entry) s6Entries.push(entry);
  });

  // Deduplicate (rightAngleDivided shares block with straightLineDividedAngles)
  const uniqueEntries = [...new Set(s6Entries)];

  parts.push(
    `${'═'.repeat(63)}\nSECTION 6 (${uniqueEntries.length} functions for: ${topics.join(', ')})\n${'═'.repeat(63)}\n` +
    `visual_payload format: {"engine":"diagram-library","function_name":"EXACT_NAME","params":{...}}\n\n` +
    uniqueEntries.join('\n\n')
  );

  // 5. Section 7: routing rows for the requested levels only
  const routingRows = extractRoutingRows(template, subject, levels);
  parts.push(
    `${'═'.repeat(63)}\nSECTION 7 (routing rows for: ${levels.join(', ')})\n${'═'.repeat(63)}\n` +
    routingRows
  );

  // 6. Hard rules (short, always critical)
  const hardRules = extractBetween(template, 'HARD RULES', '\n═══');
  if (hardRules) parts.push(hardRules.trim());

  // 7. Quality checklist
  const checklist = extractSection(template, 'FINAL QUALITY CHECKLIST');
  if (checklist) parts.push(checklist.trim());

  return parts.filter(Boolean).join('\n\n');
}

// ── Main ──────────────────────────────────────────────────────────────────
const surgical       = buildSurgicalPrompt();
const origLines      = template.split('\n').length;
const surgLines      = surgical.split('\n').length;
const origTok        = Math.round(origLines * 6.7);
const surgTok        = Math.round(surgLines * 6.7);
const savingsPct     = Math.round((1 - surgLines / origLines) * 100);

const fnList = Array.from(
  new Set(topics.flatMap(t => (DIAGRAM_ROUTING[subject] || {})[t] || []))
).concat(['placeholder']).join(', ') || 'none';

process.stderr.write(
  `[prompt-builder] Subject: ${subject} | Type: ${type}\n` +
  `[prompt-builder] Levels: ${levels.join(', ')}\n` +
  `[prompt-builder] Topics: ${topics.join(', ')}\n` +
  `[prompt-builder] Diagram fns included: ${fnList}\n` +
  `[prompt-builder] Full template: ${origLines} lines (~${origTok} tokens)\n` +
  `[prompt-builder] Surgical prompt: ${surgLines} lines (~${surgTok} tokens)\n` +
  `[prompt-builder] Token savings: ${savingsPct}%\n`
);

process.stdout.write(surgical);