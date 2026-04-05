import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAdminStore } from '../stores/admin.store';
import axios from '../../../lib/services/axios';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock config
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
  },
}));

describe('Admin Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with default state', () => {
    const store = useAdminStore();
    expect(store.users).toEqual([]);
    expect(store.organizations).toEqual([]);
    expect(store.error).toBeNull();
    expect(store.readiness).toEqual([]);
    expect(store.user).toEqual({
      firstName: '',
      lastName: '',
      bio: '',
      position: '',
      email: '',
      avatar: '',
      roles: [],
      memberships: [],
      updated: '',
      created: '',
    });
  });

  describe('getUsers', () => {
    it('should fetch and set users', async () => {
      const store = useAdminStore();
      const mockUsers = [
        { id: '1', firstName: 'John' },
        { id: '2', firstName: 'Jane' },
      ];

      axios.get.mockResolvedValueOnce({ data: { data: mockUsers } });

      await store.getUsers('0&10');

      expect(store.users).toEqual(mockUsers);
    });

    it('should handle error and set error state', async () => {
      const store = useAdminStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed'));

      await store.getUsers('0&10');

      expect(store.users).toEqual([]);
      expect(store.error).toBe('Failed to load data. Please try again.');
      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });

    it('should set error from API response message', async () => {
      const store = useAdminStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce({ response: { data: { message: 'Forbidden' } } });

      await store.getUsers('0&10');

      expect(store.error).toBe('Forbidden');
      consoleLogSpy.mockRestore();
    });

    it('should clear error on next action call', async () => {
      const store = useAdminStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed'));
      await store.getUsers('0&10');
      expect(store.error).toBe('Failed to load data. Please try again.');

      axios.get.mockResolvedValueOnce({ data: { data: [] } });
      await store.getUsers('0&10');
      expect(store.error).toBeNull();

      consoleLogSpy.mockRestore();
    });
  });

  describe('getOrganizations', () => {
    it('should fetch organizations with params', async () => {
      const store = useAdminStore();
      const mockOrgs = [{ id: '1', name: 'Org1' }];

      axios.get.mockResolvedValueOnce({ data: { data: mockOrgs } });

      await store.getOrganizations('0&10');

      expect(store.organizations).toEqual(mockOrgs);
    });

    it('should fetch organizations without params', async () => {
      const store = useAdminStore();
      const mockOrgs = [{ id: '1', name: 'Org1' }];

      axios.get.mockResolvedValueOnce({ data: { data: mockOrgs } });

      await store.getOrganizations();

      expect(store.organizations).toEqual(mockOrgs);
    });

    it('should handle error and set error state', async () => {
      const store = useAdminStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed'));

      await store.getOrganizations('0&10');

      expect(store.organizations).toEqual([]);
      expect(store.error).toBe('Failed to load data. Please try again.');
      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('getReadiness', () => {
    it('should fetch and set readiness data', async () => {
      const store = useAdminStore();
      const mockReadiness = [
        { category: 'config', status: 'ok', message: 'Domain configured' },
        { category: 'security', status: 'warning', message: 'JWT secret is default' },
      ];

      axios.get.mockResolvedValueOnce({ data: { data: mockReadiness } });

      await store.getReadiness();

      expect(store.readiness).toEqual(mockReadiness);
    });

    it('should clear stale data on error', async () => {
      const store = useAdminStore();
      store.readiness = [{ category: 'config', status: 'ok', message: 'stale' }];

      axios.get.mockRejectedValueOnce(new Error('Failed'));

      await store.getReadiness();

      expect(store.readiness).toEqual([]);
    });

    it('should set error state when readiness fetch fails', async () => {
      const store = useAdminStore();

      axios.get.mockRejectedValueOnce(new Error('Network error'));

      await store.getReadiness();

      expect(store.error).toBe('Failed to load data. Please try again.');
    });
  });

  describe('sanitizeApiError', () => {
    it('should expose safe short user-facing API messages', async () => {
      const store = useAdminStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce({ response: { data: { message: 'User not found' } } });

      await store.getUsers('0&10');

      expect(store.error).toBe('User not found');
      consoleLogSpy.mockRestore();
    });

    it('should redact messages containing internal details like stack traces', async () => {
      const store = useAdminStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce({
        response: { data: { message: 'Error: at Object.<anonymous> (/app/path/to/file.js:42)' } },
      });

      await store.getUsers('0&10');

      expect(store.error).toBe('Failed to load data. Please try again.');
      consoleLogSpy.mockRestore();
    });

    it('should redact messages longer than 200 characters', async () => {
      const store = useAdminStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce({
        response: { data: { message: 'x'.repeat(201) } },
      });

      await store.getUsers('0&10');

      expect(store.error).toBe('Failed to load data. Please try again.');
      consoleLogSpy.mockRestore();
    });

    it('should allow messages of exactly 200 characters', async () => {
      const store = useAdminStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const safeMsg = 'x'.repeat(200);

      axios.get.mockRejectedValueOnce({
        response: { data: { message: safeMsg } },
      });

      await store.getUsers('0&10');

      expect(store.error).toBe(safeMsg);
      consoleLogSpy.mockRestore();
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const store = useAdminStore();
      store.user = {
        firstName: 'Old',
        lastName: 'Name',
        bio: '',
        position: '',
        email: 'old@example.com',
        avatar: '',
        roles: ['user'],
        memberships: [],
        updated: '',
        created: '',
      };

      const updatedUser = { firstName: 'New', lastName: 'Name', email: 'new@example.com' };

      axios.put.mockResolvedValueOnce({ data: { data: updatedUser } });

      await store.updateUser({ id: '123' });

      expect(store.user).toMatchObject(updatedUser);
    });

    it('should handle error and set error state', async () => {
      const store = useAdminStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.put.mockRejectedValueOnce(new Error('Failed'));

      await expect(store.updateUser({ id: '123' })).rejects.toThrow('Failed');

      expect(store.error).toBe('Failed to load data. Please try again.');
      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('deleteUser', () => {
    it('should delete a user and reset state', async () => {
      const store = useAdminStore();
      store.user = { firstName: 'To', lastName: 'Delete', email: 'del@example.com' };

      axios.delete.mockResolvedValueOnce({ data: { success: true } });

      await store.deleteUser({ id: '999' });

      expect(store.user).toEqual({
        firstName: '',
        lastName: '',
        bio: '',
        position: '',
        email: '',
        avatar: '',
        roles: [],
        memberships: [],
        updated: '',
        created: '',
      });
    });

    it('should handle error and set error state', async () => {
      const store = useAdminStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.delete.mockRejectedValueOnce(new Error('Failed'));

      await expect(store.deleteUser({ id: '999' })).rejects.toThrow('Failed');

      expect(store.error).toBe('Failed to load data. Please try again.');
      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });
});
