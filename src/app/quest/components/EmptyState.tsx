"use client"

/**
 * src/app/quest/components/EmptyState.tsx
 * Shown when the student has no active remedial quest.
 * CTA sends them to progress.html where they can generate one.
 */

import { motion } from "framer-motion"
import Link from "next/link"
import { Icon } from "../../../components/icons"

export type CompletedQuest = {
  id: string
  subject: string
  topic: string
  day3_outcome: string | null
  created_at: string
}

const SUBJECT_LABEL: Record<string, string> = {
  mathematics: "Mathematics",
  science:     "Science",
  english:     "English",
}
function fmtSubject(s: string): string {
  return SUBJECT_LABEL[s?.toLowerCase()] ?? (s ? s.charAt(0).toUpperCase() + s.slice(1) : "")
}

const OUTCOME_LABEL: Record<string, { text: string; tint: string }> = {
  mastered:           { text: "Mastered",         tint: "var(--brand-mint)" },
  slight_improvement: { text: "Good Progress",    tint: "var(--brand-amber)" },
  no_improvement:     { text: "Honest Exit",      tint: "var(--brand-rose)" },
  redo:               { text: "Restarted",        tint: "var(--brand-rose)" },
}

type EmptyStateProps = {
  completedQuests?: CompletedQuest[]
}

export function EmptyState({ completedQuests = [] }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ textAlign: "center", padding: "80px 24px 40px" }}
    >
      {/* Icon */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: "color-mix(in srgb, var(--brand-rose) 12%, transparent)",
          border: "2px solid color-mix(in srgb, var(--brand-rose) 30%, transparent)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
          color: "var(--brand-rose)",
        }}
      >
        <Icon name="quest" size={48} />
      </div>

      {/* Heading */}
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2rem, 6vw, 3rem)",
          letterSpacing: "0.04em",
          margin: "0 0 16px 0",
          color: "var(--text-main)",
        }}
      >
        No Active Quest
      </h2>

      {/* Body */}
      <p
        style={{
          fontSize: "0.95rem",
          color: "var(--text-muted)",
          lineHeight: 1.6,
          maxWidth: 440,
          margin: "0 auto 40px",
        }}
      >
        A remedial quest is generated when you score below 70% on a topic.
        Check your Progress page to see your weaknesses and trigger a quest.
      </p>

      {/* CTA */}
      <Link
        href="/pages/progress.html"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 28px",
          borderRadius: 9999,
          background: "var(--brand-rose)",
          color: "var(--white)",
          fontWeight: 700,
          fontSize: "0.95rem",
          textDecoration: "none",
          transition: "opacity 150ms ease",
        }}
      >
        <Icon name="progress" size={16} />
        View My Progress
      </Link>

      {completedQuests.length > 0 && (
        <CompletedQuestsRail items={completedQuests.slice(0, 8)} />
      )}
    </motion.div>
  )
}

function CompletedQuestsRail({ items }: { items: CompletedQuest[] }) {
  return (
    <div
      style={{
        marginTop: 56,
        textAlign: "left",
        maxWidth: 560,
        marginInline: "auto",
        paddingBottom: 80,
      }}
    >
      <div
        className="label-caps"
        style={{
          color: "var(--brand-mint)",
          textAlign: "center",
          marginBottom: 16,
          letterSpacing: "0.14em",
        }}
      >
        Completed Quests
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((q) => {
          const outcome = OUTCOME_LABEL[q.day3_outcome || ""] || { text: "Completed", tint: "var(--brand-mint)" }
          return (
            <div
              key={q.id}
              className="card-glass"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: `color-mix(in srgb, ${outcome.tint} 15%, transparent)`,
                  border: `1.5px solid ${outcome.tint}`,
                  color: outcome.tint,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="quest" size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    color: "var(--text-main)",
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmtSubject(q.subject)} · {q.topic}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {outcome.text}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
