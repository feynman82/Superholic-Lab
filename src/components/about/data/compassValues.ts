export interface CompassValue {
  num: string;
  promise: string;
  meaning: string;
  example: string;
}

export const compassValues: CompassValue[] = [
  {
    num: '01',
    promise: 'Honest signal over flattering numbers.',
    meaning:
      'No participation trophies, no inflated mastery scores. AL band reflects what your child actually knows.',
    example:
      'When a child gets 8/10, the dashboard shows AL5 with the two specific sub-topics that need work — not a celebration banner.',
  },
  {
    num: '02',
    promise: 'Why before what.',
    meaning:
      'Every wrong answer earns a misconception explanation. The pattern matters more than the score.',
    example:
      'Every option in every MCQ has its own dedicated explanation tracing the exact reasoning error.',
  },
  {
    num: '03',
    promise: 'Built for parents, not just for kids.',
    meaning:
      'This is a tool you use with your child. The dashboard speaks to you in plain English.',
    example:
      'Weekly parent summary: which sub-topics improved, which need review, which conversations Wena had.',
  },
  {
    num: '04',
    promise: 'Singapore-canon or nothing.',
    meaning:
      'MOE syllabus is the source of truth. Not generic exam prep. Not international curricula.',
    example:
      'Every topic and sub-topic verified against MOE 2021 (Maths), 2023 (Science), 2020 (English) syllabuses.',
  },
  {
    num: '05',
    promise: 'AI bounded by pedagogy.',
    meaning:
      'Miss Wena cannot improvise outside her playbook. Safety and consistency over creativity.',
    example:
      "When a child asks 'what is 2+2', Wena uses the response from a curated cell — never a free-form generation.",
  },
  {
    num: '06',
    promise: 'Privacy as default.',
    meaning:
      'PDPA-compliant. Singapore servers. No data sold, ever.',
    example:
      'Question attempt data lives in a Singapore-region Supabase project. We do not export, sell, or share it.',
  },
];
