[![CI](https://github.com/weareopensource/Vue/actions/workflows/CI.yml/badge.svg)](https://github.com/weareopensource/Vue/actions/workflows/CI.yml) [![Code Climate](https://badges.weareopensource.me/codeclimate/maintainability-percentage/weareopensource/Vue.svg?style=flat-square)](https://codeclimate.com/github/weareopensource/Vue/maintainability)
[![Dependabot badge](https://badges.weareopensource.me/badge/Dependabot-enabled-2768cf.svg?style=flat-square)](https://dependabot.com)
[![Known Vulnerabilities](https://snyk.io/test/github/weareopensource/vue/badge.svg?style=flat-square)](https://snyk.io/test/github/weareopensource/vue) [![Docker Pulls](https://badges.weareopensource.me/docker/pulls/pierrebrisorgueil/vue?style=flat-square)](https://hub.docker.com/repository/docker/pierrebrisorgueil/vue)

# :globe_with_meridians: [WeAreOpenSource](https://weareopensource.me) Vue 3 - Beta

## :book: Presentation

This project is a Vue 3 stack that can be ran as a standalone FrontEnd. Or in a fullstack with another repo of your choice (ex: [Node](https://github.com/weareopensource/Node), [Swift](https://github.com/weareopensource/Swift)).

Quick links :

- [Mindset and what we would like to create](https://weareopensource.me/)
- [How to start a project and maintain updates from stacks](https://blog.weareopensource.me/start-a-project-and-maintain-updates/)
- [Global roadmap and ideas about stacks](https://github.com/orgs/weareopensource/projects/3)
- [How to contribute and help us](https://blog.weareopensource.me/how-to-contribute/)

Our stack Vue is actually in Beta.

# :computer: Vue 3 / Vuetify 3 / Vite / Jwt

> **⚡ Now powered by Vite!** This project has been migrated from Vue CLI to Vite for faster development and better performance.

- [**Knowledges JS**](https://blog.weareopensource.me/js-knwoledges/)
- [**Demo**](https://vue.weareopensource.me) (working with [Node](https://github.com/weareopensource/Node) stack, email: *test@waos.me*, password: _TestWaos@2019_)

## :package: Technology Overview

| Subject            | Informations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Available**      |
| Architecture       | Layered Architecture : everything is separated in layers, and the upper layers are abstractions of the lower ones, that's why every layer should only reference the immediate lower layer (vertical modules architecture)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Security           | JWT Stateless - have a look on [Node](https://github.com/weareopensource/Node) stack for more informations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| CI                 | [Github Action](https://github.com/weareopensource/Vue/actions)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Linter             | [ESLint](https://github.com/eslint/eslint) ecmaVersion 10 (2019)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Developer          | [Coveralls](https://coveralls.io/github/weareopensource/Vue) - [Code Climate](https://codeclimate.com/github/weareopensource/Vue) - [Dependency status](https://david-dm.org/weareopensource/vue) - [Dependabot](https://dependabot.com/) - [Snyk](https://snyk.io/test/github/weareopensource/vue) <br> [semantic-release](https://github.com/semantic-release/semantic-release) - [commitlint](https://github.com/conventional-changelog/commitlint) - [commitizen](https://github.com/commitizen/cz-cli) - [@weareopensource/conventional-changelog](https://github.com/weareopensource/conventional-changelog) |
| Dependencies       | [npm](https://www.npmjs.com)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Deliver            | Docker & Docker-compose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Being released** |
| Testing            | [Jest](https://github.com/facebook/jest) WIP                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **In reflexion**   |
| WIP                | wip                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

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
git clone https://github.com/weareopensource/vue.git && cd Vue
npm install
```

**Note:** No need for global CLI tools - everything runs through Vite!

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
npm run check:migration                           # Check Vite migration status
```

### Vite Direct Commands

```bash
npm run vite:dev          # Vite dev (bypasses config generation)
npm run vite:build        # Vite build (bypasses config generation)
npm run vite:preview      # Vite preview (bypasses config generation)
```

## :whale: Docker Way

### docker

- `docker run --rm -p 8080:80 weareopensource/vue`

if you want to build yourself : `docker build -t weareopensource/vue .` _--build-arg WAOS_VUE_api_port=4000_

### docker-compose (example with [Node](https://github.com/weareopensource/Node) stack as api)

- `docker-compose up`

### Configuration

The default configuration is : `src/config/defaults/development.js`
The other configurations : `src/config/defaults/*.js` overwrite the default configuration, you can create your own.

We take into account all system environment variables defined under the form WAOS*VUE*<path_toVariable>. A pre-build npm script turns under the hood those system environment variables into an object, infering paths from the varialbles name, merged to the configuration defined on `src/config/defaults` to regenerate the file used `src/config/index.js`.

So configuration avalable on `src/config/defaults/development` file are overidable. You can for instance define the app name by defining those system environment variables :

```
WAOS_VUE_app_title='my app =)'
```

## :pencil2: [Contribute](https://blog.weareopensource.me/how-to-contribute/)

## :scroll: History

This work is based on [MEAN.js](http://meanjs.org) and more precisely on a fork of the developers named [Riess.js](https://github.com/lirantal/Riess.js). The work being stopped we wished to take it back, we want to create updated stack with same mindset "simple", "easy to use". The toolbox needed to start projects, but not only with Node and Angular ...

## :globe_with_meridians: [We Are Open Source, Who we are ?](https://weareopensource.me)

We dreams to create stacks Backs / Fronts, aligns on feats & Architecture, in multiple languages. This to allow anyone to create fullstack on demand (VueJS, Node, Swift …) and keep updates. While exploring resilient and scalable deployment, as well as growth hacking via our articles.

Feel free to help us ! :)

## :clipboard: Licence

[![Packagist](https://badges.weareopensource.me/packagist/l/doctrine/orm.svg?style=flat-square)](/LICENSE.md)

## :link: Links

[![Blog](https://badges.weareopensource.me/badge/Read-our%20Blog-1abc9c.svg?style=flat-square)](https://blog.weareopensource.me) [![Slack](https://badges.weareopensource.me/badge/Chat-on%20our%20Slack-d0355b.svg?style=flat-square)](https://join.slack.com/t/weareopensource/shared_invite/zt-62p1qxna-PEQn289qx6mmHobzKW8QFw) [![Discord](https://badges.weareopensource.me/badge/Chat-on%20our%20Discord-516DB9.svg?style=flat-square)](https://discord.gg/U2a2vVm) [![Mail](https://badges.weareopensource.me/badge/Contact-us%20by%20mail-00a8ff.svg?style=flat-square)](mailto:brisorgueilp@gmail.com?subject=Contact)
