<template>
  <v-container fluid>
    <PageHeader icon="fa-solid fa-credit-card" title="Billing" />

    <!-- Redirect in progress (single manageable org) -->
    <div v-if="redirecting" class="d-flex justify-center align-center pa-12">
      <AppSpinner color="primary" />
    </div>

    <!-- Plain member of the current org → read-only usage of that org, pay actions hidden -->
    <BillingSubscriptionsComponent v-else-if="memberView" :key="currentOrgKey" />

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
import { defineAsyncComponent } from 'vue';
import { useOrganizationsStore } from '../../organizations/stores/organizations.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import { lacksPayRight } from '../lib/payRights.js';
import { ability } from '../../../lib/helpers/ability';
import PageHeader from '../../core/components/core.pageHeader.component.vue';
import AppSpinner from '../../core/components/core.appSpinner.component.vue';

export default {
  name: 'BillingAccountView',
  components: {
    PageHeader,
    AppSpinner,
    BillingSubscriptionsComponent: defineAsyncComponent(() => import('../components/billing.subscriptions.component.vue')),
  },
  /**
   * @desc Wire the organizations + auth stores so computed properties stay reactive.
   * @returns {{ organizationsStore: Object, authStore: Object }}
   */
  setup() {
    const organizationsStore = useOrganizationsStore();
    const authStore = useAuthStore();
    return { organizationsStore, authStore };
  },
  /**
   * @desc Component local state.
   * @returns {{ redirecting: boolean }}
   */
  data() {
    return {
      /** @type {boolean} True while an auto-redirect to a single org's billing is in flight. */
      redirecting: false,
    };
  },
  computed: {
    /**
     * @desc Whether the user is a plain member of the current organization (no pay
     * right there). Members may read the usage but never pay, so they get the usage
     * view of the current organization in place — never a redirect to another org's
     * billing route, which the current org's abilities would refuse.
     * @returns {boolean}
     */
    memberView() {
      return lacksPayRight(this.authStore, 'BillingPortal');
    },
    /**
     * @desc Key of the member panel: remounts it (subscription, ledger, usage) on an org switch.
     * @returns {string}
     */
    currentOrgKey() {
      const org = this.authStore.user?.currentOrganization;
      return String(org?.id || org?._id || org || '');
    },
    /**
     * @desc The subset of the user's organizations where they can manage billing
     * (role owner or admin). Mirrors the guard used in user.view.vue's hasOwnerOrAdminRole.
     * @returns {Array}
     */
    manageableOrgs() {
      const orgs = this.organizationsStore.organizations || [];
      return orgs.filter((org) => org.role === 'owner' || org.role === 'admin');
    },
    /**
     * @desc The org to auto-redirect to: the single manageable org, unless the user
     * is a plain member of the current org (they read its usage in place).
     * @returns {string|null}
     */
    redirectOrgId() {
      // can() first: the reactive read that re-runs this once abilities load.
      ability.can('create', 'BillingPortal');
      // Abilities of the current org not loaded yet: cannot tell a member from an admin, so wait.
      if (this.authStore.user?.currentOrganization && !ability.rules?.length) return null;
      if (this.memberView || this.manageableOrgs.length !== 1) return null;
      const org = this.manageableOrgs[0];
      return org.id || org._id;
    },
  },
  watch: {
    /**
     * @desc Auto-redirect to a single manageable org's billing page. Immediate, so it
     * runs before the first render and the spinner shows at once; also re-runs when an
     * org switch (which keeps this view mounted) turns a member into an owner.
     * Requires the org store to be pre-hydrated by the global beforeEach guard.
     */
    redirectOrgId: {
      immediate: true,
      handler(orgId) {
        if (!orgId) return;
        this.redirecting = true;
        this.$router.replace(`/users/organizations/${orgId}/billing`);
      },
    },
  },
};
</script>
