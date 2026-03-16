<template>
  <v-chip
    :color="color"
    variant="tonal"
    size="small"
    class="text-capitalize"
  >
    {{ plan }}
  </v-chip>
</template>

<script>
/**
 * Component definition.
 */
export default {
  name: 'BillingPlanBadgeComponent',
  props: {
    plan: {
      type: String,
      required: true,
      validator: (value) => ['free', 'starter', 'pro'].includes(value),
    },
  },
  computed: {
    /**
     * @desc Map plan name to Vuetify theme color.
     * @returns {string} Vuetify color name
     */
    color() {
      const colors = {
        free: 'grey',
        starter: 'primary',
        pro: 'secondary',
      };
      return colors[this.plan] || 'grey';
    },
  },
};
</script>
