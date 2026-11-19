import { describe, it, expect } from 'vitest';
import usersRoutes from '../router/users.router';

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

describe('users.router – no legacy ?tab=subscriptions redirect', () => {
  it('/users route carries no beforeEnter guard (Stripe returns to /users/billing directly)', () => {
    const route = usersRoutes.find((r) => r.path === '/users');
    expect(route.beforeEnter).toBeUndefined();
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

describe('users.router – Gamma: Account child routes (route-driven tabs)', () => {
  /** @returns {import('vue-router').RouteRecordRaw|undefined} */
  const getAccountRoute = () => usersRoutes.find((r) => r.path === '/users');

  it('Account route has children array', () => {
    const route = getAccountRoute();
    expect(Array.isArray(route.children)).toBe(true);
    expect(route.children.length).toBeGreaterThanOrEqual(2);
  });

  it('bare path "" child redirects to Account Profile', () => {
    const route = getAccountRoute();
    const bareChild = route.children.find((c) => c.path === '');
    expect(bareChild).toBeDefined();
    expect(bareChild.redirect).toEqual({ name: 'Account Profile' });
  });

  it('Account Profile child has path "profile" and requires auth (no CASL — matches pre-Gamma)', () => {
    const route = getAccountRoute();
    const profile = route.children.find((c) => c.name === 'Account Profile');
    expect(profile).toBeDefined();
    expect(profile.path).toBe('profile');
    expect(profile.meta.requiresAuth).toBe(true);
    expect(profile.meta.action).toBeUndefined();
    expect(profile.meta.subject).toBeUndefined();
  });

  it('does not own the Account Organizations child (the organizations module injects it)', () => {
    const route = getAccountRoute();
    expect(route.children.find((c) => c.name === 'Account Organizations')).toBeUndefined();
  });
});
