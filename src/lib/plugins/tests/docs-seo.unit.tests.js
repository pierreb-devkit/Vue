import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  fetchDocsTree,
  deriveDocsRoutes,
  deriveDocsLlmsSections,
  deriveDocsSnapshotEntries,
  fetchDocsSnapshot,
  augmentSeoConfigWithDocs,
} from '../docs-seo.js';

/**
 * Real-shape docs tree fixture — mirrors `GET /api/public/docs`:
 * `{ categories: [{ id, label, order, guides: [{ slug, title, persona, order, summary }] }] }`.
 * Generic/neutral content (no project names, no real domains).
 */
const treeFixture = {
  categories: [
    {
      id: 'get-started',
      label: 'Get Started',
      order: 0,
      guides: [
        { slug: 'welcome', title: 'Welcome', persona: ['developer'], order: 0, summary: 'What the API is.' },
        { slug: 'quickstart', title: 'Quickstart', persona: ['developer'], order: 1, summary: 'One HTTP call.' },
      ],
    },
    {
      id: 'integrate',
      label: 'Integrate',
      order: 1,
      guides: [{ slug: 'webhooks', title: 'Webhooks', persona: ['integrator'], order: 0, summary: 'Wire it in.' }],
    },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('deriveDocsRoutes', () => {
  it('produces the /docs home plus one route per guide from a real-shape tree', () => {
    const routes = deriveDocsRoutes(treeFixture);
    expect(routes).toEqual([
      '/docs',
      '/docs/get-started/welcome',
      '/docs/get-started/quickstart',
      '/docs/integrate/webhooks',
    ]);
  });

  it('honours a custom basePath and normalises trailing/leading slashes', () => {
    expect(deriveDocsRoutes(treeFixture, 'guides/')).toEqual([
      '/guides',
      '/guides/get-started/welcome',
      '/guides/get-started/quickstart',
      '/guides/integrate/webhooks',
    ]);
  });

  it('returns an empty list (nothing docs-related) for an empty / null tree', () => {
    expect(deriveDocsRoutes(null)).toEqual([]);
    expect(deriveDocsRoutes({ categories: [] })).toEqual([]);
    expect(deriveDocsRoutes(undefined)).toEqual([]);
  });

  it('de-duplicates and tolerates the already-canonical shape (slug/articles)', () => {
    const canonical = {
      categories: [{ slug: 'ops', title: 'Ops', articles: [{ slug: 'a', title: 'A', summary: '' }] }],
    };
    expect(deriveDocsRoutes(canonical)).toEqual(['/docs', '/docs/ops/a']);
  });

  it('skips guides without a slug', () => {
    const partial = { categories: [{ id: 'c', label: 'C', guides: [{ title: 'no slug' }, { slug: 'ok', title: 'Ok' }] }] };
    expect(deriveDocsRoutes(partial)).toEqual(['/docs', '/docs/c/ok']);
  });

  it('sorts categories by order field regardless of backend return order', () => {
    const unordered = {
      categories: [
        { id: 'z-cat', label: 'Z Cat', order: 2, guides: [{ slug: 'z-guide', title: 'Z', order: 0 }] },
        { id: 'a-cat', label: 'A Cat', order: 0, guides: [{ slug: 'a-guide', title: 'A', order: 0 }] },
        { id: 'm-cat', label: 'M Cat', order: 1, guides: [{ slug: 'm-guide', title: 'M', order: 0 }] },
      ],
    };
    expect(deriveDocsRoutes(unordered)).toEqual([
      '/docs',
      '/docs/a-cat/a-guide',
      '/docs/m-cat/m-guide',
      '/docs/z-cat/z-guide',
    ]);
  });

  it('sorts guides within a category by order field regardless of backend return order', () => {
    const unordered = {
      categories: [
        {
          id: 'cat',
          label: 'Cat',
          order: 0,
          guides: [
            { slug: 'third', title: 'Third', order: 2 },
            { slug: 'first', title: 'First', order: 0 },
            { slug: 'second', title: 'Second', order: 1 },
          ],
        },
      ],
    };
    expect(deriveDocsRoutes(unordered)).toEqual(['/docs', '/docs/cat/first', '/docs/cat/second', '/docs/cat/third']);
  });
});

describe('deriveDocsLlmsSections', () => {
  it('builds one section per category with guide links and summaries', () => {
    const sections = deriveDocsLlmsSections(treeFixture, 'https://example.com');
    expect(sections).toEqual([
      {
        title: 'Get Started',
        items: [
          { label: 'Welcome', url: 'https://example.com/docs/get-started/welcome', note: 'What the API is.' },
          { label: 'Quickstart', url: 'https://example.com/docs/get-started/quickstart', note: 'One HTTP call.' },
        ],
      },
      {
        title: 'Integrate',
        items: [{ label: 'Webhooks', url: 'https://example.com/docs/integrate/webhooks', note: 'Wire it in.' }],
      },
    ]);
  });

  it('feeds buildLlmsTxt: rendered output keeps existing sections and appends docs links', async () => {
    const { buildLlmsTxt } = await import('../seo-static.js');
    const staticSections = [{ title: 'Links', items: [{ label: 'Home', url: 'https://example.com', note: 'home' }] }];
    const docsSections = deriveDocsLlmsSections(treeFixture, 'https://example.com');
    const out = buildLlmsTxt({ enabled: true, title: 'X', sections: [...staticSections, ...docsSections] }, {});
    expect(out).toContain('## Links');
    expect(out).toContain('- [Home](https://example.com): home');
    expect(out).toContain('## Get Started');
    expect(out).toContain('- [Welcome](https://example.com/docs/get-started/welcome): What the API is.');
  });

  it('strips a trailing slash from baseUrl so URLs are not doubled', () => {
    const sections = deriveDocsLlmsSections(treeFixture, 'https://example.com/');
    expect(sections[0].items[0].url).toBe('https://example.com/docs/get-started/welcome');
  });

  it('appends a .md twin bullet per guide when mdTwin is on', () => {
    const sections = deriveDocsLlmsSections(treeFixture, 'https://example.com', '/docs', { mdTwin: true });
    expect(sections[0].items).toContainEqual({
      label: 'Welcome (Markdown)',
      url: 'https://example.com/docs/get-started/welcome.md',
      note: '',
    });
  });

  it('returns nothing for an empty tree and skips categories with no guides', () => {
    expect(deriveDocsLlmsSections(null, 'https://example.com')).toEqual([]);
    const empty = { categories: [{ id: 'c', label: 'C', guides: [] }] };
    expect(deriveDocsLlmsSections(empty, 'https://example.com')).toEqual([]);
  });

  it('outputs categories and guides in order-sorted order regardless of backend return order', () => {
    const unordered = {
      categories: [
        {
          id: 'b-cat',
          label: 'B Category',
          order: 1,
          guides: [
            { slug: 'b2', title: 'B2', order: 1, summary: '' },
            { slug: 'b1', title: 'B1', order: 0, summary: '' },
          ],
        },
        {
          id: 'a-cat',
          label: 'A Category',
          order: 0,
          guides: [{ slug: 'a1', title: 'A1', order: 0, summary: '' }],
        },
      ],
    };
    const sections = deriveDocsLlmsSections(unordered, 'https://example.com');
    // Categories in order: A Category (0) before B Category (1)
    expect(sections.map((s) => s.title)).toEqual(['A Category', 'B Category']);
    // Guides within B sorted: B1 (order 0) before B2 (order 1)
    expect(sections[1].items.map((i) => i.label)).toEqual(['B1', 'B2']);
  });
});

describe('fetchDocsTree (fail-soft)', () => {
  it('returns the tree, unwrapping the { data } envelope', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: treeFixture }) });
    const tree = await fetchDocsTree('https://api.example.com/api/public/docs', { fetchImpl });
    expect(tree).toEqual(treeFixture);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('accepts a bare { categories } body (no envelope)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => treeFixture });
    const tree = await fetchDocsTree('https://api.example.com/api/public/docs', { fetchImpl });
    expect(tree).toEqual(treeFixture);
  });

  it('returns null and warns when the fetch REJECTS (offline) — does not throw', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(fetchDocsTree('https://api.example.com/x', { fetchImpl })).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[docs-seo]'), expect.stringContaining('ECONNREFUSED'));
  });

  it('returns null and warns on a TIMEOUT (AbortError) — does not throw', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchImpl = vi.fn().mockImplementation(() => Promise.reject(new DOMException('timed out', 'TimeoutError')));
    await expect(fetchDocsTree('https://api.example.com/x', { fetchImpl, timeoutMs: 1 })).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('returns null and warns on a non-2xx response', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    await expect(fetchDocsTree('https://api.example.com/x', { fetchImpl })).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('HTTP 503'));
  });

  it('returns null when the body has no categories array', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { foo: 'bar' } }) });
    await expect(fetchDocsTree('https://api.example.com/x', { fetchImpl })).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no categories array'));
  });

  it('returns null when no contentUrl is provided (OFF / unset path)', async () => {
    const fetchImpl = vi.fn();
    await expect(fetchDocsTree('', { fetchImpl })).resolves.toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns null and warns when no fetch implementation is available', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(fetchDocsTree('https://api.example.com/x', { fetchImpl: null })).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No fetch implementation'));
  });
});

