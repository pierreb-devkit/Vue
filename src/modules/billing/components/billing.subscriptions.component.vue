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
    <!-- Checkout success / processing banner -->
    <v-alert
      v-if="checkoutProcessing"
      type="info"
      variant="tonal"
      class="mb-4"
      aria-live="polite"
    >
      <div class="d-flex align-center ga-3">
        <v-progress-circular indeterminate size="18" width="2" color="info" />
        <span>{{ $t('billing.checkout.success.processing') }}</span>
      </div>
    </v-alert>

    <v-alert
      v-else-if="checkoutTimeout"
      type="warning"
      variant="tonal"
      class="mb-4"
      aria-live="polite"
    >
      {{ $t('billing.checkout.success.timeout') }}
      <template #append>
        <v-btn variant="text" size="small" @click="retryFetchSubscription">
          {{ $t('billing.checkout.success.refresh') }}
        </v-btn>
      </template>
    </v-alert>

    <v-alert
      v-else-if="paymentSuccessMessage"
      type="success"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="dismissPaymentSuccess"
    >
      {{ paymentSuccessMessage }}
    </v-alert>

    <!-- Loading -->
    <v-row v-if="fetchLoading" justify="center" class="py-10">
      <v-progress-circular indeterminate color="primary" />
    </v-row>

    <!-- P1-1: Subscription fetch error — do NOT show free-plan fallback.
         Suppressed while checkout polling/timeout UX is active to prevent
         transient fetch errors from disrupting the payment flow. -->
    <v-card
      v-else-if="subscriptionError && !subscription && !checkoutProcessing && !checkoutTimeout"
      role="alert"
      aria-live="assertive"
      :class="config.vuetify.theme.rounded"
      class="pa-6 mb-4"
    >
      <div class="d-flex align-center mb-4">
        <v-icon icon="fa-solid fa-triangle-exclamation" color="error" size="small" class="mr-3" />
        <span class="text-title-large font-weight-medium">{{ $t('billing.subscriptions.unavailable') }}</span>
      </div>
      <p class="text-body-medium text-medium-emphasis mb-4">
        {{ $t('billing.subscriptions.error.fetchFailed') }}
      </p>
      <v-btn
        color="primary"
        variant="flat"
        :class="config.vuetify.theme.rounded"
        class="text-none text-body-medium"
        :loading="fetchLoading"
        @click="retryFetchSubscription"
      >
        {{ $t('billing.subscriptions.error.retry') }}
      </v-btn>
    </v-card>

    <!-- Content -->
    <template v-else>
      <!-- ── Current plan card ────────────────────────────────────────── -->
      <v-card v-if="!subscription || currentPlan === 'free'" :class="config.vuetify.theme.rounded" class="pa-6 mb-4">
        <div class="d-flex align-center mb-4">
          <span class="text-title-large font-weight-medium mr-3">{{ $t('billing.subscriptions.plan.current') }}</span>
          <BillingPlanBadgeComponent plan="free" />
        </div>
        <p class="text-body-medium mb-6">
          {{ $t('billing.subscriptions.plan.free.description') }}
        </p>
        <v-btn
          color="primary"
          variant="flat"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium"
          to="/pricing"
        >
          {{ $t('billing.subscriptions.cta.upgrade') }}
        </v-btn>
      </v-card>

      <v-card v-else :class="config.vuetify.theme.rounded" class="pa-6 mb-4">
        <div class="d-flex align-center mb-4">
          <span class="text-title-large font-weight-medium mr-3">{{ $t('billing.subscriptions.plan.current') }}</span>
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
              <span>{{ $t('billing.subscriptions.plan.status') }}</span>
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
              {{ $t('billing.subscriptions.plan.nextBilling', { date: nextBillingDate }) }}
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
            {{ $t('billing.subscriptions.portal') }}
          </v-btn>
          <v-btn
            v-if="canUpgrade"
            variant="outlined"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            to="/pricing"
          >
            {{ $t('billing.subscriptions.changePlan') }}
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
          <p class="text-title-medium font-weight-medium mb-4">{{ $t('billing.usage.weekly') }}</p>
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
          <p class="text-title-medium font-weight-medium mb-4">{{ $t('billing.usage.breakdown') }}</p>
          <BillingMeterBreakdownChartComponent :breakdown="meterBreakdown" />
        </v-card>

        <!-- Extras card -->
        <v-card :class="config.vuetify.theme.rounded" class="pa-6 mb-4">
          <p class="text-title-medium font-weight-medium mb-2">{{ $t('billing.subscriptions.extras.balance') }}</p>
          <p class="text-body-medium text-medium-emphasis mb-4">
            {{ $t('billing.extras.balance', { units: meterExtras }) }}
          </p>
          <v-btn
            color="primary"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium mb-6"
            @click="extrasCheckoutDialog = true"
          >
            {{ $t('billing.extras.cta') }}
          </v-btn>

          <!-- Ledger: last 20 entries -->
          <v-divider class="mb-4" />
          <p class="text-body-medium font-weight-medium mb-3">{{ $t('billing.subscriptions.extras.ledger') }}</p>
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

    <!-- Bonus: 409 subscription_already_active dialog -->
    <v-dialog v-model="alreadyActiveDialog" max-width="480">
      <v-card :class="config.vuetify.theme.rounded" class="pa-6">
        <div class="d-flex align-center mb-3">
          <v-icon icon="fa-solid fa-circle-check" color="success" size="small" class="mr-2" />
          <span class="text-title-medium font-weight-medium">
            {{ $t('billing.checkout.error.alreadyActive.title') }}
          </span>
        </div>
        <p class="text-body-medium text-medium-emphasis mb-6">
          {{ $t('billing.checkout.error.alreadyActive.message') }}
        </p>
        <div class="d-flex ga-3 justify-end">
          <v-btn
            variant="outlined"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            @click="alreadyActiveDialog = false"
          >
            {{ $t('billing.checkout.error.alreadyActive.close') }}
          </v-btn>
          <v-btn
            v-if="alreadyActivePortalUrl"
            color="primary"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            :href="alreadyActivePortalUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ $t('billing.checkout.error.alreadyActive.cta') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
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

