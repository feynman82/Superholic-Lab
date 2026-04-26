# QUEST_FRONTEND_HANDOFF.md — Claude Code prompt for Plan Quest Phase 3 Frontend

**Stream:** Website Design
**Owns commits:** 3 (/quest page wired to real data + new states), 5 (progress.html quest tray + HUD strip + auto-modal partial)
**Authoritative spec:** `docs/QUEST_PAGE_SPEC.md` v2.0

---

## How to use this prompt

Paste everything below into Claude Code. Work commit-by-commit. After each commit:

1. Run the verification step
2. Show the user a Vercel preview URL
3. Only proceed when verification passes

If verification fails, **stop and report**. Do not patch and continue.

---

## Context

You built the Phase 2 visual prototype of `/quest` already. The UI is polished and design-system-compliant. **Now you wire it to real data** and add the missing states for the production system.

Plan Quest is the **third pillar** of Superholic Lab. The bottom nav already places it third (Practise → AI Tutor → Quest → Exam → Progress). The icon system is built. The Phase 2 page works with hardcoded data. We are turning it on.

The Backend & Admin stream is doing commits 1, 2, 4, 6 in parallel. **You wait for their Commit 2 (handlers) to land before starting your Commit 3** — you need the API contracts.

## Repo & infra

- Local repo: `D:\Git\Superholic-Lab`
- GitHub: `feynman82/Superholic-Lab` (main branch, push directly)
- Frontend split:
  - Vanilla HTML/CSS/JS in `public/` for app pages (quiz.html, tutor.html, progress.html, etc.)
  - **Next.js shell at `src/app/quest/` only**
- Existing files:
  - `src/app/quest/page.tsx` — server component, currently has hardcoded sample data
  - `src/app/quest/QuestClient.tsx` — main UI (~1000 lines, polished)
  - `src/app/quest/components/ReturningCelebration.tsx` — already done
  - `src/components/icons/index.tsx` — icon system (Quest, Quiz, Tutor, etc.)
  - `public/css/style.css` v3.0 — design system (sage/rose/peach/cream)
  - `public/js/bottom-nav.js` — `<global-bottom-nav>` web component with `setQuestActive(bool)` and `setActive(slug)`

## Critical rules — read before writing code

1. **`docs/QUEST_PAGE_SPEC.md` v2.0 is the authority.** Read it. Specifically §4 (URL contract), §8 (state machine), §10 (API contracts), §13 (component inventory), §16 (parent FAQ language).
2. **Read existing files first.** Use `view` then `str_replace` for surgical edits. Never recreate.
3. **Design system is locked.** All colours via CSS variables (sage `var(--brand-sage)`, rose `var(--brand-rose)`, etc.). **Zero hardcoded hex/rgba** in HTML `style=` attributes or new CSS. Use existing utility classes from `style.css` v3.0 (e.g., `card-glass`, `quest-chip`, `label-caps`, `quest-timeline-track`).
4. **The icon set is the icon set.** Use `<Icon name="...">` from `src/components/icons/index.tsx` for the 13 names available (per STYLEGUIDE.md §5). Never inline new SVGs unless adding to the icon set in BOTH `public/js/icons.js` and `src/components/icons/index.tsx` in the same commit.
5. **The bottom nav is shared.** `<global-bottom-nav>` is the canonical 5-item nav across all pages. Don't change its structure. Use `setQuestActive(bool)` to update the badge count when needed.
6. **Mobile-first.** All layouts test at 375px width. Then 768px, then 1024px+.
7. **No new npm dependencies without asking.** The current set is locked.
8. **No silent failures.** If an API call fails, surface a user-readable error with retry. Console.error every catch.

## Pre-work — read these files first

