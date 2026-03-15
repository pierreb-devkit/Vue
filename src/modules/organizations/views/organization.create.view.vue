<template>
  <v-container fluid>
    <PageHeader icon="fa-solid fa-building" title="Create Organization" />
    <v-row class="pa-2" justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <v-card class="pa-8" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
          <h3 class="text-title-large font-weight-medium mb-6">Organization Details</h3>
          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="name"
              label="Organization Name"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              placeholder="e.g. Acme Inc."
              class="mb-2"
            ></v-text-field>
            <v-textarea
              v-model="description"
              label="Description"
              variant="outlined"
              density="comfortable"
              rows="3"
              placeholder="What does this organization do?"
              class="mb-4"
            ></v-textarea>
            <v-row>
              <v-spacer></v-spacer>
              <v-btn variant="text" class="text-none text-body-medium mr-2" to="/users">Cancel</v-btn>
              <v-btn
                :disabled="!valid || loading"
                :loading="loading"
                color="primary"
                variant="flat"
                :class="config.vuetify.theme.rounded"
                class="text-none text-body-medium"
                @click="create"
              >
                Create Organization
              </v-btn>
            </v-row>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useOrganizationsStore } from '../stores/organizations.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import PageHeader from '../../core/components/core.pageHeader.component.vue';

export default {
  name: 'OrganizationCreateView',
  components: { PageHeader },
  data() {
    return {
      valid: false,
      loading: false,
      name: '',
      description: '',
      rules: { required: (v) => (!!v && !!v.trim()) || 'Required' },
    };
  },
  methods: {
    async create() {
      if (this.loading) return;
      const form = await this.$refs.form.validate();
      if (form.valid) {
        this.loading = true;
        const organizationsStore = useOrganizationsStore();
        try {
          const org = await organizationsStore.createOrganization({
            name: this.name,
            description: this.description,
          });
          if (org) {
            const authStore = useAuthStore();
            await authStore.refreshAbilities();
            this.$router.push(`/users/organizations/${org.id || org._id}`);
          }
        } catch (err) {
          console.log(err);
        } finally {
          this.loading = false;
        }
      }
    },
  },
};
</script>
