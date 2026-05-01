import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { useBillingStore } from '../stores/billing.store';

// Prevent real HTTP calls from store actions
vi.mock('../../../lib/services/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('../../../lib/helpers/analytics', () => ({
  capture: vi.fn(),
}));

// Mutable auth store state shared across tests
const authState = vi.hoisted(() => ({
  isLoggedIn: true,
  user: null,
  serverConfig: null,
}));

vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => authState,
}));

import BillingBillingView from '../views/billing.billing.view.vue';

const mockConfig = {
  api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api', endPoints: {} },
  vuetify: { theme: { rounded: '', flat: true } },
};

const vuetify = createVuetify();

/**
 * Mount BillingBillingView with Vuetify and Pinia installed.
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountView = () =>
  mount(BillingBillingView, {
    global: {
      plugins: [vuetify],
      mocks: { config: mockConfig },
      stubs: {
        RouterLink: true,
        BillingMeterProgressComponent: true,
        BillingMeterBreakdownChartComponent: true,
        BillingExtrasCheckoutModalComponent: true,
        BillingExtrasLedgerComponent: true,
        billingPlanBadgeComponent: true,
        BillingUsageBarComponent: true,
        BillingMeterDrawerComponent: true,
      },
    },
  });

describe('billing.billing.view — meter mode behavior', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useBillingStore();
    authState.isLoggedIn = true;
    authState.user = null;
    authState.serverConfig = null;
    vi.clearAllMocks();
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
    vi.spyOn(store, 'fetchExtrasLedger').mockResolvedValue({ entries: [], total: 0, page: 1, limit: 20 });
    vi.spyOn(store, 'fetchUsageMeter').mockResolvedValue(null);
    vi.spyOn(store, 'fetchExtrasBalance').mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not create a view-owned polling interval when meterMode is true', async () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

    authState.serverConfig = { billing: { meterMode: true } };
    const wrapper = mountView();
    await flushPromises();

    expect(setIntervalSpy).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('fetches extras ledger when meterMode is true', async () => {
    authState.serverConfig = { billing: { meterMode: true } };
    const wrapper = mountView();
    await flushPromises();

    expect(store.fetchExtrasLedger).toHaveBeenCalledWith({ page: 1, limit: 20 });
    wrapper.unmount();
  });

  it('does not fetch extras ledger when meterMode is false', async () => {
    authState.serverConfig = { billing: { meterMode: false } };
    const wrapper = mountView();
    await flushPromises();

    expect(store.fetchExtrasLedger).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('fetches extras ledger when meterMode becomes true after remount', async () => {
    authState.serverConfig = { billing: { meterMode: false } };
    const wrapper = mountView();
    await flushPromises();
    expect(store.fetchExtrasLedger).not.toHaveBeenCalled();

    wrapper.unmount();
    store.fetchExtrasLedger.mockClear();
    authState.serverConfig = { billing: { meterMode: true } };
    const wrapper2 = mountView();
    await flushPromises();

    expect(store.fetchExtrasLedger).toHaveBeenCalledWith({ page: 1, limit: 20 });
    wrapper2.unmount();
  });

  // ── Extras section ────────────────────────────────────────────────────────

  it('renders BillingExtrasLedgerComponent when meterMode is true', async () => {
    authState.serverConfig = { billing: { meterMode: true } };
    const wrapper = mountView();
    await flushPromises();
    const ledger = wrapper.findComponent({ name: 'BillingExtrasLedgerComponent' });
    expect(ledger.exists()).toBe(true);
  });

  it('does not render BillingExtrasLedgerComponent when meterMode is false', async () => {
    authState.serverConfig = { billing: { meterMode: false } };
    const wrapper = mountView();
    await flushPromises();
    const ledger = wrapper.findComponent({ name: 'BillingExtrasLedgerComponent' });
    expect(ledger.exists()).toBe(false);
  });

  it('extrasLedger computed returns store value when set', async () => {
    authState.serverConfig = { billing: { meterMode: true } };
    const wrapper = mountView();
    await flushPromises();

    store.extrasLedger = { entries: [{ at: new Date().toISOString(), kind: 'topup', amount: 100 }], total: 1, page: 1, limit: 20 };

    expect(wrapper.vm.extrasLedger.entries).toHaveLength(1);
    expect(wrapper.vm.extrasLedger.total).toBe(1);

    wrapper.unmount();
  });

  it('extrasLedger computed falls back to empty state when store is null', async () => {
    authState.serverConfig = { billing: { meterMode: true } };
    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.vm.extrasLedger.entries).toEqual([]);
    expect(wrapper.vm.extrasLedger.total).toBe(0);

    wrapper.unmount();
  });

  it('onLedgerPageChange calls fetchExtrasLedger with correct page', async () => {
    authState.serverConfig = { billing: { meterMode: true } };
    const wrapper = mountView();
    await flushPromises();

    const fetchSpy = vi.spyOn(store, 'fetchExtrasLedger').mockResolvedValue({ entries: [], total: 0, page: 2, limit: 20 });

    await wrapper.vm.onLedgerPageChange(2);

    expect(fetchSpy).toHaveBeenCalledWith({ page: 2, limit: 20 });

    wrapper.unmount();
  });

  it('does not create a view-owned polling interval when meterMode is false', async () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

    authState.serverConfig = { billing: { meterMode: false } };
    const wrapper = mountView();
    await flushPromises();

    expect(setIntervalSpy).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
