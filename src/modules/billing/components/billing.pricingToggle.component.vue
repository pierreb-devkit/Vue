<!--
  BillingPricingToggleComponent
  =============================
  Toggle switch between Monthly and Annual billing intervals, with auto-computed savings chip.

  USAGE:
  <billingPricingToggleComponent
    :annual="false"
    :max-annual-savings-pct="17"
    @update:annual="annual = $event" />

  PROPS:
  - annual                (Boolean): Whether annual billing is selected
  - maxAnnualSavingsPct   (Number) : Maximum savings % across plans, used to render the chip copy.
                                     0 = no chip rendered.

  EVENTS:
  - update:annual (Boolean): Emitted when the toggle changes
-->
<template>
  <div class="text-center">
    <div class="d-flex align-center justify-center ga-3">
      <span class="text-body-large font-weight-medium text-white" :style="{ opacity: annual ? 0.5 : 1 }">{{ $t('billing.pricingToggle.monthly') }}</span>
      <v-switch
        :model-value="annual"
        color="primary"
        hide-details
        density="compact"
        inset
        :aria-label="$t('billing.pricingToggle.annual')"
        @update:model-value="$emit('update:annual', $event)"
      ></v-switch>
      <span class="text-body-large font-weight-medium text-white" :style="{ opacity: annual ? 1 : 0.5 }">{{ $t('billing.pricingToggle.annual') }}</span>
    </div>
    <div v-if="maxAnnualSavingsPct > 0" class="text-body-small text-white mt-2" :style="{ opacity: 0.85 }">
      {{ annual ? $t('billing.pricingToggle.savingsActive', { pct: maxAnnualSavingsPct }) : $t('billing.pricingToggle.saveAnnuallyDynamic', { pct: maxAnnualSavingsPct }) }}
    </div>
  </div>
</template>

<script>
/**
 * Component definition.
 */
export default {
  name: 'BillingPricingToggleComponent',
  props: {
    annual: {
      type: Boolean,
      default: false,
    },
    /**
     * @desc Maximum annual savings % across all plans on the page.
     * 0 means no plan offers an annual discount → chip is hidden.
     */
    maxAnnualSavingsPct: {
      type: Number,
      default: 0,
    },
  },
  emits: ['update:annual'],
};
</script>
