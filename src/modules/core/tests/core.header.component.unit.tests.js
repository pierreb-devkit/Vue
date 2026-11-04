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
import headerSource from '../components/core.header.component.vue?raw';

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

  // #4803 — the mobile menu is one glass panel: a group with sublinks renders
  // as a subheader + flat items (no nested opaque v-list), and the burger icon
  // inherits the bar text color instead of a forced inline one.
  describe('mobile menu (#4803)', () => {
    /**
     * @desc Mount with one plain link, one item with sublinks and a shortcut;
     *       v-menu is stubbed to render its activator and content inline.
     * @returns {import('@vue/test-utils').VueWrapper}
     */
    const mountWithLinks = () => {
      const vuetify = createVuetify({ components, directives });
      const config = makeConfig();
      config.header.links = [
        { title: 'Pricing', url: '/pricing' },
        {
          title: 'Product',
          sublinks: [
            { title: 'Docs', url: '/docs', icon: 'fa-solid fa-book', subtitle: 'Read the docs' },
            { title: 'Blog', url: '/blog', icon: 'fa-solid fa-pen' },
          ],
        },
      ];
      config.header.shortcuts = [{ title: 'Start', url: '/signup', variant: 'flat' }];
      config.vuetify.theme.header.color = '#ffffff';
      return mount(CoreHeaderComponent, {
        global: {
          plugins: [vuetify],
          mocks: { $router: { push: vi.fn() }, $route: { path: '/', meta: {} } },
          config: { globalProperties: { config } },
          stubs: {
            'v-app-bar': { template: '<header><slot /></header>' },
            'v-menu': { template: '<div class="menu-stub"><slot name="activator" :props="{}" /><slot /></div>' },
          },
        },
      });
    };

    it('renders a group with sublinks as a subheader + flat items on transparent lists', () => {
      const wrapper = mountWithLinks();
      const card = wrapper.find('.v-card');
      expect(card.exists()).toBe(true);
      const subheader = card.find('.v-list-subheader');
      expect(subheader.exists()).toBe(true);
      expect(subheader.text()).toBe('Product');
      const [groupList, linkList] = card.findAll('.v-list');
      expect(groupList.findAll('.v-list-item-title').map((t) => t.text())).toEqual(['Docs', 'Blog']);
      expect(linkList.text()).toContain('Pricing');
      // no nested list, every list transparent on the glass card
      expect(card.find('.v-list .v-list').exists()).toBe(false);
      card.findAll('.v-list').forEach((list) => expect(list.classes()).toContain('bg-transparent'));
    });

    it('opens both header menus with the transform-only transition (glass blur from the first frame)', () => {
      const wrapper = mountWithLinks();
      const menus = wrapper.findAll('.menu-stub');
      expect(menus).toHaveLength(2);
      menus.forEach((menu) => expect(menu.attributes('transition')).toBe('header-menu-transition'));
    });

    it('never transitions opacity in the header menu transition', () => {
      const rules = headerSource.match(/\.header-menu-transition[^{]*\{[^}]*\}/g) || [];
      expect(rules.length).toBeGreaterThan(0);
      rules.forEach((rule) => expect(rule).not.toMatch(/opacity/));
    });

    it('does not force an inline color on the burger icon', () => {
      const wrapper = mountWithLinks();
      const burger = wrapper.find('.fa-bars');
      expect(burger.exists()).toBe(true);
      expect(burger.attributes('style') || '').not.toContain('color');
    });

    it('sizes the sublinks activator like the plain links', () => {
      const wrapper = mountWithLinks();
      const activator = wrapper.findAll('.v-btn').find((b) => b.text().startsWith('Product'));
      expect(activator.classes()).toContain('text-body-medium');
      expect(activator.classes()).not.toContain('text-body-large');
    });

    describe('Sign In tap target', () => {
      const originalWidth = window.innerWidth;
      afterEach(() => {
        window.innerWidth = originalWidth;
      });

      /**
       * @desc Find the Sign In button height style at a given viewport width.
       * @param {Number} width - window.innerWidth before Vuetify is created.
       * @returns {String}
       */
      const signInStyle = (width) => {
        window.innerWidth = width;
        const wrapper = mountWithLinks();
        const signIn = wrapper.findAll('.v-btn').find((b) => b.text() === 'Sign In');
        return signIn.attributes('style') || '';
      };

      it('is 44px tall on phones', () => {
        expect(signInStyle(375)).toContain('height: 44px');
      });

      it('keeps the default height on desktop', () => {
        expect(signInStyle(1280)).not.toContain('height: 44px');
      });
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
