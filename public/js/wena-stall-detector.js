// ─────────────────────────────────────────────────────────────────────────
// /js/wena-stall-detector.js — Wena Stall Detector + Pedagogy Mode v1.0
// ─────────────────────────────────────────────────────────────────────────
// Pure functions. No DOM, no network, no Supabase. The Sprint 2 contract:
//   - detectStall(userMessage, history) → { stalled, reason, confidence }
//   - consecutiveStalls(history)        → integer count
//   - selectPedagogyMode(history, cell) → mode from PEDAGOGY_MODES
//   - STALL_REASONS, PEDAGOGY_MODES     → enum constants
//
// Sprint 2 ships pure logic only. Consumers (api/chat.js, prompt assembly)
// are wired in Sprint 3.
//
// Why selectPedagogyMode lives here (not in lib/api/quest-pedagogy.js):
//   The browser test harness must verify all five exports in a real
//   browser, and `lib/api/` is server-only (not served by Vercel under
//   `public/`). Co-locating with the stall detector keeps a single source
//   of truth; lib/api/quest-pedagogy.js re-exports the two pedagogy-mode
//   symbols so server callers can import via the spec-mandated module.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Reasons a user message is classified as a stall. Treat as an enum —
 * compare with === STALL_REASONS.X, never against the string literal.
 */
export const STALL_REASONS = Object.freeze({
  EMPTY:         'EMPTY',
  EXPLICIT_IDK:  'EXPLICIT_IDK',
  TOO_SHORT:     'TOO_SHORT',
  GIBBERISH:     'GIBBERISH'
});

/**
 * Pedagogy modes the chat handler can be in for any given turn.
 *   SOCRATIC          — default questioning (current behaviour)
 *   SOCRATIC_REPHRASE — same intent, different phrasing (1 stall)
 *   DIRECT_TEACH      — pivot to direct teaching from the playbook cell (2 stalls)
 *   SCAFFOLD_DOWN     — drop a level: address the prerequisite from
 *                       cell.scaffolding_progression (3+ stalls)
 */
export const PEDAGOGY_MODES = Object.freeze({
  SOCRATIC:          'SOCRATIC',
  SOCRATIC_REPHRASE: 'SOCRATIC_REPHRASE',
  DIRECT_TEACH:      'DIRECT_TEACH',
  SCAFFOLD_DOWN:     'SCAFFOLD_DOWN'
});

// ── EXPLICIT_IDK regex set ─────────────────────────────────────────────
// Matched against the LOWERCASED, trimmed message. `^...$` anchored where
// the spec requires "standalone" usage to avoid false positives like
// "can't believe I got that right".
const IDK_PATTERNS = [
  /^i don'?t know\b/,
  /^idk\b/,
  /^dunno\b/,
  /^no idea\b/,
  /^not sure\b/,
  /^i('m| am) not sure\b/,
  /^cannot$/,
  /^cant$/,
  /^can'?t$/,
  /^(um+|uh+|er+|hmm+|eh+)\.?$/,
  /^\?+$/,
  /^\.+$/,
  /^help+$/
];

// Single-token "filler" affirmations that DO NOT count as a genuine
// answer attempt under TOO_SHORT. "yes" and "no" are intentionally
// excluded — they're real answers to yes/no questions.
const FILLER_TOKENS = new Set(['ok', 'okay', 'k', 'sure', 'yup', 'fine', 'alright']);

// Whitelist of valid 1–3-char short answers (per spec). GIBBERISH skips
// these. "yes/no/ok/k/sure/yeah/yup/nope" are all common chat answers.
const SHORT_VALID = new Set(['yes', 'no', 'ok', 'k', 'sure', 'yeah', 'yup', 'nope']);

/**
 * Tests if a 1–3 char string looks like a real English word. Used to
 * avoid false-positive GIBBERISH on common short words like "the".
 * Real English words almost always contain a vowel; non-vowel sequences
 * like "asd" / "qwe" / "x" are very likely random keystrokes.
 */
function looksLikeRealShortWord(s) {
  return /[aeiouy]/i.test(s);
}

function tokenize(s) {
  return s.match(/\S+/g) || [];
}

function lastAssistantContent(history) {
  if (!Array.isArray(history)) return '';
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] && history[i].role === 'assistant') {
      return String(history[i].content || '');
    }
  }
  return '';
}

/**
 * Classifies a single user message. Returns a result object regardless
 * of outcome; `stalled: false` indicates a genuine attempt.
 *
 * The `conversationHistory` parameter contains messages BEFORE the user
 * message under inspection. It does NOT include the message itself. The
 * caller pattern is: `detectStall(currentMsg, historyBeforeIt)`. This
 * convention keeps the function pure and is what consecutiveStalls uses
 * when it walks backwards through a transcript.
 *
 * @param {string} userMessage - the incoming user message text
 * @param {Array<{role:string,content:string,timestamp?:number}>} conversationHistory - messages BEFORE this one
 * @returns {{stalled: boolean, reason: string|null, confidence: 'high'|'medium'|'low'}}
 */
