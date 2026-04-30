<!--
  BillingExtrasCheckoutModalComponent
  =====================================
  Dialog for purchasing an extras credit pack.
  Presents a radio list of available packs with label and price,
  and a CTA that redirects to Stripe via billingStore.createExtrasCheckout().

  USAGE:
  <BillingExtrasCheckoutModalComponent
    v-model="open"
    :packs="[{ packId: 'pack_500', label: '500 units', priceUsd: 9, meterUnits: 500 }]"
  />

  PROPS:
  - modelValue (Boolean, required): Controls dialog open state (v-model)
  - packs      (Array<{packId, label, priceUsd, meterUnits}>, required): Pack options from useMeter().packsAvailable

  EVENTS:
  - update:modelValue (Boolean): Emitted when dialog requests close
-->
<template>
  <v-dialog
    :model-value="modelValue"
    max-width="480"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <!-- Title -->
      <v-card-title class="text-title-medium font-weight-bold pt-5 px-5">
        Buy extra units
      </v-card-title>

      <!-- Pack radio list -->
      <v-card-text class="px-5 pb-2">
        <v-radio-group
          v-model="selectedPackId"
          hide-details
        >
          <v-radio
            v-for="pack in packs"
            :key="pack.packId"
            :value="pack.packId"
            :label="`${pack.label} — $${pack.priceUsd} (+${pack.meterUnits} units)`"
            class="mb-1"
          />
        </v-radio-group>

        <!-- Empty state when no packs available -->
        <p
          v-if="packs.length === 0"
          class="text-body-2 text-medium-emphasis py-2"
        >
          No packs available at this time.
        </p>
      </v-card-text>

      <!-- Purchase error -->
      <v-alert
        v-if="purchaseError"
        type="error"
        variant="tonal"
        density="compact"
        class="mx-5 mb-2"
        closable
        @click:close="purchaseError = null"
      >
        {{ purchaseError }}
      </v-alert>

      <!-- Actions -->
      <v-card-actions class="px-5 pb-5 ga-2">
        <!-- i18n key: billing.extras.cta → Buy units -->
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          :disabled="!selectedPackId || purchasing"
          :loading="purchasing"
          @click="onBuy"
        >
          Buy {{ selectedPackLabel }}
        </v-btn>
        <v-btn
          variant="text"
          class="text-none"
          :disabled="purchasing"
          @click="$emit('update:modelValue', false)"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
/**
 * Module dependencies.
 */
import { useBillingStore } from '../stores/billing.store';

/**
 * Component definition.
 */
export default {
  name: 'BillingExtrasCheckoutModalComponent',

  props: {
    /**
     * @desc Controls the dialog open state (v-model).
     */
    modelValue: {
      type: Boolean,
      required: true,
    },
    /**
     * @desc Available extras packs to purchase.
     * Each pack: { packId: string, label: string, priceUsd: number, meterUnits: number }
     */
    packs: {
      type: Array,
      default: () => [],
    },
  },

  emits: ['update:modelValue'],

  /**
   * @desc Injects billingStore directly so only createExtrasCheckout is wired —
   * no polling side-effect on mount (avoids the safeRefresh triggered by useMeter).
   * @returns {{ billingStore: Object }}
   */
  setup() {
    const billingStore = useBillingStore();
    return { billingStore };
  },

  data() {
    return {
      /** @type {string|null} Currently selected pack ID */
      selectedPackId: null,
      /** @type {boolean} Whether a purchase is in progress */
      purchasing: false,
      /** @type {string|null} User-facing error message when checkout initiation fails */
      purchaseError: null,
    };
  },

  computed: {
    /**
     * @desc Label of the currently selected pack (for CTA text).
     * @returns {string}
     */
    selectedPackLabel() {
      if (!this.selectedPackId) return '';
      const pack = this.packs.find((p) => p.packId === this.selectedPackId);
      return pack ? pack.label : '';
    },
  },

  watch: {
    /**
     * @desc Pre-select the first available pack when the dialog opens or packs change.
     * Also clears any stale purchaseError so a re-opened modal starts clean.
     */
    modelValue(open) {
      if (open) {
        this.purchaseError = null;
        if (this.packs.length === 0) {
          this.selectedPackId = null;
        } else {
          const stillValid = this.packs.some((p) => p.packId === this.selectedPackId);
          if (!stillValid) this.selectedPackId = this.packs[0].packId;
        }
      }
    },
    packs: {
      immediate: true,
      handler(newPacks) {
        if (newPacks.length > 0 && !this.selectedPackId) {
          this.selectedPackId = newPacks[0].packId;
        }
      },
    },
  },

  methods: {
    /**
     * @desc Initiate Stripe checkout for the selected pack.
     * Delegates to billingStore.createExtrasCheckout() which redirects to Stripe.
     * On failure, sets purchaseError so the user understands what went wrong.
     * @returns {Promise<void>}
     */
    async onBuy() {
      if (!this.selectedPackId) return;
      this.purchasing = true;
      this.purchaseError = null;
      try {
        await this.billingStore.createExtrasCheckout(this.selectedPackId);
        // On success, Stripe redirects — so we only reach here on error
      } catch (err) {
        console.error('Failed to initiate extras checkout:', err);
        this.purchaseError = 'Unable to start checkout. Please try again.';
      } finally {
        this.purchasing = false;
      }
    },
  },
};
</script>
