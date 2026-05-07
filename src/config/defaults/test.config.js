export default {
  app: {
    title: 'Test App',
    description: 'Test description',
    keywords: 'test, keywords',
    author: 'test@example.com',
    lang: 'fr',
    url: 'https://example.com',
    seo: {
      og: {
        type: 'website',
        image: 'https://example.com/og.jpg',
        twitterCard: 'summary_large_image',
        twitterSite: '@testhandle',
      },
      preconnect: ['https://fonts.googleapis.com', 'https://cdn.example.com'],
      schema: {
        enabled: false,
        type: 'Person',
        name: 'Test User',
        sameAs: ['https://github.com/test-user'],
      },
      robots: {
        enabled: true,
        rules: [{ userAgent: '*', allow: '/' }],
      },
      sitemap: {
        enabled: true,
        routes: [
          { path: '/', priority: 1.0, changefreq: 'weekly' },
          { path: '/about', priority: 0.8, changefreq: 'monthly' },
        ],
      },
      manifest: {
        enabled: true,
        display: 'standalone',
      },
    },
  },
  vuetify: {
    theme: {
      snackbar: { status: false },
      themes: {
        light: {
          colors: {
            primary: '#1abc9c',
          },
        },
      },
    },
  },
  header: { display: false },
  footer: { links: [], variant: 'default' },
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
      billing: 'billing',
    },
  },
  modules: {
    tasks: { activated: true },
    billing: { activated: true },
    organizations: { activated: true },
    analytics: { activated: true },
    admin: { activated: true },
    legal: { activated: true },
  },
  cookie: { prefix: 'devkit' },
  sign: { route: '/', in: true, up: true },
};
