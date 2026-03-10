import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const resendVerificationMock = vi.hoisted(() => vi.fn());
const storeMock = vi.hoisted(() => ({
  isLoggedIn: false,
  user: null,
  resendVerification: resendVerificationMock,
}));

vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => storeMock,
}));

import AuthEmailBanner from '../components/auth.emailBanner.component.vue';

const mockConfig = {
  vuetify: { theme: { flat: true } },
};

/**
 * Mount the email banner component with Vuetify installed.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountComponent = () =>
  mount(AuthEmailBanner, {
    global: {
      plugins: [createVuetify()],
      mocks: {
        config: mockConfig,
      },
    },
  });

describe('auth.emailBanner.component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resendVerificationMock.mockReset();
    storeMock.isLoggedIn = false;
    storeMock.user = null;
  });

  it('does not render when user is not logged in', () => {
    storeMock.isLoggedIn = false;
    storeMock.user = null;
    const wrapper = mountComponent();

    expect(wrapper.find('.v-alert').exists()).toBe(false);
  });

  it('does not render when user email is already verified', () => {
    storeMock.isLoggedIn = true;
    storeMock.user = { emailVerified: true };
    const wrapper = mountComponent();

    expect(wrapper.find('.v-alert').exists()).toBe(false);
  });

  it('renders when user is logged in and email is not verified', () => {
    storeMock.isLoggedIn = true;
    storeMock.user = { emailVerified: false };
    const wrapper = mountComponent();

    expect(wrapper.find('.v-alert').exists()).toBe(true);
  });

  it('calls resendVerification when resend button is clicked', async () => {
    storeMock.isLoggedIn = true;
    storeMock.user = { emailVerified: false };
    resendVerificationMock.mockResolvedValueOnce({});

    const wrapper = mountComponent();

    await wrapper.vm.resend();

    expect(resendVerificationMock).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.sent).toBe(true);
  });

  it('shows error message when resend fails', async () => {
    storeMock.isLoggedIn = true;
    storeMock.user = { emailVerified: false };
    const err = new Error('Server error');
    err.response = { data: { message: 'Too many requests' } };
    resendVerificationMock.mockRejectedValueOnce(err);

    const wrapper = mountComponent();

    await wrapper.vm.resend();

    expect(wrapper.vm.errorMessage).toBe('Too many requests');
    expect(wrapper.vm.sent).toBe(false);
  });
});
