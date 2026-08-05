import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

const coreInitMock = vi.fn();
const authInitMock = vi.fn();
const homeInitMock = vi.fn();

vi.mock('../../core/stores/core.store', () => ({
  useCoreStore: () => ({ init: coreInitMock }),
}));

vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => ({ initFromStorage: authInitMock }),
}));

vi.mock('../../home/stores/home.store', () => ({
  useHomeStore: () => ({ initStatistics: homeInitMock }),
}));

import initializeStores from '../app.store';

describe('initializeStores', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // Self-contained fixture covering both route-meta conventions in use across the stack:
  // role-list gating (`meta.roles`) and CASL action/subject gating (`meta.action`/`meta.subject`).
  // initializeStores only forwards routes to coreStore.init — it must stay agnostic to which
  // meta shape a route (or a consumer's route) uses, so the fixture never assumes just one.
  // `app` is a core module (CLAUDE.md: core modules never reference optional module names), so
  // the CASL subject here is a synthetic placeholder, not any real (optional) module's model.
  const mockRoutes = [
    { path: '/', name: 'Home' },
    { path: '/secure', name: 'Secure', meta: { roles: ['user'] } },
    { path: '/manage', name: 'Manage', meta: { action: 'manage', subject: 'Widget' } },
  ];

  it('calls coreStore.init with the provided routes', () => {
    initializeStores(mockRoutes);
    expect(coreInitMock).toHaveBeenCalledOnce();
    expect(coreInitMock).toHaveBeenCalledWith(mockRoutes);
  });

  it('calls authStore.initFromStorage', () => {
    initializeStores(mockRoutes);
    expect(authInitMock).toHaveBeenCalledOnce();
  });

  it('calls homeStore.initStatistics', () => {
    initializeStores(mockRoutes);
    expect(homeInitMock).toHaveBeenCalledOnce();
  });

  it('returns an object with core, auth and home stores', () => {
    const stores = initializeStores(mockRoutes);
    expect(stores).toHaveProperty('core');
    expect(stores).toHaveProperty('auth');
    expect(stores).toHaveProperty('home');
  });

  it('returned core store has init method', () => {
    const { core } = initializeStores(mockRoutes);
    expect(typeof core.init).toBe('function');
  });

  it('forwards routes verbatim regardless of route-meta shape (roles-based or action/subject-based)', () => {
    initializeStores(mockRoutes);
    const forwardedRoutes = coreInitMock.mock.calls[0][0];
    expect(forwardedRoutes.find((r) => r.name === 'Secure').meta).toEqual({ roles: ['user'] });
    expect(forwardedRoutes.find((r) => r.name === 'Manage').meta).toEqual({ action: 'manage', subject: 'Widget' });
  });
});
