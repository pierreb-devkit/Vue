<template>
  <v-app id="app" :theme="themeName">
    <v-snackbar
      v-if="config.vuetify.theme.snackbar.status"
      v-model="snackbar.status"
      location="top right"
      :timeout="snackbar.timeout"
      :color="snackbar.color"
    >
      {{ snackbar.text }}
      <template #actions>
        <v-btn icon @click="snackbar.status = false">
          <v-icon icon="fa-solid fa-circle-xmark"></v-icon>
        </v-btn>
      </template>
    </v-snackbar>
    <!-- billing.alerts.threshold80 / threshold100 toasts — emitted once per meter week cycle.
         Gated by `isLoggedIn && meterMode` so non-billing apps stay dormant. -->
    <v-snackbar
      v-if="isLoggedIn && meterMode"
      v-model="meterAlert.visible"
      location="top right"
      :timeout="6000"
      :color="meterAlert.color"
    >
      {{ meterAlert.text }}
      <template #actions>
        <v-btn icon @click="meterAlert.visible = false">
          <v-icon icon="fa-solid fa-circle-xmark" />
        </v-btn>
      </template>
    </v-snackbar>
    <devkitNav v-if="isLoggedIn && !$route.meta.marketing" />
    <devkitHeader v-if="config.header.display" />
    <authEmailBanner />
    <authPendingRequestBanner />

    <organizationsAdminPendingBanner />
    <organizationsLoginNotices />
    <legalCookieBanner />
    <legalFooterSection />
    <v-main class="pb-0" :style="mainStyle">
      <appErrorBoundary>
        <router-view />
      </appErrorBoundary>
    </v-main>
    <devkitFooter :links="config.footer.links" :variant="config.footer.variant || 'default'" />
  </v-app>
</template>

<script>
/**
 * Module dependencies.
 */
import { useHead } from '@unhead/vue';
import { useTheme } from 'vuetify';
import { useAuthStore } from '../auth/stores/auth.store';
import { useBillingStore } from '../billing/stores/billing.store';
import { setupInterceptors } from '../../lib/services/axios';
import devkitHeader from '../core/components/core.header.component.vue';
import devkitNav from '../core/components/core.navigation.component.vue';
import devkitFooter from '../core/components/core.footer.component.vue';
import authEmailBanner from '../auth/components/emailBanner.component.vue';
import authPendingRequestBanner from '../auth/components/pendingRequestBanner.component.vue';