describe('augmentSeoConfigWithDocs', () => {
  /**
   * Build a minimal valid app config for `augmentSeoConfigWithDocs` tests.
   * @returns {object} A base config object with `app.seo` prerender/sitemap/llms stubs.
   */
  const baseConfig = () => ({
    app: {
      title: 'X',
      url: 'https://example.com',
      seo: {
        prerender: { enabled: true, routes: ['/'] },
        sitemap: { enabled: true, routes: [{ path: '/', priority: 1.0, changefreq: 'weekly' }] },
        llms: { enabled: true, sections: [{ title: 'Links', items: [{ label: 'Home', url: 'https://example.com' }] }] },
      },
    },
  });

  it('OFF by default: returns the SAME config untouched and never fetches', async () => {
    const fetchImpl = vi.fn();
    const config = baseConfig(); // no app.seo.docs
    const out = await augmentSeoConfigWithDocs(config, { fetchImpl });
    expect(out).toBe(config);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('enabled but no contentUrl: returns the same config and never fetches', async () => {
    const fetchImpl = vi.fn();
    const config = baseConfig();
    config.app.seo.docs = { enabled: true, contentUrl: '', basePath: '/docs' };
    const out = await augmentSeoConfigWithDocs(config, { fetchImpl });
    expect(out).toBe(config);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('ON path (stubbed fetch): merges docs routes into prerender + sitemap + llms, keeping statics', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: treeFixture }) });
    const config = baseConfig();
    config.app.seo.docs = { enabled: true, contentUrl: 'https://api.example.com/api/public/docs', basePath: '/docs' };

    const out = await augmentSeoConfigWithDocs(config, { fetchImpl });

    // prerender: static '/' kept + docs routes appended
    expect(out.app.seo.prerender.routes).toEqual([
      '/',
      '/docs',
      '/docs/get-started/welcome',
      '/docs/get-started/quickstart',
      '/docs/integrate/webhooks',
    ]);
    // sitemap: static root entry kept verbatim + docs entries appended
    expect(out.app.seo.sitemap.routes[0]).toEqual({ path: '/', priority: 1.0, changefreq: 'weekly' });
    expect(out.app.seo.sitemap.routes).toContainEqual({ path: '/docs/integrate/webhooks', changefreq: 'weekly' });
    // llms: static 'Links' section kept + one section per docs category appended
    const sectionTitles = out.app.seo.llms.sections.map((s) => s.title);
    expect(sectionTitles).toEqual(['Links', 'Get Started', 'Integrate']);
    // original config not mutated
    expect(config.app.seo.prerender.routes).toEqual(['/']);
  });

  it('FAIL-SOFT: fetch rejects → returns the ORIGINAL static config unchanged, does NOT throw', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'));
    const config = baseConfig();
    config.app.seo.docs = { enabled: true, contentUrl: 'https://api.example.com/x' };

    const out = await augmentSeoConfigWithDocs(config, { fetchImpl });

    expect(out).toBe(config); // identity → pure static fallback
    expect(out.app.seo.prerender.routes).toEqual(['/']);
    expect(warn).toHaveBeenCalled();
  });

  it('FAIL-SOFT: an empty docs tree (no guides) leaves the config untouched', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ categories: [] }) });
    const config = baseConfig();
    config.app.seo.docs = { enabled: true, contentUrl: 'https://api.example.com/x' };
    const out = await augmentSeoConfigWithDocs(config, { fetchImpl });
    expect(out).toBe(config);
  });

  // Finding #7: non-string config values must not throw.
  it('FAIL-SOFT: non-string contentUrl (number) is treated as absent → returns config unchanged', async () => {
    const fetchImpl = vi.fn();
    const config = baseConfig();
    // A number is a truthy non-string — the layer must treat it as absent.
    config.app.seo.docs = { enabled: true, contentUrl: 42 };
    const out = await augmentSeoConfigWithDocs(config, { fetchImpl });
    expect(out).toBe(config);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('FAIL-SOFT: non-string basePath (number) does not throw — normalizeBasePath coerces it', () => {
    // deriveDocsRoutes calls normalizeBasePath; a number input must not crash.
    expect(() => deriveDocsRoutes(treeFixture, 42)).not.toThrow();
    const routes = deriveDocsRoutes(treeFixture, 42);
    // '42' starts with a digit, not '/', so normalizeBasePath prefixes '/'.
    expect(routes[0]).toBe('/42');
  });

  it('ON path: attaches the prerender apiSnapshot (tree + article entries)', async () => {
    const fetchImpl = vi.fn().mockImplementation((url) => {
      if (String(url).endsWith('.md')) {
        return Promise.resolve({ ok: true, text: async () => `# md for ${url}` });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: treeFixture }) });
    });
    const config = baseConfig();
    config.app.seo.docs = { enabled: true, contentUrl: 'https://api.example.com/api/public/docs', basePath: '/docs' };

    const out = await augmentSeoConfigWithDocs(config, { fetchImpl });

    const snapshot = out.app.seo.prerender.apiSnapshot;
    expect(Object.keys(snapshot).sort()).toEqual([
      '/api/public/docs',
      '/api/public/docs/',
      '/api/public/docs/quickstart.md',
      '/api/public/docs/webhooks.md',
      '/api/public/docs/welcome.md',
    ]);
    expect(snapshot['/api/public/docs/'].contentType).toBe('application/json');
    expect(JSON.parse(snapshot['/api/public/docs/'].body)).toEqual(treeFixture);
    expect(snapshot['/api/public/docs/welcome.md'].contentType).toBe('text/markdown');
    expect(snapshot['/api/public/docs/welcome.md'].body).toContain('welcome.md');
  });
});

