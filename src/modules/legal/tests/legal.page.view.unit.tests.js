import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
let currentRouteParams = { slug: 'terms' };
vi.mock('vue-router', () => ({ useRoute: () => ({ params: currentRouteParams }) }));

vi.mock('../composables/useLegalPage', () => ({ useLegalPage: vi.fn() }));

import LegalPageView from '../views/legal.page.view.vue';
import { useLegalPage as useLegalPageMock } from '../composables/useLegalPage';

const vuetify = () => createVuetify({ components, directives });

/**
 * Mounts LegalPageView with a stubbed route param slug and optional config mock.
 * @param {string} [slug='terms'] - Route param to simulate
 * @param {object} [config={}] - Config mock injected via Vue Test Utils mocks
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountView = (slug = 'terms', config = {}) => {
  currentRouteParams = { slug };
  return mount(LegalPageView, {
    global: {
      plugins: [vuetify()],
      mocks: { config },
    },
  });
};

describe('legal.page.view', () => {
  it('renders title + html for a valid page', async () => {
    useLegalPageMock.mockResolvedValueOnce({ title: 'Terms', html: '<h1>Terms</h1><p>Body</p>', notFound: false });
    const wrapper = mountView('terms');
    await flushPromises();
    expect(wrapper.text()).toContain('Terms');
    expect(wrapper.html()).toContain('<h1>Terms</h1>');
  });

  it('renders not found message for unknown slug', async () => {
    useLegalPageMock.mockResolvedValueOnce({ title: '', html: '', notFound: true });
    const wrapper = mountView('unknown');
    await flushPromises();
    expect(wrapper.text()).toContain('This legal page does not exist.');
  });
});
