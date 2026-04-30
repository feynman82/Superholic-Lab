'use strict';
// Smoke-test rectangleDividedRightAngle v3 with both new and legacy payloads.
// Run: node scripts/question-factory/test-rectangle-renderer.cjs

const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '..', '..', 'public', 'js', 'diagram-library.js'), 'utf8');

const startMarker = 'rectangleDividedRightAngle(params) {';
const startIdx = src.indexOf(startMarker);
if (startIdx === -1) { console.error('marker not found'); process.exit(1); }
let depth = 0, i = startIdx + startMarker.length - 1, end = -1;
for (; i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const body = src.slice(startIdx + startMarker.length, end - 1);
const fn = new Function('params', body);

function summarise(label, payload) {
  const svg = fn(payload);
  console.log(`\n=== ${label} ===`);
  console.log('  <line>     :', (svg.match(/<line /g) || []).length);
  console.log('  <polyline> :', (svg.match(/<polyline /g) || []).length);
  console.log('  <text>     :', (svg.match(/<text /g) || []).length);
  console.log('  T label    :', />T</.test(svg));
  console.log('  U label    :', />U</.test(svg));
  console.log('  22°        :', />22°</.test(svg));
  console.log('  35°        :', />35°</.test(svg));
  console.log('  ?          :', />\?</.test(svg));
}

// New API — geometrically faithful (T at 68°, U at 35°)
summarise('NEW: explicit rays + arcs', {
  vertices: ['P','Q','R','S'],
  rays: [
    { name: 'T', at_deg: 68 },
    { name: 'U', at_deg: 35 },
  ],
  arcs: [
    { between: ['P','T'], label: '22°' },
    { between: ['T','U'], label: '?' },
    { between: ['U','R'], label: '35°' },
  ],
});

// New API — using from_side/rotate_deg
summarise('NEW: from_side + rotate_deg', {
  vertices: ['P','Q','R','S'],
  rays: [
    { name: 'T', from_side: 'QP', rotate_deg: 22 },
    { name: 'U', from_side: 'QR', rotate_deg: 35 },
  ],
  arcs: [
    { between: ['P','T'], label: '22°' },
    { between: ['T','U'], label: '?' },
    { between: ['U','R'], label: '35°' },
  ],
});

// Legacy API — must still produce rays/arcs/labels (with hard-coded 60°/40° positions)
summarise('LEGACY: angles list with {name, value}', {
  vertices: ['P','Q','R','S'],
  angles: [
    { name: 'PQT', value: '22°' },
    { name: 'TQU', value: '?' },
    { name: 'UQR', value: '35°' },
  ],
});

// Edge case — no angles, no rays (just rectangle)
summarise('EMPTY: no angles', { vertices: ['P','Q','R','S'] });
