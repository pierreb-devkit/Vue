import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../stores/auth.store';

describe('Auth Store', () => {
  beforeEach(() => {
    // Create a new pinia instance for each test
    setActivePinia(createPinia());
    // Clear localStorage
    localStorage.clear();
  });

  it('should initialize with default state', () => {
    const authStore = useAuthStore();
    expect(authStore.auth).toBe(false);
    expect(authStore.user).toBe(null);
    expect(authStore.cookieExpire).toBe(0);
  });

  it('should have isLoggedIn getter returning false by default', () => {
    const authStore = useAuthStore();
    expect(authStore.isLoggedIn).toBe(false);
  });

  it('should have isLoggedIn getter returning true when cookieExpire is set', () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 1000;
    expect(authStore.isLoggedIn).toBe(true);
  });

  it('should initialize from localStorage', () => {
    const expireTime = Date.now() + 3600000;
    localStorage.setItem('waosCookieExpire', expireTime.toString());

    const authStore = useAuthStore();
    authStore.initFromStorage();

    expect(authStore.cookieExpire).toBe(expireTime.toString());
  });

  it('should clear auth data on signout', async () => {
    const authStore = useAuthStore();

    // Set some data
    authStore.auth = true;
    authStore.cookieExpire = Date.now() + 1000;
    authStore.user = { id: '123', email: 'test@example.com' };
    localStorage.setItem('waosUserRoles', 'user,admin');
    localStorage.setItem('waosCookieExpire', '12345');

    await authStore.signout();

    expect(authStore.auth).toBe(false);
    expect(authStore.cookieExpire).toBe(0);
    expect(authStore.user).toBe(null);
    expect(localStorage.getItem('waosUserRoles')).toBe(null);
    expect(localStorage.getItem('waosCookieExpire')).toBe(null);
  });

  it('should have mail state initialized', () => {
    const authStore = useAuthStore();
    expect(authStore.mail).toEqual({
      status: false,
      message: '',
    });
  });
});
