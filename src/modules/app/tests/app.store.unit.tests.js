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

  const mockRoutes = [
    { path: '/', name: 'Home' },
    { path: '/secure', name: 'Secure', meta: { roles: ['user'] } },
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
});
