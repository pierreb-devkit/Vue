import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { useOrganizationsStore } from '../../organizations/stores/organizations.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import BillingAccountView from '../views/billing.account.view.vue';

// ─── Module mocks ────────────────────────────────────────────────────────────

vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
  },
}));

vi.mock('../../../lib/helpers/roleColor', () => ({ default: () => 'primary' }));
vi.mock('../../../lib/helpers/orgColor', () => ({ default: () => 'blue' }));
vi.mock('../../../lib/helpers/ability', () => ({ updateAbilities: vi.fn() }));

// ─── Stubs ───────────────────────────────────────────────────────────────────

const sharedStubs = {
  'v-container': { template: '<div><slot /></div>' },
  'v-row': { template: '<div><slot /></div>' },
  'v-col': { template: '<div><slot /></div>' },
  'v-card': { template: '<div data-stub="v-card"><slot /></div>' },
  'v-list': { template: '<div><slot /></div>' },
  'v-list-item': { template: '<div><slot /></div>' },
  'v-list-item-title': { template: '<div><slot /></div>' },
  'v-list-item-subtitle': { template: '<div><slot /></div>' },
  'v-btn': { template: '<div><slot /></div>' },
  'v-chip': { template: '<span><slot /></span>' },
  'v-icon': { template: '<i />' },
  'v-progress-circular': { template: '<div />' },
  'v-divider': { template: '<hr />' },
  PageHeader: true,
};

/**
 * @desc Build shared mock options for shallowMount.
 * @param {Object} $router
 * @param {Object} $route
 * @returns {Object}
 */
const sharedMocks = ($router = { replace: vi.fn(), push: vi.fn() }, $route = { query: {}, hash: '' }) => ({
  $router,
  $route,
  $t: (key) => key,
  config: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    vuetify: { theme: { flat: true, rounded: 'rounded' } },
  },
});

// ─── Branch 1: single manageable org → redirect ──────────────────────────────

describe('BillingAccountView – single manageable org → redirect', () => {
  let organizationsStore;
  let authStore;
  let routerReplace;

  beforeEach(() => {
    setActivePinia(createPinia());
    organizationsStore = useOrganizationsStore();
    authStore = useAuthStore();
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);
    routerReplace = vi.fn();
  });

  it('calls router.replace with the org billing route when exactly one manageable org exists', async () => {
    const orgId = 'org-abc';
    organizationsStore.organizations = [{ id: orgId, name: 'Acme', role: 'owner' }];
    authStore.serverConfig = { billing: { enabled: true } };

    shallowMount(BillingAccountView, {
      global: {
        mocks: sharedMocks({ replace: routerReplace }),
        stubs: sharedStubs,
      },
    });

    // Flush microtasks so mounted() / immediate-watch resolves
    await new Promise((r) => setTimeout(r, 0));

    expect(routerReplace).toHaveBeenCalledWith(`/users/organizations/${orgId}/billing`);
  });

  it('redirects using _id when id is absent', async () => {
    const orgId = 'org-xyz';
    organizationsStore.organizations = [{ _id: orgId, name: 'Beta', role: 'admin' }];
    authStore.serverConfig = { billing: { enabled: true } };

    shallowMount(BillingAccountView, {
      global: {
        mocks: sharedMocks({ replace: routerReplace }),
        stubs: sharedStubs,
      },
    });

    await new Promise((r) => setTimeout(r, 0));

    expect(routerReplace).toHaveBeenCalledWith(`/users/organizations/${orgId}/billing`);
  });

  it('ignores member-only orgs when finding the single manageable org', async () => {
    const adminOrgId = 'org-owner';
    organizationsStore.organizations = [
      { id: 'org-member', name: 'MemberOrg', role: 'member' },
      { id: adminOrgId, name: 'OwnerOrg', role: 'owner' },
    ];
    authStore.serverConfig = { billing: { enabled: true } };

    shallowMount(BillingAccountView, {
      global: {
        mocks: sharedMocks({ replace: routerReplace }),
        stubs: sharedStubs,
      },
    });

    await new Promise((r) => setTimeout(r, 0));

    // Only 1 manageable org → redirect directly to it
    expect(routerReplace).toHaveBeenCalledWith(`/users/organizations/${adminOrgId}/billing`);
  });
});

// ─── Branch 2: multiple manageable orgs → selector ───────────────────────────

