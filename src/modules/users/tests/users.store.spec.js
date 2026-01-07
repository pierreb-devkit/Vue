import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUsersStore } from '../stores/users.store';

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
});
