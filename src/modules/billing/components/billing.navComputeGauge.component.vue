<!--
  BillingNavComputeGaugeComponent
  ================================
  Compute usage indicator for the navigation sidenav — same structure as other
  nav items (icon in #prepend, title), only the icon is a colored circle
  reflecting consumption level.

  Hover tooltip exposes the precise figures: "X / Y compute · resets <day>".

  Click → navigates to /users?tab=subscriptions.
  Auto-fetches on mount + on window.focus.

  Gate: hidden when not logged in or meterMode false.
-->
<template>
  <v-tooltip v-if="show" location="end" :open-delay="200">
    <template #activator="{ props: tooltipProps }">
      <v-list-item
        v-bind="tooltipProps"
        :to="{ path: '/users', query: { tab: 'subscriptions' } }"
        :aria-label="`Compute usage: ${usageMeter ? pctUsed + '% used' : '—'}`"
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

  computed: {
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

    totalQuota() {
      if (!this.usageMeter) return 0;
      const { meterUsed = 0, meterQuota = 0, extrasRemaining = 0 } = this.usageMeter;
      return meterQuota + extrasRemaining + meterUsed;
    },

    pctUsed() {
      if (this.totalQuota <= 0) return 0;
      return Math.max(0, Math.min(100, Math.round((this.meterUsed / this.totalQuota) * 100)));
    },

    iconColor() {
      if (this.pctUsed <= 50) return 'success';
      if (this.pctUsed <= 75) return 'warning';
      return 'error';
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
