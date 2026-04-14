import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { useAdminStore } from '../stores/admin.store';
import AdminActivity from '../views/admin.activity.view.vue';

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
  'v-alert': { template: '<div><slot /></div>' },
  'v-table': { template: '<div><slot /></div>' },
  'v-chip': { template: '<span><slot /></span>' },
  'v-icon': { template: '<i />' },
  'v-progress-linear': { template: '<div data-testid="progress" />' },
  'v-btn': { template: '<div><slot /></div>' },
  'v-text-field': { template: '<input />' },
  'v-select': { template: '<select />' },
};

/**
 * Mount the activity view with the given config.
 * @param {object} [config] - config object (merged with vuetify defaults)
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountActivity = (config = {}) =>
  shallowMount(AdminActivity, {
    global: {
      mocks: {
        $router: { push: vi.fn() },
        config: {
          vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
          ...config,
        },
      },
      stubs: vuetifyStubs,
    },
  });

describe('admin.activity.view', () => {
  let adminStore;
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    adminStore = useAdminStore();
    adminStore.getAuditLogs = vi.fn().mockResolvedValue();
    wrapper = mountActivity();
  });

  it('should fetch activity logs on mount', () => {
    expect(adminStore.getAuditLogs).toHaveBeenCalled();
  });

  it('should show loading state while fetching activity logs', async () => {
    let resolveGet;
    adminStore.getAuditLogs = vi.fn(() => new Promise((r) => { resolveGet = r; }));
    wrapper.vm.fetchActivityLogs();
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.activityLoading).toBe(true);
    resolveGet();
    await vi.waitFor(() => expect(wrapper.vm.activityLoading).toBe(false));
  });

  it('should expose audit logs data from the store', () => {
    const mockData = [
      { _id: '1', action: 'auth.login', userId: 'u1', ip: '127.0.0.1' },
      { _id: '2', action: 'auth.logout', userId: 'u2', ip: '127.0.0.2' },
    ];
    adminStore.auditLogs = mockData;
    expect(wrapper.vm.auditLogs).toEqual(mockData);
    expect(wrapper.vm.auditLogs).toHaveLength(2);
  });

  it('should have empty audit logs by default', () => {
    adminStore.auditLogs = [];
    expect(wrapper.vm.auditLogs).toEqual([]);
  });

  it('should reset page when applying filters', () => {
    wrapper.vm.activityPage = 3;
    wrapper.vm.activityFilterAction = 'auth.login';
    wrapper.vm.applyActivityFilters();
    expect(wrapper.vm.activityPage).toBe(1);
    expect(adminStore.getAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.login', page: 1 }),
    );
  });

  it('should clear filters and reset page', () => {
    wrapper.vm.activityFilterAction = 'auth.login';
    wrapper.vm.activityFilterUserId = 'abc123';
    wrapper.vm.activityPage = 5;
    wrapper.vm.clearActivityFilters();
    expect(wrapper.vm.activityFilterAction).toBe('');
    expect(wrapper.vm.activityFilterUserId).toBe('');
    expect(wrapper.vm.activityPage).toBe(1);
  });

  it('should compute hasNextPage correctly', () => {
    adminStore.auditTotal = 50;
    wrapper.vm.activityPage = 1;
    wrapper.vm.activityPerPage = 20;
    expect(wrapper.vm.activityHasNextPage).toBe(true);
    wrapper.vm.activityPage = 3;
    expect(wrapper.vm.activityHasNextPage).toBe(false);
  });

  it('should navigate to next page', () => {
    adminStore.auditTotal = 50;
    wrapper.vm.activityPage = 1;
    wrapper.vm.activityPerPage = 20;
    wrapper.vm.activityNextPage();
    expect(wrapper.vm.activityPage).toBe(2);
    expect(adminStore.getAuditLogs).toHaveBeenCalled();
  });

  it('should navigate to previous page', () => {
    wrapper.vm.activityPage = 3;
    wrapper.vm.activityPrevPage();
    expect(wrapper.vm.activityPage).toBe(2);
    expect(adminStore.getAuditLogs).toHaveBeenCalled();
  });

  it('should not go below page 1', () => {
    wrapper.vm.activityPage = 1;
    wrapper.vm.activityPrevPage();
    expect(wrapper.vm.activityPage).toBe(1);
  });

  it('should toggle expanded row', () => {
    expect(wrapper.vm.activityExpandedId).toBeNull();
    wrapper.vm.toggleActivityExpand('abc123');
    expect(wrapper.vm.activityExpandedId).toBe('abc123');
    wrapper.vm.toggleActivityExpand('abc123');
    expect(wrapper.vm.activityExpandedId).toBeNull();
  });

  it('should format dates correctly', () => {
    const result = wrapper.vm.formatActivityDate('2026-01-15T10:30:00.000Z');
    expect(result).toMatch(/15\/01\/26/);
  });

  it('should return em dash for null dates', () => {
    const result = wrapper.vm.formatActivityDate(null);
    expect(result).toBe('\u2014');
  });

  it('should reset page to 1 when perPage changes', async () => {
    wrapper.vm.activityPage = 4;
    wrapper.vm.activityPerPage = 50;
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.activityPage).toBe(1);
  });

  it('should not fetch activity on mount when audit is disabled via config', () => {
    const getAuditLogs = vi.fn().mockResolvedValue();
    setActivePinia(createPinia());
    const store = useAdminStore();
    store.getAuditLogs = getAuditLogs;
    mountActivity({ audit: { enabled: false } });
    expect(getAuditLogs).not.toHaveBeenCalled();
  });
});
