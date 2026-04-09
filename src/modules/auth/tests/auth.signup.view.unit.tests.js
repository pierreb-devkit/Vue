import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const signupMock = vi.hoisted(() => vi.fn());
const fetchServerConfigMock = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const refreshAbilitiesMock = vi.hoisted(() => vi.fn().mockResolvedValue());
const resendVerificationMock = vi.hoisted(() => vi.fn().mockResolvedValue());
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => ({ auth: false, signup: signupMock, serverConfig: null, fetchServerConfig: fetchServerConfigMock, refreshAbilities: refreshAbilitiesMock, resendVerification: resendVerificationMock }),
  deduceNamesFromEmail: (email) => {
    const local = email ? email.split('@')[0] : '';
    const parts = local.split(/[._-]/);
    return {
      firstName: parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : '',
      lastName: parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : '',
    };
  },
}));

const createOrganizationMock = vi.hoisted(() => vi.fn());
vi.mock('../../organizations/stores/organizations.store', () => ({
  useOrganizationsStore: () => ({ createOrganization: createOrganizationMock }),
}));

import AuthSignupView from '../views/signup.view.vue';

const mockConfig = {
  api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api', endPoints: { auth: 'auth' } },
  sign: { route: '/tasks', in: true, up: true },
  vuetify: { theme: { flat: true, maxWidth: '1200px', rounded: 'rounded-lg' } },
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
      stubs: { RouterLink: true, VForm: formStub, AuthOrganizationSetupComponent: true },
    },
  });

