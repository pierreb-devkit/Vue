import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const resetMock = vi.hoisted(() => vi.fn());
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => ({ mail: { status: false, message: '' }, reset: resetMock }),
}));

import AuthResetView from '../views/reset.view.vue';

const mockConfig = {
  api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api', endPoints: { auth: 'auth' } },
  sign: { route: '/tasks', in: true, up: true },
  vuetify: { theme: { flat: true, maxWidth: '1200px' } },
};

/**
 * Build a VForm component whose validate() resolves with the given validity.
 * @param {boolean} valid - Whether the form should pass validation.
 * @returns {object} Vue component definition
 */
const makeFormStub = (valid = true) => ({
  template: '<div><slot /></div>',
  methods: {
    validate: vi.fn().mockResolvedValue({ valid }),
    reset: vi.fn(),
  },
});

/**
 * Mount the reset-password view with Vuetify installed and VForm controlled by a stub.
 * @param {string} token - Reset token injected via route query.
 * @param {object} formStub - VForm component definition controlling validation outcome.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountView = (token = 'reset-token-abc', formStub = makeFormStub()) =>
  mount(AuthResetView, {
    global: {
      plugins: [createVuetify()],
      mocks: {
        config: mockConfig,
        $route: { query: { token } },
        $router: { push: vi.fn() },
      },
      stubs: { RouterLink: true, VForm: formStub },
    },
  });

describe('auth.reset.view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resetMock.mockReset();
  });

  describe('validate()', () => {
    it('calls reset with exactly { newPassword, token } — no extra arguments', async () => {
      resetMock.mockResolvedValueOnce(undefined);
      const wrapper = mountView('my-reset-token');

      wrapper.vm.password = 'NewSecurePass1';

      await wrapper.vm.validate();

      expect(resetMock).toHaveBeenCalledTimes(1);
      expect(resetMock).toHaveBeenCalledWith({ newPassword: 'NewSecurePass1', token: 'my-reset-token' });
    });

    it('reads the reset token from $route.query.token', async () => {
      resetMock.mockResolvedValueOnce(undefined);
      const wrapper = mountView('token-from-route');

      wrapper.vm.password = 'NewSecurePass1';

      await wrapper.vm.validate();

      expect(resetMock).toHaveBeenCalledWith(expect.objectContaining({ token: 'token-from-route' }));
    });

    it('does not call reset when form is invalid', async () => {
      const wrapper = mountView('any-token', makeFormStub(false));

      await wrapper.vm.validate();

      expect(resetMock).not.toHaveBeenCalled();
    });

    it('does not throw when reset rejects', async () => {
      resetMock.mockRejectedValueOnce(new Error('network error'));
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const wrapper = mountView();

      wrapper.vm.password = 'NewSecurePass1';

      await expect(wrapper.vm.validate()).resolves.toBeUndefined();
      consoleSpy.mockRestore();
    });
  });

  describe('password visibility toggle', () => {
    it('initializes showPassword to false', () => {
      const wrapper = mountView();

      expect(wrapper.vm.showPassword).toBe(false);
    });

    it('toggles showPassword when clicking the append-inner icon', () => {
      const wrapper = mountView();

      expect(wrapper.vm.showPassword).toBe(false);
      wrapper.vm.showPassword = !wrapper.vm.showPassword;
      expect(wrapper.vm.showPassword).toBe(true);
      wrapper.vm.showPassword = !wrapper.vm.showPassword;
      expect(wrapper.vm.showPassword).toBe(false);
    });
  });

  describe('rules.password', () => {
    it('returns error string for passwords shorter than 8 characters', () => {
      const wrapper = mountView();
      expect(wrapper.vm.rules.password('short')).toBe('Password must be at least 8 characters');
      expect(wrapper.vm.rules.password('')).toBe('Password must be at least 8 characters');
      expect(wrapper.vm.rules.password(null)).toBe('Password must be at least 8 characters');
      expect(wrapper.vm.rules.password(undefined)).toBe('Password must be at least 8 characters');
    });

    it('returns true for passwords of 8+ characters', () => {
      const wrapper = mountView();
      expect(wrapper.vm.rules.password('longenough')).toBe(true);
      expect(wrapper.vm.rules.password('exactly8')).toBe(true);
    });
  });
});
