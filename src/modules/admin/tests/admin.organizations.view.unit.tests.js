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
    await wrapper.vm.fetchOrganizations('0&10&acme');
    expect(adminStore.getOrganizations).toHaveBeenCalledWith('0&10&acme');
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

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

describe('admin.organizations.view — template chrome', () => {
  it('wraps its template in <v-container fluid> + <v-row class="pa-2 mt-0"> + <v-col cols="12">', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/admin.organizations.view.vue'), 'utf8');
    const tmpl = sfc.split('<script>')[0];
    expect(tmpl).toMatch(/<v-container\s+fluid/);
    expect(tmpl).toMatch(/<v-row[^>]*class="[^"]*pa-2\s+mt-0/);
    expect(tmpl).toMatch(/<v-col\s+cols="12"/);
  });
});
