import { describe, it, expect } from 'vitest';
import { organizationRoutes } from '../router/billing.router';
import defaultRoutes from '../router/billing.router';

describe('billing.router', () => {
  it('exports an org-surface child route gated by CASL route-meta', () => {
    const route = organizationRoutes[0];
    expect(route.path).toBe('billing');
    expect(route.name).toBe('Account Organization Billing');
    expect(typeof route.component).toBe('function'); // lazy import
    expect(route.meta).toMatchObject({ display: false, action: 'manage', subject: 'Organization' });
  });

  it('default export contains only absolute top-level routes and does not leak the org child', () => {
    // Non-empty array of top-level routes
    expect(Array.isArray(defaultRoutes)).toBe(true);
    expect(defaultRoutes.length).toBeGreaterThanOrEqual(1);

    // Every entry uses an absolute path (starts with '/')
    for (const route of defaultRoutes) {
      expect(route.path).toMatch(/^\//);
    }

    // The relative 'billing' org child must NOT appear in the default export
    const hasOrgChild = defaultRoutes.some((r) => r.path === 'billing');
    expect(hasOrgChild).toBe(false);
  });

  // ── C4: account billing route ────────────────────────────────────────────

  it('default export contains the /users/billing account route (absolute path)', () => {
    const accountRoute = defaultRoutes.find((r) => r.path === '/users/billing');
    expect(accountRoute).toBeDefined();
    expect(accountRoute.name).toBe('Account Billing');
    expect(accountRoute.component).toBeDefined();
    // Must not be a redirect — it should render the account view
    expect(accountRoute.redirect).toBeUndefined();
    expect(accountRoute.meta).toMatchObject({ requiresAuth: true });
  });

  it('the /billing legacy route redirects to /users/billing (not to /users?tab=subscriptions)', () => {
    const legacyRoute = defaultRoutes.find((r) => r.path === '/billing');
    expect(legacyRoute).toBeDefined();
    expect(legacyRoute.redirect).toBeDefined();
    // Invoke the redirect function to verify the target
    const target = typeof legacyRoute.redirect === 'function'
      ? legacyRoute.redirect({ query: {} })
      : legacyRoute.redirect;
    expect(target.path).toBe('/users/billing');
  });

  it('the /users/billing account route comes before the /billing redirect in the default export', () => {
    const accountIdx = defaultRoutes.findIndex((r) => r.path === '/users/billing');
    const legacyIdx = defaultRoutes.findIndex((r) => r.path === '/billing');
    expect(accountIdx).toBeGreaterThanOrEqual(0);
    expect(legacyIdx).toBeGreaterThanOrEqual(0);
    expect(accountIdx).toBeLessThan(legacyIdx);
  });

  it('C1 guard still passes: no route in default export has path === "billing" (relative child absent)', () => {
    const hasRelativeChild = defaultRoutes.some((r) => r.path === 'billing');
    expect(hasRelativeChild).toBe(false);
  });
});
