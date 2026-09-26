import { describe, it, expect, vi } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';

vi.mock('../views/home.view.vue', () => ({ default: { name: 'HomeView', template: '<div />' } }));
vi.mock('../views/home.pages.view.vue', () => ({ default: { name: 'PagesView', template: '<div />' } }));
vi.mock('../views/home.team.view.vue', () => ({ default: { name: 'TeamView', template: '<div />' } }));
vi.mock('../views/home.notfound.view.vue', () => ({ default: { name: 'NotFoundView', template: '<div />' } }));

/**
 * Build a memory-history router from a home routes array (a bare `/` fallback
 * isn't needed — home.router.js already declares one).
 * @param {Array<object>} routes
 * @returns {import('vue-router').Router}
 */
const buildRouter = (routes) => createRouter({ history: createMemoryHistory(), routes });

describe('home.router — both routes activated (default config)', () => {
  it('registers Home, Team, Pages and NotFound', async () => {
    vi.resetModules();
    vi.doMock('@/config', () => ({ default: { home: {} } }));
    const { default: routes } = await import('../router/home.router');
    const names = routes.map((r) => r.name);
    expect(names).toEqual(['Home', 'Team', 'Pages', 'NotFound']);
  });

  it('navigates to /team and /pages/:name normally', async () => {
    vi.resetModules();
    vi.doMock('@/config', () => ({ default: { home: {} } }));
    const { default: routes } = await import('../router/home.router');
    const router = buildRouter(routes);

    await router.push('/team');
    expect(router.currentRoute.value.name).toBe('Team');

    await router.push('/pages/terms');
    expect(router.currentRoute.value.name).toBe('Pages');
    expect(router.currentRoute.value.params.name).toBe('terms');
  });
});

describe('home.router — team deactivated', () => {
  it('does not register the Team route (Pages stays on)', async () => {
    vi.resetModules();
    vi.doMock('@/config', () => ({
      default: { home: { routes: { team: { activated: false } } } },
    }));
    const { default: routes } = await import('../router/home.router');
    const names = routes.map((r) => r.name);
    expect(names).not.toContain('Team');
    expect(names).toContain('Pages');
  });

  it('falls through to NotFound when navigating to /team', async () => {
    vi.resetModules();
    vi.doMock('@/config', () => ({
      default: { home: { routes: { team: { activated: false } } } },
    }));
    const { default: routes } = await import('../router/home.router');
    const router = buildRouter(routes);
    await router.push('/team');
    expect(router.currentRoute.value.name).toBe('NotFound');
  });
});

describe('home.router — pages deactivated', () => {
  it('does not register the Pages route (Team stays on)', async () => {
    vi.resetModules();
    vi.doMock('@/config', () => ({
      default: { home: { routes: { pages: { activated: false } } } },
    }));
    const { default: routes } = await import('../router/home.router');
    const names = routes.map((r) => r.name);
    expect(names).not.toContain('Pages');
    expect(names).toContain('Team');
  });

  it('falls through to NotFound when navigating to /pages/:name', async () => {
    vi.resetModules();
    vi.doMock('@/config', () => ({
      default: { home: { routes: { pages: { activated: false } } } },
    }));
    const { default: routes } = await import('../router/home.router');
    const router = buildRouter(routes);
    await router.push('/pages/legal');
    expect(router.currentRoute.value.name).toBe('NotFound');
  });
});

describe('home.router — both deactivated', () => {
  it('registers only Home and NotFound', async () => {
    vi.resetModules();
    vi.doMock('@/config', () => ({
      default: { home: { routes: { team: { activated: false }, pages: { activated: false } } } },
    }));
    const { default: routes } = await import('../router/home.router');
    expect(routes.map((r) => r.name)).toEqual(['Home', 'NotFound']);
  });
});
