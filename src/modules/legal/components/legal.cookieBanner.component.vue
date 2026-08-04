<template>
  <Teleport v-if="enabled && isMounted" to="body">
    <v-slide-y-reverse-transition>
      <v-card
        v-if="visible"
        role="region"
        aria-label="Cookie consent banner"
        aria-live="polite"
        elevation="0"
        class="pa-3"
        :style="panelStyle"
      >
        <p class="text-body-medium ma-0">
          {{ message }}
          <router-link
            :to="privacyPolicyPath"
            class="text-decoration-underline font-weight-medium text-medium-emphasis"
          >
            Privacy Policy
          </router-link>
        </p>
        <div class="d-flex justify-end ga-2 mt-3">
          <v-btn
            variant="text"
            color="on-surface"
            rounded="pill"
            size="small"
            @click="onReject"
          >
            No thanks
          </v-btn>
          <v-btn
            variant="flat"
            color="primary"
            rounded="pill"
            size="small"
            @click="onAccept"
          >
            Sounds good
          </v-btn>
        </div>
      </v-card>
    </v-slide-y-reverse-transition>
  </Teleport>
</template>

<script setup>
import { computed, getCurrentInstance, onMounted, ref } from 'vue';
import { useTheme } from 'vuetify';
import { useCookieConsent } from '../composables/useCookieConsent';
import { liquidGlassStyle } from '../../../lib/helpers/theme';
import { isPrerenderCrawl } from '../../../lib/helpers/prerender';

const instance = getCurrentInstance();
const theme = useTheme();

const isMounted = ref(false);

/**
 * Sets the isMounted flag after hydration, skipping the SEO prerender crawl.
 * @returns {void}
 */
// Guards against the banner being captured into static HTML and duplicated on
// hydration via Vue's Teleport (see isPrerenderCrawl).
onMounted(() => {
  if (isPrerenderCrawl()) return;
  isMounted.value = true;
});

/**
 * Reads the devkit config lazily to support both globalProperties (prod) and
 * Vue Test Utils mocks (tests), which are only available after setup.
 * @returns {object} The resolved config object (may be empty).
 */
const getConfig = () =>
  instance?.proxy?.config ||
  instance?.appContext?.config?.globalProperties?.config ||
  {};

/**
 * Resolves whether the cookie banner can render.
 * Returns true only when cookieConsent is enabled in config AND a PostHog
 * instance is available via $posthog. When PostHog is absent, a console.warn
 * is emitted and the banner is suppressed (no-op guard).
 * @returns {boolean} True when the banner should render, false otherwise.
 */
const enabled = computed(() => {
  const cfgEnabled = Boolean(getConfig()?.legal?.cookieConsent?.enabled);
  if (!cfgEnabled) return false;
  const hasPosthog = Boolean(instance?.proxy?.$posthog || instance?.appContext?.config?.globalProperties?.$posthog);
  if (!hasPosthog) {
    if (typeof console !== 'undefined') {
      console.warn(
        '[legal.cookieBanner] cookieConsent.enabled is true but $posthog is not available. ' +
        'The banner will not render. Set analytics.posthog.key to enable PostHog and the consent banner together.',
      );
    }
    return false;
  }
  return true;
});
const privacyPolicyPath = computed(() => getConfig()?.legal?.cookieConsent?.privacyPolicyPath || '/legal/privacy');
const appName = computed(() => getConfig()?.app?.title || getConfig()?.name || '');

const { consentNeeded, consent, accept, reject } = useCookieConsent();
const visible = computed(() => enabled.value && consentNeeded.value);

/**
 * Builds the cookie-banner body copy based on current consent state.
 * @returns {string} Descriptive message shown in the cookie consent banner.
 */
const message = computed(() => {
  if (consent.value !== null) return `Want to revisit your cookie choices for ${appName.value}?`;
  return 'A few cookies help us improve your experience. See our';
});

/**
 * Computed inline style for the cookie banner panel.
 * Merges the liquid-glass visual treatment (blur, saturate, tinted surface)
 * from the shared helper with fixed positioning in the bottom-right corner.
 * @returns {Record<string, string | number>} CSS style object for the cookie banner panel.
 */
const panelStyle = computed(() => ({
  ...liquidGlassStyle({
    vuetifyTheme: theme,
    intensity: 1,
    tint: 'auto',
    variant: 'card',
    border: 'none',
  }),
  position: 'fixed',
  right: 'clamp(12px, 2vw, 24px)',
  bottom: 'clamp(12px, 2vw, 24px)',
  zIndex: 2400,
  maxWidth: 'min(540px, calc(100vw - 24px))',
}));

/**
 * Delegates to the accept() action from useCookieConsent.
 * Opts PostHog in and persists the user's choice to localStorage.
 * @returns {void}
 */
const onAccept = () => accept();

/**
 * Delegates to the reject() action from useCookieConsent.
 * Opts PostHog out and persists the user's choice to localStorage.
 * @returns {void}
 */
const onReject = () => reject();
</script>
