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
 * Module dependencies.
 */
import config from '../../../lib/services/config';

/**
 * Devkit default plan set — { id, color } pairs, ordered.
 * MUST NEVER be declared in any config fragment/defaults file: it lives here so the
 * generated config stays byte-identical, and so a downstream `billing.planBadge.plans`
 * array fully replaces this set (generateConfig's deepMerge REPLACES arrays wholesale —
 * it does not union them, so a devkit default landing in a config layer would let a
 * downstream shrink but never fully own the allowed set).
 */
const DEFAULT_PLANS = [
  { id: 'free', color: 'grey' },
  { id: 'starter', color: 'primary' },
  { id: 'pro', color: 'secondary' },
  { id: 'enterprise', color: 'warning' },
];

/**
 * Resolve the effective plan definitions — a project override (config.billing.planBadge.plans)
 * when present and non-empty, otherwise the devkit default. A lazy accessor (not a module-eval
 * snapshot) so config can be mocked/mutated per test.
 * @returns {Array<{id: string, color: string}>}
 */
const planDefinitions = () => {
  const plans = config?.billing?.planBadge?.plans;
  return Array.isArray(plans) && plans.length ? plans : DEFAULT_PLANS;
};

/**
 * Validate supported billing plan identifiers against the resolved (config-aware) plan set.
 * @param {string} value Plan identifier.
 * @returns {boolean} True when the identifier is allowed.
 */
const isAllowedPlan = (value) => planDefinitions().some((definition) => definition && definition.id === value);

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
     * @desc Map plan name to Vuetify theme color, from the resolved (config-aware) plan set.
     * Falls back to config.billing.planBadge.fallbackColor, then 'grey', for a plan id
     * that isn't in the resolved set.
     * @returns {string} Vuetify color name
     */
    color() {
      const definition = planDefinitions().find((d) => d && d.id === this.plan);
      return (definition && definition.color) || config?.billing?.planBadge?.fallbackColor || 'grey';
    },
  },
};
</script>
