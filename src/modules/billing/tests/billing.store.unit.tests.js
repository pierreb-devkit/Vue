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

    it('should propagate fetchPlans error to caller', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
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
      const mockSub = { planId: 'pro', status: 'active' };
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
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
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
    });

    it('should send correct payload with priceId, successUrl, and cancelUrl', async () => {
      const store = useBillingStore();
      axios.post.mockResolvedValueOnce({ data: { data: {} } });
      await store.createCheckout('price_abc');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/billing/checkout'),
        expect.objectContaining({
          priceId: 'price_abc',
          successUrl: expect.stringMatching(/\/billing\?success=true$/),
          cancelUrl: expect.stringMatching(/\/pricing$/),
        }),
      );
    });

    it('should propagate createCheckout error to caller', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      axios.post.mockRejectedValueOnce(new Error('Failed'));
      await expect(store.createCheckout('price_123')).rejects.toThrow('Failed');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });

  describe('openPortal', () => {
    it('should call portal endpoint and redirect without toggling global loading', async () => {
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
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      axios.post.mockResolvedValueOnce({ data: { data: {} } });
      await expect(store.openPortal()).rejects.toThrow('Billing portal URL is missing from the API response');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should propagate openPortal error to caller', async () => {
      const store = useBillingStore();
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      axios.post.mockRejectedValueOnce(new Error('Portal failed'));
      await expect(store.openPortal()).rejects.toThrow('Portal failed');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });
});
