import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { useOrganizationsStore } from '../../organizations/stores/organizations.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useBillingStore } from '../../billing/stores/billing.store';
import UserView from '../views/user.view.vue';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock config
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
  },
}));

// Mock helpers
vi.mock('../../../lib/helpers/roleColor', () => ({ default: () => 'primary' }));
vi.mock('../../../lib/helpers/orgColor', () => ({ default: () => 'blue' }));
vi.mock('../../../lib/helpers/ability', () => ({ updateAbilities: vi.fn() }));

describe('UserView – leaveOrg redirect behaviour', () => {
  let organizationsStore;
  let authStore;
  let routerPush;
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    organizationsStore = useOrganizationsStore();
    authStore = useAuthStore();

    // Stub fetchOrganizations so the created() hook does not hit the network
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);

    routerPush = vi.fn();

    wrapper = shallowMount(UserView, {
      global: {
        mocks: {
          $router: { push: routerPush },
          config: {
            api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
            vuetify: { theme: { flat: true, rounded: 'rounded' } },
          },
        },
        stubs: {
          PageHeader: true,
          userProfileComponent: true,
          organizationsSwitcherComponent: true,
          'v-container': { template: '<div><slot /></div>' },
          'v-row': { template: '<div><slot /></div>' },
          'v-col': { template: '<div><slot /></div>' },
          'v-card': { template: '<div><slot /></div>' },
          'v-tabs': { template: '<div><slot /></div>' },
          'v-tab': { template: '<div><slot /></div>' },
          'v-divider': { template: '<div />' },
          'v-window': { template: '<div><slot /></div>' },
          'v-window-item': { template: '<div><slot /></div>' },
          'v-list': { template: '<div><slot /></div>' },
          'v-list-item': { template: '<div><slot /></div>' },
          'v-list-item-title': { template: '<div><slot /></div>' },
          'v-list-item-subtitle': { template: '<div><slot /></div>' },
          'v-avatar': { template: '<div><slot /></div>' },
          'v-chip': { template: '<div><slot /></div>' },
          'v-btn': { template: '<div><slot /></div>' },
          'v-icon': { template: '<div />' },
          'v-dialog': { template: '<div><slot /></div>' },
          'v-card-title': { template: '<div><slot /></div>' },
          'v-card-text': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          'v-spacer': { template: '<div />' },
          'v-text-field': { template: '<div />' },
        },
      },
    });
  });

  it('should redirect to /organization-required when 0 orgs remain after leaving', async () => {
    // Set up: user is leaving the only org they belong to
    const orgId = 'org-1';
    wrapper.vm.orgToLeave = { id: orgId, name: 'Only Org' };

    // Stub leaveOrganization so that after call, organizations is empty
    organizationsStore.leaveOrganization = vi.fn().mockImplementation(() => {
      organizationsStore.organizations = [];
      return Promise.resolve();
    });
    authStore.refreshAbilities = vi.fn().mockResolvedValue();

    await wrapper.vm.leaveOrg();

    expect(organizationsStore.leaveOrganization).toHaveBeenCalledWith(orgId);
    expect(routerPush).toHaveBeenCalledWith('/organization-required');
  });

  it('should call switchOrganization on first remaining org when currentOrganization is null after leaving', async () => {
    const orgId = 'org-leave';
    const remainingOrg = { id: 'org-remain', name: 'Remaining Org' };
    wrapper.vm.orgToLeave = { id: orgId, name: 'Leaving Org' };

    // After leaving, one org remains but currentOrganization is null
    organizationsStore.leaveOrganization = vi.fn().mockImplementation(() => {
      organizationsStore.organizations = [remainingOrg];
      organizationsStore.currentOrganization = null;
      return Promise.resolve();
    });
    organizationsStore.switchOrganization = vi.fn().mockResolvedValue();
    authStore.refreshAbilities = vi.fn().mockResolvedValue();

    await wrapper.vm.leaveOrg();

    expect(organizationsStore.leaveOrganization).toHaveBeenCalledWith(orgId);
    expect(organizationsStore.switchOrganization).toHaveBeenCalledWith(remainingOrg.id);
    expect(routerPush).not.toHaveBeenCalled();
  });
});

// ── UserView – showBillingLink computed ──────────────────────────────────────

describe('UserView – showBillingLink', () => {
  let authStore;
  let billingStore;

  /**
   * @desc Helper to mount UserView for showBillingLink tests.
   * @param {Object} serverConfig - Auth store serverConfig
   * @param {Object|null} subscription - Billing store subscription
   * @returns {import('@vue/test-utils').VueWrapper}
   */
  const mountForBilling = (serverConfig, subscription = null) => {
    authStore.serverConfig = serverConfig;
    billingStore.subscription = subscription;

    return shallowMount(UserView, {
      global: {
        mocks: {
          $router: { push: vi.fn() },
          config: {
            api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
            vuetify: { theme: { flat: true, rounded: 'rounded' } },
          },
        },
        stubs: {
          PageHeader: true,
          userProfileComponent: true,
          organizationsSwitcherComponent: true,
          orgAvatarComponent: true,
          'v-container': { template: '<div><slot /></div>' },
          'v-row': { template: '<div><slot /></div>' },
          'v-col': { template: '<div><slot /></div>' },
          'v-card': { template: '<div><slot /></div>' },
          'v-tabs': { template: '<div><slot /></div>' },
          'v-tab': { template: '<div><slot /></div>' },
          'v-divider': { template: '<div />' },
          'v-window': { template: '<div><slot /></div>' },
          'v-window-item': { template: '<div><slot /></div>' },
          'v-list': { template: '<div><slot /></div>' },
          'v-list-item': { template: '<div><slot /></div>' },
          'v-list-item-title': { template: '<div><slot /></div>' },
          'v-list-item-subtitle': { template: '<div><slot /></div>' },
          'v-avatar': { template: '<div><slot /></div>' },
          'v-chip': { template: '<div><slot /></div>' },
          'v-btn': { template: '<div><slot /></div>' },
          'v-icon': { template: '<div />' },
          'v-dialog': { template: '<div><slot /></div>' },
          'v-card-title': { template: '<div><slot /></div>' },
          'v-card-text': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          'v-spacer': { template: '<div />' },
          'v-text-field': { template: '<div />' },
        },
      },
    });
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    billingStore = useBillingStore();

    const organizationsStore = useOrganizationsStore();
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);
  });

  it('showBillingLink is true when billing enabled and meterMode is true', () => {
    const wrapper = mountForBilling({ billing: { enabled: true, meterMode: true } });
    expect(wrapper.vm.showBillingLink).toBe(true);
  });

  it('showBillingLink is true when billing enabled and user has active subscription', () => {
    const wrapper = mountForBilling(
      { billing: { enabled: true, meterMode: false } },
      { status: 'active', plan: 'starter' },
    );
    expect(wrapper.vm.showBillingLink).toBe(true);
  });

  it('showBillingLink is false when billing disabled', () => {
    const wrapper = mountForBilling({ billing: { enabled: false, meterMode: true } });
    expect(wrapper.vm.showBillingLink).toBe(false);
  });

  it('showBillingLink is false when billing not configured', () => {
    const wrapper = mountForBilling(null);
    expect(wrapper.vm.showBillingLink).toBe(false);
  });

  it('showBillingLink is false when billing enabled but meterMode false and no subscription', () => {
    const wrapper = mountForBilling({ billing: { enabled: true, meterMode: false } }, null);
    expect(wrapper.vm.showBillingLink).toBe(false);
  });
});
