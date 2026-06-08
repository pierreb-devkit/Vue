import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { useFooterExtras } from '@/lib/composables/useFooterExtras';

vi.mock('vuetify', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTheme: () => ({
      name: 'light',
      current: { colors: { onSurface: '#111111', background: '#ffffff', surface: '#fafafa' } },
    }),
  };
});

// Mock auth store — avoids pulling in axios/config/ability which aren't available
// in the unit-test environment. authStoreState is a mutable hoisted object so
// individual tests can override serverConfig without re-mocking.
const authStoreState = vi.hoisted(() => ({
  serverConfig: null,
}));
vi.mock('@/modules/auth/stores/auth.store', () => ({
  useAuthStore: () => authStoreState,
}));

import CoreFooter from '../core.footer.component.vue';

/**
 * Returns a fresh Vuetify instance for each test.
 * @returns {import('vuetify').Vuetify}
 */
const vuetify = () => createVuetify({ components, directives });

const baseConfig = () => ({
  footer: { links: [{ title: 'Help', items: [{ label: 'Docs', icon: 'fa-solid fa-book', url: '/docs' }] }] },
  vuetify: { theme: { flat: false } },
});

/**
 * Mounts CoreFooter with the given config, simulating an active footer route.
 * @param {object} config
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountFooter = (config) =>
  mount(CoreFooter, {
    global: {
      plugins: [vuetify()],
      mocks: {
        config,
        $route: { path: '/', meta: { footer: true } },
        $router: { push: vi.fn() },
      },
      stubs: {
        RouterLink: { template: '<a><slot /></a>', props: ['to'] },
        VFooter: { template: '<div class="v-footer-stub"><slot /></div>' },
      },
    },
    props: {
      links: config.footer?.links || [],
    },
  });

describe('core.footer.component — app version badge', () => {
  beforeEach(() => {
    const { extras } = useFooterExtras();
    extras.value = [];
    authStoreState.serverConfig = null;
  });

  it('renders the version badge when config.app.version is set', () => {
    const wrapper = mountFooter({ ...baseConfig(), app: { version: '1.36.0' } });
    expect(wrapper.text()).toContain('Web v1.36.0');
  });

  it('prefixes bare semver with v', () => {
    const wrapper = mountFooter({ ...baseConfig(), app: { version: '2.0.1' } });
    expect(wrapper.text()).toContain('v2.0.1');
  });

  it('renders dev version as-is when passed as dev-<sha>', () => {
    const wrapper = mountFooter({ ...baseConfig(), app: { version: 'dev-abc1234' } });
    expect(wrapper.text()).toContain('dev-abc1234');
  });

  it('renders plain "dev" string as-is', () => {
    const wrapper = mountFooter({ ...baseConfig(), app: { version: 'dev' } });
    expect(wrapper.text()).toContain('dev');
  });

  it('does not render a version badge when config.app.version is absent', () => {
    const wrapper = mountFooter(baseConfig());
    // No version in baseConfig — appVersion computed returns null → badge text absent
    expect(wrapper.vm.appVersion).toBeNull();
    expect(wrapper.text()).not.toMatch(/^v\d/);
  });

  it('appVersionHref is null when config.app.repository is absent', () => {
    const wrapper = mountFooter({ ...baseConfig(), app: { version: '1.0.0' } });
    expect(wrapper.vm.appVersionHref).toBeNull();
  });

  it('appVersionHref points to GitHub tag for semver release when repository is set', () => {
    const wrapper = mountFooter({
      ...baseConfig(),
      app: { version: '1.36.0', repository: 'https://github.com/org/repo' },
    });
    expect(wrapper.vm.appVersionHref).toBe('https://github.com/org/repo/releases/tag/v1.36.0');
  });

  it('appVersionHref normalises v-prefixed version (v1.2.3) to same tag href as unprefixed', () => {
    const wrapper = mountFooter({
      ...baseConfig(),
      app: { version: 'v1.36.0', repository: 'https://github.com/org/repo' },
    });
    expect(wrapper.vm.appVersionHref).toBe('https://github.com/org/repo/releases/tag/v1.36.0');
  });

  it('appVersionHref points to GitHub commit for dev-<sha> version when repository is set', () => {
    const wrapper = mountFooter({
      ...baseConfig(),
      app: { version: 'dev-abc1234f', repository: 'https://github.com/org/repo' },
    });
    expect(wrapper.vm.appVersionHref).toBe('https://github.com/org/repo/commit/abc1234f');
  });

  it('appVersionHref is null when repository does not start with https://', () => {
    const wrapper = mountFooter({
      ...baseConfig(),
      app: { version: '1.0.0', repository: 'http://github.com/org/repo' },
    });
    expect(wrapper.vm.appVersionHref).toBeNull();
  });
});

describe('core.footer.component — registry extras', () => {
  beforeEach(() => {
    // Clear any extras registered by previous tests
    const { extras } = useFooterExtras();
    extras.value = [];
    authStoreState.serverConfig = null;
  });

  afterEach(() => {
    const { extras } = useFooterExtras();
    extras.value = [];
  });

  it('renders only prop links when extras registry is empty', () => {
    const wrapper = mountFooter(baseConfig());
    expect(wrapper.text()).toContain('Help');
    expect(wrapper.text()).toContain('Docs');
  });

  it('renders an extra section injected via useFooterExtras().register()', () => {
    const { register } = useFooterExtras();
    register('test-module', {
      title: 'Test Section',
      items: [{ label: 'Item One', icon: 'fa-solid fa-star', url: '/one' }],
    });
    const wrapper = mountFooter(baseConfig());
    expect(wrapper.text()).toContain('Test Section');
    expect(wrapper.text()).toContain('Item One');
  });

  it('renders multiple extra sections in registration order', () => {
    const { register } = useFooterExtras();
    register('section-a', { title: 'Alpha', items: [{ label: 'A', icon: 'fa-solid fa-a', url: '/a' }] });
    register('section-b', { title: 'Beta', items: [{ label: 'B', icon: 'fa-solid fa-b', url: '/b' }] });
    const wrapper = mountFooter(baseConfig());
    expect(wrapper.text()).toContain('Alpha');
    expect(wrapper.text()).toContain('Beta');
  });

  it('does not render an extra section after unregister()', () => {
    const { register, unregister } = useFooterExtras();
    register('removable', { title: 'Removable', items: [{ label: 'Gone', icon: 'fa-solid fa-trash', url: '/gone' }] });
    unregister('removable');
    const wrapper = mountFooter(baseConfig());
    expect(wrapper.text()).not.toContain('Removable');
  });

  it('merges registered extras into existing config-driven section by title (no duplicate column)', () => {
    const { register } = useFooterExtras();
    register('legal-module', {
      title: 'Legal',
      items: [{ label: 'Cookie settings', icon: 'fa-solid fa-cookie', onClick: vi.fn() }],
    });
    const wrapper = mountFooter({
      footer: {
        links: [
          {
            title: 'Legal',
            items: [
              { label: 'Terms of Service', icon: 'fa-solid fa-file-contract', url: '/terms' },
              { label: 'Privacy Policy', icon: 'fa-solid fa-shield-halved', url: '/privacy' },
            ],
          },
        ],
      },
      vuetify: { theme: { flat: false } },
      legal: {
        cookieConsent: { enabled: true, privacyPolicyPath: '/privacy' },
        pages: { enabled: false, routePrefix: '/legal', items: {} },
      },
    });
    const text = wrapper.text();
    expect(text).toContain('Terms of Service');
    expect(text).toContain('Privacy Policy');
    expect(text).toContain('Cookie settings');
    // Single "Legal" column heading, not two
    const legalHeadings = wrapper.findAll('.v-card-title').filter((c) => c.text().trim() === 'Legal');
    expect(legalHeadings.length).toBe(1);
  });

  it('calls item.onClick when item has an onClick callback', async () => {
    const { register } = useFooterExtras();
    const onClick = vi.fn();
    register('clickable', {
      title: 'Clickable',
      items: [{ label: 'Action', icon: 'fa-solid fa-play', onClick }],
    });
    const wrapper = mountFooter(baseConfig());
    const listItems = wrapper.findAllComponents({ name: 'VListItem' });
    const actionItem = listItems.find((li) => li.text().includes('Action'));
    expect(actionItem).toBeTruthy();
    await actionItem.trigger('click');
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('core.footer.component — layout + backend version (Parts A + C)', () => {
  beforeEach(() => {
    const { extras } = useFooterExtras();
    extras.value = [];
    authStoreState.serverConfig = null;
  });

  afterEach(() => {
    const { extras } = useFooterExtras();
    extras.value = [];
    authStoreState.serverConfig = null;
  });

  it('Part A — renders exactly ONE v-container when both links and appVersion are present', () => {
    // Pre-fix the template had two sibling <v-container> elements (one for links, one for version),
    // causing the version badge to appear beside the columns rather than below them.
    // After the fix both live inside a single container.
    // VFooter is stubbed as a plain div, so VContainer renders as a real Vuetify component;
    // we assert via DOM class (.v-container) rather than findAllComponents to avoid stub
    // name-resolution quirks — Vuetify renders VContainer with that class reliably.
    const wrapper = mountFooter({ ...baseConfig(), app: { version: '2.2.0' } });
    const containers = wrapper.findAll('.v-container');
    expect(containers.length).toBe(1);
  });

  it('Part C — renders Web + API versions when auth store has serverConfig', async () => {
    // authStoreState is the hoisted mock object — mutate before mount so setup()
    // picks it up. @pinia/testing is not in devDeps; mock is sufficient.
    authStoreState.serverConfig = { app: { version: '0.4.0' } };
    const wrapper = mountFooter({ ...baseConfig(), app: { version: '2.2.0' } });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Web v2.2.0');
    expect(wrapper.text()).toContain('API v0.4.0');
  });

  it('Part C — omits API segment when serverConfig is null (pre-login / no backend response)', () => {
    // authStoreState.serverConfig is null (reset in beforeEach) → backendVersion returns null
    const wrapper = mountFooter({ ...baseConfig(), app: { version: '1.36.0' } });
    expect(wrapper.text()).toContain('Web v1.36.0');
    expect(wrapper.text()).not.toContain('API');
  });
});
