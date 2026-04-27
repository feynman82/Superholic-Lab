# AI_PROVIDER_AND_COMMIT6_HANDOFF.md — Combined Claude Code prompt for Workstream B

**Stream:** Backend & Admin (primary) + light Website Design touches (FAQ page)
**Owns:** AI provider abstraction + Phase 3 Commit 6 deliverables, in one session
**Authoritative specs:**
- `CLAUDE.md` v4.1 (4 Pillars, AI provider state, coding rules)
- `ARCHITECTURE.md` v4.1 (BKT cognitive_skill → MOE AO mapping, schema, AI routing)
- `docs/QUEST_PAGE_SPEC.md` v2.0 (parent FAQ §16, gamification §12)

---

## How to use this prompt

Paste everything below into Claude Code. The work is split into **6 commits** that should be done sequentially. After each commit:

1. Run the verification step
2. Show the user a Vercel preview URL (or local test result for cron + SQL)
3. Only proceed when verification passes

If verification fails, **stop and report**. Do not patch and continue.

---

## Context

Two concerns are bundled into this single handoff because they touch the same files (`lib/api/handlers.js`) and verifying them together with one Lily Tan E2E run is cleaner than serialising:

1. **AI provider abstraction.** The platform currently has a mix:
   - `/api/grade-answer` → OpenAI gpt-4o-mini ✅ (already live)
   - `/api/generate-question` → OpenAI o4-mini ✅ (already live)
   - `/api/chat` (Miss Wena), `/api/summarize-chat`, `/api/generate-exam`, `/api/generate-quest` (narrative) → still on Gemini
   - `/api/generate` (bulk question gen) → Anthropic Claude Sonnet (intentional, stays)
   
   We want **one routing layer** so future provider swaps are env-var-only. The owner has an active OpenAI subscription.

2. **Phase 3 Commit 6** — the last unfinished piece of the Plan Quest sprint:
   - Mastery snapshot cron (daily 03:00 SGT) for `mastery_gain` XP
   - Pedagogy badge seeds (migration 019) — 4 badges
   - Consolidated parent FAQ page (replaces the originally-scoped quest-info.html)
   - Doc cascade: `PARENT_FAQ.md` + `GAMIFICATION_RULES.md`
   - Footer link to FAQ page

## Repo & infra

- Local repo: `D:\Git\Superholic-Lab`
- GitHub: `feynman82/Superholic-Lab` (main branch, push directly)
- Backend: `lib/api/handlers.js` (single gateway, ~3000 lines, 24 routes)
- Frontend: vanilla HTML/JS in `public/` (FAQ page is vanilla)
- Supabase project: `rlmqsbxevuutugtyysjr`
- Stripe: test mode
- AI: OpenAI key already in Vercel env (`OPENAI_API_KEY`); Gemini and Anthropic also present

## Critical rules — read before writing code

1. **CLAUDE.md v4.1 is the authority** for the 4 Pillars wording, framework boundary, and coding rules. Read it.
2. **ARCHITECTURE.md v4.1** has the BKT → MOE AO mapping authoritative. Use those exact strings in the FAQ.
3. **`docs/QUEST_PAGE_SPEC.md` v2.0 §16 is the verbatim source** for the Plan Quest section of the FAQ. Don't paraphrase — extract.
4. **Read existing files before writing.** Use `view` then `str_replace` for surgical edits in `handlers.js`. Never recreate.
5. **Design system locked.** All colours via CSS variables; reuse existing `card-glass`, `accordion`, `font-display`, `label-caps` from `style.css` v3.0. **Zero hardcoded hex/rgba** in HTML `style=` attributes.
6. **Vanilla pages only for the FAQ.** It's content-driven, not animation-heavy.
7. **No new npm dependencies.** OpenAI SDK is already installed (`openai`) and instantiated at the top of `handlers.js` as `const openai = new OpenAI(...)`. Reuse it.
8. **No silent failures.** Every AI call must have a user-facing error path with a sensible default model fallback. Log every catch with `console.error('[handler-name]', err.message)`.

## Pre-work — read these files first

