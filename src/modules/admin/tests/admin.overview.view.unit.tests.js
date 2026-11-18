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
  'v-spacer': { template: '<span />' },
  'v-btn': { template: '<button @click="$attrs.onClick && $attrs.onClick()"><slot /></button>' },
  'v-icon': { template: '<i />' },
  'v-progress-linear': { template: '<div data-testid="progress" />' },
  AdminWeeklyBarsComponent: { props: ['weeks', 'label'], template: '<div data-testid="bars">{{ label }}</div>' },
};

const weeks = (counts) => counts.map((count, i) => ({ week: `2026-11-${String(i + 1).padStart(2, '0')}`, count }));

const mountView = () =>
  shallowMount(AdminOverview, {
    global: {
      mocks: { config: { vuetify: { theme: { flat: true, rounded: 'rounded-lg' } } } },
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

  it('should load the stats on mount', () => {
    mountView();
    expect(store.getStats).toHaveBeenCalled();
  });

  it('should show the total, this week and the chart for each series', async () => {
    const wrapper = mountView();
    store.stats = {
      users: { total: 1234, weeks: weeks([1, 2, 5]) },
      organizations: { total: 40, weeks: weeks([0, 0, 0]) },
    };
    await wrapper.vm.$nextTick();
    const users = wrapper.find('[data-test="series-users"]');
    expect(users.find('[data-test="total"]').text()).toBe('1,234');
    expect(users.find('[data-test="this-week"]').text()).toBe('5 new this week');
    const orgs = wrapper.find('[data-test="series-organizations"]');
    expect(orgs.find('[data-test="total"]').text()).toBe('40');
    expect(orgs.find('[data-test="this-week"]').text()).toBe('0 new this week');
    expect(wrapper.findAll('[data-testid="bars"]')).toHaveLength(2);
  });

  it('should print a dash while a figure is missing', () => {
    const wrapper = mountView();
    expect(wrapper.find('[data-test="series-users"] [data-test="total"]').text()).toBe('—');
  });

  it('should show an error with a retry inside the card that failed', async () => {
    const wrapper = mountView();
    store.statsErrors = ['users'];
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="series-users"] [data-test="error"]').text()).toContain("Couldn't load accounts.");
    expect(wrapper.find('[data-test="series-organizations"] [data-test="error"]').exists()).toBe(false);
    store.getStats.mockClear();
    const retry = wrapper.findAll('button').find((b) => b.text() === 'Retry');
    await retry.trigger('click');
    expect(store.getStats).toHaveBeenCalled();
  });
});