describe('BillingAccountView – multiple manageable orgs → selector', () => {
  let organizationsStore;
  let authStore;
  let routerReplace;

  beforeEach(() => {
    setActivePinia(createPinia());
    organizationsStore = useOrganizationsStore();
    authStore = useAuthStore();
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);
    routerReplace = vi.fn();
  });

  it('does NOT call router.replace when there are 2+ manageable orgs', async () => {
    organizationsStore.organizations = [
      { id: 'org-a', name: 'Alpha', role: 'owner' },
      { id: 'org-b', name: 'Beta', role: 'admin' },
    ];
    authStore.serverConfig = { billing: { enabled: true } };

    shallowMount(BillingAccountView, {
      global: {
        mocks: sharedMocks({ replace: routerReplace }),
        stubs: sharedStubs,
      },
    });

    await new Promise((r) => setTimeout(r, 0));

    expect(routerReplace).not.toHaveBeenCalled();
  });

  it('exposes manageableOrgs with both orgs when user has owner+admin roles', () => {
    const orgs = [
      { id: 'org-a', name: 'Alpha', role: 'owner' },
      { id: 'org-b', name: 'Beta', role: 'admin' },
    ];
    organizationsStore.organizations = orgs;
    authStore.serverConfig = { billing: { enabled: true } };

    const wrapper = shallowMount(BillingAccountView, {
      global: {
        mocks: sharedMocks({ replace: routerReplace }),
        stubs: sharedStubs,
      },
    });

    expect(wrapper.vm.manageableOrgs).toHaveLength(2);
    expect(wrapper.vm.manageableOrgs.map((o) => o.id || o._id)).toContain('org-a');
    expect(wrapper.vm.manageableOrgs.map((o) => o.id || o._id)).toContain('org-b');
  });

  it('renders an org billing link for each manageable org', () => {
    organizationsStore.organizations = [
      { id: 'org-a', name: 'Alpha', role: 'owner' },
      { id: 'org-b', name: 'Beta', role: 'admin' },
    ];
    authStore.serverConfig = { billing: { enabled: true } };

    const wrapper = shallowMount(BillingAccountView, {
      global: {
        mocks: sharedMocks({ replace: routerReplace }),
        stubs: sharedStubs,
      },
    });

    const html = wrapper.html();
    expect(html).toContain('/users/organizations/org-a/billing');
    expect(html).toContain('/users/organizations/org-b/billing');
  });

  it('manageableOrgs exposes role for each org (owner/admin)', () => {
    organizationsStore.organizations = [
      { id: 'org-a', name: 'Alpha Corp', role: 'owner' },
      { id: 'org-b', name: 'Beta Inc', role: 'admin' },
    ];
    authStore.serverConfig = { billing: { enabled: true } };

    const wrapper = shallowMount(BillingAccountView, {
      global: {
        mocks: sharedMocks({ replace: routerReplace }),
        stubs: sharedStubs,
      },
    });

    const roles = wrapper.vm.manageableOrgs.map((o) => o.role);
    expect(roles).toContain('owner');
    expect(roles).toContain('admin');
  });

  it('includes member orgs in total but not in manageableOrgs', () => {
    organizationsStore.organizations = [
      { id: 'org-a', name: 'Alpha', role: 'owner' },
      { id: 'org-b', name: 'Beta', role: 'admin' },
      { id: 'org-c', name: 'Gamma', role: 'member' },
    ];
    authStore.serverConfig = { billing: { enabled: true } };

    const wrapper = shallowMount(BillingAccountView, {
      global: {
        mocks: sharedMocks({ replace: routerReplace }),
        stubs: sharedStubs,
      },
    });

    expect(wrapper.vm.manageableOrgs).toHaveLength(2);
    expect(wrapper.vm.manageableOrgs.some((o) => o.id === 'org-c')).toBe(false);
  });
});

// ─── Branch 3: no manageable org → read-only "ask admin" ─────────────────────

describe('BillingAccountView – non-admin / no manageable org → read-only', () => {
  let organizationsStore;
  let authStore;
  let routerReplace;

  beforeEach(() => {
    setActivePinia(createPinia());
    organizationsStore = useOrganizationsStore();
    authStore = useAuthStore();
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);
    routerReplace = vi.fn();
  });

  it('does NOT call router.replace when user has no manageable org', async () => {
    organizationsStore.organizations = [{ id: 'org-m', name: 'Member Org', role: 'member' }];
    authStore.serverConfig = { billing: { enabled: true } };

    shallowMount(BillingAccountView, {
      global: {
        mocks: sharedMocks({ replace: routerReplace }),
        stubs: sharedStubs,
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it('shows "ask your organization admin" message when no manageable org', () => {
    organizationsStore.organizations = [{ id: 'org-m', name: 'Member Org', role: 'member' }];
    authStore.serverConfig = { billing: { enabled: true } };

    const wrapper = shallowMount(BillingAccountView, {
      global: {
        mocks: sharedMocks({ replace: routerReplace }),
        stubs: sharedStubs,
      },
    });

    const html = wrapper.html();
    // Must contain a message directing user to contact their admin
    expect(html.toLowerCase()).toMatch(/admin|organization admin/);
  });

  it('shows read-only state when organization list is empty', async () => {
    organizationsStore.organizations = [];
    authStore.serverConfig = { billing: { enabled: true } };

    shallowMount(BillingAccountView, {
      global: {
        mocks: sharedMocks({ replace: routerReplace }),
        stubs: sharedStubs,
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it('manageableOrgs is empty when all orgs are member-only', () => {
    organizationsStore.organizations = [
      { id: 'org-a', name: 'Alpha', role: 'member' },
      { id: 'org-b', name: 'Beta', role: 'member' },
    ];

    const wrapper = shallowMount(BillingAccountView, {
      global: {
        mocks: sharedMocks({ replace: routerReplace }),
        stubs: sharedStubs,
      },
    });

    expect(wrapper.vm.manageableOrgs).toHaveLength(0);
  });
});

// ─── billing.account.view does NOT import BillingSubscriptionsComponent ───────

describe('BillingAccountView – no billing.subscriptions coupling', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const organizationsStore = useOrganizationsStore();
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);
  });

  it('does not render BillingSubscriptionsComponent', () => {
    const organizationsStore = useOrganizationsStore();
    organizationsStore.organizations = [{ id: 'o1', role: 'owner', name: 'Acme' }];

    const wrapper = shallowMount(BillingAccountView, {
      global: {
        mocks: sharedMocks(),
        stubs: { ...sharedStubs, BillingSubscriptionsComponent: { template: '<div data-billing-subs />' } },
      },
    });

    // BillingSubscriptionsComponent must not appear in the rendered output
    expect(wrapper.html()).not.toContain('data-billing-subs');
  });
});
