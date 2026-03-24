# /deploy — Pre-deploy Checklist & Push

When the user runs `/deploy`, execute this workflow:

1. **Pre-deploy checklist:**
   - [ ] No .env or secrets in staged files
   - [ ] No console.log statements left in production code
   - [ ] All async functions have error handling
   - [ ] CSS uses variables, no hardcoded hex values
   - [ ] Mobile-responsive (check key pages)
   - [ ] No innerHTML with user-supplied content
2. **Run security check** — scan for exposed keys/tokens
3. **Stage and commit** with descriptive message
4. **Push to main** — triggers Vercel auto-deploy
5. **Post-deploy note:**
   - Live in ~60 seconds at https://www.superholiclab.com
   - Check Vercel dashboard for deploy status
   - Verify key pages load correctly
