<template>
  <div>
    <!-- Invite section -->
    <organizationsInviteComponent
      :organization-id="organizationId"
      class="mb-4"
      @invited="refreshMembers"
    />

    <!-- Members table -->
    <v-card
      color="surface"
      :flat="config.vuetify.theme.flat"
      :class="config.vuetify.theme.rounded"
    >
      <v-card-title class="d-flex align-center pa-6 pb-2">
        <h3 class="text-title-medium font-weight-medium">Members</h3>
        <v-spacer></v-spacer>
        <v-chip variant="tonal" size="small">
          {{ members.length }} {{ members.length === 1 ? 'member' : 'members' }}
        </v-chip>
      </v-card-title>

      <v-progress-linear :active="loading" indeterminate color="primary"></v-progress-linear>

      <v-table v-if="members.length > 0" fixed-header>
        <thead>
          <tr>
            <th class="text-left text-label-medium">Member</th>
            <th class="text-left text-label-medium">Email</th>
            <th class="text-left text-label-medium">Role</th>
            <th class="text-left text-label-medium">Joined</th>
            <th class="text-right text-label-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in members" :key="member.id || member._id">
            <!-- Member info -->
            <td>
              <div class="d-flex align-center py-2">
                <v-avatar size="32" color="primary" class="mr-3">
                  <v-img v-if="member.avatar || (member.user && member.user.avatar)" :src="member.avatar || member.user.avatar"></v-img>
                  <span v-else class="text-label-small font-weight-bold">
                    {{ memberInitial(member) }}
                  </span>
                </v-avatar>
                <span class="text-body-medium">
                  {{ memberName(member) }}
                </span>
              </div>
            </td>
            <!-- Email -->
            <td class="text-body-medium text-medium-emphasis">
              {{ memberEmail(member) }}
            </td>
            <!-- Role -->
            <td>
              <v-chip
                :color="roleColor(member.role)"
                variant="tonal"
                size="small"
                class="text-capitalize"
              >
                {{ member.role }}
              </v-chip>
            </td>
            <!-- Joined -->
            <td class="text-body-small text-medium-emphasis">
              {{ formatDate(member.createdAt || member.joinedAt) }}
            </td>
            <!-- Actions -->
            <td class="text-right">
              <v-menu v-if="canUpdateMember(member)" location="bottom end">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    variant="text"
                    size="small"
                    class="mr-1"
                  >
                    <v-icon icon="fa-solid fa-user-pen" size="small"></v-icon>
                  </v-btn>
                </template>
                <v-list density="compact" min-width="160" :class="config.vuetify.theme.rounded">
                  <v-list-subheader class="text-label-small">CHANGE ROLE</v-list-subheader>
                  <v-list-item
                    v-for="role in availableRoles"
                    :key="role.value"
                    :active="member.role === role.value"
                    @click="changeRole(member, role.value)"
                  >
                    <v-list-item-title class="text-body-medium">{{ role.title }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
              <v-btn
                v-if="canRemoveMember(member)"
                icon
                variant="text"
                size="small"
                color="error"
                @click="openRemoveDialog(member)"
              >
                <v-icon icon="fa-solid fa-user-minus" size="small"></v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- Empty state -->
      <v-card-text v-if="!loading && members.length === 0" class="text-center py-8">
        <v-icon icon="fa-solid fa-users" size="large" class="mb-3 text-disabled"></v-icon>
        <p class="text-body-medium text-medium-emphasis">No members yet. Invite someone to get started.</p>
      </v-card-text>
    </v-card>

    <!-- Remove confirmation dialog -->
    <v-dialog v-model="removeDialog.show" max-width="400">
      <v-card :class="config.vuetify.theme.rounded" class="pa-4">
        <v-card-title class="text-title-large font-weight-medium">
          Remove Member
        </v-card-title>
        <v-card-text class="text-body-medium">
          Are you sure you want to remove <strong>{{ removeDialog.memberName }}</strong> from this organization?
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
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { ability } from '../../../lib/helpers/ability';
import { useOrganizationsStore } from '../stores/organizations.store';
import organizationsInviteComponent from './organizations.invite.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'OrganizationsMembersComponent',
  components: {
    organizationsInviteComponent,
  },
  props: {
    organizationId: {
      type: String,
      required: true,
    },
  },
  data() {
    const theme = useTheme();
    return {
      theme,
      loading: false,
      availableRoles: [
        { title: 'Member', value: 'member' },
        { title: 'Admin', value: 'admin' },
      ],
      removeDialog: {
        show: false,
        memberId: null,
        memberName: '',
      },
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
    members() {
      const organizationsStore = useOrganizationsStore();
      return organizationsStore.members;
    },
  },
  created() {
    this.refreshMembers();
  },
  methods: {
    /**
     * @desc Fetch the members list for this organization.
     * @returns {Promise<void>}
     */
    async refreshMembers() {
      this.loading = true;
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.fetchMembers(this.organizationId);
      } catch (err) {
        console.log(err);
      } finally {
        this.loading = false;
      }
    },
    /**
     * @desc Get display name for a member.
     * @param {Object} member - Member object
     * @returns {string} Display name
     */
    memberName(member) {
      const user = member.user || member;
      if (user.firstName || user.lastName) {
        return [user.firstName, user.lastName].filter(Boolean).join(' ');
      }
      return user.email || 'Unknown';
    },
    /**
     * @desc Get email for a member.
     * @param {Object} member - Member object
     * @returns {string} Email address
     */
    memberEmail(member) {
      return member.email || (member.user && member.user.email) || '';
    },
    /**
     * @desc Get the initial letter for a member avatar.
     * @param {Object} member - Member object
     * @returns {string} Single uppercase character
     */
    memberInitial(member) {
      const name = this.memberName(member);
      return (name || '?').charAt(0).toUpperCase();
    },
    /**
     * @desc Get color token for a role badge.
     * @param {string} role - Member role
     * @returns {string} Vuetify color name
     */
    roleColor(role) {
      const colors = { admin: 'primary', owner: 'secondary', member: 'grey' };
      return colors[role] || 'grey';
    },
    /**
     * @desc Format an ISO date string for display.
     * @param {string} dateStr - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateStr) {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
    /**
     * @desc Check if the current user can update a member's role via CASL.
     * @returns {boolean}
     */
    canUpdateMember() {
      if (ability && ability.rules && ability.rules.length > 0) {
        return ability.can('update', 'Membership');
      }
      return true;
    },
    /**
     * @desc Check if the current user can remove a member via CASL.
     * @returns {boolean}
     */
    canRemoveMember() {
      if (ability && ability.rules && ability.rules.length > 0) {
        return ability.can('delete', 'Membership');
      }
      return true;
    },
    /**
     * @desc Change a member's role.
     * @param {Object} member - Member object
     * @param {string} role - New role
     * @returns {Promise<void>}
     */
    async changeRole(member, role) {
      if (member.role === role) return;
      const organizationsStore = useOrganizationsStore();
      const memberId = member.id || member._id;
      try {
        await organizationsStore.changeMemberRole(this.organizationId, memberId, role);
        await this.refreshMembers();
      } catch (err) {
        console.log(err);
      }
    },
    /**
     * @desc Open the remove confirmation dialog for a member.
     * @param {Object} member - Member to remove
     */
    openRemoveDialog(member) {
      this.removeDialog = {
        show: true,
        memberId: member.id || member._id,
        memberName: this.memberName(member),
      };
    },
    /**
     * @desc Confirm and execute member removal.
     * @returns {Promise<void>}
     */
    async confirmRemoveMember() {
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.removeMember(this.organizationId, this.removeDialog.memberId);
        this.removeDialog.show = false;
      } catch (err) {
        console.log(err);
      }
    },
  },
};
</script>
