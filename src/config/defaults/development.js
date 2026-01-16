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
            title: 'For startuper',
            subtitle: 'Create faster, Resilient, Easily',
            url: 'https://github.com/weareopensource/',
          },
          {
            icon: 'fa-solid fa-code',
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
    // ============================================================
    // HOME PAGE SECTIONS CONFIGURATION
    // ============================================================
    // Each section is optional and can be reordered in your view component.
    // Available variants help adapt sections to your startup's visual identity.
    // All sections support 'variant' property: 'default' | 'alternate'
    // (alternate adds surface background for visual separation)

    // === HERO SECTION ===
    // Purpose: First impression, value proposition, main CTA
    // Best for: Product launches, key messages, immediate engagement
    // Startup use: Lead generation, brand positioning, conversion focus
    // Variants: 'blur' (animated gradient bg) | 'img' (static image bg)
    hero: {
      variant: 'blur',
      title: 'Turn your ideas <br /> <b><span style="color:#55efc4">into a reality.</span></b>',
      subtitle: 'WeAreOpenSource allow you to start projects faster with scalable stacks.',
      button: {
        title: 'Just launched: 2.0',
        color: '#55efc4',
        link: 'https://github.com/weareopensource',
      },
      img: {
        image: '/images/light.webp',
        ratio: 3,
      },
      blur: {
        animationSpeed: 1,
        light: {
          backgroundColors: ['#4a90c2', '#3d7eb0', '#2d6a9e', '#1e5a8c', '#164578'],
          haloColors: ['#0891b2', '#0ea5e9', '#3b82f6', '#0284c7', '#0369a1'],
        },
        dark: {
          backgroundColors: ['#0a0a1a', '#1a1a3e', '#2d2d6b', '#3d3d8a', '#2563eb'],
          haloColors: ['#4f46e5', '#7c3aed', '#2563eb', '#6366f1', '#8b5cf6'],
        },
      },
    },

    // === PRESENTATION SECTION ===
    // Purpose: Product demo, feature highlights with video
    // Best for: Complex products, visual storytelling, engagement
    // Startup use: Product demos, explainer videos, feature showcases
    // Variants: 'default' | 'alternate' - Note: Can be positioned under hero with 'subBanner: true'
    // Style: Set style.video.background to customize video player frame color
    presentation: {
      icon: 'fa-solid fa-play-circle',
      title: 'Product Showcase',
      file: '/videos/highlight.mp4',
      poster: '/videos/highlight-poster.webp',
      subBanner: true,
      variant: 'alternate',
      style: {
        video: {
          background: '#101115',
        },
      },
    },

    // === SOCIAL PROOF SECTION ===
    // Purpose: Build trust with partner/client logos (infinite scroll)
    // Best for: Credibility, trust signals, brand associations
    // Startup use: Show investors, clients, partners, press mentions
    // Variants: 'default' | 'alternate' - Tip: Add 4-8 logos for optimal scroll
    social: {
      icon: 'fa-solid fa-handshake',
      title: 'Trusted Partners',
      variant: 'alternate',
      style: {
        logoHeight: '20px',
        scrollSpeed: 40,
      },
      content: [
        {
          img: '/images/partner01.webp',
          name: 'Comes.io',
          link: 'https://comes.io',
        },
        {
          img: '/images/partner02.webp',
          name: 'FoxDeluxe',
          link: 'https://foxdeluxe.com',
        },
        {
          img: '/images/partner01.webp',
          name: 'Comes.io',
          link: 'https://comes.io',
        },
        {
          img: '/images/partner02.webp',
          name: 'FoxDeluxe',
          link: 'https://foxdeluxe.com',
        },
      ],
    },

    // === ABOUT SECTION ===
    // Purpose: Company story, mission, vision with content blocks
    // Best for: Brand narrative, value propositions, storytelling
    // Startup use: Founding story, mission statement, problem/solution
    // Variants: 'default' | 'alternate' - Layout: text, images, videos in flexible grid
    // Tip: Highly reusable - create multiple instances with different content
    // Style: Set style.video.background to customize video player frame color
    // Content structure: { icon?, title?, subtitle?, text?, button?, img?, video?, reversed?, fullWidth?, alignment? }
    // Video structure: video: { file, poster, background? }
    about: {
      icon: 'fa-solid fa-lightbulb',
      title: 'Our Vision',
      variant: 'default',
      style: {
        video: {
          background: '#101115', // Video player frame background color
        },
      },
      content: [
        {
          subtitle: 'We Are Open Source',
          text: 'Is an all-in-one platform tailored for **developers**, **startups**, and **incubators**, streamlining the process of launching digital projects. With our intuitive stack combining **NodeJS**, **VueJS**, and **Swift**, users can swiftly set up **authentication**, showcase **products**, implement **pricing models**, and handle **subscriptions**. Dive into the new era of rapid development and bring your innovative ideas to life with ease.',
          button: {
            title: 'Follow Us on Github',
            link: 'https://github.com/weareopensource',
          },
        },
      ],
    },

    // === ABOUT (alternate usage) ===
    // Purpose: Another content block section for features/benefits
    // Best for: Multi-section storytelling, feature deep-dives
    // Startup use: Technical features, USPs, detailed benefits
    // Variants: 'default' | 'alternate' - Same component as 'about', different content
    // Style: Set style.video.background to customize video player frame color
    // Content structure: { icon?, title?, subtitle?, text?, button?, img?, video?, reversed?, fullWidth?, alignment? }
    // Video structure: video: { file, poster, background? }
    aboutFeatures: {
      icon: 'fa-solid fa-puzzle-piece',
      title: 'Key Features',
      alignment: 'center',
      variant: 'alternate',
      content: [
        {
          alignment: 'center',
          subtitle: 'Showcase Site !',
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

    // === CAPABILITIES SECTION ===
    // Purpose: Interactive feature tabs with rich content
    // Best for: Complex products, feature comparison, navigation
    // Startup use: Platform features, product capabilities, differentiators
    // Variants: 'default' | 'alternate' - Layout: Horizontal tabs + window with images
    // Tip: Perfect for SaaS products with multiple features
    // Items structure: { id, label, icon, title, description, cta?, image, reversed? }
    capabilities: {
      icon: 'fa-solid fa-layer-group',
      title: 'Core Capabilities',
      alignment: 'center',
      variant: 'default',
      defaultActiveId: 'performance',
      items: [
        {
          id: 'performance',
          label: 'Performance',
          icon: 'fa-solid fa-gauge-high',
          title: 'Lightning Fast',
          description:
            'Built with **performance** in mind from the ground up. Our architecture ensures your application runs smoothly with optimized rendering, lazy loading, and minimal bundle sizes. Experience **sub-second load times** and instant interactions.',
          cta: {
            text: 'Learn More',
            link: '/docs/performance',
          },
          image: '/images/card01.webp',
          reversed: false,
        },
        {
          id: 'security',
          label: 'Security',
          icon: 'fa-solid fa-shield-halved',
          title: 'Enterprise-Grade Security',
          description:
            "Security is not an afterthought. We implement industry-standard **JWT authentication**, **OAuth2 integration**, and robust **data encryption**. Your users' data is protected with the latest security practices.",
          cta: {
            text: 'View Security Guide',
            link: '/docs/security',
          },
          image: '/images/content01.webp',
          reversed: true,
        },
        {
          id: 'scalable',
          label: 'Scalable',
          icon: 'fa-solid fa-arrow-up-right-dots',
          title: 'Built to Scale',
          description:
            'From **prototype to production**, our stack grows with you. **Modular architecture**, **microservices-ready**, and **cloud-native** design ensure your application can handle millions of users without breaking a sweat.',
          cta: {
            text: 'Architecture Guide',
            link: '/docs/architecture',
          },
          image: '/images/card02.webp',
          reversed: false,
        },
        {
          id: 'developer',
          label: 'Developer Experience',
          icon: 'fa-solid fa-code',
          title: 'Developer First',
          description:
            'Focus on building features, not fighting tools. Hot module replacement, **comprehensive testing suite**, **CI/CD pipelines**, and extensive documentation ensure you spend time on what matters - creating great products.',
          cta: {
            text: 'Get Started',
            link: '/docs/quickstart',
          },
          image: '/images/content02.webp',
          reversed: true,
        },
      ],
    },

    // === FEATURES SECTION ===
    // Purpose: Card carousel showcasing products/stacks
    // Best for: Portfolio, product suite, technology stack
    // Startup use: Multiple products, tech stack, offerings
    // Variants: 'default' | 'alternate' - Supports custom card backgrounds/colors per item
    // Content structure: { icon?, title?, subtitle?, text?, button?, img?, reversed?, alignment?, color?, style? }
    features: {
      icon: 'fa-solid fa-cubes',
      title: 'Technology Stack',
      alignment: 'center',
      variant: 'alternate',
      slide: {
        interval: 15000,
      },
      content: [
        {
          subtitle: 'Node',
          img: '/images/card01.webp',
          text: 'Discover our Node stack. Runs standalone or with Vue or Swift. Uses Node, Express, MongoDB, and Jest. Features user auth, tasks, uploads, and Docker setup.',
          color: 'light',
          button: {
            title: 'Just launched: 1.2.1',
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
          color: 'dark',
          button: {
            title: 'Just launched: 1.2.0',
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
          color: 'dark',
          button: {
            title: 'Just launched: 1.3.0',
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
          color: 'dark',
          button: {
            title: 'Just launched: 1.7.0',
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

    // === SERVICES SECTION ===
    // Purpose: Icon grid with services/resources
    // Best for: Features list, resources, quick access points
    // Startup use: Service offerings, resource hub, feature grid
    // Variants: 'default' | 'alternate' - Layout: Responsive grid (icon + title + text)
    // Tip: Keep descriptions concise, use markdown for links
    // Content structure: { serviceIcon, color?, icon?, title?, subtitle?, text?, button? }
    services: {
      icon: 'fa-solid fa-compass',
      title: 'Some ressources to start',
      alignment: 'center',
      variant: 'default',
      content: [
        {
          serviceIcon: 'fa-solid fa-book',
          color: '#16a085',
          subtitle: 'History',
          text: 'This work was initially based on [MEAN.js](http://meanjs.org/), a fork [Riess.js](https://github.com/lirantal/Riess.js). Its creators stopped working on it, we wished to take the project over. We want to create stacks with this mindset.',
        },
        {
          serviceIcon: 'fa-solid fa-file-lines',
          color: '#2980b9',
          subtitle: 'Ressources',
          text: '[Start a project and keep it updated ?](https://blog.weareopensource.me/start-a-project-and-maintain-updates/)<br /><br /> - Deployment: [Rancher](https://blog.weareopensource.me/tag/rancher-2/) - [CapRover](https://blog.weareopensource.me/node/) <br /> - Code: [JS](https://blog.weareopensource.me/js-knwoledges/) - [Swift](https://blog.weareopensource.me/js-knwoledges-2/)  <br /> - Other: [Commits](https://github.com/weareopensource/conventional-changelog) - [Server](https://blog.weareopensource.me/setup-debian-server/) - [Tools](https://blog.weareopensource.me/us/) <br />',
        },
        {
          serviceIcon: 'fa-solid fa-binoculars',
          color: '#f39c12',
          subtitle: 'Vision',
          text: 'We dream of creating stacks in multiple languages, [Vue](https://github.com/weareopensource/Vue), [Node](https://github.com/weareopensource/Node), [Swift](https://github.com/weareopensource/Swift) ..., aligned on features & architecture. We want to allow anyone to create a full-stack on-demand and keep it updated easily.',
        },
      ],
    },

    // === STEPS SECTION ===
    // Purpose: Vertical timeline for processes/journeys
    // Best for: Getting started, onboarding, roadmap
    // Startup use: User onboarding, implementation guide, journey mapping
    // Variants: 'default' | 'alternate' - Layout: Timeline with icons, cards, images
    // Tip: 3-5 steps work best for clarity
    // Content structure: { stepIcon, stepColor, stepIconColor?, title?, icon?, subtitle?, text?, button?, img?, reversed?, alignment? }
    steps: {
      icon: 'fa-solid fa-route',
      title: 'Getting Started',
      alignment: 'center',
      variant: 'alternate',
      content: [
        {
          stepIcon: 'fa-solid fa-comment',
          stepColor: '#1abc9c',
          subtitle: 'Clone our stacks',
          text: 'Start by [cloning your preferred stacks](https://blog.weareopensource.me/start-a-project-and-maintain-updates/) while keeping our repository as a git remote to seamlessly follow updates. Just manage the merges and minimally edit the stack for ease of use.',
        },
        {
          stepIcon: 'fa-solid fa-user',
          stepColor: '#1abc9c',
          subtitle: 'Setup your content',
          text: 'Configure the stacks to communicate with each other in seconds. Our homepage view includes all examples from this actual web page you are visiting, just configure them.',
        },
        {
          stepIcon: 'fa-solid fa-hotel',
          stepColor: '#1abc9c',
          subtitle: 'Deploy to prod',
          text: 'Deploy the entire setup through your favorite CI/CD and start developing your features. Think of each feature as an independent, reusable CRUD module, without editing the stack.',
        },
      ],
    },

    // === GALLERY SECTION ===
    // Purpose: Image carousel/slideshow
    // Best for: Visual portfolio, product screenshots, designs
    // Startup use: Product gallery, case studies, portfolio
    // Variants: 'default' | 'alternate' - Layout: Full-width carousel with overlays
    // Tip: Use high-quality images, consistent aspect ratios
    // Content structure: { img: { src, gradient? }, subtitle?, text?, subimg?, reversed? }
    gallery: {
      icon: 'fa-solid fa-images',
      title: 'Gallery',
      alignment: 'center',
      variant: 'default',
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

    // === ARTICLES SECTION ===
    // Purpose: Blog posts carousel from Ghost CMS
    // Best for: Content marketing, blog highlights, news
    // Startup use: Latest updates, content showcase, thought leadership
    // Variants: 'default' | 'alternate' - Integration: Ghost blog API (requires key)
    articles: {
      icon: 'fa-solid fa-newspaper',
      variant: 'default',
      slide: {
        interval: 15000,
      },
      title: 'Some contents to read',
      url: 'https://blog.weareopensource.me',
      key: '0415f48774e7c49c713204f787',
    },

    // === STATISTICS SECTION ===
    // Purpose: Key metrics and achievements
    // Best for: Social proof, growth metrics, impact showcase
    // Startup use: Traction metrics, user stats, achievements
    // Variants: 'parallax' (image bg) | 'blur' (animated gradient bg)
    // Tip: Use compelling numbers that build credibility
    statistics: {
      icon: 'fa-solid fa-chart-line',
      title: 'Our Impact',
      variant: 'blur', // 'parallax' | 'blur'
      parallax: {
        image: '/images/parallax.webp',
      },
      blur: {
        animationSpeed: 1.5,
        light: {
          backgroundColors: ['#1e3a5f', '#2d4a6f', '#3d5a7f', '#4d6a8f', '#5d7a9f'],
          haloColors: ['#0891b2', '#0ea5e9', '#3b82f6', '#0284c7', '#0369a1'],
        },
        dark: {
          backgroundColors: ['#0a0a1a', '#1a1a3e', '#2d2d6b', '#3d3d8a', '#2563eb'],
          haloColors: ['#4f46e5', '#7c3aed', '#2563eb', '#6366f1', '#8b5cf6'],
        },
      },
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

    // === CONTACT SECTION ===
    // Purpose: Contact form for user inquiries
    // Best for: Lead generation, support requests, feedback
    // Startup use: Customer contact, partnership inquiries, support
    // Variants: 'default' | 'alternate' - Form submits via mailto link
    contact: {
      icon: 'fa-solid fa-envelope',
      variant: 'default',
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
