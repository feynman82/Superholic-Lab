/**
 * Real misconceptions from question_bank.wrong_explanations.
 * These are live, in-production wrong-answer explanations from the curated bank.
 * Verified 2026-05-02 against the Supabase question_bank.
 *
 * The pipeline animation cycles through these as "data packets" moving through
 * the engine. Each packet carries one of these as its label.
 */

export interface TelemetryEvent {
  subject: 'Mathematics' | 'Science' | 'English';
  level: string;
  topic: string;
  // Plain-English misconception (≤90 chars for visual fit).
  label: string;
}

export const liveTelemetry: TelemetryEvent[] = [
  {
    subject: 'Mathematics',
    level: 'P1',
    topic: 'Money',
    label: 'Counted the number of coins instead of their values.',
  },
  {
    subject: 'Science',
    level: 'P5',
    topic: 'Cycles',
    label: 'Confused fertilisation with pollination.',
  },
  {
    subject: 'English',
    level: 'P4',
    topic: 'Grammar',
    label: "'Gave away' confused with 'gave in'.",
  },
  {
    subject: 'Science',
    level: 'P5',
    topic: 'Systems',
    label: 'Mistook parallel branches for series circuit.',
  },
  {
    subject: 'Mathematics',
    level: 'P1',
    topic: 'Length and Mass',
    label: 'Added two lengths instead of finding the difference.',
  },
  {
    subject: 'English',
    level: 'P4',
    topic: 'Grammar',
    label: "Used 'were' for a singular near-subject in a 'neither/nor' clause.",
  },
];
