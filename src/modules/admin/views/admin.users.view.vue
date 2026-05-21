<template>
  <coreDataTableComponent :headers="userHeaders" :items="users" :fetch-action="fetchUsers">
      <template #name="{ item }"
        ><router-link
          :to="'/admin/users/' + (item.id || item._id)"
          class="text-capitalize text-primary text-decoration-none font-weight-medium"
          >{{ item.firstName }} {{ item.lastName }}</router-link
        ></template
      >
      <template #organizations="{ item }"
        ><template v-for="m in item.memberships || []" :key="m._id || m.id"
          ><v-chip
            size="small"
            :variant="isUserActiveOrg(item, m) ? 'flat' : 'tonal'"
            :color="orgColor(m.organizationId)"
            class="mr-1 text-capitalize"
            :style="membershipOrgId(m) ? 'cursor: pointer' : ''"
            @click="navigateToMembershipOrg(m)"
            >{{ (m.organizationId && m.organizationId.name) || '—' }} ({{ m.role || '—' }})</v-chip
          ></template
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
    <coreConfirmDialog
      v-model="deleteDialog.show"
      title="Delete this user?"
      :message="`Are you sure you want to delete ${deleteDialog.userName}? This action cannot be undone.`"
      confirm-label="Delete"
      confirm-color="error"
      @confirm="confirmDeleteUser"
    />
</template>
<script>
/**
 * Module dependencies.
 */
import { useAdminStore } from '../stores/admin.store';
import roleColor from '../../../lib/helpers/roleColor';
import orgColor from '../../../lib/helpers/orgColor';
import coreDataTableComponent from '../../core/components/core.datatable.component.vue';
import coreConfirmDialog from '../../core/components/core.confirmDialog.component.vue';

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
    coreConfirmDialog,
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
     * @desc Extract a usable organization id from a membership entry.
     * @param {object} membership - A membership record from `user.memberships`.
     * @returns {string|null} The id or `null` when unavailable.
     */
    membershipOrgId(membership) {
      const raw = membership?.organizationId;
      if (!raw) return null;
      const id = raw._id || raw.id;
      return id ? String(id) : null;
    },
    /**
     * @desc Navigate to the organization detail page for a membership, if
     *       the organization id is available. No-op otherwise so we never
     *       push `/admin/organizations/undefined`.
     * @param {object} membership - A membership record from `user.memberships`.
     */
    navigateToMembershipOrg(membership) {
      const id = this.membershipOrgId(membership);
      if (!id) return;
      this.$router.push(`/admin/organizations/${id}`);
    },
    /**
     * @desc Fetch the users list from the admin store.
     *       `coreDataTableComponent` forwards a pagination query-string
     *       (e.g. `'0&5&search'`) that the store interpolates into the
     *       request URL.
     * @param {string} [pageRequest] - Optional pagination query-string segment.
     * @returns {Promise<void>}
     */
    async fetchUsers(pageRequest) {
      await useAdminStore().getUsers(pageRequest);
    },
    /**
     * @desc Toggle an app-level role on a user and refresh the list.
     *       Errors are swallowed locally — the admin store already records
     *       failure state via its `error` banner, and we must not leak an
     *       unhandled rejection out of the click handler.
     * @param {object} item - The user record.
     * @param {string} role - Role to toggle.
     * @returns {Promise<void>}
     */
    async toggleUserRole(item, role) {
      const adminStore = useAdminStore();
      const currentRoles = item.roles || [];
      const newRoles = currentRoles.includes(role) ? currentRoles.filter((r) => r !== role) : [...currentRoles, role];
      try {
        await adminStore.updateUser({ id: item.id || item._id }, { roles: newRoles });
        await this.fetchUsers();
      } catch {
        // Admin store surfaces the error via its banner; avoid unhandled rejection.
      }
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
     *       On failure the dialog stays open and the admin store surfaces
     *       the error via its banner — we intentionally catch to avoid an
     *       unhandled promise rejection from the click handler.
     * @returns {Promise<void>}
     */
    async confirmDeleteUser() {
      try {
        await useAdminStore().deleteUser({ id: this.deleteDialog.userId });
        this.deleteDialog.show = false;
        await this.fetchUsers();
      } catch {
        // Keep the dialog open so the user can retry; banner shows the error.
      }
    },
  },
};
</script>
