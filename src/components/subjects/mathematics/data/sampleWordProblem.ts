/**
 * Sample word_problem shown on Mathematics marketing page §6.
 * SWAP THIS FILE TO CHANGE THE QUESTION — no other code touches it.
 */

export interface SampleWordProblem {
  id: string;
  level: string;
  topic: string;
  marks: number;
  stem: string;
  placeholder: string;
  unit: string;
  correctAnswer: string;
  workedSteps: string[];
  misconception?: string;
}

export const sampleWordProblem: SampleWordProblem = {
  id: 'demo-p5-percentage-001',
  level: 'P5',
  topic: 'Percentage',
  marks: 4,
  stem: 'Aisha bought a bag at a 20% discount and paid $96 for it. What was the original price of the bag, before the discount?',
  placeholder: 'e.g. 120',
  unit: '$',
  correctAnswer: '120',
  workedSteps: [
    '20% discount means Aisha paid 80% of the original price.',
    '80% of the original price = $96.',
    '1% of the original price = $96 ÷ 80 = $1.20.',
    '100% of the original price = $1.20 × 100 = $120.',
  ],
  misconception:
    'A common mistake is to add 20% back to $96 (giving $115.20). But $96 is 80% of the original — you must divide by 0.8, not multiply by 1.2.',
};
