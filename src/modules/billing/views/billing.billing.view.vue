<template>
  <v-container class="py-10" style="max-width: 700px">
    <!-- Loading -->
    <v-row v-if="fetchLoading" justify="center" class="py-16">
      <v-progress-circular indeterminate color="primary" />
    </v-row>

    <!-- Content -->
    <template v-else>
      <h1 class="text-headline-large font-weight-bold mb-6">Billing</h1>

      <!-- ── Meter mode section ──────────────────────────────────────── -->
      <template v-if="meterMode">
        <!-- Usage bar mini-bar — click to open the detailed meter drawer -->
        <BillingUsageBarComponent
          mode="meter"
          class="mb-4"
          @open-drawer="meterDrawerOpen = true"
        />

        <!-- Detailed meter drawer (opens on usage-bar click) -->
        <BillingMeterDrawerComponent v-model="meterDrawerOpen" />

        <!-- Meter progress card -->
        <v-card :class="config.vuetify.theme.rounded" class="pa-6 mb-6">
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
        <v-card :class="config.vuetify.theme.rounded" class="pa-6 mb-6">
          <!-- i18n key: billing.usage.breakdown -->
          <p class="text-title-medium font-weight-medium mb-4">Breakdown</p>
          <BillingMeterBreakdownChartComponent :breakdown="meterBreakdown" />
        </v-card>

        <!-- Extras card -->
        <v-card :class="config.vuetify.theme.rounded" class="pa-6 mb-6">
          <!-- i18n key: billing.extras.title -->
          <p class="text-title-medium font-weight-medium mb-2">Extra units</p>
          <!-- i18n key: billing.extras.balance -->
          <p class="text-body-medium text-medium-emphasis mb-4">
            {{ meterExtras }} units remaining
          </p>
          <!-- i18n key: billing.extras.cta -->
          <v-btn
            color="primary"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            @click="extrasModalOpen = true"
          >
            Buy units
          </v-btn>
        </v-card>

        <!-- Extras checkout modal -->
        <BillingExtrasCheckoutModalComponent
          v-model="extrasModalOpen"
          :packs="packsAvailable"
        />
      </template>

      <!-- ── Legacy mode section ────────────────────────────────────── -->
      <template v-else>
        <!-- Free plan state -->
        <v-card v-if="!subscription || currentPlan === 'free'" :class="config.vuetify.theme.rounded" class="pa-6">
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

        <!-- Active subscription state -->
        <v-card v-else :class="config.vuetify.theme.rounded" class="pa-6">
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
      </template>
    </template>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { computed, watch, onUnmounted } from 'vue';
import { useBillingStore } from '../stores/billing.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useMeter } from '../composables/billing.useMeter';
import billingPlanBadgeComponent from '../components/billing.planBadge.component.vue';
import BillingMeterProgressComponent from '../components/billing.meterProgress.component.vue';
import BillingMeterBreakdownChartComponent from '../components/billing.meterBreakdownChart.component.vue';
import BillingExtrasCheckoutModalComponent from '../components/billing.extrasCheckoutModal.component.vue';
import BillingUsageBarComponent from '../components/billing.usageBar.component.vue';
import BillingMeterDrawerComponent from '../components/billing.meterDrawer.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'BillingView',
  components: {
    billingPlanBadgeComponent,
    BillingMeterProgressComponent,
    BillingMeterBreakdownChartComponent,
    BillingExtrasCheckoutModalComponent,
    BillingUsageBarComponent,
    BillingMeterDrawerComponent,
  },
  /**
   * @desc Always instantiates useMeter (pollIntervalMs: 0) so reactive refs are
   * available from first render regardless of when serverConfig resolves async.
   * A watcher on meterMode calls refresh() and enables polling once serverConfig
   * confirms meter billing is active. Legacy tenants (meterMode false/undefined)
   * never incur polling because the watcher only calls refresh() when active=true.
   * @returns {{ billingStore, authStore, meterUsed, meterQuota, meterExtras, meterBreakdown }}
   */
  setup() {
    const billingStore = useBillingStore();
    const authStore = useAuthStore();

    // Always instantiate so refs are reactive once data flows in
    const meter = useMeter({ pollIntervalMs: 0 });
    const { used: meterUsed, quota: meterQuota, extras: meterExtras, breakdown: meterBreakdown, refresh } = meter;

    // Reactive meterMode — resolves async after serverConfig loads
    const meterMode = computed(() => authStore.serverConfig?.billing?.meterMode === true);

    let pollingTimer = null;

    watch(
      meterMode,
      (active) => {
        if (active) {
          // serverConfig just resolved with meterMode=true: fetch immediately
          void refresh().catch(() => {});
          // Start 30s polling (clear any previous timer first for safety)
          if (pollingTimer) clearInterval(pollingTimer);
          pollingTimer = setInterval(() => {
            void refresh().catch(() => {});
          }, 30000);
        } else {
          // meterMode turned off or never active: stop polling
          if (pollingTimer) {
            clearInterval(pollingTimer);
            pollingTimer = null;
          }
        }
      },
      { immediate: true },
    );

    onUnmounted(() => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
    });

    return { billingStore, authStore, meterMode, meterUsed, meterQuota, meterExtras, meterBreakdown };
  },
  data() {
    return {
      portalLoading: false,
      /** @type {boolean} Controls extras checkout modal visibility */
      extrasModalOpen: false,
      /** @type {boolean} Controls meter drawer visibility (meter mode only) */
      meterDrawerOpen: false,
    };
  },
  computed: {
    fetchLoading() {
      // Global flag covers initial page load (fetchPlans, fetchSubscription, etc.).
      // Per-action meter counters (usageMeterRequests, extrasBalanceRequests) are intentionally
      // excluded here: meter data loads lazily after serverConfig resolves and is also
      // refreshed every 30 s via polling — hiding the whole page on every poll would
      // produce jarring full-page flashes. The meter card handles stale-data gracefully
      // while a background refresh runs.
      return this.billingStore.loading;
    },
    subscription() {
      return this.billingStore.subscription;
    },
    /**
     * @desc Available extras packs for checkout modal.
     * Uses billingStore injected in setup to avoid repeated useBillingStore() calls.
     * @returns {Array}
     */
    packsAvailable() {
      return (
        this.billingStore.usageMeter?.packsAvailable ??
        this.billingStore.extrasBalance?.packsAvailable ??
        []
      );
    },
    /**
     * @desc Derive current plan from subscription or default to free.
     * @returns {string} Plan identifier
     */
    currentPlan() {
      return this.subscription?.plan || 'free';
    },
    /**
     * @desc Format the next billing date for display.
     * @returns {string|null} Formatted date string
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
   * @desc Fetch subscription data on mount.
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
  },
};
</script>
