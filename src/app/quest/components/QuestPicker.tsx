"use client"

/**
 * src/app/quest/components/QuestPicker.tsx
 * Shown when a student has 2–3 active remedial quests (one per subject).
 * They pick which quest to work on now; the selected questId is passed up.
 */

import { motion } from "framer-motion"
import { Icon } from "../../../components/icons"

type ActiveQuest = {
  id: string
  subject: string
  level: string
  topic: string
  current_step: number
  quest_title: string
}

type QuestPickerProps = {
  quests: ActiveQuest[]
  onSelect: (questId: string) => void
}

const SUBJECT_ICONS: Record<string, "quiz" | "tutor" | "quest"> = {
  mathematics: "quiz",
  science: "quest",
  english: "tutor",
}

const SUBJECT_CHIP_CLASS: Record<string, string> = {
  mathematics: "quest-chip quest-chip-mint",
  science: "quest-chip quest-chip-rose",
  english: "quest-chip quest-chip-amber",
}

export function QuestPicker({ quests, onSelect }: QuestPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: "40px 0 80px" }}
    >
      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span className="label-caps" style={{ color: "var(--brand-mint)", display: "block", marginBottom: 12 }}>
          Active Quests
        </span>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 6vw, 2.8rem)",
            letterSpacing: "0.04em",
            margin: 0,
            color: "var(--text-main)",
          }}
        >
          Which Quest Today?
        </h2>
      </div>

      {/* Quest cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {quests.map((quest, i) => {
          const subjectLabel = quest.subject.charAt(0).toUpperCase() + quest.subject.slice(1)
          const dayLabel = `Day ${quest.current_step + 1} of 3`
          const iconName = SUBJECT_ICONS[quest.subject] ?? "quest"
          const chipClass = SUBJECT_CHIP_CLASS[quest.subject] ?? "quest-chip"

          return (
            <motion.button
              key={quest.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              onClick={() => onSelect(quest.id)}
              className="card-glass"
              style={{
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                border: "none",
                padding: 28,
                display: "flex",
                alignItems: "center",
                gap: 20,
                transition: "border-color 150ms ease, transform 150ms ease",
              }}
              whileHover={{ y: -3 }}
            >
              {/* Subject icon */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "color-mix(in srgb, var(--brand-rose) 12%, transparent)",
                  border: "2px solid color-mix(in srgb, var(--brand-rose) 25%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--brand-rose)",
                  flexShrink: 0,
                }}
              >
                <Icon name={iconName} size={26} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                  <span className={chipClass} style={{ fontSize: "0.68rem" }}>
                    {subjectLabel}
                  </span>
                  <span className="quest-chip" style={{ fontSize: "0.68rem" }}>
                    {dayLabel}
                  </span>
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "var(--text-main)",
                    marginBottom: 2,
                    lineHeight: 1.3,
                  }}
                >
                  {quest.quest_title}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {quest.topic} · {quest.level}
                </div>
              </div>

              {/* Arrow */}
              <div style={{ color: "var(--brand-rose)", flexShrink: 0 }}>
                <Icon name="chevron" size={20} />
              </div>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
