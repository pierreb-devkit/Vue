import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { mount, flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createRouter, createWebHistory } from 'vue-router';
import { setActivePinia, createPinia } from 'pinia';
import { useDocsStore } from '../stores/docs.store';

vi.mock('@/config', () => ({
  default: {
    docs: { home: { title: 'Documentation' } },
  },
}));

import DocsArticle from '../views/docs.article.view.vue';

/**
 * Create a Vuetify instance with all components and directives for test mounts.
 * @returns {import('vuetify').Vuetify}
 */
const vuetify = () => createVuetify({ components, directives });

const routes = [
  { path: '/docs', name: 'docs', component: { template: '<div />' } },
  {
    path: '/docs/:category/:slug',
    name: 'article',
    component: DocsArticle,
  },
];

const tree = {
  categories: [
    {
      slug: 'guide',
      title: 'Guide',
      order: 1,
      articles: [
        { slug: 'alpha', title: 'Alpha', category: 'guide', order: 1 },
        { slug: 'beta', title: 'Beta', category: 'guide', order: 2 },
      ],
    },
  ],
};

/**
 * Mount DocsArticle with the docs store pre-seeded and the router at the given
 * article path.
 * @param {string} slug - Article slug to navigate to.
 * @param {Object} [overrides] - Optional store action overrides.
 * @returns {{ wrapper: import('@vue/test-utils').VueWrapper, store: Object, router: Object }}
 */
const mountArticle = async (slug, overrides = {}) => {
  const router = createRouter({ history: createWebHistory(), routes });
  const store = useDocsStore();
  store.tree = tree;
  store.fetchTree = vi.fn().mockResolvedValue(tree);
  store.fetchArticle = overrides.fetchArticle
    ?? vi.fn().mockResolvedValue(`# ${slug}\n\nBody.`);

  await router.push(`/docs/guide/${slug}`);
  await router.isReady();

  const wrapper = mount(DocsArticle, {
    global: { plugins: [vuetify(), router] },
  });
  return { wrapper, store, router };
};

