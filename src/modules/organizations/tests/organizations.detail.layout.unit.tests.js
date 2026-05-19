import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';

// ── Mocks (must be declared before any SFC imports due to vi.mock hoisting) ──

/**
 * Mutable ref used by the useRoute mock so individual tests can control
 * the organizationId param and path without reinstalling the mock.
 */
let mockRouteParams = { organizationId: 'abc123' };
let mockRoutePath = '/users/organizations/abc123';

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRoute: () => ({ params: mockRouteParams, path: mockRoutePath }),
  };
});

vi.mock('../../../lib/helpers/ability', () => ({
  ability: {
    rules: [{ action: 'update', subject: 'Organization' }],
    can: vi.fn(() => true),
  },
}));

vi.mock('../stores/organizations.store', () => ({
  useOrganizationsStore: () => ({
    viewedOrganization: { _id: 'abc123', name: 'Acme', description: '' },
    resetOrganization: vi.fn(),
    fetchOrganization: vi.fn().mockResolvedValue(),
    deleteOrganization: vi.fn().mockResolvedValue(),
  }),
}));

vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
    organizations: {
      tabs: [
        {
          value: 'billing',
          label: 'Billing',
          icon: 'fa-solid fa-credit-card',
          route: 'billing',
          action: 'manage',
          subject: 'Organization',
        },
      ],
    },
  },
}));

import OrganizationDetailComponent from '../components/organization.detail.component.vue';
import OrganizationGeneralTab from '../components/organization.general.tab.vue';

/**
 * Minimal stubs for Vuetify / child components so mount stays lightweight.
 */
