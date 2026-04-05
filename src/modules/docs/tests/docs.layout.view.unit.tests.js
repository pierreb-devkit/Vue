import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import { createRouter, createMemoryHistory } from 'vue-router';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import DocsLayoutView from '../views/docs.layout.view.vue';

describe('Docs Layout View', () => {
  let vuetify;

  beforeEach(() => {
    vuetify = createVuetify({ components, directives });
    vi.clearAllMocks();
  });

  const mountLayout = async (path) => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/docs',
          component: DocsLayoutView,
          children: [
            { path: '', name: 'Docs', component: { template: '<div class="api-ref" />' } },
            { path: 'guides', name: 'DocsGuides', component: { template: '<div class="guides-list" />' } },
            { path: 'guides/:slug', name: 'DocsGuide', component: { template: '<div class="guide-single" />' } },
          ],
        },
      ],
    });
    router.push(path);
    await router.isReady();
    return mount(DocsLayoutView, {
      global: {
        plugins: [vuetify, router],
      },
    });
  };

  it('should render navigation tabs', async () => {
    const wrapper = await mountLayout('/docs');
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBeGreaterThanOrEqual(2);
  });

  it('should display API Reference and Guides tab labels', async () => {
    const wrapper = await mountLayout('/docs');
    expect(wrapper.text()).toContain('API Reference');
    expect(wrapper.text()).toContain('Guides');
  });

  it('should render a router-view for child content', async () => {
    const wrapper = await mountLayout('/docs');
    expect(wrapper.find('.api-ref').exists()).toBe(true);
  });

  it('should render guides child when on guides path', async () => {
    const wrapper = await mountLayout('/docs/guides');
    expect(wrapper.find('.guides-list').exists()).toBe(true);
  });
});
