import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDevelopersStore } from '../stores/developers.store';
import axios from '../../../lib/services/axios';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Developers Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const store = useDevelopersStore();
    expect(store.keys).toEqual([]);
    expect(store.keysTotal).toBe(0);
    expect(store.webhooks).toEqual([]);
    expect(store.webhooksTotal).toBe(0);
    expect(store.deliveries).toEqual([]);
    expect(store.deliveriesTotal).toBe(0);
    expect(store.loading).toBe(false);
  });

  // --- API Keys ---

  describe('fetchKeys', () => {
    it('should fetch and set keys with total', async () => {
      const store = useDevelopersStore();
      const mockKeys = [
        { _id: 'k1', name: 'Test Key', prefix: 'dk_test' },
        { _id: 'k2', name: 'Prod Key', prefix: 'dk_prod' },
      ];
      axios.get.mockResolvedValueOnce({ data: { data: mockKeys, total: 2 } });
      const result = await store.fetchKeys();
      expect(store.keys).toEqual(mockKeys);
      expect(store.keysTotal).toBe(2);
      expect(result).toEqual(mockKeys);
      expect(store.loading).toBe(false);
    });

    it('should pass pagination params', async () => {
      const store = useDevelopersStore();
      axios.get.mockResolvedValueOnce({ data: { data: [], total: 0 } });
      await store.fetchKeys(2, 10);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/developers/keys'),
        { params: { page: 2, perPage: 10 } },
      );
    });

    it('should set loading during fetch', async () => {
      const store = useDevelopersStore();
      let loadingDuringFetch = false;
      axios.get.mockImplementationOnce(() => {
        loadingDuringFetch = store.loading;
        return Promise.resolve({ data: { data: [], total: 0 } });
      });
      await store.fetchKeys();
      expect(loadingDuringFetch).toBe(true);
      expect(store.loading).toBe(false);
    });

    it('should fall back to array length when total is missing', async () => {
      const store = useDevelopersStore();
      const mockKeys = [{ _id: 'k1', name: 'Key' }];
      axios.get.mockResolvedValueOnce({ data: { data: mockKeys } });
      await store.fetchKeys();
      expect(store.keysTotal).toBe(1);
    });

    it('should propagate error to caller', async () => {
      const store = useDevelopersStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error('Network error'));
      await expect(store.fetchKeys()).rejects.toThrow('Network error');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });

  describe('createKey', () => {
    it('should create key and prepend to list', async () => {
      const store = useDevelopersStore();
      const mockKey = { _id: 'k1', name: 'New Key', prefix: 'dk_new', plainKey: 'dk_new_full_key' };
      axios.post.mockResolvedValueOnce({ data: { data: mockKey } });
      const result = await store.createKey({ name: 'New Key', scopes: ['read'] });
      expect(result).toEqual(mockKey);
      expect(store.keys[0].name).toBe('New Key');
      expect(store.keys[0].plainKey).toBeUndefined();
      expect(store.loading).toBe(false);
    });

    it('should call correct API endpoint with body', async () => {
      const store = useDevelopersStore();
      const body = { name: 'Test', scopes: ['read', 'write'] };
      axios.post.mockResolvedValueOnce({ data: { data: { _id: 'k1', ...body } } });
      await store.createKey(body);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/developers/keys'),
        body,
      );
    });

    it('should propagate error to caller', async () => {
      const store = useDevelopersStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.post.mockRejectedValueOnce(new Error('Create failed'));
      await expect(store.createKey({ name: 'Test' })).rejects.toThrow('Create failed');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });

  describe('revokeKey', () => {
    it('should revoke key and remove from list', async () => {
      const store = useDevelopersStore();
      store.keys = [
        { _id: 'k1', name: 'Key 1' },
        { _id: 'k2', name: 'Key 2' },
      ];
      axios.delete.mockResolvedValueOnce({});
      await store.revokeKey('k1');
      expect(store.keys).toHaveLength(1);
      expect(store.keys[0]._id).toBe('k2');
      expect(store.loading).toBe(false);
    });

    it('should call correct API endpoint', async () => {
      const store = useDevelopersStore();
      store.keys = [];
      axios.delete.mockResolvedValueOnce({});
      await store.revokeKey('k1');
      expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/developers/keys/k1'));
    });

    it('should propagate error to caller', async () => {
      const store = useDevelopersStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.delete.mockRejectedValueOnce(new Error('Revoke failed'));
      await expect(store.revokeKey('k1')).rejects.toThrow('Revoke failed');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });

  // --- Webhooks ---

  describe('fetchWebhooks', () => {
    it('should fetch and set webhooks with total', async () => {
      const store = useDevelopersStore();
      const mockWebhooks = [{ _id: 'w1', url: 'https://example.com/hook' }];
      axios.get.mockResolvedValueOnce({ data: { data: mockWebhooks, total: 1 } });
      const result = await store.fetchWebhooks();
      expect(store.webhooks).toEqual(mockWebhooks);
      expect(store.webhooksTotal).toBe(1);
      expect(result).toEqual(mockWebhooks);
      expect(store.loading).toBe(false);
    });

    it('should pass pagination params', async () => {
      const store = useDevelopersStore();
      axios.get.mockResolvedValueOnce({ data: { data: [], total: 0 } });
      await store.fetchWebhooks(3, 50);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/developers/webhooks'),
        { params: { page: 3, perPage: 50 } },
      );
    });

    it('should set loading during fetch', async () => {
      const store = useDevelopersStore();
      let loadingDuringFetch = false;
      axios.get.mockImplementationOnce(() => {
        loadingDuringFetch = store.loading;
        return Promise.resolve({ data: { data: [], total: 0 } });
      });
      await store.fetchWebhooks();
      expect(loadingDuringFetch).toBe(true);
      expect(store.loading).toBe(false);
    });

    it('should fall back to array length when total is missing', async () => {
      const store = useDevelopersStore();
      const mockWebhooks = [{ _id: 'w1' }, { _id: 'w2' }];
      axios.get.mockResolvedValueOnce({ data: { data: mockWebhooks } });
      await store.fetchWebhooks();
      expect(store.webhooksTotal).toBe(2);
    });

    it('should propagate error to caller', async () => {
      const store = useDevelopersStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error('Fetch failed'));
      await expect(store.fetchWebhooks()).rejects.toThrow('Fetch failed');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });

  describe('createWebhook', () => {
    it('should create webhook and prepend to list without plainSecret', async () => {
      const store = useDevelopersStore();
      const mockWebhook = { _id: 'w1', url: 'https://example.com', events: ['scrap.success'], plainSecret: 'whsec_abc' };
      axios.post.mockResolvedValueOnce({ data: { data: mockWebhook } });
      const result = await store.createWebhook({ url: 'https://example.com', events: ['scrap.success'] });
      expect(result).toEqual(mockWebhook);
      expect(store.webhooks[0].plainSecret).toBeUndefined();
      expect(store.webhooks[0].url).toBe('https://example.com');
      expect(store.loading).toBe(false);
    });

    it('should call correct API endpoint with body', async () => {
      const store = useDevelopersStore();
      const body = { url: 'https://test.com/hook', events: ['scrap.created'] };
      axios.post.mockResolvedValueOnce({ data: { data: { _id: 'w1', ...body } } });
      await store.createWebhook(body);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/developers/webhooks'),
        body,
      );
    });

    it('should propagate error to caller', async () => {
      const store = useDevelopersStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.post.mockRejectedValueOnce(new Error('Create webhook failed'));
      await expect(store.createWebhook({ url: 'https://test.com' })).rejects.toThrow('Create webhook failed');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });

  describe('updateWebhook', () => {
    it('should update webhook in list', async () => {
      const store = useDevelopersStore();
      store.webhooks = [{ _id: 'w1', url: 'https://old.com', active: true }];
      const updated = { _id: 'w1', url: 'https://old.com', active: false };
      axios.put.mockResolvedValueOnce({ data: { data: updated } });
      const result = await store.updateWebhook('w1', { active: false });
      expect(result).toEqual(updated);
      expect(store.webhooks[0].active).toBe(false);
      expect(store.loading).toBe(false);
    });

    it('should call correct API endpoint with body', async () => {
      const store = useDevelopersStore();
      store.webhooks = [{ _id: 'w1', url: 'https://example.com' }];
      const body = { url: 'https://new.com', events: ['scrap.failure'] };
      axios.put.mockResolvedValueOnce({ data: { data: { _id: 'w1', ...body } } });
      await store.updateWebhook('w1', body);
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/developers/webhooks/w1'),
        body,
      );
    });

    it('should handle webhook not found in list gracefully', async () => {
      const store = useDevelopersStore();
      store.webhooks = [{ _id: 'w1' }];
      const updated = { _id: 'w99', url: 'https://example.com' };
      axios.put.mockResolvedValueOnce({ data: { data: updated } });
      const result = await store.updateWebhook('w99', { url: 'https://example.com' });
      expect(result).toEqual(updated);
      expect(store.webhooks).toHaveLength(1);
      expect(store.webhooks[0]._id).toBe('w1');
    });

    it('should propagate error to caller', async () => {
      const store = useDevelopersStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.put.mockRejectedValueOnce(new Error('Update failed'));
      await expect(store.updateWebhook('w1', {})).rejects.toThrow('Update failed');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook and remove from list', async () => {
      const store = useDevelopersStore();
      store.webhooks = [{ _id: 'w1' }, { _id: 'w2' }];
      axios.delete.mockResolvedValueOnce({});
      await store.deleteWebhook('w1');
      expect(store.webhooks).toHaveLength(1);
      expect(store.webhooks[0]._id).toBe('w2');
      expect(store.loading).toBe(false);
    });

    it('should call correct API endpoint', async () => {
      const store = useDevelopersStore();
      store.webhooks = [];
      axios.delete.mockResolvedValueOnce({});
      await store.deleteWebhook('w1');
      expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/developers/webhooks/w1'));
    });

    it('should propagate error to caller', async () => {
      const store = useDevelopersStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.delete.mockRejectedValueOnce(new Error('Delete failed'));
      await expect(store.deleteWebhook('w1')).rejects.toThrow('Delete failed');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });

  // --- Deliveries ---

  describe('fetchDeliveries', () => {
    it('should fetch and store deliveries', async () => {
      const store = useDevelopersStore();
      const mockDeliveries = [{ _id: 'd1', event: 'scrap.success', statusCode: 200 }];
      axios.get.mockResolvedValueOnce({ data: { data: mockDeliveries, total: 1 } });
      const result = await store.fetchDeliveries('w1');
      expect(store.deliveries).toEqual(mockDeliveries);
      expect(store.deliveriesTotal).toBe(1);
      expect(result).toEqual(mockDeliveries);
      expect(store.loading).toBe(false);
    });

    it('should pass pagination params', async () => {
      const store = useDevelopersStore();
      axios.get.mockResolvedValueOnce({ data: { data: [], total: 0 } });
      await store.fetchDeliveries('w1', 2, 10);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/developers/webhooks/w1/deliveries'),
        { params: { page: 2, perPage: 10 } },
      );
    });

    it('should fall back to array length when total is missing', async () => {
      const store = useDevelopersStore();
      const mockDeliveries = [{ _id: 'd1' }, { _id: 'd2' }];
      axios.get.mockResolvedValueOnce({ data: { data: mockDeliveries } });
      await store.fetchDeliveries('w1');
      expect(store.deliveriesTotal).toBe(2);
    });

    it('should set loading during fetch', async () => {
      const store = useDevelopersStore();
      let loadingDuringFetch = false;
      axios.get.mockImplementationOnce(() => {
        loadingDuringFetch = store.loading;
        return Promise.resolve({ data: { data: [], total: 0 } });
      });
      await store.fetchDeliveries('w1');
      expect(loadingDuringFetch).toBe(true);
      expect(store.loading).toBe(false);
    });

    it('should propagate error to caller', async () => {
      const store = useDevelopersStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error('Delivery fetch failed'));
      await expect(store.fetchDeliveries('w1')).rejects.toThrow('Delivery fetch failed');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });

  // --- Test Webhook ---

  describe('testWebhook', () => {
    it('should send test ping and return result', async () => {
      const store = useDevelopersStore();
      const mockResult = { success: true, statusCode: 200, duration: 150 };
      axios.post.mockResolvedValueOnce({ data: { data: mockResult } });
      const result = await store.testWebhook('w1');
      expect(result).toEqual(mockResult);
      expect(store.loading).toBe(false);
    });

    it('should call correct API endpoint', async () => {
      const store = useDevelopersStore();
      axios.post.mockResolvedValueOnce({ data: { data: {} } });
      await store.testWebhook('w1');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/developers/webhooks/w1/test'),
      );
    });

    it('should set loading during test', async () => {
      const store = useDevelopersStore();
      let loadingDuringTest = false;
      axios.post.mockImplementationOnce(() => {
        loadingDuringTest = store.loading;
        return Promise.resolve({ data: { data: {} } });
      });
      await store.testWebhook('w1');
      expect(loadingDuringTest).toBe(true);
      expect(store.loading).toBe(false);
    });

    it('should propagate error to caller', async () => {
      const store = useDevelopersStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.post.mockRejectedValueOnce(new Error('Test ping failed'));
      await expect(store.testWebhook('w1')).rejects.toThrow('Test ping failed');
      expect(spy).toHaveBeenCalled();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });
});
