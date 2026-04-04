<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <span class="text-title-medium font-weight-medium">Your API Keys</span>
      <v-btn
        color="primary"
        variant="flat"
        :class="config.vuetify.theme.rounded"
        class="text-none text-body-medium"
        @click="$emit('create')"
      >
        Create Key
      </v-btn>
    </div>

    <!-- Empty state -->
    <v-card v-if="!loading && keys.length === 0" :class="config.vuetify.theme.rounded" class="pa-6 text-center">
      <v-icon icon="fa-solid fa-key" size="x-large" color="primary" class="mb-4 text-medium-emphasis" />
      <h2 class="text-title-large font-weight-medium mb-2">No API keys yet</h2>
      <p class="text-body-medium text-medium-emphasis">
        Create one to get started.
      </p>
    </v-card>

    <!-- Data table -->
    <v-card v-else :class="config.vuetify.theme.rounded">
      <v-data-table-server
        :headers="headers"
        :items="keys"
        :items-length="keysTotal"
        :loading="loading"
        :items-per-page="20"
        :items-per-page-options="[10, 20, 50]"
        item-value="_id"
        @update:options="onOptions"
      >
        <template #[`item.prefix`]="{ item }">
          <code class="text-body-small">{{ item.prefix }}...</code>
        </template>

        <template #[`item.scopes`]="{ item }">
          <v-chip
            v-for="scope in (item.scopes || [])"
            :key="scope"
            size="small"
            variant="tonal"
            class="mr-1 text-capitalize"
          >
            {{ scope }}
          </v-chip>
          <span v-if="!item.scopes || !item.scopes.length" class="text-body-small text-medium-emphasis">
            None
          </span>
        </template>

        <template #[`item.createdAt`]="{ item }">
          <span class="text-body-small">{{ formatDate(item.createdAt) }}</span>
        </template>

        <template #[`item.lastUsedAt`]="{ item }">
          <span class="text-body-small">{{ item.lastUsedAt ? formatRelative(item.lastUsedAt) : 'Never' }}</span>
        </template>

        <template #[`item.actions`]="{ item }">
          <v-btn
            color="error"
            variant="tonal"
            size="small"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-small"
            @click="confirmRevoke(item)"
          >
            Revoke
          </v-btn>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Revoke confirmation dialog -->
    <v-dialog v-model="showRevokeDialog" max-width="440">
      <v-card :class="config.vuetify.theme.rounded" class="pa-6">
        <v-card-title class="text-title-large font-weight-medium pa-0 mb-2">
          Revoke API Key
        </v-card-title>
        <v-card-text class="pa-0 mb-4 text-body-medium">
          Are you sure you want to revoke <strong>{{ revokeTarget?.name }}</strong>?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions class="pa-0">
          <v-spacer />
          <v-btn
            variant="outlined"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            @click="showRevokeDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            @click="executeRevoke"
          >
            Revoke
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useDisplay } from 'vuetify';
import config from '../../../lib/services/config';

export default {
  name: 'DevelopersKeysTab',
  props: {
    keys: { type: Array, default: () => [] },
    keysTotal: { type: Number, default: 0 },
    loading: { type: Boolean, default: false },
  },
  emits: ['create', 'revoke', 'update:options'],
  data() {
    return {
      config,
      showRevokeDialog: false,
      revokeTarget: null,
    };
  },
  computed: {
    headers() {
      const { smAndDown } = useDisplay();
      const base = [
        { title: 'Name', key: 'name', sortable: false },
        { title: 'Prefix', key: 'prefix', sortable: false },
        { title: 'Scopes', key: 'scopes', sortable: false },
      ];
      if (!smAndDown.value) {
        base.push(
          { title: 'Created', key: 'createdAt', sortable: false },
          { title: 'Last Used', key: 'lastUsedAt', sortable: false },
        );
      }
      base.push({ title: '', key: 'actions', sortable: false, align: 'end' });
      return base;
    },
  },
  methods: {
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
     * @desc Format a date as a relative time string.
     * @param {string} date - ISO date string
     * @returns {string} Relative time (e.g. "2d ago")
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
      return this.formatDate(date);
    },

    /**
     * @desc Open the revoke confirmation dialog.
     * @param {Object} item - The key to revoke
     */
    confirmRevoke(item) {
      this.revokeTarget = item;
      this.showRevokeDialog = true;
    },

    /**
     * @desc Execute the revoke action and close dialog.
     */
    executeRevoke() {
      if (this.revokeTarget) {
        this.$emit('revoke', this.revokeTarget.id || this.revokeTarget._id);
      }
      this.showRevokeDialog = false;
      this.revokeTarget = null;
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
