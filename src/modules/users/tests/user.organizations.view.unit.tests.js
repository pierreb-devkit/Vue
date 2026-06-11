import { describe, it, test, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { shallowMount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import UserOrganizationsView from '../views/user.organizations.view.vue';

// Mock config service
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
  },
}));

vi.mock('../../../lib/helpers/ability', () => ({ updateAbilities: vi.fn() }));
vi.mock('../../../lib/helpers/roleColor', () => ({ default: () => 'primary' }));
vi.mock('../../../lib/helpers/orgColor', () => ({ default: () => 'blue' }));

const sharedStubs = {
  orgAvatarComponent: { template: '<div />' },
  coreConfirmDialog: { template: '<div data-test="core-confirm-dialog" />', name: 'CoreConfirmDialog' },
  'v-container': { template: '<div><slot /></div>' },
  'v-row': { template: '<div><slot /></div>' },
  'v-col': { template: '<div><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-list': { template: '<div><slot /></div>' },
  'v-list-item': { template: '<div><slot /></div>' },
  'v-list-item-title': { template: '<div><slot /></div>' },
  'v-list-item-subtitle': { template: '<div><slot /></div>' },
  'v-divider': { template: '<div />' },
  'v-chip': { template: '<div><slot /></div>' },
  'v-btn': { template: '<button v-bind="$attrs" :to="$attrs.to"><slot /></button>', inheritAttrs: false },
  'v-icon': { template: '<div />' },
  'v-alert': { template: '<div><slot /></div>' },
  'v-snackbar': { template: '<div><slot /><slot name="actions" /></div>' },
};

const sharedMocks = ($router = { push: vi.fn() }) => ({
  $router,
  $route: { path: '/users/organizations' },
  config: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    vuetify: { theme: { rounded: 'rounded-lg', flat: true } },
  },
});

describe('user.organizations.view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('renders the new-org button with data-test="users-orgs-new"', async () => {
    const { useOrganizationsStore } = await import('../../organizations/stores/organizations.store');
    const store = useOrganizationsStore();
    store.fetchOrganizations = vi.fn().mockResolvedValue([]);
    store.fetchMyPendingInvitations = vi.fn().mockResolvedValue([]);

    const wrapper = shallowMount(UserOrganizationsView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    expect(wrapper.find('[data-test="users-orgs-new"]').exists()).toBe(true);
  });

  test('leaveDialog defaults to false', async () => {
    const { useOrganizationsStore } = await import('../../organizations/stores/organizations.store');
    const store = useOrganizationsStore();
    store.fetchOrganizations = vi.fn().mockResolvedValue([]);
    store.fetchMyPendingInvitations = vi.fn().mockResolvedValue([]);

    const wrapper = shallowMount(UserOrganizationsView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    expect(wrapper.vm.leaveDialog).toBe(false);
  });

  test('confirmLeave sets orgToLeave and opens leaveDialog', async () => {
    const { useOrganizationsStore } = await import('../../organizations/stores/organizations.store');
    const store = useOrganizationsStore();
    store.fetchOrganizations = vi.fn().mockResolvedValue([]);
    store.fetchMyPendingInvitations = vi.fn().mockResolvedValue([]);

    const wrapper = shallowMount(UserOrganizationsView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    const org = { id: 'org-1', name: 'Test Org', role: 'member' };
    wrapper.vm.confirmLeave(org);

    expect(wrapper.vm.orgToLeave).toEqual(org);
    expect(wrapper.vm.leaveDialog).toBe(true);
  });

  test('leaveOrg redirects to /organization-required when no orgs remain', async () => {
    const { useOrganizationsStore } = await import('../../organizations/stores/organizations.store');
    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const store = useOrganizationsStore();
    const authStore = useAuthStore();

    store.fetchOrganizations = vi.fn().mockResolvedValue([]);
    store.fetchMyPendingInvitations = vi.fn().mockResolvedValue([]);
    const routerPush = vi.fn();

    const wrapper = shallowMount(UserOrganizationsView, {
      global: {
        mocks: sharedMocks({ push: routerPush }),
        stubs: sharedStubs,
      },
    });

    const orgId = 'org-1';
    wrapper.vm.orgToLeave = { id: orgId, name: 'Only Org' };

    store.leaveOrganization = vi.fn().mockImplementation(() => {
      store.organizations = [];
      return Promise.resolve();
    });
    authStore.refreshAbilities = vi.fn().mockResolvedValue();

    await wrapper.vm.leaveOrg();

    expect(store.leaveOrganization).toHaveBeenCalledWith(orgId);
    expect(routerPush).toHaveBeenCalledWith('/organization-required');
  });
});