1. `docs/QUEST_PAGE_SPEC.md` (full read)
2. `src/app/quest/QuestClient.tsx` (you wrote this; refresh memory)
3. `src/app/quest/page.tsx` (current hardcoded server component)
4. `src/components/icons/index.tsx` (icon names available)
5. `public/css/style.css` (search for `quest-`, `card-glass`, `label-caps` to see existing utilities)
6. `STYLEGUIDE.md` (memory rules)
7. `public/js/progress.js` (you'll modify this in Commit 5; read existing renderQuestMap function)
8. `public/js/bottom-nav.js` (understand the API: setQuestActive, setActive)

After reading, summarise to the user in 5 bullet points: (a) what's already in QuestClient.tsx and works, (b) what's missing in QuestClient.tsx for production, (c) what new components you'll need to build, (d) confirmation that you understand the day-gating UI requirements (locked state, countdown timer), (e) confirmation that you understand the multi-quest picker. **Do not write code until the user confirms your understanding.**

---

# COMMIT 3 — /quest page wired to real data

**WAIT for Backend Commit 2 to be merged before starting.** Verify by checking that `lib/api/handlers.js` contains `handleQuestsRouter` and `handleAwardXP` functions, and `api/index.js` has the routes registered.

## What to build (8 files)

### File 1: `src/app/quest/page.tsx` (REWRITE)

Replace the entire file. Server component with auth + data fetch. Pattern:

```tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { QuestClient } from './QuestClient';
import { EmptyState } from './components/EmptyState';

export default async function QuestPage({ 
  searchParams 
}: { 
  searchParams: Promise<Record<string, string>> 
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  
  // Server-side Supabase SSR client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => { /* no-op for read */ }
      }
    }
  );
  
  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/pages/login.html?redirect=/quest');
  
  // 2. Resolve active student (URL param > first child for parent)
  const studentIdParam = params.student;
  const { data: students } = await supabase
    .from('students')
    .select('id, name, level, photo_url')
    .eq('parent_id', user.id)
    .order('created_at', { ascending: true });
  
  if (!students || students.length === 0) {
    redirect('/pages/setup.html');
  }
  
  const activeStudent = students.find(s => s.id === studentIdParam) || students[0];
  
  // 3. Fetch active quests for this student
  const { data: activeQuests } = await supabase
    .from('remedial_quests')
    .select('*')
    .eq('student_id', activeStudent.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  const quests = activeQuests || [];
  
  // 4. No quests → Empty state
  if (quests.length === 0) {
    return <EmptyState student={activeStudent} />;
  }
  
  // 5. Pick which quest to render
  const selectedQuest = params.id 
    ? (quests.find(q => q.id === params.id) || quests[0])
    : quests[0];
  
  // 6. Fetch full quest data via the API (for HUD, diagnosis, day_unlock_status)
  const fullDataRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/quests/${selectedQuest.id}`,
    { 
      headers: { 'Cookie': cookieStore.toString() }, 
      cache: 'no-store' 
    }
  );
  
  if (!fullDataRes.ok) {
    console.error('Failed to fetch quest data:', await fullDataRes.text());
    return <EmptyState student={activeStudent} error="Failed to load quest data" />;
  }
  
  const { quest, student, hud, diagnosis, day_unlock_status } = await fullDataRes.json();
  
  // 7. If returnParams.completed is set, fetch celebration data server-side
  let celebrationData = null;
  if (params.completed !== undefined) {
    celebrationData = await buildCelebrationData(supabase, activeStudent.id, params);
  }
  
  return (
    <QuestClient
      quest={quest}
      student={student}
      hud={hud}
      diagnosis={diagnosis}
      dayUnlockStatus={day_unlock_status}
      allActiveQuests={quests}
      returnParams={params}
      celebrationData={celebrationData}
    />
  );
}

async function buildCelebrationData(supabase, studentId, params) {
  // Fetch most recent xp_events + badges from last 60s
  const sixtySecondsAgo = new Date(Date.now() - 60_000).toISOString();
  
  const [xpRes, badgeRes] = await Promise.all([
    supabase
      .from('xp_events')
      .select('*')
      .eq('student_id', studentId)
      .gte('created_at', sixtySecondsAgo)
      .order('created_at', { ascending: false }),
    supabase
      .from('student_badges')
      .select('*, badge_definitions!inner(*)')
      .eq('student_id', studentId)
      .gte('earned_at', sixtySecondsAgo)
  ]);
  
  const totalXp = (xpRes.data || []).reduce((sum, e) => sum + e.xp_awarded, 0);
  const badges = (badgeRes.data || []).map(b => ({
    id: b.badge_id,
    name: b.badge_definitions.name,
    description: b.badge_definitions.description,
    rarity: b.badge_definitions.rarity
  }));
  
  return {
    completedDay: parseInt(params.completed, 10),
    trigger: params.trigger || 'quiz',
    score: params.score ? parseInt(params.score, 10) : null,
    xpAwarded: totalXp,
    levelUp: null,  // Set if you compute level transitions; can be null
    badgesUnlocked: badges,
    questComplete: false  // Set true if final step
  };
}
```

The `QuestClient` props expand to add `dayUnlockStatus`, `allActiveQuests`, `returnParams`, `celebrationData`.

### File 2: `src/app/quest/QuestClient.tsx` (MODIFY)

Read the existing file first via `view`. Apply these surgical changes via `str_replace`:

**Update props type at top of file:**

```tsx
type DayUnlockStatus = {
  '0': { unlocked: boolean; completed: boolean; unlocks_at: string | null };
  '1': { unlocked: boolean; completed: boolean; unlocks_at: string | null };
  '2': { unlocked: boolean; completed: boolean; unlocks_at: string | null };
};

type QuestClientProps = {
  quest: Quest;
  student: Student;
  hud: HUD;
  diagnosis: Diagnosis;
  dayUnlockStatus: DayUnlockStatus;
  allActiveQuests: Quest[];
  returnParams: Record<string, string>;
  celebrationData: CelebrationData | null;
};
```

**Add QuestPicker at top when 2-3 active quests:**

```tsx
{allActiveQuests.length >= 2 && (
  <QuestPicker quests={allActiveQuests} activeId={quest.id} />
)}
```

**Replace the demo `?demo=returning` toggle with real return-flow handling:**

The Phase 2 prototype had a `demoCelebration` state for testing. Replace with:

```tsx
const [activeCelebration, setActiveCelebration] = useState<CelebrationData | null>(celebrationData);

useEffect(() => {
  // Clean URL after mounting if return params present
  if (celebrationData && typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.delete('completed');
    url.searchParams.delete('trigger');
    url.searchParams.delete('score');
    window.history.replaceState({}, '', url.pathname + (url.search || ''));
  }
}, [celebrationData]);

