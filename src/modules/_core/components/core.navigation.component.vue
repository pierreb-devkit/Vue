<template>
  <div v-if="isLoggedIn">
    <!-- Mobile drawer acces -->
    <v-btn
      :flat="config.vuetify.theme.flat"
      v-if="this.$vuetify.display.mobile"
      icon
      @click="drawer = !drawer"
      :style="{
        color: config.vuetify.theme.themes[theme].colors.onPrimary,
        background: `${config.vuetify.theme.themes[theme].colors.primary}${config.vuetify.theme.appbar.opacity}`,
        '-webkit-backdrop-filter': 'blur(8px)',
        'backdrop-filter': 'blur(8px)',
      }"
      style="position: fixed; top: 7px; left: 5px; z-index: 9999"
    >
      <v-icon icon="fa-solid fa-bars"></v-icon>
    </v-btn>
    <!-- Navigation drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :floating="config.vuetify.theme.navigation.drawer.floating"
      :style="{ background: config.vuetify.theme.themes[theme].colors.primary }"
      :expand-on-hover="this.$vuetify.display.mobile ? false : config.vuetify.theme.navigation.drawer.expand"
      :rail="config.vuetify.theme.navigation.drawer.rail"
    >
      <!-- Logo / drawer on mobile-->
      <v-list
        :style="{ background: config.vuetify.theme.themes[theme].colors.primary, color: config.vuetify.theme.themes[theme].colors.onPrimary }"
        nav
      >
        <v-list-item
          :style="{
            color: config.vuetify.theme.themes[theme].colors.onPrimary,
          }"
        >
          <template v-slot:prepend>
            <v-icon
              v-if="config.app.title"
              :style="{
                color: config.vuetify.theme.themes[theme].colors.onPrimary,
                opacity: 1,
              }"
              :icon="this.$vuetify.display.mobile ? 'nothing' : config.app.icon"
              size="large"
            ></v-icon>
          </template>
          <v-list-item-title>{{ config.app.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
      <v-divider :color="config.vuetify.theme.themes[theme].colors.onPrimary" :thickness="3"></v-divider>
      <!-- Navigation -->
      <v-list
        :style="{ background: config.vuetify.theme.themes[theme].colors.primary, color: config.vuetify.theme.themes[theme].colors.onPrimary }"
        nav
      >
        <v-list-item v-for="item in nav" :key="item.text" :to="item.path">
          <template v-slot:prepend>
            <v-icon
              :icon="item.meta.icon"
              :style="{
                color: (item.meta.color && item.meta.color.icon) || config.vuetify.theme.themes[theme].colors.onPrimary,
              }"
              size="small"
            ></v-icon>
          </template>
          <v-list-item-title>{{ item.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
      <!-- End -->
      <template v-slot:append v-if="!config.vuetify.theme.footer">
        <v-list>
          <v-list-item v-for="({ icon, label, url }, i) in config.header.socials" :key="i" :href="url">
            <template v-slot:prepend>
              <v-icon>{{ icon }}</v-icon>
            </template>
            <v-list-item-title>{{ label }}</v-list-item-title>
          </v-list-item>
        </v-list>
        <v-divider :color="config.vuetify.theme.themes[theme].colors.onPrimary" :thickness="3"></v-divider>
        <!-- User -->
        <v-list>
          <v-list-item
            @click="signout"
            :style="{
              color: config.vuetify.theme.themes[theme].colors.onPrimary,
            }"
          >
            <template v-slot:prepend>
              <v-icon
                :style="{
                  color: config.vuetify.theme.themes[theme].colors.onPrimary,
                }"
                icon="fa-solid fa-arrow-right"
                size="small"
              ></v-icon>
            </template>
            <v-list-item-title>Sign out</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>
  </div>
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
  name: 'waosNavigation',
  data() {
    return {
      drawer: true,
    };
  },
  computed: {
    ...mapGetters(['theme', 'nav', 'isLoggedIn']),
  },
  methods: {
    signout() {
      this.$store.dispatch('signout').then(() => {
        this.$store.dispatch('refreshNav');
        if (this.$route.path !== '/') this.$router.push('/');
      });
    },
  },
  created() {
    this.$store.dispatch('refreshNav');
  },
};
</script>

<style>
.selected {
  border-left: 4px solid red;
}
</style>
