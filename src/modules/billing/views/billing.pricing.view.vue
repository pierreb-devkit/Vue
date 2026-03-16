<template>
  <v-container class="py-12" :style="{ 'max-width': config.vuetify.theme.maxWidth }">
    <!-- Header -->
    <div class="text-center mb-10">
      <h1 class="text-display-small text-sm-display-medium text-md-display-large font-weight-bold mb-3">Pricing</h1>
      <p class="text-body-large text-medium-emphasis">Choose the plan that fits your needs.</p>
    </div>

    <!-- Billing toggle -->
    <div class="mb-10">
      <billingPricingToggleComponent :annual="annual" @update:annual="annual = $event" />
    </div>

    <!-- Error state -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-6"
    >
      {{ error }}
      <template #append>
        <v-btn variant="text" size="small" @click="retryFetchPlans">Retry</v-btn>
      </template>
    </v-alert>

    <!-- Loading state -->
    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Plans grid -->
    <v-row v-else-if="!error" justify="center">
      <v-col
        v-for="plan in mergedPlans"
        :key="plan.id"
        cols="12"
        sm="6"
        md="4"
      >
        <billingPricingCardComponent
          :plan="plan"
          :annual="annual"
          :current="isCurrentPlan(plan.id)"
          @select="onSelectPlan"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useBillingStore } from '../stores/billing.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import plansConfig from '../config/billing.config';
import billingPricingToggleComponent from '../components/billing.pricingToggle.component.vue';
import billingPricingCardComponent from '../components/billing.pricingCard.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'PricingView',
  components: {
    billingPricingToggleComponent,
    billingPricingCardComponent,
  },
  data() {
    return {
      annual: false,
      error: null,
    };
  },
  computed: {
    /**
     * @desc Merge static config (features, tagline, badge) with Stripe data (prices).
     * @returns {Array} Plans array with marketing content and pricing data combined
     */
    mergedPlans() {
      const billingStore = useBillingStore();
      return plansConfig.map((staticPlan) => {
        const stripePlan = billingStore.plans.find((p) => p.id === staticPlan.id) || {};
        return {
          ...staticPlan,
          monthlyPrice: stripePlan.monthlyPrice || null,
          annualPrice: stripePlan.annualPrice || null,
        };
      });
    },
    /**
     * @desc Whether billing data is being loaded.
     * @returns {boolean} True while loading
     */
    loading() {
      const billingStore = useBillingStore();
      return billingStore.loading;
    },
    /**
     * @desc Get the current subscription plan ID if user is logged in.
     * @returns {string|null} Current plan ID or null
     */
    currentPlanId() {
      const billingStore = useBillingStore();
      return billingStore.subscription?.planId || null;
    },
  },
  /**
   * @desc Fetch billing plans and subscription data on component creation.
   */
  async created() {
    const billingStore = useBillingStore();
    try {
      await billingStore.fetchPlans();
    } catch (error) {
      console.error('Failed to load pricing plans:', error);
      this.error = 'Failed to load pricing. Please try again.';
    }

    const authStore = useAuthStore();
    if (authStore.isLoggedIn) {
      billingStore.fetchSubscription().catch((error) => {
        console.error('Failed to load subscription:', error);
      });
    }
  },
  methods: {
    /**
     * @desc Check if a plan is the user's current plan.
     * @param {string} planId - The plan ID to check
     * @returns {boolean} True if this is the current plan
     */
    isCurrentPlan(planId) {
      return this.currentPlanId === planId;
    },
    /**
     * @desc Retry fetching plans after an error.
     * @returns {Promise<void>}
     */
    async retryFetchPlans() {
      this.error = null;
      const billingStore = useBillingStore();
      try {
        await billingStore.fetchPlans();
      } catch (error) {
        console.error('Failed to load pricing plans:', error);
        this.error = 'Failed to load pricing. Please try again.';
      }
    },
    /**
     * @desc Handle plan selection — create checkout session and redirect.
     * @param {Object} payload - { planId, priceId }
     * @returns {Promise<void>}
     */
    async onSelectPlan({ priceId }) {
      const authStore = useAuthStore();
      if (!authStore.isLoggedIn) {
        this.$router.push({ name: 'Signin', query: { redirect: '/pricing' } });
        return;
      }
      if (!priceId) return;
      const billingStore = useBillingStore();
      try {
        const checkout = await billingStore.createCheckout(priceId);
        if (checkout?.url) {
          window.location.href = checkout.url;
        }
      } catch (error) {
        console.error('Failed to create checkout session:', error);
      }
    },
  },
};
</script>
