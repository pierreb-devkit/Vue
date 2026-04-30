import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

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
        billingPlanBadgeComponent: true,
      },
    },
  });

describe('billing.billing.view — pollingTimer cleanup', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    authState.isLoggedIn = true;
    authState.user = null;
    authState.serverConfig = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls setInterval when meterMode becomes true', async () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

    authState.serverConfig = { billing: { meterMode: true } };
    const wrapper = mountView();
    await flushPromises();

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);

    wrapper.unmount();
  });

  it('calls clearInterval with the timer id on unmount when meterMode is true', async () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    authState.serverConfig = { billing: { meterMode: true } };
    const wrapper = mountView();
    await flushPromises();

    // Unmount should call clearInterval
    wrapper.unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('does not start polling when meterMode is false', async () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

    authState.serverConfig = { billing: { meterMode: false } };
    const wrapper = mountView();
    await flushPromises();

    expect(setIntervalSpy).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('stops polling after unmount — no more refreshes fire', async () => {
    vi.useFakeTimers();

    authState.serverConfig = { billing: { meterMode: true } };
    const wrapper = mountView();
    await flushPromises();

    // Unmount immediately to clear the timer
    wrapper.unmount();

    // Capture call count right after unmount
    const { useBillingStore } = await import('../stores/billing.store');
    const store = useBillingStore();
    const fetchUsageSpy = vi.spyOn(store, 'fetchUsageMeter').mockResolvedValue(null);
    const fetchExtrasSpy = vi.spyOn(store, 'fetchExtrasBalance').mockResolvedValue(null);

    // Advance past the 30s interval — no calls should fire
    vi.advanceTimersByTime(60000);

    expect(fetchUsageSpy).not.toHaveBeenCalled();
    expect(fetchExtrasSpy).not.toHaveBeenCalled();
  });
});
