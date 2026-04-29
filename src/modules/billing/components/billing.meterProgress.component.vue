<!--
  BillingMeterProgressComponent
  ==============================
  Compact meter usage widget (bar or donut variant).
  Emits `click` for parent-driven drilldown (e.g. open a usage drawer).

  USAGE:
  <billingMeterProgressComponent :used="120" :quota="200" :extras="30" label="Compute" />
  <billingMeterProgressComponent :used="180" :quota="200" variant="donut" />

  PROPS:
  - used     (Number, required) : credits consumed
  - quota    (Number, required) : included weekly quota
  - extras   (Number, default 0): extras-pack credits remaining
  - label    (String, optional) : widget label
  - variant  ('bar'|'donut', default 'bar') : visual style

  EVENTS:
  - click : emitted when the widget is interacted with (for drilldown)
-->
<template>
  <div
    class="billing-meter-progress"
    role="progressbar"
    :aria-valuenow="clampedProgress"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="ariaLabel"
    tabindex="0"
    style="cursor: pointer"
    @click="$emit('click')"
    @keydown.enter="$emit('click')"
    @keydown.space.prevent="$emit('click')"
  >
    <!-- Label row -->
    <div
      v-if="label"
      class="d-flex justify-space-between text-body-2 text-medium-emphasis mb-1"
    >
      <span>{{ label }}</span>
      <span class="font-weight-medium">{{ clampedProgress }}%</span>
    </div>

    <!-- Bar variant -->
    <template v-if="variant === 'bar'">
      <v-progress-linear
        :model-value="clampedProgress"
        :color="thresholdColor"
        rounded
        height="10"
        bg-color="surface-variant"
      />
    </template>

    <!-- Donut variant -->
    <template v-else>
      <div class="billing-meter-progress__donut d-flex justify-center">
        <v-progress-circular
          :model-value="clampedProgress"
          :color="thresholdColor"
          :size="64"
          :width="6"
        >
          <span class="text-caption font-weight-bold">{{ clampedProgress }}%</span>
        </v-progress-circular>
      </div>
    </template>

    <!-- Summary text -->
    <div class="text-caption text-medium-emphasis mt-1">
      <span>{{ used }} / {{ quota }}</span>
      <span v-if="extras > 0"> +{{ extras }} extras</span>
    </div>
  </div>
</template>

<script>
/**
 * Component definition.
 */
export default {
  name: 'BillingMeterProgressComponent',

  props: {
    /**
     * @desc Credits consumed this period.
     */
    used: {
      type: Number,
      required: true,
    },
    /**
     * @desc Included quota for this period.
     */
    quota: {
      type: Number,
      required: true,
    },
    /**
     * @desc Extras-pack credits remaining (bonus on top of quota).
     */
    extras: {
      type: Number,
      default: 0,
    },
    /**
     * @desc Optional display label shown above the bar/donut.
     */
    label: {
      type: String,
      default: '',
    },
    /**
     * @desc Visual variant: 'bar' (compact linear) or 'donut' (circular).
     */
    variant: {
      type: String,
      default: 'bar',
      validator: (v) => ['bar', 'donut'].includes(v),
    },
  },

  emits: ['click'],

  computed: {
    /**
     * @desc Usage percentage clamped to [0, 100].
     * @returns {number}
     */
    clampedProgress() {
      if (this.quota === 0) return 0;
      return Math.max(0, Math.min(100, Math.round((this.used / this.quota) * 100)));
    },

    /**
     * @desc Vuetify color token based on usage threshold.
     * green <70%, warning 70-90%, error >=90%.
     * @returns {string}
     */
    thresholdColor() {
      if (this.clampedProgress >= 90) return 'error';
      if (this.clampedProgress >= 70) return 'warning';
      return 'success';
    },

    /**
     * @desc Accessible ARIA label summarising the current meter state.
     * @returns {string}
     */
    ariaLabel() {
      const base = this.label ? `${this.label}: ` : '';
      return `${base}${this.used} of ${this.quota} used (${this.clampedProgress}%)`;
    },
  },
};
</script>
