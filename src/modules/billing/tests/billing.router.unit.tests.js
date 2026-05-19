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
});
