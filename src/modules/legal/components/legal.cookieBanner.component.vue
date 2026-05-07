<template>
  <v-snackbar
    v-if="enabled"
    v-model="visible"
    location="bottom right"
    :timeout="-1"
    multi-line
    :max-width="480"
    color="surface"
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
import { computed, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCookieConsent } from '../composables/useCookieConsent';

const instance = getCurrentInstance();

/**
 * Reads the devkit config lazily to support both globalProperties (prod) and
 * Vue Test Utils mocks (tests), which are only available after setup.
 * @returns {object} The resolved config object (may be empty).
 */
const getConfig = () =>
  instance?.proxy?.config ||
  instance?.appContext?.config?.globalProperties?.config ||
  {};

const enabled = computed(() => Boolean(getConfig()?.legal?.cookieConsent?.enabled));
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
