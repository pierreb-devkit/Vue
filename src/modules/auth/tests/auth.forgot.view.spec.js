import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const forgotMock = vi.fn();
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => ({ mail: { status: false, message: '' }, forgot: forgotMock }),
}));

import AuthForgotView from '../views/auth.forgot.view.vue';

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
 * Mount the forgot-password view with Vuetify installed and VForm controlled by a stub.
 * @param {object} formStub - VForm component definition controlling validation outcome.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountView = (formStub = makeFormStub()) =>
  mount(AuthForgotView, {
    global: {
      plugins: [createVuetify()],
      mocks: { config: mockConfig, $route: { query: {} }, $router: { push: vi.fn() } },
      stubs: { RouterLink: true, VForm: formStub },
    },
  });

describe('auth.forgot.view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    forgotMock.mockReset();
  });

  describe('validate()', () => {
    it('calls forgot with exactly { email } — no extra arguments', async () => {
      forgotMock.mockResolvedValueOnce(undefined);
      const wrapper = mountView();

      wrapper.vm.email = 'forgot@example.com';

      await wrapper.vm.validate();

      expect(forgotMock).toHaveBeenCalledTimes(1);
      expect(forgotMock).toHaveBeenCalledWith({ email: 'forgot@example.com' });
    });

    it('does not call forgot when form is invalid', async () => {
      const wrapper = mountView(makeFormStub(false));

      await wrapper.vm.validate();

      expect(forgotMock).not.toHaveBeenCalled();
    });

    it('does not throw when forgot rejects', async () => {
      forgotMock.mockRejectedValueOnce(new Error('network error'));
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const wrapper = mountView();

      wrapper.vm.email = 'forgot@example.com';

      await expect(wrapper.vm.validate()).resolves.toBeUndefined();
      consoleSpy.mockRestore();
    });
  });
});
