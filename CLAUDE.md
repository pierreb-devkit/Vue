# Devkit Vue Stack - Claude Code Setup

Vue 3 + Vuetify 4 stack from Devkit. Standalone frontend or fullstack with Node/Swift. Cloned into downstream projects, kept up-to-date via upstream merges.

## Quick start

- Source of truth: `README.md` + `package.json` scripts
- `.claude/` contains embedded settings and skills
- Read `ERRORS.md` before proposing changes — append new mistakes as `[YYYY-MM-DD] <scope>: <wrong> -> <right>`

## Architecture

- Layered: **UI → Store → API**. Each layer references only the one below.
- Modules are independent — no cross-module imports without justification.
- Shared code in `src/modules/core` only with justification.
- Modularity, UI rules, and definition of done → see `/feature`

## CASL abilities & organizations

- **Ability helper**: `src/lib/helpers/ability.js` exports reactive `ability` + `updateAbilities(rules)`.
- **Plugin**: `@casl/vue` `abilitiesPlugin` registered in `main.js` — `$can()` / `$cannot()` in templates.
- **Route guards**: `meta.action` + `meta.subject` (never `meta.roles`). Guard checks `ability.can()` with `isLoggedIn` fallback.
- **Navigation**: `core.store.js` `refreshNav()` uses same ability check.
- **Auth flow**: `updateAbilities(res.data.abilities)` on signin/token, `updateAbilities([])` on signout.
- **Organizations**: `src/modules/organizations/` — CRUD + members + switching. Switcher auto-hides when disabled or single-org.
- **Signup org step**: Controlled by `serverConfig.organizations.enabled`. Three-step: form → setup → app.
- **Subjects**: PascalCase singular nouns matching backend models (`Task`, `Organization`).
- **Actions**: `read`, `create`, `update`, `delete`, `manage` (= all).

## Testing conventions

| Script               | Command                   | Description                                  |
| -------------------- | ------------------------- | -------------------------------------------- |
| `npm run dev`        | `vite`                    | Start dev server with HMR                    |
| `npm start`          | `npm run dev`             | Alias for dev                                |
| `npm test`           | `vitest run`              | Unit tests only (no infra needed)            |
| `npm run test:all`   | `vitest run` + Playwright | All tests (unit + E2E, needs Node + MongoDB) |
| `npm run test:unit`  | `vitest run`              | Same as `npm test`                           |
| `npm run test:watch` | `vitest`                  | Unit tests in watch mode                     |
| `npm run test:e2e`   | `npx playwright test`     | E2E tests only (needs Node + MongoDB)        |

- Every new feature needs unit tests (store + component if applicable)
- E2E only for critical product flows (auth, org onboarding, invite/join); requires Node + Vue + MongoDB running
- Docker (mongo + node-api): `docker compose -f docker-compose.test.yml up -d`

## Guardrails

- Never commit secrets (`.env*`, keys, tokens)
- No cross-module coupling without justification
- Keep changes minimal and merge-friendly for downstream
- Every function: JSDoc header (`@param`, `@returns`)
- PRs: always use `/pull-request` — never open manually
- After user correction, evaluate if the pattern belongs in ERRORS.md

## Workflow rules

- **Never push directly to master/main.** Always create a branch, push, create a PR, wait for CI green + review, then merge.
- **Never lower coverage thresholds** in `vitest.config.js`. If coverage drops after adding code, write tests for the new project modules to bring it back above thresholds.
- **Audit existing modules before implementing.** Before creating new storage, utilities, or components, check `src/modules/` for existing solutions.
- **Always run `/verify` after any code change** before declaring done. CI must be green.

## Skills

| Skill            | Description                                                            |
| ---------------- | ---------------------------------------------------------------------- |
| `/feature`       | Scope analysis → implement → DOD (includes `/create-module` if needed) |
| `/verify`        | Lint + tests + build + UX audit                                        |
| `/ui`            | Design system, Vuetify 4 patterns, visual verification                 |
| `/naming`        | File and folder naming conventions                                     |
| `/pull-request`  | Full PR lifecycle: draft → CI → monitor → iterate                      |
| `/update-stack`  | Merge upstream stack updates                                           |
| `/create-module` | Scaffold new module from `tasks` template                              |

> Historical: older references to `weareopensource/Vue` or "WeAreOpenSource" are upstream legacy — ignore.
