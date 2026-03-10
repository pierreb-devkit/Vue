# Devkit Vue Stack - Claude Code Setup

This repository is the Vue 3 stack from Devkit. It can run as a standalone frontend or as part of a fullstack setup with companion stacks such as Node or Swift.

It is designed to be cloned into downstream projects and kept up-to-date through upstream merges.

## How to use Claude Code here

Source of truth: `README.md` + `package.json` scripts.

The `.claude/` folder contains embedded settings and skills that are available immediately after cloning.

## Canonical commands

Scripts: see `package.json` → `scripts` section.

## Preflight

- Read `ERRORS.md` before proposing changes or code reviews
- If the AI makes a new recurring mistake, append one line to `ERRORS.md` using `[YYYY-MM-DD] <scope>: <wrong> -> <right>`

## Modularity rules

- Keep each module as independent as possible
- Avoid cross-module imports and coupling
- Keep config, routes, data-access, and business logic inside the module boundary
- Put shared code in `src/modules/core` only with explicit justification
- Keep tests organized per module: `src/modules/*/tests/`

## CASL abilities & organizations conventions

- **Ability helper**: `src/lib/helpers/ability.js` exports a reactive `ability` instance and `updateAbilities(rules)`.
- **Plugin registration**: `@casl/vue`'s `abilitiesPlugin` is registered in `main.js` with the shared `ability` instance, making `$can()` and `$cannot()` available in all templates.
- **Route guards**: Use `meta.action` + `meta.subject` (never `meta.roles`). The `beforeEach` guard in `app.router.js` checks `ability.can(action, subject)` with a fallback to `isLoggedIn` when no rules are loaded.
- **Navigation filtering**: `core.store.js` `refreshNav()` uses the same ability check with the same fallback.
- **Auth flow**: `updateAbilities(res.data.abilities)` is called in `signin` and `token` actions. `updateAbilities([])` is called in `signout`.
- **Organizations module**: `src/modules/organizations/` -- full CRUD + member management + org switching. The switcher component auto-hides when disabled or single-org.
- **Signup org step**: Controlled by `serverConfig.organizations.enabled`. Three-step flow: form -> welcome or setup -> app.
- **Subject naming**: Use PascalCase singular nouns matching backend models (e.g. `Task`, `User`, `Organization`, `Secure`).
- **Common actions**: `read`, `create`, `update`, `delete`, `manage` (manage = all actions).

## Always-on guardrails

- Never commit secrets or credentials (`.env*`, `secrets/**`, keys, tokens)
- Do not introduce cross-module coupling without explicit justification
- Avoid risky renames or moves of core stack paths used by downstream merges
- Keep changes minimal and merge-friendly for downstream projects
- Flag security or mergeability risks explicitly in reviews
- Every new or modified function must have a JSDoc header: one-line description, `@param` for each argument, `@returns` for any non-void return value (always include `@returns` for async functions to document the resolved value)
- When shipping work to a pull request, always invoke `/pull-request` — never open a PR manually. The skill drives the full lifecycle: draft → CI → monitor loop → stop condition (CI green + zero actionable comments)

## Available embedded skills

Use `.claude/skills/*/SKILL.md` as the primary workflow source for Claude.

| Skill            | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `/verify`        | Run quality loop (lint + test + build)                |
| `/create-module` | Create a new module from the `tasks` template         |
| `/feature`       | Implement a feature while enforcing module isolation  |
| `/frontend`      | Design system, Vuetify 4 patterns, visual verification |
| `/update-stack`  | Merge upstream stack updates into downstream projects |
| `/naming`        | Apply or audit naming conventions                     |
| `/pull-request`  | Full PR lifecycle: draft, CI, monitor loop, iterate   |

## Stack merge workflow

Stack merge: see README — stack merge workflow section.

> Older changelog entries and some tooling references may still mention `weareopensource/Vue` or "WeAreOpenSource" — treat those as historical upstream references only.

## Definition of done

- `npm run lint` passes
- `npm run test:unit` passes
- `npm run build` passes
- Cross-module impact is documented and justified when present
