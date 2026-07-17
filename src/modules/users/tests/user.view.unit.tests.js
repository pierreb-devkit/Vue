import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount, mount } from '@vue/test-utils';
import { useUserHeaderActions } from '../../../lib/composables/useUserHeaderActions';
import UserView from '../views/user.view.vue';

// Mock config service
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
  },
}));

vi.mock('../../../lib/helpers/ability', () => ({ ability: null, updateAbilities: vi.fn() }));

const sharedStubs = {
  CorePageHeaderTabs: {
    template: '<div data-test="page-header-tabs"><slot /><slot name="actions" /></div>',
    name: 'CorePageHeaderTabs',
    props: ['icon', 'title', 'tabs', 'can', 'basePath', 'hideTabs'],
  },
  RouterView: { template: '<div data-test="router-view" />' },
  'router-view': { template: '<div data-test="router-view" />' },
  'v-container': { template: '<div><slot /></div>' },
};

const sharedMocks = () => ({
  config: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    vuetify: { theme: { flat: true, rounded: 'rounded' } },
    users: {
      tabs: [
        { value: 'profile', label: 'Profile', icon: 'fa-solid fa-id-card', route: 'profile' },
        { value: 'organizations', label: 'Organizations', icon: 'fa-solid fa-building', route: 'organizations' },
      ],
    },
  },
});

// ── UserView – layout shape (Gamma refactor) ──────────────────────────────────

describe('UserView – layout shape (CorePageHeaderTabs + router-view)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders CorePageHeaderTabs', () => {
    const wrapper = shallowMount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    expect(wrapper.find('[data-test="page-header-tabs"]').exists()).toBe(true);
  });

  it('renders a router-view for child route content', () => {
    const wrapper = shallowMount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    expect(wrapper.find('[data-test="router-view"]').exists()).toBe(true);
  });

  it('passes config.users.tabs to CorePageHeaderTabs', () => {
    const wrapper = shallowMount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    const headerTabs = wrapper.findComponent({ name: 'CorePageHeaderTabs' });
    const tabs = headerTabs.props('tabs');
    expect(Array.isArray(tabs)).toBe(true);
    expect(tabs.map((t) => t.value)).toContain('profile');
    expect(tabs.map((t) => t.value)).toContain('organizations');
  });

  it('merges config.users.extraTabs into the tabs (gap-fix A — the optional-module account-tab seam)', () => {
    const mocks = sharedMocks();
    // An optional module (e.g. invitations) contributes its account tab via the
    // SEPARATE extraTabs key (deepMerge replaces arrays, so it can't append to users.tabs).
    mocks.config.users.extraTabs = [
      { value: 'invitations', label: 'Referrals', icon: 'fa-solid fa-gift', route: 'invitations' },
    ];
    const wrapper = shallowMount(UserView, {
      global: { mocks, stubs: sharedStubs },
    });
    const values = wrapper.findComponent({ name: 'CorePageHeaderTabs' }).props('tabs').map((t) => t.value);
    // base tabs preserved AND the module-contributed extra appended
    expect(values).toContain('profile');
    expect(values).toContain('organizations');
    expect(values).toContain('invitations');
  });

  it('passes /users as basePath to CorePageHeaderTabs', () => {
    const wrapper = shallowMount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    const headerTabs = wrapper.findComponent({ name: 'CorePageHeaderTabs' });
    expect(headerTabs.props('basePath')).toBe('/users');
  });

  it('passes a function as can prop to CorePageHeaderTabs', () => {
    const wrapper = shallowMount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    const headerTabs = wrapper.findComponent({ name: 'CorePageHeaderTabs' });
    expect(typeof headerTabs.props('can')).toBe('function');
  });
});

// ── UserView – C4 decoupling: no billing / subscriptions ─────────────────────

describe('UserView – C4 decoupling: billing tab removed from layout', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('does not import or render BillingSubscriptionsComponent', () => {
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
});

// ── UserView – layout is tab-data-free (Gamma) ───────────────────────────────

describe('UserView – layout is tab-data-free (no inline tab state)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('does not expose a "tab" data property (tab state lives in router)', () => {
    const wrapper = shallowMount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    // Routing drives active tab — no local tab state needed in the layout.
    expect(wrapper.vm.tab).toBeUndefined();
  });

  it('does not expose tabsConfig (tabs now come from config.users.tabs)', () => {
    const wrapper = shallowMount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    expect(wrapper.vm.tabsConfig).toBeUndefined();
  });

  it('does not render PageTabs (replaced by CoreSurfaceTabBar)', () => {
    const PageTabsSentinel = { template: '<div data-test="page-tabs-sentinel" />' };
    const wrapper = shallowMount(UserView, {
      global: {
        mocks: sharedMocks(),
        stubs: { ...sharedStubs, PageTabs: PageTabsSentinel },
      },
    });
    expect(wrapper.find('[data-test="page-tabs-sentinel"]').exists()).toBe(false);
  });
});

// ── UserView – #4461: header-actions registry seam (useUserHeaderActions) ───

describe('UserView – header-actions registry seam (useUserHeaderActions)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Isolate the module-scope singleton registry between tests.
    const { extras } = useUserHeaderActions();
    extras.value = [];
  });

  it('does not import organizations directly — users has no compile-time dependency on the optional module', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/user.view.vue'), 'utf8');
    expect(sfc).not.toMatch(/organizations\//);
  });

  it('renders nothing in the actions slot when the registry is empty', () => {
    const wrapper = mount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    expect(wrapper.find('.stub-header-action').exists()).toBe(false);
  });

  it('renders a component registered via useUserHeaderActions().register() (e.g. the organizations switcher)', () => {
    const { register } = useUserHeaderActions();
    register('organizations-switcher', { name: 'StubSwitcher', template: '<div class="stub-header-action">switcher</div>' });
    const wrapper = mount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    expect(wrapper.find('.stub-header-action').exists()).toBe(true);
  });

  it('stops rendering a component after useUserHeaderActions().unregister()', () => {
    const { register, unregister } = useUserHeaderActions();
    register('organizations-switcher', { name: 'StubSwitcher', template: '<div class="stub-header-action">switcher</div>' });
    unregister('organizations-switcher');
    const wrapper = mount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    expect(wrapper.find('.stub-header-action').exists()).toBe(false);
  });

  it('does not expose an isLoggedIn watcher / organizationsStore (fetch moved to the registrar)', () => {
    const wrapper = shallowMount(UserView, {
      global: { mocks: sharedMocks(), stubs: sharedStubs },
    });
    expect(wrapper.vm.organizationsStore).toBeUndefined();
  });
});
