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
 * Validate supported billing plan identifiers.
 * @param {string} value Plan identifier.
 * @returns {boolean} True when the identifier is allowed.
 */
const isAllowedPlan = (value) => ['free', 'starter', 'pro', 'enterprise'].includes(value);

/**
 * Component definition.
 */
export default {
  name: 'BillingPlanBadgeComponent',
  props: {
    plan: {
      type: String,
      required: true,
      validator: isAllowedPlan,
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
        enterprise: 'warning',
      };
      return colors[this.plan] || 'grey';
    },
  },
};
</script>
