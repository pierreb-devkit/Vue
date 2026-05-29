import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';

// ─── Prevent real HTTP calls ─────────────────────────────────────────────────

vi.mock('../../../lib/services/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('../../../lib/helpers/analytics', () => ({
  capture: vi.fn(),
}));

// ─── Imports (after mocks) ───────────────────────────────────────────────────

import { useBillingStore } from '../stores/billing.store';
import {
  useCheckoutPolling,
  CHECKOUT_POLL_MAX,
  CHECKOUT_POLL_INTERVAL_MS,
  CHECKOUT_POLL_WINDOW_MS,
  CHECKOUT_POLL_SESSION_KEY,
  safeSessionRemove,
} from '../composables/billing.useCheckoutPolling';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const _wrappers = [];

/**
 * @desc Mount a wrapper component that calls useCheckoutPolling and exposes its return value.
 * @returns {{ result: ReturnType<typeof useCheckoutPolling>, wrapper: import('@vue/test-utils').VueWrapper }}
 */
function mountPolling() {
  let result;
  const Wrapper = defineComponent({
    setup() {
      result = useCheckoutPolling();
      return {};
    },
    template: '<div />',
  });
  const wrapper = mount(Wrapper);
  _wrappers.push(wrapper);
  return { result, wrapper };
}

// ─── Suite 1: Constants ───────────────────────────────────────────────────────

describe('useCheckoutPolling — exported constants', () => {
  it('CHECKOUT_POLL_MAX is 8', () => {
    expect(CHECKOUT_POLL_MAX).toBe(8);
  });

  it('CHECKOUT_POLL_INTERVAL_MS is 2000', () => {
    expect(CHECKOUT_POLL_INTERVAL_MS).toBe(2000);
  });

  it('CHECKOUT_POLL_WINDOW_MS equals POLL_MAX × POLL_INTERVAL', () => {
    expect(CHECKOUT_POLL_WINDOW_MS).toBe(CHECKOUT_POLL_MAX * CHECKOUT_POLL_INTERVAL_MS);
  });

  it('CHECKOUT_POLL_SESSION_KEY is billing.checkout.polling', () => {
    expect(CHECKOUT_POLL_SESSION_KEY).toBe('billing.checkout.polling');
  });
});

// ─── Suite 2: safeSessionRemove ──────────────────────────────────────────────

describe('useCheckoutPolling — safeSessionRemove', () => {
  let realSessionStorage;

  beforeEach(() => {
    realSessionStorage = window.sessionStorage;
  });

  afterEach(() => {
    Object.defineProperty(window, 'sessionStorage', {
      value: realSessionStorage,
      writable: true,
      configurable: true,
    });
  });

  it('removes an existing key without throwing', () => {
    sessionStorage.setItem('test-key', 'value');
    expect(() => safeSessionRemove('test-key')).not.toThrow();
    expect(sessionStorage.getItem('test-key')).toBeNull();
  });

  it('does not throw when sessionStorage.removeItem throws SecurityError', () => {
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => { throw new DOMException('SecurityError', 'SecurityError'); },
        clear: () => {},
      },
      writable: true,
      configurable: true,
    });
    expect(() => safeSessionRemove('any-key')).not.toThrow();
  });
});

// ─── Suite 3: Initial reactive state ─────────────────────────────────────────

describe('useCheckoutPolling — initial state', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    const store = useBillingStore();
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
  });

  afterEach(() => {
    while (_wrappers.length) _wrappers.pop()?.unmount();
    sessionStorage.clear();
  });

  it('checkoutProcessing starts as false', () => {
    const { result } = mountPolling();
    expect(result.checkoutProcessing.value).toBe(false);
  });

  it('checkoutTimeout starts as false', () => {
    const { result } = mountPolling();
    expect(result.checkoutTimeout.value).toBe(false);
  });

  it('paymentSuccessMessage starts as null', () => {
    const { result } = mountPolling();
    expect(result.paymentSuccessMessage.value).toBeNull();
  });

  it('checkoutPollCount starts at 0', () => {
    const { result } = mountPolling();
    expect(result.checkoutPollCount.value).toBe(0);
  });

  it('pollAborted starts as false', () => {
    const { result } = mountPolling();
    expect(result.pollAborted.value).toBe(false);
  });

  it('snapshot refs start as null', () => {
    const { result } = mountPolling();
    expect(result.checkoutPollSnapshotId.value).toBeNull();
    expect(result.checkoutPollSnapshotStatus.value).toBeNull();
    expect(result.checkoutPollSnapshotPlan.value).toBeNull();
  });
});

