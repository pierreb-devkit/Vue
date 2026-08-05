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
  <v-container class="billing-subscriptions py-6 px-6" style="max-width: none; width: 100%;">

    <!-- ── Status banners ────────────────────────────────────────────────── -->
    <v-alert
      v-if="checkoutProcessing"
      type="info"
      variant="tonal"
      class="mb-4"
      aria-live="polite"
    >
      <div class="d-flex align-center ga-3">
        <v-progress-circular indeterminate size="18" width="2" color="info" />
        <span>Processing your payment...</span>
      </div>
    </v-alert>

    <v-alert
      v-else-if="checkoutTimeout"
      type="warning"
      variant="tonal"
      class="mb-4"
      aria-live="polite"
    >
      Payment received, your subscription is being synced. Please refresh in a few seconds.
      <template #append>
        <v-btn variant="text" size="small" @click="retryFetchSubscription">
          Refresh
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

    <!-- ── Loading ──────────────────────────────────────────────────────── -->
    <v-row v-if="fetchLoading" justify="center" class="py-10">
      <AppSpinner color="primary" />
    </v-row>

    <!-- ── P1-1: Subscription fetch error ─────────────────────────────── -->
    <v-card
      v-else-if="subscriptionError && !subscription && !checkoutProcessing && !checkoutTimeout"
      role="alert"
      aria-live="assertive"
      :class="config.vuetify.theme.rounded"
      class="billing-subscriptions__error-card pa-6 mb-4"
      elevation="0"
    >
      <div class="d-flex align-center mb-3">
        <v-icon icon="fa-solid fa-triangle-exclamation" color="error" size="small" class="mr-3" aria-hidden="true" />
        <span class="text-title-large font-weight-medium">Subscription unavailable</span>
      </div>
      <p class="text-body-medium text-medium-emphasis mb-4">
        Unable to load your subscription details. Please try again.
      </p>
      <v-btn
        color="primary"
        variant="flat"
        :class="config.vuetify.theme.rounded"
        class="text-none text-body-medium"
        :loading="fetchLoading"
        @click="retryFetchSubscription"
      >
        Retry
      </v-btn>
    </v-card>

    <!-- ── Main content ─────────────────────────────────────────────────── -->
    <template v-else>
      <v-row>

        <!-- ── LEFT COLUMN: Plan summary + meter ──────────────────────── -->
        <v-col cols="12" :md="meterMode ? 5 : 12">

          <!-- ── Plan summary card (free) ──────────────────────────────── -->
          <v-card
            v-if="!subscription || currentPlan === 'free'"
            :class="config.vuetify.theme.rounded"
            class="billing-subscriptions__plan-card billing-subscriptions__plan-card--free pa-6 mb-4"
            elevation="0"
          >
            <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
              <div class="d-flex align-center ga-3">
                <span class="text-title-large font-weight-medium">Current Plan</span>
                <BillingPlanBadgeComponent plan="free" />
              </div>
            </div>
            <p class="text-body-medium text-medium-emphasis mb-6">
              {{ freePlanBlurb }}
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

          <!-- ── Plan summary card (paid) ───────────────────────────────── -->
          <v-card
            v-else
            :class="config.vuetify.theme.rounded"
            class="billing-subscriptions__plan-card billing-subscriptions__plan-card--paid pa-6 mb-4"
            elevation="0"
          >
            <!-- Header row: plan name + badge left, status chip + action right -->
            <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
              <div class="d-flex align-center ga-3">
                <span class="text-title-large font-weight-medium">Current Plan</span>
                <BillingPlanBadgeComponent :plan="currentPlan" />
              </div>
              <div class="d-flex align-center ga-2">
                <v-icon
                  :icon="displayStatusIcon"
                  size="x-small"
                  :color="displayStatusMeta.color"
                  aria-hidden="true"
                />
                <v-chip
                  :color="displayStatusMeta.color"
                  variant="tonal"
                  size="small"
                  class="text-capitalize"
                >
                  {{ displayStatusMeta.label }}
                </v-chip>
                <v-btn
                  v-if="displayStatusAction"
                  :color="displayStatusAction.color"
                  variant="tonal"
                  size="small"
                  :class="config.vuetify.theme.rounded"
                  class="text-none text-body-medium"
                  :loading="portalLoading"
                  @click="manageSubscription"
                >
                  {{ displayStatusAction.label }}
                </v-btn>
              </div>
            </div>

            <!-- Next billing date, or — while a cancellation is pending — the cancellation notice -->
            <div v-if="billingDateLine" class="d-flex align-center ga-2 mb-6 text-body-medium text-medium-emphasis">
              <v-icon icon="fa-solid fa-calendar" size="x-small" aria-hidden="true" />
              <span>{{ billingDateLine }}</span>
            </div>

            <!-- CTAs (portal error surfaced via centralized snackbar — see lib/services/axios.js) -->
            <div class="d-flex ga-3 flex-wrap" :class="{ 'mt-6': !billingDateLine }">
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

          <!-- ── Meter section (single bar — no duplicate) ──────────────── -->
          <template v-if="meterMode">

            <!-- Meter polling error surfaced via centralized snackbar (lib/services/axios.js) -->

            <!-- ── Usage meter card (T4 % bar — single source, no BillingUsageBarComponent) -->
            <v-card
              :class="config.vuetify.theme.rounded"
              class="billing-subscriptions__meter-card px-6 py-3 mb-0"
              elevation="0"
            >
              <p class="text-title-medium font-weight-medium mb-2">Weekly meter</p>
              <BillingMeterProgressComponent
                :used="meterUsed"
                :quota="meterQuota"
                :extras="meterExtras"
                :overage="meterQuota > 0 ? meterOverage : 0"
                :net-remaining-raw="meterNetRemainingRaw"
                label=""
              />
            </v-card>

            <!-- ── Breakdown card ─────────────────────────────────────────── -->
            <v-card
              :class="config.vuetify.theme.rounded"
              class="billing-subscriptions__meter-card--breakdown px-6 py-3 mb-0"
              elevation="0"
            >
              <p class="text-title-medium font-weight-medium mb-2">Breakdown</p>
              <BillingMeterBreakdownChartComponent :breakdown="meterBreakdown" />
            </v-card>

          </template>
        </v-col>

        <!-- ── RIGHT COLUMN: Extras + ledger (meterMode only) ─────────── -->
        <v-col v-if="meterMode" cols="12" md="7">

          <!-- ── Extras card ──────────────────────────────────────────────── -->
          <v-card
            :class="config.vuetify.theme.rounded"
            class="billing-subscriptions__extras-card pa-6 mb-4"
            elevation="0"
          >
            <!-- Header row: title + balance chip inline -->
            <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
              <p class="text-title-medium font-weight-medium mb-0">Extra units</p>
              <v-chip
                variant="tonal"
                color="primary"
                size="small"
              >
                {{ meterExtras === 0 ? 'no units remaining' : meterExtras === 1 ? `${meterExtras} unit remaining` : `${meterExtras} units remaining` }}
              </v-chip>
            </div>
            <!-- CTA: /pricing#units — single source of truth for pack pricing (feedback #7) -->
            <v-btn
              color="primary"
              variant="flat"
              :class="config.vuetify.theme.rounded"
              class="text-none text-body-medium mb-6"
              to="/pricing#units"
            >
              Buy compute extras
            </v-btn>

            <!-- Ledger: last 20 entries -->
            <v-divider class="mb-4" />
            <p class="text-body-medium font-weight-medium mb-3">Transaction history</p>
            <BillingExtrasLedgerComponent
              :entries="extrasLedger.entries"
              :total="extrasLedger.total"
              :page="extrasLedger.page"
              :limit="extrasLedger.limit"
              @update:page="onLedgerPageChange"
            />
          </v-card>

        </v-col>

      </v-row>
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
import { useCheckoutPolling } from '../composables/billing.useCheckoutPolling';
import { resolveStaticContent } from '../lib/billing.resolveStaticContent.js';
import BillingPlanBadgeComponent from './billing.planBadge.component.vue';
import BillingMeterProgressComponent from './billing.meterProgress.component.vue';
import BillingMeterBreakdownChartComponent from './billing.meterBreakdownChart.component.vue';
import BillingExtrasLedgerComponent from './billing.extrasLedger.component.vue';
import BillingExtrasCheckoutModalComponent from './billing.extrasCheckoutModal.component.vue';
import AppSpinner from '../../core/components/core.appSpinner.component.vue';

