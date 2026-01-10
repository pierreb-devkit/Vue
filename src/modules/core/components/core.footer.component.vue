<template>
  <v-footer v-if="enabled" class="footer pa-0 align-end" :style="{ background: config.vuetify.theme.themes[theme].colors.background }" app>
    <v-container v-if="links.length > 0" class="px-0 py-4" :style="custom && custom.section ? custom.section : null">
      <v-row align="center" justify="center">
        <v-col
          v-for="({ items, title }, i) in links.filter((section) => section.items)"
          :key="i"
          cols="12"
          :md="12 / links.filter((section) => section.items).length"
          class="text-center"
        >
          <v-card :flat="config.vuetify.theme.flat" :style="custom && custom.section ? custom.section : null">
            <v-card-title class="text-center text-subtitle-2 font-weight-bold text-medium-emphasis">{{ title }}</v-card-title>
            <v-list :style="custom && custom.section ? custom.section : null" density="compact">
              <v-list-item v-for="(item, idx) in items" :key="idx" class="justify-center" @click="navigate(item.url)">
                <v-list-item-title>
                  <v-icon size="14" class="mr-2 text-onSurface text-medium-emphasis">{{ item.icon }}</v-icon>
                  <span class="text-secondary text-center text-caption"> {{ item.label }} </span>
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
import { useCoreStore } from '../stores/core.store';
/**
 * Component definition.
 */
export default {
  name: 'WaosFooter',
  props: {
    links: {
      type: Array,
      default: () => [],
    },
    custom: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      enabled: false,
    };
  },
  computed: {
    theme() {
      const coreStore = useCoreStore();
      return coreStore.theme;
    },
  },
  watch: {
    $route(route) {
      if (route.meta && route.meta.footer) this.enabled = true;
      else this.enabled = false;
    },
  },
  methods: {
    navigate(link) {
      if (link.startsWith('http')) {
        window.open(link, '_blank');
      } else {
        this.$router.push(link);
      }
    },
  },
};
</script>

<style>
.footer {
  position: relative !important;
}
</style>
