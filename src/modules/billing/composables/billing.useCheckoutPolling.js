/**
 * billing.useCheckoutPolling.js
 * ==============================
 * Composable owning the checkout-success polling state machine extracted from
 * BillingSubscriptionsComponent (issue #4219).
 *
 * Responsibilities:
 * - Detect ?success=true / ?packPurchased=true Stripe redirect query params
 * - Persist polling session to sessionStorage for F5-reload recovery
 * - Poll fetchSubscription until the subscription changes or max attempts exceeded
 * - Expose reactive state: checkoutProcessing, checkoutTimeout, paymentSuccessMessage
 *
 * BEHAVIOR IS IDENTICAL to the inlined logic that previously lived in the
 * component — this is a pure structural extraction with no logic change.
 */

/**
 * Module dependencies.
 */
import { ref } from 'vue';
import { useBillingStore, clearExtrasIntentIds } from '../stores/billing.store';

/** Maximum number of polling attempts after checkout success (2s × 8 = 16s max). */
export const CHECKOUT_POLL_MAX = 8;
/** Interval between polling attempts in milliseconds. */
export const CHECKOUT_POLL_INTERVAL_MS = 2000;
/** Total polling window in milliseconds (POLL_MAX × POLL_INTERVAL). */
export const CHECKOUT_POLL_WINDOW_MS = CHECKOUT_POLL_MAX * CHECKOUT_POLL_INTERVAL_MS;
/** sessionStorage key used to persist polling state across F5 reloads. */
export const CHECKOUT_POLL_SESSION_KEY = 'billing.checkout.polling';

/**
 * @desc Best-effort sessionStorage.removeItem — silently ignores SecurityError
 * thrown in privacy / sandboxed browser contexts where storage is unavailable.
 * @param {string} key
 * @returns {void}
 */
export function safeSessionRemove(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // SecurityError in private/sandboxed mode — nothing to clean up
  }
}

/**
 * @desc Composable owning the checkout-success polling state machine.
 *
 * All reactive polling state lives here; the component calls this from setup()
 * and binds the returned refs directly.
 *
 * @returns {{
 *   checkoutProcessing: import('vue').Ref<boolean>,
 *   checkoutTimeout: import('vue').Ref<boolean>,
 *   paymentSuccessMessage: import('vue').Ref<string|null>,
 *   checkoutPollCount: import('vue').Ref<number>,
 *   pollAborted: import('vue').Ref<boolean>,
 *   checkoutPollSnapshotId: import('vue').Ref<string|null>,
 *   checkoutPollSnapshotStatus: import('vue').Ref<string|null>,
 *   checkoutPollSnapshotPlan: import('vue').Ref<string|null>,
 *   checkoutPollTimer: import('vue').Ref<ReturnType<typeof setTimeout>|null>,
 *   handleCheckoutSuccessQuery: (route: object, scheduleQueryCleanup: () => void) => boolean,
 *   resumeCheckoutPollingFromSession: () => boolean,
 *   persistCheckoutPollingSession: (payload: object) => void,
 *   clearCheckoutPollingSession: () => void,
 *   pollSubscription: () => void,
 * }}
 */
