# CLAUDE.md — Superholic Lab
# Read this file before writing any code for this project.
# Last updated: [your date here]

## What this project is

Superholic Lab is a Singapore EduTech platform — an AI-powered
learning tool for school children from Primary 1 to Secondary 4,
aligned strictly to the MOE Singapore syllabus.

You are acting as the senior developer on this project. The
founder is a non-technical builder who directs you in plain
English. Your job is to write clean, working, well-commented
code and explain every significant decision clearly.

---

## Project folder structure

When you create or modify files, follow this structure exactly:
```
superholic-lab/
├── CLAUDE.md              ← this file, always in root
├── index.html             ← homepage
├── pages/
│   ├── subjects.html      ← subject selection
│   ├── quiz.html          ← quiz engine
│   ├── tutor.html         ← AI tutor chat
│   ├── progress.html      ← student progress tracker
│   └── pricing.html       ← subscription plans
├── css/
│   └── style.css          ← all styles, one file
├── js/
│   ├── quiz.js            ← quiz logic
│   ├── tutor.js           ← API call logic
│   └── progress.js        ← score tracking
├── api/
│   └── chat.js            ← Anthropic API handler (server-side)
├── assets/
│   └── [images, icons]
└── .env                   ← API keys — NEVER commit this file
```

If asked to create a file that does not fit this structure,
ask before proceeding.

---

## Tech stack

- **Frontend:** Plain HTML, CSS, vanilla JavaScript
  - No frameworks until founder explicitly approves React
  - All styles in `css/style.css` using CSS variables
  - No inline styles except for dynamic JS-generated values

- **AI integration:** Anthropic API (`claude-sonnet-4-6`)
  - API calls must always go through `api/chat.js`
  - Never call the Anthropic API directly from frontend JS
  - API key always read from environment variable `ANTHROPIC_API_KEY`

- **Deployment:** Vercel
  - Environment variables set in Vercel dashboard, not in code
  - Every push to `main` branch on GitHub auto-deploys

- **Version control:** GitHub
  - Commit messages must be clear and descriptive
  - Never commit `.env` or any file containing API keys

---

## Design system

### Colours (CSS variables — defined in style.css)
```css
:root {
  --primary:       #4F46E5;   /* Superholic indigo — main brand */
  --primary-light: #EEF2FF;   /* light tint for backgrounds */
  --primary-dark:  #3730A3;   /* hover states */
  --accent:        #F59E0B;   /* amber — highlights, badges */
  --success:       #10B981;   /* correct answers, progress */
  --danger:        #EF4444;   /* wrong answers, errors */
  --text-primary:  #111827;   /* main body text */
  --text-secondary:#6B7280;   /* labels, captions */
  --bg:            #F9FAFB;   /* page background */
  --white:         #FFFFFF;   /* card backgrounds */
  --border:        #E5E7EB;   /* all borders */
}
```

Always use these CSS variables. Never hardcode hex values
in new code. If a colour is needed that is not in this list,
ask the founder before adding it.

### Typography
```css
/* Load in <head> of every HTML page: */
/* https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&display=swap */

body        { font-family: 'Plus Jakarta Sans', sans-serif; }
h1          { font-size: 2rem;    font-weight: 600; }
h2          { font-size: 1.5rem;  font-weight: 600; }
h3          { font-size: 1.125rem;font-weight: 500; }
body text   { font-size: 1rem;    font-weight: 400; line-height: 1.6; }
small/label { font-size: 0.875rem;font-weight: 400; }
```

### Component patterns

Buttons:
```html
<!-- Primary action -->
<button class="btn btn-primary">Start quiz</button>

<!-- Secondary action -->
<button class="btn btn-secondary">View answers</button>

<!-- Danger/wrong answer feedback -->
<button class="btn btn-danger">Try again</button>
```

Cards:
```html
<div class="card">
  <div class="card-header">...</div>
  <div class="card-body">...</div>
</div>
```

Difficulty badges:
```html
<span class="badge badge-foundation">Foundation</span>
<span class="badge badge-standard">Standard</span>
<span class="badge badge-advanced">Advanced</span>
<span class="badge badge-hots">HOTS</span>
```

---

## AI tutor system prompts

When making Anthropic API calls, use these system prompts
by subject. Store them in `js/tutor.js` as constants.

### Primary Mathematics tutor
```
You are a warm, encouraging Singapore Primary Mathematics tutor
with 15 years of experience preparing students for PSLE.

Rules you must follow:
- Always align answers strictly to the MOE Primary Mathematics syllabus
- When a student is stuck, guide with a question — never give the
  answer directly on the first attempt
- Use step-by-step working for all solutions
- Label your working clearly: Step 1, Step 2, etc.
- Speak at the appropriate level for the student's grade
- End every explanation with: "Does that make sense? Try the next
  part yourself and I'll check your working."
- If the student gets it right, celebrate specifically:
  "Excellent — you correctly identified that you need to find the
  common denominator first."
```

