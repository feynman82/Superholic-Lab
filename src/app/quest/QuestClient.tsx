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
 * All visual values come from STYLEGUIDE.md tokens via inline style strings
 * (matches the pattern used in src/components/PlanQuestSection.tsx).
 *
 * Phase 3 will:
 *   - Replace props with Supabase fetch
 *   - Wire onClick handlers to real API endpoints
 *   - Add ReturningCelebration (?completed=N detection)
 *   - Add EmptyState + CompleteState
 */

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

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
// DESIGN TOKENS (mirror STYLEGUIDE.md)
// ═══════════════════════════════════════════════════════════════════

const T = {
  // Colors
  sage:       "#51615E",
  sageDark:   "#1A2E2A",
  sageDarker: "#0E1F1C",
  cream:      "#e3d9ca",
  rose:       "#B76E79",
  peach:      "#B88078",
  mint:       "#39FFB3",
  amber:      "#FFB830",

  // Typography
  fontDisplay: "'Bebas Neue', sans-serif",
  fontBody:    "'Plus Jakarta Sans', sans-serif",
  fontMono:    "'JetBrains Mono', monospace",

  // 8-point grid
  s1: 8,
  s2: 16,
  s3: 24,
  s4: 32,
  s5: 40,
  s6: 48,
  s8: 64,
  s10: 80,
  s12: 96,
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function QuestClient({ quest, student, hud, diagnosis }: QuestClientProps) {
  const activeStep = quest.steps[quest.current_step]
  const isQuestComplete = quest.current_step >= quest.steps.length

  return (
    <>
      {/* ─── Keyframes ────────────────────────────── */}
      <style>{`
        @keyframes questPulseRing {
          0%   { transform: scale(1);   opacity: 0.6; }
          80%  { transform: scale(1.8); opacity: 0;   }
          100% { transform: scale(1.8); opacity: 0;   }
        }
        @keyframes questGlowSweep {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes questFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes questFlameFlicker {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          50%      { transform: scale(1.08) rotate(2deg); }
        }
        @keyframes questAuraSpin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes questXpFill {
          from { width: 0%; }
          to   { width: var(--target-pct); }
        }
      `}</style>

      {/* @ts-expect-error custom element */}
      <global-header />

      <main
        style={{
          minHeight: "100vh",
          background: `linear-gradient(180deg, ${T.sageDark} 0%, #243835 60%, ${T.sageDarker} 100%)`,
          paddingTop: 64, // header height
          paddingBottom: T.s12,
          position: "relative",
          overflow: "hidden",
          fontFamily: T.fontBody,
          color: T.cream,
        }}
      >
        {/* Ambient grid texture */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(rgba(57,255,179,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(57,255,179,0.03) 1px,transparent 1px)`,
            backgroundSize: "64px 64px",
            pointerEvents: "none",
          }}
        />

        {/* Ambient glows */}
        <div
          aria-hidden
          style={{
            position: "absolute", top: -180, right: -120,
            width: 520, height: 520,
            background: `radial-gradient(circle, rgba(183,110,121,0.12) 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute", bottom: -100, left: -80,
            width: 400, height: 400,
            background: `radial-gradient(circle, rgba(57,255,179,0.08) 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            maxWidth: 760,
            margin: "0 auto",
            padding: `0 ${T.s2}px`,
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

      {/* @ts-expect-error custom element */}
      <global-footer />
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
      style={{
        background: "rgba(227,217,202,0.06)",
        border: "1.5px solid rgba(227,217,202,0.14)",
        borderRadius: 20,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        padding: T.s3,
        marginTop: T.s4,
        marginBottom: T.s4,
        display: "flex",
        gap: T.s3,
        alignItems: "center",
        boxShadow: "4px 4px 0px rgba(42,42,42,0.18)",
      }}
    >
      {/* Avatar with magic ring */}
      <AvatarSlot photoUrl={student.photo_url} />

      {/* Center: name, level, XP bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: T.s2, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: T.cream }}>{student.name}</span>
          <span
            style={{
              fontFamily: T.fontMono,
              fontSize: "0.7rem",
              color: T.mint,
              background: "rgba(57,255,179,0.1)",
              border: `1px solid rgba(57,255,179,0.3)`,
              padding: "2px 8px",
              borderRadius: 9999,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            Lvl {hud.level} · {hud.rank}
          </span>
        </div>

        {/* XP bar */}
        <div style={{ marginTop: T.s1, display: "flex", alignItems: "center", gap: T.s2 }}>
          <div
            style={{
              flex: 1,
              height: 8,
              background: "rgba(227,217,202,0.1)",
              borderRadius: 9999,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              style={{
                height: "100%",
                background: `linear-gradient(90deg, ${T.rose}, ${T.peach}, ${T.mint})`,
                backgroundSize: "200% 100%",
                animation: "questGlowSweep 3s ease infinite",
                borderRadius: 9999,
              }}
            />
          </div>
          <span
            style={{
              fontFamily: T.fontMono,
              fontSize: "0.7rem",
              color: "rgba(227,217,202,0.6)",
              whiteSpace: "nowrap",
            }}
          >
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
      {/* Magic ring (rotating) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -3,
          borderRadius: "50%",
          background: `conic-gradient(from 0deg, ${T.rose}, ${T.mint}, ${T.amber}, ${T.rose})`,
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
          background: T.sageDark,
          padding: 2,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, ${T.rose}33, ${T.sageDarker})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            fontSize: "1.6rem",
          }}
        >
          {/* Placeholder space-marine emoji until real avatar loads */}
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
      <div
        style={{
          fontSize: "1.8rem",
          animation: "questFlameFlicker 1.5s ease-in-out infinite",
          filter: `drop-shadow(0 0 8px ${T.amber}88)`,
        }}
        aria-hidden
      >
        🔥
      </div>
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: "0.7rem",
          fontWeight: 700,
          color: T.amber,
          lineHeight: 1,
        }}
      >
        {days}d
      </div>
      {shieldCount > 0 && (
        <div
          style={{
            fontFamily: T.fontMono,
            fontSize: "0.6rem",
            color: T.mint,
            lineHeight: 1,
          }}
          aria-label={`${shieldCount} shield`}
        >
          🛡{shieldCount}
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
      style={{ textAlign: "center", marginBottom: T.s5 }}
    >
      {/* Subject + day badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: T.s2,
          marginBottom: T.s2,
        }}
      >
        <span
          style={{
            fontFamily: T.fontMono,
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: T.mint,
            background: "rgba(57,255,179,0.1)",
            border: `1px solid rgba(57,255,179,0.2)`,
            borderRadius: 9999,
            padding: "4px 12px",
          }}
        >
          {subjectLabel} · {quest.level}
        </span>
        <span
          style={{
            fontFamily: T.fontMono,
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: T.rose,
            background: "rgba(183,110,121,0.12)",
            border: `1px solid rgba(183,110,121,0.3)`,
            borderRadius: 9999,
            padding: "4px 12px",
          }}
        >
          {dayDisplay}
        </span>
      </div>

      {/* Quest title */}
      <h1
        style={{
          fontFamily: T.fontDisplay,
          fontSize: "clamp(2rem, 7vw, 3.5rem)",
          letterSpacing: "0.04em",
          lineHeight: 1.0,
          color: T.cream,
          margin: 0,
        }}
      >
        ✨{" "}
        <span
          style={{
            background: `linear-gradient(90deg, ${T.cream}, ${T.mint})`,
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
      style={{
        marginBottom: T.s5,
        padding: `${T.s4}px ${T.s2}px`,
        background: "rgba(227,217,202,0.04)",
        border: "1.5px solid rgba(227,217,202,0.1)",
        borderRadius: 20,
        backdropFilter: "blur(12px)",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 0,
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        {steps.map((step, i) => {
          const isDone = i < currentStep
          const isActive = i === currentStep
          const isLocked = i > currentStep

          const nodeColor = isDone ? T.mint : isActive ? T.rose : "rgba(227,217,202,0.2)"
          const nodeBg = isDone
            ? `${T.mint}26`
            : isActive
            ? `${T.rose}33`
            : "rgba(227,217,202,0.06)"
          const labelColor = isDone ? T.mint : isActive ? T.rose : "rgba(227,217,202,0.4)"

          return (
            <div
              key={step.day}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                flex: i < steps.length - 1 ? `0 0 auto` : "0 0 auto",
                zIndex: 2,
              }}
            >
              {/* Node */}
              <div style={{ position: "relative", marginBottom: T.s2 }}>
                {/* Pulse ring for active */}
                {isActive && (
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: `2px solid ${T.rose}`,
                      animation: "questPulseRing 2s ease-out infinite",
                    }}
                  />
                )}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: nodeBg,
                    border: `2.5px solid ${nodeColor}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: T.fontDisplay,
                    fontSize: "1.6rem",
                    color: nodeColor,
                    position: "relative",
                    boxShadow: isActive
                      ? `0 0 0 3px ${T.rose}26, 0 4px 16px ${T.rose}40`
                      : isDone
                      ? `0 0 0 3px ${T.mint}1A`
                      : "none",
                  }}
                >
                  {isDone ? "✓" : isLocked ? "🔒" : step.day}
                </div>
              </div>

              {/* Day label */}
              <div
                style={{
                  fontFamily: T.fontMono,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: labelColor,
                }}
              >
                Day {step.day}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: labelColor,
                  opacity: 0.8,
                  marginTop: 2,
                }}
              >
                {step.type === "tutor" ? "💬 Tutor" : "📝 Quiz"}
              </div>
            </div>
          )
        })}

        {/* Connector lines (absolute positioned behind nodes) */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: T.s4 + 28,  // node radius
            left: T.s6,
            right: T.s6,
            height: 2,
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {Array.from({ length: steps.length - 1 }).map((_, i) => {
            const filled = i < currentStep
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 2,
                  background: filled
                    ? `linear-gradient(90deg, ${T.mint}, ${i + 1 === currentStep ? T.rose : T.mint})`
                    : "rgba(227,217,202,0.15)",
                  margin: "0 8px",
                  transition: "background 0.6s ease",
                }}
              />
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ACTIVE DAY CARD — today's mission with primary CTA
// ═══════════════════════════════════════════════════════════════════

function ActiveDayCard({ step, questId }: { step: QuestStep; questId: string }) {
  // Append quest tracking params to action URL
  const stepIndex = step.day - 1
  const ctaUrl = `${step.action_url}&from_quest=${encodeURIComponent(
    questId
  )}&step=${stepIndex}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "relative",
        marginBottom: T.s5,
      }}
    >
      {/* Corner accents (rose) */}
      {[
        { top: -6, left: -6, borderTop: `2px solid ${T.rose}`, borderLeft: `2px solid ${T.rose}` },
        { top: -6, right: -6, borderTop: `2px solid ${T.rose}`, borderRight: `2px solid ${T.rose}` },
        { bottom: -6, left: -6, borderBottom: `2px solid ${T.rose}`, borderLeft: `2px solid ${T.rose}` },
        { bottom: -6, right: -6, borderBottom: `2px solid ${T.rose}`, borderRight: `2px solid ${T.rose}` },
      ].map((style, i) => (
        <div
          key={i}
          aria-hidden
          style={{ position: "absolute", width: 18, height: 18, ...style }}
        />
      ))}

      {/* Card body */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "rgba(183,110,121,0.08)",
          border: `1.5px solid ${T.rose}66`,
          borderRadius: 22,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          padding: T.s5,
          boxShadow: `0 0 32px rgba(183,110,121,0.18), 4px 4px 0 rgba(42,42,42,0.22)`,
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: T.s3,
            flexWrap: "wrap",
            gap: T.s2,
          }}
        >
          <span
            style={{
              fontFamily: T.fontMono,
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: T.rose,
            }}
          >
            ▶ Today's Mission
          </span>
          <span
            style={{
              fontFamily: T.fontMono,
              fontSize: "0.7rem",
              color: "rgba(227,217,202,0.7)",
            }}
          >
            ⏱ ~{step.estimated_minutes} min
          </span>
        </div>

        {/* Title */}
        <h2
          style={{
            fontFamily: T.fontDisplay,
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            letterSpacing: "0.02em",
            color: T.cream,
            margin: `0 0 ${T.s2}px 0`,
            lineHeight: 1.1,
          }}
        >
          {step.title}
        </h2>

        {/* Description */}
        <p
          style={{
            color: "rgba(227,217,202,0.78)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            margin: `0 0 ${T.s4}px 0`,
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
            gap: T.s1,
            padding: `${T.s2}px ${T.s4}px`,
            borderRadius: 9999,
            background: `linear-gradient(90deg, ${T.rose}, ${T.peach}, ${T.mint}, ${T.peach}, ${T.rose})`,
            backgroundSize: "300% 100%",
            animation: "questGlowSweep 4s ease infinite",
            color: T.sageDark,
            fontWeight: 700,
            fontSize: "1rem",
            textDecoration: "none",
            boxShadow: `0 4px 20px rgba(57,255,179,0.25), 4px 4px 0 rgba(42,42,42,0.2)`,
            minHeight: 48,
            transition: "transform 150ms ease",
          }}
        >
          ▶ Start Day {step.day}
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
      style={{
        background: "rgba(227,217,202,0.04)",
        border: "1.5px solid rgba(227,217,202,0.1)",
        borderRadius: 20,
        backdropFilter: "blur(16px)",
        padding: T.s5,
        marginBottom: T.s4,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: T.s2,
          marginBottom: T.s3,
        }}
      >
        <span style={{ fontSize: "1.3rem" }} aria-hidden>📊</span>
        <h3
          style={{
            fontFamily: T.fontDisplay,
            fontSize: "1.3rem",
            letterSpacing: "0.04em",
            color: T.cream,
            margin: 0,
          }}
        >
          Why This Quest?
        </h3>
      </div>

      {/* Diagnosis sentence */}
      <p
        style={{
          fontSize: "0.95rem",
          lineHeight: 1.6,
          color: "rgba(227,217,202,0.85)",
          margin: `0 0 ${T.s3}px 0`,
        }}
      >
        You're at{" "}
        <strong style={{ color: T.amber }}>
          AL{diagnosis.current_al} ({diagnosis.current_pct}%)
        </strong>{" "}
        in <strong style={{ color: T.cream }}>{diagnosis.topic}</strong>.
        Mastering this unlocks{" "}
        <strong style={{ color: T.mint }}>
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
  // Layout: root in center-left, unlocks fanning out to the right
  const W = 480
  const H = 160
  const rootX = 80
  const rootY = H / 2
  const fanRadius = 280

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.2)",
        borderRadius: 12,
        border: "1px solid rgba(227,217,202,0.08)",
        padding: T.s2,
        overflow: "auto",
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "auto", display: "block" }}
        role="img"
        aria-label={`Dependency tree showing ${topic} unlocking ${unlocks.join(", ")}`}
      >
        <defs>
          <linearGradient id="depLineGradient" x1="0" x2="1">
            <stop offset="0%" stopColor={T.rose} stopOpacity="0.8" />
            <stop offset="100%" stopColor={T.mint} stopOpacity="0.4" />
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
          fill={`${T.rose}33`}
          stroke={T.rose}
          strokeWidth={2}
          filter="url(#depGlow)"
        />
        <text
          x={rootX}
          y={rootY + 4}
          textAnchor="middle"
          fill={T.cream}
          fontSize="11"
          fontFamily={T.fontBody}
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
                fill="rgba(57,255,179,0.08)"
                stroke={T.mint}
                strokeOpacity="0.5"
                strokeWidth={1.5}
              />
              <text
                x={x}
                y={y + 3}
                textAnchor="middle"
                fill="rgba(227,217,202,0.85)"
                fontSize="9"
                fontFamily={T.fontBody}
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
      style={{
        background: "rgba(227,217,202,0.03)",
        border: "1.5px solid rgba(227,217,202,0.08)",
        borderRadius: 20,
        marginBottom: T.s4,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: T.s3,
          background: "transparent",
          border: "none",
          color: T.cream,
          fontFamily: T.fontBody,
          fontSize: "0.95rem",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: T.s2,
        }}
        aria-expanded={open}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: T.s2 }}>
          <span aria-hidden>📅</span>
          <span>What's coming next ({upcomingSteps.length})</span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: "inline-block", color: "rgba(227,217,202,0.6)" }}
          aria-hidden
        >
          ▼
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
                padding: `0 ${T.s3}px ${T.s3}px ${T.s3}px`,
                borderTop: "1px solid rgba(227,217,202,0.08)",
                paddingTop: T.s3,
              }}
            >
              {upcomingSteps.map((step) => (
                <div
                  key={step.day}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: T.s2,
                    padding: `${T.s2}px 0`,
                    borderBottom: "1px solid rgba(227,217,202,0.06)",
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(227,217,202,0.06)",
                      border: "1.5px solid rgba(227,217,202,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      flexShrink: 0,
                      color: "rgba(227,217,202,0.6)",
                    }}
                  >
                    🔒
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      Day {step.day}: {step.title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "rgba(227,217,202,0.55)",
                        marginTop: 2,
                      }}
                    >
                      {step.type === "tutor" ? "💬 Tutor" : "📝 Quiz"} ·{" "}
                      ~{step.estimated_minutes} min
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
// ═══════════════════════════════════════════════════════════════════

function AbandonButton() {
  const [confirming, setConfirming] = useState(false)

  return (
    <div style={{ textAlign: "center", marginTop: T.s5 }}>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          style={{
            background: "transparent",
            border: "1px solid rgba(227,217,202,0.15)",
            color: "rgba(227,217,202,0.5)",
            padding: `${T.s1}px ${T.s3}px`,
            borderRadius: 9999,
            fontSize: "0.8rem",
            fontFamily: T.fontBody,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(227,217,202,0.3)"
            e.currentTarget.style.color = "rgba(227,217,202,0.7)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(227,217,202,0.15)"
            e.currentTarget.style.color = "rgba(227,217,202,0.5)"
          }}
        >
          ⚙️ Abandon Quest
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: T.s2,
            padding: `${T.s2}px ${T.s3}px`,
            background: "rgba(220,38,38,0.1)",
            border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: 12,
            fontSize: "0.85rem",
          }}
        >
          <span style={{ color: "rgba(227,217,202,0.85)" }}>
            Abandon this quest?
          </span>
          <button
            onClick={() => alert("Phase 3 will wire real abandon flow")}
            style={{
              background: "rgba(220,38,38,0.7)",
              color: "white",
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
              color: "rgba(227,217,202,0.7)",
              border: "1px solid rgba(227,217,202,0.2)",
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
