<template>
  <v-container class="py-12" :style="{ 'max-width': config.vuetify.theme.maxWidth }">
    <!-- Cancel alert — success goes to /users?tab=subscriptions, never back here -->
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

    <!-- Header -->
    <div class="text-center mb-10">
      <h1 class="text-display-small text-sm-display-medium text-md-display-large font-weight-bold mb-3">Pricing</h1>
      <p class="text-body-large text-medium-emphasis">Choose the plan that fits your needs.</p>
    </div>

    <!-- Error state (non-blocking — plans still render from static config) -->
    <v-alert
      v-if="error"
      type="warning"
      variant="tonal"
      closable
      class="mb-6"
    >
      {{ error }}
      <template #append>
        <v-btn variant="text" size="small" @click="retryFetchPlans">Retry</v-btn>
      </template>
    </v-alert>

    <!-- Checkout error (does not hide plans) -->
    <v-alert
      v-if="checkoutError"
      type="error"
      variant="tonal"
      closable
      class="mb-6"
      @click:close="checkoutError = null"
    >
      {{ checkoutError }}
    </v-alert>

    <!-- Glass tabs (meter mode only) -->
    <div v-if="meterMode" class="d-flex justify-center mb-8">
      <HomeTabsComponent
        :items="tabItems"
        :model-value="activeTab"
        @update:model-value="activeTab = $event"
      />
    </div>

    <!-- ── Plans tab (default / always shown when meterMode is false) ── -->
    <template v-if="!meterMode || activeTab === 0">
      <!-- Billing toggle -->
      <div class="mb-10">
        <BillingPricingToggleComponent :annual="annual" @update:annual="annual = $event" />
      </div>

      <!-- Plans grid (always rendered from static config; prices fill in asynchronously) -->
      <v-row justify="center">
        <v-col
          v-for="plan in mergedPlans"
          :key="plan.id"
          cols="12"
          sm="6"
          md="4"
        >
          <BillingPricingCardComponent
            :plan="plan"
            :annual="annual"
            :current="isCurrentPlan(plan.id)"
            :loading="checkoutLoading"
            :prices-loading="loading"
            :equivalences="meterMode && plan.equivalences && plan.equivalences.length > 0 ? plan.equivalences : null"
            @select="onSelectPlan"
          />
        </v-col>
      </v-row>
    </template>

    <!-- ── Units tab (meter mode only) ── -->
    <template v-if="meterMode && activeTab === 1">
      <BillingPacksComponent />
    </template>

    <!-- Downgrade confirmation dialog -->
    <v-dialog v-model="downgradeDialog" max-width="480" @keydown.esc="cancelDowngrade">
      <v-card>
        <v-card-title class="text-title-medium font-weight-bold">Confirm plan change</v-card-title>
        <v-card-text class="text-body-medium">
          You're switching from <strong>{{ currentPlanName }}</strong> to <strong>{{ pendingDowngradePlanName }}</strong>.
          Stripe will pro-rate the difference. Quota will reset at next billing cycle.
        </v-card-text>
        <v-card-actions class="ga-2">
          <v-btn variant="text" class="text-none" @click="cancelDowngrade">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" :loading="checkoutLoading" @click="confirmDowngrade">
            Continue to checkout
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
import { useBillingStore } from '../stores/billing.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import { plans as plansConfig } from '../config/billing.static-content';
import BillingPricingToggleComponent from '../components/billing.pricingToggle.component.vue';
import BillingPricingCardComponent from '../components/billing.pricingCard.component.vue';
import BillingPacksComponent from '../components/billing.packs.component.vue';
import HomeTabsComponent from '../../home/components/utils/home.tabs.component.vue';


/**
 * Component definition.
 */
