# Week 2 — Success Scorecard (v2)

Run this checklist against the live Vercel preview after **Diagnostic + Topic Naming + Backend + all 4 Frontend commits** have landed on `main`. Week 2 is **not done** until every box ticks.

Test on **two students minimum**:
- **Student A:** ≥ 10 question_attempts in Mathematics, with a clear weakest topic, post-fix data.
- **Student B:** zero question_attempts, fresh account.

---

## Diagnostic — `question_attempts` writes restored

- [ ] Migration 014 deployed; trigger function on `question_attempts` no longer references `NEW.subject`.
- [ ] Live quiz on `quiz.html` produces a 201 Created on the `question_attempts` POST.
- [ ] Browser DevTools Console shows zero `42703` errors during a quiz session.
- [ ] `SELECT count(*) FROM question_attempts WHERE created_at > '<diagnostic-fix-date>'` returns the expected count of post-fix attempts (matches the test quizzes you ran).
- [ ] `mastery_levels` rows update on quiz completion (verify with timestamp check).
- [ ] `docs/INCIDENTS.md` exists with the Apr 22 incident documented.

## Topic Naming — canonical strings going forward

- [ ] `validateTopicCanon()` validator in `handlers.js` filters non-canonical AI output before insert.
- [ ] Generation prompt enumerates canonical topic+sub_topic per subject.
- [ ] `quiz.js` 'Mixed' fallback replaced with logged 'Unknown'.
- [ ] Fresh AI-generated questions have canonical `topic` and `sub_topic` per `SYLLABUS_DEPENDENCIES` (spot-check 5 newly generated questions).
- [ ] No `(PSLE Paper 2)` suffix in any new English sub_topic write.
- [ ] PR description lists every file touched and every legacy string replaced.

## Backend — `/api/analyze-weakness` response shape

- [ ] Endpoint with Student A + `subject: 'mathematics'` returns 200 with `diagnosis` block containing all 5 fields.
- [ ] Student B (no attempts) returns `diagnosis` with `al_band: null`, `weakest_topic: null`, `weakest_sub_topic: null`, `dependent_topic_count: 0`, non-empty `hero_sentence`.
- [ ] All pre-existing fields in the response are still present (additive change).
- [ ] Response time within 200ms of pre-Week-2 baseline.

## Backend — `/api/syllabus-tree`

- [ ] `curl https://<preview>/api/syllabus-tree` returns 200 with full map JSON.
- [ ] Response contains `mathematics`, `science`, `english` keys.
- [ ] `english.Cloze.sub_topics[0]` is `"Grammar Cloze With Word Bank"` (no suffix).
- [ ] `Cache-Control` header present (`public, max-age=3600` or similar).
- [ ] Endpoint accessible without auth (public).

## Backend — `/api/recent-attempts`

- [ ] `GET /api/recent-attempts?student_id=<A>&topic=Fractions&sub_topic=Equivalent%20Fractions&limit=5` with valid Bearer token returns 200.
- [ ] Response includes `attempts` array (≤ 5 items) and `stats` block (`total_attempts`, `accuracy`, `mastery_probability`).
- [ ] Same call without auth returns 401.
- [ ] Same call with a different parent's `student_id` returns 403.
- [ ] Empty `sub_topic` parameter correctly matches NULL sub_topic rows.
- [ ] `stats.accuracy` between 0 and 1 (or null); `stats.mastery_probability` between 0 and 1 (or null).

## Backend — `SYLLABUS_DEPENDENCIES` expansion

- [ ] `lib/api/quest-pedagogy.js` exports the full P3–P6 map: 23 maths topics, 10 science topics, 7 english topics.
- [ ] `Algebra` is a leaf (no downstream dependents).
- [ ] `Fractions` is depended on by ≥ 4 other maths topics.
- [ ] English `Summary Writing` lists `Comprehension` and `Synthesis` as prerequisites.
- [ ] No English sub_topic contains `(PSLE Paper 2)`.

## Frontend — Hero diagnosis sentence (Commit A)

- [ ] Renders for Student A in Mathematics: name, AL band (or alt template), real topic, dependent count.
- [ ] Renders for Student A in Science and English (test all three).
- [ ] Renders for Student B: empty-state template, peach left-border.
- [ ] No celebratory or trend language anywhere ("improving", "great", "well done", "amazing", "progress", "keep up" — all absent).
- [ ] Wraps cleanly at 375px, no horizontal overflow.
- [ ] Screen reader announces sentence updates on subject switch.

