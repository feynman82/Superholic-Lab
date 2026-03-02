// Singapore Context Bank
export const singaporeNames = [
  'Xiao Ming', 'Wei Jie', 'Ravi', 'Aisyah', 'Priya', 
  'Jun Wei', 'Nurul', 'Mei Ling', 'Zhi Hao', 'Sara', 
  'Ethan', 'Jayden', 'Hannah', 'Chloe'
]

export const singaporeLocations = [
  'HDB void deck', 'NTUC FairPrice', 'Sheng Siong', 'MRT station (NS/EW lines)', 
  'Hawker Centre', 'School canteen', 'MacRitchie Reservoir', 'East Coast Park', 
  'Gardens by the Bay', 'PCN (Park Connector)', 'Community Club', 'Wet market'
]

export const singaporeEvents = [
  'PSLE preparation', 'Racial Harmony Day', 'National Day', 'Hari Raya visiting', 
  'CNY reunion', 'Deepavali', 'Childrens Day', 'P5 Camp', 'Zoo excursion'
]

export const singaporeItems = [
  'EZ-Link card', 'Tissue packet (chope)', 'Kopi/Teh', 'Tutu kueh', 
  'Ice kachang', 'Math manipulatives', 'School uniform', 'Water bottle'
]

// Curriculum topics by level and subject
export const curriculumTopics = {
  math: {
    1: ['Numbers to 100', 'Number bonds', '1-step word problems', 'Money to $100', 'Time (o\'clock/half-past)', '2D shapes'],
    2: ['Numbers to 1000', 'Multiplication tables (2,3,4,5,10)', 'Fractions (unit)', 'Volume (L/ml)', '3D shapes'],
    3: ['Numbers to 10,000', 'Formal algorithms', 'Equivalent fractions', '24h clock', 'Area/perimeter', 'Bar graphs'],
    4: ['Numbers to 100k', 'Factors/multiples', 'Improper fractions', 'Decimals (3 places)', 'Angles measurement', 'Averages'],
    5: ['Ratio (part:part:whole)', 'Percentage (GST 9%)', 'Algebra intro (variables)', 'Triangle properties', 'Angles on straight line (180°)'],
    6: ['Algebra (linear equations)', 'Division of fractions', 'Speed (Distance/Time)', 'Circles (π, circumference, area)', 'Volume/rate', 'Pie charts']
  },
  english: {
    1: ['Simple tenses', 'SVA', 'Articles', 'Prepositions', 'Conjunctions (and/but/because)', 'Basic comprehension (150w)'],
    2: ['Simple tenses', 'SVA', 'Articles', 'Prepositions', 'Conjunctions (and/but/because)', 'Basic comprehension (150w)'],
    3: ['Perfect/continuous tenses', 'Modals', 'Relative pronouns', 'Synthesis (unless/despite/although)', 'Comprehension (300w)'],
    4: ['Perfect/continuous tenses', 'Modals', 'Relative pronouns', 'Synthesis (unless/despite/although)', 'Comprehension (300w)'],
    5: ['Conditionals (Type 1/2)', 'Reported speech', 'Phrasal verbs', 'Inversion (Rarely/Hardly)', 'Comprehension (500w)', 'Editing (homophones)', 'PEEL structure'],
    6: ['Conditionals (Type 1/2)', 'Reported speech', 'Phrasal verbs', 'Inversion (Rarely/Hardly)', 'Comprehension (500w)', 'Editing (homophones)', 'PEEL structure']
  },
  science: {
    3: ['Living diversity', 'Materials properties', 'Life cycles', 'Water cycle', 'Plant/human systems', 'Magnets'],
    4: ['Matter cycles', 'Respiration/circulation systems', 'Light reflection/refraction', 'Friction', 'Food chains'],
    5: ['Cell structure', 'Electrical circuits', 'Reproduction (humans/plants)', 'Environment/conservation', 'Energy conversion'],
    6: ['Forces (gravitational/frictional/elastic)', 'PSLE OEQ format (CER structure)', 'Experiment variables', 'Cross-topic integration']
  }
}

// Math heuristics
export const mathHeuristics = [
  'working backwards',
  'constant difference',
  'guess and check',
  'model drawing',
  'before-after concept',
  'repeated identity'
]

// Get random items from arrays
export function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Generate prompt for Gemini
export function generateQuestionPrompt(
  level: number,
  subject: 'math' | 'english' | 'science',
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number = 1
): string {
  const names = getRandomItems(singaporeNames, 2).join(' and ')
  const location = getRandomItem(singaporeLocations)
  const event = getRandomItem(singaporeEvents)
  const item = getRandomItem(singaporeItems)

  const heuristic = subject === 'math' ? getRandomItem(mathHeuristics) : null

  let prompt = `Generate ${count} questions for Singapore Primary ${level} ${subject}.
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty} (Hard = PSLE standard +15-20%)

Singapore Context: Use setting "${location}" with characters "${names}"
`

  if (heuristic) {
    prompt += `Math Heuristics (if applicable): ${heuristic}
`
  }

  prompt += `
For Math:
- Include model drawing descriptions in explanations
- Money problems use SGD with realistic prices (e.g., $1.50 for kopi)
- Multi-step problems for P4+

For English:
- Vocabulary: Tier 2 words (exasperated, scampered, gleamed)
- Comprehension: Inference questions requiring text evidence
- Synthesis: Transformations using unless/despite/although/so...that

For Science:
- CER format (Claim-Evidence-Reasoning) for open-ended
- Experimental design (fair test, variables)
- Singapore environment contexts (tropical climate, local flora/fauna)

Output strict JSON array with fields:
id (uuid), type (mcq|open|fill_blank), question (string), options (array for mcq), correctAnswer, explanation (step-by-step), topic, difficulty, marks, heuristic (if math), contextUsed`

  return prompt
}

// Generate cache key
export function generateCacheKey(
  level: number,
  subject: string,
  topic: string,
  difficulty: string
): string {
  return `${level}-${subject}-${topic}-${difficulty}`
}
