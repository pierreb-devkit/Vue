import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
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
 * Build a default router mock with a resolved push().
 * @returns {object} router mock
 */
function buildRouterMock() {
  return { push: vi.fn().mockResolvedValue(undefined) };
}

/**
 * Mount the token (oAuth callback) view with Vuetify installed.
 * @param {object} query - Route query parameters.
 * @param {object} router - Router mock.
 * @param {object} [extraStubs] - Additional/overriding `global.stubs` entries — used to
 * simulate a consumer swapping the loader component (see the "synthetic consumer
 * profile" describe block below) without touching the real config/glob resolution.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
function mountView(query, router, extraStubs) {
  const q = query || {};
  const r = router || buildRouterMock();
  return mount(AuthTokenView, {
    global: {
      plugins: [createVuetify()],
      mocks: {
        config: mockConfig,
        $route: { query: q },
        $router: r,
      },
      stubs: { RouterLink: true, VAlert: { template: '<div />' }, ...extraStubs },
    },
  });
}

/**
 * Stable hook for "is the loader currently shown" — the AppSpinner wrapper's
 * declared component name, not the default spinner's own DOM class. A consumer
 * configuring `config.ui.loader.component` renders a different root inside
 * AppSpinner, but AppSpinner itself always mounts under this name (rule 1: never
 * assert a hardcoded default's DOM shape).
 * @param {import('@vue/test-utils').VueWrapper} wrapper
 * @returns {import('@vue/test-utils').VueWrapper}
 */
function findAppSpinner(wrapper) {
  return wrapper.findComponent({ name: 'CoreAppSpinner' });
}

