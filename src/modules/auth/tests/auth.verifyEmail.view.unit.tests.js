import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const verifyEmailMock = vi.hoisted(() => vi.fn());
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => ({ verifyEmail: verifyEmailMock }),
}));

import AuthVerifyEmailView from '../local/views/verifyEmail.view.vue';

const mockConfig = {
  api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api', endPoints: { auth: 'auth' } },
  sign: { route: '/tasks', in: true, up: true },
  vuetify: { theme: { flat: true, maxWidth: '1200px' } },
};

/**
 * Mount the verify-email view with Vuetify and mocked route params.
 * @param {string} token - Verification token injected via route params.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountView = (token = 'verify-token-abc') =>
  mount(AuthVerifyEmailView, {
    global: {
      plugins: [createVuetify()],
      mocks: {
        config: mockConfig,
        $route: { params: { token } },
        $router: { push: vi.fn() },
      },
      stubs: { RouterLink: true },
    },
  });

describe('auth.verifyEmail.view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    verifyEmailMock.mockReset();
  });

  it('calls verifyEmail with the token from route params on creation', async () => {
    verifyEmailMock.mockResolvedValueOnce({ message: 'Email verified' });
    const wrapper = mountView('my-verify-token');

    // Wait for the async created hook
    await wrapper.vm.$nextTick();
    await vi.dynamicImportSettled();

    expect(verifyEmailMock).toHaveBeenCalledTimes(1);
    expect(verifyEmailMock).toHaveBeenCalledWith('my-verify-token');
  });

  it('sets success state when verification succeeds', async () => {
    verifyEmailMock.mockResolvedValueOnce({ message: 'Email verified' });
    const wrapper = mountView();

    await wrapper.vm.$nextTick();
    await vi.dynamicImportSettled();

    expect(wrapper.vm.success).toBe(true);
    expect(wrapper.vm.error).toBe(false);
    expect(wrapper.vm.loading).toBe(false);
  });

  it('sets error state when verification fails', async () => {
    const err = new Error('Invalid token');
    err.response = { data: { message: 'Token expired' } };
    verifyEmailMock.mockRejectedValueOnce(err);

    const wrapper = mountView();

    await wrapper.vm.$nextTick();
    await vi.dynamicImportSettled();

    expect(wrapper.vm.error).toBe(true);
    expect(wrapper.vm.errorMessage).toBe('Token expired');
    expect(wrapper.vm.success).toBe(false);
    expect(wrapper.vm.loading).toBe(false);
  });

  it('shows a fallback error message when response has no message', async () => {
    verifyEmailMock.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = mountView();

    await wrapper.vm.$nextTick();
    await vi.dynamicImportSettled();

    expect(wrapper.vm.error).toBe(true);
    expect(wrapper.vm.errorMessage).toBe('Verification failed. The token may be invalid or expired.');
  });

  it('sets error when no token is provided', async () => {
    const wrapper = mount(AuthVerifyEmailView, {
      global: {
        plugins: [createVuetify()],
        mocks: {
          config: mockConfig,
          $route: { params: {} },
          $router: { push: vi.fn() },
        },
        stubs: { RouterLink: true },
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.error).toBe(true);
    expect(wrapper.vm.errorMessage).toBe('No verification token provided.');
    expect(verifyEmailMock).not.toHaveBeenCalled();
  });
});
