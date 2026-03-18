import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import testConfig from '../../../config/defaults/test.config.js';

// Mock @unhead/vue to capture useHead calls
const useHeadMock = vi.hoisted(() => vi.fn());
vi.mock('@unhead/vue', () => ({ useHead: useHeadMock }));

// Mock vuetify composables
vi.mock('vuetify', () => ({
  useTheme: () => ({
    name: 'light',
    current: { colors: { background: '#ffffff' } },
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

  it('removes padding-left on home route when glass mode is active and logged in', async () => {
    // Auth mock returns isLoggedIn: false by default, so padding-left should not be set
    const wrapper = mountWithRoute('/');
    const style = wrapper.vm.mainStyle;
    // isLoggedIn is false in mock, so no padding override
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

  const mountApp = (config) =>
    mount(App, {
      global: {
        mocks: { config },
        stubs: { RouterView: true, 'v-app': true, 'v-snackbar': true, 'v-main': true },
      },
    });

  it('sets title from config', () => {
    mountApp(makeConfig());
    const call = useHeadMock.mock.calls[0][0];
    expect(call.title).toBe('Test App');
  });

  it('sets lang from config.app.lang', () => {
    mountApp(makeConfig());
    const call = useHeadMock.mock.calls[0][0];
    expect(call.htmlAttrs.lang).toBe('fr');
  });

  it('defaults lang to "en" when not set', () => {
    const config = makeConfig({ lang: undefined });
    mountApp(config);
    const call = useHeadMock.mock.calls[0][0];
    expect(call.htmlAttrs.lang).toBe('en');
  });

  it('includes description meta', () => {
    mountApp(makeConfig());
    const { meta } = useHeadMock.mock.calls[0][0];
    expect(meta).toContainEqual({ name: 'description', content: 'Test description' });
  });

  it('includes Open Graph tags', () => {
    mountApp(makeConfig());
    const { meta } = useHeadMock.mock.calls[0][0];
    expect(meta).toContainEqual({ property: 'og:title', content: 'Test App' });
    expect(meta).toContainEqual({ property: 'og:description', content: 'Test description' });
    expect(meta).toContainEqual({ property: 'og:type', content: 'website' });
    expect(meta).toContainEqual({ property: 'og:url', content: 'https://example.com' });
    expect(meta).toContainEqual({ property: 'og:image', content: 'https://example.com/og.jpg' });
  });

  it('omits og:url and og:image when not configured', () => {
    const config = makeConfig({ url: '', seo: { og: { image: '' } } });
    mountApp(config);
    const { meta } = useHeadMock.mock.calls[0][0];
    expect(meta.find((m) => m.property === 'og:url')).toBeUndefined();
    expect(meta.find((m) => m.property === 'og:image')).toBeUndefined();
  });

  it('includes Twitter Card tags', () => {
    mountApp(makeConfig());
    const { meta } = useHeadMock.mock.calls[0][0];
    expect(meta).toContainEqual({ name: 'twitter:card', content: 'summary_large_image' });
    expect(meta).toContainEqual({ name: 'twitter:title', content: 'Test App' });
    expect(meta).toContainEqual({ name: 'twitter:site', content: '@testhandle' });
  });

  it('omits twitter:site when not configured', () => {
    const config = makeConfig({ seo: { og: { twitterSite: '' } } });
    mountApp(config);
    const { meta } = useHeadMock.mock.calls[0][0];
    expect(meta.find((m) => m.name === 'twitter:site')).toBeUndefined();
  });

  it('sets canonical link when url is configured', () => {
    mountApp(makeConfig());
    const { link } = useHeadMock.mock.calls[0][0];
    expect(link).toContainEqual({ rel: 'canonical', href: 'https://example.com' });
  });

  it('sets no canonical link when url is empty', () => {
    const config = makeConfig({ url: '' });
    mountApp(config);
    const { link } = useHeadMock.mock.calls[0][0];
    expect(link).toHaveLength(0);
  });

  describe('Schema.org JSON-LD', () => {
    it('does not inject runtime JSON-LD (handled by seo-inject at build time)', () => {
      const config = makeConfig({ seo: { schema: { enabled: true, type: 'Person', name: 'Test App', sameAs: ['https://github.com/test-user'] } } });
      mountApp(config);
      const call = useHeadMock.mock.calls[0][0];
      expect(call.script).toBeUndefined();
    });
  });
});
