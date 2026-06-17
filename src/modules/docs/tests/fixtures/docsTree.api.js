/**
 * REAL `GET /api/public/docs` response shape — `data.categories`.
 *
 * The backend emits categories as `{ id, label, guides: [...] }` and each guide
 * as `{ slug, title, persona, order, summary, anchor? }`. The frontend's canonical
 * shape (`{ slug, title, order, articles: [...] }`) is derived from this by the
 * store's `normalizeTree`. Tests that mocked the *canonical* shape masked the
 * real-API mismatch (empty grid / dead persona links / dead search) — this fixture
 * is the single source of truth for the wire contract so that mismatch can't regress.
 *
 * `anchor` is OPTIONAL: a guide's top-of-file heading id, consumed by the article
 * renderer's cross-link rewrite to resolve a bare `#anchor` that targets a *different*
 * guide (its id need not equal the slug). The `welcome` guide below carries one to
 * lock the field into the wire contract; guides without it still resolve via slug.
 *
 * Minimal but representative: the 3 categories the default config's persona doors
 * target (`get-started`, `integrate`, `operate`), each with ≥1 guide carrying
 * every wire field (slug/title/persona/order/summary [+ optional anchor]).
 */
export const docsTreeApiFixture = {
  categories: [
    {
      id: 'get-started',
      label: 'Get Started',
      guides: [
        {
          slug: 'welcome',
          title: 'Welcome',
          persona: ['developer'],
          order: 0,
          summary: 'What the API is and when to reach for it.',
          anchor: 'welcome-overview',
        },
        {
          slug: 'quickstart',
          title: 'Quickstart',
          persona: ['developer'],
          order: 1,
          summary: 'One HTTP call, structured JSON back.',
        },
      ],
    },
    {
      id: 'integrate',
      label: 'Integrate',
      guides: [
        {
          slug: 'webhooks',
          title: 'Webhooks',
          persona: ['integrator'],
          order: 0,
          summary: 'Wire the API into your stack via webhooks.',
        },
      ],
    },
    {
      id: 'operate',
      label: 'Operate',
      guides: [
        {
          slug: 'rate-limits',
          title: 'Rate limits',
          persona: ['operator'],
          order: 0,
          summary: 'Run it in production within the limits.',
        },
      ],
    },
  ],
};

export default docsTreeApiFixture;
