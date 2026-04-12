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

  it('should accept legacy absolute routes under /admin/', () => {
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
