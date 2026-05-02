// ─────────────────────────────────────────────────────────────────────────
// /js/wena-canon-helpers.js — browser-side picker canon helpers v1.0 (Sprint 8c)
// ─────────────────────────────────────────────────────────────────────────
// Pure functions, no DOM, no fetch. Drives the free-chat picker on bare
// tutor.html so the founder (and eventually students) can navigate to any
// (subject, level, topic, sub_topic) cell deliberately for Wena RAP retrieval.
//
// Canon source: ./syllabus.js (existing browser module). Mathematics shows
// "Coming soon" in the picker because the playbook only ships English (147)
// + Science (33) cells today; Maths cells launch in Phase 3.
// ─────────────────────────────────────────────────────────────────────────

import { CANONICAL_SYLLABUS, LEVEL_TOPICS } from './syllabus.js';

// LEVEL_TOPICS keys are formatted "primary-N:subject" (subject lowercase).
// Student level usually arrives as "Primary N" — convert.
function _normaliseLevelToSlug(level) {
  if (typeof level !== 'string') return '';
  return level.toLowerCase().replace(/^primary\s*/i, 'primary-').replace(/\s+/g, '-');
}

function _subjectKey(subject) {
  if (typeof subject !== 'string') return '';
  return subject.toLowerCase();
}

// Levels at which Science cells exist (Sprint 6 authoring scope: P3–P6).
// Hardcoded so the picker doesn't need to await loadPlaybook(); kept in
// sync with LEVEL_TOPICS — empty entries for P1/P2 Science.
const SCIENCE_AVAILABLE_LEVELS = new Set(['Primary 3', 'Primary 4', 'Primary 5', 'Primary 6']);

/**
 * Returns the 3 subject options shown in the picker's first step.
 * Mathematics is always picker-visible but always disabled (cells launch
 * in Phase 3). Science is enabled at P3-P6, disabled at P1/P2.
 *
 * @param {string} [studentLevel] - "Primary N"; defaults to "Primary 3"
 * @returns {Array<{key:string,label:string,iconEmoji:string,isAvailable:boolean,unavailableReason?:string}>}
 */
export function getSubjectsForPicker(studentLevel = 'Primary 3') {
  const lvl = studentLevel || 'Primary 3';
  const sciAvailable = SCIENCE_AVAILABLE_LEVELS.has(lvl);

  return [
    {
      key: 'English',
      label: 'English',
      iconEmoji: '📖',
      isAvailable: true
    },
    {
      key: 'Science',
      label: 'Science',
      iconEmoji: '🔬',
      isAvailable: sciAvailable,
      unavailableReason: sciAvailable
        ? undefined
        : `Science cells coming soon for ${lvl}`
    },
    {
      key: 'Mathematics',
      label: 'Mathematics',
      iconEmoji: '🔢',
      isAvailable: false,
      unavailableReason: 'Coming soon — Maths cells launching in Phase 3 of our roadmap'
    }
  ];
}

/**
 * Returns the topics available for (subject, level) using LEVEL_TOPICS as
 * the gate. Each entry includes sub-topic count for the picker hint and a
 * `hasPlaybookCells` flag that the picker uses to disable thin coverage.
 *
 * For Mathematics, hasPlaybookCells is always false (no Maths cells exist).
 * For English/Science, hasPlaybookCells is true when the topic is in canon
 * AND the level permits the topic — same gate the loader applies.
 *
 * @param {string} subject - "English" | "Science" | "Mathematics"
 * @param {string} level - "Primary N"
 * @returns {Array<{topic:string, subTopicCount:number, hasPlaybookCells:boolean}>}
 */
export function getTopicsForSubjectLevel(subject, level) {
  const subjKey = _subjectKey(subject);
  const slug = _normaliseLevelToSlug(level);
  const topics = LEVEL_TOPICS[`${slug}:${subjKey}`] || [];
  const canon = CANONICAL_SYLLABUS[subjKey] || {};
  const isMaths = subjKey === 'mathematics';

  return topics.map(topic => {
    const subs = canon[topic] || [];
    return {
      topic,
      subTopicCount: subs.length,
      // Maths topics show in picker (UI ready) but are click-disabled —
      // no cells exist yet. Sprint 9+ will populate.
      hasPlaybookCells: !isMaths && subs.length > 0
    };
  });
}

/**
 * Returns canon sub_topic strings for the given (subject, level, topic).
 * Used to populate the picker's third step. Strings are returned exact-case
 * (e.g., "Subject-Verb Agreement") to match playbook canon for retrieval.
 *
 * @param {string} subject
 * @param {string} level    - included for symmetry; CANONICAL_SYLLABUS is
 *                            level-agnostic at sub_topic level (LEVEL_TOPICS
 *                            already gated upstream).
 * @param {string} topic
 * @returns {string[]}
 */
// eslint-disable-next-line no-unused-vars
export function getSubTopicsForTopic(subject, level, topic) {
  const subjKey = _subjectKey(subject);
  const canon = CANONICAL_SYLLABUS[subjKey] || {};
  return canon[topic] ? canon[topic].slice() : [];
}

/**
 * Confirms the (subject, level, topic, sub_topic) tuple is a valid picker
 * selection — i.e., topic is in LEVEL_TOPICS for that level AND sub_topic
 * is in canon for that topic. Used to enable/disable "Start chat" buttons.
 *
 * sub_topic may be null/undefined; that's valid (skip → topic-level fallback).
 *
 * @param {string} subject
 * @param {string} level
 * @param {string} topic
 * @param {string|null} sub_topic
 * @returns {boolean}
 */
export function isPickerSelectionValid(subject, level, topic, sub_topic) {
  if (!subject || !level || !topic) return false;
  const subjKey = _subjectKey(subject);
  const slug = _normaliseLevelToSlug(level);
  const allowedTopics = LEVEL_TOPICS[`${slug}:${subjKey}`] || [];
  if (!allowedTopics.includes(topic)) return false;
  if (!sub_topic) return true;  // skip-sub_topic path is valid
  const canonSubs = (CANONICAL_SYLLABUS[subjKey] || {})[topic] || [];
  return canonSubs.includes(sub_topic);
}
