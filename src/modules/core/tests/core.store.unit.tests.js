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
      { path: '/', name: 'home', meta: { display: true, icon: 'fa-solid fa-house' } },
      { path: '/about', name: 'about', meta: { display: true, icon: 'fa-solid fa-info' } },
    ];

    coreStore.init(mockRoutes);

    expect(coreStore.routes).toEqual(mockRoutes);
  });

  it('should refresh nav based on logged in status', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true, icon: 'fa-solid fa-house' } },
      { path: '/admin', name: 'admin', meta: { display: true, icon: 'fa-solid fa-user-tie', action: 'manage', subject: 'User' } },
      { path: '/user', name: 'user', meta: { display: true, icon: 'fa-solid fa-list', action: 'read', subject: 'Task' } },
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
    const mockRoutes = [{ path: '/', name: 'home', meta: { display: true, icon: 'fa-solid fa-house' } }];

    coreStore.init(mockRoutes);

    expect(coreStore.theme).toBeDefined();
    expect(['light', 'dark']).toContain(coreStore.theme);
  });

  it('should filter out routes with display false', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true, icon: 'fa-solid fa-house' } },
      { path: '/hidden', name: 'hidden', meta: { display: false, icon: 'fa-solid fa-eye-slash' } },
      { path: '/about', name: 'about', meta: { display: true, icon: 'fa-solid fa-info' } },
    ];

    coreStore.init(mockRoutes);
    coreStore.refreshNav(false);

    const hiddenRoute = coreStore.nav.find((route) => route.name === 'hidden');
    expect(hiddenRoute).toBeUndefined();
  });

  it('should filter out routes without meta.icon', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true, icon: 'fa-solid fa-house' } },
      { path: '/ghost', name: 'ghost', meta: { display: true } },
      { path: '/org', name: 'Organizations', meta: { action: 'read', subject: 'Organization' } },
    ];

    coreStore.init(mockRoutes);
    mockAbility.rules = [{ action: 'read', subject: 'Organization' }];
    mockAbility.can.mockReturnValue(true);
    coreStore.refreshNav(true);

    expect(coreStore.nav.find((r) => r.name === 'home')).toBeDefined();
    expect(coreStore.nav.find((r) => r.name === 'ghost')).toBeUndefined();
    expect(coreStore.nav.find((r) => r.name === 'Organizations')).toBeUndefined();
  });

  it('should show routes without action when not logged in', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true, icon: 'fa-solid fa-house' } },
      { path: '/public', name: 'public', meta: { display: true, icon: 'fa-solid fa-globe' } },
      { path: '/admin', name: 'admin', meta: { display: true, icon: 'fa-solid fa-user-tie', action: 'manage', subject: 'User' } },
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
      { path: '/', name: 'home', meta: { display: true, icon: 'fa-solid fa-house' } },
      { path: '/public', name: 'public', meta: { display: true, icon: 'fa-solid fa-globe' } },
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
      { path: '/', name: 'home', meta: { display: true, icon: 'fa-solid fa-house' } },
      { path: '/admin', name: 'admin', meta: { display: true, icon: 'fa-solid fa-user-tie', action: 'manage', subject: 'User' } },
      { path: '/user', name: 'user', meta: { display: true, icon: 'fa-solid fa-list', action: 'read', subject: 'Task' } },
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
      { path: '/', name: 'home', meta: { display: true, icon: 'fa-solid fa-house' } },
      { path: '/admin', name: 'admin', meta: { display: true, icon: 'fa-solid fa-user-tie', action: 'manage', subject: 'User' } },
      { path: '/user', name: 'user', meta: { display: true, icon: 'fa-solid fa-list', action: 'read', subject: 'Task' } },
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
      { path: '/', name: 'home', meta: { display: true, icon: 'fa-solid fa-house' } },
      { path: '/admin', name: 'admin', meta: { display: true, icon: 'fa-solid fa-user-tie', action: 'manage', subject: 'User' } },
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
      { path: '/signin', name: 'signin', meta: { display: false, icon: 'fa-solid fa-sign-in' } },
      { path: '/admin-hidden', name: 'admin-hidden', meta: { display: false, icon: 'fa-solid fa-user-tie', action: 'manage', subject: 'User' } },
      { path: '/', name: 'home', meta: { display: true, icon: 'fa-solid fa-house' } },
    ];

    coreStore.init(mockRoutes);
    mockAbility.rules = [{ action: 'manage', subject: 'all' }];
    mockAbility.can.mockReturnValue(true);
    coreStore.refreshNav(true);

    expect(coreStore.nav.find((r) => r.name === 'signin')).toBeUndefined();
    expect(coreStore.nav.find((r) => r.name === 'admin-hidden')).toBeUndefined();
    expect(coreStore.nav.find((r) => r.name === 'home')).toBeDefined();
  });

  it('should hide guarded routes when logged in but no ability rules are loaded', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true, icon: 'fa-solid fa-house' } },
      { path: '/admin', name: 'admin', meta: { display: true, icon: 'fa-solid fa-user-tie', action: 'manage', subject: 'User' } },
    ];

    coreStore.init(mockRoutes);
    // No ability rules — empty, ability.can returns false
    mockAbility.rules = [];
    coreStore.refreshNav(true);

    // Home is public (no action), so it shows; admin requires ability.can which returns false
    expect(coreStore.nav.find((r) => r.name === 'home')).toBeDefined();
    expect(coreStore.nav.find((r) => r.name === 'admin')).toBeUndefined();
  });

  it('should include external-link routes (meta.href without component) in the nav', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true, icon: 'fa-solid fa-house' } },
      {
        path: '/api-docs',
        name: 'API Docs',
        meta: { display: true, icon: 'fa-solid fa-book', href: 'https://api.trawl.me/api/docs', target: '_blank' },
      },
    ];

    coreStore.init(mockRoutes);
    coreStore.refreshNav(false);

    const external = coreStore.nav.find((r) => r.name === 'API Docs');
    expect(external).toBeDefined();
    expect(external.meta.href).toBe('https://api.trawl.me/api/docs');
  });

  it('should place external-link routes in navBottom when meta.position is "bottom"', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      {
        path: '/api-docs',
        name: 'API Docs',
        meta: {
          display: true,
          icon: 'fa-solid fa-book',
          href: 'https://api.trawl.me/api/docs',
          position: 'bottom',
        },
      },
    ];

    coreStore.init(mockRoutes);
    coreStore.refreshNav(false);

    expect(coreStore.nav.find((r) => r.name === 'API Docs')).toBeUndefined();
    expect(coreStore.navBottom.find((r) => r.name === 'API Docs')).toBeDefined();
  });

  it('should hide external-link routes when meta.display is false', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      {
        path: '/api-docs',
        name: 'API Docs',
        meta: { display: false, icon: 'fa-solid fa-book', href: 'https://api.trawl.me/api/docs' },
      },
    ];

    coreStore.init(mockRoutes);
    coreStore.refreshNav(false);

    expect(coreStore.nav.find((r) => r.name === 'API Docs')).toBeUndefined();
    expect(coreStore.navBottom.find((r) => r.name === 'API Docs')).toBeUndefined();
  });

  it('should respect CASL permissions on external-link routes', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      {
        path: '/admin-docs',
        name: 'Admin Docs',
        meta: {
          display: true,
          icon: 'fa-solid fa-book',
          href: 'https://admin.example.com/docs',
          action: 'manage',
          subject: 'User',
        },
      },
    ];

    coreStore.init(mockRoutes);
    // User without matching ability
    mockAbility.rules = [];
    mockAbility.can.mockReturnValue(false);
    coreStore.refreshNav(true);
    expect(coreStore.nav.find((r) => r.name === 'Admin Docs')).toBeUndefined();

    // User with matching ability
    mockAbility.rules = [{ action: 'manage', subject: 'User' }];
    mockAbility.can.mockReturnValue(true);
    coreStore.refreshNav(true);
    expect(coreStore.nav.find((r) => r.name === 'Admin Docs')).toBeDefined();
  });

  it('should not show guarded routes when not logged in even without ability rules', () => {
    const coreStore = useCoreStore();
    const mockRoutes = [
      { path: '/', name: 'home', meta: { display: true, icon: 'fa-solid fa-house' } },
      { path: '/admin', name: 'admin', meta: { display: true, icon: 'fa-solid fa-user-tie', action: 'manage', subject: 'User' } },
    ];

    coreStore.init(mockRoutes);
    mockAbility.rules = [];
    coreStore.refreshNav(false);

    expect(coreStore.nav.find((r) => r.name === 'home')).toBeDefined();
    expect(coreStore.nav.find((r) => r.name === 'admin')).toBeUndefined();
  });

  describe('refreshNav — meta.order sorting', () => {
    it('should sort nav by meta.order ascending (lower first)', () => {
      const coreStore = useCoreStore();
      const mockRoutes = [
        { path: '/c', name: 'c', meta: { display: true, icon: 'i', order: 30 } },
        { path: '/a', name: 'a', meta: { display: true, icon: 'i', order: 10 } },
        { path: '/b', name: 'b', meta: { display: true, icon: 'i', order: 20 } },
      ];

      coreStore.init(mockRoutes);
      coreStore.refreshNav(false);

      expect(coreStore.nav.map((r) => r.name)).toEqual(['a', 'b', 'c']);
    });

    it('should sort navBottom by meta.order independently from nav', () => {
      const coreStore = useCoreStore();
      const mockRoutes = [
        { path: '/top-b', name: 'top-b', meta: { display: true, icon: 'i', order: 20 } },
        { path: '/top-a', name: 'top-a', meta: { display: true, icon: 'i', order: 10 } },
        { path: '/bot-b', name: 'bot-b', meta: { display: true, icon: 'i', order: 20, position: 'bottom' } },
        { path: '/bot-a', name: 'bot-a', meta: { display: true, icon: 'i', order: 10, position: 'bottom' } },
      ];

      coreStore.init(mockRoutes);
      coreStore.refreshNav(false);

      expect(coreStore.nav.map((r) => r.name)).toEqual(['top-a', 'top-b']);
      expect(coreStore.navBottom.map((r) => r.name)).toEqual(['bot-a', 'bot-b']);
    });

    it('should place routes without meta.order at the end', () => {
      const coreStore = useCoreStore();
      const mockRoutes = [
        { path: '/no-order', name: 'no-order', meta: { display: true, icon: 'i' } },
        { path: '/ordered', name: 'ordered', meta: { display: true, icon: 'i', order: 10 } },
      ];

      coreStore.init(mockRoutes);
      coreStore.refreshNav(false);

      expect(coreStore.nav.map((r) => r.name)).toEqual(['ordered', 'no-order']);
    });

    it('should place ordered routes before unordered ones in mixed case', () => {
      const coreStore = useCoreStore();
      const mockRoutes = [
        { path: '/no-a', name: 'no-a', meta: { display: true, icon: 'i' } },
        { path: '/ord-b', name: 'ord-b', meta: { display: true, icon: 'i', order: 20 } },
        { path: '/no-b', name: 'no-b', meta: { display: true, icon: 'i' } },
        { path: '/ord-a', name: 'ord-a', meta: { display: true, icon: 'i', order: 10 } },
      ];

      coreStore.init(mockRoutes);
      coreStore.refreshNav(false);

      // ordered items come first, in ascending order
      expect(coreStore.nav[0].name).toBe('ord-a');
      expect(coreStore.nav[1].name).toBe('ord-b');
      // unordered items follow
      expect(coreStore.nav.slice(2).map((r) => r.name).sort()).toEqual(['no-a', 'no-b']);
    });

    it('should fall back to meta.action desc tiebreaker when orders are equal', () => {
      const coreStore = useCoreStore();
      // Same order, different meta.action — desc alpha => 'read' before 'create'
      const mockRoutes = [
        { path: '/create', name: 'create', meta: { display: true, icon: 'i', order: 10, action: 'create', subject: 'Task' } },
        { path: '/read', name: 'read', meta: { display: true, icon: 'i', order: 10, action: 'read', subject: 'Task' } },
      ];

      coreStore.init(mockRoutes);
      mockAbility.rules = [{ action: 'manage', subject: 'all' }];
      mockAbility.can.mockReturnValue(true);
      coreStore.refreshNav(true);

      // 'read' > 'create' alphabetically, desc tiebreaker → 'read' first
      expect(coreStore.nav.map((r) => r.name)).toEqual(['read', 'create']);
    });

    it('should preserve legacy meta.action desc behaviour for unordered routes', () => {
      const coreStore = useCoreStore();
      const mockRoutes = [
        { path: '/create', name: 'create', meta: { display: true, icon: 'i', action: 'create', subject: 'Task' } },
        { path: '/read', name: 'read', meta: { display: true, icon: 'i', action: 'read', subject: 'Task' } },
      ];

      coreStore.init(mockRoutes);
      mockAbility.rules = [{ action: 'manage', subject: 'all' }];
      mockAbility.can.mockReturnValue(true);
      coreStore.refreshNav(true);

      // Legacy tiebreaker: 'read' (desc) before 'create'
      expect(coreStore.nav.map((r) => r.name)).toEqual(['read', 'create']);
    });

    it('should treat meta.order: 0 as a valid leading position', () => {
      const coreStore = useCoreStore();
      const mockRoutes = [
        { path: '/ten', name: 'ten', meta: { display: true, icon: 'i', order: 10 } },
        { path: '/zero', name: 'zero', meta: { display: true, icon: 'i', order: 0 } },
      ];

      coreStore.init(mockRoutes);
      coreStore.refreshNav(false);

      expect(coreStore.nav.map((r) => r.name)).toEqual(['zero', 'ten']);
    });
  });
});
