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
 *   CHECK_RESPONSE    — student is answering a check question after DIRECT_TEACH
 *                       (Sprint 3; cross-turn detection in handlers.js)
 *
 *   Sprint 7 — Science CER probe modes (no stall, decompose CER):
 *   CER_PROBE_CLAIM      — student hasn't given a claim yet
 *   CER_PROBE_EVIDENCE   — student gave claim, ask for evidence
 *   CER_PROBE_REASONING  — student gave claim+evidence, ask for the science rule
 */
export const PEDAGOGY_MODES = Object.freeze({
  SOCRATIC:            'SOCRATIC',
  SOCRATIC_REPHRASE:   'SOCRATIC_REPHRASE',
  DIRECT_TEACH:        'DIRECT_TEACH',
  SCAFFOLD_DOWN:       'SCAFFOLD_DOWN',
  CHECK_RESPONSE:      'CHECK_RESPONSE',
  CER_PROBE_CLAIM:     'CER_PROBE_CLAIM',
  CER_PROBE_EVIDENCE:  'CER_PROBE_EVIDENCE',
  CER_PROBE_REASONING: 'CER_PROBE_REASONING'
});

// ─── Sprint 7: CER completeness detection (Science) ─────────────────────
// Heuristic, deterministic. Splits the user message by sentence boundary and
// scans for connectives that signal Evidence vs Reasoning. Singlish particles
// (lah / leh / lor / etc.) are stripped before parsing so they don't poison
// the tokeniser. Telemetry in Sprint 8 will measure precision/recall in
// production traffic — the heuristic intentionally errs lenient.

const EVIDENCE_CONNECTIVES = [
  'because', 'since',
  'i saw', 'i observed', 'i can see',
  'the diagram shows', 'from the picture', 'the picture shows',
  'it shows', 'you can see',
  'got '          // Singlish "got [noun]" = "has [noun]"
];
const REASONING_CONNECTIVES = [
  'this means', 'this is because', 'the rule is',
  'scientifically', 'this happens because', 'according to'
];
// Word/phrase patterns that signal a generalised principle (rule-like reasoning).
const REASONING_GENERALS = [' all ', 'always', ' every ', 'rule', 'principle'];
const SINGLISH_PARTICLES_RX = /\b(lah|leh|lor|hor|liao|sia|meh|ah|wah|eh)\b/gi;

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
 * Detects how much of a CER triple a student has produced in their last
 * message. Used by the Science branch of selectPedagogyMode to decide
 * whether to probe for Claim, Evidence, or Reasoning.
 *
 * Heuristic — NOT LLM-based. Decision logic:
 *   - empty / stall pattern (idk, hmm, etc.) → 'none'
 *   - first sentence starts with an evidence connective ("because…")
 *     and there's no preceding claim → 'claim_only' (treat as fragment
 *     with implicit topic claim)
 *   - any evidence-connective + any reasoning-connective/general → 'complete'
 *   - sentCount ≥ 3 + reasoning-connective/general → 'complete'
 *     (presume middle sentences carry the observation/evidence)
 *   - evidence-connective only → 'claim_evidence'
 *   - reasoning-connective only → 'claim_evidence' (lenient — treats
 *     the rule statement as subsuming an implicit observation)
 *   - otherwise → 'claim_only'
 *
 * Singlish particles (lah/leh/lor/hor/liao/sia/meh/ah/wah/eh) are stripped
 * before parsing. "got [noun]" is recognised as Singlish for "has [noun]"
 * and counted as evidence.
 *
 * Limitations:
 *   - Bare single-token answers ("frog") classify as claim_only.
 *   - Rule words ("all", "rule", "principle") embedded in evidence-only
 *     sentences may falsely upgrade the result. Telemetry will measure.
 *   - Multi-paragraph answers with intermixed CER components hit the
 *     sentCount≥3+reasoning fallback path.
 *
 * @param {string} userMessage
 * @returns {'none'|'claim_only'|'claim_evidence'|'complete'}
 */
export function detectCerCompleteness(userMessage) {
  const trimmed = String(userMessage == null ? '' : userMessage).trim();
  if (trimmed.length === 0) return 'none';
  // Punctuation-only or no alphanumerics → not a real attempt.
  if (!/[a-z0-9]/i.test(trimmed)) return 'none';

  const lowerRaw = trimmed.toLowerCase();
  // Stall pattern — same family as detectStall's IDK list.
  if (/^(idk|dunno|hmm+|um+|uh+|er+|eh+|i don'?t know|no idea|not sure|cannot|can'?t)\b/.test(lowerRaw)) {
    return 'none';
  }

  // Strip Singlish particles for connective scanning.
  const lower = lowerRaw.replace(SINGLISH_PARTICLES_RX, '').replace(/\s+/g, ' ').trim();

  const sents = trimmed.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const sentCount = sents.length;

  // Fragment guard: if the FIRST sentence starts with an evidence connective
  // ("because of heat") there's no preceding claim sentence — treat as
  // claim-less fragment.
  const firstSentLower = (sents[0] || '').toLowerCase();
  const startsWithEvidenceConnective = EVIDENCE_CONNECTIVES.some(c =>
    firstSentLower === c.trim() || firstSentLower.startsWith(c)
  );
  if (startsWithEvidenceConnective) {
    // Document choice: fragment counts as claim_only (substantive content
    // exists, but structurally missing the claim sentence).
    return 'claim_only';
  }

  const hasEvidenceConnective  = EVIDENCE_CONNECTIVES.some(c => lower.includes(c));
  const hasReasoningConnective = REASONING_CONNECTIVES.some(c => lower.includes(c));
  const hasReasoningGeneral    = REASONING_GENERALS.some(c => lower.includes(c));
  const hasReasoning           = hasReasoningConnective || hasReasoningGeneral;

  if (hasEvidenceConnective && hasReasoning) return 'complete';
  if (sentCount >= 3 && hasReasoning)        return 'complete';
  if (hasEvidenceConnective)                 return 'claim_evidence';
  if (hasReasoning)                          return 'claim_evidence';
  return 'claim_only';
}

