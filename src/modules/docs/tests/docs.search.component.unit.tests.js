import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createRouter, createWebHistory } from 'vue-router';
import { setActivePinia, createPinia } from 'pinia';
import { useDocsStore } from '../stores/docs.store';

// The docs search is a client-side fuzzy match over the guide tree — no hosted
// index, no extra config beyond the user-facing copy.
vi.mock('@/config', () => ({
  default: {
    docs: {
      search: {
        label: 'Search',
        placeholder: 'Search the docs…',
        idleLabel: 'Type to search the documentation.',
      },
    },
  },
}));

import DocsSearch from '../components/docs.search.component.vue';

/**
 * Create a Vuetify instance with all components and directives for test mounts.
 * @returns {import('vuetify').Vuetify}
 */
const vuetify = () => createVuetify({ components, directives });

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/docs', name: 'docs', component: { template: '<div />' } },
    { path: '/docs/:category/:slug', name: 'article', component: { template: '<div />' } },
  ],
});

const tree = {
  categories: [
    {
      slug: 'getting-started',
      title: 'Getting Started',
      order: 1,
      articles: [
        { slug: 'install', title: 'Install the CLI', order: 1 },
        { slug: 'quickstart', title: 'Quickstart', order: 2 },
      ],
    },
    {
      slug: 'integrate',
      title: 'Integrate',
      order: 2,
      articles: [{ slug: 'webhooks', title: 'Webhook integration', order: 1 }],
    },
  ],
};

/**
 * Mount DocsSearch with a docs store pre-seeded with the guide tree.
 * @param {Object|null} seedTree - The guide tree to seed.
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountSearch = (seedTree = tree) => {
  const store = useDocsStore();
  store.tree = seedTree;
  // Avoid a real network call from the dialog-open watcher.
  store.fetchTree = vi.fn().mockResolvedValue(seedTree);
  return mount(DocsSearch, {
    global: {
      plugins: [vuetify(), router],
      // Stub VDialog (overlay positioning needs `visualViewport`, absent in
      // happy-dom). Render the slot only when open so the fallback list
      // mounts/unmounts with `dialog`.
      stubs: {
        VDialog: {
          props: ['modelValue'],
          template: '<div v-if="modelValue" data-test="docs-search-dialog"><slot /></div>',
        },
      },
    },
  });
};

describe('docs.search.component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the trigger button with the ⌘K / Ctrl K hint', () => {
    const wrapper = mountSearch();
    const trigger = wrapper.find('[data-test="docs-search-trigger"]');
    expect(trigger.exists()).toBe(true);
    expect(wrapper.find('.docs-search__kbd').text()).toMatch(/⌘K|Ctrl K/);
  });

  it('opens the modal on a ⌘K / Ctrl+K keydown', async () => {
    const wrapper = mountSearch();
    expect(wrapper.vm.dialog).toBe(false);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    await flushPromises();
    expect(wrapper.vm.dialog).toBe(true);

    // Toggles back closed.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    await flushPromises();
    expect(wrapper.vm.dialog).toBe(false);
  });

  it('opens the modal via the trigger button click', async () => {
    const wrapper = mountSearch();
    await wrapper.find('[data-test="docs-search-trigger"]').trigger('click');
    await flushPromises();
    expect(wrapper.vm.dialog).toBe(true);
  });

  it('returns client-side fuzzy results for a query', async () => {
    const wrapper = mountSearch();
    wrapper.vm.dialog = true;
    await flushPromises();

    // Substring match.
    wrapper.vm.query = 'quick';
    await flushPromises();
    let titles = wrapper.vm.results.map((h) => h.title);
    expect(titles).toContain('Quickstart');

    // Fuzzy subsequence match ("wbk" hits "Webhook integration").
    wrapper.vm.query = 'wbk';
    await flushPromises();
    titles = wrapper.vm.results.map((h) => h.title);
    expect(titles).toContain('Webhook integration');
  });

  it('ranks title-prefix matches above other matches', async () => {
    const wrapper = mountSearch();
    wrapper.vm.dialog = true;
    await flushPromises();
    wrapper.vm.query = 'install';
    await flushPromises();
    expect(wrapper.vm.results[0].title).toBe('Install the CLI');
    expect(wrapper.vm.results[0].category).toBe('getting-started');
  });

  it('navigates to the selected article and closes the modal', async () => {
    const push = vi.spyOn(router, 'push');
    const wrapper = mountSearch();
    wrapper.vm.dialog = true;
    await flushPromises();
    wrapper.vm.query = 'quickstart';
    await flushPromises();

    wrapper.vm.selectActive();
    await flushPromises();
    expect(push).toHaveBeenCalledWith('/docs/getting-started/quickstart');
    expect(wrapper.vm.dialog).toBe(false);
  });

  it('returns no results for a query that matches nothing', async () => {
    const wrapper = mountSearch();
    wrapper.vm.dialog = true;
    await flushPromises();
    wrapper.vm.query = 'zzzznotathing';
    await flushPromises();
    expect(wrapper.vm.results).toHaveLength(0);
  });

  // Fuzzy is THE search — there is no hosted-index backend and no host element to
  // mount one into. Opening the dialog renders the fuzzy input + idle/results
  // directly, with no Algolia config present in the mock.
  it('renders the fuzzy search input directly (no Algolia host element)', async () => {
    const wrapper = mountSearch();
    wrapper.vm.dialog = true;
    await flushPromises();

    // The fuzzy input and idle state render immediately on open.
    expect(wrapper.find('[data-test="docs-search-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="docs-search-idle"]').exists()).toBe(true);
    // No Algolia DocSearch host element exists — the branch is gone.
    expect(wrapper.find('[data-test="docs-search-docsearch"]').exists()).toBe(false);

    // And the fuzzy path still ranks results with no Algolia config present.
    wrapper.vm.query = 'install';
    await flushPromises();
    expect(wrapper.vm.results[0].title).toBe('Install the CLI');
  });
});
