import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

// ── ability mock (controls the owner/admin CASL gate) ────────────────────────
const abilityMock = vi.hoisted(() => ({
  rules: [{ action: 'create', subject: 'Membership' }],
  can: vi.fn(() => true),
}));
vi.mock('../../../lib/helpers/ability', () => ({ ability: abilityMock }));

vi.mock('../../../lib/helpers/roleColor', () => ({ default: () => 'primary' }));

import OrganizationsMembersComponent from '../components/organizations.members.component.vue';

const sharedStubs = {
  coreDataTableComponent: { template: '<div data-test="datatable" />' },
  userAvatarComponent: { template: '<div />' },
  'v-btn': { template: '<button v-bind="$attrs"><slot /></button>', inheritAttrs: false },
  'v-icon': { template: '<i />' },
  'v-menu': { template: '<div><slot name="activator" :props="{}" /><slot /></div>' },
  'v-list': { template: '<div><slot /></div>' },
  'v-list-item': { template: '<div><slot /></div>' },
  'v-list-item-title': { template: '<div><slot /></div>' },
  'v-list-item-subtitle': { template: '<div><slot /></div>' },
  'v-list-subheader': { template: '<div><slot /></div>' },
  'v-dialog': { template: '<div><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-card-actions': { template: '<div><slot /></div>' },
  'v-spacer': { template: '<div />' },
  'v-chip': { template: '<div><slot /></div>' },
  'v-form': { template: '<form @submit="$emit(\'submit\', $event)"><slot /></form>' },
  'v-text-field': { template: '<input />' },
  'v-select': { template: '<select />' },
  'v-alert': { template: '<div><slot /></div>' },
};

const config = {
  api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
  vuetify: { theme: { rounded: 'rounded-lg', flat: true } },
  organizations: { roles: ['member', 'admin'] },
};

/**
 * Mount the members component with the given org store overrides.
 * @param {Object} [storeOverrides] - Methods/state to set on the store.
 * @returns {Promise<{ wrapper: import('@vue/test-utils').VueWrapper, store: object }>}
 */
async function mountComponent(storeOverrides = {}) {
  const { useOrganizationsStore } = await import('../stores/organizations.store');
  const store = useOrganizationsStore();
  store.fetchMembers = vi.fn().mockResolvedValue([]);
  Object.assign(store, storeOverrides);
  const wrapper = shallowMount(OrganizationsMembersComponent, {
    props: { organizationId: 'org1' },
    global: {
      mocks: { config, $vuetify: { display: { smAndDown: false } } },
      stubs: sharedStubs,
    },
  });
  return { wrapper, store };
}

describe('organizations.members.component — add member', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    abilityMock.can.mockReset();
    abilityMock.can.mockReturnValue(true);
    abilityMock.rules = [{ action: 'create', subject: 'Membership' }];
  });

  it('shows the Add member affordance when the user can create a Membership', async () => {
    // ability.can is called with a subject()-tagged object, not the bare string — check the
    // __caslSubjectType__ tag (set by @casl/ability's subject() helper) plus the organizationId.
    abilityMock.can.mockImplementation((action, sub) => {
      if (action !== 'create') return false;
      if (typeof sub === 'string') return sub === 'Membership';
      return sub?.__caslSubjectType__ === 'Membership' && sub?.organizationId === 'org1';
    });
    const { wrapper } = await mountComponent();
    expect(wrapper.find('[data-test="org-add-member-open"]').exists()).toBe(true);
    expect(wrapper.vm.canAddMember()).toBe(true);
  });

  it('hides the Add member affordance for a plain member (no create ability)', async () => {
    abilityMock.can.mockReturnValue(false);
    const { wrapper } = await mountComponent();
    expect(wrapper.find('[data-test="org-add-member-open"]').exists()).toBe(false);
    expect(wrapper.vm.canAddMember()).toBe(false);
  });

  it('canAddMember is false when the ability has no rules yet', async () => {
    abilityMock.rules = [];
    const { wrapper } = await mountComponent();
    expect(wrapper.vm.canAddMember()).toBe(false);
  });

  it('openAddDialog resets the dialog to a clean searching state', async () => {
    const { wrapper } = await mountComponent();
    wrapper.vm.addDialog.foundUser = { id: 'x' };
    wrapper.vm.openAddDialog();
    expect(wrapper.vm.addDialog.show).toBe(true);
    expect(wrapper.vm.addDialog.email).toBe('');
    expect(wrapper.vm.addDialog.foundUser).toBeNull();
    expect(wrapper.vm.addDialog.searched).toBe(false);
    expect(wrapper.vm.addDialog.role).toBe('member');
  });

  it('defaultRole is the first available role (single source of truth for openAddDialog)', async () => {
    const { wrapper } = await mountComponent();
    // config.organizations.roles = ['member', 'admin'] → first is 'member'
    expect(wrapper.vm.defaultRole()).toBe('member');
    expect(wrapper.vm.availableRoles[0].value).toBe('member');
    wrapper.vm.openAddDialog();
    expect(wrapper.vm.addDialog.role).toBe(wrapper.vm.defaultRole());
  });

  it('onEmailInput clears a stale result', async () => {
    const { wrapper } = await mountComponent();
    wrapper.vm.addDialog.searched = true;
    wrapper.vm.addDialog.foundUser = { id: 'x' };
    wrapper.vm.onEmailInput();
    expect(wrapper.vm.addDialog.searched).toBe(false);
    expect(wrapper.vm.addDialog.foundUser).toBeNull();
  });

  it('searchUser sets foundUser on a match', async () => {
    const searchUserByEmail = vi.fn().mockResolvedValue({ id: 'u1', displayName: 'Jane', email: 'jane@example.com' });
    const { wrapper } = await mountComponent({ searchUserByEmail });
    wrapper.vm.addDialog.email = 'jane@example.com';
    await wrapper.vm.searchUser();
    expect(searchUserByEmail).toHaveBeenCalledWith('org1', 'jane@example.com');
    expect(wrapper.vm.addDialog.foundUser).toEqual({ id: 'u1', displayName: 'Jane', email: 'jane@example.com' });
    expect(wrapper.vm.addDialog.searched).toBe(true);
  });

  it('searchUser marks not-found (searched, no foundUser) when no match', async () => {
    const searchUserByEmail = vi.fn().mockResolvedValue(null);
    const { wrapper } = await mountComponent({ searchUserByEmail });
    wrapper.vm.addDialog.email = 'ghost@example.com';
    await wrapper.vm.searchUser();
    expect(wrapper.vm.addDialog.foundUser).toBeNull();
    expect(wrapper.vm.addDialog.searched).toBe(true);
  });

  it('searchUser leaves searched=false on error (so the user can retry)', async () => {
    const searchUserByEmail = vi.fn().mockRejectedValue(new Error('boom'));
    const { wrapper } = await mountComponent({ searchUserByEmail });
    wrapper.vm.addDialog.email = 'jane@example.com';
    await wrapper.vm.searchUser();
    expect(wrapper.vm.addDialog.searched).toBe(false);
    expect(wrapper.vm.addDialog.searching).toBe(false);
  });

  it('searchUser no-ops with an empty email', async () => {
    const searchUserByEmail = vi.fn();
    const { wrapper } = await mountComponent({ searchUserByEmail });
    wrapper.vm.addDialog.email = '';
    await wrapper.vm.searchUser();
    expect(searchUserByEmail).not.toHaveBeenCalled();
  });

  it('searchUser no-ops with a syntactically invalid email (no endpoint round-trip)', async () => {
    const searchUserByEmail = vi.fn();
    const { wrapper } = await mountComponent({ searchUserByEmail });
    wrapper.vm.addDialog.email = 'not-an-email';
    await wrapper.vm.searchUser();
    expect(searchUserByEmail).not.toHaveBeenCalled();
  });

  it('isValidAddEmail gates obvious garbage but accepts a real address', async () => {
    const { wrapper } = await mountComponent();
    wrapper.vm.addDialog.email = '';
    expect(wrapper.vm.isValidAddEmail).toBe(false);
    wrapper.vm.addDialog.email = 'nope';
    expect(wrapper.vm.isValidAddEmail).toBe(false);
    wrapper.vm.addDialog.email = '  jane@example.com  ';
    expect(wrapper.vm.isValidAddEmail).toBe(true);
  });

  it('searchUser ignores a stale resolution when the email changed mid-flight', async () => {
    // A slower earlier search resolves AFTER the input has changed; its result
    // must NOT overwrite foundUser/searched (request-token guard).
    let resolveStale;
    const searchUserByEmail = vi.fn(() => new Promise((r) => { resolveStale = r; }));
    const { wrapper } = await mountComponent({ searchUserByEmail });
    wrapper.vm.addDialog.email = 'old@example.com';
    const pending = wrapper.vm.searchUser();
    // User retypes a different email while the first request is in flight.
    wrapper.vm.addDialog.email = 'new@example.com';
    resolveStale({ id: 'stale', email: 'old@example.com' });
    await pending;
    expect(wrapper.vm.addDialog.foundUser).toBeNull();
    expect(wrapper.vm.addDialog.searched).toBe(false);
  });

  it('confirmAddMember adds the found user, refreshes members, and closes', async () => {
    const addMember = vi.fn().mockResolvedValue({ id: 'm9' });
    const { wrapper, store } = await mountComponent({ addMember });
    store.fetchMembers.mockClear();
    wrapper.vm.addDialog.show = true;
    wrapper.vm.addDialog.foundUser = { id: 'u1', email: 'jane@example.com' };
    wrapper.vm.addDialog.role = 'admin';
    await wrapper.vm.confirmAddMember();
    expect(addMember).toHaveBeenCalledWith('org1', 'u1', 'admin');
    expect(store.fetchMembers).toHaveBeenCalled();
    expect(wrapper.vm.addDialog.show).toBe(false);
  });

  it('confirmAddMember keeps the dialog open on error (e.g. already a member)', async () => {
    const addMember = vi.fn().mockRejectedValue(new Error('already a member'));
    const { wrapper } = await mountComponent({ addMember });
    wrapper.vm.addDialog.show = true;
    wrapper.vm.addDialog.foundUser = { id: 'u1', email: 'jane@example.com' };
    await wrapper.vm.confirmAddMember();
    expect(wrapper.vm.addDialog.show).toBe(true);
    expect(wrapper.vm.addDialog.adding).toBe(false);
  });

  it('confirmAddMember no-ops without a found user', async () => {
    const addMember = vi.fn();
    const { wrapper } = await mountComponent({ addMember });
    wrapper.vm.addDialog.foundUser = null;
    await wrapper.vm.confirmAddMember();
    expect(addMember).not.toHaveBeenCalled();
  });
});