## Frontend — Dependency tree (Commit B)

- [ ] Tree renders for Mathematics, Science, English on subject switch.
- [ ] Weakest topic node has rose ring (`stroke="var(--brand-rose)"`, width 3).
- [ ] Node colours reflect mastery probability buckets (spot-check ≥ 3 nodes).
- [ ] At 375px width: container shows horizontal scroll, SVG min-width 600px.
- [ ] `/api/syllabus-tree` is fetched exactly **once** per page load (Network tab; second subject switch does NOT trigger refetch).
- [ ] Shared-node DAG layout: `Decimals` appears exactly once even though prereq to multiple downstream topics.
- [ ] Zero console errors on rapid subject switching.

## Frontend — Topic mastery heatmap (Commit C)

- [ ] Heatmap replaces the old vertical BKT list (old list is gone).
- [ ] All topics for active subject render as rows; sub_topics as columns.
- [ ] English row labels show clean canonical sub_topic names (no `(PSLE Paper 2)` to strip — already clean).
- [ ] Single-sub_topic topics render as one wide cell.
- [ ] No-data cells show diagonal-stripe pattern.
- [ ] Click any cell → modal opens, fetches `/api/recent-attempts`, populates with real data.
- [ ] Modal stats (attempts, accuracy, mastery) match Supabase ground truth (spot-check 2 cells).
- [ ] ESC key closes modal.
- [ ] Click outside modal closes modal.
- [ ] Close button closes modal.
- [ ] Mobile (375px): topic labels narrow to 110px, cells stay tappable (≥32px).

## Frontend — Streak strip (Commit D)

- [ ] 30 squares, today rightmost, oldest leftmost.
- [ ] Hover any square → native tooltip with date + attempt count.
- [ ] Spot-check 3 days against `question_attempts` rows: counts match.
- [ ] Empty days styled identically (cream colour) — no guilt UI.
- [ ] No celebratory copy near the strip ("streak", "great job", flame/trophy emoji — all absent).
- [ ] Strip fits one row at 375px.
- [ ] Strip placed **above** heatmap, **below** hero sentence.

## Frontend — Compliance (M4/M5/M6 design debt resolved)

- [ ] `grep -n "cssText" public/js/progress.js` returns zero matches.
- [ ] `grep -nE 'style="[^"]*#[0-9a-fA-F]' pages/progress.html` returns zero matches.
- [ ] `grep -nE 'style="[^"]*rgba?\(' pages/progress.html` returns zero matches.
- [ ] All new styles use existing CSS variables; no new tokens introduced.
- [ ] Bebas Neue used only via `.font-display` class.

## Cross-cutting — Honest Compass

- [ ] No language anywhere implies progress where there is none.
- [ ] No "you're improving!" toast, banner, or pop-up.
- [ ] Streak strip described as activity, not achievement.
- [ ] Hero sentence describes current state only.
- [ ] If `weakest_topic` is null, no fake topic is shown anywhere.
- [ ] `no_improvement` signal from Plan Quest spec preserved end-to-end.

## Cross-cutting — 4 Pillars language

- [ ] "Analyse Weakness" appears verbatim somewhere on `progress.html`.
- [ ] No collapsing of the pillar into another label.
- [ ] Hero sentence reinforces the diagnostic frame.

## Performance & accessibility

- [ ] Lighthouse mobile on `/pages/progress.html` (preview URL): Performance ≥ 90.
- [ ] Lighthouse mobile: Accessibility ≥ 95.
- [ ] Lighthouse mobile: Best Practices ≥ 95.
- [ ] CLS < 0.1.
- [ ] Tab order logical: hero → streak → heatmap cells → tree.

## Visual audit vs `docs/design-audit.md`

- [ ] Final score ≥ **9/10** (Week 2 success gate).
- [ ] Every M4 line item resolved.
- [ ] Every M5 line item resolved.
- [ ] Every M6 line item resolved.

Score: ____ / 10

## Sign-off

- [ ] `PROJECT_DASHBOARD.md` v2.0 updated: Week 2 done with date.
- [ ] `INDEX.md` v2.0 updated if any new file was added.
- [ ] `docs/design-audit.md` updated with new score and dated entry.
- [ ] `docs/INCIDENTS.md` Apr 22 incident documented.
- [ ] Commit on `main` tagged `week2-complete-YYYY-MM-DD`.
- [ ] Backfill handoff queued for next sprint cycle (not blocking Week 2 sign-off).

Week 2 done.