import organizationsAdminPendingBanner from '../organizations/components/organizations.adminPendingBanner.component.vue';
import organizationsLoginNotices from '../organizations/components/organizations.loginNotices.component.vue';
import legalCookieBanner from '../legal/components/legal.cookieBanner.component.vue';
import legalFooterSection from '../legal/components/legal.footerSection.component.vue';
import appErrorBoundary from './components/app.errorBoundary.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'App',
  components: {
    devkitHeader,
    devkitNav,
    devkitFooter,
    authEmailBanner,
    authPendingRequestBanner,

    organizationsAdminPendingBanner,
    organizationsLoginNotices,
    legalCookieBanner,
    legalFooterSection,
    appErrorBoundary,
  },
  /**
   * @desc Initialise Pinia stores once so computed properties reference them
   * via `this.authStore` / `this.billingStore` instead of calling the store
   * factory on every evaluation.
   * @returns {{ authStore: Object, billingStore: Object }}
   */
  setup() {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    return { authStore, billingStore };
  },
  data() {
    const theme = useTheme();
    return {
      theme,
      snackbar: {
        status: false,
        color: 'error',
        timeout: 4000,
        text: 'toto',
      },
      /**
       * @desc In-app compute threshold toast state.
       * Deduped per meter week cycle via `meterAlertedKeys`.
       */
      meterAlert: {
        visible: false,
        color: 'warning',
        text: '',
      },
      /**
       * @desc Tracks which `${orgId}:${weekKey}:${level}` tuple has already been alerted.
       * Deduplication guard so the same threshold is only toasted once per billing week
       * per organization. Including the org ID prevents cross-org suppression when
       * the user switches organizations within the same billing week.
       * Format: `"{orgId}:{weekKey}:{level}"` — e.g. `"org_abc:2026-W18:80"`.
       * @type {Set<string>}
       */
      meterAlertedKeys: new Set(),
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
    isLoggedIn() {
      return this.authStore.isLoggedIn;
    },
    /**
     * @desc Whether compute meter mode is active for this session.
     * Gate: `serverConfig.billing.meterMode === true`. Defaults to `false` so
     * non-billing apps stay dormant.
     * @returns {boolean}
     */
    meterMode() {
      return this.authStore.serverConfig?.billing?.meterMode === true;
    },
    /**
     * @desc Reactive meter progress percentage (0–100) for threshold watches.
     * Derived from billingStore.usageMeter, returns 0 when no data.
     * @returns {number}
     */
    meterProgress() {
      const meter = this.billingStore.usageMeter;
      if (!meter || !meter.meterQuota) return 0;
      return Math.max(0, Math.min(100, Math.round((meter.meterUsed / meter.meterQuota) * 100)));
    },
    /**
     * @desc Current meter week key — used to namespace dedup guards so alerts
     * reset automatically each new billing week.
     * @returns {string|null}
     */
    meterWeekKey() {
      return this.billingStore.usageMeter?.weekKey ?? null;
    },
    /**
     * @desc Active organization ID — included in the meter alert dedupe key so
     * switching organizations within the same billing week does not suppress
     * alerts for the newly selected org.
     * @returns {string}
     */
    activeOrgId() {
      const org = this.authStore.user?.currentOrganization;
      return (org?._id || org?.id || org) ?? 'global';
    },
    /**
     * @desc Main content styles — removes left padding when nav is in glass (overlay) mode.
     * @returns {Object} CSS style object
     */
    mainStyle() {
      const base = { background: this.theme.current.colors.background };
      if (this.config.vuetify.theme.navigation.glass && this.isLoggedIn && this.$route.path === '/') {
        base['padding-left'] = '0px';
      }
      return base;
    },
  },
  watch: {
    /**
     * @desc Fire a warning toast once per week cycle when meter crosses 80 % / 100 %.
     * Uses `meterAlertedKeys` set to dedup — key format: `"{weekKey}:{level}"`.
     * Gated on `meterMode && isLoggedIn` so non-billing apps stay dormant.
     * @param {number} newVal - Updated progress percentage
     */
    meterProgress(newVal) {
      if (!this.meterMode || !this.isLoggedIn) return;
      const orgId = this.activeOrgId;
      const weekKey = this.meterWeekKey ?? 'unknown';
      if (newVal >= 100) {
        const key = `${orgId}:${weekKey}:100`;
        if (!this.meterAlertedKeys.has(key)) {
          this.meterAlertedKeys.add(key);
          this.meterAlert = {
            visible: true,
            color: 'error',
            text: 'Quota reached — extras consumed',
          };
          // Also suppress the 80 dedup so it doesn't fire afterwards
          this.meterAlertedKeys.add(`${orgId}:${weekKey}:80`);
        }
      } else if (newVal >= 80) {
        const key = `${orgId}:${weekKey}:80`;
        if (!this.meterAlertedKeys.has(key)) {
          this.meterAlertedKeys.add(key);
          this.meterAlert = {
            visible: true,
            color: 'warning',
            text: "You've used 80% of your weekly quota",
          };
        }
      }
    },
  },
  created() {
    const { app } = this.config;
    const seo = app.seo || {};
    const og = seo.og || {};

    const meta = [
      ...(app.description ? [{ name: 'description', content: app.description }] : []),
      ...(app.keywords ? [{ name: 'keywords', content: app.keywords }] : []),
      ...(app.author ? [{ name: 'author', content: app.author }] : []),
      // Open Graph
      { property: 'og:type', content: og.type || 'website' },
      ...(app.title ? [{ property: 'og:title', content: app.title }] : []),
      ...(app.description ? [{ property: 'og:description', content: app.description }] : []),
      ...(app.url ? [{ property: 'og:url', content: app.url }] : []),
      ...(og.image ? [{ property: 'og:image', content: og.image }] : []),
      // Twitter Card
      { name: 'twitter:card', content: og.twitterCard || 'summary' },
      ...(app.title ? [{ name: 'twitter:title', content: app.title }] : []),
      ...(app.description ? [{ name: 'twitter:description', content: app.description }] : []),
      ...(og.twitterSite ? [{ name: 'twitter:site', content: og.twitterSite }] : []),
      ...(og.image ? [{ name: 'twitter:image', content: og.image }] : []),
    ];

    const link = app.url ? [{ rel: 'canonical', href: app.url }] : [];

    // JSON-LD structured data is handled at build time by seo-inject when
    // schema.enabled is true, so the runtime useHead call must not inject a
    // second block.  See #3677.

    useHead({
      title: app.title,
      htmlAttrs: { lang: app.lang || 'en' },
      meta,
      link,
    });

    // Configure axios interceptors
    const authStore = useAuthStore();
    // Pass `true` to signout() so the 401 side-effect path suppresses the success
    // snackbar; explicit user logouts (nav / profile / org) call signout() with no
    // arg and keep the "success: Signed out" toast (#4305).
    setupInterceptors(this.config, this.snackbar, () => authStore.signout(true), () => authStore.refreshAbilities(), () => authStore.isLoggedIn);
  },
};
</script>

<style>
.v-application header a {
  text-decoration: none !important;
  color: rgba(var(--v-theme-onPrimary), 1) !important;
}
.v-application nav a {
  text-decoration: none !important;
  color: inherit !important;
}
.v-application main a:not(.v-btn) {
  text-decoration: none !important;
  font-weight: 400;
  color: rgba(var(--v-theme-secondary), 1) !important;
}
.v-card {
  border: none !important;
}

.v-application .text-label-medium,
.v-application .text-label-small,
.v-application .text-body-medium,
.v-application .text-body-large,
.v-application .text-title-medium,
.v-application .text-title-large,
.v-application .text-headline-small,
.v-application .text-headline-medium,
.v-application .text-headline-large,
.v-application .text-display-small,
.v-application .text-display-medium,
.v-application .text-display-large {
  font-family: 'SF Pro Display', 'SF Pro Icons', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
}
</style>