/**
 * Picks a pedagogy mode based on the student's recent stall streak and,
 * for Science, on which CER components their last reply contained.
 *
 * English flow (Sprint 8b — AGGRESSIVE DIRECT_TEACH):
 *   stalls === 0          → SOCRATIC
 *   stalls ≥ 1 + cell     → DIRECT_TEACH (skip rephrase; teach immediately)
 *   stalls ≥ 2 + scaffold → SCAFFOLD_DOWN
 *   no cell fallback      → SOCRATIC_REPHRASE (only when cell is null)
 *
 *   Rationale: SOCRATIC_REPHRASE adds a turn that often doesn't help younger
 *   kids who lack the metacognitive vocabulary to articulate their confusion.
 *   The playbook teaching scripts are MOE-aligned, Singapore-context, and
 *   age-appropriate — strictly more useful than asking the kid to re-explain.
 *   Skip rephrasing; teach. SCAFFOLD_DOWN now triggers at 2 stalls (down from
 *   3 in Sprint 2) to preserve the 1-step-down ratio with the new threshold.
 *
 * Science flow (Sprint 7 — gentler, CER probing first):
 *   stalls ≥ 1 path: SOCRATIC_REPHRASE → DIRECT_TEACH at 2 → SCAFFOLD_DOWN at 3.
 *   stalls === 0 path: decompose CER from last user message:
 *     cer === 'none'           → CER_PROBE_CLAIM
 *     cer === 'claim_only'     → CER_PROBE_EVIDENCE
 *     cer === 'claim_evidence' → CER_PROBE_REASONING
 *     cer === 'complete'       → SOCRATIC (affirm + extend)
 *
 *   Asymmetry rationale: CER probing already provides gentler scaffolding
 *   for Science engaged students; the rephrase tier is redundant. For stalls,
 *   keep the 2-stall threshold so kids get one rephrase chance before pivot.
 *
 * @param {Array<{role:string,content:string}>} history
 * @param {object|null} contextCell - cell with optional `subject` field
 *                                     (defaults to 'English' if absent)
 * @param {object} [options]        - reserved for future use
 * @returns {string} one of PEDAGOGY_MODES values
 */
export function selectPedagogyMode(history, contextCell, options = {}) {
  const stalls = consecutiveStalls(history);
  const subject = contextCell?.subject || 'English';

  // English flow (Sprint 8b — aggressive DIRECT_TEACH after 1 stall).
  if (subject !== 'Science') {
    if (stalls === 0) return PEDAGOGY_MODES.SOCRATIC;
    // 2+ stalls AND we have a scaffold-progression hint → drop a level first.
    if (stalls >= 2 && contextCell && contextCell.scaffolding_progression) {
      return PEDAGOGY_MODES.SCAFFOLD_DOWN;
    }
    // 1+ stalls AND we have a cell → teach.
    if (stalls >= 1 && contextCell) return PEDAGOGY_MODES.DIRECT_TEACH;
    // Fallback when no cell is available — ask again concretely.
    return PEDAGOGY_MODES.SOCRATIC_REPHRASE;
  }

  // Science flow (Sprint 7).
  if (stalls >= 1) {
    if (stalls === 1) return PEDAGOGY_MODES.SOCRATIC_REPHRASE;
    if (stalls === 2) {
      return contextCell ? PEDAGOGY_MODES.DIRECT_TEACH : PEDAGOGY_MODES.SOCRATIC_REPHRASE;
    }
    if (contextCell && contextCell.scaffolding_progression) return PEDAGOGY_MODES.SCAFFOLD_DOWN;
    if (contextCell) return PEDAGOGY_MODES.DIRECT_TEACH;
    return PEDAGOGY_MODES.SOCRATIC_REPHRASE;
  }

  // No stall — decompose CER from the student's last user message.
  const lastUserMsg = [...(history || [])].reverse().find(m => m && m.role === 'user')?.content || '';
  const cer = detectCerCompleteness(lastUserMsg);
  if (cer === 'none')           return PEDAGOGY_MODES.CER_PROBE_CLAIM;
  if (cer === 'claim_only')     return PEDAGOGY_MODES.CER_PROBE_EVIDENCE;
  if (cer === 'claim_evidence') return PEDAGOGY_MODES.CER_PROBE_REASONING;
  return PEDAGOGY_MODES.SOCRATIC;   // 'complete' — affirm + extend
}
