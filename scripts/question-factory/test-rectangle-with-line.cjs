'use strict';
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '..', '..', 'public', 'js', 'diagram-library.js'), 'utf8');

const startMarker = 'rectangleWithLine(params = {}) {';
const startIdx = src.indexOf(startMarker);
if (startIdx === -1) { console.error('marker not found'); process.exit(1); }
let depth = 0, i = startIdx + startMarker.length - 1, end = -1;
for (; i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const body = src.slice(startIdx + startMarker.length, end - 1);
const fn = new Function('params', body);

const svg = fn({
  vertices: ['A', 'B', 'C', 'D'],
  from_vertex: 'A',
  end_label: 'E',
  end_side: 'BC',
  end_position: 0.6,
  angles: [
    { at: 'A', value: '25°' },
    { at: 'E', value: '?' },
  ],
});

console.log(svg);
console.log('=== counts ===');
console.log('  <line>     :', (svg.match(/<line /g) || []).length);
console.log('  <rect>     :', (svg.match(/<rect /g) || []).length);
console.log('  <circle>   :', (svg.match(/<circle /g) || []).length);
console.log('  <text>     :', (svg.match(/<text /g) || []).length);
console.log('  Has A,B,C,D vertex labels:', />A</.test(svg) && />B</.test(svg) && />C</.test(svg) && />D</.test(svg));
console.log('  Has E label:', />E</.test(svg));
console.log('  Has 25°    :', />25°</.test(svg));
console.log('  Has ?      :', />\?</.test(svg));
