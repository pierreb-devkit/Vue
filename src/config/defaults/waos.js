const _ = require('lodash');
const defaultConfig = require('./development');

module.exports = _.merge(defaultConfig, {
  app: {
    title: 'WAOS',
    subtitle: 'Sharing of knowledge - #LetsGetTogether',
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
        label: 'Github projects',
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
    temporalBackground: 'https://weareopensource.me/content/images/2020/06', // one by hour 00.jpg, 01.jpg; 02.jpg ... set to null default background would be in @/assets/images/background.jpg
    abouts: [
      {
        title: 'Concept',
        text: '[WAOS](https://weareopensource.me)"s goal is to simplify the **start** of a new **tech project** / **startup**. It must be **fast**, **efficient** while **avoiding the refactor** afterwards. Whether through the creation of [open source](https://github.com/weareopensource) **stacks** / **tools** or **articles** on this subject, we try to **share our knowledge** around this theme.',
        image: null,
        button: null,
        link: null,
      }, {
        title: 'Technical',
        text: 'We dreams to create stacks **Backs / Fronts**, **aligns on feats**, in multiple languages, to allow anyone to **compose fullstack** on demand ([VueJS](https://github.com/weareopensource/Vue), [Node](https://github.com/weareopensource/Node), [Swift](https://github.com/weareopensource/Swift) [...](https://github.com/weareopensource)) and keep updates. While exploring resilient and easily scalable deployment, as well as growth hacking concepts via our [articles](https://blog.weareopensource.me).',
        image: null,
        button: null,
        link: null,
      },
    ],
    features: {
      title: 'Stacks',
      data: [
        {
          icon: 'fab fa-vuejs',
          title: 'Vue',
          text: 'Easily request and **transform API data**, to **homogenize** or to have an **API version buffer**. This is available directly from our interface by **JSON**.',
        },
        {
          icon: 'fab fa-node',
          title: 'Node',
          text: 'Save the data into **delta** (data variation history), **browsable** from our interface with some statistics. Be immediately **informed by email** in case of failure.',
        },
        {
          icon: "fab fa-swift",
          title: 'Swift',
          text: 'Expose your data via a **secure API** to your other applications in a few clicks. Your data is then saved on our side and exposed from classic [JWT](https://en.wikipedia.org/wiki/JSON_Web_Token) [stateless](https://www.jbspeakr.cc/purpose-jwt-stateless-authentication/) API.',
        },
      ],
    },
    stats: {
      background: null,
      data: [
        ['0', 'Stacks'],
        ['0', 'Releases'],
        ['0', 'Articles'],
        ['0', 'Pulls'],
      ],
    },
    blog: { // actually dev for Ghost Blog
      title: 'Blog',
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
          url: 'https://weareopensource.me',
        }, {
          label: 'Github',
          icon: 'fab fa-github',
          url: 'https://github.com/weareopensource',
        }],
      },
      {
        title: 'About',
        items: [{ // set null to hide
          label: 'Changelogs',
          icon: 'fa-clipboard-list',
          url: '/changelogs',
        }],
      },
      {
        title: 'Others',
        items: [{
          label: 'Lou',
          icon: 'fab fa-wolf-pack-battalion',
          url: 'https://lou.comes.io',
        }],
      },
    ],
  },
});
