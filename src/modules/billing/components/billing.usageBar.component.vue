<!--
  BillingUsageBarComponent
  ========================
  Displays a progress bar showing usage quota for a given resource action.
  Supports two modes:
    - 'legacy' (default): reads quota data via useQuota composable (resource/action props required).
    - 'meter': reads weekly meter data via useMeter composable. Informational only — no click handler.
             Always renders when authenticated + meterMode, regardless of subscription state.
             displayMode resolves to 'admin' | 'loading' | 'free' | 'standard' based on user/subscription.

  USAGE (legacy):
  <BillingUsageBarComponent resource="documents" action="create" />

  USAGE (meter):
  <BillingUsageBarComponent mode="meter" />

  PROPS:
  - mode     ('legacy'|'meter', default 'legacy'): rendering mode
  - resource (String): Resource name — required in legacy mode
  - action   (String): Action name — required in legacy mode
  - label    (String, optional): Display label
-->
<template>
  <!-- Meter mode -->
  <div
    v-if="mode === 'meter'"
    class="billing-usage-bar billing-usage-bar--meter"
    :class="`billing-usage-bar--${displayMode}`"
  >
    <!-- Admin display: rainbow gradient, show total consumed with no cap -->
    <template v-if="displayMode === 'admin'">
      <div class="billing-usage-bar__summary d-flex justify-space-between text-body-medium mb-1" aria-live="polite">
        <span>{{ displayLabel || $t('billing.usage.weeklyUsage') }}</span>
        <span
          class="font-weight-medium billing-usage-bar__admin-label admin-rainbow admin-rainbow--text"
        >{{ meterUsed != null ? meterUsed : '' }} ∞ Admin</span>
      </div>
      <div
        class="billing-usage-bar__admin-track admin-rainbow"
      />
    </template>

    <!-- Loading display: placeholder skeleton while billing data fetches -->
    <template v-else-if="displayMode === 'loading'">
      <div class="billing-usage-bar__summary d-flex justify-space-between text-body-medium text-medium-emphasis mb-1" aria-live="polite">
        <span>{{ displayLabel || $t('billing.usage.weeklyUsage') }}</span>
        <span class="font-weight-medium">—</span>
      </div>
      <v-progress-linear
        :model-value="0"
        color="grey-lighten-2"
        rounded
        height="6"
      />
    </template>

    <!-- Free display: 0 / free-tier quota, neutral colour -->
    <template v-else-if="displayMode === 'free'">
      <div class="billing-usage-bar__summary d-flex justify-space-between text-body-medium text-medium-emphasis mb-1" aria-live="polite">
        <span>{{ displayLabel || $t('billing.usage.weeklyUsage') }}</span>
        <span class="font-weight-medium">0 / {{ freeTierQuota }} compute</span>
      </div>
      <v-progress-linear
        :model-value="0"
        color="grey-lighten-1"
        rounded
        height="6"
      />
    </template>

    <!-- Standard display: current behaviour, with overage indicator when over quota -->
    <template v-else>
      <div class="billing-usage-bar__summary d-flex justify-space-between text-body-medium text-medium-emphasis mb-1" aria-live="polite">
        <span>{{ displayLabel || $t('billing.usage.weeklyUsage') }}</span>
        <span
          class="font-weight-medium"
          :class="meterOverage > 0 ? 'text-error' : ''"
        >{{ meterDisplay }}</span>
      </div>
      <BillingMeterProgressComponent
        :used="meterUsed"
        :quota="meterQuota"
        :extras="meterExtras"
        :overage="meterOverage"
        :net-remaining-raw="meterNetRemainingRaw"
      />
    </template>
  </div>

  <!-- Legacy mode -->
  <div
    v-else
    class="billing-usage-bar"
  >
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
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { useQuota } from '../composables/billing.useQuota';
import { useMeter } from '../composables/billing.useMeter';
import { useBilling } from '../composables/billing.useBilling';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useBillingStore } from '../stores/billing.store';
import BillingMeterProgressComponent from './billing.meterProgress.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'BillingUsageBarComponent',

  components: {
    BillingMeterProgressComponent,
  },

  props: {
    /**
     * @desc Rendering mode.
     * - 'legacy': reads quota via useQuota (resource + action required).
     * - 'meter': reads weekly meter data via useMeter; informational only (no click handler).
     *            Always renders (free / admin / standard) when authenticated + meterMode.
     */
    mode: {
      type: String,
      default: 'legacy',
      validator: (v) => ['legacy', 'meter'].includes(v),
    },
    /**
     * @desc Resource name (e.g. "documents") — legacy mode only.
     */
    resource: {
      type: String,
      default: '',
    },
    /**
     * @desc Action name (e.g. "create") — legacy mode only.
     */
    action: {
      type: String,
      default: '',
    },
    /**
     * @desc Display label. Defaults to "${resource} ${action}" in legacy or "Weekly usage" in meter.
     */
    label: {
      type: String,
      default: '',
    },
    /**
     * @desc Free-tier quota shown when user has no active subscription.
     * Defaults to 10 (override in project config if needed).
     */
    freeTierQuota: {
      type: Number,
      default: 10,
    },
  },

  emits: [],

  /**
   * @desc Wires useQuota (always) and useMeter (always, at top level to satisfy
   * composition rules). pollIntervalMs:0 disables the 30-second setInterval inside
   * useMeter; fetchMissingMeterData() still runs immediately during composable
   * creation to populate initial meter state. Meter values are only consumed by
   * computed properties when mode === 'meter'.
   * @param {Object} props - Component props
   * @returns {{ usage: Object, limits: Object, usagePercent: Function, meterUsed: ComputedRef, meterQuota: ComputedRef, meterExtras: ComputedRef, meterNetRemainingRaw: ComputedRef, meterOverage: ComputedRef, authStore: Object, billingStore: Object }}
   */
  setup() {
    const { usage, limits, usagePercent } = useQuota();
    const { isPlanActive } = useBilling();
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    const {
      used: meterUsed,
      quota: meterQuota,
      extras: meterExtras,
      netRemainingRaw: meterNetRemainingRaw,
      overage: meterOverage,
    } = useMeter({ pollIntervalMs: 0 });
    return { usage, limits, usagePercent, isPlanActive, meterUsed, meterQuota, meterExtras, meterNetRemainingRaw, meterOverage, authStore, billingStore };
  },

  computed: {
    /**
     * @desc Quota key derived from resource and action (legacy mode).
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
      return this.label || (this.mode === 'legacy' ? `${this.resource} ${this.action}` : '');
    },

    // ── Legacy mode computeds ──────────────────────────────────────────────

    /**
     * @desc Whether this resource action has a finite limit (legacy).
     * @returns {boolean}
     */
    hasLimit() {
      const limit = this.limits[this.key];
      return limit !== undefined && limit !== null && limit !== Infinity;
    },

    /**
     * @desc Current usage count (legacy).
     * @returns {number}
     */
    current() {
      return this.usage[this.key] || 0;
    },

    /**
     * @desc Limit value (legacy).
     * @returns {number}
     */
    limit() {
      return this.limits[this.key];
    },

    /**
     * @desc Usage percentage (legacy).
     * @returns {number}
     */
    percent() {
      return this.usagePercent(this.resource, this.action);
    },

    /**
     * @desc Display string for current/limit count (legacy).
     * @returns {string}
     */
    currentDisplay() {
      if (!this.hasLimit) return 'Unlimited';
      return `${this.current}/${this.limit}`;
    },

    /**
     * @desc Bar color based on usage percentage thresholds (legacy).
     * @returns {string}
     */
    barColor() {
      if (this.percent >= 90) return 'error';
      if (this.percent >= 70) return 'warning';
      return 'success';
    },

    // ── Meter mode computeds ───────────────────────────────────────────────

    /**
     * @desc Determines the visual display variant for meter mode.
     * - 'admin'    : user has 'admin' role → rainbow/∞ display
     * - 'loading'  : billing data still fetching (prevents flicker into free)
     * - 'free'     : authenticated but no active subscription/usageMeter → free tier display
     * - 'standard' : active subscription with usageMeter data → normal quota bar
     * @returns {'admin'|'loading'|'free'|'standard'}
     */
    displayMode() {
      if (this.authStore.user?.roles?.includes('admin')) return 'admin';
      if (this.billingStore.loading) return 'loading';
      if (!this.isPlanActive || !this.billingStore.usageMeter) return 'free';
      return 'standard';
    },

    /**
     * @desc Usage summary text shown in standard meter mode.
     * When in overage shows the negative net remaining; otherwise "{used} / {quota} +{extras}".
     * @returns {string}
     */
    meterDisplay() {
      if (this.meterOverage > 0) {
        return `${this.meterUsed} / ${this.meterQuota} (${this.meterNetRemainingRaw} remaining)`;
      }
      const base = `${this.meterUsed} / ${this.meterQuota}`;
      return this.meterExtras > 0 ? `${base} +${this.meterExtras}` : base;
    },
  },
};
</script>

<style scoped>
.admin-rainbow {
  background: linear-gradient(
    90deg,
    rgb(var(--v-theme-warning)),
    rgb(var(--v-theme-error)),
    rgb(var(--v-theme-secondary)),
    rgb(var(--v-theme-info)),
    rgb(var(--v-theme-success))
  );
}

.admin-rainbow--text {
  background-clip: text;
  color: transparent;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.billing-usage-bar__admin-track {
  height: 0.375rem;
  border-radius: 0.1875rem;
  opacity: 0.6;
}
</style>
