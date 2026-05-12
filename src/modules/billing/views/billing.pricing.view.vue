<template>
  <div>
    <!-- Hero + pricing wrapped in animated blur halo -->
    <homeBlurBackgroundComponent
      no-margin
      full-bleed
      fit-content
      :background-colors="haloPalette.backgroundColors"
      :halo-colors="haloPalette.haloColors"
      :animation-speed="1"
    >
      <v-container class="py-12" :style="{ 'max-width': config.vuetify.theme.maxWidth }">
        <!-- Header -->
        <div class="text-center mb-10">
          <h1 class="text-display-small text-sm-display-medium text-md-display-large font-weight-bold mb-3 text-white">{{ header.title || 'Pricing' }}</h1>
          <p class="text-body-large text-white" :style="{ opacity: 0.85 }">{{ header.subtitle || 'Choose the plan that fits your needs.' }}</p>
        </div>

        <!-- Mode: subscription -->
        <template v-if="mode === 'subscription'">
          <BillingPricingToggleComponent
            v-if="hasPaidPlans"
            :annual="annual"
            class="mb-10"
            data-test="pricing-toggle"
            @update:annual="annual = $event"
          />
          <v-row justify="center" data-test="pricing-plans-grid">
            <v-col v-for="item in resolvedPlanItems" :key="item.id" cols="12" sm="6" md="4">
              <BillingCardComponent
                :item="item"
                @cta-click="onCtaClick"
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
          <div class="d-flex justify-center mb-6" data-test="pricing-tabs">
            <HomeTabsComponent
              :items="tabItems"
              :model-value="activeTab"
              color-mode="light"
              @update:model-value="activeTab = $event"
            />
          </div>
          <BillingPricingToggleComponent
            v-if="hasPaidPlans"
            :annual="annual"
            :disabled="activeTab === 1"
            class="mb-8"
            data-test="pricing-toggle"
            @update:annual="annual = $event"
          />
          <template v-if="activeTab === 0">
            <v-row justify="center" data-test="pricing-plans-grid">
              <v-col v-for="item in resolvedPlanItems" :key="item.id" cols="12" sm="6" md="4">
                <BillingCardComponent
                  :item="item"
                  @cta-click="onCtaClick"
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
      Checkout was canceled. You can try again whenever you are ready.
      <template #actions>
        <v-btn variant="text" @click="checkoutCanceled = false">
          Close
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
          Retry
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
          <span class="text-title-medium font-weight-medium">Subscription already active</span>
        </div>
        <p class="text-body-medium text-medium-emphasis mb-6">You already have an active subscription. Manage it via the Customer Portal.</p>
        <div class="d-flex ga-3 justify-end">
          <v-btn variant="outlined" class="text-none text-body-medium" @click="alreadyActiveDialog = false">Close</v-btn>
          <v-btn v-if="alreadyActivePortalUrl" color="primary" variant="flat" class="text-none text-body-medium" :href="alreadyActivePortalUrl" target="_blank" rel="noopener noreferrer">Open Customer Portal</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="downgradeDialog" max-width="480" @keydown.esc="cancelDowngrade">
      <v-card>
        <v-card-title class="text-title-medium font-weight-bold">Confirm plan change</v-card-title>
        <v-card-text class="text-body-medium">{{ `You're switching from ${currentPlanName} to ${pendingDowngradePlanName}. Stripe will pro-rate the difference. Quota will reset at next billing cycle.` }}</v-card-text>
        <v-card-actions class="ga-2">
          <v-btn variant="text" class="text-none" @click="cancelDowngrade">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" :loading="checkoutLoading" @click="confirmDowngrade">Continue to checkout</v-btn>
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
import { useCurrencyFormat } from '../composables/billing.useCurrencyFormat.js';
import { validateStripeUrl } from '../lib/stripeRedirect';
import { computeAnnualSavingsPct } from '../lib/pricingMath.js';
import BillingPricingToggleComponent from '../components/billing.pricingToggle.component.vue';
import BillingCardComponent from '../components/billing.card.component.vue';
import BillingPacksComponent from '../components/billing.packs.component.vue';
import homeFaqComponent from '../../home/components/home.faq.component.vue';
import HomeTabsComponent from '../../home/components/utils/home.tabs.component.vue';
import homeBlurBackgroundComponent from '../../home/components/utils/home.blur.background.component.vue';

