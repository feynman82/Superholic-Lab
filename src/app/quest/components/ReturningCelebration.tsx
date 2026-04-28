"use client"

/**
 * src/app/quest/components/ReturningCelebration.tsx
 * Shown when the kid returns to /quest after completing a Day step.
 *
 * Phase 2 demo mode: triggered by ?demo=returning in the URL (QuestClient
 * builds the CelebrationData object with hardcoded sample values).
 * Phase 3 production mode: triggered by ?completed=N&trigger=quiz&score=N
 *   from the quiz/tutor pages. The same data shape gets returned by
 *   /api/quest-step-complete so this component does not change in Phase 3.
 *
 * Sequence:
 *   1. Backdrop fades in
 *   2. "DAY N COMPLETE" big banner
 *   3. +XP floats up
 *   4. Level-up panel (if levelled)
 *   5. Badge unlock panels (if any) — sequential, one at a time
 *   6. Auto-dismiss to ACTIVE STATE (next day) after the kid taps Continue
 *
 * Visual references locked: Halo Reach holographic UI, Genshin Impact magic burst.
 *
 * No external libs needed beyond framer-motion (already in deps).
 */

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Icon } from "../../../components/icons"

// ─── Public types ──────────────────────────────────────────────────

export type BadgeRarity = "common" | "rare" | "epic" | "legendary"

export type CelebrationBadge = {
  id: string
  name: string
  description: string
  rarity: BadgeRarity
}

export type CelebrationLevelUp = {
  fromLevel: number
  toLevel: number
  fromRank: string
  toRank: string
}

/**
 * Shape returned by /api/quest-step-complete in Phase 3.
 * QuestClient builds the same shape from URL params for Phase 2 demos.
 */
export type CelebrationData = {
  /** 1, 2 or 3 — the day that was just completed */
  completedDay: number
  /** What activity completed the day */
  trigger: "quiz" | "tutor"
  /** Quiz score (0-100), null for tutor sessions */
  score: number | null
  /** Total XP awarded for this completion */
  xpAwarded: number
  /** Level-up info, or null if no level change */
  levelUp: CelebrationLevelUp | null
  /** Badges newly unlocked, may be 0 or many */
  badgesUnlocked: CelebrationBadge[]
  /** True if this completion finished the entire quest (Day 3 of 3) */
  questComplete: boolean
}

type CelebrationProps = {
  data: CelebrationData
  onDismiss: () => void
}

// ─── Rarity → CSS custom property mapping ──────────────────────────
// Passed as --rarity-color per-instance so CSS classes can reference it.
const RARITY_COLOR: Record<BadgeRarity, string> = {
  common:    "var(--cream)",
  rare:      "var(--brand-mint)",
  epic:      "var(--brand-rose)",
  legendary: "var(--brand-amber)",
}

// Confetti piece colours — CSS vars resolve at paint time
const CONFETTI_HUES = [
  "var(--brand-rose)",
  "var(--brand-mint)",
  "var(--brand-amber)",
  "var(--cream)",
]

// ─── Component ─────────────────────────────────────────────────────

