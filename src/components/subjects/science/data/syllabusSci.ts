// MIRROR of /public/js/syllabus.js LEVEL_TOPICS + CANONICAL_SYLLABUS.science v5.0.
// Last-synced: 2026-05-02. Regenerate if canon updates.

export interface SyllabusTopic {
  topic: string;
  subTopics: string[];
}

export interface SyllabusLevelSci {
  level: string;
  badge: string;
  callout: string;
  topics: SyllabusTopic[];
}

const subTopicsByTopic: Record<string, string[]> = {
  Diversity: [
    'General Characteristics Of Living And Non-Living Things',
    'Classification Of Living And Non-Living Things',
    'Diversity Of Materials And Their Properties',
  ],
  Matter: [
    'States Of Matter',
    'Properties Of Solids, Liquids And Gases',
    'Changes In State Of Matter',
  ],
  Cycles: [
    'Life Cycles Of Insects',
    'Life Cycles Of Amphibians',
    'Life Cycles Of Flowering Plants',
    'Reproduction In Plants And Animals',
    'Stages Of The Water Cycle',
  ],
  Systems: [
    'Plant Parts And Functions',
    'Human Digestive System',
    'Plant Respiratory And Circulatory Systems',
    'Human Respiratory And Circulatory Systems',
    'Electrical Systems And Circuits',
  ],
  Energy: [
    'Sources Of Light',
    'Reflection Of Light',
    'Formation Of Shadows',
    'Transparent, Translucent And Opaque Materials',
    'Sources Of Heat',
    'Effects Of Heat Gain And Heat Loss',
    'Temperature And Use Of Thermometers',
    'Good And Poor Conductors Of Heat',
    'Photosynthesis And Energy Pathways',
    'Energy Conversion In Everyday Objects',
  ],
  Interactions: [
    'Interaction Of Magnetic Forces',
    'Frictional Force',
    'Gravitational Force',
    'Elastic Spring Force',
    'Effects Of Forces On Objects',
    'Interactions Within The Environment',
    'Food Chains And Food Webs',
  ],
};

const buildLevel = (level: string, badge: string, callout: string, topicNames: string[]): SyllabusLevelSci => ({
  level,
  badge,
  callout,
  topics: topicNames.map((t) => ({ topic: t, subTopics: subTopicsByTopic[t] || [] })),
});

export const syllabusSci: SyllabusLevelSci[] = [
  buildLevel(
    'P3', 'Science Begins',
    'First exposure to formal Science. Curiosity-led — the right disposition matters more than facts.',
    ['Diversity', 'Cycles', 'Interactions']
  ),
  buildLevel(
    'P4', 'Systems Introduced',
    'Plant parts, human digestion, energy. The first time children must explain a system as a whole.',
    ['Systems', 'Matter', 'Cycles', 'Energy']
  ),
  buildLevel(
    'P5', 'Most Content-Dense',
    'Two body systems, electrical circuits, and photosynthesis. The double-up of Cycles and Systems.',
    ['Cycles', 'Systems']
  ),
  buildLevel(
    'P6', 'PSLE Year',
    'Forces, food chains, environmental interactions. Open-ended Paper 2 questions can pull from any P3–P6 topic.',
    ['Energy', 'Interactions']
  ),
];
