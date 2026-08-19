import { ref, getCurrentInstance } from 'vue';

export const COOKIE_CONSENT_LS_KEY = 'cookie_consent_v1';
export const CONSENT_VERSION = 1;
/** 365 days in milliseconds — GDPR-standard 12-month consent validity. */
const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Returns true when running in a browser environment with localStorage available.
 * @returns {boolean}
 */
const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

/**
 * Reads and validates the stored consent record from localStorage.
 * Returns null when absent, expired, version-mismatched, or malformed.
 * @returns {{ analytics: boolean } | null}
 */
const readStored = () => {
  if (!isBrowser()) return null;
  let raw;
  try { raw = localStorage.getItem(COOKIE_CONSENT_LS_KEY); } catch { return null; }
  if (!raw) return null;
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return null; }
  if (!parsed || parsed.version !== CONSENT_VERSION) return null;
  if (!parsed.expiresAt || Date.parse(parsed.expiresAt) < Date.now()) return null;
  if (typeof parsed.analytics !== 'boolean') return null;
  return { analytics: parsed.analytics };
};

/**
 * Writes a consent record to localStorage with a 365-day expiry.
 * Silently swallows quota / private-mode errors (session-only in that case).
 * @param {boolean} analytics - Whether analytics consent was granted
 * @returns {void}
 */
const writeStored = (analytics) => {
  if (!isBrowser()) return;
  const now = Date.now();
  const payload = {
    version: CONSENT_VERSION,
    timestamp: new Date(now).toISOString(),
    expiresAt: new Date(now + TWELVE_MONTHS_MS).toISOString(),
    analytics,
  };
  try { localStorage.setItem(COOKIE_CONSENT_LS_KEY, JSON.stringify(payload)); } catch { /* quota / private mode — accept session-only */ }
};

// ---------------------------------------------------------------------------
// Module-scope singleton refs — shared across all useCookieConsent() consumers
// so that banner + footer-section (and any future caller) stay in sync.
// ---------------------------------------------------------------------------
const _initialStored = readStored();
const consent = ref(_initialStored);
const consentNeeded = ref(_initialStored === null);
let _posthogReHydrated = false;

/**
 * Test-only helper to reset module-scope singleton state between test cases.
 * Re-reads localStorage so tests that seed LS before calling this get correct state.
 * NOT for production use.
 * @internal
 * @returns {void}
 */
export function __resetCookieConsentForTests() {
  const stored = readStored();
  consent.value = stored;
  consentNeeded.value = stored === null;
  _posthogReHydrated = false;
}

/**
 * Vue composable for cookie consent state and PostHog opt-in/out gating.
 *
 * Singleton: `consent` and `consentNeeded` refs are module-scope and shared
 * across all consumers (banner, footer-section, etc.) so that calling
 * `reopenSettings()` in one instance is immediately reactive in others.
 *
 * Reads/writes localStorage under `cookie_consent_v1` (365-day expiry,
 * version-checked). On first call with prior opt-in, re-applies PostHog
 * opt_in so analytics resume on reload without re-prompting.
 *
 * @returns {{
 *   consentNeeded: import('vue').Ref<boolean>,
 *   consent: import('vue').Ref<{analytics: boolean} | null>,
 *   accept: () => void,
 *   reject: () => void,
 *   reopenSettings: () => void
 * }}
 */
export function useCookieConsent() {
  const instance = getCurrentInstance();

  /**
   * Lazily resolves the PostHog plugin instance from Vue globalProperties.
   * Returns null when PostHog is not injected (non-analytics builds).
   * @returns {object|null}
   */
  const getPosthog = () => instance?.appContext?.config?.globalProperties?.$posthog || null;

  /**
   * Accept all analytics cookies.
   * Persists consent to localStorage, updates singleton refs, and opts PostHog in.
   * @returns {void}
   */
  const accept = () => {
    writeStored(true);
    consent.value = { analytics: true };
    consentNeeded.value = false;
    const ph = getPosthog();
    if (ph) {
      ph.set_config({ persistence: 'localStorage+cookie' });
      ph.opt_in_capturing();
      ph.capture('consent_given', { analytics: true });
      // Anonymous consent-decision event (#4520). Fired AFTER opt_in_capturing()
      // so it goes through the same gate as consent_given above — it therefore
      // carries the standard opted-in capture context, not a memory-only /
      // fully anonymous one (see the reject() comment below for why the
      // decline branch cannot mirror this).
      ph.capture('consent_choice', { accepted: true });
    }
  };

  /**
   * Reject optional analytics cookies.
   * Persists the rejection to localStorage, updates singleton refs, and opts PostHog out.
   *
   * `consent_choice` is intentionally NOT emitted here (#4520 open question):
   * PostHog is initialized with `opt_out_capturing_by_default: true`, so
   * `posthog.capture()` is a no-op until `opt_in_capturing()` runs — and
   * opting in first (even briefly, just to fire one event) persists a
   * cookie/localStorage consent flag, which both weakens consent gating and
   * violates the "cookieless" requirement for this event.
   * @returns {void}
   */
  const reject = () => {
    writeStored(false);
    consent.value = { analytics: false };
    consentNeeded.value = false;
    const ph = getPosthog();
    if (ph) {
      ph.opt_out_capturing();
      ph.reset();
    }
  };

  /**
   * Re-open the consent banner so the user can update their preferences.
   * Sets consentNeeded=true on the shared singleton ref — reactive in all consumers.
   * @returns {void}
   */
  const reopenSettings = () => {
    consentNeeded.value = true;
  };

  // Re-hydrate PostHog opt-in on first composable call after a page load where
  // the user had previously accepted. Only runs once per module lifetime.
  if (!_posthogReHydrated && consent.value?.analytics === true) {
    const ph = getPosthog();
    if (ph) {
      ph.set_config({ persistence: 'localStorage+cookie' });
      ph.opt_in_capturing();
    }
    _posthogReHydrated = true;
  }

  return { consentNeeded, consent, accept, reject, reopenSettings };
}
