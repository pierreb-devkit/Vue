export default {
  app: {
    title: 'DevKit', // app name — displayed in header, browser tab, meta tags
    subtitle: 'welcome to demo.', // short tagline
    description: 'Vue - Boilerplate Front : Vuetify, Axios, Jest, Cypress (Alpha) ', // <meta name="description">
    keywords: 'vue, vuetify, axios, jest, cypress', // <meta name="keywords">
    author: 'pierre@devkit.me', // <meta name="author">
    icon: 'fa-solid fa-earth-americas', // FontAwesome icon class for app icon
    lang: 'en', // html lang attribute — 'en' | 'fr' | 'de' | 'es' | etc.
    url: 'http://localhost:8080', // canonical base URL — override in production
    seo: {
      og: {
        type: 'website', // og:type — 'website' | 'article' | 'product' | 'profile'
        image: '', // absolute URL to share image (1200x630 recommended), empty = omitted
        twitterCard: 'summary_large_image', // 'summary' | 'summary_large_image'
        twitterSite: '', // Twitter @handle (e.g. '@pierreb'), empty = omitted
      },
      schema: {
        enabled: false, // true to inject JSON-LD structured data in <head>
        type: 'Person', // Schema.org type — 'Person' | 'Organization'
        name: '', // entity name (e.g. 'Pierre Brisorgueil')
        sameAs: [], // profile URLs for cross-linking: GitHub, LinkedIn, Twitter…
      },
      // Pre-rendering: generates static HTML at build time so crawlers receive
      // real content instead of an empty <div id="app"></div>.
      // Only '/' is pre-rendered by default — downstream projects can add more
      // routes but should keep the list minimal (each route spawns a headless
      // browser page during build).
      // The '/' route should map to whatever page the project wants indexed
      // (home by default).
      prerender: {
        enabled: false, // true to pre-render routes during production build
        routes: ['/'], // list of routes to pre-render
      },
    },
  },
  port: 8080, // dev server port (used by vite.config.js)
  api: {
    protocol: 'http', // 'http' | 'https'
    host: 'localhost', // API server hostname
    port: '3000', // API server port
    base: 'api', // API base path prefix (e.g. 'api' → /api/...)
    endPoints: { // named API endpoint paths, keyed by module
      home: 'home',
      auth: 'auth',
      users: 'users',
      tasks: 'tasks',
    },
  },
  cookie: {
    prefix: 'devkit', // prefix for all cookies (e.g. 'devkit' → 'devkit_token')
  },
  whitelists: {
    users: {
      roles: ['user', 'admin'], // allowed user roles for role-based UI rendering
    },
  },
  analytics: {
    posthog: { // PostHog analytics — uncomment host + key to enable
      // host: 'https://app.posthog.com', // PostHog instance URL
      // key: 'ph_project_api_key', // PostHog project API key
    },
  },
};
