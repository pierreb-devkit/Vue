import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { useAdminStore } from '../stores/admin.store';
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
  'v-card-title': { template: '<div><slot /></div>' },
  'v-card-subtitle': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-divider': { template: '<hr />' },
  'v-spacer': { template: '<span />' },
  'v-btn': { template: '<button @click="$attrs.onClick && $attrs.onClick()"><slot /></button>' },
  'v-icon': { template: '<i />' },
  'v-progress-linear': { template: '<div data-testid="progress" />' },
  AdminWeeklyBarsComponent: { props: ['weeks', 'label'], template: '<div data-testid="bars">{{ label }}</div>' },
};

const weeks = (counts) => counts.map((count, i) => ({ week: `2026-11-${String(i + 1).padStart(2, '0')}`, count }));

const mountView = (config = {}) =>
  shallowMount(AdminOverview, {
    global: {
      mocks: {
        config: { vuetify: { theme: { flat: true, rounded: 'rounded-lg' } }, ...config },
        $vuetify: { display: { smAndUp: true } },
      },
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

  it('should load the stats with billing on by default', () => {
    mountView();
    expect(store.getStats).toHaveBeenCalledWith({ billing: true });
  });

  it('should skip billing when the billing module is off', () => {
    const wrapper = mountView({ modules: { billing: { activated: false } } });
    expect(store.getStats).toHaveBeenCalledWith({ billing: false });
    expect(wrapper.find('[data-test="kpi-subscriptions"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Subscriptions by plan');
  });

  it('should show totals, this week and the paid plans', async () => {
    const wrapper = mountView();
    store.stats = {
      users: { total: 1234, weeks: weeks([1, 2, 5]) },
      organizations: { total: 40, weeks: weeks([0, 0, 0]) },
      billing: { total: 40, byPlan: { free: 30, starter: 6, pro: 4 }, byStatus: { active: 38, past_due: 2 } },
    };
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="kpi-users"]').text()).toContain('1,234');
    expect(wrapper.find('[data-test="kpi-users"]').text()).toContain('5 new this week');
    expect(wrapper.find('[data-test="kpi-organizations"]').text()).toContain('0 new this week');
    expect(wrapper.find('[data-test="kpi-subscriptions"]').text()).toContain('10');
    expect(wrapper.find('[data-test="kpi-subscriptions"]').text()).toContain('of 40 subscriptions');
    expect(wrapper.findAll('[data-testid="bars"]')).toHaveLength(2);
    expect(wrapper.find('[data-test="plan-free"]').text()).toContain('75%');
    expect(wrapper.find('[data-test="status-past_due"]').text()).toContain('past due');
  });

  it('should print a dash while a figure is missing', () => {
    const wrapper = mountView();
    expect(wrapper.find('[data-test="kpi-users"]').text()).toContain('—');
  });

  it('should say when there are no subscriptions yet', async () => {
    const wrapper = mountView();
    store.stats = { users: null, organizations: null, billing: { total: 0, byPlan: {}, byStatus: {} } };
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('No subscriptions yet.');
  });

  it('should show an error with a retry inside the block that failed', async () => {
    const wrapper = mountView();
    store.statsErrors = ['users'];
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Couldn't load accounts.");
    store.getStats.mockClear();
    const retry = wrapper.findAll('button').find((b) => b.text() === 'Retry');
    await retry.trigger('click');
    expect(store.getStats).toHaveBeenCalled();
  });
});
