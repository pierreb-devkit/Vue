import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const adminStoreState = { error: null, currentBreadcrumb: null };
const authStoreState = { serverConfig: null };

vi.mock('../stores/admin.store', () => ({
  useAdminStore: () => adminStoreState,
}));

vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => authStoreState,
}));

// IMPORTANT: also mock the ability helper so adminCan() works in tests.
// Match the pattern used by user.view tests.
vi.mock('../../../lib/helpers/ability', () => ({
  ability: { rules: [{ action: 'manage', subject: 'all' }], can: () => true },
}));

import AdminLayout from '../views/admin.layout.vue';

const baseConfig = {
  vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
};

/**
 * Mount AdminLayout with shared stubs/mocks and optional config overrides.
 * @param {object} [configOverrides={}] - Config keys merged (shallow) into the base config mock.
 * @param {string} [routePath='/admin/users'] - Mocked current route path for `$route.path`.
 * @returns {import('@vue/test-utils').VueWrapper} Fully mounted AdminLayout wrapper.
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
        // Single stub for the new bundled header-with-tabs primitive — exposes
        // all the props admin.layout passes through, plus the breadcrumb slot.
        CorePageHeaderTabs: {
          name: 'CorePageHeaderTabs',
          props: ['title', 'icon', 'tabs', 'can', 'basePath', 'hideTabs'],
          template: `
            <div class="page-header-tabs-stub" :data-title="title" :data-icon="icon" :data-hide-tabs="hideTabs">
              <slot name="avatar" />
              <slot name="breadcrumb" />
              <slot name="title" />
              <slot name="subtitle" />
              <slot name="actions" />
            </div>
          `,
        },
      },
    },
  });

describe('admin.layout', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    adminStoreState.error = null;
    adminStoreState.currentBreadcrumb = null;
    authStoreState.serverConfig = null;
  });

  it('renders the page header', () => {
    const wrapper = mountLayout();
    expect(wrapper.find('.page-header-tabs-stub').exists()).toBe(true);
  });

  it('renders a <router-view> for nested admin content', () => {
    const wrapper = mountLayout();
    expect(wrapper.find('.router-view-stub').exists()).toBe(true);
  });

  it('passes the five built-in tabs to CorePageHeaderTabs when no extras are configured', () => {
    const wrapper = mountLayout();
    const headerTabs = wrapper.findComponent({ name: 'CorePageHeaderTabs' });
    expect(headerTabs.exists()).toBe(true);
    const tabs = headerTabs.props('tabs');
    expect(tabs).toHaveLength(5);
    expect(tabs.map((t) => t.value)).toEqual(['users', 'invitations', 'organizations', 'readiness', 'activity']);
  });

  it('passes built-in + extra tabs from config.admin.tabs to CorePageHeaderTabs', () => {
    const wrapper = mountLayout({
      admin: {
        tabs: [
          { value: 'knowledge', label: 'Knowledge', icon: 'fa-solid fa-book', route: 'knowledge' },
          { value: 'costs', label: 'Costs', route: 'costs' },
        ],
      },
    });
    const headerTabs = wrapper.findComponent({ name: 'CorePageHeaderTabs' });
    const tabs = headerTabs.props('tabs');
    expect(tabs).toHaveLength(7);
    expect(tabs[5].value).toBe('knowledge');
    expect(tabs[6].value).toBe('costs');
  });

  it('includes the Invitations tab', () => {
    const wrapper = mountLayout();
    const labels = wrapper.vm.allTabs.map((t) => t.label);
    expect(labels).toContain('Invitations');
    const tab = wrapper.vm.allTabs.find((t) => t.label === 'Invitations');
    expect(tab.route).toBe('invitations');
  });

  it('passes basePath="/admin" to CorePageHeaderTabs', () => {
    const wrapper = mountLayout();
    const headerTabs = wrapper.findComponent({ name: 'CorePageHeaderTabs' });
    expect(headerTabs.props('basePath')).toBe('/admin');
  });

  it('passes a function `can` predicate to CorePageHeaderTabs', () => {
    const wrapper = mountLayout();
    const headerTabs = wrapper.findComponent({ name: 'CorePageHeaderTabs' });
    expect(typeof headerTabs.props('can')).toBe('function');
  });

  it('gracefully handles non-array admin.tabs (CorePageHeaderTabs receives only the built-in 5)', () => {
    const wrapper = mountLayout({ admin: { tabs: 'invalid' } });
    const headerTabs = wrapper.findComponent({ name: 'CorePageHeaderTabs' });
    expect(headerTabs.props('tabs')).toHaveLength(5);
  });

  it('renders the error banner at the TOP of the layout, before the header', async () => {
    adminStoreState.error = 'Boom';
    const wrapper = mountLayout();
    await wrapper.vm.$nextTick();
    const html = wrapper.html();
    expect(html.indexOf('Boom')).toBeLessThan(html.indexOf('page-header-tabs-stub'));
  });

  it('renders the mailer warning at the TOP when serverConfig.mail.configured is false', async () => {
    authStoreState.serverConfig = { mail: { configured: false } };
    const wrapper = mountLayout();
    await wrapper.vm.$nextTick();
    const html = wrapper.html();
    expect(html.indexOf('No mailer configured')).toBeLessThan(html.indexOf('page-header-tabs-stub'));
  });

  it('does NOT render the mailer warning when mail is configured', () => {
    authStoreState.serverConfig = { mail: { configured: true } };
    const wrapper = mountLayout();
    expect(wrapper.html()).not.toContain('No mailer configured');
  });

  it('renders <router-view> OUTSIDE the layout <v-container>', () => {
    const wrapper = mountLayout();
    const layoutContainer = wrapper.find('.v-container');
    const routerViewEl = wrapper.find('.router-view-stub');
    expect(layoutContainer.exists()).toBe(true);
    expect(routerViewEl.exists()).toBe(true);
    expect(layoutContainer.element.contains(routerViewEl.element)).toBe(false);
  });

  it('CorePageHeaderTabs receives title="Admin" + icon="fa-solid fa-user-tie" in list mode', () => {
    const wrapper = mountLayout();
    const headerTabs = wrapper.findComponent({ name: 'CorePageHeaderTabs' });
    expect(headerTabs.props('title')).toBe('Admin');
    expect(headerTabs.props('icon')).toBe('fa-solid fa-user-tie');
  });

  it('CorePageHeaderTabs receives title="" + icon stays in breadcrumb mode', async () => {
    adminStoreState.currentBreadcrumb = { title: 'Jane Doe' };
    const wrapper = mountLayout({}, '/admin/users/u1');
    await wrapper.vm.$nextTick();
    const headerTabs = wrapper.findComponent({ name: 'CorePageHeaderTabs' });
    expect(headerTabs.props('title')).toBe('');
    expect(headerTabs.props('icon')).toBe('fa-solid fa-user-tie');
  });

  it('passes hideTabs=true when currentBreadcrumb is set (detail mode)', async () => {
    adminStoreState.currentBreadcrumb = { title: 'Jane Doe' };
    const wrapper = mountLayout({}, '/admin/users/u1');
    await wrapper.vm.$nextTick();
    const headerTabs = wrapper.findComponent({ name: 'CorePageHeaderTabs' });
    expect(headerTabs.props('hideTabs')).toBe(true);
  });

  it('passes hideTabs=false when currentBreadcrumb is null (list mode)', () => {
    const wrapper = mountLayout();
    const headerTabs = wrapper.findComponent({ name: 'CorePageHeaderTabs' });
    expect(headerTabs.props('hideTabs')).toBe(false);
  });

  it('renders the breadcrumb when useAdminStore().currentBreadcrumb is set', async () => {
    adminStoreState.currentBreadcrumb = { title: 'Jane Doe', titleClass: 'text-capitalize' };
    const wrapper = mountLayout({}, '/admin/users/u1');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Jane Doe');
  });

});