export function useCheckoutPolling() {
  const billingStore = useBillingStore();

  // ── Reactive polling state ──────────────────────────────────────────────────

  /** @type {import('vue').Ref<boolean>} True while actively polling after Stripe redirect */
  const checkoutProcessing = ref(false);

  /** @type {import('vue').Ref<boolean>} True when polling exhausted without state change */
  const checkoutTimeout = ref(false);

  /** @type {import('vue').Ref<string|null>} Success message shown after activation / extras credit */
  const paymentSuccessMessage = ref(null);

  /** @type {import('vue').Ref<number>} Number of poll attempts completed */
  const checkoutPollCount = ref(0);

  /** @type {import('vue').Ref<boolean>} Set true on beforeUnmount to abort in-flight poll continuation */
  const pollAborted = ref(false);

  /** @type {import('vue').Ref<string|null>} Pre-checkout stripeSubscriptionId snapshot */
  const checkoutPollSnapshotId = ref(null);

  /** @type {import('vue').Ref<string|null>} Pre-checkout subscription status snapshot */
  const checkoutPollSnapshotStatus = ref(null);

  /** @type {import('vue').Ref<string|null>} Pre-checkout plan snapshot */
  const checkoutPollSnapshotPlan = ref(null);

  /** @type {import('vue').Ref<ReturnType<typeof setTimeout>|null>} Active poll timer handle */
  const checkoutPollTimer = ref(null);

  // ── Methods ─────────────────────────────────────────────────────────────────

  /**
   * @desc Persist checkout polling session to sessionStorage for F5 recovery.
   * @param {{ startedAt: number, snapshotId: string|null, snapshotStatus: string|null, snapshotPlan: string|null }} payload
   * @returns {void}
   */
  function persistCheckoutPollingSession(payload) {
    try {
      sessionStorage.setItem(CHECKOUT_POLL_SESSION_KEY, JSON.stringify(payload));
    } catch {
      // sessionStorage unavailable (private mode / quota exceeded) — polling continues without persistence
    }
  }

  /**
   * @desc Clear the checkout polling session from sessionStorage.
   * Called on successful activation or timeout to prevent stale resumption.
   * @returns {void}
   */
  function clearCheckoutPollingSession() {
    try {
      sessionStorage.removeItem(CHECKOUT_POLL_SESSION_KEY);
    } catch {
      // sessionStorage unavailable — nothing to clean up
    }
  }

  /**
   * @desc Poll fetchSubscription until the subscription changes or max attempts reached.
   * Criteria: stripeSubscriptionId appeared, OR status changed to active/trialing,
   * OR plan changed (covers upgrades that keep the same Stripe sub ID and status).
   * @returns {void}
   */
  function pollSubscription() {
    checkoutPollTimer.value = setTimeout(async () => {
      try {
        await billingStore.fetchSubscription();
      } catch {
        // Keep polling even on transient errors
      }

      if (pollAborted.value) return;

      const sub = billingStore.subscription;
      const newId = sub?.stripeSubscriptionId ?? null;
      const newStatus = sub?.status ?? null;
      const newPlan = sub?.plan ?? null;

      const activated =
        (newId && newId !== checkoutPollSnapshotId.value) ||
        (['active', 'trialing'].includes(newStatus) && newStatus !== checkoutPollSnapshotStatus.value) ||
        (newPlan && newPlan !== checkoutPollSnapshotPlan.value);

      if (activated) {
        checkoutProcessing.value = false;
        checkoutTimeout.value = false;
        clearCheckoutPollingSession();
        paymentSuccessMessage.value = 'Subscription activated successfully. Thank you!';
        return;
      }

      checkoutPollCount.value += 1;
      if (checkoutPollCount.value >= CHECKOUT_POLL_MAX) {
        checkoutProcessing.value = false;
        checkoutTimeout.value = true;
        clearCheckoutPollingSession();
        return;
      }

      pollSubscription();
    }, CHECKOUT_POLL_INTERVAL_MS);
  }

  /**
   * @desc Detect ?success=true or ?checkout=success from Stripe redirect and start polling.
   * Returns true when checkout-success polling is initiated (skips normal single fetch).
   * @param {object} route - Vue Router current route object (this.$route)
   * @param {() => void} scheduleQueryCleanup - Callback to clean URL query params after detection
   * @returns {boolean} True when polling was started
   */
  // biome-ignore lint/correctness/useQwikValidLexicalScope: false positive — composable closure, not a Qwik component
  function handleCheckoutSuccessQuery(route, scheduleQueryCleanup) {
    const query = route?.query || {};
    const packPurchased = query.packPurchased === true || query.packPurchased === 'true';
    const isSuccess = query.success === 'true' || packPurchased;
    if (!isSuccess) return false;

    if (query.type === 'extras' || packPurchased) {
      // Extras purchase: no subscription state to poll — show success directly.
      // Clear any leftover subscription polling session and return true so that
      // mounted() skips both resumeCheckoutPollingFromSession() and the normal
      // fetchSubscription() call, preventing stale polling from overriding the
      // extras success banner.
      clearCheckoutPollingSession();
      // Drop the persisted intentId(s) so a follow-up purchase of the same pack
      // generates a fresh UUID. Cancelled flows do NOT reach this branch and
      // intentionally keep the intentId so retries reuse the same idempotency key.
      clearExtrasIntentIds();
      paymentSuccessMessage.value = 'Pack credited to your balance';
      scheduleQueryCleanup();
      return true;
    }

    // Subscription checkout success: capture pre-poll snapshot and start polling
    checkoutProcessing.value = true;
    checkoutTimeout.value = false;
    checkoutPollCount.value = 0;
    checkoutPollSnapshotId.value = billingStore.subscription?.stripeSubscriptionId ?? null;
    checkoutPollSnapshotStatus.value = billingStore.subscription?.status ?? null;
    checkoutPollSnapshotPlan.value = billingStore.subscription?.plan ?? null;
    persistCheckoutPollingSession({
      startedAt: Date.now(),
      snapshotId: checkoutPollSnapshotId.value,
      snapshotStatus: checkoutPollSnapshotStatus.value,
      snapshotPlan: checkoutPollSnapshotPlan.value,
    });
    scheduleQueryCleanup();
    pollSubscription();
    return true;
  }

  /**
   * @desc Attempt to resume an interrupted checkout polling session after F5 reload.
   * Reads from sessionStorage — clears stale entry when the polling window has expired.
   * When resumed, restores the pre-checkout snapshots from storage so that polling
   * detects state changes against the original baseline (not the null store state after reload).
   * @returns {boolean} True when polling was successfully resumed
   */
  function resumeCheckoutPollingFromSession() {
    let stored;
    try {
      const raw = sessionStorage.getItem(CHECKOUT_POLL_SESSION_KEY);
      if (!raw) return false;
      stored = JSON.parse(raw);
    } catch {
      safeSessionRemove(CHECKOUT_POLL_SESSION_KEY);
      return false;
    }

    const { startedAt, snapshotId, snapshotStatus, snapshotPlan } = stored;

    // Validate startedAt to guard against malformed storage data.
    // Number.isFinite rejects NaN, Infinity, null, strings, and future timestamps.
    const now = Date.now();
    if (!Number.isFinite(startedAt) || startedAt <= 0 || startedAt > now) {
      safeSessionRemove(CHECKOUT_POLL_SESSION_KEY);
      return false;
    }

    const elapsed = now - startedAt;
    const remaining = CHECKOUT_POLL_WINDOW_MS - elapsed;

    if (remaining <= 0) {
      safeSessionRemove(CHECKOUT_POLL_SESSION_KEY);
      return false;
    }

    // Resume: restore baseline snapshots from storage and poll for remaining time.
    // Using persisted snapshots (not null store state) prevents a false-positive
    // activation on the first fetch after F5.
    checkoutProcessing.value = true;
    checkoutTimeout.value = false;
    checkoutPollCount.value = Math.floor(elapsed / CHECKOUT_POLL_INTERVAL_MS);
    checkoutPollSnapshotId.value = snapshotId ?? null;
    checkoutPollSnapshotStatus.value = snapshotStatus ?? null;
    checkoutPollSnapshotPlan.value = snapshotPlan ?? null;
    pollSubscription();
    return true;
  }

  return {
    // State
    checkoutProcessing,
    checkoutTimeout,
    paymentSuccessMessage,
    checkoutPollCount,
    pollAborted,
    checkoutPollSnapshotId,
    checkoutPollSnapshotStatus,
    checkoutPollSnapshotPlan,
    checkoutPollTimer,
    // Methods
    handleCheckoutSuccessQuery,
    resumeCheckoutPollingFromSession,
    persistCheckoutPollingSession,
    clearCheckoutPollingSession,
    pollSubscription,
  };
}

/**
 * Exports.
 */
export default useCheckoutPolling;
