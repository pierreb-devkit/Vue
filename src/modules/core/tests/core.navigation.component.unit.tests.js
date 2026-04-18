import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { setActivePinia, createPinia } from 'pinia';

// Mock vuetify composables used in the component script setup
vi.mock('vuetify', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTheme: () => ({
      name: 'light',
      current: { colors: { onSurface: '#111111', background: '#ffffff' } },
    }),
    useDisplay: () => ({ mobile: { value: false } }),
  };
});

// Mock auth store — report logged in + org so the drawer actually renders
vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => ({
    isLoggedIn: true,
    user: { currentOrganization: { _id: 'org1', name: 'Org' } },
    serverConfig: { organizations: { enabled: false } },
    signout: vi.fn(),
  }),
}));

// Mock core store — we inject our own nav + navBottom arrays per test
const coreStoreState = vi.hoisted(() => ({ nav: [], navBottom: [], refreshNav: () => {} }));
vi.mock('../stores/core.store', () => ({
  useCoreStore: () => coreStoreState,
}));

import CoreNavigation from '../components/core.navigation.component.vue';

/**
 * @desc Minimal config mock — only the keys the component reads.
 * @param {Object} [overrides] - partial overrides merged onto the default config
 * @returns {Object}
 */
const makeConfig = (overrides = {}) => ({
  app: { title: 'Test App', icon: 'fa-solid fa-cube', logoFile: null, ...(overrides.app || {}) },
  header: { socials: [] },
  vuetify: {
    theme: {
      flat: false,
      footer: true,
      navigation: {
        color: '#000000',
        background: '#ffffff',
        glass: false,
        inset: false,
        drawer: { floating: false, expand: false, rail: false },
      },
    },
  },
});