// ─── Suite 4: persistCheckoutPollingSession ───────────────────────────────────

describe('useCheckoutPolling — persistCheckoutPollingSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    const store = useBillingStore();
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
  });

  afterEach(() => {
    while (_wrappers.length) _wrappers.pop()?.unmount();
    sessionStorage.clear();
  });

  it('writes payload JSON to sessionStorage', () => {
    const { result } = mountPolling();
    const payload = { startedAt: 1234567890, snapshotId: 'sub_x', snapshotStatus: 'active', snapshotPlan: 'starter' };
    result.persistCheckoutPollingSession(payload);
    const stored = JSON.parse(sessionStorage.getItem(CHECKOUT_POLL_SESSION_KEY));
    expect(stored).toEqual(payload);
  });

  it('does not throw when sessionStorage.setItem throws', () => {
    const { result } = mountPolling();
    const real = window.sessionStorage;
    Object.defineProperty(window, 'sessionStorage', {
      value: { ...real, setItem: () => { throw new DOMException('QuotaExceededError'); } },
      writable: true,
      configurable: true,
    });
    expect(() => result.persistCheckoutPollingSession({ startedAt: Date.now() })).not.toThrow();
    Object.defineProperty(window, 'sessionStorage', { value: real, writable: true, configurable: true });
  });
});

// ─── Suite 5: clearCheckoutPollingSession ────────────────────────────────────

describe('useCheckoutPolling — clearCheckoutPollingSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    const store = useBillingStore();
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
  });

  afterEach(() => {
    while (_wrappers.length) _wrappers.pop()?.unmount();
    sessionStorage.clear();
  });

  it('removes the session key', () => {
    sessionStorage.setItem(CHECKOUT_POLL_SESSION_KEY, JSON.stringify({ startedAt: Date.now() }));
    const { result } = mountPolling();
    result.clearCheckoutPollingSession();
    expect(sessionStorage.getItem(CHECKOUT_POLL_SESSION_KEY)).toBeNull();
  });

  it('does not throw when sessionStorage.removeItem throws', () => {
    const { result } = mountPolling();
    const real = window.sessionStorage;
    Object.defineProperty(window, 'sessionStorage', {
      value: { ...real, removeItem: () => { throw new DOMException('SecurityError'); } },
      writable: true,
      configurable: true,
    });
    expect(() => result.clearCheckoutPollingSession()).not.toThrow();
    Object.defineProperty(window, 'sessionStorage', { value: real, writable: true, configurable: true });
  });
});

// ─── Suite 6: handleCheckoutSuccessQuery ─────────────────────────────────────

