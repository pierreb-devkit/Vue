module.exports = {
  app: {
    title: 'WAOS Dev',
    logo: 'logo.png', // null to use title by default
    subtitle: 'welcome to demo.',
    description: 'Vue - Boilerplate Front : Vuetify, Axios, Jest, Cypress (Alpha) ',
    keywords: 'vue, vuetify, axios, jest, cypress',
  },
  port: 8080, // only available for dev env
  api: {
    protocol: 'http',
    host: 'localhost',
    port: '3000',
    base: 'api',
    endPoints: {
      core: 'core',
      auth: 'auth',
      users: 'users',
      subscriptions: 'subscriptions',
      tasks: 'tasks',
    },
  },
  sign: {
    route: '/tasks', // route push after sign in/up
  },
  cookie: {
    prefix: 'waos',
  },
  analytics: {
    matomo: {
      // host: 'https://mtm.weareopensource.me',
      // siteId: 2,
      // router: this.$router, // Enables automatically registering pageviews on the router
      // trackerFileName: 'matomo', // Changes the default .js and .php endpoint's filename
      // enableLinkTracking: true, // Enables link tracking on regular links. Note that this won't work for routing links (ie. internal Vue router links)
      // requireConsent: false, // Require consent before sending tracking information to matomo
      // trackInitialView: true, // Whether to track the initial page view
      // disableCookies: false, // Run Matomo without cookies
      // enableHeartBeatTimer: false, // Enable the heartbeat timer
      // heartBeatTimerInterval: 15, // Set the heartbeat timer interval
      // debug: false, // Whether or not to log debug information
      // userId: undefined, // UserID passed to Matom
      // cookieDomain: undefined, // Share the tracking cookie across subdomains
      // domains: undefined, // Tell Matomo the website domain so that clicks on these domains are not tracked as 'Outlinks'
      // preInitActions: [],
    },
  },
  vuetify: {
    theme: {
      dark: 'auto', // dark theme true / false / auto (based on prefers-color-scheme)
      flat: true, // flat by default
      footer: false, // display footer
      signin: true, // display signin link
      signup: true, // display signup link
      snackbar: {
        // kind of notifications on requests
        status: true, // activate for error
        methods: ['post', 'put'], // show on sucess depends of methods
        sucessColor: 'success',
        errorColor: 'error',
      },
      navigation: {
        displayIfLogged: false, // show nav only if user is logged (easy for one page site)
        background: undefined, // url / undefined
        selectBorder: 'secondary', // color / undefined
      },
      themes: {
        dark: {
          primary: '#34495e',
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
        light: {
          primary: '#34495e',
          secondary: '#EE5A24',
          background: '#f3f3f6',
          surface: '#ffffff',
          error: '#EA2027',
          success: '#119178',
          onPrimary: '#ffffff',
          onSecondary: '#FFFFFF',
          onBackground: '#1d1d1f',
          onSurface: '#1d1d1f',
          onError: '#FFFFFF',
          onSuccess: '#FFFFFF',
        },
      },
      options: {
        customProperties: true,
      },
    },
    icons: {
      iconfont: 'fa',
    },
    drawer: {
      model: null,
      type: 'mini', // default / permanent / temporary / mini
      clipped: true, // fixed
      floating: true,
      mini: true, // mini or full
    },
  },
  header: {
    links: [
      // top left
      {
        label: 'Blog',
        url: 'https://blog.weareopensource.me',
      },
    ],
    socials: [
      // top right icons
      {
        icon: 'fab fa-github',
        label: 'Github',
        url: 'https://github.com/weareopensource/',
      },
    ],
  },
  home: {
    subscriptions: true, // disbale / enable
    temporalBackground: 'https://blog.weareopensource.me/content/images/2020/06', // one by hour 00.jpg, 01.jpg; 02.jpg ... set to null default background would be in @/assets/images/background.jpg
    abouts: [
      {
        title: 'About Us',
        text:
          '[WAOS](https://blog.weareopensource.me/us/)"s goal is to simplify the **start** of new **tech projects** / **startups**. As we know It"s must be **fast**, **efficient** while **avoiding the refactor** afterward. So whether through the creation of [Open-Source](https://github.com/weareopensource) **stacks** / **tools** or **articles**, we **share our knowledge** around this subject.',
        image: 'https://avatars3.githubusercontent.com/u/8588816?s=200&v=4',
        button: 'Github',
        link: 'https://github.com/weareopensource',
      },
    ],
    features: {
      title: 'Vuetify features',
      data: [
        {
          icon: 'fa-users',
          title: 'Vibrant Community',
          text:
            '**Lorem** ipsum dolor sit amet consectetur adipisicing elit. Iusto cupiditate sint possimus quidem atque harum excepturi nemo velit tempora! Enim inventore fuga, qui ipsum eveniet facilis obcaecati corrupti asperiores nam',
          // color: 'red' background color option
        },
        {
          icon: 'fa-cloud-upload-alt',
          title: 'Frequent Updates',
          text:
            '**Sed** ut elementum justo. Suspendisse non justo enim. Vestibulum cursus mauris dui, a luctus ex blandit. Lorem ipsum dolor sit amet consectetur adipisicing elit. qui ipsum eveniet facilis obcaecati corrupti consectetur adipisicing elit.',
        },
        {
          icon: 'fa-history',
          title: 'Long-term Support',
          text:
            '**Lorem** ipsum dolor sit amet consectetur adipisicing elit. Iusto cupiditate sint possimus quidem atque harum excepturi nemo velit tempora! Enim inventore fuga, qui ipsum eveniet facilis obcaecati corrupti asperiores nam',
        },
      ],
    },
    slideshow: {
      title: 'Demos',
      data: [
        {
          img:
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80',
          icon: 'fa-users',
          title: 'Vibrant Community',
          text:
            '**Lorem** ipsum dolor sit amet consectetur adipisicing elit. Iusto cupiditate sint ...',
          // color: 'red'
          // position: 'end', start / center / end text position for full slideshow only
          // dark: true, start / center / end text position for full slideshow only dark / light option for image => 01-dark.jpg 01-light.jpg
        },
        {
          img:
            'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80',
          icon: 'fa-cloud-upload-alt',
          title: 'Frequent Updates',
          // color: 'red'
          // text: '**Sed** ut elementum justo. Suspendisse non justo enim. Vestibulum cursus mauris dui, a luctus ex blandit. Lorem ipsum dolor sit amet consectetur adipisicing elit. qui ipsum eveniet facilis obcaecati corrupti consectetur adipisicing elit.',
        },
      ],
    },
    stats: {
      background:
        'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80',
      data: [
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
    blog: {
      // actually dev for Ghost Blog
      title: 'Blog',
      url: 'https://blog.weareopensource.me',
      key: '0415f48774e7c49c713204f787',
    },
    contact: {
      title: 'Contact Us',
      mail: 'mailto:pierre@weareopensource.me',
    },
    links: [
      {
        title: 'Useful',
        items: [
          {
            // set null to hide
            label: 'Blog',
            icon: 'fa-rss',
            url: 'https://blog.weareopensource.me',
          },
        ],
      },
      {
        title: 'About',
        items: [
          {
            // set null to hide
            label: 'Changelogs',
            icon: 'fa-clipboard-list',
            url: '/changelogs',
          },
        ],
      },
      {
        title: 'Others',
        items: [
          {
            label: 'Twitter',
            icon: 'fab fa-twitter',
            url: 'https://weareopensource.me',
          },
        ],
      },
    ],
  },
};
