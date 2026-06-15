import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { setActivePinia, createPinia } from 'pinia';

// Mock vuetify composables used in the component script
vi.mock('vuetify', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTheme: () => ({
      name: 'light',
      current: { colors: { onSurface: '#111111', onBackground: '#222222', background: '#ffffff' } },
    }),
  };
});

// Mock auth store — logged out so the app bar renders.
const authStoreState = vi.hoisted(() => ({ isLoggedIn: false }));
vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => authStoreState,
}));

import CoreHeaderComponent from '../components/core.header.component.vue';

/**
 * @desc Minimal config mock — only the keys the component reads.
 * @returns {Object}
 */
const makeConfig = () => ({
  app: { title: 'Test App' },
  sign: { in: true },
  header: { title: 'Test App', logo: null, links: [], shortcuts: [] },
  vuetify: {
    theme: {
      flat: false,
      maxWidth: '1200px',
      rounded: 'rounded-xl',
      header: { opacity: 0.8, scrollBehavior: undefined, colorMode: undefined, color: '#000000' },
    },
  },
});

/**
 * @desc Mount the header component with router + config globals.
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountHeader = () => {
  const vuetify = createVuetify({ components, directives });
  const push = vi.fn();
  return mount(CoreHeaderComponent, {
    global: {
      plugins: [vuetify],
      mocks: { $router: { push }, $route: { path: '/' } },
      config: { globalProperties: { config: makeConfig() } },
      // VAppBar needs an injected layout (v-app); stub it so we can exercise the
      // navigate() method in isolation without a full layout wrapper.
      stubs: { 'v-app-bar': { template: '<header><slot /></header>' } },
    },
  });
};

describe('CoreHeaderComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('navigate', () => {
    it('opens external links with noopener,noreferrer (reverse-tabnabbing guard)', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const wrapper = mountHeader();

      wrapper.vm.navigate('https://example.com');

      expect(openSpy).toHaveBeenCalledTimes(1);
      const features = openSpy.mock.calls[0][2];
      expect(features).toBeTypeOf('string');
      expect(features).toContain('noopener');
      expect(features).toContain('noreferrer');
    });

    it('routes internal links via $router.push (no window.open)', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const wrapper = mountHeader();

      wrapper.vm.navigate('/dashboard');

      expect(openSpy).not.toHaveBeenCalled();
      expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/dashboard');
    });
  });
});