describe('useCheckoutPolling — handleCheckoutSuccessQuery', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
    store = useBillingStore();
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
  });

  afterEach(() => {
    while (_wrappers.length) _wrappers.pop()?.unmount();
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('returns false when no success query param is present', () => {
    const { result } = mountPolling();
    const ret = result.handleCheckoutSuccessQuery({ query: {} }, vi.fn());
    expect(ret).toBe(false);
    expect(result.checkoutProcessing.value).toBe(false);
  });

  it('returns false when packPurchased=false', () => {
    const { result } = mountPolling();
    const ret = result.handleCheckoutSuccessQuery({ query: { packPurchased: 'false' } }, vi.fn());
    expect(ret).toBe(false);
  });

  it('starts polling and returns true on ?success=true (non-extras)', () => {
    const { result } = mountPolling();
    const cleanupSpy = vi.fn();
    const ret = result.handleCheckoutSuccessQuery({ query: { success: 'true' } }, cleanupSpy);
    expect(ret).toBe(true);
    expect(result.checkoutProcessing.value).toBe(true);
    expect(result.checkoutPollCount.value).toBe(0);
    // scheduleQueryCleanup should have been called
    expect(cleanupSpy).toHaveBeenCalled();
  });

  it('persists session to sessionStorage when subscription polling starts', () => {
    const { result } = mountPolling();
    result.handleCheckoutSuccessQuery({ query: { success: 'true' } }, vi.fn());
    const raw = sessionStorage.getItem(CHECKOUT_POLL_SESSION_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveProperty('startedAt');
    expect(typeof parsed.startedAt).toBe('number');
  });

  it('captures store snapshot fields in sessionStorage on success start', () => {
    store.subscription = { stripeSubscriptionId: 'sub_snap', status: 'active', plan: 'starter' };
    const { result } = mountPolling();
    result.handleCheckoutSuccessQuery({ query: { success: 'true' } }, vi.fn());
    const parsed = JSON.parse(sessionStorage.getItem(CHECKOUT_POLL_SESSION_KEY));
    expect(parsed.snapshotId).toBe('sub_snap');
    expect(parsed.snapshotStatus).toBe('active');
    expect(parsed.snapshotPlan).toBe('starter');
  });

  it('returns true and shows extras success message on type=extras', () => {
    const { result } = mountPolling();
    const ret = result.handleCheckoutSuccessQuery({ query: { success: 'true', type: 'extras' } }, vi.fn());
    expect(ret).toBe(true);
    expect(result.checkoutProcessing.value).toBe(false);
    expect(result.paymentSuccessMessage.value).toBe('Pack credited to your balance');
  });

  it('clears sessionStorage on extras purchase (prevents leftover subscription polling)', () => {
    sessionStorage.setItem(CHECKOUT_POLL_SESSION_KEY, JSON.stringify({ startedAt: Date.now() - 2000 }));
    const { result } = mountPolling();
    result.handleCheckoutSuccessQuery({ query: { success: 'true', type: 'extras' } }, vi.fn());
    expect(sessionStorage.getItem(CHECKOUT_POLL_SESSION_KEY)).toBeNull();
  });

  it('returns true and shows extras success on packPurchased=true', () => {
    const { result } = mountPolling();
    const ret = result.handleCheckoutSuccessQuery({ query: { packPurchased: 'true' } }, vi.fn());
    expect(ret).toBe(true);
    expect(result.paymentSuccessMessage.value).toBe('Pack credited to your balance');
  });
});

// ─── Suite 7: resumeCheckoutPollingFromSession ────────────────────────────────

describe('useCheckoutPolling — resumeCheckoutPollingFromSession', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
    store = useBillingStore();
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
  });

  afterEach(() => {
    while (_wrappers.length) _wrappers.pop()?.unmount();
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('returns false when sessionStorage is empty', () => {
    const { result } = mountPolling();
    expect(result.resumeCheckoutPollingFromSession()).toBe(false);
    expect(result.checkoutProcessing.value).toBe(false);
  });

  it('returns false and clears key when startedAt is not a finite number', () => {
    sessionStorage.setItem(CHECKOUT_POLL_SESSION_KEY, JSON.stringify({ startedAt: 'bad' }));
    const { result } = mountPolling();
    expect(result.resumeCheckoutPollingFromSession()).toBe(false);
    expect(sessionStorage.getItem(CHECKOUT_POLL_SESSION_KEY)).toBeNull();
  });

  it('returns false and clears key when session is expired (startedAt > POLL_WINDOW ago)', () => {
    sessionStorage.setItem(CHECKOUT_POLL_SESSION_KEY, JSON.stringify({ startedAt: Date.now() - 20000 }));
    const { result } = mountPolling();
    expect(result.resumeCheckoutPollingFromSession()).toBe(false);
    expect(sessionStorage.getItem(CHECKOUT_POLL_SESSION_KEY)).toBeNull();
  });

  it('returns false and clears key when JSON is malformed', () => {
    sessionStorage.setItem(CHECKOUT_POLL_SESSION_KEY, 'not-json{{{');
    const { result } = mountPolling();
    expect(result.resumeCheckoutPollingFromSession()).toBe(false);
    expect(sessionStorage.getItem(CHECKOUT_POLL_SESSION_KEY)).toBeNull();
  });

  it('returns true and sets checkoutProcessing when session is within window', () => {
    sessionStorage.setItem(CHECKOUT_POLL_SESSION_KEY, JSON.stringify({
      startedAt: Date.now() - 4000,
      snapshotId: null,
      snapshotStatus: null,
      snapshotPlan: null,
    }));
    const { result } = mountPolling();
    expect(result.resumeCheckoutPollingFromSession()).toBe(true);
    expect(result.checkoutProcessing.value).toBe(true);
  });

  it('restores snapshots from sessionStorage on resume', () => {
    sessionStorage.setItem(CHECKOUT_POLL_SESSION_KEY, JSON.stringify({
      startedAt: Date.now() - 4000,
      snapshotId: 'sub_f5',
      snapshotStatus: 'active',
      snapshotPlan: 'starter',
    }));
    const { result } = mountPolling();
    result.resumeCheckoutPollingFromSession();
    expect(result.checkoutPollSnapshotId.value).toBe('sub_f5');
    expect(result.checkoutPollSnapshotStatus.value).toBe('active');
    expect(result.checkoutPollSnapshotPlan.value).toBe('starter');
  });

  it('calculates poll count from elapsed time on resume', () => {
    // 4s elapsed → floor(4000 / 2000) = 2 polls already done
    sessionStorage.setItem(CHECKOUT_POLL_SESSION_KEY, JSON.stringify({ startedAt: Date.now() - 4000 }));
    const { result } = mountPolling();
    result.resumeCheckoutPollingFromSession();
    expect(result.checkoutPollCount.value).toBe(2);
  });

  it('returns false and clears key when startedAt is in the future', () => {
    sessionStorage.setItem(CHECKOUT_POLL_SESSION_KEY, JSON.stringify({ startedAt: Date.now() + 5000 }));
    const { result } = mountPolling();
    expect(result.resumeCheckoutPollingFromSession()).toBe(false);
    expect(sessionStorage.getItem(CHECKOUT_POLL_SESSION_KEY)).toBeNull();
  });
});

