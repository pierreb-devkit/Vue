import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const tokenMock = vi.hoisted(() => vi.fn());
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => ({ token: tokenMock }),
}));

import AuthTokenView from '../local/views/token.view.vue';

const mockConfig = {
  api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api', endPoints: { auth: 'auth' } },
  sign: { route: '/tasks' },
  vuetify: { theme: { flat: true, maxWidth: '1200px' } },
};

/**
 * Mount the token (oAuth callback) view with Vuetify installed.
 * @param {object} query - Route query parameters.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountView = (query = {}) =>
  mount(AuthTokenView, {
    global: {
      plugins: [createVuetify()],
      mocks: {
        config: mockConfig,
        $route: { query },
        $router: { push: vi.fn() },
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
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mountView();
      await Promise.resolve();

      // No unhandled rejection
      consoleSpy.mockRestore();
    });
  });
});
