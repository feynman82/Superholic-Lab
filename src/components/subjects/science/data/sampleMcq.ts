export interface SampleOption {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
  correct: boolean;
  misconception?: string;
}

export interface SampleMcq {
  id: string;
  level: string;
  topic: string;
  subTopic: string;
  stem: string;
  options: SampleOption[];
  workedExplanation: string;
}

export const sampleMcq: SampleMcq = {
  id: 'demo-p5-cycles-001',
  level: 'P5',
  topic: 'Cycles',
  subTopic: 'Stages of the Water Cycle',
  stem: 'Which process in the water cycle changes water vapour back into liquid water?',
  options: [
    {
      letter: 'A',
      text: 'Evaporation',
      correct: false,
      misconception: 'Evaporation is the opposite — liquid water becomes water vapour. It needs heat to add energy to the water.',
    },
    {
      letter: 'B',
      text: 'Condensation',
      correct: true,
    },
    {
      letter: 'C',
      text: 'Precipitation',
      correct: false,
      misconception: 'Precipitation describes water falling from clouds (rain, snow). It happens after condensation, not as a state change itself.',
    },
    {
      letter: 'D',
      text: 'Melting',
      correct: false,
      misconception: 'Melting changes solid (ice) to liquid water. It does not involve water vapour.',
    },
  ],
  workedExplanation:
    'Condensation is the change of state from gas (water vapour) to liquid (water droplets). It happens when water vapour cools down and loses heat energy.',
};
