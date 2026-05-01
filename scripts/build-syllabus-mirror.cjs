'use strict';
/**
 * Build script that regenerates the v5 syllabus dependency files from the
 * new frontend reference (public/js/syllabus-dependencies.js) and the
 * canonical sub_topic list (canonSubTopics constant inlined below from
 * canon_sub_topics on 2026-05-01).
 *
 * Outputs:
 *   - SYLLABUS_DEPENDENCY.json   (minified single-line, no sub_topics)
 *   - lib/api/quest-pedagogy.js  (full re-write of SYLLABUS_DEPENDENCIES
 *                                 const, preserving all surrounding code)
 *
 * Usage: node scripts/build-syllabus-mirror.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REFERENCE = path.join(ROOT, 'public', 'js', 'syllabus-dependencies.js');
const JSON_OUT = path.join(ROOT, 'SYLLABUS_DEPENDENCY.json');
const JS_OUT = path.join(ROOT, 'lib', 'api', 'quest-pedagogy.js');

// ── Load reference (frontend mirror, source of truth for v5 shape) ──────────
const refText = fs.readFileSync(REFERENCE, 'utf8');
const refStart = refText.indexOf('const SYLLABUS_DEPENDENCIES = {');
const refOpen = refText.indexOf('{', refStart);
let depth = 0, refEnd = -1;
for (let i = refOpen; i < refText.length; i++) {
  const ch = refText[i];
  if (ch === '{') depth++;
  else if (ch === '}') { depth--; if (depth === 0) { refEnd = i + 1; break; } }
}
const refObjText = refText.slice(refOpen, refEnd);
const referenceObj = (new Function('return ' + refObjText))();

// ── Canonical sub_topics from Supabase canon_sub_topics (2026-05-01) ────────
const canonSubTopics = {
  Mathematics: {
    'Addition and Subtraction': ['Concepts Of Addition And Subtraction','Addition And Subtraction Within One Hundred','Addition And Subtraction Algorithms','Mental Calculation Involving Addition And Subtraction'],
    'Algebra': ['Using A Letter To Represent An Unknown Number','Interpretation Of Algebraic Expressions','Simplifying Linear Expressions','Evaluating Linear Expressions By Substitution','Solving Simple Linear Equations'],
    'Angles': ['Concepts Of Angle','Right Angles','Measuring Angles In Degrees','Drawing Angles','Angles On A Straight Line','Angles At A Point','Vertically Opposite Angles','Finding Unknown Angles'],
    'Area and Perimeter': ['Concepts Of Area And Perimeter','Area And Perimeter Of Rectangle And Square','Finding One Dimension Given Area Or Perimeter','Area And Perimeter Of Composite Rectilinear Figures'],
    'Area of Triangle': ['Concepts Of Base And Height','Calculating Area Of Triangle','Area Of Composite Figures With Triangles'],
    'Average': ['Average As Total Value Divided By Number Of Data','Relationship Between Average, Total Value And Number Of Data'],
    'Circles': ['Area And Circumference Of Circle','Area And Perimeter Of Semicircle And Quarter Circle','Area And Perimeter Of Composite Figures With Circles'],
    'Data Analysis': ['Reading Picture Graphs','Reading Bar Graphs','Reading Line Graphs','Reading Tables'],
    'Decimals': ['Notation And Place Values Of Decimals','Comparing And Ordering Decimals','Converting Fractions To Decimals','Converting Decimals To Fractions','Rounding Decimals','Four Operations With Decimals','Multiplying And Dividing Decimals By Ten, One Hundred And One Thousand'],
    'Factors and Multiples': ['Identifying Factors And Multiples','Finding Common Factors','Finding Common Multiples'],
    'Fractions': ['Fraction As Part Of A Whole','Equivalent Fractions','Comparing And Ordering Fractions','Mixed Numbers','Improper Fractions','Adding Unlike Fractions','Subtracting Unlike Fractions','Fractions Of A Set','Fraction Multiplied By Fraction','Division By A Proper Fraction'],
    'Geometry': ['Perpendicular And Parallel Lines','Properties Of Rectangle And Square','Properties Of Triangles','Properties Of Parallelogram, Rhombus And Trapezium','Identifying Two-Dimensional Representations Of Solids','Identifying Nets Of Three-Dimensional Solids','Drawing Two-Dimensional Representations Of Solids'],
    'Length and Mass': ['Measuring Length In Centimetres And Metres','Measuring Mass In Grams And Kilograms','Comparing And Ordering Lengths And Masses','Measuring Length In Kilometres','Converting Compound Units To Smaller Unit','Word Problems Involving Length And Mass'],
    'Money': ['Counting Amount Of Money','Comparing Amounts Of Money','Reading And Writing Money In Decimal Notation','Converting Money Between Decimal And Cents','Adding And Subtracting Money In Decimal Notation','Word Problems Involving Money'],
    'Multiplication and Division': ['Concepts Of Multiplication And Division','Multiplication And Division Algorithms','Division With Remainder','Multiplying And Dividing By Ten, One Hundred And One Thousand','Mental Calculation Involving Multiplication And Division'],
    'Multiplication Tables': ['Multiplication Tables Of Two, Three, Four, Five And Ten','Multiplication Tables Of Six, Seven, Eight And Nine','Mental Calculation Involving Multiplication Within Tables'],
    'Percentage': ['Expressing Part Of A Whole As Percentage','Finding Percentage Part Of A Whole','Discount, Goods And Services Tax And Annual Interest','Finding The Whole Given A Part And Percentage','Percentage Increase And Decrease'],
    'Pie Charts': ['Reading And Interpreting Pie Charts','Solving Problems Using Pie Chart Data'],
    'Rate': ['Rate As Amount Of Quantity Per Unit','Finding Rate, Total Amount Or Number Of Units'],
    'Ratio': ['Part-Whole Ratio','Comparison Ratio','Equivalent Ratios','Expressing Ratio In Simplest Form','Dividing A Quantity In A Given Ratio','Ratio Of Three Quantities','Relationship Between Fraction And Ratio','Ratio Word Problems'],
    'Shapes and Patterns': ['Identifying And Naming Two-Dimensional Shapes','Classifying Three-Dimensional Shapes','Making Patterns With Two-Dimensional Shapes'],
    'Symmetry': ['Identifying Symmetric Figures','Lines Of Symmetry','Completing Symmetric Figures'],
    'Time': ['Telling Time To Five Minutes','Use Of Am And Pm','Telling Time To The Minute','Measuring Time In Hours And Minutes','Measuring Time In Seconds','Twenty-Four Hour Clock','Finding Starting Time, Finishing Time Or Duration','Word Problems Involving Time'],
    'Volume': ['Building Solids With Unit Cubes','Measuring Volume In Cubic Units','Volume Of Cube And Cuboid','Finding Volume Of Liquid In Rectangular Tank','Finding Unknown Dimension Given Volume'],
    'Volume of Liquid': ['Measuring Volume In Litres','Comparing And Ordering Volumes','Measuring Volume In Millilitres','Converting Litres And Millilitres','Word Problems Involving Volume'],
    'Whole Numbers': ['Counting To One Hundred','Number Notation And Place Values','Comparing And Ordering Numbers','Patterns In Number Sequences','Rounding Numbers To The Nearest Ten, Hundred Or Thousand','Order Of Operations','Use Of Brackets'],
  },
  Science: {
    'Cycles': ['Life Cycles Of Insects','Life Cycles Of Amphibians','Life Cycles Of Flowering Plants','Life Cycles Of Fungi','Reproduction In Plants And Animals','Stages Of The Water Cycle'],
    'Diversity': ['General Characteristics Of Living And Non-Living Things','Classification Of Living And Non-Living Things','Diversity Of Materials And Their Properties'],
    'Energy': ['Light Energy Forms And Uses','Heat Energy Forms And Uses','Photosynthesis And Energy Pathways','Energy Conversion In Everyday Objects','Sources Of Heat','Effects Of Heat Gain And Heat Loss','Temperature And Use Of Thermometers','Good And Poor Conductors Of Heat','Sources Of Light','Reflection Of Light','Formation Of Shadows','Transparent, Translucent And Opaque Materials'],
    'Interactions': ['Interaction Of Magnetic Forces','Interaction Of Frictional, Gravitational And Elastic Spring Forces','Interactions Within The Environment','Food Chains And Food Webs','Effects Of Forces On Objects','Frictional Force','Gravitational Force','Elastic Spring Force'],
    'Matter': ['States Of Matter','Properties Of Solids, Liquids And Gases','Changes In State Of Matter'],
    'Systems': ['Plant Parts And Functions','Human Digestive System','Plant Respiratory And Circulatory Systems','Human Respiratory And Circulatory Systems','Electrical Systems And Circuits'],
  },
  English: {
    'Cloze': ['Grammar Cloze With Word Bank','Vocabulary Cloze With Dropdowns','Comprehension Free-Text Cloze'],
    'Comprehension': ['Direct Visual Retrieval','True Or False With Reason','Pronoun Referent Table','Sequencing Of Events','Deep Inference And Claim Evidence Reasoning','Visual Text Literal Retrieval','Visual Text Inference And Purpose'],
    'Editing': ['Correcting Spelling Errors','Correcting Grammatical Errors'],
    'Grammar': ['Simple Present And Past Tenses','Perfect And Continuous Tenses','Subject-Verb Agreement','Singular And Plural Nouns','Prepositions And Phrasal Verbs','Conjunctions','Active And Passive Voice','Relative Pronouns'],
    'Summary Writing': ['Identifying Key Information','Paraphrasing And Condensing Text'],
    'Synthesis': ['Combining With Conjunctions','Relative Clauses','Participle Phrases','Conditional Sentences','Reported Speech Transformation','Active To Passive Voice Transformation','Inversion'],
    'Vocabulary': ['Thematic Vocabulary Recall','Contextual Vocabulary Meaning','Synonyms And Antonyms'],
  },
};

// ── Title-case mapping for canon lookup ─────────────────────────────────────
const TITLE_SUBJECT = { mathematics: 'Mathematics', science: 'Science', english: 'English' };

// ── Build JSON output (no sub_topics, mirrors frontend exactly) ─────────────
function buildJsonOutput() {
  // Use JSON.stringify (un-indented) to mimic the existing one-line format.
  return JSON.stringify(referenceObj);
}

// ── Build JS output (full rewrite of SYLLABUS_DEPENDENCIES, with sub_topics) ─
function indent(text, n) {
  const pad = ' '.repeat(n);
  return text.split('\n').map((l, i) => i === 0 ? l : pad + l).join('\n');
}

function fmtArrSingleLine(arr) {
  return '[' + arr.map(x => `'${x.replace(/'/g, "\\'")}'`).join(', ') + ']';
}

function fmtArrMultiLine(arr, baseIndent) {
  if (arr.length === 0) return '[]';
  const pad = ' '.repeat(baseIndent + 2);
  return '[\n' + arr.map(x => `${pad}'${x.replace(/'/g, "\\'")}'`).join(',\n') + ',\n' + ' '.repeat(baseIndent) + ']';
}

function buildTopicEntry(topicKey, entry, subSubject) {
  const subTopics = (canonSubTopics[subSubject] && canonSubTopics[subSubject][topicKey]) || [];
  const lines = [];
  lines.push(`    '${topicKey}': {`);
  lines.push(`      prerequisites: ${fmtArrSingleLine(entry.prerequisites)},`);
  lines.push(`      enables: ${fmtArrSingleLine(entry.enables)},`);
  lines.push(`      first_introduced: '${entry.first_introduced}',`);
  lines.push(`      rationale: '${entry.rationale.replace(/'/g, "\\'")}',`);
  if (subTopics.length) {
    lines.push(`      sub_topics: ${fmtArrMultiLine(subTopics, 6)},`);
  } else {
    lines.push(`      sub_topics: [],`);
  }
  lines.push(`    },`);
  return lines.join('\n');
}

function buildJsConst() {
  const subjectKeys = ['mathematics', 'science', 'english'];
  const out = [];
  out.push('export const SYLLABUS_DEPENDENCIES = {');
  for (const subj of subjectKeys) {
    out.push(`  ${subj}: {`);
    const titleSubj = TITLE_SUBJECT[subj];
    const topics = referenceObj[subj];
    for (const [topicKey, entry] of Object.entries(topics)) {
      out.push(buildTopicEntry(topicKey, entry, titleSubj));
    }
    out.push('  },');
  }
  out.push('};');
  return out.join('\n');
}

// ── Read existing quest-pedagogy.js and replace SYLLABUS_DEPENDENCIES block ─
function rebuildQuestPedagogy() {
  const text = fs.readFileSync(JS_OUT, 'utf8');
  const startMarker = 'export const SYLLABUS_DEPENDENCIES = {';
  const start = text.indexOf(startMarker);
  if (start === -1) throw new Error('SYLLABUS_DEPENDENCIES not found in quest-pedagogy.js');
  // Find matching closing '};\n'
  let d = 0, end = -1;
  for (let i = text.indexOf('{', start); i < text.length; i++) {
    if (text[i] === '{') d++;
    else if (text[i] === '}') { d--; if (d === 0) { end = i + 1; break; } }
  }
  // Include the trailing semicolon
  if (text[end] === ';') end++;
  return text.slice(0, start) + buildJsConst() + text.slice(end);
}

// ── Write outputs ───────────────────────────────────────────────────────────
fs.writeFileSync(JSON_OUT, buildJsonOutput(), 'utf8');
console.log(`✓ Wrote ${JSON_OUT} (${fs.statSync(JSON_OUT).size} bytes)`);

const newJs = rebuildQuestPedagogy();
fs.writeFileSync(JS_OUT, newJs, 'utf8');
console.log(`✓ Wrote ${JS_OUT} (${fs.statSync(JS_OUT).size} bytes)`);

// ── Verify zero drift on shared fields ─────────────────────────────────────
const writtenJs = fs.readFileSync(JS_OUT, 'utf8');
const wsStart = writtenJs.indexOf('export const SYLLABUS_DEPENDENCIES = {');
const wsOpen = writtenJs.indexOf('{', wsStart);
let wsD = 0, wsEnd = -1;
for (let i = wsOpen; i < writtenJs.length; i++) {
  if (writtenJs[i] === '{') wsD++;
  else if (writtenJs[i] === '}') { wsD--; if (wsD === 0) { wsEnd = i + 1; break; } }
}
const writtenObj = (new Function('return ' + writtenJs.slice(wsOpen, wsEnd)))();
const setEq = (a, b) => { const sa = new Set(a), sb = new Set(b); return sa.size === sb.size && [...sa].every(x => sb.has(x)); };
let drift = 0;
for (const subj of ['mathematics', 'science', 'english']) {
  const refTopics = Object.keys(referenceObj[subj]);
  const wTopics = Object.keys(writtenObj[subj] || {});
  if (!setEq(refTopics, wTopics)) { console.log('  TOPIC SET DIFF', subj); drift++; }
  for (const t of refTopics) {
    const r = referenceObj[subj][t];
    const w = writtenObj[subj][t];
    if (!w) { console.log('  MISSING', subj, t); drift++; continue; }
    if (!setEq(r.prerequisites, w.prerequisites)) { console.log('  PREREQ DIFF', subj, t); drift++; }
    if (!setEq(r.enables, w.enables)) { console.log('  ENABLES DIFF', subj, t); drift++; }
    if (r.first_introduced !== w.first_introduced) { console.log('  FIRST_INTRO DIFF', subj, t); drift++; }
    if (r.rationale !== w.rationale) { console.log('  RATIONALE DIFF', subj, t); drift++; }
  }
}
console.log(`Drift: ${drift}`);
process.exit(drift === 0 ? 0 : 1);
