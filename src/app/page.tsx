/**
 * Superholic Lab — Next.js Landing Page
 *
 * Assembly order:
 *   Hero → Credibility Bar → ScrollStory → DashboardShowcase →
 *   SyllabusCylinder → PlanQuestSection → (existing feature sections) →
 *   Pricing → Final CTA
 *
 * All four animated components use browser APIs (R3F, Lottie, framer-motion)
 * and are loaded with dynamic import + ssr:false to prevent SSR errors.
 */

import dynamic from "next/dynamic"
import Link from "next/link"

/* ─── Dynamic imports — no SSR ──────────────────────────────────── */
const ScrollStory = dynamic(() => import("../components/ScrollStory").then(m => ({ default: m.ScrollStory })), { ssr: false, loading: () => <ScrollStoryFallback /> })
const DashboardShowcase = dynamic(() => import("../components/DashboardShowcase").then(m => ({ default: m.DashboardShowcase })), { ssr: false, loading: () => <div style={{ height: "260vh", background: "#1A2E2A" }} /> })
const SyllabusCylinder = dynamic(() => import("../components/SyllabusCylinder").then(m => ({ default: m.SyllabusCylinder })), { ssr: false, loading: () => <div style={{ height: "100vh", background: "#0B1816" }} /> })
const PlanQuestSection = dynamic(() => import("../components/PlanQuestSection").then(m => ({ default: m.PlanQuestSection })), { ssr: false })

