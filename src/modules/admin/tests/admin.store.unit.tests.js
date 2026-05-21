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
    expect(store.auditLogs).toEqual([]);
    expect(store.auditTotal).toBe(0);
    expect(store.auditPage).toBe(1);
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
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed'));

      await store.getUsers('0&10');

      expect(store.users).toEqual([]);
      expect(store.error).toBe('Failed to load data. Please try again.');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should set error from API response message', async () => {
      const store = useAdminStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce({ response: { data: { message: 'Forbidden' } } });

      await store.getUsers('0&10');

      expect(store.error).toBe('Forbidden');
      consoleErrorSpy.mockRestore();
    });

    it('should clear error on next action call', async () => {
      const store = useAdminStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed'));
      await store.getUsers('0&10');
      expect(store.error).toBe('Failed to load data. Please try again.');

      axios.get.mockResolvedValueOnce({ data: { data: [] } });
      await store.getUsers('0&10');
      expect(store.error).toBeNull();

      consoleErrorSpy.mockRestore();
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
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed'));

      await store.getOrganizations('0&10');

      expect(store.organizations).toEqual([]);
      expect(store.error).toBe('Failed to load data. Please try again.');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
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
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce({ response: { data: { message: 'User not found' } } });

      await store.getUsers('0&10');

      expect(store.error).toBe('User not found');
      consoleErrorSpy.mockRestore();
    });

    it('should redact messages containing internal details like stack traces', async () => {
      const store = useAdminStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce({
        response: { data: { message: 'Error: at Object.<anonymous> (/app/path/to/file.js:42)' } },
      });

      await store.getUsers('0&10');

      expect(store.error).toBe('Failed to load data. Please try again.');
      consoleErrorSpy.mockRestore();
    });

    it('should redact messages longer than 200 characters', async () => {
      const store = useAdminStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce({
        response: { data: { message: 'x'.repeat(201) } },
      });

      await store.getUsers('0&10');

      expect(store.error).toBe('Failed to load data. Please try again.');
      consoleErrorSpy.mockRestore();
    });

    it('should allow messages of exactly 200 characters', async () => {
      const store = useAdminStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const safeMsg = 'x'.repeat(200);

      axios.get.mockRejectedValueOnce({
        response: { data: { message: safeMsg } },
      });

      await store.getUsers('0&10');

      expect(store.error).toBe(safeMsg);
      consoleErrorSpy.mockRestore();
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

      await store.updateUser({ id: '123' }, { firstName: 'New', email: 'new@example.com' });

      expect(store.user).toMatchObject(updatedUser);
    });

    // Regression: toggleUserRole from the admin users list passes only { roles }
    // as formData while store.user is the untouched defaultUser() placeholder.
    // Merging the two would send empty firstName/lastName/email and _.assignIn
    // on the server wipes those fields in DB. Payload must be the patch alone.
    it('sends only the provided patch, never the stale store.user placeholder', async () => {
      const store = useAdminStore();
      axios.put.mockResolvedValueOnce({ data: { data: { id: '123', roles: ['user', 'admin'] } } });

      await store.updateUser({ id: '123' }, { roles: ['user', 'admin'] });

      expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/admin/users/123'), { roles: ['user', 'admin'] });
    });

    it('should handle error and set error state', async () => {
      const store = useAdminStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      axios.put.mockRejectedValueOnce(new Error('Failed'));

      await expect(store.updateUser({ id: '123' })).rejects.toThrow('Failed');

      expect(store.error).toBe('Failed to load data. Please try again.');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
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
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      axios.delete.mockRejectedValueOnce(new Error('Failed'));

      await expect(store.deleteUser({ id: '999' })).rejects.toThrow('Failed');

      expect(store.error).toBe('Failed to load data. Please try again.');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // Audit API response shape: responses.success() wraps AuditRepository.list() result as
  // { type: 'success', message: '...', data: { data: Array, total, page, perPage } }
  // so axios sees res.data = { type, message, data: { data, total, page, perPage } }
  describe('getAuditLogs', () => {
    it('should fetch and set audit logs', async () => {
      const store = useAdminStore();
      const mockLogs = [
        { _id: '1', action: 'auth.login', userId: 'u1', ip: '127.0.0.1' },
        { _id: '2', action: 'auth.logout', userId: 'u2', ip: '127.0.0.2' },
      ];

      axios.get.mockResolvedValueOnce({
        data: { data: { data: mockLogs, total: 42, page: 1, perPage: 20 } },
      });

      await store.getAuditLogs({ page: 1, perPage: 20 });

      expect(store.auditLogs).toEqual(mockLogs);
      expect(store.auditTotal).toBe(42);
      expect(store.auditPage).toBe(1);
    });

    it('should pass filters as query parameters', async () => {
      const store = useAdminStore();

      axios.get.mockResolvedValueOnce({
        data: { data: { data: [], total: 0, page: 1, perPage: 20 } },
      });

      await store.getAuditLogs({ action: 'auth.login', userId: 'abc123abc123abc123abc123', page: 2, perPage: 10 });

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('action=auth.login'),
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('userId=abc123abc123abc123abc123'),
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('perPage=10'),
      );
    });

    it('should handle error and clear audit logs', async () => {
      const store = useAdminStore();
      store.auditLogs = [{ _id: '1', action: 'stale' }];
      store.auditTotal = 10;

      axios.get.mockRejectedValueOnce(new Error('Failed'));

      await store.getAuditLogs();

      expect(store.auditLogs).toEqual([]);
      expect(store.auditTotal).toBe(0);
      expect(store.error).toBe('Failed to load data. Please try again.');
    });

    it('should handle pagination state correctly', async () => {
      const store = useAdminStore();
      const mockLogs = [{ _id: '1', action: 'test' }];

      axios.get.mockResolvedValueOnce({
        data: { data: { data: mockLogs, total: 100, page: 3, perPage: 10 } },
      });

      await store.getAuditLogs({ page: 3, perPage: 10 });

      expect(store.auditLogs).toEqual(mockLogs);
      expect(store.auditTotal).toBe(100);
      expect(store.auditPage).toBe(3);
    });

    it('should call audit endpoint without query params when no filters', async () => {
      const store = useAdminStore();

      axios.get.mockResolvedValueOnce({
        data: { data: { data: [], total: 0, page: 1, perPage: 20 } },
      });

      await store.getAuditLogs();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/audit'),
      );
    });
  });
});

describe('admin store — currentBreadcrumb', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('defaults to null', () => {
    const store = useAdminStore();
    expect(store.currentBreadcrumb).toBeNull();
  });

  it('setBreadcrumb stores a shallow-copied payload', () => {
    const store = useAdminStore();
    const payload = { title: 'Jane Doe', titleClass: 'text-capitalize' };
    store.setBreadcrumb(payload);
    expect(store.currentBreadcrumb).toEqual(payload);
    expect(store.currentBreadcrumb).not.toBe(payload); // shallow copy
  });

  it('clearBreadcrumb() resets to null', () => {
    const store = useAdminStore();
    store.setBreadcrumb({ title: 'X' });
    store.clearBreadcrumb();
    expect(store.currentBreadcrumb).toBeNull();
  });

  it('setBreadcrumb(null) clears the breadcrumb', () => {
    const store = useAdminStore();
    store.setBreadcrumb({ title: 'X' });
    store.setBreadcrumb(null);
    expect(store.currentBreadcrumb).toBeNull();
  });
});
