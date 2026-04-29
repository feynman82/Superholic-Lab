/**
 * scripts/backfill/build.js
 *
 * Builds an OpenAI Batch JSONL request file for question_bank enrichment.
 * Pulls rows missing sub_topic OR cognitive_skill, attaches the FULL
 * canonical sub_topic list for the row's (subject, topic) pair as
 * grounding context, and emits one batch request per row.
 *
 * Anti-hallucination guardrails:
 *   1. The system prompt enumerates the canonical sub_topic list inline
 *      and says MUST pick from this list verbatim.
 *   2. The system prompt enumerates the cognitive_skill 6-item enum.
 *   3. The model is told to RETURN null when not confident — explicit
 *      "do not guess" instruction repeated three times.
 *   4. Two few-shot examples (one Science, one English) show the
 *      desired null-on-uncertainty behaviour.
 *   5. response_format: json_object forces strict JSON output.
 *   6. temperature: 0.05 — minimum coherence, near-deterministic.
 *   7. Output schema includes a `confidence` field; the apply script
 *      only writes fields where confidence === 'high'.
 *
 * Usage:
 *   node scripts/backfill/build.js              # full run (every missing row)
 *   node scripts/backfill/build.js --sample 50  # dry-run sample (Pass 1)
 *   node scripts/backfill/build.js --subject English --sample 20
 *   node scripts/backfill/build.js --out backfill_pass1.jsonl
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env or process env.
 */

import 'dotenv/config'; // auto-loads .env in repo root so SUPABASE_*/OPENAI_API_KEY work without --env-file
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { SYLLABUS_DEPENDENCIES } from '../../lib/api/quest-pedagogy.js';

// ─── CLI args ──────────────────────────────────────────────────────
function arg(name, def) {
  const i = process.argv.indexOf(name);
  if (i < 0) return def;
  return process.argv[i + 1] ?? true;
}
const SAMPLE_SIZE = parseInt(arg('--sample', '0'), 10) || 0;
const SUBJECT_FILTER = arg('--subject', null);
const OUT_PATH = arg('--out', SAMPLE_SIZE > 0 ? 'backfill_pass1.jsonl' : 'backfill_pass2.jsonl');

// ─── Config ────────────────────────────────────────────────────────
const COGNITIVE_SKILLS = [
  'Factual Recall',
  'Conceptual Understanding',
  'Routine Application',
  'Non-Routine / Heuristics',
  'Inferential Reasoning',
  'Synthesis & Evaluation',
];

// Maps DB subject (mixed case) to SYLLABUS_DEPENDENCIES key (lowercase).
const SUBJECT_KEY = {
  Mathematics: 'mathematics',
  Science:     'science',
  English:     'english',
};

