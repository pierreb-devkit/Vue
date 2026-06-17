import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDocsStore, normalizeTree } from '../stores/docs.store';
import { docsTreeApiFixture } from './fixtures/docsTree.api';
import axios from '../../../lib/services/axios';

// Mock axios (the docs.service HTTP layer).
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

const sampleTree = {
  categories: [
    {
      slug: 'getting-started',
      title: 'Getting Started',
      order: 1,
      articles: [
        { slug: 'install', title: 'Install', category: 'getting-started', order: 1 },
        { slug: 'quickstart', title: 'Quickstart', category: 'getting-started', order: 2 },
      ],
    },
    {
      slug: 'guides',
      title: 'Guides',
      order: 2,
      articles: [
        { slug: 'scheduling', title: 'Scheduling', category: 'guides', order: 1 },
      ],
    },
  ],
};

describe('Docs Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const store = useDocsStore();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.tree).toBeNull();
    expect(store.articles).toEqual({});
    expect(store.spec).toBeNull();
  });

  describe('fetchTree', () => {
    it('fetches and unpacks the { data: { categories } } envelope', async () => {
      const store = useDocsStore();
      axios.get.mockResolvedValueOnce({ data: { data: sampleTree } });

      const tree = await store.fetchTree();

      expect(tree).toEqual(sampleTree);
      expect(store.tree).toEqual(sampleTree);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/public/docs/'));
    });

    it('caches the tree and does not refetch on a second call', async () => {
      const store = useDocsStore();
      axios.get.mockResolvedValueOnce({ data: { data: sampleTree } });

      await store.fetchTree();
      await store.fetchTree();

      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('refetches when force=true', async () => {
      const store = useDocsStore();
      axios.get.mockResolvedValue({ data: { data: sampleTree } });

      await store.fetchTree();
      await store.fetchTree(true);

      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    it('normalizes the REAL API shape ({ id, label, guides }) to the canonical shape', async () => {
      const store = useDocsStore();
      // The backend wraps the tree as `{ data: { data: <tree> } }` and emits the
      // raw wire shape (id/label/guides) — NOT the frontend's canonical
      // slug/title/articles. fetchTree must map it at the I/O boundary.
      axios.get.mockResolvedValueOnce({ data: { data: docsTreeApiFixture } });

      await store.fetchTree();

      const first = store.tree.categories[0];
      // Category: wire `id`/`label` → canonical `slug`/`title`.
      expect(first.slug).toBe('get-started');
      expect(first.title).toBe('Get Started');
      expect(first.id).toBeUndefined();
      expect(first.label).toBeUndefined();
      // Guides → `articles` (the empty grid bug was reading `.articles` of a
      // category that only ever had `.guides`).
      expect(Array.isArray(first.articles)).toBe(true);
      expect(first.articles.length).toBeGreaterThan(0);
      expect(first.guides).toBeUndefined();

      // orderedArticles is non-empty and every item carries slug/title/category.
      expect(store.orderedArticles.length).toBeGreaterThan(0);
      store.orderedArticles.forEach((art) => {
        expect(typeof art.slug).toBe('string');
        expect(art.slug.length).toBeGreaterThan(0);
        expect(typeof art.title).toBe('string');
        expect(typeof art.category).toBe('string');
        expect(art.category.length).toBeGreaterThan(0);
      });
      // The first article's category back-fills from its parent category slug.
      expect(store.orderedArticles[0].category).toBe('get-started');
    });

    it('sets error and returns null on failure', async () => {
      const store = useDocsStore();
      axios.get.mockRejectedValueOnce({ response: { data: { message: 'boom' } } });

      const tree = await store.fetchTree();

      expect(tree).toBeNull();
      expect(store.tree).toBeNull();
      expect(store.error).toBe('boom');
      expect(store.loading).toBe(false);
    });

    it('does not throw when the rejected value is null (err?.message guard)', async () => {
      const store = useDocsStore();
      axios.get.mockRejectedValueOnce(null);

      const tree = await store.fetchTree();

      expect(tree).toBeNull();
      expect(store.error).toBe('An error occurred');
      expect(store.loading).toBe(false);
    });
  });

  describe('normalizeTree', () => {
    it('maps the REAL API shape (id/label/guides) to canonical (slug/title/articles)', () => {
      const tree = normalizeTree(docsTreeApiFixture);

      expect(tree.categories).toHaveLength(3);
      const cat = tree.categories[0];
      expect(cat.slug).toBe('get-started');
      expect(cat.title).toBe('Get Started');
      expect(cat.order).toBe(0);
      const art = cat.articles[0];
      expect(art.slug).toBe('welcome');
      expect(art.title).toBe('Welcome');
      expect(art.category).toBe('get-started');
      expect(art.summary).toBe('What the API is and when to reach for it.');
      expect(art.persona).toEqual(['developer']);
      // Optional cross-link anchor passes through fail-soft (present here, absent
      // on the sibling guide → undefined).
      expect(art.anchor).toBe('welcome-overview');
      expect(cat.articles[1].anchor).toBeUndefined();
    });

    it('passes an already-canonical tree through intact (defensive)', () => {
      const canonical = {
        categories: [
          {
            slug: 'guides',
            title: 'Guides',
            order: 5,
            articles: [
              {
                slug: 'scheduling',
                title: 'Scheduling',
                order: 2,
                category: 'guides',
                summary: 'Cron-style runs.',
                persona: ['developer'],
              },
            ],
          },
        ],
      };

      expect(normalizeTree(canonical)).toEqual(canonical);
    });

    it('returns an empty category list for a null / shapeless input', () => {
      expect(normalizeTree(null)).toEqual({ categories: [] });
      expect(normalizeTree({})).toEqual({ categories: [] });
    });
  });

  describe('fetchArticle', () => {
    it('fetches and caches raw markdown by slug', async () => {
      const store = useDocsStore();
      axios.get.mockResolvedValueOnce({ data: '# Install\n\nRun npm install.' });

      const md = await store.fetchArticle('install');

      expect(md).toBe('# Install\n\nRun npm install.');
      expect(store.articles.install).toBe('# Install\n\nRun npm install.');
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/public/docs/install.md'),
        expect.objectContaining({ responseType: 'text' }),
      );
    });

    it('serves a cached article without a second request', async () => {
      const store = useDocsStore();
      axios.get.mockResolvedValueOnce({ data: '# Cached' });

      await store.fetchArticle('install');
      const md = await store.fetchArticle('install');

      expect(md).toBe('# Cached');
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('returns null for an empty slug without calling the API', async () => {
      const store = useDocsStore();
      const md = await store.fetchArticle('');
      expect(md).toBeNull();
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('converts a non-string response data (number) to a string', async () => {
      const store = useDocsStore();
      axios.get.mockResolvedValueOnce({ data: 123 });

      const md = await store.fetchArticle('numeric');

      expect(md).toBe('123');
      expect(store.articles.numeric).toBe('123');
    });

    it('converts a null response data to an empty string', async () => {
      const store = useDocsStore();
      axios.get.mockResolvedValueOnce({ data: null });

      const md = await store.fetchArticle('nulldata');

      expect(md).toBe('');
      expect(store.articles.nulldata).toBe('');
    });

    it('converts an undefined response data to an empty string', async () => {
      const store = useDocsStore();
      axios.get.mockResolvedValueOnce({ data: undefined });

      const md = await store.fetchArticle('undefineddata');

      expect(md).toBe('');
      expect(store.articles.undefineddata).toBe('');
    });

    it('sets error and returns null on failure', async () => {
      const store = useDocsStore();
      axios.get.mockRejectedValueOnce(new Error('network down'));

      const md = await store.fetchArticle('missing');

      expect(md).toBeNull();
      expect(store.error).toBe('network down');
      expect(store.loading).toBe(false);
    });

    it('uses response.data.message when present in a fetch error', async () => {
      const store = useDocsStore();
      axios.get.mockRejectedValueOnce({ response: { data: { message: 'article not found' } } });

      const md = await store.fetchArticle('notfound');

      expect(md).toBeNull();
      expect(store.error).toBe('article not found');
    });

    it('falls back to "An error occurred" when the error has no message', async () => {
      const store = useDocsStore();
      axios.get.mockRejectedValueOnce({});

      const md = await store.fetchArticle('nomsg');

      expect(md).toBeNull();
      expect(store.error).toBe('An error occurred');
    });

    it('does not throw when the rejected value is null (err?.message guard)', async () => {
      const store = useDocsStore();
      axios.get.mockRejectedValueOnce(null);

      // Must not throw despite err being null (guard: err?.message not err.message).
      const md = await store.fetchArticle('nullerr');

      expect(md).toBeNull();
      expect(store.error).toBe('An error occurred');
      expect(store.loading).toBe(false);
    });
  });

  describe('orderedArticles getter', () => {
    it('flattens + order-sorts articles across categories', async () => {
      const store = useDocsStore();
      axios.get.mockResolvedValueOnce({ data: { data: sampleTree } });
      await store.fetchTree();

      const slugs = store.orderedArticles.map((a) => a.slug);
      expect(slugs).toEqual(['install', 'quickstart', 'scheduling']);
      // category falls back to the parent category slug
      expect(store.orderedArticles[0].category).toBe('getting-started');
    });

    it('returns an empty array when the tree is not loaded', () => {
      const store = useDocsStore();
      expect(store.orderedArticles).toEqual([]);
    });
  });

  describe('fetchSpec', () => {
    const sampleSpec = { openapi: '3.0.0', info: { version: '1.0.0' }, paths: {} };

    it('fetches and caches the OpenAPI spec (raw body, no data envelope)', async () => {
      const store = useDocsStore();
      axios.get.mockResolvedValueOnce({ data: sampleSpec });

      const spec = await store.fetchSpec();

      expect(spec).toEqual(sampleSpec);
      expect(store.spec).toEqual(sampleSpec);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/spec.json'));
    });

    it('unwraps a { data: spec } envelope when the backend wraps it', async () => {
      const store = useDocsStore();
      axios.get.mockResolvedValueOnce({ data: { data: sampleSpec } });

      const spec = await store.fetchSpec();

      expect(spec).toEqual(sampleSpec);
    });

    it('caches the spec and does not refetch on a second call', async () => {
      const store = useDocsStore();
      axios.get.mockResolvedValueOnce({ data: sampleSpec });

      await store.fetchSpec();
      await store.fetchSpec();

      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('refetches when force=true', async () => {
      const store = useDocsStore();
      axios.get.mockResolvedValue({ data: sampleSpec });

      await store.fetchSpec();
      await store.fetchSpec(true);

      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    it('returns null when data is null (no inner .data property)', async () => {
      const store = useDocsStore();
      axios.get.mockResolvedValueOnce({ data: null });

      const spec = await store.fetchSpec();

      expect(spec).toBeNull();
      expect(store.spec).toBeNull();
    });

    it('returns data directly when the response has no nested .data.data', async () => {
      const store = useDocsStore();
      const flatSpec = { openapi: '3.0.0', info: { version: '2.0.0' }, paths: { '/ping': {} } };
      axios.get.mockResolvedValueOnce({ data: flatSpec });

      const spec = await store.fetchSpec();

      expect(spec).toEqual(flatSpec);
    });

    it('sets error and returns null on failure', async () => {
      const store = useDocsStore();
      axios.get.mockRejectedValueOnce(new Error('spec down'));

      const spec = await store.fetchSpec();

      expect(spec).toBeNull();
      expect(store.spec).toBeNull();
      expect(store.error).toBe('spec down');
      expect(store.loading).toBe(false);
    });

    it('uses response.data.message when present in a fetch error', async () => {
      const store = useDocsStore();
      axios.get.mockRejectedValueOnce({ response: { data: { message: 'spec forbidden' } } });

      const spec = await store.fetchSpec();

      expect(spec).toBeNull();
      expect(store.error).toBe('spec forbidden');
    });

    it('falls back to "An error occurred" when the spec error has no message', async () => {
      const store = useDocsStore();
      axios.get.mockRejectedValueOnce({});

      const spec = await store.fetchSpec();

      expect(spec).toBeNull();
      expect(store.error).toBe('An error occurred');
    });
  });

  it('clearError resets the error state', () => {
    const store = useDocsStore();
    store.error = 'x';
    store.clearError();
    expect(store.error).toBeNull();
  });
});
