# PARENT FAQ — Superholic Lab
> Source of truth for FAQ content. Update this file first; then sync to `public/pages/faq.html`.
> Last updated: 2026-04-27

---

## §1 The Four Pillars

**What is Superholic Lab?**
Superholic Lab is Singapore's AI-powered learning platform for P1–P6 students. It's built around a four-pillar closed learning loop: **Practise → Analyse Weakness → Plan Quest → Assess**. Each pillar feeds the next — practice reveals weakness, weakness analysis diagnoses the root cause, Plan Quest fixes it, and the Assess exam proves the fix held.

The platform covers Mathematics, Science, and English with MOE-aligned questions, an AI tutor (Miss Wena), personalised 3-day learning interventions, and SEAB-calibrated exam papers.

---

**What is the "Practise" pillar?**
Practise gives your child thousands of MOE-aligned questions across Mathematics, Science, and English for P1–P6. Six question formats mirror actual SEAB exam formats: MCQ, Short Answer, Word Problem, Open-Ended (Science CER), Cloze Passage, and Editing.

Every wrong answer includes a specific explanation of the exact misconception — not just "this is wrong," but "this is the reasoning error that caused this mistake." This is where the platform starts building diagnostic data.

---

**What is the "Analyse Weakness" pillar?**
After your child completes quizzes, the platform's BKT (Bayesian Knowledge Tracing) algorithm weighs every attempt and identifies the root-cause topic — the foundational gap driving the most errors.

Critically, AO3 (higher-order thinking) questions count **1.5× more** than routine questions in the mastery calculation. This means the diagnosis reflects your child's PSLE-readiness, not just raw percentage. A child who aces easy questions but stumbles on reasoning tasks will be correctly flagged as weak — not hidden by a flattering average.

---

**What are the "Plan Quest" and "Assess" pillars?**
**Plan Quest** is a personalised 3-day learning intervention built from the Analyse Weakness diagnosis. Day 1 is targeted practice, Day 2 is a Socratic dialogue with Miss Wena anchored to your child's specific errors, and Day 3 is a mastery trial. See §5 below for full details.

**Assess** generates full AI-powered practice papers calibrated to SEAB 2026 formats: WA1, WA2, EOY, and Prelims. The correct mark allocations, section structures, and question types are used for each exam format. This is the summative check that closes the loop and proves mastery holds under exam conditions.

---

## §2 MOE Syllabus & Assessment

**Is Superholic Lab aligned with the MOE syllabus?**
Yes. Every question in our bank is tagged to the latest MOE syllabus for Mathematics, Science, and English (Primary 1 to Primary 6). Our exam templates are calibrated to SEAB 2026 syllabus codes (0001 Maths, 0008 Science, 0009 English) and follow the actual SEAB paper structure for WA1, WA2, EOY, and PSLE.

---

**How does MOE assess students at PSLE?**
MOE uses three Assessment Objectives (AOs) to measure learning depth:

- **AO1 — Knowledge & Understanding:** Can the student recall facts and recognise concepts? Easier questions test this.
- **AO2 — Application:** Can the student apply known methods to routine problems? Most quiz questions test this.
- **AO3 — Synthesis, Reasoning & Evaluation:** Can the student combine ideas, reason through unfamiliar problems, and justify their answers? HOTS questions test this. PSLE rewards AO3 heavily.

A child who only practises AO1/AO2 will struggle on the harder PSLE questions. AO3 is where most students leave marks on the table.

---

**How does Superholic Lab's Analyse Weakness model AO1/AO2/AO3?**
Every question in our bank is tagged with a specific cognitive skill. We map those skills directly onto MOE's AOs:

| MOE AO | Superholic Lab cognitive skills | Weight in analysis |
|---|---|---|
| AO1 | Factual Recall, Conceptual Understanding | 1.0× |
| AO2 | Routine Application | 1.0× |
| AO3 (HOTS) | Non-Routine / Heuristics, Inferential Reasoning, Synthesis & Evaluation | **1.5×** |

