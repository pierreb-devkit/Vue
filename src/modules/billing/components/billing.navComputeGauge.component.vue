<!--
  BillingNavComputeGaugeComponent
  ================================
  Compute usage mini-gauge for the navigation sidenav.
  Renders as a v-list-item (button-shape, same as other nav items) ABOVE the
  user/sign-out row. Only visible when meterMode is active.

  Collapsed (rail) state : gauge bar only — no text label.
  Expanded state         : gauge bar (prepend) + "62% · resets Sat May 17" text.

  Click → navigates to /users?tab=subscriptions (locked per T5 spec).
  NO inline tooltip / popover.

  Gate: hidden when not logged in, meterMode false, or usageMeter null.

  PROPS:
  - rail (Boolean, default false): mirrors navigation drawer rail prop.
    When true, only the gauge bar is shown — title/subtitle hidden.

  USAGE:
  <BillingNavComputeGaugeComponent :rail="isRail" />
-->
<template>
  <v-list-item
    v-if="show"
    class="billing-nav-gauge px-2"
    :to="'/users?tab=subscriptions'"
    :aria-label="`Compute usage: ${pct}%`"
  >
    <template #prepend>
      <div class="billing-nav-gauge__bar-wrap">
        <v-progress-linear
          :model-value="pct"
          :color="thresholdColor"
          rounded
          height="4"
          bg-color="surface-variant"
        />
      </div>
    </template>
    <template v-if="!rail">
      <v-list-item-title class="text-body-small font-weight-medium">
        {{ pct }}%
      </v-list-item-title>
      <v-list-item-subtitle v-if="resetLabel" class="text-caption text-medium-emphasis">
        {{ resetLabel }}
      </v-list-item-subtitle>
    </template>
  </v-list-item>
</template>

<script>
/**
 * Module dependencies.
 */
import { useBillingStore } from '../stores/billing.store.js';
import { useAuthStore } from '../../auth/stores/auth.store.js';

/**
 * Component definition.
 */
export default {
  name: 'BillingNavComputeGaugeComponent',

  props: {
    /**
     * @desc Mirror of the navigation drawer's rail prop.
     * When true, only the gauge bar is shown — no text labels.
     */
    rail: {
      type: Boolean,
      default: false,
    },
  },

  setup() {
    const billingStore = useBillingStore();
    const authStore = useAuthStore();
    return { billingStore, authStore };
  },

  computed: {
    /**
     * @desc Render only when logged in, meterMode is active, and usage data is available.
     * @returns {boolean}
     */
    show() {
      if (!this.authStore.isLoggedIn) return false;
      if (!this.authStore.serverConfig?.billing?.meterMode) return false;
      return Boolean(this.billingStore.usageMeter);
    },

    /**
     * @desc Proxy to usageMeter for clean template access.
     * @returns {Object|null}
     */
    usageMeter() {
      return this.billingStore.usageMeter;
    },

    /**
     * @desc Percentage of weekly quota consumed, clamped [0, 100].
     * @returns {number}
     */
    pct() {
      const { meterUsed = 0, meterQuota = 0 } = this.usageMeter ?? {};
      if (meterQuota === 0) return 0;
      return Math.max(0, Math.min(100, Math.round((meterUsed / meterQuota) * 100)));
    },

    /**
     * @desc Vuetify color token based on usage threshold.
     * @returns {string}
     */
    thresholdColor() {
      if (this.pct >= 100) return 'error';
      if (this.pct >= 80) return 'warning';
      return 'success';
    },

    /**
     * @desc Human-readable reset date label (short weekday + month + day format).
     * Example: "resets Sat May 17"
     * @returns {string|null}
     */
    resetLabel() {
      const resetAt = this.usageMeter?.weekResetAt;
      if (!resetAt) return null;
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
};
</script>

<style scoped>
.billing-nav-gauge__bar-wrap {
  width: 24px;
  display: flex;
  align-items: center;
}

.billing-nav-gauge__bar-wrap :deep(.v-progress-linear) {
  width: 24px;
  min-width: 24px;
}
</style>
