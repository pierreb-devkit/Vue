import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCoreStore } from '../stores/core.store';

describe('Core Store', () => {
  beforeEach(() => {
    // Create a new pinia instance for each test
    setActivePinia(createPinia());
    // Clear localStorage
    localStorage.clear();
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
      { path: '/admin', name: 'admin', meta: { display: true, roles: ['admin'] } },
      { path: '/user', name: 'user', meta: { display: true, roles: ['user'] } },
    ];

    coreStore.init(mockRoutes);

    // Not logged in
    coreStore.refreshNav(false);
    expect(coreStore.nav.length).toBeGreaterThan(0);

    // Logged in with roles
    localStorage.setItem('waosUserRoles', 'admin,user');
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

  it('should show routes without roles when not logged in', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true } },
      { path: '/public', name: 'public', meta: { display: true, roles: false } },
      { path: '/admin', name: 'admin', meta: { display: true, roles: ['admin'] } },
    ];

    coreStore.init(mockRoutes);
    coreStore.refreshNav(false);

    const publicRoute = coreStore.nav.find((route) => route.name === 'public');
    const adminRoute = coreStore.nav.find((route) => route.name === 'admin');

    expect(publicRoute).toBeDefined();
    expect(adminRoute).toBeUndefined();
  });

  it('should handle routes without meta.roles property', () => {
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
});
