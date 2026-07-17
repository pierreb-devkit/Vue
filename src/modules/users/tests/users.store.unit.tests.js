import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUsersStore } from '../stores/users.store';
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

describe('Users Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('updateProfile', () => {
    it('PUTs the whitelisted profile fields to /users and returns the response data', async () => {
      const usersStore = useUsersStore();
      const updatedUser = {
        firstName: 'Jane',
        lastName: 'Smith',
        bio: 'Developer',
        position: 'Senior',
      };
      axios.put.mockResolvedValueOnce({ data: { data: updatedUser } });

      const result = await usersStore.updateProfile({
        firstName: 'Jane',
        lastName: 'Smith',
        bio: 'Developer',
        position: 'Senior',
        _id: 'should-not-be-sent',
        roles: ['admin'],
      });

      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        { firstName: 'Jane', lastName: 'Smith', bio: 'Developer', position: 'Senior' },
      );
      // Only the 4 profile fields are sent — no _id / roles leakage
      const sentPayload = axios.put.mock.calls[0][1];
      expect(sentPayload).not.toHaveProperty('_id');
      expect(sentPayload).not.toHaveProperty('roles');
      expect(result).toEqual(updatedUser);
    });

    it('logs and rethrows on failure', async () => {
      const usersStore = useUsersStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.put.mockRejectedValueOnce(new Error('Failed to update profile'));

      await expect(
        usersStore.updateProfile({ firstName: 'Jane', lastName: 'Smith', bio: '', position: '' }),
      ).rejects.toThrow('Failed to update profile');

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteAccount', () => {
    it('DELETEs /users', async () => {
      const usersStore = useUsersStore();
      axios.delete.mockResolvedValueOnce({ data: { success: true } });

      await usersStore.deleteAccount();

      expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/users'));
    });

    it('logs and rethrows on failure', async () => {
      const usersStore = useUsersStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axios.delete.mockRejectedValueOnce(new Error('Failed to delete account'));

      await expect(usersStore.deleteAccount()).rejects.toThrow('Failed to delete account');

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