1. `CLAUDE.md` (v4.1, the 4 Pillars section especially)
2. `ARCHITECTURE.md` (v4.1, AI routing + BKT mapping sections)
3. `docs/QUEST_PAGE_SPEC.md` (v2.0, §12 gamification + §16 parent FAQ)
4. `lib/api/handlers.js` — focus on: `callGemini`, `callClaudeRaw`, `handleChat`, `handleSummarizeChat`, `handleGradeAnswer` (already on OpenAI — model the wrapper after this), `handleGenerateQuestion` (already on OpenAI), `handleGenerateExam`, `handleGenerateQuest`, `handleAnalyzeWeakness` (the BKT engine)
5. `vercel.json` — cron section
6. `public/css/style.css` — search for `accordion`, `card-glass`, `label-caps`, `font-display` to see existing utilities
7. `public/js/footer.js` — to understand the `<global-footer>` web component shape
8. `public/pages/pricing.html` — to copy header/footer/style integration patterns

After reading, summarise to the user in 6 bullet points: (a) the 7 AI tasks you'll route through `callAI()`, (b) which currently use which provider, (c) which need migration, (d) the 4 new pedagogy badges to seed, (e) the 9 FAQ sections you'll build, (f) the cron registration in `vercel.json`. **Do not write code until the user confirms your understanding.**

---

# COMMIT 1 — AI Routing Abstraction (`AI_ROUTING` + `callAI()`)

## What to build

### File 1: `lib/api/handlers.js` — additions near the top

Find the existing helpers (`callGemini`, `callClaudeRaw`) around lines 50-90. Add immediately after them:

```js
// ─── AI ROUTING — single source of truth ─────────────────────────────────────
//
// Every AI-using handler should call `await callAI(task, { systemPrompt, userPrompt, ... })`
// instead of calling provider-specific helpers directly. Provider/model is
// chosen by the AI_ROUTING config below, which is overridable via env vars.
//
// To swap a provider in production: set the relevant env vars in Vercel,
// no code change required.

const AI_ROUTING = {
  chat:            { provider: process.env.AI_CHAT_PROVIDER         || 'openai',    model: process.env.AI_CHAT_MODEL         || 'gpt-4o-mini' },
  summarize:       { provider: process.env.AI_SUMMARIZE_PROVIDER    || 'openai',    model: process.env.AI_SUMMARIZE_MODEL    || 'gpt-4o-mini' },
  grade_open:      { provider: process.env.AI_GRADE_PROVIDER        || 'openai',    model: process.env.AI_GRADE_MODEL        || 'gpt-4o-mini' },
  question_gen:    { provider: process.env.AI_QUESTION_PROVIDER     || 'openai',    model: process.env.AI_QUESTION_MODEL     || 'o4-mini' },
  exam_gen:        { provider: process.env.AI_EXAM_PROVIDER         || 'openai',    model: process.env.AI_EXAM_MODEL         || 'gpt-4o-mini' },
  quest_narrative: { provider: process.env.AI_QUEST_PROVIDER        || 'openai',    model: process.env.AI_QUEST_MODEL        || 'gpt-4o-mini' },
  bulk_question:   { provider: process.env.AI_BULK_PROVIDER         || 'anthropic', model: process.env.AI_BULK_MODEL         || 'claude-3-5-sonnet-20241022' },
};

async function callOpenAI(model, systemPrompt, userPrompt, { temperature = 0.3, maxTokens = 1024, responseFormat = null } = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
    temperature,
    max_tokens: maxTokens,
  };
  if (responseFormat === 'json') body.response_format = { type: 'json_object' };
  const res = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI returned empty content');
  return text;
}

// Unified AI dispatch. task must be a key in AI_ROUTING.
async function callAI(task, { systemPrompt = '', userPrompt = '', temperature = 0.3, maxTokens = 1024, responseFormat = null } = {}) {
  const cfg = AI_ROUTING[task];
  if (!cfg) throw new Error(`callAI: unknown task '${task}'`);
  const { provider, model } = cfg;

  if (provider === 'openai') {
    return callOpenAI(model, systemPrompt, userPrompt, { temperature, maxTokens, responseFormat });
  }
  if (provider === 'anthropic') {
    return callClaudeRaw(systemPrompt, userPrompt, { maxTokens, model });
  }
  if (provider === 'gemini') {
    // Gemini has a different shape — fold system prompt into the user prompt.
    const folded = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;
    return callGemini(folded, {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: responseFormat === 'json' ? 'application/json' : undefined,
    });
  }
  throw new Error(`callAI: unknown provider '${provider}' for task '${task}'`);
}
```

### File 2: `lib/api/handlers.js` — refactor the 4 endpoints that need migration

Replace the AI call inside each of these handlers with `callAI(task, ...)`. **Do NOT rewrite the surrounding logic** — only the AI call line(s).

