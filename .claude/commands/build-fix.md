# /build-fix — Fix Build or Runtime Errors

When the user runs `/build-fix`, execute this workflow:

1. **Identify the error** — Read error message, stack trace, or user description
2. **Locate the source** — Find the file and line causing the issue
3. **Check related files** — Look for import/dependency issues
4. **Fix the issue** following coding rules from CLAUDE.md:
   - No `var` usage
   - Proper error handling
   - CSS variables only
   - No innerHTML with user content
5. **Verify the fix** — Provide TEST: instructions
6. **Check for similar issues** elsewhere in codebase
7. **Commit** with `fix: <description>` message
