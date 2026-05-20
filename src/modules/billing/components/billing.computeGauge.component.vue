<template>
  <div
    v-if="show"
    class="compute-gauge compute-gauge-activator px-4 py-2"
    :class="{ expanded: isExpanded }"
    tabindex="0"
    role="region"
    aria-label="Compute usage"
    aria-haspopup="true"
    :aria-expanded="isExpanded ? 'true' : 'false'"
    @mouseenter="!isTouchDevice && (isExpanded = true)"
    @mouseleave="!isTouchDevice && (isExpanded = false)"
    @focus="isExpanded = true"
    @blur="isExpanded = false"
    @touchstart.passive="onTouchActivate"
  >
    <div class="d-flex align-center justify-space-between mb-1">
      <span id="compute-gauge-label" class="text-label-small text-medium-emphasis">Compute</span>
      <span class="text-label-small font-weight-medium">{{ meterUsed }} / {{ meterQuota }}</span>
    </div>
    <v-progress-linear
      :model-value="progressPercent"
      :color="barColor"
      height="4"
      rounded
      aria-labelledby="compute-gauge-label"
    />
    <div v-show="isExpanded" class="text-caption text-medium-emphasis mt-2">
      {{ remaining }} remaining · resets {{ resetDate }}
    </div>
  </div>
</template>

<script setup>
/**
 * BillingComputeGaugeComponent
 *
 * Compact sidenav usage gauge — renders only when meterMode is active.
 * Displays meterUsed / meterQuota with a color-coded progress bar.
 * Hover reveals: "{remaining} remaining · resets {date}".
 *
 * Color thresholds:
 *   < 80% → primary
 *   ≥ 80% → warning
 *   ≥ 100% → error
 */
import { ref, computed } from 'vue';
import { useBillingStore } from '../stores/billing.store.js';
import { useAuthStore } from '../../auth/stores/auth.store.js';

/** @desc Expands the detail line — triggered by hover, keyboard focus, OR touch tap. */
const isExpanded = ref(false);

/**
 * @desc True when the primary input is touch (hover: none media query).
 * Used to disable hover-expand on touch devices in favour of tap-toggle.
 * @returns {boolean}
 */
const isTouchDevice = computed(() => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(hover: none)').matches === true;
});

/** @desc Toggles expansion on tap for touch-only users. */
const onTouchActivate = () => { isExpanded.value = !isExpanded.value; };

const billingStore = useBillingStore();
const authStore = useAuthStore();

/**
 * @desc Render the gauge only when the user is logged in, the app is in
 * meter mode, and the billing store has meter data to display.
 * @returns {boolean}
 */
const show = computed(() => {
  if (!authStore.isLoggedIn) return false;
  if (!authStore.serverConfig?.billing?.meterMode) return false;
  return Boolean(billingStore.usageMeter);
});

/** @desc Current meter usage from the billing store. Defaults to 0 before data loads. @returns {number} */
const meterUsed = computed(() => billingStore.usageMeter?.meterUsed ?? 0);
/** @desc Current meter quota (total allowance) from the billing store. @returns {number} */
const meterQuota = computed(() => billingStore.usageMeter?.meterQuota ?? 0);

/** @desc Remaining units, clamped to 0 when meterUsed exceeds meterQuota. @returns {number} */
const remaining = computed(() => Math.max(0, meterQuota.value - meterUsed.value));

/**
 * @desc Progress as a 0–100 percentage. Guards against division by zero when
 * meterQuota is 0 (e.g. free plan before any grant lands).
 * @returns {number}
 */
const progressPercent = computed(() => {
  const quota = meterQuota.value;
  if (!quota) return 0;
  return Math.min(100, Math.round((meterUsed.value / quota) * 100));
});

/**
 * @desc Bar color — primary below 80 %, warning at 80–99 %, error at 100 %+.
 * @returns {'primary'|'warning'|'error'}
 */
const barColor = computed(() => {
  const pct = progressPercent.value;
  if (pct >= 100) return 'error';
  if (pct >= 80) return 'warning';
  return 'primary';
});

/**
 * @desc Human-readable reset date derived from the current meter week.
 * Falls back to an em-dash when the billing store has no reset date yet.
 * @returns {string}
 */
const resetDate = computed(() => {
  const d = billingStore.usageMeter?.weekResetAt;
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
});
</script>

<style scoped>
.compute-gauge {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: background 0.2s;
}
.compute-gauge.expanded {
  background: rgba(var(--v-theme-on-surface), 0.04);
}
</style>
