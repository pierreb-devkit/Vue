<!--
  BillingMeterProgressComponent
  ==============================
  Compact meter usage widget (bar or donut variant).
  Emits `click` for parent-driven drilldown (e.g. open a usage drawer).

  USAGE:
  <BillingMeterProgressComponent :used="120" :quota="200" :extras="30" label="Compute" />
  <BillingMeterProgressComponent :used="180" :quota="200" variant="donut" />
  <BillingMeterProgressComponent :used="220" :quota="200" :overage="20" :net-remaining-raw="-20" />

  PROPS:
  - used             (Number, required) : credits consumed
  - quota            (Number, required) : included weekly quota
  - extras           (Number, default 0): extras-pack credits remaining
  - overage          (Number, default 0): credits consumed beyond quota (>0 when over)
  - netRemainingRaw  (Number, default 0): unclamped remaining (can be negative when over quota)
  - label            (String, optional) : widget label
  - variant          ('bar'|'donut', default 'bar') : visual style

  EVENTS:
  - click : emitted when the widget is interacted with (for drilldown)
-->
<template>
  <div
    class="billing-meter-progress"
    :class="{ 'billing-meter-progress--clickable': hasClickListener }"
    :role="hasClickListener ? 'button' : undefined"
    :aria-label="ariaLabel"
    :tabindex="hasClickListener ? 0 : undefined"
    @click="onInteract"
    @keydown.enter="onInteract"
    @keydown.space.prevent="onInteract"
  >
    <!-- Label row -->
    <div
      v-if="label"
      class="d-flex justify-space-between text-body-medium text-medium-emphasis mb-1"
    >
      <span>{{ label }}</span>
      <span
        class="font-weight-medium"
        :class="overage > 0 ? 'text-error' : ''"
      >{{ clampedProgress }}%</span>
    </div>

    <!-- Overage badge -->
    <div
      v-if="overage > 0"
      class="billing-meter-progress__overage d-flex align-center mb-1"
      aria-live="assertive"
      aria-atomic="true"
    >
      <v-chip
        color="error"
        size="x-small"
        variant="tonal"
        prepend-icon="fa-solid fa-triangle-exclamation"
      >
        {{ $t('billing.meterProgress.over', { count: overage }) }}
      </v-chip>
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
    <div
      class="billing-meter-progress__summary text-caption text-medium-emphasis mt-1"
      aria-live="polite"
    >
      <span>{{ used }} / {{ quota }}</span>
      <template v-if="overage > 0">
        <span class="text-error"> {{ $t('billing.meterProgress.remaining', { count: computedNetRemainingRaw }) }}</span>
      </template>
      <template v-else>
        <span v-if="extras > 0"> {{ $t('billing.meterProgress.extras', { count: extras }) }}</span>
      </template>
    </div>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { computed, getCurrentInstance } from 'vue';

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
     * @desc Credits consumed beyond the included quota. Positive when over quota.
     * From useMeter's `overage` export.
     */
    overage: {
      type: Number,
      default: 0,
    },
    /**
     * @desc Unclamped remaining balance (quota - used + extras). Can be negative.
     * From useMeter's `netRemainingRaw` export.
     */
    netRemainingRaw: {
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

  /**
   * @desc Detects whether the parent registered a click listener so the widget
   * only exposes button semantics when it is genuinely interactive.
   * Accesses vnode.props directly because Vue strips declared emit listeners
   * from $attrs — getCurrentInstance().vnode.props is the only reliable source.
   * @returns {{ hasClickListener: import('vue').ComputedRef<boolean> }}
   */
  setup() {
    const instance = getCurrentInstance();
    const hasClickListener = computed(() => Boolean(instance?.vnode?.props?.onClick));
    return { hasClickListener };
  },

  computed: {
    /**
     * @desc Usage percentage clamped to [0, 100].
     * When overage > 0 the bar is pinned to 100% to signal full consumption.
     * When quota is 0 (undefined quota), returns 0.
     * @returns {number}
     */
    clampedProgress() {
      if (this.overage > 0) return 100;
      if (this.quota === 0) return 0;
      return Math.max(0, Math.min(100, Math.round((this.used / this.quota) * 100)));
    },

    /**
     * @desc Vuetify color token based on usage threshold.
     * Overage (used beyond quota) is the most severe state — always error.
     * green <70%, warning 70-90%, error >=90% or overage > 0.
     * @returns {string}
     */
    thresholdColor() {
      if (this.overage > 0) return 'error';
      if (this.clampedProgress >= 90) return 'error';
      if (this.clampedProgress >= 70) return 'warning';
      return 'success';
    },

    /**
     * @desc Unclamped net remaining, derived from quota - used + extras when
     * netRemainingRaw prop is not explicitly provided (default 0 sentinel detection:
     * if overage > 0 and netRemainingRaw === 0, derive internally to avoid showing
     * a misleading "0 remaining" on partial prop usage).
     * @returns {number}
     */
    computedNetRemainingRaw() {
      if (this.overage > 0 && this.netRemainingRaw === 0) {
        return this.quota - this.used + this.extras;
      }
      return this.netRemainingRaw;
    },

    /**
     * @desc Accessible ARIA label summarising the current meter state (locale-aware).
     * @returns {string}
     */
    ariaLabel() {
      const base = this.label ? `${this.label}: ` : '';
      if (this.overage > 0) {
        return this.$t('billing.meterProgress.ariaOver', {
          base,
          used: this.used,
          quota: this.quota,
          overage: this.overage,
        });
      }
      return this.$t('billing.meterProgress.ariaUsed', {
        base,
        used: this.used,
        quota: this.quota,
        percent: this.clampedProgress,
      });
    },
  },

  methods: {
    /**
     * @desc Emit click only when a parent is listening for interactive drilldown.
     * @returns {void}
     */
    onInteract() {
      if (!this.hasClickListener) return;
      this.$emit('click');
    },
  },
};
</script>

<style scoped>
.billing-meter-progress--clickable {
  cursor: pointer;
}
</style>
