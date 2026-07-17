import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { setActivePinia, createPinia } from 'pinia';
import { useNavExtras } from '../../../lib/composables/useNavExtras';

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

// Mock auth store — report logged in + org so the drawer actually renders.
// authStoreState is a mutable hoisted object so individual tests can override
// serverConfig without re-mocking.
const authStoreState = vi.hoisted(() => ({
  isLoggedIn: true,
  user: { currentOrganization: { _id: 'org1', name: 'Org' } },
  serverConfig: { organizations: { enabled: false } },
  signout: vi.fn(),
}));
vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => authStoreState,
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
 * @param {Object} [opts.stubsOverride] - additional stubs merged after defaults
 * @param {Object} [opts.configOverrides] - partial config overrides (e.g. { app: { logoFile: '/logo.svg' } })
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountNav = ({ nav = [], navBottom = [], stubsOverride = {}, configOverrides = {} } = {}) => {
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
        ...stubsOverride,
      },
    },
  });
};

describe('core.navigation.component — navItemBind', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    coreStoreState.nav = [];
    coreStoreState.navBottom = [];
    authStoreState.serverConfig = { organizations: { enabled: false } };
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
      meta: { icon: 'fa-solid fa-book', display: true, href: 'https://api.example.com/api/docs' },
    });
    expect(bind).toEqual({
      href: 'https://api.example.com/api/docs',
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
    authStoreState.serverConfig = { organizations: { enabled: false } };
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
            href: 'https://api.example.com/api/docs',
          },
        },
      ],
    });
    const html = wrapper.html();
    expect(html).toContain('API Docs');
    expect(html).toContain('href="https://api.example.com/api/docs"');
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
            href: 'https://api.example.com/api/docs',
            position: 'bottom',
          },
        },
      ],
    });
    const html = wrapper.html();
    expect(html).toContain('API Docs');
    expect(html).toContain('href="https://api.example.com/api/docs"');
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
          meta: { display: true, icon: 'fa-solid fa-book', href: 'https://api.example.com/api/docs' },
        },
      ],
    });
    const html = wrapper.html();
    expect(html).toContain('Tasks');
    expect(html).toContain('API Docs');
    expect(html).toContain('href="https://api.example.com/api/docs"');
  });
});

describe('core.navigation.component — nav-extras registry seam (useNavExtras)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    coreStoreState.nav = [];
    coreStoreState.navBottom = [];
    authStoreState.serverConfig = { organizations: { enabled: false } };
    // Isolate the module-scope singleton registry between tests.
    const { extras } = useNavExtras();
    extras.value = [];
  });

  it('does not import billing directly — core has no compile-time dependency on the optional module', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../components/core.navigation.component.vue'), 'utf8');
    expect(sfc).not.toMatch(/modules\/billing/);
  });

  it('renders nothing in the extras slot when the registry is empty', () => {
    const wrapper = mountNav();
    expect(wrapper.find('.stub-nav-extra').exists()).toBe(false);
  });

  it('renders a component registered via useNavExtras().register()', () => {
    const { register } = useNavExtras();
    register('test-extra', { name: 'TestExtra', template: '<div class="stub-nav-extra">extra</div>' });
    const wrapper = mountNav();
    expect(wrapper.find('.stub-nav-extra').exists()).toBe(true);
  });

  it('stops rendering a component after useNavExtras().unregister()', () => {
    const { register, unregister } = useNavExtras();
    register('test-extra', { name: 'TestExtra', template: '<div class="stub-nav-extra">extra</div>' });
    unregister('test-extra');
    const wrapper = mountNav();
    expect(wrapper.find('.stub-nav-extra').exists()).toBe(false);
  });

  it('navBottom items appear before sign-out in the append slot', () => {
    // The append slot order (top to bottom):
    //   [gauge v-list — gated by meterMode]
    //   [navBottom v-list]
    //   [socials — gated by !config.footer]
    //   [divider]
    //   [sign-out]
    // Verify navBottom items precede sign-out in DOM
    const wrapper = mountNav({
      navBottom: [
        { path: '/account', name: 'Account', meta: { display: true, icon: 'fa-solid fa-user', position: 'bottom' } },
      ],
    });
    const html = wrapper.html();
    const accountPos = html.indexOf('Account');
    const signOutPos = html.indexOf('Sign out');
    expect(accountPos).toBeGreaterThan(-1);
    expect(signOutPos).toBeGreaterThan(accountPos);
  });

  it('sign-out button always appears last in the append slot (after navBottom)', () => {
    // Even with multiple navBottom items, sign-out is always last
    const wrapper = mountNav({
      navBottom: [
        { path: '/settings', name: 'Settings', meta: { display: true, icon: 'fa-solid fa-gear', position: 'bottom' } },
        { path: '/account', name: 'Account', meta: { display: true, icon: 'fa-solid fa-user', position: 'bottom' } },
      ],
    });
    const html = wrapper.html();
    const settingsPos = html.indexOf('Settings');
    const accountPos = html.indexOf('Account');
    const signOutPos = html.indexOf('Sign out');
    expect(settingsPos).toBeGreaterThan(-1);
    expect(accountPos).toBeGreaterThan(-1);
    expect(signOutPos).toBeGreaterThan(accountPos);
    expect(signOutPos).toBeGreaterThan(settingsPos);
  });

  it('renders multiple registered extras above navBottom, in registration order', () => {
    const { register } = useNavExtras();
    register('extra-a', { name: 'ExtraA', template: '<div class="stub-nav-extra-a">A</div>' });
    register('extra-b', { name: 'ExtraB', template: '<div class="stub-nav-extra-b">B</div>' });
    const wrapper = mountNav({
      navBottom: [{ path: '/account', name: 'Account', meta: { display: true, icon: 'fa-solid fa-user', position: 'bottom' } }],
    });
    const html = wrapper.html();
    const aPos = html.indexOf('stub-nav-extra-a');
    const bPos = html.indexOf('stub-nav-extra-b');
    const accountPos = html.indexOf('Account');
    expect(aPos).toBeGreaterThan(-1);
    expect(bPos).toBeGreaterThan(aPos);
    expect(accountPos).toBeGreaterThan(bPos);
  });
});

describe('core.navigation.component — sidenav logo', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    authStoreState.serverConfig = { organizations: { enabled: false } };
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