**`handleChat`** (Miss Wena tutor):
- Currently builds a Gemini-shaped payload directly. Refactor:
  - Build the chat history into a single user-prompt string (newline-separated `Student:` / `Miss Wena:`)
  - Pass `systemPrompt` separately
  - Call `await callAI('chat', { systemPrompt, userPrompt, temperature: 0.4, maxTokens: 1024 })`
  - **Vision handling caveat:** if any message has `m.image` (base64), fall back to direct Gemini call for THAT request only (OpenAI vision uses a different shape). Use `if (hasImage) return callGemini(...)` shortcut. Document this in a comment.
- Preserve the Socratic Quest mode override (where `systemPrompt` becomes `buildSocraticQuestPrompt(...)`).
- Preserve `quest_message_count` returned in the response.

**`handleSummarizeChat`**:
- Replace `callGemini(...)` with `await callAI('summarize', { systemPrompt: SUMMARIZE_SYSTEM_PROMPT, userPrompt: 'CHAT LOG:\n' + chatLog, temperature: 0.3, maxTokens: 1000, responseFormat: 'json' })`

**`handleGenerateExam`**:
- The current code does Gemini primary → Claude Haiku fallback. Replace with:
  ```js
  let responseText, provider;
  try {
    responseText = await callAI('exam_gen', { systemPrompt: GE_SYSTEM_PROMPT, userPrompt: buildGEPrompt(sec, subject, level, count), temperature: 0.45, maxTokens: 4096, responseFormat: 'json' });
    provider = AI_ROUTING.exam_gen.provider;
  } catch (e) {
    console.error('[generate-exam] primary failed, falling back to Anthropic Haiku:', e.message);
    responseText = await callClaudeRaw(GE_SYSTEM_PROMPT, buildGEPrompt(sec, subject, level, count), { maxTokens: 4096, model: 'claude-haiku-4-5-20251001' });
    provider = 'anthropic-haiku';
  }
  ```

**`handleGenerateQuest`** (the narrative-generation block only — NOT the quest insertion logic):
- The block that calls `callGemini(...)` to build kid-friendly day descriptions. Replace with `await callAI('quest_narrative', { systemPrompt: 'You are a creative educational writer for Singapore primary students. Return ONLY valid JSON.', userPrompt: narrativePrompt, temperature: 0.7, maxTokens: 512, responseFormat: 'json' })`

### File 3: `lib/api/handlers.js` — normalise the two already-OpenAI handlers

The routing layer should own ALL AI calls. Refactor `handleGradeAnswer` and `handleGenerateQuestion` to use `callAI()` too — even though they're already on OpenAI, this gives us one path to instrument later.

**`handleGradeAnswer`**:
- Replace the direct `fetch('https://api.openai.com/...')` with `await callAI('grade_open', { systemPrompt, userPrompt, temperature: 0.1, maxTokens: 1024, responseFormat: 'json' })`
- The grader system prompt and user-prompt-builder logic stay the same.

**`handleGenerateQuestion`**:
- Replace the `openai.chat.completions.create({...})` call with `await callAI('question_gen', { systemPrompt: GQ_SAFETY_PROMPT, userPrompt: buildGQSchemaInstructions(...), temperature: 0.4, maxTokens: 4096, responseFormat: 'json' })`
- Note: o4-mini does NOT support `temperature` parameter at all — check OpenAI docs. If model is `o4-mini`, `callAI` should silently drop `temperature`. Add this safety to `callOpenAI`:
  ```js
  if (model.startsWith('o4-') || model.startsWith('o1-')) delete body.temperature;
  ```

### File 4: `.env.example` (NEW — create at repo root if absent)

Add a documentation file showing all `AI_*_PROVIDER` and `AI_*_MODEL` env vars. Don't include actual secrets — just the keys.

```
# AI provider routing — override defaults per task
# Defaults shown in handlers.js AI_ROUTING object

AI_CHAT_PROVIDER=openai
AI_CHAT_MODEL=gpt-4o-mini
AI_SUMMARIZE_PROVIDER=openai
AI_SUMMARIZE_MODEL=gpt-4o-mini
AI_GRADE_PROVIDER=openai
AI_GRADE_MODEL=gpt-4o-mini
AI_QUESTION_PROVIDER=openai
AI_QUESTION_MODEL=o4-mini
AI_EXAM_PROVIDER=openai
AI_EXAM_MODEL=gpt-4o-mini
AI_QUEST_PROVIDER=openai
AI_QUEST_MODEL=gpt-4o-mini
AI_BULK_PROVIDER=anthropic
AI_BULK_MODEL=claude-3-5-sonnet-20241022

OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...
```

