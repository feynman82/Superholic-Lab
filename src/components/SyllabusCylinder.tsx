"use client"

import { useRef, useState, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import {
  AnimatePresence,
  motion,
  useScroll,
  useMotionValueEvent,
} from "framer-motion"
import * as THREE from "three"

// ─── Constants ────────────────────────────────────────────────────────────────

const SYLLABUS_TOPICS = [
  "Whole Numbers", "Fractions", "Decimals", "Percentage", "Ratio",
  "Area & Perimeter", "Volume", "Geometry", "Rate & Speed", "Algebra",
  "Data Analysis", "Diversity of Materials", "Cycles in Plants",
  "Human Systems", "Electrical Systems", "Cell System", "Forces",
  "Energy Forms", "Photosynthesis", "Water Cycle", "Heat & Temperature", "Magnets",
]

const WEAK_TOPIC = "Fractions"
const R = 3.0          // cylinder radius (units)
const H = 7.2          // cylinder height (units)
const FONT_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2"

// ─── Helix layout ─────────────────────────────────────────────────────────────

interface TopicDatum {
  topic: string
  pos: [number, number, number]  // world position on cylinder
  yRot: number                   // outward-facing Y rotation (local to cylinder group)
  outX: number                   // outward unit direction X
  outZ: number                   // outward unit direction Z
}

function buildHelix(): TopicDatum[] {
  const n = SYLLABUS_TOPICS.length
  return SYLLABUS_TOPICS.map((topic, i) => {
    const t = i / (n - 1)
    // 1.75 full rotations so start and end are on the same side
    const angle = t * Math.PI * 3.5
    const x = R * Math.sin(angle)
    const z = R * Math.cos(angle)
    const y = t * H - H / 2
    return {
      topic,
      pos: [x, y, z],
      yRot: angle,                   // matches outward normal direction
      outX: Math.sin(angle),
      outZ: Math.cos(angle),
    }
  })
}

// ─── Scan line (stays in world space — does not rotate with cylinder) ─────────

function ScanLine() {
  const groupRef = useRef<THREE.Group>(null)
  const D = R * 2.4  // bar width

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    // Smooth oscillation top ↔ bottom
    groupRef.current.position.y =
      Math.sin(clock.elapsedTime * 0.55) * (H / 2 - 0.4)
  })

  return (
    <group ref={groupRef}>
      {/* Outer glow halo */}
      <mesh>
        <planeGeometry args={[D * 1.18, 0.42]} />
        <meshBasicMaterial
          color="#39FFB3"
          transparent
          opacity={0.035}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Mid glow */}
      <mesh>
        <planeGeometry args={[D, 0.14]} />
        <meshBasicMaterial
          color="#39FFB3"
          transparent
          opacity={0.14}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Core beam */}
      <mesh>
        <planeGeometry args={[D * 0.96, 0.023]} />
        <meshBasicMaterial
          color="#7DFFD3"
          transparent
          opacity={0.96}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* End-cap sparks */}
      {([-D / 2, D / 2] as const).map((x, idx) => (
        <mesh key={idx} position={[x, 0, 0]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshBasicMaterial color="#39FFB3" transparent opacity={0.7} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Single topic label ───────────────────────────────────────────────────────

interface TopicTextProps {
  datum: TopicDatum
  isWeak: boolean
  weakActive: boolean
}

function TopicText({ datum, isWeak, weakActive }: TopicTextProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const g = groupRef.current
    if (!g) return

    const isLit = isWeak && weakActive

    // Pop-out: lerp toward outward offset
    const targetPop = isLit ? 1.1 : 0
    const curPop: number = (g.userData.pop as number) ?? 0
    const newPop = THREE.MathUtils.lerp(curPop, targetPop, 0.07)
    g.userData.pop = newPop

    g.position.set(
      datum.pos[0] + datum.outX * newPop,
      datum.pos[1],
      datum.pos[2] + datum.outZ * newPop,
    )

    // Scale pulse on highlighted topic
    const targetScale = isLit ? 1.42 : 1.0
    const ns = THREE.MathUtils.lerp(g.scale.x, targetScale, 0.07)
    g.scale.setScalar(ns)
  })

  return (
    <group
      ref={groupRef}
      position={datum.pos}
      rotation={[0, datum.yRot, 0]}
    >
      <Text
        fontSize={0.21}
        color={isWeak && weakActive ? "#FF6B35" : "#ffffff"}
        fillOpacity={isWeak && weakActive ? 1.0 : 0.58}
        anchorX="center"
        anchorY="middle"
        font={FONT_URL}
        outlineWidth={isWeak && weakActive ? 0.006 : 0}
        outlineColor="#FF4500"
        outlineOpacity={0.7}
      >
        {datum.topic}
      </Text>
    </group>
  )
}

// ─── Cylinder decorations (shell + rings + axis) ──────────────────────────────

function CylinderDecor() {
  return (
    <>
      {/* Transparent shell — gives the object a sense of volume */}
      <mesh>
        <cylinderGeometry args={[R, R, H, 48, 1, true]} />
        <meshBasicMaterial
          color="#39FFB3"
          transparent
          opacity={0.028}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Top & bottom rings */}
      {([H / 2, -H / 2] as const).map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R - 0.04, R + 0.05, 64]} />
          <meshBasicMaterial
            color="#39FFB3"
            transparent
            opacity={0.28}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Central axis glow */}
      <mesh>
        <cylinderGeometry args={[0.007, 0.007, H + 0.6, 8]} />
        <meshBasicMaterial color="#39FFB3" transparent opacity={0.32} depthWrite={false} />
      </mesh>
    </>
  )
}

