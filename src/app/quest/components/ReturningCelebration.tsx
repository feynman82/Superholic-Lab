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
import { Icon } from "@/components/icons"

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

// ─── Local design tokens (mirror QuestClient.tsx) ──────────────────

const T = {
  sage:       "#51615E",
  sageDark:   "#1A2E2A",
  sageDarker: "#0E1F1C",
  cream:      "#e3d9ca",
  rose:       "#B76E79",
  peach:      "#B88078",
  mint:       "#39FFB3",
  amber:      "#FFB830",
  fontDisplay: "'Bebas Neue', sans-serif",
  fontBody:    "'Plus Jakarta Sans', sans-serif",
  fontMono:    "'JetBrains Mono', monospace",
}

const RARITY_COLOR: Record<BadgeRarity, string> = {
  common:    T.cream,
  rare:      T.mint,
  epic:      T.rose,
  legendary: T.amber,
}

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
      go("xp", 1300)
    } else if (stage === "xp") {
      const next: Stage = data.levelUp
        ? "level"
        : data.badgesUnlocked.length > 0
          ? "badge"
          : "done"
      go(next, 1400)
    } else if (stage === "level") {
      const next: Stage = data.badgesUnlocked.length > 0 ? "badge" : "done"
      go(next, 2000)
    } else if (stage === "badge") {
      // Cycle through badges 1-by-1
      if (badgeIndex < data.badgesUnlocked.length - 1) {
        setTimeout(() => {
          if (cancelled) return
          setBadgeIndex(badgeIndex + 1)
        }, 1800)
      } else {
        go("done", 2000)
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(circle at 50% 40%, rgba(57,255,179,0.18), rgba(14,31,28,0.92) 60%)`,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: 16,
        fontFamily: T.fontBody,
        color: T.cream,
      }}
      onClick={onDismiss}
      role="dialog"
      aria-label="Quest day completion celebration"
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
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: T.fontMono,
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: T.mint,
              background: "rgba(57,255,179,0.1)",
              border: `1px solid rgba(57,255,179,0.35)`,
              borderRadius: 9999,
              padding: "6px 16px",
              marginBottom: 16,
            }}
          >
            {triggerLabel}
            {data.score !== null && ` · SCORE ${data.score}%`}
          </div>

          <h1
            style={{
              fontFamily: T.fontDisplay,
              fontSize: "clamp(3rem, 11vw, 5.5rem)",
              letterSpacing: "0.04em",
              lineHeight: 0.95,
              margin: 0,
              background: `linear-gradient(180deg, ${T.cream} 0%, ${T.mint} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 24px rgba(57,255,179,0.35))",
            }}
          >
            {isFinalDay ? "QUEST COMPLETE" : `DAY ${data.completedDay} COMPLETE`}
          </h1>

          {!isFinalDay && (
            <p
              style={{
                fontSize: "1rem",
                color: "rgba(227,217,202,0.75)",
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
              initial={{ opacity: 0, y: 30, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                background: "rgba(255,184,48,0.1)",
                border: `1.5px solid ${T.amber}`,
                borderRadius: 9999,
                padding: "10px 24px",
                marginBottom: 24,
                boxShadow: `0 0 24px rgba(255,184,48,0.3)`,
              }}
            >
              <span
                style={{
                  fontFamily: T.fontDisplay,
                  fontSize: "2rem",
                  color: T.amber,
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
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: "rgba(57,255,179,0.06)",
                  border: `1.5px solid ${T.mint}`,
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 16,
                  boxShadow: `0 0 32px rgba(57,255,179,0.25), inset 0 0 20px rgba(57,255,179,0.05)`,
                }}
              >
                <div
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: "0.7rem",
                    letterSpacing: "0.2em",
                    color: T.mint,
                    marginBottom: 6,
                  }}
                >
                  LEVEL UP
                </div>
                <div
                  style={{
                    fontFamily: T.fontDisplay,
                    fontSize: "2.4rem",
                    color: T.cream,
                    letterSpacing: "0.04em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    lineHeight: 1,
                  }}
                >
                  <span style={{ opacity: 0.5 }}>{data.levelUp.fromLevel}</span>
                  <span style={{ color: T.mint }}>→</span>
                  <span style={{ color: T.mint }}>{data.levelUp.toLevel}</span>
                </div>
                <div
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: "0.85rem",
                    color: T.mint,
                    marginTop: 6,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
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
              initial={{ opacity: 0, scale: 0.6, rotateY: -90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: `rgba(${
                  currentBadge.rarity === "epic"
                    ? "183,110,121"
                    : currentBadge.rarity === "legendary"
                      ? "255,184,48"
                      : currentBadge.rarity === "rare"
                        ? "57,255,179"
                        : "227,217,202"
                }, 0.08)`,
                border: `1.5px solid ${RARITY_COLOR[currentBadge.rarity]}`,
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                boxShadow: `0 0 32px ${RARITY_COLOR[currentBadge.rarity]}55`,
              }}
            >
              <div
                style={{
                  fontFamily: T.fontMono,
                  fontSize: "0.7rem",
                  letterSpacing: "0.2em",
                  color: RARITY_COLOR[currentBadge.rarity],
                  marginBottom: 8,
                  textTransform: "uppercase",
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
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${RARITY_COLOR[currentBadge.rarity]}33, ${T.sageDark})`,
                    border: `1.5px solid ${RARITY_COLOR[currentBadge.rarity]}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: RARITY_COLOR[currentBadge.rarity],
                    flexShrink: 0,
                  }}
                >
                  <Icon name="shield" size={32} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontFamily: T.fontDisplay,
                      fontSize: "1.6rem",
                      color: T.cream,
                      letterSpacing: "0.02em",
                      lineHeight: 1.1,
                    }}
                  >
                    {currentBadge.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "rgba(227,217,202,0.65)",
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

        {/* ─── Continue button (always visible after stage 1) ─── */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          onClick={onDismiss}
          style={{
            marginTop: 8,
            padding: "12px 32px",
            borderRadius: 9999,
            background: `linear-gradient(90deg, ${T.rose}, ${T.peach}, ${T.mint}, ${T.peach}, ${T.rose})`,
            backgroundSize: "300% 100%",
            color: T.sageDark,
            fontWeight: 700,
            fontSize: "1rem",
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            boxShadow: `0 4px 24px rgba(57,255,179,0.3)`,
            fontFamily: T.fontBody,
          }}
        >
          {isFinalDay
            ? "Claim Your Reward"
            : `Continue to Day ${data.completedDay + 1}`}
          <span style={{ marginLeft: 4 }}>→</span>
        </motion.button>

        <div
          style={{
            fontSize: "0.75rem",
            color: "rgba(227,217,202,0.4)",
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
// Confetti — pure CSS, lightweight, no external deps
// ─────────────────────────────────────────────────────────────────────

function ConfettiBurst() {
  const pieces = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.4 + Math.random() * 1.6,
      hue: [T.rose, T.mint, T.amber, T.cream][i % 4],
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 720 - 360,
    }))
  }, [])

  return (
    <>
      <style>{`
        @keyframes shlConfettiFall {
          0%   { transform: translateY(-20vh) rotate(0deg);   opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
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
    </>
  )
}
