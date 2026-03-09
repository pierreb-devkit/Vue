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
      preconnect: ['https://fonts.googleapis.com', 'https://api.example.com'],
      schema: {
        enabled: false,
        type: 'Person',
        name: 'Test User',
        sameAs: ['https://github.com/test-user'],
      },
    },
  },
  vuetify: {
    theme: {
      snackbar: { status: false },
      themes: {
        light: {
          colors: {
            primary: '#1867C0',
          },
        },
      },
    },
  },
  header: { display: false },
  footer: { links: [], variant: 'default' },
  cookie: { prefix: 'devkit' },
};
