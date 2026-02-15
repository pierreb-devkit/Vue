[![CI](https://github.com/pierreb-devkit/Vue/actions/workflows/CI.yml/badge.svg)](https://github.com/pierreb-devkit/Vue/actions/workflows/CI.yml)
[![Dependabot badge](https://img.shields.io/badge/Dependabot-enabled-2768cf.svg?style=flat-square)](https://dependabot.com)
[![Known Vulnerabilities](https://snyk.io/test/github/pierreb-devkit/vue/badge.svg?style=flat-square)](https://snyk.io/test/github/pierreb-devkit/vue)

# :globe_with_meridians: [Devkit](https://github.com/pierreb-devkit) Vue 3

## :book: Presentation

A Vue 3 / Vuetify 3 / Vite / JWT stack that can run as a standalone frontend or in a fullstack setup with another repo (ex: [Node](https://github.com/pierreb-devkit/Node), [Swift](https://github.com/pierreb-devkit/Swift)).

Designed to be cloned into downstream projects and kept up-to-date via `git merge` from the stack repo.

## :package: Technology Overview

| Subject      | Informations                                                                                                                                                                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Architecture | Layered Architecture : everything is separated in layers, and the upper layers are abstractions of the lower ones, that's why every layer should only reference the immediate lower layer (vertical modules architecture)                                                                              |
| Security     | JWT Stateless - have a look on [Node](https://github.com/pierreb-devkit/Node) stack for more informations                                                                                                                                                                                              |
| CI           | [Github Action](https://github.com/pierreb-devkit/Vue/actions)                                                                                                                                                                                                                                         |
| Linter       | [ESLint](https://github.com/eslint/eslint) ecmaVersion 10 (2019)                                                                                                                                                                                                                                       |
| Developer    | [Dependabot](https://dependabot.com/) - [Snyk](https://snyk.io/test/github/pierreb-devkit/vue) <br> [semantic-release](https://github.com/semantic-release/semantic-release) - [commitlint](https://github.com/conventional-changelog/commitlint) - [commitizen](https://github.com/commitizen/cz-cli) |
| Dependencies | [npm](https://www.npmjs.com)                                                                                                                                                                                                                                                                           |
| Deliver      | Docker & Docker-compose                                                                                                                                                                                                                                                                                |

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
npm start        # or npm run dev
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
npm run test:unit         # Run unit tests
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
npm run release -- --first-release                # First release
npm run release -- --release-as 1.1.1             # Release specific version
GITHUB_TOKEN=xxx npm run release:auto             # Semantic release (CI)
```

## :wrench: Configuration

Configuration files live in `src/config/defaults/`. The `development.js` file is the base; other files in that folder override it.

At build time, environment variables prefixed with `WAOS_VUE_` are merged on top (`WAOS` is a legacy prefix kept for compatibility). The variable path maps directly to the config object key:

```bash
WAOS_VUE_app_title='my app'        # sets config.app.title
WAOS_VUE_api_port=4000             # sets config.api.port
```

The merged result is written to `src/config/index.js` via `npm run generateConfig`.

## :whale: Docker

```bash
docker run --rm -p 8080:80 pierreb/vue
```

Build yourself:

```bash
docker build -t pierreb/vue . --build-arg WAOS_VUE_api_port=4000
```

With [Node](https://github.com/pierreb-devkit/Node) stack as API:

```bash
docker-compose up
```

## :robot: Claude Code Setup

This stack ships with an embedded [Claude Code](https://claude.ai/claude-code) configuration in the `.claude/` folder — works immediately after cloning, no additional setup needed.

### Available Skills

| Skill            | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `/verify`        | Run quality loop (lint + test + build)                |
| `/create-module` | Create new module by duplicating the `tasks` template |
| `/feature`       | Implement feature following modularity rules          |
| `/update-stack`  | Merge stack updates into downstream projects          |
| `/naming`        | Check or apply file and folder naming conventions     |

### Modularity Rules

- Each module should be as **independent** as possible
- Avoid cross-module imports/coupling
- Shared code goes in `src/modules/core` with explicit justification
- Keep config, routes, data-access, and business logic **inside the module boundary**
- Tests are organized per module: `src/modules/*/tests/`

### Stack Merge Workflow

```bash
git remote add devkit-vue https://github.com/pierreb-devkit/Vue.git
git fetch devkit-vue
git merge devkit-vue/master
```

## :pencil2: Contribute

Open issues and pull requests on [GitHub](https://github.com/pierreb-devkit/Vue).

## :scroll: History

This work is based on [MEAN.js](http://meanjs.org) and more precisely on a fork named [Riess.js](https://github.com/lirantal/Riess.js). The goal is a simple, easy-to-use toolbox to start and maintain fullstack projects across multiple languages (Vue, Node, Swift ...).

## :clipboard: Licence

[![License](https://img.shields.io/packagist/l/doctrine/orm.svg?style=flat-square)](/LICENSE.md)

## :link: Links

[![Mail](https://img.shields.io/badge/Contact-us%20by%20mail-00a8ff.svg?style=flat-square)](mailto:brisorgueilp@gmail.com?subject=Contact)