export function ReturningCelebration({ data, onDismiss }: CelebrationProps) {
  // Stage progression: 'banner' → 'xp' → 'level' (optional) → 'badge' (optional) → 'done'
  type Stage = "banner" | "xp" | "level" | "badge" | "done"
  const [stage, setStage] = useState<Stage>("banner")
  const [badgeIndex, setBadgeIndex] = useState(0)

  // Auto-advance through stages
  useEffect(() => {
    let cancelled = false

    function go(next: Stage, delay: number) {
      setTimeout(() => {
        if (cancelled) return
        setStage(next)
      }, delay)
    }

    if (stage === "banner") {
      go("xp", 600)
    } else if (stage === "xp") {
      const next: Stage = data.levelUp
        ? "level"
        : data.badgesUnlocked.length > 0
          ? "badge"
          : "done"
      go(next, 700)
    } else if (stage === "level") {
      const next: Stage = data.badgesUnlocked.length > 0 ? "badge" : "done"
      go(next, 1100)
    } else if (stage === "badge") {
      // Cycle through badges 1-by-1
      if (badgeIndex < data.badgesUnlocked.length - 1) {
        setTimeout(() => {
          if (cancelled) return
          setBadgeIndex(badgeIndex + 1)
        }, 1000)
      } else {
        go("done", 1100)
      }
    }

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, badgeIndex])

  const isFinalDay = data.questComplete
  const triggerLabel = data.trigger === "quiz" ? "QUIZ" : "TUTOR"
  const currentBadge =
    data.badgesUnlocked[Math.min(badgeIndex, data.badgesUnlocked.length - 1)]

  return (
    <motion.div
      className="quest-celebration-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onDismiss}
      role="dialog"
      aria-label="Quest day completion celebration"
      style={{ color: "var(--cream)" }}
    >
      <ConfettiBurst />

      <div
        style={{
          position: "relative",
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Banner (always visible) ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 32 }}
        >
          <div
            className="quest-chip quest-chip-mint"
            style={{ marginBottom: 16, display: "inline-flex" }}
          >
            {triggerLabel}
            {data.score !== null && ` · SCORE ${data.score}%`}
          </div>

          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(3rem, 11vw, 5.5rem)",
              letterSpacing: "0.04em",
              lineHeight: 0.95,
              margin: 0,
              background: `linear-gradient(180deg, var(--cream) 0%, var(--brand-mint) 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 24px color-mix(in srgb, var(--brand-mint) 35%, transparent))",
            }}
          >
            {isFinalDay ? "QUEST COMPLETE" : `DAY ${data.completedDay} COMPLETE`}
          </h1>

          {!isFinalDay && (
            <p
              style={{
                fontSize: "1rem",
                color: "color-mix(in srgb, var(--cream) 75%, transparent)",
                margin: "12px 0 0 0",
              }}
            >
              {3 - data.completedDay} day{3 - data.completedDay !== 1 ? "s" : ""} to go.
            </p>
          )}
        </motion.div>

        {/* ─── +XP burst (stage 2 onwards) ─── */}
        <AnimatePresence>
          {stage !== "banner" && (
            <motion.div
              key="xp-burst"
              className="quest-xp-burst"
              initial={{ opacity: 0, y: 30, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "2rem",
                  color: "var(--brand-amber)",
                  letterSpacing: "0.04em",
                  lineHeight: 1,
                }}
              >
                +{data.xpAwarded} XP
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Level-up panel (stage 3+, optional) ─── */}
        <AnimatePresence>
          {(stage === "level" || stage === "badge" || stage === "done") &&
            data.levelUp && (
              <motion.div
                key="level-up"
                className="quest-levelup-panel"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className="label-caps"
                  style={{ color: "var(--brand-mint)", marginBottom: 6 }}
                >
                  LEVEL UP
                </div>
                <div
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "2.4rem",
                    color: "var(--cream)",
                    letterSpacing: "0.04em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    lineHeight: 1,
                  }}
                >
                  <span style={{ opacity: 0.5 }}>{data.levelUp.fromLevel}</span>
                  <span style={{ color: "var(--brand-mint)" }}>→</span>
                  <span style={{ color: "var(--brand-mint)" }}>{data.levelUp.toLevel}</span>
                </div>
                <div
                  className="label-caps"
                  style={{ color: "var(--brand-mint)", marginTop: 6 }}
                >
                  {data.levelUp.fromRank} → {data.levelUp.toRank}
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* ─── Badge unlock (stage 4+, optional, one at a time) ─── */}
        <AnimatePresence mode="wait">
          {(stage === "badge" || stage === "done") && currentBadge && (
            <motion.div
              key={`badge-${currentBadge.id}`}
              className={`quest-badge-panel quest-badge-${currentBadge.rarity}`}
              style={
                { "--rarity-color": RARITY_COLOR[currentBadge.rarity] } as React.CSSProperties
              }
              initial={{ opacity: 0, scale: 0.6, rotateY: -90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="label-caps"
                style={{
                  color: "var(--rarity-color, var(--cream))",
                  marginBottom: 8,
                }}
              >
                ⬢ {currentBadge.rarity} BADGE UNLOCKED
                {data.badgesUnlocked.length > 1 &&
                  ` · ${badgeIndex + 1} of ${data.badgesUnlocked.length}`}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  justifyContent: "center",
                }}
              >
                <div
                  className={`quest-badge-icon quest-badge-icon-${currentBadge.rarity}`}
                >
                  <Icon name="shield" size={32} />
                </div>
                <div style={{ textAlign: "left" }}>
                  {/* Badge name: Plus Jakarta Sans 700 — Bebas Neue at 1.6rem = 25.6px violates 32px floor */}
                  <div
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "var(--cream)",
                      lineHeight: 1.2,
                    }}
                  >
                    {currentBadge.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "color-mix(in srgb, var(--cream) 65%, transparent)",
                      marginTop: 2,
                    }}
                  >
                    {currentBadge.description}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Continue button (visible after stage 1) ─── */}
        <motion.button
          className="quest-continue-btn"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          onClick={onDismiss}
        >
          {isFinalDay
            ? "Claim Your Reward"
            : `Continue to Day ${data.completedDay + 1}`}
          <span style={{ marginLeft: 4 }}>→</span>
        </motion.button>

        <div
          style={{
            fontSize: "0.75rem",
            color: "color-mix(in srgb, var(--cream) 40%, transparent)",
            marginTop: 16,
          }}
        >
          Tap anywhere to dismiss
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Confetti — pure CSS, lightweight, no external deps.
// The shlConfettiFall keyframe lives in style.css (AS.10 section).
// ─────────────────────────────────────────────────────────────────────

function ConfettiBurst() {
  const pieces = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.4 + Math.random() * 1.6,
      hue: CONFETTI_HUES[i % 4],
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 720 - 360,
    }))
  }, [])

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            top: "-20vh",
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.hue,
            borderRadius: 2,
            animation: `shlConfettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
            transform: `rotate(${p.rotate}deg)`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  )
}
