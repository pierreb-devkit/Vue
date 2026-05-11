<!--
  BillingPricingCardComponent
  ===========================
  Displays a single pricing plan card with name, price, features/sections/equivalences, and CTA.

  USAGE (legacy — flat feature list, backward-compat):
  <BillingPricingCardComponent :plan="planWithFlatFeatures" />

  USAGE (V2 — sectioned features):
  <BillingPricingCardComponent
    :plan="planWithSections"
    :parent-plan-name="parentName"
    :annual="false" />

  USAGE (meter mode — equivalences):
  <BillingPricingCardComponent :plan="plan" :equivalences="[{ kind, count, label }]" />

  PROPS:
  - plan            (Object, required): Plan with id, name, tagline, features|featureSections, cta, prices, etc.
  - annual          (Boolean): Annual billing toggle state
  - current         (Boolean): Whether this is the user's current plan
  - loading         (Boolean): Whether a checkout is in progress (disables CTA)
  - pricesLoading   (Boolean): Whether Stripe-backed prices are still loading
  - equivalences    (Array, optional): When provided, replaces the feature list with equivalence bullets
  - parentPlanName  (String, optional): For "Everything in {parent}, plus" semantics in featureSections

  EVENTS:
  - select (Object): { planId, priceId } emitted on CTA click
