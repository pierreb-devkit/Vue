import { describe, test, expect, vi, beforeEach } from 'vitest';
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
  'v-container': { template: '<div><slot /></div>' },
  'v-list': { template: '<div><slot /></div>' },
  'v-list-item': { template: '<div><slot /></div>' },
  'v-list-item-title': { template: '<div><slot /></div>' },
  'v-list-item-subtitle': { template: '<div><slot /></div>' },
  'v-divider': { template: '<div />' },
  'v-chip': { template: '<div><slot /></div>' },
  'v-btn': { template: '<button v-bind="$attrs" :to="$attrs.to"><slot /></button>', inheritAttrs: false },
  'v-icon': { template: '<div />' },
  'v-dialog': { template: '<div><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-card-actions': { template: '<div><slot /></div>' },
  'v-spacer': { template: '<div />' },
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
