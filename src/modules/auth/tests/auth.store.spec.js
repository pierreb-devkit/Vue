import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../stores/auth.store';
import axios from '../../../lib/services/axios';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

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

  describe('signin', () => {
    it('should signin successfully and update store', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      await authStore.signin({ email: 'test@test.com', password: 'password' });

      expect(authStore.auth).toBe(true);
      expect(authStore.user).toEqual(mockResponse.data.user);
      expect(authStore.cookieExpire).toBe(mockResponse.data.tokenExpiresIn);
      expect(localStorage.getItem('waosUserRoles')).toBe('user');
    });

    it('should handle signin error', async () => {
      const authStore = useAuthStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Signin failed'));

      await authStore.signin({ email: 'test@test.com', password: 'wrong' });

      expect(authStore.auth).toBe(false);
      expect(authStore.user).toBe(null);
      expect(localStorage.getItem('token')).toBe(null);
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('signup', () => {
    it('should signup successfully and update store', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: '456', email: 'new@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      await authStore.signup({ email: 'new@test.com', password: 'password123' });

      expect(authStore.auth).toBe(true);
      expect(authStore.user).toEqual(mockResponse.data.user);
      expect(authStore.cookieExpire).toBe(mockResponse.data.tokenExpiresIn);
      expect(localStorage.getItem('waosUserRoles')).toBe('user');
    });

    it('should handle signup error', async () => {
      const authStore = useAuthStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Signup failed'));

      await authStore.signup({ email: 'new@test.com', password: 'password' });

      expect(authStore.auth).toBe(false);
      expect(authStore.user).toBe(null);
      expect(localStorage.getItem('token')).toBe(null);
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('token', () => {
    it('should refresh token successfully and update store', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: '789', email: 'token@test.com', roles: ['user', 'admin'] },
          tokenExpiresIn: Date.now() + 7200000,
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      await authStore.token();

      expect(authStore.auth).toBe(true);
      expect(authStore.user).toEqual(mockResponse.data.user);
      expect(authStore.cookieExpire).toBe(mockResponse.data.tokenExpiresIn);
      expect(localStorage.getItem('waosUserRoles')).toBe('user,admin');
    });

    it('should handle token refresh error', async () => {
      const authStore = useAuthStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Token refresh failed'));

      await authStore.token();

      expect(authStore.auth).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('forgot', () => {
    it('should send forgot password request and update mail state', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          data: { status: true },
          message: 'Reset email sent',
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      await authStore.forgot({ email: 'forgot@test.com' });

      expect(authStore.mail.status).toBe(true);
      expect(authStore.mail.message).toBe('Reset email sent');
    });

    it('should handle forgot password error', async () => {
      const authStore = useAuthStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Forgot password failed'));

      await authStore.forgot({ email: 'forgot@test.com' });

      expect(authStore.mail.status).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('reset', () => {
    it('should reset password successfully and update store', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: '999', email: 'reset@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      await authStore.reset({ token: 'resettoken', password: 'newpassword' });

      expect(authStore.auth).toBe(true);
      expect(authStore.user).toEqual(mockResponse.data.user);
      expect(authStore.cookieExpire).toBe(mockResponse.data.tokenExpiresIn);
      expect(localStorage.getItem('waosUserRoles')).toBe('user');
    });

    it('should handle reset password error', async () => {
      const authStore = useAuthStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Reset failed'));

      await authStore.reset({ token: 'resettoken', password: 'newpassword' });

      expect(authStore.auth).toBe(false);
      expect(authStore.user).toBe(null);
      expect(localStorage.getItem('token')).toBe(null);
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('authStatus getter', () => {
    it('should return the status', () => {
      const authStore = useAuthStore();
      expect(authStore.authStatus).toBeUndefined();
    });
  });
});
