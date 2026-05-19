import { describe, it, expect } from 'vitest';
import usersRoutes from '../router/users.router';

/**
 * C5 — legacy ?tab=subscriptions → /users/billing one-release alias
 *
 * The /users route carries a beforeEnter guard that intercepts the legacy bookmark
 * `/users?tab=subscriptions` (and `/users/?tab=subscriptions`) and redirects to
 * the canonical account billing route, preserving all other query params and
 * dropping only `tab`.
 */

describe('users.router', () => {
  it('exports an array of route objects', () => {
    expect(Array.isArray(usersRoutes)).toBe(true);
    expect(usersRoutes.length).toBeGreaterThanOrEqual(1);
  });

  it('/users route has an absolute path', () => {
    const usersRoute = usersRoutes.find((r) => r.path === '/users');
    expect(usersRoute).toBeDefined();
    expect(usersRoute.path).toBe('/users');
  });
});

describe('users.router – C5 legacy ?tab=subscriptions alias', () => {
  /** Pull the beforeEnter guard from the /users route. */
  const getUsersRoute = () => usersRoutes.find((r) => r.path === '/users');

  it('/users route has a beforeEnter guard (C5 legacy alias)', () => {
    const route = getUsersRoute();
    expect(typeof route.beforeEnter).toBe('function');
  });

  it('?tab=subscriptions redirects to /users/billing (drops tab param)', () => {
    const route = getUsersRoute();
    const to = { path: '/users', query: { tab: 'subscriptions' }, hash: '' };

    const result = route.beforeEnter(to);

    expect(result).toEqual({ path: '/users/billing', query: {} });
  });

  it('?tab=subscriptions with additional query params → /users/billing (preserves extra params, drops tab)', () => {
    const route = getUsersRoute();
    const to = { path: '/users', query: { tab: 'subscriptions', foo: 'bar' }, hash: '' };

    const result = route.beforeEnter(to);

    expect(result).toEqual({ path: '/users/billing', query: { foo: 'bar' } });
  });

  it('trailing-slash variant /users/?tab=subscriptions redirects the same way', () => {
    // Vue Router normalises trailing slashes before beforeEnter fires, but guard
    // only cares about the query object — path variant is irrelevant. Verify guard
    // handles it regardless of path value in `to`.
    const route = getUsersRoute();
    const to = { path: '/users/', query: { tab: 'subscriptions' }, hash: '' };

    const result = route.beforeEnter(to);

    expect(result).toEqual({ path: '/users/billing', query: {} });
  });

  it('Stripe callback params (success, type) are preserved when tab=subscriptions is present', () => {
    const route = getUsersRoute();
    const to = { path: '/users', query: { tab: 'subscriptions', success: 'true', type: 'plan' }, hash: '' };

    const result = route.beforeEnter(to);

    expect(result.path).toBe('/users/billing');
    expect(result.query.success).toBe('true');
    expect(result.query.type).toBe('plan');
    expect(result.query.tab).toBeUndefined();
  });

  it('?tab=profile is NOT redirected (profile tab is valid)', () => {
    const route = getUsersRoute();
    const to = { path: '/users', query: { tab: 'profile' }, hash: '' };

    const result = route.beforeEnter(to);

    // Guard must return undefined (falsy = proceed normally)
    expect(result).toBeUndefined();
  });

  it('no query params: /users loads normally (no redirect)', () => {
    const route = getUsersRoute();
    const to = { path: '/users', query: {}, hash: '' };

    const result = route.beforeEnter(to);

    expect(result).toBeUndefined();
  });

  it('?tab=organizations is NOT redirected', () => {
    const route = getUsersRoute();
    const to = { path: '/users', query: { tab: 'organizations' }, hash: '' };

    const result = route.beforeEnter(to);

    expect(result).toBeUndefined();
  });
});

describe('users.router – C4 /billing redirect regression', () => {
  /**
   * The /billing → /users/billing redirect lives in billing.router.js.
   * Its tests are in billing.router.unit.tests.js — guard that users.router
   * does NOT accidentally re-implement or conflict with it.
   */
  it('/users/billing is NOT declared in users.router (it belongs to billing.router)', () => {
    const billingAccountRoute = usersRoutes.find((r) => r.path === '/users/billing');
    expect(billingAccountRoute).toBeUndefined();
  });
});