/** Maximum number of polling attempts after checkout success (2s × 8 = 16s max). */
const CHECKOUT_POLL_MAX = 8;
/** Interval between polling attempts in milliseconds. */
const CHECKOUT_POLL_INTERVAL_MS = 2000;

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
      paymentSuccessTimer: null,
      // P1-2: checkout polling state
      checkoutProcessing: false,
      checkoutTimeout: false,
      checkoutPollTimer: null,
      checkoutPollCount: 0,
      checkoutPollSnapshotId: null,
      checkoutPollSnapshotStatus: null,
      checkoutPollSnapshotPlan: null,
      // Bonus: 409 already-active dialog
      alreadyActiveDialog: false,
      alreadyActivePortalUrl: null,
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
     * @desc Error message from the last fetchSubscription failure (P1-1).
     * @returns {string|null}
     */
    subscriptionError() {
      return this.billingStore.subscriptionError;
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
        incomplete_expired: 'error',
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
      if (['canceled', 'incomplete', 'incomplete_expired'].includes(this.subscriptionStatus)) return 'fa-solid fa-circle-exclamation';
      return 'fa-solid fa-circle-info';
    },
    /**
     * @desc Portal action shown for subscription statuses requiring attention.
     * @returns {{ color: string, label: string }|null}
     */
    subscriptionStatusAction() {
      if (this.subscriptionStatus === 'past_due') {
        return { color: 'warning', label: this.$t('billing.subscriptions.status.updatePayment') };
      }
      if (this.subscriptionStatus === 'canceled') {
        return { color: 'error', label: this.$t('billing.subscriptions.status.reactivate') };
      }
      if (['incomplete', 'incomplete_expired'].includes(this.subscriptionStatus)) {
        return { color: 'error', label: this.$t('billing.subscriptions.status.completePayment') };
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

    const isCheckoutSuccess = this.handleCheckoutSuccessQuery();

    if (!isCheckoutSuccess) {
      // Normal load: fetch once and surface errors
      try {
        await this.billingStore.fetchSubscription();
      } catch {
        // subscriptionError is already set in the store; component shows error card
      }
    }

    // Note: fetchExtrasLedger is handled by the immediate watcher in setup(),
    // no duplicate call needed here.
  },
  /**
   * @desc Clear pending timers on component teardown.
   * @returns {void}
   */
  beforeUnmount() {
    if (this.successCleanupTimer) {
      clearTimeout(this.successCleanupTimer);
    }
    if (this.paymentSuccessTimer) {
      clearTimeout(this.paymentSuccessTimer);
    }
    if (this.checkoutPollTimer) {
      clearTimeout(this.checkoutPollTimer);
    }
  },
  methods: {
    /**
     * @desc Manually dismiss the payment success banner and clear its auto-dismiss timer.
     * @returns {void}
     */
    dismissPaymentSuccess() {
      if (this.paymentSuccessTimer) {
        clearTimeout(this.paymentSuccessTimer);
        this.paymentSuccessTimer = null;
      }
      this.paymentSuccessMessage = null;
    },

    /**
     * @desc Re-fetch subscription on demand (Retry button / Refresh button).
     * When called after a checkout timeout, clears the timeout banner if the
     * subscription is now active/trialing.
     * @returns {Promise<void>}
     */
    async retryFetchSubscription() {
      try {
        const sub = await this.billingStore.fetchSubscription();
        if (this.checkoutTimeout && ['active', 'trialing'].includes(sub?.status)) {
          this.checkoutTimeout = false;
          this.checkoutProcessing = false;
          this.paymentSuccessMessage = this.$t('billing.checkout.success.synced');
        }
      } catch {
        // subscriptionError updated in store
      }
    },

    /**
     * @desc Detect ?success=true or ?checkout=success from Stripe redirect and start polling.
     * Returns true when checkout-success polling is initiated (skips normal single fetch).
     * @returns {boolean} True when polling was started
     */
    handleCheckoutSuccessQuery() {
      const query = this.$route?.query || {};
      const packPurchased = query.packPurchased === true || query.packPurchased === 'true';
      const isSuccess = query.success === 'true' || packPurchased;
      if (!isSuccess) return false;

      if (query.type === 'extras' || packPurchased) {
        // Extras purchase: no subscription state to poll — show success directly
        this.paymentSuccessMessage = this.$t('billing.extras.purchaseSuccess');
        this.scheduleQueryCleanup();
        return false;
      }

      // Subscription checkout success: capture pre-poll snapshot and start polling
      this.checkoutProcessing = true;
      this.checkoutTimeout = false;
      this.checkoutPollCount = 0;
      this.checkoutPollSnapshotId = this.billingStore.subscription?.stripeSubscriptionId ?? null;
      this.checkoutPollSnapshotStatus = this.billingStore.subscription?.status ?? null;
      this.checkoutPollSnapshotPlan = this.billingStore.subscription?.plan ?? null;
      this.scheduleQueryCleanup();
      this.pollSubscription();
      return true;
    },

    /**
     * @desc Poll fetchSubscription until the subscription changes or max attempts reached.
     * Criteria: stripeSubscriptionId appeared, OR status changed to active/trialing,
     * OR plan changed (covers upgrades that keep the same Stripe sub ID and status).
     * @returns {void}
     */
    pollSubscription() {
      this.checkoutPollTimer = setTimeout(async () => {
        try {
          await this.billingStore.fetchSubscription();
        } catch {
          // Keep polling even on transient errors
        }

        const sub = this.billingStore.subscription;
        const newId = sub?.stripeSubscriptionId ?? null;
        const newStatus = sub?.status ?? null;
        const newPlan = sub?.plan ?? null;

        const activated =
          (newId && newId !== this.checkoutPollSnapshotId) ||
          (['active', 'trialing'].includes(newStatus) && newStatus !== this.checkoutPollSnapshotStatus) ||
          (newPlan && newPlan !== this.checkoutPollSnapshotPlan);

        if (activated) {
          this.checkoutProcessing = false;
          this.checkoutTimeout = false;
          this.paymentSuccessMessage = this.$t('billing.checkout.success.synced');
          return;
        }

        this.checkoutPollCount += 1;
        if (this.checkoutPollCount >= CHECKOUT_POLL_MAX) {
          this.checkoutProcessing = false;
          this.checkoutTimeout = true;
          return;
        }

        this.pollSubscription();
      }, CHECKOUT_POLL_INTERVAL_MS);
    },

    /**
     * @desc Schedule URL query cleanup after success detection.
     * @returns {void}
     */
    scheduleQueryCleanup() {
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
      } catch (err) {
        console.error('Failed to open billing portal:', err);
        this.portalError = this.$t('billing.subscriptions.error.portalFailed');
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

    /**
     * @desc Show the 409 already-active dialog with a validated portal URL.
     * Only accepts HTTPS URLs to guard against malformed or compromised payloads.
     * Called by consumers (e.g. pricing view) that catch the structured error.
     * @param {string} portalUrl - Stripe customer portal URL from the 409 payload
     * @returns {void}
     */
    showAlreadyActiveDialog(portalUrl) {
      this.alreadyActivePortalUrl = null;
      if (portalUrl) {
        try {
          const parsed = new URL(portalUrl);
          if (parsed.protocol === 'https:') {
            this.alreadyActivePortalUrl = parsed.toString();
          }
        } catch {
          // Invalid URL — link will not be shown
        }
      }
      this.alreadyActiveDialog = true;
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
