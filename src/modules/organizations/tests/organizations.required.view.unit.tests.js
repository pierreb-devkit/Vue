import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const resendVerificationMock = vi.hoisted(() => vi.fn().mockResolvedValue());
const refreshAbilitiesMock = vi.hoisted(() => vi.fn().mockResolvedValue());
const signoutMock = vi.hoisted(() => vi.fn().mockResolvedValue());
const tokenMock = vi.hoisted(() => vi.fn().mockResolvedValue());
const authStoreMock = vi.hoisted(() => ({
  isLoggedIn: true,
  user: null,
  serverConfig: null,
  pendingRequests: [],
  resendVerification: resendVerificationMock,
  refreshAbilities: refreshAbilitiesMock,
  signout: signoutMock,
  token: tokenMock,
}));

vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => authStoreMock,
}));

const searchDomainMock = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const createJoinRequestMock = vi.hoisted(() => vi.fn().mockResolvedValue());
const fetchMyPendingInvitationsMock = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const acceptMembershipMock = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const organizationsStoreMock = vi.hoisted(() => ({
  pendingInvitations: [],
  searchOrganizationsByDomain: searchDomainMock,
  createJoinRequest: createJoinRequestMock,
  fetchMyPendingInvitations: fetchMyPendingInvitationsMock,
  acceptMembership: acceptMembershipMock,
}));
vi.mock('../stores/organizations.store', () => ({
  useOrganizationsStore: () => organizationsStoreMock,
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

describe('organizations.required.view — D3 recovery copy', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    searchDomainMock.mockReset().mockResolvedValue([]);
    refreshAbilitiesMock.mockReset().mockResolvedValue();
    signoutMock.mockReset().mockResolvedValue();
    authStoreMock.user = { emailVerified: true, email: 'test@example.com' };
    authStoreMock.serverConfig = { mail: { configured: false } };
    authStoreMock.pendingRequests = [];
  });

  it('shows recovery heading "No workspace found"', async () => {
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.text()).toContain('No workspace found');
  });

  it('shows recovery intro containing "not a member of any workspace"', async () => {
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.vm.$el.textContent).toContain('not a member of any workspace');
  });

  it('does NOT contain old onboarding heading "Organization Required"', async () => {
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.vm.$el.textContent).not.toContain('Organization Required');
  });

  it('does NOT contain old onboarding intro "You need to belong to an organization"', async () => {
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.vm.$el.textContent).not.toContain('You need to belong to an organization');
  });

  it('interactive surface — create-organization route link is present', async () => {
    const wrapper = mountView();
    await flushPromises();

    // The "Create an organization" v-btn renders with to="/users/organizations/create"
    // May not be a DOM href in test env; verify text instead
    expect(wrapper.text()).toContain('Create an organization');
  });

  it('interactive surface — sign-out link is present', async () => {
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.text()).toContain('Sign out');
  });

  it('interactive surface — request-to-join rendered when domain orgs present', async () => {
    searchDomainMock.mockResolvedValueOnce([{ _id: 'org1', name: 'Acme Corp' }]);

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.text()).toContain('Request to join');
  });

  it('interactive surface — check-status button rendered when pending request present', async () => {
    authStoreMock.pendingRequests = [{ organizationId: { _id: 'org1', name: 'Acme Corp' } }];
    searchDomainMock.mockResolvedValueOnce([]);

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.text()).toContain('Check status');
  });
});

describe('organizations.required.view — pending owner_add invitations', () => {
  /**
   * Mount the wall with an observable router push.
   * @param {Function} [routerPush] - Spy for $router.push.
   * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
   */
  const mountWall = (routerPush = vi.fn()) =>
    mount(OrganizationsRequiredView, {
      global: {
        plugins: [createVuetify()],
        mocks: { config: mockConfig, $route: { query: {} }, $router: { push: routerPush } },
        stubs: { RouterLink: true },
      },
    });

  beforeEach(() => {
    setActivePinia(createPinia());
    searchDomainMock.mockReset().mockResolvedValue([]);
    fetchMyPendingInvitationsMock.mockReset().mockResolvedValue([]);
    acceptMembershipMock.mockReset().mockResolvedValue({});
    refreshAbilitiesMock.mockReset().mockResolvedValue();
    tokenMock.mockReset().mockResolvedValue();
    organizationsStoreMock.pendingInvitations = [];
    authStoreMock.user = { emailVerified: true, email: 'test@example.com' };
    authStoreMock.serverConfig = { mail: { configured: false } };
    authStoreMock.pendingRequests = [];
  });

  it('fetches pending invitations on created', async () => {
    mountWall();
    await flushPromises();
    expect(fetchMyPendingInvitationsMock).toHaveBeenCalledTimes(1);
  });

  it('renders an invitation row with org name, role chip and Accept button', async () => {
    organizationsStoreMock.pendingInvitations = [
      { id: 'inv1', role: 'admin', organizationId: { name: 'Acme Corp' } },
    ];
    const wrapper = mountWall();
    await flushPromises();
    const block = wrapper.find('[data-test="wall-pending-invitations"]');
    expect(block.exists()).toBe(true);
    expect(block.text()).toContain('Acme Corp');
    expect(block.text()).toContain('admin');
    expect(wrapper.find('[data-test="wall-accept-invitation-inv1"]').exists()).toBe(true);
  });

  it('renders a See My Organizations link routing to /users/organizations', async () => {
    organizationsStoreMock.pendingInvitations = [
      { id: 'inv1', role: 'member', organizationId: { name: 'Acme Corp' } },
    ];
    const routerPush = vi.fn();
    const wrapper = mountWall(routerPush);
    await flushPromises();
    const link = wrapper.find('[data-test="wall-see-organizations"]');
    expect(link.exists()).toBe(true);
    expect(wrapper.text()).toContain('See My Organizations');
    await link.trigger('click');
    expect(routerPush).toHaveBeenCalledWith('/users/organizations');
  });

  it('hides the block when there are no pending invitations', async () => {
    const wrapper = mountWall();
    await flushPromises();
    expect(wrapper.find('[data-test="wall-pending-invitations"]').exists()).toBe(false);
  });

  it('accept: accepts, soft-refreshes via token(), and redirects when currentOrganization appears', async () => {
    organizationsStoreMock.pendingInvitations = [
      { id: 'inv1', role: 'member', organizationId: { name: 'Acme Corp' } },
    ];
    tokenMock.mockImplementation(async () => {
      authStoreMock.user = { ...authStoreMock.user, currentOrganization: 'org1' };
    });
    const routerPush = vi.fn();
    const wrapper = mountWall(routerPush);
    await flushPromises();
    await wrapper.vm.acceptInvitation({ id: 'inv1', role: 'member', organizationId: { name: 'Acme Corp' } });
    expect(acceptMembershipMock).toHaveBeenCalledWith('inv1');
    expect(tokenMock).toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith('/tasks');
  });

  it('accept without a resulting currentOrganization refreshes the pending list and stays on the wall', async () => {
    organizationsStoreMock.pendingInvitations = [
      { id: 'inv1', role: 'member', organizationId: { name: 'Acme Corp' } },
    ];
    const routerPush = vi.fn();
    const wrapper = mountWall(routerPush);
    await flushPromises();
    fetchMyPendingInvitationsMock.mockClear();
    await wrapper.vm.acceptInvitation({ id: 'inv1', role: 'member', organizationId: { name: 'Acme Corp' } });
    expect(fetchMyPendingInvitationsMock).toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });
});