When we calculate your child's mastery score on a topic, AO3 questions count 1.5× more than AO1/AO2. So if your child gets all the easy questions right but stumbles on heuristics or inference, our system will correctly flag the topic as weak — even though the raw percentage looks fine. Most other platforms just show a flat percentage and miss this.

---

**Why does this matter for PSLE preparation?**
Because PSLE doesn't reward only knowing the syllabus — it rewards being able to apply, reason, and synthesise. By weighting AO3 questions higher in our analysis, we give parents an honest picture of where their child stands against the actual PSLE bar.

This honest signal is what makes Plan Quest interventions effective: we target the right weakness, not just the loudest symptom.

---

## §3 Practise (Quizzes)

**Which subjects and levels are covered?**
Mathematics, Science, and English for Primary 1 to Primary 6 (P1–P6). Each subject covers all major MOE syllabus topics for the target level — for example, P5 Maths includes Fractions, Decimals, Percentage, Ratio, Rate, Area of Triangle, Volume, and more.

---

**What question types are included?**
Six types mirror actual SEAB exam formats:
- **MCQ** — 4-option multiple choice, letter answer
- **Short Answer** — numerical or brief text answer
- **Word Problem** — multi-part, model-answer comparison
- **Open-Ended** (Science) — CER framework answers, keyword-based marking
- **Cloze Passage** (English) — MCQ blanks in a passage
- **Editing** (English) — spot and correct the grammar error

---

**What is a "wrong-answer explanation"?**
For every MCQ option that isn't the correct answer, we write a specific explanation of why a student might choose it and exactly what misconception it reveals. Instead of "B is wrong," your child reads the specific reasoning error behind that choice and understands why it's incorrect.

This is the core of the Practise pillar — your child doesn't just see a red cross, they understand the exact gap in their thinking.

---

**Are there daily question limits?**
Trial users can attempt up to **5 questions per day** to explore the platform before subscribing. Subscribed users (All Subjects or Family plan) have **no daily limits**.

---

## §4 Analyse Weakness

**How does the Weakness Analysis work?**
After each quiz session, BKT (Bayesian Knowledge Tracing) calculates a mastery probability for every topic your child has attempted. It tracks all attempts over time — not just recent ones — and weights AO3 (higher-order) questions 1.5× more than routine questions.

The topic with the lowest weighted mastery score is flagged as the root-cause weakness, accounting for prerequisite dependencies. For example, if Algebra is weak because Fractions are shaky, Fractions gets flagged first.

---

**What is the AL1–AL8 progress tracking?**
AL1–AL8 mirrors Singapore's Achievement Level scale used in PSLE. On Superholic Lab, AL bands are derived from mastery probability:
- AL1: ≥90% mastery — near-perfect
- AL4: 60–69% — approaching standard
- AL8: below 25% — needs significant support

Your child's live AL band for each topic gives you a direct read on their PSLE-readiness for that topic — not just how many questions they got right last week.

---

**When should my child use the Analyse Weakness feature?**
After any quiz session where they scored below 70%, or whenever you want a summary of where they stand across topics. The weakness analysis identifies the root-cause gap, not just the symptom — so it's most valuable when you want to decide what to focus on next, rather than just drilling the same topic again.

---

## §5 Plan Quest

**What is a Plan Quest?**
A Plan Quest is a personalised 3-day learning intervention. When your child gets a low score on a topic, our AI builds a custom 3-day plan to help them master it: Day 1 is targeted practice with progressively harder questions; Day 2 is a guided conversation with Miss Wena (our AI tutor) where she helps them understand why they struggled; Day 3 is a mastery test that tells you honestly whether they've improved.

---

**How does it work — what happens on each day?**
**Day 1 — Foundation Climb (15–20 min):** 12 questions on the target topic, starting easy and getting harder. The point isn't to "pass" — it's to rebuild confidence and capture exactly which concepts your child finds tricky. Questions they get wrong feed Day 2.

