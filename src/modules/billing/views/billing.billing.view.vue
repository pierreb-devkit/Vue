<template>
  <v-container class="py-10" style="max-width: 700px">
    <!-- Loading -->
    <v-row v-if="loading" justify="center" class="py-16">
      <v-progress-circular indeterminate color="primary" />
    </v-row>

    <!-- Content -->
    <template v-else>
      <h1 class="text-headline-large font-weight-bold mb-6">Billing</h1>

      <!-- Free plan state -->
      <v-card v-if="!subscription || currentPlan === 'free'" :class="config.vuetify.theme.rounded" class="pa-6">
        <div class="d-flex align-center mb-4">
          <span class="text-title-large font-weight-medium mr-3">Current Plan</span>
          <billingPlanBadgeComponent plan="free" />
        </div>
        <p class="text-body-medium mb-6">
          You're on the free plan. Upgrade to unlock more projects, team members, and advanced features.
        </p>
        <v-btn
          color="primary"
          variant="flat"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium"
          to="/pricing"
        >
          Upgrade
        </v-btn>
      </v-card>

      <!-- Active subscription state -->
      <v-card v-else :class="config.vuetify.theme.rounded" class="pa-6">
        <div class="d-flex align-center mb-4">
          <span class="text-title-large font-weight-medium mr-3">Current Plan</span>
          <billingPlanBadgeComponent :plan="currentPlan" />
        </div>

        <v-list density="compact" class="bg-transparent pa-0 mb-6">
          <v-list-item class="px-0">
            <template #prepend>
              <v-icon icon="fa-solid fa-circle-check" size="small" color="success" class="mr-3" />
            </template>
            <v-list-item-title class="text-body-medium">
              Status: <strong class="text-capitalize">{{ subscription.status }}</strong>
            </v-list-item-title>
          </v-list-item>
          <v-list-item v-if="nextBillingDate" class="px-0">
            <template #prepend>
              <v-icon icon="fa-solid fa-calendar" size="small" class="mr-3" />
            </template>
            <v-list-item-title class="text-body-medium">
              Next billing date: <strong>{{ nextBillingDate }}</strong>
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <div class="d-flex ga-3 flex-wrap">
          <v-btn
            color="primary"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            :loading="portalLoading"
            @click="manageSubscription"
          >
            Manage Subscription
          </v-btn>
          <v-btn
            variant="outlined"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            to="/pricing"
          >
            Upgrade
          </v-btn>
        </div>
      </v-card>
    </template>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useBillingStore } from '../stores/billing.store';
import billingPlanBadgeComponent from '../components/billing.planBadge.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'BillingView',
  components: {
    billingPlanBadgeComponent,
  },
  data() {
    return {
      portalLoading: false,
    };
  },
  computed: {
    loading() {
      const billingStore = useBillingStore();
      return billingStore.loading;
    },
    subscription() {
      const billingStore = useBillingStore();
      return billingStore.subscription;
    },
    /**
     * @desc Derive current plan from subscription or default to free.
     * @returns {string} Plan identifier
     */
    currentPlan() {
      return this.subscription?.plan || 'free';
    },
    /**
     * @desc Format the next billing date for display.
     * @returns {string|null} Formatted date string
     */
    nextBillingDate() {
      const date = this.subscription?.currentPeriodEnd;
      if (!date) return null;
      return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },
  },
  /**
   * @desc Fetch subscription data on mount.
   */
  async mounted() {
    const billingStore = useBillingStore();
    await billingStore.fetchSubscription();
  },
  methods: {
    /**
     * @desc Open the Stripe customer portal.
     * @returns {Promise<void>}
     */
    async manageSubscription() {
      this.portalLoading = true;
      try {
        const billingStore = useBillingStore();
        await billingStore.openPortal();
      } finally {
        this.portalLoading = false;
      }
    },
  },
};
</script>
