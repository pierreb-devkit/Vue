import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { useFooterExtras } from '@/lib/composables/useFooterExtras';

const reopenSettingsMock = vi.fn();

vi.mock('../composables/useCookieConsent', () => ({
  useCookieConsent: () => ({
    consentNeeded: { value: true },
    consent: { value: null },
    accept: vi.fn(),
    reject: vi.fn(),
    reopenSettings: reopenSettingsMock,
  }),
}));

import LegalFooterSection from '../components/legal.footerSection.component.vue';

/**
 * Mounts LegalFooterSection with the given config mock.
 * @param {object} config - Config to inject as globalProperty
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountSection = (config = {}) =>
  mount(LegalFooterSection, {
    global: {
      config: { globalProperties: { config } },
    },
  });

describe('legal.footerSection.component — registry behavior', () => {
  beforeEach(() => {
    const { extras } = useFooterExtras();
    extras.value = [];
    reopenSettingsMock.mockReset();
  });

  afterEach(() => {
    const { extras } = useFooterExtras();
    extras.value = [];
  });

  it('registers a "legal" section when cookieConsent is enabled', async () => {
    const config = {
      legal: {
        cookieConsent: { enabled: true, privacyPolicyPath: '/legal/privacy' },
        pages: { enabled: false, routePrefix: '/legal', items: {} },
      },
    };
    mountSection(config);
    await flushPromises();
    const { extras } = useFooterExtras();
    const legal = extras.value.find((s) => s._id === 'legal');
    expect(legal).toBeTruthy();
    expect(legal.title).toBe('Legal');
    const cookie = legal.items.find((i) => i.label === 'Cookie settings');
    expect(cookie).toBeTruthy();
    expect(typeof cookie.onClick).toBe('function');
  });

  it('registers page items when pages.enabled is true', async () => {
    const config = {
      legal: {
        cookieConsent: { enabled: false },
        pages: {
          enabled: true,
          routePrefix: '/legal',
          items: {
            terms:   { enabled: true,  slug: 'terms',   title: 'Terms',   markdownPath: '/p/terms.md' },
            privacy: { enabled: true,  slug: 'privacy', title: 'Privacy', markdownPath: '/p/privacy.md' },
            off:     { enabled: false, slug: 'off',     title: 'Off',     markdownPath: '/p/off.md' },
          },
        },
      },
    };
    mountSection(config);
    await flushPromises();
    const { extras } = useFooterExtras();
    const legal = extras.value.find((s) => s._id === 'legal');
    expect(legal).toBeTruthy();
    const labels = legal.items.map((i) => i.label);
    expect(labels).toContain('Terms');
    expect(labels).toContain('Privacy');
    expect(labels).not.toContain('Off');
  });

  it('does not register when both legal flags are off', async () => {
    const config = {
      legal: {
        cookieConsent: { enabled: false },
        pages: { enabled: false, items: {} },
      },
    };
    mountSection(config);
    await flushPromises();
    const { extras } = useFooterExtras();
    expect(extras.value.find((s) => s._id === 'legal')).toBeUndefined();
  });

  it('unregisters legal section on unmount', async () => {
    const config = {
      legal: {
        cookieConsent: { enabled: true },
        pages: { enabled: false, items: {} },
      },
    };
    const wrapper = mountSection(config);
    await flushPromises();
    const { extras } = useFooterExtras();
    expect(extras.value.find((s) => s._id === 'legal')).toBeTruthy();
    wrapper.unmount();
    expect(extras.value.find((s) => s._id === 'legal')).toBeUndefined();
  });

  it('cookie settings item.onClick calls reopenSettings', async () => {
    const config = {
      legal: {
        cookieConsent: { enabled: true },
        pages: { enabled: false, items: {} },
      },
    };
    mountSection(config);
    await flushPromises();
    const { extras } = useFooterExtras();
    const legal = extras.value.find((s) => s._id === 'legal');
    const cookie = legal?.items.find((i) => i.label === 'Cookie settings');
    expect(cookie).toBeTruthy();
    cookie.onClick();
    expect(reopenSettingsMock).toHaveBeenCalledOnce();
  });
});
