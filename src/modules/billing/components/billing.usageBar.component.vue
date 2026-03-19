<!--
  BillingUsageBarComponent
  ========================
  Displays a progress bar showing usage quota for a given resource action.

  USAGE:
  <billingUsageBarComponent resource="documents" action="create" />

  PROPS:
  - resource (String, required): Resource name (e.g. "documents")
  - action (String, required): Action name (e.g. "create")
  - label (String, optional): Display label, defaults to "${resource} ${action}"
-->
<template>
  <div>
    <div class="d-flex justify-space-between text-body-small text-medium-emphasis mb-1">
      <span>{{ displayLabel }}</span>
      <span>{{ currentDisplay }}</span>
    </div>
    <v-progress-linear
      v-if="hasLimit"
      :model-value="percent"
      :color="barColor"
      rounded
      height="20"
    />
    <span v-else class="text-body-small text-medium-emphasis">Unlimited</span>
  </div>
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
  name: 'BillingUsageBarComponent',
  props: {
    /**
     * @desc Resource name (e.g. "documents").
     */
    resource: {
      type: String,
      required: true,
    },
    /**
     * @desc Action name (e.g. "create").
     */
    action: {
      type: String,
      required: true,
    },
    /**
     * @desc Display label, defaults to "${resource} ${action}".
     */
    label: {
      type: String,
      default: '',
    },
  },
  setup() {
    const { usage, limits, usagePercent } = useQuota();

    return { usage, limits, usagePercent };
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
     * @desc Display label for the bar.
     * @returns {string}
     */
    displayLabel() {
      return this.label || `${this.resource} ${this.action}`;
    },
    /**
     * @desc Whether this resource action has a finite limit.
     * @returns {boolean}
     */
    hasLimit() {
      const limit = this.limits[this.key];
      return limit !== undefined && limit !== null && limit !== Infinity;
    },
    /**
     * @desc Current usage count.
     * @returns {number}
     */
    current() {
      return this.usage[this.key] || 0;
    },
    /**
     * @desc Limit value.
     * @returns {number}
     */
    limit() {
      return this.limits[this.key];
    },
    /**
     * @desc Usage percentage.
     * @returns {number}
     */
    percent() {
      return this.usagePercent(this.resource, this.action);
    },
    /**
     * @desc Display string for current/limit count.
     * @returns {string}
     */
    currentDisplay() {
      if (!this.hasLimit) return 'Unlimited';
      return `${this.current}/${this.limit}`;
    },
    /**
     * @desc Bar color based on usage percentage thresholds.
     * @returns {string}
     */
    barColor() {
      if (this.percent >= 90) return 'error';
      if (this.percent >= 70) return 'warning';
      return 'success';
    },
  },
};
</script>
