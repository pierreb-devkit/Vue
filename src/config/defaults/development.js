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
      tasks: 'tasks',
      subscriptions: 'subscriptions',
    },
  },
  cookie: {
    prefix: 'waos',
  },
  vuetify: {
    theme: {
      dark: 'auto', // dark theme true / false / auto (based on prefers-color-scheme)
      flat: true, // flat by default
      footer: false, // display footer
      signin: false, // display signin link
      signup: true, // display signup link
      snackbar: { // kind of notifications on requests
        status: true, // activate for error
        methods: ['post', 'put'], // show on sucess depends of methods
        sucessColor: 'secondary',
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
          onPrimary: '#FFFFFF',
          onSecondary: '#FFFFFF',
          onBackground: '#FFFFFF',
          onSurface: '#FEFEFE',
          onError: '#000000',
        },
        light: {
          primary: '#34495e',
          secondary: '#d35400',
          background: '#f3f3f6',
          surface: '#ffffff',
          error: '#B00020',
          onPrimary: '#ffffff',
          onSecondary: '#FFFFFF',
          onBackground: '#1d1d1f',
          onSurface: '#1d1d1f',
          onError: '#FFFFFF',
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
    links: [ // top left
      {
        label: 'Blog',
        url: 'https://blog.weareopensource.me',
      },
    ],
    socials: [ // top right icons
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
        text: 'Today, we dreams to create Backs/Fronts, **aligns on feats**, in **multiple languages**, in order to allow anyone to **compose fullstack on demand** (React, Angular, VusJS, Node, Nest, Swift, Go). Feel free to discuss, share other kind of bricks, and invite whoever you want with this mindset to come [help us](https://github.com/weareopensource/). There are so many innovations possible, starting a clean test should be simple.',
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
          text: '**Lorem** ipsum dolor sit amet consectetur adipisicing elit. Iusto cupiditate sint possimus quidem atque harum excepturi nemo velit tempora! Enim inventore fuga, qui ipsum eveniet facilis obcaecati corrupti asperiores nam',
        },
        {
          icon: 'fa-cloud-upload-alt',
          title: 'Frequent Updates',
          text: '**Sed** ut elementum justo. Suspendisse non justo enim. Vestibulum cursus mauris dui, a luctus ex blandit. Lorem ipsum dolor sit amet consectetur adipisicing elit. qui ipsum eveniet facilis obcaecati corrupti consectetur adipisicing elit.',
        },
        {
          icon: 'fa-history',
          title: 'Long-term Support',
          text: '**Lorem** ipsum dolor sit amet consectetur adipisicing elit. Iusto cupiditate sint possimus quidem atque harum excepturi nemo velit tempora! Enim inventore fuga, qui ipsum eveniet facilis obcaecati corrupti asperiores nam',
        },
      ],
    },
    stats: {
      background: 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80',
      data: [
        ['0', 'Tasks'],
        ['0', 'Releases'],
        ['0', 'Users'],
        ['5m', 'Total Downloads'],
      ],
    },
    blog: { // actually dev for Ghost Blog
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
        items: [{ // set null to hide
          label: 'Blog',
          icon: 'fa-rss',
          url: 'https://blog.weareopensource.me',
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
          label: 'Twitter',
          icon: 'fab fa-twitter',
          url: 'https://weareopensource.me',
        }],
      },
    ],
  },
};
