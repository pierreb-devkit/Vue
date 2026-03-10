<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mx-2 my-4" align="center">
      <v-btn
        icon
        variant="text"
        size="small"
        class="mr-2"
        to="/organizations"
      >
        <v-icon icon="fa-solid fa-arrow-left" size="small"></v-icon>
      </v-btn>
      <v-icon class="ma-2" icon="fa-solid fa-building" size="small"></v-icon>
      <h2 class="text-headline-small font-weight-bold">Create Organization</h2>
    </v-row>

    <!-- Form -->
    <v-row class="pa-2" justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <v-card
          class="pa-8"
          :style="{ background: theme.current.colors.surface }"
          :flat="config.vuetify.theme.flat"
          :class="config.vuetify.theme.rounded"
        >
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
              <v-btn
                variant="text"
                class="text-none text-body-medium mr-2"
                to="/organizations"
              >
                Cancel
              </v-btn>
              <v-btn
                :disabled="!valid"
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
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { useOrganizationsStore } from '../stores/organizations.store';

/**
 * Component definition.
 */
export default {
  name: 'OrganizationsCreateView',
  data() {
    const theme = useTheme();
    return {
      theme,
      valid: false,
      name: '',
      description: '',
      rules: {
        required: (v) => !!v || 'Required',
      },
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
  },
  methods: {
    /**
     * @desc Submit the create organization form.
     * @returns {Promise<void>}
     */
    async create() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        const organizationsStore = useOrganizationsStore();
        try {
          const org = await organizationsStore.createOrganization({
            name: this.name,
            description: this.description,
          });
          if (org) {
            this.$router.push(`/organizations/${org.id || org._id}`);
          }
        } catch (err) {
          console.log(err);
        }
      }
    },
  },
};
</script>
