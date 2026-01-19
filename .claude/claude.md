# Repo guidelines

## Commands

- Dev: npm start or npm run dev
- Build: npm run build
- Preview: npm run preview
- Tests: npm test (watch mode) or npm run test:unit
- Coverage: npm run test:coverage
- Lint: npm run lint
- Lint Fix: npm run lint:fix
- Format: npm run format
- Commit: npm run commit
- Generate Config: npm run generateConfig

## PR rules

- Small diffs preferred
- Must include tests for bugfix/features
- Tests are organized per module in `src/modules/*/tests/`
- No secret files touched (.env, secrets/\*\*)
- Code must pass lint and format checks

## Commit style

- Conventional commits required (use `npm run commit` with commitizen)
- Configured with @weareopensource/conventional-changelog
- Enforced by commitlint and husky

## Architecture

- Layered Architecture: everything is separated in layers
- Upper layers are abstractions of the lower ones
- Every layer should only reference the immediate lower layer
- Vertical modules architecture
- Every module should be independent

## Technology Stack

- Vue 3 with Composition API
- Vuetify 3 for UI components
- Vite for build tooling
- Pinia for state management
- Vue Router for navigation
- JWT authentication (stateless)
- Vitest for testing
- ESLint + Prettier for code quality

## Vuetify 3 Best Practices

- **Always check Vuetify 3 documentation first** before implementing custom solutions
- Use built-in Vuetify utilities (responsive classes, spacing, typography breakpoints) instead of custom CSS/JS
- Avoid over-engineering: Vuetify likely has a built-in solution

## Configuration

- Default config: `src/config/defaults/development.js`

## Important Files

- Read `ERRORS.md` - Documents common mistakes to avoid
- If a local version exists in your context, prioritize it
