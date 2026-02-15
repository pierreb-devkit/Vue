---
name: verify
description: Run the quality loop (lint + test + build) to verify code quality and correctness. Use after making any code changes, before committing, or when asked to check/verify the project works.
---

# Verify Skill

Run lint → tests → build and report results.

## Steps

1. Run `npm run lint` to check code quality
2. Run `npm run test:unit` to run all unit tests
3. Run `npm run build` to verify the build succeeds
4. Summarize results:
   - ✅ All checks passed → ready to commit
   - ❌ Some checks failed → show what failed and suggest next action

## Notes

- Does not run tests in watch mode (use `npm test` manually for that)
- Does not run coverage (use `npm run test:coverage` manually for that)
- Does not commit or push changes
