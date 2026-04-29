<!--
  BillingMeterDrawerComponent
  ============================
  Right-side navigation drawer showing the detailed weekly meter state.
  Displays quota progress, per-bucket breakdown, extras balance, and CTA
  to purchase more units via BillingExtrasCheckoutModal.

  USAGE:
  <BillingMeterDrawerComponent v-model="drawerOpen" />

  PROPS:
  - modelValue (Boolean, required): Controls open/closed state (v-model)

  EVENTS:
  - update:modelValue (Boolean): Emitted when the drawer requests close
-->
<template>
  <v-navigation-drawer
    :model-value="modelValue"
    location="right"
    temporary
    width="400"
    :style="{ maxWidth: '100vw' }"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Header -->
    <div class="d-flex align-center justify-space-between pa-4 border-b">
      <span class="text-title-medium font-weight-bold">Weekly meter</span>
      <v-btn
        icon
        variant="text"
        size="small"
        aria-label="Close meter drawer"
        @click="$emit('update:modelValue', false)"
      >
        <v-icon icon="fa-solid fa-xmark" />
      </v-btn>
    </div>

    <!-- Body -->
    <div class="pa-4">
      <!-- Progress widget -->
      <div class="mb-4">
        <p class="text-caption text-medium-emphasis text-uppercase mb-2">
          Usage
        </p>
        <!-- i18n key: billing.usage.progress -->
        <p class="text-body-2 text-medium-emphasis mb-3">
          {{ used }} of {{ quota }} units used
        </p>
        <BillingMeterProgressComponent
          :used="used"
          :quota="quota"
          :extras="extras"
          label=""
        />
      </div>

      <v-divider class="mb-4" />

      <!-- Breakdown chart -->
      <div class="mb-4">
        <!-- i18n key: billing.usage.breakdown -->
        <p class="text-caption text-medium-emphasis text-uppercase mb-2">Breakdown</p>
        <BillingMeterBreakdownChartComponent :breakdown="breakdown" />
      </div>

      <v-divider class="mb-4" />

      <!-- Extras section -->
      <div>
        <!-- i18n key: billing.extras.title -->
        <p class="text-caption text-medium-emphasis text-uppercase mb-2">Extra units</p>
        <!-- i18n key: billing.extras.balance -->
        <p class="text-body-2 mb-3">
          {{ extras }} units remaining
        </p>
        <!-- i18n key: billing.extras.cta -->
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          class="text-none"
          @click="extrasModalOpen = true"
        >
          Buy units
        </v-btn>
      </div>
    </div>

    <!-- Extras checkout modal -->
    <BillingExtrasCheckoutModalComponent
      v-model="extrasModalOpen"
      :packs="packsAvailable"
    />
  </v-navigation-drawer>
</template>

<script>
/**
 * Module dependencies.
 */
import { useMeter } from '../composables/billing.useMeter';
import { useBillingStore } from '../stores/billing.store';
import BillingMeterProgressComponent from './billing.meterProgress.component.vue';
import BillingMeterBreakdownChartComponent from './billing.meterBreakdownChart.component.vue';
import BillingExtrasCheckoutModalComponent from './billing.extrasCheckoutModal.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'BillingMeterDrawerComponent',

  components: {
    BillingMeterProgressComponent,
    BillingMeterBreakdownChartComponent,
    BillingExtrasCheckoutModalComponent,
  },

  props: {
    /**
     * @desc Controls the open/closed state of the drawer (v-model).
     */
    modelValue: {
      type: Boolean,
      required: true,
    },
  },

  emits: ['update:modelValue'],

  /**
   * @desc Wires useMeter composable to source reactive meter data.
   * @returns {{ used: ComputedRef<number>, quota: ComputedRef<number>, extras: ComputedRef<number>, breakdown: ComputedRef<Object> }}
   */
  setup() {
    const { used, quota, extras, breakdown } = useMeter({ pollIntervalMs: 30000 });
    return { used, quota, extras, breakdown };
  },

  data() {
    return {
      /** @type {boolean} Controls visibility of the extras checkout modal */
      extrasModalOpen: false,
    };
  },

  computed: {
    /**
     * @desc Available extras packs from store.
     * @returns {Array<{packId: string, label: string, priceUsd: number, meterUnits: number}>}
     */
    packsAvailable() {
      const billingStore = useBillingStore();
      return (
        billingStore.usageMeter?.packsAvailable ??
        billingStore.extrasBalance?.packsAvailable ??
        []
      );
    },
  },
};
</script>
