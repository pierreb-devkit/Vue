export default {
  app: {
    title: 'DevKit', // app name — displayed in header, browser tab, meta tags
    subtitle: 'welcome to demo.', // short tagline
    description: 'Vue - Boilerplate Front : Vuetify, Axios, Jest, Cypress (Alpha) ', // <meta name="description">
    keywords: 'vue, vuetify, axios, jest, cypress', // <meta name="keywords">
    author: 'pierre@devkit.me', // <meta name="author">
    icon: 'fa-solid fa-earth-americas', // FontAwesome icon class for app icon (sidenav fallback when logoFile unset)
    logoFile: null, // Optional: path to SVG/PNG (e.g. '/images/logo.svg' in /public) for a branded sidenav logo — takes precedence over icon
    lang: 'en', // html lang attribute — 'en' | 'fr' | 'de' | 'es' | etc.
    url: 'http://localhost:8080', // canonical base URL — override in production
    version: 'dev', // app release version — overridden at build time via DEVKIT_VUE_app_version build-arg
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
    },
  },
  // admin.tabs — extra tabs appended after the built-in admin tabs (Users,
  // Organizations, Readiness, Activity). Contributed by modules via their
  // `{module}.{env}.config.js` fragment (e.g. the standalone `invitations`
  // module adds the Invitations tab), NOT hardcoded here — generateConfig's
  // deepMerge REPLACES arrays, so a global `admin: { tabs: [] }` default would
  // clobber every module-contributed tab. `admin.layout.vue` guards a missing
  // `config.admin.tabs` (Array.isArray → []), so omitting it here is safe.
  // Each entry: { value, label, icon?, route, action?, subject? } (relative route).
  cookie: {
    prefix: 'devkit', // prefix for all cookies (e.g. 'devkit' → 'devkit_token')
  },
  modules: {
    tasks: { activated: true }, // CRUD reference module
    billing: { activated: true }, // Stripe billing & pricing
    organizations: { activated: true }, // multi-org membership
    analytics: { activated: true }, // usage analytics
    admin: { activated: true }, // admin panel
    legal: { activated: true }, // legal pages + cookie consent (routes gated by legal.pages.enabled)
    docs: { activated: false }, // in-app docs (3-persona home, OpenAPI reference, search) — off by default; enable + override config.docs.* downstream
  },
  analytics: {
    posthog: { // PostHog analytics — uncomment host + key to enable
      // host: 'https://eu.i.posthog.com', // PostHog instance URL
      // key: 'ph_project_api_key', // PostHog project API key (public-by-design)
      errorTracking: true, // enable PostHog Error Tracking ($exception events)
      autoCapture: false, // opt-in: auto-capture clicks, inputs, form submissions
      sessionReplay: false, // opt-in: record and replay user sessions (GDPR-sensitive)
      featureFlags: false, // opt-in: fetch and evaluate feature flags
      surveys: false, // opt-in: show in-app PostHog surveys
      webVitals: false, // opt-in: capture Core Web Vitals
      capturePageleave: false, // opt-in: capture page-leave events
    },
  },
};
