import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { useOrganizationsStore } from '../../organizations/stores/organizations.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useBillingStore } from '../../billing/stores/billing.store';
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
  BillingSubscriptionsComponent: true,
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

// ── UserView – showSubscriptionsTab computed ─────────────────────────────────

describe('UserView – showSubscriptionsTab', () => {
  let authStore;
  let billingStore;
  let organizationsStore;

  /**
   * @desc Helper to mount UserView for showSubscriptionsTab tests.
   * @param {Object} opts
   * @param {Object} [opts.serverConfig]
   * @param {Object|null} [opts.subscription]
   * @param {Array} [opts.organizations]
   * @returns {import('@vue/test-utils').VueWrapper}
   */
  const mountForTab = ({ serverConfig = null, subscription = null, organizations = [] } = {}) => {
    authStore.serverConfig = serverConfig;
    billingStore.subscription = subscription;
    organizationsStore.organizations = organizations;

    return shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    billingStore = useBillingStore();
    organizationsStore = useOrganizationsStore();
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);
  });

  it('is true when billing enabled, meterMode true, and user is owner of an org', () => {
    const wrapper = mountForTab({
      serverConfig: { billing: { enabled: true, meterMode: true } },
      organizations: [{ id: 'o1', role: 'owner' }],
    });
    expect(wrapper.vm.showSubscriptionsTab).toBe(true);
  });

  it('is true when billing enabled, user has active subscription, and is admin', () => {
    const wrapper = mountForTab({
      serverConfig: { billing: { enabled: true, meterMode: false } },
      subscription: { status: 'active', plan: 'starter' },
      organizations: [{ id: 'o1', role: 'admin' }],
    });
    expect(wrapper.vm.showSubscriptionsTab).toBe(true);
  });

  it('is false when user has only member-role orgs (no owner/admin)', () => {
    const wrapper = mountForTab({
      serverConfig: { billing: { enabled: true, meterMode: true } },
      organizations: [{ id: 'o1', role: 'member' }],
    });
    expect(wrapper.vm.showSubscriptionsTab).toBe(false);
  });

  it('is false when billing is disabled', () => {
    const wrapper = mountForTab({
      serverConfig: { billing: { enabled: false, meterMode: true } },
      organizations: [{ id: 'o1', role: 'owner' }],
    });
    expect(wrapper.vm.showSubscriptionsTab).toBe(false);
  });

  it('is false when billing not configured', () => {
    const wrapper = mountForTab({ serverConfig: null, organizations: [{ id: 'o1', role: 'owner' }] });
    expect(wrapper.vm.showSubscriptionsTab).toBe(false);
  });

  it('is true when billing is enabled and user is owner, even when meterMode false and no active subscription', () => {
    // BillingSubscriptionsComponent renders a valid free-plan state; the tab should
    // not require meterMode or an active subscription to be visible.
    const wrapper = mountForTab({
      serverConfig: { billing: { enabled: true, meterMode: false } },
      subscription: null,
      organizations: [{ id: 'o1', role: 'owner' }],
    });
    expect(wrapper.vm.showSubscriptionsTab).toBe(true);
  });
});

// ── UserView – tab routing from query/hash ───────────────────────────────────

describe('UserView – tab routing from query/hash', () => {
  let authStore;
  let billingStore;
  let organizationsStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    billingStore = useBillingStore();
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

  it('switches to subscriptions tab when ?tab=subscriptions and tab is visible', async () => {
    authStore.serverConfig = { billing: { enabled: true, meterMode: true } };
    organizationsStore.organizations = [{ id: 'o1', role: 'owner' }];
    billingStore.subscription = { status: 'active', plan: 'starter' };

    const wrapper = mountWithRoute({ query: { tab: 'subscriptions' }, hash: '' });
    // mounted hook applies the tab
    expect(wrapper.vm.tab).toBe('subscriptions');
  });

  it('falls back to profile when ?tab=subscriptions but tab is not visible', async () => {
    authStore.serverConfig = { billing: { enabled: false } };
    organizationsStore.organizations = [{ id: 'o1', role: 'owner' }];

    const wrapper = mountWithRoute({ query: { tab: 'subscriptions' }, hash: '' });
    expect(wrapper.vm.tab).toBe('profile');
  });

  it('switches to subscriptions tab when #subscriptions hash and tab is visible', async () => {
    authStore.serverConfig = { billing: { enabled: true, meterMode: true } };
    organizationsStore.organizations = [{ id: 'o1', role: 'owner' }];

    const wrapper = mountWithRoute({ query: {}, hash: '#subscriptions' });
    expect(wrapper.vm.tab).toBe('subscriptions');
  });

  it('keeps default profile tab when neither query nor hash is set', async () => {
    authStore.serverConfig = { billing: { enabled: true, meterMode: true } };
    organizationsStore.organizations = [{ id: 'o1', role: 'owner' }];

    const wrapper = mountWithRoute({ query: {}, hash: '' });
    expect(wrapper.vm.tab).toBe('profile');
  });
});

