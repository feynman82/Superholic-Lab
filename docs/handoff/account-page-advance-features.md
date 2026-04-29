# Account Page — Advanced Features Implementation

You are working on the parent account page at `public/pages/account.html`. The visual reskin has been completed in a previous session — DO NOT touch the existing visual treatment, JS contracts, or 27 element IDs that the existing JS depends on.

Read these files in order before writing any code:
1. `CLAUDE.md` — coding rules
2. `ARCHITECTURE.md` — schema, API routes, build state
3. `public/pages/account.html` — current state (post-reskin)
4. `lib/api/handlers.js` — single API gateway, where new handlers go
5. `api/index.js` — route dispatch (add new routes here)
6. `vercel.json` — rewrites (add new rewrites here)

## Implementation order

Work in this order. Each phase has its own success gate.

---

### Phase 1 — Two-factor authentication setup (MFA)

**Goal:** Allow parents to enrol in TOTP-based MFA via Supabase Auth.

**Why:** Account holds child data, payment methods, and quiz history. MFA is table-stakes for a 2026 EdTech parent portal.

**Schema:** No new schema. Supabase manages MFA factors in its `auth.mfa_factors` table.

**UI deliverables in `account.html`:**

1. Add a new section card in the 7-column main column, AFTER the Profile section (`§03`) and BEFORE Refer a Friend (`§04`). New section number `§04`, renumber subsequent sections (Refer a Friend → `§05`).
2. Section title: "Two-factor authentication"
3. Section content has two states driven by Supabase MFA factor query:
   - **Not enrolled:** Eyebrow "Recommended", description, single rose `.btn-primary` "Set up two-factor auth"
   - **Enrolled:** Eyebrow "Active", show factor type (TOTP), enrolled date, two buttons: `.btn-secondary` "View recovery codes" + `.btn-danger` "Remove 2FA"

**Setup flow (modal):**

1. User clicks "Set up two-factor auth" → opens new `#mfaEnrolModal` modal
2. Modal step 1: Show QR code from `supabase.auth.mfa.enroll({ factorType: 'totp' })`. Display the QR as an SVG/img and the manual entry secret below it.
3. Modal step 2: Input field for 6-digit code from authenticator app. Submit calls `supabase.auth.mfa.challenge` then `supabase.auth.mfa.verify`.
4. Modal step 3: Generate and display 8 single-use recovery codes (you generate these client-side with `crypto.randomUUID().slice(0,8)` and store in a new Supabase table `mfa_recovery_codes`). Mandatory "I have saved these codes" checkbox before closing.

**Login flow update:**

In `public/pages/login.html`, after successful password login, check if the user has MFA enrolled via `supabase.auth.mfa.listFactors()`. If yes, redirect to a new `pages/mfa-challenge.html` page which collects the 6-digit code or a recovery code.

**New page: `public/pages/mfa-challenge.html`**

Use the auth shell pattern from login.html (sage-dark brand mark band, glass card, .h2-as heading). Form has: 6-digit code input + "Use recovery code instead" link. Submit calls `mfa.challenge` + `mfa.verify`.

**New schema migration:** `supabase/009_mfa_recovery_codes.sql`

```sql
CREATE TABLE mfa_recovery_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash   text NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE mfa_recovery_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_recovery_codes" ON mfa_recovery_codes
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_mfa_recovery_codes_user ON mfa_recovery_codes (user_id, used_at);
```

Hash codes with SHA-256 client-side before storing — never store plaintext recovery codes.

**Success gate:** Parent can enrol → log out → log in → land on MFA challenge → enter TOTP → reach dashboard. Recovery code path also works.

---

### Phase 2 — Account activity log

**Goal:** Surface recent security and account events so parents can spot suspicious activity.

**Why:** Builds trust. Industry standard for SaaS (Notion, Linear, GitHub all have this). Specifically helps parents notice if a password was changed without their knowledge.

**Schema migration:** `supabase/010_account_activity.sql`

```sql
CREATE TABLE account_activity (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type    text NOT NULL CHECK (event_type IN (
    'login_success', 'login_failure', 'password_changed', 'email_changed',
    'mfa_enrolled', 'mfa_removed', 'plan_changed', 'subscription_paused',
    'subscription_resumed', 'subscription_cancelled', 'data_exported',
    'learner_added', 'learner_removed'
  )),
  metadata      jsonb DEFAULT '{}'::jsonb,
  ip_hash       text,                   -- never store raw IP
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE account_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_activity" ON account_activity
  FOR SELECT USING (profile_id = auth.uid());
-- Inserts are service-role only; no INSERT policy for clients
CREATE INDEX idx_account_activity_profile ON account_activity (profile_id, created_at DESC);
```

