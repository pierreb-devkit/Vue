<template>
  <v-navigation-drawer
    v-model="drawer"
    :clipped="config.vuetify.drawer.clipped"
    :floating="config.vuetify.drawer.floating"
    :mini-variant="mini"
    :permanent="config.vuetify.drawer.type === 'permanent'"
    :temporary="config.vuetify.drawer.type === 'temporary'"
    :style="{ background: config.vuetify.theme.themes[theme].primary }"
    :src="config.vuetify.theme.navigation.background"
    app
  >
    <v-list dense>
      <!--<v-subheader class="mt-4 grey--text text--darken-1">Navigation</v-subheader>-->
      <v-list-item
        v-for="item in nav"
        :key="item.text"
        :to="item.path"
        :style="
          config.vuetify.theme.navigation.selectBorder && testRoute(item.path, $route.path)
            ? `border-left: 4px solid ${(item.meta.color && item.meta.color.border) ||
                config.vuetify.theme.themes[theme][config.vuetify.theme.navigation.selectBorder]};`
            : 'border-left: 4px solid transparent;'
        "
      >
        <v-list-item-action
          :style="
            config.vuetify.theme.navigation.selectBorder && testRoute(item.path, $route.path)
              ? 'margin-left: -4px;'
              : 'margin-left: -4px;'
          "
        >
          <v-tooltip right>
            <template v-slot:activator="{ on, attrs }">
              <v-icon
                v-bind="attrs"
                v-on="on"
                :style="{
                  color:
                    (item.meta.color && item.meta.color.icon) ||
                    config.vuetify.theme.themes[theme].onPrimary,
                }"
                >fa-{{ item.meta.icon }}</v-icon
              >
            </template>
            <span>{{ item.name }}</span>
          </v-tooltip>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title :style="{ color: config.vuetify.theme.themes[theme].onPrimary }">{{
            item.name
          }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <template v-slot:append v-if="!config.vuetify.theme.footer">
      <div class="pa-2 caption" :style="{ color: config.vuetify.theme.themes[theme].onPrimary }">
        <center>
          &copy;
          <a href="https://weareopensource.me">WAOS</a>
        </center>
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
    mini: {
      get() {
        return this.$store.getters.mini;
      },
      set(v) {
        return this.$store.commit('set_mini', v);
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
