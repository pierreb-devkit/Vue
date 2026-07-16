import { describe, test, expect } from 'vitest';
import routes from '../router/organizations.router';

describe('organizations router', () => {
  test('Account Organization General child path is "general" not ""', () => {
    const parent = routes.find((r) => r.name === 'Account Organization');
    expect(parent).toBeTruthy();
    const general = parent.children?.find((c) => c.name === 'Account Organization General');
    expect(general).toBeTruthy();
    expect(general.path).toBe('general');
  });

  test('Account Organization has a redirect from "" to General', () => {
    const parent = routes.find((r) => r.name === 'Account Organization');
    const redirect = parent.children?.find((c) => c.path === '' && c.redirect);
    expect(redirect).toBeTruthy();
    expect(redirect.redirect).toEqual({ name: 'Account Organization General' });
  });

  // #4448 — core.header.component.vue reads this flag instead of hardcoding
  // the '/organization-required' path literal.
  test('Organization Required route carries meta.orgGate for core.header.component.vue', () => {
    const route = routes.find((r) => r.path === '/organization-required');
    expect(route).toBeTruthy();
    expect(route.meta.orgGate).toBe(true);
  });
});
