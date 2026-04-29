"use client"

/**
 * src/app/quest/components/Day3OutcomeModal.tsx
 * Shown after Day 3 quiz when score < 70%.
 * Student chooses: Redo Quest | Slight Improvement | No Improvement.
 * Calls /api/quests/:id/day3-outcome then dismisses.
 */

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Icon } from "../../../components/icons"

export type Day3OutcomeResult = {
  new_quest_id?: string | null
}

type Day3OutcomeModalProps = {
  questId: string
  score: number
  token: string
  onDone: (
    outcome: "redo" | "slight_improvement" | "no_improvement",
    result: Day3OutcomeResult,
  ) => void
}

type OutcomeOption = {
  id: "redo" | "slight_improvement" | "no_improvement"
  label: string
  sublabel: string
  chipClass: string
}

const OPTIONS: OutcomeOption[] = [
  {
    id: "redo",
    label: "Try Again",
    sublabel: "Start a fresh 3-day quest on this topic.",
    chipClass: "quest-chip quest-chip-rose",
  },
  {
    id: "slight_improvement",
    label: "I Improved a Little",
    sublabel: "Mark as slight progress and move on.",
    chipClass: "quest-chip quest-chip-mint",
  },
  {
    id: "no_improvement",
    label: "Honestly, Not Yet",
    sublabel: "Record this honestly — it helps your plan.",
    chipClass: "quest-chip",
  },
]

export function Day3OutcomeModal({ questId, score, token, onDone }: Day3OutcomeModalProps) {
  const [selected, setSelected] = useState<OutcomeOption["id"] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleConfirm() {
    if (!selected) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/quests/${questId}/day3-outcome`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ outcome: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save outcome")
      const newQuestId: string | null =
        (data.new_quest && typeof data.new_quest.id === "string") ? data.new_quest.id : null
      onDone(selected, { new_quest_id: newQuestId })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="card-glass"
          style={{ maxWidth: 460, width: "100%", padding: 40 }}
        >
          {/* Score badge */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "color-mix(in srgb, var(--brand-amber) 15%, transparent)",
                border: "2px solid color-mix(in srgb, var(--brand-amber) 35%, transparent)",
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.6rem",
                  color: "var(--brand-amber)",
                }}
              >
                {score}%
              </span>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.75rem, 4vw, 2.2rem)",
                letterSpacing: "0.04em",
                margin: "0 0 8px 0",
                color: "var(--text-main)",
              }}
            >
              Day 3 Complete
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>
              Score below 70% — how do you want to record this?
            </p>
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            {OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                style={{
                  textAlign: "left",
                  padding: "16px 20px",
                  borderRadius: 12,
                  border: `2px solid ${selected === opt.id ? "var(--brand-rose)" : "var(--border-light)"}`,
                  background: selected === opt.id
                    ? "color-mix(in srgb, var(--brand-rose) 8%, transparent)"
                    : "var(--surface-container)",
                  cursor: "pointer",
                  transition: "border-color 150ms ease, background 150ms ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span className={opt.chipClass} style={{ fontSize: "0.65rem" }}>
                    {opt.label}
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {opt.sublabel}
                </div>
              </button>
            ))}
          </div>

          {error && (
            <p style={{ fontSize: "0.8rem", color: "var(--danger)", marginBottom: 16, textAlign: "center" }}>
              {error}
            </p>
          )}

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            disabled={!selected || loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 9999,
              background: selected ? "var(--brand-rose)" : "var(--surface-container)",
              color: selected ? "var(--white)" : "var(--text-muted)",
              border: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: selected ? "pointer" : "not-allowed",
              transition: "background 150ms ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="btn-spinner" />
                Saving…
              </span>
            ) : (
              <>
                <Icon name="day" size={16} />
                Confirm Choice
              </>
            )}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
