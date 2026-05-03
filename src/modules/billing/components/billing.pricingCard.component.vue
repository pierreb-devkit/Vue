<!--
  BillingPricingCardComponent
  ===========================
  Displays a single pricing plan card with name, price, features/equivalences, and CTA.

  USAGE (legacy — feature list):
  <BillingPricingCardComponent :plan="plan" :annual="false" :current="false" @select="onSelect" />

  USAGE (meter mode — equivalences):
  <BillingPricingCardComponent
    :plan="plan"
    :equivalences="[{ label: 'operations / week', count: 500 }]"
    @select="onSelect"
  />

  PROPS:
  - plan         (Object, required): Plan object with id, name, tagline, features, highlighted, badge, cta, monthlyPrice, annualPrice
  - annual       (Boolean): Whether annual billing is selected
  - current      (Boolean): Whether this is the user's current plan
  - loading      (Boolean): Whether a checkout is in progress (disables CTA)
  - equivalences (Array<{label: String, count: Number}>, optional): When provided, renders equivalence bullets instead of feature list

  EVENTS:
  - select (Object): Emitted with { planId, priceId } when CTA is clicked
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
      class="billing-pricing-card__badge mb-4"
    >
      {{ plan.badge }}
    </v-chip>

    <!-- Plan name & tagline -->
    <h3 class="text-headline-small font-weight-bold mb-1">{{ plan.name }}</h3>
    <p class="text-body-medium text-medium-emphasis mb-5">{{ plan.tagline }}</p>

    <!-- Price -->
    <div class="mb-6">
      <template v-if="isFree">
        <span class="text-display-small font-weight-bold">Free</span>
      </template>
      <template v-else-if="pricesLoading && displayPrice === null">
        <v-skeleton-loader
          type="text"
          class="billing-pricing-card__price-skeleton"
        />
      </template>
      <template v-else-if="displayPrice !== null">
        <span class="text-display-small font-weight-bold">${{ displayPrice }}</span>
        <span class="text-body-medium text-medium-emphasis"> / {{ annual ? 'year' : 'month' }}</span>
      </template>
      <template v-else>
        <span class="text-title-medium text-medium-emphasis">Pricing unavailable</span>
      </template>
    </div>

    <!-- CTA -->
    <div class="mb-6">
      <template v-if="!current">
        <v-tooltip
          v-if="pricingUnavailable"
          text="Pricing temporarily unavailable"
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
                {{ plan.cta }}
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
          {{ plan.cta }}
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
        Current Plan
      </v-btn>
    </div>

    <!-- Equivalences (meter mode — structured {kind, count, label} objects) -->
    <BillingEquivalencesChipsComponent
      v-if="isStructuredEquivalences"
      :equivalences="equivalences"
    />

    <!-- Equivalences (meter mode — legacy flat {count, label} list) -->
    <v-list
      v-else-if="equivalences && equivalences.length > 0"
      density="compact"
      bg-color="transparent"
      class="pa-0"
    >
      <v-list-item
        v-for="equiv in equivalences"
        :key="equiv.label"
        class="px-0"
      >
        <template #prepend>
          <v-icon
            icon="fa-solid fa-tilde"
            color="primary"
            size="small"
            class="mr-3"
          ></v-icon>
        </template>
        <v-list-item-title>
          ~{{ equiv.count }} {{ equiv.label }}
        </v-list-item-title>
      </v-list-item>
    </v-list>

    <!-- Features (legacy mode) — rendered when equivalences is absent or empty -->
    <v-list
      v-else
      density="compact"
      bg-color="transparent"
      class="pa-0"
    >
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
          ></v-icon>
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

/**
 * Component definition.
 */
export default {
  name: 'BillingPricingCardComponent',
  components: {
    BillingEquivalencesChipsComponent,
  },
  props: {
    plan: {
      type: Object,
      required: true,
    },
    annual: {
      type: Boolean,
      default: false,
    },
    current: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    pricesLoading: {
      type: Boolean,
      default: false,
    },
    /**
     * @desc Optional meter-mode equivalences. When provided, renders a bullet list of
     * "~{count} {label}" items instead of the legacy feature list.
     * @type {Array<{label: string, count: number}>}
     */
    equivalences: {
      type: Array,
      default: null,
    },
  },
  emits: ['select'],
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
        typeof this.equivalences[0] === 'object' &&
        this.equivalences[0]?.kind != null
      );
    },
    /**
     * @desc Whether this plan is explicitly free (by ID convention).
     * @returns {boolean}
     */
    isFree() {
      return this.plan.id === 'free';
    },
    /**
     * @desc Get the price to display based on billing interval.
     * @returns {number|null} Price amount or null when price is unavailable
     */
    displayPrice() {
      if (this.annual && this.plan.annualPrice) return this.plan.annualPrice.amount;
      if (!this.annual && this.plan.monthlyPrice) return this.plan.monthlyPrice.amount;
      return null;
    },
    /**
     * @desc Get the active Stripe price ID for checkout.
     * @returns {string|null} Stripe price ID
     */
    activePriceId() {
      if (this.annual && this.plan.annualPrice) return this.plan.annualPrice.id;
      if (!this.annual && this.plan.monthlyPrice) return this.plan.monthlyPrice.id;
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
     * @returns {boolean}
     */
    ctaDisabled() {
      return this.loading || (!this.isFree && !this.activePriceId);
    },
  },
  methods: {
    /**
     * @desc Emit a plan selection when the CTA is actionable.
     * @returns {void}
     */
    selectPlan() {
      if (this.ctaDisabled) return;
      this.$emit('select', { planId: this.plan.id, priceId: this.activePriceId });
    },
  },
};
</script>

<style scoped>
.billing-pricing-card {
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.billing-pricing-card:hover {
  transform: translateY(-4px);
}

.billing-pricing-card--highlighted {
  border: 2px solid rgb(var(--v-theme-primary));
}

.billing-pricing-card__price-skeleton {
  max-width: 8rem;
}

@media (prefers-reduced-motion: reduce) {
  .billing-pricing-card:hover {
    transform: none;
  }
}
</style>
