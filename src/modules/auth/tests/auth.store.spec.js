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

// Mock ability helper
const mockUpdateAbilities = vi.fn();
vi.mock('../../../lib/helpers/ability', () => ({
  updateAbilities: (...args) => mockUpdateAbilities(...args),
}));

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    // Reset ability mock
    mockUpdateAbilities.mockClear();
  });

  it('should initialize with default state', () => {
    const authStore = useAuthStore();
    expect(authStore.auth).toBe(false);
    expect(authStore.user).toBe(null);
    expect(authStore.cookieExpire).toBe(0);
    expect(authStore.serverConfig).toBe(null);
  });

  it('should initialize lockout state', () => {
    const authStore = useAuthStore();
    expect(authStore.lockout).toEqual({ locked: false, retryAfter: 0 });
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
    localStorage.setItem('devkitCookieExpire', expireTime.toString());

    const authStore = useAuthStore();
    authStore.initFromStorage();

    expect(authStore.cookieExpire).toBe(expireTime.toString());
  });

  it('should clear auth data and lastLoginAt on signout', async () => {
    const authStore = useAuthStore();

    authStore.auth = true;
    authStore.cookieExpire = Date.now() + 1000;
    authStore.user = { id: '123', email: 'test@example.com' };
    localStorage.setItem('devkitUserRoles', 'user,admin');
    localStorage.setItem('devkitCookieExpire', '12345');
    localStorage.setItem('devkitLastLoginAt', '2026-01-01T00:00:00Z');

    await authStore.signout();

    expect(authStore.auth).toBe(false);
    expect(authStore.cookieExpire).toBe(0);
    expect(authStore.user).toBe(null);
    expect(localStorage.getItem('devkitUserRoles')).toBe(null);
    expect(localStorage.getItem('devkitCookieExpire')).toBe(null);
    expect(localStorage.getItem('devkitLastLoginAt')).toBe(null);
  });

  it('should have mail state initialized', () => {
    const authStore = useAuthStore();
    expect(authStore.mail).toEqual({ status: false, message: '' });
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
      expect(localStorage.getItem('devkitUserRoles')).toBe('user');
    });

    it('should clear lockout on successful signin', async () => {
      const authStore = useAuthStore();
      authStore.lockout = { locked: true, retryAfter: 300 };
      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      await authStore.signin({ email: 'test@test.com', password: 'password' });

      expect(authStore.lockout).toEqual({ locked: false, retryAfter: 0 });
    });

    it('should store lastLoginAt when present in response', async () => {
      const authStore = useAuthStore();
      const lastLogin = '2026-03-09T14:30:00Z';
      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@test.com', roles: ['user'], lastLoginAt: lastLogin },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      await authStore.signin({ email: 'test@test.com', password: 'password' });

      expect(localStorage.getItem('devkitLastLoginAt')).toBe(lastLogin);
    });

    it('should handle 423 lockout response', async () => {
      const authStore = useAuthStore();

      const lockoutError = new Error('Account locked');
      lockoutError.response = { status: 423, data: { retryAfter: 300 } };
      axios.post.mockRejectedValueOnce(lockoutError);

      await authStore.signin({ email: 'test@test.com', password: 'wrong' });

      expect(authStore.lockout).toEqual({ locked: true, retryAfter: 300 });
      expect(authStore.auth).toBe(false);
    });

    it('should handle 423 lockout with missing retryAfter', async () => {
      const authStore = useAuthStore();

      const lockoutError = new Error('Account locked');
      lockoutError.response = { status: 423, data: {} };
      axios.post.mockRejectedValueOnce(lockoutError);

      await authStore.signin({ email: 'test@test.com', password: 'wrong' });

      expect(authStore.lockout).toEqual({ locked: true, retryAfter: 0 });
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

  describe('clearLockout', () => {
    it('should reset lockout state', () => {
      const authStore = useAuthStore();
      authStore.lockout = { locked: true, retryAfter: 120 };

      authStore.clearLockout();

      expect(authStore.lockout).toEqual({ locked: false, retryAfter: 0 });
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
      expect(localStorage.getItem('devkitUserRoles')).toBe('user');
    });

    it('should handle signup error', async () => {
      const authStore = useAuthStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Signup failed'));
      await authStore.signup({ email: 'new@test.com', password: 'password' });

      expect(authStore.auth).toBe(false);
      expect(authStore.user).toBe(null);
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
      expect(localStorage.getItem('devkitUserRoles')).toBe('user,admin');
    });

    it('should store lastLoginAt on token refresh', async () => {
      const authStore = useAuthStore();
      const lastLogin = '2026-03-09T10:00:00Z';
      const mockResponse = {
        data: {
          user: { id: '789', email: 'token@test.com', roles: ['user'], lastLoginAt: lastLogin },
          tokenExpiresIn: Date.now() + 7200000,
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);
      await authStore.token();

      expect(localStorage.getItem('devkitLastLoginAt')).toBe(lastLogin);
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
        data: { data: { status: true }, message: 'Reset email sent' },
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
      expect(localStorage.getItem('devkitUserRoles')).toBe('user');
    });

    it('should handle reset password error', async () => {
      const authStore = useAuthStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Reset failed'));
      await authStore.reset({ token: 'resettoken', password: 'newpassword' });

      expect(authStore.auth).toBe(false);
      expect(authStore.user).toBe(null);
      consoleLogSpy.mockRestore();
    });
  });

  describe('fetchServerConfig', () => {
    it('should fetch server config and update state', async () => {
      const authStore = useAuthStore();
      const mockResponse = { data: { data: { sign: { in: true, up: false } } } };

      axios.get.mockResolvedValueOnce(mockResponse);
      const result = await authStore.fetchServerConfig();

      expect(result).toEqual({ sign: { in: true, up: false } });
      expect(authStore.serverConfig).toEqual({ sign: { in: true, up: false } });
    });

    it('should return null when response shape is invalid', async () => {
      const authStore = useAuthStore();
      axios.get.mockResolvedValueOnce({ data: { data: {} } });

      const result = await authStore.fetchServerConfig();
      expect(result).toBe(null);
      expect(authStore.serverConfig).toBe(null);
    });

    it('should return null and reset state on error', async () => {
      const authStore = useAuthStore();
      axios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await authStore.fetchServerConfig();
      expect(result).toBe(null);
      expect(authStore.serverConfig).toBe(null);
    });
  });

  describe('authStatus getter', () => {
    it('should return the status', () => {
      const authStore = useAuthStore();
      expect(authStore.authStatus).toBeUndefined();
    });
  });

  describe('CASL abilities', () => {
    it('should call updateAbilities on signin when abilities are present', async () => {
      const authStore = useAuthStore();
      const mockAbilities = [{ action: 'read', subject: 'Article' }];
      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
          abilities: mockAbilities,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      await authStore.signin({ email: 'test@test.com', password: 'password' });

      expect(mockUpdateAbilities).toHaveBeenCalledWith(mockAbilities);
    });

    it('should not call updateAbilities on signin when abilities are absent', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      await authStore.signin({ email: 'test@test.com', password: 'password' });

      expect(mockUpdateAbilities).not.toHaveBeenCalled();
    });

    it('should call updateAbilities on token refresh when abilities are present', async () => {
      const authStore = useAuthStore();
      const mockAbilities = [{ action: 'manage', subject: 'all' }];
      const mockResponse = {
        data: {
          user: { id: '789', email: 'token@test.com', roles: ['admin'] },
          tokenExpiresIn: Date.now() + 7200000,
          abilities: mockAbilities,
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);
      await authStore.token();

      expect(mockUpdateAbilities).toHaveBeenCalledWith(mockAbilities);
    });

    it('should not call updateAbilities on token refresh when abilities are absent', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: '789', email: 'token@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 7200000,
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);
      await authStore.token();

      expect(mockUpdateAbilities).not.toHaveBeenCalled();
    });

    it('should clear abilities on signout', async () => {
      const authStore = useAuthStore();
      authStore.auth = true;
      authStore.user = { id: '123' };

      await authStore.signout();

      expect(mockUpdateAbilities).toHaveBeenCalledWith([]);
    });
  });
});
