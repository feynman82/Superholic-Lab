"use client"

/**
 * src/app/quest/QuestClient.tsx
 * Phase 2 visual prototype — full quest experience with hardcoded sample data.
 *
 * Layout (mobile-first, scaled up for desktop ≥1024px):
 *   1. Top nav (back / QUEST title / profile)
 *   2. HUD strip — avatar, level, XP bar, streak
 *   3. Hero band — quest title, subject, day progress
 *   4. Timeline — 3 nodes, animated, current day pulses
 *   5. Active day card — today's mission with CTA
 *   6. Diagnosis card — "Why this quest?" with mini SVG dependency tree
 *   7. Coming-next accordion
 *   8. Abandon button
 *
 * Architect-Scholar migration (2026-04-26):
 *   - All colours via CSS variables (var(--token)); no T token map; no hex/rgba literals
 *   - Page background: light var(--surface); dark gradient removed
 *   - Glassmorphism cards via .card-glass utility class
 *   - Keyframes moved to public/css/style.css (AS.10)
 *   - Bebas Neue enforced ≥ 32px (h2 minimum)
 *   - JetBrains Mono replaced with .label-caps / .quest-chip
 *   - AbandonButton hover → .quest-abandon-btn CSS class
 *   - QuestTimeline connectors → CSS-class layout (no magic numbers)
 *
 * Phase 3 will:
 *   - Replace props with Supabase fetch
 *   - Wire onClick handlers to real API endpoints
 *   - Add EmptyState + CompleteState
 */

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Icon } from "../../components/icons"
import { ReturningCelebration, type CelebrationData } from "./components/ReturningCelebration"

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
  quest: Quest
  student: Student
  hud: HUD
  diagnosis: Diagnosis
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function QuestClient({ quest, student, hud, diagnosis }: QuestClientProps) {
  const activeStep = quest.steps[quest.current_step]
  const isQuestComplete = quest.current_step >= quest.steps.length

  // ─── ?demo=returning toggle (Phase 2 only) ─────────────────────────
  const [demoCelebration, setDemoCelebration] = useState<CelebrationData | null>(
    () => {
      if (typeof window === "undefined") return null
      const params = new URLSearchParams(window.location.search)
      if (params.get("demo") !== "returning") return null
      return {
        completedDay: 2,
        trigger: "tutor",
        score: null,
        xpAwarded: 50,
        levelUp: {
          fromLevel: 4,
          toLevel: 5,
          fromRank: "Cadet",
          toRank: "Operator",
        },
        badgesUnlocked: [
          {
            id: "first_quest",
            name: "First Mission",
            description: "Completed your first Plan Quest day.",
            rarity: "rare",
          },
          {
            id: "helper_10",
            name: "Apprentice Pact",
            description: "10 messages exchanged with Miss Wena.",
            rarity: "common",
          },
        ],
        questComplete: false,
      }
    }
  )

  function dismissCelebration() {
    setDemoCelebration(null)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.delete("demo")
      window.history.replaceState({}, "", url.pathname + (url.search || ""))
    }
  }

  return (
    <>
      <AnimatePresence>
        {demoCelebration && (
          <ReturningCelebration
            data={demoCelebration}
            onDismiss={dismissCelebration}
          />
        )}
      </AnimatePresence>

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
          {/* ─────────────────────── HUD STRIP ───────────────────────── */}
          <HUDStrip student={student} hud={hud} />

          {/* ─────────────────────── HERO BAND ───────────────────────── */}
          <QuestHero quest={quest} />

          {/* ─────────────────────── TIMELINE ────────────────────────── */}
          <QuestTimeline steps={quest.steps} currentStep={quest.current_step} />

          {/* ─────────────────────── ACTIVE DAY CARD ─────────────────── */}
          {!isQuestComplete && activeStep && (
            <ActiveDayCard step={activeStep} questId={quest.id} />
          )}

          {/* ─────────────────────── DIAGNOSIS CARD ──────────────────── */}
          <DiagnosisCard diagnosis={diagnosis} />

          {/* ─────────────────────── COMING NEXT ─────────────────────── */}
          <DayAccordion steps={quest.steps} currentStep={quest.current_step} />

          {/* ─────────────────────── ABANDON ─────────────────────────── */}
          <AbandonButton />
        </div>
      </main>

    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// HUD STRIP — top sticky bar with avatar, XP bar, level, streak
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
      {/* Avatar with magic ring */}
      <AvatarSlot photoUrl={student.photo_url} />

      {/* Center: name, level, XP bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-main)" }}>
            {student.name}
          </span>
          <span className="quest-chip quest-chip-mint">
            Lvl {hud.level} · {hud.rank}
          </span>
        </div>

        {/* XP bar */}
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

      {/* Streak flame */}
      <StreakFlame days={hud.streak_days} shieldCount={hud.shield_count} />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// AVATAR SLOT — circle with magic ring, reroll button overlay
// ═══════════════════════════════════════════════════════════════════

function AvatarSlot({ photoUrl }: { photoUrl: string }) {
  return (
    <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
      {/* Magic ring (rotating) — decorative animated element; stays as-is, tokenised */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -3,
          borderRadius: "50%",
          background: `conic-gradient(from 0deg, var(--brand-rose), var(--brand-mint), var(--brand-amber), var(--brand-rose))`,
          animation: "questAuraSpin 6s linear infinite",
          opacity: 0.7,
        }}
      />
      {/* Inner mask */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "var(--brand-sage)", // T.sageDark was drift; brand-sage is the canonical value
          padding: 2,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--brand-rose) 20%, transparent), var(--sage-dark))`,
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
// STREAK FLAME — animated flame counter
// ═══════════════════════════════════════════════════════════════════

function StreakFlame({ days, shieldCount }: { days: number; shieldCount: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        flexShrink: 0,
      }}
      title={shieldCount > 0 ? `${shieldCount} streak shield(s) in stock` : "No shields"}
    >
      <div className="quest-flame" aria-hidden>
        <Icon name="flame" size={28} />
      </div>
      <div className="label-caps" style={{ color: "var(--brand-amber)", lineHeight: 1 }}>
        {days}d
      </div>
      {shieldCount > 0 && (
        <div
          className="label-caps"
          style={{
            color: "var(--brand-mint)",
            lineHeight: 1,
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
          }}
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

function QuestHero({ quest }: { quest: Quest }) {
  const dayDisplay = `Day ${quest.current_step + 1} of ${quest.steps.length}`
  const subjectLabel =
    quest.subject.charAt(0).toUpperCase() + quest.subject.slice(1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      style={{ textAlign: "center", marginBottom: 40 }}
    >
      {/* Subject + day badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <span className="quest-chip quest-chip-mint">
          {subjectLabel} · {quest.level}
        </span>
        <span className="quest-chip quest-chip-rose">
          {dayDisplay}
        </span>
      </div>

      {/* Quest title — sage-dark → brand-rose gradient works on light surface */}
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
            background: `linear-gradient(90deg, var(--sage-dark), var(--brand-rose))`,
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
// QUEST TIMELINE — 3-node timeline with animated active indicator
// Connectors rendered as CSS-class positioned elements (no magic numbers).
// ═══════════════════════════════════════════════════════════════════

function QuestTimeline({
  steps,
  currentStep,
}: {
  steps: QuestStep[]
  currentStep: number
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
          const isDone   = i < currentStep
          const isActive = i === currentStep
          const isLocked = i > currentStep

          const nodeClass  = isDone ? "quest-node-done" : isActive ? "quest-node-active" : "quest-node-locked"
          const labelClass = isDone ? "quest-label-done" : isActive ? "quest-label-active" : "quest-label-locked"

          return (
            <div key={step.day} className="quest-timeline-item">
              {/* Node */}
              <div className="quest-timeline-node-wrapper">
                {isActive && <div aria-hidden className="quest-pulse-ring" />}
                <div className={`quest-timeline-node ${nodeClass}`}>
                  {isDone ? "✓" : isLocked ? <Icon name="lock" size={22} /> : step.day}
                </div>
              </div>

              {/* Day label */}
              <div className={`quest-node-label ${labelClass}`}>
                Day {step.day}
              </div>
              <div style={{ fontSize: "0.7rem", color: isActive ? "var(--brand-rose)" : "var(--text-muted)", opacity: 0.8, marginTop: 2 }}>
                {step.type === "tutor" ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Icon name="tutor" size={12} /> Tutor
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Icon name="quiz" size={12} /> Quiz
                  </span>
                )}
              </div>

              {/* Connector to next node — CSS class positions it behind the node via z-index */}
              {i < steps.length - 1 && (
                <div
                  aria-hidden
                  className={`quest-timeline-connector ${i < currentStep ? "quest-connector-filled" : ""}`}
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
// ACTIVE DAY CARD — today's mission with primary CTA
// ActiveDayCard intentionally overrides .card-glass shadow + border
// to read as "today's mission" via rose tint.
// ═══════════════════════════════════════════════════════════════════

function ActiveDayCard({ step, questId }: { step: QuestStep; questId: string }) {
  const stepIndex = step.day - 1
  const ctaUrl = `${step.action_url}&from_quest=${encodeURIComponent(questId)}&step=${stepIndex}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "relative",
        marginBottom: 40,
      }}
    >
      {/* Corner accents (rose) */}
      {[
        { top: -6, left: -6, borderTop: `2px solid var(--brand-rose)`, borderLeft: `2px solid var(--brand-rose)` },
        { top: -6, right: -6, borderTop: `2px solid var(--brand-rose)`, borderRight: `2px solid var(--brand-rose)` },
        { bottom: -6, left: -6, borderBottom: `2px solid var(--brand-rose)`, borderLeft: `2px solid var(--brand-rose)` },
        { bottom: -6, right: -6, borderBottom: `2px solid var(--brand-rose)`, borderRight: `2px solid var(--brand-rose)` },
      ].map((s, i) => (
        <div key={i} aria-hidden style={{ position: "absolute", width: 18, height: 18, ...s }} />
      ))}

      {/* Card body — .card-glass with rose-tint override to signal "today" */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="card-glass"
        style={{
          /* ActiveDayCard intentionally overrides .card-glass shadow + border to read as "today" */
          borderColor: "rgba(183, 110, 121, 0.4)",
          boxShadow: "0 0 32px rgba(183, 110, 121, 0.18)",
          padding: 40,
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
              color: "var(--brand-rose)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="play" size={14} />
            Today's Mission
          </span>
          <span
            className="label-caps"
            style={{
              color: "var(--text-muted)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span aria-hidden style={{ opacity: 0.7 }}>≈</span>
            {step.estimated_minutes} min
          </span>
        </div>

        {/* Title — clamp(2rem, ...) ensures Bebas ≥ 32px floor */}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 4vw, 2.2rem)",
            letterSpacing: "0.02em",
            color: "var(--text-main)",
            margin: `0 0 16px 0`,
            lineHeight: 1.1,
          }}
        >
          {step.title}
        </h2>

        {/* Description */}
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            margin: `0 0 32px 0`,
          }}
        >
          {step.description}
        </p>

        {/* CTA */}
        <Link
          href={ctaUrl}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "16px 32px",
            borderRadius: 9999,
            background: `linear-gradient(90deg, var(--brand-rose), var(--brand-rose-hover), var(--brand-mint), var(--brand-rose-hover), var(--brand-rose))`,
            backgroundSize: "300% 100%",
            animation: "questGlowSweep 4s ease infinite",
            color: "var(--text-main)",
            fontWeight: 700,
            fontSize: "1rem",
            textDecoration: "none",
            boxShadow: `0 4px 20px color-mix(in srgb, var(--brand-mint) 25%, transparent)`,
            minHeight: 48,
            transition: "transform 150ms ease",
          }}
        >
          <Icon name="play" size={18} />
          <span>Start Day {step.day}</span>
          <span style={{ fontSize: "1.1rem", marginLeft: 4 }}>→</span>
        </Link>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// DIAGNOSIS CARD — "Why this quest?" with mini SVG dependency tree
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <span style={{ fontSize: "1.3rem", display: "inline-flex", color: "var(--brand-mint)" }} aria-hidden>
          <Icon name="diagnosis" size={22} />
        </span>
        {/* h3 at label-caps style — Plus Jakarta 700, 0.1em tracking, uppercase. fontSize overrides class 12px → 16px */}
        <h3 className="label-caps" style={{ fontSize: "1rem", color: "var(--text-main)", margin: 0 }}>
          Why This Quest?
        </h3>
      </div>

      {/* Diagnosis sentence */}
      <p
        style={{
          fontSize: "0.95rem",
          lineHeight: 1.6,
          color: "var(--text-muted)",
          margin: `0 0 24px 0`,
        }}
      >
        You're at{" "}
        <strong style={{ color: "var(--brand-amber)" }}>
          AL{diagnosis.current_al} ({diagnosis.current_pct}%)
        </strong>{" "}
        in <strong style={{ color: "var(--text-main)" }}>{diagnosis.topic}</strong>.
        Mastering this unlocks{" "}
        <strong style={{ color: "var(--brand-mint)" }}>
          {diagnosis.unlocks.length} dependent topics
        </strong>
        .
      </p>

      {/* Mini SVG dependency tree */}
      <DependencyTree topic={diagnosis.topic} unlocks={diagnosis.unlocks} />
    </motion.div>
  )
}

