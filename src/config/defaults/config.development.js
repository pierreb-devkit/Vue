export default {
  app: {
    title: 'DevKit',
    subtitle: 'welcome to demo.',
    description: 'Vue - Boilerplate Front : Vuetify, Axios, Jest, Cypress (Alpha) ',
    keywords: 'vue, vuetify, axios, jest, cypress',
    author: 'pierre@devkit.me',
    icon: 'fa-solid fa-earth-americas',
    lang: 'en', // html lang attribute, e.g. 'fr', 'en'
    url: 'http://localhost:8080', // canonical base URL, override in production
    seo: {
      og: {
        type: 'website', // og:type
        image: '', // absolute URL to social share image (1200x630 recommended)
        twitterCard: 'summary_large_image', // 'summary' | 'summary_large_image'
        twitterSite: '', // Twitter @handle of the site, e.g. '@pierreb'
      },
      schema: {
        enabled: false, // set true to inject JSON-LD structured data
        type: 'Person', // 'Person' | 'Organization'
        name: '', // e.g. 'Pierre Brisorgueil'
        sameAs: [], // array of profile URLs: GitHub, LinkedIn, Twitter…
      },
    },
  },
  port: 8080,
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
  cookie: {
    prefix: 'devkit',
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
};
