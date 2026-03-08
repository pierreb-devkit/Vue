[![CI](https://github.com/pierreb-devkit/Vue/actions/workflows/CI.yml/badge.svg)](https://github.com/pierreb-devkit/Vue/actions/workflows/CI.yml)
[![codecov](https://codecov.io/gh/pierreb-devkit/Vue/graph/badge.svg?token=52DYZF1BII)](https://codecov.io/gh/pierreb-devkit/Vue)
[![Dependabot badge](https://img.shields.io/badge/Dependabot-enabled-2768cf.svg?style=flat-square)](https://dependabot.com)
[![Known Vulnerabilities](https://snyk.io/test/github/pierreb-devkit/vue/badge.svg?style=flat-square)](https://snyk.io/test/github/pierreb-devkit/vue)

# :globe_with_meridians: [Devkit](https://github.com/pierreb-devkit) Vue 3

## :book: Presentation

A Vue 3 / Vuetify 3 / Vite / JWT stack that can be run as a standalone frontend or in a fullstack setup with another repo (ex: [Node](https://github.com/pierreb-devkit/Node), [Swift](https://github.com/pierreb-devkit/Swift)).

Designed to be cloned into downstream projects and kept up-to-date via `git merge` from the stack repo.

## :package: Technology Overview

| Subject      | Informations                                                                                                                                                                                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture | Layered Architecture : everything is separated in layers, and the upper layers are abstractions of the lower ones, that's why every layer should only reference the immediate lower layer (vertical modules architecture)                                                                                   |
| Security     | JWT Stateless - take a look at the [Node](https://github.com/pierreb-devkit/Node) stack for more information                                                                                                                                                                                                  |
| CI           | [GitHub Actions](https://github.com/pierreb-devkit/Vue/actions)                                                                                                                                                                                                                                             |
| Linter       | [ESLint](https://github.com/eslint/eslint) ecmaVersion 10 (2019)                                                                                                                                                                                                                                           |
| Developer    | [Dependabot](https://dependabot.com/) - [Snyk](https://snyk.io/test/github/pierreb-devkit/vue) <br> [semantic-release](https://github.com/semantic-release/semantic-release) - [commitlint](https://github.com/conventional-changelog/commitlint) - [commitizen](https://github.com/commitizen/cz-cli) |
| Dependencies | [npm](https://www.npmjs.com)                                                                                                                                                                                                                                                                               |
| Deliver      | Docker & Docker-compose                                                                                                                                                                                                                                                                                     |

## :tada: Features Overview

### Core

- **User** : classic register / auth

### Examples

- **Tasks** : list - add - edit - delete
- **Mails Subscriptions** : add

## :pushpin: Prerequisites

- Git - [Download & Install Git](https://git-scm.com/downloads)
- Node.js (22.x or 24.x) - [Download & Install Node.js](https://nodejs.org/en/download/)
  - Recommended: Use [nvm](https://github.com/nvm-sh/nvm) for Node version management

## :boom: Installation

```bash
git clone https://github.com/pierreb-devkit/Vue.git && cd Vue
npm install
```

## :runner: Running Your Application

### Development

```bash
npm run dev   # or: npm start
```

Runs dev server with hot-reload at `http://localhost:8080/`

**CORS Note:** When connecting to the Node stack, ensure CORS is configured:

```bash
WAOS_NODE_cors_origin=['http://localhost:8080'] npm start
```

### Production

```bash
npm run build      # Build for production
npm run preview    # Preview production build locally
```

### Testing

```bash
npm test                  # Run tests in watch mode
npm run test:watch        # Run tests in watch mode (explicit alias)
npm run test:unit         # Run unit tests once (one-shot)
npm run test:coverage     # Generate coverage report
```

Tests are organized per module in `src/modules/*/tests/`

### Code Quality

```bash
npm run lint              # Check code quality
npm run lint:fix          # Auto-fix linting issues
npm run format            # Format code with Prettier
```

### Commits & Releases

```bash
npm run commit                                    # Commit with commitizen
npm run release -- --first-release                # First release (standard-version)
npm run release -- --release-as 1.1.1             # Release specific version
GITHUB_TOKEN=xxx npm run release:auto             # Semantic release (CI)
```

## :wrench: Configuration

Configuration is split between a **global** file and **per-module** files, then merged at build time into a single `src/config/index.js`.

### File layout

```text
src/config/defaults/
  config.development.js          ← global defaults (app, api, port, cookie, analytics, whitelists)
  config.production.js           ← production overrides
  config.test.js                 ← test overrides

src/modules/<name>/config/
  config.development.js          ← module defaults (e.g. vuetify, header, footer, sign, oAuth, home)
  config.<env>.js                ← module env overrides (optional)
```

### Merge order (priority ascending)

| Layer | Source | Example |
|-------|--------|---------|
| 1 | Module development defaults | `modules/*/config/config.development.js` |
| 2 | Global development defaults | `config/defaults/config.development.js` |
| 3 | Module env overrides | `modules/*/config/config.production.js` |
| 4 | Global env overrides | `config/defaults/config.production.js` |
| 5 | `DEVKIT_VUE_*` env vars | `DEVKIT_VUE_app_title='my app'` |

Layers 3–4 are only applied when `NODE_ENV` is not `development`.

### Merge semantics

- **Objects** are merged recursively — keys from higher layers override lower layers, unmentioned keys are preserved.
- **Arrays are replaced entirely** — a higher-priority layer defining a 2-item array replaces a 4-item array from a lower layer. Items are never merged by index.
- **`undefined` values** are skipped — they do not overwrite existing keys.

### Environment variables

```bash
DEVKIT_VUE_app_title='my app'        # sets config.app.title
DEVKIT_VUE_api_port=4000             # sets config.api.port
```

The merged result is written to `src/config/index.js` via `npm run generateConfig`.

## :whale: Docker

```bash
docker run --rm -p 8080:80 pierreb/vue
```

Build yourself:

```bash
docker build -t pierreb/vue . --build-arg DEVKIT_VUE_api_port=4000
```

With [Node](https://github.com/pierreb-devkit/Node) stack as API:

```bash
docker-compose up
```

## :robot: AI Setup

This stack ships preconfigured instruction and prompt files for Claude Code, GitHub Copilot, and OpenAI Codex. Each tool requires its own client installation and authentication — the repository provides the configuration so it works out-of-the-box once the tool is set up.

| Tool              | Config                                                              |
| ----------------- | ------------------------------------------------------------------- |
| Claude Code       | `.claude/` — skills embedded, works on clone                        |
| GitHub Copilot    | `.github/copilot-instructions.md` + `.github/prompts/`              |
| OpenAI Codex      | `AGENTS.md`                                                         |

### Claude Code — Available Skills

Skills available via `/verify`, `/feature`, `/create-module`, `/update-stack`, `/naming`, `/pull-request` — see `.claude/skills/` for details.

### Stack Merge Workflow

```bash
git remote add devkit-vue https://github.com/pierreb-devkit/Vue.git
git fetch devkit-vue
git merge devkit-vue/master
```

> Caution: resolve conflicts manually to preserve downstream customizations before pushing.

## :pencil2: Contribute

Open issues and pull requests on [GitHub](https://github.com/pierreb-devkit/Vue).

## :scroll: History

This work is based on [MEAN.js](http://meanjs.org) and more precisely on a fork named [Riess.js](https://github.com/lirantal/Riess.js). The goal is a simple, easy-to-use toolbox to start and maintain fullstack projects across multiple languages (Vue, Node, Swift ...).

## :clipboard: Licence

[![License](https://img.shields.io/packagist/l/doctrine/orm.svg?style=flat-square)](/LICENSE.md)

## :link: Links

[![Mail](https://img.shields.io/badge/Contact-us%20by%20mail-00a8ff.svg?style=flat-square)](mailto:brisorgueilp@gmail.com?subject=Contact)
