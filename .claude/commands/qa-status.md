# /qa-status — QA Pending Queue Status

Run this in the **Reviewer instance** (Instance B in the two-instance
generator+reviewer workflow) to see the current QA backlog.
The Generator instance can also run it to decide whether to pause
batches if the queue is growing too large.

## What it does

Queries Supabase for the count of `question_bank` rows where
`approved_at IS NULL AND deprecated_at IS NULL` (pending review),
broken down by subject × level × topic. Prints a compact table.

## Workflow

1. Run `/qa-status` (no arguments).
2. Read the breakdown — top rows are the highest-volume backlogs.
3. Open `/pages/admin.html` in the browser via Chrome MCP.
4. Click the "Pending" tab in the QA Panel.
5. Review each card: visual sanity check, render preview, calibration.
6. Approve or send back; rinse and repeat.
7. Re-run `/qa-status` periodically to gauge progress.

## SQL

Run this via `mcp__claude_ai_Supabase__execute_sql`:

```sql
WITH pending AS (
  SELECT subject, level, topic, COUNT(*) AS cnt
  FROM question_bank
  WHERE approved_at IS NULL
    AND deprecated_at IS NULL
  GROUP BY subject, level, topic
),
totals AS (
  SELECT 'TOTAL' AS scope, COUNT(*) AS cnt
  FROM question_bank
  WHERE approved_at IS NULL
    AND deprecated_at IS NULL
)
SELECT subject, level, topic, cnt
FROM pending
UNION ALL
SELECT 'TOTAL pending', NULL, NULL, cnt FROM totals
ORDER BY subject NULLS LAST, level NULLS LAST, cnt DESC;
```

Also useful — the throughput query to gauge reviewer velocity:

```sql
SELECT
  DATE_TRUNC('day', approved_at) AS day,
  COUNT(*) AS approved_today
FROM question_bank
WHERE approved_at >= NOW() - INTERVAL '14 days'
GROUP BY day
ORDER BY day DESC;
```

## Output format

Print a single compact table:

```
QA Pending Queue (as of {timestamp})
═══════════════════════════════════════════════════════
Subject       Level     Topic                    Pending
───────────────────────────────────────────────────────
English       P5        Comprehension                412
English       P5        Synthesis                    387
Science       P6        Energy                       298
Science       P6        Interactions                 285
Mathematics   P6        Fractions                    142
...
───────────────────────────────────────────────────────
TOTAL pending                                      5,623
```

Highlight (with a one-line note) any topic with > 500 pending —
those are the highest-priority review targets.

## When to pause generation

If `/qa-status` shows TOTAL pending > 8,000, advise the Generator
instance to pause `/generate-batch` until the queue drains below
6,000. This prevents the QA backlog from outpacing reviewer
capacity and keeps the production bank healthy.

## See also

- QA Panel UI: `public/pages/admin.html` → QA section (rendered by
  `public/js/qa-panel.js` v3.0).
- Approval API: `/api/qa-questions` (handler in `lib/api/handlers.js`
  → `handleQaQuestions`).
- Generator: `/generate-batch` slash command (inserts new questions
  with `approved_at = NULL` so they enter the queue).
