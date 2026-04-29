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
    loading: false,
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
     * @returns {Promise<Object>} Resolved usageMeter object
     */
    async fetchUsageMeter() {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.get(`${api}/${config.api.endPoints.billing}/usage`);
        this.usageMeter = res.data.data;
        return this.usageMeter;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Fetch the extras credit balance for the active organization.
     * @returns {Promise<Object>} Resolved extrasBalance object
     */
    async fetchExtrasBalance() {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.get(`${api}/${config.api.endPoints.billing}/extras/balance`);
        this.extrasBalance = res.data.data;
        return this.extrasBalance;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Fetch a paginated ledger of extras credit transactions.
     * @param {Object} [opts] - Pagination options
     * @param {number} [opts.page=1] - Page number (1-based)
     * @param {number} [opts.limit=20] - Page size
     * @returns {Promise<Object>} Resolved extrasLedger object { entries, total, page, limit }
     */
    async fetchExtrasLedger({ page = 1, limit = 20 } = {}) {
      this.loading = true;
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
        this.loading = false;
      }
    },

    /**
     * @desc Purchase an extras credit pack and redirect to Stripe Checkout.
     * @param {string} packId - The pack identifier to purchase
     * @returns {Promise<void>}
     */
    async createExtrasCheckout(packId) {
      this.loading = true;
      try {
        const api = apiBase();
        const successUrl = `${window.location.origin}/billing?packPurchased=1`;
        const cancelUrl = `${window.location.origin}/billing/pricing`;
        const res = await axios.post(`${api}/${config.api.endPoints.billing}/extras/checkout`, {
          packId,
          successUrl,
          cancelUrl,
        });
        const { url } = res.data.data;
        if (url) window.location.assign(url);
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
