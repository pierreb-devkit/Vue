<template>
  <v-dialog :model-value="modelValue" max-width="960" scrollable @update:model-value="$emit('update:modelValue', $event)">
    <v-card :class="config.vuetify.theme.rounded" class="pa-6">
      <v-card-title class="text-title-large font-weight-medium pa-0 mb-4">
        Webhook Deliveries
      </v-card-title>
      <v-card-text class="pa-0">
        <!-- Empty state -->
        <div v-if="!loading && deliveries.length === 0" class="text-center py-6">
          <v-icon icon="fa-solid fa-inbox" size="x-large" class="mb-4 text-medium-emphasis" />
          <p class="text-body-medium text-medium-emphasis">No deliveries yet.</p>
        </div>

        <!-- Data table -->
        <v-data-table-server
          v-else
          :headers="headers"
          :items="deliveries"
          :items-length="deliveriesTotal"
          :loading="loading"
          :items-per-page="20"
          :items-per-page-options="[10, 20, 50]"
          item-value="_id"
          density="compact"
          show-expand
          @update:options="onOptions"
        >
          <template #[`item.event`]="{ item }">
            <v-chip
              :color="eventColor(item.event)"
              size="small"
              variant="tonal"
            >
              {{ item.event }}
            </v-chip>
          </template>

          <template #[`item.status`]="{ item }">
            <v-chip
              :color="item.succeededAt ? 'success' : 'error'"
              size="small"
              variant="tonal"
            >
              {{ item.succeededAt ? 'Success' : 'Failed' }}
            </v-chip>
          </template>

          <template #[`item.statusCode`]="{ item }">
            <code class="text-body-small">{{ item.statusCode || '—' }}</code>
          </template>

          <template #[`item.duration`]="{ item }">
            <span class="text-body-small">{{ item.duration != null ? `${item.duration}ms` : '—' }}</span>
          </template>

          <template #[`item.attempts`]="{ item }">
            <span class="text-body-small">{{ item.attempts || 0 }}</span>
          </template>

          <template #[`item.createdAt`]="{ item }">
            <span class="text-body-small">{{ formatRelative(item.createdAt) }}</span>
          </template>

          <!-- Expandable row for payload/response details -->
          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="pa-4 bg-grey-lighten-5">
                <div class="d-flex flex-column flex-sm-row ga-4">
                  <div class="flex-1">
                    <span class="text-body-small font-weight-medium d-block mb-1">Request Payload</span>
                    <pre class="text-body-small pa-2 bg-grey-lighten-4 rounded overflow-auto" style="max-height: 200px; font-family: monospace">{{ formatJson(item.payload) }}</pre>
                  </div>
                  <div class="flex-1">
                    <span class="text-body-small font-weight-medium d-block mb-1">Response</span>
                    <pre class="text-body-small pa-2 bg-grey-lighten-4 rounded overflow-auto" style="max-height: 200px; font-family: monospace">{{ formatJson(item.response) }}</pre>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table-server>
      </v-card-text>
      <v-card-actions class="pa-0 mt-4">
        <v-spacer />
        <v-btn
          variant="outlined"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium"
          @click="$emit('update:modelValue', false)"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import config from '../../../lib/services/config';
import { eventColor } from '../config/developers.config';

export default {
  name: 'DevelopersWebhookDeliveriesComponent',
  props: {
    modelValue: { type: Boolean, default: false },
    deliveries: { type: Array, default: () => [] },
    deliveriesTotal: { type: Number, default: 0 },
    loading: { type: Boolean, default: false },
  },
  emits: ['update:modelValue', 'update:options'],
  data() {
    return {
      config,
    };
  },
  computed: {
    /**
     * @desc Table header definitions for deliveries.
     * @returns {Array}
     */
    headers() {
      return [
        { title: 'Event', key: 'event', sortable: false },
        { title: 'Status', key: 'status', sortable: false },
        { title: 'Code', key: 'statusCode', sortable: false },
        { title: 'Duration', key: 'duration', sortable: false },
        { title: 'Attempts', key: 'attempts', sortable: false },
        { title: 'Timestamp', key: 'createdAt', sortable: false },
      ];
    },
  },
  methods: {
    eventColor,

    /**
     * @desc Format a date as a relative time string.
     * @param {string} date - ISO date string
     * @returns {string} Relative time (e.g. "2h ago")
     */
    formatRelative(date) {
      if (!date) return '';
      const diff = Date.now() - new Date(date).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;
      return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },

    /**
     * @desc Pretty-print JSON data for display.
     * @param {*} data - JSON-serializable data
     * @returns {string} Formatted JSON string
     */
    formatJson(data) {
      if (data == null) return '—';
      try {
        return JSON.stringify(data, null, 2);
      } catch {
        return String(data);
      }
    },

    /**
     * @desc Forward table options changes to parent.
     * @param {Object} options - Table options ({ page, itemsPerPage })
     */
    onOptions(options) {
      this.$emit('update:options', options);
    },
  },
};
</script>
