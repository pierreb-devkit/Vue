<!--
  BillingMeterBreakdownChartComponent
  ====================================
  Per-bucket compute consumption — one v-progress-linear per bucket, same
  height/rounded/bg-color as the Weekly compute bar for visual consistency.

  USAGE:
  <BillingMeterBreakdownChartComponent :breakdown="{ scrap: 60, autofix: 40 }" />
-->
<template>
  <div class="billing-meter-breakdown-chart">
    <div
      v-if="activeBuckets.length === 0"
      class="text-caption text-medium-emphasis text-center py-2"
      :aria-label="ariaLabel"
    >
      No usage data
    </div>

    <div v-else :aria-label="ariaLabel">
      <div v-for="bucket in activeBuckets" :key="bucket.key" class="mb-2">
        <div class="d-flex justify-space-between text-caption text-medium-emphasis mb-1">
          <span>{{ bucket.key }}</span>
          <span class="font-weight-medium">{{ bucket.pct }}%</span>
        </div>
        <v-progress-linear
          :model-value="bucket.pct"
          :color="bucket.color"
          rounded
          height="10"
          bg-color="surface-variant"
        />
      </div>
    </div>
  </div>
</template>

<script>
/** Ordered palette of Vuetify theme color tokens used for buckets. */
const PALETTE = ['primary', 'secondary', 'info', 'warning', 'success', 'error'];

export default {
  name: 'BillingMeterBreakdownChartComponent',

  props: {
    /**
     * @desc Per-bucket credit consumption map.
     * @type {Object.<string, number>}
     */
    breakdown: {
      type: Object,
      required: true,
    },
    /**
     * @desc Optional total override. Defaults to sum of all breakdown values.
     */
    total: {
      type: Number,
      default: null,
    },
  },

  computed: {
    effectiveTotal() {
      if (this.total !== null && this.total > 0) return this.total;
      return Object.values(this.breakdown).reduce((sum, v) => sum + (v || 0), 0);
    },

    activeBuckets() {
      const total = this.effectiveTotal;
      if (total === 0) return [];
      const allKeys = Object.keys(this.breakdown).sort();
      return allKeys
        .map((key) => ({ key, value: this.breakdown[key] || 0, paletteIdx: allKeys.indexOf(key) }))
        .filter(({ value }) => value > 0)
        .map(({ key, value, paletteIdx }) => ({
          key,
          value,
          pct: Math.round((value / total) * 100),
          color: PALETTE[paletteIdx % PALETTE.length],
        }));
    },

    ariaLabel() {
      if (this.activeBuckets.length === 0) return 'No usage data';
      return `Meter usage breakdown: ${this.activeBuckets.map((b) => `${b.key} ${b.pct}%`).join(', ')}`;
    },
  },
};
</script>
