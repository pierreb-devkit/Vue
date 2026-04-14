import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { useAdminStore } from '../stores/admin.store';
import AdminOrganizations from '../views/admin.organizations.view.vue';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock config
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
    vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
  },
}));

const vuetifyStubs = {
  coreDataTableComponent: true,
  'router-link': { template: '<a><slot /></a>' },
  'v-container': { template: '<div><slot /></div>' },
};

describe('admin.organizations.view', () => {
  let adminStore;
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    adminStore = useAdminStore();
    adminStore.getOrganizations = vi.fn().mockResolvedValue();

    wrapper = shallowMount(AdminOrganizations, {
      global: {
        mocks: {
          $router: { push: vi.fn() },
          config: { vuetify: { theme: { flat: true, rounded: 'rounded-lg' } } },
        },
        stubs: vuetifyStubs,
      },
    });
  });

  it('should expose organizations from the admin store', () => {
    adminStore.organizations = [{ _id: 'o1', name: 'Acme' }];
    expect(wrapper.vm.organizations).toEqual([{ _id: 'o1', name: 'Acme' }]);
  });

  it('should fetch organizations via the store action', async () => {
    await wrapper.vm.fetchOrganizations({ page: 2 });
    expect(adminStore.getOrganizations).toHaveBeenCalledWith({ page: 2 });
  });

  it('should declare the expected organization table headers', () => {
    const headers = wrapper.vm.orgHeaders;
    expect(headers.map((h) => h.value)).toEqual([
      'name',
      'memberCount',
      'domain',
      'plan',
      'createdAt',
    ]);
  });
});