function dismissCelebration() {
  setActiveCelebration(null);
}
```

**Update QuestTimeline to respect day gating:**

Replace the existing logic that uses `currentStep` for done/active/locked. Use `dayUnlockStatus`:

```tsx
function QuestTimeline({
  steps,
  currentStep,
  dayUnlockStatus
}: {
  steps: QuestStep[];
  currentStep: number;
  dayUnlockStatus: DayUnlockStatus;
}) {
  // Force re-render every minute so countdown updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  
  return (
    <motion.div /* ... existing wrapper ... */>
      <div className="quest-timeline-track">
        {steps.map((step, i) => {
          const status = dayUnlockStatus[String(i) as '0' | '1' | '2'];
          const isDone = status.completed;
          const isActive = status.unlocked && !status.completed;
          const isLocked = !status.unlocked;
          
          // existing class assignments...
          
          return (
            <div key={step.day} className="quest-timeline-item">
              <div className="quest-timeline-node-wrapper">
                {isActive && <div aria-hidden className="quest-pulse-ring" />}
                <div className={`quest-timeline-node ${nodeClass}`}>
                  {isDone ? '✓' : isLocked ? <Icon name="lock" size={22} /> : step.day}
                </div>
              </div>
              <div className={`quest-node-label ${labelClass}`}>Day {step.day}</div>
              {isLocked && status.unlocks_at && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {formatCountdown(status.unlocks_at)}
                </div>
              )}
              {!isLocked && (
                <div style={{ fontSize: '0.7rem', color: isActive ? 'var(--brand-rose)' : 'var(--text-muted)', opacity: 0.8, marginTop: 2 }}>
                  {step.type === 'tutor' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="tutor" size={12} /> Tutor
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="quiz" size={12} /> Quiz
                    </span>
                  )}
                </div>
              )}
              {/* existing connector */}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function formatCountdown(unlocksAt: string): string {
  const now = new Date();
  const target = new Date(unlocksAt);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return 'Unlocking…';
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours >= 24) return `Unlocks in ${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours >= 1) return `Unlocks in ${hours}h ${Math.floor((diffMs % 3_600_000) / 60_000)}m`;
  return `Unlocks in ${Math.floor(diffMs / 60_000)}m`;
}
```

**Update ActiveDayCard to gate by unlock status:**

```tsx
function ActiveDayCard({ 
  step, 
  questId, 
  unlockStatus 
}: { 
  step: QuestStep; 
  questId: string;
  unlockStatus: DayUnlockStatus['0'];
}) {
  if (!unlockStatus.unlocked) {
    // Render locked variant
    return (
      <motion.div /* ... */ className="card-glass" style={{ /* muted styling */ opacity: 0.7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Icon name="lock" size={24} />
          <span className="label-caps" style={{ color: 'var(--text-muted)' }}>
            Locked
          </span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 2.2rem)', color: 'var(--text-muted)', margin: 0 }}>
          {step.title}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>
          This step unlocks at midnight (Singapore time) once Day {step.day - 1} is complete.
        </p>
        <div style={{ marginTop: 24, padding: '12px 20px', background: 'var(--surface-container)', borderRadius: 8, display: 'inline-block' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
            {unlockStatus.unlocks_at ? formatCountdown(unlockStatus.unlocks_at) : 'Locked'}
          </span>
        </div>
      </motion.div>
    );
  }
  
  // existing unlocked rendering
}
```

**Wire AbandonButton to real API:**

Replace the `alert("Phase 3 will wire real abandon flow")` placeholder:

```tsx
import { createClient } from '@supabase/supabase-js';

async function handleAbandon(questId: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { session } } = await supabase.auth.getSession();
    
    const res = await fetch(`/api/quests/${questId}/abandon`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (res.ok) {
      window.location.href = '/quest';
    } else {
      const err = await res.json();
      console.error('Abandon failed:', err);
      alert('Failed to abandon quest: ' + (err.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Abandon error:', err);
    alert('Failed to abandon quest. Please try again.');
  }
}
```

Pass `questId` down to `AbandonButton` from `QuestClient` props.

**Add Day3OutcomeModal trigger:**

After all other state variables in QuestClient:

```tsx
const showDay3Outcome = 
  quest.current_step === 2 && 
  quest.day3_score !== null && 
  quest.day3_outcome === null && 
  quest.day3_score < 70;

const [day3OutcomeOpen, setDay3OutcomeOpen] = useState(showDay3Outcome);
```

Render:

```tsx
<AnimatePresence>
  {day3OutcomeOpen && (
    <Day3OutcomeModal
      questId={quest.id}
      score={quest.day3_score!}
      topic={quest.topic}
      onComplete={(outcome, redirectUrl) => {
        setDay3OutcomeOpen(false);
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          window.location.reload();  // Refresh to show closed state
        }
      }}
    />
  )}
</AnimatePresence>
```

### File 3: `src/app/quest/components/EmptyState.tsx` (NEW)

```tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icon } from '../../../components/icons';

type Student = { name: string; level: string };

export function EmptyState({ student, error }: { student: Student; error?: string }) {
  return (
    <main style={{ 
      minHeight: '100vh', 
      paddingTop: 'calc(var(--navbar-h) + var(--space-8))', 
      paddingBottom: 96, 
      color: 'var(--text-main)' 
    }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px', textAlign: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
        >
          <div style={{ marginTop: 64, marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', color: 'var(--brand-rose)', opacity: 0.6 }}>
              <Icon name="quest" size={64} />
            </div>
          </div>
          
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: 'clamp(2rem, 6vw, 3rem)', 
            letterSpacing: '0.04em', 
            margin: '0 0 16px 0', 
            color: 'var(--brand-rose)' 
          }}>
            No active quest yet
          </h1>
          
          <p style={{ 
            fontSize: '1rem', 
            lineHeight: 1.6, 
            color: 'var(--text-muted)', 
            margin: '0 0 32px 0' 
          }}>
            Plan Quests are personalised 3-day learning interventions. They start when {student.name} gets a low score on a topic, or when you spot a weakness on the Progress page.
          </p>
          
          {error && (
            <div style={{ 
              padding: 16, 
              marginBottom: 24, 
              background: 'rgba(220, 38, 38, 0.08)', 
              border: '1px solid rgba(220, 38, 38, 0.3)', 
              borderRadius: 8, 
              color: 'var(--error)',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <Link 
              href="/pages/progress.html" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '14px 28px', 
                borderRadius: 9999, 
                background: 'var(--brand-rose)', 
                color: 'var(--cream)', 
                fontWeight: 700, 
                textDecoration: 'none', 
                fontSize: '0.95rem' 
              }}
            >
              Find a weakness <span aria-hidden>→</span>
            </Link>
            <Link 
              href="/pages/quest-info.html" 
              style={{ 
                color: 'var(--text-muted)', 
                fontSize: '0.875rem', 
                textDecoration: 'underline' 
              }}
            >
              How does Plan Quest work?
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
```

### File 4: `src/app/quest/components/QuestPicker.tsx` (NEW)

Tabs at top of /quest when 2-3 active quests. Subject-coloured chips.

```tsx
'use client';

import Link from 'next/link';
import { Icon } from '../../../components/icons';

type Quest = { 
  id: string; 
  subject: string; 
  topic: string; 
  current_step: number;
};

const SUBJECT_COLOURS: Record<string, string> = {
  mathematics: 'var(--brand-sage)',
  science: 'var(--brand-amber)',
  english: 'var(--brand-mint)'
};

export function QuestPicker({ 
  quests, 
  activeId 
}: { 
  quests: Quest[]; 
  activeId: string;
}) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: 12, 
      marginBottom: 24, 
      padding: '0 16px', 
      overflowX: 'auto', 
      justifyContent: 'center',
      flexWrap: 'wrap'
    }}>
      {quests.map(q => {
        const isActive = q.id === activeId;
        const colour = SUBJECT_COLOURS[q.subject] || 'var(--brand-sage)';
        const dayLabel = `Day ${q.current_step + 1} of 3`;
        
        return (
          <Link
            key={q.id}
            href={`/quest?id=${q.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 9999,
              border: `1.5px solid ${isActive ? colour : 'var(--border-light)'}`,
              background: isActive 
                ? `color-mix(in srgb, ${colour} 12%, transparent)` 
                : 'transparent',
              color: isActive ? colour : 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'all 200ms ease'
            }}
          >
            <Icon name="quest" size={16} />
            <span>{capitaliseTopic(q.topic)}</span>
            <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>· {dayLabel}</span>
          </Link>
        );
      })}
    </div>
  );
}

