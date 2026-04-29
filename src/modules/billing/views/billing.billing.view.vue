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
import { useBillingStore } from '../stores/billing.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useMeter } from '../composables/billing.useMeter';
import billingPlanBadgeComponent from '../components/billing.planBadge.component.vue';
import BillingMeterProgressComponent from '../components/billing.meterProgress.component.vue';
import BillingMeterBreakdownChartComponent from '../components/billing.meterBreakdownChart.component.vue';
import BillingExtrasCheckoutModalComponent from '../components/billing.extrasCheckoutModal.component.vue';

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
  },
  /**
   * @desc Wire useMeter composable only when meter mode is active so legacy
   * tenants do not incur polling overhead.  Injects billingStore once here so
   * computed properties reference this.billingStore instead of calling
   * useBillingStore() on every evaluation.
   * @returns {{ billingStore: Object, authStore: Object, meterUsed?: ComputedRef, meterQuota?: ComputedRef, meterExtras?: ComputedRef, meterBreakdown?: ComputedRef }}
   */
  setup() {
    const billingStore = useBillingStore();
    const authStore = useAuthStore();
    if (authStore.serverConfig?.billing?.meterMode === true) {
      const { used: meterUsed, quota: meterQuota, extras: meterExtras, breakdown: meterBreakdown } = useMeter({ pollIntervalMs: 30000 });
      return { meterUsed, meterQuota, meterExtras, meterBreakdown, billingStore, authStore };
    }
    return { billingStore, authStore };
  },
  data() {
    return {
      portalLoading: false,
      /** @type {boolean} Controls extras checkout modal visibility */
      extrasModalOpen: false,
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
     * @desc Whether meter billing mode is active (from server config).
     * Uses authStore injected in setup for consistency with billingStore pattern.
     * @returns {boolean}
     */
    meterMode() {
      return this.authStore.serverConfig?.billing?.meterMode === true;
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
