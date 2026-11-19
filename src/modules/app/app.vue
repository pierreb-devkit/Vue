<template>
  <v-app id="app">
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
    <!-- Shell parts of the optional modules, registered by each module's
         `<module>.app.js` entry only while the module is active. -->
    <component :is="extra.component" v-for="extra in beforeNavExtras" :key="extra._id" />
    <devkitNav v-if="isLoggedIn && !$route.meta.marketing" />
    <devkitHeader v-if="config.header.display" />
    <authEmailBanner />
    <authPendingRequestBanner />

    <component :is="extra.component" v-for="extra in afterBannerExtras" :key="extra._id" />
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
import { buildCanonicalUrl } from '@/lib/helpers/canonical.js';
import { useAuthStore } from '../auth/stores/auth.store';
import { useCoreStore } from '../core/stores/core.store';
import { setupInterceptors } from '../../lib/services/axios';
import devkitHeader from '../core/components/core.header.component.vue';
import devkitNav from '../core/components/core.navigation.component.vue';
import devkitFooter from '../core/components/core.footer.component.vue';
import authEmailBanner from '../auth/components/emailBanner.component.vue';
import authPendingRequestBanner from '../auth/components/pendingRequestBanner.component.vue';
import { useShellExtras } from '../../lib/composables/useShellExtras';
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

    appErrorBoundary,
  },
  /**
   * @desc Initialise Pinia stores once so computed properties reference them
   * via `this.authStore` / `this.coreStore` instead of calling the store
   * factory on every evaluation, and expose the shell-extras registry.
   * @returns {{ authStore: Object, coreStore: Object, shellExtras: import('vue').Ref<Array<object>> }}
   */
  setup() {
    const authStore = useAuthStore();
    const coreStore = useCoreStore();
    const { extras: shellExtras } = useShellExtras();
    return { authStore, coreStore, shellExtras };
  },
  data() {
    const theme = useTheme();
    return {
      theme,
      snackbar: {
        status: false,
        color: 'error',
        timeout: 4000,
        text: '',
      },
    };
  },
  computed: {
    isLoggedIn() {
      return this.authStore.isLoggedIn;
    },
    /**
     * @desc Optional-module shell parts mounted before the navigation drawer.
     * @returns {Array<object>}
     */
    beforeNavExtras() {
      return this.shellExtras.filter((e) => e.placement === 'beforeNav');
    },
    /**
     * @desc Optional-module shell parts mounted after the auth banners.
     * @returns {Array<object>}
     */
    afterBannerExtras() {
      return this.shellExtras.filter((e) => e.placement !== 'beforeNav');
    },
    /**
     * @desc Main content styles — removes left padding when nav is in glass (overlay) mode.
     * Only once the route is resolved: the router's start location also reads `path: '/'`
     * (with no matched record), so a deep link would load unpadded, under the drawer (#4787).
     * @returns {Object} CSS style object
     */
    mainStyle() {
      const base = { background: this.theme.current.colors.background };
      const isHome = this.$route.path === '/' && this.$route.matched.length > 0;
      if (this.config.vuetify.theme.navigation.glass && this.isLoggedIn && isHome) {
        base['padding-left'] = '0px';
      }
      return base;
    },
  },
  watch: {
    /**
     * @desc Push the Pinia-computed theme (config `vuetify.theme.dark` value,
     * re-derived on OS `prefers-color-scheme` change via `coreStore.syncOsTheme()`
     * — see `main.js`) into Vuetify's global theme instance. `coreStore.theme`
     * is the single source of truth; Vuetify itself has no independent notion
     * of "current theme" beyond what this sets. `immediate: true` applies it
     * on initial mount (covers hydration + prerender correction); the watch
     * covers subsequent OS preference changes. Uses `theme.change()` (the
     * sanctioned Vuetify 4 API) rather than assigning `theme.global.name.value`
     * directly — the latter trips a deprecation warning via Vuetify's Proxy
     * set trap on 4.1.5+.
     * @param {String} v - 'light' or 'dark'
     * @returns {void}
     */
    'coreStore.theme': {
      immediate: true,
      handler(v) {
        this.theme.change(v);
      },
    },
  },
  /**
   * @desc Initialize SEO metadata and wire global axios interceptors.
   * @returns {void}
   */
  created() {
    const { app } = this.config;
    const seo = app.seo || {};
    const og = seo.og || {};

    // Route-invariant meta — built once; og:url and canonical are appended
    // per-route inside the useHead getter below.
    const baseMeta = [
      ...(app.description ? [{ name: 'description', content: app.description }] : []),
      ...(app.keywords ? [{ name: 'keywords', content: app.keywords }] : []),
      ...(app.author ? [{ name: 'author', content: app.author }] : []),
      // Open Graph
      { property: 'og:type', content: og.type || 'website' },
      ...(app.title ? [{ property: 'og:title', content: app.title }] : []),
      ...(app.description ? [{ property: 'og:description', content: app.description }] : []),
      ...(og.image ? [{ property: 'og:image', content: og.image }] : []),
      // Twitter Card
      { name: 'twitter:card', content: og.twitterCard || 'summary' },
      ...(app.title ? [{ name: 'twitter:title', content: app.title }] : []),
      ...(app.description ? [{ name: 'twitter:description', content: app.description }] : []),
      ...(og.twitterSite ? [{ name: 'twitter:site', content: og.twitterSite }] : []),
      ...(og.image ? [{ name: 'twitter:image', content: og.image }] : []),
    ];

    // App font, from config: Vuetify reads --v-font-body / --v-font-heading in
    // html and in every text-* type class, so setting them once on <html>
    // styles the whole app (and lands in the prerendered HTML).
    const font = this.config.vuetify?.theme?.font || {};
    const fontStyle = [font.body && `--v-font-body: ${font.body}`, font.heading && `--v-font-heading: ${font.heading}`].filter(Boolean).join('; ');

    // JSON-LD structured data is handled at build time by seo-inject when
    // schema.enabled is true, so the runtime useHead call must not inject a
    // second block.  See #3677.

    // Whole-getter form: unhead resolves it inside a watchEffect (walkResolver),
    // so reading this.$route.path here makes canonical + og:url self-referential
    // and re-emit on every navigation — which is what the prerenderer captures
    // per route. Avoids two static canonicals (the homepage one removed from
    // seo-inject) which unhead would not dedupe.
    /**
     * @desc Build per-route head tags so canonical and og:url stay self-referential on every navigation.
     * Whole-getter form so unhead resolves it inside a watchEffect (walkResolver), re-emitting
     * on route change — which is what the prerenderer captures per route.
     * @returns {{title: string, htmlAttrs: {lang: string, style?: string}, meta: Array<object>, link: Array<object>}}
     */
    useHead(() => {
      const canonicalHref = app.url ? buildCanonicalUrl(app.url, this.$route?.path || '/') : '';
      return {
        title: app.title,
        htmlAttrs: { lang: app.lang || 'en', ...(fontStyle ? { style: fontStyle } : {}) },
        meta: [
          ...baseMeta,
          ...(canonicalHref ? [{ property: 'og:url', content: canonicalHref }] : []),
        ],
        link: canonicalHref ? [{ rel: 'canonical', href: canonicalHref }] : [],
      };
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
/* Bare links (an <a> with no class, or only the classes RouterLink adds) follow the theme instead of the browser
   blue. Limited to class-less anchors so Vuetify components (v-btn, v-card,
   v-list-item, v-chip) and any utility class are never touched, whatever the
   layer order of the bundle. */
@layer vuetify-core.base {
  a:is(:not([class]), [class=""], [class="router-link-active"], [class="router-link-active router-link-exact-active"]) {
    color: inherit;
    text-decoration: none;
  }

  main a:is(:not([class]), [class=""], [class="router-link-active"], [class="router-link-active router-link-exact-active"]) {
    color: rgb(var(--v-theme-secondary));
  }
}
</style>
