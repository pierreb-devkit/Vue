<!--
  HomeTimelineComponent
  =====================
  Vertical timeline with icons, cards, and optional images.

  USAGE:
  <homeTimelineComponent :setup="config.home.install" />

  CONFIG EXAMPLE (setup object):
  install: {
    style: {
      section: { background: 'surface' },
      card: { background: 'background' },
    },
    content: [
      {
        icon: 'fa-solid fa-download',
        color: '#1abc9c',            // Dot color
        iconColor: 'white',          // Icon color (default: white)
        title: 'Step 1',             // Opposite side title
        subtitle: 'Installation',
        text: 'Description with **markdown** support.',
        img: '/images/step1.webp',   // Optional image
        reversed: false,             // Image position
      },
    ],
  }
-->
<template>
  <section id="steps" :style="sectionStyle">
    <v-container ref="timelineContainer" :style="containerStyle">
      <v-row align="center" justify="center" class="px-0 py-8">
        <v-col cols="12">
          <homeContentComponent :setup="setup"></homeContentComponent>
        </v-col>
        <v-timeline v-if="setup.content.length > 0" :density="$vuetify.display.smAndDown ? 'compact' : 'default'">
          <v-timeline-item
            v-for="(item, i) in setup.content"
            :key="i"
            :dot-color="item.stepColor"
            :icon-color="item.stepIconColor || 'white'"
            :icon="item.stepIcon"
            fill-dot
            size="x-large"
          >
            <template v-if="item.title" #opposite>
              <h5 class="text-h6 text-md-h5 text-secondary font-weight-bold" v-text="item.title"></h5>
            </template>
            <v-card :class="`${config.vuetify.theme.rounded} my-8 pb-2`" :flat="config.vuetify.theme.flat" :style="cardStyle">
              <homeImgComponent v-if="item.img && !item.reversed" :img="item.img"></homeImgComponent>
              <homeContentComponent :setup="item" variant="card" alignment="center"></homeContentComponent>
              <homeImgComponent v-if="item.img && item.reversed" :img="item.img"></homeImgComponent>
            </v-card>
          </v-timeline-item>
        </v-timeline>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { style, overlapStyle } from '../../../lib/helpers/theme';
import homeContentComponent from './utils/home.content.component.vue';
import homeImgComponent from './utils/home.img.component.vue';
/**
 * Component definition.
 */
export default {
  name: 'HomeStepsComponent',
  components: {
    homeContentComponent,
    homeImgComponent,
  },
  props: {
    setup: {
      type: Object,
      default: () => {},
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
    containerStyle() {
      return {
        'max-width': this.config.vuetify.theme.maxWidth,
        ...overlapStyle(this.setup.overlap, this.$vuetify?.display),
      };
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
