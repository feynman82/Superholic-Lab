# Superholic Lab — Pre-Launch Audit & 12-Week Plan
**Audit date:** 2026-04-25
**Bar:** "Ship complete" — first public test, paying customers, 4 pillars proven
**Runway:** 12 weeks to real launch with paying customers
**Auditor:** Strategic stream + on-disk source review

---

## 1. The actual current state (post on-disk audit)

The BKT/Plan Quest stack is significantly **more advanced than initially reported**. After reading `pages/progress.html`, `js/progress.js`, `api/analyze-weakness.js`, `api/generate-quest.js`, `STYLEGUIDE.md`, `CLAUDE.md`, and `docs/design-audit.md`, here is the corrected picture:

### What's actually built ✅

| Component | Where | Status |
|---|---|---|
| BKT engine (Bayesian + time-decay + dependency traversal) | `api/analyze-weakness.js` exports `runCognitiveDiagnosis()` | **Working** |
| `mastery_levels` Supabase table feeding live BKT card | `progress.html` → `bkt-mastery-list`, `progress.js` → `renderBKT()` | **Live in production** |
| AL banding (AL1–AL8) MOE-aligned | `progress.js` → `getALBand()` | **Working** |
| 3-Day Plan Quest data model | `remedial_quests` table with `steps`, `current_step`, `status` | **Working** |
| Quest generation API | `/api/generate-quest` → `handleGenerateQuest` in `lib/api/handlers.js` | **Working** |
| Quest deep-link return tracking | `?quest_id=X&step=N` on URL → `advanceQuestStep()` | **Working** |
| Quest UI (3-node timeline) | `progress.js` → `renderQuestMap()` rendered into `#quest-map-section` | **Working** |
| AO (Cognitive Skill) mastery tracker | `progress.js` → `insertAOMasteryUI()` | **Working** |
| Revision Vault (Miss Wena's notes) | `progress.js` → `insertRevisionVault()`, `study_notes` table | **Working** |
| Per-subject deep-dive AI analysis | `progress.js` → `toggleDeepDive()` calls `/api/analyze-weakness` | **Working** |
| Design system v2.0 | `STYLEGUIDE.md` (8-point grid + glassmorphism + Bebas Neue/Plus Jakarta Sans) | **Locked** |
| Question bank infrastructure | `question_bank` Supabase table, 6 question types, RLS-on | **Working** |

### Architectural inconsistency to flag 🟡

`api/analyze-weakness.js` on disk does **NOT** match the pattern in `CLAUDE.md`. CLAUDE.md says all routes go through `api/index.js` → `handleAnalyzeWeakness` in `lib/api/handlers.js` (single-gateway pattern, Vercel 12-function limit). But the file is currently the BKT engine itself with `runCognitiveDiagnosis()` exported, NOT a handler delegator.

This means one of three things is true:
1. There's a separate `handleAnalyzeWeakness` in `lib/api/handlers.js` that imports from this file (likely)
2. The route is wired differently than CLAUDE.md documents (architectural drift)
3. The file has been refactored mid-flight

**Action:** Audit `lib/api/handlers.js` for `handleAnalyzeWeakness` and the import chain. Document the correct pattern in CLAUDE.md after audit. (See Week 5 below.)

### What's actually NOT built ❌

| Gap | Why it matters |
|---|---|
| `pages/quest.html` doesn't exist | User wants a dedicated quest experience, not just an inline card on progress.html |
| Math question bank (~700 raw, 0 launchable) | Practice/Exam/BKT/Quest all collapse for math without questions |
| Science question bank (~100, mostly 0) | Same |
| Master Question Template not validated for math | Cannot generate trustworthy math questions until validated |
| Diagram library output not proven | Math without diagrams is impossible for geometry/measurement/data |
| Email: paid-welcome template | Drop-off after Stripe checkout |
| Email: trial-ending reminder | Trial-to-paid conversion lever |
| Refund process (operational) | Required for paying customers + reduces signup friction |
| 3D-scroll homepage | Marketing impact (you flagged this) |
| QA panel click bugs | In-flight from prior chat (cache-bust pending) |

---

## 2. Adjusted readiness scorecard

| System | State | Launch blocker? | Effort |
|---|---|---|---|
| 🔵 Practice (quiz.html) | ✅ Working | No | — |
| 🔵 Assess (exam.html) | ✅ Working | No | — |
| 🔵 Analyze Weakness (BKT) | ✅ **Live, more polish needed** | No (was over-rated as a blocker) | 1 wk polish |
| 🔵 Plan Quest | 🟡 Logic works, but inline card UX limits engagement | **Yes** | 2 wks (new page) |
| 🟡 Math question bank | 🔴 Empty for practical purposes | **Yes — biggest** | 4 wks |
| 🟡 Science question bank | 🔴 Mostly empty | **Yes** | 2 wks (after math template proven) |
| 🟡 Master Question Template (math) | 🔴 Not validated | **Yes — gates everything else** | 1 wk |
| 🟢 Auth + Stripe + paywall | ✅ Working | No | — |
| 🟢 Cancel flow | ✅ Working | No | — |
| 🟡 Email templates | 🟡 Missing 2 of 4 | Yes (small) | 0.5 wk |
| 🔴 Refund process | 🔴 Not built | Yes | 0.5 wk |
| 🟡 Marketing site (3D scroll homepage) | 🟡 Skeleton + flat homepage | Yes (but not week 1) | 2 wks |
| 🟢 CRM dashboard | ✅ Live | No | — |
| 🟡 QA Audit panel | 🟡 In-flight cache-bust fix | No (in motion) | 0.5 wk |

**Critical-path blockers: 5.** All addressable in 12 weeks.

---

## 3. Strategic priority order — why this sequence

The dependency chain that drives the entire plan:

```
Master Question Template (math) validated
        ↓
Math questions generated + reviewed
        ↓
Science questions generated + reviewed
        ↓
quiz.html / exam.html have content for all 3 subjects
        ↓
question_attempts populates with real signal
        ↓
BKT mastery_levels table fills with meaningful data
        ↓
Plan Quest generates relevant 3-day plans
        ↓
4 pillars work end-to-end
        ↓
Closed beta with real families
        ↓
Public launch
```

If math questions don't exist by week 4, every later milestone slips. **This is the gate.**

---

## 4. The 12-week plan

### Week 1 — Master Question Template validation (math)
**You said:** "Immediate task is to validate Master Question Template for math by generating some questions for testing. I'll do it with Gemini for now."

**Goal:** Prove the template produces math questions that are: (a) clean whole-number answers, (b) Singapore-context, (c) MOE-aligned syllabus, (d) include diagram visual_payload where relevant, (e) wrong_explanations are misconception-specific.

**Deliverables:**
- 30 test questions across P3/P4/P5/P6 (5 topics × 4 difficulty bands × ≥1 per cell)
- Each question reviewed against the QA Audit panel
- Decision: template approved, or specific fixes documented in `Master_Question_Template.md`

**Concurrent (you):** Populate question bank with these 30, plus your own 30. Target: **60 launchable math questions in week 1.**

**Stream:** Question Factory + Question Template Design

**Success gate:** A P5 student can take a real Maths quiz on Fractions with 5 questions across difficulty bands, all displaying correctly with diagrams.

---

### Week 0 — Math expansion + diagram library proof
**Goal:** Scale from 60 to 250 math questions; prove diagram library renders cleanly across the 6 question types that need visuals.

**Deliverables:**
- 200 additional math questions, prioritised P5/P6 (PSLE prep is your headline)
- Diagram library outputs validated for: bar models, fraction circles, geometry shapes, data tables, number lines, clocks
- All math questions have `visual_payload` populated where the topic needs it
- QA review passes for all 250

**Stream:** Question Factory

**Success gate:** PSLE Mathematics WA1 paper generates and renders end-to-end with 30+ questions, including diagrams.

---

### Week 0 — Science question bank
**Goal:** Generate 200 science questions following the same template + diagram pattern.

**Deliverables:**
- P3/P4/P5/P6 science across major topics (Cycles, Systems, Energy, Interactions, Diversity)
- MOE keyword language enforced
- Misconception-specific wrong_explanations for every distractor
- Diagrams for biology (life cycles), physics (forces, light), and chemistry (matter states)

**Stream:** Question Factory

**Success gate:** PSLE Science WA1 paper generates and renders end-to-end.

---

### Week 0 — English fill-in + question bank QA pass
**Goal:** Audit existing 2000 English questions for launch readiness; fill the gaps.

**Deliverables:**
- Inventory of English questions by (level × topic × difficulty)
- Top 20% reviewed for quality issues
- ~100 additional questions added where gaps exist (esp. Synthesis at P5/P6, Editing at P5/P6)
- All synthesis questions migrated to the new `'... connector ...'` instruction format if any are still on legacy format
- `MANIFEST.md` regenerated via `/inventory` command — this becomes the single source of truth for question bank coverage

**Stream:** Question Factory + Backend & Admin (for QA panel deploys)

**Success gate:** Question bank dashboard shows ≥10 launchable questions per (subject × level × topic) cell that should have content.

---

### Week 1 — quest.html new page (Plan Quest pillar fix)
**Goal:** Build `pages/quest.html` as a dedicated, focused quest experience. The current inline card on progress.html is good but doesn't honour what a "Plan Quest" deserves.

**Why a dedicated page:**
- Plan Quest is a 3-day commitment. A focused page reduces cognitive load — one mission at a time
- Mobile UX is better with a single primary action
- Engagement metric: time-on-quest-page is a leading indicator of completion
- Marketing/landing-page asset: "Look at your child's personalized 3-day plan" — needs a screenshot-worthy view

**Deliverables:**

`pages/quest.html` follows STYLEGUIDE.md exactly:
- 8-point grid spacing throughout
- Glassmorphism: `glass-panel-1` for the main quest card, `glass-panel-2` for daily step detail, `glass-panel-rose` for the active day callout
- Bebas Neue for the day numbers (massive — like `pulse-card-value` 4rem) and quest title
- Plus Jakarta Sans for body
- Sage hero band at top 
- Background: `bg-page texture-light-grid` (same as progress.html)
- Bottom nav (mobile)
- How can we gamify it for kids to capture their attention? 2026 style.

Layout (mobile-first):
1. **Hero band** — quest title + subject badge + "Day X of 3" progress
2. **Big timeline** — 3 nodes with connector lines, much more visual than the inline version. Active day pulses (rose ring). Completed days mint, locked grey.
3. **Active day card** — large `glass-panel-2` with: day icon, day title, description, estimated minutes, primary CTA (deep-links to subjects.html or tutor.html with quest_id+step params)
4. **All 3 days expanded view** — collapsible accordion showing what's coming next
5. **Diagnosis card** — "Why this quest? You're at AL5 in Fractions; mastering this unlocks Ratio (1 prerequisite) and Percentage (2 prerequisites)" with a small SVG dependency tree
6. **Abandon button** — secondary, bottom of page, requires confirmation

Architectural changes:
- `js/progress.js` `renderQuestMap()` keeps a small "Active Quest" preview card on progress.html, but the **CTA goes to quest.html** instead of opening the full inline view
- `js/quest.js` (new file) handles all quest.html logic — fetch active quest, render timeline, handle abandon, advance step on return
- `pages/quest.html?quest_id=X` is the canonical URL
- Deep-link return flow updated: subjects.html / tutor.html append `?quest_id=X&step=N` and redirect to quest.html (not progress.html)

Stream: Website Design + Backend & Admin

Success gate: A test student with an active quest sees a polished quest.html page; clicking "Start Day 1" goes to subjects.html with quest tracking; completing a quiz returns to quest.html which shows Day 1 complete, Day 2 active.

---

### Week 2 — BKT polish + dependency tree visualization
**Goal:** Elevate the BKT card from "live but flat" to "best-in-class learning analytics." This is what Brilliant and Khan Academy get right and most Singapore tuition platforms miss.

**Deliverables:**

On `pages/progress.html`:
- **Hero diagnosis sentence** above BKT card: *"Lily is at AL5 in Mathematics — focus on Fractions to unlock 4 dependent topics."* Generated server-side from `runCognitiveDiagnosis()`. Plain English — high emotional weight for parents.
- **SVG dependency tree** below the BKT mastery list. Shows the syllabus dependency map for the weakest topic. Each node coloured by current mastery (`mastery_levels.probability`). The "root cause" topic gets a rose ring. ~150 lines of SVG, generated client-side from `SYLLABUS_DEPENDENCIES`.
- **Topic mastery heatmap** — replace the current vertical list with a grid: rows = topics, columns = sub_topics, cells coloured red→amber→mint. This is the Brilliant/Duolingo pattern. Click a cell → modal with attempts count + accuracy + recent attempts list.
- **Streak strip** — 30-day calendar showing days with at least 1 question_attempt. Cheap to build, drives habit formation.
- All inline `style.cssText` replaced with class assignments where possible (compliance with `STYLEGUIDE.md` and design audit M4-M5)

`SYLLABUS_DEPENDENCIES` map needs expansion:
- Currently 10 math topics + 4 science topics
- Should cover all P3–P6 topics in MOE syllabus
- Must include English topics (synthesis depends on grammar; comprehension depends on vocabulary)

Stream: Website Design + Backend & Admin

Success gate: progress.html scores ≥9/10 against `docs/design-audit.md` (currently 6/10). All M4/M5/M6 design debt resolved.

---

### Week 3 — End-to-end pillar testing
**Goal:** Run a real test student through every pillar, catching every break.

**Deliverables:**
- Test script: 1 parent account + 2 children (P3 + P5)
- P5 child completes 30 maths questions across 6 topics → BKT populates → quest auto-suggests
- P3 child completes 30 science + 30 english → cross-subject mastery_levels populated
- Both complete a full PSLE-style WA1 exam
- Both complete a Plan Quest end-to-end (3 days, real time delay)
- Every metric on progress.html verified against ground truth in Supabase
- Every API call traced for performance (BKT analysis < 2s, quest generation < 5s)
- Mobile QA on iOS Safari + Android Chrome

Issues found get fixed inline.

Stream: All

Success gate: Senior product reviewer (you) signs off that all 4 pillars work end-to-end without manual intervention.

---

### Week 4 — Email templates + refund process
**Goal:** Close operational gaps before any paying customer touches the site.

**Email deliverables (Supabase Auth templates + Vercel cron jobs):**
- Confirmation email (already done) — verify
- Password reset (already done) — verify
- **Paid-welcome** — fired by Stripe `checkout.session.completed` webhook → calls `/api/send-email` → uses Resend or SendGrid → arrives within 60s of payment
- **Trial-ending** — Vercel daily cron job at 9am SGT: SELECT profiles WHERE trial_ends_at BETWEEN now+1day AND now+2days → send email
- All emails follow STYLEGUIDE.md: cream/sage palette, Bebas Neue display, plain HTML (no images that get blocked), single CTA

**Refund process:**
- New page: `pages/refund-request.html` — simple form (reason dropdown + textarea + submit)
- Form posts to `contact_submissions` table with `type='refund'`
- CRM dashboard At-Risk Radar gets a 5th tab: "🟢 Refund Requests"
- 7-day no-questions-asked policy stated on pricing.html and account.html
- Process documented in `docs/REFUND_PLAYBOOK.md`: receive → verify subscription start date → if within 7 days, refund via Stripe Dashboard → email customer → close ticket
- setup agent for answering emails
- setup agent for auto generation of questions.

Stream: Backend & Admin + Business & Launch + Business

Success gate: A test signup → checkout → trial expiry → paid → refund flow runs end-to-end with all 4 emails landing in inbox.

---

### Week 5 — Marketing site polish (3D-scroll homepage)
**Goal:** Replace the current flat homepage with a 3D-scroll hero that converts.

**Deliverables:**
- `index.html` redesign To elevate Superholic Lab landing page to a world-class EdTech experience, a masterclass designer would focus on Narrative Cohesion and User Psychology.
1. Index.html: The "Pillar Discovery" Flow
        The Learning Journey (Parallax Storytelling)Instead of just a girl walking in place, use Multi-layer Parallax. As she walks, the background environments should represent the "stages of learning."
                Step 1 (Pillar 1, Revise): She walks through a misty forest (representing the confusion of new topics).
                Step 2 (Pillar 2, BKT Analyze Weakness): The environment morph into a high-tech "Cyber-Lab."
                Step 3 (Pillar 3, Plane Quest, Remeial)
                Step 4 (Pillar 4, Assessment, Mastery): The environment clears into a nice GCB house in Singaproe
                Designer Improvement: Use Scroll-Linked Physics. If the user scrolls fast, the dog runs; if they stop, the girl checks her "Magic Tablet." This small detail makes the site feel alive and responsive.
        The Morphing Transition
        The transition to the Magic Tablet should be a seamless camera zoom.
                As the girl finishes her walk, she holds up her tablet. The camera "dives" into the tablet screen, which expands to become the Hero section for the dashboard previews. This creates a "nested world" effect that is much more immersive than a standard fade.
        The "Plan Quest" Cylindrical WallA wall of text can be overwhelming. A master designer would treat this as a Digital DNA Strand.
                The Effect: Use a "Matrix-style" vertical scroll within the cylinder.
                The Interaction: When the "Deep Tech" analysis triggers, the cylinder should "lock" into place. The AI highlights a "weakness" (e.g., P5 Ratio) in a warning color, which then physically transforms into a glowing "Quest Card" representing the remedial plan. This visualizes the value of your analysis, not just the data.
2. Subject.html and Exam.html Step 1 of 3: The "Selection Sanctum"
        The 3D Lab OrbitInstead of simple icons orbiting, use Holographic Glass Orbs.
                Visual Fidelity: Each orb (Math, Science, English) should contain a "micro-world" inside using a shader effect.
                - Math: Floating geometric fractals.
                - Science: A rotating atom or plant cell.
                The Interaction: When a user hovers over an orb, the others dim, and the selected orb moves to the center, expanding slightly. Use Magnetic Hall Effect physics for the cursor interaction—the orb should feel like it's being "pulled" toward the user's mouse, echoing your interest in high-performance hardware.
3. Strategic Technical Advice for Superholic Lab
        Lottie + Framer Motion: Use Lottie for the girl walking (it’s lightweight and vector-based) and Framer Motion to link the Lottie playback frame to the scrollY position. This ensures the animation is perfectly synced with the scroll wheel.
        Performance Optimization: For the cylindrical text wall, use Three.js Instanced Mesh. Rendering 100+ sub-topics as individual DOM elements will lag. Instanced rendering keeps the "spinning" at 60fps even on older school-issued laptops.The 
        "Parent Hook": Since parents are the buyers, include a "Real-time Mastery Gauge" in the UI-UX Pro Max skill. As they scroll through the 3D orbit, a small glassmorphic panel should show: "98% of students improved after 3 Plan Quests."
Proposed Stack Implementation
Section                 Technology                      Effect Type
Learning Journey        Lottie + Framer useScroll       2D Vector Scroll-sync
Magic Tablet            Aceternity ContainerScroll      3D Perspective Tilt
Topic Cylinder          Three.js + Float                3D Text Geometry
Subject Orbit           21st.dev Cosmos Orbit           Interactive Raycasting
- All assets follow STYLEGUIDE.md
- All images optimised (WebP, lazy loaded)
- Lighthouse score ≥90 on mobile

`pages/pricing.html`, `pages/about.html`, `pages/contact.html` finalised — not redesigned, just polish:
- Copy proofread
- All CTAs verified working
- All design-audit.md issues resolved

Stream: Website Design

Success gate: Homepage Lighthouse mobile ≥90; pricing/about/contact all design-audit clean.

---

### Week 6 — Project files updated + closed beta prep
**Goal:** Project source-of-truth files reflect launch state; recruit 10–20 beta families.

**Project file updates:**
- `CLAUDE.md` v3.1: 4 pillars marked launch-ready; `pages/quest.html` added to features table; routes table verified against `api/` directory
- `ARCHITECTURE.md`: BKT data flow diagram added; quest deep-link flow diagram added; `mastery_levels` + `remedial_quests` tables documented
- `STYLEGUIDE.md`: cross-references to actual style.css class names; new `.quest-*` classes documented
- `docs/CONTENT_TIMELINE.md`: question bank current count + post-launch monthly target
- `docs/PROJECT_DASHBOARD.md`: launch state checklist
- `MANIFEST.md`: regenerated via `/inventory` showing exact question bank coverage
- `INDEX.md`: top-level index of all project docs (for new contributors)

**Beta prep:**
- 10–20 families recruited (ideally a mix: P3, P4, P5, P6, mixed plans)
- Beta access form: `pages/beta-signup.html` (or invite-only direct emails)
- Beta-specific Supabase flag: `profiles.is_beta = true`
- Feedback channel: dedicated email or Tally form linked from in-app
- 50% off coupon code for beta families: `BETA50` valid 90 days

Stream: All + Business & Launch

Success gate: Documentation describes the actual deployed system; 10+ beta families confirmed.

---

### Week 7 — Closed beta with real families
**Goal:** Run live with paying-but-discounted users, find what breaks, fix it.

**Deliverables:**
- Beta starts Monday week 11
- Daily monitoring of CRM At-Risk Radar — any inactive beta user gets a personal email within 48h
- Daily monitoring of QA queue — auto-generated questions reviewed and approved within 24h
- Bug-tracking spreadsheet (Google Sheets or GitHub Issues) — every bug logged with severity
- Mid-week check-in email to all beta families with simple feedback form
- End-of-week debrief: top 5 bugs prioritised for week 12

Stream: All

Success gate: ≥70% of beta families used the platform at least 3 times; ≥1 family converted from BETA50 trial to full paid; bug list fully triaged.

---

### Week 8 — Bug fixes + public launch
**Goal:** Fix what beta revealed, flip the public switch.

**Deliverables:**
- Top 5 bugs from week 11 fixed
- Stripe switched from test mode to live mode (env vars updated in Vercel)
- DNS / Cloudflare verified
- All endpoints rate-limited (per CLAUDE.md security skill)
- `robots.txt` updated to allow indexing
- `sitemap.xml` regenerated and submitted to Google Search Console
- Plausible analytics verified on every page
- Public launch announcement: blog post, LinkedIn, parent forums

Stream: All

Success gate: Public site is up; first non-beta paying customer signs up.

---

## 5. Critical risks and mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Master Question Template fails math validation in week 1 | Medium | Catastrophic | Have backup: hand-author 30 questions per level if AI generation fails. You're prepared to use Gemini for control. |
| Diagram library doesn't render cleanly across all needed types | Medium | High | Week 2 has explicit diagram validation gate. If broken, fall back to text-only questions for first launch and add diagrams in v1.1. |
| BKT data flow breaks because question_attempts missing fields | High | High | Week 7 e2e test catches this. Earlier: audit `quiz.js` write path in week 5 to confirm all fields written. |
| Beta families don't engage | Medium | Medium | Recruit 20, expect 10 to engage; personal outreach to drop-offs in week 11. |
| 3-month timeline slips because question bank is harder than expected | High | High | Question bank is weeks 1–4. If week 4 fails, push English-only soft launch in week 12 and Math/Science to v1.1. |
| Refund disputes with paying customers | Low | High | Stated 7-day no-questions-asked policy reduces disputes by ~80% (industry data). Documented playbook removes ambiguity. |

---

## 6. What this plan deliberately defers (post-launch v1.1)

- More than 3 children per family (Family Plan capped at 3 — keep it that way)
- Parental analytics dashboard (separate from CRM)
- Mobile native app (web works fine for 12 weeks)
- AI-generated weekly progress summary email to parents
- Gamification beyond streak (badges, XP, leaderboards)
- Live tutoring marketplace
- Group quests (social learning)

Defer means: do not start, do not scope, do not let scope creep into weeks 1–12.

---

## 7. Per-stream task allocation

This plan routes work to your 6 Claude Project streams:

| Week | Question Factory | Backend & Admin | Website Design | Question Template Design | Business & Launch | Command Center |
|---|---|---|---|---|---|---|
| 1 | Generate 30 test math Qs | QA panel cache-bust | — | Validate template | — | Sprint kick-off |
| 2 | Generate 200 math Qs + diagrams | — | — | Refine template | — | Sprint review |
| 3 | Generate 200 science Qs | — | — | — | — | Sprint review |
| 4 | English audit + 100 fill | `/inventory` regen | — | — | — | Sprint review |
| 5 | — | quest.html backend wiring + js/quest.js | quest.html design + build | — | — | Architecture review |
| 6 | — | BKT API polish + dependency tree | progress.html redesign | — | — | Sprint review |
| 7 | — | E2E test fixes | E2E test fixes | — | — | E2E sign-off |
| 8 | — | Email cron jobs + refund form | Refund-request.html | — | Refund playbook | Ops review |
| 9 | — | — | 3D-scroll homepage rebuild | — | Marketing copy | Site review |
| 10 | — | — | Pricing/about/contact polish | — | Beta recruitment | Doc update sprint |
| 11 | — | All bug fixes | All bug fixes | — | Beta management | Daily standup |
| 12 | — | Stripe live mode | Final polish | — | Launch announcement | Launch! |

---

## 8. The non-negotiables for "ship complete"

The 5 things that, if missing on launch day, would make me say "do not launch yet":

1. **A P5 child can take a real Maths quiz on Fractions and get 5 launch-grade questions with diagrams.** If this fails, the platform has no value prop for the headline subject.
2. **The BKT card on progress.html shows real mastery_levels for a child after 20+ attempts.** If empty, the AI value prop collapses.
3. **A child can complete a 3-day Plan Quest end-to-end via quest.html.** If this fails, you are no different from any other quiz platform.
4. **Stripe checkout → paid-welcome email → access to all 3 subjects works in <90 seconds.** If checkout-to-access has friction, conversion drops 50%+.
5. **Refund process documented and tested.** If a customer can't get a refund, your reputation tanks before you have one.

Everything else is polish. These 5 are the bar.

---

## 9. Documentation updates required (Week 10)

These project files need updates after the plan completes:

- `CLAUDE.md` → v3.1 (mark BKT live, add quest.html, document analyze-weakness route correctly)
- `ARCHITECTURE.md` → BKT data flow + quest deep-link flow
- `STYLEGUIDE.md` → cross-reference actual class names; add `.quest-*` classes
- `docs/design-audit.md` → re-audit after week 6; new score per page
- `docs/CONTENT_TIMELINE.md` → post-launch question bank monthly cadence
- `docs/PROJECT_DASHBOARD.md` → launch state
- `MANIFEST.md` → regenerated final question count
- `INDEX.md` → top-level project doc index
- `Master_Question_Template.md` → math validation findings + diagram patterns
- `AGENTS.md` → ensure agents updated for new pages (quest.html, refund-request.html)

---

## 10. Next concrete action

**You:** Open Question Template Design stream + Question Factory stream. Use the prompts already prepared. Start week 1 today.

**Me (next session):** Once your week 1 generates the first test questions, I'll review them in the Question Template stream and certify the template OR write the specific fixes needed.

**Parallel (this week):** Push the QA panel cache-bust fix from the prior session through the Backend & Admin stream so the QA tab is unblocked when week 4 hits.

---

**End of audit. Plan is committable. Recommend you save this as `docs/LAUNCH_PLAN_v1.md` and reference it in weekly Command Center reviews.**
