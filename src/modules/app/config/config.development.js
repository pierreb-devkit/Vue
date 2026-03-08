export default {
  vuetify: {
    theme: {
      dark: 'auto', // true | false | 'auto' (follows system prefers-color-scheme)
      flat: true, // true removes elevation/shadow from app-bar and cards globally
      rounded: 'rounded-lg', // 'rounded-0' | 'rounded-sm' | 'rounded' | 'rounded-lg' | 'rounded-xl' | 'rounded-pill'
      maxWidth: '1200px', // max content width for header and page containers (CSS value)
      snackbar: {
        status: true, // true to show error notifications on failed API requests
        methods: ['post', 'put'], // HTTP methods that also trigger success notifications
        sucessColor: 'success', // Vuetify color name for success toasts
        errorColor: 'error', // Vuetify color name for error toasts
      },
      header: {
        background: '#2c3e50', // header background color (hex) — used for mobile menu shortcut buttons
        color: '#FFFFFF', // header text color (hex) — used for mobile hamburger icon
        colorMode: null, // 'light' (white text) | 'dark' (dark text) | null (theme's onSurface, recommended for 'float')
        opacity: 0.5, // liquid glass background opacity (0 = transparent glass, 0.5 = balanced, 1 = solid opaque)
        scrollBehavior: 'float', // 'float' (shrink to pill on scroll) | 'hide' (hide/show on scroll) | undefined (static)
        scrollThreshold: 50, // pixels before float transition triggers (only with 'float')
      },
      navigation: {
        background: '#2c3e50', // drawer background color (hex)
        color: '#FFFFFF', // drawer text/icon color (hex)
        drawer: {
          floating: true, // true for floating drawer with margin
          expand: true, // true to expand rail on hover (show labels)
          rail: true, // true for compact icon-only rail mode
        },
      },
      themes: { // Vuetify color palettes — 'on' prefixed = text color on that background
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
        customProperties: true, // true to generate CSS custom properties for each theme color
      },
    },
    icons: {
      defaultSet: 'fa', // icon set — 'fa' (Font Awesome) | 'mdi' (Material Design Icons)
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
        title: 'Ressources',
        sublinks: [
          {
            icon: 'fa-regular fa-newspaper',
            title: 'Blog',
            subtitle: 'Follow our updates and activities',
            url: 'https://blog.devkit.me',
          },
        ],
      },
    ],
    shortcuts: [ // CTA buttons (right side) — { title, url, variant: 'flat'|'outlined'|'elevated'|'tonal'|'text'|'plain' }
      {
        title: 'Get Started - free',
        url: 'https://blog.devkit.me',
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
