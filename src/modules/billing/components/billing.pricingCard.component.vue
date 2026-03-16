<!--
  BillingPricingCardComponent
  ===========================
  Displays a single pricing plan card with name, price, features, and CTA.

  USAGE:
  <billingPricingCardComponent :plan="plan" :annual="false" :current="false" @select="onSelect" />

  PROPS:
  - plan (Object): Plan object with id, name, tagline, features, highlighted, badge, cta, monthlyPrice, annualPrice
  - annual (Boolean): Whether annual billing is selected
  - current (Boolean): Whether this is the user's current plan
  - loading (Boolean): Whether a checkout is in progress (disables CTA)

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
      <template v-else-if="displayPrice !== null">
        <span class="text-display-small font-weight-bold">${{ displayPrice }}</span>
        <span class="text-body-medium text-medium-emphasis"> / {{ annual ? 'year' : 'month' }}</span>
      </template>
      <template v-else>
        <span class="text-display-small font-weight-bold text-medium-emphasis">—</span>
      </template>
    </div>

    <!-- CTA -->
    <v-btn
      v-if="!current"
      block
      :variant="plan.highlighted ? 'flat' : 'outlined'"
      :color="plan.highlighted ? 'primary' : undefined"
      :class="config.vuetify.theme.rounded"
      class="mb-6 text-none font-weight-bold"
      size="large"
      :loading="loading"
      :disabled="loading"
      @click="$emit('select', { planId: plan.id, priceId: activePriceId })"
    >
      {{ plan.cta }}
    </v-btn>
    <v-btn
      v-else
      block
      variant="tonal"
      color="success"
      :class="config.vuetify.theme.rounded"
      class="mb-6 text-none font-weight-bold"
      size="large"
      disabled
    >
      Current Plan
    </v-btn>

    <!-- Features -->
    <v-list density="compact" bg-color="transparent" class="pa-0">
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
 * Component definition.
 */
export default {
  name: 'BillingPricingCardComponent',
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
  },
  emits: ['select'],
  computed: {
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
</style>