// ─── R3F scene (lives inside Canvas) ─────────────────────────────────────────

interface SceneProps {
  speedRef: { current: number }
  weakActive: boolean
}

function CylinderScene({ speedRef, weakActive }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null)
  const helixData = useMemo(buildHelix, [])

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += speedRef.current
    }
  })

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.12} />
      <pointLight color="#39FFB3" intensity={1.0} position={[0, 2, 7]} decay={1.8} />
      <pointLight color="#4466FF" intensity={0.4} position={[-7, -3, 4]} decay={1.8} />
      <pointLight color="#FF6B35" intensity={weakActive ? 1.2 : 0} position={[R + 1, 0, R + 1]} decay={2} />

      {/* Rotating cylinder group */}
      <group ref={groupRef}>
        <CylinderDecor />
        {helixData.map((datum) => (
          <TopicText
            key={datum.topic}
            datum={datum}
            isWeak={datum.topic === WEAK_TOPIC}
            weakActive={weakActive}
          />
        ))}
      </group>

      {/* Scan line stays in world space (not inside the rotating group) */}
      <ScanLine />
    </>
  )
}

// ─── Quest Card HTML overlay ──────────────────────────────────────────────────

function QuestCard() {
  const steps = [
    "Review LCD method — 5 min explainer",
    "Practice 3 Foundation MCQs",
    "Solve 1 Standard word problem",
    "Miss Wena check-in",
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 72, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 72, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 210, damping: 24 }}
      style={{
        position: "absolute",
        right: "clamp(14px, 5vw, 72px)",
        top: "50%",
        transform: "translateY(-50%)",
        width: "clamp(240px, 27vw, 308px)",
        background: "rgba(227,217,202,0.06)",
        border: "1.5px solid rgba(227,217,202,0.13)",
        borderLeft: "3px solid #FF6B35",
        borderRadius: "14px",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        padding: "18px 20px",
        boxShadow: [
          "4px 4px 0px rgba(42,42,42,0.22)",
          "0 0 32px rgba(255,107,53,0.14)",
          "0 0 0 1px rgba(255,107,53,0.08)",
        ].join(", "),
        zIndex: 30,
        pointerEvents: "none",
      }}
    >
      {/* Mint shimmer */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(255,107,53,0.04) 0%, transparent 60%)",
          borderRadius: "inherit",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "10px" }}>
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            background: "rgba(255,107,53,0.13)",
            border: "1.5px solid rgba(255,107,53,0.42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            flexShrink: 0,
          }}
        >
          ⚠
        </div>
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#FF6B35",
            }}
          >
            Weakness Detected
          </div>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.1rem",
              letterSpacing: "0.04em",
              color: "#e3d9ca",
              lineHeight: 1,
            }}
          >
            {WEAK_TOPIC}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, rgba(255,107,53,0.35), transparent)",
          marginBottom: "10px",
        }}
      />

      {/* Gap analysis */}
      <div style={{ marginBottom: "10px" }}>
        <div
          style={{
            fontSize: "0.67rem",
            fontWeight: 700,
            color: "#FF6B35",
            marginBottom: "4px",
          }}
        >
          Gap Analysis
        </div>
        <p
          style={{
            fontSize: "0.72rem",
            color: "rgba(227,217,202,0.68)",
            lineHeight: 1.52,
            margin: 0,
          }}
        >
          3 wrong answers in <em style={{ color: "rgba(227,217,202,0.85)" }}>adding unlike fractions</em>. Root error: adding numerators and denominators separately instead of finding LCD.
        </p>
      </div>

      {/* Quest plan */}
      <div
        style={{
          background: "rgba(57,255,179,0.055)",
          border: "1px solid rgba(57,255,179,0.17)",
          borderRadius: "8px",
          padding: "10px 12px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontSize: "0.67rem",
            fontWeight: 700,
            color: "#39FFB3",
            marginBottom: "7px",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.06em",
          }}
        >
          📋 REMEDIAL QUEST PLAN
        </div>
        {steps.map((step, i) => (
          <div
            key={i}
            style={{ display: "flex", gap: "6px", marginBottom: "5px" }}
          >
            <span
              style={{
                fontSize: "0.65rem",
                color: "#39FFB3",
                flexShrink: 0,
                marginTop: "2px",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {i + 1}.
            </span>
            <span
              style={{ fontSize: "0.71rem", color: "rgba(227,217,202,0.74)", lineHeight: 1.45 }}
            >
              {step}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        style={{
          background: "rgba(255,107,53,0.13)",
          border: "1px solid rgba(255,107,53,0.34)",
          borderRadius: "8px",
          padding: "8px 14px",
          textAlign: "center",
          fontSize: "0.76rem",
          fontWeight: 700,
          color: "#FF6B35",
          letterSpacing: "0.02em",
        }}
      >
        ⚡ Start Remedial Quest →
      </div>
    </motion.div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function SyllabusCylinder() {
  const containerRef = useRef<HTMLDivElement>(null)
  // Shared mutable refs — avoids re-renders on every scroll tick
  const speedRef = useRef(0.005)
  const weakActiveRef = useRef(false)
  const [weakActive, setWeakActive] = useState(false)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Quadratic ease: fast at edges, very slow at center (0.5)
    const d = Math.abs(v - 0.5)
    speedRef.current = 0.0012 + d * d * 0.065

    // Trigger weakness detection when scroll reaches the center band
    const shouldWeak = v > 0.38 && v < 0.65
    if (shouldWeak !== weakActiveRef.current) {
      weakActiveRef.current = shouldWeak
      setWeakActive(shouldWeak)
    }
  })

  return (
    <section
      ref={containerRef}
      style={{ position: "relative", height: "300vh" }}
    >
      {/* ── Sticky viewport ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background: "#1A2E2A",
        }}
      >
        {/* Ambient glows */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "400px",
            background:
              "radial-gradient(ellipse, rgba(57,255,179,0.045) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        {/* ── Section header ── */}
        <div
          style={{
            position: "absolute",
            top: "clamp(18px, 3.5vh, 34px)",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 20,
            pointerEvents: "none",
            whiteSpace: "nowrap",
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
              marginBottom: "8px",
            }}
          >
            AI Weakness Scanner
          </span>
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(1.75rem, 3vw, 2.4rem)",
              letterSpacing: "0.04em",
              color: "#e3d9ca",
              margin: "4px 0 0",
              lineHeight: 1.05,
            }}
          >
            Syllabus Intelligence
          </h2>
        </div>

        {/* ── Scroll hint ── */}
        <div
          style={{
            position: "absolute",
            bottom: "clamp(18px, 3vh, 30px)",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          <motion.div
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.62rem",
              letterSpacing: "0.10em",
              color: "rgba(57,255,179,0.6)",
            }}
          >
            SCROLL TO SCAN
          </motion.div>
        </div>

        {/* ── Status badge (weakness mode) ── */}
        <AnimatePresence>
          {weakActive && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              style={{
                position: "absolute",
                top: "clamp(90px, 14vh, 120px)",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 25,
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255,107,53,0.12)",
                border: "1px solid rgba(255,107,53,0.35)",
                borderRadius: "9999px",
                padding: "4px 14px",
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#FF6B35",
                }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.10em",
                  color: "#FF6B35",
                  textTransform: "uppercase",
                }}
              >
                Weakness Detected: {WEAK_TOPIC}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── WebGL Canvas ── */}
        <Canvas
          gl={{ alpha: true, antialias: true }}
          camera={{ position: [0, 0, 9], fov: 44 }}
          style={{ position: "absolute", inset: 0 }}
        >
          <CylinderScene speedRef={speedRef} weakActive={weakActive} />
        </Canvas>

        {/* ── Quest Card HTML overlay ── */}
        <AnimatePresence>
          {weakActive && <QuestCard key="quest-card" />}
        </AnimatePresence>
      </div>
    </section>
  )
}