describe('deriveDocsSnapshotEntries', () => {
  it('derives tree entries (both slash forms) plus one .md entry per guide, keyed by pathname', () => {
    const entries = deriveDocsSnapshotEntries(treeFixture, 'https://api.example.com/api/public/docs');
    expect(entries).toEqual([
      { path: '/api/public/docs', url: 'https://api.example.com/api/public/docs', kind: 'tree' },
      { path: '/api/public/docs/', url: 'https://api.example.com/api/public/docs', kind: 'tree' },
      { path: '/api/public/docs/welcome.md', url: 'https://api.example.com/api/public/docs/welcome.md', kind: 'article' },
      { path: '/api/public/docs/quickstart.md', url: 'https://api.example.com/api/public/docs/quickstart.md', kind: 'article' },
      { path: '/api/public/docs/webhooks.md', url: 'https://api.example.com/api/public/docs/webhooks.md', kind: 'article' },
    ]);
  });

  it('normalises a trailing slash on contentUrl', () => {
    const entries = deriveDocsSnapshotEntries(treeFixture, 'https://api.example.com/api/public/docs/');
    expect(entries[0].path).toBe('/api/public/docs');
    expect(entries[2].path).toBe('/api/public/docs/welcome.md');
  });

  it('returns an empty list for a missing or malformed contentUrl', () => {
    expect(deriveDocsSnapshotEntries(treeFixture, '')).toEqual([]);
    expect(deriveDocsSnapshotEntries(treeFixture, 'not a url')).toEqual([]);
    expect(deriveDocsSnapshotEntries(null, 'https://api.example.com/docs')).toEqual([
      { path: '/docs', url: 'https://api.example.com/docs', kind: 'tree' },
      { path: '/docs/', url: 'https://api.example.com/docs', kind: 'tree' },
    ]);
  });
});