## Verification (Commit 1)

Deploy to Vercel preview. Test each task with one real call:

1. **Chat (Miss Wena, default mode)** — open `/pages/tutor.html`, send "What is 3/4 of 12?". Verify reply is in OpenAI's voice (not Gemini's). Check Vercel logs for `[chat]` entries with no errors.
2. **Chat with image** — upload a worked-solution image. Verify vision fallback to Gemini works (special case).
3. **Summarize-chat** — after a tutor session, click "Save to Backpack". Verify Study Note is created with proper structure.
4. **Grade-answer** — answer an open-ended question on `/pages/quiz.html`. Verify grade comes back with score + feedback (no regression from current OpenAI path).
5. **Generate-question** — invoke from admin panel or tooling. Verify questions return.
6. **Generate-exam** — generate a Maths P5 paper. Verify all sections populate.
7. **Generate-quest narrative** — create a quest from a low quiz score on progress.html. Verify quest title and day descriptions are kid-friendly and personalised.

If any of the 7 fails, **stop**. Do NOT proceed to commit 2.

---

# COMMIT 2 — Mastery Snapshot Cron

## What to build

### File 1: `api/cron/snapshot-mastery.js` (NEW)

Daily Vercel cron at 03:00 SGT (= 19:00 UTC). For each (student_id, subject, topic, sub_topic) row in `mastery_levels`:

1. INSERT a row into `mastery_levels_snapshots` with today's `snapshot_date` and the cached `al_band` (computed from probability — see below)
2. Compare `al_band` against yesterday's snapshot (if exists)
3. If `al_band` improved (lower number is better in the AL system, AL1 is best), call `/api/award-xp` with `event_type='mastery_gain'` and `xp_amount = 75 * (yesterdayBand - todayBand)`
4. Use idempotency: `event_id = 'mastery_gain_<student_id>_<subject>_<topic>_<sub_topic>_<snapshot_date>'`

```js
// api/cron/snapshot-mastery.js
import { createClient } from '@supabase/supabase-js';

// AL band derivation — replicate logic from progress.js so frontend and cron agree.
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
  // Vercel cron requests come with a `x-vercel-cron-signature` header.
  // For Hobby plan we trust scheduled invocations from Vercel — minimal auth.
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Today's date in SGT
  const sgtFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' });
  const today = sgtFmt.format(new Date()); // YYYY-MM-DD

  const { data: levels, error } = await db.from('mastery_levels').select('student_id, subject, topic, sub_topic, probability');
  if (error) {
    console.error('[cron-mastery] fetch failed:', error.message);
    return res.status(500).json({ error: 'mastery_levels read failed' });
  }

  let snapshotsInserted = 0, xpAwarded = 0;
  for (const row of (levels || [])) {
    const todayBand = probToAlBand(Number(row.probability));

    // Insert today's snapshot (idempotent via unique constraint)
    const { error: insErr } = await db.from('mastery_levels_snapshots').upsert({
      student_id: row.student_id, snapshot_date: today,
      subject: row.subject, topic: row.topic, sub_topic: row.sub_topic || '',
      probability: row.probability, al_band: todayBand,
    }, { onConflict: 'student_id,snapshot_date,subject,topic,sub_topic' });
    if (insErr) { console.error('[cron-mastery] snapshot insert:', insErr.message); continue; }
    snapshotsInserted++;

    // Find most recent prior snapshot (yesterday or earlier)
    const { data: prior } = await db.from('mastery_levels_snapshots')
      .select('al_band, snapshot_date').eq('student_id', row.student_id)
      .eq('subject', row.subject).eq('topic', row.topic).eq('sub_topic', row.sub_topic || '')
      .lt('snapshot_date', today).order('snapshot_date', { ascending: false }).limit(1).maybeSingle();

    if (!prior) continue;
    const bandsImproved = prior.al_band - todayBand;
    if (bandsImproved <= 0) continue;

    // Award XP via direct DB write (we're already server-side with service role)
    const eventId = `mastery_gain_${row.student_id}_${row.subject}_${row.topic}_${row.sub_topic || ''}_${today}`;
    const { data: existing } = await db.from('xp_events').select('id').eq('student_id', row.student_id).eq('event_type', 'mastery_gain').eq('metadata->>event_id', eventId).maybeSingle();
    if (existing) continue; // idempotent

    const xpAmount = 75 * bandsImproved;
    await db.from('xp_events').insert({
      student_id: row.student_id, event_type: 'mastery_gain', xp_awarded: xpAmount,
      metadata: { event_id: eventId, subject: row.subject, topic: row.topic, sub_topic: row.sub_topic, from_band: prior.al_band, to_band: todayBand },
    });
    // Update student_xp aggregate
    await db.rpc('increment_student_xp', { p_student_id: row.student_id, p_amount: xpAmount }).then(() => {}).catch(async () => {
      // Fallback if RPC not present: manual upsert
      const { data: cur } = await db.from('student_xp').select('total_xp').eq('student_id', row.student_id).maybeSingle();
      const newTotal = (cur?.total_xp || 0) + xpAmount;
      await db.from('student_xp').upsert({ student_id: row.student_id, total_xp: newTotal }, { onConflict: 'student_id' });
    });
    xpAwarded += xpAmount;
  }

  return res.status(200).json({ ok: true, date: today, snapshotsInserted, xpAwarded });
}
```

