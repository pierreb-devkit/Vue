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
export const useDevelopersStore = defineStore('developers', {
  state: () => ({
    keys: [],
    keysTotal: 0,
    keysPage: 1,
    keysPerPage: 20,
    webhooks: [],
    webhooksTotal: 0,
    webhooksPage: 1,
    webhooksPerPage: 20,
    deliveries: [],
    deliveriesTotal: 0,
    loading: false,
  }),

  actions: {
    // --- API Keys ---

    /**
     * @desc Fetch API keys for the current user with pagination.
     * @param {number} [page=1] - Page number
     * @param {number} [perPage=20] - Items per page
     * @returns {Promise<Array>}
     */
    async fetchKeys(page = 1, perPage = 20) {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.get(`${api}/${config.api.endPoints.developers}/keys`, {
          params: { page, perPage },
        });
        this.keys = res.data.data;
        this.keysTotal = res.data.total || res.data.data.length;
        this.keysPage = page;
        this.keysPerPage = perPage;
        return this.keys;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Create a new API key.
     * @param {Object} data - { name, scopes, expiresAt }
     * @returns {Promise<Object>} Created key with plainKey
     */
    async createKey(data) {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.post(`${api}/${config.api.endPoints.developers}/keys`, data);
        const key = res.data.data;
        await this.fetchKeys(1, this.keysPerPage);
        return key;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Revoke an API key.
     * @param {string} id - The API key ID
     * @returns {Promise<void>}
     */
    async revokeKey(id) {
      this.loading = true;
      try {
        const api = apiBase();
        await axios.delete(`${api}/${config.api.endPoints.developers}/keys/${id}`);
        await this.fetchKeys(this.keysPage, this.keysPerPage);
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // --- Webhooks ---

    /**
     * @desc Fetch webhooks for the current user with pagination.
     * @param {number} [page=1] - Page number
     * @param {number} [perPage=20] - Items per page
     * @returns {Promise<Array>}
     */
    async fetchWebhooks(page = 1, perPage = 20) {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.get(`${api}/${config.api.endPoints.developers}/webhooks`, {
          params: { page, perPage },
        });
        this.webhooks = res.data.data;
        this.webhooksTotal = res.data.total || res.data.data.length;
        this.webhooksPage = page;
        this.webhooksPerPage = perPage;
        return this.webhooks;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Create a new webhook.
     * @param {Object} data - { url, events, description }
     * @returns {Promise<Object>} Created webhook with plainSecret
     */
    async createWebhook(data) {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.post(`${api}/${config.api.endPoints.developers}/webhooks`, data);
        const webhook = res.data.data;
        await this.fetchWebhooks(1, this.webhooksPerPage);
        return webhook;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Update a webhook.
     * @param {string} id - The webhook ID
     * @param {Object} data - Update payload
     * @returns {Promise<Object>}
     */
    async updateWebhook(id, data) {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.put(`${api}/${config.api.endPoints.developers}/webhooks/${id}`, data);
        const updated = res.data.data;
        const idx = this.webhooks.findIndex((w) => (w.id || w._id) === id);
        if (idx !== -1) this.webhooks.splice(idx, 1, updated);
        return updated;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Delete a webhook.
     * @param {string} id - The webhook ID
     * @returns {Promise<void>}
     */
    async deleteWebhook(id) {
      this.loading = true;
      try {
        const api = apiBase();
        await axios.delete(`${api}/${config.api.endPoints.developers}/webhooks/${id}`);
        await this.fetchWebhooks(this.webhooksPage, this.webhooksPerPage);
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Fetch deliveries for a webhook with pagination.
     * @param {string} webhookId - The webhook ID
     * @param {number} [page=1] - Page number
     * @param {number} [perPage=20] - Items per page
     * @returns {Promise<Array>}
     */
    async fetchDeliveries(webhookId, page = 1, perPage = 20) {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.get(`${api}/${config.api.endPoints.developers}/webhooks/${webhookId}/deliveries`, {
          params: { page, perPage },
        });
        this.deliveries = res.data.data;
        this.deliveriesTotal = res.data.total || res.data.data.length;
        return this.deliveries;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Send a test ping to a webhook.
     * @param {string} webhookId - The webhook ID
     * @returns {Promise<Object>} Test result
     */
    async testWebhook(webhookId) {
      this.loading = true;
      try {
        const api = apiBase();
        const res = await axios.post(`${api}/${config.api.endPoints.developers}/webhooks/${webhookId}/test`);
        return res.data.data;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
