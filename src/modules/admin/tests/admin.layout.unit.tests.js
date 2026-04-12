import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';

import AdminLayout from '../views/admin.layout.vue';

const baseConfig = {
  vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
};

/**
 * Mount admin layout with optional config overrides.
 * @param {object} configOverrides - merged into baseConfig
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountLayout = (configOverrides = {}) =>
  mount(AdminLayout, {
    global: {
      plugins: [createVuetify()],
      mocks: {
        config: { ...baseConfig, ...configOverrides },
        $route: { path: '/admin' },
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
  it('should render the page header', () => {
    const wrapper = mountLayout();
    expect(wrapper.find('.page-header-stub').exists()).toBe(true);
  });

  it('should render a <router-view> for nested admin content', () => {
    const wrapper = mountLayout();
    expect(wrapper.find('.router-view-stub').exists()).toBe(true);
  });

  it('should render only the General tab when no extra tabs are configured', () => {
    const wrapper = mountLayout();
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(1);
    expect(tabs[0].text()).toContain('General');
  });

  it('should render extra tabs from config.admin.tabs (relative routes)', () => {
    const wrapper = mountLayout({
      admin: {
        tabs: [
          { value: 'knowledge', label: 'Knowledge', icon: 'fa-solid fa-book', route: 'knowledge' },
          { value: 'costs', label: 'Costs', route: 'costs' },
        ],
      },
    });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(3);
    expect(tabs[1].text()).toContain('Knowledge');
    expect(tabs[2].text()).toContain('Costs');
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
    expect(tabs.length).toBe(2);
    expect(tabs[1].text()).toContain('Legacy');
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
    expect(tabs.length).toBe(2); // General + Ok
    expect(tabs[1].text()).toContain('Ok');
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
    expect(tabs.length).toBe(2); // General + Ok
    expect(tabs[1].text()).toContain('Ok');
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
    expect(tabs.length).toBe(2);
    expect(tabs[1].text()).toContain('Valid');
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
    expect(tabs.length).toBe(2); // General + Safe
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('/evil/path'));
    consoleWarnSpy.mockRestore();
  });

  it('should gracefully handle non-array admin.tabs', () => {
    const wrapper = mountLayout({ admin: { tabs: 'invalid' } });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(1);
  });

  it('should sync activeTab with the current route on deep-link', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [createVuetify()],
        mocks: {
          config: {
            ...baseConfig,
            admin: { tabs: [{ value: 'knowledge', label: 'Knowledge', route: 'knowledge' }] },
          },
          $route: { path: '/admin/knowledge' },
          $router: { push: vi.fn() },
        },
        stubs: {
          RouterLink: true,
          RouterView: { template: '<div class="router-view-stub" />' },
          PageHeader: { template: '<div class="page-header-stub" />' },
        },
      },
    });
    expect(wrapper.vm.activeTab).toBe('/admin/knowledge');
  });

  it('should fall back to base path when the route does not match any tab', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [createVuetify()],
        mocks: {
          config: baseConfig,
          $route: { path: '/admin/users/abc' },
          $router: { push: vi.fn() },
        },
        stubs: {
          RouterLink: true,
          RouterView: { template: '<div />' },
          PageHeader: { template: '<div />' },
        },
      },
    });
    expect(wrapper.vm.activeTab).toBe('/admin');
  });

  it('should update activeTab when the route changes', async () => {
    const wrapper = mountLayout({
      admin: { tabs: [{ value: 'knowledge', label: 'Knowledge', route: 'knowledge' }] },
    });
    // Initial: $route.path === '/admin'
    expect(wrapper.vm.activeTab).toBe('/admin');
    // Simulate navigation
    wrapper.vm.$options.watch.$route.handler.call(wrapper.vm, { path: '/admin/knowledge' });
    expect(wrapper.vm.activeTab).toBe('/admin/knowledge');
  });

  it('should render icons when provided', () => {
    const wrapper = mountLayout({
      admin: {
        tabs: [
          { value: 'knowledge', label: 'Knowledge', icon: 'fa-solid fa-book', route: 'knowledge' },
        ],
      },
    });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    const extraIcons = tabs[1].findAllComponents({ name: 'VIcon' });
    expect(extraIcons.length).toBe(1);
    expect(extraIcons[0].props('icon')).toBe('fa-solid fa-book');
  });
});
