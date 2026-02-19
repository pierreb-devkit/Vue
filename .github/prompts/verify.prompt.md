# Verify

Read `ERRORS.md` first and avoid repeating listed mistakes.

Run the quality loop and report results.

## Steps

1. `npm run lint` — check code quality
2. `npm run test:unit` — run unit tests
3. `npm run build` — verify production build

## Report

- Pass/fail for each step
- Failing command output highlights
- Next action to unblock

## Notes

- Does not run tests in watch mode (`npm test` for that)
- Does not run coverage (`npm run test:coverage` for that)
- Does not commit or push changes
