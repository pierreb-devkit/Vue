import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import testConfig from '../../../config/defaults/test.config.js';
import { useCoreStore } from '../../core/stores/core.store';

// Mock @unhead/vue to capture useHead calls
const useHeadMock = vi.hoisted(() => vi.fn());
vi.mock('@unhead/vue', () => ({ useHead: useHeadMock }));

// Mock vuetify composables. `global.name` mirrors real Vuetify's useTheme()
// shape (a mutable ref-like holder) so the app.vue theme watch can assign
// `.value` on it — see the "theme wiring" describe block below (#4462).
vi.mock('vuetify', () => ({
  useTheme: () => ({
    name: 'light',
    current: { colors: { background: '#ffffff' } },
    global: { name: { value: 'light' } },
  }),
}));

// Mock auth store
vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => ({ isLoggedIn: false }),
}));

// Mock axios interceptors
vi.mock('../../../lib/services/axios', () => ({
  setupInterceptors: vi.fn(),
}));

// Mock child components
vi.mock('../../core/components/core.header.component.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../../core/components/core.navigation.component.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../../core/components/core.footer.component.vue', () => ({ default: { template: '<div />' } }));

import App from '../app.vue';

const makeConfig = (overrides = {}) => ({
  ...testConfig,
  app: {
    ...testConfig.app,
    ...overrides,
    seo: {
      ...testConfig.app.seo,
      ...(overrides.seo || {}),
      og: { ...testConfig.app.seo.og, ...(overrides.seo?.og || {}) },
      schema: { ...testConfig.app.seo.schema, ...(overrides.seo?.schema || {}) },
    },
  },
});

describe('App.vue — mainStyle', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useHeadMock.mockClear();
  });

  /**
   * @desc Mount App component with a mocked route and optional config overrides.
   * @param {String} path - Route path to mock (e.g. '/', '/tasks')
   * @param {Object} configOverrides - Navigation config overrides (merged into navigation)
   * @returns {import('@vue/test-utils').VueWrapper} Mounted wrapper
   */
  const mountWithRoute = (path, configOverrides = {}) => {
    const config = {
      ...makeConfig(),
      vuetify: {
        theme: {
          snackbar: { status: false },
          navigation: { glass: true, ...configOverrides },
        },
      },
      header: { display: false },
      footer: { links: [], variant: 'default' },
    };
    return mount(App, {
      global: {
        mocks: { config, $route: { path } },
        stubs: { RouterView: true, 'v-app': true, 'v-snackbar': true, 'v-main': true },
      },
    });
  };

  it('does not remove padding-left when user is not logged in', () => {
    const wrapper = mountWithRoute('/');
    const style = wrapper.vm.mainStyle;
    // Auth mock returns isLoggedIn: false, so no padding override even on home
    expect(style['padding-left']).toBeUndefined();
    expect(style.background).toBe('#ffffff');
  });

  it('keeps default padding on non-home routes', () => {
    const wrapper = mountWithRoute('/tasks');
    const style = wrapper.vm.mainStyle;
    expect(style['padding-left']).toBeUndefined();
  });

  it('keeps default padding when glass is false', () => {
    const wrapper = mountWithRoute('/', { glass: false });
    const style = wrapper.vm.mainStyle;
    expect(style['padding-left']).toBeUndefined();
  });
});

