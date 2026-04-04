<template>
  <v-container class="py-10" style="max-width: 900px">
    <PageHeader icon="fa-solid fa-code" title="Developers" subtitle="Manage API keys and webhooks" />

    <v-tabs v-model="tab" color="primary" class="mb-6">
      <v-tab value="keys">API Keys</v-tab>
      <v-tab value="webhooks">Webhooks</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="keys">
        <developersKeysTab
          :keys="keys"
          :keys-total="keysTotal"
          :loading="loading"
          @create="openCreateKeyDialog"
          @revoke="revokeKey"
          @update:options="onKeysTableOptions"
        />
      </v-window-item>

      <v-window-item value="webhooks">
        <developersWebhooksTab
          :webhooks="webhooks"
          :webhooks-total="webhooksTotal"
          :loading="loading"
          @create="openCreateWebhookDialog"
          @edit="openEditWebhookDialog"
          @delete="deleteWebhook"
          @test="testWebhook"
          @deliveries="openDeliveriesDialog"
          @update:options="onWebhooksTableOptions"
        />
      </v-window-item>
    </v-window>

    <!-- Create Key Dialog -->
    <developersKeyCreateComponent
      v-model="showCreateKeyDialog"
      @created="onKeyCreated"
    />

    <!-- Show Plain Key Dialog (one-time display) -->
    <v-dialog v-model="showPlainKeyDialog" max-width="440" persistent>
      <v-card :class="config.vuetify.theme.rounded" class="pa-6">
        <v-card-title class="text-title-large font-weight-medium pa-0 mb-4">
          API Key Created
        </v-card-title>
        <v-card-text class="pa-0 mb-4">
          <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
            Copy this key now. It won't be shown again.
          </v-alert>
          <v-text-field
            :model-value="lastPlainKey"
            readonly
            variant="outlined"
            density="compact"
            class="text-body-medium"
            style="font-family: monospace"
          >
            <template #append-inner>
              <v-btn
                icon
                variant="text"
                size="small"
                @click="copyToClipboard(lastPlainKey, 'keyCopied')"
              >
                <v-icon :icon="keyCopied ? 'fa-solid fa-check' : 'fa-solid fa-copy'" size="small" />
              </v-btn>
            </template>
          </v-text-field>
        </v-card-text>
        <v-card-actions class="pa-0">
          <v-spacer />
          <v-btn
            color="primary"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            @click="closePlainKeyDialog"
          >
            Done
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Create / Edit Webhook Dialog -->
    <developersWebhookCreateComponent
      v-model="showWebhookDialog"
      :webhook="editingWebhook"
      @created="onWebhookCreated"
      @updated="onWebhookUpdated"
    />

    <!-- Show Plain Secret Dialog (one-time display) -->
    <v-dialog v-model="showPlainSecretDialog" max-width="440" persistent>
      <v-card :class="config.vuetify.theme.rounded" class="pa-6">
        <v-card-title class="text-title-large font-weight-medium pa-0 mb-4">
          Webhook Created
        </v-card-title>
        <v-card-text class="pa-0 mb-4">
          <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
            Copy this signing secret now. It won't be shown again.
          </v-alert>
          <v-text-field
            :model-value="lastPlainSecret"
            readonly
            variant="outlined"
            density="compact"
            class="text-body-medium"
            style="font-family: monospace"
          >
            <template #append-inner>
              <v-btn
                icon
                variant="text"
                size="small"
                @click="copyToClipboard(lastPlainSecret, 'secretCopied')"
              >
                <v-icon :icon="secretCopied ? 'fa-solid fa-check' : 'fa-solid fa-copy'" size="small" />
              </v-btn>
            </template>
          </v-text-field>
        </v-card-text>
        <v-card-actions class="pa-0">
          <v-spacer />
          <v-btn
            color="primary"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            @click="closePlainSecretDialog"
          >
            Done
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Webhook Deliveries Dialog -->
    <developersWebhookDeliveriesComponent
      v-model="showDeliveriesDialog"
      :deliveries="deliveries"
      :deliveries-total="deliveriesTotal"
      :loading="loading"
      @update:options="onDeliveriesTableOptions"
    />
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useDevelopersStore } from '../stores/developers.store';
import config from '../../../lib/services/config';
import developersKeysTab from '../components/developers.keysTab.component.vue';
import developersKeyCreateComponent from '../components/developers.keyCreate.component.vue';
import developersWebhooksTab from '../components/developers.webhooksTab.component.vue';
import developersWebhookCreateComponent from '../components/developers.webhookCreate.component.vue';
import developersWebhookDeliveriesComponent from '../components/developers.webhookDeliveries.component.vue';
import PageHeader from '../../core/components/core.pageHeader.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'DevelopersIndexView',
  components: {
    developersKeysTab,
    developersKeyCreateComponent,
    developersWebhooksTab,
    developersWebhookCreateComponent,
    developersWebhookDeliveriesComponent,
    PageHeader,
  },
  data() {
    return {
      config,
      tab: 'keys',
      // Keys
      showCreateKeyDialog: false,
      showPlainKeyDialog: false,
      lastPlainKey: '',
      keyCopied: false,
      // Webhooks
      showWebhookDialog: false,
      editingWebhook: null,
      showPlainSecretDialog: false,
      lastPlainSecret: '',
      secretCopied: false,
      // Deliveries
      showDeliveriesDialog: false,
      activeDeliveryWebhookId: null,
    };
  },
  computed: {
    loading() {
      const store = useDevelopersStore();
      return store.loading;
    },
    keys() {
      const store = useDevelopersStore();
      return store.keys;
    },
    keysTotal() {
      const store = useDevelopersStore();
      return store.keysTotal;
    },
    webhooks() {
      const store = useDevelopersStore();
      return store.webhooks;
    },
    webhooksTotal() {
      const store = useDevelopersStore();
      return store.webhooksTotal;
    },
    deliveries() {
      const store = useDevelopersStore();
      return store.deliveries;
    },
    deliveriesTotal() {
      const store = useDevelopersStore();
      return store.deliveriesTotal;
    },
  },
  watch: {
    /**
     * @desc Fetch data when switching tabs.
     * @param {string} val - Active tab value
     */
    async tab(val) {
      const store = useDevelopersStore();
      if (val === 'webhooks' && this.webhooks.length === 0) {
        try {
          await store.fetchWebhooks();
        } catch {
          /* interceptor handles */
        }
      }
    },
  },
  async mounted() {
    const store = useDevelopersStore();
    try {
      await store.fetchKeys();
    } catch {
      /* interceptor handles */
    }
  },
  methods: {
    // --- Keys ---

    openCreateKeyDialog() {
      this.showCreateKeyDialog = true;
    },

    /**
     * @desc Handle key creation — show the one-time plain key dialog.
     * @param {Object} key - Created key with plainKey
     */
    async onKeyCreated(key) {
      this.showCreateKeyDialog = false;
      if (key?.plainKey) {
        this.lastPlainKey = key.plainKey;
        this.showPlainKeyDialog = true;
        this.keyCopied = false;
      }
    },

    closePlainKeyDialog() {
      this.showPlainKeyDialog = false;
      this.lastPlainKey = '';
    },

    /**
     * @desc Revoke an API key.
     * @param {string} id - Key ID
     */
    async revokeKey(id) {
      const store = useDevelopersStore();
      try {
        await store.revokeKey(id);
      } catch {
        /* interceptor handles */
      }
    },

    /**
     * @desc Handle keys table pagination.
     * @param {Object} options - { page, itemsPerPage }
     */
    async onKeysTableOptions({ page, itemsPerPage }) {
      const store = useDevelopersStore();
      try {
        await store.fetchKeys(page, itemsPerPage);
      } catch {
        /* interceptor handles */
      }
    },

    // --- Webhooks ---

    openCreateWebhookDialog() {
      this.editingWebhook = null;
      this.showWebhookDialog = true;
    },

    /**
     * @desc Open the webhook dialog in edit mode.
     * @param {Object} webhook - Webhook to edit
     */
    openEditWebhookDialog(webhook) {
      this.editingWebhook = webhook;
      this.showWebhookDialog = true;
    },

    /**
     * @desc Handle webhook creation — show the one-time signing secret dialog.
     * @param {Object} webhook - Created webhook with plainSecret
     */
    onWebhookCreated(webhook) {
      this.showWebhookDialog = false;
      if (webhook?.plainSecret) {
        this.lastPlainSecret = webhook.plainSecret;
        this.showPlainSecretDialog = true;
        this.secretCopied = false;
      }
    },

    /**
     * @desc Handle webhook update.
     */
    onWebhookUpdated() {
      this.showWebhookDialog = false;
      this.editingWebhook = null;
    },

    closePlainSecretDialog() {
      this.showPlainSecretDialog = false;
      this.lastPlainSecret = '';
    },

    /**
     * @desc Delete a webhook.
     * @param {string} id - Webhook ID
     */
    async deleteWebhook(id) {
      const store = useDevelopersStore();
      try {
        await store.deleteWebhook(id);
      } catch {
        /* interceptor handles */
      }
    },

    /**
     * @desc Send a test ping for a webhook.
     * @param {string} id - Webhook ID
     * @param {Object} callbacks - { resolve, reject } from child component
     */
    async testWebhook(id, callbacks) {
      const store = useDevelopersStore();
      try {
        await store.testWebhook(id);
        if (callbacks?.resolve) callbacks.resolve();
      } catch (err) {
        if (callbacks?.reject) callbacks.reject(err);
      }
    },

    /**
     * @desc Handle webhooks table pagination.
     * @param {Object} options - { page, itemsPerPage }
     */
    async onWebhooksTableOptions({ page, itemsPerPage }) {
      const store = useDevelopersStore();
      try {
        await store.fetchWebhooks(page, itemsPerPage);
      } catch {
        /* interceptor handles */
      }
    },

    // --- Deliveries ---

    /**
     * @desc Open the deliveries dialog for a webhook.
     * @param {string} webhookId - Webhook ID
     */
    async openDeliveriesDialog(webhookId) {
      this.activeDeliveryWebhookId = webhookId;
      this.showDeliveriesDialog = true;
      const store = useDevelopersStore();
      try {
        await store.fetchDeliveries(webhookId);
      } catch {
        /* interceptor handles */
      }
    },

    /**
     * @desc Handle deliveries table pagination.
     * @param {Object} options - { page, itemsPerPage }
     */
    async onDeliveriesTableOptions({ page, itemsPerPage }) {
      if (!this.activeDeliveryWebhookId) return;
      const store = useDevelopersStore();
      try {
        await store.fetchDeliveries(this.activeDeliveryWebhookId, page, itemsPerPage);
      } catch {
        /* interceptor handles */
      }
    },

    // --- Shared ---

    /**
     * @desc Copy text to clipboard and set a flag.
     * @param {string} text - Text to copy
     * @param {string} flag - Data property name to toggle
     */
    async copyToClipboard(text, flag) {
      try {
        await navigator.clipboard.writeText(text);
        this[flag] = true;
        setTimeout(() => { this[flag] = false; }, 2000);
      } catch {
        /* clipboard API may fail in non-secure contexts */
      }
    },
  },
};
</script>