describe('auth.token.view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    tokenMock.mockReset();
  });

  describe('created()', () => {
    it('calls token() with no arguments when there is no error message in route', async () => {
      tokenMock.mockResolvedValueOnce(undefined);

      mountView();
      await flushPromises();

      expect(tokenMock).toHaveBeenCalledTimes(1);
      expect(tokenMock).toHaveBeenCalledWith();
    });

    it('does not call token() when route query contains an error message', async () => {
      mountView({ message: 'Unprocessable Entity', error: '{}' });
      await flushPromises();

      expect(tokenMock).not.toHaveBeenCalled();
    });

    it('does not throw when token() rejects', async () => {
      tokenMock.mockRejectedValueOnce(new Error('network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mountView();
      await flushPromises();

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
      await vi.waitFor(() => expect(findAppSpinner(wrapper).exists()).toBe(true));
      expect(wrapper.text()).toContain('Signing you in');
      expect(wrapper.text()).not.toContain('Error during oAuth');

      resolveToken();
      await flushPromises();
    });

    it('navigates to sign.route and never exposes the error UI when token() resolves', async () => {
      tokenMock.mockResolvedValueOnce(undefined);
      const push = vi.fn().mockResolvedValue(undefined);

      const wrapper = mountView({}, { push });
      await flushPromises();

      expect(push).toHaveBeenCalledWith('/tasks');
      expect(wrapper.text()).not.toContain('Error during oAuth');
    });

    it('surfaces the caught error and renders the error UI when token() rejects', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      tokenMock.mockRejectedValueOnce(new Error('network error'));

      const wrapper = mountView();
      await flushPromises();

      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.error.details.message).toBe('network error');
      await vi.waitFor(() => expect(findAppSpinner(wrapper).exists()).toBe(false));
      expect(wrapper.text()).toContain('Error during oAuth');
      consoleSpy.mockRestore();
    });

    it('falls back to a generic message when token() rejects without a message', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      tokenMock.mockRejectedValueOnce({});

      const wrapper = mountView();
      await flushPromises();

      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.error.details.message).toBe('Failed to complete sign-in');
      consoleSpy.mockRestore();
    });

    it('renders the error UI immediately and never shows the loader when query.message is present', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const payload = { details: { message: 'Validation failed', errors: {} } };

      const wrapper = mountView({ message: 'Unprocessable Entity', error: JSON.stringify(payload) });
      await flushPromises();

      expect(wrapper.vm.loading).toBe(false);
      await vi.waitFor(() => expect(findAppSpinner(wrapper).exists()).toBe(false));
      expect(wrapper.text()).toContain('Error during oAuth');
      consoleSpy.mockRestore();
    });

    it('renders the error UI and surfaces the plain-string payload when query.error is not JSON (issue #4021)', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const wrapper = mountView({ message: 'Bad Request', error: 'not-json' });
      await flushPromises();

      expect(wrapper.vm.loading).toBe(false);
      // Tolerant parser (#4021) surfaces plain-string payloads as-is instead of swallowing them.
      expect(wrapper.vm.error.details.message).toBe('not-json');
      expect(wrapper.text()).toContain('Error during oAuth');
      consoleSpy.mockRestore();
    });

    it('surfaces the error UI when router.push rejects after a successful token()', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      tokenMock.mockResolvedValueOnce(undefined);
      const push = vi.fn().mockRejectedValue(new Error('navigation aborted'));

      const wrapper = mountView({}, { push });
      await flushPromises();

      expect(push).toHaveBeenCalledWith('/tasks');
      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.error.details.message).toBe('navigation aborted');
      expect(wrapper.text()).toContain('Error during oAuth');
      consoleSpy.mockRestore();
    });

    it('uses a fallback label (Sign-in failed) in the alert when no query.message is present', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      tokenMock.mockRejectedValueOnce(new Error('network error'));

      // Render without the VAlert stub so we can inspect the alert content.
      const wrapper = mount(AuthTokenView, {
        global: {
          plugins: [createVuetify()],
          mocks: {
            config: mockConfig,
            $route: { query: {} },
            $router: buildRouterMock(),
          },
          stubs: { RouterLink: true },
        },
      });
      await flushPromises();

      expect(wrapper.html()).toContain('Sign-in failed');
      consoleSpy.mockRestore();
    });
  });

  describe('loading state — synthetic consumer profile (custom loader component)', () => {
    it('keeps the loading/error assertions valid via the AppSpinner wrapper when a consumer swaps the rendered loader', async () => {
      let resolveToken;
      tokenMock.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveToken = resolve;
          }),
      );

      // Simulate config.ui.loader.component pointing at a consumer's own SFC by
      // stubbing AppSpinner's local registration — CoreAppSpinner's own contract
      // test certifies the config→component resolution mechanism itself; this
      // proves this view's assertions stay valid however AppSpinner renders.
      const wrapper = mountView(undefined, undefined, {
        AppSpinner: { name: 'CoreAppSpinner', template: '<div class="synthetic-consumer-loader" />' },
      });

      expect(wrapper.vm.loading).toBe(true);
      await vi.waitFor(() => expect(findAppSpinner(wrapper).exists()).toBe(true));
      expect(wrapper.find('.synthetic-consumer-loader').exists()).toBe(true);
      expect(wrapper.text()).not.toContain('Error during oAuth');

      resolveToken();
      await flushPromises();
    });

    it('hides the AppSpinner wrapper and surfaces the error UI on the reject path, with a consumer-swapped loader', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      tokenMock.mockRejectedValueOnce(new Error('network error'));

      const wrapper = mountView(undefined, undefined, {
        AppSpinner: { name: 'CoreAppSpinner', template: '<div class="synthetic-consumer-loader" />' },
      });
      await flushPromises();

      expect(wrapper.vm.loading).toBe(false);
      await vi.waitFor(() => expect(findAppSpinner(wrapper).exists()).toBe(false));
      expect(wrapper.text()).toContain('Error during oAuth');
      consoleSpy.mockRestore();
    });
  });

  describe('error parsing (XSS hardening)', () => {
    it('surfaces plain-string query.error directly when not valid JSON', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mountView({ message: 'Bad Request', error: 'plain string fallback' });
      await flushPromises();

      expect(wrapper.vm.error.details.message).toBe('plain string fallback');
      expect(wrapper.vm.error.details.errors).toEqual({});
      consoleSpy.mockRestore();
    });

    it('surfaces malformed JSON string as-is via plain-string fallback', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mountView({ message: 'Bad Request', error: '{ malformed json' });
      await flushPromises();

      // Malformed JSON is a non-empty string, so the catch branch surfaces it as-is (older backend shape).
      expect(wrapper.vm.error.details.message).toBe('{ malformed json');
      expect(wrapper.vm.error.details.errors).toEqual({});
      consoleSpy.mockRestore();
    });

    it('falls back to generic message when JSON parses but has no recognized message field', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mountView({ message: 'Bad Request', error: JSON.stringify({ foo: 'bar' }) });
      await flushPromises();

      // Never surface the raw JSON body when no string-valued key is recognized — avoids leaking noisy payloads.
      expect(wrapper.vm.error.details.message).toBe('An unexpected error occurred');
      expect(wrapper.vm.error.details.errors).toEqual({});
      consoleSpy.mockRestore();
    });

    it('ignores non-string description/details.message/message values', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const payload = { description: 42, details: { message: { nested: 'x' } }, message: ['array'] };
      const wrapper = mountView({ message: 'Bad Request', error: JSON.stringify(payload) });
      await flushPromises();

      expect(wrapper.vm.error.details.message).toBe('An unexpected error occurred');
      consoleSpy.mockRestore();
    });

    it('sets generic message when query.error is missing', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mountView({ message: 'Bad Request' });
      await flushPromises();

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
      await flushPromises();

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
      await flushPromises();

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

  describe('error parsing (tolerant multi-shape)', () => {
    it('prefers canonical description over other keys', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const payload = { description: 'Registration is currently deactivated' };
      const wrapper = mountView({ message: 'Signup error', error: JSON.stringify(payload) });
      await flushPromises();

      expect(wrapper.vm.error.details.message).toBe('Registration is currently deactivated');
      expect(wrapper.vm.error.details.errors).toEqual({});
      consoleSpy.mockRestore();
    });

    it('falls back to legacy details.message when no description', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const payload = { details: { message: 'legacy msg' } };
      const wrapper = mountView({ message: 'Bad Request', error: JSON.stringify(payload) });
      await flushPromises();

      expect(wrapper.vm.error.details.message).toBe('legacy msg');
      consoleSpy.mockRestore();
    });

    it('falls back to top-level message when no description or details.message', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const payload = { message: 'top-level only' };
      const wrapper = mountView({ message: 'Bad Request', error: JSON.stringify(payload) });
      await flushPromises();

      expect(wrapper.vm.error.details.message).toBe('top-level only');
      consoleSpy.mockRestore();
    });

    it('surfaces plain-string query.error (older backend wire shape)', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mountView({ message: 'Signup error', error: 'Signup error' });
      await flushPromises();

      expect(wrapper.vm.error.details.message).toBe('Signup error');
      consoleSpy.mockRestore();
    });
  });
});