describe('App.vue — SEO (useHead)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useHeadMock.mockClear();
  });

  /**
   * @desc Mount App with a mocked config + route. The component now passes a
   * getter to useHead (so canonical/og:url recompute per route), so tests must
   * invoke the captured getter to read the resolved head object.
   * @param {Object} config - app config (from makeConfig)
   * @param {String} path - mocked $route.path (default '/')
   * @returns {import('@vue/test-utils').VueWrapper} Mounted wrapper
   */
  const mountApp = (config, path = '/') =>
    mount(App, {
      global: {
        mocks: { config, $route: { path } },
        stubs: { RouterView: true, 'v-app': true, 'v-snackbar': true, 'v-main': true },
      },
    });

  /**
   * @desc Resolve the head object from the last useHead call. The component
   * passes a getter, so this invokes it (binding does not matter — the getter
   * closes over `this` via an arrow function inside created()).
   * @returns {Object} resolved head object ({ title, htmlAttrs, meta, link })
   */
  const resolveHead = () => {
    const arg = useHeadMock.mock.calls[0][0];
    return typeof arg === 'function' ? arg() : arg;
  };

  it('passes a getter to useHead (per-route reactivity)', () => {
    mountApp(makeConfig());
    expect(typeof useHeadMock.mock.calls[0][0]).toBe('function');
  });

  it('sets title from config', () => {
    mountApp(makeConfig());
    expect(resolveHead().title).toBe('Test App');
  });

  it('sets lang from config.app.lang', () => {
    mountApp(makeConfig());
    expect(resolveHead().htmlAttrs.lang).toBe('fr');
  });

  it('defaults lang to "en" when not set', () => {
    const config = makeConfig({ lang: undefined });
    mountApp(config);
    expect(resolveHead().htmlAttrs.lang).toBe('en');
  });

  it('includes description meta', () => {
    mountApp(makeConfig());
    const { meta } = resolveHead();
    expect(meta).toContainEqual({ name: 'description', content: 'Test description' });
  });

  it('includes Open Graph tags', () => {
    mountApp(makeConfig());
    const { meta } = resolveHead();
    expect(meta).toContainEqual({ property: 'og:title', content: 'Test App' });
    expect(meta).toContainEqual({ property: 'og:description', content: 'Test description' });
    expect(meta).toContainEqual({ property: 'og:type', content: 'website' });
    expect(meta).toContainEqual({ property: 'og:image', content: 'https://example.com/og.jpg' });
  });

  it('omits og:url and og:image when not configured', () => {
    const config = makeConfig({ url: '', seo: { og: { image: '' } } });
    mountApp(config);
    const { meta } = resolveHead();
    expect(meta.find((m) => m.property === 'og:url')).toBeUndefined();
    expect(meta.find((m) => m.property === 'og:image')).toBeUndefined();
  });

  it('includes Twitter Card tags', () => {
    mountApp(makeConfig());
    const { meta } = resolveHead();
    expect(meta).toContainEqual({ name: 'twitter:card', content: 'summary_large_image' });
    expect(meta).toContainEqual({ name: 'twitter:title', content: 'Test App' });
    expect(meta).toContainEqual({ name: 'twitter:site', content: '@testhandle' });
  });

  it('omits twitter:site when not configured', () => {
    const config = makeConfig({ seo: { og: { twitterSite: '' } } });
    mountApp(config);
    const { meta } = resolveHead();
    expect(meta.find((m) => m.name === 'twitter:site')).toBeUndefined();
  });

  describe('per-route canonical + og:url (self-referential)', () => {
    it('sets a self-referential canonical for a nested route', () => {
      mountApp(makeConfig(), '/docs/x');
      const { link } = resolveHead();
      expect(link).toContainEqual({ rel: 'canonical', href: 'https://example.com/docs/x' });
    });

    it('emits og:url matching the per-route canonical', () => {
      mountApp(makeConfig(), '/docs/x');
      const { meta } = resolveHead();
      expect(meta).toContainEqual({ property: 'og:url', content: 'https://example.com/docs/x' });
    });

    it('canonicalises the root route to the bare base url', () => {
      mountApp(makeConfig(), '/');
      const { link, meta } = resolveHead();
      expect(link).toContainEqual({ rel: 'canonical', href: 'https://example.com' });
      expect(meta).toContainEqual({ property: 'og:url', content: 'https://example.com' });
    });

    it('produces a different canonical per route (proves it is not the static homepage)', () => {
      mountApp(makeConfig(), '/pricing');
      const pricing = resolveHead().link.find((l) => l.rel === 'canonical')?.href;
      useHeadMock.mockClear();
      mountApp(makeConfig(), '/docs/x');
      const docs = resolveHead().link.find((l) => l.rel === 'canonical')?.href;
      expect(pricing).toBe('https://example.com/pricing');
      expect(docs).toBe('https://example.com/docs/x');
      expect(pricing).not.toBe(docs);
    });

    it('sets no canonical link when url is empty', () => {
      const config = makeConfig({ url: '' });
      mountApp(config, '/docs/x');
      const { link } = resolveHead();
      expect(link).toHaveLength(0);
    });
  });

  describe('Schema.org JSON-LD', () => {
    it('does not inject runtime JSON-LD (handled by seo-inject at build time)', () => {
      const config = makeConfig({ seo: { schema: { enabled: true, type: 'Person', name: 'Test App', sameAs: ['https://github.com/test-user'] } } });
      mountApp(config);
      expect(resolveHead().script).toBeUndefined();
    });
  });
});

describe('App.vue — theme wiring (#4462)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useHeadMock.mockClear();
  });

  /**
   * @desc Mount App with a minimal config. Uses the real (un-mocked)
   * `useCoreStore` so `coreStore.theme` is genuinely reactive — assigning
   * `coreStore.theme` directly exercises the same reactivity path
   * `syncOsTheme()` / `init()` use at runtime, without pulling in the config
   * plumbing those actions depend on (already covered by
   * `core.store.unit.tests.js`). This suite only proves the wiring: does
   * app.vue's watch push `coreStore.theme` into Vuetify's global theme.
   * @returns {import('@vue/test-utils').VueWrapper} Mounted wrapper
   */
  const mountApp = () => {
    const config = {
      ...makeConfig(),
      vuetify: { theme: { snackbar: { status: false }, navigation: {} } },
      header: { display: false },
      footer: { links: [], variant: 'default' },
    };
    return mount(App, {
      global: {
        mocks: { config, $route: { path: '/' } },
        stubs: { RouterView: true, 'v-app': true, 'v-snackbar': true, 'v-main': true },
      },
    });
  };

  it('applies coreStore.theme to the Vuetify global theme on mount (immediate)', () => {
    const coreStore = useCoreStore();
    coreStore.theme = 'dark';

    const wrapper = mountApp();

    expect(wrapper.vm.theme.global.name.value).toBe('dark');
  });

  it('defaults to the light Vuetify theme on mount when coreStore.theme is light', () => {
    const coreStore = useCoreStore();
    coreStore.theme = 'light';

    const wrapper = mountApp();

    expect(wrapper.vm.theme.global.name.value).toBe('light');
  });

  it('flips the Vuetify theme when coreStore.theme changes after mount', async () => {
    const coreStore = useCoreStore();
    coreStore.theme = 'light';

    const wrapper = mountApp();
    expect(wrapper.vm.theme.global.name.value).toBe('light');

    coreStore.theme = 'dark';
    await nextTick();

    expect(wrapper.vm.theme.global.name.value).toBe('dark');
  });
});