**Day 2 — Socratic Dialogue (15 min):** Your child has a conversation with Miss Wena, who specifically references the questions they got wrong on Day 1. Instead of just explaining the answer, she asks leading questions that guide your child to discover the answer themselves. At the end, the conversation auto-saves as a study note in their Backpack for future revision.

**Day 3 — Mastery Trial (15–20 min):** 8 carefully chosen questions, mostly hard, with 2 "transfer" questions from a related topic to test depth of understanding. The score determines what happens next:
- **85% or above:** Mastered. We close the quest and celebrate. Big XP bonus.
- **70–84%:** Slight improvement. We close the quest and recommend revisiting the Day 2 study note.
- **Below 70%:** We give your child the choice — try the quest again with new questions, accept slight improvement, or honestly mark themselves as still struggling.

---

**Why are the days separated by a day?**
Spaced repetition. Research consistently shows that learning sticks better when concepts are revisited after a sleep cycle, not crammed in one sitting. Day 2 unlocks at midnight (Singapore time) after Day 1 is completed, and similarly for Day 3. We don't allow skipping the wait — the spacing is the medicine.

---

**Can my child have multiple quests at the same time?**
Yes — up to 3 quests, one per subject (Maths, Science, English). This reflects the reality of PSLE preparation. If your child needs work on Fractions in Maths, Cells in Science, and Synthesis in English, they can run all three simultaneously without forcing a sequence.

---

**What if my child wants to abandon a quest?**
They can. There's an "Abandon Quest" button (subtle, requires confirmation). They lose any unawarded XP for that quest, and the slot frees up so they can start a different quest in the same subject. We don't penalise abandonment — life happens.

---

**How is this different from just doing more practice questions?**
Three ways:
1. **It's diagnostic, not just remedial.** Day 1 wrong answers feed Day 2's tutor session, which means Miss Wena addresses the specific misunderstanding your child has, not generic explanations.
2. **It teaches, not just tests.** Day 2 is a conversation, not a lecture. Active recall and explanation generation outperform passive review by 2–3× retention.
3. **It produces honest signal.** The 3-way exit on Day 3 means we tell you the truth. A platform that always says "Great job!" is a platform that produces no learning data.

---

**What happens if my child fails Day 3 repeatedly?**
If they choose "Try this quest again" multiple times, we track the lineage. After two consecutive *no_improvement* outcomes on the same topic, the parent dashboard surfaces a recommendation: "Lily has marked herself as still struggling on Fractions twice. Consider scheduling a tutor session or speaking with her teacher." This is the platform telling you what other platforms hide.

---

**Does my child earn rewards for doing quests?**
Yes, but only for *real learning actions*. They earn XP for completing quiz questions, tutor sessions, and quest steps. Bigger XP rewards for mastery (Day 3 ≥ 85%) and for redoing a failed quest (we reward growth mindset). XP feeds into a level/rank progression (Cadet → Operator → Specialist → …).

They can earn badges for milestones — including a special **Honest Compass** badge for marking themselves as still struggling, because we genuinely value self-awareness as much as success.

---

**What does Plan Quest cost?**
Plan Quests are included in all subscriptions: All Subjects (S$12.99/month) and Family Plan (S$19.99/month). No usage caps. Your child can complete as many quests as they want.

---

**How does this respect privacy?**
All quest data is stored under your child's profile and protected by row-level security in our database — only you (the parent) and your child can access it. We never share quest performance data with third parties. We use your child's quiz history to improve recommendations within their own profile only — we don't pool anonymised data across users.

---

## §6 Assess (Exams)

**What is the Assess feature?**
The Assess feature generates full AI-powered practice papers for WA1, WA2, EOY, and PSLE Prelims. Each paper follows the actual SEAB paper structure for that exam type, covering the correct mark allocations, section types, and question formats for your child's target level.

---

**How are exam papers generated?**
Our AI generates fresh questions calibrated to the SEAB 2026 syllabus. Each paper is unique — it's not reusing a static question bank. Questions are generated to the correct difficulty distribution and mark allocations for each exam format and level.

