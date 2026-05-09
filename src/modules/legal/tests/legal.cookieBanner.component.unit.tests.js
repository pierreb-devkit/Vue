import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';

// v-snackbar uses visualViewport which is not available in happy-dom
if (typeof globalThis.visualViewport === 'undefined') {
  globalThis.visualViewport = { addEventListener: vi.fn(), removeEventListener: vi.fn(), width: 1024, height: 768 };
}

const acceptMock = vi.fn();
const rejectMock = vi.fn();
const consentNeeded = ref(true);
const consent = ref(null);

vi.mock('../composables/useCookieConsent', () => ({
  useCookieConsent: () => ({
    consentNeeded,
    consent,
    accept: acceptMock,
    reject: rejectMock,
    reopenSettings: vi.fn(),
  }),
}));

import LegalCookieBanner from '../components/legal.cookieBanner.component.vue';

/**
 * Returns a fresh Vuetify instance for each test.
 * @returns {import('vuetify').Vuetify}
 */
const vuetify = () => createVuetify({ components, directives });

/**
 * Returns a fresh vue-i18n instance with the legal banner message keys.
 * @returns {import('vue-i18n').I18n}
 */
const i18n = () =>
  createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: {
        legal: {
          banner: {
            message: 'A few cookies help us improve your experience. See our',
            privacyPolicy: 'Privacy Policy',
            accept: 'Sounds good',
            reject: 'No thanks',
            revokeMessage: 'Want to revisit your cookie choices for {appName}?',
          },
        },
      },
    },
  });

let wrapper;

/**
 * Mounts LegalCookieBanner attached to document.body and tracks the
 * wrapper so afterEach can unmount it and clear the DOM.
 * @param {{ enabled?: boolean, appName?: string, privacyPath?: string }} [opts]
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountBanner = ({ enabled = true, appName = 'Devkit', privacyPath = '/legal/privacy' } = {}) => {
  wrapper = mount(LegalCookieBanner, {
    attachTo: document.body,
    global: {
      plugins: [vuetify(), i18n()],
      mocks: {
        config: {
          name: appName,
          legal: { cookieConsent: { enabled, privacyPolicyPath: privacyPath } },
        },
        $posthog: { capture: vi.fn(), opt_in_capturing: vi.fn(), opt_out_capturing: vi.fn(), reset: vi.fn(), set_config: vi.fn() },
      },
      stubs: { RouterLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } },
    },
  });
  return wrapper;
};

describe('legal.cookieBanner.component', () => {
  beforeEach(() => {
    consentNeeded.value = true;
    consent.value = null;
    acceptMock.mockReset();
    rejectMock.mockReset();
  });

  afterEach(() => {
    wrapper?.unmount();
    document.body.innerHTML = '';
  });

  it('does not render snackbar when cookieConsent.enabled is false', () => {
    const wrapper = mountBanner({ enabled: false });
    expect(wrapper.find('.v-snackbar').exists()).toBe(false);
  });

  it('renders snackbar after mount completes (isMounted hydration guard lifts on onMounted)', async () => {
    // The component gates v-snackbar on `isMounted` (set true in onMounted) to prevent
    // prerender from capturing the teleported snackbar outside #app, which would cause
    // Vue hydration to mount a second banner alongside the prerendered one.
    // In the test environment onMounted fires synchronously, so the banner IS visible
    // immediately after mount — confirming the guard correctly lifts at runtime.
    const w = mountBanner();
    await flushPromises();
    const buttons = w.findAllComponents({ name: 'VBtn' });
    expect(buttons.some((b) => b.text() === 'Sounds good')).toBe(true);
  });

  it('does not render snackbar content when consentNeeded is false', async () => {
    consentNeeded.value = false;
    mountBanner();
    await flushPromises();
    // v-snackbar teleports outside wrapper; query document.body for content
    expect(document.body.innerHTML).not.toContain('Sounds good');
  });

  it('renders Accept and Reject buttons when enabled and consentNeeded', async () => {
    const wrapper = mountBanner();
    await flushPromises();
    // v-snackbar teleports outside wrapper; use findAllComponents to traverse VNode tree
    const buttons = wrapper.findAllComponents({ name: 'VBtn' });
    expect(buttons.some((b) => b.text() === 'Sounds good')).toBe(true);
    expect(buttons.some((b) => b.text() === 'No thanks')).toBe(true);
  });

  it('Accept button calls accept()', async () => {
    const wrapper = mountBanner();
    await flushPromises();
    const buttons = wrapper.findAllComponents({ name: 'VBtn' });
    const acceptBtn = buttons.find((b) => b.text() === 'Sounds good');
    expect(acceptBtn).toBeTruthy();
    await acceptBtn.trigger('click');
    expect(acceptMock).toHaveBeenCalledOnce();
  });

  it('Reject button calls reject()', async () => {
    const wrapper = mountBanner();
    await flushPromises();
    const buttons = wrapper.findAllComponents({ name: 'VBtn' });
    const rejectBtn = buttons.find((b) => b.text() === 'No thanks');
    expect(rejectBtn).toBeTruthy();
    await rejectBtn.trigger('click');
    expect(rejectMock).toHaveBeenCalledOnce();
  });

  it('renders privacy policy link to configured path', async () => {
    mountBanner({ privacyPath: '/custom-privacy' });
    await flushPromises();
    // v-snackbar teleports; query document.body for the rendered link
    expect(document.body.innerHTML).toContain('Privacy Policy');
    // RouterLink stub renders as <a> without "to" attr; check the path via innerHTML
    expect(document.body.innerHTML).toContain('/custom-privacy');
  });

  it('renders revokeMessage when consent is not null (banner reopened from footer)', async () => {
    consentNeeded.value = true;
    consent.value = { analytics: true };
    mountBanner({ appName: 'Devkit' });
    await flushPromises();
    expect(document.body.innerHTML).toContain('Want to revisit your cookie choices for Devkit');
  });

  it('does not render snackbar when $posthog is not available even if cookieConsent.enabled', async () => {
    consentNeeded.value = true;
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(LegalCookieBanner, {
      global: {
        plugins: [vuetify(), i18n()],
        mocks: {
          config: {
            name: 'Trawl',
            legal: { cookieConsent: { enabled: true, privacyPolicyPath: '/privacy' } },
          },
        },
        stubs: { RouterLink: { template: '<a><slot /></a>', props: ['to'] } },
      },
      attachTo: document.body,
    });
    await flushPromises();
    expect(document.body.innerHTML).not.toContain('Sounds good');
    wrapper.unmount();
    document.body.innerHTML = '';
    consoleSpy.mockRestore();
  });

  it('renders snackbar when $posthog IS available and cookieConsent.enabled', async () => {
    consentNeeded.value = true;
    const wrapper = mount(LegalCookieBanner, {
      global: {
        plugins: [vuetify(), i18n()],
        mocks: {
          config: {
            name: 'Trawl',
            legal: { cookieConsent: { enabled: true, privacyPolicyPath: '/privacy' } },
          },
          $posthog: { capture: vi.fn(), opt_in_capturing: vi.fn(), opt_out_capturing: vi.fn(), reset: vi.fn(), set_config: vi.fn() },
        },
        stubs: { RouterLink: { template: '<a><slot /></a>', props: ['to'] } },
      },
      attachTo: document.body,
    });
    await flushPromises();
    expect(document.body.innerHTML).toContain('Sounds good');
    wrapper.unmount();
    document.body.innerHTML = '';
  });
});
