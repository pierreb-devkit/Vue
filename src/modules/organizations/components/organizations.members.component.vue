<template>
  <div>
    <coreDataTableComponent
      :headers="filteredHeaders"
      :items="members"
      :fetch-action="fetchMembers"
      :search="true"
    >
      <!-- Avatar column -->
      <template #avatar="{ item }">
        <userAvatarComponent :user="item.userId || item" :size="37" />
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
      <!-- Actions column -->
      <template #actions="{ item }">
        <v-menu v-if="canUpdateMember()" location="bottom end">
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
          @click="openRemoveDialog(item)"
        >
          <v-icon icon="fa-solid fa-user-minus" size="small"></v-icon>
        </v-btn>
      </template>
    </coreDataTableComponent>

    <!-- Remove confirmation dialog -->
    <v-dialog v-model="removeDialog.show" max-width="440">
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

    <!-- Role change confirmation dialog -->
    <v-dialog v-model="roleDialog.show" max-width="440">
      <v-card :class="config.vuetify.theme.rounded" class="pa-4">
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
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { ability } from '../../../lib/helpers/ability';
import { useOrganizationsStore } from '../stores/organizations.store';
import roleColor from '../../../lib/helpers/roleColor';
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
        { text: 'Name', value: 'userId.firstName', kind: 'capitalize' },
        { text: 'Email', value: 'userId.email', kind: 'email' },
        { text: 'Org Role', value: 'role', kind: 'slot', slotName: 'role' },
        { text: 'Joined', value: 'createdAt', kind: 'date', format: 'DD/MM/YY' },
        { text: 'Last Login', value: 'userId.lastLoginAt', kind: 'date', format: 'DD/MM/YY HH:mm' },
        { text: 'Actions', value: 'actions', kind: 'slot', slotName: 'actions' },
      ],
      availableRoles: (this.config.organizations?.roles || ['member', 'admin', 'owner']).map((r) => ({
        title: r.charAt(0).toUpperCase() + r.slice(1),
        value: r,
      })),
      removeDialog: {
        show: false,
        memberId: null,
        memberName: '',
      },
      roleDialog: {
        show: false,
        memberId: null,
        memberName: '',
        currentRole: '',
        newRole: '',
      },
    };
  },
  computed: {
    members() {
      const organizationsStore = useOrganizationsStore();
      return organizationsStore.members;
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
    },
    memberName(member) {
      const user = member.userId || member;
      if (user.firstName || user.lastName) {
        return [user.firstName, user.lastName].filter(Boolean).join(' ');
      }
      return user.email || 'Unknown';
    },
    roleColor,
    canUpdateMember() {
      if (ability && ability.rules && ability.rules.length > 0) {
        return ability.can('update', 'Membership');
      }
      return false;
    },
    canRemoveMember() {
      if (ability && ability.rules && ability.rules.length > 0) {
        return ability.can('delete', 'Membership');
      }
      return false;
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
        memberName: this.memberName(member),
      };
    },
    async confirmRemoveMember() {
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.removeMember(this.organizationId, this.removeDialog.memberId);
        this.removeDialog.show = false;
      } catch (err) {
        console.error(err);
      }
    },
  },
};
</script>
