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
        PageHeader: {
          template: `
            <div class="page-header-stub">
              <slot name="avatar" />
              <slot name="breadcrumb" />
              <slot name="tabs" />
              <slot name="title" />
              <slot name="subtitle" />
              <slot name="actions" />
            </div>
          `,
        },
        // Stub SurfaceTabBar so we can read the props it receives without rendering full v-tabs.
        // name: 'CoreSurfaceTabBar' is required for findComponent({ name: ... }) to work.
        CoreSurfaceTabBar: {
          name: 'CoreSurfaceTabBar',
          props: ['tabs', 'can', 'basePath'],
          template: '<div class="surface-tab-bar-stub" :data-tabs-count="tabs?.length || 0" />',
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
    expect(wrapper.find('.page-header-stub').exists()).toBe(true);
  });

  it('renders a <router-view> for nested admin content', () => {
    const wrapper = mountLayout();
    expect(wrapper.find('.router-view-stub').exists()).toBe(true);
  });

  it('passes the four built-in tabs to CoreSurfaceTabBar when no extras are configured', () => {
    const wrapper = mountLayout();
    const bar = wrapper.findComponent({ name: 'CoreSurfaceTabBar' });
    expect(bar.exists()).toBe(true);
    const tabs = bar.props('tabs');
    expect(tabs).toHaveLength(4);
    expect(tabs.map((t) => t.value)).toEqual(['users', 'organizations', 'readiness', 'activity']);
  });

  it('passes built-in + extra tabs from config.admin.tabs to CoreSurfaceTabBar', () => {
    const wrapper = mountLayout({
      admin: {
        tabs: [
          { value: 'knowledge', label: 'Knowledge', icon: 'fa-solid fa-book', route: 'knowledge' },
          { value: 'costs', label: 'Costs', route: 'costs' },
        ],
      },
    });
    const bar = wrapper.findComponent({ name: 'CoreSurfaceTabBar' });
    const tabs = bar.props('tabs');
    expect(tabs).toHaveLength(6);
    expect(tabs[4].value).toBe('knowledge');
    expect(tabs[5].value).toBe('costs');
  });

  it('passes basePath="/admin" to CoreSurfaceTabBar', () => {
    const wrapper = mountLayout();
    const bar = wrapper.findComponent({ name: 'CoreSurfaceTabBar' });
    expect(bar.props('basePath')).toBe('/admin');
  });

  it('passes a function `can` predicate to CoreSurfaceTabBar', () => {
    const wrapper = mountLayout();
    const bar = wrapper.findComponent({ name: 'CoreSurfaceTabBar' });
    expect(typeof bar.props('can')).toBe('function');
  });

  it('gracefully handles non-array admin.tabs (CoreSurfaceTabBar receives only the built-in 4)', () => {
    const wrapper = mountLayout({ admin: { tabs: 'invalid' } });
    const bar = wrapper.findComponent({ name: 'CoreSurfaceTabBar' });
    expect(bar.props('tabs')).toHaveLength(4);
  });

  it('renders the error banner at the TOP of the layout, before the header', async () => {
    adminStoreState.error = 'Boom';
    const wrapper = mountLayout();
    await wrapper.vm.$nextTick();
    const html = wrapper.html();
    expect(html.indexOf('Boom')).toBeLessThan(html.indexOf('page-header-stub'));
  });

  it('renders the mailer warning at the TOP when serverConfig.mail.configured is false', async () => {
    authStoreState.serverConfig = { mail: { configured: false } };
    const wrapper = mountLayout();
    await wrapper.vm.$nextTick();
    const html = wrapper.html();
    expect(html.indexOf('No mailer configured')).toBeLessThan(html.indexOf('page-header-stub'));
  });

  it('does NOT render the mailer warning when mail is configured', () => {
    authStoreState.serverConfig = { mail: { configured: true } };
    const wrapper = mountLayout();
    expect(wrapper.html()).not.toContain('No mailer configured');
  });

  it('renders a single .admin-content wrapper around <router-view>', () => {
    const wrapper = mountLayout();
    expect(wrapper.findAll('.admin-content').length).toBe(1);
    expect(wrapper.find('.admin-content .router-view-stub').exists()).toBe(true);
  });

  it('renders the breadcrumb when useAdminStore().currentBreadcrumb is set', async () => {
    adminStoreState.currentBreadcrumb = { title: 'Jane Doe', titleClass: 'text-capitalize' };
    const wrapper = mountLayout({}, '/admin/users/u1');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Jane Doe');
  });

  it('does NOT render CoreSurfaceTabBar when currentBreadcrumb is set (detail mode)', async () => {
    adminStoreState.currentBreadcrumb = { title: 'Jane Doe' };
    const wrapper = mountLayout({}, '/admin/users/u1');
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent({ name: 'CoreSurfaceTabBar' }).exists()).toBe(false);
  });

  it('renders CoreSurfaceTabBar when currentBreadcrumb is null (list mode)', () => {
    const wrapper = mountLayout();
    expect(wrapper.findComponent({ name: 'CoreSurfaceTabBar' }).exists()).toBe(true);
  });
});
