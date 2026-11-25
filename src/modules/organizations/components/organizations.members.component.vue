<template>
  <div>
    <coreDataTableComponent
      :headers="filteredHeaders"
      :items="tableItems"
      :page-length="members.length"
      :fetch-action="fetchMembers"
      :search="true"
    >
      <!-- Card-level action: Add member lives inside the datatable card title,
           left of the search field, so the card aligns with the Details card. -->
      <template #toolbar>
        <v-btn
          v-if="canAddMember()"
          color="primary"
          variant="tonal"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium"
          data-test="org-add-member-open"
          @click="openAddDialog"
        >
          <v-icon icon="fa-solid fa-user-plus" size="small" class="mr-2"></v-icon>
          Add member
        </v-btn>
      </template>
      <!-- Avatar column -->
      <template #avatar="{ item }">
        <!-- Email invitation: no account, so no initials — an envelope stands in. -->
        <v-avatar v-if="item.invitation" :size="37" color="surface-variant" data-test="invitation-avatar">
          <v-icon icon="fa-solid fa-envelope" size="small"></v-icon>
        </v-avatar>
        <userAvatarComponent v-else :user="item.userId || item" :size="37" />
      </template>
      <!-- Name column: an email invitation has no name yet, show its email -->
      <template #name="{ item }">
        <span v-if="item.invitation">{{ item.userId?.email }}</span>
        <span v-else class="text-capitalize">{{ item.userId?.firstName }}</span>
      </template>
      <!-- Role column with chip -->
      <template #role="{ item }">
        <v-chip
          :color="roleColor(item.role)"
          variant="tonal"
          size="small"
          class="text-capitalize"
        >
          {{ item.role }}
        </v-chip>
      </template>
      <!-- Status column with chip: pending owner_add rows render as Invited -->
      <template #status="{ item }">
        <v-chip
          :color="statusChip(item).color"
          variant="tonal"
          size="small"
        >
          {{ statusChip(item).label }}
        </v-chip>
        <div v-if="statusChip(item).hint" class="text-label-small text-medium-emphasis text-no-wrap mt-1">
          {{ statusChip(item).hint }}
        </div>
      </template>
      <!-- Actions column -->
      <template #actions="{ item }">
        <!-- Email invitation row (no account yet): resend the email or revoke it. -->
        <template v-if="item.invitation">
          <v-btn
            icon
            variant="text"
            size="small"
            class="mr-1"
            aria-label="Resend invitation"
            :loading="resendingId === item.id"
            data-test="invitation-resend"
            @click="resendInvitation(item)"
          >
            <v-icon icon="fa-solid fa-paper-plane" size="small"></v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="small"
            color="error"
            aria-label="Revoke invitation"
            data-test="invitation-revoke"
            @click="openRevokeDialog(item)"
          >
            <v-icon icon="fa-solid fa-ban" size="small"></v-icon>
          </v-btn>
        </template>
        <!-- Role change only makes sense once the invitee has accepted; the
             remove button stays on pending rows — it is the owner's cancel
             affordance for the invitation. -->
        <template v-else>
          <v-menu v-if="canUpdateMember() && item.status !== 'pending'" location="bottom end">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                variant="text"
                size="small"
                class="mr-1"
                data-test="member-role-menu"
              >
                <v-icon icon="fa-solid fa-user-pen" size="small"></v-icon>
              </v-btn>
            </template>
            <v-list density="compact" min-width="160" :class="config.vuetify.theme.rounded">
              <v-list-subheader class="text-label-small">CHANGE ROLE</v-list-subheader>
              <v-list-item
                v-for="role in availableRoles"
                :key="role.value"
                :active="item.role === role.value"
                @click="changeRole(item, role.value)"
              >
                <v-list-item-title class="text-body-medium">{{ role.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-btn
            v-if="canRemoveMember()"
            icon
            variant="text"
            size="small"
            color="error"
            data-test="member-remove"
            @click="openRemoveDialog(item)"
          >
            <v-icon icon="fa-solid fa-user-minus" size="small"></v-icon>
          </v-btn>
        </template>
      </template>
    </coreDataTableComponent>

    <!-- Remove confirmation dialog -->
    <v-dialog v-model="removeDialog.show" max-width="440">
      <v-card class="pa-4">
        <v-card-title class="text-title-large font-weight-medium">
          {{ removeDialog.pending ? 'Cancel Invitation' : 'Remove Member' }}
        </v-card-title>
        <v-card-text class="text-body-medium">
          <template v-if="removeDialog.pending">
            Cancel this pending invitation?
          </template>
          <template v-else>
            Are you sure you want to remove <strong>{{ removeDialog.memberName }}</strong> from this organization?
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            class="text-none text-body-medium"
            @click="removeDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            @click="confirmRemoveMember"
          >
            Remove
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Role change confirmation dialog -->
    <v-dialog v-model="roleDialog.show" max-width="440">
      <v-card class="pa-4">
        <v-card-title class="text-title-large font-weight-medium">Change Role</v-card-title>
        <v-card-text class="text-body-medium">
          Change <strong>{{ roleDialog.memberName }}</strong> from
          <v-chip size="x-small" :color="roleColor(roleDialog.currentRole)" variant="tonal" class="text-capitalize mx-1">{{ roleDialog.currentRole }}</v-chip>
          to
          <v-chip size="x-small" :color="roleColor(roleDialog.newRole)" variant="tonal" class="text-capitalize mx-1">{{ roleDialog.newRole }}</v-chip>?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" class="text-none text-body-medium" @click="roleDialog.show = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :class="config.vuetify.theme.rounded" class="text-none text-body-medium" @click="confirmChangeRole">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add member dialog: search a user by exact email, then invite them -->
    <v-dialog v-model="addDialog.show" max-width="480" data-test="org-add-member-dialog">
      <v-card class="pa-4">
        <v-card-title class="text-title-large font-weight-medium">Add member</v-card-title>
        <v-card-text class="text-body-medium">
          <p class="text-medium-emphasis mb-4">
            Search an existing user by their exact email, then send them an invitation.
            They'll need to accept before they become a member.
          </p>

          <v-form @submit.prevent="searchUser">
            <div class="d-flex align-start ga-2">
              <v-text-field
                v-model="addDialog.email"
                label="Email"
                type="email"
                variant="outlined"
                density="comfortable"
                autofocus
                hide-details="auto"
                :rules="emailRules"
                data-test="org-add-member-email"
                :disabled="addDialog.searching"
                @update:model-value="onEmailInput"
              ></v-text-field>
              <v-btn
                color="primary"
                variant="tonal"
                :class="config.vuetify.theme.rounded"
                class="text-none text-body-medium mt-1"
                type="submit"
                :loading="addDialog.searching"
                :disabled="!isValidAddEmail"
                data-test="org-add-member-search"
              >
                Search
              </v-btn>
            </div>
          </v-form>

          <!-- Not found: invite the email when the invitations module is on, else dead-end text -->
          <v-alert
            v-if="isNotFound"
            type="info"
            variant="tonal"
            density="comfortable"
            class="mt-4 text-body-small"
            :class="config.vuetify.theme.rounded"
            data-test="org-add-member-notfound"
          >
            <template v-if="canInviteEmail()">
              No account with that email yet. Send an invitation: they'll join this organization when they sign up from the email link.
            </template>
            <template v-else>
              No account with that email yet. Invite them to the platform first, then add them here.
            </template>
          </v-alert>

          <!-- Found: matched user + role selector -->
          <div v-if="addDialog.foundUser" class="mt-4" data-test="org-add-member-found">
            <v-list-item
              :class="config.vuetify.theme.rounded"
              class="px-3 py-2 bg-surface-variant"
            >
              <template #prepend>
                <userAvatarComponent :user="addDialog.foundUser" :size="40" class="mr-3" />
              </template>
              <v-list-item-title class="text-body-medium font-weight-medium">
                {{ addDialog.foundUser.displayName || addDialog.foundUser.email }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-body-small">{{ addDialog.foundUser.email }}</v-list-item-subtitle>
            </v-list-item>
          </div>

          <!-- Role granted on accept (found user) or on join (email invitation) -->
          <v-select
            v-if="addDialog.foundUser || (isNotFound && canInviteEmail())"
            v-model="addDialog.role"
            :items="availableRoles"
            item-title="title"
            item-value="value"
            label="Role"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            class="mt-4"
            :class="config.vuetify.theme.rounded"
            data-test="org-add-member-role"
          ></v-select>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            class="text-none text-body-medium"
            :disabled="addDialog.adding"
            @click="addDialog.show = false"
          >
            Cancel
          </v-btn>
          <!-- Found user → membership invite; not found → email invitation -->
          <v-btn
            v-if="addDialog.foundUser || (isNotFound && canInviteEmail())"
            color="primary"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            :loading="addDialog.adding"
            :data-test="addDialog.foundUser ? 'org-add-member-submit' : 'org-add-member-invite'"
            @click="addDialog.foundUser ? confirmAddMember() : confirmInviteEmail()"
          >
            Send invitation
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { subject } from '@casl/ability';
import { ability } from '../../../lib/helpers/ability';
import { useOrganizationsStore } from '../stores/organizations.store';
import roleColor from '../../../lib/helpers/roleColor';
import { email, isEmail } from '../../../lib/helpers/rules';
import { isModuleActive } from '../../../lib/helpers/modules';
import coreDataTableComponent from '../../core/components/core.datatable.component.vue';
import userAvatarComponent from '../../core/components/user.avatar.component.vue';
/**
 * Component definition.
 */
export default {
  name: 'OrganizationsMembersComponent',
  components: {
    coreDataTableComponent,
    userAvatarComponent,
  },
  props: {
    organizationId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      headers: [
        { text: 'Avatar', value: 'avatar', kind: 'slot', slotName: 'avatar' },
        { text: 'Name', value: 'userId.firstName', kind: 'slot', slotName: 'name' },
        { text: 'Email', value: 'userId.email', kind: 'email' },
        { text: 'Org Role', value: 'role', kind: 'slot', slotName: 'role' },
        { text: 'Status', value: 'status', kind: 'slot', slotName: 'status' },
        { text: 'Joined', value: 'createdAt', kind: 'date', format: 'DD/MM/YY' },
        { text: 'Last Login', value: 'userId.lastLoginAt', kind: 'date', format: 'DD/MM/YY HH:mm' },
        { text: 'Actions', value: 'actions', kind: 'slot', slotName: 'actions' },
      ],
      // 'owner' is unconditionally excluded: granting owner via the UI is not
      // allowed (add-member and change-role both use this list). Ownership
      // transfer is a separate explicit privilege outside this component.
      availableRoles: (this.config.organizations?.roles || ['member', 'admin', 'owner'])
        .filter((r) => r !== 'owner')
        .map((r) => ({
          title: r.charAt(0).toUpperCase() + r.slice(1),
          value: r,
        })),
      // Email validity rule — mirrors the auth forms' `rules.mail` (signin/signup).
      // Gates the search so obvious garbage doesn't round-trip to the endpoint.
      emailRules: [(v) => !v || email()(v)],
      removeDialog: {
        show: false,
        memberId: null,
        // Set instead of memberId when the row is an email invitation (no account yet).
        invitationId: null,
        memberName: '',
        pending: false,
      },
      // Id of the email invitation whose resend is in flight (button spinner).
      resendingId: null,
      // Page index (0-based) and search of the last members fetch: email invitation
      // rows are merged on the first page only, filtered by the same search.
      membersPage: 0,
      membersSearch: '',
      roleDialog: {
        show: false,
        memberId: null,
        memberName: '',
        currentRole: '',
        newRole: '',
      },
      addDialog: {
        show: false,
        email: '',
        searching: false,
        searched: false,
        foundUser: null,
        // Set on every open by openAddDialog (the only entry point) from
        // availableRoles[0] — see defaultRole(). Initialized here for shape only.
        role: '',
        adding: false,
      },
    };
  },
  computed: {
    members() {
      const organizationsStore = useOrganizationsStore();
      return organizationsStore.members;
    },
    /**
     * @desc Pending email invitations shaped as member rows, flagged with `invitation`
     *       (never told apart by `status`: owner_add memberships are 'pending' too).
     *       First page only, filtered by the table search (the list is not paginated).
     * @returns {Array<Object>}
     */
    invitationRows() {
      if (this.membersPage !== 0 || !this.canInviteEmail()) return [];
      const organizationsStore = useOrganizationsStore();
      const search = this.membersSearch.trim().toLowerCase();
      return organizationsStore.emailInvitations
        .filter((inv) => String(inv.organizationId) === this.organizationId)
        .filter((inv) => !search || (inv.email || '').toLowerCase().includes(search))
        .map((inv) => ({
          id: inv.id || inv._id,
          invitation: true,
          userId: { email: inv.email },
          role: inv.role,
          status: 'pending',
          createdAt: inv.createdAt,
        }));
    },
    /**
     * @desc Changes when the viewed org or the invite permission changes (fetch trigger).
     * @returns {string}
     */
    invitationsKey() {
      return `${this.organizationId}:${this.canInviteEmail()}`;
    },
    /**
     * @desc Rows of the members table: memberships, then pending email invitations.
     * @returns {Array<Object>}
     */
    tableItems() {
      return [...this.members, ...this.invitationRows];
    },
    /**
     * @desc Whether the last add-member search found no account for the email.
     * @returns {boolean}
     */
    isNotFound() {
      return this.addDialog.searched && !this.addDialog.foundUser;
    },
    /**
     * @desc Filter table headers to hide non-essential columns on mobile.
     * @returns {Array} Filtered headers array
     */
    filteredHeaders() {
      const isMobile = this.$vuetify.display.smAndDown;
      if (!isMobile) return this.headers;
      return this.headers.filter((h) => !['createdAt', 'userId.lastLoginAt'].includes(h.value));
    },
    /**
     * @desc Whether the typed add-member email is a syntactically valid address.
     *       Gates the Search button so obvious garbage doesn't hit the endpoint.
     * @returns {boolean}
     */
    isValidAddEmail() {
      return isEmail((this.addDialog.email || '').trim());
    },
  },
  watch: {
    // Org switch, or permissions landing after mount: (re)load the pending invites.
    invitationsKey() {
      this.fetchInvitations();
    },
  },
  created() {
    this.fetchInvitations();
  },
  methods: {
    async fetchMembers(params) {
      const organizationsStore = useOrganizationsStore();
      let opts;
      if (params) {
        const parts = params.split('&');
        opts = {};
        if (parts[0]) opts.page = parts[0];
        if (parts[1]) opts.perPage = parts[1];
        if (parts[2]) opts.search = parts[2];
      }
      await organizationsStore.fetchMembers(this.organizationId, opts);
      this.membersPage = Number(opts?.page) || 0;
      this.membersSearch = opts?.search || '';
    },
    /**
     * @desc Load the organization's pending email invitations. Owner/admin only and
     *       only with the invitations module on (a plain member would get a 403).
     *       A failure leaves the members table untouched (interceptor toasts).
     * @returns {Promise<void>}
     */
    async fetchInvitations() {
      if (!this.canInviteEmail()) return;
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.fetchEmailInvitations(this.organizationId);
      } catch {
        // interceptor handles snackbar
      }
    },
    memberName(member) {
      const user = member.userId || member;
      if (user.firstName || user.lastName) {
        return [user.firstName, user.lastName].filter(Boolean).join(' ');
      }
      return user.email || 'Unknown';
    },
    roleColor,
    /**
     * @desc Status chip descriptor for a membership row. Pending owner_add rows
     *       (awaiting the invitee's consent) render as Invited; everything else
     *       is an active member. An email invitation row is Invited too, with a
     *       short `hint` line under the chip (kept out of the chip so it stays narrow).
     * @param {Object} member - Membership row from the members list.
     * @returns {{ label: string, color: string, hint?: string }}
     */
    statusChip(member) {
      if (member?.invitation) return { label: 'Invited', color: 'warning', hint: 'No account yet' };
      if (member?.status === 'pending') return { label: 'Invited', color: 'warning' };
      return { label: 'Active', color: 'success' };
    },
    /**
     * @desc Check whether the current user can update memberships in the viewed organization.
     * @returns {boolean}
     */
    canUpdateMember() {
      if (ability && ability.rules && ability.rules.length > 0) {
        return ability.can('update', subject('Membership', { organizationId: this.organizationId }));
      }
      return false;
    },
    /**
     * @desc Check whether the current user can remove memberships in the viewed organization.
     * @returns {boolean}
     */
    canRemoveMember() {
      if (ability && ability.rules && ability.rules.length > 0) {
        return ability.can('delete', subject('Membership', { organizationId: this.organizationId }));
      }
      return false;
    },
    /**
     * @desc Gate the add-member affordance on the owner/admin CASL ability. Mirrors
     *       the backend: owners (manage) + admins (create) may add; members cannot.
     *       Scoped to the viewed organization so a user who owns another org does not
     *       see this control when browsing an org where they are only a member.
     * @returns {boolean}
     */
    canAddMember() {
      // Always ask ability.can (false with no rules): it is the reactive read, so a
      // watcher re-runs when the rules land after mount.
      if (!ability) return false;
      return ability.can('create', subject('Membership', { organizationId: this.organizationId }));
    },
    /**
     * @desc Whether this viewer can invite an email with no account: the optional
     *       invitations module is active (config seam, no import of that module) and
     *       the viewer can add members here.
     * @returns {boolean}
     */
    canInviteEmail() {
      return isModuleActive('invitations') && this.canAddMember();
    },
    /**
     * @desc Open confirmation dialog before changing a member's role.
     * @param {Object} member - Member object
     * @param {string} role - New role value
     * @returns {void}
     */
    changeRole(member, role) {
      if (member.role === role) return;
      this.roleDialog = {
        show: true,
        memberId: member.id || member._id,
        memberName: this.memberName(member),
        currentRole: member.role,
        newRole: role,
      };
    },
    /**
     * @desc Confirm the role change after dialog approval.
     * @returns {Promise<void>}
     */
    async confirmChangeRole() {
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.changeMemberRole(this.organizationId, this.roleDialog.memberId, this.roleDialog.newRole);
      } catch {
        // interceptor handles snackbar
      } finally {
        this.roleDialog.show = false;
      }
    },
    openRemoveDialog(member) {
      this.removeDialog = {
        show: true,
        memberId: member.id || member._id,
        invitationId: null,
        memberName: this.memberName(member),
        pending: member.status === 'pending',
      };
    },
    /**
     * @desc Open the cancel-invitation confirmation for an email invitation row.
     * @param {Object} row - Email invitation row (from invitationRows)
     * @returns {void}
     */
    openRevokeDialog(row) {
      this.removeDialog = {
        show: true,
        memberId: null,
        invitationId: row.id,
        memberName: row.userId.email,
        pending: true,
      };
    },
    async confirmRemoveMember() {
      const organizationsStore = useOrganizationsStore();
      const { invitationId } = this.removeDialog;
      try {
        if (invitationId) await organizationsStore.revokeEmailInvitation(this.organizationId, invitationId);
        else await organizationsStore.removeMember(this.organizationId, this.removeDialog.memberId);
        this.removeDialog.show = false;
      } catch {
        // The axios interceptor shows the error snackbar. A failed revoke (e.g. 409: the
        // invite was accepted meanwhile) refreshes the list so the stale row goes away.
        if (invitationId) {
          this.removeDialog.show = false;
          await this.fetchInvitations();
        }
      }
    },
    /**
     * @desc Re-send the email of a pending invitation (same link), then refresh the list
     *       either way — a 409 means it was accepted or revoked meanwhile.
     * @param {Object} row - Email invitation row (from invitationRows)
     * @returns {Promise<void>}
     */
    async resendInvitation(row) {
      if (this.resendingId) return;
      const organizationsStore = useOrganizationsStore();
      this.resendingId = row.id;
      try {
        await organizationsStore.resendEmailInvitation(this.organizationId, row.id);
      } catch {
        await this.fetchInvitations();
      } finally {
        this.resendingId = null;
      }
    },
    /**
     * @desc The default role for a new add-member dialog — first available role,
     *       falling back to 'member'. Single source of truth for the role default.
     * @returns {string}
     */
    defaultRole() {
      return this.availableRoles[0]?.value || 'member';
    },
    /**
     * @desc Open the add-member dialog with a clean search state.
     * @returns {void}
     */
    openAddDialog() {
      this.addDialog = {
        show: true,
        email: '',
        searching: false,
        searched: false,
        foundUser: null,
        role: this.defaultRole(),
        adding: false,
      };
    },
    /**
     * @desc Reset the result state when the email input changes so a stale
     *       found/not-found result never lingers against a new email.
     * @returns {void}
     */
    onEmailInput() {
      this.addDialog.searched = false;
      this.addDialog.foundUser = null;
    },
    /**
     * @desc Look up a user by exact email. Sets foundUser on a match, or marks
     *       searched with no foundUser for the not-found state. Errors surface via
     *       the axios interceptor toast. Guards against a stale response: a slower
     *       earlier search must not overwrite foundUser if the email has since
     *       changed (fast re-submits) — we capture the requested email (trimmed, to
     *       match the store's trim) before awaiting and bail if it no longer matches.
     * @returns {Promise<void>}
     */
    async searchUser() {
      // Guard the submit path too (Enter key bypasses the disabled button): never
      // round-trip an empty or syntactically-invalid email to the search endpoint.
      if (!this.isValidAddEmail || this.addDialog.searching) return;
      const organizationsStore = useOrganizationsStore();
      const reqEmail = this.addDialog.email.trim();
      this.addDialog.searching = true;
      this.addDialog.foundUser = null;
      try {
        const match = await organizationsStore.searchUserByEmail(this.organizationId, this.addDialog.email);
        // Bail on a stale resolution: the input changed while this request was in flight.
        if (this.addDialog.email.trim() !== reqEmail) return;
        this.addDialog.foundUser = match || null;
        this.addDialog.searched = true;
      } catch {
        // interceptor handles snackbar; leave searched false so the user can retry
        if (this.addDialog.email.trim() !== reqEmail) return;
        this.addDialog.searched = false;
      } finally {
        this.addDialog.searching = false;
      }
    },
    /**
     * @desc Send the invitation (create a pending owner_add membership). On success
     *       the interceptor toasts "invitation created"; we refresh the member list
     *       and close the dialog. Already-a-member / already-pending come back as a
     *       422 the interceptor surfaces — keep the dialog open so the user sees it.
     * @returns {Promise<void>}
     */
    async confirmAddMember() {
      if (!this.addDialog.foundUser || this.addDialog.adding) return;
      const organizationsStore = useOrganizationsStore();
      this.addDialog.adding = true;
      try {
        await organizationsStore.addMember(this.organizationId, this.addDialog.foundUser.id, this.addDialog.role);
        await this.fetchMembers();
        this.addDialog.show = false;
      } catch {
        // interceptor handles snackbar (e.g. already a member / pending)
      } finally {
        this.addDialog.adding = false;
      }
    },
    /**
     * @desc Invite the searched email (no account yet) into the organization with the
     *       chosen role. On success refresh the invitation rows and close; on an error
     *       (e.g. 409 a live invitation already exists) keep the dialog open — the
     *       interceptor toasts the reason.
     * @returns {Promise<void>}
     */
    async confirmInviteEmail() {
      if (!this.isNotFound || !this.canInviteEmail() || this.addDialog.adding) return;
      const organizationsStore = useOrganizationsStore();
      this.addDialog.adding = true;
      try {
        await organizationsStore.inviteEmail(this.organizationId, this.addDialog.email, this.addDialog.role);
        await this.fetchInvitations();
        this.addDialog.show = false;
      } catch {
        // interceptor handles snackbar
      } finally {
        this.addDialog.adding = false;
      }
    },
  },
};
</script>
