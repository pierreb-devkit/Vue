/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';
import { capture } from '../../../lib/helpers/analytics';
import { validateStripeUrl } from '../lib/stripeRedirect';

/**
 * @desc Build the base API URL from config.
 * @returns {string} Base API URL
 */
const apiBase = () => `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

/**
 * @desc sessionStorage key prefix for per-pack extras checkout intent IDs.
 * One UUID is generated per pack purchase attempt and persists across the
 * Stripe redirect so that double-clicks (same tab, same session) reuse it
 * and the backend de-duplicates against a single idempotency key.
 */
const EXTRAS_INTENT_STORAGE_PREFIX = 'billing.extras.intentId.';

/**
 * @desc Build the sessionStorage key for a pack's intent ID.
 * @param {string} packId
 * @returns {string}
 */
const extrasIntentKey = (packId) => `${EXTRAS_INTENT_STORAGE_PREFIX}${packId}`;

/**
 * @desc Generate a v4 UUID via the browser builtin crypto.randomUUID.
 * Available in all targeted browsers (Chrome 92+, Firefox 95+, Safari 15.4+).
 * @returns {string}
 */
const generateIntentId = () => crypto.randomUUID();

/**
 * @desc Resolve the intentId for an extras checkout attempt.
 *
 * Generates a fresh UUID on first attempt for `packId` and persists it in
 * sessionStorage so a user double-clicking (same tab, same session) reuses the
 * same idempotency key — even if the second click happens after the first one
 * redirected to Stripe and the user came back. The backend uses this UUID to
 * deduplicate the Stripe Checkout session, closing the cross-minute
 * double-charge window where the previous minute-bucketed fallback could yield
 * two distinct keys for two clicks straddling a minute boundary.
 *
 * sessionStorage failures (private browsing, quota exceeded, missing global)
 * are intentionally swallowed — the freshly-generated UUID is still used for
 * the in-flight call. The only effect is losing cross-double-click protection
 * within that session, which does NOT cause double-charge by itself (the
 * single attempt already carries a stable idempotency key). This is unrelated
 * to the silent-catch rule for DB/network errors: storage unavailability is a
 * non-fatal client-side condition with no actionable signal.
 *
 * @param {string} packId
 * @returns {string} UUID v4 (best effort)
 */
const resolveExtrasIntentId = (packId) => {
  const key = extrasIntentKey(packId);
  let intentId = null;
  try {
    intentId = sessionStorage.getItem(key);
  } catch {
    // sessionStorage unavailable (private mode / sandboxed) — fall through to fresh UUID
  }
  if (intentId) return intentId;
  intentId = generateIntentId();
  try {
    sessionStorage.setItem(key, intentId);
  } catch {
    // Quota exceeded or storage disabled — UUID is still used for this single call
  }
  return intentId;
};

/**
 * @desc Clear every persisted extras intentId from sessionStorage.
 * Called after a successful extras purchase so subsequent purchases of the
 * same pack get a fresh UUID. Also called when the user returns from a
 * cancelled Stripe checkout — Stripe's 24h idempotency cache otherwise
 * replays the previous (potentially expired or stale) session URL on retry.
 * @returns {void}
 */
export const clearExtrasIntentIds = () => {
  try {
    if (typeof sessionStorage === 'undefined') return;
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(EXTRAS_INTENT_STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      sessionStorage.removeItem(key);
    }
  } catch {
    // sessionStorage unavailable — nothing to clean up
  }
};

/**
 * @desc Clear the persisted intentId for a single pack from sessionStorage.
 * Used on the Stripe cancel-redirect path so a retry of that specific pack
 * generates a fresh UUID — without touching intent IDs of other packs the
 * user may have started purchasing in parallel tabs.
 * @param {string} packId
 * @returns {void}
 */
export const clearExtrasIntentId = (packId) => {
  if (!packId) return;
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.removeItem(extrasIntentKey(packId));
  } catch {
    // sessionStorage unavailable — nothing to clean up
  }
};

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

  getters: {
    /**
     * @desc Returns true when the current org is on the Free plan AND has exhausted
     * their one-shot signup grant. Specifically: plan === 'free', extrasBalance <= 0,
     * AND the extrasLedger has at least one entry with source === 'signup_grant'.
     *
     * Used to trigger the post-grant upgrade modal variant instead of the regular
     * meter-exhaustion prompt.
     *
     * Returns false when any required state is absent (null-safe).
     * @param {Object} state Pinia store state
     * @returns {boolean}
     */
    exhaustedAfterGrant: (state) => {
      if (!state.subscription) return false;
      if (state.subscription.plan !== 'free') return false;
      if (!state.extrasBalance) return false;
      const balance = state.extrasBalance.balance ?? 0;
      if (balance > 0) return false;
      // Optional chaining: extrasLedger is initialized to {entries:[]} in devkit state, but
      // downstream projects may override the store shape, so guard defensively.
      const entries = state.extrasLedger?.entries;
      if (!Array.isArray(entries) || entries.length === 0) return false;
      return entries.some((e) => e.source === 'signup_grant');
    },
  },

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
        window.location.href = validateStripeUrl(url);
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
        // type=extras + pack={packId} let the pricing view drop the persisted
        // intentId on cancel-redirect so the next attempt generates a fresh
        // UUID — Stripe's 24h idempotency cache would otherwise replay the
        // previous (possibly expired) session URL.
        const cancelUrl = `${window.location.origin}/pricing?canceled=true&type=extras&pack=${encodeURIComponent(packId)}#units`;
        const intentId = resolveExtrasIntentId(packId);
        const res = await axios.post(`${api}/${config.api.endPoints.billing}/extras/checkout`, {
          packId,
          successUrl,
          cancelUrl,
          intentId,
        });
        const url = res?.data?.data?.url;
        if (!url) throw new Error('Checkout URL missing in response');
        window.location.assign(validateStripeUrl(url));
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.extrasCheckoutRequests -= 1;
      }
    },
  },
});
