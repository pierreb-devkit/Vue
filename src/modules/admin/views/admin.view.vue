<template>
  <v-container fluid>
    <PageHeader icon="fa-solid fa-user-tie" title="Admin" />
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      closable
      class="mx-2 mt-2"
      :class="config.vuetify.theme.rounded"
      icon="fa-solid fa-circle-exclamation"
      @click:close="clearError"
      ><span class="text-body-medium">{{ error }}</span></v-alert
    >
    <v-row class="pa-2 mt-0"
      ><v-col cols="12">
        <v-card color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
          <v-tabs v-model="tab" color="primary">
            <v-tab value="users" class="text-none text-body-medium"><v-icon icon="fa-solid fa-users" size="small" class="mr-2"></v-icon>Users</v-tab>
            <v-tab value="organizations" class="text-none text-body-medium"
              ><v-icon icon="fa-solid fa-building" size="small" class="mr-2"></v-icon>Organizations</v-tab
            >
            <v-tab value="readiness" class="text-none text-body-medium"
              ><v-icon icon="fa-solid fa-clipboard-check" size="small" class="mr-2"></v-icon>Readiness</v-tab
            >
            <v-tab value="activity" class="text-none text-body-medium"
              ><v-icon icon="fa-solid fa-clock-rotate-left" size="small" class="mr-2"></v-icon>Activity</v-tab
            >
            <v-tab v-for="extraTab in extraTabs" :key="extraTab.value" :to="extraTab.route" class="text-none text-body-medium"
              ><v-icon v-if="extraTab.icon" :icon="extraTab.icon" size="small" class="mr-2"></v-icon>{{ extraTab.label }}</v-tab
            >
          </v-tabs>
          <v-divider></v-divider>
          <v-window v-model="tab">
            <v-window-item value="users"
              ><div class="pa-4">
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
                </coreDataTableComponent></div
            ></v-window-item>
            <v-window-item value="organizations"
              ><div class="pa-4">
                <coreDataTableComponent :headers="orgHeaders" :items="organizations" :fetch-action="fetchOrganizations"
                  ><template #orgName="{ item }"
                    ><router-link
                      :to="'/admin/organizations/' + (item.id || item._id)"
                      class="text-capitalize text-primary text-decoration-none font-weight-medium"
                      >{{ item.name }}</router-link
                    ></template
                  ></coreDataTableComponent
                >
              </div></v-window-item
            >
            <v-window-item value="readiness"
              ><div class="pa-4">
                <v-progress-linear v-if="readinessLoading" indeterminate color="primary" class="mb-4"></v-progress-linear>
                <v-table v-else-if="readiness.length"
                  ><thead>
                    <tr>
                      <th class="text-left text-body-medium">Category</th>
                      <th class="text-left text-body-medium">Status</th>
                      <th class="text-left text-body-medium">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in readiness" :key="item.category">
                      <td class="text-body-medium text-capitalize">{{ item.category }}</td>
                      <td>
                        <v-icon :icon="readinessIcon(item.status)" :color="readinessColor(item.status)" size="small" class="mr-2"></v-icon
                        ><v-chip :color="readinessColor(item.status)" size="small" variant="tonal">{{ item.status }}</v-chip>
                      </td>
                      <td class="text-body-medium">{{ item.message }}</td>
                    </tr>
                  </tbody></v-table
                >
                <div v-else class="text-medium-emphasis text-body-medium">No readiness data available.</div>
              </div></v-window-item
            >
            <!-- Activity tab -->
            <v-window-item value="activity"
              ><div class="pa-4">
                <!-- Audit disabled info state -->
                <v-alert
                  v-if="config.audit && config.audit.enabled === false"
                  type="info"
                  variant="tonal"
                  density="compact"
                  :class="config.vuetify.theme.rounded"
                  icon="fa-solid fa-circle-info"
                >
                  <span class="text-body-medium">Audit logging is disabled. Enable it in configuration to start tracking activity.</span>
                </v-alert>
                <template v-else>
                <div class="d-flex align-center ga-2 flex-wrap mb-4">
                  <v-text-field
                    v-model="activityFilterAction"
                    placeholder="Filter by action"
                    hide-details
                    density="compact"
                    variant="outlined"
                    prepend-inner-icon="fa-solid fa-filter"
                    style="max-width: 240px"
                    :class="config.vuetify.theme.rounded"
                    @keyup.enter="applyActivityFilters"
                  ></v-text-field
                  ><v-text-field
                    v-model="activityFilterUserId"
                    placeholder="Filter by user ID"
                    hide-details
                    density="compact"
                    variant="outlined"
                    prepend-inner-icon="fa-solid fa-user"
                    style="max-width: 240px"
                    :class="config.vuetify.theme.rounded"
                    @keyup.enter="applyActivityFilters"
                  ></v-text-field
                  ><v-btn
                    variant="tonal"
                    color="primary"
                    class="text-none text-body-medium"
                    :class="config.vuetify.theme.rounded"
                    @click="applyActivityFilters"
                    ><v-icon icon="fa-solid fa-magnifying-glass" size="small" class="mr-2"></v-icon>Search</v-btn
                  ><v-btn
                    v-if="activityFilterAction || activityFilterUserId"
                    variant="text"
                    class="text-none text-body-medium"
                    @click="clearActivityFilters"
                    >Clear</v-btn
                  >
                </div>
                <v-progress-linear :active="activityLoading" indeterminate color="primary" class="mb-4"></v-progress-linear>
                <v-table v-if="auditLogs.length" fixed-header
                  ><thead>
                    <tr>
                      <th class="text-left text-label-medium">Date</th>
                      <th class="text-left text-label-medium">Action</th>
                      <th class="text-left text-label-medium">User</th>
                      <th class="text-left text-label-medium">Target</th>
                      <th class="text-left text-label-medium">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="item in auditLogs" :key="item._id || item.id"
                      ><tr style="cursor: pointer" @click="toggleActivityExpand(item._id || item.id)">
                        <td class="text-body-medium">{{ formatActivityDate(item.createdAt) }}</td>
                        <td>
                          <v-chip size="small" variant="tonal" color="primary">{{ item.action }}</v-chip>
                        </td>
                        <td class="text-body-medium">{{ item.userId || '—' }}</td>
                        <td class="text-body-medium">
                          <span v-if="item.targetType"
                            >{{ item.targetType }}<span v-if="item.targetId">:{{ item.targetId }}</span></span
                          ><span v-else class="text-medium-emphasis">—</span>
                        </td>
                        <td class="text-body-medium">{{ item.ip || '—' }}</td>
                      </tr>
                      <tr v-if="activityExpandedId === (item._id || item.id)">
                        <td colspan="5" class="bg-surface-variant pa-4">
                          <div class="text-label-small text-medium-emphasis mb-1">Metadata</div>
                          <pre v-if="item.metadata && Object.keys(item.metadata).length" class="text-body-small">{{
                            JSON.stringify(item.metadata, null, 2)
                          }}</pre>
                          <span v-else class="text-body-small text-medium-emphasis">No metadata</span>
                          <div v-if="item.userAgent" class="mt-2">
                            <span class="text-label-small text-medium-emphasis">User Agent: </span
                            ><span class="text-body-small">{{ item.userAgent }}</span>
                          </div>
                        </td>
                      </tr></template
                    >
                  </tbody></v-table
                >
                <div v-if="!activityLoading && !auditLogs.length" class="text-medium-emphasis text-body-medium">No audit logs found.</div>
                <div class="d-flex align-center justify-end mt-4 ga-2">
                  <span class="text-body-small text-medium-emphasis mr-2">Per page</span
                  ><v-select
                    v-model="activityPerPage"
                    :items="[10, 20, 50, 100]"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="max-width: 100px"
                    :class="config.vuetify.theme.rounded"
                  ></v-select
                  ><v-btn :disabled="activityPage <= 1" variant="text" icon size="small" @click="activityPrevPage"
                    ><v-icon icon="fa-solid fa-angle-left" size="small"></v-icon></v-btn
                  ><span class="text-body-medium">{{ activityPage }}</span
                  ><v-btn :disabled="!activityHasNextPage" variant="text" icon size="small" @click="activityNextPage"
                    ><v-icon icon="fa-solid fa-angle-right" size="small"></v-icon
                  ></v-btn>
                </div>
                </template></div
            ></v-window-item>
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
          ><span class="text-body-medium"
            >No mailer configured. Users can register with any email without verification. Set up SMTP to enable email verification.</span
          ></v-alert
        >
      </v-col></v-row
    >
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
import dayjs from 'dayjs';
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
      readinessLoading: false,
      deleteDialog: { show: false, userId: null, userName: '' },
      activityLoading: false,
      activityPage: 1,
      activityPerPage: 20,
      activityFilterAction: '',
      activityFilterUserId: '',
      activityExpandedId: null,
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
     * @desc Returns validated extra admin tabs from config.admin.tabs.
     * @returns {Array} Each entry: { value, label, icon?, route }
     */
    extraTabs() {
      const tabs = this.config?.admin?.tabs;
      if (!Array.isArray(tabs)) return [];
      return tabs.filter((tab) => {
        if (!tab || typeof tab !== 'object' || !tab.value || !tab.label || !tab.route) return false;
        const isValidRoute = typeof tab.route === 'string' && tab.route.startsWith('/admin/');
        if (!isValidRoute && import.meta.env.MODE !== 'production') {
          console.warn('[admin] Invalid tab route filtered: "' + tab.route + '"');
        }
        return isValidRoute;
      });
    },
    error() {
      return useAdminStore().error;
    },
    users() {
      return useAdminStore().users;
    },
    organizations() {
      return useAdminStore().organizations;
    },
    readiness() {
      return useAdminStore().readiness;
    },
    auditLogs() {
      return useAdminStore().auditLogs;
    },
    auditTotal() {
      return useAdminStore().auditTotal;
    },
    /**
     * @desc Whether there are more pages of audit logs to fetch.
     * @returns {boolean}
     */
    activityHasNextPage() {
      return this.activityPage * this.activityPerPage < this.auditTotal;
    },
    /**
     * @desc Whether to show the mailer warning in admin panel.
     * @returns {boolean}
     */
    showMailerWarning() {
      return useAuthStore().serverConfig?.mail?.configured === false;
    },
  },
  watch: {
    tab(val) {
      if (val === 'readiness') this.fetchReadiness();
      if (val === 'activity') this.fetchActivityLogs();
    },
    activityPerPage() {
      this.activityPage = 1;
      this.fetchActivityLogs();
    },
  },
  methods: {
    roleColor,
    orgColor,
    clearError() {
      useAdminStore().error = null;
    },
    isUserActiveOrg(user, membership) {
      const currentOrg = user.currentOrganization?._id || user.currentOrganization?.id || user.currentOrganization;
      const orgId = membership.organizationId?._id || membership.organizationId?.id || membership.organizationId;
      return currentOrg && orgId && String(currentOrg) === String(orgId);
    },
    /**
     * @desc Map readiness status to icon name.
     * @param {string} status - ok, warning, or error
     * @returns {string} FontAwesome icon class
     */
    readinessIcon(status) {
      if (status === 'ok') return 'fa-solid fa-circle-check';
      if (status === 'error') return 'fa-solid fa-circle-xmark';
      return 'fa-solid fa-triangle-exclamation';
    },
    /**
     * @desc Map readiness status to color.
     * @param {string} status - ok, warning, or error
     * @returns {string} Vuetify color name
     */
    readinessColor(status) {
      if (status === 'ok') return 'success';
      if (status === 'error') return 'error';
      return 'warning';
    },
    /**
     * @desc Fetch readiness data from admin store.
     * @returns {Promise<void>}
     */
    async fetchReadiness() {
      this.readinessLoading = true;
      await useAdminStore().getReadiness();
      this.readinessLoading = false;
    },
    async fetchUsers(params) {
      await useAdminStore().getUsers(params);
    },
    async fetchOrganizations(params) {
      await useAdminStore().getOrganizations(params);
    },
    async toggleUserRole(item, role) {
      const adminStore = useAdminStore();
      const currentRoles = item.roles || [];
      const newRoles = currentRoles.includes(role) ? currentRoles.filter((r) => r !== role) : [...currentRoles, role];
      await adminStore.updateUser({ id: item.id || item._id }, { roles: newRoles });
      await this.fetchUsers();
    },
    openDeleteDialog(item) {
      this.deleteDialog = {
        show: true,
        userId: item.id || item._id,
        userName: ((item.firstName || '') + ' ' + (item.lastName || '')).trim() || item.email,
      };
    },
    async confirmDeleteUser() {
      await useAdminStore().deleteUser({ id: this.deleteDialog.userId });
      this.deleteDialog.show = false;
      await this.fetchUsers();
    },
    /**
     * @desc Format an ISO date string for display in the activity table.
     * @param {string|null} date - ISO date string or null
     * @returns {string} Formatted date or em dash
     */
    formatActivityDate(date) {
      if (!date) return '\u2014';
      return dayjs(date).format('DD/MM/YY HH:mm:ss');
    },
    /**
     * @desc Toggle the expanded metadata row for an audit log entry.
     * @param {string} id - The audit log entry ID
     */
    toggleActivityExpand(id) {
      this.activityExpandedId = this.activityExpandedId === id ? null : id;
    },
    /**
     * @desc Fetch audit logs from the store with current filters and pagination.
     * @returns {Promise<void>}
     */
    async fetchActivityLogs() {
      this.activityLoading = true;
      await useAdminStore().getAuditLogs({
        action: this.activityFilterAction || undefined,
        userId: this.activityFilterUserId || undefined,
        page: this.activityPage,
        perPage: this.activityPerPage,
      });
      this.activityLoading = false;
    },
    /** @desc Apply activity filters and reset to page 1. */
    applyActivityFilters() {
      this.activityPage = 1;
      this.fetchActivityLogs();
    },
    /** @desc Clear all activity filters and reset to page 1. */
    clearActivityFilters() {
      this.activityFilterAction = '';
      this.activityFilterUserId = '';
      this.activityPage = 1;
      this.fetchActivityLogs();
    },
    /** @desc Navigate to the previous page of audit logs. */
    activityPrevPage() {
      if (this.activityPage > 1) {
        this.activityPage -= 1;
        this.fetchActivityLogs();
      }
    },
    /** @desc Navigate to the next page of audit logs. */
    activityNextPage() {
      if (this.activityHasNextPage) {
        this.activityPage += 1;
        this.fetchActivityLogs();
      }
    },
  },
};
</script>
