export default {
  app: {
    title: 'Pierre Brisorgueil',
    subtitle: 'Engineering Manager & Fullstack Developer',
    description:
      'Pierre Brisorgueil - Engineering Manager, Fullstack Developer, and Open Source enthusiast. Building digital products from idea to scale with Node, Vue, and Swift.',
    keywords: 'pierre brisorgueil, engineering manager, fullstack developer, nodejs, vuejs, swift, opensource, comes.io, devkit',
    author: 'pierre@pierreb.me',
    icon: 'fa-solid fa-code',
  },
  port: 8020,
  api: {
    protocol: 'http',
    host: 'localhost',
    port: '3020',
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
    prefix: 'pierreb',
  },
  oAuth: {
    google: false,
    apple: false,
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
      dark: 'auto',
      flat: true,
      rounded: 'rounded-lg',
      maxWidth: '1400px',
      snackbar: {
        status: true,
        methods: ['post', 'put'],
        sucessColor: 'success',
        errorColor: 'error',
      },
      appbar: {
        background: '#1a1a2e',
        color: '#FFFFFF',
        opacity: 99,
        scrollBehavior: 'hide',
      },
      navigation: {
        background: '#1a1a2e',
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
            primary: '#0f3460',
            secondary: '#e94560',
            background: '#f5f5f7',
            surface: '#ffffff',
            error: '#e01f26',
            success: '#16a085',
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
            primary: '#0f3460',
            secondary: '#e94560',
            background: '#16213e',
            surface: '#1a1a2e',
            error: '#CF6679',
            success: '#16a085',
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
    logo: {
      file: '/images/logo.webp',
      width: '120px',
    },
    title: false,
    links: [
      {
        title: 'Projects',
        sublinks: [
          {
            icon: 'fa-solid fa-sun',
            color: 'secondary',
            title: 'Comes.io',
            subtitle: 'Weather monitoring for your perfect moments',
            url: 'https://comes.io',
          },
          {
            icon: 'fa-solid fa-link',
            color: 'secondary',
            title: 'L0u.me',
            subtitle: 'Smart URL shortener and analytics',
            url: 'https://l0u.me',
          },
          {
            icon: 'fa-solid fa-mountain',
            color: 'secondary',
            title: 'Montaine.me',
            subtitle: 'Mountain conditions and trip planning',
            url: 'https://montaine.me',
          },
        ],
      },
      {
        title: 'Open Source',
        sublinks: [
          {
            icon: 'fa-brands fa-node-js',
            color: 'secondary',
            title: 'Node Stack',
            subtitle: 'Production-ready Node.js backend boilerplate',
            url: 'https://github.com/weareopensource/Node',
          },
          {
            icon: 'fa-brands fa-vuejs',
            color: 'secondary',
            title: 'Vue Stack',
            subtitle: 'Modern Vue 3 frontend boilerplate',
            url: 'https://github.com/weareopensource/Vue',
          },
          {
            icon: 'fa-brands fa-swift',
            color: 'secondary',
            title: 'Swift Stack',
            subtitle: 'iOS app boilerplate with RxSwift',
            url: 'https://github.com/weareopensource/Swift',
          },
        ],
      },
      {
        title: 'Resources',
        sublinks: [
          {
            icon: 'fa-regular fa-newspaper',
            color: 'secondary',
            title: 'Blog',
            subtitle: 'Articles on development and tech',
            url: 'https://blog.pierreb.me',
          },
          {
            icon: 'fa-brands fa-github',
            color: 'secondary',
            title: 'GitHub',
            subtitle: 'Open source projects and contributions',
            url: 'https://github.com/pierrebrisorgueil',
          },
        ],
      },
    ],
    shortcuts: [
      {
        title: 'Contact',
        url: 'mailto:pierre@pierreb.me',
        variant: 'flat',
      },
    ],
  },
  home: {
    lightBackground: '/images/light.webp',
    darkBackground: '/images/dark.webp',
    banner: {
      title: 'Hi, I\'m Pierre <br /> <b><span style="color:#e94560">Engineering & Code.</span></b>',
      subtitle:
        'Engineering Manager & Fullstack Developer — I build digital products from idea to scale, and share open-source tools to help others do the same.',
      button: {
        title: 'Explore my projects →',
        color: '#e94560',
        link: '#projects',
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
          subtitle: 'About Me',
          quote: true,
          text: "With over a decade of experience in **software engineering** and **team leadership**, I specialize in building **scalable products** and empowering **high-performing teams**. From early-stage startups to established companies, I've led technical initiatives across **Node.js**, **Vue.js**, **Swift**, and **cloud infrastructure**. I'm passionate about **open source**, **developer experience**, and turning complex ideas into elegant solutions.",
          button: {
            title: 'View my GitHub',
            link: 'https://github.com/pierrebrisorgueil',
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
      title: 'Personal Projects',
      content: [
        {
          subtitle: 'Comes.io',
          img: '/images/comes.webp',
          text: 'Like a travel agency for your weekends and hobbies, **Comes.io** monitors your perfect conditions and alerts you when all are met. Never miss wonderful moments again — discovery weekends, surfing, skiing, golfing, fishing, and more. Built with **Node.js**, **Vue.js**, and **Swift**.',
        },
        {
          subtitle: 'L0u.me',
          img: '/images/l0u.webp',
          text: 'A smart **URL shortener** with built-in analytics. Track clicks, geographic distribution, and referrers. Simple, fast, and privacy-conscious. Powered by a modern **Node.js** backend with real-time stats.',
        },
        {
          subtitle: 'Montaine.me',
          img: '/images/montaine.webp',
          text: 'Your companion for **mountain adventures**. Check conditions, plan trips, and discover new routes. Aggregates weather, snow reports, and trail data to help you make the most of every outing.',
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
          img: '/images/node-stack.webp',
          text: 'Production-ready backend stack. Runs standalone or with Vue/Swift. Uses Node, Express, MongoDB, and Jest. Features auth, tasks, uploads, and Docker setup.',
          button: {
            title: 'View on GitHub →',
            color: '#68A063',
            link: 'https://github.com/weareopensource/Node',
          },
          style: {
            card: {
              background: '#1d1d1f',
              color: '#FFFFFF',
            },
          },
        },
        {
          subtitle: 'Vue',
          img: '/images/vue-stack.webp',
          reversed: true,
          text: 'Modern Vue 3 stack with JWT auth. Modular architecture, pairs with Node backend. Includes Vuetify, Docker, ESLint, and GitHub Actions.',
          button: {
            title: 'View on GitHub →',
            color: '#42b883',
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
          img: '/images/swift-stack.webp',
          text: 'iOS stack in Beta. Features layered architecture, RxSwift, ReactorKit. Supports auth, tasks, uploads, and push notifications.',
          button: {
            title: 'View on GitHub →',
            color: '#FA7343',
            link: 'https://github.com/weareopensource/Swift',
          },
          style: {
            card: {
              background: '#2c3e50',
              color: '#FFFFFF',
            },
          },
        },
      ],
    },
    ressources: {
      title: 'What I Do',
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
          icon: 'fa-solid fa-users',
          color: '#0f3460',
          subtitle: 'Engineering Leadership',
          text: 'Leading and scaling engineering teams. Building culture, processes, and technical vision. Hiring, mentoring, and growing developers into senior roles.',
        },
        {
          icon: 'fa-solid fa-code',
          color: '#e94560',
          subtitle: 'Fullstack Development',
          text: 'Building end-to-end products with **Node.js**, **Vue.js**, and **Swift**. From APIs and databases to responsive UIs and mobile apps.',
        },
        {
          icon: 'fa-solid fa-rocket',
          color: '#16a085',
          subtitle: 'Open Source',
          text: 'Creating and maintaining open-source stacks and tools. Helping developers and startups ship faster with production-ready boilerplates.',
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
          icon: 'fa-solid fa-lightbulb',
          color: '#e94560',
          title: 'Idea',
          subtitle: 'From concept to plan',
          text: 'Every project starts with a clear vision. I help define the technical roadmap, architecture, and MVP scope to validate ideas quickly.',
        },
        {
          icon: 'fa-solid fa-hammer',
          color: '#e94560',
          title: 'Build',
          subtitle: 'Development & iteration',
          text: 'Rapid development with modern stacks. Continuous integration, testing, and deployment. Ship early, iterate often.',
        },
        {
          icon: 'fa-solid fa-chart-line',
          color: '#e94560',
          title: 'Scale',
          subtitle: 'Growth & optimization',
          text: 'From first users to production scale. Performance optimization, infrastructure, monitoring, and team growth.',
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
      title: 'Featured Work',
      content: [
        {
          img: '/images/comes-logo.webp',
          link: 'https://comes.io',
          subtitle: 'Comes.io',
          text: 'Weather monitoring platform for outdoor enthusiasts. Alerts you when conditions are perfect for surfing, skiing, hiking, and more. Built from scratch with the open-source stacks.',
        },
        {
          img: '/images/waos-logo.webp',
          link: 'https://github.com/weareopensource',
          subtitle: 'WeAreOpenSource',
          text: 'Collection of production-ready boilerplates for Node.js, Vue.js, and Swift. Used by developers and startups worldwide to kickstart projects faster.',
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
      title: 'Latest Articles',
      url: 'https://blog.pierreb.me',
      key: 'YOUR_GHOST_CONTENT_API_KEY',
    },
    stats: {
      content: [
        {
          value: '10+',
          title: 'Years Experience',
        },
        {
          value: '3',
          title: 'Open Source Stacks',
        },
        {
          value: '50k+',
          title: 'Downloads',
        },
        {
          value: '∞',
          title: 'Coffee Consumed',
        },
      ],
    },
    contact: {
      style: {
        section: {
          background: 'background',
        },
      },
      title: 'Get in Touch',
      mail: 'mailto:pierre@pierreb.me',
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
        title: 'Projects',
        items: [
          {
            label: 'Comes.io',
            icon: 'fa-solid fa-sun',
            url: 'https://comes.io',
          },
          {
            label: 'L0u.me',
            icon: 'fa-solid fa-link',
            url: 'https://l0u.me',
          },
          {
            label: 'Montaine.me',
            icon: 'fa-solid fa-mountain',
            url: 'https://montaine.me',
          },
        ],
      },
      {
        title: 'Open Source',
        items: [
          {
            label: 'Node Stack',
            icon: 'fa-brands fa-node-js',
            url: 'https://github.com/weareopensource/Node',
          },
          {
            label: 'Vue Stack',
            icon: 'fa-brands fa-vuejs',
            url: 'https://github.com/weareopensource/Vue',
          },
          {
            label: 'Swift Stack',
            icon: 'fa-brands fa-swift',
            url: 'https://github.com/weareopensource/Swift',
          },
        ],
      },
      {
        title: 'Connect',
        items: [
          {
            label: 'GitHub',
            icon: 'fa-brands fa-github',
            url: 'https://github.com/pierrebrisorgueil',
          },
          {
            label: 'LinkedIn',
            icon: 'fa-brands fa-linkedin',
            url: 'https://linkedin.com/in/pierrebrisorgueil',
          },
          {
            label: '© Pierre Brisorgueil 2026',
            icon: 'fa-regular fa-copyright',
            url: 'https://pierreb.me',
          },
        ],
      },
    ],
  },
};
