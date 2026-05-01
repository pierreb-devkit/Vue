<!--
  BillingSubscriptionsComponent
  =============================
  Self-contained subscriptions panel rendered inside the user account "Subscriptions" tab.
  Always renders the current plan card + Stripe portal button; meter / extras sections are
  gated by `serverConfig.billing.meterMode === true`.

  USAGE:
  <BillingSubscriptionsComponent />

  PROPS:
  - none (component uses billingStore + authStore directly)

  EVENTS:
  - none
-->
<template>
  <v-container class="py-6 px-0" :style="{ 'max-width': '760px' }">
    <!-- Loading -->
    <v-row v-if="fetchLoading" justify="center" class="py-10">
      <v-progress-circular indeterminate color="primary" />
    </v-row>

    <!-- Content -->
    <template v-else>
      <!-- ── Current plan card ────────────────────────────────────────── -->
      <v-card v-if="!subscription || currentPlan === 'free'" :class="config.vuetify.theme.rounded" class="pa-6 mb-4">
        <div class="d-flex align-center mb-4">
          <span class="text-title-large font-weight-medium mr-3">Current Plan</span>
          <billingPlanBadgeComponent plan="free" />
        </div>
        <p class="text-body-medium mb-6">
          You're on the free plan. Upgrade to unlock more projects, team members, and advanced features.
        </p>
        <v-btn
          color="primary"
          variant="flat"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium"
          to="/pricing"
        >
          Upgrade
        </v-btn>
      </v-card>

      <v-card v-else :class="config.vuetify.theme.rounded" class="pa-6 mb-4">
        <div class="d-flex align-center mb-4">
          <span class="text-title-large font-weight-medium mr-3">Current Plan</span>
          <billingPlanBadgeComponent :plan="currentPlan" />
        </div>

        <v-list density="compact" class="bg-transparent pa-0 mb-6">
          <v-list-item class="px-0">
            <template #prepend>
              <v-icon icon="fa-solid fa-circle-check" size="small" color="success" class="mr-3" />
            </template>
            <v-list-item-title class="text-body-medium">
              Status: <strong class="text-capitalize">{{ subscription.status }}</strong>
            </v-list-item-title>
          </v-list-item>
          <v-list-item v-if="nextBillingDate" class="px-0">
            <template #prepend>
              <v-icon icon="fa-solid fa-calendar" size="small" class="mr-3" />
            </template>
            <v-list-item-title class="text-body-medium">
              Next billing date: <strong>{{ nextBillingDate }}</strong>
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <div class="d-flex ga-3 flex-wrap">
          <v-btn
            color="primary"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            :loading="portalLoading"
            @click="manageSubscription"
          >
            Manage Subscription
          </v-btn>
          <v-btn
            variant="outlined"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            to="/pricing"
          >
            Upgrade
          </v-btn>
        </div>
      </v-card>

      <!-- ── Meter mode sections (gated) ──────────────────────────────── -->
      <template v-if="meterMode">
        <!-- Usage bar (informational, opt-in here in account context) -->
        <BillingUsageBarComponent
          mode="meter"
          class="mb-4"
        />

        <!-- Meter progress card -->
        <v-card :class="config.vuetify.theme.rounded" class="pa-6 mb-4">
          <!-- i18n key: billing.usage.weekly -->
          <p class="text-title-medium font-weight-medium mb-4">Weekly meter</p>
          <BillingMeterProgressComponent
            :used="meterUsed"
            :quota="meterQuota"
            :extras="meterExtras"
            label=""
          />
        </v-card>

        <!-- Breakdown card -->
        <v-card :class="config.vuetify.theme.rounded" class="pa-6 mb-4">
          <!-- i18n key: billing.usage.breakdown -->
          <p class="text-title-medium font-weight-medium mb-4">Breakdown</p>
          <BillingMeterBreakdownChartComponent :breakdown="meterBreakdown" />
        </v-card>

        <!-- Extras card -->
        <v-card :class="config.vuetify.theme.rounded" class="pa-6 mb-4">
          <!-- i18n key: billing.subscriptions.extras.balance -->
          <p class="text-title-medium font-weight-medium mb-2">Extra units</p>
          <p class="text-body-medium text-medium-emphasis mb-4">
            {{ meterExtras }} units remaining
          </p>
          <v-btn
            color="primary"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium mb-6"
            to="/pricing"
          >
            Buy units
          </v-btn>

          <!-- Ledger: last 20 entries -->
          <v-divider class="mb-4" />
          <!-- i18n key: billing.subscriptions.extras.ledger -->
          <p class="text-body-medium font-weight-medium mb-3">Transaction history</p>
          <BillingExtrasLedgerComponent
            :entries="extrasLedger.entries"
            :total="extrasLedger.total"
            :page="extrasLedger.page"
            :limit="extrasLedger.limit"
            @update:page="onLedgerPageChange"
          />
        </v-card>
      </template>
    </template>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { computed, watch } from 'vue';
