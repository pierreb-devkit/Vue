import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

// v-snackbar uses visualViewport which is not available in jsdom
if (typeof globalThis.visualViewport === 'undefined') {
  globalThis.visualViewport = { addEventListener: vi.fn(), removeEventListener: vi.fn(), width: 1024, height: 768 };
}

const resendVerificationMock = vi.hoisted(() => vi.fn());
const storeMock = vi.hoisted(() => ({
  isLoggedIn: false,
  user: null,
  serverConfig: null,
  resendVerification: resendVerificationMock,
}));

vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => storeMock,
}));

import AuthEmailBanner from '../components/emailBanner.component.vue';

/**
 * Mount the email banner component with Vuetify installed.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountComponent = () =>
  mount(AuthEmailBanner, {
    global: {
      plugins: [createVuetify()],
    },
  });

describe('auth.emailBanner.component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resendVerificationMock.mockReset();
    storeMock.isLoggedIn = false;
    storeMock.user = null;
    storeMock.serverConfig = null;
  });

  it('does not show when user is not logged in', () => {
    storeMock.isLoggedIn = false;
    storeMock.user = null;
    const wrapper = mountComponent();

    expect(wrapper.vm.shouldShow).toBe(false);
  });

  it('does not show when user email is already verified', () => {
    storeMock.isLoggedIn = true;
    storeMock.user = { emailVerified: true };
    storeMock.serverConfig = { mail: { configured: true } };
    const wrapper = mountComponent();

    expect(wrapper.vm.shouldShow).toBe(false);
  });

  it('does not show when mail is not configured', () => {
    storeMock.isLoggedIn = true;
    storeMock.user = { emailVerified: false };
    storeMock.serverConfig = { mail: { configured: false } };
    const wrapper = mountComponent();

    expect(wrapper.vm.shouldShow).toBe(false);
  });

  it('shows when user is logged in, email not verified, and mail configured', () => {
    storeMock.isLoggedIn = true;
    storeMock.user = { emailVerified: false };
    storeMock.serverConfig = { mail: { configured: true } };
    const wrapper = mountComponent();

    expect(wrapper.vm.shouldShow).toBe(true);
    expect(wrapper.vm.visible).toBe(true);
  });

  it('calls resendVerification when resend is triggered', async () => {
    storeMock.isLoggedIn = true;
    storeMock.user = { emailVerified: false };
    storeMock.serverConfig = { mail: { configured: true } };
    resendVerificationMock.mockResolvedValueOnce({});

    const wrapper = mountComponent();

    await wrapper.vm.resend();

    expect(resendVerificationMock).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.sent).toBe(true);
  });

  it('stays visible when resend fails for retry', async () => {
    storeMock.isLoggedIn = true;
    storeMock.user = { emailVerified: false };
    storeMock.serverConfig = { mail: { configured: true } };
    resendVerificationMock.mockRejectedValueOnce(new Error('Server error'));

    const wrapper = mountComponent();

    await wrapper.vm.resend();

    expect(wrapper.vm.sent).toBe(false);
    expect(wrapper.vm.visible).toBe(true);
  });

  it('hides when dismissed and reappears after route change', async () => {
    storeMock.isLoggedIn = true;
    storeMock.user = { emailVerified: false };
    storeMock.serverConfig = { mail: { configured: true } };
    const wrapper = mountComponent();

    expect(wrapper.vm.visible).toBe(true);

    wrapper.vm.dismiss();
    expect(wrapper.vm.visible).toBe(false);

    // Simulate route change
    wrapper.vm.$options.watch.$route.call(wrapper.vm);
    expect(wrapper.vm.visible).toBe(true);
  });
});
