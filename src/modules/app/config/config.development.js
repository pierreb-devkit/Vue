export default {
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
        colorMode: 'light',
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
        background: '#2c3e50',
        color: '#FFFFFF',
        colorMode: 'light',
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
      file: null, // image path or null to use text title
      width: '120px',
    },
    title: true, // display text title when logo.file is null
    links: [
      // top left
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
    shortcuts: [
      {
        title: 'Get Started - free',
        url: 'https://blog.devkit.me',
        variant: 'flat',
      },
    ],
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
        title: 'Useful',
        items: [
          {
            // set null to hide
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
