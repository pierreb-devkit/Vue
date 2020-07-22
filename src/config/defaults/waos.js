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
        icon: 'fab fa-github-alt',
        label: 'Projects',
        url: 'https://github.com/WeAreOpenSourceProjects',
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
      },
    ],
  },
  home: {
    subscriptions: true, // disbale / enable
    temporalBackground: 'https://blog.weareopensource.me/content/images/2020/06', // one by hour 00.jpg, 01.jpg; 02.jpg ... set to null default background would be in @/assets/images/background.jpg
    abouts: [
      {
        title: 'Concept',
        text: '[WAOS](https://weareopensource.me)"s goal is to simplify the **start** of a new **tech project** / **startup**. It must be **fast**, **efficient** while **avoiding the refactor** afterwards. Whether through the creation of [open source](https://github.com/weareopensource) **stacks** / **tools** or **articles** on this subject, we try to **share our knowledge** around this theme.',
        image: null,
        button: null,
        link: null,
      }, {
        title: 'Technical',
        text: 'We dreams to create stacks **Backs / Fronts**, **aligns on feats** & **Architecture**, in multiple languages. This to allow anyone to **create fullstack** on demand ([VueJS](https://github.com/weareopensource/Vue), [Node](https://github.com/weareopensource/Node), [Swift](https://github.com/weareopensource/Swift) [...](https://github.com/weareopensource)) and keep updates. While exploring resilient and scalable deployment, as well as [growth hacking](https://en.wikipedia.org/wiki/Growth_hacking) via our [articles](https://blog.weareopensource.me).',
        image: null,
        button: null,
        link: null,
      },
    ],
    abouts2: [
      {
        title: 'History',
        text: 'This work was originally based on [MEAN.js](http://meanjs.org/) and a fork named [Riess.js](https://github.com/lirantal/Riess.js). It being stopped we wished to take it back, we want to create updated stack with same mindset "simple", "easy to use". Not only for Node and Angular, but every language. <br /><br />  **Little by little ... we targeted the toolbox to start projects.**',
        image: null,
        button: null,
        link: null,
      }, {
        title: 'Links',
        text: '[How to start a project and maintain updates from stacks](https://blog.weareopensource.me/start-a-project-and-maintain-updates/) <br /> [How to contribute and help us to maintain our stacks](https://blog.weareopensource.me/how-to-contribute/) <br /> [Some recommendations on the labels of a repo](https://blog.weareopensource.me/labels-recommendation-for-issues/) <br /> [Some information about who we are and our tools](https://blog.weareopensource.me/us/) <br /> <br /> Some knwoledges : [JS](https://blog.weareopensource.me/js-knwoledges/) [Swift](https://blog.weareopensource.me/js-knwoledges-2/)',
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
        },
        {
          icon: 'fab fa-node',
          title: 'Node',
          text: '**Beta Back Stack** <br> Classic auth with tasks, subscription & GDPR & uploads example. <br/> *Express, Jwt, Mongo, Sequelize* <br /> [Demo](https://node.weareopensource.me) - [Repo](https://github.com/weareopensource/Node) - [Changelog](/changelogs) - [Docker](https://hub.docker.com/repository/docker/weareopensource/node)',
        },
        {
          icon: "fab fa-swift",
          title: 'Swift',
          text: '**Alpha Front Stack** <br> Classic auth with on Boarding, profile & GDPR &  tasks example. <br/> *RxSwift, ReactorKit, JWT, Moya* <br /> [Repo](https://github.com/weareopensource/Swift) - [Changelog](/changelogs)',
        },
      ],
    },
    stats: {
      background: null,
      data: [
        {
          value: '0',
          title: 'Git Stacks',
        }, {
          value: '0',
          title: 'Git Releases',
        }, {
          value: '0',
          title: 'Blog Articles',
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
          icon: 'fab fa-github-alt',
          label: 'Github projects',
          url: 'https://github.com/WeAreOpenSourceProjects',
        },{
          icon: 'fas fa-vial',
          label: 'Travis',
          url: 'https://travis-ci.org/github/weareopensource',
        }],
      },
    ],
  },
});