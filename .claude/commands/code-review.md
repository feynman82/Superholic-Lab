# /code-review — Quality Review

When the user runs `/code-review [file or recent changes]`, execute:

1. **Read the code** — target file(s) or recent git changes
2. **Check against rules** in `.claude/rules/`:
   - Coding style (immutability, naming, file size)
   - Security (no secrets, XSS prevention, RLS)
   - Patterns (Supabase queries, error handling)
3. **Rate each issue:**
   - CRITICAL — Security vulnerability, data leak, must fix now
   - HIGH — Bug, missing error handling, must fix before deploy
   - MEDIUM — Code quality, readability, fix when possible
   - LOW — Style preference, minor improvement
4. **Report format:**
   ```
   [SEVERITY] file:line — Description
   Suggestion: How to fix
   ```
5. **Summary** — Total issues by severity, overall assessment
