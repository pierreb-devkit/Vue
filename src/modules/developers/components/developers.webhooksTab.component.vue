<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <span class="text-title-medium font-weight-medium">Your Webhooks</span>
      <v-btn
        color="primary"
        variant="flat"
        :class="config.vuetify.theme.rounded"
        class="text-none text-body-medium"
        @click="$emit('create')"
      >
        Create Webhook
      </v-btn>
    </div>

    <!-- Empty state -->
    <v-card v-if="!loading && webhooks.length === 0" :class="config.vuetify.theme.rounded" class="pa-6 text-center">
      <v-icon icon="fa-solid fa-globe" size="x-large" color="primary" class="mb-4 text-medium-emphasis" />
      <h2 class="text-title-large font-weight-medium mb-2">No webhooks yet</h2>
      <p class="text-body-medium text-medium-emphasis">
        Create one to receive event notifications.
      </p>
    </v-card>

    <!-- Data table -->
    <v-card v-else :class="config.vuetify.theme.rounded">
      <v-data-table-server
        :headers="headers"
        :items="webhooks"
        :items-length="webhooksTotal"
        :loading="loading"
        :items-per-page="20"
        :items-per-page-options="[10, 20, 50]"
        item-value="_id"
        @update:options="onOptions"
        @click:row="onRowClick"
      >
        <template #[`item.url`]="{ item }">
          <code class="text-body-small">{{ truncateUrl(item.url) }}</code>
        </template>

        <template #[`item.events`]="{ item }">
          <v-chip
            v-for="event in (item.events || [])"
            :key="event"
            :color="eventColor(event)"
            size="small"
            variant="tonal"
            class="mr-1"
          >
            {{ event }}
          </v-chip>
          <span v-if="!item.events || !item.events.length" class="text-body-small text-medium-emphasis">
            None
          </span>
        </template>

        <template #[`item.active`]="{ item }">
          <v-chip
            :color="item.active ? 'success' : 'error'"
            size="small"
            variant="tonal"
          >
            {{ item.active ? 'Active' : 'Inactive' }}
          </v-chip>
        </template>

        <template #[`item.createdAt`]="{ item }">
          <span class="text-body-small">{{ formatDate(item.createdAt) }}</span>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="d-flex align-center justify-end ga-1">
            <v-btn
              icon
              variant="text"
              size="small"
              @click.stop="$emit('edit', item)"
            >
              <v-icon icon="fa-solid fa-pen" size="small" />
              <v-tooltip activator="parent" location="top">Edit</v-tooltip>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              :loading="testingId === (item.id || item._id)"
              @click.stop="testPing(item)"
            >
              <v-icon icon="fa-solid fa-satellite-dish" size="small" />
              <v-tooltip activator="parent" location="top">Test Ping</v-tooltip>
            </v-btn>
            <v-btn
              icon
              variant="text"
              color="error"
              size="small"
              @click.stop="confirmDelete(item)"
            >
              <v-icon icon="fa-solid fa-trash" size="small" />
              <v-tooltip activator="parent" location="top">Delete</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="440">
      <v-card :class="config.vuetify.theme.rounded" class="pa-6">
        <v-card-title class="text-title-large font-weight-medium pa-0 mb-2">
          Delete Webhook
        </v-card-title>
        <v-card-text class="pa-0 mb-4 text-body-medium">
          Are you sure you want to delete the webhook for
          <strong>{{ truncateUrl(deleteTarget?.url || '') }}</strong>?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions class="pa-0">
          <v-spacer />
          <v-btn
            variant="outlined"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            @click="executeDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for test ping result -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script>
import { useDisplay } from 'vuetify';
import config from '../../../lib/services/config';
import { eventColor } from '../config/developers.config';

export default {
  name: 'DevelopersWebhooksTab',
  props: {
    webhooks: { type: Array, default: () => [] },
    webhooksTotal: { type: Number, default: 0 },
    loading: { type: Boolean, default: false },
  },
  emits: ['create', 'edit', 'delete', 'test', 'deliveries', 'update:options'],
  data() {
    return {
      config,
      showDeleteDialog: false,
      deleteTarget: null,
      testingId: null,
      showSnackbar: false,
      snackbarText: '',
      snackbarColor: 'success',
    };
  },
  computed: {
    /**
     * @desc Build responsive table headers.
     * @returns {Array} Table header definitions
     */
    headers() {
      const { smAndDown } = useDisplay();
      const base = [
        { title: 'URL', key: 'url', sortable: false },
        { title: 'Events', key: 'events', sortable: false },
        { title: 'Status', key: 'active', sortable: false },
      ];
      if (!smAndDown.value) {
        base.push({ title: 'Created', key: 'createdAt', sortable: false });
      }
      base.push({ title: '', key: 'actions', sortable: false, align: 'end' });
      return base;
    },
  },
  methods: {
    eventColor,

    /**
     * @desc Format a date string for display.
     * @param {string} date - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },

    /**
     * @desc Truncate a URL for table display.
     * @param {string} url - Full URL
     * @returns {string} Truncated URL
     */
    truncateUrl(url) {
      if (!url) return '';
      if (url.length <= 50) return url;
      return `${url.substring(0, 47)}...`;
    },

    /**
     * @desc Open the delete confirmation dialog.
     * @param {Object} item - The webhook to delete
     */
    confirmDelete(item) {
      this.deleteTarget = item;
      this.showDeleteDialog = true;
    },

    /**
     * @desc Execute the delete action and close dialog.
     */
    executeDelete() {
      if (this.deleteTarget) {
        this.$emit('delete', this.deleteTarget.id || this.deleteTarget._id);
      }
      this.showDeleteDialog = false;
      this.deleteTarget = null;
    },

    /**
     * @desc Send a test ping for a webhook via parent.
     * @param {Object} item - The webhook to test
     * @returns {Promise<void>}
     */
    async testPing(item) {
      const id = item.id || item._id;
      this.testingId = id;
      try {
        await new Promise((resolve, reject) => {
          this.$emit('test', id, { resolve, reject });
        });
        this.snackbarText = 'Test ping sent';
        this.snackbarColor = 'success';
      } catch {
        this.snackbarText = 'Test ping failed';
        this.snackbarColor = 'error';
      } finally {
        this.testingId = null;
        this.showSnackbar = true;
      }
    },

    /**
     * @desc Handle row click to open deliveries.
     * @param {Event} _event - Click event
     * @param {Object} row - Row data
     */
    onRowClick(_event, row) {
      const item = row.item;
      this.$emit('deliveries', item.id || item._id);
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
