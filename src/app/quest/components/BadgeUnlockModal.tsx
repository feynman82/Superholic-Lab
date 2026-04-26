"use client"

/**
 * src/app/quest/components/BadgeUnlockModal.tsx
 * Full-screen modal overlay that fires when a badge is newly earned
 * outside of the ReturningCelebration flow (e.g. from abandon or quest complete).
 * For the post-step celebration sequence, ReturningCelebration handles badges.
 */

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Icon } from "../../../components/icons"
import type { CelebrationBadge, BadgeRarity } from "./ReturningCelebration"

const RARITY_STYLES: Record<BadgeRarity, { chip: string; glow: string; border: string }> = {
  common: {
    chip: "quest-chip",
    glow: "color-mix(in srgb, var(--brand-mint) 20%, transparent)",
    border: "color-mix(in srgb, var(--brand-mint) 40%, transparent)",
  },
  rare: {
    chip: "quest-chip quest-chip-mint",
    glow: "color-mix(in srgb, var(--brand-rose) 20%, transparent)",
    border: "color-mix(in srgb, var(--brand-rose) 40%, transparent)",
  },
  epic: {
    chip: "quest-chip quest-chip-rose",
    glow: "color-mix(in srgb, var(--brand-amber) 25%, transparent)",
    border: "color-mix(in srgb, var(--brand-amber) 50%, transparent)",
  },
  legendary: {
    chip: "quest-chip quest-chip-rose",
    glow: "color-mix(in srgb, var(--brand-rose) 35%, transparent)",
    border: "var(--brand-rose)",
  },
}

type BadgeUnlockModalProps = {
  badges: CelebrationBadge[]
  onDismiss: () => void
}

export function BadgeUnlockModal({ badges, onDismiss }: BadgeUnlockModalProps) {
  const [idx, setIdx] = useState(0)
  const current = badges[idx]
  const isLast = idx === badges.length - 1

  if (!current) return null
  const style = RARITY_STYLES[current.rarity]

  function advance() {
    if (isLast) onDismiss()
    else setIdx((n) => n + 1)
  }

  return (
    <AnimatePresence>
      <motion.div
        key="badge-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={advance}
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
          key={`badge-modal-card-${current.id}`}
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="card-glass"
          style={{
            maxWidth: 380,
            width: "100%",
            padding: 48,
            textAlign: "center",
            borderColor: style.border,
            boxShadow: `0 0 60px ${style.glow}`,
          }}
        >
          {/* Badge icon ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: `conic-gradient(from 0deg, var(--brand-rose), var(--brand-mint), var(--brand-amber), var(--brand-rose))`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              padding: 3,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: "var(--brand-sage)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.2rem",
              }}
            >
              🏅
            </div>
          </motion.div>

          {/* Rarity + unlock label */}
          <div style={{ marginBottom: 12 }}>
            <span className="label-caps" style={{ color: "var(--brand-amber)", display: "block", marginBottom: 6 }}>
              Badge Unlocked!
            </span>
            <span className={style.chip} style={{ fontSize: "0.7rem" }}>
              {current.rarity.charAt(0).toUpperCase() + current.rarity.slice(1)}
            </span>
          </div>

          {/* Badge name */}
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 5vw, 2.2rem)",
              letterSpacing: "0.04em",
              margin: "0 0 12px 0",
              color: "var(--text-main)",
            }}
          >
            {current.name}
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              lineHeight: 1.6,
              margin: "0 0 32px 0",
            }}
          >
            {current.description}
          </p>

          {/* Counter */}
          {badges.length > 1 && (
            <div
              className="label-caps"
              style={{ color: "var(--text-muted)", marginBottom: 16 }}
            >
              {idx + 1} / {badges.length}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={advance}
            style={{
              padding: "12px 28px",
              borderRadius: 9999,
              background: "var(--brand-rose)",
              color: "var(--white)",
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
            {isLast ? "Nice!" : "Next Badge"}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
