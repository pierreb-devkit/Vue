# Devkit Vue Stack - Claude Code Setup

This repository is the Vue 3 stack from Devkit. It can run as a standalone frontend or as part of a fullstack setup with companion stacks such as Node or Swift.

It is designed to be cloned into downstream projects and kept up-to-date through upstream merges.

## How to use Claude Code here

Source of truth: `README.md` + `package.json` scripts.

The `.claude/` folder contains embedded settings, skills, and agents that are available immediately after cloning.

## Canonical commands

| Command          | Script                   | Description                                  |
| ---------------- | ------------------------ | -------------------------------------------- |
| **Dev**          | `npm run dev`            | Start dev server at `http://localhost:8080/` |
| **Dev (alias)**  | `npm start`              | Alias for `npm run dev`                      |
| **Build**        | `npm run build`          | Build for production                         |
| **Preview**      | `npm run preview`        | Preview production build locally             |
| **Test**         | `npm test`               | Run tests in watch mode                      |
| **Test watch**   | `npm run test:watch`     | Run tests in watch mode (explicit alias)     |
| **Unit test**    | `npm run test:unit`      | Run unit tests once (one-shot)               |
| **Coverage**     | `npm run test:coverage`  | Generate test coverage                       |
| **Lint**         | `npm run lint`           | Check code quality                           |
| **Lint fix**     | `npm run lint:fix`       | Auto-fix linting issues                      |
| **Format**       | `npm run format`         | Format with Prettier                         |
| **Config**       | `npm run generateConfig` | Generate config from env vars                |
| **Migration**    | `npm run check:migration`| Check Vite migration compatibility           |
| **Commit**       | `npm run commit`         | Commit with commitizen                       |
| **Release (CI)** | `npm run release:auto`   | Semantic release for CI                      |
| **Docker**       | `docker-compose up`      | Start with docker-compose                    |

## Preflight

- Read `ERRORS.md` before proposing changes or code reviews
- If the AI makes a new recurring mistake, append one line to `ERRORS.md` using `[YYYY-MM-DD] <scope>: <wrong> -> <right>`

## Modularity rules

- Keep each module as independent as possible
- Avoid cross-module imports and coupling
- Keep config, routes, data-access, and business logic inside the module boundary
- Put shared code in `src/modules/core` only with explicit justification
- Keep tests organized per module: `src/modules/*/tests/`

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
| `/update-stack`  | Merge upstream stack updates into downstream projects |
| `/naming`        | Apply or audit naming conventions                     |
| `/pull-request`  | Full PR lifecycle: draft, CI, monitor loop, iterate   |

## Embedded agent

- `stack-maintainer` (`.claude/agents/stack-maintainer.md`): quick review guard for mergeability, security, and modularity.

## Stack merge workflow

```bash
git remote add devkit-vue https://github.com/pierreb-devkit/Vue.git
git fetch devkit-vue
git merge devkit-vue/master
```

Resolve conflicts carefully to preserve downstream customizations and keep future merges clean.

> Older changelog entries and some tooling references may still mention `weareopensource/Vue` or "WeAreOpenSource" — treat those as historical upstream references only.

## Definition of done

- `npm run lint` passes
- `npm run test:unit` passes
- `npm run build` passes
- Cross-module impact is documented and justified when present