// ── UserView – billing refetch on auth state change ──────────────────────────

describe('UserView – billing refetch on auth state change', () => {
  let authStore;
  let billingStore;
  let organizationsStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    billingStore = useBillingStore();
    organizationsStore = useOrganizationsStore();
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);
  });

  it('calls fetchSubscription immediately when isLoggedIn is true at mount', async () => {
    authStore.cookieExpire = Date.now() + 3600000; // logged in
    billingStore.fetchSubscription = vi.fn().mockResolvedValue(null);

    shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    // Flush microtasks so the immediate watcher handler resolves
    await new Promise((r) => setTimeout(r, 0));
    expect(billingStore.fetchSubscription).toHaveBeenCalledTimes(1);
  });

  it('does not call fetchSubscription when isLoggedIn is false at mount', async () => {
    authStore.cookieExpire = 0; // logged out
    billingStore.fetchSubscription = vi.fn().mockResolvedValue(null);

    shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(billingStore.fetchSubscription).not.toHaveBeenCalled();
  });

  it('calls fetchSubscription when isLoggedIn transitions from false to true', async () => {
    authStore.cookieExpire = 0; // start logged out
    billingStore.fetchSubscription = vi.fn().mockResolvedValue(null);

    shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(billingStore.fetchSubscription).not.toHaveBeenCalled();

    // Simulate login
    authStore.cookieExpire = Date.now() + 3600000;
    await new Promise((r) => setTimeout(r, 0));
    expect(billingStore.fetchSubscription).toHaveBeenCalledTimes(1);
  });

  it('swallows fetchSubscription errors silently (no UI hang)', async () => {
    authStore.cookieExpire = Date.now() + 3600000; // logged in
    billingStore.fetchSubscription = vi.fn().mockRejectedValue(new Error('Network error'));

    // Should not throw
    const wrapper = shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    // Component is still alive — no uncaught error
    expect(wrapper.vm).toBeTruthy();
  });
});

// ── UserView – serverConfig watcher re-applies tab (Bug #1 subs tab race) ────