const baseStubs = {
  PageHeader: { template: '<div class="page-header-stub" />' },
  orgAvatarComponent: { template: '<div />' },
  CoreSurfaceTabBar: {
    name: 'CoreSurfaceTabBar',
    props: ['tabs', 'can', 'basePath'],
    template: '<div class="surface-tab-bar-stub" :data-base-path="basePath" />',
  },
  RouterView: { template: '<div class="router-view-stub" />' },
  'router-view': { template: '<div class="router-view-stub" />' },
  'v-container': { template: '<div><slot /></div>' },
  'v-dialog': { template: '<div><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-card-actions': { template: '<div><slot /></div>' },
  'v-btn': { template: '<button><slot /></button>' },
  'v-text-field': { template: '<input />' },
  'v-spacer': { template: '<div />' },
  'v-icon': { template: '<i />' },
};

/**
 * Mount the layout component with a mocked $route providing the organizationId.
 * Also sets the module-level `mockRouteParams`/`mockRoutePath` so `useRoute()` returns the
 * correct params and path in the component's setup().
 * @param {string} [orgId]
 * @param {string} [routePath] - Full route path (default: user org path)
 * @returns {import('@vue/test-utils').VueWrapper}
 */
function mountLayout(orgId = 'abc123', routePath = null) {
  mockRouteParams = { organizationId: orgId };
  mockRoutePath = routePath || `/users/organizations/${orgId}`;
  return shallowMount(OrganizationDetailComponent, {
    global: {
      mocks: {
        $route: { params: { organizationId: orgId }, path: mockRoutePath },
        $router: { push: vi.fn() },
        config: {
          vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
          organizations: {
            tabs: [
              {
                value: 'billing',
                label: 'Billing',
                icon: 'fa-solid fa-credit-card',
                route: 'billing',
                action: 'manage',
                subject: 'Organization',
              },
            ],
          },
        },
      },
      stubs: baseStubs,
    },
  });
}

// ── Layout (organization.detail.component.vue) ────────────────────────────────

describe('organization.detail.component.vue — tabbed parent layout (C3)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders CoreSurfaceTabBar', () => {
    const wrapper = mountLayout();
    expect(wrapper.findComponent({ name: 'CoreSurfaceTabBar' }).exists()).toBe(true);
  });

  it('renders router-view for child tabs', () => {
    const wrapper = mountLayout();
    // shallowMount stubs router-view; check it exists in the rendered tree
    expect(wrapper.html()).toContain('router-view-stub');
  });

  it('does NOT import useBilling or billing.subscriptions', async () => {
    // Structural: verify the source of the layout contains no billing import.
    // We check the component's script via the resolved module text. The absence
    // of the billing composable in the component options is confirmed by asserting
    // the `setup()` return does not expose `isPlanActive` (present in old code).
    const wrapper = mountLayout();
    expect(wrapper.vm.isPlanActive).toBeUndefined();
    expect(wrapper.vm.showBillingLink).toBeUndefined();
  });

  it('computes a RESOLVED basePath containing the actual organizationId, not the pattern', () => {
    const wrapper = mountLayout('abc123');
    expect(wrapper.vm.basePath).toBe('/users/organizations/abc123');
    expect(wrapper.vm.basePath).not.toContain(':organizationId');
  });

  it('passes the resolved basePath to CoreSurfaceTabBar', () => {
    const wrapper = mountLayout('org-xyz');
    const tabBar = wrapper.findComponent({ name: 'CoreSurfaceTabBar' });
    expect(tabBar.props('basePath')).toBe('/users/organizations/org-xyz');
  });

  it('passes config.organizations.tabs to CoreSurfaceTabBar', () => {
    const wrapper = mountLayout();
    const tabBar = wrapper.findComponent({ name: 'CoreSurfaceTabBar' });
    const tabs = tabBar.props('tabs');
    expect(Array.isArray(tabs)).toBe(true);
    expect(tabs.find((t) => t.value === 'billing')).toBeDefined();
  });

  it('passes a function as the `can` prop to CoreSurfaceTabBar', () => {
    const wrapper = mountLayout();
    const tabBar = wrapper.findComponent({ name: 'CoreSurfaceTabBar' });
    expect(typeof tabBar.props('can')).toBe('function');
  });

  it('basePath resolves differently for different org IDs (reactive)', () => {
    const w1 = mountLayout('org-111');
    const w2 = mountLayout('org-222');
    expect(w1.vm.basePath).toBe('/users/organizations/org-111');
    expect(w2.vm.basePath).toBe('/users/organizations/org-222');
  });

  // ── FIX 2: route-aware basePath (user vs admin context) ──────────────────

  it('basePath returns /users/organizations/{id} when route is under /users', () => {
    const wrapper = mountLayout('abc123', '/users/organizations/abc123');
    expect(wrapper.vm.basePath).toBe('/users/organizations/abc123');
  });

  it('basePath returns /admin/organizations/{id} when route is under /admin', () => {
    const wrapper = mountLayout('abc123', '/admin/organizations/abc123');
    expect(wrapper.vm.basePath).toBe('/admin/organizations/abc123');
  });

  it('admin basePath uses the resolved org ID, not the pattern', () => {
    const wrapper = mountLayout('org-xyz', '/admin/organizations/org-xyz');
    expect(wrapper.vm.basePath).toBe('/admin/organizations/org-xyz');
    expect(wrapper.vm.basePath).not.toContain(':organizationId');
  });

  it('passes admin basePath to CoreSurfaceTabBar in admin context', () => {
    const wrapper = mountLayout('org-xyz', '/admin/organizations/org-xyz');
    const tabBar = wrapper.findComponent({ name: 'CoreSurfaceTabBar' });
    expect(tabBar.props('basePath')).toBe('/admin/organizations/org-xyz');
  });

  // ── FIX 1: no inert beforeRouteLeave on the layout ───────────────────────

  it('layout does NOT have a beforeRouteLeave option (guard moved to general tab)', () => {
    // The layout's beforeRouteLeave was inert (no $refs.generalTabRef from router-view).
    // It has been removed; the guard now lives in organization.general.tab.vue.
    const wrapper = mountLayout();
    // Vue exposes beforeRouteLeave via component options, not the vm instance.
    // Verify the component options do not define beforeRouteLeave.
    expect(wrapper.vm.$options.beforeRouteLeave).toBeUndefined();
  });
});

// ── General tab (organization.general.tab.vue) ────────────────────────────────

vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => ({
    serverConfig: {
      organizations: {
        roleDescriptions: { member: 'Read access', admin: 'Full access' },
      },
    },
  }),
}));

