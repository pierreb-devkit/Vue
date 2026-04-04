import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

vi.mock('../stores/admin.store', () => ({
  useAdminStore: () => ({
    users: [],
    organizations: [],
    error: null,
    getUsers: vi.fn(),
    getOrganizations: vi.fn(),
  }),
}));

vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => ({
    serverConfig: null,
  }),
}));

import AdminView from '../views/admin.view.vue';

const baseConfig = {
  vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
  whitelists: { users: { roles: ['user', 'admin'] } },
};

/**
 * Mount admin view with optional config overrides.
 * @param {object} configOverrides - merged into baseConfig
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountView = (configOverrides = {}) =>
  mount(AdminView, {
    global: {
      plugins: [createVuetify()],
      mocks: {
        config: { ...baseConfig, ...configOverrides },
        $router: { push: vi.fn() },
        $route: { path: '/admin' },
      },
      stubs: {
        RouterLink: true,
        coreDataTableComponent: { template: '<div />' },
        PageHeader: { template: '<div />' },
      },
    },
  });

describe('admin.view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should render default tabs without extra tabs', () => {
    const wrapper = mountView();
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(2);
    expect(tabs[0].text()).toContain('Users');
    expect(tabs[1].text()).toContain('Organizations');
  });

  it('should render extra tabs from config.admin.tabs with icon', () => {
    const wrapper = mountView({
      admin: {
        tabs: [
          { value: 'billing', label: 'Billing', icon: 'fa-solid fa-credit-card', route: '/admin/billing' },
        ],
      },
    });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(3);
    expect(tabs[2].text()).toContain('Billing');
    const icons = tabs[2].findAllComponents({ name: 'VIcon' });
    expect(icons.length).toBe(1);
    expect(icons[0].props('icon')).toBe('fa-solid fa-credit-card');
  });

  it('should render extra tab without icon when icon is omitted', () => {
    const wrapper = mountView({
      admin: {
        tabs: [
          { value: 'logs', label: 'Logs', route: '/admin/logs' },
        ],
      },
    });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(3);
    expect(tabs[2].text()).toContain('Logs');
    const icons = tabs[2].findAllComponents({ name: 'VIcon' });
    expect(icons.length).toBe(0);
  });

  it('should gracefully handle empty admin.tabs array', () => {
    const wrapper = mountView({ admin: { tabs: [] } });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(2);
  });

  it('should gracefully handle missing admin config', () => {
    const wrapper = mountView();
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(2);
  });

  it('should ignore invalid admin.tabs values (non-array)', () => {
    const wrapper = mountView({ admin: { tabs: 'invalid' } });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(2);
  });

  it('should filter out entries missing required fields', () => {
    const wrapper = mountView({
      admin: {
        tabs: [
          { value: 'billing', label: 'Billing', route: '/admin/billing' },
          { value: 'broken' },
          null,
        ],
      },
    });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(3);
    expect(tabs[2].text()).toContain('Billing');
  });
});
