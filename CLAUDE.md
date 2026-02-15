# WeAreOpenSource Vue Stack - Claude Code Setup

This is the **Vue 3 stack** from WeAreOpenSource. It's designed to be cloned into downstream projects and kept up-to-date via `git merge` from the stack repo.

## How to use Claude Code here

Source of truth: **README.md** + **package.json scripts**

The `.claude/` folder contains repo-embedded settings and skills that work immediately after cloning.

## Canonical commands

| Command      | Script                       | Description                               |
| ------------ | ---------------------------- | ----------------------------------------- |
| **Dev**      | `npm start` or `npm run dev` | Start dev server (http://localhost:8080/) |
| **Build**    | `npm run build`              | Build for production                      |
| **Preview**  | `npm run preview`            | Preview production build                  |
| **Test**     | `npm test`                   | Run tests in watch mode                   |
| **Test**     | `npm run test:unit`          | Run unit tests once                       |
| **Coverage** | `npm run test:coverage`      | Generate test coverage                    |
| **Lint**     | `npm run lint`               | Check code quality                        |
| **Lint fix** | `npm run lint:fix`           | Auto-fix linting issues                   |
| **Format**   | `npm run format`             | Format with Prettier                      |
| **Config**   | `npm run generateConfig`     | Generate config from env vars             |
| **Commit**   | `npm run commit`             | Commit with commitizen                    |
| **Docker**   | `docker-compose up`          | Start with docker-compose                 |

## Modularity rules (important)

- Each module should be as **independent** as possible
- Avoid cross-module imports/coupling
- If shared code is needed, use `src/modules/core` or a small shared layer with **explicit justification**
- Keep config, routes, data-access, and business logic **inside the module boundary**
- If a feature touches multiple modules, explain why and minimize surface area
- Tests are organized per module: `src/modules/*/tests/`

## Available Skills

The repo includes these embedded skills (use with `/skill-name`):

| Skill            | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `/verify`        | Run quality loop (lint + test + build)                |
| `/dev`           | Start dev server with hot-reload                      |
| `/config`        | Generate config from environment variables            |
| `/docker`        | Start and manage docker-compose services              |
| `/create-module` | Create new module by duplicating the `tasks` template |
| `/feature`       | Implement feature following modularity rules          |
| `/update-stack`  | Merge stack updates into downstream projects          |
| `/naming`        | Check or apply file and folder naming conventions     |

**Agent:** The repo includes a `stack-maintainer` agent that reviews changes for security and mergeability.

## Popular optional plugins

These plugins are optional and must be installed manually:

```bash
npx claude-plugins install @anthropics/claude-code-plugins/feature-dev
npx claude-plugins install @anthropics/claude-code-plugins/code-review
npx claude-plugins install @anthropics/claude-code-plugins/frontend-design
```

## Stack merge workflow

Downstream projects merge stack updates via:

```bash
git remote add vue-stack https://github.com/weareopensource/Vue.git
git fetch vue-stack
git merge vue-stack/master
```

Handle conflicts carefully to preserve mergeability. See `/update-stack` skill for details.
