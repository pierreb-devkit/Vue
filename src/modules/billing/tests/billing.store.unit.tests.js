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
  });

  it('should initialize with default state', () => {
    const billingStore = useBillingStore();
    expect(billingStore.plans).toEqual([]);
    expect(billingStore.subscription).toBeNull();
    expect(billingStore.loading).toBe(false);
  });

  describe('fetchPlans', () => {
    it('should fetch and set plans', async () => {
      const billingStore = useBillingStore();
      const mockPlans = [
        { id: 'free', name: 'Free' },
        { id: 'pro', name: 'Pro', monthlyPrice: 9.99 },
      ];

      axios.get.mockResolvedValueOnce({ data: { data: mockPlans } });

      const result = await billingStore.fetchPlans();

      expect(billingStore.plans).toEqual(mockPlans);
      expect(result).toEqual(mockPlans);
      expect(billingStore.loading).toBe(false);
    });

    it('should set loading during fetch', async () => {
      const billingStore = useBillingStore();
      let loadingDuringFetch = false;

      axios.get.mockImplementationOnce(() => {
        loadingDuringFetch = billingStore.loading;
        return Promise.resolve({ data: { data: [] } });
      });

      await billingStore.fetchPlans();

      expect(loadingDuringFetch).toBe(true);
      expect(billingStore.loading).toBe(false);
    });

    it('should handle fetchPlans error', async () => {
      const billingStore = useBillingStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Network error'));

      await billingStore.fetchPlans();

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(billingStore.loading).toBe(false);
      consoleLogSpy.mockRestore();
    });
  });

  describe('fetchSubscription', () => {
    it('should fetch and set subscription', async () => {
      const billingStore = useBillingStore();
      const mockSubscription = { planId: 'pro', status: 'active' };

      axios.get.mockResolvedValueOnce({ data: { data: mockSubscription } });

      const result = await billingStore.fetchSubscription();

      expect(billingStore.subscription).toEqual(mockSubscription);
      expect(result).toEqual(mockSubscription);
      expect(billingStore.loading).toBe(false);
    });

    it('should handle fetchSubscription error', async () => {
      const billingStore = useBillingStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Unauthorized'));

      await billingStore.fetchSubscription();

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(billingStore.loading).toBe(false);
      consoleLogSpy.mockRestore();
    });
  });

  describe('createCheckout', () => {
    it('should create checkout session and return data', async () => {
      const billingStore = useBillingStore();
      const mockCheckout = { url: 'https://checkout.stripe.com/session_123' };

      axios.post.mockResolvedValueOnce({ data: { data: mockCheckout } });

      const result = await billingStore.createCheckout('price_123');

      expect(result).toEqual(mockCheckout);
      expect(billingStore.loading).toBe(false);
    });

    it('should send correct payload with priceId and URLs', async () => {
      const billingStore = useBillingStore();

      axios.post.mockResolvedValueOnce({ data: { data: {} } });

      await billingStore.createCheckout('price_456');

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/checkout'),
        expect.objectContaining({
          priceId: 'price_456',
          successUrl: expect.stringContaining('/billing?success=true'),
          cancelUrl: expect.stringContaining('/pricing'),
        }),
      );
    });

    it('should handle createCheckout error', async () => {
      const billingStore = useBillingStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Payment error'));

      await billingStore.createCheckout('price_123');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(billingStore.loading).toBe(false);
      consoleLogSpy.mockRestore();
    });
  });

  describe('openPortal', () => {
    it('should open portal and redirect', async () => {
      const billingStore = useBillingStore();
      const mockPortal = { url: 'https://billing.stripe.com/portal_123' };

      // Mock window.location.href
      const originalHref = window.location.href;
      delete window.location;
      window.location = { href: originalHref, origin: 'http://localhost' };

      axios.post.mockResolvedValueOnce({ data: { data: mockPortal } });

      await billingStore.openPortal();

      expect(window.location.href).toBe(mockPortal.url);
      expect(billingStore.loading).toBe(false);
    });

    it('should handle openPortal error', async () => {
      const billingStore = useBillingStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Portal error'));

      await billingStore.openPortal();

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(billingStore.loading).toBe(false);
      consoleLogSpy.mockRestore();
    });
  });
});
