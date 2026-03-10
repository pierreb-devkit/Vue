<template>
  <v-container fluid>
    <!-- Page header -->
    <v-row class="mx-2 my-4" align="center">
      <v-icon class="ma-2" icon="fa-solid fa-building" size="small"></v-icon>
      <h2 class="text-headline-small font-weight-bold">Organizations</h2>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        variant="flat"
        :class="config.vuetify.theme.rounded"
        class="text-none text-body-medium"
        to="/organizations/create"
      >
        <v-icon icon="fa-solid fa-plus" size="small" class="mr-2"></v-icon>
        New Organization
      </v-btn>
    </v-row>

    <!-- Organizations list -->
    <v-row class="pa-2">
      <v-col
        v-for="org in organizations"
        :key="org.id || org._id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card
          class="pa-0"
          color="surface"
          :flat="config.vuetify.theme.flat"
          :class="config.vuetify.theme.rounded"
        >
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary" size="40">
                <span class="text-title-medium font-weight-bold">
                  {{ (org.name || '?').charAt(0).toUpperCase() }}
                </span>
              </v-avatar>
            </template>
            <v-card-title class="text-title-medium font-weight-medium">
              {{ org.name }}
            </v-card-title>
            <v-card-subtitle v-if="org.description" class="text-body-small">
              {{ org.description }}
            </v-card-subtitle>
          </v-card-item>

          <v-card-text class="pt-0">
            <v-chip
              v-if="org.role"
              size="small"
              :color="org.role === 'admin' ? 'primary' : 'secondary'"
              variant="tonal"
              class="mr-2 text-capitalize"
            >
              {{ org.role }}
            </v-chip>
            <v-chip
              v-if="org.membersCount != null"
              size="small"
              variant="outlined"
            >
              <v-icon icon="fa-solid fa-users" size="x-small" class="mr-1"></v-icon>
              {{ org.membersCount }} {{ org.membersCount === 1 ? 'member' : 'members' }}
            </v-chip>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="text"
              class="text-none text-body-medium"
              :to="`/organizations/${org.id || org._id}`"
            >
              View
              <v-icon icon="fa-solid fa-arrow-right" size="x-small" class="ml-1"></v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty state -->
    <v-row v-if="!organizations || !organizations.length" align="start" justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card
          class="ma-6 pa-8 text-center"
          color="surface"
          :flat="config.vuetify.theme.flat"
          :class="config.vuetify.theme.rounded"
        >
          <v-icon icon="fa-solid fa-building" size="x-large" color="primary" class="mb-4 text-medium-emphasis"></v-icon>
          <h2 class="text-title-large font-weight-medium mb-2">No organizations yet</h2>
          <p class="text-body-medium text-medium-emphasis mb-4">
            Create your first organization to collaborate with your team.
          </p>
          <v-btn
            color="primary"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            to="/organizations/create"
          >
            Create Organization
          </v-btn>
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
  name: 'OrganizationsView',
  data() {
    const theme = useTheme();
    return {
      theme,
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
    organizations() {
      const organizationsStore = useOrganizationsStore();
      return organizationsStore.organizations;
    },
  },
  created() {
    const organizationsStore = useOrganizationsStore();
    organizationsStore.fetchOrganizations();
  },
};
</script>