export default {
  name: 'PricingView',
  components: {
    BillingPricingToggleComponent,
    BillingCardComponent,
    BillingPacksComponent,
    homeFaqComponent,
    HomeTabsComponent,
    homeBlurBackgroundComponent,
  },
  setup() {
    const billingStore = useBillingStore();
    const authStore = useAuthStore();
    const pricing = usePricing();
    const { formatPrice } = useCurrencyFormat();
    const theme = useTheme();
    return { billingStore, authStore, ...pricing, formatPrice, theme };
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
      if (!this.authStore.isLoggedIn) return null;
      return this.billingStore.subscription?.plan ?? 'free';
    },
    hasPaidPlans() {
      return this.plans.some((p) => p.id !== 'free');
    },
    tabItems() {
      return [
        { id: 'plans', label: this.tabs?.plans || 'Plans' },
        { id: 'units', label: this.tabs?.units || 'Units' },
      ];
    },
    planTierOrder() {
      return this.plans.map((p) => p.id).filter(Boolean);
    },
    pendingDowngradePlanName() {
      if (!this.pendingDowngrade) return '';
      const plan = this.plans.find((p) => p.id === this.pendingDowngrade.planId);
      return plan?.title ?? this.pendingDowngrade.planId;
    },
    currentPlanName() {
      const plan = this.plans.find((p) => p.id === this.currentPlanId);
      return plan?.title ?? this.currentPlanId;
    },
    /**
     * @desc Whether the user is a guest (not signed-in).
     * @returns {boolean}
     */
    isGuest() {
      return !this.authStore.isLoggedIn;
    },

    /**
     * @desc Build fully-resolved BillingCardComponent items from plans (V4 unified schema).
     * This is the single place where auth state + subscription state + Stripe prices
     * are combined into a flat item object the card can render without any internal logic.
     *
     * V4 plans carry `title`, `subtitle`, `price`, `highlight` directly.
     * Raw Stripe prices (annualPriceObject / monthlyPriceObject) from usePricing()
     * override the static-content price when available (billing interval aware).
     * @returns {Array<Object>}
     */
    resolvedPlanItems() {
      return this.plans.map((plan) => {
        const isFree = plan.id === 'free';
        const isCurrent = this.isCurrentPlan(plan.id);

        // Raw Stripe price from usePricing() composable (may be absent for free plan)
        const activePriceId = this.annual
          ? (plan.annualPriceObject?.id ?? plan.annualPrice?.id ?? null)
          : (plan.monthlyPriceObject?.id ?? plan.monthlyPrice?.id ?? null);

        // Resolve price display — Stripe price objects (when present) override static-content amounts.
        // Supports BOTH plan shapes:
        //  - V4 (Trawl downstream): plan.meta.{monthlyPrice,annualPrice} (raw numbers)
        //  - Devkit (post usePricing normalization): plan.{monthlyPrice,annualPrice} (raw numbers)
        let priceAmount;
        let pricePeriod = null;
        if (isFree) {
          priceAmount = 'Free';
        } else {
          const staticMonthly = (typeof plan.monthlyPrice === 'number' ? plan.monthlyPrice : null) ?? plan.meta?.monthlyPrice ?? null;
          const staticAnnual = (typeof plan.annualPrice === 'number' ? plan.annualPrice : null) ?? plan.meta?.annualPrice ?? null;
          const displayAmt = this.annual
            ? (plan.annualPriceObject?.amount ?? (typeof staticAnnual === 'number' && staticAnnual > 0 ? staticAnnual : null))
            : (plan.monthlyPriceObject?.amount ?? (typeof staticMonthly === 'number' && staticMonthly > 0 ? staticMonthly : null));
          if (displayAmt != null) {
            priceAmount = this.formatPrice(displayAmt);
            pricePeriod = this.annual ? '/year' : '/month';
          } else {
            priceAmount = 'Pricing unavailable';
          }
        }

        // Resolve CTA
        const pricingUnavailable = !this.loading && !isFree && !activePriceId;
        let ctaLabel, ctaVariant, ctaColor, ctaDisabled, ctaTo;

        if (isCurrent) {
          ctaLabel = 'Current Plan';
          ctaVariant = 'tonal';
          ctaColor = 'success';
          ctaDisabled = true;
          ctaTo = null;
        } else if (isFree && this.isGuest) {
          ctaLabel = 'Sign up';
          ctaVariant = 'outlined';
          ctaColor = null;
          ctaDisabled = false;
          // Preserve the `redirect` query param so the user lands back on the pricing
          // page after signup. v-btn's :to accepts the same shape as $router.push().
          // The card skips its cta-click emit when cta.to is set (router-link owns
          // the navigation), so the view's onCtaClick fallback is intentionally bypassed.
          ctaTo = { path: '/signup', query: { redirect: '/pricing' } };
        } else {
          ctaLabel = plan.cta;
          ctaVariant = plan.highlight ? 'flat' : 'outlined';
          ctaColor = plan.highlight ? 'primary' : null;
          ctaDisabled = pricingUnavailable || this.checkoutLoading || (!isFree && !activePriceId);
          ctaTo = null;
        }

        // Annual savings — rendered as a tonal chip next to the price on annual when discount > 0.
        // Supports BOTH plan shapes:
        //  - V4 (Trawl downstream): plan.meta.monthlyPrice / plan.meta.annualPrice (raw numbers)
        //  - Devkit (post usePricing normalization): plan.monthlyPrice / plan.annualPrice (raw numbers)
        const annualSavingsPct = (() => {
          const metaM = plan.meta?.monthlyPrice ?? null;
          const metaA = plan.meta?.annualPrice ?? null;
          const mp = plan.monthlyPriceObject?.amount ?? (typeof plan.monthlyPrice === 'number' ? plan.monthlyPrice : (typeof metaM === 'number' ? metaM : 0));
          const ap = plan.annualPriceObject?.amount ?? (typeof plan.annualPrice === 'number' ? plan.annualPrice : (typeof metaA === 'number' ? metaA : 0));
          return computeAnnualSavingsPct({ monthlyPrice: mp, annualPrice: ap });
        })();
        const priceChip = (this.annual && annualSavingsPct > 0)
          ? { text: this.$t('billing.pricingCard.saveAnnual', { pct: annualSavingsPct }), color: 'success' }
          : null;

        return {
          id: plan.id,
          title: plan.title,
          subtitle: plan.subtitle,
          price: { amount: priceAmount, period: pricePeriod, chip: priceChip },
          cta: {
            label: ctaLabel,
            variant: ctaVariant,
            color: ctaColor,
            disabled: ctaDisabled,
            loading: !isCurrent && this.checkoutLoading,
            to: ctaTo,
          },
          info: plan.info || null,
          features: plan.features || [],
          badge: plan.badge || null,
          highlight: !!plan.highlight,
          // Internal field — view's onCtaClick resolves priceId from here, not consumed by card.
          _activePriceId: activePriceId,
        };
      });
    },

    /**
     * @desc Build the setup object expected by HomeFaqComponent from static-content faqs.
     * @returns {Object}
     */
    faqSetup() {
      return {
        icon: 'fa-solid fa-circle-question',
        title: this.faqs?.title || 'Frequently asked questions',
        subtitle: this.faqs?.subtitle || null,
        alignment: 'center',
        variant: 'default',
        columns: 1,
        content: this.faqs?.content || [],
      };
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
      this.error = 'Failed to load pricing. Please try again.';
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
        this.error = 'Failed to load pricing. Please try again.';
      }
    },
    /**
     * @desc Handle CTA click from BillingCardComponent.
     * Resolves active priceId from the computed resolvedPlanItems list.
     * @param {{ id: string }} payload
     * @returns {Promise<void>}
     */
    async onCtaClick({ id: planId }) {
      const resolvedItem = this.resolvedPlanItems.find((item) => item.id === planId);
      if (!resolvedItem) return;

      const { _activePriceId: priceId } = resolvedItem;

      // Free + guest — CTA has `to: '/signup'` so router-link handles navigation;
      // if click fires anyway (e.g. programmatic), guard here too.
      if (planId === 'free' && this.isGuest) {
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
        this.checkoutError = 'Failed to start checkout. Please try again.';
      } finally {
        this.checkoutLoading = false;
      }
    },
  },
};
</script>
