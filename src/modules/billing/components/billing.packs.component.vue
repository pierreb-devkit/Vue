<!--
  BillingPacksComponent
  =====================
  Cards grid for purchasing extra compute units.

  Data source: the RESOLVED packs array passed in by the parent (V4 unified schema).
  The component never re-resolves config — the pricing view owns tab resolution and
  hands down the active tab's packs slot. Store `packsAvailable` is NOT used for
  rendering. Pack IDs must match backend Stripe product IDs.

  On click → calls `billingStore.createExtrasCheckout(packId)` which initiates a
  Stripe Checkout session and redirects the user.

  Uses BillingCardComponent — same visual structure as plan cards for visual
  consistency across tabs.

  PROPS:
  - packs (Array): resolved pack entries to render. Empty → empty-state copy.

  USAGE:
  <BillingPacksComponent :packs="activeTabPacks" />
-->
<template>
  <div class="billing-packs">
    <!-- Empty state -->
    <p
      v-if="resolvedItems.length === 0"
      class="text-body-medium text-medium-emphasis text-center py-10"
    >
      No unit packs available at this time.
    </p>

    <!-- Cards grid — uses unified BillingCardComponent -->
    <v-row v-else justify="center">
      <v-col
        v-for="item in resolvedItems"
        :key="item.id"
        cols="12"
        sm="6"
        md="4"
      >
        <BillingCardComponent
          :item="item"
          @cta-click="onCtaClick"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { useBillingStore } from '../stores/billing.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import BillingCardComponent from './billing.card.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'BillingPacksComponent',
  components: {
    BillingCardComponent,
  },

  props: {
    /**
     * @desc Resolved pack entries to render (V4 unified card schema). The parent
     * resolves these from config; this component takes the array, never a key name.
     */
    packs: {
      type: Array,
      default: () => [],
    },
  },

  /**
   * @desc Inject billing store and auth store.
   * @returns {{ billingStore: Object, authStore: Object }}
   */
  setup() {
    const billingStore = useBillingStore();
    const authStore = useAuthStore();
    return { billingStore, authStore };
  },

  data() {
    return {
      /** @type {string|null} packId currently being purchased (drives loading state) */
      purchasingId: null,
    };
  },

  computed: {
    /**
     * @desc Packs to render, from the `packs` prop (V4 unified schema). Backend
     * `packsAvailable` is only used at checkout for Stripe price lookup — packIds
     * must match between FE + BE.
     * @returns {Array<Object>}
     */
    resolvedItems() {
      return this.packs.map((pack) => {
        const isLoading = this.purchasingId === pack.id;
        const isDisabled = !!this.purchasingId && !isLoading;
        return {
          ...pack,
          cta: {
            label: pack.cta,
            variant: pack.highlight ? 'flat' : 'outlined',
            color: pack.highlight ? 'primary' : null,
            disabled: isDisabled,
            loading: isLoading,
            to: null,
          },
        };
      });
    },
  },

  methods: {
    /**
     * @desc Initiate Stripe checkout for the selected pack.
     * Reuses the same auth/org guard as onSelectPlan() in billing.pricing.view.vue:
     * unauthenticated users are redirected to sign-in; logged-in users without a
     * current organization are redirected to org setup. On success Stripe redirects;
     * Errors are surfaced via the centralized snackbar (lib/services/axios.js
     * interceptor) — no inline error alert rendered here.
     * @param {{ id: string }} payload emitted by BillingCardComponent
     * @returns {Promise<void>}
     */
    async onCtaClick({ id: packId }) {
      if (!packId || this.purchasingId) return;

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

      this.purchasingId = packId;
      try {
        await this.billingStore.createExtrasCheckout(packId);
      } catch (err) {
        // Centralized snackbar (lib/services/axios.js interceptor) surfaces
        // backend error.description automatically. Console log for debug only.
        console.error('Failed to initiate extras checkout:', err);
      } finally {
        this.purchasingId = null;
      }
    },
  },
};
</script>
