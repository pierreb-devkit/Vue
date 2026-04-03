<template>
  <v-container fluid>
    <PageHeader icon="fa-solid fa-user-tie" title="Admin" />
    <v-row class="pa-2 mt-0">
      <v-col cols="12">
        <v-card color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
          <v-tabs v-model="tab" color="primary">
            <v-tab value="users" class="text-none text-body-medium">
              <v-icon icon="fa-solid fa-users" size="small" class="mr-2"></v-icon>
              Users
            </v-tab>
            <v-tab value="organizations" class="text-none text-body-medium">
              <v-icon icon="fa-solid fa-building" size="small" class="mr-2"></v-icon>
              Organizations
            </v-tab>
            <v-tab
              v-for="extraTab in extraTabs"
              :key="extraTab.value"
              :value="extraTab.value"
              :to="extraTab.route"
              class="text-none text-body-medium"
            >
              <v-icon v-if="extraTab.icon" :icon="extraTab.icon" size="small" class="mr-2"></v-icon>
              {{ extraTab.label }}
            </v-tab>
          </v-tabs>
          <v-divider></v-divider>
          <v-window v-model="tab">
            <!-- Users tab -->
            <v-window-item value="users">
              <div class="pa-4">
                <coreDataTableComponent :headers="userHeaders" :items="users" :fetch-action="fetchUsers">
                  <template #name="{ item }">
                    <router-link :to="`/admin/users/${item.id || item._id}`" class="text-capitalize text-primary text-decoration-none font-weight-medium">
                      {{ item.firstName }} {{ item.lastName }}
                    </router-link>
                  </template>
                  <template #organizations="{ item }">
                    <v-chip
                      v-for="m in (item.memberships || [])"
                      :key="m._id || m.id"
                      size="small"
                      :variant="isUserActiveOrg(item, m) ? 'flat' : 'tonal'"
                      :color="orgColor(m.organizationId)"
                      class="mr-1 text-capitalize"
                      style="cursor: pointer"
                      @click="$router.push(`/admin/organizations/${m.organizationId?._id || m.organizationId?.id}`)"
                    >
                      {{ (m.organizationId && m.organizationId.name) || '—' }} ({{ m.role || '—' }})
                    </v-chip>
                    <span v-if="!item.memberships || !item.memberships.length" class="text-medium-emphasis">—</span>
                  </template>
                  <template #roles="{ item }">
                    <v-chip v-for="(role, index) in (item.roles || [])" :key="index" size="small" variant="tonal" :color="roleColor(role)" class="mr-1 text-capitalize">
                      {{ role }}
                    </v-chip>
                    <span v-if="!item.roles || !item.roles.length" class="text-medium-emphasis">—</span>
                  </template>
                  <template #actions="{ item }">
                    <v-menu location="bottom end">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" size="small" class="mr-1">
                          <v-icon icon="fa-solid fa-user-pen" size="small"></v-icon>
                        </v-btn>
                      </template>
                      <v-list density="compact" min-width="160" :class="config.vuetify.theme.rounded">
                        <v-list-subheader class="text-label-small">APP ROLES</v-list-subheader>
                        <v-list-item
                          v-for="role in config.whitelists.users.roles"
                          :key="role"
                          :active="(item.roles || []).includes(role)"
                          @click="toggleUserRole(item, role)"
                        >
                          <v-list-item-title class="text-body-medium text-capitalize">{{ role }}</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                    <v-btn icon variant="text" size="small" color="error" @click="openDeleteDialog(item)">
                      <v-icon icon="fa-solid fa-trash" size="small"></v-icon>
                    </v-btn>
                  </template>
                </coreDataTableComponent>
              </div>
            </v-window-item>
            <!-- Organizations tab -->
            <v-window-item value="organizations">
              <div class="pa-4">
                <coreDataTableComponent :headers="orgHeaders" :items="organizations" :fetch-action="fetchOrganizations">
                  <template #orgName="{ item }">
                    <router-link :to="`/admin/organizations/${item.id || item._id}`" class="text-capitalize text-primary text-decoration-none font-weight-medium">
                      {{ item.name }}
                    </router-link>
                  </template>
                </coreDataTableComponent>
              </div>
            </v-window-item>
          </v-window>
        </v-card>
        <v-alert
          v-if="showMailerWarning"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-4"
          :class="config.vuetify.theme.rounded"
          icon="fa-solid fa-triangle-exclamation"
        >
          <span class="text-body-medium">No mailer configured. Users can register with any email without verification. Set up SMTP to enable email verification.</span>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Delete user confirmation dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="440">
      <v-card :class="config.vuetify.theme.rounded" class="pa-4">
        <v-card-title class="text-title-large font-weight-medium">Delete this user?</v-card-title>
        <v-card-text class="text-body-medium">
          Are you sure you want to delete <strong>{{ deleteDialog.userName }}</strong>? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" class="text-none text-body-medium" @click="deleteDialog.show = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :class="config.vuetify.theme.rounded" class="text-none text-body-medium" @click="confirmDeleteUser">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useAdminStore } from '../stores/admin.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import roleColor from '../../../lib/helpers/roleColor';
