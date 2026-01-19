export default {
  // ============================================================
  // PIERRE BRISORGUEIL - PERSONAL PORTFOLIO
  // ============================================================
  // Site personnel minimaliste one-page
  // Structure: Hero → About → Focus → Projects → Open Source → Freelance → Contact

  app: {
    title: 'Pierre Brisorgueil',
    subtitle: 'Senior Engineering Manager Growth & GTM (B2B SaaS)',
    description:
      'Pierre Brisorgueil Senior Engineering Manager (Growth & GTM). Leading product-facing engineering teams across PLG/PLS, monetization, billing, Salesforce and internal tooling. Based in Paris, open to Switzerland.',
    keywords:
      'pierre brisorgueil, engineering manager, growth, GTM, B2B SaaS, PLG, PLS, monetization, billing, salesforce, internal tools, devkit, weareopensource, comes.io, montaine.me, l0u.me',
    author: 'pierre@pierreb.me',
    icon: 'fa-solid fa-terminal',
  },
  port: 8020,
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
    route: '/tasks',
    in: false, // Désactivé pour site portfolio
    up: false, // Désactivé pour site portfolio
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
      rounded: 'rounded-xl',
      maxWidth: '1100px',
      snackbar: {
        status: true,
        methods: ['post', 'put'],
        successColor: 'success',
        errorColor: 'error',
      },
      header: {
        background: '#0b0b0d',
        color: '#FFFFFF',
        opacity: 95,
        scrollBehavior: 'hide',
      },
      navigation: {
        background: '#0b0b0d',
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
            primary: '#2563eb',
            secondary: '#f97316',
            background: '#fafafa',
            surface: '#ffffff',
            error: '#ef4444',
            success: '#10b981',
            onPrimary: '#ffffff',
            onSecondary: '#111827',
            onBackground: '#111827',
            onSurface: '#111827',
            onError: '#FFFFFF',
            onSuccess: '#FFFFFF',
          },
        },
        dark: {
          colors: {
            primary: '#3b82f6',
            secondary: '#fb923c',
            background: '#0b0b0d',
            surface: '#141418',
            error: '#f87171',
            success: '#34d399',
            onPrimary: '#0b0b0d',
            onSecondary: '#0b0b0d',
            onBackground: '#f5f5f5',
            onSurface: '#f5f5f5',
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

  // ============================================================
  // HEADER - Navigation minimaliste avec ancres
  // ============================================================
  header: {
    display: false, // Caché pour site minimaliste
    logo: {
      file: '/images/logo.webp',
      width: '40px',
    },
    title: false,
    links: [],
    shortcuts: [],
  },

  // ============================================================
  // HOME SECTIONS - Minimaliste
  // ============================================================
  home: {
    // === HERO - Identité principale ===
    hero: {
      variant: 'blur',
      title: 'Pierre Brisorgueil',
      subtitle: 'Senior Engineering Manager Growth & GTM. \n\n Leading engineering teams across PLG/PLS, monetization, billing and sales tooling.',
      button: {
        title: 'Contact',
        color: '#2563eb',
        link: '#contact',
      },
      blur: {
        animationSpeed: 0.8,
        light: {
          backgroundColors: ['#9bb2cf', '#ba9c7a', '#b5a45d', '#85a7b9', '#a09e9e'],
          haloColors: ['#2563eb', '#f97316', '#eab308', '#0ea5e9', '#6b7280'],
        },
        dark: {
          backgroundColors: ['#050505', '#0a0a12', '#0f0f0f', '#0c0c10', '#060608'],
          haloColors: ['#215ad4', '#e06915', '#cc9a05', '#0b8ac4', '#505661'],
        },
      },
    },

    // === CAPABILITIES - Focus areas (tabs interactifs) ===
    capabilities: {
      alignment: 'center',
      variant: 'default',
      overlap: true,
      defaultActiveId: 'growth',
      items: [
        {
          id: 'gtm',
          label: 'Growth & GTM',
          icon: 'fa-solid fa-rocket',
          color: '#fff',
          title: 'Growth & GTM',
          description:
            'I translate go-to-market needs into reliable engineering execution for **operations** and **end users**.\n\n' +
            'Typical scope: **activation & onboarding**, self-serve flows, experimentation setup, segmentation, lifecycle messaging, and the tooling required to run this consistently.\n\n' +
            'Recent examples include pragmati AI calls, customer care with MCP, upgrade/setup flows.',
          reversed: false,
          image: '/images/growthandgtm.svg',
        },
        {
          id: 'data',
          label: 'Data',
          icon: 'fa-solid fa-database',
          color: '#fff',
          title: 'Data Platforms',
          description:
            'I make data usable and trustworthy for end users.\n\n' +
            'Common topics: stats, metrics, data quality checks, lightweight pipelines/ETL when required, and “one source of truth” practices.\n\n' +
            'I care a lot about **data visualization**: presenting the right information, at the right time, in the right context — so people can act with confidence.',
          reversed: true,
          image: '/images/dataplatforms.svg',
        },
        {
          id: 'product-engineering',
          label: 'Product Engineering',
          icon: 'fa-solid fa-mobile-screen',
          color: '#fff',
          title: 'Product Engineering',
          description:
            'End-to-end delivery on web and mobile products.\n\n' +
            'Typical scope: platform refactors, design improvements and product features that need clean architecture to evolve.\n\n' +
            'I prefer simple, maintainable solutions and I avoid **over-engineering**. I care a lot about simplicity and design.',
          reversed: false,
          image: '/images/productengineeering.svg',
        },
        {
          id: 'leadership',
          label: 'Leadership',
          icon: 'fa-solid fa-users',
          color: '#fff',
          title: 'Leadership & Team',
          description:
            'Building cohesive teams and helping engineers grow.\n\n' +
            'I focus on clear ownership, predictable delivery habits, coaching, and a culture of constructive feedback.\n\n' +
            'I’m comfortable challenging **over-process** and early **over-investment** when it doesn’t pay off.',
          reversed: true,
          image: '/images/leadership.svg',
        },
        {
          id: 'freelance',
          label: 'Freelance',
          icon: 'fa-solid fa-briefcase',
          color: '#fff',
          title: 'Limited & non-competing',
          description:
            'Short, clearly scoped support outside of my full-time role: **project kickoff**, **architecture/strategy review**, or **technical due diligence**.\n\n' +
            'Usually **1–5 days**. Lightweight approach, no **over-process**, no **over-engineering**.',
          reversed: false,
          video: {
            file: '/videos/freelance.mov',
            playbackRate: 0.5,
          },
        },
      ],
    },

    // === ABOUT - Mon parcours ===
    about: {
      icon: 'fa-solid fa-user',
      title: 'About',
      variant: 'alternate',
      content: [
        {
          subtitle: 'Summary',
          text:
            'Engineering leader with 10+ years across B2B SaaS, data platforms and growth, combining a strong technical background with a pragmatic business mindset. <br/><br/>' +
            'At **TheFork** (Tripadvisor), I lead Growth & GTM engineering across B2B web and mobile, billing, Salesforce and internal tooling, scaling squads (0-20 FTEs), shaping the technical vision, and driving delivery with cross-functional partners. ' +
            'Previously at **Société Générale** (Bank), I built and scaled a **DataViz team** of 0-18 engineers, delivering a reusable data visualization platform and supporting the scale-up of the broader Big Data organization. <br/><br/>' +
            'I keep building outside of work to maintain technical depth, it gives me credibility with engineers and sharper judgment on trade-offs.',
          fullWidth: true,
          alignment: 'left',
        },
      ],
    },

    // === SERVICES - Projects ===
    services: {
      icon: 'fa-solid fa-diagram-project',
      title: 'Projects',
      alignment: 'center',
      variant: 'default',
      content: [
        {
          serviceIcon: 'fa-solid fa-code-branch',
          color: '#2563eb',
          subtitle: 'DevKit',
          text:
            '[DevKit](https://github.com/pierreb-devkit) is an open-source set of **production-minded starter stacks** to bootstrap modern web & mobile products faster. <br /><br />' +
            'Composable frontend/backend building blocks (Vue / Node / Swift), with a shared mindset around **maintainability, updates, and delivery** (patterns, conventions ..). <br /><br />' +
            'Built to start clean, ship early, with a common architecture.',
        },
        {
          serviceIcon: 'fa-solid fa-calendar',
          color: '#f97316',
          subtitle: 'comes.io',
          text:
            '[Comes.io](https://comes.io) is a consumer app that sends **smart alerts** when the right conditions are met for outdoor plans (e.g. surf, ski, weekends). <br /><br />' +
            'End-to-end product: data acquisition (scraping at scale), condition/scoring rules, automation, and user-facing UI. <br /><br />' +
            'Designed as a pragmatic playground to validate ideas quickly with real users and iterate on the signal quality.',
        },
        {
          serviceIcon: 'fa-solid fa-link',
          color: '#6b7280',
          subtitle: 'l0u.me',
          text:
            '[L0u.me](https://l0u.me) is a lightweight tool to **simplify public-data extraction** when APIs don’t exist or are inconsistent. <br /><br />' +
            'Focused on reliability: normalize outputs, alert on changes, and make data reusable as a building block for internal automation. <br /><br />' +
            'Used as a pragmatic component in small pipelines rather than a heavy platform.',
        },
      ],
    },

    // === STATISTICS - Chiffres clés ===
    statistics: {
      icon: 'fa-solid fa-chart-line',
      title: 'Track Record',
      variant: 'blur',
      blur: {
        animationSpeed: 1.5,
        light: {
          backgroundColors: ['#bfdbfe', '#fed7aa', '#fde68a', '#bae6fd', '#e5e5e5'],
          haloColors: ['#2563eb', '#f97316', '#eab308', '#0ea5e9', '#6b7280'],
        },
        dark: {
          backgroundColors: ['#050505', '#0a0a12', '#0f0f0f', '#0c0c10', '#060608'],
          haloColors: ['#3b82f6', '#fb923c', '#facc15', '#38bdf8', '#9ca3af'],
        },
      },
      content: [
        { value: '10+', title: 'XP Years' },
        { value: '0→18', title: 'Team built (DataViz)' },
        { value: '0→4', title: 'Squads scaled (GTM)' },
        { value: '20', title: 'years of dev' },
      ],
    },

    // === CONTACT - Simple ===
    contact: {
      icon: 'fa-solid fa-envelope',
      variant: 'default',
      title: 'Contact',
      mail: 'mailto:pierrebrisorgueil@me.com',
      alignment: 'center',
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
    variant: 'alternate',
    links: [
      {
        title: 'Connect',
        items: [
          { label: 'LinkedIn', icon: 'fa-brands fa-linkedin', url: 'https://www.linkedin.com/in/pierre-brisorgueil/' },
          { label: 'GitHub', icon: 'fa-brands fa-github', url: 'https://github.com/pierrebrisorgueil' },
        ],
      },
      {
        title: 'Projects',
        items: [
          { label: 'comes.io', icon: 'fa-solid fa-calendar', url: 'https://comes.io' },
          { label: 'l0u.me', icon: 'fa-solid fa-link', url: 'https://l0u.me' },
        ],
      },
      {
        title: 'Open Source',
        items: [
          { label: 'DevKit', icon: 'fa-solid fa-code-branch', url: 'https://github.com/pierreb-devkit' },
          { label: '© Pierre Brisorgueil', icon: 'fa-regular fa-copyright', url: '/' },
        ],
      },
    ],
  },
};
