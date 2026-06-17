# Docs Module

In-app documentation surface (`/docs`) — a guide reader + an in-theme OpenAPI
reference, rendered from a backend the **consumer** serves. The module owns only
the client-side knobs; guides and the spec live downstream.

Activation is gated by `config.modules.docs.activated` (off by default in the
stack) — enable it in the downstream config.

## Backend contract (consumed, public, unauthenticated)

```text
GET /api/public/docs/           → guide tree   { data: { categories: [...] } }
GET /api/public/docs/:slug.md   → article markdown (raw text/markdown body)
GET /api/spec.json              → merged OpenAPI 3 spec (JSON)
```

The `docs` path segment is the `config.api.endPoints.docs` key (default `docs`) —
the service composes `${api.base}/public/${endPoints.docs}` — and the guide tree is
fetched with a trailing slash (`…/public/docs/`).

Wire tree shape (one category):

```js
{ id, label, guides: [{ slug, title, persona, order, summary, anchor? }] }
```

`normalizeTree` (a named export of `stores/docs.store.js`, not a method on the store
instance) maps it to the canonical `{ slug, title, order, articles }` shape every
consumer reads. `anchor` is **optional** (a guide's top heading id) —
see *Cross-links* below. Reading is fail-soft: an absent field is `undefined`, never
required. The wire fixture (`tests/fixtures/docsTree.api.js`) is the single source of
truth for this contract.

## Routes (`router/docs.router.js`)

```text
/docs                  — guide home (persona doors + quickstart + category grid)
/docs/api              — in-theme OpenAPI reference (renders /api/spec.json natively)
/docs/:category/:slug  — article (markdown body + ToC + prev/next)
```

## Rendering (`composables/useDocsPage.js`)

`useDocsPage(slug, { fetcher, meta, tree })` resolves a slug → sanitized HTML + a
heading ToC + extracted runnable examples. One pipeline (marked + DOMPurify), with:

- **Heading anchors** — h2/h3 ids feed the ToC (`<DocsToc>`); deep-linkable.
- **Runnable examples** — consecutive fenced blocks are lifted into `examples` and
  replaced with a `data-docs-example="N"` marker the article view splits on to mount a
  `<DocsCodeblock>` (language tabs + copy-with-my-key). Each emitted marker carries a
  per-render nonce so author-injected markers are stripped before the split.
- **Cross-links** — a bare `#anchor` that targets a *different* guide is rewritten to
  that guide's `/docs/:category/:slug#anchor` route; in-file anchors are left
  untouched. The index is built from `tree`: keyed by each guide's `slug` (resolves
  `anchor === slug` cross-refs day-one) and by the optional authoritative `anchor`
  (wins on collision). In-file detection prescans every heading id. Fail-soft: an
  absent tree or unknown/ambiguous anchor leaves the link unchanged.

## Config (`config/docs.config.js`)

Downstream overrides `config.docs.*`:

- `home` — landing copy · `personas` — the persona doors (each `target.category`) ·
  `quickstart` — hero copy + shell snippet.
- `reference.tagGuides` — OpenAPI tag → docs category map (renders a "Read the guide"
  cross-link when both exist; empty by default so nothing 404s).
- `search` — `label`/`placeholder`/`idleLabel` copy for the search modal, a
  dependency-free client-side fuzzy match (subsequence over guide titles/summaries) —
  no external service or setup.

## Search · Nav

`<DocsSearch>` (⌘K / Ctrl+K / `/`) · `useDocsNav` resolves a category to its first article
(robust to content changes) · `<DocsNav>` renders the persistent sidebar tree.
