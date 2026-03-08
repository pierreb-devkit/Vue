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
    },
  },
  header: { display: false },
  footer: { links: [], variant: 'default' },
  cookie: { prefix: 'devkit' },
};
