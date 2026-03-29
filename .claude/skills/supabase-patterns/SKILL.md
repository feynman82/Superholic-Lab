---
name: supabase-patterns
description: "Supabase database patterns specific to Superholic Lab. Schema, RLS, queries, auth, migrations. Read before any database operation."
origin: Superholic Lab
---

# Supabase Patterns Skill

Project-specific database patterns for Superholic Lab.
Read this before any Supabase query, migration, or RLS change.

## When to Use

- Writing any Supabase query
- Creating or modifying RLS policies
- Running SQL migrations
- Working with auth (signup, login, session)
- Saving quiz results or tracking usage

## Connection

Client: `js/supabase-client.js` exposes `window.getSupabase()`

```js
// In any frontend JS file:
const db = await getSupabase();
const { data, error } = await db.from('profiles').select('id, full_name').limit(1);
```

Server-side (api/*.js): use service role key from process.env.
NEVER use service role key in frontend JS.

## Schema Quick Reference

### profiles (extends auth.users)
```sql
id                uuid PK → auth.users(id)
full_name         text
role              text DEFAULT 'parent'
subscription_tier text DEFAULT 'trial'
                  -- values: trial | single_subject | all_subjects | family
stripe_customer_id text NULL
trial_started_at  timestamptz NULL
trial_ends_at     timestamptz NULL  -- 7 days after signup
max_children      integer DEFAULT 1
created_at        timestamptz DEFAULT now()
updated_at        timestamptz DEFAULT now()
```
Triggers: `handle_new_user()` (auto-create on signup), `handle_updated_at()`

### students
```sql
id               uuid PK DEFAULT gen_random_uuid()
parent_id        uuid → profiles(id)
name             text NOT NULL
level            text NOT NULL  -- e.g. 'Primary 4'
selected_subject text NULL      -- only for single_subject tier
created_at       timestamptz DEFAULT now()
```

### quiz_attempts
```sql
id                  uuid PK
student_id          uuid → students(id)
subject             text   -- Mathematics|Science|English
level               text
topic               text
difficulty          text   -- Mixed (when quiz has mixed difficulties)
score               integer
total_questions     integer
time_taken_seconds  integer NULL
completed_at        timestamptz DEFAULT now()
```

### question_attempts
```sql
id               uuid PK
quiz_attempt_id  uuid → quiz_attempts(id)
student_id       uuid → students(id)
question_text    text
topic            text
difficulty       text
correct          boolean
answer_chosen    text
correct_answer   text
created_at       timestamptz DEFAULT now()
```

### subscriptions
```sql
id                      uuid PK
profile_id              uuid → profiles(id)
stripe_subscription_id  text NOT NULL
stripe_price_id         text NOT NULL
plan_name               text  -- single_subject|all_subjects|family
status                  text  -- active|cancelled|past_due|trialing
current_period_start    timestamptz
current_period_end      timestamptz
created_at              timestamptz DEFAULT now()
```

### daily_usage
```sql
id                  uuid PK
student_id          uuid → students(id)
date                date DEFAULT current_date
questions_attempted integer DEFAULT 0
ai_tutor_messages   integer DEFAULT 0
UNIQUE(student_id, date)
```

## Query Patterns

### ALWAYS do this
```js
// 1. Explicit columns (never select('*'))
const { data, error } = await db
  .from('students')
  .select('id, name, level')
  .eq('parent_id', userId)
  .limit(10);

// 2. Always check error
if (error) {
  console.error('Query failed:', error.message);
  showError('Could not load data. Please try again.');
  return;
}

// 3. Always use .limit()
// 4. Always handle empty results
if (!data || data.length === 0) {
  showEmpty('No students found.');
  return;
}
```

### Save quiz results
```js
async function saveResults(studentId, subject, level, topic, score, total, answers) {
  const db = await getSupabase();

  // 1. Insert quiz attempt
  const { data: attempt, error: attErr } = await db
    .from('quiz_attempts')
    .insert({
      student_id: studentId,
      subject, level, topic,
      difficulty: 'Mixed',
      score, total_questions: total,
    })
    .select('id')
    .single();

  if (attErr) throw attErr;

  // 2. Insert per-question attempts
  if (answers.length > 0) {
    const rows = answers.map(a => ({
      quiz_attempt_id: attempt.id,
      student_id: studentId,
      question_text: a.question_text.slice(0, 500),
      topic: a.topic,
      difficulty: a.difficulty,
      correct: a.correct,
      answer_chosen: a.answer_chosen,
      correct_answer: a.correct_answer,
    }));
    await db.from('question_attempts').insert(rows);
  }
}
```

### Check daily usage
```js
async function checkDailyUsage(studentId) {
  const db = await getSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await db
    .from('daily_usage')
    .select('id, questions_attempted, ai_tutor_messages')
    .eq('student_id', studentId)
    .eq('date', today)
    .limit(1);
  if (error || !data?.length) return { questions_attempted: 0, ai_tutor_messages: 0 };
  return data[0];
}
```

### Increment usage
```js
async function incrementUsage(studentId, field, amount) {
  const db = await getSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const usage = await checkDailyUsage(studentId);

  if (!usage.id) {
    await db.from('daily_usage').insert({
      student_id: studentId,
      date: today,
      [field]: amount,
    });
  } else {
    await db.from('daily_usage')
      .update({ [field]: (usage[field] || 0) + amount })
      .eq('student_id', studentId)
      .eq('date', today);
  }
}
```

## RLS Rules

RLS is ENABLED on ALL 6 tables. Never disable it.

Policy pattern: users see only their own data.
- profiles: `auth.uid() = id`
- students: `auth.uid() = parent_id`
- quiz_attempts: via student → parent chain
- question_attempts: via student → parent chain
- subscriptions: `auth.uid() = profile_id`
- daily_usage: via student → parent chain

Before any schema change, verify RLS still works.

## Auth Patterns

```js
// Get current user (from supabase-client.js)
const user = await getCurrentUser();  // returns user object or null

// Get profile
const profile = await getProfile();   // returns profiles row

// Check subscription
const tier = profile.subscription_tier;  // trial|single_subject|all_subjects|family

// Check trial
const isTrialActive = profile.trial_ends_at &&
  new Date(profile.trial_ends_at) > new Date();
```

## Migration Workflow

Migrations are applied via Supabase SQL Editor (not CLI).

1. Write SQL in a local file: `supabase/migrations/YYYYMMDD_description.sql`
2. Test in Supabase SQL Editor on the project
3. Verify RLS still works after migration
4. Commit the migration file to git

Never modify tables directly in the Supabase dashboard — always use migration SQL.

## Security Checklist

- [ ] RLS enabled on the table
- [ ] Policy restricts to own data
- [ ] Service role key only in api/*.js files
- [ ] No PII in error messages or console.error
- [ ] Explicit column selection (no select('*'))
- [ ] .limit() on every query
