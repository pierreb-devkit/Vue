<template>
  <!-- Post-grant variant: signup grant is depleted (Free plan, balance = 0, ledger has signup_grant entry) -->
  <div v-if="exhaustedAfterGrant" class="my-4">
    <v-alert type="info" variant="tonal" prominent>
      <template #text>
        <p class="font-weight-bold mb-1">{{ $t('billing.upgradePrompt.postGrantTitle') }}</p>
        <p>{{ $t('billing.upgradePrompt.postGrantBody') }}</p>
      </template>
      <template #append>
        <div class="d-flex flex-column ga-2">
          <v-btn
            data-test="cta-pack"
            color="primary"
            variant="flat"
            size="small"
            class="text-none"
            @click="$emit('buy-pack')"
          >
            {{ $t('billing.upgradePrompt.postGrantBuyPack') }}
          </v-btn>
          <v-btn
            data-test="cta-upgrade"
            variant="text"
            size="small"
            class="text-none"
            to="/pricing"
          >
            {{ $t('billing.upgradePrompt.postGrantUpgrade') }}
          </v-btn>
        </div>
      </template>
    </v-alert>
  </div>

  <!-- Default / meter variant -->
  <v-alert v-else type="info" variant="tonal" prominent class="my-4">
    <template #text>
      <span v-if="hasUsageInfo">{{ $t('billing.upgradePrompt.usageInfo', { current, limit, label: displayLabel }) }}</span>
      <span v-else>{{ $t('billing.upgradePrompt.requirePlan', { plan: requiredPlan }) }}</span>
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
        {{ $t('billing.upgradePrompt.buyUnits') }}
      </v-btn>
      <v-btn
        v-else
        color="primary"
        variant="flat"
        size="small"
        class="text-none"
        to="/pricing"
      >
        {{ $t('billing.upgradePrompt.upgrade') }}
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
     * Delegates to the billing store getter for reactivity.
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