function capitaliseTopic(topic: string): string {
  return topic.charAt(0).toUpperCase() + topic.slice(1);
}
```

### File 5: `src/app/quest/components/Day3OutcomeModal.tsx` (NEW)

The 3-way exit modal. Per spec §7 Day 3 mechanic.

```tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { Icon } from '../../../components/icons';

type Outcome = 'redo' | 'slight_improvement' | 'no_improvement';

export function Day3OutcomeModal({
  questId,
  score,
  topic,
  onComplete
}: {
  questId: string;
  score: number;
  topic: string;
  onComplete: (outcome: Outcome, redirectUrl?: string) => void;
}) {
  const [submitting, setSubmitting] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  async function submit(outcome: Outcome) {
    setSubmitting(outcome);
    setError(null);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`/api/quests/${questId}/day3-outcome`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ outcome })
      });
      
      const data = await res.json();
      if (res.ok) {
        if (outcome === 'redo' && data.new_quest_id) {
          onComplete(outcome, `/quest?id=${data.new_quest_id}`);
        } else {
          onComplete(outcome);
        }
      } else {
        setError(data.error || 'Submit failed');
        setSubmitting(null);
      }
    } catch (err) {
      console.error('Day 3 outcome submit failed:', err);
      setError('Network error. Try again.');
      setSubmitting(null);
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(8px)'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="card-glass"
        style={{
          maxWidth: 520,
          width: '100%',
          padding: 32,
          background: 'var(--surface-container)',
          border: '1px solid var(--border-light)',
          borderRadius: 16
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }} aria-hidden>📊</div>
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: 'clamp(1.75rem, 4vw, 2rem)', 
            color: 'var(--text-main)', 
            margin: '0 0 12px 0' 
          }}>
            Day 3 complete — {score}%
          </h2>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.95rem', 
            lineHeight: 1.5, 
            margin: 0 
          }}>
            You scored below 70% on the {topic} mastery trial. That's okay — what matters is what you do next. Pick honestly:
          </p>
        </div>
        
        {error && (
          <div style={{ 
            padding: 12, 
            marginBottom: 16, 
            background: 'rgba(220, 38, 38, 0.08)', 
            border: '1px solid rgba(220, 38, 38, 0.3)', 
            borderRadius: 8, 
            color: 'var(--error)', 
            fontSize: '0.875rem' 
          }}>
            {error}
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <OutcomeButton
            label="Try this quest again"
            description="Get a new set of questions on the same topic. We track your progress over multiple attempts."
            xpHint="+100 XP for growth mindset"
            onClick={() => submit('redo')}
            disabled={submitting !== null}
            loading={submitting === 'redo'}
            primary
          />
          <OutcomeButton
            label="It improved a bit — close this quest"
            description="Mark this quest as slight improvement. We'll suggest revisiting your study notes."
            xpHint="+100 XP"
            onClick={() => submit('slight_improvement')}
            disabled={submitting !== null}
            loading={submitting === 'slight_improvement'}
          />
          <OutcomeButton
            label="I'm still struggling — close this quest"
            description="Honest exit. We'll surface this in your parent dashboard so you can get help."
            xpHint="No XP — but you earn an Honest Compass badge"
            onClick={() => submit('no_improvement')}
            disabled={submitting !== null}
            loading={submitting === 'no_improvement'}
            muted
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function OutcomeButton({
  label,
  description,
  xpHint,
  onClick,
  disabled,
  loading,
  primary,
  muted
}: {
  label: string;
  description: string;
  xpHint: string;
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  primary?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        textAlign: 'left',
        padding: 16,
        borderRadius: 12,
        border: `1.5px solid ${primary ? 'var(--brand-rose)' : 'var(--border-light)'}`,
        background: primary 
          ? 'color-mix(in srgb, var(--brand-rose) 8%, transparent)' 
          : muted 
            ? 'transparent' 
            : 'var(--surface-elevated)',
        color: muted ? 'var(--text-muted)' : 'var(--text-main)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !loading ? 0.5 : 1,
        transition: 'all 200ms ease',
        fontFamily: 'inherit'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
          {loading ? 'Submitting…' : label}
        </span>
        <span className="label-caps" style={{ color: primary ? 'var(--brand-rose)' : 'var(--text-muted)' }}>
          {xpHint}
        </span>
      </div>
      <div style={{ fontSize: '0.825rem', lineHeight: 1.5, opacity: 0.85 }}>
        {description}
      </div>
    </button>
  );
}
```

### File 6: `src/app/quest/components/BadgeUnlockModal.tsx` (NEW)

Simple celebration modal when a badge is earned. Triggered from the celebration data.

```tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';

type Badge = {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

const RARITY_COLOURS: Record<string, string> = {
  common: 'var(--text-muted)',
  rare: 'var(--brand-mint)',
  epic: 'var(--brand-rose)',
  legendary: 'var(--brand-amber)'
};

export function BadgeUnlockModal({ 
  badge, 
  onClose 
}: { 
  badge: Badge; 
  onClose: () => void;
}) {
  const colour = RARITY_COLOURS[badge.rarity] || RARITY_COLOURS.common;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          cursor: 'pointer'
        }}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 250, damping: 20 }}
          style={{
            maxWidth: 400,
            width: '100%',
            padding: 32,
            background: 'var(--surface-container)',
            border: `2px solid ${colour}`,
            borderRadius: 16,
            textAlign: 'center',
            boxShadow: `0 0 60px color-mix(in srgb, ${colour} 35%, transparent)`,
            cursor: 'default'
          }}
        >
          <div className="label-caps" style={{ color: colour, marginBottom: 16 }}>
            Badge unlocked · {badge.rarity}
          </div>
          <div 
            style={{ 
              width: 96, 
              height: 96, 
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: `radial-gradient(circle, color-mix(in srgb, ${colour} 30%, transparent), transparent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem'
            }}
            aria-hidden
          >
            🏆
          </div>
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '1.75rem', 
            color: 'var(--text-main)', 
            margin: '0 0 8px 0' 
          }}>
            {badge.name}
          </h2>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.875rem', 
            lineHeight: 1.5, 
            margin: '0 0 24px 0' 
          }}>
            {badge.description}
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: 9999,
              background: colour,
              color: 'var(--cream)',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

### File 7: `src/app/quest/components/LevelUpModal.tsx` (NEW)

```tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';

export function LevelUpModal({
  fromLevel,
  toLevel,
  fromRank,
  toRank,
  onClose
}: {
  fromLevel: number;
  toLevel: number;
  fromRank: string;
  toRank: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          cursor: 'pointer'
        }}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          style={{
            maxWidth: 400,
            width: '100%',
            padding: 40,
            background: 'var(--surface-container)',
            border: '2px solid var(--brand-amber)',
            borderRadius: 16,
            textAlign: 'center',
            boxShadow: '0 0 80px color-mix(in srgb, var(--brand-amber) 40%, transparent)',
            cursor: 'default'
          }}
        >
          <div className="label-caps" style={{ color: 'var(--brand-amber)', marginBottom: 16 }}>
            Level up
          </div>
          <div 
            style={{ 
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3rem, 12vw, 5rem)',
              color: 'var(--brand-amber)',
              lineHeight: 1,
              marginBottom: 8
            }}
            aria-hidden
          >
            {toLevel}
          </div>
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '1.5rem', 
            color: 'var(--text-main)', 
            margin: '0 0 8px 0',
            letterSpacing: '0.04em'
          }}>
            {toRank}
          </h2>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.875rem', 
            lineHeight: 1.5, 
            margin: '0 0 24px 0' 
          }}>
            From {fromRank} (Lvl {fromLevel}) to {toRank} (Lvl {toLevel}). Keep going.
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '12px 28px',
              borderRadius: 9999,
              background: 'var(--brand-amber)',
              color: 'var(--cream)',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          >
            Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

