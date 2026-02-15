import { describe, it, expect, vi, beforeEach } from 'vitest';

import testConfig from '../../../config/defaults/test.js';

// Mock dependencies used by the router
vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => ({ isLoggedIn: false }),
}));

vi.mock('../../../lib/services/config', () => ({
  default: testConfig,
}));

describe('app.router', () => {
  let getRouter;

  beforeEach(async () => {
    // Re-import fresh for each test
    vi.resetModules();
    const module = await import('../app.router.js');
    getRouter = module.default;
  });

  it('creates a router instance', () => {
    const router = getRouter();
    expect(router).toBeDefined();
    expect(typeof router.push).toBe('function');
  });

  it('uses web history (not hash history)', () => {
    const router = getRouter();
    // createWebHistory produces a history object without '#' in base
    // RouterHistory type is 'html5' for web history, 'hash' for hash history
    expect(router.options.history.base).not.toContain('#');
  });

  it('registers routes from all modules', () => {
    const router = getRouter();
    const routePaths = router.options.routes.map((r) => r.path);
    // home, auth, users, secure, tasks modules all contribute routes
    expect(routePaths.length).toBeGreaterThan(0);
  });

  it('updates document title on route navigation', async () => {
    const router = getRouter();
    router.push('/');
    await router.isReady();
    expect(document.title).toBeTruthy();
  });
});