-->
<template>
  <v-card
    :class="['billing-pricing-card pa-6', config.vuetify.theme.rounded, { 'billing-pricing-card--highlighted': plan.highlighted }]"
    :flat="config.vuetify.theme.flat"
    :elevation="plan.highlighted ? 8 : 1"
    height="100%"
  >
    <!-- Badge -->
    <v-chip
      v-if="plan.badge"
      color="primary"
      variant="flat"
      size="small"
      class="billing-pricing-card__badge"
    >
      {{ plan.badge }}
    </v-chip>

    <!-- Plan name & tagline -->
    <h3 class="text-headline-small font-weight-bold mb-1">{{ plan.name }}</h3>
    <p class="text-body-medium text-medium-emphasis mb-5">{{ plan.tagline }}</p>

    <!-- Price -->
    <div class="mb-2">
      <template v-if="isFree">
        <span class="text-display-small font-weight-bold">{{ $t('billing.pricingCard.free') }}</span>
      </template>
      <template v-else-if="pricesLoading && displayPrice === null">
        <v-skeleton-loader type="text" class="billing-pricing-card__price-skeleton" />
      </template>
      <template v-else-if="displayPrice !== null">
        <span class="text-display-small font-weight-bold">{{ formatPrice(displayPrice) }}</span>
        <span class="text-body-medium text-medium-emphasis">{{ $t('billing.period.' + (annual ? 'year' : 'month')) }}</span>
      </template>
      <template v-else>
        <span class="text-title-medium text-medium-emphasis">{{ $t('billing.pricing.error.pricingUnavailable') }}</span>
      </template>
    </div>

    <!-- Annual savings chip (inline, only when annual + savings > 0) -->
    <div v-if="annual && annualSavingsPct > 0" class="mb-4">
      <v-chip color="secondary" variant="tonal" size="small">
        {{ $t('billing.pricingCard.saveAnnual', { pct: annualSavingsPct }) }}
      </v-chip>
    </div>
    <div v-else class="mb-4" style="min-height: 24px"><!-- spacer to keep layout consistent --></div>

    <!-- CTA -->
    <div class="mb-6">
      <template v-if="!current">
        <v-tooltip
          v-if="pricingUnavailable"
          :text="$t('billing.pricing.error.pricingTemporarilyUnavailable')"
          location="top"
        >
          <template #activator="{ props: tooltipProps }">
            <span v-bind="tooltipProps" class="d-block">
              <v-btn
                block
                :variant="plan.highlighted ? 'flat' : 'outlined'"
                :color="plan.highlighted ? 'primary' : undefined"
                :class="config.vuetify.theme.rounded"
                class="text-none font-weight-bold"
                size="large"
                disabled
              >
                {{ effectiveCtaLabel }}
              </v-btn>
            </span>
          </template>
        </v-tooltip>
        <v-btn
          v-else
          block
          :variant="plan.highlighted ? 'flat' : 'outlined'"
          :color="plan.highlighted ? 'primary' : undefined"
          :class="config.vuetify.theme.rounded"
          class="text-none font-weight-bold"
          size="large"
          :loading="loading"
          :disabled="ctaDisabled"
          @click="selectPlan"
        >
          {{ effectiveCtaLabel }}
        </v-btn>
      </template>
      <v-btn
        v-else
        block
        variant="tonal"
        color="success"
        :class="config.vuetify.theme.rounded"
        class="text-none font-weight-bold"
        size="large"
        disabled
      >
        {{ $t('billing.pricingCard.currentPlan') }}
      </v-btn>
    </div>

    <!-- Equivalences (meter mode — structured) — renders ABOVE features when present -->
    <BillingEquivalencesChipsComponent
      v-if="isStructuredEquivalences"
      :equivalences="equivalences"
      class="mb-3"
    />

    <!-- Equivalences (meter mode — legacy flat) — renders ABOVE features when present -->
    <v-list
      v-else-if="equivalences && equivalences.length > 0"
      density="compact"
      bg-color="transparent"
      class="pa-0 mb-3"
    >
      <v-list-item
        v-for="equiv in equivalences"
        :key="equiv.label"
        class="px-0"
      >
        <template #prepend>
          <v-icon icon="fa-solid fa-tilde" color="primary" size="small" class="mr-3" />
        </template>
        <v-list-item-title>~{{ equiv.count }} {{ equiv.label }}</v-list-item-title>
      </v-list-item>
    </v-list>

    <!-- Sectioned features (always renders when sections present, independent of equivalences) -->
    <template v-if="hasSections">
      <BillingPricingFeatureSectionComponent
        v-for="(section, idx) in plan.featureSections"
        :key="`section-${idx}`"
        :section="section"
        :parent-plan-name="planNameMap && section.inheritsFrom ? planNameMap[section.inheritsFrom] || null : parentPlanName"
        class="mb-3"
      />
    </template>

    <!-- Flat features (backward-compat — only when no sections) -->
    <v-list v-else-if="plan.features && plan.features.length > 0" density="compact" bg-color="transparent" class="pa-0">
      <v-list-item
        v-for="feature in plan.features"
        :key="feature.text"
        class="px-0"
      >
        <template #prepend>
          <v-icon
            :icon="feature.included ? 'fa-solid fa-check' : 'fa-solid fa-xmark'"
            :color="feature.included ? 'success' : 'grey'"
            size="small"
            class="mr-3"
          />
        </template>
        <v-list-item-title :class="{ 'text-medium-emphasis': !feature.included }">
          {{ feature.text }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>
/**
 * Module dependencies.
 */
import BillingEquivalencesChipsComponent from './billing.equivalencesChips.component.vue';
import BillingPricingFeatureSectionComponent from './billing.pricingFeatureSection.component.vue';
import { useCurrencyFormat } from '../composables/billing.useCurrencyFormat.js';
import { computeAnnualSavingsPct } from '../lib/pricingMath.js';
import { useAuthStore } from '../../auth/stores/auth.store.js';

/**
 * Component definition.
 */
export default {
  name: 'BillingPricingCardComponent',
  components: {
    BillingEquivalencesChipsComponent,
    BillingPricingFeatureSectionComponent,
  },
  props: {
    plan: { type: Object, required: true },
    annual: { type: Boolean, default: false },
    current: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    pricesLoading: { type: Boolean, default: false },
    /**
     * @desc Optional meter-mode equivalences. When provided, renders a bullet list of
     * "~{count} {label}" items instead of the legacy feature list.
     * @type {Array<{label: string, count: number}>}
     */
    equivalences: { type: Array, default: null },
    /**
     * @desc Display name of the parent plan — used as a fallback when planNameMap is absent.
     *       Kept for backward compat; prefer planNameMap for multi-section plans.
     * @type {string|null}
     */
    parentPlanName: { type: String, default: null },
    /**
     * @desc Map of planId → planName for all plans on the page.
     *       Allows each feature section to resolve its own inheritsFrom independently.
     *       When absent, falls back to the parentPlanName prop (single-section compat).
     * @type {Object.<string, string>|null}
     */
    planNameMap: { type: Object, default: null },
  },
  emits: ['select'],
  /**
   * @desc Inject currency formatter and auth store.
   * @returns {{ formatPrice: Function, authStore: Object }}
   */
  setup() {
    const { formatPrice } = useCurrencyFormat();
    const authStore = useAuthStore();
    return { formatPrice, authStore };
  },
  computed: {
    /**
     * @desc Whether the equivalences array contains structured {kind, count, label} objects
     * (Phase 3 format). Falls back to the legacy flat list when objects lack a `kind` field.
     * @returns {boolean}
     */
    isStructuredEquivalences() {
      return (
        Array.isArray(this.equivalences) &&
        this.equivalences.length > 0 &&
        this.equivalences[0] !== null &&
        typeof this.equivalences[0] === 'object' &&
        this.equivalences[0]?.kind != null
      );
    },
    /**
     * @desc Whether the visiting user is a guest (not signed-in).
     * @returns {boolean}
     */
    isGuest() {
      return !this.authStore.isLoggedIn;
    },
    /**
     * @desc CTA label — Free plan + guest → i18n "Sign up", else plan.cta.
     * @returns {string}
     */
    effectiveCtaLabel() {
      if (this.isFree && this.isGuest) return this.$t('billing.pricingCard.signUpCta');
      return this.plan.cta;
    },
    /**
     * @desc Whether this plan is explicitly free (by ID convention).
     * @returns {boolean}
     */
    isFree() {
      return this.plan.id === 'free';
    },
    /**
     * @desc Whether the plan has non-empty featureSections (preferred over flat features).
     * @returns {boolean}
     */
    hasSections() {
      return Array.isArray(this.plan.featureSections) && this.plan.featureSections.length > 0;
    },
    /**
     * @desc Annual savings percentage via pricingMath helper.
     * Normalises the 3 possible price shapes (PriceObject.amount, Price.amount,
     * plain number) to plain numbers before delegating to the pure helper,
     * which only understands numbers.
     * @returns {number} Integer 0-100
     */
    annualSavingsPct() {
      // Normalize the 3 possible price shapes to plain numbers before delegating
      // to the pure helper (which only understands numbers).
      const monthlyPrice =
        this.plan.monthlyPriceObject?.amount
        ?? this.plan.monthlyPrice?.amount
        ?? (typeof this.plan.monthlyPrice === 'number' ? this.plan.monthlyPrice : 0);
      const annualPrice =
        this.plan.annualPriceObject?.amount
        ?? this.plan.annualPrice?.amount
        ?? (typeof this.plan.annualPrice === 'number' ? this.plan.annualPrice : 0);
      return computeAnnualSavingsPct({ monthlyPrice, annualPrice });
    },
    /**
     * @desc Get the price amount to display based on billing interval.
     * Resolution order (most specific → fallback):
     *   1. *PriceObject.amount  — new V2 field (Stripe object unpacked by usePricing)
     *   2. *Price.amount        — legacy field format used by existing callers
     *   3. *Price (plain num)   — static fallback when Stripe data hasn't resolved
     * @returns {number|null}
     */
    displayPrice() {
      if (this.annual) {
        if (this.plan.annualPriceObject?.amount != null) return this.plan.annualPriceObject.amount;
        if (this.plan.annualPrice?.amount != null) return this.plan.annualPrice.amount;
        if (typeof this.plan.annualPrice === 'number' && this.plan.annualPrice > 0) return this.plan.annualPrice;
      } else {
        if (this.plan.monthlyPriceObject?.amount != null) return this.plan.monthlyPriceObject.amount;
        if (this.plan.monthlyPrice?.amount != null) return this.plan.monthlyPrice.amount;
        if (typeof this.plan.monthlyPrice === 'number' && this.plan.monthlyPrice > 0) return this.plan.monthlyPrice;
      }
      return null;
    },
    /**
     * @desc Get the active Stripe price ID for checkout.
     * Resolution order: *PriceObject.id → *Price.id (legacy)
     * @returns {string|null}
     */
    activePriceId() {
      if (this.annual) {
        if (this.plan.annualPriceObject?.id) return this.plan.annualPriceObject.id;
        if (this.plan.annualPrice?.id) return this.plan.annualPrice.id;
      } else {
        if (this.plan.monthlyPriceObject?.id) return this.plan.monthlyPriceObject.id;
        if (this.plan.monthlyPrice?.id) return this.plan.monthlyPrice.id;
      }
      return null;
    },
    /**
     * @desc Whether paid Stripe pricing failed to resolve after loading finished.
     * @returns {boolean}
     */
    pricingUnavailable() {
      return !this.pricesLoading && !this.isFree && !this.activePriceId;
    },
    /**
     * @desc Whether the CTA should be disabled.
     * Free + guest is always actionable (routes to signup) — never disabled.
     * @returns {boolean}
     */
    ctaDisabled() {
      // Free + guest is always actionable (routes to signup) — never disabled
      if (this.isFree && this.isGuest) return false;
      return this.loading || (!this.isFree && !this.activePriceId);
    },
  },
  methods: {
    /**
     * @desc Emit a plan selection when the CTA is actionable.
     * Free plan + guest → emit different shape so the view can route to /signup.
     * @returns {void}
     */
    selectPlan() {
      if (this.ctaDisabled) return;
      // Free plan + guest → emit different shape so the view can route to /signup
      if (this.isFree && this.isGuest) {
        this.$emit('select', { planId: this.plan.id, priceId: null, intent: 'signup' });
        return;
      }
      this.$emit('select', { planId: this.plan.id, priceId: this.activePriceId });
    },
  },
};
</script>

<style scoped>
.billing-pricing-card {
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: visible; /* allow "Most Popular" badge to float above card top edge */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* Vuetify v-card sets overflow:hidden internally — target its inner wrappers too */
.billing-pricing-card :deep(.v-card__overlay),
.billing-pricing-card :deep(.v-card__underlay) {
  overflow: visible;
}

.billing-pricing-card__badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  padding: 0 14px;
  height: 28px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.billing-pricing-card:hover {
  transform: translateY(-4px);
}

/* Highlighted card: chip badge alone signals "Most Popular" — no outline needed */

.billing-pricing-card__price-skeleton {
  max-width: 8rem;
}

@media (prefers-reduced-motion: reduce) {
  .billing-pricing-card:hover { transform: none; }
}
</style>