**Logging integration:** Add a `logActivity({ profileId, eventType, metadata, req })` helper in `lib/api/handlers.js`. Call it from:
- `handleContact` after successful submission (no — this is contact, not account; skip)
- `handlePause` (`subscription_paused`, `subscription_resumed`)
- `handleAccountDelete` (no log — account is being destroyed)
- `handlePortal` (skip — too noisy, the action happens in Stripe)
- `handleStripeWebhook` for `customer.subscription.updated` events with `previous_attributes.items` → `plan_changed`
- The signup/login flows in `js/auth.js` → call a new `/api/log-activity` endpoint for `login_success` / `password_changed` / `email_changed` / `mfa_enrolled` / `mfa_removed`

The login_failure event is tricky — we don't have a profile_id when login fails. Skip it for v1.

**UI deliverables:**

In `account.html`, add a new collapsible section in the **5-col aside** (right column), AFTER Notifications and BEFORE Privacy & data:

- Section title: "Recent activity"
- Eyebrow: "Security"
- Content: A list of the most recent 8 events. Each row has: relative timestamp ("2 hours ago"), event icon, event description in plain English ("Password changed", "Subscription paused", "Logged in from new device").
- A "View all activity →" link at the bottom that opens a new full-screen modal showing 50 most-recent events.

**New API route:** `GET /api/account-activity?limit=8`

In `vercel.json` add `{ "source": "/api/account-activity", "destination": "/api/index" }`.
In `api/index.js` add `case 'account-activity': return handleAccountActivity(req, res);`.
In `lib/api/handlers.js` add the handler — auth check, query `account_activity` filtered to current user's `profile_id`, return the rows.

**New API route:** `POST /api/log-activity` (called by client-side auth flows)

Body: `{ event_type, metadata }`. Server fills in profile_id from session, IP hash, user agent. Validates event_type against the allowed list before insert.

**Success gate:** Trigger a password change from the Profile section — within 5 seconds the new event appears in "Recent activity".

---

### Phase 3 — Per-learner data export

**Goal:** Allow parents to export a single child's quiz history (separate from the bulk "Download my data" button).

**Why:** Real use case — parent shares one child's data with a tutor. They don't want to share the other child's data.

**No schema change.** Reuses `students`, `question_attempts`, `mastery_levels`, `study_notes`, `remedial_quests` tables.

**UI deliverables:**

In the learner card template inside `loadLearners()` in `account.html`, add a new shortcut alongside Practise / Progress:

```html
<a class="learner-card__shortcut" href="#" onclick="window.exportLearnerData('${s.id}', '${s.name}'); return false;">Export data</a>
```

When clicked, calls `window.exportLearnerData(studentId, studentName)` which:
1. Confirms with `confirm("Download all of " + name + "'s quiz history as a JSON file?")`
2. Calls `GET /api/learner-export?student_id={id}` with auth header
3. Downloads the resulting JSON as `superholiclab-{name}-data.json`

**New API route:** `GET /api/learner-export`

Add to `vercel.json`, `api/index.js`, `lib/api/handlers.js` following the existing pattern.

Handler:
1. Auth check — get profile_id from session
2. Validate `student_id` query param belongs to this parent (RLS already enforces but double-check)
3. Build a single JSON object containing:
   - `student`: { id, name, level, created_at }
   - `quiz_attempts`: all rows from `quiz_attempts` for this student
   - `question_attempts`: all rows from `question_attempts` for this student
   - `mastery_levels`: all rows from `mastery_levels` for this student
   - `study_notes`: all rows from `study_notes` for this student
   - `remedial_quests`: all rows from `remedial_quests` for this student
   - `exam_results`: all rows from `exam_results` for this student
   - `exported_at`: ISO timestamp
   - `format_version`: `"1.0"`
4. Return as `application/json` with `Content-Disposition: attachment; filename="learner-data-{student_id}.json"`

**Log this:** Call `logActivity` with `event_type: 'data_exported'` and `metadata: { scope: 'learner', student_id }`.

**Success gate:** Click "Export data" on a learner → JSON file downloads → opening it shows complete attempt history for that one child only.

---

### Phase 4 — Plan upgrade teaser (Family upsell)

**Goal:** When an All Subjects subscriber adds a second learner, surface a non-pushy nudge to upgrade to Family.

