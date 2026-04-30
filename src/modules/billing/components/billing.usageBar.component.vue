<!--
  BillingUsageBarComponent
  ========================
  Displays a progress bar showing usage quota for a given resource action.
  Supports two modes:
    - 'legacy' (default): reads quota data via useQuota composable (resource/action props required).
    - 'meter': reads weekly meter data via useMeter composable. Emits 'open-drawer' on click.
             Always renders when authenticated + meterMode, regardless of subscription state.
             displayMode resolves to 'admin' | 'free' | 'standard' based on user/subscription.

  USAGE (legacy):
  <BillingUsageBarComponent resource="documents" action="create" />

  USAGE (meter):
  <BillingUsageBarComponent mode="meter" @open-drawer="drawerOpen = true" />

  PROPS:
  - mode     ('legacy'|'meter', default 'legacy'): rendering mode
  - resource (String): Resource name — required in legacy mode
  - action   (String): Action name — required in legacy mode
  - label    (String, optional): Display label

  EVENTS:
  - open-drawer: emitted on click in meter mode (parent should open BillingMeterDrawerComponent)
-->
<template>
  <!-- Meter mode -->
  <div
    v-if="mode === 'meter'"
    class="billing-usage-bar billing-usage-bar--meter"
    :class="`billing-usage-bar--${displayMode}`"
    role="button"
    tabindex="0"
    style="cursor: pointer"
    aria-label="Open meter drawer"
    @click="$emit('open-drawer')"
    @keydown.enter="$emit('open-drawer')"
    @keydown.space.prevent="$emit('open-drawer')"
  >
    <!-- Admin display: rainbow gradient, show total consumed with no cap -->
    <template v-if="displayMode === 'admin'">
      <div class="d-flex justify-space-between text-body-2 mb-1">
        <span>{{ displayLabel || 'Weekly usage' }}</span>
        <span
          class="font-weight-medium billing-usage-bar__admin-label"
          style="background: linear-gradient(90deg,#f97316,#ec4899,#8b5cf6,#3b82f6,#10b981); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;"
        >∞ Admin</span>
      </div>
      <div
        class="billing-usage-bar__admin-track"
        style="height:6px; border-radius:3px; background:linear-gradient(90deg,#f97316,#ec4899,#8b5cf6,#3b82f6,#10b981); opacity:0.6;"
      />
    </template>

    <!-- Free display: 0 / free-tier quota, neutral colour -->
    <template v-else-if="displayMode === 'free'">
      <div class="d-flex justify-space-between text-body-2 text-medium-emphasis mb-1">
        <span>{{ displayLabel || 'Weekly usage' }}</span>
        <span class="font-weight-medium">0 / {{ freeTierQuota }} compute</span>
      </div>
      <v-progress-linear
        :model-value="0"
        color="grey-lighten-1"
        rounded
        height="6"
      />
    </template>

    <!-- Standard display: current behaviour -->
    <template v-else>
      <div class="d-flex justify-space-between text-body-2 text-medium-emphasis mb-1">
        <span>{{ displayLabel || 'Weekly usage' }}</span>
        <span class="font-weight-medium">{{ meterDisplay }}</span>
      </div>
      <BillingMeterProgressComponent
        :used="meterUsed"
        :quota="meterQuota"
        :extras="meterExtras"
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
     * - 'meter': reads weekly meter data via useMeter; emits 'open-drawer' on click.
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

  emits: ['open-drawer'],

  /**
   * @desc Wires useQuota (always) and useMeter only in meter mode to avoid
   * unnecessary reactive subscriptions and polling in legacy mode.
   * pollIntervalMs:0 disables the 30-second setInterval inside useMeter, but
   * safeRefresh() still fires once on mount to populate the initial meter state.
   * The parent component (e.g. BillingMeterDrawer) handles its own polling with
   * pollIntervalMs:30000 for continuous refresh while the drawer is open.
   * @param {Object} props - Component props
   * @returns {{ usage: Object, limits: Object, usagePercent: Function, meterUsed?: ComputedRef, meterQuota?: ComputedRef, meterExtras?: ComputedRef, authStore: Object, billingStore: Object }}
   */
  setup(props) {
    const { usage, limits, usagePercent } = useQuota();
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    if (props.mode === 'meter') {
      const { used: meterUsed, quota: meterQuota, extras: meterExtras } = useMeter({ pollIntervalMs: 0 });
      return { usage, limits, usagePercent, meterUsed, meterQuota, meterExtras, authStore, billingStore };
    }
    return { usage, limits, usagePercent, authStore, billingStore };
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
     * - 'free'     : authenticated but no active subscription/usageMeter → free tier display
     * - 'standard' : active subscription with usageMeter data → normal quota bar
     * @returns {'admin'|'free'|'standard'}
     */
    displayMode() {
      if (this.authStore.user?.roles?.includes('admin')) return 'admin';
      if (!this.billingStore.subscription || !this.billingStore.usageMeter) return 'free';
      return 'standard';
    },

    /**
     * @desc Usage summary text shown in standard meter mode: "{used} / {quota} +{extras}".
     * @returns {string}
     */
    meterDisplay() {
      const base = `${this.meterUsed} / ${this.meterQuota}`;
      return this.meterExtras > 0 ? `${base} +${this.meterExtras}` : base;
    },
  },
};
</script>
