/**
 * lib/api/badge-engine.js
 * Badge evaluation + XP level math.
 * Takes an adminDb client as a parameter — no global DB state.
 *
 * Exports:
 *   xpToLevel, xpInCurrentLevel, xpNeededForNextLevel, levelToRank
 *   evaluateLevelUp({ totalXpBefore, totalXpAfter })
 *   evaluateBadges({ studentId, eventType, eventMetadata, db })
 */

// ─── XP / Level math (from QUEST_PAGE_SPEC §12) ───────────────────────────────

export function xpToLevel(totalXp) {
  return Math.min(50, Math.max(1, Math.floor((1 + Math.sqrt(1 + totalXp / 25)) / 2)));
}

export function xpInCurrentLevel(totalXp, level) {
  return totalXp - 100 * level * (level - 1);
}

export function xpNeededForNextLevel(level) {
  return 200 * level;
}

export function levelToRank(level) {
  if (level >= 50) return 'Legend';
  if (level >= 40) return 'Vanguard';
  if (level >= 30) return 'Commander';
  if (level >= 20) return 'Captain';
  if (level >= 15) return 'Lieutenant';
  if (level >= 10) return 'Specialist';
  if (level >=  5) return 'Operator';
  return 'Cadet';
}

/**
 * Computes level-up data given XP before and after an award.
 * @returns {{ leveled_up, level_before, level_after, rank_before, rank_after,
 *             xp_in_level_after, xp_to_next_level }}
 */
export function evaluateLevelUp({ totalXpBefore, totalXpAfter }) {
  const levelBefore = xpToLevel(totalXpBefore);
  const levelAfter  = xpToLevel(totalXpAfter);
  return {
    leveled_up:        levelAfter > levelBefore,
    level_before:      levelBefore,
    level_after:       levelAfter,
    rank_before:       levelToRank(levelBefore),
    rank_after:        levelToRank(levelAfter),
    xp_in_level_after: xpInCurrentLevel(totalXpAfter, levelAfter),
    xp_to_next_level:  xpNeededForNextLevel(levelAfter),
  };
}

// ─── Badge predicate registry ─────────────────────────────────────────────────
// Each entry: badgeId → async predicate(context) → boolean
//
// context shape:
//   { studentId, eventType, eventMetadata, db }
//
// eventMetadata shape varies by caller:
//   quest_step_complete → { step_index, quest_id, score, outcome, parent_quest_id }
//   quiz_complete       → { score, subject }
//   quest_complete      → { outcome, subject, topic, quest_id, parent_quest_id }
//   badge_earned, login_streak, mastery_gain → misc

