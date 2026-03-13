---
name: verify
description: Run quality loop (lint + test + build + UX audit) to verify code quality, correctness, and UI completeness. Use when asked to check, validate, test, lint, build, verify, or audit code/UI quality — or after making changes and before committing.
---

# Verify Skill

## Steps

1. **ERRORS.md scan** — check changed files against known wrong patterns.
   - Cross-module check: no store imports except `useAuthStore`/`useCoreStore` outside owning module

2. **Visual check** — for new/changed UI, take screenshots (desktop + mobile, light + dark) per `/frontend` verification guidelines.

3. **UX completeness check** — for each new/changed component or view:
   - Every action shows user feedback? (no silent catches)
   - Destructive actions behind confirmation dialogs?
   - Responsive at mobile breakpoint? (flex, hidden columns)
   - Dialogs use `max-width="440"`?
   - Forms with dirty flag have `beforeRouteLeave` guard?

4. **Lint** — `npm run lint`

5. **Tests** — check if Node API is reachable (`curl -s http://localhost:3000/api/home`):
   - **Infra up** → `npm run test:all` (unit + E2E)
   - **Infra down** → `npm test` (unit only) + warn: "E2E skipped — run `docker compose -f docker-compose.test.yml up -d` for full coverage"

6. **Build** — `npm run build`

7. **Summary:** ✅ All passed → ready to commit | ❌ Failed → show failures, suggest fix