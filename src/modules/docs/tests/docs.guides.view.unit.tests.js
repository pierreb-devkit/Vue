import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import { createRouter, createMemoryHistory } from 'vue-router';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// Mock config
vi.mock('../../../lib/services/config', () => ({
  default: {
    vuetify: {
      theme: {
        rounded: 'rounded-lg',
        maxWidth: '1200px',
      },
    },
  },
}));

import DocsGuidesView from '../views/docs.guides.view.vue';

describe('Docs Guides View', () => {
  let vuetify;
  let router;

  beforeEach(async () => {
    vuetify = createVuetify({ components, directives });
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/docs/guides', name: 'DocsGuides', component: DocsGuidesView },
        { path: '/docs/guides/:slug', name: 'DocsGuide', component: { template: '<div />' } },
      ],
    });
    router.push('/docs/guides');
    await router.isReady();
    vi.clearAllMocks();
  });

  const mountView = () => mount(DocsGuidesView, {
    global: {
      plugins: [vuetify, router],
    },
  });

  it('should render the page title', () => {
    const wrapper = mountView();
    expect(wrapper.text()).toContain('Guides');
  });

  it('should render three guide cards', () => {
    const wrapper = mountView();
    const cards = wrapper.findAllComponents({ name: 'VCard' });
    expect(cards.length).toBe(3);
  });

  it('should display guide titles', () => {
    const wrapper = mountView();
    expect(wrapper.text()).toContain('Getting Started');
    expect(wrapper.text()).toContain('Authentication');
    expect(wrapper.text()).toContain('Organizations');
  });

  it('should have links to individual guide pages', () => {
    const wrapper = mountView();
    const cards = wrapper.findAllComponents({ name: 'VCard' });
    const hrefs = cards.map((card) => card.props('to'));
    expect(hrefs).toContainEqual({ name: 'DocsGuide', params: { slug: 'getting-started' } });
    expect(hrefs).toContainEqual({ name: 'DocsGuide', params: { slug: 'authentication' } });
    expect(hrefs).toContainEqual({ name: 'DocsGuide', params: { slug: 'organizations' } });
  });
});
