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
    docs: {
      home: { icon: 'fa-solid fa-book', title: 'Documentation', subtitle: 'Guides.' },
      personas: [
        { key: 'developer', icon: 'fa-solid fa-code', title: 'Developer', subtitle: 'curl', cta: 'Quickstart →', color: 'primary', target: { category: 'get-started' } },
        { key: 'integrator', icon: 'fa-solid fa-plug', title: 'Integrator', subtitle: 'webhooks', cta: 'Integrations →', color: 'secondary', target: { category: 'integrate' } },
        { key: 'operator', icon: 'fa-solid fa-gauge-high', title: 'Operator', subtitle: 'limits', cta: 'Guides →', color: 'info', target: { category: 'operate' } },
      ],
      quickstart: {
        eyebrow: 'Quickstart',
        title: 'One call.',
        subtitle: 'Structured JSON.',
        language: 'bash',
        cta: { label: 'Read the full quickstart', target: { category: 'get-started' } },
      },
    },
  },
}));

import DocsHome from '../views/docs.home.view.vue';

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
      slug: 'get-started',
      title: 'Get Started',
      order: 1,
      articles: [{ slug: 'install', title: 'Install', order: 1 }],
    },
    {
      slug: 'operate',
      title: 'Operate',
      order: 2,
      articles: [{ slug: 'rate-limits', title: 'Rate limits', order: 1 }],
    },
  ],
};

/**
 * Mount DocsHome with a docs store pre-seeded with `seedTree`.
 * @param {Object|null} seedTree - The guide tree to seed.
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountHome = (seedTree = tree) => {
  const store = useDocsStore();
  store.tree = seedTree;
  return mount(DocsHome, {
    global: { plugins: [vuetify(), router] },
  });
};

describe('docs.home.view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders exactly three persona doors', async () => {
    const wrapper = mountHome();
    await flushPromises();
    const doors = wrapper.findAll('[data-test-door]');
    expect(doors).toHaveLength(3);
    expect(wrapper.find('[data-test="docs-home-door-developer"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="docs-home-door-integrator"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="docs-home-door-operator"]').exists()).toBe(true);
  });

  it('resolves a persona door to its category\'s first article', async () => {
    const wrapper = mountHome();
    await flushPromises();
    const developer = wrapper.find('[data-test="docs-home-door-developer"]');
    expect(developer.attributes('href')).toBe('/docs/get-started/install');
  });

  it('renders the quickstart hero with a highlighted command + result', async () => {
    const wrapper = mountHome();
    await flushPromises();
    expect(wrapper.find('[data-test="docs-home-quickstart"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="docs-home-quickstart-command"]').text()).toContain('curl');
    expect(wrapper.find('[data-test="docs-home-quickstart-result"]').text()).toContain('success');
  });

  it('renders the job-first category grid from the tree', async () => {
    const wrapper = mountHome();
    await flushPromises();
    const cats = wrapper.findAll('[data-test="docs-home-category"]');
    expect(cats).toHaveLength(2);
    expect(wrapper.text()).toContain('Get Started');
    expect(wrapper.text()).toContain('Operate');
  });

  it('still renders the three doors when the tree is empty', async () => {
    const wrapper = mountHome({ categories: [] });
    await flushPromises();
    expect(wrapper.findAll('[data-test-door]')).toHaveLength(3);
    expect(wrapper.find('[data-test="docs-home-empty"]').exists()).toBe(true);
  });
});