### File 8: `src/app/quest/components/AbandonConfirmModal.tsx` (NEW)

The existing confirm UI is inline in the AbandonButton. Move it to a real modal with proper styling. (Optional refactor — keeping inline is fine for v1 if the design is clean. If keeping inline, skip this file.)

## Verification (Commit 3)

Deploy to Vercel preview branch. Test all 5 states:

1. **Empty state** — Test account with 0 active quests. Visit `/quest`. Confirm:
   - Empty state renders with student name
   - "Find a weakness →" button links to /pages/progress.html
   - "How does Plan Quest work?" link present (target page may 404 until Commit 6 — acceptable)

2. **Single active quest, Day 1 active** — Manually create a quest in Supabase for the test student. Confirm:
   - Page loads, shows the quest title, HUD, Day 1 unlocked + active
   - Day 2 + Day 3 shown LOCKED with countdown text "Unlocks in Xh Ym"
   - "Start Day 1" button works (links to /pages/quiz.html?...&from_quest=...&step=0)
   - Picker NOT shown (only 1 quest)

3. **Multiple active quests** — Create 3 quests (one per subject). Confirm:
   - QuestPicker shows 3 tabs at top
   - Subject-coloured chips (sage / amber / mint)
   - Clicking a tab navigates to `/quest?id=<other_quest>`
   - Active tab is highlighted

