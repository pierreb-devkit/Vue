const _ = require('lodash');
const defaultConfig = require('./development.cjs');

module.exports = _.merge(defaultConfig, {
  app: {
    title: 'We Are Open Source',
    status: '',
    subtitle: 'Knowledge sharing #LetsGetTogether',
    description:
      'We Are Open Source aims at simplifying the start of new tech projects/startups. This critical step must be fast, efficient while avoiding any costly ulterior refactorings. By creating Open-Source stacks and tools or the writing of articles, WAOS helps to share knowledge around this subject.',
    keywords: 'opensource, stack, fullstack, startup, tool, start, project, node, vue, swift',
    author: 'pierre@weareopensource.me',
  },
  port: 8020,
  api: {
    protocol: 'http',
    host: 'localhost',
    port: '3020',
    base: 'api',
    endPoints: {
      auth: 'auth',
      users: 'users',
      tasks: 'tasks',
      apis: 'apis',
      historys: 'historys',
    },
  },
  sign: {
    in: false, // display signin link
    up: false, // display signup link
  },
  cookie: {
    prefix: 'waos',
  },
  oAuth: {
    google: false, // require server side oAuth config
    apple: false, // require server side oAuth config
  },
  analytics: {
    matomo: {
      host: 'https://mtm.weareopensource.me',
      siteId: 1,
      router: this.$router, // Enables automatically registering pageviews on the router
      // requireConsent: true, // Require consent before sending tracking information to matomo
    },
  },
  vuetify: {
    theme: {
      dark: 'auto',
      signin: false, // display signin link
      signup: false, // display signup link
      navigation: {
        ifLogged: true,
      },
      themes: {
        light: {
          colors: {
            primary: '#2c3e50',
            secondary: '#ff4757',
          },
        },
        dark: {
          colors: {
            primary: '#2c3e50',
            secondary: '#ff6b81',
          },
        },
      },
    },
    icons: {
      iconfont: 'fa',
    },
    drawer: {
      model: null,
      type: 'mini', // default / permanent / temporary / mini
      clipped: true,
      floating: true,
      mini: true,
    },
  },
  header: {
    socials: [
      {
        icon: 'fa-brands fa-github',
        label: 'Github',
        url: 'https://github.com/weareopensource',
      },
      {
        icon: 'fa-brands fa-docker',
        label: 'Docker',
        url: 'https://hub.docker.com/orgs/weareopensource/repositories',
      },
      {
        icon: 'fa-brands fa-discord',
        label: 'Discord',
        url: 'https://discord.gg/U2a2vVm',
      },
      {
        icon: 'fa-brands fa-slack',
        label: 'Slack',
        url: 'https://join.slack.com/t/weareopensource/shared_invite/zt-62p1qxna-PEQn289qx6mmHobzKW8QFw',
      },
      {
        icon: 'fa-brands fa-twitter',
        label: 'Twitter',
        url: 'https://twitter.com/waos_io',
      },
      {
        label: 'Linkedin',
        icon: 'fa-brands fa-linkedin',
        url: 'https://www.linkedin.com/company/weareopensource-me',
      },
    ],
  },
  home: {
    subscriptions: true, // disbale / enable
    temporalBackground: 'https://blog.weareopensource.me/content/images/size/w1600/2020/11', // one by hour 00.jpg, 01.jpg; 02.jpg ... set to null default background would be in @/assets/images/background.jpg
    abouts: [
      {
        title: 'Concept',
        text: '[WAOS](https://blog.weareopensource.me/us/) aims at simplifying the **start** of new **tech projects**/**startups**. This critical step must be **fast**, **efficient** while avoiding any costly ulterior **refactorings**. By creating [Open-Source](https://github.com/weareopensource) **stacks** and **tools** or the writing of **articles**, WAOS helps to **share knowledge** around this subject.',
        image: null,
        button: null,
        link: null,
      },
      {
        title: 'Technical',
        text: '[We](https://blog.weareopensource.me/us/) dream dream of creating **stacks** in multiple languages, [Vue](https://github.com/weareopensource/Vue), [Node](https://github.com/weareopensource/Node), [Swift](https://github.com/weareopensource/Swift) [...](https://github.com/weareopensource), **aligned** on **features** & **architecture**. We want to allow anyone to **create a full-stack** on-demand with its favorite languages and keep it updated while exploring scalable deployment or tips like growth hacking via our [articles](https://blog.weareopensource.me).',
        image: null,
        button: null,
        link: null,
      },
    ],
    abouts2: [
      {
        title: 'History',
        text: 'This work was initially based on [MEAN.js](http://meanjs.org/), and a fork named [Riess.js](https://github.com/lirantal/Riess.js). Its creators stopped working on it, and we wished to take the project over. We want to create updated stacks with the same mindset, "simple" & "easy to use", not only for Node and Angular, but every language. <br />  **Step by step... we built a toolbox to start projects.**',
        image: null,
        button: null,
        link: null,
      },
      {
        title: 'Knowledge',
        text: '[How to start a project and maintain updated stacks](https://blog.weareopensource.me/start-a-project-and-maintain-updates/) <br /> What is our [roadmap](https://github.com/orgs/weareopensource/projects/3)? Willing to [contribute](https://blog.weareopensource.me/how-to-contribute/)? About [us](https://blog.weareopensource.me/us/)? <br /> <br /> Deployment: [Rancher](https://blog.weareopensource.me/tag/rancher-2/) - [CapRover](https://blog.weareopensource.me/node/) <br /> Code: [JS](https://blog.weareopensource.me/js-knwoledges/) - [Swift](https://blog.weareopensource.me/js-knwoledges-2/)  <br /> Other: [Commits](https://github.com/weareopensource/conventional-changelog) - [Labels](https://blog.weareopensource.me/labels-recommendation-for-issues/) - [Server](https://blog.weareopensource.me/setup-debian-server/) - [Tools](https://blog.weareopensource.me/us/)',
        image: null,
        button: null,
        link: null,
      },
    ],
    features: {
      title: 'Stacks',
      data: [
        {
          icon: 'fa-brands fa-vuejs',
          title: 'Vue',
          text: '**Beta Front Stack** <br> Landing page, Auth, Users, Subscriptions, Pages/Terms, Tasks example ... <br/> *Vuetify, Vuex, JWT, Jest* <br /> [Demo](https://vue.weareopensource.me) - [Repo](https://github.com/weareopensource/Vue) - [Changelog](/changelogs) - [Docker](https://hub.docker.com/repository/docker/weareopensource/vue)',
          color: '#186b9f',
        },
        {
          icon: 'fa-brands fa-swift',
          title: 'Swift',
          text: '**Beta Front Stack** <br> On boarding, Auth, User, GDPR, Uploads, Page/Terms, Tasks example ... <br/> *RxSwift, ReactorKit, JWT, Moya* <br /> [Repo](https://github.com/weareopensource/Swift) - [Changelog](/changelogs)',
          color: '#f74e38',
        },
        {
          icon: 'fa-brands fa-node',
          title: 'Node',
          text: '**Back Stack** <br>  Auth, Users, Subscription, GDPR, Uploads, Page/Terms, Tasks example ... <br/> *Express, Jwt, Mongo, Sequelize* <br /> [Demo](https://node.weareopensource.me) - [Repo](https://github.com/weareopensource/Node) - [Changelog](/changelogs) - [Docker](https://hub.docker.com/repository/docker/weareopensource/node)',
          color: '#56a049',
        },
        {
          icon: 'fa-brands fa-tumblr-square',
          title: 'TypeScript',
          text: '**Alpha Back Stack** <br>  Auth, Users, Subscription, GDPR, Uploads, Page/Terms, Tasks example ... <br/> *Express, Jwt, Mongo, Sequelize* <br /> [Repo](https://github.com/weareopensource/Typescript) - [Changelog](/changelogs) - [Docker](https://hub.docker.com/repository/docker/weareopensource/typescript)',
          color: '#3178c6',
        },
      ],
    },
    tools: {
      title: 'Tools',
      data: [
        {
          icon: 'fas fa-terminal',
          title: 'Conventional Changelog',
          text: 'Prompt to format commits for conventional changelog generation <br /> [Repo](https://github.com/weareopensource/conventional-changelog) - [Changelog](/changelogs) - [NPM](https://www.npmjs.com/package/@weareopensource/conventional-changelog)',
          color: 'primary',
        },
        {
          icon: 'fas fa-hat-cowboy',
          title: 'Rancher Catalog',
          text: 'Applications that make it easy to deploy our stacks or suggested tools <br/> [Repo](https://github.com/weareopensource/rancher-catalog) - [Changelog](/changelogs)',
          color: '#186b9f',
        },
      ],
    },
    slideshow: {
      title: 'Demos',
      data: [
        {
          img: '01.jpg',
          icon: null,
          title: null,
          text: null,
        },
        {
          img: '02.jpg',
          icon: null,
          title: null,
          text: null,
        },
      ],
    },
    stats: {
      background: null,
      data: [
        {
          value: '0',
          title: 'Repos',
        },
        {
          value: '0',
          title: 'Releases',
        },
        {
          value: '0',
          title: 'Articles',
        },
        {
          value: '0',
          title: 'Docker Pulls',
        },
      ],
    },
    suggestions: {
      title: 'Softs',
      data: [
        [
          {
            title: 'Github',
            image: 'logos/github.png',
            link: 'https://github.com/',
          },
          {
            title: 'Gogs',
            image: 'logos/gogs.png',
            link: 'https://gogs.io/',
          },
          {
            title: 'Shields',
            image: 'logos/shields.png',
            link: 'https://shields.io/',
          },
          {
            title: 'Coveralls',
            image: 'logos/coveralls.jpeg',
            link: 'https://coveralls.io/',
          },
          {
            title: 'CodeClimate',
            image: 'logos/codeclimate.jpg',
            link: 'https://codeclimate.com/',
          },
          {
            title: 'Dependabot',
            image: 'logos/dependabot.png',
            link: 'https://dependabot.com/',
          },
          {
            title: 'Snyk',
            image: 'logos/snyk.jpg',
            link: 'https://snyk.io/',
          },
          {
            title: 'Travis',
            image: 'logos/travis.jpg',
            link: 'https://travis-ci.org/',
          },
          {
            title: 'Drone',
            image: 'logos/drone.png',
            link: 'https://drone.io/',
          },
          {
            title: 'Docker',
            image: 'logos/docker.png',
            link: 'https://www.docker.com/',
          },
          {
            title: 'Kubernetes',
            image: 'logos/kubernetes.png',
            link: 'https://kubernetes.io/',
          },
          {
            title: 'Rancher',
            image: 'logos/rancher.png',
            link: 'https://rancher.com/',
          },
          {
            title: 'Keel',
            image: 'logos/keel.png',
            link: 'https://keel.sh/',
          },
          {
            title: 'Slack',
            image: 'logos/slack.png',
            link: 'https://slack.com/',
          },
          {
            title: 'Discord',
            image: 'logos/discord.jpg',
            link: 'https://discord.com/',
          },
          {
            title: 'Ghost',
            image: 'logos/ghost.png',
            link: 'https://ghost.org/',
          },
          {
            title: 'Zapier',
            image: 'logos/zapier.png',
            link: 'https://zapier.com/',
          },
          {
            title: 'Matomo',
            image: 'logos/matomo.png',
            link: 'https://fr.matomo.org/',
          },
        ],
      ],
    },
    blog: {
      // actually dev for Ghost Blog
      title: 'Articles',
      url: 'https://blog.weareopensource.me',
      subscribe: 'https://blog.weareopensource.me/#subscribe',
      key: 'e4925fb7f5698f998daeb128d8',
    },
    blog2: {
      // actually dev for Ghost Blog
      title: 'Snippets',
      url: 'https://blog.weareopensource.me',
      key: 'e4925fb7f5698f998daeb128d8',
    },
    contact: {
      title: 'Contact Us',
      mail: 'mailto:pierre@weareopensource.me',
    },
    sponsors: {
      title: 'Sponsor',
      data: [
        [
          {
            title: 'OpenCollective',
            image: 'logos/opencollective.png',
            link: 'https://opencollective.com/weareopensource',
          },
          {
            title: 'Ko-fi',
            image: 'logos/patreon.png',
            link: 'https://ko-fi.com/weareopensource',
          },
        ],
      ],
    },
    links: [
      {
        title: 'Useful',
        items: [
          {
            label: 'Blog',
            icon: 'fa-solid fa-rss',
            url: 'https://blog.weareopensource.me',
          },
          {
            icon: 'fa-brands fa-github',
            label: 'Github',
            url: 'https://github.com/weareopensource',
          },
          {
            // set null to hide
            label: 'Changelogs',
            icon: 'fa-solid fa-clipboard-list',
            url: '/changelogs',
          },
        ],
      },
      {
        title: 'About',
        items: [
          {
            icon: 'fa-brands fa-discord',
            label: 'Discord',
            url: 'https://discord.gg/U2a2vVm',
          },
          {
            icon: 'fa-brands fa-slack',
            label: 'Slack',
            url: 'https://join.slack.com/t/weareopensource/shared_invite/zt-62p1qxna-PEQn289qx6mmHobzKW8QFw',
          },
          {
            icon: 'fa-brands fa-twitter',
            label: 'Twitter',
            url: 'https://twitter.com/waos_io',
          },
        ],
      },
      {
        title: 'Others',
        items: [
          {
            icon: 'fa-brands fa-docker',
            label: 'Docker',
            url: 'https://hub.docker.com/orgs/weareopensource/repositories',
          },
          {
            icon: 'fa-solid fa-vial',
            label: 'Travis',
            url: 'https://travis-ci.org/github/weareopensource',
          },
          {
            icon: 'fa-solid fa-users',
            label: 'Us ?',
            url: 'https://blog.weareopensource.me/us/',
          },
        ],
      },
    ],
  },
});
