# Verify Skill

Run the repository's quality loop to ensure code quality and correctness.

## What it does

1. Runs linting (`npm run lint`)
2. Runs tests (`npm run test:unit`)
3. Builds the project (`npm run build`)
4. Provides a summary of what passed/failed

## Usage

Invoke this skill after making changes to verify everything works correctly.

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
