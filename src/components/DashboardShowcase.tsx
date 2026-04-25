"use client"

import { useRef } from "react"
import { useScroll, useTransform, motion, useSpring } from "framer-motion"

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      style={{
        height: "5px",
        background: "rgba(227,217,202,0.07)",
        borderRadius: "99px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: "99px",
          boxShadow: `0 0 5px ${color}55`,
        }}
      />
    </div>
  )
}

// ─── Dashboard mockup ─────────────────────────────────────────────────────────

function DashboardMock() {
  const NAV = [
    { icon: "⊞", label: "Overview", active: true },
    { icon: "◎", label: "Quiz",     active: false },
    { icon: "▦", label: "Exams",    active: false },
    { icon: "◑", label: "Progress", active: false },
    { icon: "✦", label: "Tutor",    active: false },
  ]

  const SUBJECTS = [
    { name: "Mathematics", pct: 82, color: "#7EB8FF" },
    { name: "Science",     pct: 60, color: "#39FFB3" },
    { name: "English",     pct: 74, color: "#E8A0FF" },
  ]

  const ACTIVITY = [
    { icon: "◎", text: "MCQ: Fractions × 12",  sub: "2 min ago",  color: "#7EB8FF" },
    { icon: "▦", text: "Mock Exam: P5 Paper 01", sub: "Yesterday",  color: "#FFB830" },
    { icon: "✦", text: "Miss Wena: Speed ×÷",   sub: "2 days ago", color: "#39FFB3" },
  ]

  const ACTIONS = [
    { label: "◎  Practice Now",    bg: "rgba(183,110,121,0.18)", border: "rgba(183,110,121,0.38)", color: "#B76E79" },
    { label: "✦  Ask Miss Wena",   bg: "rgba(57,255,179,0.10)",  border: "rgba(57,255,179,0.28)",  color: "#39FFB3" },
    { label: "▦  Take Exam",       bg: "rgba(255,184,48,0.10)",  border: "rgba(255,184,48,0.25)",  color: "#FFB830" },
  ]

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0E1F1C",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "42px",
          padding: "0 18px",
          background: "#091512",
          borderBottom: "1px solid rgba(57,255,179,0.07)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #B76E79, #39FFB3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "9px",
            }}
          >
            ⚡
          </div>
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "13px",
              letterSpacing: "0.08em",
              color: "#e3d9ca",
            }}
          >
            Superholic Lab
          </span>
        </div>

        <div style={{ display: "flex", gap: "18px" }}>
          {["Dashboard", "Quiz", "Exams", "Progress"].map((item, i) => (
            <span
              key={item}
              style={{
                fontSize: "10px",
                fontWeight: i === 0 ? 600 : 400,
                color:
                  i === 0 ? "#39FFB3" : "rgba(227,217,202,0.38)",
                letterSpacing: "0.02em",
              }}
            >
              {item}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #B76E79, #B88078)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "9px",
              color: "white",
              fontWeight: 700,
            }}
          >
            W
          </div>
          <span style={{ fontSize: "10px", color: "rgba(227,217,202,0.55)" }}>
            Wei Hao · P5
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div
          style={{
            width: "136px",
            background: "#0B1916",
            borderRight: "1px solid rgba(57,255,179,0.05)",
            padding: "14px 0",
            display: "flex",
            flexDirection: "column",
            gap: "1px",
            flexShrink: 0,
          }}
        >
          {NAV.map(({ icon, label, active }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "7px 14px",
                background: active ? "rgba(57,255,179,0.07)" : "transparent",
                borderLeft: active
                  ? "2px solid #39FFB3"
                  : "2px solid transparent",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: active ? "#39FFB3" : "rgba(227,217,202,0.30)",
                }}
              >
                {icon}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: active ? 600 : 400,
                  color: active
                    ? "#e3d9ca"
                    : "rgba(227,217,202,0.38)",
                }}
              >
                {label}
              </span>
            </div>
          ))}

          {/* Streak widget */}
          <div style={{ marginTop: "auto", padding: "10px" }}>
            <div
              style={{
                background: "rgba(255,184,48,0.09)",
                border: "1px solid rgba(255,184,48,0.18)",
                borderRadius: "8px",
                padding: "8px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "15px" }}>🔥</div>
              <div
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#FFB830",
                  lineHeight: 1.1,
                }}
              >
                12
              </div>
              <div
                style={{
                  fontSize: "8px",
                  color: "rgba(255,184,48,0.65)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                day streak
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "11px",
            overflow: "hidden",
          }}
        >
          {/* Welcome */}
          <div>
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "14px",
                letterSpacing: "0.04em",
                color: "#e3d9ca",
              }}
            >
              Good morning, Wei Hao! ⚡
            </div>
            <div
              style={{ fontSize: "10px", color: "rgba(57,255,179,0.65)" }}
            >
              12-day streak — you&apos;re on fire. Keep going 🚀
            </div>
          </div>

          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "7px",
            }}
          >
            {[
              { val: "247",    label: "Questions", color: "#7EB8FF", bg: "rgba(126,184,255,0.07)" },
              { val: "84%",    label: "Accuracy",  color: "#39FFB3", bg: "rgba(57,255,179,0.07)"  },
              { val: "Top 8%", label: "Ranking",   color: "#FFB830", bg: "rgba(255,184,48,0.07)"  },
            ].map(({ val, label, color, bg }) => (
              <div
                key={label}
                style={{
                  background: bg,
                  border: `1px solid ${color}22`,
                  borderRadius: "8px",
                  padding: "7px 8px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    color,
                    lineHeight: 1,
                  }}
                >
                  {val}
                </div>
                <div
                  style={{
                    fontSize: "8px",
                    color: "rgba(227,217,202,0.42)",
                    marginTop: "2px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "9px",
              flex: 1,
              overflow: "hidden",
            }}
          >
            {/* Subject progress */}
            <div
              style={{
                background: "rgba(227,217,202,0.03)",
                border: "1px solid rgba(227,217,202,0.07)",
                borderRadius: "9px",
                padding: "9px 11px",
              }}
            >
              <div
                style={{
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "rgba(227,217,202,0.32)",
                  marginBottom: "8px",
                }}
              >
                Subject Progress
              </div>
              {SUBJECTS.map(({ name, pct, color }) => (
                <div key={name} style={{ marginBottom: "8px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "3px",
                    }}
                  >
                    <span
                      style={{ fontSize: "9px", color: "rgba(227,217,202,0.65)" }}
                    >
                      {name}
                    </span>
                    <span
                      style={{ fontSize: "9px", fontWeight: 600, color }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <Bar pct={pct} color={color} />
                </div>
              ))}
            </div>

            {/* Recent activity */}
            <div
              style={{
                background: "rgba(227,217,202,0.03)",
                border: "1px solid rgba(227,217,202,0.07)",
                borderRadius: "9px",
                padding: "9px 11px",
              }}
            >
              <div
                style={{
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "rgba(227,217,202,0.32)",
                  marginBottom: "8px",
                }}
              >
                Recent Activity
              </div>
              {ACTIVITY.map(({ icon, text, sub, color }, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "6px",
                    marginBottom: "7px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color,
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    {icon}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: "9px",
                        color: "rgba(227,217,202,0.75)",
                        lineHeight: 1.35,
                      }}
                    >
                      {text}
                    </div>
                    <div
                      style={{
                        fontSize: "8px",
                        color: "rgba(227,217,202,0.28)",
                      }}
                    >
                      {sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA row */}
          <div style={{ display: "flex", gap: "7px" }}>
            {ACTIONS.map(({ label, bg, border, color }) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: "6px",
                  padding: "6px 6px",
                  textAlign: "center",
                  fontSize: "9px",
                  fontWeight: 600,
                  color,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DashboardShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const spring = { stiffness: 180, damping: 26, bounce: 0 }

  // Unfold: tilted bird's-eye → flat
  const rotateX  = useSpring(useTransform(scrollYProgress, [0, 0.38], [22, 0]),  spring)
  // Rise: pushed down → natural position
  const y        = useSpring(useTransform(scrollYProgress, [0, 0.38], [90, 0]),   spring)
  // Zoom in slightly
  const scale    = useSpring(useTransform(scrollYProgress, [0, 0.38], [0.87, 1]), spring)
  // Fade in
  const opacity  = useSpring(useTransform(scrollYProgress, [0, 0.22], [0, 1]),    spring)
  // Title arrives just before the tablet
  const titleOp  = useSpring(useTransform(scrollYProgress, [0, 0.18], [0, 1]),    spring)
  const titleY   = useSpring(useTransform(scrollYProgress, [0, 0.18], [26, 0]),   spring)

  return (
    <section
      ref={containerRef}
      style={{ position: "relative", height: "260vh", background: "#1A2E2A" }}
    >
      {/* Sticky viewport */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(24px, 4vh, 48px) clamp(16px, 4vw, 48px)",
        }}
      >
        {/* Ambient glows */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "10%",
            left: "10%",
            width: "520px",
            height: "320px",
            background:
              "radial-gradient(ellipse, rgba(57,255,179,0.055) 0%, transparent 70%)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "15%",
            right: "8%",
            width: "420px",
            height: "260px",
            background:
              "radial-gradient(ellipse, rgba(183,110,121,0.055) 0%, transparent 70%)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        {/* ── Title ── */}
        <motion.div
          style={{
            opacity: titleOp,
            y: titleY,
            textAlign: "center",
            marginBottom: "clamp(14px, 2.5vh, 28px)",
            zIndex: 10,
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#39FFB3",
              background: "rgba(57,255,179,0.08)",
              border: "1px solid rgba(57,255,179,0.22)",
              borderRadius: "9999px",
              padding: "3px 14px",
              marginBottom: "10px",
            }}
          >
            Command Center
          </span>
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2rem, 4.2vw, 3.1rem)",
              letterSpacing: "0.04em",
              color: "#e3d9ca",
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            Your Superholic Lab{" "}
            <span
              style={{
                background:
                  "linear-gradient(90deg, #B76E79 0%, #FFB830 50%, #39FFB3 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Command Center
            </span>
          </h2>
          <p
            style={{
              marginTop: "8px",
              fontSize: "clamp(0.8rem, 1.3vw, 0.95rem)",
              color: "rgba(227,217,202,0.50)",
              maxWidth: "460px",
              lineHeight: 1.6,
              margin: "8px auto 0",
            }}
          >
            Every subject, every session, every breakthrough — all in one place.
          </p>
        </motion.div>

        {/* ── Perspective wrapper ── */}
        <div
          style={{
            perspective: "1200px",
            perspectiveOrigin: "50% 60%",
            width: "100%",
            maxWidth: "860px",
          }}
        >
          <motion.div
            style={{
              rotateX,
              scale,
              y,
              opacity,
              transformOrigin: "center bottom",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Tablet frame — glacier white glow */}
            <div
              style={{
                position: "relative",
                borderRadius: "16px",
                border: "1.5px solid rgba(235,250,255,0.72)",
                boxShadow: [
                  "0 0 0 1px rgba(215,245,255,0.09)",
                  "0 0 28px rgba(200,240,255,0.16)",
                  "0 0 72px rgba(180,228,255,0.07)",
                  "0 50px 120px rgba(0,0,0,0.65)",
                  "inset 0 0 0 1px rgba(235,250,255,0.03)",
                ].join(", "),
                overflow: "hidden",
                aspectRatio: "16 / 10",
              }}
            >
              {/* Screen glare strip */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "38%",
                  background:
                    "linear-gradient(180deg, rgba(235,250,255,0.035) 0%, transparent 100%)",
                  pointerEvents: "none",
                  zIndex: 10,
                  borderRadius: "16px 16px 0 0",
                }}
              />
              <DashboardMock />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
