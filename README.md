[![Build Status](https://badges.weareopensource.me/travis/weareopensource/Vue.svg?style=flat-square)](https://travis-ci.org/weareopensource/Vue) [![Drone](https://badges.weareopensource.me/drone/build/weareopensource/Vue?style=flat-square)](https://cloud.drone.io/weareopensource/Node) [![Code Climate](https://badges.weareopensource.me/codeclimate/maintainability-percentage/weareopensource/Vue.svg?style=flat-square)](https://codeclimate.com/github/weareopensource/Vue/maintainability)
  [![Dependabot badge](https://badges.weareopensource.me/badge/Dependabot-enabled-2768cf.svg?style=flat-square)](https://dependabot.com)
 [![Known Vulnerabilities](https://snyk.io/test/github/weareopensource/vue/badge.svg?style=flat-square)](https://snyk.io/test/github/weareopensource/vue) [![Docker Pulls](https://badges.weareopensource.me/docker/pulls/weareopensource/vue?style=flat-square)](https://hub.docker.com/repository/docker/weareopensource/vue)

# :globe_with_meridians: [WeAreOpenSource](https://weareopensource.me) Vue 4.x - Alpha

## :book: Presentation

This project is a Vue stack that can be ran as a standalone FrontEnd. Or in a fullstack with another repo of your choice (ex: [Node](https://github.com/weareopensource/Node), [Swift](https://github.com/weareopensource/Swift)).

Quick links :

* [Mindset and what we would like to create](https://weareopensource.me/)
* [How to start a project and maintain updates from stacks](https://blog.weareopensource.me/start-a-project-and-maintain-updates/)
* [Global roadmap and  ideas about stacks](https://github.com/orgs/weareopensource/projects/3)
* [How to contribute and help us](https://blog.weareopensource.me/how-to-contribute/)

Our stack Vue is actually in Alpha.

# :computer: Vue 4.x / Vuetify / Jwt

* [**Knowledges JS**](https://blog.weareopensource.me/js-knwoledges/)
* [**Demo**](https://vue.weareopensource.me) (working with [Node](https://github.com/weareopensource/Node) stack, email: *test@waos.me*, password: *TestWaos@2019*)

## :package: Technology Overview

| Subject | Informations
| ------- | --------
| **Available** |
| Architecture | Layered Architecture : everything is separated in layers, and the upper layers are abstractions of the lower ones, that's why every layer should only reference the immediate lower layer (vertical modules architecture)
| Security | JWT Stateless - have a look on [Node](https://github.com/weareopensource/Node) stack for more informations
| CI  | [Travis CI](https://travis-ci.org/weareopensource/Vue) - [Drone.io](https://cloud.drone.io/weareopensource/Vue)
| Linter  | [ESLint](https://github.com/eslint/eslint) ecmaVersion 10 (2019)
| Developer  | [Coveralls](https://coveralls.io/github/weareopensource/Vue) - [Code Climate](https://codeclimate.com/github/weareopensource/Vue) - [Dependency status](https://david-dm.org/weareopensource/vue) - [Dependabot](https://dependabot.com/) - [Snyk](https://snyk.io/test/github/weareopensource/vue) <br> [standard-version](https://github.com/conventional-changelog/standard-version) / [semantic-release](https://github.com/semantic-release/semantic-release) - [commitlint](https://github.com/conventional-changelog/commitlint) - [commitizen](https://github.com/commitizen/cz-cli) - [@weareopensource/conventional-changelog](https://github.com/weareopensource/conventional-changelog)
| Dependencies  | [npm](https://www.npmjs.com)
| Deliver | Docker & Docker-compose
| **Being released** |
| Testing |  [Jest](https://github.com/facebook/jest) WIP
| **In reflexion** |
| WIP  | wip

## :tada: Features Overview

### Core

* **User** : classic register / auth

### Examples

* **Tasks** : list - add - edit - delete
* **Mails Subscriptions** : add

## :pushpin: Prerequisites

Make sure you have installed all of the following prerequisites on your development machine:

* Git - [Download & Install Git](https://git-scm.com/downloads)
* Node.js (10.x) - [Download & Install Node.js](https://nodejs.org/en/download/)

## :boom: Installation

It's straightforward (you can use yarn if you want)

```bash
git clone https://github.com/weareopensource/vue.git && cd Vue
npm install -g @vue/cli@v4.0.0-rc.4
npm i
```

## :runner: Running Your Application

### Development

* `npm start` to run a dev server with hot-reloads. Available at `http://localhost:8080/`.

/!\ in order to launch Vue with our node stack, node need to accept CORS. You can specify it in config or like it `WAOS_NODE_cors_origin=['http://localhost:8080'] npm start` when you starting node.

### Production

* `npm run build` to build a prod server.

### others

* vue:serve : `npm vue:serve` -> be careful, this bypass config generation of the stack
* vue:build : `npm vue:build` -> be careful, this bypass config generation of the stack
* test : `npm test`
* test e2e : `npm run test:e2e`
* test unit : `npm run test:unit`
* lint : `npm run lint`
* commit : `npm run commit`
* release : `npm run release -- --first-release` **standard version, changelog, tag & choose version number : -- --release-as 1.1.1**
* release:auto : `GITHUB_TOKEN=XXXXX npm run release:auto` **semantic release, changelog, tag, release** *require repositoryUrl conf in package.json*
* generateConfig : `npm run generateConfig`

## :whale: Docker Way

### docker

* `docker run --rm -p 8080:80 weareopensource/vue`

if you want to build yourself : `docker build -t weareopensource/vue .` *--build-arg WAOS_VUE_api_port=4000*

### docker-compose (example with [Node](https://github.com/weareopensource/Node) stack as api)

* `docker-compose up`

### Configuration

The default configuration is : `src/config/defaults/development.js`
The other configurations : `src/config/defaults/*.js` overwrite the default configuration, you can create your own.

We take into account all system environment variables defined under the form WAOS_VUE_<path_toVariable>. A pre-build npm script turns under the hood those system environment variables into an object, infering paths from the varialbles name, merged to the configuration defined on `src/config/defaults` to regenerate the file used `src/config/index.js`.

So configuration avalable on `src/config/defaults/development` file are overidable. You can for instance define the app name by defining those system environment variables :

```
WAOS_VUE_app_title='my app =)'
```

## :pencil2: [Contribute](https://blog.weareopensource.me/how-to-contribute/)

## :scroll: History

This work is based on [MEAN.js](http://meanjs.org) and more precisely on a fork of the developers named [Riess.js](https://github.com/lirantal/Riess.js). The work being stopped we wished to take it back, we want to create updated stack with same mindset "simple", "easy to use". The toolbox needed to start projects, but not only with Node and Angular ...

## :globe_with_meridians: [We Are Open Source, Who we are ?](https://weareopensource.me)

We dreams to create stacks Backs / Fronts, aligns on feats & Architecture, in multiple languages. This to allow anyone to create fullstack on demand (VueJS, Node, Swift …) and keep updates. While exploring resilient and scalable deployment, as well as growth hacking via our articles.

## :clipboard: Licence

[![Packagist](https://badges.weareopensource.me/packagist/l/doctrine/orm.svg?style=flat-square)](/LICENSE.md)

## :family: Main Team

* Pierre Brisorgueil

[![Github](https://badges.weareopensource.me/badge/Follow-me%20on%20Github-282828.svg?style=flat-square)](https://github.com/PierreBrisorgueil) [![Twitter](https://badges.weareopensource.me/badge/Follow-me%20on%20Twitter-3498db.svg?style=flat-square)](https://twitter.com/pbrisorgueil?lang=fr) [![Youtube](https://badges.weareopensource.me/badge/Watch-me%20on%20Youtube-e74c3c.svg?style=flat-square)](https://www.youtube.com/channel/UCIIjHtrZL5-rFFupn7c3OtA) [![Instagram](https://badges.weareopensource.me/badge/Follow-me%20on%20Instagram-f27231.svg?style=flat-square)](https://www.instagram.com/pierre_brsrgl/) [![Linkedin](https://badges.weareopensource.me/badge/Add-me%20on%20linkedin-006DA9.svg?style=flat-square)](https://www.linkedin.com/in/pierre-brisorgueil/)

Feel free to help us ! :)

## :link: Links

[![Blog](https://badges.weareopensource.me/badge/Read-our%20Blog-1abc9c.svg?style=flat-square)](https://blog.weareopensource.me) [![Slack](https://badges.weareopensource.me/badge/Chat-on%20our%20Slack-d0355b.svg?style=flat-square)](https://join.slack.com/t/weareopensource/shared_invite/zt-62p1qxna-PEQn289qx6mmHobzKW8QFw) [![Discord](https://badges.weareopensource.me/badge/Chat-on%20our%20Discord-516DB9.svg?style=flat-square)](https://discord.gg/U2a2vVm)  [![Mail](https://badges.weareopensource.me/badge/Contact-us%20by%20mail-00a8ff.svg?style=flat-square)](mailto:weareopensource.me@gmail.com?subject=Contact)
