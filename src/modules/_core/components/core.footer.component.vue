<template>
  <v-footer v-if="enabled" class="footer pa-0 align-end" :style="{ background: config.vuetify.theme.themes[theme].colors.background }" app>
    <v-container class="pa-6" :style="custom && custom.section ? custom.section : null" v-if="links.length > 0">
      <v-row>
        <v-col
          v-for="({ items, title }, i) in links.filter((section) => section.items)"
          :key="i"
          cols="12"
          :md="12 / links.filter((section) => section.items).length"
        >
          <v-card :flat="config.vuetify.theme.flat" :style="custom && custom.section ? custom.section : null">
            <v-card-title class="text-center text-h6 text-medium-emphasis">{{ title }}</v-card-title>
            <v-list :style="custom && custom.section ? custom.section : null">
              <v-list-item v-for="(item, i) in items" :key="i" :to="item.url" class="justify-center">
                <v-list-item-title>
                  <v-icon size="16" class="mr-2 text-onSurface text-medium-emphasis">{{ item.icon }}</v-icon>
                  <span class="text-secondary text-subtitle-2"> {{ item.label }} </span>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
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
  name: 'waosFooter',
  data() {
    return {
      enabled: false,
    };
  },
  props: ['links', 'custom'],

  computed: {
    ...mapGetters(['theme']),
  },
  watch: {
    $route(route) {
      if (route.meta && route.meta.footer) this.enabled = true;
      else this.enabled = false;
    },
  },
};
</script>

<style>
.footer {
  position: relative !important;
}
</style>
