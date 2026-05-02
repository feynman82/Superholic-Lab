/**
 * Sample MCQ shown on the marketing page.
 * SWAP THIS FILE TO CHANGE THE QUESTION — no other code touches it.
 *
 * Schema mirrors a subset of the production question schema (Master_Question_Template.md):
 *   - id, level, topic, subTopic for context
 *   - stem
 *   - options: array of 4 with text + correct flag + (optional) misconception
 */

export interface SampleOption {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
  correct: boolean;
  misconception?: string;
}

export interface SampleQuestion {
  id: string;
  level: string;
  topic: string;
  subTopic: string;
  stem: string;
  options: SampleOption[];
  workedExplanation: string;
}

export const sampleQuestion: SampleQuestion = {
  id: 'demo-p5-ratio-001',
  level: 'P5',
  topic: 'Ratio',
  subTopic: 'Part-to-whole',
  stem: 'A box contains red and blue marbles in the ratio 2 : 3. There are 30 marbles in total. How many red marbles are there?',
  options: [
    {
      letter: 'A',
      text: '10',
      correct: false,
      misconception:
        'Misconception: Treated 2 as the answer instead of as parts of the whole. The 2 represents 2 out of 5 equal parts, not 2 marbles.',
    },
    {
      letter: 'B',
      text: '12',
      correct: true,
    },
    {
      letter: 'C',
      text: '15',
      correct: false,
      misconception:
        'Misconception: Divided 30 by 2 instead of by the total number of parts (2 + 3 = 5).',
    },
    {
      letter: 'D',
      text: '18',
      correct: false,
      misconception:
        'Misconception: Found the blue marbles instead of the red. 18 is 3 parts out of 5 (the blue), not 2 parts (the red).',
    },
  ],
  workedExplanation:
    'Total parts = 2 + 3 = 5. Each part = 30 ÷ 5 = 6 marbles. Red = 2 parts × 6 = 12 marbles.',
};