// ─── Suite 8: pollSubscription state machine ──────────────────────────────────

describe('useCheckoutPolling — pollSubscription state machine', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
    store = useBillingStore();
  });

  afterEach(() => {
    while (_wrappers.length) _wrappers.pop()?.unmount();
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('activates success when stripeSubscriptionId appears (was null)', async () => {
    store.subscription = null;
    vi.spyOn(store, 'fetchSubscription').mockImplementation(async () => {
      store.subscription = { stripeSubscriptionId: 'sub_new', status: 'active', plan: 'starter' };
    });

    const { result } = mountPolling();
    result.checkoutProcessing.value = true;
    result.checkoutPollSnapshotId.value = null;
    result.checkoutPollSnapshotStatus.value = null;
    result.checkoutPollSnapshotPlan.value = null;
    result.pollSubscription();

    await vi.advanceTimersByTimeAsync(CHECKOUT_POLL_INTERVAL_MS);

    expect(result.checkoutProcessing.value).toBe(false);
    expect(result.paymentSuccessMessage.value).toBe('Subscription activated successfully. Thank you!');
    expect(result.checkoutTimeout.value).toBe(false);
  });

  it('activates success when status changes to active', async () => {
    store.subscription = { stripeSubscriptionId: 'sub_x', status: 'incomplete', plan: 'starter' };
    vi.spyOn(store, 'fetchSubscription').mockImplementation(async () => {
      store.subscription = { stripeSubscriptionId: 'sub_x', status: 'active', plan: 'starter' };
    });

    const { result } = mountPolling();
    result.checkoutProcessing.value = true;
    result.checkoutPollSnapshotId.value = 'sub_x';
    result.checkoutPollSnapshotStatus.value = 'incomplete';
    result.checkoutPollSnapshotPlan.value = 'starter';
    result.pollSubscription();

    await vi.advanceTimersByTimeAsync(CHECKOUT_POLL_INTERVAL_MS);

    expect(result.checkoutProcessing.value).toBe(false);
    expect(result.paymentSuccessMessage.value).toContain('activated successfully');
  });

  it('activates success when plan changes (same stripeSubscriptionId — upgrade detection)', async () => {
    store.subscription = { stripeSubscriptionId: 'sub_same', status: 'active', plan: 'starter' };
    vi.spyOn(store, 'fetchSubscription').mockImplementation(async () => {
      store.subscription = { stripeSubscriptionId: 'sub_same', status: 'active', plan: 'pro' };
    });

    const { result } = mountPolling();
    result.checkoutProcessing.value = true;
    result.checkoutPollSnapshotId.value = 'sub_same';
    result.checkoutPollSnapshotStatus.value = 'active';
    result.checkoutPollSnapshotPlan.value = 'starter';
    result.pollSubscription();

    await vi.advanceTimersByTimeAsync(CHECKOUT_POLL_INTERVAL_MS);

    expect(result.checkoutProcessing.value).toBe(false);
    expect(result.paymentSuccessMessage.value).toContain('activated successfully');
  });

  it('sets checkoutTimeout after POLL_MAX polls without state change', async () => {
    store.subscription = null;
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);

    const { result } = mountPolling();
    result.checkoutProcessing.value = true;
    result.pollSubscription();

    await vi.advanceTimersByTimeAsync(CHECKOUT_POLL_INTERVAL_MS * CHECKOUT_POLL_MAX);

    expect(result.checkoutProcessing.value).toBe(false);
    expect(result.checkoutTimeout.value).toBe(true);
    expect(sessionStorage.getItem(CHECKOUT_POLL_SESSION_KEY)).toBeNull();
  });

  it('continues polling on transient fetchSubscription error', async () => {
    let callCount = 0;
    vi.spyOn(store, 'fetchSubscription').mockImplementation(async () => {
      callCount += 1;
      if (callCount < 3) throw new Error('Network error');
      store.subscription = { stripeSubscriptionId: 'sub_ok', status: 'active', plan: 'starter' };
    });

    const { result } = mountPolling();
    result.checkoutProcessing.value = true;
    result.checkoutPollSnapshotId.value = null;
    result.pollSubscription();

    await vi.advanceTimersByTimeAsync(CHECKOUT_POLL_INTERVAL_MS * 3);

    expect(result.checkoutProcessing.value).toBe(false);
    expect(result.paymentSuccessMessage.value).toContain('activated successfully');
  });

  it('stops recursion when pollAborted is set', async () => {
    let resolveFetch;
    vi.spyOn(store, 'fetchSubscription').mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; }),
    );

    const { result, wrapper } = mountPolling();
    result.checkoutProcessing.value = true;
    result.pollSubscription();

    vi.advanceTimersByTime(CHECKOUT_POLL_INTERVAL_MS);

    // Unmount sets pollAborted
    result.pollAborted.value = true;
    const fetchCallCount = store.fetchSubscription.mock.calls.length;

    resolveFetch(null);
    await vi.runAllTimersAsync();

    // No additional poll should have been scheduled
    expect(store.fetchSubscription.mock.calls.length).toBe(fetchCallCount);
    wrapper.unmount();
    _wrappers.splice(_wrappers.indexOf(wrapper), 1);
  });

  it('clears sessionStorage when subscription activates', async () => {
    sessionStorage.setItem(CHECKOUT_POLL_SESSION_KEY, JSON.stringify({ startedAt: Date.now() }));
    store.subscription = null;
    vi.spyOn(store, 'fetchSubscription').mockImplementation(async () => {
      store.subscription = { stripeSubscriptionId: 'sub_ok', status: 'active', plan: 'starter' };
    });

    const { result } = mountPolling();
    result.checkoutProcessing.value = true;
    result.checkoutPollSnapshotId.value = null;
    result.pollSubscription();

    await vi.advanceTimersByTimeAsync(CHECKOUT_POLL_INTERVAL_MS);

    expect(sessionStorage.getItem(CHECKOUT_POLL_SESSION_KEY)).toBeNull();
  });
});