### File 2: `vercel.json` — add cron registration

Add to the existing crons array (which already has `auto-fill-bank`):

```json
{ "path": "/api/cron/snapshot-mastery", "schedule": "0 19 * * *" }
```

That's 19:00 UTC = 03:00 SGT. The path matches the file location.

### File 3: `api/index.js` — add a route case

The cron is a separate Vercel function (under `api/cron/`), so it doesn't go through the gateway router. But verify by visiting `/api/cron/snapshot-mastery` directly that it returns a 200 with the expected JSON.

## Verification (Commit 2)

1. Deploy to Vercel preview
2. Manually invoke: `curl https://<preview>.vercel.app/api/cron/snapshot-mastery`
3. Verify response JSON: `{ ok: true, date: "YYYY-MM-DD", snapshotsInserted: N, xpAwarded: M }`
4. Verify in Supabase that `mastery_levels_snapshots` has rows for today with correct `al_band` values
5. **Set up a test scenario:** manually backdate a snapshot (yesterday with AL5) and update `mastery_levels.probability` to 0.75 (= AL3). Re-run the cron. Verify xp_events has a `mastery_gain` row with `xp_awarded: 150` (75 × 2 bands).
6. Re-run cron — verify idempotency (no duplicate XP).

---

# COMMIT 3 — Pedagogy Badge Seeds (Migration 019)

## What to build

### File 1: `supabase/019_seed_pedagogy_badges.sql` (NEW)

```sql
-- ============================================================
-- 019_seed_pedagogy_badges.sql
-- 4 pedagogy badges that complete the Plan Quest IP signal
-- ============================================================

INSERT INTO badge_definitions (id, name, description, theme, rarity, xp_reward, sort_order, is_secret) VALUES
  ('socratic_scholar', 'Socratic Scholar', 'Complete 5 Day 2 tutor sessions in Plan Quests. You learn by reasoning, not by being told.', 'magic', 'rare', 100, 50, false),
  ('mastery_first_try', 'One-Shot Mastery', 'Score ≥85% on Day 3 of your first ever Plan Quest. Rare. Real.', 'hybrid', 'epic', 200, 51, false),
  ('redo_warrior', 'Redo Warrior', 'Complete a redo quest after a previous attempt did not produce mastery. Growth mindset, certified.', 'hybrid', 'epic', 300, 52, false),
  ('honest_compass', 'Honest Compass', 'Mark a Plan Quest as no_improvement. The platform values self-awareness as much as success — and so do we.', 'magic', 'rare', 50, 53, false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, theme = EXCLUDED.theme,
  rarity = EXCLUDED.rarity, xp_reward = EXCLUDED.xp_reward, sort_order = EXCLUDED.sort_order;

-- Verification:
-- SELECT id, name, rarity FROM badge_definitions WHERE id IN
-- ('socratic_scholar','mastery_first_try','redo_warrior','honest_compass') ORDER BY sort_order;
```

### File 2: `lib/api/badge-engine.js` — wire up the new badges

Find the badge evaluation logic. Add cases for the 4 new badge_ids in the `evaluateBadges` function. The evaluation rules:

- `socratic_scholar`: count of `quest_step_complete` events where the metadata indicates step_index=1 (Day 2) ≥ 5
- `mastery_first_try`: first quest's `day3_outcome === 'mastered'` AND `day3_score >= 85`
- `redo_warrior`: any quest with `parent_quest_id IS NOT NULL` AND `status = 'completed'`
- `honest_compass`: any quest with `day3_outcome === 'no_improvement'`

