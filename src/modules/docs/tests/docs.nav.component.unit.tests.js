import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createRouter, createWebHistory } from 'vue-router';
import { setActivePinia, createPinia } from 'pinia';
import { useDocsStore } from '../stores/docs.store';

vi.mock('@/config', () => ({
  default: { docs: { home: { title: 'Documentation' } } },
}));

import DocsNav from '../components/docs.nav.component.vue';

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
      slug: 'integrate',
      title: 'Integrate',
      order: 2,
      articles: [{ slug: 'webhooks', title: 'Webhooks', order: 1 }],
    },
    {
      slug: 'getting-started',
      title: 'Getting Started',
      order: 1,
      articles: [
        { slug: 'quickstart', title: 'Quickstart', order: 2 },
        { slug: 'install', title: 'Install', order: 1 },
      ],
    },
  ],
};

/**
 * Mount DocsNav with a docs store pre-seeded with the given tree.
 * @param {Object|null} seedTree - The guide tree to seed (or null for empty).
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountNav = (seedTree = tree) => {
  const store = useDocsStore();
  store.tree = seedTree;
  return mount(DocsNav, {
    global: { plugins: [vuetify(), router] },
  });
};

describe('docs.nav.component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders one group per category in contract (order) order', () => {
    const wrapper = mountNav();
    const groups = wrapper.findAll('[data-test="docs-nav-category"]');
    expect(groups).toHaveLength(2);
    const headings = wrapper.findAll('.docs-nav__heading').map((n) => n.text());
    expect(headings).toEqual(['Getting Started', 'Integrate']);
  });

  it('renders each category\'s articles order-sorted as links', () => {
    const wrapper = mountNav();
    const links = wrapper.findAll('[data-test="docs-nav-article"]');
    expect(links.map((l) => l.text())).toEqual(['Install', 'Quickstart', 'Webhooks']);
  });

  it('shows an empty state when there are no categories', () => {
    const wrapper = mountNav({ categories: [] });
    expect(wrapper.find('[data-test="docs-nav-empty"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-test="docs-nav-category"]')).toHaveLength(0);
  });
});
