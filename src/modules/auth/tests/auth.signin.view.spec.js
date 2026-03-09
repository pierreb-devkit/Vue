import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const signinMock = vi.hoisted(() => vi.fn());
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => ({ auth: false, signin: signinMock, serverConfig: null, fetchServerConfig: vi.fn().mockResolvedValue(null) }),
}));

import AuthSigninView from '../views/auth.signin.view.vue';

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
  });

  describe('validate()', () => {
    it('calls signin with exactly { email, password } — no extra arguments', async () => {
      signinMock.mockResolvedValueOnce(undefined);
      const wrapper = mountView();

      wrapper.vm.email = 'test@example.com';
      wrapper.vm.password = 'password123';

      await wrapper.vm.validate();

      expect(signinMock).toHaveBeenCalledTimes(1);
      expect(signinMock).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    });

    it('does not call signin when form is invalid', async () => {
      const wrapper = mountView(makeFormStub(false));

      await wrapper.vm.validate();

      expect(signinMock).not.toHaveBeenCalled();
    });

    it('does not throw when signin rejects', async () => {
      signinMock.mockRejectedValueOnce(new Error('network error'));
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const wrapper = mountView();

      wrapper.vm.email = 'test@example.com';
      wrapper.vm.password = 'password123';

      await expect(wrapper.vm.validate()).resolves.toBeUndefined();
      consoleSpy.mockRestore();
    });
  });
});
