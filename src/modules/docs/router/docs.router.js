/**
 * Docs module routes.
 *
 * Public guide surface rendered from `GET /api/public/docs`:
 *   /docs                    — guide home (lists the tree)
 *   /docs/api                — in-theme OpenAPI reference (from `GET /api/spec.json`)
 *   /docs/:category/:slug    — article (markdown body + ToC + prev/next)
 *
 * `/docs/api` is declared BEFORE the `/docs/:category/:slug` catch-all so the
 * static segment wins (vue-router prefers static over dynamic, but order keeps
 * the intent explicit). The standalone backend Redoc UI (`/api/docs`) stays
 * untouched as the fallback reference.
 *
 * No CASL `action`/`subject`: docs are public (mirrors the legal pages, which
 * carry no auth meta). Activation is gated by `config.modules.docs.activated`
 * via the `optionalModules` registration in app.router.js — this file just
 * declares the records.
 */
export default [
  {
    path: '/docs',
    name: 'Documentation',
    component: () => import('../views/docs.home.view.vue'),
    meta: {
      icon: 'fa-solid fa-book',
      order: 90, // sidenav sort order (lower = first) — docs sit near the bottom
      footer: true,
    },
  },
  {
    path: '/docs/api',
    name: 'DocumentationReference',
    component: () => import('../views/docs.reference.view.vue'),
    meta: {
      display: false, // hide from sidenav — reached via the docs surface / deep links
    },
  },
  {
    path: '/docs/:category/:slug',
    name: 'DocumentationArticle',
    component: () => import('../views/docs.article.view.vue'),
    meta: {
      display: false, // hide from sidenav — reached via the docs home / deep links
    },
  },
];