export default {
  name: 'PricingView',
  components: {
    BillingPricingToggleComponent,
    BillingPricingCardComponent,
    BillingPacksComponent,
    HomeTabsComponent,
  },
  /**
   * @desc Inject billingStore and authStore once in setup so computed
   * properties reference this.billingStore / this.authStore instead of
   * calling the store factory on every evaluation.
   * @returns {{ billingStore: Object, authStore: Object }}
   */
  setup() {
    const billingStore = useBillingStore();
    const authStore = useAuthStore();
    return { billingStore, authStore };
  },
  data() {
    return {
      annual: false,
      checkoutCanceled: false,
      checkoutLoading: false,
      checkoutError: null,
      error: null,
      /** @type {number} Active glass tab index — 0=plans, 1=units (meter mode only) */
      activeTab: 0,
      /** @type {boolean} Whether the downgrade confirmation dialog is open */
      downgradeDialog: false,
      /** @type {{ planId: string, priceId: string }|null} Pending plan selection awaiting confirmation */
      pendingDowngrade: null,
    };
  },
  computed: {
    /**
     * @desc Merge static config (features, tagline, badge) with Stripe data (prices).
     * @returns {Array} Plans array with marketing content and pricing data combined
     */
    mergedPlans() {
      return plansConfig.map((staticPlan) => {
        const stripePlan = this.billingStore.plans.find(
          (p) => p.planId === staticPlan.id || p.name?.toLowerCase() === staticPlan.id,
        ) || {};
        return {
          ...staticPlan,
          monthlyPrice: stripePlan.stripePriceMonthly
            ? { amount: stripePlan.monthlyPrice, id: stripePlan.stripePriceMonthly }
            : null,
          annualPrice: stripePlan.stripePriceAnnual
            ? { amount: stripePlan.annualPrice, id: stripePlan.stripePriceAnnual }
            : null,
        };
      });
    },
    /**
     * @desc Whether billing data is being loaded.
     * @returns {boolean} True while loading
     */
    loading() {
      return this.billingStore.loading;
    },
    /**
     * @desc Get the current subscription plan ID if user is logged in.
     * @returns {string|null} Current plan ID or null
     */
    currentPlanId() {
      return this.billingStore.subscription?.plan ?? 'free';
    },
    /**
     * @desc Whether meter billing mode is active (from server config).
     * @returns {boolean}
     */
    meterMode() {
      return this.authStore.serverConfig?.billing?.meterMode === true;
    },
    /**
     * @desc Items consumed by HomeTabsComponent (only used when meterMode is true).
     * Labels sourced from i18n keys billing.pricing.tabs.plans / billing.pricing.tabs.units.
     * @returns {Array<{id: string, label: string}>}
     */
    tabItems() {
      return [
        // i18n key: billing.pricing.tabs.plans
        { id: 'plans', label: 'Plans' },
        // i18n key: billing.pricing.tabs.units
        { id: 'units', label: 'Units' },
      ];
    },
    /**
     * @desc Ordered plan IDs derived from static config for downgrade detection.
     * Tier index 0 = lowest (free), last = highest (pro).
     * @returns {Array<string>}
     */
    planTierOrder() {
      return plansConfig.map((p) => p.id).filter(Boolean);
    },
    /**
     * @desc The name of the pending downgrade target plan (for confirmation dialog copy).
     * @returns {string}
     */
    pendingDowngradePlanName() {
      if (!this.pendingDowngrade) return '';
      const plan = this.mergedPlans.find((p) => p.id === this.pendingDowngrade.planId);
      return plan?.name ?? this.pendingDowngrade.planId;
    },
    /**
     * @desc The name of the current plan (for confirmation dialog copy).
     * @returns {string}
     */
    currentPlanName() {
      const plan = this.mergedPlans.find((p) => p.id === this.currentPlanId);
      return plan?.name ?? this.currentPlanId;
    },
  },
  /**
   * @desc Fetch billing plans and subscription data on component creation.
   * @returns {Promise<void>}
   */
  async created() {
    try {
      await this.billingStore.fetchPlans();
    } catch (err) {
      console.error('Failed to load pricing plans:', err);
      this.error = 'Failed to load pricing. Please try again.';
    }

    const orgsEnabled = this.authStore.serverConfig?.organizations?.enabled;
    const hasOrg = !!this.authStore.user?.currentOrganization;
    if (this.authStore.isLoggedIn && (!orgsEnabled || hasOrg)) {
      this.billingStore.fetchSubscription().catch((err) => {
        console.error('Failed to load subscription:', err);
      });
    }

    // Handle Stripe redirect query params — success always redirects to /users, never back here
    const { canceled } = this.$route.query;
    if (canceled === 'true') this.checkoutCanceled = true;
    if (this.$route.hash === '#units') this.activeTab = 1;
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
     * @desc Dismiss the canceled alert and clean query params.
     */
    dismissAlert() {
      this.checkoutCanceled = false;
      if (this.$route.query.canceled) {
        // Preserve hash (e.g. #units) so the active tab state is reflected in the URL
        this.$router.replace({ path: this.$route.path, hash: this.$route.hash });
      }
    },
    /**
     * @desc Retry fetching plans after an error.
     * @returns {Promise<void>}
     */
    async retryFetchPlans() {
      this.error = null;
      try {
        await this.billingStore.fetchPlans();
      } catch (err) {
        console.error('Failed to load pricing plans:', err);
        this.error = 'Failed to load pricing. Please try again.';
      }
    },
    /**
     * @desc Handle plan selection — validate auth/org, detect downgrade, then create checkout session.
     * @param {Object} payload - { planId, priceId }
     * @returns {Promise<void>}
     */
    async onSelectPlan({ planId, priceId }) {
      // Guest -> redirect to sign-in with return URL
      if (!this.authStore.isLoggedIn) {
        this.$router.push({ path: '/signin', query: { redirect: '/pricing' } });
        return;
      }

      // Logged-in but no organization -> redirect to org setup
      if (this.authStore.serverConfig?.organizations?.enabled && !this.authStore.user?.currentOrganization) {
        this.$router.push({ path: '/organization-required' });
        return;
      }

      // Free plan -> no checkout needed
      if (!priceId || planId === 'free') return;

      // Downgrade detection — show confirmation dialog before proceeding
      const targetTier = this.planTierOrder.indexOf(planId);
      const currentTier = this.planTierOrder.indexOf(this.currentPlanId);
      if (targetTier !== -1 && currentTier !== -1 && targetTier < currentTier) {
        this.pendingDowngrade = { planId, priceId };
        this.downgradeDialog = true;
        return;
      }

      await this.proceedCheckout({ planId, priceId });
    },
    /**
     * @desc Confirm the pending downgrade and proceed to checkout.
     * @returns {Promise<void>}
     */
    async confirmDowngrade() {
      this.downgradeDialog = false;
      if (!this.pendingDowngrade) return;
      const payload = this.pendingDowngrade;
      this.pendingDowngrade = null;
      await this.proceedCheckout(payload);
    },
    /**
     * @desc Cancel the pending downgrade dialog.
     * @returns {void}
     */
    cancelDowngrade() {
      this.downgradeDialog = false;
      this.pendingDowngrade = null;
    },
    /**
     * @desc Create Stripe Checkout session and redirect.
     * @param {Object} payload - { planId, priceId }
     * @returns {Promise<void>}
     */
    async proceedCheckout({ priceId }) {
      this.checkoutLoading = true;
      try {
        const checkout = await this.billingStore.createCheckout(priceId);
        if (!checkout?.url) {
          throw new Error('Checkout session did not include a redirect URL.');
        }
        const parsed = new URL(checkout.url, window.location.origin);
        if (parsed.protocol === 'https:') {
          window.location.assign(parsed.toString());
        } else {
          console.error('Rejected non-HTTPS checkout URL');
        }
      } catch (err) {
        console.error('Failed to start checkout:', err);
        this.checkoutError = 'Failed to start checkout. Please try again.';
      } finally {
        this.checkoutLoading = false;
      }
    },
  },
};
</script>
