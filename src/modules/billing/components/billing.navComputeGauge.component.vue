<!--
  BillingNavComputeGaugeComponent
  ================================
  Compute usage indicator for the navigation sidenav — same structure as other
  nav items (icon in #prepend, title), only the icon is a colored circle
  reflecting consumption level.

  Hover tooltip exposes the precise figures: "X / Y compute · resets <day>".

  Click → navigates to /users/billing.
  Auto-fetches on mount + on window.focus.

  Gate: hidden when not logged in or meterMode false.
-->
<template>
  <v-tooltip v-if="show" v-model="tooltipOpen" location="end" :open-delay="200" :open-on-hover="!isTouchDevice" :open-on-click="false">
    <template #activator="{ props: tooltipProps }">
      <v-list-item
        v-bind="tooltipProps"
        :to="'/users/billing'"
        :aria-label="`Compute usage: ${usageMeter ? pctUsed + '% used' : '—'}`"
        aria-haspopup="true"
        :aria-expanded="tooltipOpen ? 'true' : 'false'"
        @touchstart.passive="onTouchActivate"
      >
        <template #prepend>
          <v-progress-circular
            :model-value="pctUsed"
            :color="iconColor"
            size="24"
            width="6"
            class="me-8"
          />
        </template>
        <v-list-item-title>{{ usageMeter ? `${pctUsed}% used` : '—' }}</v-list-item-title>
      </v-list-item>
    </template>
    <div>{{ usedDisplay }} / {{ totalDisplay }} compute</div>
    <div v-if="resetLabel">{{ resetLabel }}</div>
  </v-tooltip>
</template>

<script>
import { useBillingStore } from '../stores/billing.store.js';
import { useAuthStore } from '../../auth/stores/auth.store.js';

export default {
  name: 'BillingNavComputeGaugeComponent',

  setup() {
    const billingStore = useBillingStore();
    const authStore = useAuthStore();
    return { billingStore, authStore };
  },

  data() {
    return {
      /** @desc Controls tooltip visibility — bound via v-model to v-tooltip. */
      tooltipOpen: false,
    };
  },

  computed: {
    /**
     * @desc True when the primary input is touch (hover: none media query).
     * Used to gate open-on-hover on the tooltip.
     * @returns {boolean}
     */
    isTouchDevice() {
      if (typeof window === 'undefined') return false;
      return window.matchMedia?.('(hover: none)').matches === true;
    },

    show() {
      if (!this.authStore.isLoggedIn) return false;
      return this.authStore.serverConfig?.billing?.meterMode === true;
    },

    usageMeter() {
      return this.billingStore.usageMeter;
    },

    meterUsed() {
      return this.usageMeter?.meterUsed ?? 0;
    },

    /**
     * @desc Total available compute quota: base allocation + extras purchased.
     * Excludes meterUsed (consumed units); consistent with billing.computeGauge.component.
     * @returns {number}
     */
    totalQuota() {
      if (!this.usageMeter) return 0;
      const { meterQuota = 0, extrasRemaining = 0 } = this.usageMeter;
      return meterQuota + extrasRemaining;
    },

    pctUsed() {
      if (this.totalQuota <= 0) return 0;
      return Math.max(0, Math.min(100, Math.round((this.meterUsed / this.totalQuota) * 100)));
    },

    /**
     * @desc Vuetify color token based on usage threshold.
     * Matches billing.computeGauge.component thresholds.
     * @returns {string}
     */
    iconColor() {
      if (this.pctUsed >= 100) return 'error';
      if (this.pctUsed >= 80) return 'warning';
      return 'success';
    },

    usedDisplay() {
      return this.meterUsed.toLocaleString();
    },

    totalDisplay() {
      return this.totalQuota.toLocaleString();
    },

    resetLabel() {
      const resetAt = this.usageMeter?.weekResetAt || this.nextMondayIso();
      try {
        const d = new Date(resetAt);
        const formatted = d.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        return `resets ${formatted}`;
      } catch {
        return null;
      }
    },
  },

  mounted() {
    this.billingStore.fetchUsageMeter();
    this._onFocus = () => this.billingStore.fetchUsageMeter();
    window.addEventListener('focus', this._onFocus);
  },

  beforeUnmount() {
    if (this._onFocus) window.removeEventListener('focus', this._onFocus);
  },

  methods: {
    /** @desc Toggles tooltip open/closed on tap for touch-only users. */
    onTouchActivate() { this.tooltipOpen = !this.tooltipOpen; },

    /**
     * @desc Returns the ISO 8601 string for the next Monday at 00:00 UTC.
     * Used as a fallback reset date when `weekResetAt` is not set on the meter doc.
     * Always returns a future date (minimum 1 day ahead when today is Monday).
     * @returns {string} ISO 8601 UTC string, e.g. "2026-05-18T00:00:00.000Z"
     */
    nextMondayIso() {
      const d = new Date();
      const day = d.getUTCDay();
      const daysUntilMonday = (8 - day) % 7 || 7;
      d.setUTCDate(d.getUTCDate() + daysUntilMonday);
      d.setUTCHours(0, 0, 0, 0);
      return d.toISOString();
    },
  },
};
</script>
