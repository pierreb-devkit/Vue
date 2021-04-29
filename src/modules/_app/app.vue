<template>
  <v-app id="app">
    <v-snackbar
      v-if="config.vuetify.theme.snackbar.status"
      v-model="snackbar.status"
      :top="true"
      :right="true"
      :timeout="snackbar.timeout"
      :color="snackbar.color"
    >
      {{ snackbar.text }}
      <v-btn dark text @click="snackbar.status = false">
        <v-icon>fa-times</v-icon>
      </v-btn>
    </v-snackbar>

    <waosHeader />

    <waosNav v-if="!config.vuetify.theme.navigation.displayIfLogged || isLoggedIn" />

    <v-main :style="{ background: config.vuetify.theme.themes[theme].background }">
      <router-view />
    </v-main>

    <waosFooter v-if="config.vuetify.theme.footer" />
  </v-app>
</template>

<script>
/**
 * Module dependencies.
 */
import { mapGetters } from 'vuex';
import waosHeader from '@/modules/_core/components/core.header.component.vue';
import waosNav from '@/modules/_core/components/core.nav.component.vue';
import waosFooter from '@/modules/_core/components/core.footer.component.vue';
import router from '@/modules/_app/app.router';
import theme from '@/lib/helpers/theme';

/**
 * Export default
 */
export default {
  name: 'App',
  metaInfo() {
    return {
      title: this.config.app.title,
      titleTemplate: `%s | ${this.$route.params.name || this.$route.name}`,
      meta: [
        { name: 'description', content: this.config.app.description },
        { name: 'keywords', content: this.config.app.keywords },
        { name: 'author', content: this.config.app.author },
      ],
    };
  },
  data() {
    return {
      snackbar: {
        status: false,
        color: 'error',
        timeout: 4000,
        text: 'toto',
      },
    };
  },
  components: {
    waosHeader,
    waosNav,
    waosFooter,
  },
  computed: {
    ...mapGetters(['isLoggedIn', 'theme']),
  },
  created() {
    // auth
    this.axios.interceptors.response.use(
      (response) => {
        if (
          this.config.vuetify.theme.snackbar.status &&
          response.config &&
          this.config.vuetify.theme.snackbar.methods.indexOf(response.config.method) > -1
        ) {
          this.snackbar.text = `${response.data.type}: ${response.data.message}`;
          this.snackbar.color = this.config.vuetify.theme.snackbar.sucessColor;
          this.snackbar.status = true;
        }
        return response;
      },
      (err) =>
        new Promise(() => {
          if (err && err.response && err.response.status === 401 && err.config && !err.config.__isRetryRequest) {
            this.$store.dispatch('signout');
            this.snackbar.text = 'Signin failed';
            this.snackbar.color = this.config.vuetify.theme.snackbar.errorColor;
            this.snackbar.status = true;
            router.push('/signin');
          }
          if (this.config.vuetify.theme.snackbar.status && err.response && err.response.data && err.response.data.description) {
            this.snackbar.text = err.response.data.description;
            this.snackbar.color = this.config.vuetify.theme.snackbar.errorColor;
            this.snackbar.status = true;
          }
          throw err;
        }),
    );
    // set base theme
    this.$vuetify.theme.dark = theme.isDark(this.config.vuetify.theme.dark);
  },
};
</script>

<style>
.v-application header a,
.v-application nav a {
  text-decoration: none !important;
  color: var(--v-onPrimary-base) !important;
}
.v-application main a {
  text-decoration: none !important;
  font-weight: 400;
  color: var(--v-secondary-base) !important;
}
.v-card {
  border: none !important;
}
</style>
