"use client"

/**
 * src/app/quest/QuestClient.tsx
 * Phase 3 — wired to real Supabase auth + /api/quests/* endpoints.
 *
 * Data flow:
 *   mount → auth.getSession() → /api/quests (list) →
 *     0 quests     → EmptyState
 *     1 quest      → fetch /api/quests/:id → render quest detail
 *     2–3 quests   → QuestPicker → user selects → fetch /api/quests/:id
 *   ?returning=true → read sessionStorage for CelebrationData → ReturningCelebration
 *   ?pending_outcome=true → show Day3OutcomeModal
 *
 * URL params consumed:
 *   quest_id       — skip QuestPicker, go straight to this quest
 *   returning      — trigger ReturningCelebration from sessionStorage
 *   pending_outcome — show Day3OutcomeModal (set by quiz.js when score < 70%)
 *   score          — Day 3 score passed from quiz.js redirect
 *
 * Architect-Scholar rules:
 *   - All colours via CSS variables; zero hardcoded hex/rgba
 *   - Bebas Neue enforced ≥ 32px (clamp floor)
 *   - Glassmorphism via .card-glass utility class
 */

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Icon } from "../../components/icons"
import { ReturningCelebration, type CelebrationData } from "./components/ReturningCelebration"
import { EmptyState } from "./components/EmptyState"
import { QuestPicker } from "./components/QuestPicker"
import { Day3OutcomeModal } from "./components/Day3OutcomeModal"

// ─── Supabase client (anon key — RLS enforced) ───────────────────────────────
const SUPABASE_URL      = "https://rlmqsbxevuutugtyysjr.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbXFzYnhldnV1dHVndHl5c2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNjIxMTgsImV4cCI6MjA4OTczODExOH0.QIgtg-1WYBV0ySqUS5RsANWaux2dg_lw5Ze5j5gOZSU"

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

// ─── rankFromLevel (mirrors badge-engine.js — kept in sync manually) ─────────
function rankFromLevel(level: number): string {
  if (level >= 50) return "Legend"
  if (level >= 40) return "Vanguard"
  if (level >= 30) return "Commander"
  if (level >= 20) return "Captain"
  if (level >= 15) return "Lieutenant"
  if (level >= 10) return "Specialist"
  if (level >=  5) return "Operator"
  return "Cadet"
}

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

type QuestStep = {
  day: number
  type: "quiz" | "tutor"
  title: string
  description: string
  estimated_minutes: number
  action_url: string
  config?: Record<string, unknown>
}

type DayUnlockStatus = {
  unlocked: boolean
  completed: boolean
  reason?: "previous_step_incomplete" | "midnight_gate"
  unlocks_at?: string
}

type Quest = {
  id: string
  student_id: string
  subject: string
  level: string
  topic: string
  trigger_score: number
  quest_title: string
  steps: QuestStep[]
  current_step: number
  status: "active" | "completed" | "abandoned"
  created_at: string
  day_completed_at?: Record<string, string>
  day1_wrong_attempts?: unknown[]
  day3_score?: number | null
  day3_outcome?: string | null
  parent_quest_id?: string | null
  abandoned_at?: string | null
}

type QuestDetail = Quest & {
  day_unlock_status: Record<number, DayUnlockStatus>
}

type Student = {
  id: string
  name: string
  level: string
  photo_url: string
}

type HUD = {
  level: number
  rank: string
  total_xp: number
  xp_in_level: number
  xp_to_next_level: number
  streak_days: number
  shield_count: number
}

type Diagnosis = {
  topic: string
  current_al: number
  current_pct: number
  unlocks: string[]
}

type QuestClientProps = {
  searchParams: Record<string, string | string[] | undefined>
}

type LoadState = "loading" | "error" | "empty" | "picking" | "quest"

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function sp(params: Record<string, string | string[] | undefined>, key: string): string {
  const v = params[key]
  return Array.isArray(v) ? v[0] ?? "" : v ?? ""
}

