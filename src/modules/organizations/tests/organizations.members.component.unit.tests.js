import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

// ── ability mock (controls the owner/admin CASL gate) ────────────────────────
const abilityMock = vi.hoisted(() => ({
  rules: [{ action: 'create', subject: 'Membership' }],
  can: vi.fn(() => true),
}));
vi.mock('../../../lib/helpers/ability', () => ({ ability: abilityMock }));

vi.mock('../../../lib/helpers/roleColor', () => ({ default: () => 'primary' }));

// ── module activation mock (the optional invitations module seam) ───────────
const modulesMock = vi.hoisted(() => ({ invitations: true }));
vi.mock('../../../lib/helpers/modules', () => ({
  isModuleActive: (name) => (name === 'invitations' ? modulesMock.invitations : true),
}));

import OrganizationsMembersComponent from '../components/organizations.members.component.vue';

const sharedStubs = {
  // Renders the card-level #toolbar slot (hosts the Add member button)
  coreDataTableComponent: { template: '<div data-test="datatable"><slot name="toolbar" /></div>' },
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
 * @param {Object} [stubOverrides] - Component stubs replacing the shared ones.
 * @returns {Promise<{ wrapper: import('@vue/test-utils').VueWrapper, store: object }>}
 */
async function mountComponent(storeOverrides = {}, stubOverrides = {}) {
  const { useOrganizationsStore } = await import('../stores/organizations.store');
  const store = useOrganizationsStore();
  store.fetchMembers = vi.fn().mockResolvedValue([]);
  store.fetchEmailInvitations = vi.fn().mockResolvedValue([]);
  Object.assign(store, storeOverrides);
  const wrapper = shallowMount(OrganizationsMembersComponent, {
    props: { organizationId: 'org1' },
    global: {
      mocks: { config, $vuetify: { display: { smAndDown: false } } },
      stubs: { ...sharedStubs, ...stubOverrides },
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
    modulesMock.invitations = true;
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
    abilityMock.can.mockReturnValue(false); // the real ability: no rules → can() is false
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

describe('organizations.members.component — pending status', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    abilityMock.can.mockReset();
    abilityMock.can.mockReturnValue(true);
    abilityMock.rules = [{ action: 'create', subject: 'Membership' }];
    modulesMock.invitations = true;
  });

  it('declares a Status column rendered as a slot', async () => {
    const { wrapper } = await mountComponent();
    const status = wrapper.vm.headers.find((h) => h.value === 'status');
    expect(status).toEqual({ text: 'Status', value: 'status', kind: 'slot', slotName: 'status' });
  });

  it('statusChip maps active → Active/success and pending → Invited/warning', async () => {
    const { wrapper } = await mountComponent();
    expect(wrapper.vm.statusChip({ status: 'active' })).toEqual({ label: 'Active', color: 'success' });
    expect(wrapper.vm.statusChip({ status: 'pending' })).toEqual({ label: 'Invited', color: 'warning' });
    expect(wrapper.vm.statusChip({ invitation: true, status: 'pending' })).toEqual({ label: 'Invited', color: 'warning', hint: 'No account yet' });
    // Defensive: rows without a status field render as active members.
    expect(wrapper.vm.statusChip({})).toEqual({ label: 'Active', color: 'success' });
  });

  it('hides the role-change menu on pending rows but keeps the remove button (owner cancel affordance)', async () => {
    const rowsStub = {
      props: ['items'],
      template: `<div>
        <div v-for="item in items" :key="item.id" :data-test="'row-' + item.id">
          <slot name="status" :item="item" />
          <slot name="actions" :item="item" />
        </div>
      </div>`,
    };
    const { useOrganizationsStore } = await import('../stores/organizations.store');
    const store = useOrganizationsStore();
    store.fetchMembers = vi.fn().mockResolvedValue([]);
    store.fetchEmailInvitations = vi.fn().mockResolvedValue([]);
    store.members = [
      { id: 'm1', role: 'member', status: 'active', userId: { email: 'a@example.com' } },
      { id: 'm2', role: 'member', status: 'pending', userId: { email: 'b@example.com' } },
    ];
    const wrapper = shallowMount(OrganizationsMembersComponent, {
      props: { organizationId: 'org1' },
      global: {
        mocks: { config, $vuetify: { display: { smAndDown: false } } },
        stubs: { ...sharedStubs, coreDataTableComponent: rowsStub },
      },
    });
    const active = wrapper.find('[data-test="row-m1"]');
    const pending = wrapper.find('[data-test="row-m2"]');
    expect(active.text()).toContain('Active');
    expect(pending.text()).toContain('Invited');
    expect(active.find('[data-test="member-role-menu"]').exists()).toBe(true);
    expect(pending.find('[data-test="member-role-menu"]').exists()).toBe(false);
    expect(active.find('[data-test="member-remove"]').exists()).toBe(true);
    expect(pending.find('[data-test="member-remove"]').exists()).toBe(true);
  });

  it('openRemoveDialog relabels the confirm copy for pending rows', async () => {
    const { wrapper } = await mountComponent();
    wrapper.vm.openRemoveDialog({ id: 'm2', status: 'pending', userId: { email: 'b@example.com' } });
    expect(wrapper.vm.removeDialog.pending).toBe(true);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Cancel this pending invitation?');
    wrapper.vm.openRemoveDialog({ id: 'm1', status: 'active', userId: { firstName: 'Jane' } });
    expect(wrapper.vm.removeDialog.pending).toBe(false);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Are you sure you want to remove');
  });
});

// Renders the avatar, name, status + actions slots per row, so row-level branches are exercised.
const rowsStub = {
  props: ['items'],
  template: `<div>
    <div v-for="item in items" :key="item.id" :data-test="'row-' + item.id">
      <slot name="avatar" :item="item" />
      <span data-test="name-cell"><slot name="name" :item="item" /></span>
      <slot name="status" :item="item" />
      <slot name="actions" :item="item" />
    </div>
  </div>`,
};

const invitation = { id: 'i1', email: 'new@example.com', role: 'admin', organizationId: 'org1', status: 'pending', createdAt: '2026-11-25T10:00:00.000Z' };

describe('organizations.members.component — invite an email with no account', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    abilityMock.can.mockReset();
    abilityMock.can.mockReturnValue(true);
    abilityMock.rules = [{ action: 'create', subject: 'Membership' }];
    modulesMock.invitations = true;
  });

  /**
   * Open the dialog in its not-found state for ghost@example.com.
   * @param {Object} [storeOverrides] - Methods/state to set on the store.
   * @returns {Promise<{ wrapper: import('@vue/test-utils').VueWrapper, store: object }>}
   */
  const mountNotFound = async (storeOverrides = {}) => {
    const mounted = await mountComponent({ searchUserByEmail: vi.fn().mockResolvedValue(null), ...storeOverrides });
    mounted.wrapper.vm.openAddDialog();
    mounted.wrapper.vm.addDialog.email = 'ghost@example.com';
    await mounted.wrapper.vm.searchUser();
    await mounted.wrapper.vm.$nextTick();
    return mounted;
  };

  it('not-found shows the invite copy, a role select and a Send invitation button', async () => {
    const { wrapper } = await mountNotFound();
    expect(wrapper.find('[data-test="org-add-member-notfound"]').text()).toContain('Send an invitation');
    expect(wrapper.find('[data-test="org-add-member-role"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="org-add-member-invite"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="org-add-member-submit"]').exists()).toBe(false);
  });

  it('confirmInviteEmail invites the email with the role, refreshes invitations, and closes', async () => {
    const inviteEmail = vi.fn().mockResolvedValue({ id: 'i9' });
    const { wrapper, store } = await mountNotFound({ inviteEmail });
    store.fetchEmailInvitations.mockClear();
    wrapper.vm.addDialog.role = 'admin';
    await wrapper.vm.confirmInviteEmail();
    expect(inviteEmail).toHaveBeenCalledWith('org1', 'ghost@example.com', 'admin');
    expect(store.fetchEmailInvitations).toHaveBeenCalledWith('org1');
    expect(wrapper.vm.addDialog.show).toBe(false);
  });

  it('confirmInviteEmail keeps the dialog open on error (e.g. a live invitation exists)', async () => {
    const inviteEmail = vi.fn().mockRejectedValue(new Error('409'));
    const { wrapper } = await mountNotFound({ inviteEmail });
    await wrapper.vm.confirmInviteEmail();
    expect(wrapper.vm.addDialog.show).toBe(true);
    expect(wrapper.vm.addDialog.adding).toBe(false);
  });

  it('confirmInviteEmail no-ops before a not-found search', async () => {
    const inviteEmail = vi.fn();
    const { wrapper } = await mountComponent({ inviteEmail });
    wrapper.vm.openAddDialog();
    await wrapper.vm.confirmInviteEmail();
    expect(inviteEmail).not.toHaveBeenCalled();
  });

  it('loads the invitations on mount for an owner/admin', async () => {
    const { store } = await mountComponent();
    expect(store.fetchEmailInvitations).toHaveBeenCalledWith('org1');
  });

  it('does not load the invitations for a plain member (the route is owner/admin only)', async () => {
    abilityMock.can.mockReturnValue(false);
    const { store } = await mountComponent();
    expect(store.fetchEmailInvitations).not.toHaveBeenCalled();
  });

  it('a failed invitations load leaves the members table untouched', async () => {
    const members = [{ id: 'm1', role: 'member', status: 'active', userId: { email: 'a@example.com' } }];
    const { wrapper } = await mountComponent({ members, fetchEmailInvitations: vi.fn().mockRejectedValue(new Error('500')) });
    await flushPromises();
    expect(wrapper.vm.tableItems).toEqual(members);
  });

  it('renders invitation rows as "Invited" + "No account yet" with resend + revoke, not member actions', async () => {
    const members = [{ id: 'm2', role: 'member', status: 'pending', userId: { email: 'b@example.com' } }];
    const { wrapper } = await mountComponent({ members, emailInvitations: [invitation] }, { coreDataTableComponent: rowsStub });
    const row = wrapper.find('[data-test="row-i1"]');
    expect(row.text()).toContain('Invited');
    expect(row.text()).toContain('No account yet');
    // Name cell shows the email; avatar is the envelope, not "?" initials.
    expect(row.find('[data-test="name-cell"]').text()).toBe('new@example.com');
    expect(row.find('[data-test="invitation-avatar"]').exists()).toBe(true);
    expect(row.find('[data-test="invitation-resend"]').exists()).toBe(true);
    expect(row.find('[data-test="invitation-revoke"]').exists()).toBe(true);
    expect(row.find('[data-test="member-remove"]').exists()).toBe(false);
    expect(row.find('[data-test="member-role-menu"]').exists()).toBe(false);
    // The owner_add pending membership keeps its own label and remove button.
    const pending = wrapper.find('[data-test="row-m2"]');
    expect(pending.text()).toContain('Invited');
    expect(pending.text()).not.toContain('No account yet');
    expect(pending.find('[data-test="invitation-avatar"]').exists()).toBe(false);
    expect(pending.find('[data-test="name-cell"]').text()).toBe('');
    expect(pending.find('[data-test="member-remove"]').exists()).toBe(true);
    expect(pending.find('[data-test="invitation-resend"]').exists()).toBe(false);
  });

  it('invitationRows: first page only, filtered by search, and scoped to this organization', async () => {
    const other = { ...invitation, id: 'i2', email: 'other@example.com', organizationId: 'org2' };
    const second = { ...invitation, id: 'i3', email: 'zed@example.com' };
    const { wrapper } = await mountComponent({ emailInvitations: [invitation, other, second] });
    expect(wrapper.vm.invitationRows.map((r) => r.id)).toEqual(['i1', 'i3']);
    expect(wrapper.vm.invitationRows[0]).toMatchObject({ invitation: true, userId: { email: 'new@example.com' }, role: 'admin', status: 'pending' });
    await wrapper.vm.fetchMembers('0&5&zed');
    expect(wrapper.vm.invitationRows.map((r) => r.id)).toEqual(['i3']);
    await wrapper.vm.fetchMembers('1&5');
    expect(wrapper.vm.invitationRows).toEqual([]);
  });

  it('resendInvitation calls the store and clears the spinner', async () => {
    const resendEmailInvitation = vi.fn().mockResolvedValue({ id: 'i1' });
    const { wrapper } = await mountComponent({ resendEmailInvitation });
    await wrapper.vm.resendInvitation({ id: 'i1' });
    expect(resendEmailInvitation).toHaveBeenCalledWith('org1', 'i1');
    expect(wrapper.vm.resendingId).toBeNull();
  });

  it('a failed resend refreshes the invitations (accepted or revoked meanwhile)', async () => {
    const resendEmailInvitation = vi.fn().mockRejectedValue(new Error('409'));
    const { wrapper, store } = await mountComponent({ resendEmailInvitation });
    store.fetchEmailInvitations.mockClear();
    await wrapper.vm.resendInvitation({ id: 'i1' });
    expect(store.fetchEmailInvitations).toHaveBeenCalledWith('org1');
    expect(wrapper.vm.resendingId).toBeNull();
  });

  it('revoke goes through the cancel-invitation dialog and revokes the invitation, not a membership', async () => {
    const revokeEmailInvitation = vi.fn().mockResolvedValue();
    const removeMember = vi.fn();
    const { wrapper } = await mountComponent({ revokeEmailInvitation, removeMember });
    wrapper.vm.openRevokeDialog({ id: 'i1', userId: { email: 'new@example.com' } });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Cancel this pending invitation?');
    await wrapper.vm.confirmRemoveMember();
    expect(revokeEmailInvitation).toHaveBeenCalledWith('org1', 'i1');
    expect(removeMember).not.toHaveBeenCalled();
    expect(wrapper.vm.removeDialog.show).toBe(false);
  });

  it('a failed revoke closes the dialog and refreshes the invitations', async () => {
    const revokeEmailInvitation = vi.fn().mockRejectedValue(new Error('409'));
    const { wrapper, store } = await mountComponent({ revokeEmailInvitation });
    store.fetchEmailInvitations.mockClear();
    wrapper.vm.openRevokeDialog({ id: 'i1', userId: { email: 'new@example.com' } });
    await wrapper.vm.confirmRemoveMember();
    expect(wrapper.vm.removeDialog.show).toBe(false);
    expect(store.fetchEmailInvitations).toHaveBeenCalledWith('org1');
  });

  it('a membership remove still calls removeMember', async () => {
    const removeMember = vi.fn().mockResolvedValue();
    const revokeEmailInvitation = vi.fn();
    const { wrapper } = await mountComponent({ removeMember, revokeEmailInvitation });
    wrapper.vm.openRemoveDialog({ id: 'm1', status: 'active', userId: { firstName: 'Jane' } });
    await wrapper.vm.confirmRemoveMember();
    expect(removeMember).toHaveBeenCalledWith('org1', 'm1');
    expect(revokeEmailInvitation).not.toHaveBeenCalled();
  });

  it('reloads the invitations when the viewed organization changes', async () => {
    const { wrapper, store } = await mountComponent();
    store.fetchEmailInvitations.mockClear();
    await wrapper.setProps({ organizationId: 'org2' });
    expect(store.fetchEmailInvitations).toHaveBeenCalledWith('org2');
  });
});

