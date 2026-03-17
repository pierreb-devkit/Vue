<template>
  <v-alert type="info" variant="tonal" prominent class="my-4">
    <template #text>
      This feature requires the <strong>{{ requiredPlan }}</strong> plan.
    </template>
    <template #append>
      <v-btn color="primary" variant="flat" size="small" class="text-none" to="/pricing">Upgrade</v-btn>
    </template>
  </v-alert>
</template>

<script>
/**
 * Component definition.
 */
export default {
  name: 'BillingUpgradePrompt',
  props: {
    /**
     * @desc The plan name required to access the gated feature.
     */
    requiredPlan: {
      type: String,
      required: true,
    },
  },
};
</script>
