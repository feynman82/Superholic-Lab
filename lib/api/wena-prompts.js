// ─────────────────────────────────────────────────────────────────────────
// lib/api/wena-prompts.js — server-side re-export shim
// ─────────────────────────────────────────────────────────────────────────
// The canonical source lives at public/js/wena-prompts.js so the browser
// test harness (public/tests/wena-prompts.test.html) can import the same
// pure module the server imports — single source of truth, no drift.
// Server callers (handlers.js) reach the templates via this shim so they
// never need to cross the public/ boundary in their own import paths.
// ─────────────────────────────────────────────────────────────────────────

export {
  buildWenaSystemPrompt,
  PROMPT_VERSION,
  MODE_TEMPLATES
} from '../../public/js/wena-prompts.js';
