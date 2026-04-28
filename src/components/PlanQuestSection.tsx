"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

const ROADMAP_STEPS = [
  {
    num: "01",
    title: "AI Weakness Scan",
    desc: "Miss Wena analyses 50+ data points to pinpoint every gap.",
    status: "complete" as const,
  },
  {
    num: "02",
    title: "Foundation Quest",
    desc: "Targeted drills that rebuild core concepts from the ground up.",
    status: "active" as const,
  },
  {
    num: "03",
    title: "Standard Drill",
    desc: "School-format practice with full worked solutions.",
    status: "locked" as const,
  },
  {
    num: "04",
    title: "Mock Assessment",
    desc: "PSLE-format timed exam with instant AI feedback.",
    status: "locked" as const,
  },
  {
    num: "05",
    title: "Miss Wena Sign-Off",
    desc: "Final mastery check — your child is PSLE-ready.",
    status: "locked" as const,
  },
]

const STATUS_CONFIG = {
  complete: { color: "#39FFB3", label: "Complete", icon: "✓" },
  active: { color: "#B76E79", label: "Active", icon: "▶" },
  locked: { color: "rgba(227,217,202,0.25)", label: "Locked", icon: "🔒" },
}

export function PlanQuestSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-12% 0px" })

  return (
    <>
      <style>{`
        @keyframes pqGradient {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pqRing {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(1.9); opacity: 0;   }
          100% { transform: scale(1.9); opacity: 0;   }
        }
        @keyframes pqFloat {
          0%,100% { transform: translateY(0px);  }
          50%     { transform: translateY(-9px); }
        }
      `}</style>

      <section
        ref={sectionRef}
        style={{
          position: "relative",
          background: "linear-gradient(180deg, #1A2E2A 0%, #263530 60%, #2D4A44 100%)",
          padding: "clamp(64px, 10vw, 120px) 0",
          overflow: "hidden",
        }}
      >
        {/* Grid texture */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(57,255,179,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,179,0.035) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            pointerEvents: "none",
          }}
        />

        {/* Ambient glows */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-180px",
            right: "-120px",
            width: "520px",
            height: "520px",
            background: "radial-gradient(circle, rgba(183,110,121,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-80px",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(57,255,179,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 clamp(16px, 5vw, 48px)",
          }}
        >
          {/* Section label */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ textAlign: "center", marginBottom: "56px" }}
          >
            <span
              style={{
                display: "inline-block",
                background: "rgba(57,255,179,0.1)",
                color: "#39FFB3",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                border: "1px solid rgba(57,255,179,0.2)",
                borderRadius: "9999px",
                padding: "0.3rem 1rem",
              }}
            >
              Your Personalised Mastery Plan
            </span>
          </motion.div>

          {/* Split grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
              gap: "clamp(32px, 6vw, 72px)",
              alignItems: "center",
            }}
          >
            {/* LEFT — image panel */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", justifyContent: "center" }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "460px",
                }}
              >
                {/* Corner accents */}
                {[
                  { top: -8, left: -8, borderTop: "2px solid #39FFB3", borderLeft: "2px solid #39FFB3" },
                  { top: -8, right: -8, borderTop: "2px solid #39FFB3", borderRight: "2px solid #39FFB3" },
                  { bottom: -8, left: -8, borderBottom: "2px solid #B76E79", borderLeft: "2px solid #B76E79" },
                  { bottom: -8, right: -8, borderBottom: "2px solid #B76E79", borderRight: "2px solid #B76E79" },
                ].map((style, i) => (
                  <div
                    key={i}
                    aria-hidden
                    style={{
                      position: "absolute",
                      width: 22,
                      height: 22,
                      ...style,
                    }}
                  />
                ))}

                {/* Glassmorphic frame */}
                <motion.div
                  animate={{ y: [0, -9, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    background: "rgba(227,217,202,0.055)",
                    border: "1.5px solid rgba(227,217,202,0.14)",
                    borderRadius: "22px",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: "4px 4px 0px rgba(42,42,42,0.22), 0 20px 60px rgba(0,0,0,0.4)",
                    padding: "20px",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src="/assets/plan_quest.png"
                    alt="Superholic Lab Plan Quest — personalised learning roadmap"
                    style={{
                      width: "100%",
                      height: "auto",
                      borderRadius: "12px",
                      display: "block",
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* RIGHT — roadmap panel */}
            <div>
              {/* Heading */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "clamp(2rem, 5vw, 3rem)",
                    letterSpacing: "0.04em",
                    color: "#e3d9ca",
                    lineHeight: 1.05,
                    marginBottom: "12px",
                  }}
                >
                  Roadmap to{" "}
                  <span
                    style={{
                      background: "linear-gradient(90deg, #B76E79, #39FFB3)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Mastery
                  </span>
                </h2>
                <p
                  style={{
                    color: "rgba(227,217,202,0.65)",
                    fontSize: "0.9875rem",
                    lineHeight: 1.65,
                    marginBottom: "36px",
                    maxWidth: "400px",
                  }}
                >
                  The Quest is set. Your child's path to PSLE Mastery is mapped.
                  Ready to start the first lesson?
                </p>
              </motion.div>

              {/* Roadmap timeline */}
              <div style={{ position: "relative" }}>
                {/* Vertical connector line */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: "18px",
                    top: "36px",
                    bottom: "36px",
                    width: "2px",
                    background:
                      "linear-gradient(180deg, #39FFB3 0%, rgba(183,110,121,0.6) 35%, rgba(227,217,202,0.12) 65%)",
                  }}
                />

                {ROADMAP_STEPS.map((step, index) => {
                  const cfg = STATUS_CONFIG[step.status]
                  return (
                    <motion.div
                      key={step.num}
                      initial={{ opacity: 0, x: -28 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{
                        duration: 0.5,
                        delay: 0.25 + index * 0.12,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      style={{
                        display: "flex",
                        gap: "16px",
                        alignItems: "flex-start",
                        marginBottom: index < ROADMAP_STEPS.length - 1 ? "20px" : 0,
                        position: "relative",
                      }}
                    >
                      {/* Step circle */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        {/* Pulsing ring for active */}
                        {step.status === "active" && (
                          <div
                            aria-hidden
                            style={{
                              position: "absolute",
                              inset: 0,
                              borderRadius: "50%",
                              border: `2px solid ${cfg.color}`,
                              animation: "pqRing 2s ease-out infinite",
                            }}
                          />
                        )}
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            background:
                              step.status === "locked"
                                ? "rgba(227,217,202,0.06)"
                                : step.status === "complete"
                                ? "rgba(57,255,179,0.15)"
                                : "rgba(183,110,121,0.2)",
                            border: `2px solid ${cfg.color}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: step.status === "locked" ? "0.75rem" : "0.875rem",
                            color: cfg.color,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            position: "relative",
                            zIndex: 1,
                          }}
                        >
                          {cfg.icon}
                        </div>
                      </div>

                      {/* Content */}
                      <div
                        style={{
                          flex: 1,
                          paddingTop: "6px",
                          opacity: step.status === "locked" ? 0.5 : 1,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "4px",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              color: "rgba(227,217,202,0.35)",
                              letterSpacing: "0.1em",
                            }}
                          >
                            {step.num}
                          </span>
                          <span
                            style={{
                              color: "#e3d9ca",
                              fontWeight: 700,
                              fontSize: "0.9375rem",
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                            }}
                          >
                            {step.title}
                          </span>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              color: cfg.color,
                              background: `${cfg.color}18`,
                              border: `1px solid ${cfg.color}44`,
                              borderRadius: "9999px",
                              padding: "2px 8px",
                              fontFamily: "'JetBrains Mono', monospace",
                              textTransform: "uppercase",
                            }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <p
                          style={{
                            color: "rgba(227,217,202,0.55)",
                            fontSize: "0.85rem",
                            lineHeight: 1.5,
                            margin: 0,
                          }}
                        >
                          {step.desc}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Gradient divider */}
              <div
                aria-hidden
                style={{
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(57,255,179,0.3), rgba(183,110,121,0.3), transparent)",
                  margin: "32px 0",
                }}
              />

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "0.9375rem 2rem",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#1A2E2A",
                    background: "linear-gradient(90deg, #B76E79, #B88078, #39FFB3, #B88078, #B76E79)",
                    backgroundSize: "300% 300%",
                    animation: "pqGradient 3.5s ease infinite",
                    boxShadow: "0 4px 24px rgba(57,255,179,0.25), 4px 4px 0px rgba(42,42,42,0.18)",
                    transition: "transform 150ms ease, box-shadow 150ms ease",
                    minHeight: "52px",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget
                    el.style.transform = "translate(-2px, -2px)"
                    el.style.boxShadow = "0 6px 32px rgba(57,255,179,0.35), 6px 6px 0px rgba(42,42,42,0.22)"
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget
                    el.style.transform = "translate(0, 0)"
                    el.style.boxShadow = "0 4px 24px rgba(57,255,179,0.25), 4px 4px 0px rgba(42,42,42,0.18)"
                  }}
                >
                  ⚡ Start Your Free Trial
                  <span style={{ fontSize: "1.1rem" }}>→</span>
                </button>
                <p
                  style={{
                    marginTop: "12px",
                    color: "rgba(227,217,202,0.4)",
                    fontSize: "0.8rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.04em",
                  }}
                >
                  7-day free trial · No credit card required
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