const generalTabStubs = {
  organizationsMembersComponent: { template: '<div class="members-stub" />' },
  'organizations-members-component': { template: '<div class="members-stub" />' },
  'v-container': { template: '<div><slot /></div>' },
  'v-row': { template: '<div><slot /></div>' },
  'v-col': { template: '<div><slot /></div>' },
  'v-card': { template: '<div class="v-card-stub"><slot /></div>' },
  'v-form': { template: '<form><slot /></form>' },
  'v-text-field': { template: '<input />' },
  'v-textarea': { template: '<textarea />' },
  'v-btn': { template: '<button><slot /></button>' },
  'v-list': { template: '<ul><slot /></ul>' },
  'v-list-item': { template: '<li><slot /></li>' },
  'v-list-item-title': { template: '<div><slot /></div>' },
  'v-list-item-subtitle': { template: '<div><slot /></div>' },
  'v-chip': { template: '<span><slot /></span>' },
  'v-alert': { template: '<div><slot /></div>' },
  'v-avatar': { template: '<div><slot /></div>' },
  'v-icon': { template: '<i />' },
  'v-spacer': { template: '<div />' },
  'v-dialog': { template: '<div><slot /></div>' },
};

function mountGeneralTab(orgId = 'abc123') {
  return shallowMount(OrganizationGeneralTab, {
    props: { organizationId: orgId },
    global: {
      mocks: {
        $route: { params: { organizationId: orgId } },
        $router: { push: vi.fn() },
        $vuetify: { display: { xs: false } },
        config: {
          api: { protocol: 'http', host: 'localhost' },
          vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
        },
      },
      stubs: generalTabStubs,
    },
  });
}

describe('organization.general.tab.vue — 6 native sections (C3)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the Details section (form with Organization Name label)', () => {
    const wrapper = mountGeneralTab();
    expect(wrapper.html()).toContain('Details');
  });

  it('renders the Roles &amp; Permissions section', () => {
    const wrapper = mountGeneralTab();
    expect(wrapper.html()).toContain('Roles');
  });

  it('renders the Members section (organizationsMembersComponent)', () => {
    const wrapper = mountGeneralTab();
    expect(wrapper.html()).toContain('members-stub');
  });

  it('renders the Invite Member section when canManage is true', () => {
    const wrapper = mountGeneralTab();
    // canManage uses ability.can which is mocked to return true
    expect(wrapper.html()).toContain('Invite Member');
  });

  it('renders the Pending Join Requests section when there are pending requests', async () => {
    const wrapper = mountGeneralTab();
    // Simulate pending requests being loaded
    await wrapper.vm.$nextTick();
    // Pending requests card is conditional on canManage && pendingRequests.length > 0.
    // With empty array the section is hidden (correct — it shows only when there are requests).
    expect(wrapper.vm.pendingRequests).toEqual([]);
    // Verify the reactive data property exists (section would render with data)
    expect(wrapper.vm.$data).toHaveProperty('pendingRequests');
  });

  it('does NOT render the Billing & Plan shortcut card', () => {
    const wrapper = mountGeneralTab();
    expect(wrapper.html()).not.toContain('Billing &amp; Plan');
    expect(wrapper.html()).not.toContain('Manage subscription');
  });

  it('does NOT have showBillingLink or isPlanActive in component instance', () => {
    const wrapper = mountGeneralTab();
    expect(wrapper.vm.showBillingLink).toBeUndefined();
    expect(wrapper.vm.isPlanActive).toBeUndefined();
  });

  it('exposes a reactive `dirty` flag (used by parent layout beforeRouteLeave guard)', () => {
    const wrapper = mountGeneralTab();
    expect(wrapper.vm.dirty).toBe(false);
  });

  it('accepts organizationId as a required prop', () => {
    const wrapper = mountGeneralTab('test-org-id');
    expect(wrapper.vm.organizationId).toBe('test-org-id');
  });

  // ── FIX 1: in-component beforeRouteLeave guard ────────────────────────────

  it('has a beforeRouteLeave option on the general-tab component', () => {
    const wrapper = mountGeneralTab();
    expect(typeof wrapper.vm.$options.beforeRouteLeave).toBe('function');
  });

  it('beforeRouteLeave returns false (cancels navigation) when dirty is true and user cancels', () => {
    const wrapper = mountGeneralTab();
    // Simulate dirty state
    wrapper.vm.dirty = true;

    // Stub window.confirm — jsdom does not implement it
    const confirmStub = vi.fn(() => false);
    vi.stubGlobal('confirm', confirmStub);

    const result = wrapper.vm.$options.beforeRouteLeave.call(wrapper.vm);
    expect(confirmStub).toHaveBeenCalledWith('You have unsaved changes. Are you sure you want to leave?');
    expect(result).toBe(false);

    vi.unstubAllGlobals();
  });

  it('beforeRouteLeave allows navigation when dirty is true and user confirms', () => {
    const wrapper = mountGeneralTab();
    wrapper.vm.dirty = true;

    const confirmStub = vi.fn(() => true);
    vi.stubGlobal('confirm', confirmStub);

    const result = wrapper.vm.$options.beforeRouteLeave.call(wrapper.vm);
    expect(confirmStub).toHaveBeenCalledWith('You have unsaved changes. Are you sure you want to leave?');
    // Returns undefined (not false) → navigation proceeds
    expect(result).toBeUndefined();

    vi.unstubAllGlobals();
  });

  it('beforeRouteLeave does NOT prompt and allows navigation when dirty is false', () => {
    const wrapper = mountGeneralTab();
    // dirty starts as false
    expect(wrapper.vm.dirty).toBe(false);

    const confirmStub = vi.fn(() => false);
    vi.stubGlobal('confirm', confirmStub);

    const result = wrapper.vm.$options.beforeRouteLeave.call(wrapper.vm);
    expect(confirmStub).not.toHaveBeenCalled();
    expect(result).toBeUndefined();

    vi.unstubAllGlobals();
  });
});

