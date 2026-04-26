"use client"

/**
 * src/app/quest/components/LevelUpModal.tsx
 * Shown when a student levels up as a result of badge XP or other in-page events.
 * For the post-step celebration sequence, ReturningCelebration handles level-up display.
 */

import { motion, AnimatePresence } from "framer-motion"
import { Icon } from "../../../components/icons"
import type { CelebrationLevelUp } from "./ReturningCelebration"

type LevelUpModalProps = {
  data: CelebrationLevelUp
  onDismiss: () => void
}

export function LevelUpModal({ data, onDismiss }: LevelUpModalProps) {
  const rankChanged = data.fromRank !== data.toRank

  return (
    <AnimatePresence>
      <motion.div
        key="levelup-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(8px)",
          cursor: "pointer",
        }}
      >
        <motion.div
          key="levelup-modal-card"
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="card-glass"
          style={{
            maxWidth: 400,
            width: "100%",
            padding: 48,
            textAlign: "center",
            borderColor: "color-mix(in srgb, var(--brand-mint) 50%, transparent)",
            boxShadow: "0 0 80px color-mix(in srgb, var(--brand-mint) 25%, transparent)",
          }}
        >
          {/* Animated level badge */}
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "color-mix(in srgb, var(--brand-mint) 18%, transparent)",
              border: "2.5px solid var(--brand-mint)",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                color: "var(--brand-mint)",
                letterSpacing: "0.04em",
              }}
            >
              {data.toLevel}
            </span>
          </motion.div>

          {/* Level up label */}
          <span className="label-caps" style={{ color: "var(--brand-mint)", display: "block", marginBottom: 10 }}>
            Level Up!
          </span>

          {/* Headline */}
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 6vw, 2.8rem)",
              letterSpacing: "0.04em",
              margin: "0 0 20px 0",
              color: "var(--text-main)",
            }}
          >
            Level {data.toLevel}
          </h2>

          {/* Rank change */}
          {rankChanged ? (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    textDecoration: "line-through",
                    opacity: 0.6,
                  }}
                >
                  {data.fromRank}
                </span>
                <Icon name="chevron" size={16} style={{ color: "var(--brand-mint)", transform: "rotate(-90deg)" }} />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "var(--brand-mint)",
                  }}
                >
                  {data.toRank}
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 8 }}>
                New rank unlocked!
              </p>
            </div>
          ) : (
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 32 }}>
              Rank: <strong style={{ color: "var(--brand-mint)" }}>{data.toRank}</strong>
            </p>
          )}

          {/* CTA */}
          <button
            onClick={onDismiss}
            style={{
              padding: "12px 32px",
              borderRadius: 9999,
              background: "var(--brand-mint)",
              color: "var(--brand-sage)",
              border: "none",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="play" size={14} />
            Keep Going!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
