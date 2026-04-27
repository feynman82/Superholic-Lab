/**
 * api/cron/snapshot-mastery.js
 * Daily Vercel cron — 19:00 UTC (03:00 SGT).
 *
 * For every mastery_levels row:
 *   1. Upsert a mastery_levels_snapshots row for today (SGT date).
 *   2. Compare today's AL band against the most recent prior snapshot.
 *   3. If improved, award 75 XP per band jumped via xp_events + student_xp.
 *      Idempotent: event_id deduplication prevents double-awards.
 */

import { createClient } from '@supabase/supabase-js';

// AL band derivation — mirrors progress.js so frontend and cron always agree.
// AL1: ≥0.90, AL2: 0.80-0.89, AL3: 0.70-0.79, AL4: 0.60-0.69,
// AL5: 0.50-0.59, AL6: 0.40-0.49, AL7: 0.25-0.39, AL8: <0.25
function probToAlBand(p) {
  if (p >= 0.90) return 1;
  if (p >= 0.80) return 2;
  if (p >= 0.70) return 3;
  if (p >= 0.60) return 4;
  if (p >= 0.50) return 5;
  if (p >= 0.40) return 6;
  if (p >= 0.25) return 7;
  return 8;
}

export default async function handler(req, res) {
  // Accept scheduled invocations from Vercel infra, or manual calls with CRON_SECRET.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Today's date in SGT (YYYY-MM-DD)
  const sgtFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const today = sgtFmt.format(new Date());

  const { data: levels, error: levelsErr } = await db
    .from('mastery_levels')
    .select('student_id, subject, topic, sub_topic, probability');

  if (levelsErr) {
    console.error('[cron-mastery] mastery_levels fetch failed:', levelsErr.message);
    return res.status(500).json({ error: 'mastery_levels read failed' });
  }

  let snapshotsInserted = 0;
  let xpAwarded = 0;

  for (const row of (levels || [])) {
    const todayBand = probToAlBand(Number(row.probability));
    const subTopic  = row.sub_topic || '';

    // 1. Upsert today's snapshot (unique on student_id, snapshot_date, subject, topic, sub_topic)
    const { error: snapErr } = await db.from('mastery_levels_snapshots').upsert({
      student_id:    row.student_id,
      snapshot_date: today,
      subject:       row.subject,
      topic:         row.topic,
      sub_topic:     subTopic,
      probability:   row.probability,
      al_band:       todayBand,
    }, { onConflict: 'student_id,snapshot_date,subject,topic,sub_topic' });

    if (snapErr) {
      console.error('[cron-mastery] snapshot upsert:', snapErr.message);
      continue;
    }
    snapshotsInserted++;

    // 2. Find most recent prior snapshot (before today)
    const { data: prior } = await db
      .from('mastery_levels_snapshots')
      .select('al_band, snapshot_date')
      .eq('student_id', row.student_id)
      .eq('subject', row.subject)
      .eq('topic', row.topic)
      .eq('sub_topic', subTopic)
      .lt('snapshot_date', today)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!prior) continue;

    const bandsImproved = prior.al_band - todayBand; // positive = improvement (lower band# = better)
    if (bandsImproved <= 0) continue;

    // 3. Award XP — idempotent via event_id deduplication
    const eventId = `mastery_gain_${row.student_id}_${row.subject}_${row.topic}_${subTopic}_${today}`;

    const { data: existing } = await db
      .from('xp_events')
      .select('id')
      .eq('student_id', row.student_id)
      .eq('event_type', 'mastery_gain')
      .eq('metadata->>event_id', eventId)
      .maybeSingle();

    if (existing) continue; // already awarded today

    const xpAmount = 75 * bandsImproved;

    await db.from('xp_events').insert({
      student_id:  row.student_id,
      event_type:  'mastery_gain',
      xp_awarded:  xpAmount,
      metadata: {
        event_id:  eventId,
        subject:   row.subject,
        topic:     row.topic,
        sub_topic: subTopic,
        from_band: prior.al_band,
        to_band:   todayBand,
      },
    });

    // Update student_xp aggregate — try RPC first, manual upsert as fallback
    await db.rpc('increment_student_xp', { p_student_id: row.student_id, p_amount: xpAmount })
      .then(() => {})
      .catch(async () => {
        const { data: cur } = await db
          .from('student_xp')
          .select('total_xp')
          .eq('student_id', row.student_id)
          .maybeSingle();
        const newTotal = (cur?.total_xp || 0) + xpAmount;
        await db.from('student_xp').upsert(
          { student_id: row.student_id, total_xp: newTotal },
          { onConflict: 'student_id' }
        );
      });

    xpAwarded += xpAmount;
  }

  console.log(`[cron-mastery] ${today}: snapshots=${snapshotsInserted}, xpAwarded=${xpAwarded}`);
  return res.status(200).json({ ok: true, date: today, snapshotsInserted, xpAwarded });
}
