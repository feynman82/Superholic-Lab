/**
 * fix-maths-options.js
 * Strips verbose sentence options from Maths MCQ questions down to
 * short answer values (numbers, fractions, money amounts, short phrases).
 * Science and English questions are left unchanged.
 *
 * Run: node scripts/fix-maths-options.js
 */

const fs = require('fs');
const path = require('path');

// Short options per question ID
const SHORT_OPTIONS = {
  // p4-mathematics.json
  'p4m-eq01': [
    'No — bigger numbers mean a bigger fraction',
    'Yes — 8/12 = 2/3',
    'No — 8/12 = 4/6 only',
    'Approximately — 8/12 ≈ 1/2',
  ],
  'p4m-im01': ['2 and 1/4', '1 and 5/4', '3 and 1/4', '2 and 3/4'],
  'p4m-sf01': ['7/12', '4/2', '4/6', '1/2'],
  'p4m-fs01': ['5', '9', '20', '31'],
  'p4m-pv01': ['4 dollars', '40 cents', '4 cents', '0.04 dollars'],
  'p4m-rd01': ['$7', '$8', '$6', '$7.57'],
  'p4m-da01': ['2.15 km', '1.358 km', '1.43 km', '2.13 km'],
  'p4m-fd01': ['0.34', '0.43', '0.75', '1.33'],
  'p4m-cf01': ['4', '5', '6', '8'],
  'p4m-oo01': [
    'Ahmad — 32 (left to right)',
    'Siti — 17 (multiply first)',
    'Ahmad — 32 (larger result first)',
    'Neither — 23',
  ],
  'p4m-wp01': ['1,536 boxes', '262 boxes', '1,256 boxes', '1,500 boxes'],
  'p4m-pm01': ['26 m', '13 m', '40 m', '20 m'],
  'p4m-ar01': ['63 m²', '32 m²', '16 m²', '81 m²'],
  'p4m-an01': ['132°', '42°', '312°', '48°'],

  // p2-mathematics.json
  'p2m-pv01': ['5', '50', '500', '573'],
  'p2m-np01': ['250', '255', '265', '246'],
  'p2m-oe01': ['124', '336', '457', '890'],
  'p2m-add01': ['524', '534', '624', '634'],
  'p2m-sub01': ['256', '266', '344', '356'],
  'p2m-wp-sub01': ['117', '217', '223', '473'],
  'p2m-mul01': ['9', '15', '20', '25'],
  'p2m-div01': ['3', '5', '6', '9'],
  'p2m-fr01': ['1/2', '1/3', '1/4', '1/8'],
  'p2m-fr02': ['Siti (1/2)', 'MeiLing (1/4)', 'Priya (1/6)', 'Ravi (1/8)'],
  'p2m-mn01': ['$2.30', '$3.20', '$3.30', '$5.70'],
  'p2m-mn02': ['$1.35', '$1.25', '$2.25', '$8.75'],
};

const FILES = [
  'p4-mathematics.json',
  'p2-mathematics.json',
];

const DATA_DIR = path.join(__dirname, '..', 'data', 'questions');

let totalFixed = 0;

for (const filename of FILES) {
  const filepath = path.join(DATA_DIR, filename);
  const questions = JSON.parse(fs.readFileSync(filepath, 'utf8'));

  let changed = 0;
  const updated = questions.map(q => {
    if (q.type === 'mcq' && SHORT_OPTIONS[q.id]) {
      changed++;
      return { ...q, options: SHORT_OPTIONS[q.id] };
    }
    return q;
  });

  fs.writeFileSync(filepath, JSON.stringify(updated, null, 2));
  console.log(`${filename}: fixed ${changed} questions`);
  totalFixed += changed;
}

console.log(`\nTotal questions fixed: ${totalFixed}`);
