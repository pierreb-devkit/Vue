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
    notFound: {
      title: 'Page Not Found', // heading displayed on the 404 page
      message: 'The page you are looking for does not exist.', // body text below the heading
      buttonText: 'Go Home', // label for the call-to-action button
    },
    seo: {
      og: {
        type: 'website', // og:type — 'website' | 'article' | 'product' | 'profile'
        image: '', // absolute URL to share image (1200x630 recommended), empty = omitted
        twitterCard: 'summary_large_image', // 'summary' | 'summary_large_image'
        twitterSite: '', // Twitter @handle (e.g. '@pierreb'), empty = omitted
      },
      preconnect: [], // URLs to preconnect (e.g. ['https://fonts.googleapis.com'])
      schema: {
        enabled: false, // true to inject JSON-LD structured data in <head>
        type: 'Person', // Schema.org type — 'Person' | 'Organization'
        name: '', // entity name (e.g. 'Pierre Brisorgueil')
        sameAs: [], // profile URLs for cross-linking: GitHub, LinkedIn, Twitter…
      },
      prerender: {
        enabled: false, // true to pre-render routes at build time for SEO
        routes: ['/'], // routes to pre-render (e.g. ['/', '/about'])
      },
      robots: {
        enabled: true, // true to generate robots.txt at build time
        rules: [{ userAgent: '*', allow: '/' }], // crawl directives
      },
      sitemap: {
        enabled: true, // true to generate sitemap.xml at build time
        routes: [{ path: '/', priority: 1.0, changefreq: 'weekly' }], // pages to include
      },
      manifest: {
        enabled: false, // true to generate manifest.json at build time
        display: 'standalone', // 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser'
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
      account: 'account',
      tasks: 'tasks',
      billing: 'billing',
      developers: 'developers',
    },
  },
  admin: {
    // tabs — extra tabs appended after Users & Organizations in /admin
    // each entry: { value: string, label: string, icon?: string, route: string }
    // example:
    // tabs: [
    //   { value: 'billing', label: 'Billing', icon: 'fa-solid fa-credit-card', route: '/admin/billing' },
    // ],
    tabs: [],
  },
  cookie: {
    prefix: 'devkit', // prefix for all cookies (e.g. 'devkit' → 'devkit_token')
  },
  analytics: {
    posthog: { // PostHog analytics — uncomment host + key to enable
      // host: 'https://app.posthog.com', // PostHog instance URL
      // key: 'ph_project_api_key', // PostHog project API key
    },
    sentry: { // Sentry error tracking — set dsn + enabled to activate
      dsn: '', // Sentry DSN (e.g. 'https://examplePublicKey@o0.ingest.sentry.io/0')
      environment: 'development', // environment tag sent with events
      enabled: false, // true to enable Sentry SDK initialization
      tracesSampleRate: 0.1, // performance tracing sample rate (0–1)
    },
  },
};
