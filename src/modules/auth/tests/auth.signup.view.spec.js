import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const signupMock = vi.hoisted(() => vi.fn());
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => ({ auth: false, signup: signupMock, serverConfig: null, fetchServerConfig: vi.fn().mockResolvedValue(null) }),
}));

import AuthSignupView from '../views/auth.signup.view.vue';

const mockConfig = {
  api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api', endPoints: { auth: 'auth' } },
  sign: { route: '/tasks', in: true, up: true },
  oAuth: { google: false, apple: false },
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
 * Mount the signup view with Vuetify installed and VForm controlled by a stub.
 * @param {object} formStub - VForm component definition controlling validation outcome.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountView = (formStub = makeFormStub()) =>
  mount(AuthSignupView, {
    global: {
      plugins: [createVuetify()],
      mocks: { config: mockConfig, $route: { query: {} }, $router: { push: vi.fn() } },
      stubs: { RouterLink: true, VForm: formStub },
    },
  });

describe('auth.signup.view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    signupMock.mockReset();
  });

  describe('serverConfig rendering', () => {
    it('hides form and shows alert when sign.up is false', async () => {
      const wrapper = mountView();
      await flushPromises();
      wrapper.vm.serverConfig = { sign: { in: true, up: false } };
      await flushPromises();

      expect(wrapper.text()).toContain('Registration is currently disabled');
      expect(wrapper.findComponent({ ref: 'form' }).exists()).toBe(false);
    });

    it('shows form when sign.up is true', async () => {
      const wrapper = mountView();
      await flushPromises();
      wrapper.vm.serverConfig = { sign: { in: true, up: true } };
      await flushPromises();

      expect(wrapper.text()).not.toContain('Registration is currently disabled');
    });
  });

  describe('validate()', () => {
    it('calls signup with exactly { email, password, firstName, lastName } — no extra arguments', async () => {
      signupMock.mockResolvedValueOnce(undefined);
      const wrapper = mountView();

      wrapper.vm.firstName = 'John';
      wrapper.vm.lastName = 'Doe';
      wrapper.vm.email = 'john@example.com';
      wrapper.vm.password = 'password123';

      await wrapper.vm.validate();

      expect(signupMock).toHaveBeenCalledTimes(1);
      expect(signupMock).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('does not call signup when form is invalid', async () => {
      const wrapper = mountView(makeFormStub(false));

      await wrapper.vm.validate();

      expect(signupMock).not.toHaveBeenCalled();
    });

    it('does not throw when signup rejects', async () => {
      signupMock.mockRejectedValueOnce(new Error('network error'));
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const wrapper = mountView();

      wrapper.vm.firstName = 'John';
      wrapper.vm.lastName = 'Doe';
      wrapper.vm.email = 'john@example.com';
      wrapper.vm.password = 'password123';

      await expect(wrapper.vm.validate()).resolves.toBeUndefined();
      consoleSpy.mockRestore();
    });
  });
});
