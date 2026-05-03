<template>
  <v-alert type="info" variant="tonal" prominent class="my-4">
    <template #text>
      <span v-if="hasUsageInfo">You've used {{ current }} of {{ limit }} {{ displayLabel }}.</span>
      <span v-else>This feature requires the <strong>{{ requiredPlan }}</strong> plan.</span>
    </template>
    <template #append>
      <v-btn
        v-if="mode === 'meter'"
        color="primary"
        variant="flat"
        size="small"
        class="text-none"
        @click="$emit('buy-pack')"
      >
        Buy units
      </v-btn>
      <v-btn
        v-else
        color="primary"
        variant="flat"
        size="small"
        class="text-none"
        to="/pricing"
      >
        Upgrade
      </v-btn>
    </template>
  </v-alert>
</template>

<script>
/**
 * Module dependencies.
 */
import { useQuota } from '../composables/billing.useQuota';

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
    /**
     * @desc Optional resource name for specific usage info.
     */
    resource: {
      type: String,
      default: '',
    },
    /**
     * @desc Optional action name for specific usage info.
     */
    action: {
      type: String,
      default: '',
    },
    /**
     * @desc Optional display label for usage info, defaults to "${resource} ${action}".
     */
    label: {
      type: String,
      default: '',
    },
    /**
     * @desc Billing mode. Meter mode prompts users to buy unit packs instead of
     * routing them to plan pricing.
     */
    mode: {
      type: String,
      default: 'subscription',
      /**
       * @desc Validate that mode is a known billing mode.
       * @param {string} value - The mode value to validate.
       * @returns {boolean} True if value is a supported mode.
       */
      validator: (value) => ['subscription', 'meter'].includes(value),
    },
  },
  emits: ['buy-pack'],
  /**
   * @desc Wires useQuota composable and exposes reactive usage and limits maps.
   * @returns {{ usage: Object, limits: Object }}
   */
  setup() {
    const { usage, limits } = useQuota();
    return { usage, limits };
  },
  computed: {
    /**
     * @desc Quota key derived from resource and action.
     * @returns {string}
     */
    key() {
      return `${this.resource}.${this.action}`;
    },
    /**
     * @desc Whether resource and action props are provided.
     * @returns {boolean}
     */
    hasUsageInfo() {
      return !!(this.resource && this.action && this.limits[this.key] !== undefined);
    },
    /**
     * @desc Current usage count for the resource action.
     * @returns {number}
     */
    current() {
      return this.usage[this.key] || 0;
    },
    /**
     * @desc Limit value for the resource action.
     * @returns {number}
     */
    limit() {
      return this.limits[this.key] || 0;
    },
    /**
     * @desc Display label for the usage message.
     * @returns {string}
     */
    displayLabel() {
      return this.label || `${this.resource} ${this.action}`;
    },
  },
};
</script>
