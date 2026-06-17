import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createRouter, createWebHistory } from 'vue-router';
import { setActivePinia, createPinia } from 'pinia';
import { useDocsStore } from '../stores/docs.store';

vi.mock('@/config', () => ({
  default: {
    api: { protocol: 'https', host: 'api.example.com', port: '', base: 'api' },
    docs: {
      home: { title: 'Documentation' },
      reference: {
        icon: 'fa-solid fa-code',
        title: 'API reference',
        subtitle: 'Every endpoint.',
        tagGuides: { Items: 'getting-started' },
      },
    },
  },
}));

import DocsReference from '../views/docs.reference.view.vue';

/**
 * Create a Vuetify instance with all components and directives for test mounts.
 * @returns {import('vuetify').Vuetify}
 */
const vuetify = () => createVuetify({ components, directives });

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/docs', name: 'docs', component: { template: '<div />' } },
    { path: '/docs/api', name: 'reference', component: { template: '<div />' } },
    { path: '/docs/:category/:slug', name: 'article', component: { template: '<div />' } },
  ],
});

// Minimal global stub for the markdown plugin component (registered app-wide in
// main.js, absent in the unit mount) — renders its `source` so assertions work.
const VMarkdown = {
  name: 'VMarkdown',
  props: { source: { type: String, default: '' } },
  template: '<div class="vmarkdown-stub">{{ source }}</div>',
};

const spec = {
  info: { title: 'Example API', version: '2.1.0' },
  tags: [{ name: 'Items', description: 'Item CRUD.' }],
  paths: {
    '/api/items': {
      get: {
        tags: ['Items'],
        summary: 'List items',
        security: [{ apiKeyAuth: [] }],
        parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }],
        responses: { 200: { description: 'OK' }, 401: { description: 'Unauthenticated' } },
      },
    },
  },
};

const tree = {
  categories: [
    {
      slug: 'getting-started',
      title: 'Getting Started',
      order: 1,
      articles: [{ slug: 'install', title: 'Install', order: 1 }],
    },
  ],
};

/**
 * Mount DocsReference with the docs store pre-seeded.
 * @param {{ specData?: Object|null, treeData?: Object|null }} [opts]
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountReference = ({ specData = spec, treeData = tree } = {}) => {
  const store = useDocsStore();
  // Seed the caches so fetchTree/fetchSpec short-circuit (no axios call).
  store.tree = treeData;
  store.spec = specData;
  return mount(DocsReference, {
    global: { plugins: [vuetify(), router], components: { VMarkdown } },
  });
};

describe('docs.reference.view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders a group per tag with its endpoints', async () => {
    const wrapper = mountReference();
    await flushPromises();
    const groups = wrapper.findAll('[data-test="docs-reference-group"]');
    expect(groups).toHaveLength(1);
    expect(wrapper.find('[data-test="docs-reference-group-title"]').text()).toBe('Items');
    expect(wrapper.findAll('[data-test="docs-reference-endpoint"]')).toHaveLength(1);
    expect(wrapper.find('[data-test="docs-reference-method"]').text()).toBe('GET');
  });

  it('shows the spec version', async () => {
    const wrapper = mountReference();
    await flushPromises();
    expect(wrapper.find('[data-test="docs-reference-version"]').text()).toContain('2.1.0');
  });

  it('renders a guide cross-link when the tag maps to a known category', async () => {
    const wrapper = mountReference();
    await flushPromises();
    const link = wrapper.find('[data-test="docs-reference-guide-link"]');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('/docs/getting-started/install');
  });

  it('omits the guide cross-link when the tree lacks the mapped category', async () => {
    const wrapper = mountReference({ treeData: { categories: [] } });
    await flushPromises();
    expect(wrapper.find('[data-test="docs-reference-guide-link"]').exists()).toBe(false);
  });

  it('shows the empty state when the spec is unavailable', async () => {
    const store = useDocsStore();
    store.tree = tree;
    // Stub both actions so onMounted resolves without axios + leaves spec null.
    store.fetchTree = vi.fn().mockResolvedValue(tree);
    store.fetchSpec = vi.fn().mockResolvedValue(null);
    const wrapper = mount(DocsReference, {
      global: { plugins: [vuetify(), router], components: { VMarkdown } },
    });
    await flushPromises();
    expect(wrapper.find('[data-test="docs-reference-empty"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="docs-reference-group"]').exists()).toBe(false);
  });
});
