import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const tokenMock = vi.hoisted(() => vi.fn());
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => ({ token: tokenMock }),
}));

import AuthTokenView from '../views/token.view.vue';

const mockConfig = {
  api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api', endPoints: { auth: 'auth' } },
  sign: { route: '/tasks' },
  vuetify: { theme: { flat: true, maxWidth: '1200px' } },
};

/**
 * Mount the token (oAuth callback) view with Vuetify installed.
 * @param {object} query - Route query parameters.
 * @param {object} [router] - Optional router mock override.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountView = (query = {}, router = { push: vi.fn() }) =>
  mount(AuthTokenView, {
    global: {
      plugins: [createVuetify()],
      mocks: {
        config: mockConfig,
        $route: { query },
        $router: router,
      },
      stubs: { RouterLink: true, VAlert: { template: '<div />' } },
    },
  });

describe('auth.token.view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    tokenMock.mockReset();
  });

  describe('created()', () => {
    it('calls token() with no arguments when there is no error message in route', async () => {
      tokenMock.mockResolvedValueOnce(undefined);

      mountView();
      await Promise.resolve(); // flush created() microtask

      expect(tokenMock).toHaveBeenCalledTimes(1);
      expect(tokenMock).toHaveBeenCalledWith();
    });

    it('does not call token() when route query contains an error message', async () => {
      mountView({ message: 'Unprocessable Entity', error: '{}' });
      await Promise.resolve();

      expect(tokenMock).not.toHaveBeenCalled();
    });

    it('does not throw when token() rejects', async () => {
      tokenMock.mockRejectedValueOnce(new Error('network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mountView();
      await Promise.resolve();

      // No unhandled rejection
      consoleSpy.mockRestore();
    });
  });

  describe('loading state (issue #4017)', () => {
    it('shows the loader and hides the error UI on initial render while token() is pending', async () => {
      let resolveToken;
      tokenMock.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveToken = resolve;
          }),
      );

      const wrapper = mountView();

      expect(wrapper.vm.loading).toBe(true);
      expect(wrapper.find('.v-progress-circular').exists()).toBe(true);
      expect(wrapper.text()).toContain('Signing you in');
      expect(wrapper.text()).not.toContain('Error during oAuth');

      resolveToken();
      await Promise.resolve();
      await Promise.resolve();
    });

    it('navigates to sign.route and never exposes the error UI when token() resolves', async () => {
      tokenMock.mockResolvedValueOnce(undefined);
      const push = vi.fn();

      const wrapper = mountView({}, { push });
      await Promise.resolve();
      await Promise.resolve();

      expect(push).toHaveBeenCalledWith('/tasks');
      expect(wrapper.text()).not.toContain('Error during oAuth');
    });

    it('surfaces the caught error and renders the error UI when token() rejects', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      tokenMock.mockRejectedValueOnce(new Error('network error'));

      const wrapper = mountView();
      await Promise.resolve();
      await Promise.resolve();

      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.error.details.message).toBe('network error');
      expect(wrapper.find('.v-progress-circular').exists()).toBe(false);
      expect(wrapper.text()).toContain('Error during oAuth');
      consoleSpy.mockRestore();
    });

    it('falls back to a generic message when token() rejects without a message', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      tokenMock.mockRejectedValueOnce({});

      const wrapper = mountView();
      await Promise.resolve();
      await Promise.resolve();

      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.error.details.message).toBe('Failed to complete sign-in');
      consoleSpy.mockRestore();
    });

    it('renders the error UI immediately and never shows the loader when query.message is present', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const payload = { details: { message: 'Validation failed', errors: {} } };

      const wrapper = mountView({ message: 'Unprocessable Entity', error: JSON.stringify(payload) });
      await Promise.resolve();

      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.find('.v-progress-circular').exists()).toBe(false);
      expect(wrapper.text()).toContain('Error during oAuth');
      consoleSpy.mockRestore();
    });

    it('renders the error UI with the fallback message when query.error is malformed', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const wrapper = mountView({ message: 'Bad Request', error: 'not-json' });
      await Promise.resolve();

      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.error.details.message).toBe('An unexpected error occurred');
      expect(wrapper.text()).toContain('Error during oAuth');
      consoleSpy.mockRestore();
    });
  });

  describe('error parsing (XSS hardening)', () => {
    it('sets generic message when query.error is invalid JSON', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mountView({ message: 'Bad Request', error: 'not-json' });
      await Promise.resolve();

      expect(wrapper.vm.error.details.message).toBe('An unexpected error occurred');
      expect(wrapper.vm.error.details.errors).toEqual({});
      consoleSpy.mockRestore();
    });

    it('sets generic message when query.error is missing', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mountView({ message: 'Bad Request' });
      await Promise.resolve();

      expect(wrapper.vm.error.details.message).toBe('An unexpected error occurred');
      consoleSpy.mockRestore();
    });

    it('sanitizes valid payload and preserves per-field errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const payload = {
        details: {
          message: 'Validation failed',
          errors: { email: { message: 'Email is required' }, name: { message: 'Name too short' } },
        },
      };
      const wrapper = mountView({ message: 'Unprocessable Entity', error: JSON.stringify(payload) });
      await Promise.resolve();

      expect(wrapper.vm.error.details.message).toBe('Validation failed');
      expect(wrapper.vm.error.details.errors.email.message).toBe('Email is required');
      expect(wrapper.vm.error.details.errors.name.message).toBe('Name too short');
      consoleSpy.mockRestore();
    });

    it('drops non-conforming error entries', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const payload = {
        details: {
          message: 'Validation failed',
          errors: { good: { message: 'Valid' }, bad: { message: 123 }, ugly: 'not-object' },
        },
      };
      const wrapper = mountView({ message: 'Test', error: JSON.stringify(payload) });
      await Promise.resolve();

      expect(wrapper.vm.error.details.errors.good.message).toBe('Valid');
      expect(wrapper.vm.error.details.errors.bad).toBeUndefined();
      expect(wrapper.vm.error.details.errors.ugly).toBeUndefined();
      consoleSpy.mockRestore();
    });

    it('initializes error with safe shape for OAuth callback flow (no message)', () => {
      tokenMock.mockResolvedValueOnce(undefined);
      const wrapper = mountView();

      // error should have the expected shape so template bindings don't throw
      expect(wrapper.vm.error.details).toBeDefined();
      expect(wrapper.vm.error.details.message).toBe('');
      expect(wrapper.vm.error.details.errors).toEqual({});
    });
  });
});
