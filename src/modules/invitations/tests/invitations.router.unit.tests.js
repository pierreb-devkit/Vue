import { describe, it, expect } from 'vitest';
import router, { invitationsAdminRoutes, invitationsAccountRoutes } from '../router/invitations.router';

describe('invitations.router', () => {
  it('exports two named child-route arrays (admin + account)', () => {
    expect(Array.isArray(invitationsAdminRoutes)).toBe(true);
    expect(Array.isArray(invitationsAccountRoutes)).toBe(true);
    expect(invitationsAdminRoutes).toHaveLength(1);
    expect(invitationsAccountRoutes).toHaveLength(1);
    // default export bundles both (the shape app.router.js consumes)
    expect(router.invitationsAdminRoutes).toBe(invitationsAdminRoutes);
    expect(router.invitationsAccountRoutes).toBe(invitationsAccountRoutes);
  });

  it('admin route is RELATIVE (resolves under /admin) and CASL-gated to platform admins', () => {
    const [admin] = invitationsAdminRoutes;
    // relative path — isValidChildRoute rejects absolute/degenerate routes
    expect(admin.path).toBe('invitations');
    expect(admin.path.startsWith('/')).toBe(false);
    expect(admin.meta).toMatchObject({ action: 'manage', subject: 'UserAdmin' });
    expect(typeof admin.component).toBe('function'); // lazy import
  });

  it('account route is RELATIVE (resolves under /users) and requires auth', () => {
    const [account] = invitationsAccountRoutes;
    expect(account.path).toBe('invitations');
    expect(account.path.startsWith('/')).toBe(false);
    expect(account.meta).toMatchObject({ requiresAuth: true });
    expect(typeof account.component).toBe('function'); // lazy import
  });

  it('the two routes target distinct lazy-loaded views', () => {
    const [admin] = invitationsAdminRoutes;
    const [account] = invitationsAccountRoutes;
    expect(admin.component).not.toBe(account.component);
  });
});
