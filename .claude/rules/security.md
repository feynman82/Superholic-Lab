# Security Rules — Superholic Lab

## CRITICAL: This platform handles children's data (PDPA)

### Before EVERY Commit

- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated and sanitized
- [ ] No innerHTML with user-supplied content (XSS risk)
- [ ] SUPABASE_SERVICE_ROLE_KEY never in frontend JS
- [ ] STRIPE_SECRET_KEY never in frontend JS
- [ ] API keys read from process.env only
- [ ] Error messages don't leak sensitive data or stack traces

### Supabase Security

- RLS ENABLED on all 6 tables — verify before any schema change
- Users can only access their own data via RLS policies
- Service role key used only in `api/` serverless functions
- Never expose service role key to the browser

### Stripe Security

- Webhook handler verifies Stripe signature
- Never trust client-side price data — fetch from Stripe server-side
- Secret key used only in `api/checkout.js` and `api/webhook.js`

### Frontend Security

- Use textContent for user-generated content, never innerHTML
- Validate and sanitize URL parameters
- Escape special characters in user input
- No eval() or Function() with user data

### If Security Issue Found

1. STOP immediately
2. Fix the vulnerability before continuing
3. Rotate any exposed secrets
4. Check for similar issues across codebase
5. Add a regression test if applicable
