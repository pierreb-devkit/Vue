export default {
  app: {
    title: 'WAOS dev',
    subtitle: 'welcome to demo.',
    description: 'Vue - Boilerplate Front : Vuetify, Axios, Jest, Cypress (Alpha) ',
    keywords: 'vue, vuetify, axios, jest, cypress',
    author: 'pierre@weareopensource.me',
    icon: 'fa-solid fa-earth-americas',
  },
  port: 8080, // only available for dev env
  api: {
    protocol: 'http',
    host: 'localhost',
    port: '3000',
    base: 'api',
    endPoints: {
      home: 'home',
      auth: 'auth',
      users: 'users',
      tasks: 'tasks',
    },
  },
  sign: {
    route: '/tasks', // route push after sign in/up
    in: true, // display signin link
    up: true, // display signup link
  },
  cookie: {
    prefix: 'waos',
  },
  oAuth: {
    google: true, // require server side oAuth config
    apple: true, // require server side oAuth config
  },
  whitelists: {
    users: {
      roles: ['user', 'admin'],
    },
  },
  analytics: {
    posthog: {
      // host: 'ph_instance_address',
      // key: 'ph_project_api_key',
    },
  },
  vuetify: {
    theme: {
      dark: 'auto', // dark theme true / false / auto (based on prefers-color-scheme)
      flat: true, // flat by default
      rounded: 'rounded-lg',
      maxWidth: '1200px',
      snackbar: {
        // kind of notifications on requests
        status: true, // activate for error
        methods: ['post', 'put'], // show on sucess depends of methods
        sucessColor: 'success',
        errorColor: 'error',
      },
      header: {
        background: '#2c3e50',
        color: '#FFFFFF',
        opacity: 99,
        scrollBehavior: 'hide',
      },
      navigation: {
        background: '#2c3e50',
        color: '#FFFFFF',
        drawer: {
          floating: true,
          expand: true,
          rail: true,
        },
      },
      themes: {
        light: {
          colors: {
            primary: '#1abc9c',
            secondary: '#EE5A24',
            background: '#f3f3f6',
            surface: '#ffffff',
            error: '#e01f26',
            success: '#119178',
            onPrimary: '#ffffff',
            onSecondary: '#FFFFFF',
            onBackground: '#1d1d1f',
            onSurface: '#1d1d1f',
            onError: '#FFFFFF',
            onSuccess: '#FFFFFF',
          },
        },
        dark: {
          colors: {
            primary: '#1abc9c',
            secondary: '#e67e22',
            background: '#1F1F1F',
            surface: '#282A2E',
            error: '#CF6679',
            success: '#119178',
            onPrimary: '#FFFFFF',
            onSecondary: '#FFFFFF',
            onBackground: '#FFFFFF',
            onSurface: '#FEFEFE',
            onError: '#000000',
            onSuccess: '#000000',
          },
        },
      },
      options: {
        customProperties: true,
      },
    },
    icons: {
      defaultSet: 'fa',
    },
  },
  header: {
    display: true, // display header or not
    logo: {
      file: '/images/logo.webp', // null to hide
      width: '120px',
    },
    title: false, // display title or not
    links: [
      // top left
      {
        title: 'Product',
        sublinks: [
          {
            icon: 'fa-regular fa-star',
            color: 'secondary',
            title: 'For startuper',
            subtitle: 'Create faster, Resilient, Easily',
            url: 'https://github.com/weareopensource/',
          },
          {
            icon: 'fa-solid fa-code',
            color: 'secondary',
            title: 'For developer',
            subtitle: 'Learn, develop, fork',
            url: 'https://github.com/weareopensource/',
          },
        ],
      },
      {
        title: 'Ressources',
        sublinks: [
          {
            icon: 'fa-regular fa-newspaper',
            color: 'secondary',
            title: 'Blog',
            subtitle: 'Follow our updates and activities',
            url: 'https://blog.weareopensource.me',
          },
        ],
      },
    ],
    shortcuts: [
      {
        title: 'Get Started - free',
        url: 'https://blog.weareopensource.me',
        variant: 'flat',
      },
    ],
  },
  home: {
    lightBackground: '/images/light.webp',
    darkBackground: '/images/dark.webp',
    banner: {
      title: 'Turn your ideas <br /> <b><span style="color:#55efc4">into a reality.</span></b>',
      subtitle: 'WeAreOpenSource allow you to start projects faster with scalable stacks.',
      button: {
        title: 'Just launched: 2.0 →',
        color: '#55efc4',
        link: 'https://github.com/weareopensource',
      },
    },
    video: {
      file: '/videos/highlight.mp4',
      poster: '/videos/highlight-poster.webp',
      subBanner: true,
      style: {
        section: {
          background: 'background',
        },
        video: {
          background: '#101115',
        },
      },
    },
    punchline: {
      style: {
        section: {
          background: 'surface',
        },
      },
      content: [
        {
          subtitle: 'We Are Open Source',
          quote: true,
          text: 'Is an all-in-one platform tailored for **developers**, **startups**, and **incubators**, streamlining the process of launching digital projects. With our intuitive stack combining **NodeJS**, **VueJS**, and **Swift**, users can swiftly set up **authentication**, showcase **products**, implement **pricing models**, and handle **subscriptions**. Dive into the new era of rapid development and bring your innovative ideas to life with ease.',
          button: {
            title: 'Follow Us on Github',
            link: 'https://github.com/weareopensource',
          },
        },
      ],
    },
    features: {
      style: {
        section: {
          background: 'background',
        },
        video: {
          background: '#101115',
        },
      },
      title: 'Showcase Site !',
      content: [
        {
          text: 'Specifically crafted for startups & developers, our template, integrating **NodeJS**, **VueJS**, & **Swift**, offers a unique opportunity for users. Not only does it guarantee a standout product showcase without the usual design hiccups, but it also empowers users with a tool that marries both aesthetic appeal and functional prowess. Dive in and experience a transformative platform where elegance meets performance.',
          reversed: true,
          fullWidth: true,
          video: {
            file: '/videos/highlight.mp4',
            poster: '/videos/highlight-poster.webp',
          },
        },
        {
          subtitle: 'Authentication Feature',
          img: '/images/content01.webp',
          text: 'Leveraging **Apple Connect**, **Google Connect**, and **JWT**, our authentication system emphasizes security and ease. Fueled by **NodeJS**, **VueJS**, & **Swift**, it promises a unified sign-in process  and ensuring user comfort.',
        },
        {
          subtitle: 'CRUD Model',
          img: '/images/content02.webp',
          text: 'Our **CRUD** model, built on **NodeJS**, **VueJS**, & **Swift**, exemplifies rapid feature development. It offers a clear path to master CRUD operations, eliminating guesswork. Elevate your development with our insightful guide.',
        },
      ],
    },
    repos: {
      style: {
        section: {
          background: 'surface',
        },
      },
      slide: {
        interval: 15000,
      },
      content: [
        {
          subtitle: 'Node',
          img: '/images/card01.webp',
          text: 'Discover our Node stack. Runs standalone or with Vue or Swift. Uses Node, Express, MongoDB, and Jest. Features user auth, tasks, uploads, and Docker setup.',
          button: {
            title: 'Just launched: 1.2.1 →',
            color: '#EA3F7D',
            link: 'https://github.com/weareopensource/Node',
          },
          style: {
            card: {
              background: '#FFD0E4',
              color: '#000000',
            },
          },
        },
        {
          subtitle: 'Vue',
          img: '/images/card02.webp',
          reversed: true,
          text: 'Explore our Vue 3 stack with JWT auth. Modular, pairs with our Node. Layered architecture, Docker, ESLint, and Github Action included. Design based on Vuetify.',
          button: {
            title: 'Just launched: 1.2.0 →',
            color: '#DAFE56',
            link: 'https://github.com/weareopensource/Vue',
          },
          style: {
            card: {
              background: '#010101',
              color: '#FFFFFF',
            },
          },
        },
        {
          subtitle: 'Swift',
          img: '/images/card03.webp',
          text: 'Our Swift stack in Beta offers frontend solutions. Features layered architecture, RxSwift, and tools for development. Supports user auth, tasks, and notifications.',
          button: {
            title: 'Just launched: 1.3.0 →',
            color: '#f1c40f',
            link: 'https://github.com/weareopensource/Swift',
          },
          style: {
            card: {
              background: '#2c3e50',
              color: '#FFFFFF',
            },
          },
        },
        {
          subtitle: 'Conventional Changelog',
          img: '/images/card04.webp',
          reversed: true,
          text: 'Conventional Changelog respects CZ standards. Enhanced with ES6 and Emoji. Integrated with commitizen and open for contributions. A lighter way to respect conventions',
          button: {
            title: 'Just launched: 1.7.0 →',
            color: '#365571',
            link: 'https://github.com/weareopensource/conventional-changelog',
          },
          style: {
            card: {
              background: '#16a085',
              color: '#FFFFFF',
            },
          },
        },
      ],
    },
    ressources: {
      title: 'Some ressources to start',
      style: {
        section: {
          background: 'background',
        },
        card: {
          background: 'surface',
        },
      },
      content: [
        {
          icon: 'fa-solid fa-book',
          color: '#16a085',
          subtitle: 'History',
          text: 'This work was initially based on [MEAN.js](http://meanjs.org/), a fork [Riess.js](https://github.com/lirantal/Riess.js). Its creators stopped working on it, we wished to take the project over. We want to create stacks with this mindset.',
        },
        {
          icon: 'fa-solid fa-file-lines',
          color: '#2980b9',
          subtitle: 'Ressources',
          text: '[Start a project and keep it updated ?](https://blog.weareopensource.me/start-a-project-and-maintain-updates/)<br /><br /> - Deployment: [Rancher](https://blog.weareopensource.me/tag/rancher-2/) - [CapRover](https://blog.weareopensource.me/node/) <br /> - Code: [JS](https://blog.weareopensource.me/js-knwoledges/) - [Swift](https://blog.weareopensource.me/js-knwoledges-2/)  <br /> - Other: [Commits](https://github.com/weareopensource/conventional-changelog) - [Server](https://blog.weareopensource.me/setup-debian-server/) - [Tools](https://blog.weareopensource.me/us/) <br />',
        },
        {
          icon: 'fa-solid fa-binoculars',
          color: '#f39c12',
          subtitle: 'Vision',
          text: 'We dream of creating stacks in multiple languages, [Vue](https://github.com/weareopensource/Vue), [Node](https://github.com/weareopensource/Node), [Swift](https://github.com/weareopensource/Swift) ..., aligned on features & architecture. We want to allow anyone to create a full-stack on-demand and keep it updated easily.',
        },
      ],
    },
    install: {
      style: {
        section: {
          background: 'surface',
        },
        card: {
          background: 'background',
        },
      },
      content: [
        {
          icon: 'fa-solid fa-comment',
          color: '#1abc9c',
          title: 'Smooth setup!',
          subtitle: 'Clone our stacks',
          text: 'Start by [cloning your preferred stacks](https://blog.weareopensource.me/start-a-project-and-maintain-updates/) while keeping our repository as a git remote to seamlessly follow updates. Just manage the merges and minimally edit the stack for ease of use.',
        },
        {
          icon: 'fa-solid fa-user',
          color: '#1abc9c',
          title: 'Configuration',
          subtitle: 'Setup your content',
          text: 'Configure the stacks to communicate with each other in seconds. Our homepage view includes all examples from this actual web page you are visiting, just configure them.',
        },
        {
          icon: 'fa-solid fa-hotel',
          color: '#1abc9c',
          title: 'Host',
          subtitle: 'Deploy to prod',
          text: 'Deploy the entire setup through your favorite CI/CD and start developing your features. Think of each feature as an independent, reusable CRUD module, without editing the stack.',
        },
      ],
    },
    designs: {
      style: {
        section: {
          background: 'background',
        },
      },
      slide: {
        height: '600px',
        interval: 6000,
      },
      content: [
        {
          img: { src: '/images/slide01.webp' },
        },
        {
          img: { src: '/images/slide02.webp' },
        },
      ],
    },
    partners: {
      style: {
        section: {
          background: 'surface',
        },
        card: {
          background: 'surface',
        },
        size: '200px',
      },
      title: 'Examples with our stacks',
      content: [
        {
          img: '/images/partner01.webp',
          link: 'https://comes.io',
          subtitle: 'Comes.io',
          text: 'Like a travel agency for your weekends and hobbies, we will monitor your perfect conditions and alert you when all are met. Never miss wonderful moments again, discovery or family weekends, and spot the ideal days for surfing, skiing, golfing, fishing ...',
        },
        {
          img: '/images/partner02.webp',
          link: 'https://foxdeluxe.com',
          subtitle: 'FoxDeluxe',
          text: 'FoxDeLuxe is an innovative platform designed for savvy businesses seeking to gain a competitive edge. It provides comprehensive tools for real-time market analysis, trend tracking, and strategic pricing insights, empowering you to make data-driven decisions and optimize your profitability effortlessly.',
        },
      ],
    },
    blog: {
      style: {
        section: {
          background: 'background',
        },
      },
      slide: {
        interval: 15000,
      },
      title: 'Some contents to read',
      url: 'https://blog.weareopensource.me',
      key: '0415f48774e7c49c713204f787',
    },
    stats: {
      content: [
        {
          value: '0',
          title: 'Tasks',
        },
        {
          value: '0',
          title: 'Releases',
        },
        {
          value: '0',
          title: 'Users',
        },
        {
          value: '50m',
          title: 'Total Downloads',
        },
      ],
    },
    contact: {
      style: {
        section: {
          background: 'background',
        },
      },
      title: 'Feel free to contact us',
      mail: 'mailto:pierre@weareopensource.me',
    },
  },
  pages: {
    style: {
      section: {
        background: 'background',
      },
      card: {
        background: 'surface',
      },
    },
  },
  footer: {
    links: [
      {
        title: 'Useful',
        items: [
          {
            // set null to hide
            label: 'Blog',
            icon: 'fa-solid fa-rss',
            url: 'https://blog.weareopensource.me',
          },
          {
            label: 'Twitter',
            icon: 'fa-brands fa-twitter',
            url: 'https://weareopensource.me',
          },
        ],
      },
      {
        title: 'About',
        items: [
          {
            // set null to hide
            label: 'Us ?',
            icon: 'fa-solid fa-users',
            url: '/team',
          },
          {
            label: 'Changelogs',
            icon: 'fa-solid fa-clipboard-list',
            url: '/changelogs',
          },
          {
            label: 'WAOS 2023',
            icon: 'fa-regular fa-copyright',
            url: 'https://weareopensource.me',
          },
        ],
      },
      {
        title: 'Others',
        items: [
          {
            // set null to hide
            label: 'T&C / CGU',
            icon: 'fa-solid fa-file-lines',
            url: '/pages/terms',
          },
          {
            label: 'Legal',
            icon: 'fa-solid fa-stamp',
            url: '/pages/legal',
          },
        ],
      },
    ],
  },
};
