import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const resendVerificationMock = vi.hoisted(() => vi.fn().mockResolvedValue());
const refreshAbilitiesMock = vi.hoisted(() => vi.fn().mockResolvedValue());
const signoutMock = vi.hoisted(() => vi.fn().mockResolvedValue());
const authStoreMock = vi.hoisted(() => ({
  isLoggedIn: true,
  user: null,
  serverConfig: null,
  pendingRequests: [],
  resendVerification: resendVerificationMock,
  refreshAbilities: refreshAbilitiesMock,
  signout: signoutMock,
}));

vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => authStoreMock,
}));

const searchDomainMock = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const createJoinRequestMock = vi.hoisted(() => vi.fn().mockResolvedValue());
vi.mock('../stores/organizations.store', () => ({
  useOrganizationsStore: () => ({
    searchOrganizationsByDomain: searchDomainMock,
    createJoinRequest: createJoinRequestMock,
  }),
}));

vi.mock('../../core/stores/core.store', () => ({
  useCoreStore: () => ({ refreshNav: vi.fn() }),
}));

vi.mock('../../../lib/helpers/orgColor', () => ({
  default: () => 'primary',
}));

import OrganizationsRequiredView from '../views/organizations.required.view.vue';

const mockConfig = {
  api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api', endPoints: { auth: 'auth' } },
  sign: { route: '/tasks', in: true, up: true },
  vuetify: { theme: { flat: true, maxWidth: '1200px', rounded: 'rounded-lg' } },
};

/**
 * Mount the organizations required view with Vuetify installed.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountView = () =>
  mount(OrganizationsRequiredView, {
    global: {
      plugins: [createVuetify()],
      mocks: { config: mockConfig, $route: { query: {} }, $router: { push: vi.fn() } },
      stubs: { RouterLink: true },
    },
  });

describe('organizations.required.view — email verification gate', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resendVerificationMock.mockReset().mockResolvedValue();
    refreshAbilitiesMock.mockReset().mockResolvedValue();
    signoutMock.mockReset().mockResolvedValue();
    searchDomainMock.mockReset().mockResolvedValue([]);
    authStoreMock.isLoggedIn = true;
    authStoreMock.user = { emailVerified: true, email: 'test@example.com' };
    authStoreMock.serverConfig = { mail: { configured: false } };
    authStoreMock.pendingRequests = [];
  });

  it('shows email verification gate when email is not verified and mail is configured', async () => {
    authStoreMock.user = { emailVerified: false, email: 'john@example.com' };
    authStoreMock.serverConfig = { mail: { configured: true } };

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.vm.emailVerificationRequired).toBe(true);
    expect(wrapper.text()).toContain('Verify your email to continue');
    expect(wrapper.text()).toContain('john@example.com');
  });

  it('does not show email verification gate when email is verified', async () => {
    authStoreMock.user = { emailVerified: true, email: 'john@example.com' };
    authStoreMock.serverConfig = { mail: { configured: true } };

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.vm.emailVerificationRequired).toBe(false);
    expect(wrapper.text()).not.toContain('Verify your email to continue');
  });

  it('does not show email verification gate when mail is not configured', async () => {
    authStoreMock.user = { emailVerified: false, email: 'john@example.com' };
    authStoreMock.serverConfig = { mail: { configured: false } };

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.vm.emailVerificationRequired).toBe(false);
  });

  it('calls resendVerification when resend button is clicked', async () => {
    authStoreMock.user = { emailVerified: false, email: 'john@example.com' };
    authStoreMock.serverConfig = { mail: { configured: true } };
    resendVerificationMock.mockResolvedValueOnce({});

    const wrapper = mountView();
    await flushPromises();

    await wrapper.vm.resendVerification();

    expect(resendVerificationMock).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.resent).toBe(true);
  });

  it('keeps resent false when resend fails', async () => {
    authStoreMock.user = { emailVerified: false, email: 'john@example.com' };
    authStoreMock.serverConfig = { mail: { configured: true } };
    resendVerificationMock.mockRejectedValueOnce(new Error('fail'));

    const wrapper = mountView();
    await flushPromises();

    await wrapper.vm.resendVerification();

    expect(wrapper.vm.resent).toBe(false);
  });
});
