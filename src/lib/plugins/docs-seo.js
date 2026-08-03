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
  // Coerce non-string values to a string first so `.trim()` never throws on
  // unexpected config types (e.g. a number or boolean accidentally set in config).
  const raw = (typeof basePath === 'string' ? basePath : String(basePath ?? '')).trim();
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
  return categories
    .map((c, i) => {
      // Field-preference order MUST match `docs.store.js normalizeTree` (slug ?? id)
      // so SEO-derived /docs/:cat/:slug paths stay in sync with runtime router paths.
      const id = c?.slug ?? c?.id ?? '';
      const list = Array.isArray(c?.guides) ? c.guides : Array.isArray(c?.articles) ? c.articles : [];
      const guides = list
        .filter((g) => g?.slug)
        .map((g, j) => ({
          slug: String(g.slug),
          title: String(g?.title ?? g.slug),
          summary: typeof g?.summary === 'string' ? g.summary : '',
          order: Number.isFinite(g?.order) ? g.order : j,
        }))
        // Sort guides by order (ascending), then by slug as a stable tiebreaker.
        .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
      return {
        id: String(id),
        label: String(c?.label ?? c?.title ?? id ?? ''),
        order: Number.isFinite(c?.order) ? c.order : i,
        guides,
      };
    })
    // Sort categories by order (ascending), then by label as a stable tiebreaker.
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
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
 * Derive the API-snapshot entries the prerender page will request at capture
 * time: the docs tree endpoint (both slash forms, since runtime clients may
 * request the trailing-slash form) plus one raw-markdown twin per guide.
 * Entries are keyed by URL PATHNAME so the prerender-time match stays
 * origin-agnostic — the runtime API origin can differ from `contentUrl`'s.
 * Pure — no I/O.
 *
 * @param {object|null} tree - the docs tree (`{ categories: [...] }`)
 * @param {string} contentUrl - absolute URL of the docs tree endpoint
 * @returns {Array<{ path: string, url: string, kind: 'tree'|'article' }>}
 *   snapshot entries (`path` = pathname the page will request, `url` = absolute
 *   URL to fetch at build time); empty when contentUrl is absent or malformed
 */
export function deriveDocsSnapshotEntries(tree, contentUrl) {
  if (!contentUrl) return [];
  let parsed;
  try {
    parsed = new URL(contentUrl);
  } catch {
    return [];
  }
  const basePath = parsed.pathname.replace(/\/+$/, '');
  const origin = parsed.origin;
  const entries = [
    { path: basePath, url: `${origin}${basePath}`, kind: 'tree' },
    { path: `${basePath}/`, url: `${origin}${basePath}`, kind: 'tree' },
  ];
  for (const cat of normalizeCategories(tree)) {
    for (const guide of cat.guides) {
      const path = `${basePath}/${guide.slug}.md`;
      entries.push({ path, url: `${origin}${path}`, kind: 'article' });
    }
  }
  return entries;
}

/**
 * Fetch the API-snapshot bodies at build time. The tree is NOT refetched — it
 * is re-serialised from the already-fetched object. Articles are fetched
 * FAIL-SOFT one by one: a failed article logs a warning and is skipped, so
 * that page simply prerenders without a body (exactly today's behaviour).
 *
 * @param {object|null} tree - the already-fetched docs tree
 * @param {string} contentUrl - absolute URL of the docs tree endpoint
 * @param {object} [options]
 * @param {number} [options.timeoutMs=5000] - per-request timeout in milliseconds
 * @param {typeof fetch} [options.fetchImpl=globalThis.fetch] - injectable fetch (tests)
 * @returns {Promise<Record<string, { body: string, contentType: string }>>}
 *   pathname → response snapshot, served to the page during prerender capture
 */
export async function fetchDocsSnapshot(tree, contentUrl, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = globalThis.fetch } = options;
  const snapshot = {};
  const treeBody = JSON.stringify(tree);
  for (const entry of deriveDocsSnapshotEntries(tree, contentUrl)) {
    if (entry.kind === 'tree') {
      snapshot[entry.path] = { body: treeBody, contentType: 'application/json' };
      continue;
    }
    try {
      const res = await fetchImpl(entry.url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!res?.ok) {
        console.warn(`[docs-seo] Snapshot fetch HTTP ${res?.status ?? '??'} for ${entry.url}, page will prerender without this body.`);
        continue;
      }
      snapshot[entry.path] = { body: await res.text(), contentType: 'text/markdown' };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[docs-seo] Snapshot fetch failed for ${entry.url}, page will prerender without this body:`, message);
    }
  }
  return snapshot;
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
  // Guard: contentUrl must be a non-empty string; a non-string value (number,
  // boolean, object) is treated as absent so the layer stays off and safe.
  if (!docs?.enabled || typeof docs?.contentUrl !== 'string' || !docs.contentUrl) return config;

  const tree = await fetchDocsTree(docs.contentUrl, { timeoutMs: docs.timeoutMs, fetchImpl: options.fetchImpl });
  if (!tree) return config; // fetch failed → static fallback

  const basePath = docs.basePath || DEFAULT_BASE_PATH;
  const baseUrl = (app.url || '').replace(/\/+$/, '');
  const routes = deriveDocsRoutes(tree, basePath);
  if (routes.length === 0) return config;

  const llmsSections = deriveDocsLlmsSections(tree, baseUrl, basePath, { mdTwin: docs.mdTwin === true });
  // Build-time API snapshot: served to the page by `prerenderPlugin` via request
  // interception, so the capture never depends on the API being reachable from
  // the build environment (container builds, origin mismatches).
  const apiSnapshot = await fetchDocsSnapshot(tree, docs.contentUrl, {
    timeoutMs: docs.timeoutMs,
    fetchImpl: options.fetchImpl,
  });
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
        prerender: { ...seo.prerender, routes: mergedPrerender, apiSnapshot },
        sitemap: { ...seo.sitemap, routes: [...existingSitemap, ...docsSitemap] },
        llms: { ...seo.llms, sections: [...existingLlmsSections, ...llmsSections] },
      },
    },
  };
}
