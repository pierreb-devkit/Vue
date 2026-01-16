export default {
  // ============================================================
  // PIERRE BRISORGUEIL - PERSONAL PORTFOLIO
  // ============================================================
  // Site personnel minimaliste one-page
  // Structure: Hero → About → Focus → Projects → Open Source → Freelance → Contact

  app: {
    title: 'Pierre Brisorgueil',
    subtitle: 'Senior Engineering Manager',
    description:
      'Pierre Brisorgueil - Senior Engineering Manager. Building digital products from idea to scale. From strategy to production. Node, Vue, Swift.',
    keywords:
      'pierre brisorgueil, engineering manager, fullstack developer, nodejs, vuejs, swift, opensource, comes.io, montaine, startup, freelance',
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
        sucessColor: 'success',
        errorColor: 'error',
      },
      header: {
        background: '#1a1a2e',
        color: '#FFFFFF',
        opacity: 95,
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
            primary: '#0ea5e9',
            secondary: '#8b5cf6',
            background: '#fafafa',
            surface: '#ffffff',
            error: '#ef4444',
            success: '#10b981',
            onPrimary: '#ffffff',
            onSecondary: '#FFFFFF',
            onBackground: '#18181b',
            onSurface: '#18181b',
            onError: '#FFFFFF',
            onSuccess: '#FFFFFF',
          },
        },
        dark: {
          colors: {
            primary: '#0ea5e9',
            secondary: '#8b5cf6',
            background: '#0f0f14',
            surface: '#1a1a24',
            error: '#f87171',
            success: '#34d399',
            onPrimary: '#FFFFFF',
            onSecondary: '#FFFFFF',
            onBackground: '#fafafa',
            onSurface: '#fafafa',
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
      subtitle: 'Senior Engineering Manager — Building digital products from idea to scale.',
      button: {
        title: 'Get in touch',
        color: '#0ea5e9',
        link: '#contact',
      },
      blur: {
        animationSpeed: 0.8,
        light: {
          backgroundColors: ['#e0f2fe', '#dbeafe', '#e0e7ff', '#ede9fe', '#fae8ff'],
          haloColors: ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'],
        },
        dark: {
          backgroundColors: ['#0c0c14', '#0f172a', '#1e1b4b', '#1a1a2e', '#0d0d12'],
          haloColors: ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'],
        },
      },
    },

    // === ABOUT - Mon parcours ===
    about: {
      icon: 'fa-solid fa-user',
      title: 'About',
      variant: 'alternate',
      content: [
        {
          subtitle: 'Who I am',
          text: "I'm a **Senior Engineering Manager** with 10+ years of experience building digital products — from early-stage startups to scale-ups. I've led cross-functional teams, shipped products end-to-end, and contributed to company growth through **technical leadership** and **go-to-market execution**.\n\nI believe in pragmatic engineering: choosing the right tool for the job, shipping fast, and iterating based on real feedback.",
          fullWidth: true,
          alignment: 'left',
        },
      ],
    },

    // === SERVICES - Focus areas ===
    services: {
      icon: 'fa-solid fa-crosshairs',
      title: 'Focus Areas',
      alignment: 'center',
      variant: 'default',
      content: [
        {
          serviceIcon: 'fa-solid fa-rocket',
          color: '#0ea5e9',
          subtitle: 'Growth & GTM',
          text: 'From **product-market fit** to **scale**. I help teams define positioning, build MVPs, and iterate quickly based on user feedback.',
        },
        {
          serviceIcon: 'fa-solid fa-handshake',
          color: '#8b5cf6',
          subtitle: 'Sales Experience',
          text: 'Building products is one thing, **selling them** is another. I bring a sales-aware engineering mindset.',
        },
        {
          serviceIcon: 'fa-solid fa-hammer',
          color: '#10b981',
          subtitle: 'Building & Craft',
          text: "I'm a **builder at heart**. Whether it's architecting, coding, or deploying — I enjoy the craft.",
        },
      ],
    },

    // === CAPABILITIES - Tabs interactifs ===
    capabilities: {
      icon: 'fa-solid fa-layer-group',
      title: 'What I Do',
      alignment: 'center',
      variant: 'alternate',
      subBanner: true,
      defaultActiveId: 'engineering',
      items: [
        {
          id: 'engineering',
          label: 'Engineering',
          icon: 'fa-solid fa-code',
          title: 'Technical Leadership',
          description:
            'Building scalable systems with **Node.js**, **Vue.js**, and **Swift**. From architecture design to production deployment, I ensure teams deliver quality software efficiently.',
          cta: {
            text: 'View Open Source',
            link: 'https://github.com/weareopensource',
          },
          image: '/images/card01.webp',
          reversed: false,
        },
        {
          id: 'management',
          label: 'Management',
          icon: 'fa-solid fa-users',
          title: 'Team & Product',
          description:
            'Leading **cross-functional teams**, defining roadmaps, and aligning engineering with business goals. I focus on empowering teams to ship faster while maintaining quality.',
          image: '/images/content01.webp',
          reversed: true,
        },
        {
          id: 'projects',
          label: 'Projects',
          icon: 'fa-solid fa-folder-open',
          title: 'Side Projects',
          description:
            'Building products like **Comes.io** (event platform), **Montaine.me** (AI content), and **L0u.me** (URL shortener). Each project is an opportunity to learn and experiment.',
          cta: {
            text: 'Visit Comes.io',
            link: 'https://comes.io',
          },
          image: '/images/card02.webp',
          reversed: false,
        },
        {
          id: 'consulting',
          label: 'Consulting',
          icon: 'fa-solid fa-briefcase',
          title: 'Occasional Help',
          description:
            'While employed full-time, I occasionally take on **consulting engagements**: technical due diligence, architecture reviews, startup advisory, or short-term technical leadership.',
          image: '/images/content02.webp',
          reversed: true,
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
          backgroundColors: ['#e0f2fe', '#dbeafe', '#e0e7ff', '#ede9fe', '#fae8ff'],
          haloColors: ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'],
        },
        dark: {
          backgroundColors: ['#0c0c14', '#0f172a', '#1e1b4b', '#1a1a2e', '#0d0d12'],
          haloColors: ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'],
        },
      },
      content: [
        {
          value: '10+',
          title: 'Years Experience',
        },
        {
          value: '50+',
          title: 'Engineers Led',
        },
        {
          value: '5',
          title: 'Products Shipped',
        },
        {
          value: '3',
          title: 'Open Source Stacks',
        },
      ],
    },

    // === CONTACT - Simple ===
    contact: {
      icon: 'fa-solid fa-envelope',
      variant: 'default',
      title: "Let's Connect",
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
        title: 'Connect',
        items: [
          {
            label: 'Email',
            icon: 'fa-solid fa-envelope',
            url: 'mailto:pierre@pierreb.me',
          },
          {
            label: 'GitHub',
            icon: 'fa-brands fa-github',
            url: 'https://github.com/PierreBriworgueil',
          },
          {
            label: 'LinkedIn',
            icon: 'fa-brands fa-linkedin',
            url: 'https://linkedin.com/in/pierrebrisorgueil',
          },
        ],
      },
      {
        title: 'Projects',
        items: [
          {
            label: 'Comes.io',
            icon: 'fa-solid fa-calendar',
            url: 'https://comes.io',
          },
          {
            label: 'Montaine.me',
            icon: 'fa-solid fa-pen',
            url: 'https://montaine.me',
          },
          {
            label: 'WeAreOpenSource',
            icon: 'fa-brands fa-github',
            url: 'https://github.com/weareopensource',
          },
        ],
      },
      {
        title: 'Legal',
        items: [
          {
            label: 'Terms',
            icon: 'fa-solid fa-file-lines',
            url: '/pages/terms',
          },
          {
            label: '© Pierre Brisorgueil',
            icon: 'fa-regular fa-copyright',
            url: '/',
          },
        ],
      },
    ],
  },
};
