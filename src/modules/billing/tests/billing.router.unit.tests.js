import { describe, it, expect } from 'vitest';
import { organizationRoutes } from '../router/billing.router';

describe('billing.router', () => {
  it('exports an org-surface child route gated by CASL route-meta', () => {
    const route = organizationRoutes[0];
    expect(route.path).toBe('billing');
    expect(route.name).toBe('Organization Billing');
    expect(typeof route.component).toBe('function'); // lazy import
    expect(route.meta).toMatchObject({ display: false, action: 'manage', subject: 'Organization' });
  });
});
