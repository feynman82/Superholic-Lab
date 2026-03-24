# /plan — Implementation Planning

When the user runs `/plan <feature>`, execute this workflow:

1. **Read context** — Load CLAUDE.md + ARCHITECTURE.md
2. **Analyze scope** — Identify all affected files and systems
3. **Check dependencies** — Does this touch auth, payments, Supabase schema?
4. **Generate plan** with these sections:
   - Requirements summary
   - Files to create/modify
   - Supabase changes (if any)
   - Implementation steps (ordered, small commits)
   - Mobile responsiveness considerations
   - Error handling requirements
   - Testing plan
   - Risks and edge cases
5. **Present plan** and wait for approval before coding
