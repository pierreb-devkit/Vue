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
    subscriptionError: null,
    quota: null,
    /**
     * Legacy global loading flag — remains for backward compat with existing
     * consumers (fetchPlans, fetchSubscription, fetchUsage, createCheckout,
     * openPortal).  New meter actions use per-action flags below to avoid
     * false-idle flashes when multiple fetches run in parallel (e.g. Promise.all
     * in useMeter.refresh + 30s polling).
     */
    loading: false,
    // Per-action in-flight counters for meter actions.
    // Using counters (not booleans) so that overlapping calls from the 30s polling loop
    // cannot flip the flag false while a prior request is still in-flight.
    // Loading state = counter > 0; idle state = counter === 0.
    usageMeterRequests: 0,
    extrasBalanceRequests: 0,
    extrasLedgerRequests: 0,
    extrasCheckoutRequests: 0,
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
     * Clears subscriptionError on success; sets it on failure so the UI can
     * show an explicit error state instead of silently falling back to free plan.
     * @returns {Promise<Object>} Resolved subscription object
     */
    async fetchSubscription() {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.get(`${api}/${config.api.endPoints.billing}/subscription`);
        this.subscription = res.data.data;
        this.subscriptionError = null;
        return this.subscription;
      } catch (err) {
        this.subscriptionError = err.message || 'Failed to load subscription';
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
     * Throws a structured error with code 'subscription_already_active' and
     * portalUrl when the backend responds 409 (PR Node-A contract).
     * @param {string} priceId - The Stripe price ID
     * @returns {Promise<Object>} Resolved checkout data with URL
     */
    async createCheckout(priceId) {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.post(`${api}/${config.api.endPoints.billing}/checkout`, {
          priceId,
          successUrl: `${window.location.origin}/users?tab=subscriptions&success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        });
        capture('plan_upgraded', { price_id: priceId });
        return res.data.data;
      } catch (err) {
        if (err.response?.status === 409 && err.response?.data?.code === 'subscription_already_active') {
          const alreadyActiveError = new Error('subscription_already_active');
          alreadyActiveError.code = 'subscription_already_active';
          alreadyActiveError.portalUrl = err.response.data.portalUrl;
          throw alreadyActiveError;
        }
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
     * Uses a per-action in-flight counter so overlapping polling calls cannot
     * race each other to a false-idle state.
     * @returns {Promise<Object>} Resolved usageMeter object
     */
    async fetchUsageMeter() {
      this.usageMeterRequests += 1;
      try {
        const api = apiBase();
        const res = await axios.get(`${api}/${config.api.endPoints.billing}/usage`);
        this.usageMeter = res.data.data;
        return this.usageMeter;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.usageMeterRequests -= 1;
      }
    },

    /**
     * @desc Fetch the extras credit balance for the active organization.
     * Uses a per-action in-flight counter so overlapping polling calls cannot
     * race each other to a false-idle state.
     * @returns {Promise<Object>} Resolved extrasBalance object
     */
    async fetchExtrasBalance() {
      this.extrasBalanceRequests += 1;
      try {
        const api = apiBase();
        const res = await axios.get(`${api}/${config.api.endPoints.billing}/extras/balance`);
        this.extrasBalance = res.data.data;
        return this.extrasBalance;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.extrasBalanceRequests -= 1;
      }
    },

    /**
     * @desc Fetch a paginated ledger of extras credit transactions.
     * Uses a per-action in-flight counter so overlapping calls cannot race.
     * @param {Object} [opts] - Pagination options
     * @param {number} [opts.page=1] - Page number (1-based)
     * @param {number} [opts.limit=20] - Page size
     * @returns {Promise<Object>} Resolved extrasLedger object { entries, total, page, limit }
     */
    async fetchExtrasLedger({ page = 1, limit = 20 } = {}) {
      this.extrasLedgerRequests += 1;
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
        this.extrasLedgerRequests -= 1;
      }
    },

    /**
     * @desc Purchase an extras credit pack and redirect to Stripe Checkout.
     * Uses a per-action in-flight counter so concurrent calls cannot race.
     * @param {string} packId - The pack identifier to purchase
     * @returns {Promise<void>}
     */
    async createExtrasCheckout(packId) {
      this.extrasCheckoutRequests += 1;
      try {
        const api = apiBase();
        const successUrl = `${window.location.origin}/users?tab=subscriptions&success=true&type=extras`;
        const cancelUrl = `${window.location.origin}/pricing?canceled=true#units`;
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
        this.extrasCheckoutRequests -= 1;
      }
    },
  },
});
