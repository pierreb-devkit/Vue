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
 * @param {String} routePath - `$route.path` mock.
 * @param {Object} headerExtra - merged into `config.vuetify.theme.header`.
 * @param {Object} routeMeta - `$route.meta` mock (e.g. `{ orgGate: true }`).
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountHeader = (routePath = '/', headerExtra = {}, routeMeta = {}) => {
  const vuetify = createVuetify({ components, directives });
  const push = vi.fn();
  const config = makeConfig();
  Object.assign(config.vuetify.theme.header, headerExtra);
  return mount(CoreHeaderComponent, {
    global: {
      plugins: [vuetify],
      mocks: { $router: { push }, $route: { path: routePath, meta: routeMeta } },
      config: { globalProperties: { config } },
      // VAppBar needs an injected layout (v-app); stub it so we can exercise the
      // navigate() method in isolation without a full layout wrapper. The stub
      // still honours the element's v-if, so `find('header')` doubles as a
      // "is the header shown?" probe.
      stubs: { 'v-app-bar': { template: '<header><slot /></header>' } },
    },
  });
};

describe('CoreHeaderComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    authStoreState.isLoggedIn = false; // default logged-out; org-required tests opt in
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // #4421 — the header force-shows on the org-required gate page (the sidenav
  // is hidden there) unless a sidenav-only consumer opts out via config.
  // #4448 — driven by `meta.orgGate` (set by organizations.router.js), not a
  // hardcoded '/organization-required' path literal — core must not know
  // module route URLs.
  describe('org-required header visibility (#4421, #4448)', () => {
    it('shows the header on the org-gate route by default (signed-in, no org)', () => {
      authStoreState.isLoggedIn = true;
      const wrapper = mountHeader('/organization-required', {}, { orgGate: true });
      expect(wrapper.find('header').exists()).toBe(true);
    });

    it('hides it there when the consumer opts out (showOnOrgRequired: false)', () => {
      authStoreState.isLoggedIn = true;
      const wrapper = mountHeader('/organization-required', { showOnOrgRequired: false }, { orgGate: true });
      expect(wrapper.find('header').exists()).toBe(false);
    });

    it('keeps the header hidden on ordinary signed-in routes', () => {
      authStoreState.isLoggedIn = true;
      const wrapper = mountHeader('/tasks');
      expect(wrapper.find('header').exists()).toBe(false);
    });

    it('still shows the public header when signed out', () => {
      const wrapper = mountHeader('/tasks');
      expect(wrapper.find('header').exists()).toBe(true);
    });

    // #4448 — proves the decoupling: the path literal alone no longer drives
    // visibility (meta flag is what matters), and vice versa.
    it('does NOT show the header on /organization-required without meta.orgGate (path literal alone no longer drives it)', () => {
      authStoreState.isLoggedIn = true;
      const wrapper = mountHeader('/organization-required');
      expect(wrapper.find('header').exists()).toBe(false);
    });

    it('shows the header on any route carrying meta.orgGate, regardless of path', () => {
      authStoreState.isLoggedIn = true;
      const wrapper = mountHeader('/some-other-gate-path', {}, { orgGate: true });
      expect(wrapper.find('header').exists()).toBe(true);
    });
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