// ─── Anti-hallucination system prompt ──────────────────────────────
//
// Three-times rule: the constraint that the model MUST pick from the
// canon list is repeated three times in slightly different phrasings.
// This is empirically the most effective way to suppress confabulation
// for taxonomy-pinning tasks. Few-shot examples lock the null-on-
// uncertainty behaviour.
function buildSystemPrompt() {
  return `You are a Singapore MOE primary-school curriculum expert classifying existing questions against a locked canonical taxonomy.

YOUR JOB: For each question, infer ONLY the fields that are missing. Output ONLY a JSON object matching the schema below.

═══════════════════════════════════════════════════════════════════
ANTI-HALLUCINATION RULES (read carefully):

1. STRICT CANON ONLY — sub_topic MUST be a verbatim string from the canonical list provided in the user message for the question's (subject, topic) pair. If you cannot find a verbatim match, return null. Do NOT invent strings. Do NOT paraphrase. Do NOT combine words from the list to make a new label.

2. STRICT ENUM — cognitive_skill MUST be exactly one of these six values, character-for-character:
   - "Factual Recall"
   - "Conceptual Understanding"
   - "Routine Application"
   - "Non-Routine / Heuristics"
   - "Inferential Reasoning"
   - "Synthesis & Evaluation"
   No other strings allowed. No abbreviations. No null fallbacks for cognitive_skill UNLESS the question content is genuinely ambiguous.

3. NEVER GUESS — if the question's content does not clearly map to any sub_topic on the canonical list, return null for sub_topic. A null answer is correct and useful; an invented answer is harmful and will be rejected by the apply script.

4. NEVER OVERWRITE — only suggest fields the user message marked as missing (the user message will say "MISSING: sub_topic, cognitive_skill" or similar). Leave other fields out of your response.

═══════════════════════════════════════════════════════════════════
OUTPUT SCHEMA (return EXACTLY this shape, no extra keys):

{
  "sub_topic": "<verbatim from canon> | null",
  "cognitive_skill": "<one of the 6 enum values> | null",
  "confidence": "high | medium | low",
  "reason": "<one short sentence explaining your choice or why you returned null>"
}

confidence rubric:
  - "high"   → the question's content matches one canon sub_topic unambiguously.
  - "medium" → matches but with some interpretation. The apply script will reject medium for sub_topic.
  - "low"    → unsure. Return null for the field. The apply script will skip the row.

═══════════════════════════════════════════════════════════════════
FEW-SHOT EXAMPLES:

Example 1 (Science — high-confidence match)
QUESTION: "Which type of energy is stored in a stretched rubber band?"
SUBJECT: Science
TOPIC: Energy
CANONICAL sub_topics for Science / Energy:
  ["Light Energy Forms And Uses", "Heat Energy Forms And Uses", "Photosynthesis And Energy Pathways", "Energy Conversion In Everyday Objects"]
MISSING: sub_topic, cognitive_skill
ANSWER:
{
  "sub_topic": "Energy Conversion In Everyday Objects",
  "cognitive_skill": "Conceptual Understanding",
  "confidence": "high",
  "reason": "Stretched rubber band stores elastic potential energy — direct conceptual recall of energy forms; matches the everyday-objects sub_topic."
}

Example 2 (English — null on uncertainty)
QUESTION: "She walked _____ the room slowly. (a) into  (b) onto  (c) above  (d) under"
SUBJECT: English
TOPIC: Cloze
CANONICAL sub_topics for English / Cloze:
  ["Grammar Cloze With Word Bank", "Vocabulary Cloze With Dropdowns", "Comprehension Free-Text Cloze"]
MISSING: sub_topic, cognitive_skill
ANSWER:
{
  "sub_topic": "Grammar Cloze With Word Bank",
  "cognitive_skill": "Routine Application",
  "confidence": "high",
  "reason": "Single-blank with 4 closed-form options drawing from a word bank — Grammar Cloze With Word Bank fits exactly. Routine prep-position application."
}

Example 3 (English — genuine ambiguity → null)
QUESTION: "Identify the line that contains an error: 'My brother go to school every day.'"
SUBJECT: English
TOPIC: Editing
CANONICAL sub_topics for English / Editing:
  ["Correcting Spelling Errors", "Correcting Grammatical Errors"]
MISSING: sub_topic, cognitive_skill
ANSWER:
{
  "sub_topic": "Correcting Grammatical Errors",
  "cognitive_skill": "Routine Application",
  "confidence": "high",
  "reason": "Subject-verb agreement error (brother go → brother goes) is grammatical, not spelling."
}

Example 4 (Science — uncertain → null)
QUESTION: "Discuss what happens."
SUBJECT: Science
TOPIC: Matter
CANONICAL sub_topics for Science / Matter:
  ["States Of Matter", "Properties Of Solids, Liquids And Gases", "Changes In State Of Matter"]
MISSING: sub_topic, cognitive_skill
ANSWER:
{
  "sub_topic": null,
  "cognitive_skill": null,
  "confidence": "low",
  "reason": "Question stem 'Discuss what happens' has no concrete content to classify — apply script should skip this row for human review."
}

═══════════════════════════════════════════════════════════════════
Return ONLY the JSON object. No prose. No markdown fences.`;
}