4. **Returning state** — Manually navigate to `/quest?id=<id>&completed=0&trigger=quiz&score=78`. Confirm:
   - ReturningCelebration fires on mount
   - URL is cleaned via history.replaceState
   - State updates to show Day 1 ✓
   - Day 2 LOCKED with countdown (since just completed Day 1)

5. **Day 3 outcome modal** — Manually update quest in Supabase: `current_step=2, day3_score=55, day3_outcome=NULL`. Visit /quest. Confirm:
   - Day3OutcomeModal opens automatically on mount
   - Three options visible with correct labels
   - Clicking "Try again" calls `/api/quests/<id>/day3-outcome`, redirects to new quest
   - Clicking "Slight improvement" closes the quest, refreshes page
   - Clicking "Still struggling" closes the quest with no_improvement

6. **Abandon flow** — On any active quest, click Abandon → Confirm. Verify:
   - POST `/api/quests/<id>/abandon` succeeds
   - Redirect to `/quest` (Empty state if it was the only quest)
   - quest_eligibility row deleted

Show the user the Vercel preview URL. Walk through each state with screenshots if possible.

Only proceed to Commit 5 when all 6 states verified.

---

# COMMIT 5 — progress.html quest tray + HUD strip + auto-modal

**Wait for Backend Commit 4** to be merged before this commit (you need quiz.js to have the auto-modal hook).

## What to build

### File 1: `public/js/hud-strip.js` (NEW)

Vanilla module that renders the HUD (avatar, level, XP bar, streak) shared across progress.html and dashboard.html.

```js
/**
 * hud-strip.js
 * Renders a compact HUD strip: avatar, level, XP bar, streak.
 * Reused on progress.html and dashboard.html.
 *
 * Usage:
 *   await renderHUDStrip('hud-container', { studentId });
 *
 * Fetches student_xp + student_streaks from Supabase and renders.
 */

window.renderHUDStrip = async function(containerId, { studentId }) {
  const container = document.getElementById(containerId);
  if (!container || !studentId) return;
  
  try {
    const sb = await window.getSupabase();
    
    // Parallel fetch
    const [xpRes, streakRes, studentRes] = await Promise.all([
      sb.from('student_xp').select('*').eq('student_id', studentId).maybeSingle(),
      sb.from('student_streaks').select('*').eq('student_id', studentId).maybeSingle(),
      sb.from('students').select('name, photo_url').eq('id', studentId).single()
    ]);
    
    const xp = xpRes.data || { total_xp: 0, current_level: 1, xp_in_level: 0 };
    const streak = streakRes.data || { current_days: 0, shield_count: 0 };
    const student = studentRes.data || { name: '—', photo_url: null };
    
    const xpToNext = 200 * xp.current_level;
    const xpPct = Math.min(100, (xp.xp_in_level / xpToNext) * 100);
    const rank = rankFromLevel(xp.current_level);
    
    container.innerHTML = `
      <div class="hud-strip glass-panel-1">
        <div class="hud-avatar">
          ${student.photo_url 
            ? `<img src="${escapeHtml(student.photo_url)}" alt="${escapeHtml(student.name)}">`
            : `<div class="hud-avatar-placeholder" aria-hidden>👨‍🚀</div>`
          }
        </div>
        <div class="hud-info">
          <div class="hud-info-row">
            <span class="hud-name">${escapeHtml(student.name)}</span>
            <span class="quest-chip quest-chip-mint">
              Lvl ${xp.current_level} · ${escapeHtml(rank)}
            </span>
          </div>
          <div class="hud-xp-row">
            <div class="quest-xp-track">
              <div class="quest-xp-fill" style="width: ${xpPct}%;"></div>
            </div>
            <span class="label-caps hud-xp-label">${xp.xp_in_level}/${xpToNext}</span>
          </div>
        </div>
        <div class="hud-streak" title="${streak.shield_count} streak shield(s)">
          <div class="quest-flame" aria-hidden>🔥</div>
          <div class="label-caps hud-streak-days">${streak.current_days}d</div>
          ${streak.shield_count > 0 
            ? `<div class="label-caps hud-streak-shield">🛡 ${streak.shield_count}</div>` 
            : ''
          }
        </div>
      </div>
    `;
  } catch (err) {
    console.error('HUD strip render failed:', err);
    container.innerHTML = '';  // Fail silently — HUD is non-essential
  }
};

function rankFromLevel(level) {
  if (level >= 50) return 'Legend';
  if (level >= 40) return 'Vanguard';
  if (level >= 30) return 'Commander';
  if (level >= 20) return 'Captain';
  if (level >= 15) return 'Lieutenant';
  if (level >= 10) return 'Specialist';
  if (level >= 5) return 'Operator';
  return 'Cadet';
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
```

Add minimum CSS to `public/css/style.css` for `.hud-strip` layout (flex row, 3 columns). Use existing tokens — no new colours.