For each: query Supabase to check the condition, then INSERT into `student_badges` with ON CONFLICT DO NOTHING (the unique constraint on `student_id, badge_id` enforces "once per student").

## Verification (Commit 3)

1. Apply migration 019 manually via Supabase SQL Editor
2. Run verification SELECT — confirm 4 rows present
3. Run a quest end-to-end with `day3_outcome='no_improvement'`. Verify `honest_compass` badge appears in student_badges.
4. Run a quest end-to-end with `day3_outcome='mastered'` and `day3_score=90` as the student's first quest. Verify `mastery_first_try`.
5. Spawn a redo quest from a `no_improvement` exit, complete it. Verify `redo_warrior`.
6. Skip socratic_scholar manual test (5 quests is a lot) — just verify the DB query runs without error.

---

# COMMIT 4 — Consolidated FAQ Page

## What to build

### File 1: `public/pages/faq.html` (NEW — vanilla, content-driven)

Structure:
- Standard `<global-header>` and `<global-footer>` web components
- Hero: "Frequently Asked Questions" in Bebas Neue
- **Sticky search pill** (pill-shaped input, top of content, mobile-friendly): search across all visible Q/A text. Implement with vanilla JS — filter accordion items in real-time as parent types. Show "X results" counter.
- **Sticky anchor nav** (mobile: collapsible "Jump to..." select; desktop: pill row of links to each section)
- **9 sections**, each an `<details>`-based accordion list

### Section content

Use the section table below as the spec. **Every Q/A pair must be plain English suitable for non-technical parents.** Don't use jargon (BKT, RLS, AO1) without explaining it on first use.

| § | Section | Source | Q count |
|---|---------|--------|---------|
| 1 | The Four Pillars | CLAUDE.md "The 4 Pillars" section | 4 |
| 2 | MOE Syllabus & Assessment | NEW (write fresh — see content guidance below) | 4 |
| 3 | Practise (Quizzes) | Master_Question_Template.md + quiz.js | 4 |
| 4 | Analyse Weakness | ARCHITECTURE.md BKT section + handleAnalyzeWeakness | 3 |
| 5 | Plan Quest | docs/QUEST_PAGE_SPEC.md §16 — verbatim, all 9 questions | 9 |
| 6 | Assess (Exams) | exam-templates.js + handleGenerateExam | 4 |
| 7 | Payment & Subscription | pricing.html + handleCheckout | 6 |
| 8 | Account & Privacy (PDPA) | privacy.html + handleAccountDelete | 4 |
| 9 | Technical & Troubleshooting | platform | 3 |

