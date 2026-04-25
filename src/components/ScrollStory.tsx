"use client"

import { useRef, useState, useEffect } from "react"
import { useScroll, useTransform, motion, useMotionValueEvent } from "framer-motion"
import Lottie, { type LottieRefCurrentProps } from "lottie-react"

// ─── Journey step data ────────────────────────────────────────────────────────

const STEPS = [
  {
    id: "learn",
    step: "01",
    emoji: "✨",
    title: "Learn",
    subtitle: "Miss Wena + Quest Plan",
    body: "Your AI tutor scaffolds every concept with 3-hint guidance — never giving answers too soon. A personalised Quest Plan maps your child's exact path forward.",
    accent: "#B76E79",
    ring: "rgba(183,110,121,0.30)",
    bg: "rgba(183,110,121,0.09)",
  },
  {
    id: "practice",
    step: "02",
    emoji: "🎯",
    title: "Practice",
    subtitle: "6 PSLE Question Types",
    body: "Drill every format — MCQ, Short Answer, Word Problems, Open-Ended, Cloze, and Editing — with instant wrong-answer explanations targeting the exact misconception.",
    accent: "#39FFB3",
    ring: "rgba(57,255,179,0.30)",
    bg: "rgba(57,255,179,0.07)",
  },
  {
    id: "assess",
    step: "03",
    emoji: "📝",
    title: "Assess",
    subtitle: "Full Exam Simulation",
    body: "AI-generated papers that mirror the real PSLE format. Timed, structured, and marked with complete worked solutions so every mistake becomes a lesson.",
    accent: "#B88078",
    ring: "rgba(184,128,120,0.30)",
    bg: "rgba(184,128,120,0.09)",
  },
  {
    id: "mastery",
    step: "04",
    emoji: "🏆",
    title: "Mastery",
    subtitle: "Progress Tracker",
    body: "Watch streaks build, gaps close, and scores climb. AI-powered weakness analysis pinpoints which topics to revisit — then celebrates when you nail them.",
    accent: "#FFB830",
    ring: "rgba(255,184,48,0.30)",
    bg: "rgba(255,184,48,0.09)",
  },
]

// ─── Singapore skyline SVG background ────────────────────────────────────────

