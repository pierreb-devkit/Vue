<!--
  BillingMeterBreakdownChartComponent
  =====================================
  Horizontal stacked-bar showing per-bucket meter usage.
  Buckets with 0 value are not rendered. Colors cycle through
  Vuetify theme tokens for deterministic visual mapping.

  USAGE:
  <billingMeterBreakdownChartComponent :breakdown="{ scrap: 100, autofix: 50, wizard: 200 }" />
  <billingMeterBreakdownChartComponent :breakdown="breakdown" :total="500" />

  PROPS:
  - breakdown (Object, required) : map of bucket → credit count (e.g. { scrap: 100, autofix: 50 })
  - total     (Number, optional) : override total; defaults to sum of breakdown values

  SLOTS: none
-->
<template>
  <div class="billing-meter-breakdown-chart">
    <!-- Empty state -->
    <div
      v-if="activeBuckets.length === 0"
      class="text-caption text-medium-emphasis text-center py-2"
    >
      No usage data
    </div>

    <template v-else>
      <!-- Stacked bar -->
      <div
        class="billing-meter-breakdown-chart__bar d-flex rounded overflow-hidden"
        style="height: 12px"
        role="img"
        :aria-label="stackedBarAriaLabel"
      >
        <div
          v-for="bucket in activeBuckets"
          :key="bucket.key"
          :style="{ width: bucket.pct + '%', backgroundColor: 'rgb(var(--v-theme-' + bucket.color + '))' }"
          :title="`${bucket.key}: ${bucket.value} (${bucket.pct}%)`"
        />
      </div>

      <!-- Legend -->
      <div class="billing-meter-breakdown-chart__legend d-flex flex-wrap gap-2 mt-2">
        <div
          v-for="bucket in activeBuckets"
          :key="bucket.key"
          class="d-flex align-center ga-1 text-caption"
        >
          <div
            :style="{ width: '10px', height: '10px', borderRadius: '2px', flexShrink: 0, backgroundColor: 'rgb(var(--v-theme-' + bucket.color + '))' }"
          />
          <span class="text-medium-emphasis">{{ bucket.key }}</span>
          <span class="font-weight-medium">{{ bucket.pct }}%</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
/** Ordered palette of Vuetify theme color tokens used for buckets. */
const PALETTE = ['primary', 'secondary', 'info', 'warning', 'success', 'error'];

/**
 * Component definition.
 */
export default {
  name: 'BillingMeterBreakdownChartComponent',

  props: {
    /**
     * @desc Per-bucket credit consumption map.
     * Keys are bucket names (e.g. 'scrap', 'autofix'); values are credit counts.
     * Buckets with value 0 are filtered out.
     * @type {Object.<string, number>}
     */
    breakdown: {
      type: Object,
      required: true,
    },
    /**
     * @desc Optional total override. Defaults to sum of all breakdown values.
     * Useful when the parent wants percentages relative to a quota rather than
     * the sum of visible buckets.
     */
    total: {
      type: Number,
      default: null,
    },
  },

  computed: {
    /**
     * @desc Effective total: prop override or sum of all breakdown values.
     * @returns {number}
     */
    effectiveTotal() {
      if (this.total !== null && this.total > 0) return this.total;
      return Object.values(this.breakdown).reduce((sum, v) => sum + (v || 0), 0);
    },

    /**
     * @desc Non-zero buckets enriched with color assignment and percentage.
     * Color is assigned by stable index position in the sorted key list so the
     * mapping is deterministic for a given set of bucket names.
     * @returns {Array<{ key: string, value: number, pct: number, color: string }>}
     */
    activeBuckets() {
      const total = this.effectiveTotal;
      if (total === 0) return [];

      return Object.entries(this.breakdown)
        .filter(([, v]) => v > 0)
        .map(([key, value], idx) => ({
          key,
          value,
          pct: Math.round((value / total) * 100),
          color: PALETTE[idx % PALETTE.length],
        }));
    },

    /**
     * @desc ARIA label describing the stacked bar contents.
     * @returns {string}
     */
    stackedBarAriaLabel() {
      if (this.activeBuckets.length === 0) return 'No usage data';
      const parts = this.activeBuckets.map((b) => `${b.key} ${b.pct}%`).join(', ');
      return `Meter usage breakdown: ${parts}`;
    },
  },
};
</script>
