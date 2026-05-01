import { SYLLABUS_DEPENDENCIES } from '../public/js/syllabus-dependencies.js';
import { readFileSync } from 'fs';

const canon = parseCSV(readFileSync('canon_level_topics.csv', 'utf8'));
const canonTopics = {
  mathematics: new Set(canon.filter(r => r.subject === 'Mathematics').map(r => r.topic)),
  science:     new Set(canon.filter(r => r.subject === 'Science').map(r => r.topic)),
  english:     new Set(canon.filter(r => r.subject === 'English').map(r => r.topic)),
};

let errors = 0;
for (const subject of ['mathematics','science','english']) {
  const deps = SYLLABUS_DEPENDENCIES[subject];
  const expected = canonTopics[subject];
  
  // 1. Coverage check
  for (const t of expected) if (!deps[t]) { console.error(`MISSING: ${subject}.${t}`); errors++; }
  for (const t of Object.keys(deps)) if (!expected.has(t)) { console.error(`EXTRA: ${subject}.${t}`); errors++; }
  
  // 2. Reference integrity
  for (const [t, node] of Object.entries(deps)) {
    for (const p of node.prerequisites) if (!deps[p]) { console.error(`BAD PREREQ: ${subject}.${t} → ${p}`); errors++; }
    for (const e of node.enables) if (!deps[e]) { console.error(`BAD ENABLES: ${subject}.${t} → ${e}`); errors++; }
  }
  
  // 3. Bidirectional consistency
  for (const [t, node] of Object.entries(deps)) {
    for (const p of node.prerequisites) {
      if (!deps[p].enables.includes(t)) { console.error(`ASYMMETRIC: ${subject}.${t} prereq ${p}, but ${p} doesn't enable ${t}`); errors++; }
    }
  }
  
  // 4. Cycle detection (topological sort)
  const inDegree = {};
  for (const t of Object.keys(deps)) inDegree[t] = deps[t].prerequisites.length;
  const queue = Object.keys(inDegree).filter(t => inDegree[t] === 0);
  let visited = 0;
  while (queue.length) {
    const t = queue.shift(); visited++;
    for (const e of deps[t].enables) { if (--inDegree[e] === 0) queue.push(e); }
  }
  if (visited !== Object.keys(deps).length) { console.error(`CYCLE in ${subject}`); errors++; }
}

console.log(errors === 0 ? '✅ All checks passed' : `❌ ${errors} errors`);
process.exit(errors === 0 ? 0 : 1);