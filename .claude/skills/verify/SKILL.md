---
name: verify
description: Run quality loop (audit + lint + tests + build) to verify code quality, correctness, and UI completeness. Use after making changes and before committing.
---

# Verify Skill

## Steps

1. **Diff audit** — review all changes (`git diff main...HEAD` or staged changes) using your knowledge of the stack:
   - Read `CLAUDE.md` and `ERRORS.md` for conventions, architecture, and known pitfalls
   - Read the `tasks` reference module structure for layer/naming conventions
   - Check `/frontend` skill for design system and Vuetify conventions
   - Analyze the diff: architecture, security, UX, logic, consistency, error handling
   - No hardcoded checklist — reason from context. Examples of what to catch:
     - Router guards with permissive matching (startsWith vs exact)
     - Silent error swallowing (catch without user feedback)
     - Store mutations from outside the store
     - Cross-module store imports (only `useAuthStore`/`useCoreStore` allowed)
     - Missing form validation or confirmation dialogs on destructive actions
     - Inconsistent selectors in E2E tests (prefer getByRole/getByPlaceholder)
     - Broken or nonexistent route references
   - Fix all issues found before proceeding

2. **Lint** — `npm run lint`

3. **Tests** — check if Node API is reachable (`curl -s http://localhost:3000/api/home`):
   - **Infra up** → `npm run test:all` (unit + E2E)
   - **Infra down** → `npm test` (unit only) + warn: "E2E skipped — run `docker compose -f docker-compose.test.yml up -d` for full coverage"

4. **Build** — `npm run build`

5. **Summary:** ✅ All passed → ready to commit | ❌ Failed → show failures, fix, re-run
