'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import { liveTelemetry } from './data/liveTelemetry';

const NODES = [
  { id: 'q', label: 'QUESTION',      x: 60  },
  { id: 'm', label: 'MISCONCEPTION', x: 230 },
  { id: 'b', label: 'BKT SCORE',     x: 410 },
  { id: 'a', label: 'AL BAND',       x: 580 },
  { id: 'w', label: 'WENA',          x: 760 },
];

const PIPELINE_WIDTH = 880;
const PIPELINE_HEIGHT = 200; // tightened from 360 — less blank space above/below nodes
const PACKET_DURATION = 6; // seconds end-to-end

interface Packet {
  id: number;
  startTime: number;
  event: typeof liveTelemetry[number];
}

export default function EngineAbout() {
  const reduce = useReducedMotion();
  const [packets, setPackets] = useState<Packet[]>([]);
  const [labelEventIdx, setLabelEventIdx] = useState(0);
  const [labelVisible, setLabelVisible] = useState(false);
  const nextId = useRef(0);

  // Spawn packets on staggered intervals
  useEffect(() => {
    if (reduce) return;
    const spawn = () => {
      const event = liveTelemetry[nextId.current % liveTelemetry.length];
      const newPacket: Packet = {
        id: nextId.current++,
        startTime: performance.now() / 1000,
        event,
      };
      setPackets((prev) => [...prev, newPacket].slice(-4));
    };
    spawn();
    const interval = setInterval(spawn, 2000);
    return () => clearInterval(interval);
  }, [reduce]);

  // Cycle the displayed label as each packet hits the misconception node
  useEffect(() => {
    if (reduce) return;
    if (packets.length === 0) return;
    setLabelEventIdx((nextId.current - 1 + liveTelemetry.length * 100) % liveTelemetry.length);
    const showTimer = setTimeout(() => setLabelVisible(true), 800);
    const hideTimer = setTimeout(() => setLabelVisible(false), 2500);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [packets.length, reduce]);

  // Clean up old packets
  useEffect(() => {
    if (reduce) return;
    const cleanup = setInterval(() => {
      const now = performance.now() / 1000;
      setPackets((prev) => prev.filter((p) => now - p.startTime < PACKET_DURATION + 0.5));
    }, 500);
    return () => clearInterval(cleanup);
  }, [reduce]);

  const currentLabel = liveTelemetry[labelEventIdx];

  return (
    <section className="section-pad bg-charcoal-section" data-section="engine">
      <div className="container-as">
        <FadeUp>
          <Eyebrow num="03">THE ENGINE</Eyebrow>
          <h2 className="h2-as engine-h2">Miss Wena doesn&apos;t improvise.</h2>
        </FadeUp>

        <div className="engine-pipeline-wrap">
          <svg
            viewBox={`0 0 ${PIPELINE_WIDTH} ${PIPELINE_HEIGHT}`}
            className="engine-pipeline"
            role="img"
            aria-label="Live pipeline showing how Question, Misconception, BKT Score, AL Band and Wena are connected"
          >
            <line
              x1={NODES[0].x} y1={PIPELINE_HEIGHT / 2}
              x2={NODES[NODES.length - 1].x} y2={PIPELINE_HEIGHT / 2}
              stroke="rgba(249, 246, 240, 0.20)" strokeWidth="1" strokeDasharray="4 4"
            />

            {NODES.map((n) => (
              <g key={n.id}>
                <circle
                  cx={n.x} cy={PIPELINE_HEIGHT / 2} r="36"
                  fill="rgba(249, 246, 240, 0.04)"
                  stroke="rgba(249, 246, 240, 0.5)" strokeWidth="1.5"
                />
                <text
                  x={n.x} y={PIPELINE_HEIGHT / 2 + 4}
                  textAnchor="middle" fontSize="9" fontWeight="700"
                  letterSpacing="0.1em" fill="var(--cream)"
                  fontFamily="var(--font-body, 'Plus Jakarta Sans')"
                >
                  {n.label}
                </text>
              </g>
            ))}

            <AnimatePresence>
              {packets.map((packet) => (
                <PacketDot key={packet.id} packet={packet} />
              ))}
            </AnimatePresence>
          </svg>

          <AnimatePresence mode="wait">
            {labelVisible && currentLabel && !reduce && (
              <motion.div
                key={labelEventIdx}
                className="engine-live-label"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <span className="engine-label-tag">
                  {currentLabel.subject} · {currentLabel.level} · {currentLabel.topic}
                </span>
                <span className="engine-label-text">
                  Detected: {currentLabel.label}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <FadeUp delay={0.2}>
          <p className="body-lg engine-body">
            Every Wena response is grounded in a curated cell or a Retrieval-Augmented Pedagogy scaffold. BKT scores mastery. The dependency graph traces root cause. The AL band updates after every quiz. This is what &ldquo;AI tutor&rdquo; means at Superholic Lab — not a chatbot, but a bounded, tested, scaffolded coach.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

/** A small dot moving from x1 to x2 on a 6s loop. */
function PacketDot({ packet }: { packet: Packet }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const elapsed = performance.now() / 1000 - packet.startTime;
      const p = Math.min(elapsed / PACKET_DURATION, 1);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [packet.startTime]);

  const startX = NODES[0].x;
  const endX = NODES[NODES.length - 1].x;
  const x = startX + (endX - startX) * progress;
  const y = PIPELINE_HEIGHT / 2;

  const nodeProximities = NODES.map((n) => 1 - Math.min(Math.abs(x - n.x) / 50, 1));
  const maxProximity = Math.max(...nodeProximities);
  const radius = 4 + maxProximity * 4;

  return (
    <motion.circle
      cx={x} cy={y} r={radius}
      fill="var(--brand-rose)"
      style={{ opacity: progress < 1 ? 1 : 0 }}
    />
  );
}