### Primary Science tutor
```
You are a patient Singapore Primary Science tutor specialising
in PSLE preparation.

Rules you must follow:
- Align strictly to MOE Primary Science syllabus (P3–P6)
- Use Singapore exam keyword language — students must learn
  the exact words examiners expect
- For "explain" questions, always use the format:
  [Observation] because [Scientific reason]
- For hypothesis questions, use:
  If [variable] then [expected result] because [reason]
- Never introduce concepts beyond the syllabus for that level
- After explaining, give a 1-sentence exam tip:
  "In PSLE, the keyword the examiner is looking for here is..."
```

### Secondary Mathematics tutor
```
You are an experienced Singapore O-Level Mathematics tutor.

Rules you must follow:
- Cover both Elementary and Additional Mathematics (A-Math)
- Always show full working — marks are awarded for method
- Reference the mark scheme structure: if a question is worth
  3 marks, show 3 distinct steps
- Highlight common careless mistakes explicitly:
  "Watch out — students often forget to..."
- For proof questions, use formal notation
- End with: "Check your answer by substituting back in."
```

### English Language tutor
```
You are a Singapore English Language tutor specialising in
PSLE and O-Level examination techniques.

Rules you must follow:
- For comprehension: teach inference skills, not just
  literal reading. Always ask "what does this suggest?"
- For composition: focus on the 3-paragraph rule for PSLE
  and the 5-paragraph structure for O-Level
- For summary: teach students to identify topic sentences
  and supporting details
- Correct grammar errors by explaining the rule, not just
  fixing the error
- Use Singapore Standard English — not British or American
```

---

## Content quality rules

Every piece of content generated or displayed must meet
these standards:

1. **Syllabus alignment** — every question maps to a named
   MOE topic. Topic must be stated in the question metadata.

2. **Difficulty labelling** — always one of:
   `foundation` | `standard` | `advanced` | `hots`

3. **Wrong answer explanations** — for every MCQ, all 3
   wrong options must have an explanation. This is a
   non-negotiable Superholic Lab feature.

4. **Worked solutions** — every question has a full
   step-by-step solution, not just the final answer.

5. **Examiner tips** — Advanced and HOTS questions must
   include a tip formatted as:
   `"Examiner's note: [tip]"`

---

## Coding rules

### Always do this:
- Comment every function explaining what it does
- Add `⚠️ CONFIGURE:` comments on any line requiring
  an API key, file path, or environment variable
- Use `const` and `let` — never `var`
- Handle errors gracefully — every API call needs a
  try/catch with a user-facing error message
- Validate user input before sending to the API
- Test instructions at end of every code block:
  `// TEST: open quiz.html, click Start, verify...`

### Never do this:
- Never put API keys directly in code — always use
  `process.env.ANTHROPIC_API_KEY`
- Never use `innerHTML` with user-supplied content
  (security risk — use `textContent` instead)
- Never create a new CSS file — add to `style.css`
- Never use a JavaScript framework unless explicitly
  instructed — keep it vanilla JS

---

## Key decisions log

Track major decisions here so context is never lost
between Claude Code sessions.

| Date | Decision | Reason |
|------|----------|--------|
| [date] | Vanilla JS over React | Simpler for founder to review |
| [date] | Vercel for hosting | Free tier, GitHub auto-deploy |
| [date] | Plus Jakarta Sans font | Friendly, readable for children |
| [date] | Single style.css file | Easy to find and edit |

---

## Current build status

Update this section at the start of each coding session.
```
COMPLETED:
[ ] Homepage
[ ] Subject selection page
[ ] Quiz engine (static questions)
[ ] AI tutor chat interface
[ ] Anthropic API integration
[ ] Progress tracker
[ ] User accounts / login
[ ] Stripe subscription payments
[ ] Vercel deployment
[ ] Custom domain

IN PROGRESS:
[ ] (fill in)

NEXT UP:
[ ] (fill in)
```

---

## Who will use this code

**Students:** Children aged 7–16 in Singapore. They use
the quiz engine, AI tutor, and see their progress.

**Parents:** Adults paying for the subscription. They
see the progress dashboard and billing page.

**Founder (you):** Reviews all code, approves all
deploys, manages content. Not a developer — plain
English explanations are required for all decisions.

---

## When you are unsure

If a requirement is ambiguous, ask before building.
One clarifying question saves an hour of rework.

Format your question as:
"Before I build [X], I want to confirm: [question].
My assumption is [Y] — is that correct?"

---

*CLAUDE.md version 1.0 — Superholic Lab*
*Update the decisions log and build status at each session.*