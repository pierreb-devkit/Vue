import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { useAdminStore } from '../stores/admin.store';
import AdminView from '../views/admin.content.vue';

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
    whitelists: { users: { roles: ['user', 'admin'] } },
  },
}));

// Mock helpers
vi.mock('../../../lib/helpers/roleColor', () => ({ default: () => 'primary' }));
vi.mock('../../../lib/helpers/orgColor', () => ({ default: () => 'blue' }));

const vuetifyStubs = {
  PageHeader: true,
  coreDataTableComponent: true,
  'router-link': { template: '<a><slot /></a>' },
  'v-container': { template: '<div><slot /></div>' },
  'v-row': { template: '<div><slot /></div>' },
  'v-col': { template: '<div><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-tabs': { template: '<div><slot /></div>' },
  'v-tab': { template: '<div><slot /></div>' },
  'v-divider': { template: '<div />' },
  'v-window': { template: '<div><slot /></div>' },
  'v-window-item': { template: '<div><slot /></div>' },
  'v-table': { template: '<div><slot /></div>' },
  'v-chip': { template: '<span><slot /></span>' },
  'v-icon': { template: '<i />' },
  'v-progress-linear': { template: '<div data-testid="progress" />' },
  'v-btn': { template: '<div><slot /></div>' },
  'v-menu': { template: '<div><slot /></div>' },
  'v-list': { template: '<div><slot /></div>' },
  'v-list-subheader': { template: '<div><slot /></div>' },
  'v-list-item': { template: '<div><slot /></div>' },
  'v-list-item-title': { template: '<div><slot /></div>' },
  'v-alert': { template: '<div><slot /></div>' },
  'v-text-field': { template: '<input />' },
  'v-select': { template: '<select />' },
  'v-empty-state': { template: '<div />' },
  'v-dialog': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-card-actions': { template: '<div><slot /></div>' },
  'v-spacer': { template: '<div />' },
};

describe('AdminView – Readiness tab', () => {
  let adminStore;
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    adminStore = useAdminStore();
    adminStore.getReadiness = vi.fn().mockResolvedValue();

    wrapper = shallowMount(AdminView, {
      global: {
        mocks: {
          $router: { push: vi.fn() },
          config: {
            vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
            whitelists: { users: { roles: ['user', 'admin'] } },
          },
        },
        stubs: vuetifyStubs,
      },
    });
  });

  it('should render the Readiness tab', () => {
    const html = wrapper.html();
    expect(html).toContain('Readiness');
  });

  it('should show loading state while fetching readiness', async () => {
    let resolveGet;
    adminStore.getReadiness = vi.fn(() => new Promise((r) => { resolveGet = r; }));

    wrapper.vm.tab = 'readiness';
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.readinessLoading).toBe(true);

    resolveGet();
    await vi.waitFor(() => expect(wrapper.vm.readinessLoading).toBe(false));
  });

  it('should fetch readiness when tab is switched to readiness', async () => {
    wrapper.vm.tab = 'readiness';
    await wrapper.vm.$nextTick();

    expect(adminStore.getReadiness).toHaveBeenCalled();
  });

  it('should expose readiness data from store', async () => {
    const mockData = [
      { category: 'config', status: 'ok', message: 'Domain configured' },
      { category: 'security', status: 'warning', message: 'JWT secret is default' },
    ];
    adminStore.readiness = mockData;

    expect(wrapper.vm.readiness).toEqual(mockData);
    expect(wrapper.vm.readiness).toHaveLength(2);
    expect(wrapper.vm.readiness[0].status).toBe('ok');
    expect(wrapper.vm.readiness[1].status).toBe('warning');
  });

  it('should have empty readiness by default', () => {
    expect(wrapper.vm.readiness).toEqual([]);
  });
});
