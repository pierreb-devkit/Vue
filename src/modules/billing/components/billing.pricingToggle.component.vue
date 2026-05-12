<!--
  BillingPricingToggleComponent
  =============================
  Toggle switch between Monthly and Annual billing intervals.
  Savings info lives on each BillingCardComponent (item.price.chip) — the toggle
  no longer renders a caption.

  USAGE:
  <billingPricingToggleComponent
    :annual="false"
    :disabled="false"
    @update:annual="annual = $event" />

  PROPS:
  - annual   (Boolean): Whether annual billing is selected
  - disabled (Boolean): Disable the toggle (e.g. on Extras tab where billing period doesn't apply)

  EVENTS:
  - update:annual (Boolean): Emitted when the toggle changes
-->
<template>
  <div class="text-center">
    <div class="d-flex align-center justify-center ga-2" :style="{ opacity: disabled ? 0.4 : 1 }">
      <span class="text-body-medium font-weight-medium text-white" :style="{ opacity: annual ? 0.5 : 1 }">Monthly</span>
      <v-switch
        :model-value="annual"
        color="primary"
        hide-details
        density="compact"
        inset
        :disabled="disabled"
        aria-label="Annual"
        @update:model-value="$emit('update:annual', $event)"
      ></v-switch>
      <span class="text-body-medium font-weight-medium text-white" :style="{ opacity: annual ? 1 : 0.5 }">Annual</span>
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
    /** @desc Disable the toggle (e.g. on Extras tab where billing period doesn't apply). */
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:annual'],
};
</script>
