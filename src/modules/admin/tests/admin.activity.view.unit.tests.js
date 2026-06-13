import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
  'v-card': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
  'v-card-actions': { template: '<div><slot /></div>' },
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

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

describe('admin.activity.view — template chrome', () => {
  it('wraps its template in <v-container fluid> + <v-row class="pa-2 mt-0"> + <v-col cols="12">', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/admin.activity.view.vue'), 'utf8');
    const tmpl = sfc.split('<script>')[0];
    expect(tmpl).toMatch(/<v-container\s+fluid/);
    expect(tmpl).toMatch(/<v-row[^>]*class="[^"]*pa-2\s+mt-0/);
    expect(tmpl).toMatch(/<v-col\s+cols="12"/);
  });

  it('has zero inline style="…" attributes in its template', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/admin.activity.view.vue'), 'utf8');
    const tmpl = sfc.split('<script>')[0];
    // Allow :style="…" (dynamic bindings, none expected here) and reject plain style="…".
    // But neither should appear in this view after the refactor.
    expect(tmpl).not.toMatch(/\bstyle\s*=\s*"/);
    expect(tmpl).not.toMatch(/:style\s*=\s*"/);
  });

  it('uses v-table with the hover prop for row affordance', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/admin.activity.view.vue'), 'utf8');
    const tmpl = sfc.split('<script>')[0];
    expect(tmpl).toMatch(/<v-table[^>]*\bhover\b/);
  });

  it('expandable rows have keyboard semantics (tabindex, role, aria-expanded, keydown handlers)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/admin.activity.view.vue'), 'utf8');
    const tmpl = sfc.split('<script>')[0];
    expect(tmpl).toMatch(/tabindex="0"/);
    expect(tmpl).toMatch(/role="button"/);
    expect(tmpl).toMatch(/aria-expanded/);
    expect(tmpl).toMatch(/@keydown\.enter/);
    expect(tmpl).toMatch(/@keydown\.space/);
  });
});

describe('admin.activity.view — debounced card-title filters', () => {
  let adminStore;

  /**
   * Mount with a fresh pinia + mocked store action. Call AFTER
   * vi.useFakeTimers() so the debounce timer is controllable.
   * @returns {import('@vue/test-utils').VueWrapper}
   */
  const mountWithFreshStore = () => {
    setActivePinia(createPinia());
    adminStore = useAdminStore();
    adminStore.getAuditLogs = vi.fn().mockResolvedValue();
    return mountActivity();
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches 1000ms after typing in the action filter (single trailing call, page reset)', async () => {
    vi.useFakeTimers();
    const wrapper = mountWithFreshStore();
    expect(adminStore.getAuditLogs).toHaveBeenCalledTimes(1); // mount fetch
    wrapper.vm.activityFilterAction = 'auth.log';
    await wrapper.vm.$nextTick();
    wrapper.vm.activityFilterAction = 'auth.login';
    await wrapper.vm.$nextTick();
    vi.advanceTimersByTime(999);
    expect(adminStore.getAuditLogs).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(adminStore.getAuditLogs).toHaveBeenCalledTimes(2);
    expect(adminStore.getAuditLogs).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'auth.login', page: 1 }),
    );
  });

  it('does not fetch while the user-ID filter is not a valid ObjectId', async () => {
    vi.useFakeTimers();
    const wrapper = mountWithFreshStore();
    wrapper.vm.activityFilterUserId = 'not-an-objectid';
    await wrapper.vm.$nextTick();
    vi.advanceTimersByTime(1000);
    expect(adminStore.getAuditLogs).toHaveBeenCalledTimes(1); // mount fetch only
    expect(wrapper.vm.activityUserIdValid).toBe(false);
    wrapper.vm.activityFilterUserId = '507f1f77bcf86cd799439011';
    await wrapper.vm.$nextTick();
    vi.advanceTimersByTime(1000);
    expect(adminStore.getAuditLogs).toHaveBeenCalledTimes(2);
    expect(adminStore.getAuditLogs).toHaveBeenLastCalledWith(
      expect.objectContaining({ userId: '507f1f77bcf86cd799439011', page: 1 }),
    );
  });

  it('Clear fetches immediately and the trailing debounce does not double-fetch', async () => {
    vi.useFakeTimers();
    const wrapper = mountWithFreshStore();
    wrapper.vm.activityFilterAction = 'auth.login';
    await wrapper.vm.$nextTick();
    vi.advanceTimersByTime(1000);
    expect(adminStore.getAuditLogs).toHaveBeenCalledTimes(2);
    wrapper.vm.clearActivityFilters();
    expect(adminStore.getAuditLogs).toHaveBeenCalledTimes(3);
    await wrapper.vm.$nextTick();
    vi.advanceTimersByTime(1000);
    expect(adminStore.getAuditLogs).toHaveBeenCalledTimes(3); // debounce deduped
  });
});

describe('admin.activity.view — card-title chrome (datatable parity)', () => {
  /**
   * Read the SFC template section from disk.
   * @returns {string}
   */
  const readTemplate = () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/admin.activity.view.vue'), 'utf8');
    return sfc.split('<script>')[0];
  };

  it('mirrors the datatable card-title row: flex title + spacer + two compact outlined filter fields', () => {
    const tmpl = readTemplate();
    expect(tmpl).toMatch(/<v-card-title class="d-flex align-center ga-3">/);
    expect(tmpl).toMatch(/<v-spacer><\/v-spacer>/);
    expect(tmpl).toMatch(/prepend-inner-icon="fa-solid fa-magnifying-glass"/);
    expect(tmpl).toMatch(/prepend-inner-icon="fa-solid fa-user"/);
    expect(tmpl.match(/max-width="280"/g) || []).toHaveLength(2);
  });

  it('the enter-key + Search-button flow is gone (debounce replaces it)', () => {
    const tmpl = readTemplate();
    expect(tmpl).not.toMatch(/@keyup\.enter/);
    expect(tmpl).not.toMatch(/Search\s*<\/v-btn>/);
  });
});
