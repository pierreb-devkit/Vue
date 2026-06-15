/**
 * Docs module config.
 *
 * The docs guide tree is served by the backend (`GET /api/public/docs`); this
 * module owns only the client-side knobs (API endpoint key + the home route's
 * landing copy + persona doors + search backend). Activation is gated via
 * `config.modules.docs.activated` (off by default in the stack) — enable it in
 * the downstream config (e.g. `src/config/defaults/<project>.config.js`).
 *
 * Additive: shipping this file does not enable the module. The route only
 * mounts when `config.modules.docs.activated !== false`.
 *
 * Defaults are GENERIC placeholders. A downstream project overrides
 * `config.docs.*` (personas, quickstart copy, category slugs, reference
 * tag→guide map, search creds) to match its own product and guide tree.
 */
export default {
  api: {
    endPoints: {
      // Public docs endpoint key. The service composes:
      //   `${api.base}/public/${endPoints.docs}`        → guide tree
      //   `${api.base}/public/${endPoints.docs}/:slug.md` → article markdown
      docs: 'docs',
    },
  },
  docs: {
    // Home (/docs) landing copy. The article view (/docs/:category/:slug) renders
    // backend markdown; the home view renders the persona doors + quickstart hero
    // + a job-first category grid built from the backend guide tree.
    home: {
      icon: 'fa-solid fa-book',
      title: 'Documentation',
      subtitle: 'Everything you need to build with the API.',
    },

    // Persona "doors" rendered side-by-side at the top of /docs. Each door is a
    // card that links into the relevant part of the docs. `target.category`
    // points at a category slug from the backend tree — the home view resolves
    // it to that category's first article at render time (robust to content
    // changes), falling back to the category landing if the tree is empty.
    // `target.to` is an optional absolute override (e.g. an external page).
    //
    // GENERIC defaults (Developer / Integrator / Operator). Downstream owns the
    // persona vocabulary + the category slugs these point at.
    personas: [
      {
        key: 'developer',
        icon: 'fa-solid fa-code',
        title: 'Developer',
        subtitle: 'Call the API with one HTTP request. SDKs, auth, and the JSON schema.',
        cta: 'Quickstart →',
        color: 'primary',
        target: { category: 'get-started' },
      },
      {
        key: 'integrator',
        icon: 'fa-solid fa-plug',
        title: 'Integrator',
        subtitle: 'Wire the API into your stack — webhooks, automations, and recipes.',
        cta: 'Integrations →',
        color: 'secondary',
        target: { category: 'integrate' },
      },
      {
        key: 'operator',
        icon: 'fa-solid fa-gauge-high',
        title: 'Operator',
        subtitle: 'Run it in production — limits, monitoring, and best practices.',
        cta: 'Guides →',
        color: 'info',
        target: { category: 'operate' },
      },
    ],

    // Quickstart hero: copy + CTA for the single copy-pasteable example shown on
    // /docs. The literal command/JSON snippets live in the home view
    // (presentational content, not per-environment config — and they contain
    // quote/brace markup the config serializer can't round-trip). `cta.target`
    // resolves the same way personas do.
    quickstart: {
      eyebrow: 'Quickstart',
      title: 'One call. Structured JSON back.',
      subtitle: 'Point the API at your request and get clean, structured data back.',
      language: 'bash',
      cta: { label: 'Read the full quickstart', target: { category: 'get-started' } },
    },

    // In-theme OpenAPI reference (/docs/api). Renders the merged spec served at
    // `GET /api/spec.json` natively (no embedded Redoc) for brand parity — the
    // standalone backend `/api/docs` Redoc UI stays as the untouched fallback.
    // `tagGuides` maps OpenAPI tag names → docs category slugs; when both the
    // tag and the category exist, the group shows a "Read the guide" cross-link
    // (resolved to the category's first article). Downstream owns the tag↔guide
    // vocabulary; empty by default so no cross-link ever 404s.
    reference: {
      icon: 'fa-solid fa-code',
      title: 'API reference',
      subtitle: 'Every endpoint, grouped by resource. Generated from the live OpenAPI spec.',
      tagGuides: {
        // e.g. Items: 'get-started' — left empty by default so no link 404s.
      },
    },

    // Docs search (⌘K / "/"). Two backends, picked at runtime:
    //  - **Algolia DocSearch** when `appId` + `apiKey` + `indexName` are all set.
    //    The hosted index is provisioned out-of-band — apply at
    //    https://docsearch.algolia.com (free for open/public docs), then drop the
    //    returned creds here (env-overridable downstream). `@docsearch/js` is
    //    loaded lazily (variable-specifier dynamic import) so it's an optional
    //    dependency: the build stays green without it.
    //  - **Client-side fuzzy fallback** otherwise — a dependency-free subsequence
    //    match over the guide titles/summaries from the docs store, so search
    //    works locally with zero setup. This is the default until an index lands.
    search: {
      appId: '',
      apiKey: '',
      indexName: '',
      label: 'Search',
      placeholder: 'Search the docs…',
      idleLabel: 'Type to search the documentation.',
    },
  },
};
