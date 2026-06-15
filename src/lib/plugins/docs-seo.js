/**
 * Build-time docs-aware SEO layer.
 *
 * When `app.seo.docs.enabled` is true and `app.seo.docs.contentUrl` is set, this
 * module fetches the public docs guide tree (`GET /api/public/docs` →
 * `{ categories: [{ id, label, order, guides: [{ slug, title, persona, order, summary }] }] }`)
 * at build time and DERIVES three SEO artefacts from it:
 *
 *   1. llms.txt sections — one section per category, each guide as a markdown link.
 *   2. prerender routes   — `/docs` home + one `/docs/:category/:slug` per guide.
 *   3. sitemap routes     — the same `/docs/...` routes, as sitemap entries.
 *
 * The derivation helpers are pure (tree in → routes/sections out) so they unit-test
 * without a live server. The fetch is the only impure piece and is FAIL-SOFT: any
 * network/timeout/parse error logs a warning and resolves to `null`, so callers
 * fall back to the existing static config and the build never breaks.
 *
 * The whole layer is OFF by default (`app.seo.docs.enabled` falsy) and generic —
 * no project-specific names, domains, or routes leak in.
 */

const DEFAULT_BASE_PATH = '/docs';
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Normalise a base path to a leading-slash, no-trailing-slash form.
 *
 * @param {string} [basePath] - raw base path (e.g. 'docs', '/docs/', '/docs')
 * @returns {string} normalised base path (e.g. '/docs'); '' collapses to '/docs' default
 */
function normalizeBasePath(basePath) {
  const raw = (basePath ?? '').trim();
  if (!raw) return DEFAULT_BASE_PATH;
  const withLead = raw.startsWith('/') ? raw : `/${raw}`;
  return withLead.replace(/\/+$/, '') || DEFAULT_BASE_PATH;
}

/**
 * Coerce the docs tree to the canonical category/guide shape, tolerating both the
 * wire shape (`{ id, label, guides }`) and an already-canonical
 * (`{ slug, title, articles }`) input. Defensive against missing/odd fields so a
 * partial tree never throws downstream.
 *
 * @param {object|null|undefined} tree - raw docs tree (`{ categories: [...] }`)
 * @returns {Array<{ id: string, label: string, order: number, guides: Array<{ slug: string, title: string, summary: string, order: number }> }>}
 *   normalised, field-complete category list (empty when absent)
 */
function normalizeCategories(tree) {
  const categories = Array.isArray(tree?.categories) ? tree.categories : [];
  return categories.map((c, i) => {
    const id = c?.id ?? c?.slug ?? '';
    const list = Array.isArray(c?.guides) ? c.guides : Array.isArray(c?.articles) ? c.articles : [];
    return {
      id: String(id),
      label: String(c?.label ?? c?.title ?? id ?? ''),
      order: Number.isFinite(c?.order) ? c.order : i,
      guides: list
        .filter((g) => g?.slug)
        .map((g, j) => ({
          slug: String(g.slug),
          title: String(g?.title ?? g.slug),
          summary: typeof g?.summary === 'string' ? g.summary : '',
          order: Number.isFinite(g?.order) ? g.order : j,
        })),
    };
  });
}

/**
 * Fetch the public docs guide tree at build time. FAIL-SOFT — returns `null` on
 * any error (network, non-2xx, timeout, JSON parse) after logging a warning, so
 * callers fall back to static config and the build continues.
 *
 * Unwraps the common `{ data: { categories } }` envelope as well as a bare
 * `{ categories }` body.
 *
 * @param {string} contentUrl - absolute URL of the docs tree endpoint
 * @param {object} [options]
 * @param {number} [options.timeoutMs=5000] - per-request timeout in milliseconds
 * @param {typeof fetch} [options.fetchImpl=globalThis.fetch] - injectable fetch (tests)
 * @returns {Promise<{ categories: Array }|null>} the docs tree, or null on failure
 */
export async function fetchDocsTree(contentUrl, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = globalThis.fetch } = options;
  if (!contentUrl) return null;
  if (typeof fetchImpl !== 'function') {
    console.warn('[docs-seo] No fetch implementation available, skipping docs SEO derivation.');
    return null;
  }

  try {
    const res = await fetchImpl(contentUrl, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res?.ok) {
      console.warn(`[docs-seo] Docs tree fetch returned HTTP ${res?.status ?? '??'}, falling back to static config.`);
      return null;
    }
    const body = await res.json();
    const tree = body?.data ?? body;
    if (!tree || !Array.isArray(tree.categories)) {
      console.warn('[docs-seo] Docs tree response has no categories array, falling back to static config.');
      return null;
    }
    return tree;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[docs-seo] Docs tree fetch failed, falling back to static config:', message);
    return null;
  }
}

/**
 * Derive the docs route list from a guide tree. Produces the `/docs` home plus one
 * `/docs/:category/:slug` per guide. Pure — no I/O.
 *
 * @param {object|null} tree - the docs tree (`{ categories: [...] }`)
 * @param {string} [basePath='/docs'] - the docs base path
 * @returns {string[]} ordered, de-duplicated route paths (empty when the tree is empty)
 */
