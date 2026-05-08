<template>
  <div>
    <!-- Hero + pricing wrapped in animated blur halo -->
    <homeBlurBackgroundComponent
      no-margin
      fit-content
      :background-colors="haloPalette.backgroundColors"
      :halo-colors="haloPalette.haloColors"
      :animation-speed="1"
    >
      <v-container class="py-12" :style="{ 'max-width': config.vuetify.theme.maxWidth }">
        <!-- Header -->
        <div class="text-center mb-10">
          <h1 class="text-display-small text-sm-display-medium text-md-display-large font-weight-bold mb-3 text-white">{{ header.title || $t('billing.pricing.title') }}</h1>
          <p class="text-body-large text-white" :style="{ opacity: 0.85 }">{{ header.subtitle || $t('billing.pricing.subtitle') }}</p>
        </div>

        <!-- Mode: subscription -->
        <template v-if="mode === 'subscription'">
          <BillingPricingToggleComponent
            v-if="hasPaidPlans"
            :annual="annual"
            :max-annual-savings-pct="maxAnnualSavingsPct"
            class="mb-10"
            data-test="pricing-toggle"
            @update:annual="annual = $event"
          />
          <v-row justify="center" data-test="pricing-plans-grid">
            <v-col v-for="plan in plans" :key="plan.id" cols="12" sm="6" md="4">
              <BillingPricingCardComponent
                :plan="plan"
                :annual="annual"
                :current="isCurrentPlan(plan.id)"
                :loading="checkoutLoading"
                :prices-loading="loading"
                :plan-name-map="planNameMap"
                :equivalences="meterMode && plan.equivalences && plan.equivalences.length > 0 ? plan.equivalences : null"
                @select="onSelectPlan"
              />
            </v-col>
          </v-row>
        </template>

        <!-- Mode: packs -->
        <template v-else-if="mode === 'packs'">
          <BillingPacksComponent data-test="pricing-packs-grid" />
        </template>

        <!-- Mode: both-tabs -->
        <template v-else-if="mode === 'both-tabs'">
          <div class="d-flex justify-center mb-8" data-test="pricing-tabs">
            <HomeTabsComponent
              :items="tabItems"
              :model-value="activeTab"
              color-mode="light"
              @update:model-value="activeTab = $event"
            />
          </div>
          <template v-if="activeTab === 0">
            <BillingPricingToggleComponent
              v-if="hasPaidPlans"
              :annual="annual"
              :max-annual-savings-pct="maxAnnualSavingsPct"
              class="mb-10"
              data-test="pricing-toggle"
              @update:annual="annual = $event"
            />
            <v-row justify="center" data-test="pricing-plans-grid">
              <v-col v-for="plan in plans" :key="plan.id" cols="12" sm="6" md="4">
                <BillingPricingCardComponent
                  :plan="plan"
                  :annual="annual"
                  :current="isCurrentPlan(plan.id)"
                  :loading="checkoutLoading"
                  :prices-loading="loading"
                  :plan-name-map="planNameMap"
                  :equivalences="meterMode && plan.equivalences && plan.equivalences.length > 0 ? plan.equivalences : null"
                  @select="onSelectPlan"
                />
              </v-col>
            </v-row>
          </template>
          <template v-else-if="activeTab === 1">
            <BillingPacksComponent data-test="pricing-packs-grid" />
          </template>
        </template>
      </v-container>
    </homeBlurBackgroundComponent>

    <!-- FAQ on standard background (contrast with halo section) -->
    <homeFaqComponent
      v-if="hasFaqs"
      :setup="faqSetup"
      data-test="pricing-faq"
    />

    <!-- Snackbars (portaled, top-right — matches stack convention from app.vue) -->
    <v-snackbar
      v-model="checkoutCanceled"
      color="info"
      :timeout="6000"
      location="top right"
    >
      {{ $t('billing.pricing.cancel.message') }}
      <template #actions>
        <v-btn variant="text" @click="checkoutCanceled = false">
          {{ $t('billing.snackbar.close') }}
        </v-btn>
      </template>
    </v-snackbar>

    <v-snackbar
      :model-value="!!error"
      color="warning"
      :timeout="-1"
      location="top right"
      @update:model-value="error = null"
    >
      {{ error }}
      <template #actions>
        <v-btn variant="text" @click="retryFetchPlans">
          {{ $t('billing.pricing.error.retry') }}
        </v-btn>
        <v-btn icon="fa-solid fa-xmark" variant="text" size="small" @click="error = null" />
      </template>
    </v-snackbar>

    <v-snackbar
      :model-value="!!checkoutError"
      color="error"
      :timeout="6000"
      location="top right"
      @update:model-value="checkoutError = null"
    >
      {{ checkoutError }}
    </v-snackbar>

    <!-- Dialogs (Vuetify portals them; top-level placement is fine) -->
    <v-dialog v-model="alreadyActiveDialog" max-width="480">
      <v-card class="pa-6">
        <div class="d-flex align-center mb-3">
          <v-icon icon="fa-solid fa-circle-check" color="success" size="small" class="mr-2" />
          <span class="text-title-medium font-weight-medium">{{ $t('billing.checkout.error.alreadyActive.title') }}</span>
        </div>
        <p class="text-body-medium text-medium-emphasis mb-6">{{ $t('billing.checkout.error.alreadyActive.message') }}</p>
        <div class="d-flex ga-3 justify-end">
          <v-btn variant="outlined" class="text-none text-body-medium" @click="alreadyActiveDialog = false">{{ $t('billing.checkout.error.alreadyActive.close') }}</v-btn>
          <v-btn v-if="alreadyActivePortalUrl" color="primary" variant="flat" class="text-none text-body-medium" :href="alreadyActivePortalUrl" target="_blank" rel="noopener noreferrer">{{ $t('billing.checkout.error.alreadyActive.cta') }}</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="downgradeDialog" max-width="480" @keydown.esc="cancelDowngrade">
      <v-card>
        <v-card-title class="text-title-medium font-weight-bold">{{ $t('billing.pricing.downgrade.title') }}</v-card-title>
        <v-card-text class="text-body-medium">{{ $t('billing.pricing.downgrade.message', { from: currentPlanName, to: pendingDowngradePlanName }) }}</v-card-text>
        <v-card-actions class="ga-2">
          <v-btn variant="text" class="text-none" @click="cancelDowngrade">{{ $t('billing.pricing.downgrade.cancel') }}</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" :loading="checkoutLoading" @click="confirmDowngrade">{{ $t('billing.pricing.downgrade.confirm') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useTheme } from 'vuetify';
