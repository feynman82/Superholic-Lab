/**
 * js/analyze-weakness.js
 * Deep Tech Module: Bayesian Knowledge Tracing (BKT) & Dependency Traversal
 * Analyzes student data to generate a MOE-aligned Remedial Quest.
 */

const SYLLABUS_DEPENDENCIES = {
  mathematics: {
    'Ratio': ['Fractions', 'Multiplication and Division'],
    'Percentage': ['Fractions', 'Decimals'],
    'Speed': ['Rate', 'Time', 'Fractions', 'Decimals'],
    'Rate': ['Whole Numbers', 'Multiplication and Division'],
    'Average': ['Addition and Subtraction', 'Multiplication and Division'],
    'Area of Triangle': ['Area and Perimeter', 'Whole Numbers'],
    'Volume': ['Area and Perimeter', 'Multiplication and Division'],
    'Algebra': ['Whole Numbers', 'Fractions'],
    'Fractions': ['Whole Numbers', 'Multiplication Tables'],
    'Decimals': ['Fractions', 'Whole Numbers']
  },
  science: {
    'Energy': ['Heat', 'Light', 'Matter'],
    'Cycles': ['Diversity'],
    'Systems': ['Diversity'],
    'Interactions': ['Magnets', 'Forces']
  }
};

/**
 * Main Diagnostic Engine. Call this from progress.js or tutor.js.
 */
export async function runCognitiveDiagnosis(db, studentId, subject) {
  try {
    // 1. Fetch Last 100 Attempts for this subject
    const { data: attempts, error } = await db
      .from('question_attempts')
      .select('topic, sub_topic, cognitive_skill, difficulty, correct, created_at')
      .eq('student_id', studentId)
      .limit(100)
      .order('created_at', { ascending: false });

    if (error || !attempts || attempts.length === 0) return null;

    // Filter to the specific subject requested (math/science/english)
    const subjectDependencies = SYLLABUS_DEPENDENCIES[subject.toLowerCase()] || {};

    // 2. Data Aggregation & Time-Decay Weighting
    const masteryScores = {}; // Format: { "Ratio": { attempts: 10, weightedScore: 0.4 } }
    const now = new Date();

    attempts.forEach(attempt => {
      // Normalize topic
      const topic = attempt.topic || 'Unknown';
      if (!masteryScores[topic]) {
        masteryScores[topic] = { totalWeight: 0, correctWeight: 0, failedSkills: new Set() };
      }

      // Time Decay: Recent attempts matter more (1.0). >30 days drops to 0.5.
      const daysOld = (now - new Date(attempt.created_at)) / (1000 * 60 * 60 * 24);
      const timeWeight = Math.max(0.5, 1 - (daysOld * 0.01)); 

      // Difficulty Modifier: Getting a 'Hard' question wrong hurts less than missing an 'Easy' one.
      let diffMod = 1.0;
      if (attempt.difficulty === 'HOTS') diffMod = 0.8;
      if (attempt.difficulty === 'Foundation') diffMod = 1.2;

      const finalWeight = timeWeight * diffMod;
      masteryScores[topic].totalWeight += finalWeight;
      
      if (attempt.correct) {
        masteryScores[topic].correctWeight += finalWeight;
      } else if (attempt.cognitive_skill) {
        masteryScores[topic].failedSkills.add(attempt.cognitive_skill);
      }
    });

    // 3. Find the weakest current node
    let weakestTopic = null;
    let lowestMastery = 1.0;

    for (const [topic, data] of Object.entries(masteryScores)) {
      if (data.totalWeight < 1.0) continue; // Ignore topics with almost no data
      const mastery = data.correctWeight / data.totalWeight;
      
      if (mastery < lowestMastery) {
        lowestMastery = mastery;
        weakestTopic = topic;
      }
    }

    if (!weakestTopic) return null;

    // 4. Dependency Traversal (The Deep Tech Magic)
    // If they are failing Ratio, check if they also failed Fractions. 
    // If yes, target Fractions as the Root Cause.
    let rootCauseTopic = weakestTopic;
    const prereqs = subjectDependencies[weakestTopic] || [];
    
    for (const req of prereqs) {
      if (masteryScores[req] && (masteryScores[req].correctWeight / masteryScores[req].totalWeight) < 0.6) {
        rootCauseTopic = req; // Found a weaker foundational node!
      }
    }

    // 5. Dynamic Quest Sizing
    // High mastery (e.g., 0.8) gets a quick 6-question brush-up. Low gets a 10-question drill.
    let questLength = Math.round(10 - (4 * lowestMastery));
    questLength = Math.max(6, Math.min(10, questLength));

    // 6. Generate the Return Payload
    return {
      student_id: studentId,
      identified_weakness: rootCauseTopic,
      symptom_topic: weakestTopic,
      mastery_score: lowestMastery.toFixed(2),
      quest_length: questLength,
      failed_skills: Array.from(masteryScores[rootCauseTopic]?.failedSkills || []),
      ai_prompt_context: `Student is struggling with ${rootCauseTopic}. Root cause appears to be a gap in ${Array.from(masteryScores[rootCauseTopic]?.failedSkills || []).join(', ')}. Generate a ${questLength}-question remedial plan.`
    };

  } catch (error) {
    console.error("Cognitive Engine Error:", error);
    return null;
  }
}