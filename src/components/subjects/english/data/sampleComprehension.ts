/**
 * Sample comprehension inference question shown on §6.
 * SWAP TO CHANGE — keyword grading uses claimKeywords + reasonKeywords.
 *
 * IMAGE: drop a generated illustration at imageUrl below to show it above
 * the passage. Component renders text-only when imageUrl is empty.
 */

export interface SampleComprehension {
  id: string;
  level: string;
  topic: string;
  subTopic: string;
  marks: number;
  /** Optional illustration above the passage. Empty = text-only. */
  imageUrl: string;
  imageAlt: string;
  /** Passage shown to the learner. Newlines = paragraph breaks. */
  passage: string;
  stem: string;
  /** Required: answer must reference the passage's clue text. */
  claimKeywords: string[];
  /** Required: answer must make the inferential leap. */
  reasonKeywords: string[];
  modelAnswer: string;
  wenaCoachLine: string;
}

export const sampleComprehension: SampleComprehension = {
  id: 'demo-p5-comprehension-001',
  level: 'P5',
  topic: 'Comprehension',
  subTopic: 'Visual Text · Deep Inference And Claim Evidence Reasoning',
  marks: 2,
  imageUrl: '/assets/images/aiden-playground.png',
  imageAlt:
    'A boy of about 10 in a navy-blue Singapore primary school uniform stands at the edge of a playground, gripping the strap of his backpack tightly and looking down at his bright white sneakers. In the soft-focus background, other children play on colourful playground equipment.',
  passage:
    "Aiden stood at the edge of the playground, his fingers gripping the strap of his school bag tightly. The other children were laughing, their voices rising and falling like the chirping of birds.\n\nAiden took a small step forward, then stopped. He looked down at his shoes. They were brand new — the white parts still bright, the laces still stiff and straight.\n\n\"You can do it,\" his sister had whispered as she dropped him off that morning. But now her voice felt very far away.",
  stem: 'How do you think Aiden was feeling at the playground? Use evidence from the passage and the picture to support your answer.',
  claimKeywords: ['nervous', 'anxious', 'scared', 'shy', 'afraid', 'unsure', 'hesitant', 'worried', 'lonely', 'sad'],
  reasonKeywords: ['gripping', 'strap', 'tight', 'stop', 'looked down', 'shoes', 'far away', 'small step', 'edge', 'new'],
  modelAnswer:
    "Aiden was feeling nervous and unsure. The passage describes him 'gripping the strap of his school bag tightly' and shows that he took a small step forward and then stopped, looking down at his shoes. His sister's encouraging voice felt 'very far away,' which suggests he was struggling to feel confident enough to join the other children.",
  wenaCoachLine:
    "You named the feeling — that's the first mark. For the second mark, you must point to specific evidence from the passage or the picture. Quote or describe the gripping, the stopping, or the 'far away' detail.",
};