describe('docs.article.view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the article title and body for the current slug', async () => {
    const { wrapper } = await mountArticle('alpha');
    await flushPromises();
    // The title comes from meta.title ('Alpha') or falls back to the first h1.
    // The tree has the article with title 'Alpha'.
    expect(wrapper.find('[data-test="docs-article-title"]').text()).toBe('Alpha');
  });

  it('shows the loading spinner while the store is fetching', async () => {
    // Set loading manually (simulating an in-flight action) then verify the
    // spinner appears. The store's `loading` ref drives the spinner.
    const { wrapper, store } = await mountArticle('alpha');
    store.loading = true;
    await flushPromises();
    expect(wrapper.find('[data-test="docs-article-loading"]').exists()).toBe(true);
    store.loading = false;
    await flushPromises();
    expect(wrapper.find('[data-test="docs-article-loading"]').exists()).toBe(false);
  });

  it('shows the not-found alert when the article returns null', async () => {
    const { wrapper } = await mountArticle('missing', {
      fetchArticle: vi.fn().mockResolvedValue(null),
    });
    await flushPromises();
    expect(wrapper.find('[data-test="docs-article-notfound"]').exists()).toBe(true);
  });

  it('race guard: stale response from an earlier slug is discarded', async () => {
    // alpha resolves AFTER beta so without the guard alpha would overwrite beta.
    let resolveAlpha;
    const alphaMarkdown = '# Alpha\n\nAlpha body.';
    const betaMarkdown = '# Beta\n\nBeta body.';

    const fetchArticle = vi.fn((slug) => {
      if (slug === 'alpha') return new Promise((r) => { resolveAlpha = () => r(alphaMarkdown); });
      return Promise.resolve(betaMarkdown);
    });

    const { wrapper, router } = await mountArticle('alpha', { fetchArticle });

    // Navigate to beta before alpha resolves.
    router.push('/docs/guide/beta');
    await flushPromises();

    // Now let the stale alpha response resolve.
    resolveAlpha();
    await flushPromises();

    // The view should show beta, not alpha (stale result discarded).
    expect(wrapper.find('[data-test="docs-article-title"]').text()).toBe('Beta');
  });

  it('renders a markdown table with a header row wrapped in a scroll container', async () => {
    const md = '# Alpha\n\n| Field | Notes |\n| --- | --- |\n| a | line one<br>line two |\n';
    const { wrapper } = await mountArticle('alpha', {
      fetchArticle: vi.fn().mockResolvedValue(md),
    });
    await flushPromises();
    const body = wrapper.find('[data-test="docs-article-body"]');
    expect(body.classes()).toContain('docs-prose');
    // The table stays a real <table> (native accessibility semantics) inside
    // a `.docs-table-scroll` wrapper that owns the horizontal scroll instead.
    expect(body.find('.docs-table-scroll table thead th').exists()).toBe(true);
    expect(body.findAll('.docs-table-scroll table tbody td')).toHaveLength(2);
  });

  it('preserves column alignment on a wrapped table', async () => {
    const md = '# Alpha\n\n| Left | Center |\n| --- | :-: |\n| a | b |\n';
    const { wrapper } = await mountArticle('alpha', {
      fetchArticle: vi.fn().mockResolvedValue(md),
    });
    await flushPromises();
    const body = wrapper.find('[data-test="docs-article-body"]');
    const headers = body.findAll('.docs-table-scroll table thead th');
    expect(headers[0].attributes('align')).toBeUndefined();
    expect(headers[1].attributes('align')).toBe('center');
  });

  it('wraps a header-only table (no body rows) without an empty tbody', async () => {
    const md = '# Alpha\n\n| Field | Notes |\n| --- | --- |\n';
    const { wrapper } = await mountArticle('alpha', {
      fetchArticle: vi.fn().mockResolvedValue(md),
    });
    await flushPromises();
    const body = wrapper.find('[data-test="docs-article-body"]');
    expect(body.find('.docs-table-scroll table thead th').exists()).toBe(true);
    expect(body.find('.docs-table-scroll table tbody').exists()).toBe(false);
  });

  it('styles prose tables with borders, padding and a scroll wrapper using theme tokens only', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/docs.article.view.vue'), 'utf8');
    const style = sfc.slice(sfc.indexOf('<style scoped>'));
    const rule = (selector) => {
      const start = style.indexOf(`${selector} {`);
      expect(start).toBeGreaterThan(-1);
      return style.slice(start, style.indexOf('}', start));
    };
    const table = rule('.docs-prose :deep(table)');
    // The table keeps its native display (no `display: block`) so screen
    // readers retain table semantics; the wrapper below owns the scroll.
    expect(table).not.toMatch(/display:/);
    // No `width: max-content` either — that would force every cell onto one
    // line (a prose column never wraps). The table sizes and wraps like any
    // normal block table, only overflowing into the wrapper when a cell
    // truly cannot shrink.
    expect(table).not.toMatch(/width:/);
    expect(table).toMatch(/border-collapse: collapse;/);
    const scroll = rule('.docs-prose :deep(.docs-table-scroll)');
    expect(scroll).toMatch(/max-width: 100%;/);
    expect(scroll).toMatch(/overflow-x: auto;/);
    const cell = rule('.docs-prose :deep(td)');
    expect(style).toMatch(/\.docs-prose :deep\(th\),\s*\.docs-prose :deep\(td\) \{/);
    expect(cell).toMatch(/border: 1px solid rgba\(var\(--v-border-color\), [\d.]+\);/);
    expect(cell).toMatch(/padding: 10px 14px;/);
    // No unconditional `text-align` on th/td: that would override marked's
    // `align="center"`/`align="right"` attribute on an aligned column, so
    // every column would render left-aligned regardless of the markdown.
    expect(cell).not.toMatch(/text-align:/);
    const unalignedHeader = rule('.docs-prose :deep(th:not([align]))');
    expect(unalignedHeader).toMatch(/text-align: start;/);
    const head = rule('.docs-prose :deep(thead th)');
    expect(head).toMatch(/background: rgba\(var\(--v-theme-on-surface\), [\d.]+\);/);
    // theme tokens only: no hardcoded hex colors, so light and dark both work
    expect(style).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
