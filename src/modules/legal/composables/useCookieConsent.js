import { ref, getCurrentInstance } from 'vue';

export const COOKIE_CONSENT_LS_KEY = 'cookie_consent_v1';
export const CONSENT_VERSION = 1;
const TWELVE_MONTHS_MS = 12 * 30 * 24 * 60 * 60 * 1000;

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

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

/**
 * Vue composable for cookie consent state and PostHog opt-in/out gating.
 *
 * Reads/writes localStorage under `cookie_consent_v1` (12-month expiry, version-checked).
 * On mount, re-applies posthog opt_in if the user previously accepted.
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
  const stored = readStored();
  const consent = ref(stored);
  const consentNeeded = ref(stored === null);

  const instance = getCurrentInstance();
  const getPosthog = () => instance?.appContext?.config?.globalProperties?.$posthog || null;

  const accept = () => {
    writeStored(true);
    consent.value = { analytics: true };
    consentNeeded.value = false;
    const ph = getPosthog();
    if (ph) {
      ph.set_config({ persistence: 'localStorage+cookie' });
      ph.opt_in_capturing();
      ph.capture('consent_given', { analytics: true });
    }
  };

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

  const reopenSettings = () => {
    consentNeeded.value = true;
  };

  if (stored?.analytics === true) {
    const ph = getPosthog();
    if (ph) {
      ph.set_config({ persistence: 'localStorage+cookie' });
      ph.opt_in_capturing();
    }
  }

  return { consentNeeded, consent, accept, reject, reopenSettings };
}
