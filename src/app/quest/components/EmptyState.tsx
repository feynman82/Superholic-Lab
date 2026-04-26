"use client"

/**
 * src/app/quest/components/EmptyState.tsx
 * Shown when the student has no active remedial quest.
 * CTA sends them to progress.html where they can generate one.
 */

import { motion } from "framer-motion"
import Link from "next/link"
import { Icon } from "../../../components/icons"

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ textAlign: "center", padding: "80px 24px 120px" }}
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
    </motion.div>
  )
}
