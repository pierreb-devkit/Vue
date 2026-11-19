import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { useAdminStore } from '../stores/admin.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import AdminOverview from '../views/admin.overview.view.vue';

vi.mock('../../../lib/services/axios', () => ({
  default: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
    vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
  },
}));

const stubs = {
  'v-container': { template: '<div><slot /></div>' },
  'v-row': { template: '<div><slot /></div>' },
  'v-col': { template: '<div><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-spacer': { template: '<span />' },
  'v-btn': { template: '<button><slot /></button>' },
  'v-icon': { template: '<i />' },
  'v-progress-linear': { template: '<div />' },
  AdminWeeklyBarsComponent: { props: ['weeks', 'label'], template: '<div data-testid="bars">{{ label }}</div>' },
};

/**
 * 8 finished weeks (previous period 1+1+1+1 = 4, latest period 2+2+2+2 = 8), then the
 * week in progress, which the KPIs must leave out.
 */
const weeks = (counts = [1, 1, 1, 1, 2, 2, 2, 2], inProgress = 50) =>
  [...counts, inProgress].map((count, i) => ({ week: `2026-10-${String(i + 1).padStart(2, '0')}`, count }));

const fullStats = () => ({
  users: { total: 1234, weeks: weeks() },
  organizations: { total: 40, weeks: weeks([0, 0, 0, 0, 0, 0, 0, 0]) },
  audit: {
    total: 30,
    weeks: weeks([5, 5, 5, 5, 3, 3, 2, 2]),
    topActions: [
      { action: 'auth.signin', count: 20 },
      { action: 'tasks', count: 10 },
    ],
    activeUsers: { current: 6, previous: 0, periodWeeks: 4 },
  },
  recent: [{ id: 'r1', action: 'auth.signin', targetType: 'User', createdAt: new Date(Date.now() - 5 * 60000).toISOString() }],
});

const mountView = (config = {}) =>
  shallowMount(AdminOverview, {
    global: {
      mocks: { config: { vuetify: { theme: { flat: true, rounded: 'rounded-lg' } }, ...config } },
      stubs,
    },
  });

describe('admin.overview.view', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAdminStore();
    store.getStats = vi.fn().mockResolvedValue();
  });

  it('should load every source on mount', () => {
    mountView();
    expect(store.getStats).toHaveBeenCalledWith({ audit: true, only: undefined });
  });

  it('should show the KPIs with their trend against the previous period', async () => {
    const wrapper = mountView();
    store.stats = fullStats();
    await wrapper.vm.$nextTick();
    const users = wrapper.find('[data-test="kpi-users"]');
    expect(users.find('[data-test="value"]').text()).toBe('1,234');
    expect(users.find('[data-test="caption"]').text()).toBe('8 new in the last 4 full weeks');
    expect(users.find('[data-test="trend"]').text()).toBe('Up 100% vs previous 4 weeks');
    expect(wrapper.find('[data-test="kpi-organizations"] [data-test="trend"]').text()).toBe('No change vs previous 4 weeks');
    expect(wrapper.find('[data-test="kpi-active"] [data-test="value"]').text()).toBe('6');
    expect(wrapper.find('[data-test="kpi-active"] [data-test="trend"]').text()).toBe('Up from 0 vs previous 4 weeks');
    const events = wrapper.find('[data-test="kpi-events"]');
    expect(events.find('[data-test="value"]').text()).toBe('10');
    expect(events.find('[data-test="trend"]').text()).toBe('Down 50% vs previous 4 weeks');
  });

  it('should keep the loading bar on while any load is still running', async () => {
    let finishFirst;
    store.getStats = vi
      .fn()
      .mockImplementationOnce(() => new Promise((resolve) => (finishFirst = resolve)))
      .mockResolvedValue();
    const wrapper = mountView();
    expect(wrapper.vm.loading).toBe(true);
    const retry = wrapper.vm.load(['users']);
    await retry;
    expect(wrapper.vm.loading).toBe(true);
    finishFirst();
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.loading).toBe(false);
  });

  it('should colour a rise and a fall differently', () => {
    const wrapper = mountView();
    expect(wrapper.vm.trend(8, 4).class).toBe('text-success');
    expect(wrapper.vm.trend(2, 4).class).toBe('text-error');
    expect(wrapper.vm.trend(4, 4).class).toBe('text-medium-emphasis');
  });

  it('should not print a nonzero change as 0%', () => {
    const wrapper = mountView();
    expect(wrapper.vm.trend(1001, 1000).text).toBe('Up less than 1% vs previous 4 weeks');
    expect(wrapper.vm.trend(999, 1000).text).toBe('Down less than 1% vs previous 4 weeks');
  });

  it('should never print a future time for a recent event', () => {
    const wrapper = mountView();
    expect(wrapper.vm.timeAgo(new Date(Date.now() + 30000).toISOString())).not.toMatch(/^in /);
  });

  it('should draw one chart per series and list the activity', async () => {
    const wrapper = mountView();
    store.stats = fullStats();
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('[data-testid="bars"]')).toHaveLength(3);
    const rows = wrapper.findAll('[data-test="action-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].text()).toContain('auth.signin');
    expect(rows[0].text()).toContain('20');
    const recent = wrapper.findAll('[data-test="recent-row"]');
    expect(recent).toHaveLength(1);
    expect(recent[0].text()).toContain('auth.signin');
    expect(recent[0].text()).toContain('5 min. ago');
  });

  it('should print a dash while a figure is missing', () => {
    const wrapper = mountView();
    expect(wrapper.find('[data-test="kpi-users"] [data-test="value"]').text()).toBe('—');
  });

  it('should show an error with a retry inside the card that failed', async () => {
    const wrapper = mountView();
    store.statsErrors = ['users'];
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="chart-users"] [data-test="error"]').text()).toContain("Couldn't load accounts.");
    expect(wrapper.find('[data-test="chart-organizations"] [data-test="error"]').exists()).toBe(false);
    store.getStats.mockClear();
    const retry = wrapper.findAll('button').find((b) => b.text() === 'Retry');
    await retry.trigger('click');
    expect(store.getStats).toHaveBeenCalledTimes(1);
    expect(store.getStats).toHaveBeenCalledWith({ audit: true, only: ['users'] });
  });

  it('should hide the activity parts when the server config reports audit off', async () => {
    useAuthStore().serverConfig = { audit: { enabled: false } };
    const wrapper = mountView();
    expect(store.getStats).toHaveBeenCalledWith({ audit: false, only: undefined });
    store.stats = { ...fullStats(), audit: null, recent: null };
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="kpi-active"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="kpi-events"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="top-actions"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="recent"]').exists()).toBe(false);
    expect(wrapper.findAll('[data-testid="bars"]')).toHaveLength(2);
  });
});
