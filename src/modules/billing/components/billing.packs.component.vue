<!--
  BillingPacksComponent
  =====================
  Cards grid for purchasing extra compute units.

  Data source: `billingStore.usageMeter.packsAvailable` or
  `billingStore.extrasBalance.packsAvailable` (Stripe-backed, fetched at runtime).
  Falls back to the static `billing.static-content` defaults (empty array at devkit
  level; downstream projects populate it with marketing copy and Stripe pack IDs).

  On click → calls `billingStore.createExtrasCheckout(packId)` which initiates a
  Stripe Checkout session and redirects the user.

  USAGE:
  <BillingPacksComponent />
-->
<template>
  <div class="billing-packs">
    <!-- Empty state -->
    <p
      v-if="packs.length === 0"
      class="text-body-medium text-medium-emphasis text-center py-10"
    >
      No unit packs available at this time.
    </p>

    <!-- Cards grid -->
    <v-row v-else justify="center">
      <v-col
        v-for="pack in packs"
        :key="pack.packId"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card
          :class="config.vuetify.theme.rounded"
          class="billing-packs__card pa-6 d-flex flex-column"
          :loading="purchasingId === pack.packId"
        >
          <p class="text-title-medium font-weight-bold mb-2">{{ pack.label }}</p>
          <p class="text-display-small font-weight-bold mb-1">${{ pack.priceUsd }}</p>
          <p class="text-body-medium text-medium-emphasis mb-6">
            +{{ pack.meterUnits }} units
          </p>
          <v-btn
            color="primary"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium mt-auto"
            :disabled="!!purchasingId"
            :loading="purchasingId === pack.packId"
            @click.stop="onBuy(pack)"
          >
            Buy {{ pack.label }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Purchase error -->
    <v-alert
      v-if="purchaseError"
      type="error"
      variant="tonal"
      class="mt-4"
      closable
      @click:close="purchaseError = null"
    >
      {{ purchaseError }}
    </v-alert>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { useBillingStore } from '../stores/billing.store';
import { packs as packsConfig } from '../config/billing.static-content';

/**
 * Component definition.
 */
export default {
  name: 'BillingPacksComponent',

  /**
   * @desc Inject the billing store so onBuy can call createExtrasCheckout.
   * @returns {{ billingStore: Object }}
   */
  setup() {
    const billingStore = useBillingStore();
    return { billingStore };
  },

  data() {
    return {
      /** @type {string|null} packId currently being purchased (drives loading state) */
      purchasingId: null,
      /** @type {string|null} User-facing error when checkout initiation fails */
      purchaseError: null,
    };
  },

  computed: {
    /**
     * @desc Available extras packs. Sourced from store first (Stripe-backed prices),
     * falls back to the static config so the grid still renders pre-fetch.
     * @returns {Array<{packId: string, label: string, priceUsd: number, meterUnits: number}>}
     */
    packs() {
      const fromStore =
        this.billingStore.usageMeter?.packsAvailable ??
        this.billingStore.extrasBalance?.packsAvailable ??
        null;
      if (fromStore && fromStore.length > 0) return fromStore;
      return packsConfig;
    },
  },

  methods: {
    /**
     * @desc Initiate Stripe checkout for the selected pack. On success Stripe redirects;
     * if the call fails we surface a banner so the user can retry.
     * @param {{ packId: string, label: string }} pack
     * @returns {Promise<void>}
     */
    async onBuy(pack) {
      if (!pack?.packId || this.purchasingId) return;
      this.purchasingId = pack.packId;
      this.purchaseError = null;
      try {
        await this.billingStore.createExtrasCheckout(pack.packId);
      } catch (err) {
        console.error('Failed to initiate extras checkout:', err);
        this.purchaseError = 'Unable to start checkout. Please try again.';
      } finally {
        this.purchasingId = null;
      }
    },
  },
};
</script>

<style scoped>
.billing-packs__card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
</style>