import orgColor from '../../../lib/helpers/orgColor';
import coreDataTableComponent from '../../core/components/core.datatable.component.vue';
import PageHeader from '../../core/components/core.pageHeader.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'AdminView',
  components: {
    coreDataTableComponent,
    PageHeader,
  },
  data() {
    return {
      tab: 'users',
      deleteDialog: {
        show: false,
        userId: null,
        userName: '',
      },
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
      orgHeaders: [
        { text: 'Name', value: 'name', kind: 'slot', slotName: 'orgName' },
        { text: 'Members', value: 'memberCount', kind: 'text' },
        { text: 'Domain', value: 'domain', kind: 'text' },
        { text: 'Plan', value: 'plan', kind: 'text' },
        { text: 'Created', value: 'createdAt', kind: 'date', format: 'DD/MM/YY' },
      ],
    };
  },
  computed: {
    /**
     * @desc Extra admin tabs from config.admin.tabs array.
     * Each entry: { value, label, icon?, route }
     * @returns {Array}
     */
    extraTabs() {
      return this.config?.admin?.tabs || [];
    },
    users() {
      const adminStore = useAdminStore();
      return adminStore.users;
    },
    organizations() {
      const adminStore = useAdminStore();
      return adminStore.organizations;
    },
    /**
     * @desc Whether to show the mailer warning in admin panel.
     * @returns {boolean}
     */
    showMailerWarning() {
      const authStore = useAuthStore();
      return authStore.serverConfig?.mail?.configured === false;
    },
  },
  methods: {
    roleColor,
    orgColor,
    isUserActiveOrg(user, membership) {
      const currentOrg = user.currentOrganization?._id || user.currentOrganization?.id || user.currentOrganization;
      const orgId = membership.organizationId?._id || membership.organizationId?.id || membership.organizationId;
      return currentOrg && orgId && String(currentOrg) === String(orgId);
    },
    async fetchUsers(params) {
      const adminStore = useAdminStore();
      await adminStore.getUsers(params);
    },
    async fetchOrganizations(params) {
      const adminStore = useAdminStore();
      await adminStore.getOrganizations(params);
    },
    async toggleUserRole(item, role) {
      const adminStore = useAdminStore();
      const currentRoles = item.roles || [];
      const newRoles = currentRoles.includes(role)
        ? currentRoles.filter((r) => r !== role)
        : [...currentRoles, role];
      await adminStore.updateUser({ id: item.id || item._id }, { roles: newRoles });
      await this.fetchUsers();
    },
    openDeleteDialog(item) {
      this.deleteDialog = {
        show: true,
        userId: item.id || item._id,
        userName: `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email,
      };
    },
    async confirmDeleteUser() {
      const adminStore = useAdminStore();
      await adminStore.deleteUser({ id: this.deleteDialog.userId });
      this.deleteDialog.show = false;
      await this.fetchUsers();
    },
  },
};
</script>
