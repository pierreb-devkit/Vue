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

describe('Billing Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const store = useBillingStore();
    expect(store.plans).toEqual([]);
    expect(store.subscription).toBeNull();
    expect(store.loading).toBe(false);
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

    it('should handle fetchPlans error', async () => {
      const store = useBillingStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Network error'));

      await store.fetchPlans();

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      consoleLogSpy.mockRestore();
    });
  });

  describe('fetchSubscription', () => {
    it('should fetch and set subscription', async () => {
      const store = useBillingStore();
      const mockSubscription = { planId: 'pro', status: 'active' };

      axios.get.mockResolvedValueOnce({ data: { data: mockSubscription } });

      const result = await store.fetchSubscription();

      expect(store.subscription).toEqual(mockSubscription);
      expect(result).toEqual(mockSubscription);
      expect(store.loading).toBe(false);
    });

    it('should call correct API endpoint', async () => {
      const store = useBillingStore();
      axios.get.mockResolvedValueOnce({ data: { data: {} } });

      await store.fetchSubscription();

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/billing/subscription'));
    });

    it('should handle fetchSubscription error', async () => {
      const store = useBillingStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed'));

      await store.fetchSubscription();

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      consoleLogSpy.mockRestore();
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
    });

    it('should send correct payload with priceId', async () => {
      const store = useBillingStore();
      axios.post.mockResolvedValueOnce({ data: { data: {} } });

      await store.createCheckout('price_abc');

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/billing/checkout'),
        expect.objectContaining({
          priceId: 'price_abc',
        }),
      );
    });

    it('should handle createCheckout error', async () => {
      const store = useBillingStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Failed'));

      await store.createCheckout('price_123');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      consoleLogSpy.mockRestore();
    });
  });

  describe('openPortal', () => {
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

    it('should handle openPortal error', async () => {
      const store = useBillingStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Portal failed'));

      await store.openPortal();

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      consoleLogSpy.mockRestore();
    });
  });
});
