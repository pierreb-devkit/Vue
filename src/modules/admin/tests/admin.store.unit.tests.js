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

    it('should handle error', async () => {
      const store = useAdminStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed'));

      await store.getUsers('0&10');

      expect(store.users).toEqual([]);
      expect(consoleLogSpy).toHaveBeenCalled();
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

    it('should handle error', async () => {
      const store = useAdminStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed'));

      await store.getOrganizations('0&10');

      expect(store.organizations).toEqual([]);
      expect(consoleLogSpy).toHaveBeenCalled();
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

    it('should handle error', async () => {
      const store = useAdminStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.put.mockRejectedValueOnce(new Error('Failed'));

      await expect(store.updateUser({ id: '123' })).rejects.toThrow('Failed');

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

    it('should handle error', async () => {
      const store = useAdminStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.delete.mockRejectedValueOnce(new Error('Failed'));

      await expect(store.deleteUser({ id: '999' })).rejects.toThrow('Failed');

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });
});
