const _ = require('lodash');
const defaultConfig = require('./development');

module.exports = _.merge(defaultConfig, {
  app: {
    title: 'WAOS',
    subtitle: 'Knowledge sharing #LetsGetTogether',
    keywords: 'opensource, stack, fullstack',
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
  cookie: {
    prefix: 'waos',
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
        displayIfLogged: true, // show nav only if user is logged (easy for one page site)
      },
      themes: {
        dark: {
          primary: '#2c3e50',
          secondary: '#ff6b81',
        },
        light: {
          primary: '#2c3e50',
          secondary: '#ff4757',
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
        icon: 'fab fa-github',
        label: 'Github',
        url: 'https://github.com/weareopensource',
      },{
        icon: 'fab fa-docker',
        label: 'Docker',
        url: 'https://hub.docker.com/orgs/weareopensource/repositories',
      },{
        icon: 'fab fa-discord',
        label: 'Discord',
        url: 'https://discord.gg/U2a2vVm',
      },{
        icon: 'fab fa-slack',
        label: 'Slack',
        url: 'https://join.slack.com/t/weareopensource/shared_invite/zt-62p1qxna-PEQn289qx6mmHobzKW8QFw',
      },{
        icon: 'fab fa-twitter',
        label: 'Twitter',
        url: 'https://twitter.com/waos_io',
      }, {
        label: 'Linkedin',
        icon: 'fab fa-linkedin',
        url: 'https://www.linkedin.com/company/weareopensource-me',
      },
    ],
  },
  home: {
    subscriptions: true, // disbale / enable
    temporalBackground: 'https://blog.weareopensource.me/content/images/2020/06', // one by hour 00.jpg, 01.jpg; 02.jpg ... set to null default background would be in @/assets/images/background.jpg
    abouts: [
      {
        title: 'Concept',
        text: '[WAOS](https://blog.weareopensource.me/us/)"s goal is to simplify the **start** of new **tech projects** / **startups**. As we know It must be **fast**, **efficient** while **avoiding the refactor** afterward. So through the creation of [Open-Source](https://github.com/weareopensource) **stacks** / **tools** or the writing of **articles**, we **share our knowledge** around this subject.',
        image: null,
        button: null,
        link: null,
      }, {
        title: 'Technical',
        text: '[We](https://blog.weareopensource.me/us/) dream to create stacks **back/fronts**, **aligns on feats** & **architecture**, in multiple languages. Allowing anyone to **create full-stack** on demand ([VueJS](https://github.com/weareopensource/Vue), [Node](https://github.com/weareopensource/Node), [Swift](https://github.com/weareopensource/Swift) [...](https://github.com/weareopensource)) and keep it updated, while exploring scalable deployment, or tips like growth hacking via our [articles](https://blog.weareopensource.me).',
        image: null,
        button: null,
        link: null,
      },
    ],
    abouts2: [
      {
        title: 'History',
        text: 'This work was originally based on [MEAN.js](http://meanjs.org/), and a fork named [Riess.js](https://github.com/lirantal/Riess.js). Creators stopped working on it and we wished to take the project over. We want to create updated stacks with the same mindset, "simple" & "easy to use", not only for Node and Angular, but every language. <br />  **Step by step... we built a toolbox to start projects.**',
        image: null,
        button: null,
        link: null,
      }, {
        title: 'Knowledges',
        text: '[How to start a project and maintain updated stacks](https://blog.weareopensource.me/start-a-project-and-maintain-updates/) <br /> What is our [roadmap](https://github.com/weareopensource/weareopensource.github.io/projects/1)? Willing to [contribute](https://blog.weareopensource.me/how-to-contribute/)? About [us](https://blog.weareopensource.me/us/)? <br /> <br /> Deployment: [Rancher](https://blog.weareopensource.me/rancher-2-how-to-2/) - [CapRover](https://blog.weareopensource.me/node/) <br /> Code: [JS](https://blog.weareopensource.me/js-knwoledges/) - [Swift](https://blog.weareopensource.me/js-knwoledges-2/)  <br /> Other: [Commits](https://github.com/weareopensource/conventional-changelog) - [Labels](https://blog.weareopensource.me/labels-recommendation-for-issues/) - [Server](https://blog.weareopensource.me/setup-debian-server/) - [Tools](https://blog.weareopensource.me/us/)',
        image: null,
        button: null,
        link: null,
      }
    ],
    features: {
      title: 'Stacks',
      data: [
        {
          icon: 'fab fa-vuejs',
          title: 'Vue',
          text: '**Alpha Front Stack** <br> Classic auth with landing page, tasks & subscription example. <br/> *Vuetify, Vuex, Vuetify, JWT, Jest* <br /> [Demo](https://vue.weareopensource.me) - [Repo](https://github.com/weareopensource/Vue) - [Changelog](/changelogs) - [Docker](https://hub.docker.com/repository/docker/weareopensource/vue)',
          color: '#186b9f',
        },
        {
          icon: 'fab fa-node',
          title: 'Node',
          text: '**Beta Back Stack** <br> Classic auth with tasks, subscription & GDPR & uploads example. <br/> *Express, Jwt, Mongo, Sequelize* <br /> [Demo](https://node.weareopensource.me) - [Repo](https://github.com/weareopensource/Node) - [Changelog](/changelogs) - [Docker](https://hub.docker.com/repository/docker/weareopensource/node)',
          color: '#56a049',
        },
        {
          icon: "fab fa-swift",
          title: 'Swift',
          text: '**Alpha Front Stack** <br> Classic auth with on Boarding, profile & GDPR &  tasks example. <br/> *RxSwift, ReactorKit, JWT, Moya* <br /> [Repo](https://github.com/weareopensource/Swift) - [Changelog](/changelogs)',
          color: '#f74e38',
        },
      ],
    },
    tools: {
      title: 'Tools',
      data: [
        {
          icon: 'fas fa-terminal',
          title: 'Conventional Changelog',
          text: '**NPM package** <br> Prompt to format commits for conventional changelog generation <br /> [Repo](https://github.com/weareopensource/conventional-changelog) - [Changelog](/changelogs) - [NPM](https://www.npmjs.com/package/@weareopensource/conventional-changelog)',
          color: 'primary',
        },
        {
          icon: 'fas fa-hat-cowboy',
          title: 'Rancher Catalog',
          text: '**Rancher Catalog** <br> Applications that make it easy to deploy our stacks or suggested tools <br/> [Repo](https://github.com/weareopensource/rancher-catalog) - [Changelog](/changelogs)',
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
        }, {
          value: '0',
          title: 'Releases',
        }, {
          value: '0',
          title: 'Articles',
        }, {
          value: '0',
          title: 'Docker Pulls',
        },
      ],
    },
    blog: { // actually dev for Ghost Blog
      title: 'Articles',
      url: 'https://blog.weareopensource.me',
      key: 'e4925fb7f5698f998daeb128d8',
    },
    blog2: { // actually dev for Ghost Blog
      title: 'News',
      url: 'https://blog.weareopensource.me',
      key: 'e4925fb7f5698f998daeb128d8',
    },
    blog3: { // actually dev for Ghost Blog
      title: 'Hobbies',
      url: 'https://blog.weareopensource.me',
      key: 'e4925fb7f5698f998daeb128d8',
    },
    contact: {
      title: 'Contact Us',
      mail: 'mailto:pierre@weareopensource.me',
    },
    links: [
      {
        title: 'Useful',
        items: [{
          label: 'Blog',
          icon: 'fa-rss',
          url: 'https://blog.weareopensource.me',
        },{
          icon: 'fab fa-github',
          label: 'Github',
          url: 'https://github.com/weareopensource',
        },{ // set null to hide
          label: 'Changelogs',
          icon: 'fa-clipboard-list',
          url: '/changelogs',
        }],
      },
      {
        title: 'About',
        items: [{
          icon: 'fab fa-discord',
          label: 'Discord',
          url: 'https://discord.gg/U2a2vVm',
        },{
          icon: 'fab fa-slack',
          label: 'Slack',
          url: 'https://join.slack.com/t/weareopensource/shared_invite/zt-62p1qxna-PEQn289qx6mmHobzKW8QFw',
        },{
          icon: 'fab fa-twitter',
          label: 'Twitter',
          url: 'https://twitter.com/waos_io',
        }],
      },
      {
        title: 'Others',
        items: [{
          icon: 'fab fa-docker',
          label: 'Docker',
          url: 'https://hub.docker.com/orgs/weareopensource/repositories',
        },{
          icon: 'fas fa-vial',
          label: 'Travis',
          url: 'https://travis-ci.org/github/weareopensource',
        },{
          icon: 'fa-users',
          label: 'Us ?',
          url: 'https://blog.weareopensource.me/us/',
        }],
      },
    ],
  },
});