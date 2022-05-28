<template>
  <v-navigation-drawer
    v-model="drawer"
    :floating="config.vuetify.theme.navigation.drawer.floating"
    :permanent="config.vuetify.theme.navigation.drawer.type === 'permanent'"
    :temporary="config.vuetify.theme.navigation.drawer.type === 'temporary'"
    :style="{ background: config.vuetify.theme.themes[theme].colors.primary }"
    :expand-on-hover="config.vuetify.theme.navigation.drawer.expand"
    :rail="config.vuetify.theme.navigation.drawer.rail"
  >
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
            ? `border-left: 4px solid ${
                (item.meta.color && item.meta.color.border) || config.vuetify.theme.themes[theme].colors[config.vuetify.theme.navigation.selectBorder]
              };`
            : 'border-left: 4px solid transparent;'
        "
      >
        <v-list-item-avatar left>
          <v-icon
            :icon="item.meta.icon"
            :style="{
              color: (item.meta.color && item.meta.color.icon) || config.vuetify.theme.themes[theme].colors.onPrimary,
            }"
          ></v-icon>
        </v-list-item-avatar>
        <v-list-item-title class="pl-2 pt-1" v-text="item.name"></v-list-item-title>
      </v-list-item>
    </v-list>
    <template v-slot:append v-if="!config.vuetify.theme.footer">
      <div class="pa-2 d-flex justify-center" :style="{ color: config.vuetify.theme.themes[theme].colors.onPrimary }">
        <span role="img" aria-label="copyright"> &copy; </span>
        <a href="https://weareopensource.me">WAOS</a>
      </div>
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
    ...mapGetters(['theme', 'nav']),
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
    testRoute(path, route) {
      return route.split('/').includes(path.substr(1));
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