import { useBillingStore } from '../stores/billing.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useMeter } from '../composables/billing.useMeter';
import billingPlanBadgeComponent from './billing.planBadge.component.vue';
import BillingMeterProgressComponent from './billing.meterProgress.component.vue';
import BillingMeterBreakdownChartComponent from './billing.meterBreakdownChart.component.vue';
import BillingExtrasLedgerComponent from './billing.extrasLedger.component.vue';
import BillingUsageBarComponent from './billing.usageBar.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'BillingSubscriptionsComponent',
  components: {
    billingPlanBadgeComponent,
    BillingMeterProgressComponent,
    BillingMeterBreakdownChartComponent,
    BillingExtrasLedgerComponent,
    BillingUsageBarComponent,
  },
  /**
   * @desc Wires billingStore + authStore + reactive meterMode + useMeter derived refs.
   * Mirrors the previous billing.billing.view.vue setup so the visible UX stays identical.
   * @returns {Object}
   */
  setup() {
    const billingStore = useBillingStore();
    const authStore = useAuthStore();

    const meter = useMeter({ pollIntervalMs: 0 });
    const { used: meterUsed, quota: meterQuota, extras: meterExtras, breakdown: meterBreakdown } = meter;

    const meterMode = computed(() => authStore.serverConfig?.billing?.meterMode === true);

    watch(
      meterMode,
      (active) => {
        if (active) {
          void billingStore.fetchExtrasLedger({ page: 1, limit: 20 }).catch((error) => {
            console.error('Failed to load extras ledger:', error);
          });
        }
      },
      { immediate: true },
    );

    return { billingStore, authStore, meterMode, meterUsed, meterQuota, meterExtras, meterBreakdown };
  },
  data() {
    return {
      portalLoading: false,
    };
  },
  computed: {
    fetchLoading() {
      return this.billingStore.loading;
    },
    subscription() {
      return this.billingStore.subscription;
    },
    /**
     * @desc Extras credit ledger data for the paginated history table.
     * @returns {{ entries: Array, total: number, page: number, limit: number }}
     */
    extrasLedger() {
      return this.billingStore.extrasLedger ?? { entries: [], total: 0, page: 1, limit: 20 };
    },
    /**
     * @desc Derive current plan from subscription or default to free.
     * @returns {string}
     */
    currentPlan() {
      return this.subscription?.plan || 'free';
    },
    /**
     * @desc Format the next billing date for display.
     * @returns {string|null}
     */
    nextBillingDate() {
      const date = this.subscription?.currentPeriodEnd;
      if (!date) return null;
      return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },
  },
  /**
   * @desc Fetch subscription data and extras ledger on mount.
   */
  async mounted() {
    const orgsEnabled = this.authStore.serverConfig?.organizations?.enabled;
    const hasOrg = !!this.authStore.user?.currentOrganization;
    if (!this.authStore.isLoggedIn || (orgsEnabled && !hasOrg)) return;

    try {
      await this.billingStore.fetchSubscription();
    } catch (error) {
      console.error('Failed to load billing details:', error);
    }

    // Note: fetchExtrasLedger is handled by the immediate watcher in setup(),
    // no duplicate call needed here.
  },
  methods: {
    /**
     * @desc Open the Stripe customer portal.
     * @returns {Promise<void>}
     */
    async manageSubscription() {
      this.portalLoading = true;
      try {
        await this.billingStore.openPortal();
      } catch (error) {
        console.error('Failed to open billing portal:', error);
      } finally {
        this.portalLoading = false;
      }
    },
    /**
     * @desc Handle ledger page change from BillingExtrasLedgerComponent.
     * @param {number} page
     * @returns {Promise<void>}
     */
    async onLedgerPageChange(page) {
      try {
        await this.billingStore.fetchExtrasLedger({ page, limit: this.extrasLedger.limit });
      } catch (error) {
        console.error('Failed to load ledger page:', error);
      }
    },
  },
};
</script>
