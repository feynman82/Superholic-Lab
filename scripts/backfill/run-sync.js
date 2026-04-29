/**
 * scripts/backfill/run-sync.js
 *
 * Synchronous alternative to submit.js — fires the JSONL produced by
 * build.js straight against /v1/chat/completions (regular sync endpoint)
 * instead of the Batch API. Trades the 50% Batch discount for ~100×
 * faster turnaround:
 *
 *    Batch     50 rows  → 5–60 min typical, sometimes 4h+
 *    Sync      50 rows  → ~1–2 minutes (concurrency=5)
 *    Sync   1,500 rows  → ~5–10 minutes (concurrency=10)
 *
 * Output is written in the EXACT shape of an OpenAI Batch output JSONL,
 * so the existing apply.js and audit.js scripts ingest it unchanged.
 *
 * Usage:
 *   node scripts/backfill/run-sync.js <input.jsonl> [--concurrency N]
 *
 *   --concurrency N    Parallel in-flight requests. Default 5.
 *                      Don't go above 20 — gpt-4o-mini RPM is ~10K but
 *                      higher concurrency gives diminishing returns and
 *                      risks rate-limit retries that wash out the speed
 *                      gain.
 *
 * Same env contract as the other scripts: OPENAI_API_KEY auto-loaded
 * from .env via dotenv/config.
 *
 * Cost note: this path is ~2× the Batch price (no batch discount). For
 * a 50-row Pass 1 dry-run that's pennies (~$0.005 vs ~$0.0025). For
 * Pass 2 full run on ~1,586 rows it's ~$0.20 vs ~$0.10. Both still
 * trivially small — pick the one that fits your wait tolerance.
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

function arg(name, def) {
  const i = process.argv.indexOf(name);
  if (i < 0) return def;
  return process.argv[i + 1] ?? true;
}

const INPUT       = process.argv[2];
const CONCURRENCY = Math.max(1, Math.min(20, parseInt(arg('--concurrency', '5'), 10) || 5));

if (!INPUT) {
  console.error('Usage: node scripts/backfill/run-sync.js <input.jsonl> [--concurrency N]');
  process.exit(1);
}
if (!fs.existsSync(INPUT)) {
  console.error('File not found:', INPUT);
  process.exit(1);
}

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) {
  console.error('OPENAI_API_KEY required in env (auto-loaded from .env).');
  process.exit(1);
}

const baseName = path.basename(INPUT, '.jsonl');
const dir      = path.dirname(INPUT);
const OUT_FILE = path.join(dir, `${baseName}.output.jsonl`);
const ERR_FILE = path.join(dir, `${baseName}.errors.jsonl`);

// ─── Single-request worker ─────────────────────────────────────────
//
// On 429/5xx, retry up to 3 times with exponential backoff (1s, 2s, 4s).
// Anything else (4xx malformed, auth failure) fails fast — those aren't
// transient and re-trying just burns time.
async function callOnce(req) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KEY}`,
        },
        body: JSON.stringify(req.body),
      });
      if (res.ok) {
        const body = await res.json();
        return {
          id: `sync_${req.custom_id}`,
          custom_id: req.custom_id,
          response: { status_code: 200, request_id: res.headers.get('x-request-id') || null, body },
          error: null,
        };
      }
      // Retry only on transient classes
      if (res.status === 429 || res.status >= 500) {
        lastErr = `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      // Non-retryable
      const text = await res.text();
      return {
        id: `sync_${req.custom_id}`,
        custom_id: req.custom_id,
        response: null,
        error: { code: String(res.status), message: text.slice(0, 500) },
      };
    } catch (err) {
      lastErr = err.message || String(err);
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  return {
    id: `sync_${req.custom_id}`,
    custom_id: req.custom_id,
    response: null,
    error: { code: 'transient', message: `Failed after 3 retries: ${lastErr}` },
  };
}

// ─── Concurrency pool ──────────────────────────────────────────────
//
// Picks N items off the queue at a time. Each finished worker grabs
// the next item until the queue drains. Simpler than maintaining a
// promise pool by hand and cheap because there's no shared state to
// lock.
async function runPool(items, worker, concurrency) {
  const queue = items.slice();
  const results = [];
  let done = 0;
  const total = queue.length;

  async function next() {
    while (queue.length > 0) {
      const item = queue.shift();
      const r = await worker(item);
      results.push(r);
      done++;
      if (done % 5 === 0 || done === total) {
        const pct = Math.round((done / total) * 100);
        process.stdout.write(`\r  ${done}/${total} (${pct}%)  `);
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => next());
  await Promise.all(workers);
  process.stdout.write('\n');
  return results;
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  const lines = fs.readFileSync(INPUT, 'utf8').split('\n').filter(Boolean);
  const requests = lines.map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);

  console.log(`Sync mode — ${requests.length} requests, concurrency ${CONCURRENCY}`);
  const t0 = Date.now();
  const results = await runPool(requests, callOnce, CONCURRENCY);
  const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);

  const ok      = results.filter(r => r.response).length;
  const errored = results.filter(r => r.error).length;

  // OpenAI Batch puts errored rows in a separate error file. Mirror that
  // so the apply/audit scripts only ever see the success rows in the
  // output file (the existing apply script doesn't know what to do with
  // an error-shaped row otherwise).
  const okLines  = results.filter(r => r.response).map(r => JSON.stringify(r));
  const errLines = results.filter(r => r.error).map(r => JSON.stringify(r));
  fs.writeFileSync(OUT_FILE, okLines.join('\n') + (okLines.length ? '\n' : ''));
  if (errLines.length > 0) {
    fs.writeFileSync(ERR_FILE, errLines.join('\n') + '\n');
  }

  console.log(`\nDONE in ${elapsedSec}s — ok=${ok}, errored=${errored}`);
  console.log(`  → ${OUT_FILE}`);
  if (errored > 0) console.log(`  → ${ERR_FILE} (${errored} rows)`);
  console.log('\nNext step:');
  console.log(`  node scripts/backfill/audit.js ${OUT_FILE}     # human verify (Pass 1)`);
  console.log(`  node scripts/backfill/apply.js ${OUT_FILE} backfill_$(date +%Y_%m_%d)   # write to DB (Pass 2)`);
}

main().catch(err => { console.error(err); process.exit(1); });
