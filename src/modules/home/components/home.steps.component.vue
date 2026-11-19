<!--
  HomeTimelineComponent
  =====================
  Vertical timeline with icons, cards, and optional images.

  USAGE:
  <homeTimelineComponent :setup="config.home.install" />

  CONFIG EXAMPLE (setup object):
  install: {
    showStepLabel: true,             // Show opposite-side labels (default: false)
    style: {
      section: { background: 'surface' },
      card: { background: 'background' },
    },
    content: [
      {
        icon: 'fa-solid fa-download',
        color: '#1abc9c',            // Dot color
        iconColor: 'white',          // Icon color (default: white)
        title: 'Step 1',             // Opposite side title (visible when showStepLabel is true)
        subtitle: 'Installation',
        text: 'Description with **markdown** support.',
        img: '/images/step1.webp',   // Optional image
        reversed: false,             // Image position
      },
    ],
  }
-->
<template>
  <section id="steps" :style="styles.section">
    <v-container ref="timelineContainer" :max-width="config.vuetify.theme.maxWidth" :style="styles.container">
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
            <template v-if="setup.showStepLabel && item.title" #opposite>
              <h3 class="text-headline-small text-md-headline-medium text-secondary font-weight-bold" v-text="item.title"></h3>
            </template>
            <v-card class="my-8 pb-2" :style="styles.card">
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
import { sectionStyles } from '../../../lib/helpers/theme';
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
  computed: {
    /**
     * Inline styles of the section, its container and its cards (theme helper).
     * @returns {{ section: Object, container: Object, card: Object, background: String }}
     */
    styles() {
      return sectionStyles(this.setup, this.$vuetify?.display);
    },
    variant() {
      return this.setup.variant || 'default';
    },
  },
};
</script>