/**
 * @desc Mount the navigation component with the given nav + navBottom arrays.
 * @param {Object} opts
 * @param {Array}  opts.nav - items for the main nav list
 * @param {Array}  opts.navBottom - items for the bottom nav list
 * @param {Object} [opts.configOverrides] - partial config overrides (e.g. { app: { logoFile: '/logo.svg' } })
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountNav = ({ nav = [], navBottom = [], configOverrides = {} } = {}) => {
  coreStoreState.nav = nav;
  coreStoreState.navBottom = navBottom;
  const vuetify = createVuetify({ components, directives });
  return mount(CoreNavigation, {
    global: {
      plugins: [vuetify],
      mocks: {
        config: makeConfig(configOverrides),
        $vuetify: { display: { mobile: false } },
      },
      stubs: {
        'router-link': { template: '<a><slot /></a>' },
        // Stub v-navigation-drawer to a plain wrapper — the real one needs a <v-layout> ancestor
        'v-navigation-drawer': { template: '<div class="v-navigation-drawer"><slot /><slot name="append" /></div>' },
      },
    },
  });
};

describe('core.navigation.component — navItemBind', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    coreStoreState.nav = [];
    coreStoreState.navBottom = [];
  });

  it('returns { to } for a regular internal route', () => {
    const wrapper = mountNav();
    const bind = wrapper.vm.navItemBind({ path: '/tasks', meta: { icon: 'fa-solid fa-list', display: true } });
    expect(bind).toEqual({ to: '/tasks' });
    expect(bind.href).toBeUndefined();
  });

  it('returns { href, target, rel } for an external link with meta.href', () => {
    const wrapper = mountNav();
    const bind = wrapper.vm.navItemBind({
      path: '/api-docs',
      meta: { icon: 'fa-solid fa-book', display: true, href: 'https://api.trawl.me/api/docs' },
    });
    expect(bind).toEqual({
      href: 'https://api.trawl.me/api/docs',
      target: '_blank',
      rel: 'noopener',
    });
    expect(bind.to).toBeUndefined();
  });

  it('honors explicit meta.target when provided', () => {
    const wrapper = mountNav();
    const bind = wrapper.vm.navItemBind({
      path: '/docs',
      meta: { icon: 'i', display: true, href: 'https://example.com', target: '_self' },
    });
    expect(bind.target).toBe('_self');
  });

  it('honors explicit meta.rel when provided', () => {
    const wrapper = mountNav();
    const bind = wrapper.vm.navItemBind({
      path: '/docs',
      meta: { icon: 'i', display: true, href: 'https://example.com', rel: 'noopener noreferrer' },
    });
    expect(bind.rel).toBe('noopener noreferrer');
  });

  it('falls back to { to } when meta is missing entirely', () => {
    const wrapper = mountNav();
    const bind = wrapper.vm.navItemBind({ path: '/nometa' });
    expect(bind).toEqual({ to: '/nometa' });
  });
});

describe('core.navigation.component — template rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders a regular nav item as a router-link (no href attribute)', () => {
    const wrapper = mountNav({
      nav: [{ path: '/tasks', name: 'Tasks', meta: { display: true, icon: 'fa-solid fa-list' } }],
    });
    const html = wrapper.html();
    expect(html).toContain('Tasks');
    // Internal link: no href="http..." attribute
    expect(html).not.toMatch(/href="https?:\/\//);
  });

  it('renders an external nav item with href + target + rel', () => {
    const wrapper = mountNav({
      nav: [
        {
          path: '/api-docs',
          name: 'API Docs',
          meta: {
            display: true,
            icon: 'fa-solid fa-book',
            href: 'https://api.trawl.me/api/docs',
          },
        },
      ],
    });
    const html = wrapper.html();
    expect(html).toContain('API Docs');
    expect(html).toContain('href="https://api.trawl.me/api/docs"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener"');
  });

  it('renders an external nav item in the navBottom list too', () => {
    const wrapper = mountNav({
      navBottom: [
        {
          path: '/api-docs',
          name: 'API Docs',
          meta: {
            display: true,
            icon: 'fa-solid fa-book',
            href: 'https://api.trawl.me/api/docs',
            position: 'bottom',
          },
        },
      ],
    });
    const html = wrapper.html();
    expect(html).toContain('API Docs');
    expect(html).toContain('href="https://api.trawl.me/api/docs"');
    expect(html).toContain('target="_blank"');
  });

  it('renders regular navBottom items with router-link (no external href)', () => {
    const wrapper = mountNav({
      navBottom: [
        { path: '/settings', name: 'Settings', meta: { display: true, icon: 'fa-solid fa-gear', position: 'bottom' } },
      ],
    });
    const html = wrapper.html();
    expect(html).toContain('Settings');
    expect(html).not.toMatch(/href="https?:\/\//);
  });

  it('mixes internal and external items in the same list', () => {
    const wrapper = mountNav({
      nav: [
        { path: '/tasks', name: 'Tasks', meta: { display: true, icon: 'fa-solid fa-list' } },
        {
          path: '/api-docs',
          name: 'API Docs',
          meta: { display: true, icon: 'fa-solid fa-book', href: 'https://api.trawl.me/api/docs' },
        },
      ],
    });
    const html = wrapper.html();
    expect(html).toContain('Tasks');
    expect(html).toContain('API Docs');
    expect(html).toContain('href="https://api.trawl.me/api/docs"');
  });
});

describe('core.navigation.component — sidenav logo', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders a v-img when config.app.logoFile is set', () => {
    const wrapper = mountNav({ configOverrides: { app: { logoFile: '/images/logo.svg' } } });
    const img = wrapper.findComponent({ name: 'VImg' });
    expect(img.exists()).toBe(true);
    expect(img.props('src')).toBe('/images/logo.svg');
    // FA icon for the app logo must NOT be rendered when logoFile takes precedence
    const icons = wrapper.findAllComponents({ name: 'VIcon' });
    const hasAppIcon = icons.some((i) => i.props('icon') === 'fa-solid fa-cube');
    expect(hasAppIcon).toBe(false);
  });

  it('exposes the app.title as alt text on the logo image', () => {
    const wrapper = mountNav({ configOverrides: { app: { logoFile: '/images/logo.svg', title: 'Brand Alpha' } } });
    const img = wrapper.findComponent({ name: 'VImg' });
    expect(img.exists()).toBe(true);
    expect(img.props('alt')).toBe('Brand Alpha');
  });

  it('falls back to the FA icon when logoFile is unset (back-compat)', () => {
    const wrapper = mountNav();
    // No v-img rendered for the logo
    const img = wrapper.findComponent({ name: 'VImg' });
    expect(img.exists()).toBe(false);
  });

  it('wraps the logo v-list-item with to="/" in both branches', () => {
    // FA branch — first v-list-item is the logo item
    const wrapperIcon = mountNav();
    const logoItemIcon = wrapperIcon.findAllComponents({ name: 'VListItem' })[0];
    expect(logoItemIcon.props('to')).toBe('/');

    // logoFile branch
    const wrapperImg = mountNav({ configOverrides: { app: { logoFile: '/images/logo.svg' } } });
    const logoItemImg = wrapperImg.findAllComponents({ name: 'VListItem' })[0];
    expect(logoItemImg.props('to')).toBe('/');
  });
});