---

**Can I generate papers on specific topics?**
Yes. You can customise sections or question types to focus on particular topics. A full paper includes all required sections; a focused paper targets the topics you select.

---

**How do I know if my child's answers are correct?**
Every question includes a full worked solution with step-by-step reasoning. For open-ended and short-answer questions, AI grading gives instant scoring with feedback on what was demonstrated and what was missing. For word problems, a model answer is shown for comparison.

---

## §7 Payment & Subscription

**Do I need a credit card for the free trial?**
No. Your 7-day free trial starts the moment you create an account — no payment details required. You only enter your card when you decide to subscribe.

---

**What happens when my free trial ends?**
When your 7-day trial ends, you'll need to subscribe to continue practising. We will never charge you automatically — you choose when to subscribe by visiting the [Pricing page](https://www.superholiclab.com/pages/pricing.html).

---

**What's the difference between the All Subjects and Family plans?**
**All Subjects** (S$12.99/month or S$129.90/year) covers **1 child profile** with full access to Maths, Science, and English across all four pillars.

**Family Plan** (S$19.99/month or S$199.90/year) covers **up to 3 child profiles** with a shared parent dashboard — ideal for families with multiple school-age children.

---

**Can I change or cancel my plan?**
Yes. Once subscribed, you can upgrade, downgrade, update your payment method, or cancel at any time from your account settings. Cancellation takes effect at the end of your current billing period.

---

**Is there a discount for annual billing?**
Yes — annual billing saves 17% compared to monthly:
- All Subjects annual: **S$129.90/year** (≈ S$10.83/month)
- Family annual: **S$199.90/year** (≈ S$16.66/month)

---

**Do you offer refunds?**
We offer a 7-day free trial specifically so you can evaluate the platform before committing. Refunds after subscription are handled on a case-by-case basis — [contact us](https://www.superholiclab.com/pages/contact.html) and we'll work something out.

---

## §8 Account & Privacy (PDPA)

**What personal data do you collect?**
We collect only what's needed to operate the platform: email address, chosen username, year level, and quiz/quest results. We do **not** collect: full legal name, home address, school name, NRIC, or phone number.

All data is stored in Singapore (Supabase SG region) under PDPA-compliant practices with AES-256 encryption at rest.

---

**Are my PDPA rights respected?**
Yes. Under Singapore's Personal Data Protection Act (PDPA), you have the right to access, correct, and withdraw consent for your personal data. To exercise these rights, [contact us](https://www.superholiclab.com/pages/contact.html) and we will respond within 10 business days.

---

**How do I delete my account and all data?**
Go to your account settings and click **Delete Account**. All quiz results, quest data, and profile information are permanently deleted — this action cannot be undone. You will receive a confirmation email once deletion is complete.

---

**Who can access my child's data?**
Only you (the parent account holder) and your child can access quest and quiz data. All data is protected by row-level security in our database — no other user, subscriber, or staff member can access your child's records without your explicit consent.

We never share your child's performance data with third parties, advertisers, or schools.

---

## §9 Technical & Troubleshooting

**Which browsers and devices are supported?**
Superholic Lab works best on the latest two versions of Chrome, Safari, Edge, and Firefox. Mobile browsers on iOS and Android are fully supported. The platform is mobile-first and responsive at 375px and above.

---

**What if Miss Wena (the AI tutor) isn't responding?**
If the AI tutor is slow or not responding, try refreshing the page. If the problem persists, it may be temporary high demand on the AI service. You can continue practising with quizzes or exams in the meantime. If the issue continues for more than 15 minutes, [contact us](https://www.superholiclab.com/pages/contact.html).

---

**I found a bug — how do I report it?**
Use the [Contact Us](https://www.superholiclab.com/pages/contact.html) page and describe what happened. Screenshots are very helpful — include the page you were on and what you expected vs. what happened. We aim to respond within 24 hours.

---

*Still have questions? [Contact us](https://www.superholiclab.com/pages/contact.html) — we respond within 24 hours.*
