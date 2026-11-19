<template>
  <!-- billing.alerts.threshold80 / threshold100 toasts — emitted once per meter week cycle.
       Gated by `isLoggedIn && meterMode` so non-billing apps stay dormant. -->
  <v-snackbar
    v-if="isLoggedIn && meterMode"
    v-model="meterAlert.visible"
    location="top right"
    :timeout="6000"
    :color="meterAlert.color"
  >
    {{ meterAlert.text }}
    <template #actions>
      <v-btn icon @click="meterAlert.visible = false">
        <v-icon icon="fa-solid fa-circle-xmark" />
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script>
/**
 * Module dependencies.
 */
import { useAuthStore } from '../../auth/stores/auth.store';
import { useBillingStore } from '../stores/billing.store';

/**
 * @desc In-app compute threshold toast (80 % / 100 % of the weekly quota).
 * Mounted once at the app shell by `billing.app.js` (via `useShellExtras`),
 * only while the billing module is active.
 */
export default {
  name: 'BillingMeterAlert',
  /**
   * @desc Wire the auth and billing stores once.
   * @returns {{ authStore: Object, billingStore: Object }}
   */
  setup() {
    return { authStore: useAuthStore(), billingStore: useBillingStore() };
  },
  data() {
    return {
      /**
       * @desc In-app compute threshold toast state.
       * Deduped per meter week cycle via `meterAlertedKeys`.
       */
      meterAlert: {
        visible: false,
        color: 'warning',
        text: '',
      },
      /**
       * @desc Tracks which `${orgId}:${weekKey}:${level}` tuple has already been alerted.
       * Deduplication guard so the same threshold is only toasted once per billing week
       * per organization. Including the org ID prevents cross-org suppression when
       * the user switches organizations within the same billing week.
       * Format: `"{orgId}:{weekKey}:{level}"` — e.g. `"org_abc:2026-W18:80"`.
       * @type {Set<string>}
       */
      meterAlertedKeys: new Set(),
    };
  },
  computed: {
    isLoggedIn() {
      return this.authStore.isLoggedIn;
    },
    /**
     * @desc Whether compute meter mode is active for this session.
     * Gate: `serverConfig.billing.meterMode === true`. Defaults to `false` so
     * non-billing apps stay dormant.
     * @returns {boolean}
     */
    meterMode() {
      return this.authStore.serverConfig?.billing?.meterMode === true;
    },
    /**
     * @desc Reactive meter progress percentage (0–100) for threshold watches.
     * Derived from billingStore.usageMeter, returns 0 when no data.
     * @returns {number}
     */
    meterProgress() {
      const meter = this.billingStore.usageMeter;
      if (!meter || !meter.meterQuota) return 0;
      return Math.max(0, Math.min(100, Math.round((meter.meterUsed / meter.meterQuota) * 100)));
    },
    /**
     * @desc Current meter week key — used to namespace dedup guards so alerts
     * reset automatically each new billing week.
     * @returns {string|null}
     */
    meterWeekKey() {
      return this.billingStore.usageMeter?.weekKey ?? null;
    },
    /**
     * @desc Active organization ID — included in the meter alert dedupe key so
     * switching organizations within the same billing week does not suppress
     * alerts for the newly selected org.
     * @returns {string}
     */
    activeOrgId() {
      const org = this.authStore.user?.currentOrganization;
      return (org?._id || org?.id || org) ?? 'global';
    },
  },
  watch: {
    /**
     * @desc Fire a warning toast once per week cycle when meter crosses 80 % / 100 %.
     * Uses `meterAlertedKeys` set to dedup — key format: `"{orgId}:{weekKey}:{level}"`.
     * Gated on `meterMode && isLoggedIn` so non-billing apps stay dormant.
     * @param {number} newVal - Updated progress percentage
     */
    meterProgress(newVal) {
      if (!this.meterMode || !this.isLoggedIn) return;
      const orgId = this.activeOrgId;
      const weekKey = this.meterWeekKey ?? 'unknown';
      if (newVal >= 100) {
        const key = `${orgId}:${weekKey}:100`;
        if (!this.meterAlertedKeys.has(key)) {
          this.meterAlertedKeys.add(key);
          this.meterAlert = {
            visible: true,
            color: 'error',
            text: 'Quota reached — extras consumed',
          };
          // Also suppress the 80 dedup so it doesn't fire afterwards
          this.meterAlertedKeys.add(`${orgId}:${weekKey}:80`);
        }
      } else if (newVal >= 80) {
        const key = `${orgId}:${weekKey}:80`;
        if (!this.meterAlertedKeys.has(key)) {
          this.meterAlertedKeys.add(key);
          this.meterAlert = {
            visible: true,
            color: 'warning',
            text: "You've used 80% of your weekly quota",
          };
        }
      }
    },
  },
};
</script>
