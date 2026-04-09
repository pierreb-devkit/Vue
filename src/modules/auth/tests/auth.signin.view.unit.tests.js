import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const signinMock = vi.hoisted(() => vi.fn());
const clearLockoutMock = vi.hoisted(() => vi.fn());
const lockoutState = vi.hoisted(() => ({ locked: false, retryAfter: 0 }));
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => ({
    auth: false,
    signin: signinMock,
    clearLockout: clearLockoutMock,
    lockout: lockoutState,
    serverConfig: null,
    fetchServerConfig: vi.fn().mockResolvedValue(null),
  }),
}));

import AuthSigninView from '../views/signin.view.vue';

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
 * Mount the signin view with Vuetify installed and VForm controlled by a stub.
 * @param {object} formStub - VForm component definition controlling validation outcome.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountView = (formStub = makeFormStub()) =>
  mount(AuthSigninView, {
    global: {
      plugins: [createVuetify()],
      mocks: { config: mockConfig, $route: { query: {} }, $router: { push: vi.fn() } },
      stubs: { RouterLink: true, VForm: formStub },
    },
  });

describe('auth.signin.view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    signinMock.mockReset();
    clearLockoutMock.mockReset();
    lockoutState.locked = false;
    lockoutState.retryAfter = 0;
  });

  describe('serverConfig rendering', () => {
    it('hides form and shows alert when sign.in is false', async () => {
      const wrapper = mountView();
      await flushPromises();
      wrapper.vm.serverConfig = { sign: { in: false, up: true } };
      await flushPromises();

      expect(wrapper.text()).toContain('Sign in is currently disabled');
      expect(wrapper.findComponent({ ref: 'form' }).exists()).toBe(false);
    });

    it('shows form when sign.in is true', async () => {
      const wrapper = mountView();
      await flushPromises();
      wrapper.vm.serverConfig = { sign: { in: true, up: true } };
      await flushPromises();

      expect(wrapper.text()).not.toContain('Sign in is currently disabled');
    });
  });

  describe('validate()', () => {
    it('calls signin with exactly { email, password } — no extra arguments', async () => {
      signinMock.mockResolvedValueOnce(undefined);
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.email = 'test@example.com';
      wrapper.vm.password = 'password123';

      await wrapper.vm.validate();

      expect(signinMock).toHaveBeenCalledTimes(1);
      expect(signinMock).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    });

    it('does not call signin when form is invalid', async () => {
      const wrapper = mountView(makeFormStub(false));
      await flushPromises();

      await wrapper.vm.validate();

      expect(signinMock).not.toHaveBeenCalled();
    });

    it('does not throw when signin rejects', async () => {
      signinMock.mockRejectedValueOnce(new Error('network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.email = 'test@example.com';
      wrapper.vm.password = 'password123';

      await expect(wrapper.vm.validate()).resolves.toBeUndefined();
      consoleSpy.mockRestore();
    });
  });

  describe('password visibility toggle', () => {
    it('initializes showPassword to false', async () => {
      const wrapper = mountView();
      await flushPromises();

      expect(wrapper.vm.showPassword).toBe(false);
    });

    it('toggles showPassword when clicking the append-inner icon', async () => {
      const wrapper = mountView();
      await flushPromises();

      expect(wrapper.vm.showPassword).toBe(false);
      wrapper.vm.showPassword = !wrapper.vm.showPassword;
      expect(wrapper.vm.showPassword).toBe(true);
      wrapper.vm.showPassword = !wrapper.vm.showPassword;
      expect(wrapper.vm.showPassword).toBe(false);
    });
  });

  describe('lockout UI', () => {
    it('computes lockoutMinutes rounded up from retryAfter seconds', async () => {
      lockoutState.locked = true;
      lockoutState.retryAfter = 150;

      const wrapper = mountView();
      await flushPromises();

      expect(wrapper.vm.lockoutMinutes).toBe(3);
    });

    it('computes lockoutMinutes as 1 for values under 60', async () => {
      lockoutState.locked = true;
      lockoutState.retryAfter = 30;

      const wrapper = mountView();
      await flushPromises();

      expect(wrapper.vm.lockoutMinutes).toBe(1);
    });

    it('shows lockout alert when locked', async () => {
      lockoutState.locked = true;
      lockoutState.retryAfter = 300;

      const wrapper = mountView();
      await flushPromises();

      expect(wrapper.text()).toContain('Account locked');
      expect(wrapper.text()).toContain('5 minute');
    });
  });
});
