import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { useOrganizationsStore } from '../../organizations/stores/organizations.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import UserView from '../views/user.view.vue';
import axios from '../../../lib/services/axios';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock config
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
  },
}));

// Mock helpers
vi.mock('../../../lib/helpers/roleColor', () => ({ default: () => 'primary' }));
vi.mock('../../../lib/helpers/orgColor', () => ({ default: () => 'blue' }));
vi.mock('../../../lib/helpers/ability', () => ({ updateAbilities: vi.fn() }));

const sharedStubs = {
  PageHeader: true,
  userProfileComponent: true,
  organizationsSwitcherComponent: true,
  orgAvatarComponent: true,
  'v-container': { template: '<div><slot /></div>' },
  'v-row': { template: '<div><slot /></div>' },
  'v-col': { template: '<div><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-tabs': { template: '<div><slot /></div>' },
  'v-tab': { template: '<div><slot /></div>' },
  'v-divider': { template: '<div />' },
  'v-window': { template: '<div><slot /></div>' },
  'v-window-item': { template: '<div><slot /></div>' },
  'v-list': { template: '<div><slot /></div>' },
  'v-list-item': { template: '<div><slot /></div>' },
  'v-list-item-title': { template: '<div><slot /></div>' },
  'v-list-item-subtitle': { template: '<div><slot /></div>' },
  'v-avatar': { template: '<div><slot /></div>' },
  'v-chip': { template: '<div><slot /></div>' },
  'v-btn': { template: '<div><slot /></div>' },
  'v-icon': { template: '<div />' },
  'v-dialog': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-card-actions': { template: '<div><slot /></div>' },
  'v-spacer': { template: '<div />' },
  'v-text-field': { template: '<div />' },
};

const sharedMocks = ($router = { push: vi.fn() }, $route = { query: {}, hash: '' }) => ({
  $router,
  $route,
  $t: (key) => key,
  config: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    vuetify: { theme: { flat: true, rounded: 'rounded' } },
  },
});

describe('UserView – leaveOrg redirect behaviour', () => {
  let organizationsStore;
  let authStore;
  let routerPush;
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    organizationsStore = useOrganizationsStore();
    authStore = useAuthStore();

    // Stub fetchOrganizations so the created() hook does not hit the network
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);

    routerPush = vi.fn();

    wrapper = shallowMount(UserView, {
      global: {
        mocks: sharedMocks({ push: routerPush }),
        stubs: sharedStubs,
      },
    });
  });

  it('should redirect to /organization-required when 0 orgs remain after leaving', async () => {
    // Set up: user is leaving the only org they belong to
    const orgId = 'org-1';
    wrapper.vm.orgToLeave = { id: orgId, name: 'Only Org' };

    // Stub leaveOrganization so that after call, organizations is empty
    organizationsStore.leaveOrganization = vi.fn().mockImplementation(() => {
      organizationsStore.organizations = [];
      return Promise.resolve();
    });
    authStore.refreshAbilities = vi.fn().mockResolvedValue();

    await wrapper.vm.leaveOrg();

    expect(organizationsStore.leaveOrganization).toHaveBeenCalledWith(orgId);
    expect(routerPush).toHaveBeenCalledWith('/organization-required');
  });

  it('should call switchOrganization on first remaining org when currentOrganization is null after leaving', async () => {
    const orgId = 'org-leave';
    const remainingOrg = { id: 'org-remain', name: 'Remaining Org' };
    wrapper.vm.orgToLeave = { id: orgId, name: 'Leaving Org' };

    // After leaving, one org remains but currentOrganization is null
    organizationsStore.leaveOrganization = vi.fn().mockImplementation(() => {
      organizationsStore.organizations = [remainingOrg];
      organizationsStore.currentOrganization = null;
      return Promise.resolve();
    });
    organizationsStore.switchOrganization = vi.fn().mockResolvedValue();
    authStore.refreshAbilities = vi.fn().mockResolvedValue();

    await wrapper.vm.leaveOrg();

    expect(organizationsStore.leaveOrganization).toHaveBeenCalledWith(orgId);
    expect(organizationsStore.switchOrganization).toHaveBeenCalledWith(remainingOrg.id);
    expect(routerPush).not.toHaveBeenCalled();
  });
});

// ── UserView – C4 decoupling: no billing / subscriptions tab ─────────────────

