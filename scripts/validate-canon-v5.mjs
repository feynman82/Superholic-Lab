import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { data: orphans } = await sb.rpc('exec_sql', { sql: `
  SELECT level, subject, topic, sub_topic, COUNT(*) as cnt FROM question_bank
  WHERE deprecated_at IS NULL
    AND (level, subject, topic, sub_topic) NOT IN
        (SELECT level, subject, topic, sub_topic FROM canon_level_topics)
  GROUP BY 1,2,3,4 ORDER BY cnt DESC LIMIT 20;
`});
console.log(orphans?.length === 0 ? '✅ Zero orphans' : `❌ ${orphans.length} orphan groups`);