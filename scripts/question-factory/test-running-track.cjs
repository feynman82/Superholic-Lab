'use strict';
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '..', '..', 'public', 'js', 'diagram-library.js'), 'utf8');

const startMarker = 'runningTrack(params = {}) {';
const startIdx = src.indexOf(startMarker);
if (startIdx === -1) { console.error('marker not found'); process.exit(1); }
let depth = 0, i = startIdx + startMarker.length - 1, end = -1;
for (; i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const body = src.slice(startIdx + startMarker.length, end - 1);
const fn = new Function('params', body);

const svg = fn({ straight_length_label: '80 m', diameter_label: '70 m' });
console.log(svg);
console.log('=== counts ===');
console.log('  <line>     :', (svg.match(/<line /g) || []).length);
console.log('  <polyline> :', (svg.match(/<polyline /g) || []).length);
console.log('  <text>     :', (svg.match(/<text /g) || []).length);
console.log('  80 m       :', />80 m</.test(svg));
console.log('  70 m       :', />70 m</.test(svg));