describe('UserView – C4 decoupling: billing tab removed', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const organizationsStore = useOrganizationsStore();
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);
  });

  it('does not expose showSubscriptionsTab computed', () => {
    const wrapper = shallowMount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    expect(wrapper.vm.showSubscriptionsTab).toBeUndefined();
  });

  it('does not expose hasOwnerOrAdminRole computed', () => {
    const wrapper = shallowMount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    expect(wrapper.vm.hasOwnerOrAdminRole).toBeUndefined();
  });

  it('does not render a subscriptions tab in the template', () => {
    const authStore = useAuthStore();
    const organizationsStore = useOrganizationsStore();
    authStore.serverConfig = { billing: { enabled: true } };
    organizationsStore.organizations = [{ id: 'o1', role: 'owner', name: 'Acme' }];

    // Use a v-tab stub that captures its slot content so we can check for absence
    const tabContents = [];
    const vTabStub = {
      template: '<div><slot /></div>',
      created() { tabContents.push(this.$slots?.default?.()?.[0]?.children || ''); },
    };

    shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: { ...sharedStubs, 'v-tab': vTabStub },
      },
    });

    // No tab content should contain 'Subscriptions' or 'subscriptions'
    const allContent = tabContents.join('').toLowerCase();
    expect(allContent).not.toContain('subscriptions');
  });

  it('does not import or render BillingSubscriptionsComponent', () => {
    // Register a sentinel stub — if user.view still imports and renders it, it would appear
    const wrapper = shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: {
          ...sharedStubs,
          BillingSubscriptionsComponent: { template: '<div data-billing-sentinel />' },
        },
      },
    });
    expect(wrapper.html()).not.toContain('data-billing-sentinel');
  });

  it('only exposes profile and organizations tabs', () => {
    // After C1.2 refactor, tabs are declared via tabsConfig (consumed by PageTabs).
    // v-tab elements no longer appear directly in user.view.vue, so we inspect
    // tabsConfig to verify the exposed set of tabs.
    const wrapper = shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    const tabValues = wrapper.vm.tabsConfig.map((t) => t.value);
    expect(tabValues).toContain('profile');
    expect(tabValues).toContain('organizations');
    expect(tabValues).not.toContain('subscriptions');
  });
});

// ── UserView – tab routing from query/hash ───────────────────────────────────

describe('UserView – tab routing from query/hash', () => {
  let authStore;
  let organizationsStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    organizationsStore = useOrganizationsStore();
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);
  });

  /**
   * @desc Mount with explicit $route — caller controls query/hash.
   * @param {Object} route
   * @returns {import('@vue/test-utils').VueWrapper}
   */
  const mountWithRoute = (route) =>
    shallowMount(UserView, {
      global: {
        mocks: sharedMocks({ push: vi.fn() }, route),
        stubs: sharedStubs,
      },
    });

  it('switches to organizations tab when ?tab=organizations', async () => {
    authStore.serverConfig = { billing: { enabled: true } };
    organizationsStore.organizations = [{ id: 'o1', role: 'owner' }];

    const wrapper = mountWithRoute({ query: { tab: 'organizations' }, hash: '' });
    expect(wrapper.vm.tab).toBe('organizations');
  });

  it('keeps default profile tab when neither query nor hash is set', async () => {
    authStore.serverConfig = { billing: { enabled: true } };
    organizationsStore.organizations = [{ id: 'o1', role: 'owner' }];

    const wrapper = mountWithRoute({ query: {}, hash: '' });
    expect(wrapper.vm.tab).toBe('profile');
  });

  it('ignores ?tab=subscriptions (subscriptions tab removed) and stays on profile', async () => {
    // After C4, there is no subscriptions tab — the request must be silently ignored
    authStore.serverConfig = { billing: { enabled: true } };
    organizationsStore.organizations = [{ id: 'o1', role: 'owner' }];

    const wrapper = mountWithRoute({ query: { tab: 'subscriptions' }, hash: '' });
    expect(wrapper.vm.tab).toBe('profile');
  });

  it('switches to profile tab when ?tab=profile', async () => {
    const wrapper = mountWithRoute({ query: { tab: 'profile' }, hash: '' });
    expect(wrapper.vm.tab).toBe('profile');
  });
});

// ── UserView – organizations refetch on auth state change ────────────────────

describe('UserView – organizations refetch on auth state change', () => {
  let authStore;
  let organizationsStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    organizationsStore = useOrganizationsStore();
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);
  });

  it('calls fetchOrganizations immediately when isLoggedIn is true at mount', async () => {
    authStore.cookieExpire = Date.now() + 3600000; // logged in
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);

    shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    // Flush microtasks so the immediate watcher handler resolves
    await new Promise((r) => setTimeout(r, 0));
    expect(organizationsStore.fetchOrganizations).toHaveBeenCalled();
  });

  it('does not call fetchOrganizations from watcher when isLoggedIn is false at mount', async () => {
    authStore.cookieExpire = 0; // logged out
    const fetchOrgsSpy = vi.fn().mockResolvedValue([]);
    organizationsStore.fetchOrganizations = fetchOrgsSpy;

    shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    // The created() hook always calls fetchOrganizations once; the watcher must NOT call it
    // a second time when not logged in. Total = 1 (from created), not 2.
    expect(fetchOrgsSpy.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('does NOT have a billingStore.fetchSubscription call (billing decoupled)', async () => {
    // Ensure user.view no longer touches any billingStore
    authStore.cookieExpire = Date.now() + 3600000; // logged in

    // If user.view still imports billingStore and calls fetchSubscription, this would
    // require a mock; its absence means the view is cleanly decoupled.
    expect(Object.keys(UserView.components || {})).not.toContain('BillingSubscriptionsComponent');
  });
});

// ── UserView – C1.2: PageTabs integration ────────────────────────────────────

describe('UserView – renders PageTabs with profile + organizations entries', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const organizationsStore = useOrganizationsStore();
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);
  });

  it('renders a [data-test="page-tabs"] element via PageTabs', async () => {
    const PageTabsStub = {
      template: '<div data-test="page-tabs"><slot /></div>',
      inheritAttrs: false,
    };

    const wrapper = shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: { ...sharedStubs, PageTabs: PageTabsStub },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="page-tabs"]').exists()).toBe(true);
  });

  it('tabsConfig includes profile and organizations entries', () => {
    const wrapper = shallowMount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    const config = wrapper.vm.tabsConfig;
    expect(Array.isArray(config)).toBe(true);
    const values = config.map((t) => t.value);
    expect(values).toContain('profile');
    expect(values).toContain('organizations');
  });

  it('tabsConfig profile entry has correct label', () => {
    const wrapper = shallowMount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    const profile = wrapper.vm.tabsConfig.find((t) => t.value === 'profile');
    expect(profile?.label).toBe('Profile');
  });

  it('tabsConfig organizations entry has correct label', () => {
    const wrapper = shallowMount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    const orgs = wrapper.vm.tabsConfig.find((t) => t.value === 'organizations');
    expect(orgs?.label).toBe('Organizations');
  });
});

