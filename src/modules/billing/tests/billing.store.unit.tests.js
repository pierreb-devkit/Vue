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
        { id: 'plan_1', name: 'Free', price: 0 },
        { id: 'plan_2', name: 'Pro', price: 29 },
      ];

      axios.get.mockResolvedValueOnce({ data: { data: mockPlans } });

      const result = await billingStore.fetchPlans();

      expect(billingStore.plans).toEqual(mockPlans);
      expect(result).toEqual(mockPlans);
      expect(billingStore.loading).toBe(false);
    });

    it('should set loading during fetch', async () => {
      const billingStore = useBillingStore();

      let resolvePromise;
      axios.get.mockReturnValueOnce(new Promise((resolve) => { resolvePromise = resolve; }));

      const promise = billingStore.fetchPlans();
      expect(billingStore.loading).toBe(true);

      resolvePromise({ data: { data: [] } });
      await promise;

      expect(billingStore.loading).toBe(false);
    });

    it('should handle fetchPlans error', async () => {
      const billingStore = useBillingStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed'));

      await billingStore.fetchPlans();

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(billingStore.loading).toBe(false);
      consoleLogSpy.mockRestore();
    });
  });

  describe('fetchSubscription', () => {
    it('should fetch and set subscription', async () => {
      const billingStore = useBillingStore();
      const mockSubscription = { id: 'sub_1', plan: 'Pro', status: 'active' };

      axios.get.mockResolvedValueOnce({ data: { data: mockSubscription } });

      const result = await billingStore.fetchSubscription();

      expect(billingStore.subscription).toEqual(mockSubscription);
      expect(result).toEqual(mockSubscription);
      expect(billingStore.loading).toBe(false);
    });

    it('should set loading during fetch', async () => {
      const billingStore = useBillingStore();

      let resolvePromise;
      axios.get.mockReturnValueOnce(new Promise((resolve) => { resolvePromise = resolve; }));

      const promise = billingStore.fetchSubscription();
      expect(billingStore.loading).toBe(true);

      resolvePromise({ data: { data: null } });
      await promise;

      expect(billingStore.loading).toBe(false);
    });

    it('should handle fetchSubscription error', async () => {
      const billingStore = useBillingStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed'));

      await billingStore.fetchSubscription();

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(billingStore.loading).toBe(false);
      consoleLogSpy.mockRestore();
    });
  });

  describe('createCheckout', () => {
    it('should create checkout and return data', async () => {
      const billingStore = useBillingStore();
      const mockCheckout = { url: 'https://checkout.stripe.com/session_123' };

      axios.post.mockResolvedValueOnce({ data: { data: mockCheckout } });

      const result = await billingStore.createCheckout('price_123');

      expect(result).toEqual(mockCheckout);
      expect(billingStore.loading).toBe(false);
    });

    it('should set loading during checkout creation', async () => {
      const billingStore = useBillingStore();

      let resolvePromise;
      axios.post.mockReturnValueOnce(new Promise((resolve) => { resolvePromise = resolve; }));

      const promise = billingStore.createCheckout('price_123');
      expect(billingStore.loading).toBe(true);

      resolvePromise({ data: { data: { url: 'https://checkout.stripe.com/session_123' } } });
      await promise;

      expect(billingStore.loading).toBe(false);
    });

    it('should handle createCheckout error', async () => {
      const billingStore = useBillingStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Failed'));

      await billingStore.createCheckout('price_123');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(billingStore.loading).toBe(false);
      consoleLogSpy.mockRestore();
    });
  });

  describe('openPortal', () => {
    it('should open portal and redirect', async () => {
      const billingStore = useBillingStore();
      const portalUrl = 'https://billing.stripe.com/portal_123';

      axios.post.mockResolvedValueOnce({ data: { data: { url: portalUrl } } });

      // Mock window.location.href
      const locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
      delete window.location;
      window.location = { href: '', origin: 'http://localhost' };

      await billingStore.openPortal();

      expect(window.location.href).toBe(portalUrl);
      expect(billingStore.loading).toBe(false);

      // Restore window.location
      if (locationDescriptor) {
        Object.defineProperty(window, 'location', locationDescriptor);
      }
    });

    it('should set loading during portal open', async () => {
      const billingStore = useBillingStore();

      let resolvePromise;
      axios.post.mockReturnValueOnce(new Promise((resolve) => { resolvePromise = resolve; }));

      // Mock window.location
      const locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
      delete window.location;
      window.location = { href: '', origin: 'http://localhost' };

      const promise = billingStore.openPortal();
      expect(billingStore.loading).toBe(true);

      resolvePromise({ data: { data: { url: 'https://billing.stripe.com/portal' } } });
      await promise;

      expect(billingStore.loading).toBe(false);

      // Restore window.location
      if (locationDescriptor) {
        Object.defineProperty(window, 'location', locationDescriptor);
      }
    });

    it('should handle openPortal error', async () => {
      const billingStore = useBillingStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Failed'));

      await billingStore.openPortal();

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(billingStore.loading).toBe(false);
      consoleLogSpy.mockRestore();
    });
  });
});
