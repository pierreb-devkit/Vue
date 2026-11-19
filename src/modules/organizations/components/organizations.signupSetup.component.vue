<template>
  <v-container class="pa-0">
    <v-row justify="center">
      <v-col cols="12">
        <div class="text-center mb-6">
          <v-icon icon="fa-solid fa-building" size="x-large" color="primary" class="mb-4"></v-icon>
          <h3 class="text-headline-small font-weight-bold mb-2">Set up your workspace</h3>
          <p class="text-body-medium text-medium-emphasis">
            A workspace keeps your {{ itemNoun }} and teammates together — create one or join an existing organization to get started.
          </p>
        </div>

        <!-- Error alert -->
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
          :class="config.vuetify.theme.rounded"
          closable
          @click:close="error = null"
        >
          {{ error }}
        </v-alert>

        <!-- Create organization form -->
        <v-form ref="form" v-model="valid">
          <v-text-field
            v-model="organizationName"
            label="Organization Name"
            :rules="[rules.required]"
            variant="outlined"
            density="comfortable"
            placeholder="e.g. Acme Inc."
            prepend-icon="fa-solid fa-building"
            class="mb-4"
          ></v-text-field>

          <v-row>
            <v-col cols="12" class="text-right">
              <v-btn
                :disabled="valid !== true || loading"
                :loading="loading"
                color="primary"
                variant="flat"
                :class="config.vuetify.theme.rounded"
                class="text-none text-body-medium"
                @click="submit"
              >
                Create Organization
                <v-icon end icon="fa-solid fa-arrow-right" size="small"></v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { requiredTrim } from '../../../lib/helpers/rules';
/**
 * Module dependencies.
 */
import { useOrganizationsStore } from '../stores/organizations.store';
import { sanitizeApiError } from '../../../lib/helpers/apiError';

/**
 * Organization setup component shown after signup (step 2): a create form
 * pre-filled from the user's first name. Joining an existing organization
 * goes through the join-request flow, not this step.
 */
export default {
  name: 'OrganizationsSignupSetupComponent',
  props: {
    defaultName: {
      type: String,
      default: '',
    },
  },
  emits: ['created'],
  data() {
    return {
      valid: false,
      loading: false,
      error: null,
      organizationName: this.defaultName ? `${this.defaultName}'s organization` : '',
      rules: {
        required: requiredTrim('Organization name is required'),
      },
    };
  },
  computed: {
    /**
     * @desc Noun for the items a workspace groups (e.g. "projects"), config-overridable
     * app-wide vocabulary.
     * @returns {string}
     */
    itemNoun() {
      return this.config?.app?.itemNoun ?? 'projects';
    },
  },
  methods: {
    /**
     * @desc Submit the organization creation form.
     */
    async submit() {
      const form = await this.$refs.form.validate();
      if (!form.valid) return;

      this.loading = true;
      this.error = null;
      const organizationsStore = useOrganizationsStore();
      try {
        const organization = await organizationsStore.createOrganization({
          name: this.organizationName,
        });
        if (organization) {
          this.$emit('created', organization);
        }
      } catch (err) {
        this.error = sanitizeApiError(err, 'Could not create organization. Please try again.', 'description');
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
