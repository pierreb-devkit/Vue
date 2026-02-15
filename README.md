[![CI](https://github.com/pierreb-devkit/Vue/actions/workflows/CI.yml/badge.svg)](https://github.com/pierreb-devkit/Vue/actions/workflows/CI.yml) [![Code Climate](https://img.shields.io/codeclimate/maintainability/pierreb-devkit/Vue?style=flat-square)](https://codeclimate.com/github/pierreb-devkit/Vue/maintainability)
[![Dependabot badge](https://img.shields.io/badge/Dependabot-enabled-2768cf.svg?style=flat-square)](https://dependabot.com)
[![Known Vulnerabilities](https://snyk.io/test/github/pierreb-devkit/vue/badge.svg?style=flat-square)](https://snyk.io/test/github/pierreb-devkit/vue) [![Docker Pulls](https://img.shields.io/docker/pulls/pierrebrisorgueil/vue?style=flat-square)](https://hub.docker.com/repository/docker/pierrebrisorgueil/vue)

# :globe_with_meridians: [Devkit](https://github.com/pierreb-devkit) Vue 3

## :book: Presentation

This project is a Vue 3 stack that can be ran as a standalone FrontEnd. Or in a fullstack with another repo of your choice (ex: [Node](https://github.com/pierreb-devkit/Node)).

This stack is designed to be cloned into downstream projects and kept up-to-date via `git merge` from the stack repo.

## :computer: Vue 3 / Vuetify 3 / Vite / Jwt

> **⚡ Powered by Vite!** Faster development and better performance with hot-reload.

## :package: Technology Overview

| Subject            | Informations                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Available**      |
| Architecture       | Layered Architecture : everything is separated in layers, and the upper layers are abstractions of the lower ones, that's why every layer should only reference the immediate lower layer (vertical modules architecture)                                                                                                                                                                                    |
| Security           | JWT Stateless - have a look on [Node](https://github.com/pierreb-devkit/Node) stack for more informations                                                                                                                                                                                                                                                                                                   |
| CI                 | [Github Action](https://github.com/pierreb-devkit/Vue/actions)                                                                                                                                                                                                                                                                                                                                              |
| Linter             | [ESLint](https://github.com/eslint/eslint) ecmaVersion 10 (2019)                                                                                                                                                                                                                                                                                                                                            |
| Developer          | [Code Climate](https://codeclimate.com/github/pierreb-devkit/Vue) - [Dependabot](https://dependabot.com/) - [Snyk](https://snyk.io/test/github/pierreb-devkit/vue) <br> [semantic-release](https://github.com/semantic-release/semantic-release) - [commitlint](https://github.com/conventional-changelog/commitlint) - [commitizen](https://github.com/commitizen/cz-cli) |
| Dependencies       | [npm](https://www.npmjs.com)                                                                                                                                                                                                                                                                                                                                                                                |
| Deliver            | Docker & Docker-compose                                                                                                                                                                                                                                                                                                                                                                                     |
| **Being released** |
| Testing            | [Vitest](https://vitest.dev/) WIP                                                                                                                                                                                                                                                                                                                                                                           |

## :tada: Features Overview

### Core

- **User** : classic register / auth

### Examples

- **Tasks** : list - add - edit - delete
- **Mails Subscriptions** : add

## :pushpin: Prerequisites

Make sure you have installed all of the following prerequisites on your development machine:

- Git - [Download & Install Git](https://git-scm.com/downloads)
- Node.js (22.x or 24.x) - [Download & Install Node.js](https://nodejs.org/en/download/)
  - Recommended: Use [nvm](https://github.com/nvm-sh/nvm) for Node version management

## :boom: Installation

Simple and straightforward:

```bash
git clone https://github.com/pierreb-devkit/Vue.git && cd Vue
npm install
```

## :runner: Running Your Application

### Development

```bash
npm start
# or
npm run dev
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

**Test Structure:** Tests are organized per module in `src/modules/*/tests/`

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

### Configuration

```bash
npm run generateConfig                            # Generate config from environment
```

### Vite Direct Commands

```bash
npm run vite:dev          # Vite dev (bypasses config generation)
npm run vite:build        # Vite build (bypasses config generation)
npm run vite:preview      # Vite preview (bypasses config generation)
```

## :whale: Docker Way

### docker

- `docker run --rm -p 8080:80 pierrebrisorgueil/vue`

if you want to build yourself : `docker build -t pierrebrisorgueil/vue .` _--build-arg WAOS_VUE_api_port=4000_

### docker-compose (example with [Node](https://github.com/pierreb-devkit/Node) stack as api)

- `docker-compose up`

### Configuration

The default configuration is : `src/config/defaults/development.js`
The other configurations : `src/config/defaults/*.js` overwrite the default configuration, you can create your own.

We take into account all system environment variables defined under the form WAOS*VUE*<path_toVariable>. A pre-build npm script turns under the hood those system environment variables into an object, infering paths from the variables name, merged to the configuration defined on `src/config/defaults` to regenerate the file used `src/config/index.js`.

So configuration available on `src/config/defaults/development` file are overridable. You can for instance define the app name by defining those system environment variables :

```
WAOS_VUE_app_title='my app =)'
```

## :robot: Claude Code Setup

This stack ships with an embedded [Claude Code](https://claude.ai/claude-code) configuration in the `.claude/` folder — it works immediately after cloning with no additional setup.

### Available Skills

| Skill            | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `/verify`        | Run quality loop (lint + test + build)                |
| `/create-module` | Create new module by duplicating the `tasks` template |
| `/feature`       | Implement feature following modularity rules          |
| `/update-stack`  | Merge stack updates into downstream projects          |
| `/naming`        | Check or apply file and folder naming conventions     |

### Canonical Commands

| Command      | Script                       | Description                               |
| ------------ | ---------------------------- | ----------------------------------------- |
| **Dev**      | `npm start` or `npm run dev` | Start dev server (http://localhost:8080/) |
| **Build**    | `npm run build`              | Build for production                      |
| **Test**     | `npm run test:unit`          | Run unit tests once                       |
| **Coverage** | `npm run test:coverage`      | Generate test coverage                    |
| **Lint**     | `npm run lint`               | Check code quality                        |
| **Lint fix** | `npm run lint:fix`           | Auto-fix linting issues                   |
| **Format**   | `npm run format`             | Format with Prettier                      |
| **Commit**   | `npm run commit`             | Commit with commitizen                    |
| **Docker**   | `docker-compose up`          | Start with docker-compose                 |

### Modularity Rules

- Each module should be as **independent** as possible
- Avoid cross-module imports/coupling
- If shared code is needed, use `src/modules/core` or a small shared layer with **explicit justification**
- Keep config, routes, data-access, and business logic **inside the module boundary**
- Tests are organized per module: `src/modules/*/tests/`

### Stack Merge Workflow

Downstream projects can merge stack updates via:

```bash
git remote add devkit-vue https://github.com/pierreb-devkit/Vue.git
git fetch devkit-vue
git merge devkit-vue/master
```

## :pencil2: Contribute

Open issues and pull requests on [GitHub](https://github.com/pierreb-devkit/Vue).

## :scroll: History

This work is based on [MEAN.js](http://meanjs.org) and more precisely on a fork of the developers named [Riess.js](https://github.com/lirantal/Riess.js). The work being stopped we wished to take it back, we want to create updated stack with same mindset "simple", "easy to use". The toolbox needed to start projects across multiple languages (Vue, Node, Swift ...).

## :clipboard: Licence

[![License](https://img.shields.io/packagist/l/doctrine/orm.svg?style=flat-square)](/LICENSE.md)

## :link: Links

[![Mail](https://img.shields.io/badge/Contact-us%20by%20mail-00a8ff.svg?style=flat-square)](mailto:brisorgueilp@gmail.com?subject=Contact)
