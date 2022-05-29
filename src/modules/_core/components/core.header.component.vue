<template>
  <v-app-bar
    :style="{
      background: config.vuetify.theme.themes[theme].colors.primary,
      color: config.vuetify.theme.themes[theme].colors.onPrimary,
    }"
    :flat="config.vuetify.theme.flat"
  >
    <!-- Navigation button -->
    <template v-slot:prepend v-if="!config.vuetify.theme.navigation.ifLogged">
      <!-- v-if="isLoggedIn" -->
      <v-app-bar-nav-icon
        :style="{ color: config.vuetify.theme.themes[theme].colors.onPrimary }"
        class="ml-0"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>
    </template>
    <!-- Title -->
    <v-app-bar-title>
      <router-link to="/">{{ config.app.title }}</router-link>
      <a v-for="({ label, url }, i) in config.header.links" :key="i" :href="url" class="ml-6">{{ label }}</a>
    </v-app-bar-title>
    <!-- Social buttons -->
    <v-btn v-for="({ icon, label, url }, i) in config.header.socials" :key="i" class="hidden-sm-and-down" icon>
      <v-tooltip :text="label" activator="parent" anchor="bottom" />
      <a :href="url">
        <v-icon :style="{ color: config.vuetify.theme.themes[theme].colors.onPrimary }">{{ icon }}</v-icon>
      </a>
    </v-btn>
    <!-- Mobile Menu -->
    <v-menu location="start">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" class="hidden-md-and-up" icon>
          <v-icon :style="{ color: config.vuetify.theme.themes[theme].colors.onPrimary }">fa-solid fa-ellipsis</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item v-for="({ icon, label, url }, i) in config.header.socials" :key="i" :href="url">
          <v-list-item-avatar left>
            <v-icon :icon="icon"></v-icon>
          </v-list-item-avatar>
          <v-list-item-title v-text="label"></v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <!-- Login buttons -->
    <v-btn v-if="!isLoggedIn && config.sign.in" icon>
      <v-tooltip text="Sign In" activator="parent" anchor="bottom" />
      <router-link to="/signin">
        <v-icon :style="{ color: config.vuetify.theme.themes[theme].colors.onPrimary }">fa-solid fa-user</v-icon>
      </router-link>
    </v-btn>
    <v-btn v-if="isLoggedIn" @click="signout" icon>
      <v-tooltip text="Sign Out" activator="parent" anchor="bottom" />
      <v-icon :style="{ color: config.vuetify.theme.themes[theme].colors.onPrimary }">fa-solid fa-arrow-right</v-icon>
    </v-btn>
  </v-app-bar>
</template>
<script>
/**
 * Module dependencies.
 */
import { mapGetters } from 'vuex';

/**
 * Export default
 */
export default {
  name: 'waosHeader',
  computed: {
    ...mapGetters(['theme', 'isLoggedIn']),
    drawer: {
      get() {
        return this.$store.getters.drawer;
      },
      set(v) {
        return this.$store.commit('set_drawer', v);
      },
    },
  },
  methods: {
    signout() {
      this.$store.dispatch('signout').then(() => {
        this.$store.dispatch('refreshNav');
        if (this.$route.path !== '/') this.$router.push('/');
      });
    },
  },
};
</script>
