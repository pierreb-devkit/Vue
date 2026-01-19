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

describe('Users Store', () => {
  beforeEach(() => {
    // Create a new pinia instance for each test
    setActivePinia(createPinia());
  });

  it('should initialize with default state', () => {
    const usersStore = useUsersStore();
    expect(usersStore.users).toEqual([]);
    expect(usersStore.user).toEqual({
      firstName: '',
      lastName: '',
      bio: '',
      position: '',
      email: '',
      avatar: '',
      roles: [],
      updated: '',
      created: '',
    });
  });

  it('should reset user to default values', () => {
    const usersStore = useUsersStore();

    // Modify user
    usersStore.user.firstName = 'John';
    usersStore.user.lastName = 'Doe';
    usersStore.user.email = 'john@example.com';
    usersStore.user.roles = ['admin'];

    expect(usersStore.user.firstName).toBe('John');
    expect(usersStore.user.email).toBe('john@example.com');

    // Reset
    usersStore.resetUser();

    expect(usersStore.user).toEqual({
      firstName: '',
      lastName: '',
      bio: '',
      position: '',
      email: '',
      avatar: '',
      roles: [],
      updated: '',
      created: '',
    });
  });

  it('should allow updating user properties', () => {
    const usersStore = useUsersStore();

    usersStore.user.firstName = 'Jane';
    usersStore.user.lastName = 'Smith';
    usersStore.user.email = 'jane@example.com';
    usersStore.user.position = 'Developer';

    expect(usersStore.user.firstName).toBe('Jane');
    expect(usersStore.user.lastName).toBe('Smith');
    expect(usersStore.user.email).toBe('jane@example.com');
    expect(usersStore.user.position).toBe('Developer');
  });

  it('should maintain users array', () => {
    const usersStore = useUsersStore();
    const mockUsers = [
      { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
    ];

    usersStore.users = mockUsers;

    expect(usersStore.users).toEqual(mockUsers);
    expect(usersStore.users.length).toBe(2);
  });

  describe('getUsers', () => {
    it('should fetch and set users with pagination', async () => {
      const usersStore = useUsersStore();
      const mockUsers = [
        { id: '1', firstName: 'John', lastName: 'Doe' },
        { id: '2', firstName: 'Jane', lastName: 'Smith' },
      ];

      axios.get.mockResolvedValueOnce({ data: { data: mockUsers } });

      await usersStore.getUsers('0&10');

      expect(usersStore.users).toEqual(mockUsers);
    });

    it('should handle getUsers error', async () => {
      const usersStore = useUsersStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed to fetch users'));

      await usersStore.getUsers('0&10');

      expect(usersStore.users).toEqual([]);
      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('getUser', () => {
    it('should fetch and set single user', async () => {
      const usersStore = useUsersStore();
      const mockUser = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        bio: 'Developer',
        position: 'Senior',
        avatar: '/avatar.jpg',
        roles: ['admin'],
        updated: '2024-01-01',
        created: '2023-01-01',
      };

      axios.get.mockResolvedValueOnce({ data: { data: mockUser } });

      await usersStore.getUser({ id: '123' });

      expect(usersStore.user).toEqual(mockUser);
    });

    it('should handle getUser error', async () => {
      const usersStore = useUsersStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed to fetch user'));

      await usersStore.getUser({ id: '123' });

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const usersStore = useUsersStore();
      usersStore.user = {
        id: '789',
        firstName: 'Old',
        lastName: 'Name',
        email: 'old@example.com',
        bio: 'Old bio',
        position: 'Junior',
        avatar: '/old.jpg',
        roles: ['user'],
        updated: '2023-01-01',
        created: '2022-01-01',
      };

      const updatedUser = {
        id: '789',
        firstName: 'New',
        lastName: 'Name',
        email: 'new@example.com',
        bio: 'New bio',
        position: 'Senior',
        avatar: '/new.jpg',
        roles: ['admin', 'user'],
        updated: '2024-01-01',
        created: '2022-01-01',
      };

      axios.put.mockResolvedValueOnce({ data: { data: updatedUser } });

      await usersStore.updateUser({ id: '789' });

      expect(usersStore.user).toMatchObject(updatedUser);
    });

    it('should handle updateUser error', async () => {
      const usersStore = useUsersStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.put.mockRejectedValueOnce(new Error('Failed to update user'));

      await usersStore.updateUser({ id: '789' });

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('deleteUser', () => {
    it('should delete a user and reset', async () => {
      const usersStore = useUsersStore();
      usersStore.user = {
        id: '999',
        firstName: 'To',
        lastName: 'Delete',
        email: 'delete@example.com',
        bio: 'Delete me',
        position: 'Temporary',
        avatar: '/temp.jpg',
        roles: ['user'],
        updated: '2024-01-01',
        created: '2023-01-01',
      };

      axios.delete.mockResolvedValueOnce({ data: { success: true } });

      await usersStore.deleteUser({ id: '999' });

      expect(usersStore.user).toEqual({
        firstName: '',
        lastName: '',
        bio: '',
        position: '',
        email: '',
        avatar: '',
        roles: [],
        updated: '',
        created: '',
      });
    });

    it('should handle deleteUser error', async () => {
      const usersStore = useUsersStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.delete.mockRejectedValueOnce(new Error('Failed to delete user'));

      await usersStore.deleteUser({ id: '999' });

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });
});
