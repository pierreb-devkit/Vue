<template>
  <v-app id="app" :theme="themeName">
    <v-snackbar
      v-if="config.vuetify.theme.snackbar.status"
      v-model="snackbar.status"
      :top="true"
      :right="true"
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
    <waosNav v-if="isLoggedIn" />
    <waosHeader v-if="config.header.display" />
    <v-main class="pb-0" :style="{ background: theme.current.colors.background }">
      <router-view />
    </v-main>
    <waosFooter :links="config.footer.links" :variant="config.footer.variant || 'default'" />
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
import waosHeader from '../core/components/core.header.component.vue';
import waosNav from '../core/components/core.navigation.component.vue';
import waosFooter from '../core/components/core.footer.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'App',
  components: {
    waosHeader,
    waosNav,
    waosFooter,
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
    const schema = seo.schema || {};

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

    const script = schema.enabled && schema.name
      ? [{
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': schema.type || 'Person',
            name: schema.name,
            url: app.url || undefined,
            sameAs: schema.sameAs?.length ? schema.sameAs : undefined,
          }),
        }]
      : [];

    useHead({
      title: app.title,
      htmlAttrs: { lang: app.lang || 'en' },
      meta,
      link,
      script,
    });

    // Configure axios interceptors
    const authStore = useAuthStore();
    setupInterceptors(this.config, this.snackbar, () => authStore.signout());
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

.v-application .text-overline,
.v-application .text-caption,
.v-application .text-button,
.v-application .text-body-2,
.v-application .text-body-1,
.v-application .text-subtitle-2,
.v-application .text-subtitle-1,
.v-application .text-h6,
.v-application .text-h5,
.v-application .text-h4,
.v-application .text-h3,
.v-application .text-h2,
.v-application .text-h1 {
  font-family: 'SF Pro Display', 'SF Pro Icons', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
}
</style>
