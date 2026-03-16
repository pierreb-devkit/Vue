<template>
  <v-container class="py-12" :style="{ 'max-width': config.vuetify.theme.maxWidth }">
    <!-- Success / cancel alerts -->
    <v-alert
      v-if="checkoutSuccess"
      type="success"
      variant="tonal"
      closable
      class="mb-6"
      @click:close="dismissAlert"
    >
      Payment successful! Your subscription is now active.
    </v-alert>
    <v-alert
      v-if="checkoutCanceled"
      type="info"
      variant="tonal"
      closable
      class="mb-6"
      @click:close="dismissAlert"
    >
      Checkout was canceled. You can try again whenever you are ready.
    </v-alert>

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

    <!-- Header -->
    <div class="text-center mb-10">
      <h1 class="text-display-small text-sm-display-medium text-md-display-large font-weight-bold mb-3">Pricing</h1>
      <p class="text-body-large text-medium-emphasis">Choose the plan that fits your needs.</p>
    </div>

    <!-- Billing toggle -->
    <div class="mb-10">
      <billingPricingToggleComponent :annual="annual" @update:annual="annual = $event" />
    </div>

    <!-- Plans grid -->
    <v-row justify="center">
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
          :loading="checkoutLoading"
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
      checkoutSuccess: false,
      checkoutCanceled: false,
      checkoutLoading: false,
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
     * @desc Get the current subscription plan ID if user is logged in.
     * @returns {string|null} Current plan ID or null
     */
    currentPlanId() {
      const billingStore = useBillingStore();
      return billingStore.subscription?.planId || null;
    },
  },
  async created() {
    const billingStore = useBillingStore();
    try {
      await billingStore.fetchPlans();
    } catch (err) {
      console.error('Failed to load pricing plans:', err);
      this.error = 'Failed to load pricing. Please try again.';
    }

    const authStore = useAuthStore();
    if (authStore.isLoggedIn && (!authStore.serverConfig?.organizations?.enabled || authStore.user?.currentOrganization)) {
      billingStore.fetchSubscription();
    }

    // Handle Stripe redirect query params
    const { success, canceled } = this.$route.query;
    if (success === 'true') this.checkoutSuccess = true;
    if (canceled === 'true') this.checkoutCanceled = true;
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
     * @desc Dismiss the success / canceled alert and clean query params.
     */
    dismissAlert() {
      this.checkoutSuccess = false;
      this.checkoutCanceled = false;
      if (this.$route.query.success || this.$route.query.canceled) {
        this.$router.replace({ path: this.$route.path });
      }
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
      } catch (err) {
        console.error('Failed to load pricing plans:', err);
        this.error = 'Failed to load pricing. Please try again.';
      }
    },
    /**
     * @desc Handle plan selection — validate auth/org, then create checkout session.
     * @param {Object} payload - { planId, priceId }
     * @returns {Promise<void>}
     */
    async onSelectPlan({ planId, priceId }) {
      const authStore = useAuthStore();

      // Guest → redirect to sign-in with return URL
      if (!authStore.isLoggedIn) {
        this.$router.push({ path: '/signin', query: { redirect: '/pricing' } });
        return;
      }

      // Logged-in but no organization → redirect to org setup
      if (authStore.serverConfig?.organizations?.enabled && !authStore.user?.currentOrganization) {
        this.$router.push({ path: '/organization-required' });
        return;
      }

      // Free plan → no checkout needed
      if (!priceId || planId === 'free') return;

      // Paid plan → create Stripe Checkout session
      this.checkoutLoading = true;
      try {
        const billingStore = useBillingStore();
        const checkout = await billingStore.createCheckout(priceId);
        if (checkout?.url) {
          window.location.href = checkout.url;
        }
      } finally {
        this.checkoutLoading = false;
      }
    },
  },
};
</script>