function SingaporeScape() {
  return (
    <svg
      viewBox="0 0 3600 520"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMinYMax meet"
      aria-hidden="true"
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <defs>
        <linearGradient id="sg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A2E2A" />
          <stop offset="55%" stopColor="#263530" />
          <stop offset="100%" stopColor="#3A5550" />
        </linearGradient>
        <linearGradient id="sg-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A4A3A" />
          <stop offset="100%" stopColor="#192E22" />
        </linearGradient>
        {/* Window tile used across all blocks */}
        <pattern id="wins" x="0" y="0" width="22" height="26" patternUnits="userSpaceOnUse">
          <rect x="2" y="2" width="8" height="10" rx="1" fill="rgba(227,217,202,0.20)" />
          <rect x="12" y="2" width="8" height="10" rx="1" fill="rgba(227,217,202,0.14)" />
          <rect x="2" y="15" width="8" height="10" rx="1" fill="rgba(227,217,202,0.17)" />
          <rect x="12" y="15" width="8" height="10" rx="1" fill="rgba(227,217,202,0.11)" />
        </pattern>
      </defs>

      {/* Sky */}
      <rect width="3600" height="520" fill="url(#sg-sky)" />

      {/* Moon */}
      <circle cx="3150" cy="72" r="30" fill="rgba(227,217,202,0.55)" />
      <circle cx="3165" cy="64" r="26" fill="#1E3530" />

      {/* Stars */}
      {[180,460,790,1080,1490,1870,2260,2680,2990,3480].map((cx, i) => (
        <circle key={cx} cx={cx} cy={[58,38,52,28,46,32,60,38,50,25][i]} r={i % 3 === 0 ? 1.5 : 1} fill="rgba(227,217,202,0.45)" />
      ))}

      {/* ── Block A — wide residential slab with rose band ── */}
      <rect x="80" y="148" width="300" height="302" rx="2" fill="#4A6460" />
      <rect x="80" y="148" width="300" height="14" fill="#B76E79" />
      <rect x="80" y="148" width="300" height="302" fill="url(#wins)" />
      <rect x="198" y="122" width="62" height="26" rx="4" fill="#3A5450" />
      {/* void deck */}
      <rect x="80" y="416" width="300" height="34" fill="#364E4A" />
      {[108,162,222,282,342].map(x => <rect key={x} x={x} y="420" width="6" height="30" fill="#273A36" />)}

      {/* Trees A */}
      {[450, 505, 562].map((x, i) => (
        <g key={x}>
          <rect x={x + 7} y="368" width="5" height="82" fill="#2A4A3A" />
          <ellipse cx={x + 9} cy="352" rx={15 + i * 3} ry={18 + i * 2} fill="#265A3A" />
          <ellipse cx={x + 9} cy="344" rx={10 + i * 2} ry={12 + i} fill="#337A4A" opacity="0.75" />
        </g>
      ))}

      {/* ── Block B — slim tower with mint accent ── */}
      <rect x="648" y="82" width="172" height="368" rx="2" fill="#426262" />
      <rect x="648" y="82" width="172" height="16" fill="#39FFB3" opacity="0.65" />
      <rect x="648" y="190" width="172" height="7" fill="#39FFB3" opacity="0.22" />
      <rect x="648" y="298" width="172" height="7" fill="#39FFB3" opacity="0.14" />
      <rect x="648" y="82" width="172" height="368" fill="url(#wins)" />
      <rect x="706" y="58" width="58" height="24" rx="4" fill="#345450" />

      {/* ── Block C — mid-rise with amber band ── */}
      <rect x="892" y="188" width="262" height="262" rx="2" fill="#4E6A66" />
      <rect x="892" y="188" width="262" height="16" fill="#FFB830" opacity="0.75" />
      <rect x="892" y="270" width="262" height="7" fill="#FFB830" opacity="0.28" />
      <rect x="892" y="188" width="262" height="262" fill="url(#wins)" />
      {/* antenna beacon */}
      <rect x="1016" y="162" width="4" height="26" fill="#3A5450" />
      <circle cx="1018" cy="158" r="5" fill="#39FFB3" opacity="0.75" />

      {/* ── Hawker Centre ── */}
      <rect x="1234" y="298" width="218" height="152" rx="4" fill="#586E6A" />
      <polygon points="1224,298 1462,298 1400,248 1286,248" fill="#4A5E5A" />
      <rect x="1280" y="258" width="140" height="5" fill="rgba(57,255,179,0.35)" />
      {[1252,1312,1372,1424].map(x => <rect key={x} x={x} y="298" width="7" height="152" fill="#354E4A" />)}

      {/* Trees B */}
      {[1528, 1588, 1648, 1706].map((x, i) => (
        <g key={x}>
          <rect x={x + 7} y="348" width="5" height={100 - i * 8} fill="#2A4A3A" />
          <ellipse cx={x + 9} cy={332 - i * 3} rx={17 + i * 2} ry={20 + i * 2} fill="#265A3A" />
          <ellipse cx={x + 9} cy={323 - i * 3} rx={11 + i} ry={14 + i} fill="#337A4A" opacity="0.68" />
        </g>
      ))}

      {/* ── Block D — tall slab with purple band ── */}
      <rect x="1798" y="108" width="238" height="342" rx="2" fill="#456260" />
      <rect x="1798" y="108" width="238" height="16" fill="#E8A0FF" opacity="0.65" />
      <rect x="1798" y="228" width="238" height="7" fill="#E8A0FF" opacity="0.22" />
      <rect x="1798" y="108" width="238" height="342" fill="url(#wins)" />
      <rect x="1878" y="84" width="68" height="24" rx="4" fill="#354E4A" />
      <rect x="1798" y="416" width="238" height="34" fill="#364E4A" />
      {[1822,1878,1938,1990].map(x => <rect key={x} x={x} y="420" width="6" height="30" fill="#273A36" />)}

      {/* Playground */}
      <circle cx="2152" cy="434" r="32" stroke="#39FFB3" strokeWidth="1.5" fill="none" opacity="0.28" strokeDasharray="5 4" />
      <line x1="2122" y1="418" x2="2182" y2="438" stroke="#39FFB3" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
      <line x1="2122" y1="438" x2="2182" y2="418" stroke="#39FFB3" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
      <rect x="2224" y="408" width="6" height="42" rx="3" fill="#4A7A64" />
      <rect x="2244" y="408" width="6" height="42" rx="3" fill="#4A7A64" />
      <rect x="2220" y="404" width="34" height="6" rx="2" fill="#B76E79" />

      {/* ── Block E ── */}
      <rect x="2354" y="126" width="196" height="324" rx="2" fill="#4A6562" />
      <rect x="2354" y="126" width="196" height="14" fill="#B88078" />
      <rect x="2354" y="126" width="196" height="324" fill="url(#wins)" />
      <rect x="2424" y="102" width="54" height="24" rx="4" fill="#345050" />

      {/* Shop row */}
      {([2630, 2710, 2790, 2870] as const).map((x, i) => (
        <g key={x}>
          <rect x={x} y={282 + i * 5} width="74" height="168" rx="3" fill={["#5E7470","#647870","#5A6E6A","#607468"][i]} />
          <rect x={x} y={272 + i * 5} width="74" height="12" fill={["#B76E79","#39FFB3","#FFB830","#E8A0FF"][i]} opacity="0.55" />
          <rect x={x + 9} y={298 + i * 5} width="22" height="30" rx="1" fill="rgba(227,217,202,0.16)" />
          <rect x={x + 42} y={298 + i * 5} width="22" height="30" rx="1" fill="rgba(227,217,202,0.12)" />
        </g>
      ))}

      {/* ── Block F — final tall slab ── */}
      <rect x="3032" y="74" width="276" height="376" rx="2" fill="#436260" />
      <rect x="3032" y="74" width="276" height="16" fill="#39FFB3" opacity="0.58" />
      <rect x="3032" y="204" width="276" height="7" fill="#39FFB3" opacity="0.18" />
      <rect x="3032" y="332" width="276" height="7" fill="#39FFB3" opacity="0.12" />
      <rect x="3032" y="74" width="276" height="376" fill="url(#wins)" />
      <rect x="3122" y="50" width="74" height="24" rx="4" fill="#344E4A" />

      {/* Trees C */}
      {[3394, 3456, 3518].map((x, i) => (
        <g key={x}>
          <rect x={x + 7} y="358" width="5" height="92" fill="#2A4A3A" />
          <ellipse cx={x + 9} cy="341" rx={16 + i * 4} ry={18 + i * 3} fill="#265A3A" />
        </g>
      ))}

      {/* Ground */}
      <rect x="0" y="450" width="3600" height="70" fill="url(#sg-ground)" />
      {/* Sidewalk stripe */}
      <rect x="0" y="460" width="3600" height="18" fill="rgba(227,217,202,0.04)" />
      {/* Dashed path markings */}
      {Array.from({ length: 47 }, (_, i) => (
        <rect key={i} x={i * 78} y="466" width="50" height="5" rx="2" fill="rgba(227,217,202,0.11)" />
      ))}
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null)
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lottieData, setLottieData] = useState<any>(null)

  // Fetch Lottie JSON from public/ at runtime (SSR-safe)
  useEffect(() => {
    fetch("/assets/hero-walk.json")
      .then((r) => r.json())
      .then(setLottieData)
  }, [])

  // Scroll progress across the full 500vh section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  // Parallax layers
  const bgX        = useTransform(scrollYProgress, [0, 1], ["0%", "-52%"])
  const gridX      = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"])
  const charDrift  = useTransform(scrollYProgress, [0, 1], ["-10px", "10px"])
  const progressW  = useTransform(scrollYProgress, [0, 1], ["2%", "100%"])

  // Card reveal — opacity + y for each step (hooks must be at top level, not in a loop)
  const c0o = useTransform(scrollYProgress, [0.15, 0.22], [0, 1])
  const c0y = useTransform(scrollYProgress, [0.15, 0.22], [28, 0])
  const c1o = useTransform(scrollYProgress, [0.35, 0.42], [0, 1])
  const c1y = useTransform(scrollYProgress, [0.35, 0.42], [28, 0])
  const c2o = useTransform(scrollYProgress, [0.55, 0.62], [0, 1])
  const c2y = useTransform(scrollYProgress, [0.55, 0.62], [28, 0])
  const c3o = useTransform(scrollYProgress, [0.75, 0.82], [0, 1])
  const c3y = useTransform(scrollYProgress, [0.75, 0.82], [28, 0])

  const cardMotion = [
    { opacity: c0o, y: c0y },
    { opacity: c1o, y: c1y },
    { opacity: c2o, y: c2y },
    { opacity: c3o, y: c3y },
  ]

  // Milestone dot opacities reuse card opacities
  const dotOpacities = [c0o, c1o, c2o, c3o]

  // Map scroll 0→1 to Lottie frame 0→totalFrames
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const ai = lottieRef.current?.animationItem
    if (!ai) return
    lottieRef.current!.goToAndStop(Math.floor(v * Math.max(0, ai.totalFrames - 1)), true)
  })

  return (
    <section
      ref={containerRef}
      style={{ position: "relative", height: "500vh" }}
    >
      {/* ── Sticky 100vh canvas ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background: "var(--sage-darker, #3A4E4A)",
        }}
      >
        {/* Parallax cityscape */}
        <motion.div
          aria-hidden="true"
          style={{
            x: bgX,
            position: "absolute",
            top: 0,
            left: 0,
            width: "200%",
            height: "100%",
          }}
        >
          <SingaporeScape />
        </motion.div>

        {/* Moving dot-grid overlay — gives forward-motion feel */}
        <motion.div
          aria-hidden="true"
          style={{
            x: gridX,
            position: "absolute",
            inset: 0,
            width: "160%",
            backgroundImage:
              "radial-gradient(circle, rgba(57,255,179,0.10) 1.2px, transparent 1.2px)",
            backgroundSize: "38px 38px",
            pointerEvents: "none",
          }}
        />

        {/* Right-side vignette softens the card/background seam */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, transparent 40%, rgba(38,42,40,0.60) 68%, rgba(24,28,26,0.80) 100%)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        {/* ── Section label + heading ── */}
        <div
          style={{
            position: "absolute",
            top: "clamp(20px, 4vh, 40px)",
            left: "clamp(16px, 4vw, 48px)",
            zIndex: 20,
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
              color: "var(--mint, #39FFB3)",
              background: "rgba(57,255,179,0.08)",
              border: "1px solid rgba(57,255,179,0.22)",
              borderRadius: "9999px",
              padding: "3px 14px",
              marginBottom: "10px",
            }}
          >
            The Learning Journey
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display, 'Bebas Neue', sans-serif)",
              fontSize: "clamp(1.8rem, 3.2vw, 2.5rem)",
              letterSpacing: "0.04em",
              color: "var(--cream, #e3d9ca)",
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            From First Try
            <br />
            to Full Marks
          </h2>
        </div>

        {/* ── Walking character (Lottie, scroll-driven) ── */}
        <motion.div
          style={{
            x: charDrift,
            position: "absolute",
            bottom: "clamp(60px, 9vh, 110px)",
            left: "clamp(80px, 18vw, 240px)",
            width: "clamp(110px, 13vw, 190px)",
            zIndex: 25,
            filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.55))",
          }}
        >
          {lottieData ? (
            <Lottie
              lottieRef={lottieRef}
              animationData={lottieData}
              autoplay={false}
              loop={false}
              onDOMLoaded={() => lottieRef.current?.goToAndStop(0, true)}
            />
          ) : (
            // Placeholder silhouette while JSON loads
            <div
              style={{
                width: "100%",
                paddingBottom: "120%",
                background: "rgba(227,217,202,0.07)",
                borderRadius: "50% 50% 42% 42%",
                border: "1px solid rgba(227,217,202,0.10)",
              }}
            />
          )}
        </motion.div>

        {/* ── Journey cards — right panel, stacks as you scroll ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "clamp(270px, 41vw, 500px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "clamp(8px, 1.2vh, 14px)",
            padding:
              "clamp(72px, 11vh, 110px) clamp(16px, 3vw, 40px) clamp(72px, 10vh, 96px)",
            zIndex: 20,
          }}
        >
          {STEPS.map((step, i) => (
            <motion.div
              key={step.id}
              style={{
                opacity: cardMotion[i].opacity,
                y: cardMotion[i].y,
                position: "relative",
                background: step.bg,
                border: `1.5px solid rgba(227,217,202,0.12)`,
                borderLeft: `3px solid ${step.accent}`,
                borderRadius: "14px",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                padding:
                  "clamp(10px, 1.8vh, 18px) clamp(12px, 1.5vw, 20px)",
                boxShadow: `4px 4px 0px rgba(42,42,42,0.22), 0 0 0 1px ${step.ring}`,
                overflow: "hidden",
              }}
            >
              {/* Mint gradient overlay (card identity) */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(135deg, rgba(57,255,179,0.03) 0%, transparent 60%)",
                  pointerEvents: "none",
                }}
              />

              {/* Step badge + emoji */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.60rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: step.accent,
                    border: `1px solid ${step.ring}`,
                    borderRadius: "9999px",
                    padding: "1px 8px",
                    flexShrink: 0,
                  }}
                >
                  STEP {step.step}
                </span>
                <span style={{ fontSize: "0.95rem", lineHeight: 1 }}>
                  {step.emoji}
                </span>
              </div>

              {/* Title */}
              <div
                style={{
                  fontFamily:
                    "var(--font-display, 'Bebas Neue', sans-serif)",
                  fontSize: "clamp(1.2rem, 2.2vw, 1.55rem)",
                  letterSpacing: "0.04em",
                  color: "var(--cream, #e3d9ca)",
                  lineHeight: 1.05,
                }}
              >
                {step.title}
              </div>

              {/* Subtitle */}
              <div
                style={{
                  fontSize: "clamp(0.62rem, 0.95vw, 0.72rem)",
                  fontWeight: 600,
                  color: step.accent,
                  marginBottom: "5px",
                }}
              >
                {step.subtitle}
              </div>

              {/* Body */}
              <p
                style={{
                  fontSize: "clamp(0.66rem, 1.05vw, 0.76rem)",
                  color: "rgba(200,191,178,0.85)",
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── Progress trail with milestone dots ── */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "clamp(20px, 3vh, 36px)",
            left: "clamp(16px, 4vw, 48px)",
            right: "clamp(16px, 4vw, 48px)",
            height: "3px",
            background: "rgba(227,217,202,0.07)",
            borderRadius: "9999px",
            zIndex: 20,
          }}
        >
          <motion.div
            style={{
              width: progressW,
              height: "100%",
              background:
                "linear-gradient(90deg, #B76E79, #B88078, #FFB830, #39FFB3)",
              borderRadius: "9999px",
              boxShadow: "0 0 8px rgba(57,255,179,0.30)",
            }}
          />

          {/* Dots mark each journey milestone */}
          {([0.2, 0.4, 0.6, 0.8] as const).map((pos, i) => (
            <motion.div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: `${pos * 100}%`,
                transform: "translate(-50%, -50%)",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: STEPS[i].accent,
                border: "2px solid rgba(30,30,30,0.55)",
                opacity: dotOpacities[i],
                boxShadow: `0 0 8px ${STEPS[i].accent}`,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
