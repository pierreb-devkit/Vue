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
    <devkitNav v-if="isLoggedIn" />
    <devkitHeader v-if="config.header.display" />
    <v-main class="pb-0" :style="{ background: theme.current.colors.background }">
      <router-view />
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
import { setupInterceptors } from '../../lib/services/axios';
import devkitHeader from '../core/components/core.header.component.vue';
import devkitNav from '../core/components/core.navigation.component.vue';
import devkitFooter from '../core/components/core.footer.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'App',
  components: {
    devkitHeader,
    devkitNav,
    devkitFooter,
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
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
    isLoggedIn() {
      const authStore = useAuthStore();
      return authStore.isLoggedIn;
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
    setupInterceptors(this.config, this.snackbar, () => authStore.signout(), () => authStore.refreshAbilities());
  },
};
</script>

<style>
.v-application header a,
.v-application nav a {
  text-decoration: none !important;
  color: rgba(var(--v-theme-onPrimary), 1) !important;
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
