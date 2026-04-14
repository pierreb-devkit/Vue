<template>
  <v-container fluid class="pa-0">
    <div class="pa-4">
      <coreDataTableComponent :headers="userHeaders" :items="users" :fetch-action="fetchUsers">
        <template #name="{ item }"
          ><router-link
            :to="'/admin/users/' + (item.id || item._id)"
            class="text-capitalize text-primary text-decoration-none font-weight-medium"
            >{{ item.firstName }} {{ item.lastName }}</router-link
          ></template
        >
        <template #organizations="{ item }"
          ><v-chip
            v-for="m in item.memberships || []"
            :key="m._id || m.id"
            size="small"
            :variant="isUserActiveOrg(item, m) ? 'flat' : 'tonal'"
            :color="orgColor(m.organizationId)"
            class="mr-1 text-capitalize"
            style="cursor: pointer"
            @click="$router.push('/admin/organizations/' + (m.organizationId?._id || m.organizationId?.id))"
            >{{ (m.organizationId && m.organizationId.name) || '—' }} ({{ m.role || '—' }})</v-chip
          ><span v-if="!item.memberships || !item.memberships.length" class="text-medium-emphasis">—</span></template
        >
        <template #roles="{ item }"
          ><v-chip
            v-for="(role, index) in item.roles || []"
            :key="index"
            size="small"
            variant="tonal"
            :color="roleColor(role)"
            class="mr-1 text-capitalize"
            >{{ role }}</v-chip
          ><span v-if="!item.roles || !item.roles.length" class="text-medium-emphasis">—</span></template
        >
        <template #actions="{ item }"
          ><v-menu location="bottom end"
            ><template #activator="{ props }"
              ><v-btn v-bind="props" icon variant="text" size="small" class="mr-1"
                ><v-icon icon="fa-solid fa-user-pen" size="small"></v-icon></v-btn></template
            ><v-list density="compact" min-width="160" :class="config.vuetify.theme.rounded"
              ><v-list-subheader class="text-label-small">APP ROLES</v-list-subheader
              ><v-list-item
                v-for="role in config.whitelists.users.roles"
                :key="role"
                :active="(item.roles || []).includes(role)"
                @click="toggleUserRole(item, role)"
                ><v-list-item-title class="text-body-medium text-capitalize">{{ role }}</v-list-item-title></v-list-item
              ></v-list
            ></v-menu
          ><v-btn icon variant="text" size="small" color="error" @click="openDeleteDialog(item)"
            ><v-icon icon="fa-solid fa-trash" size="small"></v-icon></v-btn
        ></template>
      </coreDataTableComponent>
    </div>
    <v-dialog v-model="deleteDialog.show" max-width="440"
      ><v-card :class="config.vuetify.theme.rounded" class="pa-4"
        ><v-card-title class="text-title-large font-weight-medium">Delete this user?</v-card-title
        ><v-card-text class="text-body-medium"
          >Are you sure you want to delete <strong>{{ deleteDialog.userName }}</strong
          >? This action cannot be undone.</v-card-text
        ><v-card-actions
          ><v-spacer></v-spacer><v-btn variant="text" class="text-none text-body-medium" @click="deleteDialog.show = false">Cancel</v-btn
          ><v-btn color="error" variant="flat" :class="config.vuetify.theme.rounded" class="text-none text-body-medium" @click="confirmDeleteUser"
            >Delete</v-btn
          ></v-card-actions
        ></v-card
      ></v-dialog
    >
  </v-container>
</template>
<script>
/**
 * Module dependencies.
 */
import { useAdminStore } from '../stores/admin.store';
import roleColor from '../../../lib/helpers/roleColor';
import orgColor from '../../../lib/helpers/orgColor';
import coreDataTableComponent from '../../core/components/core.datatable.component.vue';

/**
 * Component definition.
 *
 * Users tab of the admin section — renders the users table, role menu and
 * deletion dialog. Mounted as a routed child of `admin.layout.vue` at
 * `/admin/users`.
 */
export default {
  name: 'AdminUsers',
  components: {
    coreDataTableComponent,
  },
  data() {
    return {
      deleteDialog: { show: false, userId: null, userName: '' },
      userHeaders: [
        { text: 'Avatar', value: 'avatar', kind: 'avatar' },
        { text: 'Name', value: 'name', kind: 'slot', slotName: 'name' },
        { text: 'Email', value: 'email', kind: 'email' },
        { text: 'Organizations', value: 'memberships', kind: 'slot', slotName: 'organizations' },
        { text: 'App Roles', value: 'roles', kind: 'slot', slotName: 'roles' },
        { text: 'Joined', value: 'createdAt', kind: 'date', format: 'DD/MM/YY' },
        { text: 'Last Login', value: 'lastLoginAt', kind: 'date', format: 'DD/MM/YY HH:mm' },
        { text: 'Actions', value: 'actions', kind: 'slot', slotName: 'actions' },
      ],
    };
  },
  computed: {
    users() {
      return useAdminStore().users;
    },
  },
  methods: {
    roleColor,
    orgColor,
    /**
     * @desc Check whether a membership matches the user's active organization.
     * @param {object} user - The user record.
     * @param {object} membership - One of `user.memberships`.
     * @returns {boolean}
     */
    isUserActiveOrg(user, membership) {
      const currentOrg = user.currentOrganization?._id || user.currentOrganization?.id || user.currentOrganization;
      const orgId = membership.organizationId?._id || membership.organizationId?.id || membership.organizationId;
      return currentOrg && orgId && String(currentOrg) === String(orgId);
    },
    /**
     * @desc Fetch the users list from the admin store.
     * @param {object} [params] - Optional query params forwarded to the store.
     * @returns {Promise<void>}
     */
    async fetchUsers(params) {
      await useAdminStore().getUsers(params);
    },
    /**
     * @desc Toggle an app-level role on a user and refresh the list.
     * @param {object} item - The user record.
     * @param {string} role - Role to toggle.
     * @returns {Promise<void>}
     */
    async toggleUserRole(item, role) {
      const adminStore = useAdminStore();
      const currentRoles = item.roles || [];
      const newRoles = currentRoles.includes(role) ? currentRoles.filter((r) => r !== role) : [...currentRoles, role];
      await adminStore.updateUser({ id: item.id || item._id }, { roles: newRoles });
      await this.fetchUsers();
    },
    /**
     * @desc Open the deletion confirmation dialog for the given user.
     * @param {object} item - The user record.
     */
    openDeleteDialog(item) {
      this.deleteDialog = {
        show: true,
        userId: item.id || item._id,
        userName: ((item.firstName || '') + ' ' + (item.lastName || '')).trim() || item.email,
      };
    },
    /**
     * @desc Confirm and execute deletion of the currently targeted user.
     * @returns {Promise<void>}
     */
    async confirmDeleteUser() {
      await useAdminStore().deleteUser({ id: this.deleteDialog.userId });
      this.deleteDialog.show = false;
      await this.fetchUsers();
    },
  },
};
</script>
