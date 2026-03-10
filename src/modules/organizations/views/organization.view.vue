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
      <v-avatar v-if="currentOrganization" color="primary" size="36" class="mr-3">
        <span class="text-body-large font-weight-bold" style="color: white;">
          {{ (currentOrganization.name || '?').charAt(0).toUpperCase() }}
        </span>
      </v-avatar>
      <div>
        <h2 class="text-headline-small font-weight-bold">
          {{ currentOrganization ? currentOrganization.name : 'Organization' }}
        </h2>
        <p v-if="currentOrganization && currentOrganization.description" class="text-body-small" style="opacity: 0.7; margin: 0;">
          {{ currentOrganization.description }}
        </p>
      </div>
      <v-spacer></v-spacer>
      <v-btn
        v-if="currentOrganization"
        color="error"
        variant="tonal"
        class="text-none text-body-medium mr-2"
        :class="config.vuetify.theme.rounded"
        @click="confirmDelete = true"
      >
        <v-icon icon="fa-solid fa-trash" size="small" class="mr-2"></v-icon>
        Delete
      </v-btn>
    </v-row>

    <!-- Content -->
    <v-row class="pa-2">
      <!-- Organization details -->
      <v-col cols="12" md="4">
        <v-card
          :style="{ background: theme.current.colors.surface }"
          :flat="config.vuetify.theme.flat"
          :class="config.vuetify.theme.rounded"
          class="pa-6"
        >
          <h3 class="text-title-medium font-weight-medium mb-4">Details</h3>
          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="name"
              label="Organization Name"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              class="mb-2"
            ></v-text-field>
            <v-textarea
              v-model="description"
              label="Description"
              variant="outlined"
              density="comfortable"
              rows="3"
              class="mb-2"
            ></v-textarea>
            <v-btn
              :disabled="!dirty || !valid"
              color="primary"
              variant="flat"
              :class="config.vuetify.theme.rounded"
              class="text-none text-body-medium"
              block
              @click="update"
            >
              Save Changes
            </v-btn>
          </v-form>
        </v-card>
      </v-col>

      <!-- Members section -->
      <v-col cols="12" md="8">
        <organizationsMembersComponent
          v-if="currentOrganization"
          :organization-id="organizationId"
        />
      </v-col>
    </v-row>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="confirmDelete" max-width="440">
      <v-card :class="config.vuetify.theme.rounded" class="pa-4">
        <v-card-title class="text-title-large font-weight-medium">
          Delete Organization
        </v-card-title>
        <v-card-text class="text-body-medium">
          Are you sure you want to delete this organization? This action cannot be undone
          and all members will lose access.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            class="text-none text-body-medium"
            @click="confirmDelete = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            @click="remove"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { useOrganizationsStore } from '../stores/organizations.store';
import organizationsMembersComponent from '../components/organizations.members.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'OrganizationView',
  components: {
    organizationsMembersComponent,
  },
  data() {
    const theme = useTheme();
    return {
      theme,
      organizationId: this.$route.params.organizationId,
      valid: false,
      dirty: false,
      confirmDelete: false,
      rules: {
        required: (v) => !!v || 'Required',
      },
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
    currentOrganization() {
      const organizationsStore = useOrganizationsStore();
      return organizationsStore.currentOrganization;
    },
    name: {
      get() {
        return this.currentOrganization ? this.currentOrganization.name : '';
      },
      set(value) {
        const organizationsStore = useOrganizationsStore();
        if (organizationsStore.currentOrganization) {
          organizationsStore.currentOrganization.name = value;
          this.dirty = true;
        }
      },
    },
    description: {
      get() {
        return this.currentOrganization ? this.currentOrganization.description : '';
      },
      set(value) {
        const organizationsStore = useOrganizationsStore();
        if (organizationsStore.currentOrganization) {
          organizationsStore.currentOrganization.description = value;
          this.dirty = true;
        }
      },
    },
  },
  async created() {
    const organizationsStore = useOrganizationsStore();
    organizationsStore.resetOrganization();
    if (this.organizationId) {
      await organizationsStore.fetchOrganization(this.organizationId);
    }
  },
  methods: {
    /**
     * @desc Update the current organization with form data.
     * @returns {Promise<void>}
     */
    async update() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        const organizationsStore = useOrganizationsStore();
        try {
          await organizationsStore.updateOrganization(this.organizationId, {
            name: this.name,
            description: this.description,
          });
          this.dirty = false;
        } catch (err) {
          console.log(err);
        }
      }
    },
    /**
     * @desc Delete the current organization after confirmation.
     * @returns {Promise<void>}
     */
    async remove() {
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.deleteOrganization(this.organizationId);
        this.confirmDelete = false;
        this.$router.push('/organizations');
      } catch (err) {
        console.log(err);
      }
    },
  },
};
</script>
