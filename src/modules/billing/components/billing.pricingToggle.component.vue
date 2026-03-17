<!--
  BillingPricingToggleComponent
  =============================
  Toggle switch between Monthly and Annual billing intervals.

  USAGE:
  <billingPricingToggleComponent :annual="false" @update:annual="annual = $event" />

  PROPS:
  - annual (Boolean): Whether annual billing is selected

  EVENTS:
  - update:annual (Boolean): Emitted when the toggle changes
-->
<template>
  <div class="d-flex align-center justify-center ga-3">
    <span class="text-body-large font-weight-medium" :class="{ 'text-medium-emphasis': annual }">Monthly</span>
    <v-switch
      :model-value="annual"
      color="primary"
      hide-details
      density="compact"
      inset
      aria-label="Billing interval"
      @update:model-value="$emit('update:annual', $event)"
    ></v-switch>
    <span class="text-body-large font-weight-medium" :class="{ 'text-medium-emphasis': !annual }">Annual</span>
    <v-chip v-if="annual" color="success" variant="tonal" size="small">Save 20%</v-chip>
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
  },
  emits: ['update:annual'],
};
</script>
