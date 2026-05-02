/**
 * Swappable Science open-ended question shown on §6.
 *
 * RUBRIC LOGIC:
 *   - claimKeywords / reasonKeywords matched (case-insensitive, substring)
 *     against learner's typed answer.
 *   - claim mark = at least one claim keyword present
 *   - reason mark = at least one reason keyword present
 *   - Both → 2/2; only claim → 1/2; neither → 0/2.
 */

export interface SampleOpenEnded {
  id: string;
  level: string;
  topic: string;
  marks: number;
  stem: string;
  setup: string;
  expectedClaim: string;
  expectedReason: string;
  modelAnswer: string;
  claimKeywords: string[];
  reasonKeywords: string[];
  wenaCoachLine: string;
}

export const sampleOpenEnded: SampleOpenEnded = {
  id: 'demo-p5-photosynthesis-001',
  level: 'P5',
  topic: 'Systems · Photosynthesis',
  marks: 2,
  setup:
    'Aisha placed Plant A on a sunny windowsill and Plant B inside a dark cupboard. She watered both equally. After 5 days, Plant A grew to 24 cm with bright green leaves. Plant B grew to only 15 cm and its leaves had yellowed.',
  stem:
    'Why did Plant A grow taller and stay green, while Plant B grew less and turned yellow? Use the ideas of photosynthesis in your answer.',
  expectedClaim: 'Plant A received sunlight, but Plant B did not.',
  expectedReason:
    'Plants need sunlight for photosynthesis to make food (glucose). Without sunlight, Plant B could not photosynthesise, so it could not make enough food to grow tall or to produce chlorophyll, which gave it the yellow leaves.',
  modelAnswer:
    'Plant A grew taller and stayed green because it received sunlight, while Plant B was kept in the dark. Plants need sunlight to carry out photosynthesis, the process by which they make their own food (glucose). Without sunlight, Plant B could not photosynthesise, so it could not make enough food to grow tall. The lack of sunlight also meant Plant B could not produce chlorophyll, so its leaves yellowed.',
  claimKeywords: ['sunlight', 'sun', 'light', 'dark', 'cupboard'],
  reasonKeywords: ['photosynthesis', 'food', 'glucose', 'energy', 'chlorophyll'],
  wenaCoachLine:
    "Strong claim. Now make sure you also explain WHY — examiners want the reason: 'plants need sunlight for photosynthesis to make food'. That's the second mark.",
};
