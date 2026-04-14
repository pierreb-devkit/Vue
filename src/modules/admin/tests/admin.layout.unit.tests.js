import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

vi.mock('../stores/admin.store', () => ({
  useAdminStore: () => ({
    error: null,
  }),
}));

vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => ({
    serverConfig: null,
  }),
}));

import AdminLayout from '../views/admin.layout.vue';

const baseConfig = {
  vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
};

/**
 * Mount admin layout with optional config overrides and $route.path.
 * @param {object} configOverrides - merged into baseConfig
 * @param {string} [routePath] - current route path (defaults to /admin/users)
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountLayout = (configOverrides = {}, routePath = '/admin/users') =>
  mount(AdminLayout, {
    global: {
      plugins: [createVuetify()],
      mocks: {
        config: { ...baseConfig, ...configOverrides },
        $route: { path: routePath },
        $router: { push: vi.fn() },
      },
      stubs: {
        RouterLink: true,
        RouterView: { template: '<div class="router-view-stub" />' },
        PageHeader: { template: '<div class="page-header-stub" />' },
      },
    },
  });

describe('admin.layout', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should render the page header', () => {
    const wrapper = mountLayout();
    expect(wrapper.find('.page-header-stub').exists()).toBe(true);
  });

  it('should render a <router-view> for nested admin content', () => {
    const wrapper = mountLayout();
    expect(wrapper.find('.router-view-stub').exists()).toBe(true);
  });

  it('should render the four built-in tabs when no extras are configured', () => {
    const wrapper = mountLayout();
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(4);
    expect(tabs[0].text()).toContain('Users');
    expect(tabs[1].text()).toContain('Organizations');
    expect(tabs[2].text()).toContain('Readiness');
    expect(tabs[3].text()).toContain('Activity');
  });

  it('should render built-in + extra tabs from config.admin.tabs in a single flat row', () => {
    const wrapper = mountLayout({
      admin: {
        tabs: [
          { value: 'knowledge', label: 'Knowledge', icon: 'fa-solid fa-book', route: 'knowledge' },
          { value: 'costs', label: 'Costs', route: 'costs' },
        ],
      },
    });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(6);
    expect(tabs[0].text()).toContain('Users');
    expect(tabs[3].text()).toContain('Activity');
    expect(tabs[4].text()).toContain('Knowledge');
    expect(tabs[5].text()).toContain('Costs');
  });

  it('should resolve relative tab routes under /admin/', () => {
    const wrapper = mountLayout({
      admin: {
        tabs: [
          { value: 'knowledge', label: 'Knowledge', route: 'knowledge' },
        ],
      },
    });
    expect(wrapper.vm.tabTo({ route: 'knowledge' })).toBe('/admin/knowledge');
  });

  it('should accept legacy absolute routes under /admin/ and warn', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mountLayout({
      admin: {
        tabs: [
          { value: 'legacy', label: 'Legacy', route: '/admin/legacy' },
        ],
      },
    });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(5); // 4 built-in + Legacy
    expect(tabs[4].text()).toContain('Legacy');
    expect(wrapper.vm.tabTo({ route: '/admin/legacy' })).toBe('/admin/legacy');
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Legacy absolute tab route'));
    consoleWarnSpy.mockRestore();
  });

  it('should filter out tab routes with path traversal segments', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mountLayout({
      admin: {
        tabs: [
          { value: 'ok', label: 'Ok', route: 'ok' },
          { value: 'evil', label: 'Evil', route: '../users' },
          { value: 'dotted', label: 'Dotted', route: 'foo/./bar' },
        ],
      },
    });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(5); // 4 built-in + Ok
    expect(tabs[4].text()).toContain('Ok');
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('should filter out empty and whitespace tab routes', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mountLayout({
      admin: {
        tabs: [
          { value: 'ok', label: 'Ok', route: 'ok' },
          { value: 'empty', label: 'Empty', route: '' },
          { value: 'ws', label: 'WS', route: 'has space' },
          { value: 'qs', label: 'QS', route: 'leak?x=1' },
          { value: 'frag', label: 'Frag', route: 'leak#foo' },
        ],
      },
    });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(5); // 4 built-in + Ok
    expect(tabs[4].text()).toContain('Ok');
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('should filter out tabs missing required fields', () => {
    const wrapper = mountLayout({
      admin: {
        tabs: [
          { value: 'valid', label: 'Valid', route: 'valid' },
          { value: 'broken' },
          null,
        ],
      },
    });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(5); // 4 built-in + Valid
    expect(tabs[4].text()).toContain('Valid');
  });

  it('should filter out absolute routes outside /admin/ and warn', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mountLayout({
      admin: {
        tabs: [
          { value: 'safe', label: 'Safe', route: 'safe' },
          { value: 'unsafe', label: 'Unsafe', route: '/evil/path' },
        ],
      },
    });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(5); // 4 built-in + Safe
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('/evil/path'));
    consoleWarnSpy.mockRestore();
  });

  it('should gracefully handle non-array admin.tabs', () => {
    const wrapper = mountLayout({ admin: { tabs: 'invalid' } });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(4);
  });

  it('should sync activeTab with the current route on deep-link to an extra tab', () => {
    const wrapper = mountLayout(
      { admin: { tabs: [{ value: 'knowledge', label: 'Knowledge', route: 'knowledge' }] } },
      '/admin/knowledge',
    );
    expect(wrapper.vm.activeTab).toBe('/admin/knowledge');
  });

  it('should activate /admin/users by default', () => {
    const wrapper = mountLayout({}, '/admin/users');
    expect(wrapper.vm.activeTab).toBe('/admin/users');
  });

  it('should fall back to /admin/users when the route does not match any tab', () => {
    const wrapper = mountLayout({}, '/admin/unknown');
    expect(wrapper.vm.activeTab).toBe('/admin/users');
  });

  it('should keep the users tab active on detail routes (/admin/users/:id)', () => {
    const wrapper = mountLayout({}, '/admin/users/abc');
    expect(wrapper.vm.activeTab).toBe('/admin/users');
  });

  it('should keep the organizations tab active on detail routes', () => {
    const wrapper = mountLayout({}, '/admin/organizations/org42');
    expect(wrapper.vm.activeTab).toBe('/admin/organizations');
  });

  it('should update activeTab when the route changes', async () => {
    const wrapper = mountLayout({
      admin: { tabs: [{ value: 'knowledge', label: 'Knowledge', route: 'knowledge' }] },
    });
    // Initial: $route.path === '/admin/users'
    expect(wrapper.vm.activeTab).toBe('/admin/users');
    // Simulate navigation to an extra tab
    wrapper.vm.$options.watch.$route.handler.call(wrapper.vm, { path: '/admin/knowledge' });
    expect(wrapper.vm.activeTab).toBe('/admin/knowledge');
  });

  it('should render icons on both built-in and extra tabs', () => {
    const wrapper = mountLayout({
      admin: {
        tabs: [
          { value: 'knowledge', label: 'Knowledge', icon: 'fa-solid fa-book', route: 'knowledge' },
        ],
      },
    });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    // Each built-in tab has one icon; extras only when `icon` is set.
    expect(tabs[0].findAllComponents({ name: 'VIcon' }).length).toBeGreaterThanOrEqual(1);
    const extraIcons = tabs[4].findAllComponents({ name: 'VIcon' });
    expect(extraIcons.length).toBe(1);
    expect(extraIcons[0].props('icon')).toBe('fa-solid fa-book');
  });
});