**Why:** Family plan is better unit economics and the parent has demonstrated intent (they tried to add a second child). The nudge must be respectful — show once, allow dismissal.

**No schema change.** Reuses `profiles.notification_preferences` to store dismissal.

**UI deliverables:**

Logic lives in `loadLearners()` in `account.html`. After rendering learner cards, check:

```javascript
const tier = profile.subscription_tier;
const learnerCount = students.length;
const max = profile.max_children || 1;
const dismissed = (profile.notification_preferences || {}).family_upsell_dismissed === true;

if (tier === 'all_subjects' && learnerCount >= max && !dismissed) {
  // Show upsell card immediately after the last learner-card
}
```

Render an upsell card with these properties:
- `.card-glass` with rose left-rail (`border-left: 3px solid var(--brand-rose)`)
- `.label-caps` eyebrow "Recommended for your family"
- Heading: `.h2-as` "Switch to Family for more learners."
- Body: "You've reached your 1-learner limit on All Subjects. Upgrade to Family for up to 3 learners — just S$7/mo more, with separate dashboards for each child."
- Two buttons: `.btn-primary` "View Family plan →" (links to `/pages/pricing.html?upgrade=family`) and `.btn-ghost` "Maybe later" (calls `dismissFamilyUpsell()`)

**Dismissal handler:** `window.dismissFamilyUpsell` writes `notification_preferences.family_upsell_dismissed = true` to the profile. Hides the card.

**Pricing page side:** When `pricing.html` loads with `?upgrade=family`, scroll to the Family card and add a brief banner above pricing: "Upgrading from All Subjects? You'll be prorated for the difference."

**Success gate:** Add a 2nd learner (or just manually set `students.count >= max_children` in test data). Upsell appears once. Click "Maybe later" — never appears again on this account. Click "View Family plan" — goes to pricing page with `?upgrade=family` and the prorating banner shows.

**Important — keep it tasteful:**
- ONE dismissal kills the upsell forever per account. Do not re-show.
- Don't trigger if already on Family or annual plans.
- Don't trigger during trial — user hasn't even paid yet.

---

## Cross-cutting requirements

For all phases:

- **No inline hex/rgba in HTML `style=` attributes.** Use CSS variables from `style.css` v3.0. Page-level `<style>` blocks are fine.
- **Match the architect-scholar visual layer.** New cards use `.card-glass`. New buttons use `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-danger`. Modals use the existing `.modal-overlay` + `.modal-box` shell.
- **Preserve all existing JS contracts.** Do not rename any of the 27 element IDs the current `account.html` JS depends on.
- **Add new IDs with prefixes.** MFA: `mfa-*`. Activity: `activity-*`. Upsell: `upsell-*`. Avoids collision risk.
- **Each new API route gets ALL THREE additions:** rewrite in `vercel.json`, case in `api/index.js`, handler in `lib/api/handlers.js`.
- **All new tables get RLS policies.** Without exception.
- **All Supabase RLS on tables joined via student_id must use the canonical pattern:** `student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())` — never `auth.uid() = student_id`.
- **All sensitive data (recovery codes, IPs) must be hashed.** Never plaintext.
- **All emails reference `support@superholiclab.com`** — no `linzy@`.

## Test plan after each phase

- Each phase has its own success gate above.
- Run a hard-refresh end-to-end after every phase. Don't batch test.
- Visual QA via `read_console_messages onlyErrors:true` after each Vercel deploy.

## Order of work and stop points

1. Read files listed at top.
2. Implement Phase 1 (MFA). Stop. Verify success gate. Commit with message `feat(account): MFA enrolment + challenge flow`.
3. Implement Phase 2 (activity log). Stop. Verify. Commit `feat(account): account activity log`.
4. Implement Phase 3 (per-learner export). Stop. Verify. Commit `feat(account): per-learner data export`.
5. Implement Phase 4 (Family upsell). Stop. Verify. Commit `feat(account): Family plan upsell`.

If any phase fails the success gate, stop and surface the failure rather than proceeding. Do not silently work around blockers.

## Out of scope for this prompt

- Don't refactor the existing `account.html` visual layer or JS structure.
- Don't add SMS-based MFA (TOTP only — SMS is a deliverability and cost rabbit hole).
- Don't modify the bottom-nav, header, or footer components.
- Don't change `style.css` v3.0 — all new styles go in page-level `<style>` blocks.
- Don't introduce new dependencies. Vanilla JS, native Supabase SDK, Web Crypto API only.