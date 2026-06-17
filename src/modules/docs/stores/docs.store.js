/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import docsService from '../services/docs.service';

/**
 * Normalize the public docs API tree to the frontend's canonical shape.
 *
 * The backend (`GET /api/public/docs`) emits categories as
 *   `{ id, label, guides: [{ slug, title, persona, order, summary, anchor? }] }`
 * while every consumer in this module (home grid, nav, `useDocsNav`,
 * `orderedArticles`, search) reads the canonical
 *   `{ slug, title, order, articles: [{ slug, title, order, category, summary, persona, anchor? }] }`.
 *
 * `anchor` is OPTIONAL — a guide's top-of-file heading id, consumed by the
 * article renderer's cross-link rewrite (`useDocsPage`) to resolve a bare
 * `#anchor` that targets a *different* guide. Read fail-soft: absent →
 * `undefined`, no consumer requires it, and a backend that doesn't emit it just
 * disables the authoritative half of the cross-link index (the slug fallback
 * still resolves the common `anchor === slug` case).
 *
 * Mapping here, at the single I/O boundary, keeps the rest of the module
 * decoupled from the wire shape. Defensive: tolerates an already-canonical
 * input (`slug`/`title`/`articles`) so tests or a future contract change that
 * adopts the canonical names pass through unchanged.
 *
 * Exported for contract tests (e.g. asserting the docs config persona targets
 * resolve against the *real* API tree shape, not an assumed one).
 *
 * @param {Object|null} raw - The raw tree from the API (or null).
 * @returns {{ categories: Array }} The normalized tree (empty categories when absent).
 */
export function normalizeTree(raw) {
  const categories = Array.isArray(raw?.categories) ? raw.categories : [];
  return {
    categories: categories.map((c, i) => {
      const slug = c?.slug ?? c?.id ?? '';
      const list = Array.isArray(c?.articles)
        ? c.articles
        : Array.isArray(c?.guides)
          ? c.guides
          : [];
      return {
        slug,
        title: c?.title ?? c?.label ?? slug,
        order: c?.order ?? i,
        articles: list.map((g) => ({
          slug: g?.slug,
          title: g?.title,
          order: g?.order ?? 0,
          category: g?.category ?? slug,
          summary: g?.summary,
          persona: g?.persona,
          // Optional authoritative cross-link anchor (see header). `undefined`
          // when the backend doesn't emit it — the renderer falls back to slug.
          anchor: g?.anchor,
        })),
      };
    }),
  };
}

/**
 * Store definition.
 *
 * Caches the guide tree (fetched once, reused across navigation) and the
 * raw markdown of the current article. The rendering (markdown → HTML + ToC)
 * lives in `useDocsPage` — the store stays a thin state + I/O layer.
 *
 * Async action contract: each action sets `this.error` + logs on failure and
 * resolves (does not re-throw) so views degrade to a not-found / empty state
 * without an unhandled rejection.
 */
export const useDocsStore = defineStore('docs', {
  state: () => ({
    // NOTE: `loading` is a single shared flag, not a counter. All three actions
    // cache aggressively (only one HTTP call per resource), so parallel
    // invocations of *different* actions would race on this flag — the
    // earlier-finishing action would clear it while the other is still in flight.
    // In practice every call site is sequential (article view: fetchTree only;
    // reference view: `await fetchTree(); await fetchSpec()`), so this is
    // low-risk (a spinner blip at worst) and adding a counter would be
    // over-engineering. Revisit only if a view ever fans-out both simultaneously.
    loading: false,
    error: null,
    /* Guide tree: `{ categories: [{ slug, title, order, articles: [{ slug, title, category, order }] }] }`. */
    tree: null,
    /* Raw markdown cache keyed by article slug — avoids re-fetching on revisit. */
    articles: {},
    /* Merged OpenAPI 3 spec (`GET /api/spec.json`), cached after first load. */
    spec: null,
  }),

  getters: {
    /**
     * Flattened, order-sorted list of all articles across categories.
     * Drives prev/next navigation in the article view.
     * @param {Object} state
     * @returns {Array<{ slug: string, title: string, category: string }>}
     */
    orderedArticles(state) {
      const categories = Array.isArray(state.tree?.categories) ? state.tree.categories : [];
      const byOrder = (a, b) => (a?.order ?? 0) - (b?.order ?? 0);
      return [...categories]
        .sort(byOrder)
        .flatMap((cat) => {
          const articles = Array.isArray(cat?.articles) ? cat.articles : [];
          return [...articles].sort(byOrder).map((art) => ({
            ...art,
            category: art?.category ?? cat?.slug,
          }));
        });
    },
  },

  actions: {
    /**
     * Fetch the guide tree, caching it after the first successful load.
     * @param {boolean} [force=false] - Bypass the cache and refetch.
     * @returns {Promise<Object|null>} The tree, or null on failure.
     */
    async fetchTree(force = false) {
      if (this.tree && !force) return this.tree;
      this.error = null;
      this.loading = true;
      try {
        const res = await docsService.getDocsTree();
        this.tree = normalizeTree(res?.data?.data ?? res?.data ?? null);
        return this.tree;
      } catch (err) {
        this.error = err?.response?.data?.message || err?.message || 'An error occurred';
        console.error(err);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Fetch a single article's raw markdown, caching it by slug.
     * @param {string} slug - The article slug.
     * @param {boolean} [force=false] - Bypass the cache and refetch.
     * @returns {Promise<string|null>} The raw markdown, or null on failure.
     */
    async fetchArticle(slug, force = false) {
      if (!slug) return null;
      if (this.articles[slug] !== undefined && !force) return this.articles[slug];
      this.error = null;
      this.loading = true;
      try {
        const res = await docsService.getDocArticle(slug);
        const markdown = typeof res?.data === 'string' ? res.data : String(res?.data ?? '');
        this.articles = { ...this.articles, [slug]: markdown };
        return markdown;
      } catch (err) {
        this.error = err?.response?.data?.message || err?.message || 'An error occurred';
        console.error(err);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Fetch the merged OpenAPI spec, caching it after the first successful load.
     * @param {boolean} [force=false] - Bypass the cache and refetch.
     * @returns {Promise<Object|null>} The spec, or null on failure.
     */
    async fetchSpec(force = false) {
      if (this.spec && !force) return this.spec;
      this.error = null;
      this.loading = true;
      try {
        const res = await docsService.getSpec();
        this.spec = res?.data?.data ?? res?.data ?? null;
        return this.spec;
      } catch (err) {
        this.error = err?.response?.data?.message || err?.message || 'An error occurred';
        console.error(err);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Clear the error state.
     * @returns {void}
     */
    clearError() {
      this.error = null;
    },
  },
});

/**
 * Exports.
 */
export default useDocsStore;
