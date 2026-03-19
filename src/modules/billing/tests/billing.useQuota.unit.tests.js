import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBillingStore } from '../stores/billing.store';
import { useQuota } from '../composables/billing.useQuota';
import axios from '../../../lib/services/axios';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('useQuota composable', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useBillingStore();
    vi.clearAllMocks();
  });

  describe('fetchUsage', () => {
    it('should call correct API endpoint', async () => {
      axios.get.mockResolvedValueOnce({ data: { data: {} } });
      await store.fetchUsage();
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/billing/usage'));
    });

    it('should store quota data', async () => {
      const mockQuota = {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 5 },
        limits: { 'documents.create': 20 },
      };
      axios.get.mockResolvedValueOnce({ data: { data: mockQuota } });
      await store.fetchUsage();
      expect(store.quota).toEqual(mockQuota);
    });

    it('should propagate fetchUsage error to caller', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error('Network error'));
      await expect(store.fetchUsage()).rejects.toThrow('Network error');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });

  describe('canDo', () => {
    it('should return true when under limit', () => {
      store.quota = {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 5 },
        limits: { 'documents.create': 20 },
      };
      const { canDo } = useQuota();
      expect(canDo('documents', 'create')).toBe(true);
    });

    it('should return false when at limit', () => {
      store.quota = {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 20 },
        limits: { 'documents.create': 20 },
      };
      const { canDo } = useQuota();
      expect(canDo('documents', 'create')).toBe(false);
    });

    it('should return false when over limit', () => {
      store.quota = {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 25 },
        limits: { 'documents.create': 20 },
      };
      const { canDo } = useQuota();
      expect(canDo('documents', 'create')).toBe(false);
    });

    it('should return true when limit is Infinity', () => {
      store.quota = {
        plan: 'pro',
        period: '2026-03',
        usage: { 'requests.execute': 9999 },
        limits: { 'requests.execute': Infinity },
      };
      const { canDo } = useQuota();
      expect(canDo('requests', 'execute')).toBe(true);
    });

    it('should return true when limit is undefined', () => {
      store.quota = {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 5 },
        limits: {},
      };
      const { canDo } = useQuota();
      expect(canDo('documents', 'create')).toBe(true);
    });

    it('should return true when limit is null', () => {
      store.quota = {
        plan: 'starter',
        period: '2026-03',
        usage: {},
        limits: { 'documents.create': null },
      };
      const { canDo } = useQuota();
      expect(canDo('documents', 'create')).toBe(true);
    });
  });

  describe('usagePercent', () => {
    it('should return correct percentage', () => {
      store.quota = {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 5 },
        limits: { 'documents.create': 20 },
      };
      const { usagePercent } = useQuota();
      expect(usagePercent('documents', 'create')).toBe(25);
    });

    it('should cap at 100', () => {
      store.quota = {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 30 },
        limits: { 'documents.create': 20 },
      };
      const { usagePercent } = useQuota();
      expect(usagePercent('documents', 'create')).toBe(100);
    });

    it('should return 0 for Infinity limits', () => {
      store.quota = {
        plan: 'pro',
        period: '2026-03',
        usage: { 'requests.execute': 500 },
        limits: { 'requests.execute': Infinity },
      };
      const { usagePercent } = useQuota();
      expect(usagePercent('requests', 'execute')).toBe(0);
    });

    it('should return 0 for undefined limits', () => {
      store.quota = {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 5 },
        limits: {},
      };
      const { usagePercent } = useQuota();
      expect(usagePercent('documents', 'create')).toBe(0);
    });

    it('should round to nearest integer', () => {
      store.quota = {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 1 },
        limits: { 'documents.create': 3 },
      };
      const { usagePercent } = useQuota();
      expect(usagePercent('documents', 'create')).toBe(33);
    });
  });

  describe('refresh', () => {
    it('should trigger store fetchUsage', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          data: {
            plan: 'starter',
            period: '2026-03',
            usage: {},
            limits: {},
          },
        },
      });
      const { refresh } = useQuota();
      await refresh();
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/billing/usage'));
    });
  });

  describe('computed defaults', () => {
    it('should default plan to free when quota is null', () => {
      const { plan } = useQuota();
      expect(plan.value).toBe('free');
    });

    it('should default period to empty string when quota is null', () => {
      const { period } = useQuota();
      expect(period.value).toBe('');
    });

    it('should default usage to empty object when quota is null', () => {
      const { usage } = useQuota();
      expect(usage.value).toEqual({});
    });

    it('should default limits to empty object when quota is null', () => {
      const { limits } = useQuota();
      expect(limits.value).toEqual({});
    });

    it('should reflect store loading state', () => {
      const { loading } = useQuota();
      expect(loading.value).toBe(false);
      store.loading = true;
      expect(loading.value).toBe(true);
    });
  });
});