describe('fetchDocsSnapshot', () => {
  it('serialises the already-fetched tree WITHOUT refetching it and fetches each article', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, text: async () => '# body' });
    const snapshot = await fetchDocsSnapshot(treeFixture, 'https://api.example.com/api/public/docs', { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(3); // articles only, never the tree URL
    expect(fetchImpl).not.toHaveBeenCalledWith('https://api.example.com/api/public/docs', expect.anything());
    expect(snapshot['/api/public/docs'].body).toBe(JSON.stringify(treeFixture));
    expect(snapshot['/api/public/docs/'].body).toBe(JSON.stringify(treeFixture));
    expect(snapshot['/api/public/docs/welcome.md']).toEqual({ body: '# body', contentType: 'text/markdown' });
  });

  it('FAIL-SOFT: a non-OK article response is skipped with a warning, others survive', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchImpl = vi.fn().mockImplementation((url) => {
      if (String(url).endsWith('/quickstart.md')) return Promise.resolve({ ok: false, status: 404 });
      return Promise.resolve({ ok: true, text: async () => '# ok' });
    });
    const snapshot = await fetchDocsSnapshot(treeFixture, 'https://api.example.com/api/public/docs', { fetchImpl });

    expect(snapshot['/api/public/docs/quickstart.md']).toBeUndefined();
    expect(snapshot['/api/public/docs/welcome.md']).toEqual({ body: '# ok', contentType: 'text/markdown' });
    expect(snapshot['/api/public/docs/webhooks.md']).toEqual({ body: '# ok', contentType: 'text/markdown' });
    expect(warn).toHaveBeenCalled();
  });

  it('FAIL-SOFT: a rejecting article fetch is skipped with a warning, never throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'));
    const snapshot = await fetchDocsSnapshot(treeFixture, 'https://api.example.com/api/public/docs', { fetchImpl });

    // Tree entries still present (no I/O needed), all articles skipped.
    expect(Object.keys(snapshot).sort()).toEqual(['/api/public/docs', '/api/public/docs/']);
    expect(warn).toHaveBeenCalled();
  });
});