### File 2: `public/js/progress.js` (MODIFY)

Read the file. Find the existing `renderQuestMap()` function. Replace with `renderQuestTray()` that:

- Fetches all active quests for the student via `GET /api/quests`
- Renders 0-3 tiles, each linking to `/quest?id=<quest.id>`
- Each tile shows: subject icon (coloured), topic name, "Day X of 3" with progress bar
- Empty state: "No active quests. Spot a weakness below to start one."

```js
async function renderQuestTray(studentId) {
  const container = document.getElementById('quest-map-section') || document.getElementById('quest-tray-section');
  if (!container) return;
  
  try {
    const sb = await window.getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    
    const res = await fetch(`/api/quests?student_id=${studentId}`, {
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    });
    const { quests } = await res.json();
    
    if (!quests || quests.length === 0) {
      container.innerHTML = `
        <div class="glass-panel-1 quest-tray-empty">
          <div class="label-caps quest-tray-label">⚡ Active Quests</div>
          <p class="text-muted">No active quests. Spot a weakness below to start one.</p>
        </div>
      `;
      return;
    }
    
    const subjectColours = { 
      mathematics: 'var(--brand-sage)', 
      science: 'var(--brand-amber)', 
      english: 'var(--brand-mint)' 
    };
    
    const tiles = quests.map(q => {
      const colour = subjectColours[q.subject] || 'var(--brand-sage)';
      const dayPct = ((q.current_step + 1) / 3) * 100;
      return `
        <a href="/quest?id=${q.id}" class="quest-tray-tile" style="--accent: ${colour};">
          <div class="quest-tray-tile-header">
            <span class="quest-tray-tile-subject">${escapeHtml(q.subject)}</span>
            <span class="quest-tray-tile-day">Day ${q.current_step + 1} of 3</span>
          </div>
          <div class="quest-tray-tile-topic">${escapeHtml(q.topic)}</div>
          <div class="quest-tray-tile-bar">
            <div class="quest-tray-tile-fill" style="width: ${dayPct}%;"></div>
          </div>
        </a>
      `;
    }).join('');
    
    container.innerHTML = `
      <div class="glass-panel-1 quest-tray">
        <div class="label-caps quest-tray-label">⚡ Active Quests</div>
        <div class="quest-tray-tiles">${tiles}</div>
      </div>
    `;
  } catch (err) {
    console.error('Quest tray render failed:', err);
  }
}
```

Add CSS classes for `.quest-tray-tile` etc. to style.css. Use the `--accent` CSS variable hack so each tile picks up its subject colour from the `style` attribute.

**Modify the "Generate Quest" buttons in the weakness section:**

Find the existing weak-topics rendering. For each topic's button:

```js
// On render: check if subject slot is taken
const eligibilityRes = await fetch(`/api/quests?student_id=${studentId}`, { headers });
const activeQuests = (await eligibilityRes.json()).quests || [];
const subjectSlotsTaken = new Set(activeQuests.map(q => q.subject));

weakTopics.forEach(topic => {
  const slotTaken = subjectSlotsTaken.has(topic.subject);
  const existingQuest = activeQuests.find(q => q.subject === topic.subject);
  
  const buttonHtml = slotTaken
    ? `<button class="btn btn-secondary" disabled title="You already have an active ${topic.subject} quest">
         + Generate Quest (slot taken)
       </button>
       <a href="/quest?id=${existingQuest.id}" class="btn btn-ghost">View existing →</a>`
    : `<button class="btn btn-primary" onclick="generateQuestFor('${topic.subject}', '${topic.level}', '${topic.topic}', ${topic.score})">
         + Generate Quest
       </button>`;
  // ... render with buttonHtml
});

window.generateQuestFor = async function(subject, level, topic, triggerScore) {
  const sb = await window.getSupabase();
  const { data: { session } } = await sb.auth.getSession();
  const studentId = window.currentStudentId;  // assume set elsewhere
  
  const res = await fetch('/api/generate-quest', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${session?.access_token}`, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ student_id: studentId, subject, level, topic, trigger_score: triggerScore })
  });
  
  const data = await res.json();
  if (res.ok) {
    window.location.href = `/quest?id=${data.quest.id}`;
  } else if (res.status === 409) {
    alert(`You already have an active ${subject} quest. Click "View existing" to continue it.`);
  } else {
    alert('Failed to generate quest: ' + (data.error || 'Unknown error'));
  }
};
```

**Wire HUD strip:**

In progress.js init, after student is resolved:

```js
// Render HUD strip
if (window.renderHUDStrip) {
  await window.renderHUDStrip('progress-hud-strip', { studentId: student.id });
}
```

Add `<div id="progress-hud-strip"></div>` near the top of `pages/progress.html`. Include `<script src="/js/hud-strip.js"></script>` in the script tags.

### File 3: `pages/dashboard.html` and any dashboard.js (MODIFY if dashboard exists)

Same pattern: add `<div id="dashboard-hud-strip"></div>` and call `renderHUDStrip` from the dashboard's init function. Check repo first to see if dashboard already has a HUD-like widget — if yes, replace; if no, add.

### File 4: CSS additions to `public/css/style.css`

Add these classes (zero hardcoded hex):

```css
/* HUD strip */
.hud-strip {
  display: flex;
  gap: var(--space-6);
  align-items: center;
  padding: var(--space-4);
  margin-bottom: var(--space-6);
}
.hud-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--sage-dark);
  display: flex;
  align-items: center;
  justify-content: center;
}
.hud-avatar img { width: 100%; height: 100%; object-fit: cover; }
.hud-avatar-placeholder { font-size: 1.6rem; }
.hud-info { flex: 1; min-width: 0; }
.hud-info-row { display: flex; gap: var(--space-3); align-items: baseline; flex-wrap: wrap; margin-bottom: var(--space-2); }
.hud-name { font-weight: 700; color: var(--text-main); }
.hud-xp-row { display: flex; align-items: center; gap: var(--space-3); }
.hud-xp-label { color: var(--text-muted); white-space: nowrap; }
.hud-streak { display: flex; flex-direction: column; align-items: center; gap: 2px; flex-shrink: 0; }
.hud-streak-days { color: var(--brand-amber); line-height: 1; }
.hud-streak-shield { color: var(--brand-mint); line-height: 1; }