import { useBillingStore, clearExtrasIntentId, clearExtrasIntentIds } from '../stores/billing.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import { usePricing } from '../composables/billing.usePricing.js';
import { validateStripeUrl } from '../lib/stripeRedirect';
import BillingPricingToggleComponent from '../components/billing.pricingToggle.component.vue';
import BillingPricingCardComponent from '../components/billing.pricingCard.component.vue';
import BillingPacksComponent from '../components/billing.packs.component.vue';
import homeFaqComponent from '../../home/components/home.faq.component.vue';
import HomeTabsComponent from '../../home/components/utils/home.tabs.component.vue';
import homeBlurBackgroundComponent from '../../home/components/utils/home.blur.background.component.vue';

export default {
  name: 'PricingView',
  components: {
    BillingPricingToggleComponent,
    BillingPricingCardComponent,
    BillingPacksComponent,
    homeFaqComponent,
    HomeTabsComponent,
    homeBlurBackgroundComponent,
  },
  setup() {
    const billingStore = useBillingStore();
    const authStore = useAuthStore();
    const pricing = usePricing();
    const theme = useTheme();
    return { billingStore, authStore, ...pricing, theme };
  },
  data() {
    return {
      annual: false,
      checkoutCanceled: false,
      checkoutLoading: false,
      checkoutError: null,
      error: null,
      activeTab: 0,
      downgradeDialog: false,
      pendingDowngrade: null,
      alreadyActiveDialog: false,
      alreadyActivePortalUrl: null,
    };
  },
  computed: {
    loading() {
      return this.billingStore.loading;
    },
    currentPlanId() {
      return this.billingStore.subscription?.plan ?? 'free';
    },
    meterMode() {
      return this.authStore.serverConfig?.billing?.meterMode === true;
    },
    hasPaidPlans() {
      return this.plans.some((p) => p.id !== 'free');
    },
    tabItems() {
      return [
        { id: 'plans', label: this.tabs?.plans || this.$t('billing.pricing.tabs.plans') },
        { id: 'units', label: this.tabs?.units || this.$t('billing.pricing.tabs.units') },
      ];
    },
    planTierOrder() {
      return this.plans.map((p) => p.id).filter(Boolean);
    },
    pendingDowngradePlanName() {
      if (!this.pendingDowngrade) return '';
      const plan = this.plans.find((p) => p.id === this.pendingDowngrade.planId);
      return plan?.name ?? this.pendingDowngrade.planId;
    },
    currentPlanName() {
      const plan = this.plans.find((p) => p.id === this.currentPlanId);
      return plan?.name ?? this.currentPlanId;
    },
    /**
     * @desc Build the setup object expected by HomeFaqComponent from static-content faqs.
     * @returns {Object}
     */
    faqSetup() {
      return {
        icon: 'fa-solid fa-circle-question',
        title: this.faqs?.title || this.$t('billing.pricing.faq.title'),
        subtitle: this.faqs?.subtitle || null,
        alignment: 'center',
        variant: 'default',
        columns: 1,
        content: this.faqs?.content || [],
      };
    },
    /**
     * @desc Build a flat {planId: planName} map for per-section parent name resolution.
     *       Passed to BillingPricingCardComponent so each feature section can independently
     *       resolve its own inheritsFrom plan name.
     * @returns {Object.<string, string>}
     */
    planNameMap() {
      return Object.fromEntries(this.plans.filter((p) => p.id && p.name).map((p) => [p.id, p.name]));
    },
    /**
     * @desc Pick halo palette based on current Vuetify theme (light vs dark).
     *       Uses config-driven colors when provided; falls back to default brand palettes.
     * @returns {{ backgroundColors: string[], haloColors: string[] }}
     */
    haloPalette() {
      const isDark = this.theme.global.name.value === 'dark';
      const fromConfig = isDark ? this.halo?.dark : this.halo?.light;
      if (fromConfig?.backgroundColors && fromConfig?.haloColors) return fromConfig;
      return isDark
        ? {
            backgroundColors: ['#0a0a1a', '#1a1a3e', '#2d2d6b', '#3d3d8a', '#2563eb'],
            haloColors: ['#4f46e5', '#7c3aed', '#2563eb', '#6366f1', '#8b5cf6'],
          }
        : {
            backgroundColors: ['#4a90c2', '#3d7eb0', '#2d6a9e', '#1e5a8c', '#164578'],
            haloColors: ['#0891b2', '#0ea5e9', '#3b82f6', '#0284c7', '#0369a1'],
          };
    },
  },
  async created() {
    try {
      await this.billingStore.fetchPlans();
    } catch (err) {
      console.error('Failed to load pricing plans:', err);
      this.error = this.$t('billing.pricing.error.loadFailed');
    }

    const orgsEnabled = this.authStore.serverConfig?.organizations?.enabled;
    const hasOrg = !!this.authStore.user?.currentOrganization;
    if (this.authStore.isLoggedIn && (!orgsEnabled || hasOrg)) {
      this.billingStore.fetchSubscription().catch((err) => {
        console.error('Failed to load subscription:', err);
      });
    }

    // Handle Stripe redirect query params
    const { canceled, type, pack } = this.$route.query;
    if (canceled === 'true') {
      this.checkoutCanceled = true;
      // Extras cancel-redirect: drop the persisted per-pack intentId so a retry
      // generates a fresh UUID.
      if (type === 'extras') {
        if (pack) clearExtrasIntentId(pack);
        else clearExtrasIntentIds();
        this.$router.replace({ path: this.$route.path, hash: this.$route.hash, query: { canceled: 'true' } });
      }
    }
    if (this.$route.hash === '#units') this.activeTab = 1;
  },
  methods: {
    isCurrentPlan(planId) {
      return this.currentPlanId === planId;
    },
    async retryFetchPlans() {
      this.error = null;
      try {
        await this.billingStore.fetchPlans();
      } catch (err) {
        console.error('Failed to load pricing plans:', err);
        this.error = this.$t('billing.pricing.error.loadFailed');
      }
    },
    /**
     * @desc Handle plan select event from card.
     * @param {{ planId: string, priceId: string|null, intent?: 'signup' }} payload
     * @returns {Promise<void>}
     */
    async onSelectPlan({ planId, priceId, intent }) {
      // Free + guest → route to signup
      if (intent === 'signup') {
        this.$router.push({ path: '/signup', query: { redirect: '/pricing' } });
        return;
      }
      if (!this.authStore.isLoggedIn) {
        this.$router.push({ path: '/signin', query: { redirect: '/pricing' } });
        return;
      }
      if (this.authStore.serverConfig?.organizations?.enabled && !this.authStore.user?.currentOrganization) {
        this.$router.push({ path: '/organization-required' });
        return;
      }
      if (!priceId || planId === 'free') return;

      const targetTier = this.planTierOrder.indexOf(planId);
      const currentTier = this.planTierOrder.indexOf(this.currentPlanId);
      if (targetTier !== -1 && currentTier !== -1 && targetTier < currentTier) {
        this.pendingDowngrade = { planId, priceId };
        this.downgradeDialog = true;
        return;
      }
      await this.proceedCheckout({ planId, priceId });
    },
    async confirmDowngrade() {
      this.downgradeDialog = false;
      if (!this.pendingDowngrade) return;
      const payload = this.pendingDowngrade;
      this.pendingDowngrade = null;
      await this.proceedCheckout(payload);
    },
    cancelDowngrade() {
      this.downgradeDialog = false;
      this.pendingDowngrade = null;
    },
    async proceedCheckout({ priceId }) {
      this.checkoutLoading = true;
      try {
        const checkout = await this.billingStore.createCheckout(priceId);
        if (!checkout?.url) throw new Error('Checkout session did not include a redirect URL.');
        window.location.assign(validateStripeUrl(checkout.url));
      } catch (err) {
        if (err.code === 'subscription_already_active') {
          this.alreadyActivePortalUrl = null;
          if (err.portalUrl) {
            try { this.alreadyActivePortalUrl = validateStripeUrl(err.portalUrl); } catch { /* invalid URL — link hidden */ }
          }
          this.alreadyActiveDialog = true;
          return;
        }
        console.error('Failed to start checkout:', err);
        this.checkoutError = this.$t('billing.pricing.error.checkoutFailed');
      } finally {
        this.checkoutLoading = false;
      }
    },
  },
};
</script>