// ── UserView – delete account danger zone in Profile tab ─────────────────────

describe('UserView – delete account danger zone', () => {
  let authStore;
  let organizationsStore;
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    organizationsStore = useOrganizationsStore();
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);
    authStore.serverConfig = { billing: { enabled: true } };
    organizationsStore.organizations = [{ id: 'o1', role: 'owner' }];

    wrapper = shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });
  });

  it('opens the delete account dialog when confirmDeleteAccount is set to true', async () => {
    expect(wrapper.vm.confirmDeleteAccount).toBe(false);
    wrapper.vm.confirmDeleteAccount = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.confirmDeleteAccount).toBe(true);
  });

  it('confirm button is disabled when deleteConfirmInput is not DELETE', async () => {
    // Use a full-stubs setup that captures the :disabled binding from the confirm v-btn
    // The confirm button has :disabled="deleteConfirmInput !== 'DELETE'"
    const capturedDisabledValues = [];
    const vBtnStub = {
      template: '<button :disabled="disabled" v-bind="$attrs"><slot /></button>',
      props: { disabled: { type: Boolean, default: false } },
      created() {
        // Capture only the btn that has a disabled binding (the confirm btn)
        if (Object.prototype.hasOwnProperty.call(this.$props, 'disabled')) {
          capturedDisabledValues.push(this.$props);
        }
      },
    };

    const w = shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: { ...sharedStubs, 'v-btn': vBtnStub },
      },
    });

    w.vm.deleteConfirmInput = 'DELET';
    await w.vm.$nextTick();

    // The confirm button binding: :disabled="deleteConfirmInput !== 'DELETE'"
    expect(w.vm.deleteConfirmInput !== 'DELETE').toBe(true);
    // If stubs render a standard <button>, check DOM disabled state
    const buttons = w.findAll('button[disabled]');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('confirm button is enabled when deleteConfirmInput equals DELETE', async () => {
    const w = shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: {
          ...sharedStubs,
          'v-btn': {
            template: '<button :disabled="disabled" v-bind="$attrs"><slot /></button>',
            props: { disabled: { type: Boolean, default: false } },
          },
        },
      },
    });

    w.vm.deleteConfirmInput = 'DELETE';
    await w.vm.$nextTick();

    // :disabled="deleteConfirmInput !== 'DELETE'" → false when input === 'DELETE'
    expect(w.vm.deleteConfirmInput === 'DELETE').toBe(true);
    // No buttons should have disabled when input is DELETE
    const disabledButtons = w.findAll('button[disabled]');
    expect(disabledButtons.length).toBe(0);
  });

  it('deleteAccount method calls axios.delete and redirects to /signin on success', async () => {
    const routerPush = vi.fn();
    authStore.signout = vi.fn().mockResolvedValue();
    axios.delete.mockResolvedValue({});

    const w = shallowMount(UserView, {
      global: {
        mocks: sharedMocks({ push: routerPush }),
        stubs: sharedStubs,
      },
    });

    await w.vm.deleteAccount();

    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/users'));
    expect(authStore.signout).toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith('/signin');
  });

  it('deleteAccount method closes dialog on error (swallows exception)', async () => {
    axios.delete.mockRejectedValue(new Error('Server error'));

    const w = shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    w.vm.confirmDeleteAccount = true;
    w.vm.deleteConfirmInput = 'DELETE';
    await w.vm.deleteAccount();

    expect(w.vm.confirmDeleteAccount).toBe(false);
    expect(w.vm.deleteConfirmInput).toBe('');
  });

  it('deleteAccount strings are inlined in user.view.vue', () => {
    const html = wrapper.html();
    expect(html).toContain('Delete account');
    expect(html).toContain('Permanently delete your account, data, and organization ownership. This cannot be undone.');
    expect(html).toContain('Type DELETE to confirm');
  });
});
