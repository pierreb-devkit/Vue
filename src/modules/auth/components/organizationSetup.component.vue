<template>
  <v-container class="pa-0">
    <v-row justify="center">
      <v-col cols="12">
        <div class="text-center mb-6">
          <v-icon icon="fa-solid fa-building" size="x-large" color="primary" class="mb-4"></v-icon>
          <h3 class="text-headline-small font-weight-bold mb-2">Set up your workspace</h3>
          <p class="text-body-medium text-medium-emphasis">
            Create or join an organization to start collaborating.
          </p>
        </div>

        <!-- Request sent confirmation -->
        <template v-if="requestSent">
          <v-alert type="info" variant="tonal" class="mb-6" prominent :class="config.vuetify.theme.rounded">
            <span class="text-body-large font-weight-medium">
              Your request to join <strong>{{ suggestedOrganization.name }}</strong> has been sent.
              An admin will review it shortly.
            </span>
          </v-alert>
          <p class="text-body-medium text-medium-emphasis mb-4 text-center">
            Or create your own organization instead:
          </p>
        </template>

        <!-- Suggested organization (domain match found) -->
        <template v-if="suggestedOrganization && !requestSent">
          <v-card variant="outlined" class="mb-6 pa-4" :class="config.vuetify.theme.rounded">
            <v-row align="center" density="compact">
              <v-avatar color="primary" size="40" class="mr-3">
                <span class="text-white font-weight-bold">{{ suggestedOrganization.name?.charAt(0)?.toUpperCase() }}</span>
              </v-avatar>
              <div class="flex-grow-1">
                <p class="text-body-large font-weight-medium mb-0">{{ suggestedOrganization.name }}</p>
                <p class="text-body-small text-medium-emphasis mb-0">
                  Organization matching your email domain
                </p>
              </div>
              <v-btn
                :loading="requestLoading"
                :disabled="requestLoading"
                color="primary"
                variant="flat"
                :class="config.vuetify.theme.rounded"
                class="text-none text-body-medium"
                @click="requestJoin"
              >
                Request to join
              </v-btn>
            </v-row>
          </v-card>
          <v-divider class="mb-4">
            <span class="text-body-small text-medium-emphasis px-4">or create your own</span>
          </v-divider>
        </template>

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
/**
 * Module dependencies.
 */
import { useOrganizationsStore } from '../../organizations/stores/organizations.store';

/**
 * Organization setup component shown after signup (step 2).
 * Handles 3 cases:
 * - Public domain: just show create form
 * - Private domain + existing org: show "Request to join" + create form
 * - Private domain + no org: show create form with pre-filled name
 */
export default {
  name: 'AuthOrganizationSetupComponent',
  props: {
    defaultName: {
      type: String,
      default: '',
    },
    suggestedOrganization: {
      type: Object,
      default: null,
    },
  },
  emits: ['created', 'requestSent'],
  data() {
    return {
      valid: false,
      loading: false,
      requestLoading: false,
      requestSent: false,
      organizationName: this.defaultName ? `${this.defaultName}'s organization` : '',
      rules: {
        required: (v) => (!!v && !!v.trim()) || 'Organization name is required',
      },
    };
  },
  methods: {
    /**
     * @desc Submit the organization creation form.
     */
    async submit() {
      const form = await this.$refs.form.validate();
      if (!form.valid) return;

      this.loading = true;
      const organizationsStore = useOrganizationsStore();
      try {
        const organization = await organizationsStore.createOrganization({
          name: this.organizationName,
        });
        if (organization) {
          this.$emit('created', organization);
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    /**
     * @desc Request to join the suggested organization.
     */
    async requestJoin() {
      if (!this.suggestedOrganization) return;
      const organizationId = this.suggestedOrganization._id || this.suggestedOrganization.id;
      if (!organizationId) return;

      this.requestLoading = true;
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.createJoinRequest(organizationId);
        this.requestSent = true;
        this.$emit('requestSent', this.suggestedOrganization);
      } catch (err) {
        console.error(err);
      } finally {
        this.requestLoading = false;
      }
    },
  },
};
</script>