/* Quest tray on progress.html */
.quest-tray { padding: var(--space-4); }
.quest-tray-label { color: var(--brand-rose); margin-bottom: var(--space-3); }
.quest-tray-tiles { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); 
  gap: var(--space-3);
}
.quest-tray-tile {
  display: block;
  padding: var(--space-4);
  border-radius: 12px;
  border: 1.5px solid var(--accent, var(--border-light));
  background: color-mix(in srgb, var(--accent, var(--surface-elevated)) 8%, transparent);
  text-decoration: none;
  color: var(--text-main);
  transition: transform 200ms ease;
}
.quest-tray-tile:hover { transform: translateY(-2px); }
.quest-tray-tile-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: var(--space-2); 
  font-size: 0.75rem; 
  text-transform: uppercase; 
  color: var(--accent); 
  font-weight: 600; 
}
.quest-tray-tile-topic { 
  font-family: var(--font-display); 
  font-size: 1.25rem; 
  margin-bottom: var(--space-3); 
  color: var(--text-main); 
}
.quest-tray-tile-bar { 
  height: 4px; 
  border-radius: 9999px; 
  background: var(--surface-elevated); 
  overflow: hidden; 
}
.quest-tray-tile-fill { 
  height: 100%; 
  background: var(--accent); 
  border-radius: inherit; 
  transition: width 400ms ease;
}
.quest-tray-empty { padding: var(--space-4); }

@media (max-width: 480px) {
  .quest-tray-tiles { grid-template-columns: 1fr; }
}
```

## Verification (Commit 5)

1. **Quest tray with 0 active:** Test account with no active quests. Visit `/pages/progress.html`. Confirm empty state message renders. No errors in console.

2. **Quest tray with 1 active:** Create one Maths quest. Visit progress.html. Confirm:
   - Single tile renders with sage colour accent
   - Day progress bar shows correct day (1/3 = 33%)
   - Click tile → navigates to `/quest?id=<that_quest>`

3. **Quest tray with 3 active:** Create one quest per subject. Confirm:
   - 3 tiles render in a grid (or stacked on mobile)
   - Each has correct subject colour (sage / amber / mint)
   - All link to their respective quest

4. **Generate Quest concurrency UI:** With 1 Maths quest active, scroll to weak topics section. Confirm:
   - Maths topics show "+ Generate Quest (slot taken)" disabled with "View existing →" link
   - English/Science topics show enabled "+ Generate Quest" button
   - Click an enabled English button → POST succeeds → redirect to /quest?id=<new>
   - Try clicking a Maths topic via dev tools (forcing the POST) → server returns 409 → toast appears

5. **HUD strip on progress.html:** Confirm:
   - Avatar (or placeholder) renders
   - Name, level, rank, XP bar all populated from real data
   - Streak count shows from student_streaks
   - On mobile (375px): renders cleanly, no overflow

6. **HUD strip on dashboard.html:** Same checks if dashboard has the slot.

7. **Auto-modal trigger from quiz.js:** This was wired by Backend Commit 4. Verify:
   - Take a quiz, deliberately score ≤ 70% on a Maths topic with no active Maths quest
   - Modal appears: "Want a 3-day Plan Quest for [topic]?"
   - Click "Yes, generate" → quest created, redirect to /quest

   - Take another quiz with score ≤ 70% on Maths after Maths quest exists
   - Modal does NOT appear (eligibility check blocks it)

Show the user before/after screenshots of progress.html. Confirm Lighthouse mobile score ≥ 90 unchanged (or improved).

---

# Final pre-merge checklist (Frontend stream)

- [ ] Both commits pushed to `feynman82/Superholic-Lab/main`
- [ ] All 6 states on /quest verified (Empty, Single, Picker, Returning, Day3 modal, Abandon)
- [ ] All 7 progress.html scenarios verified (0/1/3 quests, eligibility gating, HUD on both pages, auto-modal)
- [ ] Vercel preview deployed cleanly (no build errors, no console errors)
- [ ] Mobile responsive (375px) — all states render without horizontal scroll
- [ ] Lighthouse mobile ≥ 90 on /pages/progress.html and /quest
- [ ] No new hardcoded hex/rgba in HTML `style=` attributes
- [ ] All new SVGs (if any) added to BOTH icons.js and icons/index.tsx
- [ ] BadgeUnlockModal and LevelUpModal trigger correctly from celebrationData

The Lily Tan E2E test from QUEST_PAGE_SPEC.md §18 is the joint gate — Backend stream's commit 4 + your commit 3 + your commit 5 all must work together for that test to pass. Coordinate with Backend stream. Both must verify before declaring Phase 3 complete.

If you're unsure about anything, **stop and ask the user a question**. We are building the third pillar of the platform. Quality > speed.

---

**End of frontend handoff prompt.**