function DependencyTree({ topic, unlocks }: { topic: string; unlocks: string[] }) {
  const W = 480
  const H = 160
  const rootX = 80
  const rootY = H / 2
  const fanRadius = 280

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
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Lines from root to each unlock */}
        {unlocks.map((_, i) => {
          const angle = ((i - (unlocks.length - 1) / 2) / unlocks.length) * 1.4
          const x = rootX + Math.cos(angle) * fanRadius
          const y = rootY + Math.sin(angle) * fanRadius * 0.4
          return (
            <line
              key={`line-${i}`}
              x1={rootX}
              y1={rootY}
              x2={x}
              y2={y}
              stroke="url(#depLineGradient)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          )
        })}

        {/* Root node (current weakness) */}
        <circle
          cx={rootX}
          cy={rootY}
          r={28}
          fill={`color-mix(in srgb, var(--brand-rose) 20%, transparent)`}
          stroke="var(--brand-rose)"
          strokeWidth={2}
          filter="url(#depGlow)"
        />
        <text
          x={rootX}
          y={rootY + 4}
          textAnchor="middle"
          fill="var(--text-main)"
          fontSize="11"
          fontFamily="var(--font-body)"
          fontWeight="700"
        >
          {topic}
        </text>

        {/* Unlock nodes */}
        {unlocks.map((name, i) => {
          const angle = ((i - (unlocks.length - 1) / 2) / unlocks.length) * 1.4
          const x = rootX + Math.cos(angle) * fanRadius
          const y = rootY + Math.sin(angle) * fanRadius * 0.4
          return (
            <g key={`node-${i}`}>
              <circle
                cx={x}
                cy={y}
                r={20}
                fill={`color-mix(in srgb, var(--brand-mint) 8%, transparent)`}
                stroke="var(--brand-mint)"
                strokeOpacity="0.5"
                strokeWidth={1.5}
              />
              <text
                x={x}
                y={y + 3}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize="9"
                fontFamily="var(--font-body)"
                fontWeight="600"
              >
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
// DAY ACCORDION — "Coming next"
// ═══════════════════════════════════════════════════════════════════

function DayAccordion({
  steps,
  currentStep,
}: {
  steps: QuestStep[]
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
        <span style={{ display: "inline-flex", alignItems: "center", gap: 16 }}>
          <span style={{ display: "inline-flex", color: "var(--text-main)" }} aria-hidden>
            <Icon name="roadmap" size={18} />
          </span>
          <span>What's coming next ({upcomingSteps.length})</span>
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
            <div
              style={{
                padding: `0 24px 24px 24px`,
                borderTop: "1px solid var(--border-light)",
                paddingTop: 24,
              }}
            >
              {upcomingSteps.map((step) => (
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
                      fontSize: "0.75rem",
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
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginTop: 2,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {step.type === "tutor" ? (
                        <><Icon name="tutor" size={11} /> Tutor</>
                      ) : (
                        <><Icon name="quiz" size={11} /> Quiz</>
                      )}
                      <span style={{ opacity: 0.6 }}>· ~{step.estimated_minutes} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ABANDON BUTTON — subtle, requires confirmation (Phase 3 wires real action)
// Hover handled entirely by .quest-abandon-btn CSS class (:hover/:focus-visible).
// ═══════════════════════════════════════════════════════════════════

function AbandonButton() {
  const [confirming, setConfirming] = useState(false)

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
            alignItems: "center",
            gap: 16,
            padding: "16px 24px",
            // no --brand-error-tint token yet (documented exception per design-guardian rule)
            background: "rgba(220, 38, 38, 0.08)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            borderRadius: 12,
            fontSize: "0.85rem",
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>
            Abandon this quest?
          </span>
          <button
            onClick={() => alert("Phase 3 will wire real abandon flow")}
            style={{
              background: "var(--error)",
              color: "var(--on-error)",
              border: "none",
              padding: "4px 12px",
              borderRadius: 6,
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Yes, abandon
          </button>
          <button
            onClick={() => setConfirming(false)}
            style={{
              background: "transparent",
              color: "var(--text-muted)",
              border: "1px solid var(--border-light)",
              padding: "4px 12px",
              borderRadius: 6,
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </motion.div>
      )}
    </div>
  )
}
