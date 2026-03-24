# Testing — Superholic Lab

## Manual Verification Protocol

Since this is a vanilla JS project without a test framework (yet),
every code change must include manual verification steps.

### After Every Code Change

1. Add `// TEST:` comment at end of file explaining how to verify
2. Test in browser — check both desktop and mobile views
3. Test error states (disconnect network, invalid input)
4. Verify Supabase data is correct after operations
5. Check browser console for errors

### Quiz Engine Testing

- Start quiz → answer correctly → verify score updates
- Answer incorrectly → verify wrong-answer explanation shows
- Complete quiz → verify results saved to Supabase
- Check question randomization works
- Verify difficulty badge displays correctly

### Auth Testing

- Sign up with valid email → verify profile created in Supabase
- Sign in → verify session persists across page navigation
- Sign out → verify redirect to login page
- Access protected page without auth → verify redirect
- Test with expired session

### Payment Testing

- Use Stripe test card: 4242 4242 4242 4242
- Complete checkout → verify subscription in Supabase
- Check paywall blocks free users correctly
- Test subscription cancellation webhook

### Content Testing

- Every new question reviewed against MOE syllabus
- Wrong-answer explanations address the specific mistake
- Worked solutions are step-by-step, not just final answer
- Difficulty labels match actual question complexity