export function detectStall(userMessage, conversationHistory) {
  const raw = String(userMessage == null ? '' : userMessage);
  const trimmed = raw.trim();

  // ── EMPTY ──
  // Catches "", whitespace-only, and punctuation-only / emoji-only messages.
  // The presence of at least one alphanumeric character is the signal of
  // "any actual content"; without it, the message can't be a real attempt.
  if (trimmed.length === 0 || !/[a-z0-9]/i.test(trimmed)) {
    return { stalled: true, reason: STALL_REASONS.EMPTY, confidence: 'high' };
  }

  const lower = trimmed.toLowerCase();

  // ── EXPLICIT_IDK ──
  for (const re of IDK_PATTERNS) {
    if (re.test(lower)) {
      return { stalled: true, reason: STALL_REASONS.EXPLICIT_IDK, confidence: 'high' };
    }
  }

  // Compute fields used by both TOO_SHORT and GIBBERISH branches.
  const tokens = tokenize(trimmed);
  const wordCount = tokens.length;
  const hasQuestionMark = trimmed.includes('?');
  const prevAssistant = lastAssistantContent(conversationHistory).trim();
  const prevEndsWithQ = prevAssistant.length > 0 && /\?\s*$/.test(prevAssistant);

  // ── TOO_SHORT (context-dependent) ──
  // Fires only when the previous assistant turn ended with a question
  // mark. The student's reply is "too short" only relative to a question
  // that demands a substantive answer.
  if (wordCount <= 3 && !hasQuestionMark && prevEndsWithQ) {
    const isFiller = wordCount === 1 && FILLER_TOKENS.has(tokens[0].toLowerCase());
    const startsWithCapital = /^[A-Z]/.test(trimmed);
    // A "genuine attempt" satisfies any of:
    //   - has 2+ words (e.g., "the cat", "Wei Ming")
    //   - starts with a capital letter (proper noun like "Wei Ming")
    //   - is a single alphanumeric token that isn't in FILLER_TOKENS
    //     ("three", "plays", "yes", "no" → genuine; "ok", "sure" → not)
    const isGenuine =
      startsWithCapital ||
      wordCount > 1 ||
      (wordCount === 1 && /[a-z0-9]/i.test(tokens[0]) && !isFiller);

    if (!isGenuine) {
      return { stalled: true, reason: STALL_REASONS.TOO_SHORT, confidence: 'medium' };
    }
  }

  // ── GIBBERISH (low confidence) ──
  // 1–3 char strings that aren't in the valid-short-answer whitelist
  // AND don't contain a vowel (so "the" / "an" / "a" pass through but
  // "asd" / "xz" trip).
  if (trimmed.length >= 1 && trimmed.length <= 3 && !SHORT_VALID.has(lower)) {
    if (!looksLikeRealShortWord(trimmed)) {
      return { stalled: true, reason: STALL_REASONS.GIBBERISH, confidence: 'low' };
    }
  }

  return { stalled: false, reason: null, confidence: 'high' };
}

/**
 * Walks the history backwards and counts how many consecutive USER
 * messages (most recent first) were stalls. Assistant messages are
 * skipped — they neither break nor extend the streak. Returns 0 if the
 * most recent user message is not a stall (or if there are no user
 * messages at all).
 *
 * Each detectStall call sees the history BEFORE the user message under
 * inspection (so the prev-assistant-question-mark check works correctly
 * for every turn).
 *
 * @param {Array<{role:string,content:string,timestamp?:number}>} history - full conversation
 * @returns {number} non-negative integer
 */
export function consecutiveStalls(history) {
  if (!Array.isArray(history) || history.length === 0) return 0;
  let count = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (!msg || msg.role !== 'user') continue;     // skip assistant turns
    const before = history.slice(0, i);             // history BEFORE this user msg
    const result = detectStall(msg.content, before);
    if (result.stalled) {
      count += 1;
      continue;
    }
    break;                                          // first non-stall user msg breaks streak
  }
  return count;
}

/**
 * Picks a pedagogy mode based on the student's recent stall streak.
 * Decision table (per Sprint 2 spec):
 *
 *   stalls === 0         → SOCRATIC
 *   stalls === 1         → SOCRATIC_REPHRASE
 *   stalls === 2 + cell  → DIRECT_TEACH
 *   stalls === 2, no cell → SOCRATIC_REPHRASE  (can't teach without content)
 *   stalls >= 3 + cell.scaffolding_progression → SCAFFOLD_DOWN
 *   stalls >= 3 + cell (no scaffold)           → DIRECT_TEACH (re-teach)
 *   stalls >= 3, no cell                       → SOCRATIC_REPHRASE (last resort)
 *
 * @param {Array<{role:string,content:string,timestamp?:number}>} history - full conversation
 * @param {Object|null} contextCell - playbook cell (optional)
 * @returns {string} one of PEDAGOGY_MODES values
 */
export function selectPedagogyMode(history, contextCell) {
  const stalls = consecutiveStalls(history);
  if (stalls === 0) return PEDAGOGY_MODES.SOCRATIC;
  if (stalls === 1) return PEDAGOGY_MODES.SOCRATIC_REPHRASE;
  if (stalls === 2) {
    return contextCell ? PEDAGOGY_MODES.DIRECT_TEACH : PEDAGOGY_MODES.SOCRATIC_REPHRASE;
  }
  // stalls >= 3
  if (contextCell && contextCell.scaffolding_progression) {
    return PEDAGOGY_MODES.SCAFFOLD_DOWN;
  }
  if (contextCell) return PEDAGOGY_MODES.DIRECT_TEACH;
  return PEDAGOGY_MODES.SOCRATIC_REPHRASE;
}
