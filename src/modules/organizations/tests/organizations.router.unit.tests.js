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
});
