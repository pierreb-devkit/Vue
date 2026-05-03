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
  <v-container class="py-6 px-0" :style="{ 'max-width': config.vuetify.theme.maxWidth }">
    <!-- Checkout success banner, surfaced after Stripe redirects back to the subscriptions tab. -->
    <v-alert
      v-if="paymentSuccessMessage"
      type="success"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="paymentSuccessMessage = null"
    >
      {{ paymentSuccessMessage }}
    </v-alert>

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
          <BillingPlanBadgeComponent plan="free" />
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
          <BillingPlanBadgeComponent :plan="currentPlan" />
        </div>

        <v-list density="compact" class="bg-transparent pa-0 mb-6">
          <v-list-item class="px-0">
            <template #prepend>
              <v-icon
                :icon="subscriptionStatusIcon"
                size="small"
                :color="subscriptionStatusMeta.color"
                class="mr-3"
              />
            </template>
            <v-list-item-title class="billing-subscriptions__status-row text-body-medium">
              <span>Status:</span>
              <v-chip
                class="billing-subscriptions__status-chip text-capitalize"
                :color="subscriptionStatusMeta.color"
                variant="tonal"
                size="small"
              >
                {{ subscriptionStatusMeta.label }}
              </v-chip>
              <v-btn
                v-if="subscriptionStatusAction"
                :color="subscriptionStatusAction.color"
                variant="tonal"
                size="small"
                :class="config.vuetify.theme.rounded"
                class="text-none text-body-medium"
                :loading="portalLoading"
                @click="manageSubscription"
              >
                {{ subscriptionStatusAction.label }}
              </v-btn>
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

        <v-alert
          v-if="portalError"
          type="error"
          variant="tonal"
          closable
          class="mb-4"
          @click:close="portalError = null"
        >
          {{ portalError }}
        </v-alert>

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
            v-if="canUpgrade"
            variant="outlined"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            to="/pricing"
          >
            Change Plan
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
            :overage="meterOverage"
            :net-remaining-raw="meterNetRemainingRaw"
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
            @click="extrasCheckoutDialog = true"
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

    <BillingExtrasCheckoutModalComponent
      v-model="extrasCheckoutDialog"
      :packs="extrasPacks"
    />
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
import { plans as plansConfig, packs as packsConfig } from '../config/billing.static-content';
import BillingPlanBadgeComponent from './billing.planBadge.component.vue';
import BillingMeterProgressComponent from './billing.meterProgress.component.vue';
import BillingMeterBreakdownChartComponent from './billing.meterBreakdownChart.component.vue';
import BillingExtrasLedgerComponent from './billing.extrasLedger.component.vue';
import BillingUsageBarComponent from './billing.usageBar.component.vue';
import BillingExtrasCheckoutModalComponent from './billing.extrasCheckoutModal.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'BillingSubscriptionsComponent',
  components: {
    BillingPlanBadgeComponent,
    BillingMeterProgressComponent,
    BillingMeterBreakdownChartComponent,
    BillingExtrasLedgerComponent,
    BillingUsageBarComponent,
    BillingExtrasCheckoutModalComponent,
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
    const {
      used: meterUsed,
      quota: meterQuota,
      extras: meterExtras,
      breakdown: meterBreakdown,
      overage: meterOverage,
      netRemainingRaw: meterNetRemainingRaw,
    } = meter;

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

    return {
      billingStore,
      authStore,
      meterMode,
      meterUsed,
      meterQuota,
      meterExtras,
      meterBreakdown,
      meterOverage,
      meterNetRemainingRaw,
    };
  },
  data() {
    return {
      portalLoading: false,
      portalError: null,
      extrasCheckoutDialog: false,
      paymentSuccessMessage: null,
      successCleanupTimer: null,
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
     * @desc Ordered plan IDs from static content, used to decide if a paid plan can move up.
     * @returns {Array<string>}
     */
    availablePlanIds() {
      const staticIds = plansConfig.map((plan) => plan.id).filter(Boolean);
      if (staticIds.length > 0) return staticIds;
      return this.billingStore.plans
        .map((plan) => plan.planId || plan.name?.toLowerCase())
        .filter(Boolean);
    },
    /**
     * @desc Whether the current paid plan has a higher plan available.
     * @returns {boolean}
     */
    canUpgrade() {
      const currentIndex = this.availablePlanIds.indexOf(this.currentPlan);
      return currentIndex >= 0 && currentIndex < this.availablePlanIds.length - 1;
    },
    /**
     * @desc Available extras packs for the inline checkout modal.
     * @returns {Array<{packId: string, label: string, priceUsd: number, meterUnits: number}>}
     */
    extrasPacks() {
      const fromStore =
        this.billingStore.usageMeter?.packsAvailable ??
        this.billingStore.extrasBalance?.packsAvailable ??
        null;
      if (fromStore && fromStore.length > 0) return fromStore;
      return packsConfig;
    },
    /**
     * @desc Current subscription status normalized to a displayable string.
     * @returns {string}
     */
    subscriptionStatus() {
      return this.subscription?.status || 'unknown';
    },
    /**
     * @desc Vuetify chip metadata for the current subscription status.
     * @returns {{ color: string, label: string }}
     */
    subscriptionStatusMeta() {
      const status = this.subscriptionStatus;
      const colors = {
        active: 'success',
        trialing: 'success',
        past_due: 'warning',
        canceled: 'error',
        incomplete: 'error',
      };
      return {
        color: colors[status] || 'default',
        label: status.replace(/_/g, ' '),
      };
    },
    /**
     * @desc Font Awesome icon for the current subscription status.
     * @returns {string}
     */
    subscriptionStatusIcon() {
      if (['active', 'trialing'].includes(this.subscriptionStatus)) return 'fa-solid fa-circle-check';
      if (this.subscriptionStatus === 'past_due') return 'fa-solid fa-triangle-exclamation';
      if (['canceled', 'incomplete'].includes(this.subscriptionStatus)) return 'fa-solid fa-circle-exclamation';
      return 'fa-solid fa-circle-info';
    },
    /**
     * @desc Portal action shown for subscription statuses requiring attention.
     * @returns {{ color: string, label: string }|null}
     */
    subscriptionStatusAction() {
      if (this.subscriptionStatus === 'past_due') {
        return { color: 'warning', label: 'Update payment method' };
      }
      if (['canceled', 'incomplete'].includes(this.subscriptionStatus)) {
        return { color: 'error', label: 'Reactivate' };
      }
      return null;
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
   * @desc Fetch subscription data on mount and handle Stripe redirect query params.
   * The legacy /billing page is retired; this component is now the landing point for
   * Stripe redirects (success, cancel, packPurchased).
   * @returns {Promise<void>}
   */
  async mounted() {
    const orgsEnabled = this.authStore.serverConfig?.organizations?.enabled;
    const hasOrg = !!this.authStore.user?.currentOrganization;
    if (!this.authStore.isLoggedIn || (orgsEnabled && !hasOrg)) return;

    this.handleCheckoutSuccessQuery();

    try {
      await this.billingStore.fetchSubscription();
    } catch (error) {
      console.error('Failed to load billing details:', error);
    }

    // Note: fetchExtrasLedger is handled by the immediate watcher in setup(),
    // no duplicate call needed here.
  },
  /**
   * @desc Clear pending checkout-success URL cleanup timer on component teardown.
   * @returns {void}
   */
  beforeUnmount() {
    if (this.successCleanupTimer) {
      clearTimeout(this.successCleanupTimer);
    }
  },
  methods: {
    /**
     * @desc Show checkout success feedback from Stripe return query params and clean the URL.
     * @returns {void}
     */
    handleCheckoutSuccessQuery() {
      const query = this.$route?.query || {};
      const packPurchased = query.packPurchased === true || query.packPurchased === 'true';
      const isSuccess = query.success === 'true' || packPurchased;
      if (!isSuccess) return;

      this.paymentSuccessMessage = query.type === 'extras' || packPurchased
        ? 'Extra units purchased successfully. Thank you!'
        : 'Subscription updated successfully. Thank you!';

      this.successCleanupTimer = setTimeout(() => {
        this.$router.replace({
          query: { ...this.$route.query, success: undefined, type: undefined, packPurchased: undefined, tab: 'subscriptions' },
        });
      }, 100);
    },
    /**
     * @desc Open the Stripe customer portal.
     * @returns {Promise<void>}
     */
    async manageSubscription() {
      this.portalLoading = true;
      this.portalError = null;
      try {
        await this.billingStore.openPortal();
        this.portalError = null;
      } catch {
        this.portalError = 'Unable to open the billing portal. Please try again.';
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

<style scoped>
.billing-subscriptions__status-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