describe('auth.signup.view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    signupMock.mockReset();
    fetchServerConfigMock.mockReset().mockResolvedValue(null);
    refreshAbilitiesMock.mockReset().mockResolvedValue();
    resendVerificationMock.mockReset().mockResolvedValue();
    createOrganizationMock.mockReset();
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
    it('calls signup with exactly { email, password } — names are deduced in the store', async () => {
      signupMock.mockResolvedValueOnce({ user: { roles: ['user'] }, tokenExpiresIn: 123 });
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.email = 'john@example.com';
      wrapper.vm.password = 'password123';

      await wrapper.vm.validate();

      expect(signupMock).toHaveBeenCalledTimes(1);
      expect(signupMock).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
      });
    });

    it('does not call signup when form is invalid', async () => {
      const wrapper = mountView(makeFormStub(false));
      await flushPromises();

      await wrapper.vm.validate();

      expect(signupMock).not.toHaveBeenCalled();
    });

    it('does not throw when signup rejects', async () => {
      signupMock.mockRejectedValueOnce(new Error('network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.firstName = 'John';
      wrapper.vm.lastName = 'Doe';
      wrapper.vm.email = 'john@example.com';
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

  describe('organization signup flow', () => {
    it('does not show org step when organizations are disabled', async () => {
      signupMock.mockResolvedValueOnce({ user: { roles: ['user'] }, tokenExpiresIn: 123 });
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.serverConfig = { sign: { in: true, up: true } };
      wrapper.vm.firstName = 'John';
      wrapper.vm.lastName = 'Doe';
      wrapper.vm.email = 'john@example.com';
      wrapper.vm.password = 'password123';

      await wrapper.vm.validate();
      await flushPromises();

      expect(wrapper.vm.signupStep).toBe('form');
      expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/tasks');
    });

    it('shows success message when backend auto-created an organization', async () => {
      signupMock.mockResolvedValueOnce({
        user: { roles: ['user'] },
        tokenExpiresIn: 123,
        organization: { name: 'Acme Inc', slug: 'acme-inc' },
      });
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.serverConfig = { sign: { in: true, up: true }, organizations: { enabled: true } };
      wrapper.vm.firstName = 'John';
      wrapper.vm.lastName = 'Doe';
      wrapper.vm.email = 'john@example.com';
      wrapper.vm.password = 'password123';

      await wrapper.vm.validate();
      await flushPromises();

      expect(wrapper.vm.signupStep).toBe('organizationWelcome');
      expect(wrapper.vm.organizationWelcomeMessage).toContain('Acme Inc');
      expect(wrapper.text()).toContain('Acme Inc');
    });

    it('shows pending message when backend auto-joined with pending status', async () => {
      signupMock.mockResolvedValueOnce({
        user: { roles: ['user'] },
        tokenExpiresIn: 123,
        organization: { name: 'Acme Inc', slug: 'acme-inc' },
        pendingJoin: true,
      });
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.serverConfig = { sign: { in: true, up: true }, organizations: { enabled: true } };
      wrapper.vm.firstName = 'John';
      wrapper.vm.lastName = 'Doe';
      wrapper.vm.email = 'john@example.com';
      wrapper.vm.password = 'password123';

      await wrapper.vm.validate();
      await flushPromises();

      expect(wrapper.vm.signupStep).toBe('organizationWelcome');
      expect(wrapper.vm.organizationWelcomeMessage).toContain('request to join');
      expect(wrapper.vm.organizationWelcomeMessage).toContain('Acme Inc');
    });

    it('shows organization setup form when organizationSetupRequired is true', async () => {
      signupMock.mockResolvedValueOnce({
        user: { roles: ['user'] },
        tokenExpiresIn: 123,
        organizationSetupRequired: true,
      });
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.serverConfig = { sign: { in: true, up: true }, organizations: { enabled: true } };
      wrapper.vm.firstName = 'John';
      wrapper.vm.lastName = 'Doe';
      wrapper.vm.email = 'john@example.com';
      wrapper.vm.password = 'password123';

      await wrapper.vm.validate();
      await flushPromises();

      expect(wrapper.vm.signupStep).toBe('organizationSetup');
    });

    it('proceeds to app after clicking Get Started on welcome step', async () => {
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.signupStep = 'organizationWelcome';
      wrapper.vm.organizationWelcomeMessage = 'Welcome!';

      await wrapper.vm.proceedToApp();

      expect(refreshAbilitiesMock).toHaveBeenCalled();
      expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/tasks');
    });

    it('transitions to welcome step after organization is created in setup', async () => {
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.signupStep = 'organizationSetup';
      await flushPromises();

      wrapper.vm.onOrganizationCreated({ name: 'New Org', _id: '123' });
      await flushPromises();

      expect(wrapper.vm.signupStep).toBe('organizationWelcome');
      expect(wrapper.vm.organizationWelcomeMessage).toContain('New Org');
    });
  });

  describe('email verification flow', () => {
    it('shows email verification step when emailVerificationRequired is returned', async () => {
      signupMock.mockResolvedValueOnce({
        user: { roles: ['user'] },
        tokenExpiresIn: 123,
        emailVerificationRequired: true,
      });
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.email = 'john@example.com';
      wrapper.vm.password = 'password123';

      await wrapper.vm.validate();
      await flushPromises();

      expect(wrapper.vm.signupStep).toBe('emailVerification');
      expect(wrapper.vm.$router.push).not.toHaveBeenCalled();
    });

    it('shows the email address in the verification step', async () => {
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.signupStep = 'emailVerification';
      wrapper.vm.email = 'jane@example.com';
      await flushPromises();

      expect(wrapper.text()).toContain('jane@example.com');
    });

    it('calls resendVerification when resend button is clicked', async () => {
      resendVerificationMock.mockResolvedValueOnce({});
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.signupStep = 'emailVerification';
      await flushPromises();

      await wrapper.vm.resendVerification();

      expect(resendVerificationMock).toHaveBeenCalledTimes(1);
      expect(wrapper.vm.resent).toBe(true);
    });

    it('keeps resent false when resend fails', async () => {
      resendVerificationMock.mockRejectedValueOnce(new Error('fail'));
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.signupStep = 'emailVerification';
      await flushPromises();

      await wrapper.vm.resendVerification();

      expect(wrapper.vm.resent).toBe(false);
    });

    it('prioritizes emailVerificationRequired over org setup', async () => {
      signupMock.mockResolvedValueOnce({
        user: { roles: ['user'] },
        tokenExpiresIn: 123,
        emailVerificationRequired: true,
        organizationSetupRequired: true,
      });
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.serverConfig = { sign: { in: true, up: true }, organizations: { enabled: true } };
      wrapper.vm.email = 'john@example.com';
      wrapper.vm.password = 'password123';

      await wrapper.vm.validate();
      await flushPromises();

      expect(wrapper.vm.signupStep).toBe('emailVerification');
    });

    it('sets progress bar to 50 during email verification step', async () => {
      const wrapper = mountView();
      await flushPromises();

      wrapper.vm.signupStep = 'emailVerification';
      await flushPromises();

      expect(wrapper.vm.signupProgressValue).toBe(50);
    });
  });
});
