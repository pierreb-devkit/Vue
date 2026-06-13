<template>
  <v-container fluid>
    <v-row class="pa-2 mt-0">
      <v-col cols="12">
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
        <v-card v-else width="100%" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
    <v-card-title class="d-flex align-center ga-3">
      <span class="text-title-medium">Activity</span>
      <v-spacer></v-spacer>
      <v-btn
        v-if="activityFilterAction || activityFilterUserId"
        color="primary"
        variant="tonal"
        size="small"
        :class="config.vuetify.theme.rounded"
        class="text-none text-body-medium"
        @click="clearActivityFilters"
      >
        <v-icon icon="fa-solid fa-xmark" size="small" class="mr-2"></v-icon>
        Clear
      </v-btn>
      <v-text-field
        v-model="activityFilterAction"
        placeholder="Filter by action"
        hide-details
        density="compact"
        variant="outlined"
        prepend-inner-icon="fa-solid fa-magnifying-glass"
        max-width="280"
        :class="config.vuetify.theme.rounded"
      ></v-text-field>
      <v-text-field
        v-model="activityFilterUserId"
        placeholder="Filter by user ID"
        hide-details
        density="compact"
        variant="outlined"
        prepend-inner-icon="fa-solid fa-user"
        max-width="280"
        :error="!activityUserIdValid"
        :class="config.vuetify.theme.rounded"
      ></v-text-field>
    </v-card-title>
    <v-progress-linear :active="activityLoading" indeterminate color="primary"></v-progress-linear>
    <v-table v-if="!activityLoading && auditLogs.length" fixed-header hover>
      <thead>
        <tr>
          <th class="text-left text-label-medium">Date</th>
          <th class="text-left text-label-medium">Action</th>
          <th class="text-left text-label-medium">User</th>
          <th class="text-left text-label-medium">Target</th>
          <th class="text-left text-label-medium">IP</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="item in auditLogs" :key="item._id || item.id">
          <tr
            tabindex="0"
            role="button"
            :aria-expanded="activityExpandedId === (item._id || item.id) ? 'true' : 'false'"
            class="cursor-pointer"
            @click="toggleActivityExpand(item._id || item.id)"
            @keydown.enter.prevent="toggleActivityExpand(item._id || item.id)"
            @keydown.space.prevent="toggleActivityExpand(item._id || item.id)"
          >
            <td class="text-body-medium">{{ formatActivityDate(item.createdAt) }}</td>
            <td>
              <v-chip size="small" variant="tonal" color="primary">{{ item.action }}</v-chip>
            </td>
            <td class="text-body-medium">{{ item.userId || '—' }}</td>
            <td class="text-body-medium">
              <span v-if="item.targetType">
                {{ item.targetType }}<span v-if="item.targetId">:{{ item.targetId }}</span>
              </span>
              <span v-else class="text-medium-emphasis">—</span>
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
                <span class="text-label-small text-medium-emphasis">User Agent: </span>
                <span class="text-body-small">{{ item.userAgent }}</span>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </v-table>
    <div v-if="!activityLoading && !auditLogs.length" class="pa-4 text-medium-emphasis text-body-medium">No audit logs found.</div>
    <v-card-actions class="d-flex align-center justify-end ga-2">
      <span class="text-body-small text-medium-emphasis mr-2">Per page</span>
      <v-select
        v-model="activityPerPage"
        :items="[10, 20, 50, 100]"
        density="compact"
        variant="outlined"
        hide-details
        max-width="100"
        :class="config.vuetify.theme.rounded"
      ></v-select>
      <v-btn :disabled="activityPage <= 1" variant="text" icon size="small" @click="activityPrevPage">
        <v-icon icon="fa-solid fa-angle-left" size="small"></v-icon>
      </v-btn>
      <span class="text-body-medium">{{ activityPage }}</span>
      <v-btn :disabled="!activityHasNextPage" variant="text" icon size="small" @click="activityNextPage">
        <v-icon icon="fa-solid fa-angle-right" size="small"></v-icon>
      </v-btn>
    </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
/**
 * Module dependencies.
 */
import dayjs from 'dayjs';
import { debounce } from 'lodash-es';
import { useAdminStore } from '../stores/admin.store';

/**
 * Mongo ObjectId shape — GET /audit rejects malformed `userId` values with
 * a 400, so the user-ID filter is gated client-side until it is complete.
 */
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

/**
 * Component definition.
 *
 * Activity tab of the admin section — renders the audit-log table with
 * card-title filters (debounced 1000ms, mirroring the search field of
 * `core.datatable.component.vue`) and auditTotal-based pagination. Fetches
 * on `mounted()` since it is a routed view (no parent tab model to watch).
 * Mounted as a routed child of `admin.layout.vue` at `/admin/activity`.
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
      // Snapshot of the last APPLIED filter pair — lets the trailing
      // debounce no-op when nothing changed (e.g. right after Clear
      // already fetched with the reset values).
      activityAppliedFilters: JSON.stringify(['', '']),
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
    /**
     * @desc Whether the user-ID filter is empty or a complete Mongo
     *       ObjectId. The backend 400s on malformed userId values, so
     *       debounced fetches are gated on this while the user types.
     * @returns {boolean}
     */
    activityUserIdValid() {
      return !this.activityFilterUserId || OBJECT_ID_REGEX.test(this.activityFilterUserId);
    },
  },
  watch: {
    activityPerPage() {
      this.activityPage = 1;
      this.fetchActivityLogs();
    },
  },
  created() {
    // Mirror core.datatable.component.vue's search wiring: a 1000ms
    // debounced watcher replaces the old enter-key + Search-button flow.
    // Stored on the instance (non-reactive) so it can be cancelled.
    this.debouncedApplyFilters = debounce(() => {
      this.applyActivityFilters();
    }, 1000);
    this.$watch('activityFilterAction', this.debouncedApplyFilters);
    this.$watch('activityFilterUserId', this.debouncedApplyFilters);
  },
  mounted() {
    if (!(this.config?.audit && this.config.audit.enabled === false)) {
      this.fetchActivityLogs();
    }
  },
  beforeUnmount() {
    this.debouncedApplyFilters.cancel();
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
     * @desc Fetch audit logs from the store with current filters and
     *       pagination. The userId param is only sent when it is a valid
     *       ObjectId (backend 400s otherwise). Loading flag is always
     *       cleared, even if the store action rejects, so the progress bar
     *       does not stay pinned on failure.
     * @returns {Promise<void>}
     */
    async fetchActivityLogs() {
      this.activityLoading = true;
      try {
        await useAdminStore().getAuditLogs({
          action: this.activityFilterAction || undefined,
          userId: this.activityUserIdValid ? this.activityFilterUserId || undefined : undefined,
          page: this.activityPage,
          perPage: this.activityPerPage,
        });
      } finally {
        this.activityLoading = false;
      }
    },
    /**
     * @desc Apply activity filters and reset to page 1. Skips when the
     *       user-ID filter is incomplete, and dedupes against the last
     *       applied pair so the trailing debounce after Clear is a no-op.
     */
    applyActivityFilters() {
      if (!this.activityUserIdValid) return;
      const next = JSON.stringify([this.activityFilterAction, this.activityFilterUserId]);
      if (next === this.activityAppliedFilters) return;
      this.activityAppliedFilters = next;
      this.activityPage = 1;
      this.fetchActivityLogs();
    },
    /** @desc Clear all activity filters, reset to page 1 and refetch. */
    clearActivityFilters() {
      this.activityFilterAction = '';
      this.activityFilterUserId = '';
      this.activityAppliedFilters = JSON.stringify(['', '']);
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
