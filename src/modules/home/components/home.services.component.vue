<!--
  HomeResourcesComponent
  ======================
  Grid of icon cards with title and description. Good for features or resources.

  USAGE:
  <homeResourcesComponent :setup="config.home.ressources" />

  CONFIG EXAMPLE (setup object):
  ressources: {
    title: 'Resources',
    cols: 3, // optional — 2, 3, 4, or 6 (must divide 12 evenly)
    style: {
      section: { background: 'background' },
      card: { background: 'surface' },
    },
    content: [
      {
        icon: 'fa-solid fa-book',
        color: '#16a085',
        subtitle: 'Documentation',
        text: 'Description with **markdown** and [links](https://example.com).',
      },
      {
        icon: 'fa-solid fa-code',
        color: '#2980b9',
        subtitle: 'API Reference',
        text: 'Full API documentation available.',
      },
    ],
  }
-->
<template>
  <section id="services" :style="styles.section">
    <v-container :max-width="config.vuetify.theme.maxWidth" :style="styles.container">
      <v-row class="px-0 py-8">
        <v-col cols="12">
          <homeContentComponent :setup="setup"></homeContentComponent>
        </v-col>
        <v-col v-for="(item, i) in setup.content" :key="i" cols="12" sm="12" :md="colSize" data-aos="fade">
          <v-card class="py-6 px-2" :style="styles.card">
            <v-btn icon :color="item.color ? item.color : 'primary'" width="50" height="50" class="text-white ml-3 mb-4">
              <v-icon :icon="item.serviceIcon" size="x-medium"></v-icon>
            </v-btn>
            <homeContentComponent :setup="item" variant="card"></homeContentComponent>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { sectionStyles } from '../../../lib/helpers/theme';
import homeContentComponent from './utils/home.content.component.vue';
/**
 * Component definition.
 */
export default {
  name: 'HomeServicesComponent',
  components: {
    homeContentComponent,
  },
  props: {
    setup: {
      type: Object,
      required: true,
    },
  },
  computed: {
    /**
     * Inline styles of the section, its container and its cards (theme helper).
     * @returns {{ section: Object, container: Object, card: Object, background: String }}
     */
    styles() {
      return sectionStyles(this.setup, this.$vuetify?.display);
    },
    colSize() {
      const cols = [2, 3, 4, 6].includes(this.setup.cols) ? this.setup.cols : 3;
      return 12 / cols;
    },
    variant() {
      return this.setup.variant || 'default';
    },
  },
};
</script>
