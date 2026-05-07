import { describe, it, expect, beforeEach, vi } from 'vitest';
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

vi.mock('../composables/useCookieConsent', () => ({
  useCookieConsent: () => ({
    consentNeeded,
    consent: ref(null),
    accept: acceptMock,
    reject: rejectMock,
    reopenSettings: vi.fn(),
  }),
}));

import LegalCookieBanner from '../components/legal.cookieBanner.component.vue';

const vuetify = () => createVuetify({ components, directives });
const i18n = () =>
  createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: {
        legal: {
          banner: {
            message: 'We use analytics cookies to improve {appName}. See our',
            privacyPolicy: 'Privacy Policy',
            accept: 'Accept',
            reject: 'Reject',
            revokeMessage: 'Update your cookie preferences for {appName}.',
          },
        },
      },
    },
  });

const mountBanner = ({ enabled = true, appName = 'Devkit', privacyPath = '/legal/privacy' } = {}) =>
  mount(LegalCookieBanner, {
    attachTo: document.body,
    global: {
      plugins: [vuetify(), i18n()],
      mocks: {
        config: {
          name: appName,
          legal: { cookieConsent: { enabled, privacyPolicyPath: privacyPath } },
        },
      },
      stubs: { RouterLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } },
    },
  });

describe('legal.cookieBanner.component', () => {
  beforeEach(() => {
    consentNeeded.value = true;
    acceptMock.mockReset();
    rejectMock.mockReset();
  });

  it('does not render snackbar when cookieConsent.enabled is false', () => {
    consentNeeded.value = true;
    const wrapper = mountBanner({ enabled: false });
    expect(wrapper.find('.v-snackbar').exists()).toBe(false);
  });

  it('does not render snackbar content when consentNeeded is false', async () => {
    consentNeeded.value = false;
    const wrapper = mountBanner();
    await flushPromises();
    // v-snackbar teleports outside wrapper; query document.body for content
    expect(document.body.innerHTML).not.toContain('Accept');
  });

  it('renders Accept and Reject buttons when enabled and consentNeeded', async () => {
    const wrapper = mountBanner();
    await flushPromises();
    // v-snackbar teleports outside wrapper; use findAllComponents to traverse VNode tree
    const buttons = wrapper.findAllComponents({ name: 'VBtn' });
    expect(buttons.some((b) => b.text() === 'Accept')).toBe(true);
    expect(buttons.some((b) => b.text() === 'Reject')).toBe(true);
  });

  it('Accept button calls accept()', async () => {
    const wrapper = mountBanner();
    await flushPromises();
    const buttons = wrapper.findAllComponents({ name: 'VBtn' });
    const acceptBtn = buttons.find((b) => b.text() === 'Accept');
    expect(acceptBtn).toBeTruthy();
    await acceptBtn.trigger('click');
    expect(acceptMock).toHaveBeenCalledOnce();
  });

  it('Reject button calls reject()', async () => {
    const wrapper = mountBanner();
    await flushPromises();
    const buttons = wrapper.findAllComponents({ name: 'VBtn' });
    const rejectBtn = buttons.find((b) => b.text() === 'Reject');
    expect(rejectBtn).toBeTruthy();
    await rejectBtn.trigger('click');
    expect(rejectMock).toHaveBeenCalledOnce();
  });

  it('renders privacy policy link to configured path', async () => {
    const wrapper = mountBanner({ privacyPath: '/custom-privacy' });
    await flushPromises();
    // v-snackbar teleports; query document.body for the rendered link
    expect(document.body.innerHTML).toContain('Privacy Policy');
    // RouterLink stub renders as <a> without "to" attr; check the path via innerHTML
    expect(document.body.innerHTML).toContain('/custom-privacy');
  });
});
