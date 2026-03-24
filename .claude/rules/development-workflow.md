# Development Workflow — Superholic Lab

## Feature Implementation Pipeline

### 0. Research & Reuse (mandatory before new code)

- Check existing codebase for similar patterns
- Read Supabase/Stripe/Anthropic docs for relevant examples
- Check if the feature affects auth, payments, or quiz engine
- Prefer adapting existing code over writing from scratch

### 1. Plan First

- Identify all files that need changes
- List Supabase schema changes (if any)
- Consider mobile responsiveness
- Check ARCHITECTURE.md for infrastructure constraints
- Break into small, committable steps

### 2. Build

- Follow coding rules in CLAUDE.md
- Use CSS variables from style.css
- Handle errors on every async operation
- Add `// TEST:` comments explaining how to verify

### 3. Verify

- Test the feature manually in browser
- Check mobile view (responsive)
- Verify error states (what if API fails?)
- Check that no secrets are exposed
- Validate Supabase RLS still works

### 4. Commit & Deploy

- Descriptive conventional commit message
- Push to main → Vercel deploys automatically
- Verify on https://www.superholiclab.com after deploy

## Question Content Workflow

1. Verify topic exists in MOE syllabus for the target level
2. Write question with 4 MCQ options
3. Write wrong-answer explanation for each wrong option
4. Write full step-by-step worked solution
5. Assign difficulty: foundation | standard | advanced | hots
6. Add examiner tip for advanced/hots questions
7. Save to `data/questions/{level}-{subject}.json`