/* ─── Fallback while ScrollStory hydrates ───────────────────────── */
function ScrollStoryFallback() {
  return (
    <div style={{ height: "500vh", background: "#3A4E4A", position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem,4vw,3rem)", letterSpacing: "0.04em", color: "#e3d9ca", margin: "0 0 8px" }}>
            From First Try to Full Marks
          </h2>
          <p style={{ color: "rgba(227,217,202,0.45)", fontSize: "0.9rem" }}>↓ Scroll to walk the journey</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Pricing data ───────────────────────────────────────────────── */
const FEATURES = [
  "All 3 subjects — Maths, Science, English",
  "Unlimited MOE-aligned questions",
  "Wrong-answer explanations, every option",
  "WA · EOY Exam · PSLE practice papers",
  "AL1–AL8 live progress tracking",
  "Plan Quest — AI-generated action plan",
  "Miss Wena AI Tutor — 3 subjects, 24/7",
  "Study Notes Backpack",
]

/* ═══════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <>
      {/* ── Global nav (Web Component — registered by header.js) ── */}
      {/* @ts-ignore — custom element */}
      <global-header />

      {/* ══════════════════════════════════════════════════════════
          S1 · HERO
          ══════════════════════════════════════════════════════════ */}
      <section
        className="bg-sage texture-dots"
        style={{ paddingTop: "calc(64px + var(--space-8))", position: "relative" }}
      >
        <div className="container hero-inner">
          <div className="hero-left">
            <h1 className="font-display text-4xl" style={{ textAlign: "center" }}>
              Your Child&apos;s Path<br />
              <span className="text-rose" style={{ textAlign: "center" }}>to AL1 Starts Here.</span>
            </h1>
            <p className="text-muted text-lg" style={{ maxWidth: 460 }}>
              Superholic Lab diagnoses your child&apos;s weaknesses, builds a personalised Plan Quest,
              and puts Miss Wena — an AI tutor — on call 24/7. For less than the price of a tuition
              session a month.
            </p>
            <div className="hero-cta-row">
              <Link href="/pages/signup.html?mode=trial" className="btn btn-primary">Start 7-Day Free Trial →</Link>
              <Link href="/pages/signup.html?mode=subscribe" className="btn btn-glass">Subscribe — fr S$12.99</Link>
            </div>
            <p className="hero-cta-note" style={{ textAlign: "center" }}>7 days free · No credit card required · Cancel anytime</p>
            <div className="hero-stat-row" style={{ display: "flex", justifyContent: "center", gap: 40, textAlign: "center" }}>
              <div><div className="font-display text-2xl">3 Subjects</div><div className="stat-label">All P1–P6 Topics</div></div>
              <div><div className="font-display text-2xl">AL1–AL8</div><div className="stat-label">Live Grade Tracking</div></div>
            </div>
          </div>
          <div className="hero-right">
            <img src="/assets/images/student_with_glowing_apple.png" alt="Singapore student using Superholic Lab on tablet" className="hero-photo" />
          </div>
        </div>
        <div className="hero-pet-track"><div className="walking-dog">🐕</div></div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          S2 · CREDIBILITY BAR
          ══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-6">
        <div className="container">
          <div className="card">
            <div className="cred-inner">
              {[
                { icon: "book", label: "10,000+ Questions", sub: "MOE-aligned bank" },
                { icon: "file", label: "WA · EOY · PSLE", sub: "3 exam formats" },
                { icon: "star", label: "Miss Wena AI Tutor", sub: "Available 24/7" },
                { icon: "bar", label: "AL1–AL8 Live Tracking", sub: "Real grade calculation" },
              ].map((item, i) => (
                <div key={i} className="cred-item">
                  <div><div className="font-bold text-sm text-main">{item.label}</div><div className="text-xs text-muted">{item.sub}</div></div>
                  {i < 3 && <div className="cred-sep" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          S2.5 · SCROLL STORY
          ══════════════════════════════════════════════════════════ */}
      <ScrollStory />

      {/* ══════════════════════════════════════════════════════════
          S2.6 · DASHBOARD SHOWCASE
          ══════════════════════════════════════════════════════════ */}
      <DashboardShowcase />

      {/* ══════════════════════════════════════════════════════════
          S2.7 · SYLLABUS CYLINDER
          ══════════════════════════════════════════════════════════ */}
      <SyllabusCylinder />

      {/* ══════════════════════════════════════════════════════════
          S2.8 · PLAN QUEST SECTION
          ══════════════════════════════════════════════════════════ */}
      <PlanQuestSection />

      {/* ══════════════════════════════════════════════════════════
          S3–S9 · FEATURE + SOCIAL PROOF SECTIONS
          Port from index.html incrementally. Each block is
          a straightforward JSX translation of the static HTML.
          ══════════════════════════════════════════════════════════ */}
      {/* TODO: port S3 Pain Points, S3.5 Subjects, S4 Quiz Bank,
                 S5 Practice Papers, S6 Progress, S7 Study Notes,
                 S8 Miss Wena, S9 Testimonials from index.html     */}

      {/* ══════════════════════════════════════════════════════════
          S10 · EXECUTIVE PRICING
          ══════════════════════════════════════════════════════════ */}
      <PricingSection />

      {/* ══════════════════════════════════════════════════════════
          S11 · FINAL CTA
          ══════════════════════════════════════════════════════════ */}
      <FinalCTA />

      {/* @ts-ignore — custom element */}
      <global-footer />
    </>
  )
}

/* ─── Pricing Section ────────────────────────────────────────────── */
function PricingSection() {
  return (
    <section
      id="pricing"
      style={{
        position: "relative",
        background: "linear-gradient(180deg,#1E3430 0%,#152820 50%,#0E1F1C 100%)",
        padding: "clamp(64px,10vw,120px) 0",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px,5vw,48px)" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{ display: "inline-block", background: "rgba(57,255,179,0.1)", color: "#39FFB3", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", border: "1px solid rgba(57,255,179,0.2)", borderRadius: 9999, padding: "0.3rem 1rem", marginBottom: 14 }}>
            Simple Pricing
          </span>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2rem,5vw,3.25rem)", letterSpacing: "0.04em", color: "#e3d9ca", margin: "0 0 14px", lineHeight: 1.05 }}>
            Less Than One Hour of<br />
            <span style={{ background: "linear-gradient(90deg,#B76E79,#39FFB3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Private Tuition a Month.
            </span>
          </h2>
          <p style={{ color: "rgba(227,217,202,0.55)", fontSize: "1rem", lineHeight: 1.6, maxWidth: 520, margin: "0 auto 28px" }}>
            Both plans include every feature. The difference is the number of child profiles.
          </p>

          {/* Value badges */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginBottom: 28 }}>
            {["MOE-Aligned Curriculum", "Unlimited AI Tutoring", "AI Weakness Analysis", "Personalised Plan Quest"].map(b => (
              <span key={b} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(57,255,179,0.07)", color: "#39FFB3", border: "1px solid rgba(57,255,179,0.18)", borderRadius: 9999, padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600 }}>
                ✓ {b}
              </span>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", justifyContent: "center" }}>

          {/* All Subjects */}
          <div style={{ position: "relative", minWidth: 300, maxWidth: 420, flex: 1, background: "rgba(227,217,202,0.04)", border: "2px solid rgba(183,110,121,0.6)", borderRadius: 20, backdropFilter: "blur(16px)", padding: "32px 28px", display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 0 48px rgba(183,110,121,0.1),4px 4px 0 rgba(42,42,42,0.25)" }}>
            <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg,#B76E79,#B88078)", color: "white", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: 9999, padding: "4px 16px", whiteSpace: "nowrap" }}>
              ★ Most Popular
            </div>
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.75rem", letterSpacing: "0.04em", color: "#e3d9ca", margin: "0 0 8px" }}>All Subjects</h3>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "3rem", letterSpacing: "0.02em", color: "#B76E79", lineHeight: 1 }}>
                S$12.99<span style={{ fontSize: "1.1rem", color: "rgba(227,217,202,0.45)", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 400 }}>/mo</span>
              </div>
              <p style={{ fontSize: "0.875rem", color: "rgba(227,217,202,0.55)", margin: "12px 0 0" }}>The complete P1–P6 toolkit — 1 child profile.</p>
            </div>
            <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
              {[...FEATURES, "1 child profile"].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.875rem", color: "rgba(227,217,202,0.8)" }}>
                  <span style={{ color: "#39FFB3", fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <Link href="/pages/signup.html?plan=all_subjects&mode=trial" style={{ display: "block", textAlign: "center", padding: "0.9375rem 1.5rem", borderRadius: 9999, background: "linear-gradient(90deg,#B76E79,#B88078,#39FFB3,#B88078,#B76E79)", backgroundSize: "300% 300%", color: "#1A2E2A", fontSize: "1rem", fontWeight: 700, textDecoration: "none" }}>
              Start 7-Day Free Trial
            </Link>
            <div style={{ textAlign: "center", fontSize: "0.78rem", color: "rgba(227,217,202,0.38)", fontFamily: "'JetBrains Mono',monospace" }}>7 days free · No credit card</div>
          </div>

          {/* Family */}
          <div style={{ minWidth: 300, maxWidth: 420, flex: 1, background: "rgba(227,217,202,0.04)", border: "1.5px solid rgba(227,217,202,0.12)", borderRadius: 20, backdropFilter: "blur(16px)", padding: "32px 28px", display: "flex", flexDirection: "column", gap: 20, boxShadow: "4px 4px 0 rgba(42,42,42,0.2)", marginTop: 16 }}>
            <div style={{ textAlign: "center" }}>
              <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.75rem", letterSpacing: "0.04em", color: "#e3d9ca", margin: "0 0 8px" }}>Family Plan</h3>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "3rem", letterSpacing: "0.02em", color: "#e3d9ca", lineHeight: 1 }}>
                S$19.99<span style={{ fontSize: "1.1rem", color: "rgba(227,217,202,0.45)", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 400 }}>/mo</span>
              </div>
              <p style={{ fontSize: "0.875rem", color: "rgba(227,217,202,0.55)", margin: "12px 0 0" }}>Everything in All Subjects — for up to 3 children.</p>
            </div>
            <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
              {[...FEATURES, "3 child profiles + parent dashboard"].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.875rem", color: "rgba(227,217,202,0.8)" }}>
                  <span style={{ color: "#39FFB3", fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <Link href="/pages/signup.html?plan=family&mode=trial" style={{ display: "block", textAlign: "center", padding: "0.9375rem 1.5rem", borderRadius: 9999, background: "rgba(227,217,202,0.07)", border: "1.5px solid rgba(227,217,202,0.22)", color: "#e3d9ca", fontSize: "1rem", fontWeight: 700, textDecoration: "none" }}>
              Start 7-Day Free Trial
            </Link>
            <div style={{ textAlign: "center", fontSize: "0.78rem", color: "rgba(227,217,202,0.38)", fontFamily: "'JetBrains Mono',monospace" }}>7 days free · No credit card</div>
          </div>

        </div>

        {/* Trust row */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 20, marginTop: 40, color: "rgba(227,217,202,0.45)", fontSize: "0.85rem" }}>
          <span>✓ Cancel anytime</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>✓ PDPA compliant</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>✓ Secure payment via Stripe</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <Link href="/pages/pricing.html" style={{ color: "#B76E79", fontWeight: 700, textDecoration: "none" }}>Full pricing &amp; FAQ →</Link>
        </div>

      </div>
    </section>
  )
}

/* ─── Final CTA ──────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section style={{ position: "relative", minHeight: "100vh", background: "radial-gradient(ellipse 120% 80% at 50% 0%,#2D4A44 0%,#152820 40%,#080F0E 100%)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "clamp(64px,10vh,100px) 16px" }}>

      {/* Grid texture */}
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(57,255,179,0.028) 1px,transparent 1px),linear-gradient(90deg,rgba(57,255,179,0.028) 1px,transparent 1px)", backgroundSize: "64px 64px", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 700, width: "100%" }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ display: "inline-block", background: "rgba(57,255,179,0.1)", color: "#39FFB3", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", border: "1px solid rgba(57,255,179,0.2)", borderRadius: 9999, padding: "0.3rem 1rem" }}>
            The Quest Begins Here
          </span>
        </div>

        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.5rem,7vw,5rem)", letterSpacing: "0.04em", color: "#e3d9ca", lineHeight: 1.0, margin: "0 0 20px" }}>
          The Quest is Set.<br />
          <span style={{ background: "linear-gradient(90deg,#B76E79 0%,#FFB830 45%,#39FFB3 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Start Your Child&apos;s Path
          </span><br />
          to PSLE Mastery Today.
        </h2>

        <p style={{ color: "rgba(227,217,202,0.6)", fontSize: "clamp(0.95rem,2vw,1.1rem)", lineHeight: 1.65, margin: "0 auto 40px", maxWidth: 520 }}>
          Join Singapore families who have a complete AI study system — not just another quiz app.
          Unlimited practice, Miss Wena on call, and a personalised Plan Quest. First 7 days, completely free.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", alignItems: "center", marginBottom: 28 }}>
          <Link
            href="/pages/signup.html?mode=trial"
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "1rem 2.25rem", borderRadius: 9999, background: "linear-gradient(90deg,#B76E79,#B88078,#39FFB3,#B88078,#B76E79)", backgroundSize: "300% 300%", color: "#0E1F1C", fontSize: "1.05rem", fontWeight: 700, textDecoration: "none", boxShadow: "0 6px 32px rgba(57,255,179,0.28),4px 4px 0 rgba(42,42,42,0.2)", minHeight: 54 }}
          >
            ⚡ Start 7-Day Free Trial →
          </Link>
          <Link
            href="/pages/signup.html?mode=subscribe"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "1rem 2.25rem", borderRadius: 9999, background: "rgba(227,217,202,0.06)", border: "1.5px solid rgba(227,217,202,0.22)", color: "#e3d9ca", fontSize: "1.05rem", fontWeight: 600, textDecoration: "none", minHeight: 54, backdropFilter: "blur(8px)" }}
          >
            Subscribe — from S$12.99
          </Link>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 16, color: "rgba(227,217,202,0.35)", fontSize: "0.8rem", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.05em" }}>
          <span>✓ No credit card</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>✓ Cancel anytime</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>✓ PDPA compliant</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>✓ Singapore servers</span>
        </div>
      </div>

    </section>
  )
}
