// ─────────────────────────────────────────────────────────────────────────
// lib/api/pedagogy-telemetry.js — Wena RAP per-turn telemetry v1.0
// ─────────────────────────────────────────────────────────────────────────
// Server-side only. Writes one row per chat turn into pedagogy_events,
// classifies cell-hit kind, normalises raw level strings, and computes a
// cheap deterministic faithfulness score for DIRECT_TEACH turns.
//
// Hard contract: every export is fire-and-forget on the chat hot path.
// A telemetry failure (DB down, schema drift, table missing, network
// blip) MUST NOT throw upward. handleChat catches its own errors anyway,
// but we don't want to rely on that — log and swallow here.
// ─────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

// ── Lazy service-role client singleton ─────────────────────────────────
// Only built on first use so the module can be imported in environments
// where the env vars aren't set (e.g., a browser test harness importing
// for type checks). Subsequent calls reuse the same client.
let _serviceClient = null;
function getServiceClient() {
  if (_serviceClient) return _serviceClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('[pedagogy-telemetry] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  }
  _serviceClient = createClient(url, key, { auth: { persistSession: false } });
  return _serviceClient;
}

// ── Level normalisation ────────────────────────────────────────────────

const STOPWORDS = new Set([
  'the','a','an','is','are','was','were','to','of','in','on','and','or','but','that','this'
]);

/**
 * Canonicalise a raw level string to one of P1..P6 (or null when unknown).
 * Accepts: 'P1', 'p1', 'Primary 1', 'primary-1', '1' — case-insensitive.
 *
 * Returns `{ raw, normalised }` so the caller can log both. `normalised`
 * is null for unrecognised shapes — telemetry then surfaces the raw input
 * via the level normalisation report panel.
 *
 * @param {string} rawLevel
 * @returns {{ raw: string, normalised: string | null }}
 */
export function normaliseLevel(rawLevel) {
  if (typeof rawLevel !== 'string') return { raw: String(rawLevel ?? ''), normalised: null };
  const trimmed = rawLevel.trim();
  if (!trimmed) return { raw: rawLevel, normalised: null };
  // Strip "primary" prefix (any case, optional space/dash), strip leading "p", trim, parse digit.
  const cleaned = trimmed
    .toLowerCase()
    .replace(/^primary[\s-]*/i, '')
    .replace(/^p/, '')
    .trim();
  const m = cleaned.match(/^([1-6])$/);
  return { raw: rawLevel, normalised: m ? `P${m[1]}` : null };
}

// ── Cell-hit classification ────────────────────────────────────────────

/**
 * Classifies the lookup outcome for a chat turn. Drives the dashboard's
 * cell-hit distribution panel and the orphaned-cells query.
 *
 *   exact   — cell.topic === requestedTopic AND cell.sub_topic === requestedSubTopic
 *   fallback — cell.topic === requestedTopic but sub_topic differs (or was null)
 *   miss    — RAP fired but no cell returned (caller should have legacy-fallen-back)
 *   n/a     — RAP not fired this turn (legacy or pre-flag)
 *
 * @param {string|null} requestedTopic
 * @param {string|null} requestedSubTopic
 * @param {object|null} returnedCell
 * @returns {'exact'|'fallback'|'miss'|'n/a'}
 */
export function classifyCellHit(requestedTopic, requestedSubTopic, returnedCell) {
  if (!returnedCell) return 'miss';
  if (!requestedTopic) return 'n/a';
  if (returnedCell.topic !== requestedTopic) return 'miss';
  if (requestedSubTopic && returnedCell.sub_topic === requestedSubTopic) return 'exact';
  return 'fallback';
}

// ── Faithfulness score (token Jaccard) ─────────────────────────────────

function tokenise(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')   // strip punctuation, keep apostrophes
    .split(/\s+/)
    .filter(t => t.length > 0 && !STOPWORDS.has(t));
}

/**
 * Token Jaccard similarity between two strings, dropping a small stopword
 * list. Used as a cheap proxy for "did the model stay faithful to the
 * cell's foundational_teach_script?" — populated only for DIRECT_TEACH
 * turns. Sprint 4 just logs the metric; thresholding is deferred.
 *
 *   |intersection(tokens)| / |union(tokens)|, range 0.0–1.0.
 *
 * @param {string} referenceText
 * @param {string} modelOutput
 * @returns {number} 0.0–1.0; 0 if either input has no real tokens
 */
export function computeKeywordOverlap(referenceText, modelOutput) {
  const a = new Set(tokenise(referenceText));
  const b = new Set(tokenise(modelOutput));
  if (a.size === 0 || b.size === 0) return 0;
  let intersect = 0;
  for (const t of a) if (b.has(t)) intersect += 1;
  const union = a.size + b.size - intersect;
  if (union === 0) return 0;
  return intersect / union;
}

// ── Event writer (fire-and-forget) ─────────────────────────────────────

/**
 * Writes one telemetry row. Does not throw under any circumstance —
 * logs failures and resolves so the chat hot path is never broken by a
 * telemetry issue.
 *
 * Caller should NOT await this in a way that blocks the response.
 * The recommended pattern is:
 *
 *     logPedagogyEvent({...}).catch(()=>{}); // explicit no-op
 *
 * but `await` is also safe (it never rejects).
 *
 * @param {object} payload — see schema in supabase/029_pedagogy_events.sql
 * @returns {Promise<void>}
 */
export async function logPedagogyEvent(payload) {
  try {
    const {
      studentId, parentId, conversationId, turnIndex,
      levelRaw, subject, topic, subTopic,
      rapEnabled, promptVersion, mode, previousMode,
      cellHitKind, stallCount, hasImage,
      teachScriptKeywordOverlap, outputLengthChars,
      metadata
    } = payload || {};

    const { normalised } = normaliseLevel(levelRaw);

    const row = {
      student_id:        studentId        || null,
      parent_id:         parentId         || null,
      conversation_id:   conversationId   || null,
      turn_index:        Number.isInteger(turnIndex) ? turnIndex : null,
      level_raw:         levelRaw         || null,
      level_normalised:  normalised,
      subject:           subject          || null,
      topic:             topic            || null,
      sub_topic:         subTopic         || null,
      rap_enabled:       !!rapEnabled,
      prompt_version:    promptVersion    || null,
      mode:              mode             || null,
      previous_mode:     previousMode     || null,
      cell_hit_kind:     cellHitKind      || null,
      stall_count:       Number.isInteger(stallCount) ? stallCount : 0,
      has_image:         !!hasImage,
      teach_script_keyword_overlap:
        (typeof teachScriptKeywordOverlap === 'number' && Number.isFinite(teachScriptKeywordOverlap))
          ? teachScriptKeywordOverlap
          : null,
      output_length_chars:
        Number.isInteger(outputLengthChars) ? outputLengthChars : null,
      metadata:          (metadata && typeof metadata === 'object') ? metadata : null
    };

    const client = getServiceClient();
    const { error } = await client.from('pedagogy_events').insert(row);
    if (error) {
      console.error('[pedagogy-telemetry] insert error:', error.message || error);
    }
  } catch (err) {
    // Includes env-var-not-set, network errors, schema drift, etc.
    // Critical contract: never re-throw. Chat must survive telemetry failure.
    console.error('[pedagogy-telemetry] swallowed exception:', err?.message || err);
  }
}