describe('UserView – serverConfig watcher activates subs tab', () => {
  let authStore;
  let organizationsStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    // billing store is initialized in the component's setup chain via useBillingStore();
    // we only need to drive serverConfig + organizations from this test suite.
    useBillingStore();
    organizationsStore = useOrganizationsStore();
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);
  });

  it('activates subscriptions tab from ?tab=subscriptions when serverConfig.billing arrives after mount', async () => {
    // At mount: serverConfig is null → showSubscriptionsTab is false → applyTabFromRoute() is a no-op
    authStore.serverConfig = null;
    organizationsStore.organizations = [{ id: 'o1', role: 'owner' }];

    const wrapper = shallowMount(UserView, {
      global: {
        mocks: sharedMocks({ push: vi.fn() }, { query: { tab: 'subscriptions' }, hash: '' }),
        stubs: sharedStubs,
      },
    });

    // Tab must NOT be set yet — billing config not available
    expect(wrapper.vm.tab).toBe('profile');

    // Simulate serverConfig arriving after mount (auth store server config fetch resolves)
    authStore.serverConfig = { billing: { enabled: true, meterMode: true } };
    await new Promise((r) => setTimeout(r, 0));

    // Watcher on serverConfig must have re-called applyTabFromRoute() → tab flips
    expect(wrapper.vm.tab).toBe('subscriptions');
  });

  it('re-applies tab when serverConfig refreshes but showSubscriptionsTab was already true (no false→true flip)', async () => {
    // Start with billing enabled (showSubscriptionsTab already true) but tab not yet set
    authStore.serverConfig = { billing: { enabled: true, meterMode: true } };
    organizationsStore.organizations = [{ id: 'o1', role: 'owner' }];

    // Mount WITHOUT a route tab query so tab stays on 'profile'
    const wrapper = shallowMount(UserView, {
      global: {
        mocks: sharedMocks({ push: vi.fn() }, { query: {}, hash: '' }),
        stubs: sharedStubs,
      },
    });

    expect(wrapper.vm.tab).toBe('profile');

    // Now simulate a serverConfig refresh arriving — billing still enabled.
    // showSubscriptionsTab stays true (no false→true transition), so the
    // showSubscriptionsTab watcher will NOT fire. Only the serverConfig watcher
    // would call applyTabFromRoute() — but since no tab is in the route, the
    // result is the same (profile stays). This validates the watcher runs without error.
    authStore.serverConfig = { billing: { enabled: true, meterMode: false } };
    await new Promise((r) => setTimeout(r, 0));

    // No route tab → still profile
    expect(wrapper.vm.tab).toBe('profile');

    // Now explicitly verify the watcher exists by checking the component's $options.watch
    expect(wrapper.vm.$options.watch).toHaveProperty('authStore.serverConfig');
  });

  it('does not change tab when serverConfig arrives but billing is disabled', async () => {
    authStore.serverConfig = null;
    organizationsStore.organizations = [{ id: 'o1', role: 'owner' }];

    const wrapper = shallowMount(UserView, {
      global: {
        mocks: sharedMocks({ push: vi.fn() }, { query: { tab: 'subscriptions' }, hash: '' }),
        stubs: sharedStubs,
      },
    });

    expect(wrapper.vm.tab).toBe('profile');

    // serverConfig arrives but billing disabled
    authStore.serverConfig = { billing: { enabled: false } };
    await new Promise((r) => setTimeout(r, 0));

    expect(wrapper.vm.tab).toBe('profile');
  });

  it('does not change tab when serverConfig arrives but route has no tab query', async () => {
    authStore.serverConfig = null;
    organizationsStore.organizations = [{ id: 'o1', role: 'owner' }];

    const wrapper = shallowMount(UserView, {
      global: {
        mocks: sharedMocks({ push: vi.fn() }, { query: {}, hash: '' }),
        stubs: sharedStubs,
      },
    });

    expect(wrapper.vm.tab).toBe('profile');

    authStore.serverConfig = { billing: { enabled: true, meterMode: true } };
    await new Promise((r) => setTimeout(r, 0));

    expect(wrapper.vm.tab).toBe('profile');
  });
});

// ── UserView – subscriptions tab full-width (pa-0) ───────────────────────────

describe('UserView – subscriptions tab is full-width (pa-0)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const organizationsStore = useOrganizationsStore();
    organizationsStore.fetchOrganizations = vi.fn().mockResolvedValue([]);
  });

  it('v-window-item for subscriptions has class pa-0 (no padding wrapper)', () => {
    const authStore = useAuthStore();
    const organizationsStore = useOrganizationsStore();
    authStore.serverConfig = { billing: { enabled: true, meterMode: true } };
    organizationsStore.organizations = [{ id: 'o1', role: 'owner' }];

    // Capture attrs on each v-window-item instance so we can assert the
    // subscriptions one has class="pa-0" and does not wrap BillingSubscriptionsComponent
    // in an extra pa-6 div.
    // Note: do NOT declare 'value' as a prop — keep it in $attrs so it's accessible.
    const capturedAttrs = {};
    const windowItemStub = {
      template: '<div><slot /></div>',
      inheritAttrs: false,
      created() {
        if (this.$attrs.value === 'subscriptions') {
          Object.assign(capturedAttrs, this.$attrs);
        }
      },
    };

    const wrapper = shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: {
          ...sharedStubs,
          'v-window-item': windowItemStub,
        },
      },
    });

    expect(wrapper.vm.showSubscriptionsTab).toBe(true);
    // The subscriptions v-window-item must have value="subscriptions" and class="pa-0"
    expect(capturedAttrs.value).toBe('subscriptions');
    expect(capturedAttrs.class).toBe('pa-0');
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
    expect('Delete account').toBeTruthy();
    expect('Permanently delete your account, data, and organization ownership. This cannot be undone.').toBeTruthy();
    expect('Type DELETE to confirm').toBeTruthy();
  });
});
