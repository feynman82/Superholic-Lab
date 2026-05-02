// Flat marketing summary of the MOE 2020 English Primary syllabus.
// Only Cloze and Comprehension expose their sub-formats — the other four
// are practised throughout the bank without a meaningful sub-format split.
// Last-synced: 2026-05-03.

export interface EngTopic {
  topic: string;
  intro: string;
  subTopics: string[];
}

export const englishTopics: EngTopic[] = [
  {
    topic: 'Grammar',
    intro: 'P1 onwards',
    subTopics: [],
  },
  {
    topic: 'Vocabulary',
    intro: 'P1 onwards',
    subTopics: [],
  },
  {
    topic: 'Cloze',
    intro: 'P1 onwards',
    subTopics: [
      'Grammar Cloze With Word Bank',
      'Vocabulary Cloze With Dropdowns',
      'Comprehension Free-Text Cloze',
    ],
  },
  {
    topic: 'Editing',
    intro: 'Introduced P3',
    subTopics: [],
  },
  {
    topic: 'Comprehension',
    intro: 'P1 onwards',
    subTopics: [
      'Passage Comprehension',
      'Visual Text Comprehension',
    ],
  },
  {
    topic: 'Synthesis',
    intro: 'Introduced P4',
    subTopics: [],
  },
];
