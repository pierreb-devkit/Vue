import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore, deduceNamesFromEmail } from '../stores/auth.store';
import { useBillingStore } from '../../billing/stores/billing.store';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';

// Mock config
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api', endPoints: { auth: 'auth' } },
    cookie: { prefix: 'devkit' },
  },
}));

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

// Mock analytics helper
const mockCapture = vi.fn();
const mockIdentify = vi.fn();
const mockReset = vi.fn();
vi.mock('../../../lib/helpers/analytics', () => ({
  capture: (...args) => mockCapture(...args),
  identify: (...args) => mockIdentify(...args),
  reset: (...args) => mockReset(...args),
}));

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    // Reset mocks — clear axios call history so per-test `toHaveBeenCalledWith`
    // assertions don't see calls from previous tests.
    axios.post.mockReset();
    axios.get.mockReset();
    mockUpdateAbilities.mockClear();
    mockCapture.mockClear();
    mockIdentify.mockClear();
    mockReset.mockClear();
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
    localStorage.setItem(`${config.cookie.prefix}CookieExpire`, expireTime.toString());

    const authStore = useAuthStore();
    authStore.initFromStorage();

    expect(authStore.cookieExpire).toBe(expireTime.toString());
  });

  it('should clear auth data and lastLoginAt on signout', async () => {
    const authStore = useAuthStore();

    authStore.auth = true;
    authStore.cookieExpire = Date.now() + 1000;
    authStore.user = { id: '123', email: 'test@example.com' };
    localStorage.setItem(`${config.cookie.prefix}UserRoles`, 'user,admin');
    localStorage.setItem(`${config.cookie.prefix}CookieExpire`, '12345');
    localStorage.setItem(`${config.cookie.prefix}LastLoginAt`, '2026-01-01T00:00:00Z');

    axios.post.mockResolvedValueOnce({ data: {} });
    await authStore.signout();

    expect(authStore.auth).toBe(false);
    expect(authStore.cookieExpire).toBe(0);
    expect(authStore.user).toBe(null);
    expect(localStorage.getItem(`${config.cookie.prefix}UserRoles`)).toBe(null);
    expect(localStorage.getItem(`${config.cookie.prefix}CookieExpire`)).toBe(null);
    expect(localStorage.getItem(`${config.cookie.prefix}LastLoginAt`)).toBe(null);
  });

  describe('signout backend call', () => {
    it('should call backend signout endpoint with the correct URL', async () => {
      const authStore = useAuthStore();
      authStore.auth = true;
      authStore.user = { id: 'u1' };

      axios.post.mockResolvedValueOnce({ data: {} });
      await authStore.signout();

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/signout',
        null,
        { __isRetryRequest: true, __silent: true },
      );
    });

    it('should flag the signout request __silent so it raises no success toast', async () => {
      // D2 (#4305): a signout is a side effect — its /signout 200 must not flow
      // through the success snackbar interceptor as "success: Signed out".
      const authStore = useAuthStore();
      authStore.auth = true;
      authStore.user = { id: 'u1' };

      axios.post.mockResolvedValueOnce({ data: { type: 'success', message: 'Signed out' } });
      await authStore.signout();

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/signout',
        null,
        expect.objectContaining({ __silent: true }),
      );
    });

    it('should clear local state even when backend signout rejects', async () => {
      const authStore = useAuthStore();
      authStore.auth = true;
      authStore.cookieExpire = Date.now() + 1000;
      authStore.user = { id: 'u1' };
      authStore.pendingRequests = [{ id: 'r1' }];
      localStorage.setItem(`${config.cookie.prefix}UserRoles`, 'user');
      localStorage.setItem(`${config.cookie.prefix}CookieExpire`, '12345');
      localStorage.setItem(`${config.cookie.prefix}LastLoginAt`, '2026-01-01T00:00:00Z');

      const backendError = new Error('Backend unreachable');
      backendError.response = { status: 500 };
      axios.post.mockRejectedValueOnce(backendError);

      // Must not throw — signout always resolves so the user is never trapped as logged-in.
      await expect(authStore.signout()).resolves.toBeUndefined();

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/signout',
        null,
        { __isRetryRequest: true, __silent: true },
      );
      expect(authStore.auth).toBe(false);
      expect(authStore.cookieExpire).toBe(0);
      expect(authStore.user).toBe(null);
      expect(authStore.pendingRequests).toEqual([]);
      expect(localStorage.getItem(`${config.cookie.prefix}UserRoles`)).toBe(null);
      expect(localStorage.getItem(`${config.cookie.prefix}CookieExpire`)).toBe(null);
      expect(localStorage.getItem(`${config.cookie.prefix}LastLoginAt`)).toBe(null);
      expect(mockUpdateAbilities).toHaveBeenCalledWith([]);
    });

    it('should clear local state when backend signout returns 404 (older backend)', async () => {
      const authStore = useAuthStore();
      authStore.auth = true;
      authStore.user = { id: 'u1' };

      const notFoundError = new Error('Not found');
      notFoundError.response = { status: 404 };
      axios.post.mockRejectedValueOnce(notFoundError);

      await authStore.signout();

      expect(authStore.auth).toBe(false);
      expect(authStore.user).toBe(null);
    });
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
      expect(localStorage.getItem(`${config.cookie.prefix}UserRoles`)).toBe('user');
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

      expect(localStorage.getItem(`${config.cookie.prefix}LastLoginAt`)).toBe(lastLogin);
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

    it('should clear lockout on 423 with missing retryAfter', async () => {
      const authStore = useAuthStore();

      const lockoutError = new Error('Account locked');
      lockoutError.response = { status: 423, data: {} };
      axios.post.mockRejectedValueOnce(lockoutError);

      await authStore.signin({ email: 'test@test.com', password: 'wrong' });

      expect(authStore.lockout).toEqual({ locked: false, retryAfter: 0 });
    });

    it('should handle signin error', async () => {
      const authStore = useAuthStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Signin failed'));
      await authStore.signin({ email: 'test@test.com', password: 'wrong' });

      expect(authStore.auth).toBe(false);
      expect(authStore.user).toBe(null);
      expect(localStorage.getItem('token')).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    // ── #4261 — fetchUsageMeter called on signin when meterMode is on ────────

    it('calls billingStore.fetchUsageMeter after signin when meterMode is true (#4261)', async () => {
      const authStore = useAuthStore();
      // Pre-set serverConfig with meterMode enabled (simulates router guard having run before login)
      authStore.serverConfig = { billing: { meterMode: true } };

      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };
      axios.post.mockResolvedValueOnce(mockResponse);
      // fetchUsageMeter uses GET /billing/usage — stub to avoid throwing
      axios.get.mockResolvedValue({ data: { data: { meterUsed: 0, meterQuota: 500 } } });

      const billingStore = useBillingStore();
      const fetchUsageMeterSpy = vi.spyOn(billingStore, 'fetchUsageMeter');

      await authStore.signin({ email: 'test@test.com', password: 'password' });

      expect(fetchUsageMeterSpy).toHaveBeenCalledTimes(1);
    });

    it('does NOT call billingStore.fetchUsageMeter after signin when meterMode is false (#4261)', async () => {
      const authStore = useAuthStore();
      authStore.serverConfig = { billing: { meterMode: false } };

      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };
      axios.post.mockResolvedValueOnce(mockResponse);

      const billingStore = useBillingStore();
      const fetchUsageMeterSpy = vi.spyOn(billingStore, 'fetchUsageMeter');

      await authStore.signin({ email: 'test@test.com', password: 'password' });

      expect(fetchUsageMeterSpy).not.toHaveBeenCalled();
    });

    it('does NOT call billingStore.fetchUsageMeter after signin when serverConfig is null (#4261)', async () => {
      const authStore = useAuthStore();
      authStore.serverConfig = null;

      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };
      axios.post.mockResolvedValueOnce(mockResponse);

      const billingStore = useBillingStore();
      const fetchUsageMeterSpy = vi.spyOn(billingStore, 'fetchUsageMeter');

      await authStore.signin({ email: 'test@test.com', password: 'password' });

      expect(fetchUsageMeterSpy).not.toHaveBeenCalled();
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
      expect(localStorage.getItem(`${config.cookie.prefix}UserRoles`)).toBe('user');
    });

    it('should capture signup_completed event on success', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: '456', email: 'new@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      await authStore.signup({ email: 'new@test.com', password: 'password123' });

      expect(mockCapture).toHaveBeenCalledWith('signup_completed', { email: 'new@test.com' });
    });

    it('should not capture signup_completed on failure', async () => {
      const authStore = useAuthStore();

      axios.post.mockRejectedValueOnce(new Error('Signup failed'));
      await expect(authStore.signup({ email: 'new@test.com', password: 'password' })).rejects.toThrow('Signup failed');

      expect(mockCapture).not.toHaveBeenCalled();
    });

    it('should handle signup error', async () => {
      const authStore = useAuthStore();

      axios.post.mockRejectedValueOnce(new Error('Signup failed'));
      await expect(authStore.signup({ email: 'new@test.com', password: 'password' })).rejects.toThrow('Signup failed');

      expect(authStore.auth).toBe(false);
      expect(authStore.user).toBe(null);
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
      expect(localStorage.getItem(`${config.cookie.prefix}UserRoles`)).toBe('user,admin');
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

      expect(localStorage.getItem(`${config.cookie.prefix}LastLoginAt`)).toBe(lastLogin);
    });

    it('should handle token refresh error', async () => {
      const authStore = useAuthStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Token refresh failed'));
      await authStore.token();

      expect(authStore.auth).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
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
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Forgot password failed'));
      await authStore.forgot({ email: 'forgot@test.com' });

      expect(authStore.mail.status).toBe(false);
      consoleErrorSpy.mockRestore();
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
      expect(localStorage.getItem(`${config.cookie.prefix}UserRoles`)).toBe('user');
    });

    it('should handle reset password error', async () => {
      const authStore = useAuthStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Reset failed'));
      await authStore.reset({ token: 'resettoken', password: 'newpassword' });

      expect(authStore.auth).toBe(false);
      expect(authStore.user).toBe(null);
      consoleErrorSpy.mockRestore();
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
      expect(authStore.authStatus).toBe(null);
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

    it('should refresh abilities and update user on refreshAbilities', async () => {
      const authStore = useAuthStore();
      const mockAbilities = [{ action: 'read', subject: 'Post' }];
      const mockUser = { id: '123', email: 'test@test.com' };
      const mockResponse = {
        data: {
          user: mockUser,
          abilities: mockAbilities,
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);
      await authStore.refreshAbilities();

      expect(mockUpdateAbilities).toHaveBeenCalledWith(mockAbilities);
      expect(authStore.user).toEqual(mockUser);
    });

    it('should not call updateAbilities on refreshAbilities when abilities are absent', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@test.com' },
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);
      await authStore.refreshAbilities();

      expect(mockUpdateAbilities).not.toHaveBeenCalled();
      expect(authStore.user).toEqual(mockResponse.data.user);
    });

    it('should not update user on refreshAbilities when user is absent', async () => {
      const authStore = useAuthStore();
      authStore.user = { id: 'original' };
      const mockAbilities = [{ action: 'read', subject: 'Post' }];
      const mockResponse = {
        data: {
          abilities: mockAbilities,
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);
      await authStore.refreshAbilities();

      expect(mockUpdateAbilities).toHaveBeenCalledWith(mockAbilities);
      expect(authStore.user).toEqual({ id: 'original' });
    });

    it('should signout and rethrow when refreshAbilities fails', async () => {
      const authStore = useAuthStore();
      authStore.auth = true;
      authStore.user = { id: '123' };
      authStore.cookieExpire = Date.now() + 1000;

      axios.get.mockRejectedValueOnce(new Error('Token refresh failed'));
      await expect(authStore.refreshAbilities()).rejects.toThrow('Token refresh failed');

      expect(authStore.auth).toBe(false);
      expect(authStore.user).toBe(null);
      expect(authStore.cookieExpire).toBe(0);
      expect(mockUpdateAbilities).toHaveBeenCalledWith([]);
    });

    it('should clear abilities on signout', async () => {
      const authStore = useAuthStore();
      authStore.auth = true;
      authStore.user = { id: '123' };

      await authStore.signout();

      expect(mockUpdateAbilities).toHaveBeenCalledWith([]);
    });
  });

  describe('deduceNamesFromEmail', () => {
    it('should deduce firstName and lastName from dotted email', () => {
      const result = deduceNamesFromEmail('john.doe@example.com');
      expect(result).toEqual({ firstName: 'John', lastName: 'Doe' });
    });

    it('should return empty strings when local part has no alpha characters', () => {
      const result = deduceNamesFromEmail('123456@example.com');
      expect(result).toEqual({ firstName: '', lastName: '' });
    });
  });

  describe('signup name deduction', () => {
    it('should deduce names from dotted email when firstName and lastName are not provided', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: '456', email: 'jane.smith@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      await authStore.signup({ email: 'jane.smith@test.com', password: 'password123' });

      // Assert the meaningful thing: the POSTed body contains the deduced names
      const body = axios.post.mock.calls[0][1];
      expect(body.firstName).toBe('Jane');
      expect(body.lastName).toBe('Smith');
    });
  });

  describe('verifyEmail', () => {
    it('should call verify-email endpoint and return response data', async () => {
      const authStore = useAuthStore();
      const mockResponse = { data: { message: 'Email verified successfully' } };

      axios.post.mockResolvedValueOnce(mockResponse);
      const result = await authStore.verifyEmail('some-verification-token');

      expect(result).toEqual({ message: 'Email verified successfully' });
    });

    it('should propagate error when verify-email fails', async () => {
      const authStore = useAuthStore();

      axios.post.mockRejectedValueOnce(new Error('Invalid token'));
      await expect(authStore.verifyEmail('bad-token')).rejects.toThrow('Invalid token');
    });
  });

  describe('suggestedJoin', () => {
    it('should initialize suggestedJoin as null', () => {
      const authStore = useAuthStore();
      expect(authStore.suggestedJoin).toBe(null);
    });

    it('setSuggestedJoin sets state', () => {
      const authStore = useAuthStore();
      authStore.setSuggestedJoin({ orgId: 'o1', orgName: 'Acme' });
      expect(authStore.suggestedJoin).toEqual({ orgId: 'o1', orgName: 'Acme' });
    });

    it('dismissSuggestedJoin clears state', () => {
      const authStore = useAuthStore();
      authStore.setSuggestedJoin({ orgId: 'o1', orgName: 'Acme' });
      authStore.dismissSuggestedJoin();
      expect(authStore.suggestedJoin).toBe(null);
    });

    it('dismissSuggestedJoin removes persisted localStorage key', () => {
      const authStore = useAuthStore();
      authStore.setSuggestedJoin({ orgId: 'o1', orgName: 'Acme' });
      authStore.dismissSuggestedJoin();
      expect(localStorage.getItem(`${config.cookie.prefix}SuggestedJoin`)).toBe(null);
    });

    it('clearSuggestedJoinIfMember clears when orgId matches', () => {
      const authStore = useAuthStore();
      authStore.setSuggestedJoin({ orgId: 'o1', orgName: 'Acme' });
      authStore.clearSuggestedJoinIfMember('o1');
      expect(authStore.suggestedJoin).toBe(null);
    });

    it('clearSuggestedJoinIfMember does NOT clear when orgId differs', () => {
      const authStore = useAuthStore();
      authStore.setSuggestedJoin({ orgId: 'o1', orgName: 'Acme' });
      authStore.clearSuggestedJoinIfMember('o2');
      expect(authStore.suggestedJoin).toEqual({ orgId: 'o1', orgName: 'Acme' });
    });

    it('clearSuggestedJoinIfMember is a no-op when suggestedJoin is null', () => {
      const authStore = useAuthStore();
      expect(() => authStore.clearSuggestedJoinIfMember('o1')).not.toThrow();
      expect(authStore.suggestedJoin).toBe(null);
    });

    it('signout clears suggestedJoin', async () => {
      const authStore = useAuthStore();
      authStore.setSuggestedJoin({ orgId: 'o1', orgName: 'Acme' });

      axios.post.mockResolvedValueOnce({ data: {} });
      await authStore.signout();

      expect(authStore.suggestedJoin).toBe(null);
    });

    it('signout removes suggestedJoin from localStorage', async () => {
      const authStore = useAuthStore();
      authStore.setSuggestedJoin({ orgId: 'o1', orgName: 'Acme' });

      axios.post.mockResolvedValueOnce({ data: {} });
      await authStore.signout();

      expect(localStorage.getItem(`${config.cookie.prefix}SuggestedJoin`)).toBe(null);
    });

    it('signup with suggestedJoin in response sets state', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: '456', email: 'new@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
          suggestedJoin: { orgId: 'org-x', orgName: 'Org X' },
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      await authStore.signup({ email: 'new@test.com', password: 'password123' });

      expect(authStore.suggestedJoin).toEqual({ orgId: 'org-x', orgName: 'Org X' });
    });

    it('signup without suggestedJoin in response leaves state null', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: '456', email: 'new@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      await authStore.signup({ email: 'new@test.com', password: 'password123' });

      expect(authStore.suggestedJoin).toBe(null);
    });

    it('signup with null suggestedJoin in response leaves state null', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: '456', email: 'new@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
          suggestedJoin: null,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      await authStore.signup({ email: 'new@test.com', password: 'password123' });

      expect(authStore.suggestedJoin).toBe(null);
    });

    it('setSuggestedJoin persists to localStorage', () => {
      const authStore = useAuthStore();
      authStore.setSuggestedJoin({ orgId: 'o1', orgName: 'Acme' });
      const stored = JSON.parse(localStorage.getItem(`${config.cookie.prefix}SuggestedJoin`));
      expect(stored).toEqual({ orgId: 'o1', orgName: 'Acme' });
    });

    it('initFromStorage restores suggestedJoin from localStorage', () => {
      localStorage.setItem(`${config.cookie.prefix}SuggestedJoin`, JSON.stringify({ orgId: 'o1', orgName: 'Acme' }));
      const authStore = useAuthStore();
      authStore.initFromStorage();
      expect(authStore.suggestedJoin).toEqual({ orgId: 'o1', orgName: 'Acme' });
    });

    it('initFromStorage does not throw on corrupt suggestedJoin, leaves state null, removes bad key', () => {
      localStorage.setItem(`${config.cookie.prefix}SuggestedJoin`, '{not valid json{{');
      const authStore = useAuthStore();
      expect(() => authStore.initFromStorage()).not.toThrow();
      expect(authStore.suggestedJoin).toBe(null);
      expect(localStorage.getItem(`${config.cookie.prefix}SuggestedJoin`)).toBe(null);
    });

    it('setSuggestedJoin ignores non-object payloads and does not touch state or localStorage', () => {
      const authStore = useAuthStore();
      authStore.setSuggestedJoin('garbage');
      expect(authStore.suggestedJoin).toBe(null);
      expect(localStorage.getItem(`${config.cookie.prefix}SuggestedJoin`)).toBe(null);

      authStore.setSuggestedJoin(true);
      expect(authStore.suggestedJoin).toBe(null);
      expect(localStorage.getItem(`${config.cookie.prefix}SuggestedJoin`)).toBe(null);

      authStore.setSuggestedJoin(null);
      expect(authStore.suggestedJoin).toBe(null);
      expect(localStorage.getItem(`${config.cookie.prefix}SuggestedJoin`)).toBe(null);
    });

    it('setSuggestedJoin still works correctly for valid object payloads', () => {
      const authStore = useAuthStore();
      authStore.setSuggestedJoin({ orgId: 'o1', orgName: 'Acme' });
      expect(authStore.suggestedJoin).toEqual({ orgId: 'o1', orgName: 'Acme' });
      const stored = JSON.parse(localStorage.getItem(`${config.cookie.prefix}SuggestedJoin`));
      expect(stored).toEqual({ orgId: 'o1', orgName: 'Acme' });
    });

    it('setSuggestedJoin ignores arrays even though they pass typeof object', () => {
      const authStore = useAuthStore();
      authStore.setSuggestedJoin(['o1', 'Acme']);
      expect(authStore.suggestedJoin).toBe(null);
      expect(localStorage.getItem(`${config.cookie.prefix}SuggestedJoin`)).toBe(null);
    });

    it('setSuggestedJoin ignores objects missing orgId or orgName string fields', () => {
      const authStore = useAuthStore();
      authStore.setSuggestedJoin({ orgId: 'o1' }); // missing orgName
      expect(authStore.suggestedJoin).toBe(null);
      authStore.setSuggestedJoin({ orgName: 'Acme' }); // missing orgId
      expect(authStore.suggestedJoin).toBe(null);
      authStore.setSuggestedJoin({ orgId: 42, orgName: 'Acme' }); // non-string orgId
      expect(authStore.suggestedJoin).toBe(null);
      authStore.setSuggestedJoin({ orgId: '', orgName: 'Acme' }); // empty orgId
      expect(authStore.suggestedJoin).toBe(null);
    });

    it('initFromStorage drops malformed-but-parseable localStorage values (array/missing fields) and removes the key', () => {
      // Valid JSON but wrong shape — should not restore state
      localStorage.setItem(`${config.cookie.prefix}SuggestedJoin`, JSON.stringify(['o1', 'Acme']));
      const authStore = useAuthStore();
      authStore.initFromStorage();
      expect(authStore.suggestedJoin).toBe(null);
      expect(localStorage.getItem(`${config.cookie.prefix}SuggestedJoin`)).toBe(null);
    });

    it('initFromStorage drops object missing required string fields and removes the key', () => {
      localStorage.setItem(`${config.cookie.prefix}SuggestedJoin`, JSON.stringify({ orgId: 'o1' }));
      const authStore = useAuthStore();
      authStore.initFromStorage();
      expect(authStore.suggestedJoin).toBe(null);
      expect(localStorage.getItem(`${config.cookie.prefix}SuggestedJoin`)).toBe(null);
    });
  });

  describe('resendVerification', () => {
    it('should call resend-verification endpoint and return response data', async () => {
      const authStore = useAuthStore();
      const mockResponse = { data: { message: 'Verification email sent' } };

      axios.post.mockResolvedValueOnce(mockResponse);
      const result = await authStore.resendVerification();

      expect(result).toEqual({ message: 'Verification email sent' });
    });

    it('should propagate error when resend-verification fails', async () => {
      const authStore = useAuthStore();

      axios.post.mockRejectedValueOnce(new Error('Not authenticated'));
      await expect(authStore.resendVerification()).rejects.toThrow('Not authenticated');
    });
  });

  describe('auth store — invite token relay', () => {
    it('signup appends inviteToken as a query param and omits it from the body', async () => {
      const authStore = useAuthStore();
      axios.post.mockResolvedValueOnce({ data: { user: { id: '1', roles: ['user'], email: 'a@b.co' }, tokenExpiresIn: 10 } });
      await authStore.signup({ email: 'a@b.co', password: 'x', inviteToken: 'tok123' });
      const [url, body] = axios.post.mock.calls[0];
      expect(url).toContain('/signup?inviteToken=tok123');
      expect(body).not.toHaveProperty('inviteToken');
    });

    it('signup without inviteToken posts to a plain /signup URL', async () => {
      const authStore = useAuthStore();
      axios.post.mockResolvedValueOnce({ data: { user: { id: '1', roles: ['user'], email: 'a@b.co' }, tokenExpiresIn: 10 } });
      await authStore.signup({ email: 'a@b.co', password: 'x' });
      expect(axios.post.mock.calls[0][0]).toMatch(/\/signup$/);
    });

    it('verifyInvite hits the canonical /api/invitations/verify (NOT the legacy /auth/invitations alias)', async () => {
      const authStore = useAuthStore();
      axios.get.mockResolvedValueOnce({ data: { data: { valid: true, email: 'a@b.co' } } });
      const r = await authStore.verifyInvite('tok123');
      expect(axios.get).toHaveBeenCalledWith(expect.stringMatching(/\/api\/invitations\/verify\/tok123$/));
      expect(axios.get).not.toHaveBeenCalledWith(expect.stringContaining('/auth/invitations/'));
      expect(r).toEqual({ valid: true, email: 'a@b.co' });
    });

    it('verifyInvite returns { valid: false, email: null } when the API rejects', async () => {
      const authStore = useAuthStore();
      axios.get.mockRejectedValueOnce(new Error('Not found'));
      const r = await authStore.verifyInvite('bad-token');
      expect(r).toEqual({ valid: false, email: null });
    });
  });

  describe('PostHog analytics', () => {
    it('should call identify helper on signin with user data', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: 'u1', email: 'test@test.com', firstName: 'John', lastName: 'Doe', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      await authStore.signin({ email: 'test@test.com', password: 'password' });

      expect(mockIdentify).toHaveBeenCalledWith('u1', { email: 'test@test.com', name: 'John Doe' });
    });

    it('should call identify helper with _id fallback and partial name', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { _id: 'u2', email: 'jane@test.com', firstName: 'Jane', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      await authStore.signin({ email: 'jane@test.com', password: 'password' });

      expect(mockIdentify).toHaveBeenCalledWith('u2', { email: 'jane@test.com', name: 'Jane' });
    });

    it('should deduce name from email when firstName and lastName are missing on signin', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: 'u3', email: 'john.doe@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      await authStore.signin({ email: 'john.doe@test.com', password: 'password' });

      expect(mockIdentify).toHaveBeenCalledWith('u3', { email: 'john.doe@test.com', name: 'John Doe' });
    });

    it('should omit name property when name cannot be deduced on signin', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: 'u4', email: '123456@test.com', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      await authStore.signin({ email: '123456@test.com', password: 'password' });

      expect(mockIdentify).toHaveBeenCalledWith('u4', { email: '123456@test.com' });
    });

    it('should call identify helper on signup with user id and email', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        data: {
          user: { id: 'u5', email: 'new@test.com', plan: 'free', roles: ['user'] },
          tokenExpiresIn: Date.now() + 3600000,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);
      await authStore.signup({ email: 'new@test.com', password: 'password123' });

      expect(mockIdentify).toHaveBeenCalledWith('u5', { email: 'new@test.com', plan: 'free' });
    });

    it('should not call identify on signup failure', async () => {
      const authStore = useAuthStore();

      axios.post.mockRejectedValueOnce(new Error('Signup failed'));
      await expect(authStore.signup({ email: 'new@test.com', password: 'password' })).rejects.toThrow('Signup failed');

      expect(mockIdentify).not.toHaveBeenCalled();
    });

    it('should call reset helper on signout', async () => {
      const authStore = useAuthStore();
      authStore.auth = true;
      authStore.user = { id: 'u1' };

      axios.post.mockResolvedValueOnce({ data: {} });
      await authStore.signout();

      expect(mockReset).toHaveBeenCalledOnce();
    });
  });
});

describe('auth store — beta seat getters', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('uncapped serverConfig → cap null, remaining null, betaCapped false', () => {
    const store = useAuthStore();
    store.serverConfig = { sign: { in: true, up: false, cap: null, remaining: null } };
    expect(store.signupCap).toBeNull();
    expect(store.seatsRemaining).toBeNull();
    expect(store.betaCapped).toBe(false);
  });

  it('capped serverConfig → exposes cap + remaining, betaCapped true', () => {
    const store = useAuthStore();
    store.serverConfig = { sign: { in: true, up: false, cap: 50, remaining: 40 } };
    expect(store.signupCap).toBe(50);
    expect(store.seatsRemaining).toBe(40);
    expect(store.betaCapped).toBe(true);
  });

  it('missing serverConfig → safe nulls', () => {
    const store = useAuthStore();
    store.serverConfig = null;
    expect(store.signupCap).toBeNull();
    expect(store.seatsRemaining).toBeNull();
    expect(store.betaCapped).toBe(false);
  });
});
