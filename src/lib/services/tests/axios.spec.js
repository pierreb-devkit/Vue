import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { setupInterceptors, resetRefreshingAbilitiesFlag } from '../axios.js';

// Mock axios
vi.mock('axios', () => {
  const mockInstance = {
    interceptors: {
      response: {
        use: vi.fn(),
      },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockInstance),
    },
  };
});

describe('Axios Service', () => {
  let mockConfig;
  let mockSnackbar;
  let mockOnSignout;
  let mockOnRefreshAbilities;
  let responseInterceptor;
  let errorInterceptor;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Reset the refreshing abilities flag between tests
    resetRefreshingAbilitiesFlag();

    // Mock config
    mockConfig = {
      vuetify: {
        theme: {
          snackbar: {
            status: true,
            methods: ['post', 'put', 'delete'],
            successColor: 'success',
            errorColor: 'error',
          },
        },
      },
    };

    // Mock snackbar
    mockSnackbar = {
      text: '',
      color: '',
      status: false,
    };

    // Mock onSignout callback
    mockOnSignout = vi.fn();

    // Mock onRefreshAbilities callback
    mockOnRefreshAbilities = vi.fn().mockResolvedValue();

    // Setup interceptors
    setupInterceptors(mockConfig, mockSnackbar, mockOnSignout, mockOnRefreshAbilities);

    // Get the interceptors that were registered
    const mockInstance = axios.create();
    const interceptorCall = mockInstance.interceptors.response.use.mock.calls[0];
    responseInterceptor = interceptorCall[0];
    errorInterceptor = interceptorCall[1];
  });

  describe('setupInterceptors', () => {
    it('should register response interceptors', () => {
      const mockInstance = axios.create();
      expect(mockInstance.interceptors.response.use).toHaveBeenCalledTimes(1);
      expect(mockInstance.interceptors.response.use).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
    });

    it('should show snackbar on successful response with allowed method', () => {
      const response = {
        config: {
          method: 'post',
        },
        data: {
          type: 'success',
          message: 'Operation completed',
        },
      };

      const result = responseInterceptor(response);

      expect(mockSnackbar.text).toBe('success: Operation completed');
      expect(mockSnackbar.color).toBe('success');
      expect(mockSnackbar.status).toBe(true);
      expect(result).toEqual(response);
    });

    it('should fall back to legacy sucessColor when successColor is undefined', () => {
      // Simulate downstream config still using the old misspelled key
      delete mockConfig.vuetify.theme.snackbar.successColor;
      mockConfig.vuetify.theme.snackbar.sucessColor = 'green';
      setupInterceptors(mockConfig, mockSnackbar, mockOnSignout);

      const mockInstance = axios.create();
      const interceptorCall = mockInstance.interceptors.response.use.mock.calls[1];
      const legacyResponseInterceptor = interceptorCall[0];

      const response = {
        config: { method: 'post' },
        data: { type: 'success', message: 'Done' },
      };

      legacyResponseInterceptor(response);

      expect(mockSnackbar.color).toBe('green');
    });

    it('should not show snackbar on successful response with disallowed method', () => {
      const response = {
        config: {
          method: 'get',
        },
        data: {
          type: 'success',
          message: 'Operation completed',
        },
      };

      const result = responseInterceptor(response);

      expect(mockSnackbar.text).toBe('');
      expect(mockSnackbar.status).toBe(false);
      expect(result).toEqual(response);
    });

    it('should not show snackbar when snackbar status is false', () => {
      mockConfig.vuetify.theme.snackbar.status = false;
      setupInterceptors(mockConfig, mockSnackbar, mockOnSignout);

      const mockInstance = axios.create();
      const interceptorCall = mockInstance.interceptors.response.use.mock.calls[1];
      const newResponseInterceptor = interceptorCall[0];

      const response = {
        config: {
          method: 'post',
        },
        data: {
          type: 'success',
          message: 'Operation completed',
        },
      };

      newResponseInterceptor(response);

      expect(mockSnackbar.status).toBe(false);
    });

    it('should return response when config is missing', () => {
      const response = {
        data: {
          type: 'success',
          message: 'Operation completed',
        },
      };

      const result = responseInterceptor(response);

      expect(result).toEqual(response);
    });

    it('should handle 401 error and call onSignout', async () => {
      const error = {
        response: {
          status: 401,
        },
        config: {
          __isRetryRequest: false,
        },
      };

      try {
        await errorInterceptor(error);
      } catch (err) {
        expect(err).toEqual(error);
      }

      expect(mockOnSignout).toHaveBeenCalled();
      expect(mockSnackbar.text).toBe('Signin failed');
      expect(mockSnackbar.color).toBe('error');
      expect(mockSnackbar.status).toBe(true);
    });

    it('should not handle 401 error if retry request', async () => {
      const error = {
        response: {
          status: 401,
        },
        config: {
          __isRetryRequest: true,
        },
      };

      try {
        await errorInterceptor(error);
      } catch (err) {
        expect(err).toEqual(error);
      }

      expect(mockOnSignout).not.toHaveBeenCalled();
    });

    it('should show error description from response', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            description: 'Validation error occurred',
          },
        },
        config: {},
      };

      try {
        await errorInterceptor(error);
      } catch (err) {
        expect(err).toEqual(error);
      }

      expect(mockSnackbar.text).toBe('Validation error occurred');
      expect(mockSnackbar.color).toBe('error');
      expect(mockSnackbar.status).toBe(true);
    });

    it('should handle error without response', async () => {
      const error = {
        message: 'Network error',
      };

      try {
        await errorInterceptor(error);
      } catch (err) {
        expect(err).toEqual(error);
      }

      expect(mockSnackbar.status).toBe(false);
    });

    it('should handle error without config', async () => {
      const error = {
        response: {
          status: 500,
        },
      };

      try {
        await errorInterceptor(error);
      } catch (err) {
        expect(err).toEqual(error);
      }
    });

    it('should not show error snackbar when snackbar status is false', async () => {
      mockConfig.vuetify.theme.snackbar.status = false;
      setupInterceptors(mockConfig, mockSnackbar, mockOnSignout);

      const mockInstance = axios.create();
      const interceptorCall = mockInstance.interceptors.response.use.mock.calls[1];
      const newErrorInterceptor = interceptorCall[1];

      const error = {
        response: {
          status: 400,
          data: {
            description: 'Error message',
          },
        },
        config: {},
      };

      try {
        await newErrorInterceptor(error);
      } catch (err) {
        expect(err).toEqual(error);
      }

      expect(mockSnackbar.status).toBe(false);
    });

    it('should handle response with multiple allowed methods', () => {
      const putResponse = {
        config: {
          method: 'put',
        },
        data: {
          type: 'info',
          message: 'Updated',
        },
      };

      responseInterceptor(putResponse);
      expect(mockSnackbar.text).toBe('info: Updated');

      mockSnackbar.text = '';
      mockSnackbar.status = false;

      const deleteResponse = {
        config: {
          method: 'delete',
        },
        data: {
          type: 'warning',
          message: 'Deleted',
        },
      };

      responseInterceptor(deleteResponse);
      expect(mockSnackbar.text).toBe('warning: Deleted');
    });

    it('should handle 401 error without config object', async () => {
      const error = {
        response: {
          status: 401,
        },
      };

      try {
        await errorInterceptor(error);
      } catch (err) {
        expect(err).toEqual(error);
      }

      expect(mockOnSignout).not.toHaveBeenCalled();
    });

    it('should handle error response without data', async () => {
      const error = {
        response: {
          status: 400,
        },
        config: {},
      };

      try {
        await errorInterceptor(error);
      } catch (err) {
        expect(err).toEqual(error);
      }

      expect(mockSnackbar.status).toBe(false);
    });

    it('should call onRefreshAbilities on 403 error', async () => {
      const error = {
        response: {
          status: 403,
        },
        config: {},
      };

      try {
        await errorInterceptor(error);
      } catch (err) {
        expect(err).toEqual(error);
      }

      expect(mockOnRefreshAbilities).toHaveBeenCalledTimes(1);
    });

    it('should not call onRefreshAbilities twice concurrently (infinite loop prevention)', async () => {
      // Make refreshAbilities hang so we can test the flag
      let resolveRefresh;
      mockOnRefreshAbilities.mockImplementation(() => new Promise((resolve) => { resolveRefresh = resolve; }));

      const error = {
        response: {
          status: 403,
        },
        config: {},
      };

      // First 403 triggers refresh
      const firstCall = errorInterceptor(error).catch(() => {});

      // Second 403 while refresh is in progress should NOT trigger another refresh
      try {
        await errorInterceptor(error);
      } catch (err) {
        expect(err).toEqual(error);
      }

      expect(mockOnRefreshAbilities).toHaveBeenCalledTimes(1);

      // Resolve the first refresh
      resolveRefresh();
      await firstCall;
    });

    it('should reset flag after refreshAbilities completes', async () => {
      const error = {
        response: {
          status: 403,
        },
        config: {},
      };

      // First call
      try {
        await errorInterceptor(error);
      } catch (err) {
        // expected
      }

      expect(mockOnRefreshAbilities).toHaveBeenCalledTimes(1);

      // Second call after first completed should trigger again
      try {
        await errorInterceptor(error);
      } catch (err) {
        // expected
      }

      expect(mockOnRefreshAbilities).toHaveBeenCalledTimes(2);
    });

    it('should reset flag even if refreshAbilities throws', async () => {
      mockOnRefreshAbilities.mockRejectedValueOnce(new Error('refresh failed'));

      const error = {
        response: {
          status: 403,
        },
        config: {},
      };

      try {
        await errorInterceptor(error);
      } catch (err) {
        // expected
      }

      // Flag should be reset, so next 403 triggers refresh again
      mockOnRefreshAbilities.mockResolvedValueOnce();
      try {
        await errorInterceptor(error);
      } catch (err) {
        // expected
      }

      expect(mockOnRefreshAbilities).toHaveBeenCalledTimes(2);
    });

    it('should not call onRefreshAbilities when callback is not provided', async () => {
      // Setup interceptors without onRefreshAbilities
      resetRefreshingAbilitiesFlag();
      setupInterceptors(mockConfig, mockSnackbar, mockOnSignout);

      const mockInstance = axios.create();
      const calls = mockInstance.interceptors.response.use.mock.calls;
      const noRefreshErrorInterceptor = calls[calls.length - 1][1];

      const error = {
        response: {
          status: 403,
        },
        config: {},
      };

      try {
        await noRefreshErrorInterceptor(error);
      } catch (err) {
        expect(err).toEqual(error);
      }

      // Should not throw and should not call anything
      expect(mockOnRefreshAbilities).not.toHaveBeenCalled();
    });

    it('should propagate the original 403 error after refreshing abilities', async () => {
      const error = {
        response: {
          status: 403,
          data: { description: 'Forbidden' },
        },
        config: {},
      };

      let thrownError;
      try {
        await errorInterceptor(error);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toEqual(error);
      expect(mockOnRefreshAbilities).toHaveBeenCalledTimes(1);
    });
  });
});
