<!--
  HomeResourcesComponent
  ======================
  Grid of icon cards with title and description. Good for features or resources.

  USAGE:
  <homeResourcesComponent :setup="config.home.ressources" />

  CONFIG EXAMPLE (setup object):
  ressources: {
    title: 'Resources',
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
  <section id="services" :style="sectionStyle">
    <v-container :style="`max-width: ${config.vuetify.theme.maxWidth}`">
      <v-row class="px-0 py-8">
        <v-col cols="12">
          <homeContentComponent :setup="setup"></homeContentComponent>
        </v-col>
        <v-col v-for="(item, i) in setup.content" :key="i" cols="12" sm="12" md="4" data-aos="fade">
          <v-card :class="`py-6 px-2 ${config.vuetify.theme.rounded}`" :flat="config.vuetify.theme.flat" :style="cardStyle">
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
import { useTheme } from 'vuetify';
import { style } from '../../../lib/helpers/theme';
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
  data() {
    const theme = useTheme();
    return {
      theme,
    };
  },
  computed: {
    variant() {
      return this.setup.variant || 'default';
    },
    sectionStyle() {
      const bgColor = this.variant === 'alternate' ? this.theme.current.colors.surface : this.theme.current.colors.background;
      return {
        ...style('section', this.setup),
        background: bgColor,
      };
    },
    cardStyle() {
      // Inverse la couleur de la card par rapport à la section
      const cardColor = this.variant === 'alternate' ? this.theme.current.colors.background : this.theme.current.colors.surface;
      return {
        ...style('card', this.setup),
        background: cardColor,
      };
    },
  },
  methods: {
    style,
  },
};
</script>
