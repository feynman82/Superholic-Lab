/**
 * Sample cloze question shown on §4 (Pillar 03).
 * SWAP THIS FILE TO CHANGE THE QUESTION — no other code touches it.
 */

export interface ClozeOption {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
  correct: boolean;
  misconception?: string;
}

export interface SampleCloze {
  id: string;
  level: string;
  topic: string;
  subTopic: string;
  /** Sentence with the blank marked as "{BLANK}". */
  stem: string;
  options: ClozeOption[];
  workedExplanation: string;
}

export const sampleCloze: SampleCloze = {
  id: 'demo-p5-cloze-001',
  level: 'P5',
  topic: 'Cloze',
  subTopic: 'Vocabulary Cloze With Dropdowns',
  stem: 'By the time the children {BLANK} their dinner, the rain had already stopped.',
  options: [
    {
      letter: 'A',
      text: 'finish',
      correct: false,
      misconception: 'Wrong tense. The action of finishing happened before another past event ("had already stopped"), so a past form is needed — not the present tense.',
    },
    {
      letter: 'B',
      text: 'had finished',
      correct: true,
    },
    {
      letter: 'C',
      text: 'finished',
      correct: false,
      misconception: 'Close, but the structure "By the time..." pairs with the past perfect tense (had + past participle) when the rain had already stopped — both events are past, but one happened before the other.',
    },
    {
      letter: 'D',
      text: 'were finishing',
      correct: false,
      misconception: 'Past continuous shows ongoing action. But "By the time" signals one action completing before another — completion, not ongoing.',
    },
  ],
  workedExplanation:
    'The clue is "had already stopped" — past perfect tense. To match the time sequence, the verb in the clause beginning with "By the time the children..." must also be past perfect: "had finished".',
};