describe('organizations.members.component — invitations module off', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    abilityMock.can.mockReset();
    abilityMock.can.mockReturnValue(true);
    abilityMock.rules = [{ action: 'create', subject: 'Membership' }];
    modulesMock.invitations = false;
  });

  it('keeps the dead-end text, no role select, no invite button, no invitation fetch or rows', async () => {
    const { wrapper, store } = await mountComponent(
      { searchUserByEmail: vi.fn().mockResolvedValue(null), emailInvitations: [invitation] },
      { coreDataTableComponent: rowsStub },
    );
    expect(store.fetchEmailInvitations).not.toHaveBeenCalled();
    expect(wrapper.find('[data-test="row-i1"]').exists()).toBe(false);
    wrapper.vm.openAddDialog();
    wrapper.vm.addDialog.email = 'ghost@example.com';
    await wrapper.vm.searchUser();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="org-add-member-notfound"]').text()).toContain('Invite them to the platform first, then add them here.');
    expect(wrapper.find('[data-test="org-add-member-role"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="org-add-member-invite"]').exists()).toBe(false);
    const inviteEmail = vi.fn();
    store.inviteEmail = inviteEmail;
    await wrapper.vm.confirmInviteEmail();
    expect(inviteEmail).not.toHaveBeenCalled();
  });
});