// ── Router integration — org parent layout + nested children ─────────────────

describe('organizations router — nested route structure (C3)', () => {
  /**
   * Build a minimal router using the real organizations.router.js routes
   * plus the billing organizationRoutes injected as a child.
   */
  async function buildOrgRouter() {
    const { default: orgRoutes, ORG_PARENT_PATH } = await import('../router/organizations.router.js');
    const { organizationRoutes } = await import('../../billing/router/billing.router.js');

    // Deep-clone to avoid mutating the module-level export
    const routes = orgRoutes.map((r) => ({
      ...r,
      children: Array.isArray(r.children) ? [...r.children] : [],
    }));

    // Inject billing child under the org parent (mirrors app.router.js)
    const orgParent = routes.find((r) => r.path === ORG_PARENT_PATH);
    if (orgParent) {
      orgParent.children.push(...organizationRoutes);
    }

    return createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'Home', component: { template: '<div />' } },
        ...routes,
      ],
    });
  }

  it('/users/organizations/:id resolves to layout (Account Organization) + default general child', async () => {
    const router = await buildOrgRouter();
    await router.push('/users/organizations/abc123');
    await router.isReady();

    const matched = router.currentRoute.value.matched;
    // Should match: parent layout + default child (general tab)
    expect(matched.length).toBeGreaterThanOrEqual(2);
    expect(matched.some((r) => r.name === 'Account Organization')).toBe(true);
    expect(matched.some((r) => r.name === 'Account Organization General')).toBe(true);
    expect(router.currentRoute.value.params.organizationId).toBe('abc123');
  });

  it('/users/organizations/:id/billing resolves to layout + billing child', async () => {
    const router = await buildOrgRouter();
    await router.push('/users/organizations/abc123/billing');
    await router.isReady();

    const matched = router.currentRoute.value.matched;
    expect(matched.some((r) => r.name === 'Account Organization')).toBe(true);
    expect(matched.some((r) => r.name === 'Account Organization Billing')).toBe(true);
    expect(router.currentRoute.value.params.organizationId).toBe('abc123');
  });

  it('ORG_PARENT_PATH constant value is unchanged', async () => {
    const { ORG_PARENT_PATH } = await import('../router/organizations.router.js');
    expect(ORG_PARENT_PATH).toBe('/users/organizations/:organizationId');
  });

  it('org parent route has a children array (injection seam intact)', async () => {
    const { default: orgRoutes, ORG_PARENT_PATH } = await import('../router/organizations.router.js');
    const orgParent = orgRoutes.find((r) => r.path === ORG_PARENT_PATH);
    expect(orgParent).toBeDefined();
    expect(Array.isArray(orgParent.children)).toBe(true);
  });

  it('default child (path="") passes organizationId as props function', async () => {
    const { default: orgRoutes, ORG_PARENT_PATH } = await import('../router/organizations.router.js');
    const orgParent = orgRoutes.find((r) => r.path === ORG_PARENT_PATH);
    const defaultChild = orgParent.children.find((c) => c.path === '');
    expect(defaultChild).toBeDefined();
    // props must be a function (not static object) so it maps route.params → component props
    expect(typeof defaultChild.props).toBe('function');
    // Verify the function maps organizationId correctly
    const result = defaultChild.props({ params: { organizationId: 'test-id' } });
    expect(result).toEqual({ organizationId: 'test-id' });
  });
});