export function deriveDocsRoutes(tree, basePath = DEFAULT_BASE_PATH) {
  const base = normalizeBasePath(basePath);
  const categories = normalizeCategories(tree);
  if (categories.length === 0) return [];

  const routes = [base];
  for (const cat of categories) {
    for (const guide of cat.guides) {
      routes.push(`${base}/${cat.id}/${guide.slug}`);
    }
  }
  return [...new Set(routes)];
}

/**
 * Derive llms.txt sections from a guide tree — one section per category, each
 * guide as a `- [title](URL): summary` bullet. When `mdTwin` is true, an extra
 * `- [title (Markdown)](URL.md)` bullet is appended per guide (the raw-markdown
 * twin for answer engines). Pure — no I/O.
 *
 * Section shape matches `buildLlmsTxt`'s `{ title, items: [{ label, url, note }] }`
 * so the result can be concatenated onto the existing static sections.
 *
 * @param {object|null} tree - the docs tree (`{ categories: [...] }`)
 * @param {string} baseUrl - canonical absolute base URL (no trailing slash), e.g. 'https://example.com'
 * @param {string} [basePath='/docs'] - the docs base path
 * @param {object} [options]
 * @param {boolean} [options.mdTwin=false] - also emit the `.md` twin bullet per guide
 * @returns {Array<{ title: string, items: Array<{ label: string, url: string, note: string }> }>}
 *   llms.txt-shaped sections (empty when the tree is empty)
 */
export function deriveDocsLlmsSections(tree, baseUrl, basePath = DEFAULT_BASE_PATH, options = {}) {
  const { mdTwin = false } = options;
  const base = normalizeBasePath(basePath);
  const origin = (baseUrl || '').replace(/\/+$/, '');
  const categories = normalizeCategories(tree);

  return categories
    .filter((cat) => cat.guides.length > 0)
    .map((cat) => {
      const items = [];
      for (const guide of cat.guides) {
        const path = `${base}/${cat.id}/${guide.slug}`;
        const url = `${origin}${path}`;
        items.push({ label: guide.title, url, note: guide.summary });
        if (mdTwin) {
          items.push({ label: `${guide.title} (Markdown)`, url: `${url}.md`, note: '' });
        }
      }
      return { title: cat.label, items };
    });
}

/**
 * Build-time entry point. When `app.seo.docs.enabled` and `app.seo.docs.contentUrl`
 * are set, fetch the docs tree and return a NEW config object whose `app.seo` has
 * the docs-derived prerender routes, sitemap routes, and llms.txt sections merged
 * ON TOP of the existing static config — which is then handed to the existing
 * `prerenderPlugin` / `seoStaticPlugin` unchanged (this layer produces lists, it
 * does NOT re-implement rendering).
 *
 * FAIL-SOFT + OFF-by-default: when the layer is disabled, the contentUrl is unset,
 * or the fetch fails, the ORIGINAL config is returned untouched (static fallback).
 * Never throws — safe to `await` in `vite.config.js` without a try/catch.
 *
 * @param {object} config - the full app config (`{ app: { seo, url, ... }, ... }`)
 * @param {object} [options]
 * @param {typeof fetch} [options.fetchImpl=globalThis.fetch] - injectable fetch (tests)
 * @returns {Promise<object>} the (possibly augmented) config — same reference when OFF/failed
 */
export async function augmentSeoConfigWithDocs(config, options = {}) {
  const app = config?.app || {};
  const docs = app.seo?.docs;
  if (!docs?.enabled || !docs?.contentUrl) return config;

  const tree = await fetchDocsTree(docs.contentUrl, { timeoutMs: docs.timeoutMs, fetchImpl: options.fetchImpl });
  if (!tree) return config; // fetch failed → static fallback

  const basePath = docs.basePath || DEFAULT_BASE_PATH;
  const baseUrl = (app.url || '').replace(/\/+$/, '');
  const routes = deriveDocsRoutes(tree, basePath);
  if (routes.length === 0) return config;

  const llmsSections = deriveDocsLlmsSections(tree, baseUrl, basePath, { mdTwin: docs.mdTwin === true });
  const seo = app.seo || {};

  // Merge: append docs routes to whatever prerender/sitemap/llms already emit,
  // de-duplicating prerender + sitemap paths so an overlapping static entry wins once.
  const existingPrerender = Array.isArray(seo.prerender?.routes) ? seo.prerender.routes : [];
  const mergedPrerender = [...new Set([...existingPrerender, ...routes])];

  const existingSitemap = Array.isArray(seo.sitemap?.routes) ? seo.sitemap.routes : [];
  const existingSitemapPaths = new Set(existingSitemap.map((r) => r?.path));
  const docsSitemap = routes
    .filter((path) => !existingSitemapPaths.has(path))
    .map((path) => ({ path, changefreq: 'weekly' }));

  const existingLlmsSections = Array.isArray(seo.llms?.sections) ? seo.llms.sections : [];

  return {
    ...config,
    app: {
      ...app,
      seo: {
        ...seo,
        prerender: { ...seo.prerender, routes: mergedPrerender },
        sitemap: { ...seo.sitemap, routes: [...existingSitemap, ...docsSitemap] },
        llms: { ...seo.llms, sections: [...existingLlmsSections, ...llmsSections] },
      },
    },
  };
}