const { plans: plansConfig, packs: packsConfig } = resolveStaticContent();

/**
 * @desc Format a date value as a long-form US date (e.g. "August 5, 2026"), or null when absent.
 * @param {string|Date|null|undefined} date
 * @returns {string|null}
 */
const formatLongDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

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
    BillingExtrasCheckoutModalComponent,
    AppSpinner,
  },
  /**
   * @desc Wires billingStore + authStore + reactive meterMode + useMeter derived refs.
   * Checkout polling state is owned by useCheckoutPolling composable (issue #4219 refactor).
   * Polling refs are returned here so Options API methods can access them via `this.X` and
   * tests can read them via `wrapper.vm.X` — Vue 3 auto-unwraps setup() refs on the instance.
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

    // Checkout polling composable — owns all polling reactive state.
    // Refs are returned to the instance so Options API methods + tests access them via `this.X`.
    const polling = useCheckoutPolling();

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
      // Polling state (refs — auto-unwrapped on the instance)
      checkoutProcessing: polling.checkoutProcessing,
      checkoutTimeout: polling.checkoutTimeout,
      paymentSuccessMessage: polling.paymentSuccessMessage,
      checkoutPollCount: polling.checkoutPollCount,
      pollAborted: polling.pollAborted,
      checkoutPollSnapshotId: polling.checkoutPollSnapshotId,
      checkoutPollSnapshotStatus: polling.checkoutPollSnapshotStatus,
      checkoutPollSnapshotPlan: polling.checkoutPollSnapshotPlan,
      checkoutPollTimer: polling.checkoutPollTimer,
      // Polling composable handle — used by Options API methods to delegate calls.
      // Named without $ / _ prefix to avoid Vue 3 reserved-prefix dev warning.
      pollingComposable: polling,
    };
  },
  data() {
    return {
      portalLoading: false,
      extrasCheckoutDialog: false,
      paymentSuccessTimer: null,
      successCleanupTimer: null,
      // V5 P2: visibility-change subscription refresh debounce (timestamp of last fetch)
      subscriptionLastFetchedAt: 0,
    };
  },
  computed: {
    fetchLoading() {
      return this.billingStore.loading;
    },
    /**
     * @desc Free-plan upgrade blurb, config-overridable. Devkit default: exact current
     * copy (full paragraph, not just the second sentence) so a downstream missing a
     * feature (e.g. no team members) can rewrite the whole thing.
     * @returns {string}
     */
    freePlanBlurb() {
      return (
        this.config?.billing?.freePlanBlurb ??
        "You're on the free plan. Upgrade to unlock more projects, team members, and advanced features."
      );
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
     * BillingExtrasCheckoutModalComponent needs the legacy flat shape
     * `{ packId, label, priceUsd, meterUnits }` — Stripe-backed `packsAvailable`
     * already comes in that shape from the backend. `packsConfig` (static-content
     * fallback) is V4-unified (`{ id, title, price:{amount,period}, meta:{packId,
     * priceUsd, meterUnits}, ... }` — same shape BillingCardComponent renders via
     * BillingPacksComponent), so it's adapted here at the consumer boundary rather
     * than at the source: both this modal and the pricing-page card get their
     * required shape from the SAME `packsConfig` static content.
     * @returns {Array<{packId: string, label: string, priceUsd: number, meterUnits: number}>}
     */
    extrasPacks() {
      const fromStore =
        this.billingStore.usageMeter?.packsAvailable ??
        this.billingStore.extrasBalance?.packsAvailable ??
        null;
      if (fromStore && fromStore.length > 0) return fromStore;
      return packsConfig.map((pack) => ({
        packId: pack.meta?.packId ?? pack.id,
        label: pack.title,
        priceUsd: pack.meta?.priceUsd ?? null,
        meterUnits: pack.meta?.meterUnits ?? null,
      }));
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
        paused: 'warning',
        canceled: 'error',
        incomplete: 'error',
        incomplete_expired: 'error',
        unpaid: 'error',
      };
      const labels = {
        paused: 'Paused',
        unpaid: 'Unpaid',
      };
      return {
        color: colors[status] || 'default',
        label: labels[status] || status.replace(/_/g, ' '),
      };
    },
    /**
     * @desc Font Awesome icon for the current subscription status.
     * @returns {string}
     */
    subscriptionStatusIcon() {
      if (['active', 'trialing'].includes(this.subscriptionStatus)) return 'fa-solid fa-circle-check';
      if (this.subscriptionStatus === 'past_due') return 'fa-solid fa-triangle-exclamation';
      if (this.subscriptionStatus === 'paused') return 'fa-solid fa-circle-pause';
      if (this.subscriptionStatus === 'unpaid') return 'fa-solid fa-triangle-exclamation';
      if (['canceled', 'incomplete', 'incomplete_expired'].includes(this.subscriptionStatus)) return 'fa-solid fa-circle-exclamation';
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
      if (this.subscriptionStatus === 'canceled') {
        return { color: 'error', label: 'Reactivate' };
      }
      if (this.subscriptionStatus === 'paused') {
        return { color: 'warning', label: 'Reactivate' };
      }
      if (this.subscriptionStatus === 'unpaid') {
        return { color: 'error', label: 'Update payment method' };
      }
      if (['incomplete', 'incomplete_expired'].includes(this.subscriptionStatus)) {
        return { color: 'error', label: 'Complete payment' };
      }
      return null;
    },
    /**
     * @desc Format the next billing date for display (en-US).
     * @returns {string|null}
     */
    nextBillingDate() {
      return formatLongDate(this.subscription?.currentPeriodEnd);
    },
    /**
     * @desc Whether the subscription is active/trialing AND has a cancellation scheduled.
     * Stripe expresses a customer-portal cancellation as `cancel_at` with
     * `cancel_at_period_end` sometimes still `false` while the webhook is in flight —
     * checking either field catches both shapes. Deliberately scoped to
     * active/trialing so payment-urgency statuses (past_due, unpaid) always keep
     * their own messaging instead of a combined/competing chip.
     * @returns {boolean}
     */
    isPendingCancellation() {
      if (!['active', 'trialing'].includes(this.subscriptionStatus)) return false;
      return !!(this.subscription?.cancelAt || this.subscription?.cancelAtPeriodEnd);
    },
    /**
     * @desc Date the pending cancellation takes effect, formatted for display.
     * Resolves `cancelAt ?? nextRenewalDate ?? currentPeriodEnd` — never `cancelAt`
     * alone — because the boolean-only shape (`cancelAtPeriodEnd: true`, `cancelAt`
     * absent) is reachable while the webhook is in flight; `nextRenewalDate` already
     * resolves this fallback server-side.
     * @returns {string|null}
     */
    cancelsOnDate() {
      const date = this.subscription?.cancelAt ?? this.subscription?.nextRenewalDate ?? this.subscription?.currentPeriodEnd;
      return formatLongDate(date);
    },
    /**
     * @desc Status chip color/label actually rendered — the "Cancelling" warning
     * state while a cancellation is pending, otherwise the real per-status meta.
     * Single source of truth so the icon and chip never disagree.
     * @returns {{ color: string, label: string }}
     */
    displayStatusMeta() {
      if (this.isPendingCancellation) return { color: 'warning', label: 'Cancelling' };
      return this.subscriptionStatusMeta;
    },
    /**
     * @desc Status action button actually rendered — "Reactivate" while a
     * cancellation is pending, otherwise the real per-status action (or null).
     * @returns {{ color: string, label: string }|null}
     */
    displayStatusAction() {
      if (this.isPendingCancellation) return { color: 'warning', label: 'Reactivate' };
      return this.subscriptionStatusAction;
    },
    /**
     * @desc Status icon actually rendered — a clock while a cancellation is pending
     * (distinct from the success checkmark, which would contradict the "Cancelling"
     * chip), otherwise the real per-status icon.
     * @returns {string}
     */
    displayStatusIcon() {
      if (this.isPendingCancellation) return 'fa-solid fa-clock';
      return this.subscriptionStatusIcon;
    },
    /**
     * @desc Line shown under the plan header: the pending-cancellation notice while
     * a cancellation is scheduled, otherwise the next billing date — never both.
     * Guards against `cancelsOnDate` resolving to null (all three source fields
     * absent) so the UI never renders the literal string "Cancels on null".
     * @returns {string|null}
     */
    billingDateLine() {
      if (this.isPendingCancellation && this.cancelsOnDate) {
        return `Cancels on ${this.cancelsOnDate} — you'll keep access until then`;
      }
      if (this.nextBillingDate) return `Next billing date: ${this.nextBillingDate}`;
      return null;
    },
  },
  /**
   * @desc Fetch subscription data on mount and handle Stripe redirect query params.
   * The legacy /billing page is retired; this component is now the landing point for
   * Stripe redirects (success, cancel, packPurchased).
   *
   * F5 recovery (V5 P1): if sessionStorage contains a stale in-progress polling entry
   * from a previous render and it's still within the polling window, polling is resumed
   * for the remaining time without requiring the ?success query param to still be present.
   * @returns {Promise<void>}
   */
  async mounted() {
    const orgsEnabled = this.authStore.serverConfig?.organizations?.enabled;
    const hasOrg = !!this.authStore.user?.currentOrganization;
    if (!this.authStore.isLoggedIn || (orgsEnabled && !hasOrg)) return;

    const isCheckoutSuccess = this.handleCheckoutSuccessQuery();

    if (!isCheckoutSuccess) {
      // Check for interrupted polling session (F5 during checkout processing)
      const resumed = this.resumeCheckoutPollingFromSession();

      if (!resumed) {
        // Normal load: fetch once and surface errors
        try {
          await this.billingStore.fetchSubscription();
          this.subscriptionLastFetchedAt = Date.now();
        } catch {
          // subscriptionError is already set in the store; component shows error card
        }
      }
    }

    // Note: fetchExtrasLedger is handled by the immediate watcher in setup(),
    // no duplicate call needed here.

    // V5 P2: refresh subscription when tab regains visibility (multi-tab stale state)
    document.addEventListener('visibilitychange', this.handleSubscriptionVisibilityChange);
  },
  /**
   * @desc Clear pending timers and remove event listeners on component teardown.
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
    this.pollAborted = true;
    document.removeEventListener('visibilitychange', this.handleSubscriptionVisibilityChange);
  },
  methods: {
    /**
     * @desc Handle tab visibility change — refresh subscription when tab becomes visible.
     * Debounced 500ms to prevent a redundant fetch immediately after mount or a recent poll.
     * Skipped while checkout polling is active to avoid concurrent fetch interference.
     * @returns {void}
     */
    // biome-ignore lint/correctness/useQwikValidLexicalScope: false positive — Options API method, not a Qwik component
    handleSubscriptionVisibilityChange() {
      if (document.visibilityState !== 'visible') return;
      const DEBOUNCE_MS = 500;
      if (Date.now() - this.subscriptionLastFetchedAt < DEBOUNCE_MS) return;
      if (this.checkoutProcessing) return; // Don't interrupt active polling
      this.subscriptionLastFetchedAt = Date.now();
      this.billingStore.fetchSubscription().catch(() => {});
    },

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
          this.paymentSuccessMessage = 'Subscription activated successfully. Thank you!';
        }
      } catch {
        // subscriptionError updated in store
      }
    },

    /**
     * @desc Detect ?success=true or ?checkout=success from Stripe redirect and start polling.
     * Delegates to useCheckoutPolling composable.
     * @returns {boolean} True when polling was started
     */
    handleCheckoutSuccessQuery() {
      return this.pollingComposable.handleCheckoutSuccessQuery(this.$route, () => this.scheduleQueryCleanup());
    },

    /**
     * @desc Attempt to resume an interrupted checkout polling session after F5 reload.
     * Delegates to useCheckoutPolling composable.
     * @returns {boolean} True when polling was successfully resumed
     */
    resumeCheckoutPollingFromSession() {
      return this.pollingComposable.resumeCheckoutPollingFromSession();
    },

    /**
     * @desc Persist checkout polling session to sessionStorage for F5 recovery.
     * Delegates to useCheckoutPolling composable.
     * @param {{ startedAt: number }} payload - Session data to persist
     * @returns {void}
     */
    persistCheckoutPollingSession(payload) {
      this.pollingComposable.persistCheckoutPollingSession(payload);
    },

    /**
     * @desc Clear the checkout polling session from sessionStorage.
     * Delegates to useCheckoutPolling composable.
     * @returns {void}
     */
    clearCheckoutPollingSession() {
      this.pollingComposable.clearCheckoutPollingSession();
    },

    /**
     * @desc Poll fetchSubscription until the subscription changes or max attempts reached.
     * Delegates to useCheckoutPolling composable.
     * @returns {void}
     */
    pollSubscription() {
      this.pollingComposable.pollSubscription();
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
     * @desc Open the Stripe customer portal in a new tab.
     * @returns {Promise<void>}
     */
    async manageSubscription() {
      this.portalLoading = true;
      try {
        const url = await this.billingStore.openPortal();
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      } catch (err) {
        // Centralized snackbar (lib/services/axios.js) surfaces backend error.
        console.error('Failed to open billing portal:', err);
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
/* Plan card: accent left-border on paid plans */
.billing-subscriptions__plan-card--paid {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-left: 3px solid rgb(var(--v-theme-primary));
}

/* Free plan card: standard border, no accent */
.billing-subscriptions__plan-card--free {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* Error card: error-tinted border */
.billing-subscriptions__error-card {
  border: 1px solid rgba(var(--v-theme-error), 0.2);
}

/* Meter section cards: consistent surface border */
.billing-subscriptions__meter-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* Breakdown card: same surface border as meter card */
.billing-subscriptions__meter-card--breakdown {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* Extras card (right column): consistent surface border */
.billing-subscriptions__extras-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>
