export default {
  vuetify: {
    theme: {
      dark: 'auto', // 'auto' | true | false — auto follows system preference
      flat: true, // true to use flat design (no elevation) by default
      rounded: 'rounded-lg', // Vuetify border-radius class for cards/components
      maxWidth: '1200px', // max content width for centered layouts
      snackbar: {
        status: true, // true to show snackbar notifications on API responses
        methods: ['post', 'put'], // HTTP methods that trigger snackbar feedback
        successColor: 'success', // Vuetify theme color for success snackbars
        errorColor: 'error', // Vuetify theme color for error snackbars
      },
      header: {
        background: '#2c3e50', // header background color (CSS value or hex)
        color: '#FFFFFF', // header text color
        colorMode: null, // null = no forced color mode, 'light' | 'dark' to force
        opacity: 0.5, // header background opacity (0–1)
        scrollBehavior: 'float', // 'float' = shrink to pill on scroll, 'hide' = hide on scroll
        scrollThreshold: 50, // scroll distance (px) before scroll behavior triggers
      },
      navigation: {
        background: '#2c3e50', // navigation drawer background color
        color: '#FFFFFF', // navigation drawer text color
        drawer: {
          floating: true, // true for floating drawer style
          expand: true, // true to expand on hover
          rail: true, // true to show rail (mini) mode by default
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
        customProperties: true, // true to generate CSS custom properties for theme colors
      },
    },
    icons: {
      defaultSet: 'fa', // icon set — 'fa' (FontAwesome) | 'mdi' (Material Design Icons)
    },
  },
  header: {
    display: true, // true to show header on public (non-authenticated) pages
    logo: {
      file: null, // logo image path (e.g. '/images/logo.png') or null for text title
      width: '120px', // logo width (CSS value)
    },
    title: true, // true to show app.title as text when logo.file is null
    links: [ // nav menu items — simple: { title, url } | dropdown: { title, sublinks: [{ icon, title, subtitle, url, color }] }
      {
        title: 'Product',
        sublinks: [
          {
            icon: 'fa-regular fa-star',
            title: 'For startuper',
            subtitle: 'Create faster, Resilient, Easily',
            url: 'https://github.com/devkit/',
          },
          {
            icon: 'fa-solid fa-code',
            title: 'For developer',
            subtitle: 'Learn, develop, fork',
            url: 'https://github.com/devkit/',
          },
        ],
      },
      {
        title: 'Pricing',
        url: '/pricing',
      },
    ],
    shortcuts: [ // CTA buttons (right side) — { title, url, variant: 'flat'|'outlined'|'elevated'|'tonal'|'text'|'plain' }
      {
        title: 'Get Started - free',
        url: '/signup',
        variant: 'flat',
      },
    ],
  },
  pages: {
    style: { // default page styling — background: '#hex' | 'colorName' (Vuetify theme) | 'linear-gradient(...)'
      section: {
        background: 'background',
      },
      card: {
        background: 'surface',
      },
    },
  },
  footer: {
    variant: 'alternate', // 'default' | 'alternate' (surface background)
    links: [ // footer columns — { title, items: [{ label, icon, url }] } — set label: null to hide an item
      {
        title: 'Useful',
        items: [
          {
            label: 'Blog',
            icon: 'fa-solid fa-rss',
            url: 'https://blog.devkit.me',
          },
          {
            label: 'X',
            icon: 'fa-brands fa-x-twitter',
            url: 'https://devkit.me',
          },
        ],
      },
      {
        title: 'About',
        items: [
          {
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
            label: `DevKit ${new Date().getFullYear()}`,
            icon: 'fa-regular fa-copyright',
            url: 'https://devkit.me',
          },
        ],
      },
      {
        title: 'Others',
        items: [
          {
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
