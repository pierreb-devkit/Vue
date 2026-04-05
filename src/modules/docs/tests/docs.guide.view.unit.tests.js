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

// Mock raw markdown imports
vi.mock('../guides/getting-started.md?raw', () => ({ default: '# Getting Started\n\nWelcome to the stack.' }));
vi.mock('../guides/authentication.md?raw', () => ({ default: '# Authentication\n\nJWT-based auth.' }));
vi.mock('../guides/organizations.md?raw', () => ({ default: '# Organizations\n\nTeam management.' }));

import DocsGuideView from '../views/docs.guide.view.vue';

describe('Docs Guide View', () => {
  let vuetify;

  const createTestRouter = () => createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/docs/guides', name: 'DocsGuides', component: { template: '<div />' } },
      { path: '/docs/guides/:slug', name: 'DocsGuide', component: DocsGuideView },
    ],
  });

  beforeEach(() => {
    vuetify = createVuetify({ components, directives });
    vi.clearAllMocks();
  });

  const mountView = async (slug) => {
    const router = createTestRouter();
    router.push(`/docs/guides/${slug}`);
    await router.isReady();
    return mount(DocsGuideView, {
      global: {
        plugins: [vuetify, router],
        stubs: {
          VMarkdown: {
            props: ['source'],
            template: '<div class="v-markdown">{{ source }}</div>',
          },
        },
      },
    });
  };

  it('should render markdown content for a valid slug', async () => {
    const wrapper = await mountView('getting-started');
    const md = wrapper.find('.v-markdown');
    expect(md.exists()).toBe(true);
    expect(md.text()).toContain('Getting Started');
  });

  it('should render different content per slug', async () => {
    const wrapper = await mountView('authentication');
    const md = wrapper.find('.v-markdown');
    expect(md.text()).toContain('Authentication');
  });

  it('should show not-found state for unknown slug', async () => {
    const wrapper = await mountView('nonexistent');
    expect(wrapper.text()).toContain('Guide not found');
  });

  it('should have a back link to guides list', async () => {
    const wrapper = await mountView('getting-started');
    const backBtn = wrapper.findAllComponents({ name: 'VBtn' }).find(
      (btn) => btn.props('to')?.name === 'DocsGuides',
    );
    expect(backBtn).toBeDefined();
  });
});
