// MIRROR of /public/js/syllabus.js LEVEL_TOPICS v5.0 (2026-05-01).
// If canon updates, regenerate this file. Last-synced: 2026-05-02.

export interface SyllabusLevel {
  level: string;
  badge: string;
  callout: string;
  topics: string[];
}

export const syllabus: SyllabusLevel[] = [
  {
    level: 'P1',
    badge: 'Foundation Year',
    callout: 'No formal WA. Builds the number sense everything later depends on.',
    topics: [
      'Whole Numbers',
      'Addition and Subtraction',
      'Multiplication and Division',
      'Multiplication Tables',
      'Money',
      'Length and Mass',
      'Time',
      'Shapes and Patterns',
      'Data Analysis',
    ],
  },
  {
    level: 'P2',
    badge: 'Times Tables',
    callout: 'Times tables ×2, ×3, ×4, ×5, ×10 are the must-master.',
    topics: [
      'Whole Numbers',
      'Addition and Subtraction',
      'Multiplication Tables',
      'Multiplication and Division',
      'Fractions',
      'Money',
      'Length and Mass',
      'Volume of Liquid',
      'Time',
      'Shapes and Patterns',
      'Data Analysis',
    ],
  },
  {
    level: 'P3',
    badge: 'WA Begins',
    callout: 'Formal assessment starts. Bar model method becomes essential.',
    topics: [
      'Whole Numbers',
      'Addition and Subtraction',
      'Multiplication Tables',
      'Multiplication and Division',
      'Fractions',
      'Money',
      'Length and Mass',
      'Volume of Liquid',
      'Time',
      'Angles',
      'Geometry',
      'Area and Perimeter',
      'Data Analysis',
    ],
  },
  {
    level: 'P4',
    badge: 'Critical Plateau',
    callout: 'Where many children stall. Factors, mixed-number fractions, and decimals arrive together.',
    topics: [
      'Whole Numbers',
      'Multiplication and Division',
      'Factors and Multiples',
      'Fractions',
      'Decimals',
      'Money',
      'Time',
      'Angles',
      'Geometry',
      'Symmetry',
      'Area and Perimeter',
      'Data Analysis',
      'Pie Charts',
    ],
  },
  {
    level: 'P5',
    badge: 'Most Content-Dense',
    callout: 'Ratio, percentage, and complex fractions arrive. Recovery is hard if behind.',
    topics: [
      'Whole Numbers',
      'Fractions',
      'Decimals',
      'Money',
      'Length and Mass',
      'Volume of Liquid',
      'Percentage',
      'Rate',
      'Average',
      'Area of Triangle',
      'Volume',
      'Angles',
      'Geometry',
    ],
  },
  {
    level: 'P6',
    badge: 'PSLE Year',
    callout: 'Algebra and Circles arrive. Paper 2 problems can pull from any P3–P6 topic.',
    topics: [
      'Fractions',
      'Percentage',
      'Ratio',
      'Algebra',
      'Average',
      'Circles',
      'Volume',
      'Geometry',
      'Angles',
      'Pie Charts',
    ],
  },
];
