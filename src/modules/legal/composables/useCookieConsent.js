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
      // consent_choice pair (#4520 / #4587): this accept-side event fires as a
      // normal opted-in capture (real distinct_id, standard capture context).
      // The reject() branch below mirrors it anonymously through PostHog's
      // cookieless_mode — never through opt_in_capturing() — so the pair stays
      // measurable without weakening the consent gate on decline.
      ph.capture('consent_choice', { accepted: true });
    }
  };

  /**
   * Reject optional analytics cookies.
   * Persists the rejection to localStorage, updates singleton refs, and opts PostHog out.
   *
   * `consent_choice { accepted: false }` is emitted ONLY when the app config
   * enables PostHog's `cookieless_mode` ('on_reject'; #4587). That flag's
   * blast radius is wider than this one event — it also enables anonymous
   * pre-consent capture for undecided visitors (see the note in
   * src/lib/plugins/posthog.js). PostHog is
   * initialized with `opt_out_capturing_by_default: true`, so
   * `posthog.capture()` is otherwise a no-op while opted out — opting in
   * first (even briefly, just to fire one event) would persist a
   * cookie/localStorage identifier, which both weakens consent gating and
   * violates the "cookieless" requirement for this event. With
   * `cookieless_mode: 'on_reject'`, `opt_out_capturing()` above instead
   * registers PostHog's anonymous cookieless sentinel distinct id (no
   * cookie, no persistent identifier) and keeps capturing active under it.
   *
   * Ordering is load-bearing: capture() must run BEFORE reset() below.
   * reset() re-derives a fresh (non-sentinel) anonymous id for any mode
   * other than `cookieless_mode: 'always'`, which would overwrite the
   * sentinel identity that opt_out_capturing() just registered. Capturing
   * first fixes the event's properties — including the sentinel id — before
   * reset() runs, so the emitted event stays anonymous regardless.
   * @returns {void}
   */
  const reject = () => {
    writeStored(false);
    consent.value = { analytics: false };
    consentNeeded.value = false;
    const ph = getPosthog();
    if (ph) {
      ph.opt_out_capturing();
      if (ph.config?.cookieless_mode === 'on_reject') {
        ph.capture('consent_choice', { accepted: false });
      }
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