describe('user.organizations.view — pending invitations', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('fetches pending invitations on created', async () => {
    const { useOrganizationsStore } = await import('../../organizations/stores/organizations.store');
    const store = useOrganizationsStore();
    store.fetchOrganizations = vi.fn().mockResolvedValue([]);
    const fetchInvites = vi.fn().mockResolvedValue([]);
    store.fetchMyPendingInvitations = fetchInvites;

    shallowMount(UserOrganizationsView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    await Promise.resolve();

    expect(fetchInvites).toHaveBeenCalled();
  });

  test('exposes the store pendingInvitations via computed', async () => {
    const { useOrganizationsStore } = await import('../../organizations/stores/organizations.store');
    const store = useOrganizationsStore();
    store.fetchOrganizations = vi.fn().mockResolvedValue([]);
    store.fetchMyPendingInvitations = vi.fn().mockResolvedValue([]);
    store.pendingInvitations = [{ id: 'inv1', role: 'member', organizationId: { name: 'Acme' } }];

    const wrapper = shallowMount(UserOrganizationsView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });

    expect(wrapper.vm.pendingInvitations).toHaveLength(1);
    expect(wrapper.vm.pendingInvitations[0].organizationId.name).toBe('Acme');
  });

  test('shows the nudge snackbar when invitations exist after fetch', async () => {
    const { useOrganizationsStore } = await import('../../organizations/stores/organizations.store');
    const store = useOrganizationsStore();
    store.fetchOrganizations = vi.fn().mockResolvedValue([]);
    store.fetchMyPendingInvitations = vi.fn().mockImplementation(() => {
      store.pendingInvitations = [{ id: 'inv1', role: 'member', organizationId: { name: 'Acme' } }];
      return Promise.resolve(store.pendingInvitations);
    });

    const wrapper = shallowMount(UserOrganizationsView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(wrapper.vm.nudge).toBe(true);
  });

  test('does not show the nudge snackbar when there are no invitations', async () => {
    const { useOrganizationsStore } = await import('../../organizations/stores/organizations.store');
    const store = useOrganizationsStore();
    store.fetchOrganizations = vi.fn().mockResolvedValue([]);
    store.fetchMyPendingInvitations = vi.fn().mockResolvedValue([]);

    const wrapper = shallowMount(UserOrganizationsView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    await Promise.resolve();

    expect(wrapper.vm.nudge).toBe(false);
  });

  test('acceptInvitation accepts, refreshes orgs + abilities, and re-fetches invitations', async () => {
    const { useOrganizationsStore } = await import('../../organizations/stores/organizations.store');
    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const store = useOrganizationsStore();
    const authStore = useAuthStore();
    store.fetchOrganizations = vi.fn().mockResolvedValue([]);
    store.fetchMyPendingInvitations = vi.fn().mockResolvedValue([]);
    store.acceptMembership = vi.fn().mockResolvedValue({ id: 'inv1', status: 'active' });
    authStore.refreshAbilities = vi.fn().mockResolvedValue();

    const wrapper = shallowMount(UserOrganizationsView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });

    await wrapper.vm.acceptInvitation({ id: 'inv1', role: 'member', organizationId: { name: 'Acme' } });

    expect(store.acceptMembership).toHaveBeenCalledWith('inv1');
    // Abilities still refresh on the success path so the new org's permissions apply.
    expect(authStore.refreshAbilities).toHaveBeenCalled();
    expect(store.fetchOrganizations).toHaveBeenCalled();
    // initial mount + post-accept refresh
    expect(store.fetchMyPendingInvitations.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  test('acceptInvitation tolerates a refreshAbilities failure (no surprise-logout; orgs + pending still refresh)', async () => {
    // The membership is accepted server-side regardless. A mid-chain abilities
    // hiccup (refreshAbilities signs out + throws) must NOT abort the UI reflection
    // of the accept, nor surprise-logout the user right after a successful accept.
    const { useOrganizationsStore } = await import('../../organizations/stores/organizations.store');
    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const store = useOrganizationsStore();
    const authStore = useAuthStore();
    store.fetchOrganizations = vi.fn().mockResolvedValue([]);
    store.fetchMyPendingInvitations = vi.fn().mockResolvedValue([]);
    store.acceptMembership = vi.fn().mockResolvedValue({ id: 'inv1', status: 'active' });
    authStore.refreshAbilities = vi.fn().mockRejectedValue(new Error('abilities endpoint hiccup'));

    const wrapper = shallowMount(UserOrganizationsView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    store.fetchOrganizations.mockClear();
    store.fetchMyPendingInvitations.mockClear();

    // Must not throw out of the flow despite refreshAbilities rejecting.
    await expect(
      wrapper.vm.acceptInvitation({ id: 'inv1', role: 'member', organizationId: { name: 'Acme' } }),
    ).resolves.toBeUndefined();

    expect(store.acceptMembership).toHaveBeenCalledWith('inv1');
    expect(authStore.refreshAbilities).toHaveBeenCalled();
    // The accept is reflected in the UI even though abilities failed.
    expect(store.fetchOrganizations).toHaveBeenCalled();
    expect(store.fetchMyPendingInvitations).toHaveBeenCalled();
    expect(wrapper.vm.acceptingId).toBeNull();
  });

  test('acceptInvitation dismisses the login nudge on success', async () => {
    const { useOrganizationsStore } = await import('../../organizations/stores/organizations.store');
    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const store = useOrganizationsStore();
    const authStore = useAuthStore();
    store.fetchOrganizations = vi.fn().mockResolvedValue([]);
    store.fetchMyPendingInvitations = vi.fn().mockResolvedValue([]);
    store.acceptMembership = vi.fn().mockResolvedValue({ id: 'inv1', status: 'active' });
    authStore.refreshAbilities = vi.fn().mockResolvedValue();

    const wrapper = shallowMount(UserOrganizationsView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    wrapper.vm.nudge = true;

    await wrapper.vm.acceptInvitation({ id: 'inv1', role: 'member', organizationId: { name: 'Acme' } });

    expect(wrapper.vm.nudge).toBe(false);
  });

  test('invitationOrgName + invitationRole helpers read the populated membership', async () => {
    const { useOrganizationsStore } = await import('../../organizations/stores/organizations.store');
    const store = useOrganizationsStore();
    store.fetchOrganizations = vi.fn().mockResolvedValue([]);
    store.fetchMyPendingInvitations = vi.fn().mockResolvedValue([]);

    const wrapper = shallowMount(UserOrganizationsView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });

    const inv = { id: 'inv1', role: 'admin', organizationId: { name: 'Acme Corp' } };
    expect(wrapper.vm.invitationOrgName(inv)).toBe('Acme Corp');
    expect(wrapper.vm.invitationRole(inv)).toBe('admin');
    expect(wrapper.vm.invitationOrgName({ id: 'x' })).toBe('an organization');
  });
});

describe('user.organizations.view — template chrome', () => {
  it('wraps content in <v-row class="pa-2 mt-0"> + <v-col cols="12"> + <v-card color="surface">', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/user.organizations.view.vue'), 'utf8');
    const tmpl = sfc.split('<script>')[0];
    expect(tmpl).toMatch(/<v-row[^>]*class="[^"]*pa-2\s+mt-0/);
    expect(tmpl).toMatch(/<v-col\s+cols="12"/);
    expect(tmpl).toMatch(/<v-card[^>]*color="surface"/);
  });
});

describe('user.organizations.view — confirm dialog', () => {
  it('uses coreConfirmDialog for Leave Org (no inline v-dialog)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/user.organizations.view.vue'), 'utf8');
    const tmpl = sfc.split('<script>')[0];
    expect(tmpl).toMatch(/<coreConfirmDialog/);
    expect(tmpl).not.toMatch(/<v-dialog/);
  });
});
