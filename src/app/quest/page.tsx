/**
 * src/app/quest/page.tsx
 * Server component for the /quest route — Phase 2 visual prototype.
 *
 * Phase 2 scope: HARDCODED sample data, no auth, no Supabase fetches.
 * Phase 3 will replace this with real session + quest fetching.
 *
 * The actual UI lives in QuestClient.tsx (client component).
 */

import { QuestClient } from "./QuestClient"

// ─── Hardcoded sample data (Phase 2 only) ──────────────────────

const SAMPLE_QUEST = {
  id: "phase2-sample-quest",
  student_id: "phase2-sample-student",
  subject: "mathematics",
  level: "Primary 5",
  topic: "Fractions",
  trigger_score: 60,
  quest_title: "Master Fractions in 3 Days",
  steps: [
    {
      day: 1,
      type: "quiz" as const,
      title: "Foundation Practice",
      description: "Build your base — 10 questions covering proper, improper, and mixed fractions.",
      estimated_minutes: 12,
      action_url: "/pages/quiz.html?subject=mathematics&topic=fractions&level=primary-5"
    },
    {
      day: 2,
      type: "tutor" as const,
      title: "Talk it through with Miss Wena",
      description: "Practice the bar-model approach to fractions with your AI tutor.",
      estimated_minutes: 15,
      action_url: "/pages/tutor.html?subject=mathematics&topic=fractions"
    },
    {
      day: 3,
      type: "quiz" as const,
      title: "Mock Mastery Check",
      description: "12 mixed-difficulty fraction problems — show what you've learned.",
      estimated_minutes: 18,
      action_url: "/pages/quiz.html?subject=mathematics&topic=fractions&level=primary-5&mode=mastery"
    }
  ],
  current_step: 1, // Day 2 is active (0-indexed)
  status: "active" as const,
  created_at: new Date(Date.now() - 86400000).toISOString()
}

const SAMPLE_STUDENT = {
  id: "phase2-sample-student",
  name: "Lily Tan",
  level: "Primary 5",
  photo_url: "/assets/avatars/placeholder_space_marine.png"
}

// HUD strip values — Level 4 Cadet, partway through level 5
// Level 4 cumulative threshold: 100 * 4 * 3 = 1200 XP
// Level 5 cumulative threshold: 100 * 5 * 4 = 2000 XP
// Total XP 1240 → in level 4 with 40 XP progress toward next level (800 needed for L5)
const SAMPLE_HUD = {
  level: 4,
  rank: "Cadet",
  total_xp: 1240,
  xp_in_level: 40,
  xp_to_next_level: 800,
  streak_days: 12,
  shield_count: 1
}

const SAMPLE_DIAGNOSIS = {
  topic: "Fractions",
  current_al: 5,
  current_pct: 75,
  unlocks: ["Ratio", "Percentage", "Decimals", "Speed"]
}

export default function QuestPage() {
  return (
    <QuestClient
      quest={SAMPLE_QUEST}
      student={SAMPLE_STUDENT}
      hud={SAMPLE_HUD}
      diagnosis={SAMPLE_DIAGNOSIS}
    />
  )
}