**Total: ~41 questions** (slightly above your 35 target because the new MOE Syllabus section pushed it up — happy to trim Plan Quest from 9 to 6 if you prefer; that's the longest section).

### Content guidance for §2 — MOE Syllabus & Assessment (NEW)

This is the section you specifically asked for. It should answer:

**Q1: Is Superholic Lab aligned with the MOE syllabus?**
> Yes. Every question in our bank is tagged to the latest MOE syllabus for Mathematics, Science, and English (Primary 1 to Secondary 4). Our exam templates are calibrated to SEAB 2026 syllabus codes (0001 Maths, 0008 Science, 0009 English) and follow the actual SEAB paper structure for WA1, WA2, EOY, and PSLE.

**Q2: How does MOE assess students at PSLE?**
> MOE uses three Assessment Objectives (AOs) to measure learning depth:
> - **AO1 — Knowledge & Understanding:** Can the student recall facts and recognise concepts? (Easier questions test this.)
> - **AO2 — Application:** Can the student apply known methods to routine problems? (Most quiz questions test this.)
> - **AO3 — Synthesis, Reasoning & Evaluation:** Can the student combine ideas, reason through unfamiliar problems, and justify their answers? (HOTS questions test this. PSLE rewards AO3 heavily.)
>
> A child who only practises AO1/AO2 will struggle on the harder PSLE questions. AO3 is where most students leave marks on the table.

**Q3: How does Superholic Lab's Analyse Weakness model AO1/AO2/AO3?**
> Every question in our bank is tagged with a specific cognitive skill. We map those skills directly onto MOE's AOs:
>
> | MOE AO | Superholic Lab cognitive skills | Weight in our analysis |
> |--------|----------------------------------|------------------------|
> | AO1 | Factual Recall, Conceptual Understanding | 1.0× |
> | AO2 | Routine Application | 1.0× |
> | AO3 (HOTS) | Non-Routine / Heuristics, Inferential Reasoning, Synthesis & Evaluation | **1.5×** |
>
> When we calculate your child's mastery score on a topic, **AO3 questions count 1.5× more than AO1/AO2**. So if your child gets all the easy questions right but stumbles on heuristics or inference, our system will correctly flag the topic as weak — even though the raw percentage looks fine. Most other platforms just show a flat percentage and miss this.

**Q4: Why does this matter for PSLE preparation?**
> Because PSLE doesn't reward only knowing the syllabus — it rewards being able to apply, reason, and synthesise. By weighting AO3 questions higher in our analysis, we give parents an honest picture of where their child stands against the actual PSLE bar. This honest signal is what makes Plan Quest interventions effective: we target the right weakness, not just the loudest symptom.

### Search pill implementation

The search pill is the parent's superpower for finding answers fast. Build with vanilla JS:

```html
<div class="faq-search">
  <input type="search" id="faqSearch" placeholder="Search questions… (e.g. 'PSLE', 'refund', 'PDPA')" />
  <div id="faqResultCount" class="label-caps"></div>
</div>
```

```js
const input = document.getElementById('faqSearch');
const items = document.querySelectorAll('.faq-item');
const counter = document.getElementById('faqResultCount');

input.addEventListener('input', () => {
  const q = input.value.trim().toLowerCase();
  let visible = 0;
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    const match = !q || text.includes(q);
    item.style.display = match ? '' : 'none';
    if (match) visible++;
  });
  counter.textContent = q ? `${visible} ${visible === 1 ? 'result' : 'results'}` : '';
  // Open all matching accordions when searching, collapse when cleared
  items.forEach(item => { if (q && item.style.display !== 'none') item.setAttribute('open', ''); });
});
```

Styling: pill-shaped (border-radius: 9999px), uses `var(--brand-rose)` accent, sticky-positioned at top of `<main>` so it stays visible on scroll.

### File 2: `public/css/style.css` — additions for FAQ

Add minimal CSS for `.faq-search`, `.faq-anchor-nav`, `.faq-section`, `.faq-item` (the accordion item — use native `<details>` element). Use existing tokens. Zero hardcoded hex.

### File 3: `public/js/footer.js` — add FAQ link

In the `<global-footer>` web component, add an FAQ link in the appropriate dropdown/section. The owner specified "FAQ" as the wording. Place it under "Help" or "Resources" — match whatever section already exists for Privacy/Terms.

## Verification (Commit 4)

1. Deploy to Vercel preview
2. Visit `/pages/faq.html` — verify all 9 sections render with anchor nav
3. Test search pill: type "refund" → only the refund Q should show; counter says "1 result"
4. Test search clear: empty input → all questions visible, counter empty
5. Test mobile (375px): anchor nav collapses to dropdown, search pill remains accessible, accordions tap-to-expand work
6. Test from `<global-footer>`: click FAQ link → navigates to `/pages/faq.html`
7. Lighthouse mobile score ≥ 90 on the FAQ page
8. **Verify the §2 AO mapping table matches** the BKT logic in `handleAnalyzeWeakness` — wrong mapping = misleading parents.

---

# COMMIT 5 — Documentation Cascade

## What to build

### File 1: `docs/PARENT_FAQ.md` (NEW)

The markdown twin of `public/pages/faq.html`. Same 9 sections, same questions, same answers. **This is the source of truth for the FAQ content.** Future updates: edit this file first, then sync to faq.html.

Why both: marketing/blog/email teams use the markdown; the website uses the HTML.

### File 2: `docs/GAMIFICATION_RULES.md` (NEW)

Extract verbatim from `docs/QUEST_PAGE_SPEC.md` §12 (XP rules) + §11 portions about levels and ranks + §14 (badge list). This becomes the standalone reference. Include:
- Full XP table
- Level math formula
- Rank ladder
- All 33 badges with rarity, theme, XP reward, unlock condition
- Anti-cheat rules summary

### File 3: `INDEX.md` — update

Add `docs/PARENT_FAQ.md` and `docs/GAMIFICATION_RULES.md` to the Documentation Files section. Add `public/pages/faq.html` to the Pages table.

### File 4: `PROJECT_DASHBOARD.md` — update

Move the following from PENDING to COMPLETED:
- AI Provider Migration
- Phase 3 Commit 6
- FAQ page
- Mastery snapshot cron
- Pedagogy badges seeded

Add to Recent Architecture Decisions: ADR-0004 (AI routing abstraction).

Update the version banner to v2.1.

## Verification (Commit 5)

1. All 4 docs render cleanly on GitHub (no broken markdown)
2. Internal links work (cross-references between PARENT_FAQ.md, GAMIFICATION_RULES.md, QUEST_PAGE_SPEC.md)
3. INDEX.md and PROJECT_DASHBOARD.md no longer have stale PENDING items

---

# COMMIT 6 — Vercel Env Vars + Final E2E

## What to do

### Step 1: Add env vars to Vercel dashboard

For each `AI_*_PROVIDER` and `AI_*_MODEL` listed in `.env.example`, add to Vercel for **Production + Preview + Development** scopes. Even though the defaults in `AI_ROUTING` will work without these env vars, having them explicitly set makes future swaps a 1-click operation.

Double-check:
- `OPENAI_API_KEY` is present (already added previously)
- `GEMINI_API_KEY` is present (kept for vision fallback)
- `ANTHROPIC_API_KEY` is present (kept for bulk question gen)

### Step 2: Lily Tan E2E test (per `docs/QUEST_PAGE_SPEC.md` §18)

Run the full Lily Tan flow on the Vercel preview deployment:

1. Test account, P5 student, 0 active quests
2. Take a P5 Maths Fractions quiz, score 60% — auto-modal appears, click Yes
3. Quest generated, redirect to /quest, Day 1 unlocked
4. Day 1 quiz: 12 questions ramping difficulty, complete with ~58% score
5. Returning celebration on /quest, Day 1 ✓, Day 2 LOCKED
6. Wait for SGT midnight (or use admin override to mark `day_completed_at[0]` as 25h ago)
7. Day 2 unlocks → Socratic dialogue with Miss Wena (now on OpenAI gpt-4o-mini, not Gemini)
8. Verify Miss Wena references Day 1 wrong answers specifically
9. After 8 messages, "Mark Day 2 Complete" enables, click → Study Note saved with quest_id link
10. Wait for next SGT midnight, Day 3 unlocks
11. Day 3 quiz: 8 questions, 6 hard + 2 transfer
12. Score 78% → auto-applies `slight_improvement`, quest closes, badges + XP awarded

**Verify across the run:**
- Every AI call goes through the new `callAI()` wrapper (check `console.log` for entries like `[chat] using openai gpt-4o-mini`)
- No regressions in tutor quality vs the previous Gemini version
- Grading on quiz still works (already on OpenAI)
- XP totals match the spec
- Badges unlock at the right moments
- Study Note has correct `quest_id` linkage

### Step 3: Manually trigger mastery cron

`curl https://www.superholiclab.com/api/cron/snapshot-mastery`

Verify response, verify Supabase row counts increased.

## Verification (Commit 6 — final)

All 12 Lily Tan steps pass + cron returns OK + no regressions in regular quiz/exam flows.

If any step fails, **stop and report**. Do not declare Workstream B complete.

---

# Final pre-merge checklist (Workstream B)

- [ ] All 6 commits pushed to `feynman82/Superholic-Lab/main`
- [ ] All 7 AI tasks routed through `callAI()` (chat, summarize, grade_open, question_gen, exam_gen, quest_narrative, bulk_question)
- [ ] Vision fallback to Gemini documented and tested
- [ ] Cron registered in `vercel.json`, manually verified to run
- [ ] Migration 019 applied to production Supabase
- [ ] 4 pedagogy badges seeded and unlock conditions tested
- [ ] FAQ page live with search pill working
- [ ] FAQ link in `<global-footer>` clickable
- [ ] §2 MOE Syllabus AO mapping in FAQ matches `handleAnalyzeWeakness` behaviour
- [ ] Lily Tan E2E test passes end to end on Vercel preview
- [ ] Lighthouse mobile ≥ 90 on `/pages/faq.html`
- [ ] No new hardcoded hex/rgba in HTML `style=` attributes
- [ ] PARENT_FAQ.md and GAMIFICATION_RULES.md complete and cross-linked
- [ ] INDEX.md and PROJECT_DASHBOARD.md no longer flag this work as pending
- [ ] Vercel env vars set for all `AI_*_PROVIDER` and `AI_*_MODEL`

If you're unsure about anything, **stop and ask the user a question**. We're closing the Phase 3 sprint. Quality > speed.

---

**End of combined handoff prompt.**
