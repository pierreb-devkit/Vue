<template>
  <v-navigation-drawer
    v-if="isLoggedIn"
    v-model="drawer"
    :floating="config.vuetify.theme.navigation.drawer.floating"
    :permanent="config.vuetify.theme.navigation.drawer.type === 'permanent' || isLoggedIn ? true : false"
    :temporary="config.vuetify.theme.navigation.drawer.type === 'temporary' ? true : false"
    :style="{ background: config.vuetify.theme.themes[theme].colors.primary }"
    :expand-on-hover="config.vuetify.theme.navigation.drawer.expand"
    :rail="config.vuetify.theme.navigation.drawer.rail"
  >
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
            :icon="config.app.icon"
            size="large"
          ></v-icon>
        </template>
        <v-list-item-title>{{ config.app.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
    <v-divider :color="config.vuetify.theme.themes[theme].colors.onPrimary" :thickness="3"></v-divider>
    <v-list
      :style="{ background: config.vuetify.theme.themes[theme].colors.primary, color: config.vuetify.theme.themes[theme].colors.onPrimary }"
      nav
    >
      <v-list-item
        v-for="item in nav"
        :key="item.text"
        :to="item.path"
        :style="
          config.vuetify.theme.navigation.selectBorder && testRoute(item.path, $route.path)
            ? `border-left: 3px solid ${
                (item.meta.color && item.meta.color.border) || config.vuetify.theme.themes[theme].colors[config.vuetify.theme.navigation.selectBorder]
              };`
            : 'border-left: 3 px solid transparent;'
        "
      >
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
    <!-- Login buttons -->
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
  name: 'waosNav',
  computed: {
    ...mapGetters(['theme', 'nav', 'isLoggedIn']),
    drawer: {
      get() {
        return this.isLoggedIn ? true : this.$store.getters.drawer;
      },
      set(v) {
        return this.$store.commit('set_drawer', v);
      },
    },
  },
  methods: {
    testRoute(path, route) {
      return route.split('/').includes(path.substr(1));
    },
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
