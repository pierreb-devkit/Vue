<template>
  <v-dialog :model-value="modelValue" max-width="440" @update:model-value="$emit('update:modelValue', $event)">
    <v-card :class="config.vuetify.theme.rounded" class="pa-6">
      <v-card-title class="text-title-large font-weight-medium pa-0 mb-4">
        {{ isEdit ? 'Edit Webhook' : 'Create Webhook' }}
      </v-card-title>
      <v-card-text class="pa-0">
        <v-form ref="form" @submit.prevent="submit">
          <v-text-field
            v-model="url"
            label="URL"
            placeholder="https://example.com/webhook"
            variant="outlined"
            density="compact"
            :rules="[rules.required, rules.https]"
            class="mb-3"
            style="font-family: monospace"
          />
          <v-select
            v-model="events"
            :items="supportedEvents"
            item-title="label"
            item-value="value"
            label="Events"
            variant="outlined"
            density="compact"
            multiple
            chips
            closable-chips
            :rules="[rules.minOne]"
            class="mb-3"
          />
          <v-textarea
            v-model="description"
            label="Description (optional)"
            variant="outlined"
            density="compact"
            rows="2"
            counter="200"
            :rules="[rules.maxLength]"
            class="mb-3"
          />
          <v-switch
            v-if="isEdit"
            v-model="active"
            label="Active"
            color="primary"
            hide-details
            density="compact"
            class="mb-3"
          />
        </v-form>
      </v-card-text>
      <v-card-actions class="pa-0 mt-4">
        <v-spacer />
        <v-btn
          variant="outlined"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium"
          @click="close"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium"
          :loading="submitting"
          @click="submit"
        >
          {{ isEdit ? 'Save' : 'Create' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { useDevelopersStore } from '../stores/developers.store';
import config from '../../../lib/services/config';
import { supportedEvents } from '../config/developers.config';

export default {
  name: 'DevelopersWebhookCreateComponent',
  props: {
    modelValue: { type: Boolean, default: false },
    webhook: { type: Object, default: null },
  },
  emits: ['update:modelValue', 'created', 'updated'],
  data() {
    return {
      config,
      supportedEvents,
      url: '',
      events: [],
      description: '',
      active: true,
      submitting: false,
      rules: {
        required: (v) => !!v || 'Required',
        https: (v) => (v && v.startsWith('https://')) || 'URL must start with https://',
        minOne: (v) => (v && v.length > 0) || 'Select at least one event',
        maxLength: (v) => !v || v.length <= 200 || 'Maximum 200 characters',
      },
    };
  },
  computed: {
    /**
     * @desc Whether we are editing an existing webhook.
     * @returns {boolean}
     */
    isEdit() {
      return !!this.webhook;
    },
  },
  watch: {
    /**
     * @desc Populate form when editing an existing webhook.
     * @param {Object|null} val - The webhook to edit
     */
    webhook(val) {
      if (this.modelValue) this.populate(val);
    },
    /**
     * @desc Populate or reset form when dialog opens.
     * @param {boolean} val - Dialog visibility
     */
    modelValue(val) {
      if (val) this.populate(this.webhook);
    },
  },
  methods: {
    /**
     * @desc Populate form from a webhook object, or reset if null.
     * @param {Object|null} webhook - The webhook to populate from
     */
    populate(webhook) {
      if (!webhook) {
        this.reset();
        return;
      }
      this.url = webhook.url || '';
      this.events = webhook.events ? [...webhook.events] : [];
      this.description = webhook.description || '';
      this.active = webhook.active !== false;
      if (this.$refs.form) this.$refs.form.resetValidation();
    },

    /**
     * @desc Submit the create or update webhook form.
     * @returns {Promise<void>}
     */
    async submit() {
      const { valid } = await this.$refs.form.validate();
      if (!valid) return;

      this.submitting = true;
      try {
        const store = useDevelopersStore();
        const body = {
          url: this.url,
          events: this.events,
          description: this.description || undefined,
        };

        if (this.isEdit) {
          body.active = this.active;
          const id = this.webhook.id || this.webhook._id;
          const result = await store.updateWebhook(id, body);
          this.$emit('updated', result);
        } else {
          const result = await store.createWebhook(body);
          this.$emit('created', result);
        }
        this.close();
      } catch {
        /* interceptor handles */
      } finally {
        this.submitting = false;
      }
    },

    /**
     * @desc Close the dialog and reset form state.
     */
    close() {
      this.$emit('update:modelValue', false);
      this.reset();
    },

    /**
     * @desc Reset form fields to defaults.
     */
    reset() {
      this.url = '';
      this.events = [];
      this.description = '';
      this.active = true;
      if (this.$refs.form) this.$refs.form.resetValidation();
    },
  },
};
</script>
