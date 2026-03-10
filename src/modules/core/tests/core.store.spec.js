import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// Mock the ability module — vi.hoisted ensures the variable exists before vi.mock runs
const mockAbility = vi.hoisted(() => ({ rules: [], can: vi.fn(() => false) }));
vi.mock('../../../lib/helpers/ability', () => ({
  ability: mockAbility,
}));

import { useCoreStore } from '../stores/core.store';

describe('Core Store', () => {
  beforeEach(() => {
    // Create a new pinia instance for each test
    setActivePinia(createPinia());
    // Clear localStorage
    localStorage.clear();
    // Reset ability mock
    mockAbility.rules = [];
    mockAbility.can.mockReset();
    mockAbility.can.mockReturnValue(false);
  });

  it('should initialize with default state', () => {
    const coreStore = useCoreStore();
    expect(coreStore.drawer).toBe(false);
    expect(coreStore.mini).toBe(false);
    expect(coreStore.nav).toEqual([]);
    expect(coreStore.routes).toEqual([]);
  });

  it('should update drawer state', () => {
    const coreStore = useCoreStore();
    expect(coreStore.drawer).toBe(false);

    coreStore.setDrawer(true);
    expect(coreStore.drawer).toBe(true);

    coreStore.setDrawer(false);
    expect(coreStore.drawer).toBe(false);
  });

  it('should update mini state', () => {
    const coreStore = useCoreStore();
    expect(coreStore.mini).toBe(false);

    coreStore.setMini(true);
    expect(coreStore.mini).toBe(true);

    coreStore.setMini(false);
    expect(coreStore.mini).toBe(false);
  });

  it('should initialize routes', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true } },
      { path: '/about', name: 'about', meta: { display: true } },
    ];

    coreStore.init(mockRoutes);

    expect(coreStore.routes).toEqual(mockRoutes);
  });

  it('should refresh nav based on logged in status', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true } },
      { path: '/admin', name: 'admin', meta: { display: true, action: 'manage', subject: 'User' } },
      { path: '/user', name: 'user', meta: { display: true, action: 'read', subject: 'Task' } },
    ];

    coreStore.init(mockRoutes);

    // Not logged in — only public routes
    coreStore.refreshNav(false);
    expect(coreStore.nav.length).toBeGreaterThan(0);

    // Logged in with abilities
    mockAbility.rules = [{ action: 'manage', subject: 'User' }];
    mockAbility.can.mockReturnValue(true);
    coreStore.refreshNav(true);
    expect(coreStore.nav.length).toBeGreaterThan(0);
  });

  it('should initialize theme correctly', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [{ path: '/', name: 'home', meta: { display: true } }];

    coreStore.init(mockRoutes);

    expect(coreStore.theme).toBeDefined();
    expect(['light', 'dark']).toContain(coreStore.theme);
  });

  it('should filter out routes with display false', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true } },
      { path: '/hidden', name: 'hidden', meta: { display: false } },
      { path: '/about', name: 'about', meta: { display: true } },
    ];

    coreStore.init(mockRoutes);
    coreStore.refreshNav(false);

    const hiddenRoute = coreStore.nav.find((route) => route.name === 'hidden');
    expect(hiddenRoute).toBeUndefined();
  });

  it('should show routes without action when not logged in', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true } },
      { path: '/public', name: 'public', meta: { display: true } },
      { path: '/admin', name: 'admin', meta: { display: true, action: 'manage', subject: 'User' } },
    ];

    coreStore.init(mockRoutes);
    coreStore.refreshNav(false);

    const publicRoute = coreStore.nav.find((route) => route.name === 'public');
    const adminRoute = coreStore.nav.find((route) => route.name === 'admin');

    expect(publicRoute).toBeDefined();
    expect(adminRoute).toBeUndefined();
  });

  it('should handle routes without meta.action property', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true } },
      { path: '/public', name: 'public', meta: { display: true } },
    ];

    coreStore.init(mockRoutes);
    coreStore.refreshNav(false);

    expect(coreStore.nav.length).toBe(2);
    expect(coreStore.nav.find((route) => route.name === 'home')).toBeDefined();
    expect(coreStore.nav.find((route) => route.name === 'public')).toBeDefined();
  });

  it('should show only public routes when not logged in', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true } },
      { path: '/admin', name: 'admin', meta: { display: true, action: 'manage', subject: 'User' } },
      { path: '/user', name: 'user', meta: { display: true, action: 'read', subject: 'Task' } },
    ];

    coreStore.init(mockRoutes);
    coreStore.refreshNav(false);

    expect(coreStore.nav.find((r) => r.name === 'home')).toBeDefined();
    expect(coreStore.nav.find((r) => r.name === 'admin')).toBeUndefined();
    expect(coreStore.nav.find((r) => r.name === 'user')).toBeUndefined();
  });

  it('should show guarded routes when logged in with matching abilities', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true } },
      { path: '/admin', name: 'admin', meta: { display: true, action: 'manage', subject: 'User' } },
      { path: '/user', name: 'user', meta: { display: true, action: 'read', subject: 'Task' } },
    ];

    coreStore.init(mockRoutes);
    mockAbility.rules = [{ action: 'manage', subject: 'all' }];
    mockAbility.can.mockReturnValue(true);
    coreStore.refreshNav(true);

    expect(coreStore.nav.find((r) => r.name === 'home')).toBeDefined();
    expect(coreStore.nav.find((r) => r.name === 'admin')).toBeDefined();
    expect(coreStore.nav.find((r) => r.name === 'user')).toBeDefined();
  });

  it('should hide guarded routes when logged in but abilities do not match', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true } },
      { path: '/admin', name: 'admin', meta: { display: true, action: 'manage', subject: 'User' } },
    ];

    coreStore.init(mockRoutes);
    mockAbility.rules = [{ action: 'read', subject: 'Task' }];
    mockAbility.can.mockReturnValue(false);
    coreStore.refreshNav(true);

    expect(coreStore.nav.find((r) => r.name === 'home')).toBeDefined();
    expect(coreStore.nav.find((r) => r.name === 'admin')).toBeUndefined();
  });

  it('should always hide routes with display: false even when logged in with matching abilities', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/signin', name: 'signin', meta: { display: false } },
      { path: '/admin-hidden', name: 'admin-hidden', meta: { display: false, action: 'manage', subject: 'User' } },
      { path: '/', name: 'home', meta: { display: true } },
    ];

    coreStore.init(mockRoutes);
    mockAbility.rules = [{ action: 'manage', subject: 'all' }];
    mockAbility.can.mockReturnValue(true);
    coreStore.refreshNav(true);

    expect(coreStore.nav.find((r) => r.name === 'signin')).toBeUndefined();
    expect(coreStore.nav.find((r) => r.name === 'admin-hidden')).toBeUndefined();
    expect(coreStore.nav.find((r) => r.name === 'home')).toBeDefined();
  });

  it('should fallback to isLoggedIn when no ability rules are loaded', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true } },
      { path: '/admin', name: 'admin', meta: { display: true, action: 'manage', subject: 'User' } },
    ];

    coreStore.init(mockRoutes);
    // No ability rules — empty
    mockAbility.rules = [];
    coreStore.refreshNav(true);

    // Should show admin via fallback since user is logged in
    expect(coreStore.nav.find((r) => r.name === 'home')).toBeDefined();
    expect(coreStore.nav.find((r) => r.name === 'admin')).toBeDefined();
  });

  it('should not show guarded routes when not logged in even without ability rules', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true } },
      { path: '/admin', name: 'admin', meta: { display: true, action: 'manage', subject: 'User' } },
    ];

    coreStore.init(mockRoutes);
    mockAbility.rules = [];
    coreStore.refreshNav(false);

    expect(coreStore.nav.find((r) => r.name === 'home')).toBeDefined();
    expect(coreStore.nav.find((r) => r.name === 'admin')).toBeUndefined();
  });
});
