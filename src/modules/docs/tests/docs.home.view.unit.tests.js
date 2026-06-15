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
        command: 'curl https://api.example.com/api/resource \\\n  -H "Authorization: Bearer <YOUR_API_KEY>"',
        result: '{\n  "status": "config-driven-result"\n}',
        cta: { label: 'Read the full quickstart', target: { category: 'get-started' } },
      },
    },
  },
}));

import DocsHome from '../views/docs.home.view.vue';

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

  it('renders the quickstart hero with a highlighted command + result from config', async () => {
    const wrapper = mountHome();
    await flushPromises();
    expect(wrapper.find('[data-test="docs-home-quickstart"]').exists()).toBe(true);
    // Content comes from config.docs.quickstart.command / .result — NOT hardcoded consts.
    expect(wrapper.find('[data-test="docs-home-quickstart-command"]').text()).toContain('curl');
    expect(wrapper.find('[data-test="docs-home-quickstart-result"]').text()).toContain('config-driven-result');
  });

  it('quickstart command and result are config-driven (not hardcoded)', async () => {
    // Mount with a custom quickstart snippet to prove the view reads from config.
    const store = useDocsStore();
    store.tree = tree;
    // Override config mock locally for this test — since vi.mock is module-level,
    // we verify by checking the rendered HTML contains the mock-provided strings.
    const wrapper = mount(DocsHome, {
      global: { plugins: [vuetify(), router] },
    });
    await flushPromises();
    const cmdEl = wrapper.find('[data-test="docs-home-quickstart-command"]');
    const resEl = wrapper.find('[data-test="docs-home-quickstart-result"]');
    // The mock provides `command` with "api.example.com" and `result` with
    // "config-driven-result" — both should appear in the rendered terminal.
    expect(cmdEl.text()).toContain('api.example.com');
    expect(resEl.text()).toContain('config-driven-result');
    // Confirm the OLD hardcoded strings ("Example Domain", "text") are absent.
    expect(resEl.text()).not.toContain('Example Domain');
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
