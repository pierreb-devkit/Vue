<template>
  <v-container fluid class="pa-0">
    <div class="pa-4">
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
      </template>
    </div>
  </v-container>
</template>
<script>
/**
 * Module dependencies.
 */
import dayjs from 'dayjs';
import { useAdminStore } from '../stores/admin.store';

/**
 * Component definition.
 *
 * Activity tab of the admin section — renders the audit-log table with
 * filters and pagination. Fetches on `mounted()` since it is now a routed
 * view (no parent tab model to watch). Mounted as a routed child of
 * `admin.layout.vue` at `/admin/activity`.
 */
export default {
  name: 'AdminActivity',
  data() {
    return {
      activityLoading: false,
      activityPage: 1,
      activityPerPage: 20,
      activityFilterAction: '',
      activityFilterUserId: '',
      activityExpandedId: null,
    };
  },
  computed: {
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
  },
  watch: {
    activityPerPage() {
      this.activityPage = 1;
      this.fetchActivityLogs();
    },
  },
  mounted() {
    if (!(this.config?.audit && this.config.audit.enabled === false)) {
      this.fetchActivityLogs();
    }
  },
  methods: {
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
