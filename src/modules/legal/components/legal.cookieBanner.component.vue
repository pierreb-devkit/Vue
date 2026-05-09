<template>
  <v-snackbar
    v-if="enabled && isMounted"
    v-model="visible"
    location="bottom right"
    :timeout="-1"
    multi-line
    :max-width="480"
    color="surface"
    :style="{ '--v-layout-bottom': '0px' }"
  >
    <div class="text-body-2">
      {{ message }}
      <router-link :to="privacyPolicyPath" class="text-primary">
        {{ $t('legal.banner.privacyPolicy') }}
      </router-link>
    </div>
    <template #actions>
      <v-btn variant="text" color="primary" @click="onAccept">
        {{ $t('legal.banner.accept') }}
      </v-btn>
      <v-btn variant="text" @click="onReject">
        {{ $t('legal.banner.reject') }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { computed, getCurrentInstance, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCookieConsent } from '../composables/useCookieConsent';

const instance = getCurrentInstance();

const isMounted = ref(false);
onMounted(() => { isMounted.value = true; });

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
const appName = computed(() => getConfig()?.name || '');

const { consentNeeded, consent, accept, reject } = useCookieConsent();
const visible = computed({
  get: () => enabled.value && consentNeeded.value,
  set: () => {},
});

const { t } = useI18n();
const message = computed(() => {
  if (consent.value !== null) return t('legal.banner.revokeMessage', { appName: appName.value });
  return t('legal.banner.message', { appName: appName.value });
});

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