async function apiFetch(url: string, token: string, opts: RequestInit = {}) {
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers ?? {}),
    },
  })
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function QuestClient({ searchParams }: QuestClientProps) {
  const [loadState,       setLoadState]       = useState<LoadState>("loading")
  const [errorMsg,        setErrorMsg]        = useState("")
  const [quests,          setQuests]          = useState<Quest[]>([])
  const [questDetail,     setQuestDetail]     = useState<QuestDetail | null>(null)
  const [student,         setStudent]         = useState<Student | null>(null)
  const [hud,             setHud]             = useState<HUD | null>(null)
  const [diagnosis,       setDiagnosis]       = useState<Diagnosis | null>(null)
  const [token,           setToken]           = useState("")
  const [activeCelebration, setActiveCelebration] = useState<CelebrationData | null>(null)
  const [showDay3Modal,   setShowDay3Modal]   = useState(false)

  // ─── Init ───────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          window.location.href = "/pages/login.html"
          return
        }
        const accessToken = session.access_token
        setToken(accessToken)

        // Resolve student_id — quest data is student-scoped, not parent-scoped.
        // progress.html sets shl_active_student_id in localStorage when it
        // selects a student; generateQuestFor also passes ?student= in the URL.
        const paramStudentId = sp(searchParams, "student")
        const studentId: string =
          paramStudentId ||
          (typeof window !== "undefined"
            ? localStorage.getItem("shl_active_student_id") ?? ""
            : "")

        if (!studentId) {
          // No student context — send user to progress page to pick a student
          setLoadState("empty")
          return
        }

        // Parallel: fetch quests list + student profile + HUD
        const [questsRes, studentRes, xpRes, streakRes] = await Promise.all([
          apiFetch(`/api/quests?student_id=${encodeURIComponent(studentId)}`, accessToken),
          supabase.from("students")
            .select("id, name, level, photo_url")
            .eq("id", studentId)
            .single(),
          supabase.from("student_xp")
            .select("total_xp, current_level, xp_in_level")
            .eq("student_id", studentId)
            .maybeSingle(),
          supabase.from("student_streaks")
            .select("current_days, shield_count")
            .eq("student_id", studentId)
            .maybeSingle(),
        ])

        if (!questsRes.ok) throw new Error("Failed to load quests")
        const questsData = await questsRes.json()
        const activeQuests: Quest[] = (questsData.quests ?? []).filter(
          (q: Quest) => q.status === "active"
        )

        // Build student + HUD from Supabase data
        const studentData = studentRes.data
        const xp          = xpRes.data
        const streak      = streakRes.data
        const level       = xp?.current_level ?? 1

        setStudent({
          id:        studentId,
          name:      studentData?.name ?? session.user.email?.split("@")[0] ?? "Student",
          level:     studentData?.level ?? "Primary 5",
          photo_url: studentData?.photo_url ?? "/assets/avatars/placeholder_space_marine.png",
        })

        setHud({
          level,
          rank:            rankFromLevel(level),
          total_xp:        xp?.total_xp ?? 0,
          xp_in_level:     xp?.xp_in_level ?? 0,
          xp_to_next_level: 200 * level,
          streak_days:     streak?.current_days ?? 0,
          shield_count:    streak?.shield_count ?? 0,
        })

        if (activeQuests.length === 0) {
          setLoadState("empty")
          return
        }

        // Determine which quest to load.
        // Accept both ?quest_id= (legacy/spec) and ?id= (generateQuestFor + quiz.js/tutor.js).
        const paramQuestId = sp(searchParams, "quest_id") || sp(searchParams, "id")
        let targetId = paramQuestId

        if (!targetId) {
          if (activeQuests.length === 1) {
            targetId = activeQuests[0].id
          } else {
            setQuests(activeQuests)
            setLoadState("picking")
            return
          }
        }

        await loadQuest(targetId, accessToken, studentId)
      } catch (err: unknown) {
        console.error("[QuestClient] init error:", err)
        setErrorMsg("Something went wrong loading your quest. Please try again.")
        setLoadState("error")
      }
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Load quest detail ──────────────────────────────────────────
  async function loadQuest(questId: string, accessToken: string, studentId: string) {
    const res = await apiFetch(`/api/quests/${questId}`, accessToken)
    if (!res.ok) throw new Error("Failed to load quest detail")
    const data = await res.json()
    const detail: QuestDetail = data.quest
      ? { ...data.quest, day_unlock_status: data.day_unlock_status ?? {} }
      : data

    setQuestDetail(detail)

    // Diagnosis from mastery_levels
    const supabase = getSupabase()
    const { data: mastery } = await supabase.from("mastery_levels")
      .select("al_band, pct_correct")
      .eq("student_id", studentId)
      .eq("subject",    detail.subject.toLowerCase())
      .eq("topic",      detail.topic)
      .maybeSingle()

    setDiagnosis({
      topic:       detail.topic,
      current_al:  mastery?.al_band  ?? 5,
      current_pct: mastery?.pct_correct ?? detail.trigger_score,
      unlocks:     [],
    })

    // Check for celebration data in sessionStorage
    const isReturning = sp(searchParams, "returning") === "true"
    if (isReturning) {
      const raw = sessionStorage.getItem(`quest_celebration_${questId}`)
      if (raw) {
        try {
          setActiveCelebration(JSON.parse(raw))
        } catch { /* malformed — skip */ }
        sessionStorage.removeItem(`quest_celebration_${questId}`)
      }
    }

    // Check for pending Day 3 outcome (score < 70%)
    const isPendingOutcome = sp(searchParams, "pending_outcome") === "true"
    if (isPendingOutcome) {
      setShowDay3Modal(true)
    }

    // Clean up URL params without re-render
    if (typeof window !== "undefined" && (isReturning || isPendingOutcome)) {
      const url = new URL(window.location.href)
      url.searchParams.delete("returning")
      url.searchParams.delete("pending_outcome")
      url.searchParams.delete("score")
      window.history.replaceState({}, "", url.toString())
    }

    setLoadState("quest")
  }

  // ─── Quest picker selection ─────────────────────────────────────
  async function handlePickQuest(questId: string) {
    setLoadState("loading")
    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = "/pages/login.html"; return }
      await loadQuest(questId, session.access_token, student?.id ?? session.user.id)
    } catch (err: unknown) {
      console.error("[QuestClient] handlePickQuest error:", err)
      setErrorMsg("Failed to load quest. Please try again.")
      setLoadState("error")
    }
  }

  // ─── Day 3 outcome: user chose redo / slight / no improvement ──
  async function handleDay3OutcomeDone(outcome: "redo" | "slight_improvement" | "no_improvement") {
    setShowDay3Modal(false)
    if (outcome === "redo" && questDetail) {
      // Navigate to progress page; a new redo quest will be generated there
      window.location.href = `/pages/progress.html?redo_quest=${questDetail.id}`
    } else {
      // Refresh quest data
      if (questDetail) {
        setLoadState("loading")
        try {
          const supabase = getSupabase()
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) { window.location.href = "/pages/login.html"; return }
          await loadQuest(questDetail.id, session.access_token, student?.id ?? session.user.id)
        } catch {
          setLoadState("quest")
        }
      }
    }
  }

  // ─── Nav active state ───────────────────────────────────────────
  useEffect(() => {
    customElements.whenDefined("global-bottom-nav").then(() => {
      const nav = document.querySelector("global-bottom-nav") as HTMLElement & {
        setQuestActive?: (v: boolean) => void
        setActive?: (slug: string) => void
      }
      nav?.setQuestActive?.(true)
      nav?.setActive?.("quest")
    })
  }, [])

  // ─── Render guards ──────────────────────────────────────────────
  if (loadState === "loading") return <QuestLoadingSkeleton />

  if (loadState === "error") {
    return (
      <main style={{ minHeight: "100vh", paddingTop: "calc(var(--navbar-h) + 64px)", paddingBottom: 96, textAlign: "center" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 24px" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 24px",
              borderRadius: 9999,
              background: "var(--brand-rose)",
              color: "var(--white)",
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </main>
    )
  }

  if (loadState === "empty") {
    return (
      <main style={{ minHeight: "100vh", paddingTop: "calc(var(--navbar-h) + 32px)", paddingBottom: 96 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 16px" }}>
          <EmptyState />
        </div>
      </main>
    )
  }

  if (loadState === "picking") {
    return (
      <main style={{ minHeight: "100vh", paddingTop: "calc(var(--navbar-h) + 32px)", paddingBottom: 96 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 16px" }}>
          {student && hud && <HUDStrip student={student} hud={hud} />}
          <QuestPicker quests={quests} onSelect={handlePickQuest} />
        </div>
      </main>
    )
  }

  if (!questDetail || !student || !hud) return <QuestLoadingSkeleton />

  const dayUnlockStatus = questDetail.day_unlock_status ?? {}
  const isQuestComplete = questDetail.status === "completed"
  const activeStepIndex = questDetail.current_step
  const activeStep = questDetail.steps[activeStepIndex]

  // Day 3 score for modal (passed via URL param from quiz.js redirect)
  const day3Score = Number(sp(searchParams, "score") || "0")

  return (
    <>
      {/* Celebration overlay — post-step return */}
      <AnimatePresence>
        {activeCelebration && (
          <ReturningCelebration
            data={activeCelebration}
            onDismiss={() => setActiveCelebration(null)}
          />
        )}
      </AnimatePresence>

      {/* Day 3 outcome picker (score < 70%) */}
      {showDay3Modal && (
        <Day3OutcomeModal
          questId={questDetail.id}
          score={day3Score}
          token={token}
          onDone={handleDay3OutcomeDone}
        />
      )}

      <main
        style={{
          minHeight: "100vh",
          paddingTop: "calc(var(--navbar-h) + var(--space-8))",
          paddingBottom: 96,
          position: "relative",
          overflow: "hidden",
          color: "var(--text-main)",
        }}
      >
        <div
          style={{
            position: "relative",
            maxWidth: 760,
            margin: "0 auto",
            padding: "0 16px",
          }}
        >
          {/* HUD STRIP */}
          <HUDStrip student={student} hud={hud} />

          {/* HERO BAND */}
          <QuestHero quest={questDetail} />

          {/* TIMELINE */}
          <QuestTimeline
            steps={questDetail.steps}
            dayUnlockStatus={dayUnlockStatus}
          />

          {/* ACTIVE DAY CARD */}
          {!isQuestComplete && activeStep && (
            <ActiveDayCard
              step={activeStep}
              stepIndex={activeStepIndex}
              questId={questDetail.id}
              unlockStatus={dayUnlockStatus[activeStepIndex]}
            />
          )}

          {/* QUEST COMPLETE STATE */}
          {isQuestComplete && (
            <QuestCompleteCard outcome={questDetail.day3_outcome ?? "completed"} />
          )}

          {/* DIAGNOSIS CARD */}
          {diagnosis && <DiagnosisCard diagnosis={diagnosis} />}

          {/* COMING NEXT */}
          <DayAccordion
            steps={questDetail.steps}
            dayUnlockStatus={dayUnlockStatus}
            currentStep={activeStepIndex}
          />

          {/* ABANDON */}
          {!isQuestComplete && (
            <AbandonButton questId={questDetail.id} token={token} />
          )}
        </div>
      </main>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════

function QuestLoadingSkeleton() {
  return (
    <main style={{ minHeight: "100vh", paddingTop: "calc(var(--navbar-h) + 64px)", paddingBottom: 96 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 16px" }}>
        {[100, 160, 120, 200].map((h, i) => (
          <div
            key={i}
            style={{
              height: h,
              borderRadius: 14,
              background: "var(--surface-container)",
              marginBottom: 32,
              animation: "shimmer 1.5s ease infinite",
            }}
          />
        ))}
      </div>
    </main>
  )
}

// ═══════════════════════════════════════════════════════════════════
// HUD STRIP — avatar, XP bar, level, streak
// ═══════════════════════════════════════════════════════════════════

function HUDStrip({ student, hud }: { student: Student; hud: HUD }) {
  const xpPct = Math.min(100, (hud.xp_in_level / hud.xp_to_next_level) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card-glass"
      style={{
        marginTop: 32,
        marginBottom: 32,
        display: "flex",
        gap: 24,
        alignItems: "center",
      }}
    >
      <AvatarSlot photoUrl={student.photo_url} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-main)" }}>
            {student.name}
          </span>
          <span className="quest-chip quest-chip-mint">
            Lvl {hud.level} · {hud.rank}
          </span>
        </div>

        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 16 }}>
          <div className="quest-xp-track">
            <motion.div
              className="quest-xp-fill"
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            />
          </div>
          <span className="label-caps" style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {hud.xp_in_level}/{hud.xp_to_next_level}
          </span>
        </div>
      </div>

      <StreakFlame days={hud.streak_days} shieldCount={hud.shield_count} />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// AVATAR SLOT — circle with rotating magic ring
// ═══════════════════════════════════════════════════════════════════

function AvatarSlot({ photoUrl: _ }: { photoUrl: string }) {
  return (
    <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -3,
          borderRadius: "50%",
          background: "conic-gradient(from 0deg, var(--brand-rose), var(--brand-mint), var(--brand-amber), var(--brand-rose))",
          animation: "questAuraSpin 6s linear infinite",
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "var(--brand-sage)",
          padding: 2,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--brand-rose) 20%, transparent), var(--sage-dark))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            fontSize: "1.6rem",
          }}
        >
          <span aria-label="avatar placeholder">👨‍🚀</span>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// STREAK FLAME
// ═══════════════════════════════════════════════════════════════════

function StreakFlame({ days, shieldCount }: { days: number; shieldCount: number }) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}
      title={shieldCount > 0 ? `${shieldCount} streak shield(s) in stock` : "No shields"}
    >
      <div className="quest-flame" aria-hidden>
        <Icon name="flame" size={28} />
      </div>
      <div className="label-caps" style={{ color: "var(--brand-amber)", lineHeight: 1 }}>{days}d</div>
      {shieldCount > 0 && (
        <div
          className="label-caps"
          style={{ color: "var(--brand-mint)", lineHeight: 1, display: "inline-flex", alignItems: "center", gap: 2 }}
          aria-label={`${shieldCount} shield`}
        >
          <Icon name="shield" size={10} />
          {shieldCount}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// QUEST HERO — title, subject, day progress
// ═══════════════════════════════════════════════════════════════════

function QuestHero({ quest }: { quest: QuestDetail }) {
  const dayDisplay  = `Day ${quest.current_step + 1} of ${quest.steps.length}`
  const subjectLabel = quest.subject.charAt(0).toUpperCase() + quest.subject.slice(1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      style={{ textAlign: "center", marginBottom: 40 }}
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <span className="quest-chip quest-chip-mint">{subjectLabel} · {quest.level}</span>
        <span className="quest-chip quest-chip-rose">{dayDisplay}</span>
      </div>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2rem, 7vw, 3.5rem)",
          letterSpacing: "0.04em",
          lineHeight: 1.0,
          margin: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5em",
          justifyContent: "center",
        }}
      >
        <span style={{ display: "inline-flex", color: "var(--brand-rose)", flexShrink: 0 }} aria-hidden>
          <Icon name="quest" size={36} />
        </span>
        <span
          style={{
            background: "linear-gradient(90deg, var(--sage-dark), var(--brand-rose))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {quest.quest_title}
        </span>
      </h1>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// QUEST TIMELINE — 3-node timeline driven by dayUnlockStatus
// ═══════════════════════════════════════════════════════════════════

function QuestTimeline({
  steps,
  dayUnlockStatus,
}: {
  steps: QuestStep[]
  dayUnlockStatus: Record<number, DayUnlockStatus>
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="card-glass"
      style={{ marginBottom: 40 }}
    >
      <div className="quest-timeline-track">
        {steps.map((step, i) => {
          const status    = dayUnlockStatus[i] ?? { unlocked: i === 0, completed: false }
          const isDone    = status.completed
          const isActive  = status.unlocked && !status.completed
          const isMidnightGate = !status.unlocked && status.reason === "midnight_gate"

          const nodeClass  = isDone ? "quest-node-done" : isActive ? "quest-node-active" : "quest-node-locked"
          const labelClass = isDone ? "quest-label-done" : isActive ? "quest-label-active" : "quest-label-locked"

          return (
            <div key={step.day} className="quest-timeline-item">
              <div className="quest-timeline-node-wrapper">
                {isActive && <div aria-hidden className="quest-pulse-ring" />}
                <div className={`quest-timeline-node ${nodeClass}`}>
                  {isDone ? "✓" : isActive ? step.day : <Icon name="lock" size={22} />}
                </div>
              </div>

              <div className={`quest-node-label ${labelClass}`}>Day {step.day}</div>

              <div
                style={{
                  fontSize: "0.7rem",
                  color: isActive ? "var(--brand-rose)" : "var(--text-muted)",
                  opacity: 0.8,
                  marginTop: 2,
                }}
              >
                {isMidnightGate && status.unlocks_at ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Icon name="lock" size={10} />
                    {new Date(status.unlocks_at).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                ) : step.type === "tutor" ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Icon name="tutor" size={12} /> Tutor
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Icon name="quiz" size={12} /> Quiz
                  </span>
                )}
              </div>

              {i < steps.length - 1 && (
                <div
                  aria-hidden
                  className={`quest-timeline-connector ${isDone ? "quest-connector-filled" : ""}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ACTIVE DAY CARD — today's mission (or locked midnight-gate state)
// ═══════════════════════════════════════════════════════════════════

function ActiveDayCard({
  step,
  stepIndex,
  questId,
  unlockStatus,
}: {
  step: QuestStep
  stepIndex: number
  questId: string
  unlockStatus?: DayUnlockStatus
}) {
  // Replace the QUEST_ID placeholder the backend stores in action_url
  const resolvedUrl = step.action_url.replace("QUEST_ID", questId)
  const ctaUrl = resolvedUrl.includes("step=") ? resolvedUrl : `${resolvedUrl}&step=${stepIndex}`

  const isMidnightGated = unlockStatus && !unlockStatus.unlocked && unlockStatus.reason === "midnight_gate"
  const unlockTime = isMidnightGated && unlockStatus?.unlocks_at
    ? new Date(unlockStatus.unlocks_at).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "relative", marginBottom: 40 }}
    >
      {/* Corner accents */}
      {[
        { top: -6, left: -6, borderTop: "2px solid var(--brand-rose)", borderLeft: "2px solid var(--brand-rose)" },
        { top: -6, right: -6, borderTop: "2px solid var(--brand-rose)", borderRight: "2px solid var(--brand-rose)" },
        { bottom: -6, left: -6, borderBottom: "2px solid var(--brand-rose)", borderLeft: "2px solid var(--brand-rose)" },
        { bottom: -6, right: -6, borderBottom: "2px solid var(--brand-rose)", borderRight: "2px solid var(--brand-rose)" },
      ].map((s, i) => (
        <div key={i} aria-hidden style={{ position: "absolute", width: 18, height: 18, ...s }} />
      ))}

      <motion.div
        animate={isMidnightGated ? {} : { y: [0, -4, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="card-glass"
        style={{
          borderColor: isMidnightGated
            ? "var(--border-light)"
            : "color-mix(in srgb, var(--brand-rose) 40%, transparent)",
          boxShadow: isMidnightGated
            ? "none"
            : "0 0 32px color-mix(in srgb, var(--brand-rose) 18%, transparent)",
          padding: 40,
          opacity: isMidnightGated ? 0.7 : 1,
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <span
            className="label-caps"
            style={{
              color: isMidnightGated ? "var(--text-muted)" : "var(--brand-rose)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {isMidnightGated ? <Icon name="lock" size={14} /> : <Icon name="play" size={14} />}
            {isMidnightGated ? `Unlocks at ${unlockTime}` : "Today's Mission"}
          </span>
          <span className="label-caps" style={{ color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span aria-hidden style={{ opacity: 0.7 }}>≈</span>
            {step.estimated_minutes} min
          </span>
        </div>

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 4vw, 2.2rem)",
            letterSpacing: "0.02em",
            color: "var(--text-main)",
            margin: "0 0 16px 0",
            lineHeight: 1.1,
          }}
        >
          {step.title}
        </h2>

        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 32px 0" }}>
          {step.description}
        </p>

        <div style={{ textAlign: "center" }}>
          {isMidnightGated ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                borderRadius: 9999,
                background: "var(--surface-container)",
                color: "var(--text-muted)",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              <Icon name="lock" size={16} />
              Come back after midnight SGT
            </span>
          ) : (
            <Link
              href={ctaUrl}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "16px 32px",
                borderRadius: 9999,
                background: "linear-gradient(90deg, var(--brand-rose), var(--brand-rose-hover), var(--brand-mint), var(--brand-rose-hover), var(--brand-rose))",
                backgroundSize: "300% 100%",
                animation: "questGlowSweep 4s ease infinite",
                color: "var(--text-main)",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                boxShadow: "0 4px 20px color-mix(in srgb, var(--brand-mint) 25%, transparent)",
                minHeight: 48,
                transition: "transform 150ms ease",
              }}
            >
              <Icon name="play" size={18} />
              <span>Start Day {step.day}</span>
              <span style={{ fontSize: "1.1rem", marginLeft: 4 }}>→</span>
            </Link>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// QUEST COMPLETE CARD
// ═══════════════════════════════════════════════════════════════════

function QuestCompleteCard({ outcome }: { outcome: string }) {
  const isMastered = outcome === "mastered"
  const label = isMastered ? "Quest Mastered!" : outcome === "slight_improvement" ? "Good Progress!" : "Quest Complete"

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="card-glass"
      style={{
        textAlign: "center",
        padding: 48,
        marginBottom: 40,
        borderColor: isMastered ? "var(--brand-mint)" : "var(--brand-amber)",
      }}
    >
      <div style={{ fontSize: "3rem", marginBottom: 16 }}>{isMastered ? "🏆" : "✅"}</div>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2rem, 5vw, 2.5rem)",
          letterSpacing: "0.04em",
          color: isMastered ? "var(--brand-mint)" : "var(--brand-amber)",
          margin: "0 0 12px 0",
        }}
      >
        {label}
      </h2>
      <p style={{ color: "var(--text-muted)", marginBottom: 28 }}>
        This quest is complete. Visit your Progress page to see what's next.
      </p>
      <Link
        href="/pages/progress.html"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 24px",
          borderRadius: 9999,
          background: "var(--brand-mint)",
          color: "var(--brand-sage)",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        <Icon name="progress" size={16} />
        View Progress
      </Link>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// DIAGNOSIS CARD — "Why this quest?"
// ═══════════════════════════════════════════════════════════════════

function DiagnosisCard({ diagnosis }: { diagnosis: Diagnosis }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="card-glass"
      style={{ marginBottom: 32 }}
    >
      <h3
        className="label-caps"
        style={{ color: "var(--brand-mint)", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24 }}
      >
        <Icon name="diagnosis" size={14} />
        Why This Quest?
      </h3>

      <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--text-muted)", margin: "0 0 24px 0" }}>
        You&apos;re at{" "}
        <strong style={{ color: "var(--brand-amber)" }}>
          AL{diagnosis.current_al} ({diagnosis.current_pct}%)
        </strong>{" "}
        in <strong style={{ color: "var(--text-main)" }}>{diagnosis.topic}</strong>.
        {diagnosis.unlocks.length > 0 && (
          <>
            {" "}Mastering this unlocks{" "}
            <strong style={{ color: "var(--brand-mint)" }}>
              {diagnosis.unlocks.length} dependent topic{diagnosis.unlocks.length > 1 ? "s" : ""}
            </strong>.
          </>
        )}
      </p>

      {diagnosis.unlocks.length > 0 && (
        <DependencyTree topic={diagnosis.topic} unlocks={diagnosis.unlocks} />
      )}
    </motion.div>
  )
}

function DependencyTree({ topic, unlocks }: { topic: string; unlocks: string[] }) {
  const W = 480, H = 160
  const rootX = 80, rootY = H / 2
  const fanRadius = 280
  const rootPillW = 88, rootPillH = 28, rootPillRx = 14
  const leafPillW = 84, leafPillH = 22, leafPillRx = 11

  return (
    <div className="quest-dep-tree">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "auto", display: "block" }}
        role="img"
        aria-label={`Dependency tree showing ${topic} unlocking ${unlocks.join(", ")}`}
      >
        <defs>
          <linearGradient id="depLineGradient" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--brand-rose)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--brand-mint)" stopOpacity="0.4" />
          </linearGradient>
          <filter id="depGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {unlocks.map((_, i) => {
          const angle = ((i - (unlocks.length - 1) / 2) / unlocks.length) * 1.4
          const x = rootX + Math.cos(angle) * fanRadius
          const y = rootY + Math.sin(angle) * fanRadius * 0.4
          return (
            <line
              key={`line-${i}`}
              x1={rootX + rootPillW / 2} y1={rootY}
              x2={x - leafPillW / 2} y2={y}
              stroke="url(#depLineGradient)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          )
        })}

        <rect
          x={rootX - rootPillW / 2} y={rootY - rootPillH / 2}
          width={rootPillW} height={rootPillH} rx={rootPillRx}
          fill="color-mix(in srgb, var(--brand-rose) 20%, transparent)"
          stroke="var(--brand-rose)" strokeWidth={2} filter="url(#depGlow)"
        />
        <text x={rootX} y={rootY + 4} textAnchor="middle" fill="var(--text-main)"
          fontSize="11" fontFamily="var(--font-body)" fontWeight="700">
          {topic}
        </text>

        {unlocks.map((name, i) => {
          const angle = ((i - (unlocks.length - 1) / 2) / unlocks.length) * 1.4
          const x = rootX + Math.cos(angle) * fanRadius
          const y = rootY + Math.sin(angle) * fanRadius * 0.4
          return (
            <g key={`node-${i}`}>
              <rect
                x={x - leafPillW / 2} y={y - leafPillH / 2}
                width={leafPillW} height={leafPillH} rx={leafPillRx}
                fill="color-mix(in srgb, var(--brand-mint) 8%, transparent)"
                stroke="var(--brand-mint)" strokeOpacity="0.5" strokeWidth={1.5}
              />
              <text x={x} y={y + 3} textAnchor="middle" fill="var(--text-muted)"
                fontSize="9" fontFamily="var(--font-body)" fontWeight="600">
                {name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// DAY ACCORDION — "Coming next" — driven by dayUnlockStatus
// ═══════════════════════════════════════════════════════════════════

function DayAccordion({
  steps,
  dayUnlockStatus,
  currentStep,
}: {
  steps: QuestStep[]
  dayUnlockStatus: Record<number, DayUnlockStatus>
  currentStep: number
}) {
  const [open, setOpen] = useState(false)
  const upcomingSteps = steps.slice(currentStep + 1)

  if (upcomingSteps.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="card-glass"
      style={{ marginBottom: 32, padding: 0, overflow: "hidden" }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: 24,
          background: "transparent",
          border: "none",
          color: "var(--text-main)",
          fontFamily: "var(--font-body)",
          fontSize: "0.95rem",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
        aria-expanded={open}
      >
        <span className="label-caps" style={{ color: "var(--text-main)", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Icon name="roadmap" size={14} />
          What&apos;s coming next ({upcomingSteps.length})
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: "inline-flex", color: "var(--text-muted)" }}
          aria-hidden
        >
          <Icon name="chevron" size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 24px 24px 24px", borderTop: "1px solid var(--border-light)", paddingTop: 24 }}>
              {upcomingSteps.map((step, relIdx) => {
                const absIdx = currentStep + 1 + relIdx
                const status = dayUnlockStatus[absIdx] ?? { unlocked: false, completed: false }
                const isMidnightGated = !status.unlocked && status.reason === "midnight_gate"

                return (
                  <div
                    key={step.day}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 0",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "var(--surface-container)",
                        border: "1.5px solid var(--border-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: "var(--text-muted)",
                      }}
                    >
                      <Icon name="lock" size={14} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>
                        Day {step.day}: {step.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {isMidnightGated ? (
                          <><Icon name="lock" size={10} /> Unlocks after midnight SGT</>
                        ) : step.type === "tutor" ? (
                          <><Icon name="tutor" size={11} /> Tutor</>
                        ) : (
                          <><Icon name="quiz" size={11} /> Quiz</>
                        )}
                        <span style={{ opacity: 0.6 }}>· ~{step.estimated_minutes} min</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ABANDON BUTTON — calls real API, requires double-confirm
// ═══════════════════════════════════════════════════════════════════

function AbandonButton({ questId, token }: { questId: string; token: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState("")

  async function handleAbandon() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/quests/${questId}/abandon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to abandon quest")
      window.location.href = "/pages/progress.html"
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="quest-abandon-btn">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="diagnosis" size={14} />
            Abandon Quest
          </span>
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: "16px 24px",
            background: "color-mix(in srgb, var(--danger) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
            borderRadius: 12,
            fontSize: "0.85rem",
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>
            Abandon this quest? Your progress will be lost.
          </span>
          {error && (
            <span style={{ fontSize: "0.78rem", color: "var(--danger)" }}>{error}</span>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleAbandon}
              disabled={loading}
              style={{
                background: "var(--danger)",
                color: "var(--white)",
                border: "none",
                padding: "6px 16px",
                borderRadius: 6,
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Abandoning…" : "Yes, abandon"}
            </button>
            <button
              onClick={() => { setConfirming(false); setError("") }}
              disabled={loading}
              style={{
                background: "transparent",
                color: "var(--text-muted)",
                border: "1px solid var(--border-light)",
                padding: "6px 16px",
                borderRadius: 6,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
