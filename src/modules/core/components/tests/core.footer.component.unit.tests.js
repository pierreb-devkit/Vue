import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createI18n } from 'vue-i18n';

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

import CoreFooter from '../core.footer.component.vue';

const vuetify = () => createVuetify({ components, directives });
const i18n = () =>
  createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: {
        legal: {
          footer: { sectionTitle: 'Legal', cookieSettings: 'Cookie settings' },
        },
      },
    },
  });

const baseConfig = (overrides = {}) => ({
  footer: { links: [{ title: 'Help', items: [{ label: 'Docs', icon: 'fa-solid fa-book', url: '/docs' }] }] },
  vuetify: { theme: { flat: false } },
  legal: {
    cookieConsent: { enabled: false, privacyPolicyPath: '/legal/privacy' },
    pages: { enabled: false, routePrefix: '/legal', items: {} },
    ...overrides,
  },
});

const mountFooter = (config) =>
  mount(CoreFooter, {
    global: {
      plugins: [vuetify(), i18n()],
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

describe('core.footer.component — Legal section', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not render Legal section when both legal flags are off', () => {
    const wrapper = mountFooter(baseConfig());
    expect(wrapper.text()).not.toContain('Legal');
  });

  it('renders Legal section with Cookie settings only when cookieConsent.enabled and pages.enabled=false', () => {
    const wrapper = mountFooter(
      baseConfig({
        cookieConsent: { enabled: true, privacyPolicyPath: '/legal/privacy' },
        pages: { enabled: false, routePrefix: '/legal', items: {} },
      }),
    );
    expect(wrapper.text()).toContain('Legal');
    expect(wrapper.text()).toContain('Cookie settings');
  });

  it('renders Legal section with enabled pages and no Cookie settings when cookieConsent.enabled=false', () => {
    const wrapper = mountFooter(
      baseConfig({
        cookieConsent: { enabled: false, privacyPolicyPath: '/legal/privacy' },
        pages: {
          enabled: true,
          routePrefix: '/legal',
          items: {
            terms:   { enabled: true,  slug: 'terms',   title: 'Terms',   markdownPath: '/p/terms.md' },
            privacy: { enabled: true,  slug: 'privacy', title: 'Privacy', markdownPath: '/p/privacy.md' },
            off:     { enabled: false, slug: 'off',     title: 'Off',     markdownPath: '/p/off.md' },
          },
        },
      }),
    );
    expect(wrapper.text()).toContain('Legal');
    expect(wrapper.text()).toContain('Terms');
    expect(wrapper.text()).toContain('Privacy');
    expect(wrapper.text()).not.toContain('Off');
    expect(wrapper.text()).not.toContain('Cookie settings');
  });

  it('renders both Cookie settings and pages when both flags are on', () => {
    const wrapper = mountFooter(
      baseConfig({
        cookieConsent: { enabled: true, privacyPolicyPath: '/legal/privacy' },
        pages: {
          enabled: true,
          routePrefix: '/legal',
          items: {
            terms: { enabled: true, slug: 'terms', title: 'Terms', markdownPath: '/p/terms.md' },
          },
        },
      }),
    );
    expect(wrapper.text()).toContain('Cookie settings');
    expect(wrapper.text()).toContain('Terms');
  });
});
