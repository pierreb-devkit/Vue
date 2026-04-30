/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';
import { capture } from '../../../lib/helpers/analytics';

/**
 * @desc Build the base API URL from config.
 * @returns {string} Base API URL
 */
const apiBase = () => `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

/**
 * Store definition.
 */
export const useBillingStore = defineStore('billing', {
  state: () => ({
    plans: [],
    subscription: null,
    quota: null,
    /**
     * Legacy global loading flag — remains for backward compat with existing
     * consumers (fetchPlans, fetchSubscription, fetchUsage, createCheckout,
     * openPortal).  New meter actions use per-action flags below to avoid
     * false-idle flashes when multiple fetches run in parallel (e.g. Promise.all
     * in useMeter.refresh + 30s polling).
     */
    loading: false,
    // Per-action loading flags for meter actions (avoids race with parallel fetches)
    usageMeterLoading: false,
    extrasBalanceLoading: false,
    extrasLedgerLoading: false,
    extrasCheckoutLoading: false,
    // meter billing (meterMode: true)
    usageMeter: null, // { plan, planVersion, weekKey, weekResetAt, meterUsed, meterQuota, meterBreakdown, extrasRemaining, packsAvailable }
    extrasBalance: null, // { balance, packsAvailable }
    extrasLedger: { entries: [], total: 0, page: 1, limit: 20 },
  }),

  actions: {
    /**
     * @desc Fetch available billing plans (public).
     * @returns {Promise<Array>} Resolved list of plans
     */
    async fetchPlans() {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.get(`${api}/${config.api.endPoints.billing}/plans`);
        this.plans = res.data.data;
        return this.plans;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Fetch current subscription for the active organization.
     * @returns {Promise<Object>} Resolved subscription object
     */
    async fetchSubscription() {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.get(`${api}/${config.api.endPoints.billing}/subscription`);
        this.subscription = res.data.data;
        return this.subscription;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Fetch current usage and quota limits for the active organization.
     * @returns {Promise<Object>} Resolved quota object
     */
    async fetchUsage() {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.get(`${api}/${config.api.endPoints.billing}/usage`);
        this.quota = res.data.data;
        return this.quota;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Create a Stripe Checkout session and return checkout data.
     * @param {string} priceId - The Stripe price ID
     * @returns {Promise<Object>} Resolved checkout data with URL
     */
    async createCheckout(priceId) {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.post(`${api}/${config.api.endPoints.billing}/checkout`, {
          priceId,
          successUrl: `${window.location.origin}/billing?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        });
        capture('plan_upgraded', { price_id: priceId });
        return res.data.data;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Open Stripe Customer Portal by redirecting to the portal URL.
     * @returns {Promise<void>}
     */
    async openPortal() {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.post(`${api}/${config.api.endPoints.billing}/portal`);
        const url = res?.data?.data?.url;
        if (!url) {
          throw new Error('Billing portal URL is missing from the API response');
        }
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') {
          throw new Error('Rejected non-HTTPS portal URL');
        }
        window.location.href = parsed.toString();
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Fetch current meter usage and quota for the active organization.
     * Uses per-action flag `usageMeterLoading` to avoid race with parallel fetches.
     * @returns {Promise<Object>} Resolved usageMeter object
     */
    async fetchUsageMeter() {
      this.usageMeterLoading = true;
      try {
        const api = apiBase();
        const res = await axios.get(`${api}/${config.api.endPoints.billing}/usage`);
        this.usageMeter = res.data.data;
        return this.usageMeter;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.usageMeterLoading = false;
      }
    },

    /**
     * @desc Fetch the extras credit balance for the active organization.
     * Uses per-action flag `extrasBalanceLoading` to avoid race with parallel fetches.
     * @returns {Promise<Object>} Resolved extrasBalance object
     */
    async fetchExtrasBalance() {
      this.extrasBalanceLoading = true;
      try {
        const api = apiBase();
        const res = await axios.get(`${api}/${config.api.endPoints.billing}/extras/balance`);
        this.extrasBalance = res.data.data;
        return this.extrasBalance;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.extrasBalanceLoading = false;
      }
    },

    /**
     * @desc Fetch a paginated ledger of extras credit transactions.
     * Uses per-action flag `extrasLedgerLoading` to avoid race with parallel fetches.
     * @param {Object} [opts] - Pagination options
     * @param {number} [opts.page=1] - Page number (1-based)
     * @param {number} [opts.limit=20] - Page size
     * @returns {Promise<Object>} Resolved extrasLedger object { entries, total, page, limit }
     */
    async fetchExtrasLedger({ page = 1, limit = 20 } = {}) {
      this.extrasLedgerLoading = true;
      try {
        const api = apiBase();
        const res = await axios.get(`${api}/${config.api.endPoints.billing}/extras/ledger`, {
          params: { page, limit },
        });
        this.extrasLedger = res.data.data;
        return this.extrasLedger;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.extrasLedgerLoading = false;
      }
    },

    /**
     * @desc Purchase an extras credit pack and redirect to Stripe Checkout.
     * Uses per-action flag `extrasCheckoutLoading` to avoid race with parallel fetches.
     * @param {string} packId - The pack identifier to purchase
     * @returns {Promise<void>}
     */
    async createExtrasCheckout(packId) {
      this.extrasCheckoutLoading = true;
      try {
        const api = apiBase();
        const successUrl = `${window.location.origin}/billing?packPurchased=1`;
        const cancelUrl = `${window.location.origin}/pricing`;
        const res = await axios.post(`${api}/${config.api.endPoints.billing}/extras/checkout`, {
          packId,
          successUrl,
          cancelUrl,
        });
        const url = res?.data?.data?.url;
        if (!url) throw new Error('Checkout URL missing in response');
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') {
          throw new Error('Rejected non-HTTPS checkout URL');
        }
        window.location.assign(parsed.toString());
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.extrasCheckoutLoading = false;
      }
    },
  },
});
