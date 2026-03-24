# /security-check — Security Audit

When the user runs `/security-check`, execute this workflow:

1. **Scan for exposed secrets:**
   - Grep for API key patterns (sk-, pk_, sbp_, ghp_)
   - Check no .env values are hardcoded
   - Verify .gitignore includes .env, .mcp.json

2. **Check frontend security:**
   - Scan for innerHTML usage with user data
   - Check for eval() or Function() with user input
   - Verify URL parameter validation

3. **Check Supabase security:**
   - Verify RLS enabled on all tables
   - Check service role key only used in api/ files
   - Verify anon key used appropriately

4. **Check Stripe security:**
   - Webhook signature verification in place
   - Secret key only in serverless functions
   - No client-side price manipulation possible

5. **PDPA compliance:**
   - Children's data handling appropriate
   - No PII in logs or error messages
   - Privacy policy page exists and is accurate

6. **Report** findings with severity ratings
