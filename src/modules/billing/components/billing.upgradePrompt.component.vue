<template>
  <!-- Post-grant variant: signup grant is depleted in meter mode (Free plan, balance = 0, ledger has signup_grant entry) -->
  <div v-if="exhaustedAfterGrant && mode === 'meter'" class="my-4">
    <v-alert type="info" variant="tonal" prominent>
      <template #text>
        <p class="font-weight-bold mb-1">Your signup grant is depleted</p>
        <p>You used your 500 compute one-shot grant. Buy a Boost pack to keep going, or upgrade for monthly compute.</p>
      </template>
      <template #append>
        <div class="d-flex flex-column ga-2">
          <v-btn
            data-test="cta-pack"
            color="primary"
            variant="flat"
            size="small"
            class="text-none"
            to="/pricing#units"
          >
            Buy Boost pack — $9
          </v-btn>
          <v-btn
            data-test="cta-upgrade"
            variant="text"
            size="small"
            class="text-none"
            to="/pricing"
          >
            Upgrade Growth / Pro
          </v-btn>
        </div>
      </template>
    </v-alert>
  </div>

  <!-- Default / meter variant -->
  <v-alert v-else type="info" variant="tonal" prominent class="my-4">
    <template #text>
      <span v-if="hasUsageInfo">{{ `You've used ${current} of ${limit} ${displayLabel}.` }}</span>
      <span v-else-if="mode === 'meter'">You're out of compute. Buy more units or upgrade for monthly compute.</span>
      <span v-else>{{ `This feature requires the ${requiredPlan} plan.` }}</span>
    </template>
    <template #append>
      <v-btn
        v-if="mode === 'meter'"
        color="primary"
        variant="flat"
        size="small"
        class="text-none"
        to="/pricing#units"
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
import { useBillingStore } from '../stores/billing.store.js';

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
     * @desc Billing mode. Meter mode surfaces a "buy units" CTA that routes to the
     * units section of the pricing page; subscription mode surfaces a plan-upgrade CTA.
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
  /**
   * @desc Wires useQuota composable and billing store for exhaustedAfterGrant detection.
   * @returns {{ usage: Object, limits: Object, billingStore: Object }}
   */
  setup() {
    const { usage, limits } = useQuota();
    const billingStore = useBillingStore();
    return { usage, limits, billingStore };
  },
  computed: {
    /**
     * @desc Whether the current user has exhausted their one-shot Free-tier signup grant.
     * Delegates to the billing store getter for reactivity. Only rendered in meter mode
     * (subscription mode is for feature-gating by plan, not meter exhaustion).
     * @returns {boolean}
     */
    exhaustedAfterGrant() {
      return this.billingStore.exhaustedAfterGrant;
    },
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