const BADGE_PREDICATES = {

  // ── Common ─────────────────────────────────────────────────────────────────

  first_quiz: async ({ db, studentId }) => {
    const { count } = await db.from('quiz_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId);
    return (count || 0) >= 1;
  },

  quiz_5: async ({ db, studentId }) => {
    const { count } = await db.from('quiz_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId);
    return (count || 0) >= 5;
  },

  streak_3: async ({ db, studentId }) => {
    const { data } = await db.from('student_streaks').select('current_days').eq('student_id', studentId).single();
    return (data?.current_days || 0) >= 3;
  },

  streak_7: async ({ db, studentId }) => {
    const { data } = await db.from('student_streaks').select('current_days').eq('student_id', studentId).single();
    return (data?.current_days || 0) >= 7;
  },

  streak_30: async ({ db, studentId }) => {
    const { data } = await db.from('student_streaks').select('current_days').eq('student_id', studentId).single();
    return (data?.current_days || 0) >= 30;
  },

  note_taker: async ({ db, studentId }) => {
    const { count } = await db.from('study_notes')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId);
    return (count || 0) >= 5;
  },

  helper_10: async ({ db, studentId }) => {
    // Count user-role messages in ai_tutor_logs
    const { count } = await db.from('ai_tutor_logs')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('role', 'user');
    return (count || 0) >= 10;
  },

  helper_50: async ({ db, studentId }) => {
    const { count } = await db.from('ai_tutor_logs')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('role', 'user');
    return (count || 0) >= 50;
  },

  tutor_session: async ({ db, studentId }) => {
    // A "session" is defined as at least 4 assistant messages from the tutor log.
    const { count } = await db.from('ai_tutor_logs')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('role', 'assistant');
    return (count || 0) >= 4;
  },

  weakness_spotter: async ({ eventType }) => {
    return eventType === 'weakness_viewed';
  },

  // ── Quest-completion ────────────────────────────────────────────────────────

  quest_day_1: async ({ eventType, eventMetadata }) => {
    return eventType === 'quest_step_complete' && Number(eventMetadata?.step_index) === 0;
  },

  first_quest: async ({ db, studentId }) => {
    const { count } = await db.from('remedial_quests')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('status', 'completed');
    return (count || 0) >= 1;
  },

  quest_3: async ({ db, studentId }) => {
    const { count } = await db.from('remedial_quests')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('status', 'completed');
    return (count || 0) >= 3;
  },

  quest_10: async ({ db, studentId }) => {
    const { count } = await db.from('remedial_quests')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('status', 'completed');
    return (count || 0) >= 10;
  },

  // ── Pedagogy badges (019 migration adds these to badge_definitions) ─────────

  socratic_scholar: async ({ db, studentId }) => {
    // Day 2 tutor sessions = quests where current_step > 1 (past Day 2) or status=completed
    // Proxy: count quest_step_complete events for step_index 1
    const { count } = await db.from('xp_events')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('event_type', 'quest_step_complete')
      .filter('metadata->>step_index', 'eq', '1');
    return (count || 0) >= 5;
  },

  mastery_first_try: async ({ db, studentId, eventMetadata }) => {
    // Awarded when: quest complete with outcome=mastered AND parent_quest_id IS NULL (first attempt)
    if (eventMetadata?.outcome !== 'mastered') return false;
    if (eventMetadata?.parent_quest_id) return false;  // this is a redo, not first try
    // Also verify it's actually the first completed quest
    const { count } = await db.from('remedial_quests')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('status', 'completed')
      .eq('day3_outcome', 'mastered');
    return (count || 0) === 1;  // just became 1 (we already updated before calling badges)
  },

  redo_warrior: async ({ db, studentId, eventMetadata }) => {
    // Awarded when a redo quest (parent_quest_id IS NOT NULL) is completed
    if (!eventMetadata?.parent_quest_id) return false;
    if (eventMetadata?.outcome !== 'mastered' && eventMetadata?.outcome !== 'slight_improvement') return false;
    return true;
  },

  honest_compass: async ({ eventType, eventMetadata }) => {
    return eventType === 'quest_complete' && eventMetadata?.outcome === 'no_improvement';
  },

  // ── Perfect / score-based ───────────────────────────────────────────────────

  perfect_quiz: async ({ eventType, eventMetadata }) => {
    return (eventType === 'quiz_complete' || eventType === 'quest_step_complete')
      && Number(eventMetadata?.score) === 100;
  },

  subject_explorer: async ({ db, studentId }) => {
    const { data } = await db.from('quiz_attempts')
      .select('subject')
      .eq('student_id', studentId);
    const subjects = new Set((data || []).map(r => (r.subject || '').toLowerCase()));
    return subjects.has('mathematics') && subjects.has('science') && subjects.has('english');
  },

  // ── Level thresholds ────────────────────────────────────────────────────────

  level_10: async ({ db, studentId }) => {
    const { data } = await db.from('student_xp').select('current_level').eq('student_id', studentId).single();
    return (data?.current_level || 1) >= 10;
  },

  level_25: async ({ db, studentId }) => {
    const { data } = await db.from('student_xp').select('current_level').eq('student_id', studentId).single();
    return (data?.current_level || 1) >= 25;
  },

  level_50: async ({ db, studentId }) => {
    const { data } = await db.from('student_xp').select('current_level').eq('student_id', studentId).single();
    return (data?.current_level || 1) >= 50;
  },

  // ── AL mastery ──────────────────────────────────────────────────────────────

  weakness_crusher: async ({ db, studentId }) => {
    // At least one topic improved by 2+ AL bands (lower band = better, so al_after < al_before - 1)
    const { data: snapshots } = await db.from('mastery_levels_snapshots')
      .select('subject, topic, al_band, snapshot_date')
      .eq('student_id', studentId)
      .order('snapshot_date', { ascending: true });
    if (!snapshots || snapshots.length < 2) return false;
    // Group by (subject, topic) and check if max(al_band) - min(al_band) >= 2
    const groups = {};
    for (const row of snapshots) {
      const key = `${row.subject}|${row.topic}`;
      if (!groups[key]) groups[key] = { min: row.al_band, max: row.al_band };
      else { groups[key].min = Math.min(groups[key].min, row.al_band); groups[key].max = Math.max(groups[key].max, row.al_band); }
    }
    return Object.values(groups).some(g => g.max - g.min >= 2);
  },

  al1_master: async ({ db, studentId }) => {
    const { data } = await db.from('mastery_levels')
      .select('al_band')
      .eq('student_id', studentId)
      .lte('al_band', 1)
      .limit(1);
    return (data || []).length > 0;
  },

};

// ─── Main evaluateBadges function ─────────────────────────────────────────────

/**
 * Evaluates all badge predicates for a student after a trigger event.
 * Inserts newly earned badges into student_badges.
 * Awards badge XP directly to student_xp (logged as badge_earned events).
 *
 * @param {Object} opts
 * @param {string}   opts.studentId      - The student's UUID
 * @param {string}   opts.eventType      - The triggering event type
 * @param {Object}   [opts.eventMetadata]- Metadata for the trigger event
 * @param {Object}   opts.db             - Supabase admin client
 * @returns {Promise<Object[]>}          - Array of newly earned badge definition objects
 */
export async function evaluateBadges({ studentId, eventType, eventMetadata = {}, db }) {
  try {
    // 1. Fetch already-earned badge IDs for this student
    const { data: earned } = await db.from('student_badges')
      .select('badge_id')
      .eq('student_id', studentId);
    const earnedSet = new Set((earned || []).map(r => r.badge_id));

    // 2. Run predicates only for badges not yet earned
    const candidates = Object.keys(BADGE_PREDICATES).filter(id => !earnedSet.has(id));

    const context = { studentId, eventType, eventMetadata, db };
    const newlyEarned = [];

    await Promise.all(candidates.map(async (badgeId) => {
      try {
        const qualifies = await BADGE_PREDICATES[badgeId](context);
        if (qualifies) newlyEarned.push(badgeId);
      } catch (err) {
        // Non-fatal: log and skip this badge predicate
        console.error(`[badge-engine] Predicate error for ${badgeId}:`, err.message);
      }
    }));

    if (newlyEarned.length === 0) return [];

    // 3. Fetch badge definitions for the newly earned badges
    const { data: defs } = await db.from('badge_definitions')
      .select('id, name, description, rarity, xp_reward, icon_url, theme')
      .in('id', newlyEarned);

    // 4. Insert into student_badges (ON CONFLICT DO NOTHING for safety)
    const insertRows = newlyEarned.map(id => ({
      student_id: studentId,
      badge_id:   id,
      context:    { trigger: eventType, ...eventMetadata },
    }));
    await db.from('student_badges').upsert(insertRows, { onConflict: 'student_id,badge_id', ignoreDuplicates: true });

    // 5. Award badge XP directly (logged as badge_earned events, no recursive badge eval)
    for (const def of (defs || [])) {
      if ((def.xp_reward || 0) > 0) {
        try {
          await db.from('xp_events').insert({
            student_id:  studentId,
            event_type:  'badge_earned',
            xp_awarded:  def.xp_reward,
            metadata:    { badge_id: def.id },
          });
          // Update student_xp total
          const { data: xpRow } = await db.from('student_xp').select('total_xp, current_level').eq('student_id', studentId).single();
          const newTotal  = (xpRow?.total_xp || 0) + def.xp_reward;
          const newLevel  = xpToLevel(newTotal);
          await db.from('student_xp').update({
            total_xp:      newTotal,
            current_level: newLevel,
            xp_in_level:   xpInCurrentLevel(newTotal, newLevel),
            updated_at:    new Date().toISOString(),
          }).eq('student_id', studentId);
        } catch (xpErr) {
          console.error(`[badge-engine] Badge XP grant failed for ${def.id}:`, xpErr.message);
        }
      }
    }

    return defs || [];
  } catch (err) {
    console.error('[badge-engine] evaluateBadges error:', err.message);
    return [];  // Non-fatal: badge failure must never block quest completion
  }
}
