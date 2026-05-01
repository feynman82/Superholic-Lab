/**
 * rebuild-topic-splits.js
 * Rebuilds all topic-split JSON files from the fixed broad Maths files.
 * Run after fix-maths-options.js to propagate short options to topic files.
 *
 * Run: node scripts/rebuild-topic-splits.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'questions');

// Broad files to split
const BROAD_FILES = ['p4-mathematics.json', 'p2-mathematics.json'];

function slugify(topic) {
  return topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

let totalFiles = 0;

for (const filename of BROAD_FILES) {
  const filepath = path.join(DATA_DIR, filename);
  const questions = JSON.parse(fs.readFileSync(filepath, 'utf8'));

  // Group by topic
  const byTopic = {};
  for (const q of questions) {
    const slug = slugify(q.topic);
    if (!byTopic[slug]) byTopic[slug] = [];
    byTopic[slug].push(q);
  }

  // Write one file per topic
  const prefix = filename.replace('.json', '');
  for (const [slug, qs] of Object.entries(byTopic)) {
    const outPath = path.join(DATA_DIR, `${prefix}-${slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(qs, null, 2));
    console.log(`Written: ${prefix}-${slug}.json (${qs.length} questions)`);
    totalFiles++;
  }
}

console.log(`\nRebuilt ${totalFiles} topic-split files.`);
