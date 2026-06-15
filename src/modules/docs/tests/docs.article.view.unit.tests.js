import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
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
});
