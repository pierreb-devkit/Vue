<template>
  <section id="logos" :style="style('section', setup)">
    <v-container :style="`max-width: ${config.vuetify.theme.maxWidth}`">
      <v-row align="center" justify="center" class="px-0 py-8">
        <homeTitleComponent :setup="setup"></homeTitleComponent>
        <v-window v-if="setup.content.length > 0" class="w-100" show-arrows>
          <template #prev="{ props }">
            <v-btn color="primary" variant="flat" icon="fa-solid fa-chevron-left" size="small" @click="props.onClick"> </v-btn>
          </template>
          <template #next="{ props }">
            <v-btn color="primary" variant="flat" icon="fa-solid fa-chevron-right" size="small" @click="props.onClick"> </v-btn>
          </template>
          <v-window-item v-for="(item, i) in setup.content" :key="i">
            <v-row align="center" justify="center" class="text-center px-16">
              <v-col cols="12" md="2">
                <!-- eslint-disable-next-line -->
                <a v-if="item.link" :href="item.link">
                  <homeImgComponent v-if="item.img" :img="item.img" :height="setup.style.size"></homeImgComponent>
                </a>
              </v-col>
              <v-col cols="12" md="10">
                <homeContentsTextComponent class="pl-5 py-4" :item="item"></homeContentsTextComponent>
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </v-row>
    </v-container>
  </section>
</template>
<script>
/**
 * Module dependencies.
 */
import { style } from '../../../lib/helpers/theme';
import homeTitleComponent from './utils/home.title.component.vue';
import homeImgComponent from './utils/home.img.component.vue';
import homeContentsTextComponent from './utils/home.content.text.component.vue';
/**
 * Export default
 */
export default {
  name: 'HomeLogosComponent',
  components: {
    homeTitleComponent,
    homeContentsTextComponent,
    homeImgComponent,
  },
  props: {
    setup: {
      type: Object,
      required: true,
    },
  },
  methods: {
    style,
  },
};
</script>
