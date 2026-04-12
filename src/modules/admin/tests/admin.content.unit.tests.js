import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

vi.mock('../stores/admin.store', () => ({
  useAdminStore: () => ({
    users: [],
    organizations: [],
    error: null,
    auditLogs: [],
    auditTotal: 0,
    auditPage: 1,
    getUsers: vi.fn(),
    getOrganizations: vi.fn(),
    getAuditLogs: vi.fn(),
  }),
}));

vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => ({
    serverConfig: null,
  }),
}));

import AdminContent from '../views/admin.content.vue';

const baseConfig = {
  vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
  whitelists: { users: { roles: ['user', 'admin'] } },
};

/**
 * Mount admin content with optional config overrides.
 * @param {object} configOverrides - merged into baseConfig
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountContent = (configOverrides = {}) =>
  mount(AdminContent, {
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
      },
    },
  });

describe('admin.content', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should render the four built-in tabs', () => {
    const wrapper = mountContent();
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(4);
    expect(tabs[0].text()).toContain('Users');
    expect(tabs[1].text()).toContain('Organizations');
    expect(tabs[2].text()).toContain('Readiness');
    expect(tabs[3].text()).toContain('Activity');
  });

  it('should not render extra tabs from config (layout owns them now)', () => {
    const wrapper = mountContent({
      admin: {
        tabs: [
          { value: 'billing', label: 'Billing', icon: 'fa-solid fa-credit-card', route: 'billing' },
          { value: 'costs', label: 'Costs', route: 'costs' },
        ],
      },
    });
    const tabs = wrapper.findAllComponents({ name: 'VTab' });
    expect(tabs.length).toBe(4);
    expect(tabs.every((t) => !t.text().includes('Billing'))).toBe(true);
  });

  it('should not render the page header (layout provides it)', () => {
    const wrapper = mountContent();
    expect(wrapper.findComponent({ name: 'PageHeader' }).exists()).toBe(false);
  });

  it('should switch the active window when the tab model changes', async () => {
    const wrapper = mountContent();
    await wrapper.setData({ tab: 'organizations' });
    expect(wrapper.vm.tab).toBe('organizations');
  });
});
