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
    // Configure head/meta tags
    useHead({
      title: this.config.app.title,
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { name: 'description', content: this.config.app.description },
        { name: 'keywords', content: this.config.app.keywords },
        { name: 'author', content: this.config.app.author },
      ],
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
