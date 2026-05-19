<template>
  <v-container fluid>
    <PageHeader icon="fa-solid fa-credit-card" title="Billing" />

    <!-- Redirect in progress (single manageable org) -->
    <div v-if="redirecting" class="d-flex justify-center align-center pa-12">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- Multiple manageable orgs → org selector -->
    <template v-else-if="manageableOrgs.length > 1">
      <v-row class="pa-2 mt-0">
        <v-col cols="12" md="6" offset-md="3">
          <v-card color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded" class="pa-6">
            <h3 class="text-title-medium font-weight-medium mb-2">Select an organization</h3>
            <p class="text-body-medium text-medium-emphasis mb-4">Choose which organization's billing you want to manage.</p>
            <v-list class="pa-0 bg-transparent">
              <template v-for="(org, i) in manageableOrgs" :key="org.id || org._id">
                <v-list-item
                  :to="`/users/organizations/${org.id || org._id}/billing`"
                  :class="config.vuetify.theme.rounded"
                  class="pa-4"
                >
                  <v-list-item-title class="text-body-large font-weight-medium">{{ org.name }}</v-list-item-title>
                  <template #append>
                    <div class="d-flex align-center ga-2">
                      <v-chip v-if="org.role" size="small" color="primary" variant="tonal" class="text-capitalize">{{ org.role }}</v-chip>
                      <v-icon icon="fa-solid fa-chevron-right" size="small" color="medium-emphasis" />
                    </div>
                  </template>
                </v-list-item>
                <v-divider v-if="i < manageableOrgs.length - 1" />
              </template>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- No manageable org → read-only state -->
    <template v-else>
      <v-row class="pa-2 mt-0">
        <v-col cols="12" md="6" offset-md="3">
          <v-card color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded" class="pa-8 text-center">
            <v-icon icon="fa-solid fa-credit-card" size="x-large" color="medium-emphasis" class="mb-4" />
            <h3 class="text-title-medium font-weight-medium mb-2">Billing is managed by your organization</h3>
            <p class="text-body-medium text-medium-emphasis">
              Ask your organization admin to manage billing and subscription settings.
            </p>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script>
import { useOrganizationsStore } from '../../organizations/stores/organizations.store';
import PageHeader from '../../core/components/core.pageHeader.component.vue';

export default {
  name: 'BillingAccountView',
  components: {
    PageHeader,
  },
  /**
   * @desc Wire the organizations store so computed properties stay reactive.
   * @returns {{ organizationsStore: Object }}
   */
  setup() {
    const organizationsStore = useOrganizationsStore();
    return { organizationsStore };
  },
  data() {
    return {
      /** @type {boolean} True while an auto-redirect to a single org's billing is in flight. */
      redirecting: false,
    };
  },
  computed: {
    /**
     * @desc The subset of the user's organizations where they can manage billing
     * (role owner or admin). Mirrors the guard used in user.view.vue's hasOwnerOrAdminRole.
     * @returns {Array}
     */
    manageableOrgs() {
      const orgs = this.organizationsStore.organizations || [];
      return orgs.filter((org) => org.role === 'owner' || org.role === 'admin');
    },
  },
  /**
   * @desc On mount: if exactly one manageable org exists, immediately redirect
   * to that org's billing page. The user should never land on this selector
   * for single-org scenarios.
   * @returns {Promise<void>}
   */
  async mounted() {
    if (this.manageableOrgs.length === 1) {
      const org = this.manageableOrgs[0];
      const orgId = org.id || org._id;
      this.redirecting = true;
      this.$router.replace(`/users/organizations/${orgId}/billing`);
    }
  },
};
</script>
