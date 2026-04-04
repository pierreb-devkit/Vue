<template>
  <v-dialog :model-value="modelValue" max-width="440" @update:model-value="$emit('update:modelValue', $event)">
    <v-card :class="config.vuetify.theme.rounded" class="pa-6">
      <v-card-title class="text-title-large font-weight-medium pa-0 mb-4">
        Create API Key
      </v-card-title>
      <v-card-text class="pa-0">
        <v-form ref="form" @submit.prevent="submit">
          <v-text-field
            v-model="name"
            label="Name"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
            class="mb-3"
          />
          <v-select
            v-model="scopes"
            :items="scopeOptions"
            label="Scopes"
            variant="outlined"
            density="compact"
            multiple
            chips
            closable-chips
            class="mb-3"
          />
          <v-text-field
            v-model="expiresAt"
            label="Expiry (optional)"
            type="date"
            variant="outlined"
            density="compact"
            :min="minDate"
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
          Create
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { useDevelopersStore } from '../stores/developers.store';
import config from '../../../lib/services/config';

export default {
  name: 'DevelopersKeyCreateComponent',
  props: {
    modelValue: { type: Boolean, default: false },
  },
  emits: ['update:modelValue', 'created'],
  data() {
    return {
      config,
      name: '',
      scopes: ['read'],
      expiresAt: '',
      submitting: false,
      scopeOptions: ['read', 'write'],
      rules: {
        required: (v) => !!v || 'Required',
      },
    };
  },
  computed: {
    /**
     * @desc Minimum date for the expiry picker (tomorrow).
     * @returns {string} ISO date string (YYYY-MM-DD)
     */
    minDate() {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    },
  },
  methods: {
    /**
     * @desc Submit the create key form.
     * @returns {Promise<void>}
     */
    async submit() {
      const { valid } = await this.$refs.form.validate();
      if (!valid) return;

      this.submitting = true;
      try {
        const store = useDevelopersStore();
        const body = {
          name: this.name,
          scopes: this.scopes,
        };
        if (this.expiresAt) {
          body.expiresAt = new Date(this.expiresAt).toISOString();
        }
        const key = await store.createKey(body);
        this.$emit('created', key);
        this.reset();
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
      this.name = '';
      this.scopes = ['read'];
      this.expiresAt = '';
      if (this.$refs.form) this.$refs.form.resetValidation();
    },
  },
};
</script>
