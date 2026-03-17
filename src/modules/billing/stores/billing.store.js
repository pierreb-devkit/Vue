/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';

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
    loading: false,
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
        console.log(err);
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
        console.log(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Create a Stripe Checkout session and redirect.
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
          cancelUrl: `${window.location.origin}/pricing`,
        });
        return res.data.data;
      } catch (err) {
        console.log(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Open Stripe Customer Portal and redirect.
     * @returns {Promise<void>}
     */
    async openPortal() {
      try {
        const api = apiBase();
        const res = await axios.post(`${api}/${config.api.endPoints.billing}/portal`);
        const portalUrl = res.data?.data?.url;
        if (!portalUrl) throw new Error('Invalid portal URL received from API');
        window.location.href = portalUrl;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },
});
