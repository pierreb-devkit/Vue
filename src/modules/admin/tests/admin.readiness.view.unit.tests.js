import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { useAdminStore } from '../stores/admin.store';
import AdminReadiness from '../views/admin.readiness.view.vue';

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
  'v-container': { template: '<div><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-table': { template: '<div><slot /></div>' },
  'v-chip': { template: '<span><slot /></span>' },
  'v-icon': { template: '<i />' },
  'v-progress-linear': { template: '<div data-testid="progress" />' },
};

describe('admin.readiness.view', () => {
  let adminStore;
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    adminStore = useAdminStore();
    adminStore.getReadiness = vi.fn().mockResolvedValue();

    wrapper = shallowMount(AdminReadiness, {
      global: {
        mocks: {
          $router: { push: vi.fn() },
          config: { vuetify: { theme: { flat: true, rounded: 'rounded-lg' } } },
        },
        stubs: vuetifyStubs,
      },
    });
  });

  it('should fetch readiness on mount', () => {
    expect(adminStore.getReadiness).toHaveBeenCalled();
  });

  it('should flip the loading flag around the fetch', async () => {
    let resolveGet;
    adminStore.getReadiness = vi.fn(() => new Promise((r) => { resolveGet = r; }));
    wrapper.vm.fetchReadiness();
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.readinessLoading).toBe(true);
    resolveGet();
    await vi.waitFor(() => expect(wrapper.vm.readinessLoading).toBe(false));
  });

  it('should expose readiness data from the store', () => {
    const mockData = [
      { category: 'config', status: 'ok', message: 'Domain configured' },
      { category: 'security', status: 'warning', message: 'JWT secret is default' },
    ];
    adminStore.readiness = mockData;
    expect(wrapper.vm.readiness).toEqual(mockData);
  });

  it('should have empty readiness by default', () => {
    adminStore.readiness = [];
    expect(wrapper.vm.readiness).toEqual([]);
  });

  it('should map readiness status to icons', () => {
    expect(wrapper.vm.readinessIcon('ok')).toBe('fa-solid fa-circle-check');
    expect(wrapper.vm.readinessIcon('error')).toBe('fa-solid fa-circle-xmark');
    expect(wrapper.vm.readinessIcon('warning')).toBe('fa-solid fa-triangle-exclamation');
    expect(wrapper.vm.readinessIcon('anything-else')).toBe('fa-solid fa-triangle-exclamation');
  });

  it('should map readiness status to colors', () => {
    expect(wrapper.vm.readinessColor('ok')).toBe('success');
    expect(wrapper.vm.readinessColor('error')).toBe('error');
    expect(wrapper.vm.readinessColor('warning')).toBe('warning');
    expect(wrapper.vm.readinessColor('other')).toBe('warning');
  });
});

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

describe('admin.readiness.view — template chrome', () => {
  it('does NOT wrap its template in <v-container> (admin layout owns chrome)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/admin.readiness.view.vue'), 'utf8');
    // Extract only the top-level <template>…</template> block (before <script>)
    const tmpl = sfc.split('<script>')[0] || '';
    expect(tmpl).not.toMatch(/<v-container/);
  });
});