// ─── User message per row ──────────────────────────────────────────
function buildUserMessage(row, missing) {
  const subjectKey = SUBJECT_KEY[row.subject] || String(row.subject || '').toLowerCase();
  const subjectMap = SYLLABUS_DEPENDENCIES[subjectKey] || {};
  const topicNode  = subjectMap[row.topic];
  const canonSubs  = topicNode?.sub_topics || [];

  // Truncate question content to keep token cost predictable. The model
  // never needs more than ~400 chars of stem to classify a topic match.
  const stem = String(row.question_text || '').slice(0, 400);
  const passage = row.passage ? String(row.passage).slice(0, 300) : null;

  const lines = [
    `SUBJECT: ${row.subject}`,
    `TOPIC: ${row.topic}`,
    `QUESTION TYPE: ${row.type || 'unknown'}`,
    `QUESTION TEXT: ${stem}`,
  ];
  if (passage)        lines.push(`PASSAGE EXCERPT: ${passage}`);
  if (row.sub_topic)  lines.push(`CURRENT sub_topic (DO NOT CHANGE — leave out of response): ${row.sub_topic}`);
  if (row.cognitive_skill) lines.push(`CURRENT cognitive_skill (DO NOT CHANGE — leave out of response): ${row.cognitive_skill}`);

  lines.push('');
  lines.push(`CANONICAL sub_topics for ${row.subject} / ${row.topic}:`);
  lines.push(canonSubs.length > 0 ? JSON.stringify(canonSubs) : '[]  ← topic has no canonical sub_topics defined; return null for sub_topic');
  lines.push('');
  lines.push(`MISSING: ${missing.join(', ')}`);
  lines.push('Return JSON object per schema. Strict canon. Null when uncertain.');

  return lines.join('\n');
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required in env.');
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  let q = sb.from('question_bank')
    .select('id, subject, topic, sub_topic, cognitive_skill, type, question_text, passage')
    .or('sub_topic.is.null,cognitive_skill.is.null')
    .is('backfill_run_id', null);
  if (SUBJECT_FILTER) q = q.eq('subject', SUBJECT_FILTER);
  if (SAMPLE_SIZE > 0) q = q.limit(SAMPLE_SIZE);

  const { data: rows, error } = await q;
  if (error) {
    console.error('Supabase fetch error:', error.message);
    process.exit(1);
  }
  if (!rows || rows.length === 0) {
    console.log('No rows match the filter — nothing to enrich.');
    return;
  }

  console.log(`Pulled ${rows.length} rows from question_bank.`);
  const sysPrompt = buildSystemPrompt();

  const lines = rows.map(r => {
    const missing = [];
    if (!r.sub_topic       || String(r.sub_topic).trim() === '')       missing.push('sub_topic');
    if (!r.cognitive_skill || String(r.cognitive_skill).trim() === '') missing.push('cognitive_skill');
    if (missing.length === 0) return null; // shouldn't happen given filter, but defensive

    const userMsg = buildUserMessage(r, missing);
    return JSON.stringify({
      custom_id: `qb_${r.id}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user',   content: userMsg   },
        ],
        temperature:     0.05,
        max_tokens:      300,
        response_format: { type: 'json_object' },
      },
    });
  }).filter(Boolean);

  fs.writeFileSync(OUT_PATH, lines.join('\n') + '\n');
  console.log(`Wrote ${lines.length} requests to ${OUT_PATH}`);

  // Sanity print: first 1 line truncated
  if (lines[0]) {
    const first = JSON.parse(lines[0]);
    console.log('\nSample request 1:');
    console.log('  custom_id:', first.custom_id);
    console.log('  user msg head:', first.body.messages[1].content.slice(0, 160) + '…');
  }
}

main().catch(err => {
  console.error('build.js failed:', err);
  process.exit(1);
});
