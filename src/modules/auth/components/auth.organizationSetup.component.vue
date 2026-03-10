<template>
  <v-container class="pa-0">
    <v-row justify="center">
      <v-col cols="12">
        <div class="text-center mb-6">
          <v-icon icon="fa-solid fa-building" size="x-large" color="primary" class="mb-4"></v-icon>
          <h3 class="text-headline-small font-weight-bold mb-2">Create Your Organization</h3>
          <p class="text-body-medium text-medium-emphasis">
            Set up your organization to start collaborating with your team.
          </p>
        </div>

        <v-form ref="form" v-model="valid">
          <v-text-field
            v-model="organizationName"
            label="Organization Name"
            :rules="[rules.required]"
            variant="outlined"
            density="comfortable"
            placeholder="e.g. Acme Inc."
            prepend-icon="fa fa-building"
            class="mb-4"
          ></v-text-field>

          <v-row>
            <v-col cols="12" class="text-right">
              <v-btn
                :disabled="!valid || loading"
                :loading="loading"
                color="primary"
                variant="flat"
                :class="config.vuetify.theme.rounded"
                class="text-none text-body-medium"
                @click="submit"
              >
                Create Organization
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
 * Organization setup component shown after signup when organization creation is required.
 */
export default {
  name: 'AuthOrganizationSetupComponent',
  emits: ['created'],
  data() {
    return {
      valid: false,
      loading: false,
      organizationName: '',
      rules: {
        required: (v) => !!v || 'Organization name is required',
      },
    };
  },
  methods: {
    /**
     * @desc Submit the organization creation form.
     * @returns {Promise<void>}
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
        console.log(err);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
