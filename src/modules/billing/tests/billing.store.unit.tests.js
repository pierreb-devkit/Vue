import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBillingStore } from '../stores/billing.store';
import axios from '../../../lib/services/axios';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock analytics helper
const mockCapture = vi.fn();
vi.mock('../../../lib/helpers/analytics', () => ({
  capture: (...args) => mockCapture(...args),
}));

describe('Billing Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockCapture.mockClear();
  });

  it('should initialize with default state', () => {
    const store = useBillingStore();
    expect(store.plans).toEqual([]);
    expect(store.subscription).toBeNull();
    expect(store.loading).toBe(false);
    // Per-action in-flight counters — all start at 0
    expect(store.usageMeterRequests).toBe(0);
    expect(store.extrasBalanceRequests).toBe(0);
    expect(store.extrasLedgerRequests).toBe(0);
    expect(store.extrasCheckoutRequests).toBe(0);
  });

  describe('fetchPlans', () => {
    it('should fetch and set plans', async () => {
      const store = useBillingStore();
      const mockPlans = [
        { id: 'free', name: 'Free' },
        { id: 'pro', name: 'Pro' },
      ];
      axios.get.mockResolvedValueOnce({ data: { data: mockPlans } });
      const result = await store.fetchPlans();
      expect(store.plans).toEqual(mockPlans);
      expect(result).toEqual(mockPlans);
      expect(store.loading).toBe(false);
    });

    it('should set loading to true during fetch', async () => {
      const store = useBillingStore();
      let loadingDuringFetch = false;
      axios.get.mockImplementationOnce(() => {
        loadingDuringFetch = store.loading;
        return Promise.resolve({ data: { data: [] } });
      });
      await store.fetchPlans();
      expect(loadingDuringFetch).toBe(true);
      expect(store.loading).toBe(false);
    });

    it('should call correct API endpoint', async () => {
      const store = useBillingStore();
      axios.get.mockResolvedValueOnce({ data: { data: [] } });
      await store.fetchPlans();
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/billing/plans'));
    });

    it('should propagate fetchPlans error to caller', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error('Network error'));
      await expect(store.fetchPlans()).rejects.toThrow('Network error');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });

  describe('fetchSubscription', () => {
    it('should fetch and set subscription', async () => {
      const store = useBillingStore();
      const mockSub = { plan: 'pro', status: 'active' };
      axios.get.mockResolvedValueOnce({ data: { data: mockSub } });
      const result = await store.fetchSubscription();
      expect(store.subscription).toEqual(mockSub);
      expect(result).toEqual(mockSub);
      expect(store.loading).toBe(false);
    });

    it('should call correct API endpoint', async () => {
      const store = useBillingStore();
      axios.get.mockResolvedValueOnce({ data: { data: {} } });
      await store.fetchSubscription();
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/billing/subscription'));
    });

    it('should propagate fetchSubscription error to caller', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error('Failed'));
      await expect(store.fetchSubscription()).rejects.toThrow('Failed');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });

  describe('createCheckout', () => {
    it('should create checkout session and return data', async () => {
      const store = useBillingStore();
      const mockCheckout = { url: 'https://checkout.stripe.com/session123' };
      axios.post.mockResolvedValueOnce({ data: { data: mockCheckout } });
      const result = await store.createCheckout('price_123');
      expect(result).toEqual(mockCheckout);
      expect(store.loading).toBe(false);
      expect(mockCapture).toHaveBeenCalledWith('plan_upgraded', { price_id: 'price_123' });
    });

    it('should send correct payload with priceId and redirect URLs', async () => {
      const store = useBillingStore();
      axios.post.mockResolvedValueOnce({ data: { data: {} } });
      await store.createCheckout('price_abc');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/billing/checkout'),
        expect.objectContaining({
          priceId: 'price_abc',
          successUrl: expect.stringContaining('/users?tab=subscriptions&success=true'),
          cancelUrl: expect.stringContaining('/pricing?canceled=true'),
        }),
      );
    });

    it('should propagate createCheckout error to caller', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.post.mockRejectedValueOnce(new Error('Checkout failed'));
      await expect(store.createCheckout('price_123')).rejects.toThrow('Checkout failed');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });

  describe('openPortal', () => {
    it('should set loading to true during openPortal', async () => {
      const store = useBillingStore();
      let loadingDuringPortal = false;
      const portalUrl = 'https://billing.stripe.com/session789';
      axios.post.mockImplementationOnce(() => {
        loadingDuringPortal = store.loading;
        return Promise.resolve({ data: { data: { url: portalUrl } } });
      });
      const originalLocation = window.location;
      delete window.location;
      window.location = { ...originalLocation, href: '' };
      await store.openPortal();
      expect(loadingDuringPortal).toBe(true);
      expect(store.loading).toBe(false);
      window.location = originalLocation;
    });

    it('should call portal endpoint and redirect', async () => {
      const store = useBillingStore();
      const portalUrl = 'https://billing.stripe.com/session456';
      axios.post.mockResolvedValueOnce({ data: { data: { url: portalUrl } } });
      const originalLocation = window.location;
      delete window.location;
      window.location = { ...originalLocation, href: '' };
      await store.openPortal();
      expect(window.location.href).toBe(portalUrl);
      expect(store.loading).toBe(false);
      window.location = originalLocation;
    });

    it('should throw when portal URL is missing from API response', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.post.mockResolvedValueOnce({ data: { data: {} } });
      await expect(store.openPortal()).rejects.toThrow('Billing portal URL is missing from the API response');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });

    it('should reject non-HTTPS portal URLs', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.post.mockResolvedValueOnce({ data: { data: { url: 'http://evil.example.com/portal' } } });
      await expect(store.openPortal()).rejects.toThrow('Rejected non-HTTPS portal URL');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });

    it('should propagate openPortal error to caller', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.post.mockRejectedValueOnce(new Error('Portal failed'));
      await expect(store.openPortal()).rejects.toThrow('Portal failed');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });

  describe('fetchUsageMeter', () => {
    it('should initialize usageMeter and extrasLedger with default state', () => {
      const store = useBillingStore();
      expect(store.usageMeter).toBeNull();
      expect(store.extrasBalance).toBeNull();
      expect(store.extrasLedger).toEqual({ entries: [], total: 0, page: 1, limit: 20 });
    });

    it('should fetch and set usageMeter from backend payload', async () => {
      const store = useBillingStore();
      const mockMeter = {
        plan: 'pro',
        planVersion: 'v1',
        weekKey: '2026-W18',
        weekResetAt: '2026-05-04T00:00:00Z',
        meterUsed: 1234,
        meterQuota: 8000,
        meterBreakdown: { scrap: 800, autofix: 434 },
        extrasRemaining: 12500,
        packsAvailable: [],
      };
      axios.get.mockResolvedValueOnce({ data: { data: mockMeter } });
      const result = await store.fetchUsageMeter();
      expect(store.usageMeter).toEqual(mockMeter);
      expect(result).toEqual(mockMeter);
      // Uses per-action flag — global loading is untouched
      expect(store.usageMeterRequests).toBe(0);
      expect(store.loading).toBe(false);
    });

    it('should set usageMeterRequests > 0 during fetch, 0 after', async () => {
      const store = useBillingStore();
      let flagDuringFetch = false;
      let globalLoadingDuringFetch = false;
      axios.get.mockImplementationOnce(() => {
        flagDuringFetch = store.usageMeterRequests;
        globalLoadingDuringFetch = store.loading;
        return Promise.resolve({ data: { data: {} } });
      });
      await store.fetchUsageMeter();
      expect(flagDuringFetch).toBe(1);
      // Global loading flag must NOT be toggled by fetchUsageMeter
      expect(globalLoadingDuringFetch).toBe(false);
      expect(store.usageMeterRequests).toBe(0);
    });

    it('should call correct API endpoint for fetchUsageMeter', async () => {
      const store = useBillingStore();
      axios.get.mockResolvedValueOnce({ data: { data: {} } });
      await store.fetchUsageMeter();
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/billing/usage'));
    });

    it('should propagate fetchUsageMeter error to caller', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error('Meter fetch failed'));
      await expect(store.fetchUsageMeter()).rejects.toThrow('Meter fetch failed');
      expect(spy).toHaveBeenCalled();
      expect(store.usageMeterRequests).toBe(0);
      spy.mockRestore();
    });

    it('parallel fetchUsageMeter and fetchExtrasBalance do not interfere with each other loading flags', async () => {
      const store = useBillingStore();
      let usageFlagDuring = false;
      let extrasFlagDuring = false;
      // Both resolve after a microtask
      axios.get
        .mockImplementationOnce(() => {
          usageFlagDuring = store.usageMeterRequests;
          return Promise.resolve({ data: { data: {} } });
        })
        .mockImplementationOnce(() => {
          extrasFlagDuring = store.extrasBalanceRequests;
          return Promise.resolve({ data: { data: {} } });
        });
      await Promise.all([store.fetchUsageMeter(), store.fetchExtrasBalance()]);
      expect(usageFlagDuring).toBe(1);
      expect(extrasFlagDuring).toBe(1);
      expect(store.usageMeterRequests).toBe(0);
      expect(store.extrasBalanceRequests).toBe(0);
      // Global loading flag must remain false throughout
      expect(store.loading).toBe(false);
    });
  });

  describe('fetchExtrasBalance', () => {
    it('should fetch and set extrasBalance', async () => {
      const store = useBillingStore();
      const mockBalance = { balance: 5000, packsAvailable: [{ id: 'pack_500', credits: 500 }] };
      axios.get.mockResolvedValueOnce({ data: { data: mockBalance } });
      const result = await store.fetchExtrasBalance();
      expect(store.extrasBalance).toEqual(mockBalance);
      expect(result).toEqual(mockBalance);
      expect(store.extrasBalanceRequests).toBe(0);
      expect(store.loading).toBe(false);
    });

    it('should set extrasBalanceRequests > 0 during fetch, 0 after', async () => {
      const store = useBillingStore();
      let flagDuringFetch = false;
      axios.get.mockImplementationOnce(() => {
        flagDuringFetch = store.extrasBalanceRequests;
        return Promise.resolve({ data: { data: {} } });
      });
      await store.fetchExtrasBalance();
      expect(flagDuringFetch).toBe(1);
      expect(store.extrasBalanceRequests).toBe(0);
    });

    it('should call correct API endpoint for fetchExtrasBalance', async () => {
      const store = useBillingStore();
      axios.get.mockResolvedValueOnce({ data: { data: {} } });
      await store.fetchExtrasBalance();
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/billing/extras/balance'));
    });

    it('should propagate fetchExtrasBalance error to caller', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error('Balance fetch failed'));
      await expect(store.fetchExtrasBalance()).rejects.toThrow('Balance fetch failed');
      expect(spy).toHaveBeenCalled();
      expect(store.extrasBalanceRequests).toBe(0);
      spy.mockRestore();
    });
  });

  describe('fetchExtrasLedger', () => {
    it('should fetch and set extrasLedger with default pagination', async () => {
      const store = useBillingStore();
      const mockLedger = {
        entries: [{ id: 'tx_1', credits: 500, createdAt: '2026-04-01' }],
        total: 1,
        page: 1,
        limit: 20,
      };
      axios.get.mockResolvedValueOnce({ data: { data: mockLedger } });
      const result = await store.fetchExtrasLedger();
      expect(store.extrasLedger).toEqual(mockLedger);
      expect(result).toEqual(mockLedger);
      expect(store.extrasLedgerRequests).toBe(0);
      expect(store.loading).toBe(false);
    });

    it('should set extrasLedgerRequests > 0 during fetch, 0 after', async () => {
      const store = useBillingStore();
      let flagDuringFetch = false;
      axios.get.mockImplementationOnce(() => {
        flagDuringFetch = store.extrasLedgerRequests;
        return Promise.resolve({ data: { data: { entries: [], total: 0, page: 1, limit: 20 } } });
      });
      await store.fetchExtrasLedger();
      expect(flagDuringFetch).toBe(1);
      expect(store.extrasLedgerRequests).toBe(0);
    });

    it('should call API endpoint with correct pagination params', async () => {
      const store = useBillingStore();
      axios.get.mockResolvedValueOnce({
        data: { data: { entries: [], total: 0, page: 2, limit: 10 } },
      });
      await store.fetchExtrasLedger({ page: 2, limit: 10 });
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/billing/extras/ledger'),
        expect.objectContaining({ params: { page: 2, limit: 10 } }),
      );
    });

    it('should default to page 1 and limit 20', async () => {
      const store = useBillingStore();
      axios.get.mockResolvedValueOnce({
        data: { data: { entries: [], total: 0, page: 1, limit: 20 } },
      });
      await store.fetchExtrasLedger();
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/billing/extras/ledger'),
        expect.objectContaining({ params: { page: 1, limit: 20 } }),
      );
    });

    it('should propagate fetchExtrasLedger error to caller', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error('Ledger fetch failed'));
      await expect(store.fetchExtrasLedger()).rejects.toThrow('Ledger fetch failed');
      expect(spy).toHaveBeenCalled();
      expect(store.extrasLedgerRequests).toBe(0);
      spy.mockRestore();
    });
  });

  describe('createExtrasCheckout', () => {
    it('should call extras checkout API with correct packId and redirect URLs', async () => {
      const store = useBillingStore();
      const checkoutUrl = 'https://checkout.stripe.com/extras_session123';
      axios.post.mockResolvedValueOnce({ data: { data: { url: checkoutUrl } } });

      const originalLocation = window.location;
      delete window.location;
      window.location = {
        ...originalLocation,
        origin: 'https://app.example.com',
        assign: vi.fn(),
      };

      await store.createExtrasCheckout('pack_500');

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/billing/extras/checkout'),
        expect.objectContaining({
          packId: 'pack_500',
          successUrl: 'https://app.example.com/users?tab=subscriptions&success=true&type=extras',
          cancelUrl: 'https://app.example.com/pricing?canceled=true#units',
        }),
      );
      expect(window.location.assign).toHaveBeenCalledWith(checkoutUrl);
      expect(store.extrasCheckoutRequests).toBe(0);
      expect(store.loading).toBe(false);

      window.location = originalLocation;
    });

    it('should set extrasCheckoutRequests > 0 during checkout, 0 after', async () => {
      const store = useBillingStore();
      let flagDuringFetch = false;
      const checkoutUrl = 'https://checkout.stripe.com/extras_session_flag';
      axios.post.mockImplementationOnce(() => {
        flagDuringFetch = store.extrasCheckoutRequests;
        return Promise.resolve({ data: { data: { url: checkoutUrl } } });
      });

      const originalLocation = window.location;
      delete window.location;
      window.location = {
        ...originalLocation,
        origin: 'https://app.example.com',
        assign: vi.fn(),
      };

      await store.createExtrasCheckout('pack_500');
      expect(flagDuringFetch).toBe(1);
      expect(store.extrasCheckoutRequests).toBe(0);

      window.location = originalLocation;
    });

    it('should throw and not redirect when URL is absent in API response', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.post.mockResolvedValueOnce({ data: { data: {} } });

      const originalLocation = window.location;
      delete window.location;
      window.location = {
        ...originalLocation,
        origin: 'https://app.example.com',
        assign: vi.fn(),
      };

      await expect(store.createExtrasCheckout('pack_500')).rejects.toThrow('Checkout URL missing in response');
      expect(window.location.assign).not.toHaveBeenCalled();
      expect(store.extrasCheckoutRequests).toBe(0);

      window.location = originalLocation;
      spy.mockRestore();
    });

    it('should reject non-HTTPS checkout URLs', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.post.mockResolvedValueOnce({ data: { data: { url: 'http://evil.example.com/checkout' } } });

      const originalLocation = window.location;
      delete window.location;
      window.location = {
        ...originalLocation,
        origin: 'https://app.example.com',
        assign: vi.fn(),
      };

      await expect(store.createExtrasCheckout('pack_500')).rejects.toThrow('Rejected non-HTTPS checkout URL');
      expect(window.location.assign).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
      expect(store.extrasCheckoutRequests).toBe(0);

      window.location = originalLocation;
      spy.mockRestore();
    });

    it('should propagate createExtrasCheckout error to caller', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.post.mockRejectedValueOnce(new Error('Extras checkout failed'));
      await expect(store.createExtrasCheckout('pack_500')).rejects.toThrow('Extras checkout failed');
      expect(spy).toHaveBeenCalled();
      expect(store.extrasCheckoutRequests).toBe(0);
      spy.mockRestore();
    });
  });
});
