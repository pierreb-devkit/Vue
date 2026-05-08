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
      {{ $t('billing.packs.noUnitsAvailable') }}
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
          <p class="text-display-small font-weight-bold mb-1">{{ formatPrice(pack.priceUsd) }}</p>
          <p class="text-body-medium text-medium-emphasis mb-4">
            {{ $t('billing.packs.units', { amount: pack.meterUnits }) }}
          </p>
          <!-- Structured equivalences chips (Phase 3 forward) — opt-in, no breaking change -->
          <!-- Guard: only render chips when equivalences carry the new { kind, count, label } shape -->
          <BillingEquivalencesChipsComponent
            v-if="pack.equivalences && pack.equivalences.length > 0 && pack.equivalences[0]?.kind != null"
            :equivalences="pack.equivalences"
            class="mb-4"
          />
          <!-- Sectioned features (when present) -->
          <template v-if="pack.featureSections && pack.featureSections.length > 0">
            <BillingPricingFeatureSectionComponent
              v-for="(section, idx) in pack.featureSections"
              :key="`pack-section-${idx}`"
              :section="section"
              class="mb-2"
            />
          </template>
          <v-btn
            color="primary"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium mt-auto"
            :disabled="!!purchasingId"
            :loading="purchasingId === pack.packId"
            @click.stop="onBuy(pack)"
          >
            {{ $t('billing.packs.purchase', { label: pack.label }) }}
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
import { useAuthStore } from '../../auth/stores/auth.store';
import { packs as packsConfig } from '../config/billing.static-content';
import BillingEquivalencesChipsComponent from './billing.equivalencesChips.component.vue';
import BillingPricingFeatureSectionComponent from './billing.pricingFeatureSection.component.vue';
import { useCurrencyFormat } from '../composables/billing.useCurrencyFormat.js';

/**
 * Component definition.
 */
export default {
  name: 'BillingPacksComponent',
  components: {
    BillingEquivalencesChipsComponent,
    BillingPricingFeatureSectionComponent,
  },

  /**
   * @desc Inject billing store, auth store, and currency formatter.
   * @returns {{ billingStore: Object, authStore: Object, formatPrice: Function }}
   */
  setup() {
    const billingStore = useBillingStore();
    const authStore = useAuthStore();
    const { formatPrice } = useCurrencyFormat();
    return { billingStore, authStore, formatPrice };
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
     * @desc Initiate Stripe checkout for the selected pack.
     * Reuses the same auth/org guard as onSelectPlan() in billing.pricing.view.vue:
     * unauthenticated users are redirected to sign-in; logged-in users without a
     * current organization are redirected to org setup. On success Stripe redirects;
     * failures surface a user-facing banner for retry.
     * @param {{ packId: string, label: string }} pack
     * @returns {Promise<void>}
     */
    async onBuy(pack) {
      if (!pack?.packId || this.purchasingId) return;

      // Guest → redirect to sign-in with return URL
      if (!this.authStore.isLoggedIn) {
        this.$router.push({ path: '/signin', query: { redirect: '/pricing' } });
        return;
      }

      // Logged-in but no organization → redirect to org setup
      if (this.authStore.serverConfig?.organizations?.enabled && !this.authStore.user?.currentOrganization) {
        this.$router.push({ path: '/organization-required' });
        return;
      }

      this.purchasingId = pack.packId;
      this.purchaseError = null;
      try {
        await this.billingStore.createExtrasCheckout(pack.packId);
      } catch (err) {
        console.error('Failed to initiate extras checkout:', err);
        this.purchaseError = this.$t('billing.pricing.error.checkoutFailed');
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

@media (prefers-reduced-motion: reduce) {
  .billing-packs__card { transition: none; }
}
</style>
